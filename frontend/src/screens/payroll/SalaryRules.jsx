import React, { useEffect, useState } from "react";
import { tokens, mono, panelStyle, buttonPrimary, inputStyle, numeral } from "../../tokens";
import Field, { fieldInputStyle } from "../../components/Field";
import { payrollApi } from "../../api/payrollApi";
import { validateRuleCode, validateRequired, validateNonNegative, runValidators, hasErrors, HINTS } from "../../validators";

const TYPES = ["fixed", "percentage", "formula"];
const CATEGORIES = ["basic", "allowance", "gross", "deduction", "net"];
const emptyForm = { code: "", name: "", category: "basic", computation_type: "fixed", amount: "", percentage: "", percentage_of_code: "", formula: "" };

export default function SalaryRules() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);
  function load() { payrollApi.listSalaryRules().then(setRules); }

  function handleChange(key, value) {
    setForm({ ...form, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  }

  function validateAll() {
    const map = { code: validateRuleCode, name: validateRequired };
    if (form.computation_type === "fixed") map.amount = validateNonNegative;
    if (form.computation_type === "percentage") {
      map.percentage = validateNonNegative;
      map.percentage_of_code = validateRequired;
    }
    if (form.computation_type === "formula") map.formula = validateRequired;
    return runValidators(form, map);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fieldErrors = validateAll();
    setErrors(fieldErrors);
    if (hasErrors(fieldErrors)) return;

    const payload = { ...form };
    if (payload.computation_type !== "fixed") payload.amount = null;
    if (payload.computation_type !== "percentage") { payload.percentage = null; payload.percentage_of_code = ""; }
    if (payload.computation_type !== "formula") payload.formula = "";
    try {
      await payrollApi.createSalaryRule(payload);
      setForm(emptyForm);
      setErrors({});
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
          <Field label="Code" required hint={HINTS.ruleCode} error={errors.code}>
            <input style={fieldInputStyle(!!errors.code)} value={form.code} onChange={(e) => handleChange("code", e.target.value.toUpperCase())} />
          </Field>
          <Field label="Name" required error={errors.name}>
            <input style={fieldInputStyle(!!errors.name)} value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
          </Field>
          <Field
            label="Category"
            hint="Determines computation order: Basic → Allowance → Gross → Deduction → Net. Sequence is assigned automatically within that priority."
          >
            <select style={inputStyle} value={form.category} onChange={(e) => handleChange("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Computation type">
            <select style={inputStyle} value={form.computation_type} onChange={(e) => handleChange("computation_type", e.target.value)}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          {form.computation_type === "fixed" && (
            <Field label="Amount" required hint={HINTS.amount} error={errors.amount}>
              <input type="number" min="0" step="0.01" style={fieldInputStyle(!!errors.amount)} value={form.amount} onChange={(e) => handleChange("amount", e.target.value)} />
            </Field>
          )}
          {form.computation_type === "percentage" && (
            <>
              <Field label="Percentage" required hint={HINTS.percentage} error={errors.percentage}>
                <input type="number" min="0" step="0.01" style={fieldInputStyle(!!errors.percentage)} value={form.percentage} onChange={(e) => handleChange("percentage", e.target.value)} />
              </Field>
              <Field label="Percentage of code" required error={errors.percentage_of_code}>
                <input style={fieldInputStyle(!!errors.percentage_of_code)} placeholder="e.g. BASIC" value={form.percentage_of_code} onChange={(e) => handleChange("percentage_of_code", e.target.value.toUpperCase())} />
              </Field>
            </>
          )}
          {form.computation_type === "formula" && (
            <Field label="Formula" required error={errors.formula} style={{ gridColumn: "span 2" }}>
              <input style={fieldInputStyle(!!errors.formula)} placeholder="e.g. GROSS - PF" value={form.formula} onChange={(e) => handleChange("formula", e.target.value.toUpperCase())} />
            </Field>
          )}
        </div>
        {error && <div style={{ color: tokens.oxblood, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button type="submit" style={buttonPrimary}>Add rule</button>
      </form>
    </div>
  );
}
