# ANTI-CHEAT: who decides the wallet, the roster, Elo and PvP (audit 2026-11-18)

mondo 11-18: "once the game goes public ... i dont want them to be able to edit their wallets and stats and stuff at all."
Thread: cmsg_01XWpxyTn3nnw98znVzKdFjsVoNUSjDySZKHRtirY5SERS. Dev tools stay until launch; this file lists what to gate.

## Where each thing lives today

| Thing | Stored | Who decides a change |
|---|---|---|
| Hazard Pay (wallet), free tickets | server D1 `players.gold`, `free_tokens` (browser keeps a mirror) | server, BUT it takes the client's word on how much a match / a sell-back / a sync earned (holes 1-3) |
| PvP roster (unlocked units) | server D1 `players.unlocked_units` | server; purchase is atomic. BUT the progress blob's `hq.captured` adds units and `hq.defeated` opens the shop, both client claims (hole 3) |
| Elo, wins, losses | server D1 `players` | server, from the host's state-sync winner (hole 4) |
| Match results / history | server D1 `matches` + replay files | server, same source as Elo |
| Achievements, finds, capture bounties | server D1 `player_progress` (merged blob) | client claims, merged + paid by the server (hole 3) |
| Unit stats in PvP | data.js race profiles | nobody can send stats: the host overwrites the guest's builds with the one class and re-checks spells (online.js `_applyRemotePartyConfig`) |
| Story save (party, levels, bag, cleared rooms) | browser only (localStorage / IndexedDB) | the player. Fine for single player; matters only where it feeds the server (the blob) or PvP (mastery level, cosmetic) |
| Relationship Web boards | server D1 `story_web_docs` | anyone who finds the URL: no login at all |

## The holes (plain words)

1. `/api/economy/bank` pays up to 5,000 per call for ANY match the client says it played (VS-CPU too); 30 calls a minute.
   A script = unlimited money.
2. `/api/economy/spend` with a negative amount (a "sell-back") credits up to 1,000 per call, no check that anything was sold.
3. `/api/progress/sync` trusts the blob: forged `hq.captured` = every unit owned free; forged `hq.defeated` = shop opens;
   forged capture bounties / daily finds paid per date. FIXED 11-18: dates past tomorrow (UTC) are dropped
   (server.js `dropFutureDays`), so the endless future-date money loop is shut; the 64-day bounty back-fill and the
   captured / defeated ledgers are still client claims.
4. PvP is host-authoritative: the HOST's browser runs the whole fight. A modified host can deal any damage, win any
   match, and get Elo + medals. The server only checks the guest (turn order, party ownership). The host's own party is
   never checked against its account (only the guest sends party-config).
5. Elo farming with a second account (win trading) is not detected.
6. Relationship Web has no login: anyone can read, overwrite or delete his boards.
7. Mastery level shown to the opponent comes from the guest's local save (cosmetic only).

## Dev tools to gate before launch
Settings > Developer (all of it), `ewDevUnlockAll` / `ewDevGrantGold` (ui.js, local only, nothing written to the server),
`window.GAME` console API, dev-sim / auto-sim, the editor, Balance Lab / Spell Library exports, the cutscene editor,
the Relationship Web (`/dev/relationship-web`, `/api/story-web*`), `/api/bot/sync-elo` (already behind BOT_ADMIN_SECRET).
The local-only ones cannot touch the server wallet; they matter because anything a player can do in the console a
cheat tool can do too, which is why the server must decide.

## The fix plan: SHIPPED 11-18 (mondo: "okay let's do it. But I want units unlocked in story mode to be able to be used in PvP")
All in server.js THE CHEAT GUARD (`CHEAT_CAPS`, migration 006_anti_cheat.sql):
- A. A ranked match pays only against a ticket (`match_payouts`) the server writes when it records the result
  (`applyRankedEloInner`); battle.js sends the match id with the bank call, and a bank that arrives while the result
  is still being written waits for it (`rankedSettling`). VS-CPU / friendly / no ticket: 3,000 a day (`cpu`); the
  result screen says "daily Hazard Pay limit reached" when it cut the pay.
- B. A sell-back gives back what the account spent (`spent_total − refunded_total`) plus 500 a day for found items.
- C. Captured races STILL join the PvP roster, 8 new races a day (the rest join on later days by themselves). Story +
  achievement gold from a sync: 5,000 a day, the rest waits in `players.sync_owed`. Bounty days older than a week or
  past tomorrow are not taken in (`dropFutureDays`).
- D. The host's own team (its snapshot's `partyMeta[1]`) is checked against its account; an unowned unit voids the
  ranked match (no Elo, no tickets). The real fix for a modified host (the server replaying the fight) is NOT built:
  it needs the battle engine to run headless on the server, a big separate job.
- E. The Relationship Web asks for a password (picked on first open, hashed in `server_settings`), every computer once.
Tested 11-18 against an in-memory SQLite stand-in for D1 (register, bank, spend, refund, sync, web key); the ranked
ticket path was read, not run.
