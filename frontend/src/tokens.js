export const tokens = {
  bg: "#F5F6F2",
  surface: "#FFFFFF",
  border: "#DDE1DA",
  ink: "#1B2B22",
  inkMuted: "#5B6B5F",
  primary: "#2F6F4F",
  primaryTint: "#E6EFE7",
  amber: "#B8862C",
  amberTint: "#F8EEDC",
  red: "#A23B3B",
  redTint: "#F7E7E5",
  blue: "#3A6EA5",
  blueTint: "#E6EEF5",
  // Added: the reference had no neutral tone, needed for "Draft" status
  // badges which shouldn't read as positive, warning, or negative.
  gray: "#6B6F66",
  grayTint: "#ECEDE9",
};

export const fontStack =
  "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif";

export const badgeStyle = (bg, color) => ({
  display: "inline-block",
  fontSize: 12,
  fontWeight: 500,
  padding: "3px 9px",
  borderRadius: 5,
  background: bg,
  color,
});

export const panelStyle = {
  background: tokens.surface,
  border: `1px solid ${tokens.border}`,
  borderRadius: 8,
  padding: "16px 18px",
};

export const buttonPrimary = {
  background: tokens.primary,
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

export const buttonSecondary = {
  background: tokens.surface,
  color: tokens.ink,
  border: `1px solid ${tokens.border}`,
  borderRadius: 6,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

export const inputStyle = {
  border: `1px solid ${tokens.border}`,
  borderRadius: 6,
  padding: "7px 10px",
  fontSize: 13,
  color: tokens.ink,
  background: tokens.surface,
  width: "100%",
  boxSizing: "border-box",
};

export const labelStyle = {
  fontSize: 12,
  fontWeight: 500,
  color: tokens.inkMuted,
  marginBottom: 4,
  display: "block",
};

// Single source of truth for every status badge across every screen —
// Payrun status, Payslip status, and (later) Contract/TimeOff status all
// resolve through this one map, so "Draft" looks identical everywhere.
export const STATUS_BADGE = {
  draft: badgeStyle(tokens.grayTint, tokens.gray),
  computed: badgeStyle(tokens.blueTint, tokens.blue),
  validated: badgeStyle(tokens.amberTint, tokens.amber),
  paid: badgeStyle(tokens.primaryTint, tokens.primary),
  approved: badgeStyle(tokens.primaryTint, tokens.primary),
  submitted: badgeStyle(tokens.blueTint, tokens.blue),
  refused: badgeStyle(tokens.redTint, tokens.red),
  active: badgeStyle(tokens.primaryTint, tokens.primary),
};

export function statusBadgeProps(status) {
  return STATUS_BADGE[status] || badgeStyle(tokens.grayTint, tokens.gray);
}
