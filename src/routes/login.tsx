import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-dvh screen-gradient px-6 py-8 flex flex-col">
      <button onClick={() => navigate({ to: "/welcome" })} className="self-start rounded-full bg-card/60 border border-border p-2">
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-3 mb-8">
            <BrandLogo size={64} />
            <h1 className="text-2xl font-bold">Welcome back</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl bg-card border border-border px-4 py-3 outline-none focus:ring-2 focus:ring-brand" />
            <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl bg-card border border-border px-4 py-3 outline-none focus:ring-2 focus:ring-brand" />
            <button type="submit" disabled={loading} className="w-full brand-gradient text-brand-foreground font-bold py-3.5 rounded-2xl shadow-brand disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here? <Link to="/signup" className="text-brand font-semibold">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
