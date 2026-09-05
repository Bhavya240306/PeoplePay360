// Representative sample data shared across screens so Contracts,
// Attendance and Schedules all cross-reference the same Employee records.
// Replace with live API data once the backend endpoints in api.js are wired up.

export const sampleSchedules = [
  {
    id: 1,
    name: "Standard 40h",
    type: "Full-time",
    pattern: [
      { day: "Mon", start: "09:00", end: "18:00", breakMins: 60 },
      { day: "Tue", start: "09:00", end: "18:00", breakMins: 60 },
      { day: "Wed", start: "09:00", end: "18:00", breakMins: 60 },
      { day: "Thu", start: "09:00", end: "18:00", breakMins: 60 },
      { day: "Fri", start: "09:00", end: "18:00", breakMins: 60 },
    ],
  },
  {
    id: 2,
    name: "Part-time Mornings",
    type: "Part-time",
    pattern: [
      { day: "Mon", start: "09:00", end: "13:00", breakMins: 0 },
      { day: "Tue", start: "09:00", end: "13:00", breakMins: 0 },
      { day: "Wed", start: "09:00", end: "13:00", breakMins: 0 },
      { day: "Thu", start: "09:00", end: "13:00", breakMins: 0 },
      { day: "Fri", start: "09:00", end: "13:00", breakMins: 0 },
    ],
  },
  {
    id: 3,
    name: "Field Staff Rotational",
    type: "Full-time",
    pattern: [
      { day: "Mon", start: "08:00", end: "17:00", breakMins: 45 },
      { day: "Tue", start: "08:00", end: "17:00", breakMins: 45 },
      { day: "Wed", start: "08:00", end: "17:00", breakMins: 45 },
      { day: "Thu", start: "08:00", end: "17:00", breakMins: 45 },
      { day: "Fri", start: "08:00", end: "17:00", breakMins: 45 },
      { day: "Sat", start: "08:00", end: "13:00", breakMins: 0 },
    ],
  },
];

export function scheduleWeeklyHours(schedule) {
  const totalMins = schedule.pattern.reduce((sum, d) => {
    const [sh, sm] = d.start.split(":").map(Number);
    const [eh, em] = d.end.split(":").map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm) - d.breakMins;
    return sum + Math.max(mins, 0);
  }, 0);
  return Math.round((totalMins / 60) * 10) / 10;
}

export const sampleEmployees = [
  {
    id: 1,
    name: "Aarav Shah",
    email: "aarav.shah@peoplepay360.com",
    jobPosition: "Software Engineer",
    department: "Engineering",
    manager: "R. Mehta",
    scheduleId: 1,
    status: "Active",
  },
  {
    id: 2,
    name: "Riya Mehta",
    email: "riya.mehta@peoplepay360.com",
    jobPosition: "Engineering Manager",
    department: "Engineering",
    manager: "—",
    scheduleId: 1,
    status: "Active",
  },
  {
    id: 3,
    name: "Sanya Iyer",
    email: "sanya.iyer@peoplepay360.com",
    jobPosition: "Sales Executive",
    department: "Sales",
    manager: "K. Nair",
    scheduleId: 1,
    status: "Active",
  },
  {
    id: 4,
    name: "Kabir Nair",
    email: "kabir.nair@peoplepay360.com",
    jobPosition: "Sales Manager",
    department: "Sales",
    manager: "—",
    scheduleId: 1,
    status: "Active",
  },
  {
    id: 5,
    name: "Ananya Sharma",
    email: "ananya.sharma@peoplepay360.com",
    jobPosition: "HR Executive",
    department: "HR",
    manager: "R. Mehta",
    scheduleId: 2,
    status: "Active",
  },
  {
    id: 6,
    name: "Vihaan Patel",
    email: "vihaan.patel@peoplepay360.com",
    jobPosition: "Warehouse Associate",
    department: "Operations",
    manager: "K. Nair",
    scheduleId: 3,
    status: "On Leave",
  },
  {
    id: 7,
    name: "Diya Kapoor",
    email: "diya.kapoor@peoplepay360.com",
    jobPosition: "Finance Analyst",
    department: "Finance",
    manager: "R. Mehta",
    scheduleId: 1,
    status: "Inactive",
  },
];

export const sampleContracts = [
  { id: 1, employeeId: 1, department: "Engineering", position: "Software Engineer", startDate: "2024-01-15", endDate: null, wage: 95000, salaryStructure: "Regular Salary", status: "Active" },
  { id: 2, employeeId: 1, department: "Engineering", position: "Associate Engineer", startDate: "2023-01-15", endDate: "2024-01-14", wage: 72000, salaryStructure: "Regular Salary", status: "Expired" },
  { id: 3, employeeId: 2, department: "Engineering", position: "Engineering Manager", startDate: "2022-06-01", endDate: null, wage: 165000, salaryStructure: "Regular Salary", status: "Active" },
  { id: 4, employeeId: 3, department: "Sales", position: "Sales Executive", startDate: "2024-03-01", endDate: null, wage: 58000, salaryStructure: "Sales Incentive", status: "Active" },
  { id: 5, employeeId: 4, department: "Sales", position: "Sales Manager", startDate: "2021-11-10", endDate: null, wage: 132000, salaryStructure: "Sales Incentive", status: "Active" },
  { id: 6, employeeId: 5, department: "HR", position: "HR Executive", startDate: "2025-02-01", endDate: null, wage: 61000, salaryStructure: "Regular Salary", status: "Active" },
  { id: 7, employeeId: 6, department: "Operations", position: "Warehouse Associate", startDate: "2025-05-20", endDate: null, wage: 38000, salaryStructure: "Hourly Wage", status: "Active" },
  { id: 8, employeeId: 7, department: "Finance", position: "Finance Analyst", startDate: "2023-08-01", endDate: "2026-08-01", wage: 74000, salaryStructure: "Regular Salary", status: "Draft" },
];

export const salaryStructureOptions = ["Regular Salary", "Sales Incentive", "Hourly Wage"];

export const sampleAttendance = [
  { id: 1, employeeId: 1, date: "2026-09-01", checkIn: "09:04", checkOut: "18:11", workedHours: 8.1, status: "Present", corrected: false },
  { id: 2, employeeId: 1, date: "2026-09-02", checkIn: "09:32", checkOut: "18:05", workedHours: 7.5, status: "Late", corrected: false },
  { id: 3, employeeId: 1, date: "2026-09-03", checkIn: "09:01", checkOut: null, workedHours: 0, status: "Missing check-out", corrected: false },
  { id: 4, employeeId: 3, date: "2026-09-01", checkIn: "09:10", checkOut: "18:00", workedHours: 7.8, status: "Present", corrected: false },
  { id: 5, employeeId: 3, date: "2026-09-02", checkIn: null, checkOut: null, workedHours: 0, status: "Absent", corrected: false },
  { id: 6, employeeId: 5, date: "2026-09-01", checkIn: "08:58", checkOut: "17:35", workedHours: 7.6, status: "Present", corrected: true },
  { id: 7, employeeId: 6, date: "2026-09-01", checkIn: "08:05", checkOut: "17:10", workedHours: 8.2, status: "Present", corrected: false },
];

export const departments = ["Engineering", "Sales", "HR", "Operations", "Finance"];
export const employeeStatuses = ["Active", "On Leave", "Inactive"];
