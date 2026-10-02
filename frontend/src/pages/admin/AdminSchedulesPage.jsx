import React from 'react';
import { Clock, Calendar, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const AdminSchedulesPage = () => {
  const sampleSchedules = [
    {
      id: 1,
      artistName: 'Nguyễn Thùy Linh',
      scheduleDate: '2026-10-01',
      startTime: '08:00:00',
      endTime: '20:00:00',
      isDayOff: true,
      note: 'Nghỉ phép định kỳ',
    },
    {
      id: 2,
      artistName: 'Nguyễn Thùy Linh',
      scheduleDate: '2026-10-02',
      startTime: '08:00:00',
      endTime: '20:00:00',
      isDayOff: false,
      note: 'Ca làm việc chính',
    },
    {
      id: 3,
      artistName: 'Phạm Quỳnh Chi',
      scheduleDate: '2026-10-01',
      startTime: '07:30:00',
      endTime: '21:00:00',
      isDayOff: false,
      note: 'Sẵn sàng nhận lịch',
    },
    {
      id: 4,
      artistName: 'Phạm Quỳnh Chi',
      scheduleDate: '2026-10-05',
      startTime: '07:30:00',
      endTime: '21:00:00',
      isDayOff: true,
      note: 'Nghỉ phép',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
          Lịch Làm Việc & Ngày Nghỉ
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Hệ thống tự động đồng bộ để kiểm tra tính khả dụng khi khách hàng đặt lịch trực tuyến.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sampleSchedules.map((s) => (
          <div
            key={s.id}
            className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-white">{s.artistName}</span>
              {s.isDayOff ? (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  <span>Ngày Nghỉ Phép</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Lịch Làm Việc</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{s.scheduleDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{s.startTime.substring(0, 5)} - {s.endTime.substring(0, 5)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 italic">Ghi chú: {s.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSchedulesPage;
