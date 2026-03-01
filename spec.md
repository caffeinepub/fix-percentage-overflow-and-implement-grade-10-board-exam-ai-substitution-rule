# Specification

## Summary
**Goal:** Fix the application error occurring in the live/production deployment so the app loads correctly for all users.

**Planned changes:**
- Fix runtime/initialization errors that cause the app to crash or show a blank screen in production
- Ensure the backend migration module (`migration.mo`) correctly transforms old `subgroup` field data to `scienceSubgroup` and `commerceSubgroup` fields during canister upgrade without trapping
- Add a loading indicator on the frontend while the backend actor is initializing
- Add a user-friendly error message if the backend cannot be reached, preventing blank/broken screens

**User-visible outcome:** The live app loads without errors for all users (authenticated and anonymous), all tabs render correctly, and any initialization issues display a friendly loading or error state instead of a blank screen.
