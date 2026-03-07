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
  };

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24, lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>料金プラン</h1>

      <p style={{ marginTop: 16 }}>
        本サービスでは、無料採点に加えて、有料プランによりProチケットを利用できます。
        Proチケットを使うと、より厳密な再採点や詳しいフィードバックを受けられます。
      </p>

      <hr style={{ margin: "24px 0" }} />

      <section>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>無料利用</h2>
        <p style={{ marginTop: 12 }}>
          無料でも小論文の投稿と基本的な採点結果の確認ができます。
          まずは無料で試してから、必要に応じて有料プランをご利用ください。
        </p>
      </section>

      <hr style={{ margin: "24px 0" }} />

      <section>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>有料プラン</h2>

        <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
          <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
            <h3 style={{ fontSize: 20, fontWeight: 900 }}>Basic</h3>
            <p style={{ marginTop: 8 }}>
              月額 <b>500円</b>
            </p>
            <p style={{ marginTop: 8 }}>
              毎月 <b>Pro +40</b> を付与します。
            </p>
            <p style={{ marginTop: 8, fontSize: 14, opacity: 0.85 }}>
              継続的に少しずつ添削を受けたい方向けのプランです。
            </p>

            <button
              onClick={() => go("basic")}
              style={{
                marginTop: 14,
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #ccc",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Basicを購入する
            </button>
          </div>

          <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
            <h3 style={{ fontSize: 20, fontWeight: 900 }}>Plus</h3>
            <p style={{ marginTop: 8 }}>
              月額 <b>960円</b>
            </p>
            <p style={{ marginTop: 8 }}>
              毎月 <b>Pro +100</b> を付与します。
            </p>
            <p style={{ marginTop: 8, fontSize: 14, opacity: 0.85 }}>
              頻繁に再採点や練習を進めたい方向けのプランです。
            </p>

            <button
              onClick={() => go("plus")}
              style={{
                marginTop: 14,
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #ccc",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Plusを購入する
            </button>
          </div>
        </div>
      </section>

      <hr style={{ margin: "24px 0" }} />

      <section>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>注意事項</h2>
        <ul style={{ marginTop: 12, paddingLeft: 20 }}>
          <li>料金は税込表示です。</li>
          <li>決済はStripeを通じて行われます。</li>
          <li>デジタルサービスの性質上、法令上必要な場合を除き返品・返金には原則応じられません。</li>
          <li>契約内容の確認や変更は、購入後にダッシュボードから行えます。</li>
        </ul>
      </section>

      {msg && <pre style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>{msg}</pre>}

      <hr style={{ margin: "24px 0" }} />

      <footer style={{ fontSize: 14, opacity: 0.85, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/privacy">プライバシーポリシー</Link>
        <Link href="/terms">利用規約</Link>
        <Link href="/commerce">特定商取引法に基づく表記</Link>
        <Link href="/contact">お問い合わせ</Link>
      </footer>

      <div style={{ marginTop: 20 }}>
        <Link href="/dashboard">→ ダッシュボードへ戻る</Link>
      </div>
    </main>
  );
}