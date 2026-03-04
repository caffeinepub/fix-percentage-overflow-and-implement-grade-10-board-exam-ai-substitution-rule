/**
 * Grade-wise max marks configuration.
 *
 * Rules:
 * - Computer: 20 marks for grades 1–7, 30 marks for grade 8, not available for grades 9+
 * - EVS: only for grades 1–2
 * - Kannada: only for grades 5–10 (not grades 1–4)
 * - Science/SSC: grades 3–10
 * - AI: grades 9–10
 * - Board exam (grades 10, 12): 100 marks per subject
 * - Maths / Applied Maths: elective for grades 11–12 Commerce only
 * - PE: elective for grades 11–12
 */

export interface SubjectConfig {
  name: string;
  key: string;
  maxMarks: number;
}

export interface MaxMarksConfig {
  regularSubjectMax: number;
  computerMax: number;
  aiMax: number;
}

/**
 * Get the max marks for Computer Science based on grade.
 * - Grades 1–7: 20 marks
 * - Grade 8: 30 marks
 * - Grades 9+: 0 (not offered)
 */
export function getComputerMaxMarks(grade: number): number {
  if (grade >= 1 && grade <= 7) return 20;
  if (grade === 8) return 30;
  return 0;
}

/**
 * Get max marks configuration for a grade (used by legacy code).
 */
export function getMaxMarksConfig(
  grade: number,
  isBoardExam = false,
): MaxMarksConfig {
  if (isBoardExam && (grade === 10 || grade === 12)) {
    return { regularSubjectMax: 100, computerMax: 100, aiMax: 100 };
  }

  const computerMax = getComputerMaxMarks(grade);

  if (grade >= 1 && grade <= 2) {
    return { regularSubjectMax: 30, computerMax, aiMax: 0 };
  }
  if (grade >= 3 && grade <= 4) {
    return { regularSubjectMax: 50, computerMax, aiMax: 0 };
  }
  if (grade >= 5 && grade <= 7) {
    return { regularSubjectMax: 60, computerMax, aiMax: 0 };
  }
  if (grade === 8) {
    return { regularSubjectMax: 80, computerMax, aiMax: 0 };
  }
  if (grade === 9) {
    return { regularSubjectMax: 80, computerMax: 0, aiMax: 50 };
  }
  if (grade === 10) {
    return { regularSubjectMax: 80, computerMax: 0, aiMax: 50 };
  }
  if (grade >= 11 && grade <= 12) {
    return { regularSubjectMax: 80, computerMax: 0, aiMax: 0 };
  }

  return { regularSubjectMax: 100, computerMax: 100, aiMax: 0 };
}

/**
 * Get the authoritative max marks for a specific subject key and grade.
 * This is the single source of truth — does NOT rely on stored entry values.
 *
 * Rules:
 * - Computer: grades 1–7 = 20, grade 8 = 30, grades 9+ = 0
 * - AI: grades 9–10 (non-board-exam) = 50, grade 10 board exam = 100, grades 11+ = 0
 * - All other subjects: use grade-based regular max
 */
export function getExpectedMaxMarksForSubjectKey(
  subjectKey: string,
  grade: number,
  term: number,
): number {
  const isBoardExam = (grade === 10 || grade === 12) && term >= 8;

  if (subjectKey === "computer") {
    return getComputerMaxMarks(grade);
  }

  if (subjectKey === "ai") {
    if (grade === 9) return 50;
    if (grade === 10) return isBoardExam ? 100 : 50;
    return 0;
  }

  const config = getMaxMarksConfig(grade, isBoardExam);
  return config.regularSubjectMax;
}

/**
 * Get the list of subjects for a given grade/stream/options.
 */
export function getSubjectsForGrade(
  grade: number,
  stream?: string,
  isBoardExam?: boolean,
  electiveMath?: "maths" | "appliedMaths" | null,
): SubjectConfig[] {
  const config = getMaxMarksConfig(grade, isBoardExam);
  const max = config.regularSubjectMax;
  const computerMax = config.computerMax;
  const aiMax = config.aiMax;

  // Grades 11–12
  if (grade >= 11) {
    const fields: SubjectConfig[] = [
      { name: "English", key: "english", maxMarks: max },
    ];

    if (stream === "Science") {
      fields.push({ name: "Physics", key: "physics", maxMarks: max });
      fields.push({ name: "Chemistry", key: "chemistry", maxMarks: max });
      fields.push({ name: "Mathematics", key: "math", maxMarks: max });
      fields.push({ name: "Biology", key: "biology", maxMarks: max });
    } else if (stream === "Commerce") {
      fields.push({
        name: "Business Studies",
        key: "businessStudies",
        maxMarks: max,
      });
      fields.push({ name: "Economics", key: "economics", maxMarks: max });
      fields.push({ name: "Accountancy", key: "accountancy", maxMarks: max });

      // Maths / Applied Maths as mutually exclusive elective (non-board-exam)
      if (!isBoardExam) {
        if (electiveMath === "maths") {
          fields.push({ name: "Maths", key: "maths", maxMarks: max });
        } else if (electiveMath === "appliedMaths") {
          fields.push({
            name: "Applied Maths",
            key: "appliedMaths",
            maxMarks: max,
          });
        }
      } else {
        // Board exam Commerce: Maths or Applied Maths
        if (electiveMath === "appliedMaths") {
          fields.push({
            name: "Applied Maths",
            key: "appliedMaths",
            maxMarks: max,
          });
        } else {
          fields.push({ name: "Maths", key: "maths", maxMarks: max });
        }
      }
    } else if (stream === "Arts") {
      fields.push({
        name: "History & Political Science",
        key: "ssc",
        maxMarks: max,
      });
      fields.push({ name: "Psychology", key: "psychology", maxMarks: max });
      fields.push({ name: "Economics", key: "economics", maxMarks: max });
    }

    // PE as elective for grades 11–12
    fields.push({
      name: "Physical Education (Elective)",
      key: "pe",
      maxMarks: max,
    });

    return fields;
  }

  // Grade 10
  if (grade === 10) {
    return [
      { name: "English", key: "english", maxMarks: max },
      { name: "Mathematics", key: "math", maxMarks: max },
      { name: "Science", key: "science", maxMarks: max },
      { name: "SSC (Social Science)", key: "ssc", maxMarks: max },
      { name: "Kannada", key: "kannada", maxMarks: max },
      { name: "AI", key: "ai", maxMarks: isBoardExam ? max : aiMax || max },
    ];
  }

  // Grade 9
  if (grade === 9) {
    return [
      { name: "English", key: "english", maxMarks: max },
      { name: "Mathematics", key: "math", maxMarks: max },
      { name: "Science", key: "science", maxMarks: max },
      { name: "SSC (Social Science)", key: "ssc", maxMarks: max },
      { name: "Kannada", key: "kannada", maxMarks: max },
      { name: "AI", key: "ai", maxMarks: aiMax || max },
    ];
  }

  // Grades 5–8
  if (grade >= 5 && grade <= 8) {
    return [
      { name: "English", key: "english", maxMarks: max },
      { name: "Mathematics", key: "math", maxMarks: max },
      { name: "Hindi", key: "hindi", maxMarks: max },
      { name: "Kannada", key: "kannada", maxMarks: max },
      { name: "Science", key: "science", maxMarks: max },
      { name: "SSC (Social Science)", key: "ssc", maxMarks: max },
      { name: "Computer Science", key: "computer", maxMarks: computerMax },
    ];
  }

  // Grades 3–4
  if (grade >= 3 && grade <= 4) {
    return [
      { name: "English", key: "english", maxMarks: max },
      { name: "Mathematics", key: "math", maxMarks: max },
      { name: "Hindi", key: "hindi", maxMarks: max },
      { name: "Science", key: "science", maxMarks: max },
      { name: "SSC (Social Science)", key: "ssc", maxMarks: max },
      { name: "Computer Science", key: "computer", maxMarks: computerMax },
    ];
  }

  // Grades 1–2
  return [
    { name: "English", key: "english", maxMarks: max },
    { name: "Mathematics", key: "math", maxMarks: max },
    { name: "Hindi", key: "hindi", maxMarks: max },
    { name: "EVS (Environmental Studies)", key: "evs", maxMarks: max },
    { name: "Computer Science", key: "computer", maxMarks: computerMax },
  ];
}

/**
 * Calculate total max marks for a term based on active subjects.
 */
export function calculateTermMaxMarks(
  subjectKeys: string[],
  grade: number,
  isBoardExam = false,
): number {
  const config = getMaxMarksConfig(grade, isBoardExam);
  return subjectKeys.reduce((total, key) => {
    if (key === "computer") return total + config.computerMax;
    if (key === "ai") return total + config.aiMax;
    return total + config.regularSubjectMax;
  }, 0);
}

/**
 * Get stored max marks values to pass to backend.
 */
export function getStoredMaxMarks(
  grade: number,
  isBoardExam = false,
): { computerMaxMarks: number; aiMaxMarks: number } {
  const config = getMaxMarksConfig(grade, isBoardExam);
  return {
    computerMaxMarks: config.computerMax,
    aiMaxMarks: config.aiMax,
  };
}

/**
 * Check if a grade is a board exam grade.
 */
export function isBoardExamGrade(grade: number): boolean {
  return grade === 10 || grade === 12;
}
