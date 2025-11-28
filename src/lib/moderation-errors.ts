export type ModerationError =
  | { type: "suspended"; until?: string }
  | { type: "banned" }
  | { type: null };

export const mapModerationError = (error: unknown): ModerationError => {
  if (!error || typeof error !== "object") return { type: null };
  const message =
    "message" in error && typeof (error as { message?: unknown }).message === "string"
      ? ((error as { message?: string }).message as string)
      : "";

  if (message.startsWith("MODERATION_BANNED")) {
    return { type: "banned" };
  }

  if (message.startsWith("MODERATION_SUSPENDED")) {
    const parts = message.split("until");
    const until = parts.length > 1 ? parts[1].trim() : undefined;
    return { type: "suspended", until };
  }

  return { type: null };
};
