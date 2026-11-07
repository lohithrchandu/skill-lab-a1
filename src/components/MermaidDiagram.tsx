import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Download,
  Code2,
  Eye,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { sanitizeMermaid } from '../utils/parser';

interface MermaidDiagramProps {
  code: string;
  paperTitle?: string | null;
  onCodeChange?: (newCode: string) => void;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  code,
  paperTitle,
  onCodeChange,
}) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableCode, setEditableCode] = useState<string>(code);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rawSvg, setRawSvg] = useState<string>('');

  // Keep editable code in sync when prop changes
  useEffect(() => {
    setEditableCode(code);
  }, [code]);

  // Initialize mermaid configuration once
  useEffect(() => {
    try {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'dark',
        themeVariables: {
          darkMode: true,
          background: '#090d16',
          primaryColor: '#1e293b',
          primaryTextColor: '#f8fafc',
          primaryBorderColor: '#3b82f6',
          lineColor: '#60a5fa',
          secondaryColor: '#0f172a',
          tertiaryColor: '#1e1b4b',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '13px',
          edgeLabelBackground: '#090d16',
        },
        flowchart: {
          curve: 'basis',
          htmlLabels: true,
          padding: 16,
          nodeSpacing: 40,
          rankSpacing: 40,
        },
      });
    } catch (e) {
      console.error('Mermaid init error:', e);
    }
  }, []);

  // Render diagram whenever editableCode changes
  useEffect(() => {
    let active = true;

    const renderChart = async () => {
      const sanitized = sanitizeMermaid(editableCode);
      if (!sanitized) return;

      const uniqueId = `mermaid-graph-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      try {
        setRenderError(null);
        const { svg } = await mermaid.render(uniqueId, sanitized);
        if (active) {
          setRawSvg(svg);
          if (diagramRef.current) {
            diagramRef.current.innerHTML = svg;
            const svgEl = diagramRef.current.querySelector('svg');
            if (svgEl) {
              svgEl.style.maxWidth = '100%';
              svgEl.style.height = 'auto';
              svgEl.style.maxHeight = '460px';
              svgEl.style.display = 'block';
              svgEl.style.margin = 'auto';
            }
          }
        }
      } catch (err: any) {
        if (active) {
          console.warn('Mermaid rendering issue:', err);
          setRenderError(err?.message || 'Could not render flowchart diagram.');
        }
      }
    };

    renderChart();

    return () => {
      active = false;
    };
  }, [editableCode]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.4));
  const handleResetZoom = () => {
    setZoom(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(editableCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleDownloadSVG = () => {
    if (!rawSvg) return;
    const blob = new Blob([rawSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(paperTitle || 'architecture-flowchart').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = () => {
    if (!rawSvg) return;
    const svgBlob = new Blob([rawSvg], { type: 'image/svg+xml;charset=utf-8' });
    const URLObject = window.URL || window.webkitURL || window;
    const svgUrl = URLObject.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = (image.width || 800) * scale;
      canvas.height = (image.height || 600) * scale;

      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#090d16';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.scale(scale, scale);
        context.drawImage(image, 0, 0);

        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${(paperTitle || 'architecture-flowchart').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      URLObject.revokeObjectURL(svgUrl);
    };
    image.src = svgUrl;
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    startPanRef.current = { x: e.clientX - panPosition.x, y: e.clientY - panPosition.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanPosition({
      x: e.clientX - startPanRef.current.x,
      y: e.clientY - startPanRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleCodeChange = (newVal: string) => {
    setEditableCode(newVal);
    if (onCodeChange) {
      onCodeChange(newVal);
    }
  };

  const handleResetToOriginal = () => {
    setEditableCode(code);
    if (onCodeChange) {
      onCodeChange(code);
    }
  };

  return (
    <div
      className={`relative flex flex-col rounded-xl border border-slate-800 bg-slate-950/80 backdrop-blur shadow-xl transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-hidden bg-slate-950 p-6' : 'w-full'
      }`}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-3 bg-slate-900/60 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="text-xs font-bold font-mono">TD</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              System Architecture Flowchart
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/50">
                Mermaid
              </span>
            </h3>
            <p className="text-xs text-slate-400 hidden sm:block">
              Interactive pipeline topology with drag pan & zoom
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5 text-xs text-slate-300">
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-400 select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition border-l border-slate-800 ml-0.5"
              title="Reset View"
              aria-label="Reset Zoom and Pan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle Syntax / Editor */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
              isEditing
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
            title={isEditing ? 'Show Diagram Only' : 'Edit Mermaid Code'}
          >
            {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Code2 className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Preview' : 'Syntax'}</span>
          </button>

          {/* Copy Mermaid Code */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
            title="Copy Mermaid Syntax"
            aria-label="Copy Mermaid Syntax"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleDownloadSVG}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs transition"
              title="Export as SVG"
              aria-label="Export as SVG"
            >
              <span className="font-mono text-[10px] font-bold">SVG</span>
            </button>
            <button
              onClick={handleDownloadPNG}
              className="flex items-center gap-1 px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs transition"
              title="Export as PNG"
              aria-label="Export as PNG"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] font-bold">PNG</span>
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor Drawer (if enabled) */}
      {isEditing && (
        <div className="border-b border-slate-800 bg-slate-900/90 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300">Live Mermaid Editor</span>
              <span className="text-[11px] text-slate-500">Edit graph topology directly to experiment</span>
            </div>
            <button
              onClick={handleResetToOriginal}
              className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
            >
              <RefreshCw className="w-3 h-3" />
              Reset to Agent Output
            </button>
          </div>
          <textarea
            value={editableCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            rows={5}
            className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-blue-200 focus:outline-none focus:border-blue-500 transition resize-y"
            placeholder="graph TD..."
            spellCheck={false}
          />
        </div>
      )}

      {/* Diagram Canvas Body */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full overflow-hidden flex items-center justify-center p-6 select-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] ${
          isFullscreen ? 'min-h-[75vh]' : 'min-h-[360px] max-h-[560px]'
        } ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {renderError ? (
          <div className="max-w-md p-4 rounded-xl border border-rose-900/50 bg-rose-950/40 text-rose-300 flex flex-col items-center text-center gap-3">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <div>
              <p className="text-sm font-semibold">Diagram Syntax Error</p>
              <p className="text-xs text-rose-400/80 mt-1">{renderError}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleResetToOriginal}
                className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-xs font-medium text-rose-100 transition"
              >
                Reset to Default Syntax
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
              >
                Inspect Mermaid Code
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={diagramRef}
            className="transition-transform duration-75 will-change-transform flex items-center justify-center w-full"
            style={{
              transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          />
        )}

        {/* Drag pan helper hint */}
        <div className="absolute bottom-2 right-3 pointer-events-none text-[10px] font-mono text-slate-500 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800/80">
          Click & drag to pan • Scroll controls on top
        </div>
      </div>
    </div>
  );
};
