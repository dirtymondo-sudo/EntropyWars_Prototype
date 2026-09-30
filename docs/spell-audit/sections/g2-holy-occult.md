### 👼 Heavenly Duties `angelic` — VERDICT: KEEP (reshape: 4/1/1/1 → 2/2/2/1)
**Identity.** The angelic support kit — mercy in motion: heal, cleanse, lift, rescue-swap, consecrated ground, and one heaven-sent smite that punishes the Unholy.
**Races.** priest ✓ (channels divine energy), angel ✓, seraphim ✓, nun ✓ (sister of mercy), valkraye ✓ (divine psychopomp — she carries the slain to heaven), **fallen angel ✓ (KEEP)** — his lore says he "retains angelic power output"; the powers are still his, only the directive is gone. [SKEPTIC: the proposed RACE_REMOVE fallen angel / RACE_ADD `infernalcourt` is STRUCK — Infernal Court is "the rule of hell: decrees, conscriptions and dark crowns"; his lore has no court, no command and no Lucifer, so it fails the yeti test harder than the family it replaced, and the removal would also strip his only heals (Divine Light / Purify / Sanctuary — all three of his heal rows). Rung 3 stays `raceSanctuary`.] No race off the family plainly belongs on it.
**Now.**
- T1 Divine Light `raceDivineLight` · heal 140 single, rng 3, 25MP.
- T1 Purify `racePurify` · 3×3 at rng 3: allies lose every debuff, enemies lose every buff.
- T1 Radiant Bolt `radiantBolt` · 100 light magic single, rng 4.
- T1 Rapture `raceRapture` · Protect 1 round on an ally, rng 4, **2 AP**, CD2.
- T2 Miracle `raceWingsOfMercy` · swap with an ally, "heals on arrival" (`healOnSwap: 60`).
- T3 Sanctuary `raceSanctuary` · 3×3 zone, 48 HP/round for 2 rounds.
- T4 Divine Smite `raceDivineSmite` · 180 light magic single, rng 4, **2 AP**, +80 vs Unholy.
**Problems.**
- Radiant Bolt is Smite (`raceSmite`, Light T1, 100 light magic) with +1 range; priest/angel/seraphim/nun own both families and get two identical T1 bolts (summary redundancy group "damage | damage | light | single | 3").
- `healOnSwap` is read by nothing (data.js:6170 is its only occurrence in the repo): Miracle's "the ally heals on arrival" is a dead promise.
- Sanctuary at T3 (48/round × 2 = 96) is worse than Water's T2 Tidal Blessing (52/round × 2 for 50MP) and far under T3 Temporal Tide (100/round).
- Divine Smite costs 2 AP for 180 single; Exorcism (T4, 1 AP) does 160 + the same +80 Unholy AND a ×1.5 finisher. Ancient Magic/Flat Earth/Jurassic Jaw are 180 at 1 AP.
- Rapture (T1, 2 AP, CD2) and Protect (`protect1`, Light T2, 1 AP, CD3) both apply protect 1 round to the same four races — same effect, two rows.
- Purify at T1 (double-sided AREA cleanse) dominates every single-target cleanse in the game (Absolution T2, Cleanse T2, Herbal Remedy T1 cleanse 2).
- Four T1 rows, one row each at T2/T3/T4.
**Changes.**
- DELETE `radiantBolt` (Smite covers it for every caster on the family; valkraye is a 26-INT bruiser who never wanted a magic bolt). Angel rung 1 `radiantBolt` → `raceDivineLight`.
- RETIER `racePurify` T1 → T2 (50MP). It stays the only area cleanse in the game and now sits above the single-target ones. Nun rungs: see Bible Study below — ONE set, `[[raceAbsolution, raceBlessing], [racePurify, raceCultSermon], racePrayer, raceHallelujah]` (the file previously gave two different nun rung sets; this is the one that stands — every id is in Bible Study or Heavenly Duties, both hers).
- RETIER + REWRITE `raceRapture` T1 → T2 (50MP), 1 AP, CD2, rng 4: the ally is lifted — Protect 1 round AND Levitating 2 rounds (temporary flight with the high-ground bonus). Now it differs from Protect: it pulls a tank out of a melee scrum or over a wall. Seraphim rungs → `[raceAbsolution, raceRapture, raceSanctuary, raceMerkaba]`.
- REWRITE `raceWingsOfMercy` (Miracle): keep the swap; wire `healOnSwap` in battle.js and set it to 100 (a T2 heal-lite). Until wired, strike the "heals on arrival" clause.
- REWRITE `raceSanctuary`: healPerTurn 48 → 90, zoneDuration 2 → 3 (270 per ally over 3 rounds if they hold the ground — the consecration rewards holding a point, which is the tank/healer plan).
- RECOST `raceDivineSmite` 2 AP → 1 AP (100MP, 180, +80 vs Unholy stays). It is the anti-Unholy hammer; Exorcism is the anti-curse one.
- MOVE `raceDivineJudgment` (Holy Defense → `angelic`): it is defined in the seraphim's block (data.js:6085) but the seraphim is not on Holy Defense, so only valkraye (INT 26) and crystal guardian (INT 40) can equip a 135 MAGIC cross. RECOST 50MP → 75 (on ladder), 2 AP → 1 AP, dmg 135 → 125, Burn 2 kept. It becomes the family's T3 damage and feeds Merkaba's burn finisher (seraphim rung 4) inside one race.
**Additions.** None — after the moves the ladder is T1 Divine Light, (Purify→T2) · T2 Purify, Rapture, Miracle · T3 Sanctuary, Divine Judgment · T4 Divine Smite. Seven rows, every tier filled, nothing duplicated.
**Upgrades.** Efficient on Divine Light; Long Reach on Miracle (rescue from 5); Lingering on Rapture (Protect 2 rounds for 1 SP — the family's premium defensive line); Empowered + Blast on Divine Smite (Blast makes it the family's 3×3 — no separate area smite). `upWiden` only takes damage roles (its `area` fit in SPELL_UPGRADE_FITS also tests `spellHasDamage`), so Purify/Sanctuary cannot grow: add a family-scoped upgrade **Consecrated** (2 SP, `families: ['angelic']`, patch `{ aoe: { preset: '5x5' } }`) for Purify and Sanctuary — it needs a NEW fit key (e.g. `areaAny`: `aoeRadius > 0`, no damage test) added to SPELL_UPGRADE_FITS, because the existing `area` key would reject both rows (no dmg).

### 📖 Bible Study `biblestudy` — VERDICT: KEEP (6 rows; the cult rows leave)
**Identity.** Scripture as support: bless, absolve, shield with prayer, and — when the enemy is cursed or contracted — burn the curse out with an Exorcism.
**Races.** priest ✓, nun ✓ ("blessings that hold under fire, a choir that can be heard through the wall"), seraphim ✓ (the scripture's own source; Blessing/Prayer/Exorcism/Hallelujah all read as a seraph's). No misfits; nobody off the family plainly belongs (knight/arthur are already holy through Knighthood).
**Now.**
- T1 Sermon `raceCultSermon` · aura r2, allies Blessed 2 rounds; shadow element, spellType unholy, "the word is him".
- T2 Absolution `raceAbsolution` · heal 80 + cleanse ALL, rng 3. (**Defined twice**: data.js:6090 seraphim = healAll 130 + cleanse, 2 AP; data.js:7077 priest = heal 80 single. `RACE_ABILITY_BY_ID` is last-write-wins, so the priest row is live and the seraphim row is dead code.)
- T2 Blessing `raceBlessing` · Blessed 3 rounds single (+1 DEF, +1 M DEF, 40 HP/round).
- T2 Tithe `raceCultTithe` · 50 shadow magic + steal 1 item, rng 2, 25MP (off-ladder), "everything you own belongs to the family".
- T3 Prayer `racePrayer` · 150 HP barrier single.
- T4 Exorcism `exorcism` · 160 light magic, 1 AP, rng 3, finisher contract/hexed ×1.5, +80 vs Unholy.
- T4 Hallelujah `raceHallelujah` · heal 180 all allies + cleanse 2, 2 AP.
**Problems.**
- Sermon and Tithe are cult-leader rows (ids `raceCult*`, unholy, shadow, cult voice) filed under a family the cult leader does not own. Tithe is identity drift; Sermon is a priest's verb wearing the wrong robe.
- Sermon at T1 (team Blessed 2 rounds, 25MP) dominates Blessing at T2 (single Blessed 3 rounds, 50MP): N allies × 2 rounds beats 1 ally × 3 rounds.
- Blessed has SETUP 2 / PAYOFF 0 (synergy.md) — nothing in the game cares that an ally is Blessed.
- Prayer (T3, 75MP, shield 150) is Psychic Barrier (T2, 50MP, shield 150) at a higher price.
- Absolution's duplicate row: the seraphim's rung 2 resolves to the priest's version; the healAll-130 version can never be equipped.
**Changes.**
- MOVE `raceCultTithe` → `cult` and RETIER T2 → T1 (it already costs 25MP; 50 dmg + steal is a T1 payload). Cult of Personality gets its missing T1.
- REWRITE `raceCultSermon` (stays here — priests give sermons): element shadow → light, spellType unholy → divine, desc "Gather round. Allies within 2 tiles are Blessed for 2 rounds — they have heard the word." RETIER T1 → T2 (50MP): team-wide Blessed is a T2 payload.
- RETIER `raceBlessing` T2 → T1 (25MP): single Blessed 3 rounds is the family's cheap opener; Sermon is the T2 team version.
- RETIER `raceAbsolution` T2 → T1 (25MP): heal 80 + full cleanse single is a T1 next to Herbal Remedy (T1, 160 + cleanse 2). DELETE the dead seraphim row at data.js:6090 so the id is defined once.
- REWRITE `racePrayer` (T3, 75MP, 1 AP, rng 3): shield 150 → 200 AND the ally is Blessed 2 rounds — prayer is barrier plus blessing, distinct from Psychic Barrier and from Blessing.
- REWRITE `raceHallelujah`: Blessed allies are healed ×1.5 (270) — the Blessed payoff. Needs a small hook (`healBonusVsStatus: { status: 'blessed', mult: 1.5 }`) in the healAll path.
- Tree rungs: priest `[raceDivineLight, protect1, raceSmite, exorcism]` → rung 3 `raceSmite` (a T1 in ring 3) → `racePrayer`. Nun → `[[raceAbsolution, raceBlessing], [racePurify, raceCultSermon], racePrayer, raceHallelujah]`.
**Additions.** None. Ladder: T1 Absolution, Blessing · T2 Sermon · T3 Prayer · T4 Exorcism, Hallelujah.
**Upgrades.** Lingering on Blessing (Blessed +1 round, 1 SP — the family's obvious pick); Sermon only takes Lingering if its aura is written as `statusEffects` — today it uses `teamStatusEffects`, which the `status` fit in SPELL_UPGRADE_FITS does not read; Exploit on Exorcism (×2 vs hexed/contract — pair a priest with a witch or a demon and that is the team's finisher); Efficient on Hallelujah. No Blast/Forked on Exorcism by default — it is the single-target rite; a Forked Exorcism is fine as a player choice.

### 🏥 Healing Magic `healingmagic` — VERDICT: KEEP (fill T2, fix the over-tuned T1)
**Identity.** The plain white-magic ladder every healer class can lean on: burst heal, party heal, revive — no flavour, pure sustain.
**Races.** priest ✓, angel ✓ ("radiates restorative energy field"), orb of light ✓ (divine support), starfish ✓ ("keep the squad alive"; rungs heal1/revive1), hippie ✓ (support, "keep a whole squad on its feet"). **ice queen ✗** — absolute-zero crystalline caster with "dominion over the frozen places between the stars"; nothing in her lore heals. RACE_SWAP ice queen: `healingmagic` → `cosmic` (Entropic Beam / Heat Death / Black Hole ARE the frozen places between the stars; her rungs are all Ice, nothing breaks). **cult leader ✗** — his lore is charm, indoctrination and "the passing of a cup", not healing; Meditation (below) gives him sustain. RACE_REMOVE cult leader.
**Now.**
- T1 Heal `heal1` · heal 192 single, rng 3, more on allies under 40% HP.
- T3 Heal All `healAll` · heal 140 all allies, 1 AP.
- T4 Revive `revive1` · revive at 45% HP, rng 4, once per unit per match.
**Problems.**
- Heal at T1 (192) out-heals every T2 heal in the game (Palm Read T2 190, Absolution T2 80) and Divine Light (T1 140) by a mile; a 25MP row that also scales up on low allies is the best heal per MP in the game.
- No T2.
**Changes.**
- RETIER `heal1` T1 → T2 (50MP). Numbers stay (192, +bonus under 40%). Starfish rung 1 `heal1` → new `raceSoothe`; rung 2 → `[heal1, raceTidalBlessing]`.
**Additions.**
- NEW **Soothe** `raceSoothe` — T1 heal/heal, light, 25MP 1 AP, rng 3, single: heal 80 and Regen 2 rounds. "A hand on the brow. It does not fix you; it keeps you going." The T1 that is a heal-over-time, so it does not duplicate Divine Light's flat 140 and rewards casting before the hit lands.
- PASSIVE **Triage** `passiveTriage` — T1 (1 SP), `hooks: { healOnceBelowPct: { pct: 40, healPct: 30 } }`: once per life, dropping under 40% HP heals 30% max HP. The healer who keeps herself alive when the assassin dives her.
**Upgrades.** Efficient + Long Reach on Heal (the workhorse); Efficient on Heal All (already 1 AP; this just makes the 75MP party heal cheaper). Revive takes Long Reach only. Grace (Training) already stacks +24/+2 range onto all of these — that is the intended passive pairing; do not add a healMult family passive on top of Devout + Grace.

### 👼⚔️ Holy Defense `holydefense` — VERDICT: KEEP (5 rows; the magic cross leaves, the duplicate shield becomes a taunt)
**Identity.** The holy front line: shield the squad, hold the ground, dive the flank with a spear, and choose who comes back from the dead.
**Races.** valkraye ✓ (spear, honor, chooser of the slain), crystal guardian ✓ ("stood watch over one door… hold ground"). [SKEPTIC: the proposed RACE_ADD **knight** is STRUCK — four of the family's five rows are Norse-valkyrie rows by name (Valkyrie Spear, Shield Maiden, Divine Swoop, Chooser of the Slain = the literal translation of "valkyrie"); a chivalric human in full plate throwing a Valkyrie Spear is the yeti in the Santa hat. The knight keeps Knighthood (4) + Swordsmanship (5) + Horseback Riding (1) = 3 families, pool 10, all four rungs inside Knighthood — legal and on-theme.] Golem (divine sigils) is thematically close but has 70 MP and INT 0 — leave him on Living Stone.
**Now.**
- T1 Valkyrie Spear `raceValkyrieSpear` · 100 physical single, rng 2, DEF −1.
- T2 Holy Bulwark `raceHolyBulwark` · 160 shield to all allies in a 3×3 at rng 3.
- T2 Shield Maiden `raceShieldMaiden` · 120 shield, `aoeRadius: 0` = one ally, rng 3.
- T3 Divine Judgment `raceDivineJudgment` · 135 MAGIC cross r2 + Burn 2, 50MP (off-ladder), 2 AP.
- T3 Divine Swoop `raceDivineSwoop` · leap strike 125 physical, +20 per level dropped.
- T4 Chooser of the Slain `raceChooserOfSlain` · revive at 60%, rng 4, 2 AP, once per unit per match.
**Problems.**
- Shield Maiden is Holy Bulwark with a smaller number and no area, same tier, same races — strictly dominated (summary group "effect | aoeShield").
- Divine Judgment is a magic cross on a family whose owners have INT 26 / 40; it was written for the seraphim (data.js:6085) who cannot equip it. Off-ladder 50MP at T3.
- Chooser of the Slain costs 100MP; the valkraye has **80 MP** — her own rung-4 capstone is uncastable.
**Changes.**
- REWRITE `raceShieldMaiden` (T2, 50MP, 1 AP, self): +1 DEF stage and every enemy within 2 tiles is Taunted for 1 round (must attack her). The shield-maiden stands in front — a tank's tool, not a second shield. Valkraye rung 2 stays `raceShieldMaiden`.
- MOVE `raceDivineJudgment` → `angelic` (see Heavenly Duties for its retune).
- RECOST `raceChooserOfSlain` MP 100 → 75 (pinned override; keeps 2 AP, 60%). The valkraye must be able to cast her capstone with 80 MP. Same problem hits Crusade/Excalibur below.
**Additions.** None. Ladder: T1 Spear · T2 Bulwark, Shield Maiden · T3 Swoop · T4 Chooser. Five rows for a support-tank family is the right size; valkraye pads her front with Chivalry/Shield Bash from Knighthood (her RACE_ADD below).
**Upgrades.** Knockback on Valkyrie Spear (spear-shove off a ledge, 1 SP); Empowered on Divine Swoop; Lingering on Shield Maiden (Taunt 2 rounds). Shields cannot take Widen (damage roles only): add a family-scoped **Reinforced** (1 SP, `families: ['holydefense']`, patch `{ shieldHp: +60 }`) for Holy Bulwark — SPELL_UPGRADE_FITS has no `shieldHp` key today, so add one (`shieldHp: d => (d.shieldHp | 0) > 0`). Chooser takes Long Reach only.

### ♞ Knighthood `knight` — VERDICT: GROW (3 → 4; shared with every knightly race)
**Identity.** The code, not the crown: take the hit for your ally, bash and stagger, swear an oath that lifts the line, and crusade through the Unholy.
**Races.** knight ✓, king arthur ✓. RACE_ADD **valkraye** ("unwavering honor code, refuses to engage unworthy opponents" — the code is in her lore line; Crusade's +60 vs Unholy suits a divine psychopomp, and she has the 80 MP for its pinned 75). [SKEPTIC: the proposed RACE_ADD **crystal guardian** is STRUCK — "in the shape of a knight" is a silhouette, not a code; its lore is "hold ground… do not move unless something makes them", which Chivalry (dash to an ally) and Crusade (a charge through the line) contradict outright. It already has 4 families / pool 23 and needs nothing.] Knighthood becomes the shared knightly-code family; Camelot Powers stays Arthur's court.
**Now.**
- T1 Chivalry `raceChivalry` · guard an ally: next time they are attacked you dash over and take the hit, CD2.
- T3 Oath of Valor `raceOathOfValor` · aura r2, ATK +1 stage, 75MP.
- T4 Crusade `raceCrusade` · 160 MAGIC cross r2, rng 4, 2 AP, +60 vs Unholy.
**Problems.**
- Oath of Valor (T3, 75MP) is Royal Decree (`raceRoyalDecree`, Camelot T1, 25MP) — the same ATK +1 aura r2 on the same two races, at triple the price (summary's "effect | warCry | atk1" group lists Royal Decree beside Rally Command; Oath of Valor escapes it only because its element is light).
- Crusade is MAGIC damage on a knight with INT 29 and an Arthur with INT 28; and it is 2 AP, and it costs 100MP on a knight with **95 MP** and an Arthur with **80 MP** — neither can cast it. It also duplicates Judgment (Light T4, cross).
- No T2.
**Changes.**
- REWRITE `raceOathOfValor` (T3, 75MP, 1 AP, aura r2): allies within 2 gain +1 ATK AND +1 DEF stage. The T3 oath is the two-stat rally; Royal Decree stays the cheap ATK-only one.
- REWRITE `raceCrusade` (T4): damageType physical, self-centred cross r2 (`aoeOriginSelf`, rng 0), 160, 1 AP, +60 vs Unholy, MP pinned 75. "Deus vult" is a charge through the line, not a spell lobbed from 4 tiles.
- Knight rungs → `[raceChivalry, raceShieldBash, raceOathOfValor, raceCrusade]` (rung 2 was `raceShieldWall`, which goes unique to Arthur).
**Additions.**
- NEW **Shield Bash** `raceShieldBash` — T2 damageEffect/damage, physical, 50MP 1 AP, rng 1, single: 110 and Stagger 1 (the target loses 1 AP). "Edge of the shield, under the chin." Fills T2; Stagger also feeds Robo Punch/Horn Toss-style teammates and is the setup a knight with Excalibur (burn) → Dragon Slash (burn finisher) does not otherwise have.
**Upgrades.** Chivalry takes no Lingering (it is a `utility/guard` row with no `statusEffects`; Lingering fits only damageEffect/effect rows that apply a status) — Efficient and Long Reach are its picks; Knockback on Shield Bash (the `push` fit accepts any single-target damage hit); Empowered + Widen on Crusade (Widen turns the self-cross into the 5×5 — do not add a separate area crusade). Efficient on Oath for the 80-MP Arthur.

### 🏰 Camelot Powers `royalty` — VERDICT: KEEP → UNIQUE to king arthur
**Identity.** The court of Camelot: a king's decree, his curtain wall, the Round Table answering the call, and Excalibur.
**Races.** king arthur ✓. **knight ✗** — Arthur's lore: Excalibur "cannot be wielded by any other tested subject", yet the knight owns the family and equips Excalibur Strike. RACE_REMOVE knight; set `unique: 'king arthur'` (the D.O.O.R. Gun model). The knight keeps Knighthood (grown to 4), Swordsmanship (5) and Horseback Riding (1): 3 families, pool 10 (was 13; the Holy Defense add was struck — see that family). Knight rungs `[raceChivalry, raceShieldBash, raceOathOfValor, raceCrusade]` all sit in Knighthood.
**Now.**
- T1 Royal Decree `raceRoyalDecree` · aura r2, ATK +1 stage.
- T2 Walls of Camelot `raceShieldWall` · 3 castle-wall tiles in a line, 60 dmg to enemies on them, blocks move and sight.
- T3 Knights of Round `raceKnightsOfRound` · every ally on the field is pulled to the King (rooted ones cannot come).
- T4 Excalibur Strike `raceExcaliburStrike` · 180 physical, rng 1, Burn 2, 100MP.
**Problems.**
- Excalibur Strike costs 100MP; Arthur has **80 MP**. His own rung-4 capstone is uncastable.
- Otherwise a clean 1/1/1/1 with a unique T3 (the only whole-team pull in the game).
**Changes.**
- RECOST `raceExcaliburStrike` MP 100 → 75 (pinned). Burn 2 stays — it is Arthur's setup for Dragon Slash (Swordsmanship T4, burn ×1.5), his own self-contained finisher chain.
- FAMILY registry: `unique: 'king arthur'`.
**Additions.** None.
**Upgrades.** Empowered + Exploit-free (no finisher) on Excalibur; Long Reach on Walls (place from 4); Efficient on Knights of Round. Do not allow Widen on Walls (tiles3 is a line, not an area — `requires: 'area'` already excludes it).

### 🧘 Meditation `meditation` — VERDICT: GROW (2 → 4; the self-mastery family)
**Identity.** Inner peace as sustain: breathe, cleanse, chant the team into regen, then wake up as the prophecy.
**Races.** hippie ✓ ("camped at the stones on the solstice"), cult leader ✓ (the guru at the altar). RACE_ADD **ki fighter** — meditation is the root of every martial art, Awakening (cleanse, +30% HP, ATK +2 / SPD +2 self) is the power-up transformation his kit is missing, and summary.md lists ki fighter as missing "sustain". Shaman already has Ayahuasca Retreat for this role — leave him off.
**Now.**
- T2 Cleanse `cleanse` · remove harmful statuses from one ally, rng 3.
- T4 Awakening `raceAwakening` · self, 2 AP, CD3: cleanse all, heal 30%, ATK +2, SPD +2.
**Problems.**
- Cleanse (T2, 50MP, cleanse only) is dominated by Absolution (heal 80 + cleanse all) and Herbal Remedy (T1, heal 160 + cleanse 2); after this audit Purify (area) sits at the same tier.
- No T1, no T3.
**Changes.**
- RENAME + REWRITE `cleanse` "Cleanse" → "Inner Peace" (T2, 50MP, 1 AP, rng 3, single ally): removes every debuff AND +1 M DEF stage. Now it is the cleanse that also hardens the mind; hippie rung 2 keeps the id.
**Additions.**
- NEW **Deep Breath** `raceDeepBreath` — T1 heal/selfHeal, 25MP 1 AP, self: heal 100 and cleanse 1. "In through the nose." The cheap self-sustain a support casts between real turns; unlike Soothe (ally) it is self-only, unlike Reassemble (T2) it cleanses.
- NEW **Mantra** `raceMantra` — T3 effect/warCry, light, 75MP 1 AP, aura r2: allies within 2 gain Regen 3 rounds (Regen = 40 HP/round in data.js, so 120 per ally) and cleanse 2 each. "One word, everyone breathing it." The team-sustain T3 that makes a meditation build viable without a dedicated healer; pairs with Sanctuary/Tidal Blessing zones. [SKEPTIC: was Regen 2 + cleanse 1 — 80 HP per ally, which the rewritten Sermon (T2, aura r2, Blessed 2 = the same 80 HP PLUS +1 DEF/+1 M DEF) dominated from a tier below; renumbered so the T3 beats the T2.]
- Ladder: T1 Deep Breath · T2 Inner Peace · T3 Mantra · T4 Awakening.
**Upgrades.** Lingering on Mantra (Regen +1 round) only if its aura Regen is written as `statusEffects` (the `status` fit ignores `teamStatusEffects`); Inner Peace as written (cleanse + a stat stage) applies no status, so Lingering does not fit it — Efficient/Long Reach instead; Efficient on Awakening (100 → 90; the ki fighter has 120 MP, so the capstone is castable as-is — one cast per life, which is right for a transformation). Awakening has no dmg, so Empowered never applies — nothing to do.

### ✌️ Cult of Personality `cult` — VERDICT: GROW (3 → 4, T1 arrives from Bible Study)
**Identity.** Control the room: take their things, pass the cup, own their next turn, and call the family out of the dark.
**Races.** cult leader ✓ — and only him; the family reads as one man's charisma. Nobody else belongs (politician/ringmaster persuade, they do not indoctrinate).
**Now.**
- T2 The Kool-Aid `raceCultKoolAid` · Charm 2 rounds single, rng 3, CD2.
- T3 Indoctrinate `raceCultIndoctrinate` · Possessed: the enemy's next activation is yours, rng 2, CD3.
- T4 The Gathering `raceCultGathering` · summon a Cult Member (walks 3, hits 55, 2 HP), max 2.
**Problems.**
- No T1 (summary: "Cult of Personality: missing T1").
- Kool-Aid (Charm) sets up nothing in his own pool: Charm's payoffs are Seduction's Enthrall (×2 activations if charmed) and Draining Embrace. Indoctrinate is Enthrall without the charm payoff — the family's own setup→payoff is missing.
**Changes.**
- MOVE `raceCultTithe` (Bible Study → `cult`), RETIER T2 → T1 (already 25MP): 50 shadow magic + steal an item, rng 2. It was always his ("everything you own belongs to the family").
- REWRITE `raceCultIndoctrinate`: add `bonusVsStatus: { status: 'charm', mult: 2 }` on the `possess` row (exactly Enthrall's field at data.js:6296 — two activations if the target is Charmed). Kool-Aid → Indoctrinate becomes a real two-turn plan.
- Cult leader rungs `[raceJudgmentBeam, raceCultKoolAid, raceCultIndoctrinate, [raceCultGathering, raceAwakening]]` → rung 1 `raceCultTithe`.
**Additions.** None. Ladder: T1 Tithe · T2 Kool-Aid · T3 Indoctrinate · T4 Gathering.
**Upgrades.** Lingering on Kool-Aid (Charm 3 rounds — with Indoctrinate's ×2 this is the family's build); Surplus on The Gathering (+1 member, the summon family's natural 1 SP); Efficient on Tithe.

### 🗣️ Persuasion `persuasion` — VERDICT: DELETE
**Identity.** (empty) — talking people into things.
**Races.** cult leader (0 spells).
**Now.** Nothing.
**Problems.** Every kit a Persuasion family could hold already exists on the races who would own it: charm/possess is Cult of Personality (cult leader) and Seduction; discord-by-words is Brainwash (Deep State, politician) and Sonic's Discordance; silence/stun-by-words is Filibuster/Executive Order (Politics); taunt is Provoke (Sonic). A fourth mind-debuff family would be filler.
**Changes.**
- FAMILY_DELETE `persuasion`; RACE_REMOVE cult leader (his charisma IS Cult of Personality, now a full 1/1/1/1). Cult leader pool after this audit: Cult 4 + Temporal 4 + Meditation 4 = 12, same size as today and every row on-theme.
**Additions.** None.
**Upgrades.** n/a.

### 🔮 Fortune Telling `fortunetelling` — VERDICT: GROW (3 → 5, absorbs Astrology)
**Identity.** Foresight as a weapon: read the stars against a target, draw a card for the team, channel the spirits to mend, and drop what the cards foretold on the tile you were always going to stand on.
**Races.** fortune teller ✓ — only her (tarot, scrying, palm reading are her focus tools). Nobody else divines this way (mothman has Prophecy of Disaster in his own family). Her pool is 7, the smallest in the game: RACE_ADD fortune teller → `astralprojection` (séance = the spirit world; gives her an escape and a shield), which lifts her to 10 spells (Fortune Telling 4 + Witchcraft 3 + Astral Projection 3) plus the Star Chart passive.
**Now.**
- T1 Tarot Draw `raceTarotDraw` · `auraRadius: 99`: EVERY ally +1 stage of a random stat (atk/int/def/mdef), CD3.
- T2 Palm Read `raceSpiritChannel` · heal 190 + cleanse 2, rng 3.
- T4 Crystal Ball `raceCrystalBall` · delayed 3×3, 160 arcane magic after 1 turn, rng 5, hexed ×1.5.
**Problems.**
- Tarot Draw at T1 buffs the whole map for 25MP; Royal Decree (1 AP) and Rally Command (2 AP) give one guaranteed stat to allies within 2 for the same MP. The randomness is a discount, not a T1 licence.
- "Palm Read" is a 190 heal — a palm reading heals nobody; the id says what the row does (spirit channel).
- No T3.
- (For the Witchcraft reviewer: her other family holds Hex of Agony T2 and Family Curse T3 as identical hexed-3 rows — her rung 3 `raceCurseOfMisfortune` is the T3 one.)
**Changes.**
- MOVE `raceStarCrossed` (Astrology → `fortunetelling`), T1 stays: 70 arcane magic + an affliction by the target's zodiac (burn / root+exposed / silence / drowsy), +50% if the sign rules the sky — `zodiacReading` is read by battle.js, so it works. Her new T1 and rung 1.
- RETIER `raceTarotDraw` T1 → T2 (50MP); keep r99, random stat, CD3.
- RENAME `raceSpiritChannel` "Palm Read" → "Séance" (heal 190 + cleanse 2 stays at T2 — now on par with Heal after its retier). "The spirits mend what the living broke."
- Fortune teller rungs → `[raceStarCrossed, [raceTarotDraw, raceSpiritChannel], raceCurseOfMisfortune, raceCrystalBall]`.
**Additions.**
- [SKEPTIC: the proposed NEW **Tower Card** `raceTowerCard` (T3 damage/delayed, one tile, 150 + Hexed 2) is STRUCK — it is Crystal Ball's own role (`damage/delayed`) in the same family with a smaller area and −10 dmg, and "smaller area" is what the Blast/Widen upgrades are for; its stated purpose, a hexed setup for Crystal Ball, is already the fortune teller's rung 3 Family Curse (`raceCurseOfMisfortune`, Witchcraft T3, hexed 3) — synergy.md already lists Crystal Ball as her self-contained finisher. The family has no T3; that is allowed, and her T3 rung lives in Witchcraft.]
- PASSIVE **Star Chart** `passiveStarChart` — T1 (1 SP), `hooks: { zodiacBonus: { own: { intStages: 1 } } }`: +1 M ATK stage while her own sign rules the sky. The zodiac system already exists (unit meta `zodiac`, the `zodiacBonus` hook); this is the row that makes a fortune teller check the sky.
- Ladder: T1 Star Crossed · T2 Tarot Draw, Séance · T4 Crystal Ball (no T3 — her rung 3 is Family Curse in Witchcraft).
**Upgrades.** Exploit on Crystal Ball (hexed ×2 — with Family Curse she is self-contained); Widen on Crystal Ball (5×5 is the family's big area — no separate spell; `delayed` is in `_UPG_AOE_KINDS`, so it fits); Long Reach on Star Crossed; Efficient on Tarot Draw.

### ♐️ Astrology `astrology` — VERDICT: MERGE INTO `fortunetelling`
**Identity.** Reading the stars — one spell.
**Races.** fortune teller.
**Now.**
- T1 Star Crossed `raceStarCrossed` · 70 arcane magic + zodiac affliction, +50% if the sign rules the sky.
**Problems.** One row on one race that already owns the divination family; the zodiac hook is a mechanic, not a family. Growing Astrology to four rows for a single race would split her 7-spell pool across three families for no team-building gain.
**Changes.**
- MOVE `raceStarCrossed` → `fortunetelling` (T1). FAMILY_DELETE `astrology`; RACE_REMOVE fortune teller. The zodiac flavour survives as the Star Chart passive in Fortune Telling.
**Additions.** None.
**Upgrades.** n/a (Star Crossed: Long Reach, Efficient. Not Lingering — it is a `damage` role and its affliction comes from `zodiacReading`, not `statusEffects`, so the `status` fit rejects it).

### 🚫 Occult Knowledge `ancientknowledge` — VERDICT: RENAME → "Ancient Knowledge" (📜) + GROW (4 → 5)
**Identity.** What the old civilisations knew: draw the pattern in crystal, raise the ziggurat, entomb, and unmake with words older than the lamp — the terrain-shaping caster family.
**Races.** annunaki ✓ (the tablets), djinn ✓ ("older than the lamp"), anubis ✓ (weighs the heart), occulus ✓ (the all-seeing eye that "draws the pattern" in Sacred Geometry's own text), professor ✓ ("four doctorates in fields the university does not list"). RACE_ADD **atlantean** ("civilisation appears to predate all known human records") — plainly ancient knowledge; his kit is water/ice/arcane with no terrain shaping. The registry glyph 🚫 is a placeholder and the name says "Occult" over an id that says "ancient"; every row is Egypt/Sumer, not the occult.
**Now.**
- T1 Sacred Geometry `raceSacredGeometry` · 3 crystal tiles in a line (DEF up, blocks ranged), 0 dmg.
- T2 Pyramid Protocol `raceZigguratProtocol` · 3 ziggurat blocks in a line, 80 dmg to enemies on them, blocks move + sight.
- T4 Ancient Magic `raceAncientMagic` · 180 magic single, rng 4, 1 AP — no rider.
- T4 Weigh the Heart `raceWeighTheHeart` · 180 magic single, rng 4, stagger ×1.5; `executeBonusPct: 0.5` is DEAD (only ui.js reads it — the "more damage the lower their HP" text is a lie).
**Problems.**
- Two T4s that are the same 180 single magic bolt at 100MP/1 AP (summary group "damage | damage | - | single | 5"); Weigh the Heart's only real difference is a stagger finisher that four of the five owners cannot set up themselves (anubis/djinn/occulus/professor all "need teammate" for it in synergy.md; only annunaki is self-contained, via Earth's Boulder Hurl / Stone Drop).
- No T3.
**Changes.**
- FAMILY_RENAME `ancientknowledge` "Occult Knowledge" → "Ancient Knowledge", glyph 🚫 → 📜.
- REWRITE `raceWeighTheHeart` (T4, 100MP, 1 AP, rng 4): 160 magic, ×1.5 when the target is under 50% HP (wire `executeBonusPct` in battle.js's damage path AND remove it from `SPELL_DEAD_FIELDS` in data.js, where it is listed today); DROP the stagger finisher. It becomes the game's honest execute (240 on a wounded target) — the heart weighed and found wanting.
- REWRITE `raceAncientMagic` (T4, 100MP, 1 AP, rng 4): 170 magic + Silence 1. "The old words unmake theirs." Distinct from Weigh; feeds Mind Shatter's silence finisher (Psychic — occulus and professor own it) and Call of the Deep (atlantean).
**Additions.**
- NEW **Sandstone Tomb** `raceSandstoneTomb` — T3 damageEffect/damage, earth/magic, 75MP 1 AP, rng 4, single: 125 magic and Rooted 2 rounds. "The sand closes over them, and the sand remembers." The family's control rung, and a self-contained setup: anubis pays it with Life Drain (root ×1.5), annunaki with Precision Shot (root ×1.5), everyone with Weigh the Heart once the rooted target has been chewed under half. [SKEPTIC: was effect-only Rooted 2 + DEF −1 at T3 — Rigormortis (Necromancy T2, 80 magic in a 3×3 + Rooted 2, 50MP) dominated it from a tier below; renumbered to Sleep Paralysis parity (Dream Predation T3: 125 + Rooted 2, 75MP), which the tier rule allows only at T3+.]
- Ladder: T1 Sacred Geometry · T2 Pyramid Protocol · T3 Sandstone Tomb · T4 Ancient Magic, Weigh the Heart.
**Upgrades.** Exploit-free (no finishers left by design; Weigh's execute is its own multiplier). Empowered on both T4s; Forked on Ancient Magic (silence two casters); Lingering on Sandstone Tomb (root 3). Long Reach on Sacred Geometry/Pyramid Protocol (build the wall from 4).

### 😴 Astral Projection `astralprojection` — VERDICT: GROW (2 → 3)
**Identity.** Leave the body: throw up a barrier from the spirit side, step through it, and carry an ally into the unseen — the escape/shield utility kit of the spirit-walkers.
**Races.** shaman ✓ ("consciousness transference"), telepath ✓ ("psychokinetic barrier projection"), watcher ✓ (observes every stream without moving — remote viewing). RACE_ADD **fortune teller** (séance, "genuine anomalous perception"; lifts the smallest pool in the game). Ghost is already a spirit — no.
**Now.**
- T1 Astral Barrier `raceAstralBarrier` · 90 shield to allies in a 3×3 around the caster, 25MP.
- T2 Spirit Walk `raceSpiritWalk` · teleport 4 + Invisible 1, CD2.
**Problems.**
- No T3/T4. Nothing internal is redundant; Astral Barrier (T1, 90, area) sits sensibly under Holy Bulwark (T2, 160) and Pupil Shield (T1, 130, one ally).
**Changes.** None to existing rows.
**Additions.**
- NEW **Spirit Guide** `raceSpiritGuide` — T3 effect/buff, psychic, 75MP 1 AP, rng 4, single ally: Invisible 1 round and Levitating 2 rounds. "Take my hand. They cannot see what is not here." The ally version of Spirit Walk (no teleport; they float out of the melee unseen) — a rescue for the telepath's tank or the shaman's frontliner that no other family offers to an ALLY.
- No T4 on purpose: the family is utility (the role×tier matrix has 0 movement rows at T4 game-wide), and every owner already carries a T4 nuke elsewhere (Bad Trip/Ego Death, Migraine/Mind Shatter, Reality Pulse, Crystal Ball). Three sharp rows beat a padded capstone.
**Upgrades.** Lingering on Spirit Guide (Invisible 2; it is an `effect` row with `statusEffects`) — not on Spirit Walk, whose `movement` role is outside Lingering's damageEffect/effect gate (Efficient is Spirit Walk's pick); Long Reach on Spirit Guide; no Widen (shield rows are not damage roles) — the Consecrated/Reinforced family upgrades above are the template if Astral Barrier ever needs one; it does not.

### 😵‍💫 Drug Use `psychadelic` — VERDICT: RENAME → "Psychedelics" + GROW (2 → 4)
**Identity.** Altered states as damage: dose them, share the high, send them on a bad trip, and dissolve the self entirely — the slow/stun psychic line.
**Races.** shaman ✓ ("plant-derived compounds… psychoactive"), hippie ✓, mushroom girl ✓ (psilocybin in a hat). **machine elves** — they are the DMT hallucination, not the user; "Drug Use" fails the yeti test for them, but "Psychedelics" (the id already says `psychadelic`) covers the entities as well as the substances, and Ego Death is their rung 4. Rename fixes the fit; keep all four.
**Now.**
- T4 Bad Trip `raceBadTrip` · 180 psychic magic single, rng 3, Slow 1, finisher slow/voodoo ×1.5, 1 AP.
- T4 Ego Death `sharedEgoDeath` · 180 psychic magic single, rng 3, Stun 1, 2 AP, CD2.
**Problems.**
- Two T4s and nothing under them: nobody can build toward the family; two 180-point single-target psychic bolts on the same four races is the same role twice.
- Bad Trip applies its own Slow and then pays it off — the finisher never needs the team; that is a 1 AP 270 at T4.
**Changes.**
- FAMILY_RENAME `psychadelic` "Drug Use" → "Psychedelics" (glyph stays).
- RETIER + REWRITE `raceBadTrip` T4 → T3 (75MP, 1 AP, rng 3): 125 + Slow 1, finisher slow/voodoo ×1.5 stays. The T3 that pays off Dosed and any teammate's Slow (26 setups game-wide). Shaman rungs → `[raceHerbalRemedy, raceSpiritWalk, [raceAyahuascaRetreat, raceBadTrip], sharedEgoDeath]`.
**Additions.**
- NEW **Dosed** `raceDosed` — T1 damageEffect/damage, psychic/magic, 25MP 1 AP, rng 3, single: 80 and Slow 2 rounds. "Something in the drink. Their feet stop agreeing with them." The T1 setup for Bad Trip, for Judgment/Star Decree/Tidal Slam teammates, and — because Slowed units act later — for Ego Death's stun to land first.
- NEW **Contact High** `raceContactHigh` — T3 effect/warCry, psychic, 75MP 1 AP, aura r2: allies within 2 gain +1 M ATK and +1 SPD stage. "Everyone in the tent is on something." The caster-team rally (Telepathic Link is INT only; this is the two-stat version) — the hippie/mushroom girl support row. [SKEPTIC: was T2/50MP — this file's own scale puts a one-stat aura r2 at T1 (Royal Decree) and a two-stat aura r2 at T3 (Oath of Valor rewrite); a two-stat aura at T2 undercuts both. Renumbered to T3. The family has no T2; allowed.]
- Ladder: T1 Dosed · T3 Bad Trip, Contact High · T4 Ego Death.
**Upgrades.** Exploit on Bad Trip (×2 vs Slow — with Dosed the family is a self-contained chain); Lingering on Dosed (Slow 3) and on Ego Death (Stun 2 — strong, 1 SP is fair at 2 AP/CD2); Efficient on Ego Death. Do not add Blast to Ego Death by default — the area stun at T4 belongs to Eternal Slumber (Dream Predation, aoe r2 = 5×5, 160 psychic + Stun 1, 2 AP CD2).

SPELL COUNT: 47 → 54 for this group (−1 Radiant Bolt; +8 Soothe, Shield Bash, Deep Breath, Mantra, Sandstone Tomb, Spirit Guide, Dosed, Contact High — Tower Card struck; plus 2 new family passives: Triage, Star Chart)
