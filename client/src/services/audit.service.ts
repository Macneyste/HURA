import api from './api';
import type { ApiResponse } from '../types';
export interface AuditLog { _id: string; action: string; targetType?: string; ipAddress?: string; createdAt: string; userId?: { fullName: string; email: string; role: string }; }
export const auditService = { list: (page = 1) => api.get<ApiResponse<AuditLog[]>>('/audit-logs', { params: { page, limit: 20 } }) };
