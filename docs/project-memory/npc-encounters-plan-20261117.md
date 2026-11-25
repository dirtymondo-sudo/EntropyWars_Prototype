---
name: npc-encounters-plan-20261117
description: NPC ENCOUNTER SYSTEM plan (mondo 11-17, top priority, Disaster City first): docs/plans/npc-encounters/PLAN.md, his answers, open Q20-Q24
metadata:
  type: project
  modified: 2026-11-17T12:24:06.926Z
---
Thread (owner-project id). mondo's docx concept (made with another AI) rewritten as docs/plans/npc-encounters/PLAN.md (PR #1960, #1961, rev 3 #1962); original = concept-v0.3.md beside it.
- It is a BRAND NEW encounter system: it REPLACES old rules (one-strike fight, "never random"). Don't flag clashes as conflicts (his 11-17 pushback).
- His answers 11-17: ladder Flee/Talk/Fight max 3 strikes, restarts after a flee; hostility by room + unit (Hell mostly hostile, some rooms none); some tempers skip Talk; JOINING offers yes; offers = money, health potions, revives; shops/items, spell learning (he has his own concept), quest clues NOT NOW; anyone aware + willing may join a fight; onlooker reaction depends on unit; memory until next game day; muggings yes with a reason line (NOT built on main); old factions gone -> natural GROUPS (cops+firefighters, same race defends same race), to flesh out; Disaster City first (vertical slice); PRIORITY #1 now.
- Round 2 answered 11-17: Q20 = option C (grudge lists), groups + onlooker table OK, NO calm timer, pay-off = 8 gold x level + 2 certain spoils rolls, no XP (rev 4). Nothing open; next = step 0 + 1a.
- Steps 0-10 with Fable (design/audit/mock-ups) vs Opus (code). Overlaps claims row "Disaster City NPCs: the spawn system" ([[npc-system]] second account).

- STEP 5A DONE 11-18 PR #2072 ((thread in the owner project)): NPC HP ledger in the PROFILE door.hq.wounds (beside cleared, local); heals after Sleep block / walker next game day via clock running hours `t` (hqClockTotal). His 11-18 rule (PR #2075): ANY enemy that goes down (win/loss/retreat) is beaten = cleared for the day, group members too; no 1-HP revive. He was angry at 'stupid ass questions': don't ask the obvious. Next = 6a design/mock-up, only on his word.
- STEP 6A DELIVERED 11-18 PR #2080 (docs/plans/npc-encounters/STEP-6A.md + 2 mock-ups, /mnt/project-files/npc-encounters/step-6a/): give up at 30 % HP (Civilian), run (Coward/Opportunist), fight on (rest); flag + grey bar + kneel; TALK free within 3 squares; pay-off/arrest/let go, no XP. OK'd 11-18.
- STEP 6B DONE 11-18 PR #2092 (same thread): built per STEP-6A (npc-system.md "THE LOSING NPC"); kneel = podium defKneel; proof pics /mnt/project-files/npc-encounters/step-6b/. Next = the GATE (mondo plays Bayside), step S.
- GATE played 11-18 (his Bayside fights). STEP 7A (CROWDS design) DELIVERED 11-18 PR #2111 ((thread in the owner project)): STEP-7A.md + step-7a-crowd.jpg / step-7a-preview.jpg (/mnt/project-files/npc-encounters/step-7a/). OK'd; STEP 7B (THE CROWD) BUILT + live 11-18 PR #2123 (npc-system.md "THE CROWD", pictures /mnt/project-files/npc-encounters/step-7b/). Next: S, then 8 (joining). Proposals put: Civilian 60% watch / 40% run, bands, never next to a fighter, Opportunist mugs after a won fight if party < half HP.
