import React, { useState } from 'react';
import {
  X,
  Globe,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  CheckCircle2,
  ArrowRight,
  Zap,
  Cloud,
  Code2,
  FileCode2,
} from 'lucide-react';

interface DeployVercelModalProps {
  onClose: () => void;
}

export const DeployVercelModal: React.FC<DeployVercelModalProps> = ({ onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const gitCommands = `git init
git add .
git commit -m "feat: Bien ban PCCC Ialy & Ialy MR"
git branch -M main
git remote add origin https://github.com/<tai-khoan-github>/bien-ban-pccc-ialy.git
git push -u origin main`;

  const vercelConfigJson = `{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}`;

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => {
      setCopiedSection(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight flex items-center gap-2">
                <span>Tự Động Liên Kết Vercel & GitHub</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  CI/CD Tự Động
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Đưa ứng dụng lên tên miền Vercel riêng, tự động đồng bộ mã nguồn mỗi khi cập nhật
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Status banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900">
              <strong className="font-bold text-sm block mb-0.5">
                Cấu hình Vercel đã sẵn sàng 100%!
              </strong>
              <span>
                Hệ thống đã tự động tạo sẵn file <code>vercel.json</code> và chuẩn bị cấu hình build Vite để khi anh kết nối vào Vercel, ứng dụng sẽ chạy ngay lập tức mà không cần chỉnh sửa bất kỳ tham số nào.
              </span>
            </div>
          </div>

          {/* Step 1: Export to GitHub */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                  1
                </span>
                <h4 className="font-bold text-sm text-slate-900">
                  Xuất mã nguồn sang GitHub
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                Từ Google AI Studio
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed pl-8">
              Để đưa code lên GitHub một cách tự động, anh thực hiện:
            </p>

            <div className="ml-8 bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-700 space-y-1.5">
              <p className="flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Nhấp vào menu <strong>Cài đặt (Settings)</strong> hoặc biểu tượng <strong>Chia sẻ / Xuất (Export)</strong> ở góc trên bên phải màn hình AI Studio.</span>
              </p>
              <p className="flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Chọn <strong>"Export to GitHub"</strong>. Đăng nhập tài khoản GitHub của anh và đặt tên kho lưu trữ (ví dụ: <code>bien-ban-pccc-ialy</code>).</span>
              </p>
              <p className="flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Toàn bộ mã nguồn kèm lịch sử thay đổi sẽ tự động chuyển sang tài khoản GitHub của anh.</span>
              </p>
            </div>
          </div>

          {/* Step 2: Connect with Vercel */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
                  2
                </span>
                <h4 className="font-bold text-sm text-slate-900">
                  Kết nối Vercel với GitHub Repository
                </h4>
              </div>
              <a
                href="https://vercel.com/new"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1 rounded-lg transition shadow-xs"
              >
                <span>Mở Vercel.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="ml-8 space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>Thực hiện các bước cực kỳ đơn giản trên Vercel:</p>
              <ol className="list-decimal list-inside space-y-1 bg-white border border-slate-200 rounded-lg p-3 text-slate-700">
                <li>Truy cập <strong>vercel.com</strong> và bấm <strong>"Continue with GitHub"</strong>.</li>
                <li>Bấm nút <strong>"Add New..."</strong> ở góc phải ➔ Chọn <strong>"Project"</strong>.</li>
                <li>Tìm và bấm <strong>"Import"</strong> vào kho lưu trữ GitHub vừa tạo ở Bước 1.</li>
                <li>Bấm nút <strong>"Deploy"</strong> (Các thông số Vite và file <code>vercel.json</code> đã được nhận dạng tự động).</li>
              </ol>
            </div>
          </div>

          {/* Step 3: CI/CD Benefits */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                  3
                </span>
                <h4 className="font-bold text-sm text-slate-900">
                  Tự Động Đồng Bộ (CI/CD) Mọi Lúc
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Tự động 100%
              </span>
            </div>

            <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tự động cập nhật web</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Mỗi khi anh xuất code mới từ AI Studio lên GitHub, Vercel sẽ tự động build lại website chỉ trong 30 giây.
                </p>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  <span>Tên miền riêng & Miễn phí</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Được cấp link trực tuyến vĩnh viễn (dạng <code>ten-app.vercel.app</code>) có bảo mật HTTPS, truy cập siêu nhanh từ điện thoại và máy tính.
                </p>
              </div>
            </div>
          </div>

          {/* Optional: CLI commands if user wants manual git */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-600" />
                <span>Hoặc đẩy code bằng lệnh Git từ máy tính (Tùy chọn)</span>
              </h5>
              <button
                type="button"
                onClick={() => copyToClipboard(gitCommands, 'git')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 transition"
              >
                {copiedSection === 'git' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Sao chép lệnh Git</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed">
              {gitCommands}
            </pre>
          </div>

          {/* File vercel.json info */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-slate-600" />
                <span>Nội dung file <code>vercel.json</code> đã thiết lập</span>
              </h5>
              <button
                type="button"
                onClick={() => copyToClipboard(vercelConfigJson, 'vercel')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 transition"
              >
                {copiedSection === 'vercel' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed">
              {vercelConfigJson}
            </pre>
          </div>
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
            <a
              href="https://github.com/new"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition"
            >
              <span>Mở GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow-md"
            >
              <Globe className="w-3.5 h-3.5 text-white" />
              <span>Mở Vercel Deploy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
