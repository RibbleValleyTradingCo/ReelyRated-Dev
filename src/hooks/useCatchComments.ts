import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CatchComment {
  id: string;
  catch_id: string;
  user_id: string;
  body: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_admin_author?: boolean;
  profiles: {
    id: string;
    username: string;
    avatar_path: string | null;
    avatar_url: string | null;
    admin_users?: { user_id: string }[] | null;
  } | null;
}

export interface ThreadedComment extends CatchComment {
  children: ThreadedComment[];
  totalChildrenCount?: number;
}

export interface MentionCandidate {
  userId: string;
  username: string;
  avatarPath: string | null;
  avatarUrl: string | null;
  lastInteractedAt: string | null;
}

interface CatchCommentRow {
  id: string;
  catch_id: string;
  user_id: string;
  body: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_admin_author?: boolean | null;
  profiles: {
    id: string;
    username: string;
    avatar_path: string | null;
    avatar_url: string | null;
    admin_users?: { user_id: string }[] | null;
  } | null;
}

interface MentionRow {
  catch_id: string;
  user_id: string;
  username: string;
  avatar_path: string | null;
  avatar_url: string | null;
  last_interacted_at: string | null;
}

function mapRowToCatchComment(row: CatchCommentRow): CatchComment {
  return {
    id: row.id,
    catch_id: row.catch_id,
    user_id: row.user_id,
    body: row.body,
    parent_comment_id: row.parent_comment_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    is_admin_author: !!row.is_admin_author,
    profiles: row.profiles
      ? {
          id: row.profiles.id,
          username: row.profiles.username,
          avatar_path: row.profiles.avatar_path,
          avatar_url: row.profiles.avatar_url,
        }
      : null,
  };
}

const buildThread = (flat: CatchComment[]): ThreadedComment[] => {
  const map = new Map<string, ThreadedComment>();
  const parentLookup = new Map<string, string | null>();

  flat.forEach((comment) => {
    map.set(comment.id, { ...comment, children: [] });
    parentLookup.set(comment.id, comment.parent_comment_id);
  });

  const hasCycle = (nodeId: string, parentId: string): boolean => {
    const visited = new Set<string>([nodeId]);
    let current: string | null | undefined = parentId;
    while (current) {
      if (visited.has(current)) return true;
      visited.add(current);
      current = parentLookup.get(current) ?? null;
    }
    return false;
  };

  const roots: ThreadedComment[] = [];
  map.forEach((node) => {
    const parentId = node.parent_comment_id;
    const parentNode = parentId ? map.get(parentId) : undefined;
    // Attach to parent only if it exists and does not introduce a cycle; otherwise treat as root.
    if (parentId && parentNode && !hasCycle(node.id, parentId)) {
      parentNode.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort top-level: newest first; children: oldest first, and set counts
  const sortAsc = (a: ThreadedComment, b: ThreadedComment) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  const sortDesc = (a: ThreadedComment, b: ThreadedComment) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

  const sortTree = (nodes: ThreadedComment[]) => {
    nodes.forEach((n) => {
      if (n.children.length > 0) {
        n.children.sort(sortAsc);
        n.totalChildrenCount = n.children.length;
        sortTree(n.children);
      } else {
        n.totalChildrenCount = 0;
      }
    });
  };

  sortTree(roots);
  roots.sort(sortDesc);
  return roots;
};

export const useCatchComments = (catchId: string | undefined) => {
  const [comments, setComments] = useState<CatchComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [mentionCandidates, setMentionCandidates] = useState<MentionCandidate[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);

  const replaceIfChanged = useCallback((next: CatchComment[]) => {
    setComments((prev) => {
      if (prev.length === next.length) {
        const prevById = new Map(prev.map((c) => [c.id, c]));
        const changed = next.some((n) => {
          const p = prevById.get(n.id);
          if (!p) return true;
      const profileChanged =
        (p.profiles?.username ?? null) !== (n.profiles?.username ?? null) ||
        (p.profiles?.avatar_path ?? null) !== (n.profiles?.avatar_path ?? null) ||
        (p.profiles?.avatar_url ?? null) !== (n.profiles?.avatar_url ?? null);
      return (
        p.body !== n.body ||
        p.deleted_at !== n.deleted_at ||
        p.updated_at !== n.updated_at ||
        p.parent_comment_id !== n.parent_comment_id ||
        p.user_id !== n.user_id ||
        p.catch_id !== n.catch_id ||
        p.created_at !== n.created_at ||
        profileChanged ||
        (p.is_admin_author ?? false) !== (n.is_admin_author ?? false)
      );
    });
    if (!changed) return prev;
  }
  return next;
    });
  }, []);

  const fetchComments = useCallback(async () => {
    if (!catchId) return;
    const isInitial = !hasLoadedOnceRef.current;
    if (isInitial) {
      setIsLoading(true);
    }
    setError(null);

    // Load comments from the view
    const { data, error: fetchError } = await supabase
      // Views are not in the generated Database types, so we treat the table name as any
      // and cast the result to our local CatchCommentRow interface below.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("catch_comments_with_admin" as any)
      .select(
        "id, catch_id, user_id, body, parent_comment_id, created_at, updated_at, deleted_at, is_admin_author, profiles:user_id (id, username, avatar_path, avatar_url)"
      )
      .eq("catch_id", catchId)
      .order("created_at", { ascending: true });

    // Load mention candidates from the view
    const { data: mentionDataRaw } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("catch_mention_candidates" as any)
      .select("catch_id, user_id, username, avatar_path, avatar_url, last_interacted_at")
      .eq("catch_id", catchId)
      .order("last_interacted_at", { ascending: false, nullsFirst: false })
      .order("username", { ascending: true })
      .limit(50);

    if (fetchError) {
      setError("Failed to load comments");
      toast.error("Failed to load comments");
    } else {
      // Cast the raw data into our local row type and map to CatchComment
      // Cast the raw data into our local row type and map to CatchComment
      const rows = (data ?? []) as unknown as CatchCommentRow[];
      const mapped = rows.map(mapRowToCatchComment);
      replaceIfChanged(mapped);

      // Cast mention rows and map into MentionCandidate
      const mentionRows = (mentionDataRaw ?? []) as unknown as MentionRow[];
      const mappedMentions: MentionCandidate[] = mentionRows.map((row) => ({
        userId: row.user_id,
        username: row.username,
        avatarPath: row.avatar_path,
        avatarUrl: row.avatar_url,
        lastInteractedAt: row.last_interacted_at,
      }));
      setMentionCandidates(mappedMentions);
    }

    if (isInitial) {
      setIsLoading(false);
    }
    hasLoadedOnceRef.current = true;
  }, [catchId, replaceIfChanged]);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments, refreshToken]);

  const addLocalComment = useCallback((comment: CatchComment) => {
    setComments((prev) => {
      // Avoid duplicates by id
      if (prev.some((c) => c.id === comment.id)) return prev;
      return [...prev, comment];
    });
  }, []);

  const markLocalCommentDeleted = useCallback((commentId: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, deleted_at: c.deleted_at ?? new Date().toISOString() } : c))
    );
  }, []);

  const tree = useMemo(() => buildThread(comments), [comments]);

  return {
    comments,
    commentsTree: tree,
    isLoading,
    error,
    refetch: () => setRefreshToken((prev) => prev + 1),
    addLocalComment,
    markLocalCommentDeleted,
    mentionCandidates,
  };
};
