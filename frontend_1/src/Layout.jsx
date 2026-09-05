import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { tokens } from "./tokens";
import { useRole, ROLES } from "./contexts/RoleContext";
import "./styles/layout.css";

const links = [
  { to: "/employees", label: "Employees" },
  { to: "/contracts", label: "Contracts" },
  { to: "/attendance", label: "Attendance" },
  { to: "/schedules", label: "Working Schedules" },
];

export default function Layout() {
  const { role, setRole } = useRole();

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className="app-layout"
      style={{
        background: tokens.paper,
        color: tokens.ink,
      }}
    >
      <header
        className="app-header"
        style={{
          borderBottomColor: tokens.ink,
        }}
      >
        <div>
          <h1 className="brand-title">
            PeoplePay360
          </h1>

          <p
            className="brand-subtitle"
            style={{ color: tokens.inkMuted }}
          >
            HR Register · {today}
          </p>
        </div>

        <label
          className="role-selector"
          style={{ color: tokens.inkMuted }}
        >
          Viewing as

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              borderColor: tokens.rule,
              background: tokens.surface,
              color: tokens.ink,
            }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </header>

      <nav
        className="main-navigation"
        style={{
          borderBottomColor: tokens.rule,
          background: tokens.surface,
        }}
      >
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
            style={({ isActive }) => ({
              color: isActive
                ? tokens.ink
                : tokens.inkMuted,
              borderBottomColor: isActive
                ? tokens.forest
                : "transparent",
            })}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}