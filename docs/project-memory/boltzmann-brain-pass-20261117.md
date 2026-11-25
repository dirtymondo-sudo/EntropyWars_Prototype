---
name: boltzmann-brain-pass-20261117
description: Boltzmann Brain (shown as FLOATING BRAIN since PR #1922, id unchanged) race polish 11-17 (PR #1921): Observer Effect, safe/fog-safe fluctuation, own VFX; probe recipe; VFX var-name collision gotcha
metadata:
  type: project
  modified: 2026-11-17T08:37:09.649Z
---
Thread (owner-project id) (mondo 11-17: per new race, flesh out spells + VFX, test new mechanics). Shipped PR #1921, token 20261117-brain-02-cors, live on R2.
- New spell Observer Effect (`observe: true`, status `observed`): no fluctuation at THIS round end (status cleared there; a 1-round status otherwise lasts 2 round ends). Skips the one-spell cap. CPU scores it 400+ on a safe perch. No OK from mondo on the new rule yet.
- Fluctuation picks safe squares; log `actor` + fog; look = fireGeometry 'nrFluctuation:out/in/hold'. Excludes Phase Walk + Dimensional Fold. Existential Dread cd 3.
- GOTCHA: three-vfx-effects.js is ONE function scope; a `var _BB` already existed (bligblog block). New blocks must grep their var names first (used `_BBR`).
- Probes: /mnt/project-files/boltzmann-brain-polish/probe (common.js boot + p3_show.js frozen-clock looks + CPU rules run). Proof boltzmann_brain_proof.jpg.
- mondo OK'd the whole pass 11-17 and renamed it: display name Floating Brain (PR #1922); id stays 'boltzmann brain'.
