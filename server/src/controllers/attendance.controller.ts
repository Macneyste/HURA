import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { CourseRegistration, CourseSection, LecturerProfile, StudentProfile } from '../models/academic.models.js';
import {
  AttendanceRecord,
  AttendanceSession,
  AttendanceSetting
} from '../models/phase3.models.js';
import { AppError } from '../utils/AppError.js';
import { success } from '../utils/response.js';
import { audit } from '../services/audit.service.js';
import { NOTIFICATION_EVENTS, notificationEvents } from '../services/notification-event.service.js';

export const listSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseSectionId, page = 1, limit = 50, date, status } = req.query as any;
    const filter: any = {};

    if (courseSectionId) filter.courseSectionId = courseSectionId;
    if (status) filter.status = status;
    if (date) {
      const d = new Date(date);
      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);
      filter.date = { $gte: d, $lt: nextDay };
    }

    if (req.user?.role === 'LECTURER') {
      const lecturer = await LecturerProfile.findOne({ userId: req.user._id }).lean();
      if (!lecturer) throw new AppError(403, 'Lecturer profile not found');
      if (!courseSectionId) {
        const sections = await CourseSection.find({ lecturerId: lecturer._id }).select('_id').lean();
        filter.courseSectionId = { $in: sections.map((s) => s._id) };
      }
    }

    const [data, total] = await Promise.all([
      AttendanceSession.find(filter)
        .populate({
          path: 'courseSectionId',
          populate: { path: 'courseId' }
        })
        .populate({
          path: 'lecturerId',
          populate: { path: 'userId', select: 'fullName email' }
        })
        .sort({ date: -1, createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      AttendanceSession.countDocuments(filter)
    ]);

    return success(res, 200, 'Attendance sessions retrieved successfully', data, {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    next(error);
  }
};

export const createSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseSectionId, date, startTime, endTime, topic, notes, status } = req.body;

    const section: any = await CourseSection.findById(courseSectionId);
    if (!section || section.status !== 'ACTIVE') {
      throw new AppError(404, 'Active course section not found');
    }

    let lecturerId = section.lecturerId;
    if (req.user?.role === 'LECTURER') {
      const lecturer = await LecturerProfile.findOne({ userId: req.user._id }).lean();
      if (!lecturer) throw new AppError(403, 'Lecturer profile not found');
      if (section.lecturerId?.toString() !== lecturer._id.toString()) {
        throw new AppError(403, 'You are not assigned to this course section');
      }
      lecturerId = lecturer._id;
    }

    const session = await AttendanceSession.create({
      courseSectionId,
      lecturerId: lecturerId || undefined,
      date,
      startTime,
      endTime,
      topic,
      notes,
      status: status || 'Open'
    });

    await audit(req, 'ATTENDANCE_CREATED', session._id.toString(), 'AttendanceSession', {
      courseSectionId,
      topic
    });

    return success(res, 201, 'Attendance session created successfully', session);
  } catch (error) {
    next(error);
  }
};

export const getSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session: any = await AttendanceSession.findById(req.params.id)
      .populate({
        path: 'courseSectionId',
        populate: { path: 'courseId' }
      })
      .populate({
        path: 'lecturerId',
        populate: { path: 'userId', select: 'fullName email' }
      })
      .lean();

    if (!session) throw new AppError(404, 'Attendance session not found');

    // Fetch registered students for this section
    const registrations = await CourseRegistration.find({
      courseSectionId: session.courseSectionId._id,
      status: { $in: ['Approved', 'Completed', 'Pending'] }
    })
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'fullName email avatar' }
      })
      .lean();

    // Fetch existing records for this session
    const existingRecords = await AttendanceRecord.find({
      attendanceSessionId: session._id
    }).lean();

    const recordMap = new Map(existingRecords.map((r) => [r.studentId.toString(), r]));

    const roster = registrations.map((reg: any) => {
      const student = reg.studentId;
      const rec = student ? recordMap.get(student._id.toString()) : undefined;
      return {
        registrationId: reg._id,
        student: student,
        status: rec ? rec.status : 'Present',
        markedAt: rec?.markedAt,
        recordId: rec?._id,
        notes: rec?.notes || ''
      };
    });

    return success(res, 200, 'Attendance session details retrieved', {
      session,
      roster,
      summary: {
        totalStudents: roster.length,
        present: roster.filter((r) => r.status === 'Present').length,
        absent: roster.filter((r) => r.status === 'Absent').length,
        late: roster.filter((r) => r.status === 'Late').length,
        excused: roster.filter((r) => r.status === 'Excused').length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) throw new AppError(404, 'Attendance session not found');

    if (req.user?.role === 'LECTURER') {
      const lecturer = await LecturerProfile.findOne({ userId: req.user._id }).lean();
      if (!lecturer || session.lecturerId?.toString() !== lecturer._id.toString()) {
        throw new AppError(403, 'You are not authorized to update this session');
      }
    }

    Object.assign(session, req.body);
    await session.save();

    await audit(req, 'ATTENDANCE_UPDATED', session._id.toString(), 'AttendanceSession', {
      updates: req.body
    });

    return success(res, 200, 'Attendance session updated successfully', session);
  } catch (error) {
    next(error);
  }
};

export const saveSessionRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { records } = req.body as {
      records: Array<{ studentId: string; status: 'Present' | 'Absent' | 'Late' | 'Excused'; notes?: string }>;
    };

    const session: any = await AttendanceSession.findById(id);
    if (!session) throw new AppError(404, 'Attendance session not found');

    if (session.status === 'Cancelled') {
      throw new AppError(422, 'Cannot mark attendance for a cancelled session');
    }

    if (req.user?.role === 'LECTURER') {
      const lecturer = await LecturerProfile.findOne({ userId: req.user._id }).lean();
      if (!lecturer || session.lecturerId?.toString() !== lecturer._id.toString()) {
        throw new AppError(403, 'You are not authorized to mark attendance for this section');
      }
    }

    const bulkOps = records.map((item) => ({
      updateOne: {
        filter: {
          attendanceSessionId: session._id,
          studentId: item.studentId as any
        },
        update: {
          $set: {
            courseSectionId: session.courseSectionId,
            status: item.status,
            markedBy: req.user!._id as any,
            markedAt: new Date(),
            notes: item.notes || ''
          }
        },
        upsert: true
      }
    } as any));

    await AttendanceRecord.bulkWrite(bulkOps as any);

    await audit(req, 'ATTENDANCE_UPDATED', session._id.toString(), 'AttendanceRecord', {
      count: records.length
    });

    return success(res, 200, 'Attendance records saved successfully', {
      sessionId: session._id,
      savedCount: records.length
    });
  } catch (error) {
    next(error);
  }
};

export const updateSingleRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await AttendanceRecord.findById(req.params.id);
    if (!record) throw new AppError(404, 'Attendance record not found');

    record.status = req.body.status;
    if (req.body.notes !== undefined) record.notes = req.body.notes;
    record.markedBy = req.user!._id as any;
    record.markedAt = new Date();
    await record.save();

    await audit(req, 'ATTENDANCE_UPDATED', record._id.toString(), 'AttendanceRecord', {
      status: req.body.status
    });

    return success(res, 200, 'Attendance record updated', record);
  } catch (error) {
    next(error);
  }
};

export const getStudentAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = req.params.id;
    const student = await StudentProfile.findById(studentProfileId)
      .populate('userId', 'fullName email')
      .lean();

    if (!student) throw new AppError(404, 'Student profile not found');

    if (req.user?.role === 'STUDENT' && student.userId?._id?.toString() !== req.user._id.toString()) {
      throw new AppError(403, 'You can only view your own attendance');
    }

    const settings = (await AttendanceSetting.findOne().lean()) || {
      minimumRequiredPercentage: 75,
      warningPercentage: 75,
      criticalPercentage: 50,
      lateWeight: 0.5
    };

    // Find registrations for this student
    const registrations: any[] = await CourseRegistration.find({
      studentId: student._id,
      status: { $in: ['Approved', 'Completed', 'Pending'] }
    })
      .populate({
        path: 'courseSectionId',
        populate: { path: 'courseId' }
      })
      .populate('semesterId')
      .lean();

    const sectionIds = registrations.map((r) => r.courseSectionId?._id).filter(Boolean);

    // Get all sessions for these sections
    const sessions = await AttendanceSession.find({
      courseSectionId: { $in: sectionIds },
      status: { $in: ['Open', 'Closed'] }
    }).lean();

    // Get all records for this student
    const records = await AttendanceRecord.find({
      studentId: student._id
    }).lean();

    const recordMap = new Map(records.map((r) => [r.attendanceSessionId.toString(), r]));

    const coursesAttendance = registrations.map((reg) => {
      const section = reg.courseSectionId;
      const course = section?.courseId;
      const sectionSessions = sessions.filter(
        (s) => s.courseSectionId.toString() === section?._id.toString()
      );

      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;

      sectionSessions.forEach((s) => {
        const rec = recordMap.get(s._id.toString());
        if (!rec || rec.status === 'Absent') {
          absent++;
        } else if (rec.status === 'Present') {
          present++;
        } else if (rec.status === 'Late') {
          late++;
        } else if (rec.status === 'Excused') {
          excused++;
        }
      });

      const totalSessions = sectionSessions.length;
      const divisor = totalSessions - excused;
      const effectivePresent = present + late * settings.lateWeight;
      const percentage = divisor > 0 ? Math.round((effectivePresent / divisor) * 100) : 100;

      let standing: 'Safe' | 'Warning' | 'Critical' = 'Safe';
      let warningMessage = '';

      if (percentage < settings.criticalPercentage) {
        standing = 'Critical';
        warningMessage = `Your attendance in ${course?.title ?? 'this course'} is critically low (${percentage}%). Immediate academic intervention required.`;
      } else if (percentage < settings.warningPercentage) {
        standing = 'Warning';
        warningMessage = `Your attendance in ${course?.title ?? 'this course'} is below the university requirement (${percentage}% < ${settings.minimumRequiredPercentage}%).`;
      }

      return {
        sectionId: section?._id,
        sectionCode: section?.sectionCode,
        courseCode: course?.code,
        courseTitle: course?.title,
        creditHours: course?.creditHours,
        totalSessions,
        present,
        absent,
        late,
        excused,
        attendancePercentage: percentage,
        standing,
        warningMessage
      };
    });

    const totalAllSessions = coursesAttendance.reduce((acc, c) => acc + c.totalSessions, 0);
    const averagePercentage =
      coursesAttendance.length > 0
        ? Math.round(
            coursesAttendance.reduce((acc, c) => acc + c.attendancePercentage, 0) /
              coursesAttendance.length
          )
        : 100;

    return success(res, 200, 'Student attendance summary retrieved', {
      student: {
        _id: student._id,
        studentId: student.studentId,
        fullName: (student.userId as any)?.fullName,
        email: (student.userId as any)?.email
      },
      averagePercentage,
      totalSessions: totalAllSessions,
      courses: coursesAttendance,
      settings
    });
  } catch (error) {
    next(error);
  }
};
