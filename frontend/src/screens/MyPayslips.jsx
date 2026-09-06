import React, { useEffect, useState } from "react";
import { tokens, mono, buttonSmall, numeral } from "../tokens";
import StatusBadge from "../components/StatusBadge";
import { payrollApi } from "../api/payrollApi";

function netAmount(lines) {
  const net = (lines || []).find((l) => l.rule_code === "NET");
  return net ? net.amount : null;
}

export default function MyPayslips() {
  const [payslips, setPayslips] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    payrollApi.listPayslips().then(setPayslips).catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 800 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>My Payslips</h2>
      <p style={{ margin: "0 0 18px", fontSize: 12, color: tokens.inkMuted, fontFamily: mono }}>
        {String(payslips.length).padStart(2, "0")} payslip(s)
      </p>

      {error && <p style={{ color: tokens.oxblood, fontSize: 13 }}>{error}</p>}

      <div style={{ display: "flex", fontFamily: mono, fontSize: 10.5, color: tokens.inkMuted, borderBottom: `1px solid ${tokens.ruleStrong}`, paddingBottom: 6 }}>
        <div style={{ flex: 1.6 }}>Period</div>
        <div style={{ flex: 1 }}>Net pay</div>
        <div style={{ width: 100 }}>Status</div>
        <div style={{ width: 90 }}>Sent</div>
        <div style={{ width: 120 }}>Action</div>
      </div>
      {payslips.map((p) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${tokens.rule}`, fontSize: 13.5 }}>
          <div style={{ flex: 1.6 }}>
            {p.payrun_detail ? `${p.payrun_detail.name} (${p.payrun_detail.period_start} – ${p.payrun_detail.period_end})` : `Payrun #${p.payrun}`}
          </div>
          <div style={{ flex: 1, ...numeral }}>{netAmount(p.lines) != null ? `₹${netAmount(p.lines)}` : "—"}</div>
          <div style={{ width: 100 }}><StatusBadge status={p.status} /></div>
          <div style={{ width: 90, fontSize: 12, color: p.sent_at ? tokens.forest : tokens.inkMuted }}>
            {p.sent_at ? "Sent" : "—"}
          </div>
          <div style={{ width: 120 }}>
            {p.status === "computed" && (
              <button style={buttonSmall} onClick={() => payrollApi.downloadPayslipPdf(p.id)}>Download PDF</button>
            )}
          </div>
        </div>
      ))}
      {payslips.length === 0 && !error && (
        <p style={{ color: tokens.inkMuted, fontSize: 13, padding: "16px 0" }}>No payslips yet.</p>
      )}
    </div>
  );
}
