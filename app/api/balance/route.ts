// app/api/balance/route.ts
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
    .from("ticket_ledger")
    .select("delta, ticket_type")
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ ok: false, error: "db_error", detail: error.message }, { status: 500 });
  }

  let free = 0;
  let pro = 0;

  for (const row of data ?? []) {
    const t = (row as any).ticket_type ?? "free";
    const d = (row as any).delta ?? 0;
    if (t === "pro") pro += d;
    else free += d;
  }

  const res = NextResponse.json({
    ok: true,
    mode,
    freeBalance: free,
    proBalance: pro,
    balance: free + pro, // 互換用（合計）
  });

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