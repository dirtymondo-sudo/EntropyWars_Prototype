# Electric and combo callback fixes

Upload these COMPLETE replacement files:

- **R2:** three-vfx-effects.js
- **Render repository:** index.html (redeploy to serve the new shared cache token)
- **Repository only:** electric-combo-lifetime.test.js, EFFECT_CALLBACK_INVENTORY.md, ENTROPY_WARS_ADVERSARIAL_REVIEW_PLAN.md
- Validation logs and hash manifests are delivery evidence, not runtime uploads.

Preserves the previous bespoke, DOM and effect-lifetime changes. Cancels old electric cue/impact bursts and combo heads, trails and explosions when the effects layer retires, including queued callbacks and already-started nested trails. Normal spell timing and emissions are retained.

Validation: 10 new tests pass; 7 fail before the fix. Full suite: 386 pass, 2 previously recorded failures (starter data and lunar-lander ceiling), 2 skips. 79 JavaScript files syntax-clean. npm was unavailable; the package's exact Node test command ran with the bundled runtime. No browser playtest or deployment performed. This is a mixed local review workspace, not full-main CI.

Cache token: 20260910-electric-combo-retirement-01-cors.

Next review: _fireDescent callback ownership, remaining bespoke callbacks, then VFX-04 visibility. These fixes do not close the whole lifecycle review.
