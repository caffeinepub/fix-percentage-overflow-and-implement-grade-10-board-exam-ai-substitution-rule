import type { AcademicEntry } from '../backend';

export interface FrequencyInterval {
  interval: string;
  midpoint: number;
  frequency: number;
}

/**
 * Compute frequency distribution from academic entries using 10-point class intervals.
 * Uses the original termPercentage field.
 */
export function computeFrequencyDistribution(entries: AcademicEntry[]): FrequencyInterval[] {
  const intervals: FrequencyInterval[] = [
    { interval: '0-10', midpoint: 5, frequency: 0 },
    { interval: '10-20', midpoint: 15, frequency: 0 },
    { interval: '20-30', midpoint: 25, frequency: 0 },
    { interval: '30-40', midpoint: 35, frequency: 0 },
    { interval: '40-50', midpoint: 45, frequency: 0 },
    { interval: '50-60', midpoint: 55, frequency: 0 },
    { interval: '60-70', midpoint: 65, frequency: 0 },
    { interval: '70-80', midpoint: 75, frequency: 0 },
    { interval: '80-90', midpoint: 85, frequency: 0 },
    { interval: '90-100', midpoint: 95, frequency: 0 },
  ];

  for (const entry of entries) {
    const pct = Math.min(100, Math.max(0, Number(entry.termPercentage)));
    // 100% goes into the last bucket (90-100)
    const bucketIndex = pct === 100 ? 9 : Math.floor(pct / 10);
    intervals[bucketIndex].frequency += 1;
  }

  return intervals;
}
