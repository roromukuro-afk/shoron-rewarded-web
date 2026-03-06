export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "../../../_supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const PRO_CAP = 200;

async function getProBalance(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("ticket_ledger")
    .select("delta")
    .eq("user_id", userId)
    .eq("ticket_type", "pro");
  if (error) throw new Error(error.message);
  return (data ?? []).reduce((s, r: any) => s + (r.delta ?? 0), 0);
}

async function markEventProcessed(eventId: string) {
  const { error } = await supabaseAdmin.from("billing_events").insert({ stripe_event_id: eventId });
  if (!error) return true;
  if ((error as any).code === "23505") return false;
  throw new Error(error.message);
}

// Stripeの型差異に強い price_id 抽出（anyで扱う）
function extractPriceIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const invAny: any = invoice;

  // 1) lines.data[].price.id（新しめ）
  const data1 = invAny?.lines?.data;
  if (Array.isArray(data1)) {
    for (const l of data1) {
      const pid = l?.price?.id;
      if (typeof pid === "string" && pid.length > 0) return pid;
    }
  }

  // 2) lines.data[].plan.id（古め）
  if (Array.isArray(data1)) {
    for (const l of data1) {
      const pid = l?.plan?.id;
      if (typeof pid === "string" && pid.length > 0) return pid;
    }
  }

  // 3) invoice.items.data[].price.id（環境によってはこっち）
  const data2 = invAny?.items?.data;
  if (Array.isArray(data2)) {
    for (const l of data2) {
      const pid = l?.price?.id;
      if (typeof pid === "string" && pid.length > 0) return pid;
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: "STRIPE_SECRET_KEY_missing" }, { status: 500 });
  }
  if (!webhookSecret) return NextResponse.json({ ok: false, error: "STRIPE_WEBHOOK_SECRET_missing" }, { status: 500 });
  if (!sig) return NextResponse.json({ ok: false, error: "missing_stripe_signature" }, { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "signature_verification_failed", detail: e?.message ?? "unknown" },
      { status: 400 }
    );
  }

  const firstTime = await markEventProcessed(event.id);
  if (!firstTime) return NextResponse.json({ ok: true, skipped: "duplicate_event" });

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;

    const invAny: any = invoice;
    const customerId =
      typeof invAny.customer === "string" ? invAny.customer : invAny.customer?.id;

    if (!customerId) return NextResponse.json({ ok: true, ignored: "no_customer" });

    const { data: custRow, error: e1 } = await supabaseAdmin
      .from("billing_customers")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (e1) return NextResponse.json({ ok: false, error: "db_error", detail: e1.message }, { status: 500 });
    if (!custRow?.user_id) return NextResponse.json({ ok: true, ignored: "customer_not_linked" });

    const userId = custRow.user_id as string;

    const priceId = extractPriceIdFromInvoice(invoice);
    if (!priceId) return NextResponse.json({ ok: true, ignored: "no_price_id" });

    const basic = process.env.STRIPE_PRICE_BASIC!;
    const plus = process.env.STRIPE_PRICE_PLUS!;
    const grantBase = priceId === plus ? 100 : priceId === basic ? 40 : 0;
    if (grantBase <= 0) return NextResponse.json({ ok: true, ignored: "unknown_price", priceId });

    const current = await getProBalance(userId);
    const grant = Math.max(0, Math.min(grantBase, PRO_CAP - current));
    if (grant === 0) return NextResponse.json({ ok: true, ignored: "cap_reached", cap: PRO_CAP, current });

    const eventKey = `stripe_invoice_${invoice.id}`;
    const { error: insErr } = await supabaseAdmin.from("ticket_ledger").insert({
      user_id: userId,
      delta: grant,
      reason: "stripe_subscription_grant",
      event_key: eventKey,
      ticket_type: "pro",
    });

    if (insErr) {
      if ((insErr as any).code === "23505") return NextResponse.json({ ok: true, skipped: "already_granted" });
      return NextResponse.json({ ok: false, error: "db_error", detail: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, granted: grant, priceId });
  }

  return NextResponse.json({ ok: true, ignored: event.type });
}