import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { tokens, panelStyle, buttonPrimary, buttonSecondary, inputStyle, labelStyle, statusBadgeProps } from "../../tokens";
import { payrollApi, coreApi } from "../../api/payrollApi";

export default function Payruns() {
  const [payruns, setPayruns] = useState([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);
  function load() {
    payrollApi.listPayruns().then(setPayruns);
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: tokens.ink, margin: 0 }}>Payruns</h1>
        <button style={buttonPrimary} onClick={() => setWizardOpen(true)}>New pay run</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {payruns.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 13 }}>No payruns yet.</p>}
        {payruns.map((p) => (
          <div
            key={p.id}
            style={{ ...panelStyle, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            onClick={() => navigate(`/payroll/payruns/${p.id}`)}
          >
            <div>
              <strong style={{ fontSize: 14, color: tokens.ink }}>{p.name}</strong>
              <div style={{ fontSize: 12, color: tokens.inkMuted, marginTop: 2 }}>
                {p.period_start} – {p.period_end} · {p.employee_ids.length} employee(s)
              </div>
            </div>
            <span style={statusBadgeProps(p.status)}>{p.status}</span>
          </div>
        ))}
      </div>

      {wizardOpen && (
        <PayrunWizard
          onClose={() => setWizardOpen(false)}
          onCreated={(id) => { setWizardOpen(false); load(); navigate(`/payroll/payruns/${id}`); }}
        />
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

  // Step 1 -> "Continue" only creates the SCOPE (draft, no employees yet).
  // Per the brief: the Payrun isn't really "created" until employees are
  // selected in Step 2 — this mirrors that exactly, not just visually.
  async function handleContinue(e) {
    e.preventDefault();
    setError("");
    try {
      const payrun = await payrollApi.createPayrun({
        name, salary_structure: Number(structureId),
        period_start: periodStart, period_end: periodEnd,
      });
      setPayrunId(payrun.id);
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleEmployee(id) {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }

  // "Create Payrun" — the real creation moment, per the brief.
  async function handleCreate() {
    setError("");
    if (selectedEmployeeIds.length === 0) {
      setError("Select at least one employee.");
      return;
    }
    try {
      await payrollApi.selectEmployees(payrunId, selectedEmployeeIds);
      onCreated(payrunId);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(27,43,34,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
    }}>
      <div style={{ ...panelStyle, width: 480, maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: tokens.ink, margin: 0 }}>
            {step === 1 ? "New pay run — scope" : "Select employees"}
          </h2>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: tokens.inkMuted }}>✕</button>
        </div>

        {step === 1 && (
          <form onSubmit={handleContinue}>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Name</label>
              <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. February 2026" required />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Salary structure</label>
              <select style={inputStyle} value={structureId} onChange={(e) => setStructureId(e.target.value)} required>
                <option value="">Select...</option>
                {structures.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Period start</label>
                <input type="date" style={inputStyle} value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Period end</label>
                <input type="date" style={inputStyle} value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)} required />
              </div>
            </div>
            {error && <div style={{ color: tokens.red, fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <button type="submit" style={buttonPrimary}>Continue</button>
          </form>
        )}

        {step === 2 && (
          <div>
            <p style={{ fontSize: 12, color: tokens.inkMuted, marginBottom: 12 }}>
              The pay run is created only after you select employees below.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16, maxHeight: 260, overflowY: "auto" }}>
              {employees.map((emp) => (
                <label key={emp.id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  border: `1px solid ${tokens.border}`, borderRadius: 6, padding: "8px 10px", fontSize: 13,
                  background: selectedEmployeeIds.includes(emp.id) ? tokens.primaryTint : tokens.surface,
                }}>
                  <input type="checkbox" checked={selectedEmployeeIds.includes(emp.id)}
                    onChange={() => toggleEmployee(emp.id)} />
                  {emp.first_name} {emp.last_name} <span style={{ color: tokens.inkMuted }}>({emp.employee_id})</span>
                </label>
              ))}
              {employees.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 13 }}>No employees found.</p>}
            </div>
            {error && <div style={{ color: tokens.red, fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <button style={buttonPrimary} onClick={handleCreate}>Create pay run</button>
          </div>
        )}
      </div>
    </div>
  );
}
