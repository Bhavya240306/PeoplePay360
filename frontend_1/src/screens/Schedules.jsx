import React, { useState } from "react";
import { tokens, serifDisplay, mono, buttonPrimary, buttonSecondary, inputStyle } from "../tokens";
import { useRole } from "../contexts/RoleContext";
import { sampleSchedules, scheduleWeeklyHours, sampleEmployees } from "../sampleData";
import StatusBadge from "../components/StatusBadge";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ScheduleForm({ onCancel, onSubmit }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Full-time");
  const [pattern, setPattern] = useState(ALL_DAYS.slice(0, 5).map((day) => ({ day, start: "09:00", end: "18:00", breakMins: 60 })));

  function updateDay(index, key, value) { setPattern((p) => p.map((d, i) => (i === index ? { ...d, [key]: value } : d))); }
  function toggleDay(day) {
    setPattern((p) => p.some((d) => d.day === day)
      ? p.filter((d) => d.day !== day)
      : [...p, { day, start: "09:00", end: "18:00", breakMins: 60 }].sort((a, b) => ALL_DAYS.indexOf(a.day) - ALL_DAYS.indexOf(b.day)));
  }
  const totalHours = scheduleWeeklyHours({ pattern });

  return (
    <div style={{ border: `1px solid ${tokens.rule}`, background: tokens.surface, padding: "18px 20px", marginBottom: 24 }}>
      <h2 style={{ fontFamily: serifDisplay, fontSize: 17, fontWeight: 600, margin: "0 0 14px" }}>New entry — Working schedule</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 16 }}>
        <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Name
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard 40h" /></label>
        <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Type
          <select style={inputStyle} value={type} onChange={(e) => setType(e.target.value)}>
            <option>Full-time</option><option>Part-time</option>
          </select></label>
      </div>

      <p style={{ fontSize: 11.5, color: tokens.inkMuted, margin: "0 0 8px" }}>Weekly pattern</p>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {ALL_DAYS.map((day) => {
          const active = pattern.some((d) => d.day === day);
          return (
            <button key={day} onClick={() => toggleDay(day)} style={{
              padding: "5px 12px", borderRadius: 3, fontSize: 12.5, cursor: "pointer", fontFamily: mono,
              border: `1px solid ${active ? tokens.forest : tokens.rule}`,
              background: active ? tokens.forestTint : "transparent",
              color: active ? tokens.forest : tokens.inkMuted,
            }}>{day}</button>
          );
        })}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", color: tokens.inkMuted, fontSize: 11.5 }}>
            <th style={{ padding: "4px 6px", fontWeight: 500 }}>Day</th>
            <th style={{ padding: "4px 6px", fontWeight: 500 }}>Start</th>
            <th style={{ padding: "4px 6px", fontWeight: 500 }}>End</th>
            <th style={{ padding: "4px 6px", fontWeight: 500 }}>Break (mins)</th>
          </tr>
        </thead>
        <tbody>
          {pattern.map((d, i) => (
            <tr key={d.day} style={{ borderTop: `1px solid ${tokens.rule}` }}>
              <td style={{ padding: "5px 6px", fontFamily: mono, fontWeight: 500 }}>{d.day}</td>
              <td style={{ padding: "5px 6px" }}><input type="time" value={d.start} onChange={(e) => updateDay(i, "start", e.target.value)} style={{ ...inputStyle, marginTop: 0, width: 110 }} /></td>
              <td style={{ padding: "5px 6px" }}><input type="time" value={d.end} onChange={(e) => updateDay(i, "end", e.target.value)} style={{ ...inputStyle, marginTop: 0, width: 110 }} /></td>
              <td style={{ padding: "5px 6px" }}><input type="number" min={0} value={d.breakMins} onChange={(e) => updateDay(i, "breakMins", Number(e.target.value))} style={{ ...inputStyle, marginTop: 0, width: 80 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ fontSize: 13.5, margin: "0 0 16px" }}>
        Total weekly hours: <span style={{ fontFamily: mono, fontWeight: 600 }}>{totalHours}h</span> <span style={{ color: tokens.inkMuted, fontSize: 12 }}>(auto-calculated)</span>
      </p>

      <div style={{ display: "flex", gap: 10 }}>
        <button style={buttonPrimary} disabled={!name || pattern.length === 0} onClick={() => onSubmit({ name, type, pattern })}>Log schedule</button>
        <button style={buttonSecondary} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default function Schedules() {
  const { canEditHrData } = useRole();
  const [schedules, setSchedules] = useState(sampleSchedules);
  const [showForm, setShowForm] = useState(false);

  function assignedCount(scheduleId) { return sampleEmployees.filter((e) => e.scheduleId === scheduleId).length; }
  function handleCreate(data) {
    setSchedules((ss) => [{ id: Math.max(...ss.map((s) => s.id)) + 1, ...data }, ...ss]);
    setShowForm(false);
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1080 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: serifDisplay, fontSize: 26, fontWeight: 600, margin: 0 }}>Working schedules</h1>
          <p style={{ fontFamily: mono, fontSize: 12, color: tokens.inkMuted, margin: "5px 0 0" }}>{String(schedules.length).padStart(3, "0")} on record</p>
        </div>
        {canEditHrData && !showForm && <button style={buttonPrimary} onClick={() => setShowForm(true)}>New schedule</button>}
      </div>

      {showForm && <ScheduleForm onCancel={() => setShowForm(false)} onSubmit={handleCreate} />}

      <div>
        {schedules.map((s, i) => (
          <div key={s.id} style={{ display: "grid", gridTemplateColumns: "36px 1fr auto", gap: 16, alignItems: "start", padding: "16px 0", borderTop: i === 0 ? `1px solid ${tokens.ink}` : `1px solid ${tokens.rule}` }}>
            <span style={{ fontFamily: mono, fontSize: 12, color: tokens.inkMuted }}>{String(i + 1).padStart(3, "0")}</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <p style={{ fontFamily: serifDisplay, fontSize: 16, fontWeight: 600, margin: 0 }}>{s.name}</p>
                <StatusBadge status={s.type} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {s.pattern.map((d) => (
                  <span key={d.day} style={{ fontFamily: mono, fontSize: 11, color: tokens.inkMuted }}>{d.day} {d.start}–{d.end}</span>
                ))}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontFamily: mono, fontSize: 18, fontWeight: 600 }}>{scheduleWeeklyHours(s)}h</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: tokens.inkMuted }}>{assignedCount(s.id)} assigned</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
