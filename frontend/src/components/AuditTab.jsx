import React, { useEffect, useState } from "react";
import { tokens, mono, sans } from "../tokens";
import { auditApi } from "../api/auditApi";

// Generic "History" tab — drop this into any record's detail view
// (Contract, Salary Rule, Payslip) by passing the model name and id.
// Reads directly from the audit app's signal-driven log, no changes
// needed to whatever model is being viewed.
export default function AuditTab({ modelName, recordId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditApi.history(modelName, recordId).then(setEntries).finally(() => setLoading(false));
  }, [modelName, recordId]);

  if (loading) return <p style={{ fontSize: 12, color: tokens.inkMuted, fontFamily: sans }}>Loading history…</p>;
  if (entries.length === 0)
    return <p style={{ fontSize: 12, color: tokens.inkMuted, fontFamily: sans }}>No recorded changes.</p>;

  return (
    <div>
      {entries.map((e) => (
        <div
          key={e.id}
          style={{
            display: "flex", justifyContent: "space-between",
            padding: "8px 0", borderBottom: `1px solid ${tokens.rule}`,
            fontSize: 12.5, fontFamily: sans,
          }}
        >
          <span>
            <strong style={{ textTransform: "capitalize" }}>{e.action}</strong> by {e.username || "system"}
          </span>
          <span style={{ fontFamily: mono, fontSize: 11, color: tokens.inkMuted }}>
            {new Date(e.timestamp).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
