// app/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "../lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const sendMagicLink = async () => {
    setMsg("送信中…");
    const origin = window.location.origin;

    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      setMsg(`❌ 送信失敗：${error.message}`);
      return;
    }
    setMsg("✅ メールを送ったよ！届いたリンクを開いてログインしてね。");
  };

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>ログイン（メール）</h1>

      <p style={{ marginTop: 12, lineHeight: 1.7 }}>
        メールに届くリンク（Magic Link）でログインします。
      </p>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="example@gmail.com"
        style={{
          marginTop: 12,
          padding: "12px 14px",
          border: "1px solid #ccc",
          borderRadius: 10,
          width: "100%",
          maxWidth: 420,
        }}
      />

      <div style={{ marginTop: 12 }}>
        <button
          onClick={sendMagicLink}
          disabled={!email}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #ccc",
            cursor: email ? "pointer" : "not-allowed",
            fontWeight: 700,
            opacity: email ? 1 : 0.5,
          }}
        >
          ログインリンクを送る
        </button>
      </div>

      <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{msg}</p>

      <div style={{ marginTop: 18 }}>
        <Link href="/dashboard">→ ダッシュボードへ</Link>
      </div>
    </main>
  );
}