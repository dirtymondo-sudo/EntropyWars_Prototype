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

## The fix plan (needs mondo's OK, see the thread)
A. The server pays PvP Hazard Pay itself when it records the result; `/bank` stops taking a client amount. VS-CPU pay:
   a small daily cap, or none for accounts.
B. Sell-backs: the bag moves to the server, or sell-backs stop paying the server wallet.
C. Story progress cannot unlock PvP units or pay the PvP wallet beyond a daily cap (or story gets its own wallet).
D. PvP referee: the server re-runs every ranked fight from the recorded actions (headless engine, load-data.js style)
   and only then pays Elo + gold. Big; the real fix for hole 4. Cheaper first step: the host's party is checked too.
E. Relationship Web behind a secret key (one-time setup on each of his computers).
