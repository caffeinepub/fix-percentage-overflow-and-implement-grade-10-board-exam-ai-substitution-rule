/**
 * Shared grade-wise maximum marks rules
 * 
 * Rules:
 * - Grades 1-2: Regular subjects 30 marks, Computer 20 marks
 * - Grades 3-4: Regular subjects 50 marks, Computer 20 marks
 * - Grades 5-7: Regular subjects 60 marks, Computer 20 marks
 * - Grade 8: Regular subjects 80 marks, Computer 30 marks
 * - Grade 9: Regular subjects 80 marks, AI 50 marks (Computer not offered)
 * - Grade 10: Regular subjects 80 marks, AI 50 marks (term entries); Board exam: 100 per subject
 * - Grades 11-12: 80 marks per subject (term entries); Board exam: 100 per subject
 */

export interface MaxMarksConfig {
  regularSubjectMax: number;
  computerMax: number;
  aiMax: number;
}

/**
 * Get maximum marks configuration for a grade and term
 * @param grade Grade level (1-12)
 * @param isBoardExam Whether this is a board exam entry
 * @returns Configuration object with max marks for different subject types
 */
export function getMaxMarksConfig(grade: number, isBoardExam: boolean = false): MaxMarksConfig {
  // Board exams always use 100 marks per subject
  if (isBoardExam && (grade === 10 || grade === 12)) {
    return {
      regularSubjectMax: 100,
      computerMax: 100,
      aiMax: 100,
    };
  }

  // Grade-wise rules for term entries
  if (grade >= 1 && grade <= 2) {
    return {
      regularSubjectMax: 30,
      computerMax: 20,
      aiMax: 0,
    };
  } else if (grade >= 3 && grade <= 4) {
    return {
      regularSubjectMax: 50,
      computerMax: 20,
      aiMax: 0,
    };
  } else if (grade >= 5 && grade <= 7) {
    return {
      regularSubjectMax: 60,
      computerMax: 20,
      aiMax: 0,
    };
  } else if (grade === 8) {
    return {
      regularSubjectMax: 80,
      computerMax: 30,
      aiMax: 0,
    };
  } else if (grade === 9) {
    return {
      regularSubjectMax: 80,
      computerMax: 0, // Computer not offered in Grade 9
      aiMax: 50,
    };
  } else if (grade === 10) {
    return {
      regularSubjectMax: 80,
      computerMax: 0, // Computer not offered in Grade 10 term entries
      aiMax: 50,
    };
  } else if (grade >= 11 && grade <= 12) {
    return {
      regularSubjectMax: 80,
      computerMax: 80,
      aiMax: 0,
    };
  }

  // Fallback
  return {
    regularSubjectMax: 100,
    computerMax: 100,
    aiMax: 0,
  };
}

/**
 * Get maximum marks for a specific subject
 * @param subject Subject name
 * @param grade Grade level
 * @param isBoardExam Whether this is a board exam entry
 * @returns Maximum marks for the subject
 */
export function getMaxMarksForSubject(subject: string, grade: number, isBoardExam: boolean = false): number {
  const config = getMaxMarksConfig(grade, isBoardExam);

  if (subject === 'Computer') {
    return config.computerMax;
  } else if (subject === 'AI') {
    return config.aiMax;
  } else {
    return config.regularSubjectMax;
  }
}

/**
 * Calculate term maximum marks based on active subjects
 * @param subjects Array of active subject names
 * @param grade Grade level
 * @param isBoardExam Whether this is a board exam entry
 * @returns Total maximum marks for the term
 */
export function calculateTermMaxMarks(subjects: string[], grade: number, isBoardExam: boolean = false): number {
  return subjects.reduce((total, subject) => {
    return total + getMaxMarksForSubject(subject, grade, isBoardExam);
  }, 0);
}

/**
 * Get stored max marks values to pass to backend
 * @param grade Grade level
 * @param isBoardExam Whether this is a board exam entry
 * @returns Object with computerMaxMarks and aiMaxMarks for backend storage
 */
export function getStoredMaxMarks(grade: number, isBoardExam: boolean = false): {
  computerMaxMarks: number;
  aiMaxMarks: number;
} {
  const config = getMaxMarksConfig(grade, isBoardExam);
  return {
    computerMaxMarks: config.computerMax,
    aiMaxMarks: config.aiMax,
  };
}

/**
 * Get expected per-subject maximum marks for a backend subject key based on grade
 * Used as fallback when stored max marks are missing or invalid
 * @param subjectKey Backend subject key (e.g., 'math', 'computer', 'ai')
 * @param grade Grade level
 * @param term Term number (used to detect board exam entries)
 * @returns Expected maximum marks for the subject
 */
export function getExpectedMaxMarksForSubjectKey(
  subjectKey: string,
  grade: number,
  term: number
): number {
  // Detect board exam entries (Grade 10 term 8+, Grade 12 term 8+)
  const isBoardExam = (grade === 10 || grade === 12) && term >= 8;
  
  const config = getMaxMarksConfig(grade, isBoardExam);

  if (subjectKey === 'computer') {
    return config.computerMax;
  } else if (subjectKey === 'ai') {
    return config.aiMax;
  } else {
    // All other subjects are regular subjects
    return config.regularSubjectMax;
  }
}
