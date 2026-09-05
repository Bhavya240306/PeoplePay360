import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { tokens, serifDisplay, mono, buttonPrimary, buttonSecondary, inputStyle } from "../tokens";
import { useRole } from "../contexts/RoleContext";
import { sampleContracts, sampleEmployees, salaryStructureOptions, departments } from "../sampleData";
import StatusBadge from "../components/StatusBadge";

function employeeName(id) { return sampleEmployees.find((e) => e.id === id)?.name || "Unknown"; }

function ContractForm({ contracts, onCancel, onSubmit, defaultEmployeeId }) {
  const [form, setForm] = useState({
    employeeId: defaultEmployeeId || sampleEmployees[0].id, department: departments[0], position: "",
    startDate: "", endDate: "", wage: "", salaryStructure: salaryStructureOptions[0], status: "Draft",
  });
  const [warning, setWarning] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function handleSubmit() {
    const hasActive = contracts.some((c) => c.employeeId === Number(form.employeeId) && c.status === "Active");
    if (form.status === "Active" && hasActive) {
      setWarning(`${employeeName(Number(form.employeeId))} already holds an active contract. Expire it before activating a new one.`);
      return;
    }
    onSubmit({ ...form, employeeId: Number(form.employeeId), wage: Number(form.wage) || 0 });
  }

  return (
    <div style={{ border: `1px solid ${tokens.rule}`, background: tokens.surface, padding: "18px 20px", marginBottom: 24 }}>
      <h2 style={{ fontFamily: serifDisplay, fontSize: 17, fontWeight: 600, margin: "0 0 14px" }}>New entry — Contract</h2>
      {warning && (
        <div style={{ borderLeft: `3px solid ${tokens.oxblood}`, background: tokens.oxbloodTint, color: tokens.oxblood, fontSize: 12.5, padding: "8px 12px", marginBottom: 14 }}>
          {warning}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 14 }}>
        <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Employee
          <select style={inputStyle} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
            {sampleEmployees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select></label>
        <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Department
          <select style={inputStyle} value={form.department} onChange={set("department")}>
            {departments.map((d) => <option key={d}>{d}</option>)}
          </select></label>
        <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Position
          <input style={inputStyle} value={form.position} onChange={set("position")} /></label>
        <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Start date
          <input style={inputStyle} type="date" value={form.startDate} onChange={set("startDate")} /></label>
        <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>End date (optional)
          <input style={inputStyle} type="date" value={form.endDate} onChange={set("endDate")} /></label>
        <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Wage (monthly, ₹)
          <input style={inputStyle} type="number" value={form.wage} onChange={set("wage")} /></label>
        <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Salary structure
          <select style={inputStyle} value={form.salaryStructure} onChange={set("salaryStructure")}>
            {salaryStructureOptions.map((s) => <option key={s}>{s}</option>)}
          </select></label>
        <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Status
          <select style={inputStyle} value={form.status} onChange={set("status")}>
            <option>Draft</option><option>Active</option><option>Expired</option>
          </select></label>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button style={buttonPrimary} onClick={handleSubmit} disabled={!form.position || !form.startDate}>Log contract</button>
        <button style={buttonSecondary} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default function Contracts() {
  const [searchParams] = useSearchParams();
  const { canEditHrData } = useRole();
  const employeeFilter = searchParams.get("employee") ? Number(searchParams.get("employee")) : null;

  const [contracts, setContracts] = useState(sampleContracts);
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => (employeeFilter ? contracts.filter((c) => c.employeeId === employeeFilter) : contracts), [contracts, employeeFilter]);
  const sorted = useMemo(() => [...filtered].sort((a, b) => (a.status === "Active" ? -1 : b.status === "Active" ? 1 : 0)), [filtered]);

  function handleCreate(form) {
    setContracts((cs) => [{ id: Math.max(...cs.map((c) => c.id)) + 1, ...form }, ...cs]);
    setShowForm(false);
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1080 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: serifDisplay, fontSize: 26, fontWeight: 600, margin: 0 }}>Contracts</h1>
          <p style={{ fontFamily: mono, fontSize: 12, color: tokens.inkMuted, margin: "5px 0 0" }}>
            {employeeFilter ? `Filtered to ${employeeName(employeeFilter)}` : `${String(contracts.length).padStart(3, "0")} on record`}
          </p>
        </div>
        {canEditHrData && !showForm && <button style={buttonPrimary} onClick={() => setShowForm(true)}>New contract</button>}
      </div>

      {showForm && <ContractForm contracts={contracts} defaultEmployeeId={employeeFilter} onCancel={() => setShowForm(false)} onSubmit={handleCreate} />}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
        <thead>
          <tr style={{ textAlign: "left", color: tokens.inkMuted, fontSize: 11.5 }}>
            <th style={{ padding: "6px 8px", fontWeight: 500 }}>Employee</th>
            <th style={{ padding: "6px 8px", fontWeight: 500 }}>Position</th>
            <th style={{ padding: "6px 8px", fontWeight: 500 }}>Department</th>
            <th style={{ padding: "6px 8px", fontWeight: 500 }}>Start</th>
            <th style={{ padding: "6px 8px", fontWeight: 500 }}>End</th>
            <th style={{ padding: "6px 8px", fontWeight: 500 }}>Wage</th>
            <th style={{ padding: "6px 8px", fontWeight: 500 }}>Structure</th>
            <th style={{ padding: "6px 8px", fontWeight: 500 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr key={c.id} style={{
              borderTop: `1px solid ${tokens.rule}`,
              borderLeft: c.status === "Active" ? `3px solid ${tokens.forest}` : "3px solid transparent",
            }}>
              <td style={{ padding: "10px 8px", fontWeight: c.status === "Active" ? 600 : 400 }}>{employeeName(c.employeeId)}</td>
              <td style={{ padding: "10px 8px" }}>{c.position}</td>
              <td style={{ padding: "10px 8px" }}>{c.department}</td>
              <td style={{ padding: "10px 8px", fontFamily: mono, fontSize: 12.5 }}>{c.startDate}</td>
              <td style={{ padding: "10px 8px", fontFamily: mono, fontSize: 12.5 }}>{c.endDate || "—"}</td>
              <td style={{ padding: "10px 8px", fontFamily: mono, fontSize: 12.5 }}>₹{c.wage.toLocaleString("en-IN")}</td>
              <td style={{ padding: "10px 8px" }}>{c.salaryStructure}</td>
              <td style={{ padding: "10px 8px" }}><StatusBadge status={c.status} /></td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr><td colSpan={8} style={{ padding: "20px 8px", color: tokens.inkMuted, textAlign: "center" }}>No contracts found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
