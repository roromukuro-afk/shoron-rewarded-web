"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { supabaseBrowser } from "../lib/supabase-browser";

declare global {
  interface Window {
    googletag?: any;
  }
}

type Mode = "auth" | "linked" | "anon" | "";

export default function RewardedPage() {
  const [status, setStatus] = useState<string>("GPT読み込み待ち…");
  const [canShow, setCanShow] = useState<boolean>(false);

  // 端末の「ログイン」状態（メールログインしたか）
  const [userEmail, setUserEmail] = useState<string>("");

  // 端末の「連動」状態（auth/linked/anon）
  const [mode, setMode] = useState<Mode>("");

  const slotRef = useRef<any>(null);
  const readyEventRef = useRef<any>(null);
  const initializedRef = useRef<boolean>(false);

  const refreshIdentity = async () => {
    // ログイン状態（メール）
    const u = await supabaseBrowser.auth.getUser();
    setUserEmail(u.data.user?.email ?? "");

    // 連動状態（サーバーが判定：auth/linked/anon）
    const { data: s } = await supabaseBrowser.auth.getSession();
    const token = s.session?.access_token;

    const res = await fetch("/api/balance", {
      method: "GET",
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const out = await res.json();
    setMode(out?.mode ?? "");
  };

  useEffect(() => {
    refreshIdentity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initIfNeeded = () => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    window.googletag = window.googletag || { cmd: [] };

    window.googletag.cmd.push(() => {
      const googletag = window.googletag;

      googletag.pubads().addEventListener("rewardedSlotReady", (event: any) => {
        if (slotRef.current && event.slot === slotRef.current) {
          readyEventRef.current = event;
          setCanShow(true);
          setStatus("✅ 広告の準備OK！「広告を見る（再生）」を押してね");
        }
      });

      googletag.pubads().addEventListener("rewardedSlotGranted", async (event: any) => {
        if (slotRef.current && event.slot === slotRef.current) {
          setStatus("🎁 視聴完了！チケット付与中…");

          try {
            // ログインしてるなら token を付ける（auth扱いになる）
            const { data } = await supabaseBrowser.auth.getSession();
            const token = data.session?.access_token;

            const res = await fetch("/api/reward", {
              method: "POST",
              credentials: "include",
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            const out = await res.json();

            if (res.ok) {
              setStatus(
                `✅ チケット+1完了！ 現在のチケット：${out.balance}（mode=${out.mode ?? "?"}）`
              );
              // 付与後、表示上のmodeも更新
              await refreshIdentity();
            } else if (out?.reason === "missing_nonce") {
              setStatus("⚠️ nonceが無い（先に「広告を読み込む」を押してね）");
            } else if (out?.reason === "already_claimed") {
              setStatus("⚠️ すでに受け取り済み（二重付与は不可）");
            } else {
              setStatus(`⚠️ 付与に失敗：${out?.detail ?? out?.error ?? res.status}`);
            }
          } catch {
            setStatus("⚠️ 通信エラー（/api/reward）");
          }
        }
      });

      googletag.pubads().addEventListener("rewardedSlotClosed", (event: any) => {
        if (slotRef.current && event.slot === slotRef.current) {
          setCanShow(false);
          readyEventRef.current = null;
          setStatus("広告を閉じました。もう一回やるなら「広告を読み込む」から。");

          try {
            googletag.destroySlots([slotRef.current]);
          } catch {}
          slotRef.current = null;
        }
      });

      googletag.enableServices();
      setStatus("GPT準備OK。下の「広告を読み込む」を押してね");
    });
  };

  const requestRewarded = async () => {
    setStatus("準備中…（視聴1回ぶんのトークン発行）");
    setCanShow(false);
    readyEventRef.current = null;

    // 連動状態も最新化（/link 入力直後など）
    await refreshIdentity();

    // 視聴1回ぶんのnonce発行（cookieに入る）
    try {
      const startRes = await fetch("/api/reward/start", {
        method: "POST",
        credentials: "include",
      });
      const startData = await startRes.json();
      if (!startRes.ok || !startData?.ok) {
        setStatus(`❌ start失敗：${startData?.error ?? startRes.status}`);
        return;
      }
    } catch {
      setStatus("❌ start通信エラー（/api/reward/start）");
      return;
    }

    initIfNeeded();

    window.googletag.cmd.push(() => {
      const googletag = window.googletag;

      if (slotRef.current) {
        try {
          googletag.destroySlots([slotRef.current]);
        } catch {}
        slotRef.current = null;
      }

      const slot = googletag.defineOutOfPageSlot(
        "/22639388115/rewarded_web_example",
        googletag.enums.OutOfPageFormat.REWARDED
      );

      if (!slot) {
        setStatus("❌ この環境では報酬型広告が作れません（スマホで開くと成功しやすい）");
        return;
      }

      slotRef.current = slot;
      slot.addService(googletag.pubads());

      googletag.display(slot);
      setStatus("広告を探しています…（少し待つことがあります）");
    });
  };

  const showRewarded = () => {
    const ev = readyEventRef.current;
    if (!ev) {
      setStatus("まだ広告の準備ができてないよ。先に「広告を読み込む」を押してね");
      return;
    }
    setStatus("再生中…（終わるまで待ってね）");
    ev.makeRewardedVisible();
  };

  const modeLabel =
    mode === "auth"
      ? "ログイン連動（auth）"
      : mode === "linked"
      ? "ペアリング連動（linked）"
      : mode === "anon"
      ? "未連動（anon）"
      : "判定中…";

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <Script
        async
        src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
        strategy="afterInteractive"
        onLoad={() => initIfNeeded()}
      />

      <h1 style={{ fontSize: 24, fontWeight: 700 }}>報酬型（動画）広告</h1>

      <p style={{ marginTop: 10 }}>
        この端末の状態：
        <br />
        ・ログイン（メール）： <b>{userEmail ? userEmail : "未ログイン"}</b>
        <br />
        ・連動モード： <b>{modeLabel}</b>
      </p>

      {mode === "anon" && (
        <p style={{ marginTop: 8 }}>
          PCと連動させたいなら、先に <Link href="/link">/link</Link> で6桁コードを入力してね。
        </p>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <button
          onClick={requestRewarded}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #ccc",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          広告を読み込む
        </button>

        <button
          onClick={showRewarded}
          disabled={!canShow}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #ccc",
            cursor: canShow ? "pointer" : "not-allowed",
            fontWeight: 700,
            opacity: canShow ? 1 : 0.5,
          }}
        >
          広告を見る（再生）
        </button>

        <button
          onClick={refreshIdentity}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #ccc",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          状態を更新
        </button>
      </div>

      <p style={{ marginTop: 12 }}>{status}</p>

      <div style={{ marginTop: 18 }}>
        <Link href="/dashboard">→ 残高を見る（dashboard）</Link>
      </div>
    </main>
  );
}