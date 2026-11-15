---
name: finisher-real-bodies-af-20261028
description: PR #653 (10-28) finishers A–F use the real unit models, terrain sheets and catalogue props; sheets, missing-models list, gotchas
metadata:
  type: project
  modified: 2026-10-28T18:54:37.339Z
---
mondo 10-28 was furious about blob/crude-copy finishers (Juggernaut's wall-run blob). The work was split across threads A–F / G–O (#650) / P–Z (#651).
A–F = PR #653, merged 10-28. Sync zip ENTROPY_WARS_SYNC_20261028-1854.

- `ThreeRenderer.unitDouble(uid, o)` clones the unit's own rigged model and plays shared-library clips. three-vfx-effects.js `_finDouble(tx, ty, ts, {slot, hide, once, unit})` and the `_fd*` helpers drive it. Textures come from `_finLit` / `_finUV`.
- The double copies the engine's `_ew_silhouette` / `_ew_shadowProxy` / `_ew_pickPillar` flags node by node and hides them. Without this, red x-ray ghosts showed through props. `cineSetUnitFade` also hides a faded unit's silhouette.
- The Weighing's Ammit = mondo's fangs (`_fangsMouth`, #652) rising from a pit under the victim's double.
- Sheets: /mnt/project-files/finisher-visuals/af/ (`<sig>__<race>.jpg`, before/after). Missing models: af/MISSING_MODELS_A-F.md.
- Calls flagged to mondo: insert band styles (Nine Lives → signal, changeling → scripture), cork board in plain tan.
- Gotchas:
  - Plain-object material proxies on doubles need `dispose: function(){}`, or `_sigDisposeGroup` throws.
  - `_finUnitAt` returns null on the forge stage (`_VS.on`).
  - The forge dummy height is in effect space (`ts * 0.95`).

Related: [[finisher-real-bodies-go-20261028]] [[finisher-visuals-pz-20261028]] [[finisher-look-pass2-pz-20261028]]
