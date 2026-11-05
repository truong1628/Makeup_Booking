import axiosInstance from './axiosInstance';

export const userService = {
  // Lấy thông tin hồ sơ người dùng
  async getProfile() {
    const res = await axiosInstance.get('/api/v1/users/profile');
    return res.data;
  },

  // Cập nhật thông tin cá nhân (họ tên, phone, avatar, address)
  async updateProfile(profileData) {
    const res = await axiosInstance.put('/api/v1/users/profile', profileData);
    return res.data;
  },

  // Đổi mật khẩu tài khoản
  async changePassword(passwordData) {
    const res = await axiosInstance.put('/api/v1/users/change-password', passwordData);
    return res;
  },
};
