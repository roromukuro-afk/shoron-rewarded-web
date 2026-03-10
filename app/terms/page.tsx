import Link from "next/link";

export default function TermsPage() {
  return (
    <main>
      <div className="container">
        <section style={{ padding: "40px 0 12px" }}>
          <div className="page-eyebrow">小論設計室｜規約</div>
          <h1 className="page-title">利用規約</h1>
          <p className="page-lead">
            小論設計室の利用条件を定めるものです。
          </p>
        </section>

        <hr className="divider" />

        <section className="section">
          <div className="card-grid">
            <div className="card">
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>1. サービス内容</h2>
              <p style={{ marginTop: 10 }}>
                本サービスは、小論文の採点・添削・フィードバック提供を目的とするオンラインサービスです。
              </p>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>2. 利用登録</h2>
              <p style={{ marginTop: 10 }}>
                所定の方法により登録またはログインを行うことで、本サービスを利用できます。
              </p>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>3. 禁止事項</h2>
              <ul style={{ marginTop: 10, paddingLeft: 20 }}>
                <li>法令または公序良俗に反する行為</li>
                <li>不正アクセス、過度な負荷を与える行為</li>
                <li>虚偽情報の登録</li>
                <li>運営を妨害する行為</li>
                <li>課金機能やチケットの不正利用</li>
              </ul>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>4. 料金および支払い</h2>
              <p style={{ marginTop: 10 }}>
                有料プランおよびチケット購入機能が含まれる場合があります。
                料金、支払方法、提供条件は各ページまたは決済画面に表示されます。
              </p>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>5. 返金について</h2>
              <p style={{ marginTop: 10 }}>
                デジタルコンテンツの性質上、法令上必要な場合を除き、購入後の返金には原則応じられません。
              </p>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>6. 免責事項</h2>
              <p style={{ marginTop: 10 }}>
                採点・添削結果は参考情報であり、特定の合格や成果を保証するものではありません。
              </p>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>7. サービス変更・停止</h2>
              <p style={{ marginTop: 10 }}>
                必要に応じて内容の変更、中断、終了を行うことがあります。
              </p>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>8. 準拠法・管轄</h2>
              <p style={{ marginTop: 10 }}>
                本規約は日本法に準拠し、紛争が生じた場合は日本国内の裁判所を第一審の専属的合意管轄とします。
              </p>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <div className="button-row">
          <Link href="/" className="button-secondary">トップへ戻る</Link>
          <Link href="/privacy" className="button-secondary">プライバシーポリシー</Link>
          <Link href="/contact" className="button-secondary">お問い合わせ</Link>
        </div>
      </div>
    </main>
  );
}