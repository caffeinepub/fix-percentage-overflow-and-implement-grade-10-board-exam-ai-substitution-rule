// Grade calculation utilities

export function getLetterGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  return 'D';
}

// Alias for backward compatibility
export const calculateLetterGrade = getLetterGrade;

/**
 * Convert a raw percentage (0–100) into a 9-point scale grade.
 * Exact boundaries: 90–100=9, 80–89=8, 70–79=7, 60–69=6, 50–59=5,
 *                   40–49=4, 30–39=3, 20–29=2, 0–19=1
 */
export function calculateNineScaleFromPercentage(percentage: number): number {
  if (percentage >= 90) return 9;
  if (percentage >= 80) return 8;
  if (percentage >= 70) return 7;
  if (percentage >= 60) return 6;
  if (percentage >= 50) return 5;
  if (percentage >= 40) return 4;
  if (percentage >= 30) return 3;
  if (percentage >= 20) return 2;
  return 1;
}

export function getNineScaleGradeColor(grade: number): string {
  if (grade === 9) return 'bg-emerald-500 text-white';
  if (grade === 8) return 'bg-green-500 text-white';
  if (grade === 7) return 'bg-lime-500 text-white';
  if (grade === 6) return 'bg-yellow-500 text-white';
  if (grade === 5) return 'bg-orange-400 text-white';
  if (grade === 4) return 'bg-orange-500 text-white';
  if (grade === 3) return 'bg-red-400 text-white';
  if (grade === 2) return 'bg-red-500 text-white';
  return 'bg-red-700 text-white';
}

export function calculatePercentage(marks: number, maxMarks: number): number {
  if (maxMarks <= 0) return 0;
  return Math.min(100, Math.round((marks / maxMarks) * 100));
}
