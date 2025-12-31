# Dark Mode Contrast & Accessibility Checklist

This checklist defines dark mode contrast, WCAG accessibility guidance, and readability standards for the ReelyRatedv3 web app. Use it during UI reviews, design audits, and Codex refactor passes.

---

## 1) Background & Surface Strategy

- [ ] Use darker gray backgrounds instead of pure black to reduce eye strain and harsh glare. Using slightly muted dark tones improves readability while maintaining contrast. [oai_citation:0‡Graphicfolks](https://graphicfolks.com/blog/dark-mode-design-best-practices/?utm_source=chatgpt.com)
- [ ] Avoid abrupt inversions (pure white text on pure black), which can cause visual discomfort in dark mode. [oai_citation:1‡DubBot](https://dubbot.com/dubblog/2023/dark-mode-a11y.html?utm_source=chatgpt.com)
- [ ] Ensure semantic surface tokens (`bg-background`, `bg-card`) are used instead of raw black or white.
- [ ] Elevated surfaces (cards, panels) should distinguish using token shadows or borders.

---

## 2) Text Contrast & WCAG Ratios

According to the Web Content Accessibility Guidelines **(WCAG) 2.1 Level AA**:

| Content Type                        | Minimum Contrast Ratio                                                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Body text                           | **≥ 4.5:1**                                                                                                                                                                     |
| Large text (≥18pt or 14pt bold)     | **≥ 3:1**                                                                                                                                                                       |
| UI components & meaningful graphics | **≥ 3:1** [oai_citation:2‡MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Perceivable/Color_contrast?utm_source=chatgpt.com) |

- [ ] Primary body text meets **4.5:1** contrast ratio against the background. [oai_citation:3‡MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Perceivable/Color_contrast?utm_source=chatgpt.com)
- [ ] Large headings/text meets **3:1** minimum contrast. [oai_citation:4‡MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Perceivable/Color_contrast?utm_source=chatgpt.com)
- [ ] Interactive elements such as buttons, icons, and form controls meet **≥ 3:1** contrast. [oai_citation:5‡W3C](https://www.w3.org/WAI/WCAG22/understanding/non-text-contrast.html?utm_source=chatgpt.com)

Example recommended practice:

```diff
-text-slate-900
+text-foreground

Use tools like WebAIM Contrast Checker or browser accessibility tools to verify actual ratios.  ￼
```

---

## 3) UI Component Contrast

- Buttons and clickable elements are clearly visible and legible in dark mode.
- Form inputs (labels, borders, placeholders) meet reasonable contrast levels.
- Navigation links and menu items use clear tokens and avoid raw low‑contrast color utilities.
- Focus and hover rings use semantic tokens (ring-ring, ring-offset-background) with adequate contrast.

---

## 4) Charts & Data Visualizations

- Chart background surfaces use dedicated semantic tokens (e.g., bg-muted/30) to separate them from page surface.
- Axis labels, legends, and ticks use high‑contrast tokens (text-foreground, text-muted-foreground).
- Gridlines should be visible but not overwhelming (opacity ≥ 0.35 recommended).
- Bars/lines use tokenized colors that remain readable in both dark and light themes.

Example:

```js
gridLine={{
  stroke: colorToken('muted'),
  opacity: 0.35
}}
```

Tooltip guidance:

```js
tooltip={{
  background: tokenColor('bg-card'),
  border: tokenColor('border-border'),
  text: tokenColor('text-foreground'),
}}
```

---

## 5) Surface Elevation & Shadows

- Avoid raw shadows that may disappear or look inconsistent in dark mode.
- Rely on semantic shadow tokens like shadow-card, shadow-card-hover, or shadow-overlay.
- Ensure layered surfaces are distinguishable and maintain visual hierarchy.

---

## 6) Accent & Status Colors

- Accent colors (primary, secondary, destructive, success) must still be readable against dark surfaces.
- Avoid highly saturated colors that can cause eye strain in dark themes. ￼
- Use token tints (e.g., bg-primary/10, bg-destructive/15, bg-muted/50) with appropriate foreground text.

---

## 7) Semantic Tokens Only

- Replace all raw palette utilities (e.g., bg-white, text-slate-_, border-gray-_) with semantic design tokens.
- Always use tokens that automatically adapt to dark/light modes.

Semantic tokens preferred:

- bg-card
- text-foreground
- text-muted-foreground
- border-border
- shadow-card
- shadow-card-hover
- ring-ring

---

## 8) Testing & Manual QA

- Manually test dark mode on each screen of the app.
- Deep‑link directly to dark mode pages to confirm persistence.
- Use contrast‑checking tools (WCAG 2.1) on text, controls, and chart areas.
- Test on multiple devices and screens (mobile/desktop) with different brightness settings.

---

## 9) Typical Fail Patterns

The following patterns often fail accessibility checks and should be avoided:

- Raw palettes like bg-white or bg-slate-50 used on dark surfaces.
- text-slate-600 or similar low‑contrast text utilities.
- Drop shadows like shadow-sm that disappear in dark mode.
- Bright focus rings that do not adapt to dark backgrounds.

---

## 10) Refactor Prompts & Usage Example

When requesting UI refactors, include guidance like:

Use DARK-MODE-CONTRAST-CHECKLIST.md:

- replace raw palette classes
- enforce WCAG contrast ratios
- tokenize UI surfaces
- ensure dark mode readability

---

## Citations & External Guidance

- WCAG contrast ratios and requirements — body text ≥ 4.5:1, large text ≥ 3:1, UI contrast ≥ 3:1 (WCAG 2.1 AA). ￼
- Dark mode design best practices (avoid pure black, use muted dark tones). ￼
- Accessibility tips (reduce saturation, ensure UI contrast). ￼

---

If you’d like, I can now **write this into the file in your repo** using the editor extension — just confirm!
