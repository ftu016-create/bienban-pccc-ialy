import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Trash2,
  Download,
  Eye,
  Plus,
  Loader2,
  Lock,
  Edit3,
  Check,
  Building2,
  MapPin,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { AttachmentItem, ReportData, UserRole } from '../types';
import { attachmentService } from '../services/attachmentService';

interface InspectionMediaUploaderProps {
  report: ReportData;
  userRole: UserRole;
  onUpdateReport: (updatedReport: ReportData) => void;
  onAddRecommendation?: (text: string) => void;
}

export const InspectionMediaUploader: React.FC<InspectionMediaUploaderProps> = ({
  report,
  userRole,
  onUpdateReport,
  onAddRecommendation,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Deletion confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filtering state
  const [filterType, setFilterType] = useState<'all' | 'image' | 'pdf'>('all');
  const [filterPlant, setFilterPlant] = useState<'all' | 'ialy' | 'ialy_mr'>('all');

  // AI analysis loading tracker: attachmentId -> boolean
  const [analyzingIds, setAnalyzingIds] = useState<Record<string, boolean>>({});

  // Editing description inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Preview modal for images/PDFs
  const [previewItem, setPreviewItem] = useState<AttachmentItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const canEdit = userRole === 'admin';

  const attachments = report.attachments || [];

  const filteredAttachments = attachments.filter((att) => {
    if (filterType !== 'all' && att.fileType !== filterType) return false;
    if (filterPlant !== 'all' && att.plant !== filterPlant) return false;
    return true;
  });

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!canEdit) {
      setUploadError('Biên bản đã hoàn tất và bị khóa. Chỉ Quản trị viên (ADMIN) mới có quyền thêm tài liệu.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const fileList = Array.from(files);
    const result = await attachmentService.uploadAttachments(report.id, fileList, {
      targetType: 'inspection_finding',
      plant: 'ialy',
    });

    setIsUploading(false);

    if (result.success) {
      const updatedList = [...attachments, ...result.attachments];
      const updatedReport: ReportData = {
        ...report,
        attachments: updatedList,
      };
      onUpdateReport(updatedReport);
      setUploadSuccess(`Đã tải lên và đính kèm ${result.attachments.length} tệp thành công.`);
      setTimeout(() => setUploadSuccess(null), 4000);
    } else {
      setUploadError(result.error || 'Lỗi khi tải tệp.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (attId: string) => {
    if (!canEdit) return;
    setConfirmDeleteId(null);

    const res = await attachmentService.deleteAttachment(report.id, attId);
    if (res.success) {
      const updatedList = attachments.filter((a) => a.id !== attId);
      onUpdateReport({ ...report, attachments: updatedList });
    } else {
      setUploadError(res.error || 'Không thể xóa tệp.');
    }
  };

  const handleSaveDescription = async (attId: string) => {
    const res = await attachmentService.updateAttachment(report.id, attId, {
      description: editingText.trim(),
    });
    if (res.success && res.attachment) {
      const updatedList = attachments.map((a) => (a.id === attId ? res.attachment! : a));
      onUpdateReport({ ...report, attachments: updatedList });
    }
    setEditingId(null);
  };

  const handleAnalyzeAi = async (att: AttachmentItem) => {
    if (att.fileType !== 'image') return;

    setAnalyzingIds((prev) => ({ ...prev, [att.id]: true }));
    try {
      const result = await attachmentService.analyzeWithAi({
        reportId: report.id,
        attachmentId: att.id,
        targetCategory: att.targetCategory,
        plant: att.plant,
        locationDescription: att.locationDescription,
        userDescription: att.description,
      });

      if (result.success && result.analysis) {
        const updatedList = attachments.map((a) =>
          a.id === att.id ? { ...a, aiAnalysis: result.analysis } : a
        );
        onUpdateReport({ ...report, attachments: updatedList });
      } else {
        alert(result.error || 'Phân tích AI không thành công.');
      }
    } catch (e: any) {
      alert(e?.message || 'Lỗi kết nối dịch vụ phân tích AI.');
    } finally {
      setAnalyzingIds((prev) => ({ ...prev, [att.id]: false }));
    }
  };

  const handleApplyAiRecommendation = (att: AttachmentItem) => {
    if (!att.aiAnalysis?.recommendation) return;
    if (onAddRecommendation) {
      const rec = `[${att.plant === 'ialy_mr' ? 'Ialy Mở rộng' : 'Ialy'} - ${att.locationDescription || att.targetCategory || 'Hiện trường'}]: ${att.aiAnalysis.recommendation}`;
      onAddRecommendation(rec);
      alert('Đã thêm kiến nghị từ AI vào mục II. Kiến nghị của Biên bản!');
    }
  };

  return (
    <div id="inspection-media-section" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">Tài liệu & Hình ảnh Kiểm tra Hiện trường</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              {attachments.length} tệp
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Lưu trữ trực tiếp trên máy chủ tập trung (dùng chung cho mọi máy tính, tự động nhúng vào file Word và PDF khi xuất).
          </p>
        </div>
      </div>

      {/* Upload Zone (Only if authorized) */}
      {canEdit ? (
        <div className="mt-6 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileSelect(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-1">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <UploadCloud className="w-6 h-6" />
                )}
              </div>

              <div className="text-slate-700 font-medium">
                Kéo thả nhiều ảnh chụp hiện trường hoặc tệp PDF vào đây, hoặc{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 underline font-semibold focus:outline-none"
                  disabled={isUploading}
                >
                  chọn từ máy tính
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Hỗ trợ chọn cùng lúc nhiều file: JPG, PNG, WEBP (ảnh chụp PCCC) và PDF (sơ đồ, hồ sơ kiểm định). Tối đa 100MB/tệp.
              </p>
            </div>
          </div>

          {/* Feedback messages */}
          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400" />
          <span>
            Biên bản đang ở trạng thái Hoàn tất. Để thêm ảnh hoặc sửa tài liệu, vui lòng đăng nhập quyền <strong>Quản trị viên (ADMIN)</strong>.
          </span>
        </div>
      )}

      {/* Filter and List Section */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          {/* Type filters */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium mr-1">Lọc:</span>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({attachments.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('image')}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                filterType === 'image'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hình ảnh ({attachments.filter((a) => a.fileType === 'image').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('pdf')}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                filterType === 'pdf'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tài liệu PDF ({attachments.filter((a) => a.fileType === 'pdf').length})
            </button>
          </div>

          {/* Plant filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Nhà máy:</span>
            <select
              value={filterPlant}
              onChange={(e) => setFilterPlant(e.target.value as any)}
              className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-700"
            >
              <option value="all">Toàn bộ (Ialy & Ialy MR)</option>
              <option value="ialy">NMTĐ Ialy</option>
              <option value="ialy_mr">NMTĐ Ialy Mở rộng</option>
            </select>
          </div>
        </div>

        {/* Attachment Cards Grid */}
        {filteredAttachments.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <ImageIcon className="w-10 h-10 mx-auto stroke-[1.5] mb-2 opacity-50" />
            <p className="text-sm font-medium">Chưa có tệp đính kèm nào theo bộ lọc</p>
            <p className="text-xs text-slate-400 mt-1">
              Hãy tải lên các hình ảnh kiểm tra và tài liệu PDF để tự động tạo phụ lục hoàn chỉnh khi xuất báo cáo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {filteredAttachments.map((att, idx) => {
              const isPdf = att.fileType === 'pdf';
              const fileUrl = attachmentService.getAttachmentViewUrl(att);
              const downloadUrl = attachmentService.getAttachmentDownloadUrl(report.id, att.id);
              const isAnalyzing = analyzingIds[att.id];
              const ai = att.aiAnalysis;

              return (
                <div
                  key={att.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  {/* Media Preview Box */}
                  <div className="relative bg-slate-100 aspect-video flex items-center justify-center overflow-hidden border-b border-slate-100 group">
                    {isPdf ? (
                      <div className="flex flex-col items-center justify-center p-4 text-rose-600">
                        <FileText className="w-12 h-12 stroke-[1.5]" />
                        <span className="text-xs font-semibold mt-1 uppercase tracking-wider text-rose-700">
                          Tài liệu PDF
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 max-w-[200px] truncate">
                          {att.fileName}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={fileUrl}
                        alt={att.description || att.fileName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    )}

                    {/* Type Badges */}
                    {isPdf && (
                      <div className="absolute top-2 left-2 flex gap-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white shadow-xs">
                          PDF
                        </span>
                      </div>
                    )}

                    {/* View Action Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewItem(att)}
                        className="p-2 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow transition-transform hover:scale-110"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <a
                        href={downloadUrl}
                        download={att.fileName}
                        className="p-2 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow transition-transform hover:scale-110"
                        title="Tải về máy tính"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Location description (if any) */}
                      {att.locationDescription && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2 truncate">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{att.locationDescription}</span>
                        </div>
                      )}

                      {/* Description (Editable) */}
                      {editingId === att.id ? (
                        <div className="flex items-center gap-1 my-1.5">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="flex-1 text-xs border border-blue-400 rounded px-2 py-1 focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveDescription(att.id)}
                            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            title="Lưu"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-1 group/desc my-1">
                          <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                            {att.description || att.fileName}
                          </p>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(att.id);
                                setEditingText(att.description || att.fileName);
                              }}
                              className="text-slate-400 hover:text-blue-600 opacity-0 group-hover/desc:opacity-100 transition-opacity p-0.5"
                              title="Sửa tiêu đề"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        {Math.round(att.fileSize / 1024)} KB
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Delete Button */}
                        {canEdit && (
                          confirmDeleteId === att.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                              <span className="text-[10px] text-rose-700 font-semibold">Xóa?</span>
                              <button
                                type="button"
                                onClick={() => handleDelete(att.id)}
                                className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded hover:bg-rose-700 font-bold"
                              >
                                Có
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded hover:bg-slate-300"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(att.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Xóa tệp"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  {previewItem.description || previewItem.fileName}
                </h3>
                <p className="text-xs text-slate-500">
                  {previewItem.plant === 'ialy_mr' ? 'NMTĐ Ialy Mở rộng' : 'NMTĐ Ialy'} •{' '}
                  {previewItem.locationDescription || 'Hiện trường'} •{' '}
                  {previewItem.targetCategory}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={attachmentService.getAttachmentDownloadUrl(report.id, previewItem.id)}
                  download={previewItem.fileName}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải xuống</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-slate-900/5 flex items-center justify-center min-h-[400px]">
              {previewItem.fileType === 'pdf' ? (
                <iframe
                  src={attachmentService.getAttachmentViewUrl(previewItem)}
                  className="w-full h-[65vh] border-0 rounded"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={attachmentService.getAttachmentViewUrl(previewItem)}
                  alt="Full preview"
                  className="max-h-[65vh] max-w-full object-contain rounded shadow"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
