import Link from "next/link";

export default function GuideIndexPage() {
  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: 24, lineHeight: 1.8 }}>
      <p style={{ fontSize: 14, opacity: 0.75, fontWeight: 700 }}>
        小論設計室｜学習ガイド
      </p>

      <h1 style={{ fontSize: 34, fontWeight: 900, marginTop: 8 }}>
        小論文学習ガイド一覧
      </h1>

      <p style={{ marginTop: 16 }}>
        小論文の書き方、構成、よくある失敗、結論の作り方などを順番に学べるページです。
        はじめての人は、基本構成の記事から読むのがおすすめです。
      </p>

      <hr style={{ margin: "28px 0" }} />

      <div style={{ display: "grid", gap: 16 }}>
        <article style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900 }}>
            小論文の基本構成とは？まず押さえたい4つの型
          </h2>
          <p style={{ marginTop: 8 }}>
            結論・理由・具体例・まとめの基本構成を整理した入門記事です。
          </p>
          <div style={{ marginTop: 12 }}>
            <Link href="/guide/essay-structure">→ 記事を読む</Link>
          </div>
        </article>

        <article style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900 }}>
            小論文でよくある失敗5選｜点数が伸びない原因はここにある
          </h2>
          <p style={{ marginTop: 8 }}>
            設問ずれ、結論の弱さ、理由不足など、失敗しやすいポイントをまとめています。
          </p>
          <div style={{ marginTop: 12 }}>
            <Link href="/guide/common-mistakes">→ 記事を読む</Link>
          </div>
        </article>

        <article style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900 }}>
            小論文の結論の書き方｜最後を締めるだけで答案は整って見える
          </h2>
          <p style={{ marginTop: 8 }}>
            結論の言い換え方、締め方、よくある弱い終わり方を解説しています。
          </p>
          <div style={{ marginTop: 12 }}>
            <Link href="/guide/how-to-write-conclusion">→ 記事を読む</Link>
          </div>
        </article>
      </div>

      <hr style={{ margin: "28px 0" }} />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/">→ トップへ戻る</Link>
        <Link href="/submit">→ 小論文を投稿する</Link>
        <Link href="/billing">→ 料金プランを見る</Link>
      </div>
    </main>
  );
}