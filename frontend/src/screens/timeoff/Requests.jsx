import React, { useEffect, useState } from "react";
import { tokens, mono, panelStyle, buttonPrimary, buttonSecondary, buttonSmall, inputStyle, labelStyle, numeral, overlayStyle } from "../../tokens";
import StatusBadge from "../../components/StatusBadge";
import ViewToggle from "../../components/ViewToggle";
import { timeoffApi } from "../../api/timeoffApi";
import { coreApi } from "../../api/coreApi";
import { useAuth, ROLE_LEVEL } from "../../AuthContext";

const emptyForm = { time_off_type: "", date_from: "", date_to: "", reason: "" };
const EDITABLE_STATUSES = ["draft", "submitted"];

const BOARD_COLUMNS = [
  { status: "submitted", label: "Submitted" },
  { status: "approved", label: "Approved" },
  { status: "refused", label: "Refused" },
];

function computeDuration(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) return null;
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  const days = Math.round((to - from) / 86400000) + 1;
  return days > 0 ? days : null;
}

export default function TimeOffRequests() {
  const { roleLevel } = useAuth();
  const canManage = roleLevel >= ROLE_LEVEL["HR Manager"];
  const canUseBoard = canManage;
  const canSubmit = roleLevel === ROLE_LEVEL.Employee;
  const [view, setView] = useState("list");
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => { load(); }, []);
  function load() {
    timeoffApi.listRequests().then(setRequests);
    coreApi.listEmployees().then(setEmployees).catch(() => {});
    timeoffApi.listTypes().then(setTypes);
  }

  function name(list, id) {
    const item = list.find((x) => x.id === id);
    return item ? (item.first_name ? `${item.first_name} ${item.last_name}` : item.name) : `#${id}`;
  }

  function openNewForm() {
    setForm(emptyForm);
    setEditingId(null);
    setEditingStatus(null);
    setError("");
    setShowForm(true);
  }

  function openEditForm(r) {
    if (!canSubmit || !EDITABLE_STATUSES.includes(r.status)) return;
    setForm({
      time_off_type: String(r.time_off_type),
      date_from: r.date_from,
      date_to: r.date_to,
      reason: r.reason || "",
    });
    setEditingId(r.id);
    setEditingStatus(r.status);
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setEditingStatus(null);
    setForm(emptyForm);
  }

  function buildPayload() {
    return {
      time_off_type: Number(form.time_off_type),
      date_from: form.date_from,
      date_to: form.date_to,
      reason: form.reason,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await timeoffApi.updateRequest(editingId, buildPayload());
        if (editingStatus === "draft") await timeoffApi.submitRequest(editingId);
      } else {
        await timeoffApi.createRequest({ ...buildPayload(), draft: false });
      }
      closeForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSaveDraft() {
    setError("");
    try {
      if (editingId) {
        await timeoffApi.updateRequest(editingId, buildPayload());
      } else {
        await timeoffApi.createRequest({ ...buildPayload(), draft: true });
      }
      closeForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCancelRequest() {
    if (!editingId) return;
    setError("");
    try {
      await timeoffApi.cancelRequest(editingId);
      closeForm();
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

  const duration = computeDuration(form.date_from, form.date_to);
  const primaryLabel = !editingId ? "Submit request" : editingStatus === "draft" ? "Submit" : "Save changes";
  const rowClickable = (r) => canSubmit && EDITABLE_STATUSES.includes(r.status);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Time Off Requests</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {canUseBoard && <ViewToggle view={view} onChange={setView} />}
          {canSubmit && <button style={buttonPrimary} onClick={openNewForm}>+ New request</button>}
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
                    <div
                      key={r.id}
                      style={{ ...panelStyle, padding: "10px 12px", cursor: rowClickable(r) ? "pointer" : "default" }}
                      onClick={() => openEditForm(r)}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{name(employees, r.employee)}</div>
                      <div style={{ fontSize: 12, color: tokens.inkMuted, marginBottom: 4 }}>{name(types, r.time_off_type)}</div>
                      <div style={{ ...numeral, fontSize: 12, marginBottom: 8 }}>{r.date_from} → {r.date_to} ({r.duration_days}d)</div>
                      {canManage && r.status === "submitted" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={buttonSmall} onClick={(e) => { e.stopPropagation(); handleApprove(r.id); }}>Approve</button>
                          <button style={buttonSmall} onClick={(e) => { e.stopPropagation(); handleRefuse(r.id); }}>Refuse</button>
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
            {canManage && <div style={{ width: 140 }}>Action</div>}
          </div>
          {requests.map((r) => (
            <div
              key={r.id}
              style={{ display: "flex", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${tokens.rule}`, fontSize: 13.5, cursor: rowClickable(r) ? "pointer" : "default" }}
              onClick={() => openEditForm(r)}
            >
              <div style={{ flex: 1.4 }}>{name(employees, r.employee)}</div>
              <div style={{ flex: 1.2, color: tokens.inkMuted }}>{name(types, r.time_off_type)}</div>
              <div style={{ flex: 1.2, ...numeral, fontSize: 12.5 }}>{r.date_from} → {r.date_to}</div>
              <div style={{ flex: 0.8, ...numeral }}>{r.duration_days}</div>
              <div style={{ width: 100 }}><StatusBadge status={r.status} /></div>
              {canManage && (
                <div style={{ width: 140, display: "flex", gap: 6 }}>
                  {r.status === "submitted" && (
                    <>
                      <button style={buttonSmall} onClick={(e) => { e.stopPropagation(); handleApprove(r.id); }}>Approve</button>
                      <button style={buttonSmall} onClick={(e) => { e.stopPropagation(); handleRefuse(r.id); }}>Refuse</button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          {requests.length === 0 && <p style={{ color: tokens.inkMuted, fontSize: 13, padding: "16px 0" }}>No requests recorded.</p>}
        </div>
      )}

      {showForm && (
        <div style={overlayStyle}>
          <form onSubmit={handleSubmit} style={{ ...panelStyle, width: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>{editingId ? "Edit time off request" : "New time off request"}</h3>
              <button type="button" onClick={closeForm} style={{ border: "none", background: "none", cursor: "pointer", color: tokens.inkMuted }}>✕</button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Type<span style={{ color: tokens.oxblood, marginLeft: 3 }}>*</span></label>
              <select style={inputStyle} value={form.time_off_type} onChange={(e) => setForm({ ...form, time_off_type: e.target.value })} required>
                <option value="">Select…</option>
                {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
              <div>
                <label style={labelStyle}>From<span style={{ color: tokens.oxblood, marginLeft: 3 }}>*</span></label>
                <input type="date" style={inputStyle} value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} required />
              </div>
              <div>
                <label style={labelStyle}>To<span style={{ color: tokens.oxblood, marginLeft: 3 }}>*</span></label>
                <input type="date" style={inputStyle} value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} required />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Duration</label>
              <div style={{ ...inputStyle, ...numeral, background: tokens.paper, color: tokens.inkMuted }}>
                {duration != null ? `${duration} day${duration === 1 ? "" : "s"}` : "—"}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Reason</label>
              <input style={inputStyle} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
            {error && <div style={{ color: tokens.oxblood, fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                {editingId && (
                  <button type="button" style={buttonSecondary} onClick={handleCancelRequest}>Cancel request</button>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {(!editingId || editingStatus === "draft") && (
                  <button type="button" style={buttonSecondary} onClick={handleSaveDraft}>Save as draft</button>
                )}
                <button type="submit" style={buttonPrimary}>{primaryLabel}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
