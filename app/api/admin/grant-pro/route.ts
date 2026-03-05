// app/api/admin/grant-pro/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../_supabase";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function POST(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ ok: false, error: "ADMIN_SECRET_not_set" }, { status: 500 });
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const secret = (body?.secret ?? "").toString();
  const userId = (body?.userId ?? "").toString();
  const amount = Number(body?.amount ?? 0);

  if (secret !== adminSecret) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  if (!isUuid(userId)) {
    return NextResponse.json({ ok: false, error: "invalid_userId" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000) {
    return NextResponse.json({ ok: false, error: "invalid_amount" }, { status: 400 });
  }

  const eventKey = `admin_grant_pro_${Date.now()}`;

  const { error } = await supabaseAdmin.from("ticket_ledger").insert({
    user_id: userId,
    delta: amount,
    reason: "admin_grant_pro",
    event_key: eventKey,
    ticket_type: "pro",
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "db_error", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId, added: amount });
}