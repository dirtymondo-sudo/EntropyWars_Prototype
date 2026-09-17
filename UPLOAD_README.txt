DISASTER CITY REPAIR — 2026-09-17
Complete replacement files based on GitHub main c65341886eb7a4bd5f895d9d8618dfa6d393d57f.

R2: data.js, three-renderer.js (replace the existing root scripts).
Render: data.js and index.html (redeploy together with the R2 scripts).
Repository only: the four included *.test.js files, CLAUDE.md, DOOR_MASTER.md,
DOOR_HQ_BUILD_PLAN.md and these delivery notes.

Cache token: 20260917-city-repair-03-cors. No model upload is required.
These files are not yet uploaded, deployed or browser-playtested.

Changes: near-flat road tiles, correctly oriented/recessed mall storefronts,
fitted escalator replacing visible terrain ramp, building fronts directly behind
outdoor area doors, eight slower Disaster City vehicles, pedestrian yielding,
correct lead-vehicle spacing and protection against consecutive impacts.

Validation: 1,578 passed, 6 skipped, 0 failed (1,584 total).
42 focused checks passed, including terrain access and return checks.
