// app/api/billing/status/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../_supabase";

async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

function planFromPrice(priceId: string | null | undefined) {
  if (!priceId) return "none";
  if (priceId === process.env.STRIPE_PRICE_PLUS) return "plus";
  if (priceId === process.env.STRIPE_PRICE_BASIC) return "basic";
  return "unknown";
}

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("billing_subscriptions")
    .select("stripe_subscription_id, price_id, status, current_period_end, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: "db_error", detail: error.message }, { status: 500 });

  const plan = planFromPrice(data?.price_id);
  return NextResponse.json({
    ok: true,
    plan,
    subscription: data ?? null,
  });
}