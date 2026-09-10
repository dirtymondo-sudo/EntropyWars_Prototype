# Entropy Wars — adversarial review and first fixes

Prepared 2026-09-09 (America/Chicago). Local delivery only; nothing uploaded.
Base main commit: `4c740fcf6624a30d59e30c4d4dfea1a16dd85b03`.

The ZIP contains COMPLETE files with their original repository-root names.
Apply all runtime files as one batch. If main has newer runtime edits, reconcile
them before replacing files. The review plan records the remaining work.

| Destination | Complete files |
| --- | --- |
| Cloudflare R2 | `map.js`, `three-renderer.js`, `state.js`, `ui.js` |
| Render | `index.html` |
| Repository only | `scene-lifecycle.test.js`, `ENTROPY_WARS_ADVERSARIAL_REVIEW_PLAN.md`, `DOOR_MASTER.md`, `DOOR_HQ_BUILD_PLAN.md`, this manifest |

Also sync the five runtime files to the repository. Upload the four R2 scripts
before serving the matching Render entry page. Shared cache token:
`20260910-033727-review-cors`. No asset file or embedded asset URL changed.

Implemented: battle-unit label cleanup at deactivation; entry-owned HQ loading
card callbacks with cancellation/failure recovery; keyboard Tab isolation under
pause/dialog; controller settings priority over the title/HQ flag.

Validation: the exact package test script (`node --test *.test.js`) ran with
Node v24.19.0 because npm was unavailable. 208 total: 206 passed, zero failures,
two skips (animation GLBs absent; server dependencies absent). Includes eight
new focused behavior checks and the existing repository-wide syntax test.
No browser playtest, simulation, FPS measurement, deployment, or live host/guest
verification was performed. The source-review findings are not all fixed.

Next acceptance checks when playtesting is requested: rapid HQ room replacement
and exit while loading; battle → HQ → next battle labels for both viewers;
Tab in spell/attack mode beneath pause/dialog; controller settings from HQ and
main menu. Full modal focus ownership, actual texture readiness, and the broader
camera/AI/performance work remain in the plan.

## SHA-256 of delivered files

| File | SHA-256 |
| --- | --- |
| `map.js` | `742c956283f49036b5435efa515bf3876258ba7730d1c98a9d171b3b23015ccf` |
| `three-renderer.js` | `61cccf90991298a652baf78aedff7bba98c2aaf45190b1f95d97d955864ff44e` |
| `state.js` | `885142358d96e0738538845b249117668fd4bed913a374748bd83e0d580668ce` |
| `ui.js` | `53d34c66f6b69d15d2b7d9061ee4ddec12b34362a3fa20d2eb86b6a74fff54e8` |
| `index.html` | `771f705d567ebc6a7c50c69ab7bce73e7803ef2f6e399eccb5f81146bc2ba9eb` |
| `scene-lifecycle.test.js` | `e5211fae9f02762b436fbdd8ff43e085b88dcd09545102fbfd3fd6f9585fddf5` |
| `DOOR_MASTER.md` | `2a495f9792f0ce0d7436bfe418a67dd4a367c6f559fa8e424bc802d0f061e385` |
| `DOOR_HQ_BUILD_PLAN.md` | `a8d99b31899048f343666d0a330a66edd31b9225012870d527e07bb36031da43` |
| `ENTROPY_WARS_ADVERSARIAL_REVIEW_PLAN.md` | `f671b4f188a9396849e1d5106a4c25df2add665cff790ba024f5c9c00871126f` |
