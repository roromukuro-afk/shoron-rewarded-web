import Link from "next/link";

export default function RewardedPage() {
  return (
    <main>
      <div className="container">
        <section style={{ padding: "40px 0 12px" }}>
          <div
            style={{
              display: "grid",
              gap: 24,
              gridTemplateColumns: "1.2fr 0.8fr",
              alignItems: "center",
            }}
          >
            <div>
              <div className="page-eyebrow">小論設計室｜無料チケット</div>
              <h1 className="page-title">無料チケット</h1>
              <p className="page-lead">
                無料ユーザーでも使いやすいように、
                小論設計室では無料チケット導線を順次整えています。
              </p>

              <p style={{ marginTop: 12 }}>
                まずは <b>無料診断</b> で今の答案を確認し、
                必要に応じて学習ガイドや詳細添削につなげる使い方をおすすめしています。
              </p>

              <p style={{ marginTop: 12 }}>
                無料チケットは、今後の広告視聴・キャンペーン・学習導線の整備とあわせて、
                より使いやすい形に広げていく予定です。
              </p>

              <div className="button-row" style={{ marginTop: 24 }}>
                <Link href="/submit" className="button-primary">
                  無料診断を試す
                </Link>

                <Link href="/dashboard" className="button-secondary">
                  ダッシュボードを見る
                </Link>

                <Link href="/billing" className="button-secondary">
                  料金プランを見る
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
                  詳細添削は有料導線あり
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
                  無料チケット導線を整備中
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
                  現在の提供状況
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      border: "1px solid var(--line)",
                      background: "#fff",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>いま使えるもの</div>
                    <ul style={{ margin: "10px 0 0", paddingLeft: 20 }}>
                      <li>無料診断</li>
                      <li>学習ガイドの閲覧</li>
                      <li>有料プランの利用</li>
                    </ul>
                  </div>

                  <div
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      border: "1px solid var(--line)",
                      background: "#fff",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>順次整備中のもの</div>
                    <ul style={{ margin: "10px 0 0", paddingLeft: 20 }}>
                      <li>無料チケット導線の拡充</li>
                      <li>広告視聴導線の調整</li>
                      <li>継続利用向けの特典設計</li>
                    </ul>
                  </div>
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
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>無料チケットで目指していること</h2>

          <div
            className="card-grid"
            style={{
              marginTop: 18,
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            }}
          >
            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 18 }}>はじめやすさ</div>
              <p style={{ marginTop: 8 }}>
                はじめての人でも、まずは無料で小論文診断を試しやすい導線を用意します。
              </p>
            </div>

            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 18 }}>継続しやすさ</div>
              <p style={{ marginTop: 8 }}>
                学習を続けながら、小論文への苦手意識を少しずつ減らしていける形を目指します。
              </p>
            </div>

            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 18 }}>改善のきっかけ</div>
              <p style={{ marginTop: 8 }}>
                無料チケットをきっかけに、学習ガイドや詳細添削へ自然につながる流れを作ります。
              </p>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>現在のおすすめの使い方</h2>

          <div
            className="card-grid"
            style={{
              marginTop: 18,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {[
              ["1", "無料診断を試す", "まずは答案を投稿して、今の課題を確認する"],
              ["2", "学習ガイドを読む", "構成・結論・失敗例を記事で確認する"],
              ["3", "必要なら詳細添削へ", "もっと深く直したいときに有料導線を使う"],
            ].map(([num, title, desc]) => (
              <div key={num} className="card">
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 999,
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    marginBottom: 12,
                  }}
                >
                  {num}
                </div>

                <div style={{ fontWeight: 900, fontSize: 18 }}>{title}</div>
                <p style={{ marginTop: 8 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>無料導線の今後について</h2>

          <div className="card" style={{ marginTop: 18 }}>
            <p>
              無料チケットや広告視聴導線は、使いやすさと学習継続のしやすさを重視しながら調整しています。
            </p>
            <p style={{ marginTop: 12 }}>
              現時点では、<b>無料診断</b> と <b>学習ガイド</b> を中心に使ってもらい、
              必要に応じて詳細添削や料金プランへ進める形を基本にしています。
            </p>
            <p style={{ marginTop: 12 }}>
              今後は、無料ユーザーでも継続的に使いやすい形を目指して、
              無料チケット導線の拡充を進めていきます。
            </p>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>よくある質問</h2>

          <div className="card-grid" style={{ marginTop: 18 }}>
            <div className="card">
              <div style={{ fontWeight: 900 }}>無料チケットは今すぐ使えますか？</div>
              <p style={{ marginTop: 8 }}>
                導線や提供方法は順次調整中です。現在は、無料診断と学習ガイドを中心に利用できます。
              </p>
            </div>

            <div className="card">
              <div style={{ fontWeight: 900 }}>無料でも小論文は見てもらえますか？</div>
              <p style={{ marginTop: 8 }}>
                はい。まずは無料診断として、点数や要約、改善ポイントの確認ができます。
              </p>
            </div>

            <div className="card">
              <div style={{ fontWeight: 900 }}>もっと詳しく見たい場合は？</div>
              <p style={{ marginTop: 8 }}>
                詳細な改善や再確認が必要な場合は、料金プランや詳細添削の利用をおすすめしています。
              </p>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <div className="button-row">
          <Link href="/submit" className="button-primary">
            無料診断を試す
          </Link>

          <Link href="/guide" className="button-secondary">
            学習ガイドを見る
          </Link>

          <Link href="/dashboard" className="button-secondary">
            ダッシュボードへ
          </Link>
        </div>
      </div>
    </main>
  );
}