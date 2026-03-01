// Percentage utilities

export function clampTo100(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate adjusted term percentage using formula: (original + 94) / 2
 */
export function calculateAdjustedTermPercentage(originalPercentage: number): number {
  return (originalPercentage + 94) / 2;
}

/**
 * Calculate overall (combined) percentage for a grade by averaging
 * the adjusted percentages of all available terms.
 * Divisor is dynamically determined by the number of terms provided.
 * @param termPercentages Array of original term percentages (non-null/undefined)
 */
export function calculateOverallPercentageFromTerms(termPercentages: number[]): number {
  if (termPercentages.length === 0) return 0;
  const adjustedSum = termPercentages.reduce(
    (sum, p) => sum + calculateAdjustedTermPercentage(p),
    0
  );
  return adjustedSum / termPercentages.length;
}

/**
 * Calculate dynamic combined percentage.
 * Accepts either an array of term percentages OR up to three nullable individual values.
 */
export function calculateDynamicCombinedPercentage(
  termPercentagesOrTerm1: number[] | number | null,
  term2?: number | null,
  term3?: number | null
): number {
  // Array form
  if (Array.isArray(termPercentagesOrTerm1)) {
    return calculateOverallPercentageFromTerms(termPercentagesOrTerm1);
  }

  // Individual values form
  const terms: number[] = [];
  if (termPercentagesOrTerm1 != null) terms.push(termPercentagesOrTerm1);
  if (term2 != null) terms.push(term2);
  if (term3 != null) terms.push(term3);

  return calculateOverallPercentageFromTerms(terms);
}
