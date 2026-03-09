import Link from "next/link";
import RelatedGuides from "../../components/RelatedGuides";

export default function EssayStructureGuidePage() {
  return (
    <main>
      <div className="container">
        <section style={{ padding: "40px 0 12px" }}>
          <div className="page-eyebrow">小論設計室｜学習ガイド</div>
          <h1 className="page-title">小論文の基本構成とは？まず押さえたい4つの型</h1>
          <p className="page-lead">
            小論文が書けないと感じる人の多くは、最初から文章力で勝負しようとしています。
          </p>

          <p style={{ marginTop: 12 }}>
            実際には「何をどの順番で書くか」という構成が決まっているだけで、
            小論文はかなり書きやすくなります。受験で求められる小論文では、
            自由に書くことよりも、読み手に伝わる順序で論を組み立てることが大切です。
          </p>

          <p style={{ marginTop: 12 }}>
            そのため、まずは基本構成を理解し、どのテーマでも使える型として身につけることが重要です。
          </p>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>1. 結論</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              最初に、自分の立場や主張を明確に示します。
              小論文では「結局何が言いたいのか」が最初に分かる方が読みやすく、
              採点者にも論点が伝わりやすくなります。
            </p>
            <p style={{ marginTop: 12 }}>
              たとえば、「AIの活用は今後の学習に必要である」という設問なら、
              冒頭で「私は、AIの活用は今後の学習に必要だと考える」と書く形です。
              この一文があるだけで、全文の方向性がはっきりします。
            </p>
          </div>
        </section>

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>2. 理由</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              次に、その結論を支える理由を書きます。
              理由は1つでも書けますが、可能なら2つあると説得力が増します。
              ただし、短い字数では無理に増やすより、1つをしっかり説明する方が良い場合もあります。
            </p>
            <p style={{ marginTop: 12 }}>
              ここで大切なのは、「なぜそう言えるのか」を一段深く言語化することです。
              単に「便利だから」では弱く、
              「個別最適な学習ができるから」「復習効率が上がるから」など、
              具体的な理由に落とし込む必要があります。
            </p>
          </div>
        </section>

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>3. 具体例</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              理由だけでは抽象的に見えることがあるため、
              必要に応じて具体例を添えます。具体例は、自分の経験でも、社会一般の事例でもかまいません。
            </p>
            <p style={{ marginTop: 12 }}>
              たとえば、「AIは苦手分野を分析して復習しやすくする」という主張なら、
              「英語学習アプリが苦手な単元を自動で提示してくれるように、
              AIは弱点補強に役立つ」といった書き方ができます。
              具体例があることで、読み手は主張をイメージしやすくなります。
            </p>
          </div>
        </section>

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>4. まとめ</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              最後に、最初の結論をもう一度言い直しながら全体を締めます。
              ここでは新しい話を広げる必要はなく、
              「以上の理由から、私は〜と考える」と結ぶだけでも十分です。
            </p>
            <p style={{ marginTop: 12 }}>
              まとめが弱いと、文章全体が途中で終わった印象になります。
              逆に最後まできちんと締めると、それだけで答案全体が整理されて見えます。
            </p>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>基本の型を1つ覚えるだけで書きやすくなる</h2>
          <div className="card" style={{ marginTop: 16 }}>
            <p>
              小論文は、才能よりも型の理解が大きい科目です。
              いきなり上手な表現を目指す必要はありません。
              まずは「結論 → 理由 → 具体例 → まとめ」という流れを覚え、
              どのテーマでもその型で考える練習をすると、安定して書けるようになります。
            </p>
            <p style={{ marginTop: 12 }}>
              書いたあとは、自分の文章がこの4つのどこに当たるかを確認すると、
              構成の弱点も見つけやすくなります。
              小論文が苦手な人ほど、まずは型を意識して練習するのがおすすめです。
            </p>
          </div>
        </section>

        <hr className="divider" />

        <RelatedGuides currentHref="/guide/essay-structure" />

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