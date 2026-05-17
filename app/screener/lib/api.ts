// 公開URL対応APIクライアント - NEXT_PUBLIC_API_BASE_URL経由
// ローカル: .env.local で http://localhost:8000 を指定
// 本番: .env.production または環境変数で 公開バックエンドURL を指定
// 未設定の場合は same-origin の /api を試みる(SSR時)

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function resolveApiBase(): string {
  if (API_BASE_URL) return API_BASE_URL.replace(/\/$/, "");
  // ブラウザ環境かつ未設定の場合は同一オリジン
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

export async function fetchAPI(path: string, options?: RequestInit) {
  const base = resolveApiBase();
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

export const api = {
  health: () => fetchAPI("/api/health"),
  status: () => fetchAPI("/api/status"),
  dashboard: () => fetchAPI("/api/dashboard"),
  universe: (market: string, includeAdr: boolean) =>
    fetchAPI(`/api/universe?market=${market}&include_adr=${includeAdr}`),
  runScreening: (config: object) =>
    fetchAPI("/api/screening/run", {
      method: "POST",
      body: JSON.stringify(config),
    }),
  getProgress: () => fetchAPI("/api/screening/progress"),
  getJobs: () => fetchAPI("/api/screening/jobs"),
  getResults: (params: Record<string, string | number | boolean>) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return fetchAPI(`/api/screening/results?${qs}`);
  },
  getStock: (symbol: string) => fetchAPI(`/api/stocks/${encodeURIComponent(symbol)}`),
  getStockChart: (symbol: string, period?: string) =>
    fetchAPI(`/api/stocks/${encodeURIComponent(symbol)}/chart?period=${period || "3mo"}`),
  getStockAAR: (symbol: string) =>
    fetchAPI(`/api/stocks/${encodeURIComponent(symbol)}/aar`),
  uploadExclusions: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${resolveApiBase()}/api/exclusions/upload`, {
      method: "POST",
      body: form,
    }).then((r) => r.json());
  },
  addExclusion: (item: object) =>
    fetchAPI("/api/exclusions", { method: "POST", body: JSON.stringify(item) }),
  addExclusionsBulk: (items: object[]) =>
    fetchAPI("/api/exclusions/bulk", { method: "POST", body: JSON.stringify(items) }),
  getExclusions: () => fetchAPI("/api/exclusions"),
  deleteExclusion: (symbol: string) =>
    fetchAPI(`/api/exclusions/${encodeURIComponent(symbol)}`, { method: "DELETE" }),
  exportCSV: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return `${resolveApiBase()}/api/export/csv?${qs}`;
  },
  exportExcel: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return `${resolveApiBase()}/api/export/excel?${qs}`;
  },
  runBacktest: (symbols: string[]) =>
    fetchAPI("/api/backtest/run", {
      method: "POST",
      body: JSON.stringify({ symbols }),
    }),
  getBacktestResults: () => fetchAPI("/api/backtest/results"),
  getSettings: () => fetchAPI("/api/settings"),
  updateSettings: (settings: object) =>
    fetchAPI("/api/settings", {
      method: "POST",
      body: JSON.stringify({ settings }),
    }),
};
