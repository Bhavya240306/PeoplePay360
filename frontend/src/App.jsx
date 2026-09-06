import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, ProtectedRoute, ROLE_LEVEL } from "./AuthContext";
import Layout from "./Layout";
import Login from "./screens/Login";

import Employees from "./screens/Employees";
import EmployeeForm from "./screens/EmployeeForm";
import Contracts from "./screens/Contracts";
import Attendance from "./screens/Attendance";
import Schedules from "./screens/Schedules";

import Profile from "./screens/Profile";
import MySchedule from "./screens/MySchedule";
import MyAttendance from "./screens/MyAttendance";
import MyQrCode from "./screens/MyQrCode";
import MyPayslips from "./screens/MyPayslips";

import TimeOffRequests from "./screens/timeoff/Requests";
import Allocations from "./screens/timeoff/Allocations";
import TimeOffTypes from "./screens/timeoff/Types";

import PayrollDashboard from "./screens/payroll/Dashboard";
import Payruns from "./screens/payroll/Payruns";
import PayrunDetail from "./screens/payroll/PayrunDetail";
import SalaryStructures from "./screens/payroll/SalaryStructures";
import SalaryRules from "./screens/payroll/SalaryRules";

import UserManagement from "./screens/UserManagement";
import Settlements from "./screens/Settlements";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/timeoff/requests" replace />} />

            <Route path="/employees" element={<ProtectedRoute minRole={ROLE_LEVEL["HR Manager"]}><Employees /></ProtectedRoute>} />
            <Route path="/employees/:id" element={<ProtectedRoute minRole={ROLE_LEVEL["HR Manager"]}><EmployeeForm /></ProtectedRoute>} />
            <Route path="/contracts" element={<ProtectedRoute minRole={ROLE_LEVEL["HR Manager"]}><Contracts /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute minRole={ROLE_LEVEL["HR Manager"]}><Attendance /></ProtectedRoute>} />
            <Route path="/schedules" element={<ProtectedRoute minRole={ROLE_LEVEL["HR Manager"]}><Schedules /></ProtectedRoute>} />

            <Route path="/profile" element={<Profile />} />
            <Route path="/my/schedule" element={<ProtectedRoute employeeOnly><MySchedule /></ProtectedRoute>} />
            <Route path="/my/attendance" element={<ProtectedRoute employeeOnly><MyAttendance /></ProtectedRoute>} />
            <Route path="/my/payslips" element={<ProtectedRoute employeeOnly><MyPayslips /></ProtectedRoute>} />
            <Route path="/my/qr-code" element={<ProtectedRoute employeeOnly><MyQrCode /></ProtectedRoute>} />

            <Route path="/timeoff/requests" element={<TimeOffRequests />} />
            <Route path="/timeoff/allocations" element={<ProtectedRoute minRole={ROLE_LEVEL["HR Manager"]}><Allocations /></ProtectedRoute>} />
            <Route path="/timeoff/types" element={<ProtectedRoute minRole={ROLE_LEVEL["HR Manager"]}><TimeOffTypes /></ProtectedRoute>} />

            <Route path="/payroll/dashboard" element={<ProtectedRoute minRole={ROLE_LEVEL["HR Payroll User"]}><PayrollDashboard /></ProtectedRoute>} />
            <Route path="/payroll/payruns" element={<ProtectedRoute minRole={ROLE_LEVEL["HR Payroll User"]}><Payruns /></ProtectedRoute>} />
            <Route path="/payroll/payruns/:id" element={<ProtectedRoute minRole={ROLE_LEVEL["HR Payroll User"]}><PayrunDetail /></ProtectedRoute>} />
            <Route path="/payroll/salary-structures" element={<ProtectedRoute minRole={ROLE_LEVEL["HR Payroll User"]}><SalaryStructures /></ProtectedRoute>} />
            <Route path="/payroll/salary-rules" element={<ProtectedRoute minRole={ROLE_LEVEL["HR Payroll User"]}><SalaryRules /></ProtectedRoute>} />

            <Route path="/admin/users" element={<ProtectedRoute minRole={ROLE_LEVEL.Admin}><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/settlements" element={<ProtectedRoute minRole={ROLE_LEVEL["HR Payroll Manager"]}><Settlements /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
