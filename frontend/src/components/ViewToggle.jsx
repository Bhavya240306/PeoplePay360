import React from "react";
import { tokens, buttonSmall } from "../tokens";

export default function ViewToggle({ view, onChange }) {
  return (
    <div style={{ display: "flex", border: `1px solid ${tokens.ruleStrong}`, borderRadius: 3 }}>
      <button
        onClick={() => onChange("list")}
        style={{ ...buttonSmall, border: "none", background: view === "list" ? tokens.forestTint : "transparent" }}
      >
        List
      </button>
      <button
        onClick={() => onChange("board")}
        style={{ ...buttonSmall, border: "none", background: view === "board" ? tokens.forestTint : "transparent" }}
      >
        Board
      </button>
    </div>
  );
}
