import React, { useState, useEffect } from 'react';
import {
  Sparkles, Plus, Image as ImageIcon, Trash2, Edit3, Eye,
  Upload, X, Star, ChevronLeft, ChevronRight,
  ExternalLink, Search, Layers
} from 'lucide-react';
import { portfolioService } from '../../services/portfolioService';
import { uploadService } from '../../services/uploadService';
import { useToast } from '../../context/ToastContext';

const POPULAR_CATEGORIES = [
  'Cô Dâu',
  'Dự Tiệc',
  'Kỷ Yếu',
  'Hàn Quốc',
  'Tone Thái',
  'Tự Nhiên',
  'Thời Trang'
];

// Trích xuất danh sách URL ảnh phụ từ item portfolio
const extractSubImages = (item) => {
  if (!item) return [];
  if (Array.isArray(item.gallery) && item.gallery.length > 0) {
    return item.gallery.map((g) => g.imageUrl).filter(Boolean);
  }
  if (item.additionalImages) {
    const raw = String(item.additionalImages).trim();
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
    } catch {
      if (raw.startsWith('data:image/')) return [raw];
      return raw
        .split(/,(?=\s*https?:\/\/)/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const ArtistCollectionsPage = () => {
  const toast = useToast();

  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  // Modal Đăng / Sửa State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Modal Xem Chi Tiết Toàn Bộ Ảnh (Preview Lightbox)
  const [detailPortfolio, setDetailPortfolio] = useState(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    categoryName: 'Cô Dâu',
    description: '',
    imageUrl: '',
    tags: '',
  });
  const [subImages, setSubImages] = useState([]);
  const [subImageInputUrl, setSubImageInputUrl] = useState('');

  const loadMyPortfolios = async () => {
    try {
      setLoading(true);
      const data = await portfolioService.getMyPortfolios();
      setPortfolios(data);
    } catch (err) {
      console.error('Lỗi khi tải bộ sưu tập của thợ:', err);
      toast.error('Không thể tải bộ sưu tập của bạn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyPortfolios();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      categoryName: 'Cô Dâu',
      description: '',
      imageUrl: '',
      tags: '',
    });
    setSubImages([]);
    setSubImageInputUrl('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      categoryName: item.categoryName || 'Cô Dâu',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      tags: item.tags || '',
    });
    setSubImages(extractSubImages(item));
    setSubImageInputUrl('');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (submitting || uploadingImage) return;
    setModalOpen(false);
    setEditingItem(null);
  };

  // Tải nhiều ảnh cùng lúc (Tự động chọn ảnh đầu tiên làm Ảnh Chính nếu chưa có, các ảnh còn lại vào Ảnh Phụ)
  const handleMultiFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`File "${file.name}" không phải là định dạng ảnh hợp lệ.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Ảnh "${file.name}" vượt quá giới hạn 10MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    try {
      setUploadingImage(true);
      const uploadedUrls = await uploadService.uploadMultipleImages(validFiles);
      if (uploadedUrls.length > 0) {
        setFormData((prev) => {
          if (!prev.imageUrl) {
            const [firstUrl, ...restUrls] = uploadedUrls;
            if (restUrls.length > 0) {
              setSubImages((prevSubs) => [...prevSubs, ...restUrls]);
            }
            return { ...prev, imageUrl: firstUrl };
          } else {
            setSubImages((prevSubs) => [...prevSubs, ...uploadedUrls]);
            return prev;
          }
        });
        toast.success(`Đã tải lên thành công ${uploadedUrls.length} ảnh tác phẩm!`);
      }
    } catch (err) {
      console.error('Lỗi upload nhiều ảnh:', err);
      toast.error(err.message || 'Tải ảnh thất bại. Bạn có thể dán link ảnh trực tiếp.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Tải riêng hoặc thay thế Ảnh Chính
  const handleMainFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 10MB.');
      return;
    }

    try {
      setUploadingImage(true);
      const url = await uploadService.uploadImage(file);
      setFormData((prev) => ({ ...prev, imageUrl: url }));
      toast.success('Đã cập nhật ảnh chính tác phẩm!');
    } catch (err) {
      console.error('Lỗi upload ảnh chính:', err);
      toast.error(err.message || 'Tải ảnh thất bại.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Thêm ảnh phụ từ đường dẫn URL (hỗ trợ dán nhiều link cách nhau bằng dấu phẩy hoặc xuống dòng)
  const handleAddSubImageByUrl = () => {
    if (!subImageInputUrl.trim()) return;
    const urls = subImageInputUrl
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (urls.length === 0) return;

    if (!formData.imageUrl) {
      const [first, ...rest] = urls;
      setFormData((prev) => ({ ...prev, imageUrl: first }));
      if (rest.length > 0) {
        setSubImages((prev) => [...prev, ...rest]);
      }
    } else {
      setSubImages((prev) => [...prev, ...urls]);
    }
    setSubImageInputUrl('');
  };

  // Đặt 1 ảnh phụ lên làm Ảnh Chính (hoán đổi vị trí với ảnh chính hiện tại)
  const handlePromoteToMain = (index) => {
    const targetSubUrl = subImages[index];
    if (!targetSubUrl) return;
    const currentMain = formData.imageUrl;

    setFormData((prev) => ({ ...prev, imageUrl: targetSubUrl }));
    setSubImages((prev) => {
      const updated = [...prev];
      if (currentMain) {
        updated[index] = currentMain;
      } else {
        updated.splice(index, 1);
      }
      return updated;
    });
    toast.success('Đã đổi ảnh được chọn làm Ảnh Chính!');
  };

  // Xóa 1 ảnh phụ
  const handleRemoveSubImage = (index) => {
    setSubImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Xóa ảnh chính (nếu có ảnh phụ thì tự động đôn ảnh phụ đầu tiên lên làm ảnh chính)
  const handleRemoveMainImage = () => {
    if (subImages.length > 0) {
      const [firstSub, ...restSubs] = subImages;
      setFormData((prev) => ({ ...prev, imageUrl: firstSub }));
      setSubImages(restSubs);
      toast.info('Đã chuyển ảnh phụ đầu tiên lên làm Ảnh Chính.');
    } else {
      setFormData((prev) => ({ ...prev, imageUrl: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề tác phẩm.');
      return;
    }
    if (!formData.imageUrl.trim()) {
      toast.error('Vui lòng tải lên ít nhất 1 ảnh tác phẩm chính hoặc dán liên kết ảnh.');
      return;
    }

    const cleanSubImages = subImages.map((u) => u.trim()).filter(Boolean);
    const payload = {
      ...formData,
      title: formData.title.trim(),
      imageUrl: formData.imageUrl.trim(),
      additionalImages: cleanSubImages.length > 0 ? JSON.stringify(cleanSubImages) : '',
      gallery: cleanSubImages.map((url, idx) => ({
        imageUrl: url,
        caption: `Ảnh góc chụp chi tiết #${idx + 1}`,
        displayOrder: idx + 1,
      })),
    };

    try {
      setSubmitting(true);
      if (editingItem) {
        await portfolioService.updatePortfolio(editingItem.id, payload);
        toast.success('Cập nhật tác phẩm bộ sưu tập thành công!');
      } else {
        await portfolioService.createPortfolio(payload);
        toast.success('Đăng tác phẩm mới lên bộ sưu tập thành công!');
      }
      setModalOpen(false);
      loadMyPortfolios();
    } catch (err) {
      console.error('Lỗi khi lưu tác phẩm:', err);
      toast.error(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi lưu tác phẩm.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tác phẩm "${title}" khỏi bộ sưu tập?`)) {
      return;
    }

    try {
      await portfolioService.deletePortfolio(id);
      toast.success('Đã xóa tác phẩm khỏi bộ sưu tập.');
      setPortfolios((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Lỗi khi xóa tác phẩm:', err);
      toast.error(err.response?.data?.message || 'Không thể xóa tác phẩm.');
    }
  };

  // Mở modal xem toàn bộ ảnh của tác phẩm
  const handleOpenDetailPreview = (item, initialIndex = 0) => {
    setDetailPortfolio(item);
    setActiveSlideIndex(initialIndex);
  };

  // Filtered by search
  const filteredPortfolios = portfolios.filter((p) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      p.title?.toLowerCase().includes(term) ||
      p.categoryName?.toLowerCase().includes(term) ||
      p.tags?.toLowerCase().includes(term)
    );
  });

  const totalViews = portfolios.reduce((acc, p) => acc + (p.viewCount || 0), 0);

  // Danh sách toàn bộ ảnh của tác phẩm đang mở xem chi tiết
  const detailImages = detailPortfolio
    ? [detailPortfolio.imageUrl, ...extractSubImages(detailPortfolio)].filter(Boolean)
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Lookbook & Portfolio Nghệ Sĩ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Bộ Sưu Tập Tác Phẩm Của Tôi
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Đăng tải các layout makeup tâm đắc nhất của bạn (1 ảnh chính và nhiều ảnh phụ các góc chụp) để quảng bá tay nghề đến khách hàng.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-rose-500 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white text-sm font-bold shadow-lg shadow-purple-600/30 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Đăng Tác Phẩm Mới</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Metrics Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Tổng Tác Phẩm Đã Đăng</p>
            <p className="text-2xl font-bold text-white">{portfolios.length}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Tổng Lượt Khách Xem</p>
            <p className="text-2xl font-bold text-white">{totalViews.toLocaleString()}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Trang Công Khai</p>
            <p className="text-sm font-semibold text-purple-300">Khách hàng xem Lookbook</p>
          </div>
          <a
            href="/collections"
            target="_blank"
            rel="noreferrer"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-purple-600/20 text-slate-300 hover:text-purple-300 transition-colors"
            title="Mở trang xem phía khách hàng"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, thể loại..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
          />
        </div>
        <p className="text-xs text-slate-400">
          Đang hiển thị <strong className="text-white">{filteredPortfolios.length}</strong> tác phẩm
        </p>
      </div>

      {/* 4. Portfolio List Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-medium">Đang tải danh sách tác phẩm của bạn...</p>
        </div>
      ) : filteredPortfolios.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/50 rounded-3xl border border-slate-800/80 p-8 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Chưa có tác phẩm nào</h3>
          <p className="text-xs text-slate-400 mb-6">
            Hãy bắt đầu đăng tải những hình ảnh layout makeup xuất sắc nhất của bạn để thu hút khách hàng đặt lịch nhé!
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20"
          >
            + Đăng Tác Phẩm Đầu Tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPortfolios.map((item) => {
            const itemSubImages = extractSubImages(item);
            const totalPhotoCount = (item.imageUrl ? 1 : 0) + itemSubImages.length;

            return (
              <div
                key={item.id}
                className="group bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-purple-500/40 shadow-lg hover:shadow-purple-500/10 transition-all duration-300 flex flex-col"
              >
                {/* Image Preview (Ấn vào ảnh chính để xem toàn bộ ảnh) */}
                <div
                  className="relative aspect-[4/5] bg-slate-950 overflow-hidden cursor-pointer"
                  onClick={() => handleOpenDetailPreview(item, 0)}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 text-slate-500 group-hover:scale-105 transition-transform duration-500">
                      <ImageIcon className="w-10 h-10 text-purple-400/40 mb-2" />
                      <span className="text-[11px] font-medium text-slate-400">Chưa có ảnh tác phẩm</span>
                    </div>
                  )}

                  {/* Overlay Xem toàn bộ ảnh */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3.5">
                    <span className="w-full py-2 rounded-xl bg-white/95 text-slate-900 text-xs font-bold text-center shadow-lg flex items-center justify-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-purple-600" />
                      <span>Xem Toàn Bộ ({totalPhotoCount} ảnh)</span>
                    </span>
                  </div>

                  {/* Category badge */}
                  {item.categoryName && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-purple-300 text-[10px] font-bold border border-purple-500/30">
                      {item.categoryName}
                    </span>
                  )}

                  {/* Views & Photo count badges */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {totalPhotoCount > 1 && (
                      <span className="px-2 py-1 rounded-full bg-purple-600/90 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                        <Layers className="w-3 h-3" />
                        <span>{totalPhotoCount} ảnh</span>
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1">
                      <Eye className="w-3 h-3 text-purple-300" />
                      <span>{item.viewCount || 0}</span>
                    </span>
                  </div>
                </div>

                {/* Dải ảnh phụ thu nhỏ (nếu có) */}
                {itemSubImages.length > 0 && (
                  <div className="px-3 pt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <button
                      type="button"
                      onClick={() => handleOpenDetailPreview(item, 0)}
                      className="w-10 h-10 rounded-lg overflow-hidden border-2 border-purple-500 shrink-0 relative"
                      title="Ảnh chính"
                    >
                      <img src={item.imageUrl} alt="Ảnh chính" className="w-full h-full object-cover" />
                    </button>
                    {itemSubImages.slice(0, 4).map((subUrl, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleOpenDetailPreview(item, sIdx + 1)}
                        className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 hover:border-purple-400 shrink-0 relative opacity-85 hover:opacity-100 transition-all"
                        title={`Xem ảnh phụ #${sIdx + 1}`}
                      >
                        <img src={subUrl} alt={`Ảnh phụ ${sIdx + 1}`} className="w-full h-full object-cover" />
                        {sIdx === 3 && itemSubImages.length > 4 && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-[10px] font-bold text-white">
                            +{itemSubImages.length - 4}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => handleOpenDetailPreview(item, 0)}
                      className="font-bold text-sm text-white hover:text-purple-300 cursor-pointer line-clamp-1 mb-1.5 transition-colors"
                      title={item.title}
                    >
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                        {item.description}
                      </p>
                    )}
                    {item.tags && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags.split(',').slice(0, 3).map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium"
                          >
                            #{t.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleOpenDetailPreview(item, 0)}
                      className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem chi tiết ({totalPhotoCount} ảnh)</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-purple-600/20 text-slate-300 hover:text-purple-300 transition-colors cursor-pointer"
                        title="Chỉnh sửa tác phẩm & ảnh"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Xóa tác phẩm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Modal Đăng / Chỉnh Sửa Tác Phẩm (Hỗ trợ tải nhiều ảnh 1 lúc: 1 Ảnh Chính & Nhiều Ảnh Phụ) */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={handleCloseModal}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingItem ? 'Chỉnh Sửa Tác Phẩm' : 'Đăng Tác Phẩm Mới'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Hỗ trợ chọn tải nhiều ảnh cùng lúc (1 ảnh chính đại diện & nhiều ảnh phụ chi tiết)
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={submitting || uploadingImage}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Tiêu đề */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Tiêu Đề Tác Phẩm / Layout Makeup <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Layout Cô Dâu Tone Cam Đào Hàn Quốc"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Danh mục / Phong cách */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Phong Cách / Thể Loại
                  </label>
                  <select
                    value={formData.categoryName}
                    onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {POPULAR_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Thẻ Tags (cách nhau dấu phẩy)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Tone Thái, Căng bóng, Son bóng"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Khu vực Tải Nhiều Ảnh Cùng Lúc (1 Ảnh Chính + Nhiều Ảnh Phụ) */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div>
                    <label className="block text-xs font-bold text-white">
                      Bộ Ảnh Tác Phẩm (1 Ảnh Chính & Nhiều Ảnh Phụ) <span className="text-rose-400">*</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Bạn có thể giữ phím <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">Ctrl</kbd> hoặc <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">Shift</kbd> để chọn nhiều ảnh cùng lúc từ máy tính.
                    </p>
                  </div>

                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-rose-500 hover:from-purple-500 hover:to-rose-400 text-white text-xs font-bold shadow-md shadow-purple-600/20 shrink-0 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Đang Tải Ảnh...' : 'Tải Nhiều Ảnh Cùng Lúc'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMultiFileUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Phần 1: Ảnh Tác Phẩm Chính */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>1. Ảnh Tác Phẩm Chính (Ảnh Bìa Đại Diện) *</span>
                    </span>
                    <label className="cursor-pointer text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Đổi riêng ảnh chính</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainFileUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Dán đường dẫn URL ảnh chính trực tiếp (https://...) hoặc bấm nút tải ảnh ở trên"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />

                  {formData.imageUrl && (
                    <div className="relative w-36 h-44 rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-lg group">
                      <img src={formData.imageUrl} alt="Ảnh chính" className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold flex items-center gap-1 shadow">
                        <Star className="w-2.5 h-2.5 fill-slate-950" /> Ảnh Chính
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveMainImage}
                        className="absolute top-2 right-2 p-1 bg-black/75 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                        title="Xóa ảnh chính"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Phần 2: Danh Sách Ảnh Phụ (Nhiều góc chụp chi tiết) */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>2. Danh Sách Ảnh Phụ Chi Tiết ({subImages.length} ảnh)</span>
                    </span>
                    {subImages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSubImages([])}
                        className="text-[11px] text-rose-400 hover:underline"
                      >
                        Xóa tất cả ảnh phụ
                      </button>
                    )}
                  </div>

                  {/* Nhập thêm link ảnh phụ */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Dán thêm 1 hoặc nhiều link URL ảnh phụ (cách nhau dấu phẩy)..."
                      value={subImageInputUrl}
                      onChange={(e) => setSubImageInputUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubImageByUrl();
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubImageByUrl}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                    >
                      + Thêm URL
                    </button>
                  </div>

                  {/* Grid hiển thị các ảnh phụ đã tải lên */}
                  {subImages.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                      Chưa có ảnh phụ nào. Hãy bấm <strong>"Tải Nhiều Ảnh Cùng Lúc"</strong> để thêm các góc chụp cận cảnh mắt, môi, làm tóc...
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {subImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-[4/5] rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group"
                        >
                          <img src={imgUrl} alt={`Ảnh phụ ${idx + 1}`} className="w-full h-full object-cover" />
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-slate-200 text-[10px] font-semibold">
                            Phụ #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubImage(idx)}
                            className="absolute top-1.5 right-1.5 p-1 bg-black/75 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                            title="Xóa ảnh phụ này"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePromoteToMain(idx)}
                            className="absolute bottom-1.5 inset-x-1.5 py-1 rounded-lg bg-amber-500/95 hover:bg-amber-400 text-slate-950 text-[10px] font-bold text-center opacity-0 group-hover:opacity-100 transition-opacity shadow cursor-pointer"
                            title="Đặt ảnh này làm Ảnh Chính"
                          >
                            ★ Đặt làm ảnh chính
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Mô tả chi tiết tác phẩm */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mô Tả Kỹ Thuật & Cảm Hứng Layout
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả kỹ thuật đánh nền mỏng nhẹ, điểm nhấn ở mắt khói, các loại mỹ phẩm chủ đạo sử dụng..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting || uploadingImage}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-rose-500 hover:from-purple-700 hover:to-rose-600 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingItem ? 'Lưu Thay Đổi' : 'Đăng Tác Phẩm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal Xem Chi Tiết Toàn Bộ Ảnh (Lightbox dành cho Nghệ Sĩ kiểm tra) */}
      {detailPortfolio && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setDetailPortfolio(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Main Slide + Thumbnails */}
            <div className="lg:w-7/12 bg-black flex flex-col justify-between relative">
              <div className="relative flex-1 min-h-[320px] lg:min-h-[480px] flex items-center justify-center">
                {detailImages[activeSlideIndex] ? (
                  <img
                    src={detailImages[activeSlideIndex]}
                    alt={detailPortfolio.title}
                    className="max-h-[60vh] lg:max-h-[72vh] w-auto max-w-full object-contain mx-auto"
                  />
                ) : (
                  <div className="text-slate-500 text-xs">Chưa có ảnh</div>
                )}

                {/* Badge Ảnh Chính / Ảnh Phụ */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold shadow ${
                    activeSlideIndex === 0
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-black/70 text-white border border-white/20'
                  }`}>
                    {activeSlideIndex === 0 ? '★ Ảnh Chính' : `Ảnh Phụ #${activeSlideIndex}`}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-black/60 text-slate-200 text-xs font-semibold">
                    {activeSlideIndex + 1} / {detailImages.length}
                  </span>
                </div>

                {/* Nút chuyển ảnh Trái / Phải */}
                {detailImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSlideIndex((prev) => (prev - 1 + detailImages.length) % detailImages.length)
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-purple-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                      title="Ảnh trước"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSlideIndex((prev) => (prev + 1) % detailImages.length)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-purple-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                      title="Ảnh tiếp theo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Dải Thumbnails bên dưới */}
              {detailImages.length > 1 && (
                <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 overflow-x-auto justify-center">
                  {detailImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSlideIndex(idx)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        activeSlideIndex === idx
                          ? 'border-purple-500 scale-105 opacity-100'
                          : 'border-transparent opacity-55 hover:opacity-90'
                      }`}
                    >
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-amber-500 text-slate-950 text-[8px] font-extrabold text-center">
                          CHÍNH
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Thông tin chi tiết tác phẩm */}
            <div className="lg:w-5/12 p-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold">
                    {detailPortfolio.categoryName || 'Lookbook'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDetailPortfolio(null)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h2 className="text-xl font-bold text-white">{detailPortfolio.title}</h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {detailPortfolio.description || 'Chưa có mô tả chi tiết cho tác phẩm này.'}
                </p>

                {detailPortfolio.tags && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {detailPortfolio.tags.split(',').map((t, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs">
                        #{t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const target = detailPortfolio;
                    setDetailPortfolio(null);
                    handleOpenEditModal(target);
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa bộ ảnh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailPortfolio(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistCollectionsPage;
