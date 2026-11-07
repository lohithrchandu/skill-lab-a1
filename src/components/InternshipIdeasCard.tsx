import React, { useState } from 'react';
import {
  GraduationCap,
  Target,
  Cpu,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Code,
  Layers,
  Calendar,
} from 'lucide-react';
import { InternshipIdea } from '../utils/parser';

interface InternshipIdeasCardProps {
  ideas: InternshipIdea[];
  paperTitle?: string | null;
}

export const InternshipIdeasCard: React.FC<InternshipIdeasCardProps> = ({
  ideas,
  paperTitle,
}) => {
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIdeaId(expandedIdeaId === id ? null : id);
  };

  const getStarterPrompt = (idea: InternshipIdea) => {
    return `I am a 3rd-year Computer Science student working on an undergraduate research project based on the paper "${paperTitle || 'this research paper'}".
Project Extension: ${idea.extension}
Target Evaluation Metric: ${idea.metric}
Required Tech Stack: ${idea.stack}

Can you help me:
1. Outline a step-by-step implementation plan and minimal working prototype in ${idea.stack}?
2. Identify which GitHub repository or reference implementation to fork as a baseline?
3. Design the benchmark script to measure ${idea.metric}?`;
  };

  const handleCopyPrompt = async (idea: InternshipIdea) => {
    const prompt = getStarterPrompt(idea);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPromptId(idea.id);
      setTimeout(() => setCopiedPromptId(null), 2000);
    } catch (e) {
      console.error('Failed to copy starter prompt', e);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-950/70 backdrop-blur p-5 shadow-lg">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Internship & Thesis Extensions
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                3rd-Year CS Level
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Realistic systems and ML projects with tangible engineering deliverables
            </p>
          </div>
        </div>
      </div>

      {/* 3 Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ideas.map((idea, index) => {
          const isExpanded = expandedIdeaId === idea.id;
          const isCopied = copiedPromptId === idea.id;

          // Parse stack into tags
          const stackTags = idea.stack
            .replace(/[.]/g, '')
            .split(/[,/|]/)
            .map((s) => s.trim())
            .filter(Boolean);

          return (
            <div
              key={idea.id || index}
              className={`flex flex-col justify-between rounded-xl border transition-all ${
                isExpanded
                  ? 'border-emerald-500/50 bg-slate-900/90 shadow-md ring-1 ring-emerald-500/20 md:col-span-3'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
              } p-4`}
            >
              <div>
                {/* Badge Number */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
                      {index + 1}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Extension Project
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50">
                    6-8 Weeks
                  </span>
                </div>

                {/* Exact Extension */}
                <h4 className="text-sm font-medium text-slate-100 leading-snug mb-3 min-h-[42px]">
                  {idea.extension}
                </h4>

                {/* Target Metric */}
                <div className="mb-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 mb-1">
                    <Target className="w-3.5 h-3.5" />
                    <span>Target Metric</span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed">
                    {idea.metric}
                  </p>
                </div>

                {/* Tech Stack */}
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-1.5">
                    <Cpu className="w-3 h-3 text-blue-400" />
                    <span>Tech Stack</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {stackTags.map((tag, tagIdx) => (
                      <span
                        key={tagIdx}
                        className="px-2 py-0.5 rounded text-xs font-mono bg-blue-950/60 text-blue-300 border border-blue-800/40"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action / Roadmap Toggle */}
              <div className="pt-3 border-t border-slate-800/60">
                <button
                  onClick={() => toggleExpand(idea.id)}
                  aria-label={`Student Implementation Roadmap for Extension ${index + 1}`}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-200 transition font-medium"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    {isExpanded ? 'Hide Implementation Roadmap' : 'Student Implementation Roadmap'}
                  </span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Expanded Roadmap & Starter Prompt */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4">
                    {/* 3-Phase Roadmap */}
                    <div>
                      <h5 className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        Suggested 6-Week Student Timeline:
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                            Weeks 1-2: Setup & Baseline
                          </span>
                          <p className="text-xs text-slate-300 mt-1">
                            Fork standard open-source implementation. Reproduce baseline accuracy on a toy dataset (e.g. WikiText or CIFAR).
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                            Weeks 3-4: Extension Coding
                          </span>
                          <p className="text-xs text-slate-300 mt-1">
                            Implement {idea.extension.slice(0, 70)}... using {idea.stack}. Validate unit tests and gradient sanity.
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                            Weeks 5-6: Benchmark
                          </span>
                          <p className="text-xs text-slate-300 mt-1">
                            Profile target metric: <span className="font-mono text-amber-300">{idea.metric}</span>. Create comparative latency vs memory plots.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* AI Coding Starter Prompt */}
                    <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Code className="w-3.5 h-3.5 text-blue-400" />
                          Coding Assistant Starter Prompt
                        </span>
                        <button
                          onClick={() => handleCopyPrompt(idea)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
                          title="Copy prompt for your AI assistant"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Prompt</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs font-mono text-slate-400 bg-slate-900/80 p-2.5 rounded border border-slate-800/80 whitespace-pre-wrap">
                        {getStarterPrompt(idea)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
