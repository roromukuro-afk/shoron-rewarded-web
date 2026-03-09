import Link from "next/link";

export default function HowToWrite200400GuidePage() {
  return (
    <main>
      <div className="container">
        <section style={{ padding: "40px 0 12px" }}>
          <div className="page-eyebrow">小論設計室｜学習ガイド</div>
          <h1 className="page-title">
            200〜400字の小論文をうまくまとめるコツ
          </h1>
          <p className="page-lead">
            短い字数の小論文は、長く書くよりもむしろ難しいことがあります。
          </p>

          <p style={{ marginTop: 12 }}>
            200〜400字では、思いついたことを順番に書いているとすぐに字数が足りなくなったり、
            逆に説明不足になったりします。大切なのは、最初から「何を書くか」を絞って、
            必要な要素だけで構成することです。
          </p>

          <p style={{ marginTop: 12 }}>
            ここでは、短い字数で小論文をまとめるときに意識したいポイントを整理します。
          </p>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>1. 主張は1つに絞る</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              200〜400字では、複数の論点を盛り込むと文章が散らばりやすくなります。
              まずは「自分はどう考えるか」を1つに絞り、その主張を支える理由を短く書く方がまとまりやすくなります。
            </p>
            <p style={{ marginTop: 12 }}>
              たとえば「AIの活用は必要か」というテーマなら、「必要である」に絞る、
              もしくは「注意しながら必要である」に絞る、といった形です。
            </p>
          </div>
        </section>

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>2. 型を使う</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              短い字数では、自由に書くよりも型を使った方が安定します。
              基本は「結論 → 理由 → 具体例 → まとめ」です。
            </p>
            <p style={{ marginTop: 12 }}>
              ただし、400字未満では具体例を長く入れすぎないことも大切です。
              型は守りつつ、それぞれを短く書く意識が必要になります。
            </p>
          </div>
        </section>

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>3. 理由を具体化する</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              字数が少ないからといって、理由を抽象的にしすぎると弱い文章になります。
              「便利だから」「大切だから」ではなく、「弱点補強がしやすいから」「学習効率が上がるから」など、
              一歩具体的に書くことが大切です。
            </p>
          </div>
        </section>

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>4. 具体例は一言で十分なこともある</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              短い小論文では、具体例を長く書きすぎると本筋が薄くなります。
              具体例は「自分の経験」や「社会の事例」を一言で示す程度でも十分な場合があります。
            </p>
            <p style={{ marginTop: 12 }}>
              重要なのは、例そのものの面白さではなく、主張とのつながりが見えることです。
            </p>
          </div>
        </section>

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>5. 最後は必ず締める</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              200〜400字では、最後の一文がないだけでかなり未完成に見えます。
              「以上の理由から、私は〜と考える」と締めるだけでも、文章全体が整って見えます。
            </p>
          </div>
        </section>

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>短い小論文ほど設計が大切</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              短い字数では、文章力よりも設計力が結果を左右します。
              何を書くかを絞り、型に沿って、必要なことだけを明確に書く。
              これを意識するだけで、200〜400字の小論文はかなり書きやすくなります。
            </p>
            <p style={{ marginTop: 12 }}>
              書いたあとは、「主張は1つに絞れているか」「理由が具体的か」「最後を締められているか」を確認すると改善しやすくなります。
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