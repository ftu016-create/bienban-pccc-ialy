import React, { useState } from 'react';
import {
  Calendar,
  FileText,
  Clock,
  Trash2,
  Copy,
  Edit,
  Eye,
  Download,
  Plus,
  Search,
  CheckCircle2,
  Building2,
  Printer,
} from 'lucide-react';
import { ReportData, UserRole } from '../types';
import { exportReportToDocx } from '../services/exportDocx';

interface ReportHistoryListProps {
  reports: ReportData[];
  selectedId: string;
  onSelectReport: (report: ReportData) => void;
  onSelectAndEdit: (report: ReportData) => void;
  onSelectAndViewDetail: (report: ReportData) => void;
  onCreateNewReport: () => void;
  onDuplicateReport: (report: ReportData) => void;
  onDeleteReport: (id: string) => void;
  userRole?: UserRole;
  onOpenAdminLogin?: () => void;
  onPrintReport?: (report: ReportData) => void;
}

export const ReportHistoryList: React.FC<ReportHistoryListProps> = ({
  reports,
  selectedId,
  onSelectReport,
  onSelectAndEdit,
  onSelectAndViewDetail,
  onCreateNewReport,
  onDuplicateReport,
  onDeleteReport,
  userRole = 'viewer',
  onOpenAdminLogin,
  onPrintReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [reportToDelete, setReportToDelete] = useState<ReportData | null>(null);

  const filteredReports = reports.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.report_month.toLowerCase().includes(q) ||
      r.so.toLowerCase().includes(q) ||
      r.manager.toLowerCase().includes(q) ||
      r.inspection_areas.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Lịch sử các kỳ lập Biên bản PCCC&CNCH</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp <strong>{reports.length}</strong> biên bản tự kiểm tra an toàn PCCC&CNCH theo định kỳ hàng tháng
          </p>
        </div>

        {userRole === 'admin' && (
          <button
            type="button"
            onClick={onCreateNewReport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Lập biên bản tháng mới</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm theo tháng (VD: 07/2026), số văn bản (1209/VHIALY), người ký..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
        />
      </div>

      {/* List of Reports */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">Không tìm thấy biên bản nào phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Thử nhập từ khóa khác hoặc tạo biên bản mới cho kỳ kiểm tra tháng này.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => {
            const isSelected = report.id === selectedId;
            return (
              <div
                key={report.id}
                className={`bg-white rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Card Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-200">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Tháng {report.report_month}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        Số: {report.so}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                    Biên bản tự kiểm tra PCCC&CNCH
                  </h3>

                  {report.attachments && report.attachments.length > 0 && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[11px] font-medium">
                      <span>📎</span>
                      <span>{report.attachments.length} tài liệu / ảnh hiện trường</span>
                    </div>
                  )}

                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Thời gian: {report.start_h}:{report.start_p} ngày {report.start_day}/{report.start_month}/{report.start_year}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500">
                      <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="line-clamp-1">{report.inspection_areas}</span>
                    </div>

                    <div className="text-slate-500 text-[11px]">
                      Người ký: <span className="font-semibold text-slate-800">{report.manager}</span> ({report.signer_role})
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* View Detail button */}
                    <button
                      type="button"
                      onClick={() => onSelectAndViewDetail(report)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                      title="Xem toàn bộ nội dung bản A4 và phụ lục"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem A4</span>
                    </button>

                    {/* Edit button */}
                    {userRole === 'admin' ? (
                      <button
                        type="button"
                        onClick={() => onSelectAndEdit(report)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Chỉnh sửa biên bản (Quyền Admin)"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                    ) : (
                      onOpenAdminLogin && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectReport(report);
                            onOpenAdminLogin();
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition cursor-pointer border border-amber-200"
                          title="Đăng nhập Admin để sửa biên bản này (mặc định: ialy2026)"
                        >
                          <Edit className="w-3.5 h-3.5 text-amber-700" />
                          <span>Sửa</span>
                        </button>
                      )
                    )}

                    {/* Quick export word */}
                    <button
                      type="button"
                      onClick={() => exportReportToDocx(report)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                      title="Tải nhanh file Word (.docx)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Word</span>
                    </button>

                    {/* Print / PDF quick button */}
                    {onPrintReport && (
                      <button
                        type="button"
                        onClick={() => onPrintReport(report)}
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title="Xem bản in A4 và tải PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {userRole === 'admin' && (
                    <div className="flex items-center gap-1">
                      {/* Duplicate */}
                      <button
                        type="button"
                        onClick={() => onDuplicateReport(report)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title="Tạo bản sao cho tháng tiếp theo"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      {reports.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setReportToDelete(report)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Xóa biên bản này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-app Confirmation Modal for deleting report */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Xác nhận xóa biên bản</h3>
                <p className="text-xs text-slate-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-5">
              Bạn có chắc chắn muốn xóa biên bản <strong>Tháng {reportToDelete.report_month}</strong> (Số: {reportToDelete.so || 'Chưa có số'})? Toàn bộ dữ liệu của biên bản này sẽ bị xóa khỏi hệ thống.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteReport(reportToDelete.id);
                  setReportToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-sm cursor-pointer"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
