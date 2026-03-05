// app/api/_store.ts
type Store = {
  balance: number;
  claimed: Record<string, boolean>;
};

declare global {
  // eslint-disable-next-line no-var
  var __ticketStore: Store | undefined;
}

export function getStore(): Store {
  if (!globalThis.__ticketStore) {
    globalThis.__ticketStore = { balance: 0, claimed: {} };
  }
  return globalThis.__ticketStore;
}

export function getTokyoDateKey(): string {
  // 例: 2026-03-03 (Asia/Tokyo基準)
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const d = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${y}-${m}-${d}`;
}