import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, Clock, Calendar, AlertCircle, 
  Search, Tag, ArrowUpDown
} from 'lucide-react';
import { serviceService } from '../services/serviceService';
import { categoryService } from '../services/categoryService';
import { formatCurrency } from '../utils/format';

const ServicesPage = () => {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'SINGLE' | 'COMBO'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('DEFAULT'); // 'DEFAULT' | 'PRICE_ASC' | 'PRICE_DESC' | 'DURATION_ASC'

  const [services, setServices] = useState([]);
  const [combos, setCombos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [servicesRes, combosRes, categoriesRes] = await Promise.all([
          serviceService.getServices(),
          serviceService.getCombos(),
          categoryService.getCategories().catch(() => []),
        ]);
        setServices(servicesRes);
        setCombos(combosRes);
        if (Array.isArray(categoriesRes) && categoriesRes.length > 0) {
          setCategories(categoriesRes);
        }
      } catch (err) {
        setError(err.message || 'Không thể tải danh sách dịch vụ');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const singleServices = services.filter((s) => !s.isCombo);

  // Danh sách tabs danh mục (động từ CSDL)
  const categoryFilters = [
    { key: 'ALL', label: 'Tất Cả Danh Mục' },
    ...(categories.length > 0
      ? categories.map((c) => ({
          key: c.code || String(c.id),
          id: c.id,
          label: c.name,
        }))
      : [
          { key: 'BRIDAL', label: '👰 Cô Dâu Ngày Cưới' },
          { key: 'PARTY', label: '✨ Dự Tiệc & Sự Kiện' },
          { key: 'PHOTO', label: '📸 Chụp Ảnh & Profile' },
          { key: 'NATURAL', label: '🌸 Tự Nhiên Hàng Ngày' },
        ]),
  ];

  // Helper matching category dựa trên categoryCode/categoryId chuẩn hóa từ CSDL
  const matchCategory = (item, catKey) => {
    if (catKey === 'ALL') return true;
    if (item.categoryCode && item.categoryCode.toUpperCase() === catKey.toUpperCase()) return true;
    if (item.categoryId && String(item.categoryId) === String(catKey)) return true;

    const catObj = categories.find((c) => c.code === catKey || String(c.id) === String(catKey));
    if (catObj && item.categoryName && item.categoryName.toLowerCase() === catObj.name.toLowerCase()) return true;

    // Fallback tìm kiếm từ khóa
    const text = (item.serviceName + ' ' + (item.description || '')).toLowerCase();
    if (catKey === 'BRIDAL') return text.includes('cô dâu') || text.includes('cưới') || text.includes('hôn lễ');
    if (catKey === 'PARTY') return text.includes('tiệc') || text.includes('dạ hội') || text.includes('sự kiện') || text.includes('glam');
    if (catKey === 'PHOTO') return text.includes('ảnh') || text.includes('profile') || text.includes('kỷ yếu') || text.includes('concept');
    if (catKey === 'NATURAL') return text.includes('tự nhiên') || text.includes('hàn quốc') || text.includes('nhẹ nhàng') || text.includes('cá nhân');
    if (catKey === 'HAIR') return text.includes('tóc') || text.includes('uốn') || text.includes('búi');
    return false;
  };

  // Filter & Search Logic
  const getFilteredItems = () => {
    let list = [];
    if (activeTab === 'SINGLE') {
      list = singleServices;
    } else if (activeTab === 'COMBO') {
      list = combos;
    } else {
      list = [...combos, ...singleServices];
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      list = list.filter((item) => matchCategory(item, selectedCategory));
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => 
        item.serviceName.toLowerCase().includes(q) || 
        (item.description && item.description.toLowerCase().includes(q))
      );
    }

    // Sort logic: Mặc định ưu tiên Combo hiện trước, sau đó sắp xếp theo giá từ thấp đến cao
    return [...list].sort((a, b) => {
      if (sortBy === 'PRICE_ASC') {
        const comboDiff = Number(Boolean(b.isCombo)) - Number(Boolean(a.isCombo));
        if (comboDiff !== 0) return comboDiff;
        return Number(a.price || 0) - Number(b.price || 0);
      }
      if (sortBy === 'PRICE_DESC') {
        const comboDiff = Number(Boolean(b.isCombo)) - Number(Boolean(a.isCombo));
        if (comboDiff !== 0) return comboDiff;
        return Number(b.price || 0) - Number(a.price || 0);
      }
      if (sortBy === 'DURATION_ASC') {
        const comboDiff = Number(Boolean(b.isCombo)) - Number(Boolean(a.isCombo));
        if (comboDiff !== 0) return comboDiff;
        return Number(a.duration || 0) - Number(b.duration || 0);
      }
      // DEFAULT: Combo hiện trước + Giá từ thấp đến cao
      const comboDiff = Number(Boolean(b.isCombo)) - Number(Boolean(a.isCombo));
      if (comboDiff !== 0) return comboDiff;
      return Number(a.price || 0) - Number(b.price || 0);
    });
  };

  // Helper to remove parenthesized contents like (Makeup + ...)
  const cleanTitle = (name) => {
    if (!name) return '';
    return name.replace(/\s*\([^)]*\)/g, '').trim();
  };

  const displayedList = getFilteredItems();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 space-y-4 sm:space-y-5">
      {/* Title Header - Tối ưu thu gọn gọn gàng, tinh tế */}
      <div className="text-center max-w-2xl mx-auto space-y-1.5">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-rose-600 uppercase bg-rose-50/90 px-2.5 py-0.5 rounded-full border border-rose-100">
          <Sparkles className="w-3 h-3 text-rose-500" />
          <span>Menu Dịch Vụ Nghệ Thuật</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Bảng Giá Dịch Vụ & Gói Combo
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto line-clamp-1 sm:line-clamp-none">
          100% mỹ phẩm High-End chính hãng (Dior, Chanel, MAC...) bởi đội ngũ nghệ sĩ chuyên nghiệp.
        </p>

        {/* Primary Type Tabs: All / Combo / Single */}
        <div className="inline-flex p-1 rounded-full bg-slate-100 border border-slate-200/80 mt-2 shadow-2xs">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất Cả ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('COMBO')}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
              activeTab === 'COMBO'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Gói Combo ({combos.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('SINGLE')}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'SINGLE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dịch Vụ Đơn Lẻ ({singleServices.length})
          </button>
        </div>
      </div>

      {/* Search & Category Filter Toolbar - Thu gọn gọn nhẹ */}
      <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 items-center justify-between">
          {/* Search input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm dịch vụ, layout makeup..."
              className="w-full pl-8.5 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all bg-slate-50/50"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-500 shrink-0">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="DEFAULT">Mặc định phổ biến</option>
              <option value="PRICE_ASC">Giá: Thấp đến Cao</option>
              <option value="PRICE_DESC">Giá: Cao đến Thấp</option>
              <option value="DURATION_ASC">Thời lượng: Ngắn nhất</option>
            </select>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto pb-0.5 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-0.5">
            <Tag className="w-3 h-3" />
            <span>Phân loại:</span>
          </span>
          {categoryFilters.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.key
                  ? 'bg-rose-500 text-white shadow-2xs font-semibold'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-96 rounded-3xl bg-slate-200/70 animate-pulse" />
          ))}
        </div>
      ) : displayedList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Không tìm thấy dịch vụ</h3>
          <p className="text-xs text-slate-500">
            Không có dịch vụ nào khớp với từ khóa "{searchQuery}" hoặc phân loại đã chọn. Vui lòng thử tìm kiếm khác.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); setActiveTab('ALL'); }}
            className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            Xóa Bộ Lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayedList.map((item) => (
            <div
              key={`${item.isCombo ? 'combo' : 'single'}-${item.id}`}
              className={`rounded-3xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden group ${
                item.isCombo
                  ? 'bg-white border-2 border-amber-400 ring-4 ring-amber-400/20 shadow-lg shadow-amber-500/10 hover:shadow-2xl hover:shadow-amber-500/25'
                  : 'bg-white border border-slate-200 shadow-sm hover:shadow-xl'
              }`}
            >
              {/* Image Container with Title & Price OVERLAID directly on it */}
              <Link to={`/services/${item.id}`} className="block relative aspect-[4/5] bg-slate-900 overflow-hidden cursor-pointer">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={cleanTitle(item.serviceName)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-900 via-rose-950/60 to-slate-900 flex flex-col items-center justify-center text-slate-400 p-4">
                    <Sparkles className="w-10 h-10 text-rose-400/70 mb-2 animate-pulse" />
                    <span className="text-xs text-rose-200/80 font-medium">Studio DungDorys</span>
                  </div>
                )}

                {/* Dark Gradient Overlay for high-contrast legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent pointer-events-none" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  {item.isCombo ? (
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white text-[11px] font-bold shadow-lg flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      <span>Combo Hot</span>
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-300" />
                    <span>{item.duration}p</span>
                  </span>
                </div>

                {/* Bottom Content OVERLAID on image: Tên dịch vụ & Giá */}
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col justify-end pointer-events-none">
                  <h3 className="text-white font-bold text-base sm:text-lg leading-snug drop-shadow-md group-hover:text-rose-300 transition-colors break-words">
                    {cleanTitle(item.serviceName)}
                  </h3>

                  <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-white/20">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg sm:text-xl font-bold text-amber-300 drop-shadow-md">
                        {formatCurrency(item.price)}
                      </span>
                      <span className="text-[11px] text-slate-300">/ buổi</span>
                    </div>
                    {item.isCombo && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/25 border border-amber-300/40 text-amber-200">
                        Tiết kiệm
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Card Bottom Actions: Nút Chi Tiết & Nút Đặt Lịch */}
              <div className="p-3 sm:p-3.5 bg-white border-t border-slate-100 grid grid-cols-2 gap-2">
                <Link
                  to={`/services/${item.id}`}
                  id={`btn-detail-service-${item.id}`}
                  className={`py-2 px-2 rounded-full text-center text-xs font-bold transition-all border flex items-center justify-center ${
                    item.isCombo
                      ? 'border-amber-300 text-amber-900 hover:bg-amber-100 bg-amber-50/60'
                      : 'border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  Chi Tiết
                </Link>

                <Link
                  to={`/booking?serviceId=${item.id}`}
                  id={`btn-book-service-${item.id}`}
                  className={`py-2 px-2 rounded-full text-center text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1 text-white ${
                    item.isCombo
                      ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 hover:from-amber-600 hover:to-rose-700 shadow-amber-500/25'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Đặt Lịch</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
