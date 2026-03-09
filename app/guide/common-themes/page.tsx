import Link from "next/link";

export default function CommonThemesGuidePage() {
  return (
    <main>
      <div className="container">
        <section style={{ padding: "40px 0 12px" }}>
          <div className="page-eyebrow">小論設計室｜学習ガイド</div>
          <h1 className="page-title">
            小論文でよく出るテーマ例｜まず押さえたい頻出分野
          </h1>
          <p className="page-lead">
            小論文では、毎回まったく新しいテーマが出るように見えても、実際にはよく出る分野があります。
          </p>

          <p style={{ marginTop: 12 }}>
            事前に頻出テーマを知っておくと、考える視点を準備しやすくなり、
            試験本番でも落ち着いて書き始めやすくなります。
          </p>

          <p style={{ marginTop: 12 }}>
            ここでは、受験の小論文でよく見られる代表的なテーマを整理します。
          </p>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>1. 教育</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              教育は小論文で非常によく扱われる分野です。
              たとえば、学力格差、ICT教育、探究学習、学校の役割、大学教育のあり方などがテーマになります。
            </p>
            <p style={{ marginTop: 12 }}>
              受験生にとって身近なテーマなので、自分の経験と結びつけやすい一方で、
              感想文になりやすい点には注意が必要です。
            </p>
          </div>
        </section>

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>2. 科学技術・AI</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              AI、ロボット、SNS、デジタル技術などの科学技術系テーマも頻出です。
              利便性だけでなく、リスクや課題まで考えられるかが問われやすいです。
            </p>
            <p style={{ marginTop: 12 }}>
              たとえば「AIは学習に必要か」「SNSは人間関係にどのような影響を与えるか」といった形で出題されます。
            </p>
          </div>
        </section>

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>3. 環境問題</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              環境問題も定番です。気候変動、再生可能エネルギー、プラスチックごみ、持続可能性など、
              社会全体に関わる論点が問われます。
            </p>
            <p style={{ marginTop: 12 }}>
              この分野では、「大切だと思う」で終わらず、
              具体的に何を優先すべきか、どのような課題があるかまで考える必要があります。
            </p>
          </div>
        </section>

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>4. 福祉・高齢化</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              少子高齢化、介護、医療、地域社会の支え合いなどの福祉系テーマもよく出ます。
              社会の仕組みと個人の生活がどうつながるかを考える力が求められます。
            </p>
            <p style={{ marginTop: 12 }}>
              単に「支えるべきだ」という話だけでなく、
              現実的にどう支えるのか、誰が担うのかという視点も重要です。
            </p>
          </div>
        </section>

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>5. 地域・コミュニティ</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              地方創生、過疎化、地域活性化、まちづくりといったテーマも扱われます。
              特に社会科学系や地域政策系の学部では出題されやすいです。
            </p>
            <p style={{ marginTop: 12 }}>
              この分野では、「地域をよくするべきだ」という一般論だけでなく、
              何が課題で、どのような工夫があり得るかを具体的に示すことが大切です。
            </p>
          </div>
        </section>

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>6. 多様性・共生</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              多文化共生、ジェンダー、障害理解、外国人受け入れなど、
              多様性に関わるテーマも近年目立ちます。
            </p>
            <p style={{ marginTop: 12 }}>
              この分野では、表面的な「みんな仲良く」ではなく、
              意見の違いや制度上の課題まで視野に入れて考えることが求められます。
            </p>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>テーマを知ることは準備になる</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              小論文では、テーマを丸暗記する必要はありません。
              ただし、どんな分野がよく出るのかを知っておくと、
              自分なりの視点や考え方を準備しやすくなります。
            </p>
            <p style={{ marginTop: 12 }}>
              普段からニュースや学校で学ぶ内容を、
              「これは小論文でどう問われるだろう」と考える習慣を持つと、本番でも対応しやすくなります。
            </p>
          </div>
        </section>

        <hr className="divider" />

        <div className="button-row">
          <Link href="/" className="button-secondary">
            トップへ戻る
          </Link>
          <Link href="/guide" className="button-secondary">
            学習ガイド一覧へ
          </Link>
          <Link href="/submit" className="button-primary">
            小論文を投稿する
          </Link>
        </div>
      </div>
    </main>
  );
}