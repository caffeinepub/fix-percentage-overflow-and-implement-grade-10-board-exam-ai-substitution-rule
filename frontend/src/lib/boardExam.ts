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
 *
 * @param math Math marks
 * @param science Science marks
 * @param ssc SSC (Social Science) marks
 * @param ai AI marks
 * @returns Effective total for the three core subjects (with AI substitution if beneficial)
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

  // Only substitute if AI is better than the lowest core subject
  if (ai > minValue) {
    // Find which subject has the minimum value
    let substitutedSubject = 'math';
    if (coreSubjects.science === minValue) substitutedSubject = 'science';
    else if (coreSubjects.ssc === minValue) substitutedSubject = 'ssc';

    return {
      total: coreTotal - minValue + ai,
      substitutedSubject,
    };
  }

  // AI doesn't improve the total, use original core subjects
  return { total: coreTotal, substitutedSubject: null };
}

/**
 * Calculate Grade 10 board exam total with AI substitution
 *
 * @param marks Object containing all subject marks
 * @returns Object with boardExamTotal, maxMarks (always 500 for Grade 10), and substitution info
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

  // Calculate effective core total with AI substitution
  const { total: coreTotal, substitutedSubject } = calculateGrade10CoreTotal(math, science, ssc, ai);

  // Total = English + Kannada + effective core total (3 subjects)
  const boardExamTotal = english + kannada + coreTotal;

  // Max marks is always 5 subjects × 100 (English, Kannada, and 3 core subjects)
  const maxMarks = 500;

  return { boardExamTotal, maxMarks, substitutedSubject };
}
