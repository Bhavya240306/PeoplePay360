import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./Layout";
import { RoleProvider } from "./contexts/RoleContext";
import Employees from "./screens/Employees";
import EmployeeForm from "./screens/EmployeeForm";
import Contracts from "./screens/Contracts";
import Attendance from "./screens/Attendance";
import Schedules from "./screens/Schedules";

export default function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/employees" replace />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/:id" element={<EmployeeForm />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/schedules" element={<Schedules />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RoleProvider>
  );
}
