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
          <div className="hero-grid">
            <div>
              <div className="page-eyebrow">小論設計室｜無料診断</div>
              <h1 className="page-title">小論文を投稿する</h1>
              <p className="page-lead">
                まずは無料診断として、点数・要約・改善点を確認できます。
              </p>

              <p style={{ marginTop: 12 }}>
                完璧な文章でなくても大丈夫です。まずは1本書いてみて、
                どこを直せばよいかを確認するのがいちばん早いです。
              </p>

              <div className="card" style={{ marginTop: 20 }}>
                <div style={{ display: "grid", gap: 18 }}>
                  <label className="form-label">
                    <div className="form-label-text">設問</div>
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      rows={4}
                      className="form-textarea"
                    />
                  </label>

                  <label className="form-label">
                    <div className="form-label-text">条件</div>
                    <textarea
                      value={constraints}
                      onChange={(e) => setConstraints(e.target.value)}
                      rows={3}
                      className="form-textarea"
                    />
                  </label>

                  <label className="form-label">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <div className="form-label-text">本文</div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {charCount}字
                      </div>
                    </div>

                    <textarea
                      value={essayText}
                      onChange={(e) => setEssayText(e.target.value)}
                      rows={14}
                      placeholder="ここに小論文本文を入力してください。"
                      className="form-textarea"
                    />
                    <div className="form-help">
                      まずは最後まで書き切ることを優先すると改善しやすいです。
                    </div>
                  </label>
                </div>

                <div className="button-row">
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

                {msg && <pre className="status-box">{msg}</pre>}
              </div>
            </div>

            <div>
              <div className="soft-panel">
                <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700 }}>
                  投稿の流れ
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                  {[
                    ["1", "本文を入力", "設問・条件・小論文本文を入れる"],
                    ["2", "無料診断を確認", "点数・要約・改善点をチェックする"],
                    ["3", "必要なら次へ進む", "学習ガイドや詳細添削につなげる"],
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

                <div className="dark-panel">
                  <div className="dark-panel-title">投稿のコツ</div>
                  <div className="dark-panel-body">
                    まずは結論を決めて、理由を1〜2個に絞ると書きやすくなります。
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>入力前のチェック</div>
                <ul style={{ marginTop: 10, paddingLeft: 20 }}>
                  <li>自分の立場が決まっているか</li>
                  <li>理由が具体的になっているか</li>
                  <li>最後を一文で締められそうか</li>
                  <li>字数条件を大きく外れていないか</li>
                </ul>

                <div className="button-row">
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