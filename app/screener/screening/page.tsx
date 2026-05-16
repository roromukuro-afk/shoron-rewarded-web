"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { ClassificationBadge } from "../components/ScoreBar";

interface ScreeningConfig {
  market: string;
  include_adr: boolean;
  price_limit_jpy: number;
  min_volume_jp: number;
  min_volume_us: number;
  min_score: number;
  apply_exclusion_list: boolean;
  mode: string;
  max_stocks: number | null;
}

interface ScreeningResult {
  symbol: string;
  name: string;
  market: string;
  price: number | null;
  jpy_price: number | null;
  currency: string;
  price_change_1d: number | null;
  volume: number | null;
  volume_avg20: number | null;
  volume_ratio: number | null;
  ma25: number | null;
  ma25_deviation: number | null;
  upside_to_resistance: number | null;
  support_distance: number | null;
  trend_state: string;
  candle_state: string;
  chart_pattern_primary: string;
  volume_cycle_state: string;
  chart_cycle_state: string;
  material_status: string;
  theme_tags: string;
  total_score: number;
  classification: string;
  main_archetype: string;
  warning_flags: string;
  exclude_reason: string;
  exclude_flag: boolean;
}

const DEFAULT_CONFIG: ScreeningConfig = {
  market: "JP",
  include_adr: false,
  price_limit_jpy: 3000,
  min_volume_jp: 30000,
  min_volume_us: 100000,
  min_score: 0,
  apply_exclusion_list: true,
  mode: "sample",
  max_stocks: 50,
};

export default function ScreeningPage() {
  const [config, setConfig] = useState<ScreeningConfig>(DEFAULT_CONFIG);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, status: "idle", pct: 0 });
  const [results, setResults] = useState<ScreeningResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [filterClassification, setFilterClassification] = useState("");
  const [filterMarket, setFilterMarket] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        page,
        per_page: 100,
        min_score: config.min_score || 0,
      };
      if (filterClassification) params.classification = filterClassification;
      if (filterMarket) params.market = filterMarket;

      const data = await api.getResults(params);
      setResults(data.results || []);
      setTotalResults(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filterClassification, filterMarket, config.min_score]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const startScreening = async () => {
    try {
      setRunning(true);
      setErrors([]);
      await api.runScreening(config);

      pollRef.current = setInterval(async () => {
        try {
          const prog = await api.getProgress();
          setProgress(prog);
          if (!prog.running) {
            clearInterval(pollRef.current!);
            setRunning(false);
            fetchResults();
          }
        } catch (e) {
          console.error(e);
        }
      }, 1500);
    } catch (e: unknown) {
      setRunning(false);
      setErrors([e instanceof Error ? e.message : String(e)]);
    }
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const fmtPct = (v: number | null | undefined) =>
    v == null ? "-" : `${(v * 100).toFixed(1)}%`;
  const fmtNum = (v: number | null | undefined) =>
    v == null ? "-" : v.toFixed(2);
  const fmtVol = (v: number | null | undefined) =>
    v == null ? "-" : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">全銘柄スクリーニング</h1>
        <p className="text-slate-400 text-sm mt-1">対象市場の全銘柄をスクリーニングして急騰候補を抽出します</p>
      </div>

      {/* Config Panel */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-bold text-white">スクリーニング設定</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Market */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">対象市場</label>
            <select
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white"
              value={config.market}
              onChange={(e) => setConfig({ ...config, market: e.target.value })}
            >
              <option value="JP">日本株のみ</option>
              <option value="US">米国株のみ</option>
              <option value="ALL">日本株 + 米国株</option>
            </select>
          </div>

          {/* Mode */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">データモード</label>
            <select
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white"
              value={config.mode}
              onChange={(e) => setConfig({ ...config, mode: e.target.value })}
            >
              <option value="sample">サンプルモード (高速)</option>
              <option value="real">実データモード (要通信)</option>
            </select>
          </div>

          {/* Price Limit */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">価格上限 (円)</label>
            <input
              type="number"
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white"
              value={config.price_limit_jpy}
              onChange={(e) => setConfig({ ...config, price_limit_jpy: Number(e.target.value) })}
            />
          </div>

          {/* Max Stocks */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">最大処理銘柄数</label>
            <input
              type="number"
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white"
              value={config.max_stocks || ""}
              placeholder="全銘柄 (空欄)"
              onChange={(e) =>
                setConfig({ ...config, max_stocks: e.target.value ? Number(e.target.value) : null })
              }
            />
          </div>

          {/* Min Volume JP */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">最低出来高 日本株</label>
            <input
              type="number"
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white"
              value={config.min_volume_jp}
              onChange={(e) => setConfig({ ...config, min_volume_jp: Number(e.target.value) })}
            />
          </div>

          {/* Min Volume US */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">最低出来高 米国株</label>
            <input
              type="number"
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white"
              value={config.min_volume_us}
              onChange={(e) => setConfig({ ...config, min_volume_us: Number(e.target.value) })}
            />
          </div>

          {/* Min Score */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">最低スコア</label>
            <input
              type="number"
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white"
              value={config.min_score}
              onChange={(e) => setConfig({ ...config, min_score: Number(e.target.value) })}
            />
          </div>

          {/* Options */}
          <div className="flex flex-col gap-2 justify-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.include_adr}
                onChange={(e) => setConfig({ ...config, include_adr: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs text-slate-300">ADRを含める</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.apply_exclusion_list}
                onChange={(e) => setConfig({ ...config, apply_exclusion_list: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs text-slate-300">除外リスト適用</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={startScreening}
            disabled={running}
            className={`px-6 py-2.5 rounded font-semibold text-sm transition-colors ${
              running
                ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {running ? "🔄 スクリーニング実行中..." : "▶ 全銘柄スクリーニング実行"}
          </button>
          {running && (
            <div className="flex-1">
              <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {progress.status} ({progress.pct}%)
              </div>
            </div>
          )}
        </div>

        {errors.length > 0 && (
          <div className="bg-red-900/30 border border-red-700 rounded p-3 text-xs text-red-300">
            {errors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white">スクリーニング結果</h2>
            <span className="text-xs text-slate-400">全{totalResults}件</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filters */}
            <select
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white"
              value={filterClassification}
              onChange={(e) => { setFilterClassification(e.target.value); setPage(1); }}
            >
              <option value="">全判定</option>
              <option value="採用候補">採用候補</option>
              <option value="条件付き候補">条件付き候補</option>
              <option value="監視候補">監視候補</option>
              <option value="除外">除外</option>
            </select>
            <select
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white"
              value={filterMarket}
              onChange={(e) => { setFilterMarket(e.target.value); setPage(1); }}
            >
              <option value="">全市場</option>
              <option value="JP">日本株</option>
              <option value="US">米国株</option>
              <option value="ADR">ADR</option>
            </select>
            <a
              href={api.exportCSV({ classification: filterClassification })}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs px-3 py-1 rounded transition-colors"
            >
              CSV出力
            </a>
            <a
              href={api.exportExcel({})}
              className="bg-blue-700 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded transition-colors"
            >
              Excel出力
            </a>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">データ読み込み中...</div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            スクリーニングを実行してください
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900">
                  {["銘柄", "市場", "現在値(円)", "前日比", "出来高", "出来高倍率",
                    "25MA乖離", "上値余地", "支持線距離", "トレンド", "ローソク足",
                    "出来高サイクル", "チャートサイクル", "チャートP", "材料",
                    "スコア", "判定", "警告", "除外理由"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-slate-400 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.symbol} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Link href={`/screener/stock/${encodeURIComponent(r.symbol)}`} className="text-blue-400 hover:text-blue-300">
                        <div className="font-medium">{r.symbol}</div>
                        <div className="text-slate-400 truncate max-w-24">{r.name}</div>
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{r.market}</td>
                    <td className="px-3 py-2 text-white font-mono whitespace-nowrap">
                      {r.jpy_price ? r.jpy_price.toFixed(0) : "-"}
                    </td>
                    <td className={`px-3 py-2 font-mono whitespace-nowrap ${
                      (r.price_change_1d ?? 0) > 0 ? "text-emerald-400" : (r.price_change_1d ?? 0) < 0 ? "text-red-400" : "text-slate-300"
                    }`}>
                      {fmtPct(r.price_change_1d)}
                    </td>
                    <td className="px-3 py-2 text-slate-300 font-mono whitespace-nowrap">{fmtVol(r.volume)}</td>
                    <td className={`px-3 py-2 font-mono whitespace-nowrap ${
                      (r.volume_ratio ?? 0) > 2 ? "text-yellow-400" : "text-slate-300"
                    }`}>
                      {r.volume_ratio != null ? `${r.volume_ratio.toFixed(1)}x` : "-"}
                    </td>
                    <td className={`px-3 py-2 font-mono whitespace-nowrap ${
                      (r.ma25_deviation ?? 0) > 0.5 ? "text-red-400" : (r.ma25_deviation ?? 0) > 0.2 ? "text-yellow-400" : "text-slate-300"
                    }`}>
                      {fmtPct(r.ma25_deviation)}
                    </td>
                    <td className={`px-3 py-2 font-mono whitespace-nowrap ${
                      (r.upside_to_resistance ?? 0) >= 0.2 ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {fmtPct(r.upside_to_resistance)}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-300 whitespace-nowrap">
                      {fmtPct(r.support_distance)}
                    </td>
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap text-xs">{r.trend_state}</td>
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap text-xs">{r.candle_state}</td>
                    <td className="px-3 py-2 text-cyan-400 whitespace-nowrap text-xs">{r.volume_cycle_state}</td>
                    <td className="px-3 py-2 text-blue-400 whitespace-nowrap text-xs">{r.chart_cycle_state}</td>
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap text-xs">{r.chart_pattern_primary}</td>
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap text-xs">{r.material_status}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`font-bold font-mono ${
                        (r.total_score || 0) >= 85 ? "text-emerald-400" :
                        (r.total_score || 0) >= 75 ? "text-blue-400" :
                        (r.total_score || 0) >= 65 ? "text-yellow-400" : "text-slate-400"
                      }`}>
                        {(r.total_score || 0).toFixed(0)}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <ClassificationBadge classification={r.classification} />
                    </td>
                    <td className="px-3 py-2 text-yellow-400 whitespace-nowrap text-xs max-w-32 truncate">
                      {r.warning_flags}
                    </td>
                    <td className="px-3 py-2 text-red-400 whitespace-nowrap text-xs max-w-32 truncate">
                      {r.exclude_reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalResults > 100 && (
          <div className="p-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs disabled:opacity-50"
            >
              ← 前
            </button>
            <span className="text-xs text-slate-400">{page} / {Math.ceil(totalResults / 100)}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(totalResults / 100)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs disabled:opacity-50"
            >
              次 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
