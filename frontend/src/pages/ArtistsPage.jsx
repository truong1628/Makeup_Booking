import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Calendar, Clock, Award, CheckCircle,
  Phone, ArrowRight, Check
} from 'lucide-react';
import { bookingService } from '../services/bookingService';

const ArtistsPage = () => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const artistsRes = await bookingService.getArtists();
        setArtists(artistsRes || []);
      } catch (err) {
        console.error('Không thể tải danh sách chuyên viên:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* Header Banner - Tối ưu thu gọn gọn gàng, thanh thoát */}
      <section className="relative overflow-hidden pt-4 pb-6 sm:pt-6 sm:pb-8 bg-gradient-to-b from-rose-50/70 via-pink-50/30 to-transparent">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-100/90 border border-rose-200 text-rose-800 text-[11px] font-bold tracking-wider">
            <Sparkles className="w-3 h-3 text-rose-600" />
            <span>Đội Ngũ Nghệ Sĩ Chuyên Nghiệp</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Chuyên Viên <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500">Trang Điểm</span>
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed line-clamp-1 sm:line-clamp-none">
            Hội tụ những Master Artist tài năng, thành thạo xuất sắc mọi phong cách từ cô dâu, dự tiệc đến layout Douyin, Hàn Quốc.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-600 font-medium">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 shadow-2xs">
              <Check className="w-3 h-3 text-rose-600" /> Thành thạo mọi phong cách
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 shadow-2xs">
              <Check className="w-3 h-3 text-rose-600" /> Đào tạo chuẩn cao cấp
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 shadow-2xs">
              <Check className="w-3 h-3 text-rose-600" /> 100% Mỹ phẩm chính hãng
            </span>
          </div>
        </div>
      </section>

      {/* Artists Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-3xl bg-slate-200/70 animate-pulse" />
            ))}
          </div>
        ) : artists.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <Sparkles className="w-12 h-12 text-rose-400 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">
              Hiện tại chưa có chuyên viên khả dụng
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Vui lòng quay lại sau hoặc liên hệ hotline để được hỗ trợ tư vấn.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {artists.map((artist) => (
              <div
                key={artist.id}
                className="group rounded-3xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="space-y-5">
                  {/* Top profile header */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={artist.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                        alt={artist.fullName}
                        className="w-18 h-18 rounded-2xl object-cover ring-4 ring-rose-50 shadow-md group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mb-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Sẵn sàng nhận lịch</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-rose-600 transition-colors truncate">
                        {artist.fullName}
                      </h3>
                      <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                        <Award className="w-3.5 h-3.5" />
                        <span>{artist.experience || 'Master Makeup Artist'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Expertise badge: Đa phong cách toàn diện */}
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-50/70 to-pink-50/50 border border-rose-100/60">
                    <p className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                      Năng lực chuyên môn
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Thành thạo toàn diện tất cả các phong cách makeup: Cô dâu, Dự tiệc, Kỷ yếu, Douyin, Hàn Quốc trong veo, Thái Lan và Vintage.
                    </p>
                  </div>

                  {/* Schedule / Hours */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Giờ nhận lịch: {artist.workingHours || '08:00 - 20:00'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Ngày làm việc: {artist.workingDays || 'Tất cả các ngày trong tuần'}</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="pt-5 mt-5 border-t border-slate-100 grid grid-cols-2 gap-2.5">
                  <Link
                    to={`/collections?artistId=${artist.id}`}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 text-xs font-semibold text-center transition-all"
                  >
                    Xem Tác Phẩm
                  </Link>
                  <Link
                    to={`/booking?artistId=${artist.id}`}
                    className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-semibold text-center shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5 group/btn"
                  >
                    <span>Đặt Lịch Ngay</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Call to action section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white p-8 sm:p-12 shadow-xl shadow-rose-500/20">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Bạn Chưa Biết Chọn Ai Phù Hợp Với Mình?
            </h2>
            <p className="text-rose-100 text-sm sm:text-base leading-relaxed">
              Mọi chuyên viên của chúng tôi đều có kỹ năng vững vàng ở tất cả các layout. Hãy đặt lịch ngay hoặc liên hệ để được hỗ trợ chuyên gia tốt nhất theo lịch trình của bạn.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/booking"
                className="px-6 py-3 rounded-2xl bg-white text-rose-600 font-bold text-xs hover:bg-rose-50 transition-all shadow-md"
              >
                Đặt Lịch Hẹn Ngay
              </Link>
              <a
                href="tel:0901234567"
                className="px-6 py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold text-xs transition-all flex items-center gap-2"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Hotline: 090 123 4567</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ArtistsPage;
