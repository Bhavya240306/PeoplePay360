import React, { useEffect, useState } from "react";
import { tokens, panelStyle, buttonPrimary, inputStyle, labelStyle } from "../../tokens";
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
    setSelectedRuleIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await payrollApi.createSalaryStructure({
        name, pay_frequency: payFrequency, active: true, rule_ids: selectedRuleIds,
      });
      setName("");
      setSelectedRuleIds([]);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, color: tokens.ink, margin: "0 0 16px" }}>
        Salary structures
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {structures.length === 0 && (
          <p style={{ color: tokens.inkMuted, fontSize: 13 }}>No structures yet.</p>
        )}
        {structures.map((s) => (
          <div key={s.id} style={panelStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <strong style={{ fontSize: 14, color: tokens.ink }}>{s.name}</strong>
              <span style={{ fontSize: 12, color: tokens.inkMuted }}>{s.pay_frequency}</span>
            </div>
            <div style={{ fontSize: 12, color: tokens.inkMuted }}>
              {s.rules.sort((a, b) => a.sequence - b.sequence).map((r) => r.code).join(" → ")}
            </div>
          </div>
        ))}
      </div>

      <div style={panelStyle}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: tokens.ink, margin: "0 0 14px" }}>
          Create a structure
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Pay frequency</label>
            <select style={{ ...inputStyle, width: 200 }} value={payFrequency}
              onChange={(e) => setPayFrequency(e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="biweekly">Biweekly</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Rules (in computation order)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {allRules.sort((a, b) => a.sequence - b.sequence).map((r) => (
                <label
                  key={r.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    border: `1px solid ${tokens.border}`, borderRadius: 6,
                    padding: "6px 10px", fontSize: 12, cursor: "pointer",
                    background: selectedRuleIds.includes(r.id) ? tokens.primaryTint : tokens.surface,
                  }}
                >
                  <input type="checkbox" checked={selectedRuleIds.includes(r.id)}
                    onChange={() => toggleRule(r.id)} />
                  {r.code}
                </label>
              ))}
            </div>
          </div>
          {error && <div style={{ color: tokens.red, fontSize: 12, marginBottom: 10 }}>{error}</div>}
          <button type="submit" style={buttonPrimary}>Create structure</button>
        </form>
      </div>
    </div>
  );
}
