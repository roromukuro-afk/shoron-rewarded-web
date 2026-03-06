"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase-browser";
import AdSenseUnit from "../../components/AdSenseUnit";

function sumBreakdown(b: any) {
  if (!b) return 0;
  return ["A", "B", "C", "D", "E", "F"].reduce((s, k) => s + Number(b?.[k] ?? 0), 0);
}

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [msg, setMsg] = useState("読み込み中…");
  const [data, setData] = useState<any>(null);

  const [regradeMsg, setRegradeMsg] = useState("");
  const [needBuy, setNeedBuy] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const load = async () => {
    if (!id) {
      setMsg("❌ idが取れませんでした（URLを確認してね）");
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

  const score = Number(grading?.score ?? 0);
  const calcScore = useMemo(() => sumBreakdown(breakdown), [breakdown]);

  const fatalList = [
    ["論点ズレ（設問に未回答）", !!fatal.question_mismatch],
    ["結論なし", !!fatal.no_conclusion],
    ["論理の飛躍", !!fatal.logic_gap],
    ["文中矛盾", !!fatal.contradiction],
    ["条件違反", !!fatal.constraint_violation],
  ].filter(([, v]) => v);

  const regrade = async () => {
    setNeedBuy(false);
    setRegradeMsg("Pro再採点中…");

    try {
      const { data } = await supabaseBrowser.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setRegradeMsg("❌ Pro再採点はログインが必要です（/login）");
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
            `❌ Pro不足：残高=${out.proBalance} / 必要=${out.cost} / 足りない=${out.needed}\n→ 購入ページへ進んでProを増やせます。`
          );
          setNeedBuy(true);
          return;
        }
        if (out?.error === "already_regraded") {
          setRegradeMsg("⚠️ すでにPro再採点済みです。更新して確認してね。");
          return;
        }
        setRegradeMsg(`❌ 失敗：${out?.detail ?? out?.error ?? res.status}`);
        return;
      }

      setRegradeMsg("✅ Pro再採点完了！更新します…");
      await load();
      setRegradeMsg("");
    } catch (e: any) {
      setRegradeMsg(`❌ 通信エラー：${e?.message ?? "unknown"}`);
    }
  };

  if (msg) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>結果</h1>
        <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{msg}</p>
        <div style={{ marginTop: 12 }}>
          <Link href="/dashboard">→ ダッシュボードへ</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 980 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>採点結果（{isFreeResult ? "Free" : "Pro"}）</h1>

      <p style={{ marginTop: 10 }}>
        点数：<b style={{ fontSize: 26 }}>{score}</b>/100
        <span style={{ marginLeft: 12, opacity: 0.7 }}>mode: {data?.mode}</span>
      </p>

      {isFreeResult && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #f0c", borderRadius: 10 }}>
          <div style={{ fontWeight: 900 }}>Proで再採点（厳密）</div>
          <p style={{ marginTop: 6, lineHeight: 1.7 }}>
            より厳密な減点根拠・内訳で再採点します（Proチケット消費）。
            {userEmail ? "" : " ※ログインが必要です。"}
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <button
              onClick={regrade}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #ccc",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              Proで再採点
            </button>

            {needBuy && (
              <Link
                href="/billing"
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #ccc",
                  fontWeight: 900,
                }}
              >
                Proを購入する
              </Link>
            )}
          </div>

          {regradeMsg && <pre style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>{regradeMsg}</pre>}

          {/* ✅ Free結果ページに広告枠を表示（審査通過後、slot差し替え） */}
          <AdSenseUnit
            client="ca-pub-5148247638505100"
            slot="1234567890"
            format="auto"
          />
        </div>
      )}

      {breakdown && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
          <div style={{ fontWeight: 900 }}>項目別（合計=100）</div>
          <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
            <div>A 設問への回答：<b>{breakdown.A}</b>/30</div>
            <div>B 論理：<b>{breakdown.B}</b>/25</div>
            <div>C 構成：<b>{breakdown.C}</b>/15</div>
            <div>D 根拠・具体例：<b>{breakdown.D}</b>/15</div>
            <div>E 日本語：<b>{breakdown.E}</b>/10</div>
            <div>F 条件遵守：<b>{breakdown.F}</b>/5</div>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>検算（内訳合計）：{calcScore}/100</div>
        </div>
      )}

      <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
        <div style={{ fontWeight: 900 }}>要約</div>
        <div style={{ marginTop: 6 }}>{rj.summary ?? "（なし）"}</div>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
          <div style={{ fontWeight: 900 }}>良い点</div>
          <ul>
            {(rj.strengths ?? []).map((x: string, i: number) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>

        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
          <div style={{ fontWeight: 900 }}>課題</div>
          <ul>
            {(rj.issues ?? []).map((x: string, i: number) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>

        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
          <div style={{ fontWeight: 900 }}>次にやること（TOP3）</div>
          <ol>
            {(rj.next_actions ?? []).map((x: string, i: number) => (
              <li key={i}>{x}</li>
            ))}
          </ol>
        </div>
      </div>

      <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
        <div style={{ fontWeight: 900 }}>減点一覧（根拠つき）</div>
        {deductions.length === 0 ? (
          <p style={{ marginTop: 8, opacity: 0.8 }}>（なし）</p>
        ) : (
          <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
            {deductions.map((d: any, i: number) => (
              <div key={i} style={{ padding: 10, border: "1px solid #eee", borderRadius: 10 }}>
                <div style={{ fontWeight: 800 }}>
                  [−{d.points}点] {d.category}：{d.reason}
                </div>
                {d.quote ? (
                  <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>根拠：「{d.quote}」</div>
                ) : (
                  <div style={{ marginTop: 6, fontSize: 13, opacity: 0.6 }}>根拠：引用なし</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
        <div style={{ fontWeight: 900 }}>致命的ミスチェック</div>
        {fatalList.length === 0 ? (
          <p style={{ marginTop: 8 }}>✅ 該当なし</p>
        ) : (
          <ul style={{ marginTop: 8 }}>
            {fatalList.map(([label], i) => (
              <li key={i}>⚠️ {label}</li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
        <div style={{ fontWeight: 900 }}>本文（{essay?.char_count ?? "?"}字）</div>
        <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{essay?.essay_text ?? ""}</pre>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/submit">→ もう一度投稿</Link>
        <Link href="/dashboard">→ ダッシュボードへ</Link>
      </div>
    </main>
  );
}