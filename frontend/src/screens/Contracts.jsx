import React, { useEffect, useState } from "react";
import { tokens, mono, panelStyle, buttonPrimary, numeral, overlayStyle } from "../tokens";
import StatusBadge from "../components/StatusBadge";
import ViewToggle from "../components/ViewToggle";
import Field, { fieldInputStyle } from "../components/Field";
import { coreApi } from "../api/coreApi";
import {
  validateRequired, validateBasicSalary, validateWorkingHours, validateDateRange,
  runValidators, hasErrors, HINTS,
} from "../validators";

const emptyForm = {
  employee: "", contract_type: "Full-time", start_date: "", end_date: "",
  basic_salary: "", working_hours_per_week: 40, is_active: true,
};

const BOARD_COLUMNS = [
  { key: "active", label: "Active", match: (c) => c.is_active },
  { key: "expired", label: "Expired", match: (c) => !c.is_active },
];

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState("list");

  useEffect(() => { load(); }, []);
  function load() {
    coreApi.listContracts().then(setContracts);
    coreApi.listEmployees().then(setEmployees);
  }

  function employeeName(empId) {
    const e = employees.find((x) => x.id === empId);
    return e ? `${e.first_name} ${e.last_name}` : `#${empId}`;
  }

  function handleChange(key, value) {
    setForm({ ...form, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  }

  function validateAll() {
    const fieldErrors = runValidators(form, {
      employee: validateRequired,
      contract_type: validateRequired,
      start_date: validateRequired,
      basic_salary: validateBasicSalary,
      working_hours_per_week: validateWorkingHours,
    });
    const dateError = validateDateRange(form.start_date, form.end_date);
    if (dateError) fieldErrors.end_date = dateError;
    return fieldErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fieldErrors = validateAll();
    setErrors(fieldErrors);
    if (hasErrors(fieldErrors)) return;
    try {
      await coreApi.createContract({ ...form, employee: Number(form.employee) });
      setForm(emptyForm);
      setErrors({});
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 950 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Contract Ledger</h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: tokens.inkMuted, fontFamily: mono }}>
            {String(contracts.length).padStart(2, "0")} entries
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ViewToggle view={view} onChange={setView} />
          <button style={buttonPrimary} onClick={() => setShowForm(true)}>+ New contract</button>
        </div>
      </div>

      {view === "board" ? (
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
          {BOARD_COLUMNS.map((col) => {
            const items = contracts.filter(col.match);
            return (
              <div key={col.key} style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: mono, fontSize: 10.5, color: tokens.inkMuted, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                  <span>{col.label}</span>
                  <span>{items.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map((c) => (
                    <div key={c.id} style={{ ...panelStyle, padding: "10px 12px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{employeeName(c.employee)}</div>
                      <div style={{ fontSize: 12, color: tokens.inkMuted, marginBottom: 4 }}>{c.contract_type}</div>
                      <div style={{ ...numeral, fontSize: 12, marginBottom: 8 }}>{c.start_date} → {c.end_date || "ongoing"}</div>
                      <div style={{ ...numeral, fontSize: 12.5, fontWeight: 500 }}>₹{c.basic_salary}</div>
                    </div>
                  ))}
                  {items.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 12 }}>—</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", fontFamily: mono, fontSize: 10.5, color: tokens.inkMuted, borderBottom: `1px solid ${tokens.ruleStrong}`, paddingBottom: 6 }}>
            <div style={{ width: 40 }}>№</div>
            <div style={{ flex: 1.6 }}>Employee</div>
            <div style={{ flex: 1 }}>Type</div>
            <div style={{ flex: 1 }}>Start</div>
            <div style={{ flex: 1 }}>End</div>
            <div style={{ flex: 1 }}>Wage</div>
            <div style={{ width: 90 }}>Status</div>
          </div>
          {contracts.map((c, i) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${tokens.rule}`, fontSize: 13.5 }}>
              <div style={{ width: 40, ...numeral, color: tokens.inkMuted, fontSize: 12 }}>{String(i + 1).padStart(2, "0")}</div>
              <div style={{ flex: 1.6 }}>{employeeName(c.employee)}</div>
              <div style={{ flex: 1, color: tokens.inkMuted }}>{c.contract_type}</div>
              <div style={{ flex: 1, ...numeral, fontSize: 12.5 }}>{c.start_date}</div>
              <div style={{ flex: 1, ...numeral, fontSize: 12.5 }}>{c.end_date || "ongoing"}</div>
              <div style={{ flex: 1, ...numeral, fontSize: 12.5 }}>₹{c.basic_salary}</div>
              <div style={{ width: 90 }}><StatusBadge status={c.is_active ? "Active" : "Expired"} /></div>
            </div>
          ))}
          {contracts.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 13, padding: "16px 0" }}>No contracts recorded.</p>}
        </div>
      )}

      {showForm && (
        <div style={overlayStyle}>
          <form onSubmit={handleSubmit} style={{ ...panelStyle, width: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>New contract</h3>
              <button type="button" onClick={() => setShowForm(false)} style={{ border: "none", background: "none", cursor: "pointer", color: tokens.inkMuted }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Employee" required error={errors.employee}>
                <select style={fieldInputStyle(!!errors.employee)} value={form.employee} onChange={(e) => handleChange("employee", e.target.value)}>
                  <option value="">Select…</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
              </Field>
              <Field label="Contract type" required error={errors.contract_type}>
                <input style={fieldInputStyle(!!errors.contract_type)} value={form.contract_type} onChange={(e) => handleChange("contract_type", e.target.value)} />
              </Field>
              <Field label="Start date" required error={errors.start_date}>
                <input type="date" style={fieldInputStyle(!!errors.start_date)} value={form.start_date} onChange={(e) => handleChange("start_date", e.target.value)} />
              </Field>
              <Field label="End date (blank = ongoing)" hint={HINTS.dateRange} error={errors.end_date}>
                <input type="date" style={fieldInputStyle(!!errors.end_date)} value={form.end_date} onChange={(e) => handleChange("end_date", e.target.value)} />
              </Field>
              <Field label="Basic salary" required hint={HINTS.basicSalary} error={errors.basic_salary}>
                <input type="number" min="0.01" step="0.01" style={fieldInputStyle(!!errors.basic_salary)} value={form.basic_salary} onChange={(e) => handleChange("basic_salary", e.target.value)} />
              </Field>
              <Field label="Hours / week" required hint={HINTS.workingHours} error={errors.working_hours_per_week}>
                <input type="number" min="1" max="80" style={fieldInputStyle(!!errors.working_hours_per_week)} value={form.working_hours_per_week} onChange={(e) => handleChange("working_hours_per_week", e.target.value)} />
              </Field>
            </div>
            {error && (
              <div style={{ color: tokens.oxblood, fontSize: 12, marginTop: 12, background: tokens.oxbloodTint, padding: "8px 10px", borderRadius: 3 }}>
                {error}
              </div>
            )}
            <button type="submit" style={{ ...buttonPrimary, marginTop: 14 }}>Record contract</button>
          </form>
        </div>
      )}
    </div>
  );
}
