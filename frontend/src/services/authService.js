import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  getProfile: () => api.get('/auth/profile'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  registerFace: (data) => api.post('/auth/face-register', data),
  faceLogin: (data) => api.post('/auth/face-login', data),
  revokeSession: (sessionId) => api.delete(`/auth/sessions/${sessionId}`),

  // Admin
  getAdminStats: () => api.get('/auth/admin/stats'),
  getAdminUsers: (params) => api.get('/auth/admin/users', { params }),
  getAdminLoginLogs: (params) => api.get('/auth/admin/login-logs', { params }),
};

export default authService;
