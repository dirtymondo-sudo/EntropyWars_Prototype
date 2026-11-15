---
name: playtest-wipeout-20261023
description: 10-23 hand-played VS CPU match won by WIPEOUT (Stonehenge 4v4, Training, round 12) and what it found; part of the 3-thread win-condition playtests.
metadata:
  type: project
  modified: 2026-10-23T03:15:41.154Z
---

10-23 PLAYTEST 4 (wipeout win, mondo asked for three threads: wipeout / Cube / Keys). Stonehenge Arena 10x10 4v4, Training tempo, WebGPU sandbox. WON BY WIPEOUT round 12 (122m game clock), 8 kills to 3. Party "Wipeout Crew": Dragon, Superhero, Mech, Ki Fighter (AoE + finishers). Final blow: Dragon refund AP -> Entropy Strike Hell on Earth killed Yeti (2011) + Demon (1507) while Fallen Angel/Nephilim were on respawn timers. Report https://claude.ai/artifact/7yLaT55BM4jvAiiUjHetxq ; shots /mnt/project-files/playtest-wipeout/. Match 1 lost at round 6 to a sandbox restart (not a game bug). Nothing fixed.

Findings (report only, mondo picks): victory line "4 v 1 STANDING" after a wipeout (win logged before Yeti's death); Entropy picker estimate ~972 vs real 2011/1507; green "!" on a 2nd super-effective hit in the same turn though one press per turn; flying units auto take off on a raised Move tile and spend both AP; Imitation Report opens mid-cinematic over VICTORY; camera inside Dragon/Nephilim; target row swings camera off target; turn icons overlap VESSEL DATA; huge spawn Nexus label up close; setup shows size twice and list card says 12x12.

Checked as intended: one press per unit per turn (overflow -> Entropy), potions any range ("any living ally"), respawned unit sits out first round.

Wipeout tactic that worked: kill in waves so respawn timers (2,3,5 rounds) overlap; move a unit so every live enemy is visible, then Entropy Strike. Harness: confirm via .hrlg-confirm-inline / .hrlg-confirm-lbl bounding box (offsetParent can be null); ENTROPY READY button is a left-panel push button. See [[hands-on-playtest]].
