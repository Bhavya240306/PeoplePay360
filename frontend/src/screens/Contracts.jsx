import React, { useEffect, useState } from "react";
import { tokens, mono, panelStyle, buttonPrimary, inputStyle, labelStyle, numeral, overlayStyle } from "../tokens";
import StatusBadge from "../components/StatusBadge";
import { coreApi } from "../api/coreApi";

const emptyForm = {
  employee: "", contract_type: "Full-time", start_date: "", end_date: "",
  basic_salary: "", working_hours_per_week: 40, is_active: true,
};

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);
  function load() {
    coreApi.listContracts().then(setContracts);
    coreApi.listEmployees().then(setEmployees);
  }

  function employeeName(empId) {
    const e = employees.find((x) => x.id === empId);
    return e ? `${e.first_name} ${e.last_name}` : `#${empId}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await coreApi.createContract({ ...form, employee: Number(form.employee) });
      setForm(emptyForm);
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
        <button style={buttonPrimary} onClick={() => setShowForm(true)}>+ New contract</button>
      </div>

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

      {showForm && (
        <div style={overlayStyle}>
          <form onSubmit={handleSubmit} style={{ ...panelStyle, width: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>New contract</h3>
              <button type="button" onClick={() => setShowForm(false)} style={{ border: "none", background: "none", cursor: "pointer", color: tokens.inkMuted }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Employee</label>
                <select style={inputStyle} value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} required>
                  <option value="">Select…</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Contract type</label>
                <input style={inputStyle} value={form.contract_type} onChange={(e) => setForm({ ...form, contract_type: e.target.value })} required />
              </div>
              <div>
                <label style={labelStyle}>Start date</label>
                <input type="date" style={inputStyle} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
              </div>
              <div>
                <label style={labelStyle}>End date (blank = ongoing)</label>
                <input type="date" style={inputStyle} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Basic salary</label>
                <input type="number" style={inputStyle} value={form.basic_salary} onChange={(e) => setForm({ ...form, basic_salary: e.target.value })} required />
              </div>
              <div>
                <label style={labelStyle}>Hours / week</label>
                <input type="number" style={inputStyle} value={form.working_hours_per_week} onChange={(e) => setForm({ ...form, working_hours_per_week: e.target.value })} />
              </div>
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
