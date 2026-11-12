import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles, Search, Eye, Calendar, User,
  X, ChevronLeft, ChevronRight, ArrowRight,
  CheckCircle2, SlidersHorizontal, Layers
} from 'lucide-react';
import { portfolioService } from '../services/portfolioService';
import { useToast } from '../context/ToastContext';
import { LAYOUT_OPTIONS } from './BookingPage';

const DEFAULT_CATEGORIES = [
  'Tất cả',
  'Cô Dâu',
  'Dự Tiệc',
  'Kỷ Yếu',
  'Hàn Quốc',
  'Tone Thái',
  'Thời Trang'
];

// Trích xuất danh sách ảnh phụ của tác phẩm
const extractPortfolioSubImages = (item) => {
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

const CollectionsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const urlLayout = searchParams.get('layout');
  const urlSearch = searchParams.get('search');
  const urlCategory = searchParams.get('category');
  const urlArtistId = searchParams.get('artistId');
  const fromBookingParam = searchParams.get('fromBooking') === 'true';

  // Đọc bản nháp đặt lịch từ sessionStorage nếu có
  const [bookingDraft] = useState(() => {
    try {
      const raw = sessionStorage.getItem('makeup_booking_draft');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const isFromBooking = fromBookingParam || Boolean(bookingDraft);
  const activeBookingLayout = urlLayout || bookingDraft?.selectedLayout || 'Tone Makeup';

  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  // Filters state - khởi tạo theo tham số URL nếu chuyển từ trang đặt lịch
  const [searchTerm, setSearchTerm] = useState(urlSearch || '');
  const [selectedCategory, setSelectedCategory] = useState(urlCategory || 'Tất cả');
  const [selectedArtistId, setSelectedArtistId] = useState(urlArtistId || 'all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'popular'

  // Đồng bộ lại filters nếu searchParams thay đổi
  useEffect(() => {
    if (urlSearch !== null && urlSearch !== undefined) {
      setSearchTerm(urlSearch);
    }
    if (urlCategory) {
      setSelectedCategory(urlCategory);
    }
    if (urlArtistId) {
      setSelectedArtistId(urlArtistId);
    }
  }, [urlSearch, urlCategory, urlArtistId]);

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
      } catch {
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

  const handleOpenDetail = async (item, initialIndex = 0) => {
    setSelectedPortfolio(item);
    setActiveImageIndex(initialIndex);
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

  // Tiếp tục tiến trình đặt lịch (quay lại Bước 4 trong BookingPage)
  const handleResumeBooking = () => {
    try {
      const raw = sessionStorage.getItem('makeup_booking_draft');
      const draft = raw ? JSON.parse(raw) : { currentStep: 4 };
      if (urlLayout && !draft.selectedLayout) {
        draft.selectedLayout = urlLayout;
      }
      draft.currentStep = 4;
      sessionStorage.setItem('makeup_booking_draft', JSON.stringify(draft));
    } catch (e) {
      console.error(e);
    }
    navigate('/booking?resume=true');
  };

  // Chọn mẫu ảnh này trong bộ sưu tập và tiếp tục đặt lịch
  const handleResumeBookingWithPortfolio = (portfolio) => {
    try {
      const raw = sessionStorage.getItem('makeup_booking_draft');
      const draft = raw ? JSON.parse(raw) : {};
      draft.currentStep = isFromBooking ? 4 : 1;
      if (portfolio) {
        draft.selectedPortfolioId = portfolio.id;
        draft.selectedPortfolioTitle = portfolio.title;
        draft.selectedPortfolioImage = portfolio.imageUrl;
        draft.selectedPortfolioArtist = portfolio.artistName;
        if (portfolio.artistId) {
          draft.preferredArtistId = portfolio.artistId;
        }

        // Nếu portfolio có category hoặc từ khóa trùng với layout trong LAYOUT_OPTIONS, cập nhật layout tương ứng
        if (portfolio.categoryName) {
          const matched = LAYOUT_OPTIONS.find((l) =>
            (l.category && l.category.toLowerCase() === portfolio.categoryName.toLowerCase()) ||
            (l.searchKeyword && portfolio.title && portfolio.title.toLowerCase().includes(l.searchKeyword.toLowerCase()))
          );
          if (matched) {
            draft.selectedLayout = matched.name;
          }
        }

        if (!draft.bookingNotes) {
          draft.bookingNotes = `Khách chọn tham khảo tác phẩm: "${portfolio.title}" (${portfolio.categoryName || 'Bộ sưu tập'})`;
        } else if (!draft.bookingNotes.includes(portfolio.title)) {
          draft.bookingNotes += `\n[Tham khảo tác phẩm: ${portfolio.title}]`;
        }
      }
      sessionStorage.setItem('makeup_booking_draft', JSON.stringify(draft));
    } catch (e) {
      console.error(e);
    }
    const artistQuery = portfolio?.artistId ? `&artistId=${portfolio.artistId}` : '';
    navigate(`/booking?resume=true${artistQuery}`);
  };

  // Get gallery images array for the active modal (Ưu tiên gallery từ bảng portfolio_images chuẩn 1NF)
  const modalImages = useMemo(() => {
    if (!selectedPortfolio) return [];
    const subImgs = extractPortfolioSubImages(selectedPortfolio);
    return [selectedPortfolio.imageUrl, ...subImgs].filter(Boolean);
  }, [selectedPortfolio]);

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* 0. Thanh thông báo Sticky: Đang trong quá trình đặt lịch */}
      {isFromBooking && (
        <div className="sticky top-20 z-40 bg-gradient-to-r from-rose-700 via-pink-600 to-rose-700 text-white shadow-lg py-2.5 px-4 border-b border-rose-500/30 animate-in fade-in">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-2.5 w-2.5 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <div className="text-xs sm:text-sm truncate">
                <span className="text-rose-100 font-normal">Đang đặt lịch (Bước 4) &bull; Layout đang xem: </span>
                <strong className="text-white font-bold bg-white/20 px-2 py-0.5 rounded-md ml-1 truncate inline-block max-w-[180px] sm:max-w-xs align-middle">
                  {activeBookingLayout}
                </strong>
              </div>
            </div>

            <button
              onClick={handleResumeBooking}
              className="shrink-0 inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-rose-600" />
              <span>Tiếp Tục Đặt Lịch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Hero Header Banner - Tối ưu thu gọn gọn gàng, thanh thoát */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-950 via-slate-900 to-slate-900 text-white py-6 sm:py-8">
        {/* Ambient decorative elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-[11px] font-semibold uppercase tracking-wider mb-2 animate-pulse">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Lookbook & Nghệ Thuật Trang Điểm</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2">
            Bộ Sưu Tập <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-300 to-amber-200">Tác Phẩm Makeup</span>
          </h1>

          <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-300 font-light leading-relaxed mb-4 line-clamp-1 sm:line-clamp-none">
            Chiêm ngưỡng những layout makeup đỉnh cao được thực hiện trực tiếp bởi các Master Artist tại DungDorys Studio.
          </p>

          {/* Quick Search Bar inside Hero */}
          <div className="max-w-xl mx-auto relative">
            <div className="relative flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-1 shadow-xl focus-within:border-rose-400 focus-within:bg-white/15 transition-all">
              <Search className="w-4 h-4 text-rose-300 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Tìm kiếm theo layout (Tone Thái, Hàn Quốc), tên thợ, cô dâu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-0 px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-0"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="p-1 rounded-full hover:bg-white/20 text-slate-300 hover:text-white mr-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Notice when coming from Booking */}
          {isFromBooking && (
            <div className="mt-4 max-w-xl mx-auto p-3 rounded-xl bg-white/10 backdrop-blur-md border border-rose-300/30 text-center animate-in fade-in shadow-lg">
              <p className="text-xs text-slate-200 mb-2">
                ✨ Bạn đang tham khảo layout: <strong className="text-amber-200">{activeBookingLayout}</strong>. Nhấp vào ảnh để xem chi tiết hoặc bấm nút bên dưới.
              </p>
              <button
                onClick={handleResumeBooking}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-1.5 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-md shadow-rose-900/40 hover:shadow-rose-600/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Tiếp Tục Đặt Lịch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. Interactive Filter & Control Bar - Thu gọn thanh thoát */}
      <section className="sticky top-20 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 lg:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === cat
                      ? 'bg-rose-600 text-white shadow-xs font-semibold scale-102'
                      : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Dropdown Filters & Sorters */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Filter by Artist */}
              {artistsList.length > 0 && (
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700">
                  <User className="w-3 h-3 text-rose-500" />
                  <select
                    value={selectedArtistId}
                    onChange={(e) => setSelectedArtistId(e.target.value)}
                    className="bg-transparent border-none text-xs font-medium text-slate-700 focus:outline-none cursor-pointer pr-2"
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
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700">
                <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none text-xs font-medium text-slate-700 focus:outline-none cursor-pointer pr-2"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="popular">Xem nhiều nhất</option>
                </select>
              </div>

              {/* Reset button if filtered */}
              {(searchTerm || selectedCategory !== 'Tất cả' || selectedArtistId !== 'all') && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline px-1.5 py-0.5"
                >
                  Đặt lại
                </button>
              )}
            </div>
          </div>

          {/* Result counter summary */}
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Tìm thấy <strong className="text-slate-800 font-bold">{sortedPortfolios.length}</strong> tác phẩm nghệ thuật
            </span>
            {selectedCategory !== 'Tất cả' && (
              <span className="text-rose-600 font-medium">
                Đang lọc: "{selectedCategory}"
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
            {sortedPortfolios.map((item) => {
              const subImages = extractPortfolioSubImages(item);
              const totalPhotos = (item.imageUrl ? 1 : 0) + subImages.length;

              return (
                <div
                  key={item.id}
                  className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
                >
                  {/* Image & Badges (Ấn vào ảnh chính để xem toàn bộ ảnh) */}
                  <div
                    className="relative aspect-[4/5] overflow-hidden bg-slate-900 cursor-pointer"
                    onClick={() => handleOpenDetail(item, 0)}
                    title="Nhấn vào ảnh để xem toàn bộ ảnh của tác phẩm"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-rose-950/20 to-slate-900 text-slate-500 group-hover:scale-105 transition-transform duration-500">
                        <Sparkles className="w-10 h-10 text-rose-500/40 mb-2" />
                        <span className="text-[11px] font-medium text-slate-400">Tác phẩm độc quyền</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="w-full py-2.5 rounded-xl bg-white/95 backdrop-blur-sm text-slate-900 text-xs font-bold text-center shadow-lg hover:bg-white transition-all flex items-center justify-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-rose-600" />
                        <span>Xem Chi Tiết ({totalPhotos} ảnh)</span>
                      </span>
                    </div>

                    {/* Category Pill Tag */}
                    {item.categoryName && (
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-rose-700 text-[11px] font-bold shadow-md border border-white/40">
                        {item.categoryName}
                      </span>
                    )}

                    {/* Photo count & View count pills */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {totalPhotos > 1 && (
                        <span className="px-2.5 py-1 rounded-full bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                          <Layers className="w-3 h-3" />
                          <span>{totalPhotos} ảnh</span>
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1">
                        <Eye className="w-3 h-3 text-rose-300" />
                        <span>{item.viewCount || 0}</span>
                      </span>
                    </div>
                  </div>

                  {/* Content details */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Tên ảnh / layout */}
                      <h3
                        onClick={() => handleOpenDetail(item, 0)}
                        className="text-base font-bold text-slate-800 line-clamp-1 hover:text-rose-600 cursor-pointer transition-colors mb-3"
                        title={item.title}
                      >
                        {item.title}
                      </h3>

                      {/* Thông tin Artist */}
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
                    </div>

                    {/* Nút Đặt lịch ngay */}
                    <div className="pt-4 border-t border-slate-100 mt-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResumeBookingWithPortfolio(item);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer group"
                        title="Đặt lịch ngay với phong cách này"
                      >
                        <Calendar className="w-3.5 h-3.5 text-rose-500 group-hover:text-white transition-colors" />
                        <span>Đặt lịch ngay</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Modal Lightbox Xem Chi Tiết Tác Phẩm (1 Ảnh Chính & Nhiều Ảnh Phụ) */}
      {selectedPortfolio && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={handleCloseDetail}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-white/20 flex flex-col lg:flex-row max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Main Image Display & Gallery Navigation */}
            <div className="lg:w-7/12 bg-slate-950 flex flex-col justify-between relative overflow-hidden">
              <div className="relative flex-1 min-h-[320px] lg:min-h-[480px] flex items-center justify-center bg-black">
                {(modalImages[activeImageIndex] || selectedPortfolio.imageUrl) ? (
                  <img
                    src={modalImages[activeImageIndex] || selectedPortfolio.imageUrl}
                    alt={selectedPortfolio.title}
                    className="max-h-[60vh] lg:max-h-[75vh] w-auto max-w-full object-contain mx-auto"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 py-20">
                    <Sparkles className="w-12 h-12 text-rose-500/40 mb-2" />
                    <span className="text-xs font-medium text-slate-400">Chưa có ảnh tác phẩm</span>
                  </div>
                )}

                {/* Badge số thứ tự ảnh ở góc trên bên trái (vd: 1/4) */}
                {modalImages.length > 1 && (
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold shadow border border-white/10">
                      {activeImageIndex + 1} / {modalImages.length}
                    </span>
                  </div>
                )}

                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-rose-300 text-xs font-medium">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{selectedPortfolio.viewCount || 1} lượt xem</span>
                </div>

                {/* Nút chuyển ảnh Trái / Phải khi có nhiều ảnh */}
                {modalImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIndex((prev) => (prev - 1 + modalImages.length) % modalImages.length)
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer"
                      title="Ảnh trước"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIndex((prev) => (prev + 1) % modalImages.length)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer"
                      title="Ảnh tiếp theo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails row if multiple images exist */}
              {modalImages.length > 1 && (
                <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2 overflow-x-auto justify-center">
                  {modalImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        activeImageIndex === idx ? 'border-rose-500 scale-105 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      title={idx === 0 ? 'Ảnh chính' : `Ảnh phụ #${idx}`}
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

                  <p className="text-xs text-slate-500 leading-normal border-t border-slate-200/60 pt-2 mt-2">
                    <strong className="text-slate-700">Phong cách:</strong> Thành thạo toàn diện mọi layout trang điểm
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handleCloseDetail();
                    handleResumeBookingWithPortfolio(selectedPortfolio);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-sm shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{isFromBooking ? 'Tiếp Tục Đặt Lịch Với Mẫu Này' : 'Đặt Lịch Với Phong Cách Này Ngay'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleCloseDetail}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Đóng & Tiếp tục duyệt bộ sưu tập
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Nút Floating nổi bật ở góc phải màn hình để tiếp tục đặt lịch */}
      {isFromBooking && (
        <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-4">
          <button
            onClick={handleResumeBooking}
            className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold text-xs sm:text-sm shadow-2xl shadow-rose-600/50 hover:from-rose-700 hover:to-pink-700 transition-all border-2 border-white transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Tiếp Tục Đặt Lịch</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CollectionsPage;
