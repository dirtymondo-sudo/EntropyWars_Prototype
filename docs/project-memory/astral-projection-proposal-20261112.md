---
name: astral-projection-proposal-20261112
description: Astral projection plan (accepted) + build 1 shipped PR #1220 (Sleeping, body+spirit shared HP, cord, Spirit Walk); code facts, gaps, next builds
metadata:
  type: project
---
mondo 2026-11-12 asked for a PLAN ONLY: unify astral projection. Body stays on the cast square, a white see-through astral body
floats and moves, immune to physical like the Ghost passive, real body takes damage as normal; psychic / telepathic / dream /
nightmare spells deal bonus damage to a projecting unit; a projecting unit can see + interact with the Shadow Realm.
Thread (thread in the owner project). Doc (Claude Doc): https://claude.ai/artifact/4Yup3jQwxJkTYjf1qh1jVx
Pointer: /mnt/project-files/astral-projection-20261112/README.md. NO GAME CODE until he OKs; then mock-up first (VFX design rule).

Facts read from code (main at PR #1214):
- NO spell is named Astral Projection. It is a FAMILY (`astralprojection`): Spirit Walk (T2, kind escape: teleport 4 + Invisible 1),
  Spirit Guide (T3: ally Invisible 1 + Levitating 2), Astral Barrier (T1 aoe shield 90). Owners: fortune teller, shaman, telepath, watcher.
- Family id `astral` is named "Dream Predation" (dreameater, succubus): Dream Siphon, Sleep Paralysis, Nightmare Pulse, Eternal Slumber.
  `nightmares` = dreameater signature (Counting Sheep, Devour the Dream). `telepathy` = telepath (Mental Static, Aneurysm). Sleep = Stun status.
- Shadow Realm (demon, T4) + Into the Sack (krampus, T4) = kind shadowRealm, a second plane (battle.js shadowRealmKey / isUnitRealmShieldedFrom /
  realmViewKey), pair drawn only on its own turns.
- Ghost passive = PASSIVE_DEFS.incorporeal (immuneDamageType physical + phasing), ghost race only.
- Psychic ELEMENT: 66 spells; 43 of 135 units have one in pool (33 a damaging one). Immune: zombie, robot, droid, honda civic, jellyfish.
- Engine has one position + one model per unit: a body/spirit split is the main build risk.

My proposals (marked in the doc, his to accept): status "Projecting" until caster's next turn ends; cord 6 squares (4 for Spirit Walk);
spirit casts magic only, no basic/physical, no Key/capture; visible pale with team-colour cord; psychic element x1.5 vs projecting;
Stun/Silence snaps spirit home; empty body counts asleep for dream spells; Spirit Walk = body pulled to spirit at end; Spirit Guide =
project an ally; spirits see + cast into Shadow Realm, Ghost + Shadow Entity see only; new: Astral Projection spell (T3), Cut the Cord
(Dream Predation T2), Silver Cord passive. Build order 4 PRs. Related [[forced-movement-rules]] [[visual-rules]].

UPDATE 11-12 15:18 (mondo): "yeah that sounds good" = plan + my picks accepted. HIS RULES: treat body and projection as 2 SEPARATE UNITS
with ONE SHARED HP BAR; body wears a SLEEPING status, projection wears PROJECTING; "make sure there is" a sleeping status.
Code fact: NO sleep status exists (68 STATUS_DEFS, only `stun`); Lullaby, Sleep Paralysis, Counting Sheep apply Stun; battle.js:632 + ai.js
check a 'sleep' id that is never applied. Asked him (pending): does damage wake a sleeper (my pick yes, except a projecting body);
Lullaby + Counting Sheep -> Sleeping, Sleep Paralysis stays Stun; dream bonuses on Sleeping OR Stunned. Next step: mock-up still, then build PR 1.
MOCK-UP POSTED 11-12 15:35: stills in /mnt/project-files/astral-projection-20261112/ (own cyan + enemy pink-orange). Made in the playtest
harness with ThreeRenderer.unitDouble(uid,{slot:'idle'}) (skinned clone, own mats: whiten + opacity 0.8) + a tube cord + ground ring;
showGhostUnit is wiped every frame by the HUD so it can't hold a mock. Camera: wrap ThreeCamera.sync to dolly. WAITING on his OK of the
look + the wake-on-damage answer before building PR 1.

BUILD 1 SHIPPED 11-12 PR #1220 (live): he OK'd the look + "yes damage should wake a sleeper". STATUS_DEFS `sleep` (wakeOnDamage, countsAs
stun; Lullaby + Counting Sheep) and `projecting`; spell row `astral:{cord,end}` -> battle.js astralBegin: SPIRIT = the unit itself, BODY =
copy unit `<player>-ab<n>` with `_astralOfId`, shared HP via astralSyncHp, death via map.js defeatUnit -> astralOnDeath. Spirit Walk cord 4,
body follows at end. Notes: champions-combat.md "THE ASTRAL BODY + SLEEPING", spells-vfx.md "THE SPIRIT LOOK". Proof build1_*.jpg in the folder.
Known gaps told to him: AoE over both pieces hits HP twice, no early return, body stands idle, CPU never casts it on purpose.
NEXT: build 2 (psychic x1.5, Stun/Silence snaps home, dream bonus on body), 3 realm window, 4 new spells + Spirit Guide + CPU.
Harness tip: online rooms have a shot clock that auto-ends turns; inject spells on BOTH seats.
BUILD 2 SHIPPED 11-12 PR #1222 (live): psychic x1.5 on the spirit (STATUS_DEFS.projecting.psychicMult, battle.js _hitDamageMath); any
blockAction status or Silence snaps the spirit home (astralSnapHome); one action hits a body+spirit pair once (_astralHitKey). Status page
text added. NEXT: build 3 = Shadow Realm window for spirits (Ghost + Shadow Entity see only); build 4 = new spells etc. Build 3-4 add
new content: the plan was accepted, but the new spell / passive names were my proposals; confirm names with him before build 4.
BUILD 3 SHIPPED 11-12 PR #1225 (live): THE REALM WINDOW. battle.js unitCrossesRealm (spirit) / unitSeesRealm (+ data.js REALM_SIGHT_RACES
ghost, shadow entity) / isUnitSeenAcrossRealm; spirit <-> realm pair reach each other, body does not; seen-across units drawn at 0.42 opacity.
WAITING ON HIM before build 4: names of the new spells / passive (Astral Projection T3, Cut the Cord, Silver Cord are MY proposals; hard rule
"never invent names") and whether Spirit Guide becomes "project an ally". Other open bits: early return, body slump pose, CPU play of it.
BUILD 4a SHIPPED 11-12 PR #1227 (live): raceAstralProjection (T3, cord 6, returns), Spirit Guide = project an ally (astralAlly ->
battle.js astralProjectAlly), raceCutTheCord (T2 Dream Predation, stun ifTargetHas projecting), ai.js rules (_aiHasMagicToFight).
WAITING ON HIM: early return needs a menu command (UI design, his OK) and Silver Cord passive depends on it; names his to rename.
Not checked: CPU casting in a real match, online guest view of builds 3-4, body slump pose.
Decision card (thread in the owner project) (11-12): how a spirit returns early (RETURN menu row [my pick, mock-up first] / re-cast the spell / none).
11-12 16:55 he picked RETURN row. BUILT + pushed UNMERGED on branch claude/project-thread-smzqis (battle.js doAstralReturn/canAstralReturn free action, hud.js row replaces ATTACK for a spirit, online.js wrapper, data.js passiveSilverCord cord +2 + Protect on early return). Mock-up mock_return_to_body_row.jpg posted; on his OK: notes, SPELL_CATALOGUE (Silver Cord I), token bump, merge, upload.
BUILD 4b SHIPPED 11-12 PR #1230 (live) after his 'ok': Return to body row + Silver Cord. PLAN COMPLETE. Leftovers offered: body slump pose, CPU guarding its own body, online guest check of builds 3-4, CPU seen casting in a real match.
