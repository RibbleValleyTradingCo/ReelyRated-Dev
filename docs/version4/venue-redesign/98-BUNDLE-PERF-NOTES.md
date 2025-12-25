# Venue Detail Bundle Perf Notes

## Baseline (before this pass)
Build output (top chunks by size):
- vendor-CS0VZhHQ.js: 1,428.37 kB (gzip 430.28 kB)
- index-BFOl54ig.js: 114.99 kB (gzip 32.70 kB)
- VenueDetail-D7zx55O1.js: 75.91 kB (gzip 18.01 kB)
- CatchDetail-BulZHdAE.js: 55.58 kB (gzip 15.98 kB)
- AddCatch-TeAlqZJy.js: 39.42 kB (gzip 10.28 kB)
- Profile-PM-F09rl.js: 35.36 kB (gzip 9.23 kB)
- Insights-zsiWW0Zj.js: 32.81 kB (gzip 9.44 kB)
- AdminReports-BzeMGqFx.js: 26.97 kB (gzip 7.05 kB)
- ProfileSettings-gMOThPGV.js: 26.59 kB (gzip 7.18 kB)
- VenuePhotosCard-g6Vlhpfv.js: 23.78 kB (gzip 6.05 kB)

Warning: vendor chunk exceeded 500 kB.

## Changes in this pass
- Split vendor bundles via `build.rollupOptions.output.manualChunks` into:
  - `vendor-react`, `vendor-router`, `vendor-query`, `vendor-supabase`, `vendor-markdown`, `vendor-ui`, `vendor` (remainder)
- Lazy-loaded venue-only chunks:
  - `RatingModal` (modal opens on demand)
  - `MarkdownContent` (About + Rules blocks)
- Lazy-loaded `html2canvas` at point-of-use (share image download):
  - Dynamic import inside `useCatchInteractions` → only requested on click
  - Manual check: initial app load shows no `vendor-html2canvas` request; clicking “Download share image” triggers it

## After (current)
Build output (top chunks by size):
- vendor-BUe-kiu0.js: 230.90 kB (gzip 78.31 kB)
- vendor-html2canvas-Ge7aVWlp.js: 201.46 kB (gzip 47.53 kB)
- vendor-charts-DfLVG4Dy.js: 157.58 kB (gzip 48.37 kB)
- vendor-react-CuIzCWKr.js: 141.64 kB (gzip 45.72 kB)
- vendor-ui-BdToj5om.js: 141.31 kB (gzip 44.56 kB)
- vendor-markdown-CRN74Czv.js: 119.33 kB (gzip 34.48 kB)
- index-Doik0XrH.js: 116.26 kB (gzip 33.00 kB)
- VenueDetail-DS-18oET.js: 73.58 kB (gzip 17.44 kB)
- vendor-supabase-auth-9xZeZIAv.js: 78.86 kB (gzip 20.54 kB)
- vendor-supabase-BgjqZeMB.js: 76.89 kB (gzip 21.09 kB)
- vendor-date-Xkd0dgWv.js: 54.56 kB (gzip 16.19 kB)

New vendor splits (no chunk > 500 kB):
- vendor-html2canvas
- vendor-zod
- vendor-forms
- vendor-date (date-fns + react-day-picker)
- vendor-supabase-auth
- vendor-charts (@nivo + recharts)
- vendor-spring
- vendor-floating
- vendor-lodash

Warning: no chunks exceed 500 kB after these splits.

## Investigation (ANALYZE=1)

### Vite warning output (latest)
No warning after vendor splits (all chunks < 500 kB).

### Top output chunks (minified size)
| Chunk | Size (kB) | Notes |
| --- | --- | --- |
| `vendor-BUe-kiu0.js` | 230.90 | vendor remainder (post-splits) |
| `vendor-html2canvas-Ge7aVWlp.js` | 201.46 | html2canvas |
| `vendor-charts-DfLVG4Dy.js` | 157.58 | @nivo + recharts |
| `vendor-react-CuIzCWKr.js` | 141.64 | React + ReactDOM |
| `vendor-ui-BdToj5om.js` | 141.31 | Radix + lucide + cmdk |

### Largest vendor chunk composition (visualizer, rendered size)
Top contributors were split into dedicated chunks:
- `vendor-html2canvas` → html2canvas
- `vendor-supabase-auth` → @supabase/auth-js
- `vendor-zod` → zod
- `vendor-date` → react-day-picker + date-fns
- `vendor-forms` → react-hook-form
- `vendor-markdown` → unified/micromark/mdast/remark/rehype
- `vendor-charts` → @nivo + recharts
- `vendor-spring` → @react-spring/*
- `vendor-floating` → @floating-ui/*
- `vendor-lodash` → lodash

### Big chunk → what’s inside → suspected fix (best effort)
| Big chunk | What’s inside | Suspected fix |
| --- | --- | --- |
| `vendor-html2canvas` | html2canvas | Accept as isolated chunk; only lazy-load features that need it if desired. |
| `vendor-markdown` | markdown stack | Already split; keep unless we want on-demand markdown usage. |
| `vendor-charts` | @nivo + recharts | Consider route-level lazy loading for analytics-heavy pages (optional). |

## Notes / What’s inside (best effort)
- `vendor-react`: react + react-dom
- `vendor-router`: react-router-dom + related deps
- `vendor-query`: @tanstack/react-query
- `vendor-supabase`: @supabase/* (non-auth packages)
- `vendor-supabase-auth`: @supabase/auth-js
- `vendor-markdown`: react-markdown + unified/micromark/mdast/rehype/remark
- `vendor-date`: date-fns + react-day-picker
- `vendor-forms`: react-hook-form
- `vendor-zod`: zod
- `vendor-html2canvas`: html2canvas
- `vendor-charts`: @nivo + recharts
- `vendor-spring`: @react-spring/*
- `vendor-floating`: @floating-ui/*
- `vendor-lodash`: lodash
- `vendor-ui`: Radix UI + lucide-react + cmdk
- `vendor` (remainder): other node_modules not matched above
