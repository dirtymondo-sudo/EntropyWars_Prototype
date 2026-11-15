---
name: spell-library-plan
description: State and open questions of SPELL_LIBRARY_PLAN.md (spell editor revamp, families, upgrades, passives); Phases 0-7 shipped 2026-09-26; jobs removed 2026-09-27 (zip 12)
metadata:
  type: project
  modified: 2026-09-26T05:34:08.397Z
---
SPELL_LIBRARY_PLAN.md (repo root, copy in /mnt/project-files/spell-library/) written 2026-09-25. mondo starts phases in new threads, one per phase. Each phase appends to §11 when it ships (§11 has the full detail; this is the index). Engine-level notes per phase are in [[spell-library-phase-notes]].

- Phase 0 THE SCHEMA: zip _0, token 20260925-spell-library-01-cors.
- Phase 1 THE SHELL: zip _1, token 20260926-spell-library-02-cors.
- Phase 2 THE GRID + THE LOOK: zip _2, token 20260926-spell-library-03-cors.
- Phase 3 THE TARGETING: zip _3, token 20260926-spell-library-04-cors.
- Phase 4 THE PASSIVES + GEAR MERGE: zip _4, token 20260926-spell-library-05-cors.
- Phase 5 THE UPGRADES: zip _5, token 20260926-spell-library-06-cors, thread "Spell library, Phase 5 upgrades" (2026-09-26).

- Phase 6 THE CATALOGUE + FAMILIES AS POOLS: zip _6, token 20260926-spell-library-07-cors, thread "Spell library Phase 6" (2026-09-26). Baked mondo's export (90 families, Metal deleted, 5 spells deleted) then 13 new families; every spell in exactly ONE family (mondo's rule); RACE_FAMILIES for all 103 races (mondo's rule 3-10; shipped 3-5); the pool = tree row + job + family members; POOLS tab picks families per race.

- IDENTITY GENERATOR (2026-09-26, thread "Spell library identity generator"): zip spell-library/ENTROPY_WARS_SPELL_LIBRARY_IDENTITY.zip, token 20260926-spell-library-08-cors. IDENTITY tab in the library; written kit per family + 241 archetypes in ui.js SLB IDENTITY block; a new family needs a kit (spell-identity.test.js fails otherwise). mondo's verdict on usefulness not yet in.

- Phase 7 THE FAMILIES AS POOLS: zip spell-library/ENTROPY_WARS_SPELL_LIBRARY_7.zip, token 20260926-spell-library-09-cors (2026-09-26). Pool = job's four + race families' members (RACE_TREE no longer read for the pool; kept for MP ring/twins/DEFAULTS); unique families enforced; Freelancer borrows by family (flBorrowFamilyIds); forge + HQ racks FOLD BY FAMILY (default) or BY TIER (localStorage ew_rack_group), one ＋BORROW key 'B0'; codex dossier lists families.

- 2026-09-27 (thread "Spell library bake + new characters"): zip spell-library/ENTROPY_WARS_SPELL_LIBRARY_11.zip, token 20260927-spell-library-11-cors (merged on open world 5B). Baked mondo's 2nd export; RACE_TREE rungs outside a race's families swapped + borrowed by id; identity test forbids archetype names equal to a race; NEW_CHARACTERS.md lists new-race candidates. Door agent lost Trapdoor (now Trap Making); mondo chose to keep it that way (2026-09-27).
- JOBS REMOVED 2026-09-27 (thread "Remove jobs + spell picker"): zip spell-library/ENTROPY_WARS_SPELL_LIBRARY_12.zip, token 20260927-spell-library-12-cors (delta over open world 14). No jobs / Freelancer / secondary job; unit.cls = 'Vessel'. 13 job passives = TRAINING family rows (1 SP, universal); Adaptable passive opens borrowing (story officer starts with it). Marksmanship + agriculture seated on races. Forge rack = family tabs + slot cards + one info panel. Notes: champions-combat.md "THE JOBS REMOVAL", ui-menus-audio.md "THE FAMILY TABS".

Next / open: Phase 6's suggested family merges/renames untouched.

§7 defaults (mondo RULED 2026-09-25: tiers and costs editable; equipment merges into passives, max 2 passive/equipment rows of the 7 slots; the 17 current accessories universal GEAR family; masks fixed on the board). Still defaults: RACE_TREE kept for rungs/twins/ring MP inside the families; per-upgrade SP price, max 2 upgrades per spell; 7 slots / 16 SP kept; family passives cost their tier; dmg>=120 + status needs tier III (lint only); random targets distinct enemies; splash enemies only; local mods off online; notes dev-only; no unique families (mondo's own set none); spells never crit.

**Why:** mondo wants to redesign 535 spells into families with modular upgrades inside a tool, not in chat, and export one doc a later thread bakes.
**How to apply:** a phase thread reads §9 for its row, §6 for the engine sites, §7 for the defaults. mondo's export wins over the plan where they disagree; mondo's library exports are baked with bake-spell-mods.js before any thread extends them. [[door-gun-plan]] and [[capture-plan]] are the sibling plans.
