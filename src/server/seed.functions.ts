import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SAMPLE_VIDEOS } from "@/lib/sample-videos";

const SEED_AUTHOR_EMAIL = "seed@feedbot.local";
const SEED_AUTHOR_NAME = "FeedBot";
const SEED_AUTHOR_USERNAME = "feedbot";

async function ensureSeedAuthorId(): Promise<string> {
  // Try find by username first.
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", SEED_AUTHOR_USERNAME)
    .maybeSingle();
  if (existing?.id) return existing.id;

  // Create an auth user (admin) for the seed author.
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email: SEED_AUTHOR_EMAIL,
    email_confirm: true,
    password: crypto.randomUUID(),
    user_metadata: { seed: true },
  });
  if (error || !created.user) {
    // Maybe already exists; look up via list (rare path).
    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
    const found = list.users.find((u) => u.email === SEED_AUTHOR_EMAIL);
    if (!found) throw new Error("Cannot create seed author: " + error?.message);
    await supabaseAdmin
      .from("profiles")
      .upsert({
        id: found.id,
        username: SEED_AUTHOR_USERNAME,
        name: SEED_AUTHOR_NAME,
        bio: "Curating cool clips for your feed.",
        photo_url: `https://api.dicebear.com/9.x/shapes/svg?seed=${SEED_AUTHOR_USERNAME}`,
        setup_complete: true,
      });
    return found.id;
  }
  await supabaseAdmin
    .from("profiles")
    .upsert({
      id: created.user.id,
      username: SEED_AUTHOR_USERNAME,
      name: SEED_AUTHOR_NAME,
      bio: "Curating cool clips for your feed.",
      photo_url: `https://api.dicebear.com/9.x/shapes/svg?seed=${SEED_AUTHOR_USERNAME}`,
      setup_complete: true,
    });
  return created.user.id;
}

export const seedFeedIfEmpty = createServerFn({ method: "POST" }).handler(
  async () => {
    const { count } = await supabaseAdmin
      .from("videos")
      .select("*", { count: "exact", head: true });
    if ((count ?? 0) > 0) return { seeded: false, count: count ?? 0 };

    const authorId = await ensureSeedAuthorId();
    const rows = SAMPLE_VIDEOS.map((v) => ({
      author_id: authorId,
      video_url: v.url,
      caption: v.caption,
      aspect_ratio: v.aspect,
    }));
    const { error } = await supabaseAdmin.from("videos").insert(rows);
    if (error) throw new Error(error.message);
    return { seeded: true, count: rows.length };
  },
);
