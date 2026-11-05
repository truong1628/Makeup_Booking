import axios from 'axios';
import { authStorage } from '../utils/authStorage';

// Base URL trỏ về API Spring Boot Backend (tự động nhận diện IP LAN khi mở qua --host)
const currentHost = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${currentHost}:8080`;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Dịch tự động các thông báo lỗi mặc định bằng tiếng Anh của Axios / trình duyệt sang Tiếng Việt
const translateErrorMessage = (rawMsg, status, fieldErrors) => {
  // Nếu có danh sách lỗi chi tiết từng trường từ Backend thì ghép lại thành câu tiếng Việt rõ ràng
  if (fieldErrors && typeof fieldErrors === 'object' && !Array.isArray(fieldErrors)) {
    const messages = Object.values(fieldErrors).filter((v) => typeof v === 'string' && v.trim() !== '');
    if (messages.length > 0 && (!rawMsg || rawMsg === 'Dữ liệu yêu cầu không hợp lệ')) {
      return messages.join('; ');
    }
  }

  if (!rawMsg || typeof rawMsg !== 'string') {
    return 'Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng thử lại!';
  }

  const lower = rawMsg.toLowerCase().trim();
  if (lower === 'network error' || lower.includes('failed to fetch')) {
    return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng hoặc đảm bảo Backend đang chạy!';
  }
  if (lower.includes('timeout of') && lower.includes('exceeded')) {
    return 'Yêu cầu phản hồi quá thời gian quy định. Vui lòng thử lại sau!';
  }
  if (lower.startsWith('request failed with status code')) {
    if (status === 400) return 'Dữ liệu gửi lên không hợp lệ, vui lòng kiểm tra lại thông tin.';
    if (status === 401) return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.';
    if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
    if (status === 404) return 'Không tìm thấy dữ liệu hoặc tài nguyên yêu cầu.';
    if (status === 409) return 'Dữ liệu bị trùng lặp với bản ghi đã có trong hệ thống.';
    if (status >= 500) return 'Máy chủ đang gặp sự cố xử lý, vui lòng thử lại sau.';
    return `Yêu cầu không thành công (Mã lỗi: ${status || 'Không xác định'})`;
  }
  if (lower === 'must not be blank' || lower === 'must not be empty') {
    return 'Thông tin bắt buộc không được để trống';
  }
  if (lower.startsWith('must be greater than')) {
    return 'Giá trị số nhập vào phải lớn hơn mức tối thiểu quy định';
  }

  return rawMsg;
};

axiosInstance.interceptors.request.use(
  (config) => {
    const token = authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const status = error.response ? error.response.status : null;
    const responseData = error.response ? error.response.data : null;

    if (status === 401) {
      console.warn('Phiên đăng nhập đã hết hạn hoặc không hợp lệ.');
      if (authStorage.getToken()) {
        authStorage.clearAuth();
      }
    }

    const rawMessage = responseData?.message || error.message;
    const errorMessage = translateErrorMessage(rawMessage, status, responseData?.data);

    const enhancedError = new Error(errorMessage);
    enhancedError.status = status;
    enhancedError.data = responseData?.data || null;
    enhancedError.originalError = error;

    return Promise.reject(enhancedError);
  }
);

export default axiosInstance;
