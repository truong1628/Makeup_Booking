import axiosInstance from './axiosInstance';

export const voucherService = {
  // Public APIs
  getActiveVouchers: async () => {
    const response = await axiosInstance.get('/api/v1/vouchers');
    return response.data;
  },

  applyVoucher: async (code, orderAmount) => {
    const response = await axiosInstance.post('/api/v1/vouchers/apply', {
      code,
      orderAmount,
    });
    return response.data;
  },

  getMyVoucherSummary: async () => {
    const response = await axiosInstance.get('/api/v1/vouchers/my-summary');
    return response.data;
  },

  // Admin APIs
  getAllVouchersForAdmin: async () => {
    const response = await axiosInstance.get('/api/v1/admin/vouchers');
    return response.data;
  },

  assignVoucherToUser: async (data) => {
    const response = await axiosInstance.post('/api/v1/admin/vouchers/assign', data);
    return response.data;
  },

  getCustomersForVoucher: async () => {
    const response = await axiosInstance.get('/api/v1/admin/vouchers/customers');
    return response.data;
  },

  getVoucherById: async (id) => {
    const response = await axiosInstance.get(`/api/v1/admin/vouchers/${id}`);
    return response.data;
  },

  createVoucher: async (data) => {
    const response = await axiosInstance.post('/api/v1/admin/vouchers', data);
    return response.data;
  },

  updateVoucher: async (id, data) => {
    const response = await axiosInstance.put(`/api/v1/admin/vouchers/${id}`, data);
    return response.data;
  },

  toggleStatus: async (id) => {
    const response = await axiosInstance.patch(`/api/v1/admin/vouchers/${id}/toggle-status`);
    return response.data;
  },

  deleteVoucher: async (id) => {
    const response = await axiosInstance.delete(`/api/v1/admin/vouchers/${id}`);
    return response.data;
  },
};

export default voucherService;
