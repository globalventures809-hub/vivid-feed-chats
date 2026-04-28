import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function ReturnButton({ to = "/app/feed", label }: { to?: string; label?: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate({ to })}
      className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition"
    >
      <ArrowLeft className="h-4 w-4" />
      {label ?? "Return"}
    </button>
  );
}
