import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <div className="container">
        <section style={{ padding: "40px 0 12px" }}>
          <div className="page-eyebrow">小論文添削サービス</div>
          <h1 className="page-title">小論設計室</h1>
          <p className="page-lead">小論文を、AIと一緒に磨く添削サービス。</p>

          <p style={{ marginTop: 12, fontSize: 16 }}>
            小論文の下書きや答案を投稿すると、AIが点数・要約・良い点・改善点を返します。
            まずは無料で試せて、必要に応じてPro再採点や有料プランも利用できます。
          </p>

          <div className="button-row">
            <Link href="/submit" className="button-primary">
              小論文を投稿する
            </Link>
            <Link href="/guide" className="button-secondary">
              学習ガイドを見る
            </Link>
            <Link href="/billing" className="button-secondary">
              料金プランを見る
            </Link>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>このサービスでできること</h2>

          <div className="card-grid" style={{ marginTop: 16 }}>
            <div className="card">
              <div style={{ fontWeight: 900 }}>1. 無料で採点結果を確認</div>
              <p style={{ marginTop: 8 }}>
                小論文を投稿すると、AIが点数・要約・改善点を返します。
                まずは無料で試して、現状の課題を把握できます。
              </p>
            </div>

            <div className="card">
              <div style={{ fontWeight: 900 }}>2. Pro再採点で詳しく確認</div>
              <p style={{ marginTop: 8 }}>
                Proチケットを使うと、より厳密な観点で再採点し、改善の方向性を詳しく確認できます。
              </p>
            </div>

            <div className="card">
              <div style={{ fontWeight: 900 }}>3. 継続学習に使える</div>
              <p style={{ marginTop: 8 }}>
                投稿履歴やチケット機能を使いながら、継続的に小論文の練習を進められます。
              </p>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>学習ガイド</h2>

          <div className="card-grid" style={{ marginTop: 16 }}>
            <div className="card">
              <div style={{ fontWeight: 900 }}>
                小論文の基本構成とは？まず押さえたい4つの型
              </div>
              <p style={{ marginTop: 8 }}>
                結論・理由・具体例・まとめの基本構成を分かりやすく解説しています。
              </p>
              <div style={{ marginTop: 12 }}>
                <Link href="/guide/essay-structure">→ 記事を読む</Link>
              </div>
            </div>

            <div className="card">
              <div style={{ fontWeight: 900 }}>
                小論文でよくある失敗5選｜点数が伸びない原因はここにある
              </div>
              <p style={{ marginTop: 8 }}>
                設問ずれ、結論の曖昧さ、理由の弱さなど、典型的な失敗を整理しています。
              </p>
              <div style={{ marginTop: 12 }}>
                <Link href="/guide/common-mistakes">→ 記事を読む</Link>
              </div>
            </div>

            <div className="card">
              <div style={{ fontWeight: 900 }}>
                小論文の結論の書き方｜最後を締めるだけで答案は整って見える
              </div>
              <p style={{ marginTop: 8 }}>
                まとめの作り方や、曖昧な締めを避けるコツを整理しています。
              </p>
              <div style={{ marginTop: 12 }}>
                <Link href="/guide/how-to-write-conclusion">→ 記事を読む</Link>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <Link href="/guide" className="button-secondary">
              学習ガイド一覧へ
            </Link>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>料金について</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              本サービスには、無料で使える機能と、有料のチケット・プランがあります。
              詳細は料金ページで確認できます。
            </p>
            <div style={{ marginTop: 12 }}>
              <Link href="/billing">→ 料金プランを見る</Link>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>主なページ</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Link href="/submit">/submit</Link>
              <Link href="/dashboard">/dashboard</Link>
              <Link href="/billing">/billing</Link>
              <Link href="/rewarded">/rewarded</Link>
              <Link href="/guide">/guide</Link>
              <Link href="/about">/about</Link>
              <Link href="/privacy">/privacy</Link>
              <Link href="/terms">/terms</Link>
              <Link href="/commerce">/commerce</Link>
              <Link href="/contact">/contact</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}