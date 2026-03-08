import Link from "next/link";

export default function HowToWriteConclusionGuidePage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, lineHeight: 1.9 }}>
      <p style={{ fontSize: 14, opacity: 0.75, fontWeight: 700 }}>
        小論設計室｜学習ガイド
      </p>

      <h1 style={{ fontSize: 34, fontWeight: 900, marginTop: 8 }}>
        小論文の結論の書き方｜最後を締めるだけで答案は整って見える
      </h1>

      <p style={{ marginTop: 16 }}>
        小論文では、最初の結論だけでなく、最後の結論のまとめ方も大切です。
        冒頭では立場を示し、最後では全体を締める。この流れがあるだけで、
        答案はかなり読みやすくなります。
      </p>

      <p style={{ marginTop: 12 }}>
        逆に、最後が弱いと「途中で終わった文章」に見えたり、
        言いたいことがぼやけたりします。
        ここでは、小論文の結論をどう書けばよいのかを整理します。
      </p>

      <hr style={{ margin: "28px 0" }} />

      <section>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>1. 結論は新しい話を書く場所ではない</h2>
        <p style={{ marginTop: 12 }}>
          小論文の最後では、新しい論点を広げる必要はありません。
          まとめの役割は、それまでに書いた内容を踏まえて、
          自分の立場をもう一度はっきり示すことです。
        </p>

        <p style={{ marginTop: 12 }}>
          ここで急に別の視点や追加情報を出すと、文章全体のまとまりが崩れます。
          最後は「だから私はこう考える」と締める意識を持つことが大切です。
        </p>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>2. 冒頭の結論を言い換えて締める</h2>
        <p style={{ marginTop: 12 }}>
          結論は、冒頭で述べた主張をそのまま繰り返しても構いませんが、
          少し言い換えると自然になります。
        </p>

        <p style={{ marginTop: 12 }}>
          たとえば冒頭で「私はAIの活用は今後の学習に必要だと考える」と書いたなら、
          最後では「以上の理由から、AIの活用は今後の学習において重要な役割を果たすと考える」とまとめられます。
          同じ立場を保ちながら、答案全体をきれいに締めることができます。
        </p>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>3. 理由を一言だけ添えると締まりやすい</h2>
        <p style={{ marginTop: 12 }}>
          まとめでは長い説明は不要ですが、理由を短く添えると説得力が増します。
          たとえば「学習効率を高められるから」「多様な視点に触れられるから」といった一言があるだけで、
          ただの言い直しではなく、筋の通った結論に見えます。
        </p>

        <p style={{ marginTop: 12 }}>
          ただし、ここで理由を増やしすぎると結論ではなく本文の続きになります。
          最後はあくまで短く、全体を閉じる意識が重要です。
        </p>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>4. 曖昧な締め方を避ける</h2>
        <p style={{ marginTop: 12 }}>
          「今後も考えていく必要がある」「難しい問題である」といった締め方は、
          一見まともに見えても、自分の立場が見えにくくなることがあります。
        </p>

        <p style={{ marginTop: 12 }}>
          もちろんテーマによっては慎重な表現が必要ですが、
          最後まで「自分はどう考えるのか」が読み取れる形にすることが大切です。
          曖昧な余韻よりも、整理された主張の方が小論文では評価されやすいです。
        </p>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>5. 使いやすい結論の型を持っておく</h2>
        <p style={{ marginTop: 12 }}>
          結論が苦手な人は、使いやすい型を1つ持っておくと書きやすくなります。
          たとえば次のような形です。
        </p>

        <ul style={{ marginTop: 12, paddingLeft: 20 }}>
          <li>以上の理由から、私は〜と考える。</li>
          <li>したがって、〜は重要であるといえる。</li>
          <li>このように、〜の点から私は〜が必要だと考える。</li>
        </ul>

        <p style={{ marginTop: 12 }}>
          こうした型があると、最後で迷いにくくなり、
          全体を安定して締められるようになります。
        </p>
      </section>

      <hr style={{ margin: "28px 0" }} />

      <section>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>結論は短くてもいい、でも必要</h2>
        <p style={{ marginTop: 12 }}>
          小論文の結論は、長く書く必要はありません。
          むしろ短くても、自分の立場が明確で、全体をきちんと締めていれば十分です。
        </p>

        <p style={{ marginTop: 12 }}>
          最後の一文があるだけで、答案はぐっと整理されて見えます。
          小論文を書くときは、書き出しだけでなく、
          「どう終わるか」まで意識して練習することが大切です。
        </p>
      </section>

      <hr style={{ margin: "28px 0" }} />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/">→ トップへ戻る</Link>
        <Link href="/guide/essay-structure">→ 基本構成の記事を読む</Link>
        <Link href="/guide/common-mistakes">→ よくある失敗の記事を読む</Link>
        <Link href="/submit">→ 小論文を投稿する</Link>
      </div>
    </main>
  );
}