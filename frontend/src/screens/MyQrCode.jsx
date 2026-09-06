import React, { useEffect, useState } from "react";
import { tokens, mono, panelStyle } from "../tokens";
import { coreApi } from "../api/coreApi";

export default function MyQrCode() {
  const [imgUrl, setImgUrl] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl;
    coreApi.getMyQrCodeBlob()
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setImgUrl(objectUrl);
      })
      .catch((err) => setError(err.message));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, []);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 480 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>My QR Code</h2>
      <p style={{ margin: "0 0 18px", fontSize: 12, color: tokens.inkMuted, fontFamily: mono }}>
        Personal to you — show this to the attendance scanner at the entrance.
        First scan of the day checks you in, the next scan checks you out.
      </p>

      <div style={{ ...panelStyle, textAlign: "center" }}>
        {error && <p style={{ color: tokens.oxblood, fontSize: 13 }}>{error}</p>}
        {imgUrl && <img src={imgUrl} alt="Your personal attendance QR code" style={{ width: 280, height: 280 }} />}
        {!imgUrl && !error && <p style={{ color: tokens.inkMuted, fontSize: 13 }}>Loading…</p>}
      </div>
      <p style={{ marginTop: 12, fontSize: 12, color: tokens.inkMuted }}>
        Keep this private — anyone who can show this code can record attendance under your name.
      </p>
    </div>
  );
}
