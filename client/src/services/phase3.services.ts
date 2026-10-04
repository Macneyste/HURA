import api from './api';
import type {
  ApiResponse,
  AttendanceRosterStudent,
  AttendanceSession,
  StudentAttendanceSummary,
  Assessment,
  AssessmentSheetRow,
  StudentAssessmentResult,
  Exam,
  CourseResult,
  StudentPerformanceSummary,
  Transcript,
  TranscriptVerification,
  GradeScale,
  AcademicStandingRule
} from '../types';

// ----------------------------------------------------
// Attendance Service
// ----------------------------------------------------
export const attendanceService = {
  listSessions: (params?: { courseSectionId?: string; date?: string; status?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<AttendanceSession[]>>('/attendance/sessions', { params }).then((r) => r.data),

  getSession: (id: string) =>
    api.get<ApiResponse<{ session: AttendanceSession; roster: AttendanceRosterStudent[]; summary: any }>>(
      `/attendance/sessions/${id}`
    ).then((r) => r.data),

  createSession: (data: {
    courseSectionId: string;
    date: string;
    startTime: string;
    endTime: string;
    topic: string;
    notes?: string;
    status?: string;
  }) => api.post<ApiResponse<AttendanceSession>>('/attendance/sessions', data).then((r) => r.data),

  updateSession: (id: string, data: Partial<AttendanceSession>) =>
    api.patch<ApiResponse<AttendanceSession>>(`/attendance/sessions/${id}`, data).then((r) => r.data),

  saveRecords: (sessionId: string, records: Array<{ studentId: string; status: string; notes?: string }>) =>
    api.post<ApiResponse<any>>(`/attendance/sessions/${sessionId}/records`, { records }).then((r) => r.data),

  getStudentAttendance: (studentId: string) =>
    api.get<ApiResponse<StudentAttendanceSummary>>(`/attendance/students/${studentId}`).then((r) => r.data)
};

// ----------------------------------------------------
// Assessment Service
// ----------------------------------------------------
export const assessmentService = {
  list: (params?: { courseSectionId?: string; type?: string; status?: string }) =>
    api.get<ApiResponse<Assessment[]>>('/assessments', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<ApiResponse<Assessment>>(`/assessments/${id}`).then((r) => r.data),

  getSectionSummary: (sectionId: string) =>
    api.get<ApiResponse<{ section: any; assessments: Assessment[]; totalWeight: number; isValid: boolean; weightBalance: number }>>(
      `/assessments/section/${sectionId}/summary`
    ).then((r) => r.data),

  create: (data: Partial<Assessment>) =>
    api.post<ApiResponse<Assessment>>('/assessments', data).then((r) => r.data),

  update: (id: string, data: Partial<Assessment>) =>
    api.patch<ApiResponse<Assessment>>(`/assessments/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<any>>(`/assessments/${id}`).then((r) => r.data)
};

// ----------------------------------------------------
// Marks Service
// ----------------------------------------------------
export const marksService = {
  getSheet: (assessmentId: string) =>
    api.get<ApiResponse<{ assessment: Assessment; sheet: AssessmentSheetRow[]; stats: any }>>(
      `/assessment-results/sheet/${assessmentId}`
    ).then((r) => r.data),

  enterBulk: (assessmentId: string, results: Array<{ studentId: string; marksObtained: number }>) =>
    api.post<ApiResponse<any>>('/assessment-results', { assessmentId, results }).then((r) => r.data),

  publish: (assessmentId: string) =>
    api.post<ApiResponse<any>>('/assessment-results/publish', { assessmentId }).then((r) => r.data)
};

// ----------------------------------------------------
// Exam Service
// ----------------------------------------------------
export const examService = {
  list: (params?: { semesterId?: string; courseSectionId?: string; examType?: string; status?: string; room?: string }) =>
    api.get<ApiResponse<Exam[]>>('/exams', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<ApiResponse<Exam>>(`/exams/${id}`).then((r) => r.data),

  create: (data: Partial<Exam>) =>
    api.post<ApiResponse<Exam>>('/exams', data).then((r) => r.data),

  update: (id: string, data: Partial<Exam>) =>
    api.patch<ApiResponse<Exam>>(`/exams/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<any>>(`/exams/${id}`).then((r) => r.data)
};

// ----------------------------------------------------
// Results Service
// ----------------------------------------------------
export const resultsService = {
  list: (params?: { courseSectionId?: string; semesterId?: string; studentId?: string; status?: string }) =>
    api.get<ApiResponse<CourseResult[]>>('/results', { params }).then((r) => r.data),

  getStudentPerformance: (studentId: string) =>
    api.get<ApiResponse<StudentPerformanceSummary>>(`/results/performance/${studentId}`).then((r) => r.data),

  calculate: (courseSectionId: string) =>
    api.post<ApiResponse<{ count: number; results: CourseResult[] }>>('/results/calculate', { courseSectionId }).then((r) => r.data),

  submit: (courseSectionId: string) =>
    api.post<ApiResponse<{ submittedCount: number }>>('/results/submit', { courseSectionId }).then((r) => r.data),

  verify: (courseSectionId: string, action: 'Approve' | 'Return', returnReason?: string) =>
    api.post<ApiResponse<any>>('/results/verify', { courseSectionId, action, returnReason }).then((r) => r.data),

  publish: (data: { courseSectionId?: string; semesterId?: string }) =>
    api.post<ApiResponse<{ publishedCount: number }>>('/results/publish', data).then((r) => r.data),

  changePublished: (data: { resultId: string; totalMarks: number; reason: string }) =>
    api.patch<ApiResponse<CourseResult>>('/results/change-published', data).then((r) => r.data)
};

// ----------------------------------------------------
// Transcript Service
// ----------------------------------------------------
export const transcriptService = {
  getStudentTranscript: (studentId: string) =>
    api.get<ApiResponse<Transcript>>(`/transcripts/${studentId}`).then((r) => r.data),

  generate: (studentId: string, graduationStatus?: string) =>
    api.post<ApiResponse<Transcript>>('/transcripts/generate', { studentId, graduationStatus }).then((r) => r.data),

  downloadUrl: (id: string) =>
    `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1'}/transcripts/${id}/download`,

  verifyPublic: (referenceNumber: string) =>
    api.get<ApiResponse<TranscriptVerification>>(`/verify/transcript/${referenceNumber}`).then((r) => r.data)
};

// ----------------------------------------------------
// Academic Config Service (Grade Scales & Standing)
// ----------------------------------------------------
export const configService = {
  listGradeScales: () =>
    api.get<ApiResponse<GradeScale[]>>('/grade-scales').then((r) => r.data),

  createGradeScale: (data: Partial<GradeScale>) =>
    api.post<ApiResponse<GradeScale>>('/grade-scales', data).then((r) => r.data),

  updateGradeScale: (id: string, data: Partial<GradeScale>) =>
    api.patch<ApiResponse<GradeScale>>(`/grade-scales/${id}`, data).then((r) => r.data),

  deleteGradeScale: (id: string) =>
    api.delete<ApiResponse<any>>(`/grade-scales/${id}`).then((r) => r.data),

  listAcademicStanding: () =>
    api.get<ApiResponse<AcademicStandingRule[]>>('/academic-standing').then((r) => r.data),

  createAcademicStanding: (data: Partial<AcademicStandingRule>) =>
    api.post<ApiResponse<AcademicStandingRule>>('/academic-standing', data).then((r) => r.data),

  updateAcademicStanding: (id: string, data: Partial<AcademicStandingRule>) =>
    api.patch<ApiResponse<AcademicStandingRule>>(`/academic-standing/${id}`, data).then((r) => r.data),

  getAttendanceSettings: () =>
    api.get<ApiResponse<any>>('/attendance-settings').then((r) => r.data),

  updateAttendanceSettings: (data: any) =>
    api.patch<ApiResponse<any>>('/attendance-settings', data).then((r) => r.data)
};

// Also export basic academic entities
export const academicService = {
  getCourses: () => api.get<ApiResponse<any[]>>('/courses').then((r) => r.data),
  getSections: () => api.get<ApiResponse<any[]>>('/course-sections').then((r) => r.data),
  getSemesters: () => api.get<ApiResponse<any[]>>('/semesters').then((r) => r.data),
  getStudents: () => api.get<ApiResponse<any[]>>('/students').then((r) => r.data)
};
