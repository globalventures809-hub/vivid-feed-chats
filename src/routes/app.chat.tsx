import { createFileRoute } from "@tanstack/react-router";
import { ReturnButton } from "@/components/ReturnButton";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/app/chat")({ component: Chat });

function Chat() {
  return (
    <div className="min-h-[calc(100dvh-5rem)] flex flex-col items-center justify-center gap-4 p-8 text-center">
      <MessageCircle className="h-12 w-12 text-brand" />
      <h1 className="text-2xl font-bold">Chat</h1>
      <p className="text-muted-foreground text-sm max-w-xs">Coming next — DMs with friends.</p>
      <ReturnButton />
    </div>
  );
}
