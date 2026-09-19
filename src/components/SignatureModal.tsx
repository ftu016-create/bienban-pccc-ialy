import React, { useRef, useState } from 'react';
import { X, Check, RotateCcw, PenTool, Upload, Trash2 } from 'lucide-react';

interface SignatureModalProps {
  personName: string;
  currentSignature?: string;
  onSave: (signatureDataUrl: string) => void;
  onClose: () => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  personName,
  currentSignature,
  onSave,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [useExisting, setUseExisting] = useState<boolean>(!!currentSignature);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    setUseExisting(false);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#1a4fba'; // Authentic blue ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      if (imgUrl) {
        onSave(imgUrl);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearSignature = () => {
    onSave('');
    onClose();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      onSave(canvas.toDataURL('image/png'));
      onClose();
      return;
    }

    if (useExisting && currentSignature) {
      onSave(currentSignature);
      onClose();
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-[#17365d] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-blue-300" />
            <h3 className="font-bold text-base">Chữ ký điện tử: {personName}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Current signature if already set by user */}
          {currentSignature && useExisting && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Chữ ký đã lưu hiện tại
                </span>
                <button
                  type="button"
                  onClick={handleClearSignature}
                  className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa chữ ký này</span>
                </button>
              </div>
              <div className="h-16 bg-white border border-slate-200 rounded flex items-center justify-center p-2">
                <img
                  src={currentSignature}
                  alt={`Chữ ký ${personName}`}
                  className="max-h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Draw signature */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700">
                {currentSignature && useExisting
                  ? 'Hoặc ký lại trực tiếp bằng chuột / cảm ứng (Mực xanh):'
                  : 'Ký trực tiếp bằng chuột hoặc màn hình cảm ứng (Mực xanh):'}
              </span>
              <button
                type="button"
                onClick={clearCanvas}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ký lại</span>
              </button>
            </div>

            <div className="relative border-2 border-dashed border-slate-300 rounded-lg bg-white overflow-hidden touch-none cursor-crosshair">
              <canvas
                ref={canvasRef}
                width={440}
                height={150}
                className="w-full h-[150px] bg-white block"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm italic">
                  Ký vào khoảng trống này...
                </div>
              )}
            </div>
          </div>

          {/* Upload image */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <label className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-blue-700 cursor-pointer font-medium bg-slate-50 hover:bg-slate-100 px-3 py-2 border border-slate-200 rounded-lg transition">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Tải file ảnh chữ ký (PNG/JPG)</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            <span className="text-[11px] text-slate-500 italic">
              Nên dùng ảnh chụp chữ ký nền trắng hoặc trong suốt
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium rounded-md hover:bg-slate-200/60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#17365d] hover:bg-[#1f4577] text-white font-medium text-sm rounded-md shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Xác nhận chữ ký</span>
          </button>
        </div>
      </div>
    </div>
  );
};
