import React, { useEffect, useState } from "react";
import { tokens, mono, panelStyle, buttonPrimary, inputStyle, labelStyle } from "../../tokens";
import { payrollApi } from "../../api/payrollApi";

export default function SalaryStructures() {
  const [structures, setStructures] = useState([]);
  const [allRules, setAllRules] = useState([]);
  const [name, setName] = useState("");
  const [payFrequency, setPayFrequency] = useState("monthly");
  const [selectedRuleIds, setSelectedRuleIds] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);
  function load() {
    payrollApi.listSalaryStructures().then(setStructures);
    payrollApi.listSalaryRules().then(setAllRules);
  }

  function toggleRule(id) {
    setSelectedRuleIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await payrollApi.createSalaryStructure({ name, pay_frequency: payFrequency, active: true, rule_ids: selectedRuleIds });
      setName("");
      setSelectedRuleIds([]);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 850 }}>
      <h2 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 600 }}>Salary Structures</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {structures.map((s) => (
          <div key={s.id} style={panelStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <strong style={{ fontSize: 14 }}>{s.name}</strong>
              <span style={{ fontFamily: mono, fontSize: 11, color: tokens.inkMuted }}>{s.pay_frequency}</span>
            </div>
            <div style={{ fontFamily: mono, fontSize: 12, color: tokens.inkMuted }}>
              {s.rules.sort((a, b) => a.sequence - b.sequence).map((r) => r.code).join(" → ")}
            </div>
          </div>
        ))}
        {structures.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 13 }}>No structures yet.</p>}
      </div>

      <form onSubmit={handleSubmit} style={panelStyle}>
        <h3 style={{ margin: "0 0 12px", fontSize: 13.5 }}>Create a structure</h3>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Name<span style={{ color: tokens.oxblood, marginLeft: 3 }}>*</span></label>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Pay frequency</label>
          <select style={{ ...inputStyle, width: 200 }} value={payFrequency} onChange={(e) => setPayFrequency(e.target.value)}>
            <option value="monthly">Monthly</option>
            <option value="biweekly">Biweekly</option>
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Rules (computation order)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
            {allRules.sort((a, b) => a.sequence - b.sequence).map((r) => (
              <label key={r.id} style={{
                display: "flex", alignItems: "center", gap: 6, fontFamily: mono, fontSize: 12,
                border: `1px solid ${tokens.rule}`, borderRadius: 3, padding: "5px 9px", cursor: "pointer",
                background: selectedRuleIds.includes(r.id) ? tokens.forestTint : "transparent",
              }}>
                <input type="checkbox" checked={selectedRuleIds.includes(r.id)} onChange={() => toggleRule(r.id)} />
                {r.code}
              </label>
            ))}
          </div>
        </div>
        {error && <div style={{ color: tokens.oxblood, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button type="submit" style={buttonPrimary}>Create structure</button>
      </form>
    </div>
  );
}
