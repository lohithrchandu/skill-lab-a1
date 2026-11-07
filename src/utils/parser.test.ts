import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAgentResponse, sanitizeMermaid, countWords } from './parser';

test('countWords accurately counts tokens and words', () => {
  assert.equal(countWords(''), 0);
  assert.equal(countWords('Earlier translation models read text one word at a time.'), 10);
});

test('sanitizeMermaid cleans code blocks and normalizes header', () => {
  const inputWithBackticks = '```mermaid\n[FLOWCHART]\ngraph TD\n  A["Input"] --> B["Output"]\n```';
  const sanitized = sanitizeMermaid(inputWithBackticks);
  assert.ok(sanitized.startsWith('graph TD'));
  assert.ok(sanitized.includes('A["Input"] --> B["Output"]'));
  assert.ok(!sanitized.includes('```'));
  assert.ok(!sanitized.includes('[FLOWCHART]'));
});

test('parseAgentResponse parses the exact few-shot example from the prompt', () => {
  const exampleInput = `1. CORE CONCEPT: Earlier translation models read text one word at a time, which was slow. This paper introduces the Transformer, which uses attention to look at all words at once, so training is much faster and parallel.
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

  const parsed = parseAgentResponse(exampleInput);

  assert.ok(parsed.coreConcept.includes('Earlier translation models'));
  assert.ok(parsed.coreConcept.includes('Transformer'));
  assert.equal(parsed.coreConceptWordCount > 10, true);

  assert.ok(parsed.mermaidCode.includes('graph TD'));
  assert.ok(parsed.mermaidCode.includes('A["Input Tokens"] --> B["Embeddings + Positions"]'));
  assert.ok(parsed.mermaidCode.includes('C --> D["Decoder: Attention over Encoder Output"]'));
  assert.ok(parsed.mermaidCode.includes('D --> E["Output Probabilities"]'));

  assert.equal(parsed.internshipIdeas.length, 3);
  assert.equal(parsed.internshipIdeas[0].extension, 'replace full attention with a sparse variant.');
  assert.equal(parsed.internshipIdeas[0].metric, 'memory use vs. accuracy.');
  assert.equal(parsed.internshipIdeas[0].stack, 'PyTorch.');

  assert.equal(parsed.internshipIdeas[1].extension, 'quantize the model to 8-bit for edge devices.');
  assert.equal(parsed.internshipIdeas[1].metric, 'latency reduction.');
  assert.equal(parsed.internshipIdeas[1].stack, 'ONNX Runtime.');

  assert.equal(parsed.internshipIdeas[2].extension, 'add LoRA adapters for a niche domain.');
  assert.equal(parsed.internshipIdeas[2].metric, 'trainable parameters vs. accuracy.');
  assert.equal(parsed.internshipIdeas[2].stack, 'PEFT.');
});

test('parseAgentResponse handles responses with markdown code blocks for Mermaid', () => {
  const markdownInput = `1. CORE CONCEPT:
LoRA freezes the pre-trained model weights and injects trainable rank decomposition matrices into each layer of the Transformer architecture, greatly reducing the number of trainable parameters for downstream tasks.

2. [FLOWCHART]
\`\`\`mermaid
graph TD
  X["Input Features"] --> W["Frozen Weights W_0"]
  X --> A["Down-projection Matrix A"]
  A --> B["Up-projection Matrix B"]
  W --> S["Summation (+)"]
  B --> S
  S --> Y["Output"]
\`\`\`

3. INTERNSHIP IDEAS:
- Extension: Dynamic rank allocation per layer based on gradient sensitivity. Metric: perplexity vs active params. Stack: PyTorch, Hugging Face Transformers.
- Extension: 4-bit QLoRA implementation for mobile browsers via WebGPU. Metric: memory footprint & token/s. Stack: WebLLM, TVM.
- Extension: Multi-task LoRA router with mixture of adapter experts. Metric: task transfer interference. Stack: PyTorch, PEFT.`;

  const parsed = parseAgentResponse(markdownInput);
  assert.ok(parsed.coreConcept.includes('LoRA freezes the pre-trained'));
  assert.ok(parsed.mermaidCode.includes('graph TD'));
  assert.ok(parsed.mermaidCode.includes('X["Input Features"] --> W["Frozen Weights W_0"]'));
  assert.equal(parsed.internshipIdeas.length, 3);
  assert.ok(parsed.internshipIdeas[0].extension.includes('Dynamic rank allocation'));
  assert.ok(parsed.internshipIdeas[1].stack.includes('WebLLM'));
});
