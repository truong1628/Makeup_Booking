import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Star, Calendar, Clock, Award, CheckCircle,
  Phone, Mail, ArrowRight, Heart, ShieldCheck
} from 'lucide-react';
import { bookingService } from '../services/bookingService';

const ArtistsPage = () => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const data = await bookingService.getArtists();
        setArtists(data || []);
      } catch (err) {
        console.error('Không thể tải danh sách chuyên viên:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* Header Banner */}
      <section className="relative overflow-hidden pt-12 pb-16 bg-gradient-to-b from-rose-50/70 via-pink-50/30 to-transparent">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 border border-rose-200 text-rose-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>Đội Ngũ Nghệ Sĩ Chuyên Nghiệp</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
            Chuyên Viên <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500">Trang Điểm</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Hội tụ những Makeup Artist tài năng, được đào tạo bài bản với phong cách trang điểm tinh tế, gu thẩm mỹ thời thượng và tận tâm với từng khách hàng.
          </p>
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
            <p className="text-base font-semibold text-slate-700">Hiện tại chưa có chuyên viên khả dụng</p>
            <p className="text-sm text-slate-500 mt-1">Vui lòng quay lại sau hoặc liên hệ hotline để được hỗ trợ.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {artists.map((artist, idx) => {
              const defaultAvatars = [
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
                'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80',
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
                'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80',
              ];
              const avatarUrl = defaultAvatars[idx % defaultAvatars.length];

              return (
                <div
                  key={artist.id}
                  className="group rounded-3xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div className="space-y-5">
                    {/* Top profile header */}
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-md ring-2 ring-rose-100 group-hover:ring-rose-300 transition-all shrink-0">
                        <img
                          src={avatarUrl}
                          alt={artist.fullName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-amber-500 mb-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                          <span className="text-xs font-bold text-slate-800">4.9 / 5.0</span>
                          <span className="text-[11px] text-slate-400">• Đánh giá cao</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-rose-600 transition-colors truncate">
                          {artist.fullName}
                        </h3>
                        <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                          <Award className="w-3.5 h-3.5" />
                          <span>{artist.experience || 'Chuyên gia cao cấp'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Specialties / Tags */}
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Sở trường phong cách
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(artist.specialties ? artist.specialties.split(',') : ['Cô dâu', 'Dự tiệc', 'Chụp ảnh'])
                          .map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-medium"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                      </div>
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
                      to={`/collections`}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 text-xs font-semibold text-center transition-all"
                    >
                      Xem Tác Phẩm
                    </Link>
                    <Link
                      to={`/booking`}
                      className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-semibold text-center shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-1"
                    >
                      <span>Đặt Lịch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Trust banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative z-10">
            <div className="space-y-2">
              <ShieldCheck className="w-8 h-8 text-rose-400 mx-auto" />
              <h4 className="text-lg font-bold">100% Chuyên Môn Cao</h4>
              <p className="text-xs text-slate-400">Được đào tạo chuẩn quốc tế và liên tục cập nhật xu hướng mới</p>
            </div>
            <div className="space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="text-lg font-bold">Mỹ Phẩm Cao Cấp</h4>
              <p className="text-xs text-slate-400">Chỉ sử dụng mỹ phẩm chính hãng Dior, Chanel, MAC, NARS an toàn cho da</p>
            </div>
            <div className="space-y-2">
              <Heart className="w-8 h-8 text-pink-400 mx-auto" />
              <h4 className="text-lg font-bold">Tận Tâm Phục Vụ</h4>
              <p className="text-xs text-slate-400">Lắng nghe mong muốn và tư vấn layout trang điểm phù hợp gương mặt bạn</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ArtistsPage;
