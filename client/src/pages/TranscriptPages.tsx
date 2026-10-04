import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Printer,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  Plus,
  Search,
  Award,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { Button, Card, Badge, Input, EmptyState } from '../components/ui';
import { transcriptService, academicService } from '../services/phase3.services';
import { useAuth } from '../context/AuthContext';
import type { Transcript, TranscriptVerification } from '../types';

// ============================================================================
// 1. STUDENT OFFICIAL DIGITAL TRANSCRIPT VIEW
// ============================================================================
export function StudentTranscriptPage() {
  const { user } = useAuth();
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        setLoading(true);
        const studentsRes = await academicService.getStudents();
        const myProfile = (studentsRes.data || []).find((s: any) => s.userId?._id === user?._id || s.userId === user?._id);
        const profileId = myProfile ? myProfile._id : user?._id;

        const res = await transcriptService.getStudentTranscript(profileId);
        setTranscript(res.data);
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'No official transcript generated yet');
      } finally {
        setLoading(false);
      }
    };
    fetchTranscript();
  }, [user]);

  if (loading) {
    return <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />)}</div>;
  }

  if (errorMsg || !transcript) {
    return (
      <EmptyState
        title="Official Transcript Pending"
        text={errorMsg || 'Your official digital transcript has not yet been issued by the registrar office.'}
      />
    );
  }

  const downloadUrl = transcriptService.downloadUrl(transcript._id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">Official Academic Transcript</h1>
          <p className="text-sm text-muted">
            Official Hormuud University digital record. Verified with unique cryptographic reference number.
          </p>
        </div>
        <div className="flex gap-2">
          <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
            <Button className="gap-2 text-xs">
              <Printer size={15} /> Print / Save Official PDF
            </Button>
          </a>
        </div>
      </div>

      {/* Transcript Document Container */}
      <Card className="p-8 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] shadow-xl">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b-2 border-university-500 gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-university-500 text-white font-black text-2xl shadow-md">
              HU
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-university-500">HORMUUD UNIVERSITY</h2>
              <p className="text-xs text-muted uppercase tracking-wider font-semibold">
                Office of the University Registrar • Mogadishu, Somalia
              </p>
              <span className="inline-block mt-1 text-xs font-bold text-[#D9A441] tracking-widest uppercase">
                Official Digital Academic Transcript
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted block">Reference Number:</span>
            <span className="font-mono text-sm font-black text-university-500 bg-university-50 dark:bg-university-950/40 px-3 py-1 rounded-lg border border-[#D9A441]">
              {transcript.referenceNumber}
            </span>
            <span className="block text-[11px] text-muted mt-1">
              Issued: {new Date(transcript.issueDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Student Information Section */}
        <div className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl text-xs">
          <div>
            <span className="text-muted block">Student Full Name</span>
            <span className="font-bold text-ink dark:text-white text-sm">
              {transcript.studentId?.userId?.fullName || user?.fullName}
            </span>
          </div>
          <div>
            <span className="text-muted block">Student ID</span>
            <span className="font-mono font-bold text-ink dark:text-white text-sm">
              {transcript.studentId?.studentId || 'HU2026001'}
            </span>
          </div>
          <div>
            <span className="text-muted block">Program of Study</span>
            <span className="font-semibold text-ink dark:text-white">
              {transcript.studentId?.programId?.name || 'Software Engineering'}
            </span>
          </div>
          <div>
            <span className="text-muted block">Faculty</span>
            <span className="font-semibold text-ink dark:text-white">
              {transcript.studentId?.facultyId?.name || 'Faculty of Computer Science'}
            </span>
          </div>
          <div>
            <span className="text-muted block">Cumulative CGPA</span>
            <span className="font-mono font-black text-university-500 text-sm">
              {Number(transcript.cgpa).toFixed(2)} / 4.00
            </span>
          </div>
          <div>
            <span className="text-muted block">Academic Standing</span>
            <span className="font-semibold text-green-600">{transcript.academicStanding}</span>
          </div>
        </div>

        {/* Semester Course Results */}
        <div className="space-y-6">
          {(transcript.semesterRecords || []).map((sem, sIdx) => (
            <div key={sIdx} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="bg-university-500 px-4 py-2 text-white flex justify-between text-xs font-bold">
                <span>{sem.semesterName}</span>
                <span>
                  Semester GPA: {Number(sem.semesterGpa || 0).toFixed(2)} • Credits: {sem.creditsEarned}
                </span>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-muted dark:bg-slate-900/60 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Code</th>
                    <th className="px-4 py-2.5">Course Title</th>
                    <th className="px-4 py-2.5 text-center">Credits</th>
                    <th className="px-4 py-2.5 text-center">Mark</th>
                    <th className="px-4 py-2.5 text-center">Grade</th>
                    <th className="px-4 py-2.5 text-right">Grade Point</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(sem.courses || []).map((c, cIdx) => (
                    <tr key={cIdx}>
                      <td className="px-4 py-2.5 font-mono font-bold text-university-500">{c.courseCode}</td>
                      <td className="px-4 py-2.5 font-medium text-ink dark:text-white">{c.courseTitle}</td>
                      <td className="px-4 py-2.5 text-center">{c.credits}</td>
                      <td className="px-4 py-2.5 text-center">{c.marks}%</td>
                      <td className="px-4 py-2.5 text-center font-bold">{c.letterGrade}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{Number(c.gradePoint).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Document Footer & Public Verification Reference */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-muted gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} className="text-green-600" />
            <div>
              <span className="font-bold text-ink dark:text-white block">Official Cryptographic Verification</span>
              <span>
                Verify online at:{' '}
                <Link
                  to={`/verify/transcript/${transcript.referenceNumber}`}
                  className="text-university-500 underline font-semibold"
                >
                  /verify/transcript/{transcript.referenceNumber}
                </Link>
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="block font-semibold text-ink dark:text-white">University Registrar</span>
            <span className="text-[11px]">Hormuud University Digital Registry</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// 2. ADMIN TRANSCRIPT MANAGEMENT & GENERATION
// ============================================================================
export function AdminTranscriptsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    academicService.getStudents().then((res) => {
      setStudents(res.data || []);
      if (res.data?.[0]) setSelectedStudent(res.data[0]._id);
    });
  }, []);

  const handleGenerate = async () => {
    if (!selectedStudent) return;
    setGenerating(true);
    setErrorMsg('');
    try {
      const res = await transcriptService.generate(selectedStudent);
      setToast(`Transcript issued successfully! Reference: ${res.data.referenceNumber}`);
      setTimeout(() => setToast(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to generate transcript');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">Transcript Management</h1>
          <p className="text-sm text-muted">
            Issue official digital academic transcripts with tamper-proof reference numbers.
          </p>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <AlertTriangle size={18} /> {errorMsg}
        </div>
      )}

      <Card className="p-6">
        <h3 className="font-bold text-ink dark:text-white mb-2">Issue New Official Transcript</h3>
        <p className="text-xs text-muted mb-4">
          Select an enrolled student with published semester results to compile and generate their official digital record.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 max-w-xl">
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="field !mt-0 flex-1"
          >
            {students.map((st) => (
              <option key={st._id} value={st._id}>
                {st.studentId} — {st.userId?.fullName || 'Student'} ({st.programId?.name || 'Program'})
              </option>
            ))}
          </select>
          <Button loading={generating} onClick={handleGenerate} className="gap-2 text-xs shrink-0">
            <Plus size={16} /> Generate Transcript
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// 3. PUBLIC TRANSCRIPT VERIFICATION PAGE
// ============================================================================
export function PublicTranscriptVerificationPage() {
  const { referenceNumber } = useParams();
  const [searchRef, setSearchRef] = useState(referenceNumber || '');
  const [data, setData] = useState<TranscriptVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const performVerification = async (ref: string) => {
    if (!ref.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await transcriptService.verifyPublic(ref.trim());
      setData(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'No valid transcript found with this reference number.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (referenceNumber) {
      performVerification(referenceNumber);
    }
  }, [referenceNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(searchRef);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#0B1220] py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-university-500 text-white font-black text-2xl shadow-lg">
            HU
          </div>
          <h1 className="text-2xl font-black text-[#123B6D] dark:text-white">HORMUUD UNIVERSITY</h1>
          <p className="text-xs text-muted uppercase tracking-wider font-semibold">
            Official Public Transcript Verification Portal
          </p>
        </div>

        {/* Search Input */}
        <Card className="p-5 shadow-lg">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              label="Enter Transcript Reference Number"
              placeholder="e.g. TR-HU-2026-A8F291"
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
              className="!mt-0"
              required
            />
            <Button type="submit" loading={loading} className="shrink-0 self-end mb-1">
              Verify
            </Button>
          </form>
        </Card>

        {/* Error message */}
        {errorMsg && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-center text-sm font-semibold text-red-600 dark:bg-red-950/40 dark:border-red-900">
            {errorMsg}
          </div>
        )}

        {/* Verified Result Card */}
        {data && (
          <Card className="p-6 border-2 border-green-500/50 shadow-2xl space-y-5 bg-white dark:bg-[#111827]">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <CheckCircle size={32} className="text-green-600 shrink-0" />
              <div>
                <span className="font-extrabold text-green-700 dark:text-green-400 text-base block">
                  Official Record Verified Authentic
                </span>
                <span className="font-mono text-xs text-muted">
                  Reference: <strong>{data.referenceNumber}</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted block">Student Full Name</span>
                <span className="font-bold text-ink dark:text-white text-sm">{data.student.fullName}</span>
              </div>
              <div>
                <span className="text-muted block">Student ID Number</span>
                <span className="font-mono font-bold text-ink dark:text-white text-sm">{data.student.studentId}</span>
              </div>
              <div>
                <span className="text-muted block">Academic Program</span>
                <span className="font-semibold text-ink dark:text-white">{data.student.program}</span>
              </div>
              <div>
                <span className="text-muted block">Department</span>
                <span className="font-semibold text-ink dark:text-white">{data.student.department}</span>
              </div>
              <div>
                <span className="text-muted block">Faculty</span>
                <span className="font-semibold text-ink dark:text-white">{data.student.faculty}</span>
              </div>
              <div>
                <span className="text-muted block">Admission Year</span>
                <span className="font-semibold text-ink dark:text-white">{data.student.admissionYear}</span>
              </div>
              <div>
                <span className="text-muted block">Cumulative CGPA</span>
                <span className="font-mono font-black text-university-500 text-sm">
                  {Number(data.academicRecord.cgpa).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted block">Academic Standing</span>
                <span className="font-bold text-green-600">{data.academicRecord.academicStanding}</span>
              </div>
              <div>
                <span className="text-muted block">Total Credits Earned</span>
                <span className="font-semibold text-ink dark:text-white">{data.academicRecord.totalCreditsEarned}</span>
              </div>
              <div>
                <span className="text-muted block">Issue Date</span>
                <span className="font-semibold text-ink dark:text-white">
                  {new Date(data.issueDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-muted text-center">
              Total times verified: {data.verificationCount} • Hormuud University Digital Platform
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
