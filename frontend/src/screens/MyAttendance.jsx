import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { tokens, mono, panelStyle, numeral } from "../tokens";
import { coreApi } from "../api/coreApi";

export default function MyAttendance() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    coreApi.getMyAttendanceSummary().then(setSummary).catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div style={{ padding: "24px 28px", color: tokens.oxblood, fontSize: 13 }}>{error}</div>;
  }
  if (!summary) {
    return <div style={{ padding: "24px 28px", color: tokens.inkMuted, fontSize: 13 }}>Loading…</div>;
  }

  const data = [
    { name: "Present", value: summary.present_days, color: tokens.forest },
    { name: "Absent", value: summary.absent_days, color: tokens.oxblood },
  ];
  const hasData = summary.total_working_days > 0;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 700 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>My Attendance</h2>
      <p style={{ margin: "0 0 18px", fontSize: 12, color: tokens.inkMuted, fontFamily: mono }}>
        {summary.period_start} to {summary.period_end}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={panelStyle}>
          <div style={{ fontSize: 13, color: tokens.inkMuted, marginBottom: 8 }}>
            Present {summary.present_days} of {summary.total_working_days} working days
          </div>
          {hasData ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: tokens.inkMuted, fontSize: 13 }}>No working days recorded yet this month.</p>
          )}
        </div>

        <div style={panelStyle}>
          <div style={{ fontSize: 13, color: tokens.inkMuted, marginBottom: 8 }}>
            This week ({summary.week_start} – {summary.week_end})
          </div>
          <div style={{ fontFamily: mono, fontSize: 32, fontWeight: 500, ...numeral }}>
            {summary.weekly_hours}h
          </div>
          <div style={{ fontSize: 12, color: tokens.inkMuted, marginTop: 4 }}>hours worked</div>
        </div>
      </div>
    </div>
  );
}
