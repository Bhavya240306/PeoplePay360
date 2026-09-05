// Ledger design system — built around what this product actually is:
// a payroll/HR record book. Rows are sequential entries, numbers get
// tabular monospace treatment, status is a stamp, not a pill.

export const tokens = {
  paper: "#EFEEE6",
  surface: "#F8F7F2",
  rule: "#D8D6CC",
  ruleStrong: "#B9B6A8",
  ink: "#1A2420",
  inkMuted: "#5F6B63",
  forest: "#2C5F44",
  forestTint: "#E3EBE4",
  oxblood: "#8B3A2B",
  oxbloodTint: "#F3E5E1",
  amber: "#95672A",
  amberTint: "#F2E9D8",
  slate: "#3E5266",
  slateTint: "#E5EAEE",
};

export const serifDisplay = "'Fraunces', 'Iowan Old Style', Georgia, serif";
export const mono = "'IBM Plex Mono', 'SFMono-Regular', Menlo, monospace";
export const sans = "'IBM Plex Sans', -apple-system, 'Segoe UI', sans-serif";

// A stamp reads as an official mark: bordered, no fill, small caps-less
// label, slightly wider letter-spacing rather than a solid color pill.
export const stampStyle = (color) => ({
  display: "inline-block",
  fontFamily: mono,
  fontSize: 11,
  letterSpacing: "0.02em",
  padding: "2px 8px",
  border: `1px solid ${color}`,
  borderRadius: 3,
  color,
  background: "transparent",
});

export const panelStyle = {
  background: tokens.surface,
  border: `1px solid ${tokens.rule}`,
  borderRadius: 3,
  padding: "18px 20px",
};

export const buttonPrimary = {
  background: tokens.forest,
  color: tokens.surface,
  border: `1px solid ${tokens.forest}`,
  borderRadius: 3,
  padding: "8px 16px",
  fontSize: 13,
  fontFamily: sans,
  fontWeight: 500,
  cursor: "pointer",
};

export const buttonSecondary = {
  background: "transparent",
  color: tokens.ink,
  border: `1px solid ${tokens.ruleStrong}`,
  borderRadius: 3,
  padding: "8px 16px",
  fontSize: 13,
  fontFamily: sans,
  fontWeight: 500,
  cursor: "pointer",
};

export const inputStyle = {
  display: "block",
  width: "100%",
  marginTop: 4,
  padding: "7px 9px",
  borderRadius: 3,
  border: `1px solid ${tokens.rule}`,
  fontSize: 13,
  color: tokens.ink,
  boxSizing: "border-box",
  fontFamily: sans,
  background: tokens.surface,
};

export const labelStyle = {
  fontSize: 11.5,
  color: tokens.inkMuted,
  fontFamily: sans,
  display: "block",
};

export const numeral = { fontFamily: mono, fontVariantNumeric: "tabular-nums" };
