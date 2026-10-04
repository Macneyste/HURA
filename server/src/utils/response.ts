import type { Response } from 'express';
export const success = <T>(res: Response, status: number, message: string, data: T, meta?: Record<string, unknown>) => res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });
