import EventEmitter from 'events';

export const NOTIFICATION_EVENTS = {
  RESULT_PUBLISHED: 'notification:result.published',
  EXAM_SCHEDULED: 'notification:exam.scheduled',
  ATTENDANCE_WARNING: 'notification:attendance.warning',
  RESULT_RETURNED: 'notification:result.returned',
  TRANSCRIPT_GENERATED: 'notification:transcript.generated'
} as const;

export type NotificationEventType = typeof NOTIFICATION_EVENTS[keyof typeof NOTIFICATION_EVENTS];

export interface NotificationPayload {
  recipientId: string;
  recipientType: 'STUDENT' | 'LECTURER' | 'HOD' | 'ADMIN';
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

class NotificationEventService extends EventEmitter {
  public emitEvent(event: NotificationEventType, payload: NotificationPayload) {
    this.emit(event, payload);
    // Future Phase 5 integration hook: can queue push, email, SMS, or in-app notification
  }
}

export const notificationEvents = new NotificationEventService();

// Log events for observability during Phase 3
Object.values(NOTIFICATION_EVENTS).forEach((event) => {
  notificationEvents.on(event, (payload: NotificationPayload) => {
    // Phase 5 hook ready
  });
});
