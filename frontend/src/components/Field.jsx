import React from "react";
import { tokens, labelStyle, inputStyle } from "../tokens";

const hintStyle = { fontSize: 11, color: tokens.inkMuted, marginTop: 3, lineHeight: 1.3 };
const errorStyle = { fontSize: 11, color: tokens.oxblood, marginTop: 3, lineHeight: 1.3, fontWeight: 500 };
const asteriskStyle = { color: tokens.oxblood, marginLeft: 3 };

// Standard label + input slot + constraint hint + validation error, used
// consistently across every data-entry form so a field's rules are always
// visible before the user gets a rejection. `required` marks the label
// with an asterisk - purely visual, the actual enforcement is the validator
// passed in by the screen.
export default function Field({ label, hint, error, required, style, children }) {
  return (
    <div style={style}>
      <label style={labelStyle}>
        {label}
        {required && <span style={asteriskStyle} aria-hidden="true">*</span>}
      </label>
      {children}
      {error ? <div style={errorStyle}>{error}</div> : hint ? <div style={hintStyle}>{hint}</div> : null}
    </div>
  );
}

export function fieldInputStyle(hasError) {
  return hasError ? { ...inputStyle, borderColor: tokens.oxblood } : inputStyle;
}
