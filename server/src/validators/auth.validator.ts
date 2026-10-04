import { z } from 'zod';
const password = z.string().min(8).max(128).regex(/[A-Z]/, 'Password requires an uppercase letter').regex(/[a-z]/, 'Password requires a lowercase letter').regex(/\d/, 'Password requires a number');
export const registerSchema = z.object({ body: z.object({ fullName: z.string().min(2).max(120), email: z.string().email(), phone: z.string().regex(/^\+?[0-9\s-]{7,20}$/).optional(), password, role: z.enum(['SUPER_ADMIN','ADMIN','STUDENT','LECTURER','HOD','FINANCE']).optional() }) });
export const loginSchema = z.object({ body: z.object({ identifier: z.string().min(3), password: z.string().min(1), remember: z.boolean().optional() }) });
export const forgotSchema = z.object({ body: z.object({ email: z.string().email() }) }); export const resetSchema = z.object({ body: z.object({ token: z.string().min(20), password }) }); export const changePasswordSchema = z.object({ body: z.object({ currentPassword: z.string().min(1), newPassword: password }) });
