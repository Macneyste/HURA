# HURU — Hormuud University Digital Platform

Phase 1, Phase 2, and Phase 3 foundation for Hormuud University’s digital ecosystem: secure identity, role-based access, academic structure, attendance, examination schedules, grading, GPA/CGPA calculations, official transcripts, and audit trails.

## Included Systems

### Phase 1: Identity & Security Foundation
- React + Vite + TypeScript client with the HURU design system, responsive navigation, light/dark themes, and protected routes.
- Express + TypeScript API with MongoDB/Mongoose models, Zod validation, consistent API responses, and security middleware.
- JWT access tokens, rotating HTTP-only refresh tokens, bcrypt password hashing, and login-rate protection.
- Central roles/permissions (`SUPER_ADMIN`, `ADMIN`, `HOD`, `LECTURER`, `STUDENT`, `FINANCE`), reusable `authenticate`, `authorize`, and `requirePermission` middleware.
- User management API with audit logging for sensitive actions.

### Phase 2: Academic Management Foundation
- Faculty, Department, and Program management with code and prerequisite validation.
- Academic Year, Semester, Course, and Course Section models.
- StudentProfile and LecturerProfile with departmental scoping.
- Course registration workflow enforcing capacity, prerequisites, and credit hour rules.

### Phase 3: Attendance, Examination & Results Management
- **Attendance Management:**
  - `AttendanceSession` & `AttendanceRecord` models with unique student-session constraints.
  - Lecturer attendance roster with bulk actions: Mark All Present, Mark All Absent, status toggles.
  - Configurable attendance percentage formula with late weight and threshold warnings (< 75% Warning, < 50% Critical).
- **Assessment Management:**
  - Assessment types: Assignment, Quiz, Midterm, Project, Practical, Final Exam.
  - 100% total weight validation rule before results submission.
  - Spreadsheet-like student mark entry with auto-percentage calculation.
- **Examination Management:**
  - Midterm, Final, Make-up, Supplementary exam scheduling.
  - Comprehensive conflict detection: Room conflicts, student timetable clashes, and invigilator conflicts.
- **Grading & Results Workflow:**
  - Configurable `GradeScale` (A+, A, B+, B, C+, C, D, F) and `AcademicStandingRule`.
  - Academic flow: `Draft` → `Submitted` (Lecturer) → `Verified` (HOD) → `Published` / `Locked` (Admin).
  - Students strictly access published results.
  - Result locking with mandatory reason and immutable audit history for amendments.
  - Accurate weighted Semester GPA and cumulative CGPA calculation across all completed semesters.
- **Official Digital Transcripts:**
  - Official transcript generation with unique verification references (`TR-HU-YYYY-XXXXXX`).
  - Print/PDF export layout adhering to the HURU design identity.
  - Public verification endpoint at `/verify/transcript/:referenceNumber` for external verification.
- **Student Performance Dashboard:**
  - Metric cards for GPA, CGPA, Credits Earned, Credits Remaining, Standing.
  - Visual analytics for GPA trends and grade distribution.

---

## Academic Architecture Flow

```text
University
└── Faculty
    └── Department
        └── Program
            └── Academic Year
                └── Semester
                    └── Course
                        └── Course Section
                            └── Course Registration
                                ├── Attendance Sessions & Records
                                ├── Assessments & Marks Entry (100% total weight)
                                ├── Exam Timetables (Conflict Protected)
                                └── Results Workflow (Draft → Submitted → Verified → Published)
                                    └── GPA & CGPA Engine
                                        └── Official Transcript & Public Verification
```

---

## Structure

```text
client/  React 19 + Vite application, contexts, responsive UI, Phase 1/2/3 pages and services
server/  Express 5 API: config, models, controllers, middleware, validators, tests, routes, seeds
```

---

## Quick Start

1. Copy `.env.example` to `server/.env` and replace development secrets with random values.
2. Install dependencies: `npm run install` or `npm install`
3. Run tests: `npm run test`
4. Build both workspaces: `npm run build`
5. Seed development data: `npm run seed`
6. Start client and API: `npm run dev`

The web application runs at `http://localhost:5173`; the API runs at `http://localhost:5000`.

---

## Development Seed Accounts

All development seed accounts use password: `HuruDev2026!`. Never use this password in production.

- `superadmin@hormuud.edu.so` — SUPER_ADMIN
- `admin@hormuud.edu.so` — ADMIN
- `lecturer1@hormuud.edu.so` — HOD (Head of Department)
- `lecturer2@hormuud.edu.so` — LECTURER
- `hodan.ali@hormuud.edu.so` — FINANCE
- `student1@hormuud.edu.so` — STUDENT (Pre-seeded with attendance, published grades & transcript `TR-HU-2026-A8F291`)
- `student2@hormuud.edu.so` — STUDENT

---

## Phase 3 API Endpoints

- **Attendance:**
  - `GET /api/v1/attendance/sessions`
  - `POST /api/v1/attendance/sessions`
  - `GET /api/v1/attendance/sessions/:id`
  - `PATCH /api/v1/attendance/sessions/:id`
  - `POST /api/v1/attendance/sessions/:id/records`
  - `PATCH /api/v1/attendance/records/:id`
  - `GET /api/v1/attendance/students/:id`
- **Assessments:**
  - `GET /api/v1/assessments`
  - `POST /api/v1/assessments`
  - `GET /api/v1/assessments/:id`
  - `PATCH /api/v1/assessments/:id`
  - `DELETE /api/v1/assessments/:id`
  - `GET /api/v1/assessments/section/:sectionId/summary`
- **Marks:**
  - `GET /api/v1/assessment-results`
  - `GET /api/v1/assessment-results/sheet/:assessmentId`
  - `POST /api/v1/assessment-results`
  - `PATCH /api/v1/assessment-results/:id`
  - `POST /api/v1/assessment-results/publish`
- **Examinations:**
  - `GET /api/v1/exams`
  - `POST /api/v1/exams`
  - `GET /api/v1/exams/:id`
  - `PATCH /api/v1/exams/:id`
  - `DELETE /api/v1/exams/:id`
- **Results & Performance:**
  - `GET /api/v1/results`
  - `GET /api/v1/results/performance/:studentId`
  - `POST /api/v1/results/calculate`
  - `POST /api/v1/results/submit`
  - `POST /api/v1/results/verify`
  - `POST /api/v1/results/publish`
  - `PATCH /api/v1/results/change-published`
- **Official Transcripts & Public Verification:**
  - `GET /api/v1/transcripts/:studentId`
  - `POST /api/v1/transcripts/generate`
  - `GET /api/v1/transcripts/:id/download` (Printable official PDF document)
  - `GET /api/v1/verify/transcript/:referenceNumber` (Public authentication endpoint)
- **Academic Policy Configuration:**
  - `GET /api/v1/grade-scales`, `POST /api/v1/grade-scales`
  - `GET /api/v1/academic-standing`, `POST /api/v1/academic-standing`
  - `GET /api/v1/attendance-settings`, `PATCH /api/v1/attendance-settings`

---

## Design Identity (HURU Design System)

- **Primary:** `#123B6D`
- **Gold:** `#D9A441`
- **Accent:** `#1D9BF0`
- **Light:** `#F7F9FC`
- **Dark:** `#0B1220`
- **Text:** `#172033`
- **Muted:** `#667085`
- **Success:** `#16A34A`
- **Warning:** `#F59E0B`
- **Danger:** `#DC2626`
