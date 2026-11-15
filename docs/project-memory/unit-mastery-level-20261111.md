---
name: unit-mastery-level-20261111
description: Cosmetic per-unit Mastery level (M plate) shipped PR #1123 on 11-11; rules, where it shows, and the picks mondo can overturn
metadata:
  type: project
---

mondo asked 2026-11-11 for a purely cosmetic per-unit level ("lvl 134 time cop but only a lvl 3 starfish") tied to the unit achievements. SHIPPED PR #1123, (thread in the owner project). Plan page https://claude.ai/artifact/VsEJRAPQSuvSxMmQ3CTyfJ. Proof /mnt/project-files/unit-mastery-20261111/proof/.

- Called Mastery, drawn as an "M 134" plate, because the battle panel and story mode already show a gameplay level as "Lv". Thread's pick, his to overturn.
- Derived, never stored: data.js UNIT_MASTERY_RULES from profile.progress.champs[race] (games/wins/kills/deathless + bonus per ACH_CHAMP_LINES tier). 100 XP a match, +50 win, 10 a kill, +25 deathless; 100 XP + 25 per level, 500 from level 17, no cap.
- Units carry `ulv` in a fight; the Room seat faces carry `lv`. Full code map: docs/notes/ui-menus-audio.md "THE MASTERY LEVEL".
- Open for him: the name/plate, CPU matches counting like online, the numbers, story/dungeon giving kill XP only.
- Not checked: WebGPU, Quick Play Match Found, builder wall tile, reload mid-match.

**Why:** must stay cosmetic (NEVER INVENT NEW GAME RULES). **How to apply:** never let any rule, stat or reward read `ulv` or the level; follow-ups go to this thread.
