import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { tokens, serifDisplay, mono, panelStyle, labelStyle, numeral } from "../tokens";
import StatusBadge from "../components/StatusBadge";
import SmartButton from "../components/SmartButton";
import AuditTab from "../components/AuditTab";
import { coreApi } from "../api/coreApi";
import { timeoffApi } from "../api/timeoffApi";

export default function EmployeeForm() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState("info");

  useEffect(() => {
    coreApi.getEmployee(id).then(setEmployee);
    coreApi.listContracts(id).then(setContracts);
    coreApi.listAttendance(id).then(setAttendance);
    timeoffApi.listRequests().then((all) => setRequests(all.filter((r) => String(r.employee) === String(id))));
  }, [id]);

  if (!employee) return <div style={{ padding: 28, color: tokens.inkMuted }}>Loading…</div>;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900 }}>
      <Link to="/employees" style={{ fontSize: 12, color: tokens.inkMuted, fontFamily: mono }}>← back to register</Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "12px 0 8px" }}>
        <div>
          <h2 style={{ fontFamily: serifDisplay, fontSize: 22, margin: 0 }}>
            {employee.first_name} {employee.last_name}
          </h2>
          <div style={{ fontFamily: mono, fontSize: 12, color: tokens.inkMuted, marginTop: 4 }}>
            {employee.employee_id} · {employee.job_title || "—"}
          </div>
        </div>
        <StatusBadge status={employee.is_active ? "Active" : "Inactive"} />
      </div>

      <div style={{ display: "flex", gap: 8, margin: "18px 0 22px" }}>
        <SmartButton label="Contracts" count={contracts.length} onClick={() => setTab("contracts")} />
        <SmartButton label="Attendance" count={attendance.length} onClick={() => setTab("attendance")} />
        <SmartButton label="Time off" count={requests.length} onClick={() => setTab("timeoff")} />
      </div>

      <div style={{ display: "flex", gap: 18, borderBottom: `1px solid ${tokens.rule}`, marginBottom: 18 }}>
        {["info", "contracts", "attendance", "timeoff", "history"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              border: "none", background: "none", padding: "8px 0", fontSize: 13, cursor: "pointer",
              textTransform: "capitalize", color: tab === t ? tokens.ink : tokens.inkMuted,
              borderBottom: tab === t ? `2px solid ${tokens.forest}` : "2px solid transparent",
              fontWeight: tab === t ? 600 : 400,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div style={{ ...panelStyle, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Email" value={employee.email} />
          <Field label="Phone" value={employee.phone} />
          <Field label="Department" value={employee.department} />
          <Field label="Job title" value={employee.job_title} />
          <Field label="Date of joining" value={employee.date_of_joining} mono />
        </div>
      )}

      {tab === "contracts" && (
        <div>
          {contracts.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 13 }}>No contracts recorded.</p>}
          {contracts.map((c) => (
            <div key={c.id} style={{ ...panelStyle, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong style={{ fontSize: 13.5 }}>{c.contract_type}</strong>
                <div style={{ fontSize: 12, color: tokens.inkMuted, marginTop: 3 }}>
                  {c.start_date} – {c.end_date || "ongoing"} · <span style={numeral}>₹{c.basic_salary}</span>
                </div>
              </div>
              <StatusBadge status={c.is_active ? "Active" : "Expired"} />
            </div>
          ))}
        </div>
      )}

      {tab === "attendance" && (
        <div>
          {attendance.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 13 }}>No attendance recorded.</p>}
          {attendance.map((a) => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${tokens.rule}`, fontSize: 13 }}>
              <span style={numeral}>{a.date}</span>
              <span>{a.check_in || "—"} – {a.check_out || "—"}</span>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      )}

      {tab === "timeoff" && (
        <div>
          {requests.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 13 }}>No time off requests.</p>}
          {requests.map((r) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${tokens.rule}`, fontSize: 13 }}>
              <span>{r.date_from} – {r.date_to}</span>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      )}

      {tab === "history" && <AuditTab modelName="Employee" recordId={id} />}
    </div>
  );
}

function Field({ label, value, mono: isMono }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ fontSize: 14, marginTop: 2, ...(isMono ? { fontFamily: "'IBM Plex Mono', monospace" } : {}) }}>
        {value || "—"}
      </div>
    </div>
  );
}
