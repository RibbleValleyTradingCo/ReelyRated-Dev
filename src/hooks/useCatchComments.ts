import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { qk } from "@/lib/queryKeys";

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
  const queryClient = useQueryClient();

  const commentsQuery = useQuery<CatchComment[]>({
    queryKey: qk.catchComments(catchId),
    enabled: Boolean(catchId),
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("catch_comments_with_admin" as any)
        .select(
          "id, catch_id, user_id, body, parent_comment_id, created_at, updated_at, deleted_at, is_admin_author, profiles:user_id (id, username, avatar_path, avatar_url)"
        )
        .eq("catch_id", catchId)
        .order("created_at", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const rows = (data ?? []) as unknown as CatchCommentRow[];
      return rows.map(mapRowToCatchComment);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const mentionsQuery = useQuery<MentionCandidate[]>({
    queryKey: qk.catchMentionCandidates(catchId),
    enabled: Boolean(catchId),
    queryFn: async () => {
      const { data: mentionDataRaw } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("catch_mention_candidates" as any)
        .select("catch_id, user_id, username, avatar_path, avatar_url, last_interacted_at")
        .eq("catch_id", catchId)
        .order("last_interacted_at", { ascending: false, nullsFirst: false })
        .order("username", { ascending: true })
        .limit(50);

      const mentionRows = (mentionDataRaw ?? []) as unknown as MentionRow[];
      return mentionRows.map((row) => ({
        userId: row.user_id,
        username: row.username,
        avatarPath: row.avatar_path,
        avatarUrl: row.avatar_url,
        lastInteractedAt: row.last_interacted_at,
      }));
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (commentsQuery.error) {
      toast.error("Failed to load comments");
    }
  }, [commentsQuery.error]);

  const addLocalComment = useCallback((comment: CatchComment) => {
    if (!catchId) return;
    queryClient.setQueryData<CatchComment[]>(qk.catchComments(catchId), (prev = []) => {
      if (prev.some((c) => c.id === comment.id)) return prev;
      return [...prev, comment];
    });
  }, [catchId, queryClient]);

  const markLocalCommentDeleted = useCallback((commentId: string) => {
    if (!catchId) return;
    queryClient.setQueryData<CatchComment[]>(qk.catchComments(catchId), (prev = []) =>
      prev.map((c) => (c.id === commentId ? { ...c, deleted_at: c.deleted_at ?? new Date().toISOString() } : c))
    );
  }, [catchId, queryClient]);

  const comments = commentsQuery.data ?? [];
  const tree = useMemo(() => buildThread(comments), [comments]);
  const mentionCandidates = mentionsQuery.data ?? [];

  return {
    comments,
    commentsTree: tree,
    isLoading: commentsQuery.isLoading,
    error: commentsQuery.error ? "Failed to load comments" : null,
    refetch: () => {
      if (!catchId) return;
      void queryClient.invalidateQueries({ queryKey: qk.catchComments(catchId) });
      void queryClient.invalidateQueries({ queryKey: qk.catchMentionCandidates(catchId) });
    },
    addLocalComment,
    markLocalCommentDeleted,
    mentionCandidates,
  };
};
