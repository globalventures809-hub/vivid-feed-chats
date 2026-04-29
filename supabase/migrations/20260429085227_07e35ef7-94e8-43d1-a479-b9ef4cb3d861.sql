DO $$
DECLARE
  bot_id uuid := '00000000-0000-4000-8000-0000feedb007';
  v_url text;
  v_caption text;
  v_aspect numeric;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = bot_id) THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, is_sso_user
    ) VALUES (
      bot_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'feedbot@verde.local', crypt(gen_random_uuid()::text, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"seed":true}'::jsonb, false, false
    );
  END IF;

  INSERT INTO public.profiles (id, username, name, bio, photo_url, setup_complete)
  VALUES (bot_id, 'feedbot', 'FeedBot', 'Curating cool clips for your feed.',
          'https://api.dicebear.com/9.x/shapes/svg?seed=feedbot', true)
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    name = EXCLUDED.name,
    bio = EXCLUDED.bio,
    photo_url = EXCLUDED.photo_url,
    setup_complete = true;

  IF NOT EXISTS (SELECT 1 FROM public.videos LIMIT 1) THEN
    FOR v_url, v_caption, v_aspect IN
      SELECT * FROM (VALUES
        ('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'Big bunny vibes 🐰 #cinema #classic', 16.0/9.0),
        ('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'Dream sequence 🌙 #animation #art', 16.0/9.0),
        ('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'When the beat drops 🔥 #fyp #music', 16.0/9.0),
        ('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'Escape mode activated ✈️ #travel #wanderlust', 16.0/9.0),
        ('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'Sunday energy ☀️ #fun #weekend', 16.0/9.0),
        ('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'Take the long road 🛣️ #cars #vibes', 16.0/9.0),
        ('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'Just a meltdown moment 😅 #relatable', 16.0/9.0),
        ('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 'Epic adventure 🗡️ #fantasy #shorts', 16.0/9.0)
      ) AS t(u, c, a)
    LOOP
      INSERT INTO public.videos (author_id, video_url, caption, aspect_ratio)
      VALUES (bot_id, v_url, v_caption, v_aspect);
    END LOOP;
  END IF;
END $$;