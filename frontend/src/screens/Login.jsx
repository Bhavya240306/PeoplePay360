import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { tokens, serifDisplay, sans, mono, panelStyle, buttonPrimary, inputStyle, labelStyle } from "../tokens";
import { useAuth } from "../AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/employees");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: tokens.paper, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans }}>
      <form onSubmit={handleSubmit} style={{ ...panelStyle, width: 360 }}>
        <h1 style={{ fontFamily: serifDisplay, fontSize: 22, fontWeight: 600, color: tokens.ink, margin: "0 0 4px" }}>
          PeoplePay360
        </h1>
        <p style={{ fontFamily: mono, fontSize: 11, color: tokens.inkMuted, margin: "0 0 20px" }}>
          HR Register — sign in to continue
        </p>

        <label style={labelStyle}>Username</label>
        <input style={inputStyle} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />

        <div style={{ height: 12 }} />
        <label style={labelStyle}>Password</label>
        <input type="password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} />

        {error && <div style={{ color: tokens.oxblood, fontSize: 12, marginTop: 12 }}>{error}</div>}

        <button type="submit" style={{ ...buttonPrimary, width: "100%", marginTop: 18 }} disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
