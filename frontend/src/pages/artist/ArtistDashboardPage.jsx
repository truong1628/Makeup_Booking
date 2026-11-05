import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, Phone, Sparkles, CheckCircle2, 
  AlertCircle, Briefcase, DollarSign, RefreshCw, Home, Building2, Play, Check,
  XCircle, X, AlertTriangle, Send
} from 'lucide-react';
import { artistService } from '../../services/artistService';
import { useToast } from '../../context/ToastContext';

const ArtistDashboardPage = () => {
  const toast = useToast();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL, TODAY, UPCOMING, COMPLETED
  const [cancelModalShift, setCancelModalShift] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await artistService.getMyAssignments();
      setAssignments(data);
    } catch (err) {
      toast.error('Không thể tải danh sách ca làm việc: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setLoading(false);
    }
  };

  const handleStartShift = async (bookingId) => {
    try {
      setUpdatingId(bookingId);
      await artistService.updateAssignmentStatus(bookingId, 'IN_PROGRESS');
      toast.success('✨ Đã bắt đầu thực hiện ca làm việc!');
      await loadAssignments();
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái ca: ' + (err.response?.data?.message || err.message || 'Lỗi kết nối'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCompleteShift = async (shift) => {
    const isPaid = Boolean(shift.isFullyPaid || (shift.remainingToCollect !== undefined && shift.remainingToCollect <= 0));
    if (!isPaid) {
      toast.error('⚠️ Bạn phải bấm xác nhận "Đã Thu Tiền" từ khách hàng trước khi hoàn thành ca làm việc!');
      return;
    }
    try {
      setUpdatingId(shift.bookingId);
      await artistService.updateAssignmentStatus(shift.bookingId, 'COMPLETED');
      toast.success('🎉 Chúc mừng bạn đã hoàn thành ca làm việc!');
      await loadAssignments();
    } catch (err) {
      toast.error('Lỗi khi hoàn thành ca: ' + (err.response?.data?.message || err.message || 'Lỗi kết nối'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCollectPayment = async (bookingId, amount) => {
    const formattedAmount = Number(amount || 0).toLocaleString('vi-VN');
    if (!window.confirm(`Xác nhận bạn đã thu đủ ${formattedAmount} đ từ khách hàng cho đơn #${bookingId}?`)) {
      return;
    }
    try {
      setUpdatingId(bookingId);
      await artistService.collectPayment(bookingId);
      toast.success(`🎉 Đã ghi nhận thu thành công ${formattedAmount} đ từ khách hàng!`);
      await loadAssignments();
    } catch (err) {
      toast.error('Lỗi khi ghi nhận thu tiền: ' + (err.response?.data?.message || err.message || 'Lỗi kết nối'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenCancelModal = (shift) => {
    setCancelModalShift(shift);
    setCancelReason('');
  };

  const handleCloseCancelModal = () => {
    setCancelModalShift(null);
    setCancelReason('');
  };

  const handleSubmitCancelRequest = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do xin hủy ca làm việc!');
      return;
    }
    try {
      setSubmittingCancel(true);
      await artistService.requestCancelAssignment(cancelModalShift.itemId, cancelReason.trim());
      toast.success('🎉 Đã gửi yêu cầu hủy ca thành công! Vui lòng chờ Admin phê duyệt và đổi thợ.');
      handleCloseCancelModal();
      await loadAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi gửi yêu cầu hủy ca');
    } finally {
      setSubmittingCancel(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filters logic
  const filteredAssignments = assignments.filter((item) => {
    if (filter === 'TODAY') {
      return item.bookingDate === todayStr;
    }
    if (filter === 'UPCOMING') {
      return item.bookingDate >= todayStr && item.bookingStatus !== 'COMPLETED' && item.bookingStatus !== 'CANCELLED';
    }
    if (filter === 'COMPLETED') {
      return item.bookingStatus === 'COMPLETED';
    }
    return true;
  });

  // Calculate statistics
  const totalShifts = assignments.length;
  const todayShifts = assignments.filter(item => item.bookingDate === todayStr).length;
  const homeShifts = assignments.filter(item => item.locationType === 'HOME').length;
  const totalRevenue = assignments
    .filter(item => item.bookingStatus !== 'CANCELLED')
    .reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã Xác Nhận
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Play className="w-3.5 h-3.5" /> Đang Thực Hiện
          </span>
        );
      case 'PENDING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Chờ Thanh Toán
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5" /> Hoàn Thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Đã Hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
            <span>Ca Làm Việc Của Tôi</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-sans font-medium">
              Chuyên Gia Trang Điểm
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Theo dõi chi tiết lịch phân công, địa chỉ khách hàng và thời gian thực hiện dịch vụ
          </p>
        </div>

        <button
          onClick={loadAssignments}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-sm font-semibold hover:bg-slate-850 transition-all self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm Mới Ca</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng số ca */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng Ca Phân Công</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-bold text-white">{totalShifts}</span>
            <span className="text-xs text-slate-500 ml-2">ca lịch</span>
          </div>
        </div>

        {/* Card 2: Ca hôm nay */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ca Hôm Nay</span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-bold text-white">{todayShifts}</span>
            <span className="text-xs text-slate-500 ml-2">lịch hẹn cần thực hiện</span>
          </div>
        </div>

        {/* Card 3: Ca tại nhà */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Dịch Vụ Tận Nơi</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-bold text-white">{homeShifts}</span>
            <span className="text-xs text-slate-500 ml-2">ca di chuyển đến khách</span>
          </div>
        </div>

        {/* Card 4: Doanh thu ca */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Giá Trị Ca Làm</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl sm:text-2xl font-bold text-emerald-400">
              {totalRevenue.toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { key: 'ALL', label: 'Tất Cả Ca (' + assignments.length + ')' },
          { key: 'TODAY', label: 'Hôm Nay (' + todayShifts + ')' },
          { key: 'UPCOMING', label: 'Sắp Diễn Ra' },
          { key: 'COMPLETED', label: 'Đã Hoàn Thành' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === tab.key
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Đang đồng bộ dữ liệu ca làm việc...</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
            <Briefcase className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Chưa có ca làm việc nào trong mục này</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Khi quản trị viên phân công ca đặt lịch cho bạn hoặc khách hàng đặt dịch vụ, các ca mới sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredAssignments.map((shift) => {
            const isHome = shift.locationType === 'HOME';
            const isFullyPaid = Boolean(shift.isFullyPaid || (shift.remainingToCollect !== undefined && shift.remainingToCollect <= 0));
            return (
              <div
                key={shift.itemId}
                className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-6 space-y-5 transition-all shadow-lg hover:shadow-purple-900/10"
              >
                {/* Header: Service Name & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono font-bold text-purple-400">
                        #BOOK-{shift.bookingId} (Mục #{shift.itemId})
                      </span>
                      {getStatusBadge(shift.bookingStatus)}
                    </div>
                    <h3 className="text-lg font-bold text-white">{shift.serviceName}</h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Đơn giá ca</span>
                    <span className="text-base font-bold text-rose-400">
                      {Number(shift.price || 0).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                {/* Date & Time Slot */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <span className="text-[11px] text-slate-500 block">Ngày thực hiện</span>
                      <span className="text-xs font-semibold text-white">{shift.bookingDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <span className="text-[11px] text-slate-500 block">Khung giờ</span>
                      <span className="text-xs font-semibold text-white">
                        {shift.startTime} - {shift.endTime} ({shift.duration} phút)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Thông Tin Khách Hàng
                  </span>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center text-xs">
                        {shift.customerName ? shift.customerName.charAt(0).toUpperCase() : 'K'}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white block">
                          {shift.customerName || 'Khách Vãng Lai'}
                        </span>
                        <span className="text-xs text-slate-400">Khách Hàng</span>
                      </div>
                    </div>

                    {shift.customerPhone && (
                      <a
                        href={`tel:${shift.customerPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 text-xs font-semibold border border-purple-500/20 transition-all"
                      >
                        <Phone className="w-3.5 h-3.5 text-purple-400" />
                        <span>{shift.customerPhone}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Location Information */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isHome ? (
                        <Home className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Building2 className="w-4 h-4 text-purple-400" />
                      )}
                      <span className="text-xs font-bold text-slate-300">
                        {isHome ? 'Trang Điểm Tận Nơi (Tại Nhà)' : 'Trang Điểm Tại Studio'}
                      </span>
                    </div>
                    {isHome && shift.distanceKm > 0 && (
                      <span className="text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
                        Cách {shift.distanceKm} km
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span>{shift.address}</span>
                  </p>
                </div>

                {/* Số tiền artist cần thu & Nút Đã Thu Tiền */}
                {shift.bookingStatus !== 'CANCELLED' && (
                  shift.isFullyPaid || (shift.remainingToCollect !== undefined && shift.remainingToCollect <= 0) ? (
                    <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs text-emerald-300 font-semibold block">Tiền cần thu: 0 đ</span>
                          <span className="text-[10px] text-emerald-400/80">Khách hàng đã thanh toán đủ đơn đặt lịch</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã Thu Tiền</span>
                      </span>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 to-slate-950/90 border border-amber-500/40 flex flex-wrap items-center justify-between gap-3 shadow-md shadow-black/20">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">Số tiền thợ cần thu:</span>
                          <span className="text-base font-bold font-sans text-amber-400 block leading-tight">
                            {Number(
                              shift.remainingToCollect !== undefined 
                                ? shift.remainingToCollect 
                                : Math.max(0, (shift.totalPrice || 0) - (shift.depositAmount || 0))
                            ).toLocaleString('vi-VN')} đ
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Tổng đơn: {Number(shift.totalPrice || shift.price || 0).toLocaleString('vi-VN')} đ 
                            {shift.depositAmount > 0 
                              ? ` · Đã cọc: ${Number(shift.depositAmount).toLocaleString('vi-VN')} đ` 
                              : ' · Chưa cọc'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCollectPayment(
                          shift.bookingId, 
                          shift.remainingToCollect !== undefined 
                            ? shift.remainingToCollect 
                            : Math.max(0, (shift.totalPrice || 0) - (shift.depositAmount || 0))
                        )}
                        disabled={updatingId === shift.bookingId}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        title="Xác nhận đã nhận tiền từ khách"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã Thu Tiền</span>
                      </button>
                    </div>
                  )
                )}

                {/* Thông báo trạng thái Yêu cầu hủy ca */}
                {shift.cancelStatus === 'PENDING' && (
                  <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5 shadow-inner">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-300">Yêu cầu hủy ca đang chờ Admin duyệt</span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono">ĐANG XỬ LÝ</span>
                      </div>
                      <p className="text-amber-200/90 text-xs italic">
                        "Lý do: {shift.cancelReason || 'Không ghi rõ'}"
                      </p>
                      <p className="text-[11px] text-amber-400/80">
                        Admin sẽ xem xét và điều phối sang thợ khác. Trong thời gian này, bạn vui lòng sẵn sàng nếu đơn không được chấp thuận.
                      </p>
                    </div>
                  </div>
                )}

                {shift.cancelStatus === 'REJECTED' && (
                  <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-rose-300">Admin đã từ chối yêu cầu hủy ca này</span>
                      <span className="text-[11px] text-rose-300/80">
                        Vui lòng đến và thực hiện dịch vụ đúng khung giờ đã hẹn với khách hàng.
                      </span>
                    </div>
                  </div>
                )}

                {/* Thao tác ca làm việc dành cho Chuyên gia */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs">
                    {shift.bookingStatus === 'CONFIRMED' && (
                      <span className="text-emerald-400 font-medium">✓ Đã xác nhận - Sẵn sàng thực hiện</span>
                    )}
                    {shift.bookingStatus === 'IN_PROGRESS' && (
                      isFullyPaid ? (
                        <span className="text-sky-400 font-medium animate-pulse flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-sky-400" />
                          Đã thu tiền · Sẵn sàng hoàn tất ca
                        </span>
                      ) : (
                        <span className="text-amber-400 font-medium flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          Phải thu tiền trước khi hoàn thành ca
                        </span>
                      )
                    )}
                    {shift.bookingStatus === 'COMPLETED' && (
                      <span className="text-slate-400 font-medium">Ca đã hoàn tất</span>
                    )}
                    {shift.bookingStatus === 'CANCELLED' && (
                      <span className="text-rose-400 font-medium">Ca đã bị hủy</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {shift.bookingStatus === 'CONFIRMED' && (
                      <>
                        {shift.cancelStatus === 'PENDING' ? (
                          <span className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            <span>Chờ Duyệt Hủy</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenCancelModal(shift)}
                            disabled={!shift.canCancel}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              shift.canCancel
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50'
                                : 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed'
                            }`}
                            title={shift.canCancel ? 'Gửi yêu cầu xin hủy ca cho Admin duyệt' : 'Chỉ được xin hủy trước giờ làm việc ít nhất 2 tiếng'}
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Yêu Cầu Hủy Ca</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleStartShift(shift.bookingId)}
                          disabled={updatingId === shift.bookingId || shift.cancelStatus === 'PENDING'}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                          title="Bắt đầu ca làm việc"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Bắt Đầu Thực Hiện</span>
                        </button>
                      </>
                    )}

                    {shift.bookingStatus === 'IN_PROGRESS' && (
                      isFullyPaid ? (
                        <button
                          onClick={() => handleCompleteShift(shift)}
                          disabled={updatingId === shift.bookingId}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-95"
                          title="Hoàn thành ca làm việc"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Hoàn Thành Ca</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toast.error('⚠️ Bạn phải bấm xác nhận "Đã Thu Tiền" từ khách hàng trước khi hoàn thành ca làm việc!')}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-not-allowed opacity-80"
                          title="Chưa thu tiền - Vui lòng bấm 'Đã Thu Tiền' phía trên trước"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Cần Thu Tiền Trước</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Yêu Cầu Hủy Ca */}
      {cancelModalShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Yêu Cầu Hủy Ca Làm Việc</h3>
                  <p className="text-xs text-slate-400">Gửi đơn xin hủy ca để Quản trị viên duyệt và chuyển giao thợ khác</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseCancelModal}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Dịch vụ:</span>
                <span className="font-bold text-white">{cancelModalShift.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thời gian:</span>
                <span className="font-bold text-rose-300">{cancelModalShift.bookingDate} ({cancelModalShift.startTime} - {cancelModalShift.endTime})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Khách hàng:</span>
                <span className="font-medium text-white">{cancelModalShift.customerName || 'Khách vãng lai'} ({cancelModalShift.customerPhone})</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-amber-200">Quy định hủy ca:</span>
                <span>Bạn chỉ được gửi yêu cầu hủy trước giờ bắt đầu làm việc ít nhất 2 tiếng. Sau khi gửi, đơn sẽ được Admin duyệt và đổi sang thợ khác nhận ca.</span>
              </div>
            </div>

            <form onSubmit={handleSubmitCancelRequest} noValidate className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Lý do xin hủy ca <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Vd: Tôi bị sốt đột xuất, có sự cố khẩn cấp không thể đến ca..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 resize-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseCancelModal}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel || !cancelReason.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingCancel ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang Gửi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Gửi Yêu Cầu Hủy</span>
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

export default ArtistDashboardPage;
