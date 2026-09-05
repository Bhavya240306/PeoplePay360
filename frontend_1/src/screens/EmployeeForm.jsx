import React, { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { tokens, serifDisplay, mono, buttonPrimary, buttonSecondary, inputStyle } from "../tokens";
import { useRole } from "../contexts/RoleContext";
import { sampleEmployees, sampleContracts, sampleAttendance, sampleSchedules, departments, employeeStatuses } from "../sampleData";
import StatusBadge from "../components/StatusBadge";
import SmartButton from "../components/SmartButton";

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEditHrData } = useRole();
  const employeeId = Number(id);

  const original = sampleEmployees.find((e) => e.id === employeeId);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(original);

  const contractCount = useMemo(() => sampleContracts.filter((c) => c.employeeId === employeeId).length, [employeeId]);
  const activeContract = useMemo(() => sampleContracts.find((c) => c.employeeId === employeeId && c.status === "Active"), [employeeId]);
  const attendanceCount = useMemo(() => sampleAttendance.filter((a) => a.employeeId === employeeId).length, [employeeId]);
  const schedule = sampleSchedules.find((s) => s.id === form?.scheduleId);

  if (!original) {
    return (
      <div style={{ padding: 32 }}>
        <p style={{ color: tokens.inkMuted }}>No such entry in the register.</p>
        <Link to="/employees" style={{ color: tokens.forest }}>Back to Employees</Link>
      </div>
    );
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  function handleSave() { setEditing(false); }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 880 }}>
      <button onClick={() => navigate("/employees")} style={{ background: "none", border: "none", color: tokens.inkMuted, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 18 }}>
        ‹ Back to Employees
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontFamily: mono, fontSize: 11, color: tokens.inkMuted, margin: "0 0 4px" }}>
            EMPLOYEE No. {String(employeeId).padStart(3, "0")}
          </p>
          <h1 style={{ fontFamily: serifDisplay, fontSize: 26, fontWeight: 600, margin: 0 }}>{form.name}</h1>
          <p style={{ fontSize: 13.5, color: tokens.inkMuted, margin: "4px 0 0" }}>{form.jobPosition} — {form.department}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <StatusBadge status={form.status} />
          {canEditHrData && !editing && <button style={buttonSecondary} onClick={() => setEditing(true)}>Edit</button>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 26, margin: "22px 0 26px", paddingBottom: 4, borderBottom: `1px solid ${tokens.rule}` }}>
        <SmartButton label="Contracts" count={contractCount} to={`/contracts?employee=${employeeId}`} />
        <SmartButton label="Attendance" count={attendanceCount} to={`/attendance?employee=${employeeId}`} />
        <SmartButton label="Time off" count={0} to="#" disabled />
        <SmartButton label="Allocations" count={0} to="#" disabled />
      </div>

      <h2 style={{ fontFamily: serifDisplay, fontSize: 16, fontWeight: 600, margin: "0 0 14px" }}>Particulars</h2>

      {!editing ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18, paddingBottom: 24, borderBottom: `1px solid ${tokens.rule}` }}>
          <Field label="Email" value={form.email} />
          <Field label="Job position" value={form.jobPosition} />
          <Field label="Department" value={form.department} />
          <Field label="Manager" value={form.manager} />
          <Field label="Working schedule" value={schedule ? `${schedule.name} (${schedule.type})` : "—"} />
          <Field label="Status" value={form.status} />
        </div>
      ) : (
        <div style={{ paddingBottom: 24, borderBottom: `1px solid ${tokens.rule}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 14 }}>
            <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Email
              <input style={inputStyle} value={form.email} onChange={set("email")} /></label>
            <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Job position
              <input style={inputStyle} value={form.jobPosition} onChange={set("jobPosition")} /></label>
            <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Department
              <select style={inputStyle} value={form.department} onChange={set("department")}>
                {departments.map((d) => <option key={d}>{d}</option>)}
              </select></label>
            <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Manager
              <input style={inputStyle} value={form.manager} onChange={set("manager")} /></label>
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
            <button style={buttonPrimary} onClick={handleSave}>Save changes</button>
            <button style={buttonSecondary} onClick={() => { setForm(original); setEditing(false); }}>Cancel</button>
          </div>
        </div>
      )}

      {activeContract && (
        <>
          <h2 style={{ fontFamily: serifDisplay, fontSize: 16, fontWeight: 600, margin: "24px 0 14px" }}>Active contract</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 18 }}>
            <Field label="Position" value={activeContract.position} />
            <Field label="Start date" value={activeContract.startDate} mono />
            <Field label="Wage" value={`₹${activeContract.wage.toLocaleString("en-IN")}`} mono />
            <Field label="Salary structure" value={activeContract.salaryStructure} />
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, value, mono: useMono }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: tokens.inkMuted, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 14, margin: "4px 0 0", fontFamily: useMono ? "'IBM Plex Mono', monospace" : undefined }}>{value || "—"}</p>
    </div>
  );
}
