/**
 * Board exam calculation utilities
 */

/**
 * Board exam grades
 */
export const BOARD_EXAM_GRADES = [10, 12];

/**
 * Check if a grade is a board exam grade
 */
export function isBoardExamGrade(grade: number): boolean {
  return BOARD_EXAM_GRADES.includes(grade);
}

/**
 * Grade 10 board exam AI substitution logic
 * AI can substitute for the lowest of Math/Science/SSC only if it improves the total
 */
export function calculateGrade10CoreTotal(
  math: number,
  science: number,
  ssc: number,
  ai: number
): { total: number; substitutedSubject: string | null } {
  const coreSubjects = { math, science, ssc };
  const coreTotal = math + science + ssc;
  const minValue = Math.min(math, science, ssc);

  if (ai > minValue) {
    let substitutedSubject = 'math';
    if (coreSubjects.math === minValue) {
      substitutedSubject = 'math';
    } else if (coreSubjects.science === minValue) {
      substitutedSubject = 'science';
    } else if (coreSubjects.ssc === minValue) {
      substitutedSubject = 'ssc';
    }
    return { total: coreTotal - minValue + ai, substitutedSubject };
  }

  return { total: coreTotal, substitutedSubject: null };
}

/**
 * Compute AI substitution for Grade 10 board exam.
 * Returns substitution info or null if AI doesn't help.
 */
export function computeAiSubstitution(
  math: number,
  science: number,
  ssc: number,
  ai: number
): { substitutedSubject: string; improvedTotal: number } | null {
  const result = calculateGrade10CoreTotal(math, science, ssc, ai);
  if (!result.substitutedSubject) return null;
  return {
    substitutedSubject: result.substitutedSubject,
    improvedTotal: result.total,
  };
}

/**
 * Calculate Grade 10 board exam total with AI substitution
 */
export function calculateGrade10BoardExam(marks: {
  english: number;
  kannada: number;
  math: number;
  science: number;
  ssc: number;
  ai: number;
}): { boardExamTotal: number; maxMarks: number; substitutedSubject: string | null } {
  const { english, kannada, math, science, ssc, ai } = marks;
  const { total: coreTotal, substitutedSubject } = calculateGrade10CoreTotal(math, science, ssc, ai);
  const boardExamTotal = english + kannada + coreTotal;
  const maxMarks = 500;
  return { boardExamTotal, maxMarks, substitutedSubject };
}

/**
 * Encode subgroup metadata for board exam or elective math choice.
 * Format: "boardExam|sub:<subject>|optMath:<maths|appliedMaths>"
 * or for non-board-exam elective: "elective|math:<maths|appliedMaths>"
 */
export function encodeSubgroup(options: {
  isBoardExam: boolean;
  substitutedSubject?: string;
  mathChoice?: 'maths' | 'appliedMaths';
}): string {
  if (options.isBoardExam) {
    const parts = ['boardExam'];
    if (options.substitutedSubject) parts.push(`sub:${options.substitutedSubject}`);
    if (options.mathChoice) parts.push(`optMath:${options.mathChoice}`);
    return parts.join('|');
  } else {
    const parts = ['elective'];
    if (options.mathChoice) parts.push(`math:${options.mathChoice}`);
    return parts.join('|');
  }
}

/**
 * Alias for encodeSubgroup with board exam defaults (backward compat)
 */
export function encodeBoardExamSubgroup(
  substitutedSubject: string | null,
  optionalMathChoice?: 'maths' | 'appliedMaths'
): string {
  return encodeSubgroup({
    isBoardExam: true,
    substitutedSubject: substitutedSubject || undefined,
    mathChoice: optionalMathChoice,
  });
}

/**
 * Decode subgroup metadata from the subgroup field
 */
export function decodeSubgroup(subgroup: string | undefined | null): {
  isBoardExam: boolean;
  substitutedSubject: string | null;
  mathChoice: 'maths' | 'appliedMaths' | null;
} {
  if (!subgroup) {
    return { isBoardExam: false, substitutedSubject: null, mathChoice: null };
  }

  const parts = subgroup.split('|');
  let isBoardExam = false;
  let substitutedSubject: string | null = null;
  let mathChoice: 'maths' | 'appliedMaths' | null = null;

  if (parts[0] === 'boardExam') {
    isBoardExam = true;
    for (const part of parts) {
      if (part.startsWith('sub:')) substitutedSubject = part.slice(4);
      if (part.startsWith('optMath:')) {
        const val = part.slice(8);
        if (val === 'maths' || val === 'appliedMaths') mathChoice = val;
      }
    }
  } else if (parts[0] === 'elective') {
    for (const part of parts) {
      if (part.startsWith('math:')) {
        const val = part.slice(5);
        if (val === 'maths' || val === 'appliedMaths') mathChoice = val;
      }
    }
  }

  return { isBoardExam, substitutedSubject, mathChoice };
}

/**
 * Alias for decodeSubgroup (backward compat)
 */
export function decodeBoardExamSubgroup(subgroup: string | undefined | null): {
  isBoardExam: boolean;
  substitutedSubject: string | null;
  optionalMathChoice: 'maths' | 'appliedMaths' | null;
} {
  const result = decodeSubgroup(subgroup);
  return {
    isBoardExam: result.isBoardExam,
    substitutedSubject: result.substitutedSubject,
    optionalMathChoice: result.mathChoice,
  };
}

/**
 * Get human-readable label for a subject key
 */
export function getSubjectLabel(subjectKey: string | null | undefined): string {
  if (!subjectKey) return 'Unknown';
  const labels: Record<string, string> = {
    math: 'Mathematics',
    science: 'Science',
    ssc: 'SSC (Social Science)',
    english: 'English',
    hindi: 'Hindi',
    kannada: 'Kannada',
    evs: 'EVS',
    computer: 'Computer Science',
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
    pe: 'Physical Education',
    maths: 'Maths',
    appliedMaths: 'Applied Maths',
  };
  return labels[subjectKey] || subjectKey;
}

/**
 * Alias for getSubjectLabel (backward compat)
 */
export function getSubstitutedSubjectLabel(substitutedSubject: string): string {
  return getSubjectLabel(substitutedSubject);
}
