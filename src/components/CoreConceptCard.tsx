import React, { useState, useEffect } from 'react';
import { BookOpen, Copy, Check, Volume2, Square, Sparkles, AlertCircle } from 'lucide-react';

interface CoreConceptCardProps {
  concept: string;
  wordCount: number;
  paperTitle?: string | null;
}

export const CoreConceptCard: React.FC<CoreConceptCardProps> = ({
  concept,
  wordCount,
  paperTitle,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Stop speech synthesis if component unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(concept);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleToggleAudio = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(concept);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const isWordCountEfficient = wordCount <= 300;

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-950/70 backdrop-blur p-5 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Core Concept
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                Plain Language
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Problem, novel method & key breakthrough summary
            </p>
          </div>
        </div>

        {/* Action Controls & Word Count Badge */}
        <div className="flex items-center gap-2">
          {/* Word Count Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border ${
              isWordCountEfficient
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/50'
            }`}
            title="Prompt constraint: under 300 words"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>{wordCount} words</span>
            <span className="text-[10px] text-slate-400">/ 300</span>
          </div>

          {/* Text-to-Speech Button */}
          <button
            onClick={handleToggleAudio}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition ${
              isPlayingAudio
                ? 'bg-indigo-600 text-white border-indigo-500 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
            title={isPlayingAudio ? 'Stop Reading' : 'Listen to summary'}
            aria-label={isPlayingAudio ? 'Stop Reading' : 'Listen to summary'}
          >
            {isPlayingAudio ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3 h-3" />
                <span className="hidden sm:inline">Listen</span>
              </>
            )}
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title="Copy core concept"
            aria-label="Copy core concept"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Concept Text */}
      <div className="relative text-sm text-slate-200 leading-relaxed font-sans bg-slate-900/40 p-4 rounded-lg border border-slate-800/50">
        <p className="whitespace-pre-wrap">{concept}</p>
      </div>

      {/* Structured Key Pillars Footnote */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-800/50">
        <div className="flex items-start gap-2 bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/30">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              1. The Problem
            </span>
            <span className="text-xs text-slate-300">
              Computational bottlenecks, memory explosion, or sequential processing limits
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/30">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              2. The Method
            </span>
            <span className="text-xs text-slate-300">
              Novel algorithmic architecture, factorization, or hardware-aware tiling
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/30">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              3. The Breakthrough
            </span>
            <span className="text-xs text-slate-300">
              Drastic speedup, linear memory scaling, or parameter-efficient adaptation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
