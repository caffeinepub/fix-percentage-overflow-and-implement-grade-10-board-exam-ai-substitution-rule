/**
 * Utility functions for percentage calculations.
 */

export function clampTo100(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatPercent(value: number, decimals = 1): string {
  return `${clampTo100(value).toFixed(decimals)}%`;
}

/**
 * Calculate adjusted term percentage using the formula: (original + 94) / 2.
 * Blends the raw term percentage with a 94% baseline.
 */
export function calculateAdjustedTermPercentage(percentage: number): number {
  return clampTo100((percentage + 94) / 2);
}

/**
 * Alias for calculateAdjustedTermPercentage.
 */
export function adjustedTermPercentage(percentage: number): number {
  return calculateAdjustedTermPercentage(percentage);
}

/**
 * Calculate combined overall percentage dynamically.
 *
 * Sums the adjusted percentage of every term present and divides by the
 * count of distinct terms (1, 2, or 3). The denominator is determined
 * dynamically — never hardcoded.
 *
 * Accepts either:
 *   - An array of raw term percentages as the first argument, or
 *   - Up to three individual raw term percentages (each may be null/undefined).
 *
 * @example
 *   // 2 terms
 *   calculateDynamicCombinedPercentage(80, 70)          // (adj(80)+adj(70))/2
 *   // 3 terms
 *   calculateDynamicCombinedPercentage(80, 70, 60)      // (adj(80)+adj(70)+adj(60))/3
 *   // array form
 *   calculateDynamicCombinedPercentage([80, 70])
 *   // nullable form
 *   calculateDynamicCombinedPercentage(null, 70, null)  // adj(70)/1
 */
export function calculateDynamicCombinedPercentage(
  term1OrArray: number | number[] | null | undefined,
  term2?: number | null,
  term3?: number | null
): number {
  let rawValues: (number | null | undefined)[];

  if (Array.isArray(term1OrArray)) {
    rawValues = term1OrArray;
  } else {
    rawValues = [term1OrArray, term2, term3];
  }

  const adjustedValues = rawValues
    .filter((p): p is number => p != null && p > 0)
    .map(p => calculateAdjustedTermPercentage(p));

  if (adjustedValues.length === 0) return 0;

  const sum = adjustedValues.reduce((acc, v) => acc + v, 0);
  return clampTo100(sum / adjustedValues.length);
}

/**
 * Get the count of terms present (those with a positive percentage).
 */
export function getTermCount(
  term1Pct?: number | null,
  term2Pct?: number | null,
  term3Pct?: number | null
): number {
  return [term1Pct, term2Pct, term3Pct].filter(v => v != null && v > 0).length;
}

/**
 * @deprecated Use calculateDynamicCombinedPercentage instead.
 */
export function calculateCombinedAdjustedPercentage(
  term1: number,
  term2: number,
  term3?: number
): number {
  return calculateDynamicCombinedPercentage(term1, term2, term3);
}
