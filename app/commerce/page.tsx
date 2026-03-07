import Link from "next/link";

export default function CommercePage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>特定商取引法に基づく表記</h1>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>販売事業者</h2>
        <p style={{ marginTop: 8 }}>佐藤 慶音</p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>運営責任者</h2>
        <p style={{ marginTop: 8 }}>佐藤 慶音</p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>所在地</h2>
        <p style={{ marginTop: 8 }}>
          請求があった場合、遅滞なく開示します。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>電話番号</h2>
        <p style={{ marginTop: 8 }}>
          請求があった場合、遅滞なく開示します。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>メールアドレス</h2>
        <p style={{ marginTop: 8 }}>sato.learning@gmail.com</p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>販売価格</h2>
        <p style={{ marginTop: 8 }}>
          各商品・プラン購入ページに表示された金額（税込）とします。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>商品代金以外の必要料金</h2>
        <p style={{ marginTop: 8 }}>
          インターネット接続にかかる通信料等は、お客様のご負担となります。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>支払方法</h2>
        <p style={{ marginTop: 8 }}>
          クレジットカード決済その他、購入時に表示される方法によります。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>支払時期</h2>
        <p style={{ marginTop: 8 }}>
          各決済事業者またはカード会社の定める時期によります。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>商品の引渡時期</h2>
        <p style={{ marginTop: 8 }}>
          決済完了後、直ちにデジタルサービスとして利用可能となります。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>返品・キャンセル</h2>
        <p style={{ marginTop: 8 }}>
          デジタルサービスの性質上、法令上必要な場合を除き、購入後の返品・返金には原則応じられません。
        </p>
      </section>

      <hr style={{ margin: "24px 0" }} />

      <footer style={{ fontSize: 14, opacity: 0.85, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/">トップへ戻る</Link>
        <Link href="/privacy">プライバシーポリシー</Link>
        <Link href="/terms">利用規約</Link>
        <Link href="/contact">お問い合わせ</Link>
      </footer>
    </main>
  );
}