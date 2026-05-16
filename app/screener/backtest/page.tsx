"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "../lib/api";

interface BacktestResult {
  symbol: string;
  entry_price: number;
  result_1d: number;
  result_3d: number;
  result_5d: number;
  result_10d: number;
  result_20d: number;
  max_gain: number;
  max_drawdown: number;
  hit_20_percent: boolean;
}

interface ScreeningCandidate {
  symbol: string;
  name: string;
  classification: string;
  total_score: number;
}

export default function BacktestPage() {
  const [candidates, setCandidates] = useState<ScreeningCandidate[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const [adopted, conditional] = await Promise.all([
        api.getResults({ classification: "採用候補", per_page: 50 }),
        api.getResults({ classification: "条件付き候補", per_page: 50 }),
      ]);
      const all = [...(adopted.results || []), ...(conditional.results || [])];
      setCandidates(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const toggleSymbol = (symbol: string) => {
    const next = new Set(selectedSymbols);
    next.has(symbol) ? next.delete(symbol) : next.add(symbol);
    setSelectedSymbols(next);
  };

  const selectAll = () => {
    setSelectedSymbols(new Set(candidates.map((c) => c.symbol)));
  };

  const runBacktest = async () => {
    if (selectedSymbols.size === 0) return;
    setRunning(true);
    try {
      const data = await api.runBacktest(Array.from(selectedSymbols));
      setResults(data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  const fmtPct = (v: number) =>
    v == null ? "-" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

  const colorPct = (v: number) =>
    v > 20 ? "text-emerald-300 font-bold" :
    v > 5 ? "text-emerald-400" :
    v > 0 ? "text-emerald-600" :
    v < -10 ? "text-red-400" :
    v < 0 ? "text-red-500" : "text-slate-300";

  const hit20Count = results.filter((r) => r.hit_20_percent).length;
  const avgGain = results.length > 0 ? results.reduce((s, r) => s + r.max_gain, 0) / results.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">バックテスト・追跡</h1>
        <p className="text-slate-400 text-sm mt-1">候補抽出後の株価推移を確認・追跡します</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Selection */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">追跡銘柄選択</h2>
            <button onClick={selectAll} className="text-xs text-blue-400 hover:text-blue-300">
              全選択
            </button>
          </div>

          {loading ? (
            <div className="text-slate-400 text-sm text-center py-8">読み込み中...</div>
          ) : candidates.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-8">
              候補なし。
              <Link href="/screener/screening" className="text-blue-400 block mt-2">→ スクリーニング実行</Link>
            </div>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {candidates.map((c) => (
                <label key={c.symbol} className="flex items-center gap-2 p-2 rounded hover:bg-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSymbols.has(c.symbol)}
                    onChange={() => toggleSymbol(c.symbol)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium truncate">{c.name || c.symbol}</div>
                    <div className="text-slate-400 text-xs">{c.symbol} | {c.total_score.toFixed(0)}点</div>
                  </div>
                </label>
              ))}
            </div>
          )}

          <button
            onClick={runBacktest}
            disabled={running || selectedSymbols.size === 0}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white py-2 rounded text-sm font-medium"
          >
            {running ? "追跡実行中..." : `▶ ${selectedSymbols.size}件を追跡実行`}
          </button>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {results.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
                <div className="text-xs text-slate-400">追跡銘柄数</div>
                <div className="text-2xl font-bold text-white">{results.length}</div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
                <div className="text-xs text-slate-400">+20%達成</div>
                <div className="text-2xl font-bold text-emerald-400">{hit20Count}</div>
                <div className="text-xs text-slate-500">{results.length > 0 ? `${((hit20Count / results.length) * 100).toFixed(0)}%` : "-"}</div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
                <div className="text-xs text-slate-400">平均最大上昇</div>
                <div className={`text-2xl font-bold ${avgGain > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {fmtPct(avgGain)}
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-800 border border-slate-700 rounded-lg">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-sm font-bold text-white">追跡結果</h2>
            </div>
            {results.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                銘柄を選択してバックテストを実行してください
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-900">
                      {["銘柄", "現在値", "翌営業日", "3日後", "5日後", "10日後", "20日後",
                        "最大上昇", "最大下落", "+20%達成"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-slate-400 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.symbol} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="px-3 py-2">
                          <Link href={`/screener/stock/${encodeURIComponent(r.symbol)}`} className="text-blue-400 hover:text-blue-300">
                            {r.symbol}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-white font-mono">{r.entry_price.toFixed(2)}</td>
                        <td className={`px-3 py-2 font-mono ${colorPct(r.result_1d)}`}>{fmtPct(r.result_1d)}</td>
                        <td className={`px-3 py-2 font-mono ${colorPct(r.result_3d)}`}>{fmtPct(r.result_3d)}</td>
                        <td className={`px-3 py-2 font-mono ${colorPct(r.result_5d)}`}>{fmtPct(r.result_5d)}</td>
                        <td className={`px-3 py-2 font-mono ${colorPct(r.result_10d)}`}>{fmtPct(r.result_10d)}</td>
                        <td className={`px-3 py-2 font-mono ${colorPct(r.result_20d)}`}>{fmtPct(r.result_20d)}</td>
                        <td className={`px-3 py-2 font-bold font-mono ${colorPct(r.max_gain)}`}>{fmtPct(r.max_gain)}</td>
                        <td className={`px-3 py-2 font-mono ${r.max_drawdown < -10 ? "text-red-400" : "text-slate-400"}`}>
                          {fmtPct(r.max_drawdown)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {r.hit_20_percent ? (
                            <span className="text-emerald-400 font-bold">✓</span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-700/30 border border-slate-700 rounded-lg p-4 text-xs text-slate-400">
        <p className="font-semibold text-slate-300 mb-1">バックテストについて</p>
        <p>• 現在のバックテストは利用可能な直近データ(数日〜数週間前)を基に価格変化を計算します。</p>
        <p>• 過去データの検証結果は将来の利益を保証しません。</p>
        <p>• これは投資助言ではなく、分析・学習目的のデータです。</p>
      </div>
    </div>
  );
}
