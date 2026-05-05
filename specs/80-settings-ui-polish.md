# Settings UI Polish Spec

Status: Accepted for implementation

## Feature Goal

Improve the final Settings page so it feels visually aligned with the rest of HomeLedger and is easier to review as a finished submission page.

## Scope

- Remove extra alert preference toggles from the Preferences panel.
- Keep dashboard alerts effectively enabled as part of the app behavior.
- Improve visual alignment between the right-column Settings panels.
- Redesign Account Actions into a cleaner premium panel.

## Non-Goals

- No backend behavior changes beyond existing settings actions.
- No new preferences will be added.
- No route or navigation changes.

## Requirements

- `REQ-SETTINGS-UI-001`: Preferences must show only the supported visible controls for currency, decimal places, date format, and theme.
- `REQ-SETTINGS-UI-002`: Account Actions must be presented as a reviewable premium panel, not a loose button row.
- `REQ-SETTINGS-UI-003`: The final layout must remain readable in both light mode and dark mode.
- `REQ-SETTINGS-UI-004`: Existing account actions must still work after the UI polish.

## Acceptance Criteria

- Preferences panel no longer shows bill reminder or expense alert toggles.
- Account Actions is rendered as its own polished section with clear logout and delete account actions.
- The Settings page remains typecheck-clean after the UI update.
