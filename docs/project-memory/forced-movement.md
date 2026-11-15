---
name: forced-movement
description: Rules of the shared forced-move system (bombs, tornado compass, ice momentum, chain preview, same-round Nexus burn), PR #324 + #326
metadata:
  type: project
  modified: 2026-10-19T23:49:18.845Z
---

mondo asked (2026-10-18) for every push/pull/knockback/fling/throw to be ONE deterministic system so chains can be planned (pull → bomb → tornado → ice → nexus). Shipped as PR #324 + #326; the zip is ENTROPY_WARS_SYNC_20261018-1616.

- **One path:** everything walks battle.js resolveForcedSlide, then THE CHAIN resolveTileArrival with dirX/dirY (heading), so ice glides on. Never add a separate displacement path; route new push/pull spells through it.
- **Bombs:** the trigger body is thrown back the way it came. Bystanders are thrown straight away from the bomb. An owner detonation (Detonate/contact/scan) throws everyone opposite their facing as read BEFORE the blast damage, because a hit turns the victim toward its attacker. 1 tile, and weight rules apply.
- **Tornado/hurricane:** they fling north the round they form, then E, S, W (vortexFlingDir, weather.bornRound). The board draws the heading arrow.
- **Air:** airborne bodies trigger no bombs or traps. A hooked or grappled flyer is grounded first, then its landing reacts.
- **Nexus:** processLateNexusBurn runs after the storm phase, so a body a round-end fling throws into a hostile Nexus burns the SAME round, as mondo wanted. Bodies the early pass already burned are stamped `_nexusBurnRound` and skipped.
- **Preview:** the forecast uses simulateArrivalChain with the same rules and draws each leg as an arrow (ice cyan, bomb orange, fling aquamarine). Players only see their own hidden bombs and traps in it. Hovering DETONATE previews the blasts. (Until PR #546, 10-26, the HUD pusher rows never called hoverIn, so the Detonate hover drew nothing; now wired. The forecast also hides the caster's own bombs while simulating, as doDetonate lifts them first.)
- **Storms underfoot (PR #343, 10-19, zip SYNC_20261019-2349):** every homing storm (tornado, hurricane, thunderstorm, blizzard, sandstorm) strikes a body that lands on OR walks through its eye (state.js stormStrikeUnit, once per storm per body per round). A tornado/hurricane eye stops the walk and flings. Lava/fire burn a walker on any path tile, once each per walk. Weather stat changes show on the name plate (getWeatherStatChips). mondo confirmed sandstorm does NOT blind (only -5 VISION).
- **Browser check recipe:** Playwright proxy needs bypass 'localhost' or the page loads the proxy's error. scratchpad bt/driver.js. It runs Playwright with the proxy plus asset_cache LOCAL_ASSETS, and serves jsdelivr libs from npm-pack tarballs, because jsdelivr is blocked by the network policy.

- **Force field (PR #389, 10-21, zip SYNC_20261021-0204):** a slam into the board's OUTER edge (resolveForcedSlide info.kind 'edge') lights a cyan hex-grid barrier on that face (three-renderer forceFieldFx, battle.js playForceFieldFx, relayed in 'collision-fx' with dx/dy/z). Look only; inner walls unchanged. Browser check: run the slide on the ACTIVE unit (camera already on it); the turn camera fights any other framing.
