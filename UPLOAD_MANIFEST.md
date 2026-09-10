# Dialog focus fixes — 2026-09-10

Complete files, ready for manual upload. Nothing has been deployed.

| File | Destination |
| --- | --- |
| ui.js | R2 bucket root; also sync repository |
| index.html | Render entry page; also sync repository |
| dialog-focus.test.js | Repository root only |
| ENTROPY_WARS_ADVERSARIAL_REVIEW_PLAN.md | Repository root only |
| TEST_RESULTS.txt, SYNTAX_RESULTS.txt, SHA256SUMS.txt, this manifest | Repository/reference only |

Upload ui.js to R2, then redeploy index.html on Render. Shared cache token: 20260910-133100-dialog-focus-cors. No asset files changed.

Includes focus trapping, redraw retention, Escape cancellation and launcher restoration for state.uiDialog. Completes the unfinished local implementation and fixes Settings redraw restoration plus aria-hidden navigation. Separate banner/save-load modals remain open review work.

Validation: full local package test command, 257 tests / 255 passed / 0 failed / 2 skipped. Skips: missing rigged animation GLBs and unavailable server dependencies. Syntax: 70/70. Eight dialog checks pass; two added defect checks fail against the previous unfinished implementation. No browser, controller, live online or deployment verification.

Current main ui.js was checked and matches outside the dialog addition. Entry based on current main with only the token replaced. Main map.js has an unrelated appearance-field addition absent from the local test workspace; its Settings helpers match and map.js is not included.

Manual acceptance still needed: open a game dialog, Tab and Shift+Tab across its controls, cancel once with Escape, confirm with Enter, redraw while focused, and check return to pause/Settings. Repeat as guest. Required job selection must stay open on Escape.
