import { Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Foundation pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';
import {
  ForbiddenPage,
  ForgotPasswordPage,
  NotFoundPage,
  ResetPasswordPage,
  SettingsPage
} from './pages/UtilityPages';
import { AuditLogsPage, RolesPage } from './pages/AdminPages';

// Phase 3 pages
import {
  LecturerAttendancePage,
  LecturerSessionRosterPage,
  StudentAttendancePage
} from './pages/AttendancePages';
import {
  LecturerAssessmentsPage,
  MarksEntrySheetPage
} from './pages/AssessmentPages';
import { AdminExamSchedulePage, StudentExamsPage } from './pages/ExamPages';
import {
  LecturerResultsPage,
  HodResultsPage,
  AdminResultsPublishingPage,
  StudentResultsPage,
  StudentPerformancePage
} from './pages/ResultPages';
import {
  StudentTranscriptPage,
  AdminTranscriptsPage,
  PublicTranscriptVerificationPage
} from './pages/TranscriptPages';
import {
  AdminGradeScalesPage,
  AdminAcademicStandingPage
} from './pages/AcademicConfigPages';

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify/transcript/:referenceNumber" element={<PublicTranscriptVerificationPage />} />
      <Route path="/verify/transcript" element={<PublicTranscriptVerificationPage />} />

      {/* Protected University Application */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Student Academic Routes */}
          <Route path="/student/attendance" element={<StudentAttendancePage />} />
          <Route path="/student/exams" element={<StudentExamsPage />} />
          <Route path="/student/results" element={<StudentResultsPage />} />
          <Route path="/student/performance" element={<StudentPerformancePage />} />
          <Route path="/student/transcript" element={<StudentTranscriptPage />} />

          {/* Lecturer Teaching Routes */}
          <Route
            element={<ProtectedRoute roles={['LECTURER', 'HOD', 'ADMIN', 'SUPER_ADMIN']} />}
          >
            <Route path="/lecturer/attendance" element={<LecturerAttendancePage />} />
            <Route path="/lecturer/attendance/:sectionId" element={<LecturerSessionRosterPage />} />
            <Route path="/lecturer/assessments" element={<LecturerAssessmentsPage />} />
            <Route path="/lecturer/assessments/:id" element={<MarksEntrySheetPage />} />
            <Route path="/lecturer/marks" element={<LecturerAssessmentsPage />} />
            <Route path="/lecturer/results" element={<LecturerResultsPage />} />
          </Route>

          {/* HOD Routes */}
          <Route element={<ProtectedRoute roles={['HOD', 'ADMIN', 'SUPER_ADMIN']} />}>
            <Route path="/hod/results" element={<HodResultsPage />} />
            <Route path="/hod/exams" element={<AdminExamSchedulePage />} />
          </Route>

          {/* Academic & Platform Administration */}
          <Route element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']} />}>
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/roles" element={<RolesPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />

            <Route path="/admin/attendance" element={<LecturerAttendancePage />} />
            <Route path="/admin/assessments" element={<LecturerAssessmentsPage />} />
            <Route path="/admin/exams" element={<AdminExamSchedulePage />} />
            <Route path="/admin/results" element={<AdminResultsPublishingPage />} />
            <Route path="/admin/grade-scales" element={<AdminGradeScalesPage />} />
            <Route path="/admin/academic-standing" element={<AdminAcademicStandingPage />} />
            <Route path="/admin/transcripts" element={<AdminTranscriptsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
