/**
 * Grade calculation utilities with letter grade, 9-scale grade functions,
 * and color helpers.
 */

/**
 * Get letter grade from percentage (0–100).
 */
export function getLetterGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 33) return 'D';
  return 'F';
}

/**
 * Alias for getLetterGrade (used by legacy components).
 */
export function calculateLetterGrade(percentage: number, _maxMarks?: number): string {
  return getLetterGrade(percentage);
}

/**
 * Calculate 9-scale grade from a percentage value.
 * Boundaries: 90–100=9, 80–89=8, 70–79=7, 60–69=6, 50–59=5,
 *             40–49=4, 33–39=3, 20–32=2, 10–19=1, 0–9=0
 */
export function calculateNineScaleFromPercentage(percentage: number): number {
  if (percentage >= 90) return 9;
  if (percentage >= 80) return 8;
  if (percentage >= 70) return 7;
  if (percentage >= 60) return 6;
  if (percentage >= 50) return 5;
  if (percentage >= 40) return 4;
  if (percentage >= 33) return 3;
  if (percentage >= 20) return 2;
  if (percentage >= 10) return 1;
  return 0;
}

/**
 * Get Tailwind color classes for a 9-scale grade value.
 */
export function getNineScaleGradeColor(scale: number): string {
  if (scale >= 9) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
  if (scale >= 7) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  if (scale >= 5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  if (scale >= 3) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
}

/**
 * Calculate percentage from obtained marks and total marks.
 */
export function calculatePercentage(obtained: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, (obtained / total) * 100);
}
