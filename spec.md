# Academic Progress App

## Current State

The app tracks marks across grades 1–12 with nine-scale grading, subject analysis, combined percentages, and frequency polygons. Subject max marks per grade are defined in `src/frontend/src/lib/maxMarks.ts` and the backend `main.mo`.

Current issues identified:
- In `main.mo`, `computerMaxMarks` is overridden to 80 and `aiMaxMarks` to 25 for grade 10 board exam — both incorrect.
- `getExpectedMaxMarksForSubjectKey` for grade 10 (non-board-exam) returns `aiMax: 50` correctly, but the stored `aiMaxMarks` in the backend entry may be wrong (25) for board-exam terms.
- Nine-scale grading and subject analysis both rely on `entry.computerMaxMarks` and `entry.aiMaxMarks` stored fields, which may be incorrect for some entries.
- The `getMaxMarksConfig` for grades 11–12 sets `computerMax: 80` — but computer is not offered in grades 9+ (should be 0).

## Requested Changes (Diff)

### Add
- Nothing new to add.

### Modify
- **`src/frontend/src/lib/maxMarks.ts`**: Fix `getExpectedMaxMarksForSubjectKey` to always derive correct max marks from grade rules directly, ignoring stored values for computer and AI. Specifically:
  - Computer: grades 1–7 = 20, grade 8 = 30, grades 9+ = 0
  - AI: grades 9–10 = 50 (non-board-exam), board exam grade 10 = 100, grades 11+ = 0
- **`src/frontend/src/components/NineScaleGradesView.tsx`**: Use the corrected `getExpectedMaxMarksForSubjectKey` as the authoritative source for computer and AI max marks (do not fall back to stored entry values which may be wrong).
- **`src/frontend/src/lib/subjectAnalysis.ts`**: Same fix — use `getExpectedMaxMarksForSubjectKey` authoritatively for computer and AI, not stored entry values.
- **`src/backend/main.mo`**: Fix incorrect override of `computerMaxMarks` (was 80) and `aiMaxMarks` (was 25) for grade 10 board exam. Computer should be 0 for grade 10+; AI board exam for grade 10 = 100, otherwise AI for grade 9–10 = 50.

### Remove
- Nothing to remove.

## Implementation Plan

1. Fix `getMaxMarksConfig` in `maxMarks.ts`: grades 11–12 should have `computerMax: 0` (not 80), since computer is not offered in grades 9+.
2. Fix `getExpectedMaxMarksForSubjectKey` to always return correct values: use grade-based lookup without relying on stored entry fields.
3. Fix `NineScaleGradesView.tsx`: remove the override that reads `entry.computerMaxMarks` / `entry.aiMaxMarks` — always use `getExpectedMaxMarksForSubjectKey`.
4. Fix `subjectAnalysis.ts` `getSubjectMaxMarks`: same — always use `getExpectedMaxMarksForSubjectKey` authoritatively.
5. Fix `main.mo` backend: remove incorrect board-exam overrides for `computerMaxMarks` and `aiMaxMarks` (lines 390–396); use `input.computerMaxMarks` and `input.aiMaxMarks` directly as passed from frontend (which already computes correct values).
