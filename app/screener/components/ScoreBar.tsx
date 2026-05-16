"use client";

interface ScoreBarProps {
  score: number;
  max?: number;
  label?: string;
  showValue?: boolean;
}

export function ScoreBar({ score, max = 100, label, showValue = true }: ScoreBarProps) {
  const pct = Math.min((score / max) * 100, 100);
  const color =
    pct >= 85
      ? "bg-emerald-500"
      : pct >= 75
      ? "bg-blue-500"
      : pct >= 65
      ? "bg-yellow-500"
      : "bg-slate-500";

  return (
    <div className="w-full">
      {label && <div className="text-xs text-slate-400 mb-1">{label}</div>}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-700 rounded-full h-2">
          <div
            className={`${color} h-2 rounded-full transition-all`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {showValue && (
          <span className="text-xs text-slate-300 w-12 text-right font-mono">
            {score.toFixed(0)}/{max}
          </span>
        )}
      </div>
    </div>
  );
}

interface ClassificationBadgeProps {
  classification: string;
}

export function ClassificationBadge({ classification }: ClassificationBadgeProps) {
  const colors: Record<string, string> = {
    採用候補: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
    条件付き候補: "bg-blue-500/20 text-blue-300 border-blue-500/50",
    監視候補: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
    除外: "bg-red-500/20 text-red-300 border-red-500/50",
    非表示: "bg-slate-500/20 text-slate-400 border-slate-500/50",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded border text-xs font-medium ${
        colors[classification] || "bg-slate-700 text-slate-300 border-slate-600"
      }`}
    >
      {classification}
    </span>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export function StatCard({ title, value, sub, color = "text-white" }: StatCardProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="text-xs text-slate-400 mb-1">{title}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}
