---
name: creator-clipping-20261101
description: 11-01 PR #772: shirt no longer pokes through Blender Outer coats; long creator hair held off clothes + sway chains on the neck bone (cowgirl shoulder clip)
metadata:
  type: project
  modified: 2026-11-01T20:22:10.170Z
---
mondo 11-01: "adding an outer layer makes the lower clothes layers clip through the outer layer. and the cowgirl's hair clips through her shoulder".
Shipped PR #772, zip r2-sync/ENTROPY_WARS_SYNC_20261101-2021.zip (three-renderer.js c0093cfc), token 20261101-clip-01-cors.
- Only BLENDER outer picks clipped (coded outers already layered by orderOver). Fix: part.outerHide (the coat's own del mask) -> coded layers skipped there.
- Hair: hairClear in fitHair (4 mm over outermost worn thing below the jaw); swayHair chains + face-side strands under the jaw ride the `neck` bone (the idle's bowed head pushed hair into the chest). Shoulder capsules on HAIR_SWAY made it WORSE (pulled front strands in) - don't retry.
- Probe: scratch Playwright page, EWCharViewer.setCharacter('door agent', g, {appearance}) + EWCharViewer.snapshot({yaw, bust:false}); skeleton.pose() before snapshot = bind pose. Shots /mnt/project-files/creator-clipping/.
- Known: Cowboy's hunched idle + LONG hair still sinks a few tips into the duster front.
Notes: docs/notes/character-creator.md "THE COAT OVER THE CLOTHES + THE HAIR ON THE SHOULDERS". Related [[character-models-plan-doc]] [[race-looks-cowboy-20261101]] [[blender-clothes-row12]]
- REV 2 (PR #773, zip 20261101-2045, three-renderer.js 2583a089, token clip-02): mondo saw hair still through the coat in the after shot. ALWAYS check POSED, not bind: posed test = applyBoneTransform hair vs coat posed surface (132 -> 55 inside). hairRide: hair within 3 cm of clothes takes the garment's own weights. coatIn: coded layer within 6 mm of a Blender coat's inside hidden (belt through duster back), buckle skipped under closed coat.

- REV 3 POSES AUDIT (PR #777, zip 20261101-2232, three-renderer.js 74d8c22b, token clip-03): mondo "make sure all clothes/hairs/accessories move out the way for all poses/idles". hairUnderHats+hatRide (hair under hats/hoods/crown masks), wearLayers (underwear < shoes+gloves < rest by z; cape over all, 1.2 cm under it), wearSpan (side reach grows with garment vertex spacing: pack meshes 2-4 cm apart were skipped), skinPokes (MPFB skin within 1 cm under a garment hidden; hats 1.5 mm; lace/capes/open shoes skipped), hairSkin (nape), hairRide upperArm 0.5. Sheets creator-clipping/poses_{hats,layers,skin,capes}.jpg. Probe harness: scratch audit_run.js + audit_fn.js (posed applyBoneTransform pair test). Left: arm through front strand, small coat spots at cape shoulder edge, a few t-shirt patches when posed.
