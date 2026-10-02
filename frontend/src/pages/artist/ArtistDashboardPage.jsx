import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, Phone, User, Sparkles, CheckCircle2, 
  AlertCircle, Briefcase, DollarSign, Filter, RefreshCw, ChevronRight, Home, Building2
} from 'lucide-react';
import { artistService } from '../../services/artistService';
import { useToast } from '../../context/ToastContext';

const ArtistDashboardPage = () => {
  const toast = useToast();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, TODAY, UPCOMING, COMPLETED

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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ArtistDashboardPage;
