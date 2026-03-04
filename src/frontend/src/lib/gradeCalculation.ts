// Grade calculation utilities - nine-point scale ONLY

/**
 * Convert a percentage to a nine-point scale score (1-9).
 * Uses exact boundaries as per the nine-scale grading system.
 */
export function calculateNineScaleFromPercentage(percentage: number): number {
  if (percentage >= 90) return 9;
  if (percentage >= 80) return 8;
  if (percentage >= 70) return 7;
  if (percentage >= 60) return 6;
  if (percentage >= 50) return 5;
  if (percentage >= 40) return 4;
  if (percentage >= 33) return 3;
  if (percentage >= 21) return 2;
  if (percentage >= 10) return 1;
  return 0;
}

/**
 * Get a Tailwind color class for a nine-point scale score.
 */
export function getNineScaleGradeColor(score: number): string {
  if (score >= 9) return "bg-emerald-500 text-white";
  if (score >= 8) return "bg-green-500 text-white";
  if (score >= 7) return "bg-lime-500 text-white";
  if (score >= 6) return "bg-yellow-500 text-white";
  if (score >= 5) return "bg-amber-500 text-white";
  if (score >= 4) return "bg-orange-500 text-white";
  if (score >= 3) return "bg-red-400 text-white";
  if (score >= 2) return "bg-red-600 text-white";
  if (score >= 1) return "bg-red-800 text-white";
  return "bg-gray-400 text-white";
}

/**
 * Calculate percentage from raw marks and max marks.
 */
export function calculatePercentage(marks: number, maxMarks: number): number {
  if (maxMarks <= 0) return 0;
  return Math.min(100, (marks / maxMarks) * 100);
}
