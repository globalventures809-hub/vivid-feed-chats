import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

export const Route = createFileRoute("/forgot")({
  component: Forgot,
});

function Forgot() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const redirectTo = `${window.location.origin}/reset`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Check your inbox for the reset link.");
  };

  return (
    <div className="min-h-dvh screen-gradient px-6 py-8 flex flex-col">
      <button onClick={() => navigate({ to: "/login" })} className="self-start rounded-full bg-card/60 border border-border p-2">
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-3 mb-8">
            <BrandLogo size={64} />
            <h1 className="text-2xl font-bold">Reset password</h1>
            <p className="text-sm text-muted-foreground text-center">
              Enter your email and we'll send you a link to set a new password.
            </p>
          </div>

          {sent ? (
            <div className="rounded-2xl bg-card/60 border border-border p-6 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full brand-gradient flex items-center justify-center">
                <Mail className="h-6 w-6 text-brand-foreground" />
              </div>
              <p className="text-sm">We sent a reset link to <b className="text-foreground">{email}</b>. Open it on this device to continue.</p>
              <Link to="/login" className="inline-block mt-2 text-brand text-sm font-semibold">Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-card border border-border px-4 py-3 outline-none focus:ring-2 focus:ring-brand"
              />
              <button type="submit" disabled={loading} className="w-full brand-gradient text-brand-foreground font-bold py-3.5 rounded-2xl shadow-brand disabled:opacity-60 flex items-center justify-center gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remember it? <Link to="/login" className="text-brand font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
