import Link from "next/link";

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "小論設計室",
    url: "https://shoron-rewarded-web.vercel.app",
    description: "小論文を、AIと一緒に磨く添削サービス",
    inLanguage: "ja",
    publisher: {
      "@type": "Person",
      name: "佐藤 慶音",
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container">
        <section style={{ padding: "44px 0 20px" }}>
          <div
            style={{
              display: "grid",
              gap: 24,
              gridTemplateColumns: "1.2fr 0.8fr",
              alignItems: "center",
            }}
          >
            <div>
              <div className="page-eyebrow">小論文添削サービス</div>

              <h1 className="page-title" style={{ maxWidth: 700 }}>
                小論設計室
              </h1>

              <p className="page-lead" style={{ maxWidth: 680 }}>
                まずは無料診断。必要なら詳細添削へ。
              </p>

              <p style={{ marginTop: 14, fontSize: 16, maxWidth: 700 }}>
                小論文の下書きや答案を投稿すると、まずは
                <b> 無料診断 </b>
                として点数・要約・良い点・改善点を確認できます。
                そのうえで、もっと詳しく見たいときは
                <b> 詳細添削 </b>
                に進める設計です。
              </p>

              <div className="button-row" style={{ marginTop: 24 }}>
                <Link href="/submit" className="button-primary">
                  無料診断を試す
                </Link>

                <Link href="/guide" className="button-secondary">
                  学習ガイドを見る
                </Link>

                <Link href="/billing" className="button-secondary">
                  詳細添削の料金を見る
                </Link>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 18,
                }}
              >
                <span
                  style={{
                    background: "#fff",
                    border: "1px solid var(--line)",
                    borderRadius: 999,
                    padding: "8px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  無料診断あり
                </span>
                <span
                  style={{
                    background: "#fff",
                    border: "1px solid var(--line)",
                    borderRadius: 999,
                    padding: "8px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  学習ガイドあり
                </span>
                <span
                  style={{
                    background: "#fff",
                    border: "1px solid var(--line)",
                    borderRadius: 999,
                    padding: "8px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  詳細添削に拡張可能
                </span>
              </div>
            </div>

            <div>
              <div
                className="card"
                style={{
                  padding: 22,
                  background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                }}
              >
                <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700 }}>
                  使い方
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                  {[
                    ["1", "無料診断を試す", "まずは今の答案の状態を確認"],
                    ["2", "改善点を把握する", "良い点・改善点・次にやることを整理"],
                    ["3", "必要なら詳細添削へ", "さらに深く見たいときに進む"],
                  ].map(([num, title, desc]) => (
                    <div
                      key={num}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "40px 1fr",
                        gap: 12,
                        alignItems: "start",
                        padding: 12,
                        border: "1px solid var(--line)",
                        borderRadius: 14,
                        background: "#fff",
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 999,
                          background: "var(--accent-soft)",
                          color: "var(--accent)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                        }}
                      >
                        {num}
                      </div>

                      <div>
                        <div style={{ fontWeight: 900 }}>{title}</div>
                        <div style={{ marginTop: 4, fontSize: 14, color: "var(--muted)" }}>
                          {desc}
                        </div>
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
                    無料診断 → 学習ガイド確認 → 必要なら詳細添削
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>このサービスでできること</h2>

          <div
            className="card-grid"
            style={{
              marginTop: 18,
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            }}
          >
            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 18 }}>無料診断</div>
              <p style={{ marginTop: 8 }}>
                小論文を投稿すると、点数・要約・良い点・改善点を確認できます。
                まずは現状の課題を把握する入口です。
              </p>
            </div>

            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 18 }}>詳細添削</div>
              <p style={{ marginTop: 8 }}>
                より詳しく確認したいときは、項目別内訳や減点根拠まで見られる詳細添削に進めます。
              </p>
            </div>

            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 18 }}>継続学習</div>
              <p style={{ marginTop: 8 }}>
                投稿履歴や学習ガイドを使いながら、書いて見直す流れを継続しやすくしています。
              </p>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "end",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>学習ガイド</h2>
              <p className="muted" style={{ marginTop: 8 }}>
                書き方・構成・失敗例を記事で学べます。
              </p>
            </div>

            <Link href="/guide" className="button-secondary">
              一覧を見る
            </Link>
          </div>

          <div
            className="card-grid"
            style={{
              marginTop: 18,
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            }}
          >
            <div className="card">
              <div style={{ fontWeight: 900 }}>
                小論文の基本構成とは？まず押さえたい4つの型
              </div>
              <p style={{ marginTop: 8 }}>
                結論・理由・具体例・まとめの基本構成を分かりやすく解説。
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
                設問ずれ、結論の曖昧さ、理由の弱さなどを整理。
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
                まとめの作り方や曖昧な締めを避けるコツを解説。
              </p>
              <div style={{ marginTop: 12 }}>
                <Link href="/guide/how-to-write-conclusion">→ 記事を読む</Link>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>料金について</h2>

          <div
            className="card-grid"
            style={{
              marginTop: 18,
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 18 }}>まずは無料で利用</div>
              <p style={{ marginTop: 8 }}>
                小論文を投稿して、無料診断として現在の課題を確認できます。
              </p>
            </div>

            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 18 }}>必要なら詳細添削へ</div>
              <p style={{ marginTop: 8 }}>
                もっと詳しい根拠や改善方針を見たいときに、有料プランで深く確認できます。
              </p>
              <div style={{ marginTop: 12 }}>
                <Link href="/billing">→ 料金プランを見る</Link>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>主なページ</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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