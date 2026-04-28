import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { captureSignupMeta } from "@/server/meta.functions";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/signup")({
  component: Signup,
});

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accept, setAccept] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!accept) {
      toast.error("Please accept the Terms and Policy.");
      return;
    }
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;

      // Capture IP + fingerprint after auth user exists.
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const meta = await captureSignupMeta();
        if (data.user?.id) {
          await supabase.from("signups_meta").insert({
            user_id: data.user.id,
            ip_address: meta.ip,
            user_agent: meta.userAgent,
            device_fingerprint: result.visitorId,
          });
        }
      } catch (err) {
        console.warn("meta capture failed", err);
      }

      navigate({ to: "/verify", search: { email: parsed.data.email } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign up failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh screen-gradient px-6 py-8 flex flex-col">
      <button
        onClick={() => navigate({ to: "/welcome" })}
        className="self-start rounded-full bg-card/60 border border-border p-2"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-3 mb-8">
            <BrandLogo size={64} />
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-sm text-muted-foreground text-center">
              Use your email — we'll send you a verification link.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="mt-1 w-full rounded-xl bg-card border border-border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min 8 characters"
                className="mt-1 w-full rounded-xl bg-card border border-border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <label className="flex gap-2 items-start text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={accept}
                onChange={(e) => setAccept(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[oklch(0.78_0.19_152)]"
              />
              <span>
                I agree to the{" "}
                <Link to="/terms" className="text-brand underline">Terms & Conditions</Link>{" "}
                and{" "}
                <Link to="/policy" className="text-brand underline">Privacy Policy</Link>.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full brand-gradient text-brand-foreground font-bold py-3.5 rounded-2xl shadow-brand disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign up
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-brand font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
