// app/api/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "../_supabase";

type Plan = "free" | "pro";

// 黒字化設定：Free=ceil(chars/400)*1, Pro=ceil(chars/400)*2
const COST_PER_400 = { free: 1, pro: 2 } as const;

// モデル（Freeは安い、Proは強い）
const MODEL = {
  free: "gpt-4o-mini",
  pro: "gpt-5-mini",
} as const;

// 出力上限（コスト暴走防止）
const MAX_OUTPUT_TOKENS = {
  free: 700,
  pro: 1400,
} as const;

// 配点（合計100）
const CATEGORY_MAX = { A: 30, B: 25, C: 15, D: 15, E: 10, F: 5 } as const;

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function getAnonId(req: NextRequest) {
  const existing = req.cookies.get("anon_id")?.value;
  if (existing && isUuid(existing)) return { id: existing, isNew: false };
  return { id: randomUUID(), isNew: true };
}

async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

async function resolveUserId(req: NextRequest) {
  const authUserId = await getAuthUserId(req);
  const anon = getAnonId(req);

  let userId = authUserId ?? anon.id;
  let mode: "auth" | "linked" | "anon" = authUserId ? "auth" : "anon";

  if (!authUserId) {
    const { data: linkRow } = await supabaseAdmin
      .from("device_links")
      .select("user_id")
      .eq("anon_id", anon.id)
      .maybeSingle();

    if (linkRow?.user_id && isUuid(linkRow.user_id)) {
      userId = linkRow.user_id;
      mode = "linked";
    }
  }

  return { userId, mode, anon };
}

function calcUnits(charCount: number) {
  return Math.max(1, Math.ceil(charCount / 400));
}

/** OpenAI Responses API 呼び出し（Structured Outputs / JSON schema） */
async function callOpenAIGrade(args: {
  plan: Plan;
  question: string;
  constraints: string;
  essayText: string;
  charCount: number;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const plan = args.plan;
  const model = MODEL[plan];
  const maxOut = MAX_OUTPUT_TOKENS[plan];

  const system = [
    "あなたは大学受験の小論文の採点官。",
    "100点満点で厳しめに採点し、減点根拠を具体的に示す。",
    "本文に書かれていない事実を勝手に足さない。",
    "quote（引用）は本文から短く抜き出す（最大25文字程度）。無理なら空文字。",
    `配点：A=${CATEGORY_MAX.A}, B=${CATEGORY_MAX.B}, C=${CATEGORY_MAX.C}, D=${CATEGORY_MAX.D}, E=${CATEGORY_MAX.E}, F=${CATEGORY_MAX.F}（合計100）`,
    "A:設問に答えているか / B:論理（主張と根拠のつながり） / C:構成 / D:具体例・根拠 / E:日本語 / F:条件遵守（字数など）",
    plan === "free"
      ? "Free（軽量）：短く。strengths最大2、issues最大5、next_actionsは必ず3。deductions最大6。"
      : "Pro（厳密）：根拠を丁寧に。deductions最大12。next_actionsは必ず3。",
    "出力は必ずJSON（スキーマ厳守）。余計な文章は禁止。",
  ].join("\n");

  const user = [
    `【設問】\n${args.question}`,
    `【条件】\n${args.constraints}`,
    `【本文（${args.charCount}字）】\n${args.essayText}`,
  ].join("\n\n");

  // JSON Schema（strict）
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["score", "summary", "strengths", "issues", "next_actions", "breakdown", "deductions", "fatal"],
    properties: {
      score: { type: "integer", minimum: 0, maximum: 100 },
      summary: { type: "string", minLength: 1, maxLength: 600 },
      strengths: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
      issues: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 8 },
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
        maxItems: plan === "free" ? 6 : 12,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["category", "points", "reason", "quote"],
          properties: {
            category: { type: "string", enum: ["A", "B", "C", "D", "E", "F"] },
            points: { type: "integer", minimum: 1, maximum: 30 },
            reason: { type: "string", minLength: 1, maxLength: 200 },
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
    model,
    input: [
      { role: "system", content: [{ type: "input_text", text: system }] },
      { role: "user", content: [{ type: "input_text", text: user }] },
    ],
    temperature: 0.2,
    max_output_tokens: maxOut,
    // ここでJSON Schema強制（Structured Outputs）
    text: {
      format: {
        type: "json_schema",
        name: "essay_grade_v1",
        strict: true,
        schema,
      },
    },
    store: false,
  };

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message ?? "openai_error";
    throw new Error(msg);
  }

  const outputText: string =
    data.output_text ??
    (data.output ?? [])
      .flatMap((x: any) => x.content ?? [])
      .filter((c: any) => c.type === "output_text")
      .map((c: any) => c.text)
      .join("");

  return JSON.parse(outputText);
}

function sanitizeGrade(grade: any) {
  const b = grade?.breakdown ?? {};
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const fixedBreakdown = {
    A: clamp(Number(b.A ?? 0), 0, CATEGORY_MAX.A),
    B: clamp(Number(b.B ?? 0), 0, CATEGORY_MAX.B),
    C: clamp(Number(b.C ?? 0), 0, CATEGORY_MAX.C),
    D: clamp(Number(b.D ?? 0), 0, CATEGORY_MAX.D),
    E: clamp(Number(b.E ?? 0), 0, CATEGORY_MAX.E),
    F: clamp(Number(b.F ?? 0), 0, CATEGORY_MAX.F),
  };

  const sum =
    fixedBreakdown.A +
    fixedBreakdown.B +
    fixedBreakdown.C +
    fixedBreakdown.D +
    fixedBreakdown.E +
    fixedBreakdown.F;

  return {
    score: clamp(sum, 0, 100), // 合計を正にする（検算）
    summary: String(grade?.summary ?? "（採点結果）"),
    strengths: Array.isArray(grade?.strengths) && grade.strengths.length ? grade.strengths.slice(0, 5).map(String) : ["提出できています。"],
    issues: Array.isArray(grade?.issues) && grade.issues.length ? grade.issues.slice(0, 8).map(String) : ["改善点が見つかりませんでした（要再確認）。"],
    next_actions:
      Array.isArray(grade?.next_actions) && grade.next_actions.length >= 3
        ? grade.next_actions.slice(0, 3).map(String)
        : ["結論を1文で明確にする。", "理由→具体例を1セット追加する。", "段落を分けて読みやすくする。"],
    breakdown: fixedBreakdown,
    deductions: Array.isArray(grade?.deductions) ? grade.deductions.slice(0, 12) : [],
    fatal: {
      question_mismatch: Boolean(grade?.fatal?.question_mismatch),
      no_conclusion: Boolean(grade?.fatal?.no_conclusion),
      logic_gap: Boolean(grade?.fatal?.logic_gap),
      contradiction: Boolean(grade?.fatal?.contradiction),
      constraint_violation: Boolean(grade?.fatal?.constraint_violation),
    },
  };
}

function dummyGrade(charCount: number, why: string) {
  const units = calcUnits(charCount);
  const breakdown = { A: 18, B: 15, C: 9, D: 9, E: 6, F: 3 };
  const score = Math.min(100, breakdown.A + breakdown.B + breakdown.C + breakdown.D + breakdown.E + breakdown.F + Math.min(10, units * 2));
  return {
    score,
    summary: `（ダミー）AI採点に失敗しました：${why}`,
    strengths: ["投稿→結果表示は動いています。"],
    issues: ["AI採点のエラーを解消すると本番の出力になります。"],
    next_actions: ["エラーメッセージを確認する。", "再投稿して結果を確認する。", "出力形式を整える。"],
    breakdown,
    deductions: [],
    fatal: { question_mismatch: false, no_conclusion: false, logic_gap: false, contradiction: false, constraint_violation: false },
  };
}

export async function POST(req: NextRequest) {
  const { userId, mode, anon } = await resolveUserId(req);

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const question = (body?.question ?? "").toString();
  const constraints = (body?.constraints ?? "").toString();
  const essayText = (body?.essay_text ?? "").toString();
  const plan: Plan = (body?.plan ?? "free") === "pro" ? "pro" : "free";
  const requestId = (body?.request_id ?? "").toString();

  if (!requestId || requestId.length < 8) return NextResponse.json({ ok: false, error: "missing_request_id" }, { status: 400 });
  if (!essayText.trim()) return NextResponse.json({ ok: false, error: "missing_essay" }, { status: 400 });
  if (!constraints.trim()) return NextResponse.json({ ok: false, error: "missing_constraints" }, { status: 400 });

  const charCount = essayText.length;
  const units = calcUnits(charCount);
  const cost = units * COST_PER_400[plan];
  const ticketType = plan; // free/pro

  // 残高（そのticket_typeだけ）
  const { data: ledgerRows, error: ledErr } = await supabaseAdmin
    .from("ticket_ledger")
    .select("delta")
    .eq("user_id", userId)
    .eq("ticket_type", ticketType);

  if (ledErr) return NextResponse.json({ ok: false, error: "db_error", detail: ledErr.message }, { status: 500 });

  const balance = (ledgerRows ?? []).reduce((s, r: any) => s + (r.delta ?? 0), 0);
  if (balance < cost) {
    const res = NextResponse.json(
      { ok: false, error: "insufficient_tickets", ticketType, balance, cost, needed: cost - balance, mode },
      { status: 402 }
    );
    if (mode === "anon" && anon.isNew) res.cookies.set("anon_id", anon.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  // essays 作成（二重送信防止）
  const { data: insertedEssay, error: insEssayErr } = await supabaseAdmin
    .from("essays")
    .insert({
      user_id: userId,
      request_id: requestId,
      question,
      constraints,
      essay_text: essayText,
      char_count: charCount,
    })
    .select("id")
    .single();

  if (insEssayErr) {
    const code = (insEssayErr as any).code;
    const msg = (insEssayErr as any).message ?? "";
    if (code === "23505" || msg.includes("duplicate")) {
      const { data: existing, error: exErr } = await supabaseAdmin
        .from("essays")
        .select("id")
        .eq("user_id", userId)
        .eq("request_id", requestId)
        .single();
      if (exErr || !existing?.id) return NextResponse.json({ ok: false, error: "duplicate_but_not_found" }, { status: 500 });
      return NextResponse.json({ ok: true, essayId: existing.id, mode, duplicated: true });
    }
    return NextResponse.json({ ok: false, error: "db_error", detail: insEssayErr.message }, { status: 500 });
  }

  const essayId = insertedEssay.id;

  // チケット消費（台帳に-）
  const consumeEventKey = `essay_submit_${plan}_${requestId}`;
  const { error: consumeErr } = await supabaseAdmin.from("ticket_ledger").insert({
    user_id: userId,
    delta: -cost,
    reason: `essay_submit_${plan}`,
    event_key: consumeEventKey,
    ticket_type: ticketType,
  });

  if (consumeErr) return NextResponse.json({ ok: false, error: "db_error", detail: consumeErr.message }, { status: 500 });

  // AI採点（失敗時はダミー）
  let grade: any;
  try {
    const ai = await callOpenAIGrade({ plan, question, constraints, essayText, charCount });
    grade = ai ? sanitizeGrade(ai) : dummyGrade(charCount, "OPENAI_API_KEY 未設定");
  } catch (e: any) {
    grade = dummyGrade(charCount, e?.message ?? "unknown");
  }

  // grading_results 保存
  const { error: gradeErr } = await supabaseAdmin.from("grading_results").insert({
    essay_id: essayId,
    score: Number(grade.score ?? 0),
    result_json: grade,
  });

  if (gradeErr) {
    // 失敗したら返金（信頼性）
    const refundKey = `refund_${consumeEventKey}`;
    await supabaseAdmin.from("ticket_ledger").insert({
      user_id: userId,
      delta: cost,
      reason: "refund_submit_failed",
      event_key: refundKey,
      ticket_type: ticketType,
    });
    return NextResponse.json({ ok: false, error: "db_error", detail: gradeErr.message }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, essayId, plan, ticketType, cost, mode });
  if (mode === "anon" && anon.isNew) res.cookies.set("anon_id", anon.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}