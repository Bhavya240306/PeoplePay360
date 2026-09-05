import React from "react";
import { useNavigate } from "react-router-dom";
import { tokens, mono, sans } from "../tokens";

// Ledger cross-reference: a record count with a line beneath it, like an
// index entry pointing to another page of the book, rather than a
// rounded pill button.
export default function SmartButton({ label, count, to, disabled }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => !disabled && navigate(to)}
      disabled={disabled}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 2,
        background: "transparent",
        border: "none",
        borderBottom: `2px solid ${disabled ? tokens.rule : tokens.forest}`,
        padding: "4px 18px 8px 0",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1,
      }}
      title={disabled ? "Owned by another module" : undefined}
    >
      <span style={{ fontFamily: mono, fontSize: 20, fontWeight: 500, color: tokens.ink }}>
        {String(count).padStart(2, "0")}
      </span>
      <span style={{ fontFamily: sans, fontSize: 11.5, color: tokens.inkMuted }}>{label}</span>
    </button>
  );
}
