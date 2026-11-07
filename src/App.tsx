import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PaperInput } from './components/PaperInput';
import { CoreConceptCard } from './components/CoreConceptCard';
import { MermaidDiagram } from './components/MermaidDiagram';
import { InternshipIdeasCard } from './components/InternshipIdeasCard';
import { PaperAnalysisResult } from './types';
import { parseAgentResponse } from './utils/parser';
import {
  ExternalLink,
  History,
  FileDown,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Code,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

// Default few-shot example from the prompt to provide instant demonstration
const DEFAULT_TRANSFORMER_EXAMPLE = `1. CORE CONCEPT: Earlier translation models read text one word at a time, which was slow. This paper introduces the Transformer, which uses attention to look at all words at once, so training is much faster and parallel.
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

export default function App() {
  const [url, setUrl] = useState<string>('https://arxiv.org/abs/1706.03762');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<PaperAnalysisResult | null>(null);
  const [showRawOutput, setShowRawOutput] = useState<boolean>(false);
  const [history, setHistory] = useState<PaperAnalysisResult[]>([]);

  // 5. NO DOUBLE CLICKS: 10 second cooldown timer after each request
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Initialize with the sample Transformer analysis on first load
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('paper_history');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          setHistory(parsedHistory);
          setCurrentAnalysis(parsedHistory[0]);
          setUrl(parsedHistory[0].url);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not read history from localStorage', e);
    }

    // Default initial demonstration
    const initialParsed = parseAgentResponse(DEFAULT_TRANSFORMER_EXAMPLE);
    const initialAnalysis: PaperAnalysisResult = {
      id: 'transformer-default',
      url: 'https://arxiv.org/abs/1706.03762',
      paperTitle: 'Attention Is All You Need (Transformer)',
      parsed: initialParsed,
      timestamp: Date.now(),
      cached: true,
    };
    setCurrentAnalysis(initialAnalysis);
  }, []);

  const saveToHistory = (item: PaperAnalysisResult) => {
    setHistory((prev) => {
      const filtered = prev.filter((p) => p.url !== item.url);
      const updated = [item, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('paper_history', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save to localStorage', e);
      }
      return updated;
    });
  };

  const handleAnalyze = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl || url).trim();
    if (!targetUrl || isLoading || cooldownSeconds > 0) return;

    setIsLoading(true);
    setError(null);
    setLoadingStep('Accessing paper source & fetching abstract...');

    try {
      const timer1 = setTimeout(() => {
        setLoadingStep('Synthesizing architecture layers & attention mechanism...');
      }, 1500);

      const timer2 = setTimeout(() => {
        setLoadingStep('Constructing Mermaid flowchart & student project roadmap...');
      }, 3500);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze paper. Please check the URL.');
      }

      const newAnalysis: PaperAnalysisResult = {
        id: `paper-${Date.now()}`,
        url: targetUrl,
        paperTitle: data.paperTitle || null,
        parsed: data.parsed,
        timestamp: Date.now(),
        cached: Boolean(data.cached),
      };

      setCurrentAnalysis(newAnalysis);
      saveToHistory(newAnalysis);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      // 4. FRIENDLY ERROR: Catch 429 quota exhaustion or custom message
      const msg = err?.message || 'Failed to analyze paper. Please check your connection and try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
      // 5. NO DOUBLE CLICKS: Start 10-second cooldown after every request
      setCooldownSeconds(10);
    }
  };

  const handleExportMarkdown = () => {
    if (!currentAnalysis) return;
    const { parsed, url: paperUrl, paperTitle } = currentAnalysis;

    const mdContent = `# Research Paper Analysis: ${paperTitle || paperUrl}
URL: ${paperUrl}
Generated by PaperArchitecture (Gemini 3.8 Flash Research Agent)

---

## 1. CORE CONCEPT
${parsed.coreConcept}

---

## 2. SYSTEM ARCHITECTURE FLOWCHART
\`\`\`mermaid
${parsed.mermaidCode}
\`\`\`

---

## 3. INTERNSHIP & THESIS IDEAS (3rd-Year CS Level)
${parsed.internshipIdeas
  .map(
    (idea, i) =>
      `### Project ${i + 1}: ${idea.extension}\n- **Target Metric**: ${idea.metric}\n- **Tech Stack**: ${idea.stack}\n`
  )
  .join('\n')}

---
*Raw Agent Output:*
\`\`\`
${parsed.raw}
\`\`\`
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `paper-analysis-${(paperTitle || 'research').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Top Hero & Input Section */}
        <section className="flex flex-col items-center text-center max-w-3xl mx-auto w-full gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Academic CS Parser</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Transform Papers into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
              Interactive Flowcharts
            </span>{' '}
            & Project Ideas
          </h2>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
            Paste any arXiv, conference, or academic paper URL. Our research agent synthesizes core concepts,
            renders interactive Mermaid architecture diagrams, and generates realistic undergraduate extensions.
          </p>

          <div className="w-full mt-4">
            <PaperInput
              url={url}
              onUrlChange={setUrl}
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              cooldownSeconds={cooldownSeconds}
            />
          </div>
        </section>

        {/* Loading Progress State */}
        {isLoading && (
          <div className="w-full max-w-2xl mx-auto p-6 rounded-2xl border border-blue-500/30 bg-blue-950/20 backdrop-blur text-center flex flex-col items-center gap-4 animate-pulse">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <Sparkles className="w-5 h-5 text-blue-400 absolute" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Research Agent at Work
              </h3>
              <p className="text-xs font-mono text-blue-300 mt-1">
                {loadingStep || 'Deconstructing paper architecture...'}
              </p>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden max-w-xs">
              <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full w-2/3 animate-indeterminate" />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="w-full max-w-2xl mx-auto p-4 rounded-xl border border-rose-900/50 bg-rose-950/30 text-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-semibold text-rose-300">Analysis Error</p>
              <p className="mt-1 text-rose-300/80">{error}</p>
            </div>
            <button
              onClick={() => handleAnalyze()}
              className="px-3 py-1 rounded bg-rose-900/50 hover:bg-rose-900 text-xs font-medium text-rose-200 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Results Container */}
        {currentAnalysis && !isLoading && (
          <section className="flex flex-col gap-6 animate-fade-in">
            {/* Paper Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                  <span className="text-xs font-bold font-mono">PDF</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-semibold text-white truncate">
                      {currentAnalysis.paperTitle || currentAnalysis.url}
                    </h3>
                    {currentAnalysis.cached && (
                      <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                        In-Memory Cached (0 Quota)
                      </span>
                    )}
                  </div>
                  <a
                    href={currentAnalysis.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition truncate max-w-md"
                  >
                    <span className="truncate">{currentAnalysis.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAnalyze(currentAnalysis.url)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                  title="Re-run Agent Analysis"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-analyze</span>
                </button>

                <button
                  onClick={handleExportMarkdown}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-medium border border-blue-500 transition shadow-sm"
                  title="Export full report as Markdown"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Export Report</span>
                </button>
              </div>
            </div>

            {/* Section 1: Core Concept */}
            <CoreConceptCard
              concept={currentAnalysis.parsed.coreConcept}
              wordCount={currentAnalysis.parsed.coreConceptWordCount}
              paperTitle={currentAnalysis.paperTitle}
            />

            {/* Section 2: Flowchart Diagram */}
            <MermaidDiagram
              code={currentAnalysis.parsed.mermaidCode}
              paperTitle={currentAnalysis.paperTitle}
              onCodeChange={(newCode) => {
                setCurrentAnalysis((prev) =>
                  prev
                    ? {
                        ...prev,
                        parsed: { ...prev.parsed, mermaidCode: newCode },
                      }
                    : null
                );
              }}
            />

            {/* Section 3: Internship & Student Project Ideas */}
            <InternshipIdeasCard
              ideas={currentAnalysis.parsed.internshipIdeas}
              paperTitle={currentAnalysis.paperTitle}
            />

            {/* Raw Agent Output Collapsible */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <button
                onClick={() => setShowRawOutput(!showRawOutput)}
                className="w-full flex items-center justify-between text-left text-xs font-medium text-slate-400 hover:text-slate-200 transition"
              >
                <span className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-blue-400" />
                  View Complete Agent Response & Chain of Thought
                </span>
                {showRawOutput ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showRawOutput && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <pre className="p-4 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                    {currentAnalysis.parsed.raw}
                  </pre>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Recent Session History */}
        {history.length > 1 && (
          <section className="mt-4 border-t border-slate-800/80 pt-6">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-400">
              <History className="w-4 h-4 text-blue-400" />
              <span>Recent Analyses in this Session:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentAnalysis(item);
                    setUrl(item.url);
                  }}
                  className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                    currentAnalysis?.id === item.id
                      ? 'border-blue-500/80 bg-blue-950/40 text-blue-200'
                      : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <span className="text-xs font-medium line-clamp-1 text-slate-100">
                    {item.paperTitle || item.url}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-1">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} PaperArchitecture. Powered by Google Gemini Flash-Lite.</p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-emerald-400">Quota Optimized & Cached</span>
            <span>•</span>
            <span className="text-slate-400">Mermaid Diagram Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
