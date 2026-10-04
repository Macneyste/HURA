import type { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import { CourseResult, SemesterResult, Transcript } from '../models/phase3.models.js';
import { AcademicYear, Semester, StudentProfile } from '../models/academic.models.js';
import { AppError } from '../utils/AppError.js';
import { success } from '../utils/response.js';
import { audit } from '../services/audit.service.js';
import { NOTIFICATION_EVENTS, notificationEvents } from '../services/notification-event.service.js';
import { getAcademicStanding } from './results.controller.js';

export const generateTranscript = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, graduationStatus } = req.body;

    const student: any = await StudentProfile.findById(studentId)
      .populate('userId', 'fullName email')
      .populate('programId')
      .populate('departmentId')
      .populate('facultyId')
      .lean();

    if (!student) throw new AppError(404, 'Student profile not found');

    // Fetch all published semester results and course results
    const [semesterResults, courseResults] = await Promise.all([
      SemesterResult.find({ studentId: student._id, status: 'Published' })
        .populate({
          path: 'semesterId',
          populate: { path: 'academicYearId' }
        })
        .sort({ createdAt: 1 })
        .lean(),
      CourseResult.find({ studentId: student._id, status: 'Published' })
        .populate('courseId')
        .populate('semesterId')
        .sort({ createdAt: 1 })
        .lean()
    ]);

    if (courseResults.length === 0) {
      throw new AppError(422, 'Cannot generate transcript: No published course results exist for this student.');
    }

    // Group courses by semester
    const coursesBySemester = new Map<string, any[]>();
    courseResults.forEach((cr: any) => {
      const sId = cr.semesterId?._id?.toString() || 'unknown';
      const list = coursesBySemester.get(sId) || [];
      list.push({
        courseId: cr.courseId?._id,
        courseCode: cr.courseId?.code,
        courseTitle: cr.courseId?.title,
        credits: cr.credits || (cr.courseId?.creditHours ?? 3),
        marks: cr.totalMarks,
        letterGrade: cr.letterGrade,
        gradePoint: cr.gradePoint
      });
      coursesBySemester.set(sId, list);
    });

    let totalPoints = 0;
    let totalCreditsAttempted = 0;
    let totalCreditsEarned = 0;

    courseResults.forEach((cr: any) => {
      const c = cr.credits || (cr.courseId?.creditHours ?? 3);
      totalCreditsAttempted += c;
      totalPoints += c * cr.gradePoint;
      if (cr.gradePoint > 0) totalCreditsEarned += c;
    });

    const cgpa = totalCreditsAttempted > 0 ? Math.round((totalPoints / totalCreditsAttempted) * 100) / 100 : 0;
    const standing = await getAcademicStanding(cgpa);

    const semesterRecords = semesterResults.map((sr: any) => {
      const sem = sr.semesterId;
      const semCourses = coursesBySemester.get(sem?._id?.toString()) || [];
      return {
        semesterId: sem?._id,
        semesterName: sem?.name || 'Semester',
        academicYearName: sem?.academicYearId?.name || '',
        semesterGpa: sr.gpa,
        creditsAttempted: sr.totalCreditsAttempted,
        creditsEarned: sr.totalCreditsEarned,
        courses: semCourses
      };
    });

    // Reference number format: TR-HU-{YEAR}-{RANDOM6}
    const currentYear = new Date().getFullYear();
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const referenceNumber = `TR-HU-${currentYear}-${randomHex}`;

    const transcript = await Transcript.create({
      studentId: student._id,
      referenceNumber,
      issueDate: new Date(),
      status: 'Official',
      cgpa,
      totalCreditsEarned,
      totalCreditsAttempted,
      academicStanding: standing,
      graduationStatus: graduationStatus || 'In Progress',
      semesterRecords,
      generatedBy: req.user!._id
    });

    await audit(req, 'TRANSCRIPT_GENERATED', transcript._id.toString(), 'Transcript', {
      referenceNumber,
      studentId: student._id
    });

    notificationEvents.emitEvent(NOTIFICATION_EVENTS.TRANSCRIPT_GENERATED, {
      recipientId: student._id.toString(),
      recipientType: 'STUDENT',
      title: 'Official Academic Transcript Generated',
      message: `Your official digital transcript has been issued with reference number ${referenceNumber}.`,
      createdAt: new Date()
    });

    return success(res, 201, 'Official transcript generated successfully', transcript);
  } catch (error) {
    next(error);
  }
};

export const getStudentTranscript = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = req.params.studentId;
    const student: any = await StudentProfile.findById(studentProfileId)
      .populate('userId', 'fullName email')
      .lean();

    if (!student) throw new AppError(404, 'Student profile not found');

    if (req.user?.role === 'STUDENT' && student.userId?._id?.toString() !== req.user._id.toString()) {
      throw new AppError(403, 'You can only access your own academic transcript');
    }

    const transcript = await Transcript.findOne({ studentId: student._id, status: 'Official' })
      .sort({ createdAt: -1 })
      .populate({
        path: 'studentId',
        populate: { path: 'userId programId departmentId facultyId' }
      })
      .lean();

    if (!transcript) {
      throw new AppError(404, 'No official transcript has been generated yet for this student.');
    }

    return success(res, 200, 'Transcript retrieved successfully', transcript);
  } catch (error) {
    next(error);
  }
};

export const downloadTranscriptHtml = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transcript: any = await Transcript.findById(req.params.id)
      .populate({
        path: 'studentId',
        populate: { path: 'userId programId departmentId facultyId' }
      })
      .lean();

    if (!transcript) throw new AppError(404, 'Transcript not found');

    const student = transcript.studentId;
    const issueDateStr = new Date(transcript.issueDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const verifyUrl = `${req.protocol}://${req.get('host')}/verify/transcript/${transcript.referenceNumber}`;

    // Render high quality professional print/PDF HTML document
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official Academic Transcript — ${student?.userId?.fullName || 'Student'}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      color: #172033;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px double #123B6D;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .logo-badge {
      background: #123B6D;
      color: #ffffff;
      font-size: 24px;
      font-weight: 900;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
    }
    .title-box { text-align: center; flex: 1; margin: 0 20px; }
    .uni-name { font-size: 20px; font-weight: 800; color: #123B6D; letter-spacing: 0.5px; margin: 0; }
    .uni-sub { font-size: 11px; color: #667085; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
    .doc-type { font-size: 15px; font-weight: 700; color: #D9A441; margin-top: 6px; letter-spacing: 1px; }
    .meta-box { text-align: right; font-size: 11px; color: #667085; }
    .ref-badge {
      display: inline-block;
      background: #F7F9FC;
      border: 1px solid #D9A441;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 700;
      color: #123B6D;
      font-family: monospace;
      font-size: 12px;
      margin-top: 4px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      background: #F7F9FC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 24px;
      font-size: 12px;
    }
    .info-item span:first-child { color: #667085; font-weight: 500; display: inline-block; width: 120px; }
    .info-item span:last-child { font-weight: 700; color: #172033; }
    .semester-block { margin-bottom: 20px; page-break-inside: avoid; }
    .semester-header {
      background: #123B6D;
      color: #ffffff;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 700;
      border-radius: 6px 6px 0 0;
      display: flex;
      justify-content: space-between;
    }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th {
      background: #F1F5F9;
      color: #172033;
      font-weight: 600;
      text-align: left;
      padding: 6px 8px;
      border-bottom: 1px solid #CBD5E1;
    }
    td { padding: 6px 8px; border-bottom: 1px solid #E2E8F0; }
    tr:nth-child(even) { background-color: #FAFAFA; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .summary-card {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin: 24px 0;
      padding: 12px;
      background: #F8FAFC;
      border: 1px solid #123B6D;
      border-radius: 8px;
      text-align: center;
    }
    .summary-stat { font-size: 18px; font-weight: 800; color: #123B6D; }
    .summary-label { font-size: 10px; color: #667085; text-transform: uppercase; font-weight: 600; }
    .footer {
      margin-top: 30px;
      padding-top: 16px;
      border-top: 1px solid #CBD5E1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 10px;
      color: #667085;
    }
    .signature-line {
      width: 180px;
      border-top: 1px solid #172033;
      text-align: center;
      padding-top: 4px;
      font-weight: 600;
      color: #172033;
    }
    .btn-print {
      position: fixed;
      top: 16px;
      right: 16px;
      background: #123B6D;
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    @media print { .btn-print { display: none; } }
  </style>
</head>
<body>
  <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>

  <div class="header">
    <div class="logo-badge">HU</div>
    <div class="title-box">
      <h1 class="uni-name">HORMUUD UNIVERSITY</h1>
      <div class="uni-sub">Office of the University Registrar • Mogadishu, Somalia</div>
      <div class="doc-type">OFFICIAL ACADEMIC TRANSCRIPT</div>
    </div>
    <div class="meta-box">
      <div>Issue Date: ${issueDateStr}</div>
      <div class="ref-badge">${transcript.referenceNumber}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-item"><span>Student Name:</span> <span>${student?.userId?.fullName ?? 'N/A'}</span></div>
    <div class="info-item"><span>Student ID:</span> <span>${student?.studentId ?? 'N/A'}</span></div>
    <div class="info-item"><span>Program:</span> <span>${student?.programId?.name ?? 'N/A'}</span></div>
    <div class="info-item"><span>Department:</span> <span>${student?.departmentId?.name ?? 'N/A'}</span></div>
    <div class="info-item"><span>Faculty:</span> <span>${student?.facultyId?.name ?? 'N/A'}</span></div>
    <div class="info-item"><span>Admission Year:</span> <span>${student?.admissionYear ?? 'N/A'}</span></div>
  </div>

  ${(transcript.semesterRecords || [])
    .map(
      (sem: any) => `
    <div class="semester-block">
      <div class="semester-header">
        <span>${sem.semesterName} ${sem.academicYearName ? `(${sem.academicYearName})` : ''}</span>
        <span>Semester GPA: ${Number(sem.semesterGpa || 0).toFixed(2)} | Credits: ${sem.creditsEarned || 0}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 15%">Course Code</th>
            <th style="width: 45%">Course Title</th>
            <th class="text-center" style="width: 10%">Credits</th>
            <th class="text-center" style="width: 10%">Marks</th>
            <th class="text-center" style="width: 10%">Grade</th>
            <th class="text-right" style="width: 10%">Grade Point</th>
          </tr>
        </thead>
        <tbody>
          ${(sem.courses || [])
            .map(
              (c: any) => `
            <tr>
              <td><strong>${c.courseCode}</strong></td>
              <td>${c.courseTitle}</td>
              <td class="text-center">${c.credits}</td>
              <td class="text-center">${c.marks}%</td>
              <td class="text-center"><strong>${c.letterGrade}</strong></td>
              <td class="text-right">${Number(c.gradePoint).toFixed(1)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `
    )
    .join('')}

  <div class="summary-card">
    <div>
      <div class="summary-stat">${Number(transcript.cgpa).toFixed(2)}</div>
      <div class="summary-label">Cumulative GPA (CGPA)</div>
    </div>
    <div>
      <div class="summary-stat">${transcript.totalCreditsEarned}</div>
      <div class="summary-label">Credits Earned</div>
    </div>
    <div>
      <div class="summary-stat">${transcript.academicStanding}</div>
      <div class="summary-label">Academic Standing</div>
    </div>
    <div>
      <div class="summary-stat">${transcript.graduationStatus}</div>
      <div class="summary-label">Graduation Status</div>
    </div>
  </div>

  <div class="footer">
    <div>
      <p>Verify this official record online: <br/><a href="${verifyUrl}" style="color: #123B6D;">${verifyUrl}</a></p>
      <p>Security Reference: <strong>${transcript.referenceNumber}</strong></p>
    </div>
    <div class="signature-line">
      University Registrar
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    next(error);
  }
};

// Public verification endpoint: GET /verify/transcript/:referenceNumber
export const verifyTranscriptPublic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { referenceNumber } = req.params;
    const normalizedReferenceNumber = String(referenceNumber ?? '').trim().toUpperCase();
    const transcript: any = await Transcript.findOne({
      referenceNumber: normalizedReferenceNumber
    })
      .populate({
        path: 'studentId',
        populate: { path: 'userId programId departmentId facultyId' }
      })
      .lean();

    if (!transcript) {
      throw new AppError(404, 'No transcript found with this reference number.');
    }

    // Increment verification count
    await Transcript.findByIdAndUpdate(transcript._id, {
      $inc: { verificationCount: 1 },
      $set: { lastVerifiedAt: new Date() }
    });

    await audit(req, 'TRANSCRIPT_VERIFIED', transcript._id.toString(), 'Transcript', {
      referenceNumber
    });

    const student = transcript.studentId;

    // Return safe public details without sensitive passwords or internals
    return success(res, 200, 'Transcript reference verified successfully', {
      isValid: transcript.status === 'Official',
      referenceNumber: transcript.referenceNumber,
      status: transcript.status,
      issueDate: transcript.issueDate,
      verificationCount: (transcript.verificationCount || 0) + 1,
      student: {
        fullName: student?.userId?.fullName,
        studentId: student?.studentId,
        program: student?.programId?.name,
        department: student?.departmentId?.name,
        faculty: student?.facultyId?.name,
        admissionYear: student?.admissionYear
      },
      academicRecord: {
        cgpa: transcript.cgpa,
        totalCreditsEarned: transcript.totalCreditsEarned,
        academicStanding: transcript.academicStanding,
        graduationStatus: transcript.graduationStatus,
        totalSemesters: (transcript.semesterRecords || []).length
      }
    });
  } catch (error) {
    next(error);
  }
};
