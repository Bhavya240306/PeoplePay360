import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { tokens, mono, panelStyle, buttonPrimary, buttonSecondary, inputStyle, labelStyle, overlayStyle, numeral } from "../../tokens";
import StatusBadge from "../../components/StatusBadge";
import { payrollApi } from "../../api/payrollApi";
import { coreApi } from "../../api/coreApi";

export default function Payruns() {
  const [payruns, setPayruns] = useState([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);
  function load() { payrollApi.listPayruns().then(setPayruns); }

  async function handleGenerateMonthly() {
    setGenerating(true);
    setMessage("");
    try {
      const res = await payrollApi.generateMonthlyPayruns();
      setMessage(`Generated/updated ${res.count} payrun(s) for this month.`);
      load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Payruns</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={buttonSecondary} onClick={handleGenerateMonthly} disabled={generating}>
            {generating ? "Generating…" : "Generate this month's payslips"}
          </button>
          <button style={buttonPrimary} onClick={() => setWizardOpen(true)}>+ New pay run</button>
        </div>
      </div>
      {message && <p style={{ fontSize: 12, color: tokens.inkMuted, marginBottom: 14 }}>{message}</p>}

      <div>
        {payruns.map((p) => (
          <div
            key={p.id}
            onClick={() => navigate(`/payroll/payruns/${p.id}`)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${tokens.rule}`, cursor: "pointer" }}
          >
            <div>
              <strong style={{ fontSize: 14 }}>{p.name}</strong>
              <div style={{ fontFamily: mono, fontSize: 11.5, color: tokens.inkMuted, marginTop: 2 }}>
                {p.period_start} – {p.period_end} · {p.employee_ids.length} employee(s)
              </div>
            </div>
            <StatusBadge status={p.status} />
          </div>
        ))}
        {payruns.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 13, padding: "16px 0" }}>No payruns yet.</p>}
      </div>

      {wizardOpen && (
        <PayrunWizard onClose={() => setWizardOpen(false)} onCreated={(id) => { setWizardOpen(false); load(); navigate(`/payroll/payruns/${id}`); }} />
      )}
    </div>
  );
}

function PayrunWizard({ onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [structures, setStructures] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [structureId, setStructureId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [name, setName] = useState("");
  const [payrunId, setPayrunId] = useState(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    payrollApi.listSalaryStructures().then(setStructures);
    coreApi.listEmployees().then(setEmployees);
  }, []);

  async function handleContinue(e) {
    e.preventDefault();
    setError("");
    try {
      const payrun = await payrollApi.createPayrun({ name, salary_structure: Number(structureId), period_start: periodStart, period_end: periodEnd });
      setPayrunId(payrun.id);
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleEmployee(id) {
    setSelectedEmployeeIds((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
  }

  async function handleCreate() {
    setError("");
    if (selectedEmployeeIds.length === 0) { setError("Select at least one employee."); return; }
    try {
      await payrollApi.selectEmployees(payrunId, selectedEmployeeIds);
      onCreated(payrunId);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={{ ...panelStyle, width: 460, maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>{step === 1 ? "New pay run — scope" : "Select employees"}</h3>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: tokens.inkMuted }}>✕</button>
        </div>

        {step === 1 && (
          <form onSubmit={handleContinue}>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Name<span style={{ color: tokens.oxblood, marginLeft: 3 }}>*</span></label>
              <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. February 2026" required />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Salary structure<span style={{ color: tokens.oxblood, marginLeft: 3 }}>*</span></label>
              <select style={inputStyle} value={structureId} onChange={(e) => setStructureId(e.target.value)} required>
                <option value="">Select…</option>
                {structures.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Period start<span style={{ color: tokens.oxblood, marginLeft: 3 }}>*</span></label>
                <input type="date" style={inputStyle} value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Period end<span style={{ color: tokens.oxblood, marginLeft: 3 }}>*</span></label>
                <input type="date" style={inputStyle} value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
              </div>
            </div>
            {error && <div style={{ color: tokens.oxblood, fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <button type="submit" style={buttonPrimary}>Continue</button>
          </form>
        )}

        {step === 2 && (
          <div>
            <p style={{ fontSize: 12, color: tokens.inkMuted, marginBottom: 12 }}>
              The pay run is created only after employees are selected below.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16, maxHeight: 260, overflowY: "auto" }}>
              {employees.map((emp) => (
                <label key={emp.id} style={{
                  display: "flex", alignItems: "center", gap: 8, fontSize: 13,
                  border: `1px solid ${tokens.rule}`, borderRadius: 3, padding: "8px 10px",
                  background: selectedEmployeeIds.includes(emp.id) ? tokens.forestTint : "transparent",
                }}>
                  <input type="checkbox" checked={selectedEmployeeIds.includes(emp.id)} onChange={() => toggleEmployee(emp.id)} />
                  {emp.first_name} {emp.last_name} <span style={{ ...numeral, color: tokens.inkMuted, fontSize: 11.5 }}>({emp.employee_id})</span>
                </label>
              ))}
              {employees.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 13 }}>No employees found.</p>}
            </div>
            {error && <div style={{ color: tokens.oxblood, fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <button style={buttonPrimary} onClick={handleCreate}>Create pay run</button>
          </div>
        )}
      </div>
    </div>
  );
}
