import type { Request } from 'express'; import { AuditLog } from '../models/AuditLog.js';
export const audit = async (req: Request, action: string, targetId?: string, targetType?: string, metadata?: object) => { await AuditLog.create({ userId: req.user?._id, action, targetId, targetType, metadata, ipAddress: req.ip, userAgent: req.get('user-agent') }); };
