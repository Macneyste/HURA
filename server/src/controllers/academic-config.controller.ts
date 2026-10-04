import type { NextFunction, Request, Response } from 'express';
import { AcademicStandingRule, AttendanceSetting, GradeScale } from '../models/phase3.models.js';
import { AppError } from '../utils/AppError.js';
import { success } from '../utils/response.js';
import { audit } from '../services/audit.service.js';

// Grade Scale
export const listGradeScales = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const scales = await GradeScale.find().sort({ minimumPercentage: -1 }).lean();
    return success(res, 200, 'Grade scales retrieved successfully', scales);
  } catch (error) {
    next(error);
  }
};

export const createGradeScale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scale = await GradeScale.create(req.body);
    await audit(req, 'GRADE_SCALE_CHANGED', scale._id.toString(), 'GradeScale', { action: 'create' });
    return success(res, 201, 'Grade scale created successfully', scale);
  } catch (error) {
    next(error);
  }
};

export const updateGradeScale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scale = await GradeScale.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!scale) throw new AppError(404, 'Grade scale not found');
    await audit(req, 'GRADE_SCALE_CHANGED', scale._id.toString(), 'GradeScale', { action: 'update' });
    return success(res, 200, 'Grade scale updated successfully', scale);
  } catch (error) {
    next(error);
  }
};

export const deleteGradeScale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scale = await GradeScale.findByIdAndDelete(req.params.id);
    if (!scale) throw new AppError(404, 'Grade scale not found');
    await audit(req, 'GRADE_SCALE_CHANGED', String(req.params.id), 'GradeScale', { action: 'delete' });
    return success(res, 200, 'Grade scale deleted successfully', {});
  } catch (error) {
    next(error);
  }
};

// Academic Standing
export const listAcademicStanding = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const standings = await AcademicStandingRule.find().sort({ minCGPA: -1 }).lean();
    return success(res, 200, 'Academic standing rules retrieved', standings);
  } catch (error) {
    next(error);
  }
};

export const createAcademicStanding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const standing = await AcademicStandingRule.create(req.body);
    await audit(req, 'ACADEMIC_STANDING_CHANGED', standing._id.toString(), 'AcademicStandingRule', { action: 'create' });
    return success(res, 201, 'Academic standing rule created', standing);
  } catch (error) {
    next(error);
  }
};

export const updateAcademicStanding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const standing = await AcademicStandingRule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!standing) throw new AppError(404, 'Academic standing rule not found');
    await audit(req, 'ACADEMIC_STANDING_CHANGED', standing._id.toString(), 'AcademicStandingRule', { action: 'update' });
    return success(res, 200, 'Academic standing rule updated', standing);
  } catch (error) {
    next(error);
  }
};

// Attendance Settings
export const getAttendanceSetting = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    let setting = await AttendanceSetting.findOne().lean();
    if (!setting) {
      setting = await AttendanceSetting.create({
        minimumRequiredPercentage: 75,
        warningPercentage: 75,
        criticalPercentage: 50,
        lateWeight: 0.5
      });
    }
    return success(res, 200, 'Attendance settings retrieved', setting);
  } catch (error) {
    next(error);
  }
};

export const updateAttendanceSetting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let setting = await AttendanceSetting.findOne();
    if (!setting) {
      setting = await AttendanceSetting.create(req.body);
    } else {
      Object.assign(setting, req.body);
      await setting.save();
    }
    return success(res, 200, 'Attendance settings updated successfully', setting);
  } catch (error) {
    next(error);
  }
};
