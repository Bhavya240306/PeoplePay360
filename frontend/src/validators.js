// Shared client-side field constraints. Each validator mirrors a real
// constraint the backend also enforces (see core/models.py, payroll/models.py) -
// this file exists to give the user immediate, inline feedback, not to be
// the source of truth. The server always re-checks on submit.

export const PATTERNS = {
  employeeId: /^[A-Za-z0-9-]{3,20}$/,
  personName: /^[A-Za-z][A-Za-z .'-]*$/,
  phone: /^\+?\d{7,15}$/,
  bankAccount: /^\d{9,18}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ruleCode: /^[A-Z0-9_]{2,30}$/,
};

export const HINTS = {
  employeeId: "3–20 letters, numbers, or hyphens (e.g. EMP021).",
  personName: "Letters only (spaces, hyphens, and apostrophes allowed).",
  email: "A valid, unique email address (e.g. name@company.com).",
  phone: "7–15 digits, optionally starting with + and a country code. Optional.",
  bankAccount: "9–18 digits, no spaces or dashes. Optional.",
  basicSalary: "A positive amount, greater than 0.",
  workingHours: "Between 1 and 80 hours per week.",
  workedHours: "Between 0 and 24 hours for a single day.",
  percentage: "Cannot be negative.",
  amount: "Cannot be negative.",
  ruleCode: "2–30 uppercase letters, numbers, or underscores (e.g. BASIC, HRA_ALLOWANCE).",
  allocatedDays: "Cannot be negative.",
  dateRange: "End date must be on or after the start date.",
  timeRange: "Check-out time must be after check-in time.",
  password: "At least 8 characters.",
  required: "This field is required.",
};

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

export function validateRequired(value) {
  return isBlank(value) ? HINTS.required : "";
}

export function validatePattern(value, pattern, hint, { optional = false } = {}) {
  if (isBlank(value)) return optional ? "" : HINTS.required;
  return pattern.test(String(value).trim()) ? "" : hint;
}

export function validateEmployeeId(value) {
  return validatePattern(value, PATTERNS.employeeId, HINTS.employeeId);
}

export function validatePersonName(value, { optional = false } = {}) {
  return validatePattern(value, PATTERNS.personName, HINTS.personName, { optional });
}

export function validateEmail(value) {
  return validatePattern(value, PATTERNS.email, HINTS.email);
}

export function validatePhone(value) {
  return validatePattern(value, PATTERNS.phone, HINTS.phone, { optional: true });
}

export function validateBankAccount(value) {
  return validatePattern(value, PATTERNS.bankAccount, HINTS.bankAccount, { optional: true });
}

export function validateRuleCode(value) {
  return validatePattern(value, PATTERNS.ruleCode, HINTS.ruleCode);
}

export function validateMin(value, min, hint) {
  if (isBlank(value)) return HINTS.required;
  return Number(value) >= min ? "" : hint;
}

export function validateRange(value, min, max, hint) {
  if (isBlank(value)) return HINTS.required;
  const n = Number(value);
  return n >= min && n <= max ? "" : hint;
}

export function validateBasicSalary(value) {
  return validateMin(value, 0.01, HINTS.basicSalary);
}

export function validateWorkingHours(value) {
  return validateRange(value, 1, 80, HINTS.workingHours);
}

export function validateWorkedHours(value) {
  if (isBlank(value)) return "";
  return validateRange(value, 0, 24, HINTS.workedHours);
}

export function validateNonNegative(value, { optional = false } = {}) {
  if (isBlank(value)) return optional ? "" : HINTS.required;
  return Number(value) >= 0 ? "" : HINTS.percentage;
}

export function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) return "";
  return endDate >= startDate ? "" : HINTS.dateRange;
}

export function validateTimeRange(startTime, endTime) {
  if (!startTime || !endTime) return "";
  return endTime > startTime ? "" : HINTS.timeRange;
}

// Runs a { field: validatorFn } map against a form object and returns the
// { field: message } errors (only failing fields are present). Use with
// `hasErrors(errors)` to gate submission.
export function runValidators(form, validatorMap) {
  const errors = {};
  for (const [field, validate] of Object.entries(validatorMap)) {
    const message = validate(form[field], form);
    if (message) errors[field] = message;
  }
  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
