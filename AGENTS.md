# Entropy Wars — Codex project instructions

Repository: https://github.com/dirtymondo-sudo/EntropyWars_Prototype

## Start here each task

This is an established game developed with Claude Code. Continue from the existing code and decisions; do not make the user explain the project again.

1. Read this file and the current `CLAUDE.md`. That file remains the detailed shared technical history, including recent changes and subsystem rules. Read relevant sections fully before editing their subsystem.
2. Read the actual files involved and the relevant design plan/build log. Fetch current files from GitHub when no checkout exists; use `main` unless the user identifies another branch or supplies newer files. Do not assume a previously delivered file has been uploaded.
3. Follow the user's current instructions over older project notes. Treat old environment claims (Claude-specific 403 errors, branch names, unavailable tools) as historical, not facts about the current session.
4. Explain findings and changes in plain language. Make routine decisions independently; ask only for missing decisions that materially affect the requested work.

## What the game is

Entropy Wars is a browser tactical JRPG prototype with online PvP and VS-CPU play. It combines party building, races, jobs, spell trees, terrain, statuses, and cinematic 3D battles. The blitz turn model activates individual units; Simul has a separate simultaneous model. The D.O.O.R. setting connects the game to a headquarters, named cast, and missions through thresholds to different sites.

- The browser owns battle simulation. Online matches are host-authoritative; the guest mirrors state and relayed events.
- Node/Express and Socket.IO handle the server side. Beyond matchmaking and relay, the server contains account/economy/progression services and D1 integration; do not assume it is a stateless relay.
- `index.html` loads ordered global scripts from `cdn.entropywars.net` and external libraries. Rendering uses Three.js r128; some screens use React. Preserve existing script order and global APIs.
- Production scripts/styles/assets live in Cloudflare R2. Render serves the entry page and server. Repository edits alone do not change the live game.

## File map

| Area | Start with |
| --- | --- |
| Entry page, script loading, cache token | `index.html` |
| Races, jobs, spells, passives, statuses, terrain, HQ definitions | `data.js` |
| Match state, modes, initiative, round processing | `state.js` |
| Actions, damage, spells, cinematics | `battle.js` |
| Maps, movement helpers, menus, HQ navigation | `map.js` |
| CPU decisions, scoring, training | `ai.js` |
| Host/guest actions, state sync, event relays | `online.js` |
| Rendering, HQ scenes, animation, character preview | `three-renderer.js` |
| Models, portraits, shared animation slots | `sprites.js` |
| Camera, effects, postprocessing | `three-camera.js`, `three-vfx.js`, `three-vfx-effects.js`, `three-lightning.js`, `three-post.js` |
| Input, HUD, party building, match selection, profiles | `ui.js`, `hud.js`, `party-builder.js`, `match-select.js`, `profile.js` |
| Audio and styling | `audio.js`, existing `styles-*.css` files |
| Backend and persistence | `server.js`, `d1.js`, `migrations/` |
| Tests, data loading, deployment helper | `package.json`, `*.test.js`, `check-*.js`, `load-data.js`, `deploy.js` |

Confirm the current implementation before relying on this map; functions often span several files.

## Delivery — complete files for user upload

- Read/download the needed files, edit working copies, and return COMPLETE updated files with their original names and paths. Do not return only patches, snippets, or instructions for the user to implement.
- Do not require Git, Xcode, a clone, or a local server merely to read and edit files. Use connected GitHub tools when available. Use an available runtime for validation; state any checks that cannot be run.
- Do not commit, push, merge, or deploy by default. The user uploads files to R2/Render and syncs the repository. Change that workflow only if the user requests it.
- Work within existing game files. Do not split game logic into new modules or add new runtime files to the fixed upload set. Repo-only development tools and documentation are allowed when needed.
- When delivering ANY R2-hosted change, update the shared `?v=` token in `index.html` to a fresh unique value and deliver that complete file too. Preserve required suffixes such as `-cors`; inspect the current token rather than copying an old one from documentation.
- Embedded asset URLs may not carry that token. Inspect affected URLs and use a new asset filename or explain the additional cache-refresh step where necessary.
- State where each delivered file goes: R2, Render, or repository only. Documentation-only changes need no game cache bump.

## Validation

- For game code changes, run `npm test` (the Node built-in test runner) and syntax-check edited JavaScript. Use Node 22 or a compatible available runtime. Consult `package.json` for current commands.
- Economy constants, starter lists, and race-list changes require `npm run test:parity`. Preserve the server fallback literals and their extraction-compatible declaration shape alongside the runtime data loader.
- Use `load-data.js` to evaluate game data for validation instead of inventing a second copy of the rules. For champion balance work, consult `npm run grades` and `CHAMP_REWORK_PLAN.md`.
- Do not claim tests passed unless they ran. If only a subset of files is available, report the validation limit without requiring an unrelated machine setup just to deliver an edit.
- Do not run browser playtests, simulations, or drive the live game unless explicitly requested. When playtesting is requested, read `PLAYTEST_NOTES.md` and use the existing harness. The expected playtest is actual P1 play against the CPU, not auto-sim/dev-sim.
- Documentation-only changes need a content review, not gameplay tests.

## Rules that prevent regressions

### Online parity

Every gameplay or visual change must account for both players. New host-driven banners, VFX, camera moves, and other visible events need the corresponding guest relay handling. Carry all behavior-changing options. Guest actions must emit to the host rather than execute the authoritative action locally. Review `_serializeState`, its skip list, and `_guestUIKeys` when adding state.

Use screen-true fog/visibility helpers (`_shouldCameraFollowUnit`, `_isTileVisibleToViewer`, `computeVisibleTiles`) for enemy-related camera and UI behavior. Do not replace them with simple awareness-radius checks. Ask internally: what does player 2 see when this happens?

### Data and character systems

Extend existing data-driven hooks and accessors. For new spells/kinds/races, consult `CLAUDE.md` and `CHAMP_REWORK_PLAN.md` for every required registry, AI consumer, UI consumer, VFX mapping, and test. Twin spell nodes have alternate choices; use the existing race-tree helpers rather than flattening them incorrectly.

For models and animations, read the rigged-character and strike-frame sections in `CLAUDE.md` and `PLAYTEST_NOTES.md`. Verify the GLB is rigged. Shared `UAL_SLOTS` mappings and `strikeAt` timing are authoritative; do not scatter per-action delay fixes. Character previews must use the existing stage/preview APIs and avoid broadcasting through online-wrapped battle effects.

### D.O.O.R. canon and headquarters

Before story, cast, or HQ work, read `DOOR_MASTER.md` (especially A0/A14 and relevant decisions), `DOOR_STORY.md`, and `DOOR_HQ_BUILD_PLAN.md` as applicable. The user's authored canon outranks AI scaffolding. Do not invent dialogue, resolve open plot questions, or promote proposals to canon. Draft story text only when requested and label it as an unapproved draft.

Use the existing HQ generators and helpers for rooms, bays, site boards, and room numbers. Do not hard-code generated room identities or edit generated site rooms as if they were independent definitions. Read current plan status rather than restarting shipped phases.

For party-builder changes, read `PARTY_BUILDER_PLAN.md` and current `CLAUDE.md` forge notes. Preserve existing mechanics/function names, character-viewer lifecycle, preview isolation, and loadout legality while changing presentation.

### Persistence

Use versioned `migrations/NNN_*.sql` for schema changes. Preserve token hashing and `findPlayerByToken`, and existing authorization/rate-limit checks. Do not expose server files, internal documentation, or replay logs through blanket production static serving.

## Keep the project knowledge useful

After relevant work, update the existing subsystem build log: `DOOR_MASTER.md` Part D for DOOR work, the HQ plan's build log for HQ work, the party-builder plan for builder work, and `PLAYTEST_NOTES.md` for verified playtest findings. Include changed documentation in the full-file delivery.

Keep this file concise and focused on stable rules. Keep detailed subsystem history in existing documents. Distinguish implemented changes, test results, unuploaded deliveries, and live deployment; never call a local edit shipped without evidence.

This file belongs at the repository root beside `CLAUDE.md`. Codex reads repository `AGENTS.md` when working in that repository. A chat with only a GitHub link may need an explicit instruction to fetch this file; do not claim it creates automatic memory across unrelated chats or uploads itself into ChatGPT Project Knowledge.
