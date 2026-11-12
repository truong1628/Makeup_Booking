import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles, Clock, Calendar, Check, Layers, AlertCircle,
  Star, ShieldCheck, ArrowLeft, ArrowRight, Share2,
  CheckCircle2, ThumbsUp, MessageSquare, PhoneCall, Award,
  ChevronRight, LogIn
} from 'lucide-react';
import { serviceService } from '../services/serviceService';
import { bookingService } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, decodeHtmlEntities } from '../utils/format';



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

const getServiceExtendedDetails = (service) => {
  const name = (service?.serviceName || '').toLowerCase();
  const isCombo = Boolean(service?.isCombo);
  const baseDesc = (service?.description || '').trim();

  if (isCombo || name.includes('combo')) {
    return {
      overview:
        (baseDesc ? `${baseDesc}. ` : '') +
        'Gói dịch vụ trọn gói kết hợp đồng bộ từ bước chăm sóc phục hồi da chuyên sâu, đánh nền HD căng bóng bền màu, gắn mi thiết kế 3D đến tạo kiểu tóc và cài phụ kiện cao cấp. Chuyên viên sẽ tư vấn trực tiếp theo dáng khuôn mặt, tông da và trang phục để mang lại tổng thể hài hòa, nổi bật nhất.',
      highlights: [
        'Làm sạch, cấp ẩm sâu & khóa nền bền màu suốt 14–16 giờ không xuống tone',
        'Thiết kế layout trang điểm mắt, khối mũi & màu môi cá nhân hóa theo váy cưới/trang phục',
        'Tặng kèm mi lụa thiết kế siêu nhẹ & tạo kiểu tóc trọn gói kèm phụ kiện cài tóc cao cấp',
        'Hỗ trợ kiểm tra ánh sáng chụp hình & dặm lại hoàn thiện trước khi bàn giao'
      ],
      suitableFor: ['Lễ ăn hỏi & Lễ cưới', 'Tiệc cưới nhà hàng', 'Chụp ảnh Pre-wedding', 'Sự kiện trọng đại'],
      prepTips: [
        'Dưỡng ẩm nhẹ nhàng và tẩy tế bào chết môi vào tối hôm trước để lớp nền và son bám mịn nhất.',
        'Gội đầu khô sạch trước buổi hẹn (tránh ủ dầu xả quá sát chân tóc) giúp tóc giữ nếp bồng bềnh lâu hơn.',
        'Ưu tiên mặc áo cài nút hoặc áo cổ rộng để thuận tiện thay trang phục sau khi làm xong tóc và makeup.'
      ]
    };
  }

  if (name.includes('cô dâu') && !name.includes('mẹ') && !name.includes('tóc')) {
    return {
      overview:
        (baseDesc ? `${baseDesc}. ` : '') +
        'Dịch vụ trang điểm cô dâu cao cấp tập trung vào kỹ thuật nền trong veo căng bóng hoặc sang trọng sắc sảo tùy theo phong cách tiệc ngày hay tiệc tối. Sử dụng 100% mỹ phẩm high-end chống thấm nước, chống mồ hôi giúp cô dâu tự tin rạng rỡ dưới ánh đèn sân khấu và ống kính máy ảnh.',
      highlights: [
        'Kỹ thuật đánh nền mỏng nhẹ đa tầng, che phủ khuyết điểm hoàn hảo mà không dày cộm',
        'Chống nước, chống lem trôi suốt 16 giờ liên tục trong điều kiện ngoài trời hoặc phòng tiệc',
        'Tặng kèm mi lụa chùm thiết kế tự nhiên giúp đôi mắt to tròn, có chiều sâu',
        'Tư vấn màu son, má hồng và kiểu đánh khối hài hòa với áo dài / váy cưới'
      ],
      suitableFor: ['Lễ rước dâu buổi sáng', 'Tiệc cưới buổi tối', 'Lễ đính hôn', 'Chụp hình cưới'],
      prepTips: [
        'Ngủ đủ giấc và hạn chế uống nhiều nước sát giờ đi ngủ để tránh sưng mắt sáng hôm sau.',
        'Làm sạch mặt, thoa toner/kem dưỡng dịu nhẹ trước khi chuyên viên đến.',
        'Chuẩn bị sẵn ảnh váy cưới hoặc áo dài để chuyên viên phối tone màu chuẩn nhất.'
      ]
    };
  }

  if (name.includes('tóc')) {
    return {
      overview:
        (baseDesc ? `${baseDesc}. ` : '') +
        'Dịch vụ tạo kiểu tóc chuyên nghiệp mang đến mái tóc bồng bềnh, vào nếp tự nhiên từ phong cách búi thấp Hàn Quốc thanh lịch, búi cao hoàng gia sang trọng đến uốn sóng lơi nữ tính. Đã bao gồm kỹ thuật xử lý phồng chân tóc, che khuyết điểm trán/thái dương và hỗ trợ cài phụ kiện.',
      highlights: [
        'Tạo kiểu đa dạng: Búi thấp thanh lịch, uốn sóng nước, tết vương miện hoặc buộc nửa đầu',
        'Sử dụng dưỡng nhiệt & keo xịt giữ nếp cao cấp không gây bết cứng hay khô xơ tóc',
        'Hỗ trợ cài voan, trâm cài, kẹp ngọc trai hoặc hoa tươi đồng bộ trang phục',
        'Cố định chắc chắn, giữ form tóc đẹp suốt 12–16 giờ vận động'
      ],
      suitableFor: ['Cô dâu ngày cưới', 'Dự tiệc sang trọng', 'Chụp ảnh ngoại cảnh', 'Sự kiện thảm đỏ'],
      prepTips: [
        'Nên gội đầu sạch từ tối hôm trước và sấy khô hoàn toàn, tránh dùng tinh dầu dưỡng làm trơn khó giữ nếp.',
        'Nếu muốn gắn thêm tóc nối/tóc giả hoặc phụ kiện riêng, hãy mang theo để chuyên viên phối hợp.',
        'Mặc áo cài cúc hoặc áo cổ rộng để không làm rối kiểu tóc khi thay đồ.'
      ]
    };
  }

  if (name.includes('mi') || name.includes('chăm sóc da')) {
    return {
      overview:
        (baseDesc ? `${baseDesc}. ` : '') +
        'Liệu trình kết hợp chuẩn bị làn da căng mọng (Skin-Prep) trước khi trang điểm cùng kỹ thuật nối/gắn mi tơi 3D thủ công từng sợi. Giúp làm dịu vùng da khô bong tróc, khóa ẩm tức thì để lớp nền bám chặt mịn mượt và đôi mắt có hàng mi cong tự nhiên đầy cuốn hút.',
      highlights: [
        'Làm sạch dịu nhẹ, đắp mặt nạ cấp ẩm phục hồi tức thì (Hydra-Glow) chống mốc nền',
        'Massage thư giãn nâng cơ nhẹ vùng mặt và mắt giúp giảm bọng mắt, da ăn phấn hơn',
        'Gắn mi chùm / mi lụa 3D siêu nhẹ tùy chỉnh độ dày, độ dài phù hợp từng dáng mắt',
        'Sử dụng keo dán chuyên dụng an toàn, êm dịu cho mắt nhạy cảm và người đeo lens'
      ],
      suitableFor: ['Da khô dễ mốc nền', 'Người có hàng mi thưa ngắn', 'Bước đệm trước tiệc', 'Mắt nhạy cảm'],
      prepTips: [
        'Để mặt mộc hoàn toàn và không chuốt mascara trước khi thực hiện.',
        'Nếu bạn đeo kính áp tròng (lens), hãy đeo lens trước khi gắn mi để đảm bảo vệ sinh và thoải mái.',
        'Thông báo cho chuyên viên nếu da bạn có tiền sử dị ứng với thành phần mỹ phẩm nào.'
      ]
    };
  }

  if (name.includes('mẹ')) {
    return {
      overview:
        (baseDesc ? `${baseDesc}. ` : '') +
        'Phong cách trang điểm dành riêng cho Mẹ Cô dâu / Mẹ Chú rể với tiêu chí thanh lịch, quý phái và tôn vinh nét đẹp phúc hậu tự nhiên. Kỹ thuật nền mỏng mịn giúp làm mờ nếp nhăn vùng đuôi mắt, rãnh cười mà không bị dày phấn hay lộ vân da.',
      highlights: [
        'Kỹ thuật nâng cơ mắt & đánh nền mỏng nhẹ, không đọng phấn vào rãnh nhăn',
        'Tông màu trang nhã (cam đất, hồng trầm, đỏ rượu nhẹ) sang trọng và bắt sáng tốt',
        'Tạo khối nhẹ hài hòa gương mặt, giữ nét tự nhiên, đằm thắm khi tiếp khách và chụp ảnh',
        'Độ bền màu cao suốt cả ngày dài tổ chức hôn lễ mà vẫn thoáng nhẹ dễ chịu'
      ],
      suitableFor: ['Mẹ Cô dâu ngày cưới', 'Mẹ Chú rể lễ ăn hỏi', 'Lễ mừng thọ / Tiệc gia đình', 'Chụp ảnh kỷ niệm'],
      prepTips: [
        'Dưỡng ẩm da kỹ vào buổi tối trước ngày cưới giúp da mềm mịn và căng bóng hơn.',
        'Chuẩn bị trước áo dài và trang sức (hoa tai, vòng cổ) để chuyên viên phối tone son hài hòa.',
        'Nếu đeo kính khi đi lại hoặc đọc bài phát biểu, báo trước để chuyên viên điều chỉnh độ dài mi phù hợp.'
      ]
    };
  }

  if (name.includes('hóa trang') || name.includes('cosplay') || name.includes('concept')) {
    return {
      overview:
        (baseDesc ? `${baseDesc}. ` : '') +
        'Dịch vụ trang điểm hóa trang & Concept nghệ thuật dành cho các buổi chụp hình thời trang, lễ hội Halloween, cổ trang, Cosplay hoặc biểu diễn sân khấu. Chuyên viên sử dụng bảng màu pigment chuyên dụng và kỹ thuật vẽ chi tiết sắc nét để biến hóa nhân vật ấn tượng, chân thực nhất.',
      highlights: [
        'Thiết kế layout sáng tạo theo đúng nhân vật, chủ đề hoặc hình ảnh tham khảo riêng',
        'Sử dụng màu vẽ chuyên nghiệp (Face & Body Paint / SFX) an toàn cho da và lên màu chuẩn nét',
        'Kỹ thuật tạo khối 3D góc cạnh, nhấn mắt ấn tượng, đính đá/kim tuyến hoặc hiệu ứng đặc biệt',
        'Bền màu cực cao dưới ánh đèn studio, đèn sân khấu và hoạt động ngoài trời'
      ],
      suitableFor: ['Chụp ảnh Concept / Editorial', 'Lễ hội Halloween / Tiệc hóa trang', 'Cosplay nhân vật', 'Biểu diễn nghệ thuật'],
      prepTips: [
        'Gửi trước hình ảnh nhân vật hoặc moodboard tham khảo ở Bước 4 để chuyên viên chuẩn bị dụng cụ chuyên biệt.',
        'Thử trước kính áp tròng màu (nếu có) và dưỡng ẩm da kỹ trước khi vẽ hóa trang.',
        'Chuẩn bị sẵn nước tẩy trang chuyên dụng hoặc dầu tẩy trang sau khi kết thúc sự kiện.'
      ]
    };
  }

  return {
    overview:
      (baseDesc ? `${baseDesc}. ` : '') +
      'Dịch vụ trang điểm chuyên nghiệp tại DungDorys tôn vinh đường nét tự nhiên, định hình phong cách cá nhân hóa theo cấu trúc khuôn mặt và bối cảnh sự kiện. Cam kết sử dụng 100% mỹ phẩm chính hãng cao cấp cho lớp nền mịn mượt, lâu trôi suốt cả ngày.',
    highlights: [
      'Phân tích cấu trúc gương mặt & undertone da để lựa chọn layout hài hòa nhất',
      'Kỹ thuật đánh nền căng bóng mỏng nhẹ, che khuyết điểm tự nhiên và kiềm dầu tốt',
      'Tặng kèm mi lụa tự nhiên và hỗ trợ dặm phấn hoàn thiện trước khi ra về',
      'Linh hoạt thực hiện nhiều phong cách: Hàn Quốc trong veo, Thái sắc sảo, Âu Mỹ quyến rũ'
    ],
    suitableFor: ['Dự tiệc & Sự kiện', 'Chụp ảnh Kỷ yếu', 'Sinh nhật / Tốt nghiệp', 'Chụp hình Beauty'],
    prepTips: [
      'Rửa mặt sạch và dưỡng ẩm cơ bản trước giờ hẹn 30 phút để lớp nền ăn da hơn.',
      'Mang theo ảnh trang phục dự kiến để chuyên viên tư vấn màu mắt và son phù hợp.',
      'Chủ động trao đổi phong cách yêu thích hoặc khuyết điểm muốn che với chuyên viên.'
    ]
  };
};

const ServiceDetailPage = () => {
  const { id } = useParams();
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

        // Setup gallery images (lấy từ dữ liệu dịch vụ)
        const baseImg = servData.image || '';
        const gallery = servData.images && Array.isArray(servData.images) && servData.images.length > 0
          ? servData.images
          : (baseImg ? [baseImg] : []);
        setGalleryImages(gallery);
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
            
            // Check completed booking (loại trừ hoàn toàn đơn đã hủy)
            const completed = myBookings.find(b => {
              const isCancelled = b.status === 'CANCELLED' || Boolean(b.notes && (b.notes.includes('[Lý do hủy') || b.notes.includes('[HOÀN CỌC') || b.notes.includes('[ĐÃ HOÀN CỌC') || b.notes.includes('[Tự động hủy')));
              return !isCancelled && b.status === 'COMPLETED' && 
                b.items?.some(item => 
                  String(item.makeupServiceId) === String(id) || 
                  (item.serviceName && servData.serviceName && item.serviceName.toLowerCase().trim() === servData.serviceName.toLowerCase().trim())
                );
            });
            setCompletedBooking(completed || null);

            // Check non-completed active booking
            const pending = myBookings.find(b => {
              const isCancelled = b.status === 'CANCELLED' || Boolean(b.notes && (b.notes.includes('[Lý do hủy') || b.notes.includes('[HOÀN CỌC') || b.notes.includes('[ĐÃ HOÀN CỌC') || b.notes.includes('[Tự động hủy')));
              return !isCancelled && b.status !== 'COMPLETED' && 
                b.items?.some(item => 
                  String(item.makeupServiceId) === String(id) || 
                  (item.serviceName && servData.serviceName && item.serviceName.toLowerCase().trim() === servData.serviceName.toLowerCase().trim())
                );
            });
            setPendingBooking(pending || null);
          } catch (err) {
            console.warn('Không thể kiểm tra lịch sử đơn đặt:', err);
          } finally {
            setCheckingEligibility(false);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải chi tiết dịch vụ:', err);
        const serverMsg = err.response?.data?.message;
        setError(serverMsg || 'Không thể tìm thấy thông tin dịch vụ hoặc dịch vụ không tồn tại.');
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
        .map(l => l.replace(/^[•\-*+]\s*/, '').trim())
        .filter(l => l.length > 0)
        .map(l => {
          const m = l.match(/^(\d+)x?\s*(.+)$/i);
          return m ? { quantity: parseInt(m[1]), name: m[2].trim() } : { quantity: 1, name: l };
        })
    : [];

  const extendedDetails = getServiceExtendedDetails(service);

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
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-slate-900 shadow-xl border-4 border-white group flex items-center justify-center">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={service.serviceName}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center bg-gradient-to-tr from-slate-950 via-rose-950/60 to-slate-900">
                  <Sparkles className="w-12 h-12 text-rose-400 mb-3 animate-pulse" />
                  <p className="text-white font-bold text-base mb-1">{service.serviceName}</p>
                  <span className="text-xs text-rose-200/70">Studio DungDorys</span>
                </div>
              )}
              
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
                {selectedImage && (
                  <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-300 text-[11px] font-semibold flex items-center gap-1 shadow-md w-fit">
                    <Star className="w-3 h-3 fill-amber-300" />
                    <span>Ảnh thực tế Studio</span>
                  </span>
                )}
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

            {/* Thumbnail Row (Chỉ hiển thị khi có từ 2 ảnh trở lên) */}
            {galleryImages.length > 1 && (
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
            )}
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
            <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-50/80 via-pink-50/40 to-amber-50/50 border border-rose-100/80">
              <span className="text-xs text-slate-500 font-medium block">Chi phí trọn gói dịch vụ</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-sans text-3xl sm:text-4xl font-bold text-rose-600">
                  {formatCurrency(service.price)}
                </span>
                <span className="text-xs text-slate-400">/ buổi</span>
              </div>
            </div>

            {/* Description & Detailed Breakdown */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mô tả chi tiết dịch vụ</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {extendedDetails.overview}
                </p>
              </div>

              {/* Hạng mục & Quyền lợi nổi bật */}
              <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-100 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span>Điểm nổi bật & Quyền lợi bao gồm</span>
                </h4>
                <ul className="space-y-2">
                  {extendedDetails.highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Phù hợp cho dịp */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Phù hợp cho:
                </span>
                {extendedDetails.suitableFor.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-medium border border-rose-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
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

      {/* Preparation Tips & Policy Note */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-50/70 via-white to-amber-50/60 border border-rose-100 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-sm">
              <span className="text-[11px] font-bold uppercase tracking-widest text-rose-600">
                Mẹo Nhỏ Dành Cho Bạn
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Chuẩn Bị Trước Giờ Hẹn
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Một vài lưu ý nhỏ giúp lớp trang điểm ăn da hơn, giữ nếp tóc lâu hơn và tiết kiệm tối đa thời gian thực hiện.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              {extendedDetails.prepTips.map((tip, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-1.5">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-600 font-bold text-xs">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">{tip}</p>
                </div>
              ))}
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

                <p className="text-sm text-slate-600 leading-relaxed break-words whitespace-pre-wrap">
                  "{decodeHtmlEntities(rev.comment)}"
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

                  <form onSubmit={handleAddReview} noValidate className="space-y-4">
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
                  <div className="relative aspect-[4/5] bg-slate-900 overflow-hidden">
                    {rel.image ? (
                      <img
                        src={rel.image}
                        alt={rel.serviceName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center bg-gradient-to-br from-slate-900 to-slate-950">
                        <Sparkles className="w-8 h-8 text-rose-400/70 mb-1" />
                        <span className="text-[11px] text-slate-300">Studio DungDorys</span>
                      </div>
                    )}
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
                  <span className="text-sm font-bold text-rose-600 font-sans">
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
