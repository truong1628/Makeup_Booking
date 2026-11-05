import React, { useState } from 'react';
import { 
  X, Plus, Trash2, Edit3, Upload, Image as ImageIcon, 
  RotateCcw, Check, Sparkles, Loader2
} from 'lucide-react';
import { uploadService } from '../services/uploadService';
import { useToast } from '../context/ToastContext';

export const DEFAULT_HERO_SLIDES = [
  {
    id: 1,
    tag: 'Top Trending 2026',
    title: 'Makeup Tone Tây & Sexy Glam',
    subtitle: 'Mắt khói cuốn hút & Đôi môi căng mọng sắc sảo',
    rating: '4.98',
    reviews: '1.2k+ đánh giá',
    tagColor: 'from-rose-500 to-pink-600',
    image: '',
    category: 'Dạ Tiệc & Sự Kiện'
  },
  {
    id: 2,
    tag: 'Hot Trend Hàn Quốc 2026',
    title: 'Hàn Quốc Trong Trẻo (Dewy Glow)',
    subtitle: 'Làn da căng bóng mọng nước, má ửng hồng thơ ngây',
    rating: '4.99',
    reviews: '2.4k+ đánh giá',
    tagColor: 'from-amber-500 to-rose-500',
    image: '',
    category: 'Kỷ Yếu & Chụp Ảnh'
  },
  {
    id: 3,
    tag: 'Signature Bridal 2026',
    title: 'Makeup Cô Dâu Hoàng Gia Luxury',
    subtitle: 'Nét đẹp kiêu sa lộng lẫy cho ngày trọng đại nhất đời',
    rating: '5.0',
    reviews: '980+ cô dâu',
    tagColor: 'from-rose-600 to-amber-600',
    image: '',
    category: 'Lễ Cưới Cao Cấp'
  },
  {
    id: 4,
    tag: 'Trend Sắc Sảo 2026',
    title: 'Tone Thái Lan Sắc Nét & Quyến Rũ',
    subtitle: 'Điểm nhấn chân mày phẩy sợi & đôi mắt sâu hút hồn',
    rating: '4.97',
    reviews: '850+ đánh giá',
    tagColor: 'from-pink-600 to-rose-700',
    image: '',
    category: 'Lookbook & Studio'
  },
  {
    id: 5,
    tag: 'Clean Girl Aesthetic',
    title: 'Tone Nude Tự Nhiên & Sang Trọng',
    subtitle: 'Vẻ đẹp nguyên bản thanh lịch, tôn vinh đường nét tự nhiên',
    rating: '4.98',
    reviews: '1.5k+ đánh giá',
    tagColor: 'from-rose-500 to-purple-600',
    image: '',
    category: 'Dạo Phố & Hẹn Hò'
  }
];

const AdminSlideshowModal = ({ isOpen, onClose, slides, onSaveSlides }) => {
  const toast = useToast();
  const [slideList, setSlideList] = useState(slides);
  const [editingIndex, setEditingIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const currentEdit = slideList[editingIndex] || slideList[0];

  const handleUpdateField = (field, value) => {
    setSlideList((prev) => {
      const updated = [...prev];
      updated[editingIndex] = { ...updated[editingIndex], [field]: value };
      return updated;
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh (JPG, PNG, WEBP,...)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dung lượng ảnh tối đa là 10MB');
      return;
    }

    try {
      setUploading(true);
      const secureUrl = await uploadService.uploadImage(file);
      handleUpdateField('image', secureUrl);
      toast.success('Tải ảnh mới lên thành công!');
    } catch (err) {
      console.warn('Lỗi tải ảnh lên Cloudinary, chuyển sang đọc Base64:', err);
      // Fallback base64
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdateField('image', reader.result);
        toast.info('Đã lưu ảnh cục bộ thành công');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleAddSlide = () => {
    const newSlide = {
      id: Date.now(),
      tag: 'New Trend 2026',
      title: 'Phong Cách Makeup Mới',
      subtitle: 'Mô tả ngắn gọn về nét cuốn hút của layout này',
      rating: '5.0',
      reviews: '100+ đánh giá',
      tagColor: 'from-rose-500 to-pink-600',
      image: '',
      category: 'Sự Kiện Đặc Biệt'
    };
    const nextList = [...slideList, newSlide];
    setSlideList(nextList);
    setEditingIndex(nextList.length - 1);
    toast.success('Đã thêm 1 slide mới vào danh sách!');
  };

  const handleDeleteSlide = (index) => {
    if (slideList.length <= 1) {
      toast.error('Slideshow cần duy trì tối thiểu 1 hình ảnh!');
      return;
    }
    const nextList = slideList.filter((_, idx) => idx !== index);
    setSlideList(nextList);
    setEditingIndex(Math.max(0, index - 1));
    toast.info('Đã xóa slide khỏi danh sách.');
  };

  const handleResetDefault = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục về danh sách 5 slide mặc định (chưa kèm ảnh)?')) {
      setSlideList(DEFAULT_HERO_SLIDES);
      setEditingIndex(0);
      toast.info('Đã khôi phục cài đặt gốc.');
    }
  };

  const handleSave = () => {
    onSaveSlides(slideList);
    toast.success('Đã lưu và cập nhật Slideshow trang chủ thành công!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 via-white to-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Quản Lý Ảnh & Slideshow Top Trending</h2>
              <p className="text-xs text-slate-500">Chỉnh sửa hình ảnh, tiêu đề và xu hướng hiển thị trên trang chủ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Cột trái: Danh sách các slides (Thumbnails) */}
          <div className="md:col-span-5 space-y-3 border-r md:pr-6 border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Danh sách Slide ({slideList.length})
              </span>
              <button
                type="button"
                onClick={handleAddSlide}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm slide</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {slideList.map((item, index) => {
                const isSelected = index === editingIndex;
                return (
                  <div
                    key={item.id || index}
                    onClick={() => setEditingIndex(index)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 group ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/50 shadow-sm ring-2 ring-rose-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative border border-slate-200 flex items-center justify-center">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                          <span className="text-[8px] mt-0.5">Trống</span>
                        </div>
                      )}
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Text info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-rose-600 truncate">{item.tag}</p>
                      <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{item.category} • ★ {item.rating}</p>
                    </div>

                    {/* Nút xóa */}
                    {slideList.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSlide(index);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Xóa slide này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cột phải: Form chỉnh sửa chi tiết slide đang chọn */}
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-rose-600" />
                <span>Chỉnh sửa Slide #{editingIndex + 1}</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium">Thay đổi sẽ áp dụng ngay khi lưu</span>
            </div>

            {/* Xem trước & Tải ảnh mới */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Hình ảnh Slide</label>
              <div className="flex items-start gap-4">
                {/* Khung preview */}
                <div className="w-28 h-36 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-900 shrink-0 relative group shadow-sm flex items-center justify-center">
                  {currentEdit.image ? (
                    <img
                      src={currentEdit.image}
                      alt={currentEdit.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                      <ImageIcon className="w-7 h-7 text-rose-400/70 mb-1" />
                      <span className="text-[10px] text-slate-300">Chưa có ảnh</span>
                      <span className="text-[9px] text-slate-500 mt-0.5">Tải ảnh bên cạnh</span>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                      <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
                    </div>
                  )}
                </div>

                {/* Nút upload & input link */}
                <div className="flex-1 space-y-2.5">
                  <div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-sm shadow-rose-200 transition-all hover:scale-105 active:scale-95">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploading ? 'Đang tải lên...' : 'Tải ảnh mới từ máy'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1">Hỗ trợ JPG, PNG, WEBP (tối đa 10MB)</p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1">Hoặc dán URL ảnh trực tiếp:</span>
                    <input
                      type="url"
                      value={currentEdit.image || ''}
                      onChange={(e) => handleUpdateField('image', e.target.value)}
                      placeholder="Dán đường dẫn ảnh (https://...)"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-slate-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Các trường thông tin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tag Xu Hướng</label>
                <input
                  type="text"
                  value={currentEdit.tag || ''}
                  onChange={(e) => handleUpdateField('tag', e.target.value)}
                  placeholder="Ví dụ: Top Trending 2026"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Danh Mục Sự Kiện</label>
                <input
                  type="text"
                  value={currentEdit.category || ''}
                  onChange={(e) => handleUpdateField('category', e.target.value)}
                  placeholder="Ví dụ: Dạ Tiệc & Sự Kiện"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Tiêu Đề Phong Cách Makeup</label>
                <input
                  type="text"
                  value={currentEdit.title || ''}
                  onChange={(e) => handleUpdateField('title', e.target.value)}
                  placeholder="Ví dụ: Makeup Tone Tây & Sexy Glam"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 font-semibold text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Mô Tả Ngắn Gọn</label>
                <input
                  type="text"
                  value={currentEdit.subtitle || ''}
                  onChange={(e) => handleUpdateField('subtitle', e.target.value)}
                  placeholder="Ví dụ: Mắt khói cuốn hút & Đôi môi căng mọng sắc sảo"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Điểm Đánh Giá (Rating)</label>
                <input
                  type="text"
                  value={currentEdit.rating || ''}
                  onChange={(e) => handleUpdateField('rating', e.target.value)}
                  placeholder="Ví dụ: 4.98"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Số Lượng Đánh Giá</label>
                <input
                  type="text"
                  value={currentEdit.reviews || ''}
                  onChange={(e) => handleUpdateField('reviews', e.target.value)}
                  placeholder="Ví dụ: 1.2k+ đánh giá"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefault}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Lưu & Áp Dụng Ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSlideshowModal;
