import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "sonner";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#1f3a2a" },
      { title: "Verde — Share your moment" },
      { name: "description", content: "Verde is a tiny green social app for short videos and chats." },
      { property: "og:title", content: "Verde — Share your moment" },
      { property: "og:description", content: "Verde is a tiny green social app for short videos and chats." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Verde — Share your moment" },
      { name: "twitter:description", content: "Verde is a tiny green social app for short videos and chats." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1ebd77d8-7e18-4d9f-93f1-b3cc1e4dd1e2/id-preview-3daee2a8--79e1a881-7fd7-4ef5-b63a-baeebbb7dffb.lovable.app-1777416301850.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1ebd77d8-7e18-4d9f-93f1-b3cc1e4dd1e2/id-preview-3daee2a8--79e1a881-7fd7-4ef5-b63a-baeebbb7dffb.lovable.app-1777416301850.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-5xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found.</p>
      </div>
    </div>
  ),
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    const onCtx = (e: MouseEvent) => e.preventDefault();
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.clipboardData?.setData("text/plain", "Copying is disabled on Verde.");
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["c", "x", "a", "s", "p"].includes(e.key.toLowerCase())) {
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || t?.isContentEditable) return;
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", onCtx);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCopy);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="app-shell">
          <Outlet />
        </div>
        <Toaster position="top-center" theme="dark" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
