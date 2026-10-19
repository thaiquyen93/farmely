# Marketplace animation & visual hierarchy — implementation notes

Iteration: **first** (`.agents/tasks/marketplace-review.json` did not exist when this run started).
All 8 planned tasks implemented. Work left **uncommitted** in the user's checkout, no branch, no worktree.

---

## 1. Commands run and their results

| # | Command (cwd `d:\isp392\frontend`) | Exit | Result |
|---|---|---|---|
| 1 | `npm test` (= `vitest --run`) | 1 | 1 failed / 27 passed — intentional discovery run, see "Plan fact correction" below |
| 2 | `npm run build` (= `vite build`) | 0 | clean |
| 3 | `npm test` | 0 | **50 passed / 50** |
| 4 | `npm test` (after adding spotlight suite) | 0 | **60 passed / 60** |
| 5 | `npm run build` — FINAL | **0** | **clean** |
| 6 | `npm test` — FINAL | **0** | **60 passed / 60, 5 files, 0 failed** |

### Final `npm run build` output highlights

```
vite v5.4.21 building for production...
✓ 2454 modules transformed.
dist/index.html                  0.98 kB │ gzip:   0.56 kB
dist/assets/index-Bc-NpDOW.css 180.23 kB │ gzip:  25.99 kB
dist/assets/index-Cxbj1JJ-.js  2,276.99 kB │ gzip: 605.25 kB
✓ built in 23.26s
```

Only warning is the pre-existing `chunks are larger than 500 kB` advisory. It predates this work
(the bundle is dominated by maplibre-gl + recharts) and no code-splitting was in scope.

### Final `npm test` output

```
✓ src/utils/mapTheme.test.js                        (13 tests)
✓ src/utils/geoUtils.test.js                        (15 tests)
✓ src/hooks/useMapIntroAnimation.test.js            (13 tests)
✓ src/components/marketplace/map/PlotBadge.test.js  ( 9 tests)
✓ src/hooks/usePlotSpotlight.test.jsx               (10 tests)

Test Files  5 passed (5)
     Tests  60 passed (60)
```

No watch-mode or blocking command was ever run. `npm test` is wired to `vitest --run`.
The dev server was started as a detached background process (`node node_modules\vite\bin\vite.js`)
with stdout/stderr redirected to files, probed over HTTP, then stopped; port 3000 confirmed released.

---

## 2. Plan fact correction — the dataset has 13 plots, not 16

The brief stated "16 features total" / "16 badge markers" as a verified fact. It is wrong.
`FARMS_GEOJSON_DATA.features.length === 13`; the ids skip `P-10`, `P-11`, `P-12`
(`P-01..P-09`, `P-13..P-16`). Verified directly:

```
count 13
P-01:5 P-02:5 P-03:5 P-04:5 P-05:5 P-06:5 P-07:5 P-08:5 P-09:5 P-13:5 P-14:5 P-15:5 P-16:5
statuses [ 'Đang trống', 'Đã thuê' ]
```

Every ring is a **closed** 5-position quad (last === first), so `getRingCorners` returns 4 for all 13.
Tests assert 13, and the GPS badge in the map now renders `plotsData.features.length` instead of a
hardcoded `16`. Everything else the brief asserted about the dataset held up.

Also note only 2 of the 4 `GIS_STATUSES` actually occur in the data (`AVAILABLE`, `RENTED`);
`MAINTENANCE` and `UPCOMING` are still fully wired through `getStatusConfig` and the colour
expression so they render correctly if the data grows.

---

## 3. Visual verification status

Honest breakdown, as required. **No effect in the "observed" column was watched frame-by-frame in a
browser**: this environment has no headless browser driver, and adding Playwright/Puppeteer is
forbidden by the hard constraints (only vitest + jsdom permitted). jsdom cannot run maplibre-gl at
all — it needs a WebGL context. So motion was compensated with concrete state assertions against a
recording fake map, exactly as the brief allows.

### Observed in a running dev server (behaviour, not motion)

A background Vite dev server on port 3000 was used to confirm the page and every new module compile
and serve. Each of these returned HTTP 200 with a non-trivial body, which proves the modules parse,
their imports resolve, and JSX transforms cleanly:

| Route / module | Status |
|---|---|
| `/marketplace` | 200, 1163 B |
| `src/pages/public/Marketplace.jsx` | 200, 126 310 B |
| `src/components/marketplace/MarketplaceInteractiveMap.jsx` | 200, 46 019 B |
| `src/hooks/useMapIntroAnimation.js` | 200, 55 321 B |
| `src/hooks/usePlotSpotlight.js` | 200, 58 653 B |
| `src/components/marketplace/map/mapLayers.js` | 200, 37 207 B |
| `src/components/marketplace/map/PlotBadge.js` | 200, 30 811 B |
| `src/components/marketplace/MarketplaceIntroVeil.jsx` | 200, 11 481 B |

The dev server produced **no transform errors and no stderr output**.

### Asserted programmatically (not watched, but proven to drive real state)

CSS generation — grepped the emitted `dist/assets/index-Bc-NpDOW.css`:

| Check | Result |
|---|---|
| `@keyframes fadeIn` | present |
| `@keyframes fadeInUp` | present |
| `@keyframes slideInLeft` | present |
| `@keyframes dropInTop` | present |
| `@keyframes pulseGlow` | present |
| `@keyframes bracketIn` | present |
| `@keyframes shimmer` | present |
| `@keyframes slideInRight` | **absent — tree-shaken, see §4** |
| `.w-84{width:21rem}` | present (the left `aside` finally has a width) |
| `scale-115` | present |
| `.shadow-rail` / `.shadow-float` / `.shadow-panel` | all three present |
| `.animate-fadeIn` / `.animate-shimmer` | present |
| `prefers-reduced-motion` block | present |

Map behaviour — `usePlotSpotlight.test.jsx` renders the real hook with a fake map that records every
`setPaintProperty` / `setFilter` / `setData` / `fitBounds` call, then reads the values back:

- **Extrusion pop**: after selecting `P-01`, the working copy's `riseHeight` reads exactly `14`
  (`SELECTED_HEIGHT`) for the selected feature and exactly `4` (`RISE_SETTLE_HEIGHT`) for all 12
  others, and `setData` was actually called. The selected slab provably stands taller.
- **Dim layer exists with non-zero opacity while selected**: `farm-dim-outside.fill-opacity` and
  `plots-dim.fill-opacity` both read back `> 0` and settle at `0.5`; `plots-dim`'s filter reads
  `['!=', ['get','id'], 'P-01']`, proving the selected plot is excluded from the darkening.
- **Marching ants**: stepping fake timers 80 ms yields `DASH_SEQUENCE[1]`, another 140 ms yields
  `DASH_SEQUENCE[3]` — the dasharray provably changes over time rather than sitting still.
- **Corner brackets**: exactly 4 markers added, each carrying `animate-bracketIn` with inline
  `animationDelay` of `0/60/120/180ms`; all 4 report `removed === true` after `clear()`.
- **Camera framing**: one `fitBounds` call with `maxZoom: 17.5` and `padding.right: 420` /
  `padding.left: 360` — the hardcoded `flyTo({zoom:16.3})` is gone, so the plot can no longer hide
  behind the right drawer.
- **`clear()` undo**: both dim opacities return to `0` and every slab returns to `4`.
- **Crash safety**: the hook is rendered against a bare map whose `getLayer`/`getSource` always
  return `undefined` and does not throw — this is the "selecting a plot mid-intro" guard.
- **No mutation**: `createWorkingPlotsData` is proven not to touch `FARMS_GEOJSON_DATA`
  (full JSON snapshot compared before/after; `riseHeight` stays `undefined` on the import).

Animation maths — pure helpers tested on sampled grids rather than by eye:

- `computeStaggerDelays`: largest screen `y` (nearest the bottom, closest to camera) gets delay `0`;
  no negative delays; span is exactly `(count-1) × 55 ms`; all delays distinct.
- `heightAtTime`: `0` at `t=0`, stays `0` until the feature's own delay elapses, hits exactly
  `26` at the end of its 900 ms window, clamped at `26` forever after, monotonically non-decreasing
  across a 25 ms grid from 0–1700 ms.
- `settleHeightAtTime`: exactly `26 → 4`, monotonically non-increasing, clamped past the window.
- `getCentroid`: the real signed-area centroid of all 13 plots lies **strictly inside** each plot's
  own bbox (the rotated quads make this a real test, not a tautology).
- `buildWorldMaskWithHole`: 2 rings, both closed, outer CCW + hole CW, outer spans the full
  `[-180,-85]..[180,85]` world, hole strictly inside it.
- `getStatusConfig`: label and key collapse to the *same object* for all 4 statuses; whitespace and
  case tolerant; `null`/`undefined`/`''`/`'garbage'`/`0`/`{}`/`[]` all return the fallback and never throw.
- `PlotBadge`: `setSelected(true)` → `(false)` → `(true)` leaves the child node **object references
  identical**, which is the direct proof that no `innerHTML` reassignment happens and CSS transitions
  survive. Class toggling and the inline stagger delay are asserted too.

### Could NOT verify — needs a human with a browser

These require a real WebGL canvas and human eyes. The code is wired and its state transitions are
asserted above, but **nobody has watched these move**:

1. **The headline rise** — whether the 13 slabs visibly emerge from the ground near-to-far and read
   as "the land rising" at full tilt. The height curve, ordering and camera ease are all asserted
   numerically; the *aesthetic* is unverified.
2. **Badge occlusion at settle height** (the known risk). `RISE_SETTLE_HEIGHT = 4` m at pitch 40
   was chosen per the plan, but whether a 4 m slab still clips the price badge of the plot behind it
   **has not been seen**. If it does, drop `RISE_SETTLE_HEIGHT` to 2 in `src/utils/mapTheme.js`
   (single constant, no other edit needed) or set `CAMERA.settled.pitch` back to 35. Flagging this
   rather than leaving badges silently hidden, as instructed.
3. **Intro veil timing** — that the veil covers the grey-tile window and is gone before the rise.
   Mount/unmount logic is deterministic (removed from the DOM after 500 ms, not just transparent)
   but the perceived overlap is unverified.
4. **Panel choreography feel** — navbar drop, 35 ms-staggered card slide, 200 ms-delayed drawer.
   Classes and delays are in the markup and the keyframes are in the emitted CSS; the rhythm is unverified.
5. **Glow pulse** — the sine driving `line-width` 6→10 runs on rAF; asserted to be registered but the
   visible throb was not sampled over time the way the dasharray was.
6. **`prefers-reduced-motion`** via DevTools → Rendering. The media query block is in the emitted CSS
   and both hooks branch on `window.matchMedia`, jumping straight to the overview with no rAF loop.
   Not toggled in a real browser.
7. **Mobile/compact layout** below `lg` — list hidden, drawer as a bottom sheet, pitch 25, rise skipped.
   Driven by `window.innerWidth < 1024` and Tailwind `lg:` prefixes; never rendered at a small viewport.
8. **Master Lease regression** — multi-select, floating-bar totals, `/book` navigation, the
   `farmely_master_lease_selected_plots` localStorage key and the `?plots=` URL round-trip.
   **Not exercised.** This logic was deliberately left byte-for-byte untouched (verified by grep: the
   only edits inside the master-lease block were `font-black`→`font-extrabold`,
   `shadow-[...]`→`shadow-float` and `shadow-lg`→`shadow-md`), but no click-through was performed.
   Same for the search box, the 3 status tabs, the auth modal and the left-list `scrollIntoView`.

---

## 4. Deliberate deviations from the plan

**`animate-slideInRight` is defined but unused.** Task 7 asked for the right drawer to enter with
`animate-slideInRight` delayed 200 ms. The drawer's open/close has always been driven by a
`translate-x-[400px] → translate-x-0` transition on the `aside` itself. A keyframe that also animates
`transform` would fight that transition on the same element and produce a visible snap. Instead the
existing transform mechanism is reused and the 200 ms arrives via an inline `transitionDelay`
(`entranceDelayMs` prop), gated on `panelsReady`. **The user-visible result is the same motion** —
drawer slides in from the right, 200 ms after the land settles. The keyframe stays in
`tailwind.config.js` as a token; Tailwind tree-shakes it from the CSS because nothing references the
utility, which is why the grep above shows it absent.

**Spotlight does not fire for the initial selection.** `selectedPlotId` defaults to `'P-01'`, and the
original code guarded the first render with `isFirstRenderRef` so the default selection highlighted
P-01 *without* flying the camera to it. Wiring the new spotlight purely off `selectedPlot` would have
made the camera dive into P-01 the instant the intro settled, destroying the overview reveal that
Tasks 4 and 7 exist to deliver. The hook is therefore gated on `hasUserSelected`, which flips the
first time the selection differs from the initial id. Net effect matches the old behaviour: P-01
starts highlighted, the camera rests at the farm overview, and the spotlight engages on the first
real user selection.

---

## 5. What changed, file by file

### Modified

- **`tailwind.config.js`** — added 8 `keyframes` + 8 matching `animation` entries (entrances on
  `cubic-bezier(0.22,1,0.36,1)`, `fadeIn` at a snappy 250 ms, `shimmer` and `pulseGlow` infinite),
  `spacing.84 = 21rem`, `scale.115 = 1.15`, and the three elevation tiers
  `shadow-rail` / `shadow-float` / `shadow-panel`. Existing `soft`/`elevated`/`yellow-glow` untouched.
  Defining `fadeIn` switches on all 11 previously dead `animate-fadeIn` call sites across the app
  (Modal, Register, BookPlot, 4 dashboards, Hero, PublicNavbar, Marketplace) — intended per the plan.
- **`src/styles/global.css`** — appended the `prefers-reduced-motion: reduce` block neutralising
  animation duration, iteration count, transition duration and scroll behaviour globally.
- **`src/pages/public/Marketplace.jsx`** — lifted the map's intro `phase` into page state via an
  `onPhaseChange` prop and derived `panelsReady`; navbar → `bg-white/80 backdrop-blur-xl shadow-rail`
  + `animate-dropInTop`; left list → `bg-white/90 backdrop-blur-xl shadow-float` + `animate-slideInLeft`
  with per-card `animationDelay: index*35ms`, and `hidden lg:flex` for the mobile guard; bottom
  master-lease bar shadow reduced to `shadow-float` so it stops out-weighing the drawer; card and
  tab status colours routed through `getStatusConfig` / `isAvailableStatus`; the "Đang trống" tab count
  now reuses the existing `availableCount` memo; `font-black` eliminated, `font-extrabold` reserved for
  plot codes and prices, `font-semibold` for labels, `font-medium` for metadata; all `shadow-2xs` /
  `shadow-xs` → `shadow-sm`. **No business logic touched.**
- **`src/components/marketplace/MarketplaceInteractiveMap.jsx`** — rewritten around the new modules.
  ~250-line layer-registration block replaced by `registerFarmLayers`; badges built by the
  `createPlotBadge` factory with stagger delays; selection effect now flips only the previously- and
  newly-selected badge instead of looping the whole collection; old camera/filter body replaced by
  `usePlotSpotlight`; intro driven by `useMapIntroAnimation` with the veil rendered inside;
  `handleReset` calls `clear()`; compact-viewport guard lowers pitch to 25 and skips the rise;
  all markers/badges destroyed in cleanup; `shadow-xs` → `shadow-sm`, control buttons de-bolded.
- **`src/components/marketplace/MarketplacePlotDetailPanel.jsx`** — elevation/typography polish only:
  `bg-white/95 backdrop-blur-2xl shadow-[0_20px_60px_...]` → `bg-white shadow-panel` (primary tier,
  most opaque and most elevated); 14 `font-black` retiered to extrabold/semibold/medium;
  `shadow-2xs`/`shadow-xs` → `shadow-sm`; `hover:scale-115` → `hover:scale-110`; new
  `entranceDelayMs` prop; and the responsive bottom-sheet classes for the mobile guard.

### Created

- `src/utils/geoUtils.js` — `getRingCorners`, `getCentroid` (signed-area), `getFeatureBBox`,
  `easeOutCubic`, `easeInOutCubic`, `clamp01`, `buildWorldMaskWithHole`, `getRingWinding`.
- `src/utils/mapTheme.js` — `getStatusConfig` (label|key|garbage → safe entry), `isAvailableStatus`,
  `LAYER_IDS`, the three height constants, `DASH_SEQUENCE` + `dashSequenceAt`, the `CAMERA` presets
  and the single `OVERVIEW_BOUNDS`/padding that de-duplicates the corner pair previously repeated in
  three places, `buildStatusColorExpression`, `MOBILE_PITCH`.
- `src/components/marketplace/map/mapLayers.js` — `registerFarmLayers` (idempotent via
  `ensureSource`/`ensureLayer` so Vite HMR cannot double-register), `createWorkingPlotsData`,
  `setSelectedPlotFilters`. Adds the `plots-extrusion` fill-extrusion layer below the line layers,
  plus the two spotlight dim layers at opacity 0.
- `src/components/marketplace/map/PlotBadge.js` — the no-`innerHTML` badge factory.
- `src/components/marketplace/MarketplaceIntroVeil.jsx` — slate-950 veil, logo, the Vietnamese
  loading line, shimmer progress bar; unmounts after its 500 ms fade.
- `src/hooks/useMapIntroAnimation.js` — rise + settle, `map.once('idle')` gate, screen-space stagger,
  30 fps `setData` throttle when `hardwareConcurrency <= 4`, reduced-motion and `skipRise` branches,
  exported `computeStaggerDelays` / `heightAtTime` / `settleHeightAtTime`.
- `src/hooks/usePlotSpotlight.js` — dim mask, extrusion pop, marching ants, glow pulse, 4 corner
  brackets, `fitBounds` framing, and `clear()`.
- Five colocated test files (60 tests total).

---

## 6. Leak / guard audit (Task 8)

- Every `requestAnimationFrame` handle is stored in a ref and cancelled: `useMapIntroAnimation`
  cancels in its effect cleanup and inside `skip()`; `usePlotSpotlight` cancels `dimRaf`/`heightRaf`
  at the start of each new animation and all three rAF refs in a dedicated unmount effect.
- The marching-ants `setInterval` is cleared in the selection-effect cleanup, in `clear()`, and on unmount.
- Corner brackets are `.remove()`d on selection change, on `clear()`, and on unmount; badge markers and
  the 4 GPS corner pins are removed, and every badge `.destroy()`ed, in the map effect's cleanup.
- Every `map.getLayer(...)` / `map.getSource(...)` access is existence-checked; `map.once`/`off`/
  `project`/`easeTo`/`setPitch` are called through optional chaining or `typeof` guards. Proven by the
  "bare map" test.
- Selecting a plot during the intro is **not blocked**; it cancels the intro via `skip()` and jumps to
  the settled state, so the user is never locked out (decision was pre-made in the plan).


---

# ITERATION 2 — review fixes (`marketplace-review.json`, verdict CHANGES_REQUESTED)

`.agents/tasks/marketplace-review.json` existed at the start of this run, so this was a **later
iteration**: the review document was read and all 10 findings were addressed. No approved work was
regressed — all 60 pre-existing tests still pass unchanged, and 10 new ones were added. Work remains
**uncommitted** in the user's checkout, no branch, no worktree.

## 1. Commands run and their results

| # | Command (cwd `d:\isp392\frontend`) | Exit | Result |
|---|---|---|---|
| 1 | `npm test` (= `vitest --run`) | 0 | 60 passed / 60 (iteration-1 baseline re-verified) |
| 2 | `npm run build` (= `vite build`) | 0 | clean |
| 3 | `npm test` (after adding watchdog + accent tests) | 0 | 67 passed / 67 |
| 4 | `npm test` (after adding the component degradation suite) | 0 | 69 passed / 69 |
| 5 | `npm run build` | 0 | clean |
| 6 | `npm test` — **FINAL** | **0** | **70 passed / 70, 7 files, 0 failed** |
| 7 | `npm run build` — **FINAL** | **0** | **clean** |

### Final `npm run build` output highlights

```
dist/index.html                  0.98 kB | gzip:   0.56 kB
dist/assets/index-B3ar_6_E.css 179.99 kB | gzip:  25.98 kB
dist/assets/index-CXsg4UtP.js  2,278.67 kB | gzip: 605.83 kB
built in 15.90s
```

The only warning is the pre-existing `chunks are larger than 500 kB` advisory (maplibre-gl + recharts);
it predates this work and code-splitting was never in scope. The CSS shrank from 180.23 kB to 179.99 kB
because `scale-115` and the other utilities that only ever appeared inside test files no longer leak
into the production stylesheet (finding 7).

### Final `npm test` output

```
src/utils/geoUtils.test.js                                     (15 tests)
src/utils/mapTheme.test.js                                     (13 tests)
src/components/marketplace/map/PlotBadge.test.js               ( 9 tests)
src/hooks/useMapIntroAnimation.test.js                         (13 tests)
src/hooks/useMapIntroAnimation.watchdog.test.jsx               ( 5 tests)  NEW
src/components/marketplace/MarketplaceInteractiveMap.test.jsx  ( 3 tests)  NEW
src/hooks/usePlotSpotlight.test.jsx                            (12 tests)  +2

Test Files  7 passed (7)
     Tests  70 passed (70)
```

### Emitted-CSS re-verification (`dist/assets/index-B3ar_6_E.css`)

```
scale-115              => 0 occurrences  (finding 7: token dropped, gone from the bundle)
.w-84                  => 1
shadow-rail            => 1
shadow-float           => 2
shadow-panel           => 1
@keyframes fadeIn      => 2
@keyframes shimmer     => 1
@keyframes bracketIn   => 1
@keyframes dropInTop   => 1
@keyframes slideInLeft => 1
prefers-reduced-motion => 2
```

No watch-mode or blocking command was run at any point. `npm test` is `vitest --run`.

## 2. How each finding was fixed

1. **Page chrome has no fallback when the map never settles** (blocking) — four independent escapes now
   exist:
   - `new maplibregl.Map(...)` is wrapped in `try/catch`; a throw (no WebGL) sets `mapFailed`.
   - `MAP_LOAD_WATCHDOG_MS = 6000` in `MarketplaceInteractiveMap` — if `load` never fires,
     `loadTimedOut` flips.
   - `WATCHDOG_MS = 4500` in `useMapIntroAnimation` — if `idle` never fires, `forceSettled()` pushes the
     settled heights, jumps to the overview camera and sets phase `done`. The reduced-motion branch gets
     the same watchdog, since it waited on the same `idle` event.
   - A `webglcontextlost` listener on the map canvas sets `mapFailed` if the context dies mid-intro; it
     is removed in the effect cleanup.
   `degraded = mapFailed || (!mapReady && loadTimedOut)` and `effectivePhase = degraded ? 'done' : phase`
   drive both the veil and `onPhaseChange`, so a broken map degrades to the old failure mode (satellite
   missing, list and drawer usable) instead of a blank slate behind a permanent veil.
   `map.on('error')` was deliberately NOT used to degrade: maplibre fires `error` for every failed tile,
   so one missing tile would have torn the whole 3D view down.
2. **Invisible chrome stays clickable during the intro** (blocking) — the not-ready branch of the header
   (`Marketplace.jsx:271`) and of the aside (`:377`) is now `opacity-0 pointer-events-none`, so the
   invisible nav links, search box and plot cards cannot be clicked during the intro.
3. **Reduced-motion branch guards the wrong method** — the guard is now
   `typeof map.fitBounds === 'function'`, matching the method actually called.
4. **Leaked `idle` listener in the reduced-motion branch** — `map.off?.('idle', run)` added to that
   branch's cleanup alongside the watchdog's `clearTimeout`, mirroring the main path.
5. **Selected-plot accent inconsistent across effects** — new `setSelectedPlotAccent(map, status)` in
   `mapLayers.js` drives `plots-selected-glow` (`line-color`), `plots-selected-border` (`line-color`) and
   `plots-selected-fill` (`fill-color`) from `getStatusConfig(status)` and returns the accent the corner
   brackets then use, so all four effects share one colour. `clear()` resets them to the AVAILABLE
   palette the layers are registered with.
6. **Dead no-op ternary** — collapsed; the accent is now a single expression returned by
   `setSelectedPlotAccent`.
7. **`scale.115` token dead in production** — the token was removed from `tailwind.config.js`, and
   `content` carries a negated glob `"!./src/**/*.{test,spec}.{js,ts,jsx,tsx}"` so class-name strings
   inside assertions can no longer leak utilities into the production stylesheet. Verified: `scale-115`
   has 0 occurrences in the emitted CSS, and `PlotBadge.test.js`'s "never emits v4-only or out-of-scale
   utilities" assertion still passes.
8. **Status normalization applied unevenly** — every status comparison on the page now goes through the
   normalizer: `filteredPlots` (AVAILABLE via `isAvailableStatus`, RENTED via `getStatusConfig(...).key`),
   `availableCount`, `handleToggleSelectPlotForContract`, `handleBookPlot`, and the left-list card's
   `isVacant`. `MarketplacePlotDetailPanel.jsx:79` was also switched to `isAvailableStatus` (one line,
   behaviour-identical on the current dataset); `displayStatus` was intentionally left alone because
   changing it would alter what MAINTENANCE/UPCOMING plots display.
9. **Search box dead below `lg`** — the header search input and its divider are now `hidden lg:block`,
   matching the aside it filters (`hidden lg:flex`). This is the behaviour-preserving option: nothing
   changes at `lg` and above, and below `lg` a control that could not affect anything visible is simply
   not rendered. The alternative (surfacing mobile results) would have been new UI beyond the plan.
10. **Flat dim fill may not darken the 3D slabs** + stray key — `geometry: undefined` was removed from
    `createWorkingPlotsData`. For the dim concern, `setExtrusionSpotlight(map, selectedId)` swaps
    `fill-extrusion-color` to a `['case', ['==', ['get','id'], selectedId], <status colour>, <near-black>]`
    expression while a plot is selected, and restores the plain `match` expression on clear.
    `fill-extrusion-opacity` is not data-driven in maplibre, so driving the colour is the only way to
    darken individual slabs. This is asserted, not observed (see section 4).

## 3. New tests added this iteration (10)

- `src/hooks/useMapIntroAnimation.watchdog.test.jsx` (5) — against a fake map whose `idle` never fires:
  phase reaches `done` after `WATCHDOG_MS`, every slab ends at `RISE_SETTLE_HEIGHT`, the overview camera
  is applied with `duration: 0`, the `idle` listener is removed, and the watchdog is cleared on unmount
  (no stray timer, no state write after teardown).
- `src/components/marketplace/MarketplaceInteractiveMap.test.jsx` (3) — the three degradation paths
  finding 1 described: constructor throw (no WebGL), `load` never firing, and `webglcontextlost`. Each
  asserts `onPhaseChange` was last called with `'done'` AND that the veil (`[role="status"]`) is gone
  from the DOM.
- `src/hooks/usePlotSpotlight.test.jsx` (+2) — selecting a RENTED plot paints the glow, border and fill
  with that status's palette (not the emerald AVAILABLE one) and the four brackets use the same colour;
  `fill-extrusion-color` becomes a `case` expression keyed on the selected id while selected and returns
  to the plain `match` expression after `clear()`.

## 4. Verification honesty — observed vs asserted vs not verified

**Observed in a running dev server:** nothing visual. The dev server was started as a detached
background process and probed over HTTP — `/marketplace` returned 200, and `Marketplace.jsx`,
`MarketplaceInteractiveMap.jsx`, `usePlotSpotlight.js`, `useMapIntroAnimation.js` and `mapLayers.js`
were each transformed and served with status 200 (a transform failure would have returned 500 with the
error), after which the server was stopped and port 3000 confirmed released. That proves the modules
compile and serve; it does NOT prove motion. There is no browser or screenshot capability in this
environment, so NO animation was watched this iteration.

**Asserted programmatically (read back from a recording fake map or from the emitted CSS), not observed:**
- the four watchdog/degradation paths, and the veil leaving the DOM in each;
- the selected slab standing at `SELECTED_HEIGHT` 14 while the rest sit at `RISE_SETTLE_HEIGHT` 4;
- both dim layers settling at `fill-opacity` 0.5, with `plots-dim` filtered to exclude the selection;
- the per-status accent on glow / border / fill / brackets;
- the `fill-extrusion-color` case-expression swap (finding 10's remedy);
- the dasharray advancing through `DASH_SEQUENCE` under fake timers;
- 4 brackets added with 0/60/120/180 ms delays and all 4 removed;
- one `fitBounds` with `maxZoom: 17.5` and the asymmetric padding;
- the keyframes, the three elevation tiers, `.w-84` and the reduced-motion block in `dist/assets/*.css`,
  and the absence of `scale-115` there.

**Could not verify (unchanged from iteration 1, still open):**
- Whether a 4 m slab occludes the price badge of the plot behind it at pitch 40 — the known risk the
  plan flagged. The remedy is still one constant: lower `RISE_SETTLE_HEIGHT` in `src/utils/mapTheme.js`
  to 2, or set `CAMERA.settled.pitch` back to 35. Badges may be partially hidden on screen and I have
  not been able to look.
- Whether `plots-dim` alone would have failed to darken the slabs (finding 10). The colour-swap remedy
  was implemented pre-emptively and is asserted by test, but the visual outcome is unconfirmed.
- The reduced-motion DevTools toggle, the Master Lease click-through regression (multi-select, floating
  bar totals, `/book` with the `?plots=` round-trip), the auth modal and the left-list `scrollIntoView`
  were verified by code inspection and, for the status helpers, by unit test — not by clicking through a
  browser.
