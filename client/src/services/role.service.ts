import api from './api';
import type { ApiResponse } from '../types';
export interface RoleRecord { _id: string; name: string; description?: string; permissions: string[]; createdAt?: string; }
export const roleService = { list: () => api.get<ApiResponse<RoleRecord[]>>('/roles'), create: (body: Pick<RoleRecord, 'name' | 'description' | 'permissions'>) => api.post('/roles', body), update: (id: string, body: Partial<RoleRecord>) => api.patch(`/roles/${id}`, body) };
