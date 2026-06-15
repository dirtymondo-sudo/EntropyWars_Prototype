# Entropy Wars — Account Unit Unlock Economy (PvP)

Implementation spec. Build the persistent, account-level unit-unlock + gold economy for **normal PvP modes only**. Challenge mode is a separate, self-contained system and must NOT be touched.

---

## 0. TUNABLE CONSTANTS — put these in ONE place (suggest `data.js`, near the existing `GOLD_PER_*` block ~line 7521). All economy logic reads from here.

```js
// ── ACCOUNT ECONOMY (PvP) ──
const ACCT_UNIT_PRICE        = 5000;  // flat cost of EVERY unit. Same for all, intentionally.
                                      // ≈ 10 average matches' worth of gold — see §0a for the derivation.
const ACCT_BASE_COMPLETE     = 50;    // flat gold for finishing a PvP match (win OR loss)
const ACCT_WIN_MULT          = 1.5;   // multiplier applied to (base + collected) on a win
const ACCT_FLAWLESS_MULT     = 1.25;  // win-only: no friendly unit died. STACKS.
const ACCT_WIPEOUT_MULT      = 1.25;  // win-only: all enemy units dead. STACKS.
const ACCT_STARTING_GOLD     = 0;     // wallet balance for a brand-new account
const ACCT_FREE_TOKENS       = 1;     // free-unlock tokens granted at account creation
const ACCT_MATCH_GOLD_CAP    = 5000;  // server-side sanity cap on banked gold per match (anti-cheat).
                                      // == ACCT_UNIT_PRICE on purpose: even a fully-spoofed match can
                                      // bank at most one unit's worth, so the spoof ceiling is "1 unit
                                      // per match" vs the ~10 matches a legit player needs.
```

Why a single price knob: `ACCT_UNIT_PRICE` is the one number that sets the entire grind. Everything else (rewards, cap) is expressed relative to it, so retuning the economy is a one-line change. Keep it that way.

Reward formula (exact):

```
collected   = sum of (u.gold || 0) for ALL of the player's units (dead included)
              — counts every in-match source: nexus, passive, kills, assists, hourglasses
winMult     = playerWon ? ACCT_WIN_MULT : 1.0
condMult    = 1.0
              × (playerWon && noFriendlyDeaths ? ACCT_FLAWLESS_MULT : 1.0)
              × (playerWon && allEnemiesDead   ? ACCT_WIPEOUT_MULT  : 1.0)
matchGold   = Math.round( (ACCT_BASE_COMPLETE + collected) * winMult * condMult )
matchGold   = Math.min(matchGold, ACCT_MATCH_GOLD_CAP)   // server enforces this
```

A loss collapses to `ACCT_BASE_COMPLETE + collected` — losers still bank everything they farmed. Banking runs on **win AND loss**.

---

## 0a. PRICING RATIONALE & PROGRESSION MATH (read before retuning)

The price target is **"~10 matches per unit."** Here's the derivation so the number is transparent and tunable, not magic.

**Expected gold per match (`collected`).** Default PvP is `teamSize = 4` (`data.js:10`) over a `12–15`-round cap (`state.js`). In-match sources (`data.js:7521`):

| Source | Rate | Gated by mode? | Typical match total (4 units, ~13 rounds) |
|---|---|---|---|
| Passive | `GOLD_PASSIVE_PER_ROUND = 2` /unit/round | **No — all modes** | ~80–100 (drops as units die) |
| Kills | `GOLD_PER_KILL = 10` | **No — all modes** | ~120 (≈12 kills) |
| Assists | `GOLD_PER_ASSIST = 5` | **No — all modes** | ~50 |
| Nexus | `NEXUS_GOLD_PER_ROUND = 5` /unit/round held | **Yes** — `hasNexus !== false` (`map.js:2537`): arena, domination (+ hotspot roaming) | ~120 in those modes, else 0 |
| Hourglass | `GOLD_PER_HOURGLASS = 5` each | **Yes** — `hasHourglasses`: arena only | ~20–40 in arena, else 0 |

→ **`collected` ≈ 350–450** for a representative match.

**Gold is NOT arena-only.** Kills, assists, and passive income fire in *every* mode — `processPassiveGoldIncome()` runs unconditionally each round (`battle.js:11470`), and kill/assist gold is granted on death with no mode check (`battle.js:6363`). The *objective* bonuses (nexus, hourglass) are the only mode-specific income, and they intentionally pay out in the more complex objective modes. Per-mode banked averages (win/loss blended):

| Mode | Banked / match | Matches per 5,000 unit |
|---|---|---|
| **Team Deathmatch** | ~400–525 | **~10–12** |
| **Gauntlet** | ~380–470 | **~11–13** |
| FFA / CTF | ~380–470 | ~11–13 |
| **Arena** | ~600–700 | **~7–8** |
| Domination | ~550–650 | ~8–9 |

This is the desired shape: the bread-and-butter modes (TDM, gauntlet) land on the "~10 matches" target, while arena/domination pay ~30–40% more for their added objective complexity — achieved with no per-mode price logic, purely from the objective income that already exists.

**Banked per match.** `+50` base, then on a win `× 1.5` (and up to `× 1.5625` more with both bonuses):
- Average across wins **and** losses, all modes: **≈ 450–500 gold/match.**
- A flawless wipeout win tops out near ~1,000; a quiet loss floors around ~250.

**Therefore:** `10 matches × ~500 ≈ 5,000` → `ACCT_UNIT_PRICE = 5000`. In practice this lands at **~10–12 matches per unit** (slightly conservative, which reads as "10-ish" and leaves headroom if players farm efficiently).

**Full-collection cost (sanity check).** Roster is ~95 units; new accounts own 12 starters + 1 free token = 13, leaving **~82 locked**. At 5,000 each that's **~410,000 gold ≈ ~820 matches** to own everything. That is an intentional long-tail collection chase — appropriate for a PvP collection game, but it IS the headline grind number. Levers if it feels too steep:
- **Lower the price** (e.g. 3,500 ≈ 7 matches → ~570 matches total).
- **Periodic free tokens** — grant `ACCT_FREE_TOKENS` on milestones (every N ranked wins, ELO tiers, or login streaks) to give a steady non-gold drip without touching the price.
- **Escalating price** — keep the first few unlocks cheap and ramp later ones, if you want fast early variety and a slow endgame. (Breaks the "flat, same for all" promise in §1, so only if intended.)

Keep the table above in sync with `GOLD_PER_*` if those constants change — the price is derived from them.

---

## 1. STARTER SET

New accounts own these 12 race keys, each playable in its default job (`RACE_DEFAULT_JOBS[key]`):

```js
const ACCT_STARTER_UNITS = [
  'men in black',   // Agent
  'wizard',         // Black Mage
  'werewolf',       // Raider (default job in code; do not rename)
  'mad scientist',  // Engineer
  'homosapien',     // Freelancer
  'catgirl',        // Gunslinger
  'fortune teller', // Harbinger
  'bigfoot',        // Harvester
  'grey',           // Psychic
  'marksman',       // Sniper
  'knight',         // Warrior
  'fairy',          // White Mage
];
```

All keys verified present in `AVAILABLE_RACES`. Every other entry in `AVAILABLE_RACES` (~82 more) starts **locked**.

**Unlock grain = race key.** Unlocking a race grants ALL genders that race supports (`getAvailableGendersForRace()`); gender is never a separate purchase. Cowboy/Cowgirl, male/female Werewolf, etc. all come together under one unlock. No special casing — `men in black`, `wizard`, `mad scientist`, etc. are already distinct race keys with their own profiles/stats/abilities, so they are ordinary individual unlocks like any other unit.

---

## 2. PERSISTENCE — D1 is the source of truth

### 2a. Schema (`d1-schema.sql` + a migration the server runs on boot)

Add to the `players` table:

```sql
ALTER TABLE players ADD COLUMN gold INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN unlocked_units TEXT NOT NULL DEFAULT '[]'; -- JSON array of race keys
ALTER TABLE players ADD COLUMN free_tokens INTEGER NOT NULL DEFAULT 0;
```

On account creation (`POST /api/register`): set `gold = ACCT_STARTING_GOLD`, `free_tokens = ACCT_FREE_TOKENS`, `unlocked_units = JSON.stringify(ACCT_STARTER_UNITS)`.

**Migration for existing accounts:** any player row whose `unlocked_units` is empty/`'[]'` on next login gets backfilled with the starter set + `free_tokens = ACCT_FREE_TOKENS`. Do not strand existing ELO accounts with an empty roster.

### 2b. Server endpoints (`server.js`, using `d1.js` helpers; all authenticated by the player's `token`)

- **GET `/api/economy/:id`** → `{ gold, unlockedUnits: [...], freeTokens }`. Extend the existing `/api/player/:id` payload OR add this; either is fine.
- **POST `/api/economy/bank`** — body `{ token, matchGold, mode }`. Validate token → player. **Clamp** `matchGold` to `[0, ACCT_MATCH_GOLD_CAP]`. `gold += clamped`. Reject if `mode` is not a real PvP mode id. Return new balance. (See §6 integrity.)
- **POST `/api/economy/purchase`** — body `{ token, raceKey, useToken }`. Validate: `raceKey ∈ AVAILABLE_RACES`, not already in `unlocked_units`. If `useToken` and `free_tokens > 0`: decrement token, add unlock. Else require `gold >= ACCT_UNIT_PRICE`: `gold -= ACCT_UNIT_PRICE`, add unlock. Must be **atomic** (single UPDATE guarded by a re-read or `WHERE gold >= price`) so double-clicks can't double-spend. Return `{ gold, unlockedUnits, freeTokens }`.

### 2c. Client mirror

On login/auto-login (`profile.js` `serverLogin`/`serverAutoLogin`), fetch economy and cache it on the active profile (`p.account = { gold, unlockedUnits, freeTokens }`) as a read mirror. **All spend/grant decisions are server responses** — never trust the local mirror for purchases. Extend `backfillProfile` to seed `p.account` for local-only/offline play (offline uses starters only, no purchasing).

---

## 3. OWNERSHIP CHECK — one helper everything routes through

```js
function isUnitUnlocked(raceKey) {
  if (window._DEV_UNLOCK_ALL) return true;            // dev override, view-layer only
  const acct = getActiveProfile()?.account;
  if (!acct) return ACCT_STARTER_UNITS.includes(raceKey); // offline fallback
  return acct.unlockedUnits.includes(raceKey);
}
```

Use this everywhere a unit can be selected, shown, or built. Never read the unlock list directly elsewhere.

---

## 4. MATCH-END BANKING (PvP)

Hook a **new** code path in `battle.js` victory handling — do **not** modify the existing Challenge path (the `if (playerWon)` block that writes `save.gold`). Gate the new path on "this is a PvP/multiplayer match" (use the existing multiplayer-mode check, e.g. `getActiveMultiplayerMode()`), and explicitly skip it for **devsim/bot/practice** matches so they grant nothing.

Steps:
1. `collected = state.units.filter(u => u.player === viewerPlayer).reduce((s,u)=>s+(u.gold||0),0)` (dead included).
2. Determine `playerWon`, `noFriendlyDeaths`, `allEnemiesDead` from final state.
3. Compute `matchGold` via the formula in §0.
4. `POST /api/economy/bank`; update the local mirror from the response.
5. Render the breakdown on the existing victory screen (it already hosts MVP awards / achievements). Show an itemized count-up that plays **even on a loss**:
   `Match Complete +50 · Gold Collected +N · Win ×1.5 · Flawless ×1.25 · Wipeout ×1.25 → +TOTAL`
   Coins fly into the wallet; reuse a satisfying SFX (e.g. the family used by `playSfx('levelUp')`). Land on the new balance.

---

## 5. UI

### 5a. Wallet display — ONE reusable component
Persistent gold readout shown in: main-menu top bar, shop, party builder, post-match. Animates on change. Single implementation, do not reimplement per screen. Match the existing gold visual language (`💰` + `--gold` / `#b8a060`).

### 5b. Shop page (new top-level menu screen)
- Grid of **all** `AVAILABLE_RACES`. Owned = checkmark/subtle highlight + not buyable. Locked = buyable (`ACCT_UNIT_PRICE`) or token-redeemable.
- **Featured shelf** up top: small rotating set (e.g. 3–4 locked units, daily rotation by date seed) for discovery.
- **Search + filters** (type / faction / job / owned·locked) + sort — ~95 units; a flat list is not acceptable. Reuse the Codex filter pattern (`cdx-filter-*`).
- **Preview before buy:** clicking a unit opens the existing Codex dossier renderer (`_codexRenderDossier`) as the detail panel so players inspect stats/abilities/sprite first.
- **Confirm-purchase** dialog. On success: unlock fanfare + SFX + the unit's dossier "declassifies" (reveal animation). Lean into the Codex "Intelligence Division / TOP SECRET" theme — buying = declassifying the file.
- **Affordance badge:** show an indicator on the main-menu Shop button when `gold >= ACCT_UNIT_PRICE` (you can afford something).
- Free tokens: if `freeTokens > 0`, any locked unit shows a "Use Free Unlock" option alongside the gold price; routes through `purchase` with `useToken: true`.

### 5c. Codex
- Locked units: replace sprite with silhouette/`❓` and render a **fully redacted dossier** (the Codex already does ████ redaction — max it out for locked entries). Unlocked = normal dossier.
- Add a **collection meter** in the Codex header: `unlockedCount / AVAILABLE_RACES.length` ("vessels declassified").

### 5d. Party builder ("Codex of Vessels" roster)
- Locked units appear locked and **non-selectable**; tapping a locked unit offers a jump-to-shop shortcut.
- **Saved team presets / unit builds** may reference now-locked units (existing data). Do not crash: render those slots as locked/greyed with a "locked — unlock to use" state; block entering a match with a locked unit in the team. (Grandfathering is acceptable if simpler, but blocking-at-match-start is the safe default.)

### 5e. Onboarding free-pick ceremony
After profile creation, present a one-time reveal: "Choose your first unit." Player picks any locked unit from the full roster (starters shown as already-owned so the pick isn't wasted). Selection routes through `purchase` with `useToken: true`. This is just the token flow with a dedicated first-run presentation — no separate purchase mechanism.

### 5f. Dev toggle (main menu)
- A toggle that sets `window._DEV_UNLOCK_ALL = true` (and a companion "Grant 99999 Gold" dev button that POSTs to a dev-only bank route or just inflates the local mirror for UI testing).
- `_DEV_UNLOCK_ALL` is **view-layer only**: `isUnitUnlocked()` returns true, but NOTHING is written to the profile or D1 — it cannot corrupt the real account and cannot ship enabled.
- Gate visibility of the toggle behind a dev flag: render it only when `localStorage.getItem('ew-dev') === '1'` OR URL has `?dev=1`. Label the dev-unlocked state clearly in the UI so it's never confused with real ownership.

---

## 6. INTEGRITY — be explicit about the v1 gap

Gold is currently tallied **client-side** (`unit.gold`, `processNexusIncome` in `ui.js`, `GOLD_PER_*` in `data.js`); nothing is server-tracked. So in v1 the client reports `matchGold` to `/api/economy/bank`, which is spoofable.

v1 mitigations (do all):
- Server **clamps** banked gold to `ACCT_MATCH_GOLD_CAP` per match.
- Bank only for recognized PvP mode ids; reject devsim/bot/practice.
- Purchases and balance are fully server-authoritative and atomic, so even a spoofed bank can't exceed the cap or create negative balances.

Flag as a **follow-up (before real-money launch):** move Nexus/kill/gold tallying to server-owned match state so the banked figure is derived server-side, not reported by the client. This is a larger task than the wallet and is out of scope for v1.

---

## 7. SCOPE GUARDS
- **Do not touch Challenge mode** (`state.campaignSave`, `save.gold`, `_cshop*`, the `if (playerWon)` Challenge banking block). It keeps its own separate economy.
- Account gold and Challenge gold are independent wallets that never mix.
- No mid-battle shop work — that system is gone; don't reference it.

---

## 8. VALIDATION
- `node --check` every modified `.js` before delivery.
- Manually verify: new account → owns 12 starters + 1 token; loss banks `base + collected`; clean wipeout win banks `(base+collected) × 1.5 × 1.25 × 1.25`; purchase deducts exactly `ACCT_UNIT_PRICE` and is double-click safe; dev toggle unlocks all in UI without writing to D1; existing ELO account logs in and gets backfilled starters.
- Deliver complete files.
