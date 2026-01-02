const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const BLOCKED_PROTOCOLS = new Set(["javascript:", "data:", "vbscript:", "file:"]);

const isInternalLink = (value: string) =>
  value.startsWith("/") || value.startsWith("#");

const isMailOrTel = (value: string) =>
  value.startsWith("mailto:") || value.startsWith("tel:");

export const sanitizeExternalUrl = (input?: string | null): string | null => {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (isInternalLink(lower)) {
    return trimmed;
  }
  if (isMailOrTel(lower)) {
    return trimmed;
  }
  for (const protocol of BLOCKED_PROTOCOLS) {
    if (lower.startsWith(protocol)) {
      return null;
    }
  }

  const candidate =
    lower.startsWith("http://") || lower.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    return ALLOWED_PROTOCOLS.has(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

export const normalizeExternalUrl = sanitizeExternalUrl;

export const externalLinkProps = (input?: string | null) => {
  const href = sanitizeExternalUrl(input);
  if (!href) return null;
  const lower = href.toLowerCase();
  if (isInternalLink(lower) || isMailOrTel(lower)) {
    return { href };
  }
  return { href, target: "_blank" as const, rel: "noopener noreferrer" as const };
};
