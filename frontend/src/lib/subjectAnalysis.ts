import type { AcademicEntry, Subjects } from '../backend';
import { clampTo100 } from './percent';
import { getExpectedMaxMarksForSubjectKey } from './maxMarks';

export interface SubjectStatistics {
  subjectKey: string;
  averagePercentage: number;
  highestPercentage: number;
  lowestPercentage: number;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  averageMarksDisplay: string;
  count: number;
}

/**
 * Calculate percentage for a subject using the same max marks logic as ProgressView
 */
function getSubjectPercentage(entry: AcademicEntry, subjectKey: keyof Subjects): number {
  const marks = entry.subjects[subjectKey];
  if (marks === undefined || marks === null) return 0;

  const grade = Number(entry.grade);
  const term = Number(entry.term);
  const termMaxMarks = Number(entry.termMaxMarks);
  let maxMarks: number;

  if (subjectKey === 'computer') {
    maxMarks = Number(entry.computerMaxMarks);
  } else if (subjectKey === 'ai') {
    maxMarks = Number(entry.aiMaxMarks);
  } else {
    maxMarks = Number(entry.maxMarksPerSubject);
  }

  if (maxMarks === 0 || maxMarks === termMaxMarks || maxMarks > 150) {
    maxMarks = getExpectedMaxMarksForSubjectKey(subjectKey as string, grade, term);
  }

  if (maxMarks === 0) return 0;

  const percentage = (Number(marks) * 100) / maxMarks;
  return clampTo100(percentage);
}

/**
 * Get raw marks and max marks for display
 */
function getSubjectMarksData(entry: AcademicEntry, subjectKey: keyof Subjects): { marks: number; maxMarks: number } | null {
  const marks = entry.subjects[subjectKey];
  if (marks === undefined || marks === null) return null;

  const grade = Number(entry.grade);
  const term = Number(entry.term);
  const termMaxMarks = Number(entry.termMaxMarks);
  let maxMarks: number;

  if (subjectKey === 'computer') {
    maxMarks = Number(entry.computerMaxMarks);
  } else if (subjectKey === 'ai') {
    maxMarks = Number(entry.aiMaxMarks);
  } else {
    maxMarks = Number(entry.maxMarksPerSubject);
  }

  if (maxMarks === 0 || maxMarks === termMaxMarks || maxMarks > 150) {
    maxMarks = getExpectedMaxMarksForSubjectKey(subjectKey as string, grade, term);
  }

  if (maxMarks === 0) return null;

  return { marks: Number(marks), maxMarks };
}

/**
 * Compute subject-wise statistics from academic entries.
 * Includes average, highest, and lowest raw marks and percentages.
 */
export function computeSubjectStatistics(entries: AcademicEntry[]): SubjectStatistics[] {
  if (entries.length === 0) return [];

  const subjectData = new Map<string, {
    percentages: number[];
    rawMarks: number[];
    marksData: Array<{ marks: number; maxMarks: number }>;
  }>();

  for (const entry of entries) {
    const subjects = entry.subjects;
    
    for (const [key, value] of Object.entries(subjects)) {
      if (value !== undefined && value !== null) {
        const percentage = getSubjectPercentage(entry, key as keyof Subjects);
        const marksData = getSubjectMarksData(entry, key as keyof Subjects);
        
        if (!subjectData.has(key)) {
          subjectData.set(key, { percentages: [], rawMarks: [], marksData: [] });
        }
        
        const data = subjectData.get(key)!;
        data.percentages.push(percentage);
        if (marksData) {
          data.rawMarks.push(marksData.marks);
          data.marksData.push(marksData);
        }
      }
    }
  }

  const stats: SubjectStatistics[] = [];
  
  for (const [key, data] of subjectData.entries()) {
    const { percentages, rawMarks, marksData } = data;
    if (percentages.length === 0) continue;
    
    const pctSum = percentages.reduce((a, b) => a + b, 0);
    const avgPct = pctSum / percentages.length;
    const highestPct = Math.max(...percentages);
    const lowestPct = Math.min(...percentages);

    let averageMarks = 0;
    let highestMarks = 0;
    let lowestMarks = 0;
    let averageMarksDisplay = '-';

    if (rawMarks.length > 0) {
      const marksSum = rawMarks.reduce((a, b) => a + b, 0);
      averageMarks = Math.round(marksSum / rawMarks.length);
      highestMarks = Math.max(...rawMarks);
      lowestMarks = Math.min(...rawMarks);
      const maxMarks = marksData[0].maxMarks;
      averageMarksDisplay = `${averageMarks}/${maxMarks}`;
    }
    
    stats.push({
      subjectKey: key,
      averagePercentage: clampTo100(avgPct),
      highestPercentage: clampTo100(highestPct),
      lowestPercentage: clampTo100(lowestPct),
      averageMarks,
      highestMarks,
      lowestMarks,
      averageMarksDisplay,
      count: percentages.length,
    });
  }

  stats.sort((a, b) => a.subjectKey.localeCompare(b.subjectKey));
  
  return stats;
}
