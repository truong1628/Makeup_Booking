import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Sparkles, Calendar, Users, Clock,
  Settings, LogOut, ArrowLeft, Menu, X, Shield, Bell, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authStorage } from '../utils/authStorage';

const AdminLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Đọc trực tiếp từ claims JWT Token để xác thực quyền Admin
  const tokenValid = authStorage.isAuthenticated();
  const jwtRole = authStorage.getRole();

  if (!tokenValid || jwtRole !== 'ROLE_ADMIN') {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Tổng Quan',
      path: '/admin',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: 'Quản Lý Dịch Vụ',
      path: '/admin/services',
      icon: Sparkles,
    },
    {
      name: 'Quản Lý Đơn Đặt Lịch',
      path: '/admin/bookings',
      icon: Calendar,
    },
    {
      name: 'Quản Lý Thợ Makeup',
      path: '/admin/artists',
      icon: Users,
    },
    {
      name: 'Lịch Làm Việc ',
      path: '/admin/schedules',
      icon: Clock,
    },
  ];

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100 antialiased font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950/90 backdrop-blur-xl border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Brand header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/80">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold text-white tracking-wide">
                Dung<span className="text-rose-400">Dorys</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                  {isAdmin ? 'Admin Console' : 'Artist Studio'}
                </span>
              </div>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Quản Lý Nghiệp Vụ
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                id={`admin-nav-${item.path.split('/').pop() || 'dashboard'}`}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${active
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-6">
            <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Hệ Thống
            </p>
            <Link
              to="/"
              className="flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
              <span>Xem Trang Khách Hàng</span>
            </Link>
          </div>
        </div>

        {/* User Card at bottom */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-bold flex items-center justify-center text-sm">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.fullName || 'Quản trị viên'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              id="btn-admin-logout"
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
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>DungDorys Admin Center</span>
                <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  v1.0.0
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">


            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <span>Trang chủ</span>
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

export default AdminLayout;
