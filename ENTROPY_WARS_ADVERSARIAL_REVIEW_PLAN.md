# Entropy Wars — adversarial review plan

Last updated: 2026-09-09 (America/Chicago)
Repository: https://github.com/dirtymondo-sudo/EntropyWars_Prototype
Baseline: files fetched from main on this date; no immutable commit baseline captured yet.
Delivery: this document is repository/reference material only. No R2 upload or cache bump required.

## Objective

Review the game as a skeptical player and maintainer, then improve the weakest systems in manageable phases. Cover all eight requested categories. Preserve the existing art style, game identity, authored DOOR canon, and host/guest behavior.

Each phase must leave behind evidence, prioritized findings, a bounded improvement batch, and an updated version of this plan. A proposed fix, a locally validated fix, a delivered file, and a verified live fix are separate states.

## Current status

- [x] Phase 0 — establish scope, inspect project instructions, and identify initial risks.
- [ ] Phase 1 — loading, scene transitions, and stale battle UI.
- [ ] Phase 2 — performance baseline and optimizations that preserve the look.
- [ ] Phase 3 — one pause menu across battle and DOOR HQ.
- [ ] Phase 4 — cinematic camera composition and continuity.
- [ ] Phase 5 — spell identity, animation timing, and VFX.
- [ ] Phase 6 — Arena and Team Deathmatch AI.
- [ ] Phase 7 — map art, environmental coherence, and asset brief.
- [ ] Phase 8 — integrated player UX and developer review.

Phase 0 is a scoped reconnaissance pass, not a completed game audit. No gameplay code has been edited. No browser playtest, FPS capture, simulation, or visual comparison has run.

### Working rules

1. Read current source and relevant subsystem history before changes. Main may differ from the live R2/Render build or from files delivered in another task.
2. Start with a precise failure scenario; trace the actual code path before assigning a cause.
3. Distinguish user-reported symptoms, code-confirmed behavior, hypotheses, and runtime-verified defects.
4. Prioritize broken transitions and player control before visual polish. Establish performance measurements before adding visual cost.
5. Work inside the existing runtime files and script order. Documentation and repository-only diagnostics may be added when useful.
6. Check host and guest behavior, fog visibility, cancellation, repeated entry, and error paths for each relevant change.
7. For code deliveries, run the applicable syntax checks and npm test; run parity checks when economy/race constants change. Report unavailable checks honestly.
8. Deliver complete changed files. Every R2 change also requires the matching fresh index.html cache token, preserving its suffix. No automatic commit, push, or deployment.
9. Existing project instructions require explicit playtest authorization. Static review proceeds now; runtime acceptance items remain pending until actual testing is authorized and performed. Read PLAYTEST_NOTES.md before those runs; use the existing P1-versus-CPU harness.
10. Update this plan after every phase, including partial phases, and update subsystem logs when implementation touches them.

## Coverage and order

| Phase | Primary categories | Why here |
| --- | --- | --- |
| 1 | 2: transitions/loading; 8: reliability | A clean scene lifecycle is necessary for trustworthy performance and UI work. |
| 2 | 1: FPS; 8: developer experience | Measure costs before changing cameras, effects, and scenery. |
| 3 | 7: pause menu; 2: transitions | Build consistent input and pause behavior on the lifecycle work. |
| 4 | 3: cinematic action camera | Establish what must stay visible before expanding effects. |
| 5 | 5: spell VFX and animation | Coordinate animation, release, travel, impact, damage, and camera timing. |
| 6 | 6: Arena/TDM AI | Audit decisions against actual mode rules and visible information. |
| 7 | 4: maps/models/textures | Improve environments within the measured visual budget. |
| 8 | 8: overall UX/development; all categories | Check complete player journeys and cross-system regressions. |

## Phase 0 — reconnaissance completed

Reviewed the local project reference and delivery instructions; read targeted sections of current CLAUDE.md and source excerpts from state.js, map.js, ui.js, three-camera.js, and ai.js, plus package.json. Retrieved hud.js and the DOOR master/HQ plan for subsequent inspection; their full contents have not yet been audited.

The connected GitHub fetch could not return three-renderer.js because the file was too large or unsupported. Renderer internals therefore remain unreviewed. Obtain that file through another supported read/download route before diagnosing texture readiness, renderer cleanup, or voxel cost.

### Initial findings

Line numbers below refer to the main files fetched for this pass and may change.

| ID | Evidence and status | Implication / next action |
| --- | --- | --- |
| LIFE-01 | Code-confirmed structure: state.js transitionTo at line 4824 changes flags and marks screenMode dirty; its shown switch has no HQ case. map.js _hqEnter at line 395 assigns GS.HQ directly. | Trace every scene owner and entry/exit path. This is fragmented lifecycle handling; it does not by itself prove the stale-HUD cause. |
| LOAD-01 | Code-confirmed risk: map.js _hqEnter onReady around lines 453–459 schedules nested timeouts that modify the shared hqLoad element. These callbacks contain no room/entry identity check. _hqLeave at line 572 shows no cancellation for these timeouts. | An older entry callback could dismiss a newer loading card. Check renderer callback guarantees and rapid room changes, then use cancellation/entry identity if confirmed. Not yet a confirmed explanation for black textures. |
| PAUSE-01 | Code-confirmed divergence: map.js HQ onEscape opens _hqOpenSettings after closing contextual panels; ui.js openPauseMenu at line 6471 creates the battle pause overlay, whose rendering special-cases the editor but not HQ. | Reuse one pause shell and shared settings, with context-specific actions and input handling. |
| PAUSE-02 | Code-confirmed behavior: ui.js openPauseMenu removes _cinematicEl and clears _activeCinematic; closePauseMenu at line 7505 hides the overlay and clears _gamePaused. | Trace outstanding cinematic callbacks, clocks, and camera ownership. Do not assume removing a cinematic element cancels or resumes its sequence safely. |
| CAM-01 | Code-confirmed structure: three-camera.js distinguishes tactical, subject-follow, cinematic, collision, and sky-gaze behavior. Its cinematic boom-collision bypass is explicit around line 317. | Review shot selection in battle.js together with camera projection and renderer bounds. A global camera-height tweak would be premature. |
| AI-01 | Code-confirmed structure: ai.js assessWinCondition at line 993 scores Keys, tower health, numbers, and respawn timing. It reads state.hourglassTarget with a fallback of 5. | Trace initialization and mode callers to confirm Arena uses the current required Key count and TDM does not inherit inappropriate objective incentives. No incorrect decision established yet. |
| VFX-01 | Current CLAUDE.md documents a shared UAL_SLOTS strikeAt/trim system and ThreeAnim timing consumers. Source consumers have not yet been audited. | Review the existing timing contract before introducing delays or replacing it. |

### User-reported issues to reproduce

| ID | Report | Priority | Runtime status |
| --- | --- | --- | --- |
| REP-01 | Black textures after loading ends. | High | Not reproduced in this review. |
| REP-02 | Old minimap remains when starting another match. | High | Not reproduced in this review. |
| REP-03 | Nameplates/health bars remain on screen in DOOR HQ. | High | Not reproduced in this review. |
| REP-04 | Cinematic shots miss casts, VFX, damage, or use awkward cuts. | High | Not reproduced in this review. |
| REP-05 | Tall units have lower halves cropped during cinematics. | High | Not reproduced in this review. |
| REP-06 | Frame rate needs improvement. | High | Hardware, scene, and frame-time baseline pending. |
| REP-07 | Pause menus differ across states and HQ lacks the desired common menu. | Medium | Separate code paths confirmed; presentation not visually reviewed. |

## Phase 1 — loading and scene lifecycle

### Review

- Map title → HQ → site → match selection → party builder → loading → battle → results → HQ → another match.
- Include Back, cancel, rematch, changed map/mode, failed asset fetch, delayed assets, disconnect, and repeated entry.
- Inventory ownership of the shared canvas, scene, minimap, nameplates, health bars, selection outlines, tooltips, VFX, audio, timers, listeners, and pointer lock.
- Trace resource readiness separately: fetch, decode, material binding, shader preparation, scene attachment, and a valid rendered frame. A fixed delay is not proof of readiness.
- Check late callbacks from old scenes, reused unit/map IDs, cached minimap canvases, stale DOM, and disposed-but-still-referenced GPU resources.
- Distinguish missing/failed textures from unready textures and lighting/material issues that merely appear black.
- Review online loading synchronization and what happens if only one player finishes or fails.

### Improvement batch

Fix demonstrated cleanup and readiness failures in existing files. Give asynchronous work a current scene/match identity and an explicit cancellation path where needed. Define required assets, intentional fallbacks, and recoverable errors so loading neither exits early nor hangs forever.

### Completion evidence

Transition ownership table; findings with source locations; complete changed files; targeted lifecycle checks and test results. Runtime gate: repeated match/HQ cycles leave no old minimap, labels, effects, or input owner; cold and warm loads reveal the correct scene or a clear recoverable failure. Memory/resource counts must plateau after warm-up rather than grow each cycle.

## Phase 2 — performance without changing the art style

### Review

Measure representative HQ, simple and dense maps, idle battles, many visible units/nameplates, terrain changes, and heavy spell bursts. Compare identical settings, camera, resolution, and workload.

Record hardware/browser, resolution and pixel ratio, quality settings, cold/warm cache, median and p95/p99 frame time, spikes, long tasks, draw calls, triangles, textures, and resource growth. Separate CPU, GPU, DOM/layout/paint, asset loading, and AI decision stalls. Software rendering can diagnose correctness but is not a player GPU benchmark.

Investigate voxel rebuild granularity, hidden faces, batching/instancing, material proliferation, shadows, transparency/overdraw, animation updates, postprocessing, allocations, repeated raycasts, and DOM nameplate updates. Inspect CSS filters, blur, large shadows, overlays, and layout reads/writes only where measurements implicate them.

### Improvement batch

Optimize the measured bottlenecks first: reuse resources, avoid unchanged work, limit rebuild scope, and stop inactive systems. Preserve silhouettes, palette, materials, lighting intent, spell readability, and scenery identity. Any optional quality tradeoff must be visible as a setting and assessed separately from same-quality optimization.

### Completion evidence

Before/after measurements and matched images on the same setup, plus a list of costs and gains. Set the target after baseline capture; 60 FPS implies about 16.7 ms per frame, but no FPS improvement is promised without measurement. Reject gains that merely shift stalls to loading, AI turns, or later matches.

## Phase 3 — one familiar pause menu

### Review and design

Use one shared shell in HQ and battle with consistent typography, spacing, focus behavior, navigation, and settings persistence. Proposed primary actions: Resume, Settings, Controls, contextual Match Information, Return to HQ when relevant, and Quit to Main Menu. Preserve useful existing audio/video/status controls without making all of them compete on the first screen.

Define pause semantics explicitly: offline simulation, AI, action clocks, animation, audio, and HQ movement; online matches may continue while a local menu is open unless an actual shared pause protocol exists. Label that accurately.

Escape should first dismiss the current nested interaction, then open/close the same pause shell. Handle mouse, keyboard, controller, pointer lock, focus restoration, resizing, and menu entry during a cinematic. Confirm before forfeiting a match or discarding unsaved work.

### Completion evidence

A context/action table and implemented shared menu in existing files. HQ must not show a stale scoreboard or battle timer. Repeated open/close, nested settings, cinematic interruption, and leaving a scene must restore the correct input and clock state.

## Phase 4 — cinematic action camera

### Review

Inventory shot families and selection rules in battle.js, three-camera.js, and renderer helpers. Evaluate caster, target, travel path, impact area, tall/short models, wide models, flight, slopes, nearby walls, multi-target spells, and viewport aspect ratios.

Score each shot for subject visibility, full required body bounds, action visibility, occlusion, screen-edge margin, continuity, duration, and return to tactical control. Check what the guest can legally see through fog.

### Improvement batch

Frame measured animated bounds and the required effect/target region. Include both feet and head where the action requires the full body; diagnose the reported lower-body crop from projection rather than assuming the camera simply needs lowering.

Choose fewer, motivated cuts: establish the action, show release/travel when meaningful, hold through impact and readable damage feedback, then return. Prevent shot transitions during critical release/impact beats. Use a dependable wider fallback when a candidate shot is obstructed or cannot fit the subjects. Preserve existing successful shots.

### Completion evidence

Representative before/after captures and a shot acceptance checklist. The player can identify who acted, whom they hit, what happened, and where control returns. No tested tall-unit crop, missed critical impact, or fog leak. Include a reduced-motion/cinematic intensity preference if compatible with existing settings.

## Phase 5 — spell VFX and animation timing

### Review

Build a representative spell matrix covering projectile, beam, melee, dash/tackle, area damage, heal, buff/debuff, summon, terrain change, multi-hit, and major cinematic abilities. Audit new spell kinds as well as older shared families.

Trace animation start → strikeAt/release → projectile travel → impact → damage/status feedback → recovery. Check clip trimming, timescale, battle speed, fallback animations, interruption, death, and guest relays. Reuse the authoritative UAL_SLOTS timing contract.

### Improvement batch

Give spell families distinct silhouettes, motion, rhythm, impact shapes, and aftermath; avoid relying on color alone. Define caster tell, travel, impact, lingering effect, and sound per family. Reserve heavier treatment for meaningful abilities. Make persistent hazards and target footprints tactically readable.

Synchronize presentation with authoritative outcomes. Do not change gameplay resolution timing casually to accommodate a visual; inspect turn progression and network consequences first. Pool recurring effects and apply the Phase 2 budget.

### Completion evidence

Spell identity/timing matrix, code changes, and representative captures at supported speeds. Effects communicate the correct target and result, and sustained use remains within the agreed performance budget.

## Phase 6 — Arena and Team Deathmatch AI

### Review

Audit legal information, scoring, target selection, movement, action execution, resource use, and termination. Trace all current spell/status/passive kinds and two-click abilities through both scoring and execution.

Arena: use current win rules, secure the winning Key threshold, protect carriers, deny an imminent enemy win, recover dropped Keys, and weigh other enabled win conditions. Do not assume killing is always best.

TDM: prioritize kill/score rules, safe focus fire, survival, healing, threat ranges, overkill avoidance, respawn timing, and efficient movement. Avoid irrelevant Arena goals.

Both: check unreachable destinations, repeated indecision, wasted AP, friendly fire, blocked movement, summons, possession, fog, and stale cached evaluations. Difficulty should remain understandable and not rely on hidden information.

### Improvement batch

Correct rule/legality errors before tuning weights. Add concise decision explanations and a bounded computation budget where useful. Improve team coordination and move-plus-action evaluation based on specific failed decisions.

### Completion evidence

A scenario suite with expected decisions, legal-action checks, decision-time measurements, and P1-versus-CPU observations when authorized. Do not judge intelligence by win rate alone or substitute auto-simulation for player experience.

## Phase 7 — maps and asset brief

### Review

Audit battle boards, near settings, distant scenery, and their HQ site versions together. Evaluate human scale, terrain transitions, structural plausibility, prop placement, lighting direction, material consistency, repetition, collision, and tactical readability.

Start with representative interior, urban, natural, and liquid-heavy environments before expanding across all launch maps. Preserve the stylized voxel language while improving how surfaces meet and objects belong in the space.

### Candidate asset needs — provisional, not a purchase list

- Modular wall, floor, doorway, corner, stair, railing, and trim pieces with consistent scale.
- Cohesive tileable concrete, metal, plaster, brick, stone, soil, and surface-transition textures suited to the existing palette.
- Small decals for wear, dampness, seams, cracks, and site-specific markings.
- A limited set of reusable environment props: lights, pipes, vents, crates, furniture, vegetation, rocks, and edge details, selected per map.
- Matching normal/roughness maps where the current material pipeline supports them and they visibly help.

Inventory existing assets before requesting more. For each actual recommendation, specify the map/use, visual reference, dimensions, pivot/collision needs, material slots, texture channels/resolution, reuse potential, performance budget, and priority. Verify licensing and current availability if recommending a specific external pack. Do not request blanket high-resolution textures.

### Completion evidence

A ranked map audit, one representative improved environment before broad rollout, and a precise asset brief separating reusable essentials from optional detail. Verify sightlines, navigation, camera framing, and performance after dressing changes.

## Phase 8 — complete player and developer experience

### Player review

Follow a first session and a returning-player session: understand the mode, build a party, enter HQ/site, launch, read the opening, take turns, understand spells/objectives, pause, finish, and start again.

Review discoverability, action feedback, invalid-action explanations, loading/error recovery, input consistency, text size/contrast, color dependence, audio controls, pacing, and reduced motion. Check whether visuals obscure legal moves, targets, damage, or the reason for victory/defeat.

### Developer review

Audit scene/state ownership, global dependencies, duplicated rules/settings, asynchronous cancellation, shared asset lifetime, cache versions, host/guest relays, diagnostics, and test blind spots. Prefer bounded changes over a wholesale engine rewrite. Identify which recurring defects need a shared helper or stronger contract within the fixed file structure.

### Completion evidence

A prioritized final backlog with severity, evidence, effort, dependencies, and acceptance criteria; an integrated regression checklist; measured outcomes; remaining limitations; and an honest record of which files were delivered versus verified live.

## Phase update protocol

After each phase:

1. Update its checkbox/status: not started, in progress, reviewed, implemented, validated, or blocked on specific evidence. A checked phase must state what was actually completed.
2. Add findings with ID, severity, source/reproduction evidence, impact, proposed fix, and validation status.
3. Record changed files, tests actually run, runtime checks still pending, and upload destination.
4. Record before/after measurements or captures where relevant.
5. Carry unresolved findings forward by ID, including regressions discovered in earlier work.
6. Reorder remaining work if evidence changes priorities and explain why.
7. End the phase log with the exact next task so the review can resume without rediscovery.

### Phase log

| Date | Phase | Completed work | Validation | Next task |
| --- | --- | --- | --- | --- |
| 2026-09-09 | 0 | Established all eight review areas, dependencies, acceptance criteria, and initial source findings. | Documentation content review; selected source inspection only. No code changes or gameplay tests. | Phase 1: obtain three-renderer.js and battle.js; trace startMatch/loading completion, minimap and nameplate ownership, result/HQ exit paths, and stale asynchronous callbacks. |

## Resume instructions

Use this file as the review tracker. Continue with the first unfinished phase and refresh the relevant repository files before editing. Preserve finding IDs and evidence distinctions. Do not mark reported bugs fixed based on a plausible source change alone.

