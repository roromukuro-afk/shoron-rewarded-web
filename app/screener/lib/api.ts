const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchAPI(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  health: () => fetchAPI("/api/health"),
  dashboard: () => fetchAPI("/api/dashboard"),
  universe: (market: string, includeAdr: boolean) =>
    fetchAPI(`/api/universe?market=${market}&include_adr=${includeAdr}`),
  runScreening: (config: object) =>
    fetchAPI("/api/screening/run", {
      method: "POST",
      body: JSON.stringify(config),
    }),
  getProgress: () => fetchAPI("/api/screening/progress"),
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
    return fetch(`${API_BASE}/api/exclusions/upload`, {
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
    return `${API_BASE}/api/export/csv?${qs}`;
  },
  exportExcel: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return `${API_BASE}/api/export/excel?${qs}`;
  },
  runBacktest: (symbols: string[]) =>
    fetchAPI("/api/backtest/run", {
      method: "POST",
      body: JSON.stringify({ symbols }),
    }),
  getBacktestResults: () => fetchAPI("/api/backtest/results"),
};
