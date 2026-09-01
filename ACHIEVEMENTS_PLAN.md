# ACHIEVEMENTS_PLAN.md — Achievements, Records & Progression

*Written 2026-08-31. Supersedes and expands ROADMAP.md §6 ("Achievements & profile").
Every file:line cite below was verified against the repo on this date. Research
sources for the industry sections are linked inline.*

**Goal (from the request):** make the game more addicting for completionists and
give a PvP-only game a long-term purpose — tiered milestone achievements per
champ and per profile, personal records with real in-game "juice" when broken,
all viewable on the profile with progress, working offline for vs-CPU, and with
a clear story for Steam.

---

## Table of contents

- [0. Direct answers to the questions in the request](#0-direct-answers)
- [1. What exists today — and what's broken (the "Flawless Victory" mystery)](#1-current-state)
- [2. Research: how other games actually do this](#2-research)
- [3. Architecture](#3-architecture)
- [4. The achievement catalog](#4-catalog)
- [5. Records / high scores + the juice spec](#5-records)
- [6. UI: popups, post-match screen, profile](#6-ui)
- [7. Server sync (D1) — durable, cheat-resistant-enough](#7-server-sync)
- [8. Steam plan](#8-steam)
- [9. Phased rollout](#9-phases)
- [10. Open decisions (with recommendations)](#10-decisions)
- [Appendix A: metric → code hook reference](#appendix-a)
- [Appendix B: counters that must be added](#appendix-b)

---

<a name="0-direct-answers"></a>
## 0. Direct answers to the questions in the request

**"It constantly says Flawless Victory when the games definitely weren't flawless."**
*(Corrected 2026-08-31 — the user's skepticism was right; the original answer
here was incomplete.)* Two things stack on the victory screen and BOTH were
bugged:
(a) The *gold-bonus chip* labeled `Flawless ×1.25` claimed "no friendly unit
died" but tested it by scanning `u.dead` **at match end**
(battle.js `_accountBankMatchGold`). Every economy mode (arena/tdm/clash) has
respawns — `defeatUnit` schedules `_respawnIn` and `processRespawns` revives
the unit with `dead = false` at full HP — so any unit that died and respawned
passed the check. **The chip fired on matches with any number of friendly
deaths, as long as nobody was mid-respawn at the final buzzer.** Fixed: the
condition now requires the per-life counter `_matchDeaths` (incremented in
`defeatUnit`, never cleared by respawn) to sum to 0 across the viewer's team,
and the chip is renamed `Deathless ×1.25`.
(b) The `Perfect Victory` *achievement* had the SAME respawn-blind check
(`aliveUnitsFor(...)` count) **plus** the persistence bug (§1.2) that made it
re-toast every win. Both fixed.

**"It says x/14 achievements but doesn't say what they are."**
There ARE 14 defined achievements with names and descriptions
(battle.js:9332-9403, full list in §1.1) — the victory screen just renders a
bare `N / 14` count with no names (battle.js:26031-26038). The full list lives
in the Profile screen → Achievements tab, which nothing points you to. And due
to the persistence bug the count is stuck at 0/14 for most players. §6 replaces
this display entirely.

**"We're saving all this on localStorage? How does that work on Steam?"**
Yes — today everything is localStorage (`ew-profile-<slot>`). That's fine as the
*primary local store* and it keeps working inside the Steam build (the Electron
wrapper is still Chromium with its own persistent localStorage). The plan makes
it durable in two independent ways: (1) sync progress to your existing D1
database through the account system you already have (§7), and (2) on Steam,
mirror the curated achievement set into Steamworks, where the Steam client
itself handles offline caching and re-sync (§8). You do **not** need to buy a
new server — the Render + D1 stack you already run is exactly the right shape
for this.

**"I want offline play; achievements should still track for PvCPU."**
Yes, and this is the easy case: vs-CPU runs entirely client-side, so tracking
works with zero connectivity. Counters are stored locally, queued, and merged to
the server whenever you next go online (§7's merge design makes this safe to
retry). On Steam, the Steam client additionally caches achievement unlocks
earned offline and uploads them when reconnected — that's built-in Steamworks
behavior, confirmed in Valve's docs (§2.1).

**"Track online PvP and PvCPU separately?"**
Track every counter with a context split `{pvp, cpu}` internally. Achievement
tiers count the **sum** (offline play must feel first-class — that's the point),
but **records** get two boards (a record farmed vs Easy CPU shouldn't overwrite
your real PvP best), and the profile can show the split for any stat. Ranked-
only achievements can be added later and count only server-verified results.
Details §3.4.

**"How do other indie/AAA games handle online achievements?"**
Short version (§2): almost everyone — including PvP indies — ships
*client-trusted* achievements and accepts that profile-forgery tools exist,
because a forged achievement only pollutes the forger's own profile. The only
server-authoritative machinery worth having is the one you already planned for
ranked integrity (ROADMAP §5): once match summaries are server-reported, the
server can increment online counters itself. Valve explicitly supports mixing
client-set and server-set achievements per-achievement.

**"Is Steam achievements/profile integration even worth it?"**
Yes, emphatically, *for your stated audience*. Steam shows global unlock
percentages, completionists chase 100% ("perfect games" are tracked on
profiles), and every player's profile has an automatic "Rarest Achievement
Showcase". For a game targeting 100%-hunters, Steam achievements are free
retention and free marketing. The work is small once the Electron wrap exists
(§8) — the expensive part (the tracking layer) is needed anyway for the in-game
system.

---

<a name="1-current-state"></a>
## 1. What exists today — and what's broken

### 1.1 The existing 14 achievements

`ACHIEVEMENT_DEFS` battle.js:9332-9403 — binary (one-shot forever), checked at
scattered call sites, toast on unlock, listed in Profile → Achievements tab
(profile.js:1061-1097):

| id | name | condition | awarded at |
|---|---|---|---|
| `firstBlood` | First Blood | first kill of the match | battle.js:19710 |
| `doubleKill` / `tripleKill` / `rampage` | Double/Triple Kill, Rampage | 2 / 3 / 4+ kills in one turn by one unit | battle.js:8715-8717 |
| `overkill` | Overkill | ≥50% of target max HP as excess damage | battle.js:9328 |
| `lastStand` | Last Stand | trigger Last Stand (<20% HP) | battle.js:9309 |
| `ace` | Ace | *says* "win by elimination", **actually fires on any win** | battle.js:28934 |
| `untouchable` | Untouchable | win with a unit that took 0 damage | battle.js:28940 |
| `critMaster` | Crit Master | 3+ crits in one match | battle.js:41157 |
| `comboKing` | Combo King | 3+ combos in one match | battle.js:43408 |
| `weatherSurvivor` | Storm Survivor | win with 2+ active weather events | battle.js:28947 |
| `perfectVictory` | Perfect Victory | win without losing any units | battle.js:28936 |
| `winStreak3` / `winStreak5` | Hot Streak / Unstoppable | 3 / 5 wins in a row | battle.js:9577-9578 |

These are all keepers — they become the seed of the "Feats" category (§4.6) with
their conditions fixed.

Also already in place and directly reusable:

- **Per-unit per-match counters** (achievement fuel that already exists):
  `_matchKills, _matchDeaths, _matchAssists, _matchCrits, _matchDodges,
  _matchCombos, _matchFollowUps, _matchBounties, _matchCounters, _trackDmgDealt,
  _trackDmgReceived, _trackHealDone, _trackHealReceived, _statusesApplied,
  _statusLog, _itemLog`.
- **Career aggregates** in the profile (profile.js:15-24): kills, damage,
  healing, crits, dodges, counters, streaks, per-class/per-race stats.
- **Match summary object** `buildProfileMatchSummary` (profile.js:658-733) with
  per-unit stats + MVP, kept in a 100-deep match history.
- **A single damage chokepoint** (`applyDamageToUnit` battle.js:19036), a single
  heal chokepoint (battle.js:8260), a single kill-credit block
  (battle.js:19681), a single status-application funnel (battle.js:6022), and a
  banner queue (`showCombatBanner` map.js:7298) — i.e. the engine is already
  shaped for event tracking.

### 1.2 The bugs (fix these before building anything — Phase 0)

> **Status 2026-08-31: Phase 0 implemented.** All seven items below are fixed,
> plus an eighth found during implementation: **the "no friendly deaths" test
> itself was respawn-blind** (see §0 first answer). Both the economy chip and
> `perfectVictory` now sum per-life `_matchDeaths` instead of scanning `u.dead`
> at match end, and the wipeout chip / `ace` key on
> `state._winCondition === 'wipeout'`.

1. **Achievements never persist without an active profile slot.**
   `profileSaveAchievements` silently bails when `getActiveProfileIndex()` is
   null (profile.js:319-321), and because `window.ProfileSystem` exists, the
   legacy localStorage fallback in battle.js is *never* reached
   (battle.js:9426-9443). Net effect with no profile selected: the store is
   permanently empty ⇒ `Ace` + `Perfect Victory` re-toast on **every** win and
   the career counter shows 0/14 forever. **This is the "constantly says
   flawless" bug.**
   *Fix:* auto-create + auto-activate profile slot 0 on first boot (one-time,
   named "Player"), and make the save path fall back to a global key instead of
   silently dropping data. Every other system (career stats, economy, match
   history) has the same silent-drop failure mode and benefits from the same
   fix.
2. **`ace` condition is wrong** — fires on any win; gate it on
   `state._winCondition === 'wipeout'`.
3. **`_repairAchievementStore` (battle.js:9414-9422) deletes every unlock dated
   before 2026-07-27 on every load.** It was a one-time repair; remove it.
4. **Win-condition naming mismatch corrupts match history.** The engine writes
   `'wipeout' | 'tower_destroyed' | 'hourglasses_collected' | 'nexus_dominance'
   | 'most_kills' | 'arena_composite' | ...` (battle.js:49384-49573), but
   profile.js:674-681 maps against a *different* set of strings
   (`'tower_destruction'`, `'score_limit'`, …), so nearly every match-history
   entry records `winCondition: 'elimination'`. All the "wins by X" achievement
   lines depend on this being fixed. *Fix:* store the engine string verbatim in
   the summary; do display-mapping in the UI only.
5. **Victory screen shows a bare `N / 14`** with no names
   (battle.js:26031-26038) — replaced in §6.2.
6. **Real-time (Strike) mode gaps:** its crit roll doesn't increment
   `_matchCrits` (battle.js:14825) and its cleanse doesn't count cleanses
   (battle.js:14672). Fix while touching those counters.
7. **Cosmetic but confusing:** rename the economy chip `Flawless ×1.25` →
   `Deathless Bonus ×1.25` with a subtitle ("won without losing a unit") so it
   stops reading as a false judgment of the match. (Constant stays
   `ACCT_FLAWLESS_MULT` — renaming display text only; **do not** touch the
   `ACCT_*` literals without running `npm run test:parity`.)

---

<a name="2-research"></a>
## 2. Research: how other games actually do this

### 2.1 Steamworks mechanics (the facts that shape the design)

- **Stats vs achievements.** Steamworks has named int/float **stats**
  (`SetStat` → `StoreStats()`) and binary **achievements**
  (`SetAchievement`). An achievement can be **stat-backed**: you define
  "unlocks when stat X ≥ N" in the Steamworks admin panel and Steam unlocks it
  automatically when the uploaded stat crosses the threshold — this also gives
  you the green progress bar on the Steam community page for free. Progress
  toasts ("47/100") are manual via `IndicateAchievementProgress`.
  ([ISteamUserStats](https://partner.steamgames.com/doc/api/ISteamUserStats),
  [Step by Step: Achievements](https://partner.steamgames.com/doc/features/achievements/ach_guide))
- **Offline works out of the box.** Valve: "Steam keeps a local cache of the
  stats and achievement data so that the APIs can be used as normal in offline
  mode"; pending data uploads on next connection, and StoreStats is effectively
  auto-flushed at process exit. Caveat: the game must have been run online at
  least once so the client has the schema.
  ([Stats and Achievements](https://partner.steamgames.com/doc/features/achievements))
- **Call pattern:** `SetStat`/`SetAchievement` are cheap and idempotent;
  `StoreStats()` (which triggers the overlay toast) should be called at major
  boundaries — for us: **end of match**. Re-asserting already-unlocked
  achievements is a safe no-op, so a boot-time "re-assert everything unlocked
  locally" loop makes local profile and Steam converge automatically.
- **The 100-achievement limit.** Since 2018 new games are capped at 100
  achievements until they pass Valve's legitimacy "confidence metric"
  ([Game Developer](https://www.gamedeveloper.com/business/valve-introduces-limits-for-new-games-to-prevent-fake-ones-from-gaming-steam)).
  With 96 champs, the in-game grid (§4.1) can NEVER be 1:1 Steam achievements —
  Steam gets a curated subset (§8.2), the in-game system is unlimited.
- **Server-set achievements exist** ("Set By: GS / Official GS" per
  stat/achievement, written via `ISteamGameServerStats` or the publisher-key
  WebAPI `SetUserStatsForGame` — never ship that key in a client). Games rarely
  use it; it's there if ranked-only achievements ever need to be forgery-proof.
  ([ISteamGameServerStats](https://partner.steamgames.com/doc/api/ISteamGameServerStats))

### 2.2 Trust model — what the industry actually does

Steam Achievement Manager (SAM) has let users forge any client-settable
achievement for over a decade; Valve doesn't police it and leaves protection to
developers. The overwhelming norm — including for PvP indies — is: **ship
client-trusted achievements, keep anything with *competitive* integrity (ELO,
ranked records shown to opponents) server-side.** A forged achievement harms
only the forger's profile. This matches the architecture you already have and
the hardening path already planned in ROADMAP §5 (dual-report → server-side
match summaries). Design rule that falls out: never gate matchmaking or another
player's experience on achievements.

### 2.3 Offline-first sync

Monotonic counters merged by `max()` are a formally correct, conflict-free
pattern (the **G-Counter CRDT** — commutative, idempotent, safe under retries
and multi-device drift;
[state-based CRDTs](https://www.bartoszsypytkowski.com/the-state-of-a-state-based-crdts/)).
Achievement sets merge by union. This means the client can push its full local
progress blob at any time, as many times as it wants, in any order, and the
server merge never double-counts or loses data. No outbox/queue machinery
needed — "sync = push blob, receive merged blob" (§7).

### 2.4 Design lessons worth obeying

- **Grind tiers are only fun when they overlap natural play** (McClanahan,
  ["Achievement Design 101"](https://www.gamedeveloper.com/design/achievement-design-101)).
  A 10,000-tier is fine for statuses applied (~40-80/match) — it lands after a
  few hundred matches; it's hostile for something you do twice a match. §4
  applies per-metric volume sanity to your requested tiers (kept almost all,
  flagged two).
- **Prefer achievements that certify skill or invite experimentation** over
  attendance rewards (Hecker, GDC 2010,
  ["Achievements Considered Harmful?"](http://www.chrishecker.com/Achievements_Considered_Harmful%3F)).
  This is what the Feats category is for — Tactical Breach Wizards is the
  reference point: mechanic-mastery stunts with funny names.
- **Into the Breach's masterstroke:** every achievement pays out the currency
  that unlocks squads — the achievement system IS the progression system
  ([ItB achievements](https://intothebreach.fandom.com/wiki/Achievements)).
  You already have the exact analogue sitting unbuilt: the free-token drip
  designed in unitunlockeconomy.md:80 and gold via `creditLocalGold`. §4.7
  wires tier rewards into that economy — with 96 champs at 5,000g each, this
  is the single strongest "purpose to play more" lever in this whole plan.
- **A few sub-5% rares** feed Steam's automatic Rarest Achievement Showcase on
  player profiles — deliberately include 3-5 brutal ones.
- **Completion reality check:** even beloved games average ~15-30% per-
  achievement unlock rates; most owners never finish. The tier ladder exists so
  everyone always has a *next* beat, not so everyone reaches the top.
- **Genre reference structures** (verified lists): Into the Breach = 25 global +
  3 bespoke per squad; Wildermyth = content coverage × difficulty; Tactical
  Breach Wizards = joke-named mechanic stunts; Fights in Tight Spaces =
  per-deck completion + constraint runs. Common spine: mode completion +
  content coverage (per-champ) + skill feats + a few rares, minimal raw grind.

### 2.5 Web-tech on Steam (confirms LAUNCH_READINESS §6)

Electron is the proven wrapper (Vampire Survivors shipped on it; CrossCode on
NW.js; shapez, Game Dev Tycoon likewise web-tech). For the Steamworks binding:
**steamworks.js** ([ceifa/steamworks.js](https://github.com/ceifa/steamworks.js/))
works but its last npm publish was Aug 2024 (stalled);
**steamworks-ffi-node** is young but actively published through Aug 2026.
Decision belongs at wrap time — which is why §8.1 hides the binding behind a
4-function interface so it's swappable in an afternoon.

---

<a name="3-architecture"></a>
## 3. Architecture

### 3.1 Placement (RULE #1 compliant — no new game files)

| What | Where | Why |
|---|---|---|
| **Catalog registry** `ACH_CATALOG` (defs, tiers, metric ids, categories) + `ACH_RECORD_DEFS` | **data.js** | data.js is the registry home (`STATUS_DEFS`, `COMBO_REGISTRY`, …) and loads headlessly via load-data.js ⇒ a repo-side `achievements.test.js` can validate the catalog (unique ids, ascending tiers, metric ids known) in `npm test`. |
| **Runtime**: `trackAch(metric, n, ctx)`, tier-cross checks, record checks, commit-at-match-end, popup dispatch | **battle.js** | next to the existing `checkAchievement`/toast machinery it replaces/absorbs. |
| **Persistence + merge**: `profile.progress` schema, load/save, server sync client | **profile.js** | it owns the profile blob and the server glue already. |
| **Per-match staging** `state._achTally` | **state.js** (declaration) | lives on `state` so it rides online `state-sync` automatically (§3.3). |
| Popup CSS | styles-animations.css / styles-cinematic.css | existing banner styles live there. |
| Server | server.js + `migrations/004_progress.sql` | §7. |
| Tooling | new repo-root `achievements.test.js` (allowed — dev tooling, not an R2 file) | wired into `npm test`. |

Every delivery that touches an R2 file ships with an index.html `?v=` bump per
RULE #1b.

### 3.2 The tracking spine

One entry point, called from the ~20 hook sites in Appendix A:

```js
// battle.js
function trackAch(metric, n, ctx) {
    // ctx: { player, unit?, race?, ... }   — player is REQUIRED
    if (state.devAutoSim || _balanceSimMode) return;        // existing exclusions
    const t = state._achTally[ctx.player];                  // {metric: n} bag
    t[metric] = (t[metric] || 0) + n;
    if (ctx.race) { /* per-champ sub-bag: t.champs[race][metric] */ }
    if (ctx.player === getViewerPlayer()) _achCheckLive(metric, ctx); // popups
}
```

- **`state._achTally = {1: {...}, 2: {...}}`** — a per-player bag of this-match
  deltas, reset where `state.matchKills` is reset (battle.js:29388, 31235).
  Because it's on `state` and NOT in `_serializeState`'s skip list, **it reaches
  the online guest through the existing state-sync pipe with zero new relay
  code** (RULE #2 — see 3.3).
- Many metrics don't even need live `trackAch` calls: per-unit `_match*`
  counters already accumulate and can be folded into the tally at commit time
  (kills, crits, dodges, combos, follow-ups, heals, damage). Live calls are
  only needed for (a) metrics with no per-unit counter yet (Appendix B) and
  (b) metrics that should pop mid-match.
- **Commit** happens once per match, in **all four terminal paths**:
  `finalizeMatch` (battle.js:28880, next to `updateCareerStatsAfterMatch`),
  `finalizeCampaignBattle` (battle.js:28446), `_mdEndRun` (battle.js:28261),
  and Strike-RT `_checkEnd` (battle.js:15281). Commit = fold the viewer's tally
  + per-unit counters into `profile.progress`, evaluate tier crossings, append
  match-end unlocks, save profile, kick a server sync (§7).
- **Abandoned matches commit nothing** — quitting mid-match discards the tally.
  That's both simple and a natural anti-farm guard.
- **Live popups** check `profile base + tally so far` against tier thresholds on
  each `trackAch` for the viewer's own side, so "100th kill" pops the moment it
  happens, not at match end (§6.1).

### 3.3 Online parity (RULE #2) — how the guest gets counted

Host-authoritative model: engine hooks only run on the HOST. The design makes
that a non-issue:

- The host's engine fills `state._achTally` for **both** players; the tally and
  the per-unit `_match*` counters arrive at the guest via normal `state-sync`
  snapshots.
- Each client **commits only its own side** at match end against its own local
  profile (exactly how career stats already work — both clients run
  `finalizeMatch`-side profile updates today).
- The guest fires its own live popups by **diffing its side of the tally** each
  time a snapshot applies (online.js `state-sync` handler): tier crossings and
  record breaks are *viewer-local* decisions (they depend on MY profile, which
  the host doesn't know), so no new relay events are required for correctness.
  Popups on the guest may lag by one sync tick — imperceptible.
- **Record-break juice on the guest** (§5) hooks the guest's own
  display path the same way. Implementation must verify per RULE #2 how
  floating damage text reaches the guest today (relay wrapper vs derived) and
  attach the "record" styling at the *display* site, not the engine site.
- New `state._achTally` field ⇒ check `_serializeState`'s skip list — it must
  **not** be skipped. Per-champ sub-bags keep it small (it's deltas, not
  totals).
- Fog rule: achievements never reveal hidden info. All popups reference the
  viewer's own units/actions; nothing keys to enemy positions.

### 3.4 PvP / CPU split, and what counts

Every counter is stored as `{pvp, cpu}` (`isOnlineMatch()` state.js:3998
decides the bucket at commit time).

| Question | Policy |
|---|---|
| Do CPU matches progress achievements? | **Yes** — tiers threshold on `pvp + cpu`. Offline is first-class (the whole point). |
| Records | **Two boards**: PvP and vs-CPU, never mixed (§5). |
| Dev auto-sim / balance sim / sandbox | Never counts (existing `state.devAutoSim` + `_balanceSimMode` guards). |
| Challenge (gauntlet/survival), Dungeon | Combat metrics count into the `cpu` bucket; their *wins* feed their own achievement lines, not Arena/TDM lines. |
| Mode-win lines ("Arena wins" etc.) | Keyed on `getActiveMultiplayerMode()` + `state._winCondition` at commit. Both PvP and CPU count (split stored, displayed). |
| Ranked-only lines (future) | Add later, counting only server-confirmed results (§7.3). |

### 3.5 Data schema (profile.js — profile blob v2)

```js
profile.progress = {
  v: 2,
  counters: { statusesApplied: {pvp:0, cpu:0}, debuffsApplied: {...}, ... },
  champs:   { 'swordfighter': { kills:{pvp,cpu}, wins:{pvp,cpu}, deathless:{pvp,cpu} }, ... },
  records:  { biggestHit: { pvp: {value, ts, meta}, cpu: {value, ts, meta} }, ... },
  unlocked: { 'crits.3': 1756600000000, 'feat_ace': ..., ... },  // achId.tierIdx -> ts
}
```

- The old 14 ids are grandfathered: existing `profile.achievements` entries
  migrate into `unlocked` as `feat_*` single-tier entries (keep unlock
  timestamps).
- Career aggregates that already exist (`career.kills`, wins, …) seed the
  matching counters on migration so long-time players don't restart at zero.
  (Career tracked no pvp/cpu split — seed into `cpu` if `career` predates the
  split, or split by summing match history where available. Simplest honest
  option: seed into a third `legacy` bucket that counts toward tiers but not
  either board. Decide at implementation; recommendation: `legacy` bucket.)
- Monotonic by construction: counters only ever increase; records only ever
  max; unlocked only ever unions ⇒ trivially merge-safe (§2.3, §7).

---

<a name="4-catalog"></a>
## 4. The achievement catalog

Conventions:

- **5 standard tiers** named **I–V** with rarity colors
  *Bronze / Silver / Gold / Diamond / **Entropic*** (the 6-step ladders get all
  six; 4-step ladders stop at Diamond). "Entropic" is the prestige color — the
  profile renders it with the entropy-gauge purple glow.
- Ladder values below are exactly the requested ones unless marked ⚠
  (volume sanity note) or ★ (my addition).
- `metric` names the counter in `profile.progress`; Appendix A maps each metric
  to its code hook; Appendix B lists the counters that don't exist yet.

### 4.1 Champion mastery (per-champ — 96 champs, in-game only; Steam gets the collapsed set §8.2)

Per champ (= race, `AVAILABLE_RACES`, 96 entries):

| line | metric (per-champ) | tiers |
|---|---|---|
| Kills | `champs[race].kills` | 1 / 10 / 100 / 500 / 1000 |
| Wins | `champs[race].wins` | 1 / 10 / 100 / 500 / 1000 |
| Deathless matches (champ survives the whole match — and the match is won ★, else it's farmable by hiding) | `champs[race].deathless` | 1 / 10 / 50 / 100 |

- "Win with champ X" = X was on your deployed team when you won. "Kills with X"
  = kill credit to a unit of race X (killer resolution battle.js:19681 → fold
  per-unit `_matchKills` by `unit.race` at commit).
- **Champion Mastery meta-line ★** (this is the completionist hook): a champ is
  *Mastered* at Kills III + Wins III + Deathless II. Meta-achievements: Master
  1 / 5 / 10 / 25 / 50 / **all 96** champs ("Heat Death" — the final 100% chase).
- ⚠ 1000 wins *per champ* × 96 champs is astronomically beyond any human play
  (100,000+ matches). Keep the ladder (it's a per-champ ladder, players push
  1-3 mains), but the *meta*-line above is deliberately keyed to tier III, not
  V, so 100%ing the meta doesn't require inhuman grind. Tier V exists for mains
  and for the Rarest Showcase.

### 4.2 Profile-wide combat & support

| line | metric | tiers | notes |
|---|---|---|---|
| Statuses applied | `statusesApplied` | 1/10/100/500/1000/10000 | any status you apply (battle.js:6131) |
| Debuffs landed | `debuffsApplied` | 1/10/100/500/1000/10000 | `STATUS_DEFS[id].kind==='debuff'` (48 defs) |
| Buffs granted | `buffsApplied` | 1/10/100/500/1000/10000 | `kind==='buff'` (55 defs); (the request's "10000 debuffs" under Buff read as a typo for buffs) |
| Heals applied | `healsApplied` | 1/10/100/500/1000 | count heal *casts* on others; also track `healingDone` amount for records. Self-heals excluded (farmable) ★ |
| Statuses cleansed | `cleansesDone` | 1/10/100/500/1000 | debuffs removed from allies (battle.js:46059) |
| Crits landed | `critsLanded` | 1/10/100/500/1000/10000 | ⚠ only basic attacks crit (~5-15/match) ⇒ 10000 ≈ 1000+ matches — intentionally Entropic-tier, keep |
| Attacks dodged | `attacksDodged` | 1/10/100/500/1000/10000 | your units evading (battle.js:41231); exclude `_blindMiss` (that's the enemy's debuff, not your dodge) |
| Backstabs | `backstabs` | 1/10/100/500/1000 | `_atkArc==='back'` (battle.js:41246) |
| Opportunity strikes | `oppStrikes` | 1/10/100/500/1000 | your unit punishes a retreat (battle.js:575) |
| **Pincers** (the "both sides" mechanic — in code it's the **Follow-Up Attack**, battle.js:41395) | `followUps` | 1/10/100/500/1000 | `_matchFollowUps` already counts it; cheapest line on this list. Suggested display name: "Pincer Attack" |
| Combos performed | `combosDone` | 1/10/100/500/1000 | `doComboAttack` (battle.js:43402) |
| Super-effective banes | `superBanes` | 1/10/100/500/1000 | `isBaneEffective` (battle.js:43925) |

### 4.3 Battlefield manipulation (the identity category — lean in, this is what makes the list feel like *Entropy Wars*)

| line | metric | tiers | notes |
|---|---|---|---|
| Entropy Strikes | `entropyStrikes` | 1/10/100/500/1000 | battle.js:8998 |
| Terrain tiles changed | `tilesChanged` | 1/10/100/500/1000/10000 | player-attributed sites only (Appendix A #3) |
| Storms summoned | `stormsSummoned` | 1/10/100/500/1000 | player-cast only (battle.js:45651), natural weather excluded |
| Enemies displaced | `displacements` | 1/10/100/500/1000 | enemy units actually moved (`resolveForcedSlide`, skip `opts.simulate`) |
| Flyers grounded | `flyersGrounded` | 1/10/100/500/1000 | forced groundings of ENEMY flyers you caused |

### 4.4 Arena & objectives

| line | metric | tiers |
|---|---|---|
| Tiles scanned | `tilesScanned` | 1/10/100/500/1000/10000 |
| Hourglasses found | `hourglasses` | 1/10/50/100/500/1000 |
| Wins by hourglass | `wins_hourglass` | 1/10/100/500/1000 |
| Wins by wipeout | `wins_wipeout` | 1/10/100/500/1000 |
| Wins by Black Cube destruction | `wins_tower` | 1/10/100/500/1000 |
| Wins by Nexus control | `wins_nexus` | 1/10/100/500/1000 |
| Wins by aggregate score | `wins_composite` | 1/10/100/500/1000 |

Win-by-X keys on `state._winCondition` at commit (`'hourglasses_collected'`,
`'wipeout'`, `'tower_destroyed'`, `'nexus_dominance'`,
`'arena_composite'`/`'most_points'`, `'most_kills'` → TDM line) — requires the
Phase-0 mapping fix (§1.2 #4). ★ Additions that fall out for free:
`wins_suddenDeath` ("Clutch" — win in sudden death) and `wins_flags` (CTF
captures line) — both conditions already exist in code.

### 4.5 Match & mode accomplishments

| line | metric | tiers | notes |
|---|---|---|---|
| Arena wins | `wins_arena` | 1/10/100/500/1000/10000 | ⚠ 10000 wins ≈ 2,500+ hours; keep as Entropic if you want a "forever" number, but consider capping at 1000 — recommendation: cap at 1000, let *total wins across all modes* carry the 10000 tier ★ |
| TDM wins | `wins_tdm` | 1/10/100/500/1000/10000 | same note |
| Clash wins ★ | `wins_clash` | 1/10/100/500 | mode exists, deserves its line |
| Simul wins ★ | `wins_simul` | 1/10/100/500 | |
| Gauntlet-mode wins ★ | `wins_gauntlet` | 1/10/100/500 | |
| First bloods | `firstBloods` | 1/10/100/500/1000 | trigger exists (battle.js:19710); add the counter |
| Comeback wins | `comebacks` | 1/10/100/500/1000 | **definition in §4.5.1** |
| Win streaks ★ | `bestStreak` (high-water) | 3/5/10/15/20 | absorbs `winStreak3`/`winStreak5` |
| Challenge: run wins ★ | `challenge_runWins` (high-water per run) | 5/10/15/20/25 | `save.runWins` exists (state.js:4306) |
| Survival best streak ★ | `survival_bestStreak` | 3/5/10/15/20 | exists (state.js:4304) |
| Dungeon clears / best floor ★ | `md_clears` / `md_bestFloor` | 1/5/10/25 · 5/10/15/20 | exists (battle.js:28282) |

#### 4.5.1 Comeback — proposed definition (request asked to define it)

A win where, at any point after the opening (round ≥ 3), you were **clearly
losing**, per mode family:

- **Kill-score modes (TDM/Simul):** trailed by ≥3 kills, or ≥ half the kill
  target if the target is small.
- **Wipeout modes (Clash/Gauntlet/wipeout endings):** your living units were at
  most **half** of the opponent's living units (opponent ≥ 2 alive), **or** you
  were down to your last living unit while the opponent had ≥ 2.
- **Arena:** trailing on the composite score (`_arenaComposite`
  battle.js:49516) at ≥ ⅔ of the round limit, **or** your Cube below 30% HP
  while the opponent's is above 60%.

Implementation: one cheap check in the round-advance path sets
`state._comebackArmed[player] = true` when the losing condition is observed;
commit counts a comeback if the armed player wins. Armed state rides state-sync
(guest parity for free). The definition is deliberately generous-but-honest:
players should *recognize* the matches it fires on.

### 4.6 Feats (one-shot skill achievements — the personality layer)

The existing 14 migrate here (conditions fixed per §1.2). Additions that
certify mastery of signature mechanics, ItB/TBW-style (all conditions
verifiable at existing hooks; names are drafts):

- **"Third Law"** — win a match without ever taking damage from Entropy Strikes. 
- **"Weathermancer"** — have 3 weather systems you summoned active at once.
- **"Landscaper"** — change 15+ terrain tiles in one match.
- **"Air Traffic Control"** — ground 3 flyers in one match.
- **"Yo-yo"** — displace the same enemy unit 3+ times in one turn.
- **"Checkmate"** — win by Nexus control without losing a unit.
- **"Photo Finish"** — win by aggregate score with a margin under 5%.
- **"Grave Robber"** — steal an hourglass off an enemy carrier (plunder branch battle.js:47694) and win by hourglasses that match.
- **"Pincer Perfect"** — land 5 follow-up attacks in one match.
- **"Bane Sommelier"** — land super-effective banes on 5 different enemy types in one match (`_itemLog` + target types).
- **"The House Always Wins"** — win a sudden-death round with an opportunity strike or follow-up (kill outside your own turn).
- **Rares for the Showcase (sub-5% by design):** "Heat Death" (master all 96 champs), "Maxwell's Demon" (win a PvP match with 0 damage taken by your whole team), "Perpetual Motion" (20-win streak).

Feats stay in-game AND map 1:1 to Steam (they're the fun, marketable ones).

### 4.7 Rewards — close the loop (strongly recommended)

Per §2.4 / Into the Breach: every tier pays out through the **existing** economy
path (`creditLocalGold` profile.js:516, server-side clamp already exists):

- Bronze 100g · Silver 250g · Gold 750g · Diamond 2,000g · Entropic 5,000g
  (= one unit unlock, a real moment).
- Champion *Mastery* (per-champ meta) grants a **free unlock token** — the
  milestone token drip designed in unitunlockeconomy.md:80 and never built;
  achievements are its natural delivery vehicle (ROADMAP §6.4 agrees).
- Exact numbers need a balance pass against ACCT_ economy (~10 matches per
  unlock target, unitunlockeconomy.md) so achievements accelerate but don't
  trivialize the grind. Ballpark above adds roughly one free unlock per ~15-20
  tiers earned.

---

<a name="5-records"></a>
## 5. Records / high scores + the juice spec

### 5.1 The records (all per-profile, separate PvP and vs-CPU boards)

| record | how measured | hook |
|---|---|---|
| Biggest single action | damage summed per action (multi-hit spells/AoE aggregate — reuse the `_tallyDamage` burst accumulator pattern battle.js:8232) | damage chokepoint battle.js:19414 + action boundary |
| Most damage in one turn | per blitz-turn accumulator | turn end |
| Most damage in one round | per round accumulator | round advance |
| Fastest win | `durationMs` at finalize, wins only | finalize paths |
| Longest match | `durationMs` | finalize |
| Most kills in a match | your side's `state.matchKills` | finalize |
| Most healing in a match | Σ `_trackHealDone` | finalize |
| Most Cube/tower damage in a match | per-match tower-damage accumulator | tower-attack sites battle.js:40874/40922 (+ grep `tw.hp` for any spell-vs-tower paths at implementation) |
| Best challenge run | `runWins` high-water | finalizeCampaignBattle |
| ★ Longest kill streak (one unit) | `_killStreak` high-water | exists battle.js:8686 |
| ★ Biggest overkill | excess damage on kill | battle.js:19681 (overkill calc exists at 9328) |

### 5.2 The juice (the request: record-breaking numbers must LOOK bigger + popup)

Record detection is **viewer-local** (compares against MY profile) and happens
at the *display* layer so it works identically for host and guest (§3.3):

1. **The number itself**: `showFloatingTextForUnit` grows a new kind
   (`'record'`) applied at `_realShowFloatingTextAtTile_impl`
   (battle.js:8158-8205, className `dio-float-text <kind>`): **1.6× scale, gold
   → white gradient, glow pulse, +50% float duration, brief hit-stop feel via
   `shakeBoard('hard')`**. The 3D text path gets the same treatment via the
   `ThreeAnim.floatingText` opts fork (battle.js:8184). CSS lives in
   styles-animations.css.
2. **The banner**: `showCombatBanner('🏆 NEW RECORD', 'Biggest hit — 412 (was 388)', 'record')`
   through the existing center-banner **queue** (map.js:7298 →
   `_queueCenterBanner`) so it never collides with turn/kill banners — unlike
   the current achievement toast, which bypasses the queue (battle.js:9481) and
   collides. Distinct fanfare SFX (pick from audio.js at implementation).
3. **Escalation discipline** (juice dies when everything is loud): per action,
   at most ONE record banner (highest-priority record wins); near-records
   (≥90% of best) get only a subtle shimmer on the number, no banner; the first
   match on a fresh profile **seeds** records silently (no fanfare for "new
   record: 7 damage" on your first hit ever) — fanfare requires beating a real
   prior best from a completed match.
4. **Post-match**: a "Records broken" panel with old → new count-up animation
   (§6.2), plus the match summary's existing awards row.
5. **Match-end records** (fastest win, most kills…) can't pop mid-match — they
   get their moment exclusively on the post-match panel.

---

<a name="6-ui"></a>
## 6. UI

### 6.1 In-match popups (replacing `showAchievementToast`)

- **Tier unlocks (Bronze/Silver)**: compact corner toast — icon, name, tier
  pip, "+100g". Routed through a small queue; never more than one on screen;
  suppressed during cinematics (banner queue already knows how to wait —
  map.js:7240).
- **Gold/Diamond/Entropic + Feats + Records**: center banner via
  `showCombatBanner` kind `'ach'`/`'record'` with tier-colored styling + SFX.
- **Progress pings** (optional, off by default in settings): at 50% / 90% of a
  tier ("Backstabs: 90/100"), mirroring Steam's `IndicateAchievementProgress`
  philosophy — nudge, don't spam.
- All popups fire only for the viewer's own side; guest fires its own from
  tally diffs (§3.3).

### 6.2 Post-match panel (replaces the `N / 14` block, battle.js:26031-26038)

Order on the victory screen (existing MVP plate and per-unit awards stay):

1. **Unlocked this match** — full cards: icon, name, description, tier color,
   reward. (The current screen shows name-only chips for new unlocks and a
   naked count for the rest — both replaced.)
2. **Records broken** — "Biggest hit 388 → 412" with count-up.
3. **Almost there** — the 2-3 nearest next tiers with progress bars and
   this-match delta ("Displacements 94/100 · +6 this match"). This is the
   "one more match" hook and replaces the meaningless count.
4. One line linking to the full trophy case: "Profile → Achievements".

Campaign/dungeon end screens (which today render no achievements at all) get
rows 1-3 as well, since their terminal paths now commit (§3.2).

### 6.3 Profile → Achievements tab rework (profile.js:1061-1097)

- **Category sub-tabs**: Combat · Support · Battlefield · Objectives · Modes ·
  Feats · **Champions** · **Records**.
- Standard lines render as **tier ladders**: five pips with the current tier
  colored, a progress bar to the next tier, exact counts (with the PvP/CPU
  split on hover/expand).
- **Champions** = the 96-row mastery grid: champ portrait, three mini-ladders
  (kills/wins/deathless), a Mastery star, sort by progress / filter
  owned-only, search. This grid is the completionist centerpiece — it also
  doubles as a "reason to buy/play every champ" surface (pairs with §4.7
  token rewards).
- **Records** = two boards (PvP / vs-CPU) with date + match metadata per
  record (from `buildProfileMatchSummary`).
- Header: overall completion % + rarity summary. (Global unlock rates come
  later with server sync; Steam shows its own for the curated set.)
- Achievement **showcase** (pick 3-5 for a future public profile) — designed
  now as data (`profile.showcase`), UI whenever public profiles land
  (ROADMAP §6.6).

---

<a name="7-server-sync"></a>
## 7. Server sync (D1)

Purpose: durability (localStorage wipe ≠ progress wipe) and multi-device
continuity — **not** anti-cheat (§2.2 sets expectations; hardening rides
ROADMAP §5's own track).

### 7.1 Schema — `migrations/004_progress.sql` (new file, per CLAUDE.md migration rules)

```sql
CREATE TABLE IF NOT EXISTS player_progress (
  player_id  INTEGER PRIMARY KEY REFERENCES players(id),
  data       TEXT NOT NULL,          -- the profile.progress JSON blob
  updated_at TEXT NOT NULL
);
```

One row per player, blob storage. (A normalized counters table adds nothing
until there are server-side queries over individual metrics — leaderboards for
records could motivate it later.)

### 7.2 Endpoints (token-auth via `findPlayerByToken`, `httpRateLimit`d like the economy endpoints)

- `GET  /api/progress` → the stored blob (login-time pull).
- `POST /api/progress/sync` — client sends its full local `profile.progress`;
  server **G-counter-merges** (per-counter `max`, per-record `max` keeping the
  winning side's metadata, `unlocked` union keeping earliest timestamp), stores,
  returns the merged blob; client replaces local with the response. Because the
  merge is commutative + idempotent (§2.3), this is safe under retries, offline
  gaps, multiple devices, and crashes — no outbox, no versioning dance. Clamp
  payload size (~64KB) and validate shape server-side.
- Client sync points: login (pull+merge), each match commit (push, fire-and-
  forget), profile open (push). Offline vs-CPU play simply accumulates locally
  until the next successful sync — this is the answer to "offline play still
  tracks".
- Note honest limitation: `max`-merge slightly undercounts *true* totals when
  two devices play offline in parallel (it keeps the larger side, not the sum).
  Acceptable for a solo-profile game; per-device G-counters are the upgrade if
  it ever matters.

### 7.3 Hardening path (later, riding ROADMAP §5 P2 — not blocking anything)

When host-reported per-match summaries land server-side (`match_stats`), the
server can increment online-PvP counters **itself** from the reported summary
and stop accepting client claims for the `pvp` bucket. That's also the moment
ranked-only achievements become possible, and (if ever desired) Steam
"Set By: GS" achievements via the publisher WebAPI (§2.1). Until then: client-
trusted, like almost every game in the genre (§2.2).

---

<a name="8-steam"></a>
## 8. Steam plan

Prerequisites unchanged from LAUNCH_READINESS §6: `dist/` self-containment
(bundle R2/CDN assets locally) → Electron shell. Achievements add three small
pieces on top:

### 8.1 The glue (binding-agnostic, ~50 lines in the Electron main process)

```js
// The ONLY Steam surface the game code sees (no-op in browser builds):
SteamGlue = { available, setStat(name, val), setAchievement(id), storeStats() }
```

Behind it: steamworks.js (`client.achievement.activate(...)`; stalled but
functional) or steamworks-ffi-node (active) — decide at wrap time, swap in an
afternoon (§2.5). Call sites in game code: match commit (§3.2) calls
`setStat` for each curated metric + `storeStats()` once; boot re-asserts all
locally-unlocked curated achievements (idempotent, §2.1) so local profile and
Steam converge even after playing on another machine.

### 8.2 The curated Steam set (≤100 pre-confidence-metric; target ~70 at launch)

In-game catalog is unlimited; Steam gets the *shape* of it:

- All **Feats** (~25 after additions) 1:1 — they're the personality.
- Per profile-wide line: **two** tiers on Steam (the "everyone gets this"
  tier and the "dedication" tier — e.g. Crits 100 & Crits 10000), stat-backed
  so Steam renders progress bars natively (§2.1). ~17 lines × 2 ≈ 34.
- **Champion mastery collapsed**: win with 5 / 25 / all 96 different champs;
  Master 1 / 10 champs; "Heat Death" (master all 96). 6 total.
- Mode spine: first win in each of 5 modes (5).
- 3-5 designed rares for the Rarest Achievement Showcase.
- Offline unlocks: handled by the Steam client cache automatically (§2.1) —
  vs-CPU on a plane still pops Steam achievements when you land.
- Steam Cloud: optional backup for the profile blob; its conflict handling is
  "user picks a version", not merge — since §7 gives real merge sync through
  your own server, treat Steam Cloud as a nice-to-have backup or skip it.

### 8.3 What NOT to do

- Don't build a custom achievement-sync protocol for Steam builds — Steam's
  stats cache IS the sync (§2.1); your D1 sync covers the browser build and
  cross-platform continuity.
- Don't try to make client-set achievements forgery-proof (§2.2) — reserve
  effort for ranked integrity, which is a different system (ROADMAP §5).
- Don't exceed 100 Steam achievements at launch (§2.1).

---

<a name="9-phases"></a>
## 9. Phased rollout

Each phase = deliverable full files in chat per RULE #1, `npm test` before
delivery, index.html `?v=` bump per RULE #1b, and a RULE #2 "what does the
guest see?" pass. No playtesting unless explicitly requested (RULE #1c).

> **Status 2026-08-31: Phases 0 and 1 implemented.** Phase 1 notes / deliberate
> deviations from the design above:
>
> - **No `state._achTally` / live `trackAch` yet.** Every Phase-1 metric turned
>   out to be foldable from per-unit `_match*` counters at commit time (several
>   new ones were added: `_matchBackstabs`, `_matchOppStrikes`,
>   `_matchCleanses`, `_matchSuperBanes`, `_matchDisplacements`,
>   `_matchStorms`, `_matchHealCasts`, `_matchScans`, `_matchHourglasses`,
>   `_matchFirstBloods`, `_matchTrueDodges`). Per-unit counters ride online
>   unit snapshots automatically, so the guest commits its own side with ZERO
>   new relay code — the tally becomes necessary only for Phase 2's live
>   mid-match popups.
> - **Commit guard keys on match identity** (`matchNumber:startTime`, both
>   synced) instead of a reset-at-boot flag — the online guest never runs the
>   local match-boot paths.
> - Commit points live in `finalizeMatch` (also reached by Strike-RT via
>   `checkWin`), `finalizeCampaignBattle`, and `_mdEndRun`.
> - `profile.progress` v2 ships as designed (§3.5), with the career seed in a
>   `legacy` bucket and seed-crossed tiers pre-unlocked silently (no toast
>   avalanche on a veteran's first match).
> - Implemented catalog: 33 profile-wide lines + the 3 per-champ ladders.
>   **Deferred to later phases:** `tilesChanged`, `flyersGrounded` (needs
>   `opts.byUnit` plumbing), `comebacks` (§4.5.1 armed-flag), challenge/
>   survival lines, records (§5), tier gold rewards (§4.7), champion-mastery
>   meta line, profile UI ladders (§6.3), server sync (§7).
> - Interim UI: tier unlocks toast in-match (capped at 4 + "+N more") and
>   render as cards on the victory screen; the full trophy-case rework stays
>   Phase 2/4.

> **Status 2026-08-31 (later session): Phase 2 implemented.** Notes /
> deviations:
>
> - **Deferred Phase-1 metrics now live:** `tilesChanged` (all player-driven
>   sites: terrainCreate paint loops, placeBlock both paths, buildStructure
>   stamp count, AoE/line/dash `leaveTerrain` — change-guarded, and every
>   validated `doBuildAction` op, via `trackTilesChanged(unit, n)`),
>   `flyersGrounded` (`forceGroundUnit` gained `opts.byUnit`; plumbed at the
>   root-status, gravity-zone (caster via `zone.casterUnitId`), anti-air
>   spell and Gravity-Crush cast sites; enemy-only, wounded self-crashes and
>   flying-into-a-field stay unattributed), `comebacks` (§4.5.1
>   `_checkComebackArmed` at round advance; `state._comebackArmed` rides
>   state-sync; **deviation:** the mid-match Arena check uses kill-deficit ≥3
>   OR the Cube 30%/60% condition — `_arenaComposite` is scoped inside the
>   timer-expiry closure, and kills are its dominant term), plus
>   `challenge_runWins` / `survival_bestStreak` (hw from
>   `state.campaignSave`, split by `challengeType`), `md_bestFloor`, and the
>   mastery meta line `champsMastered` ("Heat Death", hw; bar =
>   `ACH_MASTERY` in data.js: 100 kills · 100 wins · 10 deathless).
>   Erupting-block shoves (which bypass `resolveForcedSlide`) now count into
>   `displacements` too.
> - **Live mid-match popups WITHOUT `state._achTally`:** a 2s viewer-local
>   poll (`_achLivePoll`) compares cached profile base + per-unit `_match*`
>   deltas (`_achFoldMatchDeltas`, shared with commit so they can't drift)
>   against tier thresholds — the guest's counters arrive via state-sync, so
>   both clients pop their own unlocks with zero relay code. Display-only:
>   nothing persists until commit (abandon still commits nothing); a
>   popped-set suppresses the duplicate commit-time popup.
> - **Popup routing per §6.1:** Bronze/Silver → styled corner toast
>   (`.achieve-toast`, styles-animations.css — the old toast had NO css at
>   all), queued one-at-a-time, cinematic-suppressed; Gold/Diamond/Entropic →
>   center banner through map.js's queued `showCombatBanner` (new kinds
>   `ach-gold`/`ach-diamond`/`ach-entropic`). Progress pings (50%/90%) not
>   implemented (optional in the plan).
> - **§6.2 panel shipped** on ALL three end screens (PvP victory, Challenge,
>   Dungeon): full unlock cards (tier color + reward chip) + "Almost there"
>   (top-3 nearest locked tiers, this-match delta first) + trophy-case
>   pointer. Records rows await Phase 3.
> - **§4.7 rewards ON:** `ACH_TIER_REWARDS` (100/250/750/2000/5000g) paid at
>   commit via `creditLocalGold` (silent career-seed pre-unlocks never pay —
>   they're stamped at migration, before any commit); each newly-mastered
>   champ pays one free unlock token via new
>   `ProfileSystem.creditLocalFreeTokens`. Local-mirror only, like MD gold —
>   server reconciliation is Phase 5's job.
> - achievements.test.js extended: hw-flag set, Phase-2 metric presence,
>   reward-ladder sanity, mastery-bar-vs-ladder consistency (Heat Death top
>   tier pinned to `AVAILABLE_RACES.length`).
> - **Still deferred:** records + juice (§5, Phase 3), profile trophy-case
>   tab rework (§6.3, Phase 4), server sync (§7, Phase 5), remaining feats
>   (§4.6).

> **Status 2026-08-31 (later session): Phase 3 implemented.** Notes /
> deviations:
>
> - **Record defs** live in data.js `ACH_RECORD_DEFS` (10 records; the plan's
>   "Best challenge run" row is NOT a record — `challenge_runWins` /
>   `survival_bestStreak` hw counters already carry it and the §6.3 boards
>   can render them from there). Storage is the §3.5
>   `progress.records[id][bucket] = {value, ts, meta:{mode}}` shape —
>   profile.js needed zero changes (Phase 1 shipped the store).
>   Records are **standard-match only** (Challenge/Dungeon are gated out —
>   they have their own ladders and level-1 dungeon numbers would be noise).
> - **Engine accumulators** (host-side, everything rides state-sync):
>   `_matchBiggestHit` per action via a per-source 1.2s settle burst
>   (`_recTrackDamage` at the damage chokepoint — enemy damage only, DoT
>   excluded, multi-hit/AoE aggregates like `_tallyDamage`); turn/round
>   damage in `state._recDmg[player]` with LAZY key-reset (match:round:
>   activeUnit identity keys instead of boundary hooks — correct on the
>   guest, which never runs local turn-advance paths); `_matchBestKillStreak`
>   (in `processKillStreak`); `_matchBiggestOverkill` (kill-credit block,
>   below processOverkill's 50% gate); `_matchTowerDmg` (both Cube-attack
>   damage sites). `fastestWin` has a 60s sanity floor (a forfeit is not a
>   speedrun) and counts wins only.
> - **Detection is viewer-local at the display layer** (RULE #2 as §3.3
>   prescribed): `_recEnsureLive` caches the profile's boards once per match
>   (bucket = pvp/cpu via `isOnlineMatch`), `_recLivePoll` rides the existing
>   2s `_achLivePoll` beat on BOTH clients (guest values arrive via
>   state-sync). The one relay change: the floating-text relay (online.js)
>   now carries `{dmgAmt, dmgBy}` and the guest handler passes them through,
>   so each client restyles its OWN record-breaking numbers — the relayed
>   kind is the pre-restyle one (the wrapper sits upstream of the display
>   impl), so the host's styling can never leak to the guest.
> - **Juice per §5.2:** float kinds `record` (~1.6× white→gold gradient in
>   three-renderer.js `_FLOAT_STYLES` + isBig slam, +50% duration,
>   `shakeBoard('hard')`; 2D-board fallback CSS in styles-animations.css)
>   and `record-near` (≥90% of best — shimmer only). Center banner
>   `🏆 NEW RECORD` through the queued `showCombatBanner` kind `'record'`
>   (gold glow, `levelUp` SFX). Escalation discipline: one banner per poll
>   beat (defs are in priority order), hard cap 6/match, fresh boards seed
>   silently (fanfare requires a real prior best), match-end records
>   (fastest win, most kills…) only celebrate on the post-match panel.
> - **§6.2 row 2 shipped:** "📊 Records Broken" rows (old → new with a
>   count-up that lands with a golden flare) on the shared end-of-match
>   panel; rows render the final value as static text so the count-up is
>   pure decoration if an overlay lands late.
> - achievements.test.js extended: ACH_RECORD_DEFS shape, fmt whitelist,
>   min⇒end rule, and an exact live/end id split pinned to battle.js's
>   value sources.
> - **Still deferred:** profile trophy-case tab rework incl. the records
>   boards UI (§6.3, Phase 4), server sync (§7, Phase 5 — merge records by
>   per-board max, keeping min-semantics for fastestWin), remaining feats
>   (§4.6).

> **Status 2026-09-01: Phase 4 implemented.** Notes / deviations:
>
> - **All in profile.js** — the profile screen's established idiom is inline
>   React styles (zero CSS-file coupling), so the whole §6.3 rework ships in
>   ONE R2 file + the index.html token bump; styles-*.css untouched.
> - **Category sub-tabs** per §6.3: Combat · Support · Battlefield ·
>   Objectives · Modes · Feats · Champions · Records, driven by
>   `ACH_CATALOG[].cat`. The legacy 14 one-shots render as the Feats grid
>   (the old tab's card UI, unchanged); the tab falls back to that grid
>   alone if the data.js registries are somehow absent.
> - **Tier ladders**: rarity-colored tier pips (unlock-date tooltips from
>   `progress.unlocked`, Entropic pips glow), progress bar + exact
>   `total / next` count, click-to-expand PvP / vs-CPU / Legacy split
>   (hw lines annotated as best-of-buckets). **Pip/ladder state derives from
>   the counter TOTALS, not the unlocked-key mirror**, so the display can
>   never disagree with what the next commit would evaluate.
> - **Champions grid**: all 96 roster rows (not just played ones), HUD
>   portrait (either gender, map-sprite then letter-tile fallback), the 3
>   mini-ladders with pips + bars, mastery % / 👑 MASTERED state with the
>   entropic-purple treatment, `N/96 mastered` header, search box,
>   owned-only filter (`getAccountEconomy().unlockedUnits` — unowned champs
>   show 🔒, doubling as the §4.7 "reason to buy" surface), and
>   progress/A–Z sort toggle.
> - **Records tab**: §5.1 boards as one grid — PvP (gold) and vs-CPU (blue)
>   columns per `ACH_RECORD_DEFS` row, value via the same fmt rules as
>   battle.js `_recFmt` (ms → m:ss), date + mode meta beneath, '—' for
>   unseeded cells.
> - **Header**: overall completion % (every catalog tier + every per-champ
>   tier across the roster + feats — the honest completionist number),
>   gradient progress bar, and unlocked-count chips per rarity color.
> - `profile.showcase` seeded as empty-array data in `backfillProfile`
>   (§6.3 showcase — UI waits for public profiles, ROADMAP §6.6).
> - **Still deferred:** server sync (§7, Phase 5), remaining feats (§4.6),
>   progress pings (§6.1, optional), Steam (§8).

> **Status 2026-09-01 (later session): Phase 5 implemented.** Notes /
> deviations:
>
> - `migrations/004_progress.sql` per §7.1, except `player_id` is TEXT —
>   `players.id` is a uuid string, the plan's INTEGER sketch was wrong.
> - **§7.2 endpoints shipped**: `GET /api/progress` (login-time/debug pull)
>   and `POST /api/progress/sync` (the real path — push full blob, receive
>   merged blob + authoritative wallet), token-auth via `findPlayerByToken`,
>   own `progress` rate bucket, upsert via `ON CONFLICT(player_id)`.
>   Deviations from the §7.2 sketch: the blob cap is 400KB, not ~64KB — a
>   fully-completed 96-champ blob measures ~120KB (the plan's estimate was
>   low) — and `express.json()` gained `limit: '512kb'` (the 100kb default
>   would 413 the sync). The merge additionally hard-caps key counts
>   (256 counters / 256 champs / 12000 unlock keys).
> - **ONE merge implementation, three consumers** (`mergeProgressBlobs` in
>   data.js, exported on window): profile.js, server.js — which loads it
>   through the existing load-data.js sandbox exactly like the ECON
>   derivation (no data.js ⇒ sync answers 503, never a drifted copy) — and
>   achievements.test.js. It both joins (per-bucket max counters, per-board
>   best records with min-semantics for `fastestWin` as Phase 3 prescribed,
>   earliest-ts union of unlocks) and SANITIZES (unknown record ids and
>   malformed keys dropped, values clamped, `__proto__` guarded), since the
>   server feeds it untrusted client blobs.
> - **Client replaces nothing**: on response, profile.js RE-MERGES the
>   server blob against the *current* local one (a match can commit while
>   the request is in flight) — the §7.2 "client replaces local" step is
>   the only sketch line not followed literally, and the merge's
>   idempotence is why the swap is safe.
> - **§4.7 reconciliation (the Phase-2 IOU) done server-side**: a sync pays
>   tier gold for every unlock key the merge newly added
>   (`achUnlockKeyReward` mirrors commit's payout rules — champ tiers pay,
>   `feat_*` pays 0) plus one free token per newly-mastered champ
>   (`achCountMasteredChamps`), into the real wallet. The FIRST sync of an
>   account stores a silent baseline instead — a veteran's migration-seeded
>   pre-unlocks (never paid client-side either) don't arrive as a windfall.
>   Payouts are idempotent and bounded once-ever by the finite catalog
>   (§2.2 trust model unchanged). Wallet in the response is normalized
>   through `getOrBackfillEconomy` so a pre-economy account can't wipe its
>   local starter mirror.
> - **Client sync points** (§7.2): login AND register (baseline), a
>   debounced (2s, single-flight, loop-guarded) fire-and-forget push
>   scheduled by `profileSaveProgress` itself — i.e. every match commit,
>   with battle.js untouched this phase — and opening the Profile →
>   Achievements tab, which re-renders with the merged blob when it lands.
> - achievements.test.js extended: merge join semantics (commutative +
>   idempotent, min-record, earliest-ts), hostile-input sanitization,
>   payout-rule mirror, baseline/idempotence of rewards, and a server.js
>   source-text drift guard (endpoints + shared helpers present).
> - **Still deferred:** remaining feats (§4.6), progress pings (§6.1,
>   optional), Steam (§8).

| phase | content | files touched | size |
|---|---|---|---|
| **0 — Kill the slop** | §1.2 fixes: profile auto-create + persistence fallback, `ace` gate, remove `_repairAchievementStore`, win-condition mapping fix, rename Flawless chip, RT-mode crit/cleanse counters, interim victory-screen cleanup (drop bare N/14, show names for new unlocks) | battle.js, profile.js, (index.html bump) | small — **one session, do first, ships value alone** |
| **1 — Counter spine** | `ACH_CATALOG`+`ACH_RECORD_DEFS` in data.js, `trackAch` + `state._achTally`, missing hooks (Appendix B), commit in all 4 terminal paths, `profile.progress` schema + migration of the 14 + career seed, PvP/CPU split, guest tally-diff wiring | data.js, battle.js, state.js, profile.js, online.js (guest diff), achievements.test.js | the big one — 1-2 sessions |
| **2 — Catalog + popups + post-match** | full catalog live, tier popups + queue, post-match panel (§6.2), rewards (§4.7) | battle.js, data.js, styles-animations.css, styles-cinematic.css, index.html | 1-2 sessions |
| **3 — Records + juice** | record store, per-action/turn/round accumulators, `record` float kind + banner + SFX, records post-match panel | battle.js, data.js, styles, audio hookup | 1 session |
| **4 — Profile UI** | Achievements tab rework: category tabs, ladders, 96-champ grid, records boards | profile.js, styles | 1 session |
| **5 — Server sync** | 004 migration, GET/POST progress, merge, client sync calls | server.js, migrations/004_progress.sql, profile.js | 1 session (server side is user-deployed to Render) |
| **6 — Steam** | rides the Electron track (LAUNCH_READINESS §6): SteamGlue + curated schema in Steamworks admin + boot re-assert | Electron shell (new repo tooling, not R2), battle.js commit hook | small once the wrap exists |

Dependencies: 0 → 1 → {2, 3} → 4; 5 anytime after 1; 6 after the (separate)
Electron work. Phases 0-3 are where the dopamine is — profile UI can lag
behind without hurting the in-match feel.

---

<a name="10-decisions"></a>
## 10. Open decisions (recommendation first)

1. **Deathless requires the win?** Recommended yes (§4.1) — pure survival is
   farmable by hiding a unit in a corner. *(Assumed yes throughout.)*
2. **10000-tier trims** (§4.5 ⚠): keep 10000 only on statuses / dodges /
   crits / tiles scanned / terrain (high-volume metrics), move the 10000-wins
   fantasy to total-wins-all-modes. *(Recommended.)*
3. **Comeback definition** (§4.5.1) — numbers are tunable; the shape
   (armed-when-clearly-losing → win) is the proposal.
4. **Tier rewards ON from day one?** Recommended yes with conservative values
   (§4.7) — it's the strongest retention lever and the token drip was already
   designed.
5. **Challenge/Dungeon combat counting toward profile-wide counters**:
   recommended yes (cpu bucket) — it's real play; only mode-win lines stay
   separate.
6. **"Champ" = race** (96 `AVAILABLE_RACES`) — assumed throughout; if champ
   should mean race+class combos instead, the grid explodes and the schema
   key just changes, but say so before Phase 1.

---

<a name="appendix-a"></a>
## Appendix A: metric → code hook reference (verified 2026-08-31)

| # | metric(s) | hook | available context |
|---|---|---|---|
| 1 | kills, per-champ kills, firstBloods, overkill | kill-credit block in `applyDamageToUnit`, battle.js:19681 (first-blood check 19710) | `killer` (unit + `.player` + `.race`), `target`, excess damage |
| 2 | statusesApplied / buffs / debuffs | `applyStatusPayload` success point, battle.js:6131-6149 | `sourceUnit`, `target`, `payload.id`, `STATUS_DEFS[id].kind` ('buff' 55 / 'debuff' 48); early-return bounces above ⇒ only successful applications |
| 3 | tilesChanged | attribute at player-driven callers: `_paintTile` battle.js:47278 (terrainCreate), placeBlock 47132, `doBuildAction` 42317, leaveTerrain 4699/4942/46749/48679. (`setTerrainAt` map.js:2646 is the chokepoint but has no owner arg) | caster unit, tile list |
| 4 | entropyStrikes | `doEntropyStrike`, battle.js:8998-9010 (`state._entropyStrikeCount[player]` already increments) | unit, targets |
| 5 | healsApplied / healingDone | `applyHealingToUnit`, battle.js:8278 | `sourceUnit`, `target`, `actual` (overheal-clamped), self-heal detectable |
| 6 | combosDone | `doComboAttack`, battle.js:43402 (`_matchCombos`) | initiator, partner, combo def |
| 7 | stormsSummoned | doSpell `summonWeather`, battle.js:45651 (`weather._casterUnitId`); EXCLUDE natural `spawnWeather` state.js:2295 | caster, weather type |
| 8 | displacements | `resolveForcedSlide`, battle.js:3763 — count when `moved && opts.byUnit` is enemy of target; **skip `opts.simulate`** (preview path 24717); plus erupting-block shoves 42325/47140 | byUnit, target, steps |
| 9 | flyersGrounded | `forceGroundUnit`, battle.js:40440 — `true` return + forced (`opts.byLabel`), needs `opts.byUnit` added for attribution (Appendix B) | victim, cause |
| 10 | cleansesDone | doSpell `cleanse`, battle.js:46059 (`cleansedCount`); RT `_cleanseUnit` 14672 (currently uncounted — Phase 0 fix) | caster, count |
| 11 | superBanes | doItem bane branch, battle.js:43925 (`isBaneEffective`) | thrower, target, baneRule |
| 12 | backstabs | `doAttack` arc block, battle.js:41246 (`_atkArc === 'back'`) | attacker, target, damage |
| 13 | oppStrikes | `checkOpportunityAttack`, battle.js:575-581 | striker (`enemy`), retreater, dmg |
| 14 | followUps ("pincer") | `doAttack` follow-up block, battle.js:41423 (`_matchFollowUps` exists; search terms: `followUp`, `XP_FOLLOWUP` — NOT "Crossfire", that's an unrelated spell) | initiator, ally, target, dmg |
| 15 | attacksDodged | battle.js:41231 (`_matchDodges`; `_blindMiss` flag at 41126 distinguishes blind-miss) | dodger, attacker |
| 16 | critsLanded | battle.js:41154 (`_matchCrits`); RT-mode second roll 14825 uncounted (Phase 0) | attacker, damage; note: only basic attacks crit |
| 17 | tilesScanned / hourglasses / hourglass wins | scanner battle.js:43823 (count NEW tiles added to `scannedByPlayer`), `doInspect` 41529; hourglass pickup celebration 41568-41578; wins: checkWin 49406 + sudden-death pickup 41558 | unit, tiles, counts |
| 18 | wins_* by condition, comebacks, durations | terminal paths: `finalizeMatch` 28880 / `finalizeCampaignBattle` 28446 / `_mdEndRun` 28261 / RT `_checkEnd` 15281; `state._winCondition` (§1.2 #4 fix first) | winner, condition, durationMs, mode |
| 19 | towerDamage | `doAttack` tower branches, battle.js:40874 & 40922 (grep `tw.hp` for spell paths at implementation) | attacker, damage |
| 20 | damage records | chokepoint battle.js:19414 (`_trackDmgDealt`); careful: DoT/zone paths 6966/6991/7160/7184 + bombs 38824 credit manually but still call the chokepoint — hook ONCE at 19414 to avoid double-count | source, target, finalDamage |
| — | juice display | `_realShowFloatingTextAtTile_impl` battle.js:8158 (DOM), ThreeAnim fork 8184 (3D); banner queue `showCombatBanner` map.js:7298 | — |

## Appendix B: counters that must be added (everything else already exists)

Per-unit (join the `_match*` family, auto-reset with unit rebuild):
`_matchBackstabs`, `_matchOppStrikes`, `_matchCleanses`, `_matchBanesThrown` /
`_matchSuperBanes`, `_matchTilesChanged`, `_matchGroundings`,
`_matchDisplacements`, `_matchScans`, `_matchStorms`, `_matchEntropyStrikes`,
`_matchTowerDmg`, `_matchBiggestHit`.

Plus: `forceGroundUnit` needs an `opts.byUnit` (attribution), first-blood needs
a career counter (trigger exists), and the comeback armed-flag
(`state._comebackArmed`) is new state (must sync — keep OUT of the serializer
skip list).

Already existing and merely untapped: `_matchFollowUps`, `_matchBounties`,
`_matchAssists`, `_matchCounters`, `_matchDodges`, `_matchCrits`,
`_statusesApplied`, `state._entropyStrikeCount`, `save.runWins`,
`save.bestStreak`, dungeon `{bestFloor, clears, runs}`.
