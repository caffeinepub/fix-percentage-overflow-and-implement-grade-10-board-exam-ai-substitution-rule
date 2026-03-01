# Specification

## Summary
**Goal:** Enhance four existing views in the Academic Progress Tracker — Combined Percentage, Nine Scale Grades, Subject Analysis, and Certificate — with improved calculations, per-subject/per-term breakdowns, richer statistics, and filter controls.

**Planned changes:**
- **Combined Percentage**: Compute an overall percentage per grade by summing all available adjusted term percentages and dividing by the number of distinct terms (2 or 3), displayed as a single "Overall %" per grade.
- **Nine Scale Grades**: Display a 9-point scale grade for every subject, per term, per grade level using the scale 90–100=9, 80–89=8, 70–79=7, 60–69=6, 50–59=5, 40–49=4, 30–39=3, 20–29=2, 0–19=1; results grouped/filterable by grade and term.
- **Subject Analysis**: Show per-subject statistics (average raw marks, average percentage, highest raw marks with percentage, lowest raw marks with percentage) across all grades, with grade and term filter dropdowns that update results reactively.
- **Certificate View**: Generate a certificate for each grade–term combination showing a computed percentage of (original term percentage + 94) / 2, with grade and term filter controls to narrow displayed certificates.

**User-visible outcome:** Users can view accurate overall percentages per grade, detailed 9-point subject grades per term, enriched subject analysis with highs/lows filterable by grade and term, and per-term certificates displaying the adjusted certificate percentage.
