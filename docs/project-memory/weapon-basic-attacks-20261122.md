---
name: weapon-basic-attacks-20261122
description: 11-22 held weapons used in basic attacks (PR #2438): what each weapon unit does, the probes, what is still open
metadata:
  type: project
  modified: 2026-11-22T19:07:18.166Z
---
Thread (owner-project id) ("Use held weapons in basic attacks"), from mondo 11-22: "They should also use them for their basic attacks". Follows [[weapons-in-hands-20261122]]; sister spells (thread in the owner project) (PR #2436, owns `unitHeldInfo`). Full notes: repo docs/notes/character-models-plan.md 6e "THE WEAPON IN THE BASIC ATTACK".

Done PR #2438 (token 20261122-weaponatk-01-cors, uploaded): sprites.js RACE_CREATOR_LOOK_DEFS rows carry `basicAttackKind` (slash = blades, ranged = guns, throw = ninja's star, magic = staff + microphone, arrow = Robin Hood); it applies ONLY when the creator (MPFB) look with the hold is drawn, so default Meshy looks are unchanged. Shots leave the weapon's end (three-renderer.js `unitShotOrigin`, built on `unitHeldInfo`). No new online relay needed.

Probes in /mnt/project-files/weapon-attacks/scripts/: attack.js (forge viewer, side view; first unit in UNITS is a throwaway) and battle.js (real battle, freezes the clock at the shot; `OUT= DSF=1.5 NOCINE=1 CASTER=7,8 FREEZE=220 MELEE=0 UNITS=race:gender,… CAM='{"zoom":4.2}'`, list the first unit twice).

Open (told mondo): long guns (marksman, sheriff) and pistols fire one-handed from the hip, no aimed two-hand clip; wizard's staff levels like a lance, needs its own clip; second-hand weapons (war fan, shields) unused; pirate + police officer creator looks now cut/swing where the default look shoots; MPFB looks still non-default pending his approval.
