import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { tokens, mono, panelStyle, buttonPrimary, buttonSecondary, buttonSmall, numeral } from "../../tokens";
import StatusBadge from "../../components/StatusBadge";
import AuditTab from "../../components/AuditTab";
import { payrollApi } from "../../api/payrollApi";

export default function PayrunDetail() {
  const { id } = useParams();
  const [payrun, setPayrun] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { load(); }, [id]);
  function load() { payrollApi.getPayrun(id).then(setPayrun); }

  async function handleCompute() {
    setBusy(true); setMessage("");
    try { await payrollApi.computePayrun(id); setMessage("Computed successfully."); load(); }
    catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }

  async function handleSendPayslips() {
    setBusy(true); setMessage("");
    try { const res = await payrollApi.sendPayslips(id); setMessage(`Sent ${res.sent} payslip(s).`); load(); }
    catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }

  async function handleSendOne(payslipId) {
    setBusy(true); setMessage("");
    try { await payrollApi.sendPayslip(payslipId); setMessage("Payslip sent."); load(); }
    catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }

  if (!payrun) return <div style={{ padding: 28, color: tokens.inkMuted }}>Loading…</div>;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900 }}>
      <Link to="/payroll/payruns" style={{ fontSize: 12, color: tokens.inkMuted, fontFamily: mono }}>← back to payruns</Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "12px 0 18px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>{payrun.name}</h2>
          <div style={{ fontFamily: mono, fontSize: 11.5, color: tokens.inkMuted, marginTop: 3 }}>
            {payrun.period_start} – {payrun.period_end}
          </div>
        </div>
        <StatusBadge status={payrun.status} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button style={buttonPrimary} onClick={handleCompute} disabled={busy}>{busy ? "Working…" : "Compute"}</button>
        <button style={buttonSecondary} onClick={handleSendPayslips} disabled={busy}>Send payslips</button>
        <button style={buttonSecondary} onClick={() => setShowHistory((s) => !s)}>{showHistory ? "Hide" : "Show"} history</button>
      </div>
      {message && <p style={{ fontSize: 12, color: tokens.inkMuted, marginBottom: 16 }}>{message}</p>}
      {showHistory && (
        <div style={{ ...panelStyle, marginBottom: 20 }}>
          <AuditTab modelName="Payrun" recordId={id} />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {payrun.payslips.map((p) => (
          <div key={p.id} style={panelStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <strong style={{ fontSize: 13 }}>Employee #{p.employee ?? p.employee_id}</strong>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {p.sent_at && <span style={{ fontSize: 11, color: tokens.forest, fontFamily: mono }}>Sent</span>}
                <StatusBadge status={p.status} />
                {p.status === "computed" && (
                  <>
                    <button style={buttonSmall} onClick={() => payrollApi.downloadPayslipPdf(p.id)}>Download PDF</button>
                    <button style={buttonSmall} onClick={() => handleSendOne(p.id)} disabled={busy}>Send</button>
                  </>
                )}
              </div>
            </div>

            {p.warnings && p.warnings.length > 0 && (
              <div style={{ fontSize: 12, color: tokens.oxblood, marginBottom: 8 }}>
                {p.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
              </div>
            )}

            {p.lines && p.lines.length > 0 ? (
              <div>
                {p.lines.sort((a, b) => a.sequence - b.sequence).map((line) => (
                  <div key={line.id} style={{
                    display: "flex", justifyContent: "space-between", padding: "5px 0",
                    borderTop: `1px solid ${tokens.rule}`, fontSize: 13,
                    fontWeight: line.rule_code === "NET" ? 600 : 400,
                  }}>
                    <span>{line.rule_name}</span>
                    <span style={numeral}>₹{line.amount}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: tokens.inkMuted, margin: 0 }}>Not yet computed.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
