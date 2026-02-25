# Specification

## Summary
**Goal:** Enhance the School Report Card analytics with frequency polygon charts, grade/subject statistics, a nine-point grading scale tab, and a corrected dynamic combined percentage calculation.

**Planned changes:**
- Add a frequency polygon chart in the View Progress tab plotting original percentage score distribution per grade-term combination, with class intervals (0–10, 10–20, …, 90–100) on the X-axis and frequency on the Y-axis
- Display average percentage summary per grade in the View Progress tab, updating with grade/term filters
- In the Subject Analysis tab, show average raw marks alongside average percentage for each subject
- In the Subject Analysis tab, add highest and lowest raw marks and highest and lowest percentage per subject, filterable by grade and term
- Add/update a Nine Grading System tab showing the 9-scale grade (1–9) per subject per term per grade using the scale: 90–100=9, 80–89=8, 70–79=7, 60–69=6, 50–59=5, 40–49=4, 30–39=3, 20–29=2, 0–19=1
- Fix the Combined Percentage calculation to dynamically average the calculated percentages of all available terms (sum of term percentages divided by 2 or 3 depending on whether Term 3 exists), replacing the old hardcoded formula

**User-visible outcome:** Users can view frequency polygon distributions and per-grade averages in View Progress, see richer subject stats (raw mark averages, highs, lows) filterable by grade and term in Subject Analysis, browse nine-point scale grades per subject per term in the Nine Grading System tab, and see a correctly computed combined percentage that accounts for all available terms.
