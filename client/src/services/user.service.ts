import api from './api';
import type { ApiResponse, User } from '../types';
export const userService = {
  list: (params: Record<string, string | number | undefined>) => api.get<ApiResponse<User[]>>('/users', { params }),
  get: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`),
  create: (payload: Partial<User> & { password: string }) => api.post('/users', payload),
  update: (id: string, payload: Partial<User>) => api.patch(`/users/${id}`, payload),
  updateStatus: (id: string, isActive: boolean) => api.patch(`/users/${id}/status`, { isActive })
};
