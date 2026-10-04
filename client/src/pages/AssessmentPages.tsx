import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  CheckCircle,
  AlertCircle,
  Percent,
  Search,
  Save,
  Send,
  ArrowLeft,
  Trash2,
  Calendar,
  Layers
} from 'lucide-react';
import { Button, Card, Badge, Input, EmptyState } from '../components/ui';
import { assessmentService, marksService, academicService } from '../services/phase3.services';
import type { Assessment, AssessmentSheetRow, AssessmentType } from '../types';

// ============================================================================
// 1. LECTURER & ADMIN ASSESSMENTS OVERVIEW
// ============================================================================
export function LecturerAssessmentsPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // New assessment form
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AssessmentType>('Assignment');
  const [maxMarks, setMaxMarks] = useState(20);
  const [weight, setWeight] = useState(10);
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
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
        const [sumRes] = await Promise.all([
          assessmentService.getSectionSummary(targetSec)
        ]);
        setAssessments(sumRes.data.assessments || []);
        setTotalWeight(sumRes.data.totalWeight || 0);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await assessmentService.create({
        courseSectionId: selectedSection,
        title,
        type,
        maxMarks: Number(maxMarks),
        weight: Number(weight),
        dueDate: dueDate ? dueDate : undefined,
        description
      });
      setCreating(false);
      setTitle('');
      setDescription('');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create assessment');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) return;
    try {
      await assessmentService.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cannot delete assessment with recorded marks');
    }
  };

  const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">Assessments Management</h1>
          <p className="text-sm text-muted">
            Configure section assessment items. Total weight must equal 100% to finalize course results.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus size={16} /> New Assessment
        </Button>
      </div>

      {/* Course Section Selector */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <span className="text-sm font-semibold text-ink dark:text-white">Select Course Section:</span>
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

      {/* Assessment Weights Progress Bar */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Percent size={18} className="text-university-500" />
            <span className="font-bold text-sm text-ink dark:text-white">Total Weight Allocated:</span>
            <span className={`font-mono font-bold text-sm ${isWeightValid ? 'text-green-600' : 'text-amber-600'}`}>
              {totalWeight}% / 100%
            </span>
          </div>
          <Badge tone={isWeightValid ? 'success' : 'warning'}>
            {isWeightValid ? 'Weight Valid (100%)' : `Weight Incomplete (${100 - totalWeight}% remaining)`}
          </Badge>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-all ${
              isWeightValid ? 'bg-green-600' : totalWeight > 100 ? 'bg-red-600' : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(100, totalWeight)}%` }}
          />
        </div>
        {!isWeightValid && (
          <p className="mt-2 text-xs text-amber-600 flex items-center gap-1 font-medium">
            <AlertCircle size={14} /> Total assessment weight must equal exactly 100% before submitting final course grades.
          </p>
        )}
      </Card>

      {/* Create Assessment Form */}
      {creating && (
        <Card className="p-6 border-university-500/40 shadow-xl">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="font-bold text-ink dark:text-white">Create Section Assessment</h3>
            <button onClick={() => setCreating(false)} className="text-muted hover:text-ink">
              ✕
            </button>
          </div>
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-950/40">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Assessment Title"
              placeholder="e.g. Midterm Examination"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-ink dark:text-slate-200">
                Type
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AssessmentType)}
                  className="field"
                  required
                >
                  <option value="Assignment">Assignment</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Midterm">Midterm</option>
                  <option value="Project">Project</option>
                  <option value="Practical">Practical</option>
                  <option value="Final Exam">Final Exam</option>
                </select>
              </label>
            </div>
            <Input
              label="Max Marks"
              type="number"
              min="1"
              value={maxMarks}
              onChange={(e) => setMaxMarks(Number(e.target.value))}
              required
            />
            <Input
              label="Weight Percentage (%)"
              type="number"
              min="1"
              max="100"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              required
            />
            <Input
              label="Due Date (Optional)"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <Input
              label="Description (Optional)"
              placeholder="Assessment guidelines, rubrics or notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex gap-3 sm:col-span-2 pt-2">
              <Button type="submit">Save Assessment</Button>
              <Button variant="secondary" type="button" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Assessments Grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : assessments.length === 0 ? (
        <EmptyState
          title="No assessments created for this section"
          text="Add assignments, quizzes, midterms, and final exam to configure grading weights."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {assessments.map((asm) => (
            <Card key={asm._id} className="p-5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge tone="neutral">{asm.type}</Badge>
                  <span className="font-mono font-bold text-xs text-university-500 bg-university-50 dark:bg-university-950/40 px-2 py-0.5 rounded-full">
                    Weight: {asm.weight}%
                  </span>
                </div>
                <h3 className="font-bold text-base text-ink dark:text-white">{asm.title}</h3>
                {asm.description && <p className="text-xs text-muted line-clamp-2">{asm.description}</p>}
                <div className="flex items-center gap-4 text-xs text-muted pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Max Marks: <strong>{asm.maxMarks}</strong></span>
                  {asm.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar size={13} /> {new Date(asm.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <Link to={`/lecturer/assessments/${asm._id}`} className="flex-1">
                  <Button variant="secondary" className="w-full text-xs">
                    Enter Marks (Spreadsheet)
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  className="!px-3 text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(asm._id)}
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
// 2. SPREADSHEET-LIKE MARKS ENTRY INTERFACE
// ============================================================================
export function MarksEntrySheetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [sheet, setSheet] = useState<AssessmentSheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  const loadSheet = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await marksService.getSheet(id);
      setAssessment(res.data.assessment);
      setSheet(res.data.sheet);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSheet();
  }, [id]);

  const handleMarkChange = (studentId: string, val: string) => {
    const num = val === '' ? null : Number(val);
    setSheet((prev) =>
      prev.map((r) => {
        if (r.studentId !== studentId) return r;
        const max = assessment?.maxMarks || 100;
        const pct = num !== null ? Math.round((num / max) * 100) : null;
        return { ...r, marksObtained: num, percentage: pct };
      })
    );
  };

  const handleSaveDraft = async () => {
    if (!assessment) return;
    setSaving(true);
    try {
      const payload = sheet
        .filter((r) => r.marksObtained !== null)
        .map((r) => ({
          studentId: r.studentId,
          marksObtained: Number(r.marksObtained)
        }));
      await marksService.enterBulk(assessment._id, payload);
      setToast('Student marks draft saved successfully!');
      setTimeout(() => setToast(''), 4000);
      loadSheet();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving marks');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!assessment) return;
    if (!window.confirm('Publish assessment marks? Published marks will become available for results calculation.')) return;
    setPublishing(true);
    try {
      await marksService.publish(assessment._id);
      setToast('Assessment marks published successfully!');
      setTimeout(() => setToast(''), 4000);
      loadSheet();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish marks');
    } finally {
      setPublishing(false);
    }
  };

  const filteredSheet = sheet.filter(
    (r) =>
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.studentNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => navigate('/lecturer/assessments')} className="!p-2.5">
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-ink dark:text-white">
            {assessment?.title || 'Marks Entry Sheet'}
          </h1>
          <p className="text-xs text-muted">
            Max Marks: <strong>{assessment?.maxMarks}</strong> • Weight: <strong>{assessment?.weight}%</strong>
          </p>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      {/* Action Controls */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-3.5 text-muted" />
            <input
              type="text"
              placeholder="Filter student ID or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field !pl-9 !mt-0"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" loading={saving} onClick={handleSaveDraft} className="gap-2 text-xs">
              <Save size={14} /> Save Draft
            </Button>
            <Button loading={publishing} onClick={handlePublish} className="gap-2 text-xs">
              <Send size={14} /> Publish Marks
            </Button>
          </div>
        </div>
      </Card>

      {/* Spreadsheet Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-muted dark:border-slate-800 dark:bg-slate-900/50">
              <tr>
                <th className="px-5 py-3.5">Student ID</th>
                <th className="px-5 py-3.5">Student Full Name</th>
                <th className="px-5 py-3.5" style={{ width: '180px' }}>
                  Mark (Out of {assessment?.maxMarks})
                </th>
                <th className="px-5 py-3.5">Percentage</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSheet.map((r) => (
                <tr key={r.studentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                  <td className="px-5 py-3 font-mono font-semibold text-xs text-university-500">
                    {r.studentNumber}
                  </td>
                  <td className="px-5 py-3 font-medium text-ink dark:text-white">{r.fullName}</td>
                  <td className="px-5 py-2">
                    <input
                      type="number"
                      min="0"
                      max={assessment?.maxMarks || 100}
                      step="0.5"
                      placeholder="0.0"
                      value={r.marksObtained !== null ? r.marksObtained : ''}
                      onChange={(e) => handleMarkChange(r.studentId, e.target.value)}
                      className="field !py-1.5 !px-3 font-mono text-sm max-w-[120px]"
                    />
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted">
                    {r.percentage !== null ? `${r.percentage}%` : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={r.status === 'Published' ? 'success' : r.marksObtained !== null ? 'warning' : 'neutral'}>
                      {r.status || 'Draft'}
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
