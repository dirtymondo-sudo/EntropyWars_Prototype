---
name: weapon-in-spell-20261122
description: 11-22 weapon holders cast spells with the held weapon (PR #2436, pass 1): what is built, the shared helpers, what is still open
metadata:
  type: project
  modified: 2026-11-22T18:52:03.731Z
---
Thread (owner-project id) ("Use held weapons in unit spells"). Basic attacks are a sister (thread in the owner project). Follows [[weapons-in-hands-20261122]]. Full notes: repo docs/notes/spells-vfx.md "THE WEAPON IN THE SPELL".

mondo 11-22 (his words): "Just go ahead and start the threads to incorporate them holding and using their weapons in their spells. They should also use them for their basic attacks".

Pass 1, PR #2436 merged + uploaded (token 20261122-weaponspell-01-cors):
- sprites.js: EW_WEAPONS (grips per weapon), EW_SPELL_WEAPON (spell id -> weapon, so Time Cop switches revolver / rifle / pistol / ray gun / taser / baton / spray / deneuralizer / katana by spell), EW_WEAPON_STYLE (race -> blade, gun, baton, star, bow, staff, mic, sickle), EW_WEAPON_KIND + weaponSpellAnimKind (a blade holder never plays the empty-hand cast: slash, heavy slash, guard, rally).
- battle.js triggerCastAnim: state._castAnimSpell[unit.id] = spell id (syncs to the guest).
- three-renderer.js: ThreeRenderer.unitHeldInfo(uid), unitHeldUse(uid, key, ms) (temporary weapon swap), _heldShooterTip: projectiles of a gun or staff holder start at the weapon's tip (casts AND attacks). A creator-body holder keeps its body when a spell sets _spriteOverride.
- three-vfx-effects.js _sigGunRig3D uses the real held gun instead of a conjured one.
- Only shows on MPFB looks (localStorage ew_remade_looks=1, Settings > Developer > Remade Race Looks); Meshy defaults keep their look and only get the new animation choice. Kill switches: window.EW_NO_WEAPON_SWITCH, EW_NO_HELD_WEAPON_FX.
- Probe: /mnt/project-files/weapon-spells/scripts/cast.js (RACE, GENDER, SPELLS, FRAMES, OUT env).

Pass 2, PR #2452 merged + uploaded (token 20261122-weaponspell-02-cors; mondo: "do the next pass"):
- Robin Hood (look with `ownBow`) gets no spectral longbow: the arrow is nocked at his bow hand and flies from there (three-vfx-effects.js _wpnOwnBowAt / _sigBowShot3D); his Headshot / Precision / Kneecap shots are loosed the same way, no conjured rifle.
- Ninja: each shuriken starts at the hand, the held star hides while it flies; throwing something else puts the star away for the throw.
- TRIED ON FILM AND DROPPED: MAL5 Side_Shot as a two-hand rifle clip (it fires to the body's SIDE, ~90 degrees off); `rally` (Sword_Shout) for the wizard's sky spells (the staff ends pointing 40 degrees down).
- Seen in a battle: Robin Hood Fire Arrow, Ninja Shuriken + Knife Throw. NOT seen: Headshot path, guest screen. Proof: weapon-spells/shots/proof_weapon_in_spell_pass2.jpg.

Pass 3, PR #2458 live (mondo: "robin's hood bow and arrow looks messed up. wasnt there already several meshy animations for shooting a bow?"): castArrow played only Archery_Shot_1 (takes the arrow, no draw) and the Meshy bow set aims along the body's LEFT. New slot options in UAL_SLOTS: `then` (join clips) + `turn` (degrees); castArrow = Shot_1 then Shot_3 turned -92. Worn bow: real arrow in the string hand (three-vfx-effects.js bowNock). Keep a cast's strike under ~700 ms. Clip close-ups: weapon-spells/scripts/bow.js (SCAN = bone readout). Not done: bent string.

PROBE (cast.js, ~10 min, run in background): clock install BEFORE page.goto; film with DSF=2 ZOOM=2.6 CLIP=0,0,1280,720 and crop; NOHELD=1 for a unit with no held weapon; merge main first (STALE after 60 min).

Open for the next passes: a REAL two-hand long-gun clip (Meshy pull, or a `turn` on the slot bake); staff cast animations; gun spells with their own VFX outside _sigGunRig3D (Fan the Hammer, Slap Leather, Crossfire, Six-Shooter, Taser arc, spray cloud); second holds (Gladiator net + shield, Knight shield, Shogun fan arm); popstar mic clip.
