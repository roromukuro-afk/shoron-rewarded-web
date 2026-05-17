"use client";
import { useState, useEffect } from "react";
import { api, API_BASE_URL } from "../lib/api";

interface StatusData {
  environment: string;
  database: {
    backend: string;
    connected: boolean;
    error: string | null;
    url_masked: string;
  };
  allowed_origins: string[];
  yfinance_enabled: boolean;
  last_job: {
    id: number;
    status: string;
    market_scope: string;
    mode: string;
    total_count: number;
    adopted_count: number;
    conditional_count: number;
    watch_count: number;
    excluded_count: number;
    started_at: string;
    finished_at: string | null;
    error_message: string | null;
  } | null;
  last_error: {
    endpoint: string;
    error: string;
    timestamp: string;
  } | null;
}

interface Job {
  id: number;
  status: string;
  market_scope: string;
  mode: string;
  total_count: number;
  adopted_count: number;
  conditional_count: number;
  watch_count: number;
  excluded_count: number;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

export default function DeployStatusPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, j] = await Promise.all([
        api.status(),
        api.getJobs(),
      ]);
      setStatus(s);
      setJobs(j.jobs || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "接続エラー");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const StatusBadge = ({ ok, label }: { ok: boolean; label: string }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
      ok ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700/50"
         : "bg-red-900/50 text-red-300 border border-red-700/50"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-red-400"}`} />
      {label}
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">デプロイ状況</h1>
          <p className="text-slate-400 text-sm mt-1">バックエンド・DB接続状態の確認</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm transition-colors"
        >
          {loading ? "確認中..." : "再確認"}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
          <div className="text-red-300 font-bold text-sm">バックエンド接続エラー</div>
          <div className="text-red-400 text-xs mt-1">{error}</div>
          <div className="text-slate-400 text-xs mt-2">
            接続先: <code className="bg-slate-800 px-1 rounded">{API_BASE_URL || "(same-origin)"}</code>
          </div>
        </div>
      )}

      {/* Frontend config */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <h2 className="text-sm font-bold text-white mb-3">フロントエンド設定</h2>
        <dl className="space-y-2 text-xs">
          <div className="flex justify-between">
            <dt className="text-slate-400">NEXT_PUBLIC_API_BASE_URL</dt>
            <dd className="text-white font-mono">{API_BASE_URL || "(未設定 — same-origin)"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">バックエンドURL</dt>
            <dd className="text-white font-mono">{API_BASE_URL || window?.location?.origin || "-"}</dd>
          </div>
        </dl>
      </div>

      {status && (
        <>
          {/* Backend status */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
            <h2 className="text-sm font-bold text-white mb-3">バックエンド状態</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              <StatusBadge ok={true} label="API接続OK" />
              <StatusBadge ok={status.database.connected} label={`DB: ${status.database.backend}`} />
              <StatusBadge ok={status.yfinance_enabled} label="yfinance" />
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                status.environment === "production"
                  ? "bg-purple-900/50 text-purple-300 border border-purple-700/50"
                  : "bg-slate-700 text-slate-300 border border-slate-600"
              }`}>
                {status.environment}
              </span>
            </div>

            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-slate-400">環境</dt>
                <dd className="text-white">{status.environment}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">DBバックエンド</dt>
                <dd className="text-white">{status.database.backend}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">DB接続</dt>
                <dd className={status.database.connected ? "text-emerald-400" : "text-red-400"}>
                  {status.database.connected ? "接続済み" : "接続エラー"}
                </dd>
              </div>
              {status.database.url_masked && (
                <div className="flex justify-between">
                  <dt className="text-slate-400">DB URL (マスク)</dt>
                  <dd className="text-white font-mono text-xs break-all">{status.database.url_masked}</dd>
                </div>
              )}
              {status.database.error && (
                <div className="flex justify-between">
                  <dt className="text-slate-400">DBエラー</dt>
                  <dd className="text-red-400">{status.database.error}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-400">許可オリジン</dt>
                <dd className="text-white text-right">{status.allowed_origins.join(", ")}</dd>
              </div>
            </dl>
          </div>

          {/* Last job */}
          {status.last_job && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
              <h2 className="text-sm font-bold text-white mb-3">最終スクリーニングジョブ</h2>
              <dl className="space-y-2 text-xs">
                {[
                  ["ジョブID", `#${status.last_job.id}`],
                  ["ステータス", status.last_job.status],
                  ["対象市場", status.last_job.market_scope],
                  ["モード", status.last_job.mode],
                  ["処理件数", `${status.last_job.total_count}件`],
                  ["採用候補", `${status.last_job.adopted_count}件`],
                  ["条件付き", `${status.last_job.conditional_count}件`],
                  ["監視候補", `${status.last_job.watch_count}件`],
                  ["除外", `${status.last_job.excluded_count}件`],
                  ["開始時刻", status.last_job.started_at ? new Date(status.last_job.started_at).toLocaleString("ja-JP") : "-"],
                  ["完了時刻", status.last_job.finished_at ? new Date(status.last_job.finished_at).toLocaleString("ja-JP") : "未完了"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-slate-400">{label}</dt>
                    <dd className={`text-white ${label === "ステータス" ? (
                      value === "completed" ? "text-emerald-400" :
                      value === "failed" ? "text-red-400" :
                      value === "running" ? "text-yellow-400" : "text-slate-300"
                    ) : ""}`}>{value}</dd>
                  </div>
                ))}
                {status.last_job.error_message && (
                  <div className="pt-2 border-t border-slate-700">
                    <dt className="text-red-400 mb-1">エラーメッセージ</dt>
                    <dd className="text-red-300 text-xs break-all">{status.last_job.error_message}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Last error */}
          {status.last_error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-5">
              <h2 className="text-sm font-bold text-red-300 mb-3">最終エラー</h2>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-400">エンドポイント</dt>
                  <dd className="text-white font-mono">{status.last_error.endpoint}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">発生時刻</dt>
                  <dd className="text-white">{new Date(status.last_error.timestamp).toLocaleString("ja-JP")}</dd>
                </div>
                <div>
                  <dt className="text-slate-400 mb-1">エラー内容</dt>
                  <dd className="text-red-300 bg-slate-900 rounded p-2 break-all">{status.last_error.error}</dd>
                </div>
              </dl>
            </div>
          )}
        </>
      )}

      {/* Job history */}
      {jobs.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <h2 className="text-sm font-bold text-white mb-3">ジョブ履歴 (直近10件)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  {["#", "ステータス", "市場", "モード", "件数", "採用", "開始", "完了"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-slate-400 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-slate-700/50">
                    <td className="px-3 py-2 text-slate-500 font-mono">{job.id}</td>
                    <td className={`px-3 py-2 font-medium ${
                      job.status === "completed" ? "text-emerald-400" :
                      job.status === "failed" ? "text-red-400" :
                      job.status === "running" ? "text-yellow-400" : "text-slate-400"
                    }`}>{job.status}</td>
                    <td className="px-3 py-2 text-slate-300">{job.market_scope}</td>
                    <td className="px-3 py-2 text-slate-300">{job.mode}</td>
                    <td className="px-3 py-2 text-white font-mono">{job.total_count}</td>
                    <td className="px-3 py-2 text-emerald-400 font-mono">{job.adopted_count}</td>
                    <td className="px-3 py-2 text-slate-400">{job.started_at ? new Date(job.started_at).toLocaleString("ja-JP") : "-"}</td>
                    <td className="px-3 py-2 text-slate-400">{job.finished_at ? new Date(job.finished_at).toLocaleString("ja-JP") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-xs text-slate-500 bg-slate-900 border border-slate-700 rounded p-3">
        このページは管理目的のページです。デプロイ後の動作確認・障害調査にご使用ください。
      </div>
    </div>
  );
}
