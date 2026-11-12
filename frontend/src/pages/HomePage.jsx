import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Sparkles, Calendar, ShieldCheck, Clock, 
  ArrowRight, Star, CheckCircle, ChevronLeft, ChevronRight,
  Award, Flame, Edit3, Check, Gem, Car,
  ChevronDown, ChevronUp, Quote, Gift, Phone,
  HelpCircle, Eye, Palette
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { serviceService } from '../services/serviceService';
import { bookingService } from '../services/bookingService';
import { portfolioService } from '../services/portfolioService';
import { formatCurrency } from '../utils/format';
import AdminSlideshowModal, { DEFAULT_HERO_SLIDES } from '../components/AdminSlideshowModal';
import { LAYOUT_OPTIONS } from './BookingPage';

const DEFAULT_ARTISTS = [
  {
    id: 1,
    fullName: 'Lê Mai Anh',
    experience: '8 năm kinh nghiệm • Lead Master Artist',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    workingHours: 'Cả ngày',
    workingDays: 'Tất cả các ngày trong tuần',
    specialty: 'Chuyên layout Cô dâu Luxury, Beauty Glam & High Fashion',
  },
  {
    id: 2,
    fullName: 'Trần Thảo Linh',
    experience: '6 năm kinh nghiệm • Senior Makeup Artist',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600',
    workingHours: 'Cả ngày',
    workingDays: 'Thứ 2 - Thứ 7',
    specialty: 'Thành thạo phong cách Douyin, Hàn Quốc mọng nước & Tự nhiên',
  },
  {
    id: 3,
    fullName: 'Nguyễn Hoàng Yến',
    experience: '5 năm kinh nghiệm • Pro Makeup Artist',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
    workingHours: 'Cả ngày',
    workingDays: 'Tất cả các ngày trong tuần',
    specialty: 'Điểm nhấn Dạ tiệc, Sự kiện sắc sảo & Phong cách cá tính',
  },
];

const WHY_CHOOSE_US = [
  {
    icon: Gem,
    title: '100% Mỹ Phẩm High-End',
    desc: 'Cam kết chỉ sử dụng mỹ phẩm chính hãng cao cấp: Dior, Chanel, MAC, NARS, Tom Ford. Lành tính, an toàn tuyệt đối cho làn da nhạy cảm.',
    badge: 'Chính Hãng 100%',
  },
  {
    icon: Car,
    title: 'Linh Hoạt Studio & Tận Nơi',
    desc: 'Phục vụ tận nhà riêng, khách sạn tiệc cưới hoặc tại không gian Studio sang trọng với hệ thống đèn và gương chuẩn chuyên nghiệp.',
    badge: 'Tiện Lợi Tối Đa',
  },
  {
    icon: Clock,
    title: 'Chuẩn Giờ Tuyệt Đối',
    desc: 'Chuyên viên luôn có mặt trước 15 - 20 phút, trang phục chỉn chu, bảo đảm tiến độ chuẩn xác cho giờ vàng sự kiện của bạn.',
    badge: 'Đúng Giờ 100%',
  },
  {
    icon: ShieldCheck,
    title: 'Minh Bạch & Tận Tâm',
    desc: 'Báo giá niêm yết rõ ràng, không phát sinh chi phí ẩn, hỗ trợ dời lịch linh hoạt và chăm sóc khách hàng tận tâm trước & sau makeup.',
    badge: 'Bảo Đảm Uy Tín',
  },
];

const DEFAULT_LOOKBOOK = [
  {
    id: 1,
    title: 'Layout Cô Dâu Hoàng Gia Luxury',
    category: 'Cô Dâu',
    artistName: 'Lê Mai Anh',
    image: 'https://images.unsplash.com/photo-1594465919760-441fe5908ab0?auto=format&fit=crop&q=80&w=800',
    views: '1.2k',
  },
  {
    id: 2,
    title: 'Tone Thái Sắc Nét & Mắt Sâu Hút Hồn',
    category: 'Tone Thái',
    artistName: 'Trần Thảo Linh',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=800',
    views: '980',
  },
  {
    id: 3,
    title: 'Douyin Trong Veo Má Ửng Mọng Nước',
    category: 'Hàn Quốc',
    artistName: 'Nguyễn Hoàng Yến',
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=800',
    views: '1.5k',
  },
  {
    id: 4,
    title: 'Trang Điểm Dạ Tiệc Đêm Glamour',
    category: 'Dự Tiệc',
    artistName: 'Lê Mai Anh',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
    views: '850',
  },
];

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Nguyễn Thu Thảo',
    role: 'Cô dâu ngày cưới • Melia Hanoi',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    content: 'Hôm cưới mình makeup từ 6h sáng mà đến 10h tối lớp nền vẫn căng bóng, không hề mốc hay xuống tone. Bạn bè và gia đình ai cũng khen cô dâu rạng rỡ và tự nhiên. Cảm ơn DungDorys rất nhiều!',
    rating: 5,
    tag: 'Makeup Cô Dâu Trọn Gói',
  },
  {
    id: 2,
    name: 'Trần Thảo Ly',
    role: 'Khách tiệc Gala Dinner',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    content: 'Mình đặt chuyên viên đến tận nhà trang điểm đi tiệc cuối năm. Chuyên viên đến rất đúng giờ, tư vấn layout mắt cực kỳ hợp với chiếc đầm dạ hội của mình. Rất ưng ý và chắc chắn sẽ quay lại!',
    rating: 5,
    tag: 'Makeup Tận Nơi Tại Nhà',
  },
  {
    id: 3,
    name: 'Phạm Mai Phương',
    role: 'Chụp ảnh Profile & Kỷ yếu',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    content: 'Layout Douyin ở đây làm đỉnh thật sự, mí mắt và bắt sáng siêu tự nhiên. Lên hình không cần bóp méo hay chỉnh filter nhiều mà vẫn xinh lung linh. Giá cả gói combo thì quá hợp lý!',
    rating: 5,
    tag: 'Combo Kỷ Yếu & Tóc',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Tôi cần đặt lịch trước bao nhiêu ngày để đảm bảo có thợ?',
    a: 'Đối với makeup cô dâu ngày cưới hoặc ngày cuối tuần, quý khách nên đặt trước 1 - 2 tuần để chọn được Master Artist ưng ý. Với dịch vụ tiệc hoặc kỷ yếu, quý khách có thể đặt trước 1 - 3 ngày hoặc liên hệ hotline để kiểm tra ca trống gấp trong ngày.',
  },
  {
    q: 'DungDorys có phục vụ trang điểm tại nhà hoặc ngoại thành, đi tỉnh không?',
    a: 'Có. Chúng tôi cung cấp dịch vụ trang điểm tận nơi tại tất cả các quận huyện Hà Nội và các tỉnh lân cận. Hệ thống sẽ tự động tính toán khoảng cách và phí di chuyển minh bạch ngay khi bạn đặt lịch.',
  },
  {
    q: 'Studio có dịch vụ trang điểm thử (Test Makeup) cho cô dâu không?',
    a: 'Có. DungDorys có gói Makeup thử trước ngày cưới giúp cô dâu hoàn toàn an tâm, trải nghiệm thực tế độ bền của lớp nền và tìm được layout tôn trọn đường nét gương mặt và trang phục cưới phù hợp nhất.',
  },
  {
    q: 'Chính sách đặt cọc và hủy/thay đổi lịch hẹn như thế nào?',
    a: 'Khách đặt lịch vui lòng đặt cọc 30% giá trị sản phẩm dịch vụ để giữ thợ (lưu ý: hủy hoặc thay đổi lịch hẹn sẽ mất cọc). Với trường hợp không đặt cọc, studio không thể cam kết giữ lịch nếu chuyên viên có việc đột xuất.',
  },
  {
    q: 'Mỹ phẩm sử dụng có đảm bảo an toàn cho da nhạy cảm hay mẹ bầu không?',
    a: '100% mỹ phẩm tại DungDorys là sản phẩm High-End chính hãng được kiểm định nghiêm ngặt (Dior, MAC, Chanel, NARS, Tom Ford), nói không với hàng trôi nổi, tuyệt đối lành tính cho mọi loại da, kể cả da mụn và nhạy cảm.',
  },
];

const STUDIO_POLICIES = [
  {
    icon: CheckCircle,
    color: 'from-rose-500 to-pink-500',
    title: 'Đặt cọc giữ lịch 30%',
    desc: 'Khách đặt lịch vui lòng đặt cọc 30% giá trị sản phẩm dịch vụ (hủy/thay đổi lịch sẽ mất cọc).',
    tag: 'Bắt buộc',
  },
  {
    icon: Clock,
    color: 'from-amber-500 to-rose-500',
    title: 'Thời gian chờ khách',
    desc: 'Chờ khách từ 30p trở lên phụ thu 100k/giờ.',
    tag: 'Đúng giờ',
  },
  {
    icon: Car,
    color: 'from-purple-500 to-pink-500',
    title: 'Khung giờ đặc biệt & Đi lại ngoại tỉnh',
    desc: 'Khách book trước 6h sáng và sau 18h chiều phụ thu thêm chi phí đi lại 100k quanh nội thành Hà Nội. Ở tỉnh sẽ phụ thu theo cước xe và số km thực tế.',
    tag: 'Di chuyển',
  },
  {
    icon: Award,
    color: 'from-emerald-500 to-teal-500',
    title: 'Cam kết chuyên viên Makeup tới đúng giờ',
    desc: 'Makeup tới muộn 30-1h (không xin phép và được sự đồng ý của khách sẽ trừ 100k/h vào sản phẩm dịch vụ của khách hàng).',
    tag: 'Cam kết uy tín',
  },
  {
    icon: ShieldCheck,
    color: 'from-rose-600 to-pink-600',
    title: 'Làm việc trực tiếp qua cửa hàng',
    desc: 'Khách hàng làm việc trực tiếp với cửa hàng và không làm việc riêng với các chuyên viên makeup (nếu ưng makeup có thể đề xuất vào lần kế tiếp chuyên viên đó. Nếu shop phát hiện thì sẽ hủy hợp tác với các chuyên viên và không đảm bảo quyền lợi cho khách hàng).',
    tag: 'Bảo vệ quyền lợi',
  },
];

const cleanTitle = (name) => {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)/g, '').trim();
};

const HomePage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFromBookingStep4 = searchParams.get('fromBookingStep4') === 'true';

  const handleResumeBooking = () => {
    navigate('/booking?resume=true');
  };

  const handleSelectLayoutAndResume = (layoutName) => {
    try {
      const raw = sessionStorage.getItem('makeup_booking_draft');
      const draft = raw ? JSON.parse(raw) : { currentStep: 4 };
      draft.selectedLayout = layoutName;
      draft.currentStep = 4;
      sessionStorage.setItem('makeup_booking_draft', JSON.stringify(draft));
    } catch {}
    navigate('/booking?resume=true');
  };

  const [featuredServices, setFeaturedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [lookbookPortfolios, setLookbookPortfolios] = useState([]);

  // State quản lý danh sách Slides (đọc từ localStorage nếu có chỉnh sửa từ Admin, tự động loại bỏ link unsplash mẫu)
  const [slides, setSlides] = useState(() => {
    try {
      const saved = localStorage.getItem('makeup_hero_slides');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Tự động xóa bỏ các link ảnh unsplash mẫu cũ nếu còn lưu trong cache trình duyệt
          const cleaned = parsed.map((item) => ({
            ...item,
            image: (item.image && item.image.includes('images.unsplash.com')) ? '' : (item.image || '')
          }));
          localStorage.setItem('makeup_hero_slides', JSON.stringify(cleaned));
          return cleaned;
        }
      }
    } catch (e) {
      console.error('Lỗi đọc slides từ cache:', e);
    }
    return DEFAULT_HERO_SLIDES;
  });

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slideTimerRef = useRef(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await serviceService.getServices();
        const sorted = [...(Array.isArray(data) ? data : [])].sort((a, b) => {
          const comboDiff = Number(Boolean(b.isCombo)) - Number(Boolean(a.isCombo));
          if (comboDiff !== 0) return comboDiff;
          return Number(a.price || 0) - Number(b.price || 0);
        });
        setFeaturedServices(sorted.slice(0, 4));
      } catch (err) {
        console.error('Không thể tải dịch vụ:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchArtists = async () => {
      try {
        setArtistsLoading(true);
        const data = await bookingService.getArtists();
        if (Array.isArray(data) && data.length > 0) {
          setArtists(data);
        }
      } catch (err) {
        console.error('Không thể tải chuyên viên:', err);
      } finally {
        setArtistsLoading(false);
      }
    };

    const fetchLookbook = async () => {
      try {
        const data = await portfolioService.getPortfolios();
        if (Array.isArray(data) && data.length > 0) {
          setLookbookPortfolios(data.slice(0, 4));
        }
      } catch (err) {
        console.error('Không thể tải lookbook:', err);
      }
    };

    fetchServices();
    fetchArtists();
    fetchLookbook();
  }, []);

  // Tự động cuộn đến phần layout nếu URL có hash #layouts-intro
  useEffect(() => {
    const handleScrollToHash = () => {
      if (window.location.hash) {
        const id = window.location.hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
        }
      }
    };

    handleScrollToHash();
    window.addEventListener('hashchange', handleScrollToHash);
    return () => window.removeEventListener('hashchange', handleScrollToHash);
  }, []);

  // Tự động chuyển slide mỗi 4.5 giây
  useEffect(() => {
    if (isPaused || slides.length === 0) return;

    slideTimerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    };
  }, [isPaused, slides.length]);

  const handleNextSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleSaveSlides = (newSlides) => {
    setSlides(newSlides);
    localStorage.setItem('makeup_hero_slides', JSON.stringify(newSlides));
    setCurrentSlide(0);
  };

  const activeSlideData = slides[currentSlide] || slides[0] || DEFAULT_HERO_SLIDES[0];
  const displayArtists = artists.length > 0 ? artists.slice(0, 3) : DEFAULT_ARTISTS;
  const displayLookbook = lookbookPortfolios.length > 0 ? lookbookPortfolios : DEFAULT_LOOKBOOK;

  return (
    <div className="space-y-28 pb-20 relative overflow-hidden bg-gradient-to-b from-[#fff4f5] via-[#fdf1f4] via-[#faf4f8] to-[#fff6f8]">
      {/* 0. Thanh thông báo Sticky: Chỉ hiển thị khi bấm từ Bước 4 sang xem giới thiệu */}
      {isFromBookingStep4 && (
        <div className="sticky top-20 z-40 bg-gradient-to-r from-rose-700 via-pink-600 to-rose-700 text-white shadow-lg py-2.5 px-4 border-b border-rose-500/30 animate-in fade-in">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-2.5 w-2.5 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <div className="text-xs sm:text-sm truncate">
                <span className="text-rose-100 font-normal">Bạn đang trong quá trình đặt lịch &bull; </span>
                <strong className="text-white font-bold ml-1">Bước 4: Chọn Layout Makeup</strong>
              </div>
            </div>

            <button
              onClick={handleResumeBooking}
              className="shrink-0 inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-rose-600" />
              <span>Quay Lại Tiếp Tục Đặt Lịch</span>
            </button>
          </div>
        </div>
      )}

      {/* Background Decorator toàn trang chủ - Phong cách Haute Couture / Silk & Rose Gold Luxury */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Layer 1: Các vệt sáng Aura đa sắc kích thước lớn */}
        {/* Vầng sáng 1 - Đỉnh trang / Sau Hero Section */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[750px] bg-gradient-to-b from-rose-300/45 via-pink-200/35 to-amber-100/20 blur-[130px] rounded-full" />
        
        {/* Vầng sáng 2 - Ánh vàng Champagne ấm áp góc phải phía sau Slideshow */}
        <div className="absolute top-12 right-[-100px] w-[750px] h-[750px] bg-gradient-to-br from-amber-200/50 via-rose-200/40 to-transparent blur-[140px] rounded-full" />
        
        {/* Vầng sáng 3 - Ánh tím Orchid & Lavender góc trái giữa trang */}
        <div className="absolute top-[750px] -left-40 w-[800px] h-[800px] bg-gradient-to-tr from-pink-300/40 via-purple-200/30 to-rose-100/20 blur-[140px] rounded-full" />

        {/* Vầng sáng 4 - Ánh hồng ngọc trai khu vực Dịch Vụ */}
        <div className="absolute top-[1300px] right-[-120px] w-[850px] h-[850px] bg-gradient-to-bl from-rose-200/45 via-amber-200/35 to-transparent blur-[140px] rounded-full" />

        {/* Vầng sáng 5 - Ánh đào tiên khu vực Quy Trình Đặt Lịch */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[1000px] h-[650px] bg-gradient-to-t from-pink-200/40 via-rose-100/30 to-transparent blur-[130px] rounded-full" />

        {/* Layer 2: Dải sóng lụa ánh sáng mềm mại (Silky Light Ribbons SVG) */}
        <svg 
          className="absolute top-0 left-0 w-full h-[1800px] opacity-[0.28] mix-blend-multiply" 
          viewBox="0 0 1440 1800" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M-100 200 C300 450 650 50 1100 350 C1350 500 1500 300 1600 400" 
            stroke="url(#silk-gradient-1)" 
            strokeWidth="120" 
            strokeLinecap="round" 
            filter="blur(50px)" 
          />
          <path 
            d="M-50 900 C400 700 800 1150 1200 950 C1450 850 1550 1000 1650 900" 
            stroke="url(#silk-gradient-2)" 
            strokeWidth="140" 
            strokeLinecap="round" 
            filter="blur(60px)" 
          />
          <defs>
            <linearGradient id="silk-gradient-1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#fb7185" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="silk-gradient-2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f472b6" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#fb7185" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#e879f9" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>

        {/* Layer 3: Các ngôi sao lấp lánh (Sparkle Stars) rải rác tinh tế */}
        <div className="absolute top-28 left-[12%] text-rose-400/40 animate-pulse text-2xl select-none">✦</div>
        <div className="absolute top-48 right-[18%] text-amber-400/50 animate-pulse text-lg select-none">✧</div>
        <div className="absolute top-[680px] left-[8%] text-pink-400/40 animate-pulse text-xl select-none">✦</div>
        <div className="absolute top-[900px] right-[10%] text-rose-400/50 animate-pulse text-2xl select-none">✧</div>
        <div className="absolute top-[1400px] left-[15%] text-amber-400/40 animate-pulse text-lg select-none">✦</div>
        <div className="absolute top-[1750px] right-[14%] text-pink-400/45 animate-pulse text-xl select-none">✧</div>

        {/* Layer 4: Họa tiết lưới vi mô siêu mịn (Studio Diamond Mesh Grid) */}
        <div 
          className="absolute inset-0 opacity-[0.038]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #be185d 1.3px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* Hero Section với Nền Hoa Hồng Lãng Mạn & Trái Tim Pha Lê */}
      <section className="relative overflow-hidden py-6 lg:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden border border-rose-200/90 shadow-2xl shadow-rose-950/10 p-6 sm:p-10 lg:p-14">
            
            {/* Lớp nền ảnh Hoa Hồng Pha Lê Lãng Mạn (tham khảo theo mẫu hoa hồng & trái tim) */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-all duration-700"
              style={{ backgroundImage: `url('/hero-romantic-bg.jpg')` }}
            />

            {/* Lớp phủ sáng mờ tinh tế giúp bảo vệ độ tương phản chữ và làm nổi bật các cánh hoa viền */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/75 to-white/40 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-rose-50/50 via-transparent to-pink-100/40 pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left copy: Giới thiệu về DungDorys Make Up */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Logo & Tiêu đề thư pháp phong cách nghệ thuật */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <img
                  src="/logo.jpg"
                  alt="DungDorys Makeup Artist"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-xl ring-4 ring-rose-200/90 shadow-rose-500/20 shrink-0 hover:scale-105 transition-transform duration-300"
                />
                <div className="space-y-0.5 text-center sm:text-left">
                  <h2 className="font-script text-3xl sm:text-4xl text-rose-500 font-bold tracking-wide">
                    Giới thiệu về
                  </h2>
                  <h1 className="font-script text-4xl sm:text-5xl lg:text-6xl text-rose-600 font-extrabold tracking-wide drop-shadow-xs leading-tight">
                    DungDorys Make Up
                  </h1>
                </div>
              </div>

              {/* Nội dung giới thiệu */}
              <div className="space-y-3.5 text-slate-700 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0">
                <p>
                  Với sứ mệnh mang lại sự trẻ trung, hạnh phúc đến Chị Em phụ nữ, <strong className="font-semibold text-rose-900">DungDorys Make Up</strong> luôn là một sự lựa chọn hoàn hảo. Bằng nhiều năm kinh nghiệm trong nghề và đào tạo học viên makeup cá nhân; chuyên nghiệp đã làm đẹp cho hàng nghìn Chị Em.
                </p>
                <p>
                  <strong className="font-semibold text-rose-900">DungDorys Make Up</strong> chuyên trang điểm cô dâu, event, party, gameshow, phim ngắn, beauty, kỉ yếu... đã và đang là đối tác tin cậy của nhiều sự kiện và khách hàng thân thiết.
                </p>
                <p className="font-medium text-slate-800">
                  Đội ngũ chuyên viên make up với các Master Artist tài năng luôn sẵn sàng phục vụ quý khách tại Studio sang trọng hoặc phục vụ tận nơi tại Nhà riêng!
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/booking"
                  id="btn-hero-book-now"
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-700 hover:to-pink-700 text-white font-semibold shadow-xl shadow-rose-500/25 hover:shadow-2xl hover:shadow-rose-500/35 hover:-translate-y-0.5 transition-all text-center flex items-center justify-center gap-2.5 group"
                >
                  <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Đặt Lịch Hẹn Ngay</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/services"
                  id="btn-hero-view-services"
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/90 hover:bg-white text-slate-800 font-semibold border border-rose-200/70 shadow-sm hover:shadow-md hover:border-rose-300 transition-all text-center backdrop-blur-sm"
                >
                  Xem Bảng Giá & Combo
                </Link>
              </div>

              {/* Trust badges */}
              <div className="pt-6 grid grid-cols-3 gap-6 border-t border-rose-200/60 max-w-lg mx-auto lg:mx-0">
                <div className="text-center lg:text-left">
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">5,000+</p>
                  <p className="text-xs text-slate-500 font-medium">Khách Hàng Hài Lòng</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">10+ Năm</p>
                  <p className="text-xs text-slate-500 font-medium">Kinh Nghiệm Nghề</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">4.9 / 5.0</p>
                  <p className="text-xs text-slate-500 font-medium">Đánh Giá Xuất Sắc</p>
                </div>
              </div>
            </div>

            {/* Right visual card: BACKGROUND SLIDESHOW CHO TOP TRENDING 2026 */}
            <div className="lg:col-span-5 relative">
              <div 
                className="relative mx-auto max-w-md lg:max-w-none group"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {/* Glow aura đằng sau khung slideshow */}
                <div className="absolute -inset-3 bg-gradient-to-r from-rose-400/35 via-pink-400/35 to-amber-300/35 rounded-[2.5rem] blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

                {/* Khung chính của Slideshow */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/95 bg-slate-900 aspect-[4/5] select-none">
                  
                  {/* Danh sách ảnh Slideshow xếp chồng với hiệu ứng Fade mượt mà */}
                  {slides.map((slide, index) => (
                    <div
                      key={slide.id || index}
                      className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                      }`}
                    >
                      {slide.image ? (
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className={`w-full h-full object-cover object-center transition-transform duration-[6000ms] ease-out ${
                            index === currentSlide ? 'scale-105' : 'scale-100'
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-rose-950/70 to-slate-900 flex flex-col items-center justify-center text-center p-6 select-none">
                          <div className="w-20 h-20 rounded-3xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center mb-4 text-rose-300 shadow-inner">
                            <Sparkles className="w-10 h-10 animate-pulse text-rose-400" />
                          </div>
                          <p className="text-white font-bold text-xl mb-1">{slide.title}</p>
                          <p className="text-slate-300 text-xs max-w-xs">{slide.subtitle}</p>
                          {isAdmin && (
                            <span className="mt-3 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-semibold border border-rose-400/30">
                              Chưa có ảnh • Bấm nút trên để tải ảnh
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Gradient overlays bảo vệ độ tương phản & chữ */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-black/20 z-20 pointer-events-none" />

                  {/* Top Bar bên trong Slideshow: Badge Danh mục, Nút Admin & Dots */}
                  <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
                    <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/25 text-white text-[11px] font-semibold tracking-wide flex items-center gap-1.5 shadow-md">
                      <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      <span>{activeSlideData.category}</span>
                    </span>

                    {/* Nhóm điều khiển góc trên bên phải (Nút Admin & Thanh Dots) */}
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setShowAdminModal(true)}
                          id="btn-admin-manage-slides"
                          className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs font-bold shadow-lg backdrop-blur-md border border-white/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                          title="Quản trị viên: Bấm để thêm, xóa, sửa ảnh và nội dung Slideshow"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Chỉnh sửa Slideshow</span>
                        </button>
                      )}

                      {/* Thanh Pagination Dots */}
                      <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/20">
                        {slides.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            aria-label={`Chuyển đến slide ${idx + 1}`}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              idx === currentSlide
                                ? 'w-5 bg-rose-400 shadow-md'
                                : 'w-1.5 bg-white/50 hover:bg-white/80'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2 Nút điều hướng lùi/tiến ở 2 cạnh của ảnh */}
                  <button
                    onClick={handlePrevSlide}
                    id="btn-slideshow-prev"
                    aria-label="Slide trước"
                    className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-md border border-white/25 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xl opacity-75 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-5 h-5 -translate-x-0.5" />
                  </button>

                  <button
                    onClick={handleNextSlide}
                    id="btn-slideshow-next"
                    aria-label="Slide tiếp theo"
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-md border border-white/25 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xl opacity-75 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-5 h-5 translate-x-0.5" />
                  </button>

                  {/* THÔNG TIN CHỮ ĐÈ TRỰC TIẾP LÊN ẢNH (Không dùng background màu trắng) */}
                  <div className="absolute inset-x-0 bottom-0 z-30 p-6 sm:p-7 flex flex-col justify-end pointer-events-auto">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/25 border border-rose-400/40 text-[11px] font-bold text-rose-300 uppercase tracking-wider backdrop-blur-sm">
                            {activeSlideData.tag}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-md">
                          {activeSlideData.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed drop-shadow line-clamp-2">
                          {activeSlideData.subtitle}
                        </p>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/25 shadow-lg">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-bold text-white">{activeSlideData.rating}</span>
                        </div>
                        <span className="text-[11px] text-slate-300 mt-1 drop-shadow">{activeSlideData.reviews}</span>
                      </div>
                    </div>

                    {/* Dòng phân cách và link đặt phong cách */}
                    <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
                      <span className="text-slate-300 text-xs">
                        Xu hướng thịnh hành {currentSlide + 1}/{slides.length}
                      </span>
                      <Link
                        to="/booking"
                        className="font-bold text-rose-300 hover:text-white flex items-center gap-1.5 transition-colors group/link"
                      >
                        <span>Đặt phong cách này</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* 4 Cam kết & Ưu thế vượt trội (Why Choose DungDorys) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHY_CHOOSE_US.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-3xl bg-white/80 backdrop-blur-md border border-rose-100/90 p-6 sm:p-7 shadow-lg shadow-rose-950/5 hover:shadow-2xl hover:border-rose-300 hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-rose-200/30 to-pink-200/0 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200/80">
                      {item.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Services Section - Bọc trong khung kính ngọc trai sang trọng */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-rose-200/70 p-6 sm:p-12 shadow-2xl shadow-rose-950/5 overflow-hidden">
          {/* Subtle inside glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-b from-rose-200/30 to-transparent blur-3xl pointer-events-none -z-10" />

          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Dịch Vụ Nổi Bật
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Được thiết kế tinh tế nhằm đáp ứng hoàn hảo cho từng phong cách và sự kiện đặc biệt của bạn.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-72 rounded-3xl bg-slate-200/70 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredServices.map((service) => (
                <div
                  key={service.id}
                  className={`rounded-3xl transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between overflow-hidden group ${
                    service.isCombo
                      ? 'bg-white border-2 border-amber-400 ring-4 ring-amber-400/20 shadow-xl shadow-amber-500/15 hover:shadow-2xl hover:shadow-amber-500/30'
                      : 'bg-white border border-rose-100 shadow-md hover:shadow-2xl hover:border-rose-300'
                  }`}
                >
                  {/* Image Container with Title & Price OVERLAID directly on it */}
                  <Link to={`/services/${service.id}`} className="block relative aspect-[4/5] bg-slate-900 overflow-hidden cursor-pointer">
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={cleanTitle(service.serviceName)}
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
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
                      {service.isCombo ? (
                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white text-[11px] font-bold shadow-lg flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                          <span>Combo Hot</span>
                        </span>
                      ) : (
                        <span />
                      )}
                      <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-300" />
                        <span>{service.duration}p</span>
                      </div>
                    </div>

                    {/* Bottom Content OVERLAID on image: Tên dịch vụ & Giá */}
                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col justify-end pointer-events-none">
                      <h3 className="text-white font-bold text-base sm:text-lg leading-snug drop-shadow-md group-hover:text-rose-300 transition-colors break-words">
                        {cleanTitle(service.serviceName)}
                      </h3>

                      <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-white/20">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg sm:text-xl font-bold text-amber-300 drop-shadow-md">
                            {formatCurrency(service.price)}
                          </span>
                          <span className="text-[11px] text-slate-300">/ buổi</span>
                        </div>
                        {service.isCombo && (
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
                      to={`/services/${service.id}`}
                      id={`btn-home-detail-service-${service.id}`}
                      className={`py-2 px-2 rounded-full text-center text-xs font-bold transition-all border flex items-center justify-center ${
                        service.isCombo
                          ? 'border-amber-300 text-amber-900 hover:bg-amber-100 bg-amber-50/60'
                          : 'border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      Chi Tiết
                    </Link>

                    <Link
                      to={`/booking?serviceId=${service.id}`}
                      id={`btn-home-book-service-${service.id}`}
                      className={`py-2 px-2 rounded-full text-center text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1 text-white ${
                        service.isCombo
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

          <div className="text-center mt-12">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-sm font-bold text-rose-600 hover:text-rose-700 px-6 py-3 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-all hover:scale-105"
            >
              <span>Xem tất cả danh mục dịch vụ & gói ưu đãi</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Lookbook Mini Showcase - Bộ sưu tập layout thịnh hành */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 p-6 sm:p-12 shadow-2xl text-white overflow-hidden">
          {/* Subtle glow decoration */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 relative z-10">
            <div className="space-y-3">
              <span className="text-xs font-bold tracking-widest text-rose-300 uppercase inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-rose-300" />
                <span>Lookbook & Xu Hướng 2025</span>
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                Bộ Sưu Tập Layout <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-pink-200 to-amber-200">Triệu View</span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base max-w-xl">
                Chiêm ngưỡng những tác phẩm trang điểm thực tế do chính đội ngũ nghệ sĩ DungDorys sáng tạo và thực hiện cho hàng ngàn khách hàng.
              </p>
            </div>
            <Link
              to="/collections"
              className="inline-flex items-center gap-2 self-start md:self-auto px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold backdrop-blur-md transition-all hover:scale-105"
            >
              <span>Xem toàn bộ album</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Grid Lookbook items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {displayLookbook.map((item) => (
              <Link
                key={item.id}
                to="/collections"
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-white/10 bg-slate-900 block"
              >
                <img
                  src={item.image || item.imageUrl || 'https://images.unsplash.com/photo-1594465919760-441fe5908ab0?auto=format&fit=crop&q=80&w=800'}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                
                {/* Category badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold text-rose-200 border border-white/20">
                    {item.category || item.categoryName || 'Hot Trend'}
                  </span>
                </div>

                {/* Bottom info */}
                <div className="absolute inset-x-0 bottom-0 p-4 space-y-1">
                  <h4 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors line-clamp-2">
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-white/15">
                    <span>MUA: {item.artistName || 'DungDorys Studio'}</span>
                    <span className="flex items-center gap-1 text-rose-300">
                      <Eye className="w-3 h-3" />
                      <span>{item.views || '1k+'}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* GIỚI THIỆU CHI TIẾT CÁC TONE MAKEUP (LAYOUTS) */}
      {/* ======================================================== */}
      <section id="layouts-intro" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        {/* Banner thông báo và nút quay lại nếu vừa bấm từ Bước 4 sang */}
        {isFromBookingStep4 && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-rose-950 font-medium text-center sm:text-left">
              <span className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 font-bold">
                <Sparkles className="w-4 h-4" />
              </span>
              <span>Bạn đang tìm hiểu layout cho lịch hẹn? Chọn 1 layout bên dưới hoặc bấm quay lại tiếp tục đặt lịch:</span>
            </div>
            <button
              type="button"
              onClick={handleResumeBooking}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-500/25 transition-all shrink-0 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Quay Lại Đặt Lịch (Bước 4)</span>
            </button>
          </div>
        )}

        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-100 to-pink-100 border border-rose-200/80 text-rose-700 text-xs font-bold tracking-wide shadow-xs">
            <Palette className="w-3.5 h-3.5 text-rose-600" />
            <span className="uppercase">Bộ Sưu Tập Phong Cách Makeup</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Khám Phá Các <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500">Layout Makeup</span> Được Yêu Thích
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Mỗi gương mặt là một tác phẩm nghệ thuật độc bản. Tại DungDorys, chúng tôi tư vấn và thiết kế layout trang điểm phù hợp với từng đường nét khuôn mặt, làn da và sự kiện của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LAYOUT_OPTIONS.map((layout) => (
            <div
              key={layout.id}
              className={`rounded-3xl border border-rose-100/90 bg-gradient-to-b ${layout.gradient} p-7 shadow-lg shadow-rose-950/5 hover:shadow-2xl hover:border-rose-300 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group relative overflow-hidden`}
            >
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${layout.badgeClass}`}>
                    {layout.tag}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 bg-white/80 px-2.5 py-0.5 rounded-md border border-slate-100">
                    {layout.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                    {layout.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                    {layout.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 space-y-1.5">
                  <div className="flex items-start gap-1.5 text-xs text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <p className="leading-snug">
                      <strong className="text-slate-900 font-semibold">Phù hợp:</strong> {layout.suitableFor}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-200/60 flex items-center gap-2.5 relative z-10">
                <Link
                  to={`/collections?layout=${encodeURIComponent(layout.name)}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Bộ sưu tập</span>
                </Link>

                {isFromBookingStep4 ? (
                  <button
                    type="button"
                    onClick={() => handleSelectLayoutAndResume(layout.name)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 hover:shadow-rose-500/30 transition-all cursor-pointer"
                  >
                    <span>Chọn & Tiếp tục</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Link
                    to={`/booking?layout=${encodeURIComponent(layout.name)}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 hover:shadow-rose-500/30 transition-all cursor-pointer"
                  >
                    <span>Đặt lịch ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Nút Cuối Section: Nếu bấm từ Bước 4 thì hiện Quay lại, còn bình thường hiện Đặt lịch ngay */}
        {isFromBookingStep4 ? (
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={handleResumeBooking}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-rose-50 text-rose-700 border-2 border-rose-300 hover:border-rose-400 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-rose-600" />
              <span>Quay lại để tiếp tục đặt lịch (Bước 4: Layout)</span>
            </button>
          </div>
        ) : (
          <div className="mt-12 text-center">
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-500/25 transition-all transform hover:scale-105 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Đặt Lịch Làm Đẹp Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* Giới thiệu Đội Ngũ Chuyên Viên Trang Điểm */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100/80 border border-rose-200/80 text-rose-700 text-xs font-bold tracking-wide shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span className="uppercase">Đội Ngũ Nghệ Sĩ Chuyên Nghiệp</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Gặp Gỡ Đội Ngũ <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500">Chuyên Viên Hàng Đầu</span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Hội tụ những Makeup Artist tài năng với tay nghề toàn diện, thành thạo xuất sắc tất cả các phong cách từ cô dâu lộng lẫy, dạ tiệc quý phái đến layout Douyin, Hàn Quốc trong veo và phương Tây thời thượng.
          </p>

          {/* 3 Cam kết / Điểm nổi bật */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 text-xs text-slate-600 font-medium">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-rose-100 shadow-sm">
              <Check className="w-3.5 h-3.5 text-rose-600" /> Đào tạo bài bản theo chuẩn cao cấp
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-rose-100 shadow-sm">
              <Check className="w-3.5 h-3.5 text-rose-600" /> 100% Mỹ phẩm High-End chính hãng
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-rose-100 shadow-sm">
              <Check className="w-3.5 h-3.5 text-rose-600" /> Tư vấn layout tôn trọn nét đẹp riêng
            </span>
          </div>
        </div>

        {/* Danh sách thẻ Chuyên viên */}
        {artistsLoading && artists.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-3xl bg-slate-200/70 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayArtists.map((artist) => (
              <div
                key={artist.id}
                className="group rounded-3xl bg-white/90 backdrop-blur-md border border-rose-100/90 p-7 shadow-md hover:shadow-2xl hover:border-rose-300 transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Hiệu ứng hào quang trang trí nhẹ góc trên */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-rose-200/35 to-pink-200/0 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />

                <div className="space-y-5 relative z-10">
                  {/* Header thẻ: Avatar & Tên & Cấp bậc */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={artist.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                        alt={artist.fullName}
                        className="w-18 h-18 rounded-2xl object-cover ring-4 ring-rose-50 shadow-md group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full mb-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Sẵn sàng nhận lịch</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-rose-600 transition-colors truncate">
                        {artist.fullName}
                      </h3>
                      <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                        <Award className="w-3.5 h-3.5" />
                        <span>{artist.experience || 'Master Makeup Artist'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Năng lực chuyên môn */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-50/80 via-pink-50/60 to-rose-50/40 border border-rose-100/70">
                    <p className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                      Phong cách thế mạnh
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {artist.specialty || 'Thành thạo toàn diện mọi layout: Cô dâu, Dự tiệc, Kỷ yếu, Douyin, Hàn Quốc trong veo và Tây Âu cá tính.'}
                    </p>
                  </div>

                  {/* Lịch làm việc & Giờ nhận ca */}
                  <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Giờ nhận lịch: {artist.workingHours && !/\d{2}:\d{2}/.test(artist.workingHours) ? artist.workingHours : 'Cả ngày'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Ngày làm việc: {artist.workingDays || 'Tất cả các ngày trong tuần'}</span>
                    </div>
                  </div>
                </div>

                {/* Các nút hành động */}
                <div className="pt-5 mt-5 border-t border-slate-100 grid grid-cols-2 gap-2.5 relative z-10">
                  <Link
                    to="/collections"
                    className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 text-xs font-semibold text-center transition-all"
                  >
                    Xem Tác Phẩm
                  </Link>
                  <Link
                    to={`/booking?artistId=${artist.id}`}
                    className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-semibold text-center shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5 group/btn"
                  >
                    <span>Đặt Lịch Ngay</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Nút xem toàn bộ danh sách chuyên viên */}
        <div className="text-center mt-12">
          <Link
            to="/artists"
            className="inline-flex items-center gap-2 text-sm font-bold text-rose-600 hover:text-rose-700 px-7 py-3.5 rounded-full bg-white/90 hover:bg-rose-50 border border-rose-200 shadow-sm hover:shadow-md transition-all hover:scale-105"
          >
            <span>Khám phá toàn bộ đội ngũ chuyên viên & lịch làm việc</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Testimonials - Đánh giá từ khách hàng thực tế */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100/80 border border-rose-200/80 text-rose-700 text-xs font-bold tracking-wide shadow-sm">
            <Quote className="w-3.5 h-3.5 text-rose-600" />
            <span className="uppercase">Cảm Nhận Khách Hàng</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Khách Hàng Nói Gì Về <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500">DungDorys</span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Hơn 5,000+ cô dâu, quý cô dạ tiệc và khách hàng thân thiết đã tin yêu và đồng hành cùng chúng tôi trong những khoảnh khắc quan trọng nhất cuộc đời.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="group rounded-3xl bg-white/90 backdrop-blur-md border border-rose-100 p-8 shadow-lg shadow-rose-950/5 hover:shadow-2xl hover:border-rose-300 transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-rose-100/60 to-transparent rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-4 relative z-10">
                {/* Rating stars & Tag */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200/80">
                    {t.tag}
                  </span>
                </div>

                {/* Content */}
                <p className="text-slate-600 text-sm leading-relaxed italic">
                  "{t.content}"
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3.5 pt-6 mt-6 border-t border-slate-100 relative z-10">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-200 shadow-sm"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                  <p className="text-xs text-slate-600">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quy Định & Chính Sách Dịch Vụ Tại DungDorys (Theo chuẩn quy định studio) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2.5rem] bg-white/85 backdrop-blur-xl border border-rose-200/90 p-6 sm:p-12 shadow-2xl shadow-rose-950/5 overflow-hidden">
          {/* Subtle inside glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-rose-200/35 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-amber-200/30 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3 relative z-10">
            <span className="text-xs font-bold tracking-widest text-rose-600 uppercase inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-100/80 border border-rose-200/80 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              <span>Chính Sách & Quy Định Dịch Vụ</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Quy Định Đặt Lịch & Phục Vụ Tại <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500">DungDorys</span>
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Nhằm đảm bảo sự chu đáo, tính đúng giờ và trọn vẹn quyền lợi cao nhất cho quý khách hàng:
            </p>
          </div>

          {/* 5 Mục quy định chính sách */}
          <div className="space-y-3.5 relative z-10">
            {STUDIO_POLICIES.map((policy, idx) => {
              const Icon = policy.icon;
              return (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50/70 via-white to-pink-50/30 border border-rose-100 hover:border-rose-300 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 group"
                >
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${policy.color} text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-rose-600 transition-colors">
                          {policy.title}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                        {policy.desc}
                      </p>
                    </div>
                  </div>
                  <span className="self-end sm:self-center shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white text-rose-700 border border-rose-200 shadow-xs">
                    {policy.tag}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Dòng chữ kết thúc trang trọng: Chúc quý khách trải nghiệm dịch vụ tốt nhất */}
          <div className="mt-8 pt-6 border-t border-rose-100 text-center relative z-10">
            <div className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 rounded-full bg-gradient-to-r from-rose-500/10 via-pink-500/15 to-rose-500/10 border border-rose-300/60 shadow-inner">
              <Sparkles className="w-4 h-4 text-rose-600 animate-pulse shrink-0" />
              <span className="text-xs sm:text-sm md:text-base font-extrabold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-rose-700 via-pink-700 to-rose-900 text-center">
                Chúc quý khách trải nghiệm dịch vụ tốt nhất
              </span>
              <Sparkles className="w-4 h-4 text-rose-600 animate-pulse shrink-0" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion - Câu hỏi thường gặp */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100/80 border border-rose-200/80 text-rose-700 text-xs font-bold tracking-wide shadow-sm">
            <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
            <span className="uppercase">Giải Đáp Thắc Mắc</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Câu Hỏi Thường Gặp
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Mọi thông tin bạn cần biết về chính sách đặt lịch, bảo đảm chất lượng và dịch vụ tận nơi tại DungDorys Make Up.
          </p>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white/85 backdrop-blur-md border border-rose-100/90 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full py-4.5 px-6 text-left flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-rose-600 transition-colors"
                >
                  <span className="text-base sm:text-lg flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs flex items-center justify-center shrink-0 font-bold">
                      Q{idx + 1}
                    </span>
                    <span>{faq.q}</span>
                  </span>
                  <span className="shrink-0 p-1.5 rounded-full bg-rose-50 text-rose-600">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-rose-50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal Quản lý Slideshow dành riêng cho Admin */}
      <AdminSlideshowModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        slides={slides}
        onSaveSlides={handleSaveSlides}
      />
    </div>
  );
};

export default HomePage;


