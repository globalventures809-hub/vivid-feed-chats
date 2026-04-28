import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { loading, session, profile } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!session) navigate({ to: "/welcome" });
    else if (!profile?.setup_complete) navigate({ to: "/setup" });
  }, [loading, session, profile, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-20">
      <Outlet />
      <BottomNav />
    </div>
  );
}
