export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "../../../_supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

async function getAuthUser(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length);

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });

  const priceBasic = process.env.STRIPE_PRICE_BASIC;
  const pricePlus = process.env.STRIPE_PRICE_PLUS;

  if (!process.env.STRIPE_SECRET_KEY || !priceBasic || !pricePlus) {
    return NextResponse.json({ ok: false, error: "stripe_env_missing" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const plan = (body?.plan ?? "basic") as "basic" | "plus";
  const priceId = plan === "plus" ? pricePlus : priceBasic;

  const { data: existing, error: e1 } = await supabaseAdmin
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (e1) return NextResponse.json({ ok: false, error: "db_error", detail: e1.message }, { status: 500 });

  let customerId = existing?.stripe_customer_id as string | undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;

    const { error: e2 } = await supabaseAdmin.from("billing_customers").insert({
      user_id: user.id,
      stripe_customer_id: customerId,
    });
    if (e2) return NextResponse.json({ ok: false, error: "db_error", detail: e2.message }, { status: 500 });
  }

  const origin = req.headers.get("origin") ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?billing=success`,
    cancel_url: `${origin}/billing?billing=cancel`,
    metadata: { user_id: user.id, plan },
  });

  return NextResponse.json({ ok: true, url: session.url });
}
