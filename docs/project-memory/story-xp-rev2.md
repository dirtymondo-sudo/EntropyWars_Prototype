---
name: story-xp-rev2
description: Story XP rework 2026-09-30 (PR #23): only kills/captures/victory pay XP, L^3 curve, same XP per level, no mid-battle level heal
metadata:
  type: project
  modified: 2026-09-30T07:05:56.408Z
---
Done + merged 2026-09-30 (PR #23, token 20260930-xp-01-cors, zip xp/ENTROPY_WARS_XP.zip = data.js, battle.js).
mondo's rules: XP only from kills, victories, successful captures; every unit worth the same XP by level (no race yield, no boss bonus); Pokemon-like curve (L^3, KILL_XP 10 x level x Gen5 gap); units level mid-battle. Heal call (made by Claude, mondo left it open): a level-up in battle adds only the HP/MP growth, full heal at the debrief (HQ_LEVEL_RULES.levelHealBattle false). Spell learn order untouched on purpose; mondo will revisit spells later.
Notes: docs/notes/story-party-progression.md "THE XP RULE + THE CURVE rev 2".
