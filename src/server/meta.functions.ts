import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestHeader } from "@tanstack/react-start/server";

export const captureSignupMeta = createServerFn({ method: "GET" }).handler(
  async () => {
    let ip =
      getRequestHeader("cf-connecting-ip") ||
      getRequestHeader("x-real-ip") ||
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
      null;
    const userAgent = getRequestHeader("user-agent") ?? null;
    if (!ip) {
      try {
        const req = getRequest();
        // @ts-expect-error - cf may exist on cloudflare workers
        ip = req?.cf?.ip ?? null;
      } catch {
        // ignore
      }
    }
    return { ip, userAgent };
  },
);
