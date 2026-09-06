import React, { useEffect, useState } from "react";
import { tokens, mono, sans } from "../tokens";
import { notificationsApi } from "../api/notificationsApi";

// Ledger take on a notification bell: a small numbered tally rather than
// a red dot pill, opening a dropdown list of dated entries.
export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    notificationsApi.unreadCount().then((r) => setUnread(r.unread_count)).catch(() => {});
  }, []);

  function toggle() {
    setOpen((o) => !o);
    if (!open) {
      notificationsApi.list().then(setItems).catch(() => {});
    }
  }

  async function markRead(id) {
    await notificationsApi.markRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnread((n) => Math.max(0, n - 1));
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={toggle}
        style={{
          background: "none", border: `1px solid ${tokens.rule}`, borderRadius: 3,
          padding: "5px 10px", fontFamily: mono, fontSize: 12, cursor: "pointer",
          color: unread > 0 ? tokens.oxblood : tokens.inkMuted,
        }}
      >
        Notices · {String(unread).padStart(2, "0")}
      </button>

      {open && (
        <div
          style={{
            position: "absolute", right: 0, top: "calc(100% + 6px)", width: 300,
            background: tokens.surface, border: `1px solid ${tokens.rule}`, borderRadius: 3,
            zIndex: 60, maxHeight: 320, overflowY: "auto",
          }}
        >
          {items.length === 0 && (
            <div style={{ padding: 14, fontSize: 12, color: tokens.inkMuted, fontFamily: sans }}>
              No notices.
            </div>
          )}
          {items.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              style={{
                padding: "10px 14px", borderBottom: `1px solid ${tokens.rule}`,
                fontSize: 12.5, fontFamily: sans, cursor: n.is_read ? "default" : "pointer",
                opacity: n.is_read ? 0.55 : 1,
              }}
            >
              <div>{n.message}</div>
              <div style={{ fontFamily: mono, fontSize: 10.5, color: tokens.inkMuted, marginTop: 3 }}>
                {new Date(n.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
