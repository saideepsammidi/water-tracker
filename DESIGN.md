# Design Document — Water Tracker

## Purpose & Goals

Water Tracker is a personal daily hydration tool. The goal is frictionless logging: open the page, tap a button, done.

**Core constraints:**
- No backend, no account, no install
- Works fully offline
- Data never leaves the device
- Deployable as a static file or via GitHub Pages

---

## Architecture

Three files, no framework, no build step.

```
water-tracker/
├── index.html   # DOM structure
├── style.css    # All visual styling
└── app.js       # All application logic
```

State is persisted entirely in the browser's `localStorage`. The app is fully functional from `file://` (double-click to open) or served over HTTP.

---

## Data Model

Two `localStorage` keys are used:

### `waterLog`
A flat object mapping ISO date strings to cup totals for that day.

```json
{
  "2026-05-21": 6,
  "2026-05-20": 8,
  "2026-05-19": 3
}
```

- Keys are `YYYY-MM-DD` strings derived from `new Date().toISOString().slice(0, 10)`
- Values are integers representing cups consumed (not ounces)
- Days with no data have no key — they are not stored as `0`

### `waterUndoStack`
An ordered array of the amounts logged in the current session, used to power the Undo button.

```json
[1, 2, 4, 1]
```

- Each `logWater(amount)` call pushes to this stack
- `undo()` pops the last value and subtracts it from today's total
- The stack is global (not per-day); it's a session convenience, not a full audit log

### Cup Units

| Button | Units | Ounces |
|--------|-------|--------|
| + 1 Cup | 1 | 8 oz |
| + Tall Glass | 2 | 16 oz |
| + Full Bottle | 4 | 32 oz |

Daily goal: **`GOAL = 8` cups (64 oz)**

---

## UI Layout

```
┌─────────────────────────────┐
│   💧 Water Tracker          │  ← Header + date
│   Thursday, May 21, 2026    │
├─────────────────────────────┤
│        [bottle meter]       │  ← Animated fill
│         5 / 8 cups          │
│      Almost there!          │  ← Motivational text
├─────────────────────────────┤
│  +1 Cup  +Tall Glass  +Bottle│  ← Log buttons
│         ↩ Undo              │
├─────────────────────────────┤
│  History                    │
│  [16-week heatmap grid]     │  ← GitHub-style calendar
└─────────────────────────────┘
```

---

## Component Breakdown

### Bottle Meter (`style.css`, `app.js:renderToday`)

A `div.bottle` contains a `div.bottle-fill` child. Fill height is set via `element.style.height` as a percentage capped at 100%. A CSS transition (`cubic-bezier` with slight overshoot) animates the change.

- Below goal: gradient from `#0d4f8b` (bottom) to `#64b5e8` (top)
- At/above goal: gradient shifts to green (`goal-met` CSS class toggled via `classList.toggle`)
- The cup count label is absolutely positioned over the fill using `z-index` and `text-shadow` for legibility at all fill levels

### Motivational Text (`app.js:renderToday`)

Five tiers keyed to cup ranges:

| Range | Message |
|-------|---------|
| 0 | "Start drinking!" |
| 1–2 | "Good start, keep it up!" |
| 3–5 | "Halfway there, nice work!" |
| 6–7 | "Almost there!" |
| 8 (exact) | "Goal reached! Great job!" |
| 9+ | "{n} cups — crushing it!" |

### History Heatmap (`app.js:renderHeatmap`, `style.css`)

A CSS Grid with `grid-auto-flow: column` and `grid-template-rows: repeat(7, 14px)` creates the week-column layout automatically — adding cells in DOM order fills columns top-to-bottom (Sun→Sat), and new columns are added left-to-right.

**Grid dimensions:** 16 weeks × 7 days = 112 cells. The grid always ends on the Saturday on or after today, so future cells within the current week are rendered but unstyled (no `data-level` attribute).

**Color levels** are assigned by `cupsToLevel(cups)` and applied via CSS attribute selectors (`[data-level="1"]`, etc.):

| `data-level` | Cup range | Color |
|---|---|---|
| *(none)* | Future date | `#ebedf0` (no opacity) |
| `"0"` | 0 cups | `#ebedf0` |
| `"1"` | 1–1 cup | `#b6dcf5` |
| `"2"` | 2–3 cups | `#64b5e8` |
| `"3"` | 4–5 cups | `#2176ae` |
| `"4"` | 6–7 cups | `#0d4f8b` |
| `"goal"` | 8+ cups | `#1a7f37` (green) |

**Month labels** are `<span>` elements with `position: absolute`, left-offset calculated as `colIndex * 16px` (14px cell + 2px gap), placed above the grid.

**Tooltip** is a single fixed `div#tooltip` shared by all cells. `mousemove` updates its position and text; `mouseleave` hides it. No DOM node is created per cell.

### Auto-Reset

There is no explicit reset operation. Because each day is a separate key, "today" always starts at 0 if no key exists for it. Prior days' data is naturally preserved and reflected in the heatmap.

---

## Key Functions (`app.js`)

| Function | Signature | Description |
|----------|-----------|-------------|
| `todayKey` | `() → string` | Returns current local date as `YYYY-MM-DD` |
| `loadLog` | `() → object` | Reads `waterLog` from localStorage; returns `{}` on error |
| `saveLog` | `(log) → void` | Serializes log object to localStorage |
| `loadUndoStack` | `() → number[]` | Reads undo stack; returns `[]` on error |
| `saveUndoStack` | `(stack) → void` | Serializes undo stack to localStorage |
| `logWater` | `(amount) → void` | Adds cups, pushes to undo stack, triggers re-render |
| `undo` | `() → void` | Pops last amount, subtracts from today, triggers re-render |
| `renderToday` | `(cups) → void` | Updates bottle fill, label text, motivational message |
| `cupsToLevel` | `(cups) → string` | Maps cup count to a heatmap color level key |
| `renderHeatmap` | `(log) → void` | Fully rebuilds the 16-week heatmap DOM from the log |

---

## Responsive Design

- At ≤480px viewport width, the three log buttons collapse from a 3-column grid to a 2-column grid; Undo spans the full width
- The heatmap section is wrapped in a horizontally scrollable container (`.heatmap-scroll`) so the grid is never clipped on narrow screens

---

## Known Limitations & Future Work

- **Touch/mobile tooltips**: hover tooltips don't fire on touchscreens — a tap-to-show interaction would improve mobile usability
- **ARIA**: no `role` or `aria-label` attributes on heatmap cells or buttons yet
- **Undo scope**: the undo stack does not reset between days, so an undo on a new day can remove a cup from yesterday if the page was not reloaded
- **Data export**: no UI to export or back up `localStorage` data
- **Timezone edge case**: `toISOString()` returns UTC; on systems with a UTC− offset, the date key may be the previous calendar day late at night
