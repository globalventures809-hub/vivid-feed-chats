// Pesapal API helpers — server only. Live endpoints.
// Docs: https://developer.pesapal.com/

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PESAPAL_BASE = "https://pay.pesapal.com/v3";

type TokenCache = { token: string; expiresAt: number };
let _tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  if (_tokenCache && _tokenCache.expiresAt > Date.now() + 30_000) {
    return _tokenCache.token;
  }
  const key = process.env.PESAPAL_CONSUMER_KEY;
  const secret = process.env.PESAPAL_CONSUMER_SECRET;
  if (!key || !secret) throw new Error("Pesapal credentials are not configured");

  const res = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ consumer_key: key, consumer_secret: secret }),
  });
  const json: any = await res.json();
  if (!res.ok || !json.token) {
    throw new Error(`Pesapal auth failed: ${JSON.stringify(json)}`);
  }
  _tokenCache = {
    token: json.token,
    // Pesapal tokens last ~5 minutes
    expiresAt: Date.now() + 4 * 60 * 1000,
  };
  return json.token;
}

async function pesapalFetch(path: string, init: RequestInit = {}): Promise<any> {
  const token = await getAccessToken();
  const res = await fetch(`${PESAPAL_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(`Pesapal ${path} failed [${res.status}]: ${text}`);
  return json;
}

// Get (or register) the IPN ID and cache it in app_settings.
export async function getOrRegisterIpnId(siteOrigin: string): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "PESAPAL_IPN_ID")
    .maybeSingle();
  if (existing?.value) return existing.value;

  const ipnUrl = `${siteOrigin}/api/public/pesapal-ipn`;
  const reg = await pesapalFetch("/api/URLSetup/RegisterIPN", {
    method: "POST",
    body: JSON.stringify({ url: ipnUrl, ipn_notification_type: "GET" }),
  });
  const ipnId = reg.ipn_id || reg.ipnId;
  if (!ipnId) throw new Error(`Pesapal IPN registration returned no id: ${JSON.stringify(reg)}`);

  await supabaseAdmin
    .from("app_settings")
    .upsert({ key: "PESAPAL_IPN_ID", value: ipnId });
  return ipnId;
}

export type SubmitOrderInput = {
  merchantReference: string;
  amount: number;
  currency: string;
  description: string;
  callbackUrl: string;
  notificationId: string;
  email?: string;
};

export async function submitOrder(input: SubmitOrderInput) {
  const body = {
    id: input.merchantReference,
    currency: input.currency,
    amount: input.amount,
    description: input.description.slice(0, 100),
    callback_url: input.callbackUrl,
    notification_id: input.notificationId,
    billing_address: {
      email_address: input.email || "user@example.com",
      first_name: "User",
      last_name: "Verde",
    },
  };
  return pesapalFetch("/api/Transactions/SubmitOrderRequest", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getTransactionStatus(orderTrackingId: string) {
  return pesapalFetch(
    `/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
    { method: "GET" }
  );
}
