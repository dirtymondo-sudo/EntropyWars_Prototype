# Filler Bots — always-on opponents so matchmaking is never empty

A small, **on-demand** bot system so a real player can always find a ranked
match even when nobody else is online. Bots don't sit in the queue 24/7 — the
manager watches matchmaking and only summons a bot when a human has been waiting
alone past a threshold. One bot per lonely queue (never bot-vs-bot), with a hard
cap on how many run at once.

These are **dev/ops tooling** (like the `playtest_*.js` harnesses), not part of
the R2 game bundle. The bots load the *live* client over the network, so they
always play the current version of the game with no extra deploy step.

## How it works

```
 server.js  ──/api/queue-stats──▶  bots.js (manager)
   ▲   │                              │  sees a human waiting alone > BOT_FILL_WAIT_MS
   │   │ bot-hello / queue-join       ▼
   │   └──────────────────────  bot_client.js  (one headless browser = one match)
   └─────────────  plays the real online match  ◀──── real client (index.html + R2)
```

- **`server.js`** (already on your server): `/api/queue-stats` now reports, per
  queue, `{ total, humans, bots, oldestHumanWaitMs }`. A new `bot-hello` socket
  event lets a bot tag itself so it's counted as a bot, not a human. *(These are
  the only server changes — deploy `server.js` as usual.)*
- **`bots.js`** — the manager. Polls `/api/queue-stats`; when a queue has an
  unpaired human who's waited long enough and no bot is already on the way, it
  launches one bot into that exact queue (team size + mode).
- **`bot_client.js`** — drives one headless browser through the real online flow:
  log in → join queue → `bot-hello` → on match, run the ranked auto-start
  handshake → play to the end → exit. Plays at a **skill level scaled from its
  ELO** (see below). Host side can use spells + heals; guest side plays attack/
  move through the real net emitters.
- **`bot_register.js`** — one-time helper to mint bot accounts (so ranked ELO
  counts for the human).

## Fair matches: ELO pinning + skill scaling

So a bot is a *fair* opponent (and your ELO swing is honest), two things happen
when a bot is summoned:

1. **ELO pinning** — the manager reads the waiting player's ELO and pins the
   bot's account to within **±`BOT_ELO_JITTER` (default 100)** before it queues
   (`POST /api/bot/sync-elo`, gated by `BOT_ADMIN_SECRET`). So the match forms
   instantly and the bot's rating ≈ yours instead of a fixed ~1200.
2. **Skill scaling** — the bot *plays* at a strength matching that rating, so a
   bot shown as 800 actually plays like an 800. `skill ∈ [0.05, 1]` is mapped
   linearly from ELO (`BOT_SKILL_ELO_MIN`→0 … `BOT_SKILL_ELO_MAX`→1). As skill
   drops the bot casts fewer spells, stops securing kills, picks worse targets,
   wanders, and sometimes ends its turn early — the same behavioural levers the
   in-game AI weights govern (kill bonus, focus, support).

> **Why not just reuse the in-game AI weights?** The engine's AI (`ai.js` +
> `getAIWeight`/`AI_WEIGHT_DEFAULTS`, with the `_challengeAiMult` difficulty
> multiplier) only runs **authoritatively on the host**; a guest is a thin
> client whose units can't be driven by the in-engine AI. To keep a bot's
> strength identical whether it's randomly assigned host or guest, strength is
> scaled uniformly in the bot's own tactics instead. (A host-only variant that
> delegates to `ai.js` at a scaled weight is possible later, at the cost of
> host/guest inconsistency.)

**How much ELO you win/lose** is the normal Elo formula (server-side, K = 24–40),
so beating/losing to a bot moves you exactly like a human of that rating —
typically **±12–20** for an even match (Elo caps at the K-factor; a single game
can't move you ±100).

If `BOT_ADMIN_SECRET` is **not** set, pinning is disabled and bots queue at their
own ELO (skill still scales — to the player's ELO when known). Set the **same**
secret on the server (env) and the manager.

## Setup (run on the SAME box as the game server)

The bots are headless Chromium instances — keep them next to the server so they
connect over `localhost` and reuse the on-disk asset cache.

```bash
# 1) deps (Playwright is already in package.json) + the browser binary
npm install
npx playwright install chromium --with-deps

# 2) (recommended) mint a few bot accounts so matches award ELO.
#    Needs the server's D1 database configured. Writes bots.tokens.json (gitignored).
node bot_register.js 3

# 3) enable ELO pinning: set the SAME secret on the server and the manager.
#    (server: add BOT_ADMIN_SECRET to its env and redeploy)
export BOT_ADMIN_SECRET='pick-a-long-random-string'

# 4) run the manager (leave it running; e.g. under pm2/systemd)
node bots.js
```

Without step 2 it still works, but matches are unauthenticated and the server
skips ELO for them. Without step 3 the bot still scales its *skill* to the
player but queues at its own ELO (so very high/low players may match a bit
slower). For the full "fair opponent near my rating" behaviour, do all four.

## Tuning (env vars)

| Var | Default | Meaning |
|---|---|---|
| `BOT_SERVER_URL` | `http://localhost:3000` | where the game server is |
| `BOT_FILL_WAIT_MS` | `20000` | how long a human waits alone before a bot is summoned |
| `BOT_POLL_MS` | `4000` | queue poll interval |
| `BOT_MAX_CONCURRENT` | `2` | max simultaneous bots |
| `BOT_QUEUE_TIMEOUT_MS` | `60000` | a summoned bot leaves the queue if it never matches |
| `BOT_MODES` | *(all)* | restrict which modes get filled, e.g. `arena,tdm` |
| `BOT_HEADLESS` | `1` | set `0` to watch a bot in a real window |
| `BOT_ADMIN_SECRET` | *(unset)* | shared secret to enable ELO pinning; set the **same** value on the server |
| `BOT_ELO_JITTER` | `100` | pin the bot within ± this many ELO of the player |
| `BOT_SKILL_ELO_MIN` | `500` | ELO that maps to weakest play (skill 0) |
| `BOT_SKILL_ELO_MAX` | `1800` | ELO that maps to full-strength play (skill 1) |
| `BOT_NAME_PREFIX` | `Filler_` | (bot_register) account name prefix |

Example — only fill arena/TDM, summon faster, allow 3 bots:

```bash
BOT_MODES=arena,tdm BOT_FILL_WAIT_MS=12000 BOT_MAX_CONCURRENT=3 node bots.js
```

## Manual one-offs

```bash
node bot_client.js arena 4     # one unauthenticated bot joins 4v4 arena and plays whoever it matches
```

## Notes & caveats

- **Cold start latency:** each bot is a fresh browser that loads ~1.3 MB of R2
  scripts. The first load on the box warms `.asset-cache/`; after that, launches
  are fast. If you want near-instant fills, raise `BOT_MAX_CONCURRENT` and lower
  `BOT_FILL_WAIT_MS`, or pre-warm a browser (future enhancement).
- **No bot-vs-bot:** the manager never puts two bots in the same queue, and only
  summons when there's an unpaired human — bots won't farm each other.
- **Bot ELO is overwritten each match** to sit near its current opponent (when
  pinning is enabled), so a bot account's standalone rating isn't meaningful —
  and bot accounts will appear on the leaderboard around live players' ratings.
  If you don't want them listed, filter `Filler_*` (or a dedicated `is_bot`
  column) out of `/api/leaderboard` — a small server change.
- **One match per browser** (v1): after a match the browser exits and the
  manager re-evaluates. Simple and robust; slightly heavier than a warm pool.
- The bot reuses `asset_cache.js`, so make sure that file stays alongside it.
