import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, Calendar, Heart, ShieldCheck, Clock, MapPin, 
  ArrowRight, Star, CheckCircle, Users
} from 'lucide-react';
import { serviceService } from '../services/serviceService';
import { formatCurrency } from '../utils/format';

const cleanTitle = (name) => {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)/g, '').trim();
};

const HomePage = () => {
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await serviceService.getServices();
        setFeaturedServices(data.slice(0, 4));
      } catch (err) {
        console.error('Không thể tải dịch vụ:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <div className="space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
        {/* Subtle decorative circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-rose-200/40 via-pink-100/30 to-amber-100/30 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left copy */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100/80 border border-rose-200 text-rose-800 text-xs font-semibold tracking-wide">
                <Sparkles className="w-4 h-4 text-rose-600" />
                <span>Nghệ Thuật Tôn Vinh Nét Đẹp Độc Bản</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Tỏa sáng rạng rỡ trong mọi <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500">khoảnh khắc</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Dịch vụ makeup cô dâu, dạ tiệc và kỷ yếu hàng đầu. Đặt lịch linh hoạt tại Studio sang trọng hoặc phục vụ tận nơi tại Nhà với chuyên gia trang điểm chuyên nghiệp.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/booking"
                  id="btn-hero-book-now"
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-700 hover:to-pink-700 text-white font-semibold shadow-xl shadow-rose-500/25 hover:shadow-2xl hover:shadow-rose-500/35 hover:-translate-y-0.5 transition-all text-center flex items-center justify-center gap-2.5"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Đặt Lịch Hẹn Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/services"
                  id="btn-hero-view-services"
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-semibold border border-slate-200 shadow-sm hover:shadow transition-all text-center"
                >
                  Xem Bảng Giá & Combo
                </Link>
              </div>

              {/* Trust badges */}
              <div className="pt-6 grid grid-cols-3 gap-6 border-t border-slate-200/80 max-w-lg mx-auto lg:mx-0">
                <div>
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">5,000+</p>
                  <p className="text-xs text-slate-500 font-medium">Khách Hàng Hài Lòng</p>
                </div>
                <div>
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">10+ Năm</p>
                  <p className="text-xs text-slate-500 font-medium">Kinh Nghiệm Nghề</p>
                </div>
                <div>
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">4.9 / 5.0</p>
                  <p className="text-xs text-slate-500 font-medium">Đánh Giá Xuất Sắc</p>
                </div>
              </div>
            </div>

            {/* Right visual card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100 aspect-[4/5]">
                  <img
                    src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1000&q=80"
                    alt="Lumière Glam Makeup Art"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  
                  {/* Floating badge inside image */}
                  <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl glass-card text-slate-800 shadow-lg border border-white/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Top Trending 2026</p>
                        <p className="text-base font-bold text-slate-900">Makeup Tone Tây & Hàn Quốc</p>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold text-amber-800">4.98</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating pill badge */}
                <div className="absolute -top-4 -left-4 px-4 py-2.5 rounded-2xl bg-white shadow-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Cam Kết Hài Lòng</p>
                    <p className="text-[11px] text-slate-500">Mỹ phẩm High-end 100%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold tracking-widest text-rose-600 uppercase">
            Danh Mục Nổi Bật
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-slate-900">
            Dịch Vụ & Gói Combo Chuyên Nghiệp
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Được thiết kế tinh tế nhằm đáp ứng hoàn hảo cho từng phong cách và sự kiện đặc biệt của bạn.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-72 rounded-3xl bg-slate-200/70 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredServices.map((service) => (
              <div
                key={service.id}
                className={`rounded-3xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden group ${
                  service.isCombo
                    ? 'bg-white border-2 border-amber-400 ring-4 ring-amber-400/20 shadow-lg shadow-amber-500/10 hover:shadow-2xl hover:shadow-amber-500/25'
                    : 'bg-white border border-slate-200 shadow-sm hover:shadow-xl'
                }`}
              >
                {/* Image Container with Title & Price OVERLAID directly on it */}
                <Link to={`/services/${service.id}`} className="block relative aspect-[4/5] bg-slate-900 overflow-hidden cursor-pointer">
                  <img
                    src={service.image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'}
                    alt={cleanTitle(service.serviceName)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Dark Gradient Overlay for high-contrast legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    {service.isCombo ? (
                      <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white text-[11px] font-bold shadow-lg flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                        <span>Combo Hot</span>
                      </span>
                    ) : (
                      <span />
                    )}
                    <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-300" />
                      <span>{service.duration}p</span>
                    </div>
                  </div>

                  {/* Bottom Content OVERLAID on image: Tên dịch vụ & Giá */}
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col justify-end pointer-events-none">
                    <h3 className="text-white font-bold text-base sm:text-lg leading-snug drop-shadow-md group-hover:text-rose-300 transition-colors break-words">
                      {cleanTitle(service.serviceName)}
                    </h3>

                    <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-white/20">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg sm:text-xl font-bold text-amber-300 drop-shadow-md">
                          {formatCurrency(service.price)}
                        </span>
                        <span className="text-[11px] text-slate-300">/ buổi</span>
                      </div>
                      {service.isCombo && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/25 border border-amber-300/40 text-amber-200">
                          Tiết kiệm
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Card Bottom Actions: Nút Chi Tiết & Nút Đặt Lịch */}
                <div className="p-3 sm:p-3.5 bg-white border-t border-slate-100 grid grid-cols-2 gap-2">
                  <Link
                    to={`/services/${service.id}`}
                    id={`btn-home-detail-service-${service.id}`}
                    className={`py-2 px-2 rounded-full text-center text-xs font-bold transition-all border flex items-center justify-center ${
                      service.isCombo
                        ? 'border-amber-300 text-amber-900 hover:bg-amber-100 bg-amber-50/60'
                        : 'border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50'
                    }`}
                  >
                    Chi Tiết
                  </Link>

                  <Link
                    to={`/booking?serviceId=${service.id}`}
                    id={`btn-home-book-service-${service.id}`}
                    className={`py-2 px-2 rounded-full text-center text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1 text-white ${
                      service.isCombo
                        ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 hover:from-amber-600 hover:to-rose-700 shadow-amber-500/25'
                        : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Đặt Lịch</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700 underline underline-offset-4"
          >
            <span>Xem tất cả danh mục dịch vụ & gói ưu đãi</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Booking Process Steps */}
      <section className="bg-gradient-to-b from-rose-50/50 to-white py-20 border-y border-rose-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold tracking-widest text-rose-600 uppercase">Quy Trình Tiện Lợi</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Chỉ 3 Bước Đơn Giản Để Đặt Lịch
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold font-serif shadow-inner">
                01
              </div>
              <h3 className="text-xl font-bold text-slate-900">Chọn Dịch Vụ & Hình Thức</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Lựa chọn dịch vụ đơn hoặc gói Combo. Đặt lịch tại Studio hoặc yêu cầu thợ đến trang điểm tại Nhà riêng.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold font-serif shadow-inner">
                02
              </div>
              <h3 className="text-xl font-bold text-slate-900">Chọn Thời Gian & Chế Độ</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Linh hoạt chọn ngày, giờ và chế độ thực hiện: ca đơn (SINGLE), nối tiếp (SEQUENTIAL) hoặc đồng thời nhiều thợ (PARALLEL).
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mx-auto text-xl font-bold font-serif shadow-inner">
                03
              </div>
              <h3 className="text-xl font-bold text-slate-900">Thanh Toán Cọc & Xác Nhận</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Hệ thống tự động tính tiền cọc 30% minh bạch. Nhận ngay thông tin thợ phụ trách và xác nhận lịch hẹn tức thì.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
