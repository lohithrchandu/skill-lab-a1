import React, { useState } from 'react';
import { Network, Sparkles, Terminal, Info, X, ExternalLink } from 'lucide-react';

export const Header: React.FC = () => {
  const [showPromptInfo, setShowPromptInfo] = useState<boolean>(false);

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 border border-blue-400/30">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                PaperArchitecture
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Sparkles className="w-3 h-3" />
                CS Research Agent
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Deconstruct academic papers into Mermaid architecture diagrams & student thesis projects
            </p>
          </div>
        </div>

        {/* Model & Prompt Info */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-slate-300">gemini-3.5-flash-lite</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 text-[11px]">Free Tier Ready</span>
          </div>

          <button
            onClick={() => setShowPromptInfo(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition"
            title="View Research Agent Prompt & Protocol"
          >
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>Agent Protocol</span>
          </button>
        </div>
      </div>

      {/* Agent Protocol Modal */}
      {showPromptInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold text-slate-100">
                  Computer Science Research Agent Prompt
                </h3>
              </div>
              <button
                onClick={() => setShowPromptInfo(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs font-mono text-slate-300 leading-relaxed">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <p className="text-blue-300 font-semibold mb-1">Role & Objectives:</p>
                <p>
                  Specializing in parsing academic papers, extracting system architectures, and identifying student development opportunities.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <p className="text-emerald-300 font-semibold mb-1">Chain of Thought Reasoning:</p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                  <li>Identify the problem the paper solves.</li>
                  <li>Identify the main method and what is new about it.</li>
                  <li>List the system's components, inputs, layers, and outputs.</li>
                  <li>Write the structured response with Mermaid flowchart and 3 student extensions.</li>
                </ol>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <p className="text-amber-300 font-semibold mb-1">Constraints & Efficiency:</p>
                <p>
                  Prioritize token efficiency under 25,000 tokens. Fallback to web search and GitHub summaries if document exceeds single ingestion window.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowPromptInfo(false)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition"
              >
                Close Protocol
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
