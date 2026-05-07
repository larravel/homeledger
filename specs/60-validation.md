# Validation Evidence

Validated on: 2026-05-07

## Commands Run

### Backend build

```powershell
cd backend
$env:NODE_OPTIONS='--max-old-space-size=4096'
npm.cmd run build
```

Result: Passed

### Backend unit tests

```powershell
cd backend
npm.cmd test -- --runInBand
```

Result: Passed

### Frontend production build

```powershell
cd frontend
$env:NODE_OPTIONS='--max-old-space-size=4096'
npm.cmd run build
```

Result: Passed

## Notes

- The recurring bills controller and service specs were updated to use mocked dependencies so the backend test suite is now reviewable and repeatable.
- Frontend and backend builds were run sequentially with `NODE_OPTIONS=--max-old-space-size=4096` to avoid local Node memory limits during compilation.
- The frontend build completed with Vite's large chunk warning. This is a performance/code-splitting improvement note, not a failed build.
- Validation evidence here is intentionally command-based so a reviewer can rerun it.
