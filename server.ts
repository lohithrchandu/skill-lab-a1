import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { parseAgentResponse } from './src/utils/parser';

dotenv.config();

// 1. MODEL: Constant at top of server.ts for easy configuration
export const MODEL_NAME = 'gemini-3.5-flash-lite';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// 6. CACHE: Simple in-memory cache keyed by paper URL or arXiv ID
interface CacheEntry {
  url: string;
  paperTitle: string | null;
  parsed: any;
  cachedAt: number;
}
const analysisCache = new Map<string, CacheEntry>();

// Initialize GoogleGenAI client on the server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_PROMPT = `You are an advanced Computer Science Research Agent specializing in
parsing academic papers, extracting system architectures, and
identifying student development opportunities.

CONSTRAINTS
- Prioritize token efficiency; keep total analysis well under
  25,000 tokens.
- If a paper is too long to ingest, use web search to find its
  abstract, summaries, and open-source implementations (e.g., GitHub).

REASONING (chain of thought: do this step by step before answering)
1. Identify the problem the paper solves.
2. Identify the main method and what is new about it.
3. List the system's components, inputs, layers, and outputs.
4. Only then write the final answer.

OUTPUT FORMAT, when given a paper URL:
1. CORE CONCEPT: under 300 words, plain language (problem, method,
   key breakthrough).
2. FLOWCHART: a syntactically correct Mermaid graph TD, labeled
   [FLOWCHART]. Use quoted labels like A["Input Tokens"] --> B["Embedding"].
3. INTERNSHIP IDEAS: 3 realistic extensions for a 3rd-year CS student.
   For each: the exact extension, the target metric, the tech stack.

EXAMPLE (few-shot)
Input: https://arxiv.org/abs/1706.03762
1. CORE CONCEPT: Earlier translation models read text one word at a
   time, which was slow. This paper introduces the Transformer, which
   uses attention to look at all words at once, so training is much
   faster and parallel.
2. [FLOWCHART]
graph TD
  A["Input Tokens"] --> B["Embeddings + Positions"]
  B --> C["Encoder: Self-Attention + Feed-Forward"]
  C --> D["Decoder: Attention over Encoder Output"]
  D --> E["Output Probabilities"]
3. INTERNSHIP IDEAS:
   - Extension: replace full attention with a sparse variant.
     Metric: memory use vs. accuracy. Stack: PyTorch.
   - Extension: quantize the model to 8-bit for edge devices.
     Metric: latency reduction. Stack: ONNX Runtime.
   - Extension: add LoRA adapters for a niche domain.
     Metric: trainable parameters vs. accuracy. Stack: PEFT.`;

// Helper to fetch arXiv paper metadata if available
async function fetchArxivMetadata(url: string) {
  try {
    const arxivMatch = url.match(/(?:arxiv\.org\/(?:abs|pdf)\/|arxiv:)([0-9]+\.[0-9]+(?:v[0-9]+)?)/i);
    if (!arxivMatch) return null;

    const arxivId = arxivMatch[1];
    const apiUrl = `https://export.arxiv.org/api/query?id_list=${arxivId}`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;

    const text = await res.text();
    const titleMatch = text.match(/<title>([\s\S]*?)<\/title>/gi);
    const paperTitle = titleMatch && titleMatch.length > 1
      ? titleMatch[1].replace(/<\/?title>/gi, '').trim().replace(/\s+/g, ' ')
      : null;

    const summaryMatch = text.match(/<summary>([\s\S]*?)<\/summary>/i);
    const summary = summaryMatch ? summaryMatch[1].replace(/<\/?summary>/gi, '').trim().replace(/\s+/g, ' ') : null;

    return {
      arxivId,
      title: paperTitle,
      summary,
    };
  } catch (err) {
    console.warn('Could not fetch arXiv metadata:', err);
    return null;
  }
}

// 3. RETRY WITH BACKOFF: Exponential backoff for 429 and 503 errors (2s, 4s, 8s)
async function callGeminiWithBackoff(prompt: string, maxRetries = 3) {
  const delays = [2000, 4000, 8000];
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 2. SEARCH TOOL REMOVED: Rely on paper abstract and text
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const isQuotaOrServer =
        err?.status === 429 ||
        err?.status === 503 ||
        (typeof err?.message === 'string' &&
          (err.message.includes('429') ||
            err.message.includes('503') ||
            err.message.includes('RESOURCE_EXHAUSTED') ||
            err.message.includes('quota') ||
            err.message.includes('rate limit')));

      if (isQuotaOrServer && attempt < maxRetries) {
        const waitMs = delays[attempt] || 8000;
        console.warn(`[Gemini API] Quota limit hit (${err?.status || err?.message}). Retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

// Core analysis handler function
async function handlePaperAnalysis(req: express.Request, res: express.Response) {
  const { url } = req.body;

  if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
    return res.status(400).json({ error: 'Please provide a valid paper URL starting with http:// or https://' });
  }

  const paperUrl = url.trim();

  // Extract arXiv ID if present for canonical cache key
  const arxivMatch = paperUrl.match(/(?:arxiv\.org\/(?:abs|pdf)\/|arxiv:)([0-9]+\.[0-9]+(?:v[0-9]+)?)/i);
  const canonicalKey = (arxivMatch ? `arxiv:${arxivMatch[1]}` : paperUrl).toLowerCase();

  // 6. CACHE: Check if this paper was already analyzed
  if (analysisCache.has(canonicalKey)) {
    const cached = analysisCache.get(canonicalKey)!;
    console.log(`[Cache Hit] Serving cached analysis for ${paperUrl}`);
    return res.json({
      success: true,
      url: paperUrl,
      paperTitle: cached.paperTitle,
      parsed: cached.parsed,
      cached: true,
    });
  }

  try {
    // Fetch arXiv metadata if it's an arXiv link
    const arxivMeta = await fetchArxivMetadata(paperUrl);

    let userPrompt = `Input: ${paperUrl}`;
    if (arxivMeta) {
      userPrompt += `\n\nPaper Title: ${arxivMeta.title || ''}\nPaper Abstract:\n${arxivMeta.summary || ''}`;
    }

    // Call Gemini with retry backoff and Flash-Lite model (No Search Tool)
    const response = await callGeminiWithBackoff(userPrompt);

    const responseText = response.text || '';
    if (!responseText.trim()) {
      return res.status(502).json({ error: 'Received empty response from Gemini model.' });
    }

    // Parse the output
    const parsed = parseAgentResponse(responseText);

    const result = {
      url: paperUrl,
      paperTitle: arxivMeta?.title || null,
      parsed,
      cachedAt: Date.now(),
    };

    // Store in cache
    analysisCache.set(canonicalKey, result);

    return res.json({
      success: true,
      url: paperUrl,
      paperTitle: result.paperTitle,
      parsed: result.parsed,
      cached: false,
    });
  } catch (error: any) {
    console.error('Error analyzing paper:', error);

    // 4. FRIENDLY ERROR: Clear message on quota exhaustion instead of raw JSON
    const isQuotaError =
      error?.status === 429 ||
      (typeof error?.message === 'string' &&
        (error.message.includes('429') ||
          error.message.includes('RESOURCE_EXHAUSTED') ||
          error.message.includes('quota')));

    if (isQuotaError) {
      return res.status(429).json({
        error: 'The free API quota is used up. Please wait a minute and try again.',
      });
    }

    const errorMessage = error?.message || 'Failed to analyze paper. Please check the URL and try again.';
    return res.status(500).json({ error: errorMessage });
  }
}

// Endpoints: support both /api/analyze and /api/analyze-paper
app.post('/api/analyze', handlePaperAnalysis);
app.post('/api/analyze-paper', handlePaperAnalysis);

// Setup Vite dev server or static serve
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} [Model: ${MODEL_NAME}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
