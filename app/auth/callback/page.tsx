"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase-browser";

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState("認証処理中…");
  const [debug, setDebug] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const fullUrl = window.location.href;
        const url = new URL(fullUrl);

        // ① PKCE: ?code=...
        const code = url.searchParams.get("code");

        // ② token_hash方式: ?token_hash=...&type=signup|magiclink|recovery...
        const tokenHash =
          url.searchParams.get("token_hash") ||
          url.searchParams.get("token") || // 念のため
          "";
        const type = url.searchParams.get("type") || "";

        // ③ queryにaccess_token/refresh_tokenが付く方式（念のため）
        const qAccess = url.searchParams.get("access_token");
        const qRefresh = url.searchParams.get("refresh_token");

        // ④ hashにaccess_token/refresh_tokenが付く方式（念のため）
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const hAccess = hash.get("access_token");
        const hRefresh = hash.get("refresh_token");

        setDebug(
          `URL: ${fullUrl}\n` +
            `code: ${code ? "YES" : "NO"}\n` +
            `token_hash: ${tokenHash ? "YES" : "NO"}\n` +
            `type: ${type || "(none)"}\n` +
            `query access_token: ${qAccess ? "YES" : "NO"}\n` +
            `hash access_token: ${hAccess ? "YES" : "NO"}\n`
        );

        // --- ここからセッション確立 ---
        if (code) {
          setMsg("code をセッションに交換中…");
          const { error } = await supabaseBrowser.auth.exchangeCodeForSession(code);
          if (error) {
            setMsg(`❌ セッション交換失敗：${error.message}`);
            return;
          }
        } else if (tokenHash && type) {
          setMsg("token_hash を検証中…");
          const { error } = await supabaseBrowser.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
          });
          if (error) {
            setMsg(`❌ token_hash検証失敗：${error.message}`);
            return;
          }
        } else if (qAccess && qRefresh) {
          setMsg("queryトークンでセッション作成中…");
          const { error } = await supabaseBrowser.auth.setSession({
            access_token: qAccess,
            refresh_token: qRefresh,
          });
          if (error) {
            setMsg(`❌ セッション設定失敗：${error.message}`);
            return;
          }
        } else if (hAccess && hRefresh) {
          setMsg("hashトークンでセッション作成中…");
          const { error } = await supabaseBrowser.auth.setSession({
            access_token: hAccess,
            refresh_token: hRefresh,
          });
          if (error) {
            setMsg(`❌ セッション設定失敗：${error.message}`);
            return;
          }
        }

        // セッション確認
        const { data } = await supabaseBrowser.auth.getSession();
        const token = data.session?.access_token;

        if (!token) {
          setMsg("❌ ログインできてないみたい（トークン無し）");
          return;
        }

        // ✅ 匿名チケット → ログインユーザーへ引き継ぎ
        setMsg("引き継ぎ中…");
        const res = await fetch("/api/migrate", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        const m = await res.json();
        if (!res.ok) {
          setMsg(`❌ 引き継ぎ失敗：${m?.detail ?? m?.error ?? res.status}`);
          return;
        }

        setMsg("✅ ログイン完了！ダッシュボードへ移動します…");
        window.location.href = "/dashboard";
      } catch (e: any) {
        setMsg(`❌ 例外：${e?.message ?? "unknown"}`);
      }
    };

    run();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>認証処理</h1>
      <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{msg}</p>

      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: "pointer" }}>デバッグ情報（困ったときだけ）</summary>
        <pre style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{debug}</pre>
      </details>
    </main>
  );
}