import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  X,
  CheckCircle2,
  AlertCircle,
  Key,
  RefreshCw,
} from 'lucide-react';
import { adminAuthService } from '../services/adminAuth';

interface AdminPinModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'change_pin';
  mode?: 'login' | 'change_pin';
  onChangePinClick?: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen = true,
  onClose,
  onSuccess,
  initialMode = 'login',
  mode: propMode,
}) => {
  const [mode, setMode] = useState<'login' | 'change_pin'>(propMode || initialMode);
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Change PIN states
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Fetch freshest PIN from cloud whenever modal opens so other machine updates are immediate
  React.useEffect(() => {
    if (isOpen) {
      adminAuthService.fetchRemotePin(true);
    }
  }, [isOpen]);

  // Sync mode if prop changes
  React.useEffect(() => {
    if (propMode) {
      setMode(propMode);
    } else if (initialMode) {
      setMode(initialMode);
    }
  }, [propMode, initialMode]);

  // Handle ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleResetModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isOpen === false) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('Vui lòng nhập mã PIN Admin.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const isValid = await adminAuthService.verifyPinAsync(pin.trim());
      if (isValid) {
        setErrorMsg('');
        setSuccessMsg('Xác thực quyền Admin thành công!');
        adminAuthService.setUserRole('admin');
        setTimeout(() => {
          setSuccessMsg('');
          setPin('');
          onSuccess();
        }, 400);
      } else {
        setErrorMsg('Mã PIN không chính xác. Vui lòng kiểm tra lại!');
      }
    } catch (err) {
      setErrorMsg('Lỗi kiểm tra mã PIN. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPin) {
      setErrorMsg('Vui lòng nhập mã PIN hiện tại.');
      return;
    }
    if (newPin.length < 4) {
      setErrorMsg('Mã PIN mới phải từ 4 ký tự trở lên.');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg('Xác nhận mã PIN mới không khớp.');
      return;
    }

    setIsSubmitting(true);
    const res = await adminAuthService.updatePin(oldPin, newPin);
    setIsSubmitting(false);

    if (res.success) {
      setErrorMsg('');
      setSuccessMsg(res.message);
      setTimeout(() => {
        setSuccessMsg('');
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
        setMode('login');
      }, 1500);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleResetModal = () => {
    setPin('');
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setErrorMsg('');
    setSuccessMsg('');
    setMode('login');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#17365d] px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/30">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                {mode === 'login' ? 'Xác thực Quản trị viên (Admin)' : 'Đổi mã PIN Quản trị viên'}
              </h3>
              <p className="text-[11px] text-blue-200">
                {mode === 'login' ? 'Quyền soạn thảo & chỉnh sửa biên bản PCCC' : 'Cập nhật mã PIN & đồng bộ các máy'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetModal}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5">
          {/* Notifications */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  Chế độ phân quyền ATVSLĐ & PCCC:
                </p>
                <p>
                  • <strong>Đồng nghiệp:</strong> Chỉ xem lịch sử, xem chi tiết A4, tải PDF và xuất Word.
                </p>
                <p>
                  • <strong>Admin:</strong> Có quyền thêm mới, chỉnh sửa nội dung, danh sách đoàn và lưu biên bản.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  <span>Nhập mã PIN Admin:</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="Nhập mã PIN Quản trị viên"
                    autoComplete="current-password"
                    autoFocus
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 focus:bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden font-mono tracking-wider transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showPassword ? 'Ẩn mã PIN' : 'Hiện mã PIN'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    setMode('change_pin');
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Đổi mã PIN mới?</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetModal}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Shield className="w-3.5 h-3.5" />
                    )}
                    <span>{isSubmitting ? 'Đang kiểm tra...' : 'Đăng nhập Admin'}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePinSubmit} className="space-y-3.5">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800 leading-relaxed">
                <div className="font-bold flex items-center gap-1 mb-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Đồng bộ tức thì:
                </div>
                Khi đổi mã PIN tại đây, hệ thống sẽ tự động đồng bộ mã PIN mới cho tất cả các máy tính và điện thoại khác.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã PIN hiện tại:
                </label>
                <input
                  type="password"
                  value={oldPin}
                  onChange={(e) => {
                    setOldPin(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Nhập mã PIN cũ"
                  autoFocus
                  className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã PIN mới (ít nhất 4 ký tự):
                </label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => {
                    setNewPin(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Nhập mã PIN mới"
                  className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Xác nhận mã PIN mới:
                </label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => {
                    setConfirmPin(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Nhập lại mã PIN mới"
                  className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    setMode('login');
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  ← Quay lại đăng nhập
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <KeyRound className="w-3.5 h-3.5" />
                  )}
                  <span>{isSubmitting ? 'Đang lưu & đồng bộ...' : 'Đổi mã PIN'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
