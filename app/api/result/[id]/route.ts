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

async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length);

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const idStr = params?.id ?? req.nextUrl.pathname.split("/").pop() ?? "";
  const essayId = Number(idStr);

  if (!Number.isFinite(essayId) || essayId <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_id", got: idStr }, { status: 400 });
  }

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

  const { data: essay, error: e1 } = await supabaseAdmin
    .from("essays")
    .select("id, question, constraints, essay_text, char_count, created_at")
    .eq("id", essayId)
    .eq("user_id", userId)
    .maybeSingle();

  if (e1) {
    return NextResponse.json({ ok: false, error: "db_error", detail: e1.message }, { status: 500 });
  }
  if (!essay) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const { data: gr, error: e2 } = await supabaseAdmin
    .from("grading_results")
    .select("score, result_json, created_at")
    .eq("essay_id", essayId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (e2) {
    return NextResponse.json({ ok: false, error: "db_error", detail: e2.message }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, mode, essay, grading: gr ?? null });

  if (!authUserId && anon.isNew) {
    res.cookies.set("anon_id", anon.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }

  return res;
}