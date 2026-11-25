---
name: plastic-surgeon-kit-20261123
description: 11-23 Plastic Surgeon kit BUILT + live (PR #2466): Work Done -> Botched rule, either-side procedures, Makeover swap, Before & After finisher
metadata:
  type: project
  modified: 2026-11-23T11:50:42.067Z
---
Thread (owner-project id). Plan https://claude.ai/artifact/RyqA78f4Kb66y23z2Rcqzo; mondo OK'd it ("okay yeah that's good"); built and merged PR #2466, uploaded to R2 11-23 (token 20261123-surgeon-02-cors).
Kit: specialist, home Disaster Hills, poison resist / fire weak, held scalpel (fit 'max': the GLB lies flat, sizing by height made it board-sized).
WORK DONE: +1 per spell on any unit (max 3, -1 a round untouched); 3 = BOTCHED (Stun 1, reset). Botox / Makeover = `procedure` + `anyTeam` rows (ally cast = `onAlly`). Lipo -> Shield on lowest ally. Anesthesia 3x3 Sleep. Full Procedure +25%/stack.
Gotcha learnt: a STATUS_DEFS onRemove runs BEFORE its key is deleted, so a check "does the unit still have this status" inside onRemove is always true; pass the key in.
Notes: docs/notes/champions-combat.md "THE PLASTIC SURGEON". Proof + probe: /mnt/project-files/plastic-surgeon/.
**How to apply:** balance numbers are first pass; tuning goes to the balance thread. Open: none unless mondo comments.
