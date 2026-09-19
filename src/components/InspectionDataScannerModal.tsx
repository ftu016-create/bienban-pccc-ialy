import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ClipboardPaste,
  ShieldAlert,
  Info,
  Users,
  Check,
  Zap,
  Building2,
  Layers,
  ArrowLeftRight,
} from 'lucide-react';
import { ReportData } from '../types';
import {
  analyzeInspectionText,
  parseExcelInspectionFile,
  SAMPLE_IALY_MR_RAW_TEXT,
  SAMPLE_IALY_RAW_TEXT,
  SAMPLE_BOTH_PLANTS_RAW_TEXT,
  applyInspectionAnalysisToReport,
  InspectionAnalysisResult,
  PlantTarget,
} from '../services/fileAnalysis';

interface InspectionDataScannerModalProps {
  currentReport: ReportData;
  onApply: (updated: ReportData, summary: string[]) => void;
  onClose: () => void;
}

export const InspectionDataScannerModal: React.FC<InspectionDataScannerModalProps> = ({
  currentReport,
  onApply,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'sample'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [pastedContent, setPastedContent] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  // Analysis result
  const [analysisResult, setAnalysisResult] = useState<InspectionAnalysisResult | null>(null);

  // Target plant routing scope: 'auto' | 'ialy' | 'ialy_mr' | 'both'
  const [targetPlantScope, setTargetPlantScope] = useState<'auto' | 'ialy' | 'ialy_mr' | 'both'>('auto');

  // Application options
  const [updateBadColumns, setUpdateBadColumns] = useState(true);
  const [updateNotes, setUpdateNotes] = useState(true);
  const [addRecommendations, setAddRecommendations] = useState(true);
  const [addPersonnelToDelegation, setAddPersonnelToDelegation] = useState(true);

  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process raw text through analyzer
  const handleAnalyzeText = (
    text: string,
    sourceName?: string,
    plantScope: 'auto' | 'ialy' | 'ialy_mr' | 'both' = 'auto'
  ) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = analyzeInspectionText(text, plantScope === 'auto' || plantScope === 'both' ? 'auto' : plantScope);
      setAnalysisResult(res);
      setTargetPlantScope(plantScope);
      if (sourceName) setFileName(sourceName);
    } catch (err) {
      setErrorMessage('Có lỗi xảy ra khi phân tích dữ liệu: ' + String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle uploaded files
  const handleFile = async (file: File) => {
    setFileName(file.name);
    setIsProcessing(true);
    setErrorMessage(null);

    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        const extractedText = await parseExcelInspectionFile(file);
        handleAnalyzeText(extractedText, file.name);
      } else if (ext === 'txt' || ext === 'tsv' || ext === 'json') {
        const text = await file.text();
        handleAnalyzeText(text, file.name);
      } else {
        const text = await file.text().catch(() => '');
        if (text && text.length > 50) {
          handleAnalyzeText(text, file.name);
        } else {
          setErrorMessage(
            `Đã nhận file "${file.name}". Vì file PDF hoặc hình scan cần nhận dạng chữ (OCR), anh có thể copy văn bản trong file dán vào tab "Dán nội dung / Bảng OCR" hoặc chọn các mẫu dữ liệu bên dưới để thử nghiệm tự động cập nhật ngay!`
          );
        }
      }
    } catch (err) {
      setErrorMessage('Không thể đọc file: ' + String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Sample Loaders
  const handleLoadSampleIalyMR = () => {
    setPastedContent(SAMPLE_IALY_MR_RAW_TEXT);
    handleAnalyzeText(SAMPLE_IALY_MR_RAW_TEXT, 'Bảng II NMTĐ Ialy Mở Rộng (32 trang PDF)', 'auto');
    setActiveTab('sample');
  };

  const handleLoadSampleIaly = () => {
    setPastedContent(SAMPLE_IALY_RAW_TEXT);
    handleAnalyzeText(SAMPLE_IALY_RAW_TEXT, 'Sổ kiểm tra NMTĐ Ialy (Hiện hữu)', 'auto');
    setActiveTab('sample');
  };

  const handleLoadSampleBoth = () => {
    setPastedContent(SAMPLE_BOTH_PLANTS_RAW_TEXT);
    handleAnalyzeText(SAMPLE_BOTH_PLANTS_RAW_TEXT, 'Sổ kiểm tra tổng hợp cả 2 khu vực (Ialy & Ialy MR)', 'auto');
    setActiveTab('sample');
  };

  // Toggle single issue plant target manually
  const handleToggleIssuePlant = (issueId: string) => {
    if (!analysisResult) return;
    const updatedIssues = analysisResult.issues.map((iss) => {
      if (iss.id === issueId) {
        const nextPlant: PlantTarget = iss.plant === 'ialy' ? 'ialy_mr' : 'ialy';
        const updatedNote = nextPlant === 'ialy'
          ? iss.suggestedNote.replace('[Ialy MR]', '[NMTĐ Ialy]')
          : iss.suggestedNote.replace('[NMTĐ Ialy]', '[Ialy MR]');

        return {
          ...iss,
          plant: nextPlant,
          suggestedNote: updatedNote.startsWith('[')
            ? updatedNote
            : `${nextPlant === 'ialy' ? '[NMTĐ Ialy]' : '[Ialy MR]'} ${updatedNote}`,
        };
      }
      return iss;
    });

    const ialyCount = updatedIssues.filter((i) => i.plant === 'ialy').length;
    const ialyMRCount = updatedIssues.filter((i) => i.plant === 'ialy_mr').length;

    setAnalysisResult({
      ...analysisResult,
      issues: updatedIssues,
      summary: {
        ...analysisResult.summary,
        ialyIssuesCount: ialyCount,
        ialyMRIssuesCount: ialyMRCount,
      },
    });
  };

  // Execute apply to report
  const handleExecuteApply = () => {
    if (!analysisResult) return;
    const { updatedReport, appliedSummary } = applyInspectionAnalysisToReport(
      currentReport,
      analysisResult,
      {
        updateBadColumns,
        updateNotes,
        addRecommendations,
        addPersonnelToDelegation,
        targetPlantScope,
      }
    );

    setAppliedSuccess(true);
    setTimeout(() => {
      onApply(updatedReport, appliedSummary);
      onClose();
    }, 600);
  };

  // Filtered issues to show based on targetPlantScope
  const visibleIssues = analysisResult
    ? analysisResult.issues.filter((iss) => {
        if (targetPlantScope === 'ialy') return iss.plant === 'ialy';
        if (targetPlantScope === 'ialy_mr') return iss.plant === 'ialy_mr';
        return true; // 'auto' or 'both'
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight flex items-center gap-2">
                <span>Quét file kiểm tra & Tự động phân loại theo Nhà máy</span>
                <span className="text-[10px] bg-blue-500/30 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-400/30">
                  NMTĐ Ialy & Ialy Mở rộng
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Tự động nhận diện thiết bị không đạt, ghi vào cột Không đạt, Ghi chú & Mục Kiến nghị tương ứng từng Nhà máy
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-5 sm:px-6 flex items-center justify-between gap-3 shrink-0">
          <div className="flex gap-1 py-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'upload'
                  ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Tải file lên (Excel / Word / Text)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'paste'
                  ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ClipboardPaste className="w-4 h-4" />
              <span>Dán nội dung / Bảng OCR</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sample')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'sample'
                  ? 'bg-white text-amber-700 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Mẫu dữ liệu thực tế (3 Mẫu)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* TAB 1: UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt,.tsv,.json,.pdf,.docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Kéo thả file kiểm tra vào đây hoặc click để chọn file
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hỗ trợ file Excel (.xlsx, .xls, .csv), file văn bản trích xuất, hoặc sổ theo dõi phương tiện
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-semibold">
                    .XLSX
                  </span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-semibold">
                    .XLS
                  </span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-semibold">
                    .CSV
                  </span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-semibold">
                    .TXT / DOCX
                  </span>
                </div>
              </div>

              {/* 3 Quick Sample Action Buttons */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Hoặc chọn nhanh mẫu dữ liệu thực tế để thử nghiệm phân loại tự động:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleLoadSampleIaly}
                    className="p-2.5 text-left bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-xl transition group shadow-2xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-blue-900 group-hover:text-blue-700">
                        1. NMTĐ Ialy (Hiện hữu)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      Gian máy & Trạm 500kV (Họng nước rò rỉ van, bình MFZ8 tụt áp đỏ)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSampleIalyMR}
                    className="p-2.5 text-left bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-xl transition group shadow-2xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-amber-900 group-hover:text-amber-700">
                        2. NMTĐ Ialy Mở rộng
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      Bảng II 32 trang (CT 348m vỡ lăng, CT 309m 2 bình Oxy áp suất thấp)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSampleBoth}
                    className="p-2.5 text-left bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-xl transition group shadow-2xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-900 group-hover:text-emerald-700">
                        3. Tổng hợp cả 2 khu vực
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      Dữ liệu gồm cả Ialy và Ialy MR trong 1 file, tự động tách vào 2 bảng riêng
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dán nội dung bảng kiểm tra, kết quả OCR hoặc văn bản ghi chép vào đây:
                </label>
                <textarea
                  rows={8}
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  placeholder="Ví dụ:&#10;--- KHU VỰC: NHÀ MÁY THỦY ĐIỆN IALY ---&#10;Gian máy: Phát hiện 01 họng nước chữa cháy bị rò rỉ tại van khóa&#10;Trạm 500kV: Phát hiện 01 bình bột MFZ8 kim chỉ áp lực tụt xuống vùng đỏ&#10;&#10;--- KHU VỰC: IALY MỞ RỘNG ---&#10;Cao trình 348m: 61 | Lăng chữa cháy | Cái | 4 | Bị vỡ 1 lăng, chờ bổ sung&#10;Cao trình 309m: 5 | Bình OXY | Bộ | 2 | Áp suất ngoài vùng xanh (280 & 310bar)"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white leading-relaxed"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-500">
                  Đã nhập {pastedContent.trim() ? pastedContent.split('\n').length : 0} dòng
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadSampleBoth}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition"
                  >
                    Dán mẫu 2 nhà máy
                  </button>
                  <button
                    type="button"
                    disabled={!pastedContent.trim() || isProcessing}
                    onClick={() => handleAnalyzeText(pastedContent, 'Dữ liệu dán trực tiếp')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Bắt đầu quét & phân loại</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SAMPLES */}
          {activeTab === 'sample' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Chọn một trong 3 kịch bản kiểm tra dưới đây để nạp dữ liệu và xem hệ thống tự động bóc tách vào 2 khu vực Nhà máy tương ứng:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-xs mb-1">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>1. NMTĐ Ialy (Hiện hữu)</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Chứa các lỗi tại Gian máy (họng nước chữa cháy rò rỉ van) và Trạm 500kV (bình bột MFZ8 tụt áp).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadSampleIaly}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition"
                  >
                    Nạp dữ liệu Ialy (Mục I)
                  </button>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1">
                      <Layers className="w-4 h-4 text-amber-600" />
                      <span>2. NMTĐ Ialy Mở rộng</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Trích từ file 32 trang của anh: Vỡ 01 lăng chữa cháy tại CT 348m và 02 bình Oxy áp suất thấp tại CT 309m.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadSampleIalyMR}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition"
                  >
                    Nạp dữ liệu Ialy MR (Mục II)
                  </button>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs mb-1">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>3. Tổng hợp cả 2 khu vực</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      File tổng hợp chung chứa cả dữ liệu của NMTĐ Ialy và Ialy MR. Tự động bóc tách và phân luồng vào 2 bảng.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadSampleBoth}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
                  >
                    Nạp file tổng hợp (2 Nhà máy)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error display */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ANALYSIS RESULTS PANEL */}
          {analysisResult && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs space-y-0">
              {/* Result Summary Bar */}
              <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <span className="font-bold text-sm">
                      Kết quả quét từ: {fileName || 'Dữ liệu kiểm tra'}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      Tổng số thiết bị kiểm tra: <strong>{analysisResult.totalItemsScanned}</strong> | Phát hiện:{' '}
                      <span className="text-blue-300 font-semibold">{analysisResult.summary.ialyIssuesCount} lỗi NMTĐ Ialy</span>,{' '}
                      <span className="text-amber-300 font-semibold">{analysisResult.summary.ialyMRIssuesCount} lỗi Ialy MR</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-800 text-rose-300 font-bold">
                    Không đạt: {analysisResult.summary.criticalCount}
                  </span>
                  <span className="bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800 text-emerald-300 font-bold">
                    Đạt tốt: {analysisResult.summary.passedCount}
                  </span>
                </div>
              </div>

              {/* ROUTING SELECTOR TABS (KHU VỰC ÁP DỤNG) */}
              <div className="bg-blue-50/60 border-b border-blue-200/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-blue-900 font-bold">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <span>Khu vực áp dụng vào Biên bản:</span>
                </div>

                <div className="inline-flex rounded-xl bg-slate-200/80 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setTargetPlantScope('auto')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                      targetPlantScope === 'auto'
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🤖 Tự động phân loại</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
                      {analysisResult.issues.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetPlantScope('ialy')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                      targetPlantScope === 'ialy'
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🏭 Mục I: NMTĐ Ialy</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
                      {analysisResult.summary.ialyIssuesCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetPlantScope('ialy_mr')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                      targetPlantScope === 'ialy_mr'
                        ? 'bg-white text-amber-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🏗️ Mục II: Ialy MR</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full">
                      {analysisResult.summary.ialyMRIssuesCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetPlantScope('both')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                      targetPlantScope === 'both'
                        ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🔄 Cả 2 khu vực</span>
                  </button>
                </div>
              </div>

              {/* Detected Issues Details */}
              <div className="p-4 sm:p-5 space-y-4">
                {/* 1. Critical issues / Defective items */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>
                        Thiết bị không đạt / Cần xử lý ({visibleIssues.length} mục):
                      </span>
                    </h4>
                    <span className="text-[11px] text-slate-500 italic">
                      Click vào thẻ nhà máy để đổi giữa Mục I và Mục II
                    </span>
                  </div>

                  {visibleIssues.length === 0 ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Không phát hiện thiết bị không đạt thuộc khu vực này.</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {visibleIssues.map((issue, idx) => {
                        const isMR = issue.plant === 'ialy_mr';
                        return (
                          <div
                            key={issue.id}
                            className={`border rounded-xl p-3 text-xs space-y-1.5 transition ${
                              isMR
                                ? 'bg-amber-50/40 border-amber-200/90'
                                : 'bg-blue-50/40 border-blue-200/90'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 font-bold">
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                                    isMR ? 'bg-amber-200 text-amber-900' : 'bg-blue-200 text-blue-900'
                                  }`}
                                >
                                  #{idx + 1}
                                </span>
                                <span className="text-sm text-slate-900">{issue.equipmentName}</span>

                                {/* Interactive Plant Target Badge */}
                                <button
                                  type="button"
                                  title="Bấm để chuyển khu vực nhà máy cho thiết bị này"
                                  onClick={() => handleToggleIssuePlant(issue.id)}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] border transition cursor-pointer ${
                                    isMR
                                      ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                      : 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
                                  }`}
                                >
                                  {isMR ? (
                                    <>
                                      <Layers className="w-3 h-3 text-amber-700" />
                                      <span>Mục II: Ialy MR</span>
                                    </>
                                  ) : (
                                    <>
                                      <Building2 className="w-3 h-3 text-blue-700" />
                                      <span>Mục I: NMTĐ Ialy</span>
                                    </>
                                  )}
                                  <ArrowLeftRight className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                                </button>

                                <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-medium">
                                  {issue.location}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-mono text-rose-700 font-bold bg-white px-2 py-0.5 rounded border border-rose-300">
                                  Cột Không đạt: +{issue.suggestedBadCount}
                                </span>
                              </div>
                            </div>

                            <p className="text-slate-700 pl-7">
                              <strong>Tình trạng phát hiện:</strong> {issue.finding}
                            </p>

                            <p className="text-slate-600 pl-7 text-[11px] italic bg-white/70 p-1.5 rounded-lg border border-slate-200/60">
                              <strong>Kiến nghị tự động sinh:</strong> {issue.suggestedRecommendation}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Special notes */}
                {analysisResult.specialNotes.length > 0 && (
                  <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-3 text-xs space-y-1">
                    <h5 className="font-bold text-amber-900 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-600" />
                      <span>Ghi chú thử nghiệm đặc biệt:</span>
                    </h5>
                    {analysisResult.specialNotes.map((sn, i) => (
                      <p key={i} className="text-amber-800 pl-5">
                        • {sn}
                      </p>
                    ))}
                  </div>
                )}

                {/* 3. Detected inspectors & managers */}
                {analysisResult.detectedManagers.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                    <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        Cán bộ quản lý / kiểm tra được ghi nhận trong file ({analysisResult.detectedManagers.length} đồng chí):
                      </span>
                    </h5>
                    <div className="flex flex-wrap gap-1.5 pl-5">
                      {analysisResult.detectedManagers.map((m, i) => (
                        <span
                          key={i}
                          className="bg-white border border-slate-300 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-medium"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Choose what to apply */}
                <div className="bg-blue-50/50 border border-blue-200/90 rounded-xl p-3.5 space-y-2.5">
                  <p className="font-bold text-xs text-blue-900">
                    Tùy chọn tự động ghi dữ liệu vào Biên bản kiểm tra:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium">
                      <input
                        type="checkbox"
                        checked={updateBadColumns}
                        onChange={(e) => setUpdateBadColumns(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Cập nhật cột <strong>Không đạt</strong> & trừ cột <strong>Đạt</strong></span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium">
                      <input
                        type="checkbox"
                        checked={updateNotes}
                        onChange={(e) => setUpdateNotes(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Tự động điền chi tiết vào cột <strong>Ghi chú</strong></span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium">
                      <input
                        type="checkbox"
                        checked={addRecommendations}
                        onChange={(e) => setAddRecommendations(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Tự động bổ sung vào <strong>Mục II. Kiến nghị</strong></span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium">
                      <input
                        type="checkbox"
                        checked={addPersonnelToDelegation}
                        onChange={(e) => setAddPersonnelToDelegation(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Bổ sung cán bộ kiểm tra vào <strong>Danh sách đoàn</strong></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            {analysisResult && (
              <button
                type="button"
                onClick={handleExecuteApply}
                disabled={appliedSuccess}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-md ${
                  appliedSuccess
                    ? 'bg-emerald-600'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/25'
                }`}
              >
                {appliedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Đã áp dụng thành công!</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>
                      Áp dụng tự động vào Bảng{' '}
                      {targetPlantScope === 'ialy'
                        ? 'NMTĐ Ialy (Mục I)'
                        : targetPlantScope === 'ialy_mr'
                        ? 'Ialy MR (Mục II)'
                        : '2 Nhà máy tương ứng'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
