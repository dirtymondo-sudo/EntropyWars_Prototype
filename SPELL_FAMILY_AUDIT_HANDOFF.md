# SPELL FAMILY AUDIT — HANDOFF (2026-09-30)

Written for the next session (and for mondo) while the audit's synthesis step was still running. Everything below is
already in the repo; nothing depends on the scratchpad.

## 1. What was asked

Audit the races × spell families for internal sense (the "yeti has nothing to do with Christmas" test), find
repetitive spells inside families (delete / move / merge / make into an upgrade), find families that need spells
(with options), flag wrong tiers and MP costs, aim for a T1–T4 ladder per family and give a view on 3 vs 4 tiers,
and do an overall tactical-JRPG audit (synergies, many viable strategies, balance). Renames and rewrites are fine.

## 2. What was done (method)

1. **Data snapshot** — `data.js` was loaded headlessly (`load-data.js`, the real values) and dumped to
   `docs/spell-audit/data/`:
   - `families.md` — all 130 families, every spell row (tier, role/kind, element, MP/AP/CD, dmg, range, area,
     statuses, finishers, riders, description).
   - `races.md` — all 124 races: faction, types, class role, base stats, element affinity, inherent passives,
     lore, the 4 tree rungs, families, pool size, tier and role counts.
   - `summary.md` — families by size, missing tiers, redundancy groups by signature, damage-by-tier, outliers,
     tier-rule offenders, off-ladder MP pins, kind counts, role × tier matrix, pool sizes, races missing a role.
   - `synergy.md` — dead fields (descriptions that promise unread mechanics), the status setup → payoff map,
     per-race self-contained vs needs-a-teammate finishers, 2-AP rows by tier, over/under-tuned rows.
   - `family-index.md` — one line per family (compact index).
   The scripts that produce these are in `docs/spell-audit/tools/` (`dump.js`, `synergy.js`, `prep.js`,
   `assemble.js`). Re-run after any bake to refresh the picture.
2. **Fan-out audit (workflow `spell-family-audit`, run `wf_116853e1-f9c`)** — 15 auditors wrote one section each:
   nine family groups (`g1`…`g9`, all 130 families), four race-fit slices (`races-1`…`races-4`, all 124 races),
   one cross-family redundancy/tier/cost/dead-field audit (`cross-redundancy.md`), one synergy/team-building
   audit (`synergy.md`). Every section then went through two skeptics in sequence: a **data skeptic** (every
   number and claim checked against the dumps; 8–30 corrections per section, fixed in place) and a **design
   skeptic** (rules: one family per spell, no race under 3 families, tree rungs must sit inside the race's
   families, the yeti test, "bigger version = upgrade not spell", THE TIER RULE, no vague proposals; 9–24 fixes
   per section, in place). The sections are in `docs/spell-audit/sections/` and are concatenated into
   `SPELL_FAMILY_AUDIT_PLAN.md` (this is the full audit; ~730 KB).
3. **Synthesis + critic** — a synthesis agent writes the front matter (`00-front.md`: verdict, principles, the
   3-vs-4-tier recommendation, master change tables, race pools after the plan, team archetypes, implementation
   order, open questions), then a completeness critic checks every family and race has a verdict and the tables
   agree with the sections, with one fill round. **If `SPELL_FAMILY_AUDIT_PLAN.md` still opens with a
   "front matter pending" note, this step did not land before the session ended — see §6 to resume.**

## 3. Headline findings

**The shape of the catalogue.** 560 rows in `SPELL_BY_ID` (29 passives, 7 legacy alias ids that the rack dedups),
130 families, 124 races, 7 slots / 16 SP, tier = SP. 9 families are EMPTY (Acting Chops, Animal Handling,
Archaeology, Culinary Arts, Gambling, Internet Addiction, Mirror Magic, Music Theory, Persuasion); ~20 more hold
1–2 spells; 74 families miss at least one tier. T4 is 119 rows and 103 of them are damage (61) or damage+effect
(42); movement has no T4 at all; 45 of the 119 T4s cost 2 AP. Pools run from 7 (fortune teller) to 27 (annunaki,
starfish).

**Family verdicts (family auditors, after the skeptics):** 75 KEEP · 42 GROW · 7 DELETE · 1 MERGE · 5 RENAME.
DELETE/fold: Astronaut Camp (→ Alien Weapons), Stone Age (→ Giant Abilities), Persuasion and Astrology (folded
into Cult / Fortune Telling), Music Theory, Acting Chops, Archaeology, Culinary Arts. The Machinery delete was
VOIDED by the design skeptic (robot and honda civic would fall under 3 families). GROW with real kits: Gambling
(bunny girl), Animal Handling (ringmaster, shaman), Mirror Magic (rabbit), Internet Addiction, Chemistry, Trap
Making, Temporal, Horseback Riding, Ropework, Lightning, Wind, Blood, Winter Warfare, Werewolf, Feline, Sasquatch,
Mothman, Desert Acclimation, Living Stone, Cryptid, Street Smarts, Politics, Deep State, Thievery, Mech Pilot.
UNIQUE flags proposed: Kaiju Rampage (kaiju; King Kong moves to a renamed Great Ape kit), Camelot Powers (King
Arthur; Knighthood becomes the shared knightly code), Scarecrow Abilities (typo "Abilties" fixed too).

**The yeti-test misfits (race side, reconciled with the 3-family floor):** the race slices flag families worn as
identity because they share an element: Ice Magic on atlantean / loch ness / santa, Cosmic on antihero / superhero
/ starfish, Earth + Marksmanship on annunaki, Marksmanship on cosmic wraith, Fire on martian and overlord, Alien
Weapons on black goo, Agriculture on king kong / bigfoot / antperson, Necromancy on zombie (70 MP, INT 0),
Grave Hunger on dreameater, Wind on mothman and kraken, Light + Poison on deep sea fish, Heavenly Duties on
valkraye, Driving on police officer, Temporal + Healing on cult leader, Psychic on professor and chosen one,
Stage Presence on clown. The design skeptics STRUCK removals that would leave a race at 2 families unless paired
with an add (werewolf/Hunting, politician/Military, telepath/Deep State, shadow entity + halfdemon/Spy Gear,
ghost/Trickery, skeleton/Poltergeist, juggernaut/Athleticism, ice queen/Winter Warfare made contingent) — the
race sections carry the paired swaps and the rung replacements for every removed family.

**Redundancy (cross-redundancy §1, ~170 change records).** 14–15 "+1 ATK stage" self-buffs priced at T1, T2 and
T3 across families (End Zone Dance 25 MP vs Underdog Spirit 75 MP); 5 identical DEF+1 rows at T2; pure
Stun/Root/Marked/Jammed debuffs at T1 and T3 for the same or shorter durations (Anchor T1 root 2 vs Cuffed T3;
Deneuralizer T1 jammed 2 vs Neural Hack T3 jammed 1); nine shields and nine escape-teleports that are near
copies; four near-identical 5×5 cosmic nukes; Nuke = Fire for Effect; same-race clones (Robo Punch = Hydraulic
Crush, Synthetic Punch = Rocket Fist, Venom Fang = Infectious Bite, Symbiotic Drain = Absorb, Symbiote Armor =
Mitosis, Ice Shard / Ice Spear, Tidal Blessing / Temporal Tide, Light Shield / Luminous Shield, Scorched Earth /
Wall of Fire, Migraine / Mind Shatter); rows that are really shipped upgrades (Impact Round = Blast, Ricochet
spell = Ricochet upgrade). 16 same-family duplicates are recommended for outright deletion (Feral Dive, Ambush
Lunge, Ice Shard, Neural Hack, Shield Maiden, Luminous Shield, Fire for Effect, Scorched Earth, Clockwork Turret,
Rapture, Forest Ambush, Improvise, Radiant Bolt, Infernal Conscription, Dark Justice, Cryptid Vanish) — note the
race skeptics kept some of these because they are a race's tree rung (Neural Hack, Ambush Lunge) and turned them
into REWRITEs instead; the front matter reconciles.

**Tiers and costs (cross-redundancy §2).** Inverted tiers: Tremor Stomp T1 (125 self-AOE + Stagger + deform,
25 MP) vs Fee Fi Fo Fum identical at T3/75 MP; Pounce T1 120 rng 3 vs Ambush Lunge T3 125; Big Kick T1 120; Curb
Stomp and Frenzy T1 120 + Grievous; Cataclysm Stomp T1 2 AP 5×5; Rampart T4 for a 60-damage wall. Under-tuned:
Trunk Throw T3 100, Dragon Toss T3 70, Spike the Ball T3 80 area, Recursive Loop / Long Rifle / To Be Continued /
Ambush Lunge (T3 single hits with no rider). The 7 tier-rule offenders (damage+effect ≥120 below T3). The T4s
pinned at 25 MP (A Really Good Punch, Hocus Pocus) are jokes that dominate the ladder. Seven T1 rows cost 2 AP.

**Descriptions that lie (dead fields).** Dead Eye and High Noon say "always a critical hit" (`guaranteedCrit` is
never read); No Mercy and Weigh the Heart say "more damage the lower the target's HP" (`executeBonusPct` unread);
Recursive Loop and Dark Justice say "bonus damage to debuffed targets" (`bonusVsDebuffed` unread); Miracle's
heal-on-arrival and Iron Dome (a healAll with heal 0) are flagged too. Each needs a real mechanic or a rewrite.

**Synergy (synergy.md).** Marked has 7 setups and 0 payoffs; Blind, Wet, Minimize, Scanner, Grievous, Blessed,
Possessed, Protect, Overclock, Invisible, Taunt, Corroded, Incendiary are setup-only; Frozen's 3 payoffs are all
Winter / Christmas. The single-race loops (tethered, voodoo, haunted, feared, infected, contract, soulBound, goo)
are judged good signatures. **The MP economy is the biggest structural finding:** base MP is fixed and regens
3%/round, so every bruiser/tank under 100 MP (juggernaut 40, robot 50, giant 60, dinosaur 60, cyclops 65,
minotaur / zombie / golem 70, sixteen more under 100) can never cast the 100-MP T4 finishers the Stagger economy
(23 setups / 16 payoffs) is built around. Proposed: floor base MP at 100, or pin bruiser-only T4s to 75 MP.
Proposed synergy layer: ~20 family passives (Brittle, Septic, Aftershock, Ambush, Foreman…) and ~12 family-scoped
upgrades (Exploit: Marked, Shatter, Concussive…), plus one Marked payoff per setup family.

**The tier question (cross-redundancy §5).** Recommendation: keep 4 tiers but enforce ONE categorically bigger T4
per family (cosmic, water, earth, infernal court, robot, light… each hold 2–4), folding ~25 "T3 + 35 damage" ults
down to T3; SP max stays 16 and the "one T4, two T3, two T2, two T1" kit becomes true by construction. If mondo
prefers 3 tiers: every kept T4 becomes a T3 with `cost: 100` pinned, SP max drops to 12, `bake-spell-mods.js
--stamp-tiers` rewrites the field.

## 4. Where everything is

| Path | What |
|---|---|
| `SPELL_FAMILY_AUDIT_PLAN.md` | The full plan: front matter (if synthesis landed) + F (cross-family) + S (synergy) + F.g1–g9 (family blocks) + R.1–R.4 (race fit). |
| `SPELL_FAMILY_AUDIT_HANDOFF.md` | This file. |
| `docs/spell-audit/sections/*.md` | The 15 verified sections (source of the plan) + `00-front.md` once synthesized. |
| `docs/spell-audit/data/*.md` | The data snapshot the audit was checked against (2026-09-30 data.js). |
| `docs/spell-audit/tools/*.js` | `dump.js` (writes families/races/summary .md next to it), `synergy.js` (prints synergy.md), `prep.js` (group slices + family-index), `assemble.js` (stitches sections into the plan). They expect to run from the folder holding `families.md`; `assemble.js` reads `./sections` and writes the repo-root plan. |

Each family block uses verb tags: DELETE · MERGE · MOVE · RENAME · RETIER · RECOST · REWRITE · UPGRADE · PASSIVE ·
NEW, then Additions (new spells with full numbers) and Upgrades (which shipped upgrades the rows should take).
Each race block: Now · Fit (✓/✗ with reason) · Proposed families (REMOVED/KEPT/ADDED, with rung replacements) ·
Pool gaps · Identity.

## 5. Caveats

- The proposals are model-written and checked against the data and the rules, not playtested. They need mondo's
  taste pass — especially the NEW spells (numbers follow the house scale: T1 single ~100 / area ~80, T2 ~130 /
  ~100, T3 ~125–135, T4 ~180 / ~160).
- Family sections and race sections were written in parallel and sometimes disagree (a family auditor removes a
  race, a race auditor keeps it and swaps a different family). The design skeptics applied the 3-family floor to
  both; the front matter's master tables are where the two are reconciled. When in doubt, the race section wins
  on membership and the family section wins on the spells.
- Alias ids (`sharedRampart`=`rampart`, `raceEmpPulse`=`empBurst`, `raceOverclock`=`overclock`,
  `raceRampage`=`rampage`, `raceSuppressingFire`=`raceSuppressiveFire`, `raceChassisSlan`=`raceChassisSlam`,
  `raceLavaLamp`=`racePlasmaWhip`) are one object each; anything that "deletes" one of them is a no-op.

## 6. Next steps

1. **Finish the front matter** if it is missing: the workflow script is
   `~/.claude/projects/-home-user-EntropyWars-Prototype/a7769b3b-7c02-57c0-9c27-2253b99f7546/workflows/scripts/spell-family-audit-wf_116853e1-f9c.js`
   (resume with `resumeFromRunId: "wf_116853e1-f9c"` in the same session), or simply run the Synthesize prompt
   from that script in a new session against `docs/spell-audit/sections/` (copy them back to a scratch
   `sections/` folder, or point the prompt at the repo path), then `node docs/spell-audit/tools/assemble.js`.
2. **mondo's decisions** (the front's §9 lists them; the ones every section hits): 4 tiers with one T4 per family
   vs 3 tiers · floor base MP at 100 vs pin bruiser T4s at 75 MP · keep or delete the 9 empty families (the audit
   builds Gambling, Animal Handling, Mirror Magic, Internet Addiction and deletes the rest) · allow more than 5
   families per race or hold the line · the 25-MP T4 jokes · implement guaranteed crit / execute scaling / bonus vs
   debuffed as real mechanics or reword · a pool-size target (the race auditors settled on 12–24).
3. **Apply through the Spell Library** (Settings → Developer), in this order, each as one export → `node
   bake-spell-mods.js <export.json>` → deliver `data.js` (R2 + Render) with an `index.html` `?v=` bump (RULE #1b):
   - Batch A, data-only and safe: RETIER / RECOST / RENAME / description fixes / deletions of pure same-family
     duplicates that are nobody's rung (cross-redundancy §1–§3).
   - Batch B, the registry: FAMILIES tab deletes / merges / renames / UNIQUE flags, POOLS tab race re-seating with
     the rung swaps named in R.1–R.4 (the bake refuses a RACE_TREE rung outside its race's families).
   - Batch C, new content: NEW rows from the role templates (family blocks' Additions), the family passives and
     family-scoped upgrades (synergy §5), the Marked payoffs.
   - Batch D, engine: the dead fields (`guaranteedCrit`, `executeBonusPct`, `bonusVsDebuffed` → either a real read
     in battle.js `_applyDamageSpellHit` / the crit roll, or strip the text), any new hook keys the passives name
     (`PASSIVE_HOOK_KEYS`), any new upgrade patch keys (`_upgApplyPatch`), an MP floor or T4 pin, and — for any new
     on-screen moment — the online.js relay (RULE #2).
4. **After each bake**: `node --check data.js`, rerun `docs/spell-audit/tools/dump.js` + `synergy.js` from the
   data folder and diff against the snapshot: the "Spells in no family", "RACE_FAMILIES naming unknown families",
   "Families on no race" and "Race pools missing a role" sections should shrink, and no race may sit under 3
   families.
5. Regenerate `SPELL_CATALOGUE.md` from the library when the pools settle (it is stale: it predates the 2026-09-27
   family export and the 2026-09-30 races).
