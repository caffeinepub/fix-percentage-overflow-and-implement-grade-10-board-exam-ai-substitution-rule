import type { AcademicEntry, SubjectScores } from '../backend';
import { clampTo100 } from './percent';
import { getExpectedMaxMarksForSubjectKey } from './maxMarks';

export interface SubjectStats {
  subjectName: string;
  average: number;
  highest: number;
  lowest: number;
  count: number;
}

const SUBJECT_DISPLAY_NAMES: Record<string, string> = {
  math: 'Math',
  english: 'English',
  hindi: 'Hindi',
  evs: 'EVS',
  computer: 'Computer',
  kannada: 'Kannada',
  science: 'Science',
  social: 'Social',
  ai: 'AI',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  economics: 'Economics',
  businessStudies: 'Business Studies',
  accountancy: 'Accountancy',
  statistics: 'Statistics',
  management: 'Management',
  psychology: 'Psychology',
  pe: 'PE',
};

/**
 * Calculate percentage for a subject using the same max marks logic as ProgressView
 */
function getSubjectPercentage(entry: AcademicEntry, subjectKey: keyof SubjectScores): number {
  const marks = entry.subjects[subjectKey];
  if (marks === undefined || marks === null) return 0;

  const grade = Number(entry.grade);
  const term = Number(entry.term);
  const termMaxMarks = Number(entry.termMaxMarks);
  let maxMarks: number;

  // Determine which stored max marks field to use
  if (subjectKey === 'computer') {
    maxMarks = Number(entry.computerMaxMarks);
  } else if (subjectKey === 'ai') {
    maxMarks = Number(entry.aiMaxMarks);
  } else {
    // For regular subjects, use maxMarksPerSubject
    maxMarks = Number(entry.maxMarksPerSubject);
  }

  // Validate stored max marks and apply fallback if suspicious
  if (maxMarks === 0 || maxMarks === termMaxMarks || maxMarks > 150) {
    // Use grade-wise expected max marks as fallback
    maxMarks = getExpectedMaxMarksForSubjectKey(subjectKey as string, grade, term);
  }

  // If still 0 after fallback, return 0% to avoid division by zero
  if (maxMarks === 0) return 0;

  const percentage = (Number(marks) * 100) / maxMarks;
  return clampTo100(percentage);
}

/**
 * Compute subject-wise statistics from academic entries
 */
export function computeSubjectAnalysis(entries: AcademicEntry[]): SubjectStats[] {
  if (entries.length === 0) return [];

  // Collect percentages per subject
  const subjectData = new Map<string, number[]>();

  for (const entry of entries) {
    const subjects = entry.subjects;
    
    for (const [key, value] of Object.entries(subjects)) {
      if (value !== undefined && value !== null) {
        const percentage = getSubjectPercentage(entry, key as keyof SubjectScores);
        
        if (!subjectData.has(key)) {
          subjectData.set(key, []);
        }
        subjectData.get(key)!.push(percentage);
      }
    }
  }

  // Calculate stats for each subject
  const stats: SubjectStats[] = [];

  for (const [key, percentages] of subjectData.entries()) {
    if (percentages.length === 0) continue;

    const sum = percentages.reduce((acc, val) => acc + val, 0);
    const average = sum / percentages.length;
    const highest = Math.max(...percentages);
    const lowest = Math.min(...percentages);

    stats.push({
      subjectName: SUBJECT_DISPLAY_NAMES[key] || key,
      average: clampTo100(average),
      highest: clampTo100(highest),
      lowest: clampTo100(lowest),
      count: percentages.length,
    });
  }

  // Sort by subject name
  stats.sort((a, b) => a.subjectName.localeCompare(b.subjectName));

  return stats;
}
