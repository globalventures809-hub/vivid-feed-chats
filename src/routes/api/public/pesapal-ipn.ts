import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getTransactionStatus } from "@/server/pesapal.server";

// Pesapal IPN: GET /api/public/pesapal-ipn?OrderTrackingId=...&OrderMerchantReference=...&OrderNotificationType=...
export const Route = createFileRoute("/api/public/pesapal-ipn")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const trackingId = url.searchParams.get("OrderTrackingId") || url.searchParams.get("orderTrackingId");
        const merchantRef = url.searchParams.get("OrderMerchantReference") || url.searchParams.get("orderMerchantReference");
        if (!trackingId) {
          return new Response(JSON.stringify({ status: 500, message: "Missing OrderTrackingId" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const info: any = await getTransactionStatus(trackingId);
          const code = Number(info.status_code ?? -1);
          let next: "pending" | "paid" | "failed" = "pending";
          if (code === 1) next = "paid";
          else if (code === 2 || code === 3) next = "failed";

          const { data: payment } = await supabaseAdmin
            .from("payments")
            .select("*")
            .eq("pesapal_order_tracking_id", trackingId)
            .maybeSingle();

          if (payment && payment.status !== next) {
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

          // Pesapal expects a JSON acknowledgement
          return new Response(
            JSON.stringify({
              orderNotificationType: url.searchParams.get("OrderNotificationType") || "IPNCHANGE",
              orderTrackingId: trackingId,
              orderMerchantReference: merchantRef,
              status: 200,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (err: any) {
          return new Response(
            JSON.stringify({ status: 500, message: String(err?.message || err) }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
