# 💧 Water Tracker

A lightweight, no-install daily water intake tracker that runs entirely in your browser. No accounts, no backend — all data is stored locally in your browser.

![Water Tracker](https://img.shields.io/badge/built%20with-HTML%20%2F%20CSS%20%2F%20JS-blue)

## Features

- **One-click logging** — three button sizes to match what you actually drank
- **Animated bottle meter** — fills up and turns green when you hit the daily goal
- **GitHub-style history heatmap** — 16 weeks of history showing how close each day came to 8 cups
- **Undo** — remove the last entry if you made a mistake
- **Auto daily reset** — each day starts fresh; previous days are preserved in the heatmap
- **Zero dependencies** — open `index.html` directly, no build step required

## How to Use

### Option 1 — Open locally
Clone or download the repo, then open `index.html` in any browser:

```bash
git clone https://github.com/saideepsammidi/water-tracker.git
cd water-tracker
open index.html   # macOS
# or double-click index.html in Finder / Explorer
```

### Option 2 — GitHub Pages
Enable GitHub Pages in the repo settings (source: `main` branch, `/ (root)`) and visit:

```
https://saideepsammidi.github.io/water-tracker
```

## Logging Water

| Button | Amount |
|--------|--------|
| + 1 Cup | 8 oz (1 cup) |
| + Tall Glass | 16 oz (2 cups) |
| + Full Bottle | 32 oz (4 cups) |
| ↩ Undo | Removes the last logged entry |

## Daily Goal

The goal is **8 cups (64 oz)** per day. The bottle meter and heatmap both reflect progress toward this target.

## Heatmap Colors

| Color | Meaning |
|-------|---------|
| Gray | No water logged |
| Light blue | 1–3 cups |
| Medium blue | 4–5 cups |
| Dark blue | 6–7 cups |
| Deep blue | 8 cups (goal met) |

Hover over any cell to see the exact date and cup count.

## Data & Privacy

All data is stored in your browser's `localStorage` under the key `waterLog`. Nothing is sent anywhere. To export or clear your data, open DevTools → Application → Local Storage.

## File Structure

```
water-tracker/
├── index.html   # App structure
├── style.css    # Styling (bottle meter + heatmap)
└── app.js       # All logic (logging, undo, heatmap rendering)
```
