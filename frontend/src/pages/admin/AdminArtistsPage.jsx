import React, { useEffect, useState } from 'react';
import {
  Palette, Plus, Mail, Phone, Clock, Calendar, CheckCircle2,
  AlertCircle, User, ShieldCheck, Edit3, Trash2, X, Check, Loader2
} from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';
import { useToast } from '../../context/ToastContext';

const AdminArtistsPage = () => {
  const toast = useToast();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State tạo mới
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: 'Password123@',
    experience: '3 năm kinh nghiệm',
    specialties: 'Trang điểm cô dâu, dạ tiệc, kỷ yếu',
    workingHours: '08:00 - 20:00',
    workingDays: 'Thứ 2 - Chủ Nhật',
  });

  // State chỉnh sửa chuyên viên
  const [editingArtist, setEditingArtist] = useState(null);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    experience: '',
    specialties: '',
    workingHours: '',
    workingDays: '',
    active: true,
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  // State xóa chuyên viên
  const [deletingArtist, setDeletingArtist] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State toggle nhanh trạng thái
  const [togglingId, setTogglingId] = useState(null);

  const loadArtists = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/v1/admin/artists');
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setArtists(list);
    } catch (err) {
      console.error('Lỗi khi tải danh sách thợ:', err);
      toast.error('Không thể tải danh sách thợ: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (artist) => {
    try {
      setTogglingId(artist.id);
      const res = await axiosInstance.patch(`/api/v1/admin/artists/${artist.id}/toggle-status`);
      const newStatus = res?.data?.active ?? !artist.active;
      setArtists(prev => prev.map(a => a.id === artist.id ? { ...a, active: newStatus } : a));
      toast.success(newStatus ? `Đã kích hoạt thợ ${artist.fullName}` : `Đã tạm ẩn thợ ${artist.fullName}`);
    } catch (err) {
      toast.error('Lỗi khi đổi trạng thái: ' + (err.message || ''));
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    loadArtists();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Tạo tài khoản thợ mới
  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);

    const nameRegex = /^[\p{L}\s]+$/u;
    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ và tên');
      return;
    }
    if (!nameRegex.test(formData.fullName.trim())) {
      setError('Họ và tên không được chứa ký tự đặc biệt');
      return;
    }

    setSubmitting(true);

    try {
      await axiosInstance.post('/api/v1/admin/artists', {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: 'ROLE_ARTIST',
        experience: formData.experience,
        specialties: formData.specialties,
        workingHours: formData.workingHours,
        workingDays: formData.workingDays,
      });

      toast.success(`🎉 Admin đã cấp tài khoản Thợ Trang Điểm '${formData.fullName}' thành công!`);
      setShowModal(false);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        password: 'Password123@',
        experience: '3 năm kinh nghiệm',
        specialties: 'Trang điểm cô dâu, dạ tiệc, kỷ yếu',
        workingHours: '08:00 - 20:00',
        workingDays: 'Thứ 2 - Chủ Nhật',
      });
      loadArtists();
    } catch (err) {
      const errMsg = err.message || 'Không thể tạo tài khoản thợ trang điểm';
      setError(errMsg);
      toast.error(`❌ ${errMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Mở modal chỉnh sửa
  const handleOpenEdit = (artist) => {
    setEditingArtist(artist);
    setEditError(null);
    setEditFormData({
      fullName: artist.fullName || '',
      phone: artist.phone || '',
      password: '',
      experience: artist.experience || '',
      specialties: artist.specialties || '',
      workingHours: artist.workingHours || '08:00 - 20:00',
      workingDays: artist.workingDays || 'Thứ 2 - Chủ Nhật',
      active: artist.active !== false,
    });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Gửi cập nhật thông tin thợ
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editingArtist) return;
    setEditError(null);

    const nameRegex = /^[\p{L}\s]+$/u;
    if (!editFormData.fullName.trim()) {
      setEditError('Vui lòng nhập họ và tên');
      return;
    }
    if (!nameRegex.test(editFormData.fullName.trim())) {
      setEditError('Họ và tên không được chứa ký tự đặc biệt');
      return;
    }

    setSubmittingEdit(true);

    try {
      const res = await axiosInstance.put(`/api/v1/admin/artists/${editingArtist.id}`, editFormData);
      const updated = res.data || editFormData;

      setArtists(prev => prev.map(a => a.id === editingArtist.id ? { ...a, ...updated } : a));
      toast.success(`✅ Đã cập nhật chuyên viên '${editFormData.fullName}' thành công!`);
      setEditingArtist(null);
    } catch (err) {
      const errMsg = err.message || 'Không thể cập nhật chuyên viên';
      setEditError(errMsg);
      toast.error(`❌ ${errMsg}`);
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Xác nhận xóa chuyên viên
  const handleConfirmDelete = async () => {
    if (!deletingArtist) return;
    setIsDeleting(true);

    try {
      await axiosInstance.delete(`/api/v1/admin/artists/${deletingArtist.id}`);
      setArtists(prev => prev.filter(a => a.id !== deletingArtist.id));
      toast.success(`🗑️ Đã xóa chuyên viên '${deletingArtist.fullName}' thành công!`);
      setDeletingArtist(null);
    } catch (err) {
      const errMsg = err.message || 'Không thể xóa chuyên viên trang điểm';
      toast.error(`❌ ${errMsg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Quản Lý Đội Ngũ Thợ Trang Điểm (Artists)
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Chỉ Quản trị viên (Admin) mới có quyền tạo mới, cấp tài khoản, chỉnh sửa và phân quyền cho Chuyên gia Makeup.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 text-white text-xs font-semibold shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Tài Khoản Thợ Mới</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-44 rounded-3xl bg-slate-900/60 animate-pulse" />
          ))}
        </div>
      ) : artists.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
          <Palette className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">Chưa có thợ trang điểm nào</h3>
          <p className="text-xs text-slate-400">
            Hệ thống chưa có chuyên viên makeup nào. Nhấn nút bên dưới để cấp tài khoản thợ mới.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-semibold cursor-pointer"
          >
            Tạo Tài Khoản Thợ Mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {artists.map((artist) => (
            <div
              key={artist.id}
              className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-rose-500 flex items-center justify-center text-white font-bold text-base shadow-md shrink-0">
                      {artist.fullName?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {artist.fullName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{artist.email}</span>
                        <span>•</span>
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{artist.phone}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(artist)}
                    disabled={togglingId === artist.id}
                    title="Nhấn để bật/tắt trạng thái"
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                      artist.active !== false
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${artist.active !== false ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    <span>{togglingId === artist.id ? '...' : (artist.active !== false ? 'Đang Hoạt Động' : 'Tạm Khóa')}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Kinh nghiệm:</span>
                    <span className="font-medium text-amber-400">{artist.experience || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Sở trường:</span>
                    <span className="font-medium text-slate-200 text-right max-w-[240px] truncate">{artist.specialties || 'Đa dạng phong cách'}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Khung giờ làm:</span>
                    <span className="font-medium text-slate-200">{artist.workingHours || '08:00 - 20:00'} ({artist.workingDays || 'Thứ 2 - CN'})</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Chỉnh Sửa & Xóa Chuyên Viên */}
              <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(artist)}
                  id={`btn-edit-artist-${artist.id}`}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all hover:shadow-md cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Chỉnh Sửa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeletingArtist(artist)}
                  id={`btn-delete-artist-${artist.id}`}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-950/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-900/50 hover:border-rose-600 text-xs font-semibold transition-all hover:shadow-md hover:shadow-rose-600/20 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa Chuyên Viên</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Admin Tạo Thợ Trang Điểm Mới */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-3xl p-6 sm:p-8 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-rose-500" />
                  <span>Khởi Tạo Tài Khoản Thợ Mới</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Tài khoản sẽ được cấp quyền ROLE_ARTIST và kích hoạt vào hệ thống.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Họ và tên Thợ *</label>
                <input
                  type="text"
                  required
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Ví dụ: Hoàng Lan Anh"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Email Đăng Nhập *</label>
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="lananh.art@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Số Điện Thoại *</label>
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0987654321"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Mật khẩu cấp sẵn *</label>
                <input
                  type="text"
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Số Năm Kinh Nghiệm</label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="Ví dụ: 4 năm kinh nghiệm"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Khung Giờ Làm Việc</label>
                  <input
                    type="text"
                    name="workingHours"
                    value={formData.workingHours}
                    onChange={handleChange}
                    placeholder="Ví dụ: 08:00 - 20:00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Sở Trường / Phong Cách Nổi Bật</label>
                <input
                  type="text"
                  name="specialties"
                  value={formData.specialties}
                  onChange={handleChange}
                  placeholder="Ví dụ: Cô dâu tone Thái, kỷ yếu Hàn Quốc trong veo"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 text-white font-semibold shadow-md disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submitting ? 'Đang khởi tạo...' : 'Tạo Tài Khoản Thợ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Chuyên Viên Trang Điểm */}
      {editingArtist && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-3xl p-6 sm:p-8 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-rose-500" />
                  <span>Chỉnh Sửa Thông Tin Chuyên Viên</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Cập nhật thông tin chuyên môn, khung giờ làm việc và liên hệ.
                </p>
              </div>
              <button
                onClick={() => setEditingArtist(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Read-only account info badge */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Tài khoản email (Cố định):</span>
                <span className="font-semibold text-white">{editingArtist.email}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px]">
                ID #{editingArtist.id}
              </span>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-950 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    name="fullName"
                    value={editFormData.fullName}
                    onChange={handleEditChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Số Điện Thoại *</label>
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Số Năm Kinh Nghiệm</label>
                  <input
                    type="text"
                    name="experience"
                    value={editFormData.experience}
                    onChange={handleEditChange}
                    placeholder="Ví dụ: 5 năm kinh nghiệm"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Khung Giờ Làm Việc</label>
                  <input
                    type="text"
                    name="workingHours"
                    value={editFormData.workingHours}
                    onChange={handleEditChange}
                    placeholder="08:00 - 20:00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Đổi mật khẩu mới (Bỏ trống nếu không đổi)</label>
                <input
                  type="text"
                  name="password"
                  value={editFormData.password}
                  onChange={handleEditChange}
                  placeholder="Nhập mật khẩu mới nếu muốn cấp lại..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Ngày Làm Việc Trong Tuần</label>
                <input
                  type="text"
                  name="workingDays"
                  value={editFormData.workingDays}
                  onChange={handleEditChange}
                  placeholder="Thứ 2 - Chủ Nhật"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Sở Trường / Phong Cách Nổi Bật</label>
                <textarea
                  rows={2}
                  name="specialties"
                  value={editFormData.specialties}
                  onChange={handleEditChange}
                  placeholder="Ví dụ: Trang điểm cô dâu tone Thái, tiệc tối Glamour, dạ tiệc..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="checkbox-edit-active"
                  name="active"
                  checked={editFormData.active}
                  onChange={handleEditChange}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-950 border-slate-800"
                />
                <label htmlFor="checkbox-edit-active" className="text-slate-300 font-semibold cursor-pointer">
                  Kích hoạt nhận lịch đặt (Đang Hoạt Động)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingArtist(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 text-white font-semibold shadow-md disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {submittingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Lưu Thay Đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xóa Chuyên Viên */}
      {deletingArtist && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                Xóa Chuyên Viên Trang Điểm?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bạn có chắc chắn muốn xóa vĩnh viễn chuyên viên <strong className="text-white font-semibold">{deletingArtist.fullName}</strong> ({deletingArtist.email}) khỏi hệ thống?
              </p>
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-[11px] text-rose-300 text-left">
                ⚠️ <strong>Lưu ý:</strong> Nếu chuyên viên này đã từng có lịch hẹn gắn liền, hệ thống sẽ tự động bảo vệ dữ liệu lịch sử và yêu cầu bạn chọn <strong>"Tạm Khóa"</strong> thay vì xóa.
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingArtist(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Xác Nhận Xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminArtistsPage;
