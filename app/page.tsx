import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <section style={{ padding: "40px 0 24px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.3 }}>
          AI小論文添削サービス
        </h1>

        <p style={{ marginTop: 14, fontSize: 16, lineHeight: 1.8 }}>
          小論文を投稿すると、AIが点数・要約・良い点・改善点を返します。
          無料で試せて、必要ならPro再採点やチケット購入もできます。
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
          <Link
            href="/submit"
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #ccc",
              fontWeight: 900,
            }}
          >
            小論文を投稿する
          </Link>

          <Link
            href="/login"
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #ccc",
              fontWeight: 900,
            }}
          >
            ログイン
          </Link>

          <Link
            href="/billing"
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #ccc",
              fontWeight: 900,
            }}
          >
            プランを見る
          </Link>
        </div>
      </section>

      <hr style={{ margin: "24px 0" }} />

      <section>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>できること</h2>

        <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
          <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
            <div style={{ fontWeight: 900 }}>無料採点</div>
            <p style={{ marginTop: 8, lineHeight: 1.7 }}>
              まずは無料で投稿して、点数・要約・改善点を確認できます。
            </p>
          </div>

          <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
            <div style={{ fontWeight: 900 }}>Pro再採点</div>
            <p style={{ marginTop: 8, lineHeight: 1.7 }}>
              より厳密な基準で再採点し、根拠や改善方針を詳しく確認できます。
            </p>
          </div>

          <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
            <div style={{ fontWeight: 900 }}>チケット制</div>
            <p style={{ marginTop: 8, lineHeight: 1.7 }}>
              必要な分だけ使えて、継続利用向けのプランも選べます。
            </p>
          </div>
        </div>
      </section>

      <hr style={{ margin: "24px 0" }} />

      <section>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>主なページ</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
          <Link href="/submit">/submit</Link>
          <Link href="/dashboard">/dashboard</Link>
          <Link href="/billing">/billing</Link>
          <Link href="/rewarded">/rewarded</Link>
          <Link href="/privacy">/privacy</Link>
          <Link href="/terms">/terms</Link>
          <Link href="/commerce">/commerce</Link>
          <Link href="/contact">/contact</Link>
        </div>
      </section>

      <hr style={{ margin: "24px 0" }} />

      <footer style={{ fontSize: 14, opacity: 0.8, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/privacy">プライバシーポリシー</Link>
        <Link href="/terms">利用規約</Link>
        <Link href="/commerce">特定商取引法に基づく表記</Link>
        <Link href="/contact">お問い合わせ</Link>
      </footer>
    </main>
  );
}