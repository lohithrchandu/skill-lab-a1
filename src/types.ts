import { ParsedAnalysis } from './utils/parser';

export interface PaperAnalysisResult {
  id: string;
  url: string;
  paperTitle?: string | null;
  parsed: ParsedAnalysis;
  timestamp: number;
  cached?: boolean;
}

export interface SamplePaper {
  id: string;
  title: string;
  authors: string;
  year: string;
  url: string;
  description: string;
  category: string;
}

export const SAMPLE_PAPERS: SamplePaper[] = [
  {
    id: 'transformer',
    title: 'Attention Is All You Need',
    authors: 'Vaswani et al. (Google Brain & Research)',
    year: '2017',
    url: 'https://arxiv.org/abs/1706.03762',
    description: 'The breakthrough paper introducing the Transformer architecture and self-attention mechanism.',
    category: 'LLMs & NLP',
  },
  {
    id: 'lora',
    title: 'LoRA: Low-Rank Adaptation of Large Language Models',
    authors: 'Hu et al. (Microsoft)',
    year: '2021',
    url: 'https://arxiv.org/abs/2106.09685',
    description: 'Freezes model weights and injects trainable rank decomposition matrices, reducing GPU VRAM by up to 3x.',
    category: 'Fine-Tuning & Efficiency',
  },
  {
    id: 'flash-attention',
    title: 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness',
    authors: 'Dao et al. (Stanford / Hazy Research)',
    year: '2022',
    url: 'https://arxiv.org/abs/2205.14135',
    description: 'Hardware-aware exact attention algorithm leveraging GPU SRAM tiling for dramatic speedups.',
    category: 'Systems & GPU',
  },
  {
    id: 'resnet',
    title: 'Deep Residual Learning for Image Recognition',
    authors: 'He et al. (Microsoft Research)',
    year: '2015',
    url: 'https://arxiv.org/abs/1512.03385',
    description: 'Introduces residual skip connections allowing ultra-deep neural networks (152+ layers) without vanishing gradients.',
    category: 'Computer Vision',
  },
  {
    id: 'mamba',
    title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces',
    authors: 'Gu & Dao (Carnegie Mellon / Princeton)',
    year: '2023',
    url: 'https://arxiv.org/abs/2312.00752',
    description: 'Sub-quadratic selective state-space model that matches Transformer quality with 5x inference throughput.',
    category: 'Architecture',
  },
];
