export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'STUDENT' | 'LECTURER' | 'HOD' | 'FINANCE';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { page?: number; limit?: number; total?: number; pages?: number };
}

// ----------------------------------------------------
// Academic Entities
// ----------------------------------------------------
export interface Course {
  _id: string;
  code: string;
  title: string;
  description?: string;
  creditHours: number;
  level: number;
  type: 'Core' | 'Elective' | 'General';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CourseSection {
  _id: string;
  courseId: any;
  semesterId: any;
  sectionCode: string;
  lecturerId?: any;
  capacity: number;
  room?: string;
  schedule?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Semester {
  _id: string;
  name: string;
  number: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

// ----------------------------------------------------
// Attendance
// ----------------------------------------------------
export type AttendanceRecordStatus = 'Present' | 'Absent' | 'Late' | 'Excused';
export type AttendanceSessionStatus = 'Open' | 'Closed' | 'Cancelled';

export interface AttendanceSession {
  _id: string;
  courseSectionId: CourseSection;
  lecturerId?: any;
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
  notes?: string;
  status: AttendanceSessionStatus;
  createdAt: string;
}

export interface AttendanceRosterStudent {
  registrationId: string;
  student: {
    _id: string;
    studentId: string;
    userId: { _id: string; fullName: string; email: string };
  };
  status: AttendanceRecordStatus;
  recordId?: string;
  notes?: string;
}

export interface StudentAttendanceCourse {
  sectionId: string;
  sectionCode: string;
  courseCode: string;
  courseTitle: string;
  creditHours: number;
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendancePercentage: number;
  standing: 'Safe' | 'Warning' | 'Critical';
  warningMessage?: string;
}

export interface StudentAttendanceSummary {
  student: {
    _id: string;
    studentId: string;
    fullName: string;
    email: string;
  };
  averagePercentage: number;
  totalSessions: number;
  courses: StudentAttendanceCourse[];
}

// ----------------------------------------------------
// Assessments & Marks
// ----------------------------------------------------
export type AssessmentType = 'Assignment' | 'Quiz' | 'Midterm' | 'Project' | 'Practical' | 'Final Exam';
export type AssessmentStatus = 'Draft' | 'Published' | 'Closed';

export interface Assessment {
  _id: string;
  courseSectionId: CourseSection | string;
  title: string;
  type: AssessmentType;
  description?: string;
  maxMarks: number;
  weight: number;
  dueDate?: string;
  status: AssessmentStatus;
  createdBy?: any;
  createdAt: string;
}

export interface StudentAssessmentResult {
  _id: string;
  assessmentId: Assessment | string;
  studentId: any;
  courseSectionId: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  status: 'Draft' | 'Submitted' | 'Published';
}

export interface AssessmentSheetRow {
  studentId: string;
  studentNumber: string;
  fullName: string;
  email: string;
  marksObtained: number | null;
  maxMarks: number;
  percentage: number | null;
  status: string;
  resultId?: string;
}

// ----------------------------------------------------
// Examinations
// ----------------------------------------------------
export type ExamType = 'Midterm' | 'Final' | 'Make-up' | 'Supplementary';
export type ExamStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export interface Exam {
  _id: string;
  courseSectionId: any;
  semesterId: any;
  examType: ExamType;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  duration: number;
  instructions?: string;
  status: ExamStatus;
  invigilatorId?: any;
}

// ----------------------------------------------------
// Results & Grades
// ----------------------------------------------------
export type ResultStatus = 'Draft' | 'Submitted' | 'Verified' | 'Published' | 'Locked';

export interface CourseResult {
  _id: string;
  studentId: any;
  courseSectionId: any;
  courseId: Course;
  semesterId: Semester;
  totalMarks: number;
  letterGrade: string;
  gradePoint: number;
  credits: number;
  status: ResultStatus;
  submittedBy?: any;
  submittedAt?: string;
  verifiedBy?: any;
  verifiedAt?: string;
  publishedBy?: any;
  publishedAt?: string;
  lockedAt?: string;
  changeHistory?: Array<{
    previousValue: number;
    newValue: number;
    previousGrade?: string;
    newGrade?: string;
    reason: string;
    changedAt: string;
  }>;
}

export interface StudentPerformanceSummary {
  student: {
    _id: string;
    studentId: string;
    fullName: string;
    email: string;
    program?: string;
    department?: string;
    faculty?: string;
    batch?: string;
  };
  currentGpa: number;
  cgpa: number;
  totalCreditsEarned: number;
  totalCreditsAttempted: number;
  creditsRemaining: number;
  coursesCompleted: number;
  coursesFailed: number;
  academicStanding: string;
  gradeDistribution: Record<string, number>;
  semesterHistory: Array<{
    semesterId: string;
    semesterName: string;
    gpa: number;
    creditsEarned: number;
    creditsAttempted: number;
    academicStanding: string;
  }>;
  courseResults: Array<{
    courseCode: string;
    courseTitle: string;
    semesterName: string;
    credits: number;
    totalMarks: number;
    letterGrade: string;
    gradePoint: number;
  }>;
}

// ----------------------------------------------------
// Official Transcript
// ----------------------------------------------------
export interface Transcript {
  _id: string;
  studentId: any;
  referenceNumber: string;
  issueDate: string;
  status: 'Draft' | 'Official' | 'Revoked';
  cgpa: number;
  totalCreditsEarned: number;
  totalCreditsAttempted: number;
  academicStanding: string;
  graduationStatus: string;
  semesterRecords: Array<{
    semesterName: string;
    academicYearName: string;
    semesterGpa: number;
    creditsEarned: number;
    courses: Array<{
      courseCode: string;
      courseTitle: string;
      credits: number;
      marks: number;
      letterGrade: string;
      gradePoint: number;
    }>;
  }>;
  verificationCount: number;
}

export interface TranscriptVerification {
  isValid: boolean;
  referenceNumber: string;
  status: string;
  issueDate: string;
  verificationCount: number;
  student: {
    fullName: string;
    studentId: string;
    program: string;
    department: string;
    faculty: string;
    admissionYear: number;
  };
  academicRecord: {
    cgpa: number;
    totalCreditsEarned: number;
    academicStanding: string;
    graduationStatus: string;
    totalSemesters: number;
  };
}

// ----------------------------------------------------
// Grade Scales & Standing Rules
// ----------------------------------------------------
export interface GradeScale {
  _id: string;
  letter: string;
  minimumPercentage: number;
  maximumPercentage: number;
  gradePoint: number;
  passStatus: boolean;
  order?: number;
}

export interface AcademicStandingRule {
  _id: string;
  code: string;
  name: string;
  minCGPA: number;
  maxCGPA: number;
  status: 'ACTIVE' | 'INACTIVE';
  order?: number;
}
