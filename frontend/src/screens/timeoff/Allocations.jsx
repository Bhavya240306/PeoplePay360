import React, { useEffect, useState } from "react";
import { tokens, mono, panelStyle, buttonPrimary, inputStyle, labelStyle, numeral } from "../../tokens";
import { timeoffApi } from "../../api/timeoffApi";
import { coreApi } from "../../api/coreApi";

export default function Allocations() {
  const [allocations, setAllocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({ employee: "", time_off_type: "", allocated_days: "", valid_from: "", valid_to: "" });
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await timeoffApi.createAllocation({
        ...form, employee: Number(form.employee), time_off_type: Number(form.time_off_type), status: "approved",
      });
      setForm({ employee: "", time_off_type: "", allocated_days: "", valid_from: "", valid_to: "" });
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
          <div>
            <label style={labelStyle}>Employee</label>
            <select style={inputStyle} value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} required>
              <option value="">Select…</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Type</label>
            <select
              style={inputStyle} value={form.time_off_type}
              onChange={(e) => {
                const type = types.find((t) => String(t.id) === e.target.value);
                setForm({
                  ...form, time_off_type: e.target.value,
                  allocated_days: type && type.default_allocated_days != null
                    ? String(type.default_allocated_days) : form.allocated_days,
                });
              }}
              required
            >
              <option value="">Select…</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Allocated days</label>
            <input type="number" style={inputStyle} value={form.allocated_days} onChange={(e) => setForm({ ...form, allocated_days: e.target.value })} required />
          </div>
          <div />
          <div>
            <label style={labelStyle}>Valid from</label>
            <input type="date" style={inputStyle} value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} required />
          </div>
          <div>
            <label style={labelStyle}>Valid to</label>
            <input type="date" style={inputStyle} value={form.valid_to} onChange={(e) => setForm({ ...form, valid_to: e.target.value })} required />
          </div>
        </div>
        {error && <div style={{ color: tokens.oxblood, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button type="submit" style={buttonPrimary}>Grant allocation</button>
      </form>
    </div>
  );
}
