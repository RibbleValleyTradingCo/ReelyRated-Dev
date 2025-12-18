/**
 * RATE-UI-001: Comment form respects rate limits.
 * Verifies that the CatchComments composer disables posting when rate-limited
 * and still allows posting when under the limit, without hitting the real DB.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CatchComments } from "@/components/CatchComments";

// ---- Mocks ----
const mockCheckLimit = vi.fn();
let mockIsLimited = false;
let mockAttemptsRemaining = 25;
let mockResetIn = 60_000;

vi.mock("@/hooks/useRateLimit", () => ({
  useRateLimit: () => ({
    checkLimit: mockCheckLimit,
    isLimited: mockIsLimited,
    attemptsRemaining: mockAttemptsRemaining,
    resetIn: mockResetIn,
  }),
  formatResetTime: (ms: number) => `${Math.ceil(ms / 1000)}s`,
}));

vi.mock("@/hooks/useCatchComments", () => ({
  useCatchComments: () => ({
    commentsTree: [],
    isLoading: false,
    refetch: vi.fn(),
    addLocalComment: vi.fn(),
    markLocalCommentDeleted: vi.fn(),
    mentionCandidates: [],
  }),
}));

vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "user@example.com" } }),
}));

type SupabaseMocks = { rpc: ReturnType<typeof vi.fn> };
let supabaseMocks: SupabaseMocks;
let supabaseRpcMock: ReturnType<typeof vi.fn>;
vi.mock("@/integrations/supabase/client", () => {
  const rpc = vi.fn().mockResolvedValue({ data: "comment-id", error: null });
  (globalThis as any).__commentSupabaseMocks = { rpc };
  return {
    supabase: { rpc },
  };
});

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("CatchComments rate limit UI", () => {
  beforeEach(() => {
    supabaseMocks = (globalThis as any).__commentSupabaseMocks as SupabaseMocks;
    if (!supabaseMocks) {
      throw new Error("__commentSupabaseMocks not initialised");
    }
    supabaseRpcMock = supabaseMocks.rpc;
    mockIsLimited = false;
    mockAttemptsRemaining = 25;
    mockResetIn = 60_000;
    mockCheckLimit.mockReset();
    supabaseRpcMock.mockClear();
  });

  it("allows posting when under the rate limit", async () => {
    mockCheckLimit.mockReturnValue(true);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CatchComments catchId="catch-1" catchOwnerId="owner-1" currentUserId="user-1" />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText("Share your thoughts...");
    await user.type(textarea, "Nice catch!");

    const postButton = screen.getByRole("button", { name: /post comment/i });
    expect(postButton).toBeEnabled();

    await user.click(postButton);

    expect(mockCheckLimit).toHaveBeenCalled();
    expect(supabaseRpcMock).toHaveBeenCalledWith("create_comment_with_rate_limit", expect.any(Object));
  });

  it("blocks posting and shows limited state when over the rate limit", async () => {
    mockIsLimited = true;
    mockAttemptsRemaining = 0;
    mockResetIn = 120_000;
    mockCheckLimit.mockReturnValue(false);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CatchComments catchId="catch-2" catchOwnerId="owner-1" currentUserId="user-1" />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText("Share your thoughts...");
    await user.type(textarea, "Should be blocked");

    const postButton = screen.getByRole("button", { name: /limited/i });
    expect(postButton).toBeDisabled();
    expect(postButton).toHaveAttribute("title", expect.stringContaining("Rate limited"));

    await user.click(postButton);
    expect(mockCheckLimit).not.toHaveBeenCalled();
    expect(supabaseRpcMock).not.toHaveBeenCalled();
  });
});
