import axiosInstance from './axiosInstance';

export const scheduleService = {
  // Lấy danh sách lịch làm việc và ngày nghỉ (Admin)
  async getAdminSchedules(startDate, endDate) {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await axiosInstance.get('/api/v1/admin/schedules', { params });
    return Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
  },

  // Đánh dấu ngày nghỉ hoặc đổi trạng thái làm việc (Admin)
  async setDayOff(payload) {
    const res = await axiosInstance.post('/api/v1/admin/schedules/day-off', payload);
    return res?.data || res;
  },

  // Xóa bản ghi lịch
  async deleteSchedule(id) {
    const res = await axiosInstance.delete(`/api/v1/admin/schedules/${id}`);
    return res;
  }
};

export default scheduleService;
