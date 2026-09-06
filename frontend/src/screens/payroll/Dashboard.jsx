import React, { useEffect, useState } from "react";
import { tokens, mono, panelStyle, numeral, inputStyle, labelStyle } from "../../tokens";
import { dashboardApi } from "../../api/dashboardApi";

function Kpi({ label, value }) {
  return (
    <div style={{ ...panelStyle, flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, color: tokens.inkMuted, marginBottom: 6 }}>{label}</div>
      <div style={{ ...numeral, fontSize: 22, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function BarRow({ label, value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
        <span>{label}</span>
        <span style={numeral}>₹{value}</span>
      </div>
      <div style={{ background: tokens.rule, height: 6, borderRadius: 2 }}>
        <div style={{ background: tokens.forest, width: `${pct}%`, height: 6, borderRadius: 2 }} />
      </div>
    </div>
  );
}

export default function PayrollDashboard() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState({ period_start: "", period_end: "" });

  useEffect(() => { load(); }, []);
  function load() {
    const params = {};
    if (period.period_start) params.period_start = period.period_start;
    if (period.period_end) params.period_end = period.period_end;
    dashboardApi.summary(params).then(setData);
  }

  if (!data) return <div style={{ padding: 28, color: tokens.inkMuted }}>Loading…</div>;

  const maxDeptCost = Math.max(1, ...data.charts.salary_cost_by_department.map((d) => Number(d.total_net)));
  const maxTrend = Math.max(1, ...data.charts.monthly_net_salary_trend.map((d) => Number(d.total_net)));

  return (
    <div style={{ padding: "24px 28px", maxWidth: 950 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Payroll Dashboard</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div>
            <label style={labelStyle}>From</label>
            <input type="date" style={{ ...inputStyle, width: 150 }} value={period.period_start}
              onChange={(e) => setPeriod({ ...period, period_start: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>To</label>
            <input type="date" style={{ ...inputStyle, width: 150 }} value={period.period_end}
              onChange={(e) => setPeriod({ ...period, period_end: e.target.value })} />
          </div>
          <button onClick={load} style={{ ...inputStyle, width: "auto", cursor: "pointer", marginTop: 4 }}>Apply</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <Kpi label="Total net salary paid" value={`₹${data.kpis.total_net_salary_paid}`} />
        <Kpi label="Payslips generated" value={data.kpis.payslips_generated} />
        <Kpi label="Average salary" value={`₹${data.kpis.average_salary}`} />
        <Kpi label="Approved time off" value={data.kpis.approved_timeoff} />
        <Kpi label="Attendance health" value={`${data.kpis.attendance_health_percent}%`} />
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ ...panelStyle, flex: 1, minWidth: 300 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 13.5 }}>Salary cost by department</h3>
          {data.charts.salary_cost_by_department.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 12 }}>No data.</p>}
          {data.charts.salary_cost_by_department.map((d) => (
            <BarRow key={d.department} label={d.department} value={d.total_net} max={maxDeptCost} />
          ))}
        </div>
        <div style={{ ...panelStyle, flex: 1, minWidth: 300 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 13.5 }}>Monthly net salary trend</h3>
          {data.charts.monthly_net_salary_trend.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 12 }}>No data.</p>}
          {data.charts.monthly_net_salary_trend.map((d, i) => (
            <BarRow key={i} label={d.period} value={d.total_net} max={maxTrend} />
          ))}
        </div>
      </div>

      <div style={panelStyle}>
        <h3 style={{ margin: "0 0 12px", fontSize: 13.5 }}>Alerts</h3>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontFamily: mono, fontSize: 12.5 }}>
          <span style={{ color: data.alerts.missing_bank_details > 0 ? tokens.oxblood : tokens.inkMuted }}>
            {data.alerts.missing_bank_details} missing bank details
          </span>
          <span style={{ color: data.alerts.payslips_pending > 0 ? tokens.amber : tokens.inkMuted }}>
            {data.alerts.payslips_pending} payslips pending
          </span>
          <span style={{ color: data.alerts.draft_payruns_unpaid > 0 ? tokens.amber : tokens.inkMuted }}>
            {data.alerts.draft_payruns_unpaid} draft payruns
          </span>
          <span style={{ color: data.alerts.contracts_expiring_this_month > 0 ? tokens.oxblood : tokens.inkMuted }}>
            {data.alerts.contracts_expiring_this_month} contracts expiring this month
          </span>
        </div>
      </div>
    </div>
  );
}
