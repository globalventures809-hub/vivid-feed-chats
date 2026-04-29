import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { BOOST_TIERS, VERIFY_TIERS, priceFor, durationFor } from "@/lib/tiers";
import { COUNTRIES } from "@/lib/countries";
import { createPayment, pollPayment } from "@/server/payments.functions";
import { ArrowLeft, BadgeCheck, Check, Loader2, RotateCw, Rocket, ShieldCheck, X } from "lucide-react";

const searchSchema = z.object({
  payment: z.string().uuid().optional(),
}).partial();

export const Route = createFileRoute("/app/boost")({
  validateSearch: (s) => searchSchema.parse(s),
  component: BoostScreen,
});

type Mode = "boost" | "verification";
type Billing = "monthly" | "yearly";
type Status = "idle" | "creating" | "redirecting" | "pending" | "paid" | "failed";

function BoostScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/app/boost" });
  const createFn = useServerFn(createPayment);
  const pollFn = useServerFn(pollPayment);

  const [mode, setMode] = useState<Mode>("boost");
  const [billing, setBilling] = useState<Billing>("monthly");
  const [tierId, setTierId] = useState<string>(BOOST_TIERS[2].id);
  const [videoId, setVideoId] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [videos, setVideos] = useState<{ id: string; caption: string | null }[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [paymentId, setPaymentId] = useState<string | null>(search.payment ?? null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("videos").select("id, caption").eq("author_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setVideos((data as any) ?? []));
  }, [user]);

  const tiers = mode === "boost" ? BOOST_TIERS : VERIFY_TIERS;
  const selectedTier = useMemo(() => tiers.find((t) => t.id === tierId) ?? tiers[0], [tiers, tierId]);
  const amount = priceFor(selectedTier.monthlyUsd, billing);
  const days = durationFor(selectedTier.durationDays, billing);

  // Switch default tier when mode changes
  useEffect(() => {
    setTierId(mode === "boost" ? BOOST_TIERS[2].id : VERIFY_TIERS[1].id);
  }, [mode]);

  const stopPolling = () => {
    if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
  };

  const startPolling = (id: string) => {
    stopPolling();
    setStatus("pending");
    let tries = 0;
    pollRef.current = window.setInterval(async () => {
      tries++;
      try {
        const res = await pollFn({ data: { paymentId: id } });
        if (res.status === "paid") { setStatus("paid"); stopPolling(); }
        else if (res.status === "failed") { setStatus("failed"); stopPolling(); }
      } catch (e: any) {
        // network blip — keep polling
      }
      if (tries > 60) stopPolling(); // ~5 minutes
    }, 5000);
  };

  // Resume polling if we returned from Pesapal with ?payment=...
  useEffect(() => {
    if (search.payment) {
      setPaymentId(search.payment);
      startPolling(search.payment);
    }
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePay = async () => {
    setError(null);
    setStatus("creating");
    try {
      const res = await createFn({
        data: {
          kind: mode,
          tier: selectedTier.id,
          billing,
          videoId: mode === "boost" && videoId ? videoId : null,
          country: mode === "boost" && country ? country : null,
        },
      });
      setPaymentId(res.paymentId);
      setStatus("redirecting");
      // Open Pesapal in same tab
      window.location.assign(res.redirectUrl);
    } catch (e: any) {
      setError(String(e?.message || e));
      setStatus("failed");
    }
  };

  const retry = async () => {
    if (!paymentId) return handlePay();
    setError(null);
    setStatus("pending");
    startPolling(paymentId);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate({ to: "/app/profile" })} className="rounded-full p-2 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Boost & Verify</h1>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-full bg-muted p-1">
          <button
            onClick={() => setMode("boost")}
            className={`flex items-center justify-center gap-2 rounded-full py-2 text-sm font-semibold transition ${mode === "boost" ? "bg-background shadow" : "text-muted-foreground"}`}
          >
            <Rocket className="h-4 w-4" /> Boost video
          </button>
          <button
            onClick={() => setMode("verification")}
            className={`flex items-center justify-center gap-2 rounded-full py-2 text-sm font-semibold transition ${mode === "verification" ? "bg-background shadow" : "text-muted-foreground"}`}
          >
            <ShieldCheck className="h-4 w-4" /> Get verified
          </button>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-2 rounded-full border border-border p-1 max-w-xs mx-auto">
          <button onClick={() => setBilling("monthly")} className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold ${billing === "monthly" ? "bg-foreground text-background" : ""}`}>Monthly</button>
          <button onClick={() => setBilling("yearly")} className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold inline-flex items-center justify-center gap-1 ${billing === "yearly" ? "bg-foreground text-background" : ""}`}>
            Yearly <span className="rounded-full bg-emerald-500/15 text-emerald-600 px-1.5 py-0.5 text-[10px]">−20%</span>
          </button>
        </div>

        {/* Tier cards */}
        <div className="grid gap-3">
          {tiers.map((t) => {
            const selected = t.id === tierId;
            const price = priceFor(t.monthlyUsd, billing);
            return (
              <button
                key={t.id}
                onClick={() => setTierId(t.id)}
                className={`text-left rounded-2xl border p-4 transition ${selected ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border bg-card hover:bg-accent/50"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{t.name}</h3>
                      {(t as any).highlight && <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-bold">POPULAR</span>}
                    </div>
                    {"reach" in t && <p className="text-xs text-muted-foreground mt-0.5">{(t as any).reach}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">${price.toFixed(2)}</div>
                    <div className="text-[11px] text-muted-foreground">{billing === "yearly" ? "/year" : "/month"}</div>
                  </div>
                </div>
                <ul className="mt-3 space-y-1">
                  {t.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />{b}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Boost-only options */}
        {mode === "boost" && (
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Video to boost (optional)</label>
              <select value={videoId} onChange={(e) => setVideoId(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="">All my videos</option>
                {videos.map((v) => (
                  <option key={v.id} value={v.id}>{(v.caption || v.id.slice(0, 8)).slice(0, 60)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Country targeting (optional)</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="">Worldwide</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {mode === "verification" && (
          <div className="rounded-2xl border border-border bg-card p-4 text-sm flex gap-3">
            <BadgeCheck className="h-5 w-5 text-[#1d9bf0] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Verified badge included</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your blue check appears immediately after payment confirmation and lasts {days} days. It cannot be faked — the badge is server-issued and removed automatically when the period ends unless renewed.
              </p>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="rounded-2xl bg-foreground text-background p-4">
          <div className="flex items-center justify-between text-sm">
            <span>Total</span>
            <span className="font-bold">${amount.toFixed(2)} USD</span>
          </div>
          <div className="flex items-center justify-between text-xs opacity-70 mt-1">
            <span>Duration</span><span>{days} days</span>
          </div>
        </div>

        {/* Action / Status */}
        <PaymentStatusPanel
          status={status}
          error={error}
          onPay={handlePay}
          onRetry={retry}
          onClose={() => { setStatus("idle"); setPaymentId(null); navigate({ to: "/app/boost", search: {} }); }}
        />
      </div>
    </div>
  );
}

function PaymentStatusPanel({
  status, error, onPay, onRetry, onClose,
}: {
  status: Status;
  error: string | null;
  onPay: () => void;
  onRetry: () => void;
  onClose: () => void;
}) {
  if (status === "idle") {
    return (
      <button onClick={onPay} className="w-full rounded-full brand-gradient text-brand-foreground py-3 font-bold shadow-brand">
        Pay with Pesapal
      </button>
    );
  }
  if (status === "creating" || status === "redirecting") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> {status === "creating" ? "Creating order…" : "Redirecting to Pesapal…"}
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-sm space-y-3">
        <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Waiting for Pesapal confirmation…</div>
        <p className="text-xs text-muted-foreground">This can take up to a minute. We're checking every few seconds.</p>
        <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold">
          <RotateCw className="h-3 w-3" /> Check again
        </button>
      </div>
    );
  }
  if (status === "paid") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
        <div className="flex items-center gap-2 font-semibold text-emerald-600"><Check className="h-4 w-4" /> Payment confirmed</div>
        <p className="text-xs text-muted-foreground mt-1">Your benefits are now active.</p>
        <button onClick={onClose} className="mt-3 rounded-full bg-emerald-600 text-white px-4 py-1.5 text-xs font-semibold">Done</button>
      </div>
    );
  }
  // failed
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm space-y-2">
      <div className="flex items-center gap-2 font-semibold text-destructive"><X className="h-4 w-4" /> Payment failed</div>
      {error && <p className="text-xs text-muted-foreground break-words">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-3 py-1.5 text-xs font-semibold">
          <RotateCw className="h-3 w-3" /> Retry
        </button>
        <button onClick={onClose} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold">Cancel</button>
      </div>
    </div>
  );
}
