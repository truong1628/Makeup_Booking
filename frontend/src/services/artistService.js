import axiosInstance from './axiosInstance';

export const artistService = {
  // Lấy các ca làm việc được giao cho thợ
  async getMyAssignments() {
    const res = await axiosInstance.get('/api/v1/artist/assignments');
    return res.data || [];
  },

  // Lấy lịch làm việc và ngày nghỉ của thợ
  async getMySchedules() {
    const res = await axiosInstance.get('/api/v1/artist/schedules');
    return res.data || [];
  },

  // Đăng ký ngày nghỉ phép
  async registerDayOff(scheduleDate) {
    const res = await axiosInstance.post('/api/v1/artist/schedules/day-off', { scheduleDate });
    return res.data;
  },

  // Xem hồ sơ chuyên môn thợ
  async getProfile() {
    const res = await axiosInstance.get('/api/v1/artist/profile');
    return res.data;
  },

  // Cập nhật hồ sơ chuyên môn
  async updateProfile(profileData) {
    const res = await axiosInstance.put('/api/v1/artist/profile', profileData);
    return res.data;
  },

  // Cập nhật trạng thái ca làm việc (IN_PROGRESS, COMPLETED)
  async updateAssignmentStatus(bookingId, status) {
    const res = await axiosInstance.patch(`/api/v1/artist/assignments/${bookingId}/status?status=${status}`);
    return res.data;
  },

  // Chuyên gia xác nhận đã thu tiền từ khách hàng
  async collectPayment(bookingId) {
    const res = await axiosInstance.post(`/api/v1/artist/assignments/${bookingId}/collect-payment`);
    return res.data;
  },

  // Thợ yêu cầu hủy ca làm việc
  async requestCancelAssignment(itemId, reason) {
    const res = await axiosInstance.post(`/api/v1/artist/assignments/${itemId}/request-cancel`, { reason });
    return res.data;
  }
};
