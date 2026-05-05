# HomeLedger Household Billing Manager

HomeLedger is a full-stack household billing, expense, and budgeting management system.

The frontend is built with React + TypeScript + Vite, and the backend is built with NestJS + TypeORM + MySQL.

The system is designed to help manage:

- user login and authentication
- user registration
- bills and due dates
- bill payment history
- recurring bills
- expenses
- monthly budgets
- dashboard analytics
- account settings and preferences

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Axios
- Recharts
- Lucide React icons

### Backend

- NestJS
- TypeORM
- MySQL
- JWT authentication
- Passport JWT
- bcrypt
- class-validator

## Project Structure

```text
homeledger/
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- layouts/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- styles/
|   |   |-- utils/
|-- backend/
|   |-- src/
|   |   |-- auth/
|   |   |-- bills/
|   |   |-- expenses/
|   |   |-- payments/
|   |   |-- recurring-bills/
|   |   |-- reports/
|   |   |-- users/
|-- specs/
```

## Prerequisites

Before running the project, install these first:

- Node.js 18 or later
- npm
- MySQL Server

## Database Setup

The backend is configured in:

```text
backend/src/app.module.ts
```

It connects to MySQL using environment variables from:

```text
backend/.env
```

Required backend environment variables:

```text
DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_NAME=
JWT_SECRET=
JWT_EXPIRES_IN=
```

Create your database first in MySQL. Example:

```sql
CREATE DATABASE homeledger_db;
```

Then update `backend/.env` so the database name, username, and password match your local MySQL setup.

Note:

- The backend currently uses `synchronize: true`, so TypeORM will create and update tables automatically during development.
- Restart the backend after changing database-related entities so TypeORM can apply new columns.
- Do not commit real `.env` credentials to GitHub.

## Installation

Install dependencies separately for the frontend and backend.

### 1. Install frontend dependencies

```powershell
cd homeledger\frontend
npm install
```

### 2. Install backend dependencies

```powershell
cd homeledger\backend
npm install
```

## How To Run The Project

You need to run the backend and frontend in separate terminals.

### Run the backend

```powershell
cd homeledger\backend
npm run start:dev
```

Backend default URL:

```text
http://localhost:3000
```

### Run the frontend

```powershell
cd homeledger\frontend
npm run dev
```

Frontend default URL:

```text
http://localhost:5173
```

## How To Compile / Build

### Build the frontend

```powershell
cd homeledger\frontend
npm run build
```

This runs TypeScript build checks and creates a production Vite build.

### Build the backend

```powershell
cd homeledger\backend
npm run build
```

This compiles the NestJS backend.

## Current Routes

### Frontend routes

```text
/login
/register
/dashboard
/bills
/payments
/recurring-bills
/expenses
/budgeting
/settings
```

### Main backend API routes

Authentication:

```text
POST /auth/register
POST /auth/login
GET /auth/profile
PATCH /auth/profile
GET /auth/me
POST /auth/change-password
DELETE /auth/profile
```

Bills:

```text
GET /bills
POST /bills
GET /bills/:id
PATCH /bills/:id
DELETE /bills/:id
```

Payments:

```text
GET /payments
POST /payments/bill/:billId
```

Recurring bills:

```text
GET /recurring-bills
POST /recurring-bills
POST /recurring-bills/generate
GET /recurring-bills/generate
PATCH /recurring-bills/:id
DELETE /recurring-bills/:id
```

Expenses:

```text
GET /expenses
POST /expenses
PATCH /expenses/:id
DELETE /expenses/:id
```

Reports:

```text
GET /reports/dashboard
GET /reports/upcoming
GET /reports/overdue
```

User settings:

```text
GET /users/settings
PATCH /users/settings
```

## Feature Overview

Below is the development flow of the system and the intended purpose of each page.

### 1. Login Page

The login page is the entry point of the system. It allows a user to sign in using email and password. When login succeeds, the backend returns a JWT access token, and the frontend stores it in `localStorage`. This token is then used to access protected pages.

Main features:

- email and password form
- register link for new users
- backend authentication through `POST /auth/login`
- token storage in browser `localStorage`
- redirect to dashboard after successful login
- protection for private pages

### 2. Register Page

The register page lets a new user create an account before using the app.

Main features:

- full name, email, and password registration
- backend account creation through `POST /auth/register`
- validation before account creation
- redirect to login after successful registration

Why this matters:

- each user has private bills, expenses, budgets, and settings
- the system can separate data by authenticated account

### 3. Dashboard Page

The dashboard is the overview page of the whole system. It summarizes billing, expenses, upcoming bills, category distribution, and budget progress in one place.

Main features:

- total bills
- paid bills
- remaining bills
- upcoming bills
- expense and payment trend chart
- category distribution chart
- budget vs actual view
- active alert menu for due and overdue bills
- account menu with access to settings and logout

Why this matters:

- gives a quick snapshot of household financial status
- highlights upcoming and overdue bills
- helps the user review spending and budget progress quickly

### 4. Bills Page

The bills page manages household bills and due dates. It is where bill records are created, viewed, updated, deleted, and marked for payment.

Main features:

- load all bills from the backend
- add new bills
- edit bill details
- delete bills
- search and filter bills
- track paid, unpaid, overdue, and upcoming status
- support recurring bill details when needed
- pay a bill through the payment workflow

Why this matters:

- keeps bill records organized
- helps prevent missed due dates
- connects bills with payment history and dashboard analytics

### 5. Payment History Page

The payment history page records and displays completed bill payments.

Main features:

- list all payments from the backend
- group payments by month
- show payment amount, method, and bill details
- search payment records
- display monthly payment totals

Why this matters:

- gives a record of settled bills
- helps verify what has already been paid
- supports financial tracking over time

### 6. Recurring Bills Page

The recurring bills page manages bills that repeat on a schedule, such as rent, subscriptions, utilities, and loans.

Main features:

- create recurring bill templates
- edit recurring bill details
- delete recurring bill records
- generate bills from recurring records
- show recurring category mix and totals

Why this matters:

- reduces repeated manual entry
- helps keep monthly obligations consistent
- supports predictable household budgeting

### 7. Expenses Page

The expenses page records household spending outside regular bills.

Main features:

- add expense entries
- edit expenses
- delete expenses
- search and filter expense records
- show total spending
- show leading spending category
- display expenses by category

Why this matters:

- tracks daily and optional spending
- supports better budget decisions
- helps show where money is going

### 8. Budgeting Page

The budgeting page lets the user set monthly limits by category and compare those limits with actual spending.

Main features:

- add a budget category
- edit budget limits
- delete budget categories
- compare budgets against bills and expenses
- show paid/spent amount
- show unpaid bill amount
- calculate remaining available budget
- sync budget settings with the logged-in account

Why this matters:

- helps plan monthly spending
- shows when a category is near or over budget
- connects bills, expenses, and dashboard analytics

### 9. Settings Page

The settings page lets the logged-in user manage account information, password, preferences, and account actions.

Main features:

- update account name
- view login email
- change password
- save currency preference
- save decimal places preference
- save date format preference
- save theme preference
- sync preferences with the database
- logout
- delete account

Why this matters:

- improves account control and security
- lets the user personalize how financial data is displayed
- keeps preferences connected to the authenticated account

## Current Small Feature Spec

For the current software engineering exercise, the selected small feature is:

```text
Settings UI Polish And Account Preferences
```

Spec file:

```text
specs/80-settings-ui-polish.md
```

Related requirement IDs:

```text
REQ-SETTINGS-UI-001
REQ-SETTINGS-UI-002
REQ-SETTINGS-UI-003
REQ-SETTINGS-UI-004
```

Feature summary:

- show only supported preference controls
- keep dashboard alerts enabled as app behavior
- improve visual alignment of Settings panels
- present Account Actions as a polished section
- keep logout and delete account working

Implementation status:

- Settings page is available at `/settings`
- preferences can be saved from the Settings page
- preferences are cached locally and synced through `/users/settings`
- budgets are synced through account settings
- backend stores account preferences and budgets on the user record

## Spec-First Workflow For This Feature

Follow this order for the exercise:

1. Draft and review the spec in `specs/80-settings-ui-polish.md`
2. Mark the spec accepted before implementation
3. Implement backend account settings storage
4. Implement frontend settings API helpers
5. Build the Settings page UI
6. Connect budgets and preferences to account settings
7. Run verification commands
8. Review the diff before committing
9. Push focused commits to GitHub

## Git Workflow Commands

Use these commands as a copy-paste starting point:

```powershell
cd homeledger
git status
git checkout main
git pull origin main
```

For a new feature branch:

```powershell
git checkout -b feat/account-settings
```

Example focused commits used in this project:

```text
feat: store account settings in database
feat: add account settings page
feat: sync budgets with account settings
chore: remove unused utility and topbar code
style: polish sidebar navigation
style: improve bills and payment layouts
style: polish expense tracking page
docs: add settings polish specification
chore: ignore generated project files
```

After reviewing and testing:

```powershell
git status
git diff
git add README.md
git commit -m "docs: expand project README"
git push origin main
```

Suggested PR or submission references:

```text
Spec: specs/80-settings-ui-polish.md
Requirements: REQ-SETTINGS-UI-001 to REQ-SETTINGS-UI-004
```

## Suggested Development Order

The chosen development order follows the actual flow of household finance management:

1. Login
2. Register
3. Bills
4. Payments
5. Recurring Bills
6. Expenses
7. Budgeting
8. Dashboard
9. Settings

This order makes sense because:

- login and registration secure the app first
- bills are the core records of the system
- payments depend on existing bills
- recurring bills extend bill creation
- expenses add non-bill spending
- budgeting depends on bills and expenses
- dashboard is best built after core data pages already exist
- settings can be added after authentication is working

## Testing

### Frontend

```powershell
cd homeledger\frontend
npm run build
```

### Backend

```powershell
cd homeledger\backend
npm run build
npm test
```

## Notes

- The frontend API service points to `http://localhost:3000`.
- CORS is enabled in the NestJS backend for `http://localhost:5173`.
- Protected frontend pages depend on a stored JWT token.
- `localStorage` is used for the JWT token and as a fallback cache for preferences.
- The database remains the main persistent storage for bills, expenses, payments, recurring bills, users, budgets, and account settings.
- Generated folders and files such as `node_modules`, `dist`, and `*.tsbuildinfo` are ignored by Git.

## Future Improvements

Possible next improvements for this project:

- add stronger input validation for every form
- add migrations instead of relying on `synchronize: true`
- add role-based access if multiple household members are supported
- improve report filters by month and year
- add downloadable or printable reports
- add email or notification reminders
- add more automated frontend tests
- improve dashboard chart code splitting

## Author Notes

HomeLedger is built step by step around real household finance workflows. The goal is not only to store data, but to help users review bills, track payments, manage recurring obligations, monitor expenses, set budgets, and adjust account settings in one connected system.
