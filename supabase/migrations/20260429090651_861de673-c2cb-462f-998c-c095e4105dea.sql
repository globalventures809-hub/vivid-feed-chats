-- App settings (e.g. cached PESAPAL_IPN_ID)
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings_select_all" ON public.app_settings FOR SELECT TO authenticated USING (true);

-- Verified badge on profiles (server-managed only)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_until TIMESTAMPTZ;

-- Boosts (server-managed via service role; clients only read)
CREATE TABLE public.boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id UUID,
  tier TEXT NOT NULL,
  country TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boosts_select_all" ON public.boosts FOR SELECT TO authenticated USING (true);

-- KYC verifications (server-managed)
CREATE TABLE public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tier TEXT NOT NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verifications_select_own" ON public.verifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Payments (Pesapal)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind TEXT NOT NULL, -- 'boost' | 'verification'
  tier TEXT NOT NULL,
  billing TEXT NOT NULL, -- 'monthly' | 'yearly'
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  video_id UUID,
  country TEXT,
  duration_days INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|paid|failed
  pesapal_order_tracking_id TEXT,
  pesapal_merchant_reference TEXT UNIQUE,
  redirect_url TEXT,
  raw_status JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select_own" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_tracking ON public.payments(pesapal_order_tracking_id);
CREATE INDEX idx_boosts_active ON public.boosts(active, ends_at);
CREATE INDEX idx_verifications_active ON public.verifications(active, ends_at);

CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_app_settings_updated_at BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Function to expire boosts and verifications (called by server periodically / on read)
CREATE OR REPLACE FUNCTION public.expire_boosts_and_verifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.boosts SET active = false WHERE active = true AND ends_at < now();
  UPDATE public.verifications SET active = false WHERE active = true AND ends_at < now();
  UPDATE public.profiles SET verified = false
    WHERE verified = true AND (verified_until IS NULL OR verified_until < now());
END;
$$;