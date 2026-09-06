import React, { useEffect, useState } from "react";
import { tokens, mono, panelStyle, numeral } from "../tokens";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../AuthContext";
import { coreApi } from "../api/coreApi";

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${tokens.rule}`, fontSize: 13 }}>
      <span style={{ color: tokens.inkMuted }}>{label}</span>
      <span style={numeral}>{value ?? "—"}</span>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    if (user?.employee) {
      coreApi.getMyContract().then(setContracts).catch(() => setContracts([]));
    }
  }, [user]);

  if (!user) return null;
  const employee = user.employee_detail;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 640 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Profile</h2>
      <p style={{ margin: "0 0 18px", fontSize: 12, color: tokens.inkMuted, fontFamily: mono }}>Your account</p>

      <div style={{ ...panelStyle, marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 13.5 }}>Account</h3>
        <Row label="Username" value={user.username} />
        <Row label="Email" value={user.email} />
        <Row label="Role" value={<StatusBadge status={user.role_display} />} />
      </div>

      {employee ? (
        <div style={{ ...panelStyle, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 13.5 }}>Employee record</h3>
          <Row label="Employee ID" value={employee.employee_id} />
          <Row label="Name" value={`${employee.first_name} ${employee.last_name}`} />
          <Row label="Phone" value={employee.phone} />
          <Row label="Department" value={employee.department} />
          <Row label="Job title" value={employee.job_title} />
          <Row label="Date of joining" value={employee.date_of_joining} />
          <Row label="Status" value={<StatusBadge status={employee.is_active ? "Active" : "Inactive"} />} />
        </div>
      ) : (
        <div style={panelStyle}>
          <p style={{ margin: 0, fontSize: 13, color: tokens.inkMuted }}>
            No employee record is linked to this account.
          </p>
        </div>
      )}

      {employee && contracts.length > 0 && (
        <div style={panelStyle}>
          <h3 style={{ margin: "0 0 6px", fontSize: 13.5 }}>Contract</h3>
          {contracts.map((c) => (
            <div key={c.id} style={{ marginBottom: 8 }}>
              <Row label="Type" value={c.contract_type} />
              <Row label="Start date" value={c.start_date} />
              <Row label="End date" value={c.end_date || "Ongoing"} />
              <Row label="Basic salary" value={`₹${c.basic_salary}`} />
              <Row label="Hours / week" value={c.working_hours_per_week} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
