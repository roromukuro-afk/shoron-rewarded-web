"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../lib/supabase-browser";

export default function SubmitPage() {
  const router = useRouter();

  const [question, setQuestion] = useState(
    "AIの活用は今後の学習に必要である。あなたの考えを述べなさい。"
  );
  const [constraints, setConstraints] = useState(
    "200〜400字程度で、自分の立場と理由を明確に述べること。"
  );
  const [essayText, setEssayText] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const charCount = useMemo(() => essayText.length, [essayText]);

  const onSubmit = async () => {
    if (!essayText.trim()) {
      setMsg("❌ 本文を入力してください。");
      return;
    }

    setSending(true);
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
        setSending(false);
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
    } finally {
      setSending(false);
    }
  };

  return (
    <main>
      <div className="container">
        <section style={{ padding: "40px 0 12px" }}>
          <div
            style={{
              display: "grid",
              gap: 24,
              gridTemplateColumns: "1.1fr 0.9fr",
              alignItems: "start",
            }}
          >
            <div>
              <div className="page-eyebrow">小論設計室｜無料診断</div>
              <h1 className="page-title">小論文を投稿する</h1>
              <p className="page-lead">
                小論文を投稿すると、点数・要約・良い点・改善点を確認できます。
              </p>

              <p style={{ marginTop: 12 }}>
                まずは無料診断として現在の課題を把握し、必要に応じて学習ガイドや詳細添削につなげるのがおすすめです。
              </p>

              <div className="card" style={{ marginTop: 20 }}>
                <div style={{ display: "grid", gap: 18 }}>
                  <label>
                    <div style={{ fontWeight: 900, fontSize: 15 }}>設問</div>
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      rows={4}
                      style={{
                        width: "100%",
                        marginTop: 10,
                        padding: 14,
                        borderRadius: 12,
                        border: "1px solid var(--line)",
                        fontSize: 15,
                        background: "#fff",
                      }}
                    />
                  </label>

                  <label>
                    <div style={{ fontWeight: 900, fontSize: 15 }}>条件</div>
                    <textarea
                      value={constraints}
                      onChange={(e) => setConstraints(e.target.value)}
                      rows={3}
                      style={{
                        width: "100%",
                        marginTop: 10,
                        padding: 14,
                        borderRadius: 12,
                        border: "1px solid var(--line)",
                        fontSize: 15,
                        background: "#fff",
                      }}
                    />
                  </label>

                  <label>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ fontWeight: 900, fontSize: 15 }}>本文</span>
                      <span className="muted" style={{ fontSize: 13 }}>
                        {charCount}字
                      </span>
                    </div>

                    <textarea
                      value={essayText}
                      onChange={(e) => setEssayText(e.target.value)}
                      rows={14}
                      placeholder="ここに小論文本文を入力してください。"
                      style={{
                        width: "100%",
                        marginTop: 10,
                        padding: 14,
                        borderRadius: 12,
                        border: "1px solid var(--line)",
                        fontSize: 15,
                        background: "#fff",
                      }}
                    />
                  </label>
                </div>

                <div className="button-row" style={{ marginTop: 20 }}>
                  <button
                    onClick={onSubmit}
                    disabled={sending}
                    className="button-primary"
                    style={{ opacity: sending ? 0.75 : 1 }}
                  >
                    {sending ? "送信中…" : "この内容で送信する"}
                  </button>

                  <Link href="/guide" className="button-secondary">
                    学習ガイドを見る
                  </Link>

                  <Link href="/dashboard" className="button-secondary">
                    ダッシュボードへ
                  </Link>
                </div>

                {msg && (
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
                    {msg}
                  </pre>
                )}
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
                  投稿の流れ
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                  {[
                    ["1", "本文を入力", "設問・条件・小論文本文を入力します。"],
                    ["2", "無料診断を確認", "点数・要約・改善点をチェックします。"],
                    ["3", "必要なら次へ進む", "学習ガイドや詳細添削につなげます。"],
                  ].map(([num, title, desc]) => (
                    <div
                      key={num}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "40px 1fr",
                        gap: 12,
                        alignItems: "start",
                        padding: 12,
                        borderRadius: 14,
                        border: "1px solid var(--line)",
                        background: "#fff",
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 999,
                          background: "var(--accent-soft)",
                          color: "var(--accent)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                        }}
                      >
                        {num}
                      </div>
                      <div>
                        <div style={{ fontWeight: 900 }}>{title}</div>
                        <div style={{ marginTop: 4, fontSize: 14, color: "var(--muted)" }}>
                          {desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 16,
                    padding: 14,
                    borderRadius: 14,
                    background: "#111827",
                    color: "#fff",
                  }}
                >
                  <div style={{ fontSize: 13, opacity: 0.75 }}>ポイント</div>
                  <div style={{ marginTop: 6, fontWeight: 800 }}>
                    まずは完璧を目指すより、1本書いて改善点を確認するのがおすすめです。
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>入力前のコツ</div>
                <ul style={{ marginTop: 10, paddingLeft: 20 }}>
                  <li>最初に自分の結論を決める</li>
                  <li>理由は1〜2個に絞る</li>
                  <li>短い具体例を入れる</li>
                  <li>最後は一文で締める</li>
                </ul>

                <div className="button-row" style={{ marginTop: 14 }}>
                  <Link href="/guide/essay-structure" className="button-secondary">
                    基本構成を読む
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}