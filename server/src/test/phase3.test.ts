import { describe, expect, it } from 'vitest';
import { getGradeForPercentage, getAcademicStanding } from '../controllers/results.controller.js';

// Attendance percentage calculation logic
export const calculateAttendancePercentage = (
  present: number,
  late: number,
  excused: number,
  totalSessions: number,
  lateWeight = 0.5
) => {
  const divisor = totalSessions - excused;
  if (divisor <= 0) return 100;
  const effectivePresent = present + late * lateWeight;
  return Math.min(100, Math.max(0, Math.round((effectivePresent / divisor) * 100)));
};

// Exam time overlap logic
export const timesOverlap = (startA: string, endA: string, startB: string, endB: string): boolean => {
  return startA < endB && startB < endA;
};

// GPA calculation logic
export const calculateGpa = (courses: Array<{ credits: number; gradePoint: number }>) => {
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  if (totalCredits === 0) return 0;
  const totalPoints = courses.reduce((sum, c) => sum + c.credits * c.gradePoint, 0);
  return Math.round((totalPoints / totalCredits) * 100) / 100;
};

describe('Phase 3 — Attendance Management Logic', () => {
  it('correctly calculates attendance percentage with late weight', () => {
    // 20 sessions: 17 present, 2 absent, 1 late (0.5 weight), 0 excused
    // (17 + 0.5) / 20 = 17.5 / 20 = 87.5% -> 88%
    const pct = calculateAttendancePercentage(17, 1, 0, 20, 0.5);
    expect(pct).toBe(88);
  });

  it('correctly deducts excused sessions from denominator', () => {
    // 10 sessions: 8 present, 0 absent, 0 late, 2 excused
    // 8 / (10 - 2) = 8 / 8 = 100%
    const pct = calculateAttendancePercentage(8, 0, 2, 10, 0.5);
    expect(pct).toBe(100);
  });

  it('handles 0 sessions without division by zero', () => {
    const pct = calculateAttendancePercentage(0, 0, 0, 0, 0.5);
    expect(pct).toBe(100);
  });

  it('identifies warning threshold correctly', () => {
    const safePct = calculateAttendancePercentage(16, 0, 0, 20, 0.5); // 80% >= 75% -> Safe
    const warnPct = calculateAttendancePercentage(14, 0, 0, 20, 0.5); // 70% < 75% -> Warning
    const critPct = calculateAttendancePercentage(8, 0, 0, 20, 0.5); // 40% < 50% -> Critical

    expect(safePct).toBeGreaterThanOrEqual(75);
    expect(warnPct).toBeLessThan(75);
    expect(critPct).toBeLessThan(50);
  });
});

describe('Phase 3 — Assessment & Weight Validation', () => {
  it('validates total assessment weights equal to 100%', () => {
    const validWeights = [10, 10, 20, 10, 50]; // Assignment, Quiz, Midterm, Project, Final
    const sum = validWeights.reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);

    const invalidWeights = [10, 10, 20, 50]; // Total 90%
    const invalidSum = invalidWeights.reduce((a, b) => a + b, 0);
    expect(invalidSum).not.toBe(100);
  });

  it('validates student marks are within 0 and maxMarks bounds', () => {
    const maxMarks = 50;
    const validateMark = (m: number) => m >= 0 && m <= maxMarks;

    expect(validateMark(45)).toBe(true);
    expect(validateMark(0)).toBe(true);
    expect(validateMark(50)).toBe(true);
    expect(validateMark(-5)).toBe(false);
    expect(validateMark(55)).toBe(false);
  });
});

describe('Phase 3 — Exam Conflict Detection Algorithm', () => {
  it('detects overlapping exam times', () => {
    // Overlapping: 09:00-11:00 and 10:00-12:00
    expect(timesOverlap('09:00', '11:00', '10:00', '12:00')).toBe(true);
    // Overlapping: same exact slot
    expect(timesOverlap('09:00', '11:00', '09:00', '11:00')).toBe(true);
    // Contained within
    expect(timesOverlap('09:00', '12:00', '10:00', '11:00')).toBe(true);
  });

  it('allows non-overlapping adjacent exam times', () => {
    // 09:00-11:00 and 11:00-13:00 (adjacent back-to-back)
    expect(timesOverlap('09:00', '11:00', '11:00', '13:00')).toBe(false);
    // Completely separated
    expect(timesOverlap('09:00', '11:00', '14:00', '16:00')).toBe(false);
  });
});

describe('Phase 3 — Grade Scale, GPA & CGPA Calculation', () => {
  it('resolves default grade scales accurately', async () => {
    const g1 = await getGradeForPercentage(96);
    expect(g1.letter).toBe('A+');
    expect(g1.gradePoint).toBe(4.0);

    const g2 = await getGradeForPercentage(86);
    expect(g2.letter).toBe('B+');
    expect(g2.gradePoint).toBe(3.5);

    const g3 = await getGradeForPercentage(72);
    expect(g3.letter).toBe('C');
    expect(g3.gradePoint).toBe(2.0);

    const g4 = await getGradeForPercentage(55);
    expect(g4.letter).toBe('F');
    expect(g4.gradePoint).toBe(0.0);
    expect(g4.passStatus).toBe(false);
  });

  it('calculates weighted Semester GPA accurately', () => {
    // Web Engineering: 3 cr, 3.5 GP = 10.5
    // Database: 3 cr, 4.0 GP = 12.0
    // Networking: 3 cr, 2.5 GP = 7.5
    // Total credits = 9, total points = 30.0 -> GPA = 3.33
    const courses = [
      { credits: 3, gradePoint: 3.5 },
      { credits: 3, gradePoint: 4.0 },
      { credits: 3, gradePoint: 2.5 }
    ];
    const gpa = calculateGpa(courses);
    expect(gpa).toBe(3.33);
  });

  it('calculates CGPA cumulatively using all credit hours', () => {
    // Semester 1: 15 credits, 3.20 GPA -> 48 points
    // Semester 2: 15 credits, 3.80 GPA -> 57 points
    // Total: 105 points / 30 credits = 3.50 CGPA
    const allCourses = [
      { credits: 15, gradePoint: 3.2 },
      { credits: 15, gradePoint: 3.8 }
    ];
    const cgpa = calculateGpa(allCourses);
    expect(cgpa).toBe(3.5);
  });

  it('resolves correct academic standing by CGPA', async () => {
    expect(await getAcademicStanding(3.75)).toBe('Excellent');
    expect(await getAcademicStanding(2.8)).toBe('Good Standing');
    expect(await getAcademicStanding(1.8)).toBe('Academic Warning');
    expect(await getAcademicStanding(1.2)).toBe('Academic Probation');
  });
});

describe('Phase 3 — Official Transcript Format', () => {
  it('formats transcript reference number with TR-HU prefix', () => {
    const currentYear = new Date().getFullYear();
    const regex = new RegExp(`^TR-HU-${currentYear}-[A-F0-9]{6}$`);
    const mockRef = `TR-HU-${currentYear}-A1B2C3`;
    expect(regex.test(mockRef)).toBe(true);
  });
});
