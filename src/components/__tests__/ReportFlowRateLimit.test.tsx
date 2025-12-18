/**
 * RATE-UI-002: Report flow respects rate limits.
 * Ensures the ReportButton blocks submissions when limited and allows them when under the limit,
 * without calling real Supabase.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportButton } from "@/components/ReportButton";

// ---- Mocks ----
const mockCheckLimit = vi.fn();
let mockIsLimited = false;
let mockAttemptsRemaining = 5;
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

vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "user@example.com", user_metadata: { username: "test-user" } } }),
}));

type SupabaseMocks = { rpc: ReturnType<typeof vi.fn> };
let supabaseMocks: SupabaseMocks;
let supabaseRpcMock: ReturnType<typeof vi.fn>;
vi.mock("@/integrations/supabase/client", () => {
  const rpc = vi.fn().mockResolvedValue({ data: { id: "report-1" }, error: null });
  (globalThis as any).__reportSupabaseMocks = { rpc };
  return {
    supabase: { rpc },
  };
});

const notifyAdminsMock = vi.fn();
vi.mock("@/lib/notifications", () => ({
  notifyAdmins: (...args: unknown[]) => {
    notifyAdminsMock(...args);
    return Promise.resolve();
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("ReportButton rate limit UI", () => {
  beforeEach(() => {
    supabaseMocks = (globalThis as any).__reportSupabaseMocks as SupabaseMocks;
    if (!supabaseMocks) {
      throw new Error("__reportSupabaseMocks not initialised");
    }
    supabaseRpcMock = supabaseMocks.rpc;
    mockIsLimited = false;
    mockAttemptsRemaining = 5;
    mockResetIn = 60_000;
    mockCheckLimit.mockReset();
    supabaseRpcMock.mockClear();
    notifyAdminsMock.mockClear();
  });

  it("allows submitting a report when under the rate limit", async () => {
    mockCheckLimit.mockReturnValue(true);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ReportButton targetType="catch" targetId="catch-1" />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: /report/i }));

    const textarea = screen.getByPlaceholderText(/let us know/i);
    await user.type(textarea, "This is inappropriate.");

    const submit = screen.getByRole("button", { name: /submit report/i });
    expect(submit).toBeEnabled();

    await user.click(submit);

    expect(mockCheckLimit).toHaveBeenCalled();
    expect(supabaseRpcMock).toHaveBeenCalledWith(
      "create_report_with_rate_limit",
      expect.objectContaining({ p_target_type: "catch", p_target_id: "catch-1" })
    );
    expect(notifyAdminsMock).toHaveBeenCalled();
  });

  it("blocks submitting when rate limited", async () => {
    mockIsLimited = true;
    mockAttemptsRemaining = 0;
    mockResetIn = 90_000;
    mockCheckLimit.mockReturnValue(false);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ReportButton targetType="catch" targetId="catch-2" />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: /report/i }));
    const textarea = screen.getByPlaceholderText(/let us know/i);
    await user.type(textarea, "Should be blocked");

    const submit = screen.getByRole("button", { name: /limited/i });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute("title", expect.stringContaining("Rate limited"));

    await user.click(submit);
    expect(mockCheckLimit).not.toHaveBeenCalled();
    expect(supabaseRpcMock).not.toHaveBeenCalled();
  });
});
