import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { StudentProfile, LecturerProfile } from '../models/academic.models.js';
import { AppError } from '../utils/AppError.js';
import { success } from '../utils/response.js';
import { hashToken, randomToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';
import { env } from '../config/env.js';
import { audit } from '../services/audit.service.js';

const refreshCookie = (res: Response, token: string) =>
  res.cookie('huru_refresh_token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth'
  });

const safeUser = (user: any) => (user.toJSON ? user.toJSON() : user);

async function issueSession(res: Response, user: any) {
  const refresh = signRefreshToken(user);
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refresh),
    expiresAt: new Date(Date.now() + 7 * 86400000)
  });
  refreshCookie(res, refresh);
  return signAccessToken(user);
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password, ...input } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ ...input, passwordHash });
    req.user = user;
    await audit(req, 'CREATE_USER', user._id.toString(), 'User');
    const token = await issueSession(res, user);
    success(res, 201, 'Account created successfully', { user: safeUser(user), accessToken: token });
  } catch (e) {
    next(e);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier, password } = req.body;
    const cleanId = String(identifier || '').trim();

    let user = await User.findOne({
      $or: [
        { email: cleanId.toLowerCase() },
        { _id: /^[a-f\d]{24}$/i.test(cleanId) ? cleanId : null }
      ]
    }).select('+passwordHash');

    // Allow student login using Student ID (e.g. HU2026001)
    if (!user) {
      const student = await StudentProfile.findOne({
        studentId: cleanId.toUpperCase()
      }).lean();
      if (student && student.userId) {
        user = await User.findById(student.userId).select('+passwordHash');
      }
    }

    // Allow lecturer login using Employee ID (e.g. HU-L001)
    if (!user) {
      const lecturer = await LecturerProfile.findOne({
        employeeId: cleanId.toUpperCase()
      }).lean();
      if (lecturer && lecturer.userId) {
        user = await User.findById(lecturer.userId).select('+passwordHash');
      }
    }

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError(401, 'Invalid email, student ID, or password');
    }

    if (!user.isActive) throw new AppError(403, 'This account has been deactivated');

    user.lastLogin = new Date();
    await user.save();
    req.user = user;
    await audit(req, 'LOGIN', user._id.toString(), 'User');
    const token = await issueSession(res, user);
    success(res, 200, 'Signed in successfully', { user: safeUser(user), accessToken: token });
  } catch (e) {
    next(e);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = req.cookies?.huru_refresh_token;
    if (!raw) throw new AppError(401, 'Refresh token required');
    const payload = verifyRefreshToken(raw);
    const stored = await RefreshToken.findOne({
      userId: payload.sub,
      tokenHash: hashToken(raw),
      revokedAt: { $exists: false }
    });
    if (!stored) throw new AppError(401, 'Refresh token has been revoked');
    stored.revokedAt = new Date();
    await stored.save();
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) throw new AppError(401, 'Account is unavailable');
    const accessToken = await issueSession(res, user);
    success(res, 200, 'Session refreshed', { user: safeUser(user), accessToken });
  } catch (e) {
    next(e instanceof AppError ? e : new AppError(401, 'Invalid refresh token'));
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = req.cookies?.huru_refresh_token;
    if (raw)
      await RefreshToken.updateMany(
        { tokenHash: hashToken(raw), revokedAt: { $exists: false } },
        { revokedAt: new Date() }
      );
    if (req.user) await audit(req, 'LOGOUT', req.user._id.toString(), 'User');
    res.clearCookie('huru_refresh_token', { path: '/api/v1/auth' });
    success(res, 200, 'Signed out successfully', {});
  } catch (e) {
    next(e);
  }
};

export const me = async (req: Request, res: Response) =>
  success(res, 200, 'Current user retrieved successfully', safeUser(req.user));

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndUpdate(req.user!._id, req.body, { new: true, runValidators: true });
    if (!user) throw new AppError(404, 'User not found');
    await audit(req, 'UPDATE_USER', user._id.toString(), 'User', { selfService: true });
    success(res, 200, 'Profile updated successfully', safeUser(user));
  } catch (e) {
    next(e);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const raw = randomToken();
      await PasswordResetToken.create({
        userId: user._id,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      });
      if (env.NODE_ENV === 'development') console.info(`Password reset token for ${user.email}: ${raw}`);
    }
    success(res, 200, 'If the account exists, password reset instructions will be sent', {});
  } catch (e) {
    next(e);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = await PasswordResetToken.findOne({
      tokenHash: hashToken(req.body.token),
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() }
    });
    if (!token) throw new AppError(400, 'Reset link is invalid or expired');
    const user = await User.findById(token.userId).select('+passwordHash');
    if (!user) throw new AppError(404, 'User not found');
    user.passwordHash = await bcrypt.hash(req.body.password, 12);
    await user.save();
    token.usedAt = new Date();
    await token.save();
    await RefreshToken.updateMany({ userId: user._id, revokedAt: { $exists: false } }, { revokedAt: new Date() });
    success(res, 200, 'Password reset successfully', {});
  } catch (e) {
    next(e);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!._id).select('+passwordHash');
    if (!user || !(await bcrypt.compare(req.body.currentPassword, user.passwordHash)))
      throw new AppError(400, 'Current password is incorrect');
    user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
    await user.save();
    await audit(req, 'CHANGE_PASSWORD', user._id.toString(), 'User');
    success(res, 200, 'Password changed successfully', {});
  } catch (e) {
    next(e);
  }
};
