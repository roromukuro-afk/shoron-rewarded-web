import type { Metadata } from "next";
import Link from "next/link";
import RelatedGuides from "../../components/RelatedGuides";
import { buildGuideJsonLd, buildGuideMetadata } from "../../lib/guide-seo";

const title = "小論文の結論の書き方｜最後を締めるだけで答案は整って見える";
const description =
  "小論文の結論の書き方を整理し、冒頭の主張をどう締めるか、曖昧な終わり方を避けるコツを解説します。";
const path = "/guide/how-to-write-conclusion";
const keywords = [
  "小論文",
  "小論文 結論",
  "小論文 締め方",
  "小論文 まとめ",
  "小論文 書き方",
];

export const metadata: Metadata = buildGuideMetadata({
  title,
  description,
  path,
  keywords,
});

export default function HowToWriteConclusionGuidePage() {
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
            <h1 className="page-title">小論文の結論の書き方｜最後を締めるだけで答案は整って見える</h1>
            <p className="page-lead">
              小論文では、最初の結論だけでなく、最後の結論のまとめ方も大切です。
            </p>

            <p style={{ marginTop: 12 }}>
              冒頭では立場を示し、最後では全体を締める。この流れがあるだけで、
              答案はかなり読みやすくなります。逆に、最後が弱いと
              「途中で終わった文章」に見えたり、言いたいことがぼやけたりします。
            </p>

            <p style={{ marginTop: 12 }}>
              ここでは、小論文の結論をどう書けばよいのかを整理します。
            </p>

            <div className="article-meta">
              <span className="article-chip">結論の作り方</span>
              <span className="article-chip">締め方</span>
              <span className="article-chip">完成度アップ</span>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <div className="article-body">
          <section className="article-section">
            <h2 className="article-section-title">1. 結論は新しい話を書く場所ではない</h2>
            <div className="article-section-card">
              <p>
                小論文の最後では、新しい論点を広げる必要はありません。
                まとめの役割は、それまでに書いた内容を踏まえて、
                自分の立場をもう一度はっきり示すことです。
              </p>
              <p>
                ここで急に別の視点や追加情報を出すと、文章全体のまとまりが崩れます。
                最後は「だから私はこう考える」と締める意識を持つことが大切です。
              </p>
            </div>
          </section>

          <section className="article-section">
            <h2 className="article-section-title">2. 冒頭の結論を言い換えて締める</h2>
            <div className="article-section-card">
              <p>
                結論は、冒頭で述べた主張をそのまま繰り返しても構いませんが、
                少し言い換えると自然になります。
              </p>
              <p>
                たとえば冒頭で「私はAIの活用は今後の学習に必要だと考える」と書いたなら、
                最後では「以上の理由から、AIの活用は今後の学習において重要な役割を果たすと考える」
                とまとめられます。
              </p>
            </div>
          </section>

          <section className="article-section">
            <h2 className="article-section-title">3. 理由を一言だけ添えると締まりやすい</h2>
            <div className="article-section-card">
              <p>
                まとめでは長い説明は不要ですが、理由を短く添えると説得力が増します。
                たとえば「学習効率を高められるから」「多様な視点に触れられるから」といった一言があるだけで、
                ただの言い直しではなく、筋の通った結論に見えます。
              </p>
              <p>
                ただし、ここで理由を増やしすぎると結論ではなく本文の続きになります。
                最後はあくまで短く、全体を閉じる意識が重要です。
              </p>
            </div>
          </section>

          <section className="article-section">
            <h2 className="article-section-title">4. 曖昧な締め方を避ける</h2>
            <div className="article-section-card">
              <p>
                「今後も考えていく必要がある」「難しい問題である」といった締め方は、
                一見まともに見えても、自分の立場が見えにくくなることがあります。
              </p>
              <p>
                もちろんテーマによっては慎重な表現が必要ですが、
                最後まで「自分はどう考えるのか」が読み取れる形にすることが大切です。
              </p>
            </div>
          </section>

          <section className="article-section">
            <h2 className="article-section-title">5. 使いやすい結論の型を持っておく</h2>
            <div className="article-section-card">
              <p>
                結論が苦手な人は、使いやすい型を1つ持っておくと書きやすくなります。
                たとえば次のような形です。
              </p>

              <ul>
                <li>以上の理由から、私は〜と考える。</li>
                <li>したがって、〜は重要であるといえる。</li>
                <li>このように、〜の点から私は〜が必要だと考える。</li>
              </ul>

              <p>
                こうした型があると、最後で迷いにくくなり、
                全体を安定して締められるようになります。
              </p>
            </div>
          </section>

          <section className="article-section">
            <h2 className="article-section-title">結論は短くてもいい、でも必要</h2>
            <div className="article-summary-box">
              <p>
                小論文の結論は、長く書く必要はありません。
                むしろ短くても、自分の立場が明確で、全体をきちんと締めていれば十分です。
              </p>
              <p>
                最後の一文があるだけで、答案はぐっと整理されて見えます。
                小論文を書くときは、書き出しだけでなく「どう終わるか」まで意識して練習することが大切です。
              </p>
            </div>
          </section>

          <section className="article-section">
            <div className="article-highlight">
              <strong>ポイント：</strong>
              迷ったら「以上の理由から、私は〜と考える。」に戻るだけでも、
              結論の形はかなり整います。
            </div>
          </section>
        </div>

        <hr className="divider" />

        <RelatedGuides currentHref="/guide/how-to-write-conclusion" />

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