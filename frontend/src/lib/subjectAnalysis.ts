import { AcademicEntry } from '../backend';
import { getExpectedMaxMarksForSubjectKey } from './maxMarks';

export type SubjectKey = keyof NonNullable<AcademicEntry['subjects']>;

export interface SubjectStatistics {
  subjectKey: SubjectKey;
  count: number;
  averageRawMarks: number;
  averagePercentage: number;
  highestRawMarks: number;
  highestPercentage: number;
  lowestRawMarks: number;
  lowestPercentage: number;
}

/**
 * Compute per-subject statistics from academic entries.
 * Optionally filter by grade and/or term.
 */
export function computeSubjectStatistics(
  entries: AcademicEntry[],
  filterGrade?: number | null,
  filterTerm?: number | null
): SubjectStatistics[] {
  // Apply filters
  let filtered = entries;
  if (filterGrade != null) {
    filtered = filtered.filter((e) => Number(e.grade) === filterGrade);
  }
  if (filterTerm != null) {
    filtered = filtered.filter((e) => Number(e.term) === filterTerm);
  }

  const subjectKeys: SubjectKey[] = [
    'math', 'english', 'hindi', 'evs', 'computer', 'kannada',
    'science', 'ssc', 'ai', 'physics', 'chemistry', 'biology',
    'economics', 'businessStudies', 'accountancy', 'statistics',
    'management', 'psychology', 'pe', 'appliedMaths', 'maths',
  ];

  const results: SubjectStatistics[] = [];

  for (const key of subjectKeys) {
    const dataPoints: { raw: number; pct: number }[] = [];

    for (const entry of filtered) {
      const rawVal = entry.subjects[key];
      if (rawVal == null) continue;
      const raw = Number(rawVal);
      const grade = Number(entry.grade);
      const term = Number(entry.term);

      // Use the correct 3-argument signature: (subjectKey, grade, term)
      const maxMarks = getExpectedMaxMarksForSubjectKey(key, grade, term);
      const pct = maxMarks > 0 ? Math.min(100, Math.round((raw / maxMarks) * 100)) : 0;
      dataPoints.push({ raw, pct });
    }

    if (dataPoints.length === 0) continue;

    const avgRaw = dataPoints.reduce((s, d) => s + d.raw, 0) / dataPoints.length;
    const avgPct = dataPoints.reduce((s, d) => s + d.pct, 0) / dataPoints.length;
    const maxRaw = Math.max(...dataPoints.map((d) => d.raw));
    const minRaw = Math.min(...dataPoints.map((d) => d.raw));
    const maxPct = Math.max(...dataPoints.map((d) => d.pct));
    const minPct = Math.min(...dataPoints.map((d) => d.pct));

    results.push({
      subjectKey: key,
      count: dataPoints.length,
      averageRawMarks: Math.round(avgRaw * 10) / 10,
      averagePercentage: Math.round(avgPct * 10) / 10,
      highestRawMarks: maxRaw,
      highestPercentage: maxPct,
      lowestRawMarks: minRaw,
      lowestPercentage: minPct,
    });
  }

  return results;
}
