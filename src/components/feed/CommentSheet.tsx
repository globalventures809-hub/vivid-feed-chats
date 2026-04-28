import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, X, Send, CornerDownRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Comment = {
  id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author: { username: string | null; name: string | null; photo_url: string | null } | null;
  like_count: number;
  liked_by_me: boolean;
  replies: Comment[];
};

const PAGE_SIZE = 20;

export function CommentSheet({
  videoId,
  currentUserId,
  onClose,
}: {
  videoId: string;
  currentUserId: string | null;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  const load = async (p: number) => {
    setLoading(true);
    const from = p * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("comments")
      .select(`id, user_id, parent_id, content, created_at,
               author:profiles!comments_user_id_fkey ( username, name, photo_url )`)
      .eq("video_id", videoId)
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) { toast.error(error.message); setLoading(false); return; }

    const tops = (data ?? []) as unknown as Comment[];
    const ids = tops.map((c) => c.id);

    // Fetch replies + likes counts in parallel
    const [{ data: replies }, { data: likes }] = await Promise.all([
      ids.length
        ? supabase.from("comments").select(`id, user_id, parent_id, content, created_at,
            author:profiles!comments_user_id_fkey ( username, name, photo_url )`).in("parent_id", ids).order("created_at", { ascending: true })
        : Promise.resolve({ data: [] }),
      supabase.from("comment_likes").select("comment_id, user_id").in("comment_id", [...ids]),
    ]);

    const allReplies = (replies ?? []) as unknown as Comment[];
    const replyIds = allReplies.map((r) => r.id);
    const { data: replyLikes } = replyIds.length
      ? await supabase.from("comment_likes").select("comment_id, user_id").in("comment_id", replyIds)
      : { data: [] as { comment_id: string; user_id: string }[] };

    const allLikes = [...(likes ?? []), ...(replyLikes ?? [])] as { comment_id: string; user_id: string }[];
    const likeCounts = new Map<string, number>();
    const myLikes = new Set<string>();
    for (const l of allLikes) {
      likeCounts.set(l.comment_id, (likeCounts.get(l.comment_id) ?? 0) + 1);
      if (l.user_id === currentUserId) myLikes.add(l.comment_id);
    }

    const enrich = (c: Comment): Comment => ({
      ...c,
      like_count: likeCounts.get(c.id) ?? 0,
      liked_by_me: myLikes.has(c.id),
      replies: allReplies.filter((r) => r.parent_id === c.id).map(enrich),
    });

    const enriched = tops.map(enrich);
    setComments((prev) => (p === 0 ? enriched : [...prev, ...enriched]));
    setHasMore(tops.length === PAGE_SIZE);
    setLoading(false);
  };

  useEffect(() => { load(0); /* eslint-disable-next-line */ }, [videoId]);

  const submit = async () => {
    if (!currentUserId) return toast.error("Sign in required");
    const content = text.trim();
    if (!content) return;
    if (content.length > 500) return toast.error("Too long (max 500)");
    const { error } = await supabase.from("comments").insert({
      video_id: videoId,
      user_id: currentUserId,
      parent_id: replyTo?.id ?? null,
      content,
    });
    if (error) return toast.error(error.message);
    setText("");
    setReplyTo(null);
    setPage(0);
    load(0);
  };

  const toggleCommentLike = async (c: Comment) => {
    if (!currentUserId) return toast.error("Sign in required");
    const update = (list: Comment[]): Comment[] =>
      list.map((x) => {
        if (x.id === c.id) {
          return { ...x, liked_by_me: !x.liked_by_me, like_count: x.like_count + (x.liked_by_me ? -1 : 1) };
        }
        return { ...x, replies: update(x.replies) };
      });
    setComments(update);
    if (c.liked_by_me) {
      await supabase.from("comment_likes").delete().eq("comment_id", c.id).eq("user_id", currentUserId);
    } else {
      await supabase.from("comment_likes").insert({ comment_id: c.id, user_id: currentUserId });
    }
  };

  const renderText = (s: string) =>
    s.split(/(\s+)/).map((p, i) =>
      /^[#@]\w+/.test(p) ? <span key={i} className="text-brand font-semibold">{p}</span> : <span key={i}>{p}</span>
    );

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 24, stiffness: 220 }}
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] h-[75dvh] bg-card border-t border-border rounded-t-3xl flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-bold">Comments</h3>
        <button onClick={onClose}><X className="h-5 w-5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 && !loading && (
          <p className="text-center text-sm text-muted-foreground">Be the first to comment.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="space-y-2">
            <CommentRow c={c} onLike={() => toggleCommentLike(c)} onReply={() => setReplyTo(c)} renderText={renderText} />
            {c.replies.length > 0 && (
              <div className="ml-10 space-y-2 border-l border-border pl-3">
                {c.replies.map((r) => (
                  <CommentRow key={r.id} c={r} onLike={() => toggleCommentLike(r)} onReply={() => setReplyTo(c)} renderText={renderText} compact />
                ))}
              </div>
            )}
          </div>
        ))}
        {hasMore && (
          <button
            disabled={loading}
            onClick={() => { const next = page + 1; setPage(next); load(next); }}
            className="w-full py-2 text-xs text-brand font-semibold"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        )}
      </div>

      {replyTo && (
        <div className="px-4 py-1 text-xs text-muted-foreground bg-muted flex items-center gap-2">
          <CornerDownRight className="h-3 w-3" /> Replying to @{replyTo.author?.username ?? "user"}
          <button className="ml-auto" onClick={() => setReplyTo(null)}><X className="h-3 w-3" /></button>
        </div>
      )}
      <div className="border-t border-border p-3 flex gap-2 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={replyTo ? "Reply…" : "Add a comment…"}
          maxLength={500}
          className="flex-1 bg-muted rounded-full px-4 py-2 outline-none text-sm"
        />
        <button onClick={submit} className="brand-gradient rounded-full p-2.5 text-brand-foreground"><Send className="h-4 w-4" /></button>
      </div>
    </motion.div>
  );
}

function CommentRow({
  c, onLike, onReply, renderText, compact,
}: {
  c: Comment;
  onLike: () => void;
  onReply: () => void;
  renderText: (s: string) => React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {c.author?.photo_url ? (
        <img src={c.author.photo_url} alt="" className={`${compact ? "h-6 w-6" : "h-8 w-8"} rounded-full object-cover`} />
      ) : (
        <div className={`${compact ? "h-6 w-6" : "h-8 w-8"} rounded-full brand-gradient`} />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">@{c.author?.username ?? "user"}</div>
        <div className="text-sm break-words">{renderText(c.content)}</div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <button onClick={onReply} className="hover:text-foreground">Reply</button>
          {c.replies?.length ? <span>{c.replies.length} {c.replies.length === 1 ? "reply" : "replies"}</span> : null}
        </div>
      </div>
      <button onClick={onLike} className="flex flex-col items-center text-xs">
        <Heart className={`h-4 w-4 ${c.liked_by_me ? "text-brand" : ""}`} fill={c.liked_by_me ? "currentColor" : "none"} />
        {c.like_count > 0 && <span className={c.liked_by_me ? "text-brand" : "text-muted-foreground"}>{c.like_count}</span>}
      </button>
    </div>
  );
}
