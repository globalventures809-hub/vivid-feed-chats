import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Bookmark, Share2, UserPlus, UserCheck, Play } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { FeedVideo } from "@/routes/app.feed";

type Counts = { likes: number; comments: number; saves: number; reshares: number };

export function VideoCard({
  video,
  isActive,
  shouldPreload,
  preloadMode = "auto",
  currentUserId,
  playbackRate,
  onOpenComments,
  onChanged,
}: {
  video: FeedVideo;
  isActive: boolean;
  shouldPreload: boolean;
  preloadMode?: "none" | "metadata" | "auto";
  currentUserId: string | null;
  playbackRate: number;
  onOpenComments: () => void;
  onChanged: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [counts, setCounts] = useState<Counts>({ likes: 0, comments: 0, saves: 0, reshares: 0 });
  const [pulse, setPulse] = useState(false);
  const [paused, setPaused] = useState(false);

  // Load counts + my-state
  useEffect(() => {
    let alive = true;
    (async () => {
      const [likes, comments, reshares, myLike, mySave, myFollow] = await Promise.all([
        supabase.from("likes").select("*", { count: "exact", head: true }).eq("video_id", video.id),
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("video_id", video.id),
        supabase.from("reshares").select("*", { count: "exact", head: true }).eq("video_id", video.id),
        currentUserId
          ? supabase.from("likes").select("user_id").eq("video_id", video.id).eq("user_id", currentUserId).maybeSingle()
          : Promise.resolve({ data: null }),
        currentUserId
          ? supabase.from("saves").select("user_id").eq("video_id", video.id).eq("user_id", currentUserId).maybeSingle()
          : Promise.resolve({ data: null }),
        currentUserId && video.author_id !== currentUserId
          ? supabase.from("follows").select("follower_id").eq("follower_id", currentUserId).eq("following_id", video.author_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (!alive) return;
      setCounts({
        likes: likes.count ?? 0,
        comments: comments.count ?? 0,
        saves: 0,
        reshares: reshares.count ?? 0,
      });
      setLiked(!!myLike.data);
      setSaved(!!mySave.data);
      setFollowing(!!myFollow.data);
    })();
    return () => { alive = false; };
  }, [video.id, currentUserId, video.author_id]);

  // Autoplay/pause
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.playbackRate = playbackRate;
    if (isActive && !paused) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [isActive, paused, playbackRate]);

  const toggleLike = async () => {
    if (!currentUserId) return toast.error("Sign in required");
    if (liked) {
      setLiked(false);
      setCounts((c) => ({ ...c, likes: Math.max(0, c.likes - 1) }));
      await supabase.from("likes").delete().eq("video_id", video.id).eq("user_id", currentUserId);
    } else {
      setLiked(true);
      setCounts((c) => ({ ...c, likes: c.likes + 1 }));
      setPulse(true);
      setTimeout(() => setPulse(false), 500);
      await supabase.from("likes").insert({ video_id: video.id, user_id: currentUserId });
    }
  };

  const toggleSave = async () => {
    if (!currentUserId) return toast.error("Sign in required");
    if (saved) {
      setSaved(false);
      await supabase.from("saves").delete().eq("video_id", video.id).eq("user_id", currentUserId);
    } else {
      setSaved(true);
      await supabase.from("saves").insert({ video_id: video.id, user_id: currentUserId });
    }
  };

  const reshare = async () => {
    if (!currentUserId) return toast.error("Sign in required");
    setCounts((c) => ({ ...c, reshares: c.reshares + 1 }));
    await supabase.from("reshares").insert({ video_id: video.id, user_id: currentUserId });
    toast.success("Reshared to your profile");
    onChanged();
  };

  const toggleFollow = async () => {
    if (!currentUserId) return toast.error("Sign in required");
    if (following) {
      setFollowing(false);
      await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", video.author_id);
    } else {
      setFollowing(true);
      await supabase.from("follows").insert({ follower_id: currentUserId, following_id: video.author_id });
    }
  };

  // Render caption with hashtags & mentions highlighted
  const renderCaption = (text: string | null) => {
    if (!text) return null;
    return text.split(/(\s+)/).map((part, i) => {
      if (/^#\w+/.test(part)) return <span key={i} className="text-brand font-semibold">{part}</span>;
      if (/^@\w+/.test(part)) return <span key={i} className="text-brand font-semibold">{part}</span>;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="relative h-full w-full bg-black overflow-hidden" onClick={() => setPaused((p) => !p)}>
      <video
        ref={ref}
        src={shouldPreload ? video.video_url : undefined}
        data-src={video.video_url}
        playsInline
        loop
        muted={false}
        preload={shouldPreload ? (isActive ? "auto" : preloadMode) : "none"}
        className="absolute inset-0 m-auto max-h-full max-w-full"
        style={{ aspectRatio: video.aspect_ratio ?? 9 / 16 }}
      />

      {paused && isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Play className="h-20 w-20 text-white/80" fill="currentColor" />
        </div>
      )}

      <AnimatePresence>
        {pulse && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 m-auto h-32 w-32 pointer-events-none"
          >
            <Heart className="h-32 w-32 text-brand" fill="currentColor" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom info */}
      <div className="absolute bottom-4 left-4 right-20 z-10 text-white space-y-2">
        <Link
          to="/app/profile/$id"
          params={{ id: video.author_id }}
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {video.author?.photo_url ? (
            <img src={video.author.photo_url} alt="" className="h-9 w-9 rounded-full border-2 border-white object-cover" />
          ) : (
            <div className="h-9 w-9 rounded-full brand-gradient" />
          )}
          <div className="text-sm">
            <div className="font-bold">{video.author?.name ?? "User"}</div>
            <div className="text-xs opacity-80">@{video.author?.username ?? "user"}</div>
          </div>
          {currentUserId && currentUserId !== video.author_id && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFollow(); }}
              className={`ml-2 rounded-full px-3 py-1 text-xs font-bold ${
                following ? "bg-white/20 text-white" : "brand-gradient text-brand-foreground"
              }`}
            >
              {following ? <><UserCheck className="h-3 w-3 inline mr-1" />Following</> : <><UserPlus className="h-3 w-3 inline mr-1" />Follow</>}
            </button>
          )}
        </Link>
        <div className="text-sm leading-snug">{renderCaption(video.caption)}</div>
      </div>

      {/* Side actions */}
      <div className="absolute right-3 bottom-6 z-10 flex flex-col items-center gap-5 text-white" onClick={(e) => e.stopPropagation()}>
        <ActionButton icon={<Heart fill={liked ? "currentColor" : "none"} className={liked ? "text-brand" : "text-white"} />} label={fmt(counts.likes)} onClick={toggleLike} active={liked} />
        <ActionButton icon={<MessageCircle />} label={fmt(counts.comments)} onClick={onOpenComments} />
        <ActionButton icon={<Bookmark fill={saved ? "currentColor" : "none"} className={saved ? "text-brand" : "text-white"} />} label="Save" onClick={toggleSave} active={saved} />
        <ActionButton icon={<Share2 />} label={fmt(counts.reshares)} onClick={reshare} />
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <span className={`rounded-full p-2 backdrop-blur ${active ? "bg-brand/20" : "bg-black/30"}`}>{icon}</span>
      <span className="text-[11px] font-semibold">{label}</span>
    </button>
  );
}

function fmt(n: number) {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return (n / 1000).toFixed(1) + "K";
  return (n / 1_000_000).toFixed(1) + "M";
}
