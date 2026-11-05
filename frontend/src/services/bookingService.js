import axiosInstance from './axiosInstance';

export const bookingService = {
  // Tạo đơn đặt lịch mới
  async createBooking(bookingData) {
    const response = await axiosInstance.post('/api/v1/bookings', bookingData);
    return response.data;
  },

  // Ước tính các phương án điều phối thợ theo số người và thời gian hoàn thành (Model 2)
  async getDispatchOptions(payload) {
    const response = await axiosInstance.post('/api/v1/bookings/dispatch-options', payload);
    return response.data || [];
  },

  // Khách hàng lấy danh sách lịch hẹn của mình
  async getMyBookings() {
    const response = await axiosInstance.get('/api/v1/bookings/my-bookings');
    return response.data || [];
  },

  // Admin lấy toàn bộ danh sách đơn đặt lịch hẹn
  async getAllBookings() {
    try {
      const response = await axiosInstance.get('/api/v1/bookings/all');
      return response.data || [];
    } catch {
      // Fallback về getMyBookings nếu cần
      const response = await axiosInstance.get('/api/v1/bookings/my-bookings');
      return response.data || [];
    }
  },

  // Admin cập nhật trạng thái đơn hẹn
  async updateStatus(id, status) {
    const response = await axiosInstance.patch(`/api/v1/bookings/${id}/status?status=${status}`);
    return response.data;
  },

  // Admin xác nhận đã chuyển khoản hoàn cọc cho khách
  async confirmRefund(id) {
    const response = await axiosInstance.post(`/api/v1/bookings/${id}/confirm-refund`);
    return response.data;
  },

  // Admin xác nhận đã thu đủ tiền từ khách hàng
  async collectPayment(id) {
    const response = await axiosInstance.post(`/api/v1/bookings/${id}/collect-payment`);
    return response.data;
  },

  // Xem chi tiết đơn hẹn
  async getBookingById(id) {
    const response = await axiosInstance.get(`/api/v1/bookings/${id}`);
    return response.data;
  },

  // Kiểm tra khả dụng của khung giờ
  async checkAvailability(artistId, date, startTime, endTime) {
    const response = await axiosInstance.get('/api/v1/bookings/check-availability', {
      params: { artistId, date, startTime, endTime },
    });
    return response.data;
  },

  // Lấy danh sách chuyên viên makeup khả dụng
  async getArtists() {
    const response = await axiosInstance.get('/api/v1/bookings/artists');
    return response.data || [];
  },

  // Tạo URL thanh toán VNPay
  async createVNPayUrl(bookingId) {
    const response = await axiosInstance.post('/api/v1/payments/create-vnpay-url', { bookingId });
    return response.data;
  },

  // Xác thực kết quả thanh toán VNPay khi khách quay lại website (Return URL)
  async verifyVNPayReturn(queryString) {
    const response = await axiosInstance.get(`/api/v1/payments/vnpay-return${queryString}`);
    return response.data;
  },

  // Xác nhận thanh toán cọc VNPay thành công (fallback/sandbox)
  async confirmVNPay(bookingId, transactionCode) {
    const response = await axiosInstance.post('/api/v1/payments/confirm-vnpay', { 
      bookingId, 
      transactionCode 
    });
    return response.data;
  },

  // Xác nhận thanh toán trực tiếp tại Studio (CASH)
  async payAtStudio(bookingId) {
    const response = await axiosInstance.post('/api/v1/payments/pay-at-studio', { bookingId });
    return response.data;
  },

  // Gửi đánh giá cho đơn hẹn
  async submitReview(bookingId, rating, comment) {
    const response = await axiosInstance.post('/api/v1/reviews', {
      bookingId,
      rating,
      comment
    });
    return response.data;
  },

  // Lấy thông tin đánh giá của đơn hẹn
  async getReviewByBooking(bookingId) {
    const response = await axiosInstance.get(`/api/v1/reviews/booking/${bookingId}`);
    return response.data;
  },

  // Lấy danh sách đánh giá công khai cho một dịch vụ
  async getReviewsByService(serviceId) {
    try {
      const response = await axiosInstance.get(`/api/v1/reviews/service/${serviceId}`);
      return response.data || [];
    } catch {
      return [];
    }
  },

  // Hủy lịch hẹn (dành cho khách hàng sở hữu đơn hoặc Admin)
  async cancelBooking(id, reason) {
    const response = await axiosInstance.post(`/api/v1/bookings/${id}/cancel`, { reason });
    return response.data;
  },

  // Khách hàng chỉnh sửa đơn hẹn (trước ít nhất 12 giờ so với giờ bắt đầu)
  async updateBooking(id, payload) {
    const response = await axiosInstance.put(`/api/v1/bookings/${id}`, payload);
    return response.data;
  },

  // Admin lấy danh sách các ca xin hủy/đổi thợ
  async getCancellationRequests(status = 'PENDING') {
    const response = await axiosInstance.get('/api/v1/admin/cancellation-requests', {
      params: { status }
    });
    return response.data || [];
  },

  // Admin duyệt hủy ca và chuyển sang cho thợ mới
  async approveCancellationRequest(itemId, newArtistId, adminNote = '') {
    const response = await axiosInstance.post(`/api/v1/admin/cancellation-requests/${itemId}/approve`, {
      newArtistId,
      adminNote
    });
    return response.data;
  },

  // Admin từ chối yêu cầu hủy ca
  async rejectCancellationRequest(itemId, adminNote = '') {
    const response = await axiosInstance.post(`/api/v1/admin/cancellation-requests/${itemId}/reject`, {
      adminNote
    });
    return response.data;
  },

  // Admin lấy danh sách thợ khả dụng cho một ca làm việc cụ thể
  async getAvailableArtistsForItem(itemId) {
    const response = await axiosInstance.get(`/api/v1/admin/bookings/items/${itemId}/available-artists`);
    return response.data || [];
  },

  // Admin chủ động thay đổi / phân công lại thợ makeup cho ca làm việc
  async reassignArtist(itemId, newArtistId, adminNote = '') {
    const response = await axiosInstance.post(`/api/v1/admin/bookings/items/${itemId}/reassign-artist`, {
      newArtistId,
      adminNote
    });
    return response.data;
  }
};


