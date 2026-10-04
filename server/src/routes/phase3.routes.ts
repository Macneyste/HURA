import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { PERMISSIONS } from '../constants/permissions.js';

import * as attendance from '../controllers/attendance.controller.js';
import * as assessment from '../controllers/assessment.controller.js';
import * as marks from '../controllers/marks.controller.js';
import * as exam from '../controllers/exam.controller.js';
import * as results from '../controllers/results.controller.js';
import * as transcript from '../controllers/transcript.controller.js';
import * as config from '../controllers/academic-config.controller.js';

import * as v from '../validators/phase3.validator.js';

// ----------------------------------------------------
// Public Verification Router
// ----------------------------------------------------
export const publicVerifyRouter = Router();
publicVerifyRouter.get('/transcript/:referenceNumber', transcript.verifyTranscriptPublic);

// ----------------------------------------------------
// Attendance Router
// ----------------------------------------------------
export const attendanceRouter = Router();
attendanceRouter.use(authenticate);

attendanceRouter.get('/sessions', requirePermission(PERMISSIONS.ATTENDANCE_READ), attendance.listSessions);
attendanceRouter.post(
  '/sessions',
  requirePermission(PERMISSIONS.ATTENDANCE_CREATE),
  validate(v.createAttendanceSessionSchema),
  attendance.createSession
);
attendanceRouter.get('/sessions/:id', requirePermission(PERMISSIONS.ATTENDANCE_READ), attendance.getSession);
attendanceRouter.patch(
  '/sessions/:id',
  requirePermission(PERMISSIONS.ATTENDANCE_UPDATE),
  validate(v.updateAttendanceSessionSchema),
  attendance.updateSession
);
attendanceRouter.post(
  '/sessions/:id/records',
  requirePermission(PERMISSIONS.ATTENDANCE_UPDATE),
  validate(v.saveAttendanceRecordsSchema),
  attendance.saveSessionRecords
);
attendanceRouter.patch(
  '/records/:id',
  requirePermission(PERMISSIONS.ATTENDANCE_UPDATE),
  validate(v.updateAttendanceRecordSchema),
  attendance.updateSingleRecord
);
attendanceRouter.get(
  '/students/:id',
  requirePermission(PERMISSIONS.ATTENDANCE_READ),
  attendance.getStudentAttendance
);

// ----------------------------------------------------
// Assessment Router
// ----------------------------------------------------
export const assessmentRouter = Router();
assessmentRouter.use(authenticate);

assessmentRouter.get('/', requirePermission(PERMISSIONS.ASSESSMENT_READ), assessment.listAssessments);
assessmentRouter.post(
  '/',
  requirePermission(PERMISSIONS.ASSESSMENT_CREATE),
  validate(v.createAssessmentSchema),
  assessment.createAssessment
);
assessmentRouter.get(
  '/section/:sectionId/summary',
  requirePermission(PERMISSIONS.ASSESSMENT_READ),
  assessment.getSectionAssessmentSummary
);
assessmentRouter.get('/:id', requirePermission(PERMISSIONS.ASSESSMENT_READ), assessment.getAssessment);
assessmentRouter.patch(
  '/:id',
  requirePermission(PERMISSIONS.ASSESSMENT_UPDATE),
  validate(v.updateAssessmentSchema),
  assessment.updateAssessment
);
assessmentRouter.delete(
  '/:id',
  requirePermission(PERMISSIONS.ASSESSMENT_MANAGE),
  assessment.deleteAssessment
);

// ----------------------------------------------------
// Marks Router
// ----------------------------------------------------
export const marksRouter = Router();
marksRouter.use(authenticate);

marksRouter.get('/', requirePermission(PERMISSIONS.MARKS_READ), marks.listAssessmentResults);
marksRouter.get('/sheet/:assessmentId', requirePermission(PERMISSIONS.MARKS_ENTER), marks.getAssessmentSheet);
marksRouter.post(
  '/',
  requirePermission(PERMISSIONS.MARKS_ENTER),
  validate(v.enterMarksBulkSchema),
  marks.enterMarksBulk
);
marksRouter.patch(
  '/:id',
  requirePermission(PERMISSIONS.MARKS_ENTER),
  validate(v.updateSingleMarkSchema),
  marks.updateSingleMark
);
marksRouter.post(
  '/publish',
  requirePermission(PERMISSIONS.MARKS_PUBLISH),
  validate(v.publishAssessmentMarksSchema),
  marks.publishAssessmentMarks
);

// ----------------------------------------------------
// Exam Router
// ----------------------------------------------------
export const examRouter = Router();
examRouter.use(authenticate);

examRouter.get('/', requirePermission(PERMISSIONS.EXAM_READ), exam.listExams);
examRouter.post(
  '/',
  requirePermission(PERMISSIONS.EXAM_CREATE),
  validate(v.createExamSchema),
  exam.createExam
);
examRouter.get('/:id', requirePermission(PERMISSIONS.EXAM_READ), exam.getExam);
examRouter.patch(
  '/:id',
  requirePermission(PERMISSIONS.EXAM_UPDATE),
  validate(v.updateExamSchema),
  exam.updateExam
);
examRouter.delete('/:id', requirePermission(PERMISSIONS.EXAM_MANAGE), exam.deleteExam);

// ----------------------------------------------------
// Results Router
// ----------------------------------------------------
export const resultsRouter = Router();
resultsRouter.use(authenticate);

resultsRouter.get('/', requirePermission(PERMISSIONS.RESULTS_READ), results.listResults);
resultsRouter.get(
  '/performance/:studentId',
  requirePermission(PERMISSIONS.RESULTS_READ),
  results.getStudentPerformance
);
resultsRouter.get(
  '/:studentId',
  requirePermission(PERMISSIONS.RESULTS_READ),
  results.getStudentPerformance
);
resultsRouter.post(
  '/calculate',
  requirePermission(PERMISSIONS.MARKS_ENTER),
  validate(v.calculateResultsSchema),
  results.calculateCourseResults
);
resultsRouter.post(
  '/submit',
  requirePermission(PERMISSIONS.MARKS_SUBMIT),
  validate(v.submitResultsSchema),
  results.submitResults
);
resultsRouter.post(
  '/verify',
  requirePermission(PERMISSIONS.RESULTS_VERIFY),
  validate(v.verifyResultsSchema),
  results.verifyResults
);
resultsRouter.post(
  '/publish',
  requirePermission(PERMISSIONS.RESULTS_PUBLISH),
  validate(v.publishResultsSchema),
  results.publishResults
);
resultsRouter.patch(
  '/change-published',
  requirePermission(PERMISSIONS.RESULTS_PUBLISH),
  validate(v.changePublishedResultSchema),
  results.changePublishedResult
);

// ----------------------------------------------------
// Transcript Router
// ----------------------------------------------------
export const transcriptRouter = Router();
transcriptRouter.get('/:id/download', transcript.downloadTranscriptHtml);

transcriptRouter.use(authenticate);
transcriptRouter.get('/:studentId', requirePermission(PERMISSIONS.TRANSCRIPT_READ), transcript.getStudentTranscript);
transcriptRouter.post(
  '/generate',
  requirePermission(PERMISSIONS.TRANSCRIPT_GENERATE),
  validate(v.generateTranscriptSchema),
  transcript.generateTranscript
);

// ----------------------------------------------------
// Config Router (Grade Scales & Academic Standing)
// ----------------------------------------------------
export const configRouter = Router();
configRouter.use(authenticate);

configRouter.get('/grade-scales', config.listGradeScales);
configRouter.post(
  '/grade-scales',
  requirePermission(PERMISSIONS.RESULTS_PUBLISH),
  validate(v.gradeScaleSchema),
  config.createGradeScale
);
configRouter.patch(
  '/grade-scales/:id',
  requirePermission(PERMISSIONS.RESULTS_PUBLISH),
  validate(v.gradeScaleSchema),
  config.updateGradeScale
);
configRouter.delete(
  '/grade-scales/:id',
  requirePermission(PERMISSIONS.RESULTS_PUBLISH),
  config.deleteGradeScale
);

configRouter.get('/academic-standing', config.listAcademicStanding);
configRouter.post(
  '/academic-standing',
  requirePermission(PERMISSIONS.RESULTS_PUBLISH),
  validate(v.academicStandingSchema),
  config.createAcademicStanding
);
configRouter.patch(
  '/academic-standing/:id',
  requirePermission(PERMISSIONS.RESULTS_PUBLISH),
  validate(v.academicStandingSchema),
  config.updateAcademicStanding
);

configRouter.get('/attendance-settings', config.getAttendanceSetting);
configRouter.patch(
  '/attendance-settings',
  requirePermission(PERMISSIONS.ATTENDANCE_MANAGE),
  config.updateAttendanceSetting
);
