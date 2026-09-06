import React, { useEffect, useState } from "react";
import { tokens, mono, panelStyle, buttonPrimary, inputStyle, numeral } from "../../tokens";
import Field, { fieldInputStyle } from "../../components/Field";
import { timeoffApi } from "../../api/timeoffApi";
import { coreApi } from "../../api/coreApi";
import { validateRequired, validateMin, validateDateRange, runValidators, hasErrors, HINTS } from "../../validators";

const emptyForm = { employee: "", time_off_type: "", allocated_days: "", valid_from: "", valid_to: "" };
const allocatedDaysHint = "A positive number of days, greater than 0.";

export default function Allocations() {
  const [allocations, setAllocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);
  function load() {
    timeoffApi.listAllocations().then(setAllocations);
    coreApi.listEmployees().then(setEmployees);
    timeoffApi.listTypes().then(setTypes);
  }

  function name(list, id) {
    const item = list.find((x) => x.id === id);
    return item ? (item.first_name ? `${item.first_name} ${item.last_name}` : item.name) : `#${id}`;
  }

  function handleChange(key, value) {
    setForm({ ...form, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  }

  function validateAll() {
    const fieldErrors = runValidators(form, {
      employee: validateRequired,
      time_off_type: validateRequired,
      allocated_days: (v) => validateMin(v, 0.01, allocatedDaysHint),
      valid_from: validateRequired,
    });
    const dateError = validateDateRange(form.valid_from, form.valid_to);
    if (dateError) fieldErrors.valid_to = dateError;
    else if (!form.valid_to) fieldErrors.valid_to = HINTS.required;
    return fieldErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fieldErrors = validateAll();
    setErrors(fieldErrors);
    if (hasErrors(fieldErrors)) return;
    try {
      await timeoffApi.createAllocation({
        ...form, employee: Number(form.employee), time_off_type: Number(form.time_off_type), status: "approved",
      });
      setForm(emptyForm);
      setErrors({});
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 850 }}>
      <h2 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 600 }}>Leave Allocations</h2>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", fontFamily: mono, fontSize: 10.5, color: tokens.inkMuted, borderBottom: `1px solid ${tokens.ruleStrong}`, paddingBottom: 6 }}>
          <div style={{ flex: 1.6 }}>Employee</div>
          <div style={{ flex: 1.4 }}>Type</div>
          <div style={{ flex: 1 }}>Allocated</div>
          <div style={{ flex: 1 }}>Used</div>
          <div style={{ flex: 1 }}>Remaining</div>
        </div>
        {allocations.map((a) => (
          <div key={a.id} style={{ display: "flex", padding: "9px 0", borderBottom: `1px solid ${tokens.rule}`, fontSize: 13.5 }}>
            <div style={{ flex: 1.6 }}>{name(employees, a.employee)}</div>
            <div style={{ flex: 1.4, color: tokens.inkMuted }}>{name(types, a.time_off_type)}</div>
            <div style={{ flex: 1, ...numeral }}>{a.allocated_days}</div>
            <div style={{ flex: 1, ...numeral }}>{a.used_days}</div>
            <div style={{ flex: 1, ...numeral, fontWeight: 500 }}>{a.remaining_days}</div>
          </div>
        ))}
        {allocations.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 13, padding: "16px 0" }}>No allocations recorded.</p>}
      </div>

      <form onSubmit={handleSubmit} style={panelStyle}>
        <h3 style={{ margin: "0 0 12px", fontSize: 13.5 }}>Grant allocation</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <Field label="Employee" required error={errors.employee}>
            <select style={fieldInputStyle(!!errors.employee)} value={form.employee} onChange={(e) => handleChange("employee", e.target.value)}>
              <option value="">Select…</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
            </select>
          </Field>
          <Field label="Type" required error={errors.time_off_type}>
            <select
              style={fieldInputStyle(!!errors.time_off_type)} value={form.time_off_type}
              onChange={(e) => {
                const type = types.find((t) => String(t.id) === e.target.value);
                handleChange("time_off_type", e.target.value);
                if (type && type.default_allocated_days != null) {
                  setForm((f) => ({ ...f, time_off_type: e.target.value, allocated_days: String(type.default_allocated_days) }));
                }
              }}
            >
              <option value="">Select…</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Allocated days" required hint={allocatedDaysHint} error={errors.allocated_days}>
            <input type="number" min="0.01" step="0.5" style={fieldInputStyle(!!errors.allocated_days)} value={form.allocated_days} onChange={(e) => handleChange("allocated_days", e.target.value)} />
          </Field>
          <div />
          <Field label="Valid from" required error={errors.valid_from}>
            <input type="date" style={fieldInputStyle(!!errors.valid_from)} value={form.valid_from} onChange={(e) => handleChange("valid_from", e.target.value)} />
          </Field>
          <Field label="Valid to" required hint={HINTS.dateRange} error={errors.valid_to}>
            <input type="date" style={fieldInputStyle(!!errors.valid_to)} value={form.valid_to} onChange={(e) => handleChange("valid_to", e.target.value)} />
          </Field>
        </div>
        {error && <div style={{ color: tokens.oxblood, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button type="submit" style={buttonPrimary}>Grant allocation</button>
      </form>
    </div>
  );
}
