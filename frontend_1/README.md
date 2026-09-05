# PeoplePay360 — Person 1 Frontend (Ledger design)

Same scope, same functionality, same data as the first build — **Employee,
Contract, Attendance, Working Schedule** — restyled with a distinct visual
identity instead of the generic rounded-card SaaS look.

## Design concept: the register, not the dashboard
HR/payroll records are literally sequential ledger entries — employee #001,
contract #003, an attendance line for a given date. The design leans into
that instead of hiding it behind generic cards:

- **Rows, not cards.** Hairline dividers (`tokens.rule`) separate records;
  no soft drop-shadows.
- **Sequence numbers are real.** Every list shows a zero-padded record
  number, because these are actually numbered entries in a system of
  record, not decoration.
- **Status as a stamp.** `StatusBadge` renders a bordered, unfilled tag —
  like an ink stamp on a form — instead of a solid-color pill.
- **Oxblood is rare.** The one warm/red accent (`tokens.oxblood`) only
  appears on attendance corrections and contract-conflict warnings, so it
  stays meaningful instead of decorating everything.
- **Numbers are monospace.** Wages, hours, dates, and record counts use
  IBM Plex Mono with tabular figures, so columns of numbers actually line
  up — a payroll-specific choice, not a generic "data font."

## Type & color
- Headings: **Fraunces** (serif, loaded via Google Fonts in `index.html`)
- Numeric/data: **IBM Plex Mono**
- Body/UI: **IBM Plex Sans**
- Palette: paper `#EFEEE6`, ink `#1A2420`, forest `#2C5F44` (kept close to
  the original brand green for continuity with Person 2/3), oxblood
  `#8B3A2B` for warnings, slate `#3E5266` for neutral tags.

## Stack
React + `react-router-dom`, plain inline style objects driven by
`tokens.js` — no Tailwind, no CSS files, no component library.

## Run it
```bash
npm install
npm run dev
```

## Relationship to the first (green/panel) build
This is a self-contained alternative — same screens and logic, different
`tokens.js` and markup. Pick whichever fits your team's final direction
before merging into the shared app shell; don't run both in production at
once. If your team wants the panel/card look you already saw approved,
use the other zip instead.
