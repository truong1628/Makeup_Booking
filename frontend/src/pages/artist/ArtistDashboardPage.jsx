import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, Phone, Sparkles, CheckCircle2, 
  AlertCircle, Briefcase, DollarSign, RefreshCw, Home, Building2, Play, Check,
  XCircle, X, AlertTriangle, Send, Eye, Image as ImageIcon, Palette, ExternalLink
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
  const [detailModalShift, setDetailModalShift] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await artistService.getMyAssignments();
      setAssignments(data);
      setDetailModalShift((prev) => prev ? (data.find(d => d.itemId === prev.itemId) || null) : null);
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
        <div className="flex flex-col gap-3">
          {filteredAssignments.map((shift) => {
            const isHome = shift.locationType === 'HOME';
            const isFullyPaid = Boolean(shift.isFullyPaid || (shift.remainingToCollect !== undefined && shift.remainingToCollect <= 0));
            const remainingToCollect = shift.remainingToCollect !== undefined 
              ? shift.remainingToCollect 
              : Math.max(0, (shift.totalPrice || 0) - (shift.depositAmount || 0));

            return (
              <div
                key={shift.itemId}
                className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 p-4 transition-all shadow-md hover:shadow-purple-900/10 space-y-3"
              >
                {/* Hàng 1: Mã đơn, Trạng thái, Tên dịch vụ & Giá tiền */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      #BOOK-{shift.bookingId} (Mục #{shift.itemId})
                    </span>
                    {getStatusBadge(shift.bookingStatus)}
                    {shift.cancelStatus === 'PENDING' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                        <Clock className="w-3 h-3 animate-spin" />
                        <span>Chờ duyệt hủy</span>
                      </span>
                    )}
                    <h3 className="text-base font-bold text-white hover:text-purple-300 transition-colors">
                      {shift.serviceName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-sm sm:text-base font-bold text-rose-400">
                      {Number(shift.price || 0).toLocaleString('vi-VN')} đ
                    </span>
                    {shift.bookingStatus !== 'CANCELLED' && (
                      isFullyPaid ? (
                        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Đã đủ tiền</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          <span>Cần thu: {Number(remainingToCollect).toLocaleString('vi-VN')} đ</span>
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Hàng 2: Dải thông tin gọn gàng (Thời gian, Khách hàng, Địa điểm) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
                  {/* Thời gian */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-slate-400 text-[11px]">Thời gian:</span>
                    <span className="text-white font-semibold">{shift.bookingDate}</span>
                    <span className="text-purple-300 font-mono">({shift.startTime} - {shift.endTime})</span>
                  </div>

                  {/* Khách hàng */}
                  <div className="flex items-center gap-2 truncate">
                    {shift.customerImage ? (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(shift.customerImage)}
                        className="w-7 h-7 rounded-lg overflow-hidden border border-purple-500/40 hover:border-purple-400 shrink-0 transition-all cursor-pointer relative group"
                        title="Xem ảnh chân dung khuôn mặt khách hàng"
                      >
                        <img src={shift.customerImage} alt="Ảnh mặt khách" className="w-full h-full object-cover" />
                      </button>
                    ) : (
                      <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    )}
                    <span className="text-slate-400 text-[11px]">Khách:</span>
                    <span className="text-white font-semibold truncate">{shift.customerName || 'Khách vãng lai'}</span>
                    {shift.customerPhone && (
                      <a 
                        href={`tel:${shift.customerPhone}`} 
                        className="text-sky-300 hover:text-sky-200 hover:underline font-mono ml-auto md:ml-0"
                        title="Gọi điện cho khách hàng"
                      >
                        {shift.customerPhone}
                      </a>
                    )}
                  </div>

                  {/* Địa điểm */}
                  <div className="flex items-center gap-2 truncate">
                    {isHome ? (
                      <Home className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
                    )}
                    <span className="text-slate-400 text-[11px]">{isHome ? 'Tận nơi:' : 'Studio:'}</span>
                    <span className="text-slate-300 truncate" title={shift.address}>{shift.address}</span>
                    {isHome && shift.distanceKm > 0 && (
                      <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-mono shrink-0">
                        {shift.distanceKm}km
                      </span>
                    )}
                  </div>
                </div>

                {/* Hàng 3: Toolbar Thao tác & Nút Xem Chi Tiết */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                  <div className="text-xs">
                    {shift.cancelStatus === 'PENDING' && (
                      <span className="text-amber-400 italic">
                        ⏳ Yêu cầu xin hủy đang chờ Admin duyệt ({shift.cancelReason || 'Không ghi rõ'})
                      </span>
                    )}
                    {shift.cancelStatus !== 'PENDING' && shift.bookingStatus === 'CONFIRMED' && (
                      <span className="text-emerald-400 font-medium">✓ Sẵn sàng thực hiện</span>
                    )}
                    {shift.bookingStatus === 'IN_PROGRESS' && (
                      <span className="text-sky-400 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                        Đang thực hiện ca
                      </span>
                    )}
                    {shift.bookingStatus === 'COMPLETED' && (
                      <span className="text-slate-400 font-medium">✓ Ca đã hoàn tất</span>
                    )}
                    {shift.bookingStatus === 'CANCELLED' && (
                      <span className="text-rose-400 font-medium">✕ Ca đã bị hủy</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {/* Nút Xem chi tiết */}
                    <button
                      type="button"
                      onClick={() => setDetailModalShift(shift)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 hover:border-slate-600 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                      title="Xem chi tiết toàn bộ thông tin ca làm việc"
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      <span>Xem chi tiết</span>
                    </button>

                    {/* Nút Thu Tiền nếu chưa thanh toán đủ */}
                    {shift.bookingStatus !== 'CANCELLED' && !isFullyPaid && (
                      <button
                        type="button"
                        onClick={() => handleCollectPayment(shift.bookingId, remainingToCollect)}
                        disabled={updatingId === shift.bookingId}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        title="Xác nhận đã nhận tiền từ khách hàng"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Thu Tiền</span>
                      </button>
                    )}

                    {/* Các nút xử lý ca */}
                    {shift.bookingStatus === 'CONFIRMED' && (
                      <>
                        {shift.cancelStatus !== 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleOpenCancelModal(shift)}
                            disabled={!shift.canCancel}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                              shift.canCancel
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 cursor-pointer'
                                : 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed'
                            }`}
                            title={shift.canCancel ? 'Gửi yêu cầu xin hủy ca cho Admin duyệt' : 'Chỉ được xin hủy trước giờ làm việc ít nhất 2 tiếng'}
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Xin Hủy</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleStartShift(shift.bookingId)}
                          disabled={updatingId === shift.bookingId || shift.cancelStatus === 'PENDING'}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                          title="Bắt đầu ca làm việc"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Bắt Đầu</span>
                        </button>
                      </>
                    )}

                    {shift.bookingStatus === 'IN_PROGRESS' && (
                      isFullyPaid ? (
                        <button
                          onClick={() => handleCompleteShift(shift)}
                          disabled={updatingId === shift.bookingId}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                          title="Hoàn thành ca làm việc"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Hoàn Thành</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toast.error('⚠️ Bạn phải bấm xác nhận "Thu Tiền" từ khách hàng trước khi hoàn thành ca làm việc!')}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-not-allowed opacity-80"
                          title="Chưa thu tiền - Vui lòng bấm 'Thu Tiền' trước"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Cần Thu Tiền</span>
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
      {/* Modal Xem Chi Tiết Ca Làm Việc */}
      {detailModalShift && (() => {
        const shift = detailModalShift;
        const isHome = shift.locationType === 'HOME';
        const isFullyPaid = Boolean(shift.isFullyPaid || (shift.remainingToCollect !== undefined && shift.remainingToCollect <= 0));
        const remainingToCollect = shift.remainingToCollect !== undefined 
          ? shift.remainingToCollect 
          : Math.max(0, (shift.totalPrice || 0) - (shift.depositAmount || 0));

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in"
            onClick={() => setDetailModalShift(null)}
          >
            <div 
              className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl my-auto max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      #BOOK-{shift.bookingId} (Mục #{shift.itemId})
                    </span>
                    {getStatusBadge(shift.bookingStatus)}
                    {shift.cancelStatus === 'PENDING' && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                        Đang chờ duyệt hủy
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white">{shift.serviceName}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailModalShift(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Đóng modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Thông tin thời gian & dịch vụ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Thời Gian Thực Hiện
                  </span>
                  <div className="flex items-center gap-2.5 text-xs text-white">
                    <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Ngày: <strong>{shift.bookingDate}</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-white">
                    <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Khung giờ: <strong>{shift.startTime} - {shift.endTime}</strong> ({shift.duration} phút)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Khách Hàng
                  </span>
                  <div className="flex items-center gap-2 text-xs text-white">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center text-xs shrink-0">
                      {shift.customerName ? shift.customerName.charAt(0).toUpperCase() : 'K'}
                    </div>
                    <span className="font-semibold">{shift.customerName || 'Khách Vãng Lai'}</span>
                  </div>
                  {shift.customerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                      <a
                        href={`tel:${shift.customerPhone}`}
                        className="text-xs text-sky-400 hover:underline font-mono"
                      >
                        {shift.customerPhone} (Bấm để gọi)
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Địa điểm thực hiện */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
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
                <p className="text-xs text-slate-400 flex items-start gap-1.5 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>{shift.address}</span>
                </p>
              </div>

              {/* Yêu cầu Layout, Ghi chú & Ảnh khuôn mặt khách hàng */}
              {(shift.layout || shift.customerImage || (shift.notes && !shift.notes.includes('[HOÀN CỌC') && !shift.notes.includes('[ĐÃ HOÀN CỌC'))) && (
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5 text-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Yêu Cầu Trang Điểm & Ảnh Khuôn Mặt Khách Hàng
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      {shift.layout && (
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-purple-400 shrink-0" />
                          <span className="text-slate-300">
                            Layout / Phong cách yêu cầu: <strong className="text-white text-sm">{shift.layout}</strong>
                          </span>
                        </div>
                      )}
                      {shift.notes && !shift.notes.includes('[HOÀN CỌC') && !shift.notes.includes('[ĐÃ HOÀN CỌC') && (
                        <div className="text-slate-400 italic bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80">
                          Ghi chú của khách: "{shift.notes}"
                        </div>
                      )}
                    </div>

                    {shift.customerImage && (
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-slate-400 text-[11px]">Ảnh khuôn mặt:</span>
                        <button
                          type="button"
                          onClick={() => setPreviewImage(shift.customerImage)}
                          className="relative group w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-700 hover:border-purple-400 transition-all cursor-pointer shadow-lg"
                          title="Nhấp để xem ảnh lớn"
                        >
                          <img src={shift.customerImage} alt="Ảnh mặt khách" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-4 h-4 text-white" />
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bảng kê thanh toán & Tiền cần thu */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Chi Tiết Thanh Toán
                  </span>
                  {isFullyPaid ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Đã Thanh Toán Đủ</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                      Chưa Thu Đủ Tiền
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Đơn giá ca</span>
                    <span className="text-white font-bold">{Number(shift.price || 0).toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Tổng đơn hẹn</span>
                    <span className="text-white font-bold">{Number(shift.totalPrice || shift.price || 0).toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Đã đặt cọc</span>
                    <span className="text-white font-bold">{Number(shift.depositAmount || 0).toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Số tiền cần thu</span>
                    <span className={`font-bold ${remainingToCollect > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {Number(remainingToCollect).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                {/* Nút Thu Tiền trong modal nếu chưa thu */}
                {shift.bookingStatus !== 'CANCELLED' && !isFullyPaid && (
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/60">
                    <p className="text-xs text-amber-300/80">
                      Thợ cần thu số tiền còn lại trước khi bấm hoàn tất ca làm việc.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCollectPayment(shift.bookingId, remainingToCollect)}
                      disabled={updatingId === shift.bookingId}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Xác Nhận Đã Thu {Number(remainingToCollect).toLocaleString('vi-VN')} đ</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Thông báo Yêu Cầu Hủy Ca nếu có */}
              {shift.cancelStatus === 'PENDING' && (
                <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-amber-300 block">Yêu cầu hủy ca đang chờ Admin xét duyệt</span>
                    <p className="italic">"Lý do: {shift.cancelReason || 'Không ghi rõ'}"</p>
                    <p className="text-[11px] text-amber-400/80">Admin sẽ điều phối sang thợ khác. Trong thời gian này vui lòng sẵn sàng nếu đơn không được chấp thuận.</p>
                  </div>
                </div>
              )}

              {/* Modal Footer: Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setDetailModalShift(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Đóng
                </button>

                <div className="flex items-center gap-2">
                  {shift.bookingStatus === 'CONFIRMED' && (
                    <>
                      {shift.cancelStatus !== 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => {
                            setDetailModalShift(null);
                            handleOpenCancelModal(shift);
                          }}
                          disabled={!shift.canCancel}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            shift.canCancel
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 cursor-pointer'
                              : 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Yêu Cầu Hủy Ca</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleStartShift(shift.bookingId)}
                        disabled={updatingId === shift.bookingId || shift.cancelStatus === 'PENDING'}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
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
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Hoàn Thành Ca</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toast.error('⚠️ Bạn phải bấm xác nhận "Thu Tiền" từ khách hàng trước khi hoàn thành ca làm việc!')}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-not-allowed opacity-80"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Cần Thu Tiền Trước</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Preview Ảnh Chân Dung Khách Hàng */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span>Ảnh Khuôn Mặt / Chân Dung Khách Hàng</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-hidden rounded-2xl border border-slate-800 flex items-center justify-center bg-black">
              <img src={previewImage} alt="Face Preview" className="max-h-[68vh] w-auto object-contain" />
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              Chuyên viên trang điểm dựa vào ảnh chân dung để thẩm định tone da và chuẩn bị layout phù hợp.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistDashboardPage;
