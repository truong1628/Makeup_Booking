import React, { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authStorage } from '../utils/authStorage';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute Component:
 * Kiểm tra xác thực và phân quyền dựa trên JWT Token.
 * @param {string} requiredRole - Quyền yêu cầu (VD: 'ROLE_ADMIN', 'ROLE_ARTIST')
 */
const ProtectedRoute = ({ requiredRole }) => {
  const { loading, isAuthenticated } = useAuth();
  const location = useLocation();
  const toast = useToast();
  const hasNotifiedRef = useRef(false);

  // Đọc quyền trực tiếp từ claims giải mã của JWT Token
  const jwtRole = authStorage.getRole();
  const tokenValid = authStorage.isAuthenticated();

  // Reset notification flag when location changes
  useEffect(() => {
    hasNotifiedRef.current = false;
  }, [location.pathname]);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !tokenValid) {
      if (!hasNotifiedRef.current) {
        hasNotifiedRef.current = true;
        toast.warning('⚠️ Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.');
      }
      return;
    }

    if (requiredRole && jwtRole !== requiredRole) {
      if (!hasNotifiedRef.current) {
        hasNotifiedRef.current = true;
        const roleName = requiredRole === 'ROLE_ADMIN' ? 'Quản Trị Viên (Admin)' : 'Chuyên Viên Trang Điểm';
        toast.error(`⛔ Quyền truy cập bị từ chối: Tài khoản của bạn không có quyền ${roleName}.`);
      }
    }
  }, [loading, isAuthenticated, tokenValid, requiredRole, jwtRole, toast]);

  // Đang nạp dữ liệu Auth
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-3">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">
          Đang xác thực thông tin tài khoản...
        </p>
      </div>
    );
  }

  // Trường hợp 1: Chưa đăng nhập hoặc token đã hết hạn
  if (!isAuthenticated || !tokenValid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Trường hợp 2: Đã đăng nhập nhưng không đủ quyền (ví dụ Customer truy cập trang Admin)
  if (requiredRole && jwtRole !== requiredRole) {
    // Tự động chặn và chuyển hướng về trang chủ
    return <Navigate to="/" replace />;
  }

  // Hợp lệ: Cho phép truy cập component con
  return <Outlet />;
};

export default ProtectedRoute;
