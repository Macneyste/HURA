import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  Plus,
  Trash2,
  FileCheck,
  Search,
  Filter
} from 'lucide-react';
import { Button, Card, Badge, Input, EmptyState } from '../components/ui';
import { examService, academicService } from '../services/phase3.services';
import { useAuth } from '../context/AuthContext';
import type { Exam, ExamType } from '../types';

// ============================================================================
// 1. ADMIN & HOD EXAM SCHEDULER & DASHBOARD
// ============================================================================
export function AdminExamSchedulePage() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [courseSectionId, setCourseSectionId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [examType, setExamType] = useState<ExamType>('Midterm');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [room, setRoom] = useState('');
  const [duration, setDuration] = useState(120);
  const [instructions, setInstructions] = useState('');
  const [conflictError, setConflictError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [exRes, secRes, semRes] = await Promise.all([
        examService.list(),
        academicService.getSections().catch(() => ({ data: [] })),
        academicService.getSemesters().catch(() => ({ data: [] }))
      ]);
      setExams(exRes.data || []);
      setSections(secRes.data || []);
      setSemesters(semRes.data || []);
      if (semRes.data?.[0]) setSemesterId(semRes.data[0]._id);
      if (secRes.data?.[0]) setCourseSectionId(secRes.data[0]._id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError('');
    try {
      await examService.create({
        courseSectionId,
        semesterId,
        examType,
        date,
        startTime,
        endTime,
        room: room.trim().toUpperCase(),
        duration: Number(duration),
        instructions
      });
      setCreating(false);
      setInstructions('');
      setRoom('');
      loadData();
    } catch (err: any) {
      // Displays clear conflict messages as required
      setConflictError(err.response?.data?.message || 'Exam schedule failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Cancel this scheduled examination?')) return;
    try {
      await examService.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete exam');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">Examination Schedules</h1>
          <p className="text-sm text-muted">
            Manage midterms and finals with real-time room and student conflict prevention.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus size={16} /> Schedule Exam
        </Button>
      </div>

      {/* Schedule Form with Conflict Feedback */}
      {creating && (
        <Card className="p-6 border-university-500/40 shadow-xl">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="font-bold text-ink dark:text-white">Schedule New Examination</h3>
            <button onClick={() => setCreating(false)} className="text-muted hover:text-ink">
              ✕
            </button>
          </div>

          {conflictError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle size={18} className="shrink-0 text-red-600" />
              <div>
                <strong>Conflict Detected:</strong>
                <p className="mt-0.5">{conflictError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink dark:text-slate-200">
                Course Section
                <select
                  value={courseSectionId}
                  onChange={(e) => setCourseSectionId(e.target.value)}
                  className="field"
                  required
                >
                  {sections.map((sec) => (
                    <option key={sec._id} value={sec._id}>
                      {sec.courseId?.code} — {sec.courseId?.title} (Sec {sec.sectionCode})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink dark:text-slate-200">
                Semester
                <select
                  value={semesterId}
                  onChange={(e) => setSemesterId(e.target.value)}
                  className="field"
                  required
                >
                  {semesters.map((sem) => (
                    <option key={sem._id} value={sem._id}>
                      {sem.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink dark:text-slate-200">
                Exam Type
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value as ExamType)}
                  className="field"
                  required
                >
                  <option value="Midterm">Midterm</option>
                  <option value="Final">Final Exam</option>
                  <option value="Make-up">Make-up</option>
                  <option value="Supplementary">Supplementary</option>
                </select>
              </label>
            </div>

            <Input
              label="Room / Hall"
              placeholder="e.g. ROOM A204 or MAIN HALL"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              required
            />

            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Start Time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
              <Input
                label="End Time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Instructions"
                placeholder="Permitted equipment, seating instructions, and duration details"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            <div className="flex gap-3 sm:col-span-2 pt-2">
              <Button type="submit">Schedule Exam</Button>
              <Button variant="secondary" type="button" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Exam List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <EmptyState
          title="No scheduled exams found"
          text="Create midterms or final examinations for active course sections."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((ex) => (
            <Card key={ex._id} className="p-5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-university-500">
                    {ex.courseSectionId?.courseId?.code}
                  </span>
                  <Badge tone={ex.examType === 'Final' ? 'danger' : 'warning'}>{ex.examType}</Badge>
                </div>
                <h3 className="font-bold text-base text-ink dark:text-white">
                  {ex.courseSectionId?.courseId?.title}
                </h3>
                <p className="text-xs text-muted">Section {ex.courseSectionId?.sectionCode}</p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-university-500" />
                    <span>{new Date(ex.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-university-500" />
                    <span>{ex.startTime} - {ex.endTime} ({ex.duration} mins)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-university-500" />
                    <span className="font-semibold text-ink dark:text-slate-200">{ex.room}</span>
                  </div>
                </div>

                {ex.instructions && (
                  <p className="text-[11px] text-muted bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg mt-2">
                    {ex.instructions}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs text-muted">Status: <strong className="text-green-600">{ex.status}</strong></span>
                <Button
                  variant="secondary"
                  className="!p-2 text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(ex._id)}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. STUDENT EXAMS TIMETABLE
// ============================================================================
export function StudentExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const res = await examService.list();
        setExams(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">Exam Timetable</h1>
        <p className="text-sm text-muted">Upcoming official examinations for your registered courses.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <EmptyState
          title="No upcoming exams scheduled"
          text="When midterm or final examination timetables are published, they will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {exams.map((ex) => (
            <Card key={ex._id} className="p-5 border-l-4 border-l-university-500">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-university-500">
                    {ex.courseSectionId?.courseId?.code}
                  </span>
                  <h3 className="text-base font-bold text-ink dark:text-white">
                    {ex.courseSectionId?.courseId?.title}
                  </h3>
                  <p className="text-xs text-muted">Section {ex.courseSectionId?.sectionCode}</p>
                </div>
                <Badge tone={ex.examType === 'Final' ? 'danger' : 'warning'}>{ex.examType}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                <div>
                  <span className="block text-[10px] text-muted uppercase">Date</span>
                  <span className="font-semibold text-ink dark:text-white">
                    {new Date(ex.date).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted uppercase">Time Slot</span>
                  <span className="font-semibold text-ink dark:text-white">
                    {ex.startTime} – {ex.endTime}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted uppercase">Exam Room</span>
                  <span className="font-bold text-university-500">{ex.room}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted uppercase">Duration</span>
                  <span className="font-semibold text-ink dark:text-white">{ex.duration} Minutes</span>
                </div>
              </div>

              {ex.instructions && (
                <p className="mt-3 text-xs text-muted italic">
                  Note: {ex.instructions}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
