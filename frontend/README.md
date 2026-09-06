# PeoplePay360 — Full Frontend (Ledger design)

Complete frontend, every module, wired to your real Django backend —
no hardcoded/sample data, no simulated login. Built on the "ledger"
design system: HR/payroll records treated as sequential entries in a
register (numbered rows, hairline dividers, stamp-style status badges,
monospace figures), not generic dashboard cards.

## Design
- Headings: **Fraunces** (serif) · Numbers: **IBM Plex Mono** · Body: **IBM Plex Sans**
- Palette: paper `#EFEEE6`, ink `#1A2420`, forest `#2C5F44` (positive/active),
  oxblood `#8B3A2B` (warnings/negative), amber `#95672A` (pending/draft),
  slate `#3E5266` (neutral tags)
- Everything lives in `src/tokens.js` — plain JS style objects, no
  Tailwind, no CSS files, no component library, matching the original
  reference's stated approach.
- `src/components/StatusBadge.jsx` is the single source of truth for
  every status color across every module.

## Stack
Vite + React + `react-router-dom`. Real JWT auth against your Django
`SimpleJWT` endpoint — not the placeholder role-picker from earlier
drafts.

## Run it

```bash
npm install
npm run dev
```

Make sure your Django backend is running first:
```bash
cd ../backend
python manage.py runserver
```

`.env` already points at `http://localhost:8000/api` — change
`VITE_API_BASE_URL` if your backend runs elsewhere.

Log in with your real Django superuser (or any account created via
User Management).

## What's included — every module, wired to a real, tested endpoint

| Module | Screens | Backend app |
|---|---|---|
| Employees | List, detail (Info/Contracts/Attendance/Time off tabs, History) | `core` |
| Contracts | List + create (real overlap-validation error surfaced) | `core` |
| Attendance | List (filterable by employee) + log entry | `core` |
| Working Schedules | Per-employee weekly grid, computed total hours | `core` |
| Time Off | Types, Allocations, Requests (real approve/refuse) | `timeoff` |
| Payroll Dashboard | Live KPIs, cost-by-department & monthly trend bars, alerts | `dashboard` |
| Payruns | List + real 2-step wizard, Compute, PDF download, Send payslips | `payroll` |
| Salary Structures / Rules | List + create | `payroll` |
| User Management | List + create user with role | `accounts` |
| Settlements | Auto-generated settlement records | `settlement` |
| Notifications | Bell in header, real unread count, mark-read | `notifications` |
| Audit history | Reusable `AuditTab` — dropped into Employee and Payrun detail | `audit` |

## Notes on a few real-world mismatches, handled deliberately

- **Working Schedule** here is per-employee, per-day-of-week — matching
  your actual `core.Schedule` model. (An earlier draft assumed shared
  named "templates" like "Standard 40h" — that's not what the backend
  stores, so this version reflects the real schema instead.)
- **Employee status** is a simple Active/Inactive boolean on the
  backend, not a staged Onboarding/Active/Offboarding pipeline — the
  badge reflects that; extending to a staged status is a backend
  model change if you want the fuller mockup-style Kanban later.
- **`AuditTab`** only shows history for models actually wired into the
  backend's `audit/signals.py` (`SalaryRule`, `SalaryStructure`,
  `Payrun`, `Payslip`, `Contract`). It'll show "No recorded changes"
  for `Employee` until that model is added to the tracked list.

## Extending

Add a new screen by: writing the screen in `src/screens/`, adding its
API calls to the relevant `src/api/*.js` file if not already there,
and adding a route in `App.jsx` + a nav link in `Layout.jsx`.
