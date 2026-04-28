import { createFileRoute } from "@tanstack/react-router";
import { ReturnButton } from "@/components/ReturnButton";
import { Compass } from "lucide-react";

export const Route = createFileRoute("/app/explore")({ component: Explore });

function Explore() {
  return (
    <div className="min-h-[calc(100dvh-5rem)] flex flex-col items-center justify-center gap-4 p-8 text-center">
      <Compass className="h-12 w-12 text-brand" />
      <h1 className="text-2xl font-bold">Explore</h1>
      <p className="text-muted-foreground text-sm max-w-xs">Coming next — discover trending creators and tags.</p>
      <ReturnButton />
    </div>
  );
}
