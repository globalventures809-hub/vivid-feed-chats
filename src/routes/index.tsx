import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { loading, session, profile } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center screen-gradient">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }
  if (!session) return <Navigate to="/welcome" />;
  if (!profile?.setup_complete) return <Navigate to="/setup" />;
  return <Navigate to="/app/feed" />;
}
