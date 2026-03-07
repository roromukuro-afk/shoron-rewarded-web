"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "../lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const sendMagicLink = async () => {
    setMsg("送信中…");

    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

      const { error } = await supabaseBrowser.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/dashboard`,
        },
      });

      if (error) {
        setMsg(`❌ 送信失敗：${error.message}`);
        return;
      }

      setMsg("✅ ログイン用メールを送信しました。メール内リンクからログインしてください。");
    } catch (e: any) {
      setMsg(`❌ 通信エラー：${e?.message ?? "unknown"}`);
    }
  };

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 24, lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>ログイン</h1>

      <p style={{ marginTop: 16 }}>
        メールアドレスを入力すると、ログイン用リンクを送信します。
      </p>

      <div style={{ marginTop: 20, display: "grid", gap: 14, maxWidth: 520 }}>
        <label>
          <div style={{ fontWeight: 900 }}>メールアドレス</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            style={{
              width: "100%",
              marginTop: 8,
              padding: 12,
              borderRadius: 10,
              border: "1px solid #ccc",
            }}
          />
        </label>

        <button
          onClick={sendMagicLink}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #ccc",
            fontWeight: 900,
            cursor: "pointer",
            width: 220,
          }}
        >
          ログインリンクを送る
        </button>
      </div>

      {msg && <pre style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>{msg}</pre>}

      <div style={{ marginTop: 20 }}>
        <Link href="/">→ トップへ戻る</Link>
      </div>

      <hr style={{ margin: "24px 0" }} />

      <footer style={{ fontSize: 14, opacity: 0.85, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/privacy">プライバシーポリシー</Link>
        <Link href="/terms">利用規約</Link>
        <Link href="/commerce">特定商取引法に基づく表記</Link>
        <Link href="/contact">お問い合わせ</Link>
      </footer>
    </main>
  );
}