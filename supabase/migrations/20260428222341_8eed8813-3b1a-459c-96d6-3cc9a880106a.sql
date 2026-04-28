
-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  name TEXT,
  bio TEXT,
  photo_url TEXT,
  cover_url TEXT,
  country TEXT,
  location TEXT,
  setup_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SIGNUPS META
CREATE TABLE public.signups_meta (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  device_fingerprint TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.signups_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signups_meta_select_own" ON public.signups_meta FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "signups_meta_insert_own" ON public.signups_meta FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- VIDEOS
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  aspect_ratio NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos_select_all" ON public.videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "videos_insert_own" ON public.videos FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "videos_update_own" ON public.videos FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "videos_delete_own" ON public.videos FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- LIKES
CREATE TABLE public.likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_select_all" ON public.likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "likes_insert_own" ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON public.likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- COMMENTS (threaded)
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select_all" ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert_own" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update_own" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_comments_video ON public.comments(video_id, created_at DESC);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);

-- COMMENT LIKES
CREATE TABLE public.comment_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, comment_id)
);
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comment_likes_select_all" ON public.comment_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "comment_likes_insert_own" ON public.comment_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comment_likes_delete_own" ON public.comment_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FOLLOWS
CREATE TABLE public.follows (
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_select_all" ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- SAVES
CREATE TABLE public.saves (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saves_select_own" ON public.saves FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "saves_insert_own" ON public.saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saves_delete_own" ON public.saves FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RESHARES
CREATE TABLE public.reshares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reshares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reshares_select_all" ON public.reshares FOR SELECT TO authenticated USING (true);
CREATE POLICY "reshares_insert_own" ON public.reshares FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reshares_delete_own" ON public.reshares FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
