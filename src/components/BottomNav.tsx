import { Link, useLocation } from "@tanstack/react-router";
import { Home, Compass, PlusSquare, MessageCircle, User } from "lucide-react";

const items = [
  { to: "/app/feed", label: "Feed", icon: Home },
  { to: "/app/explore", label: "Explore", icon: Compass },
  { to: "/app/post", label: "Post", icon: PlusSquare, primary: true },
  { to: "/app/chat", label: "Chat", icon: MessageCircle },
  { to: "/app/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 w-full max-w-[480px] border-t border-border bg-background/95 backdrop-blur">
      <ul className="flex items-stretch justify-around px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        {items.map((it) => {
          const active = pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <li key={it.to} className="flex-1">
              <Link
                to={it.to}
                className="flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium"
              >
                <span
                  className={
                    it.primary
                      ? "rounded-xl brand-gradient text-brand-foreground p-1.5 shadow-brand"
                      : active
                        ? "text-brand"
                        : "text-muted-foreground"
                  }
                >
                  <Icon className={it.primary ? "h-6 w-6" : "h-5 w-5"} />
                </span>
                <span className={active ? "text-brand" : "text-muted-foreground"}>
                  {it.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
