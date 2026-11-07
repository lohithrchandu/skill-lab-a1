/**
 * Parser for the Computer Science Research Agent outputs.
 * Parses CORE CONCEPT, [FLOWCHART] (Mermaid), and INTERNSHIP IDEAS.
 */

export interface InternshipIdea {
  id: string;
  extension: string;
  metric: string;
  stack: string;
  fullText?: string;
}

export interface ParsedAnalysis {
  raw: string;
  coreConcept: string;
  coreConceptWordCount: number;
  mermaidCode: string;
  internshipIdeas: InternshipIdea[];
  reasoning?: string;
}

/**
 * Sanitizes Mermaid code to prevent rendering errors.
 */
export function sanitizeMermaid(rawCode: string): string {
  if (!rawCode || typeof rawCode !== 'string') {
    return 'graph TD\n  A["Input"] --> B["System Output"]';
  }

  let code = rawCode.trim();

  // Strip markdown code block wrappers
  code = code.replace(/^```(?:mermaid)?/im, '').replace(/```$/m, '').trim();

  // Remove [FLOWCHART] label if it got caught inside
  code = code.replace(/\[FLOWCHART\]/gi, '').trim();

  // Ensure graph TD or flowchart TD starts at the beginning
  const graphDefMatch = code.match(/^(?:graph|flowchart)\s+(?:TD|TB|LR|RL)/i);
  if (!graphDefMatch) {
    // If not starting with graph TD, find where it appears or prepend graph TD
    const innerGraphIndex = code.search(/(?:graph|flowchart)\s+(?:TD|TB|LR|RL)/i);
    if (innerGraphIndex !== -1) {
      code = code.slice(innerGraphIndex);
    } else {
      code = `graph TD\n${code}`;
    }
  }

  // Ensure standard newline formatting and remove hazardous characters
  const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Normalize header
  if (lines.length > 0 && /^(?:graph|flowchart)/i.test(lines[0])) {
    lines[0] = lines[0].replace(/^flowchart/i, 'graph');
  }

  return lines.join('\n');
}

/**
 * Counts words in a string.
 */
export function countWords(text: string): number {
  if (!text) return 0;
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

/**
 * Parses the full response from Gemini Research Agent.
 */
export function parseAgentResponse(rawText: string): ParsedAnalysis {
  if (!rawText) {
    return {
      raw: '',
      coreConcept: '',
      coreConceptWordCount: 0,
      mermaidCode: 'graph TD\n  A["Input"] --> B["Output"]',
      internshipIdeas: [],
    };
  }

  const cleanText = rawText.trim();

  // 1. Extract Core Concept
  let coreConcept = '';
  const coreConceptMatch = cleanText.match(
    /(?:1\.\s*)?CORE CONCEPT:\s*([\s\S]*?)(?=(?:2\.\s*)?(?:\[FLOWCHART\]|FLOWCHART:|```mermaid|graph TD|flowchart TD)|3\.\s*INTERNSHIP IDEAS:|$)/i
  );
  if (coreConceptMatch && coreConceptMatch[1]) {
    coreConcept = coreConceptMatch[1].trim();
  } else {
    // Fallback: try finding first paragraph or section before flowchart
    const beforeFlowchart = cleanText.split(/\[FLOWCHART\]|```mermaid|2\.\s*FLOWCHART/i)[0];
    coreConcept = beforeFlowchart.replace(/^#+.*$/gm, '').trim();
  }

  // 2. Extract Mermaid Flowchart
  let mermaidCode = '';
  // Check for ```mermaid ... ``` code block
  const mermaidBlockMatch = cleanText.match(/```mermaid([\s\S]*?)```/i);
  if (mermaidBlockMatch && mermaidBlockMatch[1]) {
    mermaidCode = mermaidBlockMatch[1].trim();
  } else {
    // Check for [FLOWCHART] or 2. [FLOWCHART] or 2. FLOWCHART
    const flowchartSectionMatch = cleanText.match(
      /(?:2\.\s*)?(?:\[FLOWCHART\]|FLOWCHART:?)\s*([\s\S]*?)(?=(?:3\.\s*)?INTERNSHIP IDEAS:|$)/i
    );
    if (flowchartSectionMatch && flowchartSectionMatch[1] && flowchartSectionMatch[1].trim()) {
      mermaidCode = flowchartSectionMatch[1].trim();
    } else {
      // Find graph TD or flowchart TD
      const graphMatch = cleanText.match(/((?:graph|flowchart)\s+(?:TD|TB|LR|RL)[\s\S]*?)(?=(?:3\.\s*)?INTERNSHIP IDEAS:|$)/i);
      if (graphMatch && graphMatch[1]) {
        mermaidCode = graphMatch[1].trim();
      }
    }
  }

  mermaidCode = sanitizeMermaid(mermaidCode);

  // 3. Extract Internship Ideas
  const internshipIdeas: InternshipIdea[] = [];
  const internshipSectionMatch = cleanText.match(
    /(?:3\.\s*)?INTERNSHIP IDEAS:\s*([\s\S]*?)$/i
  );

  const internshipBlock = internshipSectionMatch ? internshipSectionMatch[1].trim() : '';

  if (internshipBlock) {
    // Split on bullet points (- or *) or numbered lists (1. or 2. etc.)
    const rawItems = internshipBlock.split(/\n\s*(?:[-*]|\d+\.)\s+/);

    let idx = 1;
    for (let rawItem of rawItems) {
      let trimmed = rawItem.trim().replace(/^[-*]\s+|\d+\.\s+/, '').trim();
      if (!trimmed) continue;

      let extension = '';
      let metric = '';
      let stack = '';

      // Pattern: Extension: <text> Metric: <text> Stack: <text>
      // We look for 'Metric:' and 'Stack:' keywords
      const metricIndex = trimmed.search(/\bMetric:/i);
      const stackIndex = trimmed.search(/\bStack:/i);

      if (metricIndex !== -1 && stackIndex !== -1 && metricIndex < stackIndex) {
        // We have Extension before Metric, and Metric before Stack
        const extPart = trimmed.slice(0, metricIndex).replace(/^Extension:\s*/i, '').trim();
        const metricPart = trimmed.slice(metricIndex, stackIndex).replace(/^Metric:\s*/i, '').trim();
        const stackPart = trimmed.slice(stackIndex).replace(/^Stack:\s*/i, '').trim();

        extension = extPart;
        metric = metricPart;
        stack = stackPart;
      } else {
        // Fallback line by line or pattern search
        const extMatch = trimmed.match(/Extension:\s*([^]+?)(?=\s*Metric:|\s*Stack:|$)/i);
        const metricMatch = trimmed.match(/Metric:\s*([^]+?)(?=\s*Stack:|$)/i);
        const stackMatch = trimmed.match(/Stack:\s*([^]+)$/i);

        if (extMatch && extMatch[1]) extension = extMatch[1].trim();
        if (metricMatch && metricMatch[1]) metric = metricMatch[1].trim();
        if (stackMatch && stackMatch[1]) stack = stackMatch[1].trim();
      }

      // If strict keywords were missing, fallback
      if (!extension) {
        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
        extension = lines[0] || trimmed;
      }

      // Clean trailing periods or commas if needed for tags
      internshipIdeas.push({
        id: `idea-${idx}`,
        extension: extension || `Extension ${idx}`,
        metric: metric || 'Latency & accuracy trade-off',
        stack: stack || 'PyTorch',
        fullText: trimmed,
      });
      idx++;
    }
  }

  // 4. Extract reasoning if user prompt requested REASONING (chain of thought)
  let reasoning: string | undefined;
  const reasoningMatch = cleanText.match(/REASONING(?:\s*\(chain of thought\))?:\s*([\s\S]*?)(?=(?:OUTPUT FORMAT|1\.\s*CORE CONCEPT:))/i);
  if (reasoningMatch && reasoningMatch[1]) {
    reasoning = reasoningMatch[1].trim();
  }

  return {
    raw: cleanText,
    coreConcept,
    coreConceptWordCount: countWords(coreConcept),
    mermaidCode,
    internshipIdeas,
    reasoning,
  };
}
