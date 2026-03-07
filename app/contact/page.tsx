export default function ContactPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>お問い合わせ</h1>

      <p style={{ marginTop: 16 }}>
        本サービスに関するお問い合わせは、以下の方法でご連絡ください。
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>運営者</h2>
        <p style={{ marginTop: 8 }}>佐藤 慶音</p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>お問い合わせ先</h2>
        <p style={{ marginTop: 8 }}>
          メールアドレス：sato.learning@gmail.com
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>対応内容</h2>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>サービス内容に関する質問</li>
          <li>不具合の報告</li>
          <li>課金・チケットに関するお問い合わせ</li>
          <li>その他のお問い合わせ</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>返信について</h2>
        <p style={{ marginTop: 8 }}>
          内容を確認のうえ、順次対応いたします。返信までお時間をいただく場合があります。
        </p>
      </section>
    </main>
  );
}