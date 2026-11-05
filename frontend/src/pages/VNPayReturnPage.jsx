import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Calendar, ShieldCheck, RefreshCw, CreditCard } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { formatCurrency } from '../utils/format';

const VNPayReturnPage = () => {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setLoading(true);
        if (!location.search) {
          throw new Error('Không tìm thấy thông tin phản hồi từ cổng thanh toán');
        }
        const data = await bookingService.verifyVNPayReturn(location.search);
        setResult(data);
        sessionStorage.removeItem('makeup_booking_draft');
      } catch (err) {
        console.error('Lỗi xác thực VNPay return:', err);
        setError(err.message || 'Không thể xác thực giao dịch thanh toán từ VNPay');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [location.search]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-12 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto animate-pulse">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">Đang Xác Thực Giao Dịch</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hệ thống đang tiến hành kiểm tra chữ ký checksum với máy chủ VNPay để đảm bảo giao dịch an toàn và chống giả mạo...
          </p>
        </div>
      </div>
    );
  }

  const isSuccess = result?.success && result?.responseCode === '00';

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-10 shadow-2xl max-w-lg w-full space-y-6">
        {/* Status Icon */}
        <div className="text-center space-y-2">
          {isSuccess ? (
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto ring-8 ring-rose-50/50 shadow-inner">
              <XCircle className="w-10 h-10" />
            </div>
          )}

          <h1 className="text-2xl font-black text-slate-900 pt-2">
            {isSuccess ? 'Thanh Toán Cọc Thành Công!' : 'Giao Dịch Chưa Hoàn Tất'}
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {isSuccess
              ? 'Lịch hẹn trang điểm của bạn đã được xác nhận. Chúng tôi đã gửi thông báo đến chuyên viên phục vụ bạn.'
              : (result?.message || error || 'Giao dịch qua cổng VNPay bị gián đoạn hoặc khách hàng đã hủy.')}
          </p>
        </div>

        {/* Transaction Details Card */}
        {result && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Mã Đơn Đặt Lịch:</span>
              <span className="font-bold text-slate-900 font-mono">#{result.bookingId}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Mã Giao Dịch VNPay:</span>
              <span className="font-bold text-slate-900 font-mono">{result.transactionCode || 'N/A'}</span>
            </div>
            {result.bankCode && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Ngân Hàng Thanh Toán:</span>
                <span className="font-semibold text-slate-800">{result.bankCode}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-600 border-t border-slate-200/60 pt-2">
              <span className="font-medium">Số Tiền Đã Cọc:</span>
              <span className="text-sm font-extrabold text-rose-600">
                {formatCurrency(result.amount)}
              </span>
            </div>
          </div>
        )}

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Giao dịch được bảo vệ và xác thực an toàn qua VNPay</span>
        </div>

        {/* Action buttons */}
        <div className="space-y-2 pt-2">
          {isSuccess ? (
            <Link
              to="/my-bookings"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Xem Lịch Hẹn Của Tôi</span>
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/my-bookings"
                className="py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <CreditCard className="w-4 h-4" />
                <span>Thanh Toán Lại</span>
              </Link>
              <Link
                to="/"
                className="py-3 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center transition-all"
              >
                Về Trang Chủ
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VNPayReturnPage;
