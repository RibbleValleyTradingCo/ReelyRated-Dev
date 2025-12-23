# Phase A — Section Headers

## Goal

Standardise **all** major section headers (H2s) across the venue page so the page feels cohesive and scannable.

This phase is intentionally **UI-only and low risk**:

- ✅ Frontend only
- ✅ No changes to Supabase queries/RPCs
- ✅ No new migrations
- ✅ Minimal behavioural change (purely presentation)

---

## What “Done” Looks Like

- Every major section uses **the same H2 styling** (same font, size, spacing, colour).
- No blue/coloured headers.
- No grey header background bars.
- No “box header” feel.
- Optional subtitles follow a consistent pattern.

---

## Standard Header Pattern

Use this structure for all major sections:

```tsx
<section className="mt-12">
  <SectionHeader
    title="About this venue"
    subtitle="Optional description or context"
  />
  {/* section content */}
</section>
```

**Spacing rules**

- Section top spacing: `mt-12`
- Header bottom spacing: handled inside `SectionHeader` (see component)

---

## Component: `SectionHeader`

Create (or confirm existence of) a reusable component:

**Location (preferred):** `src/components/ui/SectionHeader.tsx`

```tsx
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`mb-6 ${className}`.trim()}>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        {title}
      </h2>
      {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
    </div>
  );
}
```

**Non-negotiables**

- No custom colours per section.
- No background blocks behind headers.
- No per-section bespoke spacing.

---

## Audit Targets

Update the venue detail page and any child components that render section titles.

### Likely locations

- `src/pages/VenueDetail.tsx` (or equivalent route page)
- Any section components under `src/components/venue/**`

### What to replace

Replace any of the following patterns:

- `h2` with custom `text-blue-*`
- `h2` inside `bg-gray-*` bars
- Header wrappers that look like cards/boxes

With:

- `<SectionHeader title="..." subtitle="..." />`

---

## Work Items

### A1 — Add/confirm `SectionHeader` component

- [ ] Implement `src/components/ui/SectionHeader.tsx` (or confirm existing + align styles)
- [ ] Export path is stable and consistent

### A2 — Replace all venue page H2s

- [ ] Replace all major section H2s on the venue page
- [ ] Remove any old header background wrappers / blue header styles

### A3 — Clean up spacing + rhythm

- [ ] Ensure each section uses `mt-12`
- [ ] Ensure header content sits cleanly above section content

---

## Manual Test Checklist

### Visual consistency

- [ ] Scroll the venue page top-to-bottom: headers feel identical
- [ ] No section header has a coloured font (except hero text)
- [ ] No header has a background bar/box behind it

### Responsive

- [ ] Mobile: H2 size feels right and doesn’t wrap awkwardly
- [ ] Desktop: H2 scale and spacing matches spec

### Regression

- [ ] No layout shifts introduced
- [ ] No changes to data loading/queries

---

## Acceptance Criteria

- ✅ All H2 section headers use identical styling via `SectionHeader`
- ✅ No coloured text on headers
- ✅ No background boxes/bars on section titles
- ✅ Styling is reusable (no copy/paste per section)

---

## Notes / Edge Cases

- Some areas may use H3 for sub-headers. That’s fine — this phase targets **major section headers only**.
- If a section previously relied on a container background for spacing, replace with whitespace and standard borders inside the section content, not around the header.

---

## Codex Prompt Template

Use this exact structure when we’re ready to generate the prompt:

> **Task:** Phase A — Standardise venue page section headers.
>
> **Constraints:** UI-only. Do not change Supabase queries/RPCs/migrations. No behavioural changes.
>
> **Implement:**
>
> 1. Add/confirm `src/components/ui/SectionHeader.tsx` per spec.
> 2. Replace all major H2 headers on the venue detail page and child components with `<SectionHeader />`.
> 3. Remove any header background bars, blue header styles, and inconsistent spacing.
>
> **Deliver:** summary of files changed + before/after notes.
