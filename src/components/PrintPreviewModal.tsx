import React, { useState } from 'react';
import { X, Printer, Download, ArrowLeft, Loader2, FileText } from 'lucide-react';
import { ReportData } from '../types';
import { exportReportToDocx } from '../services/exportDocx';
import { exportElementToPdf, generatePdfFilename } from '../services/exportPdf';
import { DocumentA4Content } from './DocumentA4Content';

interface PrintPreviewModalProps {
  report: ReportData;
  onClose: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ report, onClose }) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    exportReportToDocx(report);
  };

  const handleDownloadPdf = async () => {
    const docEl = document.getElementById('print-document');
    if (!docEl) return;
    try {
      setIsExportingPdf(true);
      const filename = generatePdfFilename(report);
      await exportElementToPdf(docEl, filename, report);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center overflow-y-auto print:static print:bg-white print:p-0">
      {/* Top Toolbar (Hidden when printing) */}
      <div className="sticky top-0 z-10 w-full bg-[#17365d] text-white px-4 py-3 shadow-lg flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
          <span className="font-bold text-sm hidden sm:inline ml-2 text-blue-100">
            Xem trước văn bản Mẫu PC02
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            title="Tải trực tiếp file PDF về máy tính"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>{isExportingPdf ? 'Đang tạo PDF...' : 'Tải file PDF'}</span>
          </button>

          <button
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#218838] hover:bg-[#1e7e34] text-white rounded text-sm font-semibold shadow-sm transition-colors"
            title="Tải văn bản Word (.docx)"
          >
            <Download className="w-4 h-4" />
            <span>Tải Word (.docx)</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold shadow-sm transition-colors"
            title="In qua hộp thoại máy in hoặc lưu PDF hệ điều hành"
          >
            <Printer className="w-4 h-4" />
            <span>In ấn</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* A4 Sheet Container */}
      <div className="w-full py-8 flex justify-center print:py-0">
        <DocumentA4Content report={report} id="print-document" />
      </div>
    </div>
  );
};
