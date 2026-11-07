import React, { useState } from 'react';
import {
  Sparkles,
  Link2,
  X,
  ClipboardPaste,
  FileText,
  Clock,
} from 'lucide-react';
import { SAMPLE_PAPERS, SamplePaper } from '../types';

interface PaperInputProps {
  url: string;
  onUrlChange: (newUrl: string) => void;
  onAnalyze: (customUrl?: string) => void;
  isLoading: boolean;
  cooldownSeconds?: number;
}

export const PaperInput: React.FC<PaperInputProps> = ({
  url,
  onUrlChange,
  onAnalyze,
  isLoading,
  cooldownSeconds = 0,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const isButtonDisabled = isLoading || cooldownSeconds > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isButtonDisabled) return;
    onAnalyze();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim().startsWith('http')) {
        onUrlChange(text.trim());
      }
    } catch (e) {
      console.warn('Clipboard read permission denied', e);
    }
  };

  const handleSelectPreset = (paper: SamplePaper) => {
    if (isButtonDisabled) return;
    setSelectedPresetId(paper.id);
    onUrlChange(paper.url);
    onAnalyze(paper.url);
  };

  const isValidUrl = url.trim().length > 0 && /^https?:\/\//i.test(url.trim());

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex items-center rounded-xl border border-slate-700 bg-slate-900/90 shadow-2xl backdrop-blur transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
          <div className="pl-4 pr-2 text-slate-400">
            <Link2 className="w-5 h-5 text-blue-400" />
          </div>

          <input
            type="url"
            value={url}
            onChange={(e) => {
              onUrlChange(e.target.value);
              setSelectedPresetId(null);
            }}
            placeholder="Paste research paper URL (e.g. https://arxiv.org/abs/1706.03762 or openreview/pdf)..."
            className="w-full bg-transparent py-4 text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
            disabled={isLoading}
            required
          />

          <div className="flex items-center gap-2 pr-3">
            {url && !isLoading && (
              <button
                type="button"
                onClick={() => onUrlChange('')}
                className="p-1 text-slate-400 hover:text-slate-200 transition"
                title="Clear input"
                disabled={isLoading}
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {!url && !isLoading && (
              <button
                type="button"
                onClick={handlePaste}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition border border-slate-700"
                title="Paste from clipboard"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Paste</span>
              </button>
            )}

            <button
              type="submit"
              disabled={!isValidUrl || isButtonDisabled}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all shadow-lg active:scale-[0.98] ${
                isLoading
                  ? 'bg-blue-600/70 text-white cursor-wait'
                  : cooldownSeconds > 0
                  ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60 cursor-not-allowed shadow-none'
                  : !isValidUrl
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : cooldownSeconds > 0 ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Cooldown ({cooldownSeconds}s)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Preset Sample Papers Chips */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            Or test instantly with benchmark papers:
          </span>
          <span className="hidden sm:inline text-slate-500">
            {cooldownSeconds > 0 ? `Ready in ${cooldownSeconds}s` : 'In-memory cached for zero quota waste'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {SAMPLE_PAPERS.map((paper) => {
            const isSelected = selectedPresetId === paper.id || url === paper.url;
            return (
              <button
                key={paper.id}
                type="button"
                onClick={() => handleSelectPreset(paper)}
                disabled={isButtonDisabled}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition border text-left ${
                  isButtonDisabled
                    ? 'opacity-60 cursor-not-allowed bg-slate-900/40 text-slate-400 border-slate-800'
                    : isSelected
                    ? 'bg-blue-950/80 text-blue-200 border-blue-500/80 shadow-sm'
                    : 'bg-slate-900/70 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
                title={`${paper.title} (${paper.year}) - ${paper.description}`}
              >
                <span className="font-semibold text-slate-200">{paper.title}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {paper.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
