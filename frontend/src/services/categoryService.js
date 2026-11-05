import axiosInstance from './axiosInstance';

export const categoryService = {
  // Lấy tất cả danh mục dịch vụ đang hoạt động (Public)
  async getCategories() {
    const response = await axiosInstance.get('/api/v1/categories');
    return response.data || [];
  },

  // Lấy chi tiết 1 danh mục
  async getCategoryById(id) {
    const response = await axiosInstance.get(`/api/v1/categories/${id}`);
    return response.data;
  },

  // Admin lấy tất cả danh mục (kể cả đang ẩn)
  async getAllCategoriesForAdmin() {
    const response = await axiosInstance.get('/api/v1/admin/categories');
    return response.data || [];
  },

  // Admin tạo danh mục mới
  async createCategory(categoryData) {
    const response = await axiosInstance.post('/api/v1/admin/categories', categoryData);
    return response.data;
  },

  // Admin cập nhật danh mục
  async updateCategory(id, categoryData) {
    const response = await axiosInstance.put(`/api/v1/admin/categories/${id}`, categoryData);
    return response.data;
  },

  // Admin bật/tắt trạng thái hiển thị
  async toggleStatus(id) {
    const response = await axiosInstance.patch(`/api/v1/admin/categories/${id}/toggle-status`);
    return response.data;
  },

  // Admin xóa danh mục
  async deleteCategory(id) {
    const response = await axiosInstance.delete(`/api/v1/admin/categories/${id}`);
    return response.data;
  }
};
