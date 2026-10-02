import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, Building2, Home, Sparkles, 
  AlertCircle, ChevronRight, ChevronDown, ChevronUp, CheckCircle2, CreditCard, Star, 
  MessageSquare, RefreshCw, X, User, Heart, AlertTriangle,
  Palette, Image as ImageIcon, Eye, EyeOff, Landmark, ArrowDownLeft
} from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { formatCurrency, formatDate, formatTime, getStatusBadge } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const POPULAR_BANKS = [
  'Vietcombank',
  'MB Bank (Quân Đội)',
  'Techcombank',
  'BIDV',
  'VietinBank',
  'Agribank',
  'TPBank',
  'VPBank',
  'ACB',
  'VIB',
  'HDBank',
  'Sacombank',
  'MSB',
  'OCB',
  'Khác (Nhập tên ngân hàng)',
];

const MyBookingsPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING_PAYMENT, CONFIRMED, COMPLETED, CANCELLED

  // Expand / collapse state for booking details
  const [expandedBookingIds, setExpandedBookingIds] = useState(new Set());

  const toggleExpand = (id) => {
    setExpandedBookingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Retry VNPay Payment state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBookingForPay, setSelectedBookingForPay] = useState(null);
  const [vnpayData, setVnpayData] = useState(null);
  const [paying, setPaying] = useState(false);

  // Cancel Booking state & Refund Form
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('Thay đổi kế hoạch cá nhân');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [bankName, setBankName] = useState('Vietcombank');
  const [customBankName, setCustomBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewsMap, setReviewsMap] = useState({}); // bookingId -> review object

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await bookingService.getMyBookings();
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      // Sắp xếp lịch đặt mới nhất lên đầu (theo createdAt hoặc id giảm dần)
      list.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return (b.id || 0) - (a.id || 0);
      });
      setBookings(list);

      // Fetch reviews for completed bookings
      const completedList = list.filter((b) => b.status === 'COMPLETED');
      if (completedList.length > 0) {
        const reviewPromises = completedList.map(async (b) => {
          try {
            const reviewRes = await bookingService.getBookingReview(b.id);
            return { bookingId: b.id, review: reviewRes };
          } catch {
            return { bookingId: b.id, review: null };
          }
        });
        const reviewResults = await Promise.all(reviewPromises);
        const map = {};
        reviewResults.forEach(({ bookingId, review }) => {
          if (review) map[bookingId] = review;
        });
        setReviewsMap(map);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải lịch sử đặt lịch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Handle Retry VNPay Payment
  const handleOpenPaymentModal = async (booking) => {
    setSelectedBookingForPay(booking);
    try {
      const res = await bookingService.createVNPayUrl(booking.id);
      setVnpayData(res);
      setPaymentModalOpen(true);
    } catch (err) {
      toast.error('Không thể tạo cổng thanh toán: ' + (err.message || 'Lỗi hệ thống'));
    }
  };

  const handleConfirmRetryPayment = async () => {
    if (!selectedBookingForPay || !vnpayData) return;
    try {
      setPaying(true);
      await bookingService.confirmVNPay(selectedBookingForPay.id, vnpayData.transactionCode);
      toast.success(`✨ Thanh toán tiền cọc thành công cho đơn #${selectedBookingForPay.id}!`);
      setPaymentModalOpen(false);
      fetchBookings();
    } catch (err) {
      toast.error('Lỗi khi thanh toán: ' + (err.message || 'Thất bại'));
    } finally {
      setPaying(false);
    }
  };

  // Handle Cancel Booking
  const handleOpenCancelModal = (booking) => {
    setSelectedBookingForCancel(booking);
    setCancelReason('Thay đổi kế hoạch cá nhân');
    setCustomCancelReason('');
    setBankName('Vietcombank');
    setCustomBankName('');
    setBankAccount('');
    setAccountHolder(user?.fullName || '');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBookingForCancel) return;

    const isDeposited = selectedBookingForCancel.paymentStatus === 'PAID' || 
      (selectedBookingForCancel.depositAmount > 0 && selectedBookingForCancel.paymentMethod !== 'CASH' && selectedBookingForCancel.status !== 'PENDING_PAYMENT');

    const baseReason = cancelReason === 'Khác' ? (customCancelReason.trim() || 'Lý do khác') : cancelReason;
    let fullReason = baseReason;

    if (isDeposited) {
      if (!bankAccount.trim()) {
        toast.error('Vui lòng nhập Số tài khoản ngân hàng để nhận lại tiền cọc');
        return;
      }
      if (!accountHolder.trim()) {
        toast.error('Vui lòng nhập Tên chủ tài khoản ngân hàng');
        return;
      }
      const finalBankName = bankName.includes('Khác') ? (customBankName.trim() || 'Ngân hàng khác') : bankName;
      fullReason = `[HOÀN CỌC ${formatCurrency(selectedBookingForCancel.depositAmount)}] Ngân hàng: ${finalBankName} - STK: ${bankAccount.trim()} - Chủ TK: ${accountHolder.trim().toUpperCase()} - Lý do: ${baseReason}`;
    }

    try {
      setCancelling(true);
      await bookingService.cancelBooking(selectedBookingForCancel.id, fullReason);
      if (isDeposited) {
        toast.success(`🎉 Đã gửi yêu cầu hủy và hoàn cọc cho đơn #${selectedBookingForCancel.id}! CSKH sẽ liên hệ và chuyển tiền hoàn cọc trong 24h.`);
      } else {
        toast.success(`Đã hủy lịch hẹn #${selectedBookingForCancel.id} thành công!`);
      }
      setCancelModalOpen(false);
      fetchBookings();
    } catch (err) {
      toast.error('Lỗi khi hủy lịch hẹn: ' + (err.message || 'Thất bại'));
    } finally {
      setCancelling(false);
    }
  };

  // Handle Review
  const handleOpenReviewModal = (booking) => {
    setSelectedBookingForReview(booking);
    const existing = reviewsMap[booking.id];
    if (existing) {
      setReviewRating(existing.rating || 5);
      setReviewComment(existing.comment || '');
    } else {
      setReviewRating(5);
      setReviewComment('');
    }
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedBookingForReview) return;
    try {
      setSubmittingReview(true);
      const res = await bookingService.submitReview(
        selectedBookingForReview.id,
        reviewRating,
        reviewComment
      );
      toast.success('🎉 Cảm ơn bạn đã gửi đánh giá dịch vụ!');
      setReviewsMap((prev) => ({ ...prev, [selectedBookingForReview.id]: res }));
      setReviewModalOpen(false);
    } catch (err) {
      toast.error('Lỗi khi gửi đánh giá: ' + (err.message || 'Thất bại'));
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filter list
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ALL') return true;
    return b.status === activeTab;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-rose-600 uppercase bg-rose-50 px-3.5 py-1 rounded-full border border-rose-100">
            Quản Lý Cá Nhân
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
            Lịch Hẹn Của Tôi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi trạng thái lịch hẹn, phong cách makeup (layout), thanh toán cọc, hoàn tiền cọc và đánh giá chất lượng phục vụ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchBookings}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-xs"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/booking"
            className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Đặt Lịch Mới</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 border-b border-slate-100 no-scrollbar">
        {[
          { key: 'ALL', label: 'Tất Cả Lịch Hẹn' },
          { key: 'PENDING_PAYMENT', label: 'Chờ Thanh Toán Cọc' },
          { key: 'CONFIRMED', label: 'Đã Xác Nhận' },
          { key: 'COMPLETED', label: 'Đã Hoàn Thành' },
          { key: 'CANCELLED', label: 'Đã Hủy' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-rose-600 text-white shadow-xs shadow-rose-500/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 rounded-3xl bg-slate-200/70 animate-pulse" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Chưa có lịch hẹn trong mục này</h3>
          <p className="text-xs text-slate-500">
            Khám phá các phong cách trang điểm thời thượng và đặt lịch ngay để được phục vụ tốt nhất!
          </p>
          <Link
            to="/booking"
            className="inline-block px-6 py-2.5 rounded-full bg-rose-600 text-white font-semibold text-xs shadow-md hover:bg-rose-700 transition-all"
          >
            Đặt Lịch Ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredBookings.map((booking) => {
            const statusInfo = getStatusBadge(booking.status);
            const isPendingPayment = booking.status === 'PENDING_PAYMENT';
            const isCompleted = booking.status === 'COMPLETED';
            const isConfirmed = booking.status === 'CONFIRMED';
            const isCancelled = booking.status === 'CANCELLED';
            const canCancel = isPendingPayment || isConfirmed;
            const hasRefundRequest = isCancelled && booking.notes && booking.notes.includes('[HOÀN CỌC');
            const existingReview = reviewsMap[booking.id];
            const isExpanded = expandedBookingIds.has(booking.id);

            const firstServiceName = booking.items?.[0]?.serviceName || 'Dịch vụ trang điểm';
            const moreServicesCount = (booking.items?.length || 0) - 1;

            return (
              <div
                key={booking.id}
                className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                  isExpanded
                    ? 'border-rose-300 shadow-md ring-1 ring-rose-500/10'
                    : 'border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {/* ======================================================== */}
                {/* 1. COMPACT CARD VIEW (LUÔN HIỂN THỊ TÓM TẮT GỌN GÀNG) */}
                {/* ======================================================== */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Row 1: Header - ID, Status, Execution Mode, Location & Datetime */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                      <span className="font-serif font-bold text-base sm:text-lg text-slate-900">
                        Đơn Hẹn #{booking.id}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                      {hasRefundRequest && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <ArrowDownLeft className="w-3 h-3 text-amber-600" />
                          <span>Chờ Hoàn Cọc ({formatCurrency(booking.depositAmount)})</span>
                        </span>
                      )}
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {booking.executionMode === 'PARALLEL' ? 'Làm song song' : 'Làm lần lượt'}
                      </span>
                      {booking.locationType === 'HOME' ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium flex items-center gap-1">
                          <Home className="w-3 h-3 text-amber-600" />
                          <span>Tại Nhà</span>
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-rose-600" />
                          <span>Tại Studio</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-3 sm:gap-4 shrink-0">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-rose-500" />
                        <span>{booking.bookingDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        <span>{formatTime(booking.bookingTime)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Tóm tắt dịch vụ, Layout & Giá tiền */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {firstServiceName}
                        </span>
                        {moreServicesCount > 0 && (
                          <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 shrink-0">
                            +{moreServicesCount} dịch vụ khác
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {booking.layout && (
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            <Palette className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>Layout: <strong className="text-rose-600 font-semibold">{booking.layout}</strong></span>
                          </span>
                        )}
                        {booking.customerImage && (
                          <span className="flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Có ảnh chân dung</span>
                          </span>
                        )}
                        {booking.notes && !booking.notes.includes('[HOÀN CỌC') && (
                          <span className="italic truncate max-w-xs text-slate-500 text-[11px]">
                            "{booking.notes}"
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Tổng thanh toán</span>
                        <span className="text-base sm:text-lg font-bold text-slate-900 font-serif">
                          {formatCurrency(booking.totalPrice)}
                        </span>
                      </div>
                      {booking.paymentMethod === 'CASH' ? (
                        <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                          Thanh toán Studio
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                          Cọc: {formatCurrency(booking.depositAmount)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Alert nếu có yêu cầu hoàn tiền cọc */}
                  {hasRefundRequest && (
                    <div className="flex items-start sm:items-center gap-2.5 p-3 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-900 animate-in fade-in">
                      <Landmark className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-amber-800">Yêu cầu hoàn tiền cọc ({formatCurrency(booking.depositAmount)}): </span>
                        <span className="text-amber-800/90 text-[11px] font-mono break-all">{booking.notes}</span>
                        <p className="text-[10px] text-amber-600 mt-0.5">CSKH của Studio sẽ đối soát thông tin tài khoản và chuyển khoản hoàn cọc trong 24h.</p>
                      </div>
                    </div>
                  )}

                  {/* Row 3: Action Buttons & Toggle "Xem Chi Tiết" Button */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    {/* Button Xem Chi Tiết / Thu Gọn */}
                    <button
                      type="button"
                      id={`btn-toggle-detail-${booking.id}`}
                      onClick={() => toggleExpand(booking.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                        isExpanded
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {isExpanded ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                          <span>Thu Gọn Chi Tiết</span>
                          <ChevronUp className="w-3.5 h-3.5 ml-0.5 text-rose-600" />
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-rose-500" />
                          <span>Xem Chi Tiết</span>
                          <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-slate-400" />
                        </>
                      )}
                    </button>

                    {/* Quick Actions (Thanh toán cọc / Hủy lịch / Review / Nâng cấp cọc) */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Nút Hủy Lịch Hẹn */}
                      {canCancel && (
                        <button
                          type="button"
                          id={`btn-cancel-booking-${booking.id}`}
                          onClick={() => handleOpenCancelModal(booking)}
                          className="py-2 px-3.5 rounded-xl border border-red-200 hover:border-red-300 bg-white hover:bg-red-50 text-red-600 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
                          title="Hủy lịch hẹn này"
                        >
                          <X className="w-3.5 h-3.5 text-red-500" />
                          <span>Hủy Lịch</span>
                        </button>
                      )}

                      {booking.paymentMethod === 'CASH' && booking.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          id={`btn-upgrade-deposit-${booking.id}`}
                          onClick={() => handleOpenPaymentModal(booking)}
                          className="py-2 px-3 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-rose-600" />
                          <span>Cọc VNPay (30%) giữ chỗ</span>
                        </button>
                      )}

                      {isPendingPayment && (
                        <button
                          type="button"
                          id={`btn-pay-deposit-${booking.id}`}
                          onClick={() => handleOpenPaymentModal(booking)}
                          className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Thanh Toán Cọc Ngay</span>
                        </button>
                      )}

                      {isCompleted && (
                        <button
                          type="button"
                          id={`btn-review-${booking.id}`}
                          onClick={() => handleOpenReviewModal(booking)}
                          className="py-2 px-3.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                          <span>{existingReview ? 'Sửa Đánh Giá' : 'Đánh Giá Dịch Vụ'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* 2. FULL EXPANDED DETAILS (CHỈ HIỆN KHI BẤM XEM CHI TIẾT) */}
                {/* ======================================================== */}
                {isExpanded && (
                  <div className="border-t border-dashed border-slate-200 bg-slate-50/50 p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                      <span className="text-xs uppercase font-bold tracking-wider text-rose-600 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Toàn Bộ Thông Tin Chi Tiết Của Đơn #{booking.id}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleExpand(booking.id)}
                        className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium"
                      >
                        <span>Thu gọn lại</span>
                        <ChevronUp className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: Services list (8 cols) */}
                      <div className="lg:col-span-8 space-y-4">
                        {/* Thông báo nếu đang chờ hoàn cọc */}
                        {hasRefundRequest && (
                          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-xs text-amber-900 animate-in fade-in">
                            <div className="flex items-center gap-2 font-bold text-amber-800">
                              <Landmark className="w-4 h-4 text-amber-600" />
                              <span>Thông tin yêu cầu hoàn tiền cọc ({formatCurrency(booking.depositAmount)}):</span>
                            </div>
                            <p className="text-amber-800 bg-white/80 p-2.5 rounded-xl border border-amber-200 font-medium">
                              {booking.notes}
                            </p>
                            <p className="text-[11px] text-amber-700">
                              Bộ phận CSKH của Studio sẽ đối soát thông tin tài khoản và chuyển khoản hoàn trả cọc cho bạn trong vòng 24h làm việc.
                            </p>
                          </div>
                        )}

                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Danh Sách Dịch Vụ Chi Tiết ({booking.items?.length || 0})
                        </p>
                        <div className="space-y-2.5">
                          {booking.items?.map((item) => (
                            <div
                              key={item.id}
                              className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div>
                                <p className="font-semibold text-sm text-slate-900">{item.serviceName}</p>
                                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span>
                                    Chuyên gia: <strong className="text-purple-700 font-semibold">{item.artistName || 'Chuyên gia Studio'}</strong>
                                  </span>
                                  <span>•</span>
                                  <span>Ca: {formatTime(item.startTime)} - {formatTime(item.endTime)}</span>
                                </p>
                              </div>
                              <span className="text-sm font-bold text-slate-800 font-serif">
                                {formatCurrency(item.price)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Customer Layout & Image & Notes Info */}
                        {(booking.layout || booking.customerImage || (booking.notes && !booking.notes.includes('[HOÀN CỌC'))) && (
                          <div className="p-4 rounded-2xl bg-white border border-rose-200/90 shadow-2xs flex flex-col sm:flex-row items-start gap-4 text-xs">
                            {booking.customerImage && (
                              <div className="shrink-0 flex flex-col items-center gap-1.5">
                                <img
                                  src={booking.customerImage}
                                  alt="Ảnh khuôn mặt khách hàng"
                                  className="w-20 h-20 rounded-2xl object-cover border-2 border-rose-300 shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(booking.customerImage, '_blank')}
                                  title="Nhấn để xem ảnh chân dung đầy đủ"
                                />
                                <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                                  Ảnh khuôn mặt
                                </span>
                              </div>
                            )}
                            <div className="space-y-2 min-w-0">
                              {booking.layout && (
                                <p className="text-slate-800 text-sm">
                                  <strong className="text-rose-700">Phong cách makeup (Layout):</strong>{' '}
                                  <span className="font-bold text-slate-900">{booking.layout}</span>
                                </p>
                              )}
                              {booking.notes && !booking.notes.includes('[HOÀN CỌC') && (
                                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                                  <strong className="text-purple-800 block text-[11px] uppercase tracking-wider mb-0.5">Ghi chú riêng về da & tóc:</strong>
                                  <span className="italic text-slate-700">"{booking.notes}"</span>
                                </p>
                              )}
                              <p className="text-[11px] text-slate-400">
                                Chuyên gia makeup sẽ dựa vào layout và ảnh khuôn mặt này để chuẩn bị trước mỹ phẩm và kỹ thuật phù hợp nhất.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Existing Review Badge if available */}
                        {existingReview && (
                          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                <span>Đánh giá của bạn: {existingReview.rating} / 5 sao</span>
                              </span>
                              <span className="text-[11px] text-amber-700 font-semibold bg-white px-2 py-0.5 rounded-md border border-amber-200">
                                Đã phản hồi
                              </span>
                            </div>
                            {existingReview.comment && (
                              <p className="text-xs text-slate-700 italic bg-white/80 p-2.5 rounded-xl border border-amber-100">
                                "{existingReview.comment}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Location & Payment Breakdown (4 cols) */}
                      <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5 text-xs">
                        <div>
                          <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Địa Điểm Thực Hiện</p>
                          <div className="flex items-start gap-2 mt-1.5 text-slate-800 font-medium">
                            {booking.locationType === 'HOME' ? (
                              <>
                                <Home className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <span>Tại Nhà: {booking.address} ({booking.distanceKm} km)</span>
                              </>
                            ) : (
                              <>
                                <Building2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                <span>Tại Studio MNM (204 Trần Duy Hưng, Cầu Giấy, Hà Nội)</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 space-y-2">
                          <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Chi Tiết Thanh Toán</p>
                          {booking.travelFee > 0 && (
                            <div className="flex justify-between text-slate-600">
                              <span>Phí di chuyển:</span>
                              <span className="font-medium text-slate-900">{formatCurrency(booking.travelFee)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-slate-900 text-sm pt-1">
                            <span>Tổng chi phí:</span>
                            <span className="font-serif text-rose-600 text-base">{formatCurrency(booking.totalPrice)}</span>
                          </div>

                          {booking.paymentMethod === 'CASH' ? (
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              <div className="flex justify-between font-semibold text-amber-800">
                                <span>Hình thức:</span>
                                <span>Tại Studio (100%)</span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-snug">
                                ⚠️ <strong>Lưu ý:</strong> Đơn thanh toán tại quầy có thể bị hủy nếu studio quá tải. Khách hàng nên cọc trước qua VNPay để được cam kết phục vụ.
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5 pt-2 border-t border-slate-100">
                              <div className="flex justify-between font-semibold text-emerald-700">
                                <span>Tiền cọc đã thanh toán (30%):</span>
                                <span className="font-serif font-bold">{formatCurrency(booking.depositAmount)}</span>
                              </div>
                              <div className="flex justify-between text-slate-500 text-[11px]">
                                <span>Còn lại sau dịch vụ (70%):</span>
                                <span className="font-serif font-medium">{formatCurrency(booking.totalPrice - booking.depositAmount)}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Nút hủy lịch bổ sung trong phần chi tiết */}
                        {canCancel && (
                          <div className="pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleOpenCancelModal(booking)}
                              className="w-full py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Hủy Đơn Đặt Lịch Này</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* RETRY VNPAY PAYMENT MODAL */}
      {/* ======================================================== */}
      {paymentModalOpen && selectedBookingForPay && vnpayData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  VNPAY
                </div>
                <h3 className="font-bold text-lg text-slate-900">
                  Thanh Toán Cọc Đơn #{selectedBookingForPay.id}
                </h3>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã GD:</span>
                <span className="font-mono font-bold text-slate-800">{vnpayData.transactionCode}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-semibold">Tiền cọc (30%):</span>
                <span className="font-bold text-rose-600 font-serif">
                  {formatCurrency(vnpayData.amount)}
                </span>
              </div>
            </div>

            <div className="text-center space-y-2 py-1">
              <div className="w-36 h-36 mx-auto rounded-2xl border-2 border-dashed border-blue-300 p-2 flex items-center justify-center bg-white shadow-xs">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(vnpayData.paymentUrl)}`}
                  alt="VNPay QR"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Quét mã VNPAY-QR bằng ứng dụng ngân hàng của bạn
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                id="btn-confirm-retry-pay"
                disabled={paying}
                onClick={handleConfirmRetryPayment}
                className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                {paying ? (
                  <span>Đang xác nhận kết quả...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác Nhận Đã Thanh Toán Qua VNPay</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-600"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CANCEL & REFUND BOOKING MODAL */}
      {/* ======================================================== */}
      {cancelModalOpen && selectedBookingForCancel && (() => {
        const isDeposited = selectedBookingForCancel.paymentStatus === 'PAID' || 
          (selectedBookingForCancel.depositAmount > 0 && selectedBookingForCancel.paymentMethod !== 'CASH' && selectedBookingForCancel.status !== 'PENDING_PAYMENT');

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isDeposited ? 'bg-amber-100 text-amber-700' : 'bg-red-50 text-red-600'
                  }`}>
                    {isDeposited ? <Landmark className="w-5 h-5 text-amber-600" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900">
                      {isDeposited ? 'Hủy Lịch Hẹn & Đăng Ký Hoàn Cọc' : 'Xác Nhận Hủy Lịch Hẹn'}
                    </h3>
                    <p className="text-[11px] text-slate-400">Đơn #{selectedBookingForCancel.id} · Ngày {selectedBookingForCancel.bookingDate}</p>
                  </div>
                </div>
                <button
                  onClick={() => setCancelModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Thông báo chính sách cọc */}
              {isDeposited ? (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-2 text-amber-900">
                  <div className="flex items-center justify-between font-bold text-amber-800 text-sm">
                    <span>Số tiền cọc cần hoàn trả:</span>
                    <span className="font-serif text-base text-rose-600">{formatCurrency(selectedBookingForCancel.depositAmount)}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    💡 <strong>Chính sách hoàn cọc:</strong> Do đơn hẹn đã thanh toán cọc thành công, quý khách vui lòng nhập chính xác thông tin tài khoản ngân hàng bên dưới. Nhân viên CSKH của Studio sẽ liên hệ xác nhận và <strong>chuyển khoản hoàn tiền cọc trong vòng 24 giờ làm việc</strong>.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  Đơn hẹn này chưa cọc hoặc thanh toán tại quầy. Sau khi hủy, khung giờ sẽ được giải phóng cho khách hàng khác.
                </div>
              )}

              {/* Form thông tin ngân hàng hoàn cọc (nếu đã cọc) */}
              {isDeposited && (
                <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50/70 border border-slate-200 text-xs">
                  <p className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-rose-600" />
                    <span>Thông Tin Tài Khoản Nhận Lại Tiền Cọc</span>
                  </p>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-600">Ngân Hàng Thụ Hưởng *</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {bankName.includes('Khác') && (
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600">Tên Ngân Hàng Của Bạn *</label>
                      <input
                        type="text"
                        value={customBankName}
                        onChange={(e) => setCustomBankName(e.target.value)}
                        placeholder="Nhập tên ngân hàng..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600">Số Tài Khoản (STK) *</label>
                      <input
                        type="text"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value.replace(/\s+/g, ''))}
                        placeholder="Ví dụ: 1029384756..."
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600">Tên Chủ Tài Khoản *</label>
                      <input
                        type="text"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                        placeholder="NGUYEN VAN A"
                        className="w-full px-3 py-2 text-xs uppercase font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Lý do hủy lịch */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Lý do bạn muốn hủy lịch:
                </label>
                <div className="space-y-1.5">
                  {[
                    'Thay đổi kế hoạch cá nhân',
                    'Đổi ngày hoặc giờ sự kiện',
                    'Bận việc gia đình đột xuất',
                    'Đã tìm được phương án khác',
                    'Khác',
                  ].map((reason) => (
                    <label
                      key={reason}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                        cancelReason === reason
                          ? 'border-rose-500 bg-rose-50/40 text-rose-900 font-semibold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        value={reason}
                        checked={cancelReason === reason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>

                {cancelReason === 'Khác' && (
                  <textarea
                    rows={2}
                    value={customCancelReason}
                    onChange={(e) => setCustomCancelReason(e.target.value)}
                    placeholder="Nhập lý do cụ thể..."
                    className="w-full mt-2 p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-confirm-cancel-booking"
                  disabled={cancelling}
                  onClick={handleConfirmCancel}
                  className="w-full py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {cancelling ? (
                    <span>Đang xử lý hủy lịch...</span>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      <span>{isDeposited ? 'Xác Nhận Hủy Lịch & Đăng Ký Hoàn Cọc' : 'Xác Nhận Hủy Lịch Ngay'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-700 font-semibold"
                >
                  Giữ Lại Lịch Hẹn
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* REVIEW & RATING MODAL */}
      {/* ======================================================== */}
      {reviewModalOpen && selectedBookingForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    Đánh Giá Dịch Vụ
                  </h3>
                  <p className="text-[11px] text-slate-400">Đơn lịch hẹn #{selectedBookingForReview.id}</p>
                </div>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star rating selector */}
              <div className="text-center space-y-2 py-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mức độ hài lòng của bạn
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1.5 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-semibold text-amber-700">
                  {reviewRating === 5 && '🌟 Tuyệt vời! Rất hài lòng'}
                  {reviewRating === 4 && '✨ Dịch vụ rất tốt'}
                  {reviewRating === 3 && '👍 Khá ổn'}
                  {reviewRating === 2 && '😐 Cần cải thiện'}
                  {reviewRating === 1 && '👎 Chưa hài lòng'}
                </p>
              </div>

              {/* Comment text */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nhận xét & cảm nhận của bạn về chuyên viên
                </label>
                <textarea
                  rows={4}
                  required
                  id="textarea-review-comment"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Ví dụ: Chuyên viên tay nghề rất khéo, layout tự nhiên và bền màu suốt cả buổi tiệc..."
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  id="btn-submit-review"
                  disabled={submittingReview}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs shadow-md shadow-amber-500/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingReview ? (
                    <span>Đang gửi đánh giá...</span>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 fill-white" />
                      <span>Gửi Đánh Giá</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
