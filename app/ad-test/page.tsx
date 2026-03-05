// app/ad-test/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdTestPage() {
  const [msg, setMsg] = useState<string>("");

  const claim = async () => {
    setMsg("送信中…");

    try {
      const res = await fetch("/api/reward", {
        method: "POST",
        credentials: "include", // ← 念のため（cookie確実に）
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        // JSONじゃない場合も、そのまま表示する
      }

      if (res.ok) {
        setMsg(`✅ 付与成功！ 現在のチケット：${data?.balance ?? "?"}`);
        return;
      }

      // 409（重複）= 今日の1回制限に引っかかった可能性が高い
      if (res.status === 409 || data?.reason === "already_claimed_today") {
        setMsg("⚠️ 今日はもう受け取り済み（テスト仕様で1日1回）");
        return;
      }

      // それ以外は「何が起きたか」をそのまま出す
      setMsg(
        `⚠️ 付与に失敗：status=${res.status} / ${data?.detail ?? data?.error ?? text}`
      );
    } catch (e: any) {
      setMsg(`⚠️ 通信エラー：${e?.message ?? "unknown"}`);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>広告→チケット付与（テスト）</h1>

      <p style={{ marginTop: 12, lineHeight: 1.7 }}>
        これは広告なしで「付与API」が動くか確認するページです。
      </p>

      <button
        onClick={claim}
        style={{
          marginTop: 16,
          padding: "12px 16px",
          borderRadius: 10,
          border: "1px solid #ccc",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        （テスト）付与する → チケット+1
      </button>

      <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{msg}</p>

      <div style={{ marginTop: 18 }}>
        <Link href="/dashboard">→ 残高を見る（dashboard）</Link>
      </div>
    </main>
  );
}