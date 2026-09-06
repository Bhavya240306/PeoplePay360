import React, { createContext, useContext, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { login as apiLogin, logout as apiLogout, isLoggedIn, fetchCurrentUser } from "./api/auth";

// Real role hierarchy, matching accounts.UserProfile on the backend —
// higher number = more access. Used for >= comparisons, same pattern
// as the Django permission classes.
export const ROLE_LEVEL = {
  Employee: 0,
  "HR Manager": 1,
  "HR Payroll User": 2,
  "HR Payroll Manager": 3,
  Admin: 4,
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn()) {
      fetchCurrentUser().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(username, password) {
    await apiLogin(username, password);
    const me = await fetchCurrentUser();
    setUser(me);
    return me;
  }

  function logout() {
    apiLogout();
    setUser(null);
  }

  const roleLevel = user ? ROLE_LEVEL[user.role_display] ?? 0 : 0;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, roleLevel }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function ProtectedRoute({ children, minRole = ROLE_LEVEL.Employee, employeeOnly = false }) {
  const { user, loading, roleLevel } = useAuth();
  if (loading) return null;
  if (!isLoggedIn() || !user) return <Navigate to="/login" replace />;
  if (employeeOnly && roleLevel !== ROLE_LEVEL.Employee) return <Navigate to="/timeoff/requests" replace />;
  if (roleLevel < minRole) return <Navigate to="/timeoff/requests" replace />;
  return children;
}
