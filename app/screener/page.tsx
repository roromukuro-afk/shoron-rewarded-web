"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "./lib/api";
import { StatCard, ClassificationBadge, ScoreBar } from "./components/ScoreBar";

interface DashboardData {
  date: string;
  total_stocks: number;
  price_condition_pass: number;
  liquidity_condition_pass: number;
  adopted_count: number;
  conditional_count: number;
  watch_count: number;
  excluded_count: number;
  vol_cycle_counts: Record<string, number>;
  chart_cycle_counts: Record<string, number>;
  warning_counts: Record<string, number>;
  top_candidates: StockResult[];
  screening_running: boolean;
  screening_progress: number;
  screening_total: number;
}

interface StockResult {
  symbol: string;
  name: string;
  market: string;
  jpy_price: number;
  total_score: number;
  classification: string;
  volume_cycle_state: string;
  chart_cycle_state: string;
  warning_flags: string;
  main_archetype: string;
}

export default function ScreenerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const health = await api.health();
      setApiOk(true);
      const dash = await api.dashboard();
      setData(dash);
      setError(null);
    } catch (e: unknown) {
      setApiOk(false);
      setError(e instanceof Error ? e.message : "APIに接続できません");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const timer = setInterval(loadDashboard, 15000);
    return () => clearInterval(timer);
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 animate-pulse text-lg">ダッシュボード読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">ダッシュボード</h1>
        <p className="text-slate-400 text-sm mt-1">
          {data?.date || "今日"} のスクリーニング状況
        </p>
      </div>

      {/* API Status */}
      {apiOk === false && (
        <div className="bg-red-900/40 border border-red-600/50 rounded-lg p-4">
          <div className="text-red-300 font-semibold">⚠ バックエンドAPIに接続できません</div>
          <div className="text-red-400 text-sm mt-1">{error}</div>
          <div className="text-slate-400 text-xs mt-2">
            バックエンドを起動してください: <code className="text-blue-300">cd backend && python3 -m uvicorn main:app --reload --port 8000</code>
          </div>
        </div>
      )}

      {/* Screening Progress */}
      {data?.screening_running && (
        <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4">
          <div className="text-blue-300 font-semibold mb-2">🔄 スクリーニング実行中...</div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all"
              style={{
                width: `${((data.screening_progress / Math.max(data.screening_total, 1)) * 100).toFixed(1)}%`,
              }}
            />
          </div>
          <div className="text-xs text-blue-400 mt-1">
            {data.screening_progress} / {data.screening_total} 銘柄処理済み
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard title="取得銘柄数" value={data?.total_stocks ?? 0} color="text-white" />
        <StatCard title="価格条件通過" value={data?.price_condition_pass ?? 0} color="text-blue-300" />
        <StatCard title="流動性条件通過" value={data?.liquidity_condition_pass ?? 0} color="text-cyan-300" />
        <StatCard title="採用候補" value={data?.adopted_count ?? 0} color="text-emerald-400" />
        <StatCard title="条件付き候補" value={data?.conditional_count ?? 0} color="text-blue-400" />
        <StatCard title="監視候補" value={data?.watch_count ?? 0} color="text-yellow-400" />
        <StatCard title="除外銘柄" value={data?.excluded_count ?? 0} color="text-red-400" />
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-xs text-slate-400 mb-1">クイックアクション</div>
          <Link
            href="/screener/screening"
            className="block text-center bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 rounded transition-colors"
          >
            スクリーニング実行
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Top Rankings */}
        <div className="xl:col-span-2 bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">上位候補ランキング</h2>
            <Link href="/screener/rankings" className="text-xs text-blue-400 hover:text-blue-300">
              全件表示 →
            </Link>
          </div>
          {data?.top_candidates && data.top_candidates.length > 0 ? (
            <div className="space-y-2">
              {data.top_candidates.slice(0, 15).map((stock, i) => (
                <Link
                  key={stock.symbol}
                  href={`/screener/stock/${encodeURIComponent(stock.symbol)}`}
                  className="flex items-center gap-3 p-2 rounded hover:bg-slate-700 transition-colors group"
                >
                  <span className="text-slate-500 text-xs w-5 text-right font-mono">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors">
                        {stock.name || stock.symbol}
                      </span>
                      <span className="text-slate-500 text-xs">{stock.symbol}</span>
                      <ClassificationBadge classification={stock.classification} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{stock.market}</span>
                      <span className="text-xs text-slate-400">|</span>
                      <span className="text-xs text-slate-400">出来高: {stock.volume_cycle_state}</span>
                      <span className="text-xs text-slate-400">|</span>
                      <span className="text-xs text-slate-400">チャート: {stock.chart_cycle_state}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-white font-bold text-sm">{stock.total_score?.toFixed(0)}</div>
                    <div className="text-xs text-slate-400">点</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-slate-500 text-sm text-center py-8">
              スクリーニングを実行すると候補が表示されます
              <br />
              <Link href="/screener/screening" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">
                → スクリーニングを実行する
              </Link>
            </div>
          )}
        </div>

        {/* Cycle Counts */}
        <div className="space-y-4">
          {/* 出来高サイクル */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h2 className="text-sm font-bold text-white mb-3">出来高サイクル別件数</h2>
            {data?.vol_cycle_counts && Object.keys(data.vol_cycle_counts).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(data.vol_cycle_counts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-xs text-slate-300 w-24 shrink-0">{k}</span>
                      <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                        <div
                          className="bg-cyan-500 h-1.5 rounded-full"
                          style={{ width: `${(v / Math.max(...Object.values(data.vol_cycle_counts))) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right">{v}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-slate-500 text-xs text-center py-4">データなし</div>
            )}
          </div>

          {/* チャートサイクル */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h2 className="text-sm font-bold text-white mb-3">チャートサイクル別件数</h2>
            {data?.chart_cycle_counts && Object.keys(data.chart_cycle_counts).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(data.chart_cycle_counts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-xs text-slate-300 w-24 shrink-0">{k}</span>
                      <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${(v / Math.max(...Object.values(data.chart_cycle_counts))) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right">{v}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-slate-500 text-xs text-center py-4">データなし</div>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-300">⚠ 免責事項</p>
        <p>• これは投資助言ではありません。分析・学習目的のツールです。</p>
        <p>• 売買推奨ではありません。最終的な投資判断はユーザーご自身が行ってください。</p>
        <p>• AIは「買い推奨」「今買うべき」「必ず上がる」などの断定表現を使いません。</p>
        <p>• 掲載情報の正確性・完全性は保証されません。株式投資にはリスクが伴います。</p>
      </div>
    </div>
  );
}
