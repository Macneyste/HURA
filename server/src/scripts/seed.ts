import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { ROLE_PERMISSIONS } from '../constants/permissions.js';
import {
  AcademicRule,
  AcademicYear,
  Course,
  CourseRegistration,
  CourseSection,
  Department,
  Faculty,
  LecturerProfile,
  Program,
  Semester,
  StudentProfile
} from '../models/academic.models.js';
import {
  AcademicStandingRule,
  Assessment,
  AttendanceRecord,
  AttendanceSession,
  AttendanceSetting,
  CourseResult,
  Exam,
  GradeScale,
  SemesterResult,
  StudentAssessmentResult,
  Transcript
} from '../models/phase3.models.js';

async function ensureUser(fullName: string, email: string, role: string, passwordHash: string) {
  const user = await User.findOneAndUpdate(
    { email },
    { $setOnInsert: { fullName, email, role, passwordHash, isVerified: true, isActive: true } },
    { new: true, upsert: true }
  );
  return user!;
}

async function seed() {
  await connectDatabase();
  const passwordHash = await bcrypt.hash('HuruDev2026!', 12);

  console.info('Seeding users and roles...');
  const superAdmin = await ensureUser('HURU Super Administrator', 'superadmin@hormuud.edu.so', 'SUPER_ADMIN', passwordHash);
  const admin = await ensureUser('HURU Administrator', 'admin@hormuud.edu.so', 'ADMIN', passwordHash);
  await ensureUser('Dr. Amina Hassan', 'amina.hassan@hormuud.edu.so', 'LECTURER', passwordHash);
  await ensureUser('Dr. Abdi Nur', 'abdi.nur@hormuud.edu.so', 'HOD', passwordHash);
  await ensureUser('Hodan Ali', 'hodan.ali@hormuud.edu.so', 'FINANCE', passwordHash);

  for (const [name, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    await Role.updateOne(
      { name },
      { $set: { permissions, description: `${name.replace('_', ' ')} platform role` } },
      { upsert: true }
    );
  }

  console.info('Seeding faculties and departments...');
  const fcs = await Faculty.findOneAndUpdate(
    { code: 'FCS' },
    { $set: { name: 'Faculty of Computer Science', code: 'FCS', description: 'Computing, software and digital innovation.', deanId: admin._id, status: 'ACTIVE' } },
    { new: true, upsert: true }
  );
  const fba = await Faculty.findOneAndUpdate(
    { code: 'FBA' },
    { $set: { name: 'Faculty of Business Administration', code: 'FBA', description: 'Business, management and entrepreneurship.', status: 'ACTIVE' } },
    { new: true, upsert: true }
  );

  const cs = await Department.findOneAndUpdate(
    { code: 'CS' },
    { $set: { facultyId: fcs._id, name: 'Computer Science Department', code: 'CS', status: 'ACTIVE' } },
    { new: true, upsert: true }
  );
  const it = await Department.findOneAndUpdate(
    { code: 'IT' },
    { $set: { facultyId: fcs._id, name: 'Information Technology Department', code: 'IT', status: 'ACTIVE' } },
    { new: true, upsert: true }
  );
  const ba = await Department.findOneAndUpdate(
    { code: 'BA' },
    { $set: { facultyId: fba._id, name: 'Business Administration Department', code: 'BA', status: 'ACTIVE' } },
    { new: true, upsert: true }
  );
  const acc = await Department.findOneAndUpdate(
    { code: 'ACC' },
    { $set: { facultyId: fba._id, name: 'Accounting Department', code: 'ACC', status: 'ACTIVE' } },
    { new: true, upsert: true }
  );

  const programs = await Promise.all([
    { departmentId: cs._id, name: 'Software Engineering', code: 'BSE' },
    { departmentId: cs._id, name: 'Computer Science', code: 'BCS' },
    { departmentId: it._id, name: 'Information Technology', code: 'BIT' },
    { departmentId: ba._id, name: 'Business Administration', code: 'BBA' }
  ].map((p) =>
    Program.findOneAndUpdate(
      { code: p.code },
      { $set: { ...p, degreeType: 'Bachelor', durationYears: 4, totalCredits: 132, status: 'ACTIVE' } },
      { new: true, upsert: true }
    )
  ));

  console.info('Seeding academic years & semesters...');
  const year1 = await AcademicYear.findOneAndUpdate(
    { name: '2025/2026' },
    { $set: { name: '2025/2026', startDate: new Date('2025-09-01'), endDate: new Date('2026-08-31'), isCurrent: false, status: 'ACTIVE' } },
    { new: true, upsert: true }
  );
  const year2 = await AcademicYear.findOneAndUpdate(
    { name: '2026/2027' },
    { $set: { name: '2026/2027', startDate: new Date('2026-09-01'), endDate: new Date('2027-08-31'), isCurrent: true, status: 'ACTIVE' } },
    { new: true, upsert: true }
  );

  const semPrev1 = await Semester.findOneAndUpdate(
    { academicYearId: year1._id, number: 1 },
    { $set: { academicYearId: year1._id, name: 'Year 2025/2026 - Semester 1', number: 1, startDate: new Date('2025-09-01'), endDate: new Date('2026-01-31'), registrationStart: new Date('2025-08-15'), registrationEnd: new Date('2025-09-15'), isCurrent: false, status: 'ACTIVE' } },
    { new: true, upsert: true }
  );
  const semPrev2 = await Semester.findOneAndUpdate(
    { academicYearId: year1._id, number: 2 },
    { $set: { academicYearId: year1._id, name: 'Year 2025/2026 - Semester 2', number: 2, startDate: new Date('2026-02-15'), endDate: new Date('2026-06-30'), registrationStart: new Date('2026-01-20'), registrationEnd: new Date('2026-02-20'), isCurrent: false, status: 'ACTIVE' } },
    { new: true, upsert: true }
  );
  const semCurrent1 = await Semester.findOneAndUpdate(
    { academicYearId: year2._id, number: 1 },
    { $set: { academicYearId: year2._id, name: 'Year 2026/2027 - Semester 1', number: 1, startDate: new Date('2026-09-01'), endDate: new Date('2027-01-31'), registrationStart: new Date('2026-08-15'), registrationEnd: new Date('2026-10-15'), isCurrent: true, status: 'ACTIVE' } },
    { new: true, upsert: true }
  );
  const semCurrent2 = await Semester.findOneAndUpdate(
    { academicYearId: year2._id, number: 2 },
    { $set: { academicYearId: year2._id, name: 'Year 2026/2027 - Semester 2', number: 2, startDate: new Date('2027-02-15'), endDate: new Date('2027-06-30'), registrationStart: new Date('2027-01-20'), registrationEnd: new Date('2027-02-20'), isCurrent: false, status: 'ACTIVE' } },
    { new: true, upsert: true }
  );

  console.info('Seeding 10 lecturers...');
  const lecturerProfiles = [];
  for (let i = 1; i <= 10; i++) {
    const user = await ensureUser(`Lecturer ${i} Hassan`, `lecturer${i}@hormuud.edu.so`, i === 1 ? 'HOD' : 'LECTURER', passwordHash);
    const department = [cs, cs, it, it, ba, ba, acc, acc, cs, it][i - 1];
    const faculty = [fcs, fcs, fcs, fcs, fba, fba, fba, fba, fcs, fcs][i - 1];
    lecturerProfiles.push(
      await LecturerProfile.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            userId: user._id,
            employeeId: `HU-L${String(i).padStart(3, '0')}`,
            departmentId: department._id,
            facultyId: faculty._id,
            specialization: i <= 4 ? 'Software Engineering & AI' : 'Business Systems',
            academicRank: i === 1 ? 'Professor' : i < 4 ? 'Assistant Professor' : 'Lecturer',
            employmentType: 'Full Time',
            status: 'ACTIVE'
          }
        },
        { new: true, upsert: true }
      )
    );
  }
  await Department.updateOne({ _id: cs._id }, { headId: lecturerProfiles[0]._id });

  console.info('Seeding 20 courses & 10 sections...');
  const courseSpecs = [
    'Introduction to Computing', 'Programming I', 'Programming II', 'Database Systems', 'Web Engineering I',
    'Web Engineering II', 'Data Structures', 'Algorithms', 'Computer Networks', 'Cyber Security',
    'Mobile Application Development', 'Operating Systems', 'Software Testing & QA', 'Human Computer Interaction', 'Cloud Computing',
    'Business Communication', 'Principles of Management', 'Financial Accounting', 'Technology Entrepreneurship', 'Research Methods in IT'
  ];
  const courses: any[] = [];
  for (let i = 0; i < courseSpecs.length; i++) {
    const department = i < 15 ? cs : ba;
    const code = `${i < 15 ? 'CS' : 'BA'}${101 + i}`;
    courses.push(
      await Course.findOneAndUpdate(
        { code },
        {
          $set: {
            departmentId: department._id,
            code,
            title: courseSpecs[i],
            creditHours: 3,
            level: Math.floor(i / 5) + 1,
            type: i % 4 === 0 ? 'Elective' : 'Core',
            prerequisites: [],
            status: 'ACTIVE'
          }
        },
        { new: true, upsert: true }
      )
    );
  }

  const sections: any[] = [];
  for (let i = 0; i < 10; i++) {
    sections.push(
      await CourseSection.findOneAndUpdate(
        { courseId: courses[i]._id, semesterId: semCurrent1._id, sectionCode: 'SEC-A' },
        {
          $set: {
            courseId: courses[i]._id,
            semesterId: semCurrent1._id,
            sectionCode: 'SEC-A',
            lecturerId: lecturerProfiles[i]._id,
            capacity: 45,
            room: `Room A${201 + i}`,
            schedule: i % 2 ? 'Sun, Tue 10:00–11:30' : 'Mon, Wed 08:30–10:00',
            status: 'ACTIVE'
          }
        },
        { new: true, upsert: true }
      )
    );
  }

  console.info('Seeding 50 students & registrations...');
  const students: any[] = [];
  for (let i = 1; i <= 50; i++) {
    const user = await ensureUser(`Student ${i} Ahmed`, `student${i}@hormuud.edu.so`, 'STUDENT', passwordHash);
    const program = programs[(i - 1) % programs.length];
    const dep = [cs, cs, it, ba][(i - 1) % 4];
    const fac = dep === ba ? fba : fcs;
    students.push(
      await StudentProfile.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            userId: user._id,
            studentId: `HU2026${String(i).padStart(3, '0')}`,
            facultyId: fac._id,
            departmentId: dep._id,
            programId: program!._id,
            admissionYear: 2026,
            currentSemester: 1,
            batch: '2026',
            academicStatus: 'Active',
            status: 'ACTIVE'
          }
        },
        { new: true, upsert: true }
      )
    );
  }

  // Register first 30 students in the first 4 sections
  for (let sIdx = 0; sIdx < 30; sIdx++) {
    for (let secIdx = 0; secIdx < 4; secIdx++) {
      await CourseRegistration.updateOne(
        { studentId: students[sIdx]._id, courseSectionId: sections[secIdx]._id, semesterId: semCurrent1._id },
        {
          $set: {
            status: 'Approved',
            approvedBy: admin._id,
            approvedAt: new Date()
          }
        },
        { upsert: true }
      );
    }
  }

  console.info('Seeding Phase 3 Grade Scales & Academic Standing...');
  const gradeScalesData = [
    { letter: 'A+', minimumPercentage: 95, maximumPercentage: 100, gradePoint: 4.0, passStatus: true, order: 1 },
    { letter: 'A', minimumPercentage: 90, maximumPercentage: 94.99, gradePoint: 4.0, passStatus: true, order: 2 },
    { letter: 'B+', minimumPercentage: 85, maximumPercentage: 89.99, gradePoint: 3.5, passStatus: true, order: 3 },
    { letter: 'B', minimumPercentage: 80, maximumPercentage: 84.99, gradePoint: 3.0, passStatus: true, order: 4 },
    { letter: 'C+', minimumPercentage: 75, maximumPercentage: 79.99, gradePoint: 2.5, passStatus: true, order: 5 },
    { letter: 'C', minimumPercentage: 70, maximumPercentage: 74.99, gradePoint: 2.0, passStatus: true, order: 6 },
    { letter: 'D', minimumPercentage: 60, maximumPercentage: 69.99, gradePoint: 1.0, passStatus: true, order: 7 },
    { letter: 'F', minimumPercentage: 0, maximumPercentage: 59.99, gradePoint: 0.0, passStatus: false, order: 8 }
  ];
  for (const gs of gradeScalesData) {
    await GradeScale.updateOne({ letter: gs.letter }, { $set: gs }, { upsert: true });
  }

  const standingRulesData = [
    { code: 'EXCELLENT', name: 'Excellent', minCGPA: 3.5, maxCGPA: 4.0, status: 'ACTIVE', order: 1 },
    { code: 'GOOD_STANDING', name: 'Good Standing', minCGPA: 2.0, maxCGPA: 3.49, status: 'ACTIVE', order: 2 },
    { code: 'ACADEMIC_WARNING', name: 'Academic Warning', minCGPA: 1.5, maxCGPA: 1.99, status: 'ACTIVE', order: 3 },
    { code: 'PROBATION', name: 'Academic Probation', minCGPA: 0.0, maxCGPA: 1.49, status: 'ACTIVE', order: 4 }
  ];
  for (const sr of standingRulesData) {
    await AcademicStandingRule.updateOne({ code: sr.code }, { $set: sr }, { upsert: true });
  }

  await AttendanceSetting.findOneAndUpdate(
    {},
    { $set: { minimumRequiredPercentage: 75, warningPercentage: 75, criticalPercentage: 50, lateWeight: 0.5 } },
    { upsert: true }
  );

  console.info('Seeding Phase 3 Attendance Sessions & Records...');
  const firstSection = sections[0];
  const attendanceDates = [
    new Date('2026-09-10'),
    new Date('2026-09-15'),
    new Date('2026-09-20'),
    new Date('2026-09-25'),
    new Date('2026-10-01')
  ];

  for (let dIdx = 0; dIdx < attendanceDates.length; dIdx++) {
    const session = await AttendanceSession.findOneAndUpdate(
      { courseSectionId: firstSection._id, date: attendanceDates[dIdx] },
      {
        $set: {
          courseSectionId: firstSection._id,
          lecturerId: lecturerProfiles[0]._id,
          date: attendanceDates[dIdx],
          startTime: '08:30',
          endTime: '10:00',
          topic: `Lecture ${dIdx + 1}: Introduction & Foundations`,
          notes: 'Standard lecture session',
          status: 'Closed'
        }
      },
      { new: true, upsert: true }
    );

    // Mark attendance for first 10 students
    for (let sIdx = 0; sIdx < 10; sIdx++) {
      const status = sIdx === 0 ? 'Present' : sIdx === 1 && dIdx === 2 ? 'Late' : sIdx === 2 && dIdx === 1 ? 'Absent' : 'Present';
      await AttendanceRecord.updateOne(
        { attendanceSessionId: session._id, studentId: students[sIdx]._id },
        {
          $set: {
            courseSectionId: firstSection._id,
            status,
            markedBy: admin._id,
            markedAt: attendanceDates[dIdx]
          }
        },
        { upsert: true }
      );
    }
  }

  console.info('Seeding Assessments (Weights = 100%)...');
  const sampleAssessments = [
    { title: 'Assignment 1 — Core Principles', type: 'Assignment', maxMarks: 20, weight: 10 },
    { title: 'Quiz 1 — Practical Review', type: 'Quiz', maxMarks: 10, weight: 10 },
    { title: 'Midterm Examination', type: 'Midterm', maxMarks: 50, weight: 20 },
    { title: 'Course Project Implementation', type: 'Project', maxMarks: 40, weight: 20 },
    { title: 'Final Comprehensive Exam', type: 'Final Exam', maxMarks: 100, weight: 40 }
  ];

  const createdAssessments: any[] = [];
  for (const sa of sampleAssessments) {
    const asm = await Assessment.findOneAndUpdate(
      { courseSectionId: firstSection._id, title: sa.title },
      {
        $set: {
          courseSectionId: firstSection._id,
          title: sa.title,
          type: sa.type,
          description: `Standard assessment for ${sa.title}`,
          maxMarks: sa.maxMarks,
          weight: sa.weight,
          status: 'Published',
          createdBy: admin._id
        }
      },
      { new: true, upsert: true }
    );
    createdAssessments.push(asm);

    // Enter marks for first 5 students
    for (let sIdx = 0; sIdx < 5; sIdx++) {
      const marksObtained = Math.round(sa.maxMarks * (0.8 + sIdx * 0.04));
      await StudentAssessmentResult.updateOne(
        { assessmentId: asm._id, studentId: students[sIdx]._id },
        {
          $set: {
            courseSectionId: firstSection._id,
            marksObtained: Math.min(sa.maxMarks, marksObtained),
            maxMarks: sa.maxMarks,
            percentage: Math.round((marksObtained / sa.maxMarks) * 100),
            status: 'Published',
            enteredBy: admin._id,
            publishedAt: new Date()
          }
        },
        { upsert: true }
      );
    }
  }

  console.info('Seeding Exam Schedules...');
  await Exam.findOneAndUpdate(
    { courseSectionId: firstSection._id, examType: 'Midterm' },
    {
      $set: {
        courseSectionId: firstSection._id,
        semesterId: semCurrent1._id,
        examType: 'Midterm',
        date: new Date('2026-11-15'),
        startTime: '09:00',
        endTime: '11:00',
        room: 'ROOM A201',
        duration: 120,
        instructions: 'Bring your student ID card. No electronic devices permitted.',
        status: 'Scheduled',
        invigilatorId: lecturerProfiles[1]._id
      }
    },
    { upsert: true }
  );

  await Exam.findOneAndUpdate(
    { courseSectionId: sections[1]._id, examType: 'Midterm' },
    {
      $set: {
        courseSectionId: sections[1]._id,
        semesterId: semCurrent1._id,
        examType: 'Midterm',
        date: new Date('2026-11-16'),
        startTime: '13:00',
        endTime: '15:00',
        room: 'ROOM B102',
        duration: 120,
        instructions: 'Open book examination.',
        status: 'Scheduled',
        invigilatorId: lecturerProfiles[2]._id
      }
    },
    { upsert: true }
  );

  console.info('Seeding Published Course Results & Official Transcripts...');
  // Seed published results for Student 1 across 3 courses
  const student1 = students[0];
  const sampleCoursesResults = [
    { course: courses[0], marks: 92, grade: 'A', gp: 4.0 },
    { course: courses[1], marks: 87, grade: 'B+', gp: 3.5 },
    { course: courses[2], marks: 82, grade: 'B', gp: 3.0 }
  ];

  for (const cr of sampleCoursesResults) {
    await CourseResult.updateOne(
      { studentId: student1._id, courseId: cr.course._id },
      {
        $set: {
          studentId: student1._id,
          courseSectionId: firstSection._id,
          courseId: cr.course._id,
          semesterId: semCurrent1._id,
          totalMarks: cr.marks,
          letterGrade: cr.grade,
          gradePoint: cr.gp,
          credits: cr.course.creditHours,
          status: 'Published',
          publishedBy: admin._id,
          publishedAt: new Date()
        }
      },
      { upsert: true }
    );
  }

  // Calculate semester result for student 1: (3*4.0 + 3*3.5 + 3*3.0)/9 = 31.5/9 = 3.50
  await SemesterResult.updateOne(
    { studentId: student1._id, semesterId: semCurrent1._id },
    {
      $set: {
        gpa: 3.5,
        totalCreditsEarned: 9,
        totalCreditsAttempted: 9,
        academicStanding: 'Excellent',
        status: 'Published',
        publishedAt: new Date()
      }
    },
    { upsert: true }
  );

  // Official transcript for Student 1
  const refNumber = 'TR-HU-2026-A8F291';
  await Transcript.updateOne(
    { studentId: student1._id },
    {
      $set: {
        referenceNumber: refNumber,
        issueDate: new Date(),
        status: 'Official',
        cgpa: 3.5,
        totalCreditsEarned: 9,
        totalCreditsAttempted: 9,
        academicStanding: 'Excellent',
        graduationStatus: 'In Progress',
        generatedBy: admin._id,
        verificationCount: 0,
        semesterRecords: [
          {
            semesterId: semCurrent1._id,
            semesterName: 'Year 2026/2027 - Semester 1',
            academicYearName: '2026/2027',
            semesterGpa: 3.5,
            creditsAttempted: 9,
            creditsEarned: 9,
            courses: sampleCoursesResults.map((c) => ({
              courseId: c.course._id,
              courseCode: c.course.code,
              courseTitle: c.course.title,
              credits: c.course.creditHours,
              marks: c.marks,
              letterGrade: c.grade,
              gradePoint: c.gp
            }))
          }
        ]
      }
    },
    { upsert: true }
  );

  console.info(`Phase 3 complete! Sample verification: /verify/transcript/${refNumber}`);
  console.info('Development password for all accounts: HuruDev2026!');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
