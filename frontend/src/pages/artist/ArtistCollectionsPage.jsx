import React, { useState, useEffect } from 'react';
import {
  Sparkles, Plus, Image as ImageIcon, Trash2, Edit3, Eye,
  Upload, X, CheckCircle2, AlertCircle, Calendar, Tag,
  ExternalLink, Search
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

const ArtistCollectionsPage = () => {
  const toast = useToast();

  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    categoryName: 'Cô Dâu',
    description: '',
    imageUrl: '',
    additionalImages: '',
    tags: '',
  });

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
      additionalImages: '',
      tags: '',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      categoryName: item.categoryName || 'Cô Dâu',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      additionalImages: item.additionalImages || '',
      tags: item.tags || '',
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (submitting || uploadingImage) return;
    setModalOpen(false);
    setEditingItem(null);
  };

  // Upload ảnh lên Cloudinary
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng và kích thước (< 10MB)
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
      toast.success('Tải ảnh tác phẩm lên đám mây thành công!');
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      toast.error(err.message || 'Tải ảnh thất bại. Bạn có thể dán link ảnh trực tiếp.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề tác phẩm.');
      return;
    }
    if (!formData.imageUrl.trim()) {
      toast.error('Vui lòng tải lên ảnh tác phẩm hoặc dán liên kết ảnh.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingItem) {
        await portfolioService.updatePortfolio(editingItem.id, formData);
        toast.success('Cập nhật tác phẩm bộ sưu tập thành công!');
      } else {
        await portfolioService.createPortfolio(formData);
        toast.success('Đăng tác phẩm mới lên bộ sưu tập thành công!');
      }
      setModalOpen(false);
      loadMyPortfolios();
    } catch (err) {
      console.error('Lỗi khi lưu tác phẩm:', err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu tác phẩm.');
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
            Đăng tải các layout makeup tâm đắc nhất của bạn để quảng bá tay nghề đến hàng ngàn khách hàng trên hệ thống.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-rose-500 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white text-sm font-bold shadow-lg shadow-purple-600/30 hover:-translate-y-0.5 transition-all"
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
          {filteredPortfolios.map((item) => (
            <div
              key={item.id}
              className="group bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-purple-500/40 shadow-lg hover:shadow-purple-500/10 transition-all duration-300 flex flex-col"
            >
              {/* Image Preview */}
              <div className="relative aspect-[4/5] bg-slate-950 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Category badge */}
                {item.categoryName && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-purple-300 text-[10px] font-bold border border-purple-500/30">
                    {item.categoryName}
                  </span>
                )}

                {/* Views */}
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1">
                  <Eye className="w-3 h-3 text-purple-300" />
                  <span>{item.viewCount || 0}</span>
                </span>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white line-clamp-1 mb-1.5" title={item.title}>
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
                  <span className="text-[10px] text-slate-500">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-purple-600/20 text-slate-300 hover:text-purple-300 transition-colors"
                      title="Chỉnh sửa tác phẩm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors"
                      title="Xóa tác phẩm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Modal Đăng / Chỉnh Sửa Tác Phẩm */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={handleCloseModal}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
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
                    {editingItem ? 'Cập nhật thông tin tác phẩm trong bộ sưu tập' : 'Thêm hình ảnh tác phẩm vào bộ sưu tập công khai'}
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
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {/* Ảnh tác phẩm (Upload Cloudinary hoặc Paste Link) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Ảnh Tác Phẩm Chính <span className="text-rose-400">*</span>
                </label>

                {/* Upload Trigger / Dropzone */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? 'Đang Tải Ảnh Lên...' : 'Tải Ảnh Từ Máy Tính'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-slate-400">hoặc dán đường dẫn trực tiếp:</span>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="https://images.unsplash.com/... hoặc link ảnh online"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Preview Image */}
                {formData.imageUrl && (
                  <div className="mt-3 relative w-32 h-40 rounded-xl overflow-hidden border border-purple-500/30 shadow-md">
                    <img src={formData.imageUrl} alt="Xem trước" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors"
                      title="Xóa ảnh này"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
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
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-rose-500 hover:from-purple-700 hover:to-rose-600 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5"
                >
                  {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingItem ? 'Lưu Thay Đổi' : 'Đăng Tác Phẩm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistCollectionsPage;
