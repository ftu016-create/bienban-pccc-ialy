import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Polyfill Promise.withResolvers for older iOS Safari, Chrome, and office browsers
if (typeof (Promise as any).withResolvers === 'undefined') {
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RootErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border border-slate-200">
            <div className="w-14 h-14 mx-auto mb-4 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center font-bold text-2xl">
              !
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Khởi động ứng dụng
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Đang tải lại dữ liệu biên bản PCCC Thủy điện Ialy. Vui lòng bấm nút bên dưới để khôi phục nhanh:
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('pccc_ialy_reports_v1');
                  } catch (e) {
                    // Ignore
                  }
                  window.location.reload();
                }}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition"
              >
                Khôi phục dữ liệu mặc định & Tải lại
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Tải lại trang ngay
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>
);
