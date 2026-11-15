---
name: pz-signature-vfx
description: P-Z race signature spells (pz*, 53 + Heat Vision) got their own VFX in PR #446 (merged 2026-10-23); hook, calls made, screenshot method
metadata:
  type: project
  modified: 2026-10-23T12:49:07.486Z
---

PR #446 (merged 2026-10-23) gave every `pz*` signature spell from [[race-signature-families]] its own look, plus Heat Vision (`raceLaserBeam`, the superhero's now). Visuals only, no rule changes. Sibling threads A-F (`_af*`) and G-O did the other letters in the same file (three-vfx-effects.js); keep both sides when merging.

- Hook: an EFFECTS def with `pzSig` runs `_PZ_SIGS[name]` from fire(); `pzOwn` = it replaces the stock look. Pulls with `pzOwnTether` skip battle.js's rope (`ownsPullTether`); pull params carry `uid` (relayed in online.js).
- Fog: `_pzSeen` — caster-side props only when the viewer sees the caster's tile.
- Calls the thread made (flagged to mondo): the Hat Man stands behind the victim on the camera's side; the Wanted poster hangs beside the outlaw facing the camera.
- Screenshots: /mnt/project-files/pz-vfx/ (before/after, WebGL all, WebGPU 12). Swiftshader runs ~1 fps, so shots use Playwright `page.clock` fastForward. Headless Chromium 141 WebGPU needs a harness-only shim that drops `swizzle` from `GPUTexture.createView` descriptors (three r186), else every frame throws.
- Sync zip: never include ASSET_MANIFEST.json (repo copy is a 69-byte stub; live is the real manifest).

**Why:** future VFX work on these spells starts from this hook. **How to apply:** add new pz looks as `_PZ_SIGS` entries; notes in docs/notes/spells-vfx.md "THE P-Z SIGNATURE VFX".
