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
        setLoadingPlan(null);
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
        setLoadingPlan(null);
        return;
      }

      window.location.href = out.url;
    } catch (e: any) {
      setMsg(`❌ 通信エラー：${e?.message ?? "unknown"}`);
      setLoadingPlan(null);
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
              gridTemplateColumns: "1.1fr 0.9fr",
              alignItems: "start",
            }}
          >
            <div>
              <div className="page-eyebrow">小論設計室｜料金プラン</div>
              <h1 className="page-title">料金プラン</h1>
              <p className="page-lead">
                無料診断から始めて、必要に応じて詳細添削や再確認につなげられます。
              </p>

              <p style={{ marginTop: 12 }}>
                小論設計室では、無料で使える機能に加えて、
                より詳しい確認に使えるProチケット付きの有料プランを用意しています。
              </p>

              <div className="card" style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>まずは無料で利用</div>
                <p style={{ marginTop: 10 }}>
                  小論文を投稿して、点数・要約・改善点を確認できます。
                  まずは無料診断で自分の課題を把握し、
                  もっと深く見たいときに有料プランを使うのがおすすめです。
                </p>

                <div className="button-row" style={{ marginTop: 16 }}>
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
              <div
                className="card"
                style={{
                  background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                }}
              >
                <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700 }}>
                  プランの考え方
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                  {[
                    ["無料診断", "まずは現在の課題を把握するための入口"],
                    ["Basic", "少しずつ継続して改善したい人向け"],
                    ["Plus", "頻繁に再確認しながら伸ばしたい人向け"],
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
                  <div style={{ fontSize: 13, opacity: 0.75 }}>おすすめの始め方</div>
                  <div style={{ marginTop: 6, fontWeight: 800 }}>
                    無料診断 → 必要ならBasic → さらに継続するならPlus
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>プラン一覧</h2>

          <div
            className="card-grid"
            style={{
              marginTop: 18,
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 22 }}>Basic</div>
              <p style={{ marginTop: 10, fontSize: 18 }}>
                月額 <b>500円</b>
              </p>
              <p style={{ marginTop: 8 }}>
                毎月 <b>Pro +40</b> を付与します。
              </p>
              <p style={{ marginTop: 10, color: "var(--muted)" }}>
                継続的に少しずつ添削を受けたい方向けのプランです。
              </p>

              <ul style={{ marginTop: 14, paddingLeft: 20 }}>
                <li>詳細確認のためのPro利用</li>
                <li>月額を抑えて続けやすい</li>
                <li>初めて有料化する人向け</li>
              </ul>

              <div className="button-row" style={{ marginTop: 18 }}>
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
                boxShadow: "0 14px 32px rgba(37, 99, 235, 0.08)",
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
                毎月 <b>Pro +100</b> を付与します。
              </p>
              <p style={{ marginTop: 10, color: "var(--muted)" }}>
                頻繁に再採点や練習を進めたい方向けのプランです。
              </p>

              <ul style={{ marginTop: 14, paddingLeft: 20 }}>
                <li>たくさん書いて改善したい人向け</li>
                <li>再確認を繰り返しやすい</li>
                <li>継続学習との相性が良い</li>
              </ul>

              <div className="button-row" style={{ marginTop: 18 }}>
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

        {msg && (
          <>
            <hr className="divider" />
            <section className="section">
              <div
                className="card"
                style={{
                  background: "#f9fafb",
                }}
              >
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg}</pre>
              </div>
            </section>
          </>
        )}

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