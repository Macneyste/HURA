import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  CheckCircle,
  Clock,
  Lock,
  Edit3,
  TrendingUp,
  FileText,
  AlertCircle,
  Send,
  Eye,
  BarChart2,
  BookOpen
} from 'lucide-react';
import { Button, Card, Badge, Input, EmptyState } from '../components/ui';
import { resultsService, academicService } from '../services/phase3.services';
import { useAuth } from '../context/AuthContext';
import type {
  CourseResult,
  ResultStatus,
  StudentPerformanceSummary
} from '../types';

// ============================================================================
// 1. LECTURER RESULTS CALCULATION & SUBMISSION
// ============================================================================
export function LecturerResultsPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [results, setResults] = useState<CourseResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const secRes = await academicService.getSections().catch(() => ({ data: [] }));
      const allSecs = secRes.data || [];
      setSections(allSecs);

      const targetSec = selectedSection || (allSecs[0] ? allSecs[0]._id : '');
      if (targetSec) {
        if (!selectedSection) setSelectedSection(targetSec);
        const res = await resultsService.list({ courseSectionId: targetSec });
        setResults(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSection]);

  const handleCalculate = async () => {
    if (!selectedSection) return;
    setCalculating(true);
    setErrorMsg('');
    try {
      await resultsService.calculate(selectedSection);
      setToast('Grades calculated successfully using 100% weighted assessments!');
      setTimeout(() => setToast(''), 4000);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmitToHOD = async () => {
    if (!selectedSection) return;
    if (!window.confirm('Submit these course results to the Head of Department for formal verification?')) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      await resultsService.submit(selectedSection);
      setToast('Course results submitted to HOD successfully!');
      setTimeout(() => setToast(''), 4000);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">Course Results & Grading</h1>
          <p className="text-sm text-muted">
            Compute final letter grades from weighted assessments and submit to HOD for verification.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" loading={calculating} onClick={handleCalculate} className="gap-2 text-xs">
            Calculate Final Grades
          </Button>
          <Button loading={submitting} onClick={handleSubmitToHOD} className="gap-2 text-xs">
            <Send size={14} /> Submit to HOD
          </Button>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* Section Selector */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <span className="text-sm font-semibold text-ink dark:text-white">Course Section:</span>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="field !mt-0 max-w-md"
          >
            {sections.map((sec) => (
              <option key={sec._id} value={sec._id}>
                {sec.courseId?.code} — {sec.courseId?.title} (Sec {sec.sectionCode})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Results Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-muted dark:border-slate-800 dark:bg-slate-900/50">
              <tr>
                <th className="px-5 py-3.5">Student ID</th>
                <th className="px-5 py-3.5">Student Name</th>
                <th className="px-5 py-3.5">Credits</th>
                <th className="px-5 py-3.5">Total Mark</th>
                <th className="px-5 py-3.5">Grade</th>
                <th className="px-5 py-3.5">Grade Point</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted">
                    No results calculated yet. Click &quot;Calculate Final Grades&quot; to compute scores from assessments.
                  </td>
                </tr>
              ) : (
                results.map((r: any) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="px-5 py-3 font-mono font-semibold text-xs text-university-500">
                      {r.studentId?.studentId}
                    </td>
                    <td className="px-5 py-3 font-medium text-ink dark:text-white">
                      {r.studentId?.userId?.fullName || 'Student'}
                    </td>
                    <td className="px-5 py-3">{r.credits}</td>
                    <td className="px-5 py-3 font-semibold">{r.totalMarks}%</td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-university-500">{r.letterGrade}</span>
                    </td>
                    <td className="px-5 py-3 font-mono">{r.gradePoint.toFixed(1)}</td>
                    <td className="px-5 py-3">
                      <Badge
                        tone={
                          r.status === 'Published' || r.status === 'Locked'
                            ? 'success'
                            : r.status === 'Verified' || r.status === 'Submitted'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// 2. HOD RESULTS APPROVAL & DEPARTMENT REVIEW
// ============================================================================
export function HodResultsPage() {
  const [results, setResults] = useState<CourseResult[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState('');
  const [returnModal, setReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [secRes, resRes] = await Promise.all([
        academicService.getSections().catch(() => ({ data: [] })),
        resultsService.list(selectedSection ? { courseSectionId: selectedSection } : {})
      ]);
      setSections(secRes.data || []);
      setResults(resRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSection]);

  const handleApprove = async () => {
    if (!selectedSection && sections.length > 0) return;
    const secId = selectedSection || sections[0]?._id;
    if (!window.confirm('Approve and verify these results for publication?')) return;
    setProcessing(true);
    try {
      await resultsService.verify(secId, 'Approve');
      setToast('Results verified successfully!');
      setTimeout(() => setToast(''), 4000);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Verification failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleReturn = async () => {
    const secId = selectedSection || sections[0]?._id;
    if (!returnReason.trim()) return;
    setProcessing(true);
    try {
      await resultsService.verify(secId, 'Return', returnReason);
      setReturnModal(false);
      setReturnReason('');
      setToast('Results returned to lecturer for correction.');
      setTimeout(() => setToast(''), 4000);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">Department Result Verification</h1>
          <p className="text-sm text-muted">
            Head of Department review portal. Verify submitted grades or return them with corrective comments.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setReturnModal(true)} className="gap-2 text-xs text-red-600 hover:bg-red-50">
            Return for Correction
          </Button>
          <Button loading={processing} onClick={handleApprove} className="gap-2 text-xs">
            <CheckCircle size={14} /> Approve & Verify Results
          </Button>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      {/* Return Reason Modal */}
      {returnModal && (
        <Card className="p-6 border-red-300 dark:border-red-950 shadow-xl">
          <h3 className="font-bold text-ink dark:text-white mb-2">Return Course Results for Correction</h3>
          <p className="text-xs text-muted mb-4">
            Provide detailed feedback to the course lecturer explaining why the submitted marks were returned.
          </p>
          <Input
            label="Correction Reason / Instructions"
            placeholder="e.g. Missing practical lab assessment weights; recalculate student HU2026004"
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            required
          />
          <div className="flex gap-3 mt-4">
            <Button variant="danger" loading={processing} onClick={handleReturn}>
              Confirm Return
            </Button>
            <Button variant="secondary" onClick={() => setReturnModal(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Filter Section */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <span className="text-sm font-semibold text-ink dark:text-white">Filter Department Section:</span>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="field !mt-0 max-w-md"
          >
            <option value="">All Department Sections</option>
            {sections.map((sec) => (
              <option key={sec._id} value={sec._id}>
                {sec.courseId?.code} — {sec.courseId?.title} (Sec {sec.sectionCode})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Results Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-muted dark:border-slate-800 dark:bg-slate-900/50">
              <tr>
                <th className="px-5 py-3.5">Course</th>
                <th className="px-5 py-3.5">Student ID</th>
                <th className="px-5 py-3.5">Student Name</th>
                <th className="px-5 py-3.5">Mark</th>
                <th className="px-5 py-3.5">Grade</th>
                <th className="px-5 py-3.5">Grade Point</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {results.map((r: any) => (
                <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                  <td className="px-5 py-3 font-mono text-xs font-bold text-university-500">
                    {r.courseId?.code}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{r.studentId?.studentId}</td>
                  <td className="px-5 py-3 font-medium text-ink dark:text-white">
                    {r.studentId?.userId?.fullName || 'Student'}
                  </td>
                  <td className="px-5 py-3 font-semibold">{r.totalMarks}%</td>
                  <td className="px-5 py-3 font-bold text-university-500">{r.letterGrade}</td>
                  <td className="px-5 py-3 font-mono">{r.gradePoint.toFixed(1)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={r.status === 'Verified' ? 'success' : r.status === 'Submitted' ? 'warning' : 'neutral'}>
                      {r.status}
                    </Badge>
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
// 3. ADMIN RESULTS PUBLISHING & RESULT LOCKING
// ============================================================================
export function AdminResultsPublishingPage() {
  const [results, setResults] = useState<CourseResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState('');

  // Authorized change published grade modal
  const [editModal, setEditModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [newMark, setNewMark] = useState<number>(0);
  const [changeReason, setChangeReason] = useState('');
  const [changing, setChanging] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await resultsService.list();
      setResults(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePublishAllVerified = async () => {
    if (!window.confirm('Publish all verified results to students and lock grades?')) return;
    setPublishing(true);
    try {
      // Find a verified section or publish
      const verifiedOne = results.find((r) => r.status === 'Verified' || r.status === 'Submitted');
      if (!verifiedOne) {
        alert('No verified results ready to publish');
        setPublishing(false);
        return;
      }
      await resultsService.publish({
        courseSectionId: (verifiedOne.courseSectionId as any)?._id || verifiedOne.courseSectionId
      });
      setToast('Results officially published, locked, and student semester GPAs calculated!');
      setTimeout(() => setToast(''), 4000);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const openEditModal = (r: any) => {
    setSelectedResult(r);
    setNewMark(r.totalMarks);
    setChangeReason('');
    setEditModal(true);
  };

  const handleChangePublishedGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResult || !changeReason.trim()) return;
    setChanging(true);
    try {
      await resultsService.changePublished({
        resultId: selectedResult._id,
        totalMarks: Number(newMark),
        reason: changeReason
      });
      setToast('Published grade changed with complete audit history!');
      setTimeout(() => setToast(''), 4000);
      setEditModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to modify grade');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">Results Publishing & Locking</h1>
          <p className="text-sm text-muted">
            Official registrar portal to publish verified results, lock records, and manage audited grade amendments.
          </p>
        </div>
        <Button loading={publishing} onClick={handlePublishAllVerified} className="gap-2 text-xs">
          <Lock size={14} /> Publish & Lock Results
        </Button>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      {/* Grade Amendment Modal with Audit Logging */}
      {editModal && selectedResult && (
        <Card className="p-6 border-amber-300 dark:border-amber-900/60 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-ink dark:text-white">Authorized Grade Amendment</h3>
              <p className="text-xs text-muted">
                Student: {selectedResult.studentId?.userId?.fullName} ({selectedResult.studentId?.studentId}) •{' '}
                {selectedResult.courseId?.title}
              </p>
            </div>
            <button onClick={() => setEditModal(false)} className="text-muted hover:text-ink">
              ✕
            </button>
          </div>
          <form onSubmit={handleChangePublishedGrade} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase">Current Mark</label>
                <div className="mt-1 font-mono text-base font-bold text-ink dark:text-white">
                  {selectedResult.totalMarks}% ({selectedResult.letterGrade})
                </div>
              </div>
              <Input
                label="New Total Mark (%)"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={newMark}
                onChange={(e) => setNewMark(Number(e.target.value))}
                required
              />
            </div>
            <Input
              label="Mandatory Justification / Reason (Audit Trail)"
              placeholder="e.g. Approved academic recheck after registrar review; faculty dean signoff #491"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              required
            />
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={changing}>
                Record Audited Change
              </Button>
              <Button variant="secondary" type="button" onClick={() => setEditModal(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Results Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-muted dark:border-slate-800 dark:bg-slate-900/50">
              <tr>
                <th className="px-5 py-3.5">Course</th>
                <th className="px-5 py-3.5">Student ID</th>
                <th className="px-5 py-3.5">Student Name</th>
                <th className="px-5 py-3.5">Credits</th>
                <th className="px-5 py-3.5">Mark</th>
                <th className="px-5 py-3.5">Grade</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {results.map((r: any) => (
                <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                  <td className="px-5 py-3 font-mono text-xs font-bold text-university-500">
                    {r.courseId?.code}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{r.studentId?.studentId}</td>
                  <td className="px-5 py-3 font-medium text-ink dark:text-white">
                    {r.studentId?.userId?.fullName || 'Student'}
                  </td>
                  <td className="px-5 py-3">{r.credits}</td>
                  <td className="px-5 py-3 font-semibold">{r.totalMarks}%</td>
                  <td className="px-5 py-3 font-bold text-university-500">{r.letterGrade}</td>
                  <td className="px-5 py-3">
                    <Badge
                      tone={
                        r.status === 'Published' || r.status === 'Locked'
                          ? 'success'
                          : r.status === 'Verified'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Button
                      variant="secondary"
                      className="!py-1 !px-2.5 text-xs gap-1"
                      onClick={() => openEditModal(r)}
                    >
                      <Edit3 size={13} /> Amend
                    </Button>
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
// 4. STUDENT PUBLISHED RESULTS PAGE
// ============================================================================
export function StudentResultsPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<CourseResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await resultsService.list();
        setResults(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">Semester Academic Results</h1>
          <p className="text-sm text-muted">
            Official published course grades and grade points verified by university faculties.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/student/transcript">
            <Button className="gap-2 text-xs">
              <FileText size={15} /> Official Transcript
            </Button>
          </Link>
          <Link to="/student/performance">
            <Button variant="secondary" className="gap-2 text-xs">
              <TrendingUp size={15} /> Performance Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          title="No published results available"
          text="Results for current enrolled semesters will appear here once officially verified and published."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-muted dark:border-slate-800 dark:bg-slate-900/50">
                <tr>
                  <th className="px-5 py-3.5">Course Code</th>
                  <th className="px-5 py-3.5">Course Title</th>
                  <th className="px-5 py-3.5">Credit Hours</th>
                  <th className="px-5 py-3.5">Mark (%)</th>
                  <th className="px-5 py-3.5">Letter Grade</th>
                  <th className="px-5 py-3.5">Grade Point</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.map((r: any) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="px-5 py-3 font-mono font-bold text-xs text-university-500">
                      {r.courseId?.code}
                    </td>
                    <td className="px-5 py-3 font-medium text-ink dark:text-white">
                      {r.courseId?.title}
                    </td>
                    <td className="px-5 py-3">{r.credits}</td>
                    <td className="px-5 py-3 font-semibold">{r.totalMarks}%</td>
                    <td className="px-5 py-3 font-black text-university-500">{r.letterGrade}</td>
                    <td className="px-5 py-3 font-mono">{r.gradePoint.toFixed(1)}</td>
                    <td className="px-5 py-3">
                      <Badge tone="success">Published</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// 5. STUDENT ACADEMIC PERFORMANCE DASHBOARD & VISUALIZATIONS
// ============================================================================
export function StudentPerformancePage() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentPerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true);
        const studentsRes = await academicService.getStudents();
        const myProfile = (studentsRes.data || []).find((s: any) => s.userId?._id === user?._id || s.userId === user?._id);
        const profileId = myProfile ? myProfile._id : user?._id;

        const res = await resultsService.getStudentPerformance(profileId);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, [user]);

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />)}</div>;
  }

  const gradeDist = data?.gradeDistribution || {};
  const maxGradeCount = Math.max(1, ...Object.values(gradeDist));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">Academic Performance Dashboard</h1>
          <p className="text-sm text-muted">
            Overview of cumulative Grade Point Average (CGPA), credit accumulation, and progress toward graduation.
          </p>
        </div>
        <Link to="/student/transcript">
          <Button className="gap-2 text-xs">
            <FileText size={15} /> View Official Transcript
          </Button>
        </Link>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-5 border-l-4 border-l-university-500">
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted">Current GPA</span>
          <span className="block text-3xl font-black text-university-500 mt-1">
            {Number(data?.currentGpa || 0).toFixed(2)}
          </span>
          <span className="text-[11px] text-muted">Active Semester</span>
        </Card>
        <Card className="p-5 border-l-4 border-l-[#D9A441]">
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted">Cumulative GPA</span>
          <span className="block text-3xl font-black text-[#D9A441] mt-1">
            {Number(data?.cgpa || 0).toFixed(2)}
          </span>
          <span className="text-[11px] text-muted">Overall Academic Career</span>
        </Card>
        <Card className="p-5 border-l-4 border-l-green-500">
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted">Credits Earned</span>
          <span className="block text-3xl font-black text-green-600 mt-1">{data?.totalCreditsEarned}</span>
          <span className="text-[11px] text-muted">{data?.creditsRemaining} Credits Remaining</span>
        </Card>
        <Card className="p-5 border-l-4 border-l-blue-500">
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted">Academic Standing</span>
          <span className="block text-xl font-bold text-ink dark:text-white mt-2">
            {data?.academicStanding || 'Good Standing'}
          </span>
          <span className="text-[11px] text-green-600 font-semibold">Eligible & Active</span>
        </Card>
      </div>

      {/* Charts & Visualizations */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Grade Distribution Bar Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-university-500" />
              <h3 className="font-bold text-ink dark:text-white">Grade Distribution</h3>
            </div>
            <span className="text-xs text-muted">Courses Passed: {data?.coursesCompleted}</span>
          </div>

          <div className="space-y-2.5 pt-2">
            {Object.entries(gradeDist).map(([grade, count]) => (
              <div key={grade} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-bold font-mono text-ink dark:text-slate-200">{grade}</span>
                <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      grade.startsWith('A')
                        ? 'bg-university-500'
                        : grade.startsWith('B')
                        ? 'bg-[#1D9BF0]'
                        : grade.startsWith('C')
                        ? 'bg-[#D9A441]'
                        : grade === 'D'
                        ? 'bg-amber-600'
                        : 'bg-red-600'
                    }`}
                    style={{ width: `${(count / maxGradeCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right font-semibold text-muted">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Semester GPA History Table */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-university-500" />
              <h3 className="font-bold text-ink dark:text-white">Semester GPA Trend</h3>
            </div>
            <div className="space-y-3">
              {(data?.semesterHistory || []).map((sh) => (
                <div
                  key={sh.semesterId}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-xs"
                >
                  <div>
                    <span className="font-bold text-ink dark:text-white block">{sh.semesterName}</span>
                    <span className="text-muted">{sh.creditsEarned} Credits Earned</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-base font-black text-university-500 block">
                      {sh.gpa.toFixed(2)}
                    </span>
                    <Badge tone="success">{sh.academicStanding}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-muted text-center mt-4">
            Graduation threshold: 2.00 CGPA with minimum 132 earned credits
          </div>
        </Card>
      </div>
    </div>
  );
}
