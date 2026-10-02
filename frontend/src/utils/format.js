// Utility định dạng tiền tệ, ngày giờ và trạng thái

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  return timeStr.substring(0, 5); // '09:00:00' -> '09:00'
};

export const getStatusBadge = (status) => {
  switch (status) {
    case 'PENDING_PAYMENT':
      return { text: 'Chờ đặt cọc', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    case 'CONFIRMED':
      return { text: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    case 'COMPLETED':
      return { text: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'CANCELLED':
      return { text: 'Đã hủy', color: 'bg-rose-100 text-rose-800 border-rose-300' };
    default:
      return { text: status, color: 'bg-slate-100 text-slate-800 border-slate-300' };
  }
};

/**
 * Tính phụ phí di chuyển theo khoảng cách (km) từ Studio:
 * - Dưới 10km: Miễn phí (0 ₫)
 * - 10km - 20km: 100.000 ₫
 * - 20km - 100km: 200.000 ₫
 * - 100km - 200km: 300.000 ₫
 * - Trên 200km: null (Không nhận đơn)
 */
export const calculateTravelFee = (distanceKm) => {
  const dist = Number(distanceKm) || 0;
  if (dist <= 0) return 0;
  if (dist > 200) return null; // Vượt quá bán kính 200km
  if (dist < 10) return 0;
  if (dist <= 20) return 100000;
  if (dist <= 100) return 200000;
  return 300000;
};
