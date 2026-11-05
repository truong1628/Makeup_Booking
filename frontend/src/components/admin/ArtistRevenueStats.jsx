import React, { useState, useMemo } from 'react';
import {
  DollarSign, TrendingUp, Users, Award, Search,
  CheckCircle2, Eye, X,
  RefreshCw, BarChart3, CheckCircle
} from 'lucide-react';
import { formatCurrency, formatDate, formatTime, getStatusBadge } from '../../utils/format';

const TIME_RANGES = [
  { key: 'ALL', label: 'Tất Cả Thời Gian' },
  { key: 'TODAY', label: 'Hôm Nay' },
  { key: 'LAST_7_DAYS', label: '7 Ngày Qua' },
  { key: 'THIS_MONTH', label: 'Tháng Này' },
  { key: 'LAST_MONTH', label: 'Tháng Trước' },
  { key: 'THIS_YEAR', label: 'Năm Nay' },
];

const REVENUE_MODES = [
  { key: 'ALL_VALID', label: 'Tất Cả Hợp Lệ (Bỏ đơn hủy)' },
  { key: 'COMPLETED_ONLY', label: 'Chỉ Đơn Hoàn Thành' },
  { key: 'INCLUDE_PENDING', label: 'Bao Gồm Cả Chờ Cọc' },
];

const SORT_OPTIONS = [
  { key: 'REVENUE_DESC', label: 'Doanh Thu: Cao Nhất' },
  { key: 'REVENUE_ASC', label: 'Doanh Thu: Thấp Nhất' },
  { key: 'APPOINTMENTS_DESC', label: 'Số Ca Làm: Nhiều Nhất' },
  { key: 'COMPLETION_RATE', label: 'Tỷ Lệ Hoàn Thành: Cao Nhất' },
  { key: 'NAME_ASC', label: 'Tên Chuyên Viên: A - Z' },
];

const ArtistRevenueStats = ({
  artists = [],
  bookings = [],
  loading = false,
  onRefresh = () => {},
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('ALL');
  const [revenueMode, setRevenueMode] = useState('ALL_VALID');
  const [sortBy, setSortBy] = useState('REVENUE_DESC');
  const [selectedArtistDetails, setSelectedArtistDetails] = useState(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalStatusFilter, setModalStatusFilter] = useState('ALL');

  // Lọc các booking theo khoảng thời gian đã chọn
  const filteredBookingsByTime = useMemo(() => {
    if (!bookings || bookings.length === 0) return [];
    if (timeRange === 'ALL') return bookings;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return bookings.filter((b) => {
      if (!b.bookingDate) return false;
      const bDate = new Date(b.bookingDate);

      switch (timeRange) {
        case 'TODAY':
          return b.bookingDate === todayStr;

        case 'LAST_7_DAYS': {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          return bDate >= sevenDaysAgo && bDate <= now;
        }

        case 'THIS_MONTH':
          return (
            bDate.getFullYear() === now.getFullYear() &&
            bDate.getMonth() === now.getMonth()
          );

        case 'LAST_MONTH': {
          const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          return (
            bDate.getFullYear() === lastMonthYear &&
            bDate.getMonth() === lastMonth
          );
        }

        case 'THIS_YEAR':
          return bDate.getFullYear() === now.getFullYear();

        default:
          return true;
      }
    });
  }, [bookings, timeRange]);

  // Tính toán doanh thu và ca làm của từng chuyên viên
  const artistStats = useMemo(() => {
    // 1. Tạo Map tất cả thợ đã đăng ký trong hệ thống
    const statsMap = new Map();

    artists.forEach((art) => {
      statsMap.set(String(art.id), {
        id: art.id,
        fullName: art.fullName || 'Chuyên viên',
        email: art.email || '',
        phone: art.phone || '',
        avatar: art.avatar,
        experience: art.experience || 'Chuyên nghiệp',
        active: art.active !== false,
        totalItemsCount: 0,
        completedCount: 0,
        inProgressCount: 0,
        pendingPaymentCount: 0,
        cancelledCount: 0,
        completedRevenue: 0,
        pendingRevenue: 0,
        pendingPaymentRevenue: 0,
        cancelledRevenue: 0,
        totalRevenue: 0,
        items: [],
      });
    });

    // 2. Duyệt qua toàn bộ đơn đặt lịch đã lọc theo thời gian
    filteredBookingsByTime.forEach((booking) => {
      const items = booking.items || [];
      const isCancelled = booking.status === 'CANCELLED' || Boolean(booking.notes && (booking.notes.includes('[Lý do hủy') || booking.notes.includes('[HOÀN CỌC') || booking.notes.includes('[ĐÃ HOÀN CỌC')));
      const status = isCancelled ? 'CANCELLED' : booking.status;

      items.forEach((item) => {
        const artistIdStr = item.makeupArtistId ? String(item.makeupArtistId) : null;
        const itemPrice = Number(item.price) || 0;

        let artistStat = null;
        if (artistIdStr && statsMap.has(artistIdStr)) {
          artistStat = statsMap.get(artistIdStr);
        } else if (item.artistName) {
          // Tìm theo tên nếu ID không khớp
          for (const stat of statsMap.values()) {
            if (stat.fullName.trim().toLowerCase() === item.artistName.trim().toLowerCase()) {
              artistStat = stat;
              break;
            }
          }
        }

        // Nếu là thợ ngoài danh mục, tạo bản ghi động
        if (!artistStat && (artistIdStr || item.artistName)) {
          const dynamicKey = artistIdStr || `name_${item.artistName}`;
          artistStat = {
            id: item.makeupArtistId || dynamicKey,
            fullName: item.artistName || 'Chuyên viên',
            email: '',
            phone: '',
            avatar: null,
            experience: 'Đang hoạt động',
            active: true,
            totalItemsCount: 0,
            completedCount: 0,
            inProgressCount: 0,
            pendingPaymentCount: 0,
            cancelledCount: 0,
            completedRevenue: 0,
            pendingRevenue: 0,
            pendingPaymentRevenue: 0,
            cancelledRevenue: 0,
            totalRevenue: 0,
            items: [],
          };
          statsMap.set(dynamicKey, artistStat);
        }

        if (artistStat) {
          artistStat.items.push({
            itemId: item.id,
            bookingId: booking.id,
            bookingDate: booking.bookingDate,
            bookingTime: booking.bookingTime,
            startTime: item.startTime,
            endTime: item.endTime,
            serviceName: item.serviceName || 'Dịch vụ Makeup',
            price: itemPrice,
            status: status,
            customerName: booking.customerName || 'Khách hàng',
            customerPhone: booking.customerPhone || '',
            locationType: booking.locationType,
          });

          if (status === 'COMPLETED') {
            artistStat.completedCount += 1;
            artistStat.completedRevenue += itemPrice;
          } else if (status === 'IN_PROGRESS' || status === 'CONFIRMED') {
            artistStat.inProgressCount += 1;
            artistStat.pendingRevenue += itemPrice;
          } else if (status === 'PENDING_PAYMENT') {
            artistStat.pendingPaymentCount += 1;
            artistStat.pendingPaymentRevenue += itemPrice;
          } else if (status === 'CANCELLED') {
            artistStat.cancelledCount += 1;
            artistStat.cancelledRevenue += itemPrice;
          }
        }
      });
    });

    // 3. Tính toán tổng số tiền theo chế độ hiển thị doanh thu được chọn
    const resultList = Array.from(statsMap.values()).map((stat) => {
      let displayRevenue = 0;
      let displayAppointments = 0;

      if (revenueMode === 'COMPLETED_ONLY') {
        displayRevenue = stat.completedRevenue;
        displayAppointments = stat.completedCount;
      } else if (revenueMode === 'INCLUDE_PENDING') {
        displayRevenue = stat.completedRevenue + stat.pendingRevenue + stat.pendingPaymentRevenue;
        displayAppointments = stat.completedCount + stat.inProgressCount + stat.pendingPaymentCount;
      } else {
        // Mặc định: ALL_VALID (COMPLETED + IN_PROGRESS + CONFIRMED)
        displayRevenue = stat.completedRevenue + stat.pendingRevenue;
        displayAppointments = stat.completedCount + stat.inProgressCount;
      }

      const totalValid = stat.completedCount + stat.inProgressCount;
      const completionRate = totalValid > 0
        ? Math.round((stat.completedCount / totalValid) * 1000) / 10
        : 0;

      return {
        ...stat,
        displayRevenue,
        displayAppointments,
        totalValidAppointments: totalValid,
        completionRate,
      };
    });

    // 4. Tính tỷ trọng (% đóng góp) trên tổng doanh thu
    const totalSalonRevenue = resultList.reduce((sum, a) => sum + a.displayRevenue, 0);

    return resultList.map((stat) => ({
      ...stat,
      revenueShare: totalSalonRevenue > 0
        ? Math.round((stat.displayRevenue / totalSalonRevenue) * 1000) / 10
        : 0,
    }));
  }, [artists, filteredBookingsByTime, revenueMode]);

  // Bộ lọc tìm kiếm và sắp xếp
  const finalFilteredAndSortedStats = useMemo(() => {
    let list = artistStats;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.fullName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.phone.toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'REVENUE_DESC':
          return b.displayRevenue - a.displayRevenue;
        case 'REVENUE_ASC':
          return a.displayRevenue - b.displayRevenue;
        case 'APPOINTMENTS_DESC':
          return b.displayAppointments - a.displayAppointments;
        case 'COMPLETION_RATE':
          return b.completionRate - a.completionRate;
        case 'NAME_ASC':
          return a.fullName.localeCompare(b.fullName, 'vi');
        default:
          return b.displayRevenue - a.displayRevenue;
      }
    });

    return list;
  }, [artistStats, searchTerm, sortBy]);

  // Tổng hợp KPIs chung
  const totalStats = useMemo(() => {
    const totalRev = artistStats.reduce((sum, a) => sum + a.displayRevenue, 0);
    const completedRev = artistStats.reduce((sum, a) => sum + a.completedRevenue, 0);
    const totalAppts = artistStats.reduce((sum, a) => sum + a.displayAppointments, 0);
    const topArtist = [...artistStats].sort((a, b) => b.displayRevenue - a.displayRevenue)[0];

    return {
      totalRevenue: totalRev,
      completedRevenue: completedRev,
      totalAppointments: totalAppts,
      topArtistName: topArtist && topArtist.displayRevenue > 0 ? topArtist.fullName : 'Chưa có',
      topArtistRevenue: topArtist ? topArtist.displayRevenue : 0,
    };
  }, [artistStats]);

  // Lọc danh sách items trong Modal
  const modalFilteredItems = useMemo(() => {
    if (!selectedArtistDetails) return [];
    let items = selectedArtistDetails.items || [];

    if (modalStatusFilter !== 'ALL') {
      items = items.filter((item) => item.status === modalStatusFilter);
    }

    if (modalSearchTerm.trim()) {
      const q = modalSearchTerm.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.serviceName.toLowerCase().includes(q) ||
          item.customerName.toLowerCase().includes(q) ||
          item.customerPhone.includes(q) ||
          String(item.bookingId).includes(q)
      );
    }

    return items;
  }, [selectedArtistDetails, modalStatusFilter, modalSearchTerm]);

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full min-w-0">
        {/* Card 1: Tổng Doanh Thu Chuyên Viên */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900/90 to-rose-950/30 border border-slate-800 shadow-lg relative overflow-hidden group min-w-0">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tổng Tiền Kiếm Được</span>
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="font-sans text-xl sm:text-2xl font-bold text-white tracking-tight truncate" title={formatCurrency(totalStats.totalRevenue)}>
              {formatCurrency(totalStats.totalRevenue)}
            </p>
            <p className="text-[11px] text-rose-300 mt-1 flex items-center gap-1 font-medium truncate">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>Toàn bộ đội ngũ makeup</span>
            </p>
          </div>
        </div>

        {/* Card 2: Doanh Thu Thực Thu */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900/90 to-emerald-950/30 border border-slate-800 shadow-lg relative overflow-hidden group min-w-0">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Thực Thu (Đã Hoàn Thành)</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="font-sans text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight truncate" title={formatCurrency(totalStats.completedRevenue)}>
              {formatCurrency(totalStats.completedRevenue)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 truncate">
              <span>Đơn dịch vụ đã phục vụ xong</span>
            </p>
          </div>
        </div>

        {/* Card 3: Top Performer */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900/90 to-amber-950/30 border border-slate-800 shadow-lg relative overflow-hidden group min-w-0">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Doanh Thu Cao Nhất</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-base font-bold text-white truncate" title={totalStats.topArtistName}>
              {totalStats.topArtistName}
            </p>
            <p className="text-xs font-semibold text-amber-400 mt-0.5 truncate" title={formatCurrency(totalStats.topArtistRevenue)}>
              {formatCurrency(totalStats.topArtistRevenue)}
            </p>
          </div>
        </div>

        {/* Card 4: Tổng Ca Làm Việc */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900/90 to-indigo-950/30 border border-slate-800 shadow-lg relative overflow-hidden group min-w-0">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tổng Suất Dịch Vụ</span>
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
              {totalStats.totalAppointments} <span className="text-sm font-normal text-slate-400">ca</span>
            </p>
            <p className="text-[11px] text-indigo-300 mt-1 truncate">
              Phân bổ cho {artists.length} chuyên viên
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-5 shadow-2xl w-full max-w-full min-w-0">
        {/* Table Top Controls & Title */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/20 mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Báo Cáo Thu Nhập & Hiệu Suất</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white flex items-center gap-2">
              <span>Bảng Thống Kê Số Tiền Từng Chuyên Viên Kiếm Được</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Chi tiết doanh thu dịch vụ, tỷ lệ hoàn thành ca làm và tỷ trọng đóng góp của mỗi thợ makeup vào studio.
            </p>
          </div>

          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer self-start lg:self-auto border border-slate-700"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Đồng bộ mới nhất</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs">
          {/* Search box */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo tên thợ, số điện thoại, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Time range select */}
          <div className="lg:col-span-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              {TIME_RANGES.map((t) => (
                <option key={t.key} value={t.key}>
                  📅 {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Revenue mode select */}
          <div className="lg:col-span-3">
            <select
              value={revenueMode}
              onChange={(e) => setRevenueMode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              {REVENUE_MODES.map((m) => (
                <option key={m.key} value={m.key}>
                  💰 {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort select */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Statistics Table */}
        <div className="w-full max-w-full min-w-0 overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-2 font-bold text-center w-10 shrink-0">Hạng</th>
                <th className="py-2.5 px-2 font-bold min-w-0">Chuyên Viên</th>
                <th className="py-2.5 px-2 font-bold text-center w-24 shrink-0">Số Ca Làm</th>
                <th className="py-2.5 px-2 font-bold text-right w-24 shrink-0">Đã Hoàn Thành</th>
                <th className="py-2.5 px-2 font-bold text-right w-24 shrink-0">Đang Xử Lý</th>
                <th className="py-2.5 px-2 font-bold text-right w-28 shrink-0">Tổng Doanh Thu</th>
                <th className="py-2.5 px-2 font-bold text-center w-20 shrink-0">Tỷ Trọng</th>
                <th className="py-2.5 px-2 font-bold text-center w-20 shrink-0">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                      <span>Đang tổng hợp dữ liệu doanh thu chuyên viên...</span>
                    </div>
                  </td>
                </tr>
              ) : finalFilteredAndSortedStats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-400">Không tìm thấy chuyên viên phù hợp</p>
                    <p className="text-xs text-slate-600 mt-0.5">Thử đổi từ khóa tìm kiếm hoặc mở rộng khoảng thời gian.</p>
                  </td>
                </tr>
              ) : (
                finalFilteredAndSortedStats.map((artist, idx) => {
                  const rank = idx + 1;
                  const isTop1 = rank === 1 && artist.displayRevenue > 0;
                  const isTop2 = rank === 2 && artist.displayRevenue > 0;
                  const isTop3 = rank === 3 && artist.displayRevenue > 0;

                  return (
                    <tr
                      key={artist.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Cột Thứ Hạng */}
                      <td className="py-2.5 px-2 text-center font-bold shrink-0">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm text-xs" title="Top 1 Doanh Thu">
                            🥇
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-400/20 text-slate-200 border border-slate-400/40 text-xs" title="Top 2 Doanh Thu">
                            🥈
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-500 border border-amber-700/40 text-xs" title="Top 3 Doanh Thu">
                            🥉
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs font-mono">
                            #{rank}
                          </span>
                        )}
                      </td>

                      {/* Cột Chuyên Viên */}
                      <td className="py-2.5 px-2 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-rose-500 to-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
                            {artist.fullName?.charAt(0) || 'A'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs sm:text-sm truncate group-hover:text-rose-400 transition-colors">
                                {artist.fullName}
                              </span>
                              {artist.active ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-semibold shrink-0">
                                  Hoạt động
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-semibold shrink-0">
                                  Tạm khóa
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 max-w-[180px] sm:max-w-[220px] truncate">
                              <span className="shrink-0">{artist.phone || 'Chưa có SĐT'}</span>
                              <span className="shrink-0">•</span>
                              <span className="text-amber-400 truncate">{artist.experience}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột Số Ca Làm */}
                      <td className="py-2.5 px-2 text-center shrink-0">
                        <div>
                          <span className="font-bold text-white text-xs">
                            {artist.displayAppointments} <span className="text-[10px] font-normal text-slate-400">ca</span>
                          </span>
                          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mt-0.5">
                            <span className="text-emerald-400 font-semibold" title="Đã hoàn thành">
                              ✓{artist.completedCount}
                            </span>
                            <span>•</span>
                            <span className="text-amber-400 font-semibold" title="Đang thực hiện / xác nhận">
                              ⏳{artist.inProgressCount}
                            </span>
                            {artist.cancelledCount > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-rose-400 font-semibold" title="Đã hủy">
                                  ✕{artist.cancelledCount}
                                </span>
                              </>
                            )}
                          </div>
                          {/* Mini Progress Bar tỷ lệ hoàn thành */}
                          <div className="w-14 mx-auto bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                            <div
                              className="bg-emerald-400 h-1 rounded-full transition-all duration-500"
                              style={{ width: `${artist.completionRate}%` }}
                              title={`Tỷ lệ hoàn thành: ${artist.completionRate}%`}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Cột Doanh Thu Thực Thu */}
                      <td className="py-2.5 px-2 text-right shrink-0">
                        <span className="font-bold text-emerald-400 font-sans text-xs sm:text-sm whitespace-nowrap block">
                          {formatCurrency(artist.completedRevenue)}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">
                          {artist.completedCount} ca xong
                        </div>
                      </td>

                      {/* Cột Doanh Thu Đang Chờ */}
                      <td className="py-2.5 px-2 text-right shrink-0">
                        <span className="font-bold text-amber-400 font-sans text-xs sm:text-sm whitespace-nowrap block">
                          {formatCurrency(artist.pendingRevenue)}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">
                          {artist.inProgressCount} ca chờ
                        </div>
                      </td>

                      {/* Cột Tổng Tiền Kiếm Được */}
                      <td className="py-2.5 px-2 text-right shrink-0">
                        <span className="font-sans text-xs sm:text-sm font-extrabold text-white group-hover:text-rose-300 transition-colors whitespace-nowrap block">
                          {formatCurrency(artist.displayRevenue)}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-end gap-1 whitespace-nowrap">
                          <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>Tỷ lệ: {artist.completionRate}%</span>
                        </div>
                      </td>

                      {/* Cột Tỷ Trọng Đóng Góp */}
                      <td className="py-2.5 px-2 text-center shrink-0">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-slate-200 text-xs">
                            {artist.revenueShare}%
                          </span>
                          <div className="w-12 bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-rose-500 to-amber-400 h-1 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, artist.revenueShare)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Cột Thao Tác: Xem Chi Tiết */}
                      <td className="py-2.5 px-2 text-center shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedArtistDetails(artist);
                            setModalSearchTerm('');
                            setModalStatusFilter('ALL');
                          }}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-500 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:shadow-rose-600/20 whitespace-nowrap"
                          title="Xem chi tiết các ca của thợ này"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary Note */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 pt-2 gap-2">
          <span>
            * Số tiền hiển thị dựa trên giá trị của từng gói dịch vụ / combo được phân công trực tiếp cho chuyên viên.
          </span>
          <span className="text-slate-500">
            Tổng {finalFilteredAndSortedStats.length} chuyên viên trong danh sách
          </span>
        </div>
      </div>

      {/* Modal Chi Tiết Ca Làm & Doanh Thu Từng Chuyên Viên */}
      {selectedArtistDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 max-w-4xl w-full rounded-3xl p-6 sm:p-8 space-y-5 my-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-rose-500 to-amber-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">
                  {selectedArtistDetails.fullName?.charAt(0) || 'A'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">
                      {selectedArtistDetails.fullName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                      {selectedArtistDetails.experience}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Bảng kê chi tiết các ca dịch vụ và số tiền đã kiếm được
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedArtistDetails(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Specialist Quick Stat Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Tổng Doanh Thu</span>
                <span className="font-sans text-lg font-bold text-rose-400">
                  {formatCurrency(selectedArtistDetails.displayRevenue)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Đã Hoàn Thành</span>
                <span className="font-sans text-lg font-bold text-emerald-400">
                  {formatCurrency(selectedArtistDetails.completedRevenue)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Tổng Số Ca</span>
                <span className="text-lg font-bold text-white">
                  {selectedArtistDetails.items.length} <span className="text-xs font-normal text-slate-400">ca</span>
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Tỷ Lệ Hoàn Thành</span>
                <span className="text-lg font-bold text-amber-400">
                  {selectedArtistDetails.completionRate}%
                </span>
              </div>
            </div>

            {/* Modal Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Lọc dịch vụ, khách hàng..."
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-slate-400 text-xs whitespace-nowrap">Trạng thái:</span>
                <select
                  value={modalStatusFilter}
                  onChange={(e) => setModalStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="ALL">Tất cả ({selectedArtistDetails.items.length})</option>
                  <option value="COMPLETED">Hoàn thành ({selectedArtistDetails.completedCount})</option>
                  <option value="IN_PROGRESS">Đang thực hiện ({selectedArtistDetails.inProgressCount})</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="CANCELLED">Đã hủy ({selectedArtistDetails.cancelledCount})</option>
                </select>
              </div>
            </div>

            {/* Modal Appointments Table */}
            <div className="max-h-96 overflow-y-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Mã Đơn</th>
                    <th className="py-3 px-4">Ngày & Giờ Ca</th>
                    <th className="py-3 px-4">Khách Hàng</th>
                    <th className="py-3 px-4">Dịch Vụ Phục Vụ</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Số Tiền Ca</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {modalFilteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Không có ca làm việc nào khớp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    modalFilteredItems.map((item, i) => {
                      const badge = getStatusBadge(item.status);
                      return (
                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-bold text-white font-mono">
                            #{item.bookingId}
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <span className="font-semibold text-white">
                                {formatDate(item.bookingDate)}
                              </span>
                              <div className="text-[11px] text-slate-400">
                                {item.startTime ? formatTime(item.startTime) : formatTime(item.bookingTime)}
                                {item.endTime ? ` - ${formatTime(item.endTime)}` : ''}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <span className="font-medium text-white">{item.customerName}</span>
                              <div className="text-[11px] text-slate-500">{item.customerPhone}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-rose-300 block max-w-xs truncate" title={item.serviceName}>
                              {item.serviceName}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {item.locationType === 'HOME' ? 'Tại Nhà' : 'Tại Studio'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>
                              {badge.text}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold font-sans text-white text-sm">
                            {formatCurrency(item.price)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Hiển thị {modalFilteredItems.length} ca dịch vụ
              </span>
              <button
                type="button"
                onClick={() => setSelectedArtistDetails(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistRevenueStats;
