import { Schema, model } from 'mongoose';
const roleSchema = new Schema({ name: { type: String, required: true, unique: true }, permissions: [{ type: String }], description: String }, { timestamps: true });
export const Role = model('Role', roleSchema);
