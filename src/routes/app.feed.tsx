import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { seedFeedIfEmpty } from "@/server/seed.functions";
import { useQuery } from "@tanstack/react-query";
import { VideoCard } from "@/components/feed/VideoCard";
import { CommentSheet } from "@/components/feed/CommentSheet";

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentVideoId, setCommentVideoId] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: videos, refetch, isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const initial = await fetchFeed();
      if (initial.length === 0) {
        await seedFeedIfEmpty();
        return await fetchFeed();
      }
      return initial;
    },
  });

  // Track which card is centered using IntersectionObserver
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

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="flex h-dvh items-center justify-center text-muted-foreground p-8 text-center">
        No videos yet. Pull down to refresh.
      </div>
    );
  }

  return (
    <>
      <div className="absolute top-3 right-3 z-20 flex gap-1">
        {[1, 1.5, 2].map((r) => (
          <button
            key={r}
            onClick={() => setPlaybackRate(r)}
            className={`text-xs font-bold px-2 py-1 rounded-full backdrop-blur ${
              playbackRate === r
                ? "bg-brand text-brand-foreground"
                : "bg-black/40 text-white"
            }`}
          >
            {r}x
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        className="feed-snap no-scrollbar overflow-y-scroll h-[calc(100dvh-5rem)]"
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
              shouldPreload={Math.abs(idx - activeIndex) <= 5}
              currentUserId={user?.id ?? null}
              playbackRate={playbackRate}
              onOpenComments={() => setCommentVideoId(v.id)}
              onChanged={() => refetch()}
            />
          </div>
        ))}
      </div>

      {commentVideoId && (
        <CommentSheet
          videoId={commentVideoId}
          currentUserId={user?.id ?? null}
          onClose={() => setCommentVideoId(null)}
        />
      )}
    </>
  );
}
