import React, { useEffect, useState, useMemo } from 'react';
import {
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, User, Search, Filter,
  RefreshCw, PlusCircle, Check, Loader2, Sparkles,
  Ban, CalendarDays
} from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';
import { scheduleService } from '../../services/scheduleService';
import { useToast } from '../../context/ToastContext';

// Danh sách chuyên viên mẫu dự phòng nếu hệ thống chưa tải xong
const FALLBACK_ARTISTS = [
  {
    id: 1,
    fullName: 'Nguyễn Thùy Linh',
    phone: '0901234567',
    email: 'thuylinh@makeup.com',
    workingHours: 'Cả ngày',
    workingDays: 'Thứ 2 - Chủ Nhật',
    active: true,
  },
  {
    id: 2,
    fullName: 'Phạm Quỳnh Chi',
    phone: '0912345678',
    email: 'quynhchi@makeup.com',
    workingHours: 'Cả ngày',
    workingDays: 'Thứ 2 - Thứ 7',
    active: true,
  },
  {
    id: 3,
    fullName: 'Lê Hoàng Yến',
    phone: '0923456789',
    email: 'hoangyen@makeup.com',
    workingHours: 'Cả ngày',
    workingDays: 'Thứ 2 - Chủ Nhật',
    active: true,
  },
  {
    id: 4,
    fullName: 'Trần Mai Anh',
    phone: '0934567890',
    email: 'maianh@makeup.com',
    workingHours: 'Cả ngày',
    workingDays: 'Thứ 3 - Chủ Nhật',
    active: true,
  }
];

const AdminSchedulesPage = () => {
  const toast = useToast();

  const [artists, setArtists] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Bộ lọc & Tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, HAS_OFF, FULL_WORK

  // Quản lý tuần / khoảng ngày đang xem
  // Mặc định là Thứ 2 của tuần hiện tại
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday, 1 is Monday...
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Điều chỉnh về Thứ 2
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  });

  // Số ngày hiển thị trên bảng: 7 (Tuần) hoặc 14 (2 tuần)
  const [daysCount, setDaysCount] = useState(7);

  // State đang cập nhật ô cụ thể (để hiện spinner per cell)
  const [updatingCell, setUpdatingCell] = useState(null); // format: `${artistId}_${dateStr}`

  // State Modal đăng ký nghỉ nhanh
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState({
    artistId: '',
    startDate: '',
    endDate: '',
    isDayOff: true,
    note: 'Nghỉ phép theo lịch'
  });
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // Sinh danh sách các ngày trong khoảng hiển thị
  const dateColumns = useMemo(() => {
    const list = [];
    const start = new Date(currentWeekStart);
    const todayStr = new Date().toISOString().split('T')[0];

    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const fullDayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayIndex = d.getDay();
      
      list.push({
        dateStr,
        dayName: dayNames[dayIndex],
        fullDayName: fullDayNames[dayIndex],
        dayOfMonth: String(d.getDate()).padStart(2, '0'),
        month: String(d.getMonth() + 1).padStart(2, '0'),
        isToday: dateStr === todayStr,
        isPast: dateStr < todayStr
      });
    }
    return list;
  }, [currentWeekStart, daysCount]);

  // Tải dữ liệu từ backend
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Tải danh sách thợ
      let artistList = [];
      try {
        const resArtists = await axiosInstance.get('/api/v1/admin/artists');
        const raw = Array.isArray(resArtists) ? resArtists : (resArtists?.data || []);
        if (Array.isArray(raw) && raw.length > 0) {
          artistList = raw;
        }
      } catch (err) {
        console.warn('Lỗi lấy thợ từ API admin:', err);
      }

      if (artistList.length === 0) {
        artistList = FALLBACK_ARTISTS;
      }
      setArtists(artistList);

      // 2. Tải lịch trình từ API
      const startDate = dateColumns[0]?.dateStr;
      const endDate = dateColumns[dateColumns.length - 1]?.dateStr;

      try {
        const scheduleList = await scheduleService.getAdminSchedules(startDate, endDate);
        setSchedules(scheduleList || []);
      } catch (err) {
        console.warn('Lỗi lấy schedules từ API:', err);
        // Khởi tạo lịch mẫu nếu chưa có dữ liệu
        setSchedules([
          { id: 101, artistId: 1, scheduleDate: '2026-10-01', isDayOff: true, startTime: '08:00:00', endTime: '20:00:00' },
          { id: 102, artistId: 2, scheduleDate: '2026-10-02', isDayOff: true, startTime: '08:00:00', endTime: '20:00:00' },
          { id: 103, artistId: 3, scheduleDate: '2026-10-05', isDayOff: true, startTime: '07:30:00', endTime: '21:00:00' }
        ]);
      }
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu lịch trình: ' + (err.message || ''));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentWeekStart, daysCount]);

  // Điều hướng tuần
  const handlePrevWeek = () => {
    const current = new Date(currentWeekStart);
    current.setDate(current.getDate() - 7);
    setCurrentWeekStart(current.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const current = new Date(currentWeekStart);
    current.setDate(current.getDate() + 7);
    setCurrentWeekStart(current.toISOString().split('T')[0]);
  };

  const handleJumpToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    setCurrentWeekStart(monday.toISOString().split('T')[0]);
  };

  // Tra cứu trạng thái của 1 chuyên viên tại 1 ngày cụ thể
  const getScheduleForArtistOnDate = (artistId, dateStr) => {
    return schedules.find(
      (s) => String(s.artistId) === String(artistId) && s.scheduleDate === dateStr
    );
  };

  // Chuyển đổi trạng thái (Làm việc <-> Nghỉ phép)
  const handleToggleDayOff = async (artist, dateStr, currentSchedule) => {
    const cellKey = `${artist.id}_${dateStr}`;
    setUpdatingCell(cellKey);

    const willBeDayOff = !currentSchedule?.isDayOff;

    try {
      // Gọi API cập nhật
      const response = await scheduleService.setDayOff({
        artistId: artist.id,
        scheduleDate: dateStr,
        isDayOff: willBeDayOff,
        startTime: currentSchedule?.startTime || '00:00:00',
        endTime: currentSchedule?.endTime || '23:59:59'
      });

      // Cập nhật State cục bộ ngay lập tức
      setSchedules((prev) => {
        const existingIndex = prev.findIndex(
          (s) => String(s.artistId) === String(artist.id) && s.scheduleDate === dateStr
        );

        const newRecord = {
          id: response?.id || Date.now(),
          artistId: artist.id,
          artistName: artist.fullName,
          scheduleDate: dateStr,
          isDayOff: willBeDayOff,
          startTime: currentSchedule?.startTime || '00:00:00',
          endTime: currentSchedule?.endTime || '23:59:59'
        };

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...newRecord };
          return updated;
        } else {
          return [...prev, newRecord];
        }
      });

      if (willBeDayOff) {
        toast.success(`🔴 Đã đánh dấu NGHỈ PHÉP cho ${artist.fullName} vào ngày ${dateStr}`);
      } else {
        toast.success(`🟢 Đã chuyển ${artist.fullName} sang trạng thái LÀM VIỆC ngày ${dateStr}`);
      }
    } catch (err) {
      console.error('Lỗi khi đổi trạng thái ngày nghỉ:', err);
      toast.error('Không thể cập nhật ngày nghỉ: ' + (err.message || ''));
    } finally {
      setUpdatingCell(null);
    }
  };

  // Xử lý gửi form đăng ký nghỉ nhiều ngày
  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    if (!batchForm.artistId || !batchForm.startDate) {
      toast.error('Vui lòng chọn chuyên viên và ngày bắt đầu');
      return;
    }

    const end = batchForm.endDate || batchForm.startDate;
    if (batchForm.startDate > end) {
      toast.error('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu');
      return;
    }

    try {
      setBatchSubmitting(true);

      const targetArtist = artists.find((a) => String(a.id) === String(batchForm.artistId));
      const startD = new Date(batchForm.startDate);
      const endD = new Date(end);

      let cur = new Date(startD);
      let count = 0;

      while (cur <= endD) {
        const dateStr = cur.toISOString().split('T')[0];
        await scheduleService.setDayOff({
          artistId: batchForm.artistId,
          scheduleDate: dateStr,
          isDayOff: batchForm.isDayOff,
          startTime: '00:00:00',
          endTime: '23:59:59'
        });

        // Cập nhật State
        setSchedules((prev) => {
          const existingIndex = prev.findIndex(
            (s) => String(s.artistId) === String(batchForm.artistId) && s.scheduleDate === dateStr
          );
          const rec = {
            id: Date.now() + Math.random(),
            artistId: batchForm.artistId,
            scheduleDate: dateStr,
            isDayOff: batchForm.isDayOff,
            startTime: '00:00:00',
            endTime: '23:59:59'
          };
          if (existingIndex >= 0) {
            const copy = [...prev];
            copy[existingIndex] = rec;
            return copy;
          }
          return [...prev, rec];
        });

        count++;
        cur.setDate(cur.getDate() + 1);
      }

      toast.success(`✨ Đã cập nhật ${count} ngày lịch trình cho ${targetArtist?.fullName || 'chuyên viên'}!`);
      setShowBatchModal(false);
      setBatchForm({
        artistId: '',
        startDate: '',
        endDate: '',
        isDayOff: true,
        note: 'Nghỉ phép theo lịch'
      });
    } catch (err) {
      toast.error('Lỗi khi đăng ký lịch: ' + (err.message || ''));
    } finally {
      setBatchSubmitting(false);
    }
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    let totalSlots = 0;
    let totalDayOffs = 0;

    artists.forEach((artist) => {
      dateColumns.forEach((col) => {
        totalSlots++;
        const sch = getScheduleForArtistOnDate(artist.id, col.dateStr);
        if (sch?.isDayOff) {
          totalDayOffs++;
        }
      });
    });

    const activeArtistsCount = artists.filter((a) => a.active !== false).length;
    const workingSlots = totalSlots - totalDayOffs;
    const availabilityRate = totalSlots > 0 ? Math.round((workingSlots / totalSlots) * 100) : 100;

    return {
      totalArtists: artists.length,
      activeArtistsCount,
      totalDayOffs,
      workingSlots,
      availabilityRate
    };
  }, [artists, dateColumns, schedules]);

  // Lọc danh sách chuyên viên theo từ khóa tìm kiếm và trạng thái
  const filteredArtists = useMemo(() => {
    return artists.filter((artist) => {
      const matchSearch =
        artist.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artist.phone?.includes(searchQuery);

      if (!matchSearch) return false;

      if (statusFilter === 'HAS_OFF') {
        const hasOff = dateColumns.some((col) => {
          const s = getScheduleForArtistOnDate(artist.id, col.dateStr);
          return s?.isDayOff;
        });
        return hasOff;
      }

      if (statusFilter === 'FULL_WORK') {
        const hasOff = dateColumns.some((col) => {
          const s = getScheduleForArtistOnDate(artist.id, col.dateStr);
          return s?.isDayOff;
        });
        return !hasOff;
      }

      return true;
    });
  }, [artists, searchQuery, statusFilter, dateColumns, schedules]);

  return (
    <div className="space-y-6 max-w-full">
      {/* Tiêu đề trang & Thao tác nhanh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Bảng Lịch Làm Việc & Quản Lý Ngày Nghỉ
            </h1>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Bảng điều phối ca làm việc. Đánh dấu ngày nghỉ để hệ thống tự động khóa slot không cho khách đặt lịch trực tuyến.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchData();
            }}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${refreshing || loading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>

          <button
            onClick={() => {
              setBatchForm({
                artistId: artists[0]?.id || '',
                startDate: dateColumns[0]?.dateStr || '',
                endDate: dateColumns[0]?.dateStr || '',
                isDayOff: true,
                note: 'Nghỉ phép theo lịch'
              });
              setShowBatchModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Đăng Ký Nghỉ Phép</span>
          </button>
        </div>
      </div>

      {/* Thẻ Thống kê Tổng quan (KPI cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Tổng Chuyên Viên</p>
            <p className="text-xl font-bold text-white mt-1">
              {stats.totalArtists}{' '}
              <span className="text-[11px] text-emerald-400 font-normal font-sans">
                ({stats.activeArtistsCount} đang nhận lịch)
              </span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Ngày Nghỉ Phép Đã Đánh Dấu</p>
            <p className="text-xl font-bold text-rose-400 mt-1">
              {stats.totalDayOffs}{' '}
              <span className="text-[11px] text-slate-500 font-normal">lượt nghỉ trong kỳ</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Ban className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Ca Làm Việc Khả Dụng</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">
              {stats.workingSlots}{' '}
              <span className="text-[11px] text-slate-500 font-normal">ca nhận khách</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Độ Phủ Lực Lượng</p>
            <p className="text-xl font-bold text-sky-400 mt-1">
              {stats.availabilityRate}%{' '}
              <span className="text-[11px] text-slate-500 font-normal">sẵn sàng phục vụ</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Thanh Điều hướng Ngày, Chuyển Tuần & Bộ lọc */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Điều hướng tuần */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-xl p-1">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleJumpToToday}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-purple-300 hover:bg-purple-950/40 transition-colors"
            >
              Hôm Nay
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Chọn ngày xem bất kỳ */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={currentWeekStart}
              onChange={(e) => {
                if (e.target.value) setCurrentWeekStart(e.target.value);
              }}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            />
          </div>

          {/* Khoảng ngày đang xem */}
          <span className="text-xs text-slate-400 px-2">
            Từ{' '}
            <strong className="text-slate-200">
              {dateColumns[0]?.dayOfMonth}/{dateColumns[0]?.month}
            </strong>{' '}
            đến{' '}
            <strong className="text-slate-200">
              {dateColumns[dateColumns.length - 1]?.dayOfMonth}/{dateColumns[dateColumns.length - 1]?.month}
            </strong>
          </span>

          {/* Toggle xem 7 ngày / 14 ngày */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setDaysCount(7)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                daysCount === 7
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              7 Ngày
            </button>
            <button
              onClick={() => setDaysCount(14)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                daysCount === 14
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              14 Ngày
            </button>
          </div>
        </div>

        {/* Tìm kiếm & Lọc trạng thái */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo tên thợ, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">Tất cả chuyên viên</option>
              <option value="HAS_OFF" className="bg-slate-900 text-white">Có ngày nghỉ trong kỳ</option>
              <option value="FULL_WORK" className="bg-slate-900 text-white">Làm việc đầy đủ</option>
            </select>
          </div>
        </div>
      </div>

      {/* BẢNG LỊCH LÀM VIỆC & NGÀY NGHỈ (MA TRẬN) */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            <p className="text-sm font-medium">Đang tải lịch trình chuyên viên...</p>
          </div>
        ) : filteredArtists.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Không tìm thấy chuyên viên nào phù hợp</p>
            <p className="text-xs text-slate-500">Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <table className="w-full text-left border-collapse min-w-[950px]">
              {/* Table Header */}
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70">
                  {/* Cột 1: Chuyên viên (Sticky bên trái) */}
                  <th className="sticky left-0 z-20 bg-slate-950/95 backdrop-blur-md p-4 w-72 min-w-[280px] border-r border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                          Chuyên Viên ({filteredArtists.length})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">Hàng</span>
                    </div>
                  </th>

                  {/* Các cột Ngày */}
                  {dateColumns.map((col) => {
                    // Đếm số lượng thợ nghỉ trong ngày này
                    let dayOffCount = 0;
                    artists.forEach((art) => {
                      const sch = getScheduleForArtistOnDate(art.id, col.dateStr);
                      if (sch?.isDayOff) dayOffCount++;
                    });
                    const workingCount = artists.length - dayOffCount;

                    return (
                      <th
                        key={col.dateStr}
                        className={`p-3 text-center border-r border-slate-800/60 min-w-[125px] transition-colors ${
                          col.isToday
                            ? 'bg-purple-950/30 border-purple-500/40'
                            : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-1.5">
                            <span
                              className={`text-xs font-bold uppercase ${
                                col.isToday
                                  ? 'text-purple-300 font-extrabold'
                                  : col.dayName === 'CN'
                                  ? 'text-rose-400'
                                  : 'text-slate-300'
                              }`}
                            >
                              {col.dayName}
                            </span>
                            {col.isToday && (
                              <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-[9px] font-bold text-white uppercase tracking-tight">
                                Nay
                              </span>
                            )}
                          </div>

                          <div className="text-sm font-semibold text-slate-200">
                            {col.dayOfMonth}/{col.month}
                          </div>

                          <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                            <span className="text-emerald-400 font-medium">{workingCount} làm</span>
                            {dayOffCount > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-rose-400 font-bold">{dayOffCount} nghỉ</span>
                              </>
                            )}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-800/80">
                {filteredArtists.map((artist) => {
                  return (
                    <tr
                      key={artist.id}
                      className="hover:bg-slate-800/20 transition-colors group"
                    >
                      {/* Cột 1: Thông tin Chuyên viên (Sticky Row Header) */}
                      <td className="sticky left-0 z-10 bg-slate-900/95 backdrop-blur-md p-4 border-r border-slate-800/80 group-hover:bg-slate-850 transition-colors">
                        <div className="flex items-start gap-3">
                          {/* Avatar / Initial */}
                          <div className="relative shrink-0">
                            {artist.avatar ? (
                              <img
                                src={artist.avatar}
                                alt={artist.fullName}
                                className="w-10 h-10 rounded-full object-cover border border-purple-500/30"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-700 to-pink-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
                                {artist.fullName?.charAt(0) || 'A'}
                              </div>
                            )}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                                artist.active !== false ? 'bg-emerald-500' : 'bg-slate-500'
                              }`}
                              title={artist.active !== false ? 'Đang hoạt động' : 'Tạm ẩn'}
                            />
                          </div>

                          {/* Thông tin chi tiết */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-semibold text-sm text-white truncate">
                                {artist.fullName}
                              </h4>
                            </div>

                            <p className="text-[11px] text-slate-400 truncate">
                              Master Artist (Đa phong cách)
                            </p>

                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {(artist.workingHours && !/\d{2}:\d{2}/.test(artist.workingHours)) ? artist.workingHours : 'Cả ngày'}
                              </span>
                              {artist.phone && <span>• {artist.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Các cột Ngày của chuyên viên này */}
                      {dateColumns.map((col) => {
                        const schedule = getScheduleForArtistOnDate(artist.id, col.dateStr);
                        const isDayOff = Boolean(schedule?.isDayOff);
                        const isCellUpdating = updatingCell === `${artist.id}_${col.dateStr}`;

                        return (
                          <td
                            key={col.dateStr}
                            className={`p-2.5 text-center border-r border-slate-800/60 align-middle transition-all relative ${
                              col.isToday ? 'bg-purple-950/10' : ''
                            }`}
                          >
                            <div
                              onClick={() => {
                                if (!isCellUpdating) {
                                  handleToggleDayOff(artist, col.dateStr, schedule);
                                }
                              }}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer select-none group/cell relative ${
                                isDayOff
                                  ? 'bg-rose-950/40 border-rose-500/50 hover:bg-rose-900/60 hover:border-rose-400 shadow-md shadow-rose-950/30'
                                  : 'bg-slate-950/60 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80'
                              } ${isCellUpdating ? 'opacity-60 pointer-events-none' : ''}`}
                            >
                              {/* Loading Spinner per cell */}
                              {isCellUpdating && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 rounded-2xl z-10">
                                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                                </div>
                              )}

                              {isDayOff ? (
                                /* ĐÁNH DẤU NGHỈ PHÉP (NỔI BẬT) */
                                <div className="space-y-1.5">
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-extrabold tracking-wide uppercase">
                                    <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                                    <span>Nghỉ Phép</span>
                                  </div>
                                  <div className="text-[10px] text-rose-300/80 font-medium">
                                    Khóa nhận lịch
                                  </div>
                                  <div className="text-[9px] text-slate-400 opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-center justify-center gap-1 mt-1 text-emerald-400 font-semibold">
                                    <Check className="w-2.5 h-2.5" />
                                    <span>Bấm đổi Đi làm</span>
                                  </div>
                                </div>
                              ) : (
                                /* LÀM VIỆC BÌNH THƯỜNG */
                                <div className="space-y-1.5">
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span>Làm Việc</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                                    <Clock className="w-2.5 h-2.5 text-slate-500" />
                                    <span>
                                      {!schedule?.startTime ||
                                      (schedule.startTime.startsWith('00:00') && schedule.endTime?.startsWith('23:59')) ||
                                      (schedule.startTime.startsWith('08:00') && schedule.endTime?.startsWith('20:00'))
                                        ? 'Cả ngày'
                                        : `${schedule.startTime.substring(0, 5)} - ${schedule.endTime.substring(0, 5)}`}
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-slate-400 opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-center justify-center gap-1 mt-1 text-rose-400 font-semibold">
                                    <Ban className="w-2.5 h-2.5" />
                                    <span>Bấm để Nghỉ</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Chú Thích Trạng Thái (Legend) & Hướng Dẫn Nhanh */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="font-semibold text-slate-400">Chú thích trạng thái:</span>
            
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Lịch Làm Việc</span>
              </span>
              <span className="text-slate-400 text-[11px]">Sẵn sàng nhận lịch hẹn từ khách</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[11px] font-bold">
                <XCircle className="w-3.5 h-3.5" />
                <span>Đánh Dấu Nghỉ Phép</span>
              </span>
              <span className="text-slate-400 text-[11px]">Tự động khóa slot trên giao diện khách hàng</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-[11px]">Cột ngày Hôm Nay</span>
            </div>
          </div>

          <div className="text-slate-400 text-[11px] flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>
              <strong>Mẹo thao tác:</strong> Nhấp trực tiếp vào ô bất kỳ để chuyển đổi nhanh giữa <strong>Làm việc</strong> và <strong>Nghỉ phép</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* MODAL ĐĂNG KÝ NGHỈ PHÉP NHIỀU NGÀY (BATCH MODAL) */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Đăng Ký Nghỉ Phép</h3>
                  <p className="text-xs text-slate-400">Đánh dấu nghỉ cho chuyên viên</p>
                </div>
              </div>

              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBatchSubmit} noValidate className="space-y-4">
              {/* Chọn chuyên viên */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Chọn Chuyên Viên
                </label>
                <select
                  value={batchForm.artistId}
                  onChange={(e) => setBatchForm({ ...batchForm, artistId: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="" disabled>-- Chọn chuyên viên trang điểm --</option>
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName} {a.phone ? `(${a.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Từ ngày & Đến ngày */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Từ Ngày
                  </label>
                  <input
                    type="date"
                    required
                    value={batchForm.startDate}
                    onChange={(e) => setBatchForm({ ...batchForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Đến Ngày (Tùy chọn)
                  </label>
                  <input
                    type="date"
                    value={batchForm.endDate}
                    min={batchForm.startDate}
                    onChange={(e) => setBatchForm({ ...batchForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Loại lịch */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Trạng Thái Thiết Lập
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      batchForm.isDayOff
                        ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="isDayOff"
                      checked={batchForm.isDayOff === true}
                      onChange={() => setBatchForm({ ...batchForm, isDayOff: true })}
                      className="hidden"
                    />
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="text-xs">Nghỉ Phép</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      !batchForm.isDayOff
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="isDayOff"
                      checked={batchForm.isDayOff === false}
                      onChange={() => setBatchForm({ ...batchForm, isDayOff: false })}
                      className="hidden"
                    />
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs">Làm Việc</span>
                  </label>
                </div>
              </div>

              {/* Ghi chú lý do */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lý Do / Ghi Chú
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nghỉ phép định kỳ, việc gia đình..."
                  value={batchForm.note}
                  onChange={(e) => setBatchForm({ ...batchForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Nút hành động */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={batchSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {batchSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Xác Nhận Lưu Lịch</span>
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

export default AdminSchedulesPage;
