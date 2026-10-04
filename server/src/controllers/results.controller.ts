import mongoose from 'mongoose';
import type { NextFunction, Request, Response } from 'express';
import { CourseRegistration, CourseSection, Department, LecturerProfile, Semester, StudentProfile } from '../models/academic.models.js';
import {
  AcademicStandingRule,
  Assessment,
  CourseResult,
  GradeScale,
  SemesterResult,
  StudentAssessmentResult
} from '../models/phase3.models.js';
import { AppError } from '../utils/AppError.js';
import { success } from '../utils/response.js';
import { audit } from '../services/audit.service.js';
import { NOTIFICATION_EVENTS, notificationEvents } from '../services/notification-event.service.js';

// Default grade scale fallback
const DEFAULT_GRADE_SCALES = [
  { letter: 'A+', min: 95, max: 100, point: 4.0, pass: true },
  { letter: 'A', min: 90, max: 94.99, point: 4.0, pass: true },
  { letter: 'B+', min: 85, max: 89.99, point: 3.5, pass: true },
  { letter: 'B', min: 80, max: 84.99, point: 3.0, pass: true },
  { letter: 'C+', min: 75, max: 79.99, point: 2.5, pass: true },
  { letter: 'C', min: 70, max: 74.99, point: 2.0, pass: true },
  { letter: 'D', min: 60, max: 69.99, point: 1.0, pass: true },
  { letter: 'F', min: 0, max: 59.99, point: 0.0, pass: false }
];

export const getGradeForPercentage = async (percentage: number) => {
  if (mongoose.connection.readyState === 1) {
    const dbScales = await GradeScale.find().sort({ minimumPercentage: -1 }).lean();
    if (dbScales.length > 0) {
      for (const scale of dbScales) {
        if (percentage >= scale.minimumPercentage) {
          return {
            letter: scale.letter,
            gradePoint: scale.gradePoint,
            passStatus: scale.passStatus
          };
        }
      }
      const lowest = dbScales[dbScales.length - 1];
      return { letter: lowest.letter, gradePoint: lowest.gradePoint, passStatus: lowest.passStatus };
    }
  }

  for (const scale of DEFAULT_GRADE_SCALES) {
    if (percentage >= scale.min) {
      return { letter: scale.letter, gradePoint: scale.point, passStatus: scale.pass };
    }
  }
  return { letter: 'F', gradePoint: 0.0, passStatus: false };
};

export const getAcademicStanding = async (cgpa: number): Promise<string> => {
  if (mongoose.connection.readyState === 1) {
    const rules = await AcademicStandingRule.find({ status: 'ACTIVE' }).sort({ minCGPA: -1 }).lean();
    if (rules.length > 0) {
      for (const rule of rules) {
        if (cgpa >= rule.minCGPA) {
          return rule.name;
        }
      }
      return rules[rules.length - 1].name;
    }
  }

  if (cgpa >= 3.5) return 'Excellent';
  if (cgpa >= 2.0) return 'Good Standing';
  if (cgpa >= 1.5) return 'Academic Warning';
  return 'Academic Probation';
};

// Recalculates semester result and updates overall student CGPA
export const recalculateSemesterResults = async (studentId: string, semesterId: string) => {
  const courseResults: any[] = await CourseResult.find({
    studentId,
    semesterId,
    status: 'Published'
  }).populate('courseId');

  if (courseResults.length === 0) {
    return;
  }

  let totalPoints = 0;
  let creditsAttempted = 0;
  let creditsEarned = 0;

  for (const cr of courseResults) {
    const credits = cr.credits || (cr.courseId?.creditHours ?? 3);
    creditsAttempted += credits;
    totalPoints += credits * cr.gradePoint;
    if (cr.gradePoint > 0) {
      creditsEarned += credits;
    }
  }

  const semesterGpa = creditsAttempted > 0 ? Math.round((totalPoints / creditsAttempted) * 100) / 100 : 0;

  // Calculate Cumulative CGPA across all published semesters
  const allPublishedResults: any[] = await CourseResult.find({
    studentId,
    status: 'Published'
  }).populate('courseId');

  let allPoints = 0;
  let allAttempted = 0;
  let allEarned = 0;

  for (const cr of allPublishedResults) {
    const credits = cr.credits || (cr.courseId?.creditHours ?? 3);
    allAttempted += credits;
    allPoints += credits * cr.gradePoint;
    if (cr.gradePoint > 0) {
      allEarned += credits;
    }
  }

  const cgpa = allAttempted > 0 ? Math.round((allPoints / allAttempted) * 100) / 100 : 0;
  const standing = await getAcademicStanding(cgpa);

  await SemesterResult.findOneAndUpdate(
    { studentId, semesterId },
    {
      gpa: semesterGpa,
      totalCreditsEarned: creditsEarned,
      totalCreditsAttempted: creditsAttempted,
      academicStanding: standing,
      status: 'Published',
      publishedAt: new Date()
    },
    { upsert: true, new: true }
  );

  return { semesterGpa, cgpa, standing, creditsEarned, creditsAttempted };
};

// 1. Calculate Results from Assessments
export const calculateCourseResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseSectionId } = req.body;
    const section: any = await CourseSection.findById(courseSectionId).populate('courseId');
    if (!section) throw new AppError(404, 'Course section not found');

    // 1. Validate total assessment weight == 100%
    const assessments = await Assessment.find({ courseSectionId }).lean();
    const totalWeight = assessments.reduce((sum, a) => sum + a.weight, 0);

    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new AppError(
        422,
        `Cannot calculate or publish grades: total assessment weight is ${totalWeight}%, but exactly 100% is required.`
      );
    }

    // 2. Fetch enrolled students
    const registrations = await CourseRegistration.find({
      courseSectionId,
      status: { $in: ['Approved', 'Completed'] }
    }).lean();

    if (registrations.length === 0) {
      throw new AppError(422, 'No approved student registrations found in this course section');
    }

    const studentIds = registrations.map((r) => r.studentId);

    // 3. Fetch all marks for these assessments
    const allMarks = await StudentAssessmentResult.find({
      courseSectionId,
      studentId: { $in: studentIds }
    }).lean();

    const marksByStudent = new Map<string, typeof allMarks>();
    allMarks.forEach((m) => {
      const sId = m.studentId.toString();
      const list = marksByStudent.get(sId) || [];
      list.push(m);
      marksByStudent.set(sId, list);
    });

    const calculatedResults = [];

    for (const studentId of studentIds) {
      const sMarks = marksByStudent.get(studentId.toString()) || [];
      let totalWeightedPercentage = 0;

      for (const assessment of assessments) {
        const mark = sMarks.find((m) => m.assessmentId.toString() === assessment._id.toString());
        const markObtained = mark ? mark.marksObtained : 0;
        const componentScore = (markObtained / assessment.maxMarks) * assessment.weight;
        totalWeightedPercentage += componentScore;
      }

      const totalMarks = Math.round(totalWeightedPercentage * 100) / 100;
      const { letter, gradePoint } = await getGradeForPercentage(totalMarks);

      const existingResult = await CourseResult.findOne({
        studentId,
        courseSectionId
      });

      if (existingResult && existingResult.status === 'Locked') {
        continue; // Do not overwrite locked results without explicit change flow
      }

      const courseResult = await CourseResult.findOneAndUpdate(
        { studentId, courseSectionId },
        {
          courseId: section.courseId._id,
          semesterId: section.semesterId,
          totalMarks,
          letterGrade: letter,
          gradePoint,
          credits: section.courseId.creditHours,
          status: existingResult?.status === 'Submitted' ? 'Submitted' : 'Draft'
        },
        { upsert: true, new: true }
      );

      calculatedResults.push(courseResult);
    }

    return success(res, 200, 'Course results calculated successfully', {
      count: calculatedResults.length,
      results: calculatedResults
    });
  } catch (error) {
    next(error);
  }
};

// 2. Submit Results (Lecturer -> HOD)
export const submitResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseSectionId } = req.body;
    const section: any = await CourseSection.findById(courseSectionId);
    if (!section) throw new AppError(404, 'Course section not found');

    if (req.user?.role === 'LECTURER') {
      const lecturer = await LecturerProfile.findOne({ userId: req.user._id }).lean();
      if (!lecturer || section.lecturerId?.toString() !== lecturer._id.toString()) {
        throw new AppError(403, 'You are not assigned to this course section');
      }
    }

    // Verify assessments equal 100%
    const assessments = await Assessment.find({ courseSectionId }).lean();
    const totalWeight = assessments.reduce((sum, a) => sum + a.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new AppError(
        422,
        `Assessment weights must total exactly 100% before submission (currently ${totalWeight}%).`
      );
    }

    const updateRes = await CourseResult.updateMany(
      { courseSectionId, status: { $in: ['Draft'] } },
      {
        $set: {
          status: 'Submitted',
          submittedBy: req.user!._id,
          submittedAt: new Date()
        }
      }
    );

    await audit(req, 'RESULT_SUBMITTED', courseSectionId, 'CourseSection', {
      modifiedCount: updateRes.modifiedCount
    });

    return success(res, 200, 'Results submitted for department verification', {
      submittedCount: updateRes.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

// 3. Verify Results (HOD -> Admin)
export const verifyResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseSectionId, action, returnReason } = req.body;
    const section: any = await CourseSection.findById(courseSectionId).populate('courseId');
    if (!section) throw new AppError(404, 'Course section not found');

    if (req.user?.role === 'HOD') {
      const hod = await LecturerProfile.findOne({ userId: req.user._id }).lean();
      if (!hod || section.courseId?.departmentId?.toString() !== hod.departmentId?.toString()) {
        throw new AppError(403, 'You can only verify results for courses within your department');
      }
    }

    if (action === 'Return') {
      await CourseResult.updateMany(
        { courseSectionId, status: 'Submitted' },
        { $set: { status: 'Draft' } }
      );

      await audit(req, 'RESULT_CHANGED', courseSectionId, 'CourseSection', {
        action: 'Returned',
        reason: returnReason
      });

      notificationEvents.emitEvent(NOTIFICATION_EVENTS.RESULT_RETURNED, {
        recipientId: section.lecturerId?.toString() || '',
        recipientType: 'LECTURER',
        title: 'Results Returned for Correction',
        message: `Results for section ${section.sectionCode} have been returned by HOD: ${returnReason || 'Please check and resubmit.'}`,
        createdAt: new Date()
      });

      return success(res, 200, 'Results returned to lecturer for correction', { courseSectionId, action: 'Return' });
    }

    // Action === 'Approve' -> mark as Verified
    const updateRes = await CourseResult.updateMany(
      { courseSectionId, status: 'Submitted' },
      {
        $set: {
          status: 'Verified',
          verifiedBy: req.user!._id,
          verifiedAt: new Date()
        }
      }
    );

    await audit(req, 'RESULT_VERIFIED', courseSectionId, 'CourseSection', {
      modifiedCount: updateRes.modifiedCount
    });

    return success(res, 200, 'Results successfully verified by department head', {
      verifiedCount: updateRes.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

// 4. Publish Results (Admin -> Students)
export const publishResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseSectionId, semesterId } = req.body;
    const filter: any = { status: { $in: ['Verified', 'Submitted'] } };
    if (courseSectionId) filter.courseSectionId = courseSectionId;
    if (semesterId) filter.semesterId = semesterId;

    const resultsToPublish = await CourseResult.find(filter).lean();
    if (resultsToPublish.length === 0) {
      throw new AppError(404, 'No verified results found eligible for publication');
    }

    const now = new Date();
    await CourseResult.updateMany(filter, {
      $set: {
        status: 'Published',
        publishedBy: req.user!._id,
        publishedAt: now,
        lockedAt: now
      }
    });

    // Update semester GPAs for each affected student
    const studentSemesterPairs = new Set(
      resultsToPublish.map((r) => `${r.studentId.toString()}::${r.semesterId.toString()}`)
    );

    for (const pair of studentSemesterPairs) {
      const [sId, semId] = pair.split('::');
      await recalculateSemesterResults(sId, semId);
    }

    await audit(req, 'RESULT_PUBLISHED', courseSectionId || semesterId, 'Results', {
      publishedCount: resultsToPublish.length
    });

    notificationEvents.emitEvent(NOTIFICATION_EVENTS.RESULT_PUBLISHED, {
      recipientId: courseSectionId || semesterId,
      recipientType: 'STUDENT',
      title: 'Official Semester Results Published',
      message: 'Your official semester results have been verified and published.',
      createdAt: new Date()
    });

    return success(res, 200, 'Results published and locked successfully', {
      publishedCount: resultsToPublish.length
    });
  } catch (error) {
    next(error);
  }
};

// 5. Change Published Result (Requires permission, audit trail, reason)
export const changePublishedResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resultId, totalMarks, reason } = req.body;
    const result = await CourseResult.findById(resultId);
    if (!result) throw new AppError(404, 'Course result not found');

    const previousValue = result.totalMarks;
    const previousGrade = result.letterGrade;

    const { letter, gradePoint } = await getGradeForPercentage(Number(totalMarks));

    result.changeHistory.push({
      previousValue,
      newValue: Number(totalMarks),
      previousGrade,
      newGrade: letter,
      changedBy: req.user!._id as any,
      reason,
      changedAt: new Date()
    });

    result.totalMarks = Number(totalMarks);
    result.letterGrade = letter;
    result.gradePoint = gradePoint;
    await result.save();

    // Recalculate student's semester and cumulative GPA
    await recalculateSemesterResults(result.studentId.toString(), result.semesterId.toString());

    await audit(req, 'RESULT_CHANGED', result._id.toString(), 'CourseResult', {
      previousValue,
      newValue: totalMarks,
      reason
    });

    return success(res, 200, 'Published result updated with audit trail', result);
  } catch (error) {
    next(error);
  }
};

// 6. List Results
export const listResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseSectionId, semesterId, studentId, status } = req.query as any;
    const filter: any = {};
    if (courseSectionId) filter.courseSectionId = courseSectionId;
    if (semesterId) filter.semesterId = semesterId;
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;

    if (req.user?.role === 'STUDENT') {
      const student = await StudentProfile.findOne({ userId: req.user._id }).lean();
      if (!student) throw new AppError(403, 'Student profile not found');
      filter.studentId = student._id;
      filter.status = 'Published'; // Students strictly only see Published results!
    } else if (req.user?.role === 'LECTURER') {
      const lecturer = await LecturerProfile.findOne({ userId: req.user._id }).lean();
      if (lecturer && !courseSectionId) {
        const sections = await CourseSection.find({ lecturerId: lecturer._id }).select('_id').lean();
        filter.courseSectionId = { $in: sections.map((s) => s._id) };
      }
    } else if (req.user?.role === 'HOD') {
      const hod = await LecturerProfile.findOne({ userId: req.user._id }).lean();
      if (hod && !courseSectionId) {
        const deptsCourses = await CourseSection.find()
          .populate({ path: 'courseId', match: { departmentId: hod.departmentId } })
          .select('_id courseId')
          .lean();
        const validIds = deptsCourses.filter((s: any) => s.courseId).map((s) => s._id);
        filter.courseSectionId = { $in: validIds };
      }
    }

    const results = await CourseResult.find(filter)
      .populate('courseId')
      .populate('courseSectionId')
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'fullName email' }
      })
      .populate('semesterId')
      .sort({ createdAt: -1 })
      .lean();

    return success(res, 200, 'Results retrieved successfully', results);
  } catch (error) {
    next(error);
  }
};

// 7. Get Complete Student Academic Performance
export const getStudentPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = req.params.studentId;
    const student: any = await StudentProfile.findById(studentProfileId)
      .populate('userId', 'fullName email')
      .populate('programId')
      .populate('departmentId')
      .populate('facultyId')
      .lean();

    if (!student) throw new AppError(404, 'Student profile not found');

    if (req.user?.role === 'STUDENT' && student.userId?._id?.toString() !== req.user._id.toString()) {
      throw new AppError(403, 'You can only view your own academic performance');
    }

    // Published course results only for student view
    const courseResults: any[] = await CourseResult.find({
      studentId: student._id,
      status: 'Published'
    })
      .populate('courseId')
      .populate('semesterId')
      .sort({ createdAt: 1 })
      .lean();

    const semesterResults: any[] = await SemesterResult.find({
      studentId: student._id,
      status: 'Published'
    })
      .populate('semesterId')
      .sort({ createdAt: 1 })
      .lean();

    let totalPoints = 0;
    let totalCreditsAttempted = 0;
    let totalCreditsEarned = 0;
    let coursesCompleted = 0;
    let coursesFailed = 0;

    const gradeDistribution: Record<string, number> = {
      'A+': 0,
      A: 0,
      'B+': 0,
      B: 0,
      'C+': 0,
      C: 0,
      D: 0,
      F: 0
    };

    courseResults.forEach((cr) => {
      const crd = cr.credits || (cr.courseId?.creditHours ?? 3);
      totalCreditsAttempted += crd;
      totalPoints += crd * cr.gradePoint;
      if (cr.gradePoint > 0) {
        totalCreditsEarned += crd;
        coursesCompleted++;
      } else {
        coursesFailed++;
      }
      if (gradeDistribution[cr.letterGrade] !== undefined) {
        gradeDistribution[cr.letterGrade]++;
      }
    });

    const cgpa =
      totalCreditsAttempted > 0 ? Math.round((totalPoints / totalCreditsAttempted) * 100) / 100 : 0;

    const currentSemesterResult = semesterResults[semesterResults.length - 1];
    const currentGpa = currentSemesterResult ? currentSemesterResult.gpa : cgpa;
    const standing = await getAcademicStanding(cgpa);

    const programTotalCredits = student.programId?.totalCredits || 130;
    const creditsRemaining = Math.max(0, programTotalCredits - totalCreditsEarned);

    return success(res, 200, 'Student performance summary retrieved', {
      student: {
        _id: student._id,
        studentId: student.studentId,
        fullName: student.userId?.fullName,
        email: student.userId?.email,
        program: student.programId?.name,
        department: student.departmentId?.name,
        faculty: student.facultyId?.name,
        batch: student.batch
      },
      currentGpa,
      cgpa,
      totalCreditsEarned,
      totalCreditsAttempted,
      creditsRemaining,
      coursesCompleted,
      coursesFailed,
      academicStanding: standing,
      gradeDistribution,
      semesterHistory: semesterResults.map((sr) => ({
        semesterId: sr.semesterId?._id,
        semesterName: (sr.semesterId as any)?.name,
        gpa: sr.gpa,
        creditsEarned: sr.totalCreditsEarned,
        creditsAttempted: sr.totalCreditsAttempted,
        academicStanding: sr.academicStanding
      })),
      courseResults: courseResults.map((cr) => ({
        courseCode: cr.courseId?.code,
        courseTitle: cr.courseId?.title,
        semesterName: (cr.semesterId as any)?.name,
        credits: cr.credits,
        totalMarks: cr.totalMarks,
        letterGrade: cr.letterGrade,
        gradePoint: cr.gradePoint
      }))
    });
  } catch (error) {
    next(error);
  }
};
