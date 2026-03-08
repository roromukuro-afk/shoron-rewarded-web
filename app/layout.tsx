import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "小論設計室",
  description: "小論文を、AIと一緒に磨く添削サービス",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5148247638505100"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <div className="site-brand">
              <Link href="/" className="site-brand-name">
                小論設計室
              </Link>
              <div className="site-brand-sub">小論文添削サービス</div>
            </div>

            <nav className="site-nav">
              <Link href="/guide">学習ガイド</Link>
              <Link href="/submit">投稿</Link>
              <Link href="/billing">料金</Link>
              <Link href="/dashboard">ダッシュボード</Link>
              <Link href="/contact">お問い合わせ</Link>
            </nav>
          </div>
        </header>

        {children}

        <footer className="site-footer">
          <div className="site-footer-inner">
            <div style={{ fontWeight: 800 }}>小論設計室</div>
            <div className="muted">小論文を、AIと一緒に磨く添削サービス</div>

            <div className="site-footer-links">
              <Link href="/privacy">プライバシーポリシー</Link>
              <Link href="/terms">利用規約</Link>
              <Link href="/commerce">特定商取引法に基づく表記</Link>
              <Link href="/contact">お問い合わせ</Link>
              <Link href="/about">サービス概要</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}