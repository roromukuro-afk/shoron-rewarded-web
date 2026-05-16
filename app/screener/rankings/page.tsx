"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { ClassificationBadge, ScoreBar } from "../components/ScoreBar";

interface StockResult {
  symbol: string;
  name: string;
  market: string;
  jpy_price: number | null;
  price: number | null;
  currency: string;
  total_score: number;
  classification: string;
  volume_cycle_state: string;
  chart_cycle_state: string;
  chart_pattern_primary: string;
  upside_to_resistance: number | null;
  support_distance: number | null;
  ma25_deviation: number | null;
  warning_flags: string;
  warning_types: string;
  main_archetype: string;
  chart_types: string;
  material_status: string;
  theme_tags: string;
  trend_state: string;
  price_change_1d: number | null;
}

const CLASSIFICATIONS = ["採用候補", "条件付き候補", "監視候補"] as const;

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState<string>("採用候補");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [results, setResults] = useState<Record<string, StockResult[]>>({
    採用候補: [],
    条件付き候補: [],
    監視候補: [],
  });
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const newResults: Record<string, StockResult[]> = {};
      const newCounts: Record<string, number> = {};

      for (const cls of CLASSIFICATIONS) {
        const data = await api.getResults({ classification: cls, per_page: 50, page: 1 });
        newResults[cls] = data.results || [];
        newCounts[cls] = data.total || 0;
      }

      setResults(newResults);
      setCounts(newCounts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const current = results[activeTab] || [];

  const fmtPct = (v: number | null | undefined) =>
    v == null ? "-" : `${(v * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">候補ランキング</h1>
        <p className="text-slate-400 text-sm mt-1">急騰予兆スコアによる銘柄ランキング</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
        {CLASSIFICATIONS.map((cls) => (
          <button
            key={cls}
            onClick={() => setActiveTab(cls)}
            className={`px-4 py-2 rounded-t text-sm font-medium transition-colors ${
              activeTab === cls
                ? "bg-slate-700 text-white border-b-2 border-blue-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {cls}
            <span className="ml-2 bg-slate-600 rounded-full px-1.5 py-0.5 text-xs">
              {counts[cls] ?? 0}
            </span>
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setViewMode("card")}
            className={`px-3 py-1.5 rounded text-xs ${viewMode === "card" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"}`}
          >
            カード
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded text-xs ${viewMode === "table" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"}`}
          >
            テーブル
          </button>
          <a
            href={api.exportCSV({ classification: activeTab })}
            className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded transition-colors"
          >
            CSV出力
          </a>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">読み込み中...</div>
      ) : current.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          {activeTab}はありません
          <br />
          <Link href="/screener/screening" className="text-blue-400 mt-2 inline-block">
            → スクリーニングを実行する
          </Link>
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {current.map((stock) => (
            <div key={stock.symbol} className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-500 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/screener/stock/${encodeURIComponent(stock.symbol)}`}
                      className="text-white font-bold hover:text-blue-300 transition-colors"
                    >
                      {stock.name || stock.symbol}
                    </Link>
                    <span className="text-slate-400 text-xs">{stock.symbol}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{stock.market}</span>
                    <ClassificationBadge classification={stock.classification} />
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold font-mono ${
                    stock.total_score >= 85 ? "text-emerald-400" :
                    stock.total_score >= 75 ? "text-blue-400" : "text-yellow-400"
                  }`}>
                    {stock.total_score.toFixed(0)}
                  </div>
                  <div className="text-xs text-slate-500">/ 100点</div>
                </div>
              </div>

              <ScoreBar score={stock.total_score} />

              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div>
                  <span className="text-slate-500">現在値</span>
                  <span className="ml-1 text-white font-mono">
                    {stock.jpy_price ? `¥${stock.jpy_price.toFixed(0)}` : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">上値余地</span>
                  <span className={`ml-1 font-mono ${(stock.upside_to_resistance ?? 0) >= 0.2 ? "text-emerald-400" : "text-yellow-400"}`}>
                    {fmtPct(stock.upside_to_resistance)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">前日比</span>
                  <span className={`ml-1 font-mono ${(stock.price_change_1d ?? 0) > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {fmtPct(stock.price_change_1d)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">25MA乖離</span>
                  <span className={`ml-1 font-mono ${(stock.ma25_deviation ?? 0) > 0.3 ? "text-yellow-400" : "text-slate-300"}`}>
                    {fmtPct(stock.ma25_deviation)}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {stock.volume_cycle_state && (
                  <span className="px-1.5 py-0.5 bg-cyan-900/40 text-cyan-300 border border-cyan-700/50 rounded text-xs">
                    {stock.volume_cycle_state}
                  </span>
                )}
                {stock.chart_cycle_state && (
                  <span className="px-1.5 py-0.5 bg-blue-900/40 text-blue-300 border border-blue-700/50 rounded text-xs">
                    {stock.chart_cycle_state}
                  </span>
                )}
                {stock.main_archetype && (
                  <span className="px-1.5 py-0.5 bg-purple-900/40 text-purple-300 border border-purple-700/50 rounded text-xs">
                    {stock.main_archetype.split("/")[0].trim()}
                  </span>
                )}
              </div>

              {stock.warning_flags && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {stock.warning_flags.split(",").filter(Boolean).map((flag) => (
                    <span key={flag} className="px-1.5 py-0.5 bg-yellow-900/30 text-yellow-400 border border-yellow-700/30 rounded text-xs">
                      ⚠ {flag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-slate-700 flex justify-end">
                <Link
                  href={`/screener/stock/${encodeURIComponent(stock.symbol)}`}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  詳細を見る →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Table view
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900">
                {["#", "銘柄", "市場", "現在値(円)", "前日比", "スコア",
                  "主型", "出来高サイクル", "チャートサイクル", "上値余地", "25MA乖離", "判定", ""].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-slate-400 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {current.map((stock, i) => (
                <tr key={stock.symbol} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="px-3 py-2 text-slate-500 font-mono">{i + 1}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-white">{stock.name || stock.symbol}</div>
                    <div className="text-slate-500">{stock.symbol}</div>
                  </td>
                  <td className="px-3 py-2 text-slate-300">{stock.market}</td>
                  <td className="px-3 py-2 text-white font-mono">
                    {stock.jpy_price ? stock.jpy_price.toFixed(0) : "-"}
                  </td>
                  <td className={`px-3 py-2 font-mono ${(stock.price_change_1d ?? 0) > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {fmtPct(stock.price_change_1d)}
                  </td>
                  <td className={`px-3 py-2 font-bold font-mono ${
                    stock.total_score >= 85 ? "text-emerald-400" :
                    stock.total_score >= 75 ? "text-blue-400" : "text-yellow-400"
                  }`}>
                    {stock.total_score.toFixed(0)}
                  </td>
                  <td className="px-3 py-2 text-purple-400">{stock.main_archetype?.split("/")[0].trim()}</td>
                  <td className="px-3 py-2 text-cyan-400">{stock.volume_cycle_state}</td>
                  <td className="px-3 py-2 text-blue-400">{stock.chart_cycle_state}</td>
                  <td className={`px-3 py-2 font-mono ${(stock.upside_to_resistance ?? 0) >= 0.2 ? "text-emerald-400" : "text-yellow-400"}`}>
                    {fmtPct(stock.upside_to_resistance)}
                  </td>
                  <td className={`px-3 py-2 font-mono ${(stock.ma25_deviation ?? 0) > 0.3 ? "text-yellow-400" : "text-slate-300"}`}>
                    {fmtPct(stock.ma25_deviation)}
                  </td>
                  <td className="px-3 py-2">
                    <ClassificationBadge classification={stock.classification} />
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/screener/stock/${encodeURIComponent(stock.symbol)}`} className="text-blue-400 hover:text-blue-300 text-xs">
                      詳細 →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
