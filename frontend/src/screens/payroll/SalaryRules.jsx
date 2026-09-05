import React, { useEffect, useState } from "react";
import { tokens, panelStyle, buttonPrimary, buttonSecondary, inputStyle, labelStyle } from "../../tokens";
import { payrollApi } from "../../api/payrollApi";

const COMPUTATION_TYPES = ["fixed", "percentage", "formula"];
const CATEGORIES = ["basic", "allowance", "gross", "deduction", "net"];

const emptyForm = {
  code: "", name: "", category: "basic", sequence: 10,
  computation_type: "fixed", amount: "", percentage: "", percentage_of_code: "", formula: "",
};

export default function SalaryRules() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    payrollApi.listSalaryRules().then(setRules).finally(() => setLoading(false));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const payload = { ...form, sequence: Number(form.sequence) };
    // Only send the field relevant to the chosen computation type — mirrors
    // the model's own clean() validation, so the error (if any) is clear.
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
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, color: tokens.ink, margin: "0 0 16px" }}>
        Salary rules
      </h1>

      <div style={{ ...panelStyle, marginBottom: 20 }}>
        {loading ? (
          <p style={{ color: tokens.inkMuted, fontSize: 13 }}>Loading...</p>
        ) : rules.length === 0 ? (
          <p style={{ color: tokens.inkMuted, fontSize: 13 }}>No salary rules yet. Add one below.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: tokens.inkMuted }}>
                <th style={{ padding: "6px 8px" }}>Code</th>
                <th style={{ padding: "6px 8px" }}>Name</th>
                <th style={{ padding: "6px 8px" }}>Category</th>
                <th style={{ padding: "6px 8px" }}>Sequence</th>
                <th style={{ padding: "6px 8px" }}>Type</th>
                <th style={{ padding: "6px 8px" }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {rules.sort((a, b) => a.sequence - b.sequence).map((r) => (
                <tr key={r.id} style={{ borderTop: `1px solid ${tokens.border}` }}>
                  <td style={{ padding: "8px" }}>{r.code}</td>
                  <td style={{ padding: "8px" }}>{r.name}</td>
                  <td style={{ padding: "8px" }}>{r.category}</td>
                  <td style={{ padding: "8px" }}>{r.sequence}</td>
                  <td style={{ padding: "8px" }}>{r.computation_type}</td>
                  <td style={{ padding: "8px", color: tokens.inkMuted }}>
                    {r.computation_type === "fixed" && r.amount}
                    {r.computation_type === "percentage" && `${r.percentage}% of ${r.percentage_of_code}`}
                    {r.computation_type === "formula" && r.formula}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={panelStyle}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: tokens.ink, margin: "0 0 14px" }}>
          Add a salary rule
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Code</label>
              <input style={inputStyle} value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
            </div>
            <div>
              <label style={labelStyle}>Name</label>
              <input style={inputStyle} value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={inputStyle} value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Sequence</label>
              <input type="number" style={inputStyle} value={form.sequence}
                onChange={(e) => setForm({ ...form, sequence: e.target.value })} required />
            </div>
            <div>
              <label style={labelStyle}>Computation type</label>
              <select style={inputStyle} value={form.computation_type}
                onChange={(e) => setForm({ ...form, computation_type: e.target.value })}>
                {COMPUTATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {form.computation_type === "fixed" && (
              <div>
                <label style={labelStyle}>Amount</label>
                <input type="number" style={inputStyle} value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
            )}
            {form.computation_type === "percentage" && (
              <>
                <div>
                  <label style={labelStyle}>Percentage</label>
                  <input type="number" style={inputStyle} value={form.percentage}
                    onChange={(e) => setForm({ ...form, percentage: e.target.value })} required />
                </div>
                <div>
                  <label style={labelStyle}>Percentage of code</label>
                  <input style={inputStyle} placeholder="e.g. BASIC" value={form.percentage_of_code}
                    onChange={(e) => setForm({ ...form, percentage_of_code: e.target.value.toUpperCase() })} required />
                </div>
              </>
            )}
            {form.computation_type === "formula" && (
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Formula</label>
                <input style={inputStyle} placeholder="e.g. GROSS - PF" value={form.formula}
                  onChange={(e) => setForm({ ...form, formula: e.target.value.toUpperCase() })} required />
              </div>
            )}
          </div>

          {error && <div style={{ color: tokens.red, fontSize: 12, marginBottom: 10 }}>{error}</div>}
          <button type="submit" style={buttonPrimary}>Add rule</button>
        </form>
      </div>
    </div>
  );
}
