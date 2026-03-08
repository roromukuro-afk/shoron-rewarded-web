"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "../lib/supabase-browser";

type BillingPlan = "none" | "basic" | "plus" | "unknown";

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  const [freeBalance, setFreeBalance] = useState<number | null>(null);
  const [proBalance, setProBalance] = useState<number | null>(null);
  const [mode, setMode] = useState<string>("");

  const [msg, setMsg] = useState<string>("");

  const [pairCode, setPairCode] = useState<string>("");
  const [pairExp, setPairExp] = useState<string>("");

  const [items, setItems] = useState<any[]>([]);

  const [adminSecret, setAdminSecret] = useState<string>("");
  const [grantAmount, setGrantAmount] = useState<string>("40");
  const [grantMsg, setGrantMsg] = useState<string>("");

  const [billingPlan, setBillingPlan] = useState<BillingPlan>("none");
  const [billingStatus, setBillingStatus] = useState<string>("(未取得)");
  const [billingPeriodEnd, setBillingPeriodEnd] = useState<string>("");
  const [billingMsg, setBillingMsg] = useState<string>("");

  const [purchaseBanner, setPurchaseBanner] = useState<string>("");

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
      setMsg("❌ ログインしてから発行してね");
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
    setMsg("✅ コード発行OK（スマホで /link を開いて入力）");
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMsg("✅ コピーしました");
      setTimeout(() => setMsg(""), 800);
    } catch {
      setMsg("⚠️ コピーできませんでした");
      setTimeout(() => setMsg(""), 1200);
    }
  };

  const grantPro = async () => {
    setGrantMsg("付与中…");
    try {
      if (!userId) {
        setGrantMsg("❌ user_id がありません（ログインしてね）");
        return;
      }
      const amount = Number(grantAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setGrantMsg("❌ amount が不正");
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

      setGrantMsg(`✅ Pro +${out.added} 付与しました`);
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

  const planLabel =
    billingPlan === "basic"
      ? "Basic（500円/月）"
      : billingPlan === "plus"
      ? "Plus（960円/月）"
      : billingPlan === "unknown"
      ? "Unknown（設定外）"
      : "未契約";

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sp = new URLSearchParams(window.location.search);
    const billing = sp.get("billing");

    if (billing === "success") {
      setPurchaseBanner("✅ 購入ありがとうございます！Proチケットが反映されるまで数秒かかることがあります。必要なら「更新」を押してね。");
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
    <main style={{ padding: 24, maxWidth: 1050, lineHeight: 1.8 }}>
      <p style={{ fontSize: 14, opacity: 0.75, fontWeight: 700 }}>
        小論設計室
      </p>

      <h1 style={{ fontSize: 32, fontWeight: 900, marginTop: 8 }}>ダッシュボード</h1>

      <p style={{ marginTop: 12 }}>
        投稿履歴、チケット残高、契約状況を確認できるページです。
      </p>

      {purchaseBanner && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #b7e4c7", borderRadius: 10 }}>
          {purchaseBanner}
        </div>
      )}

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #eee", borderRadius: 10 }}>
        <div>
          ログイン： <b>{userEmail ? userEmail : "未ログイン"}</b>{" "}
          <span style={{ marginLeft: 12, opacity: 0.7 }}>mode: {mode}</span>
        </div>

        <div style={{ marginTop: 6 }}>
          user_id：{" "}
          <b style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
            {userId ? userId : "（なし）"}
          </b>{" "}
          {userId && (
            <button
              onClick={() => copy(userId)}
              style={{
                marginLeft: 10,
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #ccc",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              コピー
            </button>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          Free：<b style={{ fontSize: 18 }}>{freeBalance === null ? "…" : freeBalance}</b> ／
          Pro：<b style={{ fontSize: 18 }}>{proBalance === null ? "…" : proBalance}</b>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          <button
            onClick={loadAll}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ccc",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            更新
          </button>

          <Link href="/submit">→ 小論文を投稿</Link>
          <Link href="/rewarded">→ 無料チケット案内</Link>
          <Link href="/billing">→ 料金プラン</Link>

          {!userEmail ? (
            <Link href="/login">→ ログイン</Link>
          ) : (
            <button
              onClick={logout}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #ccc",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              ログアウト
            </button>
          )}
        </div>
      </div>

      <hr style={{ margin: "18px 0" }} />

      <h2 style={{ fontSize: 18, fontWeight: 900 }}>契約状況</h2>
      <div style={{ marginTop: 8, padding: 12, border: "1px solid #eee", borderRadius: 10 }}>
        <div>プラン： <b>{planLabel}</b></div>
        <div style={{ marginTop: 4 }}>状態： <b>{billingStatus}</b></div>
        {billingPeriodEnd && (
          <div style={{ marginTop: 4, fontSize: 12, opacity: 0.8 }}>
            期限（current_period_end）：{billingPeriodEnd}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
          <button
            onClick={loadBilling}
            style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ccc", fontWeight: 900, cursor: "pointer" }}
          >
            契約状況を更新
          </button>

          {billingPlan !== "none" && (
            <button
              onClick={openPortal}
              style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ccc", fontWeight: 900, cursor: "pointer" }}
            >
              プラン変更/解約（Stripe）
            </button>
          )}
        </div>

        {billingMsg && <pre style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>{billingMsg}</pre>}
      </div>

      <hr style={{ margin: "18px 0" }} />

      <h2 style={{ fontSize: 18, fontWeight: 900 }}>スマホ連動（メール不要）</h2>
      <p style={{ marginTop: 6 }}>
        PCでコード発行 → スマホで <b>/link</b> に入力 → スマホ側の利用状況をPCに反映
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
        <button
          onClick={createPairCode}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ccc",
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          6桁コード発行
        </button>

        <span style={{ fontSize: 12, opacity: 0.8 }}>
          スマホ：<b>http://192.168.128.169:3000/link</b>
        </span>
      </div>

      {pairCode && (
        <div style={{ marginTop: 10, padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
          <div style={{ fontSize: 14, opacity: 0.8 }}>スマホで入力：</div>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 4 }}>{pairCode}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>有効期限：{pairExp}</div>
        </div>
      )}

      <hr style={{ margin: "18px 0" }} />

      <h2 style={{ fontSize: 18, fontWeight: 900 }}>管理者：Pro付与（テスト用）</h2>
      <div style={{ marginTop: 10, padding: 12, border: "1px solid #eee", borderRadius: 10 }}>
        <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
          <label>
            <div style={{ fontWeight: 800 }}>ADMIN_SECRET</div>
            <input
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              placeholder="（.env.localのADMIN_SECRET）"
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
            />
          </label>

          <label>
            <div style={{ fontWeight: 800 }}>付与枚数（例：40）</div>
            <input
              value={grantAmount}
              onChange={(e) => setGrantAmount(e.target.value.replace(/[^\d]/g, ""))}
              style={{ width: 140, padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
            />
          </label>

          <button
            onClick={grantPro}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ccc",
              cursor: "pointer",
              fontWeight: 900,
              width: 200,
            }}
          >
            Proを付与
          </button>

          {grantMsg && <pre style={{ whiteSpace: "pre-wrap" }}>{grantMsg}</pre>}
        </div>
      </div>

      <hr style={{ margin: "18px 0" }} />

      <h2 style={{ fontSize: 18, fontWeight: 900 }}>提出履歴</h2>
      {items.length === 0 ? (
        <p style={{ marginTop: 8, opacity: 0.8 }}>まだ投稿がありません</p>
      ) : (
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {items.map((it) => (
            <div key={it.id} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 900 }}>
                  ID: {it.id} / {it.char_count}字 / score: {it.score ?? "?"}
                </div>
                <Link href={`/result/${it.id}`}>→ 結果を見る</Link>
              </div>
              <div style={{ marginTop: 6, opacity: 0.8 }}>{it.question}</div>
              <div style={{ marginTop: 4, fontSize: 12, opacity: 0.6 }}>{it.created_at}</div>
            </div>
          ))}
        </div>
      )}

      {msg && <pre style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{msg}</pre>}

      <hr style={{ margin: "24px 0" }} />

      <footer style={{ fontSize: 14, opacity: 0.85, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/privacy">プライバシーポリシー</Link>
        <Link href="/terms">利用規約</Link>
        <Link href="/commerce">特定商取引法に基づく表記</Link>
        <Link href="/contact">お問い合わせ</Link>
      </footer>
    </main>
  );
}