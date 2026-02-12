/**
 * Utility functions for percentage calculations and formatting
 */

/**
 * Clamp a percentage value to a maximum of 100
 */
export function clampTo100(percentage: number): number {
  return Math.min(percentage, 100);
}

/**
 * Format a percentage value, clamped to 100
 */
export function formatPercent(value: number, decimals: number = 1): string {
  const clamped = clampTo100(value);
  return clamped.toFixed(decimals);
}

/**
 * Calculate percentage from marks and max marks, clamped to 100
 */
export function calculatePercentage(marks: number, maxMarks: number): number {
  if (maxMarks <= 0) return 0;
  const percentage = (marks * 100) / maxMarks;
  return clampTo100(percentage);
}
