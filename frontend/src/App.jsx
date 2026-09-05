import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./AuthContext";
import Layout from "./Layout";
import Login from "./screens/Login";
import SalaryRules from "./screens/payroll/SalaryRules";
import SalaryStructures from "./screens/payroll/SalaryStructures";
import Payruns from "./screens/payroll/Payruns";
import PayrunDetail from "./screens/payroll/PayrunDetail";

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
            <Route index element={<Navigate to="/payroll/payruns" replace />} />
            <Route path="/payroll/salary-rules" element={<SalaryRules />} />
            <Route path="/payroll/salary-structures" element={<SalaryStructures />} />
            <Route path="/payroll/payruns" element={<Payruns />} />
            <Route path="/payroll/payruns/:id" element={<PayrunDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
