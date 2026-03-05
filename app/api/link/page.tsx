// app/link/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function LinkPage() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async () => {
    setMsg("送信中…");
    try {
      const res = await fetch("/api/link/confirm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (res.ok) {
        setMsg("✅ 連動できた！このまま広告ページへ進んでOK");
      } else {
        setMsg(`❌ 失敗：${data?.error ?? res.status}`);
      }
    } catch {
      setMsg("❌ 通信エラー");
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>PCと連動（ペアリング）</h1>

      <p style={{ marginTop: 12, lineHeight: 1.7 }}>
        PCのダッシュボードで表示された <b>6桁コード</b> を入れてください。
      </p>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
        placeholder="例：123456"
        inputMode="numeric"
        style={{
          marginTop: 12,
          padding: "12px 14px",
          border: "1px solid #ccc",
          borderRadius: 10,
          width: "100%",
          maxWidth: 240,
          fontSize: 18,
          letterSpacing: 2,
        }}
      />

      <div style={{ marginTop: 12 }}>
        <button
          onClick={submit}
          disabled={code.length !== 6}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #ccc",
            cursor: code.length === 6 ? "pointer" : "not-allowed",
            fontWeight: 700,
            opacity: code.length === 6 ? 1 : 0.5,
          }}
        >
          連動する
        </button>
      </div>

      <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{msg}</p>

      <div style={{ marginTop: 18 }}>
        <Link href="/rewarded">→ 広告ページへ</Link>
      </div>
    </main>
  );
}