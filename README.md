# HomeLedger

HomeLedger is a household billing and expense manager built with a React frontend and a NestJS backend. The final scope of this submission is a coherent personal finance workflow centered on six main areas:

- Dashboard
- Bills
- Payment History
- Recurring Bills
- Expenses
- Budgeting
- Settings

## What This Project Demonstrates

This repository is organized to show reviewable evidence of:

- documented scope and acceptance criteria in [`specs/`](./specs)
- traceable implementation in `frontend/src/pages`, `frontend/src/styles`, and `backend/src`
- repeatable validation commands
- visible iteration through focused commits
- responsible AI-assisted development with human review

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: NestJS, TypeScript, TypeORM, MySQL
- Testing: Jest for backend unit tests

## Run The Project

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

### Backend

```powershell
cd backend
npm install
npm run start:dev
```

The backend expects database environment variables for MySQL before full login and CRUD behavior can run.

## Validation Commands

These commands were used as repeatable validation evidence for the final submission:

```powershell
cd frontend
npx tsc --noEmit --project tsconfig.app.json

cd ../backend
npm run build
npm test -- --runInBand
```

See [`specs/60-validation.md`](./specs/60-validation.md) for the validated state and notes.

## Submission Focus

This project intentionally prioritizes:

- clear page workflows
- coherent UI across pages
- traceable repo evidence
- validation that can be rerun by a reviewer

It does not try to maximize feature count at the cost of clarity or reviewability.
