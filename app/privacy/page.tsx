import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>プライバシーポリシー</h1>

      <p style={{ marginTop: 16 }}>
        本サービス（以下、「当サービス」）では、ユーザーの個人情報および利用情報を以下の方針に基づいて取り扱います。
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>1. 取得する情報</h2>
        <p style={{ marginTop: 8 }}>
          当サービスでは、ログイン時のメールアドレス、投稿された小論文本文、利用履歴、チケット利用状況などを取得する場合があります。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>2. 利用目的</h2>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>小論文の採点・添削結果を提供するため</li>
          <li>チケット付与、課金、利用状況管理のため</li>
          <li>サービス改善、不正利用防止のため</li>
          <li>お問い合わせ対応のため</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>3. 広告について</h2>
        <p style={{ marginTop: 8 }}>
          当サービスでは、第三者配信の広告サービスを利用する場合があります。これらの広告配信事業者は、ユーザーの興味に応じた広告を表示するために Cookie 等を使用することがあります。
        </p>
        <p style={{ marginTop: 8 }}>
          広告配信に関する詳細は、各広告配信事業者のポリシーをご確認ください。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>4. アクセス解析について</h2>
        <p style={{ marginTop: 8 }}>
          当サービスでは、サービス改善のためにアクセス解析ツールを利用する場合があります。これにより匿名のトラフィックデータを収集することがあります。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>5. 第三者提供</h2>
        <p style={{ marginTop: 8 }}>
          法令に基づく場合を除き、本人の同意なく個人情報を第三者に提供しません。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>6. 安全管理</h2>
        <p style={{ marginTop: 8 }}>
          当サービスは、取得した情報の漏えい、滅失、毀損の防止に努めます。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>7. ポリシーの変更</h2>
        <p style={{ marginTop: 8 }}>
          本ポリシーは、必要に応じて変更する場合があります。変更後の内容は当ページに掲載した時点で効力を生じます。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>8. お問い合わせ</h2>
        <p style={{ marginTop: 8 }}>
          本ポリシーに関するお問い合わせは、当サービス運営者までお願いします。
        </p>
      </section>

      <hr style={{ margin: "24px 0" }} />

      <footer style={{ fontSize: 14, opacity: 0.85, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/">トップへ戻る</Link>
        <Link href="/terms">利用規約</Link>
        <Link href="/commerce">特定商取引法に基づく表記</Link>
        <Link href="/contact">お問い合わせ</Link>
      </footer>
    </main>
  );
}