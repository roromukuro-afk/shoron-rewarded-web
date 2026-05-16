"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Legend
} from "recharts";
import { api } from "../../lib/api";
import { ClassificationBadge, ScoreBar } from "../../components/ScoreBar";

interface StockDetail {
  symbol: string;
  name: string;
  market: string;
  price: number | null;
  jpy_price: number | null;
  currency: string;
  fx_rate: number;
  total_score: number;
  classification: string;
  upside_score: number;
  future_catalyst_score: number;
  chart_score: number;
  volume_cycle_score: number;
  material_theme_score: number;
  supply_score: number;
  archetype_score: number;
  risk_management_score: number;
  trend_state: string;
  range_state: string;
  candle_state: string;
  chart_pattern_primary: string;
  chart_pattern_secondary: string;
  chart_pattern_warning: string;
  volume_cycle_state: string;
  chart_cycle_state: string;
  ma5: number | null;
  ma25: number | null;
  ma75: number | null;
  ma200: number | null;
  ma25_deviation: number | null;
  support_line: number | null;
  resistance_line: number | null;
  upside_to_resistance: number | null;
  support_distance: number | null;
  recent_high_20: number | null;
  recent_low_20: number | null;
  main_archetype: string;
  sub_archetypes: string;
  chart_types: string;
  warning_types: string;
  warning_flags: string;
  material_status: string;
  theme_tags: string;
  price_change_1d: number | null;
  price_change_5d: number | null;
  price_change_20d: number | null;
  volume: number | null;
  volume_avg20: number | null;
  volume_ratio: number | null;
  exclude_flag: boolean;
  exclude_reason: string;
  ai_comment: string;
}

interface ChartPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const decodedSymbol = decodeURIComponent(symbol);

  const [stock, setStock] = useState<StockDetail | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aarText, setAarText] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [stockData, chart] = await Promise.all([
          api.getStock(decodedSymbol),
          api.getStockChart(decodedSymbol),
        ]);
        setStock(stockData);
        setChartData((chart.data || []).slice(-60));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "データ取得エラー");
      } finally {
        setLoading(false);
      }
    };
    if (decodedSymbol) load();
  }, [decodedSymbol]);

  const loadAAR = async () => {
    try {
      const data = await api.getStockAAR(decodedSymbol);
      setAarText(data.aar_text);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400">読み込み中...</div>;
  if (error) return (
    <div className="bg-red-900/30 border border-red-700 rounded-lg p-6">
      <div className="text-red-300 font-bold">エラー</div>
      <div className="text-red-400 mt-1">{error}</div>
      <Link href="/screener/rankings" className="text-blue-400 mt-3 inline-block">← ランキングに戻る</Link>
    </div>
  );
  if (!stock) return null;

  const fmtPct = (v: number | null | undefined) =>
    v == null ? "-" : `${(v * 100).toFixed(1)}%`;
  const fmtPrice = (v: number | null | undefined) =>
    v == null ? "-" : v.toFixed(2);

  const scoreBreakdown = [
    { label: "上値余地(+20%以上)", score: stock.upside_score, max: 15 },
    { label: "未来急騰予兆", score: stock.future_catalyst_score, max: 15 },
    { label: "チャート構造", score: stock.chart_score, max: 15 },
    { label: "出来高サイクル", score: stock.volume_cycle_score, max: 15 },
    { label: "材料・テーマ", score: stock.material_theme_score, max: 10 },
    { label: "需給の軽さ", score: stock.supply_score, max: 10 },
    { label: "アーキタイプ重なり", score: stock.archetype_score, max: 10 },
    { label: "リスク管理", score: stock.risk_management_score, max: 10 },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-400">
        <Link href="/screener" className="hover:text-white">ダッシュボード</Link>
        {" / "}
        <Link href="/screener/rankings" className="hover:text-white">ランキング</Link>
        {" / "}
        <span className="text-white">{decodedSymbol}</span>
      </div>

      {/* Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{stock.name || decodedSymbol}</h1>
              <span className="text-slate-400 text-lg">{decodedSymbol}</span>
              <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-sm">{stock.market}</span>
              <ClassificationBadge classification={stock.classification} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-white font-bold text-xl">
                {stock.currency === "JPY" ? "¥" : "$"}{fmtPrice(stock.price)}
              </span>
              {stock.currency !== "JPY" && (
                <span className="text-slate-400">≈ ¥{fmtPrice(stock.jpy_price)} (×{stock.fx_rate})</span>
              )}
              <span className={`font-mono ${(stock.price_change_1d ?? 0) > 0 ? "text-emerald-400" : "text-red-400"}`}>
                {fmtPct(stock.price_change_1d)} (前日比)
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold font-mono ${
              stock.total_score >= 85 ? "text-emerald-400" :
              stock.total_score >= 75 ? "text-blue-400" :
              stock.total_score >= 65 ? "text-yellow-400" : "text-slate-400"
            }`}>
              {stock.total_score.toFixed(0)}
            </div>
            <div className="text-slate-400 text-sm">急騰予兆スコア / 100</div>
          </div>
        </div>

        {/* Score Bar */}
        <div className="mt-4">
          <ScoreBar score={stock.total_score} />
        </div>

        {/* Archetypes */}
        <div className="flex flex-wrap gap-2 mt-4">
          {stock.main_archetype && (
            <span className="px-2 py-1 bg-purple-900/40 text-purple-300 border border-purple-700/50 rounded text-xs">
              主型: {stock.main_archetype.split("/")[0].trim()}
            </span>
          )}
          {stock.chart_types?.split(",").filter(Boolean).map((t) => (
            <span key={t} className="px-2 py-1 bg-blue-900/40 text-blue-300 border border-blue-700/50 rounded text-xs">
              {t}
            </span>
          ))}
          {stock.warning_types?.split(",").filter(Boolean).map((t) => (
            <span key={t} className="px-2 py-1 bg-red-900/40 text-red-300 border border-red-700/50 rounded text-xs">
              ⚠ {t}
            </span>
          ))}
        </div>

        {stock.exclude_flag && (
          <div className="mt-3 bg-red-900/30 border border-red-700/50 rounded p-3 text-sm">
            <span className="text-red-400 font-semibold">除外理由: </span>
            <span className="text-red-300">{stock.exclude_reason}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="xl:col-span-2 space-y-4">
          {/* Price Chart */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h2 className="text-sm font-bold text-white mb-4">価格チャート (直近60日)</h2>
            {chartData.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                      tickFormatter={(v) => v.slice(5)}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      yAxisId="price"
                      orientation="right"
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                      tickFormatter={(v) => v.toFixed(0)}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
                      labelStyle={{ color: "#e2e8f0" }}
                      itemStyle={{ color: "#94a3b8" }}
                    />
                    <Bar yAxisId="price" dataKey="high" fill="transparent" stroke="transparent" />
                    <Bar yAxisId="price" dataKey="low" fill="transparent" stroke="transparent" />
                    <Line yAxisId="price" type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2} dot={false} name="終値" />
                    <Line yAxisId="price" type="monotone" dataKey="open" stroke="#64748b" strokeWidth={1} dot={false} name="始値" />
                    {stock.support_line && (
                      <ReferenceLine yAxisId="price" y={stock.support_line} stroke="#22c55e" strokeDasharray="5 5" label={{ value: "支持線", fill: "#22c55e", fontSize: 10 }} />
                    )}
                    {stock.resistance_line && (
                      <ReferenceLine yAxisId="price" y={stock.resistance_line} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "抵抗線", fill: "#ef4444", fontSize: 10 }} />
                    )}
                    {stock.ma25 && (
                      <ReferenceLine yAxisId="price" y={stock.ma25} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "25MA", fill: "#f59e0b", fontSize: 10 }} />
                    )}
                    <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 11 }} />
                  </ComposedChart>
                </ResponsiveContainer>

                {/* Volume Chart */}
                <div className="mt-2">
                  <ResponsiveContainer width="100%" height={80}>
                    <ComposedChart data={chartData} margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" hide />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                      <Bar dataKey="volume" fill="#3b82f6" opacity={0.6} name="出来高" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                チャートデータなし
              </div>
            )}
          </div>

          {/* AI Analysis */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-4">
            <h2 className="text-sm font-bold text-white">AI詳細分析</h2>

            <AnalysisSection title="【+20%以上を狙える理由】" color="text-emerald-400">
              <p>• 抵抗線までの上値余地: <strong className="text-emerald-300">{fmtPct(stock.upside_to_resistance)}</strong></p>
              <p>• 支持線距離 (損切りライン): {fmtPct(stock.support_distance)}</p>
              <p>• 市場: {stock.market} | テーマ: {stock.theme_tags || "なし"}</p>
            </AnalysisSection>

            <AnalysisSection title="【未来急騰予兆】" color="text-blue-400">
              <p>• 出来高サイクル: <strong className="text-cyan-300">{stock.volume_cycle_state}</strong></p>
              <p>• チャートサイクル: <strong className="text-blue-300">{stock.chart_cycle_state}</strong></p>
              <p>• チャートパターン: {stock.chart_pattern_primary}</p>
              <p>• レンジ状態: {stock.range_state}</p>
            </AnalysisSection>

            <AnalysisSection title="【材料・テーマ】" color="text-yellow-400">
              <p>• 材料状況: <strong className="text-yellow-300">{stock.material_status}</strong></p>
              <p>• テーマ: {stock.theme_tags || "なし"}</p>
              {stock.material_status === "材料不明" && (
                <p className="text-yellow-500">⚠ 材料が確認できないため警告フラグあり</p>
              )}
            </AnalysisSection>

            <AnalysisSection title="【チャートの意味】" color="text-purple-400">
              <p>• トレンド状態: {stock.trend_state}</p>
              <p>• レンジ状態: {stock.range_state}</p>
              <p>• 支持線: {fmtPrice(stock.support_line)} | 抵抗線: {fmtPrice(stock.resistance_line)}</p>
              <p>• チャートサイクル: {stock.chart_cycle_state}</p>
              <p>• パターン: {stock.chart_pattern_primary} {stock.chart_pattern_secondary ? `/ ${stock.chart_pattern_secondary}` : ""}</p>
            </AnalysisSection>

            <AnalysisSection title="【ローソク足の意味】" color="text-cyan-400">
              <p>• 直近ローソク足: <strong className="text-cyan-300">{stock.candle_state}</strong></p>
              <p>• {interpretCandle(stock.candle_state)}</p>
            </AnalysisSection>

            <AnalysisSection title="【出来高の意味】" color="text-indigo-400">
              <p>• 出来高サイクル: <strong className="text-indigo-300">{stock.volume_cycle_state}</strong></p>
              <p>• 出来高倍率: {stock.volume_ratio ? `${stock.volume_ratio.toFixed(1)}倍` : "-"}</p>
              <p>• 20日平均出来高: {stock.volume_avg20 ? `${(stock.volume_avg20 / 1000).toFixed(0)}K株` : "-"}</p>
              <p>• {interpretVolumeCycle(stock.volume_cycle_state)}</p>
            </AnalysisSection>

            <AnalysisSection title="【上がり切りではない理由】" color="text-emerald-400">
              <p>• 25MA乖離率: <strong className={`${(stock.ma25_deviation ?? 0) > 0.5 ? "text-red-400" : "text-emerald-300"}`}>{fmtPct(stock.ma25_deviation)}</strong></p>
              <p>• チャートサイクル: {stock.chart_cycle_state}</p>
              <p>• {interpretUpcycleStatus(stock.ma25_deviation ?? 0, stock.chart_cycle_state)}</p>
            </AnalysisSection>

            <AnalysisSection title="【理想の狙い方 (分析条件として)】" color="text-blue-400">
              <p>• 仕込みポイント: 支持線付近 ({fmtPrice(stock.support_line)}) または抵抗線ブレイク後</p>
              <p>• ブレイク条件: 抵抗線 ({fmtPrice(stock.resistance_line)}) 突破・出来高増加</p>
              <p>• 損切りライン: 支持線割れ ({fmtPrice(stock.support_line)})</p>
              <p className="text-yellow-400 text-xs mt-1">※ これは売買推奨ではなく、分析条件として参考にしてください。</p>
            </AnalysisSection>

            <AnalysisSection title="【反証】" color="text-red-400">
              <p>• 支持線 ({fmtPrice(stock.support_line)}) を割り込んだ場合</p>
              <p>• 25MA乖離が+50%を超えた場合</p>
              <p>• 高値圏で大商い＋上ヒゲが出た場合</p>
              {stock.warning_flags?.split(",").filter(Boolean).map((flag) => (
                <p key={flag} className="text-yellow-400">⚠ {flag}</p>
              ))}
            </AnalysisSection>

            <div className="bg-slate-900 rounded p-3 text-xs text-slate-400 border border-slate-700">
              <strong className="text-slate-300">【最終コメント】</strong><br />
              {stock.ai_comment}
            </div>

            <div className="text-xs text-amber-300 bg-amber-900/20 border border-amber-700/30 rounded p-3">
              ⚠ この分析は投資助言ではなく、短期急騰パターンの分析・学習目的です。最終的な売買判断はユーザー自身が行う前提です。
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Score Breakdown */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h2 className="text-sm font-bold text-white mb-3">スコア内訳</h2>
            <div className="space-y-2">
              {scoreBreakdown.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-white font-mono">{(item.score ?? 0).toFixed(0)}/{item.max}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${((item.score ?? 0) / item.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-700 flex justify-between">
                <span className="text-slate-300 font-semibold text-sm">合計</span>
                <span className={`font-bold font-mono ${
                  stock.total_score >= 85 ? "text-emerald-400" :
                  stock.total_score >= 75 ? "text-blue-400" : "text-yellow-400"
                }`}>{stock.total_score.toFixed(0)}/100</span>
              </div>
            </div>
          </div>

          {/* Technical Data */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h2 className="text-sm font-bold text-white mb-3">テクニカルデータ</h2>
            <dl className="space-y-2 text-xs">
              {[
                ["5日移動平均", fmtPrice(stock.ma5)],
                ["25日移動平均", fmtPrice(stock.ma25)],
                ["75日移動平均", fmtPrice(stock.ma75)],
                ["200日移動平均", fmtPrice(stock.ma200)],
                ["25MA乖離率", fmtPct(stock.ma25_deviation)],
                ["直近高値(20日)", fmtPrice(stock.recent_high_20)],
                ["直近安値(20日)", fmtPrice(stock.recent_low_20)],
                ["支持線", fmtPrice(stock.support_line)],
                ["抵抗線", fmtPrice(stock.resistance_line)],
                ["上値余地", fmtPct(stock.upside_to_resistance)],
                ["支持線距離", fmtPct(stock.support_distance)],
                ["5日変化率", fmtPct(stock.price_change_5d)],
                ["20日変化率", fmtPct(stock.price_change_20d)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-slate-400">{label}</dt>
                  <dd className="text-white font-mono">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* AAR Button */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h2 className="text-sm font-bold text-white mb-3">AAR出力</h2>
            <button
              onClick={loadAAR}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-sm font-medium transition-colors"
            >
              AARメモを生成する
            </button>
            {aarText && (
              <div className="mt-3">
                <pre className="text-xs text-slate-300 bg-slate-900 rounded p-3 overflow-auto max-h-96 whitespace-pre-wrap">
                  {aarText}
                </pre>
                <button
                  onClick={() => navigator.clipboard.writeText(aarText)}
                  className="mt-2 w-full bg-slate-700 hover:bg-slate-600 text-white py-1.5 rounded text-xs"
                >
                  コピー
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalysisSection({ title, children, color }: { title: string; children: React.ReactNode; color: string }) {
  return (
    <div>
      <h3 className={`text-xs font-bold ${color} mb-1.5`}>{title}</h3>
      <div className="text-xs text-slate-300 space-y-0.5 pl-2">{children}</div>
    </div>
  );
}

function interpretCandle(state: string): string {
  const map: Record<string, string> = {
    "大陽線": "強い買い圧力。上昇継続の可能性あり。",
    "大陰線": "強い売り圧力。警戒が必要。",
    "下ヒゲ反転": "下値を試した後に買い戻し。反転サインの可能性。",
    "上ヒゲ失速": "上値を試した後に売り圧力。天井注意。",
    "大商い上ヒゲ": "高値圏での失速。天井大商い警戒。",
    "十字線": "買いと売りが拮抗。方向感待ち。",
    "コマ": "値幅が小さい。方向感なし。",
    "陽線": "小幅な上昇。継続確認が必要。",
    "陰線": "小幅な下落。継続確認が必要。",
  };
  return map[state] || "判定中。詳細は個別に確認してください。";
}

function interpretVolumeCycle(state: string): string {
  const map: Record<string, string> = {
    "再点火開始": "売り枯れ後に出来高が再増加。急騰予兆として最も注目すべき状態。",
    "再点火待ち": "売り枯れ後、抵抗線に接近中。点火前夜の可能性。",
    "売り枯れ": "出来高が激減し、売り圧力が低下。底値固めの可能性。",
    "価格維持": "出来高が減っても価格が崩れない。需給が改善されている可能性。",
    "先行大商い": "出来高急増後。材料消化・勢力交代の可能性。",
    "天井大商い警戒": "高値圏での大商い。天井の可能性が高い。要注意。",
    "出来高不足": "流動性が低い。スプレッドリスクに注意。",
    "人気離散": "出来高と価格が共に低下。トレンド崩れの可能性。",
  };
  return map[state] || "出来高サイクルの判定中。";
}

function interpretUpcycleStatus(deviation: number, chartCycle: string): string {
  if (deviation > 0.8) return "25MA乖離が+80%超。過熱状態で上がり切りリスクが高い。";
  if (deviation > 0.5) return "25MA乖離が+50%超。過熱気味。押し目を確認してから検討。";
  if (chartCycle === "上がり切り") return "チャートサイクルが上がり切りと判定。慎重に検討。";
  if (chartCycle === "初動後押し目") return "初動後の押し目。チャートサイクルは良好。";
  if (chartCycle === "再点火待ち") return "再点火待ち。抵抗線ブレイクで上値余地あり。";
  return "25MA乖離は許容範囲内。現時点では上がり切りの兆候は限定的。";
}
