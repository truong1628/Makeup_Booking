import React, { useEffect } from 'react';
import { LogOut, X } from 'lucide-react';

const LogoutConfirmModal = ({ isOpen, onConfirm, onCancel }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDarkContext =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/artist'));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl border transition-all ${
          isDarkContext
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-100 text-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCancel}
          className={`absolute top-4 right-4 p-1.5 rounded-xl transition-colors cursor-pointer ${
            isDarkContext
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
            <LogOut className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold">Bạn chắc chắn muốn đăng xuất?</h3>
            <p className={`text-xs leading-relaxed ${isDarkContext ? 'text-slate-400' : 'text-slate-500'}`}>
              Phiên đăng nhập hiện tại sẽ kết thúc. Bạn sẽ cần đăng nhập lại để sử dụng các tính năng cá nhân.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full pt-2">
            <button
              type="button"
              onClick={onCancel}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDarkContext
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={onConfirm}
              id="btn-confirm-logout"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-rose-500/25 transition-all cursor-pointer active:scale-95"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;

