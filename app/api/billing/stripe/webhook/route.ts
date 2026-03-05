// app/api/billing/stripe/webhook/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "../../../_supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
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

async function upsertSubscription(args: {
  subscriptionId: string;
  userId: string;
  customerId: string;
  priceId: string;
  status: string;
  currentPeriodEnd: number | null;
}) {
  const { error } = await supabaseAdmin.from("billing_subscriptions").upsert(
    {
      stripe_subscription_id: args.subscriptionId,
      user_id: args.userId,
      stripe_customer_id: args.customerId,
      price_id: args.priceId,
      status: args.status,
      current_period_end: args.currentPeriodEnd ? new Date(args.currentPeriodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );
  if (error) throw new Error(error.message);
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");

  if (!webhookSecret) return NextResponse.json({ ok: false, error: "STRIPE_WEBHOOK_SECRET_missing" }, { status: 500 });
  if (!sig) return NextResponse.json({ ok: false, error: "missing_stripe_signature" }, { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "signature_verification_failed", detail: e?.message ?? "unknown" }, { status: 400 });
  }

  const firstTime = await markEventProcessed(event.id);
  if (!firstTime) return NextResponse.json({ ok: true, skipped: "duplicate_event" });

  try {
    // ✅ Checkout完了 → subscriptionをDBに保存
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = (session.client_reference_id || session.metadata?.user_id || "") as string;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (userId && customerId && subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = sub.items.data?.[0]?.price?.id ?? "";
        await upsertSubscription({
          subscriptionId,
          userId,
          customerId,
          priceId,
          status: sub.status,
          currentPeriodEnd: sub.current_period_end ?? null,
        });
      }
      return NextResponse.json({ ok: true });
    }

    // ✅ subscription更新/解約 → status更新
    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const subscriptionId = sub.id;
      const customerId = sub.customer as string;
      const priceId = sub.items.data?.[0]?.price?.id ?? "";

      // customerId → userId をDBで引く
      const { data: custRow } = await supabaseAdmin
        .from("billing_customers")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      const userId = custRow?.user_id as string | undefined;
      if (userId) {
        await upsertSubscription({
          subscriptionId,
          userId,
          customerId,
          priceId,
          status: sub.status,
          currentPeriodEnd: sub.current_period_end ?? null,
        });
      }
      return NextResponse.json({ ok: true });
    }

    // ✅ 支払い成功 → Pro付与
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;

      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (!customerId) return NextResponse.json({ ok: true, ignored: "no_customer" });

      const { data: custRow, error: e1 } = await supabaseAdmin
        .from("billing_customers")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (e1) return NextResponse.json({ ok: false, error: "db_error", detail: e1.message }, { status: 500 });
      if (!custRow?.user_id) return NextResponse.json({ ok: true, ignored: "customer_not_linked" });

      const userId = custRow.user_id as string;

      const line = invoice.lines?.data?.find((l) => (l.price as any)?.id);
      const priceId = (line?.price as any)?.id as string | undefined;
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

    // 支払い失敗は“記録だけ”したければここでupsertしてもOK（今回は無視）
    return NextResponse.json({ ok: true, ignored: event.type });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "webhook_handler_failed", detail: e?.message ?? "unknown" }, { status: 500 });
  }
}