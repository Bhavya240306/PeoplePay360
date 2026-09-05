import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { tokens, fontStack, panelStyle, buttonPrimary, inputStyle, labelStyle } from "../tokens";
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
      navigate("/payroll/payruns");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: tokens.bg,
        fontFamily: fontStack,
      }}
    >
      <form onSubmit={handleSubmit} style={{ ...panelStyle, width: 340 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: tokens.ink, margin: "0 0 4px" }}>
          PeoplePay360
        </h1>
        <p style={{ fontSize: 13, color: tokens.inkMuted, margin: "0 0 20px" }}>
          Sign in to continue.
        </p>

        <label style={labelStyle}>Username</label>
        <input
          style={{ ...inputStyle, marginBottom: 14 }}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />

        <label style={labelStyle}>Password</label>
        <input
          type="password"
          style={{ ...inputStyle, marginBottom: 16 }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div style={{ color: tokens.red, fontSize: 12, marginBottom: 12 }}>{error}</div>
        )}

        <button type="submit" style={{ ...buttonPrimary, width: "100%" }} disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
