import { Schema, model } from 'mongoose';
const resetSchema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, tokenHash: { type: String, required: true }, expiresAt: { type: Date, required: true, index: { expires: 0 } }, usedAt: Date }, { timestamps: true });
export const PasswordResetToken = model('PasswordResetToken', resetSchema);
