# Upload manifest — AI navigation fixes

Complete files, based on repository main fef179a6fde229d4f115512fcf13131879d688b6. Earlier uploaded input fixes are preserved. No deployment has been performed.

1. Upload ai.js to the R2 root, replacing the existing ai.js.
2. Replace index.html in the repository/Render source and redeploy Render after the script upload. Shared token: 20260910-062900-ai-navigation-cors.
3. Sync ai.js to the repository too. Keep ai-navigation.test.js, AI_REDESIGN.md and ENTROPY_WARS_ADVERSARIAL_REVIEW_PLAN.md at the repository root only.
4. VALIDATION.txt and this manifest are delivery records; do not upload them to R2.

Fixes: actual board center, fresh routes after terrain/ability changes, edge-wall detection, legal prospective beam rays with full diagonal range and landing-height LOS. No new runtime modules or asset replacements.

Validation: Node v24.19.0 ran the package test command (node --test *.test.js): 247 passed, zero failed, 2 existing skips (absent rigged-animation GLBs; server smoke dependencies unavailable). Fifteen new regression checks pass; fourteen fail against the original AI. Syntax: 69/69 clean. No browser playtest, simulation, performance capture or deployment.

Remaining limits: A* performance is unmeasured after removing the round cache; wide-beam side-lane valuation and breach prediction remain separate work. Nested-dialog focus and reconnect recovery remain open in the tracker.

## SHA-256 of complete delivered files

- ai.js: 208576ac8d5fe9e5a09230592724c4362bca88c71e32c27a0ebbe267ef994474
- index.html: 0766e3bd4cfa07422059bd5571671a1fd6deb6394e5e9a105a1b8277ab61b027
- ai-navigation.test.js: 99c78fe04c2be138f80ada8bb24345355f1769c3a3049e5e48cfe6ee8f43f94a
- AI_REDESIGN.md: 1b7c9024f7880915b6632a380cf13f6a058dc62e1ee94c6335e73385dccf4841
- ENTROPY_WARS_ADVERSARIAL_REVIEW_PLAN.md: b878605d230c3ab1cb252eb782412a8a967771af77b34d20370defe4b74967f6
