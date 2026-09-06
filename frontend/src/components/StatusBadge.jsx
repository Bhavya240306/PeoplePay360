import React from "react";
import { tokens, stampStyle } from "../tokens";

// Extended to cover every status across every module — still one map,
// one visual language, so "Draft" looks the same on a Contract, a
// Payrun, or a Payslip.
const COLOR_MAP = {
  Active: tokens.forest,
  Present: tokens.forest,
  Approved: tokens.forest,
  Paid: tokens.forest,
  Computed: tokens.forest,

  "On Leave": tokens.amber,
  Late: tokens.amber,
  Draft: tokens.amber,
  Pending: tokens.amber,
  Submitted: tokens.amber,
  Validated: tokens.amber,

  Inactive: tokens.oxblood,
  Absent: tokens.oxblood,
  Expired: tokens.oxblood,
  Refused: tokens.oxblood,
  "Missing check-out": tokens.oxblood,

  "Full-time": tokens.slate,
  "Part-time": tokens.slate,
  Monthly: tokens.slate,
  Biweekly: tokens.slate,
};

function titleCase(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

export default function StatusBadge({ status }) {
  const label = titleCase(status);
  const color = COLOR_MAP[label] || COLOR_MAP[status] || tokens.inkMuted;
  return <span style={stampStyle(color)}>{label}</span>;
}
