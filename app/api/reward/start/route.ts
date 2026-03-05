// app/api/reward/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin, getTokyoDateKey } from "../../_supabase";

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

  // 今日の上限チェック（event_keyの prefix で数える）
  const dayKey = getTokyoDateKey(); // 例: 2026-03-04
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

  const used = count ?? 0;

  if (used >= DAILY_LIMIT) {
    // nonceは発行しない（視聴しても付与できないので、ここで止める）
    const res = NextResponse.json(
      { ok: false, error: "daily_limit", limit: DAILY_LIMIT, used, mode },
      { status: 429 }
    );
    // 念のため、古いnonceが残ってたら消す
    res.cookies.set("reward_nonce", "", { path: "/", maxAge: 0 });

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

  // 1回の広告視聴に紐づく「使い捨てID」
  const nonce = randomUUID();

  const res = NextResponse.json({ ok: true, nonce, limit: DAILY_LIMIT, used, mode });

  // nonceはcookieに保存（ブラウザ側に見せない）
  res.cookies.set("reward_nonce", nonce, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10分
  });

  // anon_id cookie（必要なら）
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