# Entropy Wars — Level 100 System: Implementation Plan

> **Audience:** a fresh implementation session (Opus 4.8) with no prior context. Everything needed is in this doc + the referenced files. All gameplay logic is client-side (`index.html` + ~35 JS scripts served from R2); `server.js` is matchmaking/relay only. Deliverables are always full edited files handed to the user in chat (see CLAUDE.md RULE #1 + mandatory `?v=` cache-bust of `index.html`).

---

## 1. Goals (from the game owner)

1. Raise max level from **10 → 100**.
2. **All competitive PvP modes** (arena, tdm, ffa, domination, hotspot, ctf — plus gauntlet/shooter as PvP-adjacent) are **normalized: every unit is level 100**.
3. Only **Mystery Dungeon, Challenge, and Endless** start at low level and level up during play.
4. A level-100 unit should have **10,000–20,000 HP**, and at level 100 things should **hit/heal in the same proportions they do today** (today's numbers ≈ the intended level-100 "feel", just ×~20–30).
5. Healing potions and similar items become **percent-of-max-HP** based.
6. Everything flat needs a **level multiplier** (or conversion to percent) so low-level spells don't obliterate low-HP units and level-1 content is playable.
7. **Undecided / defer:** spells learned per level (movesets still being fleshed out — design the *hooks*, don't finalize the table) and whether a separate **job level** exists (see §8).

---

## 2. Current system — map (verified 2026-07-12)

### 2.1 Leveling core (battle.js)
| What | Where |
|---|---|
| `XP_MAX_LEVEL = 10` | battle.js:16220 |
| `XP_THRESHOLDS = [0,32,76,136,210,300,405,530,675,845]` (cumulative, index = lvl−1) | battle.js:16221 |
| `XP_STAT_UPGRADE_PER_LEVEL` — **dead constant, never referenced** | battle.js:16223 |
| XP award constants (kill 14, assist 6, passive 2/round, etc.) | battle.js:16225–16243 |
| `getUnitLevel(unit)` — level is **derived from `unit._xp`**, no stored level field | battle.js:16245 |
| `getXPForNextLevel` / `getXPProgressPct` (HUD bar) | battle.js:16254 / 16260 |
| `grantXP(unit, amount, reason)` — adds `_xp`, applies rewards per crossed level, SFX/VFX | battle.js:16271 |
| `applyLevelUpRewards(unit, level)` — stat gains + spells + milestones | battle.js:16289 |
| `learnSpellForUnit` (slot budget, `SPELL_SLOT_MAX = 8` at data.js:11104) | battle.js:16378 |
| `applySecondaryJob` (+25% of job's JOB_MODIFIERS via `computeSecJobBonuses`, data.js:3029) | battle.js:16399 |
| `aiPickSecondaryJob` | battle.js:16436 |

- Stat gains per level are a **flat additive table** `LEVEL_UP_GAINS` (data.js:11128), levels 2–10 only (e.g. Lv2: hp+30/mp+8/atk+5/def+4/mdef+3/int+3 … Lv10: hp+55/mp+18/atk+10/def+9/mdef+8/int+8). SPD/MOVE/AWR/range do **not** scale.
- Milestones inside `applyLevelUpRewards` (battle.js:16327–16359): Lv3 spell shop, **Lv4 secondary job pick** (`_pendingSecondaryJobPick`), Lv5 slots-filled flavor, **Lv6 & Lv9: `_xpBonusAP += 1`** (AP cap = `UNIT_MAX_AP` (3) + `_xpBonusAP`), Lv7/8/10 flavor-only text.
- Spells by level (battle.js:16306–16322 + `CLASS_SPELL_LEARN_ORDER` data.js:11106): Lv1 learns [0]+[1], Lv2→[2], Lv3→[3], Lv5→[4]; Lv4 grants the secondary job's first spell.
- Base stats: race table (data.js:2624+) + `CLASS_TEMPLATES` (data.js:3061) + `JOB_MODIFIERS` (data.js:2849). Current base HP ≈ 445–660.

### 2.2 How starting level is set (map.js unit builder, ~6084–6237)
- `applyLevelUpRewards(newUnit, 1)` at map.js:6090 (starter spells).
- **Campaign / Mystery Dungeon branch** (map.js:6094–6167, gated on `state.isCampaign || state._mdRun`): prelevels 2→`min(_campaignLevel, XP_MAX_LEVEL)` by looping `applyLevelUpRewards`; sets `_xp` from `_campaignXp` or threshold. Enemy levels: challenge/campaign battle.js:19112–19114 (`enemyLevelRange`), MD floors battle.js:19618–19633 (`spec.levelRange`, boss `min(10, floor+1)` — data.js:10919–10930). Challenge ranges generated in `generateChallengeLevel` data.js:11175–11197 (batch 1 = [1,1] … capped at [9,10]).
- **Everything else (all PvP/skirmish)** (map.js:6170–6236): loops `applyLevelUpRewards` 2→`XP_MAX_LEVEL`, then `_xp = XP_THRESHOLDS[XP_MAX_LEVEL-1] || 1060`. **This is the entire "normalization" mechanism today — everyone is just built at max.** In-battle `grantXP` is a no-op in PvP because `_xp` is already capped.
- Campaign roster persistence: units instantiated with `_campaignXp: rInst.xp` (battle.js:19062); post-battle XP folded back at battle.js:19877–19923 (`rInst.xp += xpGained`, `rInst.level` recomputed).
- ⚠️ Inconsistency: thresholds top out at **845** but map.js:6198 falls back to **1060**.

### 2.3 Mode registries
- `GAME_MODES` (board presets) state.js:11; `MULTIPLAYER_MODES` state.js:183: arena, shooter, tdm, ffa, domination, hotspot, ctf, gauntlet, dungeon ("Mystery Dungeon"). Active mode: `getActiveMultiplayerMode()` state.js:469 (defaults to `arena`). PvP mode lists also hardcoded at data.js:8774 and server.js:36 (`ACCT_PVP_MODES`).
- **"Endless" mode does not exist yet** — the plan must leave a hook for it (treat as third member of the "progression modes" set alongside MD + Challenge).

### 2.4 Flat-number audit — everything that breaks at 10–20k HP
Full details verified; grouped by severity.

**A. Damage sources (the big one — spell damage is a flat table, independent of stats/level):**
- Every spell has hardcoded `dmg:` in data.js (~50–224 range, e.g. data.js:3550 `dmg:144`, 4444 `dmg:200`, 4683 `dmg:224`, 5326 `dmg:180`). Multi-hit `hitDamages` arrays and `chainProfile` (battle.js:2859) are flat too. Applied as `Math.max(16, spell.dmg + spellPower)` (battle.js:8550/8552/2862).
- `spellPower` base = 0 (Black Mage 8) — map.js:6047.
- `spell.dmgPerLevel` (elevation) flat 25/20 defaults (ai.js:2197/2245).
- Basic attack (4 duplicated sites): `Math.max(24, floor(atk*0.65) + bonuses + randInt(40) - 16)` — battle.js:29607 (units), 29327 (Cube/tower), 29435 (turret), 11598 (AI/counter). Stat-scaled but flat floor 24 and flat ±16/randInt(40) variance.
- Counter: `Math.max(24, floor(atk*0.4) + randInt(24))` battle.js:5700.
- `ENTROPY_STRIKE_BASE_DMG = 150` flat + 0.55×teamAtk (battle.js:6086–6113).
- Mark bonus flat +40 (battle.js:13417, set 4002; ui.js:8574). `spell.lowHpBonus` — percent trigger, **flat bonus** (battle.js:11408).
- Armor: `finalDamage = Math.max(1, finalDamage - effectiveArmor)` (battle.js:13425) — flat subtraction, floor 1. `HIGH_GROUND_DEF_BONUS = 5` flat/step (battle.js:102, applied 13410, ui.js:8568).
- Ratios that are already safe: crit ×1.8 (Gunslinger 2.0, battle.js:5662), STAB ×1.25 (data.js:130), `DOWNHILL_DAMAGE_BONUS = 0.1`.

**B. Healing / items / shields / DoT (flat):**
- Heal spells flat `heal:` (data.js:3532 `192`, 3704 `140`, 4756 `155`; resolved battle.js:~5590, ui.js:8592).
- Healing Potion **96 HP flat** (data.js:3247); Mana Potion 40 MP (3253). Banes flat (`baneDmg:120, baseDmg:48` data.js:3268-69 et al).
- Regen status **flat 40 HP/round** (data.js:8496).
- Shields flat: 96 (data.js:3502), 150 (6033), 200 (6086); absorb is flat subtraction battle.js:13435–13443. (`shieldCapPct 0.5×maxHp` battle.js:11432/11445 is percent — fine.)
- DoT flat per tick: burn 24 (data.js:8214/8219), poison 32 (8236/8241), lava_burn `min(200, 32+stacks*32)` (8398); bleed/drowning similar. Balance-model DoT weights data.js:7676.
- Turrets: `turretDmg:120/65`, `turretHp:140/80/60/20` (data.js:6127/6855/4165; deploy defaults battle.js:11512/35193). Censer `Math.max(10, atk*0.4)` battle.js:4051.
- Already-percent (leave alone): end-of-round regen 5%/3% (battle.js:4488/4505), spawn zone 15%/35% (data.js:11031), seeds 8/6/5% (battle.js:4681–83 — but flat floors 12/16/10 at 4708/4720/4741/4763), selfHeal `healPct`, contract lifesteal 40% (battle.js:13508), real-time regen 4%/s (battle.js:10945/12195), Herbalist +25%.

**C. Structures / objectives (flat HP):**
- Tower/Cube `TOWER_MAX_HP = 2500`, `TOWER_DEF = 15` (map.js:2733-34; instantiated map.js:3120/3133/3322/3601; HUD fallback `||1500` hud.js:424/426).
- Bosses flat: hellspawn/angel `hp:200, atk:12, passiveDmg:8` (data.js:11051–11071); boss atk ×1.2 battle.js:19255.
- Arena scoring assumes tower magnitude: `ARENA_PTS = {kill:15, towerDmgPer10:1, towerDmgCap:150, hourglass:35, nexusRound:6}` (battle.js:18699/36315); domination points `floor((maxHp||1500 − hp)/10)` (ui.js:4254, battle.js:18710/36329).
- Buildings use hit-counts (`BUILDING_MAX_HITS = 4`, battle.js:94) — scale-independent ✅, **but** spell-demolish gate is `spell.dmg >= 150` flat (battle.js:14182, state.js:952) — at scale every spell demolishes.
- Fall/collapse: percent core (`FALL_DAMAGE_PCT_PER_LEVEL 0.05`, `BUILDING_COLLAPSE_PCT 0.10`) with flat mins 24/40 (battle.js:80–98).

**D. UI / feel thresholds (flat magnitude assumptions):**
- Crit/heavy flinch + blood tier + big-hit spark all trigger at `finalDamage >= 60` (battle.js:13525/13591/13574). Hit-stop tiers at 30/50/80 dmg (battle.js:13547–13549). At scale every hit maxes these.
- Floating text prints raw numbers (battle.js:13556/5607); 5-digit numbers vs `PLATE_BASE_W = 150` (three-renderer.js:9129) — check overflow.
- HP bars are percent (`hp/maxHp` — ui.js/hud.js) ✅.

**E. AI (mixed):**
- Lethality/flee/heal checks are relative/percent (ainew.js:334/673/824, ai.js:656/3532, battle.js:11726) ✅.
- **But** scoring adds raw damage estimates to flat tactical weights: kill 50000 / 3000 / 6000, collapse +1500, death tile −1500/−800 (ainew.js:334/397/422/673/675/682/727), potion scores (ai.js:338/1014), `getAIWeight` tunables (battle.js:23472+). If raw damage grows 20×, damage terms dwarf tactical terms → AI tunnels on damage.

**F. Misc:**
- XP grants are flat per-event (damage tick = 4 XP regardless of size) — pacing shifts if hit counts change.
- `playtest_heights.js:146` hardcodes a 50,000-HP test dummy.

---

## 3. Core design decision — scale by multiplier, don't retune the tables

**Principle: today's numbers are the level-100 *shape*.** The owner wants level 100 to hit/heal in today's proportions, just with 10–20k HP. So do **not** hand-retune hundreds of `dmg:`/`heal:` entries. Instead:

1. Keep every `dmg:`, `heal:`, `shield:`, DoT, potion, base-stat number in data.js as **"base power" — the level-100 reference values remain the current numbers × a global magnitude factor applied in code**, and
2. Introduce **one canonical level-scaling function** applied at resolution time to both stats and effect magnitudes.

### 3.1 The canonical curve
Add to **data.js** (single source of truth; battle.js/ui.js/ai.js all call it):

```js
// ---- Level 100 scaling (single source of truth) ----
const LEVEL_CAP = 100;
// Global magnitude: level-100 output = today's numbers × EW_SCALE.
// 20 × ~550 avg base HP ≈ 11k → within the 10–20k target once level HP growth lands.
const EW_SCALE = 20;
// Smooth power curve: levelScale(1) small, levelScale(100) = EW_SCALE.
// Exponent ~1.35 keeps early levels gentle and late levels meaningful.
function levelScale(level) {
  const L = Math.max(1, Math.min(LEVEL_CAP, level || 1));
  return 1 + (EW_SCALE - 1) * Math.pow((L - 1) / (LEVEL_CAP - 1), 1.35);
}
```

Sanity anchors (tune exponent/EW_SCALE to taste; targets, not law):
- L1 ≈ ×1 → a base unit (~450–660 HP) plays like today's level ~1–2.
- L50 ≈ ×7–8.
- L100 = ×20 → ~9k–13k HP before job/level HP growth; with growth lands in **10–20k** ✅.

### 3.2 What gets multiplied by what
- **Unit stats** (maxHp, mp, atk, def, mdef, int): `stat = round(baseStat × levelScale(level))` — replace the additive `LEVEL_UP_GAINS` table (see §4.1). SPD/MOVE/AWR/range stay unscaled (they're spatial, not magnitude).
- **Spell/ability damage & heals & shields**: `amount = round((spell.dmg + spellPower) × levelScale(casterLevel))` at the resolution chokepoints (battle.js:8550/8552/2862, heal path ~5590, shield application). Same for `hitDamages`, `chainProfile`, banes, turretDmg, `ENTROPY_STRIKE_BASE_DMG`, mark bonus, `lowHpBonus`, `dmgPerLevel`.
- **DoTs**: tick = `round(baseTick × levelScale(sourceLevel))`. Requires stamping the **applier's level** on the status when applied (data.js:8203 `STATUS_DEFS` currently hardcodes `applyDamageToUnit(unit, 24, …)`). Store `st._srcLevel` at apply time; fall back to target level if missing.
- **Flat floors/variance**: scale them too — `Math.max(24 × ls, …)`, `randInt(40 × ls) − 16 × ls` (or convert variance to a percent of the roll: `× (0.9 + rand()*0.15)` — cleaner, recommended). The `Math.max(1, dmg − armor)` armor model survives because atk/def/spell dmg all scale by the same factor, preserving today's ratios ✅.
- **Percent systems**: untouched (already listed in §2.4B as safe).

Because attacker output and defender HP scale by the *same* `levelScale`, **same-level combat at any level feels identical to today** — that's the property the owner asked for, and it makes low-level MD/Challenge/Endless automatically safe (a level-3 spell can't nuke a level-3 unit any harder than today).

**Cross-level encounters** (MD floor mobs 2 levels up, etc.) get a natural, bounded advantage from the curve — no extra clamping needed at first; add a cap later if playtests show spikes.

### 3.3 Potions & consumables → percent
- Healing Potion: `heal 96` → **`healPct: 0.35`** of maxHp (≈ current 96/~550 ≈ 17%… pick 25–35% for item value; owner to tune). Mana Potion → `mpPct: 0.35`.
- Banes: keep flat base but ×`levelScale(userLevel)` (they're attack items, not sustain).
- AI item scoring (ai.js:338/1014) already keys off percent triggers — just make the heal-value estimate use the pct.

---

## 4. Implementation work items

### Phase 1 — Core engine (battle.js, data.js, map.js)
1. **data.js**: add `LEVEL_CAP`, `EW_SCALE`, `levelScale()` (§3.1). Delete/deprecate `LEVEL_UP_GAINS` (data.js:11128).
2. **battle.js:16220** `XP_MAX_LEVEL = 100` (rename usage or alias to `LEVEL_CAP`).
3. **XP curve**: replace the 10-entry `XP_THRESHOLDS` array with a generated 100-entry curve, e.g. `threshold(L) = round(12 × (L−1)^1.9)` (keeps early levels quick; L100 ≈ 72k cumulative). Keep it a precomputed array so `getUnitLevel` stays a table lookup. **Fix the 845 vs 1060 inconsistency** — make map.js:6198 use `XP_THRESHOLDS[LEVEL_CAP−1]`, no magic fallback.
4. **Rewrite `applyLevelUpRewards`** (battle.js:16289):
   - Stat part becomes recompute-from-base: keep the unit's level-1 base block (store `unit._baseStats` at build time in map.js) and set `stat = round(base × levelScale(newLevel))`, healing the HP/MP delta as today. This also fixes drift from the loop-prelevel pattern.
   - Milestones re-mapped to the 100 scale (proposal — owner tunes): secondary job **Lv15** (was 4), spell shop **Lv10** (was 3), AP+1 at **Lv40 and Lv80** (was 6/9), flavor milestones every 25. Keep `_pendingSecondaryJobPick` / `_xpBonusAP` mechanics as-is.
   - Spell learning: **keep the hook, defer the table.** Generalize to `getSpellUnlockLevel(cls, idx)` — default spread `[1,1,5,15,30]` mapping onto today's `CLASS_SPELL_LEARN_ORDER` indices, so behavior is preserved and the owner can later drop in a full per-class table without touching the engine (see §7).
5. **map.js builder** (~6084–6237):
   - PvP branch: prelevel to **100** (don't loop 99 `applyLevelUpRewards` calls for stats — with recompute-from-base, one call sets stats; loop only the milestone/spell unlock levels, or refactor `setUnitLevel(unit, L)` that applies stats once + iterates unlock milestones).
   - Campaign/MD branch: same `setUnitLevel` with `min(_campaignLevel, LEVEL_CAP)`.
   - Add a per-mode config instead of the `isCampaign || _mdRun` special case: `MODE_LEVEL_RULES = { pvpNormalized: 100, progression: ['dungeon','challenge','endless','campaign'] }` — **this is the Endless hook**; when Endless is added it just joins the progression list.
6. **Resolution chokepoints**: apply `levelScale(sourceLevel)` at battle.js:8550/8552/2862 (spell dmg), heal path (~5590), shields (13435 apply-side), counter 5700, basic-attack sites 29607/29327/29435/11598 (scale floor+variance or go percent-variance), Entropy Strike 6086, mark bonus 13417, censer 4051.
7. **DoT**: stamp `_srcLevel` on status application; scale ticks in data.js:8203–8400 handlers (burn/poison/lava/bleed/drowning) and seed floors (battle.js:4708–4763).
8. **grantXP**: retune award constants for the new curve. Recommendation: make in-battle XP awards scale with level bracket (e.g. `× (1 + level/10)`) or simply retune flat values against the new thresholds so a typical MD floor grants ~1–2 levels early game. Damage/heal XP (flat 4 per event) is fine since event counts don't change.

### Phase 2 — World objects & modes
9. **Towers**: `TOWER_MAX_HP` scales with the match's level context: `2500 × levelScale(matchLevel)` (matchLevel = 100 in PvP). Fix HUD `||1500` fallbacks (hud.js:424/426) and domination scoring divisor — change `towerDmgPer10` to per-1%-of-tower or divide by `10 × levelScale` (battle.js:18710/36329, ui.js:4254, `towerDmgCap` 150 likewise).
10. **Turrets/bosses/summons**: `turretHp/turretDmg`, hellspawn/angel `hp/atk/passiveDmg` (data.js:11051+) × levelScale of their context (MD boss = its own level — already has one; arena bosses = 100).
11. **Building demolish gate** `spell.dmg >= 150` (battle.js:14182, state.js:952): compare **unscaled base** `spell.dmg` (it's a spell-class check, not a magnitude check) — easiest correct fix.
12. **Challenge level ranges** (data.js:11175): stretch `generateChallengeLevel` across 1–100 (e.g. batch n → `[min(3+4n, 96), min(5+4n, 100)]`). MD floor→level map (data.js:10919): decide pacing, e.g. `level = min(100, floor × 3)`, boss +2. Campaign enemy ranges (battle.js:19112) inherit whatever campaign data says — clamp to 100.

### Phase 3 — Feel, UI, AI
13. **Hit feedback thresholds → percent of target maxHp**: crit-flinch/blood/big-hit `>= 60` → `>= target.maxHp × 0.12`; hit-stop tiers 30/50/80 → 6%/10%/16% (battle.js:13525–13591).
14. **Floating text**: abbreviate ≥10k (`12.4k`) in battle.js:13556/5607 and check plate width (three-renderer.js:9129). HP readouts anywhere showing raw `hp/maxHp` text need thousand-separators or `k` formatting.
15. **AI weights**: normalize damage terms into HP-relative space before mixing with tactical constants — score with `est / target.maxHp × K` (pick K ≈ 600 so current-magnitude behavior is preserved at level 10-equivalent) in ainew.js scoring (334/397/422/673+), or scale the flat weights by `levelScale(matchLevel)`. The HP-relative form is the future-proof one — **recommended**.
16. **playtest_heights.js:146** dummy HP + any harness assumptions; update PLAYTEST_NOTES.md with the new system.

### Phase 4 — Persistence & polish
17. Campaign/MD roster save data stores raw `xp` (battle.js:19062/19877–19923): old saves have level-10-curve XP. Add a one-time migration: if `rInst.xp <= 845` and save predates the change (add a `saveVersion`), remap by level: `xp = NEW_THRESHOLDS[oldLevel−1]`.
18. HUD level/XP bar (hud.js:3022/3351, ui.js:1409, profile.js:692, three-renderer.js:8893/9069) — all go through `getUnitLevel`/`getXPProgressPct`, so they inherit the change; verify 3-digit level fits the layout.
19. Delete dead `XP_STAT_UPGRADE_PER_LEVEL` or turn it into a real stat-allocation feature later (out of scope).

---

## 5. PvP normalization spec
- Every unit in `ACCT_PVP_MODES` (+ gauntlet, shooter) is built at level 100 via `setUnitLevel(unit, 100)`; `_xp = XP_THRESHOLDS[99]`; `grantXP` remains a natural no-op at cap (keep the cap guard explicit).
- All spell slots/secondary job/AP bonuses granted, exactly as the current "prelevel to max" flow — just against the new milestone levels.
- Server (server.js) needs **no gameplay change** (relay only), but `ACCT_PVP_MODES` at server.js:36 / data.js:8774 is the authoritative "normalized" list — reuse it for `MODE_LEVEL_RULES`.

## 6. Progression modes (MD / Challenge / Endless)
- Start levels: MD floor-based, Challenge batch-based (§4.12), Endless (future) starts L1–5 and scales indefinitely via wave → level mapping capped at 100 (after cap, scale enemy *count/quality*, not level).
- Because same-level combat is magnitude-invariant (§3.2), low-level play is automatically balanced; the tuning surface is just the enemy-level offsets per floor/batch.

## 7. Spells-by-level — deferred design, ready hooks
The owner is still fleshing out movesets. Do **not** invent a 100-level spell table now. Instead:
- Implement `getSpellUnlockLevel(cls, spellIdx)` (§4.4) with the compatibility default `[1,1,5,15,30]`.
- When movesets solidify, replace with a data-driven `CLASS_SPELL_UNLOCKS = { warrior: { slash: 1, whirlwind: 22, … } }` in data.js — the engine hook won't change.
- Consider (future) spell *rank-ups*: same spell, higher rank at milestone levels — cheap content that fits the multiplier system (`rank` bumps base dmg %, not new assets).

## 8. Job level — recommendation: **not now**
A separate job level (FFT-style) is a real system: per-job XP pools, per-unit-per-job tracking, UI, save format, AI. It also competes with the existing **secondary job at 25% modifiers** mechanic, which already provides job-based customization. Recommendation:
- Ship level 100 with the single unit level.
- Leave the door open: the recompute-from-base stat model (§4.4) makes it trivial to later add `jobLevel` as a *second multiplier or additive bonus on JOB_MODIFIERS only* (e.g. `jobBonus × (1 + jobLevel × 0.02)`), and secondary-job mastery could raise the 25% ratio (data.js:3029 `RATIO`). Note this as the intended extension point; don't build it.

## 9. Tuning knobs (single place)
All in data.js next to `levelScale`: `LEVEL_CAP`, `EW_SCALE` (magnitude, sets the 10–20k target), curve exponent (1.35), XP curve params, potion `healPct`, milestone levels list, feedback-threshold percents. One delivery of data.js retunes the whole system.

## 10. Suggested delivery order (each = full files via chat + index.html `?v=` bump)
1. **Drop 1 (core):** data.js + battle.js + map.js — curve, thresholds, rewards rewrite, chokepoint scaling, mode rules. Game fully playable at both L100 PvP and low-level MD.
2. **Drop 2 (world):** towers/turrets/bosses/scoring (battle.js, map.js, hud.js, ui.js, state.js).
3. **Drop 3 (feel):** feedback thresholds, number formatting, AI weight normalization (battle.js, ui.js, ainew.js, ai.js, three-renderer.js).
4. **Drop 4:** save migration + PLAYTEST_NOTES.md update.

After each drop: `node --check` every edited file; no playtesting unless the owner asks (CLAUDE.md RULE #1c).

## 11. Verification checklist (owner-run or on-request playtest)
- [ ] PvP (tdm): both sides L100, HP in 10–20k, time-to-kill feels like today.
- [ ] MD floor 1: L1–3 units, ~450–700 HP, spells hit for today's proportions (no one-shots).
- [ ] Potions heal a sensible % at both L1 and L100.
- [ ] Burn/poison ticks proportionate at both extremes.
- [ ] Tower damage scoring in domination still awards sane points.
- [ ] Hit-stop/crit VFX not permanently maxed; damage numbers readable at 5 digits.
- [ ] AI still retreats/heals/uses items at L100 (weights not drowned by raw damage).
- [ ] Old campaign/MD save loads with correct levels.
