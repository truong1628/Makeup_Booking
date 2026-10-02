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
  }
};
