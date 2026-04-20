# Accessibility — Large Text + WCAG Pass

**Status:** Backlogged (21 April 2026)
**Flagged by:** Alan Bird (COO) — struggles to read portal at his large-text iOS setting
**Owner:** Dean (technical), Lewis (procurement requirements)

---

## Problem

The VYVE portal actively blocks the two main accessibility levers that low-vision users rely on:

1. **Pinch-zoom is disabled** on every portal page via `user-scalable=no, maximum-scale=1.0` in the viewport meta tag. This was added to prevent accidental zoom ruining PWA layouts. Trade-off: users like Alan literally cannot zoom in to read.
2. **Font sizes are fixed** in `px` or `rem`. iOS and Android system-level text-size sliders do not affect browser/WebView root font size. So even when Alan sets his iPhone to "Larger Text" at maximum, the portal stays at whatever size we ship.

This also matters for procurement. WCAG 2.1 AA compliance is expected for public sector tenders (NHS, councils, government) and is often requested by enterprise buyers like Sage. Our CIC social-value scoring is also strengthened by demonstrable accessibility.

---

## Platform context

**iOS Dynamic Type** — Settings → Display & Brightness → Text Size, plus Accessibility → Display → Larger Text. Ranges from XS up to AX5 (extra-extra-extra-extra-large). Native apps opt in via text styles (`body`, `headline`). Web apps in a WebView do not automatically respect this.

**Android font scale** — Settings → Display → Font Size. Slider from 0.85x to 1.3x, plus accessibility extensions up to 2.0x. Native apps use `sp` units. WebViews do not automatically scale unless explicitly configured.

**Web browsers** — respect root font size (rarely changed by users) and pinch-zoom on mobile. Our current viewport meta blocks pinch-zoom.

---

## Four-option plan, ranked by effort

### Option 1 — Restore pinch-zoom (10 minutes)

Change the viewport meta tag on every portal page from:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0,
  interactive-widget=resizes-content, user-scalable=no, maximum-scale=1.0">
```
to:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0,
  interactive-widget=resizes-content">
```

**Impact:** Alan can pinch-to-zoom any screen.
**Trade-off:** Occasional accidental zoom on swipe-heavy pages (workouts.html, sessions.html). Users double-tap to reset, which is standard behaviour.
**Files:** 12 HTML pages (same set as light-mode sweep). Single atomic commit + sw.js bump.

### Option 2 — In-app text-size toggle (~half a day)

Add a "Text size" control to Settings → Accessibility section with four options: **Default / Large / Extra Large / Largest**.

**Implementation:**
- New section in `settings.html` with four buttons (same style as existing theme toggle)
- Write to `localStorage` key `vyve_text_size` and set `data-text-size` attribute on `<html>` via a new `text-size.js` file (loaded before `theme.js`)
- Add CSS rules in `theme.css`:
  ```css
  :root, [data-text-size="default"] { --text-scale: 1.0; }
  [data-text-size="large"]           { --text-scale: 1.15; }
  [data-text-size="xl"]              { --text-scale: 1.3; }
  [data-text-size="xxl"]             { --text-scale: 1.5; }
  html { font-size: calc(16px * var(--text-scale)); }
  ```
- Because most page CSS uses `rem` (14px = 0.875rem etc.), this cascades through the whole portal with no per-page edits.
- Spot-check pages for fixed-height containers that would break at 1.5x — flex-column and min-height tweaks where needed.

**Impact:** Persistent, works on web PWA + Capacitor wrap, visible as a shipped feature we can put on the pitch deck.
**Trade-off:** ~8 pages likely need minor tweaks for container overflow at 1.5x.

### Option 3 — OS Dynamic Type bridge (2–3 days, ships with Capacitor)

When the Capacitor wrap goes live, expose the host OS font scale to the WebView via a Capacitor plugin, then multiply the scale through to `--text-scale`. Combined with Option 2, this means Alan sets his iPhone text size once and VYVE respects it without Alan having to configure us separately.

**Implementation:**
- Capacitor plugin `@capacitor-community/preferences` + native bridge for `UIApplication.preferredContentSizeCategory` (iOS) and `Configuration.fontScale` (Android)
- On app launch, bridge reads OS scale and writes it to `localStorage.vyve_os_text_scale`
- `text-size.js` multiplies in-app toggle × OS scale

**Impact:** True platform-native accessibility. Table stakes for App Store accessibility ratings.
**Trade-off:** Only meaningful once Capacitor wrap ships. Pure web users don't benefit.

### Option 4 — Full WCAG 2.1 AA compliance (1–2 weeks)

Proper end-to-end accessibility pass. Scope:

- **Semantic HTML audit** — correct landmark roles (`<main>`, `<nav>`, `<section>`), `<button>` vs `<div onclick>`, heading hierarchy
- **Screen reader support** — ARIA labels on icon-only buttons, live regions for dynamic content (check-in confirmation, leaderboard updates), `aria-expanded` on collapsibles
- **Keyboard navigation** — tab order, skip-to-content link, visible focus indicators on all interactives (currently weak — focus is `--teal-lt` border, often invisible)
- **Contrast** — finish the light-mode sweep (already 90% done after 21 April commit). Add colour-blindness check (orange/green in engagement score).
- **Reduced motion** — respect `prefers-reduced-motion` for `@keyframes pulse`, `@keyframes fadeIn`, score-ring animations
- **High contrast mode** — respect `prefers-contrast: more` with bolder borders and stronger text colours
- **Form labels** — `<label for="">` on all inputs (currently relies on placeholders alone in several places)
- **Image alt text** — audit all `<img>` tags for meaningful alt attributes
- **Manual test suite** — VoiceOver (iOS), TalkBack (Android), NVDA (Windows), keyboard-only navigation

**Impact:** WCAG 2.1 AA certifiable. Required or strongly preferred for NHS, council, and most enterprise procurement. Pitch-deck bullet.
**Trade-off:** Significant effort; only justified once revenue target is in reach or a tender specifically requires it.

---

## Recommendation

**Near-term (post-Capacitor ship):** Do Options 1 + 2 together in one dedicated half-day session. Gives Alan something useful immediately and adds an accessibility feature we can legitimately claim on the pitch deck.

**Pre-Sage / pre-public-sector:** Do Options 3 + 4 as a planned accessibility milestone. Budget 2 weeks. Output is a WCAG 2.1 AA compliance statement we can hand to procurement.

---

## Dependencies

- **Capacitor wrap** (priority #1) must ship before Option 3 is meaningful
- **Design system Phase E** (typography + spacing scale migration) should ideally ship first so Option 2's `--text-scale` multiplies cleanly through `--text-*` tokens rather than hundreds of hardcoded values

## Related

- `plans/exercise-restructure.md` — separate effort, no overlap
- `brain/changelog.md` 2026-04-21 light-mode sweep — semantic colour tokens already done, forms foundation for Option 4 contrast work
