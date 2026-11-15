---
name: wipeout-vs-keys-fixes-20261023
description: PR #465 (10-23) fixes from the Wipeout vs Keys matchup: charge forecast online (chargeStrikesFirst), CHANNEL greys airborne, INSPECT tool row
metadata:
  type: project
  modified: 2026-10-23T21:24:42.101Z
---
PR #465 merged 2026-10-23 (token 20261023-wipekeys-01-cors, then re-bumped by #464 to wipewipe-02; zip r2-sync/ENTROPY_WARS_SYNC_20261023-2124.zip).
- battle.js `chargeStrikesFirst(unit, spell, target)`: doSpell + forecastSpellPlan share it. Online the HOST runs the cast; the fog term (activePlayer vs viewer) now reads the host's seat on a guest. Root cause of "Leap forecast omits wind x1.25": guest preview struck from the grounded landing tile, host struck from the air (wind "on Air" x1.25). Rule untouched: a guest's charge in fog still strikes from origin then hops (flagged asymmetry: host's own charges strike from beside).
- hud.js CHANNEL tool row greys "Land first" airborne; tile menu drops Channel row airborne.
- hud.js INSPECT tool row (modes with hasHourglasses !== false, story too) arms actionMode 'inspect'; tool rows cap 5.
- Far Sight unit list was already fixed by PR #452. Self teleport log fixed.
- Harness: /mnt/project-files/balance/weak-races-harness setup.sh is blocked by the auto-mode classifier (and a local HTTP ctl server too); write a one-shot Playwright script in scratchpad instead (npm pack the import-map packages, executablePath /opt/pw-browsers/chromium). HUD needs markDirty(); renderIfDirty() after state edits.
Related: [[matchup-wipeout-vs-keys-20261023]] [[hands-on-playtest]]
