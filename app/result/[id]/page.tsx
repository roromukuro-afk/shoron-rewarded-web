"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase-browser";

function sumBreakdown(b: any) {
  if (!b) return 0;
  return ["A", "B", "C", "D", "E", "F"].reduce((s, k) => s + Number(b?.[k] ?? 0), 0);
}

function scoreLabel(score: number) {
  if (score >= 80) return "かなり良い";
  if (score >= 65) return "良好";
  if (score >= 50) return "基礎はある";
  if (score >= 35) return "改善余地あり";
  return "要改善";
}

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [msg, setMsg] = useState("読み込み中…");
  const [data, setData] = useState<any>(null);

  const [regradeMsg, setRegradeMsg] = useState("");
  const [needBuy, setNeedBuy] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [regrading, setRegrading] = useState(false);

  const load = async () => {
    if (!id) {
      setMsg("❌ idが取れませんでした（URLを確認してください）");
      return;
    }

    try {
      const u = await supabaseBrowser.auth.getUser();
      setUserEmail(u.data.user?.email ?? "");

      const { data } = await supabaseBrowser.auth.getSession();
      const token = data.session?.access_token;

      const res = await fetch(`/api/result/${id}`, {
        method: "GET",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const out = await res.json();
      if (!res.ok) {
        setMsg(`❌ 取得失敗：${out?.error ?? res.status}`);
        return;
      }

      setData(out);
      setMsg("");
    } catch (e: any) {
      setMsg(`❌ 通信エラー：${e?.message ?? "unknown"}`);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const grading = data?.grading;
  const rj = grading?.result_json ?? {};
  const plan = (rj?._plan ?? "free") as string;
  const isFreeResult = plan !== "pro";

  const breakdown = rj.breakdown ?? null;
  const deductions = Array.isArray(rj.deductions) ? rj.deductions : [];
  const fatal = rj.fatal ?? {};
  const essay = data?.essay;

  const strengths = Array.isArray(rj.strengths) ? rj.strengths : [];
  const issues = Array.isArray(rj.issues) ? rj.issues : [];
  const nextActions = Array.isArray(rj.next_actions) ? rj.next_actions : [];

  const score = Number(grading?.score ?? 0);
  const calcScore = useMemo(() => sumBreakdown(breakdown), [breakdown]);

  const fatalList = [
    ["論点ズレ（設問に未回答）", !!fatal.question_mismatch],
    ["結論なし", !!fatal.no_conclusion],
    ["論理の飛躍", !!fatal.logic_gap],
    ["文中矛盾", !!fatal.contradiction],
    ["条件違反", !!fatal.constraint_violation],
  ].filter(([, v]) => v);

  const previewStrengths = strengths.slice(0, 2);
  const previewIssues = issues.slice(0, 2);
  const previewNextActions = nextActions.slice(0, 2);

  const regrade = async () => {
    setNeedBuy(false);
    setRegrading(true);
    setRegradeMsg("詳細添削を実行中…");

    try {
      const { data } = await supabaseBrowser.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setRegradeMsg("❌ 詳細添削はログインが必要です（/login）");
        setRegrading(false);
        return;
      }

      const res = await fetch("/api/regrade", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ essayId: Number(id) }),
      });

      const out = await res.json();
      if (!res.ok) {
        if (out?.error === "insufficient_pro") {
          setRegradeMsg(
            `❌ Pro不足：残高=${out.proBalance} / 必要=${out.cost} / 足りない=${out.needed}\n→ 料金ページからProを追加できます。`
          );
          setNeedBuy(true);
          setRegrading(false);
          return;
        }

        if (out?.error === "already_regraded") {
          setRegradeMsg("⚠️ すでに詳細添削済みです。更新して確認してください。");
          setRegrading(false);
          return;
        }

        setRegradeMsg(`❌ 失敗：${out?.detail ?? out?.error ?? res.status}`);
        setRegrading(false);
        return;
      }

      setRegradeMsg("✅ 詳細添削が完了しました。更新します…");
      await load();
      setRegradeMsg("");
    } catch (e: any) {
      setRegradeMsg(`❌ 通信エラー：${e?.message ?? "unknown"}`);
    } finally {
      setRegrading(false);
    }
  };

  if (msg) {
    return (
      <main>
        <div className="container">
          <section style={{ padding: "40px 0 12px" }}>
            <div className="page-eyebrow">小論設計室｜結果</div>
            <h1 className="page-title">採点結果</h1>
            <div className="card" style={{ marginTop: 18 }}>
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg}</p>
              <div className="button-row" style={{ marginTop: 16 }}>
                <Link href="/dashboard" className="button-secondary">
                  ダッシュボードへ
                </Link>
                <Link href="/submit" className="button-primary">
                  もう一度投稿する
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

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
              <div className="page-eyebrow">
                小論設計室｜{isFreeResult ? "無料診断" : "詳細添削"}
              </div>

              <h1 className="page-title">
                {isFreeResult ? "無料診断の結果" : "詳細添削の結果"}
              </h1>

              <p className="page-lead">
                {isFreeResult
                  ? "まずは現在の答案の状態を確認し、次に直すべきポイントを把握できます。"
                  : "減点根拠や内訳まで含めて、より詳しく答案を確認できます。"}
              </p>

              <div
                className="card"
                style={{
                  marginTop: 20,
                  background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, color: "var(--muted)", fontWeight: 700 }}>
                      現在のスコア
                    </div>
                    <div style={{ fontSize: 44, fontWeight: 900, marginTop: 6 }}>
                      {score}
                      <span style={{ fontSize: 22 }}>/100</span>
                    </div>
                    <div style={{ marginTop: 6, fontWeight: 800 }}>{scoreLabel(score)}</div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        background: "#fff",
                        border: "1px solid var(--line)",
                        borderRadius: 999,
                        padding: "8px 12px",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      mode: {data?.mode}
                    </span>
                    <span
                      style={{
                        background: "#fff",
                        border: "1px solid var(--line)",
                        borderRadius: 999,
                        padding: "8px 12px",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {isFreeResult ? "無料診断" : "詳細添削"}
                    </span>
                    <span
                      style={{
                        background: "#fff",
                        border: "1px solid var(--line)",
                        borderRadius: 999,
                        padding: "8px 12px",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {essay?.char_count ?? "?"}字
                    </span>
                  </div>
                </div>

                {rj.summary && (
                  <div
                    style={{
                      marginTop: 18,
                      padding: 14,
                      borderRadius: 14,
                      border: "1px solid var(--line)",
                      background: "#fff",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>要約</div>
                    <p style={{ marginTop: 10 }}>{rj.summary}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="card">
                <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700 }}>
                  まず見るポイント
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                  {[
                    ["良い点", `${strengths.length}件`, "今の答案で機能している部分"],
                    ["改善点", `${issues.length}件`, "次に直すべき優先ポイント"],
                    ["次にやること", `${nextActions.length}件`, "次回の書き直しの方向性"],
                  ].map(([title, num, desc]) => (
                    <div
                      key={title}
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        border: "1px solid var(--line)",
                        background: "#fff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "center",
                        }}
                      >
                        <div style={{ fontWeight: 900 }}>{title}</div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--accent)",
                            background: "var(--accent-soft)",
                            padding: "4px 8px",
                            borderRadius: 999,
                            fontWeight: 900,
                          }}
                        >
                          {num}
                        </div>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 14, color: "var(--muted)" }}>{desc}</div>
                    </div>
                  ))}
                </div>

                {isFreeResult && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: 14,
                      borderRadius: 14,
                      background: "#111827",
                      color: "#fff",
                    }}
                  >
                    <div style={{ fontSize: 13, opacity: 0.75 }}>もっと詳しく見るには</div>
                    <div style={{ marginTop: 6, fontWeight: 800 }}>
                      詳細添削に進むと、減点根拠・項目別内訳・致命的ミスまで確認できます。
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>
            {isFreeResult ? "無料診断で分かること" : "今回の診断内容"}
          </h2>

          <div
            className="card-grid"
            style={{
              marginTop: 18,
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            }}
          >
            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 18 }}>良い点</div>
              {previewStrengths.length === 0 ? (
                <p style={{ marginTop: 10 }} className="muted">
                  まだ抽出されていません。
                </p>
              ) : (
                <ul style={{ marginTop: 10, paddingLeft: 20 }}>
                  {previewStrengths.map((x: string, i: number) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 18 }}>改善点</div>
              {previewIssues.length === 0 ? (
                <p style={{ marginTop: 10 }} className="muted">
                  まだ抽出されていません。
                </p>
              ) : (
                <ul style={{ marginTop: 10, paddingLeft: 20 }}>
                  {previewIssues.map((x: string, i: number) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card">
              <div style={{ fontWeight: 900, fontSize: 18 }}>次にやること</div>
              {previewNextActions.length === 0 ? (
                <p style={{ marginTop: 10 }} className="muted">
                  まだ抽出されていません。
                </p>
              ) : (
                <ol style={{ marginTop: 10, paddingLeft: 20 }}>
                  {previewNextActions.map((x: string, i: number) => (
                    <li key={i}>{x}</li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </section>

        {isFreeResult ? (
          <>
            <hr className="divider" />

            <section className="section">
              <h2 style={{ fontSize: 26, fontWeight: 900 }}>詳細添削で見られる内容</h2>

              <div
                className="card"
                style={{
                  marginTop: 18,
                  background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                }}
              >
                <div
                  className="card-grid"
                  style={{
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
                    <div style={{ fontWeight: 900 }}>項目別内訳</div>
                    <div style={{ marginTop: 8, fontSize: 14, color: "var(--muted)" }}>
                      設問対応、論理、構成、根拠、日本語、条件遵守を細かく確認
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
                    <div style={{ fontWeight: 900 }}>減点根拠一覧</div>
                    <div style={{ marginTop: 8, fontSize: 14, color: "var(--muted)" }}>
                      どこがなぜ減点になったかを理由つきで確認
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
                    <div style={{ fontWeight: 900 }}>致命的ミスチェック</div>
                    <div style={{ marginTop: 8, fontSize: 14, color: "var(--muted)" }}>
                      論点ズレ・結論不足・論理飛躍などを判定
                    </div>
                  </div>
                </div>

                <div className="button-row" style={{ marginTop: 20 }}>
                  <button
                    onClick={regrade}
                    disabled={regrading}
                    className="button-primary"
                    style={{ opacity: regrading ? 0.75 : 1 }}
                  >
                    {regrading ? "実行中…" : "詳細添削に進む"}
                  </button>

                  {needBuy && (
                    <Link href="/billing" className="button-secondary">
                      Proを追加する
                    </Link>
                  )}

                  {!userEmail && (
                    <Link href="/login" className="button-secondary">
                      ログインして使う
                    </Link>
                  )}
                </div>

                {regradeMsg && (
                  <pre
                    style={{
                      marginTop: 16,
                      whiteSpace: "pre-wrap",
                      background: "#fff",
                      border: "1px solid var(--line)",
                      borderRadius: 12,
                      padding: 14,
                    }}
                  >
                    {regradeMsg}
                  </pre>
                )}
              </div>
            </section>
          </>
        ) : (
          <>
            <hr className="divider" />

            {breakdown && (
              <section className="section">
                <h2 style={{ fontSize: 26, fontWeight: 900 }}>項目別内訳</h2>

                <div
                  className="card-grid"
                  style={{
                    marginTop: 18,
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  }}
                >
                  {[
                    ["A 設問への回答", `${breakdown.A}/30`],
                    ["B 論理", `${breakdown.B}/25`],
                    ["C 構成", `${breakdown.C}/15`],
                    ["D 根拠・具体例", `${breakdown.D}/15`],
                    ["E 日本語", `${breakdown.E}/10`],
                    ["F 条件遵守", `${breakdown.F}/5`],
                  ].map(([label, value]) => (
                    <div key={label} className="card">
                      <div style={{ fontWeight: 900 }}>{label}</div>
                      <div style={{ marginTop: 10, fontSize: 26, fontWeight: 900 }}>{value}</div>
                    </div>
                  ))}
                </div>

                <div className="card" style={{ marginTop: 18 }}>
                  <div style={{ fontWeight: 900 }}>検算（内訳合計）</div>
                  <div style={{ marginTop: 8 }}>{calcScore}/100</div>
                </div>
              </section>
            )}

            <hr className="divider" />

            <section className="section">
              <h2 style={{ fontSize: 26, fontWeight: 900 }}>減点一覧（根拠つき）</h2>

              {deductions.length === 0 ? (
                <div className="card" style={{ marginTop: 18 }}>
                  <p className="muted" style={{ margin: 0 }}>
                    減点一覧はありません。
                  </p>
                </div>
              ) : (
                <div className="card-grid" style={{ marginTop: 18 }}>
                  {deductions.map((d: any, i: number) => (
                    <div key={i} className="card">
                      <div style={{ fontWeight: 900 }}>
                        [−{d.points}点] {d.category}
                      </div>
                      <p style={{ marginTop: 10 }}>{d.reason}</p>

                      {d.quote ? (
                        <div
                          style={{
                            marginTop: 12,
                            padding: 12,
                            borderRadius: 12,
                            background: "#f9fafb",
                            border: "1px solid var(--line)",
                            fontSize: 14,
                          }}
                        >
                          根拠：「{d.quote}」
                        </div>
                      ) : (
                        <div className="muted" style={{ marginTop: 12, fontSize: 14 }}>
                          根拠：引用なし
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <hr className="divider" />

            <section className="section">
              <h2 style={{ fontSize: 26, fontWeight: 900 }}>致命的ミスチェック</h2>

              <div className="card" style={{ marginTop: 18 }}>
                {fatalList.length === 0 ? (
                  <p style={{ margin: 0 }}>✅ 該当なし</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {fatalList.map(([label], i) => (
                      <li key={i}>⚠️ {label}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </>
        )}

        <hr className="divider" />

        <section className="section">
          <h2 style={{ fontSize: 26, fontWeight: 900 }}>本文</h2>

          <div className="card" style={{ marginTop: 18 }}>
            <div className="muted" style={{ fontSize: 13 }}>
              {essay?.char_count ?? "?"}字
            </div>
            <pre style={{ whiteSpace: "pre-wrap", marginTop: 10, fontFamily: "inherit" }}>
              {essay?.essay_text ?? ""}
            </pre>
          </div>
        </section>

        <hr className="divider" />

        <div className="button-row">
          <Link href="/submit" className="button-primary">
            もう一度投稿する
          </Link>
          <Link href="/dashboard" className="button-secondary">
            ダッシュボードへ
          </Link>
          <Link href="/guide" className="button-secondary">
            学習ガイドを見る
          </Link>
        </div>
      </div>
    </main>
  );
}