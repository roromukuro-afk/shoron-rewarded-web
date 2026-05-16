"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "../lib/api";

interface ExcludedStock {
  symbol: string;
  name: string;
  market: string;
  price: number | null;
  jpy_price: number | null;
  volume: number | null;
  total_score: number;
  classification: string;
  exclude_reason: string;
  warning_flags: string;
  date: string;
}

const EXCLUDE_REASON_COLORS: Record<string, string> = {
  "価格条件外": "text-orange-400",
  "価格不明": "text-orange-300",
  "出来高不足": "text-yellow-400",
  "上値余地不足": "text-yellow-300",
  "25MA乖離過大": "text-red-400",
  "直近20日で2倍以上": "text-red-500",
  "支持線割れ": "text-red-600",
  "除外リスト登録済み": "text-purple-400",
  "データ取得失敗": "text-slate-400",
  "処理エラー": "text-slate-300",
};

export default function ExcludedPage() {
  const [stocks, setStocks] = useState<ExcludedStock[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterReason, setFilterReason] = useState("");
  const [reasonCounts, setReasonCounts] = useState<Record<string, number>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getResults({ exclude_flag: true, per_page: 500 });
      const allResults: ExcludedStock[] = data.results || [];
      setTotal(data.total || 0);

      const counts: Record<string, number> = {};
      allResults.forEach((r) => {
        const reason = r.exclude_reason || "不明";
        counts[reason] = (counts[reason] || 0) + 1;
      });
      setReasonCounts(counts);

      if (filterReason) {
        setStocks(allResults.filter((r) => r.exclude_reason === filterReason));
      } else {
        setStocks(allResults);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterReason]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fmtVol = (v: number | null) =>
    v == null ? "-" : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">除外銘柄</h1>
        <p className="text-slate-400 text-sm mt-1">除外条件に該当した銘柄の詳細 (全{total}件)</p>
      </div>

      {/* Reason breakdown */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h2 className="text-sm font-bold text-white mb-3">除外理由の内訳</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <button
            onClick={() => setFilterReason("")}
            className={`text-left px-3 py-2 rounded text-xs transition-colors ${
              filterReason === "" ? "bg-slate-600 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-300"
            }`}
          >
            <div className="font-semibold">全除外</div>
            <div className="text-slate-400">{total}件</div>
          </button>
          {Object.entries(reasonCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([reason, count]) => (
              <button
                key={reason}
                onClick={() => setFilterReason(reason)}
                className={`text-left px-3 py-2 rounded text-xs transition-colors ${
                  filterReason === reason ? "bg-slate-600 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                }`}
              >
                <div className={`font-semibold truncate ${EXCLUDE_REASON_COLORS[reason] || "text-slate-300"}`}>
                  {reason}
                </div>
                <div className="text-slate-400">{count}件</div>
              </button>
            ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="text-sm font-bold text-white">
            {filterReason ? `「${filterReason}」の除外銘柄` : "全除外銘柄"}
            <span className="ml-2 text-slate-400 text-xs">({stocks.length}件)</span>
          </div>
          <a
            href={api.exportCSV({ classification: "除外" })}
            className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded"
          >
            CSV出力
          </a>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">読み込み中...</div>
        ) : stocks.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            除外銘柄なし。スクリーニングを実行してください。
            <br />
            <Link href="/screener/screening" className="text-blue-400 mt-2 inline-block">
              → スクリーニングを実行する
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900">
                  {["銘柄コード", "銘柄名", "市場", "除外理由", "価格(円)", "出来高", "スコア", "警告フラグ", "日付"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-slate-400 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stocks.map((r) => (
                  <tr key={r.symbol} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-3 py-2">
                      <Link href={`/screener/stock/${encodeURIComponent(r.symbol)}`} className="text-blue-400 hover:text-blue-300">
                        {r.symbol}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-slate-300">{r.name}</td>
                    <td className="px-3 py-2 text-slate-400">{r.market}</td>
                    <td className={`px-3 py-2 font-medium ${EXCLUDE_REASON_COLORS[r.exclude_reason] || "text-slate-300"}`}>
                      {r.exclude_reason}
                    </td>
                    <td className="px-3 py-2 text-white font-mono">
                      {r.jpy_price ? r.jpy_price.toFixed(0) : "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-300 font-mono">{fmtVol(r.volume)}</td>
                    <td className="px-3 py-2 text-slate-400 font-mono">{(r.total_score || 0).toFixed(0)}</td>
                    <td className="px-3 py-2 text-yellow-400 max-w-48 truncate">{r.warning_flags}</td>
                    <td className="px-3 py-2 text-slate-400">{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
