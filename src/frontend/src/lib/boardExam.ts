/**
 * Board exam calculation utilities
 */

/**
 * Grade 10 board exam AI substitution logic
 * AI can substitute for the lowest of Math/Science/Social only if it improves the total
 * 
 * @param math Math marks
 * @param science Science marks
 * @param social Social marks
 * @param ai AI marks
 * @returns Effective total for the three core subjects (with AI substitution if beneficial)
 */
export function calculateGrade10CoreTotal(
  math: number,
  science: number,
  social: number,
  ai: number
): number {
  const coreSubjects = [math, science, social];
  const coreTotal = math + science + social;
  const minCore = Math.min(...coreSubjects);
  
  // Only substitute if AI is better than the lowest core subject
  if (ai > minCore) {
    // Replace the lowest core subject with AI
    return coreTotal - minCore + ai;
  }
  
  // AI doesn't improve the total, use original core subjects
  return coreTotal;
}

/**
 * Calculate Grade 10 board exam total with AI substitution
 * 
 * @param marks Object containing all subject marks
 * @returns Object with boardExamTotal and maxMarks (always 500 for Grade 10)
 */
export function calculateGrade10BoardExam(marks: {
  english: number;
  kannada: number;
  math: number;
  science: number;
  social: number;
  ai: number;
}): { boardExamTotal: number; maxMarks: number } {
  const { english, kannada, math, science, social, ai } = marks;
  
  // Calculate effective core total with AI substitution
  const coreTotal = calculateGrade10CoreTotal(math, science, social, ai);
  
  // Total = English + Kannada + effective core total (3 subjects)
  const boardExamTotal = english + kannada + coreTotal;
  
  // Max marks is always 5 subjects × 100 (English, Kannada, and 3 core subjects)
  const maxMarks = 500;
  
  return { boardExamTotal, maxMarks };
}
