# Hub-Page Hero Doctrine

**Created:** 23 May 2026
**Status:** Settled after PM-216 → PM-226 (Connect hero saga)
**Applies to:** index.html, mind.html, body.html (and any future hub page with a photographic hero)

This playbook is the single source of truth for shipping a hub-page hero in the style established on Connect. Read this before touching the hero on any other hub. Every rule here was earned through a real bug — skipping any of them re-introduces a bug we've already paid for.

---

## What we're building

A pinned, photographic hero band at the top of a hub page. Day photo + night photo with auto-swap by local hour. Brand-teal page-name eyebrow + Playfair muted-white tagline subtitle over the photo, with a daily-rotating tagline pool stored editably in Supabase. Below the hero, page content sits on a solid `var(--bg)` backdrop that cleanly covers the photo as it scrolls up. Reference: `connect.html` on `vyve-site` main, commit `c971d6cd` (PM-226).

The look is restrained and editorial — photo as ambient identity, not a billboard. The page name dominates as a typographic anchor; the tagline is supporting copy. Hero takes ~46vh on a phone.

**Doctrine variants:**
- **Band hero** — default. Hero is a top band, content scrolls over solid backdrop.
- **Ambient hero** — full-viewport photo + frosted-glass widgets. Documented in PM-221, **not the default** (felt too busy at current widget density). Skip unless a future hub explicitly wants WHOOP-style depth.

---

## Settled CSS recipe (copy-paste-ready)

Adjust the page-class prefix per hub. For `mind.html` use `body.mind-page` and `.mind-hero` etc.

```css
/* ── Hero band ───────────────────────────────────────────────── */
.<hub>-hero{
  position:fixed;
  /* LONGHAND ONLY — no inset shorthand. PM-221.1 confirmed inset:0
     silently fails on WKWebView, leaving hero at default content
     height. Four explicit longhand properties are universal. */
  top:0;
  left:0;
  right:0;
  height:max(280px, 46vh);
  z-index:1;
  overflow:hidden;
  /* GPU compositor layer — canonical WKWebView workaround for
     flaky position:fixed pinning. Without translateZ(0) the hero
     can fail to pin during scroll on iOS Safari. */
  -webkit-transform:translateZ(0);
  transform:translateZ(0);
  will-change:transform;
  /* PHOTO AS background-image, NOT <img> CHILDREN. PM-220.4
     diagnostic confirmed <img> inside translateZ(0) GPU-promoted
     fixed parent silently fails to paint on WKWebView. */
  background-color:#0D2B2B;
  background-image:url('/<hub>-hero-day.jpg');
  background-size:cover;
  /* Connect images had people in lower portion → center bottom.
     Mind/body/home: pick background-position per image composition. */
  background-position:center bottom;
  background-repeat:no-repeat;
}
.<hub>-hero.is-night{
  background-image:url('/<hub>-hero-night.jpg');
}

/* ── Suppress body::before glow on this hub (photo IS the bg) ──── */
body.<hub>-page::before{display:none;}

/* ── Kill fadeUp animation on .wrap for this hub ─────────────── */
/* Transform on .wrap creates stacking context that interferes
   with the fixed hero. Wrap content appears instantly. */
body.<hub>-page .wrap.fade{animation:none;}

/* ── Suppress topbar page-label on this hub ──────────────────── */
/* The page name in the hero replaces the nav.js mph-page-label. */
body.<hub>-page .mph-page-label{display:none;}

/* ── main padding-top matches hero band height ───────────────── */
main{padding-top:max(280px, 46vh);}

/* ── .wrap is the solid scroll surface covering photo ───────── */
.wrap{
  background:var(--bg);
  position:relative;
  z-index:2;
}

/* ── Gradient overlay: dark-top + clear-middle + dark-bottom ──── */
.<hub>-hero-overlay{
  position:absolute;
  inset:0;
  z-index:1;
  background:linear-gradient(
    180deg,
    rgba(13,43,43,0.55) 0%,
    rgba(13,43,43,0.25) 22%,
    rgba(13,43,43,0.05) 45%,
    rgba(13,43,43,0.05) 60%,
    rgba(13,43,43,0.25) 80%,
    rgba(13,43,43,0.50) 100%
  );
  pointer-events:none;
}

/* ── Text content layer ──────────────────────────────────────── */
.<hub>-hero-content{
  position:relative;
  z-index:2;
  height:100%;
  max-width:640px;
  margin:0 auto;
  /* env(safe-area-inset-top) keeps text clear of iOS status bar */
  padding:calc(env(safe-area-inset-top, 0px) + 20px) 20px 0;
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  pointer-events:none;
}

/* ── Eyebrow = page name, primary focal point ────────────────── */
.<hub>-hero-eyebrow{
  font-size:1.6rem;
  font-weight:700;
  letter-spacing:0.12em;
  text-transform:uppercase;
  color:var(--teal-lt);
  text-shadow:0 2px 14px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.6);
  margin-bottom:12px;
}

/* ── Headline = tagline subtitle, supporting role ────────────── */
.<hub>-hero-headline{
  font-family:var(--font-head);
  font-size:1.1rem;
  font-weight:500;
  line-height:1.25;
  color:rgba(255,255,255,0.92);
  text-shadow:0 2px 14px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.5);
  max-width:85%;
}
```

---

## HTML markup

```html
<!-- Body class wires page identity + hub-page topbar suppression -->
<body class="<hub>-page hub-page">

  <!-- Hero is body-level (NOT inside <main>). PM-220.1: any parent
       stacking context can interfere with position:fixed on WKWebView. -->
  <section class="<hub>-hero" id="<hub>-hero">
    <div class="<hub>-hero-overlay"></div>
    <div class="<hub>-hero-content">
      <div class="<hub>-hero-eyebrow"><HUB NAME></div>
      <div class="<hub>-hero-headline"><default tagline></div>
    </div>
  </section>

  <!-- Day/night swap. Runs before paint, no DOM-event wait. -->
  <script>
    (function(){
      try{
        var h = new Date().getHours();
        if (h < 6 || h >= 19) {
          var el = document.getElementById('<hub>-hero');
          if (el) el.classList.add('is-night');
        }
      }catch(_){}
    })();
  </script>

  <main>
    <div class="wrap fade">
      <!-- existing page content -->
    </div>
  </main>
```

The default tagline in markup is the **honest-paint default per §23.46**. If JS fails, fetch fails, or this is a first-ever visit with no localStorage cache — the default stays visible. The JS swaps it once data lands.

---

## Day/night images — production spec

Both images stored at repo root: `/<hub>-hero-day.jpg`, `/<hub>-hero-night.jpg`. Both included in sw.js precache list (use the existing connect-hero entries as template).

**Specs:**
- 1024 × 1024 progressive JPEG, quality 82
- Source larger (typically 1254×1254) gets resized in Python (PIL) before commit
- Day image ~80-100KB, night image ~100-130KB
- 1:1 squares are fine — `background-size: cover` handles the crop
- `background-position` choice depends on where the visual subject sits in the frame: people in lower portion → `center bottom`, scenery distributed → `center center`, sky as focus → `center top`

**Producing the images:**

```bash
# Source uploads in /mnt/user-data/uploads/<hub>_morning.png and _night.png
python3 << 'EOF'
from PIL import Image
for src, dst in [
    ('/mnt/user-data/uploads/<hub>_morning.png', '/home/claude/<hub>-hero-day.jpg'),
    ('/mnt/user-data/uploads/<hub>_night.png',   '/home/claude/<hub>-hero-night.jpg'),
]:
    img = Image.open(src).resize((1024, 1024), Image.LANCZOS)
    img.save(dst, 'JPEG', quality=82, optimize=True, progressive=True)
EOF
```

Commit both as binary blobs via the §23.45 base64 pattern. Reference: PM-222 commit `2811566f` for the 5-file atomic shape (3 text + 2 binary).

---

## Daily-rotating tagline (PM-225 pattern)

Already built and reusable. The Supabase `taglines` table is **shared across all hub pages** by default — every hub draws from the same pool, so Dean can edit one place to update all. If a hub needs its own pool, add a `hub` column (e.g. `connect`, `mind`, `body`, `home`) and filter the fetch by `hub=eq.<hub>`.

**Default approach (shared pool, simplest):** copy the entire `// ── PM-225 Rotating tagline ──` block from `connect.html` (search for `TAGLINES_CACHE_KEY`). Change the DOM selector from `.connect-hero-headline` to `.<hub>-hero-headline`. Wire `initTagline()` into the page's DOMContentLoaded handler BEFORE the auth-gated boot — the rotation works without auth.

**Per-hub pool variant** (if needed later): add `hub text not null default 'all'` column to `public.taglines`; existing rows get `'all'`; the fetch query becomes `?select=text&active=eq.true&hub=in.(all,<hub>)&order=position.asc`. Per-hub copy filtered by membership.

**For now: ship hub heroes with the shared pool.** It's simpler. Per-hub pools are a follow-up if Dean asks for it.

---

## Hard rules — the lessons that took 20+ commits to earn

Every one of these came from a real failure. Skipping any of them resurfaces the original bug.

### CSS / layout

1. **No `inset:0` shorthand on the hero.** Use longhand `top:0; left:0; right:0; height:max(280px, 46vh)`. PM-221.1.
2. **Photo via `background-image`, NEVER `<img>` children.** `<img>` inside `translateZ(0)` GPU-layered fixed parent silently fails to paint on WKWebView. PM-220.5.
3. **Hero is body-level, NOT inside `<main>`.** Avoids any parent stacking context interfering with `position:fixed`. PM-220.1.
4. **`translateZ(0)` + `will-change:transform` on the hero.** GPU compositor layer hint. Canonical WKWebView fix for flaky fixed positioning.
5. **`main padding-top` is the spacer, NOT `.wrap padding-top`.** `.wrap` has `background:var(--bg)`. If padding is on `.wrap` the bg fills the spacer region and covers the photo. Padding must be on a transparent element. PM-220.2.
6. **`body::before` glow must be suppressed on hub pages.** Same z-index as hero, full-viewport, can paint over the photo on WKWebView. PM-220.3.
7. **`.wrap .fade` animation must be killed on hub pages.** Transform on `.wrap` creates stacking context interference. PM-220.3.
8. **Z-index discipline:** hero `z:1`, wrap `z:2`. Make stacking unambiguous.
9. **Gradient overlay has dark-top + clear-middle + dark-bottom**. Text legibility (top) + photo focus (middle) + band-to-content transition (bottom). PM-223.2.
10. **Text-shadows on glyphs, not heavy gradient overlays.** Strong text-shadows (`rgba(0,0,0,0.85)` 14-16px blur) keep text legible without muddying the photo.

### Typography

11. **Eyebrow is brand teal-light, NOT white.** PM-226. Apply `color:var(--teal-lt)` to the eyebrow at 1.6rem 700 uppercase tracking 0.12em.
12. **Headline is Playfair muted-white subtitle** at 1.1rem 500 rgba(255,255,255,0.92). Supporting role.
13. **`env(safe-area-inset-top)` in content padding.** Keeps text below iOS status bar glyphs.

### Service worker / deployment

14. **Bump `sw.js` cache key on every commit.** Pattern: `pm<number>-<short-description>-<letter>`. The cache key is a string identifier — any change forces SW reinstall.
15. **Bump `vbb-marker` in `index.html` on every commit.** Same commit as sw.js. Dean uses `?debug=build` to confirm the device picked up the new build.
16. **SW install must use `fetch(url, { cache: 'reload' })`.** NOT `cache.addAll()`. Default fetch mode serves stale CDN copies, baking them into the new SW cache for an unbounded number of deploy cycles. PM-220.6 (current sw.js already has this). Strong §23 candidate.
17. **Add `/<hub>-hero-day.jpg` + `/<hub>-hero-night.jpg` to `urlsToCache` in sw.js** so the photos work offline.
18. **GitHub Pages CDN propagation can take ~5-10 minutes**. If Dean reports stale state but commits look correct, wait before debugging.

### Debugging

19. **When something doesn't render visually, ship a diagnostic build FIRST.** Bright colours, magenta outline, lime green text, yellow tinted background. One cycle gives the answer; multiple CSS-speculation cycles waste hours. PM-220.4 + PM-223.1.
20. **Three diagnostic outcomes to predict**: (a) container renders + text renders + visible → contrast issue, (b) container renders + no text → text-render failure (unusual), (c) no container → DOM/display issue. Write the prediction before shipping the diagnostic.

### Tooling

21. **Fresh HEAD fetch immediately before every ref PATCH.** Parallel sessions are common; HEAD moves. §23.41/53.
22. **Binary commits via base64-encoded JSON** to `/git/blobs` with `encoding: 'base64'`. §23.45 / PM-222.
23. **Composio may be 401** (since 21 May 2026 security incident); fall back to PAT-direct curl via Supabase Vault. Pattern is in `brain/master.md`.

---

## Page-specific plan

### `mind.html` — Mind hub

- **Page name eyebrow:** `MIND`
- **Body class:** `body.mind-page.hub-page`
- **Hero element class prefix:** `.mind-hero` etc.
- **Image content suggestion:** introspective, calm — solo meditation by water, dawn yoga on a cliff, journaling scene. Avoid group shots (Connect's territory).
- **Day image:** sunrise meditation, soft cool light, single figure or empty cinematic landscape with negative space for text
- **Night image:** moonlit lake, candlelit room, single figure stargazing
- **Likely `background-position`:** `center center` (scenery-focused), maybe `center 30%` if a figure sits high in the frame
- **Tagline default in markup:** something contemplative — "A moment of stillness." or whatever Lewis approves

### `body.html` — Body hub

- **Page name eyebrow:** `BODY`
- **Body class:** `body.body-page.hub-page`
- **Hero element class prefix:** `.body-hero` etc.
- **Image content suggestion:** kinetic, embodied — runner on trail, swimmer mid-stroke, climber on rockface, lifter mid-rep. Movement and physical effort.
- **Day image:** dawn run on coastal path, swim in lake at sunrise, outdoor lift in sun
- **Night image:** evening run, indoor gym at dusk, climber under floodlights
- **Likely `background-position`:** `center center` or `center 40%` depending on where the subject is
- **Tagline default:** something kinetic — "Move with purpose." or Lewis's call

### `index.html` — Home

- **Page name eyebrow:** `HOME` or possibly **the member's name** ("LEWIS" or "DEAN") — talk to Dean before shipping, this is a brand call. If member's name, it pulls from `window.vyveCurrentUser.name` after auth, and the markup default falls back to a generic word
- **Body class:** `body.index-page.hub-page` (`.home-page` would also work; pick one and apply consistently)
- **Hero element class prefix:** `.home-hero` or `.index-hero`
- **Image content suggestion:** aspirational, broad — the breadth of what VYVE offers. Maybe abstract / atmospheric rather than a specific scene. Or rotate through Connect/Mind/Body imagery on different days.
- **Day image:** broad cinematic landscape — mountain range at dawn, sweeping coastline, forest light
- **Night image:** aurora, milky way, city lights at distance
- **Likely `background-position`:** `center center` for landscapes
- **Tagline default:** brand-level — "Build health before it breaks." (the VYVE tagline from master.md) or something else Lewis chooses
- **Caveat:** index.html is the busiest page in the app. Make sure the hero doesn't push critical content (score ring, daily streak) too far below the fold. Consider making the hero band slightly shorter for home — `max(240px, 38vh)` instead of 46vh.

---

## Shipping order

Recommend: **mind.html first**. Lowest content density, easiest to validate the doctrine on a second page. Then body.html. Then index.html last — it's the busiest page and benefits from any tuning learned from the other two.

For each page:

1. Source day + night images from Dean (or via Gemini per master.md doctrine — append the brand grading instruction)
2. Optimise to 1024×1024 q=82 progressive JPEG (Python PIL snippet above)
3. Apply the CSS recipe with `<hub>` replaced
4. Add markup with body class, hero section, inline day/night script
5. Add the PM-225 tagline init block (copy from connect.html, change DOM selector)
6. Add `/<hub>-hero-day.jpg` + `/<hub>-hero-night.jpg` to `urlsToCache` in sw.js
7. Bump sw cache key + vbb-marker
8. Commit atomically: connect-style 5-file (page.html + sw.js + index.html + 2 binaries)
9. Confirm with Dean on device — pull up the new vbb-marker, check eyebrow + headline visible + correctly coloured

---

## What to ask Dean before shipping each page

- **Image source:** does Dean have specific shots in mind, or generate via Gemini with the brand grading line?
- **Tagline default in markup:** what's the fallback text for first-load before the rotating pool lands?
- **For home/index specifically:** eyebrow says `HOME`, or the member's first name, or something else?
- **Tagline pool:** are the 5 Connect taglines fine for shared use across hubs, or does Dean want hub-specific copy?

Don't ship without clarity on these. Shipping a placeholder string ("Default text") is fine for the markup if Dean is undecided — that's what the honest-paint default is for. But a real default is better than a placeholder.

---

## After shipping all three

Update `brain/master.md` §16 (Pages) to reflect that mind/body/home now have photographic heroes. Add a §23 entry if any new gotcha emerged that isn't in this playbook. Promote PM-220.6's `cache: 'reload'` install pattern to a hard §23 rule once it's been live across 4 hub pages without regression — that's enough live evidence to codify.

---

## File-by-file diff snapshot of PM-220 → PM-226

For reference if anything needs comparison:

- `connect.html` PM-216 → PM-226: hero band added, markup body-level, day/night script, CSS recipe above
- `sw.js`: install handler `cache.addAll()` → `fetch({cache:'reload'}) + cache.put` loop (PM-220.6); precache list now contains `/connect-hero-day.jpg` + `/connect-hero-night.jpg`
- `nav.js`: `body.hub-page` JS-guard skips mobileHeader insertion (PM-218/219)
- New Supabase table `public.taglines` with RLS read-for-anon, 5 seeded rows (PM-225)

---

*End of playbook. If unclear, fall back to reading `connect.html` directly — it's the canonical reference implementation.*
