import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset")({
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase places a recovery session via the link; just confirm we have one.
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    if (password !== confirm) return toast.error("Passwords do not match.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated. Welcome back!");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-dvh screen-gradient px-6 py-8 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-3 mb-8">
            <BrandLogo size={64} />
            <h1 className="text-2xl font-bold">Set a new password</h1>
          </div>

          {!ready ? (
            <div className="rounded-2xl bg-card/60 border border-border p-6 text-center space-y-3">
              <p className="text-sm">This reset link looks invalid or expired.</p>
              <Link to="/forgot" className="inline-block text-brand text-sm font-semibold">Request a new link</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="password" required minLength={8} placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl bg-card border border-border px-4 py-3 outline-none focus:ring-2 focus:ring-brand" />
              <input type="password" required minLength={8} placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full rounded-xl bg-card border border-border px-4 py-3 outline-none focus:ring-2 focus:ring-brand" />
              <button type="submit" disabled={loading} className="w-full brand-gradient text-brand-foreground font-bold py-3.5 rounded-2xl shadow-brand disabled:opacity-60 flex items-center justify-center gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} Update password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
