import React, { useEffect, useState } from "react";
import { tokens, mono, numeral } from "../tokens";
import StatusBadge from "../components/StatusBadge";
import { settlementApi } from "../api/settlementApi";
import { coreApi } from "../api/coreApi";

export default function Settlements() {
  const [settlements, setSettlements] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    settlementApi.list().then(setSettlements);
    coreApi.listEmployees().then(setEmployees);
  }, []);

  function employeeName(id) {
    const e = employees.find((x) => x.id === id);
    return e ? `${e.first_name} ${e.last_name}` : `#${id}`;
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Full & Final Settlements</h2>
      <p style={{ margin: "0 0 18px", fontSize: 12, color: tokens.inkMuted, fontFamily: mono }}>
        Auto-generated on employee deactivation
      </p>

      <div>
        <div style={{ display: "flex", fontFamily: mono, fontSize: 10.5, color: tokens.inkMuted, borderBottom: `1px solid ${tokens.ruleStrong}`, paddingBottom: 6 }}>
          <div style={{ flex: 1.4 }}>Employee</div>
          <div style={{ flex: 1 }}>Last day</div>
          <div style={{ flex: 1 }}>Prorated basic</div>
          <div style={{ flex: 1 }}>Leave encashed</div>
          <div style={{ width: 100 }}>Status</div>
        </div>
        {settlements.map((s) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${tokens.rule}`, fontSize: 13.5 }}>
            <div style={{ flex: 1.4 }}>{employeeName(s.employee)}</div>
            <div style={{ flex: 1, ...numeral, fontSize: 12.5 }}>{s.last_working_day}</div>
            <div style={{ flex: 1, ...numeral, fontSize: 12.5 }}>₹{s.prorated_basic}</div>
            <div style={{ flex: 1, ...numeral, fontSize: 12.5 }}>{s.unpaid_leave_encashment_days} days</div>
            <div style={{ width: 100 }}><StatusBadge status={s.status} /></div>
          </div>
        ))}
        {settlements.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 13, padding: "16px 0" }}>No settlements recorded.</p>}
      </div>
    </div>
  );
}
