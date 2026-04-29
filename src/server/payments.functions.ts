import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHost } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getOrRegisterIpnId, submitOrder, getTransactionStatus } from "./pesapal.server";
import { BOOST_TIERS, VERIFY_TIERS, priceFor, durationFor } from "@/lib/tiers";

function siteOrigin(): string {
  const host = getRequestHost();
  return `https://${host}`;
}

const createInput = z.object({
  kind: z.enum(["boost", "verification"]),
  tier: z.string().min(1).max(40),
  billing: z.enum(["monthly", "yearly"]),
  videoId: z.string().uuid().nullable().optional(),
  country: z.string().max(4).nullable().optional(),
});

export const createPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;

    const tierDef =
      data.kind === "boost"
        ? BOOST_TIERS.find((t) => t.id === data.tier)
        : VERIFY_TIERS.find((t) => t.id === data.tier);
    if (!tierDef) throw new Error("Unknown tier");

    const amount = priceFor(tierDef.monthlyUsd, data.billing);
    const days = durationFor(tierDef.durationDays, data.billing);

    const merchantRef = `verde-${data.kind}-${userId.slice(0, 8)}-${Date.now()}`;

    // Insert pending payment record
    const { data: payment, error: insErr } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        kind: data.kind,
        tier: data.tier,
        billing: data.billing,
        amount,
        currency: "USD",
        video_id: data.videoId ?? null,
        country: data.country ?? null,
        duration_days: days,
        status: "pending",
        pesapal_merchant_reference: merchantRef,
      })
      .select()
      .single();
    if (insErr || !payment) throw new Error(`Could not create payment: ${insErr?.message}`);

    const origin = siteOrigin();
    const ipnId = await getOrRegisterIpnId(origin);
    const callbackUrl = `${origin}/app/profile?payment=${payment.id}`;

    let order;
    try {
      order = await submitOrder({
        merchantReference: merchantRef,
        amount,
        currency: "USD",
        description: `Verde ${data.kind} – ${tierDef.name} (${data.billing})`,
        callbackUrl,
        notificationId: ipnId,
        email: (claims as any)?.email,
      });
    } catch (err: any) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed", raw_status: { error: String(err?.message || err) } })
        .eq("id", payment.id);
      throw err;
    }

    const trackingId = order.order_tracking_id;
    const redirect = order.redirect_url;
    if (!trackingId || !redirect) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed", raw_status: order })
        .eq("id", payment.id);
      throw new Error("Pesapal did not return a redirect URL");
    }

    await supabaseAdmin
      .from("payments")
      .update({
        pesapal_order_tracking_id: trackingId,
        redirect_url: redirect,
        raw_status: order,
      })
      .eq("id", payment.id);

    return { paymentId: payment.id, redirectUrl: redirect, trackingId };
  });

const pollInput = z.object({ paymentId: z.string().uuid() });

export const pollPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => pollInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", data.paymentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!payment) throw new Error("Payment not found");

    if (payment.status === "paid" || payment.status === "failed") {
      return { status: payment.status as "paid" | "failed" | "pending" };
    }
    if (!payment.pesapal_order_tracking_id) {
      return { status: "pending" as const };
    }

    let info: any;
    try {
      info = await getTransactionStatus(payment.pesapal_order_tracking_id);
    } catch (err: any) {
      return { status: "pending" as const, error: String(err?.message || err) };
    }

    // Pesapal status_code: 0=invalid, 1=completed, 2=failed, 3=reversed
    const code = Number(info.status_code ?? -1);
    let next: "pending" | "paid" | "failed" = "pending";
    if (code === 1 || String(info.payment_status_description).toLowerCase() === "completed") next = "paid";
    else if (code === 2 || code === 3) next = "failed";

    if (next !== payment.status) {
      await supabaseAdmin
        .from("payments")
        .update({ status: next, raw_status: info })
        .eq("id", payment.id);

      if (next === "paid") {
        const start = new Date();
        const end = new Date(start.getTime() + payment.duration_days * 86400_000);
        if (payment.kind === "boost") {
          await supabaseAdmin.from("boosts").insert({
            user_id: payment.user_id,
            video_id: payment.video_id,
            tier: payment.tier,
            country: payment.country,
            starts_at: start.toISOString(),
            ends_at: end.toISOString(),
            active: true,
          });
        } else {
          await supabaseAdmin.from("verifications").insert({
            user_id: payment.user_id,
            tier: payment.tier,
            starts_at: start.toISOString(),
            ends_at: end.toISOString(),
            active: true,
          });
          await supabaseAdmin
            .from("profiles")
            .update({ verified: true, verified_until: end.toISOString() })
            .eq("id", payment.user_id);
        }
      }
    }

    return { status: next };
  });

export const expireAndRefresh = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    await supabaseAdmin.rpc("expire_boosts_and_verifications" as any);
    return { ok: true };
  });
