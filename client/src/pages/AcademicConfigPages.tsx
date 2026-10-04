import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit3, Save, CheckCircle, Shield } from 'lucide-react';
import { Button, Card, Badge, Input, EmptyState } from '../components/ui';
import { configService } from '../services/phase3.services';
import type { GradeScale, AcademicStandingRule } from '../types';

// ============================================================================
// 1. GRADE SCALE CONFIGURATION PAGE
// ============================================================================
export function AdminGradeScalesPage() {
  const [scales, setScales] = useState<GradeScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // New Scale Form
  const [letter, setLetter] = useState('');
  const [minPct, setMinPct] = useState(0);
  const [maxPct, setMaxPct] = useState(100);
  const [gradePoint, setGradePoint] = useState(4.0);
  const [passStatus, setPassStatus] = useState(true);
  const [toast, setToast] = useState('');

  const loadScales = async () => {
    try {
      setLoading(true);
      const res = await configService.listGradeScales();
      setScales(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScales();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await configService.createGradeScale({
        letter: letter.trim().toUpperCase(),
        minimumPercentage: Number(minPct),
        maximumPercentage: Number(maxPct),
        gradePoint: Number(gradePoint),
        passStatus
      });
      setCreating(false);
      setLetter('');
      setToast('Grade scale saved successfully!');
      setTimeout(() => setToast(''), 4000);
      loadScales();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save grade scale');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this grade scale?')) return;
    try {
      await configService.deleteGradeScale(id);
      loadScales();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">Grade Scale Policy</h1>
          <p className="text-sm text-muted">
            Configure letter grades, percentage intervals, and Grade Point (GP) values for all academic departments.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2 text-xs">
          <Plus size={16} /> Add Grade Scale
        </Button>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      {creating && (
        <Card className="p-6 border-university-500/40 shadow-xl">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="font-bold text-ink dark:text-white">Add Grade Scale Rule</h3>
            <button onClick={() => setCreating(false)} className="text-muted hover:text-ink">
              ✕
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Letter Grade"
              placeholder="e.g. A+ or B"
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              required
            />
            <Input
              label="Grade Point (0.0 – 4.0)"
              type="number"
              step="0.1"
              min="0"
              max="4"
              value={gradePoint}
              onChange={(e) => setGradePoint(Number(e.target.value))}
              required
            />
            <Input
              label="Minimum Percentage (%)"
              type="number"
              min="0"
              max="100"
              value={minPct}
              onChange={(e) => setMinPct(Number(e.target.value))}
              required
            />
            <Input
              label="Maximum Percentage (%)"
              type="number"
              min="0"
              max="100"
              value={maxPct}
              onChange={(e) => setMaxPct(Number(e.target.value))}
              required
            />
            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="passStatus"
                checked={passStatus}
                onChange={(e) => setPassStatus(e.target.checked)}
                className="rounded text-university-500 focus:ring-university-500"
              />
              <label htmlFor="passStatus" className="text-sm font-medium text-ink dark:text-slate-200">
                Qualifies as Passing Grade (Credits Awarded)
              </label>
            </div>
            <div className="flex gap-3 sm:col-span-2 pt-2">
              <Button type="submit">Save Grade Scale</Button>
              <Button variant="secondary" type="button" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-muted dark:border-slate-800 dark:bg-slate-900/50">
            <tr>
              <th className="px-5 py-3.5">Letter</th>
              <th className="px-5 py-3.5">Percentage Range</th>
              <th className="px-5 py-3.5">Grade Point (GP)</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {scales.map((s) => (
              <tr key={s._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                <td className="px-5 py-3 font-black text-base text-university-500">{s.letter}</td>
                <td className="px-5 py-3 font-mono text-xs">
                  {s.minimumPercentage}% – {s.maximumPercentage}%
                </td>
                <td className="px-5 py-3 font-mono font-bold">{s.gradePoint.toFixed(1)}</td>
                <td className="px-5 py-3">
                  <Badge tone={s.passStatus ? 'success' : 'danger'}>
                    {s.passStatus ? 'Pass' : 'Fail'}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-right">
                  <Button
                    variant="secondary"
                    className="!p-1.5 text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(s._id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============================================================================
// 2. ACADEMIC STANDING POLICY PAGE
// ============================================================================
export function AdminAcademicStandingPage() {
  const [standings, setStandings] = useState<AcademicStandingRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    configService.listAcademicStanding().then((res) => {
      setStandings(res.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">Academic Standing Rules</h1>
        <p className="text-sm text-muted">
          Institutional rules governing academic excellence, warning thresholds, probation, and student standing.
        </p>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-muted dark:border-slate-800 dark:bg-slate-900/50">
            <tr>
              <th className="px-5 py-3.5">Standing Classification</th>
              <th className="px-5 py-3.5">Code</th>
              <th className="px-5 py-3.5">CGPA Threshold Range</th>
              <th className="px-5 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {standings.map((st) => (
              <tr key={st._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                <td className="px-5 py-3 font-bold text-ink dark:text-white">{st.name}</td>
                <td className="px-5 py-3 font-mono text-xs text-muted">{st.code}</td>
                <td className="px-5 py-3 font-mono text-xs">
                  {st.minCGPA.toFixed(2)} – {st.maxCGPA.toFixed(2)}
                </td>
                <td className="px-5 py-3">
                  <Badge tone={st.minCGPA >= 2.0 ? 'success' : 'warning'}>{st.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
