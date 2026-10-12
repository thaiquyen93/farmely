# Marketplace intro animation, spotlight and elevation redesign — pass 2

Iteration 2 addresses all ten findings from the previous review, and each fix holds up against the code. The map now has four independent escapes from a stalled intro (constructor `try/catch`, a 6 s `load` watchdog in the component, a 4.5 s `idle` watchdog inside `useMapIntroAnimation`, and a `webglcontextlost` listener), the not-ready page chrome is `opacity-0 pointer-events-none` so invisible controls are no longer clickable, the selected-plot accent is driven from one `setSelectedPlotAccent` call shared by glow/border/fill/brackets, non-selected 3D slabs are darkened through `fill-extrusion-color` because `fill-extrusion-opacity` cannot be data-driven, the `scale.115` token is gone along with the test-file leak into the Tailwind `content` glob, and every page-level status comparison now routes through `getStatusConfig`/`isAvailableStatus`. Hard constraints still hold: no v4-only utility anywhere in the touched files, `vitest@2.1.8` + `jsdom@25.0.1` exact-pinned and nothing else, rAF plus CSS keyframes only, and `FARMS_GEOJSON_DATA` untouched by the rise. Evidence is present and green: `npm run build` exit 0, `npm test` exit 0 at 70/70 across 7 files, with the emitted CSS re-grepped for the keyframes, elevation tiers, `.w-84`, the reduced-motion block and the absence of `scale-115`.

**Watch for:** the new 6 s component watchdog is not sticky, so a `load` that arrives late (slow tiles — exactly the case the watchdog exists for) drops `effectivePhase` from `done` back to `waiting`, hiding the chrome again and remounting the veil mid-session (confirmed). Non-selected plots are now darkened twice over — the `plots-dim` fill at 0.5 plus a near-black extrusion colour — and nobody has looked at the result (possible). The badge-occlusion risk at `RISE_SETTLE_HEIGHT = 4` the plan flagged is still unobserved, with its one-constant remedy documented.

**Verdict**: APPROVED

## High-level view

The failure-path wiring is the substance of this iteration. `MarketplaceInteractiveMap` derives `degraded = mapFailed || (!mapReady && loadTimedOut)` and publishes `effectivePhase = degraded ? 'done' : phase`, which feeds both the veil and `onPhaseChange`. That restores the pre-change failure mode — satellite missing, list and drawer usable — instead of a blank page behind a permanent veil. The one rough edge is that the second disjunct stops holding the moment `load` finally fires, so the degraded verdict is reversible.

Colour now has a single owner per concern. `setSelectedPlotAccent` writes `line-color` on the glow and border layers and `fill-color` on the selected fill from `getStatusConfig(status)` and returns that config, which the corner brackets then reuse, so a rented plot can no longer get emerald edges with amber brackets. `setExtrusionSpotlight` swaps `fill-extrusion-color` to a `case` expression keyed on the selected id while a plot is selected and restores the plain `match` on clear; that is the only lever maplibre offers here, and it stacks on top of the flat dim fill rather than replacing it.

Status normalization is now applied uniformly on the page: `filteredPlots`, `availableCount`, `handleToggleSelectPlotForContract`, `handleBookPlot`, the left-list card's `isVacant` and the detail panel's `isVacant` all go through the normalizer. `displayStatus` in the detail panel is deliberately left as a raw label pair; changing it would alter what MAINTENANCE and UPCOMING plots display.

Business logic is intact. `selectedPlotId` still defaults to `'P-01'` and `showDetailPanel` to `true`, the `farmely_master_lease_selected_plots` key is read, written and removed on the same paths, the `?plots=` round-trip and all four `/book` navigations are unchanged, and the auth gate plus `handleQuickDemoLogin` are untouched. Edits inside the master-lease block remain confined to typography and shadow swaps. None of it has been clicked through, which the author states plainly.

Cleanup is complete as far as code inspection goes: every rAF handle cancelled, the marching-ants interval cleared in the selection cleanup, `clear()` and on unmount, brackets and badges removed in all three places, both watchdog timers cleared on unmount, the `idle` listener now `off`-ed in the reduced-motion branch as well, and layer registration idempotent through `ensureSource`/`ensureLayer`.

The remaining gap is visual. Nothing in this change has been watched move: no browser, no screenshots. The motion is pinned by state assertions against recording fake maps, but the aesthetic questions — does the land read as rising, do 4 m slabs clip the badges behind them, does the double dim crush the unselected plots — are open.

<details>
<summary>Issues (5)</summary>

1. **Late `load` un-degrades the page** (confirmed, non-blocking) — `degraded` in MarketplaceInteractiveMap.jsx:224 stops holding once `mapReady` flips, so a `load` arriving after `MAP_LOAD_WATCHDOG_MS` (6 s) sends `effectivePhase` from `done` back to `waiting`: the navbar and list return to `opacity-0 pointer-events-none`, the veil remounts, and anything typed in the search box is inaccessible for the length of the intro. Latch the degraded decision (sticky state, or skip the intro when the watchdog already fired).
2. **Non-selected plots are dimmed twice** (possible) — `plots-dim` holds `fill-opacity` 0.5 while `setExtrusionSpotlight` (mapLayers.js:173) paints the same plots near-black at `fill-extrusion-opacity` 0.55. The combination may crush them past legibility. Check in a browser; if so, drop the dim fill target or lighten `DIM_EXTRUSION_COLOR`.
3. **Compact-viewport decision is frozen at mount** (confirmed, non-blocking) — `useState(() => isCompactViewport())` in MarketplaceInteractiveMap.jsx:52 never re-evaluates, so crossing the `lg` boundary by resize or rotation leaves the mobile pitch and `skipRise` in force while the Tailwind `lg:` layout switches. Re-read on resize, or accept and document it.
4. **Badge occlusion at settle height still unobserved** (possible) — whether a 4 m slab clips the price badge of the plot behind it at pitch 40 has not been seen by anyone. Look at it in a browser; remedy is one constant, `RISE_SETTLE_HEIGHT` → 2 in `src/utils/mapTheme.js` or `CAMERA.settled.pitch` → 35.
5. **Master-lease surface never clicked through** (confirmed, non-blocking) — multi-select, floating-bar totals, the `?plots=` round-trip, `/book`, the auth modal and the left-list `scrollIntoView` are verified by inspection only; the code is byte-identical apart from typography and shadow swaps, but no test and no click covers them. Run one manual pass before shipping.

</details>

<details>
<summary>Details</summary>

### How each prior finding was closed

The two blocking ones are properly fixed rather than patched. `new maplibregl.Map(...)` is wrapped in `try/catch` and sets `mapFailed` on throw (MarketplaceInteractiveMap.jsx:104-111); a `webglcontextlost` listener on the canvas does the same mid-session and is removed in the effect cleanup; `MAP_LOAD_WATCHDOG_MS` covers `load` never firing; and `WATCHDOG_MS` inside `useMapIntroAnimation` covers `idle` never firing by calling `skipRef.current()`, which pushes the settled heights, jumps to the overview and sets phase `done`. The reduced-motion branch gets its own watchdog because it waited on the same `idle` event. Declining to degrade on `map.on('error')` is the right judgement — maplibre fires `error` per failed tile, so one dead tile would have torn down the whole 3D view.

The invisible-but-clickable chrome is closed at both sites: the header (Marketplace.jsx:271-275) and the aside (Marketplace.jsx:377-381) now carry `opacity-0 pointer-events-none` in the not-ready branch and `pointer-events-auto` only once `panelsReady`.

The reduced-motion branch now guards `typeof map.fitBounds === 'function'` — the method it actually calls — and its cleanup calls `map.off?.('idle', run)` alongside `clearTimeout`, mirroring the main path. The no-op ternary is gone, replaced by the single `accent` expression returned from `setSelectedPlotAccent` (usePlotSpotlight.js:222). `geometry: undefined` is off the working FeatureCollection. The `scale.115` token is removed from `tailwind.config.js` and the `content` array gained `"!./src/**/*.{test,spec}.{js,ts,jsx,tsx}"`; Tailwind 3.4 does honour negated content globs (`node_modules/tailwindcss/lib/lib/content.js` splits patterns into positive/negative tasks), so test-file class strings can no longer leak utilities into production CSS.

### Why the un-degrade window matters

```
t=0      map constructed, phase 'waiting', veil up, chrome opacity-0
t=6s     loadTimedOut -> degraded -> effectivePhase 'done'
         veil unmounts, navbar + list + drawer appear, user starts typing
t=8s     'load' finally fires -> mapReady true -> degraded false
         effectivePhase = phase = 'waiting'
         veil REMOUNTS, chrome back to opacity-0 pointer-events-none
t=8s..   intro plays, phase reaches 'settling', chrome returns
```

`MarketplaceIntroVeil` tracks `mounted` off `phase === 'waiting'` and sets it back to `true` whenever the phase returns there, so this is a full remount, not a leftover transparent node. The user ends in a working state either way, which is why this is not blocking — but the window is widest on exactly the slow connections the watchdog was added for, and the fix is to make the degraded decision one-way.

### Test coverage

70 tests across seven files. The ten new ones target the paths that previously slipped through a green suite: `useMapIntroAnimation.watchdog.test.jsx` drives the hook against a fake map whose `idle` never fires and asserts phase reaches `done` after `WATCHDOG_MS`, every slab lands on `RISE_SETTLE_HEIGHT`, the overview camera is applied with `duration: 0`, the `idle` listener is removed, and no timer fires after unmount; it covers the `skipRise` branch separately. `MarketplaceInteractiveMap.test.jsx` mocks maplibre to exercise the three degradation paths and asserts both that `onPhaseChange` was last called with `'done'` and that `[role="status"]` is gone from the DOM. `usePlotSpotlight.test.jsx` gained per-status accent assertions (a RENTED plot paints glow, border, fill and brackets from its own palette) and the `fill-extrusion-color` `case`-expression swap and restore.

The older suites still carry the load-bearing checks: child-node object identity across three `setSelected` toggles in `PlotBadge.test.js` (the direct proof no `innerHTML` reassignment happens), label/key collapse and garbage-input fallback in `mapTheme.test.js`, grid-sampled monotonicity and clamping of the height curves, signed-area centroids checked against each rotated quad's own bbox, and the before/after JSON snapshot proving `FARMS_GEOJSON_DATA` is never mutated.

Not tested: the un-degrade window above (no test drives `load` arriving after the watchdog), `registerFarmLayers` idempotence (claimed, still not asserted), `handleReset`, and the whole master-lease interaction surface.

</details>

<details>
<summary>File map</summary>

Modified
- `frontend/tailwind.config.js` — three elevation tiers, `spacing.84`, 8 keyframe/animation pairs, test files excluded from `content`; `scale.115` dropped; existing `soft`/`elevated`/`yellow-glow`/brand tokens untouched.
- `frontend/src/styles/global.css` — global `prefers-reduced-motion: reduce` block.
- `frontend/src/pages/public/Marketplace.jsx` — phase lifted to page state, `panelsReady` gating with `pointer-events-none` when not ready, all status comparisons normalized, search box `hidden lg:block`, typography retiering.
- `frontend/src/components/marketplace/MarketplaceInteractiveMap.jsx` — rebuilt on the new modules and hooks; constructor `try/catch`, load watchdog, `webglcontextlost`, `degraded`/`effectivePhase`; targeted badge toggling; full cleanup.
- `frontend/src/components/marketplace/MarketplacePlotDetailPanel.jsx` — `shadow-panel` tier, `entranceDelayMs`, bottom-sheet classes, `isAvailableStatus`, typography retiering.
- `frontend/package.json`, `frontend/package-lock.json`, `frontend/vite.config.js` — exact-pinned vitest + jsdom and the jsdom test environment.

Created
- `frontend/src/utils/geoUtils.js` (+ test), `frontend/src/utils/mapTheme.js` (+ test).
- `frontend/src/components/marketplace/map/mapLayers.js` — idempotent registration, working-copy factory, selection filters, `setSelectedPlotAccent`, `setExtrusionSpotlight`.
- `frontend/src/components/marketplace/map/PlotBadge.js` (+ test) — non-destructive badge factory.
- `frontend/src/components/marketplace/MarketplaceIntroVeil.jsx` — veil that unmounts after its fade.
- `frontend/src/hooks/useMapIntroAnimation.js` (+ test, + watchdog test), `frontend/src/hooks/usePlotSpotlight.js` (+ test).
- `frontend/src/components/marketplace/MarketplaceInteractiveMap.test.jsx` — degradation paths.

Full diff: `git diff` in `d:\isp392` (work uncommitted).

</details>
