import Link from "next/link";

export default function AboutPage() {
  return (
    <main>
      <div className="container">
        <section style={{ padding: "40px 0 12px" }}>
          <div className="page-eyebrow">小論設計室｜サービス概要</div>
          <h1 className="page-title">小論設計室について</h1>
          <p className="page-lead">
            小論文を、AIと一緒に磨く添削サービスです。
          </p>

          <p style={{ marginTop: 12 }}>
            小論設計室は、小論文の下書きや答案を投稿すると、
            点数・要約・良い点・改善点を返す小論文添削サービスです。
          </p>

          <p style={{ marginTop: 12 }}>
            「何を書けばいいかわからない」「書いたけれど、どこが弱いのかわからない」
            という悩みに対して、まずは無料で診断し、
            必要に応じて詳しい再確認や学習ガイドにつなげることを目指しています。
          </p>
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
                小論文を投稿すると、点数・要約・改善点を確認できます。
              </p>
            </div>

            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 18 }}>詳細添削への導線</div>
              <p style={{ marginTop: 8 }}>
                必要に応じて、より詳しい再採点や改善確認ができる設計を進めています。
              </p>
            </div>

            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 18 }}>学習ガイド</div>
              <p style={{ marginTop: 8 }}>
                小論文の構成、結論、よくある失敗などを記事で学べます。
              </p>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>目指していること</h2>
          <div className="card" style={{ marginTop: 18 }}>
            <p>
              小論文は、書き方の型や考え方を知るだけで大きく変わる科目です。
              小論設計室では、単に点数を返すだけでなく、
              「次に何を直せばいいか」が分かる状態を作ることを重視しています。
            </p>
            <p style={{ marginTop: 12 }}>
              まずは継続して書けること、
              そして自分で改善できることを支えるサービスを目指しています。
            </p>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>運営者</h2>
          <div className="card" style={{ marginTop: 18 }}>
            <p><b>佐藤 慶音</b></p>
            <p style={{ marginTop: 12 }}>
              お問い合わせは <b>sato.learning@gmail.com</b> までお願いします。
            </p>
          </div>
        </section>

        <hr className="divider" />

        <div className="button-row">
          <Link href="/submit" className="button-primary">
            小論文を投稿する
          </Link>
          <Link href="/guide" className="button-secondary">
            学習ガイドを見る
          </Link>
          <Link href="/" className="button-secondary">
            トップへ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}