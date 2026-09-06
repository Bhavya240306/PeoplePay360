import React, { useEffect, useState } from "react";
import { tokens, mono, panelStyle, buttonPrimary, inputStyle, labelStyle } from "../tokens";
import StatusBadge from "../components/StatusBadge";
import Field, { fieldInputStyle } from "../components/Field";
import { accountsApi } from "../api/accountsApi";
import {
  validateRequired, validateEmployeeId, validatePersonName, validatePhone, validateBankAccount,
  runValidators, hasErrors, HINTS,
} from "../validators";

const ROLES = [
  { value: 0, label: "Employee" },
  { value: 1, label: "HR Manager" },
  { value: 2, label: "HR Payroll User" },
  { value: 3, label: "HR Payroll Manager" },
  { value: 4, label: "Admin" },
];

const EMPLOYEE_ROLE = 0;

const initialForm = {
  username: "",
  email: "",
  password: "",
  role: 0,
  first_name: "",
  last_name: "",
  employee_id: "",
  phone: "",
  department: "",
  job_title: "",
  date_of_joining: "",
  bank_account: "",
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);
  function load() {
    accountsApi.listUsers().then(setUsers).catch(() => setUsers([]));
  }

  function handleChange(key, value) {
    setForm({ ...form, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  }

  function validateAll() {
    const map = {
      username: validateRequired,
      password: (v) => (v && v.length >= 8 ? "" : HINTS.password),
      first_name: validatePersonName,
      last_name: (v) => validatePersonName(v, { optional: true }),
    };
    if (Number(form.role) === EMPLOYEE_ROLE) {
      Object.assign(map, {
        employee_id: validateEmployeeId,
        phone: validatePhone,
        bank_account: validateBankAccount,
        date_of_joining: validateRequired,
      });
    }
    return runValidators(form, map);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fieldErrors = validateAll();
    setErrors(fieldErrors);
    if (hasErrors(fieldErrors)) return;
    try {
      const role = Number(form.role);
      const payload = { username: form.username, email: form.email, password: form.password, role, first_name: form.first_name, last_name: form.last_name };
      if (role === EMPLOYEE_ROLE) {
        Object.assign(payload, {
          employee_id: form.employee_id,
          phone: form.phone,
          department: form.department,
          job_title: form.job_title,
          date_of_joining: form.date_of_joining,
          bank_account: form.bank_account,
        });
      }
      await accountsApi.createUser(payload);
      setForm(initialForm);
      setErrors({});
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 800 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>User Management</h2>
      <p style={{ margin: "0 0 18px", fontSize: 12, color: tokens.inkMuted, fontFamily: mono }}>Admin only</p>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", fontFamily: mono, fontSize: 10.5, color: tokens.inkMuted, borderBottom: `1px solid ${tokens.ruleStrong}`, paddingBottom: 6 }}>
          <div style={{ flex: 1.4 }}>Username</div>
          <div style={{ flex: 1.6 }}>Email</div>
          <div style={{ flex: 1 }}>Role</div>
        </div>
        {users.map((u) => (
          <div key={u.id} style={{ display: "flex", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${tokens.rule}`, fontSize: 13.5 }}>
            <div style={{ flex: 1.4 }}>{u.username}</div>
            <div style={{ flex: 1.6, color: tokens.inkMuted }}>{u.email}</div>
            <div style={{ flex: 1 }}><StatusBadge status={u.role_display} /></div>
          </div>
        ))}
        {users.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 13, padding: "16px 0" }}>No users found, or you don't have Admin access.</p>}
      </div>

      <form onSubmit={handleSubmit} style={panelStyle}>
        <h3 style={{ margin: "0 0 12px", fontSize: 13.5 }}>Create user</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <Field label="Username" required error={errors.username}>
            <input style={fieldInputStyle(!!errors.username)} value={form.username} onChange={(e) => handleChange("username", e.target.value)} />
          </Field>
          <Field label="Email" hint={HINTS.email}>
            <input type="email" style={inputStyle} value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
          </Field>
          <Field label="Password" required hint={HINTS.password} error={errors.password}>
            <input type="password" style={fieldInputStyle(!!errors.password)} value={form.password} onChange={(e) => handleChange("password", e.target.value)} />
          </Field>
          <Field label="Role">
            <select style={inputStyle} value={form.role} onChange={(e) => handleChange("role", e.target.value)}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="First name" required hint={HINTS.personName} error={errors.first_name}>
            <input style={fieldInputStyle(!!errors.first_name)} value={form.first_name} onChange={(e) => handleChange("first_name", e.target.value)} />
          </Field>
          <Field label="Last name" hint={HINTS.personName} error={errors.last_name}>
            <input style={fieldInputStyle(!!errors.last_name)} value={form.last_name} onChange={(e) => handleChange("last_name", e.target.value)} />
          </Field>
        </div>

        {Number(form.role) === EMPLOYEE_ROLE && (
          <div>
            <h4 style={{ margin: "0 0 10px", fontSize: 12.5, color: tokens.inkMuted, fontFamily: mono }}>Employee details</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <Field label="Employee ID" required hint={HINTS.employeeId} error={errors.employee_id}>
                <input style={fieldInputStyle(!!errors.employee_id)} value={form.employee_id} onChange={(e) => handleChange("employee_id", e.target.value.toUpperCase())} />
              </Field>
              <Field label="Phone" hint={HINTS.phone} error={errors.phone}>
                <input style={fieldInputStyle(!!errors.phone)} value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
              </Field>
              <Field label="Department">
                <input style={inputStyle} value={form.department} onChange={(e) => handleChange("department", e.target.value)} />
              </Field>
              <Field label="Job title">
                <input style={inputStyle} value={form.job_title} onChange={(e) => handleChange("job_title", e.target.value)} />
              </Field>
              <Field label="Date of joining" required error={errors.date_of_joining}>
                <input type="date" style={fieldInputStyle(!!errors.date_of_joining)} value={form.date_of_joining} onChange={(e) => handleChange("date_of_joining", e.target.value)} />
              </Field>
              <Field label="Bank account" hint={HINTS.bankAccount} error={errors.bank_account}>
                <input style={fieldInputStyle(!!errors.bank_account)} value={form.bank_account} onChange={(e) => handleChange("bank_account", e.target.value)} />
              </Field>
            </div>
          </div>
        )}

        {error && <div style={{ color: tokens.oxblood, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button type="submit" style={buttonPrimary}>Create user</button>
      </form>
    </div>
  );
}
