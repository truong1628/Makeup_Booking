import axiosInstance from './axiosInstance';

export const layoutService = {
  // Lấy danh sách phong cách trang điểm đang hoạt động (cho khách đặt lịch)
  async getLayouts() {
    const response = await axiosInstance.get('/api/v1/layouts');
    return response.data || [];
  },

  // Lấy chi tiết 1 layout
  async getLayoutById(id) {
    const response = await axiosInstance.get(`/api/v1/layouts/${id}`);
    return response.data;
  },

  // Admin lấy toàn bộ danh sách layout (kể cả đang ẩn)
  async getAllLayoutsForAdmin() {
    const response = await axiosInstance.get('/api/v1/admin/layouts');
    return response.data || [];
  },

  // Admin tạo layout mới
  async createLayout(layoutData) {
    const response = await axiosInstance.post('/api/v1/admin/layouts', layoutData);
    return response.data;
  },

  // Admin cập nhật layout
  async updateLayout(id, layoutData) {
    const response = await axiosInstance.put(`/api/v1/admin/layouts/${id}`, layoutData);
    return response.data;
  },

  // Admin bật/tắt trạng thái hiển thị
  async toggleStatus(id) {
    const response = await axiosInstance.patch(`/api/v1/admin/layouts/${id}/toggle-status`);
    return response.data;
  },

  // Admin xóa layout
  async deleteLayout(id) {
    const response = await axiosInstance.delete(`/api/v1/admin/layouts/${id}`);
    return response.data;
  }
};
