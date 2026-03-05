// app/api/essays/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "../_supabase";

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

export async function GET(req: NextRequest) {
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

  const { data, error } = await supabaseAdmin
    .from("essays")
    .select("id, question, char_count, created_at, grading_results(score)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ ok: false, error: "db_error", detail: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((r: any) => {
    const scores = r.grading_results ?? [];
    const score = Array.isArray(scores) && scores.length ? scores[0].score : null;
    return {
      id: r.id,
      question: r.question,
      char_count: r.char_count,
      created_at: r.created_at,
      score,
    };
  });

  const res = NextResponse.json({ ok: true, mode, items });

  if (!authUserId && anon.isNew) {
    res.cookies.set("anon_id", anon.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }

  return res;
}