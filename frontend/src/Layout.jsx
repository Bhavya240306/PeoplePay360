import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { tokens, fontStack } from "./tokens";
import { useAuth } from "./AuthContext";

const links = [
  { to: "/payroll/payruns", label: "Payruns" },
  { to: "/payroll/salary-structures", label: "Salary structures" },
  { to: "/payroll/salary-rules", label: "Salary rules" },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: fontStack, background: tokens.bg }}>
      <aside
        style={{
          width: 220,
          borderRight: `1px solid ${tokens.border}`,
          padding: "20px 14px",
          background: tokens.surface,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 20px", color: tokens.ink }}>
          PeoplePay360
        </h2>

        <div style={{ fontSize: 11, fontWeight: 600, color: tokens.inkMuted, margin: "0 0 8px 10px" }}>
          Payroll
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              style={({ isActive }) => ({
                padding: "8px 10px",
                borderRadius: 6,
                textDecoration: "none",
                color: isActive ? tokens.primary : tokens.ink,
                background: isActive ? tokens.primaryTint : "transparent",
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
              })}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${tokens.border}` }}>
          <div style={{ fontSize: 12, color: tokens.inkMuted, marginBottom: 8 }}>
            {user?.username} · {user?.role_display}
          </div>
          <button
            onClick={logout}
            style={{
              border: "none",
              background: "none",
              color: tokens.inkMuted,
              fontSize: 12,
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            Log out
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
