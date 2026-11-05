import React, { useState, useEffect, useRef } from 'react';
import {
  User, Mail, Phone, Award, Sparkles, Clock, Calendar,
  RefreshCw, CheckCircle2, ShieldCheck,
  Edit3, Camera, Upload, Trash2, X, AlertCircle, Loader2, Check
} from 'lucide-react';
import { artistService } from '../../services/artistService';
import { uploadService } from '../../services/uploadService';
import { useToast } from '../../context/ToastContext';

const ArtistProfilePage = () => {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    artistId: '',
    userId: '',
    fullName: '',
    email: '',
    phone: '',
    avatar: '',
    experience: '',
    workingHours: '08:00 - 20:00',
    workingDays: 'Thứ 2 - Chủ Nhật',
    active: true,
  });

  // State cho Modal Chỉnh Sửa Hồ Sơ Cá Nhân
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    avatar: '',
    experience: '',
    workingHours: '',
    workingDays: '',
    active: true,
  });
  const [modalError, setModalError] = useState(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await artistService.getProfile();
      const profileData = {
        artistId: data.artistId || '',
        userId: data.userId || '',
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        avatar: data.avatar || '',
        experience: data.experience || '',
        workingHours: data.workingHours || '08:00 - 20:00',
        workingDays: data.workingDays || 'Thứ 2 - Chủ Nhật',
        active: data.active !== undefined ? data.active : true,
      };
      setProfile(profileData);
    } catch (err) {
      toast.error('Không thể tải thông tin hồ sơ: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Mở modal chỉnh sửa
  const handleOpenEditModal = () => {
    setEditForm({
      fullName: profile.fullName || '',
      phone: profile.phone || '',
      avatar: profile.avatar || '',
      experience: profile.experience || '',
      workingHours: profile.workingHours || '08:00 - 20:00',
      workingDays: profile.workingDays || 'Thứ 2 - Chủ Nhật',
      active: profile.active !== false,
    });
    setModalError(null);
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Xử lý chọn ảnh đại diện từ thiết bị
  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setModalError('Vui lòng chọn một tệp hình ảnh hợp lệ (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setModalError('Kích thước ảnh tối đa là 5MB');
      return;
    }

    setUploadingAvatar(true);
    setModalError(null);

    try {
      // 1. Thử tải lên đám mây Cloudinary
      const uploadedUrl = await uploadService.uploadImage(file);
      setEditForm(prev => ({ ...prev, avatar: uploadedUrl }));
      toast.success('📸 Tải ảnh đại diện lên thành công!');
    } catch (err) {
      console.warn('Cloudinary upload thất bại, chuyển sang đọc Base64 nội bộ:', err);
      // 2. Dự phòng: Đọc dạng Base64 nếu dịch vụ Cloudinary gặp sự cố
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        setEditForm(prev => ({ ...prev, avatar: loadEvt.target.result }));
        toast.success('📸 Đã cập nhật ảnh đại diện từ tệp của bạn!');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Xóa ảnh đại diện
  const handleRemoveAvatar = () => {
    setEditForm(prev => ({ ...prev, avatar: '' }));
  };

  // Lưu hồ sơ cá nhân
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setModalError(null);

    const nameRegex = /^[\p{L}\s]+$/u;
    if (!editForm.fullName.trim()) {
      setModalError('Vui lòng nhập họ và tên của bạn');
      return;
    }
    if (!nameRegex.test(editForm.fullName.trim())) {
      setModalError('Họ và tên không được chứa ký tự đặc biệt hoặc số');
      return;
    }

    setSaving(true);
    try {
      await artistService.updateProfile({
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim(),
        avatar: editForm.avatar.trim(),
        experience: editForm.experience.trim(),
        workingHours: editForm.workingHours.trim(),
        workingDays: editForm.workingDays.trim(),
        active: editForm.active,
      });

      setProfile(prev => ({
        ...prev,
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim(),
        avatar: editForm.avatar.trim(),
        experience: editForm.experience.trim(),
        workingHours: editForm.workingHours.trim(),
        workingDays: editForm.workingDays.trim(),
        active: editForm.active,
      }));

      toast.success('✨ Đã cập nhật hồ sơ cá nhân thành công!');
      setIsEditModalOpen(false);
    } catch (err) {
      const errMsg = err.message || 'Lỗi khi cập nhật hồ sơ cá nhân';
      setModalError(errMsg);
      toast.error('❌ ' + errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
            <span>Hồ Sơ Cá Nhân Nghệ Sĩ</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-sans font-medium">
              Chuyên Gia
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Quản lý thông tin cá nhân, ảnh đại diện, kinh nghiệm và thời gian làm việc để phục vụ khách hàng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadProfile}
            disabled={loading}
            title="Tải lại thông tin mới nhất"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-850 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>

          {/* Button Chỉnh Sửa Hồ Sơ Cá Nhân */}
          <button
            onClick={handleOpenEditModal}
            id="btn-open-edit-artist-profile"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-rose-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Chỉnh Sửa Hồ Sơ Cá Nhân</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Đang tải dữ liệu hồ sơ cá nhân...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Profile Summary Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -z-0 pointer-events-none" />

            {/* Avatar Display */}
            <div className="relative group shrink-0 z-10">
              {profile.avatar ? (
                <div className="w-28 h-28 rounded-3xl overflow-hidden border-2 border-purple-500/40 shadow-xl shadow-purple-500/20 bg-slate-950">
                  <img
                    src={profile.avatar}
                    alt={profile.fullName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-purple-600 via-rose-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-purple-500/30">
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'M'}
                </div>
              )}

              {/* Quick edit avatar trigger */}
              <button
                type="button"
                onClick={handleOpenEditModal}
                title="Thay đổi ảnh đại diện"
                className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white border border-slate-700 shadow-md transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Information */}
            <div className="flex-1 text-center sm:text-left space-y-3 z-10">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {profile.fullName || 'Chưa đặt tên'}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Nghệ Sĩ Đã Xác Thực
                </span>
                {profile.active ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                    Đang Nhận Lịch
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                    Tạm Dừng Nhận Lịch
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-purple-400 font-mono font-semibold">
                  Mã Thợ: #ARTIST-{profile.artistId}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950/80 border border-slate-800">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{profile.email}</span>
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950/80 border border-slate-800">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{profile.phone || 'Chưa cập nhật số điện thoại'}</span>
                </span>
              </div>

              <div className="pt-2 flex justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Cập nhật ảnh đại diện & thông tin cá nhân →</span>
                </button>
              </div>
            </div>
          </div>

          {/* Details Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kinh nghiệm làm nghề */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Kinh Nghiệm & Bằng Cấp</h3>
                    <p className="text-[11px] text-slate-400">Trình độ tay nghề và các chứng nhận chuyên môn</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-200 leading-relaxed min-h-[90px]">
                  {profile.experience ? (
                    <p className="whitespace-pre-line">{profile.experience}</p>
                  ) : (
                    <span className="text-slate-500 italic">Chưa cập nhật mô tả kinh nghiệm nghề nghiệp. Nhấn "Chỉnh Sửa Hồ Sơ Cá Nhân" để bổ sung.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Năng lực phong cách toàn diện */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Năng Lực & Tiêu Chuẩn Nghề</h3>
                    <p className="text-[11px] text-slate-400">Đào tạo bài bản theo quy chuẩn Master Artist</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-200 leading-relaxed min-h-[90px] space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Thành thạo toàn diện mọi layout trang điểm</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Có kinh nghiệm và kỹ thuật xuất sắc ở tất cả phong cách: Cô dâu, Dự tiệc sang trọng, Kỷ yếu thanh xuân, layout Douyin/Hàn Quốc, Thái Lan sắc nét và phong cách Vintage.
                  </p>
                </div>
              </div>
            </div>

            {/* Khung giờ làm việc */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Khung Giờ Nhận Ca Trong Ngày</h3>
                  <p className="text-[11px] text-slate-400">Thời gian thợ sẵn sàng phục vụ ca trong ngày</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Thời gian nhận hẹn:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {profile.workingHours || '08:00 - 20:00'}
                </span>
              </div>
            </div>

            {/* Ngày làm việc trong tuần */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Ngày Làm Việc Trong Tuần</h3>
                  <p className="text-[11px] text-slate-400">Lịch làm việc định kỳ hàng tuần</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Ngày phục vụ:</span>
                <span className="font-semibold text-emerald-400 text-sm">
                  {profile.workingDays || 'Thứ 2 - Chủ Nhật'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Hồ Sơ Cá Nhân */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full rounded-3xl p-6 sm:p-8 space-y-5 my-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-purple-400" />
                  <span>Chỉnh Sửa Hồ Sơ Cá Nhân</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Cập nhật ảnh đại diện (avatar), thông tin cá nhân và thời gian làm việc.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-950 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} noValidate className="space-y-4 text-xs">
              {/* Phần Avatar (Ảnh đại diện) */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <label className="block text-slate-200 font-bold text-xs">
                  Ảnh Đại Diện Chuyên Viên (Avatar)
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Avatar Preview */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                    {editForm.avatar ? (
                      <img
                        src={editForm.avatar}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleAvatarFile}
                        className="hidden"
                        id="avatar-file-upload-input"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {uploadingAvatar ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang tải ảnh...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Tải Ảnh Từ Máy Tính</span>
                          </>
                        )}
                      </button>

                      {editForm.avatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-800/60 font-semibold text-xs transition-colors cursor-pointer"
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
                        value={editForm.avatar}
                        onChange={handleEditChange}
                        placeholder="Hoặc dán URL ảnh trực tiếp (https://...)"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-[11px] placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin cơ bản: Họ tên & SĐT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Họ và Tên Nghệ Sĩ *
                  </label>
                  <input
                    type="text"
                    required
                    name="fullName"
                    value={editForm.fullName}
                    onChange={handleEditChange}
                    placeholder="Nguyễn Thùy Linh"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Số Điện Thoại Liên Hệ *
                  </label>
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditChange}
                    placeholder="0912345678"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Khung giờ & Ngày làm việc */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Khung Giờ Nhận Ca Trong Ngày
                  </label>
                  <input
                    type="text"
                    name="workingHours"
                    value={editForm.workingHours}
                    onChange={handleEditChange}
                    placeholder="08:00 - 20:00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Ngày Làm Việc Định Kỳ
                  </label>
                  <input
                    type="text"
                    name="workingDays"
                    value={editForm.workingDays}
                    onChange={handleEditChange}
                    placeholder="Thứ 2 - Chủ Nhật"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Kinh nghiệm làm nghề */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Kinh Nghiệm & Bằng Cấp Nghề Nghiệp
                </label>
                <textarea
                  rows={3}
                  name="experience"
                  value={editForm.experience}
                  onChange={handleEditChange}
                  placeholder="Ví dụ: 5 năm kinh nghiệm chuyên nghiệp, từng makeup cho show diễn..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Active Checkbox */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="artist-edit-active-check"
                  name="active"
                  checked={editForm.active}
                  onChange={handleEditChange}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-950 border-slate-800 cursor-pointer"
                />
                <label htmlFor="artist-edit-active-check" className="text-slate-300 font-semibold cursor-pointer">
                  Kích hoạt trạng thái: Sẵn sàng nhận lịch đặt hẹn từ khách hàng
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>

                <button
                  type="submit"
                  disabled={saving || uploadingAvatar}
                  id="btn-submit-edit-artist-profile"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-md shadow-purple-600/30 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
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
        </div>
      )}
    </div>
  );
};

export default ArtistProfilePage;
