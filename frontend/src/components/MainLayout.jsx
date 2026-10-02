import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles, Calendar, User, LogIn, LogOut, Menu, X,
  Phone, Mail, MapPin, Heart, ChevronDown, ShieldCheck, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const { user, isAuthenticated, logout, isAdmin, isArtist } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const navLinks = [
    { name: 'Trang Chủ', path: '/' },
    { name: 'Dịch Vụ', path: '/services' },
    { name: 'Chuyên Viên', path: '/artists' },
    { name: 'Bộ Sưu Tập', path: '/collections' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] text-slate-800">
      {/* Top promotional bar */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-rose-900 text-rose-100 text-xs py-2 px-4 text-center tracking-wide font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        <span>Ưu đãi mùa cưới: Giảm ngay 15% cho tất cả các Gói Combo Cô Dâu trong tháng này!</span>
        <Link to="/services" className="underline font-semibold hover:text-white ml-1">Xem ngay</Link>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 glass-nav transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" id="nav-brand-logo" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-tight text-slate-900 group-hover:text-rose-600 transition-colors">
                  Dung<span className="text-rose-600 italic">Dorys</span>
                </span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                  Makeup Studio
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  id={`nav-link-${link.path.replace('/', '') || 'home'}`}
                  className={`text-sm font-semibold transition-all relative py-1 ${isActive(link.path)
                      ? 'text-rose-600'
                      : 'text-slate-600 hover:text-rose-600'
                    }`}
                >
                  {link.name}
                  {isActive(link.path) && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-600 rounded-full" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Action Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/booking"
                id="btn-header-quick-book"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-sm font-semibold shadow-md shadow-rose-500/25 hover:shadow-lg hover:shadow-rose-500/35 hover:-translate-y-0.5 transition-all duration-200"
              >
                <Calendar className="w-4 h-4" />
                <span>Đặt Lịch Ngay</span>
              </Link>

              {/* User authentication states */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    id="btn-user-menu"
                    className="flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-slate-200 hover:border-rose-300 bg-white shadow-sm hover:shadow transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs">
                      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                      {user?.fullName || user?.email}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {/* Dropdown menu */}
                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs text-slate-400 font-medium">Đã đăng nhập với</p>
                        <p className="text-sm font-semibold text-slate-800 truncate">{user?.email}</p>

                      </div>

                      <Link
                        to="/my-bookings"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Lịch hẹn của tôi</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 font-medium transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                          <span>Trang Quản Trị (Admin)</span>
                        </Link>
                      )}

                      {isArtist && (
                        <Link
                          to="/artist"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 font-medium transition-colors"
                        >
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <span>Khu Vực Nghệ Sĩ (Artist Studio)</span>
                        </Link>
                      )}

                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          id="btn-user-logout"
                          className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 font-medium transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    id="btn-header-login"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Đăng Nhập</span>
                  </Link>
                  <Link
                    to="/register"
                    id="btn-header-register"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-rose-300 text-sm font-semibold text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                  >
                    <span>Đăng Ký</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                id="btn-mobile-menu-toggle"
                className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-lg">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-base font-medium ${isActive(link.path)
                    ? 'bg-rose-50 text-rose-600 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {link.name}
              </Link>
            ))}

            <Link
              to="/booking"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-semibold text-sm shadow-md"
            >
              <Calendar className="w-4 h-4" />
              <span>Đặt Lịch Ngay</span>
            </Link>

            {isAuthenticated && (
              <Link
                to="/my-bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Lịch Hẹn Của Tôi
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-amber-700 bg-amber-50"
              >
                Trang Quản Trị (Admin)
              </Link>
            )}
            {isArtist && (
              <Link
                to="/artist"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-purple-700 bg-purple-50"
              >
                Khu Vực Nghệ Sĩ (Artist Studio)
              </Link>
            )}

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-semibold text-sm"
                >
                  Đăng xuất ({user?.fullName || user?.email})
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-sm text-slate-700"
                  >
                    Đăng Nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center px-4 py-2.5 rounded-xl bg-rose-600 text-white font-semibold text-sm shadow-md"
                  >
                    Đăng Ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 mt-20 pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Col 1: Brand Info */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-serif text-2xl font-bold text-white tracking-tight">
                  Dung<span className="text-rose-400 italic">Dorys</span>
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                DungDorys Makeup Studio - Hệ thống đặt lịch Makeup nghệ thuật hàng đầu. Tôn vinh nét đẹp độc bản và rạng rỡ của bạn trong mọi khoảnh khắc trọng đại.
              </p>
              <div className="flex items-center gap-3 text-xs text-rose-300">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>Hơn 10,000+ khách hàng hài lòng</span>
              </div>
            </div>

            {/* Col 2: Dịch vụ nổi bật */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Dịch Vụ Nổi Bật</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link to="/services" className="hover:text-rose-400 transition-colors">Makeup Cô Dâu Ngày Cưới</Link></li>
                <li><Link to="/services" className="hover:text-rose-400 transition-colors">Makeup Tiệc Đêm Sang Trọng</Link></li>
                <li><Link to="/services" className="hover:text-rose-400 transition-colors">Trang Điểm Chụp Ảnh Profile</Link></li>
                <li><Link to="/services" className="hover:text-rose-400 transition-colors">Combo Cô Dâu Hoàn Hảo</Link></li>
                <li><Link to="/services" className="hover:text-rose-400 transition-colors">Trang Điểm Tận Nơi (Tại Nhà)</Link></li>
              </ul>
            </div>

            {/* Col 3: Liên kết nhanh */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Liên Kết Nhanh</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link to="/" className="hover:text-rose-400 transition-colors">Về Chúng Tôi</Link></li>
                <li><Link to="/services" className="hover:text-rose-400 transition-colors">Bảng Giá Dịch Vụ</Link></li>
                <li><Link to="/artists" className="hover:text-rose-400 transition-colors">Đội Ngũ Chuyên Viên</Link></li>
                <li><Link to="/collections" className="hover:text-rose-400 transition-colors">Bộ Sưu Tập Tác Phẩm</Link></li>
                <li><Link to="/booking" className="hover:text-rose-400 transition-colors">Đặt Lịch Trực Tuyến</Link></li>
                <li><Link to="/my-bookings" className="hover:text-rose-400 transition-colors">Tra Cứu Lịch Hẹn</Link></li>
                <li><Link to="/artist" className="hover:text-purple-400 transition-colors">Cổng Thợ Trang Điểm (Artist)</Link></li>
                <li><Link to="/admin" className="hover:text-rose-400 transition-colors">Cổng Quản Trị Viên (Admin)</Link></li>
              </ul>
            </div>

            {/* Col 4: Liên hệ & Giờ mở cửa */}
            <div className="space-y-3">
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Studio & Hỗ Trợ</h4>
              <div className="flex items-start gap-3 text-sm text-slate-400">
                <MapPin className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span>204 Trần Duy Hưng, Q. Cầu Giấy, Hà Nội</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Phone className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Hotline: 0988 776 655 (24/7)</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Mail className="w-4 h-4 text-rose-500 shrink-0" />
                <span>support@dungdorys.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Clock className="w-4 h-4 text-rose-500 shrink-0" />
                <span>07:00 - 21:00 (Hàng ngày)</span>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© 2026 DungDorys Studio. Tất cả quyền được bảo lưu.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-slate-400 cursor-pointer">Điều khoản dịch vụ</span>
              <span className="hover:text-slate-400 cursor-pointer">Chính sách bảo mật</span>
              <span className="hover:text-slate-400 cursor-pointer">Chính sách hoàn tiền cọc</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
