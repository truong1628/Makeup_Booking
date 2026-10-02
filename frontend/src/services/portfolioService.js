import axiosInstance from './axiosInstance';

export const portfolioService = {
  /**
   * Khách hàng / Khách vãng lai xem danh sách tác phẩm bộ sưu tập
   * @param {Object} params - { artistId, category, search }
   */
  async getPortfolios(params = {}) {
    const query = new URLSearchParams();
    if (params.artistId) query.append('artistId', params.artistId);
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.search) query.append('search', params.search);

    const qs = query.toString();
    const url = `/api/v1/portfolios${qs ? `?${qs}` : ''}`;
    const response = await axiosInstance.get(url);
    return response.data || [];
  },

  /**
   * Lấy danh sách các danh mục / phong cách tác phẩm
   */
  async getCategories() {
    const response = await axiosInstance.get('/api/v1/portfolios/categories');
    return response.data || [];
  },

  /**
   * Xem chi tiết tác phẩm (tự động tăng viewCount)
   */
  async getPortfolioById(id) {
    const response = await axiosInstance.get(`/api/v1/portfolios/${id}`);
    return response.data;
  },

  /**
   * Nghệ sĩ lấy danh sách các tác phẩm trong bộ sưu tập của mình
   */
  async getMyPortfolios() {
    const response = await axiosInstance.get('/api/v1/artist/portfolios');
    return response.data || [];
  },

  /**
   * Nghệ sĩ đăng tác phẩm mới
   */
  async createPortfolio(data) {
    const response = await axiosInstance.post('/api/v1/artist/portfolios', data);
    return response.data;
  },

  /**
   * Nghệ sĩ cập nhật tác phẩm
   */
  async updatePortfolio(id, data) {
    const response = await axiosInstance.put(`/api/v1/artist/portfolios/${id}`, data);
    return response.data;
  },

  /**
   * Nghệ sĩ xóa tác phẩm
   */
  async deletePortfolio(id) {
    const response = await axiosInstance.delete(`/api/v1/artist/portfolios/${id}`);
    return response.data;
  }
};
