import axiosInstance from './axiosInstance';

export const serviceService = {
  // Lấy tất cả dịch vụ active
  async getServices() {
    const response = await axiosInstance.get('/api/v1/services');
    return response.data || [];
  },

  // Lấy danh sách gói Combo kèm các món bên trong
  async getCombos() {
    const response = await axiosInstance.get('/api/v1/services/combos');
    return response.data || [];
  },

  // Lấy chi tiết một dịch vụ hoặc combo
  async getServiceById(id) {
    const response = await axiosInstance.get(`/api/v1/services/${id}`);
    return response.data;
  },

  // Admin hoặc Artist tạo dịch vụ / combo mới
  async createService(serviceData) {
    const response = await axiosInstance.post('/api/v1/services', serviceData);
    return response.data;
  },

  // Admin lấy tất cả dịch vụ (bao gồm cả đang ẩn/ngừng hoạt động)
  async getAllServicesForAdmin() {
    try {
      const response = await axiosInstance.get('/api/v1/services/admin/all');
      return response.data || [];
    } catch {
      // Fallback nếu API admin chưa reload
      const response = await axiosInstance.get('/api/v1/services');
      return response.data || [];
    }
  },

  // Cập nhật dịch vụ hoặc combo
  async updateService(id, serviceData) {
    const response = await axiosInstance.put(`/api/v1/services/${id}`, serviceData);
    return response.data;
  },

  // Bật/tắt trạng thái hoạt động (Active/Inactive)
  async toggleStatus(id, currentService) {
    try {
      const response = await axiosInstance.patch(`/api/v1/services/${id}/toggle-status`);
      return response.data;
    } catch (patchErr) {
      // Fallback: Nếu route PATCH chưa reload, cập nhật qua PUT updateService
      if (currentService) {
        const nextActive = !Boolean(currentService.active !== false);
        const payload = {
          serviceName: currentService.serviceName,
          price: currentService.price,
          duration: currentService.duration,
          description: currentService.description,
          image: currentService.image,
          isCombo: Boolean(currentService.isCombo),
          active: nextActive,
          comboItems: currentService.comboItems?.map((ci) => ({
            serviceId: ci.itemServiceId || ci.id,
            quantity: ci.quantity || 1,
          })) || [],
        };
        const response = await axiosInstance.put(`/api/v1/services/${id}`, payload);
        return response.data;
      }
      throw patchErr;
    }
  },

  // Xóa mềm dịch vụ
  async deleteService(id) {
    const response = await axiosInstance.delete(`/api/v1/services/${id}`);
    return response.data;
  }
};

