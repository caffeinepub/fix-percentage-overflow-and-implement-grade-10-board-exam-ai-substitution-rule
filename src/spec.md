# Specification

## Summary
**Goal:** Correct per-subject percentage calculations by storing and using grade-wise per-subject maximum marks (e.g., Grade 9 regular subjects out of 80) instead of mistakenly using term total maximum marks.

**Planned changes:**
- Backend: Fix AcademicEntry persistence so `maxMarksPerSubject` stores the grade-wise regular-subject maximum (not `termMaxMarks`), and ensure `computerMaxMarks` / `aiMaxMarks` are saved from the incoming input values without being overwritten by unrelated logic.
- Backend: Add a conditional migration to detect and normalize previously saved entries where `maxMarksPerSubject` was incorrectly stored (e.g., set to a term total), updating to the correct grade-wise per-subject maximums.
- Frontend: Update Progress View per-subject percentage calculation to use the correct maximum basis per subject (`entry.maxMarksPerSubject` for regular subjects, `entry.computerMaxMarks` for Computer, `entry.aiMaxMarks` for AI) with a consistent fallback for missing/zero max values.

**User-visible outcome:** In Progress View, per-subject percentages display correctly (e.g., Grade 9 Maths 68/80 shows 85.0% instead of a much lower incorrect percentage), including for older entries after normalization.
