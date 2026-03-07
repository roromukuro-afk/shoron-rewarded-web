import Link from "next/link";

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>利用規約</h1>

      <p style={{ marginTop: 16 }}>
        この利用規約（以下、「本規約」）は、本サービスの利用条件を定めるものです。
        ユーザーは、本規約に同意のうえ本サービスを利用するものとします。
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>1. サービス内容</h2>
        <p style={{ marginTop: 8 }}>
          本サービスは、小論文の採点・添削・フィードバック提供を目的とするオンラインサービスです。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>2. 利用登録</h2>
        <p style={{ marginTop: 8 }}>
          ユーザーは、当サービス所定の方法により登録またはログインを行うことで、本サービスを利用できます。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>3. 禁止事項</h2>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>法令または公序良俗に反する行為</li>
          <li>不正アクセス、システムへの過度な負荷を与える行為</li>
          <li>虚偽情報の登録</li>
          <li>本サービスの運営を妨害する行為</li>
          <li>チケットや課金機能の不正利用</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>4. 料金および支払い</h2>
        <p style={{ marginTop: 8 }}>
          本サービスには有料プランおよびチケット購入機能が含まれる場合があります。
          料金、支払方法、提供条件は各ページまたは決済画面に表示されます。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>5. 返金について</h2>
        <p style={{ marginTop: 8 }}>
          デジタルコンテンツの性質上、法令上必要な場合を除き、購入後の返金には原則応じられません。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>6. 免責事項</h2>
        <p style={{ marginTop: 8 }}>
          本サービスの採点・添削結果は参考情報であり、特定の合格や成果を保証するものではありません。
          当サービスは、利用により生じた損害について、故意または重過失がある場合を除き責任を負いません。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>7. サービス変更・停止</h2>
        <p style={{ marginTop: 8 }}>
          当サービスは、必要に応じて内容の変更、中断、終了を行うことがあります。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>8. 規約の変更</h2>
        <p style={{ marginTop: 8 }}>
          本規約は、必要に応じて変更される場合があります。変更後の規約は、本ページに掲載した時点で効力を生じます。
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>9. 準拠法・管轄</h2>
        <p style={{ marginTop: 8 }}>
          本規約は日本法に準拠し、本サービスに関して紛争が生じた場合は、日本国内の裁判所を第一審の専属的合意管轄とします。
        </p>
      </section>

      <hr style={{ margin: "24px 0" }} />

      <footer style={{ fontSize: 14, opacity: 0.85, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/">トップへ戻る</Link>
        <Link href="/privacy">プライバシーポリシー</Link>
        <Link href="/commerce">特定商取引法に基づく表記</Link>
        <Link href="/contact">お問い合わせ</Link>
      </footer>
    </main>
  );
}