import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { tokens, serifDisplay, sans, mono, panelStyle, buttonPrimary, buttonSecondary, overlayStyle } from "./tokens";
import { useAuth, ROLE_LEVEL } from "./AuthContext";
import NotificationsBell from "./components/NotificationsBell";

const groups = [
  {
    label: "Employees",
    links: [
      { to: "/employees", label: "Employees", minRole: ROLE_LEVEL["HR Manager"] },
      { to: "/contracts", label: "Contracts", minRole: ROLE_LEVEL["HR Manager"] },
      { to: "/attendance", label: "Attendance", minRole: ROLE_LEVEL["HR Manager"] },
      { to: "/schedules", label: "Working Schedules", minRole: ROLE_LEVEL["HR Manager"] },
    ],
  },
  {
    label: "My Space",
    employeeOnly: true,
    links: [
      { to: "/my/schedule", label: "My Schedule" },
      { to: "/my/qr-code", label: "My QR Code" },
      { to: "/my/attendance", label: "My Attendance" },
      { to: "/my/payslips", label: "My Payslips" },
    ],
  },
  {
    label: "Time Off",
    links: [
      { to: "/timeoff/requests", label: "Requests", minRole: ROLE_LEVEL.Employee },
      { to: "/timeoff/allocations", label: "Allocations", minRole: ROLE_LEVEL["HR Manager"] },
      { to: "/timeoff/types", label: "Types", minRole: ROLE_LEVEL["HR Manager"] },
    ],
  },
  {
    label: "Payroll",
    links: [
      { to: "/payroll/dashboard", label: "Dashboard", minRole: ROLE_LEVEL["HR Payroll User"] },
      { to: "/payroll/payruns", label: "Payruns", minRole: ROLE_LEVEL["HR Payroll User"] },
      { to: "/payroll/salary-structures", label: "Salary Structures", minRole: ROLE_LEVEL["HR Payroll User"] },
      { to: "/payroll/salary-rules", label: "Salary Rules", minRole: ROLE_LEVEL["HR Payroll User"] },
    ],
  },
  {
    label: "Admin",
    links: [
      { to: "/admin/users", label: "User Management", minRole: ROLE_LEVEL.Admin },
      { to: "/admin/settlements", label: "Settlements", minRole: ROLE_LEVEL["HR Payroll Manager"] },
    ],
  },
];

export default function Layout() {
  const { user, logout, roleLevel } = useAuth();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const visibleGroups = groups
    .filter((g) => !g.employeeOnly || roleLevel === ROLE_LEVEL.Employee)
    .map((g) => ({ ...g, links: g.links.filter((l) => roleLevel >= (l.minRole ?? ROLE_LEVEL.Employee)) }))
    .filter((g) => g.links.length > 0);
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: tokens.paper, fontFamily: sans, color: tokens.ink }}>
      <header
        style={{
          borderBottom: `2px solid ${tokens.ink}`,
          padding: "18px 28px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontFamily: serifDisplay, fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>
            PeoplePay360
          </h1>
          <p style={{ fontFamily: mono, fontSize: 11, color: tokens.inkMuted, margin: "4px 0 0" }}>
            HR Register · {today}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <NotificationsBell />
          <NavLink to="/profile" style={{ textAlign: "right", textDecoration: "none", color: "inherit", cursor: "pointer" }}>
            <div style={{ fontSize: 12.5 }}>{user?.username}</div>
            <div style={{ fontFamily: mono, fontSize: 10.5, color: tokens.inkMuted }}>{user?.role_display}</div>
          </NavLink>
          <button
            onClick={() => setConfirmingLogout(true)}
            style={{ border: "none", background: "none", color: tokens.inkMuted, fontSize: 11.5, cursor: "pointer", textDecoration: "underline" }}
          >
            Log out
          </button>
        </div>
      </header>

      <nav
        style={{
          display: "flex", flexWrap: "wrap", gap: 26, padding: "10px 28px",
          borderBottom: `1px solid ${tokens.rule}`, background: tokens.surface,
        }}
      >
        {visibleGroups.map((g) => (
          <div key={g.label}>
            <div style={{ fontFamily: mono, fontSize: 10, color: tokens.inkMuted, marginBottom: 4, letterSpacing: "0.03em" }}>
              {g.label}
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {g.links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  style={({ isActive }) => ({
                    textDecoration: "none",
                    fontSize: 13, color: isActive ? tokens.ink : tokens.inkMuted,
                    fontWeight: isActive ? 600 : 400,
                    borderBottom: isActive ? `2px solid ${tokens.forest}` : "2px solid transparent",
                    paddingBottom: 2,
                  })}
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <main>
        <Outlet />
      </main>

      {confirmingLogout && (
        <div style={overlayStyle}>
          <div style={{ ...panelStyle, width: 380 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>Log out?</h3>
            <p style={{ margin: "0 0 18px", fontSize: 13, color: tokens.inkMuted, lineHeight: 1.5 }}>
              You'll need to sign in again to access PeoplePay360. Any unsaved changes on this page will be lost.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button style={buttonSecondary} onClick={() => setConfirmingLogout(false)}>Cancel</button>
              <button style={{ ...buttonPrimary, background: tokens.oxblood, borderColor: tokens.oxblood }} onClick={logout}>
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
