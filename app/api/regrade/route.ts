// app/api/regrade/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../_supabase";

const MODEL_PRO = "gpt-5-mini";
const MAX_OUTPUT_TOKENS = 1600;

// 配点（合計100）
const CATEGORY_MAX = { A: 30, B: 25, C: 15, D: 15, E: 10, F: 5 } as const;

function calcUnits(charCount: number) {
  return Math.max(1, Math.ceil(charCount / 400));
}

async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

async function callOpenAIProGrade(args: {
  question: string;
  constraints: string;
  essayText: string;
  charCount: number;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const system = [
    "あなたは大学受験の小論文の採点官。",
    "100点満点で厳しめに採点し、減点根拠を具体的に示す。",
    "本文に書かれていない事実を勝手に足さない。",
    "quote（引用）は本文から短く抜き出す（最大25文字程度）。無理なら空文字。",
    `配点：A=${CATEGORY_MAX.A}, B=${CATEGORY_MAX.B}, C=${CATEGORY_MAX.C}, D=${CATEGORY_MAX.D}, E=${CATEGORY_MAX.E}, F=${CATEGORY_MAX.F}（合計100）`,
    "A:設問への回答 / B:論理 / C:構成 / D:根拠・具体例 / E:日本語 / F:条件遵守",
    "Pro（厳密）：deductions最大20。next_actionsは必ず3個。",
    "出力は必ずJSON（スキーマ厳守）。余計な文章は禁止。",
  ].join("\n");

  const user = [
    `【設問】\n${args.question}`,
    `【条件】\n${args.constraints}`,
    `【本文（${args.charCount}字）】\n${args.essayText}`,
  ].join("\n\n");

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["score", "summary", "strengths", "issues", "next_actions", "breakdown", "deductions", "fatal"],
    properties: {
      score: { type: "integer", minimum: 0, maximum: 100 },
      summary: { type: "string", minLength: 1, maxLength: 800 },
      strengths: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
      issues: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 10 },
      next_actions: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
      breakdown: {
        type: "object",
        additionalProperties: false,
        required: ["A", "B", "C", "D", "E", "F"],
        properties: {
          A: { type: "integer", minimum: 0, maximum: CATEGORY_MAX.A },
          B: { type: "integer", minimum: 0, maximum: CATEGORY_MAX.B },
          C: { type: "integer", minimum: 0, maximum: CATEGORY_MAX.C },
          D: { type: "integer", minimum: 0, maximum: CATEGORY_MAX.D },
          E: { type: "integer", minimum: 0, maximum: CATEGORY_MAX.E },
          F: { type: "integer", minimum: 0, maximum: CATEGORY_MAX.F },
        },
      },
      deductions: {
        type: "array",
        maxItems: 20,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["category", "points", "reason", "quote"],
          properties: {
            category: { type: "string", enum: ["A", "B", "C", "D", "E", "F"] },
            points: { type: "integer", minimum: 1, maximum: 30 },
            reason: { type: "string", minLength: 1, maxLength: 220 },
            quote: { type: "string", maxLength: 50 },
          },
        },
      },
      fatal: {
        type: "object",
        additionalProperties: false,
        required: ["question_mismatch", "no_conclusion", "logic_gap", "contradiction", "constraint_violation"],
        properties: {
          question_mismatch: { type: "boolean" },
          no_conclusion: { type: "boolean" },
          logic_gap: { type: "boolean" },
          contradiction: { type: "boolean" },
          constraint_violation: { type: "boolean" },
        },
      },
    },
  };

  const body = {
    model: MODEL_PRO,
    input: [
      { role: "system", content: [{ type: "input_text", text: system }] },
      { role: "user", content: [{ type: "input_text", text: user }] },
    ],
    temperature: 0.2,
    max_output_tokens: MAX_OUTPUT_TOKENS,
    text: {
      format: { type: "json_schema", name: "essay_grade_pro_v1", strict: true, schema },
    },
    store: false,
  };

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "openai_error");

  const outputText: string =
    data.output_text ??
    (data.output ?? [])
      .flatMap((x: any) => x.content ?? [])
      .filter((c: any) => c.type === "output_text")
      .map((c: any) => c.text)
      .join("");

  return JSON.parse(outputText);
}

function sanitize(grade: any) {
  const b = grade?.breakdown ?? {};
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const breakdown = {
    A: clamp(Number(b.A ?? 0), 0, CATEGORY_MAX.A),
    B: clamp(Number(b.B ?? 0), 0, CATEGORY_MAX.B),
    C: clamp(Number(b.C ?? 0), 0, CATEGORY_MAX.C),
    D: clamp(Number(b.D ?? 0), 0, CATEGORY_MAX.D),
    E: clamp(Number(b.E ?? 0), 0, CATEGORY_MAX.E),
    F: clamp(Number(b.F ?? 0), 0, CATEGORY_MAX.F),
  };
  const score = breakdown.A + breakdown.B + breakdown.C + breakdown.D + breakdown.E + breakdown.F;

  return {
    score,
    summary: String(grade?.summary ?? "（採点結果）"),
    strengths: Array.isArray(grade?.strengths) ? grade.strengths.slice(0, 5).map(String) : ["提出できています。"],
    issues: Array.isArray(grade?.issues) ? grade.issues.slice(0, 10).map(String) : ["改善点が見つかりませんでした。"],
    next_actions:
      Array.isArray(grade?.next_actions) && grade.next_actions.length >= 3
        ? grade.next_actions.slice(0, 3).map(String)
        : ["結論を1文で明確にする。", "理由→具体例を補強する。", "段落構成を整える。"],
    breakdown,
    deductions: Array.isArray(grade?.deductions) ? grade.deductions.slice(0, 20) : [],
    fatal: {
      question_mismatch: Boolean(grade?.fatal?.question_mismatch),
      no_conclusion: Boolean(grade?.fatal?.no_conclusion),
      logic_gap: Boolean(grade?.fatal?.logic_gap),
      contradiction: Boolean(grade?.fatal?.contradiction),
      constraint_violation: Boolean(grade?.fatal?.constraint_violation),
    },
    _plan: "pro",
    _source: "regrade",
  };
}

export async function POST(req: NextRequest) {
  // Pro再採点は「ログインユーザーのみ」にする（収益＆不正防止）
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const essayId = Number(body?.essayId);
  if (!Number.isFinite(essayId) || essayId <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_essay_id" }, { status: 400 });
  }

  // 本人のessayだけ取得
  const { data: essay, error: e1 } = await supabaseAdmin
    .from("essays")
    .select("id, user_id, question, constraints, essay_text, char_count, request_id")
    .eq("id", essayId)
    .eq("user_id", userId)
    .maybeSingle();

  if (e1) return NextResponse.json({ ok: false, error: "db_error", detail: e1.message }, { status: 500 });
  if (!essay) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const units = calcUnits(essay.char_count);
  const cost = units * 2; // Pro厳密＝2×ceil(chars/400)

  // すでにPro regrade済みなら弾く（1答案1回）
  const { data: existingPro } = await supabaseAdmin
    .from("grading_results")
    .select("id")
    .eq("essay_id", essayId)
    .contains("result_json", { _plan: "pro", _source: "regrade" })
    .limit(1);

  if (existingPro && existingPro.length > 0) {
    return NextResponse.json({ ok: false, error: "already_regraded" }, { status: 409 });
  }

  // Pro残高チェック
  const { data: rows, error: e2 } = await supabaseAdmin
    .from("ticket_ledger")
    .select("delta")
    .eq("user_id", userId)
    .eq("ticket_type", "pro");

  if (e2) return NextResponse.json({ ok: false, error: "db_error", detail: e2.message }, { status: 500 });

  const proBalance = (rows ?? []).reduce((s, r: any) => s + (r.delta ?? 0), 0);
  if (proBalance < cost) {
    return NextResponse.json(
      { ok: false, error: "insufficient_pro", proBalance, cost, needed: cost - proBalance },
      { status: 402 }
    );
  }

  // Pro消費（event_keyで二重防止）
  const consumeKey = `regrade_pro_${essay.request_id}`;
  const { error: consumeErr } = await supabaseAdmin.from("ticket_ledger").insert({
    user_id: userId,
    delta: -cost,
    reason: "regrade_pro",
    event_key: consumeKey,
    ticket_type: "pro",
  });

  if (consumeErr) {
    const code = (consumeErr as any).code;
    if (code === "23505") {
      return NextResponse.json({ ok: false, error: "already_consumed" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "db_error", detail: consumeErr.message }, { status: 500 });
  }

  // AI Pro採点
  let grade: any;
  try {
    const ai = await callOpenAIProGrade({
      question: essay.question,
      constraints: essay.constraints,
      essayText: essay.essay_text,
      charCount: essay.char_count,
    });
    grade = sanitize(ai);
  } catch (e: any) {
    // 失敗時は返金
    const refundKey = `refund_${consumeKey}`;
    await supabaseAdmin.from("ticket_ledger").insert({
      user_id: userId,
      delta: cost,
      reason: "refund_regrade_failed",
      event_key: refundKey,
      ticket_type: "pro",
    });

    return NextResponse.json({ ok: false, error: "ai_failed", detail: e?.message ?? "unknown" }, { status: 500 });
  }

  // 結果保存
  const { error: e3 } = await supabaseAdmin.from("grading_results").insert({
    essay_id: essayId,
    score: Number(grade.score ?? 0),
    result_json: grade,
  });

  if (e3) {
    // 保存失敗時も返金
    const refundKey = `refund_${consumeKey}`;
    await supabaseAdmin.from("ticket_ledger").insert({
      user_id: userId,
      delta: cost,
      reason: "refund_regrade_store_failed",
      event_key: refundKey,
      ticket_type: "pro",
    });

    return NextResponse.json({ ok: false, error: "db_error", detail: e3.message }, { status: 500 });
  }

  // 最新のPro残高も返す
  return NextResponse.json({ ok: true, essayId, cost, newProBalance: proBalance - cost });
}