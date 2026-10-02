import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  Palette, Calendar, Clock, User, LogOut, ArrowLeft, 
  Menu, X, Sparkles, CheckCircle2, ChevronRight, Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authStorage } from '../utils/authStorage';

const ArtistLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Đọc quyền trực tiếp từ claims JWT Token
  const tokenValid = authStorage.isAuthenticated();
  const jwtRole = authStorage.getRole();

  if (!tokenValid || (jwtRole !== 'ROLE_ARTIST' && jwtRole !== 'ROLE_ADMIN')) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Ca Làm Việc Của Tôi',
      path: '/artist',
      icon: Briefcase,
      exact: true,
    },
    {
      name: 'Bộ Sưu Tập Tác Phẩm',
      path: '/artist/collections',
      icon: Sparkles,
    },
    {
      name: 'Lịch Làm & Đăng Ký Nghỉ',
      path: '/artist/schedule',
      icon: Calendar,
    },
    {
      name: 'Hồ Sơ Cá Nhân',
      path: '/artist/profile',
      icon: User,
    },
  ];

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 antialiased font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar for Artist */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
          <Link to="/artist" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold text-white tracking-wide">
                Artist<span className="text-purple-400">Studio</span>
              </span>
              <p className="text-[10px] uppercase font-bold tracking-widest text-purple-300">
                DungDorys Studio
              </p>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Không Gian Nghệ Sĩ
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-6">
            <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Liên Kết
            </p>
            <Link
              to="/"
              className="flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
              <span>Xem Trang Khách Hàng</span>
            </Link>
          </div>
        </div>

        {/* Artist Profile Card at bottom */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-rose-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {user?.fullName || 'Thợ Trang Điểm'}
              </p>
              <p className="text-[11px] text-purple-400 truncate font-semibold">Chuyên Gia Makeup</p>
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Cổng Làm Việc Thợ Trang Điểm</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sẵn Sàng Nhận Ca</span>
            </div>

            <Link
              to="/artist/schedule"
              className="px-3.5 py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <span>Đăng Ký Nghỉ Phép</span>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-8 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ArtistLayout;
