export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'STUDENT' | 'LECTURER' | 'HOD' | 'FINANCE';
export interface User { _id: string; fullName: string; email: string; phone?: string; role: Role; avatar?: string; isActive: boolean; isVerified: boolean; lastLogin?: string; createdAt?: string; }
export interface ApiResponse<T> { success: boolean; message: string; data: T; meta?: { page?: number; limit?: number; total?: number; pages?: number }; }
