import Link from "next/link";

export default function ContactPage() {
  return (
    <main>
      <div className="container">
        <section style={{ padding: "40px 0 12px" }}>
          <div className="page-eyebrow">小論設計室｜お問い合わせ</div>
          <h1 className="page-title">お問い合わせ</h1>
          <p className="page-lead">
            サービス内容、不具合、課金・チケットに関するお問い合わせを受け付けています。
          </p>
        </section>

        <hr className="divider" />

        <section className="section">
          <div
            className="card-grid"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
          >
            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 18 }}>運営者</div>
              <p style={{ marginTop: 8 }}>佐藤 慶音</p>
            </div>

            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 18 }}>メールアドレス</div>
              <p style={{ marginTop: 8 }}>sato.learning@gmail.com</p>
            </div>

            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 18 }}>対応内容</div>
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>サービス内容に関する質問</li>
                <li>不具合の報告</li>
                <li>課金・チケットに関するお問い合わせ</li>
                <li>その他のお問い合わせ</li>
              </ul>
            </div>
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>返信について</div>
            <p style={{ marginTop: 8 }}>
              内容を確認のうえ、順次対応いたします。返信までお時間をいただく場合があります。
            </p>
          </div>
        </section>

        <hr className="divider" />

        <div className="button-row">
          <Link href="/" className="button-secondary">トップへ戻る</Link>
          <Link href="/about" className="button-secondary">サービス概要</Link>
          <Link href="/submit" className="button-primary">小論文を投稿する</Link>
        </div>
      </div>
    </main>
  );
}