# Online PvP playtest — 2026-11-09

Report only: nothing was fixed. Main at `2f7673a` (PR #1069), token `20261109-allmodels-02-cors`.

## How it was played

- Local `server.js` plus two real Chromium pages, one per seat (host = P1, guest = P2), WebGL2 on llvmpipe, through the shared playtest harness. Every move went through real clicks on the real menus, ability rows, target rows, CONFIRM buttons and board squares. Both seats had Action Cam on (the default).
- After every turn, a script compared the two seats' `GAME.state`: HP, position, dead, AP, statuses, shield, kills, round, active seat, zones, delayed blasts, traps, graves and summons (turrets), plus the last log lines on each side. A unit the guest can't see is `-999,-999` on the guest, which is correct, so the script left those positions out.
- **Harness change:** at round 5 of match 1, I raised the shot clock from 60 s to 300 s on both seats by console, because my clicks take 10–20 s each. Before that, the 60 s clock timed out turns on both seats, and every timeout was logged on both.
- Matches:
  1. Friendly room, **Arena, Heaven Arena**, 12×12, 10 rounds. Host Antperson/Popstar/DOOR Agent/Marksman vs guest Cyborg/Necromancer/Crystal Guardian/Barbarella. Host won 134–109.
  2. Friendly room, **TDM, Hell Arena**, 5 rounds. Host Luchador/Popstar/DOOR Agent/Marksman vs guest Demon/Halfdemon/Nun/Tree Person. Ended when the guest refreshed the page at round 2 (bugs B3/B4).
  3. Friendly room, **TDM, Hell Arena**, 5 rounds. The same host team vs guest Undead/Kraken/Bunny Girl/Loch Ness Monster. Guest won 1–0 on kills. Then an in-room **rematch** (F9).

## Top bugs (most severe first)

| # | Family | Bug | Seat |
|---|---|---|---|
| B1 | Throw / landing pick | To the Moon grabs on the guest, but the guest never gets the landing pick. The turn is stuck. | guest |
| B4 | Disconnect / match end | A disconnect forfeit never ends the match on the host. The log says "Player 1 wins!" but no result screen appears. | host |
| B3 | Disconnect / refresh | A guest page refresh mid-match loses the match. The page boots too slowly to rejoin inside the 90 s window. | guest |
| B2 | Disconnect / match end | Any guest disconnect after the result closes the room. The guest then gets "Unable to rejoin this match" over its result screen. | guest |
| F3–F5 | Guest combat log + fog | The guest's own teleport line is dropped. A delayed-blast mark on its own unit is missing. A host-only Swing Door prompt shows up in the guest's log. | guest |
| F2 | Guest HUD leftovers | A damage forecast badge stays on the board after the shot clock ends an armed guest turn. | guest |
| F9 | Rematch | An in-room rematch ignores the room's round limit (5 became 12). | both |
| F1, F7, F8, F10 | Small UI | The host's match timer doesn't tick. The achievement toast covers the online pill. A stale "Online — Room X" pill stays up, once reading "Pnull". The guest's roster column overlaps the unit panel. | both |
| F6 | Console | Guest watchdog: "_actionExecuting was stuck true — force-clearing" (twice). | guest |

---

### B1: Guest throw (To the Moon) is stuck after the grab. No landing pick.
- **Repro:** Match 1, round 6. The guest's Cyborg opens ABILITIES, picks TO THE MOON, targets DOOR Agent and presses CONFIRM.
- **What happens:** Both logs say "Cyborg grabs DOOR Agent! Choose where to throw them." The host sees the grab close-up. On the guest:
  - The HUD goes straight back to the main action menu, and the prompt says "Cyborg is up — select an action".
  - No landing squares are lit, and clicking squares in range (5,8 and others) does nothing.
  - `state._skyThrowHighlight` and `unit._skyThrowGrab` did reach the guest, but `actionMode` and `selectedTool` are null.
  - Re-arming through ABILITIES doesn't help: TO THE MOON is greyed **"NO MP"**, because the 150 MP was already paid at the grab.

  The only way out is END TURN. That drops the held unit and silently refunds the MP, with no log line.
- **Likely cause:** battle.js ~84762 sets `state.actionMode = 'spell'`, `actionMenuView`, `selectedTool` and so on for the landing phase on the **host's** state. Those are guest-local UI keys, so they never reach the guest. The NO MP greying also blocks the re-arm path at battle.js ~65646.
- **Host side works:** the host's Luchador **Suplex** in match 3 got its "click which way to throw it" pick, landed 2 tiles away, and was in sync on both seats.
- **Not tested:** the other throws on the guest (Infernal Hurl, Dragon Toss, Horn Toss, Abduction Beam, Fifty Times Its Weight). No random guest team rolled them. They share the skyThrow path, so they are likely hit the same way.
- Shots: `moon2.jpg`, `moon3.jpg` (guest menu, no pick), `moon3h.jpg` (host close-up), `moon4.jpg` (after the board click), `moon5.jpg` (NO MP).

### B4: A disconnect forfeit never ends the match on the host
- **Repro:** Match 2, round 2. The guest page is refreshed. The guest can't rejoin in time (see B3), and the server logs "guest failed to rejoin room VUGTR — forfeit".
- **What happens:**
  - The host log prints "Player 2 forfeited (disconnect timeout). Player 1 wins!" and a toast appears.
  - But `state.winner` stays null and no result screen opens. The board stays up with the guest's Demon as the active unit, for good. I had to FORFEIT from the pause menu to leave.
- **Cause:** online.js:1041-1051 `triggerOnlineForfeitWin` calls `showVictoryScreen(winner)`. That function doesn't exist in any file (`typeof showVictoryScreen` is "undefined" in the page). Nothing sets `state.winner`.
- Shot: `refresh-host.jpg`.

### B3: A guest refresh (F5) mid-match loses the match
- **Repro:** Match 2, round 2, during a host turn. Reload the guest page.
- **What happens:**
  - The page shows "⚠️ Connection lost — reconnecting… 90s". The counter sat between 88 and 90 for two minutes and once went back up, from 88 to 89.
  - The reloaded page took **~115 s** to boot here. Only then did it open a socket, so the server had already forfeited it after 90 s.
  - The guest ends on the title screen with "Unable to rejoin this match. Please start a new match." The top pill reads "Online — Room VUGTR — You are **Pnull**".
- **Caveat:** 115 s is the sandbox's slow software GPU. On a real PC a warm-cache boot is much faster. But the rejoin can only start after the full boot, so the friend's weak Chrome PC is the case at risk. Live socket drops are fine; see "Checked and fine".
- Shot: `refresh-guest.jpg`.

### B2: A guest disconnect after the match closes the room. "Unable to rejoin" covers the result.
- **Repro:** End of match 1. The guest page went unresponsive for about 2 minutes on the result/podium screen. One screenshot took 119 s; the host was normal. Both of the guest's sockets timed out.
- **What happens:**
  - The server logged "guest left room MANAL post-match — closing room".
  - The guest's auto-rejoin then failed and showed "Unable to rejoin this match. Please start a new match. [Return to Main Menu]" over its DEFEAT screen. Request Rematch can't work after this.
- **Cause:** server.js ~2395 closes the room on **any** post-match disconnect, with no rejoin window. online.js still auto-rejoins because `_wasInMatch` is set.
- **Caveat:** in match 3 I watched the guest's end screen without screenshots. The worst stall was 11 s and nothing dropped. The 2-minute freeze may be partly my screenshot drawing the podium on the slow GPU. The close-the-room-and-show-the-modal behaviour is real either way.
- Shot: `m1-result-guest.jpg`.

### F3–F5: Guest combat log + fog filter
- **F3: the guest's own unit line is dropped.** In match 1, round 6, the guest's Barbarella (blinded) used Gravity Boots. The host log has "Barbarella teleports from G6 to H8." The guest log never got it.
  - Cause: online.js `_gvLogShows` (6019-6041) still drops a line when a named coordinate isn't visible, even when the line names the guest's own unit (`own = true`). A blinded unit doesn't see its own square.
- **F4: the guest gets no warning line for a delayed blast on its own unit.** In match 1, round 7, the host's Marksman (fogged) cast Fire for Effect on G7, the guest Cyborg's own square.
  - The guest board draws the blast ring, but the guest log has no "marks G7 … Detonates in 1 round" line. The whole line is dropped because the caster is fogged. Zones send a "Someone creates …" line in that case; delayed blasts have nothing like it.
  - The detonation lines did reach both seats.
- **F5: a host-only prompt shows up in the guest's log.** In match 1, round 8, the host cast Swing Door. "Swing Door: pick the hinge — an empty tile beside an enemy you can see." appeared in the **guest's** combat log.
  - By contrast, the host's Suplex prompt ("click which way to throw it") was correctly kept off the guest's log.

### F2: A stale damage badge after a shot-clock timeout (guest)
- In match 1, round 5, the guest Cyborg armed To the Moon on DOOR Agent, then the 60 s shot clock ended the turn.
- A red "−570" forecast badge (`ti-badge ti-damage`) stayed over DOOR Agent through the next turns, until the guest armed another spell. Shots: `moon1.jpg`, `swamp2g.jpg`.

### F9: A rematch ignores the room's round limit
- The room in match 3 was set to 5 rounds. After REQUEST REMATCH and then ACCEPT REMATCH, the rematch ran with `matchClock.roundLimit` 12 on both seats ("R1/12").
- Otherwise the rematch worked: the same map and teams loaded in 11 s on both seats. Shot: `rem3-h.jpg` / `rem3-g.jpg`.

### F1, F7, F8, F10: Small UI
- **F1:** the host's scoreboard timer (`.ew-sb-time`) doesn't tick. It only jumps when the HUD re-renders, in either seat's turn: host "00:26" while the guest showed "01:22", then host "01:31 → 01:31" four seconds later while the guest went "01:33 → 01:37". The guest ticks because its snapshots keep re-rendering it. hud.js ~1309 works out the time only on render.
- **F7:** the achievement toast at the top right sits on top of the "Online — Room … — You are P2" line, and the texts overlap. Shots: `drop1.jpg`, `gb2.jpg`.
- **F8:** the "Online — Room MANAL — You are P1" pill stays on screen in the menus, the party builder and the next room's Share Code screen (`fr2.jpg` shows MANAL above room VUGTR) after the room has closed. After B3 it read "You are **Pnull**".
- **F10:** at the start of a guest turn, the left roster column overlaps the unit panel (HP/MP bars, BUILD/CHANNEL/INSPECT). Shot: `STAGE_DIVE-b-guest.jpg`, bottom left.

### F6: Guest watchdog warnings
- `[_execAction] watchdog: _actionExecuting was stuck true — force-clearing` appeared twice on the guest. Once was right after the guest's Barbarella confirmed an attack from the target row (match 1, round 4). Once was during the host's Paparazzi Flash (round 5). Play carried on both times.

## Checked and fine (both seats)

- **Desync:** across ~3 matches I checked after every turn: HP, position, dead/alive, AP, statuses, shield, kills, round, zones, delayed blasts, summons and graves. They matched every time. The only differences were:
  - a one-check lag at turn and round handoffs, which cleared on the next check;
  - after the match ends, the guest's live state shows the podium lineup (dead Barbarella alive at 1540). The **Export Last Match** files from both seats are identical, though (Barbarella 0 HP, dead).
- **Online fog:** the guest's state hides the host units it can't see (`-999`). The guest never got lines about fogged host units. The host's board drew only its own units plus what it could see.
- **Riot VFX team borders (PR #1058) from each seat:**
  - Fire for Effect: blue-violet outline on the host (own), pink-orange on the guest (enemy). See `riot_blast_borders_host_vs_guest.jpg`.
  - Smoke Screen: the guest's own zone was blue, and the host saw it pink. See `SMOKE_SCREEN-b-*.jpg`.
  - The red danger fill and the orange ring look the same on both seats; only the thin outline changes colour.
- **Statuses:** stun, weaken (Petrify, Calcify), blind ×3 (Paparazzi Flash), poison (Poison Swamp, Corrosive Splash, the Poison Bog terrain), jammed (Taser Bolt), stagger, invisible (Smoke Screen) and wet (Spout). They landed, ticked and wore off identically on both seats.
- **Delayed blast:** Fire for Effect was marked and detonated the next round with the same damage lines on both seats.
- **Summons and graves:** Raise the Dead's flesh abomination (`state.turrets`) was the same on both seats and took hits on both. Marksman and Necromancer respawned on the clock. The raised corpse correctly left no grave.
- **Forced movement:** Swing Door (pull into an auto-attack), Stage Dive (slam plus a unit-into-unit collision kill), Rocket Fist, the Tornado weather flings, and the host's Suplex throw matched on both seats.
- **Transport drops:** I closed the host's socket mid-turn in match 1, round 9, and then the guest's during its own turn. Each rejoined in about 2 s inside the server's 90 s window. The reconnect overlay flashed, and the match carried on in sync.
- **Shot clock:** guest timeouts are logged on both seats, which is the 10-24 fix holding.
- **Result screens:** the host and the guest agree on the winner, the score line and the MVP. In-room rematch works, apart from F9.
- **Load:** after the first boot, a friendly room went from JOIN to the battle board in 12–18 s on both seats, and the rematch in 11 s.

## Not covered

- **Traps:** none of the random teams rolled a trap race (Spike Trap, Tripwire, Scrap Mine, Trapdoor and so on). `state.traps` stayed empty.
- **CLASH mode, Quick Play (ranked), 5v5.**
- **Guest throws other than To the Moon** (see B1).
- **Action Cam framing and hold timing on the guest:** a screenshot costs about 3 s here, so close-ups can't be timed. I saw the host get the grab close-up while the guest's camera stayed on its board view during host turns. That is fog-correct, since the casters were fogged.
- **WebGPU:** these were WebGL2 runs only. Real network latency: everything was on localhost.

## Perf / load notes (for the weak Chrome PC)

- A cold page boot in the sandbox (llvmpipe, 4 cores) takes ~2 minutes. The 90 s rejoin window only starts counting at the disconnect, but the page can't rejoin until it has finished booting. That gap is B3.
- The guest's main thread blocked for 11 s at the match-3 result and ~2 min at the match-1 podium (with a screenshot drawing). The server's ping timeout is 60 s. A weak PC that stalls that long on the podium will hit B2.

## Files

- `shots/`: every screenshot named above.
- `data/`: the Export Last Match JSON from both seats (match 1), `server.log`, the harness ledger (`ledger.jsonl.gz`: every input, log line, round, forecast check and error), and the helper scripts I used (`cmp.js` compares the two seats, `turn.js`/`cast.js`/`loop.sh`/`doplan.sh` play turns through real clicks).
