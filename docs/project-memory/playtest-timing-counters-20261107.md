---
name: playtest-timing-counters-20261107
description: 11-07 VS CPU playtest of delayed/counter/conditional/cooldown/turn-order abilities (report only): bug families A-G + harness tips
metadata:
  type: project
  modified: 2026-11-07T04:48:42.576Z
---

11-07 playtest, report only, main b3ab112. Report: /mnt/project-files/playtest-mechanics-20261107/PLAYTEST_TIMING_COUNTERS_20261107.md
(files in timing-counters/: shots, ledger, 3 match exports, turn-order records). Sibling reports in the same folder: forced
movement, zones/traps, status effects, buffs/utility.

Bug families: A two-step spells dead-end (Soul Bind, Voodoo: first pick with no valid second -> "NO TARGETS IN RANGE";
Deploy Turret pre-armed on caster tile); B debuff spells offer debuff-immune Ghoul (Pure Negativity) with green CONFIRM,
Brainwash cooldown spent on resist; C delayed blasts (Prophecy/Nuke/Orbital/Extinction/Spirit Bomb) say "everything inside"
but spare allies (friendlyFire never set) -> mondo decides; D marked-shot camera: 380 ms glide, 0 impact delay, 500 ms hold
(misses the PR #947 1.2 s hold); E Guard overwatch cleared at round start while GUARDING badge stays a round; F wording
(Nuke log order, Place Bomb is a contact trap, Overfit 500 cap, turret 110, Revive "NO TARGET" when already revived,
height-gated melee spells say NO TARGET); G questions (delayed blast lands after caster dies, Encore in Trick Room,
combos with silenced partner, Filibuster applies at round end, Frozen->Shatter only same round).
Works: delays land end of cast round (Nuke: end of next), cooldown "⏳ CD n" greying, Trick Room 3 rounds, Encore, turrets,
Overfit, Revive once per unit, Executive Order stun, Frozen != stun, celestial round 4.

Follow-up (online friendly room, both seats by hand, files in timing-counters/online/): every family row now has a
result (coverage table in the report). Proven online: executes (Ammit after-hit, Walk the Plank), Weigh the Heart x1.5,
Crusade unholy, Star Decree x1.5 vs Slow, Feeding Frenzy +25% kill heal, Thousand Cuts, Chain Lightning, Soul Harvest 30%.
Battle D (online Arena, files timing-counters/online-arena/) closed No Mercy, Last Kiss, Nexus channel: whole family done. New bugs H1-H9: Voodoo MOVE->CAST drops 2nd pick, Soul Bind lit
row / duration desync, Riposte says melee but only basic attacks counter, Cannibalize offers ally graves, GUEST STUCK ON
BOARD after sudden-death win (no result screen), Rematch started host-only match. Q: Take Aim / No Mercy execute only prints
if the target survives the hit. Server replays land in repo replays/ (untracked): move them to project files.
Online harness tips: script whole rounds per bash call (60 s shot clock); spell/target rows are UPPERCASE; end turn with
sel ".hrlg-blade" "/■/" (text "END TURN" fails); Escape with nothing armed opens the pause menu; perl capture vars get
reset by a later match in the same expression.
Harness tips: Enter fires the self-cast confirm pill; check the active unit before END TURN (CPU turns auto-end);
`ph eval` recorder of unit HP + worldToScreen every 100 ms measures camera framing; worldToScreen gives huge coords for a
point behind a close-up camera, so don't read one row as "off screen". Shared mechanics folder: put your files in your own
subfolder (I overwrote forced-movement's root ledger/exports by copying to the root). Related [[playtest-elements-20261106]].
FIX B (11-07, PR #1015, (thread in the owner project): status/stat-only casts skip units every effect bounces off (battle.js spellBouncesOffImmune in spellTargetUsableOn + doSpell guard). Harness tip: set CPU party via GAME.state.partyMeta[2] before SEAL (Ghoul can't be forced otherwise).
H3 (11-07, PR #1036): Soul Bind count drift was pre-#981 build; #1031 synced it. Shadow Realm caster/target drift fixed via battle.js syncPairStatusCount (shorter end's count+fresh+hold). Probe: playtest-mechanics-20261107/soul-bind-one-count/probe_sb.js (both seats local, fog off, enemies moved beside caster; USE_ASSET_CACHE=1 LOCAL_ASSETS=battle.js; chromium executablePath /opt/pw-browsers/chromium). Status counts on screen = .hrlg-schip title 'N turns left'.
