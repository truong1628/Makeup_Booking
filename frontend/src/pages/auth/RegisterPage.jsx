import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, Phone, AlertCircle, Eye, EyeOff, Heart, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const RegisterPage = () => {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const validateForm = () => {
    const errors = {};
    const nameTrimmed = formData.fullName.trim();
    const emailTrimmed = formData.email.trim();
    const phoneTrimmed = formData.phone.trim();
    const nameRegex = /^[\p{L}\s]+$/u;
    const emailRegex = /^[a-zA-Z0-9.]+@gmail\.com$/;
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;

    if (!nameTrimmed) {
      errors.fullName = 'Vui lòng nhập họ và tên của bạn';
    } else if (nameTrimmed.length < 2) {
      errors.fullName = 'Họ và tên quá ngắn (tối thiểu 2 ký tự)';
    } else if (!nameRegex.test(nameTrimmed)) {
      errors.fullName = 'Họ và tên không được chứa ký tự đặc biệt';
    }

    if (!emailTrimmed) {
      errors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!emailRegex.test(emailTrimmed)) {
      errors.email = 'Email không đúng định dạng (Ví dụ: name@gmail.com)';
    }

    if (!phoneTrimmed) {
      errors.phone = 'Vui lòng nhập số điện thoại của bạn';
    } else if (!phoneRegex.test(phoneTrimmed)) {
      errors.phone = 'Số điện thoại không hợp lệ (Ví dụ: 0912345678)';
    }

    if (!formData.password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu';
    } else if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp với mật khẩu đã nhập';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (name === 'confirmPassword' && formData.password && value !== formData.password) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Mật khẩu xác nhận không khớp' }));
    } else if (name === 'confirmPassword' && value === formData.password) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: null }));
    }

    if (serverError) setServerError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra và sửa các lỗi trong form đăng ký');
      return;
    }

    setSubmitting(true);

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      password: formData.password,
      role: 'ROLE_CUSTOMER',
    };

    try {
      await register(payload);

      toast.success('🎉 Đăng ký tài khoản Khách hàng thành công! ');

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const errMsg = err.message || 'Đăng ký thất bại. Vui lòng thử lại';
      setServerError(errMsg);
      toast.error(`❌ ${errMsg}`);

      const lower = errMsg.toLowerCase();
      if (lower.includes('email')) {
        setFieldErrors((prev) => ({ ...prev, email: errMsg }));
      } else if (lower.includes('số điện thoại') || lower.includes('phone')) {
        setFieldErrors((prev) => ({ ...prev, phone: errMsg }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-7 bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center mx-auto shadow-md shadow-rose-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
            Đăng Ký Khách Hàng
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Tạo tài khoản để đặt lịch làm đẹp và nhận nhiều ưu đãi đặc quyền
          </p>
        </div>

        {serverError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-xs animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Họ và tên của bạn *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                name="fullName"
                id="input-register-fullname"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Ví dụ: Nguyễn Thị Mai"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none ${fieldErrors.fullName
                  ? 'border-rose-500 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                  : 'border-slate-200 focus:ring-2 focus:ring-rose-500'
                  }`}
              />
            </div>
            {fieldErrors.fullName && (
              <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{fieldErrors.fullName}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Địa chỉ Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                name="email"
                id="input-register-email"
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

          {/* Phone field (REQUIRED) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Số điện thoại của bạn *
              </label>
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                name="phone"
                id="input-register-phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ví dụ: 0912345678"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none ${fieldErrors.phone
                  ? 'border-rose-500 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                  : 'border-slate-200 focus:ring-2 focus:ring-rose-500'
                  }`}
              />
            </div>
            {fieldErrors.phone && (
              <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{fieldErrors.phone}</span>
              </p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mật khẩu (tối thiểu 6 ký tự) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="input-register-password"
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

          {/* Confirm Password field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Xác nhận lại mật khẩu *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                id="input-register-confirm-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu "
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm font-mono transition-all focus:outline-none ${fieldErrors.confirmPassword
                  ? 'border-rose-500 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                  : formData.confirmPassword && formData.confirmPassword === formData.password
                    ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-rose-500'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{fieldErrors.confirmPassword}</span>
              </p>
            )}
            {formData.confirmPassword && formData.confirmPassword === formData.password && !fieldErrors.confirmPassword && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Mật khẩu xác nhận trùng khớp</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            id="btn-submit-register"
            disabled={submitting}
            className="w-full py-3 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-sm font-semibold shadow-md shadow-rose-500/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {submitting ? 'Đang tạo tài khoản...' : 'Hoàn Tất Đăng Ký'}
          </button>
        </form>

        <div className="pt-3 border-t border-slate-100 text-center space-y-2">
          <p className="text-[11px] text-slate-500">
            Bạn là Thợ trang điểm (Artist)?{' '}
            <span className="text-slate-700 font-medium">Tài khoản chuyên viên do Ban quản trị Studio tạo và cấp phép.</span>
          </p>

          <p className="text-xs text-slate-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-semibold text-rose-600 hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
