import { useEffect, useState } from "react";

type ConnectionInfo = {
  online: boolean;
  /** Effective network type: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown' */
  effectiveType: string;
  /** Downlink in Mbps (best effort), null if unknown */
  downlink: number | null;
  /** Whether the user has asked the browser to save data */
  saveData: boolean;
};

type NavigatorWithConnection = Navigator & {
  connection?: {
    effectiveType?: string;
    downlink?: number;
    saveData?: boolean;
    addEventListener?: (type: string, listener: () => void) => void;
    removeEventListener?: (type: string, listener: () => void) => void;
  };
};

function read(): ConnectionInfo {
  if (typeof navigator === "undefined") {
    return { online: true, effectiveType: "unknown", downlink: null, saveData: false };
  }
  const conn = (navigator as NavigatorWithConnection).connection;
  return {
    online: navigator.onLine,
    effectiveType: conn?.effectiveType ?? "unknown",
    downlink: typeof conn?.downlink === "number" ? conn.downlink : null,
    saveData: !!conn?.saveData,
  };
}

export function useNetwork(): ConnectionInfo {
  const [info, setInfo] = useState<ConnectionInfo>(() => read());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setInfo(read());
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const conn = (navigator as NavigatorWithConnection).connection;
    conn?.addEventListener?.("change", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      conn?.removeEventListener?.("change", update);
    };
  }, []);

  return info;
}

/** Translate a connection into a recommended video preload strategy. */
export function pickPreloadStrategy(info: ConnectionInfo): {
  preload: "none" | "metadata" | "auto";
  preloadAhead: number;
  qualityHint: "low" | "medium" | "high";
} {
  if (!info.online) return { preload: "none", preloadAhead: 0, qualityHint: "low" };
  if (info.saveData) return { preload: "metadata", preloadAhead: 1, qualityHint: "low" };
  switch (info.effectiveType) {
    case "slow-2g":
    case "2g":
      return { preload: "metadata", preloadAhead: 1, qualityHint: "low" };
    case "3g":
      return { preload: "metadata", preloadAhead: 2, qualityHint: "medium" };
    case "4g":
      return { preload: "auto", preloadAhead: 5, qualityHint: "high" };
    default:
      return { preload: "auto", preloadAhead: 3, qualityHint: "high" };
  }
}
