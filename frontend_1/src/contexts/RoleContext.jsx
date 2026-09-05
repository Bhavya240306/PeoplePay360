import React, { createContext, useContext, useState } from "react";

// Simulates the role-based permissions from the problem statement so the
// UI can demo gating (e.g. only HR Manager+ can edit attendance/contracts)
// without a real auth backend wired up yet.
export const ROLES = [
  "Employee",
  "HR Manager",
  "HR Payroll User",
  "HR Payroll Manager",
  "Admin",
];

// Anyone at HR Manager level or above can create/edit Employee, Contract,
// Attendance and Working Schedule records (per the problem statement, HR
// Manager already has full CRUD on these four modules).
const CAN_EDIT_HR_DATA = new Set([
  "HR Manager",
  "HR Payroll User",
  "HR Payroll Manager",
  "Admin",
]);

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [role, setRole] = useState("HR Manager");
  const canEditHrData = CAN_EDIT_HR_DATA.has(role);
  return (
    <RoleContext.Provider value={{ role, setRole, canEditHrData }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
