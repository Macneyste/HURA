import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Plus,
  Users,
  Search,
  BookOpen,
  Filter,
  Save,
  ArrowLeft
} from 'lucide-react';
import { Button, Card, Badge, Input, EmptyState } from '../components/ui';
import { attendanceService, academicService } from '../services/phase3.services';
import { useAuth } from '../context/AuthContext';
import type {
  AttendanceSession,
  AttendanceRosterStudent,
  AttendanceRecordStatus,
  StudentAttendanceSummary
} from '../types';

// ============================================================================
// 1. LECTURER & ADMIN ATTENDANCE OVERVIEW
// ============================================================================
export function LecturerAttendancePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // New session form
  const [newTopic, setNewTopic] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('08:30');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newNotes, setNewNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [secRes, sessRes] = await Promise.all([
        academicService.getSections().catch(() => ({ data: [] })),
        attendanceService.listSessions(selectedSection ? { courseSectionId: selectedSection } : {})
      ]);
      setSections(secRes.data || []);
      setSessions(sessRes.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSection]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSection && sections.length > 0) {
      setErrorMsg('Please select a course section');
      return;
    }
    setErrorMsg('');
    try {
      const targetSec = selectedSection || sections[0]?._id;
      await attendanceService.createSession({
        courseSectionId: targetSec,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        topic: newTopic,
        notes: newNotes
      });
      setCreating(false);
      setNewTopic('');
      setNewNotes('');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create session');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">Attendance Management</h1>
          <p className="text-sm text-muted">Create lecture sessions and record student course attendance.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setCreating(true)} className="gap-2">
            <Plus size={16} /> New Session
          </Button>
        </div>
      </div>

      {/* Filter by Course Section */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
            <Filter size={16} className="text-university-500" /> Filter Section:
          </div>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="field !mt-0 max-w-md"
          >
            <option value="">All Assigned Sections</option>
            {sections.map((sec) => (
              <option key={sec._id} value={sec._id}>
                {sec.courseId?.code} — {sec.courseId?.title} (Section {sec.sectionCode})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Create Session Modal */}
      {creating && (
        <Card className="border-university-500/30 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="font-bold text-ink dark:text-white">Create Attendance Session</h3>
            <button onClick={() => setCreating(false)} className="text-muted hover:text-ink">
              ✕
            </button>
          </div>
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-950/40">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleCreateSession} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-ink dark:text-slate-200">
                Course Section
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="field"
                  required
                >
                  <option value="">Select section...</option>
                  {sections.map((sec) => (
                    <option key={sec._id} value={sec._id}>
                      {sec.courseId?.code} — {sec.courseId?.title} ({sec.sectionCode})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Lecture Topic"
                placeholder="e.g. Relational Data Modeling & Normalization"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                required
              />
            </div>
            <Input
              label="Date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Start Time"
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                required
              />
              <Input
                label="End Time"
                type="time"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Session Notes (Optional)"
                placeholder="Remarks, laboratory details, or student instructions"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-3 sm:col-span-2">
              <Button type="submit">Create & Take Attendance</Button>
              <Button variant="secondary" type="button" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Session Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          title="No attendance sessions found"
          text="Create a new attendance session for your students to start taking attendance."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((sess) => (
            <Card key={sess._id} className="flex flex-col justify-between p-5 transition hover:border-university-500/50">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-university-500">
                    {sess.courseSectionId?.courseId?.code || 'Course'}
                  </span>
                  <Badge tone={sess.status === 'Open' ? 'success' : sess.status === 'Closed' ? 'neutral' : 'danger'}>
                    {sess.status}
                  </Badge>
                </div>
                <h4 className="line-clamp-1 font-bold text-ink dark:text-white">{sess.topic}</h4>
                <p className="text-xs text-muted">
                  {sess.courseSectionId?.courseId?.title} (Sec {sess.courseSectionId?.sectionCode})
                </p>
                <div className="flex items-center gap-4 text-xs text-muted pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> {new Date(sess.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> {sess.startTime} - {sess.endTime}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Link to={`/lecturer/attendance/${sess._id}`}>
                  <Button variant="secondary" className="w-full text-xs">
                    Open Attendance Roster
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. LECTURER SESSION ROSTER & BULK ACTIONS
// ============================================================================
export function LecturerSessionRosterPage() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [roster, setRoster] = useState<AttendanceRosterStudent[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  const loadRoster = async () => {
    if (!sectionId) return;
    try {
      setLoading(true);
      const res = await attendanceService.getSession(sectionId);
      setSession(res.data.session);
      setRoster(res.data.roster);
      setSummary(res.data.summary);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, [sectionId]);

  const setAllStatus = (status: AttendanceRecordStatus) => {
    setRoster((prev) => prev.map((item) => ({ ...item, status })));
  };

  const updateStudentStatus = (studentId: string, status: AttendanceRecordStatus) => {
    setRoster((prev) =>
      prev.map((item) => (item.student?._id === studentId ? { ...item, status } : item))
    );
  };

  const handleSaveAttendance = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const records = roster.map((item) => ({
        studentId: item.student._id,
        status: item.status,
        notes: item.notes
      }));
      await attendanceService.saveRecords(session._id, records);
      setToast('Attendance saved successfully!');
      setTimeout(() => setToast(''), 4000);
      loadRoster();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const filteredRoster = roster.filter(
    (r) =>
      r.student?.userId?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      r.student?.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => navigate('/lecturer/attendance')} className="!p-2.5">
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-ink dark:text-white">
            {session ? session.topic : 'Session Attendance Roster'}
          </h1>
          <p className="text-xs text-muted">
            {session?.courseSectionId?.courseId?.code} — {session?.courseSectionId?.courseId?.title} • Date:{' '}
            {session ? new Date(session.date).toLocaleDateString() : ''}
          </p>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      {/* Summary Stat Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Card className="p-4 text-center">
            <span className="block text-2xl font-black text-ink dark:text-white">{summary.totalStudents}</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Total Students</span>
          </Card>
          <Card className="p-4 text-center border-green-200 dark:border-green-900/50">
            <span className="block text-2xl font-black text-green-600">{summary.present}</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Present</span>
          </Card>
          <Card className="p-4 text-center border-red-200 dark:border-red-900/50">
            <span className="block text-2xl font-black text-red-600">{summary.absent}</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Absent</span>
          </Card>
          <Card className="p-4 text-center border-amber-200 dark:border-amber-900/50">
            <span className="block text-2xl font-black text-amber-600">{summary.late}</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Late</span>
          </Card>
          <Card className="p-4 text-center">
            <span className="block text-2xl font-black text-blue-600">{summary.excused}</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Excused</span>
          </Card>
        </div>
      )}

      {/* Bulk Action Controls */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-3.5 text-muted" />
            <input
              type="text"
              placeholder="Search by student name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field !pl-9 !mt-0"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted mr-1">Bulk Actions:</span>
            <Button
              variant="secondary"
              className="!px-3 !py-2 text-xs text-green-700 hover:bg-green-50"
              onClick={() => setAllStatus('Present')}
            >
              Mark All Present
            </Button>
            <Button
              variant="secondary"
              className="!px-3 !py-2 text-xs text-red-700 hover:bg-red-50"
              onClick={() => setAllStatus('Absent')}
            >
              Mark All Absent
            </Button>
            <Button loading={saving} onClick={handleSaveAttendance} className="gap-2 text-xs !py-2">
              <Save size={14} /> Save Attendance
            </Button>
          </div>
        </div>
      </Card>

      {/* Attendance Roster Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-muted dark:border-slate-800 dark:bg-slate-900/50">
              <tr>
                <th className="px-5 py-3.5">Student ID</th>
                <th className="px-5 py-3.5">Student Name</th>
                <th className="px-5 py-3.5">Attendance Status</th>
                <th className="px-5 py-3.5">Quick Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRoster.map((item) => (
                <tr key={item.student?._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                  <td className="px-5 py-3 font-mono font-semibold text-xs text-university-500">
                    {item.student?.studentId}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-medium text-ink dark:text-white">
                      {item.student?.userId?.fullName || 'Enrolled Student'}
                    </span>
                    <span className="block text-xs text-muted">{item.student?.userId?.email}</span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      tone={
                        item.status === 'Present'
                          ? 'success'
                          : item.status === 'Late'
                          ? 'warning'
                          : item.status === 'Absent'
                          ? 'danger'
                          : 'neutral'
                      }
                    >
                      {item.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      {(['Present', 'Absent', 'Late', 'Excused'] as AttendanceRecordStatus[]).map((st) => (
                        <button
                          key={st}
                          onClick={() => updateStudentStatus(item.student._id, st)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                            item.status === st
                              ? st === 'Present'
                                ? 'bg-green-600 text-white'
                                : st === 'Absent'
                                ? 'bg-red-600 text-white'
                                : st === 'Late'
                                ? 'bg-amber-600 text-white'
                                : 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// 3. STUDENT ATTENDANCE DASHBOARD
// ============================================================================
export function StudentAttendancePage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<StudentAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentAttendance = async () => {
      try {
        setLoading(true);
        // Find student profile id for current user
        const studentsRes = await academicService.getStudents();
        const myProfile = (studentsRes.data || []).find((s: any) => s.userId?._id === user?._id || s.userId === user?._id);
        const profileId = myProfile ? myProfile._id : user?._id;

        const res = await attendanceService.getStudentAttendance(profileId);
        setSummary(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentAttendance();
  }, [user]);

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">My Attendance Record</h1>
        <p className="text-sm text-muted">Track your lecture attendance percentages and minimum university thresholds.</p>
      </div>

      {/* University Requirement Notice */}
      <div className="flex items-center gap-3 rounded-2xl border border-university-500/20 bg-university-50 p-4 text-sm text-university-600 dark:bg-university-950/30 dark:text-blue-200">
        <CheckCircle size={20} className="shrink-0 text-university-500" />
        <div>
          <span className="font-bold">Hormuud University Attendance Policy:</span> A minimum attendance of{' '}
          <strong>75%</strong> is required in every registered course to sit for final semester examinations.
        </div>
      </div>

      {/* Courses Breakdown */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(summary?.courses || []).map((c) => (
          <Card key={c.sectionId} className="p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-university-500">{c.courseCode}</span>
                  <h3 className="text-base font-bold text-ink dark:text-white">{c.courseTitle}</h3>
                  <p className="text-xs text-muted">{c.creditHours} Credit Hours • Section {c.sectionCode}</p>
                </div>
                <Badge
                  tone={
                    c.standing === 'Safe' ? 'success' : c.standing === 'Warning' ? 'warning' : 'danger'
                  }
                >
                  {c.attendancePercentage}%
                </Badge>
              </div>

              {/* Attendance warning message */}
              {c.warningMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  <AlertTriangle size={15} className="shrink-0" />
                  {c.warningMessage}
                </div>
              )}

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs font-medium text-muted mb-1">
                  <span>Attendance Progress</span>
                  <span>{c.attendancePercentage}% / 75% required</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      c.attendancePercentage >= 75
                        ? 'bg-green-600'
                        : c.attendancePercentage >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-600'
                    }`}
                    style={{ width: `${Math.min(100, c.attendancePercentage)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Attendance breakdown stats */}
            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs mt-4">
              <div>
                <span className="block font-bold text-ink dark:text-white">{c.totalSessions}</span>
                <span className="text-[10px] text-muted uppercase">Sessions</span>
              </div>
              <div>
                <span className="block font-bold text-green-600">{c.present}</span>
                <span className="text-[10px] text-muted uppercase">Present</span>
              </div>
              <div>
                <span className="block font-bold text-red-600">{c.absent}</span>
                <span className="text-[10px] text-muted uppercase">Absent</span>
              </div>
              <div>
                <span className="block font-bold text-amber-600">{c.late}</span>
                <span className="text-[10px] text-muted uppercase">Late</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
