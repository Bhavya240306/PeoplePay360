import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { tokens, serifDisplay, mono, buttonPrimary, buttonSecondary, inputStyle } from "../tokens";
import { useRole } from "../contexts/RoleContext";
import { sampleAttendance, sampleEmployees } from "../sampleData";
import StatusBadge from "../components/StatusBadge";

function employeeName(id) { return sampleEmployees.find((e) => e.id === id)?.name || "Unknown"; }

function computeHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const [ih, im] = checkIn.split(":").map(Number);
  const [oh, om] = checkOut.split(":").map(Number);
  const mins = (oh * 60 + om) - (ih * 60 + im);
  return Math.max(Math.round((mins / 60) * 10) / 10, 0);
}

function CorrectionForm({ record, onCancel, onSave }) {
  const [checkIn, setCheckIn] = useState(record.checkIn || "");
  const [checkOut, setCheckOut] = useState(record.checkOut || "");

  return (
    <div style={{ borderLeft: `3px solid ${tokens.oxblood}`, background: tokens.oxbloodTint, padding: "16px 20px", marginBottom: 24 }}>
      <h2 style={{ fontFamily: serifDisplay, fontSize: 16, fontWeight: 600, margin: "0 0 12px", color: tokens.ink }}>
        Correction — {employeeName(record.employeeId)} · {record.date}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 14 }}>
        <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Check in
          <input style={inputStyle} type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /></label>
        <label style={{ fontSize: 11.5, color: tokens.inkMuted }}>Check out
          <input style={inputStyle} type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} /></label>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button style={buttonPrimary} onClick={() => onSave(checkIn, checkOut)}>Save correction</button>
        <button style={buttonSecondary} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default function Attendance() {
  const [searchParams] = useSearchParams();
  const { canEditHrData } = useRole();
  const employeeFilter = searchParams.get("employee") ? Number(searchParams.get("employee")) : null;

  const [records, setRecords] = useState(sampleAttendance);
  const [correctingId, setCorrectingId] = useState(null);

  const filtered = useMemo(() => (employeeFilter ? records.filter((r) => r.employeeId === employeeFilter) : records), [records, employeeFilter]);

  function handleSaveCorrection(checkIn, checkOut) {
    setRecords((rs) => rs.map((r) => r.id === correctingId ? {
      ...r, checkIn: checkIn || null, checkOut: checkOut || null,
      workedHours: computeHours(checkIn, checkOut),
      status: checkIn && checkOut ? "Present" : checkIn ? "Missing check-out" : "Absent",
      corrected: true,
    } : r));
    setCorrectingId(null);
  }

  const correctingRecord = records.find((r) => r.id === correctingId);

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1080 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: serifDisplay, fontSize: 26, fontWeight: 600, margin: 0 }}>Attendance</h1>
        <p style={{ fontFamily: mono, fontSize: 12, color: tokens.inkMuted, margin: "5px 0 0" }}>
          {employeeFilter ? `Filtered to ${employeeName(employeeFilter)}` : `${String(records.length).padStart(3, "0")} entries`}
          {!canEditHrData && " · corrections require HR Manager access or above"}
        </p>
      </div>

      {correctingRecord && <CorrectionForm record={correctingRecord} onCancel={() => setCorrectingId(null)} onSave={handleSaveCorrection} />}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
        <thead>
          <tr style={{ textAlign: "left", color: tokens.inkMuted, fontSize: 11.5 }}>
            <th style={{ padding: "6px 8px", fontWeight: 500 }}>Employee</th>
            <th style={{ padding: "6px 8px", fontWeight: 500 }}>Date</th>
            <th style={{ padding: "6px 8px", fontWeight: 500 }}>In</th>
            <th style={{ padding: "6px 8px", fontWeight: 500 }}>Out</th>
            <th style={{ padding: "6px 8px", fontWeight: 500 }}>Hours</th>
            <th style={{ padding: "6px 8px", fontWeight: 500 }}>Status</th>
            <th style={{ padding: "6px 8px" }}></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} style={{ borderTop: `1px solid ${tokens.rule}` }}>
              <td style={{ padding: "10px 8px" }}>{employeeName(r.employeeId)}</td>
              <td style={{ padding: "10px 8px", fontFamily: mono, fontSize: 12.5 }}>{r.date}</td>
              <td style={{ padding: "10px 8px", fontFamily: mono, fontSize: 12.5 }}>{r.checkIn || "—"}</td>
              <td style={{ padding: "10px 8px", fontFamily: mono, fontSize: 12.5 }}>{r.checkOut || "—"}</td>
              <td style={{ padding: "10px 8px", fontFamily: mono, fontSize: 12.5 }}>{r.workedHours}h</td>
              <td style={{ padding: "10px 8px" }}>
                <StatusBadge status={r.status} />
                {r.corrected && <span style={{ fontSize: 10.5, color: tokens.inkMuted, marginLeft: 6 }}>(amended)</span>}
              </td>
              <td style={{ padding: "10px 8px" }}>
                {canEditHrData && (
                  <button onClick={() => setCorrectingId(r.id)} style={{ ...buttonSecondary, padding: "4px 10px", fontSize: 12 }}>Correct</button>
                )}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={7} style={{ padding: "20px 8px", color: tokens.inkMuted, textAlign: "center" }}>No attendance records found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
