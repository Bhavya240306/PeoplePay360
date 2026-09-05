import React from "react";
import { tokens, stampStyle } from "../tokens";

// A "stamp": bordered, unfilled, reads like an official mark on a ledger
// entry rather than a decorative colored pill.
const COLOR_MAP = {
  Active: tokens.forest,
  Present: tokens.forest,
  Approved: tokens.forest,

  "On Leave": tokens.amber,
  Late: tokens.amber,
  Draft: tokens.amber,
  Pending: tokens.amber,

  Inactive: tokens.oxblood,
  Absent: tokens.oxblood,
  Expired: tokens.oxblood,
  "Missing check-out": tokens.oxblood,

  "Full-time": tokens.slate,
  "Part-time": tokens.slate,
};

export default function StatusBadge({ status }) {
  const color = COLOR_MAP[status] || tokens.inkMuted;
  return <span style={stampStyle(color)}>{status}</span>;
}
