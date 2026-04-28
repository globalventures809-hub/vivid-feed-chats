import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, Users, MessageSquare } from "lucide-react";
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
    <div className="min-h-dvh screen-gradient flex flex-col px-6 py-8 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 14 }}
        >
          <BrandLogo size={96} />
        </motion.div>

        <motion.h1
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mt-6 text-4xl font-extrabold tracking-tight"
        >
          Welcome to <span className="text-brand">Verde</span>
        </motion.h1>
        <motion.p
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mt-2 text-base text-muted-foreground max-w-xs"
        >
          A tiny green corner of the internet — short videos, real chats, and
          your moment, shared.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } },
          }}
          className="mt-8 grid gap-3 w-full max-w-xs"
        >
          {[
            { icon: Sparkles, title: "Vertical video feed", body: "TikTok-style scrolling, any aspect ratio." },
            { icon: Users, title: "Real connections", body: "Follow people you love." },
            { icon: MessageSquare, title: "Private chats", body: "DM friends in seconds." },
            { icon: ShieldCheck, title: "Privacy first", body: "You control your visibility." },
          ].map((f) => (
            <motion.div
              key={f.title}
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
              }}
              className="flex gap-3 rounded-xl bg-card/60 backdrop-blur border border-border p-3 text-left"
            >
              <div className="brand-gradient rounded-lg p-2 text-brand-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">{f.title}</div>
                <div className="text-xs text-muted-foreground">{f.body}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="space-y-3 pt-4"
      >
        <Link
          to="/signup"
          className="block w-full text-center brand-gradient text-brand-foreground font-bold py-3.5 rounded-2xl shadow-brand hover-scale"
        >
          Get started — Sign up with email
        </Link>
        <Link
          to="/login"
          className="block w-full text-center bg-card/60 backdrop-blur border border-border font-semibold py-3 rounded-2xl"
        >
          I already have an account
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
