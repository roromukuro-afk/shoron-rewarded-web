"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../lib/supabase-browser";

export default function SubmitPage() {
  const router = useRouter();

  const [question, setQuestion] = useState("AIの活用は今後の学習に必要である。あなたの考えを述べなさい。");
  const [constraints, setConstraints] = useState("200〜400字程度で、自分の立場と理由を明確に述べること。");
  const [essayText, setEssayText] = useState("");
  const [msg, setMsg] = useState("");

  const onSubmit = async () => {
    setMsg("送信中…");

    try {
      const { data } = await supabaseBrowser.auth.getSession();
      const token = data.session?.access_token;

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          question,
          constraints,
          essayText,
          essay_text: essayText,
          text: essayText,
          body: essayText,
        }),
      });

      const out = await res.json();

      if (!res.ok) {
        setMsg(`❌ 送信失敗：${out?.detail ?? out?.error ?? res.status}`);
        return;
      }

      const resultId = out?.resultId ?? out?.essayId ?? out?.id ?? out?.essay?.id;
      if (resultId) {
        setMsg("✅ 送信完了。結果ページへ移動します…");
        router.push(`/result/${resultId}`);
        return;
      }

      setMsg("✅ 送信は完了しましたが、結果IDが見つかりませんでした。ダッシュボードから確認してください。");
    } catch (e: any) {
      setMsg(`❌ 通信エラー：${e?.message ?? "unknown"}`);
    }
  };

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24, lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>小論文を投稿する</h1>

      <p style={{ marginTop: 16 }}>
        このページでは、小論文の下書きや答案を投稿して、AIによる採点・要約・改善点のフィードバックを受けられます。
      </p>

      <p style={{ marginTop: 10 }}>
        まずは無料で投稿でき、必要に応じてPro再採点や有料プランも利用できます。
      </p>

      <hr style={{ margin: "24px 0" }} />

      <section>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>入力内容</h2>

        <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
          <label>
            <div style={{ fontWeight: 900 }}>設問</div>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                marginTop: 8,
                padding: 12,
                borderRadius: 10,
                border: "1px solid #ccc",
              }}
            />
          </label>

          <label>
            <div style={{ fontWeight: 900 }}>条件</div>
            <textarea
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                marginTop: 8,
                padding: 12,
                borderRadius: 10,
                border: "1px solid #ccc",
              }}
            />
          </label>

          <label>
            <div style={{ fontWeight: 900 }}>本文</div>
            <textarea
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              rows={14}
              placeholder="ここに小論文本文を入力してください。"
              style={{
                width: "100%",
                marginTop: 8,
                padding: 12,
                borderRadius: 10,
                border: "1px solid #ccc",
              }}
            />
          </label>
        </div>
      </section>

      <hr style={{ margin: "24px 0" }} />

      <section>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>利用の流れ</h2>
        <ol style={{ marginTop: 12, paddingLeft: 20 }}>
          <li>設問・条件・本文を入力する</li>
          <li>送信してAI採点結果を確認する</li>
          <li>必要ならPro再採点や有料プランを利用する</li>
        </ol>
      </section>

      <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={onSubmit}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #ccc",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          この内容で送信する
        </button>

        <Link href="/dashboard">→ ダッシュボードへ</Link>
      </div>

      {msg && <pre style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>{msg}</pre>}

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