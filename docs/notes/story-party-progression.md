# Notes: story-party-progression

Moved verbatim from CLAUDE.md on 2026-09-24 (sections in original order). Tutorial, party, bag, levels/XP, intake, debrief, capture.
Append new notes for this system at the end of this file.

## THE TUTORIAL — ORIENTATION, DAY 1 (HQ plan 4.3) — shipped 2026-09-13
Main menu → **Tutorial** (`_goToTutorial`, index.html `.mm-btn-tutorial`)
→ `#tutorialPage` THE SHELF (map.js `_renderTutorialPage`): the ORIENTATION
TAPE, three CORE tapes (1 FIRST STEPS · 2 THE PRESS · 3 THE THREE WAYS OUT)
and six OPTIONAL ones (high ground · fog · facing/overwatch · abilities/MP ·
items · the HUD tour), each stamped FILED off `profile.door.tutorial`
(data.js `tutorialProgress` / `tutorialMarkDone`). Completely optional,
unscored, nothing recorded. In the building the RANGE console (Room 64)
offers the same (`data-tutorial="tape"` → the tape + lesson 1, returning to
the console; `_goToTutorial` → the shelf). **CONTENT = data.js** (the block
after `DOOR_TEXT`): `TUTORIAL_TAPE` (the beats; `draft: true` — the
narration is Claude's DRAFT for the user to rewrite, A11/A15),
`TUTORIAL_LESSONS` (board · order · steps: `say` / `hint` / `focus` /
`allow` / `goal` / `cpu` / `enter` / `auto` — the header comment is the
schema), `TUTORIAL_MECHANICS` (THE DRIFT REGISTER, below), `tutorialFacts`
(the `{{numbers}}` in every copy string, read LIVE from the engine through
ui.js `_tutEngineFacts`, else from the pins). **RUNTIME = ui.js "THE
TUTORIAL RUNTIME"**: a lesson is a REAL VS-CPU match on `prebuilt_training`
(the spell lab's recipe: `applyGameMode` + pinned partyBuilds / partyMeta
`customSpells` + `applyPartyBuild(false)` + `startMatch()`; intro cine off;
no party builder, no match select), the dummies are CTRL.AI units whose
activation runs `_tutCpuTurn` (hold / approach / attack / guard / pass)
instead of aiTakeTurn, the player's verbs are gated by the step's `allow`
(`_tutActionAllowed` at doMove / doAttack / doSpell / doItem / doInspect /
doGuard / triggerEndTurn / channelNexus / chooseActionMenu; hud.js
`_tutFilterBlades` greys the ladder LATER and `b.tut` glows the taught
verb), the engine reports through `_tutEvent` (activation · move · attack
· press · spell · item · inspect · guard · endTurn · channel · entropy ·
cube), a 200 ms poll judges `goal` (`_tutGoalMet`), THE COACH (`#tutCoach`,
styles-base.css "THE COACH", `.tut-glow` = the pointer) says the step, the
lesson's `order` is the initiative (state.js `buildBlitzTurnOrder` →
`_tutTurnOrder`), `checkWin` / `checkWinConditionOnly` never end a lesson,
leaving = `backToMainMenu()` → `window._tutReturnPage` (map.js
`_hqReturnOrMenu`) or the console. **THE TAPE** = ui.js `doorTapePlay()`
(`#doorTape`, styles-cinematic.css "THE ORIENTATION TAPE": the ident kit's
power-on / tracking bar / OSD round drawn SVG slides `_TAPE_ART`, a typed
caption, SPACE next / ESC skip / reduced-motion). Dev: `Tutorial.start(id)`
· `Tutorial.skipStep()` · `Tutorial.state()` · `doorTapePlay()`.
**THE RULE — a mechanic change must flag its tape.** `TUTORIAL_MECHANICS`
names, per mechanic, the numbers the copy states (`pins`: name · file ·
value, read from SOURCE by `check-tutorial-drift.js` / load-data
`extractConst`) and the rule functions the lesson describes (`watch`: file ·
fn · `hash` = sha1 of the whitespace-collapsed body). `npm test`
(tutorial.test.js) FAILS on any drift, naming the lesson. When you change a
pinned constant, a watched function, the type wheel or the arena row: RE-READ
the named lesson (copy, steps, board), fix it, then update the pin's value /
`node check-tutorial-drift.js --stamp`. Adding a lesson = a `TUTORIAL_LESSONS`
row + its mechanics in the register (`teaches` ↔ `lessons` must agree — the
test checks). Never edit a hash without re-reading the lesson. Viewer-local,
VS-CPU only (RULE #2 has nothing to relay). UNSEEN LIVE (RULE #1c): the
coach's placement over the HUD, the tape's timing, the dummies' pacing.

## THE FINDS + THE TAPES (HQ plan 9.1 stage 1) — 2026-09-15 rev 12, local delivery
Glowing objects the walker TAKES, and THE HUNDRED TAPES. **Data (data.js,
the block after `hqCaveFitRooms()`)**: `HQ_TAPE_SHEET` → **`DOOR_TAPES`**
(T001…T100 — two per built site in `siteRooms.built` order, one per
complex part, one per exploration-floor room; NEVER the hall, the foyer, a
lobby or a corridor; `where` = the room, `site` for the hint rule, `clip:
null` until the user's file is on R2 `Assets/door/tapes/` — `hqTapeClipUrl`
never invents a path; titles + captions are Claude's DRAFT, `draft: true`,
A15). **`DOOR_HQ.finds` is GENERATED** by `hqBuildFinds()` — never
hand-edit a row: per tape room a `tape:Tnnn` row + ONE `pay:<room>` row
(`daily: true`; `HQ_FIND_RULES.pay` 30 on a board room's walkway,
`payDeep` 45 elsewhere). Spots: `hqFindSpot(roomId, salt, avoid)` = the
free 0.5 m grid point FARTHEST from the way in (`hqFindFree`: inside the
walls, off every floor prop's footprint, native / agent / counter reach /
door landing / spawn / mast, a walkable cell the first door reaches in a
cave, off the board + moat on a board room; `HQ_FIND_RELAX` loosens twice
for a small room); a site's SECOND tape is ON THE BOARD
(`hqFindBoardSpot`: a wall cell two levels up → **`hard: true`** — the
walker never reaches it, 9.5's door gun will; else a climbed cell; `cell`
+ `y` = the cell top); **`DOOR_HQ.findSpots[roomId] = { tape, tape2,
pay }`** pins a spot by hand (the cold room; a `y` = a shelf). RESERVED
kinds `potion` / `item` / `cube` are refused by the collector until an
inventory owner exists — never fake a reward. **Rules**: `hqFindsInRoom
(roomId, profile, now)` (the taken and the dark dailies removed;
`hqFindLiveToday` = `hqHash(date|id) % dailyMod === 0`),
**`hqCollectFind(profile, id, now)`** writes the claim AND the pay into
the profile OBJECT handed in (`door.hq.finds = { taken: { id: true |
date }, tapes, pay }`, `account.gold += amount`) and returns the beat —
THE CALLER SAVES ONCE (map.js `_hqTakeFind`: load → collect →
`saveProfile` → `_refreshWallets`; never `creditLocalGold` inside the
take — one transaction), `hqTapeCount`, `hqTapeShelf` (found / `hint` =
another tape of the same SITE is on file / room / clip). **Renderer
(three-renderer.js)**: procs `find_tape` / `find_pay` / `tape_shelf`;
`_hqPlaceFinds(room)` after the props → each row under `_hqFindSparkle`
(ring + core + six motes on a ticker + a point light, `HQ_FIND_LIGHT_MAX`
4), a walkway row nudged by `_hqSettingFreeSpot`, a board row on its cell
top, a cave row on `_hqCaveTop`; `_hq.finds`; `_hqFindTarget` offers kind
**`find`** within `HQ_FIND_REACH` 1.6 m and |Δy| ≤ 1.8; `hq.takeFind(id)`
drops it with a burst, no rebuild; `hq.finds()` lists them. Dev
`EW_HQ_FINDS_ALL` / `EW_HQ_NO_FINDS`. **Flow (map.js)**: `_hqInteractTarget`
→ `window._hqTakeFind(t)` (no panel), the prompt verb TAKE, `_hqToast`
(`#hqToast`, index.html / styles-base.css), the strip pill `#hqTapes`
(`_hqOpenTapes`), the OFFICER sheet's THE TAPES row. **THE SHELF** = Room
360's counter `shelf` (east wall; the south `metal_shelving` became the
`tape_shelf` prop) → `overlay: 'tapes'` → `_hqTapesHtml` (the CRT set: a
found tape's clip as `<img>` / `<video loop muted>`, a blank cassette =
STATIC, the 10 × 10 spines, `[data-tape]` re-renders the panel in place,
`_hqTapeSel`). ONE home (hq-floors.test.js). Viewer-local (RULE #2).
`npm test` runs `hq-finds.test.js`. Adding a tape = a `HQ_TAPE_SHEET` row
(the count must stay 100 — the test insists); adding a find kind = the
collector's branch + a proc + `HQ_FIND_COLORS`. Unseen live (RULE #1c).

## THE PROMOTION LADDER + THE STABILIZATION CHECKLIST + the door gun standard issue — 2026-09-15 rev 15, local delivery
**Why nobody ranked up**: `door.clearance` was only ever written by the dev
hook `window._doorPromote(n)` (the story track that was to promote never
landed), so every officer stayed L1 DOORMAT and every `minClearance` gate
(the rank leaves, the penthouse, the Bureau, the garden, 4B) was dead.
Clearance is FIELD WORK now: data.js **`HQ_PROMOTION`** (right before
`doorClearance`) = per rung `{ level, stabilized, keys }` (L2 1 site · L3
3 + 12 Keys · L4 6 + 24 · L5 12 + 48 · L6 20 + 96 — tune the table, nothing
else); **`hqFieldClearance(profile)`** = the highest rung met by
`hqMasteryCount(profile).mastered` + `hqKeys(profile).keys`;
**`doorClearance`** reads the HIGHER of the story number and the field
rung (a chapter can promote early, the field never demotes; the building's
ceremony `_hqCheckPromotion` fires on its own when it climbs);
**`hqRankProgress(profile)`** = the ONE "how do I rank up" read (`level,
title, stabilized, total, keys, next { level, title, stabilized, keys },
missing [{ what, need, have, short }], met, rows, note`). **THE
STABILIZATION CHECKLIST**: **`hqSiteChecklist(mapId, profile, { modes })`**
(data.js, after `hqSiteMastery`; `HQ_MASTERY_HOW` = the copy) = per
`masteryConditions` row `{ cond, label, name, done, how, modes }` — the
modes come from `MULTIPLAYER_MODES.winConditions` (Wipeout: Arena · TDM ·
Simul · Clash · Gauntlet; the Cube and the Keys: Arena only; the dungeon
never), the Keys row states `keysToWin` of `keySpawnCount`; a Δ id resolves
to its site. Readers: match-select.js `SiteChecks` (`.ms-tty-checks`, on
EVERY variant now, the officer's next rung under it), map.js
`_hqChecklistHtml(id, profile)` inside `_hqThresholdPanelHtml` — so the
hall's threshold door, the CROSSING console and the BATTLE marker all show
it — the pause menu's OFFICER row (the next rung) and `_hqGateText` (a red
lamp says what L-n costs and what you have). **THE DOOR GUN IS STANDARD
ISSUE** (the user's call, for the test): `HQ_PORTAL_RULES.free: true` (cost
0, rank 1) → `hqPortalStatus(...).issued` for everyone; `free: false, cost:
24, rank: 4` brings the Quartermaster's signature back (KEYHOLDER is L4 —
the old `rank: 2` was DOORSTOP). `npm test` runs `rank-ladder.test.js`.
Unseen live (RULE #1c): the checklist's grid on the CRT at narrow widths,
the promotion notice firing on the first arrival for a profile that
already has stabilized sites.

## THE PARTY — TWO SHIFTS, THE HEALTH THAT CARRIES, FIELD MEDICINE (the JRPG party, 2026-09-19, local delivery)
The user: "a party like a standard JRPG — the units you have unlocked are on call / off duty; four including yourself on
FIRST SHIFT (sent out first), four more on SECOND SHIFT (switching in and out during battle), eight in all; encounters in the
explorable areas do not respawn; health carries over between encounters; heal the party from the pause menu with their heal
spells; no levels / XP yet." **THE RECORD** (data.js "THE PARTY", the block after `hqEncounterWakeRoom`; `HQ_PARTY_RULES` =
the numbers: `roster` 8 = RESERVE_RULES.roster, `shift` 4 = RESERVE_RULES.deploy, `lossRestore`, `restRoom` / `restCounter`,
`healKinds`, `itemKinds`, `officerRace`): `door.hq.party = { v, at, seq, members }` — **THE ORDER IS THE SHIFT**
(members[0..3] FIRST SHIFT = the board, [4..7] SECOND SHIFT = the bench), member 0 is THE OFFICER (`you: true`: the mirror's
look → a Homosapien in the creator's clothes, the barbershop's race pick, else the DOOR Agent; never relieved, never moved),
a member `{ id, cls, name, meta { race, gender, secondaryJob?, customSpells?, zodiac?, appearance? }, loadout, hp, hpMax,
mp, mpMax }` with **`hp === null` = FULL and `hp === 0` = DOWN** (a KO stays down until a revive or the ward). LOCAL like the
punch clock (nothing on `state`, nothing relayed — RULE #2). Reads: `hqPartyRecord` / `hqPartyShifts` / `hqPartyVitals(m,
unit)` / `hqPartyFit` (`ready` = anyone fit) / `hqPartyOnCall` (the unlocked not on the books; `hqPartyUnlocked` = the
account's `unlockedUnits`, the starters offline, the 3D-only rule, `_DEV_UNLOCK_ALL`). Writes (pure over the profile handed
in — THE CALLER SAVES ONCE, map.js `_hqPartyTx`): `hqPartyEnsure(profile, { last })` (THE SEED: the officer + the last
roster one vessel per race, else the officer + three starters), `hqPartyEnlist(profile, { race, gender, cls })` (the first
free slot; one vessel per race; `full` / `dup` / `locked`), `hqPartyRelieve`, `hqPartySwap(profile, a, b|index)` (a shift
change is a swap across the line; an empty slot = to the end of the order; slot 1 refuses), `hqPartyRestore` (THE COT),
`hqPartyAfterMatch(profile, { won, units: [{ partyId, hp, maxHp, mp, maxMp, dead }] })` (THE COMMIT: a dead body is DOWN; a
loss with `lossRestore` wakes the party treated). **THE LAUNCH**: `hqPartyForLaunch(profile)` = the fit of the first shift,
then the fit of the second (a downed member stays home, the bench steps up), each member's vitals + id on its identity
(`meta.hp / hpMax / mp / mpMax / partyId`) — map.js `_hqPartyLaunch()` is `_hqEncounterStart`'s party source (the last
roster stands in only without a profile), `_hqEncounterFire` refuses a strike when nobody is fit (THE PARTY IS DOWN toast);
`_msConfirm` peeks the party BEFORE the reserves block: a party encounter is a RESERVES match (`state.reserves`, roster 8 /
deploy 4, the Gauntlet plumbing) with **`state.noRespawns = true`** (map.js `defeatUnit` sets `_respawnIn = null`; a fallen
seat is filled the Gauntlet way — the replacement modal / the AI's healthiest — `_gauntletQueueReplacement`'s gate reads
`state.noRespawns && _benchOn()`; reset beside `state.reserves` at every site), the enemy is the native's group at the
encounter's team size (P2 truncated after the draw), and the human seat is EXACTLY its members (`party.exact` — never padded;
`window._ewPartySlots` caps `repairPartyBuilderState`'s pad for that build only). map.js `createUnit` reads
`identityOverride.hp / hpMax / mp / mpMax` LAST (after the gear tops the max off), scaled to the build's own max, never under
1; state.js `repairPartyBuilderState`'s whitelist keeps `partyId` + the four. battle.js's commit gathers the human seat's
bodies (`state.units` + `state.bench[seat]`), maps each unit's index to `state.partyMeta[seat][i].partyId` and calls
`hqPartyAfterMatch`; the result carries `party` (the return toast reads it: n DOWN / THE PARTY WAS TREATED). TDM's
`wipeout` win condition ends a no-respawn fight; the round cap still decides by kills. **THE PAUSE MENU · PARTY** (map.js
`_hqPausePartyHtml` / `_hqPauseMemberHtml` / `_hqPartyAct`; `_hqPause.member` is a member ID now, `arm` = the armed action,
`msg` = the one-render result line — the HQ toast sits UNDER the pause overlay): FIRST SHIFT · SECOND SHIFT as four-slot
grids (a card wears HP / MP bars off `hqPartyVitals`, a DOWN stamp, YOU), ON CALL with ENLIST ♂ / ♀, the member sheet's DUTY
row (⇄ SWAP SLOT arms a swap — pick a card / TO THE END OF THE ORDER; RELIEVE OF DUTY), **FIELD MEDICINE**: USE on a heal /
healAll / selfHeal / revive row (`hqPartyFieldSpells`; `hqPartyFieldTargets` = the rule; `hqPartyCast(profile, units,
casterId, spellId, targetId)` — the battle's own arithmetic without the board: `(base + healBonus) × supportScale(the
recipient's level)`, the low-HP rider, `selfHealPct` / `revivePct`; the caster's OWN MP) and USE on a potion chip
(`hqPartyUseItem`: healPct / mpPct of the target's max, one fewer in the owner's pocket). **THE COT** (Medical, counter `cot`,
a by-id panel → `[data-party-rest]` → `window._hqPartyRest` → `hqPartyRestore`): the free inn. The console's crossings keep
THE LAST ROSTER (the forge); the party is the encounters'. `npm test` runs `hq-party.test.js`; hq-encounter.test.js's two
result-literal pins read `party: partyRes`. NOT built: levels / XP (the user's call), a synced party (D5-style union), the
party in the forge / a console crossing, gear or spell editing from the sheet (the forge still owns loadouts), a flee verb.
UNSEEN LIVE (RULE #1c): the two grids at the pause frame's width, the armed card's glow, the replacement modal firing in a
no-respawn TDM, the enemy's size against a five-man launch, the carried HP on the first frame, the cot's panel.

## THE PARTY'S QUICK ACTIONS + THE BAG + THE DISPENSARY + AUTO HEAL (the JRPG inventory, 2026-09-20, local delivery)
The user: "quick actions on the party in the pause menu — click on them and swap / relieve / use any heal
spells they have; an auto heal button that uses any existing potions or MP and spells; an inventory to
collect potions and stuff; a room that is a shop that sells potions; heal in the medical bay." **THE BAG**
(data.js, the block after `hqPartyFieldItems`; `door.hq.bag = { items: { key: n }, at }`, LOCAL like the
party — RULE #2): `hqBagRecord / hqBagCount / hqBagAdd (capped at HQ_PARTY_RULES.bagStack 20) / hqBagTake /
hqBagList / hqBagTotal`. Things go IN three ways: every PAY CACHE drops ONE potion beside the Hazard Pay
(`HQ_FIND_RULES.potionDrop` weights, seeded by the day + the row; `hqCollectFind` returns `potion` and the
toast names it), a find row of kind `potion` / `item` with an `item` key goes straight in (the collector no
longer refuses the kind — a row WITHOUT `item` still reads `unsupported`), and THE DISPENSARY sells them.
Things go OUT two ways: a FIELD USE (`hqPartyUseItem(profile, units, 'bag', key, targetId)` — the bag is an
owner beside a member's pockets) and **THE POCKETS**: `hqPartyStock(profile)` tops every FIT member's battle
pockets up to `HQ_PARTY_RULES.pocket` (2 heal · 1 mana) from the bag — map.js `_hqPartyLaunch` runs it in a
transaction before every encounter and the pause menu's RESTOCK POCKETS button runs it by hand; the commit
(battle.js, the vit rows carry `items`) writes each unit's battle items back onto its member, so what a fight
spent stays spent. **TWO FIELD-ONLY ITEMS** in ITEM_RULES / ITEM_META: `reviveTonic` (a down member up at
half) and `elixir` (full HP + MP, wakes the down) wear `fieldOnly: true` — `normalizeLoadoutForClass` (battle.js
AND state.js) caps a field-only key to 0, `hqPartyForLaunch` strips them from the pockets, the forge's item
picker (party-builder.js `allItemKeys`) never offers them; `HQ_PARTY_RULES.itemKinds` lists all four.
**THE DISPENSARY** = `DOOR_HQ.rooms.dispensary` · ROOM 911, a box room off THE MEDICAL WING's north wall at
x 2.2 (`leaf_hospital`; hq-suites' SUITES table lists it): counter `pharmacy` → `overlay: 'pharmacy'` → map.js
`_hqPharmacyHtml` (THE HATCH: `HQ_DISPENSARY.stock` at each row's `shopPrice`, BUY 1 / BUY 5, SELL 1 at
`sellBack` 0.5; re-renders in place), counter `bag` = a by-id panel. THE GOLD: `hqShopQuote` (a read) → profile.js
**`ProfileSystem.spendGold(amount, reason)`** (the server's wallet through the NEW server.js
`POST /api/economy/spend` — an atomic `gold >= amount` debit, a NEGATIVE amount is a refund capped by
`SPEND_REFUND_CAP`; no token → `localSpendGold` on the mirror) → `hqShopBuyApply` puts the goods in the bag
ONLY after the wallet answered; a sell is `hqShopSell` then a negative spend. RULE: never touch `account.gold`
for goods except through spendGold (a local write is overwritten by the next server sync). **AUTO HEAL** =
`hqPartyAutoHeal(profile, units)`, a greedy planner over the two verbs (`hqPartyCast` / `hqPartyUseItem` — the
arithmetic is one): the DOWN first (a revive spell from the fit caster with the cheapest cost, then a Revival
Tonic, then an Elixir; none → a `skip` step naming them), then the HURT lowest-first (a healAll when two or
more are hurt, the single heal from the caster with the most MP, the member's own selfHeal, a Healing Potion
from the bag then from anyone's pockets, a Mana Potion on a dry caster ONLY when a heal is wanted and nobody
can pay, an Elixir last), `autoHeal.maxSteps` 64; returns `{ steps, before, after, healed, revived, still, did,
note }`. **THE PAUSE MENU** (map.js): every party CARD is a `<div role="button">` now and wears a QUICK STRIP
(`_hqPauseCardQuickHtml`: ⇄ SWAP · RELIEVE · one ♥ button per heal spell the member can cast here (a
single-target heal arms the pick, healAll / self cast at once) · their pocket potions and the bag's potions
used ON THAT MEMBER at once (`itemon:<owner>:<key>:<target>`) · SHEET ▸); THE QUICK BAR over the shifts
(`_hqPauseQuickBarHtml`: ♥ AUTO HEAL · 🎒 RESTOCK POCKETS · THE BAG · 🛏 THE COT · 🧪 THE DISPENSARY — a
`data-pause-room` button drops the menu and walks you there through `_hqDoAction`); the new command **ITEMS**
(`_hqPauseBagHtml`: the bag's rows with USE ▸ = `bag:<key>` arms a target pick on the party sheet, THE
POCKETS per member, the same bar). THE COT (Medical 1111) is unchanged — the free inn. CSS at the END of
styles-base.css ("THE PARTY'S QUICK ACTIONS"). `npm test` runs hq-party.test.js (14). NOT built: a synced bag
(the party is local too), the bag in a console crossing (the forge still owns loadouts), a shop for gear,
selling from the pause menu (the hatch only). UNSEEN LIVE (RULE #1c): the quick strip's wrap on a 300 px
card, the ITEMS sheet, the hatch's rows, the pharmacist's chair behind the counter, the wallet round-trip on
a server account.

## THE EARNED DOORS + THE ROSTER LOCK (2026-09-20, local delivery)
The user: "get rid of any doors in DOOR HQ that lead straight to battle sites — the only
exception is Room 64; the player must explore and discover the sites by natural means, and only
once they have cleared the site (all 3 win conditions) does the area stabilize and Otto builds a
door to it; lock all the units except online PvP (the whole roster) and VS CPU (testing) —
otherwise only what you unlocked through Hazard Pay or a ticket." **THE EARNED DOORS** (data.js,
the block before `hqMissionPool`): a BAY THRESHOLD (`action.mission`) is EARNED only for a
STABILIZED site — `hqSiteEarned(mapId, profile)` (the free list `HQ_EARNED_DOOR_RULES.free` =
`prebuilt_training`; dev `?alldoors` / `EW_HQ_ALL_DOORS`; else `hqMapMastered`) is the ONE read;
`hqApplyEarnedDoors(profile)` stamps `hidden` on every threshold row (map.js `_hqEnter` runs it
on EVERY entry before the room builds; three-renderer.js `_hqBuildDoors` builds NOTHING for a
hidden door — no frame, no plate, no record, so the scan / the walk-in / the rounds never see
it; the run of wall is blank). The map treats an unearned threshold as a SECRET edge
(`hqWorldGraph` edges carry `mission`, `hqMapGraph` edges `threshold`; `hqMapModel` /
`hqWorldOverview` pose no `?` through it — a site behind a facility SEAM (the mirror, the
natatorium, the screen, H-Wing) is still posed: that IS the exploration). The star chart's stars
wear `chart: earned | charted | uncharted` (`hqSiteSeen` = a room of the site stood in): an
uncharted star is a nameless dot, a charted one is named with its checklist and no POINT, only an
earned one opens its door (`_hqOpenThreshold` refuses the rest). The bay door's panel in the hall
lists EARNED thresholds only (+ a count of the unbuilt); `_hqThresholdPanelHtml` reads `earnedDoor`
(the CROSSING console / the crossing panel pass `inSite: true`); **`_hqLaunchMission` refuses a
wild site unless you stand IN it** (`_hqRoom().site` — the BATTLE marker / the console are the
natural way to file the three wins) or `o.variant === 'full'` (Room 64's RANGE console = every
site, the exception); DISPATCH's desk passes `pre.allow` (earned sites + the range's boards) and
match-select.js's card filter / initial pick honour it. **OTTO BUILDS A DOOR**: map.js
`_hqCheckEarnedDoors` after the promotion check — `hqEarnedDoorsNew(profile)` (stabilized, not
yet in `door.hq.earned`) → `hqEarnedDoorsStamp` (ONE write, the caller saves) → the PA chime + a
toast per site naming its bay. **THE ROSTER LOCK**: `ACCT_STARTER_UNITS` is `door agent` +
`homosapien` + the user's three free hires `catgirl` · `bigfoot` · `honda civic` on BOTH sides (server.js unions starters into an account on login and never
removes — an account that already holds the old all-3D roster keeps it until its `unlockedUnits`
row is reset); `unitRosterScope()` = `'all'` for `_DEV_UNLOCK_ALL`, an online seat
(`isOnlineMatch` / `_NET.online`) or `window._ewRosterScope === 'all'` (set by `_goToVsCpu`,
`_goToQuickPlay`, `_goToFriendlyMatch`, the RANGE console's `scope: 'all'`), else `'owned'`
(`_hqEnter`, `_hqLaunchMission`, the desk); `isUnitOwned(race)` = the LEDGER (never the scope —
the shop + the codex read it); `isUnitUnlocked(race)` = 3D-ready AND (scope all OR owned). THE
PARTY's seed fills from what the account owns (the five starters fill the first shift).
`npm test` runs `earned-doors.test.js`; champ-rework / hq-party amended. Ship data.js to R2 AND
Render (server.js reads it). UNSEEN LIVE (RULE #1c): the blank runs of ring wall, the ceremony's
toasts, the chart's dots, the desk's shortened deck, the forge's 🔒 wall in the building.

## THE OWNED SEED + THE MARKER'S FIGHT + THE DEFEATED LEDGER + THE HEALING ZONES (2026-09-20, local delivery)
The user's four. **THE OWNED SEED**: data.js `hqPartyEnsure` seeds the party from what the account OWNS — a last-roster
member joins only when `hqPartyUnlocked` names its race (a VS-CPU test roster is scope 'all': its martian / knight were
leaking in), the starters + the owned fill the first shift when the roster gave nothing; **`hqPartyPrune(profile)`**
relieves a stranger already on the books (never the officer) and every `hqPartyEnsure` on an existing record runs it.
**THE MARKER'S FIGHT**: E on the floating crystal (`proc: 'battle_marker'`) opens ITS OWN panel (map.js `_hqMarkerHtml`:
the party's vitals, the site's natives, the checklist, ⚔ FIGHT ▸ WIPEOUT · TDM / ⬡ FIGHT ▸ THE CUBE · THE KEYS · ARENA —
the two modes the three win conditions need) → `window._hqMarkerFight(gm)` → data.js **`hqMarkerLaunch(roomId, cfg,
{ gm, codeRed })`** (the encounter's launch shape, the first native as the lead, `doorId: 'battle'` so the return lands at
the marker) → `_hqEncounterStart(L, null, null)`: the officer's PARTY seated, no terminal, no builder, no roster wall.
`_hqInteractTarget` routes the marker BEFORE the console branch (doorhq's pins on that branch hold); the CROSSING console
and DISPATCH still open the terminal. **THE DEFEATED LEDGER** (the user: "a unit shouldn't become available for purchase
until the player has defeated one in battle"): `{ '<race>': 'YYYY-MM-DD' }` in TWO places like the cleared rooms —
`door.hq.defeated` + the SYNCED `progress.hq.defeated` (`mergeProgressBlobs`, the EARLIER day wins, `ACH_MERGE_CAPS.
defeated` 256; `hqDoorSyncFold` folds; **ship data.js to Render — the server merges off it**); `hqDefeatedMark(profile,
races, date)` is the ONE write — battle.js's commit marks every ENEMY body that DIED in a standard match (VS-CPU, online,
the areas; win or lose; `unitHomePlayer` ≠ the viewer) and schedules the push; `hqDefeatedRecord` / `hqUnitDefeated` /
**`hqUnitBuyable(profile, race)`** (a starter or an owned vessel always; else defeated; `_DEV_UNLOCK_ALL` opens all) are
the reads. The shop (ui.js `_shopLockReason` → 'model' | 'defeat' | null; `_shopBuyable` = no reason; the card / hero /
action bar say DEFEAT ONE FIRST), the local mirror (profile.js `localPurchaseUnit`) and server.js `/api/economy/purchase`
(a non-starter needs `player_progress.data.hq.defeated[raceKey]` — 403 "defeat one in battle first") all refuse an unmet
vessel. **THE HEALING ZONES**: data.js `HQ_HEAL_ZONE` + `hqHealZoneRooms()` / `hqBuildHealZones()` (run at load after the
areas + the entries) put ONE counter `healzone` (`proc: 'heal_zone'`, verb REST, `action: {}`, `hub`) in every
`DOOR_HQ.hubs` anchor room — 2.8 m BESIDE the room's BATTLE marker where it has one, else 2.2 m in front of the spawn on
its pad; `HQ_HEAL_ZONE.rooms` overrides three (the HQ hub's in THE FOURIER FOYER at x −3.3 — the hall is polar; the city's
west of the plaza's marker — east was the fountain; the deep's at the slope's foot) — all eleven measured on the compiled
field: reachable from the spawn, dry, flat (a scratch probe; the compile is 1–26 s a room). The
panel is THE COT's (map.js `if (c.id === 'cot' || c.id === 'healzone')` → `[data-party-rest]` → `hqPartyRestore`: HP / MP
full, the down back up, free); three-renderer.js `_hqBuildHealZone` = a green floor ring + a column + a turning cross of
light + a point light (the marker's `{ icon, ring2, y }` record so the marker ticker turns it; no blocker — walked onto).
Adding a hub = its zone appears; a hub whose anchor is no place for it = a `HQ_HEAL_ZONE.rooms` row. `npm test` runs
`party-hubs.test.js`; hq-party / achievements amended. PRE-EXISTING at HEAD, not touched: doorhq 84 / 85, hq-astral 6,
hq-deep 15, hq-dumb 18, hq-floor-plan 29, hq-terrain 38 (the fountain). UNSEEN LIVE (RULE #1c): the green ring on each
hub's ground (a spot that lands on a slope or in the water is a `HQ_HEAL_ZONE.rooms` row edit), the marker panel's two
buttons, the shop's DEFEAT ONE FIRST tags, the 403 on a server account before the first sync lands.

## THE DEBRIEF — the result screen rebuilt: the party posed in 3D, one layout, three sheets (2026-09-21, local delivery)
The user: "a classic JRPG victory / defeat screen with the party flexing on the map; achievements and
rewards overlap, it's a mess — visual weight, AAA UX". **THE STAGE** (battle.js `_stageVictoryPodium`):
the VIEWER'S party (never the winner's — a defeat used to show the enemy flexing) teleported into a
chevron at board centre, the lead one row toward the camera; on a WIN each unit plays a one-shot then
HOLDS a loop, on a LOSS the survivors kneel / shake their heads / sit and the fallen are re-spawned
holding their own `death` clip (they lie back down). **THE POSES** = sprites.js `PODIUM_POSES` (`vicCheer`
UAL2 Yes · `vicDance` UAL1 Dance_Loop · `vicArms` Idle_FoldArms · `vicStance` Idle_10 · `vicJump`
Regular_Jump · `defKneel` Crouch_Idle · `defNo` Idle_No · `defSit` Sitting_Idle; neither library has a
named victory clip) baked ON DEMAND by three-renderer.js `_podiumBakePoses` (the same retarget as the
load-time bake, cached per model — NEVER a `UAL_SLOTS` row: that bakes on every rig at load) through
**`ThreeRenderer.podium`** `{ bakePoses, hold, release, has, play(uid, slots, maxMs) }`; a HELD pose
(`entry._ew_hold`) plays under the one-shots in the clip picker; `_maybeStartModelAnim` takes `maxMs`
(the board's 1400 ms cap stays its default). The camera frames the lineup in the LEFT two thirds (the
target sits `offX` east of the party; a loss looks down at tilt 52); `_teardownVictoryPodium` releases
every hold and restores every field. **THE LAYOUT** (index.html `#resultOverlay`, styles-cinematic.css
"THE DEBRIEF" — the file's first block, replaced whole): `.vic-stage` (left; THE HEAD = `#vicKicker`
match · mode · site, the title, `#vicSubtitle`, `#vicMatchInfo` as fact pills, `#vicFieldReport` = what
the crossing filed — `_stampHqSite` RETURNS its line now and the stamp's own tag is hidden; THE PLATES at
the foot = `#vicMvpTag` + the CASE CLOSED stamp in flow), **`.vic-debrief`** (right, `--vic-panel-w`; the
HUD's `--ew-*` tokens; three sheets behind tabs — REWARDS `#vicGoldBreakdown` (the pay as a LEDGER, the
total counts up at 1.5 s) · `#vicEloBadge` · `#vicAwards` (unlocked · records · almost there · career);
HONOURS `#vicHonours` (`_vicBuildHonours`: the MVP card + `buildVicAwards` rows); PERFORMANCE the team
damage split · `#vicModeTally` (`_vicBuildModeTally`: Arena's columns, the kill / point / capture line) ·
the stats table), `.vic-bottom` (the bar; ids unchanged — ui.js / online.js / map.js wire them). A tab
with an empty sheet is not offered (`_vicLayoutSync`, `_vicSetTab`, ← → / [ ] step them; `_vicPrepare`
empties every sheet first). The campaign and dungeon result cards write the same ids and call
`_vicPrepare` / `_vicLayoutSync` — a new result path must too. Under 900 px the panel is the lower half.
Everything is viewer-local (RULE #2: the match is over; both seats stage their own party). UNSEEN LIVE
(RULE #1c): all of it — the poses on the cast / Meshy rigs (`PODIUM_POSES` ts is the edit), the cheer
→ dance hand-off, the corpses' fall on a loss, the framing offset (`offX` in `_stageVictoryPodium`),
the panel's width against the stage, the pay count-up's timing, the stamp's size at the foot.

## THE THREE DOORS — PLAY = STORY · ONLINE · PRACTICE + THE SUPPLIES SHELF (2026-09-21, local delivery)
The user: "separate online and story mode — Play leads to story mode (D.O.O.R. HQ); Online PvP from the
main menu; a new Practice mode = VS CPU on Arena and Team Deathmatch; Online and Practice have every
champ unlocked, story mode only what you have unlocked; add Revive as an item in the shop in story
mode." index.html's main menu wears three doors: **PLAY** (`_goToPlayHub` → the building, scope
`owned` as before), **ONLINE** (map.js `_goToOnline` → the old play hub page, retitled ONLINE, Quick
Play + Friendly Match, scope `all`; its VS CPU row shows only on the classic `?nohq` route, where Play
still falls back to it — `_showPlayHubPage({ classic })` is the ONE writer of the page's title / row)
and **PRACTICE** (`_goToPractice` → the classic desk with `_hqPreselect = { practice: true, modes:
PRACTICE_MODES }`, scope `all`, no pool / Code Red / site pin; BACK and the result return to the MAIN
MENU — `_msBack` reads `practice`). match-select.js: a FULL desk honours **`pre.modes`** (the list stays
whole — `_msSelectedGM` indexes MS_GAME_MODES — the rows, the first pick, `selectMode` and RANDOMIZE read
`modeOk`); `pre.practice` labels the head PRACTICE TERMINAL and drops the DISPATCHED line. **THE SUPPLIES
SHELF**: the Quartermaster's shop (ui.js `_renderShop` → `_shopSuppliesHtml`, `#shopSupplies` over the
featured strip) sells THE DISPENSARY's stock (data.js `HQ_DISPENSARY.stock`, the Revival Tonic FIRST —
`_SHOP_SUPPLY_FIRST`) through the hatch's own path (`window._shopBuySupply` → map.js `_hqShopBuy`;
`_hqShopTakeMsg` hands the hatch's verdict to the strip) into THE BAG; Room 911's hatch is unchanged
(it stocked the tonic already). CSS: styles-hud.css `.shop-supplies*`, styles-base.css the two menu
buttons. `npm test` 1816 / 0 / 67 skipped. UNSEEN LIVE (RULE #1c): the three buttons' fit in the
column, the ONLINE hub's title swap, the two-row mode list on the practice desk, the strip's width
over the vessel wall (a BUY on a server account round-trips the wallet). **rev 2 (same day)**: the SUPPLIES shelf shows only when the shop was entered
from the building (`_hqIsHome()` in `_shopSuppliesHtml`); the roster scope goes back to `owned` on
every way out of Online / Practice (`_playHubBack`, `_msBack`, `_hqReturnOrMenu`'s menu fallback —
the online hub itself keeps `all`), so the Party Builder / the Shop opened from the menu field what
you own. Token `20260921-threedoors-02-cors`.

## THE LEVELS — story mode starts at 5, the party's XP ledger, the adaptive enemy level, THE EXPERIENCE on the debrief, the group size (2026-09-21, local delivery)
The user: "re-examine the EXP curve, levelling and stats now that there is a story mode; start at level 5;
see the stats go up with a satisfying AAA-JRPG level-up sequence; a satisfying experience gain on the
victory screen; the NPCs' level as an adaptive range round the player's; attack one NPC and only 1–2
come with them, a roaming group is more." **THE CURVE stays** (data.js `XP_CURVE` → `xpThreshold(L)` =
round(12 × (L−1)^1.9), `xpLevelFor(xp)`, `xpToNext(xp)` = `{ lvl, into, need, left, pct, max }` — the ONE
read of a bar; battle.js's `XP_THRESHOLDS` is the same formula; measured: a level is 3–5 same-level kills
from 5 to 90, the pacing computeKillXP was tuned to). **THE ADDITIVE STATS ARE STRAIGHT** (`LEVEL_STAT_GAIN_EXP`
1.0 for atk / def / mdef / int in `levelStatGains` + `levelGrowthDeficit`; HP / MP keep `LEVEL_SCALE_EXP`) —
cosmetic in combat by construction (every formula reads `levelPowerStat` = the cap equivalent;
party-levels.test.js proves it at five levels) so a level-up card always shows a stat move. **THE LEDGER**
(data.js THE PARTY block, `HQ_LEVEL_RULES`): a member carries `xp` (cumulative) and `lvl` (= xpLevelFor,
derived on every `hqPartyNormMember`); a fresh member / the seed start at `start` 5, an ENLISTED vessel at
THE PARTY LEVEL (`hqPartyLevel` = the first shift's mean; `enlist: 'party'`); `hqPartyXp(m)` the read,
`hqPartyGrantXp(m, gain, base)` the ONE write (the beats back: before / after / `levels[{ lvl, stats,
milestone }]` via `hqPartyLevelGains`); `hqPartyForLaunch` puts **`meta.storyLevel`** on the identity →
map.js `createUnit`'s STORY-LEVEL branch (before the PvP cap; the campaign's recipe) builds the unit at it;
state.js's repair whitelist keeps it; the pause menu builds a member at its level and wears the LV chip +
an EXP bar on the card and `EXP · NEXT IN n` on the sheet. **THE ENEMY LEVEL** = `hqEncounterLevels(partyLevel,
site, n, seed)`: the party level + the site's `tierOffset` (EW_MAP_META tier 1 −1 · 2 +1 · 3 +3) or an
`HQ_AREA_LEVELS[site]` override (`offset` / `min` / `max` — the story's hook, only Room 64 today), the LEAD
jittered inside `lead` (−1…+3), the rest inside `band` (−3…+2), clamped to `maxBelow` 6 / `maxAbove` 8 of
the party level — the user's ±10 is `band`'s edit (1.08^10 = a 2.16× swing). `hqEncounterLaunch` /
`hqMarkerLaunch` take `opts.partyLevel` (map.js `_hqPartyLevelNow`) and return `levels` (the lead's first) +
`enemyTeam`; `_hqEncounterStart` rides them on the party (`enemyTeam` / `enemyLevels`) and `_msConfirm` writes
`storyLevel` on every native's identity. **THE GROUP** (`hqEncounterGroup`, seeded by the target): a lone
native brings `group.solo` 0–2 companions by `soloWeights`; a ROAMING GROUP — `hqRoomPopulation` binds
`roamSize` 2–3 of a wild room's extras when the seeded coin (`groupP`) says so (`draw[i].group`,
`pop.group`); three-renderer.js `_hqSpawnRounds` stands them at ONE stop on ONE loop seed (`ch.group`, the
sub ONE OF n · TOGETHER) and `_hqEncounterAim` reports the companions in the room (`target.group`) — fights
as its members (their own races / genders / names seat 2..k in state.js `optimizeRandomizeParty` off
`encounter.members`) + `roamExtra`. `L.teamSize` stays the OFFICER's deploy; never the enemy's. **THE FIGHT**:
battle.js `xpProgressionActive` honours `_encRun()`; in a party fight `grantXP` HOLDS the trickle on the
unit (`_xpHeld`) and never levels mid-battle — the kills float `+N XP` over the killer and are THE POOL:
`_encXpPool` = Σ `computeKillXP` over the natives that fell against a pseudo-killer at the party level; the
commit's vit rows carry `xpHeld · bench · baseHp · baseMp · unitId` and `hqPartyAfterMatch(p, { won, units,
xpPool })` shares the pool (`share`: the board 1 · the bench 0.5 · a member DOWN 0) + the held trickle,
moves the ledger and returns `xp` (the beats) / `pool` / `leveled` / `partyLevel`. **THE EXPERIENCE** (the
debrief, REWARDS sheet, first — index.html `#vicExperience`, battle.js `_vicBuildExperience` /
`_vicPlayExperience` / `_vicXpLevelBeat`, styles-cinematic.css "THE EXPERIENCE"): a row per member (the
portrait, the LV chip, +N XP, the bar of the current level), THE FILL plays the rows one after another —
the bar and the number climb, a crossed threshold BUMPS the chip, flashes LEVEL UP! across the row, plays
the levelUp cue, makes the 3D party member on the podium JUMP (`ThreeRenderer.podium.play`, vicJump over its
held pose) with `_vfxLevelUp` at its feet and lands that level's stat chips (HP +4 · ATK +1 …) + the
milestone line (SECONDARY JOB UNLOCKED at 15, THE SPELL SHOP OPENS at 10); DOWN = dim, NO SHARE; the bench
HALF SHARE; reduced motion = the end state. Viewer-local (RULE #2: VS-CPU). NOT touched: Online / Practice /
the console's crossings (no `storyLevel` → the cap as before), the marker's line (4, the checklist's fight),
XP-to-gold, a synced ledger (the party is local). `npm test` runs `party-levels.test.js`. UNSEEN LIVE (RULE
#1c): the fill's pace (`VIC_XP_ROW_MS`), the flash over a narrow panel, the jump on the cast rigs, a level-5
fight's numbers (57 HP), the group walking together, the tier offsets against real natives.

## THE INTAKE — a new profile creates its agent first; the officer is a FREELANCER D.O.O.R. AGENT; the sockets read the ledger; THE STORY LEVEL (2026-09-21, local delivery)
The user: "I started a new profile but it still starts me at level 100. Make the first thing you do when you start a new
profile is create a character — a Freelancer DOOR agent — but you can only learn spells of units you have unlocked in your
roster." **WHY 100**: THE LEVELS built the PARTY at 5 for an ENCOUNTER only; a crossing filed from the building's consoles /
DISPATCH / the RANGE went through `_msConfirm` → the forge → map.js `createUnit`'s CAP branch (PvP normalisation, 100 both
sides). **THE STORY LEVEL**: `state.storyLevel` (state.js literal; online.js skip list) is set by `_msConfirm` in STORY SCOPE
(`_hqHome` + `unitRosterScope() === 'owned'`) to THE PARTY LEVEL (`_hqPartyLevelNow`, 5 on a fresh profile) and to 0 at every
other launch reset beside `trainingMatch`; createUnit's cap branch reads it (`_storyLv || pvpNormalizedLevel`); an encounter's
own `meta.storyLevel` still wins (its branch is earlier). **THE INTAKE**: map.js `_goToPlayHub` → after the door beat, a profile
with no officer on file (`_hqIntakeNeeded` → data.js `hqOfficerOnFile`) opens the creator OVER THE MAIN MENU (`_hqIntakeOpen`:
`_menuSceneLeave` — the creator's stage owns its own renderer — then `_mountReactCreator({ intake: true, onDone, onCancel })`);
party-builder.js `OfficerCreator` reads `arguments[0]` (the pinned `function OfficerCreator()` signature stays): intake mode =
THE INTAKE head + the brief, the name seeded from the callsign, ENLIST · FILE THE AGENT → `window._hqIntakeEnlist(look)` (ONE
profile transaction → data.js **`hqOfficerEnlist(profile, look)`**: `hqSetLook`, the chair `'look'`, `door.hq.officer =
{ created, at, race, cls, name }`, and MEMBER 0 OF THE PARTY rewritten IN PLACE — id / ledger / vitals kept, a race or job change
drops the old customSpells — else `hqPartyEnsure`) → `props.onDone` → `_goToPlayHub({ afterDoor: true, enlisted: true })`; BACK
TO THE MENU / ESC → `_hqIntakeCancel`. The mirror mode (no props) is the barbershop's as before, and its SAVE re-files an
enlisted officer's look on the party (`hqOfficerEnlist(profile, { name })` — no appearance = keep the look just filed). Off:
`?nointake` / `EW_HQ_NO_INTAKE` / `HQ_OFFICER_RULES.intake = false`. **THE OFFICER** (data.js `HQ_OFFICER_RULES` `{ race: 'door
agent', cls: 'Freelancer', intake, labels }`; `hqPartyOfficer` reads the record FIRST — a profile without one keeps the legacy
seed: the agent in its own job, the mirror's look = a homosapien): sprites.js **`EW_CREATOR_LOOK_RACES`** = `['homosapien', 'door
agent']` — `getCharacterAppearanceModel` dresses the agent on the creator base and keeps the race's own `hold` (the door gun) +
`basicAttackKind`; state.js `resolveIdentityForBuild` keeps a look on those races; map.js `_hqAvatar`'s look mode walks the
building as the OFFICER'S race in the look (homosapien the fallback); the party card wears THE PHOTO. **THE SOCKETS READ THE
LEDGER**: data.js `flPoolOwnedOnly()` (= `window._ewRosterScope === 'owned'` AND `unitRosterScope() === 'owned'` — the sandbox /
no scope / Online / Practice / the range / the dev switch see the whole catalogue) → `flOwnedRaces()` (`isUnitOwned`, never the
scope) / `flOwnedJobs()` (`RACE_DEFAULT_JOBS` of the owned races): `flRacePool` offers the owned races' trees, `flWildcardPool`
the owned vessels' jobs' trees; `buildFreelancerTree`'s `poolOf` leaves an unowned id `unplaced`, so `treeLegalSubset` drops it
at the build (never a lock on a saved row; the online host validates in scope 'all'). On a FRESH profile the ledger is the five
starters (the agent · homosapien · catgirl · bigfoot · honda civic — the user's free hires) — "none" = cut `ACCT_STARTER_UNITS`
to the agent on BOTH sides (`npm run test:parity`). `npm test` runs `hq-intake.test.js`; character-creator.test.js's avatar
pin re-pointed. Ship data.js to R2 AND Render (server.js reads it). UNSEEN LIVE (RULE #1c): the creator over the menu (its
stage on a cold cache, `.pb-officer.intake` z 99990 over the menu's motes), the hand-off into the building, the agent's creator
rig holding the gun on the board and in the hall, the shrunken socket windows, a level-5 console crossing's numbers both sides.

## THE LEVEL'S MAX — 800 HP on a level-5 card (2026-09-21, local delivery)
The user: "I am level 5 with 800 HP." The curve was right (data.js `levelStatGains`: a level-5 unit is ~57 HP off a
550 base — level 1 ~46, level 10 ~79, level 20 ~139, level 50 ~380, the cap 910); the 800 was a MEMORY: `hqPartyVitals`
read the member's STORED `hpMax`, filed by the commit of a fight at the cap before THE LEVELS landed, beside a body now
built at level 5. RULE: a stored max is the last fight's build, the built unit's max IS the level's — `hqPartyScaledVitals
(m, unit)` reads the stored numbers as a FRACTION of the old max laid on the unit's (full stays full, hurt keeps its
share, DOWN stays 0), `hqPartyVitals(m, unit)` returns that (+ `rescaled`; no unit = the stored numbers as before), and
**`hqPartyResync(profile, units)`** writes it back (ONE write, the caller saves) — map.js `_hqPauseUnits` runs it once
per pause-menu open when any member's stored max differs from its built unit's (`_hqPause.resynced`; the unit cache is
kept). The launch was never wrong (createUnit scales the carried hp by the ratio) and the next commit files the level's
max. Ship data.js to R2 AND Render. The 57 is the July curve (`EW_L1_FRAC` 0.05 → ~50 HP at level 1 for Mystery
Dungeon); a level-5 of ~100 HP is `EW_L1_FRAC` ≈ 0.1 — one constant, the user's call. hq-party.test.js (15).

## THE SOAK ORDER + THE SOAK FLOOR — why a level-5 S-tier swing landed for 1 (2026-09-21, local delivery)
The user: "a neutral basic attack at level 5 is doing like 1 damage … catgirl with S-tier attack hitting a
homosapien for 1." MEASURED with the REAL `applyDamageToUnit` run headlessly (a scratch vm harness over
battle.js + state.js + data.js, real `computeUnitStats` / `_recomputeStatsForLevel`, every cosmetic helper
stubbed): on flat ground a level-5 catgirl deals 7 of a level-5 homosapien's 60 HP (the door agent 4), the
intended eighth — but the HIGH GROUND soak (`HIGH_GROUND_DEF_BONUS` 5 per tier) was subtracted RAW while
the whole hit had been scaled to ~10 points, so a target ONE tier up took the swing to 2 and two tiers (or
a tier + Guard) to 1; the areas are all tiers and slopes. THREE RULES NOW (battle.js `calcDamageResolution`
+ the chokepoint in `applyDamageToUnit`): (1) **every flat soak rides `defenseScale`** — `heightSoak:
Math.round(_heightSoak * _defLs)` beside Bulwark and the hourglass (at the cap 5 → 9 per tier); (2) **THE
SOAK ORDER**: data.js `offenseMagnitude(src, tgt)` = the victim's `levelScale` × the pace WITHOUT the gap
(`offenseScale` = that × `levelGapMult`, every other reader unchanged); the chokepoint scales by the
magnitude (`levelMult`), subtracts the soaks, then `gapMult` lands on the NET hit — the gap used to shrink
the hit before flat armour came off; (3) **THE SOAK FLOOR** `SOAK_FLOOR_SHARE` 0.35 (`p.soakFloor`; 0 /
absent = the old rule, `preScaled` hits pass 0): the soaks never remove more than 65 % of a hit, so a 1
means a feeble attacker, never a good one behind a kerb. The floor binds at the cap too (a weak spell on a
Tank: 28 − 40 was 1, is 10 now) — a PvP change, documented. ui.js `getPreviewEffect`'s attack branch mirrors
all three (`window.SOAK_FLOOR_SHARE`); the spell preview and ai.js's estimate still read `offenseScale`
whole (a small drift at unequal levels only). damage.test.js pins the stages. THE PACE ITSELF is untouched:
a same-level basic attack is ~12 % of a bar at level 5 (the door agent's 48 ATK ~7 %) — `EW_COMBAT_PACE`
(1.75) or the basic attack's 0.65 coefficient are the dials if that is still too slow.

## THE CIRCUIT IN THE FIELD — equip abilities from the pause menu's party sheet (2026-09-21, local delivery)
The user: "I need a way to equip spells / abilities in the party menu / pause menu in story mode just like in
the party builder." The forge's tree UI (party-builder.js `computeTreeEquipPath` / `treeNodeState` /
`treeDropIds`) lives inside its IIFE and is never a global, so the pause menu reads THE SAME RULES through PURE
data.js helpers (the block right after `hqPartyResync`, all on `window`): `hqPartySpellIds(m)` (meta.customSpells,
else loadout.spells), `hqPartySpellTree(m)` (buildUnitSpellTree + `_treeSealedIds`), `hqPartyTreePath` (the
forge's BFS: root → the connected frontier → the target; [] connected, null unreachable), `hqPartyTreeNodeState`
(root · socket · empty · sealed · equipped · swap · reachable · far · blocked), `hqPartyTreeDropIds` (THE
CASCADE), **`hqPartyTreeCircuit(m)`** = THE MODEL (`HQ_CIRCUIT_LANES` P · R · S, ring 4 → 1, each node's `st` /
`need` (the path's cost) / `over` (past the cap) / `drop` (the cascade's size) / `alts` (a fork's two options
with their own state) / `socket` `{ tiers, pool }`; `used / cap / isFreelancer / unplaced`),
**`hqPartySetSpells(profile, id, ids)`** = THE ONE WRITE (dedupe, the cap, `isTreeLoadoutLegal` else
`treeLegalSubset` — a stale list is repaired, never refused; lands in BOTH `meta.customSpells` and
`loadout.spells`), **`hqPartyTreeClick(profile, id, key, altId)`** = the forge's click as one rule (equipped →
the cascade; a fork's worn option → the swap in place; reachable / far → the whole path in one click; a socket →
`reason: 'socket'` so the caller opens the picker; the rest refuse with the forge's own notes),
`hqPartySocketPool(m, key)` (flSocketPool at the socket's tiers via `_flTierOf` — THE STORY ROSTER's ledger rule
rides inside) + `hqPartySocketEquip`, `hqPartySpellsDefault` (the job pillar + race r1–r2, repaired) /
`hqPartySpellsRandom` (buildTreeLegalLoadout) / `hqPartySpellsClear`. **map.js**: the member sheet's ABILITIES
header wears `✎ EDIT · THE CIRCUIT` (`data-party-act="circuit:<id>"` → `_hqPause.circuit`); `_hqPauseCircuitHtml`
draws the pips, DEFAULTS / RANDOM / CLEAR / ◂ DONE, the three lanes (a node = disc · name · type + meta · the
verdict: `+N` the path, `−N` the cascade, `⇄` a swap, the socket's pool + tier, `NO ROOM`), a fork as two option
buttons, the root, and THE SOCKET PICKER (`_hqPause.socket` / `sockQ`, a search input `data-circ-search`
re-filtered in place, a row per pool ability); `_hqPartyCircuitAct` dispatches `circuit · node · sock ·
sockclose · spelldef · spellrnd · spellclr` — every write one `_hqPartyTx` (the unit cache drops, the stats and the
equipped list re-read); `P.keepScroll` keeps the sheet where it stood; ESC closes the picker, then the circuit.
CSS "THE CIRCUIT IN THE FIELD" at the END of styles-base.css. Viewer-local (RULE #2: the party is local; the
console's crossings still take the forge). NOT built: a secondary-job pick, gear, hover-painted paths, the stage
preview (the forge's). `npm test` runs hq-party.test.js (18). UNSEEN LIVE (RULE #1c): the three lanes at the pause
frame's width (one column under 900 px), the fork's two options in a lane, the picker's 200-row scroll.

## THE SHARED BAG + THE UNDISCOVERED DOOR + THE SUSPICIOUS ANGLE + THE PLAIN NAMES (2026-09-21, local delivery)
The user's three. **THE SHARED BAG** (story mode): data.js `HQ_PARTY_RULES.bagStack` **0 = unlimited** (`hqBagCap()`;
a positive number caps a key), `sharedBag: true`; **`hqPartyStock` POOLS every member's pocket items INTO the bag**
(same name / shape — the pause menu's button reads POOL POCKETS); `hqPartyForLaunch` hands every member EMPTY pockets
and returns **`bag`** (the battle keys — a field-only tonic / elixir stays home); map.js `_msConfirm` sets
**`state.partyBag = { seat: 1, items }`** for a party fight (null at every other launch reset; state.js literal;
online.js skip list — VS-CPU only); battle.js **`_partyBagBind()`** (after the build + in `startMatch`) makes every
human-seat unit's `items` THE SAME OBJECT — the board AND the bench — so a potion drunk by anyone leaves the bag and
hud.js's panel reads 🎒 THE BAG from every seat; `getItemCapForClass` → 9999 and `unitItemsFull` false under the bag
(no 3-item slot cap: the units were built with nothing); the commit hands the bag home (`hqPartyAfterMatch(p, { …, bag })`
→ `hqBagSet`; the per-unit `items` write is skipped). RULE: never read `unit.items` as a unit's own in a story fight.
**THE UNDISCOVERED DOOR**: data.js **`hqDoorPlateFor(door, profile)`** is the ONE plate rule — the room directly
through the door (`hqDoorThrough`) STOOD IN (`hqRoomSeen`) → `{ known, label, no }`; not yet → `label '?'`, no number,
no sub, no why, no desc; a page / overlay / street / collar / portal door keeps its own name; a found draught reads the
room's. three-renderer.js `_hqPlateHtml` on every door / way plate (`_hqPlateFor`); **no plate prints a `sub` any
more** (the user: "get rid of the descriptors"); map.js's prompt (`_hqPlateFor`), the door panel's head and its GO
THROUGH read it. **THE SUSPICIOUS ANGLE**: an unmeasured `secret` door (a door row's, or a links row's — ONE angle at
both ends, key `link:<id>`; a door row's `<room>:<door>`, `hqAngleKey`) is a GLIMMER on the wall (three-renderer.js
`_hqAngleGlimmer`, three additive sprites on a ticker), no plate, no swing, no walk-in (`rec.angle` — `_hqTickDoors`,
`_hqTickAutoEnter`, map.js `_hqDoorDirectAction` refuse it); the target reads `SUSPICIOUS ANGLE · [E] MEASURE IT`;
map.js **`_hqMeasureAngle`** → THE PROTRACTOR toast with a seeded off-square reading (`hqAngleReading(key)`, never 90°),
`HQ_PROTRACTOR_MS` 1500, then **`hqAngleMark(profile, roomId, door)`** (the ONE write: `door.hq.angles.found` + the
SYNCED `progress.hq.angles.found` — `mergeProgressBlobs` (the EARLIER day wins, `ACH_MERGE_CAPS.angles`) and
`hqDoorSyncFold` carry it; **ship data.js to Render too**) and `hq.revealAngle(doorId)` (the glimmer goes, the plate
comes, the slab swings from now on). Reads: `hqAngleFound` / `hqAnglesRecord` / `hqAnglesAll()` (61). **THE PLAIN
NAMES** (the user: "why is the elevator called the car?"): THE CAR → THE ELEVATOR, CENTRAL EGRESS → THE MAIN HALL, THE
FOURIER FOYER → THE FOYER, THE CAFETERIUM → THE CAFETERIA, THE OBSERVATORIUM → THE OBSERVATORY, THE NATATORIUM → THE
SWIMMING POOL, THE MIDWAY → THE CARNIVAL, THE DOOR WORKS → THE WAREHOUSE, the lobbies THE BASEMENT / THE SECOND · THIRD
· FOURTH FLOOR — ROOM LABELS only (ids untouched; `hqReplateDoors` re-plates every door). `npm test` runs
`hq-angles.test.js`. UNSEEN LIVE (RULE #1c): the glimmer's size under each room's light, the protractor beat, the '?'
plates in the hall on a fresh profile, THE BAG panel on the bezel, the bench drinking from the bag.

## THE LEAD WALKS · THE GAUGE CARRIES · THE LEVEL'S REST (the party, 2026-09-23, local delivery)
The user's four. **THE LEAD**: SLOT 1 of THE PARTY is the walker — data.js `hqPartyLead(profile)` /
**`hqPartyLeadAvatar(profile)`** (`{ race, gender, appearance?, name, you, id }`) are the ONE read, and map.js
`_hqAvatar` reads it right after the dev override: a member that is not the officer walks as its own vessel (its
rig, a look on it if any; no rig = the officer walks and a `[HQ]` warn says so), the officer's own row (`you`)
keeps the chair's / the mirror's rules as before. `hqPartySwap` no longer refuses slot 1 (`HQ_PARTY_RULES.leadWalks`;
the result carries `leadChanged` / `lead`) — the pause menu's SWAP offers every card, the DUTY row names slot 1
THE LEAD, a swap that changes it calls `_hqRefreshAvatar` (the rig swaps in place under the menu); RELIEVE still
refuses the officer (`you` is the profile's agent wherever it stands — `hqOfficerEnlist` re-files the `you`
member, never `members[0]`). The launch order is untouched (the fit of the shifts), so a fit lead is P1 seat 1
= the walker's cell; a DOWN lead still walks but stays home from the fight. **THE GAUGE CARRIES**
(`HQ_PARTY_RULES.carryGauge`): the commit hands the human seat's Entropy Gauge to `hqPartyAfterMatch(p, { …,
gauge })` → `door.hq.party.gauge` (win or lose; a strike's 0 carries; THE COT never touches it); `hqPartyGauge`
reads it, `hqPartyForLaunch` returns it, map.js `_msConfirm` files **`state.partyGauge`** (state.js literal;
online.js skip list; 0 at every other launch reset beside `partyBag`), battle.js `startMatch` opens
`state.entropyGauge[seat]` at it after the reset. **THE LEVEL'S REST** (`HQ_LEVEL_RULES.levelHeal`): a level-up
restores HP and MP all the way — battle.js `grantXP` on the board (every progression mode; the card says so) and
the ledger at the debrief (a member whose beat crossed a level comes home `hp / mp = null` = FULL; a body dead
at the end stays DOWN). hq-party.test.js (21). Ship data.js to R2 AND Render. UNSEEN LIVE (RULE #1c): the swapped
rig under the pause menu, the opening gauge on the bezel, the mid-fight heal's pop.

## THE BAG'S TABS + NO RESTOCK + THE SPOILS (the story-mode inventory, 2026-09-23, local delivery)
The user's three: "a crap ton of items in my bag — don't restock between battles; organize the bag by tabs
(healing / banes / battle items); enemies sometimes drop items on the victory screen, rarities, no per-unit
drop rates". **NO RESTOCK** (the cause, read off the code): battle.js `syncPartyBuildsFromInputs` gives every
EMPTY loadout a potion + a mana potion + a panacea (the forge's courtesy), `hqPartyForLaunch` hands every
member EMPTY pockets on purpose, and `_partyBagBind` merged "what the unit was built with" into the shared bag —
three items a member a fight. Now the staple grant SKIPS the bag's seat (`_bagSeat` off `state.partyBag`, set
before the build) and the bind hands a unit the bag and adds NOTHING. RULE: the bag is the ONLY source of a
story fight's items — never merge a built unit's items into it. **THE BAG'S TABS**: data.js `HQ_BAG_TABS`
(all · healing · battle · banes) + **`hqBagCategoryOf(key)`** = ONE rule off the ITEM_RULES row (a typed
bane → banes; heal / mana / revive / cure / field-only / panacea → healing; else battle — the grenade's
`baneType: 'none'` is a battle item); `hqBagList(profile, { tab })` sorts by category then the shelf's order
and carries `cat`; `hqBagTabs(profile)` the counts. map.js `_hqPauseBagHtml` draws the strip
(`data-party-act="bagtab:<id>"`, `_hqPause.bagTab`), hud.js `_hrlgItemBlades` orders the battle rows the
same way and paints every row its category's colour. **THE SPOILS**: data.js `HQ_DROP_RULES` = `chance` (0.6,
the SAME for every unit — never a per-race table), `weights` (healPotion 42 · manaPotion 30 · panacea 16 ·
bane 8 · reviveTonic 4), `rarity` (common / uncommon / rare); **`hqEncounterDrops(fallen, { rng })`** (pure:
[{ race, name, types }] → { items, rows, total }; a bane is the fallen unit's OWN first type with a bane row,
none → a potion); battle.js's commit rolls `_encFallenEnemies(seat)` on a WIN and hands `drops` to
`hqPartyAfterMatch`, which puts them in the bag AFTER the fight's bag came home (a loss = nothing) and returns
`drops`; the debrief's REWARDS sheet wears THE SPOILS card under THE EXPERIENCE (`#vicDrops`, `_vicBuildDrops`,
styles-cinematic.css "THE SPOILS"); the return toast counts them. Tune the table, never the roller.
`npm test` runs hq-party.test.js (27). Ship data.js to R2 AND Render. UNSEEN LIVE (RULE #1c): the tab strip's
fit on the pause frame, the card's stagger, the category colours on the blades.

## THE ONE-WAY DOOR — the story-mode capture mechanic (CAPTURE_PLAN.md, 2026-09-23, docs only)
`CAPTURE_PLAN.md` is THE doc for capturing enemies in story mode — read it before building any of
it. The rule it sets: a CAPTURE DOOR is a bag ITEM (never a spell, never Online / Practice) placed
on an EMPTY tile by the door gun's shot; an enemy that ARRIVES on it by any means (a step in THE
CHAIN REACTION after the fuses) is HELD in the void (realm-shielded, the `exited` status's shape)
under a DETERMINISTIC seal time shown as pips (§2.3, no roll); its allies break the door (a structure
attack) to free it, the seal makes it SEALED (off the board, counted gone for Wipeout), victory
enlists every sealed / held unit into THE PARTY, else the roster (a synced `hq.captured` ledger the
server unions into `unlockedUnits`), else a bounty. §5: every encounter is at least two bodies; THE
SWARM (6–8 low-level bodies + 1–2 elites) is the last phase.
**Phase 0 THE RULES built 2026-09-25** (`capture-door.test.js`; the full list is CAPTURE_PLAN.md §8): `CAPTURE_RULES`
+ `captureSealFor` in data.js, four story-only door items (three tiers + ONE tuned door — §7.3's default), the bag's
DOORS tab, the `captured` / `sealed` statuses, the synced `hq.captured` ledger, `hqCaptureEnlist`. `hqPartyUnlocked`
now counts captured races as owned (the prune keeps them). The `story: true` gate lives in both normalizers
(`_storyLoadoutOn`), the forge list and the random CPU loadout. hud.js's `_catOrder` does not know 'doors' yet
(Phase 2 adds it with the item row).
**Phase 1 THE DOOR ON THE BOARD built 2026-09-25** (`capture-board.test.js`; CAPTURE_PLAN.md §8 lists every hook).
battle.js "THE ONE-WAY DOOR" block: place / take / hold tick / seal / break / match end; a SEALED body leaves
`state.units` for `state.sealedUnits` and rides `state.captures` to the commit's `hqCaptureEnlist`. The user's
answers (§7): a captured race is owned at once (isUnitOwned reads the captured ledger), natives never capture the
party (`CAPTURE_RULES.playerOnly`), no healing a held unit, a lone enemy seals at the round's end. Next: Phase 2
THE DELIVERY (the ITEMS row, the tile menu, the gun, the look).
**Phase 2 THE DELIVERY built 2026-09-25** (`capture-delivery.test.js`; probe `playtest_capture.js`). The door reaches the
player: the ITEMS row (doItem's `captureDoor` branch, a tile aim reading PLACE THE DOOR, the painter lights
`captureDoorLegalTiles`; the row greys with the reason), the TILE MENU row per door in the bag (best tier first;
out of reach → `findCaptureDoorApproachTile` + `_moveThenCaptureDoor`, the board click does the same), the tuned door
auto-tunes to the type of the enemy nearest the tile (`captureDoorTuneFor`). THE LOOK: `_buildDoor3D`'s capture
dress (leaf open 150°, jamb lamps in the owner's / the type's colour, T2 a second pair, T3 the vault leaf, the void
pane + violet rim while holding, the plate with hits + hold pips + the captive's name; no standing PointLight — a
light-count change recompiles every shader), the door held back until the comet lands (`door._revealAt`), the held
body's model hidden (`_updateEnemyConcealment`), and five recipes `raceCaptureDoor:open / take / seal / break / fold`
in three-vfx-effects.js (pooled flash lights, sparks, rings, the recall comet on the seal). Next: Phase 3 THE AI.
