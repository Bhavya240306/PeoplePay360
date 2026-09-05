import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { tokens, panelStyle, buttonPrimary, buttonSecondary, statusBadgeProps } from "../../tokens";
import { payrollApi } from "../../api/payrollApi";

export default function PayrunDetail() {
  const { id } = useParams();
  const [payrun, setPayrun] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { load(); }, [id]);
  function load() {
    payrollApi.getPayrun(id).then(setPayrun);
  }

  async function handleCompute() {
    setBusy(true);
    setMessage("");
    try {
      await payrollApi.computePayrun(id);
      setMessage("Computed successfully.");
      load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSendPayslips() {
    setBusy(true);
    setMessage("");
    try {
      const res = await payrollApi.sendPayslips(id);
      setMessage(`Sent ${res.sent} payslip(s).`);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!payrun) return <div style={{ padding: 24, color: tokens.inkMuted }}>Loading...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <Link to="/payroll/payruns" style={{ fontSize: 12, color: tokens.inkMuted }}>← Back to payruns</Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0 20px" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: tokens.ink, margin: 0 }}>{payrun.name}</h1>
          <div style={{ fontSize: 12, color: tokens.inkMuted, marginTop: 2 }}>
            {payrun.period_start} – {payrun.period_end}
          </div>
        </div>
        <span style={statusBadgeProps(payrun.status)}>{payrun.status}</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button style={buttonPrimary} onClick={handleCompute} disabled={busy}>
          {busy ? "Working..." : "Compute"}
        </button>
        <button style={buttonSecondary} onClick={handleSendPayslips} disabled={busy}>
          Send payslips
        </button>
      </div>
      {message && <p style={{ fontSize: 12, color: tokens.inkMuted, marginBottom: 16 }}>{message}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {payrun.payslips.map((p) => (
          <div key={p.id} style={panelStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <strong style={{ fontSize: 13, color: tokens.ink }}>Employee #{p.employee ?? p.employee_id}</strong>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={statusBadgeProps(p.status)}>{p.status}</span>
                {p.status === "computed" && (
                  <button
                    style={{ ...buttonSecondary, padding: "4px 10px", fontSize: 12 }}
                    onClick={() => payrollApi.downloadPayslipPdf(p.id)}
                  >
                    Download PDF
                  </button>
                )}
              </div>
            </div>

            {p.warnings && p.warnings.length > 0 && (
              <div style={{ fontSize: 12, color: tokens.red, marginBottom: 8 }}>
                {p.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
              </div>
            )}

            {p.lines && p.lines.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <tbody>
                  {p.lines.sort((a, b) => a.sequence - b.sequence).map((line) => (
                    <tr key={line.id} style={{
                      borderTop: `1px solid ${tokens.border}`,
                      fontWeight: line.rule_code === "NET" ? 600 : 400,
                    }}>
                      <td style={{ padding: "6px 4px" }}>{line.rule_name}</td>
                      <td style={{ padding: "6px 4px", color: tokens.inkMuted }}>{line.category}</td>
                      <td style={{ padding: "6px 4px", textAlign: "right" }}>₹{line.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: 12, color: tokens.inkMuted, margin: 0 }}>Not yet computed.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
