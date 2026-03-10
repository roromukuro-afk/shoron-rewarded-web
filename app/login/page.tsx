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
        setSending(false);
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
          <div
            style={{
              display: "grid",
              gap: 24,
              gridTemplateColumns: "1.05fr 0.95fr",
              alignItems: "start",
            }}
          >
            <div>
              <div className="page-eyebrow">小論設計室｜ログイン</div>
              <h1 className="page-title">ログイン</h1>
              <p className="page-lead">
                メールアドレスを入力すると、ログイン用リンクを送信します。
              </p>

              <p style={{ marginTop: 12 }}>
                ログインすると、投稿履歴、チケット残高、契約状況の確認や、
                詳細添削の利用がしやすくなります。
              </p>

              <div className="card" style={{ marginTop: 20 }}>
                <label style={{ display: "block" }}>
                  <div style={{ fontWeight: 900, fontSize: 15 }}>メールアドレス</div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    style={{
                      width: "100%",
                      marginTop: 10,
                      padding: 14,
                      borderRadius: 12,
                      border: "1px solid var(--line)",
                      fontSize: 15,
                      background: "#fff",
                    }}
                  />
                </label>

                <div className="button-row" style={{ marginTop: 18 }}>
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

                {msg && (
                  <pre
                    style={{
                      marginTop: 16,
                      whiteSpace: "pre-wrap",
                      background: "#f9fafb",
                      border: "1px solid var(--line)",
                      borderRadius: 12,
                      padding: 14,
                    }}
                  >
                    {msg}
                  </pre>
                )}
              </div>
            </div>

            <div>
              <div
                className="card"
                style={{
                  background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                }}
              >
                <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700 }}>
                  ログインするとできること
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                  {[
                    ["投稿履歴の確認", "これまでの小論文と結果をまとめて見返せます。"],
                    ["チケット残高の確認", "無料・Proの残高や利用状況を確認できます。"],
                    ["契約状況の確認", "料金プランや支払い状況の把握がしやすくなります。"],
                  ].map(([title, desc]) => (
                    <div
                      key={title}
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        border: "1px solid var(--line)",
                        background: "#fff",
                      }}
                    >
                      <div style={{ fontWeight: 900 }}>{title}</div>
                      <div style={{ marginTop: 6, fontSize: 14, color: "var(--muted)" }}>
                        {desc}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 16,
                    padding: 14,
                    borderRadius: 14,
                    background: "#111827",
                    color: "#fff",
                  }}
                >
                  <div style={{ fontSize: 13, opacity: 0.75 }}>おすすめ</div>
                  <div style={{ marginTop: 6, fontWeight: 800 }}>
                    ログインしておくと、学習の継続と見直しがしやすくなります。
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>はじめて使う人へ</div>
                <p style={{ marginTop: 10 }}>
                  まずはログインせずに無料診断を試すこともできます。
                  続けて使いたいときは、あとからログインして履歴管理に切り替えるのがおすすめです。
                </p>

                <div className="button-row" style={{ marginTop: 14 }}>
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