import React, { useEffect, useState } from "react";
import { tokens, mono, panelStyle, buttonPrimary, inputStyle, labelStyle } from "../tokens";
import StatusBadge from "../components/StatusBadge";
import { accountsApi } from "../api/accountsApi";

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
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);
  function load() {
    accountsApi.listUsers().then(setUsers).catch(() => setUsers([]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
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
          <div>
            <label style={labelStyle}>Username</label>
            <input style={inputStyle} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input type="password" style={inputStyle} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <select style={inputStyle} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>First name</label>
            <input style={inputStyle} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
          </div>
          <div>
            <label style={labelStyle}>Last name</label>
            <input style={inputStyle} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
        </div>

        {Number(form.role) === EMPLOYEE_ROLE && (
          <div>
            <h4 style={{ margin: "0 0 10px", fontSize: 12.5, color: tokens.inkMuted, fontFamily: mono }}>Employee details</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Employee ID</label>
                <input style={inputStyle} value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} required />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Department</label>
                <input style={inputStyle} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Job title</label>
                <input style={inputStyle} value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Date of joining</label>
                <input type="date" style={inputStyle} value={form.date_of_joining} onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })} required />
              </div>
              <div>
                <label style={labelStyle}>Bank account</label>
                <input style={inputStyle} value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {error && <div style={{ color: tokens.oxblood, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button type="submit" style={buttonPrimary}>Create user</button>
      </form>
    </div>
  );
}
