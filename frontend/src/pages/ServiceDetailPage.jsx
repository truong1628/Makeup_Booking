import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, Clock, Calendar, Check, Layers, AlertCircle,
  Star, ShieldCheck, Heart, ArrowLeft, ArrowRight, Share2,
  CheckCircle2, ThumbsUp, MessageSquare, PhoneCall, Award,
  Info, ChevronRight, LogIn, Lock
} from 'lucide-react';
import { serviceService } from '../services/serviceService';
import { bookingService } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/format';

const SAMPLE_GALLERIES = [
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1000&q=80'
];

const DEFAULT_REVIEWS = [
  {
    id: 'r1',
    customerName: 'Hoàng Phương Thảo',
    rating: 5,
    createdAt: '2 ngày trước',
    comment: 'Lớp nền thực sự đỉnh chóp! Mình làm tiệc tối mà từ 4h chiều đến 11h đêm về tẩy trang nền vẫn căng bóng, không hề mốc hay xuống tone. Chuyên viên rất tỉ mỉ và tư vấn chọn son hợp màu váy lắm ạ.',
    verified: true,
    likes: 14
  },
  {
    id: 'r2',
    customerName: 'Nguyễn Minh Anh',
    rating: 5,
    createdAt: '5 ngày trước',
    comment: 'Book thợ đến tận nhà trang điểm cô dâu. Đúng giờ hẹn, đồ đạc mỹ phẩm toàn hàng xịn Chanel, Nars nhìn là yên tâm ngay. Ai ở đám cưới cũng khen cô dâu nhẹ nhàng và rất tự nhiên.',
    verified: true,
    likes: 9
  },
  {
    id: 'r3',
    customerName: 'Trần Bích Ngọc',
    rating: 5,
    createdAt: '1 tuần trước',
    comment: 'Gói combo cực kỳ tiết kiệm, mẹ mình cũng được makeup chung và rất ưng ý. Lông mi dán sợi tự nhiên không bị nặng mắt. Sẽ tiếp tục ủng hộ Studio vào các dịp tiệc sau!',
    verified: true,
    likes: 7
  },
  {
    id: 'r4',
    customerName: 'Đặng Thu Trang',
    rating: 4,
    createdAt: '2 tuần trước',
    comment: 'Chuyên viên kỹ tính, tạo khối mũi và mắt siêu đỉnh. Studio sạch đẹp sang trọng. Điểm 9.5/10 cho dịch vụ chuyên nghiệp!',
    verified: true,
    likes: 4
  }
];

const ServiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [service, setService] = useState(null);
  const [relatedServices, setRelatedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gallery state
  const [selectedImage, setSelectedImage] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);

  // Reviews state
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Review eligibility states
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [completedBooking, setCompletedBooking] = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);

  useEffect(() => {
    const fetchServiceData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [servData, allServices, apiReviews] = await Promise.all([
          serviceService.getServiceById(id),
          serviceService.getServices().catch(() => []),
          bookingService.getReviewsByService(id).catch(() => [])
        ]);

        setService(servData);

        // Setup gallery images
        const baseImg = servData.image || SAMPLE_GALLERIES[0];
        const combinedGallery = [
          baseImg,
          ...SAMPLE_GALLERIES.filter(img => img !== baseImg).slice(0, 4)
        ];
        setGalleryImages(combinedGallery);
        setSelectedImage(baseImg);

        // Setup related services (exclude current)
        const others = allServices.filter(s => String(s.id) !== String(id)).slice(0, 4);
        setRelatedServices(others);

        // Setup reviews
        if (apiReviews && apiReviews.length > 0) {
          const formatted = apiReviews.map(r => ({
            id: r.id,
            customerName: r.customerName || 'Khách hàng',
            rating: r.rating || 5,
            createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : 'Gần đây',
            comment: r.comment || '',
            verified: true,
            likes: Math.floor(Math.random() * 5) + 1
          }));
          setReviews([...formatted, ...DEFAULT_REVIEWS]);
        } else {
          setReviews(DEFAULT_REVIEWS);
        }

        // Check customer booking eligibility if logged in
        if (isAuthenticated) {
          try {
            setCheckingEligibility(true);
            const myBookings = await bookingService.getMyBookings();
            
            // Check completed booking
            const completed = myBookings.find(b => 
              b.status === 'COMPLETED' && 
              b.items?.some(item => 
                String(item.makeupServiceId) === String(id) || 
                (item.serviceName && servData.serviceName && item.serviceName.toLowerCase().trim() === servData.serviceName.toLowerCase().trim())
              )
            );
            setCompletedBooking(completed || null);

            // Check non-completed active booking
            const pending = myBookings.find(b => 
              b.status !== 'COMPLETED' && b.status !== 'CANCELLED' &&
              b.items?.some(item => 
                String(item.makeupServiceId) === String(id) || 
                (item.serviceName && servData.serviceName && item.serviceName.toLowerCase().trim() === servData.serviceName.toLowerCase().trim())
              )
            );
            setPendingBooking(pending || null);
          } catch (err) {
            console.warn('Không thể kiểm tra lịch sử đơn đặt:', err);
          } finally {
            setCheckingEligibility(false);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải chi tiết dịch vụ:', err);
        setError('Không thể tìm thấy thông tin dịch vụ hoặc dịch vụ không tồn tại.');
      } finally {
        setLoading(false);
      }
    };

    fetchServiceData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id, isAuthenticated]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: service?.serviceName,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết dịch vụ vào bộ nhớ tạm!');
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error('Vui lòng nhập lời nhận xét của bạn.');
      return;
    }

    if (!completedBooking) {
      toast.error('Chỉ những khách hàng đã hoàn thành buổi hẹn dịch vụ này mới được phép đánh giá.');
      return;
    }

    try {
      setSubmittingReview(true);
      await bookingService.submitReview(completedBooking.id, newRating, newComment.trim());

      const added = {
        id: 'user-' + Date.now(),
        customerName: user?.fullName || 'Khách Hàng',
        rating: newRating,
        createdAt: 'Vừa xong',
        comment: newComment.trim(),
        verified: true,
        likes: 0
      };
      setReviews([added, ...reviews]);
      setNewComment('');
      toast.success('Cảm ơn bạn đã gửi đánh giá! Ý kiến của bạn đã được ghi nhận.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse space-y-8">
          <div className="h-6 w-48 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-6 h-[500px] bg-slate-200 rounded-3xl" />
            <div className="lg:col-span-6 space-y-4">
              <div className="h-10 bg-slate-200 rounded-xl w-3/4" />
              <div className="h-6 bg-slate-200 rounded-lg w-1/3" />
              <div className="h-32 bg-slate-200 rounded-2xl" />
              <div className="h-14 bg-slate-200 rounded-full w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Dịch Vụ Không Tồn Tại</h2>
        <p className="text-slate-600 max-w-md mx-auto text-sm">{error || 'Dịch vụ này có thể đã bị ngừng hoặc đổi đường dẫn.'}</p>
        <Link
          to="/services"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-rose-600 text-white font-semibold text-sm shadow-md hover:bg-rose-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay Lại Danh Mục Dịch Vụ</span>
        </Link>
      </div>
    );
  }

  // Calculate rating stats
  const totalReviews = reviews.length;
  const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1);

  // Combo items parsing
  const comboList = (service.comboItems && service.comboItems.length > 0)
    ? service.comboItems.map(ci => ({ name: ci.itemServiceName, quantity: ci.quantity || 1 }))
    : (service.description && service.description.includes('\n'))
    ? service.description.split('\n')
        .map(l => l.replace(/^[•\-\*\+]\s*/, '').trim())
        .filter(l => l.length > 0)
        .map(l => {
          const m = l.match(/^(\d+)x?\s*(.+)$/i);
          return m ? { quantity: parseInt(m[1]), name: m[2].trim() } : { quantity: 1, name: l };
        })
    : [];

  return (
    <div className="space-y-16 pb-24">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-100 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-rose-600 transition-colors">Trang Chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link to="/services" className="hover:text-rose-600 transition-colors">Dịch Vụ</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-semibold truncate max-w-xs">{service.serviceName}</span>
        </div>
      </div>

      {/* Main Service Presentation Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
          
          {/* Left Column: Sample Images Gallery */}
          <div className="lg:col-span-6 space-y-4">
            {/* Primary Main Image Preview */}
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-slate-100 shadow-xl border-4 border-white group">
              <img
                src={selectedImage}
                alt={service.serviceName}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
              />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {service.isCombo ? (
                  <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gói Combo Tiết Kiệm</span>
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-full bg-rose-600/90 backdrop-blur-md text-white text-xs font-bold shadow-lg">
                    Dịch Vụ Nghệ Thuật
                  </span>
                )}
                <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-300 text-[11px] font-semibold flex items-center gap-1 shadow-md w-fit">
                  <Star className="w-3 h-3 fill-amber-300" />
                  <span>Ảnh thực tế Studio</span>
                </span>
              </div>

              {/* Share & Favorite quick buttons */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-md backdrop-blur-md transition-all hover:scale-110"
                  title="Chia sẻ dịch vụ"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Thumbnail Row */}
            <div className="grid grid-cols-5 gap-3">
              {galleryImages.map((img, idx) => {
                const isSelected = selectedImage === img;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative aspect-[4/5] rounded-2xl overflow-hidden transition-all border-2 ${
                      isSelected
                        ? 'border-rose-600 ring-2 ring-rose-500/20 scale-105 shadow-md'
                        : 'border-transparent opacity-70 hover:opacity-100 hover:scale-102'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 text-center italic">
              * Bấm vào các ảnh nhỏ để xem chi tiết từng góc chụp và layout makeup mẫu.
            </p>
          </div>

          {/* Right Column: Service Details & Booking Actions */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Top Category and Rating */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-100">
                  {service.isCombo ? 'Combo Đặc Biệt' : 'Dịch Vụ Cá Nhân'}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{service.duration} phút thực hiện</span>
                </span>
              </div>

              {/* Star Score */}
              <a href="#reviews-section" className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-rose-600 transition-colors">
                <div className="flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-900 ml-1">{avgRating}</span>
                </div>
                <span>({totalReviews} nhận xét)</span>
              </a>
            </div>

            {/* Service Name */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              {service.serviceName}
            </h1>

            {/* Price Presentation */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-50/80 via-pink-50/40 to-amber-50/50 border border-rose-100/80 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Chi phí trọn gói dịch vụ</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-serif text-3xl sm:text-4xl font-bold text-rose-600">
                    {formatCurrency(service.price)}
                  </span>
                  <span className="text-xs text-slate-400">/ buổi</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full inline-block">
                  Tiền cọc 30%: {formatCurrency(Math.round(service.price * 0.3))}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Thanh toán cọc bảo đảm slot hẹn</p>
              </div>
            </div>

            {/* Description Paragraph */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mô tả dịch vụ</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {service.description || 'Dịch vụ trang điểm chuyên nghiệp tôn vinh đường nét tự nhiên, định hình phong cách sang trọng và bảo đảm lớp nền bền mịn suốt cả ngày dài.'}
              </p>
            </div>

            {/* Combo Included Items (if combo) */}
            {service.isCombo && comboList.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <span>Các dịch vụ trong gói combo ({comboList.length} món)</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Ưu đãi trọn gói
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {comboList.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-white/80 border border-amber-100 text-xs text-slate-800 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                      <span>{item.quantity}x {item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quality Commitments / Special Perks */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-slate-800">100% Mỹ Phẩm High-end</p>
                  <p className="text-slate-500 text-[11px]">Dior, Chanel, Nars, YSL chính hãng</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-slate-800">Chuyên Viên Cao Cấp</p>
                  <p className="text-slate-500 text-[11px]">Ít nhất 5+ năm kinh nghiệm nghề</p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-3 pt-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to={`/booking?serviceId=${service.id}`}
                  id="btn-detail-book-now"
                  className="flex-1 py-4 px-6 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-700 hover:to-pink-700 text-white font-semibold text-center shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/35 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Đặt Lịch Dịch Vụ Này Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="tel:0988776655"
                  className="py-4 px-5 rounded-full border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4 text-rose-600" />
                  <span>0988 776 655</span>
                </a>
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                ✨ Hỗ trợ thực hiện tại Studio hoặc tận nơi tại Nhà riêng / Địa điểm sự kiện.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Process & Technique Steps Section */}
      <section className="bg-white py-14 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Quy Trình Chuyên Nghiệp</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Quy Trình 5 Bước Makeup Chuẩn Studio
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Mỗi layout trang điểm đều được chăm chút kỹ lưỡng để tôn vinh trọn vẹn nét đẹp riêng của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: '01', title: 'Tư Vấn Phong Cách', desc: 'Phân tích cấu trúc khuôn mặt, tone da và trang phục sự kiện để chọn layout phù hợp nhất.' },
              { step: '02', title: 'Dưỡng Ẩm Chuyên Sâu', desc: 'Làm sạch và cấp ẩm phục hồi màng bảo vệ da, giúp lớp nền bám chặt và không mốc.' },
              { step: '03', title: 'Đánh Nền HD Mỏng Mịn', desc: 'Sử dụng kỹ thuật tán nền đa tầng căng bóng, che phủ hoàn hảo các khuyết điểm.' },
              { step: '04', title: 'Nhấn Mắt & Tạo Khối', desc: 'Đính mi tơi tự nhiên, kẻ eyeliner sắc nét và tạo khối 3D giúp gương mặt thon gọn.' },
              { step: '05', title: 'Khóa Nền 12 Giờ', desc: 'Phủ phấn kiềm dầu và xịt khóa nền chuyên dụng bảo đảm layout rạng rỡ suốt sự kiện.' }
            ].map((p, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-[#faf8f5] border border-slate-100 space-y-2 hover:bg-rose-50/40 transition-colors">
                <span className="font-serif text-2xl font-bold text-rose-600 block">{p.step}</span>
                <h4 className="font-semibold text-sm text-slate-900">{p.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section id="reviews-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Đánh Giá Từ Khách Hàng</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-1">
              Khách Hàng Nói Gì Về Dịch Vụ Này?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Những trải nghiệm thực tế từ các nàng thơ đã tin chọn DungDorys.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <div className="text-center pr-4 border-r border-slate-100">
              <span className="font-serif text-4xl font-bold text-slate-900">{avgRating}</span>
              <span className="text-xs text-slate-400 block mt-0.5">trên 5.0</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-amber-400 gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 font-medium">99% khách hàng rất hài lòng</p>
              <p className="text-[11px] text-slate-400">{totalReviews} lượt đánh giá xác thực</p>
            </div>
          </div>
        </div>

        {/* Reviews List & Write Review Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Reviews List Column */}
          <div className="lg:col-span-8 space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-3 hover:border-rose-100 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {rev.customerName ? rev.customerName.charAt(0).toUpperCase() : 'K'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{rev.customerName}</h4>
                        {rev.verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Đã trải nghiệm</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{rev.createdAt}</span>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center text-amber-400 gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  "{rev.comment}"
                </p>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-50">
                  <span className="text-[11px]">Dịch vụ: {service.serviceName}</span>
                  <button className="flex items-center gap-1.5 hover:text-rose-600 transition-colors">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Hữu ích ({rev.likes})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Write a Review Form Column (CHỈ KHÁCH HÀNG ĐÃ HOÀN THÀNH LỊCH MỚI ĐƯỢC ĐÁNH GIÁ) */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
              
              {checkingEligibility ? (
                <div className="py-8 space-y-3 text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-rose-600 border-t-transparent animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Đang kiểm tra lịch sử trải nghiệm của bạn...</p>
                </div>
              ) : !isAuthenticated ? (
                /* CHƯA ĐĂNG NHẬP */
                <div className="text-center py-4 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                    <LogIn className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Đăng Nhập Để Đánh Giá</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Để đảm bảo độ xác thực, hệ thống chỉ cho phép khách hàng <strong>đã hoàn thành lịch hẹn dịch vụ này</strong> gửi đánh giá.
                    </p>
                  </div>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Đăng Nhập Tài Khoản Của Bạn</span>
                  </Link>
                </div>
              ) : completedBooking ? (
                /* ĐÃ ĐĂNG NHẬP & CÓ ĐƠN ĐÃ HOÀN THÀNH (ĐỦ ĐIỀU KIỆN) */
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold w-fit mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Xác thực: Đã hoàn thành đơn #{completedBooking.id}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-rose-600" />
                      <span>Chia Sẻ Trải Nghiệm</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Bạn đã hoàn thành lịch hẹn vào ngày <strong>{completedBooking.bookingDate}</strong>. Hãy chia sẻ cảm nhận về lớp nền và tay nghề của thợ nhé!
                    </p>
                  </div>

                  <form onSubmit={handleAddReview} className="space-y-4">
                    {/* Select Stars */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Đánh giá mức độ hài lòng:
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setNewRating(star)}
                            className="p-1 hover:scale-125 transition-transform"
                          >
                            <Star
                              className={`w-6 h-6 ${star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-amber-700 ml-2">
                          {newRating === 5 ? 'Tuyệt vời!' : newRating === 4 ? 'Rất tốt' : newRating === 3 ? 'Bình thường' : 'Chưa hài lòng'}
                        </span>
                      </div>
                    </div>

                    {/* Comment text area */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Cảm nhận của bạn về lớp makeup, chuyên viên:
                      </label>
                      <textarea
                        rows={4}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Lớp nền có căng bóng không? Độ giữ màu ra sao? Thái độ của chuyên viên thế nào?..."
                        className="w-full p-3.5 rounded-2xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-xs sm:text-sm resize-none outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>{submittingReview ? 'Đang gửi...' : 'Gửi Đánh Giá Của Bạn'}</span>
                    </button>
                  </form>
                </div>
              ) : pendingBooking ? (
                /* ĐÃ ĐẶT LỊCH NHƯNG CHƯA HOÀN THÀNH (ĐANG CHỜ / XÁC NHẬN) */
                <div className="text-center py-4 space-y-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                      Lịch hẹn #{pendingBooking.id} đang xử lý
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">Buổi Hẹn Chưa Hoàn Thành</h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Bạn đã đặt lịch cho dịch vụ này vào ngày <strong>{pendingBooking.bookingDate}</strong>. Hệ thống sẽ mở tính năng đánh giá ngay sau khi buổi trang điểm của bạn <strong>kết thúc và hoàn thành (COMPLETED)</strong>.
                    </p>
                  </div>
                  <Link
                    to="/my-bookings"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-600 text-xs font-semibold transition-all"
                  >
                    <span>Xem Trạng Thái Đơn Hẹn Của Bạn</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                /* CHƯA TỪNG ĐẶT DỊCH VỤ NÀY */
                <div className="text-center py-4 space-y-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                      Đánh giá xác thực 100%
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">Chỉ Khách Đã Trải Nghiệm</h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Để đảm bảo mọi phản hồi đều chân thực và uy tín tuyệt đối, chỉ những khách hàng <strong>đã hoàn thành lịch hẹn dịch vụ này</strong> mới có thể viết đánh giá.
                    </p>
                  </div>
                  <Link
                    to={`/booking?serviceId=${service.id}`}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-3 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition-all"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Đặt Lịch Ngay Để Trải Nghiệm</span>
                  </Link>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* Related Services Recommendation */}
      {relatedServices.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-10 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Gợi Ý Thêm</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                Các Dịch Vụ Khác Bạn Có Thể Thích
              </h3>
            </div>
            <Link to="/services" className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1">
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedServices.map(rel => (
              <div
                key={rel.id}
                className="rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
                    <img
                      src={rel.image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'}
                      alt={rel.serviceName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold">
                      {rel.duration} phút
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <h4 className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-1">
                      {rel.serviceName}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {rel.description || 'Dịch vụ trang điểm chuyên nghiệp.'}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-50 flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-rose-600 font-serif">
                    {formatCurrency(rel.price)}
                  </span>
                  <Link
                    to={`/services/${rel.id}`}
                    className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white text-xs font-semibold transition-all"
                  >
                    Chi tiết
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default ServiceDetailPage;
