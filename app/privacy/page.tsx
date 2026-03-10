import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main>
      <div className="container">
        <section style={{ padding: "40px 0 12px" }}>
          <div className="page-eyebrow">小論設計室｜ポリシー</div>
          <h1 className="page-title">プライバシーポリシー</h1>
          <p className="page-lead">
            小論設計室における個人情報および利用情報の取り扱いについて定めています。
          </p>
        </section>

        <hr className="divider" />

        <section className="section">
          <div className="card-grid">
            <div className="card">
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>1. 取得する情報</h2>
              <p style={{ marginTop: 10 }}>
                ログイン時のメールアドレス、投稿された小論文本文、利用履歴、
                チケット利用状況などを取得する場合があります。
              </p>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>2. 利用目的</h2>
              <ul style={{ marginTop: 10, paddingLeft: 20 }}>
                <li>小論文の採点・添削結果を提供するため</li>
                <li>チケット付与、課金、利用状況管理のため</li>
                <li>サービス改善、不正利用防止のため</li>
                <li>お問い合わせ対応のため</li>
              </ul>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>3. 広告について</h2>
              <p style={{ marginTop: 10 }}>
                第三者配信の広告サービスを利用する場合があります。
                広告配信事業者は、ユーザーの興味に応じた広告表示のために Cookie 等を使用することがあります。
              </p>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>4. アクセス解析について</h2>
              <p style={{ marginTop: 10 }}>
                サービス改善のためにアクセス解析ツールを利用する場合があります。
                匿名のトラフィックデータを収集することがあります。
              </p>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>5. 第三者提供</h2>
              <p style={{ marginTop: 10 }}>
                法令に基づく場合を除き、本人の同意なく個人情報を第三者に提供しません。
              </p>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>6. 安全管理</h2>
              <p style={{ marginTop: 10 }}>
                取得した情報の漏えい、滅失、毀損の防止に努めます。
              </p>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>7. ポリシーの変更</h2>
              <p style={{ marginTop: 10 }}>
                必要に応じて変更する場合があります。変更後の内容は当ページに掲載した時点で効力を生じます。
              </p>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>8. お問い合わせ</h2>
              <p style={{ marginTop: 10 }}>
                本ポリシーに関するお問い合わせは、運営者までお願いします。
              </p>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <div className="button-row">
          <Link href="/" className="button-secondary">トップへ戻る</Link>
          <Link href="/terms" className="button-secondary">利用規約</Link>
          <Link href="/contact" className="button-secondary">お問い合わせ</Link>
        </div>
      </div>
    </main>
  );
}