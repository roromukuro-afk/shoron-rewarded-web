import Link from "next/link";

export default function GuideIndexPage() {
  return (
    <main>
      <div className="container">
        <section style={{ padding: "40px 0 12px" }}>
          <div className="page-eyebrow">小論設計室｜学習ガイド</div>
          <h1 className="page-title">小論文学習ガイド一覧</h1>
          <p className="page-lead">
            小論文の書き方、構成、よくある失敗、結論の作り方などを順番に学べるページです。
          </p>
          <p style={{ marginTop: 12 }}>
            はじめての人は、基本構成の記事から読むのがおすすめです。
            記事を読みながら、実際に小論文を書いて投稿し、改善点を確認していきましょう。
          </p>

          <div className="button-row">
            <Link href="/submit" className="button-primary">
              小論文を投稿する
            </Link>
            <Link href="/billing" className="button-secondary">
              料金プランを見る
            </Link>
            <Link href="/" className="button-secondary">
              トップへ戻る
            </Link>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>記事一覧</h2>

          <div className="card-grid" style={{ marginTop: 16 }}>
            <article className="card">
              <h3 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>
                小論文の基本構成とは？まず押さえたい4つの型
              </h3>
              <p style={{ marginTop: 10 }}>
                結論・理由・具体例・まとめの基本構成を整理した入門記事です。
                小論文が苦手な人が最初に読むのに向いています。
              </p>
              <div style={{ marginTop: 12 }}>
                <Link href="/guide/essay-structure">→ 記事を読む</Link>
              </div>
            </article>

            <article className="card">
              <h3 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>
                小論文でよくある失敗5選｜点数が伸びない原因はここにある
              </h3>
              <p style={{ marginTop: 10 }}>
                設問ずれ、結論の弱さ、理由不足など、
                失敗しやすいポイントをまとめています。
              </p>
              <div style={{ marginTop: 12 }}>
                <Link href="/guide/common-mistakes">→ 記事を読む</Link>
              </div>
            </article>

            <article className="card">
              <h3 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>
                小論文の結論の書き方｜最後を締めるだけで答案は整って見える
              </h3>
              <p style={{ marginTop: 10 }}>
                結論の言い換え方、締め方、よくある弱い終わり方を解説しています。
              </p>
              <div style={{ marginTop: 12 }}>
                <Link href="/guide/how-to-write-conclusion">→ 記事を読む</Link>
              </div>
            </article>

            <article className="card">
              <h3 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>
                200〜400字の小論文をうまくまとめるコツ
              </h3>
              <p style={{ marginTop: 10 }}>
                短い字数の小論文で、主張を1つに絞って分かりやすくまとめる方法を解説しています。
              </p>
              <div style={{ marginTop: 12 }}>
                <Link href="/guide/how-to-write-200-400">→ 記事を読む</Link>
              </div>
            </article>

            <article className="card">
              <h3 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>
                小論文でよく出るテーマ例｜まず押さえたい頻出分野
              </h3>
              <p style={{ marginTop: 10 }}>
                教育、AI、環境、福祉、地域、多様性など、小論文でよく問われるテーマを整理しています。
              </p>
              <div style={{ marginTop: 12 }}>
                <Link href="/guide/common-themes">→ 記事を読む</Link>
              </div>
            </article>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>おすすめの読み方</h2>

          <div className="card" style={{ marginTop: 16 }}>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              <li>まず「基本構成」の記事で型を理解する</li>
              <li>次に「よくある失敗」で自分の弱点を確認する</li>
              <li>「結論の書き方」で答案の締め方を整える</li>
              <li>「200〜400字のまとめ方」で短文答案の精度を上げる</li>
              <li>「よく出るテーマ例」で頻出分野を整理する</li>
              <li>そのあと実際に小論文を投稿して、採点結果を確認する</li>
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}