# Upload manifest — the gangster (model + unlock + his own VFX)

Complete files, based on repository main 378b1295710d3dba0f4e78eb7a22d0ce2cb82835. No deployment has been performed.

1. Upload **sprites.js**, **data.js**, **battle.js** and **three-vfx-effects.js** to the R2 root, replacing the existing files.
2. Replace **index.html** and **server.js** in the repository/Render source and redeploy Render after the script upload. Shared token: `20260910-gangster-091500-cors` (was `20260910-creator2-084120-cors`).
3. Sync all of the above to the repository too. Keep champ-rework.test.js, CHAMP_REWORK_PLAN.md and CLAUDE.md at the repository root only.
4. VALIDATION.txt and this manifest are delivery records; do not upload them to R2.

Already on R2 (uploaded by the owner, HEAD-verified 200 from cdn.entropywars.net before wiring):
`Assets/Sprites/Races/gangster/Meshy_AI_thug_gangster_reali_biped_Character_output.glb` (5.62 MB — parsed: 1 skin, 24 joints, standard Meshy rig naming, so the shared libraries retarget onto it) and `Assets/Sprites/Races/gangster/gangster_male.png`.

Changes: the gangster renders as his rigged 3D model and is unlocked (a starter on both sides — `isRace3DReady` was the only gate); his 2D art is his own file instead of the borrowed Gunslinger sheet; his five spells got an authored VFX kit in place of the borrowed gunslinger/robot recipes; Choppa's `projectileOverride` was removed so its line takes the tracer-beam path (which is also the online-relayed one); Drive-By's after-shot now plays the ranged clip, a muzzle flash at the caster, the gunshot and an impact recipe. No new runtime modules; no asset replacements.

Validation: Node v22.22.2 ran the package test command (`node --test *.test.js`): 255 passed, zero failed, 2 existing skips (absent rigged-animation GLBs; server smoke dependencies unavailable). `npm run test:parity` green. Syntax: every repo JS clean. The model URL, the sprite URL, the resolved animation slots and `classifySpellAnimKind` for all five spells were checked by loading sprites.js headlessly. No browser playtest, simulation, performance capture or deployment (RULE #1c).

Remaining limits: no `portrait.png` in his R2 folder, so HUD panels fall back to his sprite (same as the nun); `DOOR_ROSTER_LINES.gangster` is unwritten and is user-authored by rule (DOOR_MASTER A15), so the HQ falls back to the room's lines for him. The VFX kit was tuned by reading the effect library, not by looking at it in a running match.

## SHA-256 of complete delivered files

- sprites.js: 7a396c42cdf4df55563b9eea6738d2cd67c222ec207621439d4b6e1f15d1fd73
- data.js: 57bd1cb88f1b8424b5ac37d0f691e7e5ff1937abc00179665024dd0b8a030627
- battle.js: 5b6cf5c510cad772a8cc1e0ceb9f79fa82136e354a4a102d85d6748eed01644a
- three-vfx-effects.js: b59bb22368becbd73a44472170ce410650376920339774c622abe757a5cf27d8
- index.html: 045251cb08d1d70d8d999a4bb3cdb30a1f91d8621b83baec4548a9e97bf7c14e
- server.js: 6dac5c34b9882977eaac2bf138593b3df2881572c736ebf2314704f3d159a4d7
- champ-rework.test.js: 8b9ae44e7407af0c2706ed82afa561267e8559f647c85e5594ea8b7f698e6341
- CHAMP_REWORK_PLAN.md: c8e8285b0fcd9d737f96ec02aa5d646edae404a93cd87e46579edff81424ebe7
- CLAUDE.md: f38b750cd8a6561c2b5d0ab6df385f8e894eb0de393ef0a135a694a4592398f7
