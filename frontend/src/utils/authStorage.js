// Utility quản lý lưu trữ JWT Token và User Info trong LocalStorage

const TOKEN_KEY = 'makeup_auth_token';
const USER_KEY = 'makeup_auth_user';

// Giải mã JWT Payload (Base64 URL)
export const parseJwt = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Lỗi khi giải mã JWT Token:', e);
    return null;
  }
};

export const authStorage = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  getUser() {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getJwtPayload() {
    const token = this.getToken();
    return parseJwt(token);
  },

  isTokenExpired() {
    const payload = this.getJwtPayload();
    if (!payload || !payload.exp) return true;
    // payload.exp tính theo giây, chuyển sang milliseconds
    return payload.exp * 1000 < Date.now();
  },

  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    if (this.isTokenExpired()) {
      this.clearAuth();
      return false;
    }
    return true;
  },

  getRole() {
    if (!this.isAuthenticated()) return null;
    // Ưu tiên đọc quyền trực tiếp từ claims bên trong JWT Token
    const payload = this.getJwtPayload();
    if (payload?.role) {
      return payload.role;
    }
    const user = this.getUser();
    return user?.role || null;
  },

  isAdmin() {
    return this.getRole() === 'ROLE_ADMIN';
  },

  isArtist() {
    return this.getRole() === 'ROLE_ARTIST';
  },

  isCustomer() {
    return this.getRole() === 'ROLE_CUSTOMER';
  }
};
