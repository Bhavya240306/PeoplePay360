import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { tokens, mono, sans, panelStyle, buttonPrimary, numeral, overlayStyle } from "../tokens";
import StatusBadge from "../components/StatusBadge";
import ViewToggle from "../components/ViewToggle";
import Field, { fieldInputStyle } from "../components/Field";
import { coreApi } from "../api/coreApi";
import {
  validateEmployeeId, validatePersonName, validateEmail, validatePhone, validateBankAccount,
  validateRequired, runValidators, hasErrors, HINTS,
} from "../validators";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState("list");
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);
  function load() {
    coreApi.listEmployees().then(setEmployees);
  }

  const byDepartment = {};
  employees.forEach((e) => {
    const key = e.department || "Unassigned";
    (byDepartment[key] = byDepartment[key] || []).push(e);
  });
  const departments = Object.keys(byDepartment).sort((a, b) =>
    a === "Unassigned" ? 1 : b === "Unassigned" ? -1 : a.localeCompare(b));

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1000 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Employee Register</h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: tokens.inkMuted, fontFamily: mono }}>
            {String(employees.length).padStart(2, "0")} entries
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ViewToggle view={view} onChange={setView} />
          <button style={buttonPrimary} onClick={() => setCreating(true)}>+ New entry</button>
        </div>
      </div>

      {view === "board" ? (
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", overflowX: "auto" }}>
          {departments.map((dept) => (
            <div key={dept} style={{ flex: "1 0 200px", minWidth: 200 }}>
              <div style={{ fontFamily: mono, fontSize: 10.5, color: tokens.inkMuted, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                <span>{dept}</span>
                <span>{byDepartment[dept].length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {byDepartment[dept].map((e) => (
                  <div
                    key={e.id}
                    onClick={() => navigate(`/employees/${e.id}`)}
                    style={{ ...panelStyle, padding: "10px 12px", cursor: "pointer" }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{e.first_name} {e.last_name}</div>
                    <div style={{ fontSize: 12, color: tokens.inkMuted, marginBottom: 8 }}>{e.job_title || "—"}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ ...numeral, fontSize: 11.5, color: tokens.inkMuted }}>{e.employee_id}</span>
                      <StatusBadge status={e.is_active ? "Active" : "Inactive"} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", fontFamily: mono, fontSize: 10.5, color: tokens.inkMuted, borderBottom: `1px solid ${tokens.ruleStrong}`, paddingBottom: 6, marginBottom: 2 }}>
            <div style={{ width: 40 }}>№</div>
            <div style={{ width: 90 }}>ID</div>
            <div style={{ flex: 2 }}>Name</div>
            <div style={{ flex: 1.4 }}>Department</div>
            <div style={{ flex: 1.4 }}>Job title</div>
            <div style={{ width: 90 }}>Status</div>
          </div>
          {employees.map((e, i) => (
            <div
              key={e.id}
              onClick={() => navigate(`/employees/${e.id}`)}
              style={{
                display: "flex", alignItems: "center", padding: "10px 0",
                borderBottom: `1px solid ${tokens.rule}`, cursor: "pointer", fontSize: 13.5,
              }}
            >
              <div style={{ width: 40, ...numeral, color: tokens.inkMuted, fontSize: 12 }}>{String(i + 1).padStart(2, "0")}</div>
              <div style={{ width: 90, ...numeral, fontSize: 12.5 }}>{e.employee_id}</div>
              <div style={{ flex: 2 }}>{e.first_name} {e.last_name}</div>
              <div style={{ flex: 1.4, color: tokens.inkMuted }}>{e.department || "—"}</div>
              <div style={{ flex: 1.4, color: tokens.inkMuted }}>{e.job_title || "—"}</div>
              <div style={{ width: 90 }}><StatusBadge status={e.is_active ? "Active" : "Inactive"} /></div>
            </div>
          ))}
          {employees.length === 0 && (
            <p style={{ color: tokens.inkMuted, fontSize: 13, padding: "16px 0" }}>No entries recorded yet.</p>
          )}
        </div>
      )}

      {creating && <EmployeeCreateForm onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load(); }} />}
    </div>
  );
}

const EMPLOYEE_FIELDS = [
  ["employee_id", "Employee ID", validateEmployeeId, HINTS.employeeId, true],
  ["first_name", "First name", validatePersonName, HINTS.personName, true],
  ["last_name", "Last name", (v) => validatePersonName(v, { optional: true }), HINTS.personName, false],
  ["email", "Email", validateEmail, HINTS.email, true],
  ["phone", "Phone", validatePhone, HINTS.phone, false],
  ["bank_account", "Bank account", validateBankAccount, HINTS.bankAccount, false],
  ["department", "Department", null, null, false],
  ["job_title", "Job title", null, null, false],
];

function EmployeeCreateForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    employee_id: "", first_name: "", last_name: "", email: "", phone: "", bank_account: "",
    department: "", job_title: "", date_of_joining: "", is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");

  function validateAll() {
    const map = {};
    EMPLOYEE_FIELDS.forEach(([key, , validate]) => { if (validate) map[key] = validate; });
    map.date_of_joining = validateRequired;
    return runValidators(form, map);
  }

  function handleChange(key, value) {
    setForm({ ...form, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fieldErrors = validateAll();
    setErrors(fieldErrors);
    if (hasErrors(fieldErrors)) return;
    try {
      await coreApi.createEmployee(form);
      onCreated();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={overlayStyle}>
      <form onSubmit={handleSubmit} style={{ ...panelStyle, width: 420, maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>New employee entry</h3>
          <button type="button" onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: tokens.inkMuted }}>✕</button>
        </div>
        {EMPLOYEE_FIELDS.map(([key, label, , hint, required]) => (
          <Field key={key} label={label} hint={hint} error={errors[key]} required={required} style={{ marginBottom: 12 }}>
            <input
              style={fieldInputStyle(!!errors[key])} value={form[key]}
              onChange={(e) => handleChange(key, key === "employee_id" ? e.target.value.toUpperCase() : e.target.value)}
            />
          </Field>
        ))}
        <Field label="Date of joining" required error={errors.date_of_joining} style={{ marginBottom: 16 }}>
          <input
            type="date" style={fieldInputStyle(!!errors.date_of_joining)} value={form.date_of_joining}
            onChange={(e) => handleChange("date_of_joining", e.target.value)}
          />
        </Field>
        {error && <div style={{ color: tokens.oxblood, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button type="submit" style={buttonPrimary}>Record entry</button>
      </form>
    </div>
  );
}
