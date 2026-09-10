# Upload manifest — PAUSE-08 input fixes

This package contains COMPLETE updated files, based on repository main `9dfcea9570fa49afe64e3d29d23f0ad87ccfcb7c`. It preserves the earlier review fixes. No upload or deployment has been performed.

| Destination | Files |
| --- | --- |
| R2 — upload together | battle.js, three-renderer.js, ui.js |
| Render | index.html |
| Repository only | shooter-input.test.js, scene-lifecycle.test.js, ENTROPY_WARS_ADVERSARIAL_REVIEW_PLAN.md |
| Reference only | UPLOAD_MANIFEST.md, VALIDATION.txt |

Sync the runtime files and index.html to the repository too. Preserve the filenames and repository-root paths shown above. Deploy the R2 scripts before the Render entry page so its new token points to the matching set.

Cache token: `20260910-060125-shooter-input-cors`. No asset upload or extra embedded-asset refresh is needed.

Fixes: menu keyboard/mouse input isolation; stale walk/sprint/jump/fire/ADS/scoreboard/trigger cleanup; owned mouse-lock release and late-grant rejection; controller pause precedence; walker listener cleanup. Camera ownership and movement commit rules remain independent.

Validation: 234 total, 232 passed, 0 failed, 2 expected skips (animation GLBs and server dependencies absent). Full package test command and JavaScript syntax checks passed. Browser/device/online acceptance has not been run. See VALIDATION.txt for the full test output.

## SHA-256

- `ENTROPY_WARS_ADVERSARIAL_REVIEW_PLAN.md`: `b5cd72858a3ae707f6934de1cd1c8857d86c7551a3a257d90cffff445f3b2290`
- `VALIDATION.txt`: `d1b1d720640802cd0e89b0ea5b1a118c26d73c9172ad1b498cffbd478ebaa2bf`
- `battle.js`: `8432c93d5aa990c1ebe3bc63afda3ceaf03f8557f5bc56dc38ea8d9e97a57df6`
- `index.html`: `cf29bffb45c97fed57ab538e6b3a143f08eb8f0a579b336a0b081600fba07890`
- `scene-lifecycle.test.js`: `a405bb2b59eaad1c41c69d01d611feb944bdf2c482af6c1b51704131fe3dfb18`
- `shooter-input.test.js`: `2b73a5172fdf3f7363ad8dea42b4f7d2e740e445ef05dbd83c951b5c3e067e6a`
- `three-renderer.js`: `348a68976964b297d51b740059729dcf1e04a0bf95654552b708ff8ab1639834`
- `ui.js`: `5d9f8d3df1f315836d3ec50d9e1085713fd2aa4bcee47db91537a198943c3d44`
