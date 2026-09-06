import React, { useEffect, useState } from "react";
import { tokens, mono, panelStyle, buttonPrimary, inputStyle, numeral } from "../../tokens";
import Field, { fieldInputStyle } from "../../components/Field";
import { timeoffApi } from "../../api/timeoffApi";
import { validateRequired, validateNonNegative, runValidators, hasErrors, HINTS } from "../../validators";

const emptyForm = {
  name: "", requires_allocation: true, requires_approval: true, affects_payroll: false,
  is_active: true, default_allocated_days: "",
};

export default function TimeOffTypes() {
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);
  function load() { timeoffApi.listTypes().then(setTypes); }

  function handleChange(key, value) {
    setForm({ ...form, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  }

  function validateAll() {
    const map = { name: validateRequired };
    if (!form.affects_payroll && form.default_allocated_days !== "") {
      map.default_allocated_days = (v) => validateNonNegative(v, { optional: true });
    }
    return runValidators(form, map);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fieldErrors = validateAll();
    setErrors(fieldErrors);
    if (hasErrors(fieldErrors)) return;
    try {
      await timeoffApi.createType({
        ...form,
        default_allocated_days: form.affects_payroll || form.default_allocated_days === ""
          ? null : Number(form.default_allocated_days),
      });
      setForm(emptyForm);
      setErrors({});
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
          <div style={{ flex: 1 }}>Allocated days</div>
        </div>
        {types.map((t) => (
          <div key={t.id} style={{ display: "flex", padding: "9px 0", borderBottom: `1px solid ${tokens.rule}`, fontSize: 13.5 }}>
            <div style={{ flex: 2 }}>{t.name}</div>
            <div style={{ flex: 1, color: tokens.inkMuted }}>{t.requires_allocation ? "Yes" : "No"}</div>
            <div style={{ flex: 1, color: tokens.inkMuted }}>{t.requires_approval ? "Yes" : "No"}</div>
            <div style={{ flex: 1, color: tokens.inkMuted }}>{t.affects_payroll ? "Yes" : "No"}</div>
            <div style={{ flex: 1, ...numeral, color: tokens.inkMuted }}>
              {!t.affects_payroll && t.default_allocated_days != null ? t.default_allocated_days : "—"}
            </div>
          </div>
        ))}
        {types.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 13, padding: "16px 0" }}>No types defined.</p>}
      </div>

      <form onSubmit={handleSubmit} style={panelStyle}>
        <h3 style={{ margin: "0 0 12px", fontSize: 13.5 }}>New type</h3>
        <Field label="Name" required error={errors.name} style={{ marginBottom: 10 }}>
          <input style={fieldInputStyle(!!errors.name)} value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
        </Field>
        {["requires_allocation", "requires_approval", "affects_payroll"].map((key) => (
          <label key={key} style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 6, marginBottom: 8, textTransform: "capitalize" }}>
            <input
              type="checkbox"
              checked={form[key]}
              onChange={(e) => setForm({
                ...form, [key]: e.target.checked,
                ...(key === "affects_payroll" && e.target.checked ? { default_allocated_days: "" } : {}),
              })}
            />
            {key.replace(/_/g, " ")}
          </label>
        ))}
        {!form.affects_payroll && (
          <Field label="Allocated days (per employee, standard)" hint={HINTS.allocatedDays} error={errors.default_allocated_days} style={{ marginBottom: 8 }}>
            <input
              type="number" min="0" step="0.5" style={fieldInputStyle(!!errors.default_allocated_days)}
              value={form.default_allocated_days}
              onChange={(e) => handleChange("default_allocated_days", e.target.value)}
            />
          </Field>
        )}
        {error && <div style={{ color: tokens.oxblood, fontSize: 12, margin: "10px 0" }}>{error}</div>}
        <button type="submit" style={{ ...buttonPrimary, marginTop: 6 }}>Create type</button>
      </form>
    </div>
  );
}
