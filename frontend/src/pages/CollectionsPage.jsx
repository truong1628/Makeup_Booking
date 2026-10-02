import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, Search, Filter, Eye, Calendar, User,
  Tag, X, ChevronRight, ArrowRight, Heart, Share2,
  CheckCircle2, Clock, Phone, Award, SlidersHorizontal
} from 'lucide-react';
import { portfolioService } from '../services/portfolioService';
import { useToast } from '../context/ToastContext';

const DEFAULT_CATEGORIES = [
  'Tất cả',
  'Cô Dâu',
  'Dự Tiệc',
  'Kỷ Yếu',
  'Hàn Quốc',
  'Tone Thái',
  'Thời Trang'
];

const CollectionsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedArtistId, setSelectedArtistId] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'popular'

  // Modal detail state
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Load portfolios from backend
  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const data = await portfolioService.getPortfolios({
        category: selectedCategory !== 'Tất cả' ? selectedCategory : undefined,
        search: searchTerm.trim() || undefined,
        artistId: selectedArtistId !== 'all' ? selectedArtistId : undefined,
      });
      setPortfolios(data);

      // Load dynamic categories
      try {
        const catData = await portfolioService.getCategories();
        if (catData && catData.length > 0) {
          const uniqueCats = ['Tất cả', ...new Set([...catData, 'Cô Dâu', 'Dự Tiệc', 'Kỷ Yếu'])];
          setCategories(uniqueCats);
        }
      } catch (catErr) {
        // Fallback default categories
      }
    } catch (err) {
      console.error('Lỗi khi tải bộ sưu tập:', err);
      toast.error('Không thể tải danh sách bộ sưu tập. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPortfolios();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, selectedArtistId]);

  // Extract distinct artists list from loaded items for the filter
  const artistsList = useMemo(() => {
    const map = new Map();
    portfolios.forEach((item) => {
      if (item.artistId && !map.has(item.artistId)) {
        map.set(item.artistId, {
          id: item.artistId,
          name: item.artistName,
          avatar: item.artistAvatar,
        });
      }
    });
    return Array.from(map.values());
  }, [portfolios]);

  // Client-side sorting
  const sortedPortfolios = useMemo(() => {
    const list = [...portfolios];
    if (sortBy === 'popular') {
      return list.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }
    // Default newest
    return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [portfolios, sortBy]);

  const handleOpenDetail = async (item) => {
    setSelectedPortfolio(item);
    setActiveImageIndex(0);
    // Call getById to increment view count on backend
    try {
      const detailed = await portfolioService.getPortfolioById(item.id);
      setSelectedPortfolio(detailed);
      // Update local view count
      setPortfolios((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, viewCount: (p.viewCount || 0) + 1 } : p))
      );
    } catch {
      // Keep existing item
    }
  };

  const handleCloseDetail = () => {
    setSelectedPortfolio(null);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('Tất cả');
    setSelectedArtistId('all');
    setSortBy('newest');
  };

  // Get gallery images array for the active modal
  const modalImages = useMemo(() => {
    if (!selectedPortfolio) return [];
    const list = [selectedPortfolio.imageUrl];
    if (selectedPortfolio.additionalImages) {
      try {
        const parsed = JSON.parse(selectedPortfolio.additionalImages);
        if (Array.isArray(parsed)) list.push(...parsed);
      } catch {
        const split = selectedPortfolio.additionalImages.split(',').map((s) => s.trim()).filter(Boolean);
        list.push(...split);
      }
    }
    return list.filter(Boolean);
  }, [selectedPortfolio]);

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* 1. Hero Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-950 via-slate-900 to-slate-900 text-white py-16 sm:py-24">
        {/* Ambient decorative elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Lookbook & Nghệ Thuật Trang Điểm</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            Bộ Sưu Tập <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-300 to-amber-200">Tác Phẩm Makeup</span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 font-light leading-relaxed mb-8">
            Chiêm ngưỡng những layout makeup đỉnh cao được thực hiện trực tiếp bởi các Master Artist tại Lumière Studio. Tìm nguồn cảm hứng hoàn hảo cho ngày trọng đại của bạn.
          </p>

          {/* Quick Search Bar inside Hero */}
          <div className="max-w-2xl mx-auto relative">
            <div className="relative flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-1.5 shadow-2xl focus-within:border-rose-400 focus-within:bg-white/15 transition-all">
              <Search className="w-5 h-5 text-rose-300 ml-3.5 shrink-0" />
              <input
                type="text"
                placeholder="Tìm kiếm theo phong cách (Tone Thái, Hàn Quốc), tên thợ, cô dâu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-0 px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-0"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="p-1.5 rounded-full hover:bg-white/20 text-slate-300 hover:text-white mr-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Filter & Control Bar */}
      <section className="sticky top-20 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Category Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 shadow-sm ${
                    selectedCategory === cat
                      ? 'bg-rose-600 text-white shadow-rose-500/25 shadow-md scale-105'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Dropdown Filters & Sorters */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Filter by Artist */}
              {artistsList.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
                  <User className="w-3.5 h-3.5 text-rose-500" />
                  <select
                    value={selectedArtistId}
                    onChange={(e) => setSelectedArtistId(e.target.value)}
                    className="bg-transparent border-none text-xs font-medium text-slate-700 focus:outline-none cursor-pointer pr-4"
                  >
                    <option value="all">Tất cả Nghệ sĩ</option>
                    {artistsList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sort by */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none text-xs font-medium text-slate-700 focus:outline-none cursor-pointer pr-4"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="popular">Xem nhiều nhất</option>
                </select>
              </div>

              {/* Reset button if filtered */}
              {(searchTerm || selectedCategory !== 'Tất cả' || selectedArtistId !== 'all') && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline px-2 py-1"
                >
                  Đặt lại
                </button>
              )}
            </div>
          </div>

          {/* Result counter summary */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Tìm thấy <strong className="text-slate-800 font-bold">{sortedPortfolios.length}</strong> tác phẩm nghệ thuật
            </span>
            {selectedCategory !== 'Tất cả' && (
              <span className="text-rose-600 font-medium">
                Đang lọc: Phong cách "{selectedCategory}"
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 3. Portfolio Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-500">Đang tải bộ sưu tập tác phẩm...</p>
          </div>
        ) : sortedPortfolios.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Chưa tìm thấy tác phẩm phù hợp</h3>
            <p className="text-sm text-slate-500 mb-6">
              Không có tác phẩm nào khớp với từ khóa hoặc bộ lọc hiện tại của bạn. Thử tìm kiếm với từ khóa khác nhé.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-5 py-2.5 rounded-full bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-md shadow-rose-500/20 transition-all"
            >
              Xóa bộ lọc & Xem tất cả
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {sortedPortfolios.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
              >
                {/* Image & Badges */}
                <div
                  className="relative aspect-[4/5] overflow-hidden bg-slate-100 cursor-pointer"
                  onClick={() => handleOpenDetail(item)}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="w-full py-2.5 rounded-xl bg-white/90 backdrop-blur-sm text-slate-900 text-xs font-bold text-center shadow-lg hover:bg-white transition-all flex items-center justify-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-rose-600" />
                      <span>Xem Chi Tiết Tác Phẩm</span>
                    </span>
                  </div>

                  {/* Category Pill Tag */}
                  {item.categoryName && (
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-rose-700 text-[11px] font-bold shadow-md border border-white/40">
                      {item.categoryName}
                    </span>
                  )}

                  {/* View count pill */}
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1">
                    <Eye className="w-3 h-3 text-rose-300" />
                    <span>{item.viewCount || 0}</span>
                  </span>
                </div>

                {/* Content details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => handleOpenDetail(item)}
                      className="text-base font-bold text-slate-800 line-clamp-1 hover:text-rose-600 cursor-pointer transition-colors mb-2"
                      title={item.title}
                    >
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                        {item.description}
                      </p>
                    )}

                    {/* Tags */}
                    {item.tags && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {item.tags.split(',').slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[10px] font-medium border border-slate-100"
                          >
                            #{tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Artist Info Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-rose-500 text-white font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 shadow-sm">
                        {item.artistAvatar ? (
                          <img src={item.artistAvatar} alt={item.artistName} className="w-full h-full object-cover" />
                        ) : (
                          item.artistName?.charAt(0) || 'A'
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.artistName}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {item.artistExperience || 'Chuyên gia Makeup'}
                        </p>
                      </div>
                    </div>

                    <Link
                      to="/booking"
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                      title="Đặt lịch với thợ này"
                    >
                      <Calendar className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Modal Lightbox Xem Chi Tiết Tác Phẩm */}
      {selectedPortfolio && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={handleCloseDetail}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-white/20 flex flex-col lg:flex-row max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Main Image Display */}
            <div className="lg:w-7/12 bg-slate-950 flex flex-col justify-between relative overflow-hidden">
              <div className="relative flex-1 min-h-[300px] lg:min-h-[480px] flex items-center justify-center bg-black">
                <img
                  src={modalImages[activeImageIndex] || selectedPortfolio.imageUrl}
                  alt={selectedPortfolio.title}
                  className="max-h-[60vh] lg:max-h-[75vh] w-auto max-w-full object-contain mx-auto"
                />

                {/* Badges on image */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
                    {selectedPortfolio.categoryName || 'Tác phẩm'}
                  </span>
                </div>

                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-rose-300 text-xs font-medium">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{selectedPortfolio.viewCount || 1} lượt xem</span>
                </div>
              </div>

              {/* Thumbnails row if multiple images exist */}
              {modalImages.length > 1 && (
                <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2 overflow-x-auto justify-center">
                  {modalImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                        activeImageIndex === idx ? 'border-rose-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Detailed Metadata & Booking Action */}
            <div className="lg:w-5/12 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[50vh] lg:max-h-[85vh]">
              <div>
                {/* Close Button Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                    {selectedPortfolio.categoryName || 'Lookbook'}
                  </span>
                  <button
                    onClick={handleCloseDetail}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-slate-900 mb-3 leading-snug">
                  {selectedPortfolio.title}
                </h2>

                {/* Description */}
                <div className="text-slate-600 text-sm leading-relaxed mb-6 space-y-2">
                  <p>{selectedPortfolio.description || 'Layout trang điểm độc quyền được thiết kế tỉ mỉ, tôn lên các đường nét tự nhiên và phong cách thần thái rạng rỡ của bạn.'}</p>
                </div>

                {/* Tags */}
                {selectedPortfolio.tags && (
                  <div className="mb-6">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">Thẻ phong cách</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPortfolio.tags.split(',').map((t, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                          #{t.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Master Artist Profile Card */}
                <div className="p-4 rounded-2xl bg-[#faf8f5] border border-slate-200/80 mb-6">
                  <div className="flex items-center gap-3.5 mb-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-rose-500 text-white font-bold flex items-center justify-center text-sm shadow-md overflow-hidden shrink-0">
                      {selectedPortfolio.artistAvatar ? (
                        <img src={selectedPortfolio.artistAvatar} alt={selectedPortfolio.artistName} className="w-full h-full object-cover" />
                      ) : (
                        selectedPortfolio.artistName?.charAt(0) || 'A'
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-slate-900">{selectedPortfolio.artistName}</h4>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-xs text-rose-600 font-medium">
                        {selectedPortfolio.artistExperience || 'Chuyên Gia Makeup Cao Cấp'}
                      </p>
                    </div>
                  </div>

                  {selectedPortfolio.artistSpecialties && (
                    <p className="text-xs text-slate-500 leading-normal border-t border-slate-200/60 pt-2 mt-2">
                      <strong className="text-slate-700">Sở trường:</strong> {selectedPortfolio.artistSpecialties}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <Link
                  to="/booking"
                  onClick={handleCloseDetail}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-sm shadow-lg shadow-rose-500/25 transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Đặt Lịch Với Phong Cách Này Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={handleCloseDetail}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Đóng & Tiếp tục duyệt bộ sưu tập
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionsPage;
