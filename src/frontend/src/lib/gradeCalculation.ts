/**
 * Grade calculation utilities for consistent grade determination across the application
 * All grades are calculated from percentage (marks/maxMarks * 100), not from grading system numbers
 */

/**
 * Calculate letter grade from percentage
 * @param marks Raw marks scored
 * @param maxMarks Maximum marks possible
 * @returns Letter grade (A+, A, B+, B, C, D, E, F)
 */
export function calculateLetterGrade(marks: number, maxMarks: number): string {
  if (maxMarks === 0) return 'N/A';
  
  const percentage = (marks * 100) / maxMarks;
  
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  if (percentage >= 40) return 'E';
  return 'F';
}

/**
 * Calculate 9-scale grade from raw marks
 * @param marks Raw marks scored
 * @param maxMarks Maximum marks possible
 * @returns Grade on 9-scale (1-9, or 0 for very low scores)
 */
export function calculateNineScaleGrade(marks: number, maxMarks: number): number {
  if (maxMarks === 0) return 0;
  
  const percentage = (marks * 100) / maxMarks;
  
  if (percentage >= 91) return 9;
  if (percentage >= 81) return 8;
  if (percentage >= 71) return 7;
  if (percentage >= 61) return 6;
  if (percentage >= 51) return 5;
  if (percentage >= 41) return 4;
  if (percentage >= 33) return 3;
  if (percentage >= 21) return 2;
  if (percentage >= 11) return 1;
  return 0;
}

/**
 * Get color class for 9-scale grade badge
 * @param grade Grade value (1-9)
 * @returns Tailwind color class
 */
export function getNineScaleGradeColor(grade: number): string {
  if (grade >= 9) return 'bg-green-600 text-white';
  if (grade >= 8) return 'bg-green-500 text-white';
  if (grade >= 7) return 'bg-blue-500 text-white';
  if (grade >= 6) return 'bg-blue-400 text-white';
  if (grade >= 5) return 'bg-yellow-500 text-white';
  if (grade >= 4) return 'bg-orange-500 text-white';
  if (grade >= 3) return 'bg-orange-600 text-white';
  if (grade >= 2) return 'bg-red-500 text-white';
  if (grade >= 1) return 'bg-red-600 text-white';
  return 'bg-gray-500 text-white';
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
