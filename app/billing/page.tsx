"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "../lib/supabase-browser";

export default function BillingPage() {
  const [msg, setMsg] = useState("");
  const [loadingPlan, setLoadingPlan] = useState<"basic" | "plus" | null>(null);

  const go = async (plan: "basic" | "plus") => {
    setLoadingPlan(plan);
    setMsg("Stripeへ移動中…");

    try {
      const { data } = await supabaseBrowser.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setMsg("❌ 先にログインしてください。");
        return;
      }

      const res = await fetch("/api/billing/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });

      const out = await res.json();

      if (!res.ok) {
        setMsg(`❌ 失敗：${out?.detail ?? out?.error ?? res.status}`);
        return;
      }

      window.location.href = out.url;
    } catch (e: any) {
      setMsg(`❌ 通信エラー：${e?.message ?? "unknown"}`);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <main>
      <div className="container">
        <section style={{ padding: "40px 0 12px" }}>
          <div className="hero-grid">
            <div>
              <div className="page-eyebrow">小論設計室｜料金プラン</div>
              <h1 className="page-title">料金プラン</h1>
              <p className="page-lead">
                無料診断から始めて、必要なときだけ詳細添削に進めます。
              </p>

              <p style={{ marginTop: 12 }}>
                まずは無料診断で課題を確認し、
                もっと詳しく見たいときにProチケット付きプランを使う形がおすすめです。
              </p>

              <div className="card" style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>まずは無料で利用</div>
                <p style={{ marginTop: 10 }}>
                  小論文を投稿して、点数・要約・改善点を確認できます。
                  最初から有料にする必要はありません。
                </p>

                <div className="button-row">
                  <Link href="/submit" className="button-primary">
                    無料診断を試す
                  </Link>
                  <Link href="/guide" className="button-secondary">
                    学習ガイドを見る
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <div className="soft-panel">
                <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700 }}>
                  選び方
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                  {[
                    ["無料診断", "まずは今の答案の弱点を知りたい人向け"],
                    ["Basic", "少しずつ継続して改善したい人向け"],
                    ["Plus", "頻繁に見直しながら伸ばしたい人向け"],
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
                  <div className="dark-panel-title">おすすめの順番</div>
                  <div className="dark-panel-body">
                    無料診断 → Basic → 必要に応じて Plus
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>プラン一覧</h2>

          <div className="info-grid-3" style={{ marginTop: 18 }}>
            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 22 }}>Basic</div>
              <p style={{ marginTop: 10, fontSize: 18 }}>
                月額 <b>500円</b>
              </p>
              <p style={{ marginTop: 8 }}>
                毎月 <b>Pro +40</b>
              </p>
              <p style={{ marginTop: 10 }} className="muted">
                少しずつ継続して改善したい人向けです。
              </p>

              <ul style={{ marginTop: 14, paddingLeft: 20 }}>
                <li>費用を抑えて続けやすい</li>
                <li>必要なときに詳しく確認できる</li>
                <li>はじめての有料化向け</li>
              </ul>

              <div className="button-row">
                <button
                  onClick={() => go("basic")}
                  className="button-primary"
                  disabled={loadingPlan !== null}
                  style={{ opacity: loadingPlan && loadingPlan !== "basic" ? 0.7 : 1 }}
                >
                  {loadingPlan === "basic" ? "移動中…" : "Basicを購入する"}
                </button>
              </div>
            </div>

            <div
              className="card"
              style={{
                border: "1px solid #c7d2fe",
                boxShadow: "var(--shadow-strong)",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  marginBottom: 10,
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                おすすめ
              </div>

              <div style={{ fontWeight: 900, fontSize: 22 }}>Plus</div>
              <p style={{ marginTop: 10, fontSize: 18 }}>
                月額 <b>960円</b>
              </p>
              <p style={{ marginTop: 8 }}>
                毎月 <b>Pro +100</b>
              </p>
              <p style={{ marginTop: 10 }} className="muted">
                頻繁に再確認しながら伸ばしたい人向けです。
              </p>

              <ul style={{ marginTop: 14, paddingLeft: 20 }}>
                <li>たくさん書いて改善したい人向け</li>
                <li>見直し回数を増やしやすい</li>
                <li>継続学習との相性が良い</li>
              </ul>

              <div className="button-row">
                <button
                  onClick={() => go("plus")}
                  className="button-primary"
                  disabled={loadingPlan !== null}
                  style={{ opacity: loadingPlan && loadingPlan !== "plus" ? 0.7 : 1 }}
                >
                  {loadingPlan === "plus" ? "移動中…" : "Plusを購入する"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>注意事項</h2>
          <div className="card" style={{ marginTop: 18 }}>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>料金は税込表示です。</li>
              <li>決済はStripeを通じて行われます。</li>
              <li>デジタルサービスの性質上、法令上必要な場合を除き返品・返金には原則応じられません。</li>
              <li>契約内容の確認や変更は、購入後にダッシュボードから行えます。</li>
            </ul>
          </div>
        </section>

        {msg && <pre className="status-box">{msg}</pre>}

        <hr className="divider" />

        <div className="button-row">
          <Link href="/dashboard" className="button-secondary">
            ダッシュボードへ戻る
          </Link>
          <Link href="/contact" className="button-secondary">
            お問い合わせ
          </Link>
        </div>
      </div>
    </main>
  );
}