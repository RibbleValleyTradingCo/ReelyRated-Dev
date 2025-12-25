import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { NotificationsBell } from "@/components/NotificationsBell";
import type { NotificationRow } from "@/components/notifications/NotificationListItem";
import type { Json } from "@/integrations/supabase/types";

const createNotification = (overrides: Partial<NotificationRow> = {}): NotificationRow => ({
  id: "notif-1",
  user_id: "user-1",
  actor_id: "actor-2",
  type: "new_comment",
  extra_data: { catch_id: "catch-123", message: "Alice commented on your catch." } as Json,
  message: "Alice commented on your catch.",
  catch_id: null,
  comment_id: null,
  is_read: false,
  read_at: null,
  created_at: new Date().toISOString(),
  deleted_at: null,
  ...overrides,
});

const markOneMock = vi.fn();
const markAllMock = vi.fn();
const clearAllMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "user-1" }, loading: false }),
}));

vi.mock("@/hooks/useNotificationsData", () => ({
  useNotificationsData: () => ({
    notifications: [createNotification()],
    isLoading: false,
    refresh: refreshMock,
    markOne: markOneMock,
    markAll: markAllMock,
    clearAll: clearAllMock,
  }),
}));

// Mock admin check to avoid hitting real supabase in tests
vi.mock("@/lib/admin", () => ({
  isAdminUser: vi.fn().mockResolvedValue(false),
}));

// Simplify Radix popover to avoid Portal/Presence warnings in tests
vi.mock("@/components/ui/popover", () => {
  const Popover = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-popover">{children}</div>
  );
  const PopoverTrigger = ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  );
  const PopoverContent = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-popover-content">{children}</div>
  );

  return { Popover, PopoverTrigger, PopoverContent };
});

describe("NotificationsBell", () => {
  beforeEach(() => {
    markOneMock.mockClear();
    markAllMock.mockClear();
    clearAllMock.mockClear();
    refreshMock.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("triggers mark all read and clear all actions", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <MemoryRouter>
        <NotificationsBell />
      </MemoryRouter>
    );

    const bellButton = screen.getByRole("button", { name: /open notifications/i });
    await act(async () => {
      await user.click(bellButton);
    });

    const markAllButton = screen.getByRole("button", { name: /mark all read/i });
    await act(async () => {
      await user.click(markAllButton);
    });
    await waitFor(() => expect(markAllMock).toHaveBeenCalled());

    const clearAllButton = screen.getByRole("button", { name: /clear all/i });
    await act(async () => {
      await user.click(clearAllButton);
    });
    await waitFor(() => expect(clearAllMock).toHaveBeenCalled());

    unmount();
  });

  it("marks a single notification as read", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NotificationsBell />
      </MemoryRouter>
    );

    const bellButton = screen.getByRole("button", { name: /open notifications/i });
    await act(async () => {
      await user.click(bellButton);
    });

    const card = screen
      .getByText("Alice commented on your catch.")
      .closest("[role='button']") as HTMLElement;

    expect(card).toBeInTheDocument();

    const markReadButton = within(card).getByRole("button", { name: /mark read/i });
    await act(async () => {
      await user.click(markReadButton);
    });
    await waitFor(() => expect(markOneMock).toHaveBeenCalled());
  });
});
