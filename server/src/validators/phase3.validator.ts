import { z } from 'zod';
import { objectId } from './academic.validator.js';
import {
  ASSESSMENT_TYPES,
  ASSESSMENT_STATUSES,
  ATTENDANCE_SESSION_STATUSES,
  ATTENDANCE_STATUSES,
  EXAM_TYPES,
  EXAM_STATUSES
} from '../models/phase3.models.js';

// ----------------------------------------------------
// Attendance
// ----------------------------------------------------
export const createAttendanceSessionSchema = z.object({
  body: z.object({
    courseSectionId: objectId,
    date: z.coerce.date(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)'),
    topic: z.string().min(2).max(200),
    notes: z.string().max(500).optional(),
    status: z.enum(ATTENDANCE_SESSION_STATUSES).optional()
  }).refine((d) => d.startTime < d.endTime, 'Start time must be before end time')
});

export const updateAttendanceSessionSchema = z.object({
  body: z.object({
    date: z.coerce.date().optional(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    topic: z.string().min(2).max(200).optional(),
    notes: z.string().max(500).optional(),
    status: z.enum(ATTENDANCE_SESSION_STATUSES).optional()
  })
});

export const saveAttendanceRecordsSchema = z.object({
  body: z.object({
    records: z.array(
      z.object({
        studentId: objectId,
        status: z.enum(ATTENDANCE_STATUSES),
        notes: z.string().max(200).optional()
      })
    ).min(1, 'At least one record is required')
  })
});

export const updateAttendanceRecordSchema = z.object({
  body: z.object({
    status: z.enum(ATTENDANCE_STATUSES),
    notes: z.string().max(200).optional()
  })
});

// ----------------------------------------------------
// Assessment
// ----------------------------------------------------
export const createAssessmentSchema = z.object({
  body: z.object({
    courseSectionId: objectId,
    title: z.string().min(2).max(140),
    type: z.enum(ASSESSMENT_TYPES),
    description: z.string().max(1000).optional(),
    maxMarks: z.coerce.number().positive('Max marks must be greater than 0'),
    weight: z.coerce.number().min(0.1, 'Weight must be at least 0.1%').max(100, 'Weight cannot exceed 100%'),
    dueDate: z.coerce.date().optional(),
    status: z.enum(ASSESSMENT_STATUSES).optional()
  })
});

export const updateAssessmentSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(140).optional(),
    type: z.enum(ASSESSMENT_TYPES).optional(),
    description: z.string().max(1000).optional(),
    maxMarks: z.coerce.number().positive().optional(),
    weight: z.coerce.number().min(0.1).max(100).optional(),
    dueDate: z.coerce.date().optional(),
    status: z.enum(ASSESSMENT_STATUSES).optional()
  })
});

// ----------------------------------------------------
// Marks Entry
// ----------------------------------------------------
export const enterMarksBulkSchema = z.object({
  body: z.object({
    assessmentId: objectId,
    results: z.array(
      z.object({
        studentId: objectId,
        marksObtained: z.coerce.number().min(0, 'Marks obtained cannot be negative')
      })
    ).min(1, 'At least one student mark is required')
  })
});

export const updateSingleMarkSchema = z.object({
  body: z.object({
    marksObtained: z.coerce.number().min(0, 'Marks obtained cannot be negative')
  })
});

export const publishAssessmentMarksSchema = z.object({
  body: z.object({
    assessmentId: objectId
  })
});

// ----------------------------------------------------
// Exams
// ----------------------------------------------------
export const createExamSchema = z.object({
  body: z.object({
    courseSectionId: objectId,
    semesterId: objectId,
    examType: z.enum(EXAM_TYPES),
    date: z.coerce.date(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)'),
    room: z.string().min(1).max(60),
    duration: z.coerce.number().int().min(10, 'Duration must be at least 10 minutes'),
    instructions: z.string().max(1000).optional(),
    invigilatorId: objectId.optional(),
    status: z.enum(EXAM_STATUSES).optional()
  }).refine((d) => d.startTime < d.endTime, 'Start time must be before end time')
});

export const updateExamSchema = z.object({
  body: z.object({
    courseSectionId: objectId.optional(),
    semesterId: objectId.optional(),
    examType: z.enum(EXAM_TYPES).optional(),
    date: z.coerce.date().optional(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    room: z.string().min(1).max(60).optional(),
    duration: z.coerce.number().int().min(10).optional(),
    instructions: z.string().max(1000).optional(),
    invigilatorId: objectId.optional(),
    status: z.enum(EXAM_STATUSES).optional()
  })
});

// ----------------------------------------------------
// Results & Calculations
// ----------------------------------------------------
export const calculateResultsSchema = z.object({
  body: z.object({
    courseSectionId: objectId
  })
});

export const submitResultsSchema = z.object({
  body: z.object({
    courseSectionId: objectId
  })
});

export const verifyResultsSchema = z.object({
  body: z.object({
    courseSectionId: objectId,
    action: z.enum(['Approve', 'Return']),
    returnReason: z.string().max(500).optional()
  })
});

export const publishResultsSchema = z.object({
  body: z.object({
    courseSectionId: objectId.optional(),
    semesterId: objectId.optional()
  }).refine((d) => d.courseSectionId || d.semesterId, 'Provide either courseSectionId or semesterId')
});

export const changePublishedResultSchema = z.object({
  body: z.object({
    resultId: objectId,
    totalMarks: z.coerce.number().min(0).max(100),
    reason: z.string().min(5, 'A clear reason is required to modify published grades').max(500)
  })
});

// ----------------------------------------------------
// Transcripts
// ----------------------------------------------------
export const generateTranscriptSchema = z.object({
  body: z.object({
    studentId: objectId,
    graduationStatus: z.enum(['In Progress', 'Eligible for Graduation', 'Graduated']).optional()
  })
});

// ----------------------------------------------------
// Grade Scale & Academic Standing
// ----------------------------------------------------
export const gradeScaleSchema = z.object({
  body: z.object({
    letter: z.string().min(1).max(5),
    minimumPercentage: z.coerce.number().min(0).max(100),
    maximumPercentage: z.coerce.number().min(0).max(100),
    gradePoint: z.coerce.number().min(0).max(4),
    passStatus: z.boolean(),
    order: z.coerce.number().int().optional()
  }).refine((d) => d.minimumPercentage <= d.maximumPercentage, 'Min percentage cannot exceed max')
});

export const academicStandingSchema = z.object({
  body: z.object({
    code: z.string().min(2).max(30),
    name: z.string().min(2).max(60),
    minCGPA: z.coerce.number().min(0).max(4),
    maxCGPA: z.coerce.number().min(0).max(4),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    order: z.coerce.number().int().optional()
  }).refine((d) => d.minCGPA <= d.maxCGPA, 'Min CGPA cannot exceed max CGPA')
});
