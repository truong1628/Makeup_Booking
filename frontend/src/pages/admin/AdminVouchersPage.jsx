import React, { useEffect, useState } from 'react';
import {
  Tag, Plus, Edit3, Trash2, CheckCircle2, AlertCircle,
  Percent, X, Loader2,
  Gift, Search, RefreshCw, Copy
} from 'lucide-react';
import { voucherService } from '../../services/voucherService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/format';

const AdminVouchersPage = () => {
  const toast = useToast();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    maxDiscountAmount: 100000,
    minOrderAmount: 200000,
    startDate: '',
    endDate: '',
    usageLimit: 100,
    active: true,
  });

  // State xóa voucher
  const [deletingVoucher, setDeletingVoucher] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State toggle nhanh
  const [togglingId, setTogglingId] = useState(null);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const res = await voucherService.getAllVouchersForAdmin();
      setVouchers(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách voucher:', err);
      toast.error('Không thể tải danh sách voucher: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  const handleOpenCreate = () => {
    setEditingVoucher(null);
    setModalError(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxDiscountAmount: 100000,
      minOrderAmount: 200000,
      startDate: new Date().toISOString().substring(0, 16),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16),
      usageLimit: 100,
      active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (voucher) => {
    setEditingVoucher(voucher);
    setModalError(null);
    setFormData({
      code: voucher.code || '',
      name: voucher.name || '',
      description: voucher.description || '',
      discountType: voucher.discountType || 'PERCENTAGE',
      discountValue: voucher.discountValue || 0,
      maxDiscountAmount: voucher.maxDiscountAmount || '',
      minOrderAmount: voucher.minOrderAmount || 0,
      startDate: voucher.startDate ? voucher.startDate.substring(0, 16) : '',
      endDate: voucher.endDate ? voucher.endDate.substring(0, 16) : '',
      usageLimit: voucher.usageLimit || '',
      active: voucher.active !== false,
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);

    const cleanCode = (formData.code || '').trim().toUpperCase();
    if (!cleanCode) {
      setModalError('Vui lòng nhập mã voucher');
      return;
    }
    if (!formData.name.trim()) {
      setModalError('Vui lòng nhập tên chương trình khuyến mãi');
      return;
    }
    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      setModalError('Giá trị chiết khấu phải lớn hơn 0');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: cleanCode,
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : 0,
        startDate: formData.startDate ? formData.startDate : null,
        endDate: formData.endDate ? formData.endDate : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        active: formData.active,
      };

      if (editingVoucher) {
        await voucherService.updateVoucher(editingVoucher.id, payload);
        toast.success(`✅ Cập nhật voucher '${cleanCode}' thành công!`);
      } else {
        await voucherService.createVoucher(payload);
        toast.success(`🎉 Tạo mới voucher '${cleanCode}' thành công!`);
      }

      setShowModal(false);
      loadVouchers();
    } catch (err) {
      const msg = err.message || 'Lỗi khi lưu voucher';
      setModalError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (voucher) => {
    try {
      setTogglingId(voucher.id);
      const res = await voucherService.toggleStatus(voucher.id);
      setVouchers((prev) =>
        prev.map((v) => (v.id === voucher.id ? { ...v, active: res.active } : v))
      );
      toast.success(res.active ? `Đã kích hoạt voucher '${voucher.code}'` : `Đã tạm ẩn voucher '${voucher.code}'`);
    } catch (err) {
      toast.error('Lỗi khi đổi trạng thái: ' + (err.message || ''));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingVoucher) return;
    setIsDeleting(true);
    try {
      await voucherService.deleteVoucher(deletingVoucher.id);
      setVouchers((prev) => prev.filter((v) => v.id !== deletingVoucher.id));
      toast.success(`Đã xóa voucher '${deletingVoucher.code}'`);
      setDeletingVoucher(null);
    } catch (err) {
      toast.error('Không thể xóa voucher: ' + (err.message || ''));
    } finally {
      setIsDeleting(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép mã '${code}'`);
  };

  // Filter vouchers
  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch =
      v.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.name?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterStatus === 'ACTIVE') return v.active === true;
    if (filterStatus === 'INACTIVE') return v.active === false;
    return true;
  });

  // Calculate statistics
  const totalCount = vouchers.length;
  const activeCount = vouchers.filter((v) => v.active === true).length;
  const totalUsedCount = vouchers.reduce((acc, v) => acc + (v.usedCount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Tag className="w-6 h-6" />
            </span>
            <span>Mã Giảm Giá & Khuyến Mãi</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Quản lý các chương trình ưu đãi, mã voucher chiết khấu và điều kiện áp dụng cho khách hàng
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Mã Voucher Mới</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Tổng Chương Trình</p>
            <p className="text-2xl font-bold text-white font-serif">{totalCount}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Đang Hoạt Động</p>
            <p className="text-2xl font-bold text-emerald-400 font-serif">{activeCount}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Lượt Sử Dụng Thực Tế</p>
            <p className="text-2xl font-bold text-amber-400 font-serif">{totalUsedCount}</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã hoặc tên voucher..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterStatus === 'ALL' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterStatus === 'ACTIVE' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Đang bật ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('INACTIVE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterStatus === 'INACTIVE' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Đã ẩn ({totalCount - activeCount})
            </button>
          </div>

          <button
            type="button"
            onClick={loadVouchers}
            title="Tải lại danh sách"
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Vouchers Grid / Table */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-3xl bg-slate-900/60 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 rounded-3xl border border-slate-800 p-8">
          <Tag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-300">Không tìm thấy voucher nào</p>
          <p className="text-xs text-slate-500 mt-1">
            {vouchers.length === 0
              ? 'Hệ thống chưa có mã giảm giá nào. Hãy nhấn "Thêm Mã Voucher Mới" để tạo.'
              : 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVouchers.map((voucher) => {
            const usagePercent = voucher.usageLimit
              ? Math.min(100, Math.round(((voucher.usedCount || 0) / voucher.usageLimit) * 100))
              : null;

            return (
              <div
                key={voucher.id}
                className="group rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-sm hover:border-slate-700 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Card Header: Code & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-extrabold px-3 py-1 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 tracking-wider">
                        {voucher.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyCode(voucher.code)}
                        title="Sao chép mã"
                        className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={togglingId === voucher.id}
                      onClick={() => handleToggleStatus(voucher)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                        voucher.active
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${voucher.active ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                      <span>{togglingId === voucher.id ? '...' : voucher.active ? 'Hoạt Động' : 'Tạm Ẩn'}</span>
                    </button>
                  </div>

                  {/* Name & Description */}
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition-colors">
                      {voucher.name}
                    </h3>
                    {voucher.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {voucher.description}
                      </p>
                    )}
                  </div>

                  {/* Discount details */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Mức chiết khấu:</span>
                      <span className="font-bold text-rose-400">
                        {voucher.discountType === 'PERCENTAGE'
                          ? `Giảm ${voucher.discountValue}% ${voucher.maxDiscountAmount ? `(Tối đa ${formatCurrency(voucher.maxDiscountAmount)})` : ''}`
                          : `Giảm ${formatCurrency(voucher.discountValue)}`}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Đơn tối thiểu:</span>
                      <span className="font-medium text-slate-200">
                        {voucher.minOrderAmount > 0 ? formatCurrency(voucher.minOrderAmount) : 'Không giới hạn'}
                      </span>
                    </div>

                    {/* Usage count progress */}
                    <div className="pt-1.5 border-t border-slate-900 space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Đã sử dụng:</span>
                        <span className="font-semibold text-amber-400">
                          {voucher.usedCount || 0} / {voucher.usageLimit ? `${voucher.usageLimit} lượt` : '∞ Không giới hạn'}
                        </span>
                      </div>
                      {usagePercent !== null && (
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              usagePercent >= 90 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-rose-500'
                            }`}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(voucher)}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Chỉnh Sửa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingVoucher(voucher)}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tạo Mới / Chỉnh Sửa Voucher */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-rose-500" />
                <span>{editingVoucher ? `Chỉnh Sửa Mã '${editingVoucher.code}'` : 'Tạo Mới Mã Khuyến Mãi'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Mã Voucher (Code) *</label>
                  <input
                    type="text"
                    name="code"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="VD: WELCOME10"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Loại Chiết Khấu *</label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="PERCENTAGE">Theo Phần Trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số Tiền Cố Định (VNĐ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Tên Chương Trình *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="VD: Giảm 10% Chào Mừng Khách Mới"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    {formData.discountType === 'PERCENTAGE' ? 'Phần Trăm Giảm (%) *' : 'Số Tiền Giảm (VNĐ) *'}
                  </label>
                  <input
                    type="number"
                    name="discountValue"
                    required
                    min="1"
                    value={formData.discountValue}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Giảm Tối Đa (VNĐ)</label>
                  <input
                    type="number"
                    name="maxDiscountAmount"
                    value={formData.maxDiscountAmount}
                    onChange={handleFormChange}
                    placeholder="Bỏ trống nếu không giới hạn"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Đơn Tối Thiểu (VNĐ)</label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={formData.minOrderAmount}
                    onChange={handleFormChange}
                    placeholder="VD: 200000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Giới Hạn Lượt Dùng</label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleFormChange}
                    placeholder="Bỏ trống nếu không giới hạn"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Ngày Bắt Đầu</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Ngày Hết Hạn</label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Mô Tả Chương Trình</label>
                <textarea
                  rows={2}
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Mô tả quyền lợi hoặc điều kiện đặc biệt..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="checkbox-voucher-active"
                  name="active"
                  checked={formData.active}
                  onChange={handleFormChange}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-950 border-slate-800 cursor-pointer"
                />
                <label htmlFor="checkbox-voucher-active" className="text-slate-300 font-semibold cursor-pointer">
                  Kích hoạt cho khách hàng sử dụng ngay
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-rose-600/20"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingVoucher ? 'Lưu Thay Đổi' : 'Tạo Voucher'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xóa Voucher */}
      {deletingVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Xác Nhận Xóa Voucher</h3>
                <p className="text-xs text-slate-400">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa mã voucher{' '}
              <strong className="text-rose-400 font-mono">'{deletingVoucher.code}'</strong> (
              {deletingVoucher.name}) khỏi hệ thống?
            </p>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingVoucher(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Xóa Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVouchersPage;
