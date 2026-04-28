import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/verify")({
  validateSearch: z.object({ email: z.string().email().optional() }),
  component: Verify,
});

function Verify() {
  const { email } = Route.useSearch();
  return (
    <div className="min-h-dvh screen-gradient flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="brand-gradient rounded-full p-6 shadow-brand">
        <Mail className="h-12 w-12 text-brand-foreground" />
      </div>
      <h1 className="mt-8 text-3xl font-bold">Check your email</h1>
      <p className="mt-3 max-w-xs text-muted-foreground">
        We sent a verification link to{" "}
        <span className="text-foreground font-medium">{email ?? "your email"}</span>.
        Tap it to confirm your account, then come back and sign in.
      </p>
      <Link
        to="/login"
        className="mt-8 brand-gradient text-brand-foreground font-bold py-3 px-8 rounded-2xl shadow-brand"
      >
        I verified — Sign in
      </Link>
      <Link to="/welcome" className="mt-4 text-xs text-muted-foreground underline">
        Back to welcome
      </Link>
    </div>
  );
}
