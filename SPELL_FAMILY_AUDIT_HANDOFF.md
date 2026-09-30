# SPELL FAMILY AUDIT — HANDOFF (2026-09-30)

Written for the next session (and for mondo). **Status (2026-09-30, second session): the plan is COMPLETE** — the
design-skeptic pass on R.1 / R.3 is finished and the front matter (§1–§11 of `SPELL_FAMILY_AUDIT_PLAN.md`, also
`docs/spell-audit/sections/00-front.md`) reconciles all 15 sections into one change set. Nothing has been applied to
`data.js` and nothing has been playtested. Everything below is in the repo; nothing depends on a scratchpad.

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
3. **Synthesis + critic (done in the second session).** Every proposal in the 15 sections was turned into a change
   record (2,575 records), applied to a copy of the 2026-09-30 data with the precedence rules of front §1 / §11.1
   (the owning family block decides a row; the race block decides membership and rungs; the cross-family audit, then
   synergy, fill in where the family block is silent), and re-checked against the audit's rules (no race under 3 or
   over 5 families, every rung inside its race's families, one T4 per family under Q1, THE TIER RULE, no worn empty
   family). The remaining breaks got explicit resolutions (front §11.7). The engine claims were re-verified in the
   code, which overturned four of them (front §11.2 — above all the MP gate, see §3 below). Two completeness critics
   then read the front matter against the sections and the computed after-plan state, with one fill round.

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

**Synergy (synergy.md).** Marked has 7 setups and 0 finishers (it does pay +40 on the next hit); Blind, Minimize, Scanner, Grievous, Blessed,
Possessed, Protect, Overclock, Invisible, Taunt, Corroded, Incendiary are setup-only; Frozen's 3 payoffs are all
Winter / Christmas. (Wet was listed as setup-only by the scan but is live in the elemental combo layer — front §11.2.) The single-race loops (tethered, voodoo, haunted, feared, infected, contract, soulBound, goo)
are judged good signatures. **The MP economy — CORRECTED in the second session:** the first session read base MP (`RACE_BASE_STATS`) as final
and concluded that 25 bruisers/tanks under 100 MP could never cast their 100-MP T4s, proposing an MP floor at 100 or
75-MP T4 pins. That is wrong for PvP: every unit is built at a level, `levelStatGains` adds MP, and every PvP mode
builds at level 100, where MP = base + 100 (juggernaut 140, giant 160, casters 330–360). The floor and every pin are
dropped (front §5); what remains is a narrower story-mode question for the four lowest pools at low party level
(front §10 Q2). Proposed synergy layer: ~20 family passives (Brittle, Septic, Aftershock, Ambush, Foreman…) and ~12 family-scoped
upgrades (Exploit: Marked, Shatter, Concussive…), plus one Marked payoff per setup family.

**The tier question (cross-redundancy §5).** Recommendation: keep 4 tiers but enforce ONE categorically bigger T4
per family (cosmic, water, earth, infernal court, robot, light… each hold 2–4), folding ~25 "T3 + 35 damage" ults
down to T3; SP max stays 16 and the "one T4, two T3, two T2, two T1" kit becomes true by construction. If mondo
prefers 3 tiers: every kept T4 becomes a T3 with `cost: 100` pinned, SP max drops to 12, `bake-spell-mods.js
--stamp-tiers` rewrites the field.

## 4. Where everything is

| Path | What |
|---|---|
| `SPELL_FAMILY_AUDIT_PLAN.md` | The full plan (~1 MB): front matter §1–§11 + F (cross-family) + S (synergy) + F.g1–g9 (family blocks) + R.1–R.4 (race fit). |
| `docs/spell-audit/sections/00-front.md` | The front matter alone (~280 KB): verdict, principles, tiers, MP, master change tables, race pools after, archetypes, implementation order, decisions, reconciliation log. Read this first. |
| `SPELL_FAMILY_AUDIT_HANDOFF.md` | This file. |
| `docs/spell-audit/sections/*.md` | The 15 verified sections (source of the plan) + `00-front.md` once synthesized. |
| `docs/spell-audit/data/*.md` | The data snapshot the audit was checked against (2026-09-30 data.js). |
| (tools) | The dump/assemble scripts were not committed; the data snapshot above is what they produced. |

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

1. **mondo rules on front §10** (Q1–Q12). The plan as written assumes each recommendation: four tiers with one T4 per
   family (Q1), no base-MP change for PvP (Q2), at most five families per race (Q3), A Really Good Punch deleted and
   Hocus Pocus laddered (Q4), `guaranteedCrit` reworded and `executeBonusPct` wired for Weigh the Heart (Q5), 12–24 as
   a pool guide (Q6), the 20 data-only family passives in Batch C (Q7), the four one-race families kept (Q8),
   Scarecrow Abilities and Ki Energy as the only new UNIQUE flags (Q9), a separate stat pass (Q10), off-tier rungs
   accepted (Q11), ids confirmed at export (Q12).
2. **Apply in the order of front §9** through the Spell Library, one export per batch → `node bake-spell-mods.js
   <export.json>` → `node --check data.js` → deliver `data.js` (R2) + `index.html` with a fresh `?v=` token (RULE #1b;
   `npm run deploy`) → Render:
   - **A** row edits (RETIER / RECOST / RETUNE / RETYPE / RENAME / DESC, live-field REWRITEs, dead-field deletions,
     deletions of rows nobody rungs); **A2** the 13 Q1 folds if Q1 = four tiers.
   - **B** the registry in ONE export (the bake refuses a rung outside its race's families): the 8 family deletes /
     folds, the 22 MOVEs, rung-row deletions, 64 races' new family lists, 67 races' rung changes, the family renames,
     the UNIQUE flags.
   - **C** new content with live mechanics: the new rows of front §6.3, the 20 LIVE passives, the live upgrades, the
     per-row upgrade lists from the family blocks.
   - **D** engine (battle.js / data.js; online.js for any new on-screen moment, RULE #2): front §6.5, `addStatus` first.
3. **After every bake**, re-dump with `dump.js` + `synergy.js` (in git history at fdefd66, `docs/spell-audit/tools/`)
   and diff against `docs/spell-audit/data/`: pools should match front §7 and ladders front §6.1; no race under 3
   families; every rung inside its race's families; "spells in no family" and "families on no race" empty.
4. Regenerate `SPELL_CATALOGUE.md` from the library when the pools settle (it predates the 2026-09-27 family export and
   the 2026-09-30 races).
