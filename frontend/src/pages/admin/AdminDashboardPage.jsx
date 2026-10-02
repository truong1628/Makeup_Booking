import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Calendar, DollarSign, Users, Clock,
  ArrowUpRight, CheckCircle2, AlertCircle, PlusCircle
} from 'lucide-react';
import { serviceService } from '../../services/serviceService';
import { bookingService } from '../../services/bookingService';
import { formatCurrency, formatDate, formatTime, getStatusBadge } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

const AdminDashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const [servicesCount, setServicesCount] = useState(0);
  const [allBookings, setAllBookings] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [servicesRes, bookingsRes] = await Promise.all([
          serviceService.getServices(),
          bookingService.getAllBookings().catch(() => []),
        ]);
        setServicesCount(servicesRes.length);
        setAllBookings(bookingsRes);
        setRecentBookings(bookingsRes.slice(0, 5));
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const totalRevenue = allBookings
    .filter((b) => b.status !== 'CANCELLED')
    .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

  const stats = [
    {
      title: 'Dịch Vụ & Combo Hoạt Động',
      value: servicesCount || '0',
      change: 'Đang hoạt động',
      icon: Sparkles,
      color: 'from-rose-500 to-pink-500',
    },
    {
      title: 'Tổng Đơn Đặt Lịch',
      value: allBookings.length,
      change: 'Toàn hệ thống',
      icon: Calendar,
      color: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Chuyên Gia Makeup Active',
      value: '2',
      change: 'Sẵn sàng nhận lịch',
      icon: Users,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Doanh Thu Đơn Hẹn',
      value: formatCurrency(totalRevenue),
      change: 'Bao gồm cọc 30%',
      icon: DollarSign,
      color: 'from-blue-500 to-indigo-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-8 border border-slate-800 shadow-2xl">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chào mừng trở lại, {user?.fullName || 'Quản trị viên'}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Bảng Điều Khiển Quản Trị Hệ Thống
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
            Giám sát toàn bộ hoạt động đặt lịch, doanh thu dịch vụ, điều phối thợ trang điểm và thiết lập ca làm việc tập trung.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-md flex items-center justify-between"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400">{stat.title}</p>
                <p className="font-serif text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-[11px] text-emerald-400 font-medium">{stat.change}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Bookings Table */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-400" />
              <span>Đơn Đặt Lịch Gần Nhất</span>
            </h3>
            <Link
              to="/admin/bookings"
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">Chưa có đơn đặt lịch nào gần đây.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 rounded-l-xl">Mã Đơn</th>
                    <th className="py-3 px-4">Ngày & Giờ</th>
                    <th className="py-3 px-4">Hình Thức</th>
                    <th className="py-3 px-4">Tổng Tiền</th>
                    <th className="py-3 px-4 rounded-r-xl">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentBookings.map((b) => {
                    const status = getStatusBadge(b.status);
                    return (
                      <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">#{b.id}</td>
                        <td className="py-3 px-4">{b.bookingDate} {formatTime(b.bookingTime)}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold">
                            {b.locationType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-rose-400 font-serif">
                          {formatCurrency(b.totalPrice)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status.color}`}>
                            {status.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions Panel */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Thao Tác Nhanh</span>
          </h3>

          <div className="space-y-3">
            <Link
              to="/admin/services"
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-slate-200 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold group-hover:text-rose-400 transition-colors">Tạo Dịch Vụ Mới</p>
                  <p className="text-[11px] text-slate-500">Đơn lẻ hoặc gói Combo 1NF</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
            </Link>

            <Link
              to="/admin/schedules"
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-slate-200 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold group-hover:text-amber-400 transition-colors">Xem Lịch Biểu Thợ</p>
                  <p className="text-[11px] text-slate-500">Quản lý ngày nghỉ và ca làm</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
            </Link>

            <Link
              to="/booking"
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-slate-200 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold group-hover:text-emerald-400 transition-colors">Thử Đặt Lịch Khách Hàng</p>
                  <p className="text-[11px] text-slate-500">Trải nghiệm giao diện đặt hẹn</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
