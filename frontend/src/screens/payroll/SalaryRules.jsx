import React, { useEffect, useState } from "react";
import { tokens, mono, panelStyle, buttonPrimary, inputStyle, labelStyle, numeral } from "../../tokens";
import { payrollApi } from "../../api/payrollApi";

const TYPES = ["fixed", "percentage", "formula"];
const CATEGORIES = ["basic", "allowance", "gross", "deduction", "net"];
const emptyForm = { code: "", name: "", category: "basic", sequence: 10, computation_type: "fixed", amount: "", percentage: "", percentage_of_code: "", formula: "" };

export default function SalaryRules() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);
  function load() { payrollApi.listSalaryRules().then(setRules); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const payload = { ...form, sequence: Number(form.sequence) };
    if (payload.computation_type !== "fixed") payload.amount = null;
    if (payload.computation_type !== "percentage") { payload.percentage = null; payload.percentage_of_code = ""; }
    if (payload.computation_type !== "formula") payload.formula = "";
    try {
      await payrollApi.createSalaryRule(payload);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900 }}>
      <h2 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 600 }}>Salary Rules</h2>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", fontFamily: mono, fontSize: 10.5, color: tokens.inkMuted, borderBottom: `1px solid ${tokens.ruleStrong}`, paddingBottom: 6 }}>
          <div style={{ width: 40 }}>Seq</div>
          <div style={{ flex: 1 }}>Code</div>
          <div style={{ flex: 1.4 }}>Name</div>
          <div style={{ flex: 1 }}>Category</div>
          <div style={{ flex: 1.6 }}>Value</div>
        </div>
        {rules.sort((a, b) => a.sequence - b.sequence).map((r) => (
          <div key={r.id} style={{ display: "flex", padding: "9px 0", borderBottom: `1px solid ${tokens.rule}`, fontSize: 13.5 }}>
            <div style={{ width: 40, ...numeral, color: tokens.inkMuted }}>{String(r.sequence).padStart(2, "0")}</div>
            <div style={{ flex: 1, ...numeral }}>{r.code}</div>
            <div style={{ flex: 1.4 }}>{r.name}</div>
            <div style={{ flex: 1, color: tokens.inkMuted }}>{r.category}</div>
            <div style={{ flex: 1.6, ...numeral, fontSize: 12.5, color: tokens.inkMuted }}>
              {r.computation_type === "fixed" && `₹${r.amount}`}
              {r.computation_type === "percentage" && `${r.percentage}% of ${r.percentage_of_code}`}
              {r.computation_type === "formula" && r.formula}
            </div>
          </div>
        ))}
        {rules.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 13, padding: "16px 0" }}>No rules defined.</p>}
      </div>

      <form onSubmit={handleSubmit} style={panelStyle}>
        <h3 style={{ margin: "0 0 12px", fontSize: 13.5 }}>Add a rule</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Code</label>
            <input style={inputStyle} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
          </div>
          <div>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select style={inputStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Sequence</label>
            <input type="number" style={inputStyle} value={form.sequence} onChange={(e) => setForm({ ...form, sequence: e.target.value })} required />
          </div>
          <div>
            <label style={labelStyle}>Computation type</label>
            <select style={inputStyle} value={form.computation_type} onChange={(e) => setForm({ ...form, computation_type: e.target.value })}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {form.computation_type === "fixed" && (
            <div>
              <label style={labelStyle}>Amount</label>
              <input type="number" style={inputStyle} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
          )}
          {form.computation_type === "percentage" && (
            <>
              <div>
                <label style={labelStyle}>Percentage</label>
                <input type="number" style={inputStyle} value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })} required />
              </div>
              <div>
                <label style={labelStyle}>Percentage of code</label>
                <input style={inputStyle} placeholder="e.g. BASIC" value={form.percentage_of_code} onChange={(e) => setForm({ ...form, percentage_of_code: e.target.value.toUpperCase() })} required />
              </div>
            </>
          )}
          {form.computation_type === "formula" && (
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Formula</label>
              <input style={inputStyle} placeholder="e.g. GROSS - PF" value={form.formula} onChange={(e) => setForm({ ...form, formula: e.target.value.toUpperCase() })} required />
            </div>
          )}
        </div>
        {error && <div style={{ color: tokens.oxblood, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button type="submit" style={buttonPrimary}>Add rule</button>
      </form>
    </div>
  );
}
