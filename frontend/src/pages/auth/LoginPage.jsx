import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const LoginPage = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    const emailTrimmed = formData.email.trim();
    const emailRegex = /^[a-zA-Z0-9.]+@gmail\.com$/;

    // 1. Kiểm tra Email
    if (!emailTrimmed) {
      errors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!emailRegex.test(emailTrimmed)) {
      errors.email = 'Email không đúng định dạng (Ví dụ: name@gmail.com)';
    }

    // 2. Kiểm tra Mật khẩu
    if (!formData.password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Xóa lỗi của trường khi người dùng gõ
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (serverError) setServerError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    // Bắt lỗi giao diện trước khi gọi API
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại các trường thông tin trong form');
      return;
    }

    setSubmitting(true);
    try {
      // Gọi API login qua axiosInstance trong authService
      const data = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      // 1. Bắn thông báo Toast thành công
      toast.success(`✨ Đăng nhập thành công! Chào mừng ${data.fullName || data.email}`);

      // 2. Token đã tự động được lưu vào localStorage qua authService/authStorage
      // 3. Tự động chuyển hướng về Trang chủ, Admin hoặc Cổng Nghệ Sĩ
      setTimeout(() => {
        if (data.role === 'ROLE_ADMIN') {
          navigate('/admin');
        } else if (data.role === 'ROLE_ARTIST') {
          navigate('/artist');
        } else {
          navigate(redirect);
        }
      }, 1000);
    } catch (err) {
      const errMsg = err.message || 'Email hoặc mật khẩu không chính xác';
      setServerError(errMsg);
      // Bắn thông báo Toast báo lỗi
      toast.error(`❌ ${errMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center mx-auto shadow-md shadow-rose-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
            Chào Mừng Trở Lại
          </h2>
          <p className="text-xs text-slate-500">
            Đăng nhập vào tài khoản DungDorys Studio của bạn
          </p>
        </div>

        {serverError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-xs animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                name="email"
                id="input-login-email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@gmail.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none ${fieldErrors.email
                  ? 'border-rose-500 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                  : 'border-slate-200 focus:ring-2 focus:ring-rose-500'
                  }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{fieldErrors.email}</span>
              </p>
            )}
          </div>

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Mật khẩu
              </label>

            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="input-login-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm font-mono transition-all focus:outline-none ${fieldErrors.password
                  ? 'border-rose-500 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                  : 'border-slate-200 focus:ring-2 focus:ring-rose-500'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{fieldErrors.password}</span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="btn-submit-login"
            disabled={submitting}
            className="w-full py-3 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-sm font-semibold shadow-md shadow-rose-500/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <span>Đang xác thực đăng nhập...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-semibold text-rose-600 hover:underline">
            Đăng ký tài khoản mới
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
