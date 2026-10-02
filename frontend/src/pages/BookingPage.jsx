import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Sparkles, CheckCircle2,
  AlertCircle, ShieldCheck, ChevronRight, ChevronLeft,
  Home, Building2, Layers, User, Users, Award, CreditCard, ArrowRight, Check,
  Plus, Minus, Zap, Coffee, HelpCircle, Flame, Heart, AlertTriangle,
  Upload, Image as ImageIcon, Camera, Trash2, Palette, FileText, CheckCircle
} from 'lucide-react';
import { serviceService } from '../services/serviceService';
import { bookingService } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, calculateTravelFee } from '../utils/format';
import MapboxLocationPicker from '../components/MapboxLocationPicker';

export const LAYOUT_OPTIONS = [
  {
    id: 'DOUYIN',
    name: 'Tone Douyin / Baby Trong Trẻo',
    tag: 'Hot Trend',
    desc: 'Mắt long lanh nhũ bắt sáng, má hồng baby phớt cam đào, môi mọng juicy trong veo ngây thơ.',
    suitableFor: 'Mặt tròn, trái xoan, chụp ảnh kỷ yếu, tiệc trẻ trung, sự kiện ngoài trời.',
    gradient: 'from-pink-500/10 via-rose-500/5 to-white',
    borderActive: 'border-pink-500 ring-2 ring-pink-500/20 bg-pink-50/40',
    badgeClass: 'bg-pink-100 text-pink-700 border-pink-200',
  },
  {
    id: 'KOREAN',
    name: 'Tone Hàn Quốc / Glass Skin Tự Nhiên',
    tag: 'Thanh Lịch',
    desc: 'Lớp nền mỏng nhẹ căng bóng dewy, chân mày phẩy sợi nhẹ nhàng, tone cam đào hoặc san hô chuẩn Hàn.',
    suitableFor: 'Phù hợp mọi khuôn mặt, đi tiệc nhẹ, sự kiện ban ngày, cô dâu lễ ăn hỏi.',
    gradient: 'from-amber-500/10 via-orange-500/5 to-white',
    borderActive: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'WESTERN',
    name: 'Tone Tây Nâu / Glamour Sắc Sảo',
    tag: 'Quyến Rũ',
    desc: 'Tạo khối gò má góc cạnh, mắt khói nâu cut-crease hút hồn, son nude đất lì sắc sảo sang trọng.',
    suitableFor: 'Khuôn mặt góc cạnh, tiệc tối gala, chụp lookbook thời trang, dạ hội cao cấp.',
    gradient: 'from-stone-500/10 via-amber-700/5 to-white',
    borderActive: 'border-stone-600 ring-2 ring-stone-600/20 bg-stone-50/50',
    badgeClass: 'bg-stone-200 text-stone-800 border-stone-300',
  },
  {
    id: 'THAI',
    name: 'Tone Thái Lan / Glowy Sắc Nét',
    tag: 'Ấn Tượng',
    desc: 'Lông mày cong sắc nét, mi cong vút tơi đều, tone cam đất ấm áp tạo chiều sâu hút mọi ánh nhìn.',
    suitableFor: 'Mặt dài, mặt vuông, nước da ngăm khỏe khoắn hoặc bánh mật tôn nét.',
    gradient: 'from-orange-500/10 via-rose-500/5 to-white',
    borderActive: 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/40',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  {
    id: 'VINTAGE',
    name: 'Tone Cổ Điển / Vintage Classic Red',
    tag: 'Quý Tộc',
    desc: 'Eyeliner mắt mèo sắc lẹm, làn da sứ mịn như nhung, màu son đỏ thuần quyền lực phong cách minh tinh.',
    suitableFor: 'Tiệc cưới sang trọng, dạ tiệc đêm, phong cách retro thập niên hoàng kim.',
    gradient: 'from-rose-600/10 via-red-600/5 to-white',
    borderActive: 'border-rose-600 ring-2 ring-rose-600/20 bg-rose-50/40',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  {
    id: 'CUSTOM',
    name: 'Tùy Biến Theo Yêu Cầu Riêng',
    tag: 'Linh Hoạt',
    desc: 'Bạn đã có sẵn layout yêu thích hoặc ảnh mẫu từ trước? Hãy tải ảnh lên và trao đổi trực tiếp với artist.',
    suitableFor: 'Khách hàng có concept độc đáo hoặc muốn kết hợp theo gu cá nhân riêng biệt.',
    gradient: 'from-purple-500/10 via-indigo-500/5 to-white',
    borderActive: 'border-purple-600 ring-2 ring-purple-600/20 bg-purple-50/40',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
  },
];

const BookingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedServiceId = searchParams.get('serviceId');

  // Wizard Step: 1, 2, 3, 4, 5
  const [currentStep, setCurrentStep] = useState(1);

  // Data states
  const [services, setServices] = useState([]);
  const [combos, setCombos] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Step 1: Selected Services & Quantities
  const [serviceTypeFilter, setServiceTypeFilter] = useState('ALL'); // ALL, COMBO, SINGLE
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [serviceQuantities, setServiceQuantities] = useState({}); // { [serviceId]: number of people }

  // Step 2: Location
  const [locationType, setLocationType] = useState('STUDIO'); // 'STUDIO' | 'HOME'
  const [homeAddress, setHomeAddress] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [distanceKm, setDistanceKm] = useState(5);

  // Step 3: Model 2 - Smart Dispatch Scheduling
  const getLocalTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getLocalTodayStr();
  const [bookingDate, setBookingDate] = useState(() => {
    const now = new Date();
    // Nếu quá 21:00 tối thì mặc định đặt lịch cho ngày mai
    if (now.getHours() >= 21) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const y = tomorrow.getFullYear();
      const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const d = String(tomorrow.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return getLocalTodayStr();
  });
  const [userStartTime, setUserStartTime] = useState(() => {
    const now = new Date();
    if (now.getHours() >= 21) return '08:00';
    // Mặc định ít nhất 1 tiếng kể từ hiện tại, làm tròn lên mốc 15 phút
    let targetM = now.getHours() * 60 + now.getMinutes() + 60;
    targetM = Math.ceil(targetM / 15) * 15;
    if (targetM >= 23 * 60) return '08:00';
    const h = String(Math.floor(targetM / 60)).padStart(2, '0');
    const m = String(targetM % 60).padStart(2, '0');
    return `${h}:${m}`;
  });
  const [userEndTime, setUserEndTime] = useState(() => {
    const now = new Date();
    if (now.getHours() >= 21) return '10:00';
    let targetM = now.getHours() * 60 + now.getMinutes() + 180;
    targetM = Math.ceil(targetM / 15) * 15;
    if (targetM >= 24 * 60) return '11:00';
    const h = String(Math.floor(targetM / 60)).padStart(2, '0');
    const m = String(targetM % 60).padStart(2, '0');
    return `${h}:${m}`;
  });
  const [dispatchPlan, setDispatchPlan] = useState('BALANCED'); // 'SAVING' | 'BALANCED' | 'SPEED'
  const [dispatchOptions, setDispatchOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Step 4: Layout & Face Avatar & Notes
  const [selectedLayout, setSelectedLayout] = useState('Tone Douyin / Baby Trong Trẻo');
  const [customLayoutText, setCustomLayoutText] = useState('');
  const [faceImage, setFaceImage] = useState(null); // Base64 data URL
  const [faceImageName, setFaceImageName] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');

  // Step 5: Payment & Completion
  const [createdBooking, setCreatedBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('VNPAY'); // 'VNPAY' | 'AT_STUDIO'
  const [showStudioConfirmModal, setShowStudioConfirmModal] = useState(false);
  const [showVNPayModal, setShowVNPayModal] = useState(false);
  const [vnpayData, setVnpayData] = useState(null);
  const [vnpayProcessing, setVnpayProcessing] = useState(false);

  // Khách chọn Tại Nhà thì bắt buộc phải cọc online VNPay
  useEffect(() => {
    if (locationType === 'HOME' && paymentMethod === 'AT_STUDIO') {
      setPaymentMethod('VNPAY');
    }
  }, [locationType, paymentMethod]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [servicesRes, combosRes, artistsRes] = await Promise.all([
          serviceService.getServices(),
          serviceService.getCombos(),
          bookingService.getArtists().catch(() => []),
        ]);
        setServices(servicesRes);
        setCombos(combosRes);
        setArtists(Array.isArray(artistsRes) ? artistsRes : (Array.isArray(artistsRes?.data) ? artistsRes.data : []));

        // Pre-select service from URL if provided
        if (preSelectedServiceId) {
          const sId = Number(preSelectedServiceId);
          setSelectedServiceIds([sId]);
          setServiceQuantities({ [sId]: 1 });
        } else if (servicesRes.length > 0) {
          const sId = servicesRes[0].id;
          setSelectedServiceIds([sId]);
          setServiceQuantities({ [sId]: 1 });
        }
      } catch (err) {
        setError('Không thể tải thông tin dịch vụ. Vui lòng tải lại trang.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [preSelectedServiceId]);

  // List of all services (single + combos)
  const allServicesCombined = [...combos, ...services.filter(s => !s.isCombo)];

  const displayedServices = allServicesCombined.filter((s) => {
    if (serviceTypeFilter === 'COMBO') return s.isCombo;
    if (serviceTypeFilter === 'SINGLE') return !s.isCombo;
    return true;
  });

  const selectedServicesList = allServicesCombined.filter((s) =>
    selectedServiceIds.includes(s.id)
  );

  // Tính tổng số người phục vụ
  const totalPeople = selectedServicesList.reduce(
    (acc, s) => acc + (serviceQuantities[s.id] || 1), 0
  );

  // Thay đổi số lượng người cho 1 gói dịch vụ
  const handleQuantityChange = (id, delta, e) => {
    if (e) e.stopPropagation();
    const currentQty = serviceQuantities[id] || 1;
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      if (selectedServiceIds.length > 1) {
        setSelectedServiceIds(selectedServiceIds.filter((item) => item !== id));
        const updatedQ = { ...serviceQuantities };
        delete updatedQ[id];
        setServiceQuantities(updatedQ);
      } else {
        toast.error('Vui lòng giữ lại ít nhất 1 dịch vụ (tối thiểu 1 người)');
      }
    } else {
      setServiceQuantities({
        ...serviceQuantities,
        [id]: Math.min(newQty, 20),
      });
      if (!selectedServiceIds.includes(id)) {
        setSelectedServiceIds([...selectedServiceIds, id]);
      }
    }
  };

  // Toggle chọn hoặc bỏ chọn dịch vụ
  const handleToggleService = (id) => {
    if (selectedServiceIds.includes(id)) {
      if (selectedServiceIds.length > 1) {
        setSelectedServiceIds(selectedServiceIds.filter((item) => item !== id));
        const updatedQ = { ...serviceQuantities };
        delete updatedQ[id];
        setServiceQuantities(updatedQ);
      } else {
        toast.error('Vui lòng giữ lại ít nhất 1 dịch vụ');
      }
    } else {
      setSelectedServiceIds([...selectedServiceIds, id]);
      setServiceQuantities({
        ...serviceQuantities,
        [id]: serviceQuantities[id] || 1,
      });
    }
  };

  // Helper chuyển timeStr "HH:mm" hoặc "HH:mm:ss" thành tổng phút từ đầu ngày
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const parts = String(timeStr).split(':');
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };

  // Helper định dạng số phút chênh lệch: "1 giờ 15 phút" hoặc "30 phút"
  const formatDiffText = (diff) => {
    if (diff === null || diff === undefined || isNaN(diff)) return '';
    const abs = Math.abs(diff);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    if (h > 0 && m > 0) return `${h} giờ ${m} phút`;
    if (h > 0) return `${h} giờ`;
    return `${m} phút`;
  };

  // Tính toán độ lệch giữa giờ xong và hạn chót:
  // > 0: Sớm hơn X phút | === 0: Đúng hạn | < 0: Trễ hơn X phút
  const calcDiffMinutes = (endTimeStr, targetEndTimeStr) => {
    const endM = parseTimeToMinutes(endTimeStr);
    const targetM = parseTimeToMinutes(targetEndTimeStr);
    if (endM === null || targetM === null) return null;
    return targetM - endM;
  };

  // Gợi ý giờ bắt đầu nếu bị trễ
  const getRecommendedStartTime = (targetTimeStr, durationMins) => {
    const targetM = parseTimeToMinutes(targetTimeStr);
    if (targetM === null || !durationMins) return 'sớm hơn';
    const startM = targetM - durationMins;
    if (startM < 0) return 'trước 05:00 sáng';
    const h = String(Math.floor(startM / 60)).padStart(2, '0');
    const m = String(startM % 60).padStart(2, '0');
    return `${h}:${m}`;
  };

  const isValidTimeStr = (str) => typeof str === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(str.substring(0, 5));

  // Kiểm tra tính hợp lệ của ngày hẹn và thời gian
  const isDateInPast = Boolean(bookingDate && bookingDate < todayStr);
  const isToday = bookingDate === todayStr;

  // Lấy thời điểm tối thiểu cho hôm nay: giờ hiện tại + 60 phút
  const now = new Date();
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
  const minMinutesToday = currentTotalMinutes + 60;
  const minTimeTodayFormatted = `${String(Math.min(23, Math.floor(minMinutesToday / 60))).padStart(2, '0')}:${String(minMinutesToday % 60).padStart(2, '0')}`;

  const startMinutes = parseTimeToMinutes(userStartTime);
  const endMinutes = parseTimeToMinutes(userEndTime);

  // 1. Không được đặt trong quá khứ / phải từ 1 tiếng trở lên nếu là hôm nay
  const isStartTimeTooSoon = Boolean(isToday && startMinutes !== null && startMinutes < minMinutesToday);

  // 2. Thời gian kết thúc phải sau thời gian bắt đầu
  const isEndTimeInvalid = Boolean(startMinutes !== null && endMinutes !== null && endMinutes <= startMinutes);

  // Tổng hợp lỗi xác thực thời gian
  const timeValidationError = isDateInPast
    ? 'Ngày làm dịch vụ không thể ở trong quá khứ. Vui lòng chọn từ hôm nay trở đi.'
    : isStartTimeTooSoon
      ? `Lịch hẹn hôm nay phải đặt trước ít nhất 1 tiếng so với hiện tại (vui lòng chọn từ ${minTimeTodayFormatted} trở đi).`
      : isEndTimeInvalid
        ? `Thời gian kết thúc (${userEndTime}) phải sau thời gian bắt đầu (${userStartTime}).`
        : null;

  const isInvalidTimeRange = Boolean(timeValidationError);

  // Gọi API Model 2: Ước tính các phương án điều phối thợ (SAVING, BALANCED, SPEED)
  useEffect(() => {
    if (selectedServiceIds.length === 0 || timeValidationError) {
      setDispatchOptions([]);
      return;
    }

    if (!isValidTimeStr(userStartTime) || !isValidTimeStr(userEndTime)) {
      return;
    }

    const fetchDispatchOptions = async () => {
      setLoadingOptions(true);
      try {
        const itemsPayload = selectedServiceIds.map((id) => ({
          serviceId: id,
          quantity: serviceQuantities[id] || 1,
        }));

        const cleanStart = userStartTime.substring(0, 5) + ':00';
        const cleanEnd = userEndTime.substring(0, 5) + ':00';

        const res = await bookingService.getDispatchOptions({
          bookingDate,
          bookingTime: cleanStart,
          targetEndTime: cleanEnd,
          isTargetEndTimeMode: false,
          items: itemsPayload,
        });

        const optionsList = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        setDispatchOptions(optionsList);
        if (optionsList.length > 0) {
          const found = optionsList.find(o => o.planCode === dispatchPlan);
          if (!found) {
            const defaultPlan = optionsList.find(o => o.planCode === 'BALANCED') || optionsList[0];
            setDispatchPlan(defaultPlan.planCode);
          }
        }
      } catch (err) {
        console.error('Không thể lấy phương án điều phối:', err);
      } finally {
        setLoadingOptions(false);
      }
    };

    const timer = setTimeout(fetchDispatchOptions, 250);
    return () => clearTimeout(timer);
  }, [selectedServiceIds, serviceQuantities, bookingDate, userStartTime, userEndTime]);

  // Kiểm tra trường hợp 1 khách đặt 1 dịch vụ tiêu chuẩn
  const isSingleClientSingleService = totalPeople === 1 && selectedServicesList.length === 1;

  // Phương án điều phối đang được chọn (1 người 1 dịch vụ mặc định dùng gói tiêu chuẩn 1 thợ)
  const activePlanCode = isSingleClientSingleService ? 'SAVING' : dispatchPlan;
  const currentPlan = dispatchOptions.find(o => o.planCode === activePlanCode) || dispatchOptions[0];

  const servicesTotal = selectedServicesList.reduce(
    (acc, s) => acc + (Number(s.price) || 0) * (serviceQuantities[s.id] || 1), 0
  );

  // Phụ phí từ phương án Model 2
  const rushFee = currentPlan ? Number(currentPlan.rushFee || 0) : 0;
  const earlyFee = currentPlan ? Number(currentPlan.earlyFee || 0) : 0;
  const currentSurcharge = currentPlan ? Number(currentPlan.totalSurcharge || 0) : 0;

  const calculatedTravelFee = locationType === 'HOME'
    ? (calculateTravelFee(distanceKm) ?? 0)
    : 0;

  const isOverMaxDistance = locationType === 'HOME' && Number(distanceKm) > 200;

  // Chiết khấu (Gói Tiết Kiệm giảm 15% cho nhóm từ 2 người trở lên)
  const discountAmount = (activePlanCode === 'SAVING' && totalPeople >= 2)
    ? Math.round(servicesTotal * 0.15)
    : (currentPlan ? Number(currentPlan.discountAmount || 0) : 0);

  const totalPrice = Math.max(0, servicesTotal - discountAmount + calculatedTravelFee + currentSurcharge);
  const depositAmount = Math.round(totalPrice * 0.3);

  // Hiển thị giá theo từng bước (Progressive cost display theo tiến trình của khách hàng)
  const effectiveTravelFee = (currentStep >= 2 && locationType === 'HOME') ? calculatedTravelFee : 0;
  const effectiveRushFee = currentStep >= 3 ? rushFee : 0;
  const effectiveEarlyFee = currentStep >= 3 ? earlyFee : 0;
  const effectiveSurcharge = currentStep >= 3 ? (isSingleClientSingleService ? 0 : currentSurcharge) : 0;
  const effectiveDiscount = currentStep >= 3 ? discountAmount : 0;

  const displayedTotalPrice = Math.max(0, servicesTotal - effectiveDiscount + effectiveTravelFee + effectiveSurcharge);
  const displayedDepositAmount = Math.round(displayedTotalPrice * 0.3);

  const displayStartTime = currentPlan ? currentPlan.startTime?.substring(0, 5) : userStartTime;
  const displayEndTime = currentPlan ? currentPlan.endTime?.substring(0, 5) : userEndTime;
  const displayDuration = currentPlan ? currentPlan.durationMinutes : selectedServicesList.reduce((acc, s) => acc + (s.duration || 60), 0);

  // Tính chênh lệch của gói hiện tại so với hạn chót
  const currentDiff = calcDiffMinutes(displayEndTime, userEndTime);

  const getDispatchPlanLabel = (code) => {
    switch (code) {
      case 'SAVING':
        return 'Gói Tiết Kiệm';
      case 'BALANCED':
        return 'Gói Tiêu Chuẩn';
      case 'SPEED':
        return 'Gói Hỏa Tốc';
      default:
        return 'Gói Tiêu Chuẩn';
    }
  };


  // Step validations
  const handleNextStep1 = () => {
    if (selectedServiceIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 gói dịch vụ');
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextStep2 = () => {
    if (locationType === 'HOME') {
      if (!homeAddress || homeAddress.trim() === '') {
        toast.error('Vui lòng tìm kiếm vị trí hoặc đánh dấu điểm đến trên bản đồ Mapbox');
        return;
      }
      if (Number(distanceKm) > 200) {
        toast.error('Studio không nhận đơn đặt lịch tận nơi vượt quá bán kính 200km. Vui lòng chọn địa điểm gần hơn hoặc chọn hình thức Tại Studio.');
        return;
      }
    }
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextStep3 = () => {
    if (!bookingDate) {
      toast.error('Vui lòng chọn ngày thực hiện dịch vụ');
      return;
    }
    if (timeValidationError) {
      toast.error(timeValidationError);
      return;
    }
    setCurrentStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 4 Handlers: Image upload & Next to Step 5
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh (JPG, PNG, WEBP)');
      return;
    }

    setFaceImageName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFaceImage(event.target.result);
      toast.success('Đã tải ảnh chân dung thành công! Artist sẽ xem để tư vấn phong cách phù hợp.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFaceImage(null);
    setFaceImageName('');
    toast.info('Đã xóa ảnh chân dung');
  };

  const handleNextStep4 = () => {
    if (!selectedLayout) {
      toast.error('Vui lòng chọn 1 phong cách makeup (layout)');
      return;
    }
    if (selectedLayout.includes('Tùy Biến') && !customLayoutText.trim()) {
      toast.error('Vui lòng nhập mô tả phong cách / layout trang điểm bạn mong muốn');
      return;
    }
    setCurrentStep(5);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 5: Handle Submit Booking & Payment (VNPay or Pay at Studio)
  const handleProceedBooking = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập trước khi tiến hành thanh toán');
      navigate('/login?redirect=/booking');
      return;
    }

    setSubmitting(true);
    setError(null);

    // Chuẩn bị danh sách items mở rộng theo số lượng người
    const bookingItems = [];
    selectedServicesList.forEach((s) => {
      const qty = serviceQuantities[s.id] || 1;
      for (let i = 0; i < qty; i++) {
        bookingItems.push({
          makeupServiceId: s.id,
        });
      }
    });

    const computedStart = currentPlan ? currentPlan.startTime : (userStartTime.length === 5 ? `${userStartTime}:00` : userStartTime);
    const computedEnd = currentPlan ? currentPlan.endTime : (userEndTime.length === 5 ? `${userEndTime}:00` : userEndTime);

    const finalLayout = selectedLayout.includes('Tùy Biến')
      ? (customLayoutText.trim() ? `Tùy Biến: ${customLayoutText.trim()}` : 'Tùy Biến Theo Yêu Cầu')
      : selectedLayout;

    const payload = {
      bookingDate,
      bookingTime: computedStart.length === 5 ? `${computedStart}:00` : computedStart,
      targetEndTime: computedEnd.length === 5 ? `${computedEnd}:00` : computedEnd,
      locationType,
      executionMode: isSingleClientSingleService ? 'SEQUENTIAL' : (dispatchPlan === 'SAVING' ? 'SEQUENTIAL' : 'PARALLEL'),
      artistCount: isSingleClientSingleService ? 1 : (currentPlan ? currentPlan.artistCount : (dispatchPlan === 'SPEED' ? 3 : (dispatchPlan === 'BALANCED' ? 2 : 1))),
      dispatchPlan: isSingleClientSingleService ? 'SAVING' : dispatchPlan,
      surcharge: isSingleClientSingleService ? 0 : currentSurcharge,
      defaultArtistId: currentPlan?.timelines?.[0]?.artistId || null,
      items: bookingItems,
      layout: finalLayout,
      customerImage: faceImage || null,
      notes: bookingNotes.trim() || null,
      ...(locationType === 'HOME' && {
        addressInfo: {
          address: addressDetails.trim()
            ? `${addressDetails.trim()}, ${homeAddress.trim()}`
            : homeAddress.trim(),
          distanceKm: Number(distanceKm),
        },
      }),
    };

    try {
      // 1. Tạo đơn đặt lịch
      const bookingRes = await bookingService.createBooking(payload);
      setCreatedBooking(bookingRes);

      if (paymentMethod === 'AT_STUDIO') {
        // 2. Xác nhận hình thức thanh toán tại Studio (CASH)
        await bookingService.payAtStudio(bookingRes.id);
        toast.success('🎉 Đặt lịch thành công! Quý khách sẽ thanh toán tại studio. Lưu ý: Studio có thể hủy lịch bất cứ lúc nào theo tình trạng chuyên viên.');
        navigate('/my-bookings');
      } else {
        // 3. Tạo URL thanh toán VNPay
        const vnpayRes = await bookingService.createVNPayUrl(bookingRes.id);
        setVnpayData(vnpayRes);
        setShowVNPayModal(true);
        toast.success('✨ Đơn đặt lịch đã được khởi tạo! Vui lòng hoàn tất thanh toán cọc qua VNPay.');
      }
    } catch (err) {
      setError(err.message || 'Không thể tạo đơn đặt lịch');
      toast.error(err.message || 'Đã xảy ra lỗi khi tạo đơn');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm VNPay Payment Sandbox
  const handleConfirmVNPayPayment = async () => {
    if (!createdBooking || !vnpayData) return;
    setVnpayProcessing(true);
    try {
      await bookingService.confirmVNPay(createdBooking.id, vnpayData.transactionCode);
      setShowVNPayModal(false);
      toast.success('🎉 Thanh toán cọc thành công! Lịch hẹn của bạn đã được xác nhận.');
      navigate('/my-bookings');
    } catch (err) {
      toast.error(err.message || 'Không thể xác thực thanh toán');
    } finally {
      setVnpayProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium">Đang tải biểu mẫu đặt lịch...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header Title */}
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
            Đặt Lịch Chuyên Nghiệp · MNM Makeup Studio
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
            Trang Điểm & Tạo Mẫu Tóc Theo Yêu Cầu
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Hệ thống tự động sắp xếp số lượng chuyên viên makeup tối ưu dựa trên số người và giờ bạn cần xong để kịp sự kiện.
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3 max-w-4xl mx-auto">
          {[
            { step: 1, label: 'Dịch Vụ & Người', icon: Layers },
            { step: 2, label: 'Địa Điểm', icon: MapPin },
            { step: 3, label: 'Thời Gian & Thợ', icon: Clock },
            { step: 4, label: 'Layout & Ảnh', icon: Palette },
            { step: 5, label: 'Xác Nhận & Cọc', icon: CreditCard },
          ].map((item) => {
            const Icon = item.icon;
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            return (
              <div
                key={item.step}
                className={`flex flex-col items-center text-center p-2 rounded-2xl transition-all ${isCurrent ? 'bg-white shadow-sm border border-rose-200 ring-2 ring-rose-500/20' : ''
                  }`}
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1.5 font-bold text-xs sm:text-sm transition-all ${isCompleted
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : isCurrent
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : item.step}
                </div>
                <span className={`text-[10px] sm:text-xs font-semibold line-clamp-1 ${isCurrent ? 'text-rose-600' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Current Wizard Step (8 cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* ======================================================== */}
            {/* BƯỚC 1: CHỌN DỊCH VỤ & SỐ LƯỢNG NGƯỜI */}
            {/* ======================================================== */}
            {currentStep === 1 && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-rose-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                      <span>Bước 1: Chọn Dịch Vụ & Số Lượng Người</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Chọn gói makeup mong muốn và số lượng người phục vụ trong nhóm
                    </p>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                    {[
                      { key: 'ALL', label: 'Tất Cả' },
                      { key: 'COMBO', label: 'Gói Combo' },
                      { key: 'SINGLE', label: 'Dịch Vụ Đơn' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setServiceTypeFilter(tab.key)}
                        className={`px-3 py-1.5 rounded-lg transition-all ${serviceTypeFilter === tab.key
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Services List Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayedServices.map((service) => {
                    const isSelected = selectedServiceIds.includes(service.id);
                    const qty = serviceQuantities[service.id] || 1;

                    return (
                      <div
                        key={service.id}
                        onClick={() => handleToggleService(service.id)}
                        className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${isSelected
                            ? 'border-rose-600 bg-rose-50/30 ring-2 ring-rose-500/20 shadow-sm'
                            : 'border-slate-200 hover:border-rose-200 bg-white'
                          }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {service.isCombo ? (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                                  Combo Tiết Kiệm
                                </span>
                              ) : (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                                  Gói Lẻ
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {service.duration} phút/người
                              </span>
                            </div>

                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected
                                ? 'bg-rose-600 border-rose-600 text-white'
                                : 'border-slate-300 group-hover:border-slate-400'
                              }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>

                          <h4 className="font-bold text-slate-900 text-sm group-hover:text-rose-600 transition-colors">
                            {service.serviceName}
                          </h4>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {service.description || 'Dịch vụ trang điểm chuyên nghiệp, mỹ phẩm chính hãng cao cấp.'}
                          </p>
                        </div>

                        {/* Price & Quantity Controls */}
                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-sm font-bold text-rose-600 font-serif">
                            {formatCurrency(service.price)}
                          </span>

                          {/* Quantity selector */}
                          <div
                            className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => handleQuantityChange(service.id, -1, e)}
                              className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-95"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-slate-800">
                              {isSelected ? qty : 0}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleQuantityChange(service.id, 1, e)}
                              className="w-6 h-6 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-all active:scale-95"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Banner summary of party size */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        Tổng cộng: {totalPeople} người cần phục vụ ({selectedServicesList.length} gói dịch vụ)
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        {totalPeople >= 3 ? 'Nhóm từ 3 người trở lên sẽ được gợi ý điều phối 2-3 chuyên viên ở Bước 3' : 'Nhóm khách lẻ hoặc tiêu chuẩn'}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-rose-600 text-sm">
                    {formatCurrency(servicesTotal)}
                  </span>
                </div>

                {/* Navigation buttons */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    id="btn-next-step-1"
                    onClick={handleNextStep1}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-rose-500/25 transition-all flex items-center gap-2"
                  >
                    <span>Tiếp Tục: Chọn Địa Điểm</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* BƯỚC 2: CHỌN ĐỊA ĐIỂM THỰC HIỆN */}
            {/* ======================================================== */}
            {currentStep === 2 && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-rose-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                    <span>Bước 2: Chọn Địa Điểm Thực Hiện</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Bạn muốn đến Studio của chúng tôi hay chuyên viên đến tận nơi phục vụ?
                  </p>
                </div>

                {/* Studio vs Home Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: STUDIO */}
                  <div
                    onClick={() => setLocationType('STUDIO')}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${locationType === 'STUDIO'
                        ? 'border-rose-600 bg-rose-50/40 ring-2 ring-rose-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">Tại Studio MNM</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          Miễn phí di chuyển
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        204 Trần Duy Hưng, Q. Cầu Giấy, Hà Nội. Đầy đủ gương sáng, máy lạnh, phòng trang điểm chuẩn VIP.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: HOME */}
                  <div
                    onClick={() => setLocationType('HOME')}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${locationType === 'HOME'
                        ? 'border-rose-600 bg-rose-50/40 ring-2 ring-rose-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                      <Home className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">Tận Nơi / Tại Nhà</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          Có phụ phí di chuyển
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Chuyên viên mang đầy đủ cốp đồ nghề và dụng cụ trang điểm đến tận nhà hoặc khách sạn của bạn.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Extra fields if HOME */}
                {locationType === 'HOME' && (
                  <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in duration-200">
                    <MapboxLocationPicker
                      initialAddress={homeAddress}
                      initialDistanceKm={distanceKm}
                      onLocationChange={({ address: newAddr, distanceKm: newDist }) => {
                        if (newAddr) setHomeAddress(newAddr);
                        if (newDist !== undefined && newDist !== null) setDistanceKm(newDist);
                      }}
                    />

                    {/* Chi tiết bổ sung địa chỉ */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Số nhà cụ thể / Căn hộ / Tòa nhà / Lưu ý cho chuyên viên (tùy chọn)
                      </label>
                      <input
                        type="text"
                        id="input-address-details"
                        placeholder="Ví dụ: Tầng 8 Khách sạn Daewoo, phòng 802 hoặc Căn 1205 Tòa S2 Times City"
                        value={addressDetails}
                        onChange={(e) => setAddressDetails(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Quay Lại Bước 1</span>
                  </button>

                  <button
                    type="button"
                    id="btn-next-step-2"
                    onClick={handleNextStep2}
                    disabled={isOverMaxDistance}
                    className={`px-6 py-3 rounded-full text-white text-xs sm:text-sm font-semibold shadow-md transition-all flex items-center gap-2 ${isOverMaxDistance
                        ? 'bg-slate-400 cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 shadow-rose-500/25'
                      }`}
                  >
                    <span>{isOverMaxDistance ? 'Không nhận đơn quá 200km' : 'Tiếp Tục: Chọn Thời Gian & Xếp Thợ'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* BƯỚC 3: THỜI GIAN & PHƯƠNG ÁN ĐIỀU PHỐI (MODEL 2) */}
            {/* ======================================================== */}
            {currentStep === 3 && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
                <div className="pb-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-rose-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                      <span>Bước 3: Thời Gian & Gợi Ý Điều Phối Chuyên Viên</span>
                    </h3>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                      Smart Dispatch
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isSingleClientSingleService
                      ? 'Nhập thời gian bạn cần hoàn thành để hệ thống tính toán tiến độ phục vụ tiêu chuẩn'
                      : 'Nhập giờ bạn cần hoàn thành để kịp sự kiện, hệ thống sẽ đề xuất các phương án 1, 2 hoặc 3 chuyên viên tối ưu nhất'}
                  </p>
                </div>

                {/* Date, Start Time & End Time Inputs */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* 1. Ngày làm dịch vụ */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-rose-600" />
                        <span>Ngày làm dịch vụ *</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          required
                          min={todayStr}
                          id="input-booking-date"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* 2. Bạn có thể bắt đầu lúc... */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        <span>Bạn có thể bắt đầu lúc:</span>
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          required
                          min={isToday ? minTimeTodayFormatted : undefined}
                          id="input-user-start-time"
                          value={userStartTime}
                          onChange={(e) => setUserStartTime(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold font-mono shadow-2xs focus:outline-none focus:ring-2 ${isStartTimeTooSoon
                              ? 'border-red-400 bg-red-50/40 text-red-700 focus:ring-red-400'
                              : 'border-slate-200 bg-white text-slate-900 focus:ring-rose-500'
                            }`}
                        />
                      </div>
                      {isToday && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Hôm nay: Sớm nhất từ {minTimeTodayFormatted} (trước 1h)
                        </p>
                      )}
                    </div>

                    {/* 3. Bạn cần kết thúc lúc... */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-rose-600" />
                        <span className="text-rose-600">Bạn cần kết thúc lúc:</span>
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          required
                          id="input-user-end-time"
                          value={userEndTime}
                          onChange={(e) => setUserEndTime(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold font-mono shadow-2xs focus:outline-none focus:ring-2 ${isEndTimeInvalid
                              ? 'border-red-400 bg-red-50/40 text-red-700 focus:ring-red-400'
                              : 'border-rose-300 bg-rose-50/30 text-rose-600 focus:ring-rose-500'
                            }`}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Phải sau giờ bắt đầu ({userStartTime})
                      </p>
                    </div>
                  </div>

                  {/* Cảnh báo lỗi xác thực thời gian */}
                  {timeValidationError && (
                    <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span className="font-semibold">{timeValidationError}</span>
                    </div>
                  )}

                  {/* HERO LIVE CALCULATION RESULT BOX */}
                  {currentPlan && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-50/60 via-purple-50/40 to-white border border-rose-200/80 shadow-xs space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-100/70 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600">
                              {isSingleClientSingleService ? 'Kết Quả Tính Toán Hoàn Thành' : 'Kết Quả Tính Toán Hoàn Thành Cho Phương Án Đang Chọn'}
                            </span>
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                              <span>
                                {isSingleClientSingleService
                                  ? (selectedServicesList[0]?.serviceName || 'Dịch vụ tiêu chuẩn')
                                  : (currentPlan.planName?.replace(/\s*\([^)]*\)/g, '') || currentPlan.planName)}
                              </span>
                              <span className="text-xs px-2.5 py-0.5 rounded-full font-sans font-bold bg-white text-rose-700 border border-rose-200 shadow-2xs">
                                {isSingleClientSingleService ? '1 Chuyên Viên Phục Vụ' : `${currentPlan.artistCount} Chuyên Viên`}
                              </span>
                            </h4>
                          </div>
                        </div>

                        {/* Status Diff Badge */}
                        {timeValidationError ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-800 text-xs font-bold border border-red-200 shadow-2xs">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                            {timeValidationError}
                          </span>
                        ) : currentDiff !== null ? (
                          currentDiff > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-2xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              Xong sớm hơn {formatDiffText(currentDiff)} so với hạn chót {userEndTime}!
                            </span>
                          ) : currentDiff === 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 shadow-2xs">
                              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                              Kịp giờ hoàn hảo đúng hạn chót {userEndTime}!
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300 shadow-2xs">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              Trễ hơn {formatDiffText(currentDiff)} so với hạn chót {userEndTime}!
                            </span>
                          )
                        ) : null}
                      </div>

                      {/* Main Time Visual Display */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        {/* Start time */}
                        <div className="p-3 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
                          <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Bắt đầu thực hiện:</span>
                          <span className="text-lg font-bold font-mono text-slate-900 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-slate-500" />
                            {displayStartTime}
                          </span>
                        </div>

                        {/* Calculated End time (PROMINENT HIGHLIGHT) */}
                        <div className="p-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/20">
                          <span className="text-[11px] text-rose-100 font-medium block mb-0.5">Dự kiến hoàn thành lúc:</span>
                          <span className="text-xl font-extrabold font-mono flex items-center gap-2 tracking-wide">
                            <Flame className="w-5 h-5 text-amber-300 animate-pulse" />
                            {displayEndTime}
                          </span>
                        </div>

                        {/* Target Deadline & Duration */}
                        <div className="p-3 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
                          <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Hạn chót bạn cần xong:</span>
                          <span className="text-lg font-bold font-mono text-slate-700 flex items-center justify-between">
                            <span>{userEndTime}</span>
                            <span className="text-xs font-sans font-medium text-slate-400">(Tổng: ~{displayDuration}p)</span>
                          </span>
                        </div>
                      </div>

                      {/* Explanation advice text */}
                      <div className="text-xs leading-relaxed pt-1">
                        {isInvalidTimeRange ? (
                          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 space-y-1">
                            <p className="font-bold flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                              <span>Hạn chót không hợp lệ: Giờ bạn cần kết thúc ({userEndTime}) phải muộn hơn giờ bắt đầu ({userStartTime}).</span>
                            </p>
                            <p className="text-[11px] text-red-700 pl-5.5">
                              Vui lòng điều chỉnh lại giờ cần kết thúc hoặc dời giờ bắt đầu sớm hơn để hệ thống tính toán chính xác.
                            </p>
                          </div>
                        ) : currentDiff !== null ? (
                          currentDiff > 0 ? (
                            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-emerald-800 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>
                                <strong>An tâm tuyệt đối:</strong> Phương án này kết thúc lúc <strong>{displayEndTime}</strong>, giúp bạn có thêm <strong>{formatDiffText(currentDiff)}</strong> để chuẩn bị trang phục, chụp ảnh kỷ niệm và di chuyển thảnh thơi.
                              </span>
                            </div>
                          ) : currentDiff === 0 ? (
                            <div className="p-2.5 rounded-xl bg-teal-50/80 border border-teal-200/70 text-teal-800 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                              <span>
                                <strong>Lịch trình vừa vặn:</strong> Dịch vụ kết thúc chuẩn xác lúc <strong>{displayEndTime}</strong> đúng với hạn chót bạn yêu cầu.
                              </span>
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                              <p className="font-bold flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>
                                  Lưu ý: Thời gian làm dịch vụ (~{displayDuration} phút) sẽ kết thúc lúc {displayEndTime}, trễ hơn {formatDiffText(currentDiff)} so với giờ bạn cần ({userEndTime}).
                                </span>
                              </p>
                              <p className="text-[11px] text-amber-800 pl-5.5">
                                💡 <strong>Gợi ý:</strong> {isSingleClientSingleService ? 'Vui lòng điều chỉnh ô ' : 'Chọn phương án có nhiều chuyên viên hơn bên dưới để rút ngắn thời gian, hoặc điều chỉnh ô '}<em>"Bạn có thể bắt đầu lúc"</em> sớm hơn (gợi ý từ: <strong>{getRecommendedStartTime(userEndTime, currentPlan?.durationMinutes)}</strong>).
                              </p>
                            </div>
                          )
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3 DISPATCH OPTIONS (MODEL 2: SAVING / BALANCED / SPEED) - CHỈ HIỂN THỊ KHI NHÓM >= 2 NGƯỜI HOẶC NHIỀU DỊCH VỤ */}
                {!isSingleClientSingleService && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                          Chọn Phương Án Phân Bổ Chuyên Viên (Nhóm {totalPeople} người)
                        </label>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Chọn phương án phù hợp với nhu cầu và ngân sách của bạn
                        </p>
                      </div>
                      <span className="text-xs text-rose-600 font-semibold hidden sm:inline-block">
                        Chính sách minh bạch
                      </span>
                    </div>

                    {loadingOptions ? (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Hệ thống đang tính toán các phương án...</span>
                      </div>
                    ) : dispatchOptions.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Tất cả chuyên viên đều đã có lịch hẹn kín hoặc bận trong khung giờ này. Quý khách vui lòng chọn khung giờ hoặc ngày khác!</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {dispatchOptions.map((opt) => {
                          const isChosen = dispatchPlan === opt.planCode;
                          const isSpeed = opt.planCode === 'SPEED';
                          const isBalanced = opt.planCode === 'BALANCED';

                          return (
                            <div
                              key={opt.planCode}
                              onClick={() => setDispatchPlan(opt.planCode)}
                              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${isChosen
                                  ? isBalanced
                                    ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/20 shadow-xs'
                                    : isSpeed
                                      ? 'border-rose-600 bg-rose-50/50 ring-2 ring-rose-500/20 shadow-xs'
                                      : 'border-slate-800 bg-slate-50 ring-2 ring-slate-800/15 shadow-xs'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40'
                                }`}
                            >
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                  {opt.planCode === 'SAVING' && <Coffee className="w-4 h-4 text-slate-500 shrink-0" />}
                                  {opt.planCode === 'BALANCED' && <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />}
                                  {opt.planCode === 'SPEED' && <Zap className="w-4 h-4 text-rose-600 shrink-0" />}
                                  <span className="truncate">{opt.planName?.replace(/\s*\([^)]*\)/g, '') || opt.planName}</span>
                                  {opt.planCode === 'SAVING' && totalPeople >= 2 && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-sans shrink-0">
                                      -15%
                                    </span>
                                  )}
                                </h4>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                  <span className="text-base font-extrabold text-rose-600 font-serif">
                                    {formatCurrency(opt.totalPrice)}
                                  </span>
                                  {opt.planCode === 'SAVING' && totalPeople >= 2 && opt.servicesPrice && Number(opt.servicesPrice) > Number(opt.totalPrice) && (
                                    <span className="text-xs text-slate-400 line-through font-serif">
                                      {formatCurrency(opt.servicesPrice)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isChosen
                                  ? (isBalanced ? 'bg-purple-600 border-purple-600 text-white' : isSpeed ? 'bg-rose-600 border-rose-600 text-white' : 'bg-slate-800 border-slate-800 text-white')
                                  : 'border-slate-300'
                                }`}>
                                {isChosen && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}





                {/* Navigation buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Quay Lại Bước 2</span>
                  </button>

                  <button
                    type="button"
                    id="btn-next-step-3"
                    onClick={handleNextStep3}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-rose-500/25 transition-all flex items-center gap-2"
                  >
                    <span>Tiếp Tục: Chọn Layout & Tải Ảnh (Bước 4)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* BƯỚC 4: CHỌN PHONG CÁCH MAKEUP (LAYOUT), TẢI ẢNH & GHI CHÚ */}
            {/* ======================================================== */}
            {currentStep === 4 && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
                <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-rose-600 text-white text-xs flex items-center justify-center font-bold">4</span>
                      <span>Bước 4: Chọn Layout & Tải Ảnh Khuôn Mặt</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Chọn phong cách trang điểm mong muốn và tải ảnh chân dung để artist tư vấn độ phù hợp
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 self-start sm:self-auto">
                    Tùy biến theo khuôn mặt
                  </span>
                </div>

                {/* 1. Chọn Layout Trang Điểm */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-rose-600" />
                      <span>1. Chọn Tone Makeup (Layout) Mong Muốn</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Chọn 1 layout phù hợp với phong cách của bạn</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {LAYOUT_OPTIONS.map((layout) => {
                      const isSelected = selectedLayout === layout.name;
                      return (
                        <div
                          key={layout.id}
                          onClick={() => setSelectedLayout(layout.name)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                            isSelected
                              ? `${layout.borderActive} shadow-xs`
                              : 'border-slate-200 bg-white hover:border-rose-200 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${layout.badgeClass}`}>
                                  {layout.tag}
                                </span>
                                <h4 className="font-bold text-slate-900 text-sm mt-1.5 flex items-center gap-1.5">
                                  <span>{layout.name}</span>
                                </h4>
                              </div>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                isSelected ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {layout.desc}
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100/80 text-[11px] text-slate-500 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-rose-500 shrink-0" />
                            <span className="truncate"><strong>Hợp với:</strong> {layout.suitableFor}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Input nếu chọn layout Tùy Biến Theo Yêu Cầu */}
                  {selectedLayout.includes('Tùy Biến') && (
                    <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2 animate-in fade-in">
                      <label className="block text-xs font-bold text-purple-900">
                        Mô tả chi tiết layout hoặc phong cách bạn muốn artist thực hiện:
                      </label>
                      <input
                        type="text"
                        value={customLayoutText}
                        onChange={(e) => setCustomLayoutText(e.target.value)}
                        placeholder="Ví dụ: Layout ngọt ngào tone hồng đất kết hợp đính đá nhẹ đuôi mắt..."
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/30 bg-white"
                      />
                    </div>
                  )}
                </div>

                {/* 2. Tải ảnh chân dung / avatar (Tùy chọn nhưng khuyên dùng) */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-rose-600" />
                      <span>2. Tải Ảnh Chân Dung / Avatar Của Bạn (Khuyên Dùng)</span>
                    </label>
                    <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Để Artist Đánh Giá Độ Phù Hợp
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Tải ảnh cận cảnh khuôn mặt (mặt mộc hoặc ảnh rõ nét) để artist chuẩn bị trước tone nền, màu phấn và tạo khối tôn vinh đường nét riêng của bạn.
                  </p>

                  {/* Image Upload Area */}
                  {faceImage ? (
                    <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
                      <div className="flex items-center gap-4">
                        <div className="relative group shrink-0">
                          <img
                            src={faceImage}
                            alt="Face Avatar Preview"
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-rose-300 shadow-sm"
                          />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Ảnh đã sẵn sàng gửi cho Chuyên viên</span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium truncate max-w-xs">
                            {faceImageName || 'Ảnh chân dung khuôn mặt'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Chuyên gia makeup sẽ xem ảnh này để chuẩn bị bộ mỹ phẩm và tone nền phù hợp nhất với sắc tố da của bạn.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <label
                          htmlFor="avatar-upload-change"
                          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Đổi Ảnh Khác</span>
                        </label>
                        <input
                          id="avatar-upload-change"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="p-2 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold transition-all shadow-2xs"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="avatar-upload-input"
                      className="border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/20 hover:bg-rose-50/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white border border-rose-200 text-rose-600 flex items-center justify-center mb-3 shadow-xs group-hover:scale-105 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        Nhấn để chọn ảnh đại diện / ảnh chân dung từ máy của bạn
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        Hỗ trợ JPG, PNG, WEBP tối đa 5MB (ảnh cận mặt, ánh sáng tự nhiên để đạt hiệu quả tư vấn cao nhất)
                      </span>
                      <input
                        id="avatar-upload-input"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* 3. Ghi Chú Đặc Biệt Cho Artist */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-rose-600" />
                      <span>3. Ghi Chú Riêng Về Da & Kiểu Tóc (Không Bắt Buộc)</span>
                    </label>
                    <span className="text-[11px] text-slate-400">{bookingNotes.length}/300 ký tự</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Ví dụ: Da mình là da dầu dễ đổ dầu vùng T-zone, da nhạy cảm với cồn, mình muốn kiểu tóc búi cài hoa baby nhẹ nhàng..."
                    className="w-full px-4 py-3 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 bg-white placeholder:text-slate-400 resize-none transition-all"
                  />
                </div>

                {/* Navigation buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Quay Lại Bước 3</span>
                  </button>

                  <button
                    type="button"
                    id="btn-next-step-4"
                    onClick={handleNextStep4}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-rose-500/25 transition-all flex items-center gap-2"
                  >
                    <span>Tiếp Tục: Thanh Toán & Đặt Cọc (Bước 5)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* BƯỚC 5: TÓM TẮT CHI PHÍ & NÚT BẤM CHUYỂN SANG VNPAY */}
            {/* ======================================================== */}
            {currentStep === 5 && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-rose-600 text-white text-xs flex items-center justify-center font-bold">5</span>
                    <span>Bước 5: Tóm Tắt Chi Phí & Cổng Thanh Toán VNPay</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Kiểm tra lại toàn bộ chi tiết và đặt cọc 30% để xác nhận giữ chỗ chuyên gia
                  </p>
                </div>

                {/* Review summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Information Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                    <p className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                      Thông Tin Lịch Hẹn
                    </p>
                    <div className="space-y-1.5">
                      <p className="text-slate-700">
                        <strong>Ngày làm dịch vụ:</strong> {bookingDate}
                      </p>
                      <p className="text-slate-700">
                        <strong>Thời gian:</strong> {displayStartTime} ➔ {displayEndTime} (~{displayDuration} phút)
                      </p>
                      <p className="text-slate-700">
                        <strong>Gói điều phối:</strong>{' '}
                        <span className="text-rose-600 font-bold">
                          {isSingleClientSingleService ? 'Phục vụ tiêu chuẩn (1 Chuyên viên)' : getDispatchPlanLabel(dispatchPlan)}
                        </span>
                      </p>
                      <p className="text-slate-700">
                        <strong>Tổng số người:</strong> {totalPeople} người ({selectedServicesList.length} gói dịch vụ)
                      </p>
                      <p className="text-slate-700">
                        <strong>Tình trạng chuyên viên:</strong>{' '}
                        <span className="text-emerald-600 font-bold">
                          {currentPlan?.availableArtistCount !== undefined
                            ? (currentPlan.availableArtistCount > 0 ? `Còn ${currentPlan.availableArtistCount} chuyên viên rảnh` : 'Hết chuyên viên rảnh')
                            : (artists.length > 0 ? `Còn ${artists.length} chuyên viên rảnh` : 'Hệ thống tự động sắp xếp')}
                        </span>
                      </p>
                      <p className="text-slate-700">
                        <strong>Layout đã chọn:</strong>{' '}
                        <span className="text-rose-600 font-bold">
                          {selectedLayout.includes('Tùy Biến') && customLayoutText ? `Tùy Biến: ${customLayoutText}` : selectedLayout}
                        </span>
                      </p>
                      {faceImage && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <strong className="text-slate-700">Ảnh khuôn mặt:</strong>
                          <img src={faceImage} alt="Face Avatar Preview" className="w-7 h-7 rounded-lg object-cover border border-rose-300 shadow-2xs" />
                          <span className="text-emerald-600 font-semibold text-[11px]">✓ Đã đính kèm cho Artist</span>
                        </div>
                      )}
                      {bookingNotes && (
                        <p className="text-slate-700 truncate" title={bookingNotes}>
                          <strong>Ghi chú:</strong> <span className="italic text-slate-600">"{bookingNotes}"</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Location Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                    <p className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                      Địa Điểm Thực Hiện
                    </p>
                    <div className="space-y-1.5">
                      <p className="text-slate-700">
                        <strong>Hình thức:</strong>{' '}
                        {locationType === 'HOME' ? 'Tận Nơi (Tại Nhà)' : 'Tại Studio MNM'}
                      </p>
                      <p className="text-slate-700">
                        <strong>Địa chỉ:</strong>{' '}
                        {locationType === 'HOME'
                          ? (addressDetails ? `${addressDetails}, ${homeAddress}` : homeAddress || 'Chưa chọn trên bản đồ')
                          : '204 Trần Duy Hưng, Q. Cầu Giấy, Hà Nội'}
                      </p>
                      {locationType === 'HOME' && (
                        <p className="text-slate-700">
                          <strong>Khoảng cách:</strong> {distanceKm} km ({' '}
                          {Number(distanceKm) > 200 ? (
                            <span className="text-rose-600 font-bold">Vượt quá 200km (Không nhận đơn)</span>
                          ) : (
                            <span>Phụ phí: {calculatedTravelFee === 0 ? 'Miễn phí (0 ₫)' : formatCurrency(calculatedTravelFee)}</span>
                          )}
                          )
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Selected services list */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Dịch vụ đăng ký ({selectedServicesList.length} dịch vụ · {totalPeople} người)
                  </p>
                  <div className="space-y-2">
                    {selectedServicesList.map((s) => {
                      const q = serviceQuantities[s.id] || 1;
                      return (
                        <div key={s.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-slate-900">{s.serviceName}</span>
                            <span className="text-rose-600 font-bold ml-1.5">x{q} người</span>
                            <span className="text-slate-400 ml-2">({s.duration} phút/người)</span>
                          </div>
                          <span className="font-bold text-slate-800 font-serif">{formatCurrency(s.price * q)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cost Calculation Summary (Model 2 Breakdown) */}
                <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-3">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Tiền dịch vụ gốc:</span>
                    <span>{formatCurrency(servicesTotal)}</span>
                  </div>

                  {/* Chiết khấu Gói Tiết Kiệm (nếu có) */}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                      <span>Ưu đãi Gói Tiết Kiệm (-15%):</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  {/* Phụ phí điều phối cấp tốc (nếu có) */}
                  {rushFee > 0 && (
                    <div className="flex justify-between text-xs text-rose-600 font-semibold">
                      <span>Phụ phí điều phối thợ cấp tốc (Gói Hỏa Tốc +15%):</span>
                      <span>+{formatCurrency(rushFee)}</span>
                    </div>
                  )}

                  {/* Phụ phí làm sớm (nếu có) */}
                  {earlyFee > 0 && (
                    <div className="flex justify-between text-xs text-amber-700 font-semibold">
                      <span>Phụ phí ca sáng sớm (&lt; 06:00 sáng):</span>
                      <span>+{formatCurrency(earlyFee)}</span>
                    </div>
                  )}

                  {locationType === 'HOME' && (
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Phụ phí di chuyển ({distanceKm} km):</span>
                      <span>{formatCurrency(calculatedTravelFee)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-rose-200 flex justify-between text-base font-bold text-slate-900">
                    <span>Tổng chi phí đơn:</span>
                    <span className="text-lg font-serif">{formatCurrency(totalPrice)}</span>
                  </div>

                  {/* Cọc hoặc toàn bộ tùy hình thức thanh toán */}
                  {paymentMethod === 'VNPAY' ? (
                    <div className="p-3.5 rounded-xl bg-white border border-rose-300 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-rose-700 block">Tiền cọc giữ chỗ (30%):</span>
                        <span className="text-[11px] text-slate-500">70% còn lại ({formatCurrency(totalPrice - depositAmount)}) thanh toán sau khi hoàn tất dịch vụ</span>
                      </div>
                      <span className="text-lg font-bold text-rose-600 font-serif">
                        {formatCurrency(depositAmount)}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-white border border-amber-300 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-amber-800 block">Thanh toán tại quầy Studio (100%):</span>
                        <span className="text-[11px] text-slate-500">Không cần đặt cọc trước, thanh toán trực tiếp khi đến làm đẹp</span>
                      </div>
                      <span className="text-lg font-bold text-amber-700 font-serif">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                  )}
                </div>

                {/* ======================================================== */}
                {/* LỰA CHỌN PHƯƠNG THỨC THANH TOÁN */}
                {/* ======================================================== */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-rose-600" />
                      <span>Chọn Phương Thức Thanh Toán</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {locationType === 'STUDIO' ? 'Có 2 phương thức khả dụng' : 'Áp dụng cọc VNPay cho dịch vụ tận nơi'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Lựa chọn 1: Cọc trực tuyến qua VNPay */}
                    <div
                      id="opt-payment-vnpay"
                      onClick={() => setPaymentMethod('VNPAY')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative ${
                        paymentMethod === 'VNPAY'
                          ? 'bg-rose-50/70 border-rose-500 shadow-md shadow-rose-500/10 ring-2 ring-rose-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            paymentMethod === 'VNPAY' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">Cọc Trực Tuyến VNPay (30%)</span>
                            <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md mt-0.5">
                              Khuyên dùng · Giữ chỗ 100%
                            </span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          paymentMethod === 'VNPAY' ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300'
                        }`}>
                          {paymentMethod === 'VNPAY' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="mt-3 space-y-1 text-[11px] text-slate-600 border-t border-slate-100 pt-2.5">
                        <p>• Cọc trước 30%: <strong className="text-rose-600 font-semibold">{formatCurrency(depositAmount)}</strong></p>
                        <p>• 70% còn lại thanh toán sau khi hoàn tất dịch vụ.</p>
                        <p className="text-emerald-700 font-medium flex items-center gap-1 pt-0.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Cam kết giữ đúng chuyên viên &amp; giờ hẹn 100%</span>
                        </p>
                      </div>
                    </div>

                    {/* Lựa chọn 2: Thanh toán trực tiếp tại Studio */}
                    <div
                      id="opt-payment-studio"
                      onClick={() => {
                        if (locationType === 'STUDIO') {
                          setPaymentMethod('AT_STUDIO');
                        } else {
                          toast.error('Hình thức thanh toán tại Studio chỉ áp dụng khi bạn chọn đặt lịch làm tại Studio.');
                        }
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all relative ${
                        locationType !== 'STUDIO'
                          ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                          : paymentMethod === 'AT_STUDIO'
                            ? 'bg-amber-50/70 border-amber-500 shadow-md shadow-amber-500/10 ring-2 ring-amber-500/20 cursor-pointer'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            paymentMethod === 'AT_STUDIO' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">Thanh Toán Tại Studio</span>
                            <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md mt-0.5 ${
                              locationType === 'STUDIO' 
                                ? 'text-amber-800 bg-amber-100 border border-amber-300' 
                                : 'text-slate-500 bg-slate-100'
                            }`}>
                              {locationType === 'STUDIO' ? '100% tại quầy khi đến làm' : 'Chỉ áp dụng tại Studio'}
                            </span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          paymentMethod === 'AT_STUDIO' ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'
                        }`}>
                          {paymentMethod === 'AT_STUDIO' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="mt-3 space-y-1 text-[11px] text-slate-600 border-t border-slate-100 pt-2.5">
                        {locationType === 'STUDIO' ? (
                          <>
                            <p>• Cọc trước: <strong className="text-emerald-600">0 ₫ (Không cần cọc)</strong></p>
                            <p>• Thanh toán toàn bộ <strong className="text-slate-900 font-semibold">{formatCurrency(totalPrice)}</strong> tại quầy lễ tân studio bằng tiền mặt hoặc thẻ.</p>
                            <p className="text-amber-700 font-medium flex items-center gap-1 pt-0.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Không đảm bảo ưu tiên giữ chuyên viên</span>
                            </p>
                          </>
                        ) : (
                          <p className="text-slate-500 italic">
                            Dịch vụ tận nơi (Tại Nhà) yêu cầu thanh toán cọc online để đảm bảo điều phối chuyên viên di chuyển.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CẢNH BÁO QUAN TRỌNG: STUDIO CÓ THỂ HỦY LỊCH BẤT CỨ LÚC NÀO */}
                  {paymentMethod === 'AT_STUDIO' && locationType === 'STUDIO' && (
                    <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300 text-amber-900 space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>LƯU Ý QUAN TRỌNG TỪ MNM MAKEUP STUDIO:</span>
                      </div>
                      <p className="text-[12px] leading-relaxed text-amber-800 pl-6">
                        Đối với hình thức thanh toán tại Studio (không cọc giữ chỗ), <strong className="font-bold underline text-amber-900">Studio có thể chủ động hủy lịch bất cứ lúc nào theo tình trạng chuyên viên</strong> (như chuyên viên có việc đột xuất, studio quá tải hoặc ưu tiên phục vụ khách hàng đã đặt cọc trước).
                      </p>
                      <div className="pl-6 pt-1 text-[11px] text-amber-700 flex items-center gap-1.5 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Gợi ý: Quý khách nên chọn phương thức <strong>Cọc Trực Tuyến VNPay (30%)</strong> để được cam kết phục vụ và giữ đúng chuyên viên 100%.</span>
                      </div>
                    </div>
                  )}

                  {/* VNPay Gateway Notice */}
                  {paymentMethod === 'VNPAY' && (
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center gap-3 text-xs text-blue-800">
                      <div className="w-10 h-10 rounded-xl bg-white border border-blue-200 flex items-center justify-center font-bold text-blue-700 shrink-0 shadow-xs">
                        VNPAY
                      </div>
                      <div>
                        <p className="font-bold">Cổng Thanh Toán Trực Tuyến VNPay</p>
                        <p className="text-[11px] text-blue-600 mt-0.5">
                          Hỗ trợ quét mã VNPAY-QR, thẻ ATM nội địa, thẻ quốc tế Visa / Mastercard bảo mật chuẩn quốc tế.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Quay Lại Bước 4</span>
                  </button>

                  {paymentMethod === 'VNPAY' ? (
                    <button
                      type="button"
                      id="btn-proceed-vnpay"
                      onClick={handleProceedBooking}
                      disabled={submitting}
                      className="px-8 py-3.5 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? (
                        <span>Đang khởi tạo đơn & cổng VNPay...</span>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Thanh Toán Cọc Qua VNPay ({formatCurrency(depositAmount)})</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      id="btn-proceed-studio"
                      onClick={() => setShowStudioConfirmModal(true)}
                      disabled={submitting}
                      className="px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? (
                        <span>Đang xử lý đặt lịch...</span>
                      ) : (
                        <>
                          <Building2 className="w-4 h-4" />
                          <span>Xác Nhận Đặt Lịch & Thanh Toán Tại Studio ({formatCurrency(totalPrice)})</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Summary Box (4 cols) */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-lg space-y-5">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Đơn Đặt Lịch Của Bạn</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-sans font-semibold">
                  Bước {currentStep}/4
                </span>
              </h3>

              {/* Quick Summary of steps */}
              <div className="space-y-3.5 text-xs divide-y divide-slate-100">
                {/* Bước 1: Dịch vụ & Số người */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                    <span>1. Dịch vụ & Khách</span>
                    <span className="text-emerald-600 font-normal lowercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      Đã chọn ({totalPeople} người)
                    </span>
                  </div>
                  {selectedServicesList.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedServicesList.map((service) => {
                        const qty = serviceQuantities[service.id] || 1;
                        const serviceDisplayName = service.serviceName || service.name || service.comboName || 'Dịch vụ makeup';
                        return (
                          <div key={service.id} className="flex justify-between items-start text-slate-800 bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                            <div className="flex items-start gap-1.5 min-w-0 pr-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 text-xs leading-snug line-clamp-1" title={serviceDisplayName}>
                                  {serviceDisplayName}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {qty > 1 ? `${formatCurrency(service.price)} × ${qty}` : (service.duration ? `${service.duration} phút` : '')}
                                </p>
                              </div>
                            </div>
                            <span className="font-bold text-slate-900 text-xs shrink-0 pt-0.5">
                              {formatCurrency(Number(service.price) * qty)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-slate-400 italic text-[11px] py-0.5">
                      Chưa chọn gói dịch vụ nào
                    </div>
                  )}
                </div>

                {/* Bước 2: Địa điểm */}
                <div className="space-y-1.5 pt-3">
                  <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                    <span>2. Địa điểm</span>
                    {currentStep >= 2 ? (
                      <span className="text-emerald-600 font-normal lowercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        {currentStep === 2 ? 'Đang chọn' : 'Đã chọn'}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal lowercase">Chờ bước 2</span>
                    )}
                  </div>
                  {currentStep >= 2 ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-800">
                        <span>Hình thức:</span>
                        <span className="font-semibold text-slate-900">
                          {locationType === 'HOME' ? '🏠 Tại Nhà (HOME)' : '🏢 Tại Studio'}
                        </span>
                      </div>
                      {locationType === 'STUDIO' ? (
                        <div className="text-[11px] text-slate-500">204 Trần Duy Hưng, Cầu Giấy, Hà Nội</div>
                      ) : (
                        <div className="space-y-1 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="truncate text-slate-700 font-medium" title={homeAddress}>
                            📍 {homeAddress || 'Chưa ghim vị trí'}
                          </div>
                          <div className="flex justify-between text-slate-500 pt-0.5">
                            <span>Khoảng cách: <strong className="text-slate-800">{distanceKm} km</strong></span>
                            <span>Phí: <strong className={calculatedTravelFee === 0 ? 'text-emerald-600' : 'text-slate-900'}>
                              {calculatedTravelFee === 0 ? 'Miễn phí (<10km)' : formatCurrency(calculatedTravelFee)}
                            </strong></span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-400 italic text-[11px] py-0.5">
                      Chưa chọn hình thức & địa chỉ (ở Bước 2)
                    </div>
                  )}
                </div>

                {/* Bước 3: Thời gian & Xếp thợ */}
                <div className="space-y-1.5 pt-3">
                  <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                    <span>3. Thời gian & Thợ</span>
                    {currentStep >= 3 ? (
                      <span className="text-emerald-600 font-normal lowercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        {currentStep === 3 ? 'Đang chọn' : 'Đã chọn'}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal lowercase">Chờ bước 3</span>
                    )}
                  </div>
                  {currentStep >= 3 ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-800">
                        <span>Ngày hẹn:</span>
                        <span className="font-semibold text-slate-900">{bookingDate}</span>
                      </div>
                      <div className="flex justify-between text-slate-800">
                        <span>Khung giờ:</span>
                        <span className="font-semibold text-slate-900">
                          {displayStartTime} ➔ {displayEndTime} (~{displayDuration}p)
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-800">
                        <span>Gói điều phối:</span>
                        <span className="font-semibold text-rose-600 truncate max-w-[140px] text-right">
                          {isSingleClientSingleService ? '1 Chuyên viên tiêu chuẩn' : getDispatchPlanLabel(dispatchPlan)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-800">
                        <span>Chuyên viên rảnh:</span>
                        <span className="font-semibold text-emerald-600 truncate max-w-[160px] text-right">
                          {currentPlan?.availableArtistCount !== undefined
                            ? (currentPlan.availableArtistCount > 0 ? `Còn ${currentPlan.availableArtistCount} chuyên viên rảnh` : 'Hết chuyên viên rảnh')
                            : (artists.length > 0 ? `Còn ${artists.length} chuyên viên rảnh` : 'Đang tính toán...')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 italic text-[11px] py-0.5">
                      Chưa chọn ngày giờ & phương án thợ (ở Bước 3)
                    </div>
                  )}
                </div>

                {/* Bước 4: Layout & Ghi Chú / Ảnh */}
                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                    <span>4. Layout & Ảnh Chân Dung</span>
                    {currentStep >= 4 ? (
                      <span className="text-emerald-600 font-normal lowercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        {currentStep === 4 ? 'Đang chọn' : 'Đã chọn'}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal lowercase">Chờ bước 4</span>
                    )}
                  </div>
                  {currentStep >= 4 ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-800">
                        <span>Layout:</span>
                        <span className="font-semibold text-rose-600 truncate max-w-[150px] text-right" title={selectedLayout}>
                          {selectedLayout.includes('Tùy Biến') && customLayoutText ? `Tùy Biến: ${customLayoutText}` : selectedLayout}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-800 items-center">
                        <span>Ảnh khuôn mặt:</span>
                        {faceImage ? (
                          <div className="flex items-center gap-1.5">
                            <img src={faceImage} alt="Face Avatar Preview" className="w-5 h-5 rounded-md object-cover border border-rose-300" />
                            <span className="font-semibold text-emerald-600 text-[11px]">Đã đính kèm</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Chưa tải ảnh</span>
                        )}
                      </div>
                      {bookingNotes && (
                        <div className="flex justify-between text-slate-800">
                          <span>Ghi chú:</span>
                          <span className="font-medium text-slate-600 truncate max-w-[150px] text-right italic" title={bookingNotes}>
                            "{bookingNotes}"
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-400 italic text-[11px] py-0.5">
                      Chưa chọn layout & ảnh mẫu (ở Bước 4)
                    </div>
                  )}
                </div>
              </div>

              {/* Cost breakdown */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Tiền dịch vụ:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(servicesTotal)}</span>
                </div>

                {/* Phụ phí di chuyển chỉ hiển thị từ Bước 2 trở đi nếu chọn Tại Nhà */}
                {currentStep >= 2 && locationType === 'HOME' && (
                  <div className="flex justify-between text-slate-600">
                    <span>Phụ phí di chuyển ({distanceKm} km):</span>
                    <span className={calculatedTravelFee === 0 ? "font-semibold text-emerald-600" : "font-medium text-slate-900"}>
                      {calculatedTravelFee === 0 ? '0 ₫ (Miễn phí <10km)' : `+${formatCurrency(calculatedTravelFee)}`}
                    </span>
                  </div>
                )}

                {/* Ưu đãi và phụ phí thời gian chỉ hiển thị từ Bước 3 trở đi */}
                {currentStep >= 3 && (
                  <>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                        <span>Ưu đãi Tiết Kiệm (-15%):</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    {rushFee > 0 && (
                      <div className="flex justify-between text-rose-600 font-semibold">
                        <span>Phụ phí điều phối cấp tốc:</span>
                        <span>+{formatCurrency(rushFee)}</span>
                      </div>
                    )}
                    {earlyFee > 0 && (
                      <div className="flex justify-between text-amber-600 font-semibold">
                        <span>Phụ phí làm sớm:</span>
                        <span>+{formatCurrency(earlyFee)}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                  <span>{currentStep === 4 ? (paymentMethod === 'AT_STUDIO' ? 'Tổng thanh toán tại Studio:' : 'Tổng chi phí đơn:') : 'Tổng tạm tính:'}</span>
                  <span className="text-base text-rose-600 font-serif">{formatCurrency(displayedTotalPrice)}</span>
                </div>
                {currentStep === 4 && paymentMethod === 'AT_STUDIO' ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      <span>Hình thức thanh toán:</span>
                      <span>Tại Studio (100%)</span>
                    </div>
                    <div className="text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded-xl border border-amber-200 leading-snug">
                      ⚠️ <strong>Lưu ý:</strong> Studio có thể hủy lịch bất cứ lúc nào theo tình trạng chuyên viên.
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    <span>Tiền cọc giữ chỗ (30%):</span>
                    <span>{formatCurrency(displayedDepositAmount)}</span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Cam kết chất lượng & hoàn cọc nếu hủy trước 24h</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* STUDIO PAYMENT CONFIRMATION MODAL */}
        {/* ======================================================== */}
        {showStudioConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5">
              <div className="text-center space-y-2 border-b border-slate-100 pb-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 font-bold flex items-center justify-center mx-auto shadow-sm">
                  <AlertTriangle className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Xác Nhận Thanh Toán Tại Studio
                </h3>
                <p className="text-xs text-slate-500">
                  Vui lòng đọc kỹ chính sách giữ lịch trước khi hoàn tất
                </p>
              </div>

              <div className="space-y-3 bg-amber-50/90 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900">
                <p className="font-bold text-amber-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Chính sách lịch hẹn không đặt cọc:</span>
                </p>
                <p className="leading-relaxed text-[11px] text-amber-800">
                  Vì không có tiền cọc giữ chỗ, <strong className="text-amber-950 underline">Studio có thể hủy lịch bất cứ lúc nào theo tình trạng chuyên viên</strong> (nếu chuyên viên có việc đột xuất hoặc studio ưu tiên cho khách đã cọc trước).
                </p>
                <div className="pt-2 border-t border-amber-200/80 flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-700">Thanh toán khi đến làm:</span>
                  <span className="font-bold text-rose-600 text-sm font-serif">{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowStudioConfirmModal(false);
                    setPaymentMethod('VNPAY');
                  }}
                  className="px-3.5 py-2.5 rounded-full border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-semibold transition-all text-center leading-tight flex items-center justify-center"
                >
                  Đổi sang Cọc VNPay (Khuyên dùng)
                </button>
                <button
                  type="button"
                  id="btn-confirm-studio-booking"
                  onClick={() => {
                    setShowStudioConfirmModal(false);
                    handleProceedBooking();
                  }}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/25 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? 'Đang tạo đơn...' : 'Tôi Đồng Ý Đặt Lịch'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VNPAY SANDBOX SIMULATION MODAL */}
        {/* ======================================================== */}
        {showVNPayModal && createdBooking && vnpayData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6">
              {/* Modal header */}
              <div className="text-center space-y-2 border-b border-slate-100 pb-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-lg shadow-md shadow-blue-500/30">
                  VNPAY
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Cổng Thanh Toán Trực Tuyến VNPay
                </h3>
                <p className="text-xs text-slate-500">
                  Mô phỏng thanh toán sandbox tiền cọc giữ lịch hẹn #BOOK-{createdBooking.id}
                </p>
              </div>

              {/* Payment Details */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã giao dịch:</span>
                  <span className="font-mono font-bold text-slate-800">{vnpayData.transactionCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tiền cọc cần thanh toán:</span>
                  <span className="text-base font-bold text-rose-600 font-serif">
                    {formatCurrency(vnpayData.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nội dung thanh toán:</span>
                  <span className="font-medium text-slate-800">Dat coc lich hen #{createdBooking.id}</span>
                </div>
              </div>

              {/* QR Code Demo */}
              <div className="text-center space-y-2 py-2">
                <div className="w-44 h-44 mx-auto bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-3 text-center">
                  <Sparkles className="w-10 h-10 text-rose-500 mb-2 animate-pulse" />
                  <p className="text-xs font-bold text-slate-700">Mã QR Thanh Toán</p>
                  <p className="text-[10px] text-slate-400">Sandbox Test Payment</p>
                </div>
                <p className="text-[11px] text-slate-500">
                  Mở ứng dụng ngân hàng hoặc ví VNPAY để quét mã thanh toán tức thì
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowVNPayModal(false);
                    navigate('/my-bookings');
                  }}
                  className="px-4 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Hủy & Xem Lịch Đặt
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVNPayPayment}
                  disabled={vnpayProcessing}
                  className="px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {vnpayProcessing ? (
                    <span>Đang xử lý...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Xác Nhận Đã Thanh Toán</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BookingPage;
