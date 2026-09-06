import React, { useEffect, useState } from "react";
import { tokens, mono, panelStyle, buttonPrimary, inputStyle, labelStyle, numeral } from "../tokens";
import { coreApi } from "../api/coreApi";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function computeWeeklyHours(rows) {
  const totalMins = rows.reduce((sum, r) => {
    if (!r.is_working_day || !r.start_time || !r.end_time) return sum;
    const [sh, sm] = r.start_time.split(":").map(Number);
    const [eh, em] = r.end_time.split(":").map(Number);
    return sum + Math.max((eh * 60 + em) - (sh * 60 + sm), 0);
  }, 0);
  return Math.round((totalMins / 60) * 10) / 10;
}

export default function Schedules() {
  const [employees, setEmployees] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ day_of_week: "monday", start_time: "09:00", end_time: "18:00", is_working_day: true, location: "" });

  useEffect(() => {
    coreApi.listEmployees().then((emps) => {
      setEmployees(emps);
      if (emps.length > 0) setSelectedId(emps[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedId) coreApi.listSchedules(selectedId).then(setRows);
  }, [selectedId]);

  async function handleAdd(e) {
    e.preventDefault();
    await coreApi.createSchedule({ ...form, employee: Number(selectedId) });
    coreApi.listSchedules(selectedId).then(setRows);
  }

  const weeklyHours = computeWeeklyHours(rows);
  const rowByDay = Object.fromEntries(rows.map((r) => [r.day_of_week, r]));

  return (
    <div style={{ padding: "24px 28px", maxWidth: 700 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Working Schedule</h2>
      <p style={{ margin: "0 0 18px", fontSize: 12, color: tokens.inkMuted, fontFamily: mono }}>
        Weekly hours are derived, not entered
      </p>

      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>Employee</label>
        <select style={{ ...inputStyle, width: 260 }} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
        </select>
      </div>

      <div style={{ ...panelStyle, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: tokens.inkMuted }}>Total weekly hours</span>
          <span style={{ fontFamily: mono, fontSize: 22, fontWeight: 500 }}>{weeklyHours}h</span>
        </div>
        {DAYS.map((day) => {
          const r = rowByDay[day];
          return (
            <div key={day} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${tokens.rule}`, fontSize: 13 }}>
              <span style={{ textTransform: "capitalize", width: 100 }}>{day}</span>
              <span style={numeral}>
                {r ? (r.is_working_day ? `${r.start_time} – ${r.end_time}` : "off") : "— not set —"}
              </span>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleAdd} style={panelStyle}>
        <h3 style={{ margin: "0 0 12px", fontSize: 13.5 }}>Set a day</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Day</label>
            <select style={inputStyle} value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}>
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Start</label>
            <input type="time" style={inputStyle} value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>End</label>
            <input type="time" style={inputStyle} value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          </div>
        </div>
        <label style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <input type="checkbox" checked={form.is_working_day} onChange={(e) => setForm({ ...form, is_working_day: e.target.checked })} />
          Working day
        </label>
        <button type="submit" style={buttonPrimary}>Save day</button>
      </form>
    </div>
  );
}
