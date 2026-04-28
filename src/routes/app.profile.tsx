import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES } from "@/lib/countries";
import { LogOut, MapPin, Settings } from "lucide-react";

export const Route = createFileRoute("/app/profile")({
  component: MyProfile,
});

function MyProfile() {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ followers: 0, following: 0, videos: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [followers, following, videos] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("author_id", user.id),
      ]);
      setCounts({
        followers: followers.count ?? 0,
        following: following.count ?? 0,
        videos: videos.count ?? 0,
      });
    })();
  }, [user]);

  const country = COUNTRIES.find((c) => c.code === profile?.country);

  return (
    <div className="bg-background pb-16">
      <div className="relative h-40">
        {profile?.cover_url ? (
          <img src={profile.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full screen-gradient" />
        )}
        <button
          onClick={() => navigate({ to: "/setup" })}
          className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
      <div className="-mt-12 flex flex-col items-center px-6">
        {profile?.photo_url ? (
          <img src={profile.photo_url} alt="" className="h-24 w-24 rounded-full border-4 border-background object-cover" />
        ) : (
          <div className="h-24 w-24 rounded-full border-4 border-background brand-gradient" />
        )}
        <h2 className="mt-3 text-xl font-bold">{profile?.name ?? "Your name"}</h2>
        <p className="text-sm text-muted-foreground">@{profile?.username ?? "username"}</p>
        {(country || profile?.location) && (
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {country?.flag} {country?.name}{profile?.location ? `, ${profile.location}` : ""}
          </p>
        )}
        <div className="mt-5 flex gap-8 text-center">
          <Stat n={counts.videos} label="Videos" />
          <Stat n={counts.followers} label="Followers" />
          <Stat n={counts.following} label="Following" />
        </div>
        <button
          onClick={async () => { await signOut(); navigate({ to: "/welcome" }); }}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="text-lg font-bold">{n}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
