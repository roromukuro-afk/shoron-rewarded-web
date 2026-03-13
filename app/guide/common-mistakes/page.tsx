import type { Metadata } from "next";
import Link from "next/link";
import RelatedGuides from "../../components/RelatedGuides";
import { buildGuideJsonLd, buildGuideMetadata } from "../../lib/guide-seo";

const title = "小論文の基本構成とは？まず押さえたい4つの型";
const description =
  "小論文の基本構成である『結論・理由・具体例・まとめ』の4つの型を分かりやすく解説します。";
const path = "/guide/essay-structure";
const keywords = [
  "小論文",
  "小論文 書き方",
  "小論文 基本構成",
  "結論 理由 具体例 まとめ",
  "小論文 型",
];

export const metadata: Metadata = buildGuideMetadata({
  title,
  description,
  path,
  keywords,
});

export default function EssayStructureGuidePage() {
  const jsonLd = buildGuideJsonLd({
    title,
    description,
    path,
    keywords,
  });

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="article-shell">
        <section className="article-hero">
          <div className="article-hero-card">
            <div className="page-eyebrow">小論設計室｜学習ガイド</div>
            <h1 className="page-title">小論文の基本構成とは？まず押さえたい4つの型</h1>
            <p className="page-lead">
              小論文が書けないと感じる人の多くは、最初から文章力で勝負しようとしています。
            </p>

            <p style={{ marginTop: 12 }}>
              でも実際には、「何をどの順番で書くか」という構成が決まっているだけで、
              小論文はかなり書きやすくなります。受験で求められる小論文では、
              自由に書くことよりも、読み手に伝わる順序で論を組み立てることが大切です。
            </p>

            <p style={{ marginTop: 12 }}>
              そのため、まずは基本構成を理解し、
              どのテーマでも使える型として身につけることが重要です。
            </p>

            <div className="article-meta">
              <span className="article-chip">入門向け</span>
              <span className="article-chip">構成の基本</span>
              <span className="article-chip">まず最初に読む記事</span>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <div className="article-body">
          <section className="article-section">
            <h2 className="article-section-title">1. 結論</h2>
            <div className="article-section-card">
              <p>
                最初に、自分の立場や主張を明確に示します。
                小論文では「結局何が言いたいのか」が最初に分かる方が読みやすく、
                採点者にも論点が伝わりやすくなります。
              </p>
              <p>
                たとえば、「AIの活用は今後の学習に必要である」という設問なら、
                冒頭で「私は、AIの活用は今後の学習に必要だと考える」と書く形です。
                この一文があるだけで、全文の方向性がはっきりします。
              </p>
            </div>
          </section>

          <section className="article-section">
            <h2 className="article-section-title">2. 理由</h2>
            <div className="article-section-card">
              <p>
                次に、その結論を支える理由を書きます。
                理由は1つでも書けますが、可能なら2つあると説得力が増します。
                ただし、短い字数では無理に増やすより、1つをしっかり説明する方が良い場合もあります。
              </p>
              <p>
                ここで大切なのは、「なぜそう言えるのか」を一段深く言語化することです。
                単に「便利だから」では弱く、
                「個別最適な学習ができるから」「復習効率が上がるから」など、
                具体的な理由に落とし込む必要があります。
              </p>
            </div>
          </section>

          <section className="article-section">
            <h2 className="article-section-title">3. 具体例</h2>
            <div className="article-section-card">
              <p>
                理由だけでは抽象的に見えることがあるため、
                必要に応じて具体例を添えます。具体例は、自分の経験でも社会一般の事例でもかまいません。
              </p>
              <p>
                たとえば、「AIは苦手分野を分析して復習しやすくする」という主張なら、
                「英語学習アプリが苦手な単元を自動で提示してくれるように、
                AIは弱点補強に役立つ」といった書き方ができます。
                具体例があることで、読み手は主張をイメージしやすくなります。
              </p>
            </div>
          </section>

          <section className="article-section">
            <h2 className="article-section-title">4. まとめ</h2>
            <div className="article-section-card">
              <p>
                最後に、最初の結論をもう一度言い直しながら全体を締めます。
                ここでは新しい話を広げる必要はなく、
                「以上の理由から、私は〜と考える」と結ぶだけでも十分です。
              </p>
              <p>
                まとめが弱いと、文章全体が途中で終わった印象になります。
                逆に最後まできちんと締めると、それだけで答案全体が整理されて見えます。
              </p>
            </div>
          </section>

          <section className="article-section">
            <h2 className="article-section-title">まずは型を1つ身につける</h2>
            <div className="article-summary-box">
              <p>
                小論文は、才能よりも型の理解が大きい科目です。
                いきなり上手な表現を目指す必要はありません。
              </p>
              <p>
                まずは「結論 → 理由 → 具体例 → まとめ」という流れを覚え、
                どのテーマでもその型で考える練習をすると、安定して書けるようになります。
              </p>
            </div>
          </section>

          <section className="article-section">
            <div className="article-highlight">
              <strong>ポイント：</strong>
              小論文が苦手な人ほど、まずは「何を書くか」ではなく
              「どの順番で書くか」を意識すると整理しやすくなります。
            </div>
          </section>
        </div>

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