import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import ReportButton from "@/components/ReportButton";
import { getProfilePath } from "@/lib/profile";
import { resolveAvatarUrl } from "@/lib/storage";
import { useRateLimit, formatResetTime } from "@/hooks/useRateLimit";
import { isRateLimitError, getRateLimitMessage } from "@/lib/rateLimit";
import { useCatchComments, ThreadedComment } from "@/hooks/useCatchComments";
import { MessageSquareReply } from "lucide-react";

interface CatchCommentsProps {
  catchId: string;
  catchOwnerId: string;
  catchTitle?: string;
  currentUserId?: string | null;
  isAdmin?: boolean;
  targetCommentId?: string;
}

const highlightMentions = (text: string) => {
  const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
  return parts.map((part, index) => {
    if (part.startsWith("@")) {
      return (
        <span key={index} className="text-primary font-medium">
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

const INITIAL_VISIBLE_ROOTS = 10;
const LOAD_MORE_COUNT = 10;
// Visual indent: Facebook-style, two visual levels (root + replies all share one indent)
const REPLY_INDENT_PX = 14;
const REPLIES_PAGE_SIZE = 3;

export const CatchComments = memo(
  ({ catchId, catchOwnerId, catchTitle, currentUserId, isAdmin = false, targetCommentId }: CatchCommentsProps) => {
    function flattenReplies(
      root: ThreadedComment
    ): Array<ThreadedComment & { parentAuthor?: string; parentBodySnippet?: string; realDepth: number }> {
      const flat: Array<ThreadedComment & { parentAuthor?: string; parentBodySnippet?: string; realDepth: number }> =
        [];
      const walk = (
        node: ThreadedComment,
        realDepth: number,
        parentAuthor?: string,
        parentBodySnippet?: string
      ) => {
        node.children.forEach((child) => {
          const snippet =
            child.parent_comment_id === node.id && node.body
              ? `${node.body.slice(0, 80)}${node.body.length > 80 ? "…" : ""}`
              : parentBodySnippet;
          flat.push({ ...child, parentAuthor, parentBodySnippet: snippet, realDepth });
          walk(child, realDepth + 1, child.profiles?.username ?? parentAuthor, snippet);
        });
      };
      walk(root, 1, root.profiles?.username ?? undefined, undefined);
      return flat;
    }

    const { user } = useAuth();
    const { commentsTree, isLoading, refetch, addLocalComment, markLocalCommentDeleted } = useCatchComments(catchId);
    const [newComment, setNewComment] = useState("");
    const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
    const [activeReply, setActiveReply] = useState<string | null>(null);
    const [topLevelError, setTopLevelError] = useState<string | null>(null);
    const [replyErrors, setReplyErrors] = useState<Record<string, string | null>>({});
    const [isPosting, setIsPosting] = useState(false);
    const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
    const [visibleRootCount, setVisibleRootCount] = useState(INITIAL_VISIBLE_ROOTS);
    const [visibleRepliesByRoot, setVisibleRepliesByRoot] = useState<Record<string, number>>({});
    const totalComments = useMemo(() => {
      return commentsTree.reduce((sum, root) => {
        const repliesFlat = flattenReplies(root);
        return sum + 1 + repliesFlat.length; // root + all descendants
      }, 0);
    }, [commentsTree]);

    const { checkLimit, isLimited, attemptsRemaining, resetIn } = useRateLimit({
      maxAttempts: 30,
      windowMs: 60 * 60 * 1000,
      storageKey: "comment-submit-limit",
      onLimitExceeded: () => {
        const resetTime = formatResetTime(resetIn);
        toast.error(`Rate limit exceeded. You can only post 30 comments per hour. Try again in ${resetTime}.`);
      },
    });

    const mentionTextareaRef = useRef<HTMLTextAreaElement | null>(null);

    const handleCreateComment = useCallback(
      async (body: string, parentCommentId: string | null) => {
        if (!currentUserId) {
          toast.error("You need to sign in to comment.");
          return false;
        }
        const trimmed = body.trim();
        if (!trimmed) return false;

        if (parentCommentId === null) {
          setTopLevelError(null);
        } else {
          setReplyErrors((prev) => ({ ...prev, [parentCommentId]: null }));
        }

        if (!isAdmin && !checkLimit()) {
          return false;
        }

        setIsPosting(true);
        const { data: insertedCommentId, error } = await supabase.rpc("create_comment_with_rate_limit", {
          p_catch_id: catchId,
          p_body: trimmed,
          p_parent_comment_id: parentCommentId,
        });

        if (error) {
          if (isRateLimitError(error)) {
            toast.error(getRateLimitMessage(error));
          } else if (error.message?.includes("Catch is not accessible")) {
            toast.error("You don't have access to comment on this catch");
          } else if (error.message?.includes("Parent comment")) {
            toast.error("Unable to reply to that comment");
            if (parentCommentId) {
              setReplyErrors((prev) => ({ ...prev, [parentCommentId]: "Unable to reply to that comment" }));
            }
          } else {
            toast.error("Failed to post comment");
            if (parentCommentId === null) {
              setTopLevelError("Failed to post comment");
            } else {
              setReplyErrors((prev) => ({ ...prev, [parentCommentId]: "Failed to post reply" }));
            }
          }
          setIsPosting(false);
          return false;
        }

        const nowIso = new Date().toISOString();
        addLocalComment({
          id: insertedCommentId ?? crypto.randomUUID(),
          catch_id: catchId,
          user_id: currentUserId,
          body: trimmed,
          parent_comment_id: parentCommentId,
          created_at: nowIso,
          updated_at: nowIso,
          deleted_at: null,
          is_admin_author: Boolean(isAdmin),
          profiles: {
            id: currentUserId,
            username: user?.user_metadata?.username ?? user?.email ?? "Someone",
            avatar_path: user?.user_metadata?.avatar_path ?? null,
            avatar_url: user?.user_metadata?.avatar_url ?? null,
          },
        });

        if (parentCommentId === null) {
          setTopLevelError(null);
        } else {
          setReplyErrors((prev) => ({ ...prev, [parentCommentId]: null }));
        }
        void refetch();
        setIsPosting(false);
        return true;
      },
      [addLocalComment, catchId, checkLimit, currentUserId, refetch, user?.user_metadata?.avatar_path, user?.user_metadata?.avatar_url, user?.user_metadata?.username]
    );

    const handleDelete = useCallback(
      async (commentId: string) => {
        setDeleteLoadingId(commentId);
        const { error } = await supabase.rpc("soft_delete_comment", {
          p_comment_id: commentId,
        });
        if (error) {
          toast.error("Failed to delete comment");
        } else {
          markLocalCommentDeleted(commentId);
          void refetch();
        }
        setDeleteLoadingId(null);
      },
      [markLocalCommentDeleted, refetch]
    );

    const topLevelSubmit = async () => {
      const success = await handleCreateComment(newComment, null);
      if (success) {
        setNewComment("");
      }
    };

    const replySubmit = async (commentId: string) => {
      const body = replyDrafts[commentId] ?? "";
      const success = await handleCreateComment(body, commentId);
      if (success) {
        setReplyDrafts((prev) => ({ ...prev, [commentId]: "" }));
        setActiveReply(null);
      }
    };

    const renderCommentRow = (
      comment: ThreadedComment,
      options: { isRoot: boolean; realDepth?: number; parentAuthor?: string; parentBodySnippet?: string }
    ): JSX.Element => {
      const isOwner = currentUserId === comment.user_id;
      const canDelete = (isOwner || isAdmin) && !comment.deleted_at;
      const isDeleted = Boolean(comment.deleted_at);
      const replyDraft = replyDrafts[comment.id] ?? "";
      const indentPx = options.isRoot ? 0 : REPLY_INDENT_PX;
      const isOp = comment.user_id === catchOwnerId;
      const isAdminAuthor = comment.is_admin_author ?? false;

      return (
        <div
          key={comment.id}
          id={`comment-${comment.id}`}
          className="flex w-full max-w-full min-w-0 py-3"
        >
          <div className="flex gap-3 w-full min-w-0" style={{ paddingLeft: indentPx }}>
            <Link
              to={getProfilePath({ username: comment.profiles?.username, id: comment.user_id })}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full shrink-0"
              aria-label={`View ${comment.profiles?.username ?? "angler"}'s profile`}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={
                    resolveAvatarUrl({
                      path: comment.profiles?.avatar_path ?? null,
                      legacyUrl: comment.profiles?.avatar_url ?? null,
                    }) ?? ""
                  }
                />
                <AvatarFallback>{comment.profiles?.username?.[0]?.toUpperCase() ?? "A"}</AvatarFallback>
              </Avatar>
            </Link>
            <div
              className={
                options.isRoot
                  ? "flex-1 min-w-0 space-y-3 rounded-lg border border-border/70 bg-card px-4 py-4"
                  : "flex-1 min-w-0 space-y-2 rounded-lg bg-muted/40 px-3 py-3 text-[15px]"
              }
              style={
                activeReply === comment.id
                  ? { boxShadow: "0 0 0 1px var(--accent)", backgroundColor: "rgba(var(--accent-rgb),0.06)" }
                  : undefined
              }
            >
      <div className="flex items-center gap-2">
                <Link
                  to={getProfilePath({ username: comment.profiles?.username, id: comment.user_id })}
                  className={
                options.isRoot
                  ? "font-semibold text-foreground hover:text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
                  : "font-medium text-foreground hover:text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
              }
                >
                  {comment.profiles?.username ?? "Unknown angler"}
                </Link>
                {isOp && (
                  <span className="text-[10px] uppercase tracking-wide rounded-full bg-primary/10 text-primary px-2 py-0.5">
                    OP
                  </span>
                )}
                {isAdminAuthor && (
                  <span className="text-[10px] uppercase tracking-wide rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">
                    Admin
                  </span>
                )}
                {/* TODO: Author admin badge: when comment author admin status is available (e.g., profiles.is_admin or join to admin_users), render an Admin pill here. */}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
                {isDeleted && <span className="text-xs text-muted-foreground">(deleted)</span>}
              </div>
              <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-foreground">
                {options.parentAuthor ? (
                  <div className="mb-1 space-y-0.5 text-xs text-muted-foreground">
                    <div>
                      Replying to <span className="font-semibold text-foreground">@{options.parentAuthor}</span>
                    </div>
                    {options.parentBodySnippet ? (
                      <div className="text-[11px] text-muted-foreground/70 line-clamp-1">
                        “{options.parentBodySnippet}”
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {isDeleted ? (
                  isAdmin ? (
                    <div className="space-y-1">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">(deleted)</span>
                      <div className="text-foreground">{highlightMentions(comment.body)}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Comment deleted</span>
                  )
                ) : (
                  highlightMentions(comment.body)
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {!isDeleted && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
                    onClick={() => setActiveReply((prev) => (prev === comment.id ? null : comment.id))}
                    aria-label={`Reply to @${comment.profiles?.username ?? "comment"}`}
                  >
                    <MessageSquareReply className="h-3 w-3" />
                    Reply
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    className="hover:text-destructive/80 text-muted-foreground transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 rounded"
                    onClick={() => void handleDelete(comment.id)}
                    disabled={deleteLoadingId === comment.id}
                  >
                    {deleteLoadingId === comment.id ? "Removing…" : "Delete"}
                  </button>
                )}
                <ReportButton
                  targetType="comment"
                  targetId={comment.id}
                  label="Report"
                  className="text-destructive/80 hover:text-destructive"
                />
              </div>
              {activeReply === comment.id && !isDeleted && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Replying to <span className="font-semibold text-foreground">@{comment.profiles?.username ?? "angler"}</span>
                  </div>
                  <Textarea
                    value={replyDraft}
                    onChange={(e) => {
                      const value = e.target.value;
                      setReplyDrafts((prev) => ({ ...prev, [comment.id]: value }));
                      setReplyErrors((prev) => ({ ...prev, [comment.id]: null }));
                    }}
                    rows={3}
                    className="w-full"
                    placeholder={`Reply to ${comment.profiles?.username ?? "this comment"}…`}
                  />
                  {replyErrors[comment.id] ? (
                    <p className="text-xs text-destructive">{replyErrors[comment.id]}</p>
                  ) : null}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => void replySubmit(comment.id)}
                      disabled={isPosting || (replyDrafts[comment.id]?.trim().length ?? 0) === 0}
                    >
                      {isPosting ? "Posting…" : "Post reply"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveReply(null);
                        setReplyDrafts((prev) => ({ ...prev, [comment.id]: "" }));
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    };

    const topLevelComments = useMemo(() => commentsTree, [commentsTree]);
    const visibleRoots = useMemo(
      () => topLevelComments.slice(0, visibleRootCount),
      [topLevelComments, visibleRootCount]
    );

    useEffect(() => {
      if (!targetCommentId) return;
      const rootIndex = topLevelComments.findIndex((root) => {
        if (root.id === targetCommentId) return true;
        const replies = flattenReplies(root);
        return replies.some((r) => r.id === targetCommentId);
      });
      if (rootIndex >= 0 && rootIndex >= visibleRootCount) {
        setVisibleRootCount((count) => Math.max(count, rootIndex + 1));
      }
    }, [targetCommentId, topLevelComments, visibleRootCount]);

    // Ensure the replies block is fully visible for the target
    useEffect(() => {
      if (!targetCommentId) return;
      const root = topLevelComments.find((r) => {
        if (r.id === targetCommentId) return true;
        return flattenReplies(r).some((reply) => reply.id === targetCommentId);
      });
      if (!root) return;
      const replies = flattenReplies(root);
      if (replies.some((r) => r.id === targetCommentId)) {
        setVisibleRepliesByRoot((prev) => ({
          ...prev,
          [root.id]: replies.length,
        }));
      }
    }, [targetCommentId, topLevelComments]);

    const hasScrolledRef = useRef<string | null>(null);

    useEffect(() => {
      if (!targetCommentId) {
        hasScrolledRef.current = null;
        return;
      }
      const el = document.getElementById(`comment-${targetCommentId}`);
      if (el && hasScrolledRef.current !== targetCommentId) {
        hasScrolledRef.current = targetCommentId;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add(
          "ring",
          "ring-primary/30",
          "ring-offset-2",
          "ring-offset-background",
          "bg-primary/5",
          "rounded-lg",
          "shadow-sm",
          "transition"
        );
        const timeout = setTimeout(() => {
          el.classList.remove(
            "ring",
            "ring-primary/30",
            "ring-offset-2",
            "ring-offset-background",
            "bg-primary/5",
            "rounded-lg",
            "shadow-sm",
            "transition"
          );
        }, 2500);
        return () => clearTimeout(timeout);
      }
    }, [targetCommentId, commentsTree, visibleRootCount, visibleRoots.length]);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Comments</CardTitle>
            {totalComments > 0 && (
              <span className="text-sm text-muted-foreground">· {totalComments}</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentUserId && (
            <div className="space-y-3">
              <Textarea
                ref={mentionTextareaRef}
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  setTopLevelError(null);
                }}
                placeholder="Share your thoughts..."
                rows={3}
              />
              {topLevelError ? <p className="text-xs text-destructive">{topLevelError}</p> : null}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => void topLevelSubmit()}
                  disabled={isPosting || isLimited || newComment.trim().length === 0}
                  title={isLimited ? `Rate limited. Reset in ${formatResetTime(resetIn)}` : ""}
                >
                  {isPosting
                    ? "Posting…"
                    : isLimited
                    ? `Limited (${formatResetTime(resetIn)})`
                    : attemptsRemaining < 30
                    ? `Post Comment (${attemptsRemaining} left)`
                    : "Post Comment"}
                </Button>
              </div>
            </div>
          )}

          {isLoading && commentsTree.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading comments…</p>
          ) : topLevelComments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet. Be the first to share one!</p>
          ) : (
              <div className="space-y-6">
              {visibleRoots.map((root) => {
                const repliesFlat = flattenReplies(root);
                const totalReplies = repliesFlat.length;
                const visible = visibleRepliesByRoot[root.id] ?? REPLIES_PAGE_SIZE;
                const start = Math.max(0, totalReplies - visible);
                const visibleReplies = repliesFlat.slice(start);
                const hiddenCount = totalReplies - visibleReplies.length;

                return (
                  <div key={root.id} className="w-full max-w-full min-w-0 space-y-3">
                    {renderCommentRow(root, { isRoot: true })}
                    {totalReplies > 0 && (
                      <>
                        <div className="pl-2 text-xs text-muted-foreground">
                          Thread · {totalReplies} repl{totalReplies === 1 ? "y" : "ies"}
                        </div>
                        <div className="relative mt-1 space-y-2" style={{ paddingLeft: REPLY_INDENT_PX + 4 }}>
                          <div className="absolute left-1 top-3 bottom-3 w-px bg-muted-foreground/40" aria-hidden="true">
                            <div className="absolute -top-2 left-[-2px] h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                            <div className="absolute -bottom-2 left-[-2px] h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                          </div>
                          <div className="space-y-2 pl-4">
                            {hiddenCount > 0 && (
                              <button
                                type="button"
                                className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
                                aria-label={`View ${hiddenCount} more replies to @${root.profiles?.username ?? "comment"}`}
                                onClick={() =>
                                  setVisibleRepliesByRoot((prev) => ({
                                    ...prev,
                                    [root.id]: Math.min(totalReplies, visible + REPLIES_PAGE_SIZE),
                                  }))
                                }
                              >
                                View more replies ({hiddenCount})
                              </button>
                            )}
                            {visibleReplies.map((reply) =>
                              renderCommentRow(reply, {
                                isRoot: false,
                                realDepth: reply.realDepth,
                                parentAuthor: reply.parentAuthor,
                                parentBodySnippet: reply.parentBodySnippet,
                              })
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              {visibleRootCount < topLevelComments.length && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVisibleRootCount((count) => count + LOAD_MORE_COUNT)}
                  >
                    Load more comments
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

CatchComments.displayName = "CatchComments";
