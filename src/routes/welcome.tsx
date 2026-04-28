import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, Users } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/welcome")({
  component: Welcome,
});

function Welcome() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && session) navigate({ to: "/app/feed" });
  }, [loading, session, navigate]);

  return (
    <div className="min-h-dvh screen-gradient flex flex-col px-6 py-10">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <BrandLogo size={96} />
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-4xl font-extrabold tracking-tight"
        >
          Welcome to <span className="text-brand">Verde</span>
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mt-3 text-base text-muted-foreground max-w-xs"
        >
          A tiny green corner of the internet. Watch short videos, chat with
          friends, and share your moment.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-10 grid gap-3 w-full max-w-xs"
        >
          {[
            { icon: Sparkles, title: "Vertical video feed", body: "TikTok-style scrolling for any aspect ratio." },
            { icon: Users, title: "Real connections", body: "Follow people you love & chat in DMs." },
            { icon: ShieldCheck, title: "Privacy first", body: "You control your profile and visibility." },
          ].map((f) => (
            <div key={f.title} className="flex gap-3 rounded-xl bg-card/60 backdrop-blur border border-border p-3 text-left">
              <div className="brand-gradient rounded-lg p-2 text-brand-foreground"><f.icon className="h-5 w-5" /></div>
              <div>
                <div className="text-sm font-semibold">{f.title}</div>
                <div className="text-xs text-muted-foreground">{f.body}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="space-y-3"
      >
        <Link
          to="/signup"
          className="block w-full text-center brand-gradient text-brand-foreground font-bold py-3.5 rounded-2xl shadow-brand"
        >
          Get started — Sign up with email
        </Link>
        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link to="/terms" className="underline text-brand">Terms</Link> and{" "}
          <Link to="/policy" className="underline text-brand">Privacy Policy</Link>.
        </p>
      </motion.div>
    </div>
  );
}
