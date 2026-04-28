import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { seedFeedIfEmpty } from "@/server/seed.functions";
import { useQuery } from "@tanstack/react-query";
import { VideoCard } from "@/components/feed/VideoCard";
import { CommentSheet } from "@/components/feed/CommentSheet";
import { useNetwork, pickPreloadStrategy } from "@/lib/network";
import { WifiOff, Gauge } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/app/feed")({
  component: FeedPage,
});

export type FeedVideo = {
  id: string;
  video_url: string;
  caption: string | null;
  aspect_ratio: number | null;
  author_id: string;
  created_at: string;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    photo_url: string | null;
    bio: string | null;
  } | null;
};

async function fetchFeed(): Promise<FeedVideo[]> {
  const { data, error } = await supabase
    .from("videos")
    .select(`
      id, video_url, caption, aspect_ratio, author_id, created_at,
      author:profiles!videos_author_id_fkey ( id, name, username, photo_url, bio )
    `)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as FeedVideo[];
}

function FeedPage() {
  const { user } = useAuth();
  const network = useNetwork();
  const strategy = pickPreloadStrategy(network);
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentVideoId, setCommentVideoId] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeed, setShowSpeed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: videos, refetch, isLoading, error } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const initial = await fetchFeed();
      if (initial.length === 0) {
        await seedFeedIfEmpty();
        return await fetchFeed();
      }
      return initial;
    },
    retry: 1,
  });

  // Re-fetch when we come back online
  useEffect(() => {
    if (network.online && error) refetch();
  }, [network.online, error, refetch]);

  const onItemRef = useCallback(
    (idx: number) => (el: HTMLDivElement | null) => {
      if (!el || !containerRef.current) return;
      el.dataset.index = String(idx);
    },
    [],
  );
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const i = Number((e.target as HTMLElement).dataset.index ?? -1);
            if (i >= 0) setActiveIndex(i);
          }
        });
      },
      { root, threshold: [0, 0.6, 1] },
    );
    root.querySelectorAll("[data-index]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [videos]);

  return (
    <div className="relative h-[calc(100dvh-5rem)]">
      {/* Offline / slow network banner */}
      <AnimatePresence>
        {!network.online && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="absolute top-2 left-2 right-2 z-30 rounded-xl bg-destructive/90 text-destructive-foreground px-3 py-2 text-xs font-semibold flex items-center gap-2 shadow-lg"
          >
            <WifiOff className="h-4 w-4" />
            You're offline. Showing what we already loaded — feed will refresh when you're back online.
          </motion.div>
        )}
        {network.online && strategy.qualityHint === "low" && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="absolute top-2 left-2 right-2 z-30 rounded-xl bg-card/80 backdrop-blur border border-border px-3 py-2 text-xs flex items-center gap-2"
          >
            <Gauge className="h-4 w-4 text-brand" />
            Slow network detected — using data-saver mode for smoother playback.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speed control (top-left, away from side actions) */}
      <div className="absolute top-3 left-3 z-20">
        <button
          onClick={() => setShowSpeed((s) => !s)}
          className="text-xs font-bold px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur text-white flex items-center gap-1"
        >
          <Gauge className="h-3 w-3" /> {playbackRate}x
        </button>
        {showSpeed && (
          <div className="mt-2 flex flex-col gap-1 bg-black/60 backdrop-blur rounded-xl p-1">
            {[1, 1.25, 1.5, 2].map((r) => (
              <button
                key={r}
                onClick={() => { setPlaybackRate(r); setShowSpeed(false); }}
                className={`text-xs font-bold px-3 py-1 rounded-lg ${
                  playbackRate === r ? "bg-brand text-brand-foreground" : "text-white"
                }`}
              >
                {r}x
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      ) : !videos || videos.length === 0 ? (
        <div className="flex h-full items-center justify-center text-muted-foreground p-8 text-center">
          {network.online
            ? "No videos yet. Pull down to refresh."
            : "You're offline and no videos are cached yet. Reconnect to load the feed."}
        </div>
      ) : (
        <div
          ref={containerRef}
          className="feed-snap no-scrollbar overflow-y-scroll h-full"
        >
          {videos.map((v, idx) => (
            <div
              key={v.id}
              ref={onItemRef(idx)}
              data-index={idx}
              className="h-[calc(100dvh-5rem)] w-full"
            >
              <VideoCard
                video={v}
                isActive={idx === activeIndex}
                shouldPreload={Math.abs(idx - activeIndex) <= strategy.preloadAhead}
                preloadMode={strategy.preload}
                currentUserId={user?.id ?? null}
                playbackRate={playbackRate}
                onOpenComments={() => setCommentVideoId(v.id)}
                onChanged={() => refetch()}
              />
            </div>
          ))}
        </div>
      )}

      {commentVideoId && (
        <CommentSheet
          videoId={commentVideoId}
          currentUserId={user?.id ?? null}
          onClose={() => setCommentVideoId(null)}
        />
      )}
    </div>
  );
}
