import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, Shield, Calendar, KeyRound,
  Camera, Upload, Trash2, CheckCircle2, AlertCircle, Loader2,
  Lock, Eye, EyeOff, Sparkles, ChevronRight, RefreshCw,
  ArrowRight, Check
} from 'lucide-react';
import { userService } from '../services/userService';
import { uploadService } from '../services/uploadService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ProfilePage = () => {
  const { updateUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, navigate]);

  const [activeTab, setActiveTab] = useState('INFO'); // 'INFO' | 'PASSWORD'
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Profile Form state
  const [profile, setProfile] = useState({
    id: null,
    email: '',
    fullName: '',
    phone: '',
    avatar: '',
    address: '',
    role: '',
    status: '',
    createdAt: null,
    totalBookings: 0,
  });

  // Password Form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [infoError, setInfoError] = useState(null);
  const [passError, setPassError] = useState(null);

  // Tải dữ liệu hồ sơ từ Backend
  const loadProfile = async () => {
    try {
      setLoading(true);
      setInfoError(null);
      const data = await userService.getProfile();
      if (data) {
        setProfile({
          id: data.id || null,
          email: data.email || '',
          fullName: data.fullName || '',
          phone: data.phone || '',
          avatar: data.avatar || '',
          address: data.address || '',
          role: data.role || 'ROLE_CUSTOMER',
          status: data.status || 'ACTIVE',
          createdAt: data.createdAt || null,
          totalBookings: data.totalBookings || 0,
        });

        // Cập nhật lại dữ liệu lưu trong auth storage & context
        updateUser({
          id: data.id,
          fullName: data.fullName,
          phone: data.phone,
          avatar: data.avatar,
          address: data.address,
        });
      }
    } catch (err) {
      console.error('Lỗi khi tải hồ sơ:', err);
      setInfoError(err.message || 'Không thể tải thông tin hồ sơ cá nhân');
      toast.error('Không thể tải thông tin hồ sơ: ' + (err.message || 'Lỗi mạng'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Xử lý thay đổi thông tin cá nhân
  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (infoError) setInfoError(null);
  };

  // Tải ảnh đại diện từ máy tính
  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn một tệp hình ảnh hợp lệ (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa cho phép là 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      // 1. Thử tải lên đám mây Cloudinary
      const uploadedUrl = await uploadService.uploadImage(file);
      setProfile((prev) => ({ ...prev, avatar: uploadedUrl }));
      toast.success('📸 Tải ảnh đại diện lên thành công!');
    } catch (err) {
      console.warn('Cloudinary upload thất bại, chuyển sang Base64 dự phòng:', err);
      // 2. Dự phòng: Đọc Base64 trực tiếp
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        setProfile((prev) => ({ ...prev, avatar: loadEvt.target.result }));
        toast.success('📸 Đã nạp ảnh đại diện từ thiết bị của bạn!');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Gỡ ảnh đại diện
  const handleRemoveAvatar = () => {
    setProfile((prev) => ({ ...prev, avatar: '' }));
  };

  // Lưu thông tin cá nhân
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setInfoError(null);

    const nameRegex = /^[\p{L}\s]+$/u;
    if (!profile.fullName.trim()) {
      setInfoError('Họ và tên không được để trống');
      return;
    }
    if (!nameRegex.test(profile.fullName.trim())) {
      setInfoError('Họ và tên không được chứa số hoặc ký tự đặc biệt');
      return;
    }

    if (profile.phone && profile.phone.trim()) {
      const phoneRegex = /^(84|0[3|5|7|8|9])+([0-9]{8})$/;
      if (!phoneRegex.test(profile.phone.trim())) {
        setInfoError('Số điện thoại không đúng định dạng Việt Nam (Ví dụ: 0912345678)');
        return;
      }
    }

    setSavingInfo(true);
    try {
      const updated = await userService.updateProfile({
        fullName: profile.fullName.trim(),
        phone: profile.phone ? profile.phone.trim() : null,
        avatar: profile.avatar ? profile.avatar.trim() : null,
        address: profile.address ? profile.address.trim() : null,
      });

      // Cập nhật context & storage ngay lập tức
      updateUser({
        fullName: updated.fullName,
        phone: updated.phone,
        avatar: updated.avatar,
        address: updated.address,
      });

      toast.success('✨ Cập nhật thông tin cá nhân thành công!');
    } catch (err) {
      console.error('Lỗi cập nhật hồ sơ:', err);
      const msg = err.message || 'Cập nhật thông tin thất bại';
      setInfoError(msg);
      toast.error('❌ ' + msg);
    } finally {
      setSavingInfo(false);
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError(null);

    if (!passwordForm.currentPassword) {
      setPassError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPassError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPassError('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPassError('Mật khẩu mới không được trùng với mật khẩu hiện tại');
      return;
    }

    setChangingPass(true);
    try {
      await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      toast.success('🔒 Đổi mật khẩu thành công! Tài khoản của bạn đã được bảo vệ.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      console.error('Lỗi đổi mật khẩu:', err);
      const msg = err.message || 'Không thể đổi mật khẩu';
      setPassError(msg);
      toast.error('❌ ' + msg);
    } finally {
      setChangingPass(false);
    }
  };

  const roleBadgeLabel = () => {
    if (profile.role === 'ROLE_ADMIN') return 'Quản Trị Viên';
    if (profile.role === 'ROLE_ARTIST') return 'Chuyên Viên Trang Điểm';
    return 'Khách Hàng Thân Thiết';
  };

  return (
    <div className="min-h-screen bg-slate-50/60 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/" className="hover:text-rose-600 transition-colors">Trang chủ</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 font-medium">Hồ sơ cá nhân</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <span>Hồ Sơ Của Bạn</span>
              <span className="text-xs px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60 font-sans font-semibold">
                {roleBadgeLabel()}
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý thông tin liên hệ, ảnh đại diện và bảo mật tài khoản cá nhân.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadProfile}
              disabled={loading}
              title="Tải lại dữ liệu"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-rose-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm Mới</span>
            </button>

            <Link
              to="/my-bookings"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-500/20 hover:shadow-rose-500/35 transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Lịch Hẹn Của Tôi</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
            <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu hồ sơ cá nhân...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: User Summary Card */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xl shadow-slate-100/70 text-center relative overflow-hidden">
                {/* Background ambient decorative glow */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-rose-200/40 to-pink-200/20 rounded-full blur-2xl pointer-events-none" />

                {/* Avatar Display */}
                <div className="relative inline-block mx-auto mb-4 group">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl shadow-rose-500/15 bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.fullName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span>{profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('INFO');
                      fileInputRef.current?.click();
                    }}
                    title="Thay đổi ảnh đại diện"
                    className="absolute bottom-0 right-0 p-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                  {profile.fullName || 'Khách Hàng'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{profile.email}</p>

                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-100">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span>{roleBadgeLabel()}</span>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-3 text-left">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-400 block font-medium">Lịch đã đặt</span>
                    <span className="text-lg font-bold text-slate-800">{profile.totalBookings || 0}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-400 block font-medium">Trạng thái</span>
                    <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Hoạt động
                    </span>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="mt-6 space-y-2 text-xs">
                  <Link
                    to="/my-bookings"
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-600 transition-colors font-medium border border-slate-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-rose-500" />
                      <span>Xem lịch hẹn của tôi</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>

                  <Link
                    to="/booking"
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-600 transition-colors font-medium border border-slate-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Đặt thêm dịch vụ mới</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Profile & Security Tabs */}
            <div className="lg:col-span-8 space-y-6">
              {/* Tab Switcher */}
              <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('INFO')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'INFO'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Thông Tin Cá Nhân</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('PASSWORD')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'PASSWORD'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Đổi Mật Khẩu</span>
                </button>
              </div>

              {/* TAB 1: THÔNG TIN CÁ NHÂN */}
              {activeTab === 'INFO' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-100/70 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <User className="w-5 h-5 text-rose-600" />
                      <span>Chi Tiết Hồ Sơ Cá Nhân</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Cập nhật ảnh đại diện, số điện thoại và thông tin liên hệ khi nghệ sĩ đến phục vụ.
                    </p>
                  </div>

                  {infoError && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{infoError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveInfo} noValidate className="space-y-6">
                    {/* Ảnh đại diện (Avatar) */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
                      <label className="block text-slate-800 font-bold text-xs uppercase tracking-wider">
                        Ảnh Đại Diện (Avatar)
                      </label>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                          {profile.avatar ? (
                            <img
                              src={profile.avatar}
                              alt="Avatar Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-8 h-8 text-slate-400" />
                          )}
                        </div>

                        <div className="flex-1 space-y-2.5 w-full text-center sm:text-left">
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <input
                              type="file"
                              ref={fileInputRef}
                              accept="image/*"
                              onChange={handleAvatarFile}
                              className="hidden"
                              id="customer-avatar-input"
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingAvatar}
                              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                            >
                              {uploadingAvatar ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Đang tải ảnh...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Tải Ảnh Từ Thiết Bị</span>
                                </>
                              )}
                            </button>

                            {profile.avatar && (
                              <button
                                type="button"
                                onClick={handleRemoveAvatar}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Gỡ Ảnh</span>
                              </button>
                            )}
                          </div>

                          <div>
                            <input
                              type="text"
                              name="avatar"
                              value={profile.avatar}
                              onChange={handleInfoChange}
                              placeholder="Hoặc dán trực tiếp đường dẫn URL ảnh (https://...)"
                              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Email (Read-only) & Họ tên */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                          <span>Địa Chỉ Email</span>
                          <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Cố định
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            disabled
                            value={profile.email}
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium cursor-not-allowed select-none"
                          />
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Họ và Tên Khách Hàng <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            name="fullName"
                            value={profile.fullName}
                            onChange={handleInfoChange}
                            placeholder="Ví dụ: Trần Mai Phương"
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                          />
                          <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        </div>
                      </div>
                    </div>

                    {/* Số điện thoại & Địa chỉ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Số Điện Thoại Liên Hệ
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            name="phone"
                            value={profile.phone}
                            onChange={handleInfoChange}
                            placeholder="Ví dụ: 0912345678"
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono"
                          />
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Dùng để chuyên viên liên hệ khi tới giờ làm dịch vụ</p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Địa Chỉ Mặc Định
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="address"
                            value={profile.address}
                            onChange={handleInfoChange}
                            placeholder="Ví dụ: Căn hộ 1205, Tòa R1, Royal City, Hà Nội"
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                          />
                          <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Tự động điền khi bạn đặt dịch vụ trang điểm tận nơi</p>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                      <button
                        type="submit"
                        disabled={savingInfo || uploadingAvatar}
                        id="btn-save-customer-profile"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 hover:shadow-rose-500/35 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {savingInfo ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang lưu thông tin...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Lưu Thay Đổi Hồ Sơ</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: ĐỔI MẬT KHẨU */}
              {activeTab === 'PASSWORD' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-100/70 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-rose-600" />
                      <span>Đổi Mật Khẩu Tài Khoản</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Để tăng cường an toàn, vui lòng sử dụng mật khẩu mạnh có tối thiểu 6 ký tự.
                    </p>
                  </div>

                  {passError && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{passError}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} noValidate className="space-y-4 max-w-xl">
                    {/* Mật khẩu hiện tại */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Mật Khẩu Hiện Tại <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPass ? 'text' : 'password'}
                          required
                          value={passwordForm.currentPassword}
                          onChange={(e) => {
                            setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }));
                            if (passError) setPassError(null);
                          }}
                          placeholder="Nhập mật khẩu bạn đang sử dụng"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Mật khẩu mới */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Mật Khẩu Mới <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={passwordForm.newPassword}
                          onChange={(e) => {
                            setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }));
                            if (passError) setPassError(null);
                          }}
                          placeholder="Tối thiểu 6 ký tự"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Xác nhận mật khẩu mới */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Xác Nhận Mật Khẩu Mới <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPass ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => {
                            setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }));
                            if (passError) setPassError(null);
                          }}
                          placeholder="Nhập lại mật khẩu mới vừa gõ"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                      <button
                        type="submit"
                        disabled={changingPass}
                        id="btn-submit-change-password"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 hover:shadow-rose-500/35 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {changingPass ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang cập nhật mật khẩu...</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4" />
                            <span>Xác Nhận Đổi Mật Khẩu</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
