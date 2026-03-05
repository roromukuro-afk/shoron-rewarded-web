// app/api/link/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "../../_supabase";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function getAnonId(req: NextRequest) {
  const existing = req.cookies.get("anon_id")?.value;
  if (existing && isUuid(existing)) return { id: existing, isNew: false };
  return { id: randomUUID(), isNew: true };
}

export async function POST(req: NextRequest) {
  const { id: anonId, isNew } = getAnonId(req);

  let body: any = null;
  try {
    body = await req.json();
  } catch {}

  const code = (body?.code ?? "").toString().trim();
  if (!/^\d{6}$/.test(code)) {
    const res = NextResponse.json({ ok: false, error: "invalid_code_format" }, { status: 400 });
    if (isNew) {
      res.cookies.set("anon_id", anonId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
    }
    return res;
  }

  // コード確認
  const { data, error } = await supabaseAdmin
    .from("link_codes")
    .select("user_id, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) {
    const res = NextResponse.json({ ok: false, error: "code_not_found" }, { status: 404 });
    if (isNew) {
      res.cookies.set("anon_id", anonId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
    }
    return res;
  }

  const expiresAt = new Date(data.expires_at).getTime();
  if (Date.now() > expiresAt) {
    // 期限切れなら消す
    await supabaseAdmin.from("link_codes").delete().eq("code", code);
    const res = NextResponse.json({ ok: false, error: "expired" }, { status: 410 });
    if (isNew) {
      res.cookies.set("anon_id", anonId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
    }
    return res;
  }

  const userId = data.user_id as string;

  // anon_id → user_id を紐付け（上書きOK）
  const { error: upErr } = await supabaseAdmin.from("device_links").upsert(
    { anon_id: anonId, user_id: userId },
    { onConflict: "anon_id" }
  );

  if (upErr) {
    const res = NextResponse.json({ ok: false, error: "db_error", detail: upErr.message }, { status: 500 });
    if (isNew) {
      res.cookies.set("anon_id", anonId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
    }
    return res;
  }

  // コードは使い捨て
  await supabaseAdmin.from("link_codes").delete().eq("code", code);

  const res = NextResponse.json({ ok: true, linked: true });
  if (isNew) {
    res.cookies.set("anon_id", anonId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return res;
}