import type { NextFunction, Request, Response } from 'express';
import { CourseSection, LecturerProfile } from '../models/academic.models.js';
import { Assessment, StudentAssessmentResult } from '../models/phase3.models.js';
import { AppError } from '../utils/AppError.js';
import { success } from '../utils/response.js';
import { audit } from '../services/audit.service.js';

export const listAssessments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseSectionId, type, status } = req.query as any;
    const filter: any = {};
    if (courseSectionId) filter.courseSectionId = courseSectionId;
    if (type) filter.type = type;
    if (status) filter.status = status;

    if (req.user?.role === 'LECTURER' && !courseSectionId) {
      const lecturer = await LecturerProfile.findOne({ userId: req.user._id }).lean();
      if (lecturer) {
        const sections = await CourseSection.find({ lecturerId: lecturer._id }).select('_id').lean();
        filter.courseSectionId = { $in: sections.map((s) => s._id) };
      }
    }

    const assessments = await Assessment.find(filter)
      .populate({
        path: 'courseSectionId',
        populate: { path: 'courseId' }
      })
      .sort({ createdAt: -1 })
      .lean();

    return success(res, 200, 'Assessments retrieved successfully', assessments);
  } catch (error) {
    next(error);
  }
};

export const createAssessment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseSectionId, title, type, description, maxMarks, weight, dueDate, status } = req.body;

    const section: any = await CourseSection.findById(courseSectionId);
    if (!section || section.status !== 'ACTIVE') {
      throw new AppError(404, 'Active course section not found');
    }

    if (req.user?.role === 'LECTURER') {
      const lecturer = await LecturerProfile.findOne({ userId: req.user._id }).lean();
      if (!lecturer || section.lecturerId?.toString() !== lecturer._id.toString()) {
        throw new AppError(403, 'You are not authorized to create assessments for this section');
      }
    }

    // Check existing total weight
    const existingAssessments = await Assessment.find({ courseSectionId }).lean();
    const currentWeightTotal = existingAssessments.reduce((acc, a) => acc + a.weight, 0);

    if (currentWeightTotal + Number(weight) > 100.01) {
      throw new AppError(
        422,
        `Adding this assessment (weight: ${weight}%) would exceed the maximum total weight of 100%. Current total is ${currentWeightTotal}%.`
      );
    }

    const assessment = await Assessment.create({
      courseSectionId,
      title,
      type,
      description,
      maxMarks,
      weight,
      dueDate,
      status: status || 'Draft',
      createdBy: req.user!._id
    });

    await audit(req, 'ASSESSMENT_CREATED', assessment._id.toString(), 'Assessment', {
      courseSectionId,
      title,
      weight
    });

    return success(res, 201, 'Assessment created successfully', assessment);
  } catch (error) {
    next(error);
  }
};

export const getAssessment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate({
        path: 'courseSectionId',
        populate: { path: 'courseId' }
      })
      .populate('createdBy', 'fullName email')
      .lean();

    if (!assessment) throw new AppError(404, 'Assessment not found');
    return success(res, 200, 'Assessment details retrieved', assessment);
  } catch (error) {
    next(error);
  }
};

export const updateAssessment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) throw new AppError(404, 'Assessment not found');

    if (req.user?.role === 'LECTURER') {
      const lecturer = await LecturerProfile.findOne({ userId: req.user._id }).lean();
      const section = await CourseSection.findById(assessment.courseSectionId).lean();
      if (!lecturer || section?.lecturerId?.toString() !== lecturer._id.toString()) {
        throw new AppError(403, 'You are not authorized to modify this assessment');
      }
    }

    if (req.body.weight !== undefined) {
      const otherAssessments = await Assessment.find({
        courseSectionId: assessment.courseSectionId,
        _id: { $ne: assessment._id }
      }).lean();

      const otherWeight = otherAssessments.reduce((sum, a) => sum + a.weight, 0);
      if (otherWeight + Number(req.body.weight) > 100.01) {
        throw new AppError(
          422,
          `Updated weight (${req.body.weight}%) plus other assessments (${otherWeight}%) exceeds 100%.`
        );
      }
    }

    Object.assign(assessment, req.body);
    await assessment.save();

    await audit(req, 'ASSESSMENT_UPDATED', assessment._id.toString(), 'Assessment', {
      updates: req.body
    });

    return success(res, 200, 'Assessment updated successfully', assessment);
  } catch (error) {
    next(error);
  }
};

export const deleteAssessment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) throw new AppError(404, 'Assessment not found');

    if (req.user?.role === 'LECTURER') {
      const lecturer = await LecturerProfile.findOne({ userId: req.user._id }).lean();
      const section = await CourseSection.findById(assessment.courseSectionId).lean();
      if (!lecturer || section?.lecturerId?.toString() !== lecturer._id.toString()) {
        throw new AppError(403, 'You are not authorized to delete this assessment');
      }
    }

    const resultsCount = await StudentAssessmentResult.countDocuments({ assessmentId: assessment._id });
    if (resultsCount > 0) {
      throw new AppError(409, 'Cannot delete an assessment that already has student marks entered');
    }

    await Assessment.findByIdAndDelete(req.params.id);
    await audit(req, 'ASSESSMENT_DELETED', String(req.params.id), 'Assessment');

    return success(res, 200, 'Assessment deleted successfully', {});
  } catch (error) {
    next(error);
  }
};

export const getSectionAssessmentSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sectionId } = req.params;
    const section = await CourseSection.findById(sectionId).populate('courseId').lean();
    if (!section) throw new AppError(404, 'Course section not found');

    const assessments = await Assessment.find({ courseSectionId: sectionId }).sort({ createdAt: 1 }).lean();
    const totalWeight = assessments.reduce((acc, a) => acc + a.weight, 0);
    const isValid = Math.abs(totalWeight - 100) < 0.01;

    return success(res, 200, 'Section assessments summary retrieved', {
      section,
      assessments,
      totalWeight,
      isValid,
      weightBalance: 100 - totalWeight
    });
  } catch (error) {
    next(error);
  }
};
