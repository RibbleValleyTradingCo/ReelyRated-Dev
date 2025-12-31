# Utility-First Styling Guide

Purpose
Use Tailwind utilities and design tokens to keep styling consistent, readable, and scalable.

Core principles
- Prefer semantic token utilities over raw palettes: `text-foreground`, `bg-card`, `border-border`.
- Keep spacing and typography on the shared scale (no one-off values).
- Use shared primitives (`src/components/ui/*`) before introducing custom styles.
- Limit custom CSS and `@apply` to shared patterns only.

Token usage quick map
- Colors: `text-foreground`, `text-muted-foreground`, `bg-background`, `bg-card`, `border-border`, `text-primary`
- Shadows: `shadow-card`, `shadow-card-hover`, `shadow-overlay`
- Type: `text-title` (display), `text-sm`, `text-base`, `font-semibold`

Examples

Card layout
```tsx
<div className="rounded-xl border border-border bg-card p-6 shadow-card">
  <h3 className="text-title text-lg">Heading</h3>
  <p className="mt-2 text-sm text-muted-foreground">Supporting copy.</p>
</div>
```

Button variants via primitives
```tsx
<Button variant="default">Primary</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Ghost</Button>
```

Form field with focus ring
```tsx
<Input className="w-full" />
<p className="mt-1 text-xs text-muted-foreground">Helper text.</p>
```

Class ordering and readability
- Keep classes grouped: layout -> spacing -> typography -> color -> effects -> state.
- Use `cn(...)` for conditional classes and keep branches short.

Avoid
- Raw palette utilities (`text-slate-600`, `bg-white`, `border-gray-200`).
- Inline colors (hex, rgb, rgba) or gradient literals.
- One-off spacing values that are not in the scale.

When to use @apply
- Only for shared patterns that appear in multiple components.
- Place them in `src/index.css` under `@layer components` or `@layer utilities`.

Theme support
- Always use tokenized colors so light/dark mode works without per-component overrides.
- If a component needs a contrast surface, use `bg-inverse-foreground text-inverse`.
