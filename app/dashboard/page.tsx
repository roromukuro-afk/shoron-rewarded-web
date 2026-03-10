"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "../lib/supabase-browser";

type BillingPlan = "none" | "basic" | "plus" | "unknown";

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");

  const [freeBalance, setFreeBalance] = useState<number | null>(null);
  const [proBalance, setProBalance] = useState<number | null>(null);
  const [mode, setMode] = useState("");

  const [msg, setMsg] = useState("");
  const [pairCode, setPairCode] = useState("");
  const [pairExp, setPairExp] = useState("");

  const [items, setItems] = useState<any[]>([]);

  const [adminSecret, setAdminSecret] = useState("");
  const [grantAmount, setGrantAmount] = useState("40");
  const [grantMsg, setGrantMsg] = useState("");

  const [billingPlan, setBillingPlan] = useState<BillingPlan>("none");
  const [billingStatus, setBillingStatus] = useState("(未取得)");
  const [billingPeriodEnd, setBillingPeriodEnd] = useState("");
  const [billingMsg, setBillingMsg] = useState("");

  const [purchaseBanner, setPurchaseBanner] = useState("");

  const siteOrigin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const refreshUser = async () => {
    const u = await supabaseBrowser.auth.getUser();
    setUserEmail(u.data.user?.email ?? "");
    setUserId(u.data.user?.id ?? "");
  };

  const getToken = async () => {
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token ?? "";
  };

  const loadBalance = async () => {
    const token = await getToken();
    const res = await fetch("/api/balance", {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });

    const b = await res.json();
    setFreeBalance(b.freeBalance ?? 0);
    setProBalance(b.proBalance ?? 0);
    setMode(b.mode ?? "");
  };

  const loadHistory = async () => {
    const token = await getToken();
    const res = await fetch("/api/essays", {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });

    const out = await res.json();
    if (!res.ok) {
      setMsg(`❌ 履歴取得失敗：${out?.detail ?? out?.error ?? res.status}`);
      return;
    }
    setItems(out.items ?? []);
  };

  const loadBilling = async () => {
    setBillingMsg("");
    const token = await getToken();

    if (!token) {
      setBillingPlan("none");
      setBillingStatus("未ログイン");
      setBillingPeriodEnd("");
      return;
    }

    const res = await fetch("/api/billing/status", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });

    const out = await res.json();
    if (!res.ok) {
      setBillingMsg(`⚠️ 契約情報の取得失敗：${out?.detail ?? out?.error ?? res.status}`);
      return;
    }

    const plan = (out.plan ?? "none") as BillingPlan;
    setBillingPlan(plan);
    setBillingStatus(out.subscription?.status ?? "none");
    setBillingPeriodEnd(out.subscription?.current_period_end ?? "");
  };

  const loadAll = async () => {
    setMsg("読み込み中…");
    await Promise.all([refreshUser(), loadBalance(), loadHistory(), loadBilling()]);
    setMsg("");
  };

  const logout = async () => {
    await supabaseBrowser.auth.signOut();
    setUserEmail("");
    setUserId("");
    setPairCode("");
    setPairExp("");
    await loadAll();
  };

  const createPairCode = async () => {
    setMsg("コード発行中…");
    const token = await getToken();

    if (!token) {
      setMsg("❌ ログインしてから発行してください。");
      return;
    }

    const res = await fetch("/api/link/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });

    const out = await res.json();

    if (!res.ok) {
      setMsg(`❌ 発行失敗：${out?.error ?? res.status}`);
      return;
    }

    setPairCode(out.code);
    setPairExp(out.expiresAt);
    setMsg("✅ コードを発行しました。");
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMsg("✅ コピーしました");
      setTimeout(() => setMsg(""), 1000);
    } catch {
      setMsg("⚠️ コピーできませんでした");
      setTimeout(() => setMsg(""), 1200);
    }
  };

  const grantPro = async () => {
    setGrantMsg("付与中…");

    try {
      if (!userId) {
        setGrantMsg("❌ user_id がありません。ログインしてください。");
        return;
      }

      const amount = Number(grantAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setGrantMsg("❌ amount が不正です。");
        return;
      }

      const res = await fetch("/api/admin/grant-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ secret: adminSecret, userId, amount }),
      });

      const out = await res.json();
      if (!res.ok) {
        setGrantMsg(`❌ 失敗：${out?.detail ?? out?.error ?? res.status}`);
        return;
      }

      setGrantMsg(`✅ Pro +${out.added} を付与しました`);
      await loadBalance();
    } catch (e: any) {
      setGrantMsg(`❌ 通信エラー：${e?.message ?? "unknown"}`);
    }
  };

  const openPortal = async () => {
    setBillingMsg("管理画面を開いています…");

    try {
      const token = await getToken();
      if (!token) {
        setBillingMsg("❌ ログインが必要です");
        return;
      }

      const res = await fetch("/api/billing/stripe/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      const out = await res.json();
      if (!res.ok) {
        setBillingMsg(`❌ 失敗：${out?.detail ?? out?.error ?? res.status}`);
        return;
      }

      window.location.href = out.url;
    } catch (e: any) {
      setBillingMsg(`❌ 通信エラー：${e?.message ?? "unknown"}`);
    }
  };

  const planLabel = useMemo(() => {
    if (billingPlan === "basic") return "Basic（500円/月）";
    if (billingPlan === "plus") return "Plus（960円/月）";
    if (billingPlan === "unknown") return "Unknown（設定外）";
    return "未契約";
  }, [billingPlan]);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sp = new URLSearchParams(window.location.search);
    const billing = sp.get("billing");

    if (billing === "success") {
      setPurchaseBanner(
        "✅ 購入ありがとうございます。Proチケット反映まで少し時間がかかる場合があります。必要なら「更新」を押してください。"
      );
      (async () => {
        await loadBilling();
        await loadBalance();
      })();
    } else if (billing === "cancel") {
      setPurchaseBanner("⚠️ 購入がキャンセルされました。必要ならもう一度お試しください。");
    } else {
      return;
    }

    try {
      sp.delete("billing");
      const newUrl = `${window.location.pathname}${sp.toString() ? `?${sp.toString()}` : ""}`;
      window.history.replaceState({}, "", newUrl);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main>
      <div className="container">
        <section style={{ padding: "40px 0 12px" }}>
          <div
            style={{
              display: "grid",
              gap: 24,
              gridTemplateColumns: "1.15fr 0.85fr",
              alignItems: "start",
            }}
          >
            <div>
              <div className="page-eyebrow">小論設計室｜ダッシュボード</div>
              <h1 className="page-title">ダッシュボード</h1>
              <p className="page-lead">
                投稿履歴、チケット残高、契約状況をまとめて確認できます。
              </p>

              <p style={{ marginTop: 12 }}>
                小論文の継続学習をしやすくするために、利用状況をここでまとめて管理できます。
              </p>

              {purchaseBanner && (
                <div
                  className="card"
                  style={{
                    marginTop: 18,
                    border: "1px solid #b7e4c7",
                    background: "#f0fdf4",
                  }}
                >
                  {purchaseBanner}
                </div>
              )}

              <div className="card" style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>アカウント情報</div>

                <div style={{ marginTop: 12 }}>
                  ログイン： <b>{userEmail || "未ログイン"}</b>
                  <span style={{ marginLeft: 12 }} className="muted">
                    mode: {mode}
                  </span>
                </div>

                <div style={{ marginTop: 8 }}>
                  user_id：{" "}
                  <b style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                    {userId || "（なし）"}
                  </b>
                  {userId && (
                    <button
                      onClick={() => copy(userId)}
                      className="button-secondary"
                      style={{ marginLeft: 10, padding: "8px 12px" }}
                    >
                      コピー
                    </button>
                  )}
                </div>

                <div
                  className="card-grid"
                  style={{
                    marginTop: 16,
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  }}
                >
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      border: "1px solid var(--line)",
                      background: "#fff",
                    }}
                  >
                    <div className="muted" style={{ fontSize: 13 }}>
                      Free
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4 }}>
                      {freeBalance === null ? "…" : freeBalance}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      border: "1px solid var(--line)",
                      background: "#fff",
                    }}
                  >
                    <div className="muted" style={{ fontSize: 13 }}>
                      Pro
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4 }}>
                      {proBalance === null ? "…" : proBalance}
                    </div>
                  </div>
                </div>

                <div className="button-row" style={{ marginTop: 18 }}>
                  <button onClick={loadAll} className="button-primary">
                    更新する
                  </button>
                  <Link href="/submit" className="button-secondary">
                    小論文を投稿
                  </Link>
                  <Link href="/billing" className="button-secondary">
                    料金プラン
                  </Link>
                  {!userEmail ? (
                    <Link href="/login" className="button-secondary">
                      ログイン
                    </Link>
                  ) : (
                    <button onClick={logout} className="button-secondary">
                      ログアウト
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div
                className="card"
                style={{
                  background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                }}
              >
                <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700 }}>
                  次にやること
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                  {[
                    ["無料診断を試す", "まだ投稿が少ないなら、まずは1本書いてみる"],
                    ["学習ガイドを読む", "構成や失敗例を読んでから再挑戦する"],
                    ["必要ならプラン確認", "詳しく改善したいときはProも検討する"],
                  ].map(([title, desc]) => (
                    <div
                      key={title}
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        border: "1px solid var(--line)",
                        background: "#fff",
                      }}
                    >
                      <div style={{ fontWeight: 900 }}>{title}</div>
                      <div style={{ marginTop: 6, fontSize: 14, color: "var(--muted)" }}>
                        {desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>スマホ連動</div>
                <p style={{ marginTop: 10 }}>
                  PCでコードを発行し、スマホで <b>/link</b> を開いて入力すると連動できます。
                </p>

                <div className="button-row" style={{ marginTop: 14 }}>
                  <button onClick={createPairCode} className="button-secondary">
                    6桁コード発行
                  </button>
                </div>

                <p style={{ marginTop: 10, fontSize: 14 }} className="muted">
                  スマホで開くURL：{siteOrigin}/link
                </p>

                {pairCode && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: 14,
                      borderRadius: 14,
                      border: "1px solid var(--line)",
                      background: "#fff",
                    }}
                  >
                    <div className="muted" style={{ fontSize: 13 }}>
                      スマホで入力するコード
                    </div>
                    <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 4, marginTop: 6 }}>
                      {pairCode}
                    </div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                      有効期限：{pairExp}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>契約状況</h2>

          <div className="card" style={{ marginTop: 18 }}>
            <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <div>
                <div className="muted" style={{ fontSize: 13 }}>
                  プラン
                </div>
                <div style={{ fontWeight: 900, fontSize: 20, marginTop: 4 }}>{planLabel}</div>
              </div>

              <div>
                <div className="muted" style={{ fontSize: 13 }}>
                  状態
                </div>
                <div style={{ fontWeight: 900, fontSize: 20, marginTop: 4 }}>{billingStatus}</div>
              </div>

              <div>
                <div className="muted" style={{ fontSize: 13 }}>
                  期限
                </div>
                <div style={{ fontWeight: 900, fontSize: 16, marginTop: 6 }}>
                  {billingPeriodEnd || "未取得"}
                </div>
              </div>
            </div>

            <div className="button-row" style={{ marginTop: 18 }}>
              <button onClick={loadBilling} className="button-secondary">
                契約状況を更新
              </button>

              {billingPlan !== "none" && (
                <button onClick={openPortal} className="button-primary">
                  プラン変更 / 解約
                </button>
              )}
            </div>

            {billingMsg && (
              <pre
                style={{
                  marginTop: 16,
                  whiteSpace: "pre-wrap",
                  background: "#f9fafb",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                {billingMsg}
              </pre>
            )}
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>提出履歴</h2>

          {items.length === 0 ? (
            <div className="card" style={{ marginTop: 18 }}>
              <p className="muted">まだ投稿がありません。まずは1本書いてみましょう。</p>
              <div className="button-row" style={{ marginTop: 14 }}>
                <Link href="/submit" className="button-primary">
                  小論文を投稿する
                </Link>
              </div>
            </div>
          ) : (
            <div className="card-grid" style={{ marginTop: 18 }}>
              {items.map((it) => (
                <div key={it.id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 900 }}>
                      ID: {it.id} / {it.char_count}字 / score: {it.score ?? "?"}
                    </div>
                    <Link href={`/result/${it.id}`}>→ 結果を見る</Link>
                  </div>

                  <div style={{ marginTop: 8 }}>{it.question}</div>
                  <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                    {it.created_at}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>管理者用テスト機能</h2>

          <div className="card" style={{ marginTop: 18, maxWidth: 620 }}>
            <div style={{ display: "grid", gap: 14 }}>
              <label>
                <div style={{ fontWeight: 900 }}>ADMIN_SECRET</div>
                <input
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  placeholder="（.env.local の ADMIN_SECRET）"
                  style={{
                    width: "100%",
                    marginTop: 8,
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid var(--line)",
                    background: "#fff",
                  }}
                />
              </label>

              <label>
                <div style={{ fontWeight: 900 }}>付与枚数</div>
                <input
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(e.target.value.replace(/[^\d]/g, ""))}
                  style={{
                    width: 160,
                    marginTop: 8,
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid var(--line)",
                    background: "#fff",
                  }}
                />
              </label>

              <div className="button-row">
                <button onClick={grantPro} className="button-secondary">
                  Proを付与
                </button>
              </div>

              {grantMsg && (
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    background: "#f9fafb",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  {grantMsg}
                </pre>
              )}
            </div>
          </div>
        </section>

        {msg && (
          <>
            <hr className="divider" />
            <section className="section">
              <div
                className="card"
                style={{
                  background: "#f9fafb",
                }}
              >
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg}</pre>
              </div>
            </section>
          </>
        )}

        <hr className="divider" />

        <div className="button-row">
          <Link href="/guide" className="button-secondary">
            学習ガイドを見る
          </Link>
          <Link href="/rewarded" className="button-secondary">
            無料チケットを見る
          </Link>
        </div>
      </div>
    </main>
  );
}