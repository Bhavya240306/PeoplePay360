import React, { useEffect, useState } from "react";
import { tokens, mono, panelStyle, buttonPrimary, inputStyle, labelStyle, numeral, overlayStyle } from "../tokens";
import StatusBadge from "../components/StatusBadge";
import ViewToggle from "../components/ViewToggle";
import { coreApi } from "../api/coreApi";

const emptyForm = { employee: "", date: "", check_in: "", check_out: "", status: "present", worked_hours: 0, notes: "" };

const BOARD_COLUMNS = [
  { status: "present", label: "Present" },
  { status: "late", label: "Late" },
  { status: "half_day", label: "Half day" },
  { status: "absent", label: "Absent" },
];

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filterEmployee, setFilterEmployee] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("list");
  const [boardDate, setBoardDate] = useState("");

  useEffect(() => { load(); }, [filterEmployee]);
  function load() {
    coreApi.listAttendance(filterEmployee || undefined).then(setRecords);
    coreApi.listEmployees().then(setEmployees);
  }

  function employeeName(id) {
    const e = employees.find((x) => x.id === id);
    return e ? `${e.first_name} ${e.last_name}` : `#${id}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await coreApi.createAttendance({ ...form, employee: Number(form.employee) });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  // The log accumulates one row per employee per day indefinitely, so
  // the board (which buckets by status, not date) needs to be scoped
  // to a single day - otherwise a column stacks every day ever logged.
  const latestDate = records.reduce((max, a) => (a.date > max ? a.date : max), "");
  const effectiveBoardDate = boardDate || latestDate;
  const boardRecords = records.filter((a) => a.date === effectiveBoardDate);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 950 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Attendance Log</h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: tokens.inkMuted, fontFamily: mono }}>
            {String(records.length).padStart(2, "0")} entries
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select style={{ ...inputStyle, width: 200, marginTop: 0 }} value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}>
            <option value="">All employees</option>
            {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
          </select>
          <ViewToggle view={view} onChange={setView} />
          <button style={buttonPrimary} onClick={() => setShowForm(true)}>+ Log entry</button>
        </div>
      </div>

      {view === "board" ? (
        <div>
          <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Day</label>
            <input
              type="date" style={{ ...inputStyle, width: 160, marginTop: 0 }}
              value={effectiveBoardDate} onChange={(e) => setBoardDate(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          {BOARD_COLUMNS.map((col) => {
            const items = boardRecords.filter((a) => a.status === col.status);
            return (
              <div key={col.status} style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: mono, fontSize: 10.5, color: tokens.inkMuted, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                  <span>{col.label}</span>
                  <span>{items.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map((a) => (
                    <div key={a.id} style={{ ...panelStyle, padding: "10px 12px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{employeeName(a.employee)}</div>
                      <div style={{ ...numeral, fontSize: 12, color: tokens.inkMuted, marginBottom: 8 }}>{a.date}</div>
                      <div style={{ ...numeral, fontSize: 12 }}>{a.check_in || "—"} → {a.check_out || "—"}</div>
                    </div>
                  ))}
                  {items.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 12 }}>—</p>}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", fontFamily: mono, fontSize: 10.5, color: tokens.inkMuted, borderBottom: `1px solid ${tokens.ruleStrong}`, paddingBottom: 6 }}>
            <div style={{ width: 40 }}>№</div>
            <div style={{ flex: 1.6 }}>Employee</div>
            <div style={{ flex: 1 }}>Date</div>
            <div style={{ flex: 1 }}>In</div>
            <div style={{ flex: 1 }}>Out</div>
            <div style={{ width: 120 }}>Status</div>
          </div>
          {records.map((a, i) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${tokens.rule}`, fontSize: 13.5 }}>
              <div style={{ width: 40, ...numeral, color: tokens.inkMuted, fontSize: 12 }}>{String(i + 1).padStart(2, "0")}</div>
              <div style={{ flex: 1.6 }}>{employeeName(a.employee)}</div>
              <div style={{ flex: 1, ...numeral, fontSize: 12.5 }}>{a.date}</div>
              <div style={{ flex: 1, ...numeral, fontSize: 12.5 }}>{a.check_in || "—"}</div>
              <div style={{ flex: 1, ...numeral, fontSize: 12.5 }}>{a.check_out || "—"}</div>
              <div style={{ width: 120 }}><StatusBadge status={a.status} /></div>
            </div>
          ))}
          {records.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 13, padding: "16px 0" }}>No attendance recorded.</p>}
        </div>
      )}

      {showForm && (
        <div style={overlayStyle}>
          <form onSubmit={handleSubmit} style={{ ...panelStyle, width: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>Log attendance</h3>
              <button type="button" onClick={() => setShowForm(false)} style={{ border: "none", background: "none", cursor: "pointer", color: tokens.inkMuted }}>✕</button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Employee</label>
              <select style={inputStyle} value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} required>
                <option value="">Select…</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
              <div>
                <label style={labelStyle}>Date</label>
                <input type="date" style={inputStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="half_day">Half day</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Check in</label>
                <input type="time" style={inputStyle} value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Check out</label>
                <input type="time" style={inputStyle} value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} />
              </div>
            </div>
            {error && <div style={{ color: tokens.oxblood, fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <button type="submit" style={buttonPrimary}>Record entry</button>
          </form>
        </div>
      )}
    </div>
  );
}
