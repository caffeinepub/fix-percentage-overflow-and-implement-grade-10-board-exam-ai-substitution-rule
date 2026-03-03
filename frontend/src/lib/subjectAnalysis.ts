import { AcademicEntry } from '../backend';
import { getExpectedMaxMarksForSubjectKey } from './maxMarks';

export interface SubjectStats {
  subjectKey: string;
  label: string;
  highestMarks: number;
  lowestMarks: number;
  highestPercentage: number;
  lowestPercentage: number;
  averagePercentage: number;
  maxMarks: number;
  count: number;
}

export interface SubjectAverageResult {
  subjectKey: string;
  label: string;
  averagePercentage: number;
  count: number;
}

export interface PerGradeSubjectAverages {
  grade: number;
  subjects: SubjectAverageResult[];
}

const SUBJECT_LABELS: Record<string, string> = {
  math: 'Maths',
  english: 'English',
  hindi: 'Hindi',
  evs: 'EVS',
  computer: 'Computer',
  kannada: 'Kannada',
  science: 'Science',
  ssc: 'SSC',
  ai: 'AI',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  economics: 'Economics',
  businessStudies: 'Business Studies',
  accountancy: 'Accountancy',
  statistics: 'Statistics',
  management: 'Management',
  psychology: 'Psychology',
  pe: 'P.E.',
  appliedMaths: 'Applied Maths',
  maths: 'Maths (Elective)',
};

const ALL_SUBJECT_KEYS = [
  'math', 'english', 'hindi', 'evs', 'computer', 'kannada',
  'science', 'ssc', 'ai', 'physics', 'chemistry', 'biology',
  'economics', 'businessStudies', 'accountancy', 'statistics',
  'management', 'psychology', 'pe', 'appliedMaths', 'maths',
] as const;

/**
 * Helper: get max marks for a subject in a given entry, using stored values when available.
 */
function getSubjectMaxMarks(key: string, entry: AcademicEntry): number {
  const grade = Number(entry.grade);
  const term = Number(entry.term);
  let maxMarks = getExpectedMaxMarksForSubjectKey(key, grade, term);
  if (key === 'computer') {
    const stored = Number(entry.computerMaxMarks);
    if (stored > 0) maxMarks = stored;
  } else if (key === 'ai') {
    const stored = Number(entry.aiMaxMarks);
    if (stored > 0) maxMarks = stored;
  }
  return maxMarks;
}

/**
 * Compute per-subject statistics (highest, lowest, and average marks) from academic entries.
 * Optionally filter by grade and/or term.
 */
export function computeSubjectStats(
  entries: AcademicEntry[],
  filterGrade?: number,
  filterTerm?: number
): SubjectStats[] {
  const filtered = entries.filter(entry => {
    const grade = Number(entry.grade);
    const term = Number(entry.term);
    if (filterGrade !== undefined && grade !== filterGrade) return false;
    if (filterTerm !== undefined && term !== filterTerm) return false;
    return true;
  });

  const subjectDataMap = new Map<string, { marks: number[]; percentages: number[]; maxMarks: number }>();

  for (const entry of filtered) {
    const subjects = entry.subjects as Record<string, bigint | undefined>;

    for (const key of ALL_SUBJECT_KEYS) {
      const rawVal = subjects[key];
      if (rawVal === undefined || rawVal === null) continue;
      const marks = Number(rawVal);

      const maxMarks = getSubjectMaxMarks(key, entry);
      if (maxMarks === 0) continue;

      const pct = Math.round((marks / maxMarks) * 100);

      if (!subjectDataMap.has(key)) {
        subjectDataMap.set(key, { marks: [], percentages: [], maxMarks });
      }
      const data = subjectDataMap.get(key)!;
      data.marks.push(marks);
      data.percentages.push(pct);
      // Update maxMarks to the latest seen (consistent within a grade/term filter)
      data.maxMarks = maxMarks;
    }
  }

  const stats: SubjectStats[] = [];

  for (const [key, data] of subjectDataMap.entries()) {
    if (data.marks.length === 0) continue;
    const highest = Math.max(...data.marks);
    const lowest = Math.min(...data.marks);
    const maxMarks = data.maxMarks;
    const avgPct = Math.round(data.percentages.reduce((a, b) => a + b, 0) / data.percentages.length);

    stats.push({
      subjectKey: key,
      label: SUBJECT_LABELS[key] ?? key,
      highestMarks: highest,
      lowestMarks: lowest,
      highestPercentage: maxMarks > 0 ? Math.round((highest / maxMarks) * 100) : 0,
      lowestPercentage: maxMarks > 0 ? Math.round((lowest / maxMarks) * 100) : 0,
      averagePercentage: avgPct,
      maxMarks,
      count: data.marks.length,
    });
  }

  return stats.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Calculate average percentage for each subject across all terms within each grade.
 * Returns an array of per-grade subject averages.
 */
export function calculatePerGradeSubjectAverages(
  entries: AcademicEntry[]
): PerGradeSubjectAverages[] {
  // Group entries by grade
  const gradeMap = new Map<number, AcademicEntry[]>();
  for (const entry of entries) {
    const grade = Number(entry.grade);
    if (!gradeMap.has(grade)) gradeMap.set(grade, []);
    gradeMap.get(grade)!.push(entry);
  }

  const result: PerGradeSubjectAverages[] = [];

  for (const [grade, gradeEntries] of gradeMap.entries()) {
    // For each subject, collect percentages across all terms in this grade
    const subjectPctMap = new Map<string, number[]>();

    for (const entry of gradeEntries) {
      const subjects = entry.subjects as Record<string, bigint | undefined>;
      for (const key of ALL_SUBJECT_KEYS) {
        const rawVal = subjects[key];
        if (rawVal === undefined || rawVal === null) continue;
        const marks = Number(rawVal);
        const maxMarks = getSubjectMaxMarks(key, entry);
        if (maxMarks === 0) continue;

        const pct = Math.round((marks / maxMarks) * 100);
        if (!subjectPctMap.has(key)) subjectPctMap.set(key, []);
        subjectPctMap.get(key)!.push(pct);
      }
    }

    const subjects: SubjectAverageResult[] = [];
    for (const [key, pcts] of subjectPctMap.entries()) {
      if (pcts.length === 0) continue;
      const avgPct = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
      subjects.push({
        subjectKey: key,
        label: SUBJECT_LABELS[key] ?? key,
        averagePercentage: avgPct,
        count: pcts.length,
      });
    }

    subjects.sort((a, b) => a.label.localeCompare(b.label));
    result.push({ grade, subjects });
  }

  return result.sort((a, b) => a.grade - b.grade);
}

/**
 * Calculate overall average percentage for each subject across all grades and all terms.
 * Only includes subjects with at least one data entry.
 */
export function calculateOverallSubjectAverages(
  entries: AcademicEntry[]
): SubjectAverageResult[] {
  const subjectPctMap = new Map<string, number[]>();

  for (const entry of entries) {
    const subjects = entry.subjects as Record<string, bigint | undefined>;
    for (const key of ALL_SUBJECT_KEYS) {
      const rawVal = subjects[key];
      if (rawVal === undefined || rawVal === null) continue;
      const marks = Number(rawVal);
      const maxMarks = getSubjectMaxMarks(key, entry);
      if (maxMarks === 0) continue;

      const pct = Math.round((marks / maxMarks) * 100);
      if (!subjectPctMap.has(key)) subjectPctMap.set(key, []);
      subjectPctMap.get(key)!.push(pct);
    }
  }

  const result: SubjectAverageResult[] = [];
  for (const [key, pcts] of subjectPctMap.entries()) {
    if (pcts.length === 0) continue;
    const avgPct = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
    result.push({
      subjectKey: key,
      label: SUBJECT_LABELS[key] ?? key,
      averagePercentage: avgPct,
      count: pcts.length,
    });
  }

  return result.sort((a, b) => a.label.localeCompare(b.label));
}
