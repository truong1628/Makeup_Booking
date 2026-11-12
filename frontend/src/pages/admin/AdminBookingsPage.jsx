import React, { useEffect, useState, useMemo } from 'react';
import { 
  Calendar, Clock, Building2, Home, CheckCircle2, 
  Search, RefreshCw, AlertCircle, Phone, User, 
  Sparkles, XCircle, Check, DollarSign,
  Landmark, Image as ImageIcon, ArrowDownLeft, Copy, ExternalLink,
  Eye, X, ArrowRightLeft, ArrowUpDown, Palette, AlertTriangle
} from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { formatCurrency, formatTime, getStatusBadge, formatExecutionMode } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

// Kiểm tra đơn đã quá thời gian hẹn nhưng chưa hoàn thành (và chưa bị hủy)
export const isBookingOverdue = (b) => {
  if (!b || !b.bookingDate) return false;

  const isCancelled =
    b.status === 'CANCELLED' ||
    Boolean(
      b.notes &&
        (b.notes.includes('[Lý do hủy') ||
          b.notes.includes('[HOÀN CỌC') ||
          b.notes.includes('[ĐÃ HOÀN CỌC'))
    );
  const effectiveStatus = isCancelled ? 'CANCELLED' : b.status;
  if (effectiveStatus === 'COMPLETED' || effectiveStatus === 'CANCELLED') {
    return false;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // Nếu ngày hẹn đã trôi qua trước hôm nay
  if (b.bookingDate < todayStr) {
    return true;
  }
  // Nếu ngày hẹn ở tương lai
  if (b.bookingDate > todayStr) {
    return false;
  }

  // Nếu ngày hẹn là hôm nay: kiểm tra giờ kết thúc (hoặc giờ hẹn + 2 tiếng)
  let endTimeStr = b.bookingTime ? String(b.bookingTime).slice(0, 5) : '';
  if (Array.isArray(b.items) && b.items.length > 0) {
    const validEndTimes = b.items
      .map((it) => it.endTime && String(it.endTime).slice(0, 5))
      .filter(Boolean);
    if (validEndTimes.length > 0) {
      validEndTimes.sort();
      endTimeStr = validEndTimes[validEndTimes.length - 1];
    }
  }

  if (!endTimeStr) {
    if (b.bookingTime) {
      const parts = String(b.bookingTime).split(':');
      const h = Number(parts[0]) || 0;
      const m = Number(parts[1]) || 0;
      const endH = Math.min(23, h + 2);
      endTimeStr = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    } else {
      return false;
    }
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [endH, endM] = endTimeStr.split(':').map(Number);
  const targetMinutes = (endH || 0) * 60 + (endM || 0);

  return currentMinutes > targetMinutes;
};

const STATUS_FILTERS = [
  { key: 'ALL', label: 'Tất Cả' },
  { key: 'OVERDUE', label: 'Quá Lịch Hẹn' },
  { key: 'CANCELLATION_REQUESTS', label: 'Yêu Cầu Đổi Thợ' },
  { key: 'REFUND_PENDING', label: 'Chờ Hoàn Cọc' },
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
  const [sortField, setSortField] = useState('BOOKING_DATE'); // 'BOOKING_DATE' | 'CREATED_DATE'
  const [sortOrder, setSortOrder] = useState('DESC'); // 'DESC' | 'ASC'
  const [updatingId, setUpdatingId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState(null);

  // State quản lý yêu cầu hủy / đổi thợ
  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequestToApprove, setSelectedRequestToApprove] = useState(null);
  const [selectedNewArtistId, setSelectedNewArtistId] = useState('');
  const [adminActionNote, setAdminActionNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // State Admin chủ động đổi thợ makeup
  const [reassignModalItem, setReassignModalItem] = useState(null);
  const [reassignArtistsList, setReassignArtistsList] = useState([]);
  const [loadingReassignArtists, setLoadingReassignArtists] = useState(false);
  const [selectedReassignArtistId, setSelectedReassignArtistId] = useState('');
  const [reassignNote, setReassignNote] = useState('');
  const [submittingReassign, setSubmittingReassign] = useState(false);

  const handleConfirmRefund = async (bookingId) => {
    if (!window.confirm(`Xác nhận bạn đã chuyển khoản hoàn tiền cọc cho khách hàng của đơn #${bookingId}?`)) {
      return;
    }

    try {
      setUpdatingId(bookingId);
      const res = await bookingService.confirmRefund(bookingId);
      const updatedBooking = res?.data || res;

      setBookings((prev) =>
        prev.map((b) => {
          if (b.id === bookingId) {
            const currentNotes = b.notes || '';
            const updatedNotes = currentNotes.replace('[HOÀN CỌC', '[ĐÃ HOÀN CỌC');
            const updated = {
              ...b,
              ...updatedBooking,
              status: 'CANCELLED',
              notes: updatedBooking?.notes || (updatedNotes.includes('[ĐÃ HOÀN CỌC') ? updatedNotes : `[ĐÃ HOÀN CỌC] ${currentNotes}`)
            };
            if (selectedBookingDetail && selectedBookingDetail.id === bookingId) {
              setSelectedBookingDetail(updated);
            }
            return updated;
          }
          return b;
        })
      );
      toast.success(`🎉 Đã đánh dấu và lưu hoàn tiền cọc thành công cho đơn #${bookingId}!`);
    } catch (err) {
      console.error('Lỗi khi xác nhận hoàn cọc:', err);
      toast.error('Lỗi khi lưu hoàn tiền cọc: ' + (err.message || 'Lỗi kết nối máy chủ'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCollectPayment = async (bookingId, amount) => {
    const formattedAmount = formatCurrency(amount);
    if (!window.confirm(`Xác nhận bạn đã thu đủ ${formattedAmount} từ khách hàng cho đơn #${bookingId}?`)) {
      return;
    }
    try {
      setUpdatingId(bookingId);
      const res = await bookingService.collectPayment(bookingId);
      const updatedData = res?.data || res;

      setBookings((prev) =>
        prev.map((b) => {
          if (b.id === bookingId) {
            const currentNotes = b.notes || '';
            const updated = {
              ...b,
              ...updatedData,
              isFullyPaid: true,
              remainingToCollect: 0,
              totalPaid: b.totalPrice,
              notes: updatedData?.notes || (currentNotes.includes('[ĐÃ THU ĐỦ TIỀN') ? currentNotes : `[ĐÃ THU ĐỦ TIỀN] ${currentNotes}`)
            };
            if (selectedBookingDetail && selectedBookingDetail.id === bookingId) {
              setSelectedBookingDetail(updated);
            }
            return updated;
          }
          return b;
        })
      );
      toast.success(`🎉 Đã xác nhận thu đủ ${formattedAmount} cho đơn #${bookingId}!`);
    } catch (err) {
      console.error('Lỗi khi xác nhận thu tiền:', err);
      toast.error('Lỗi khi ghi nhận thu tiền: ' + (err.response?.data?.message || err.message || 'Lỗi kết nối'));
    } finally {
      setUpdatingId(null);
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

  const fetchCancellationRequests = async () => {
    try {
      setLoadingRequests(true);
      const data = await bookingService.getCancellationRequests('ALL');
      setCancellationRequests(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách yêu cầu đổi thợ:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadAllData = async (isRefresh = false) => {
    await Promise.all([fetchBookings(isRefresh), fetchCancellationRequests()]);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleOpenApproveModal = (req) => {
    setSelectedRequestToApprove(req);
    setSelectedNewArtistId(req.availableArtists?.[0]?.id ? String(req.availableArtists[0].id) : '');
    setAdminActionNote('');
  };

  const handleCloseApproveModal = () => {
    setSelectedRequestToApprove(null);
    setSelectedNewArtistId('');
    setAdminActionNote('');
  };

  const handleConfirmApprove = async (e) => {
    e.preventDefault();
    if (!selectedNewArtistId) {
      toast.error('Vui lòng chọn thợ trang điểm mới để thay thế!');
      return;
    }
    try {
      setSubmittingAction(true);
      await bookingService.approveCancellationRequest(
        selectedRequestToApprove.itemId,
        selectedNewArtistId,
        adminActionNote
      );
      toast.success('🎉 Đã duyệt đổi thợ thành công! Ca làm việc đã được chuyển giao cho thợ mới.');
      handleCloseApproveModal();
      await loadAllData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi duyệt đổi thợ');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmReject = async (itemId) => {
    const note = window.prompt('Nhập lý do từ chối yêu cầu hủy ca của thợ (tuỳ chọn):', '');
    if (note === null) return;
    try {
      setUpdatingId(itemId);
      await bookingService.rejectCancellationRequest(itemId, note);
      toast.success('Đã từ chối yêu cầu hủy ca của thợ!');
      await loadAllData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi từ chối yêu cầu hủy');
    } finally {
      setUpdatingId(null);
    }
  };

  // Mở modal Admin chủ động đổi thợ cho ca làm việc
  const handleOpenReassignModal = async (item, booking) => {
    setReassignModalItem({ item, booking });
    setReassignNote('');
    setSelectedReassignArtistId('');
    try {
      setLoadingReassignArtists(true);
      const artists = await bookingService.getAvailableArtistsForItem(item.id);
      setReassignArtistsList(artists);
      const firstAvailable = artists.find((a) => !a.isCurrent && a.isAvailable);
      if (firstAvailable) {
        setSelectedReassignArtistId(String(firstAvailable.id));
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách thợ: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setLoadingReassignArtists(false);
    }
  };

  const handleCloseReassignModal = () => {
    setReassignModalItem(null);
    setReassignArtistsList([]);
    setSelectedReassignArtistId('');
    setReassignNote('');
  };

  const handleSubmitReassign = async (e) => {
    e.preventDefault();
    if (!selectedReassignArtistId) {
      toast.error('Vui lòng chọn thợ trang điểm thay thế!');
      return;
    }
    try {
      setSubmittingReassign(true);
      await bookingService.reassignArtist(
        reassignModalItem.item.id,
        selectedReassignArtistId,
        reassignNote
      );
      toast.success('🎉 Đã thay đổi thợ trang điểm thành công!');
      handleCloseReassignModal();
      await loadAllData(true);

      // Cập nhật lại booking detail nếu đang mở modal chi tiết
      if (selectedBookingDetail && selectedBookingDetail.id === reassignModalItem.booking.id) {
        try {
          const freshData = await bookingService.getAllBookings();
          const target = freshData.find((b) => b.id === selectedBookingDetail.id);
          if (target) setSelectedBookingDetail(target);
        } catch {}
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi đổi thợ');
    } finally {
      setSubmittingReassign(false);
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    if (newStatus === 'COMPLETED') {
      const targetBooking = bookings.find((b) => b.id === bookingId);
      const isPaid = targetBooking && Boolean(
        targetBooking.isFullyPaid ||
        (targetBooking.remainingToCollect !== undefined && targetBooking.remainingToCollect <= 0) ||
        (targetBooking.notes && targetBooking.notes.includes('[ĐÃ THU ĐỦ TIỀN'))
      );
      if (targetBooking && !isPaid) {
        toast.error('⚠️ Bạn phải bấm xác nhận "Đã Thu Tiền" từ khách hàng trước khi hoàn thành đơn!');
        return;
      }
    }
    setUpdatingId(bookingId);
    try {
      await bookingService.updateStatus(bookingId, newStatus);
      toast.success(`Cập nhật trạng thái đơn #${bookingId} thành công!`);
      // Update local state directly
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id === bookingId) {
            const updated = { ...b, status: newStatus };
            if (selectedBookingDetail && selectedBookingDetail.id === bookingId) {
              setSelectedBookingDetail(updated);
            }
            return updated;
          }
          return b;
        })
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
      // Đơn PENDING_PAYMENT (chưa cọc, thanh toán sau) không hiển thị trên trang Admin
      if (b.status === 'PENDING_PAYMENT') return false;

      const isCancelled = b.status === 'CANCELLED' || Boolean(b.notes && (b.notes.includes('[Lý do hủy') || b.notes.includes('[HOÀN CỌC') || b.notes.includes('[ĐÃ HOÀN CỌC')));
      const effectiveStatus = isCancelled ? 'CANCELLED' : b.status;

      // Tab filter
      if (activeTab === 'OVERDUE') {
        if (!isBookingOverdue(b)) return false;
      } else if (activeTab === 'REFUND_PENDING') {
        const isRefundPending = b.notes && b.notes.includes('[HOÀN CỌC') && !b.notes.includes('[ĐÃ HOÀN CỌC');
        if (!isRefundPending) return false;
      } else if (activeTab !== 'ALL' && effectiveStatus !== activeTab) {
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
    }).sort((a, b) => {
      const getBookingTimestamp = (item) => {
        if (!item?.bookingDate) return 0;
        const timeStr = item.bookingTime ? String(item.bookingTime).slice(0, 8) : '00:00:00';
        const ms = new Date(`${item.bookingDate}T${timeStr}`).getTime();
        return Number.isNaN(ms) ? 0 : ms;
      };

      const getCreatedTimestamp = (item) => {
        if (!item?.createdAt) return 0;
        const ms = new Date(item.createdAt).getTime();
        return Number.isNaN(ms) ? 0 : ms;
      };

      const isAsc = sortOrder === 'ASC';

      if (sortField === 'BOOKING_DATE') {
        const diff = isAsc
          ? getBookingTimestamp(a) - getBookingTimestamp(b)
          : getBookingTimestamp(b) - getBookingTimestamp(a);
        if (diff !== 0) return diff;
        return isAsc ? (Number(a.id) || 0) - (Number(b.id) || 0) : (Number(b.id) || 0) - (Number(a.id) || 0);
      }

      // CREATED_DATE: Sắp xếp theo ngày đặt đơn
      const diffCreated = isAsc
        ? getCreatedTimestamp(a) - getCreatedTimestamp(b)
        : getCreatedTimestamp(b) - getCreatedTimestamp(a);
      if (diffCreated !== 0) return diffCreated;
      return isAsc ? (Number(a.id) || 0) - (Number(b.id) || 0) : (Number(b.id) || 0) - (Number(a.id) || 0);
    });
  }, [bookings, activeTab, dateFilter, searchTerm, sortField, sortOrder]);

  // Lọc danh sách yêu cầu hủy ca
  const filteredCancellationRequests = useMemo(() => {
    return cancellationRequests.filter((r) => {
      if (dateFilter && r.bookingDate !== dateFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const itemMatch = r.itemId?.toString().includes(query);
        const bookingMatch = r.bookingId?.toString().includes(query);
        const custNameMatch = r.customerName?.toLowerCase().includes(query);
        const custPhoneMatch = r.customerPhone?.toLowerCase().includes(query);
        const artistMatch = r.currentArtistName?.toLowerCase().includes(query);
        const serviceMatch = r.serviceName?.toLowerCase().includes(query);
        const reasonMatch = r.cancelReason?.toLowerCase().includes(query);
        if (!itemMatch && !bookingMatch && !custNameMatch && !custPhoneMatch && !artistMatch && !serviceMatch && !reasonMatch) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      const dateA = a.bookingDate ? new Date(`${a.bookingDate}T${a.startTime || '00:00:00'}`).getTime() : 0;
      const dateB = b.bookingDate ? new Date(`${b.bookingDate}T${b.startTime || '00:00:00'}`).getTime() : 0;
      return sortOrder === 'ASC' ? dateA - dateB : dateB - dateA;
    });
  }, [cancellationRequests, dateFilter, searchTerm, sortField, sortOrder]);

  // Count per status
  const counts = useMemo(() => {
    const map = { ALL: bookings.length };
    const pendingCancelCount = cancellationRequests.filter((r) => r.cancelStatus === 'PENDING').length;
    map['CANCELLATION_REQUESTS'] = pendingCancelCount;
    map['OVERDUE'] = bookings.filter((b) => isBookingOverdue(b)).length;
    STATUS_FILTERS.forEach((sf) => {
      if (sf.key === 'REFUND_PENDING') {
        map[sf.key] = bookings.filter((b) => b.notes?.includes('[HOÀN CỌC') && !b.notes?.includes('[ĐÃ HOÀN CỌC')).length;
      } else if (sf.key !== 'ALL' && sf.key !== 'CANCELLATION_REQUESTS' && sf.key !== 'OVERDUE') {
        map[sf.key] = bookings.filter((b) => {
          const isCancelled = b.status === 'CANCELLED' || Boolean(b.notes && (b.notes.includes('[Lý do hủy') || b.notes.includes('[HOÀN CỌC') || b.notes.includes('[ĐÃ HOÀN CỌC')));
          const effectiveStatus = isCancelled ? 'CANCELLED' : b.status;
          return effectiveStatus === sf.key;
        }).length;
      }
    });
    return map;
  }, [bookings, cancellationRequests]);

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
          onClick={() => loadAllData(true)}
          disabled={refreshing || loading || loadingRequests}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all duration-200 border border-slate-700 disabled:opacity-50 self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-rose-400' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Alert banner if there are overdue bookings */}
      {counts.OVERDUE > 0 && activeTab !== 'OVERDUE' && (
        <div className="p-3.5 sm:p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>
              Phát hiện <strong>{counts.OVERDUE}</strong> đơn đặt lịch đã quá giờ/ngày hẹn nhưng chưa được cập nhật hoàn thành!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('OVERDUE')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition-colors shadow-sm cursor-pointer"
          >
            Lọc xem ngay
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_FILTERS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = counts[tab.key] || 0;
            const isOverdueTab = tab.key === 'OVERDUE';
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? isOverdueTab
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25'
                      : 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                    : isOverdueTab && count > 0
                    ? 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 border border-amber-500/40'
                    : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                }`}
              >
                {isOverdueTab && <AlertTriangle className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? isOverdueTab
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-white/20 text-white'
                      : isOverdueTab && count > 0
                      ? 'bg-amber-500/25 text-amber-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Sort & Date Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-800/60">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn (#1), tên khách hàng, SĐT, hoặc dịch vụ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-2">
            <div className="relative flex-1">
              <ArrowUpDown className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors cursor-pointer"
                title="Chọn tiêu chí sắp xếp danh sách lịch đặt"
              >
                <option value="BOOKING_DATE">📅 Ngày hẹn</option>
                <option value="CREATED_DATE">🕒 Ngày đặt</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))}
              className="px-3 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-rose-300 text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              title="Đảo chiều sắp xếp (Tăng dần / Giảm dần)"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">
                {sortOrder === 'ASC' ? 'Tăng dần' : 'Giảm dần'}
              </span>
            </button>
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
              title="Lọc theo ngày hẹn cụ thể"
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

      {/* Bookings List or Cancellation Requests List */}
      {activeTab === 'CANCELLATION_REQUESTS' ? (
        loadingRequests ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-36 rounded-3xl bg-slate-900/60 animate-pulse border border-slate-800/50" />
            ))}
          </div>
        ) : filteredCancellationRequests.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <p className="text-white font-semibold text-base">Không có yêu cầu đổi thợ nào</p>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              Hiện tại không có chuyên viên nào gửi yêu cầu xin hủy/đổi ca làm việc.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCancellationRequests.map((req) => (
              <div
                key={req.itemId}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border bg-slate-900/70 border-slate-800/90 hover:border-slate-700 transition-all shadow-md space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Đơn #{req.bookingId} · Ca #{req.itemId}</span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      req.cancelStatus === 'PENDING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : req.cancelStatus === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {req.cancelStatus === 'PENDING' ? 'Chờ duyệt đổi thợ' : req.cancelStatus === 'APPROVED' ? 'Đã duyệt đổi thợ' : 'Đã từ chối'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-300">
                    📅 <strong>{req.bookingDate}</strong> · ⏰ <strong>{req.startTime} - {req.endTime}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
                  <div className="md:col-span-4 space-y-1">
                    <p className="text-white font-semibold">{req.serviceName}</p>
                    <p className="text-slate-400">Khách hàng: <strong className="text-slate-200">{req.customerName}</strong> ({req.customerPhone})</p>
                  </div>
                  <div className="md:col-span-5 space-y-1">
                    <p className="text-slate-400">Thợ xin hủy: <strong className="text-rose-400">{req.currentArtistName}</strong></p>
                    <p className="text-slate-300 italic">Lý do: "{req.cancelReason}"</p>
                  </div>
                  <div className="md:col-span-3 flex items-center justify-end gap-2">
                    {req.cancelStatus === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenApproveModal(req)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Duyệt & Đổi Thợ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmReject(req.itemId)}
                          disabled={updatingId === req.itemId}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold text-xs cursor-pointer transition-colors"
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : loading ? (
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
            {activeTab === 'OVERDUE'
              ? 'Tuyệt vời! Không có đơn lịch đặt nào bị quá hạn chưa hoàn thành.'
              : searchTerm || dateFilter || activeTab !== 'ALL'
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để hiển thị kết quả.'
              : 'Hệ thống hiện tại chưa có đơn đặt lịch nào.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b) => {
            const isCancelled = b.status === 'CANCELLED' || Boolean(b.notes && (b.notes.includes('[Lý do hủy') || b.notes.includes('[HOÀN CỌC') || b.notes.includes('[ĐÃ HOÀN CỌC')));
            const effectiveStatus = isCancelled ? 'CANCELLED' : b.status;
            const status = getStatusBadge(effectiveStatus);
            const isUpdating = updatingId === b.id;
            const isOverdue = isBookingOverdue(b);
            const hasRefundRequest = Boolean(b.notes && (b.notes.includes('[HOÀN CỌC') || b.notes.includes('[ĐÃ HOÀN CỌC')));
            const isRefunded = Boolean(b.notes && b.notes.includes('[ĐÃ HOÀN CỌC'));
            const isPaid = Boolean(b.isFullyPaid || (b.remainingToCollect !== undefined && b.remainingToCollect <= 0) || (b.notes && b.notes.includes('[ĐÃ THU ĐỦ TIỀN')));
            const remainingToCollect = b.remainingToCollect !== undefined 
              ? b.remainingToCollect 
              : Math.max(0, (b.totalPrice || 0) - (b.depositAmount || 0));

            return (
              <div
                key={b.id}
                className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 shadow-md ${
                  isCancelled
                    ? 'bg-slate-900/60 border-rose-900/30'
                    : hasRefundRequest && !isRefunded
                    ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                    : isRefunded
                    ? 'bg-slate-900/80 border-emerald-500/30'
                    : isOverdue
                    ? 'bg-amber-950/20 border-amber-500/50 hover:border-amber-400'
                    : 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Header card: ID, Status Badges, Date & Time */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif font-bold text-sm sm:text-base text-white">Đơn #{b.id}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${status.color}`}>
                      {status.text}
                    </span>
                    {isOverdue && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>Quá Lịch Hẹn</span>
                      </span>
                    )}
                    {hasRefundRequest && !isRefunded && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <ArrowDownLeft className="w-3 h-3 text-amber-400" />
                        <span>Chờ Hoàn Cọc ({formatCurrency(b.depositAmount)})</span>
                      </span>
                    )}
                    {isRefunded && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Đã Hoàn Cọc</span>
                      </span>
                    )}
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {b.locationType === 'HOME' ? '🏠 Tại nhà' : '🏢 Studio'}
                    </span>
                    {b.layout && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 hidden lg:inline-flex items-center gap-1">
                        <Palette className="w-3 h-3 text-rose-400" />
                        <span>{b.layout}</span>
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-white font-medium">{b.bookingDate}</span>
                    <Clock className="w-3.5 h-3.5 text-rose-400 ml-1" />
                    <span className="text-white font-medium">{formatTime(b.bookingTime)}</span>
                  </div>
                </div>

                {/* Main Compact Row: Customer, Services, Price & Amount to Collect, Actions */}
                <div className="pt-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
                  {/* Customer Info */}
                  <div className="md:col-span-3 flex items-center gap-2.5">
                    {b.customerImage ? (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(b.customerImage)}
                        className="w-10 h-10 rounded-xl overflow-hidden border border-slate-700 hover:border-rose-400 shrink-0 transition-all cursor-pointer relative group"
                        title="Xem ảnh chân dung khuôn mặt khách hàng"
                      >
                        <img src={b.customerImage} alt="Ảnh mặt khách" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-3 h-3 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 text-white font-semibold">
                        <span className="truncate">{b.customerName || 'Khách vãng lai'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{b.customerPhone || 'Chưa cập nhật SĐT'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Services & Artists Summary */}
                  <div className="md:col-span-3 space-y-1">
                    <div className="text-slate-300 font-medium truncate flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">
                        {b.items && b.items.length > 0
                          ? b.items.map(it => it.serviceName).join(', ')
                          : 'Dịch vụ makeup'}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="truncate">
                        Chuyên viên: <strong className="text-slate-200">{b.items && b.items.length > 0 ? b.items.map(it => it.artistName).filter(Boolean).join(', ') : 'Chưa phân công'}</strong>
                      </span>
                      {b.items && b.items.length === 1 && effectiveStatus !== 'COMPLETED' && effectiveStatus !== 'CANCELLED' && (
                        <button
                          type="button"
                          onClick={() => handleOpenReassignModal(b.items[0], b)}
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Đổi thợ trang điểm cho đơn này"
                        >
                          <ArrowRightLeft className="w-3 h-3 text-purple-400" />
                          <span>Đổi thợ</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Price, Deposit & Amount to Collect */}
                  <div className="md:col-span-3 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-rose-400 font-bold font-sans text-sm">
                        {formatCurrency(b.totalPrice)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {b.paymentMethod === 'CASH' ? (
                          <span className="text-amber-400/90 font-medium">Chưa cọc</span>
                        ) : (
                          <span>Cọc: <strong className="text-emerald-400">{formatCurrency(b.depositAmount)}</strong></span>
                        )}
                      </span>
                    </div>
                    <div className="text-[11px]">
                      {isPaid ? (
                        <span className="text-emerald-400 font-semibold inline-flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Đã thu đủ tiền</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold inline-flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          <DollarSign className="w-3 h-3 text-amber-400" />
                          <span>Cần thu: <strong className="text-amber-300 font-sans">{formatCurrency(remainingToCollect)}</strong></span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons: Admin Chi tiết, Thu tiền, Hoàn thành & Hủy đơn */}
                  <div className="md:col-span-3 flex flex-wrap items-center justify-end gap-1.5">
                    {/* Nút Chi Tiết Lịch Đặt */}
                    <button
                      type="button"
                      onClick={() => setSelectedBookingDetail(b)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs flex items-center gap-1 shadow-md shadow-rose-500/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      title="Xem chi tiết toàn bộ lịch đặt"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Chi tiết</span>
                    </button>

                    {/* Nút Đã Thu Tiền nếu chưa thu đủ */}
                    {!isPaid && effectiveStatus !== 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={() => handleCollectPayment(b.id, remainingToCollect)}
                        disabled={isUpdating}
                        className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-95"
                        title="Xác nhận đã thu tiền từ khách hàng"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã Thu Tiền</span>
                      </button>
                    )}

                    {/* Hoàn thành (ràng buộc thu tiền trước) */}
                    {effectiveStatus !== 'COMPLETED' && effectiveStatus !== 'CANCELLED' && (
                      isPaid ? (
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'COMPLETED')}
                          disabled={isUpdating}
                          className="px-2 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer hover:scale-[1.02]"
                          title="Đánh dấu hoàn thành đơn"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Hoàn thành</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toast.error('⚠️ Bạn phải bấm xác nhận "Đã Thu Tiền" từ khách hàng trước khi hoàn thành đơn!')}
                          className="px-2 py-1.5 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 text-xs font-medium flex items-center gap-1 cursor-not-allowed opacity-80"
                          title="Chưa thu tiền - Vui lòng bấm 'Đã Thu Tiền' trước"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Cần thu tiền</span>
                        </button>
                      )
                    )}

                    {/* Hủy đơn */}
                    {effectiveStatus !== 'CANCELLED' && effectiveStatus !== 'COMPLETED' && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Bạn có chắc chắn muốn hủy đơn #${b.id}?`)) {
                            handleUpdateStatus(b.id, 'CANCELLED');
                          }
                        }}
                        disabled={isUpdating}
                        className="px-2 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                        title="Hủy đơn đặt lịch"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Hủy đơn</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CHI TIẾT LỊCH ĐẶT */}
      {selectedBookingDetail && (() => {
        const b = selectedBookingDetail;
        const isCancelled = b.status === 'CANCELLED' || Boolean(b.notes && (b.notes.includes('[Lý do hủy') || b.notes.includes('[HOÀN CỌC') || b.notes.includes('[ĐÃ HOÀN CỌC')));
        const effectiveStatus = isCancelled ? 'CANCELLED' : b.status;
        const status = getStatusBadge(effectiveStatus);
        const hasRefundRequest = Boolean(b.notes && (b.notes.includes('[HOÀN CỌC') || b.notes.includes('[ĐÃ HOÀN CỌC')));
        const isRefunded = Boolean(b.notes && b.notes.includes('[ĐÃ HOÀN CỌC'));
        const isUpdating = updatingId === b.id;
        const isPaid = Boolean(b.isFullyPaid || (b.remainingToCollect !== undefined && b.remainingToCollect <= 0) || (b.notes && b.notes.includes('[ĐÃ THU ĐỦ TIỀN')));
        const remainingToCollect = b.remainingToCollect !== undefined 
          ? b.remainingToCollect 
          : Math.max(0, (b.totalPrice || 0) - (b.depositAmount || 0));

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in"
            onClick={() => setSelectedBookingDetail(null)}
          >
            <div 
              className="relative max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl my-auto max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
                      Chi Tiết Lịch Đặt #{b.id}
                    </h3>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${status.color}`}>
                      {status.text}
                    </span>
                    {hasRefundRequest && !isRefunded && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <ArrowDownLeft className="w-3.5 h-3.5 text-amber-400" />
                        <span>Chờ Hoàn Cọc ({formatCurrency(b.depositAmount)})</span>
                      </span>
                    )}
                    {isRefunded && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Đã Hoàn Cọc</span>
                      </span>
                    )}
                    {isBookingOverdue(b) && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Quá Lịch Hẹn (Chưa Hoàn Thành)</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-rose-400" />
                      <span>Ngày hẹn: <strong>{b.bookingDate}</strong></span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-rose-400" />
                      <span>Giờ bắt đầu: <strong>{formatTime(b.bookingTime)}</strong></span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px]">
                      Chế độ: {formatExecutionMode(b.executionMode, b.dispatchPlan)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBookingDetail(null)}
                  className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Đóng modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Thông Báo Hoàn Tiền Cọc (Nếu có) */}
              {hasRefundRequest && (
                <div className={`p-4 rounded-2xl border text-xs space-y-3 ${
                  isRefunded 
                    ? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-200' 
                    : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-sm">
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
                        disabled={isUpdating}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Đã Chuyển Khoản Hoàn Cọc Cho Khách</span>
                      </button>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-amber-100 flex items-start sm:items-center justify-between gap-3">
                    <span className="break-all">{b.notes}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(b.notes || '');
                        toast.success('Đã sao chép thông tin STK hoàn cọc!');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 flex items-center gap-1 text-xs cursor-pointer"
                      title="Sao chép thông tin"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Grid 2 Cột: Khách hàng & Địa điểm & Tài chính */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Khách hàng & Địa điểm */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Thông Tin Khách Hàng & Địa Điểm
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <span className="text-slate-400 text-[11px] block">Họ và tên:</span>
                        <span className="text-white font-semibold text-sm">{b.customerName || 'Khách vãng lai'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <span className="text-slate-400 text-[11px] block">Số điện thoại:</span>
                        <span className="text-white font-medium">{b.customerPhone || 'Chưa cập nhật SĐT'}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 pt-1 border-t border-slate-800/60">
                      {b.locationType === 'HOME' ? (
                        <Home className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <Building2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="text-slate-400 text-[11px] block">Địa điểm phục vụ:</span>
                        <span className="text-white font-medium">
                          {b.locationType === 'HOME' ? `Tại nhà: ${b.address || 'Chưa có địa chỉ'}` : 'Tại Studio Glamour'}
                        </span>
                        {b.locationType === 'HOME' && b.distanceKm && (
                          <span className="text-slate-400 text-[11px] block mt-0.5">
                            Khoảng cách: {b.distanceKm} km (Phí ship: {formatCurrency(b.travelFee)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tài chính & Thanh toán */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Thông Tin Tài Chính & Thanh Toán
                    </span>
                    {isPaid ? (
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã thu đủ tiền
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Chưa thu đủ tiền
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Tổng chi phí đơn:</span>
                      <span className="text-rose-400 font-bold font-sans text-base">{formatCurrency(b.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Tiền đặt cọc:</span>
                      <span className="text-emerald-400 font-bold">{formatCurrency(b.depositAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Chi phí cần thu:</span>
                      <span className={`font-bold font-sans text-base ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isPaid ? '0 đ (Đã thanh toán đủ)' : formatCurrency(remainingToCollect)}
                      </span>
                    </div>

                    {!isPaid && effectiveStatus !== 'CANCELLED' && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleCollectPayment(b.id, remainingToCollect)}
                          disabled={isUpdating}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-95"
                          title="Xác nhận đã thu tiền từ khách hàng"
                        >
                          <Check className="w-4 h-4" />
                          <span>Xác Nhận Đã Thu Tiền ({formatCurrency(remainingToCollect)})</span>
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400">Phương thức:</span>
                      <span className="text-slate-200 font-medium">
                        {b.paymentMethod === 'CASH' ? '🏢 Thanh toán tiền mặt tại Studio' : '💳 Chuyển khoản / VNPAY'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danh Sách Ca Làm & Chuyên Viên */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Dịch Vụ & Chuyên Viên Trang Điểm Phụ Trách ({b.items?.length || 0})
                </span>
                <div className="rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800 bg-slate-950/60">
                  {b.items && b.items.length > 0 ? (
                    b.items.map((item, idx) => (
                      <div key={item.id || idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-rose-400" />
                          </div>
                          <div>
                            <span className="font-semibold text-white text-sm block">{item.serviceName}</span>
                            <span className="text-slate-400 text-[11px]">
                              Chuyên viên: <strong className="text-rose-300">{item.artistName || 'Chưa phân công'}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <div className="text-slate-400 font-mono text-[11px]">
                            <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                            {formatTime(item.startTime)} - {formatTime(item.endTime)}
                          </div>
                          <div className="text-rose-400 font-bold font-sans text-sm">
                            {formatCurrency(item.price)}
                          </div>
                          {effectiveStatus !== 'COMPLETED' && effectiveStatus !== 'CANCELLED' && (
                            <button
                              type="button"
                              onClick={() => handleOpenReassignModal(item, b)}
                              className="px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer hover:scale-[1.02]"
                              title="Thay đổi thợ trang điểm phụ trách ca này"
                            >
                              <ArrowRightLeft className="w-3 h-3 text-purple-400" />
                              <span>Đổi Thợ</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-500 text-xs">Không có dữ liệu chi tiết ca làm việc</div>
                  )}
                </div>
              </div>

              {/* Yêu cầu Layout & Ghi chú & Ảnh chân dung */}
              {(b.layout || b.customerImage || (b.notes && !b.notes.includes('[HOÀN CỌC') && !b.notes.includes('[ĐÃ HOÀN CỌC'))) && (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Yêu Cầu Trang Điểm & Ảnh Chân Dung
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      {b.layout && (
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="text-slate-300">
                            Phong cách / Layout yêu cầu: <strong className="text-white text-sm">{b.layout}</strong>
                          </span>
                        </div>
                      )}
                      {b.notes && !b.notes.includes('[HOÀN CỌC') && !b.notes.includes('[ĐÃ HOÀN CỌC') && (
                        <div className="text-slate-400 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                          Ghi chú khách hàng: "{b.notes}"
                        </div>
                      )}
                    </div>

                    {b.customerImage && (
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-slate-400 text-[11px]">Ảnh khuôn mặt:</span>
                        <button
                          type="button"
                          onClick={() => setPreviewImage(b.customerImage)}
                          className="relative group w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-700 hover:border-rose-400 transition-all cursor-pointer shadow-lg"
                          title="Nhấp để xem ảnh lớn"
                        >
                          <img src={b.customerImage} alt="Ảnh mặt khách" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-4 h-4 text-white" />
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer Modal: Thao tác Admin (Chỉ Hoàn thành & Hủy đơn) */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Thao tác:</span>
                  <div className="flex flex-wrap gap-2">
                    {/* Nút Xác nhận đã thu tiền nếu chưa thu */}
                    {!isPaid && effectiveStatus !== 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={() => handleCollectPayment(b.id, remainingToCollect)}
                        disabled={isUpdating}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Xác nhận đã thu tiền</span>
                      </button>
                    )}

                    {effectiveStatus !== 'COMPLETED' && effectiveStatus !== 'CANCELLED' && (
                      isPaid ? (
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'COMPLETED')}
                          disabled={isUpdating}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Hoàn thành đơn</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toast.error('⚠️ Bạn phải bấm xác nhận "Đã Thu Tiền" từ khách hàng trước khi hoàn thành đơn!')}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed opacity-80"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Cần thu tiền trước khi hoàn thành</span>
                        </button>
                      )
                    )}

                    {effectiveStatus !== 'CANCELLED' && effectiveStatus !== 'COMPLETED' && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Bạn có chắc chắn muốn hủy đơn #${b.id}?`)) {
                            handleUpdateStatus(b.id, 'CANCELLED');
                          }
                        }}
                        disabled={isUpdating}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Hủy đơn</span>
                      </button>
                    )}

                    {effectiveStatus === 'CANCELLED' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-rose-400 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Đã hủy đơn</span>
                        </span>
                        <button
                          onClick={() => {
                            if (window.confirm(`Khôi phục đơn #${b.id} về trạng thái 'Đã xác nhận'?`)) {
                              handleUpdateStatus(b.id, 'CONFIRMED');
                            }
                          }}
                          disabled={isUpdating}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors cursor-pointer"
                        >
                          Khôi phục
                        </button>
                      </div>
                    )}

                    {effectiveStatus === 'COMPLETED' && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đã hoàn thành</span>
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBookingDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  Đóng
                </button>
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

      {/* MODAL DUYỆT ĐỔI THỢ TRANG ĐIỂM */}
      {selectedRequestToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Duyệt & Đổi Thợ Trang Điểm</h3>
                  <p className="text-xs text-slate-400">Chuyển giao ca làm việc sang cho thợ trang điểm khác</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseApproveModal}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Ca làm việc:</span>
                <span className="font-bold text-white">{selectedRequestToApprove.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thời gian:</span>
                <span className="font-bold text-rose-300">{selectedRequestToApprove.bookingDate} ({selectedRequestToApprove.startTime} - {selectedRequestToApprove.endTime})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thợ xin hủy:</span>
                <span className="font-semibold text-rose-400">{selectedRequestToApprove.currentArtistName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lý do xin hủy:</span>
                <span className="italic text-slate-300">"{selectedRequestToApprove.cancelReason}"</span>
              </div>
            </div>

            <form onSubmit={handleConfirmApprove} noValidate className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Chọn thợ trang điểm thay thế <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedNewArtistId}
                  onChange={(e) => setSelectedNewArtistId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="">-- Chọn thợ trang điểm đang rảnh --</option>
                  {selectedRequestToApprove.availableArtists?.map((artist) => (
                    <option key={artist.id} value={artist.id}>
                      {artist.fullName} {artist.phone ? `(${artist.phone})` : ''} - {artist.experience || 'Master Artist'}
                    </option>
                  ))}
                </select>
                {(!selectedRequestToApprove.availableArtists || selectedRequestToApprove.availableArtists.length === 0) && (
                  <p className="text-xs text-rose-400">⚠️ Hiện không có thợ nào rảnh trong khung giờ này!</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Ghi chú điều phối (Lưu vào lịch sử đơn)
                </label>
                <textarea
                  rows={2}
                  value={adminActionNote}
                  onChange={(e) => setAdminActionNote(e.target.value)}
                  placeholder="Ghi chú thêm của admin (tuỳ chọn)..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseApproveModal}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submittingAction || !selectedNewArtistId}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingAction ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang Duyệt...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Xác Nhận & Đổi Thợ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADMIN CHỦ ĐỘNG ĐỔI THỢ MAKEUP */}
      {reassignModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Thay Đổi Thợ Trang Điểm</h3>
                  <p className="text-xs text-slate-400">Điều phối lại chuyên viên phụ trách ca làm việc</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseReassignModal}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thông tin ca hiện tại */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Mã đơn đặt:</span>
                <span className="font-mono font-bold text-rose-400">#{reassignModalItem.booking?.id} (Ca #{reassignModalItem.item?.id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dịch vụ:</span>
                <span className="font-bold text-white">{reassignModalItem.item?.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thời gian thực hiện:</span>
                <span className="font-bold text-rose-300">
                  {reassignModalItem.booking?.bookingDate} ({formatTime(reassignModalItem.item?.startTime)} - {formatTime(reassignModalItem.item?.endTime)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thợ hiện tại:</span>
                <span className="font-semibold text-slate-200">
                  {reassignModalItem.item?.artistName || 'Chưa phân công'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitReassign} noValidate className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Chọn thợ trang điểm thay thế <span className="text-rose-400">*</span>
                </label>

                {loadingReassignArtists ? (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span>Đang kiểm tra lịch khả dụng của các thợ...</span>
                  </div>
                ) : (
                  <select
                    value={selectedReassignArtistId}
                    onChange={(e) => setSelectedReassignArtistId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="">-- Chọn thợ trang điểm mới --</option>
                    {reassignArtistsList.map((artist) => {
                      const labelStatus = artist.isCurrent
                        ? '[Đang phụ trách]'
                        : artist.isAvailable
                        ? '🟢 [Rảnh lịch]'
                        : '🔴 [Trùng lịch]';
                      return (
                        <option
                          key={artist.id}
                          value={artist.id}
                          disabled={artist.isCurrent || !artist.isAvailable}
                        >
                          {labelStatus} {artist.fullName} {artist.phone ? `(${artist.phone})` : ''} - {artist.experience || 'Master Artist'}
                        </option>
                      );
                    })}
                  </select>
                )}

                {reassignArtistsList.length > 0 && !reassignArtistsList.some(a => !a.isCurrent && a.isAvailable) && (
                  <p className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                    ⚠️ Không có thợ trang điểm nào khác đang rảnh trong khung giờ này.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Lý do / Ghi chú điều phối (Lưu vào lịch sử đơn)
                </label>
                <textarea
                  rows={2}
                  value={reassignNote}
                  onChange={(e) => setReassignNote(e.target.value)}
                  placeholder="Vd: Khách hàng đổi thợ theo yêu cầu, điều phối lại ca..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseReassignModal}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submittingReassign || !selectedReassignArtistId}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-95"
                >
                  {submittingReassign ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang Lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Xác Nhận Đổi Thợ</span>
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

export default AdminBookingsPage;
