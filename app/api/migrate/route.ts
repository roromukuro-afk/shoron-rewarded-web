// app/api/migrate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../_supabase";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
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
  const userId = await getAuthUserId(req);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const anonId = req.cookies.get("anon_id")?.value ?? "";
  if (!anonId || !isUuid(anonId)) {
    return NextResponse.json({ ok: true, migrated: false, reason: "no_anon_id" });
  }
  if (anonId === userId) {
    return NextResponse.json({ ok: true, migrated: false, reason: "same_id" });
  }

  // 競合（同じevent_keyが既にある）を避ける：重複分だけ先に削除→残りを移動
  const { data: anonRows, error: e1 } = await supabaseAdmin
    .from("ticket_ledger")
    .select("event_key")
    .eq("user_id", anonId);

  const { data: userRows, error: e2 } = await supabaseAdmin
    .from("ticket_ledger")
    .select("event_key")
    .eq("user_id", userId);

  if (e1 || e2) {
    return NextResponse.json(
      { ok: false, error: "db_error", detail: e1?.message ?? e2?.message },
      { status: 500 }
    );
  }

  const userSet = new Set((userRows ?? []).map((r: any) => r.event_key));
  const conflicts = (anonRows ?? [])
    .map((r: any) => r.event_key)
    .filter((k: string) => userSet.has(k));

  if (conflicts.length > 0) {
    const { error: delErr } = await supabaseAdmin
      .from("ticket_ledger")
      .delete()
      .eq("user_id", anonId)
      .in("event_key", conflicts);

    if (delErr) {
      return NextResponse.json({ ok: false, error: "db_error", detail: delErr.message }, { status: 500 });
    }
  }

  const { error: updErr } = await supabaseAdmin
    .from("ticket_ledger")
    .update({ user_id: userId })
    .eq("user_id", anonId);

  if (updErr) {
    return NextResponse.json({ ok: false, error: "db_error", detail: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, migrated: true });
}