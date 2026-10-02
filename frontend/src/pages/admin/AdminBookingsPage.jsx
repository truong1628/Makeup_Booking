import React, { useEffect, useState, useMemo } from 'react';
import { 
  Calendar, Clock, MapPin, Building2, Home, CheckCircle2, 
  Search, Filter, RefreshCw, AlertCircle, Phone, User, 
  Sparkles, XCircle, Check, Play, DollarSign,
  Landmark, Palette, Image as ImageIcon, ArrowDownLeft, Copy, ExternalLink
} from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { formatCurrency, formatTime, getStatusBadge } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'Tất Cả' },
  { key: 'REFUND_PENDING', label: 'Chờ Hoàn Cọc' },
  { key: 'PENDING_PAYMENT', label: 'Chờ Đặt Cọc' },
  { key: 'CONFIRMED', label: 'Đã Xác Nhận' },
  { key: 'IN_PROGRESS', label: 'Đang Thực Hiện' },
  { key: 'COMPLETED', label: 'Hoàn Thành' },
  { key: 'CANCELLED', label: 'Đã Hủy' },
];

const AdminBookingsPage = () => {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const handleConfirmRefund = (bookingId) => {
    if (window.confirm(`Xác nhận bạn đã chuyển khoản hoàn tiền cọc cho khách hàng của đơn #${bookingId}?`)) {
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id === bookingId) {
            const currentNotes = b.notes || '';
            const updatedNotes = currentNotes.replace('[HOÀN CỌC', '[ĐÃ HOÀN CỌC');
            return { ...b, notes: updatedNotes.includes('[ĐÃ HOÀN CỌC') ? updatedNotes : `[ĐÃ HOÀN CỌC] ${currentNotes}` };
          }
          return b;
        })
      );
      toast.success(`🎉 Đã đánh dấu hoàn tiền cọc thành công cho đơn #${bookingId}!`);
    }
  };

  const fetchBookings = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await bookingService.getAllBookings();
      setBookings(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách đơn đặt lịch:', err);
      toast.error('Không thể tải danh sách đơn đặt lịch: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    try {
      await bookingService.updateStatus(bookingId, newStatus);
      toast.success(`Cập nhật trạng thái đơn #${bookingId} thành công!`);
      // Update local state directly
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Tab filter
      if (activeTab === 'REFUND_PENDING') {
        const isRefundPending = b.status === 'CANCELLED' && b.notes && b.notes.includes('[HOÀN CỌC') && !b.notes.includes('[ĐÃ HOÀN CỌC');
        if (!isRefundPending) return false;
      } else if (activeTab !== 'ALL' && b.status !== activeTab) {
        return false;
      }
      // Date filter
      if (dateFilter && b.bookingDate !== dateFilter) {
        return false;
      }
      // Search term (ID, Customer Name, Phone, Notes)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const idMatch = b.id?.toString().includes(query);
        const nameMatch = b.customerName?.toLowerCase().includes(query);
        const phoneMatch = b.customerPhone?.toLowerCase().includes(query);
        const noteMatch = b.notes?.toLowerCase().includes(query);
        const layoutMatch = b.layout?.toLowerCase().includes(query);
        const serviceMatch = b.items?.some((item) =>
          item.serviceName?.toLowerCase().includes(query) ||
          item.artistName?.toLowerCase().includes(query)
        );
        if (!idMatch && !nameMatch && !phoneMatch && !noteMatch && !layoutMatch && !serviceMatch) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, activeTab, dateFilter, searchTerm]);

  // Count per status
  const counts = useMemo(() => {
    const map = { ALL: bookings.length };
    STATUS_FILTERS.forEach((sf) => {
      if (sf.key === 'REFUND_PENDING') {
        map[sf.key] = bookings.filter((b) => b.status === 'CANCELLED' && b.notes?.includes('[HOÀN CỌC') && !b.notes?.includes('[ĐÃ HOÀN CỌC')).length;
      } else if (sf.key !== 'ALL') {
        map[sf.key] = bookings.filter((b) => b.status === sf.key).length;
      }
    });
    return map;
  }, [bookings]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <span>Quản Lý Đơn Đặt Lịch Hẹn</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-sans font-medium">
              {bookings.length} đơn
            </span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Theo dõi, điều phối toàn bộ lịch hẹn hệ thống, chuyên viên phụ trách và duyệt trạng thái đơn.
          </p>
        </div>

        <button
          onClick={() => fetchBookings(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all duration-200 border border-slate-700 disabled:opacity-50 self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-rose-400' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_FILTERS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = counts[tab.key] || 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                    : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Date Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-800/60">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn (#1), tên khách hàng, SĐT, hoặc dịch vụ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs"
                title="Bỏ lọc ngày"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-3xl bg-slate-900/60 animate-pulse border border-slate-800/50" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Calendar className="w-6 h-6" />
          </div>
          <p className="text-white font-serif text-base font-semibold">Không tìm thấy đơn đặt lịch nào</p>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            {searchTerm || dateFilter || activeTab !== 'ALL'
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để hiển thị kết quả.'
              : 'Hệ thống hiện tại chưa có đơn đặt lịch nào.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const status = getStatusBadge(b.status);
            const isUpdating = updatingId === b.id;
            const hasRefundRequest = b.notes && b.notes.includes('[HOÀN CỌC');
            const isRefunded = b.notes && b.notes.includes('[ĐÃ HOÀN CỌC');

            return (
              <div
                key={b.id}
                className={`p-6 rounded-3xl border space-y-4 transition-all duration-200 shadow-lg shadow-black/20 ${
                  hasRefundRequest && !isRefunded
                    ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                    : isRefunded
                    ? 'bg-slate-900/80 border-emerald-500/30'
                    : 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Header card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-serif font-bold text-base text-white">Đơn #{b.id}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${status.color}`}>
                      {status.text}
                    </span>
                    {hasRefundRequest && !isRefunded && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <ArrowDownLeft className="w-3 h-3 text-amber-400" />
                        <span>Chờ Hoàn Cọc ({formatCurrency(b.depositAmount)})</span>
                      </span>
                    )}
                    {isRefunded && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Đã Hoàn Cọc</span>
                      </span>
                    )}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      Chế độ: {b.executionMode}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                      {b.locationType === 'HOME' ? 'Tại nhà' : 'Tại Studio'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-white font-medium">{b.bookingDate}</span>
                    <Clock className="w-3.5 h-3.5 text-rose-400 ml-1" />
                    <span className="text-white font-medium">{formatTime(b.bookingTime)}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1">Khách hàng:</span>
                    <p className="text-white font-semibold flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.customerName || 'Khách vãng lai'}</span>
                    </p>
                    <p className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{b.customerPhone || 'Chưa cập nhật SĐT'}</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-1">Địa điểm thực hiện:</span>
                    <p className="text-slate-200 font-medium flex items-center gap-1.5">
                      {b.locationType === 'HOME' ? (
                        <>
                          <Home className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span className="truncate">{b.address || 'Tại nhà'}</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>Tại Studio</span>
                        </>
                      )}
                    </p>
                    {b.locationType === 'HOME' && b.distanceKm && (
                      <span className="text-slate-400 text-[11px] block mt-0.5">
                        Khoảng cách: {b.distanceKm} km (Phí ship: {formatCurrency(b.travelFee)})
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-1">Tài chính & Thanh toán:</span>
                    <span className="text-rose-400 font-bold font-serif text-sm block">
                      {formatCurrency(b.totalPrice)}
                    </span>
                    {b.paymentMethod === 'CASH' ? (
                      <span className="text-amber-400 text-[11px] block mt-0.5 font-medium" title="Khách thanh toán tại studio - Studio có thể hủy lịch theo tình trạng chuyên viên">
                        🏢 Tại Studio (Chưa cọc)
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px] block mt-0.5">
                        Tiền cọc: <strong className="text-emerald-400">{formatCurrency(b.depositAmount)}</strong>
                      </span>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="flex flex-col justify-center">
                    <span className="text-slate-500 block mb-1.5">Đổi trạng thái:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {b.status !== 'CONFIRMED' && b.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'CONFIRMED')}
                          disabled={isUpdating}
                          className="px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Xác nhận</span>
                        </button>
                      )}

                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'IN_PROGRESS')}
                          disabled={isUpdating}
                          className="px-2.5 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-semibold transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          <span>Thực hiện</span>
                        </button>
                      )}

                      {(b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') && (
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'COMPLETED')}
                          disabled={isUpdating}
                          className="px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[11px] font-semibold transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Xong</span>
                        </button>
                      )}

                      {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc chắn muốn hủy đơn #${b.id}?`)) {
                              handleUpdateStatus(b.id, 'CANCELLED');
                            }
                          }}
                          disabled={isUpdating}
                          className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-semibold transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Hủy</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* THÔNG TIN YÊU CẦU HOÀN TIỀN CỌC (HƯỚNG 1) */}
                {hasRefundRequest && (
                  <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                    isRefunded 
                      ? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-200' 
                      : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                  }`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold">
                        <Landmark className={`w-4 h-4 ${isRefunded ? 'text-emerald-400' : 'text-amber-400'}`} />
                        <span className={isRefunded ? 'text-emerald-300' : 'text-amber-300'}>
                          {isRefunded 
                            ? 'ĐÃ HOÀN TRẢ TIỀN CỌC CHO KHÁCH HÀNG THÀNH CÔNG:' 
                            : `YÊU CẦU HOÀN TIỀN CỌC (${formatCurrency(b.depositAmount)}):`}
                        </span>
                      </div>

                      {!isRefunded && (
                        <button
                          type="button"
                          onClick={() => handleConfirmRefund(b.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã Chuyển Khoản Hoàn Cọc Cho Khách</span>
                        </button>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-amber-100 flex items-start sm:items-center justify-between gap-3">
                      <span className="break-all">{b.notes}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(b.notes || '');
                          toast.success('Đã sao chép thông tin STK hoàn cọc!');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 flex items-center gap-1 text-[11px]"
                        title="Sao chép thông tin"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Sao chép</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* THÔNG TIN LAYOUT MAKEUP & ẢNH CHÂN DUNG KHÁCH */}
                {(b.layout || b.customerImage || (b.notes && !b.notes.includes('[HOÀN CỌC') && !b.notes.includes('[ĐÃ HOÀN CỌC'))) && (
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {b.layout && (
                        <span className="flex items-center gap-1.5 text-rose-300 font-semibold bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/20">
                          <Palette className="w-3.5 h-3.5 text-rose-400" />
                          <span>Layout yêu cầu: <strong className="text-white">{b.layout}</strong></span>
                        </span>
                      )}
                      {b.notes && !b.notes.includes('[HOÀN CỌC') && !b.notes.includes('[ĐÃ HOÀN CỌC') && (
                        <span className="text-slate-400 italic">
                          Ghi chú: "{b.notes}"
                        </span>
                      )}
                    </div>

                    {b.customerImage && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-medium">Ảnh mặt khách:</span>
                        <button
                          type="button"
                          onClick={() => setPreviewImage(b.customerImage)}
                          className="relative group w-9 h-9 rounded-xl overflow-hidden border border-slate-700 hover:border-rose-400 transition-all cursor-pointer"
                          title="Nhấp để xem ảnh lớn"
                        >
                          <img src={b.customerImage} alt="Ảnh mặt khách" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-3.5 h-3.5 text-white" />
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Items & Artists */}
                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-500 block mb-2 font-medium">
                    Chi tiết các ca làm việc & Chuyên gia phụ trách:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {b.items?.map((item) => (
                      <div
                        key={item.id}
                        className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800/90 text-xs text-slate-300 flex items-center gap-2.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                        <span className="font-semibold text-rose-200">{item.serviceName}</span>
                        <span className="text-slate-600">|</span>
                        <span>
                          Thợ: <strong className="text-white font-medium">{item.artistName}</strong>
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {formatTime(item.startTime)} - {formatTime(item.endTime)}
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="text-rose-400 font-medium">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Preview Ảnh Chân Dung Khách Hàng */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-rose-400" />
                <span>Ảnh Khuôn Mặt / Chân Dung Khách Hàng</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-hidden rounded-2xl border border-slate-800 flex items-center justify-center bg-black">
              <img src={previewImage} alt="Face Preview" className="max-h-[68vh] w-auto object-contain" />
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              Chuyên viên makeup dựa vào ảnh chân dung để thẩm định tone da và tư vấn layout phù hợp.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingsPage;
