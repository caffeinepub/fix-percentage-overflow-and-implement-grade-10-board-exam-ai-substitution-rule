/**
 * Grade calculation utilities for consistent grade determination across the application
 * All grades are calculated from percentage (marks/maxMarks * 100), not from grading system numbers
 */

/**
 * Calculate letter grade from percentage using 10-point intervals
 * @param marks Raw marks scored
 * @param maxMarks Maximum marks possible
 * @returns Letter grade (A+, A, B+, B, C+, C, D+, D, E+, E, F)
 */
export function calculateLetterGrade(marks: number, maxMarks: number): string {
  if (maxMarks === 0) return 'N/A';
  
  const percentage = (marks * 100) / maxMarks;
  
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 30) return 'D+';
  if (percentage >= 20) return 'D';
  if (percentage >= 10) return 'E+';
  if (percentage >= 0) return 'E';
  return 'F';
}

/**
 * Calculate 9-scale grade from a percentage value.
 * Scale: 90-100=9, 80-89=8, 70-79=7, 60-69=6, 50-59=5, 40-49=4, 30-39=3, 20-29=2, 0-19=1
 * @param percentage Percentage value (0-100)
 * @returns Grade on 9-scale (1-9)
 */
export function calculateNineScaleFromPercentage(percentage: number): number {
  const pct = Math.min(100, Math.max(0, percentage));
  if (pct >= 90) return 9;
  if (pct >= 80) return 8;
  if (pct >= 70) return 7;
  if (pct >= 60) return 6;
  if (pct >= 50) return 5;
  if (pct >= 40) return 4;
  if (pct >= 30) return 3;
  if (pct >= 20) return 2;
  return 1;
}

/**
 * Calculate 9-scale grade from raw marks
 * Scale: 90-100=9, 80-89=8, 70-79=7, 60-69=6, 50-59=5, 40-49=4, 30-39=3, 20-29=2, 0-19=1
 * @param marks Raw marks scored
 * @param maxMarks Maximum marks possible
 * @returns Grade on 9-scale (1-9)
 */
export function calculateNineScaleGrade(marks: number, maxMarks: number): number {
  if (maxMarks === 0) return 1;
  const percentage = (marks * 100) / maxMarks;
  return calculateNineScaleFromPercentage(percentage);
}

/**
 * Get color class for 9-scale grade badge
 * @param grade Grade value (1-9)
 * @returns Tailwind color class
 */
export function getNineScaleGradeColor(grade: number): string {
  if (grade >= 9) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (grade >= 8) return 'bg-green-100 text-green-800 border-green-300';
  if (grade >= 7) return 'bg-blue-100 text-blue-800 border-blue-300';
  if (grade >= 6) return 'bg-sky-100 text-sky-800 border-sky-300';
  if (grade >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  if (grade >= 4) return 'bg-orange-100 text-orange-800 border-orange-300';
  if (grade >= 3) return 'bg-amber-100 text-amber-800 border-amber-300';
  if (grade >= 2) return 'bg-red-100 text-red-800 border-red-300';
  return 'bg-red-200 text-red-900 border-red-400';
}

/**
 * Calculate percentage from raw marks
 * @param marks Raw marks scored
 * @param maxMarks Maximum marks possible
 * @returns Percentage (0-100)
 */
export function calculatePercentage(marks: number, maxMarks: number): number {
  if (maxMarks === 0) return 0;
  const percentage = (marks * 100) / maxMarks;
  return Math.min(100, Math.max(0, percentage));
}
