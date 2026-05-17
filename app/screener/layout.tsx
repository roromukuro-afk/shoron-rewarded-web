"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/screener", label: "ダッシュボード" },
  { href: "/screener/screening", label: "全銘柄スクリーニング" },
  { href: "/screener/ranking", label: "候補ランキング" },
  { href: "/screener/excluded", label: "除外銘柄" },
  { href: "/screener/exclusion-list", label: "除外リスト管理" },
  { href: "/screener/aar", label: "AAR出力" },
  { href: "/screener/backtest", label: "バックテスト" },
  { href: "/screener/settings", label: "設定" },
  { href: "/screener/deploy-status", label: "稼働状況" },
];

export default function ScreenerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50 shadow-lg">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/screener" className="flex items-center gap-2">
              <span className="text-blue-400 text-xl font-bold">📈</span>
              <span className="font-bold text-white text-sm md:text-base leading-tight">
                短期急騰3000円以下<br className="md:hidden" />
                <span className="hidden md:inline"> </span>AIスクリーナー
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          {/* Mobile nav */}
          <div className="md:hidden pb-2 flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                  pathname === item.href
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Disclaimer */}
      <div className="bg-amber-900/30 border-b border-amber-700/50 text-amber-200 text-xs px-4 py-1.5 text-center">
        ⚠ これは投資助言ではありません。分析・学習目的のツールです。売買推奨ではなく、最終判断はご自身でお願いします。
      </div>

      <main className="max-w-screen-2xl mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="bg-slate-900 border-t border-slate-700 mt-12 py-4 text-center text-xs text-slate-500">
        短期急騰3000円以下AIスクリーナー | 投資助言ではありません | 分析・学習目的
      </footer>
    </div>
  );
}
