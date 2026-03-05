// app/billing/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "../lib/supabase-browser";

export default function BillingPage() {
  const [msg, setMsg] = useState("");

  const go = async (plan: "basic" | "plus") => {
    setMsg("Stripeへ移動中…");
    const { data } = await supabaseBrowser.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setMsg("❌ 先にログインしてね（/login）");
      return;
    }

    const res = await fetch("/api/billing/stripe/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan }),
    });

    const out = await res.json();
    if (!res.ok) {
      setMsg(`❌ 失敗：${out?.detail ?? out?.error ?? res.status}`);
      return;
    }

    window.location.href = out.url;
  };

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ fontSize: 24, fontWeight: 900 }}>プラン購入</h1>

      <p style={{ marginTop: 10, lineHeight: 1.7 }}>
        Basic（500円/月）→ Pro +40 /月<br />
        Plus（960円/月）→ Pro +100 /月
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
        <button
          onClick={() => go("basic")}
          style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #ccc", fontWeight: 900 }}
        >
          Basicを購入（500円/月）
        </button>
        <button
          onClick={() => go("plus")}
          style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #ccc", fontWeight: 900 }}
        >
          Plusを購入（960円/月）
        </button>
      </div>

      {msg && <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{msg}</p>}

      <div style={{ marginTop: 18 }}>
        <Link href="/dashboard">→ ダッシュボードへ</Link>
      </div>
    </main>
  );
}