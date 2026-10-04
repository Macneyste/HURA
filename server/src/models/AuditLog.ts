import { Schema, model } from 'mongoose';
export const AUDIT_ACTIONS = ['LOGIN','LOGOUT','CREATE_USER','UPDATE_USER','DELETE_USER','CHANGE_ROLE','CHANGE_PASSWORD','ACTIVATE_USER','DEACTIVATE_USER'] as const;
const auditSchema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: 'User', index: true }, action: { type: String, enum: AUDIT_ACTIONS, required: true }, targetId: String, targetType: String, ipAddress: String, userAgent: String, metadata: Schema.Types.Mixed }, { timestamps: { createdAt: true, updatedAt: false } });
auditSchema.index({ createdAt: -1 }); export const AuditLog = model('AuditLog', auditSchema);
