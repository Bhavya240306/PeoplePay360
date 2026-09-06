import React, { useEffect, useState } from "react";
import { tokens, mono, panelStyle, numeral } from "../tokens";
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

export default function MySchedule() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    coreApi.getMySchedule().then(setRows).catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div style={{ padding: "24px 28px", color: tokens.oxblood, fontSize: 13 }}>{error}</div>;
  }

  const weeklyHours = computeWeeklyHours(rows);
  const rowByDay = Object.fromEntries(rows.map((r) => [r.day_of_week, r]));

  return (
    <div style={{ padding: "24px 28px", maxWidth: 700 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>My Working Schedule</h2>
      <p style={{ margin: "0 0 18px", fontSize: 12, color: tokens.inkMuted, fontFamily: mono }}>
        Set by HR — view only
      </p>

      <div style={panelStyle}>
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
              {r?.location && <span style={{ color: tokens.inkMuted, fontSize: 12 }}>{r.location}</span>}
            </div>
          );
        })}
        {rows.length === 0 && (
          <p style={{ color: tokens.inkMuted, fontSize: 13, margin: "10px 0 0" }}>
            No schedule has been set for you yet.
          </p>
        )}
      </div>
    </div>
  );
}
