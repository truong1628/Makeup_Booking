import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-6xl font-bold text-slate-900">404</h1>
        <h2 className="font-serif text-2xl font-bold text-slate-800">Trang Không Tồn Tại</h2>
        <p className="text-slate-500 text-xs sm:text-sm">
          Đường dẫn bạn truy cập hiện không tồn tại hoặc đã được thay đổi vị trí.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Trở Về Trang Chủ</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
