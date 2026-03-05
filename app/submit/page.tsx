// app/submit/page.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "../lib/supabase-browser";

function randomId() {
  // ブラウザ用簡易ID（十分）
  return Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);
}

export default function SubmitPage() {
  const [question, setQuestion] = useState("あなたの意見を述べよ。");
  const [constraints, setConstraints] = useState("400字程度");
  const [essay, setEssay] = useState("");
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [msg, setMsg] = useState("");

  const charCount = essay.length;

  const units = useMemo(() => Math.max(1, Math.ceil(charCount / 400)), [charCount]);
  const cost = useMemo(() => (plan === "free" ? units * 1 : units * 2), [plan, units]);
  const ticketType = plan;

  const submit = async () => {
    setMsg("送信中…");

    try {
      const { data } = await supabaseBrowser.auth.getSession();
      const token = data.session?.access_token;

      const request_id = randomId();

      const res = await fetch("/api/submit", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question,
          constraints,
          essay_text: essay,
          plan,
          request_id,
        }),
      });

      const out = await res.json();

      if (res.ok) {
        setMsg("✅ 送信完了！結果ページへ移動します…");
        window.location.href = `/result/${out.essayId}`;
        return;
      }

      if (out?.error === "insufficient_tickets") {
        setMsg(
          `❌ チケット不足（${out.ticketType}）\n残高=${out.balance} / 必要=${out.cost} / 足りない=${out.needed}\n` +
            `広告で貯める or サブスクで補充してね。`
        );
        return;
      }

      setMsg(`❌ 失敗：${out?.detail ?? out?.error ?? res.status}`);
    } catch (e: any) {
      setMsg(`❌ 通信エラー：${e?.message ?? "unknown"}`);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 820 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>小論文を投稿</h1>

      <p style={{ marginTop: 10 }}>
        文字数：<b>{charCount}</b> / 必要チケット：<b>{cost}</b>（{ticketType}）
      </p>

      <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="radio" checked={plan === "free"} onChange={() => setPlan("free")} />
          Free（軽量）
        </label>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="radio" checked={plan === "pro"} onChange={() => setPlan("pro")} />
          Pro（厳密）
        </label>
        <span style={{ opacity: 0.7 }}>※今は採点はダミー。後でAIに差し替え。</span>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 700 }}>設問</div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          style={{ width: "100%", padding: 12, border: "1px solid #ccc", borderRadius: 10 }}
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 700 }}>条件（字数など）</div>
        <input
          value={constraints}
          onChange={(e) => setConstraints(e.target.value)}
          style={{ width: "100%", padding: 12, border: "1px solid #ccc", borderRadius: 10 }}
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 700 }}>本文</div>
        <textarea
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
          rows={14}
          style={{ width: "100%", padding: 12, border: "1px solid #ccc", borderRadius: 10 }}
          placeholder="ここに小論文を貼り付け"
        />
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={submit}
          disabled={!essay.trim()}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #ccc",
            cursor: essay.trim() ? "pointer" : "not-allowed",
            fontWeight: 800,
            opacity: essay.trim() ? 1 : 0.5,
          }}
        >
          投稿して採点（ダミー）
        </button>

        <Link href="/dashboard">→ ダッシュボードへ</Link>
      </div>

      {msg && <pre style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{msg}</pre>}
    </main>
  );
}