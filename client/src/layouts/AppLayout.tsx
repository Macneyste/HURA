import {
  BookOpen,
  Calendar,
  CheckSquare,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Scale,
  Settings,
  ShieldCheck,
  TrendingUp,
  UserCircle,
  Users
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Logo, ThemeSwitch } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role || 'STUDENT';
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isLecturer = role === 'LECTURER';
  const isHOD = role === 'HOD';
  const isStudent = role === 'STUDENT';

  const signOut = async () => {
    await logout();
    navigate('/login');
  };

  const sidebar = (
    <aside className="flex h-full w-72 flex-col bg-white p-5 dark:bg-[#111827] overflow-y-auto">
      <Logo />
      <div className="mt-8 flex-1 space-y-1">
        {/* Universal */}
        <NavLink
          to="/dashboard"
          onClick={() => setOpen(false)}
          className="nav-link"
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        {/* Student Links */}
        {isStudent && (
          <>
            <p className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">
              My Academics
            </p>
            <NavLink to="/student/attendance" onClick={() => setOpen(false)} className="nav-link">
              <CheckSquare size={18} />
              Attendance
            </NavLink>
            <NavLink to="/student/exams" onClick={() => setOpen(false)} className="nav-link">
              <Calendar size={18} />
              Exam Timetable
            </NavLink>
            <NavLink to="/student/results" onClick={() => setOpen(false)} className="nav-link">
              <FileSpreadsheet size={18} />
              Semester Results
            </NavLink>
            <NavLink to="/student/performance" onClick={() => setOpen(false)} className="nav-link">
              <TrendingUp size={18} />
              Performance & GPA
            </NavLink>
            <NavLink to="/student/transcript" onClick={() => setOpen(false)} className="nav-link">
              <FileText size={18} />
              Official Transcript
            </NavLink>
          </>
        )}

        {/* Lecturer Links */}
        {isLecturer && (
          <>
            <p className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">
              Teaching Portal
            </p>
            <NavLink to="/lecturer/attendance" onClick={() => setOpen(false)} className="nav-link">
              <CheckSquare size={18} />
              Attendance
            </NavLink>
            <NavLink to="/lecturer/assessments" onClick={() => setOpen(false)} className="nav-link">
              <FileSpreadsheet size={18} />
              Assessments & Marks
            </NavLink>
            <NavLink to="/lecturer/results" onClick={() => setOpen(false)} className="nav-link">
              <GraduationCap size={18} />
              Course Results
            </NavLink>
          </>
        )}

        {/* HOD Links */}
        {isHOD && (
          <>
            <p className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">
              Department Portal
            </p>
            <NavLink to="/hod/results" onClick={() => setOpen(false)} className="nav-link">
              <GraduationCap size={18} />
              Results Approval
            </NavLink>
            <NavLink to="/hod/exams" onClick={() => setOpen(false)} className="nav-link">
              <Calendar size={18} />
              Department Exams
            </NavLink>
          </>
        )}

        {/* Admin Links */}
        {isAdmin && (
          <>
            <p className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">
              Phase 3 Management
            </p>
            <NavLink to="/admin/attendance" onClick={() => setOpen(false)} className="nav-link">
              <CheckSquare size={18} />
              Attendance Sessions
            </NavLink>
            <NavLink to="/admin/assessments" onClick={() => setOpen(false)} className="nav-link">
              <FileSpreadsheet size={18} />
              Assessments
            </NavLink>
            <NavLink to="/admin/exams" onClick={() => setOpen(false)} className="nav-link">
              <Calendar size={18} />
              Exam Scheduler
            </NavLink>
            <NavLink to="/admin/results" onClick={() => setOpen(false)} className="nav-link">
              <GraduationCap size={18} />
              Publish Results & Lock
            </NavLink>
            <NavLink to="/admin/transcripts" onClick={() => setOpen(false)} className="nav-link">
              <FileText size={18} />
              Transcripts
            </NavLink>
            <NavLink to="/admin/grade-scales" onClick={() => setOpen(false)} className="nav-link">
              <Scale size={18} />
              Grade Scales
            </NavLink>
            <NavLink to="/admin/academic-standing" onClick={() => setOpen(false)} className="nav-link">
              <TrendingUp size={18} />
              Academic Standing
            </NavLink>

            <p className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">
              System Admin
            </p>
            <NavLink to="/admin/users" onClick={() => setOpen(false)} className="nav-link">
              <Users size={18} />
              Users
            </NavLink>
            <NavLink to="/admin/roles" onClick={() => setOpen(false)} className="nav-link">
              <ShieldCheck size={18} />
              Roles
            </NavLink>
            <NavLink to="/admin/audit-logs" onClick={() => setOpen(false)} className="nav-link">
              <ShieldCheck size={18} />
              Security Logs
            </NavLink>
          </>
        )}

        <p className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">
          Account
        </p>
        <NavLink to="/profile" onClick={() => setOpen(false)} className="nav-link">
          <UserCircle size={18} />
          Profile
        </NavLink>
        <NavLink to="/settings" onClick={() => setOpen(false)} className="nav-link">
          <Settings size={18} />
          Settings
        </NavLink>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={signOut}
          className="nav-link w-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-canvas dark:bg-[#0B1220]">
      <div className="hidden fixed inset-y-0 z-30 border-r border-slate-200 dark:border-slate-800 lg:block">
        {sidebar}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-72">{sidebar}</div>
        </div>
      )}

      <main className="lg:pl-72">
        <header className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-[#111827]">
          <button
            aria-label="Open menu"
            className="rounded-lg p-2 lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold">Hormuud University Digital Platform</p>
            <p className="text-xs text-muted">Phase 3 — Attendance, Examination & Results</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitch />
            <NavLink
              to="/profile"
              className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-university-50 text-xs font-bold text-university-500 dark:bg-university-950/50">
                {user?.fullName
                  .split(' ')
                  .map((x) => x[0])
                  .slice(0, 2)
                  .join('')}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-semibold">{user?.fullName}</span>
                <span className="block text-[11px] text-muted">{user?.role.replace('_', ' ')}</span>
              </span>
            </NavLink>
          </div>
        </header>
        <div className="p-5 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
