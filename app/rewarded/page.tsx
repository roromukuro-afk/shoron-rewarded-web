import Link from "next/link";

export default function RewardedPage() {
  return (
    <main>
      <div className="container">
        <section style={{ padding: "40px 0 12px" }}>
          <div className="hero-grid">
            <div>
              <div className="page-eyebrow">小論設計室｜無料チケット</div>
              <h1 className="page-title">無料チケット</h1>
              <p className="page-lead">
                無料ユーザーでも使いやすいように、無料チケット導線を順次整えています。
              </p>

              <p style={{ marginTop: 12 }}>
                まずは <b>無料診断</b> で答案の状態を確認し、
                必要に応じて学習ガイドや詳細添削へ進む使い方がおすすめです。
              </p>

              <p style={{ marginTop: 12 }}>
                無料チケットは、今後の広告視聴・キャンペーン・学習導線の整備とあわせて、
                より使いやすい形に広げていく予定です。
              </p>

              <div className="button-row">
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
            </div>

            <div>
              <div className="soft-panel">
                <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700 }}>
                  現在の提供状況
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                  <div className="card">
                    <div style={{ fontWeight: 900 }}>いま使えるもの</div>
                    <ul style={{ margin: "10px 0 0", paddingLeft: 20 }}>
                      <li>無料診断</li>
                      <li>学習ガイドの閲覧</li>
                      <li>有料プランの利用</li>
                    </ul>
                  </div>

                  <div className="card">
                    <div style={{ fontWeight: 900 }}>順次整備中のもの</div>
                    <ul style={{ margin: "10px 0 0", paddingLeft: 20 }}>
                      <li>無料チケット導線の拡充</li>
                      <li>広告視聴導線の調整</li>
                      <li>継続利用向けの特典設計</li>
                    </ul>
                  </div>
                </div>

                <div className="dark-panel">
                  <div className="dark-panel-title">おすすめの始め方</div>
                  <div className="dark-panel-body">
                    無料診断 → 学習ガイド → 必要なら詳細添削
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>無料チケットで目指していること</h2>

          <div className="info-grid-3" style={{ marginTop: 18 }}>
            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 18 }}>はじめやすさ</div>
              <p style={{ marginTop: 8 }}>
                はじめての人でも、まずは無料で使いやすい入口を用意します。
              </p>
            </div>

            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 18 }}>続けやすさ</div>
              <p style={{ marginTop: 8 }}>
                継続利用のきっかけとして、無料導線を少しずつ強化していきます。
              </p>
            </div>

            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 18 }}>改善のきっかけ</div>
              <p style={{ marginTop: 8 }}>
                無料チケットをきっかけに、学習ガイドや詳細添削へ自然につなげます。
              </p>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>現在のおすすめの使い方</h2>

          <div className="info-grid-3" style={{ marginTop: 18 }}>
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
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>よくある質問</h2>

          <div className="info-grid-3" style={{ marginTop: 18 }}>
            <div className="card">
              <div style={{ fontWeight: 900 }}>無料チケットは今すぐ使えますか？</div>
              <p style={{ marginTop: 8 }}>
                導線や提供方法は順次調整中です。現在は無料診断と学習ガイドが中心です。
              </p>
            </div>

            <div className="card">
              <div style={{ fontWeight: 900 }}>無料でも小論文は見てもらえますか？</div>
              <p style={{ marginTop: 8 }}>
                はい。まずは無料診断として、点数や要約、改善ポイントを確認できます。
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