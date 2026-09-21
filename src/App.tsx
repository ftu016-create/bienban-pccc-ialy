import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  Download,
  Printer,
  Sparkles,
  Users,
  Shield,
  ShieldAlert,
  Lock,
  Unlock,
  CheckCircle2,
  Calendar,
  Eye,
  Edit3,
  Globe,
  Plus,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import { ReportData, UserRole } from './types';
import { storageService } from './services/storage';
import { adminAuthService } from './services/adminAuth';
import { exportReportToDocx } from './services/exportDocx';
import { subscribeToSharedReports } from './lib/firebase';

// Components
import { ReportForm } from './components/ReportForm';
import { ReportDetailView } from './components/ReportDetailView';
import { ReportHistoryList } from './components/ReportHistoryList';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { AdminPinModal } from './components/AdminPinModal';
import { StaffManagerModal } from './components/StaffManagerModal';
import { DeployVercelModal } from './components/DeployVercelModal';
import { InspectionDataScannerModal } from './components/InspectionDataScannerModal';

export default function App() {
  // State: Reports and current selection
  const [reports, setReports] = useState<ReportData[]>(() => storageService.getReports());
  const [currentId, setCurrentId] = useState<string>(() => {
    const all = storageService.getReports();
    return all.length > 0 ? all[0].id : '';
  });

  // User Role & Auth
  const [userRole, setUserRole] = useState<UserRole>(() => adminAuthService.getRole());
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Current active view: 'edit' | 'detail' | 'history'
  // Default view is 'detail' (Xem bản A4 hoàn chỉnh)
  const [activeView, setActiveView] = useState<'edit' | 'detail' | 'history'>('detail');

  // Strict role guard: Guest / Viewer mode cannot access 'edit' view
  useEffect(() => {
    if (userRole !== 'admin' && activeView === 'edit') {
      setActiveView('detail');
    }
  }, [userRole, activeView]);

  // Staff directory
  const [staffDirectory, setStaffDirectory] = useState<{ name: string; role: string }[]>(() =>
    storageService.getStaffDirectory()
  );

  // Other Modals
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showVercelModal, setShowVercelModal] = useState(false);

  // Sync with Firestore cloud and server on initial mount, plus real-time multi-device subscription
  useEffect(() => {
    storageService
      .fetchFromServer()
      .then((serverReports) => {
        if (serverReports && serverReports.length > 0) {
          setReports(serverReports);
          setCurrentId((prevId) => {
            if (prevId && serverReports.some((r) => r.id === prevId)) return prevId;
            return serverReports[0].id;
          });
        }
      })
      .catch((err) => {
        console.warn('Initial server sync notice:', err);
      });

    // Real-time listener: When another computer adds/updates a report, reflect it instantly!
    const unsub = subscribeToSharedReports((remoteReports) => {
      if (remoteReports && remoteReports.length > 0) {
        setReports(remoteReports);
        try {
          localStorage.setItem('pccc_ialy_reports_v1', JSON.stringify(remoteReports));
        } catch (_) {}
      }
    });

    return () => {
      unsub();
    };
  }, []);

  // Toast alert
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(
    null
  );

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Find current report
  const currentReport = reports.find((r) => r.id === currentId) || reports[0];

  // Report changes handler
  const handleReportChange = (updated: ReportData) => {
    const updatedReports = reports.map((r) => (r.id === updated.id ? updated : r));
    setReports(updatedReports);
  };

  // Save report (Admin can save anytime)
  const handleSaveReport = () => {
    if (currentReport) {
      storageService.saveReport(currentReport);
      showToast(`Đã lưu biên bản Tháng ${currentReport.report_month} thành công lên hệ thống máy chủ!`);
    }
  };

  // Create new report (Available to all users)
  const handleCreateNew = () => {
    const newRep = storageService.createNewMonthlyReport();
    setReports(storageService.getReports());
    setCurrentId(newRep.id);
    setActiveView('edit');
    showToast(`Đã tạo biên bản mới Tháng ${newRep.report_month}!`);
  };

  // Duplicate report
  const handleDuplicate = (report: ReportData) => {
    const dup = storageService.duplicateReport(report.id);
    if (dup) {
      setReports(storageService.getReports());
      setCurrentId(dup.id);
      setActiveView('edit');
      showToast(`Đã nhân bản biên bản sang bản sao mới!`);
    }
  };

  // Delete report (Strictly Admin only)
  const handleDelete = (id: string) => {
    if (userRole !== 'admin') {
      showToast('Chỉ Quản trị viên (Admin) mới có quyền xóa biên bản!', 'error');
      setShowAdminModal(true);
      return;
    }
    const updated = storageService.deleteReport(id);
    setReports(updated);
    if (currentId === id && updated.length > 0) {
      setCurrentId(updated[0].id);
    }
    showToast('Đã xóa biên bản.', 'info');
  };

  // Switch report
  const handleSelectReport = (report: ReportData) => {
    setCurrentId(report.id);
  };

  const handleSelectAndEdit = (report: ReportData) => {
    setCurrentId(report.id);
    setActiveView('edit');
  };

  const handleSelectAndViewDetail = (report: ReportData) => {
    setCurrentId(report.id);
    setActiveView('detail');
  };

  // Export word
  const handleExportWord = () => {
    if (!currentReport) return;
    exportReportToDocx(currentReport);
    showToast('Đang tải văn bản Word (.docx)...');
  };

  // Apply scanner analysis
  const handleApplyScanner = (updatedReport: ReportData, summary: string[]) => {
    handleReportChange(updatedReport);
    storageService.saveReport(updatedReport);
    showToast(`Đã áp dụng ${summary.length} nội dung kiểm tra vào biên bản!`, 'success');
  };

  // Admin Logout
  const handleAdminLogout = () => {
    adminAuthService.logout();
    setUserRole('viewer');
    setActiveView('history');
    showToast('Đã thoát chế độ Quản trị. Đang ở giao diện Khách xem lịch sử.', 'info');
  };

  const handlePrintSpecificReport = (report: ReportData) => {
    setCurrentId(report.id);
    setShowPrintModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* ================= STICKY TOP NAVBAR ================= */}
      <header className="sticky top-0 z-40 bg-[#17365d] text-white shadow-md">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: Brand / Title */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
                <FileText className="w-5 h-5 text-amber-400" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-sm sm:text-base tracking-tight text-white truncate">
                    BIÊN BẢN TỰ KIỂM TRA PCCC&CNCH
                  </h1>
                  <span className="hidden md:inline-block text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-400/30 shrink-0">
                    MẪU PC02
                  </span>
                </div>
                <p className="text-[11px] text-blue-200 truncate">
                  Công ty Thủy điện Ialy • NMTĐ Ialy & Ialy Mở rộng
                </p>
              </div>
            </div>

            {/* Center: View Switcher Tabs */}
            <nav className="hidden lg:flex items-center bg-black/20 p-1 rounded-xl border border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveView('detail')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                  activeView === 'detail'
                    ? 'bg-white text-[#17365d] shadow-xs font-bold'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem bản A4 hoàn chỉnh</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('history')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                  activeView === 'history'
                    ? 'bg-white text-[#17365d] shadow-xs font-bold'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Lịch sử các kỳ ({reports.length})</span>
              </button>
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Quick Scanner Shortcut: Admin only */}
              {userRole === 'admin' && (
                <button
                  type="button"
                  onClick={() => setShowScannerModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:from-amber-700 active:to-amber-800 text-slate-950 rounded-xl text-xs font-black shadow-xs transition cursor-pointer"
                  title="Quét file dữ liệu kiểm tra và bóc tách theo nhà máy"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Quét file Bảng II</span>
                </button>
              )}

              {/* Word Export */}
              <button
                type="button"
                onClick={handleExportWord}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                title="Xuất file Word (.docx) chuẩn Mẫu PC02"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tải Word</span>
              </button>

              {/* Print / PDF preview */}
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                title="Xem bản in A4 và tải PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">In / PDF</span>
              </button>

              {/* Staff Directory Manager: Admin only */}
              {userRole === 'admin' && (
                <button
                  type="button"
                  onClick={() => setShowStaffModal(true)}
                  className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                  title="Quản lý danh sách đoàn kiểm tra"
                >
                  <Users className="w-4 h-4" />
                </button>
              )}

              {/* Vercel CI/CD Deploy Info: Admin only */}
              {userRole === 'admin' && (
                <button
                  type="button"
                  onClick={() => setShowVercelModal(true)}
                  className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                  title="Cấu hình Vercel & GitHub tự động"
                >
                  <Globe className="w-4 h-4" />
                </button>
              )}

              <div className="h-5 w-px bg-white/20 hidden sm:block" />

              {/* Admin Role Toggle */}
              {userRole === 'admin' ? (
                <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 rounded-xl px-2.5 py-1 text-xs">
                  <Shield className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="hidden md:inline font-bold">Admin</span>
                  <button
                    type="button"
                    onClick={handleAdminLogout}
                    className="ml-1 text-[11px] underline hover:text-white cursor-pointer"
                    title="Đăng xuất chế độ Admin, trở về giao diện khách"
                  >
                    Thoát
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAdminModal(true)}
                  className="inline-flex items-center gap-1.5 bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border border-amber-400/50 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer shadow-xs"
                  title="Đăng nhập Quản trị viên để soạn thảo và lưu báo cáo"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>Đăng nhập Admin</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile View Switcher Bar */}
          <div className="flex lg:hidden items-center justify-around py-2 border-t border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveView('detail')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${
                activeView === 'detail' ? 'bg-white text-[#17365d] font-bold' : 'text-blue-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Bản A4</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('history')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${
                activeView === 'history' ? 'bg-white text-[#17365d] font-bold' : 'text-blue-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Lịch sử ({reports.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= SECONDARY MONTH BAR ================= */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 shadow-2xs">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kỳ biên bản:
            </span>
            <select
              value={currentId}
              onChange={(e) => setCurrentId(e.target.value)}
              className="px-3 py-1 text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100/70"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  Tháng {r.report_month} - Số: {r.so} ({r.place})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {userRole === 'admin' ? (
              <>
                {activeView === 'edit' && (
                  <button
                    type="button"
                    onClick={handleSaveReport}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                    title="Lưu thay đổi lên máy chủ trung tâm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu thay đổi</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition cursor-pointer"
                  title="Lập biên bản cho kỳ tháng mới"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tháng mới</span>
                </button>
              </>
            ) : (
              activeView === 'detail' && (
                <button
                  type="button"
                  onClick={() => setActiveView('history')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition cursor-pointer"
                  title="Quay lại danh sách lịch sử các kỳ biên bản"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại Lịch sử</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* ================= TOAST NOTIFICATION ================= */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : toast.type === 'error'
              ? 'bg-rose-900 text-rose-100 border-rose-700'
              : 'bg-slate-900 text-slate-100 border-slate-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 pb-16">
        {activeView === 'edit' && currentReport && userRole === 'admin' && (
          <ReportForm
            data={currentReport}
            onChange={handleReportChange}
            onSave={handleSaveReport}
            onViewDetail={() => setActiveView('detail')}
            onExportWord={handleExportWord}
            onPreviewPrint={() => setShowPrintModal(true)}
            onOpenScanner={() => setShowScannerModal(true)}
            staffDirectory={staffDirectory}
            userRole={userRole}
            onOpenAdminLogin={() => setShowAdminModal(true)}
          />
        )}

        {activeView === 'detail' && currentReport && (
          <ReportDetailView
            report={currentReport}
            onEdit={() => setActiveView('edit')}
            onBackToHistory={() => setActiveView('history')}
            onExportWord={handleExportWord}
            onPrint={() => setShowPrintModal(true)}
            userRole={userRole}
            onOpenAdminLogin={() => setShowAdminModal(true)}
          />
        )}

        {activeView === 'history' && (
          <ReportHistoryList
            reports={reports}
            selectedId={currentId}
            onSelectReport={handleSelectReport}
            onSelectAndEdit={handleSelectAndEdit}
            onSelectAndViewDetail={handleSelectAndViewDetail}
            onCreateNewReport={handleCreateNew}
            onDuplicateReport={handleDuplicate}
            onDeleteReport={handleDelete}
            userRole={userRole}
            onOpenAdminLogin={() => setShowAdminModal(true)}
            onPrintReport={handlePrintSpecificReport}
            onImportReports={(imported) => {
              setReports(imported);
              if (imported.length > 0) {
                setCurrentId(imported[0].id);
              }
            }}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* ================= MODALS ================= */}
      {/* 1. Print / PDF Modal */}
      {showPrintModal && currentReport && (
        <PrintPreviewModal report={currentReport} onClose={() => setShowPrintModal(false)} />
      )}

      {/* 2. Admin PIN Auth Modal */}
      {showAdminModal && (
        <AdminPinModal
          onSuccess={() => {
            setUserRole('admin');
            setShowAdminModal(false);
            setActiveView('edit');
            showToast('Đăng nhập Quản trị viên thành công! Bạn có toàn quyền soạn thảo và lưu.', 'success');
          }}
          onClose={() => setShowAdminModal(false)}
        />
      )}

      {/* 3. Inspection Data Scanner Modal */}
      {showScannerModal && currentReport && (
        <InspectionDataScannerModal
          currentReport={currentReport}
          onApply={handleApplyScanner}
          onClose={() => setShowScannerModal(false)}
        />
      )}

      {/* 4. Staff Directory Modal */}
      {showStaffModal && (
        <StaffManagerModal
          onClose={() => setShowStaffModal(false)}
          onUpdate={() => setStaffDirectory(storageService.getStaffDirectory())}
        />
      )}

      {/* 5. Vercel CI/CD Deploy Info Modal */}
      {showVercelModal && <DeployVercelModal onClose={() => setShowVercelModal(false)} />}
    </div>
  );
}
