import Link from "next/link";
import RelatedGuides from "../../components/RelatedGuides";

export default function CommonMistakesGuidePage() {
  return (
    <main>
      <div className="container">
        <section style={{ padding: "40px 0 12px" }}>
          <div className="page-eyebrow">小論設計室｜学習ガイド</div>
          <h1 className="page-title">小論文でよくある失敗5選｜点数が伸びない原因はここにある</h1>
          <p className="page-lead">
            小論文を書いているのに点数が伸びない人は、典型的な失敗を繰り返していることが少なくありません。
          </p>

          <p style={{ marginTop: 12 }}>
            特に受験の小論文では、「それっぽく書く」だけでは評価されにくく、
            設問への答え方や論理の組み立て方が重視されます。
            ここでは、小論文でよくある失敗を5つに分けて整理します。
          </p>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>1. 設問に正面から答えていない</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              最も多い失敗は、設問に対する答えになっていないことです。
              小論文では自分の知っている話を書くのではなく、
              問われた内容にきちんと答えることが第一です。
            </p>
            <p style={{ marginTop: 12 }}>
              たとえば「あなたの考えを述べなさい」と書かれているのに、
              客観的な説明だけで終わってしまうと、設問への回答としては弱くなります。
              まずは「何が問われているか」を正確に確認することが大切です。
            </p>
          </div>
        </section>

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>2. 結論が曖昧</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              自分の立場がはっきりしない文章も評価されにくいです。
              「どちらとも言える」「一概には言えない」といった表現を使いすぎると、
              読み手には結局何が言いたいのか伝わりません。
            </p>
            <p style={{ marginTop: 12 }}>
              もちろん複雑な問題を単純化しすぎる必要はありませんが、
              最終的に自分はどの立場を取るのかを明確に示す必要があります。
              小論文では、曖昧さよりも整理された主張が重要です。
            </p>
          </div>
        </section>

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>3. 理由が弱い</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              結論は書けていても、その理由が浅いと説得力が出ません。
              「便利だから」「大切だから」だけでは、なぜそう言えるのかが不足しています。
            </p>
            <p style={{ marginTop: 12 }}>
              理由を書くときは、「それによって何が起こるのか」「なぜ価値があるのか」まで一段深く考える必要があります。
              たとえば「AIは便利だから必要だ」ではなく、
              「個別最適な学習が可能になり、弱点克服の効率が上がるから必要だ」とした方が強い文章になります。
            </p>
          </div>
        </section>

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>4. 具体例がずれている</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              具体例は、理由を支えるために使うものです。
              しかし、関係の薄いエピソードや無理に入れた経験談は、かえって論の流れを崩します。
            </p>
            <p style={{ marginTop: 12 }}>
              良い具体例は、「その理由が実際に成り立つこと」を示すものです。
              自分の体験を書くなら、単なる思い出ではなく、
              主張とのつながりが明確に分かる形にする必要があります。
            </p>
          </div>
        </section>

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>5. まとめが弱い</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              小論文の最後が弱いと、全体の印象も弱くなります。
              最後まで書き切らずに終わったり、新しい話を急に足したりすると、
              文章全体がまとまって見えません。
            </p>
            <p style={{ marginTop: 12 }}>
              まとめでは、冒頭の結論を改めて確認し、
              「以上の理由から〜と考える」と自然に締めることが重要です。
              しっかり締めるだけで、答案全体の完成度が上がります。
            </p>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>失敗を知ると、改善ポイントが見える</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              小論文は、何となく書き続けるだけでは上達しにくい科目です。
              だからこそ、典型的な失敗を先に知っておくと、
              自分の答案を見直す視点が持てるようになります。
            </p>
            <p style={{ marginTop: 12 }}>
              書いたあとに「設問に答えているか」「結論が明確か」「理由は十分か」
              「具体例はずれていないか」「最後まで締められているか」を確認するだけでも、
              答案の質はかなり変わります。
            </p>
          </div>
        </section>

        <hr className="divider" />

        <RelatedGuides currentHref="/guide/common-mistakes" />

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