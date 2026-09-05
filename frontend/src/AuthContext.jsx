import React, { createContext, useContext, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { login as apiLogin, logout as apiLogout, isLoggedIn, fetchCurrentUser } from "./api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn()) {
      fetchCurrentUser()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Wrap any route element that requires a logged-in user.
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; // could render a spinner here
  if (!isLoggedIn() || !user) return <Navigate to="/login" replace />;
  return children;
}
