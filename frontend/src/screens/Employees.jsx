import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { tokens, mono, sans, panelStyle, buttonPrimary, inputStyle, labelStyle, numeral, overlayStyle } from "../tokens";
import StatusBadge from "../components/StatusBadge";
import { coreApi } from "../api/coreApi";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);
  function load() {
    coreApi.listEmployees().then(setEmployees);
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1000 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Employee Register</h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: tokens.inkMuted, fontFamily: mono }}>
            {String(employees.length).padStart(2, "0")} entries
          </p>
        </div>
        <button style={buttonPrimary} onClick={() => setCreating(true)}>+ New entry</button>
      </div>

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

      {creating && <EmployeeCreateForm onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load(); }} />}
    </div>
  );
}

function EmployeeCreateForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    employee_id: "", first_name: "", last_name: "", email: "", phone: "",
    department: "", job_title: "", date_of_joining: "", is_active: true,
  });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
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
        {[
          ["employee_id", "Employee ID"], ["first_name", "First name"], ["last_name", "Last name"],
          ["email", "Email"], ["phone", "Phone"], ["department", "Department"], ["job_title", "Job title"],
        ].map(([key, label]) => (
          <div key={key} style={{ marginBottom: 10 }}>
            <label style={labelStyle}>{label}</label>
            <input style={inputStyle} value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required={["employee_id", "first_name", "email"].includes(key)} />
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Date of joining</label>
          <input type="date" style={inputStyle} value={form.date_of_joining}
            onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })} required />
        </div>
        {error && <div style={{ color: tokens.oxblood, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button type="submit" style={buttonPrimary}>Record entry</button>
      </form>
    </div>
  );
}
