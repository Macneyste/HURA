import type { NextFunction, Request, Response } from 'express';
import { CourseRegistration, CourseSection, LecturerProfile, StudentProfile } from '../models/academic.models.js';
import { Exam } from '../models/phase3.models.js';
import { AppError } from '../utils/AppError.js';
import { success } from '../utils/response.js';
import { audit } from '../services/audit.service.js';
import { NOTIFICATION_EVENTS, notificationEvents } from '../services/notification-event.service.js';

// Helper to check if two time ranges overlap
const timesOverlap = (startA: string, endA: string, startB: string, endB: string): boolean => {
  return startA < endB && startB < endA;
};

const checkExamConflicts = async ({
  examId,
  courseSectionId,
  date,
  startTime,
  endTime,
  room,
  invigilatorId
}: {
  examId?: string;
  courseSectionId: string;
  date: Date;
  startTime: string;
  endTime: string;
  room: string;
  invigilatorId?: string;
}) => {
  const examDate = new Date(date);
  const startOfDay = new Date(examDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(examDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Find other exams on the same day (excluding current exam if updating)
  const query: any = {
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'Cancelled' }
  };
  if (examId) query._id = { $ne: examId };

  const sameDayExams: any[] = await Exam.find(query)
    .populate({
      path: 'courseSectionId',
      populate: { path: 'courseId' }
    })
    .lean();

  for (const existing of sameDayExams) {
    if (timesOverlap(startTime, endTime, existing.startTime, existing.endTime)) {
      const existingCourseCode = existing.courseSectionId?.courseId?.code || 'Another exam';

      // 1. Room conflict
      if (existing.room.toUpperCase() === room.trim().toUpperCase()) {
        throw new AppError(
          409,
          `Exam scheduling conflict: Room ${room} is already occupied at this time (${existing.startTime} - ${existing.endTime}) by ${existingCourseCode}.`
        );
      }

      // 2. Invigilator conflict
      if (
        invigilatorId &&
        existing.invigilatorId &&
        existing.invigilatorId.toString() === invigilatorId.toString()
      ) {
        throw new AppError(
          409,
          `Exam scheduling conflict: Invigilator is already assigned to supervise ${existingCourseCode} at this time.`
        );
      }

      // 3. Student conflict: find students in both sections
      const [currentStudents, otherStudents] = await Promise.all([
        CourseRegistration.find({
          courseSectionId,
          status: { $in: ['Approved', 'Completed'] }
        })
          .select('studentId')
          .lean(),
        CourseRegistration.find({
          courseSectionId: existing.courseSectionId?._id,
          status: { $in: ['Approved', 'Completed'] }
        })
          .select('studentId')
          .lean()
      ]);

      const otherStudentSet = new Set(otherStudents.map((s) => s.studentId.toString()));
      const commonStudents = currentStudents.filter((s) => otherStudentSet.has(s.studentId.toString()));

      if (commonStudents.length > 0) {
        throw new AppError(
          409,
          `Exam scheduling conflict: ${commonStudents.length} student(s) in this section are already scheduled for an exam in ${existingCourseCode} at this time (${existing.startTime} - ${existing.endTime}).`
        );
      }
    }
  }
};

export const listExams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { semesterId, courseSectionId, examType, status, room } = req.query as any;
    const filter: any = {};
    if (semesterId) filter.semesterId = semesterId;
    if (courseSectionId) filter.courseSectionId = courseSectionId;
    if (examType) filter.examType = examType;
    if (status) filter.status = status;
    if (room) filter.room = new RegExp(room, 'i');

    // Role-based filtering
    if (req.user?.role === 'STUDENT') {
      const student = await StudentProfile.findOne({ userId: req.user._id }).lean();
      if (!student) throw new AppError(403, 'Student profile not found');

      const myRegistrations = await CourseRegistration.find({
        studentId: student._id,
        status: { $in: ['Approved', 'Completed', 'Pending'] }
      })
        .select('courseSectionId')
        .lean();

      filter.courseSectionId = { $in: myRegistrations.map((r) => r.courseSectionId) };
    } else if (req.user?.role === 'LECTURER') {
      const lecturer = await LecturerProfile.findOne({ userId: req.user._id }).lean();
      if (lecturer) {
        const sections = await CourseSection.find({ lecturerId: lecturer._id }).select('_id').lean();
        filter.$or = [
          { courseSectionId: { $in: sections.map((s) => s._id) } },
          { invigilatorId: lecturer._id }
        ];
      }
    }

    const exams = await Exam.find(filter)
      .populate({
        path: 'courseSectionId',
        populate: { path: 'courseId' }
      })
      .populate('semesterId')
      .populate({
        path: 'invigilatorId',
        populate: { path: 'userId', select: 'fullName email' }
      })
      .sort({ date: 1, startTime: 1 })
      .lean();

    return success(res, 200, 'Exams retrieved successfully', exams);
  } catch (error) {
    next(error);
  }
};

export const createExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      courseSectionId,
      semesterId,
      examType,
      date,
      startTime,
      endTime,
      room,
      duration,
      instructions,
      invigilatorId,
      status
    } = req.body;

    const section = await CourseSection.findById(courseSectionId).populate('courseId').lean();
    if (!section) throw new AppError(404, 'Course section not found');

    // Run conflict checks
    await checkExamConflicts({
      courseSectionId,
      date,
      startTime,
      endTime,
      room,
      invigilatorId
    });

    const exam = await Exam.create({
      courseSectionId,
      semesterId,
      examType,
      date,
      startTime,
      endTime,
      room: room.trim().toUpperCase(),
      duration,
      instructions,
      invigilatorId: invigilatorId || undefined,
      status: status || 'Scheduled'
    });

    await audit(req, 'EXAM_CREATED', exam._id.toString(), 'Exam', {
      courseSectionId,
      examType,
      room,
      date
    });

    notificationEvents.emitEvent(NOTIFICATION_EVENTS.EXAM_SCHEDULED, {
      recipientId: courseSectionId,
      recipientType: 'STUDENT',
      title: 'New Exam Scheduled',
      message: `An exam for ${(section.courseId as any)?.title} has been scheduled on ${new Date(date).toLocaleDateString()}.`,
      createdAt: new Date()
    });

    return success(res, 201, 'Exam scheduled successfully', exam);
  } catch (error) {
    next(error);
  }
};

export const getExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate({
        path: 'courseSectionId',
        populate: { path: 'courseId' }
      })
      .populate('semesterId')
      .populate({
        path: 'invigilatorId',
        populate: { path: 'userId', select: 'fullName email' }
      })
      .lean();

    if (!exam) throw new AppError(404, 'Exam not found');
    return success(res, 200, 'Exam retrieved successfully', exam);
  } catch (error) {
    next(error);
  }
};

export const updateExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) throw new AppError(404, 'Exam not found');

    const courseSectionId = req.body.courseSectionId || exam.courseSectionId.toString();
    const date = req.body.date || exam.date;
    const startTime = req.body.startTime || exam.startTime;
    const endTime = req.body.endTime || exam.endTime;
    const room = req.body.room || exam.room;
    const invigilatorId = req.body.invigilatorId !== undefined ? req.body.invigilatorId : exam.invigilatorId?.toString();

    // Recheck conflicts on update
    await checkExamConflicts({
      examId: exam._id.toString(),
      courseSectionId,
      date,
      startTime,
      endTime,
      room,
      invigilatorId
    });

    Object.assign(exam, req.body);
    if (req.body.room) exam.room = req.body.room.trim().toUpperCase();
    await exam.save();

    await audit(req, 'EXAM_UPDATED', exam._id.toString(), 'Exam', {
      updates: req.body
    });

    return success(res, 200, 'Exam updated successfully', exam);
  } catch (error) {
    next(error);
  }
};

export const deleteExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) throw new AppError(404, 'Exam not found');

    await audit(req, 'EXAM_DELETED', String(req.params.id), 'Exam');
    return success(res, 200, 'Exam cancelled/deleted successfully', {});
  } catch (error) {
    next(error);
  }
};
