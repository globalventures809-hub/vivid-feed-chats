import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, MapPin, UserCheck, UserPlus } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export const Route = createFileRoute("/app/profile/$id")({
  component: UserProfile,
});

type Profile = {
  id: string; username: string | null; name: string | null; bio: string | null;
  photo_url: string | null; cover_url: string | null; country: string | null; location: string | null;
  verified?: boolean | null;
};

function UserProfile() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [counts, setCounts] = useState({ followers: 0, following: 0, videos: 0 });
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: p }, followers, followingCt, videos, myFollow] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", id),
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("author_id", id),
        user ? supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      setProfile((p as Profile) ?? null);
      setCounts({ followers: followers.count ?? 0, following: followingCt.count ?? 0, videos: videos.count ?? 0 });
      setFollowing(!!myFollow.data);
    })();
  }, [id, user]);

  const toggle = async () => {
    if (!user) return;
    if (following) {
      setFollowing(false); setCounts((c) => ({ ...c, followers: Math.max(0, c.followers - 1) }));
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", id);
    } else {
      setFollowing(true); setCounts((c) => ({ ...c, followers: c.followers + 1 }));
      await supabase.from("follows").insert({ follower_id: user.id, following_id: id });
    }
  };

  const country = COUNTRIES.find((c) => c.code === profile?.country);

  return (
    <div className="bg-background pb-16">
      <div className="relative h-44 w-full overflow-hidden">
        {profile?.cover_url
          ? <img src={profile.cover_url} alt="" className="h-full w-full object-cover" />
          : <div className="h-full w-full screen-gradient" />}
        <button onClick={() => navigate({ to: "/app/feed" })} className="absolute left-3 top-3 rounded-full bg-black/40 p-2 text-white">
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>
      <div className="relative z-10 -mt-14 flex flex-col items-center px-6">
        {profile?.photo_url
          ? <img src={profile.photo_url} alt="" className="h-28 w-28 rounded-full border-4 border-background object-cover bg-background shadow-lg" />
          : <div className="h-28 w-28 rounded-full border-4 border-background brand-gradient shadow-lg" />}
        <h2 className="mt-3 text-xl font-bold inline-flex items-center gap-1.5">
          {profile?.name ?? "User"}
          {profile?.verified && <VerifiedBadge size={18} />}
        </h2>
        <p className="text-sm text-muted-foreground">@{profile?.username ?? "user"}</p>
        {profile?.bio && <p className="mt-2 text-sm text-center max-w-xs">{profile.bio}</p>}
        {(country || profile?.location) && (
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />{country?.flag} {country?.name}{profile?.location ? `, ${profile.location}` : ""}
          </p>
        )}
        <div className="mt-5 flex gap-8 text-center">
          <div><div className="text-lg font-bold">{counts.videos}</div><div className="text-xs text-muted-foreground">Videos</div></div>
          <div><div className="text-lg font-bold">{counts.followers}</div><div className="text-xs text-muted-foreground">Followers</div></div>
          <div><div className="text-lg font-bold">{counts.following}</div><div className="text-xs text-muted-foreground">Following</div></div>
        </div>
        {user && user.id !== id && (
          <button
            onClick={toggle}
            className={`mt-6 inline-flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold ${following ? "bg-card border border-border" : "brand-gradient text-brand-foreground shadow-brand"}`}
          >
            {following ? <><UserCheck className="h-4 w-4" />Following</> : <><UserPlus className="h-4 w-4" />Follow</>}
          </button>
        )}
      </div>
    </div>
  );
}
