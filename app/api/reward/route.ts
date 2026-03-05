// app/api/reward/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin, getTokyoDateKey } from "../_supabase";

const DAILY_LIMIT = 20;

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

export async function POST(req: NextRequest) {
  const authUserId = await getAuthUserId(req);
  const anon = getAnonId(req);

  // nonce（視聴1回の使い捨てID）
  const nonce = req.cookies.get("reward_nonce")?.value;
  if (!nonce || !isUuid(nonce)) {
    const res = NextResponse.json({ ok: false, reason: "missing_nonce" }, { status: 400 });
    if (!authUserId && anon.isNew) {
      res.cookies.set("anon_id", anon.id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return res;
  }

  // 付与先 user_id 決定：auth → linked → anon
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

  // ✅ 上限チェック（念のためreward側でもガード）
  const dayKey = getTokyoDateKey();
  const prefix = `rewarded_${dayKey}_`;

  const { count, error: countErr } = await supabaseAdmin
    .from("ticket_ledger")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .like("event_key", `${prefix}%`);

  if (countErr) {
    console.error("countErr:", countErr);
    const res = NextResponse.json(
      { ok: false, error: "db_error", detail: countErr.message },
      { status: 500 }
    );
    // nonceは使い捨て：消す
    res.cookies.set("reward_nonce", "", { path: "/", maxAge: 0 });
    if (!authUserId && anon.isNew) {
      res.cookies.set("anon_id", anon.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
    }
    return res;
  }

  const used = count ?? 0;
  if (used >= DAILY_LIMIT) {
    const res = NextResponse.json(
      { ok: false, error: "daily_limit", limit: DAILY_LIMIT, used, mode },
      { status: 429 }
    );
    res.cookies.set("reward_nonce", "", { path: "/", maxAge: 0 });
    if (!authUserId && anon.isNew) {
      res.cookies.set("anon_id", anon.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
    }
    return res;
  }

  // ✅ event_key に日付prefixを付ける（今日分カウントが簡単になる）
  const eventKey = `rewarded_${dayKey}_${nonce}`;

  const clearNonce = (res: NextResponse) => {
    res.cookies.set("reward_nonce", "", { path: "/", maxAge: 0 });
  };

  const { error: insertError } = await supabaseAdmin.from("ticket_ledger").insert({
    user_id: userId,
    delta: 1,
    reason: `rewarded_ad_${mode}`,
    event_key: eventKey,
  });

  if (insertError) {
    const code = (insertError as any).code;
    const msg = (insertError as any).message ?? "";

    const res =
      code === "23505" || msg.includes("duplicate key")
        ? NextResponse.json({ ok: false, reason: "already_claimed" }, { status: 409 })
        : NextResponse.json(
            { ok: false, error: "db_error", detail: (insertError as any).message ?? "unknown" },
            { status: 500 }
          );

    clearNonce(res);

    if (!authUserId && anon.isNew) {
      res.cookies.set("anon_id", anon.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
    }
    return res;
  }

  // 残高返す（見やすさ優先で合計）
  const { data, error } = await supabaseAdmin.from("ticket_ledger").select("delta").eq("user_id", userId);
  const balance = error ? null : (data ?? []).reduce((s, r) => s + (r.delta ?? 0), 0);

  const res = NextResponse.json({ ok: true, added: 1, balance, mode, used: used + 1, limit: DAILY_LIMIT });
  clearNonce(res);

  if (!authUserId && anon.isNew) {
    res.cookies.set("anon_id", anon.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return res;
}