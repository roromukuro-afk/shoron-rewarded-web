"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "../lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const sendMagicLink = async () => {
    if (!email.trim()) {
      setMsg("❌ メールアドレスを入力してください。");
      return;
    }

    setSending(true);
    setMsg("ログインリンクを送信中…");

    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

      const { error } = await supabaseBrowser.auth.signInWithOtp({
        email: email.trim(),
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
    } finally {
      setSending(false);
    }
  };

  return (
    <main>
      <div className="container">
        <section style={{ padding: "40px 0 12px" }}>
          <div className="hero-grid">
            <div>
              <div className="page-eyebrow">小論設計室｜ログイン</div>
              <h1 className="page-title">ログイン</h1>
              <p className="page-lead">
                メールアドレスだけで、かんたんにログインできます。
              </p>

              <p style={{ marginTop: 12 }}>
                ログインすると、投稿履歴、チケット残高、契約状況の確認がしやすくなります。
                継続して使うならログインしておくのがおすすめです。
              </p>

              <div className="card" style={{ marginTop: 20 }}>
                <label className="form-label">
                  <div className="form-label-text">メールアドレス</div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="form-input"
                  />
                  <div className="form-help">
                    入力したメールアドレス宛にログインリンクを送信します。
                  </div>
                </label>

                <div className="button-row">
                  <button
                    onClick={sendMagicLink}
                    disabled={sending}
                    className="button-primary"
                    style={{ opacity: sending ? 0.75 : 1 }}
                  >
                    {sending ? "送信中…" : "ログインリンクを送る"}
                  </button>

                  <Link href="/" className="button-secondary">
                    トップへ戻る
                  </Link>
                </div>

                {msg && <pre className="status-box">{msg}</pre>}
              </div>
            </div>

            <div>
              <div className="soft-panel">
                <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700 }}>
                  ログインするとできること
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                  {[
                    ["投稿履歴の確認", "過去に書いた小論文と結果を見返せます。"],
                    ["チケット残高の確認", "Free / Pro の残高をまとめて確認できます。"],
                    ["契約状況の確認", "料金プランや支払い状況を把握できます。"],
                  ].map(([title, desc]) => (
                    <div key={title} className="card">
                      <div style={{ fontWeight: 900 }}>{title}</div>
                      <div style={{ marginTop: 6, fontSize: 14, color: "var(--muted)" }}>
                        {desc}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="dark-panel">
                  <div className="dark-panel-title">おすすめ</div>
                  <div className="dark-panel-body">
                    無料診断を何度か使うなら、ログインして履歴を残すのがおすすめです。
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>はじめて使う人へ</div>
                <p style={{ marginTop: 10 }}>
                  まずはログインせずに無料診断を試すこともできます。
                  そのあとでログインして継続利用に切り替えても大丈夫です。
                </p>

                <div className="button-row">
                  <Link href="/submit" className="button-secondary">
                    先に無料診断を試す
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}