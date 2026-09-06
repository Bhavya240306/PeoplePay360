import React, { useEffect, useState } from "react";
import { tokens, mono, panelStyle, buttonPrimary, buttonSecondary, buttonSmall, inputStyle, labelStyle, numeral, overlayStyle } from "../../tokens";
import StatusBadge from "../../components/StatusBadge";
import { timeoffApi } from "../../api/timeoffApi";
import { coreApi } from "../../api/coreApi";
import { useAuth, ROLE_LEVEL } from "../../AuthContext";

const emptyForm = { employee: "", time_off_type: "", date_from: "", date_to: "", duration_days: "", reason: "" };

const BOARD_COLUMNS = [
  { status: "submitted", label: "Submitted" },
  { status: "approved", label: "Approved" },
  { status: "refused", label: "Refused" },
];

export default function TimeOffRequests() {
  const { roleLevel } = useAuth();
  const canUseBoard = roleLevel >= ROLE_LEVEL["HR Manager"];
  const [view, setView] = useState("list");
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => { load(); }, []);
  function load() {
    timeoffApi.listRequests().then(setRequests);
    coreApi.listEmployees().then(setEmployees);
    timeoffApi.listTypes().then(setTypes);
  }

  function name(list, id) {
    const item = list.find((x) => x.id === id);
    return item ? (item.first_name ? `${item.first_name} ${item.last_name}` : item.name) : `#${id}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await timeoffApi.createRequest({
        ...form, employee: Number(form.employee), time_off_type: Number(form.time_off_type), status: "submitted",
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleApprove(id) {
    setActionError("");
    try {
      await timeoffApi.approveRequest(id);
      load();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleRefuse(id) {
    setActionError("");
    try {
      await timeoffApi.refuseRequest(id);
      load();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Time Off Requests</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {canUseBoard && (
            <div style={{ display: "flex", border: `1px solid ${tokens.ruleStrong}`, borderRadius: 3 }}>
              <button
                onClick={() => setView("list")}
                style={{ ...buttonSmall, border: "none", background: view === "list" ? tokens.forestTint : "transparent" }}
              >
                List
              </button>
              <button
                onClick={() => setView("board")}
                style={{ ...buttonSmall, border: "none", background: view === "board" ? tokens.forestTint : "transparent" }}
              >
                Board
              </button>
            </div>
          )}
          <button style={buttonPrimary} onClick={() => setShowForm(true)}>+ New request</button>
        </div>
      </div>
      {actionError && <div style={{ color: tokens.oxblood, fontSize: 12, marginBottom: 12 }}>{actionError}</div>}

      {view === "board" && canUseBoard ? (
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          {BOARD_COLUMNS.map((col) => {
            const items = requests.filter((r) => r.status === col.status);
            return (
              <div key={col.status} style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: mono, fontSize: 10.5, color: tokens.inkMuted, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                  <span>{col.label}</span>
                  <span>{items.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map((r) => (
                    <div key={r.id} style={{ ...panelStyle, padding: "10px 12px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{name(employees, r.employee)}</div>
                      <div style={{ fontSize: 12, color: tokens.inkMuted, marginBottom: 4 }}>{name(types, r.time_off_type)}</div>
                      <div style={{ ...numeral, fontSize: 12, marginBottom: 8 }}>{r.date_from} → {r.date_to} ({r.duration_days}d)</div>
                      {r.status === "submitted" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={buttonSmall} onClick={() => handleApprove(r.id)}>Approve</button>
                          <button style={buttonSmall} onClick={() => handleRefuse(r.id)}>Refuse</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 12 }}>—</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", fontFamily: mono, fontSize: 10.5, color: tokens.inkMuted, borderBottom: `1px solid ${tokens.ruleStrong}`, paddingBottom: 6 }}>
            <div style={{ flex: 1.4 }}>Employee</div>
            <div style={{ flex: 1.2 }}>Type</div>
            <div style={{ flex: 1.2 }}>Dates</div>
            <div style={{ flex: 0.8 }}>Days</div>
            <div style={{ width: 100 }}>Status</div>
            <div style={{ width: 140 }}>Action</div>
          </div>
          {requests.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${tokens.rule}`, fontSize: 13.5 }}>
              <div style={{ flex: 1.4 }}>{name(employees, r.employee)}</div>
              <div style={{ flex: 1.2, color: tokens.inkMuted }}>{name(types, r.time_off_type)}</div>
              <div style={{ flex: 1.2, ...numeral, fontSize: 12.5 }}>{r.date_from} → {r.date_to}</div>
              <div style={{ flex: 0.8, ...numeral }}>{r.duration_days}</div>
              <div style={{ width: 100 }}><StatusBadge status={r.status} /></div>
              <div style={{ width: 140, display: "flex", gap: 6 }}>
                {r.status === "submitted" && (
                  <>
                    <button style={buttonSmall} onClick={() => handleApprove(r.id)}>Approve</button>
                    <button style={buttonSmall} onClick={() => handleRefuse(r.id)}>Refuse</button>
                  </>
                )}
              </div>
            </div>
          ))}
          {requests.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 13, padding: "16px 0" }}>No requests recorded.</p>}
        </div>
      )}

      {showForm && (
        <div style={overlayStyle}>
          <form onSubmit={handleSubmit} style={{ ...panelStyle, width: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>New time off request</h3>
              <button type="button" onClick={() => setShowForm(false)} style={{ border: "none", background: "none", cursor: "pointer", color: tokens.inkMuted }}>✕</button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Employee</label>
              <select style={inputStyle} value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} required>
                <option value="">Select…</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Type</label>
              <select style={inputStyle} value={form.time_off_type} onChange={(e) => setForm({ ...form, time_off_type: e.target.value })} required>
                <option value="">Select…</option>
                {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
              <div>
                <label style={labelStyle}>From</label>
                <input type="date" style={inputStyle} value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} required />
              </div>
              <div>
                <label style={labelStyle}>To</label>
                <input type="date" style={inputStyle} value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} required />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Duration (days)</label>
              <input type="number" style={inputStyle} value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} required />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Reason</label>
              <input style={inputStyle} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
            {error && <div style={{ color: tokens.oxblood, fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <button type="submit" style={buttonPrimary}>Submit request</button>
          </form>
        </div>
      )}
    </div>
  );
}
