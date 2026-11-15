---
name: climb-multi-turn-20261025
description: PR #525 (2026-10-25) no wall too tall to climb (a stretch per turn), Fissure lava flat on the bed; flagged calls
metadata:
  type: project
  modified: 2026-10-25T12:57:06.914Z
---
PR #525 merged 2026-10-25, zip r2-sync/ENTROPY_WARS_SYNC_20261025-1256.zip.
- Climb has no height cap. One stretch = jump + 2 per turn. A taller face takes a turn per stretch. A turn that starts mid-wall is spent climbing automatically (unit._climb.h tracks the height). Knock-off falls from h.
- Fissure: the gap's lava (and any dry sheet) no longer drapes up the walls; walls use hqFieldBedFor side (Mount Shasta = cliff rock).
- Flagged to mondo: the mid-wall turn is automatic with no other action; enemies can knock the climber off each stretch.
- Seen, not fixed: a Fissure on the board's edge row barely shows from the default camera.
- Proof stills: /mnt/project-files/climb-fissure/. Related: [[climb-mechanic]] [[crater-floor-fissure-gap]]
