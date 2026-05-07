# Submission Reflection

## Final Submission Strategy

This submission focused on one coherent finance workflow instead of trying to maximize feature count. The main goal was to keep the final repository reviewable and aligned with the actual app state on `main`.

## What Changed During Finalization

- Main pages were stabilized into dedicated page stylesheets.
- Shared formatting and dark-mode behavior were cleaned up.
- Settings was made functional for account updates, password changes, preferences, logout, and delete account.
- Account preferences and budgets were connected to the backend database through user settings.
- Unused utility usage and topbar code were removed from the final scope.
- The README was expanded so the reviewer can see setup steps, routes, feature overview, and workflow evidence.
- Backend recurring bill tests were upgraded from broken placeholders to mocked unit tests that pass.

## Responsible AI Use

AI was used as a coding assistant for:

- UI iteration
- refactoring page structure
- drafting and refining CSS
- identifying test and validation gaps

Human judgment was used to:

- choose final scope
- reject or revise weak UI directions
- verify commands locally
- correct mismatches between intended behavior and implementation
- decide what evidence needed to be visible in the repository
- keep extra feature ideas out when they would not improve the grading evidence

## What I Would Improve Next

- Add stronger behavior-focused tests beyond the current recurring bill unit tests
- Add end-to-end validation for the highest-risk user flows
- Add database migrations instead of relying on TypeORM `synchronize: true`
- Split the largest frontend bundle into smaller chunks if performance becomes a grading or deployment concern
