import Link from "next/link";

export default function CommercePage() {
  return (
    <main>
      <div className="container">
        <section style={{ padding: "40px 0 12px" }}>
          <div className="page-eyebrow">小論設計室｜表記</div>
          <h1 className="page-title">特定商取引法に基づく表記</h1>
          <p className="page-lead">
            デジタルサービスの販売に関する法定表示です。
          </p>
        </section>

        <hr className="divider" />

        <section className="section">
          <div className="card-grid">
            <div className="card"><b>販売事業者</b><p style={{ marginTop: 8 }}>佐藤 慶音</p></div>
            <div className="card"><b>運営責任者</b><p style={{ marginTop: 8 }}>佐藤 慶音</p></div>
            <div className="card"><b>所在地</b><p style={{ marginTop: 8 }}>請求があった場合、遅滞なく開示します。</p></div>
            <div className="card"><b>電話番号</b><p style={{ marginTop: 8 }}>請求があった場合、遅滞なく開示します。</p></div>
            <div className="card"><b>メールアドレス</b><p style={{ marginTop: 8 }}>sato.learning@gmail.com</p></div>
            <div className="card"><b>販売価格</b><p style={{ marginTop: 8 }}>各商品・プラン購入ページに表示された金額（税込）です。</p></div>
            <div className="card"><b>商品代金以外の必要料金</b><p style={{ marginTop: 8 }}>通信料等はお客様負担となります。</p></div>
            <div className="card"><b>支払方法</b><p style={{ marginTop: 8 }}>クレジットカード決済その他、購入時に表示される方法です。</p></div>
            <div className="card"><b>支払時期</b><p style={{ marginTop: 8 }}>各決済事業者またはカード会社の定める時期によります。</p></div>
            <div className="card"><b>商品の引渡時期</b><p style={{ marginTop: 8 }}>決済完了後、直ちに利用可能となります。</p></div>
            <div className="card"><b>返品・キャンセル</b><p style={{ marginTop: 8 }}>法令上必要な場合を除き、購入後の返品・返金には原則応じられません。</p></div>
          </div>
        </section>

        <hr className="divider" />

        <div className="button-row">
          <Link href="/" className="button-secondary">トップへ戻る</Link>
          <Link href="/billing" className="button-primary">料金プランを見る</Link>
          <Link href="/contact" className="button-secondary">お問い合わせ</Link>
        </div>
      </div>
    </main>
  );
}