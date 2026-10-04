import api from './api';
import type { ApiResponse, User } from '../types';
export const authService = {
  login: (payload: { identifier: string; password: string; remember?: boolean }) => api.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<ApiResponse<User>>('/auth/me'),
  updateProfile: (payload: Pick<User, 'fullName' | 'phone' | 'avatar'>) => api.patch<ApiResponse<User>>('/auth/me', payload),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  changePassword: (currentPassword: string, newPassword: string) => api.post('/auth/change-password', { currentPassword, newPassword })
};
