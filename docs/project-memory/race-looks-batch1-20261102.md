---
name: race-looks-batch1-20261102
description: Race looks batch 1 (11-02, PR #805): 19 creator looks over 17 races baked into RACE_CREATOR_LOOKS; skipped races + why; how the looks were checked
metadata:
  type: project
  modified: 2026-11-02T12:09:59.735Z
---

mondo 11-02: "make new character models for a batch of about 15, using the character creator. Do the ones where you know all the necessary parts of the outfit and sliders will allow you to make it look good and accurate to the original model."

PR #805 (zip ENTROPY_WARS_SYNC_20261102-1209) baked 19 looks with bake-looks.js:
- men in black, politician, professor, priest M, mad scientist M+F, conspiracy theorist, chef, gangster (MPFB heavy), telepath M+F, vampire F, halfdemon M+F, superhero M+F, ringmaster, santa clause (MPFB heavy), cult leader.
- The export lives at /mnt/project-files/race-looks-batch1/Entropy_Wars_Race_Looks_batch1.json, with side-by-sides and 5-idle clipping sheets in the same folder.

Skipped:
- popstar: no white top or heels.
- luchador: the prints don't match.
- nun: needs the Meshy cross pendant.
- wizard M+F: no hooded robe.
- demon princess: corset + slit gown.
- creatures: plan row 18.

Lessons:
- A long coat or robe gets idle Idle_11; wide stances split the coat.
- An open-coat look: a Blender shirt over the pack male trousers leaves a belly skin gap in Idle_11. Use pack classic jeans tinted dark + ewb_belt instead.
- ewb_top_shortshirt flares out below a blazer.
- A closed blazer shows a tie line at its edge.
- Hair under the pack chef hat leaves nape patches, so use bald.
- A white ewb_tie on a white shirt breaks up.
- The harness sometimes renders a look bald; a re-render fixes it, so it is not a look bug.

**Why:** the next race-look batch should start from these choices and not repeat the failed ones.
**How to apply:** follow docs/notes/character-creator.md "THE RACE LOOKS, BATCH 1" and plan row 20. Related: [[race-looks-cowboy-20261101]] [[character-models-plan-doc]] [[clothes-holes-20261102]]
