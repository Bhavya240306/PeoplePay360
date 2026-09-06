import React, { useEffect, useState } from "react";
import { tokens, mono, panelStyle, buttonPrimary, inputStyle, labelStyle } from "../../tokens";
import { timeoffApi } from "../../api/timeoffApi";

export default function TimeOffTypes() {
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({ name: "", requires_allocation: true, requires_approval: true, affects_payroll: false, is_active: true });
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);
  function load() { timeoffApi.listTypes().then(setTypes); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await timeoffApi.createType(form);
      setForm({ name: "", requires_allocation: true, requires_approval: true, affects_payroll: false, is_active: true });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 800 }}>
      <h2 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 600 }}>Time Off Types</h2>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", fontFamily: mono, fontSize: 10.5, color: tokens.inkMuted, borderBottom: `1px solid ${tokens.ruleStrong}`, paddingBottom: 6 }}>
          <div style={{ flex: 2 }}>Name</div>
          <div style={{ flex: 1 }}>Allocation?</div>
          <div style={{ flex: 1 }}>Approval?</div>
          <div style={{ flex: 1 }}>Affects payroll?</div>
        </div>
        {types.map((t) => (
          <div key={t.id} style={{ display: "flex", padding: "9px 0", borderBottom: `1px solid ${tokens.rule}`, fontSize: 13.5 }}>
            <div style={{ flex: 2 }}>{t.name}</div>
            <div style={{ flex: 1, color: tokens.inkMuted }}>{t.requires_allocation ? "Yes" : "No"}</div>
            <div style={{ flex: 1, color: tokens.inkMuted }}>{t.requires_approval ? "Yes" : "No"}</div>
            <div style={{ flex: 1, color: tokens.inkMuted }}>{t.affects_payroll ? "Yes" : "No"}</div>
          </div>
        ))}
        {types.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 13, padding: "16px 0" }}>No types defined.</p>}
      </div>

      <form onSubmit={handleSubmit} style={panelStyle}>
        <h3 style={{ margin: "0 0 12px", fontSize: 13.5 }}>New type</h3>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Name</label>
          <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        {["requires_allocation", "requires_approval", "affects_payroll"].map((key) => (
          <label key={key} style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 6, marginBottom: 8, textTransform: "capitalize" }}>
            <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
            {key.replace(/_/g, " ")}
          </label>
        ))}
        {error && <div style={{ color: tokens.oxblood, fontSize: 12, margin: "10px 0" }}>{error}</div>}
        <button type="submit" style={{ ...buttonPrimary, marginTop: 6 }}>Create type</button>
      </form>
    </div>
  );
}
