import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { MessageCircle, Search, UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/explore")({ component: Explore });

type Row = {
  id: string;
  username: string | null;
  name: string | null;
  photo_url: string | null;
  country: string | null;
  bio: string | null;
};

function Explore() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data }, follows] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, name, photo_url, country, bio")
          .eq("setup_complete", true)
          .order("created_at", { ascending: false })
          .limit(200),
        user
          ? supabase.from("follows").select("following_id").eq("follower_id", user.id)
          : Promise.resolve({ data: [] as { following_id: string }[] }),
      ]);
      setRows(((data ?? []) as Row[]).filter((r) => r.id !== user?.id));
      setFollowingSet(new Set((follows.data ?? []).map((f) => f.following_id)));
      setLoading(false);
    })();
  }, [user]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      (r) =>
        r.username?.toLowerCase().includes(t) ||
        r.name?.toLowerCase().includes(t) ||
        r.bio?.toLowerCase().includes(t),
    );
  }, [rows, q]);

  const toggleFollow = async (id: string) => {
    if (!user) return toast.error("Sign in required");
    const isFollowing = followingSet.has(id);
    const next = new Set(followingSet);
    if (isFollowing) {
      next.delete(id);
      setFollowingSet(next);
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", id);
    } else {
      next.add(id);
      setFollowingSet(next);
      await supabase.from("follows").insert({ follower_id: user.id, following_id: id });
      toast.success("Followed");
    }
  };

  const message = (id: string) => {
    toast.info("Chat coming soon");
    navigate({ to: "/app/chat" });
  };

  return (
    <div className="min-h-[calc(100dvh-5rem)] bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="text-xl font-bold mb-2">Explore</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people"
            className="w-full bg-muted rounded-full pl-9 pr-4 py-2 text-sm outline-none"
          />
        </div>
      </div>

      <ul className="divide-y divide-border">
        {loading && (
          <li className="p-6 text-center text-sm text-muted-foreground">Loading…</li>
        )}
        {!loading && filtered.length === 0 && (
          <li className="p-6 text-center text-sm text-muted-foreground">No users yet.</li>
        )}
        {filtered.map((r) => {
          const isFollowing = followingSet.has(r.id);
          return (
            <li key={r.id} className="flex items-center gap-3 px-4 py-3">
              <Link to="/app/profile/$id" params={{ id: r.id }} className="shrink-0">
                {r.photo_url ? (
                  <img src={r.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-full brand-gradient" />
                )}
              </Link>
              <Link to="/app/profile/$id" params={{ id: r.id }} className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{r.name ?? "User"}</div>
                <div className="text-xs text-muted-foreground truncate">@{r.username ?? "user"}</div>
                {r.bio && <div className="text-xs text-muted-foreground truncate">{r.bio}</div>}
              </Link>
              <button
                onClick={() => message(r.id)}
                aria-label="Message"
                className="rounded-full border border-border p-2 hover:bg-accent"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => toggleFollow(r.id)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ${
                  isFollowing ? "bg-card border border-border" : "brand-gradient text-brand-foreground shadow-brand"
                }`}
              >
                {isFollowing ? (
                  <><UserCheck className="h-3 w-3" />Following</>
                ) : (
                  <><UserPlus className="h-3 w-3" />Follow</>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
