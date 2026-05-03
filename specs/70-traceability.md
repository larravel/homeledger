# Traceability Map

This file maps final requirements to implementation and validation evidence.

## Bills

- Requirement: create, edit, pay, and delete bills
- Frontend: `frontend/src/pages/BillsPage.tsx`, `frontend/src/styles/bills-page.css`
- Related shared visuals: `frontend/src/utils/itemVisual.ts`
- Validation: frontend typecheck

## Payment History

- Requirement: show settled payments clearly
- Frontend: `frontend/src/pages/PaymentHistoryPage.tsx`, `frontend/src/styles/payment-history.css`
- Validation: frontend typecheck

## Recurring Bills

- Requirement: create, edit, delete, and generate recurring bills
- Frontend: `frontend/src/pages/RecurringBillsPage.tsx`, `frontend/src/styles/recurring-bills.css`
- Backend: `backend/src/recurring-bills/*`
- Validation: backend tests, backend build, frontend typecheck

## Expenses

- Requirement: create, edit, delete, filter, and summarize expenses
- Frontend: `frontend/src/pages/ExpensesPage.tsx`, `frontend/src/styles/expenses-page.css`
- Backend: `backend/src/expenses/*`
- Validation: frontend typecheck, backend build

## Budgeting

- Requirement: manage category budgets with search/filter and category summaries
- Frontend: `frontend/src/pages/Budgeting.tsx`, `frontend/src/styles/budgeting-page.css`
- Shared visuals: `frontend/src/utils/itemVisual.ts`
- Validation: frontend typecheck

## Settings

- Requirement: save profile, change password, save preferences, apply dark mode, logout, delete account
- Frontend: `frontend/src/pages/SettingsPage.tsx`, `frontend/src/styles/settings-page.css`
- Backend: `backend/src/auth/*`, `backend/src/users/*`
- Validation: frontend typecheck, backend build

## Dashboard

- Requirement: show summary data, alerts, and preference-aware display
- Frontend: `frontend/src/pages/DashboardPage.tsx`, `frontend/src/styles/dashboard-page.css`
- Validation: frontend typecheck
