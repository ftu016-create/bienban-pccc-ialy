import React, { useState } from 'react';
import { ReportData, UserRole } from '../types';
import { Printer, Download, Edit3, ArrowLeft, ZoomIn, ZoomOut, FileText, Loader2, Lock } from 'lucide-react';
import { exportElementToPdf, generatePdfFilename } from '../services/exportPdf';
import { DocumentA4Content } from './DocumentA4Content';

interface ReportDetailViewProps {
  report: ReportData;
  onEdit: () => void;
  onBackToHistory?: () => void;
  onExportWord: () => void;
  onPrint: () => void;
  userRole?: UserRole;
  onOpenAdminLogin?: () => void;
}

export const ReportDetailView: React.FC<ReportDetailViewProps> = ({
  report,
  onEdit,
  onBackToHistory,
  onExportWord,
  onPrint,
  userRole = 'viewer',
  onOpenAdminLogin,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    const docEl = document.getElementById('detail-document-canvas');
    if (!docEl) return;
    try {
      setIsExportingPdf(true);
      // Temporarily remove scale transform for sharp 1:1 capture
      const prevTransform = docEl.style.transform;
      docEl.style.transform = 'none';
      const filename = generatePdfFilename(report);
      await exportElementToPdf(docEl, filename, report);
      docEl.style.transform = prevTransform;
    } catch (err) {
      console.error('Error downloading PDF from detail view:', err);
      onPrint();
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-4 font-sans">
      {/* Action Bar Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {onBackToHistory && (
            <button
              onClick={onBackToHistory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition cursor-pointer"
              title="Quay lại danh sách lịch sử biên bản các tháng"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại Lịch sử</span>
            </button>
          )}

          {userRole === 'admin' ? (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition cursor-pointer"
              title="Quay lại giao diện soạn thảo biên bản"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Chỉnh sửa biên bản</span>
            </button>
          ) : (
            onOpenAdminLogin && (
              <button
                onClick={onOpenAdminLogin}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition cursor-pointer shadow-xs"
                title="Nhập mã PIN Admin để chỉnh sửa biên bản này (mặc định: ialy2026)"
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Đăng nhập Admin để sửa</span>
              </button>
            )
          )}

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
            <span className="font-bold text-slate-800">Biên bản Tháng {report.report_month}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom controls */}
          <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setZoom((z) => Math.max(75, z - 10))}
              className="p-1.5 hover:bg-white rounded text-slate-600 cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-600">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(125, z + 10))}
              className="p-1.5 hover:bg-white rounded text-slate-600 cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Direct Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-sm shadow-rose-500/25 transition cursor-pointer disabled:opacity-50"
            title="Tải trực tiếp file PDF chuẩn A4 về máy tính"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>{isExportingPdf ? 'Đang tạo PDF...' : 'Tải file PDF'}</span>
          </button>

          <button
            onClick={onExportWord}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm shadow-blue-500/25 transition cursor-pointer"
            title="Xuất file Word (.docx) chuẩn theo quy định"
          >
            <Download className="w-4 h-4" />
            <span>Tải Word (.docx)</span>
          </button>

          <button
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition shadow-2xs cursor-pointer"
            title="In trực tiếp qua trình duyệt"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>In ấn</span>
          </button>
        </div>
      </div>

      {/* Document View Frame */}
      <div className="overflow-x-auto pb-6 flex justify-center">
        <DocumentA4Content
          report={report}
          id="detail-document-canvas"
          className="rounded-2xl border border-slate-300 origin-top transition-transform duration-150"
          style={{
            transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
          }}
        />
      </div>
    </div>
  );
};
