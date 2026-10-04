import { Schema, model } from 'mongoose';

export const AUDIT_ACTIONS = [
  'LOGIN', 'LOGOUT', 'CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'CHANGE_ROLE',
  'CHANGE_PASSWORD', 'ACTIVATE_USER', 'DEACTIVATE_USER',
  'CREATE_FACULTY', 'UPDATE_FACULTY', 'CREATE_DEPARTMENT', 'UPDATE_DEPARTMENT',
  'CREATE_PROGRAM', 'UPDATE_PROGRAM', 'CREATE_COURSE', 'UPDATE_COURSE',
  'CREATE_STUDENT', 'UPDATE_STUDENT', 'CREATE_LECTURER', 'UPDATE_LECTURER',
  'CREATE_SECTION', 'UPDATE_SECTION',
  'COURSE_REGISTRATION', 'REGISTRATION_APPROVED', 'REGISTRATION_REJECTED', 'REGISTRATION_DROPPED',

  // Phase 3 Actions
  'ATTENDANCE_CREATED', 'ATTENDANCE_UPDATED',
  'ASSESSMENT_CREATED', 'ASSESSMENT_UPDATED', 'ASSESSMENT_DELETED',
  'MARK_ENTERED', 'MARK_UPDATED',
  'RESULT_SUBMITTED', 'RESULT_VERIFIED', 'RESULT_PUBLISHED', 'RESULT_CHANGED',
  'EXAM_CREATED', 'EXAM_UPDATED', 'EXAM_DELETED',
  'TRANSCRIPT_GENERATED', 'TRANSCRIPT_VERIFIED',
  'GRADE_SCALE_CHANGED', 'ACADEMIC_STANDING_CHANGED'
] as const;

export type AuditAction = typeof AUDIT_ACTIONS[number];

const auditSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, enum: AUDIT_ACTIONS, required: true },
    targetId: String,
    targetType: String,
    ipAddress: String,
    userAgent: String,
    metadata: Schema.Types.Mixed
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditSchema.index({ createdAt: -1 });
export const AuditLog = model('AuditLog', auditSchema);
