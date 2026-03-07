"use client";

import Link from "next/link";

export default function RewardedPage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24, lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>無料チケットについて</h1>

      <p style={{ marginTop: 16 }}>
        このページでは、無料チケットの仕組みや利用方法を案内しています。
      </p>

      <p style={{ marginTop: 10 }}>
        現在、無料ユーザー向けの機能や導線を順次整備しています。
        利用できる内容は、今後の運営状況や機能改善に応じて更新される場合があります。
      </p>

      <hr style={{ margin: "24px 0" }} />

      <section>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>無料利用の考え方</h2>
        <p style={{ marginTop: 12 }}>
          本サービスでは、まず無料で小論文の投稿・採点を試し、
          必要に応じて有料プランやPro再採点を利用できる形にしています。
        </p>
      </section>

      <hr style={{ margin: "24px 0" }} />

      <section>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>ご案内</h2>
        <ul style={{ marginTop: 12, paddingLeft: 20 }}>
          <li>無料機能の提供内容は、今後変更される場合があります。</li>
          <li>詳細な再採点や継続利用には、有料プランを利用できます。</li>
          <li>最新の利用条件は、各ページの案内をご確認ください。</li>
        </ul>
      </section>

      <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/submit">→ 小論文を投稿する</Link>
        <Link href="/billing">→ 料金プランを見る</Link>
        <Link href="/dashboard">→ ダッシュボードへ</Link>
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