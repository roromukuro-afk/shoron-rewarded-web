"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { ClassificationBadge } from "../components/ScoreBar";

interface StockResult {
  symbol: string;
  name: string;
  market: string;
  classification: string;
  total_score: number;
  jpy_price: number | null;
  volume_cycle_state: string;
  chart_cycle_state: string;
  main_archetype: string;
  exclude_reason: string;
}

export default function AARPage() {
  const [candidates, setCandidates] = useState<StockResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [aarText, setAarText] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const [adopted, conditional, watch] = await Promise.all([
        api.getResults({ classification: "採用候補", per_page: 50 }),
        api.getResults({ classification: "条件付き候補", per_page: 50 }),
        api.getResults({ classification: "監視候補", per_page: 50 }),
      ]);
      const all = [
        ...(adopted.results || []),
        ...(conditional.results || []),
        ...(watch.results || []),
      ].sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
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

  const generateAAR = async (symbol: string) => {
    setSelectedSymbol(symbol);
    setGenerating(true);
    try {
      const data = await api.getStockAAR(symbol);
      setAarText(data.aar_text);
    } catch (e) {
      console.error(e);
      setAarText("AARの生成に失敗しました。");
    } finally {
      setGenerating(false);
    }
  };

  const generateAllAAR = async () => {
    if (candidates.length === 0) return;
    setGenerating(true);
    try {
      const parts: string[] = [];
      for (const candidate of candidates.slice(0, 10)) {
        const data = await api.getStockAAR(candidate.symbol);
        parts.push(data.aar_text);
        parts.push("\n\n" + "=".repeat(60) + "\n\n");
      }
      setAarText(parts.join(""));
      setSelectedSymbol("ALL");
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AAR出力</h1>
        <p className="text-slate-400 text-sm mt-1">
          候補銘柄のAARメモを生成します。NotebookLMへの貼り付けに対応。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Candidates List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">候補銘柄一覧</h2>
              <button
                onClick={generateAllAAR}
                disabled={generating || candidates.length === 0}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 text-white text-xs px-3 py-1.5 rounded"
              >
                全件AAR生成 (上位10件)
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
              <div className="space-y-1.5">
                {candidates.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => generateAAR(stock.symbol)}
                    className={`w-full text-left p-3 rounded transition-colors ${
                      selectedSymbol === stock.symbol
                        ? "bg-blue-800 border border-blue-600"
                        : "bg-slate-700 hover:bg-slate-600 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white text-xs font-medium">{stock.name || stock.symbol}</div>
                        <div className="text-slate-400 text-xs">{stock.symbol} | {stock.market}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <ClassificationBadge classification={stock.classification} />
                        <span className={`text-xs font-bold font-mono ${
                          stock.total_score >= 85 ? "text-emerald-400" :
                          stock.total_score >= 75 ? "text-blue-400" : "text-yellow-400"
                        }`}>{stock.total_score.toFixed(0)}点</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1.5">
                      <span className="text-xs text-cyan-400">{stock.volume_cycle_state}</span>
                      <span className="text-xs text-blue-400">{stock.chart_cycle_state}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AAR Output */}
        <div className="lg:col-span-3">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">
                AARメモ {selectedSymbol ? `(${selectedSymbol})` : ""}
              </h2>
              <div className="flex gap-2">
                {aarText && (
                  <>
                    <button
                      onClick={() => navigator.clipboard.writeText(aarText)}
                      className="bg-slate-600 hover:bg-slate-500 text-white text-xs px-3 py-1.5 rounded"
                    >
                      コピー
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([aarText], { type: "text/plain;charset=utf-8" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `aar_${selectedSymbol || "all"}.txt`;
                        a.click();
                      }}
                      className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded"
                    >
                      テキスト保存
                    </button>
                  </>
                )}
              </div>
            </div>

            {generating ? (
              <div className="flex items-center justify-center h-64 text-blue-400 animate-pulse">
                AARメモを生成中...
              </div>
            ) : aarText ? (
              <pre className="text-xs text-slate-300 bg-slate-900 rounded p-4 overflow-auto h-[calc(100vh-300px)] whitespace-pre-wrap leading-relaxed">
                {aarText}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-500 text-sm flex-col gap-3">
                <span className="text-4xl">📋</span>
                <span>左の候補一覧から銘柄を選択してください</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4 text-xs text-amber-300">
        ⚠ AARメモは投資助言ではなく、短期急騰パターンの分析・学習用メモです。最終的な売買判断はユーザー自身が行う前提です。
      </div>
    </div>
  );
}
