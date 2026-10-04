import type { NextFunction, Request, Response } from 'express';
import { CourseRegistration, CourseSection, LecturerProfile, StudentProfile } from '../models/academic.models.js';
import { Assessment, StudentAssessmentResult } from '../models/phase3.models.js';
import { AppError } from '../utils/AppError.js';
import { success } from '../utils/response.js';
import { audit } from '../services/audit.service.js';

export const listAssessmentResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assessmentId, courseSectionId, studentId, status } = req.query as any;
    const filter: any = {};
    if (assessmentId) filter.assessmentId = assessmentId;
    if (courseSectionId) filter.courseSectionId = courseSectionId;
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;

    if (req.user?.role === 'STUDENT') {
      const student = await StudentProfile.findOne({ userId: req.user._id }).lean();
      if (!student) throw new AppError(403, 'Student profile not found');
      filter.studentId = student._id;
      filter.status = 'Published'; // Students only see published marks
    }

    const results = await StudentAssessmentResult.find(filter)
      .populate({
        path: 'assessmentId',
        select: 'title type maxMarks weight dueDate'
      })
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'fullName email' }
      })
      .sort({ createdAt: -1 })
      .lean();

    return success(res, 200, 'Assessment results retrieved successfully', results);
  } catch (error) {
    next(error);
  }
};

export const getAssessmentSheet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assessmentId } = req.params;
    const assessment: any = await Assessment.findById(assessmentId)
      .populate({
        path: 'courseSectionId',
        populate: { path: 'courseId' }
      })
      .lean();

    if (!assessment) throw new AppError(404, 'Assessment not found');

    const registrations = await CourseRegistration.find({
      courseSectionId: assessment.courseSectionId._id,
      status: { $in: ['Approved', 'Completed', 'Pending'] }
    })
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'fullName email' }
      })
      .lean();

    const existingResults = await StudentAssessmentResult.find({
      assessmentId: assessment._id
    }).lean();

    const resultMap = new Map(existingResults.map((r) => [r.studentId.toString(), r]));

    const sheet = registrations.map((reg: any) => {
      const st = reg.studentId;
      const resRecord = st ? resultMap.get(st._id.toString()) : undefined;
      return {
        studentId: st?._id,
        studentNumber: st?.studentId,
        fullName: st?.userId?.fullName ?? 'Unknown',
        email: st?.userId?.email,
        marksObtained: resRecord ? resRecord.marksObtained : null,
        maxMarks: assessment.maxMarks,
        percentage: resRecord ? resRecord.percentage : null,
        status: resRecord ? resRecord.status : 'Draft',
        resultId: resRecord?._id
      };
    });

    return success(res, 200, 'Assessment sheet retrieved', {
      assessment,
      sheet,
      stats: {
        totalStudents: sheet.length,
        enteredCount: existingResults.length,
        averagePercentage:
          existingResults.length > 0
            ? Math.round(
                existingResults.reduce((acc, r) => acc + r.percentage, 0) / existingResults.length
              )
            : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

export const enterMarksBulk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assessmentId, results } = req.body as {
      assessmentId: string;
      results: Array<{ studentId: string; marksObtained: number }>;
    };

    const assessment: any = await Assessment.findById(assessmentId);
    if (!assessment) throw new AppError(404, 'Assessment not found');

    if (req.user?.role === 'LECTURER') {
      const lecturer = await LecturerProfile.findOne({ userId: req.user._id }).lean();
      const section = await CourseSection.findById(assessment.courseSectionId).lean();
      if (!lecturer || section?.lecturerId?.toString() !== lecturer._id.toString()) {
        throw new AppError(403, 'You are not authorized to enter marks for this course section');
      }
    }

    const maxMarks = assessment.maxMarks;
    for (const r of results) {
      if (r.marksObtained < 0 || r.marksObtained > maxMarks) {
        throw new AppError(
          422,
          `Invalid marks: ${r.marksObtained}. Must be between 0 and maxMarks (${maxMarks}).`
        );
      }
    }

    const bulkOps = results.map((r) => {
      const percentage = Math.round((r.marksObtained / maxMarks) * 100 * 100) / 100;
      return {
        updateOne: {
          filter: {
            assessmentId: assessment._id,
            studentId: r.studentId as any
          },
          update: {
            $set: {
              courseSectionId: assessment.courseSectionId,
              marksObtained: r.marksObtained,
              maxMarks,
              percentage,
              enteredBy: req.user!._id as any,
              status: 'Draft' as const
            }
          },
          upsert: true
        }
      } as any;
    });

    await StudentAssessmentResult.bulkWrite(bulkOps as any);

    await audit(req, 'MARK_ENTERED', assessment._id.toString(), 'Assessment', {
      count: results.length
    });

    return success(res, 200, 'Student marks saved successfully', {
      assessmentId,
      updatedCount: results.length
    });
  } catch (error) {
    next(error);
  }
};

export const updateSingleMark = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { marksObtained } = req.body;

    const result = await StudentAssessmentResult.findById(id).populate('assessmentId');
    if (!result) throw new AppError(404, 'Assessment result not found');

    const maxMarks = result.maxMarks;
    if (marksObtained < 0 || marksObtained > maxMarks) {
      throw new AppError(422, `Marks must be between 0 and ${maxMarks}`);
    }

    result.marksObtained = marksObtained;
    result.percentage = Math.round((marksObtained / maxMarks) * 100 * 100) / 100;
    result.enteredBy = req.user!._id as any;
    await result.save();

    await audit(req, 'MARK_UPDATED', result._id.toString(), 'StudentAssessmentResult', {
      newMarks: marksObtained
    });

    return success(res, 200, 'Mark updated successfully', result);
  } catch (error) {
    next(error);
  }
};

export const publishAssessmentMarks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assessmentId } = req.body;
    const assessment: any = await Assessment.findById(assessmentId);
    if (!assessment) throw new AppError(404, 'Assessment not found');

    await StudentAssessmentResult.updateMany(
      { assessmentId },
      { $set: { status: 'Published', publishedAt: new Date() } }
    );

    assessment.status = 'Published';
    await assessment.save();

    await audit(req, 'MARK_UPDATED', assessmentId, 'Assessment', { published: true });

    return success(res, 200, 'Assessment marks published successfully', {});
  } catch (error) {
    next(error);
  }
};
