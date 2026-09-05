import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { tokens, serifDisplay, sans, mono, buttonPrimary, buttonSecondary, inputStyle } from "../tokens";
import { useRole } from "../contexts/RoleContext";
import { sampleEmployees, departments, employeeStatuses, sampleSchedules } from "../sampleData";
import StatusBadge from "../components/StatusBadge";

function RecordNo({ n }) {
  return (
    <span style={{
      fontFamily: mono, fontSize: 12, color: tokens.inkMuted,
      border: `1px solid ${tokens.rule}`, borderRadius: 3,
      width: 30, textAlign: "center", padding: "2px 0", flexShrink: 0,
    }}>
      {String(n).padStart(3, "0")}
    </span>
  );
}

function EmployeeTicket({ employee, index, onClick, scheduleName }) {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer", background: tokens.surface, border: `1px solid ${tokens.rule}`,
        borderRadius: 3, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <RecordNo n={index + 1} />
        <StatusBadge status={employee.status} />
      </div>
      <div>
        <p style={{ margin: 0, fontFamily: serifDisplay, fontSize: 16, fontWeight: 600, color: tokens.ink }}>{employee.name}</p>
        <p style={{ margin: "3px 0 0", fontSize: 12.5, color: tokens.inkMuted }}>{employee.jobPosition}</p>
      </div>
      <p style={{ margin: 0, fontFamily: mono, fontSize: 11, color: tokens.inkMuted }}>
        {employee.department} — {scheduleName}
      </p>
    </div>
  );
}

function NewEmployeeForm({ onCancel, onSubmit }) {
  const [form, setForm] = useState({
    name: "", email: "", jobPosition: "", department: departments[0],
    manager: "", scheduleId: sampleSchedules[0].id, status: "Active",
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div style={{ border: `1px solid ${tokens.rule}`, background: tokens.surface, padding: "18px 20px", marginBottom: 24 }}>
      <h2 style={{ fontFamily: serifDisplay, fontSize: 17, fontWeight: 600, margin: "0 0 14px" }}>New entry — Employee</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 14 }}>
        <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Full name
          <input style={inputStyle} value={form.name} onChange={set("name")} /></label>
        <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Email
          <input style={inputStyle} type="email" value={form.email} onChange={set("email")} /></label>
        <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Job position
          <input style={inputStyle} value={form.jobPosition} onChange={set("jobPosition")} /></label>
        <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Department
          <select style={inputStyle} value={form.department} onChange={set("department")}>
            {departments.map((d) => <option key={d}>{d}</option>)}
          </select></label>
        <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Manager
          <input style={inputStyle} value={form.manager} onChange={set("manager")} placeholder="e.g. R. Mehta" /></label>
        <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Working schedule
          <select style={inputStyle} value={form.scheduleId} onChange={(e) => setForm({ ...form, scheduleId: Number(e.target.value) })}>
            {sampleSchedules.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select></label>
        <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Status
          <select style={inputStyle} value={form.status} onChange={set("status")}>
            {employeeStatuses.map((s) => <option key={s}>{s}</option>)}
          </select></label>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button style={buttonPrimary} onClick={() => onSubmit(form)} disabled={!form.name}>Log employee</button>
        <button style={buttonSecondary} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default function Employees() {
  const navigate = useNavigate();
  const { canEditHrData } = useRole();
  const [view, setView] = useState("list");
  const [employees, setEmployees] = useState(sampleEmployees);
  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All departments");
  const [showForm, setShowForm] = useState(false);

  const scheduleName = (id) => sampleSchedules.find((s) => s.id === id)?.name || "—";

  const filtered = useMemo(() => employees.filter((e) => {
    const matchesQuery = e.name.toLowerCase().includes(query.toLowerCase()) || e.jobPosition.toLowerCase().includes(query.toLowerCase());
    const matchesDept = deptFilter === "All departments" || e.department === deptFilter;
    return matchesQuery && matchesDept;
  }), [employees, query, deptFilter]);

  function handleCreate(form) {
    setEmployees((es) => [{ id: Math.max(...es.map((e) => e.id)) + 1, ...form }, ...es]);
    setShowForm(false);
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1080 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 8 }}>
        <div>
          <h1 style={{ fontFamily: serifDisplay, fontSize: 26, fontWeight: 600, margin: 0 }}>Employees</h1>
          <p style={{ fontFamily: mono, fontSize: 12, color: tokens.inkMuted, margin: "5px 0 0" }}>
            {String(filtered.length).padStart(3, "0")} of {String(employees.length).padStart(3, "0")} on record
          </p>
        </div>
        {canEditHrData && !showForm && <button style={buttonPrimary} onClick={() => setShowForm(true)}>New employee</button>}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${tokens.rule}`, marginBottom: 20 }}>
        <input placeholder="Search name or position…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ ...inputStyle, marginTop: 0, width: 220 }} />
        <select style={{ ...inputStyle, marginTop: 0, width: 170 }} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option>All departments</option>
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
        <div style={{ display: "flex", gap: 16, marginLeft: "auto" }}>
          {["list", "kanban"].map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontFamily: sans,
              fontSize: 13, color: view === v ? tokens.ink : tokens.inkMuted, fontWeight: view === v ? 600 : 400,
              borderBottom: view === v ? `2px solid ${tokens.forest}` : "2px solid transparent",
            }}>
              {v === "list" ? "List" : "Board"}
            </button>
          ))}
        </div>
      </div>

      {showForm && <NewEmployeeForm onCancel={() => setShowForm(false)} onSubmit={handleCreate} />}

      {view === "kanban" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14 }}>
          {filtered.map((e, i) => (
            <EmployeeTicket key={e.id} employee={e} index={i} scheduleName={scheduleName(e.scheduleId)} onClick={() => navigate(`/employees/${e.id}`)} />
          ))}
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ textAlign: "left", color: tokens.inkMuted, fontSize: 11.5, textTransform: "none" }}>
              <th style={{ padding: "6px 8px", fontWeight: 500 }}>No.</th>
              <th style={{ padding: "6px 8px", fontWeight: 500 }}>Employee</th>
              <th style={{ padding: "6px 8px", fontWeight: 500 }}>Job position</th>
              <th style={{ padding: "6px 8px", fontWeight: 500 }}>Department</th>
              <th style={{ padding: "6px 8px", fontWeight: 500 }}>Manager</th>
              <th style={{ padding: "6px 8px", fontWeight: 500 }}>Schedule</th>
              <th style={{ padding: "6px 8px", fontWeight: 500 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => (
              <tr key={e.id} onClick={() => navigate(`/employees/${e.id}`)} style={{ borderTop: `1px solid ${tokens.rule}`, cursor: "pointer" }}>
                <td style={{ padding: "10px 8px", fontFamily: mono, color: tokens.inkMuted }}>{String(i + 1).padStart(3, "0")}</td>
                <td style={{ padding: "10px 8px", fontWeight: 600 }}>{e.name}</td>
                <td style={{ padding: "10px 8px" }}>{e.jobPosition}</td>
                <td style={{ padding: "10px 8px" }}>{e.department}</td>
                <td style={{ padding: "10px 8px" }}>{e.manager}</td>
                <td style={{ padding: "10px 8px" }}>{scheduleName(e.scheduleId)}</td>
                <td style={{ padding: "10px 8px" }}><StatusBadge status={e.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
