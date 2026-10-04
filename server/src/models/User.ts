import { Schema, model, type HydratedDocument } from 'mongoose';
export const ROLES = ['SUPER_ADMIN','ADMIN','STUDENT','LECTURER','HOD','FINANCE'] as const;
export type UserRole = typeof ROLES[number];
export interface IUser { _id: string; fullName: string; email: string; phone?: string; passwordHash: string; role: UserRole; avatar?: string; isActive: boolean; isVerified: boolean; lastLogin?: Date; createdAt: Date; updatedAt: Date; }
const userSchema = new Schema<IUser>({ fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 }, email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true }, phone: { type: String, trim: true, match: [/^\+?[0-9\s-]{7,20}$/, 'Invalid phone number'] }, passwordHash: { type: String, required: true, select: false }, role: { type: String, enum: ROLES, required: true, default: 'STUDENT', index: true }, avatar: String, isActive: { type: Boolean, default: true, index: true }, isVerified: { type: Boolean, default: false }, lastLogin: Date }, { timestamps: true, toJSON: { transform: (_d, r: Record<string, unknown>) => { delete r.passwordHash; delete r.__v; return r; } } });
export type UserDocument = HydratedDocument<IUser>;
export const User = model<IUser>('User', userSchema);
