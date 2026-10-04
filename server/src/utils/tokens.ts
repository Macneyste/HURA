import jwt from 'jsonwebtoken'; import crypto from 'crypto'; import { env } from '../config/env.js'; import type { IUser } from '../models/User.js';
const sign = (payload: object, secret: string, expiresIn: string) => jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
export const signAccessToken = (user: IUser) => sign({ sub: user._id.toString(), role: user.role }, env.JWT_ACCESS_SECRET, env.ACCESS_TOKEN_EXPIRES);
export const signRefreshToken = (user: IUser) => sign({ sub: user._id.toString() }, env.JWT_REFRESH_SECRET, env.REFRESH_TOKEN_EXPIRES);
export const verifyAccessToken = (token: string) => jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
export const verifyRefreshToken = (token: string) => jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
export const randomToken = () => crypto.randomBytes(32).toString('hex');
