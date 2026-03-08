import Link from "next/link";

export default function AboutPage() {
  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: 24, lineHeight: 1.9 }}>
      <p style={{ fontSize: 14, opacity: 0.75, fontWeight: 700 }}>
        小論設計室｜サービス概要
      </p>

      <h1 style={{ fontSize: 34, fontWeight: 900, marginTop: 8 }}>
        小論設計室について
      </h1>

      <p style={{ marginTop: 16 }}>
        小論設計室は、小論文の下書きや答案を投稿すると、
        AIが点数・要約・良い点・改善点を返す小論文添削サービスです。
      </p>

      <p style={{ marginTop: 12 }}>
        「何を書けばいいかわからない」「書いたけれど、どこが弱いのかわからない」
        という悩みに対して、まずは無料で採点結果を確認できる形を目指しています。
      </p>

      <hr style={{ margin: "28px 0" }} />

      <section>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>このサービスでできること</h2>

        <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
          <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
            <div style={{ fontWeight: 900 }}>無料採点</div>
            <p style={{ marginTop: 8 }}>
              小論文を投稿すると、AIが点数・要約・改善点を返します。
            </p>
          </div>

          <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
            <div style={{ fontWeight: 900 }}>Pro再採点</div>
            <p style={{ marginTop: 8 }}>
              より詳しいフィードバックや再確認のために、Proチケットを使った再採点に対応しています。
            </p>
          </div>

          <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
            <div style={{ fontWeight: 900 }}>学習ガイド</div>
            <p style={{ marginTop: 8 }}>
              小論文の書き方や、よくある失敗、構成の考え方を学べる記事も順次追加しています。
            </p>
          </div>
        </div>
      </section>

      <hr style={{ margin: "28px 0" }} />

      <section>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>小論設計室が目指していること</h2>
        <p style={{ marginTop: 12 }}>
          小論文は、書き方の型や考え方を知るだけで大きく変わる科目です。
          小論設計室では、単に点数を返すだけでなく、
          書き手が「次に何を直せばいいのか」が分かる状態を作ることを目指しています。
        </p>

        <p style={{ marginTop: 12 }}>
          まずは小論文を継続して書けること、
          そして自分で改善できることを重視したサービス設計を進めています。
        </p>
      </section>

      <hr style={{ margin: "28px 0" }} />

      <section>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>運営者</h2>
        <p style={{ marginTop: 12 }}>佐藤 慶音</p>
        <p style={{ marginTop: 8 }}>
          お問い合わせは <b>sato.learning@gmail.com</b> までお願いします。
        </p>
      </section>

      <hr style={{ margin: "28px 0" }} />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/">→ トップへ戻る</Link>
        <Link href="/guide">→ 学習ガイドを見る</Link>
        <Link href="/submit">→ 小論文を投稿する</Link>
        <Link href="/billing">→ 料金プランを見る</Link>
      </div>
    </main>
  );
}