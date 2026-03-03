import { AcademicEntry } from '../backend';
import { getExpectedMaxMarksForSubjectKey } from './maxMarks';

export function clampTo100(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

const ALL_SUBJECT_KEYS = [
  'math', 'english', 'hindi', 'evs', 'computer', 'kannada',
  'science', 'ssc', 'ai', 'physics', 'chemistry', 'biology',
  'economics', 'businessStudies', 'accountancy', 'statistics',
  'management', 'psychology', 'pe', 'appliedMaths', 'maths',
] as const;

/**
 * Calculate the raw percentage for a set of entries using subject-level marks.
 * Raw % = sum of obtained marks / sum of grade-specific max marks * 100
 * NOTE: Prefer using entry.termPercentage (stored by backend) for single-entry calculations.
 */
export function calculateCombinedPercentageForEntries(entries: AcademicEntry[]): number {
  if (entries.length === 0) return 0;

  let totalObtained = 0;
  let totalMax = 0;

  for (const entry of entries) {
    const grade = Number(entry.grade);
    const term = Number(entry.term);
    const subjects = entry.subjects as Record<string, bigint | undefined>;

    for (const key of ALL_SUBJECT_KEYS) {
      const rawVal = subjects[key];
      if (rawVal === undefined || rawVal === null) continue;
      const marks = Number(rawVal);

      let maxMarks = getExpectedMaxMarksForSubjectKey(key, grade, term);
      if (key === 'computer') {
        const stored = Number(entry.computerMaxMarks);
        if (stored > 0) maxMarks = stored;
      } else if (key === 'ai') {
        const stored = Number(entry.aiMaxMarks);
        if (stored > 0) maxMarks = stored;
      }
      if (maxMarks === 0) continue;

      totalObtained += marks;
      totalMax += maxMarks;
    }
  }

  if (totalMax === 0) return 0;
  return clampTo100((totalObtained / totalMax) * 100);
}

/**
 * Get the original percentage for a single entry using the stored termPercentage
 * from the backend (same value shown in the Progress tab).
 * This is the authoritative percentage: termTotalMarks / termMaxMarks * 100.
 */
export function getOriginalTermPercentage(entry: AcademicEntry): number {
  return Number(entry.termPercentage);
}

/**
 * Calculate raw percentage for a single term entry.
 * Uses the stored termPercentage from the backend for accuracy.
 */
export function calculateTermCombinedPercentage(entry: AcademicEntry): number {
  return getOriginalTermPercentage(entry);
}

/**
 * Calculate the combined (adjusted) term percentage using the formula:
 * combinedTermPct = (94 + originalTermPct) / 2
 *
 * Where originalTermPct is the percentage from the Progress tab
 * (i.e., entry.termPercentage = termTotalMarks / termMaxMarks * 100).
 */
export function calculateCombinedTermPercentage(originalTermPercentage: number): number {
  return (94 + originalTermPercentage) / 2;
}

/**
 * Calculate the overall grade percentage by averaging all combined term percentages.
 * Divisor is determined dynamically by the number of terms provided (2 or 3).
 */
export function calculateOverallGradePercentage(combinedTermPercentages: number[]): number {
  const valid = combinedTermPercentages.filter(p => p > 0);
  if (valid.length === 0) return 0;
  return valid.reduce((sum, p) => sum + p, 0) / valid.length;
}

// Legacy helpers kept for backward compatibility
export function calculateAdjustedTermPercentage(originalPercentage: number): number {
  return (originalPercentage + 94) / 2;
}

export function calculateOverallPercentageFromTerms(termPercentages: number[]): number {
  const valid = termPercentages.filter(p => p > 0);
  if (valid.length === 0) return 0;
  return valid.reduce((sum, p) => sum + p, 0) / valid.length;
}

export function calculateDynamicCombinedPercentage(
  term1?: number | null,
  term2?: number | null,
  term3?: number | null
): number {
  const terms = [term1, term2, term3].filter((t): t is number => t !== undefined && t !== null && t > 0);
  if (terms.length === 0) return 0;
  return terms.reduce((sum, t) => sum + t, 0) / terms.length;
}
