import React, { useEffect, useState, useMemo } from 'react';
import {
  Sparkles, Plus, Clock, AlertCircle, CheckCircle2, Layers,
  Search, Edit3, EyeOff, X, Image as ImageIcon,
  Tag, RefreshCw, Upload, Loader2, Trash2
} from 'lucide-react';
import { serviceService } from '../../services/serviceService';
import { categoryService } from '../../services/categoryService';
import { uploadService } from '../../services/uploadService';
import { formatCurrency } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

// Danh sách ảnh minh họa mặc định cho dịch vụ
const PRESET_IMAGES = [
  {
    label: 'Cô Dâu Sang Trọng',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Dự Tiệc Quyến Rũ',
    url: 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Hàn Quốc Tự Nhiên',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Làm Tóc & Phụ Kiện',
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
  },
];

// Hàm dọn dẹp tên dịch vụ (bỏ phần đóng mở ngoặc Makeup + ...)
const cleanTitle = (title) => {
  if (!title) return '';
  return title.replace(/\s*\([^)]*makeup[^)]*\)/gi, '').trim();
};

const AdminServicesPage = () => {
  const toast = useToast();

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  // Bộ lọc & tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'SINGLE' | 'COMBO'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  // Modal thêm / sửa
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null); // null: thêm mới, object: đang sửa
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Modal xác nhận xóa dịch vụ
  const [deletingService, setDeletingService] = useState(null); // null: đóng modal, object: dịch vụ cần xóa
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    serviceName: '',
    price: '',
    duration: 60,
    description: '',
    image: PRESET_IMAGES[0].url,
    isCombo: false,
    categoryId: '',
    active: true,
  });

  // Selected combo items map: { [serviceId]: quantity }
  const [selectedComboItems, setSelectedComboItems] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);

  // Xử lý upload ảnh trực tiếp lên Cloudinary
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 10MB');
      return;
    }

    setUploadingImage(true);
    try {
      const secureUrl = await uploadService.uploadImage(file);
      setFormData((prev) => ({ ...prev, image: secureUrl }));
      toast.success('Đã tải ảnh lên Cloudinary thành công!');
    } catch (err) {
      toast.error('Lỗi khi tải ảnh lên Cloudinary: ' + (err.message || ''));
    } finally {
      setUploadingImage(false);
    }
  };

  // Tải toàn bộ danh sách dịch vụ và danh mục
  const loadData = async () => {
    try {
      setLoading(true);
      const [data, cats] = await Promise.all([
        serviceService.getAllServicesForAdmin(),
        categoryService.getAllCategoriesForAdmin().catch(() => []),
      ]);
      setServices(data);
      if (Array.isArray(cats)) {
        setCategories(cats);
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách dịch vụ: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Danh sách các dịch vụ đơn lẻ để đưa vào Gói Combo (sắp xếp giá từ thấp đến cao)
  const availableSingleServices = useMemo(() => {
    return services
      .filter((s) => !s.isCombo)
      .sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  }, [services]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.active !== false).length;
    const inactive = total - active;
    const comboCount = services.filter((s) => s.isCombo).length;
    return { total, active, inactive, comboCount };
  }, [services]);

  // Lọc và sắp xếp danh sách: Gói Combo hiện trước -> Dịch vụ lẻ hiện sau, mỗi nhóm sắp xếp giá từ thấp đến cao
  const filteredServices = useMemo(() => {
    return services
      .filter((item) => {
        // 1. Lọc theo từ khóa tìm kiếm
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = item.serviceName.toLowerCase().includes(q);
          const matchDesc = item.description && item.description.toLowerCase().includes(q);
          if (!matchName && !matchDesc) return false;
        }

        // 2. Lọc theo Loại (Đơn / Combo)
        if (typeFilter === 'SINGLE' && item.isCombo) return false;
        if (typeFilter === 'COMBO' && !item.isCombo) return false;

        // 3. Lọc theo Trạng thái (Hoạt động / Ngừng)
        const isActive = item.active !== false;
        if (statusFilter === 'ACTIVE' && !isActive) return false;
        if (statusFilter === 'INACTIVE' && isActive) return false;

        return true;
      })
      .sort((a, b) => {
        const comboDiff = Number(Boolean(b.isCombo)) - Number(Boolean(a.isCombo));
        if (comboDiff !== 0) return comboDiff;
        return Number(a.price || 0) - Number(b.price || 0);
      });
  }, [services, searchQuery, typeFilter, statusFilter]);

  // Tính toán tổng giá gốc và thời lượng gợi ý cho Combo
  const comboCalculations = useMemo(() => {
    let originalPrice = 0;
    let suggestedDuration = 0;
    let selectedCount = 0;

    Object.entries(selectedComboItems).forEach(([srvId, qty]) => {
      if (qty > 0) {
        const found = availableSingleServices.find((s) => String(s.id) === String(srvId));
        if (found) {
          originalPrice += Number(found.price || 0) * qty;
          suggestedDuration += Number(found.duration || 0) * qty;
          selectedCount += qty;
        }
      }
    });

    const currentPrice = Number(formData.price) || 0;
    const savings = originalPrice > currentPrice && currentPrice > 0
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;

    return { originalPrice, suggestedDuration, selectedCount, savings };
  }, [selectedComboItems, availableSingleServices, formData.price]);

  // Mở modal Thêm Dịch Vụ Mới
  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      serviceName: '',
      price: '',
      duration: 60,
      description: '',
      image: PRESET_IMAGES[0].url,
      isCombo: false,
      categoryId: '',
      active: true,
    });
    setSelectedComboItems({});
    setFormError(null);
    setShowModal(true);
  };

  // Mở modal Sửa Dịch Vụ
  const handleOpenEdit = (item) => {
    setEditingService(item);
    setFormData({
      serviceName: item.serviceName || '',
      price: item.price != null ? Number(item.price) : '',
      duration: item.duration || 60,
      description: item.description || '',
      image: item.image || PRESET_IMAGES[0].url,
      isCombo: Boolean(item.isCombo),
      categoryId: item.categoryId || '',
      active: item.active !== false,
    });

    // Điền lại các món trong combo nếu là combo
    const initialComboMap = {};
    if (item.isCombo && item.comboItems) {
      item.comboItems.forEach((ci) => {
        initialComboMap[ci.itemServiceId] = ci.quantity || 1;
      });
    }
    setSelectedComboItems(initialComboMap);
    setFormError(null);
    setShowModal(true);
  };

  // Bật/tắt trạng thái Ẩn/Hiện
  const handleToggleStatus = async (item) => {
    try {
      setTogglingId(item.id);
      const res = await serviceService.toggleStatus(item.id);
      const newStatus = res?.active ?? !item.active;

      setServices((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, active: newStatus } : s))
      );

      toast.success(
        newStatus
          ? `✅ Đã hiển thị dịch vụ '${item.serviceName}' cho khách hàng`
          : `⏸️ Đã ẩn dịch vụ '${item.serviceName}' khỏi danh sách khách hàng`
      );
    } catch (err) {
      toast.error('Không thể thay đổi trạng thái: ' + (err.message || ''));
    } finally {
      setTogglingId(null);
    }
  };

  // Xác nhận xóa dịch vụ
  const handleConfirmDelete = async () => {
    if (!deletingService) return;
    try {
      setIsDeleting(true);
      await serviceService.deleteService(deletingService.id);
      
      // Loại bỏ dịch vụ khỏi danh sách hiển thị
      setServices((prev) => prev.filter((s) => s.id !== deletingService.id));
      toast.success(`🗑️ Đã xóa dịch vụ '${deletingService.serviceName}' thành công!`);
      setDeletingService(null);
    } catch (err) {
      toast.error('Không thể xóa dịch vụ: ' + (err.message || ''));
    } finally {
      setIsDeleting(false);
    }
  };

  // Xử lý tick chọn món combo
  const handleToggleComboChild = (serviceId) => {
    setSelectedComboItems((prev) => {
      const copy = { ...prev };
      if (copy[serviceId]) {
        delete copy[serviceId];
      } else {
        copy[serviceId] = 1;
      }
      return copy;
    });
  };

  // Xử lý thay đổi số lượng món con trong combo
  const handleQuantityChange = (serviceId, delta) => {
    setSelectedComboItems((prev) => {
      const current = prev[serviceId] || 1;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[serviceId];
        return copy;
      }
      return { ...prev, [serviceId]: next };
    });
  };

  // Áp dụng thời lượng gợi ý của Combo
  const applySuggestedDuration = () => {
    if (comboCalculations.suggestedDuration > 0) {
      setFormData((prev) => ({ ...prev, duration: comboCalculations.suggestedDuration }));
    }
  };

  // Lưu dịch vụ (Thêm hoặc Sửa)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validation cơ bản bằng Tiếng Việt
    if (!formData.serviceName.trim()) {
      setFormError('Vui lòng nhập tên dịch vụ');
      return;
    }
    if (formData.price === '' || formData.price === null || Number(formData.price) <= 0) {
      setFormError('Giá dịch vụ phải lớn hơn 0 VNĐ');
      return;
    }
    if (!formData.duration || Number(formData.duration) < 1) {
      setFormError('Thời lượng thực hiện phải từ 1 phút trở lên');
      return;
    }

    // Nếu là combo: kiểm tra ít nhất 1 món
    let formattedComboItems = [];
    if (formData.isCombo) {
      formattedComboItems = Object.entries(selectedComboItems)
        .filter(([, qty]) => qty > 0)
        .map(([srvId, qty]) => ({
          serviceId: Number(srvId),
          quantity: qty,
        }));

      if (formattedComboItems.length === 0) {
        setFormError('Gói Combo bắt buộc phải chọn ít nhất 1 dịch vụ đơn lẻ thành phần');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        serviceName: formData.serviceName.trim(),
        price: Number(formData.price),
        duration: Number(formData.duration) || 60,
        description: formData.description.trim(),
        image: formData.image || PRESET_IMAGES[0].url,
        isCombo: formData.isCombo,
        categoryId: formData.categoryId ? Number(formData.categoryId) : null,
        active: formData.active,
        comboItems: formData.isCombo ? formattedComboItems : null,
      };

      if (editingService) {
        await serviceService.updateService(editingService.id, payload);
        toast.success(`🎉 Cập nhật dịch vụ '${payload.serviceName}' thành công!`);
      } else {
        await serviceService.createService(payload);
        toast.success(`🎉 Thêm mới dịch vụ '${payload.serviceName}' thành công!`);
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Có lỗi xảy ra khi lưu dịch vụ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <span>Quản Lý Dịch Vụ & Gói Combo</span>

          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Toàn quyền điều chỉnh giá niêm yết, thời lượng, ảnh minh họa, danh sách món trong combo và trạng thái ẩn/hiện.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Tải lại danh sách"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            id="btn-admin-add-service"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Dịch Vụ Mới</span>
          </button>
        </div>
      </div>

      {/* Quick KPI stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tổng Dịch Vụ</p>
            <p className="text-2xl font-bold text-white font-serif mt-0.5">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Đang Hoạt Động</p>
            <p className="text-2xl font-bold text-emerald-400 font-serif mt-0.5">{stats.active}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tạm Ẩn / Ngừng</p>
            <p className="text-2xl font-bold text-slate-400 font-serif mt-0.5">{stats.inactive}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center font-bold">
            <EyeOff className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gói Combo</p>
            <p className="text-2xl font-bold text-amber-400 font-serif mt-0.5">{stats.comboCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Ô tìm kiếm nhanh */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              id="input-admin-search-service"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên dịch vụ, phong cách makeup hoặc từ khóa mô tả..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Lọc theo Loại (Đơn / Combo) */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${typeFilter === 'ALL'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              Tất Cả Loại
            </button>
            <button
              onClick={() => setTypeFilter('SINGLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${typeFilter === 'SINGLE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              Dịch Vụ Đơn
            </button>
            <button
              onClick={() => setTypeFilter('COMBO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${typeFilter === 'COMBO'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              Gói Combo
            </button>
          </div>

          {/* Lọc theo Trạng thái hoạt động */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              Tất Cả TT
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-emerald-400'
                }`}
            >
              Đang Hiện
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === 'INACTIVE'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Đang Ẩn
            </button>
          </div>
        </div>
      </div>

      {/* Grid of services */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-96 rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
          <Search className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">Không tìm thấy dịch vụ phù hợp</h3>
          <p className="text-xs text-slate-400">
            Vui lòng thử tìm kiếm với từ khóa khác hoặc bỏ các điều kiện lọc.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setTypeFilter('ALL'); setStatusFilter('ALL'); }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Đặt Lại Bộ Lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredServices.map((s) => {
            const isActive = s.active !== false;

            return (
              <div
                key={s.id}
                className={`rounded-3xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden group ${
                  !isActive
                    ? 'bg-slate-900/70 border border-slate-800/80 opacity-75'
                    : s.isCombo
                      ? 'bg-slate-900/90 border-2 border-amber-400 ring-4 ring-amber-400/20 shadow-lg shadow-amber-500/10 hover:shadow-2xl hover:shadow-amber-500/25'
                      : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-md hover:shadow-xl'
                }`}
              >
                {/* Image Container with Title & Price OVERLAID directly on it */}
                <div className="relative aspect-[4/5] w-full bg-slate-950 overflow-hidden">
                  {s.image ? (
                    <img
                      src={s.image}
                      alt={cleanTitle(s.serviceName)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-rose-950/20 to-slate-900 text-slate-500 group-hover:scale-105 transition-transform duration-500">
                      <Sparkles className="w-10 h-10 text-rose-500/40 mb-2" />
                      <span className="text-[11px] font-medium text-slate-400">Chưa có ảnh dịch vụ</span>
                    </div>
                  )}

                  {/* Dark Gradient Overlay for high-contrast legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    {s.isCombo ? (
                      <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white text-[10px] font-bold shadow-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-200" />
                        <span>Combo Hot</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-200 border border-slate-700 text-[10px] font-semibold flex items-center gap-1">
                        <Tag className="w-3 h-3 text-rose-400" />
                        <span>Dịch Vụ Đơn</span>
                      </span>
                    )}

                    {/* Top right: Duration and quick toggle status */}
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-300" />
                        <span>{s.duration}p</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(s);
                        }}
                        title={isActive ? 'Nhấn để tạm ẩn dịch vụ' : 'Nhấn để hiển thị dịch vụ'}
                        disabled={togglingId === s.id}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 backdrop-blur-md transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                        <span>{togglingId === s.id ? '...' : isActive ? 'Hiện' : 'Ẩn'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Content OVERLAID on image: Tên dịch vụ & Giá */}
                  <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end pointer-events-none">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] font-mono font-semibold text-slate-300 bg-slate-900/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-slate-700">
                        #{s.id}
                      </span>
                      {s.categoryName && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300">
                          {s.categoryName}
                        </span>
                      )}
                      {s.isCombo && s.comboItems && s.comboItems.length > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/25 border border-amber-300/40 text-amber-200">
                          {s.comboItems.length} dịch vụ con
                        </span>
                      )}
                    </div>

                    <h3 className="text-white font-bold text-base leading-snug drop-shadow-md group-hover:text-rose-300 transition-colors break-words">
                      {cleanTitle(s.serviceName)}
                    </h3>

                    <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-white/20">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-amber-300 drop-shadow-md">
                          {formatCurrency(s.price)}
                        </span>
                        <span className="text-[11px] text-slate-300">/ buổi</span>
                      </div>
                      {s.isCombo && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/25 border border-amber-300/40 text-amber-200">
                          Tiết kiệm
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (Chỉnh Sửa & Xóa) */}
                <div className="p-3 bg-slate-900/90 border-t border-slate-800 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(s)}
                    id={`btn-edit-service-${s.id}`}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all hover:shadow-md cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Chỉnh Sửa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingService(s)}
                    id={`btn-delete-service-${s.id}`}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-rose-950/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-900/50 hover:border-rose-600 text-xs font-semibold transition-all hover:shadow-md hover:shadow-rose-600/20 cursor-pointer"
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

      {/* Modal Thêm Mới / Sửa Dịch Vụ & Combo Trực Quan */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full rounded-3xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-500" />
                  <span>{editingService ? 'Chỉnh Sửa Dịch Vụ / Combo' : 'Thêm Dịch Vụ Hoặc Combo Mới'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {editingService ? `Cập nhật thông tin dịch vụ ID #${editingService.id}` : 'Điền thông tin chi tiết và chọn thành phần cho combo nếu có.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} noValidate className="space-y-5 text-xs">
              {/* Chọn loại: Dịch vụ Đơn hay Gói Combo */}
              <div>
                <label className="block text-slate-300 font-semibold mb-2">Loại Dịch Vụ *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={!!editingService}
                    onClick={() => setFormData({ ...formData, isCombo: false })}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${!formData.isCombo
                      ? 'bg-rose-950/40 border-rose-500 text-white ring-1 ring-rose-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                  >
                    <Tag className={`w-5 h-5 mt-0.5 ${!formData.isCombo ? 'text-rose-400' : 'text-slate-500'}`} />
                    <div>
                      <p className="font-bold text-sm text-white">Dịch Vụ Đơn Lẻ</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Một ca trang điểm độc lập (VD: Trang điểm cô dâu, tóc tiệc,...)</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={!!editingService}
                    onClick={() => setFormData({ ...formData, isCombo: true })}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${formData.isCombo
                      ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                  >
                    <Sparkles className={`w-5 h-5 mt-0.5 ${formData.isCombo ? 'text-amber-400' : 'text-slate-500'}`} />
                    <div>
                      <p className="font-bold text-sm text-white">Gói Combo Ưu Đãi</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Tổ hợp nhiều dịch vụ con với mức giá chiết khấu ưu đãi.</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tên dịch vụ */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Tên Dịch Vụ / Gói Combo *</label>
                <input
                  type="text"
                  required
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                  placeholder={formData.isCombo ? 'Ví dụ: Combo Cô Dâu Hoàn Hảo (Makeup + Tóc + Mi)' : 'Ví dụ: Trang Điểm Cô Dâu Ngày Cưới'}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {/* Phân loại Danh Mục (Chuẩn hóa 3NF) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Phân Loại Danh Mục (3NF)</label>
                <select
                  value={formData.categoryId || ''}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="">-- Chưa gán danh mục (Tự do) --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* KHU VỰC CHỌN MÓN CHO GÓI COMBO TRỰC QUAN */}
              {formData.isCombo && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-amber-400" />
                        <span>Chọn Các Dịch Vụ Thành Phần Của Combo</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Tick chọn các dịch vụ đơn lẻ có sẵn và chỉnh số lượng tương ứng.
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                      Đã chọn: {comboCalculations.selectedCount} món
                    </span>
                  </div>

                  {/* Danh sách các dịch vụ đơn lẻ để tick chọn */}
                  <div className="max-h-52 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/60">
                    {availableSingleServices.map((single) => {
                      const isSelected = !!selectedComboItems[single.id];
                      const quantity = selectedComboItems[single.id] || 1;

                      return (
                        <div
                          key={single.id}
                          className={`pt-2 flex items-center justify-between p-2 rounded-xl transition-colors ${isSelected ? 'bg-amber-950/20 border border-amber-500/30' : 'hover:bg-slate-900/60'
                            }`}
                        >
                          <label className="flex items-center gap-3 cursor-pointer flex-1 select-none truncate pr-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleComboChild(single.id)}
                              className="w-4 h-4 rounded border-slate-700 text-amber-600 focus:ring-amber-500 bg-slate-900"
                            />
                            <div className="truncate">
                              <p className="font-semibold text-white truncate">{single.serviceName}</p>
                              <p className="text-[11px] text-slate-400">
                                {formatCurrency(single.price)} • {single.duration} phút
                              </p>
                            </div>
                          </label>

                          {isSelected && (
                            <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                              <span className="text-[10px] text-slate-400">Số lượng:</span>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(single.id, -1)}
                                className="w-5 h-5 rounded bg-slate-800 text-white font-bold hover:bg-slate-700 flex items-center justify-center text-xs"
                              >
                                -
                              </button>
                              <span className="w-5 text-center font-bold text-white text-xs">{quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(single.id, 1)}
                                className="w-5 h-5 rounded bg-slate-800 text-white font-bold hover:bg-slate-700 flex items-center justify-center text-xs"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Thanh thống kê tự động tính toán giá gốc & thời lượng gợi ý */}
                  <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs bg-slate-900/80 p-3 rounded-xl">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Tổng giá gốc các món:</span>
                      <span className="text-base font-bold text-amber-400 font-sans">
                        {formatCurrency(comboCalculations.originalPrice)}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 block text-[11px]">Gợi ý tổng thời lượng:</span>
                        <button
                          type="button"
                          onClick={applySuggestedDuration}
                          className="text-[10px] text-rose-400 hover:underline font-semibold"
                        >
                          Áp dụng ngay
                        </button>
                      </div>
                      <span className="text-base font-bold text-white font-sans">
                        {comboCalculations.suggestedDuration} phút
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Đơn giá và Thời lượng */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-semibold">
                      {formData.isCombo ? 'Giá Combo Khuyến Mãi (VNĐ) *' : 'Đơn Giá Dịch Vụ (VNĐ) *'}
                    </label>
                    {formData.isCombo && comboCalculations.savings > 0 && (
                      <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        Tiết kiệm {comboCalculations.savings}%
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    required
                    min={0}
                    step="any"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Ví dụ: 1500000"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Thời Lượng Thực Hiện (Phút) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    step={1}
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="60"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Hình ảnh đại diện (Thumbnail) & Upload Cloudinary / Máy tính */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-semibold text-xs sm:text-sm">
                    Ảnh Đại Diện Thu Nhỏ (Thumbnail)
                  </label>
                  <label
                    htmlFor="service-image-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang tải lên...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải ảnh từ máy / Cloudinary</span>
                      </>
                    )}
                  </label>
                  <input
                    type="file"
                    id="service-image-upload"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </div>

                <div className="flex gap-3 items-center">
                  <div className="relative flex-1">
                    <ImageIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="Dán URL ảnh trực tiếp (Cloudinary, Imgur,...) hoặc bấm nút tải ảnh bên trên"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-xs"
                    />
                  </div>
                  {/* Khung xem trước ảnh thu nhỏ thực tế */}
                  <div className="w-14 h-11 rounded-xl overflow-hidden border border-slate-700 shrink-0 bg-slate-950 relative shadow-md flex items-center justify-center">
                    {formData.image ? (
                      <img
                        src={formData.image}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Mô tả chi tiết */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Mô Tả Dịch Vụ</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả phong cách trang điểm, dòng mỹ phẩm cao cấp sử dụng, độ bền màu..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 leading-relaxed text-xs"
                />
              </div>

              {/* Trạng thái hiển thị (Active/Inactive) */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Trạng thái hoạt động</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formData.active ? 'Khách hàng có thể nhìn thấy và đặt lịch trực tuyến' : 'Tạm ẩn dịch vụ này khỏi trang chủ và trang đặt lịch'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${formData.active ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${formData.active ? 'translate-x-6' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>

              {/* Footer action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Đang Lưu...' : editingService ? 'Lưu Thay Đổi' : 'Tạo Dịch Vụ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xóa Dịch Vụ */}
      {deletingService && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header icon */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Xác Nhận Xóa Dịch Vụ</h3>
                <p className="text-xs text-slate-400">Hành động này sẽ gỡ dịch vụ khỏi hệ thống</p>
              </div>
            </div>

            {/* Chi tiết dịch vụ cần xóa */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white truncate max-w-[240px]">
                  {deletingService.serviceName}
                </span>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                  #{deletingService.id}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Giá: {formatCurrency(deletingService.price)}</span>
                <span>Thời lượng: {deletingService.duration} phút</span>
              </div>
              {deletingService.isCombo && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                    Gói Combo ({deletingService.comboItems?.length || 0} món con)
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Bạn có chắc chắn muốn xóa dịch vụ này không? Dịch vụ sẽ bị gỡ bỏ và khách hàng sẽ không thể nhìn thấy hoặc đặt lịch dịch vụ này nữa.
            </p>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingService(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang Xóa...</span>
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

export default AdminServicesPage;
