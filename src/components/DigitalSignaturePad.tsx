import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, PenTool, Type, ShieldCheck, Maximize2, Sparkles } from 'lucide-react';

interface DigitalSignaturePadProps {
  onSave: (dataUrl: string, signerName: string) => void;
  initialName?: string;
  initialSignature?: string;
  label?: string;
  description?: string;
  signerRole?: string;
  onOpenFullscreen?: () => void;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  onSave,
  initialName = '',
  initialSignature = '',
  label = 'Client Digital Consent Signature',
  description = 'Draw your signature using your finger, stylus, or mouse. Or type your name to generate a verified legal signature.',
  signerRole = 'Person Being Screened / Client',
  onOpenFullscreen,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(Boolean(initialSignature));
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState(initialName);
  const [currentSignatureUrl, setCurrentSignatureUrl] = useState(initialSignature);

  // Sync initialSignature if updated externally (e.g. from fullscreen modal)
  useEffect(() => {
    if (initialSignature) {
      setCurrentSignatureUrl(initialSignature);
      setHasDrawn(true);
    }
  }, [initialSignature]);

  // High-DPI canvas setup
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#0B2545'; // Navy blue stroke
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentSignatureUrl && currentSignatureUrl.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = currentSignatureUrl;
    }
  };

  useEffect(() => {
    initCanvas();
    const handleResize = () => initCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mode, currentSignatureUrl]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      setCurrentSignatureUrl(dataUrl);
      onSave(dataUrl, typedName);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    setCurrentSignatureUrl('');
    onSave('', typedName);
  };

  const handleAdoptTypedSignature = () => {
    if (!typedName.trim()) return;
    const offscreen = document.createElement('canvas');
    offscreen.width = 400;
    offscreen.height = 140;
    const ctx = offscreen.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 400, 140);
      ctx.fillStyle = '#0B2545';
      ctx.font = 'italic 34px "Brush Script MT", "Caveat", "Segoe Script", cursive';
      ctx.fillText(typedName, 30, 75);

      // Baseline line
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(25, 95);
      ctx.lineTo(375, 95);
      ctx.stroke();

      const dataUrl = offscreen.toDataURL('image/png');
      setCurrentSignatureUrl(dataUrl);
      setHasDrawn(true);
      onSave(dataUrl, typedName);
    }
  };

  return (
    <div className="bg-white text-slate-900 rounded-xl border border-slate-300 p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-blue-900" />
            <span className="font-bold text-sm text-slate-900">{label}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>

        {/* Action Controls & Fullscreen Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenFullscreen && (
            <button
              type="button"
              onClick={onOpenFullscreen}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow transition"
              title="Open full screen consent & signature"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen Consent</span>
            </button>
          )}

          {/* Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs border border-slate-200">
            <button
              type="button"
              onClick={() => setMode('draw')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition ${
                mode === 'draw'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenTool className="w-3 h-3" />
              Draw
            </button>
            <button
              type="button"
              onClick={() => setMode('type')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition ${
                mode === 'type'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Type className="w-3 h-3" />
              Type
            </button>
          </div>
        </div>
      </div>

      {mode === 'draw' ? (
        <div className="relative">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-36 bg-amber-50/20 rounded-xl border-2 border-dashed border-blue-900/30 cursor-crosshair touch-none shadow-inner"
          />

          {!hasDrawn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
              <PenTool className="w-6 h-6 mb-1 text-blue-900/50" />
              <span className="text-xs font-bold text-slate-600">Sign here with finger, stylus or mouse</span>
              <span className="text-[10px] text-slate-400">or click "Full Screen Consent" above for client</span>
            </div>
          )}

          {/* Signature baseline guide */}
          <div className="absolute left-6 right-6 bottom-7 border-b border-dashed border-slate-300 pointer-events-none flex justify-between">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-semibold">
              X ___________________ Sign Above
            </span>
            <span className="text-[9px] text-amber-600 font-mono font-bold">DUNWELL & COJ HEALTH</span>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Legal Name for Electronic Attestation:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Enter client's legal or recognized name"
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-900"
              />
              <button
                type="button"
                onClick={handleAdoptTypedSignature}
                className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap"
              >
                Adopt & Sign
              </button>
            </div>
          </div>

          {currentSignatureUrl && (
            <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
              <img src={currentSignatureUrl} alt="Adopted Signature" className="h-12 object-contain" />
              <div className="text-right text-[10px] text-slate-500">
                <span className="text-emerald-700 font-bold block">Adopted Digital Signature</span>
                <span>{new Date().toLocaleDateString('en-ZA')}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Signature Toolbar / Verification Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          {hasDrawn ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Signature Captured ({signerRole})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              Awaiting Signature for Valid Consent
            </span>
          )}
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            • POPIA & Health Act Compliant
          </span>
        </div>

        {mode === 'draw' && (
          <button
            type="button"
            onClick={clearCanvas}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-rose-600 px-2.5 py-1 rounded transition text-xs font-semibold"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
