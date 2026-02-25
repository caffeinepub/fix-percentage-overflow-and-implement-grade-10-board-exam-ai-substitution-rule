/**
 * Clamp a value to the range [0, 100].
 */
export function clampTo100(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format a percentage value to a fixed number of decimal places.
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${clampTo100(value).toFixed(decimals)}`;
}

/**
 * Calculate the adjusted term percentage using the formula:
 * (originalPercentage + 94) / 2
 *
 * This is used for certificate tier determination and individual term display.
 */
export function calculateAdjustedTermPercentage(percentage: number): number {
  return (percentage + 94) / 2;
}

/**
 * Alias for calculateAdjustedTermPercentage.
 */
export function adjustedTermPercentage(percentage: number): number {
  return calculateAdjustedTermPercentage(percentage);
}

/**
 * Calculate the combined adjusted percentage from multiple term percentages.
 * Each term is individually adjusted using (termPct + 94) / 2, then averaged.
 * @deprecated Use calculateDynamicCombinedPercentage for the new combined % logic.
 */
export function calculateCombinedAdjustedPercentage(
  term1: number,
  term2: number,
  term3?: number
): number {
  const valid = [term1, term2, term3].filter((p): p is number => p !== undefined && p > 0);
  if (valid.length === 0) return 0;
  const adjustedValues = valid.map(p => calculateAdjustedTermPercentage(p));
  return adjustedValues.reduce((sum, v) => sum + v, 0) / adjustedValues.length;
}

/**
 * Calculate the combined overall percentage dynamically.
 *
 * The combined percentage is computed by:
 * 1. Taking the calculated (adjusted) percentage for each available term.
 * 2. Summing all available term calculated percentages.
 * 3. Dividing by the count of distinct terms (2 if only terms 1 & 2 exist, 3 if term 3 also exists).
 *
 * @param termCalculatedPercentages Array of calculated percentages for each available term
 * @returns Combined overall percentage
 */
export function calculateDynamicCombinedPercentage(
  termCalculatedPercentages: number[]
): number {
  const valid = termCalculatedPercentages.filter(p => p > 0);
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, p) => acc + p, 0);
  return sum / valid.length;
}
