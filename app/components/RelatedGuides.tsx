import Link from "next/link";

type Item = {
  href: string;
  title: string;
};

const ALL_GUIDES: Item[] = [
  {
    href: "/guide/essay-structure",
    title: "小論文の基本構成とは？まず押さえたい4つの型",
  },
  {
    href: "/guide/common-mistakes",
    title: "小論文でよくある失敗5選｜点数が伸びない原因はここにある",
  },
  {
    href: "/guide/how-to-write-conclusion",
    title: "小論文の結論の書き方｜最後を締めるだけで答案は整って見える",
  },
  {
    href: "/guide/how-to-write-200-400",
    title: "200〜400字の小論文をうまくまとめるコツ",
  },
  {
    href: "/guide/common-themes",
    title: "小論文でよく出るテーマ例｜まず押さえたい頻出分野",
  },
];

export default function RelatedGuides({ currentHref }: { currentHref: string }) {
  const items = ALL_GUIDES.filter((x) => x.href !== currentHref).slice(0, 4);

  return (
    <section className="section">
      <h2 style={{ fontSize: 24, fontWeight: 900 }}>関連記事</h2>

      <div className="card-grid" style={{ marginTop: 16 }}>
        {items.map((item) => (
          <article key={item.href} className="card">
            <div style={{ fontWeight: 900 }}>{item.title}</div>
            <div style={{ marginTop: 12 }}>
              <Link href={item.href}>→ 記事を読む</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}