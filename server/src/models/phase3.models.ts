import { Schema, model, type HydratedDocument, type Types } from 'mongoose';

const ref = (name: string, required = true) => ({
  type: Schema.Types.ObjectId,
  ref: name,
  required
});

// ----------------------------------------------------
// 1. Attendance Management
// ----------------------------------------------------
export const ATTENDANCE_SESSION_STATUSES = ['Open', 'Closed', 'Cancelled'] as const;
export type AttendanceSessionStatus = typeof ATTENDANCE_SESSION_STATUSES[number];

const attendanceSessionSchema = new Schema(
  {
    courseSectionId: ref('CourseSection'),
    lecturerId: ref('LecturerProfile'),
    date: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    topic: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ATTENDANCE_SESSION_STATUSES,
      default: 'Open',
      index: true
    }
  },
  { timestamps: true }
);

attendanceSessionSchema.index({ courseSectionId: 1, date: -1 });
export const AttendanceSession = model('AttendanceSession', attendanceSessionSchema);

export const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Late', 'Excused'] as const;
export type AttendanceRecordStatus = typeof ATTENDANCE_STATUSES[number];

const attendanceRecordSchema = new Schema(
  {
    attendanceSessionId: ref('AttendanceSession'),
    studentId: ref('StudentProfile'),
    courseSectionId: ref('CourseSection'),
    status: {
      type: String,
      enum: ATTENDANCE_STATUSES,
      default: 'Present',
      index: true
    },
    markedAt: { type: Date, default: Date.now },
    markedBy: ref('User'),
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

attendanceRecordSchema.index({ studentId: 1, attendanceSessionId: 1 }, { unique: true });
attendanceRecordSchema.index({ courseSectionId: 1, studentId: 1 });
export const AttendanceRecord = model('AttendanceRecord', attendanceRecordSchema);

export const attendanceSettingSchema = new Schema(
  {
    minimumRequiredPercentage: { type: Number, default: 75, min: 0, max: 100 },
    warningPercentage: { type: Number, default: 75, min: 0, max: 100 },
    criticalPercentage: { type: Number, default: 50, min: 0, max: 100 },
    lateWeight: { type: Number, default: 0.5, min: 0, max: 1 }
  },
  { timestamps: true }
);
export const AttendanceSetting = model('AttendanceSetting', attendanceSettingSchema);

// ----------------------------------------------------
// 2. Assessment Management
// ----------------------------------------------------
export const ASSESSMENT_TYPES = [
  'Assignment',
  'Quiz',
  'Midterm',
  'Project',
  'Practical',
  'Final Exam'
] as const;
export type AssessmentType = typeof ASSESSMENT_TYPES[number];

export const ASSESSMENT_STATUSES = ['Draft', 'Published', 'Closed'] as const;
export type AssessmentStatus = typeof ASSESSMENT_STATUSES[number];

const assessmentSchema = new Schema(
  {
    courseSectionId: ref('CourseSection'),
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ASSESSMENT_TYPES, required: true },
    description: { type: String, trim: true },
    maxMarks: { type: Number, required: true, min: 1 },
    weight: { type: Number, required: true, min: 0.1, max: 100 },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ASSESSMENT_STATUSES,
      default: 'Draft',
      index: true
    },
    createdBy: ref('User')
  },
  { timestamps: true }
);

assessmentSchema.index({ courseSectionId: 1, type: 1 });
export const Assessment = model('Assessment', assessmentSchema);

// ----------------------------------------------------
// 3. Student Assessment Result / Marks
// ----------------------------------------------------
export const MARKS_STATUSES = ['Draft', 'Submitted', 'Published'] as const;
export type MarksStatus = typeof MARKS_STATUSES[number];

const studentAssessmentResultSchema = new Schema(
  {
    assessmentId: ref('Assessment'),
    studentId: ref('StudentProfile'),
    courseSectionId: ref('CourseSection'),
    marksObtained: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true, min: 1 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    enteredBy: ref('User'),
    status: {
      type: String,
      enum: MARKS_STATUSES,
      default: 'Draft',
      index: true
    },
    publishedAt: { type: Date }
  },
  { timestamps: true }
);

studentAssessmentResultSchema.index({ studentId: 1, assessmentId: 1 }, { unique: true });
studentAssessmentResultSchema.index({ courseSectionId: 1, studentId: 1 });
export const StudentAssessmentResult = model('StudentAssessmentResult', studentAssessmentResultSchema);

// ----------------------------------------------------
// 4. Examination Management
// ----------------------------------------------------
export const EXAM_TYPES = ['Midterm', 'Final', 'Make-up', 'Supplementary'] as const;
export type ExamType = typeof EXAM_TYPES[number];

export const EXAM_STATUSES = ['Scheduled', 'Completed', 'Cancelled'] as const;
export type ExamStatus = typeof EXAM_STATUSES[number];

const examSchema = new Schema(
  {
    courseSectionId: ref('CourseSection'),
    semesterId: ref('Semester'),
    examType: { type: String, enum: EXAM_TYPES, required: true },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String, required: true, trim: true, uppercase: true },
    duration: { type: Number, required: true, min: 10 }, // in minutes
    instructions: { type: String, trim: true },
    status: {
      type: String,
      enum: EXAM_STATUSES,
      default: 'Scheduled',
      index: true
    },
    invigilatorId: ref('LecturerProfile', false)
  },
  { timestamps: true }
);

examSchema.index({ semesterId: 1, date: 1, room: 1 });
examSchema.index({ courseSectionId: 1, examType: 1 });
export const Exam = model('Exam', examSchema);

// ----------------------------------------------------
// 5. Grade Scale Configuration
// ----------------------------------------------------
const gradeScaleSchema = new Schema(
  {
    letter: { type: String, required: true, unique: true, uppercase: true, trim: true },
    minimumPercentage: { type: Number, required: true, min: 0, max: 100 },
    maximumPercentage: { type: Number, required: true, min: 0, max: 100 },
    gradePoint: { type: Number, required: true, min: 0, max: 4.0 },
    passStatus: { type: Boolean, required: true },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const GradeScale = model('GradeScale', gradeScaleSchema);

// ----------------------------------------------------
// 6. Academic Standing Rules
// ----------------------------------------------------
const academicStandingRuleSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    minCGPA: { type: Number, required: true, min: 0, max: 4.0 },
    maxCGPA: { type: Number, required: true, min: 0, max: 4.0 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const AcademicStandingRule = model('AcademicStandingRule', academicStandingRuleSchema);

// ----------------------------------------------------
// 7. Results Management (Course & Semester Results)
// ----------------------------------------------------
export const RESULT_STATUSES = ['Draft', 'Submitted', 'Verified', 'Published', 'Locked'] as const;
export type ResultStatus = typeof RESULT_STATUSES[number];

const courseResultSchema = new Schema(
  {
    studentId: ref('StudentProfile'),
    courseSectionId: ref('CourseSection'),
    courseId: ref('Course'),
    semesterId: ref('Semester'),
    totalMarks: { type: Number, required: true, min: 0, max: 100 },
    letterGrade: { type: String, required: true, uppercase: true },
    gradePoint: { type: Number, required: true, min: 0, max: 4.0 },
    credits: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: RESULT_STATUSES,
      default: 'Draft',
      index: true
    },
    submittedBy: ref('User', false),
    submittedAt: { type: Date },
    verifiedBy: ref('User', false),
    verifiedAt: { type: Date },
    publishedBy: ref('User', false),
    publishedAt: { type: Date },
    lockedAt: { type: Date },
    changeHistory: [
      {
        previousValue: Number,
        newValue: Number,
        previousGrade: String,
        newGrade: String,
        changedBy: ref('User'),
        reason: { type: String, required: true },
        changedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

courseResultSchema.index({ studentId: 1, courseSectionId: 1 }, { unique: true });
courseResultSchema.index({ studentId: 1, semesterId: 1 });
courseResultSchema.index({ courseSectionId: 1, status: 1 });
export const CourseResult = model('CourseResult', courseResultSchema);

const semesterResultSchema = new Schema(
  {
    studentId: ref('StudentProfile'),
    semesterId: ref('Semester'),
    gpa: { type: Number, required: true, min: 0, max: 4.0 },
    totalCreditsEarned: { type: Number, required: true, min: 0 },
    totalCreditsAttempted: { type: Number, required: true, min: 0 },
    academicStanding: { type: String, required: true },
    status: {
      type: String,
      enum: RESULT_STATUSES,
      default: 'Draft',
      index: true
    },
    publishedAt: { type: Date }
  },
  { timestamps: true }
);

semesterResultSchema.index({ studentId: 1, semesterId: 1 }, { unique: true });
export const SemesterResult = model('SemesterResult', semesterResultSchema);

// ----------------------------------------------------
// 8. Official Transcript
// ----------------------------------------------------
export const TRANSCRIPT_STATUSES = ['Draft', 'Official', 'Revoked'] as const;
export type TranscriptStatus = typeof TRANSCRIPT_STATUSES[number];

const transcriptSchema = new Schema(
  {
    studentId: ref('StudentProfile'),
    referenceNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    issueDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: TRANSCRIPT_STATUSES,
      default: 'Official',
      index: true
    },
    cgpa: { type: Number, required: true, min: 0, max: 4.0 },
    totalCreditsEarned: { type: Number, required: true, min: 0 },
    totalCreditsAttempted: { type: Number, required: true, min: 0 },
    academicStanding: { type: String, required: true },
    graduationStatus: {
      type: String,
      enum: ['In Progress', 'Eligible for Graduation', 'Graduated'],
      default: 'In Progress'
    },
    semesterRecords: [
      {
        semesterId: ref('Semester'),
        semesterName: String,
        academicYearName: String,
        semesterGpa: Number,
        creditsAttempted: Number,
        creditsEarned: Number,
        courses: [
          {
            courseId: ref('Course'),
            courseCode: String,
            courseTitle: String,
            credits: Number,
            marks: Number,
            letterGrade: String,
            gradePoint: Number
          }
        ]
      }
    ],
    generatedBy: ref('User'),
    verificationCount: { type: Number, default: 0 },
    lastVerifiedAt: { type: Date }
  },
  { timestamps: true }
);

export const Transcript = model('Transcript', transcriptSchema);
