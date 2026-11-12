import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, PlusCircle, CheckCircle2,
  ShieldAlert, RefreshCw, Sun, Info
} from 'lucide-react';
import { artistService } from '../../services/artistService';
import { useToast } from '../../context/ToastContext';

const ArtistSchedulePage = () => {
  const toast = useToast();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await artistService.getMySchedules();
      setSchedules(data);
    } catch (err) {
      toast.error('Không thể tải lịch trình: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
    // Default selectedDate is tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const handleRegisterDayOff = async (e) => {
    e.preventDefault();
    if (!selectedDate) {
      toast.error('Vui lòng chọn ngày muốn đăng ký nghỉ phép');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDate < todayStr) {
      toast.error('Không thể đăng ký nghỉ cho ngày trong quá khứ');
      return;
    }

    try {
      setSubmitting(true);
      await artistService.registerDayOff(selectedDate);
      toast.success(`✨ Đã đăng ký nghỉ phép thành công ngày ${selectedDate}! Hệ thống đã khóa lịch nhận khách.`);
      await loadSchedules();
    } catch (err) {
      toast.error(err.message || 'Đăng ký ngày nghỉ thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const dayOffList = schedules.filter(s => s.isDayOff);
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
            <span>Lịch Làm & Đăng Ký Nghỉ Phép</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-sans font-medium">
              Lịch Trình Cá Nhân
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Quản lý ngày làm việc tiêu chuẩn và đăng ký ngày nghỉ phép để hệ thống tự động khóa slot
          </p>
        </div>

        <button
          onClick={loadSchedules}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-sm font-semibold hover:bg-slate-850 transition-all self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm Mới Lịch</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form đăng ký nghỉ phép */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-md shadow-rose-500/20 text-white">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Đăng Ký Nghỉ Phép</h3>
                <p className="text-xs text-slate-400">Khóa lịch nhận khách tự động</p>
              </div>
            </div>

            <form onSubmit={handleRegisterDayOff} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Chọn Ngày Nghỉ Phép
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="date"
                    id="input-day-off-date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  * Hệ thống sẽ tự động khóa ca cả ngày (00:00 - 23:59) cho ngày này.
                </p>
              </div>

              <button
                type="submit"
                id="btn-submit-day-off"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-rose-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>Đang xử lý đăng ký...</span>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Xác Nhận Đăng Ký Nghỉ</span>
                  </>
                )}
              </button>
            </form>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 text-xs text-amber-200/90">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <Info className="w-4 h-4 shrink-0" />
                <span>Quy định Studio</span>
              </div>
              <p className="leading-relaxed text-[11px] text-slate-300">
                • Vui lòng đăng ký nghỉ phép trước ít nhất <strong>24 giờ</strong>.<br />
                • Nếu ngày đã có ca khách hàng đặt trước, hệ thống sẽ ưu tiên bảo vệ quyền lợi khách hàng.
              </p>
            </div>
          </div>

          {/* Standard Working Hours Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Khung Giờ Tiêu Chuẩn</span>
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Giờ nhận lịch:</span>
                <span className="font-semibold text-amber-400">Cả ngày (00:00 - 23:59)</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Ngày làm việc:</span>
                <span className="font-semibold text-emerald-400">Thứ 2 - Chủ Nhật</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Danh sách ngày nghỉ phép và lịch trình */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Danh Sách Ngày Nghỉ Đã Đăng Ký</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                    {dayOffList.length} ngày
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Các ngày bạn đã đăng ký nghỉ phép và hệ thống tự động khóa tiếp nhận lịch hẹn
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400">Đang tải danh sách ngày nghỉ...</p>
              </div>
            ) : dayOffList.length === 0 ? (
              <div className="p-10 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-slate-500 flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-300">Chưa có ngày nghỉ nào được đăng ký</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tất cả các ngày đều đang mở sẵn sàng nhận khách. Dùng form bên cạnh để đăng ký ngày nghỉ phép khi bạn có việc bận.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {dayOffList.map((item) => {
                  const isPast = item.scheduleDate < todayStr;
                  const isToday = item.scheduleDate === todayStr;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isPast
                          ? 'bg-slate-950/40 border-slate-850 opacity-60'
                          : isToday
                            ? 'bg-purple-950/20 border-purple-500/50 shadow-md'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${isPast
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {item.scheduleDate}
                            </span>
                            {isToday && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500 text-white animate-pulse">
                                Hôm nay
                              </span>
                            )}
                            {isPast && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                                Đã qua
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>Khóa nhận ca: Cả ngày</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã Khóa Nhận Khách</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistSchedulePage;
