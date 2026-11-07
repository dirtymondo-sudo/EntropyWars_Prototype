// ai.js — Entropy Wars tactical AI v4 (2026-08-15 ground-up rewrite).
// =====================================================================
// ONE brain, ONE currency. The ainew.js overlay is gone — its combat edges
// (engine-true damage estimation, press-turn valuation, focus fire, the
// 1-ply move×action search, kiting) were rebuilt into this core, and the
// old scorer's structural bugs (the null-move gate that zeroed utility
// below a random walk, the bestDamage×0.6 utility caps, `return 5`
// fallthroughs, atk×0.65 flat damage with the wrong type multiplier and
// no armor/MP/shield model) are deleted, not patched. See AI_REDESIGN.md.
//
// THE FIVE RULES:
//   1. One currency — every candidate scores in expected effective-HP
//      swing (1 pt ≈ 1 HP at the fight's magnitude). Damage dealt, HP
//      healed, damage prevented, enemy actions denied: all converted.
//      No caps, no floors, no null-move gate — a no-op scores ~0 and
//      anything real beats it naturally.
//   2. Engine-true damage oracle — estDamage() mirrors applyDamageToUnit
//      / calcDamageResolution: spellPower 0.35×stat_at_cap, the CAPPED
//      offensive product (type 1.30/0.75 × STAB 1.25 × downhill × range
//      profile × bonusVsStatus, cap ×3.0), marked +40, offenseScale
//      (level magnitude × 1.75 pace × gap), real armor × defenseScale,
//      height soak, Bulwark soak, status damage-taken mults. Kill checks
//      beat hp + shield.
//   3. Plan the turn shape — the engine turn is [≤1 setup action or
//      move] + [1 damaging action → turn ends], with ONE press refund
//      (+2 AP) for the turn's first weakness-hit/crit. The planner runs
//      a 1-ply joint move×action search and values press lines as a
//      fractional free action.
//   4. Veto only the impossible — actions doSpell/doAttack would reject
//      or that literally do nothing (full-HP heal, element-drinker
//      damage, misaligned beam, leapStrike from below, Protected
//      target). Everything else competes on value.
//   5. One brain for every job — no PURE_SUPPORT delegation, no class
//      multipliers pretending to be roles. A White Mage heals because
//      the heal is WORTH more in the currency, not because of a ×2 tag.
//
// Validity questions (spell affordability, AP cost, move tiles, entropy
// targets) still route through GAME.TargetQuery — battle.js's ONE pure
// validity/targeting oracle — so the AI can never drift from what the
// engine (doSpell/doMove) will actually accept.
(function () {
    'use strict';

    const G = () => window.GAME;

    const MAX_LOOPS = 8;
    let _failedSpells = new Set();
    let _failedCombos = new Set();
    let _skipAttack = false;
    let _skipTowerAttack = false;
    let _skipMove = false;
    let _skipJump = false;   // 🦘 doJump refused this activation: stop offering jumps
    let _failedNexus = false;
    let _failedItems = new Set();
    let _skipClimb = false;   // 🧗 doClimb refused this activation: stop offering climbs

    function _effRange(unit, spell) {
        const g = G();
        return (g && typeof g.getEffectiveSpellRange === 'function')
            ? g.getEffectiveSpellRange(unit, spell)
            : (spell.range || 0);
    }
    function _mpCost(u, sp) {
        if (typeof getSpellMpCostFor === 'function') return getSpellMpCostFor(u, sp);
        return (sp && sp.cost) || 0;
    }

    // Version stamp — the Balance Lab writes this into every export's _meta
    // so a stats file can never again be ambiguous about WHICH brain played
    // it (stats17 mixed old-AI matches into a post-rewrite export). Bump on
    // any behavior-relevant ai.js change.
    try { window.EW_AI_VERSION = 'v4.33-2026-11-01-full-list+status-combos+climb+jump+traps+keys+contact-traps+trainable+ground-price+team-play+way-out+roofs+trained'; } catch (e) {}

    // ── CPU DIFFICULTY (schema 12, kept) ─────────────────────────────────
    // Difficulty changes HOW WELL the AI executes decisions, never its
    // stats (the XCOM model: below Normal remove capabilities, never add
    // cheats).
    //  easy   — samples softmax-randomly among the top few candidates,
    //           never combos, ignores press-refund lines, and skips the
    //           1-ply move×action search (greedy act-from-here only).
    //  normal — full brain, unchanged argmax.
    //  hard   — same execution, plus an "objective persona": tower/
    //           hourglass/nexus/flag intents ×1.3.
    // AI-vs-AI harnesses (training / strength test / balance lab under
    // devAutoSim) are pinned to 'normal' so measurements stay comparable.
    const AI_DIFFICULTY_PROFILES = {
        // tactics (2026-10-23): the team plan + the race clocks. Easy plays without them (a player's own Tactic still applies).
        easy:   { pickTopN: 3, softmaxT: 60, combos: false, press: false, jointSearch: false, objectiveMult: 1.0, tactics: false },
        normal: { pickTopN: 1, softmaxT: 0,  combos: true,  press: true,  jointSearch: true,  objectiveMult: 1.0, tactics: true },
        hard:   { pickTopN: 1, softmaxT: 0,  combos: true,  press: true,  jointSearch: true,  objectiveMult: 1.3, tactics: true },
    };
    function _aiDifficultyKey() {
        try {
            const g = G();
            if (g && g.state && g.state.devAutoSim) return 'normal';
            const k = window.EW_AI_DIFFICULTY;
            if (AI_DIFFICULTY_PROFILES[k]) return k;
        } catch (e) {}
        return 'normal';
    }
    // The difficulty the ACTING unit plays at (2026-10-23, the Tactics pass): a player's own unit on auto (its
    // Tactic / auto battle — its side is not CTRL.AI) always plays Normal; the difficulty setting is the CPU's.
    function _actorDiffKey() {
        try {
            const g = G();
            const ctl = (_aiActor && g && g.state && g.state.controllers) ? g.state.controllers[_aiActor.player] : null;
            if (ctl && ctl !== 'ai') return 'normal';
        } catch (e) {}
        return _aiDifficultyKey();
    }
    function _aiDiff() { return AI_DIFFICULTY_PROFILES[_actorDiffKey()]; }
    window._ewGetAiDifficulty = _aiDifficultyKey;
    window._ewSetAiDifficulty = function (k) {
        if (!AI_DIFFICULTY_PROFILES[k]) k = 'normal';
        window.EW_AI_DIFFICULTY = k;
        try { localStorage.setItem('ew-ai-difficulty-v1', k); } catch (e) {}
    };
    try {
        const _saved = localStorage.getItem('ew-ai-difficulty-v1');
        if (AI_DIFFICULTY_PROFILES[_saved]) window.EW_AI_DIFFICULTY = _saved;
    } catch (e) {}

    // ── TUNING (v4) ──────────────────────────────────────────────────────
    // Every knob is denominated in THE currency (expected effective-HP
    // swing) or is a dimensionless probability/fraction. Legacy movement /
    // mode knobs that survived the rewrite keep their old names so the
    // A/B trainer's history still maps.
    // NOTE (schema 13): the keys listed in _TUNE_TRAINED_KEYS (below the
    // value model) are TRAINABLE — read them via tuneW(g, key), never
    // directly, so A/B experiments / trained champions / the strength-test
    // baseline all apply. The values here stay the canonical defaults.
    const AI_TUNE = {
        // ── value model ──
        killBase: 155.2,          // SPSA 2026-11-01 (was 138.3) // SPSA 2026-10-29 (was 114) // imitation 2026-10-08 (was 116.563) // flat premium for removing a unit (on top of its denied output) — gen-305 champion (was 70)
        killOutputTurns: 0.4864,       // SPSA 2026-11-01 (was 0.3464) // SPSA 2026-10-29 (was 0.645) // turns of the victim's output a kill denies (they'd respawn/act ~1.6 more times near-term) — gen-40 champion 2026-10-07 (was 1.6)
        supportKillPremium: 109.5,// SPSA 2026-11-01 (was 115.1) // SPSA 2026-10-29 (was 124) // imitation 2026-10-08 (was 128.125) // extra for killing a healer/reviver kit — gen-305 (was 130)
        mpValuePerPoint: 0.4968,     // SPSA 2026-11-01 (was 0.5838) // SPSA 2026-10-29 (was 0.49) // imitation 2026-10-08 (was 0.529) // HP-equivalent value of 1 MP (opportunity cost of casting; 0.9 caused MP hoarding — 59% of sim units ended matches >90% MP) — gen-305 (was 0.5)
        pressActionValue: 185.0,  // SPSA 2026-11-01 (was 182.1) // SPSA 2026-10-29 (was 202) // imitation 2026-10-08 (was 181.563) // floor value of the free action a press refund grants — gen-305 (was 150)
        overkillWaste: 1.0,         // damage past the target's effective HP is worth 0 (cap factor)
        focusCommitBonus: 120.7,    // SPSA 2026-11-01 (was 127.5) // SPSA 2026-10-29 (was 127) // imitation 2026-10-08 (was 117.5) // bonus for hitting the team's shared focus target — gen-305 (was 90)
        woundedPileOn: 0.2669,        // SPSA 2026-11-01 (was 0.335) // SPSA 2026-10-29 (was 0.37) // imitation 2026-10-08 (was 0.35) // × missing HP added to target priority (finish jobs)
        healSafetyDiscount: 0.4749,   // SPSA 2026-11-01 (was 0.4285) // SPSA 2026-10-29 (was 0.45) // heal value multiplier when the target is out of enemy reach
        healNoEnemyDiscount: 0.35,  // heal value multiplier when no enemy is even visible
        reviveBase: 382.8,            // SPSA 2026-11-01 (was 335.1) // SPSA 2026-10-29 (was 320) // reviving a unit ≈ a kill in reverse
        ccOutputFactor: 0.5738,        // SPSA 2026-11-01 (was 0.3986) // SPSA 2026-10-29 (was 0.37) // imitation 2026-10-08 (was 0.31) // fraction of a denied unit's per-turn output a hard CC is worth per denied turn — gen-40 champion 2026-10-07 (was 0.8)
        statusSetupFactor: 0.2169,     // SPSA 2026-11-01 (was 0.273) // SPSA 2026-10-29 (was 0.115) // fraction of a teammate's bonusVsStatus payoff credited to the setup cast — gen-40 champion 2026-10-07 (was 0.5)
        statusSetupSure: 0.6,       // WEAK RACES II 2026-10-23: same, when the payoff is all but certain (mate still to act this round / own zone that lasts) — not trained
        buffStageFactor: 0.08888,      // SPSA 2026-11-01 (was 0.1133) // SPSA 2026-10-29 (was 0.14) // one offensive stat stage (±20 on the 0-100 ruler since 2026-08-29) ≈ +14% of recipient output per remaining turn
        buffTurnsHorizon: 2.2,      // expected turns a buff stays relevant
        delayedEscapeStatic: 0.35,  // P(target still in blast) for ground-tile delayed casts
        delayedEscapeTracking: 0.75,// P for unit-tracking delayed marks
        threatCostFactor: 0.02091,    // SPSA 2026-11-01 (was 0.0351) // SPSA 2026-10-29 (was 0) // imitation 2026-10-08 (was 0.02) // fraction of expected incoming damage charged to a tile (0.35 made both AIs too timid to ever close — mutual standoff) — gen-305 pinned this at the range floor (0.08): self-play rewards the side that closes — gen-40 champion 2026-10-07 (was 0.082)
        deathRiskFactor: 0.1276,       // SPSA 2026-11-01 (was 0.2179) // SPSA 2026-10-29 (was 0.34) // imitation 2026-10-08 (was 0.375) // × own kill-value charged when a tile's threat covers our whole HP bar — gen-40 champion 2026-10-07 (was 0.9)
        jointSearchDiscount: 0.9101, // SPSA 2026-11-01 (was 0.951) // SPSA 2026-10-29 (was 0.985) // long cloud run 2026-10-29 (was 0.97) // imitation 2026-10-08 (was 1) // move-then-act value discount vs acting right now — gen-40 champion 2026-10-07 (was 0.92)
        // ── kept legacy knobs (movement / modes / items) ──
        markedTargetBonus: 12,
        hourglassTargetBonus: 45,
        hgCarrierFleeAdv: -0.23,
        safeAllyProximity: 4,
        towerLowHpPush: 33.6,          // SPSA 2026-11-01 (was 23.99) // SPSA 2026-10-29 (was 35) // long cloud run 2026-10-29 (was 50) // gen-40 champion 2026-10-07 (was 120)
        towerMidHpPush: 90,
        towerClearBonus: 110,
        levelAggressionMod: 0.006,   // progression modes only (PvP is level-normalized)
        nearLevelUpBonus: 6,         // progression modes only
        recallBonus: 40,
        mpPotionBase: 90,
        earlyExploreBonus: 45,
        reshapeRangedRaise: 55,
        reshapePerEnemy: 20,
        reshapeDefensive: 14,
        moveHighGroundRanged: 3,
        moveHighGroundMelee: 7.918,  // SPSA 2026-11-01 (was 7.944) // SPSA 2026-10-29 (was 7)
        moveRetreatHeight: 8,
        landToChannelBonus: 70,
        flyEscapeMeleeBonus: 30,
        flyRangedHeightBonus: 50,
    };

    // ── spell-kind taxonomies ────────────────────────────────────────────
    const DMG_KINDS = new Set(['damage', 'ricochet', 'multiHit', 'aoe', 'barrage',
        'lifeDrain', 'line', 'linePush', 'cross', 'aoePull', 'splitBeam',
        'displacement', 'pull', 'dash', 'skyDrop', 'skyThrow', 'skySlam', 'leapStrike', 'tackle']);
    // Kinds that participate in Press Turn (battle.js _PRESS_SPELL_KINDS).
    const PRESS_KINDS = new Set(['damage', 'multiHit', 'ricochet', 'lifeDrain', 'tackle',
        'line', 'linePush', 'splitBeam', 'aoe', 'barrage', 'cross', 'aoePull']);
    const SPLASH_KINDS = new Set(['aoe', 'cross', 'barrage']);
    const HEAL_KINDS = new Set(['heal', 'healAll', 'selfHeal', 'revive', 'zoneHeal', 'seedHeal']);
    // Hard CC = the target loses control of (part of) its turn.
    const HARD_CC = new Set(['stun', 'sleep', 'freeze', 'frozen', 'charm', 'stagger',
        // CHAMP REWORK Phase 4 (plan §5.1): the victim loses (part of) its activation.
        'feared', 'possessed', 'infected']);

    // ── per-turn action memory (anti-loop, target spreading) ─────────────
    let _turnActionLog = [];
    // CHAMP_REWORK Phase 5 wave B: the unit the AI is thinking for (the
    // Shadow Realm gate is relative to it) and, per two-click spell id, the
    // partner findSpellTarget chose alongside the returned first pick.
    let _aiActor = null;
    const _aiPairPick = {};
    function logAction(action) {
        _turnActionLog.push({
            type: action.type,
            spellId: action.spell?.id || null,
            spellKind: action.spell?.kind || null,
            targetId: action.target?.id || null,
            x: action.x ?? action.towerX ?? null,
            y: action.y ?? action.towerY ?? null,
            item: action.item || null,
        });
    }
    function countPriorUses(type, spellId) {
        let n = 0;
        for (const a of _turnActionLog) {
            if (a.type === type && (spellId == null || a.spellId === spellId)) n++;
        }
        return n;
    }
    function countPriorTargeting(targetId) {
        let n = 0;
        for (const a of _turnActionLog) if (a.targetId === targetId) n++;
        return n;
    }
    function hasUsedSpellKind(kind) {
        return _turnActionLog.some(a => a.spellKind === kind);
    }

    // Team damage this round (focus-fire memory shared across activations).
    let _teamDamageLog = {};
    let _teamDamageRound = -1;
    function getTeamDamageLog() {
        const g = G();
        if (!g) return {};
        const round = g.state.round || 0;
        if (round !== _teamDamageRound) {
            _teamDamageLog = {};
            _teamDamageRound = round;
        }
        return _teamDamageLog;
    }
    function recordTeamDamage(enemyId, dmg) {
        const log = getTeamDamageLog();
        log[enemyId] = (log[enemyId] || 0) + dmg;
    }

    // ── level helpers (engine parity) ────────────────────────────────────
    function _aiLevel(u) {
        return (typeof ewUnitLevel === 'function') ? ewUnitLevel(u) : ((u && u._lvlCache) || 1);
    }
    function _pwrAtk(u) {
        return (typeof levelPowerStat === 'function') ? levelPowerStat(u, 'atk') : ((u && u.atk) || 0);
    }
    function _pwrInt(u) {
        return (typeof levelPowerStat === 'function') ? levelPowerStat(u, 'int') : ((u && u.intStat) || 0);
    }
    // The basic-attack swing knobs (battle.js THE BASIC ATTACK FLOOR).
    function _basicCoef() { return (typeof window !== 'undefined' && window.BASIC_ATTACK_COEF) || 0.75; }
    function _basicMinRaw() { return (typeof window !== 'undefined' && window.BASIC_ATTACK_MIN_RAW) || 30; }
    function _offScale(attacker, target) {
        if (typeof offenseScale !== 'function') return 1;
        return offenseScale(_aiLevel(attacker), _aiLevel(target)) || 1;
    }
    function _defScale(target) {
        if (typeof defenseScale === 'function') return defenseScale(_aiLevel(target)) || 1;
        return 1;
    }

    // ── geometry helpers ─────────────────────────────────────────────────
    function _dist(g, ax, ay, az, b) {
        try { if (g.combatDist) return g.combatDist(ax, ay, az ?? 0, b.x, b.y, b.z ?? 0); } catch (e) {}
        return Math.abs(ax - b.x) + Math.abs(ay - b.y);
    }
    function _reach(g, ax, ay, az, b, longRange) {
        try { if (g.combatReach) return g.combatReach(ax, ay, az ?? 0, b.x, b.y, b.z ?? 0, !!longRange); } catch (e) {}
        return _dist(g, ax, ay, az, b);
    }
    // The AI's aimed beam spine, shared by planning, scoring and re-aiming.
    // Use ray steps (including diagonals), not Manhattan/projectile reach.
    function _lineRayTilesAI(g, from, spell, dx, dy) {
        const tiles = [];
        for (let i = 1; i <= (spell.range || 4); i++) {
            const x = from.x + dx * i, y = from.y + dy * i;
            if (x < 0 || y < 0 || x >= g.bw() || y >= g.bh()) break;
            if (typeof g.isTerrainPassable === 'function' && !g.isTerrainPassable(x, y) && !spell.destroysObstacles) break;
            if (!spell.ignoresLineOfSight && typeof g.isRangeBlockedByTerrain === 'function'
                && g.isRangeBlockedByTerrain(from.x, from.y, x, y, from.z ?? null)) break;
            tiles.push({ x, y });
        }
        return tiles;
    }
    // Use the engine read-only forecast when available. Legacy harness fallback:
    // Match battle.js lane offsets and non-boring footprint: the spine
    // determines reach; side cells need passability, not their own LOS ray.
    function _lineFootprintAI(g, from, spell, dx, dy) {
        if (typeof g.getLineForecast === 'function') return g.getLineForecast(from, spell, dx, dy).tiles;
        const spine = _lineRayTilesAI(g, from, spell, dx, dy);
        const tiles = spine.slice();
        const seen = new Set(tiles.map(t => `${t.x},${t.y}`));
        const width = Math.max(1, Math.min(3, spell.lineWidth || 1));
        const lanes = width <= 1 ? [] : width === 2 ? [[-dy, dx]] : [[-dy, dx], [dy, -dx]];
        for (const [ox, oy] of lanes) for (const c of spine) {
            const x = c.x + ox, y = c.y + oy, key = `${x},${y}`;
            if (x < 0 || y < 0 || x >= g.bw() || y >= g.bh() || seen.has(key)) continue;
            if (typeof g.isTerrainPassable === 'function' && !g.isTerrainPassable(x, y)) continue;
            seen.add(key); tiles.push({ x, y });
        }
        return tiles;
    }

    // THE 3D LINE (battle.js, 2026-09-25): a beam flies straight from the
    // caster to the AIMED body, so who it hits depends on the aim. The engine
    // answers per victim (g.lineBeamHits); a harness without it keeps the
    // flat lane (every enemy on the footprint).
    function _lineBeamHitsAI(g, from, spell, dx, dy, aim, e) {
        if (typeof g.lineBeamHits !== 'function' || !aim) return true;
        try { return g.lineBeamHits(from, spell, dx, dy, aim, e); } catch (err) { return true; }
    }
    function _bestLineAimAI(unit, spell, v, preferredTargetId) {
        const g = G();
        let best = null;
        for (const [dx, dy] of [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]]) {
            const tiles = _lineFootprintAI(g, unit, spell, dx, dy);
            const victims = v.visibleEnemies.filter(e => !e.dead && !isProtected(g, e)
                && tiles.some(t => t.x === e.x && t.y === e.y));
            if (!victims.length) continue;
            // Retain a victim identity for Simul's existing re-aim contract,
            // but never use an off-spine victim's coordinates as the direction.
            // Each spine victim is a candidate AIM (the line to a flyer skips
            // the ground unit behind it, and the other way round); the best
            // scoring aim wins the heading, the first on a tie.
            let pick = null;
            for (const cand of victims) {
                const ax = cand.x - unit.x, ay = cand.y - unit.y;
                const onSpine = Math.sign(ax) === dx && Math.sign(ay) === dy
                    && (ax === 0 || ay === 0 || Math.abs(ax) === Math.abs(ay));
                if (pick && !onSpine) continue;
                const target = onSpine ? cand : { x: unit.x + dx, y: unit.y + dy, id: cand.id };
                const score = scoreSpell(unit, spell, target, v);
                if (!pick || score > pick.score) pick = { target, score };
                if (typeof g.lineBeamHits !== 'function') break;   // flat lane: every aim scores alike
            }
            const { target, score } = pick;
            const hitList = victims.filter(e => _lineBeamHitsAI(g, unit, spell, dx, dy, target, e));
            const preferred = hitList.some(e => e.id === preferredTargetId);
            if (score > 0 && (!best || score > best.score
                || (score === best.score && preferred && !best.preferred))) {
                best = { target, score, preferred, hits: hitList.length };
            }
        }
        return best;
    }
    function standH(g, u) { try { return g.getUnitStandingHeight(u); } catch (e) { return u.z ?? 0; } }
    function tileH(g, t) {
        if (t.z != null) return t.z;
        try { return g.getHeightAt ? g.getHeightAt(t.x, t.y) : 0; } catch (e) { return 0; }
    }
    // Long-range delivery heuristic (mirror of battle.js isLongRangeSpell's
    // dominant cases — the full text classifier stays engine-side; the AI
    // only needs it for the gravity-assist reach check, where projectile /
    // beam / blast kinds cover practically every real spell).
    const _LONG_RANGE_KINDS_AI = new Set(['damage', 'ricochet', 'multiHit', 'aoe',
        'barrage', 'line', 'linePush', 'splitBeam', 'delayed', 'bomb', 'debuff', 'zoneDebuff']);
    function _isLongRange(sp) {
        if (!sp) return false;
        if (sp.delivery === 'ranged' || sp.longRange === true) return true;
        if (sp.delivery === 'melee' || sp.longRange === false) return false;
        if (sp.aoeOriginSelf) return false;
        return _LONG_RANGE_KINDS_AI.has(sp.kind) && (sp.range || 0) >= 2;
    }

    // ── fog / concealment discipline ─────────────────────────────────────
    // A unit the AI must NOT target: invisible/cloaked, hidden by smoke
    // (unless adjacency reveals), OR — with fog on — out of the whole
    // team's sight (isUnitSeenByTeam: the nameplate-eye truth). Every
    // targeting path gates on this; the AI never sees through walls.
    function isConcealed(g, tg, viewerPlayer) {
        try {
            /* 🌑 THE SHADOW REALM (2026-10-26): across its line there is nobody to see, chase or aim at */
            if (tg && _aiActor && typeof window.isUnitRealmShieldedFrom === 'function'
                && window.isUnitRealmShieldedFrom(tg, _aiActor)) return true;
            if (g.unitHasStatus && g.unitHasStatus(tg, 'invisible')
                && !g.unitHasStatus(tg, 'marked')) {
                if (typeof g.isUnitConcealedFrom !== 'function') return true;
                if (g.isUnitConcealedFrom(tg, viewerPlayer)) return true;
            } else if (typeof g.isUnitConcealedFrom === 'function'
                && g.isUnitConcealedFrom(tg, viewerPlayer)) return true;
            /* 👁 VISION (2026-10-09): the CPU plays by the same sight as a person — fog or no fog, it can only aim at
               what its team sees (each unit's VISION tiles + a clear line), and a Blind / Jammed actor only at what
               it sees itself (isInVision answers both). */
            if (_aiVisionOn() && _aiActor && _aiActor.player === viewerPlayer && typeof g.isInVision === 'function') {
                if (!g.isInVision(_aiActor, tg.x, tg.y, tg.z ?? null)) return true;
            } else if ((_aiVisionOn() || g.state.fogOfWar) && typeof g.isUnitSeenByTeam === 'function'
                && !g.isUnitSeenByTeam(tg, viewerPlayer)) return true;
        } catch (e) {}
        return false;
    }
    /* 👁 Last-seen memory (2026-10-09): per team, enemy id → the tile and round it was last in sight. AI-local (never on
       state: the host runs the AI, nothing for the guest to mirror). A tile the team now sees empty is forgotten. */
    const _aiLastSeen = { 1: new Map(), 2: new Map(), _round: -1, _units: null };
    function _aiLastSeenFor(g, player) {
        const r = g.state.round || 0;
        if (r < _aiLastSeen._round || _aiLastSeen._units !== g.state.units) { _aiLastSeen[1].clear(); _aiLastSeen[2].clear(); }   // a new match
        _aiLastSeen._round = r;
        _aiLastSeen._units = g.state.units;
        if (!_aiLastSeen[player]) _aiLastSeen[player] = new Map();
        return _aiLastSeen[player];
    }
    function _aiNoteSightings(g, player, seen, visTiles) {
        try {
            const ls = _aiLastSeenFor(g, player);
            const rnd = g.state.round || 0;
            for (const e of seen) ls.set(e.id, { x: e.x, y: e.y, round: rnd });
            for (const [id, rec] of ls) {
                const e = g.state.units.find(u => u.id === id);
                if (!e || e.dead) { ls.delete(id); continue; }
                if (seen.some(s => s.id === id)) continue;
                if (visTiles && visTiles.has(g.posKey(rec.x, rec.y))) ls.delete(id);   // we look there and it is gone
            }
        } catch (e) {}
    }
    function _aiVisionOn() {
        return typeof VISION_RULES === 'undefined' || VISION_RULES.enabled !== false;
    }
    // Protected (invulnerable) targets block ALL damage and count as a
    // press MISS — never shoot into Protect.
    function isProtected(g, tg) {
        try {
            if (g.unitHasStatus && g.unitHasStatus(tg, 'protect')) return true;
            // 🌑 Shadow Realm (wave B): a unit in the realm can only be reached
            // by its partner — to everyone else it is untargetable, and (2026-10-26)
            // a unit in the realm reaches nobody but its partner.
            if (tg && _aiActor && typeof window.isUnitRealmShieldedFrom === 'function'
                && window.isUnitRealmShieldedFrom(tg, _aiActor)) return true;
        } catch (e) {}
        return false;
    }

    // ═════════════════════════════════════════════════════════════════════
    // ENGINE-TRUE DAMAGE ORACLE
    // Mirrors doAttack/doSpell → applyDamageToUnit → calcDamageResolution.
    // Returns SCALED damage (the number the HP bar actually loses), so every
    // comparison against hp/shield is direct. Deterministic midpoint (the
    // ±8 variance averages to 0).
    // ═════════════════════════════════════════════════════════════════════

    function effHp(tg) { return (tg.hp || 0) + (tg.shield || 0); }

    function _spellPowerOf(g, u, sp) {
        let p = u.spellPower || 0;
        try { if (typeof g.getSpellStatBonus === 'function') p += (g.getSpellStatBonus(u, sp) || 0); } catch (e) {}
        try { if (typeof g.getHourglassPower === 'function') p += (g.getHourglassPower(u) || 0); } catch (e) {}
        // Arcane Surge's rider — the passive rows' `spellPower` hook (sum), mirroring battle.js getPassiveSpellPowerBonus.
        // THE JOBS REMOVAL (the user 2026-09-27): was a flat +8 for the Black Mage job.
        if (typeof unitPassiveSum === 'function') p += (unitPassiveSum(u, 'spellPower') || 0);
        return p;
    }
    function _baseSpellDmg(sp) {
        if (!sp) return 0;
        if (sp.hitDamages) return sp.hitDamages.reduce((a, b) => a + b, 0);
        return sp.dmg || 0;
    }
    // Range-falloff multiplier (battle.js calcRangeMult constants mirrored:
    // full damage at dist 1, −10%/tile beyond, floored 0.8. No Sniper
    // inversion anymore — everyone rides the same curve).
    function _rangeMult(u, dist) {
        if (!(dist > 0)) return 1;
        return Math.max(0.8, Math.min(1.0, 1 - 0.10 * (dist - 1)));
    }
    function _armorOf(tg, damageType) {
        if (typeof getEffectiveArmor === 'function') {
            try { return getEffectiveArmor(tg, damageType) || 0; } catch (e) {}
        }
        // fallback: the armor fold at cap — 0.25 ÷ the 2026-08-29 rescale
        // factor for the matching defense stat (×1.2 DEF / ×1.6 MDEF).
        const stat = damageType === 'magic' ? (tg.mdef || 0) : (tg.def || 0);
        return Math.floor(stat * 0.25 / (damageType === 'magic' ? 1.6 : 1.2));
    }
    function _bonusVsMatches(tg, bvs) {
        if (!bvs || !bvs.status) return false;
        if (typeof bonusStatusMatches === 'function') {
            try { return bonusStatusMatches(tg, bvs.status); } catch (e) {}
        }
        const g = G();
        const ids = [].concat(bvs.status);
        return ids.some(id => { try { return g.unitHasStatus(tg, id); } catch (e) { return false; } });
    }

    // estDamage(unit, tg, spell|null, opts) → expected scaled damage.
    //   opts.fromX/fromY/fromH — evaluate AS IF attacking from that tile
    //   opts.noKillCheck — plain number, no clamping
    /* THE FORECAST ORACLE (2026-10-29, the training rework: "is it given all of the info on screen?"). The player
       picks off the forecast (battle.js forecastBasicAttack / forecastSpellPlan, the numbers on the CONFIRM row); the
       CPU priced its hits with its own copy of the damage math (_estDamageRaw), and the copy has drifted: over 5,800
       single-target reads in lab matches it was more than 15% off the on-screen number one time in five, and on some
       spells always (Giant Smash ×1.52, Dead Man's Hand ×1.47, Rampage ×1.27; High Noon ×0.52, Predator Drop ×0.64,
       Grotesque Dive ×0.78). Each (attacker, spell, target) is now read ONCE per activation through the forecast, and
       the copy's number is scaled by forecast ÷ copy — every use (from another tile, the threat field, the kill
       checks) then prices what the screen would show. forecastTrust_v1 blends it (0 = the copy alone, as before). */
    let _fcCache = new Map();
    const _FC_SKIP = new Set(['aoe', 'cross', 'barrage', 'aoePull']);   // a blast read at one body's tile is not that cast's aim
    function _fcRatio(g, unit, tg, sp, raw) {
        const key = unit.id + '|' + (sp ? sp.id : '@') + '|' + tg.id;
        if (_fcCache.has(key)) return _fcCache.get(key);
        let r = 1;
        try {
            let fc = null;
            if (!sp) {
                const f = (typeof window.forecastBasicAttack === 'function') ? window.forecastBasicAttack(unit, tg) : null;
                if (f && f.dmg > 0) fc = f.dmg;
            } else if (DMG_KINDS.has(sp.kind) && !_FC_SKIP.has(sp.kind) && typeof window.forecastSpellPlan === 'function') {
                const plan = window.forecastSpellPlan(unit, sp, tg.x, tg.y, tg.z);
                const h = plan && plan.handled && plan.hits ? plan.hits.find(x => x.unit && x.unit.id === tg.id) : null;
                if (h && h.dmg > 0) fc = h.dmg;
            }
            if (fc != null && raw > 0) {
                const hp = tg.hp || 0;
                if (fc < hp) r = fc / raw;                 // the forecast's full number
                else if (raw < hp) r = hp / raw;           // the forecast says lethal, the copy did not: just lethal
                r = Math.max(0.25, Math.min(4, r));
            }
        } catch (e) { r = 1; }
        _fcCache.set(key, r);
        return r;
    }
    function estDamage(g, unit, tg, sp, opts) {
        const raw = _estDamageRaw(g, unit, tg, sp, opts);
        if (!(raw > 0) || !unit || !tg || unit.id == null || tg.id == null || (opts && opts.interceptionForecast)) return raw;
        const w = wght(g, 'forecastTrust_v1', 1);
        if (!(w > 0)) return raw;
        const r = _fcRatio(g, unit, tg, sp, raw);
        return r === 1 ? raw : raw * (1 + w * (r - 1));
    }
    function _estDamageRaw(g, unit, tg, sp, opts) {
        opts = opts || {};
        if (!tg || tg.dead) return 0;
        const basicMagic = !sp && opts.interceptionForecast && typeof unitPassiveValue === 'function'
            && unitPassiveValue(unit, 'basicAttackMagic') === true;
        if (opts.interceptionForecast) {
            // This is an enemy hit on an ally: the deciding CPU is NOT its
            // source. Interception happens before the recipient's immunities.
            const defs = g.STATUS_DEFS || (typeof STATUS_DEFS !== 'undefined' ? STATUS_DEFS : {});
            if (Object.keys(tg.status || {}).some(k => tg.status[k] > 0 && defs[k]?.invulnerable)
                || g.unitHasStatus(tg, 'protect')) return 0;
            if (typeof window.isUnitRealmShieldedFrom === 'function'
                && window.isUnitRealmShieldedFrom(tg, unit)) return 0;
            if (typeof unitPassiveValue === 'function'
                && unitPassiveValue(tg, 'immuneDamageType') === (basicMagic || sp?.damageType === 'magic' ? 'magic' : 'physical')) return 0;
        } else if (isProtected(g, tg)) return 0;

        // 🜂 Elemental affinity (2026-09-01) + THE ELEMENT SHARE (mondo 2026-10-17): a spell with a combat element
        // splits — the main part rides the type matchup, the element part (spellElemShare) the target's affinity
        // (weak ×1.25 / resist ×0.75 from ELEMENT_AFFINITY_MULT / immune 0 / absorb heals). Thermal Regen (healedByElement) drinks like absorb.
        // Mirrors battle.js _hitDamageMath, so the AI hunts weaknesses and still uses a resisted element's main part.
        let _elAff = null, _elShare = 0, _elSurge = false, _elTerrain = 1;
        if (sp && !opts.noElement) {
            try {
                const _el = (typeof getSpellElement === 'function') ? getSpellElement(sp) : null;
                // 🜃 THE ELEMENT TERRAINS (2026-10-21): caster (at the tile it would cast from) or target on the element's
                // own ground → ×1.25 (battle.js elementTerrainBonus, shared with the live hit + the forecast).
                if (_el && sp.kind !== 'basicAttack' && typeof window.elementTerrainBonus === 'function') {
                    const _etb = window.elementTerrainBonus(_el, unit, tg, {
                        srcX: opts.fromX != null ? opts.fromX : unit.x, srcY: opts.fromY != null ? opts.fromY : unit.y });
                    if (_etb) _elTerrain = _etb.mult;
                }
                // THE ZODIAC SPELL SURGE (2026-10-18): the reigning sign's element lands ×1.25 (battle.js _hitDamageMath)
                _elSurge = !!(_el && typeof window.getZodiacResonanceElement === 'function' && window.getZodiacResonanceElement() === _el);
                if (_el && typeof COMBAT_ELEMENTS !== 'undefined' && COMBAT_ELEMENTS.includes(_el)) {
                    _elShare = (typeof spellElemShare === 'function') ? spellElemShare(sp) : 0.5;
                    _elAff = (typeof unitElementAffinity === 'function') ? unitElementAffinity(tg, _el) : null;
                    const _drink = (typeof unitPassiveValue === 'function') ? unitPassiveValue(tg, 'healedByElement') : null;
                    if (_drink && typeof classifySpellElement === 'function' && classifySpellElement(sp) === _drink) _elAff = 'absorb';
                }
            } catch (e) {}
            // an all-element spell (share 1) the target nullifies or drinks is worth zero, as before
            if (_elShare >= 1 && (_elAff === 'immune' || _elAff === 'absorb')) return 0;
        }
        const _elSplit = _elShare > 0 && _elShare < 1;
        let _elStab = 1;

        const fromX = opts.fromX != null ? opts.fromX : unit.x;
        const fromY = opts.fromY != null ? opts.fromY : unit.y;
        const myH = opts.fromH != null ? opts.fromH : standH(g, unit);
        const tgH = standH(g, tg);
        const dist = Math.abs(fromX - tg.x) + Math.abs(fromY - tg.y);

        let raw, damageType, ignoreArmor = false;
        if (sp) {
            raw = opts.rawBase != null ? opts.rawBase : _baseSpellDmg(sp);
            if (raw <= 0) return 0;
            if (opts.rawBase == null) raw += _spellPowerOf(g, unit, sp);
            damageType = sp.damageType === 'magic' ? 'magic' : 'physical';
            ignoreArmor = !!sp.ignoreArmor;
        } else {
            // doAttack: max(BASIC_ATTACK_MIN_RAW, floor(pwrAtk×BASIC_ATTACK_COEF) ± 8) + attackBonus + hourglass
            raw = Math.max(_basicMinRaw(), Math.floor((basicMagic ? _pwrInt(unit) : _pwrAtk(unit)) * _basicCoef()));
            try { raw += g.getEffectiveAttackBonus(unit, basicMagic ? 'magic' : 'physical') || 0; } catch (e) {}
            try { raw += g.getHourglassPower(unit) || 0; } catch (e) {}
            damageType = basicMagic ? 'magic' : 'physical';
        }
        // applyDamageToUnit adds the axis attack bonus for enemy hits.
        if (sp) {
            try { raw += g.getEffectiveAttackBonus(unit, damageType === 'magic' ? 'magic' : 'physical') || 0; } catch (e) {}
        }

        // ── the capped offensive product ──
        let offMult = 1;
        let _tm = 1;
        try { _tm = (typeof getTypeDamageMultiplier === 'function')
            ? (getTypeDamageMultiplier(unit, tg, sp ? (sp.spellType || null) : null) || 1) : 1; } catch (e) {}
        if (_elSplit) {
            // STAB rides the whole hit; the matchup splits (data.js elemSplitFactor)
            _elStab = (sp.spellType && (unit.types || []).includes(sp.spellType)) ? ((typeof STAB_MULTIPLIER !== 'undefined') ? STAB_MULTIPLIER : 1.25) : 1;
            offMult *= _elStab * ((typeof elemSplitFactor === 'function') ? elemSplitFactor(_tm / _elStab, _elAff, _elShare) : _tm / _elStab);
        } else {
            offMult *= _tm;
            // an all-element hit: weak / resist (ELEMENT_AFFINITY_MULT) on the whole of it
            if (_elShare >= 1 && _elAff === 'weak') offMult *= ELEMENT_AFFINITY_MULT.weak;
            else if (_elShare >= 1 && _elAff === 'resist') offMult *= ELEMENT_AFFINITY_MULT.resist;
        }
        if (!ignoreArmor && myH > tgH) offMult *= 1 + 0.1 * (myH - tgH);      // downhill
        if (!opts.noRangeMult) offMult *= _rangeMult(unit, dist);               // range profile
        if (sp && sp.bonusVsStatus && _bonusVsMatches(tg, sp.bonusVsStatus)) {
            offMult *= (sp.bonusVsStatus.mult || 1.5);                        // status combo
        }
        // 🔊🧊 R11 (2026-11-07): a sonic hit breaks a Frozen target's ice ×1.5 (battle.js _hitDamageMath), unless the spell's own ×vs Frozen already paid
        try {
            if (sp && g.unitHasStatus(tg, 'frozen') && (typeof getSpellElement === 'function') && getSpellElement(sp) === 'sonic'
                && !(sp.bonusVsStatus && [].concat(sp.bonusVsStatus.status).includes('frozen'))) offMult *= 1.5;
        } catch (e) {}
        if (_elSurge) offMult *= (typeof ZODIAC_SURGE_MULT === 'number') ? ZODIAC_SURGE_MULT : 1.25;   // zodiac spell surge
        if (_elTerrain !== 1) offMult *= _elTerrain;   // 🜃 the element's own ground
        // THE SPELL AUDIT Batch D — the family passives' strike multipliers (battle.js passiveStrikeMult: high ground,
        // flank, finisher, ambush out of Invisible), so the CPU walks its Pack Tactics bruiser next to an ally.
        if (typeof passiveStrikeMult === 'function') {
            try {
                offMult *= passiveStrikeMult(unit, tg, damageType, {
                    srcH: myH, tgtH: tgH, fromInvisible: !!(g.unitHasStatus && g.unitHasStatus(unit, 'invisible'))
                }).mult || 1;
            } catch (e) {}
        }
        offMult = Math.min(offMult, 3.0);                                     // MAX_OFFENSIVE_MULT
        let est = raw * offMult;

        // Facing arc on basic attacks (applied engine-side in doAttack,
        // outside the capped product): ×1.25 back, ×1.10 flank.
        let arc = 'front';
        if (!sp) {
            try {
                arc = g.getAttackArc({ x: fromX, y: fromY }, opts.basicArcTarget || tg) || 'front';
                est *= g.getFacingDamageMult(arc) || 1;
            } catch (e) {}
        }

        // Marked: +40 flat on physical hits (consumed — count once).
        try {
            if (opts.allowMarkBonus !== false && (damageType === 'physical' || basicMagic) && g.unitHasStatus(tg, 'marked')) {
                est += (tg.markBonus || 40);
            }
        } catch (e) {}

        // Level magnitude / pace / gap.
        est *= _offScale(unit, tg);

        // Mitigation (defense-scaled armor; flat height soak; Bulwark's damageSoak hook).
        if (!ignoreArmor) {
            const ds = _defScale(tg);
            est -= Math.round(_armorOf(tg, damageType) * ds);
            if (tgH > myH) est -= 5 * (tgH - myH);
            // Bulwark (passive row, `damageSoak` hook, sum — was the Tank job; THE JOBS REMOVAL 2026-09-27)
            const _soak = (typeof unitPassiveSum === 'function') ? (unitPassiveSum(tg, 'damageSoak') || 0) : 0;
            if (_soak) est -= Math.round(_soak * ds);
        }
        if (est < 1) est = 1;
        // THE ABSORBED PART: the element part a drinker heals counts against the hit (battle.js absorbHeal)
        if (_elSplit && _elAff === 'absorb') {
            try { est = Math.max(1, est - raw * _elShare * _elStab * (_offScale(unit, tg) || 1)); } catch (e) {}
        }

        // Status damage-taken multipliers (guard, vulnerability marks…).
        try {
            if (typeof getStatusDamageTakenMultiplier === 'function') {
                const m = getStatusDamageTakenMultiplier(tg);
                if (m && m !== 1) est *= m;
            }
        } catch (e) {}

        if (opts.interceptionForecast) {
            if (damageType === 'magic' && typeof getStatusMagicDamageTakenMultiplier === 'function') {
                est *= getStatusMagicDamageTakenMultiplier(tg);
            } else if (damageType === 'physical' && typeof getStatusRangedDamageTakenMultiplier === 'function') {
                est *= getStatusRangedDamageTakenMultiplier(tg) ?? 1;
            }
        }

        // THE BASIC ATTACK FLOOR (battle.js calcDamageResolution): a basic swing keeps BASIC_FLOOR_SHARE of its neutral
        // hit and never less than BASIC_FLOOR_MIN points at the cap, after every modifier.
        if (!sp) {
            const _W = (typeof window !== 'undefined') ? window : {};
            const _tl = _aiLevel(tg);
            const _ls = (_tl >= 1 && typeof levelScale === 'function') ? levelScale(_tl) : 1;
            const _mag = (typeof offenseMagnitude === 'function') ? (offenseMagnitude(_aiLevel(unit), _tl) || 1) : _offScale(unit, tg);
            est = Math.max(est, raw * _mag * (_W.BASIC_FLOOR_SHARE ?? 0.35), (_W.BASIC_FLOOR_MIN ?? 25) * _ls);
        }

        return Math.max(1, Math.round(est));
    }

    // Land probability for a basic attack (spells never miss; back-arc
    // basic attacks are undodgeable).
    function _landP(g, unit, tg, arcKnown) {
        try {
            const arc = arcKnown || g.getAttackArc(unit, tg);
            if (arc === 'back') return 1;
            const ev = (typeof g.getEvasionChance === 'function') ? (g.getEvasionChance(tg) || 0) : 0;
            return Math.max(0, 1 - ev);
        } catch (e) { return 1; }
    }

    // ── Press Turn expectation ───────────────────────────────────────────
    // A weakness hit, a status combo hit or a crit refunds +2 AP (one full
    // free action), once a turn, 1 less per resistance (mondo 2026-10-23); a whiff drains an extra AP. Detected off the
    // type TIER (strong && !weak), matching the engine.
    function _pressTier(unit, tg, spellType) {
        const chart = (typeof TYPE_CHART !== 'undefined') ? TYPE_CHART : null;
        if (!chart || !tg) return 0;
        const dTypes = tg.types || [];
        const aTypes = spellType ? [spellType] : (unit.types || []);
        let hasStrong = false, hasWeak = false;
        for (const at of aTypes) {
            const e = chart[at]; if (!e) continue;
            for (const dt of dTypes) {
                if (e.strongVs && e.strongVs.includes(dt)) hasStrong = true;
                if (e.weakVs && e.weakVs.includes(dt)) hasWeak = true;
            }
        }
        if (hasStrong && !hasWeak) return 1;
        if (hasWeak && !hasStrong) return -1;
        return 0;
    }
    // Expected press value of an offensive action. altValue ≈ what the
    // refunded action would be worth (floored at AI_TUNE.pressActionValue).
    function pressEV(g, unit, tg, opts) {
        opts = opts || {};
        if (!_aiDiff().press) return 0;
        // ONE press a turn (battle.js applyPressTurn) — after that it vents to the entropy gauge (still nice, worth a
        // sliver, not a whole action).
        // opts.freshTurn: weighing a teammate's NEXT activation (THE STATUS COMBOS) — its press is still unspent then
        const alreadyPressed = !opts.freshTurn && (unit._pressGainedThisTurn || 0) > 0;
        /* THE PRESS SUM (battle.js _pressHitInfo, mondo 2026-10-23): a super effective type, an element weakness, a
           status combo or a crit is worth +2; each resistance (type, element part) takes 1 off; an immune / absorbed
           element blocks it. opts.spell = the spell being weighed (its element, its combo). */
        const tier = _pressTier(unit, tg, opts.spellType || null);
        let aff = null, combo = false;
        if (opts.spell) {
            try {
                const _el = (typeof getSpellElement === 'function') ? getSpellElement(opts.spell) : null;
                const _ok = _el && typeof COMBAT_ELEMENTS !== 'undefined' && COMBAT_ELEMENTS.includes(_el)
                    && !(typeof spellElemShare === 'function' && spellElemShare(opts.spell) <= 0);
                aff = (_ok && typeof unitElementAffinity === 'function') ? unitElementAffinity(tg, _el) : null;
                const _bvs = opts.spell.bonusVsStatus;
                combo = !!(_bvs && _bvs.status && (opts.assumeCombo
                    || (typeof bonusStatusMatches === 'function' && bonusStatusMatches(tg, _bvs.status))));
            } catch (e) {}
        }
        const block = aff === 'immune' || aff === 'absorb';
        const resists = (tier < 0 ? 1 : 0) + (aff === 'resist' ? 1 : 0);
        const hasSrc = tier > 0 || aff === 'weak' || combo;
        const size = Math.max(0, 2 - resists) / 2;   // share of a full +2 press
        const critP = (opts.canCrit && typeof g.getCritChance === 'function')
            ? (g.getCritChance(unit) || 0) : 0;
        const landP = opts.landP != null ? opts.landP : 1;
        const refund = Math.max(tuneW(g, 'pressActionValue'), (wght(g, 'pressRefundValue_v1', 113) || 0) * 1.5);
        // a crit refunds +2 AP like a weakness (mondo 2026-10-23) — its chance counts in full
        const pressP = block ? 0 : Math.min(1, landP * (hasSrc ? 1 : critP));
        let v = 0;
        if (pressP > 0 && size > 0) v += pressP * size * (alreadyPressed ? refund * 0.15 : refund);
        if (tier < 0 && (!hasSrc || block)) v -= refund * 0.55 * (block ? 1 : (1 - critP));   // resist with nothing pressing drains an extra AP
        if (landP < 1) v -= (1 - landP) * refund * 0.4;   // whiff drains too
        return v;
    }
    function wght(g, key, dflt) {
        try { const v = g.getAIWeight(key); return (v == null || isNaN(v)) ? dflt : v; } catch (e) { return dflt; }
    }

    /* Trainable AI_TUNE knobs (schema 13, 2026-08-15): the highest-leverage
       value-model constants are routed through the A/B trainer so AI
       Training tunes the v4 brain instead of only its legacy periphery.
       getAIWeight also handles the strength-test baseline side (pinned to
       defaults) and campaign difficulty noMult rules, so every consumer of
       tuneW() participates in those automatically. Defaults in
       battle.js AI_WEIGHT_DEFAULTS MUST mirror AI_TUNE — an untrained
       install must play exactly the shipped constants. */
    const _TUNE_TRAINED_KEYS = {
        mpValuePerPoint:    'mpValuePerPoint_v4',
        threatCostFactor:   'threatCostFactor_v4',
        killBase:           'killBase_v4',
        supportKillPremium: 'supportKillPremium_v4',
        pressActionValue:   'pressActionValue_v4',
        focusCommitBonus:   'focusCommitBonus_v4',
        // gen-305 audit (2026-09-06): the next tier of live, every-match
        // value-model knobs. Each has exactly the call sites listed in
        // ai-weights.test.js — a knob with no live read is not trainable.
        killOutputTurns:    'killOutputTurns_v4',
        woundedPileOn:      'woundedPileOn_v4',
        reviveBase:         'reviveBase_v4',
        ccOutputFactor:     'ccOutputFactor_v4',
        statusSetupFactor:  'statusSetupFactor_v4',
        buffStageFactor:    'buffStageFactor_v4',
        deathRiskFactor:    'deathRiskFactor_v4',
        jointSearchDiscount:'jointSearchDiscount_v4',
        healSafetyDiscount: 'healSafetyDiscount_v4',
        towerLowHpPush:     'towerLowHpPush_v4',
        moveHighGroundMelee:'moveHighGroundMelee_v4',
    };
    function tuneW(g, key) {
        const wk = _TUNE_TRAINED_KEYS[key];
        if (wk) {
            try {
                const v = g.getAIWeight(wk);
                if (v != null && !isNaN(v)) return v;
            } catch (e) {}
        }
        return AI_TUNE[key];
    }

    // ═════════════════════════════════════════════════════════════════════
    // VALUE MODEL — converts everything into the one currency.
    // ═════════════════════════════════════════════════════════════════════

    // Per-activation caches (cleared at each activation's first loop).
    let _outputCache = new Map();

    // A unit's expected per-turn damage output vs a reference defender
    // (best of basic attack / affordable damage spells). THE denominator
    // for kill/CC/buff values.
    function unitThreatOutput(g, u, vs) {
        if (!u || u.dead) return 0;
        const key = u.id + ':' + (vs ? vs.id : 0);
        if (_outputCache.has(key)) return _outputCache.get(key);
        const ref = vs || u;
        let best = estDamage(g, u, ref, null);
        let silenced = false;
        try { silenced = g.unitHasStatus(u, 'silence'); } catch (e) {}
        if (!silenced) {
            for (const sp of (u.spells || [])) {
                if (!sp || !DMG_KINDS.has(sp.kind)) continue;
                if ((u.mp || 0) < _mpCost(u, sp)) continue;
                const d = estDamage(g, u, ref, sp);
                if (d > best) best = d;
            }
        }
        _outputCache.set(key, best);
        return best;
    }

    // Does this unit's kit make it a support piece worth silencing/killing?
    function unitIsHealerKit(u) {
        return (u.spells || []).some(s => s && (s.kind === 'heal' || s.kind === 'healAll' || s.kind === 'revive'));
    }

    /* ── THE ARENA RULES (v4.14, 2026-10-07): 20-round limit, the Arena score
       decides (battle.js _resolveArenaTimerExpiry), all 5 Keys to win, bounty
       points that grow with the streak a kill ends (battle.js processBountyClaim).
       One Arena point is worth ARENA_PT_VALUE of the currency (a kill's 25 points
       = 100 since 2026-10-07; it was 15 = the 60 the kill-scoring modes add). */
    const ARENA_PT_VALUE = 4;
    /* THE POINT PRICE (2026-10-29, the training rework): the exchange rate itself is trainable now (arenaPointValue_v1,
       default 8; it was a fixed 4). 86% of Arena matches end on the round-20 score, and a Cube hit of ~280 pays ~19 points
       while the same damage on a unit is ~5 points of a kill that regen and zone heals often undo. */
    function _ptv(g) { return wght(g, 'arenaPointValue_v1', 8); }
    // the Arena points a Cube hit of `dmg` pays at the buzzer (battle.js _arenaCompositePts: 1 point per 0.4% of the Cube)
    function _cubeHitPts(tower, dmg) {
        if (!tower || !(tower.maxHp > 0) || !(dmg > 0)) return 0;
        return Math.min(dmg, Math.max(0, tower.hp)) / tower.maxHp * 250 * ((_arenaPts().towerDmgPer10) || 1);
    }
    function _arenaPts() {
        return (typeof window !== 'undefined' && window.ARENA_PTS) || { kill: 25, towerDmgPer10: 1, hourglass: 35, nexusRound: 6, surgeLastRounds: 5, bounty: 15, bountyPerStreak: 5, bountyCap: 35 };
    }
    function _isArenaMode() {
        try { const m = (typeof getActiveMultiplayerMode === 'function') ? getActiveMultiplayerMode() : null; return !!(m && m.id === 'arena'); } catch (e) { return false; }
    }
    // Arena points a kill on `u` pays as a bounty right now (0 = not ON FIRE).
    function arenaBountyPts(u) {
        const streak = (u && !u.dead) ? (u._killStreak || 0) : 0;
        if (streak < 3) return 0;   // battle.js BOUNTY_STREAK_MIN
        const P = _arenaPts();
        if (!P.bounty) return 0;
        return Math.min(P.bounty + (streak - 3) * (P.bountyPerStreak || 0), P.bountyCap || Infinity);
    }
    // The Arena composite score as the buzzer would count it now (mirror of
    // battle.js _resolveArenaTimerExpiry), plus the nexus rounds the zones a
    // side holds will still accrue before the limit (surge rounds count 2).
    function arenaScoreOf(g, p, roundsLeft) {
        const st = g.state, P = _arenaPts(), enemy = p === 1 ? 2 : 1;
        let pts = (st.matchKills?.[p] || 0) * P.kill;
        const eT = st.towers?.[enemy];
        if (eT) {
            const max = eT.maxHp || 1500;
            let td = Math.floor(Math.max(0, max - eT.hp) / max * 250) * (P.towerDmgPer10 || 1);
            pts += td;
        }
        pts += (st.hourglasses || []).filter(h => {
            if (h.carriedBy == null) return false;
            const c = st.units.find(u => u.id === h.carriedBy);
            return c && !c.dead && c.player === p;
        }).length * P.hourglass;
        pts += (st._arenaNexusControl?.[p] || 0) * P.nexusRound;
        pts += st._arenaBountyPts?.[p] || 0;
        let proj = pts;
        if (roundsLeft > 0 && st.nexusPoints) {
            const held = Object.keys(st.nexusPoints).filter(k => st.nexusPoints[k]?.owner === p).length;
            const surge = Math.min(roundsLeft, P.surgeLastRounds || 0);
            proj += held * P.nexusRound * (roundsLeft + surge);
        }
        return { now: pts, proj };
    }

    /* ── THE WIPEOUT SHARE (2026-10-23, the Tactics pass) ── the part of the wipeout win a kill on tg carries:
       all of it on a side's last standing body, 10% on the second-to-last. Shared by killValue (their bodies and,
       as the price of losing a unit, ours), the Finisher and tileDangerCost's own-death price. */
    function _wipeoutShare(g, tg) {
        const out = { share: 0, wipeW: 0, left: null };
        try {
            const mode = (typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null);
            if (!(mode && Array.isArray(mode.winConditions) && mode.winConditions.includes('wipeout'))) return out;
            if (typeof g.getTeamWipeoutCount !== 'function' || !tg || tg.dead || tg.player == null) return out;
            out.left = g.getTeamWipeoutCount(tg.player);
            out.wipeW = wght(g, 'wipeoutKillBonus_v1', 3000);
            if (out.left === 1) out.share = out.wipeW;
            else if (out.left === 2) out.share = out.wipeW * 0.1;
        } catch (e) {}
        return out;
    }
    /* Kills recorded while ONE action is scored (scoreSpells / scoreDetonate / scoreEntropyStrike open it). When the
       action's kills reach every body the victims' side has standing, the action IS the wipeout: it is paid the
       whole win, minus the per-victim shares killValue already gave. */
    let _killTally = null;
    function _openKillTally() { _killTally = { ids: new Map(), player: null, wipeW: 0 }; }
    function _closeKillTally(g) {
        const t = _killTally; _killTally = null;
        if (!t || t.ids.size < 2 || t.player == null || !t.wipeW) return 0;
        try {
            if (typeof g.getTeamWipeoutCount !== 'function' || t.ids.size < g.getTeamWipeoutCount(t.player)) return 0;
        } catch (e) { return 0; }
        let given = 0;
        for (const s of t.ids.values()) given += s || 0;
        return Math.max(0, t.wipeW - given);
    }
    /* KEY CARRIER DENIAL (2026-10-23): a carrier's death drops its Keys, so it is worth more the closer its team is
       to the Keys win: keyCarrierDenial_v1 × (Keys its team holds ÷ Keys to win)² × this carrier's share of them.
       The carrier one Key from the win is worth ~500 more; a lone early Key ~30. All public (picked-up Keys are
       shown to both sides). */
    function _keyCarrierDenial(g, tg) {
        try {
            if (!tg || !(tg.hourglasses > 0) || typeof g.getKeysToWin !== 'function') return 0;
            const need = g.getKeysToWin();
            if (!(need > 0)) return 0;
            const teamHeld = (g.state.hourglasses || []).filter(h => h.carriedBy != null &&
                g.state.units.find(u => u.id === h.carriedBy)?.player === tg.player).length;
            if (!teamHeld) return 0;
            const frac = Math.min(1, teamHeld / need);
            return wght(g, 'keyCarrierDenial_v1', 800) * frac * frac * Math.min(1, tg.hourglasses / teamHeld);
        } catch (e) { return 0; }
    }

    /* ═══ THE KEYS (2026-11-01, mondo: "it needs to know holding all 5 keys is a win condition, one key is a buff, the key
       drops where a unit that was holding one dies, so they should be incentivized to inspect on those tiles ... just make
       sure the ai knows about keys"). Lab before: 2.6 Inspects per side per match on ~108 squares (0.18 Keys found a match),
       and with a seen loose Key in reach the CPU had the pickup on its list 83 times and took it 4 (it was a flat 180 and
       lost to any hit). What one more Key is worth to side p (existing rules only, battle.js):
       • Arena: a Key carried at the buzzer scores ARENA_PTS.hourglass (35) points, priced like every Arena point (_ptv);
       • the Key Charge: +8 damage dealt and -8 damage taken per hit per Key held (HOURGLASS_POWER_PER_LEVEL), +1 MOV per two,
         for the rounds the carrier keeps it (counted up to 4);
       • the Keys win: holding all of them (getKeysToWin) wins, so each Key is a step toward it, priced like the carrier
         denial on the other side (keyCarrierDenial_v1 × the rise of (held ÷ need)²).
       Kill switch: window.EW_AI_NO_KEY_SENSE (the old flat prices, no Inspect first, no walk to a seen Key). ═══ */
    function _keySense() { return !window.EW_AI_NO_KEY_SENSE; }
    // THE TRAINABLE FIXES (2026-11-01): the floor price of a Key pickup (was a fixed 180)
    function _keyFloor(g) { return wght(g, 'keyPickupFloor_v1', 180); }
    function _keysHeldBy(g, p) {
        return (g.state.hourglasses || []).filter(h => h.carriedBy != null
            && (g.state.units || []).find(u => u.id === h.carriedBy && !u.dead)?.player === p).length;
    }
    function _keyWorth(g, p, n, v) {
        if (!(n > 0)) return 0;
        let worth = 0;
        try {
            if (_isArenaMode()) worth += n * (_arenaPts().hourglass || 35) * _ptv(g);
            const per = (typeof HOURGLASS_POWER_PER_LEVEL === 'number') ? HOURGLASS_POWER_PER_LEVEL : 8;
            const ws = v && v.winState;
            const rl = (ws && ws.roundsRemaining > 0) ? ws.roundsRemaining : 4;
            worth += n * per * 2 * Math.min(wght(g, 'keyChargeRounds_v1', 4), rl);   // THE TRAINABLE FIXES: rounds of Key Charge counted
            const need = (typeof g.getKeysToWin === 'function') ? g.getKeysToWin() : 0;
            if (need > 0) {
                const held = _keysHeldBy(g, p);
                const a = Math.min(1, held / need), b = Math.min(1, (held + n) / need);
                worth += wght(g, 'keyCarrierDenial_v1', 800) * (b * b - a * a);
            }
        } catch (e) {}
        return worth;
    }

    // Value of REMOVING tg from the board (the kill premium, added on top
    // of the damage that does it).
    function killValue(g, unit, tg, v) {
        let val = tuneW(g, 'killBase') + tuneW(g, 'killOutputTurns') * unitThreatOutput(g, tg, unit);
        if (unitIsHealerKit(tg)) val += tuneW(g, 'supportKillPremium');
        val += Math.min(150, (tg.intStat || tg.int || 0) * 1.2);   // big casters
        if ((tg.hourglasses || 0) > 0) val += AI_TUNE.hourglassTargetBonus + tg.hourglasses * 12 + _keyCarrierDenial(g, tg);
        // Kills are uncapped points in TDM/FFA/arena composite scoring.
        try {
            const mode = (typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null);
            if (mode && (mode.id === 'tdm' || mode.id === 'simul' || mode.id === 'ffa')) val += 60;
            else if (mode && mode.id === 'arena') {
                val += _arenaPts().kill * _ptv(g);
                // A bounty kill (the victim is ON FIRE) pays 15..35 more Arena points.
                val += arenaBountyPts(tg) * wght(g, 'bountyKillBonus_v1', ARENA_PT_VALUE);
            }
            /* WIPEOUT (2026-10-07, mondo: the lab's AI won by wipeout 88 times in 5,356 matches).
               The AI never knew that dropping the last body a side has standing ends the match:
               Cube hits and Key pickups carried a win flag, the last kill did not, so after a kill
               it walked off to the Cube instead of finishing the fight. The last standing body is
               worth a win; the second-to-last carries a share of it. Same value when it is OUR
               last body under threat (killValue is also the price of losing a unit). */
            /* THE TACTICS PASS (2026-10-23): the share now comes from _wipeoutShare, and an action that drops several
               bodies at once (an AoE, the Entropy Strike) records each victim in _killTally, so the action that
               leaves NOBODY standing is scored as the win after the whole action (scoreSpells → _closeKillTally). */
            const ws0 = _wipeoutShare(g, tg);
            if (ws0.share) val += ws0.share;
            if (_killTally && _aiActor && tg.player !== _aiActor.player && ws0.wipeW) {
                if (!_killTally.ids.has(tg.id)) _killTally.ids.set(tg.id, ws0.share);
                _killTally.player = tg.player; _killTally.wipeW = ws0.wipeW;
            }
        } catch (e) {}
        // Score pressure adds value to a kill, never to ordinary chip damage.
        // This is a bounded heuristic, not a promise of a hit or terminal win.
        const ws = v?.winState;
        const sp = ws?.scorePlay ?? 1;
        if (ws?.scorePolicy === 'seek_score') val += 40 * ws.roundUrgency * sp;
        else if (ws?.scorePolicy === 'break_tie') val += 20 * ws.roundUrgency * sp;
        else if (ws?.scorePolicy === 'sudden_death') val += 120;
        val += wght(g, 'killBonusScore_v1', 99);
        return val;
    }

    // Marginal value of healing `amount` HP on ally `tg`.
    function healValue(g, unit, tg, amount, v) {
        if (!tg || tg.dead) return 0;
        const hpDef = tg.maxHp - tg.hp;
        const actual = Math.min(amount || 0, hpDef);
        if (actual < 8) return 0;
        const frac = tg.hp / (tg.maxHp || 1);
        const urgency = frac < 0.25 ? 2.2 : frac < 0.4 ? 1.8 : frac < 0.6 ? 1.4 : frac < 0.8 ? 1.0 : 0.5;
        // Threat reality: healing matters when enemies can actually reach
        // the patient; a scratch-heal in total safety is banked value only.
        let reality = AI_TUNE.healNoEnemyDiscount;
        const enemies = (v && v.visibleEnemies) || [];
        if (enemies.length) {
            reality = tuneW(g, 'healSafetyDiscount');
            for (const e of enemies) {
                let er = 1, em = 2;
                try { er = g.getEffectiveRange(e) || (e.range || 1); } catch (q) {}
                try { em = g.getEffectiveMove(e) || (e.move || 2); } catch (q) {}
                // Full-turn reach: first move + HALVED second move (2026-08-29 rework).
                if (_dist(g, tg.x, tg.y, tg.z, e) <= em + Math.ceil(em / 2) + er) { reality = 1; break; }
            }
        }
        let val = actual * urgency * reality;
        if ((tg.hourglasses || 0) > 0 && frac < 0.6) val += 40;
        /* THE LIFE LINE (2026-10-29, the training rework): what a heal is really for is the death it stops. The enemy
           team's best hit on the PATIENT before its next activation (each enemy that can reach it, its best single
           action, as the threat field reads it): a heal that lifts the patient out of that range saves a kill (its
           kill value, as the enemy would price it); a heal that still leaves it inside the range is mostly wasted (the
           10-28 playtest: two potions on a Swamp Monster that died to the focus anyway). healLifeLine_v1 scales it
           (0 = the old flat heal price). */
        const lw = wght(g, 'healLifeLine_v1', 1);
        if (lw > 0 && enemies.length && reality === 1) {
            try {
                let incoming = 0;
                for (const e of enemies) {
                    if (!e || e.dead) continue;
                    let er = 1, em = 2;
                    try { er = g.getEffectiveRange(e) || (e.range || 1); } catch (q) {}
                    try { em = g.getEffectiveMove(e) || (e.move || 2); } catch (q) {}
                    let best = estDamage(g, e, tg, null), br = er;
                    for (const sp of (e.spells || [])) {
                        if (!sp || !DMG_KINDS.has(sp.kind) || (e.mp || 0) < _mpCost(e, sp)) continue;
                        const d2 = estDamage(g, e, tg, sp);
                        if (d2 > best) { best = d2; let sr = sp.range || 1; try { sr = g.getEffectiveSpellRange(e, sp) || sr; } catch (q) {} br = Math.max(br, sr); }
                    }
                    if (_dist(g, tg.x, tg.y, tg.z, e) <= em + br) incoming += best;
                }
                const hpNow = effHp(tg);
                if (incoming >= hpNow && incoming < hpNow + actual) val += lw * killValue(g, unit, tg, v) * 0.5;
                else if (incoming >= hpNow + actual) val *= Math.max(0.25, 1 - 0.6 * lw);
            } catch (e) {}
        }
        return val;
    }

    // A passive that blocks the status outright (unitPassiveBlocksStatus / immuneKind, as _mirrorStatusValue checks).
    function _aiStatusBlocked(g, tg, id) {
        try {
            if (typeof unitPassiveBlocksStatus === 'function' && unitPassiveBlocksStatus(tg, id)) return true;
            const defs = g.STATUS_DEFS || (typeof STATUS_DEFS !== 'undefined' ? STATUS_DEFS : {});
            if (typeof unitPassiveValue === 'function' && defs[id]?.kind
                && unitPassiveValue(tg, 'immuneKind') === defs[id].kind) return true;
        } catch (e) {}
        return false;
    }

    // Value of denying tg's actions with status `id` for `dur` rounds.
    function ccDenialValue(g, unit, tg, id, dur, v) {
        if (!tg || tg.dead) return 0;
        try { if (g.unitHasStatus(tg, id)) return 0; } catch (e) {}
        if (_aiStatusBlocked(g, tg, id)) return 0;   // WEAK RACES II: Ghoul shrugs off Stun, Rabbit Slow — no denial
        const output = unitThreatOutput(g, tg, unit);
        const turns = Math.min(dur || 1, 2);
        const notYetActed = (tg.ap || 0) > 0 ? 1 : 0.45;   // denying a spent unit is worth less
        if (HARD_CC.has(id)) {
            let val = tuneW(g, 'ccOutputFactor') * output * turns * notYetActed;
            if (id === 'stagger') val *= 0.45;             // partial denial
            if (unitIsHealerKit(tg)) val += 120;
            return val;
        }
        if (id === 'silence') {
            const kitDmg = (tg.spells || []).some(s => s && DMG_KINDS.has(s.kind) && (s.dmg || s.hitDamages));
            let val = (kitDmg ? 0.55 : 0.2) * output * turns * notYetActed;
            if (unitIsHealerKit(tg)) val += 160;           // muzzle the healer
            return val;
        }
        if (id === 'root') {
            let melee = true;
            try { melee = (g.getEffectiveRange(tg) || 1) <= 1; } catch (e) {}
            return melee ? 0.55 * output * turns : 55;     // rooted snipers still shoot
        }
        if (id === 'jammed') {
            let ranged = false;
            try { ranged = (g.getEffectiveRange(tg) || 1) >= 2; } catch (e) {}
            return ranged ? 0.45 * output * turns : 30;
        }
        if (id === 'charm' || id === 'confuse') return 0.7 * output * turns * notYetActed;
        if (id === 'taunt') {
            const hitter = (tg.atk || 0) >= (tg.intStat || tg.int || 0);
            return (hitter ? 0.5 : 0.25) * output * turns;
        }
        if (id === 'slow') return 40 + 12 * turns;
        if (id === 'minimize') return 0.35 * output * turns;
        if (id === 'hexed') return 90;
        if (id === 'blind') {
            // 👁 Blind takes the target down to 1 tile of sight and cuts it off from its team's eyes: a ranged
            // threat loses its shots, a melee one barely notices
            let ranged = false;
            try { ranged = (g.getEffectiveRange(tg) || 1) >= 2; } catch (e) {}
            return (ranged ? 0.55 : 0.3) * output * turns;
        }
        if (id === 'broken') {
            /* 💔 Broken shuts the target's passives off (data.js getUnitPassives → []); a unit flying by passive falls
               and eats the fall damage. Priced by what it loses; breakValue_v1 tunes it (trainer-tunable, default 1). */
            let val = 0;
            try {
                const ps = (typeof getUnitPassives === 'function') ? getUnitPassives(tg) : [];
                val += 28 * Math.min(4, ps.length) * turns;
                const b = tg._passiveStatBonus || {};
                val += 1.2 * ((b.atk || 0) + (b.int || 0) + (b.def || 0) + (b.mdef || 0));
                if (typeof g.canFly === 'function' && g.canFly(tg) && !g.unitHasStatus(tg, 'levitating')
                    && typeof g.isUnitAirborne === 'function' && g.isUnitAirborne(tg)) val += 140;
            } catch (e) {}
            return val * wght(g, 'breakValue_v1', 1);
        }
        if (id === 'burn' || id === 'poison' || id === 'bleed') {   // bleed: Open Vein (THE SPELL POWER REVIEW)
            let dot = 30;
            try {
                const defs = (typeof STATUS_DEFS !== 'undefined') ? STATUS_DEFS : (G().STATUS_DEFS || {});
                dot = (defs[id] && (defs[id].dotDamage || (id === 'bleed' ? defs[id].dot : 0))) || 30;
            } catch (e) {}
            return dot * (dur || 2) * _offScale(unit, tg) * 0.8;
        }
        if (id === 'marked') return 45;
        if (id === 'discord') return 70;
        if (id === 'glare') return 35;
        if (id === 'soaked') return 30;
        return 25;
    }

    /* ═══ THE STATUS COMBOS (2026-11-01, mondo: "it should want to inflict a status on a unit before casting a spell
       that has a status bonus … unless the spell is estimated to kill even without the bonus … it also needs to be
       aware of what status effects and spells it has across teammates") ═══════════════════════════════════════════
       A finisher (bonusVsStatus: tier 3-4) hits ×mult on a target carrying its status and, as a status combo, presses
       (+2 AP). A setup (a spell whose statusEffects put that status on) costs 1 AP. Existing rules only — this is just
       what the CPU knows about them:
       · _comboGain: what the status is worth to ONE finisher on ONE target, priced with the real hit math — the extra
         damage the HP bar can take, the kill it turns a non-kill into, the press it unlocks.
       · statusSetupValue: a setup is credited with the best collector's gain × the chance that collector cashes it:
         the caster's own hit later this turn (a setup that keeps the turn), a teammate still to act this round, the
         caster's next turn (the status lasts), a teammate next round.
       · _comboFirst (rankCandidates): when the best option is a finisher on a target WITHOUT its status and it does not
         kill anyway, a setup the caster can put on that target goes first. No setup in the kit (or one that cannot land
         there) = the finisher is cast as before. One wait per finisher × target, so it never stalls.
       · findSpellTarget: a finisher aims at the enemy that already has its status (a teammate set it up). */
    function _bvsIds(sp) {
        return (sp && sp.bonusVsStatus && sp.bonusVsStatus.status) ? [].concat(sp.bonusVsStatus.status) : null;
    }
    // Does status `id` count for a finisher keyed on `ids`? (STATUS_DEFS countsAs: Corroded is Burn and Poison.)
    function _statusFeeds(id, ids) {
        if (!id || !ids) return false;
        if (ids.includes(id)) return true;
        try {
            const defs = (typeof STATUS_DEFS !== 'undefined') ? STATUS_DEFS : (G().STATUS_DEFS || {});
            const ca = defs[id] && defs[id].countsAs;
            return Array.isArray(ca) && ca.some(x => ids.includes(x));
        } catch (e) { return false; }
    }
    // The setup rider of `spell` that feeds a finisher keyed on `ids` (best chance first), or null.
    function _setupEffectFor(spell, ids) {
        let best = null;
        for (const eff of ((spell && spell.statusEffects) || [])) {
            if (!eff || !eff.id || !_statusFeeds(eff.id, ids)) continue;
            const p = eff.chance != null ? eff.chance : 0.9;
            if (!best || p > (best.chance != null ? best.chance : 0.9)) best = eff;
        }
        return best;
    }
    // Would status `id` actually stick on tg? (passive immunity, element immunity, Wet blocks Burn.)
    function _setupCanStick(g, tg, id) {
        if (!tg || tg.dead || _aiStatusBlocked(g, tg, id)) return false;
        try {
            if (id === 'burn' && (g.unitHasStatus(tg, 'wet') || (typeof _unitIsSoaked === 'function' && _unitIsSoaked(tg)))) return false;
            const el = typeof statusAffinityElement === 'function' ? statusAffinityElement(id, null) : null;
            const aff = el && typeof unitElementAffinity === 'function' ? unitElementAffinity(tg, el) : null;
            if (aff === 'immune' || aff === 'absorb') return false;
        } catch (e) {}
        return true;
    }
    // What putting finisher F's status on tg is worth to `mate`'s cast of F (tg does NOT have it yet).
    function _comboGain(g, mate, F, tg, v, freshTurn) {
        if (!F || !F.bonusVsStatus || !tg || tg.dead) return 0;
        const mult = F.bonusVsStatus.mult || 1.5;
        if (!(mult > 1)) return 0;
        const _kt = _killTally; _killTally = null;   // a kill that MIGHT happen next turn is not this cast's wipeout
        try {
            const eN = estDamage(g, mate, tg, F);
            if (!(eN > 0)) return 0;
            const eW = eN * mult, hp = effHp(tg);
            let gain = Math.min(eW, hp) - Math.min(eN, hp);
            if (eW >= hp && eN < hp) gain += killValue(g, mate, tg, v);
            if (PRESS_KINDS.has(F.kind)) {
                const o = { spellType: F.spellType || null, spell: F, freshTurn: !!freshTurn };
                gain += Math.max(0, pressEV(g, mate, tg, Object.assign({ assumeCombo: true }, o)) - pressEV(g, mate, tg, o));
            }
            return Math.max(0, gain);
        } catch (e) { return 0; }
        finally { _killTally = _kt; }
    }

    // Setup credit: applying status `id` to tg unlocks every teammate spell carrying bonusVsStatus[id].
    //   ctx.spell = the setup cast (does it keep the turn? what does it cost?), ctx.dur = the status's rounds.
    function statusSetupValue(g, unit, tg, id, v, persists, ctx) {
        if (!tg || tg.dead || _aiStatusBlocked(g, tg, id)) return 0;
        const combos = _aiDiff().combos && !window.EW_AI_NO_STATUS_COMBOS;
        if (combos) {
            // already on: putting it on again sets nothing up
            try { if (typeof bonusStatusMatches === 'function' ? bonusStatusMatches(tg, id) : g.unitHasStatus(tg, id)) return 0; } catch (e) {}
        }
        const setupSp = ctx && ctx.spell;
        let keepsTurn = false, setupAp = 1, setupMp = 0;
        if (setupSp) {
            try { keepsTurn = !!(g.TargetQuery && typeof g.TargetQuery.spellEndsTurn === 'function' && !g.TargetQuery.spellEndsTurn(setupSp)); } catch (e) {}
            try { setupAp = g.TargetQuery.apCost(setupSp); } catch (e) {}
            setupMp = _mpCost(unit, setupSp);
        }
        if (typeof _isClashMode === 'function' && _isClashMode()) keepsTurn = false;   // Clash: any paid act ends the turn
        // ONE ROUND = ONE TURN: a status lasts into next round when it runs 2+ rounds, or lands on a unit that already acted
        const lasts = !!persists || ((ctx && ctx.dur) || 1) >= 2 || (tg.ap || 0) <= 0;
        let total = 0, sure = 0;
        const gains = [];
        const team = g.state.units.filter(u => u.player === unit.player && !u.dead && u.hp > 0);
        for (const mate of team) {
            let mateBest = 0, mateCounted = false;
            for (const sp of (mate.spells || [])) {
                if (!sp || !sp.bonusVsStatus) continue;
                const ids = [].concat(sp.bonusVsStatus.status || []);
                if (!(combos ? _statusFeeds(id, ids) : ids.includes(id))) continue;
                const self = mate.id === unit.id;
                if ((mate.mp || 0) - (self ? setupMp : 0) < _mpCost(mate, sp)) continue;
                // Can the payoff caster plausibly collect next activation?
                let er = sp.range || 1, em = 2;
                try { er = g.getEffectiveSpellRange(mate, sp) || er; } catch (e) {}
                try { em = g.getEffectiveMove(mate) || (mate.move || 2); } catch (e) {}
                const d = _dist(g, mate.x, mate.y, mate.z, tg);
                if (d > em + er + 1) continue;
                const payoff = estDamage(g, mate, tg, sp);
                if (!combos) {
                    total += tuneW(g, 'statusSetupFactor') * payoff * ((sp.bonusVsStatus.mult || 1.5) - 1);
                    /* WEAK RACES II (2026-10-23, mondo): a payoff that is all but certain — a teammate still to act this
                       round (ap left), or the caster's own next turn when the status keeps landing (a zone that lasts
                       into next round: Lamp Smoke → Twisted Wish) — is credited at AI_TUNE.statusSetupSure instead of
                       the trained average, so Missing Time / Misdirection / Lamp Smoke get cast before their payoff. */
                    if ((!self && (mate.ap || 0) > 0) || (self && persists)) {
                        sure += AI_TUNE.statusSetupSure * payoff * ((sp.bonusVsStatus.mult || 1.5) - 1);
                    }
                    break;   // one payoff per teammate is enough credit
                }
                // the trained average credit stays as the floor (statusSetupFactor_v4, never reset), one per teammate as before
                if (!mateCounted) { total += tuneW(g, 'statusSetupFactor') * payoff * ((sp.bonusVsStatus.mult || 1.5) - 1); mateCounted = true; }
                // THE STATUS COMBOS: the chance this collector cashes the status in, × what it is worth to it
                let pc = 0;
                if (self) {
                    let fAp = 1; try { fAp = g.TargetQuery.apCost(sp); } catch (e) {}
                    if (keepsTurn && sp !== setupSp && (unit.ap || 0) - setupAp >= fAp && d <= er) pc = 0.92;   // this turn, from here
                    else if (lasts) pc = 0.5;                                                                     // own next turn
                } else if (_comboWaitFor.has(mate.id) && _comboWaitFor.get(mate.id).round === (g.state.round || 0)
                           && _comboWaitFor.get(mate.id).T === tg.id && (lasts || tg._turnRound === g.state.round)) {
                    pc = 0.8;                                                                                     // THE FINISHER WAITS: it kept the finisher for this
                } else if ((mate.ap || 0) > 0) {
                    pc = d <= er ? 0.85 : 0.65;                                                                   // later this round
                } else if (lasts) {
                    pc = 0.35;                                                                                    // next round
                }
                // THE TRAINABLE FIXES (2026-11-01): × the trained cash-in odds (1 = the numbers above)
                if (pc > 0) pc = Math.min(0.98, pc * wght(g, 'comboCashChance_v1', 1));
                // the press is still unspent on any turn but this one (a teammate's, or our own next turn)
                if (pc > 0) mateBest = Math.max(mateBest, pc * _comboGain(g, mate, sp, tg, v, !(self && pc > 0.9)));
            }
            if (mateBest > 0) gains.push(mateBest);
        }
        if (combos && gains.length) {
            // the best collector in full; the rest are backups (the first may kill it)
            gains.sort((a, b) => b - a);
            sure = gains[0] + gains.slice(1).reduce((a, b) => a + b, 0) * wght(g, 'comboBackupShare_v1', 0.25);
            return Math.max(Math.min(220, total), Math.min(wght(g, 'comboSetupCap_v1', 600), sure));
        }
        return Math.max(Math.min(220, total), Math.min(400, sure));
    }

    /* WEAK RACES II (2026-10-23, mondo): expected value of a hidden trap / step mine on `tile` — the chance an enemy
       walks onto it before it is found (closer + a bigger footprint = likelier) × the hit it lands (estDamage + the
       status it leaves), discounted as future damage; a blast that catches neighbours adds half a hit each. */
    function _trapHitValue(g, unit, spell, tile, v, size, blastSide) {
        if (!tile) return 0;
        const foot = Math.min(2.5, Math.max(1, size || 1));
        let miss = 1, best = null, bestP = 0;
        for (const e of v.visibleEnemies) {
            if (isProtected(g, e)) continue;
            const d = Math.max(0, Math.abs(e.x - tile.x) + Math.abs(e.y - tile.y) - ((size || 1) - 1));
            let em = 2;
            try { em = g.getEffectiveMove(e) || (e.move || 2); } catch (q) {}
            const p = Math.min(0.85, foot * (d <= 1 ? 0.3 : d <= em ? 0.18 : d <= em * 2 ? 0.08 : 0));
            if (p <= 0) continue;
            miss *= (1 - p);
            if (p > bestP) { bestP = p; best = e; }
        }
        if (!best) return 0;
        let hit = estDamage(g, unit, best, spell);
        for (const eff of (spell.statusEffects || [])) {
            if (eff && eff.id) hit += ccDenialValue(g, unit, best, eff.id, eff.duration || 1, v);
        }
        const reach = Math.floor(((spell.trapHitsAll ? size : blastSide) || 1) / 2);
        if (reach > 0) {
            for (const e of v.visibleEnemies) {
                if (e.id === best.id || isProtected(g, e)) continue;
                if (Math.max(Math.abs(e.x - best.x), Math.abs(e.y - best.y)) <= reach) hit += estDamage(g, unit, e, spell) * 0.5;
            }
        }
        return (1 - miss) * hit * 0.75;
    }

    /* ═══ THE TRAP PLAN (2026-11-01, mondo: "it needs to be able to strategically cast and place traps"). The 11-01
       training run counted Snare / Spike Trap / Trapdoor / Deathtrap castable 1,637 times and cast 0: the scorer only
       priced a trap tile within 2 of an enemy (so a hit was always on offer and won) and guessed the step odds from
       plain distance. Existing trap rules only (battle.js placeTrap / checkTrapTrigger / _springTrap): a hidden trap
       stays until sprung, the first ENEMY whose walk crosses one of its tiles stops there and springs it (spike =
       Rooted 2 rounds, each tile once; trapdoor = the whole group, the row's statuses or Staggered), flyers glide
       over it, the cast ends the turn (dmg > 0), and past the per-caster cap the engine lifts the caster's OLDEST one.
       Now each visible enemy's next walks are predicted on the CPU's own path field: it heads for one of our units (or
       our Cube) by the cheapest route, splitting evenly where routes fork, and stops when in range; the squares it
       crosses this turn count full, the next walk's squares less. A trap is worth P(an enemy crosses it) × what its hit
       and status are worth on that enemy. Fog-true: only enemies this team can see. Kill-switch:
       window.EW_AI_NO_TRAP_PLAN (back to the old distance guess). ═══ */
    let _trapOddsCache = null;
    let _aiHypoMove = 0;   // > 0 while _withUnitAt has the caster standing on a square it is only thinking about
    function _trapEnemyOdds(g, unit, v) {
        const W = g.bw(), H = g.bh();
        const foes = (v.visibleEnemies || []).filter(e => e && !e.dead && !isProtected(g, e));
        const goals = [unit, ...(v.allies || [])].filter(a => a && !a.dead && a.player === unit.player);
        const uniq = new Map();
        for (const a of goals) uniq.set(a.id, a);
        const posKey = (arr, skipId) => arr.filter(a => a.id !== skipId).map(a => a.id + '@' + a.x + ',' + a.y).sort().join(';');
        const tw = (v.ownTower && v.ownTower.hp > 0) ? v.ownTower : null;
        const base = (g.state.round || 0) + '|' + unit.player + '|' + W + 'x' + H + '|' + posKey(foes) + '|' + posKey([...uniq.values()], unit.id)
            + '|' + (tw ? tw.x + ',' + tw.y : '-');
        const key = base + '|' + unit.id + '@' + unit.x + ',' + unit.y;
        if (_trapOddsCache && (_trapOddsCache.key === key || (_aiHypoMove > 0 && _trapOddsCache.base === base))) return _trapOddsCache.odds;
        const odds = [];
        const _trapShare = wght(g, 'trapWalkShare_v1', 0.8);
        for (const e of foes) {
            // flyers glide over a trap (checkTrapTrigger skips airborne units)
            try { if ((typeof g.canFly === 'function' && g.canFly(e)) || (typeof g.isUnitAirborne === 'function' && g.isUnitAirborne(e))) continue; } catch (q) {}
            let mv = 3;
            try { mv = Math.max(1, g.getEffectiveMove(e) || e.move || 3); } catch (q) {}
            // a rooted / stunned enemy walks a turn later
            let held = 1;
            try { if (['root', 'stun', 'freeze', 'sleep', 'petrify'].some(s => g.unitHasStatus(e, s))) held = 0.5; } catch (q) {}
            const tg = [...uniq.values()].map(a => ({ x: a.x, y: a.y, mult: 1 + ((a.hourglasses || 0) > 0 ? 0.5 : 0) + (a.maxHp && a.hp / a.maxHp < 0.5 ? 0.3 : 0) }));
            if (tw) tg.push({ x: tw.x, y: tw.y, mult: 0.7 });
            // the four nearest (the weak-PC cap: one path field each)
            tg.sort((a, b) => (Math.abs(a.x - e.x) + Math.abs(a.y - e.y)) - (Math.abs(b.x - e.x) + Math.abs(b.y - e.y)));
            const p = new Float32Array(W * H);
            const flows = [];
            let wSum = 0;
            for (const t of tg.slice(0, 4)) {
                let F = null;
                try { F = _goalField(g, e, t.x, t.y); } catch (q) { F = null; }
                if (!F) continue;
                const d0 = F.d[e.x + e.y * W];
                if (!(d0 < Infinity)) continue;
                const w = t.mult / Math.pow(1 + d0, 2);
                wSum += w;
                if (d0 > 0) flows.push({ F, d0, w });   // already in range of it: no walk toward it
            }
            if (!(wSum > 0)) continue;
            for (const fl of flows) {
                // the walk splits evenly over the squares that bring it closer, square by square, down the field
                const { F, d0 } = fl, d = F.d;
                const share = _trapShare * held * fl.w / wSum;   // 0.8 (trained: trapWalkShare_v1): it may hold, retreat or chase someone else
                const mass = new Map([[e.x + e.y * W, 1]]);
                const order = [e.x + e.y * W];
                for (let k = 0; k < order.length; k++) {
                    const i = order[k], m = mass.get(i);
                    if (!(m > 0)) continue;
                    const walked = d0 - d[i];
                    if (i !== order[0]) {
                        const tf = walked <= mv ? 1 : walked <= 2 * mv ? 0.75 : 0.5;   // a trap waits: lab casts sprang ~every time
                        p[i] = Math.min(0.95, p[i] + m * share * tf);
                    }
                    if (d[i] <= 0 || walked > 3 * mv) continue;   // it stops in range of its target
                    const x = i % W, y = (i - x) / W, nx = [];
                    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                        const ax = x + dx, ay = y + dy;
                        if (ax < 0 || ay < 0 || ax >= W || ay >= H) continue;
                        const j = ax + ay * W;
                        if (d[j] < d[i] - 0.5) nx.push(j);
                    }
                    if (!nx.length) continue;   // a leap / a climb from here: the path field knows, the split does not
                    // the steepest squares first (the cheapest route), ties split evenly
                    const lo = Math.min(...nx.map(j => d[j]));
                    const pick = nx.filter(j => d[j] <= lo + 0.01);
                    for (const j of pick) {
                        if (!mass.has(j)) { mass.set(j, 0); order.push(j); }
                        mass.set(j, mass.get(j) + m / pick.length);
                    }
                    // keep the walk in field order (a square is settled before its successors spread its mass)
                    if (order.length - k > 2) {
                        const rest = order.slice(k + 1).sort((a, b) => d[b] - d[a]);
                        order.length = k + 1; order.push(...rest);
                    }
                }
            }
            odds.push({ e, p });
        }
        _trapOddsCache = { key, base, odds };
        return odds;
    }
    // what a trap's hit is worth on enemy `e`: the same worth the CPU gives a cast that lands that hit and that status
    // (scoreOffensiveHit: the damage, the kill, the status's denial + the combo it sets up, the target's priority)
    function _trapHitOn(g, unit, spell, e, v) {
        const sts = spell.trapType === 'spike' ? [{ id: 'root', duration: 2 }]
            : ((spell.statusEffects && spell.statusEffects.length) ? spell.statusEffects
                : (spell.trapType === 'trapdoor' ? [{ id: 'stagger', duration: 1 }] : []));
        const hitSp = Object.assign({}, spell, { statusEffects: sts.map(s => Object.assign({ chance: 1 }, s)) });
        let val = 0;
        const _kt = _killTally; _killTally = null;   // a maybe-later kill never joins this turn's wipeout tally
        try { val = scoreOffensiveHit(g, unit, e, hitSp, v, {}).val || 0; } catch (q) { val = 0; } finally { _killTally = _kt; }
        return val;
    }
    // expected worth of a trap laid on `tiles` (its footprint)
    function _trapPlanValue(g, unit, spell, tiles, v) {
        if (!tiles || !tiles.length) return 0;
        const odds = _trapEnemyOdds(g, unit, v);
        if (!odds.length) return 0;
        const W = g.bw();
        const eachTile = spell.trapType !== 'trapdoor' && tiles.length > 1;   // a spike patch: every tile springs on its own
        let ev = 0, sumP = 0, miss = 1;
        for (const { e, p } of odds) {
            // the walk stops on the first tile it crosses: squares at the same walked distance are separate routes
            // (they add up), squares further down the same route mostly repeat the same walk
            let best = 0, sum = 0;
            for (const t of tiles) { const q = p[t.x + t.y * W] || 0; sum += q; if (q > best) best = q; }
            if (!(sum > 0)) continue;
            const pu = Math.min(0.95, best + 0.45 * (sum - best));
            const hit = _trapHitOn(g, unit, spell, e, v);
            if (!(hit > 0)) continue;
            ev += pu * hit; sumP += pu; miss *= (1 - pu);
        }
        if (!(ev > 0)) return 0;
        if (!eachTile && sumP > 0) ev *= Math.min(1, (1 - miss) / sumP);   // one spring per trap
        return ev * wght(g, 'trapPlanDiscount_v1', 0.85);   // it lands next turn at the soonest (0.85, trained)
    }
    // the caster's trap groups of this trap type, oldest first (the engine's cap counts groups, battle.js placeTrap)
    function _ownTrapGroups(g, unit, spell) {
        const groups = new Map();
        for (const t of (g.state.traps || [])) {
            if (t.casterUnitId !== unit.id || t.trapType !== (spell.trapType || 'spike')) continue;
            const k = t.groupId || ('t' + t.x + ',' + t.y);
            if (!groups.has(k)) groups.set(k, []);
            groups.get(k).push({ x: t.x, y: t.y });
        }
        return [...groups.values()];
    }
    function _trapFootTiles(g, spell, x, y, unit) {
        const sz = spell.trapSize || 1;
        if (typeof g._trapFootprint === 'function') {
            const fp = g._trapFootprint(x, y, sz, unit);
            return (!fp || fp.problem) ? null : fp.tiles;
        }
        if (typeof g._placeTrapProblem === 'function' ? g._placeTrapProblem(x, y, unit) : g.unitAt(x, y)) return null;
        return sz > 1 ? null : [{ x, y }];
    }
    // THE CONTACT TRAP (mondo 2026-11-01): the grounded enemies standing on a footprint spring it inside the cast
    function _trapContactVictims(g, unit, tiles) {
        const out = [];
        for (const t of tiles || []) {
            const o = g.unitAt(t.x, t.y);
            if (!o || o.dead || o.player === unit.player) continue;
            try { if (typeof g.isUnitAirborne === 'function' && g.isUnitAirborne(o)) continue; } catch (e) {}
            out.push({ u: o, t });
        }
        return out;
    }
    // a placement's worth: the new trap (laid under an enemy: the hit it lands now), less the oldest one the cap lifts
    function _trapPlacementValue(g, unit, spell, x, y, v) {
        let tiles = _trapFootTiles(g, spell, x, y, unit);
        if (!tiles) return 0;
        let val = 0;
        const vis = new Set((v.visibleEnemies || []).map(e => e.id));
        const contact = _trapContactVictims(g, unit, tiles).filter(c => vis.has(c.u.id));
        if (contact.length) {
            const door = spell.trapType === 'trapdoor';
            const hit = door && !spell.trapHitsAll ? contact.slice(0, 1) : contact;
            for (const c of hit) val += _trapHitOn(g, unit, spell, c.u, v);
            // a trapdoor drops whole; a spike patch keeps its other tiles hidden
            tiles = door ? [] : tiles.filter(t => !contact.some(c => c.t === t));
        }
        if (tiles.length) val += _trapPlanValue(g, unit, spell, tiles, v);
        if (!(val > 0)) return 0;
        const groups = _ownTrapGroups(g, unit, spell);
        if (groups.length >= (spell.maxActivePerCaster || 2)) val -= _trapPlanValue(g, unit, spell, groups[0], v) * 1.2;
        return Math.max(0, val);
    }

    /* THE TRAP PLAN: since 2026-11-01 (mondo) a trap on empty tiles is a setup placement (1 AP, the turn goes on), so a
       unit lays it and still walks / hits. With the LAST AP, a trap that pays its MP and the square's danger beats a
       plain walk toward the goal. */
    function _trapAfterWalk(g, unit, cands) {
        if (window.EW_AI_NO_TRAP_PLAN) return;
        const one = g.AP_COST_ACTION || 1;
        let top = null;
        for (const c of cands) if (!top || c.score > top.score) top = c;
        /* the LAST action of the turn: a plain walk toward the goal (no hit after it, no hazard to leave, no Key to search)
           buys a few squares; a trap that pays its MP and the square's danger on the enemy's predicted walk is the better
           use of the AP. */
        if ((unit.ap || 0) < 2 * one) {
            if (window.EW_AI_NO_TRAP_LASTAP) return;
            if (!top || top._objectiveWin || top.type !== 'move' || !top._intent || top._joint || top._jump) return;
            let trap = null;
            for (const c of cands) if (c.type === 'spell' && c.spell && c.spell.kind === 'placeTrap' && c.score > 0 && (!trap || c.score > trap.score)) trap = c;
            if (trap) { trap.score = top.score + 0.01; trap._lastAp = true; }
            return;
        }
    }

    // Value of the status riders on an offensive/utility cast.
    function statusRiderValue(g, unit, tg, spell, v) {
        let val = 0;
        for (const eff of (spell.statusEffects || [])) {
            if (!eff || !eff.id) continue;
            const p = Math.max(0.05, Math.min(0.95, eff.chance != null ? eff.chance : 0.9));
            val += p * (ccDenialValue(g, unit, tg, eff.id, eff.duration || 1, v)
                      + statusSetupValue(g, unit, tg, eff.id, v, false, { spell, dur: eff.duration || 1 }));
        }
        if (spell.statStageBoost) {
            // offensive casts carrying stat DEBUFF stages — bound-aware: a
            // stat already ground to the ruler floor contributes nothing.
            let stages = 0;
            for (const k of Object.keys(spell.statStageBoost)) {
                stages += Math.abs(stageRoom(g, tg, k, spell.statStageBoost[k] || 0));
            }
            val += stages * 0.12 * unitThreatOutput(g, tg, unit);
        }
        return val;
    }

    /* 2026-08-29 stat rework: stages are ±20 on the shared 0-100 ruler with
       NO stage-count cap — the EFFECTIVE stat saturates at 100 / its floor
       (1 for spd, 0 otherwise) instead. This returns how many of `n`
       requested stages would actually move the target's stat, so the AI
       never spends a cast buffing a stat already at 100 or debuffing one at
       the floor (the engine's apply-time clamp makes those literal no-ops). */
    function stageRoom(g, tg, k, n) {
        if (!n || !tg) return 0;
        // the engine's own clamp (battle.js statStageRoom: the current ruler + the unit's level growth)
        if (g.statStageRoom) { try { return g.statStageRoom(tg, k, n) || 0; } catch (e) {} }
        const base = (k === 'int' ? (tg.intStat != null ? tg.intStat : tg.int) : tg[k]) || 0;
        let cur = 0;
        try { cur = g.getStatStageCount ? (g.getStatStageCount(tg, k) || 0) : 0; } catch (e) {}
        const step = 20;
        const lo = Math.min(k === 'spd' ? 1 : 0, base);
        const hi = Math.max(100, base);
        const now = Math.max(lo, Math.min(hi, base + cur * step));
        if (n > 0) return Math.min(n, Math.ceil(Math.max(0, hi - now) / step));
        return -Math.min(-n, Math.ceil(Math.max(0, now - lo) / step));
    }

    // Value of buff stages on ally `tg`.
    /* THE DEAD SLOTS (2026-10-25): a friendly status (Indomitable, Pep Talk, Extended Clips, regen, haste…) was a flat
       +35, less than the MP of any tier 2+ cast (the tier ladder: 50 / 75 / 100 MP), so those buffs never paid for
       themselves and were never cast. Worth a share of what the wearer deals per turn over the rounds it lasts. */
    function _friendlyStatusValue(g, unit, tg, eff, v) {
        if (!eff || !eff.id || !tg || tg.dead) return 0;
        try { if (g.unitHasStatus(tg, eff.id)) return 0; } catch (e) {}
        const dur = Math.min(Math.max(1, eff.duration || 1), 3);
        return 20 + 0.15 * dur * unitThreatOutput(g, tg, v.closestEnemy || null);
    }
    function buffStageValue(g, unit, tg, spell, v) {
        let boost = spell.statStageBoost || {};
        /* THE SPELL AUDIT D: the conditional stages — Hellfire Crown's stageHigherOf (the axis the target uses),
           Sad Backstory's stageIfBelowPct (the bigger boost under the threshold) */
        if (spell.stageHigherOf) {
            const physKit = (tg.atk || 0) >= (tg.intStat || tg.int || 0);
            boost = Object.assign({}, boost, { [physKit ? 'atk' : 'int']: spell.stageHigherOf.n || 1 });
        }
        if (spell.stageIfBelowPct && spell.stageIfBelowPct.boost && (tg.hp / (tg.maxHp || 1)) < (spell.stageIfBelowPct.pct || 0.5)) {
            boost = spell.stageIfBelowPct.boost;
        }
        const output = unitThreatOutput(g, tg, unit);
        let val = 0;
        const horizon = AI_TUNE.buffTurnsHorizon;
        for (const k of Object.keys(boost)) {
            // Bound-aware headroom replaces the old ">= 5 stages is wasted"
            // check: only the stages that would actually land are credited.
            const stages = Math.abs(stageRoom(g, tg, k, boost[k] || 0));
            if (!stages) continue;
            if (k === 'atk' || k === 'int') {
                // only credit the axis the recipient actually uses
                const physKit = (tg.atk || 0) >= (tg.intStat || tg.int || 0);
                const axisFits = (k === 'atk') === physKit;
                val += stages * tuneW(g, 'buffStageFactor') * output * horizon * (axisFits ? 1 : 0.25);
            } else if (k === 'def' || k === 'mdef') {
                // one stage = 20 flat armor since the rework (was 9) — ~2.2×
                // the old per-stage soak, priced accordingly.
                val += stages * 65 * horizon * 0.5;
            } else {
                // spd stages now shift movement bands AND initiative AND
                // evasion — worth more than the old 3-point spd step.
                val += stages * 35;
            }
        }
        return val;
    }

    /* ═══ THE INNER PEACE (2026-11-01, the AI gap list: "Inner Peace ignores its +1 M.DEF and only scores when the
       ally has a debuff; it scored 0 in 280 chances"). Inner Peace (kind cleanse) removes EVERY debuff on one ally
       (doSpell: each STATUS_DEFS kind 'debuff' on the target) and raises its M DEF by 1 stage; the engine lets it be
       cast on an ally with nothing to cleanse while the stage has room to rise (battle.js spellTargetUsableOn). The old
       scorer read a hand list of 17 debuffs (Gooed, Drowning, Soaked, Wither… scored 0) and never the stage, and the
       old target pick only looked at allies carrying one of 10 debuffs. Now: every debuff the cast would lift is worth
       what it costs the wearer (the old tiers, 35 for any other debuff), plus the M DEF stage priced like a buff's
       (buffStageValue, x0.25 with no enemy within 10, the buff rule), aimed at whichever ally in reach is worth most.
       Kill-switch: window.EW_AI_OLD_CLEANSE. ═══ */
    const _CLEANSE_HARD = new Set(['stun', 'sleep', 'freeze', 'frozen', 'silence', 'charm']);
    const _CLEANSE_MID = new Set(['slow', 'root', 'stagger', 'jammed', 'blind', 'confuse', 'broken']);
    const _CLEANSE_DOT = new Set(['poison', 'burn', 'discord', 'marked', 'glare', 'hexed']);
    function _oldCleanseScore(g, unit, target, v) {
        let s = 0;
        for (const e of (target.statusEffects || [])) {
            if (!e || !e.id) continue;
            if (_CLEANSE_HARD.has(e.id)) s += 0.6 * unitThreatOutput(g, target, v.closestEnemy || unit);
            else if (_CLEANSE_MID.has(e.id)) s += 70;
            else if (_CLEANSE_DOT.has(e.id)) s += 50;
        }
        if (s <= 0) return 0;
        if ((target.hourglasses || 0) > 0) s += 60;
        return s;
    }
    function _debuffKeysOn(g, tg) {
        const defs = (typeof STATUS_DEFS !== 'undefined') ? STATUS_DEFS : (g.STATUS_DEFS || {});
        let keys = [];
        try {
            if (typeof getActiveStatusKeys === 'function') keys = getActiveStatusKeys(tg) || [];
            else keys = Object.keys(tg.status || {}).filter(k => tg.status[k] > 0);
        } catch (e) { keys = []; }
        return keys.filter(k => defs[k] && defs[k].kind === 'debuff');
    }
    function _cleanseValue(g, unit, spell, target, v) {
        if (!target || target.dead || target.player !== unit.player) return 0;
        let lift = 0;
        for (const k of _debuffKeysOn(g, target)) {
            if (_CLEANSE_HARD.has(k)) lift += 0.6 * unitThreatOutput(g, target, v.closestEnemy || unit);
            else if (_CLEANSE_MID.has(k)) lift += 70;
            else if (_CLEANSE_DOT.has(k)) lift += 50;
            else lift += 35;
        }
        let stage = 0;
        if (spell.statStageBoost) {
            stage = buffStageValue(g, unit, target, spell, v);
            if (!v.visibleEnemies.some(e => _dist(g, target.x, target.y, target.z, e) <= 10)) stage *= 0.25;
            /* M DEF only blunts magic: x0.4 against an all-physical enemy side, x1.6 against all casters */
            if (spell.statStageBoost.mdef && !spell.statStageBoost.def && v.visibleEnemies.length) {
                const mag = v.visibleEnemies.filter(e => (e.intStat || e.int || 0) > (e.atk || 0)).length;
                stage *= 0.4 + 1.2 * (mag / v.visibleEnemies.length);
            }
        }
        let s = lift + stage;
        if (s <= 0) return 0;
        if (lift > 0 && (target.hourglasses || 0) > 0) s += 60;
        return s;
    }
    function _pickCleanseTarget(g, unit, spell, v) {
        const R = _effRange(unit, spell) || 3;
        let best = null, bestS = 0;
        for (const a of [unit, ...(v.allies || [])]) {
            if (!a || a.dead || a._dying) continue;
            if (Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) > R) continue;
            try { if (typeof window.spellTargetUsableOn === 'function' && !window.spellTargetUsableOn(unit, spell, a)) continue; } catch (e) {}
            const s = _cleanseValue(g, unit, spell, a, v);
            if (s > bestS) { bestS = s; best = a; }
        }
        return best;
    }

    // ── target priority (currency-denominated) ───────────────────────────
    // Used by the per-kind target pickers to order equally-reachable
    // targets, and as a small additive nudge on offensive candidates.
    function getTargetPriority(target, unit, v) {
        const g = G();
        let priority = 0;

        priority += 0.4 * unitThreatOutput(g, target, unit);      // dangerous first
        if (unitIsHealerKit(target)) priority += 110;             // support core first
        priority += Math.min(90, (target.intStat || target.int || 0) * 0.8);

        // Team focus + invested damage: convert pokes into kills.
        if (v && v.focus && target.id === v.focus.id) priority += tuneW(g, 'focusCommitBonus');
        const dmgLog = getTeamDamageLog();
        const priorDmg = dmgLog[target.id] || 0;
        if (priorDmg > 0) {
            priority += 40;
            if (target.hp <= priorDmg + 20) priority += 60;
        }
        priority += tuneW(g, 'woundedPileOn') * Math.max(0, (target.maxHp || 0) - (target.hp || 0)) * 0.35;
        const hpPct = target.hp / (target.maxHp || 1);
        if (hpPct < 0.25) priority += 50;
        else if (hpPct < 0.5) priority += 25;

        if ((target.hourglasses || 0) > 0) priority += AI_TUNE.hourglassTargetBonus + target.hourglasses * 10 + _keyCarrierDenial(g, target) * 0.5;

        const _mpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
        const _modeId = _mpMode ? _mpMode.id : 'arena';
        // Arena bounty: an ON FIRE enemy is worth 15..35 extra points dead.
        if (_modeId === 'arena') priority += arenaBountyPts(target) * wght(g, 'bountyKillBonus_v1', ARENA_PT_VALUE) * 0.5;
        if (_modeId === 'ctf' && g.state.flags) {
            const ownFlag = g.state.flags[unit.player];
            if (ownFlag && ownFlag.carriedBy === target.id) priority += 250;
        }

        if (g.unitHasStatus(target, 'marked')) priority += AI_TUNE.markedTargetBonus;
        if (g.unitHasStatus(target, 'stun')) priority -= 35;      // already denied

        // Provoke: the engine hard-gates single-target actions onto the
        // taunter — bend the whole plan the same way instead of fighting it.
        if (typeof g.getTauntTargeter === 'function') {
            const _taunter = g.getTauntTargeter(unit);
            if (_taunter) {
                if (target.id === _taunter.id) priority += 800;
                else priority -= 600;
            }
        }
        // THE SPELL AUDIT D: Provoked by a decoy (Stuffed Double) — unit targets sink; the straw is scored in the object list
        if (typeof g.getTauntDecoy === 'function' && g.getTauntDecoy(unit)) priority -= 400;

        // Acts-soon: denying a unit that moves before our next activation
        // is worth more than one that just went.
        const turnOrder = g.blitzTurnOrderIds || [];
        const myIdx = turnOrder.indexOf(unit.id);
        const targetIdx = turnOrder.indexOf(target.id);
        if (myIdx >= 0 && targetIdx > myIdx && (targetIdx - myIdx) <= 3) priority += 30;

        return priority;
    }

    // ═════════════════════════════════════════════════════════════════════
    // PERCEPTION — vision (fog-true), win state, threat field, team focus.
    // ═════════════════════════════════════════════════════════════════════

    function buildVision(unit) {
        const g = G();
        const player = unit.player;

        const prevTeamVision = g.state.teamVision;
        g.state.teamVision = true;
        const visTiles = g.computeVisibleTiles(player);
        g.state.teamVision = prevTeamVision;

        const visibleEnemies = g.getHostileUnits(player)
            .filter(e => !(g.unitHasStatus(e, 'invisible') && !g.unitHasStatus(e, 'marked')))
            .filter(e => !(typeof g.isUnitConcealedFrom === 'function' && g.isUnitConcealedFrom(e, player)))
            .filter(e => visTiles.has(g.posKey(e.x, e.y)));
        _aiNoteSightings(g, player, visibleEnemies, visTiles);

        const allies = g._isFFA()
            ? []
            : g.aliveUnitsFor(player).filter(a => a.id !== unit.id
                && !(g.unitHasStatus && g.unitHasStatus(a, 'captured')));   // 🚪 a HELD ally is in the void: no heal, no buff, no formation

        const visibleHourglasses = (g.state.hourglasses || []).filter(h =>
            h.carriedBy === null && h.visibleTo[player]
        );

        let closestEnemy = null;
        let closestEnemyDist = Infinity;
        for (const e of visibleEnemies) {
            const d = _dist(g, unit.x, unit.y, unit.z, e);
            if (d < closestEnemyDist) { closestEnemyDist = d; closestEnemy = e; }
        }

        const effRange = g.getEffectiveRange(unit);
        const attackTargets = visibleEnemies.filter(e => {
            const d = _dist(g, unit.x, unit.y, unit.z, e);
            if (_aiVisionOn() && typeof g.isInVision === 'function' && !g.isInVision(unit, e.x, e.y, e.z ?? null)) return false;   // 👁 Blind / Jammed: its own eyes only
            return d >= 1 && d <= effRange && !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y);
        });

        const enemyTower = g.state.towers ? g.state.towers[g.enemyOf(player)] : null;
        const ownTower = g.state.towers ? g.state.towers[player] : null;

        const tactical = assessTactical(unit, visibleEnemies, allies);
        const winState = assessWinCondition(unit, ownTower, enemyTower);

        // Real-damage threat field: per-enemy best single-action damage on
        // THIS unit, probed per tile by reach. Built once per decision.
        const threatFn = makeThreatFn(g, unit, visibleEnemies);

        const v = {
            visTiles, visibleEnemies, allies,
            visibleHourglasses, closestEnemy, closestEnemyDist,
            attackTargets, enemyTower, ownTower, effRange, tactical,
            player, winState, threatFn, focus: null
        };
        v.focus = pickTeamFocus(g, unit, v);
        return v;
    }

    // Threat = how much REAL damage the enemy team could put on `unit` at
    // a tile next activation (engine damage pipeline, armor and type chart
    // included — a tile that reads "safe" to a Warrior can be lethal for a
    // squishy caster and vice versa).
    /* ═══ THE ENEMY READ (2026-11-01, mondo: "fix all of those"). The threat field said an enemy reached every square
       within move + range in straight squares (through walls), counted its spells on cooldown and counted a stunned,
       frozen or sleeping enemy. Now: the reach is the enemy's REAL walk (getMoveTiles, the engine's own path search,
       read as a full fresh move) plus the reach of its longest hit from any square of it; a spell still cooling down
       at its next turn and a body that loses its next turn do not count. Kill-switch: window.EW_AI_OLD_THREAT. ═══ */
    let _reachCache = { round: -1, map: new Map() };
    function _enemyWalkSet(g, e) {
        const r = g.state.round || 0;
        if (_reachCache.round !== r) _reachCache = { round: r, map: new Map() };
        const key = e.id + '@' + e.x + ',' + e.y + ',' + (e.z ?? 0);
        if (_reachCache.map.has(key)) return _reachCache.map.get(key);
        let tiles = null;
        const mtt = e.movesThisTurn;
        try {
            e.movesThisTurn = 0;   // its NEXT turn's walk, whatever it spent this one
            tiles = (typeof g.getMoveTiles === 'function') ? g.getMoveTiles(e) : null;
        } catch (q) { tiles = null; } finally { e.movesThisTurn = mtt; }
        const out = tiles ? [{ x: e.x, y: e.y, z: e.z }].concat(tiles.map(t => ({ x: t.x, y: t.y, z: t.z }))) : null;
        if (_reachCache.map.size > 200) _reachCache.map = new Map();
        _reachCache.map.set(key, out);
        return out;
    }
    function _enemyLosesTurn(g, e) {
        try { return ['stun', 'frozen', 'sleep', 'freeze'].some(id => g.unitHasStatus(e, id)); } catch (q) { return false; }
    }
    function _spellReadyForEnemy(e, sp) {
        if (typeof getSpellCooldownRemaining !== 'function') return true;
        let rem = 0;
        try { rem = getSpellCooldownRemaining(e, sp) || 0; } catch (q) { rem = 0; }
        if (!(rem > 0)) return true;
        let acted = false;
        try { acted = typeof unitFinished === 'function' && unitFinished(e); } catch (q) {}
        return acted ? rem <= 1 : false;   // it acts next round: a 1-round cooldown is off by then
    }
    /* ═══ THE WAY IN (2026-11-01, the AI gaps Batch B, gap 8: "the danger read only knows enemy walks"). An enemy's next
       turn is two AP: a walk and a hit, or ONE other way in and a hit: its Jump (getJumpTiles, once a turn), a Sprint or
       any dash that only moves, a self Teleport / blink, an escape it aims (THE ESCAPE PICK), a Grapple reel. Each is
       read from where it stands with the engine's own lists (the same squares the player's menu lights), paid for (MP,
       off cooldown by its turn, not silenced) and added to the squares it may hit from. Never compounded with the walk:
       walk + Sprint + hit is three AP. Kill-switch: window.EW_AI_NO_MOBILE_THREAT. ═══ */
    let _mobOrigCache = { round: -1, map: new Map() };
    function _enemyMobileOrigins(g, e) {
        if (window.EW_AI_NO_MOBILE_THREAT) return [];
        if (typeof _isClashMode === 'function' && _isClashMode()) return [];
        const r = g.state.round || 0;
        if (_mobOrigCache.round !== r) _mobOrigCache = { round: r, map: new Map() };
        const key = e.id + '@' + e.x + ',' + e.y + ',' + (e.z ?? 0) + '|' + (e.mp || 0);
        if (_mobOrigCache.map.has(key)) return _mobOrigCache.map.get(key);
        const out = [], seen = new Set([e.x + ',' + e.y]);
        const add = (t) => {
            if (!t || t.x == null) return;
            const k = t.x + ',' + t.y;
            if (seen.has(k)) return;
            seen.add(k);
            out.push({ x: t.x, y: t.y, z: t.z });
        };
        // the Jump (one a turn: its next turn's, whatever it did this one)
        if (_aiCanEverJump(g, e)) {
            const jt = e._jumpedThisTurn;
            try { e._jumpedThisTurn = false; for (const t of (g.getJumpTiles(e) || [])) add(t); } catch (q) {} finally { e._jumpedThisTurn = jt; }
        }
        let silenced = false;
        try { silenced = g.unitHasStatus(e, 'silence'); } catch (q) {}
        if (!silenced) {
            const W = typeof window !== 'undefined' ? window : {};
            const open = (t) => t && !(g.unitAt(t.x, t.y)) && (typeof g.isTerrainPassable !== 'function' || g.isTerrainPassable(t.x, t.y));
            for (const sp of (e.spells || [])) {
                if (!sp) continue;
                const dash = sp.kind === 'dash' && typeof W.dashOnlyMoves === 'function' && W.dashOnlyMoves(sp);
                const blink = sp.kind === 'teleport' && !sp.prismBlink && !sp.onlyTerrain;
                const esc = sp.kind === 'escape';
                const reel = typeof W.isGrappleReel === 'function' && W.isGrappleReel(sp);
                if (!dash && !blink && !esc && !reel) continue;
                if ((e.mp || 0) < _mpCost(e, sp) || !_spellReadyForEnemy(e, sp)) continue;
                try {
                    if (blink) {
                        if (typeof getTeleportLandingReach === 'function') for (const t of (getTeleportLandingReach(e, sp) || [])) if (open(t)) add(t);
                    } else if (esc) {
                        if (typeof W.escapeLandingTiles === 'function') for (const t of (W.escapeLandingTiles(e, sp) || [])) if (open(t)) add(t);
                    } else {
                        const tiles = (g.TargetQuery && g.TargetQuery.spellTiles) ? (g.TargetQuery.spellTiles(e, sp) || []) : [];
                        for (const t of tiles) {
                            if (reel) add(W.grappleLandingFor ? W.grappleLandingFor(e, t.x, t.y, { viewer: e.player }) : null);
                            else if (open(t)) add(t);
                        }
                    }
                } catch (q) {}
            }
        }
        if (_mobOrigCache.map.size > 200) _mobOrigCache.map = new Map();
        _mobOrigCache.map.set(key, out);
        return out;
    }
    /* THE SIGHT LINE (the same gap): a basic attack and every spell but the ones that ignore it (ignoresLineOfSight, the
       arcing 'delayed' kind) need a clear line (map.js isRangeBlockedByTerrain, the gate doAttack / doSpell use). The mask
       marked every square within reach of any square the enemy can stand on, through walls. Now a square past the first
       ring counts only when some square it can stand on SEES it (the first ring is point-blank, as in the engine, and
       now includes the diagonals: reach 1 is the eight squares round it, combatDist's own metric). Capped per enemy for
       the weak PC (past the cap a square counts, the old read). Kill-switch: window.EW_AI_NO_THREAT_LOS. ═══ */
    let _maskCache = { round: -1, map: new Map() };
    function _enemyHitMask(g, e, origins, rLos, rFree, W, H) {
        const r = g.state.round || 0;
        if (_maskCache.round !== r) _maskCache = { round: r, map: new Map() };
        const losOn = !window.EW_AI_NO_THREAT_LOS && typeof g.isRangeBlockedByTerrain === 'function';
        const key = e.id + '@' + e.x + ',' + e.y + ',' + (e.z ?? 0) + '|' + rLos + '|' + rFree + '|' + origins.length + '|' + (losOn ? 1 : 0);
        if (_maskCache.map.has(key)) return _maskCache.map.get(key);
        const mask = new Uint8Array(W * H);
        const R = Math.max(1, rLos | 0, rFree | 0);
        const pending = [];
        const pend = new Uint8Array(W * H);
        for (const o of origins) {
            for (let dy = -R; dy <= R; dy++) {
                const y = o.y + dy;
                if (y < 0 || y >= H) continue;
                const ady = Math.abs(dy);
                for (let dx = -R; dx <= R; dx++) {
                    const adx = Math.abs(dx);
                    const ring = adx <= 1 && ady <= 1;
                    const d = adx + ady;
                    if (!ring && d > R) continue;
                    const x = o.x + dx;
                    if (x < 0 || x >= W) continue;
                    const idx = x + y * W;
                    if (mask[idx]) continue;
                    if (ring || d <= rFree || !losOn) { mask[idx] = 1; continue; }
                    if (d <= rLos && !pend[idx]) { pend[idx] = 1; pending.push(idx); }
                }
            }
        }
        let budget = 5000;
        for (const idx of pending) {
            if (mask[idx]) continue;
            if (budget <= 0) { mask[idx] = 1; continue; }
            const cx = idx % W, cy = (idx / W) | 0;
            for (const o of origins) {
                if (Math.abs(o.x - cx) + Math.abs(o.y - cy) > rLos) continue;
                if (--budget < 0) { mask[idx] = 1; break; }
                let blocked = false;
                try { blocked = !!g.isRangeBlockedByTerrain(o.x, o.y, cx, cy, o.z); } catch (q) { blocked = false; }
                if (!blocked) { mask[idx] = 1; break; }
            }
        }
        if (_maskCache.map.size > 200) _maskCache.map = new Map();
        _maskCache.map.set(key, mask);
        return mask;
    }
    function makeThreatFn(g, unit, enemies) {
        const info = [];
        const W = g.bw(), H = g.bh();
        const oldWay = !!window.EW_AI_OLD_THREAT;
        for (const e of enemies) {
            if (isProtected(g, e)) continue;
            if (!oldWay && _enemyLosesTurn(g, e)) continue;
            let er = 1, em = 2;
            try { er = g.getEffectiveRange(e) || (e.range || 1); } catch (q) { er = e.range || 1; }
            try { em = g.getEffectiveMove(e) || (e.move || 2); } catch (q) { em = e.move || 2; }
            let dmg = estDamage(g, e, unit, null);
            let bestR = er, rLos = er, rFree = 0;
            let silenced = false;
            try { silenced = g.unitHasStatus(e, 'silence'); } catch (q) {}
            if (!silenced) {
                for (const sp of (e.spells || [])) {
                    if (!sp || !DMG_KINDS.has(sp.kind)) continue;
                    if ((e.mp || 0) < _mpCost(e, sp)) continue;
                    if (!oldWay && !_spellReadyForEnemy(e, sp)) continue;
                    const d2 = estDamage(g, e, unit, sp);
                    if (d2 > dmg) dmg = d2;
                    let sr = sp.range || 1;
                    try { sr = g.getEffectiveSpellRange(e, sp) || sr; } catch (q) {}
                    if (sr > bestR) bestR = sr;
                    if (sp.ignoresLineOfSight || sp.kind === 'delayed') { if (sr > rFree) rFree = sr; }
                    else if (sr > rLos) rLos = sr;
                }
            }
            // the squares it can hit next turn: every square of its real walk (and of its one other way in), out to the
            // reach of its hits, through a clear sight line (THE WAY IN + THE SIGHT LINE)
            let mask = null;
            const walk = oldWay ? null : _enemyWalkSet(g, e);
            const newRead = walk && W > 0 && H > 0 && !(window.EW_AI_NO_MOBILE_THREAT && window.EW_AI_NO_THREAT_LOS);
            if (newRead) {
                mask = _enemyHitMask(g, e, walk.concat(_enemyMobileOrigins(g, e)), Math.max(1, rLos | 0), rFree | 0, W, H);
            } else if (walk && W > 0 && H > 0) {
                mask = new Uint8Array(W * H);
                const R = Math.max(1, bestR | 0);
                for (const w of walk) {
                    for (let dy = -R; dy <= R; dy++) {
                        const y = w.y + dy;
                        if (y < 0 || y >= H) continue;
                        const span = R - Math.abs(dy);
                        for (let dx = -span; dx <= span; dx++) {
                            const x = w.x + dx;
                            if (x >= 0 && x < W) mask[x + y * W] = 1;
                        }
                    }
                }
            }
            info.push({ e, reach: em + bestR, dmg, mask });
        }
        return (tx, ty, tz) => {
            let total = 0, count = 0;
            for (const i of info) {
                const hit = i.mask ? (tx >= 0 && ty >= 0 && tx < W && ty < H && i.mask[tx + ty * W] === 1)
                    : _dist(g, tx, ty, tz, i.e) <= i.reach;
                if (hit) { total += i.dmg; count++; }
            }
            return { totalDmg: total, count };
        };
    }

    /* ═══ OVERWATCH + THE PUSH THREAT (2026-11-01). A Guarding enemy fires one reaction shot at the first body that
       finishes a move inside its attack range (battle.js checkOverwatchTriggers); the CPU walked into it blind. And it
       ended next to lava / deep water / a 3+ drop with an enemy pusher in reach as if the edge were not there. ═══ */
    function _overwatchCost(g, unit, x, y, z) {
        if (window.EW_AI_NO_OVERWATCH_READ) return 0;
        let cost = 0;
        try {
            for (const e of g.getHostileUnits(unit.player)) {
                if (!e || e.dead || !e._overwatchArmed || !g.unitHasStatus(e, 'guarding')) continue;
                if (typeof isConcealed === 'function' && isConcealed(g, e, unit.player)) continue;
                let er = 1;
                try { er = g.getEffectiveRange(e) || 1; } catch (q) {}
                const d = _dist(g, x, y, z, e);
                if (d < 1 || d > er) continue;
                if (g.isRangeBlockedByTerrain && g.isRangeBlockedByTerrain(e.x, e.y, x, y)) continue;
                const dmg = estDamage(g, e, unit, null);
                cost += Math.min(dmg, effHp(unit));
                if (dmg >= effHp(unit)) cost += tuneW(g, 'killBase');
            }
        } catch (q) {}
        return cost;
    }
    let _pushThreatCache = { key: '', map: new Map() };
    function _pushExposureCost(g, unit, v, x, y) {
        if (window.EW_AI_NO_PUSH_FORECAST || !v || !v.visibleEnemies || !v.visibleEnemies.length) return 0;
        const key = unit.id + '|' + (g.state.round || 0) + '|' + v.visibleEnemies.map(e => e.id + ':' + e.x + ',' + e.y).join(';');
        if (_pushThreatCache.key !== key) {
            // the enemies that can shove next turn (a forced-move spell they can pay for, off cooldown)
            const pushers = v.visibleEnemies.filter(e => !_enemyLosesTurn(g, e) && !(function () { try { return g.unitHasStatus(e, 'silence'); } catch (q) { return false; } })()
                && (e.spells || []).some(sp => sp && _isForcedSpell(sp) && (e.mp || 0) >= _mpCost(e, sp) && _spellReadyForEnemy(e, sp)));
            _pushThreatCache = { key, map: new Map(), pushers };
        }
        const pushers = _pushThreatCache.pushers;
        if (!pushers.length) return 0;
        const pk = x + ',' + y;
        if (_pushThreatCache.map.has(pk)) return _pushThreatCache.map.get(pk);
        let near = false;
        for (const e of pushers) {
            let reach = 6;
            try { reach = (g.getEffectiveMove(e) || 2) + Math.max(...(e.spells || []).filter(sp => sp && _isForcedSpell(sp)).map(sp => (g.getEffectiveSpellRange ? g.getEffectiveSpellRange(e, sp) : sp.range) || 1)); } catch (q) {}
            if (Math.abs(e.x - x) + Math.abs(e.y - y) <= reach) { near = true; break; }
        }
        let worst = 0;
        if (near) {
            const myZ = (typeof g.getHeightAt === 'function') ? g.getHeightAt(x, y) : 0;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                for (let k = 1; k <= 2; k++) {
                    const tx = x + dx * k, ty = y + dy * k;
                    if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) break;
                    let pen = aiHazardPenaltyAt(unit, tx, ty);
                    const fall = _aiFallDmgEst(g, unit, myZ, tx, ty);
                    if (fall > 0) pen += Math.min(fall, effHp(unit));
                    if (pen / k > worst) worst = pen / k;
                    if (typeof g.isTerrainPassable === 'function' && !g.isTerrainPassable(tx, ty)) break;   // a wall stops the shove
                }
            }
        }
        const cost = worst * wght(g, 'pushThreatFactor_v1', 0.35);
        if (_pushThreatCache.map.size > 600) _pushThreatCache.map = new Map();
        _pushThreatCache.map.set(pk, cost);
        return cost;
    }
    /* THE COUNTER (2026-11-01): a melee basic attack from the front or side can be countered (getCounterChance: 12%
       base, Riposte 35%, +15% on a Guarding body, up to 75%; the riposte hits back and eats the press like a whiff). */
    function _counterCost(g, unit, tg) {
        if (window.EW_AI_NO_COUNTER_READ || !tg || typeof getCounterChance !== 'function') return 0;
        try {
            if (_dist(g, unit.x, unit.y, unit.z, tg) !== 1) return 0;
            if (typeof getAttackArc === 'function' && getAttackArc(unit, tg) === 'back') return 0;
            if (_enemyLosesTurn(g, tg)) return 0;
            const ch = getCounterChance(tg) || 0;
            if (!(ch > 0)) return 0;
            const pct = (typeof unitPassiveMax === 'function' && unitPassiveMax(tg, 'counterAtkPct')) || 0.4;
            const raw = estDamage(g, tg, unit, null) * (pct / Math.max(0.1, _basicCoef()));
            let c = Math.min(raw, effHp(unit)) + 35;   // the hit back + the eaten press
            if (raw >= effHp(unit)) c += tuneW(g, 'killBase');
            return ch * c;
        } catch (q) { return 0; }
    }

    // Net cost of ENDING the activation on (x,y): expected incoming damage
    // (fractionally — not everyone shoots at us) plus a death-risk premium
    // when the tile's total threat covers our whole HP bar, plus hazard
    // ground. Subtracted from every candidate by endTileCost() below.
    function tileDangerCost(g, unit, v, x, y, z) {
        const t = v.threatFn(x, y, z);
        let cost = t.totalDmg * tuneW(g, 'threatCostFactor');
        const mine = effHp(unit);
        if (t.totalDmg >= mine && t.count >= 1 && mine > 0) {
            let gift = tuneW(g, 'killBase') + tuneW(g, 'killOutputTurns') * unitThreatOutput(g, unit, v.closestEnemy || unit);
            // Arena: our death hands them a kill's points, and a bounty if we're ON FIRE.
            if (_isArenaMode()) gift += _arenaPts().kill * _ptv(g) + arenaBountyPts(unit) * wght(g, 'bountyKillBonus_v1', ARENA_PT_VALUE);
            // THE TACTICS PASS (2026-10-23): our own last body (or second-to-last) carries the wipeout share the
            // enemy's does in killValue: the side's last unit standing plays to live. Anchor Caution scales it.
            const _own = _wipeoutShare(g, unit);
            if (_own.share) gift += _own.share * wght(g, 'anchorCaution_v1', 0.5);
            // THE KEYS: a carrier's death drops its Keys on its square: our Arena points for them, its Key Charge, our
            // step toward the Keys win (half: they stay on that square, either side can pick them back up), and the
            // denial the killer's side gets (the same price killValue puts on it)
            if (_keySense() && (unit.hourglasses || 0) > 0) gift += _keyWorth(g, unit.player, unit.hourglasses, v) * wght(g, 'keyCarrierCaution_v1', 0.5) + _keyCarrierDenial(g, unit);
            cost += tuneW(g, 'deathRiskFactor') * gift;
        }
        // Fragile units fear crowded pockets more.
        const hpFrac = unit.hp / (unit.maxHp || 1);
        if (hpFrac < 0.4) cost += t.totalDmg * 0.3;
        // A donated kill can erase the deadline lead. Charge exposure in all
        // consumers (joint search, safety moves and final ranking), using only
        // the visible-enemy threat estimate already supplied by vision.
        if (v.winState?.scorePolicy === 'protect_lead') cost *= 1 + 0.25 * v.winState.roundUrgency * (v.winState.scorePlay ?? 1);
        // ANCHOR (the Tactics pass): the unit keeping the team alive / home prices exposure higher.
        if (_tacticOf(unit) === 'anchor') cost *= 1 + 0.6 * wght(g, 'anchorCaution_v1', 0.5);
        cost += aiHazardPenaltyAt(unit, x, y) * 2;
        cost += _zoneTileCost(g, unit, x, y, z);
        cost += _pushExposureCost(g, unit, v, x, y);   // THE PUSH THREAT
        return cost;
    }

    /* THE ZONE TILES (2026-10-29, the training rework: what the AI did not account for). The round end burns every
       grounded body standing in a Nexus zone the OTHER team owns for NEXUS_HOSTILE_DMG_PCT (25%) of its max HP, armour
       ignored, and heals every body in a zone its OWN team owns for NEXUS_HOLD_HEAL_PCT (15%) HP + MP. The AI ended its
       activations on both as if they were any other tile (the 10-28 playtest: the CPU Astronaut burned 363 + 234 in the
       held centre). Now the tile it ends on is charged the burn (the death too, when the burn is lethal) and credited
       the heal it can use. zoneTileValue_v1 scales it (0 = the old blind spot). */
    function _zoneTileCost(g, unit, x, y, z) {
        const w = wght(g, 'zoneTileValue_v1', 1);
        if (!(w > 0) || !unit) return 0;
        try {
            if (typeof g.isUnitAirborne === 'function' && g.isUnitAirborne(unit)) return 0;
            const zones = Object.values(g.state.nexusPoints || {});
            if (g.state.roamingNexus) zones.push(g.state.roamingNexus);
            let cost = 0;
            for (const nex of zones) {
                if (!nex || !nex.owner || !_aiNexContains(nex, x, y, z)) continue;
                const maxHp = unit.maxHp || 1, hp = unit.hp || 0;
                if (nex.owner !== unit.player) {
                    const pct = (typeof NEXUS_HOSTILE_DMG_PCT !== 'undefined') ? NEXUS_HOSTILE_DMG_PCT : 0.25;
                    const dmg = Math.max(1, Math.floor(maxHp * pct));
                    cost += Math.min(dmg, hp);
                    if (dmg >= hp) {
                        let gift = tuneW(g, 'killBase');
                        if (_isArenaMode()) gift += _arenaPts().kill * _ptv(g) + arenaBountyPts(unit) * wght(g, 'bountyKillBonus_v1', ARENA_PT_VALUE);
                        cost += gift;
                    }
                } else {
                    const pct = (typeof NEXUS_HOLD_HEAL_PCT !== 'undefined') ? NEXUS_HOLD_HEAL_PCT : 0.15;
                    const heal = Math.min(Math.max(0, maxHp - hp), Math.floor(maxHp * pct));
                    const mp = Math.min(Math.max(0, (unit.maxMp || 0) - (unit.mp || 0)), Math.floor((unit.maxMp || 0) * pct));
                    cost -= 0.6 * heal + mp * tuneW(g, 'mpValuePerPoint') * 0.6;
                }
                break;
            }
            return cost * w;
        } catch (e) { return 0; }
    }

    /* THE OPPORTUNITY ATTACK (2026-10-29, the training rework): stepping AWAY from an adjacent enemy that can swing
       gives it a 10-70% shot at half its attack (battle.js checkOpportunityAttack: one strike per move, the first
       enemy that rolls it). The AI's moves never priced it. The expected hit is charged to the move (its death too
       when the hit would be lethal); oppAttackCaution_v1 scales it (0 = the old blind spot). */
    function _oppAttackCost(g, unit, tx, ty) {
        const w = wght(g, 'oppAttackCaution_v1', 1);
        if (!(w > 0) || !unit || typeof _oppStrikeCanReach !== 'function' || typeof _oppStrikeDamage !== 'function') return 0;
        try {
            let pNone = 1, exp = 0;
            for (const e of g.getHostileUnits(unit.player)) {
                if (!e || e.dead || Math.abs(e.x - unit.x) > 1 || Math.abs(e.y - unit.y) > 1) continue;
                const oldD = Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y);
                const newD = Math.abs(e.x - tx) + Math.abs(e.y - ty);
                if (newD <= oldD) continue;
                if (typeof isUnitRealmShieldedFrom === 'function' && isUnitRealmShieldedFrom(unit, e)) continue;
                if (!_oppStrikeCanReach(e, unit.x, unit.y, unit.z ?? 0)) continue;
                let ch = 0.3;
                try {
                    const spd = (typeof getEffectiveSpd === 'function') ? (getEffectiveSpd(e) - getEffectiveSpd(unit)) : 0;
                    const vis = (typeof getEffectiveVision === 'function') ? ((getEffectiveVision(e) || 0) - (getEffectiveVision(unit) || 0)) : 0;
                    ch = Math.min(0.70, Math.max(0.10, 0.30 + spd * 0.003 + vis * 0.03));
                    const sc = (typeof unitPassiveValue === 'function') ? unitPassiveValue(e, 'oppAttackChance') : undefined;
                    if (sc != null) ch = Math.max(ch, Math.min(1, sc));
                } catch (q) {}
                const mult = ((typeof unitPassiveValue === 'function') ? unitPassiveValue(e, 'oppAttackMult') : undefined) || 1;
                const dmg = _oppStrikeDamage(e, unit, mult);
                let val = Math.min(dmg, unit.hp || 0);
                if (dmg >= (unit.hp || 0)) val += tuneW(g, 'killBase') + (_isArenaMode() ? _arenaPts().kill * _ptv(g) : 0);
                exp += pNone * ch * val;
                pNone *= (1 - ch);
            }
            return exp * w;
        } catch (e) { return 0; }
    }

    // ── Shared team focus target (commitment beats dithering) ────────────
    // Prefer the enemy the TEAM can actually DELETE this round (burst ≥
    // effective HP) — kills are the points; wounded survivors get healed
    // back up. Healers and big casters break ties.
    function pickTeamFocus(g, unit, v) {
        const st = g.state;
        const enemies = v.visibleEnemies;
        if (!enemies.length) { st._aiFocusId = null; return null; }

        const cur = enemies.find(u => u.id === st._aiFocusId);
        if (cur) return cur;

        const team = g.state.units.filter(u => u.player === unit.player && !u.dead && u.hp > 0);
        const cx = team.reduce((s, u) => s + u.x, 0) / (team.length || 1);
        const cy = team.reduce((s, u) => s + u.y, 0) / (team.length || 1);
        const burst = new Map();
        for (const en of enemies) {
            let b = 0;
            for (const al of team) b += unitThreatOutput(g, al, en);
            burst.set(en.id, b);
        }
        const scored = enemies.map(en => {
            let s = -effHp(en);
            if ((burst.get(en.id) || 0) >= effHp(en)) s += 500;    // team can kill it NOW
            if (unitIsHealerKit(en)) s += 260;
            s += Math.min(180, (en.intStat || en.int || 0) * 1.5);
            s -= (Math.abs(en.x - cx) + Math.abs(en.y - cy)) * 22;  // near the team
            return { en, s };
        }).sort((a, b) => b.s - a.s);
        st._aiFocusId = scored[0].en.id;
        return scored[0].en;
    }

    function assessWinCondition(unit, ownTower, enemyTower) {
        const g = G();
        const player = unit.player;
        const isFFA = g._isFFA();
        const enemy = isFFA ? null : g.enemyOf(player);

        const myHG = typeof g.getKeysToWin === 'function'
            ? (g.state.hourglasses || []).filter(h => h.carriedBy != null && (isFFA
                ? h.carriedBy === unit.id : g.state.units.find(u => u.id === h.carriedBy)?.player === player)).length
            : isFFA
            ? (unit.hourglasses || 0)
            : g.state.units.filter(u => u.player === player && !u.dead)
                .reduce((s, u) => s + (u.hourglasses || 0), 0);
        const enemyHG = typeof g.getKeysToWin === 'function'
            ? (g.state.hourglasses || []).filter(h => h.carriedBy != null && (isFFA
                ? h.carriedBy !== unit.id : g.state.units.find(u => u.id === h.carriedBy)?.player === enemy)).length
            : isFFA
            ? g.state.units.filter(u => u.id !== unit.id && !u.dead)
                .reduce((s, u) => s + (u.hourglasses || 0), 0)
            : g.state.units.filter(u => u.player === enemy && !u.dead)
                .reduce((s, u) => s + (u.hourglasses || 0), 0);
        // Match the engine's current registry and mode threshold, not stale spawn metadata.
        const hgTarget = typeof g.getKeysToWin === 'function' ? g.getKeysToWin() : (g.state.hourglassTarget || 5);

        const ownTowerPct = ownTower && ownTower.maxHp > 0 ? ownTower.hp / ownTower.maxHp : 1;
        const enemyTowerPct = enemyTower && enemyTower.maxHp > 0 ? enemyTower.hp / enemyTower.maxHp : 1;

        const myAlive = isFFA ? 1 : g.aliveUnitsFor(player).length;
        const enemyAlive = isFFA
            ? g.state.units.filter(u => !u.dead && u.id !== unit.id).length
            : g.aliveUnitsFor(enemy).length;

        const deadEnemies = isFFA
            ? g.state.units.filter(u => u.id !== unit.id && u.dead)
            : g.state.units.filter(u => u.player === enemy && u.dead);
        const enemyDeadCount = deadEnemies.length;
        const enemyMinRespawn = deadEnemies.reduce((min, u) => {
            const r = typeof u._respawnIn === 'number' ? u._respawnIn : 99;
            return Math.min(min, r);
        }, 99);
        const enemyImminentRespawns = deadEnemies.filter(u =>
            typeof u._respawnIn === 'number' && u._respawnIn <= 1
        ).length;

        const round = g.state.round || 0;
        const mode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
        // Match the engine's clock override / mode fallback. Count the current
        // round as playable: expiry occurs when round > roundLimit.
        const roundLimit = g.state.matchClock?.roundLimit || mode?.roundLimit || 0;
        const roundsRemaining = roundLimit > 0 && !g.state.suddenDeathActive
            ? Math.max(0, roundLimit - round + 1) : null;
        // Urgency is deadline pressure, not a claim that our team is winning.
        // Unlimited modes have none; sudden death is immediately decisive.
        const roundUrgency = g.state.suddenDeathActive ? 3 : roundLimit <= 0 ? 0
            : roundsRemaining <= 1 ? 3 : round / roundLimit >= 0.9 ? 2
            : round / roundLimit >= 0.75 ? 1 : 0;

        // TDM and Simul expire on matchKills, not alive counts, damage or
        // matchScores. FFA and Arena have different resolution contracts.
        const teamKillMode = !isFFA && (mode?.id === 'tdm' || mode?.id === 'simul');
        // Arena (2026-10-06 rules): after roundLimit the composite Arena score
        // decides (ties: more Keys held, then Sudden Death). Play the PROJECTED
        // score: what the buzzer would count + the nexus rounds still to accrue.
        const arenaClock = !isFFA && mode?.id === 'arena' && roundLimit > 0;
        let myScore = null, enemyScore = null, scoreLead = null, scorePlay = 1;
        if (teamKillMode) {
            myScore = g.state.matchKills?.[player] || 0;
            enemyScore = g.state.matchKills?.[enemy] || 0;
            scoreLead = myScore - enemyScore;
        } else if (arenaClock) {
            const left = roundsRemaining || 0;
            const a = arenaScoreOf(g, player, left), b = arenaScoreOf(g, enemy, left);
            myScore = a.proj; enemyScore = b.proj;
            // A lead inside one kill's points is a coin flip: treat it as a tie
            // (the tie-break is Keys held, which the AI also plays for).
            const d = a.proj - b.proj, band = _arenaPts().kill;
            scoreLead = Math.abs(d) < band ? 0 : d;
            scorePlay = wght(g, 'arenaScorePlay_v1', 2.125);
        }
        const scorePolicy = !(teamKillMode || arenaClock) ? 'normal' : g.state.suddenDeathActive ? 'sudden_death'
            : roundUrgency === 0 ? 'normal' : scoreLead > 0 ? 'protect_lead'
            : scoreLead < 0 ? 'seek_score' : 'break_tie';

        let phase = 'even';
        if (hgTarget > 0 && myHG >= hgTarget - 1) phase = 'hg_winning';
        else if (hgTarget > 0 && enemyHG >= hgTarget - 1) phase = 'hg_losing';
        else if (ownTowerPct < 0.3) phase = 'tower_defend';
        else if (enemyTowerPct < 0.5) phase = 'tower_push';
        else if (enemyDeadCount >= 2) phase = 'tower_push';
        else if (enemyDeadCount >= 1 && myAlive >= enemyAlive + 1) phase = 'tower_push';
        else if (myAlive >= enemyAlive + 2) phase = 'tower_push';
        else if (myAlive > enemyAlive) phase = 'numbers_advantage';
        else if (enemyAlive >= myAlive + 2) phase = 'numbers_disadvantage';

        return {
            myHG, enemyHG, hgTarget,
            ownTowerPct, enemyTowerPct,
            myAlive, enemyAlive,
            enemyDeadCount, enemyMinRespawn, enemyImminentRespawns,
            roundLimit, roundsRemaining, roundUrgency, phase,
            myScore, enemyScore, scoreLead, scorePolicy, scorePlay, arenaClock,
        };
    }

    function assessTactical(unit, visibleEnemies, allies) {
        const g = G();
        const scanRadius = Math.max(5, g.getEffectiveRange(unit) + 2);

        const nearEnemies = visibleEnemies.filter(e =>
            Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y) <= scanRadius
        );
        const nearAllies = allies.filter(a =>
            Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= scanRadius
        );

        const allyHp = nearAllies.reduce((s, a) => s + a.hp, 0) + unit.hp;
        const enemyHp = nearEnemies.reduce((s, e) => s + e.hp, 0);

        const numbersAdv = (nearAllies.length + 1) - nearEnemies.length;
        const hpRatio = enemyHp > 0 ? allyHp / enemyHp : 2.0;
        const selfHpPct = unit.hp / unit.maxHp;

        const raw = (numbersAdv * 0.15)
            + (hpRatio > 1.4 ? 0.3 : hpRatio > 1.0 ? 0.1 : hpRatio > 0.7 ? -0.1 : -0.3)
            + (selfHpPct > 0.7 ? 0.1 : selfHpPct > 0.4 ? -0.1 : -0.3)
            + ((unit.hourglasses || 0) > 0 ? -0.2 : 0);

        const advantage = Math.max(-1, Math.min(1, raw));
        const shouldEngage = nearEnemies.length === 0 || advantage > G().getAIWeight('engageAdvantage_v1');
        const hgCarrierFlee = (unit.hourglasses || 0) > 0 && advantage < AI_TUNE.hgCarrierFleeAdv;

        const isRanged = g.getEffectiveRange(unit) >= 2;
        const nearestMeleeThreat = nearEnemies.find(e => g.getEffectiveRange(e) <= 1);
        const shouldKite = isRanged && nearestMeleeThreat &&
            Math.abs(nearestMeleeThreat.x - unit.x) + Math.abs(nearestMeleeThreat.y - unit.y) <= 2;

        return {
            advantage, shouldEngage: shouldEngage && !hgCarrierFlee, nearEnemies: nearEnemies.length,
            nearAllies: nearAllies.length, selfHpPct, shouldKite, isRanged, hgCarrierFlee
        };
    }

    // ── 🚪 THE ONE-WAY DOOR (CAPTURE_PLAN.md §4, Phase 3, 2026-09-25) ────
    // The party's capture door (story fights only — the natives never carry
    // one, CAPTURE_RULES.playerOnly) is a hazard to every native: a body that
    // ARRIVES on it by any means is HELD, and SEALED after the rounds the door
    // shows. The AI (1) never walks onto one or THROUGH one (a walk stops on
    // the door — _aiMoveTiles drops every tile whose engine path crosses it),
    // (2) prices ending a turn on it or beside it (aiHazardPenaltyAt, so
    // tileDangerCost / the safety moves / the final ranking all read it),
    // (3) never feeds itself or an ally to it (a teleport / dash / swap
    // landing, a push whose collision would slide an ally in), and (4) comes
    // for a HELD ally: an attack on the door is a candidate worth the ally's
    // kill value over the door's hits left, more the fewer seal rounds
    // remain, and the door becomes the team's focus when it can fall this
    // round. Every read is a no-op when no capture door stands (PvP never
    // pays a cycle). Kill-switch: window.EW_AI_NO_CAPTURE = true.
    const CAP_TUNE = {
        doorTile: 260,        // ending on a live enemy door (× 1 + the seal steps this body would lose)
        loneMult: 2,          // …doubled when the unit is its team's last free body (it seals at the round's end)
        besideDoor: 60,       // ending 1 tile off an empty enemy door in a straight / diagonal line (a push away)
        besideDoor2: 20,      // …2 tiles off
        besideNoPusher: 0.35, // × when no visible hostile carries a push / pull / swap
        feedAlly: 220,        // a push whose collision slides an ally onto an enemy door
        freeUrgency: { 1: 1.6, 2: 1.25 },   // × a door hit's worth by seal rounds left (else 1)
        freeBreakNow: 0.5,    // + × the ally's worth when THIS hit breaks the door
        freeTeamFocus: 1,     // + × focusCommitBonus when the team can break it this round
        freeHopeless: 0.25,   // × when the team cannot break it before it seals (a swing a round each)
        freePivotal: 0.5,     // + × the ally's worth when the team has no round to spare (every swing counts)
        freeGoal: 150,        // the move goal toward a held ally's door
        emptyDoorHit: 30,     // a swing at an EMPTY enemy door (only wins when nothing better is on)
    };
    const _CAP_PUSH_KINDS = new Set(['linePush', 'tackle', 'displacement', 'pull', 'aoePull', 'swap', 'skyThrow']);
    function _capOn() { return !(typeof window !== 'undefined' && window.EW_AI_NO_CAPTURE); }
    // every live capture door on the board
    function _capDoors(g) {
        if (!_capOn()) return [];
        const ds = g && g.state && g.state.doors;
        if (!ds || !ds.length) return [];
        return ds.filter(d => d && d.kind === 'capture' && d.hp > 0 && !d.sealed);
    }
    // can this enemy door take this body right now? (the engine's own rule when loaded)
    function _capCanTake(g, door, unit) {
        if (!door || door.held || door.owner === unit.player) return false;
        if (typeof window !== 'undefined' && typeof window.captureDoorCanTake === 'function') {
            try { return !!window.captureDoorCanTake(door, unit); } catch (e) {}
        }
        return !unit.dead && !((unit._captureGraceUntil | 0) >= (g.state.round || 0));
    }
    // the live doors that could take this body (empty, an enemy's)
    function _capThreats(g, unit) {
        return _capDoors(g).filter(d => _capCanTake(g, d, unit));
    }
    function _capDoorAt(doors, x, y) { return doors.find(d => d.x === x && d.y === y) || null; }
    // the rounds a door would hold this body (data.js captureSealSteps) → how many steps it LOSES from the base
    function _capSealLoss(door, unit) {
        try {
            if (typeof captureSealSteps === 'function') {
                const r = captureSealSteps(door, unit, {});
                return Math.max(0, (r.base | 0) - (r.seal | 0));
            }
        } catch (e) {}
        return 0;
    }
    // is this the last body of its team still free (a take seals it at the round's end)?
    function _capLoneBody(g, unit) {
        return !g.state.units.some(u => u !== unit && u.id !== unit.id && !u.dead && !u._sealed
            && u.player === unit.player && !g.unitHasStatus(u, 'captured'));
    }
    // does any hostile on the board carry a displacement tool?
    function _capHostilePusher(g, unit) {
        return g.state.units.some(u => u && !u.dead && u.player !== unit.player
            && (u.spells || []).some(sp => sp && (_CAP_PUSH_KINDS.has(sp.kind) || sp.pushDistance > 0 || sp.pull)));
    }
    // §4.1 — the price of ENDING on (x, y) because of the doors (aiHazardPenaltyAt adds it)
    function _capHazardAt(g, unit, x, y) {
        const doors = _capThreats(g, unit);
        if (!doors.length) return 0;
        const on = _capDoorAt(doors, x, y);
        if (on) {
            let p = CAP_TUNE.doorTile * (1 + _capSealLoss(on, unit));
            if (_capLoneBody(g, unit)) p *= CAP_TUNE.loneMult;
            return p;
        }
        let p = 0, pusherK = null;
        for (const d of doors) {
            const dx = Math.abs(d.x - x), dy = Math.abs(d.y - y);
            const inLine = dx === 0 || dy === 0 || dx === dy;
            const k = Math.max(dx, dy);
            if (!inLine || k > 2) continue;
            if (pusherK == null) pusherK = _capHostilePusher(g, unit) ? 1 : CAP_TUNE.besideNoPusher;
            p = Math.max(p, (k === 1 ? CAP_TUNE.besideDoor : CAP_TUNE.besideDoor2) * pusherK);
        }
        return p;
    }
    // §4.1 — the reachable tiles minus every tile whose ENGINE path (doMove's own
    // findMovePath) crosses or ends on a door that would take this body.
    let _capMoveCache = { key: '', tiles: null };
    function _aiMoveTiles(g, unit) {
        return _aiStormFilter(g, unit, _gdStreamFilter(g, unit, _aiMoveTilesCap(g, unit)));
    }
    // 🌪 A tornado / hurricane eye stops any walk that meets it and flings the walker (battle.js getPathPickupEvent
    // 'storm'), so a destination whose ENGINE path meets one is not a destination: drop it (battle.js walkStormStopAt
    // says which eyes would take this body; a body they cannot move walks through).
    function _aiStormFilter(g, unit, tiles) {
        if (!tiles || !tiles.length || typeof window === 'undefined' || typeof window.walkStormStopAt !== 'function') return tiles;
        const ws = g && g.state && g.state.activeWeather;
        if (!ws || !ws.length) return tiles;
        const eyes = new Set();
        for (const w of ws) for (const t of (w.tiles || [])) { try { if (window.walkStormStopAt(unit, t.x, t.y)) eyes.add(t.x + ',' + t.y); } catch (e) {} }
        if (!eyes.size) return tiles;
        const eyeTiles = [...eyes].map(k => { const p = k.split(','); return { x: +p[0], y: +p[1] }; });
        let budget = 0;
        for (const t of tiles) budget = Math.max(budget, Math.abs(t.x - unit.x) + Math.abs(t.y - unit.y));
        return tiles.filter(t => {
            if (eyes.has(t.x + ',' + t.y)) return false;
            if (!eyeTiles.some(w => Math.abs(unit.x - w.x) + Math.abs(unit.y - w.y) + Math.abs(w.x - t.x) + Math.abs(w.y - t.y) <= budget + 1)) return true;
            if (typeof g.findMovePath !== 'function') return true;
            let path = null;
            try { path = g.findMovePath(unit, t.x, t.y, t.z); } catch (e) { return true; }
            return !(path || []).some(p => p && eyes.has(p.x + ',' + p.y));
        });
    }
    // ── 🚪 THE STANDING DOORS' LANES (the door wheel Phase 2, DOOR_GUN_PLAN §6.2) ──────────────────────
    // THE GUST STREAM stops any walk that enters it (battle.js getPathPickupEvent 'gust') and blows the walker down
    // the lane, so a destination whose ENGINE path enters a stream the wind can move this body in is not a destination
    // at all: drop it (only a colossal body walks through — battle.js gustStreamAt says who).
    // The other doors' lanes are hazards to END on (aiHazardPenaltyAt → _gdLaneHazardAt).
    function _gdOn() { return !(typeof window !== 'undefined' && window.EW_AI_NO_GUN_DOORS); }
    function _gdDoors(g) {
        if (!_gdOn()) return [];
        const ds = g && g.state && g.state.doors;
        if (!ds || !ds.length) return [];
        return ds.filter(d => d && d.kind === 'standing' && d.hp > 0 && !d._revealAt);
    }
    function _gdLane(d) {
        try { return (typeof window !== 'undefined' && typeof window.standingDoorLaneTiles === 'function') ? window.standingDoorLaneTiles(d) : []; } catch (e) { return []; }
    }
    let _gdStreamCache = { key: '', tiles: null };
    function _gdStreamFilter(g, unit, tiles) {
        if (!tiles || !tiles.length) return tiles;
        const gusts = _gdDoors(g).filter(d => d.door === 'gust');
        if (!gusts.length || typeof window === 'undefined' || typeof window.gustStreamAt !== 'function') return tiles;
        const wind = new Set();
        for (const d of gusts) for (const t of _gdLane(d)) { try { if (window.gustStreamAt(unit, t.x, t.y)) wind.add(t.x + ',' + t.y); } catch (e) {} }
        if (!wind.size) return tiles;
        const key = [unit.id, unit.x, unit.y, unit.z, unit.ap, g.state.round, tiles.length, [...wind].join('|')].join(';');
        if (_gdStreamCache.key === key && _gdStreamCache.tiles) return _gdStreamCache.tiles;
        const windTiles = [...wind].map(k => { const p = k.split(','); return { x: +p[0], y: +p[1] }; });
        let budget = 0;
        for (const t of tiles) budget = Math.max(budget, Math.abs(t.x - unit.x) + Math.abs(t.y - unit.y));
        const out = tiles.filter(t => {
            if (wind.has(t.x + ',' + t.y)) return false;
            const near = windTiles.some(w => Math.abs(unit.x - w.x) + Math.abs(unit.y - w.y) + Math.abs(w.x - t.x) + Math.abs(w.y - t.y) <= budget + 1);
            if (!near || typeof g.findMovePath !== 'function') return true;
            let path = null;
            try { path = g.findMovePath(unit, t.x, t.y, t.z); } catch (e) { return true; }
            return !(path || []).some(p => p && wind.has(p.x + ',' + p.y));
        });
        _gdStreamCache = { key, tiles: out };
        return out;
    }
    // the price of ENDING on (x, y) inside a hostile door's reach (the fire / ice ground itself is the terrain's own cost)
    function _gdLaneHazardAt(g, unit, x, y) {
        const doors = _gdDoors(g).filter(d => d.owner !== unit.player);
        if (!doors.length) return 0;
        let pen = 0;
        for (const d of doors) {
            if (d.door === 'maw') {
                const k = Math.max(Math.abs(d.x - x), Math.abs(d.y - y));
                if (k <= 2) pen += (k <= 1 ? 55 : 35);   // drawn in, and bitten from beside it
                continue;
            }
            if (d.door === 'archers') {
                if (Math.max(Math.abs(d.x - x), Math.abs(d.y - y)) <= 4) pen += 25;
                continue;
            }
            if (d.door === 'gust') continue;   // nobody ends in the stream (the move filter)
            if (!_gdLane(d).some(t => t.x === x && t.y === y)) continue;
            pen += d.door === 'laser' ? 70 : d.door === 'light' ? 45 : d.door === 'hell' ? 50 : d.door === 'frost' ? 25 : 20;
        }
        return pen;
    }
    function _aiMoveTilesCap(g, unit) {
        const tiles = g.TargetQuery.moveTiles(unit);
        if (!tiles.length) return tiles;
        const doors = _capThreats(g, unit);
        if (!doors.length) return tiles;
        const key = [unit.id, unit.x, unit.y, unit.z, unit.ap, unit.movesThisTurn, g.state.round,
            tiles.length, doors.map(d => d.id + '@' + d.x + ',' + d.y).join('|')].join(';');
        if (_capMoveCache.key === key && _capMoveCache.tiles) return _capMoveCache.tiles;
        let budget = 0;
        for (const t of tiles) budget = Math.max(budget, Math.abs(t.x - unit.x) + Math.abs(t.y - unit.y));
        try { budget = Math.max(budget, g.getMoveRangeThisTurn ? (g.getMoveRangeThisTurn(unit) | 0) : 0); } catch (e) {}
        const out = tiles.filter(t => {
            if (_capDoorAt(doors, t.x, t.y)) return false;
            // a path through a door is at least as long as the detour via it
            const near = doors.filter(d => Math.abs(unit.x - d.x) + Math.abs(unit.y - d.y)
                + Math.abs(d.x - t.x) + Math.abs(d.y - t.y) <= budget + 1);
            if (!near.length || typeof g.findMovePath !== 'function') return true;
            let path = null;
            try { path = g.findMovePath(unit, t.x, t.y, t.z); } catch (e) { return true; }
            return !(path || []).some(p => p && near.some(d => d.x === p.x && d.y === p.y));
        });
        _capMoveCache = { key, tiles: out };
        return out;
    }
    // does the engine walk to (x, y) cross a door that would take this body? (the execute gate)
    function _capWalkFeeds(g, unit, x, y, z) {
        const doors = _capThreats(g, unit);
        if (!doors.length) return false;
        if (_capDoorAt(doors, x, y)) return true;
        if (typeof g.findMovePath !== 'function') return false;
        try { return (g.findMovePath(unit, x, y, z) || []).some(p => p && _capDoorAt(doors, p.x, p.y)); } catch (e) { return false; }
    }
    // §4.2 — would this cast feed the caster (a landing) or an ally (a push's collision) to a door?
    // Returns a penalty (Infinity = refuse the candidate).
    function _capSpellFeeds(g, unit, spell, target) {
        if (!spell || !target) return 0;
        const doors = _capDoors(g).filter(d => d.owner !== unit.player && !d.held);
        if (!doors.length) return 0;
        const kind = spell.kind;
        // the caster lands on the target tile (a teleport, a dash's end, a swap's exchange)
        if ((kind === 'teleport' || kind === 'dash' || kind === 'swap') && target.x != null) {
            const d = _capDoorAt(doors, target.x, target.y);
            if (d && _capCanTake(g, d, unit)) return Infinity;
        }
        // a rally pull drags every ally toward the caster — never beside an enemy door
        if (kind === 'rallyPull' && doors.some(d => Math.abs(d.x - unit.x) + Math.abs(d.y - unit.y) <= 2)) return Infinity;
        // a shove: the target slides away from the caster; a body in its lane is knocked one tile on
        const shoves = _CAP_PUSH_KINDS.has(kind) && kind !== 'pull' && kind !== 'aoePull' && kind !== 'swap';
        if ((shoves || spell.pushDistance > 0) && target.x != null) {
            const sx = Math.sign(target.x - unit.x), sy = Math.sign(target.y - unit.y);
            if (!sx && !sy) return 0;
            const n = Math.max(1, spell.pushDistance || 1);
            let pen = 0;
            for (let i = 1; i <= n; i++) {
                const bx = target.x + sx * i, by = target.y + sy * i;
                const body = g.state.units.find(u => !u.dead && u.x === bx && u.y === by);
                if (!body) continue;
                if (body.player === unit.player) {
                    const d = _capDoorAt(doors, bx + sx, by + sy);
                    if (d && _capCanTake(g, d, body)) pen += CAP_TUNE.feedAlly;
                }
                break;   // the first body stops the slide
            }
            return pen;
        }
        return 0;
    }
    // §4.3 — the enemy doors holding one of OUR bodies
    function _capHeldAllyDoors(g, unit) {
        const out = [];
        for (const d of _capDoors(g)) {
            if (!d.held || d.owner === unit.player) continue;
            const ally = g.state.units.find(u => u.id === d.held.unitId);
            if (!ally || ally.dead || ally.player !== unit.player) continue;
            out.push({ door: d, ally });
        }
        return out;
    }
    // how many of our bodies could swing at this door this round (a crude reach: move + range)
    function _capTeamHits(g, unit, door) {
        let n = 0;
        for (const u of g.state.units) {
            if (!u || u.dead || u._sealed || u.player !== unit.player) continue;
            if (g.unitHasStatus(u, 'captured')) continue;
            let mv = 2, rg = 1;
            try { mv = g.getEffectiveMove(u) || 2; } catch (e) {}
            try { rg = g.getEffectiveRange(u) || 1; } catch (e) {}
            if (u.id === unit.id) mv = 0;
            if (Math.abs(u.x - door.x) + Math.abs(u.y - door.y) <= mv + rg) n++;
        }
        return n;
    }
    // what ONE basic hit on this held door is worth to `unit`'s team
    function _capFreeValue(g, unit, entry, v) {
        const { door, ally } = entry;
        const worth = killValue(g, (v && v.closestEnemy) || unit, ally, v);
        const seal = Math.max(1, door.held.seal | 0);
        const hp = Math.max(1, door.hp | 0);
        const hits = _capTeamHits(g, unit, door);
        const slack = hits * seal - hp;   // swings the team can spare before the seal (a swing a round each)
        let s = worth * (CAP_TUNE.freeUrgency[seal] || 1) / hp;
        if (hp <= 1) s += worth * CAP_TUNE.freeBreakNow;
        if (slack < 0) return s * CAP_TUNE.freeHopeless;   // it seals before it can fall — a long shot
        if (hits >= hp) s += tuneW(g, 'focusCommitBonus') * CAP_TUNE.freeTeamFocus;   // it can fall THIS round: the team's focus
        if (slack < hits) s += worth * CAP_TUNE.freePivotal;   // no round to spare: skip this swing and the ally is lost
        return s;
    }
    // the door-attack candidates from where the unit stands (scoreAttacks)
    function _capDoorAttacks(g, unit, v, out) {
        const doors = _capDoors(g).filter(d => d.owner !== unit.player);
        if (!doors.length) return;
        const range = v.effRange || 1;
        const held = _capHeldAllyDoors(g, unit);
        for (const d of doors) {
            const dist = _dist(g, unit.x, unit.y, unit.z, d);
            if (dist < 1 || dist > range) continue;
            if (g.isRangeBlockedByTerrain && g.isRangeBlockedByTerrain(unit.x, unit.y, d.x, d.y)) continue;
            const entry = held.find(h => h.door === d);
            let s;
            if (entry) s = _capFreeValue(g, unit, entry, v);
            else if (!d.held) s = CAP_TUNE.emptyDoorHit;
            else continue;   // it holds someone else's body — not ours to break
            out.push({ type: 'attack', target: { x: d.x, y: d.y, z: d.z }, score: s, _objectAttack: true, _captureDoor: d.id });
        }
    }

    /* ═══ THE GROUND'S REAL PRICE (2026-11-01, the AI gap list, audit item 6 of PR #721: "hazards are flat — lava 90,
       deep water 60, poison 30, fire 45"). What ending a turn on (x, y) really costs THIS unit, read off the rules that
       charge it (data.js TERRAIN_RULES endTurn + STATUS_DEFS onRoundEnd, battle.js _burnUnitOnTile) and run through the
       unit's own hit math (battle.js forecastHitOnUnit: fire / poison affinity, Thermal Regen drinking lava, Protect):
         lava        — the Burn it lights ticks min(200, 32 + 32 x stacks) at the round's end (stacks = rounds already
                       stood in it + 1), then the plain Burn (24) for its 2 rounds left (x0.6: dousing / cleansing)
         deep water  — Drowning ticks min(160, 24 + 24 x stacks), and -1 MOVE while it lasts
         poison bog  — 12 a turn end (ignores DEF), healing taken x0.5
         plague flesh— Poison for 2 rounds (32 a round) unless already poisoned that long
         black ooze  — Gooed 2 rounds (-1 MOVE, healing x0.5, magic taken x1.25)
         ground fire — 24 at the round's end + Burn 2 rounds
       Scorched ground itself charges nothing (it was 30); a fire ON it is the burning-ground row. Exempt bodies
       (lava / deep-water adapted, flyers, poison-proof, the necromancer on its flesh, the ooze on its goo) pay 0. A price
       that would kill the unit adds 150. Kill-switch: window.EW_AI_OLD_HAZARD (the flat numbers). ═══ */
    let _ghCache = new Map(), _ghKey = '';
    function _ghHit(unit, raw, el) {
        if (!(raw > 0)) return 0;
        if (typeof forecastHitOnUnit !== 'function') return raw;
        const g = G();
        const ck = ((g.state && g.state.round) || 0) + '|' + ((g.state && g.state._blitzActiveUnitId) || '');
        if (ck !== _ghKey || _ghCache.size > 600) { _ghCache = new Map(); _ghKey = ck; }
        const k = unit.id + '|' + raw + '|' + (el || '');
        if (_ghCache.has(k)) return _ghCache.get(k);
        let d = raw;
        try {
            const r = forecastHitOnUnit(unit, raw, { ignoreArmor: true, damageType: 'dot', consumeMarked: false, scaleByTargetLevel: true,
                element: el === 'fire' ? 'fire' : null, spellElement: el === 'poison' ? 'poison' : undefined });
            if (r) d = r.blocked === 'absorb' ? -(r.heal || 0) : (r.dmg || 0);
        } catch (e) { d = raw; }
        _ghCache.set(k, d);
        return d;
    }
    function groundHazardCost(g, unit, terr, x, y, burning) {
        if (!unit) return 0;
        let flyer = false;
        try { flyer = (typeof canFly === 'function' && canFly(unit)) || (typeof g.isUnitAirborne === 'function' && g.isUnitAirborne(unit)); } catch (e) {}
        if (flyer) return 0;
        const on = unit.x === x && unit.y === y;
        let cost = 0;
        if (terr === 'lava') {
            if (!(typeof unitIsLavaAdapted === 'function' && unitIsLavaAdapted(unit))) {
                const stacks = (on ? (unit._lavaBurnStacks || 0) : 0) + 1;
                cost += _ghHit(unit, Math.min(200, 32 + 32 * stacks), 'fire') + 2 * 0.6 * _ghHit(unit, 24, 'fire');
            }
        } else if (terr === 'deep_water') {
            if (!(typeof unitIsDeepWaterAdapted === 'function' && unitIsDeepWaterAdapted(unit))) {
                const stacks = (on ? (unit._drowningStacks || 0) : 0) + 1;
                cost += _ghHit(unit, Math.min(160, 24 + 24 * stacks), null) + 10;
            }
        } else if (terr === 'poison') {
            if (!(typeof unitIsPoisonTerrainImmune === 'function' && unitIsPoisonTerrainImmune(unit))) {
                cost += _ghHit(unit, 12, null) + ((unit.hp || 0) < (unit.maxHp || 0) ? 5 : 0);
            }
        } else if (terr === 'plague_flesh') {
            const ps = (unit.status && unit.status.poison) || 0;
            if (unit.race !== 'necromancer' && ps < 2) cost += (2 - ps) * _ghHit(unit, 32, 'poison');
        } else if (terr === 'swamp') {
            let gooProof = false;
            try { gooProof = typeof unitPassiveValue === 'function' && unitPassiveValue(unit, 'contactStatus') === 'goo'; } catch (e) {}
            if (!gooProof && !((unit.status && unit.status.goo) > 1)) cost += 30;
        }
        if (burning && !(typeof unitIsLavaAdapted === 'function' && unitIsLavaAdapted(unit))) {
            cost += _ghHit(unit, 24, 'fire') + 2 * 0.6 * _ghHit(unit, 24, 'fire');
        }
        if (cost > 0 && cost >= (unit.hp || 0) + (unit.shield || 0)) cost += 150;
        return Math.max(-40, cost);   // Thermal Regen basks in lava (+40 HP at most a turn end)
    }

    /* ═══ THE GROUND LEFT BEHIND (2026-11-01, the AI gap list, audit item 6 of PR #721: "terrain spells price only the
       impact, not the ground left behind"). Fissure, Flash Freeze, Wall of Fire, Poison Swamp, Call of the Deep, Walk
       the Plank, Great Flood, Permafrost, Ooze Trail, Plaguefield, Sacred Geometry… were scored as "enemies within 1
       square of the aimed tile x the damage", aimed by a distance count, and always laid HORIZONTAL (the CPU never set
       the H/V pick). Now each cast is read on its real footprint:
         (1) the impact: the engine's own forecast (forecastSpellPlan: the line / flood / spring and its overflow, every
             body it hits, the fresh deep water dragging friend and foe under) — enemy damage + kills as before, plus
             the statuses the cast lands (stagger, frozen, burn, slow); an ally caught in it costs what it takes;
         (2) the ground: every body left standing on a painted square pays what that ground costs it (groundHazardCost:
             lava, deep water, poison bog, plague flesh, black ooze, ground fire) x the odds it is still there when the
             ground charges (0.9 when it can't walk off: stunned / asleep / frozen / rooted, or the cast freezes or roots
             it; 0.3 otherwise). Our own bodies on it count against the cast. Enemies within 2 squares lose that ground
             for the 3 rounds it lasts (x0.1). A crystal's MP is worth half its points to the ally standing on it;
         (3) the tile + orientation: every square in reach with an enemy near the footprint, both H and V for a line,
             the best kept (target._orient → state._spellOrientation at the cast).
       The Cube defence bonus stays. Kill-switch: window.EW_AI_OLD_TERRAIN (the old scorer + pick). ═══ */
    const _TC_STUCK = new Set(['stun', 'sleep', 'freeze', 'frozen', 'root', 'petrify', 'paralyze']);
    function _terrainFoot(g, unit, spell, x, y, orient) {
        const st = g.state;
        const inside = (tx, ty) => tx >= 0 && ty >= 0 && tx < g.bw() && ty < g.bh();
        if ((spell.dmg || 0) > 0 && typeof window.forecastSpellPlan === 'function') {
            const was = st._spellOrientation;
            let plan = null;
            try { st._spellOrientation = orient || 'horizontal'; plan = window.forecastSpellPlan(unit, spell, x, y); }
            catch (e) { plan = null; }
            finally { st._spellOrientation = was; }
            if (plan && plan.handled) return { tiles: plan.tiles || [], hits: plan.hits || [] };
        }
        const count = (typeof _terrainSpellTileCount === 'function') ? _terrainSpellTileCount(spell) : (spell.tileCount || 3);
        let cand = [];
        if (spell.orientable && typeof getOrientedLineTiles === 'function') cand = getOrientedLineTiles(x, y, count, orient || 'horizontal');
        else if (spell.squareFlood) cand = getSquareArea(x, y, spell.aoeRadius || 1);
        else {
            const seen = new Set(), q = [{ x, y }];
            while (q.length && cand.length < count) {
                const t = q.shift(), k = t.x + ',' + t.y;
                if (seen.has(k)) continue;
                seen.add(k);
                if (!inside(t.x, t.y) || g.getTerrainAt(t.x, t.y) === 'wall') continue;
                cand.push(t);
                q.push({ x: t.x + 1, y: t.y }, { x: t.x - 1, y: t.y }, { x: t.x, y: t.y + 1 }, { x: t.x, y: t.y - 1 });
            }
        }
        return { tiles: cand.filter(t => t && inside(t.x, t.y) && g.getTerrainAt(t.x, t.y) !== 'wall'), hits: [] };
    }
    function _terrainCastValue(g, unit, spell, target, v) {
        const F = _terrainFoot(g, unit, spell, target.x, target.y, target._orient);
        if (!F || !F.tiles.length) return 0;
        const vis = new Set((v.visibleEnemies || []).map(e => e.id));
        const gone = new Set();
        const struck = new Set();
        let s = 0;
        for (const h of F.hits) {
            const u = h && h.unit;
            if (!u || u.dead) continue;
            const dmg = Math.max(0, h.dmg || 0);
            if (u.player === unit.player) { s -= Math.min(dmg, effHp(u)); if (h.lethal) { s -= 200; gone.add(u.id); } continue; }
            if (!vis.has(u.id)) continue;
            s += Math.min(dmg, effHp(u)) * 0.8;
            if (h.lethal || dmg >= effHp(u)) { s += killValue(g, unit, u, v) * 0.6; gone.add(u.id); continue; }
            if (!struck.has(u.id) && (spell.statusEffects || []).length) s += statusRiderValue(g, unit, u, spell, v);
            struck.add(u.id);
        }
        const tt = spell.terrainType;
        const lands = !spell.monument && !(spell.terrainDeform && spell.terrainDeform.mound);
        const burns = (spell.burningRounds || 0) > 0;
        const castStuck = (spell.statusEffects || []).some(e => e && _TC_STUCK.has(e.id));
        const footKeys = new Set(F.tiles.map(t => t.x + ',' + t.y));
        const stuckOdds = (u, wasStruck) => {
            let stuck = wasStruck && castStuck;
            if (!stuck) for (const id of _TC_STUCK) { try { if (g.unitHasStatus(u, id)) { stuck = true; break; } } catch (e) {} }
            return stuck ? 0.9 : 0.3;
        };
        if (lands && tt) {
            const bodies = [unit, ...(v.allies || []), ...(v.visibleEnemies || [])];
            for (const u of bodies) {
                if (!u || u.dead || gone.has(u.id) || !footKeys.has(u.x + ',' + u.y)) continue;
                const ally = u.player === unit.player;
                let c = groundHazardCost(g, u, tt, u.x, u.y, burns);
                if (tt === 'crystal' && u.maxMp) c = -0.5 * Math.min(Math.floor(u.maxMp * 0.15), Math.max(0, u.maxMp - (u.mp || 0)));
                if ((tt === 'water' || tt === 'deep_water') && u.status && u.status.burn > 0) c -= 24 * Math.min(2, u.status.burn);   // the water douses a Burn
                if (!c) continue;
                const p = stuckOdds(u, struck.has(u.id));
                s += ally ? -c * p : c * p * 0.8;
            }
            /* the ground they have to walk round for the 3 rounds it lasts */
            let near = 0;
            for (const e of (v.visibleEnemies || [])) {
                if (near >= 3 || gone.has(e.id) || footKeys.has(e.x + ',' + e.y)) continue;
                if (!F.tiles.some(t => Math.max(Math.abs(t.x - e.x), Math.abs(t.y - e.y)) <= 2)) continue;
                const c = groundHazardCost(g, e, tt, F.tiles[0].x, F.tiles[0].y, burns);
                if (c > 0) { s += c * 0.1; near++; }
            }
        }
        if (v.ownTower && v.ownTower.hp > 0) {
            const tDist = Math.abs(v.ownTower.x - target.x) + Math.abs(v.ownTower.y - target.y);
            const approachingEnemies = v.visibleEnemies.filter(e =>
                Math.abs(e.x - v.ownTower.x) + Math.abs(e.y - v.ownTower.y) <= 6).length;
            if (tDist <= 4 && approachingEnemies > 0) s += 50 + approachingEnemies * 25;
        }
        return s;
    }
    function _pickTerrainTile(g, unit, spell, v) {
        if (!(v.visibleEnemies || []).length) return null;
        const R = _effRange(unit, spell) || 3;
        const count = (typeof _terrainSpellTileCount === 'function') ? _terrainSpellTileCount(spell) : (spell.tileCount || 3);
        const reach = spell.elevationFlood ? 3 : spell.orientable ? Math.floor(count / 2) + 1 : spell.squareFlood ? (spell.aoeRadius || 1) + 1 : 2;
        const tiles = [];
        for (let dy = -R; dy <= R; dy++) {
            for (let dx = -R; dx <= R; dx++) {
                const tx = unit.x + dx, ty = unit.y + dy, d = Math.abs(dx) + Math.abs(dy);
                if (d < 1 || d > R || tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) continue;
                let near = 0;
                for (const e of v.visibleEnemies) {
                    if (spell.missesFlyers && typeof g.isUnitAirborne === 'function' && g.isUnitAirborne(e)) continue;
                    const c = Math.max(Math.abs(e.x - tx), Math.abs(e.y - ty));
                    if (c <= reach) near += c === 0 ? 3 : 1;
                }
                if (near > 0) tiles.push({ x: tx, y: ty, near });
            }
        }
        if (!tiles.length) return null;
        tiles.sort((a, b) => b.near - a.near);
        const orients = spell.orientable ? ['horizontal', 'vertical'] : [null];
        let best = null, bestS = 0;
        for (const t of tiles.slice(0, 12)) {
            for (const o of orients) {
                const tg = { x: t.x, y: t.y };
                if (o) tg._orient = o;
                let sc = 0;
                try { sc = _terrainCastValue(g, unit, spell, tg, v); } catch (e) { sc = 0; }
                if (sc > bestS) { bestS = sc; best = tg; }
            }
        }
        return best;
    }

    /* ═══ THE WEATHER'S REAL PRICE (2026-11-01, the AI gap list: "Weather scores a flat 40 + 30 per enemy" within 2
       squares of the aimed tile, whatever the weather did). Each castable weather is priced on what it will do
       (state.js WEATHER_REGISTRY + processHomingWeather / applyWeatherTurnEffects, existing rules only):
         a hunting storm (Thunderstorm, Blizzard, Sandstorm): its eye forms on the picked square and, each round end,
             moves homingSpeed squares (8-way) toward the nearest grounded enemy (a cast storm spares the caster's
             side) and strikes every enemy on the squares it sweeps: the strike's middle roll through the victim's hit
             math (forecastHitOnUnit: DEF, element — a Thunderstorm soaks before it strikes, so lightning meets a wet
             body; a Blizzard batters a Frozen one twice), a kill, a Blizzard's Blind, the eye's -DEF / -VISION; no
             strike on a type it spares (Sandstorm: human, Blizzard: anomaly). Bodies are read where they stand, so each
             later round counts less (x0.85, then x0.75 a round: they walk out of its way). Up to 4 rounds;
         a map-wide one without an eye (Blood Rain): every round, every grounded body by its type — Divine burned
             (24-47), Unholy restored (16-39 HP, 5-14 MP) — enemies for us, our own against us;
         already up: a recast renews it (the longer of its rounds left and the roll, the eye moves to the picked square,
             it becomes ours), so a storm of ours is worth only what the recast adds, and an enemy's (or a natural) one
             is worth what it would still do to us plus what it then does for us.
       The pick tries each grounded enemy's square (or the square in reach nearest it). Kill-switch:
       window.EW_AI_OLD_WEATHER. ═══ */
    function _wxDef(spell) {
        try { return (typeof WEATHER_REGISTRY !== 'undefined') ? WEATHER_REGISTRY[spell.weatherType || 'thunderstorm'] || null : null; } catch (e) { return null; }
    }
    function _wxGrounded(g, u) {
        if (!u || u.dead || u._dying) return false;
        try { return !(typeof g.isUnitAirborne === 'function' && g.isUnitAirborne(u)); } catch (e) { return true; }
    }
    function _wxForecast(u, raw, opts, wet) {
        if (typeof forecastHitOnUnit !== 'function') return raw;
        const st = u.status || null;
        const had = st ? st.wet : undefined;
        try {
            if (wet && st && !(st.wet > 0)) st.wet = 2;
            const r = forecastHitOnUnit(u, raw, opts);
            return r ? (r.blocked === 'absorb' ? 0 : (r.dmg || 0)) : raw;
        } catch (e) { return raw; }
        finally { if (wet && st) { if (had === undefined) delete st.wet; else st.wet = had; } }
    }
    /* one strike of a hunting storm's eye on `e`: { dmg, val } (val = what it is worth to `byPlayer`'s side) */
    function _wxStrike(g, unit, def, e, v, first) {
        if (!def.dmgRange) return { dmg: 0, val: 0 };
        if (def.dmgSparesType && (e.types || []).includes(def.dmgSparesType)) return { dmg: 0, val: 0 };
        let raw = (def.dmgRange[0] + def.dmgRange[1]) / 2;
        if (def.blinds && e.status && (e.status.frozen | 0) > 0) raw *= 2;   // a Frozen body can't brace: about twice
        const dmg = _wxForecast(e, raw, { ignoreArmor: false, element: def.element || null, scaleByTargetLevel: true, sourceUnit: unit }, !!def.soaks);
        let val = Math.min(dmg, effHp(e)) * 0.8;
        if (dmg >= effHp(e)) val += killValue(g, unit, e, v) * 0.5;
        if (first && def.blinds) {
            let immune = false;
            try { const w = typeof unitPassiveValue === 'function' ? unitPassiveValue(e, 'weatherStatusImmune') : null; immune = !!(w && Object.values(w).some(a => Array.isArray(a) && a.includes('blind'))); } catch (x) {}
            if (!immune) val += ccDenialValue(g, unit, e, 'blind', def.blinds, v) * 0.8;
        }
        if (def.statMod && def.statMod.def) val += Math.abs(def.statMod.def) * 1.5;   // the eye's -DEF under our next hits
        if (def.statMod && def.statMod.vision) val += 10;
        return { dmg, val };
    }
    /* the eye's hunt from (x, y) for `rounds`: Σ over the bodies it sweeps of fn(body, round, first) */
    function _wxHunt(g, def, x, y, rounds, prey, fn) {
        let cx = x, cy = y, total = 0;
        const W = g.bw(), H = g.bh();
        const hitOnce = new Set();
        const speed = def.homingSpeed || 1;
        for (let r = 0; r < Math.min(4, Math.max(1, Math.round(rounds))); r++) {
            if (!prey.length) break;
            let lead = null, ld = Infinity;
            for (const u of prey) { const d = Math.max(Math.abs(u.x - cx), Math.abs(u.y - cy)); if (d < ld) { ld = d; lead = u; } }
            const swept = new Set([cx + ',' + cy]);
            for (let k = 0; k < speed; k++) {
                if (cx === lead.x && cy === lead.y) break;
                cx = Math.max(0, Math.min(W - 1, cx + Math.sign(lead.x - cx)));
                cy = Math.max(0, Math.min(H - 1, cy + Math.sign(lead.y - cy)));
                swept.add(cx + ',' + cy);
            }
            const disc = 0.85 * Math.pow(0.75, r);
            for (const u of prey) {
                if (!swept.has(u.x + ',' + u.y)) continue;
                total += disc * fn(u, r, !hitOnce.has(u.id));
                hitOnce.add(u.id);
            }
        }
        return total;
    }
    /* a map-wide weather's per-round tick (onTurnEffect rows; the engine rolls, this reads the middle) */
    function _wxTickValue(g, unit, def, type, rounds, v) {
        if (type !== 'bloodRain') return 0;
        let per = 0;
        const bodies = [unit, ...(v.allies || []), ...(v.visibleEnemies || [])].filter(u => _wxGrounded(g, u));
        for (const u of bodies) {
            const ty = u.types || [], ours = u.player === unit.player;
            if (ty.includes('divine')) {
                const d = _wxForecast(u, 35.5, { ignoreArmor: false, scaleByTargetLevel: true, sourceUnit: unit }, false);
                per += ours ? -Math.min(d, effHp(u)) : Math.min(d, effHp(u)) * 0.8;
            } else if (ty.includes('unholy')) {
                const back = Math.min(27.5, Math.max(0, (u.maxHp || 0) - (u.hp || 0))) + 0.5 * Math.min(9.5, Math.max(0, (u.maxMp || 0) - (u.mp || 0)));
                per += ours ? back * 0.8 : -back;
            }
        }
        let tot = 0;
        for (let r = 0; r < Math.min(4, Math.max(1, Math.round(rounds))); r++) tot += per * Math.pow(0.9, r);
        return tot;
    }
    function _wxValueAt(g, unit, spell, def, x, y, rounds, v) {
        if (def.homing) {
            const prey = (v.visibleEnemies || []).filter(e => _wxGrounded(g, e));
            return _wxHunt(g, def, x, y, rounds, prey, (e, r, first) => _wxStrike(g, unit, def, e, v, first).val);
        }
        return _wxTickValue(g, unit, def, spell.weatherType, rounds, v);
    }
    function _weatherCastValue(g, unit, spell, target, v) {
        const def = _wxDef(spell);
        if (!def || !v.visibleEnemies.length) return 0;
        const tx = target ? target.x : unit.x, ty = target ? target.y : unit.y;
        const dr = spell.weatherDuration || def.duration || [3, 3];
        const roll = (dr[0] + dr[1]) / 2;
        const up = (g.state.activeWeather || []).find(w => w && w.type === (spell.weatherType || 'thunderstorm'));
        if (!up) return Math.max(0, _wxValueAt(g, unit, spell, def, tx, ty, roll, v));
        const rem = Math.max(0, up.remaining | 0);
        const after = Math.max(rem, roll);
        const owner = (up._casterUnitId != null && typeof g.unitFromId === 'function') ? g.unitFromId(up._casterUnitId)
            : (g.state.units || []).find(u => u.id === up._casterUnitId) || null;
        const eye = (up.tiles && up.tiles.length && def.homing)
            ? { x: Math.round(up.tiles.reduce((a, t) => a + t.x, 0) / up.tiles.length), y: Math.round(up.tiles.reduce((a, t) => a + t.y, 0) / up.tiles.length) }
            : { x: tx, y: ty };
        const vNew = _wxValueAt(g, unit, spell, def, tx, ty, after, v);
        if (owner && owner.player === unit.player) return Math.max(0, vNew - _wxValueAt(g, unit, spell, def, eye.x, eye.y, rem, v));
        if (!def.homing) return Math.max(0, vNew - _wxValueAt(g, unit, spell, def, tx, ty, rem, v));
        /* an enemy's (or a natural) storm hunting us: the recast takes it off our backs */
        const ours = [unit, ...(v.allies || [])].filter(a => _wxGrounded(g, a));
        const relief = _wxHunt(g, def, eye.x, eye.y, rem, ours, (a) => {
            if (!def.dmgRange || (def.dmgSparesType && (a.types || []).includes(def.dmgSparesType))) return 0;
            const d = _wxForecast(a, (def.dmgRange[0] + def.dmgRange[1]) / 2, { ignoreArmor: false, element: def.element || null, scaleByTargetLevel: true }, !!def.soaks);
            return Math.min(d, effHp(a));
        });
        return Math.max(0, vNew + relief);
    }
    function _pickWeatherTile(g, unit, spell, v) {
        const def = _wxDef(spell);
        if (!def || !v.visibleEnemies.length) return null;
        const R = Math.max(0, _effRange(unit, spell) || 0);
        const W = g.bw(), H = g.bh();
        const inReachNearest = (e) => {
            if (Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y) <= R) return { x: e.x, y: e.y };
            let best = null, bd = Infinity;
            for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
                if (Math.abs(dx) + Math.abs(dy) > R) continue;
                const x = unit.x + dx, y = unit.y + dy;
                if (x < 0 || y < 0 || x >= W || y >= H) continue;
                const d = Math.max(Math.abs(e.x - x), Math.abs(e.y - y)) * 10 + Math.abs(e.x - x) + Math.abs(e.y - y);
                if (d < bd) { bd = d; best = { x, y }; }
            }
            return best;
        };
        const prey = v.visibleEnemies.filter(e => _wxGrounded(g, e));
        if (!def.homing || !prey.length) return inReachNearest(prey[0] || v.visibleEnemies[0]);
        let best = null, bestS = -Infinity;
        for (const e of prey.slice(0, 8)) {
            const t = inReachNearest(e);
            if (!t) continue;
            const sc = _weatherCastValue(g, unit, spell, t, v);
            if (sc > bestS) { bestS = sc; best = t; }
        }
        return best;
    }

    // ── Hazard awareness ─────────────────────────────────────────────────
    // Pending delayed blasts, lava, deep water, poison/scorched ground and
    // actively burning tiles — a penalty for ENDING a turn at (x,y).
    function aiHazardPenaltyAt(unit, x, y) {
        const g = G();
        let pen = 0;
        const delayed = g.state._delayedSpells || [];
        for (const ds of delayed) {
            if (!ds || ds.markedUnitId || ds.x == null) continue;  // unit-tracking shots follow the unit
            const r = ds.aoeRadius != null ? ds.aoeRadius : 1;
            const hit = (typeof aoeMaskValid === 'function' && aoeMaskValid(ds.aoeMask))
                ? aoeMaskTiles(ds.aoeMask, ds.x, ds.y).some(t => t.x === x && t.y === y)   // THE AOE MASK (§4.7): the drawn footprint, not the radius
                : (Math.abs(x - ds.x) <= r && Math.abs(y - ds.y) <= r);
            if (hit) {
                pen += Math.max(60, Math.min(140, ds.dmg || 100));
            }
        }
        let terr = typeof g.getTerrainAt === 'function' ? g.getTerrainAt(x, y) : null;
        // the tile as it stands now: lava runoff over dry ground burns like the lava (map.js applyTerrainTurnEffects)
        if (terr && terr !== 'lava' && typeof window.getSurfaceTerrainAt === 'function' && window.getSurfaceTerrainAt(x, y) === 'lava') terr = 'lava';
        const _burning = typeof _tileIsBurning === 'function' && _tileIsBurning(x, y);
        if (window.EW_AI_OLD_HAZARD) {
            if (terr === 'lava' && !(typeof unitIsLavaAdapted === 'function' && unitIsLavaAdapted(unit))) pen += 90;
            else if (terr === 'deep_water' && !(typeof unitIsDeepWaterAdapted === 'function' && unitIsDeepWaterAdapted(unit))) pen += 60;
            else if (terr === 'poison' || terr === 'scorched') pen += 30;
            if (_burning) pen += 45;
        } else {
            pen += groundHazardCost(g, unit, terr, x, y, _burning);
        }
        pen += _capHazardAt(g, unit, x, y);   // 🚪 THE ONE-WAY DOOR: on an enemy capture door, or a push away from one
        pen += _gdLaneHazardAt(g, unit, x, y);   // 🚪 THE STANDING DOORS: a hostile beam / shaft / tongue / draught
        return pen;
    }

    // End-of-turn facing discipline: square up on the nearest visible enemy
    // so the unit doesn't leave its back (undodgeable +25% backstabs)
    // exposed to whoever acts next.
    function _faceNearestEnemy(unit, g) {
        if (!g || typeof g.setUnitFacing !== 'function') return;
        let best = null, bestD = Infinity;
        for (const e of g.getHostileUnits(unit.player)) {
            if (e.dead) continue;
            if (typeof g.unitHasStatus === 'function' && g.unitHasStatus(e, 'invisible')
                && !g.unitHasStatus(e, 'marked')) continue;
            const d = Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y);
            if (d < bestD) { bestD = d; best = e; }
        }
        if (best && (best.x !== unit.x || best.y !== unit.y)) {
            g.setUnitFacing(unit, best.x - unit.x, best.y - unit.y);
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // TACTICS + THE RACE CLOCKS (2026-10-23, mondo: the jobs "fight, siege, search, intercept, and anchor" are
    // called TACTICS in the game, Heal is added, and a player can set one on each of their own units for auto
    // battle — battle.js setUnitTactic writes unit.tactic, the one field this file reads and never writes).
    //   · aiRaceClocks: for BOTH sides, how many rounds each win is away (wipeout / Cube / Keys / the buzzer).
    //   · _planTactics: once per side per round (again when a body drops or a Key moves), every living unit gets
    //     a Tactic from what the clocks need: Anchor when their Cube clock (or our wipe) is close, Intercept on a
    //     Key carrier / a unit on our Cube, Siege when the Cube is our nearest win, Search while Keys are hidden,
    //     Heal when allies are hurt, Fight for the rest. A unit with unit.tactic set is FORCED: the plan counts it.
    //   · The Tactic steers through _applyTactic (rankCandidates) and _tacticGoal (pickMoveGoal), scaled by the
    //     tacticCommitment_v1 weight (a forced Tactic ×1.5). The normal scoring still picks the spell, target, tile.
    // Fog-honest: Cube HP, picked-up Keys, unit counts and HP are public; unseen enemies are placed only where they
    // were last seen (_aiLastSeenFor); hidden Keys are read only through the search map's public odds.
    // CPU-side only: the CPU's jobs live in _tacticJobs (keyed by unit id), nothing new on unit/state, nothing to
    // sync. Kill-switches: window.EW_AI_NO_TACTICS (no CPU-assigned jobs; a player's own Tactic still applies),
    // window.EW_AI_NO_CLOCKS (the old flat Cube window bonuses), window.EW_AI_NO_SEARCHMAP (the old blind Inspect).
    // ═════════════════════════════════════════════════════════════════════
    const AI_TACTICS = [
        { id: 'fight',     label: 'Fight',     desc: 'Kill and stagger enemies. The default way to play.' },
        { id: 'siege',     label: 'Siege',     desc: 'Go to the enemy Cube and hit it. Fights what stands in the way.' },
        { id: 'search',    label: 'Search',    desc: 'Move and Inspect the tiles most likely to hide a Key.' },
        { id: 'intercept', label: 'Intercept', desc: 'Chase the enemy Key carrier or the enemy hitting our Cube.' },
        { id: 'anchor',    label: 'Anchor',    desc: 'Stay near our Cube and stay alive so the team cannot be wiped or sieged.' },
        { id: 'heal',      label: 'Heal',      desc: 'Stay with the team and heal or revive allies.' },
    ];
    const _TACTIC_IDS = new Set(AI_TACTICS.map(t => t.id));
    const _TACTIC_LABEL = {};
    for (const t of AI_TACTICS) _TACTIC_LABEL[t.id] = t.label;
    try { window.AI_TACTICS = AI_TACTICS; } catch (e) {}

    const _CLOCK_INF = 99;
    const _tacticJobs = new Map();                 // unit id → { job, reason, forced, targetId, tx, ty, ev }
    const _tacticPlan = { units: null, round: 0, sig: { 1: '', 2: '' } };
    const _tacticPersona = { 1: null, 2: null };   // training sparring styles: every unit of that side on one Tactic
    const _cubeHist = { 1: [], 2: [] };            // a side's own Cube HP at the start of each round it planned

    function _tacticResetIfNewMatch(g) {
        const st = g.state;
        const r = st.round || 0;
        if (_tacticPlan.units !== st.units || r < _tacticPlan.round) {
            _tacticJobs.clear();
            _tacticPlan.sig = { 1: '', 2: '' };
            _cubeHist[1] = []; _cubeHist[2] = [];
            _tacticPlan.units = st.units;
        }
        _tacticPlan.round = r;
    }
    // A training persona: aiSetTacticPersona, or the Strength Test's sparring style (battle.js _ewSparringPersonaFor).
    function _personaFor(p) {
        if (_tacticPersona[p]) return _tacticPersona[p];
        try { return (typeof window._ewSparringPersonaFor === 'function') ? (window._ewSparringPersonaFor(p) || null) : null; } catch (e) { return null; }
    }
    // A Tactic the planner may not change: the player's own pick, or a training persona.
    function _forcedTactic(u) {
        if (!u) return null;
        if (typeof u.tactic === 'string' && _TACTIC_IDS.has(u.tactic)) return u.tactic;
        const ps = _personaFor(u.player);
        return (ps && _TACTIC_IDS.has(ps)) ? ps : null;
    }
    function _tacticInfo(u) {
        if (!u) return null;
        const f = _forcedTactic(u);
        const j = _tacticJobs.get(u.id);
        if (f) return (j && j.job === f) ? j : { job: f, forced: true, reason: null };
        if (window.EW_AI_NO_TACTICS || !_aiDiff().tactics) return null;
        return j || null;
    }
    function _tacticOf(u) { const t = _tacticInfo(u); return t ? t.job : null; }

    // ── the public API (battle.js / ui.js: the Tactic picker and the unit card's "why") ──
    window.aiTacticFor = function (unit) { try { return _tacticOf(unit); } catch (e) { return null; } };
    window.aiTacticReason = function (unit) {
        try {
            const t = _tacticInfo(unit);
            if (!t) return '';
            const lbl = _TACTIC_LABEL[t.job] || t.job;
            if (t.reason) return lbl + ': ' + t.reason;
            return t.forced ? lbl + ' (your pick)' : lbl;
        } catch (e) { return ''; }
    };
    // Training (battle.js sparring styles): every unit of `player` plays one Tactic; null clears it.
    window.aiSetTacticPersona = function (player, id) {
        if (player !== 1 && player !== 2) return;
        _tacticPersona[player] = (id && _TACTIC_IDS.has(id)) ? id : null;
    };
    window.aiGetTacticPersona = function (player) { return _personaFor(player); };
    // Console / lab readout of the clocks as `player` sees them.
    window.aiRaceClocksFor = function (player) {
        try {
            const g = G();
            const anyU = g.state.units.find(u => u.player === player && !u.dead);
            if (!anyU) return null;
            const own = g.state.towers?.[player], en = g.state.towers?.[g.enemyOf ? g.enemyOf(player) : (player === 1 ? 2 : 1)];
            return aiRaceClocks(g, player, assessWinCondition(anyU, own, en));
        } catch (e) { return null; }
    };

    function _knownPos(g, viewer, u) {
        if (!u) return null;
        if (u.player === viewer) return { x: u.x, y: u.y };
        const rec = _aiLastSeenFor(g, viewer).get(u.id);
        if (rec && (g.state.round || 0) - rec.round <= 3) return { x: rec.x, y: rec.y, round: rec.round };
        return null;
    }
    function _cubeHitOf(g, u, tw) {
        try {
            if (typeof window.getCubeAttackDamage === 'function') return window.getCubeAttackDamage(u, tw, 0).damage || 0;
        } catch (e) {}
        try { return Math.max(_basicMinRaw(), Math.floor(_pwrAtk(u) * _basicCoef())); } catch (e) { return 0; }
    }
    function _noteCubeHist(g) {
        const st = g.state, r = st.round || 0;
        for (const p of [1, 2]) {
            const tw = st.towers && st.towers[p];
            if (!tw) continue;
            const h = _cubeHist[p];
            if (h.length && h[h.length - 1].round === r) continue;
            h.push({ round: r, hp: tw.hp });
            if (h.length > 4) h.shift();
        }
    }
    // Cube damage per round the other side has ACTUALLY done to `owner`'s Cube lately (public: the Cube's HP bar).
    function _observedCubeRate(g, owner, hpNow) {
        const h = _cubeHist[owner] || [];
        const r = g.state.round || 0;
        let ref = null;
        for (const e of h) if (e.round <= r - 2) ref = e;            // about two rounds back…
        if (!ref) for (const e of h) if (e.round <= r - 1) ref = e;  // …or the last round on file
        if (!ref) return 0;
        return Math.max(0, (ref.hp - hpNow) / Math.max(1, r - ref.round));
    }

    /* ── THE SEARCH MAP (Phase 2): the odds a still-hidden Key lies on each tile, from facts every player has —
       the Key count (shown), the tiles this side already Inspected (state.searchedByPlayer, via _aiSearched), walkable tiles only
       (randomizeSharedObjectives floods from the spawns), never the Cube's tile. RANDOM KEYS (mondo 2026-10-23):
       Keys land anywhere on the board with no spacing and no centre-first pass, so every open tile is equally
       likely (searchCenterPrior_v1 no longer applies; a seen Key's surroundings are no longer ruled out). */
    /* The tiles side p already searched (battle.js THE SEARCH MAP: Inspect / Far Sight footprints; a death tile drops out).
       Was state.scannedByPlayer, which the scan fade empties 0.7 s after every search, so the CPU never remembered
       where it had looked (mondo 2026-10-23: "yes it should remember"). */
    function _aiSearched(st, p) {
        const sb = st && st.searchedByPlayer && st.searchedByPlayer[p];
        return (sb instanceof Set) ? sb : new Set();
    }
    const _keySeen = { 1: new Map(), 2: new Map(), units: null };
    const _searchCache = { 1: null, 2: null };
    function _searchMapFor(g, unit, p) {
        const st = g.state;
        const hg = st.hourglasses || [];
        const scanned = _aiSearched(st, p);
        if (!hg.length || !scanned || !unit) return null;
        if (_keySeen.units !== st.units) {
            _keySeen[1].clear(); _keySeen[2].clear(); _keySeen.units = st.units;
            _searchCache[1] = null; _searchCache[2] = null;
        }
        const seen = _keySeen[p];
        for (const h of hg) if (h.visibleTo && h.visibleTo[p] && !seen.has(h.id)) seen.set(h.id, { x: h.x, y: h.y });
        const hidden = hg.filter(h => !(h.visibleTo && h.visibleTo[p])).length;
        const W = g.bw(), H = g.bh();
        const key = (st.round || 0) + '|' + scanned.size + '|' + seen.size + '|' + hidden + '|' + W + 'x' + H;
        const c = _searchCache[p];
        if (c && c.key === key) return c.val;
        const prob = new Float32Array(W * H);
        const val = { p: prob, W, H, hidden, topEV: 0, tiles: 0 };
        if (hidden > 0) {
            const towers = st.towers ? [st.towers[1], st.towers[2]].filter(Boolean) : [];
            const hasPass = typeof isTerrainPassable === 'function';
            let sumW = 0;
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
                if (scanned.has(g.scanKey(x, y))) continue;
                if (towers.some(t => t.x === x && t.y === y)) continue;
                try { if (hasPass ? !isTerrainPassable(x, y) : !g.unitCanTraverse(unit, x, y)) continue; } catch (e) {}
                prob[x + y * W] = 1; sumW += 1;
            }
            if (sumW > 0) {
                const k = hidden / sumW;
                const vals = [];
                for (let i = 0; i < prob.length; i++) if (prob[i] > 0) { prob[i] = Math.min(1, prob[i] * k); vals.push(prob[i]); }
                vals.sort((a, b) => b - a);
                val.tiles = vals.length;
                const top = vals.slice(0, Math.max(1, Math.ceil(vals.length * 0.15)));
                // ONE TILE A SCAN (2026-10-23): an Inspect searches one tile, whatever the VISION
                val.topEV = Math.min(1, top.reduce((a, b) => a + b, 0) / top.length);
            }
        }
        _searchCache[p] = { key, val };
        return val;
    }
    // Keys an Inspect aimed at (x,y) is expected to find (its real footprint: battle.js getInspectFootprint).
    function _footprintEV(g, unit, sm, x, y) {
        if (!sm || !(sm.hidden > 0)) return 0;
        let fp;
        try { fp = g.getInspectFootprint(unit, x, y); } catch (e) { fp = [{ x, y }]; }
        let ev = 0;
        for (const f of (fp || [])) ev += sm.p[f.x + f.y * sm.W] || 0;
        return Math.min(ev, sm.hidden);
    }
    // The best unsearched area for one searcher, away from the areas its teammates already took (split the board).
    function _bestSearchArea(g, u, sm, taken) {
        let best = null, bestS = -Infinity;
        for (let i = 0; i < sm.p.length; i++) {
            if (!(sm.p[i] > 0)) continue;
            const x = i % sm.W, y = Math.floor(i / sm.W);
            if (taken.some(t => Math.max(Math.abs(t.x - x), Math.abs(t.y - y)) <= 3)) continue;
            const ev = _footprintEV(g, u, sm, x, y);
            const s = ev - 0.02 * (Math.abs(u.x - x) + Math.abs(u.y - y));
            if (s > bestS) { bestS = s; best = { x, y, ev }; }
        }
        return best;
    }

    /* ── THE RACE CLOCKS (Phase 3): rounds until each win, for side p as `viewer` knows it. ── */
    function _sideClock(g, p, q, viewer, wcs, ws) {
        const st = g.state, INF = _CLOCK_INF;
        const r = { wipe: INF, cube: INF, keys: INF, buzzer: INF, cubeRate: 0, best: INF, bestKind: 'none' };
        const alive = pl => st.units.filter(u => u.player === pl && !u.dead && !u._dying && !u._sealed);
        const mine = alive(p), theirs = alive(q);
        if (!mine.length) return r;
        // the team's damage per round into the other side, and the rounds one of their bodies takes to drop
        let out = 0, hp = 0;
        if (theirs.length) {
            for (const a of mine) { let s = 0; for (const e of theirs) s += unitThreatOutput(g, a, e); out += s / theirs.length; }
            for (const e of theirs) hp += effHp(e);
        }
        const perKill = theirs.length ? Math.max(1, (hp / theirs.length) / Math.max(1, out * 0.6)) : 1;
        // WIPEOUT: every standing body; bodies come back on a timer in the Arena (a wipe must outpace them)
        if (wcs.includes('wipeout')) {
            if (!theirs.length) r.wipe = 0;
            else {
                r.wipe = 1 + hp / Math.max(1, out * 0.6);
                if (_isArenaMode() || st.units.some(u => u.player === q && u.dead && typeof u._respawnIn === 'number')) r.wipe *= 1.3;
            }
        }
        // CUBE: travel + HP ÷ the Cube damage of the k units that get there first (best k)
        const tw = st.towers && st.towers[q];
        if (wcs.includes('tower_destroyed') && tw && tw.hp > 0) {
            const rows = [];
            for (const a of mine) {
                const hit = _cubeHitOf(g, a, tw);
                if (!(hit > 0)) continue;
                const pos = _knownPos(g, viewer, a);
                let travel = 2;
                if (pos) {
                    let mv = 2, rg = 1;
                    try { mv = g.getEffectiveMove(a) || a.move || 2; } catch (e) {}
                    try { rg = g.getEffectiveRange(a) || 1; } catch (e) {}
                    const d = Math.abs(pos.x - tw.x) + Math.abs(pos.y - tw.y);
                    travel = Math.max(0, Math.ceil((d - rg) / Math.max(1, mv * 1.5)));
                }
                rows.push({ hit, travel });
            }
            rows.sort((a, b) => a.travel - b.travel || b.hit - a.hit);
            let sum = 0;
            for (const row of rows) {
                sum += row.hit;
                const eta = row.travel + tw.hp / sum;
                if (eta < r.cube) { r.cube = eta; r.cubeRate = sum; }
            }
            // their clock on OUR Cube: what they have actually done to it lately says more than what they could do
            if (p !== viewer && r.cube < INF) {
                const obs = _observedCubeRate(g, viewer, tw.hp);
                const near = mine.some(a => { const ps = _knownPos(g, viewer, a); return ps && (st.round || 0) - (ps.round ?? 0) <= 1 && Math.abs(ps.x - tw.x) + Math.abs(ps.y - tw.y) <= 4; });
                if (obs > 0) r.cube = Math.min(r.cube + 2, tw.hp / obs);
                else if (!near) r.cube += 3;   // nobody on it yet: they have to commit first
            }
        }
        // KEYS: hidden Keys at our search rate (ours) or their pickup rate so far (theirs); Keys the other side
        // carries have to come off a carrier's body first
        const need = (typeof g.getKeysToWin === 'function') ? g.getKeysToWin() : 0;
        if (wcs.includes('hourglasses_collected') && need > 0) {
            const hg = st.hourglasses || [];
            const heldBy = pl => hg.filter(h => h.carriedBy != null && st.units.find(u => u.id === h.carriedBy)?.player === pl).length;
            const have = heldBy(p), lost = heldBy(q), total = hg.length;
            const still = need - have;
            if (still <= 0) r.keys = 0;
            else {
                let eta;
                if (p === viewer) {
                    const loose = hg.filter(h => h.carriedBy == null && h.visibleTo && h.visibleTo[viewer]).length;
                    const sm = _searchMapFor(g, mine[0], viewer);
                    const searchers = Math.max(1, mine.filter(u => _tacticOf(u) === 'search').length);
                    const per = sm ? Math.max(0.02, sm.topEV) : 0.25;
                    const fromLoose = Math.min(still, loose);
                    const hiddenNeed = Math.max(0, still - fromLoose);
                    eta = (fromLoose ? 1.5 : 0) + (hiddenNeed ? 1 + hiddenNeed / Math.min(2, searchers * per) : 0);
                } else {
                    const rate = Math.max(0.15, have / Math.max(1, (st.round || 1) - 1));
                    eta = still / rate;
                }
                const short = need - (total - lost);
                if (short > 0) eta += short * perKill;
                r.keys = eta;
            }
        }
        // THE BUZZER: the side ahead on the clock's score (a lead past one kill's points) wins when it runs out
        if (ws && ws.roundsRemaining != null && ws.scoreLead != null && ws.scoreLead !== 0) {
            const lead = p === viewer ? ws.scoreLead : -ws.scoreLead;
            if (lead > 0) r.buzzer = ws.roundsRemaining;
        }
        for (const k of ['wipe', 'cube', 'keys', 'buzzer']) if (r[k] < r.best) { r.best = r[k]; r.bestKind = k; }
        return r;
    }
    let _clockCache = { key: '', val: null };
    function aiRaceClocks(g, p, ws) {
        const st = g.state;
        if (!st || (g._isFFA && g._isFFA())) return null;
        const mode = (typeof getActiveMultiplayerMode === 'function') ? getActiveMultiplayerMode() : null;
        const wcs = (mode && Array.isArray(mode.winConditions)) ? mode.winConditions : [];
        if (!wcs.length) return null;
        const q = g.enemyOf ? g.enemyOf(p) : (p === 1 ? 2 : 1);
        const hg = st.hourglasses || [];
        const key = p + '|' + (st.round || 0) + '|' + st.units.map(u => u.dead ? 'd' : ((u.hp | 0) + ':' + u.x + ',' + u.y)).join(';')
            + '|' + hg.map(h => h.carriedBy == null ? (h.visibleTo && h.visibleTo[p] ? 'v' : 'h') : 'c' + h.carriedBy).join(',')
            + '|' + (st.towers?.[1]?.hp | 0) + '/' + (st.towers?.[2]?.hp | 0) + '|' + (_aiSearched(st, p).size | 0)
            + '|' + (ws ? ws.scoreLead + '/' + ws.roundsRemaining : '');
        if (_clockCache.key === key) return _clockCache.val;
        const val = { our: _sideClock(g, p, q, p, wcs, ws), their: _sideClock(g, q, p, p, wcs, ws), wcs };
        _clockCache = { key, val };
        return val;
    }

    /* The Cube hit's worth under the clocks (replaces the flat "window" bonuses of scoreTowerAttack): the rounds the
       hit takes off our Cube clock × Race Round Value, × how much the Cube is our nearest finish (the wipeout or
       the Keys nearer = less), × 1.5 when their nearest win is no later than our Cube (every round counts), plus
       one more round's worth when this hit makes our Cube clock beat theirs. */
    // A blind Inspect on the Search job, in the race's own currency: the expected Keys it finds × the rounds one
    // Key takes off our Keys clock × Race Round Value (2026-10-23 browser check: the flat bonus never beat a hit).
    function _keyClockValue(g, unit, v, ev) {
        if (!(ev > 0) || window.EW_AI_NO_CLOCKS || !_aiDiff().tactics) return 0;
        const clk = aiRaceClocks(g, unit.player, v.winState);
        if (!clk || !(clk.our.keys < _CLOCK_INF)) return 0;
        const need = (typeof g.getKeysToWin === 'function') ? g.getKeysToWin() : 0;
        const held = (g.state.hourglasses || []).filter(h => h.carriedBy != null
            && g.state.units.find(u => u.id === h.carriedBy)?.player === unit.player).length;
        const left = Math.max(1, need - held);
        // a slow Keys race counts for less (same share rule as the Cube's)
        const other = Math.min(clk.our.wipe, clk.our.cube, clk.our.buzzer);
        const share = clk.our.keys <= other + 0.5 ? 1 : Math.max(0.25, Math.min(1, other / Math.max(1, clk.our.keys)));
        return Math.min(1, ev) * (clk.our.keys / left) * share * wght(g, 'raceRoundValue_v1', 200);
    }
    function _cubeClockValue(g, unit, v, estDmg, clk) {
        const R = wght(g, 'raceRoundValue_v1', 200);
        const our = clk.our, their = clk.their;
        const siegers = g.aliveUnitsFor(unit.player).filter(u => u.id === unit.id || _tacticOf(u) === 'siege');
        let rate = 0;
        for (const u of siegers) rate += _cubeHitOf(g, u, v.enemyTower);
        rate = Math.max(estDmg, rate);
        const saved = estDmg / rate;
        const other = Math.min(our.wipe, our.keys, our.buzzer);
        const share = our.cube <= other + 0.5 ? 1 : Math.max(0.25, Math.min(1, other / Math.max(1, our.cube)));
        const tight = their.best <= our.cube ? 1.5 : (their.best - our.cube <= 2 ? 1.25 : 1);
        let val = R * saved * share * tight;
        if (our.cube >= their.best && our.cube - saved < their.best) val += R * share;
        return val;
    }

    // Who suits which Tactic (higher = better). -1e9 = cannot do it.
    function _canHealJob(g, u) {
        if ((u.spells || []).some(s => s && HEAL_KINDS.has(s.kind) && (u.mp || 0) >= _mpCost(u, s))) return true;
        const lk = (typeof itemKeysLike === 'function') ? itemKeysLike('healPotion') : ['healPotion'];
        return lk.some(k => (u.items?.[k] || 0) > 0);
    }
    function _tacticFitness(g, u, job, ctx) {
        const d = (x, y) => Math.abs(u.x - x) + Math.abs(u.y - y);
        let mv = 2, rg = 1;
        try { mv = g.getEffectiveMove(u) || 2; } catch (e) {}
        try { rg = g.getEffectiveRange(u) || 1; } catch (e) {}
        switch (job) {
            case 'anchor':
                return ctx.ownTw ? -d(ctx.ownTw.x, ctx.ownTw.y) * 10 + effHp(u) / 40 + (unitIsHealerKit(u) ? 15 : 0) : -1e9;
            case 'intercept': {
                const t = ctx.threats[0];
                if (!t) return -1e9;
                return -d(t.pos.x, t.pos.y) * 8 + mv * 12 + unitThreatOutput(g, u, t.e) / 6;
            }
            case 'siege':
                return ctx.enTw ? _cubeHitOf(g, u, ctx.enTw) - d(ctx.enTw.x, ctx.enTw.y) * 25 + rg * 10 - (unitIsHealerKit(u) ? 60 : 0) : -1e9;
            case 'search': {
                let vis = 3, reach = 1;
                try { vis = (typeof g.getEffectiveVision === 'function' ? g.getEffectiveVision(u) : 3) || 3; } catch (e) {}
                try { reach = (typeof getEffectiveInspect === 'function') ? getEffectiveInspect(u) : (u.inspect || 1); } catch (e) {}
                return vis * 30 + reach * 40 + mv * 10 - (unitIsHealerKit(u) ? 30 : 0);
            }
            case 'heal':
                return _canHealJob(g, u) ? 100 + (u.intStat || u.int || 0) / 4 : -1e9;
        }
        return 0;
    }

    function _planTactics(g, unit, v) {
        const st = g.state, p = unit.player;
        const q = g.enemyOf ? g.enemyOf(p) : (p === 1 ? 2 : 1);
        const team = st.units.filter(u => u.player === p && !u.dead && !u._dying && !u._sealed);
        if (!team.length) return;
        const mode = (typeof getActiveMultiplayerMode === 'function') ? getActiveMultiplayerMode() : null;
        const wcs = (mode && Array.isArray(mode.winConditions)) ? mode.winConditions : [];
        const clk = aiRaceClocks(g, p, v.winState);
        const our = clk ? clk.our : null, their = clk ? clk.their : null;
        const ownTw = st.towers?.[p], enTw = st.towers?.[q];
        const hasOwnCube = wcs.includes('tower_destroyed') && ownTw && ownTw.hp > 0;
        const hasCube = wcs.includes('tower_destroyed') && enTw && enTw.hp > 0;
        const need = (typeof g.getKeysToWin === 'function') ? g.getKeysToWin() : 0;
        const hasKeys = wcs.includes('hourglasses_collected') && need > 0;
        const sm = hasKeys ? _searchMapFor(g, unit, p) : null;
        const R = n => (n >= _CLOCK_INF ? 'no' : '~' + Math.max(0, Math.round(n)));
        const KIND = { wipe: 'wipeout', cube: 'Cube', keys: 'Keys', buzzer: 'time', none: 'none' };
        const n = team.length;

        // threats the team sees (or saw within 3 rounds): Key carriers first, then enemies on our Cube
        const enemies = st.units.filter(u => u.player === q && !u.dead && !u._dying);
        const carriers = enemies.filter(e => (e.hourglasses || 0) > 0).map(e => ({ e, pos: _knownPos(g, p, e) })).filter(c => c.pos)
            .sort((a, b) => (b.e.hourglasses || 0) - (a.e.hourglasses || 0));
        // an enemy seen this round or last close to our Cube (3 squares, 2 on a board 8-11 wide; older sightings
        // keep the chase going, not the alarm)
        const cubeR = Math.max(2, Math.min(3, Math.floor(Math.min(g.bw(), g.bh()) / 4)));
        const siegers = hasOwnCube ? enemies.map(e => ({ e, pos: _knownPos(g, p, e) }))
            .filter(c => c.pos && (c.pos.round == null || (st.round || 0) - c.pos.round <= 1)
                && Math.abs(c.pos.x - ownTw.x) + Math.abs(c.pos.y - ownTw.y) <= cubeR) : [];
        const theirHeld = hasKeys ? (st.hourglasses || []).filter(h => h.carriedBy != null
            && st.units.find(u => u.id === h.carriedBy)?.player === q).length : 0;
        const keyThreat = hasKeys && carriers.length && their && our && their.keys <= our.best + 2;
        const threats = (keyThreat ? carriers : []).concat(siegers);

        const want = { anchor: 0, intercept: 0, siege: 0, search: 0, heal: 0 };
        const why = {};
        if (our && their) {
            if (hasOwnCube && (siegers.length || their.cube <= Math.min(our.best + 1, 8))) {
                want.anchor = 1; why.anchor = 'their Cube win is ' + R(their.cube) + ' rounds away';
            }
            const deadMine = st.units.filter(u => u.player === p && u.dead && !u._sealed).length;
            if (wcs.includes('wipeout') && n <= 2 && deadMine > 0 && their.wipe <= our.best + 1) {
                want.anchor = Math.max(want.anchor, 1); why.anchor = why.anchor || ('only ' + n + ' of us standing');
            }
            if (keyThreat) { want.intercept = theirHeld >= need - 1 ? 2 : 1; why.intercept = 'their Keys win is ' + R(their.keys) + ' rounds away'; }
            if (siegers.length) { want.intercept = Math.max(want.intercept, 1); why.intercept = why.intercept || 'an enemy is near our Cube'; }
            if (hasCube) {
                if (our.bestKind === 'cube') { want.siege = Math.max(1, Math.ceil(n / 2)); why.siege = 'the Cube is our nearest win (' + R(our.cube) + ' rounds)'; }
                else if (our.cube <= our.best * 1.5 + 1) { want.siege = 1; why.siege = 'Cube ' + R(our.cube) + ' rounds, ' + KIND[our.bestKind] + ' ' + R(our.best); }
            }
            if (hasKeys && sm && sm.hidden > 0) {
                want.search = our.bestKind === 'keys' ? Math.max(1, Math.floor(n / 2)) : 1;
                why.search = sm.hidden + ' Key' + (sm.hidden > 1 ? 's' : '') + ' still hidden';
            }
        }
        const hurt = team.some(u => u.hp / (u.maxHp || 1) < 0.6);
        const reviveable = st.units.some(u => u.player === p && u.dead && !u._sealed)
            && team.some(u => (u.spells || []).some(s => s && s.kind === 'revive'));
        if ((hurt || reviveable) && team.some(u => _canHealJob(g, u))) { want.heal = 1; why.heal = hurt ? 'allies are hurt' : 'an ally is down'; }

        const jobs = new Map();
        const free = new Set(team.map(u => u.id));
        // forced Tactics first (the player's own pick or a training persona): the plan counts them
        for (const u of team) {
            const f = _forcedTactic(u);
            if (!f) continue;
            free.delete(u.id);
            if (want[f] > 0) want[f]--;
            jobs.set(u.id, { job: f, forced: true, reason: why[f] || null });
        }
        // The Keys race matters when it is our nearest win or close behind it: then Search always gets a unit,
        // even if Anchor + Intercept + Siege would fill every slot (the kept fighter becomes the searcher).
        const keysMatter = !!(hasKeys && sm && sm.hidden > 0 && our && want.search > 0
            && (our.bestKind === 'keys' || our.keys <= our.best * 1.5 + 1));
        let budget = Math.max(0, free.size - (n >= 3 && !keysMatter ? 1 : 0));   // keep a fighter when there are three or more
        const ctx = { ownTw, enTw, threats, sm };
        // last plan's holder keeps its job unless another unit fits it clearly better (no swapping every round)
        const prevJob = id => { const j = _tacticJobs.get(id); return j && !j.forced ? j.job : null; };
        // first pass: one unit per wanted job (the nearest win's job before the other race), second pass: the rest
        const order = ['anchor', 'intercept'].concat(our && our.bestKind === 'keys' ? ['search', 'siege'] : ['siege', 'search'], ['heal']);
        const firstPass = keysMatter ? order.map(j => [j, Math.min(1, want[j])]) : [];
        const taken0 = {};
        for (const [job, cnt] of firstPass.concat(order.map(j => [j, want[j]]))) {
            for (let k = taken0[job] || 0; k < cnt && budget > 0; k++) {
                let best = null, bestF = -Infinity;
                for (const u of team) {
                    if (!free.has(u.id)) continue;
                    let f = _tacticFitness(g, u, job, ctx);
                    if (f > -1e8 && prevJob(u.id) === job) f += 60;
                    if (f > bestF) { bestF = f; best = u; }
                }
                if (!best || bestF <= -1e8) break;
                free.delete(best.id); budget--; taken0[job] = k + 1;
                jobs.set(best.id, { job, forced: false, reason: why[job] || null });
            }
        }
        const fightWhy = our && our.best < _CLOCK_INF ? 'our nearest win is ' + KIND[our.bestKind] + ' (' + R(our.best) + ' rounds)' : null;
        for (const u of team) if (free.has(u.id)) jobs.set(u.id, { job: 'fight', forced: false, reason: fightWhy });

        // job targets: who to chase, where to search (searchers split the board)
        const taken = [];
        for (const u of team) {
            const j = jobs.get(u.id);
            if (j.job === 'intercept' && threats.length) {
                let pick = null, ps = -Infinity;
                for (const t of threats) {
                    const s = ((t.e.hourglasses || 0) > 0 ? 3 + t.e.hourglasses : 2) * 10 - (Math.abs(u.x - t.pos.x) + Math.abs(u.y - t.pos.y));
                    if (s > ps) { ps = s; pick = t; }
                }
                if (pick) { j.targetId = pick.e.id; j.tx = pick.pos.x; j.ty = pick.pos.y; }
            } else if (j.job === 'search' && sm && sm.hidden > 0) {
                const t = _bestSearchArea(g, u, sm, taken);
                if (t) { j.tx = t.x; j.ty = t.y; j.ev = t.ev; taken.push(t); }
            }
            _tacticJobs.set(u.id, j);
        }
    }
    // Plan once per side per round, and again when a body drops, a Key changes hands or a player changes a Tactic.
    function _ensureTacticPlan(g, unit, v) {
        try {
            _tacticResetIfNewMatch(g);
            if (g._isFFA && g._isFFA()) return;
            const st = g.state, p = unit.player;
            _noteCubeHist(g);
            const hg = st.hourglasses || [];
            const sig = (st.round || 0) + '|' + st.units.filter(u => !u.dead).map(u => u.id).join(',')
                + '|' + hg.map(h => h.carriedBy == null ? (h.visibleTo && h.visibleTo[p] ? 'v' : 'h') : h.carriedBy).join(',')
                + '|' + st.units.filter(u => u.player === p && u.tactic).map(u => u.id + ':' + u.tactic).join(',')
                + '|' + (_personaFor(p) || '') + '|' + (window.EW_AI_NO_TACTICS ? 1 : 0);
            if (_tacticPlan.sig[p] === sig && _tacticJobs.has(unit.id)) return;
            _tacticPlan.sig[p] = sig;
            _planTactics(g, unit, v);
        } catch (e) { console.warn('[AI] Tactics plan failed:', e); }
    }

    // The Tactic's own move goal (pickMoveGoal adds it to the list; null = the normal goals decide).
    function _tacticGoal(g, unit, v) {
        const t = _tacticInfo(unit);
        if (!t || !g.canUnitMove(unit)) return null;
        const C = wght(g, 'tacticCommitment_v1', 1) * (t.forced ? 1.5 : 1);
        if (!(C > 0)) return null;
        const st = g.state;
        const d = (x, y) => Math.abs(unit.x - x) + Math.abs(unit.y - y);
        switch (t.job) {
            case 'siege': {
                const tw = v.enemyTower;
                if (!tw || tw.hp <= 0) return null;
                let rg = 1;
                try { rg = g.getEffectiveRange(unit) || 1; } catch (e) {}
                if (d(tw.x, tw.y) <= rg) return null;   // already in swinging range
                return { x: tw.x, y: tw.y, score: 240 * C, reason: 'tactic_siege' };
            }
            case 'search': {
                if (t.tx == null) return null;
                let reach = 1;
                try { reach = (typeof getEffectiveInspect === 'function') ? getEffectiveInspect(unit) : (unit.inspect || 1); } catch (e) {}
                if (Math.max(Math.abs(unit.x - t.tx), Math.abs(unit.y - t.ty)) <= reach) return null;   // Inspect takes over
                return { x: t.tx, y: t.ty, score: (150 + 150 * Math.min(1, t.ev || 0)) * C, reason: 'tactic_search' };
            }
            case 'intercept': {
                const e = t.targetId != null ? st.units.find(u => u.id === t.targetId && !u.dead) : null;
                if (!e) return null;
                const seen = v.visibleEnemies.find(x => x.id === e.id);
                const pos = seen ? { x: seen.x, y: seen.y } : _knownPos(g, unit.player, e);
                if (!pos) return null;
                return { x: pos.x, y: pos.y, score: (seen ? 260 : 190) * C, reason: 'tactic_intercept' };
            }
            case 'anchor': {
                const tw = v.ownTower;
                if (!tw || tw.hp <= 0 || d(tw.x, tw.y) <= 2) return null;
                return { x: tw.x, y: tw.y, score: 230 * C, reason: 'tactic_anchor' };
            }
            case 'heal': {
                let best = null, bs = 0;
                for (const a of (v.allies || [])) {
                    if (!a || a.dead || a.id === unit.id) continue;
                    const frac = a.hp / (a.maxHp || 1);
                    if (frac >= 0.85) continue;
                    const s = (1 - frac) * 200 - d(a.x, a.y) * 5;
                    if (s > bs) { bs = s; best = a; }
                }
                if (!best || d(best.x, best.y) <= 2) return null;
                return { x: best.x, y: best.y, score: (120 + bs * 0.5) * C, reason: 'tactic_heal' };
            }
        }
        return null;
    }
    // Goals a FORCED Tactic keeps at full weight (pickups, emergencies); the rest are damped while its own goal exists.
    const _TACTIC_KEEP_GOALS = new Set(['grab_hg', 'ctf_carry_home', 'ctf_intercept_carrier', 'ctf_return_flag',
        'arena_nexus_deny', 'free_captive', 'retreat', 'defend_tower']);

    // The Tactic's weight on the unit's options (rankCandidates, before the sort).
    function _applyTactic(g, unit, v, candidates) {
        const t = _tacticInfo(unit);
        if (!t) return;
        const C = wght(g, 'tacticCommitment_v1', 1) * (t.forced ? 1.5 : 1);
        if (!(C > 0)) return;
        const ownTw = v.ownTower && v.ownTower.hp > 0 ? v.ownTower : null;
        const nearOwnCube = tg => ownTw && tg && tg.x != null && Math.abs(tg.x - ownTw.x) + Math.abs(tg.y - ownTw.y) <= 3;
        for (const c of candidates) {
            if (c._objectiveWin || !(c.score > -900)) continue;
            const off = c.type === 'attack' || c.type === 'combo' || c.type === 'finisher'
                || (c.type === 'spell' && DMG_KINDS.has(c.spell?.kind));
            const healC = (c.type === 'spell' && HEAL_KINDS.has(c.spell?.kind))
                || (c.type === 'item_targeted' && /heal/i.test(String(c.item || '')));
            switch (t.job) {
                case 'siege':
                    if (c.type === 'attack_tower') c.score += 150 * C;
                    break;
                case 'search':
                    if (c.type === 'inspect') c.score += (c._keyPickup ? 60 : (c._searchEV > 0 ? Math.max(40 + 200 * Math.min(1, c._searchEV), _keyClockValue(g, unit, v, c._searchEV)) : 0)) * C;
                    else if (c.type === 'move' && c._searchMove) c.score += 40 * C;
                    else if (c.type === 'item' && c.item === 'scanner') c.score += 40 * C;
                    break;
                case 'intercept':
                    if (off && c.target && c.target.id != null && c.target.id === t.targetId) c.score += 140 * C;
                    else if (off && c.target && c.target.id != null && nearOwnCube(c.target)) c.score += 70 * C;
                    break;
                case 'anchor':
                    if (c.type === 'move' && ownTw && c.x != null) {
                        const dd = Math.abs(c.x - ownTw.x) + Math.abs(c.y - ownTw.y);
                        if (dd > 4) c.score -= 12 * (dd - 4) * C;
                    }
                    if (off && c.target && c.target.id != null && nearOwnCube(c.target)) c.score += 60 * C;
                    if (c.type === 'guard') c.score += 25 * C;
                    if (healC && c.score > 0) c.score += 30 * C;
                    break;
                case 'heal':
                    if (healC && c.score > 0) c.score = c.score * (1 + 0.5 * C) + 40 * C;
                    else if (off && c.score > 0) c.score *= Math.max(0.5, 1 - 0.15 * C);
                    break;
                case 'fight':
                    if (off && c.score > 0) c.score *= 1 + 0.08 * C;
                    break;
            }
        }
        // Search first, then act: Inspect costs 1 AP and does not end the turn, and AP does not carry over, so with
        // 2 AP a searcher whose best option is a one-AP action (hit, heal, item) loses nothing by scanning first.
        // (2026-10-23 browser check: the searcher always took the hit and never scanned.) THE KEYS (2026-11-01):
        // every unit does it now (_inspectFirst, rankCandidates); this stays as the kill-switch path.
        if (!_keySense() && t.job === 'search' && (unit.ap || 0) >= g.AP_COST_ACTION * 2) {
            let top = null, insp = null;
            for (const c of candidates) {
                if (!(c.score > -900)) continue;
                if (c.type === 'inspect') { if ((c._searchEV > 0 || c._keyPickup) && (!insp || c.score > insp.score)) insp = c; }
                else if (!top || c.score > top.score) top = c;
            }
            const oneAp = top && !top._objectiveWin && ['attack', 'spell', 'item', 'item_targeted'].includes(top.type)
                && (top.apCost != null ? top.apCost : g.AP_COST_ACTION) <= (unit.ap || 0) - g.AP_COST_ACTION;
            if (insp && oneAp && insp.score > 0 && insp.score < top.score) insp.score = top.score + 1;
        }
    }

    // Move-then-Inspect (Phase 2): walk to the tile whose Inspect footprint has the best Key odds, then scan
    // (the next AI loop's scoreInspect does the scan from there). Same budget as battle.js _inspectMoveBudget.
    function _searchMoveCandidate(g, unit, v, moveTiles, out) {
        if (window.EW_AI_NO_SEARCHMAP) return;
        if ((unit.ap || 0) < g.AP_COST_ACTION * 2 || (unit.movesThisTurn || 0) >= 1) return;
        if (typeof g.canUnitAct === 'function' && !g.canUnitAct(unit)) return;
        const sm = _searchMapFor(g, unit, unit.player);
        /* THE KEYS: a SEEN loose Key (a carrier dropped it where it died) is a sure find: walk to a square that can
           Inspect it, then pick it up (the next loop's scoreInspect), priced at what the Key is worth. */
        const seen = _keySense() ? (g.state.hourglasses || []).filter(h => h.carriedBy == null && h.visibleTo && h.visibleTo[unit.player]) : [];
        if ((!sm || !(sm.hidden > 0)) && !seen.length) return;
        const kv = seen.length ? _keyWorth(g, unit.player, 1, v) : 0;
        const skv = wght(g, 'searchKeyValue_v1', 285);
        let reach = 1;
        try { reach = (typeof getEffectiveInspect === 'function') ? getEffectiveInspect(unit) : (unit.inspect || 1); } catch (e) {}
        const evAt = new Map();
        // the value of an Inspect aimed at (x,y), in search-value units: the hidden odds + each seen Key at its worth
        const ev = (x, y) => { const k = x + y * g.bw(); if (!evAt.has(k)) {
            let e = (sm && sm.hidden > 0) ? _footprintEV(g, unit, sm, x, y) : 0;
            if (seen.length) { let fp; try { fp = g.getInspectFootprint(unit, x, y); } catch (er) { fp = [{ x, y }]; }
                const n = seen.filter(h => (fp || []).some(f => f.x === h.x && f.y === h.y)).length;
                if (n) e += n * Math.max(180, kv) / Math.max(1, skv); }
            evAt.set(k, e); } return evAt.get(k); };
        const bestFrom = (sx, sy, sz) => {
            let b = 0;
            for (let dy = -reach; dy <= reach; dy++) for (let dx = -reach; dx <= reach; dx++) {
                const x = sx + dx, y = sy + dy;
                if (x < 0 || y < 0 || x >= g.bw() || y >= g.bh()) continue;
                const e = ev(x, y);
                if (e <= b) continue;
                try { if (g.isRangeBlockedByTerrain(sx, sy, x, y, sz)) continue; } catch (er) {}
                b = e;
            }
            return b;
        };
        const here = bestFrom(unit.x, unit.y, unit.z);
        let best = null, bestEV = here + 0.02;
        for (const t of moveTiles) {
            if (t._jump || t._takeoff) continue;
            const e = bestFrom(t.x, t.y, t.z);
            if (e > bestEV) { bestEV = e; best = t; }
        }
        if (!best) return;
        let s = bestEV * skv * 0.9;
        // a seen Key that square can Inspect is a sure pickup: no fight discount
        const sure = seen.some(h => Math.max(Math.abs(h.x - best.x), Math.abs(h.y - best.y)) <= reach
            && !(function () { try { return g.isRangeBlockedByTerrain(best.x, best.y, h.x, h.y, best.z); } catch (er) { return false; } })());
        if (v.visibleEnemies.length > 0 && !sure) s *= _tacticOf(unit) === 'search' ? 0.75 : 0.3;
        if (s > 5) out.push({ type: 'move', x: best.x, y: best.y, z: best.z, score: s, _intent: 'search_move', _searchMove: true });
    }

    // What an Inspect aimed at (x,y) is worth, for the imitation preview's synthetic score (the CPU's own math).
    function _inspectScoreAt(g, unit, v, x, y) {
        let fp = [];
        try { fp = g.getInspectFootprint(unit, x, y) || []; } catch (e) {}
        const known = (g.state.hourglasses || []).filter(h => h.carriedBy == null && h.visibleTo && h.visibleTo[unit.player]
            && fp.some(f => f.x === h.x && f.y === h.y)).length;
        const sm = _searchMapFor(g, unit, unit.player);
        let s = (known && _keySense() ? Math.max(known * _keyFloor(g), _keyWorth(g, unit.player, known, v)) : known * 180) + (sm ? _footprintEV(g, unit, sm, x, y) * wght(g, 'searchKeyValue_v1', 285) : 0);
        if (!known && v.visibleEnemies.length > 0) s *= 0.3;
        return s;
    }

    /* THE HARD REPLY CHECK (Phase 4): Hard looks one reply ahead for its top five options — the worst thing a
       visible enemy that is still standing afterwards can do to one of ours (a kill = that ally's kill value,
       else half the damage). Options that remove the dangerous enemy, or step out of its reach, rise. */
    function _enemyReplyCost(g, unit, v, c) {
        let killedId = null;
        try {
            if ((c.type === 'attack' || c.type === 'spell') && c.target && c.target.id != null && c.target.hp != null
                && estDamage(g, unit, c.target, c.type === 'spell' ? c.spell : null) >= effHp(c.target)) killedId = c.target.id;
            if (c.type === 'finisher' && c.targetId != null) killedId = c.targetId;
        } catch (e) {}
        const endX = (c.type === 'move' && c.x != null) ? c.x : unit.x;
        const endY = (c.type === 'move' && c.y != null) ? c.y : unit.y;
        const ours = [{ u: unit, x: endX, y: endY }].concat((v.allies || []).filter(a => a && !a.dead && a.id !== unit.id).map(a => ({ u: a, x: a.x, y: a.y })));
        let worst = 0;
        for (const e of v.visibleEnemies) {
            if (!e || e.dead || e.id === killedId) continue;
            let mv = 2, rg = 1;
            try { mv = g.getEffectiveMove(e) || 2; } catch (er) {}
            try { rg = g.getEffectiveRange(e) || 1; } catch (er) {}
            const reach = mv + Math.ceil(mv / 2) + rg;
            for (const o of ours) {
                if (Math.abs(e.x - o.x) + Math.abs(e.y - o.y) > reach) continue;
                const dmg = unitThreatOutput(g, e, o.u);
                const val = dmg >= effHp(o.u) ? killValue(g, e, o.u, null) : dmg * 0.5;
                if (val > worst) worst = val;
            }
        }
        return worst;
    }
    function _hardReplyCheck(g, unit, v, candidates) {
        const f = wght(g, 'hardReplyFactor_v1', 0.5);
        if (!(f > 0)) return;
        const top = candidates.slice(0, 5).filter(c => c.score > 0 && !c._objectiveWin);
        if (top.length < 2) return;
        let min = Infinity;
        for (const c of top) { c._replyCost = _enemyReplyCost(g, unit, v, c); if (c._replyCost < min) min = c._replyCost; }
        for (const c of top) c.score -= f * (c._replyCost - min);
        candidates.sort((a, b) => Number(!!b._objectiveWin) - Number(!!a._objectiveWin) || b.score - a.score);
    }

    // ═════════════════════════════════════════════════════════════════════
    // MAIN LOOP — safety scaffolding kept from v3 (loop caps, stall
    // detection, failed-action memos); the decision pipeline is new:
    //   gather → per-candidate adjustments → end-tile danger → argmax
    //   (difficulty softmax on easy) → execute.
    // ═════════════════════════════════════════════════════════════════════

    window.aiTakeTurn = function (unit) {
        const g = G();
        if (!g) { console.error('GAME API not available'); return; }
        _aiActor = unit;

        if (!unit._aiLoopCount) unit._aiLoopCount = 0;
        unit._aiLoopCount++;
        if (unit._aiLoopCount > MAX_LOOPS) {
            console.warn(`AI safety: unit ${unit.id} exceeded ${MAX_LOOPS} loops. Force-ending turn.`);
            g.addLog(`${g.unitDisplayName(unit)} considers their options and ends their turn.`);
            unit.ap = 0;
            unit._aiLoopCount = 0;
            unit._aiStallCount = 0;
            g.state.actionMode = null;
            g.state.comboPartner = null;
            g.state.selectedTool = null;
            _faceNearestEnemy(unit, g);
            g.finishComputerAction();
            return;
        }

        const currentAp = unit.ap || 0;
        const currentPos = g.posKey(unit.x, unit.y);
        const apChanged = unit._aiLoopCount <= 1 || currentAp !== unit._aiLastAp;
        const posChanged = unit._aiLoopCount <= 1 || currentPos !== unit._aiLastPos;
        if (!apChanged && !posChanged) {
            unit._aiStallCount = (unit._aiStallCount || 0) + 1;
            if (unit._aiStallCount >= 3) {
                console.warn(`AI stall: unit ${unit.id} stuck at ${currentAp} AP. Force-ending.`);
                g.addLog(`${g.unitDisplayName(unit)} finds no viable action and ends their turn.`);
                unit.ap = 0;
                unit._aiLoopCount = 0;
                unit._aiStallCount = 0;
                g.state.actionMode = null;
                g.state.comboPartner = null;
                g.state.selectedTool = null;
                _faceNearestEnemy(unit, g);
                g.finishComputerAction();
                return;
            }
            _skipAttack = true;
            _skipTowerAttack = true;
        } else {
            unit._aiStallCount = 0;
        }
        unit._aiLastAp = currentAp;
        unit._aiLastPos = currentPos;

        if (unit._aiLoopCount === 1) {
            _failedSpells = new Set();
            _failedCombos = new Set();
            _skipAttack = false;
            _skipTowerAttack = false;
            _skipMove = false;
            _skipJump = false;
            _failedNexus = false;
            _failedItems = new Set();
            _skipClimb = false;
            _turnActionLog = [];
            _outputCache = new Map();
            _fcCache = new Map();
            unit._aiStallCount = 0;
        }

        g.focusUnitPanel(unit.id);
        if (g.state.autoPlayers?.[unit.player]) g.scheduleBoardRender();
        if (!g.state.cameraDisabled && !g.devAutoSim && g._shouldCameraFollowUnit(unit)) {
            g.focusBoardCameraOnTiles([{ x: unit.x, y: unit.y }], {
                holdMs: 99999, persist: true, transitionMs: 500,
                _fogAllowed: true
            });
        }

        _fcCache = new Map();   // THE FORECAST ORACLE: read again from where the unit stands now
        _pushPlanCache = new Map();   // THE PUSH LANDING: every body may have moved since the last read
        const vision = buildVision(unit);
        // THE TACTICS (2026-10-23): the side's per-round plan (a no-op once planned this round)
        _ensureTacticPlan(g, unit, vision);
        const _ranked = rankCandidates(unit, vision);
        const candidates = _ranked.candidates;
        let best = _ranked.best;

        // Gauntlet: a badly-hurt unit retreats to the bench, sending in a
        // fresh reserve (which then acts with the leftover AP).
        // Reserves matches (battle.js _benchOn) share the retreat; there the
        // per-round cap (_switchesLeft) and a reserve promised to a dead seat
        // (the free list) gate it too.
        if (!best?._objectiveWin && unit._aiLoopCount === 1 && typeof window._benchOn === 'function' && window._benchOn()) {
            const mpm = typeof window.getActiveMultiplayerMode === 'function' ? window.getActiveMultiplayerMode() : null;
            const _resv = typeof window._isReservesMatch === 'function' && window._isReservesMatch();
            const switchCost = (_resv && typeof RESERVE_RULES !== 'undefined' && RESERVE_RULES.switchApCost) || (mpm && mpm.switchApCost) || 2;
            const reserves = typeof window._gauntletReserves === 'function' ? window._gauntletReserves(unit.player, { free: true }) : [];
            const capLeft = typeof window._switchesLeft === 'function' ? window._switchesLeft(unit.player) : Infinity;
            const hpPct = unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
            if ((unit.ap || 0) >= switchCost && hpPct < 0.30 && reserves.length && capLeft > 0) {
                const healthy = reserves.slice().sort((a, b) => (b.hp / b.maxHp) - (a.hp / a.maxHp))[0];
                if (healthy && (healthy.hp / healthy.maxHp) >= 0.70
                    && typeof window.doSwitch === 'function' && window.doSwitch(unit, healthy.id)) {
                    unit._aiLoopCount = 0;
                    g.finishComputerAction();
                    return;
                }
            }
        }


        if (window.EW_AI_DEBUG) {
            console.log(`[AI] ${g.unitDisplayName(unit)} candidates:`,
                candidates.slice(0, 6).map(c => ({
                    type: c.type, spell: c.spell?.name, target: c.target?.id ?? (c.x != null ? c.x + ',' + c.y : ''),
                    score: Math.round(c.score), danger: Math.round(c._dangerCost || 0), intent: c._intent,
                })));
        }

        // Easy CPU: sample softmax-randomly among the top few viable
        // candidates — mistakes look like impatience, not dice.
        const _diffPick = _aiDiff();
        if (_diffPick.pickTopN > 1 && best && best.score > 0) {
            const pool = candidates.slice(0, _diffPick.pickTopN).filter(c => c.score > 0 && (!best._objectiveWin || c._objectiveWin));
            if (pool.length > 1) {
                const t = Math.max(1, _diffPick.softmaxT);
                const w = pool.map(c => Math.exp((c.score - pool[0].score) / t));
                let r = g.engineRng() * w.reduce((a, b) => a + b, 0);
                for (let i = 0; i < pool.length; i++) {
                    r -= w[i];
                    if (r <= 0) { best = pool[i]; break; }
                }
            }
        }

        // ── fallbacks: nothing scored above zero ──
        if (!best || best.score <= 0) {
            if (!_skipMove && g.canUnitMove(unit)) {
                const moveTiles = _aiMoveTiles(g, unit);
                if (moveTiles.length > 0) {
                    // Safest fresh tile that still makes PROGRESS — idle units
                    // drift toward the enemy tower (or mid) instead of the
                    // corner shuffle the sim logs were full of.
                    const recent = new Set(unit._aiRecentTiles || []);
                    const _obj = (vision.enemyTower && vision.enemyTower.hp > 0)
                        ? vision.enemyTower
                        : { x: Math.floor(g.bw() / 2), y: Math.floor(g.bh() / 2) };
                    let pick = null, pickCost = Infinity;
                    for (const t of moveTiles) {
                        if (t.x === unit.x && t.y === unit.y && (t.z == null || t.z === unit.z)) continue;   // 2026-11-01: a "move" onto its own square spent the AP doing nothing
                        const cost = tileDangerCost(g, unit, vision, t.x, t.y, t.z)
                            + (recent.has(g.posKey(t.x, t.y)) ? 40 : 0)
                            + (Math.abs(t.x - _obj.x) + Math.abs(t.y - _obj.y)) * 3;
                        if (cost < pickCost) { pickCost = cost; pick = t; }
                    }
                    if (pick) best = { type: 'move', x: pick.x, y: pick.y, z: pick.z, score: 1 };
                }
            }
            // 🦘 boxed in (no walk at all): the same pick over the squares a Jump lands on
            if ((!best || best.score <= 0) && !(!_skipMove && g.canUnitMove(unit) && _aiMoveTiles(g, unit).length)) {
                const jt = _aiJumpTiles(g, unit);
                if (jt.length) {
                    const recent = new Set(unit._aiRecentTiles || []);
                    const _obj = (vision.enemyTower && vision.enemyTower.hp > 0)
                        ? vision.enemyTower
                        : { x: Math.floor(g.bw() / 2), y: Math.floor(g.bh() / 2) };
                    const here = Math.abs(unit.x - _obj.x) + Math.abs(unit.y - _obj.y);
                    let pick = null, pickCost = Infinity;
                    for (const t of jt) {
                        const dd = Math.abs(t.x - _obj.x) + Math.abs(t.y - _obj.y);
                        if (dd >= here) continue;   // only a leap that gets somewhere
                        const cost = tileDangerCost(g, unit, vision, t.x, t.y, t.z) + t._jumpFall
                            + (recent.has(g.posKey(t.x, t.y)) ? 40 : 0) + dd * 3;
                        if (cost < pickCost) { pickCost = cost; pick = t; }
                    }
                    if (pick) best = { type: 'move', x: pick.x, y: pick.y, z: pick.z, score: 1, _jump: true };
                }
            }
            if (!best || best.score <= 0) {
                if ((unit.ap || 0) >= g.AP_COST_ACTION) {
                    const inspTiles = g.getInspectTiles(unit);
                    if (inspTiles.length > 0) {
                        const unscanned = inspTiles.filter(t =>
                            !_aiSearched(g.state, unit.player).has(g.scanKey(t.x, t.y))
                        );
                        const pool = unscanned.length > 0 ? unscanned : inspTiles;
                        const pick = pool[Math.floor(g.engineRng() * pool.length)];
                        best = { type: 'inspect', x: pick.x, y: pick.y, score: 1 };
                    }
                }
            }
            if (!best || best.score <= 0) {
                if ((unit.ap || 0) >= 2) best = { type: 'guard', score: 1 };
            }
            if (!best || best.score <= 0) {
                unit.ap = 0;
                unit._aiLoopCount = 0;
                g.state.actionMode = null;
                g.state.comboPartner = null;
                g.state.selectedTool = null;
                _faceNearestEnemy(unit, g);
                g.finishComputerAction();
                return;
            }
        }

        logAction(best);

        // Focus-fire memory: record what we EXPECT to land (oracle truth).
        if (best.type === 'attack' && best.target && best.target.id) {
            recordTeamDamage(best.target.id, estDamage(g, unit, best.target, null));
        }
        if (best.type === 'spell' && best.target && best.target.id && DMG_KINDS.has(best.spell?.kind)) {
            recordTeamDamage(best.target.id, estDamage(g, unit, best.target, best.spell));
        }

        executeAction(unit, best, vision);
    };

    // ═════════════════════════════════════════════════════════════════════
    // RANKING — gather → per-candidate adjustments → end-tile danger →
    // sort → kill rule. Shared by aiTakeTurn and the imitation preview
    // (aiScoreMargin below), so "what would the CPU do here?" is answered
    // by exactly the code that decides it.
    // ═════════════════════════════════════════════════════════════════════
    /* SETUP FIRST (THE DEAD SLOTS, 2026-10-25): a buff, a status-only debuff, a shield, a weather call costs its AP and
       keeps the turn; the hit costs 1 AP and ends it; AP does not carry over. So with the AP for both, the support cast
       before the hit loses nothing, yet the ranking took the hit (it scores higher) and the turn ended with the setup
       unused: 95 fielded spells had 0 casts in 840 lab matches. When the best option is a turn-ending act from where we
       stand and a positive setup cast still leaves the AP and MP for it, the setup goes first (the next loop takes the
       hit). Casts that move the caster are left out: the hit was picked from this tile. Same idea as Search first. */
    const _SETUP_MOVES_CASTER = new Set(['teleport', 'escape', 'swap', 'dash', 'utility', 'transform', 'doorExit']);
    function _setupFirst(g, unit, candidates) {
        const ap = unit.ap || 0, one = g.AP_COST_ACTION || 1;
        if (ap < one * 2 || !g.TargetQuery || typeof g.TargetQuery.spellEndsTurn !== 'function') return;
        if (typeof _isClashMode === 'function' && _isClashMode()) return;   // Clash: any paid act ends the turn
        let top = null;
        for (const c of candidates) if (c.score > -900 && (!top || c.score > top.score)) top = c;
        if (!top || top._objectiveWin) return;
        const topSpell = top.type === 'spell' ? top.spell : null;
        if (!(top.type === 'attack' || (topSpell && g.TargetQuery.spellEndsTurn(topSpell)))) return;
        const topAp = topSpell ? (top.apCost != null ? top.apCost : one) : one;
        const topMp = topSpell ? _mpCost(unit, topSpell) : 0;
        let setup = null;
        for (const c of candidates) {
            if (c.type !== 'spell' || !c.spell || c === top || !(c.score > 0)) continue;
            if (g.TargetQuery.spellEndsTurn(c.spell) || _SETUP_MOVES_CASTER.has(c.spell.kind)) continue;
            // a trap laid under an enemy springs and ends the turn (THE CONTACT TRAP): not a setup
            if (c.spell.kind === 'placeTrap' && c.target && _trapContactVictims(g, unit, _trapFootTiles(g, c.spell, c.target.x, c.target.y, unit)).length) continue;
            if ((c.apCost != null ? c.apCost : one) + topAp > ap) continue;
            if ((unit.mp || 0) - _mpCost(unit, c.spell) < topMp) continue;
            if (!setup || c.score > setup.score) setup = c;
        }
        if (setup) setup.score = top.score + 1;
    }

    /* THE KEYS — INSPECT FIRST (2026-11-01): Search first for EVERY unit, not only the one on the Search Tactic. With the
       AP for both, an Inspect before a one-AP act from this square (a hit, a heal, an item) costs nothing (AP does not
       carry over, and the hit ends the turn anyway), so a seen Key in reach is always picked up and a free scan is
       never thrown away. Nothing changes when the top option keeps the turn, needs the AP the Inspect would take, or
       moves us, or on Easy. */
    function _inspectFirst(g, unit, candidates) {
        if (!_keySense() || !_aiDiff().jointSearch) return;
        const one = g.AP_COST_ACTION || 1;
        if ((unit.ap || 0) < one * 2) return;
        if (typeof _isClashMode === 'function' && _isClashMode()) return;   // Clash: any paid act ends the turn
        let top = null, insp = null;
        for (const c of candidates) {
            if (!(c.score > -900)) continue;
            if (c.type === 'inspect') { if ((c._searchEV > 0 || c._keyPickup) && (!insp || c.score > insp.score)) insp = c; }
            else if (!top || c.score > top.score) top = c;
        }
        if (!insp || !top || top._objectiveWin || !(insp.score > 0) || insp.score >= top.score) return;
        // only before an act that ENDS the turn (a basic attack, a Cube hit, a turn-ending spell): before anything else
        // the scan could take the AP the follow-up needs
        if (top.type === 'spell') {
            if (!top.spell || _SETUP_MOVES_CASTER.has(top.spell.kind) || !g.TargetQuery
                || typeof g.TargetQuery.spellEndsTurn !== 'function' || !g.TargetQuery.spellEndsTurn(top.spell)) return;
        } else if (top.type !== 'attack' && top.type !== 'attack_tower') return;
        if ((top.apCost != null ? top.apCost : one) > (unit.ap || 0) - one) return;
        insp.score = top.score + 1;
    }

    /* THE STATUS COMBOS — COMBO FIRST (2026-11-01, mondo). See the block above _bvsIds. The top option is a finisher
       on a target that lacks its status and it would not kill without the bonus: if this unit can put that status on
       that target now (a setup cast from here, aimed at it), the setup goes first. A setup that keeps the turn leaves
       the AP + MP for the finisher this turn; one that ends the turn waits for a status that lasts into next round, or
       for a teammate still to act this round who carries a finisher for it. Nothing to set it up with = no change. */
    const _comboHold = new Map();   // unit id → 'finisherId|targetId|round' of the last wait (never wait twice on one)
    const _COMBO_SINGLE_KINDS = new Set(['damage', 'ricochet', 'debuff', 'multiHit', 'lifeDrain', 'tackle']);
    // Which enemies does setup candidate c put its statuses on? (ids)
    function _setupVictimIds(g, unit, c, v) {
        const sp = c.spell, t = c.target, ids = new Set();
        if (!sp) return ids;
        const kind = sp.kind;
        const enemies = (v.visibleEnemies || []).filter(e => !e.dead && !isProtected(g, e));
        try {
            if ((kind === 'aoe' || kind === 'zoneDebuff') && (t || sp.aoeOriginSelf)) {
                const cx = sp.aoeOriginSelf ? unit.x : t.x, cy = sp.aoeOriginSelf ? unit.y : t.y;
                const area = getSpellAoeAreaAI(sp, cx, cy);
                for (const e of enemies) if (area.some(a => a.x === e.x && a.y === e.y)) ids.add(e.id);
            } else if (kind === 'cross') {
                const cx = sp.aoeOriginSelf || !t ? unit.x : t.x, cy = sp.aoeOriginSelf || !t ? unit.y : t.y;
                const tiles = _crossFootprintAI(sp, cx, cy);
                for (const e of enemies) if (tiles.some(a => a.x === e.x && a.y === e.y)) ids.add(e.id);
            } else if (kind === 'barrage') {
                const R = (sp.aoeOriginSelf && sp.aoeRadius) ? sp.aoeRadius : _effRange(unit, sp);
                const srcZ = standH(g, unit), longR = _isLongRange(sp);
                for (const e of enemies) {
                    if (sp.hitsWetOnly && !(typeof g._isWetTile === 'function' && g._isWetTile(e.x, e.y))) continue;
                    const d = _reach(g, unit.x, unit.y, srcZ, e, longR);
                    if (d >= 1 && d <= R && (sp.ignoresLineOfSight || !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y))) ids.add(e.id);
                }
            } else if ((kind === 'line' || kind === 'linePush') && t) {
                const dx = Math.sign(t.x - unit.x), dy = Math.sign(t.y - unit.y);
                if (dx || dy) {
                    const tiles = _lineFootprintAI(g, unit, sp, dx, dy);
                    for (const e of enemies) {
                        if (tiles.some(a => a.x === e.x && a.y === e.y) && _lineBeamHitsAI(g, unit, sp, dx, dy, t, e)) ids.add(e.id);
                    }
                }
            } else if (t && t.id != null) {
                ids.add(t.id);
            }
        } catch (e) {}
        return ids;
    }
    // A single-target setup re-aimed at the finisher's target (the picker chose someone else), or null.
    function _comboRetarget(g, unit, c, T, v) {
        const sp = c.spell;
        if (!_COMBO_SINGLE_KINDS.has(sp.kind) || _riderRandomOf(sp) || isProtected(g, T)) return null;
        const d = _reach(g, unit.x, unit.y, standH(g, unit), T, _isLongRange(sp));
        if (d < 1 || d > _effRange(unit, sp)) return null;
        if (!sp.ignoresLineOfSight && g.isRangeBlockedByTerrain(unit.x, unit.y, T.x, T.y)) return null;
        if (_AIM_CHECKED_KINDS.has(sp.kind) && typeof window.spellAimProblem === 'function') {
            try { if (window.spellAimProblem(unit, sp, T.x, T.y, T.z) !== null) return null; } catch (e) { return null; }
        }
        _openKillTally();
        let sc = 0;
        try { sc = scoreSpell(unit, sp, T, v); } catch (e) { sc = 0; }
        const wb = _closeKillTally(g);
        if (sc > 0) sc += wb;
        const cf = _capSpellFeeds(g, unit, sp, T);
        if (cf === Infinity) return null;
        sc -= cf + _mpCost(unit, sp) * tuneW(g, 'mpValuePerPoint');
        return { type: 'spell', spell: sp, target: T, apCost: c.apCost, score: sc, partner: null };
    }
    // A teammate still to act this round who carries a finisher for `statusId` and can reach T.
    function _mateCollects(g, unit, T, statusId) {
        for (const mate of g.state.units) {
            if (!mate || mate.dead || mate.hp <= 0 || mate.player !== unit.player || mate.id === unit.id || !((mate.ap || 0) > 0)) continue;
            for (const sp of (mate.spells || [])) {
                const ids = _bvsIds(sp);
                if (!ids || !_statusFeeds(statusId, ids) || (mate.mp || 0) < _mpCost(mate, sp)) continue;
                let er = sp.range || 1, em = 2;
                try { er = g.getEffectiveSpellRange(mate, sp) || er; } catch (e) {}
                try { em = g.getEffectiveMove(mate) || (mate.move || 2); } catch (e) {}
                if (_dist(g, mate.x, mate.y, mate.z, T) <= em + er) return true;
            }
        }
        return false;
    }
    function _comboFirst(g, unit, v, candidates) {
        if (!_aiDiff().combos || window.EW_AI_NO_STATUS_COMBOS || !g.TargetQuery) return;
        let top = null;
        for (const c of candidates) if (c.score > -900 && (!top || c.score > top.score)) top = c;
        if (!top || top._objectiveWin || top.type !== 'spell' || !top.spell || !DMG_KINDS.has(top.spell.kind)) return;
        const F = top.spell, ids = _bvsIds(F), T = top.target;
        if (!ids || !T || T.id == null || T.dead || T.player === unit.player) return;
        if (_bonusVsMatches(T, F.bonusVsStatus)) return;               // already set up: cash it in
        if (estDamage(g, unit, T, F) >= effHp(T)) return;               // kills without the bonus: just cast it
        const round = g.state.round || 0;
        const holdKey = F.id + '|' + T.id;
        const prev = _comboHold.get(unit.id);
        if (prev && prev.key === holdKey && prev.round === round - 1) return;   // waited on this one last round and it didn't take: cast it
        const one = g.AP_COST_ACTION || 1, ap = unit.ap || 0;
        const clash = typeof _isClashMode === 'function' && _isClashMode();
        const fAp = top.apCost != null ? top.apCost : one, fMp = _mpCost(unit, F);
        let best = null, bestRaw = -Infinity;
        const extra = [];
        for (const c0 of candidates) {
            if (c0 === top || c0.type !== 'spell' || !c0.spell || c0.spell === F || !(c0.score > -900)) continue;
            const S = c0.spell;
            if (_SETUP_MOVES_CASTER.has(S.kind) || countPriorUses('spell', S.id) > 0) continue;
            const eff = _setupEffectFor(S, ids);
            if (!eff || (eff.chance != null ? eff.chance : 0.9) < 0.5 || !_setupCanStick(g, T, eff.id)) continue;
            const sAp = c0.apCost != null ? c0.apCost : one, sMp = _mpCost(unit, S);
            if (sAp > ap || (unit.mp || 0) < sMp) continue;
            let c = c0;
            if (!_setupVictimIds(g, unit, c0, v).has(T.id)) {
                c = _comboRetarget(g, unit, c0, T, v);
                if (!c) continue;
                c._dangerCost = top._dangerCost || 0;
                c.score -= c._dangerCost;
                c._stayPut = true;
            }
            const raw = c.score + (c._dangerCost || 0);
            if (!(raw > 0)) continue;
            const keeps = !clash && !g.TargetQuery.spellEndsTurn(S);
            const sameTurn = keeps && sAp + fAp <= ap && (unit.mp || 0) - sMp >= fMp;
            if (!sameTurn) {
                const lasts = (eff.duration || 1) >= 2 || (T.ap || 0) <= 0;
                const selfNext = lasts && (unit.mp || 0) - sMp >= fMp;
                const mate = _mateCollects(g, unit, T, eff.id);
                if (!selfNext && !mate) continue;
                /* The setup ends the turn, so the finisher waits. Over two turns: setup now + finisher with the bonus
                   next turn, against finisher now + (the setup, or the finisher again) next turn. When the finisher can
                   NOT be cast twice in a row (a cooldown, or the MP for one cast only), the setup line is ahead by the
                   bonus: setup first. When it can, the setup goes first only if setup + the bonus it unlocks beats the
                   finisher's hit now. */
                const fRaw = top.score + (top._dangerCost || 0);
                const repeat = !((F.cooldownRounds || 0) > 0) && (unit.mp || 0) - fMp >= fMp;
                if (repeat && raw < fRaw) continue;   // the setup's score already carries the bonus it unlocks (statusSetupValue)
            }
            if (raw > bestRaw) { bestRaw = raw; best = c; }
            if (c !== c0) extra.push(c);
        }
        if (!best) return;
        if (extra.includes(best)) candidates.push(best);
        best.score = top.score + 1;
        best._comboSetup = F.name;
        _comboHold.set(unit.id, { key: holdKey, round });
    }

    /* THE TEAM PLAY — THE FINISHER WAITS (2026-11-01, Batch C gap 7: "a finisher acting before its setup teammate casts
       without the bonus"). Turn order is fixed by SPD, so nobody can delay; existing rules only. The top option is a
       finisher on a target without its status that would not kill anyway, and a teammate still to act THIS round can
       put that status on it, one that lasts into next round (2+ rounds, or the target has already had its turn by
       then). If the finisher can be cast again next round (no cooldown, MP for two), it is cast now as before: both
       lines get the bonus next round. If it cannot, this unit does its next best thing now and keeps the finisher for
       next round. Over two rounds the wait is ahead by the bonus when the setup lands (chance p) and behind by
       (finisher - alternative) now; next round is worth 0.75 of now (either body may be gone), so it waits when
       3 x p x bonus > finisher - alternative. The alternative must be a real action (score > 0) that keeps the target
       within walk + range and leaves the MP for the finisher; it never waits twice in a row on the same target. The teammate then credits its setup with
       this unit's cash-in at 0.8 (statusSetupValue). Kill-switch: window.EW_AI_NO_COMBO_WAIT. */
    const _comboWaitFor = new Map();    // unit id → { T: target id, round } while it keeps a finisher for a teammate's setup
    const _comboWaitHold = new Map();   // unit id → { key: 'finisherId|targetId', round } of its last wait
    // The best chance that a teammate still to act this round puts a status feeding `ids` on T, lasting into next round.
    function _mateSetsUp(g, unit, T, ids) {
        const order = g.blitzTurnOrderIds || [];
        const round = g.state.round || 0;
        const tActed = T._turnRound === round || !((T.ap || 0) > 0);
        let best = 0;
        for (const mate of g.state.units) {
            if (!mate || mate.player !== unit.player || mate.id === unit.id || !_stillToAct(g, mate)) continue;
            try { if (g.unitHasStatus(mate, 'silence')) continue; } catch (e) {}
            for (const sp of (mate.spells || [])) {
                if (!sp || sp.bonusVsStatus) continue;   // a finisher is no setup (no self-combo)
                const eff = _setupEffectFor(sp, ids);
                const ch = eff ? (eff.chance != null ? eff.chance : 0.9) : 0;
                if (!eff || ch < 0.5 || !_setupCanStick(g, T, eff.id)) continue;
                if ((mate.mp || 0) < _mpCost(mate, sp)) continue;
                try { if (!g.TargetQuery.canAfford(mate, sp)) continue; } catch (e) {}
                const lasts = (eff.duration || 1) >= 2 || tActed
                    || (order.indexOf(T.id) >= 0 && order.indexOf(T.id) < order.indexOf(mate.id));
                if (!lasts) continue;
                let er = sp.range || 1, em = 2;
                try { er = g.getEffectiveSpellRange(mate, sp) || er; } catch (e) {}
                try { em = g.getEffectiveMove(mate) || (mate.move || 2); } catch (e) {}
                er += (sp.aoeRadius || 0);
                const d = _dist(g, mate.x, mate.y, mate.z, T);
                if (d > em + er) continue;
                best = Math.max(best, ch * (d <= er ? 0.75 : 0.6));
            }
        }
        return best;
    }
    function _comboWait(g, unit, v, candidates) {
        if (!_aiDiff().combos || window.EW_AI_NO_STATUS_COMBOS || window.EW_AI_NO_COMBO_WAIT || !g.TargetQuery) return;
        let top = null;
        for (const c of candidates) if (c.score > -900 && (!top || c.score > top.score)) top = c;
        if (!top || top._objectiveWin || top._comboSetup || top.type !== 'spell' || !top.spell || !DMG_KINDS.has(top.spell.kind)) return;
        const F = top.spell, ids = _bvsIds(F), T = top.target;
        if (!ids || !T || T.id == null || T.dead || T.player === unit.player) return;
        if (_bonusVsMatches(T, F.bonusVsStatus)) return;               // already set up: cash it in
        if (estDamage(g, unit, T, F) >= effHp(T)) return;               // kills without the bonus: just cast it
        const fMp = _mpCost(unit, F);
        if (!((F.cooldownRounds || 0) > 0) && (unit.mp || 0) - fMp >= fMp) return;   // it can be cast again next round
        const round = g.state.round || 0, key = F.id + '|' + T.id;
        const prev = _comboWaitHold.get(unit.id);
        if (prev && prev.key === key && prev.round === round - 1) return;   // waited on this one last round: cast it
        const p = _mateSetsUp(g, unit, T, ids);
        if (!(p > 0)) return;
        const gain = _comboGain(g, unit, F, T, v, true);
        if (!(gain > 0)) return;
        let er = F.range || 1, em = 2;
        try { er = g.getEffectiveSpellRange(unit, F) || er; } catch (e) {}
        try { em = g.getEffectiveMove(unit) || (unit.move || 2); } catch (e) {}
        let alt = null;
        for (const c of candidates) {
            if (c === top || !(c.score > 0) || (c.spell && c.spell.id === F.id)) continue;
            if (c.spell && (unit.mp || 0) - _mpCost(unit, c.spell) < fMp) continue;   // it must leave the MP for the finisher it keeps
            if (c.type === 'move' && c.x != null && Math.abs(c.x - T.x) + Math.abs(c.y - T.y) > em + er) continue;
            if (!alt || c.score > alt.score) alt = c;
        }
        if (!alt || !(3 * p * gain > top.score - alt.score)) return;
        alt.score = top.score + 1;
        alt._comboWait = F.name;
        _comboWaitFor.set(unit.id, { T: T.id, round });
        _comboWaitHold.set(unit.id, { key, round });
    }

    function rankCandidates(unit, vision) {
        const g = G();
        const candidates = gatherCandidates(unit, vision);

        // ── per-candidate adjustments ──
        const _owC = wght(g, 'overwatchCaution_v1', 1);   // THE TRAINABLE FIXES (2026-11-01): × the Overwatch read
        for (const c of candidates) {
            // A projected objective win ends the match before future exposure.
            if (c._objectiveWin) continue;
            // Repeat dampening: damage spells may repeat within an
            // activation (press refunds make double-casts legal); utility
            // kinds clamp hard so the AI doesn't loop self-buffs.
            if (c.type === 'spell' && c.spell) {
                const priorUses = countPriorUses('spell', c.spell.id);
                if (DMG_KINDS.has(c.spell.kind)) {
                    if (priorUses >= 3) { c.score = -999; continue; }
                    if (priorUses >= 1) c.score *= Math.pow(0.65, priorUses);
                } else {
                    if (priorUses >= 2) { c.score = -999; continue; }
                    if (priorUses >= 1) c.score *= 0.15;
                }
                const nonRepeatableKinds = ['swap', 'terrainCreate', 'summonWeather', 'deployObject', 'summonUnit',
                    'deployPair', 'warpRune', 'remoteView', 'scan', 'encore',
                    'placeTrap', 'placeBlock', 'buildStructure', 'tuneFrequency', 'pulseLattice'];
                if (nonRepeatableKinds.includes(c.spell.kind) && hasUsedSpellKind(c.spell.kind)) {
                    c.score *= 0.1;
                }
            }
            // Target spreading — but never away from a nearly-dead enemy.
            if (c.target?.id) {
                const priorTargets = countPriorTargeting(c.target.id);
                const _finishing = typeof c.target.hp === 'number' && typeof c.target.maxHp === 'number'
                    && c.target.hp / c.target.maxHp <= 0.45;
                if (!_finishing) {
                    if (priorTargets >= 2) c.score *= 0.45;
                    else if (priorTargets >= 1) c.score *= 0.75;
                }
            }
            // End-tile danger: every candidate ends the activation
            // somewhere — charge that tile's real threat. (Moves end on
            // their destination; everything else ends where we stand.)
            if (c._noDanger) continue;
            let endX = (c.type === 'move' && c.x != null) ? c.x : unit.x;
            let endY = (c.type === 'move' && c.y != null) ? c.y : unit.y;
            let endZ = (c.type === 'move' && c.z != null) ? c.z : unit.z;
            /* THE DEAD SLOTS (2026-10-25): a blink or an escape ends the activation where it LANDS, but it was charged
               the danger of the tile it leaves, the very danger it exists to get out of (hurt-blink 200 minus a
               deadly tile = never cast). Charge the landing; an escape that cloaks or Protects is hard to hit there. */
            let _cloak = 1;
            if (c._endAt) { endX = c._endAt.x; endY = c._endAt.y; endZ = c._endAt.z; }   // THE FULL LIST: a sprint / blink ends where it lands
            /* THE WAY OUT (2026-11-01): a swap ends on its partner's square, a Grapple reel where the rope lands it (both
               were charged the square they leave) */
            else if (!window.EW_AI_NO_WAY_OUT && c.type === 'spell' && c.spell && c.spell.kind === 'swap' && c.target && c.target.id != null && c.target.x != null) {
                endX = c.target.x; endY = c.target.y; endZ = c.target.z;
            } else if (!window.EW_AI_NO_WAY_OUT && c.type === 'spell' && c.spell && typeof window.isGrappleReel === 'function' && window.isGrappleReel(c.spell)
                && c.target && c.target.x != null && typeof window.grappleLandingFor === 'function') {
                const _gl = window.grappleLandingFor(unit, c.target.x, c.target.y, { viewer: unit.player });
                if (_gl) { endX = _gl.x; endY = _gl.y; endZ = typeof g.getHeightAt === 'function' ? g.getHeightAt(endX, endY) : undefined; }
            }
            else if (c.type === 'spell' && c.spell && c.spell.kind === 'teleport' && c.target && c.target.id == null && c.target.x != null) {
                endX = c.target.x; endY = c.target.y; endZ = typeof g.getHeightAt === 'function' ? g.getHeightAt(endX, endY) : undefined;
            } else if (c.type === 'spell' && c.spell && c.spell.kind === 'escape' && typeof window.escapeLandingTile === 'function') {
                const _lt = window.escapeLandingTile(unit, c.spell);
                if (_lt) { endX = _lt.x; endY = _lt.y; endZ = typeof g.getHeightAt === 'function' ? g.getHeightAt(endX, endY) : undefined; }
                if ((c.spell.statusEffects || []).some(e => e && (e.id === 'invisible' || e.id === 'protect'))) _cloak = 0.3;
            }
            if (c._dangerCost == null) c._dangerCost = tileDangerCost(g, unit, vision, endX, endY, endZ) * _cloak;
            c._stayPut = c.type !== 'move' && endX === unit.x && endY === unit.y;
            c.score -= c._dangerCost;
            if (c.type === 'move' && c.x != null && !c._jump) c.score -= _oppAttackCost(g, unit, c.x, c.y);   // a jump draws no opportunity attack (battle.js: only finishMoveAt checks)
            // OVERWATCH: a walk or a run that stops in a Guarding enemy's range eats its reaction shot
            if (c.type === 'move' && c.x != null) c.score -= _overwatchCost(g, unit, c.x, c.y, c.z) * _owC;
            else if (c._endAt && c.spell && c.spell.kind === 'dash') c.score -= _overwatchCost(g, unit, c._endAt.x, c._endAt.y, c._endAt.z) * _owC;
        }

        // THE TACTICS (2026-10-23): the unit's Tactic weighs its matching options.
        _applyTactic(g, unit, vision, candidates);
        _setupFirst(g, unit, candidates);
        _comboFirst(g, unit, vision, candidates);
        _comboWait(g, unit, vision, candidates);
        _trapAfterWalk(g, unit, candidates);
        _inspectFirst(g, unit, candidates);

        candidates.sort((a, b) => Number(!!b._objectiveWin) - Number(!!a._objectiveWin) || b.score - a.score);
        /* THE IDLE GUARD (2026-11-01, mondo: "it will literally just do nothing in the corner or on the edge"): Guard
           skips the end-square danger charge (_noDanger) that every other option taken from the same square pays, so
           on a hot square Guard beat a real hit by that whole charge. CPU vs CPU logs: 130 of 206 Guards were picked
           over a hit from the same square worth more (an enemy right beside a unit on the map edge, and it guarded).
           Both stay on this square, so weigh them without that charge: the better hit is taken instead. */
        if (candidates[0] && candidates[0].type === 'guard' && !candidates[0]._objectiveWin) {
            const guard = candidates[0];
            let hit = null, hitRaw = guard.score;
            for (const c of candidates) {
                if (!c._stayPut || !(c.score > -900)) continue;
                const off = c.type === 'attack' || c.type === 'attack_tower' || c.type === 'combo' || c.type === 'finisher'
                    || (c.type === 'spell' && DMG_KINDS.has(c.spell?.kind));
                if (!off) continue;
                const raw = c.score + (c._dangerCost || 0);
                if (raw > hitRaw) { hitRaw = raw; hit = c; }
            }
            if (hit) {
                hit.score = hitRaw;
                candidates.sort((a, b) => Number(!!b._objectiveWin) - Number(!!a._objectiveWin) || b.score - a.score);
            }
        }
        // Hard looks one enemy reply ahead for its top options (Phase 4).
        if (_actorDiffKey() === 'hard' && candidates.length > 1 && !candidates[0]._objectiveWin) _hardReplyCheck(g, unit, vision, candidates);
        let best = candidates[0];

        // FE rule: kills trump accumulated niceness. If a confirmed kill is
        // anywhere near the best candidate's score, take the kill — removed
        // units stop doing damage; "nice position" doesn't.
        if (best && best.score > 0 && !best._objectiveWin) {
            for (const c of candidates.slice(0, 12)) {
                if (c.score <= 0) break;
                let sp = null, tg = null;
                if (c.type === 'attack' && c.target && c.target.id) tg = c.target;
                else if (c.type === 'spell' && c.target && c.target.id && DMG_KINDS.has(c.spell?.kind)) { sp = c.spell; tg = c.target; }
                else continue;
                if (estDamage(g, unit, tg, sp) >= effHp(tg)) {
                    if (c !== best && c.score >= best.score * 0.7) best = c;
                    break;   // candidates are sorted — the first kill is the best kill
                }
            }
        }

        return { candidates, best };
    }

    /* ═══ IMITATION PREVIEW (training match, 2026-09-07) ═══════════════════
       battle.js _imitObserve calls this at the moment the HUMAN commits an
       action: it ranks the candidates the CPU would have considered for
       that same unit on the same board, finds the human's action in the
       list (or scores it synthetically for a move the scorer never
       proposed: that tile's joint move×action value minus its danger), and
       returns the score margin human − CPU-best. battle.js then probes the
       weights (getAIWeight override) and nudges them so the human's choice
       would have ranked first. Pure: every piece of per-activation module
       state is saved and restored, and the team-focus memo is untouched. */
    function _snapActivationState() {
        const g = G();
        return { fs: _failedSpells, fc: _failedCombos, sa: _skipAttack, st: _skipTowerAttack,
                 sm: _skipMove, sj: _skipJump, fn: _failedNexus, fi: _failedItems, tl: _turnActionLog,
                 oc: _outputCache, sc: _skipClimb, focus: g && g.state ? g.state._aiFocusId : null };
    }
    function _restoreActivationState(s) {
        _failedSpells = s.fs; _failedCombos = s.fc; _skipAttack = s.sa; _skipTowerAttack = s.st;
        _skipMove = s.sm; _skipJump = !!s.sj; _failedNexus = s.fn; _failedItems = s.fi; _turnActionLog = s.tl;
        _outputCache = s.oc; _skipClimb = !!s.sc;
        const g = G(); if (g && g.state) g.state._aiFocusId = s.focus;
    }
    function _candMatchesHuman(c, h) {
        if (!c || !h) return false;
        // A human swing at the enemy Cube is the CPU's attack_tower (2026-10-08:
        // those were all landing in "unscorable").
        if (h.type === 'attack' && c.type === 'attack_tower') return c.towerX === h.x && c.towerY === h.y;
        // Items: the human's one verb covers the CPU's per-item candidate types.
        if (h.type === 'item') {
            if (!(c.type === 'item' || c.type === 'item_targeted' || c.type === 'panacea' || c.type === 'warpStone')) return false;
            if ((c.item || c.type) !== h.item) return false;
            const tx = c.target && c.target.x != null ? c.target.x : null;
            return tx == null || h.x == null || (tx === h.x && c.target.y === h.y);
        }
        if (c.type !== h.type) return false;
        if (h.type === 'move') return c.x === h.x && c.y === h.y;
        if (h.type === 'guard') return true;
        // Entropy Strike: same verb, and the same apocalypse when the human named one.
        if (h.type === 'entropyStrike') return !h.strikeType || !c.strikeType || c.strikeType === h.strikeType;
        if (h.type === 'finisher') return h.targetId == null || c.targetId === h.targetId;
        if (h.type === 'attack') return !!(c.target && c.target.x === h.x && c.target.y === h.y);
        // Inspect matches at the TILE now (the Tactics pass: imitation learns where to search); a zone stays verb-level.
        if (h.type === 'inspect') return h.x == null || (c.x === h.x && c.y === h.y);
        if (h.type === 'nexus_channel') return true;
        if (h.type === 'spell') {
            if (!c.spell) return false;
            const sameSpell = (h.spellId != null && c.spell.id === h.spellId) || (h.spellName && c.spell.name === h.spellName);
            if (!sameSpell) return false;
            if (!c.target || c.target.x == null) return true;
            return c.target.x === h.x && c.target.y === h.y;
        }
        return false;
    }
    function _candDesc(c) {
        if (!c) return 'wait';
        const g = G();
        const tn = (t) => (t && t.id && g) ? g.unitDisplayName(t) : (t && t.x != null ? t.x + ',' + t.y : '');
        if (c.type === 'move') return (c._jump ? 'jump→' : 'move→') + c.x + ',' + c.y + (c._intent ? ' (' + c._intent + ')' : '');
        if (c.type === 'attack') return 'attack ' + tn(c.target);
        if (c.type === 'spell') return (c.spell ? c.spell.name : 'spell') + '→' + tn(c.target);
        if (c.type === 'entropyStrike') return 'entropy:' + (c.strikeType || 'best');
        if (c.type === 'finisher') return 'finisher→' + tn(c.target);
        if (c.type === 'attack_tower') return 'attack Cube';
        if (c.type === 'item_targeted' || c.type === 'item') {
            const nm = (g && g.ITEM_RULES && g.ITEM_RULES[c.item] && g.ITEM_RULES[c.item].name) || c.item || 'item';
            return nm + (c.target ? '→' + tn(c.target) : '');
        }
        if (c.type === 'nexus_channel') return 'channel';
        if (c.type === 'inspect') return 'inspect ' + (c.x != null ? c.x + ',' + c.y : '');
        if (c.type === 'climb') return 'climb ' + (c._climbDir || 'up') + '→' + c.x + ',' + c.y + (c._climbInstant ? ' (top now)' : ' (hang)');
        return c.type;
    }
    // The macro-intent value (scoreMoves step 4) a tile earns: the intent's
    // score × (this tile's progress toward the waypoint ÷ the CPU tile's).
    function _intentCreditAt(g, unit, v, tile) {
        const goal = pickMoveGoal(unit, v);
        if (!goal || goal.retreat || goal.x === undefined || !(goal.score > 0)) return 0;
        const best = pickBestMoveTile(unit, _aiMoveTiles(g, unit), goal, v);
        if (!best) return 0;
        const prog = _goalProgress(g, unit, goal.x, goal.y);
        const progC = prog(best);
        const progH = prog(tile);
        if (progC <= 0) return progH >= progC ? goal.score : 0;
        return goal.score * Math.max(0, Math.min(1, progH / progC));
    }
    window.aiScoreMargin = function (unit, human) {
        _aiActor = unit;
        const g = G();
        if (!g || !unit || !human) return null;
        const saved = _snapActivationState();
        try {
            _failedSpells = new Set(); _failedCombos = new Set(); _skipAttack = false; _skipTowerAttack = false;
            _skipMove = false; _skipJump = false; _failedNexus = false; _failedItems = new Set(); _turnActionLog = []; _outputCache = new Map();
            _skipClimb = false;
            const v = buildVision(unit);
            const r = rankCandidates(unit, v);
            const cands = r.candidates || [];
            const best = (r.best && r.best.score > 0) ? r.best : null;
            const bestScore = best ? best.score : 0;
            let hc = null;
            for (const c of cands) { if (_candMatchesHuman(c, human)) { hc = c; break; } }
            let humanScore = null, matched = false, synthetic = false;
            if (hc) { humanScore = hc.score; matched = true; }
            else if (human.type === 'move' && human.x != null) {
                const tiles = g.TargetQuery.moveTiles(unit).filter(t => t.x === human.x && t.y === human.y);
                if (tiles.length) {
                    let s = 0;
                    try { const j = jointMoveActionSearch(unit, tiles, v); if (j && j.score > 0) s = j.score; } catch (e) {}
                    // 2026-10-08: a repositioning move used to score only its follow-up
                    // shot, so every human walk lost to the CPU's intent move by the
                    // whole intent value even one tile off the CPU's pick. Credit the
                    // same intent for the share of the CPU tile's progress it makes.
                    try { s = Math.max(s, _intentCreditAt(g, unit, v, tiles[0])); } catch (e) {}
                    humanScore = s - tileDangerCost(g, unit, v, tiles[0].x, tiles[0].y, tiles[0].z);
                    matched = true; synthetic = true;
                }
            } else if (human.type === 'guard') { humanScore = 0; matched = true; synthetic = true; }
            else if (human.type === 'inspect' && human.x != null) {
                // an Inspect tile the CPU didn't propose: the CPU's own value of scanning there
                humanScore = _inspectScoreAt(g, unit, v, human.x, human.y) - tileDangerCost(g, unit, v, unit.x, unit.y, unit.z);
                matched = true; synthetic = true;
            }
            if (!matched) return { matched: false, best: _candDesc(best) };
            const agree = !!(best && hc && best === hc);
            return { matched: true, synthetic, agree, margin: humanScore - bestScore,
                     humanScore, bestScore, best: _candDesc(best), human: _candDesc(hc || human) };
        } catch (e) {
            console.warn('[AI] aiScoreMargin failed:', e);
            return null;
        } finally {
            _restoreActivationState(saved);
        }
    };

    // ═════════════════════════════════════════════════════════════════════
    // CANDIDATE GENERATION
    // ═════════════════════════════════════════════════════════════════════

    function gatherCandidates(unit, v) {
        const candidates = [];
        scoreEntropyStrike(unit, v, candidates);
        scoreFinisher(unit, v, candidates);
        scoreItems(unit, v, candidates);
        scoreAttacks(unit, v, candidates);
        scoreTowerAttack(unit, v, candidates);
        scoreSpells(unit, v, candidates);
        scoreCombos(unit, v, candidates);
        scoreDetonate(unit, v, candidates);
        _walkPick = null;
        scoreMoves(unit, v, candidates);
        scoreJumps(unit, v, candidates);
        scoreMobility(unit, v, candidates);
        scoreWayOut(unit, v, candidates);
        scoreInspect(unit, v, candidates);
        scoreFlairWard(unit, v, candidates);
        scoreGuard(unit, v, candidates);
        scoreNexusChannel(unit, v, candidates);
        scoreRecall(unit, v, candidates);
        scoreBuild(unit, v, candidates);
        return candidates;
    }

    // Shared offensive-hit valuation: what is landing `sp` (or a basic
    // attack when sp is null) on `tg` worth, from (fromX, fromY, fromH)?
    function scoreOffensiveHit(g, unit, tg, sp, v, opts) {
        opts = opts || {};
        const est = estDamage(g, unit, tg, sp, opts);
        if (est <= 0) {
            /* THE DEAD SLOTS (2026-10-25): a status-only cast (Fear, Eyewitness, Dread Aura, Meow, Executive Order…)
               has no damage, so this returned 0 before its riders were counted and every AoE / barrage debuff scored
               nothing: 0 casts in 840 lab matches. A spell that deals no damage is worth its statuses and stages. */
            if (sp && _baseSpellDmg(sp) <= 0 && tg && !tg.dead && !isProtected(g, tg)) {
                let val = statusRiderValue(g, unit, tg, sp, v);
                if (val > 0 && !opts.splash) val += getTargetPriority(tg, unit, v) * 0.2;
                return { est: 0, val };
            }
            return { est: 0, val: 0 };
        }
        let landP = 1, arc = 'front';
        if (!sp) {
            try { arc = g.getAttackArc({ x: opts.fromX != null ? opts.fromX : unit.x, y: opts.fromY != null ? opts.fromY : unit.y }, tg) || 'front'; } catch (e) {}
            landP = _landP(g, unit, tg, arc);
        }
        // Overkill is worthless: value only the damage the HP bar can absorb.
        let val = Math.min(est, effHp(tg)) * landP;
        if (est >= effHp(tg)) val += killValue(g, unit, tg, v) * landP;
        if (sp) val += statusRiderValue(g, unit, tg, sp, v);
        const pressKind = sp ? PRESS_KINDS.has(sp.kind) : true;
        if (pressKind) {
            val += pressEV(g, unit, tg, {
                spellType: sp ? (sp.spellType || null) : null, spell: sp || null,
                canCrit: !sp, landP,
            });
        }
        if (!opts.splash) val += getTargetPriority(tg, unit, v) * 0.35;
        if (!sp && arc === 'back') val += 40;   // undodgeable + uncounterable
        return { est, val };
    }

    function scoreAttacks(unit, v, out) {
        const g = G();
        if ((unit.ap || 0) < g.AP_COST_ACTION || _skipAttack) return;

        for (const tgt of v.attackTargets) {
            if (isProtected(g, tgt)) continue;
            const hit = scoreOffensiveHit(g, unit, tgt, null, v, {});
            if (hit.val <= 0) continue;
            let score = hit.val - _counterCost(g, unit, tgt) * wght(g, 'counterCaution_v1', 1);   // THE COUNTER (× trained caution)
            if (score <= 0) continue;

            // Defend the tower: enemies camped on our objective are the fight.
            if (v.ownTower && v.ownTower.hp > 0) {
                const dToTower = Math.abs(tgt.x - v.ownTower.x) + Math.abs(tgt.y - v.ownTower.y);
                if (dToTower <= 4) score += 60;
            }

            // Progression modes only: mild per-level aggression + finish
            // the level-up (PvP is level-normalized — both are no-ops there).
            if (typeof g.xpProgressionActive === 'function' && g.xpProgressionActive()
                && typeof g.getUnitLevel === 'function') {
                const unitLevel = g.getUnitLevel(unit);
                score *= 1.0 + (unitLevel - 1) * AI_TUNE.levelAggressionMod;
                if (unitLevel < (g.XP_MAX_LEVEL || 100) && typeof g.getXPProgressPct === 'function'
                    && g.getXPProgressPct(unit) >= 70) {
                    score += AI_TUNE.nearLevelUpBonus;
                }
            }

            out.push({ type: 'attack', target: tgt, score });
        }

        // Enemy deployed objects (heal beacons, pylons, turrets) die to ONE
        // basic attack yet pay value every round they stand.
        const _dObjs = g.state._deployedObjects || [];
        if (_dObjs.length) {
            const _oRange = g.getEffectiveRange(unit);
            for (const o of _dObjs) {
                if (!o || o.hp <= 0 || o._detonated || o.ownerPlayer === unit.player) continue;
                const d = Math.abs(unit.x - o.x) + Math.abs(unit.y - o.y);
                if (d < 1 || d > _oRange) continue;
                if (g.isRangeBlockedByTerrain && g.isRangeBlockedByTerrain(unit.x, unit.y, o.x, o.y)) continue;
                if (g.unitAt && g.unitAt(o.x, o.y)) continue;   // a unit there takes the hit instead
                let s = 110 + (o.auraHeal ? 90 : 0) + (o.turretDmg ? 80 : 0);
                if (o.detonateOnAttack && o.blastRadius > 0 && d <= (o.blastRadius || 1)) s = 0; // not in our own face
                // THE SPELL AUDIT D: the engine binds a decoy-provoked blade to this straw — swing at it
                const _tdO = (typeof g.getTauntDecoy === 'function') ? g.getTauntDecoy(unit) : null;
                if (_tdO && _tdO === o) s += 800;
                if (s > 0) out.push({ type: 'attack', target: { x: o.x, y: o.y }, score: s, _objectAttack: true });
            }
        }

        // 🚪 THE ONE-WAY DOOR: break the door holding one of ours (§4.3)
        _capDoorAttacks(g, unit, v, out);
    }

    // Share of the Cube window bonus that applies: 1 when the Cube is the
    // nearer finish; down to 0.25 when the wipeout is much nearer (hits to
    // drop every standing enemy ÷ hits to drop the Cube). Arena only.
    function _cubeWindowShare(g, unit, v, tower, cubeHit) {
        try {
            const mode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
            if (!mode || mode.id !== 'arena' || !Array.isArray(mode.winConditions) || !mode.winConditions.includes('wipeout')) return 1;
            const enemy = unit.player === 1 ? 2 : 1;
            const alive = g.aliveUnitsFor(enemy);
            if (!alive.length || !(cubeHit > 0)) return 1;
            let wipeHits = 0;
            for (const e of alive) wipeHits += effHp(e) / Math.max(1, unitThreatOutput(g, unit, e));
            const cubeHits = tower.hp / cubeHit;
            return Math.max(0.25, Math.min(1, wipeHits / Math.max(1, cubeHits)));
        } catch (e) { return 1; }
    }

    function scoreTowerAttack(unit, v, out) {
        const g = G();
        if ((unit.ap || 0) < g.AP_COST_ACTION || _skipTowerAttack) return;
        const tower = v.enemyTower;
        if (!tower || tower.hp <= 0) return;

        const forecast = typeof g.getCubeAttackForecast === 'function' ? g.getCubeAttackForecast(unit, tower) : null;
        if (typeof g.getCubeAttackForecast === 'function' && !forecast) return;
        if (!forecast) {
            const tDist = Math.abs(unit.x - tower.x) + Math.abs(unit.y - tower.y);
            if (tDist < 1 || tDist > v.effRange) return;
            if (g.isRangeBlockedByTerrain(unit.x, unit.y, tower.x, tower.y, unit.z)) return;
        }
        const estDmg = forecast ? forecast.typical : Math.max(_basicMinRaw(), Math.floor(_pwrAtk(unit) * _basicCoef()) + (g.getEffectiveAttackBonus(unit) || 0) + (g.getHourglassPower(unit) || 0));

        // Tower damage IS win-condition currency: the base bonus makes chip
        // damage on the objective competitive with chip damage on units.
        let score = estDmg + wght(g, 'towerBaseBonus_v1', 39) * 3;

        if (tower.hp <= estDmg * 3) score += tuneW(g, 'towerLowHpPush') * 3;
        else if (tower.hp <= tower.maxHp * 0.5) score += AI_TUNE.towerMidHpPush;

        // The WINDOW: enemies down / away / respawning = free Cube hits. These
        // flat bonuses (up to ~1,000) came from self-play, where the Cube ended
        // 81% of matches. In the Arena a team that is down bodies is also close
        // to a WIPEOUT, so the window is worth only as much as the Cube is the
        // nearer finish (2026-10-08 imitation report: with two of the CPU's
        // units dead it wanted the Cube by 580-1,170 while mondo finished the
        // team and won). Trainable via cubeWindowBonus_v1.
        const ws = v.winState;
        /* THE CLOCKS (2026-10-23, Phase 3): the hit is worth the rounds it takes off our Cube clock, weighed
           against how near our other wins and their nearest win are (_cubeClockValue). The flat window below
           (and its trained cubeWindowBonus_v1) is the fallback: window.EW_AI_NO_CLOCKS, or a mode with no clocks. */
        const _clk = (window.EW_AI_NO_CLOCKS || !_aiDiff().tactics) ? null : aiRaceClocks(g, unit.player, ws);
        if (_clk && _clk.our.cube < _CLOCK_INF) {
            score += _cubeClockValue(g, unit, v, estDmg, _clk);
        } else {
            let windowB = 0;
            const groundEnemies = v.visibleEnemies.filter(e =>
                Math.abs(e.x - tower.x) + Math.abs(e.y - tower.y) <= 6
            );
            if (groundEnemies.length === 0) windowB += AI_TUNE.towerClearBonus;
            else if (groundEnemies.length === 1) windowB += 60;

            if (ws.enemyDeadCount >= 2) windowB += 300;
            else if (ws.enemyDeadCount >= 1) windowB += 160;
            if (ws.enemyMinRespawn >= 6) windowB += 300;
            else if (ws.enemyMinRespawn >= 4) windowB += 200;
            else if (ws.enemyMinRespawn >= 3) windowB += 130;
            else if (ws.enemyMinRespawn >= 2) windowB += 60;
            if (ws.phase === 'tower_push') windowB += 320;
            if (ws.phase === 'numbers_advantage') windowB += 180;
            score += windowB * _cubeWindowShare(g, unit, v, tower, estDmg) * wght(g, 'cubeWindowBonus_v1', 1);
        }
        if (ws.enemyImminentRespawns > 0) score -= 40 * ws.enemyImminentRespawns;
        score += ws.roundUrgency * 100;
        /* THE CUBE'S POINTS (2026-10-29, the training rework): every hit pays Arena points at the buzzer whether or not
           the Cube ever falls; the hit was priced as HP + the race to destroy it only. cubePointsValue_v1 scales it. */
        if (_isArenaMode()) score += _cubeHitPts(tower, estDmg) * _ptv(g) * wght(g, 'cubePointsValue_v1', 1);

        out.push({ type: 'attack_tower', towerX: tower.x, towerY: tower.y, score, _objectiveWin: !!forecast?.wins });
    }

    // MP that lets an ally cast what it could not afford: the best unlocked
    // spell's value at half weight, +15 per unlocked spell, +60 off empty.
    // Shared by the Mana Potion and the team MP spells (Free Energy) — the
    // spells used to get only the raw MP, so the CPU rated a potion ~700
    // above a Free Energy cast that refilled the whole team (2026-10-08).
    function _mpUnlockValue(g, ally, mpAfter, ref) {
        let unlocked = 0, bestUnlock = 0;
        for (const spell of (ally.spells || [])) {
            if (!spell || !spell.cost || spell.cost <= 0 || spell.kind === 'scan') continue;
            const _mc = _mpCost(ally, spell);
            if (ally.mp < _mc && mpAfter >= _mc) {
                unlocked++;
                const val = DMG_KINDS.has(spell.kind) ? estDamage(g, ally, ref, spell)
                    : (HEAL_KINDS.has(spell.kind) ? 120 : 60);
                if (val > bestUnlock) bestUnlock = val;
            }
        }
        let s = unlocked > 0 ? bestUnlock * 0.5 + unlocked * 15 : 0;
        if (ally.mp === 0 && mpAfter > 0 && (ally.spells || []).length) s += 60;
        return s;
    }

    function scoreItems(unit, v, out) {
        const g = G();
        const ap = unit.ap || 0;
        if (ap < g.AP_COST_ACTION) return;

        /* THE ITEM EDITOR (2026-10-08): new potions made like these (data.js itemKeysLike) are weighed the same way, each
           with its own numbers */
        const _likeKeys = b => (typeof itemKeysLike === 'function') ? itemKeysLike(b) : [b];
        // Heal potion — valued exactly like a heal spell.
        for (const _hk of _likeKeys('healPotion')) if (unit.items?.[_hk] > 0) {
            const allies = g.aliveUnitsFor(unit.player);
            let bestTarget = null, bestScore = 0;
            for (const ally of allies) {
                if (ally.dead || ally.hp >= ally.maxHp) continue;
                const hpPct = ally.hp / ally.maxHp;
                if (hpPct > 0.7) continue;
                // ITEM_RULES.healPotion heals ~35% of maxHp
                const rule = (g.ITEM_RULES || {})[_hk] || {};
                const amount = rule.healPct ? Math.floor(ally.maxHp * rule.healPct)
                    : (rule.heal || Math.floor(ally.maxHp * 0.35));
                const score = healValue(g, unit, ally, amount, v) + (ally.id === unit.id ? 20 : 0);
                if (score > bestScore) { bestScore = score; bestTarget = ally; }
            }
            if (bestTarget) out.push({ type: 'item_targeted', item: _hk, target: bestTarget, score: bestScore * wght(g, 'potionValue_v1', 1) });
        }

        // Mana potion — restored MP × the MP value constant, plus a bonus
        // when it unlocks casts the ally couldn't afford.
        for (const _mk of _likeKeys('manaPotion')) if (unit.items?.[_mk] > 0) {
            const allies = g.aliveUnitsFor(unit.player);
            const _mpPct = (((g.ITEM_RULES || {})[_mk] || {}).mpPct) || 0.35;
            let bestTarget = null, bestScore = 0;
            for (const ally of allies) {
                if (ally.dead || (ally.maxMp || 0) <= 0) continue;
                if (ally.mp >= ally.maxMp * 0.55) continue;
                const mpRestore = Math.max(1, Math.floor((ally.maxMp || 0) * _mpPct));
                const mpAfter = Math.min(ally.maxMp, ally.mp + mpRestore);
                let score = AI_TUNE.mpPotionBase + (mpAfter - ally.mp) * tuneW(g, 'mpValuePerPoint') * 0.6
                    + _mpUnlockValue(g, ally, mpAfter, v.closestEnemy || unit);
                if (score > bestScore) { bestScore = score; bestTarget = ally; }
            }
            if (bestTarget) out.push({ type: 'item_targeted', item: _mk, target: bestTarget, score: bestScore * wght(g, 'potionValue_v1', 1) });
        }

        // Scanner — information value while hourglasses are hidden.
        if (unit.items?.scanner > 0 && !g.unitHasStatus(unit, 'jammed')) {
            const unrevHG = (g.state.hourglasses || []).filter(h =>
                h.carriedBy === null && !h.visibleTo[unit.player]
            ).length;
            if (unrevHG > 0) {
                let scanScore = wght(g, 'scannerPriority_v1', 34) * 3 + unrevHG * 20;
                const round = g.state.round || 0;
                if (round <= 10) scanScore += 25;
                out.push({ type: 'item', item: 'scanner', score: scanScore });
            }
        }

        // Panacea — un-cripple ourselves (re-enables our whole output).
        if ((unit.items?.panacea || 0) > 0 && unit.status) {
            const STATUS_DEFS_ = g.STATUS_DEFS || {};
            let debuffCount = 0, hasCrippling = false;
            for (const key of Object.keys(unit.status)) {
                const def = STATUS_DEFS_[key];
                if (def && def.kind === 'debuff') {
                    debuffCount++;
                    if (['stun', 'sleep', 'stagger', 'blind', 'freeze', 'confuse', 'silence'].includes(key)) hasCrippling = true;
                }
            }
            if (debuffCount > 0) {
                let panaceaScore = 120 + debuffCount * 50;
                if (hasCrippling) panaceaScore += 0.6 * unitThreatOutput(g, unit, v.closestEnemy || unit);
                out.push({ type: 'panacea', score: panaceaScore });
            }
        }

        // Warp stone — emergency escape / tower approach (kept from v3).
        if ((unit.items?.warpStone || 0) > 0) {
            const selfHpPct = unit.hp / unit.maxHp;
            const nearEnemyCount = v.tactical?.nearEnemies || 0;
            if (selfHpPct < 0.3 && nearEnemyCount > 0) {
                let bestWarpTile = null, bestWarpScore = -1;
                for (let dx = -3; dx <= 3; dx++) {
                    for (let dy = -3; dy <= 3; dy++) {
                        if (Math.abs(dx) + Math.abs(dy) < 1 || Math.abs(dx) + Math.abs(dy) > 3) continue;
                        const wx = unit.x + dx, wy = unit.y + dy;
                        if (!g.isInside(wx, wy)) continue;
                        const tileType = g.state.boardTerrain?.[wy]?.[wx];
                        const rule = g.TERRAIN_RULES?.[tileType];
                        if (!rule || rule.passable === false) continue;
                        if (g.unitAt(wx, wy)) continue;
                        let tileScore = -tileDangerCost(g, unit, v, wx, wy, undefined);
                        for (const a of g.aliveUnitsFor(unit.player)) {
                            if (a.id === unit.id) continue;
                            if (Math.abs(wx - a.x) + Math.abs(wy - a.y) <= 3) tileScore += 15;
                        }
                        if (tileScore > bestWarpScore) { bestWarpScore = tileScore; bestWarpTile = { x: wx, y: wy }; }
                    }
                }
                if (bestWarpTile) {
                    out.push({ type: 'warpStone', target: bestWarpTile,
                        score: 200 + (1.0 - selfHpPct) * 300, _noDanger: true });
                }
            }
            const enemyPlayer = unit.player === 1 ? 2 : 1;
            const enemyTower = g.state.towers?.[enemyPlayer] || null;
            if (enemyTower && enemyTower.hp > 0) {
                const curDist = Math.abs(unit.x - enemyTower.x) + Math.abs(unit.y - enemyTower.y);
                if (curDist <= 6 && curDist > 2 && selfHpPct > 0.5) {
                    let bestTowerWarp = null, bestTowerDist = curDist;
                    for (let dx = -3; dx <= 3; dx++) {
                        for (let dy = -3; dy <= 3; dy++) {
                            if (Math.abs(dx) + Math.abs(dy) < 1 || Math.abs(dx) + Math.abs(dy) > 3) continue;
                            const wx = unit.x + dx, wy = unit.y + dy;
                            if (!g.isInside(wx, wy)) continue;
                            const tileType = g.state.boardTerrain?.[wy]?.[wx];
                            const rule = g.TERRAIN_RULES?.[tileType];
                            if (!rule || rule.passable === false) continue;
                            if (g.unitAt(wx, wy)) continue;
                            const newDist = Math.abs(wx - enemyTower.x) + Math.abs(wy - enemyTower.y);
                            if (newDist < bestTowerDist) { bestTowerDist = newDist; bestTowerWarp = { x: wx, y: wy }; }
                        }
                    }
                    if (bestTowerWarp && bestTowerDist < curDist - 1) {
                        out.push({ type: 'warpStone', target: bestTowerWarp, score: 120 });
                    }
                }
            }
        }

        /* THE FULL LIST — THE STIMS (2026-11-01): Adrenal / Bulwark / Psi Stim (self, +2 stages for 3 rounds, 1 AP) had no
           scorer, so the CPU carried them and never used one (held in ~8,400 decisions, 0 uses). Worth what the same stages
           are worth on a buff spell (buffStageValue), only with a fight in sight, never twice on the same stat. */
        if (!window.EW_AI_NO_STIMS && typeof window.useStimItem === 'function' && v.visibleEnemies.length > 0
            && (v.closestEnemyDist ?? Infinity) <= 8) {
            for (const k of Object.keys(g.ITEM_RULES || {})) {
                const rule = g.ITEM_RULES[k];
                if (!rule || !rule.selfBoost || (unit.items?.[k] || 0) <= 0 || _failedItems.has(k)) continue;
                let sc = buffStageValue(g, unit, unit, { statStageBoost: rule.selfBoost }, v);
                if (!(sc > 0)) continue;
                if ((v.closestEnemyDist ?? Infinity) > 5) sc *= 0.5;
                out.push({ type: 'stim', item: k, score: sc * wght(g, 'potionValue_v1', 1) });
            }
        }

        // Bane throwables — real damage vs the matching type.
        const baneKeys = Object.keys(g.ITEM_RULES || {}).filter(k => g.ITEM_RULES[k].baneType);
        if (v.visibleEnemies.length > 0) {
            for (const baneKey of baneKeys) {
                if ((unit.items?.[baneKey] || 0) <= 0) continue;
                if (_failedItems.has(baneKey)) continue;
                const baneRule = g.ITEM_RULES[baneKey];
                const baneRange = g.getEffectiveRange(unit, { item: true }) + 2;
                for (const enemy of v.visibleEnemies) {
                    const dist = Math.max(Math.abs(unit.x - enemy.x), Math.abs(unit.y - enemy.y));
                    if (dist > baneRange) continue;
                    if (g.isRangeBlockedByTerrain(unit.x, unit.y, enemy.x, enemy.y)) continue;
                    const isEffective = (enemy.types || []).includes(baneRule.baneType);
                    const baseDmg = (baneRule.baseDmg + (isEffective ? baneRule.baneDmg : 0)) * _offScale(unit, enemy);
                    let score = Math.min(baseDmg, effHp(enemy));
                    if (baseDmg >= effHp(enemy)) score += killValue(g, unit, enemy, v);
                    score += getTargetPriority(enemy, unit, v) * 0.3;
                    if (!isEffective && !(baneRule.aoeDmg > 0)) score *= 0.45;
                    /* THE FULL LIST: the Entropy Grenade's 3x3 splash hits friend and foe — count both */
                    if (baneRule.aoeDmg > 0) {
                        const _ar = baneRule.aoeRadius || 1;
                        for (const u of g.state.units) {
                            if (!u || u.dead || u.id === enemy.id || Math.max(Math.abs(u.x - enemy.x), Math.abs(u.y - enemy.y)) > _ar) continue;
                            const sd = Math.min(baneRule.aoeDmg * _offScale(unit, u), effHp(u));
                            if (u.player === unit.player) score -= sd * 1.3;
                            else { score += sd; if (baneRule.aoeDmg * _offScale(unit, u) >= effHp(u)) score += killValue(g, unit, u, v) * 0.8; }
                        }
                    }
                    if (!(score > 0)) continue;
                    out.push({ type: 'item_targeted', item: baneKey, target: enemy, score });
                }
            }
        }
    }

    // Full Entropy Gauge = fire the team attack. Massive AoE on every
    // visible enemy and the gauge banks nothing if hoarded.
    function scoreEntropyStrike(unit, v, out) {
        const g = G();
        if (typeof g.canUseEntropyStrike !== 'function' || !g.canUseEntropyStrike(unit)) return;
        const targets = g.TargetQuery ? g.TargetQuery.entropyStrikeTargets(unit) : [];
        if (!targets.length) return;
        let per = 250;
        try { if (typeof g.getEntropyStrikeDamage === 'function') per = g.getEntropyStrikeDamage(unit) || 250; } catch (e) {}
        // THE SIX APOCALYPSES (2026-09-07): pick the damage type the current
        // targets are weakest to (type-chart average × the trigger's STAB) —
        // battle.js getEntropyStrikeBestType. The multiplier feeds the score
        // so a board full of resists still fires, just less eagerly.
        let best = null;
        try { if (typeof g.getEntropyStrikeBestType === 'function') best = g.getEntropyStrikeBestType(unit); } catch (e) { best = null; }
        const mult = (best && best.score > 0) ? best.score : 1;
        /* KILLS COUNT (2026-10-23, the Tactics pass): the strike used to score the same on a full-HP board as on
           the board it wipes. Each victim it would drop now adds its kill value, and dropping every standing body
           adds the whole wipeout win (_killTally), like any other damage. The flat part is unchanged. */
        let killB = 0;
        _openKillTally();
        try {
            const sp = { kind: 'damage', dmg: per, damageType: 'magic', spellType: best ? best.type : null };
            for (const t of targets) {
                if (!t || t.dead || isProtected(g, t)) continue;
                const est = estDamage(g, unit, t, sp, { rawBase: per, noRangeMult: true, noElement: true });
                if (est >= effHp(t)) killB += killValue(g, unit, t, v);
            }
        } catch (e) {}
        killB += _closeKillTally(g);
        out.push({ type: 'entropyStrike', strikeType: best ? best.type : null, score: 300 + targets.length * per * 0.8 * mult + killB, _noDanger: true, _strikeKills: killB > 0 });
    }

    // ☠ THE FINISHER (2026-09-19): the gauge's other verb. One candidate
    // per visible enemy the execution would KILL (a sure removal of the
    // highest-value body beats spreading the strike thin) plus the single
    // best non-kill when nothing dies — scored against the strike's own
    // candidate so the two verbs compete on the same scale: the strike wins
    // on a crowded board of neutral matchups, the execution wins when one
    // enemy is the problem. The victim's id rides the candidate (Simul
    // plan steps carry it; battle.js doFinisher resolves it).
    function scoreFinisher(unit, v, out) {
        const g = G();
        if (typeof g.canUseFinisher !== 'function' || !g.canUseFinisher(unit)) return;
        const targets = (g.TargetQuery && g.TargetQuery.finisherTargets) ? g.TargetQuery.finisherTargets(unit)
            : (typeof g.getFinisherTargets === 'function' ? g.getFinisherTargets(unit) : []);
        if (!targets.length) return;
        let bestNonKill = null;
        for (const t of targets) {
            let fc = null;
            try { fc = g.getFinisherForecast(unit, t); } catch (e) { fc = null; }
            if (!fc) continue;
            const value = (t.maxHp || 0) * 0.5 + (t.atk || 0) * 2 + (t.int || 0) * 2;
            if (fc.kill) {
                // THE TACTICS PASS (2026-10-23): an execution of their last body (or second-to-last) is the wipeout share too.
                const wip = _wipeoutShare(g, t).share + _keyCarrierDenial(g, t);
                out.push({ type: 'finisher', targetId: t.id, target: t, score: 340 + fc.dmg * 0.9 + value + wip, _noDanger: true });
            } else {
                const s = 220 + fc.dmg * 0.7 * (fc.weak ? 1.15 : 1) * (fc.resist ? 0.6 : 1);
                if (!bestNonKill || s > bestNonKill.score) bestNonKill = { type: 'finisher', targetId: t.id, target: t, score: s, _noDanger: true };
            }
        }
        if (bestNonKill) out.push(bestNonKill);
    }

    function scoreCombos(unit, v, out) {
        const g = G();
        if (!_aiDiff().combos) return;   // Easy CPU never coordinates combos
        if ((unit.ap || 0) < g.COMBO_AP_COST_INITIATOR) return;

        const partners = g.getComboPartners(unit);
        for (const partner of partners) {
            if (_failedCombos.has(partner.id)) continue;
            const combo = g.getComboForUnits(unit, partner);
            if (!combo) continue;

            const synergy = g.getComboTypeSynergy(unit, partner);
            const isOff = ['damage', 'multiHit', 'aoe', 'lifeDrain'].includes(combo.kind);

            let comboTarget = null;
            if (isOff) {
                const cr = combo.range || 3;
                const targets = v.visibleEnemies.filter(e => {
                    const d = _dist(g, unit.x, unit.y, unit.z, e);
                    return d >= 1 && d <= cr && !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y)
                        && !isProtected(g, e);
                });
                targets.sort((a, b) => getTargetPriority(b, unit, v) - getTargetPriority(a, unit, v));
                comboTarget = targets[0] || null;
                if (!comboTarget) continue;
            }

            let score = 0;
            if (isOff && comboTarget) {
                // pseudo-spell through the oracle so armor/type/level apply
                const pseudo = {
                    dmg: combo.hitDamages ? combo.hitDamages.reduce((a, b) => a + b, 0) : (combo.dmg || 0),
                    spellType: combo.spellType || null,
                    damageType: combo.damageType === 'magic' ? 'magic' : 'physical',
                };
                const est = Math.round(estDamage(g, unit, comboTarget, pseudo) * (synergy.mult || 1));
                score = Math.min(est, effHp(comboTarget));
                if (est >= effHp(comboTarget)) score += killValue(g, unit, comboTarget, v) + wght(g, 'comboKillBonus_v1', 25);
                score += pressEV(g, unit, comboTarget, { spellType: combo.spellType || null, spell: combo });
            } else {
                score = ((combo.heal || 0)) * 1.0 * (synergy.mult || 1);
            }
            if (combo.statusEffects?.length && comboTarget) {
                score += statusRiderValue(g, unit, comboTarget, combo, v);
            }
            if (synergy.mult > 1) score += wght(g, 'comboSynergyBonus_v1', 26);
            // The partner spends 1 AP too — charge their opportunity cost.
            score -= 0.35 * unitThreatOutput(g, partner, comboTarget || unit);

            out.push({ type: 'combo', partner, combo, target: comboTarget, score });
        }
    }

    function scoreDetonate(unit, v, out) {
        const g = G();
        if ((unit.ap || 0) < g.AP_COST_ACTION) return;
        const bombs = (g.state.bombs || []).filter(b => b.ownerUnitId === unit.id);
        if (bombs.length === 0) return;
        let total = 0;
        _openKillTally();
        try {
            for (const b of bombs) {
                for (const e of v.visibleEnemies) {
                    if (Math.abs(e.x - b.x) + Math.abs(e.y - b.y) > (b.radius || 1)) continue;
                    const raw = (b.dmg || 120) * _offScale(unit, e);
                    total += Math.min(raw, effHp(e));
                    if (raw >= effHp(e)) total += killValue(g, unit, e, v) * 0.8;
                }
            }
        } catch (e) { _killTally = null; throw e; }
        total += _closeKillTally(g) * 0.8;
        if (total > 0) out.push({ type: 'detonate', score: total });
    }

    // ═════════════════════════════════════════════════════════════════════
    // SPELL SCORING — one dispatch, EVERY kind has a real handler, and the
    // generic fallback derives value from the spell's own data fields
    // instead of `return 5`. All values in the currency; MP is charged
    // uniformly at the end of scoreSpells.
    // ═════════════════════════════════════════════════════════════════════

    // Chivalry is a ONE-hit transfer, not new shield HP. Only visible,
    // presently reachable basic attacks and single-hit damage spells enter
    // this conservative horizon; do not infer unseen attackers or paths.
    function _chivalryHits(g, ward, v) {
        const hits = [];
        for (const enemy of v.visibleEnemies || []) {
            if (enemy.dead || enemy._dying) continue;
            if (typeof window.isUnitRealmShieldedFrom === 'function' && window.isUnitRealmShieldedFrom(ward, enemy)) continue;
            const defs = g.STATUS_DEFS || (typeof STATUS_DEFS !== 'undefined' ? STATUS_DEFS : {});
            if (Object.keys(enemy.status || {}).some(k => enemy.status[k] > 0 && defs[k]?.blockAction)) continue;
            const d = _reach(g, enemy.x, enemy.y, enemy.z, ward, (g.getEffectiveRange(enemy) || 1) > 1);
            const taunter = g.getTauntTargeter?.(enemy);
            if ((!taunter || taunter.id === ward.id) && d >= 1 && d <= g.getEffectiveRange(enemy)
                && !g.isRangeBlockedByTerrain(enemy.x, enemy.y, ward.x, ward.y, enemy.z ?? 0)) {
                hits.push({ enemy, spell: null, probability: _landP(g, enemy, ward) * (g.unitHasStatus(enemy, 'blind') ? 0.5 : 1) });
            }
            if (g.unitHasStatus(enemy, 'silence')) continue;
            for (const spell of enemy.spells || []) {
                // Multi-hit/area/indirect attacks need their own first-hit
                // contract; never transfer the total of a multi-hit cast.
                if (spell.kind !== 'damage' || !(spell.dmg > 0) || spell.hitDamages
                    || (enemy.mp || 0) < _mpCost(enemy, spell)) continue;
                if (typeof getSpellCooldownRemaining === 'function' && getSpellCooldownRemaining(enemy, spell) > 0) continue;
                if (g.TargetQuery.spellTargets(enemy, spell).some(t => t.unit?.id === ward.id)) {
                    hits.push({ enemy, spell, probability: 1 });
                }
            }
        }
        return hits;
    }

    function _chivalryLoss(g, enemy, recipient, spell, ward, v) {
        const damage = estDamage(g, enemy, recipient, spell, {
            interceptionForecast: true, basicArcTarget: ward
        });
        const hp = effHp(recipient);
        let value = Math.min(hp, damage);
        // One-hit survival effects must not be advertised as saved kills.
        if (damage >= hp && hp > 0 && !g.unitHasStatus(recipient, 'indomitable')) {
            value += killValue(g, enemy, recipient, v);
        }
        return value;
    }

    function _chivalryPledgeValue(g, guardian, ward, v) {
        if (!guardian || guardian.dead || guardian._dying || !ward || ward.dead || ward._dying
            || guardian.id === ward.id) return 0;
        const landing = g.TargetQuery.chivalryLanding(guardian, ward);
        // Copy only the top level; every query below is read-only. Never move
        // the live knight while scoring (including move-then-cast probes).
        const landed = { ...guardian, ...landing };
        const hits = _chivalryHits(g, ward, v);
        if (!hits.length) return 0;
        let weighted = 0, weight = 0;
        for (const hit of hits) {
            const prevented = _chivalryLoss(g, hit.enemy, ward, hit.spell, ward, v);
            const transferred = _chivalryLoss(g, hit.enemy, landed, hit.spell, ward, v);
            // Equal likelihood over plausible first hits is a heuristic,
            // not a sum of shields or a prediction of enemy target choice.
            weighted += hit.probability * (prevented - transferred);
            weight += 1;
        }
        const hazardDelta = aiHazardPenaltyAt(landed, landing.x, landing.y)
            - aiHazardPenaltyAt(guardian, guardian.x, guardian.y);
        // Account for newly exposed follow-up fire without crediting an
        // uncertain escape from current danger as free healing.
        const incoming = target => _chivalryHits(g, target, v).reduce((sum, hit) =>
            sum + hit.probability * _chivalryLoss(g, hit.enemy, target, hit.spell, target, v), 0);
        const exposure = Math.max(0, incoming(landed) - incoming(guardian));
        return weighted / weight - Math.max(0, hazardDelta) - exposure * tuneW(g, 'threatCostFactor');
    }

    function _reaimChivalry(unit, spell) {
        const v = buildVision(unit);
        const target = findSpellTarget(unit, spell, v);
        return target && _chivalryScore(unit, spell, target, v) > _mpCost(unit, spell) * tuneW(G(), 'mpValuePerPoint')
            ? target : null;
    }
    window._aiReaimChivalry = _reaimChivalry;

    function _chivalryScore(unit, spell, target, v) {
        const g = G();
        if (!target || target.id === unit.id || target.dead || target._dying
            || !g.TargetQuery.spellTargets?.(unit, spell).some(t => t.unit?.id === target.id)) return 0;
        if (target._guardedBy === unit.id) return 0; // no duration to refresh
        let value = _chivalryPledgeValue(g, unit, target, v);
        const oldGuardian = g.state.units.find(u => u.id === target._guardedBy);
        // Replacing another knight's pledge changes only the marginal value.
        value -= _chivalryPledgeValue(g, oldGuardian, target, v);
        const oldWard = g.state.units.find(u => u.id === unit._guardingAlly && u._guardedBy === unit.id);
        if (oldWard && oldWard.id !== target.id) value -= _chivalryPledgeValue(g, unit, oldWard, v);
        return value;
    }

    function _trickRoomScore(unit, spell, v) {
        const g = G();
        const simul = typeof window._isSimulMode === 'function' && window._isSimulMode();
        const turnMode = typeof getActiveGameMode === 'function' ? getActiveGameMode() : null;
        if (!simul && !turnMode?.blitzMode) return 0;
        const duration = spell.trickRoomDuration || 3;
        const mode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
        const limit = g.state.matchClock?.roundLimit || mode?.roundLimit || 0;
        // The current round is already owned. Only additional FUTURE rounds
        // benefit, and recasting an equally long reversal changes nothing.
        const horizon = limit > 0 && !g.state.suddenDeathActive
            ? Math.max(0, limit - (g.state.round || 0)) : duration;
        const added = Math.max(0, Math.min(duration, horizon) - Math.min(g.state._trickRoomRounds || 0, horizon));
        if (!added) return 0;
        const allies = [unit, ...(v.allies || [])].filter(u => !u.dead && !u._dying);
        const enemies = (v.visibleEnemies || []).filter(u => !u.dead && !u._dying);
        if (!enemies.length) return 0;
        const speed = u => typeof getEffectiveSpd === 'function' ? getEffectiveSpd(u) : (u.spd || 0);
        let swing = 0;
        for (const ally of allies) for (const enemy of enemies) {
            const a = speed(ally), b = speed(enemy);
            if (a === b) continue; // existing Quickdraw/initiative ties survive
            const reach = u => {
                let range = g.getEffectiveRange(u) || 1;
                for (const s of u.spells || []) if (DMG_KINDS.has(s.kind) && (u.mp || 0) >= _mpCost(u, s)) {
                    range = Math.max(range, _effRange(u, s));
                }
                return range + (g.getEffectiveMove?.(u) || 0);
            };
            if (_dist(g, ally.x, ally.y, ally.z, enemy) > Math.max(reach(ally), reach(enemy))) continue;
            // Initiative is a chance to deliver/deny part of one exchange,
            // not a whole free attack. This initial 0.35 estimate needs play
            // evidence; fast allies pay the same loss that slow allies gain.
            const exchange = (unitThreatOutput(g, ally, enemy) + unitThreatOutput(g, enemy, ally)) * 0.35;
            swing += (a < b ? 1 : -1) * exchange;
        }
        // Blitz activates every ally; Simul chooses only one per side. Do not
        // multiply the latter's benefit by the entire bench or inspect sealed
        // opposing plans. Priority still outranks speed in actual resolution.
        const exchanges = simul ? allies.length * enemies.length : enemies.length;
        return swing / Math.max(1, exchanges) * added;
    }

    function _mirrorStatusValue(g, source, target, effect, v) {
        if (!effect || g.unitHasStatus(target, effect.id)) return 0;
        // Drowning lands only in deep water (battle.js applyStatusPayload → map.js unitCanDrownHere)
        if (effect.id === 'drowning' && typeof unitCanDrownHere === 'function' && !unitCanDrownHere(target)) return 0;
        const defs = g.STATUS_DEFS || (typeof STATUS_DEFS !== 'undefined' ? STATUS_DEFS : {});
        if (typeof unitPassiveBlocksStatus === 'function' && unitPassiveBlocksStatus(target, effect.id)) return 0;
        if (typeof unitPassiveValue === 'function' && defs[effect.id]?.kind
            && unitPassiveValue(target, 'immuneKind') === defs[effect.id].kind) return 0;
        if (effect.id === 'burn' && (g.unitHasStatus(target, 'wet')
            || (typeof _unitIsSoaked === 'function' && _unitIsSoaked(target))
            || (typeof _unitInRain === 'function' && _unitInRain(target)))) return 0;
        if (defs[effect.id]?.stageMod && g.unitHasStatus(target, 'statLock')) return 0;
        const element = typeof statusAffinityElement === 'function' ? statusAffinityElement(effect.id, null) : null;
        const affinity = element && typeof unitElementAffinity === 'function' ? unitElementAffinity(target, element) : null;
        if (affinity === 'immune' || affinity === 'absorb') return 0;
        // the `purgeDebuff` hook (the Censer's gear row, or any passive row — SPELL_LIBRARY_PLAN Phase 4) eats this round's first debuff
        if (typeof unitPassiveValue === 'function' && unitPassiveValue(target, 'purgeDebuff')
            && target._censerRound !== (g.state.round || 0)) return 0;
        const probability = typeof getStatusApplyChance === 'function'
            ? getStatusApplyChance(source, target, effect) : (affinity === 'resist' ? 0.45 : 0.9);
        // Third Eye (the `debuffTurnsBonus` hook, sum — was the Psychic job; THE JOBS REMOVAL 2026-09-27)
        const duration = (effect.duration || 1)
            + ((typeof unitPassiveSum === 'function') ? (unitPassiveSum(source, 'debuffTurnsBonus') || 0) : 0)
            // THE SPELL AUDIT Batch D — the per-status `statusDurationBonus` (Aftershock / Chorus / Showmanship)
            + ((typeof passiveStatusDurationBonus === 'function') ? (passiveStatusDurationBonus(source, effect.id) || 0) : 0);
        return probability * (ccDenialValue(g, source, target, effect.id, duration, v)
            + statusSetupValue(g, source, target, effect.id, v));
    }

    function _mirrorNetworkValue(unit, spell, v, net, offset, kind = 'pulse') {
        const g = G();
        const profile = g.TargetQuery.mirrorHitProfile?.(unit, spell, net, kind, offset);
        if (!profile?.source || profile.source.dead || profile.source._dying) return 0;
        const source = profile.source, f = profile.frequency;
        const tiles = new Set(net.beamTiles);
        if (kind === 'pulse') for (const tile of net.volumeTiles) tiles.add(tile);
        /* B1 (2026-10-29): Pulse's beams run on past the end prisms to the wall */
        if (kind === 'pulse' && typeof window.pulseLatticeExtension === 'function') {
            for (const tile of window.pulseLatticeExtension(unit.player, net).tiles) tiles.add(tile);
        }
        /* C2 (2026-10-29): the frequency is the hit's element (weakness, resist, the press) */
        const hitSpell = { dmg: profile.damage, damageType: 'magic', spellType: f.spellType, element: f.element || undefined };
        let value = 0;
        for (const target of v.visibleEnemies || []) {
            if (target.dead || target._dying || !tiles.has(target.x + ',' + target.y)) continue;
            const damage = estDamage(g, source, target, hitSpell, {
                rawBase: profile.damage, noElement: !f.element, noRangeMult: true,
                allowMarkBonus: false, interceptionForecast: true
            });
            value += Math.min(damage, effHp(target));
            const killed = damage >= effHp(target) && !g.unitHasStatus(target, 'indomitable');
            if (killed && damage > 0) value += killValue(g, source, target, v);
            // Riders follow the damage recipient's immunity path; DEF shred
            // is a separate engine call and can apply even through Protect.
            if (!killed && damage > 0) value += _mirrorStatusValue(g, source, target, f.status, v);
            if (!killed && f.stageBoost && !g.unitHasStatus(target, 'statLock')
                && !(typeof unitPassiveValue === 'function' && unitPassiveValue(target, 'immuneStatDown') === true)) {
                value += statusRiderValue(g, source, target, { statStageBoost: f.stageBoost }, v);
            }
        }
        return value;
    }

    /* C1 (mondo 2026-10-29): Tune picks its frequency — the CPU weighs both other frequencies and casts the better
       (the pick rides g.state._tunePick at execution, from _aiTunePick). */
    const _aiTunePick = new Map();
    function _tuneFrequencyScore(unit, spell, v, net) {
        const g = G();
        const n = (window.MIRROR_FREQS || []).length || 3;
        const cur = ((g.state._mirrorFreq || {})[unit.player]) | 0;
        let best = -Infinity, bestOff = 1;
        for (let off = 1; off < n; off++) {
            const val = _tuneOffsetScore(unit, spell, v, net, off);
            if (val > best) { best = val; bestOff = off; }
        }
        _aiTunePick.set(unit.id, (cur + bestOff) % n);
        return best;
    }
    function _tuneOffsetScore(unit, spell, v, net, off) {
        const g = G();
        // One imminent beam burn and one affordable future pulse are the
        // bounded horizon. Unknown future crossing paths earn no free value.
        let value = 0.5 * (_mirrorNetworkValue(unit, spell, v, net, off, 'burn')
            - _mirrorNetworkValue(unit, spell, v, net, 0, 'burn'));
        /* C1: the new light takes hold at once on every enemy on a beam or next to a prism (status / stage, no damage) */
        const prof = g.TargetQuery.mirrorHitProfile?.(unit, spell, net, 'burn', off);
        if (prof && prof.frequency) {
            const f = prof.frequency;
            for (const e of v.visibleEnemies || []) {
                if (e.dead || e._dying) continue;
                const on = net.beamTiles.has(e.x + ',' + e.y)
                    || (net.mirrors || []).some(m => Math.max(Math.abs(m.x - e.x), Math.abs(m.y - e.y)) <= 1);
                if (!on) continue;
                value += _mirrorStatusValue(g, unit, e, f.status, v);
                if (f.stageBoost && !g.unitHasStatus(e, 'statLock')
                    && !(typeof unitPassiveValue === 'function' && unitPassiveValue(e, 'immuneStatDown') === true)) {
                    value += statusRiderValue(g, unit, e, { statStageBoost: f.stageBoost }, v);
                }
            }
        }
        if (net.count < 3) return value;
        let before = 0, after = 0;
        for (const mate of [unit, ...(v.allies || [])]) {
            if (mate.dead || mate._dying || g.unitHasStatus(mate, 'silence')) continue;
            for (const pulse of mate.spells || []) {
                if (pulse.kind !== 'pulseLattice' || pulse.shatterPrisms) continue;
                if (typeof getSpellCooldownRemaining === 'function' && getSpellCooldownRemaining(mate, pulse) > 0) continue;
                const cost = _mpCost(mate, pulse), mp = mate.mp || 0;
                if (mp < cost) continue;
                before = Math.max(before, _mirrorNetworkValue(mate, pulse, v, net, 0) - cost * tuneW(g, 'mpValuePerPoint'));
                // Tuning cannot spend the mana reserved for the promised
                // follow-up, and promises no second spell in this activation.
                if (mp - (mate.id === unit.id ? _mpCost(unit, spell) : 0) < cost) continue;
                after = Math.max(after, _mirrorNetworkValue(mate, pulse, v, net, off) - cost * tuneW(g, 'mpValuePerPoint'));
            }
        }
        return value + 0.5 * (after - before);
    }

    /* ═══ THE FULL LIST (2026-11-01, mondo: "Should it not just have a list of all of the actions available to it each
       turn? ... yes fix all of those"). The CPU used to aim each spell at ONE target its "who matters most" ranking
       picked (threat / healer / wounded) and never looked at what the hit was worth there: in 213 CPU vs CPU matches,
       when a single-target spell had 2+ legal targets, 25% of the time the pick was worth over 10% less than the best
       legal target by the CPU's OWN scorer, 12% of the time 1.5x less (it ignored weakness, the press refund, resists,
       absorbs and the real damage unless it could kill). Now every legal target the engine lists for the cast
       (TargetQuery.spellTargets, the same list the drum shows the player) is scored with scoreSpell and the best one
       is kept. Kill-switch: window.EW_AI_NO_FULL_TARGETS. ═══ */
    const _REAIM_UNIT_KINDS = new Set(['damage', 'ricochet', 'multiHit', 'lifeDrain', 'tackle', 'debuff', 'splitBeam',
        'skyDrop', 'skySlam', 'skyThrow', 'leapStrike', 'displacement', 'pull', 'possess', 'shadowRealm', 'aoe', 'cross',
        'delayed', 'aoePull']);
    function _scoreSpellAt(unit, spell, t, v) {
        const g = G();
        _openKillTally();
        let s = 0;
        try { s = scoreSpell(unit, spell, t, v); } catch (e) { _killTally = null; return -Infinity; }
        const wb = _closeKillTally(g);
        return s > 0 ? s + wb : s;
    }
    function _reaimSpellTarget(unit, spell, v, picked) {
        const g = G();
        if (window.EW_AI_NO_FULL_TARGETS) return picked;
        if (!spell || !_REAIM_UNIT_KINDS.has(spell.kind) || spell.allyOnly || _riderRandomOf(spell)) return picked;
        /* G1/H1 (2026-11-06 playtest): a self-centred area spell (Crowd Surge, Round Up, Exhaust Cloud, EMP Burst …) always
           goes off on the caster's own square (doSpell snaps it there), so an enemy picked off the drum is never its aim.
           Re-aiming Crowd Surge at a far enemy scored the blast as if it went off on that enemy, the engine set it off on
           the Ringmaster with nobody near, and the log read "Crowd Surge hits 0 targets" every round. The picker
           (findSpellTarget) already aims these at the caster only when a body stands in the area. */
        if (spell.aoeOriginSelf) return picked;
        if ((spell.kind === 'aoe' || spell.kind === 'cross') && (spell.aoeShape === 'ring' || !((spell.range | 0) > 0))) return picked;
        if (spell.kind === 'skyThrow' && unit._skyThrowGrab) return picked;
        if (!g.TargetQuery || typeof g.TargetQuery.spellTargets !== 'function') return picked;
        let entries = null;
        try { entries = g.TargetQuery.spellTargets(unit, spell) || []; } catch (e) { return picked; }
        const vis = new Set((v.visibleEnemies || []).map(e => e.id));
        let best = picked, bestS = (picked && picked.id != null) ? _scoreSpellAt(unit, spell, picked, v) : -Infinity, n = 0;
        if (picked && picked.id == null) bestS = _scoreSpellAt(unit, spell, picked, v);   // a tile pick (elemental tile, blast centre) competes too
        for (const en of entries) {
            const t = en && en.unit;
            if (!t || t.dead || t._dying || t.player === unit.player || !vis.has(t.id) || isProtected(g, t)) continue;
            if (picked && picked.id === t.id) continue;
            try { if (typeof window.spellAimProblemOn === 'function' && window.spellAimProblemOn(unit, spell, t) !== null) continue; } catch (e) { continue; }
            if (++n > 12) break;   // the weak-PC cap: a dozen bodies is every fight this game has
            const s = _scoreSpellAt(unit, spell, t, v);
            if (s > bestS) { bestS = s; best = t; }
        }
        return best;
    }

    /* ═══ THE PUSH LANDING (2026-11-01, same ask). Pushes, pulls, throws and shoves scored a flat ~16 a square: the CPU
       never looked at where the body ends. Now each forced-movement cast is read through the engine's own forecast
       (forecastSpellPlan: the slide with the real physics, its crashes, bounces, auto attacks, the chain its landing
       sets off, a hostile Nexus burn, a trap), and the landing square is priced the way the CPU prices its own squares
       (aiHazardPenaltyAt: lava, deep water, burning ground, poison, a telegraphed blast, a capture door) plus the fall
       (a drop of 3+ levels, applyFallDamage's numbers). Our own bodies the cast moves or hurts count against it.
       Kill-switch: window.EW_AI_NO_PUSH_FORECAST. ═══ */
    const _FORCED_KINDS = new Set(['linePush', 'displacement', 'pull', 'aoePull', 'tackle', 'skyThrow']);
    function _isForcedSpell(sp) {
        return !!sp && (_FORCED_KINDS.has(sp.kind) || sp.pushDistance > 0 || sp.pullDistance > 0 || sp.displaceDistance > 0);
    }
    function _aiFallDmgEst(g, u, fromZ, toX, toY) {
        if (!u) return 0;
        try { if (typeof g.canFly === 'function' && g.canFly(u)) return 0; } catch (e) {}
        const toZ = typeof g.getHeightAt === 'function' ? g.getHeightAt(toX, toY) : 0;
        const thr = (typeof FALL_DAMAGE_THRESHOLD !== 'undefined') ? FALL_DAMAGE_THRESHOLD : 3;
        const drop = (fromZ ?? 0) - (toZ ?? 0);
        if (drop < thr) return 0;
        try {
            const t = g.getTerrainAt(toX, toY);
            if (typeof liquidFamilyOf === 'function' && liquidFamilyOf(t)) return 0;   // a liquid breaks the fall
        } catch (e) {}
        const pct = (typeof FALL_DAMAGE_PCT_PER_LEVEL !== 'undefined') ? FALL_DAMAGE_PCT_PER_LEVEL : 0.05;
        let mult = 1;
        try { if (typeof getUnitFallDamageMult === 'function') mult = getUnitFallDamageMult(u) || 1; } catch (e) {}
        return Math.max(1, Math.round((u.maxHp || 100) * pct * (drop - (thr - 1)) * mult));
    }
    // The landing's worth for one moved body, from the caster's side: + for an enemy put somewhere bad, − for an ally.
    function _landingWorth(g, unit, u, fromX, fromY, toX, toY, v) {
        if (!u || u.dead || (fromX === toX && fromY === toY)) return 0;
        const enemy = u.player !== unit.player;
        let w = aiHazardPenaltyAt(u, toX, toY) - aiHazardPenaltyAt(u, fromX, fromY);
        const fall = _aiFallDmgEst(g, u, standH(g, u), toX, toY);
        if (fall > 0) {
            w += Math.min(fall, effHp(u));
            if (enemy && fall >= effHp(u)) w += killValue(g, unit, u, v);
        }
        // a body carried off a Nexus zone it stands in stops counting there (contest / capture / hold)
        try {
            const nps = g.state.nexusPoints || {};
            for (const k of Object.keys(nps)) {
                const nx = nps[k];
                if (!nx) continue;
                if (_aiNexContains(nx, fromX, fromY) && !_aiNexContains(nx, toX, toY)) { w += 35; break; }
            }
        } catch (e) {}
        // our own capture door / the enemy Cube side do their own pricing in _capHazardAt; enemies next to our melee
        // after the move are a free swing for the next ally up
        if (enemy && v && v.allies) {
            for (const a of v.allies) {
                if (!a || a.dead || a.id === unit.id) continue;
                let ar = 1;
                try { ar = g.getEffectiveRange(a) || 1; } catch (e) {}
                if (ar <= 1 && Math.max(Math.abs(a.x - toX), Math.abs(a.y - toY)) <= 1) { w += 12; break; }
            }
        }
        return enemy ? w : -w;
    }
    let _pushPlanCache = new Map();
    function _pushPlan(g, unit, spell, target) {
        if (window.EW_AI_NO_PUSH_FORECAST || typeof window.forecastSpellPlan !== 'function') return null;
        if (!target || target.x == null) return null;
        const key = unit.id + '|' + unit.x + ',' + unit.y + '|' + spell.id + '|' + target.x + ',' + target.y + ',' + (target.z ?? '');
        if (_pushPlanCache.has(key)) return _pushPlanCache.get(key);
        let plan = null;
        try { plan = window.forecastSpellPlan(unit, spell, target.x, target.y, target.z); } catch (e) { plan = null; }
        if (!plan || !plan.handled) plan = null;
        if (_pushPlanCache.size > 400) _pushPlanCache = new Map();
        _pushPlanCache.set(key, plan);
        return plan;
    }
    /* What the forced moves of this cast are worth on top of the kind scorer's direct hits: the landings, plus the
       knock-on damage (crashes, slams, auto attacks, chain blasts, storm flings, a hostile Nexus burn) the direct-hit
       scorer never saw. null = no forecast (the old flat bonus stays). */
    function _forcedMoveValue(g, unit, spell, target, v) {
        if (!_isForcedSpell(spell)) return null;
        const plan = _pushPlan(g, unit, spell, target);
        if (!plan) return null;
        let val = 0, moved = 0;
        for (const m of (plan.moves || [])) {
            const u = m.unit;
            if (!u || u.id === unit.id || m.mode === 'self') continue;
            moved += Math.abs((m.x ?? u.x) - u.x) + Math.abs((m.y ?? u.y) - u.y);
            val += _landingWorth(g, unit, u, u.x, u.y, m.x, m.y, v);
        }
        for (const h of (plan.hits || [])) {
            const u = h.unit;
            if (!u || u.dead) continue;
            const enemy = u.player !== unit.player;
            if (!enemy) {
                if (u.id !== unit.id && h.dmg > 0) val -= Math.min(h.dmg, effHp(u)) * 1.2;   // our own crashed body
                continue;
            }
            const direct = h.direct ? Math.min(estDamage(g, unit, u, spell), effHp(u)) : 0;
            const extra = Math.max(0, Math.min(h.dmg || 0, effHp(u)) - direct);
            if (extra > 0) {
                val += extra;
                if ((h.dmg || 0) >= effHp(u) && direct < effHp(u)) val += killValue(g, unit, u, v) * 0.9;
            }
            if (h.nexusBurn > 0) val += Math.min(h.nexusBurn, effHp(u)) * 0.8;
            if ((h.tags || []).includes('trap')) val += 50;
        }
        // the move itself still scrambles a formation a little (the old flat bonus, much smaller)
        val += Math.min(moved, 6) * 6;
        return val;
    }

    function scoreSpells(unit, v, out) {
        const g = G();
        const ap = unit.ap || 0;
        if (g.unitHasStatus(unit, 'silence')) return;

        for (const spell of (unit.spells || [])) {
            if (!spell) continue;
            if (_failedSpells.has(spell.name)) continue;
            const apCost = g.TargetQuery.apCost(spell);
            if (ap < apCost || !g.TargetQuery.canAfford(unit, spell) || unit.mp < _mpCost(unit, spell)) continue;

            const target = _reaimSpellTarget(unit, spell, v, findSpellTarget(unit, spell, v));
            const noTargetKinds = ['healAll', 'manaRestoreAll', 'barrage', 'warCry', 'encore', 'deployTurret', 'utility',
                'escape', 'selfHeal', 'transform'];
            if (!target && !noTargetKinds.includes(spell.kind)) continue;

            // multi-kill wipeout: the tally sees every victim this one cast drops
            _openKillTally();
            let score = 0;
            try { score = scoreSpell(unit, spell, target, v); } catch (e) { _killTally = null; throw e; }
            const _wipeB = _closeKillTally(g);
            if (score > 0) score += _wipeB;
            if (score <= 0) continue;
            // 🚪 THE ONE-WAY DOOR (§4.2): never land ourselves on a door, never slide an ally onto one
            const _capFeed = _capSpellFeeds(g, unit, spell, target);
            if (_capFeed === Infinity) continue;
            score -= _capFeed;
            if (score <= 0) continue;

            // MP is a real lever: every cast pays its cost in the currency.
            score -= _mpCost(unit, spell) * tuneW(g, 'mpValuePerPoint');
            if (score <= 0) continue;

            const _cand = { type: 'spell', spell, target, score, apCost, partner: _aiPairPick[spell.id] || null };
            if (target && target._tpMover === unit.id && target._tpLand) _cand._endAt = target._tpLand;   // a self warp ends where it lands
            out.push(_cand);
        }
    }

    /* ── THE TARGETING RIDERS (SPELL_LIBRARY_PLAN §6.2, Phase 3) ──────────────────────────────────────────────
       randomTargets (no aim — the engine rolls the victims): worth the MEAN hit over the pool × the hits it will land
       (distinct: min(count, pool)); the cast target is the caster itself. splash: the primary hit + every enemy the
       splash reaches round the victim at × mult (minus allies caught when the splash hits 'units'); the target picker
       prefers the victim with the most worth round it. data.js owns the normalisers (spellRandomTargetsOf /
       spellSplashOf / splashOffsets). */
    function _riderRandomOf(spell) {
        return (spell && spell.randomTargets && typeof spellRandomTargetsOf === 'function') ? spellRandomTargetsOf(spell) : null;
    }
    function _riderSplashOf(spell) {
        return (spell && spell.splash && typeof spellSplashOf === 'function') ? spellSplashOf(spell) : null;
    }
    function _riderEnemiesInReach(g, unit, spell, v) {
        const R = _effRange(unit, spell);
        const longR = _isLongRange(spell);
        const srcZ = standH(g, unit);
        return (v.visibleEnemies || []).filter(e => !e.dead && !isProtected(g, e)).filter(e => {
            const d = _reach(g, unit.x, unit.y, srcZ, e, longR);
            return d >= 1 && d <= R && (spell.ignoresLineOfSight || !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y));
        });
    }
    function _randomTargetsScore(g, unit, spell, rnd, v) {
        const pool = _riderEnemiesInReach(g, unit, spell, v);
        if (!pool.length) return 0;
        const hitSpell = rnd.mult !== 1 ? Object.assign({}, spell, { dmg: Math.round((spell.dmg || 0) * rnd.mult) }) : spell;
        let sum = 0;
        // the engine rolls the victims: a pool of kills is not a sure multi-kill, so it never counts toward the wipeout tally
        const _kt = _killTally; _killTally = null;
        try { for (const e of pool) sum += scoreOffensiveHit(g, unit, e, hitSpell, v, { splash: true }).val; }
        finally { _killTally = _kt; }
        let n = pool.length;
        if (rnd.scope === 'units') {
            // our own side in reach dilutes the roll: each ally drawn is a hit on us
            const R = _effRange(unit, spell);
            for (const a of (v.allies || [])) {
                if (!a || a.dead || a.id === unit.id) continue;
                if (Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) > R) continue;
                sum -= (hitSpell.dmg || 0) * 1.2; n++;
            }
        }
        const hits = rnd.distinct ? Math.min(rnd.count, n) : rnd.count;
        return Math.max(0, (sum / n) * hits);
    }
    function _splashBonus(g, unit, spell, target, v) {
        const sp = _riderSplashOf(spell);
        if (!sp || !target) return 0;
        const keys = new Set(splashOffsets(sp).map(o => (target.x + o[0]) + ',' + (target.y + o[1])));
        const hitSpell = Object.assign({}, spell, { dmg: Math.round((spell.dmg || 0) * sp.mult) });
        let s = 0;
        for (const e of (v.visibleEnemies || [])) {
            if (!e || e.dead || e.id === target.id || !keys.has(e.x + ',' + e.y)) continue;
            s += scoreOffensiveHit(g, unit, e, hitSpell, v, { splash: true }).val;
        }
        if (sp.team === 'units') {
            for (const a of (v.allies || [])) {
                if (!a || a.dead || a.id === unit.id || !keys.has(a.x + ',' + a.y)) continue;
                s -= (hitSpell.dmg || 0) * 1.2;
            }
        }
        return s;
    }

    // THE PUSH LANDING: the core scorer's own flat displacement bonus, taken back out when the forecast prices the move
    function _flatPushBonus(g, unit, spell, target, v) {
        const k = spell.kind;
        const allies = (v && v.allies) || [];
        const meleeNear = () => allies.filter(a => { try { return g.getEffectiveRange(a) <= 1 && Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= 4; } catch (e) { return false; } }).length;
        const enemies = (v && v.visibleEnemies) || [];
        if (k === 'tackle') return (spell.pushDistance || 1) * 16;
        if (k === 'linePush') {
            const plan = _pushPlan(g, unit, spell, target);
            const n = plan ? (plan.moves || []).filter(m => m.unit && m.unit.player !== unit.player).length : 1;
            return Math.max(1, n) * (spell.pushDistance || 1) * 16;
        }
        if (k === 'displacement') return 40 + enemies.filter(e => e.id !== target.id && Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 2).length * 25;
        if (k === 'pull' && !spell.allyOnly) return 40 + meleeNear() * 45 + (spell.pullThroughHazards ? 60 : 0);
        if (k === 'aoePull') {
            const area = _aoeTilesAI(spell, target.x, target.y, spell.aoeRadius || 1);
            const n = enemies.filter(e => area.some(t => t.x === e.x && t.y === e.y)).length;
            return (spell.noDamage ? 0 : n * 30) + meleeNear() * 30;
        }
        if (k === 'cross' && spell.pushDistance) {
            const cx = spell.aoeOriginSelf ? unit.x : target.x, cy = spell.aoeOriginSelf ? unit.y : target.y;
            const tiles = _crossFootprintAI(spell, cx, cy);
            return enemies.filter(e => tiles.some(t => t.x === e.x && t.y === e.y)).length * spell.pushDistance * 14;
        }
        return 0;
    }
    function scoreSpell(unit, spell, target, v) {
        const base = _scoreSpellCore(unit, spell, target, v);
        if (!(base > 0) || !target || !_isForcedSpell(spell) || spell.kind === 'skyThrow' || spell.allyOnly) return base;
        const g = G();
        const fv = _forcedMoveValue(g, unit, spell, target, v);
        if (fv == null) return base;
        return Math.max(0, base - _flatPushBonus(g, unit, spell, target, v) + fv * wght(g, 'forcedMoveValue_v1', 1));
    }

    function _scoreSpellCore(unit, spell, target, v) {
        const g = G();
        const kind = spell.kind;
        /* B2 (2026-10-29): a single cast into the enemy's lattice comes back at us — never worth it */
        if (target && target.id != null && typeof window.prismReflectFor === 'function' && window.prismReflectFor(unit, spell, target)) return 0;

        if (kind === 'damage' && _riderRandomOf(spell)) return target ? _randomTargetsScore(g, unit, spell, _riderRandomOf(spell), v) : 0;

        // ── single-target damage family ──
        if (kind === 'guard') return _chivalryScore(unit, spell, target, v);
        if (kind === 'trickRoom') return _trickRoomScore(unit, spell, v);

        if (['damage', 'ricochet', 'multiHit', 'tackle'].includes(kind)) {
            // Elemental tile cast: the target is a TILE the reaction makes
            // worthwhile (bolt the pool, torch the brush).
            if (target && target._elemTile) {
                return ((spell.dmg || 112) + _spellPowerOf(g, unit, spell)) * 0.8;
            }
            if (!target) return 0;
            const hit = scoreOffensiveHit(g, unit, target, spell, v, {});
            // tackle (Sky Tackle, Phase 5 wave A): the carry is worth what a
            // linePush's shove is — displacement per tile.
            if (kind === 'tackle') return hit.val + (spell.pushDistance || 1) * 16;
            // THE SPLASH RIDER (Phase 3): the bodies round the victim
            return kind === 'damage' ? hit.val + _splashBonus(g, unit, spell, target, v) : hit.val;
        }

        if (kind === 'transform') {
            // Sedan (Phase 5 wave A): mecha when the fight is in reach (range +
            // armour) or it's hurt; car when it has to cross the map. Never
            // flip for nothing — same stance as wanted scores 0.
            const inMecha = g.unitHasStatus(unit, spell.formB || 'mechaForm');
            const near = (v.closestEnemyDist ?? Infinity) <= 4;
            const wantMecha = near || (unit.hp / unit.maxHp) < 0.5;
            if (wantMecha === inMecha) return 0;
            return 60 + (near ? 40 : 0);
        }

        // ── CHAMP_REWORK Phase 5 wave B: control + links ──
        if (kind === 'possess') {
            if (!target) return 0;
            const acts = Math.max(1, spell.activations | 0);
            const extra = spell.bonusVsStatus && _bonusVsMatches(target, spell.bonusVsStatus);
            const n = extra ? Math.max(acts + 1, Math.round(acts * (spell.bonusVsStatus.mult || 1.5))) : acts;
            // A stolen body is worth what it would have done to us, and then
            // what it does to them — per activation; a dying body is a poor steal.
            let s = n * unitThreatOutput(g, target, unit) * 1.6 + getTargetPriority(target, unit, v) * 0.3;
            if (spell.dmg) s += scoreOffensiveHit(g, unit, target, spell, v, { splash: true }).val * 0.8;
            if ((target.hp / (target.maxHp || 1)) < 0.25) s *= 0.6;
            return s;
        }
        if (kind === 'shadowRealm') {
            if (!target) return 0;
            // One-on-one with the demon: worth it when the demon out-trades the
            // target and the target is worth isolating (a healer, a threat).
            const mine = unitThreatOutput(g, unit, target), theirs = unitThreatOutput(g, target, unit);
            let s = 40 + getTargetPriority(target, unit, v) * 0.4 + Math.max(0, mine - theirs) * 0.8;
            if ((unit.hp / (unit.maxHp || 1)) < 0.35) s *= 0.4;
            return s;
        }
        if (kind === 'link') {
            if (!target) return 0;
            const partner = _aiPairPick[spell.id];
            if (!partner) return 0;
            const defs = (typeof STATUS_DEFS !== 'undefined') ? STATUS_DEFS : (g.STATUS_DEFS || {});
            const def = defs[((spell.statusEffects || [])[0] || {}).id] || {};
            const pct = def.linkEcho || 0.3;
            if (spell.linkTargets === 'enemy-ally') {
                // Voodoo: the doll pays for what our most exposed ally takes.
                return 30 + pct * unitThreatOutput(g, target, partner) * 1.5 + getTargetPriority(target, unit, v) * 0.2;
            }
            // Soul Bind: every hit on either enemy echoes into the other.
            return 30 + pct * (unitThreatOutput(g, unit, target) + unitThreatOutput(g, unit, partner)) * 1.2
                + (getTargetPriority(target, unit, v) + getTargetPriority(partner, unit, v)) * 0.15;
        }
        if (kind === 'transfer') {
            if (!target) return 0;   // target = the giver; the receiver is the pair pick
            const receiver = _aiPairPick[spell.id];
            if (!receiver) return 0;
            const take = Math.round((target.maxHp || 0) * (spell.takePct || 0.3));
            const give = Math.round(take * (spell.givePct || 1.5));
            return healValue(g, unit, receiver, give, v) - healValue(g, unit, target, take, v) * 0.5;
        }
        if (kind === 'cannibalize') {
            if (!target) return 0;
            const amt = Math.round((unit.maxHp || 0) * (spell.healPct || 0.35));
            let s = healValue(g, unit, unit, amt, v);
            if (target.player !== unit.player && target._respawnIn != null) s += 25;   // a delayed enemy respawn
            return s;
        }

        if (kind === 'lifeDrain') {
            if (!target) return 0;
            const hit = scoreOffensiveHit(g, unit, target, spell, v, {});
            const drain = Math.min(hit.est * (spell.drainPct || 0.5), unit.maxHp - unit.hp);
            return hit.val + healValue(g, unit, unit, drain, v) * 0.8;
        }

        if (kind === 'aoe') {
            const cx = spell.aoeOriginSelf ? unit.x : target.x;
            const cy = spell.aoeOriginSelf ? unit.y : target.y;
            const area = getSpellAoeAreaAI(spell, cx, cy);
            const victims = v.visibleEnemies.filter(e => area.some(t => t.x === e.x && t.y === e.y) && !isProtected(g, e));
            /* TRICK OR TREAT (2026-10-29): aoeAllyHeal also heals every ally in the area (the caster too) — worth casting for
               the heal alone, like a healAll */
            let _allyHealVal = 0;
            if (spell.aoeAllyHeal > 0) {
                for (const a of g.aliveUnitsFor(unit.player)) if (area.some(t => t.x === a.x && t.y === a.y)) _allyHealVal += healValue(g, unit, a, spell.aoeAllyHeal, v) * 0.9;
            }
            if (!victims.length) return _allyHealVal;
            /* THE SPELL AUDIT D: a damage zone (zoneTickDamage) is scored as one hit worth ~60% of its ticks (they
               walk out); an area drain (aoeLifeDrain) adds the heal it buys the caster. */
            const _zoneShim = spell.zoneTickDamage > 0
                ? Object.assign({}, spell, { dmg: (spell.dmg || 0) + Math.round(spell.zoneTickDamage * Math.min(spell.zoneDuration || 1, 3) * 0.6) })
                : spell;
            let s = 0, first = true, _estSum = 0;
            for (const e of victims) {
                const hit = scoreOffensiveHit(g, unit, e, _zoneShim, v, { splash: !first });
                s += hit.val;
                _estSum += hit.est || 0;
                first = false;
            }
            if (spell.aoeLifeDrain > 0 && _estSum > 0) s += healValue(g, unit, unit, Math.min(_estSum * spell.aoeLifeDrain, unit.maxHp - unit.hp), v) * 0.6;
            return s + _allyHealVal;   // engine AoE never hits allies — no friendly-fire term
        }

        if (kind === 'cross') {
            const cx = spell.aoeOriginSelf ? unit.x : (target ? target.x : unit.x);
            const cy = spell.aoeOriginSelf ? unit.y : (target ? target.y : unit.y);
            const crossTiles = _crossFootprintAI(spell, cx, cy);
            const victims = v.visibleEnemies.filter(e => crossTiles.some(t => t.x === e.x && t.y === e.y) && !isProtected(g, e));
            if (!victims.length) return 0;
            let s = 0, first = true;
            for (const e of victims) {
                const hit = scoreOffensiveHit(g, unit, e, spell, v, { splash: !first });
                s += hit.val;
                if (spell.pushDistance) s += spell.pushDistance * 14;
                first = false;
            }
            return s;
        }

        if (kind === 'barrage') {
            // Engine-true target model (mirrors _barrageTargets): combatReach
            // with real Z + gravity assist, self-origin novas reach aoeRadius,
            // wet-only filters, LOS unless the spell ignores it. This is what
            // kills the "casts Requiem at nobody" whiff class.
            const bRange = (spell.aoeOriginSelf && spell.aoeRadius) ? spell.aoeRadius : _effRange(unit, spell);
            const longR = _isLongRange(spell);
            const srcZ = standH(g, unit);
            const victims = v.visibleEnemies.filter(e => {
                if (spell.hitsWetOnly && !(typeof g._isWetTile === 'function' && g._isWetTile(e.x, e.y))) return false;
                if (isProtected(g, e)) return false;
                const d = _reach(g, unit.x, unit.y, srcZ, e, longR);
                return d >= 1 && d <= bRange
                    && (spell.ignoresLineOfSight || !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y));
            });
            if (!victims.length) return 0;
            let s = 0, first = true;
            for (const e of victims) {
                s += scoreOffensiveHit(g, unit, e, spell, v, { splash: !first }).val;
                first = false;
            }
            if (victims.length === 1 && (spell.cost || 0) >= 50) s *= 0.75; // big novas want crowds
            return s;
        }

        if (kind === 'aoePull') {
            if (!target) return 0;
            // a self-centred pull (Crowd Surge, Round Up) goes off on the caster whatever the aim (doSpell's self-cast snap)
            const area = spell.aoeOriginSelf ? _aoeTilesAI(spell, unit.x, unit.y, spell.aoeRadius || 1)
                : _aoeTilesAI(spell, target.x, target.y, spell.aoeRadius || 1);
            const victims = v.visibleEnemies.filter(e => area.some(t => t.x === e.x && t.y === e.y) && !isProtected(g, e));
            if (!victims.length) return 0;
            let s = 0, first = true;
            for (const e of victims) {
                /* THE SPELL AUDIT Batch D: a noDamage pull (Round Up) is worth the haul and its statuses only */
                if (spell.noDamage) { s += 25 + (spell.statusEffects ? 15 : 0); continue; }
                s += scoreOffensiveHit(g, unit, e, spell, v, { splash: !first }).val;
                s += 30;   // yanked out of position
                first = false;
            }
            const meleeAllies = v.allies.filter(a =>
                g.getEffectiveRange(a) <= 1 && Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= 4).length;
            s += meleeAllies * 30;
            return s;
        }

        if (kind === 'dash') {
            if (!target) return 0;
            const path = g.getLinePoints(unit.x, unit.y, target.x, target.y);
            const dashPathDmg = spell.dashDamage || spell.dmg || 96;
            const dashPrimaryDmg = (spell.dashDamage != null) ? (spell.dmg || dashPathDmg) : dashPathDmg;
            let s = 0;
            for (const pt of path) {
                const victim = v.visibleEnemies.find(e => e.x === pt.x && e.y === pt.y);
                if (!victim || isProtected(g, victim)) continue;
                const isPrimary = (pt.x === target.x && pt.y === target.y);
                const pseudo = Object.assign({}, spell, { dmg: isPrimary ? dashPrimaryDmg : dashPathDmg, hitDamages: null });
                const est = estDamage(g, unit, victim, pseudo);
                s += Math.min(est, effHp(victim));
                if (est >= effHp(victim)) s += killValue(g, unit, victim, v) * 0.9;
                s += statusRiderValue(g, unit, victim, spell, v) * 0.6;
            }
            // Phase 6 (Drive-By): the shot after the run — the weakest
            // visible enemy within afterShot.range of the landing tile.
            if (spell.afterShot) {
                const _asR = spell.afterShot.range || 3;
                const _asC = v.visibleEnemies.filter(e => !isProtected(g, e)
                    && Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= _asR
                    && !g.isRangeBlockedByTerrain(target.x, target.y, e.x, e.y))
                    .sort((a, b) => a.hp - b.hp);
                if (_asC.length) {
                    const _asV = _asC[0];
                    const pseudo = Object.assign({}, spell, { dmg: spell.afterShot.dmg || 0, hitDamages: null, dashDamage: null });
                    const est = estDamage(g, unit, _asV, pseudo);
                    s += Math.min(est, effHp(_asV));
                    if (est >= effHp(_asV)) s += killValue(g, unit, _asV, v) * 0.9;
                }
            }
            if (s <= 0) return 0;
            // the dash also repositions us — credit tower approach
            if (v.enemyTower && v.enemyTower.hp > 0) {
                const curDist = Math.abs(unit.x - v.enemyTower.x) + Math.abs(unit.y - v.enemyTower.y);
                const newDist = Math.abs(target.x - v.enemyTower.x) + Math.abs(target.y - v.enemyTower.y);
                if (newDist < curDist) s += (curDist - newDist) * 10;
            }
            return s;
        }

        if (kind === 'line' || kind === 'linePush') {
            if (!target) return 0;
            // Beams fire along sign(target−caster) rays and stop at walls; the
            // aim must stay on the spine even when victims occupy side lanes.
            const adx = Math.abs(target.x - unit.x), ady = Math.abs(target.y - unit.y);
            const aligned = (adx === 0 || ady === 0 || adx === ady) && (adx + ady > 0);
            if (!aligned) return 0;
            const dx = Math.sign(target.x - unit.x), dy = Math.sign(target.y - unit.y);
            let s = 0, hits = 0, first = true;
            for (const { x: tx, y: ty } of _lineFootprintAI(g, unit, spell, dx, dy)) {
                // THE 3D LINE: only the bodies the aimed line passes through
                // (a flyer and a grounded unit can share a tile)
                const here = (typeof g.lineBeamHits === 'function')
                    ? v.visibleEnemies.filter(en => en.x === tx && en.y === ty)
                    : [v.visibleEnemies.find(en => en.x === tx && en.y === ty)].filter(Boolean);
                for (const e of here) {
                    if (e.dead || isProtected(g, e) || !_lineBeamHitsAI(g, unit, spell, dx, dy, target, e)) continue;
                    hits++;
                    s += scoreOffensiveHit(g, unit, e, spell, v, { splash: !first }).val;
                    if (kind === 'linePush') s += (spell.pushDistance || 1) * 16;
                    first = false;
                }
            }
            if (!hits) return 0;
            if (spell.leaveTerrain) s += 30;
            return s;
        }

        if (kind === 'splitBeam') {
            if (!target) return 0;
            const hit = scoreOffensiveHit(g, unit, target, spell, v, {});
            if (hit.val <= 0) return 0;
            const splitR = spell.splitRadius || 2;
            const nearby = v.visibleEnemies.filter(e =>
                e.id !== target.id && Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= splitR && !isProtected(g, e));
            const actualSplits = Math.min(nearby.length, spell.splitCount || 2);
            let s = hit.val;
            const splitScale = (spell.splitDmg || 64) / Math.max(1, spell.dmg || 96);
            for (let i = 0; i < actualSplits; i++) {
                const e = nearby[i];
                const est = Math.round(estDamage(g, unit, e, spell) * splitScale);
                s += Math.min(est, effHp(e));
                if (est >= effHp(e)) s += killValue(g, unit, e, v) * 0.8;
            }
            return s;
        }

        if (kind === 'delayed') {
            if (!target) return 0;
            // Delayed blasts give the target a full round to leave. Value by
            // P(still there): rooted/stunned/frozen/sleeping targets can't
            // walk out — that is this kind's REAL use case (its own
            // bonusVsStatus, usually). Never scored as a kill-securer.
            const area = _aoeTilesAI(spell, target.x, target.y, spell.aoeRadius || 1);
            const victims = v.visibleEnemies.filter(e => area.some(t => t.x === e.x && t.y === e.y) && !isProtected(g, e));
            if (!victims.length) return 0;
            const tracking = !!spell.delayedMark;
            let s = 0;
            for (const e of victims) {
                let stayP = tracking ? AI_TUNE.delayedEscapeTracking : AI_TUNE.delayedEscapeStatic;
                try {
                    if (['root', 'stun', 'freeze', 'frozen', 'sleep'].some(id => g.unitHasStatus(e, id))) stayP = 1.0;
                } catch (q) {}
                const est = estDamage(g, unit, e, spell);
                s += Math.min(est, effHp(e)) * stayP;
            }
            if (v.enemyTower && v.enemyTower.hp > 0) {
                const tDist = Math.abs(v.enemyTower.x - target.x) + Math.abs(v.enemyTower.y - target.y);
                if (tDist <= 2) s += 80;
            }
            return s;
        }

        if (kind === 'displacement') {
            if (!target) return 0;
            let s = scoreOffensiveHit(g, unit, target, spell, v, {}).val;
            if (s <= 0) return 0;
            const nearbyEnemies = v.visibleEnemies.filter(e =>
                e.id !== target.id && Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 2).length;
            s += 40 + nearbyEnemies * 25;   // scrambles their formation
            return s;
        }

        /* THE SPELL AUDIT Batch D: an ally haul (Rescue Line) — worth it for a hurt or debuffed ally with enemies on it */
        if (kind === 'pull' && spell.allyOnly) {
            if (!target || target.player !== unit.player || target.id === unit.id) return 0;
            const threat = v.visibleEnemies.filter(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 2).length;
            if (!threat) return 0;
            const hpPct = target.hp / Math.max(1, target.maxHp);
            const debuffed = Object.keys(target.status || {}).some(k => (target.status[k] | 0) > 0 && typeof STATUS_DEFS !== 'undefined' && STATUS_DEFS[k] && STATUS_DEFS[k].kind === 'debuff');
            let s = threat * 25 + (hpPct < 0.5 ? 70 : hpPct < 0.75 ? 30 : 0) + (debuffed && spell.cleanse ? 35 : 0);
            return s >= 50 ? s : 0;
        }
        if (kind === 'pull') {
            if (!target) return 0;
            let s = 0;
            if (spell.dmg) s += scoreOffensiveHit(g, unit, target, spell, v, {}).val;
            const meleeAllies = v.allies.filter(a =>
                g.getEffectiveRange(a) <= 1 && Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= 4).length;
            s += 60 + meleeAllies * 45;                       // feed the frontline
            if (spell.pullThroughHazards) s += 60;
            if (g.getEffectiveRange(target) >= 3) s += 50;    // yank the sniper off its perch
            s += getTargetPriority(target, unit, v) * 0.25;
            return s;
        }

        if (kind === 'skyDrop' || kind === 'skyThrow' || kind === 'skySlam') {
            if (!target) return 0;
            if (spell.requiresFlight) {
                try {
                    if (typeof g.canFly === 'function' && !g.canFly(unit)) return 0;
                    if (typeof g.isFlightCrippled === 'function' && g.isFlightCrippled(unit)) return 0;
                } catch (e) {}
            }
            const dist = Math.abs(unit.x - target.x) + Math.abs(unit.y - target.y);
            if (dist > (_effRange(unit, spell) || 1)) return 0;
            const casterZ = standH(g, unit);
            const carryH = spell.carryHeight || 4;
            const landingZ = typeof g.getHeightAt === 'function' ? g.getHeightAt(target.x, target.y) : 0;
            const elevDelta = Math.max(0, (casterZ + carryH) - landingZ);
            const pseudo = Object.assign({}, spell, { dmg: (spell.dmg || 60) + elevDelta * (spell.dmgPerLevel || 25) });
            const est = estDamage(g, unit, target, pseudo);
            let s = Math.min(est, effHp(target));
            if (est >= effHp(target)) s += killValue(g, unit, target, v);
            s += statusRiderValue(g, unit, target, spell, v);
            s += getTargetPriority(target, unit, v) * 0.35;
            if (kind === 'skyThrow') {
                const nearbyEnemies = v.visibleEnemies.filter(e =>
                    e.id !== target.id &&
                    Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= (spell.throwRange || 3)).length;
                s += nearbyEnemies * (spell.collisionBonus || 50) * 0.5;
            }
            if (kind === 'skySlam' && spell.aoeRadius) {
                const inSplash = _aoeSplashTestAI(spell, target);
                const aoeHits = v.visibleEnemies.filter(e => e.id !== target.id && inSplash(e)).length;
                s += aoeHits * est * (spell.aoeDmgPct || 0.5) * 0.6;
            }
            if (spell.drainPct) s += healValue(g, unit, unit, est * spell.drainPct, v) * 0.6;
            return s;
        }

        if (kind === 'leapStrike') {
            if (!target) return 0;
            const dist = Math.abs(unit.x - target.x) + Math.abs(unit.y - target.y);
            if (dist > (_effRange(unit, spell) || 2)) return 0;
            // Engine gate: the caster MUST stand strictly above the target
            // ("Must be above the target") — mirroring it here is what keeps
            // the old Valkyrie infinite-retry loop dead.
            const casterZ = standH(g, unit);
            const targetZ = standH(g, target);
            if (casterZ <= targetZ) return 0;
            const elevDelta = casterZ - targetZ;
            const pseudo = Object.assign({}, spell, { dmg: (spell.dmg || 80) + elevDelta * (spell.dmgPerLevel || 20) });
            const est = estDamage(g, unit, target, pseudo);
            let s = Math.min(est, effHp(target));
            if (est >= effHp(target)) s += killValue(g, unit, target, v);
            s += statusRiderValue(g, unit, target, spell, v);
            s += getTargetPriority(target, unit, v) * 0.35;
            if (spell.aoeRadius) {
                const inSplash = _aoeSplashTestAI(spell, target);
                const aoeHits = v.visibleEnemies.filter(e => e.id !== target.id && inSplash(e)).length;
                s += aoeHits * est * (spell.aoeDmgPct || 0.4) * 0.6;
            }
            return s;
        }

        // ── healing / support family ──
        if (kind === 'heal' && target) {
            const amt = spell.healPct ? Math.floor((target.maxHp || 0) * spell.healPct)   // THE SPELL AUDIT B: Time Rewind heals a share of max HP
                : (spell.healAmt != null ? spell.healAmt : (spell.heal || 24));
            let _hs = healValue(g, unit, target, amt, v);
            // THE SPELL AUDIT D: Divine Light also sears every enemy beside the healed ally
            if (spell.healAdjacentDamage) {
                const _hadShim = Object.assign({}, spell, { dmg: spell.healAdjacentDamage, kind: 'damage' });
                for (const e of v.visibleEnemies) {
                    if (Math.max(Math.abs(e.x - target.x), Math.abs(e.y - target.y)) !== 1 || isProtected(g, e)) continue;
                    _hs += scoreOffensiveHit(g, unit, e, _hadShim, v, { splash: true }).val * 0.8;
                }
            }
            return _hs;
        }
        if (kind === 'healAll') {
            const allies = g.aliveUnitsFor(unit.player).filter(a => !spell.auraRadius   // THE SPELL AUDIT C: aura heals
                || Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= spell.auraRadius);
            const hBase = spell.healAmt != null ? spell.healAmt : (spell.heal || 16);
            let s = 0;
            for (const a of allies) s += healValue(g, unit, a, hBase, v) * 0.9;
            // Team-wide stat buffs (Iron Dome, Veil of Light) ride healAll.
            if (spell.statStageBoost && v.visibleEnemies.length > 0 && !g.unitHasStatus(unit, 'statUp')) {
                for (const a of allies) s += buffStageValue(g, unit, a, spell, v) * 0.5;
            }
            return s;
        }
        if (kind === 'zoneHeal') {
            if (!target) return 0;
            const area = _aoeTilesAI(spell, target.x, target.y, spell.aoeRadius || 1);
            const inArea = [unit, ...v.allies].filter(a => !a.dead && area.some(t => t.x === a.x && t.y === a.y));
            if (!inArea.length) return 0;
            const perTick = spell.healAmt || spell.heal || 20;
            const ticks = Math.min(spell.zoneDuration || 1, 3);
            let s = 0;
            for (const a of inArea) s += healValue(g, unit, a, perTick * ticks, v) * 0.6;
            return s;
        }
        if (kind === 'selfHeal') {
            const healAmt = spell.selfHealPct ? Math.floor(unit.maxHp * spell.selfHealPct)
                : (spell.healAmt != null ? spell.healAmt : (spell.heal || Math.floor(unit.maxHp * 0.15)));
            let s = healValue(g, unit, unit, healAmt, v);
            const debuffs = (unit.statusEffects || []).filter(e =>
                ['stun', 'silence', 'slow', 'poison', 'burn', 'stagger', 'marked', 'discord'].includes(e.id)).length;
            s += Math.min(debuffs, spell.cleanse || 0) * 70;
            return s;
        }
        if (kind === 'revive') {
            if (!target) return 0;
            return tuneW(g, 'reviveBase') + 0.25 * (target.maxHp || 400);
        }
        if (kind === 'raiseDead') {
            if (!target) return 0;
            const nearEnemy = v.visibleEnemies.some(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 4);
            return nearEnemy ? 160 : 90;
        }
        if (kind === 'summonUnit') {
            // wave C: a walking summon is worth calling when there is someone
            // for it to hunt; never while the caster's own one still stands.
            if (!target) return 0;
            const _smActive = (g.state.turrets || []).filter(t => t.summon && t.hp > 0 && t.casterUnitId === unit.id && t.spellId === spell.id).length;
            if (_smActive >= (spell.maxActivePerCaster || 1)) return 0;
            if (!v.visibleEnemies.length) return 0;
            const _smNear = v.visibleEnemies.some(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 6);
            const _smFlat = _smNear ? 150 : 70;
            /* WEAK RACES II (2026-10-23, mondo): a summon is worth what it will deal over its life, not a flat 150 —
               the flat score lost to every damage spell, so the Elephant (110 + half spell power a round, six hits)
               was cast once in ~2,200 lab turns. Bite as battle.js builds it (summonDef.dmg + ½ spell power) vs the
               nearest enemy, × the rounds it should last (1 + hits/2, max 4) × the share of rounds it reaches someone,
               discounted for being future damage; its body soaks hits too. Never below the old flat score. */
            const _sd = spell.summonDef || {};
            let _smPrey = null, _smPd = Infinity;
            for (const e of v.visibleEnemies) {
                const d = Math.abs(e.x - target.x) + Math.abs(e.y - target.y);
                if (d < _smPd) { _smPd = d; _smPrey = e; }
            }
            if (!_smPrey) return _smFlat;
            const _smBite = estDamage(g, unit, _smPrey, { kind: 'damage', dmg: _sd.dmg || 60, damageType: 'physical', spellType: spell.spellType || null },
                { rawBase: (_sd.dmg || 60) + Math.floor(_spellPowerOf(g, unit, spell) * 0.5), noElement: true });
            const _smHits = _sd.hits || 3;
            const _smRounds = Math.min(4, 1 + _smHits / 2);
            const _smReach = _smPd <= (_sd.move || 3) + 1 ? 0.8 : (_smPd <= (_sd.move || 3) * 2 + 1 ? 0.55 : 0.3);
            const _smLife = _smBite * _smRounds * _smReach * 0.7 + _smHits * 20 + ((_sd.reveals || 0) > 0 ? 25 : 0);
            return Math.max(_smFlat, _smLife);
        }

        if (kind === 'shield' && target) {
            const cur = target.shield || 0;
            const max = Math.floor((target.maxHp || 100) * (spell.shieldCapPct || 0.25));
            const gain = Math.max(0, Math.min(spell.shield || 12, max - cur));
            if (gain < 8) return 0;
            let reality = AI_TUNE.healNoEnemyDiscount;
            if (v.visibleEnemies.some(e => _dist(g, target.x, target.y, target.z, e) <= 8)) reality = 1;
            else if (v.visibleEnemies.length) reality = tuneW(g, 'healSafetyDiscount');
            return gain * 0.9 * reality;
        }
        if (kind === 'aoeShield') {
            if (!target) return 0;
            const area = _aoeTilesAI(spell, target.x, target.y, spell.aoeRadius || 1);
            const inArea = [unit, ...v.allies].filter(a => !a.dead && area.some(t => t.x === a.x && t.y === a.y)).length;
            if (!inArea) return 0;
            const threatened = v.visibleEnemies.length > 0 ? 1 : AI_TUNE.healNoEnemyDiscount;
            return (spell.shield || 48) * inArea * 0.8 * threatened;
        }

        if (kind === 'buff' && target) {
            if (g.unitHasStatus(target, 'protect')) return 0;
            let s = buffStageValue(g, unit, target, spell, v);
            // Protect rider: one turn of invulnerability ≈ the damage it eats.
            if ((spell.statusEffects || []).some(e => e && e.id === 'protect')) {
                const t = v.threatFn(target.x, target.y, target.z);
                s += Math.min(300, t.totalDmg * 0.7);
            }
            for (const eff of (spell.statusEffects || [])) {
                if (!eff || !eff.id || eff.id === 'protect') continue;
                s += _friendlyStatusValue(g, unit, target, eff, v);   // regen/haste-style friendly riders
            }
            // THE SPELL AUDIT D: a buff row's barrier (Ki Charge), its taunt (Shield Maiden), its decoy (Mimicry)
            if (spell.shield > 0) s += Math.min(spell.shield, (target.maxHp || 0) * 0.5) * 0.6;
            if (spell.tauntEnemiesWithin) {
                const _teR = spell.tauntEnemiesWithin.radius || 2;
                s += 30 * v.visibleEnemies.filter(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= _teR).length;
            }
            if (spell.spawnDecoy) s += 40;
            // Buffs need a fight to matter.
            const threatened = v.visibleEnemies.some(e => _dist(g, target.x, target.y, target.z, e) <= 10);
            if (!threatened) s *= 0.25;
            if ((target.hourglasses || 0) > 0) s += 30;
            return s;
        }

        if (kind === 'warCry') {
            const radius = spell.auraRadius || 3;
            const inRange = g.aliveUnitsFor(unit.player).filter(a =>
                Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= radius);
            // Fermata (statLock): lock in live buff stages.
            if (spell.teamStatusEffects && spell.teamStatusEffects.some(e => e && e.id === 'statLock')) {
                const lockable = inRange.filter(a => !g.unitHasStatus(a, 'statLock'));
                const buffed = lockable.filter(a =>
                    ['atk', 'def', 'mdef', 'spd', 'int'].some(k => {
                        try { return g.getStatStageCount && g.getStatStageCount(a, k) > 0; } catch (e) { return false; }
                    }));
                return buffed.length >= 2 ? 60 + buffed.length * 45 : (buffed.length === 1 ? 35 : 0);
            }
            /* THE DEAD SLOTS (2026-10-25): every other team-status cry (Extended Clips, Tin Foil Hat…) took the Fermata
               branch above and scored 0 unless two allies already had raised stages. It is worth its statuses on the
               allies in reach. */
            if (spell.teamStatusEffects) {
                let s = 0;
                for (const a of inRange) for (const eff of spell.teamStatusEffects) s += _friendlyStatusValue(g, unit, a, eff, v) * 0.8;
                if (spell.statStageBoost) for (const a of inRange) s += buffStageValue(g, unit, a, spell, v) * 0.8;
                if (!v.visibleEnemies.length) s *= 0.25;
                return s;
            }
            let s = 0;
            for (const a of inRange) {
                if (!stageRoom(g, a, 'atk', 1)) continue;   // ATK already at the ruler cap
                s += buffStageValue(g, unit, a, Object.assign({ statStageBoost: { atk: 1 } }, spell), v) * 0.8;
            }
            if (!v.visibleEnemies.length) s *= 0.25;
            return s;
        }

        if (kind === 'encore' && target) {
            // A finished ally acts again — worth most of their turn output.
            return 0.75 * unitThreatOutput(g, target, v.closestEnemy || unit) + 40;
        }

        if (kind === 'cleanse') {
            if (!target) return 0;
            if (window.EW_AI_OLD_CLEANSE) return _oldCleanseScore(g, unit, target, v);
            return _cleanseValue(g, unit, spell, target, v);
        }

        // ── control family ──
        if (kind === 'debuff' && target) {
            let s = statusRiderValue(g, unit, target, spell, v);
            if (spell.statStageBoost) {
                // Bound-aware (floored stats contribute nothing), and stacking
                // is a real line of play now (no stage cap): a follow-up
                // debuff on an already-debuffed target is worth MORE, not less.
                let stages = 0, alreadyDown = 0;
                for (const k of Object.keys(spell.statStageBoost)) {
                    stages += Math.abs(stageRoom(g, target, k, spell.statStageBoost[k] || 0));
                    try {
                        const cur = g.getStatStageCount ? (g.getStatStageCount(target, k) || 0) : 0;
                        if (cur < 0) alreadyDown += -cur;
                    } catch (e) {}
                }
                s += stages * 0.1 * unitThreatOutput(g, target, unit) * (1 + Math.min(0.5, alreadyDown * 0.15));
            }
            if (spell.dmg) s += scoreOffensiveHit(g, unit, target, spell, v, { splash: true }).val * 0.8;
            s += getTargetPriority(target, unit, v) * 0.2;
            return s;
        }

        if (kind === 'zoneDebuff') {
            if (!target) return 0;
            // a self-centred cloud (Exhaust Cloud) goes off on the caster whatever the aim (doSpell's self-cast snap)
            const area = spell.aoeOriginSelf ? _aoeTilesAI(spell, unit.x, unit.y, spell.aoeRadius || 1)
                : _aoeTilesAI(spell, target.x, target.y, spell.aoeRadius || 1);
            // Low Gravity is a FRIENDLY mobility field.
            if (spell.gravityField === 'weak') {
                const alliesInArea = [unit, ...v.allies].filter(a =>
                    !a.dead && area.some(t => t.x === a.x && t.y === a.y)).length;
                return alliesInArea >= 2 ? 60 + alliesInArea * 40 : 0;
            }
            const caught = v.visibleEnemies.filter(e => area.some(t => t.x === e.x && t.y === e.y));
            if (!caught.length) return 0;
            let s = 0;
            for (const e of caught) {
                for (const eff of (spell.statusEffects || [])) {
                    if (!eff || !eff.id) continue;
                    s += 0.8 * ccDenialValue(g, unit, e, eff.id, eff.duration || 1, v);
                    s += 0.8 * statusSetupValue(g, unit, e, eff.id, v, (spell.zoneDuration || 1) >= 2);
                }
                if (!spell.statusEffects || !spell.statusEffects.length) s += 45;
            }
            if (spell.gravityField === 'super') {
                const flyersCaught = caught.filter(e => typeof g.canFly === 'function' && g.canFly(e)).length;
                s += flyersCaught * 90;
            }
            s *= Math.min(spell.zoneDuration || 1, 3) * 0.55;
            // THE SPELL AUDIT D: Outbreak's on-cast hit (zoneCastDamage) — scored like an area hit, once
            if (spell.zoneCastDamage > 0) {
                const _zcShim = Object.assign({}, spell, { dmg: spell.zoneCastDamage, kind: 'aoe' });
                let first = true;
                for (const e of caught) {
                    if (isProtected(g, e)) continue;
                    s += scoreOffensiveHit(g, unit, e, _zcShim, v, { splash: !first }).val;
                    first = false;
                }
            }
            if (v.enemyTower && v.enemyTower.hp > 0) {
                const tDist = Math.abs(v.enemyTower.x - target.x) + Math.abs(v.enemyTower.y - target.y);
                if (tDist <= 3) s += 50;
            }
            return s;
        }

        // ── mobility / utility family ──
        if (kind === 'teleport') return scoreTeleport(unit, spell, target, v);

        /* THE SPELL AUDIT Batch D: an ally swap (Tag In) — trade places with a hurt ally under pressure when we are fitter */
        if (kind === 'swap' && spell.allyOnly) {
            if (!target || target.player !== unit.player || target.id === unit.id) return 0;
            const tPct = target.hp / Math.max(1, target.maxHp), uPct = unit.hp / Math.max(1, unit.maxHp);
            const onThem = v.visibleEnemies.filter(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 1).length;
            if (!onThem || tPct >= 0.5 || uPct < tPct + 0.25) return 0;
            return 60 + onThem * 30 + Math.round((uPct - tPct) * 60);
        }
        if (kind === 'swap') {
            if (!target) return 0;
            let s = 0, hasReason = false;
            const nearOurAllies = v.allies.filter(a =>
                Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= 3).length;
            if (nearOurAllies >= 2) { s += nearOurAllies * 55; hasReason = true; }  // yank them into our gank
            if (v.ownTower && v.ownTower.hp > 0) {
                const tgtToTower = Math.abs(target.x - v.ownTower.x) + Math.abs(target.y - v.ownTower.y);
                if (tgtToTower <= 3) { s += 110; hasReason = true; }               // pull the sieger off
            }
            if (v.enemyTower && v.enemyTower.hp > 0) {
                const curDist = Math.abs(unit.x - v.enemyTower.x) + Math.abs(unit.y - v.enemyTower.y);
                const newDist = Math.abs(target.x - v.enemyTower.x) + Math.abs(target.y - v.enemyTower.y);
                if (newDist < curDist - 2) { s += 80; hasReason = true; }           // teleport us deep
            }
            const priority = getTargetPriority(target, unit, v);
            if (priority >= 100) { s += priority * 0.3; hasReason = true; }
            return hasReason ? s : 0;
        }

        if (kind === 'escape') {
            let s = 30;
            const hpPct = unit.hp / unit.maxHp;
            if (hpPct < 0.25) s += 220;
            else if (hpPct < 0.4) s += 140;
            else if (hpPct < 0.6) s += 60;
            else s -= 30;
            const debuffs = (unit.statusEffects || []).filter(e =>
                ['stun', 'silence', 'slow', 'poison', 'burn', 'stagger', 'marked', 'discord', 'jammed'].includes(e.id)).length;
            s += debuffs * 40;
            if (v.closestEnemyDist <= 2) s += 70;
            if ((unit.hourglasses || 0) > 0) s += 90;
            return Math.max(s, 0);
        }

        if (kind === 'scan') {
            if (g.unitHasStatus(unit, 'jammed')) return 0;
            const unrev = (g.state.hourglasses || []).filter(h => h.carriedBy === null && !h.visibleTo[unit.player]).length;
            if (unrev === 0) return 0;
            let s = 40 + unrev * 20;
            if (v.winState.phase === 'hg_losing') s += 45;
            if ((g.state.round || 0) <= 12) s += 25;
            return s;
        }

        // 🔍 Far Sight (remoteView + inspectAt): the pick priced the search (_aiFarSightPick)
        if (kind === 'remoteView' && spell.inspectAt) return (target && target._farSightScore) || 0;

        if (kind === 'remoteView') {
            // pure recon: mildly useful early under fog, useless otherwise
            if (!g.state.fogOfWar && !_aiVisionOn()) return 0;
            return (g.state.round || 0) <= 6 ? 45 : 20;
        }

        // ── placement / terraforming family ──
        /* 🚪 THE STANDING DOORS (the door wheel, DOOR_GUN_PLAN Phase 1): the engine's placer priced the tile
           (battle.js doorGunAiPick — a gust lane full of enemies, a volley that reaches them); Phase 6 grows it */
        if (kind === 'doorDeploy') return (target && target._gunDoorScore) ? target._gunDoorScore : 0;

        if (kind === 'deployTurret') {
            if (!target) return 0;
            const tRange = spell.turretRange || 2;
            if (spell.auraDebuff) {
                const enemiesInRange = v.visibleEnemies.filter(e =>
                    Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= tRange).length;
                if (enemiesInRange === 0) return 0;   // no blind aura deploys
                let s = enemiesInRange * 100 + 50;
                if (enemiesInRange >= 3) s *= 1.4;
                return s;
            }
            const tDmg = spell.turretDmg || 8;
            const enemiesInRange = v.visibleEnemies.filter(e =>
                Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= tRange).length;
            const towerInRange = !!(v.enemyTower && v.enemyTower.hp > 0 &&
                Math.abs(v.enemyTower.x - target.x) + Math.abs(v.enemyTower.y - target.y) <= tRange);
            // A turret that can't shoot anything is 50 MP of scenery — the sim
            // batch showed thousands of corner deploys that never fired a
            // killing shot. Only deploy where it has a target NOW.
            if (enemiesInRange === 0 && !towerInRange) return 0;
            // a turret pays its damage every round for a few rounds
            let s = tDmg * 2 * _offScale(unit, v.closestEnemy || unit);
            s += enemiesInRange * 90;
            if (towerInRange) s += 200;
            if (spell.id === 'siegeTurret') s *= 1.4;
            return s;
        }

        if (kind === 'bomb' && target) {
            const active = (g.state.bombs || []).filter(b => b.ownerUnitId === unit.id).length;
            if (active >= (spell.maxActivePerCaster || 3)) return 0;
            const blastR = spell.blastRadius || 1;
            const nearE = v.visibleEnemies.filter(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= blastR + 1).length;
            return (spell.dmg || 18) * 0.6 * _offScale(unit, v.closestEnemy || unit) * Math.min(1, 0.4 + nearE * 0.3) + nearE * 25;
        }

        if (kind === 'deployObject') {
            if (!target) return 0;
            const nearObjective = (v.enemyTower && v.enemyTower.hp > 0 &&
                Math.abs(unit.x - v.enemyTower.x) + Math.abs(unit.y - v.enemyTower.y) <= 5) ||
                (v.ownTower && v.ownTower.hp > 0 &&
                    Math.abs(unit.x - v.ownTower.x) + Math.abs(unit.y - v.ownTower.y) <= 4);
            if (v.visibleEnemies.length === 0 && !nearObjective) return 0;
            let s = 70;
            if (v.enemyTower && v.enemyTower.hp > 0) {
                const tDist = Math.abs(v.enemyTower.x - target.x) + Math.abs(v.enemyTower.y - target.y);
                if (tDist <= 4) s += 50;
            }
            if (spell.drawsRangedAttack) s += 50;
            if (spell.auraHeal) s += 60;
            // Contact placement onto an enemy = instant trigger.
            const _contactE = spell.detonateOnStep
                && g.state.units.find(u => !u.dead && u.x === target.x && u.y === target.y && u.player !== unit.player);
            if (_contactE) return s + 40 + (spell.blastDmg || 0) * 0.5;
            const active = (g.state._deployedObjects || []).filter(o => o.ownerUnitId === unit.id && o.spellId === spell.id && !o._detonated).length;   // the cap is per spell (battle.js deployObject)
            if (active >= (spell.maxActivePerCaster || 2)) return 0;
            // WEAK RACES II (2026-10-23): a mine is worth the blast it will likely set off (see _trapHitValue)
            if (spell.detonateOnStep && spell.blastDmg) {
                return Math.max(s, _trapHitValue(g, unit, Object.assign({}, spell, { dmg: spell.blastDmg }), target, v, 1,
                    (spell.blastRadius || 0) * 2 + 1));
            }
            return s;
        }

        if (kind === 'deployPair') {
            if (!target) return 0;
            const round = g.state.round || 0;
            if (v.visibleEnemies.length === 0 && round <= 3) return 0;
            let s = 70;
            // Gate pairs are stamped with ownerId (battle.js doSpell).
            const active = (g.state._gatePairs || []).filter(gp => gp.ownerId === unit.id).length;
            if (active >= (spell.maxActivePerCaster || 1)) return 0;
            const avgAllyDist = v.allies.length > 0
                ? v.allies.reduce((sum, a) => sum + Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y), 0) / v.allies.length
                : 0;
            if (avgAllyDist > 6) s += 60;
            if (v.enemyTower && v.enemyTower.hp > 0) s += 45;
            return s;
        }

        if (kind === 'placeTrap' && target && !window.EW_AI_NO_TRAP_PLAN) {
            // THE TRAP PLAN: the enemies' predicted walks × the hit (see _trapEnemyOdds)
            return _trapPlacementValue(g, unit, spell, target.x, target.y, v);
        }
        if (kind === 'placeTrap' && target) {
            const active = (g.state.traps || []).filter(t => t.casterUnitId === unit.id && t.trapType === spell.trapType).length;
            if (active >= (spell.maxActivePerCaster || 2)) return 0;
            /* a 2×2 / 3×3 trap's target is its NW anchor: measure from the footprint, like _trapHitValue does */
            const _tpSlack = Math.max(0, (spell.trapSize || 1) - 1);
            const nearE = v.visibleEnemies.filter(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) - _tpSlack <= 2).length;
            const _tpFlat = nearE > 0 ? 45 + nearE * 30 + (spell.dmg || 0) * 0.2 : 0;
            if (!_tpFlat) return 0;
            /* WEAK RACES II (2026-10-23, mondo): a trap is worth the hit it will likely land — P(an enemy walks onto it)
               × (its damage + its status) — not a flat 45 + 30 a head, which lost to every damage spell (Trapdoor /
               Deathtrap were cast ~once in ~1,300 Gnome lab turns). Bigger traps catch more steps. */
            return Math.max(_tpFlat, _trapHitValue(g, unit, spell, target, v, spell.trapSize || 1));
        }

        if (kind === 'placeMirror' && target) {
            const owned = (g.state.mirrors || []).filter(m => m.ownerUnitId === unit.id && m.hp > 0);
            if (owned.length >= (spell.maxActivePerCaster || 8)) return 0;
            let s = 30;
            const aligns = owned.some(m => m.x === target.x || m.y === target.y);
            if (aligns) s += 45;
            const nearE = v.visibleEnemies.filter(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 3).length;
            s += nearE * 20;
            if (aligns && nearE > 0) s += 35;
            if (owned.length < 3) s += 20;      // ramp toward a pulsable lattice
            return s;
        }
        /* THE SPELL AUDIT Batch D: Shatter the Lattice — worth the enemies inside the prisms' 3x3s, less the
           prisms it spends (a lattice that still pulses is worth keeping). */
        if (kind === 'pulseLattice' && spell.shatterPrisms) {
            const owned = (g.state.mirrors || []).filter(m => m.owner === unit.player && m.hp > 0);
            if (!owned.length) return 0;
            let s = 0;
            for (const m of owned) {
                for (const e of v.visibleEnemies) {
                    if (Math.max(Math.abs(e.x - m.x), Math.abs(e.y - m.y)) <= 1) s += 45 + getTargetPriority(e, unit, v) * 0.1;
                }
            }
            if (s <= 0) return 0;
            return Math.max(0, s - owned.length * 12);
        }
        if (kind === 'pulseLattice' || kind === 'tuneFrequency') {
            const owned = (g.state.mirrors || []).filter(m => m.owner === unit.player && m.hp > 0);
            if (owned.length < (kind === 'pulseLattice' ? 3 : 1)) return 0;
            let net = null;
            if (typeof window !== 'undefined' && typeof window.computeMirrorNetwork === 'function') {
                net = window.computeMirrorNetwork(unit.player);
            }
            if (!net || (!net.beamTiles.size && !net.volumeTiles.size)) return 0;
            if (kind === 'pulseLattice') return net.count >= 3 ? _mirrorNetworkValue(unit, spell, v, net, 0) : 0;
            return _tuneFrequencyScore(unit, spell, v, net);
        }

        if (kind === 'placeBlock' && target) {
            if (spell.materialCost && typeof g.canAffordMaterials === 'function' &&
                !g.canAffordMaterials(unit.player, spell.materialCost)) return 0;
            const info = {};
            if (typeof g._placeBlockProblem === 'function' &&
                g._placeBlockProblem(unit, spell, target.x, target.y, info)) return 0;
            let s = 0;
            const allyOn = [unit, ...(v.allies || [])].find(a => !a.dead && a.x === target.x && a.y === target.y);
            if (allyOn && g.getEffectiveRange(allyOn) >= 2) s += 70;    // instant high ground for a ranged ally
            const enemyOn = v.visibleEnemies.find(e => e.x === target.x && e.y === target.y);
            if (enemyOn) {
                s += 50 + getTargetPriority(enemyOn, unit, v) * 0.15;
                if (info.shoveTo) {
                    const lt = g.getTerrainAt(info.shoveTo.x, info.shoveTo.y);
                    if (lt === 'lava' || lt === 'deep_water' || lt === 'chasm' || lt === 'void') s += 120;
                    else if (lt === 'water' || lt === 'poison' || lt === 'poison_bog' || lt === 'purple_bog' || lt === 'swamp' || lt === 'oil') s += 40;
                    if ((g.state.traps || []).some(tr => tr.x === info.shoveTo.x && tr.y === info.shoveTo.y && tr.owner === unit.player)) s += 80;
                }
            }
            const nearE = v.visibleEnemies.filter(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 2).length;
            s += nearE * 12;
            return s;
        }

        if (kind === 'buildStructure' && target) {
            if (spell.materialCost && typeof g.canAffordMaterials === 'function' &&
                !g.canAffordMaterials(unit.player, spell.materialCost)) return 0;
            const nearE = v.visibleEnemies.filter(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 3).length;
            return 25 + nearE * 15;
        }

        if (kind === 'terrainCreate' && !window.EW_AI_OLD_TERRAIN) {
            if (!target) return 0;
            if (v.visibleEnemies.length === 0) return 0;
            return _terrainCastValue(g, unit, spell, target, v);
        }
        if (kind === 'terrainCreate') {
            if (!target) return 0;
            if (v.visibleEnemies.length === 0) return 0;
            let s = 0;
            if (spell.dmg) {
                // a ground-bound wall (missesFlyers: Wall of Fire) passes under a flyer up in the sky
                const enemiesNear = v.visibleEnemies.filter(e =>
                    Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 1
                    && !(spell.missesFlyers && typeof g.isUnitAirborne === 'function' && g.isUnitAirborne(e)));
                for (const e of enemiesNear) {
                    const est = estDamage(g, unit, e, spell);
                    s += Math.min(est, effHp(e)) * 0.8;
                    if (est >= effHp(e)) s += killValue(g, unit, e, v) * 0.6;
                }
            }
            if (v.ownTower && v.ownTower.hp > 0) {
                const tDist = Math.abs(v.ownTower.x - target.x) + Math.abs(v.ownTower.y - target.y);
                const approachingEnemies = v.visibleEnemies.filter(e =>
                    Math.abs(e.x - v.ownTower.x) + Math.abs(e.y - v.ownTower.y) <= 6).length;
                if (tDist <= 4 && approachingEnemies > 0) s += 50 + approachingEnemies * 25;
            }
            return s;
        }

        if (kind === 'summonWeather' && !window.EW_AI_OLD_WEATHER) return _weatherCastValue(g, unit, spell, target, v);
        if (kind === 'summonWeather') {
            const nearE = v.visibleEnemies.filter(e =>
                Math.abs(e.x - (target?.x ?? unit.x)) + Math.abs(e.y - (target?.y ?? unit.y)) <= 2).length;
            if (nearE === 0) return 0;
            return 40 + nearE * 30;
        }

        if (kind === 'warpRune' && target) {
            const nearE = v.visibleEnemies.filter(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 2).length;
            return nearE > 0 ? 35 + nearE * 20 : 0;
        }

        if (['seedHeal', 'seedPoison', 'leechSeed'].includes(kind)) {
            // Seeds are an investment: they grow into aura trees and feed
            // the Harvester's Green Thumb / Trunk Throw scaling.
            let s = kind === 'leechSeed' ? 55 : kind === 'seedPoison' ? 45 : 50;
            if ((g.state.round || 1) <= 3) s += 25;
            if ((unit.spells || []).some(sp2 => sp2 && sp2.id === 'trunkThrow')) s += 15;
            return s;
        }

        if (kind === 'rallyPull') {
            const far = g.aliveUnitsFor(unit.player).filter(a =>
                a.id !== unit.id && Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) > 3);
            if (far.length < 2) return 0;
            const enemiesOnTop = v.visibleEnemies.filter(e => Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y) <= 2).length;
            return 30 + far.length * 25 - enemiesOnTop * 20;
        }

        if (kind === 'manaRestoreAll') {
            const allies = g.aliveUnitsFor(unit.player);
            const mpRestore = spell.mpRestore || 40;
            const lowMana = allies.filter(a => (a.maxMp || 0) > 0 && a.mp < a.maxMp * 0.4);
            const totalRestored = allies.reduce((s2, a) => s2 + Math.min(mpRestore, (a.maxMp || 0) - a.mp), 0);
            let s = totalRestored * tuneW(g, 'mpValuePerPoint') * 0.7;
            if (lowMana.length >= 2) s *= 1.5;
            if (lowMana.length === 0) s *= 0.1;
            // Casts it unlocks across the team, valued like the Mana Potion's.
            for (const a of allies) {
                if ((a.maxMp || 0) <= 0) continue;
                s += _mpUnlockValue(g, a, Math.min(a.maxMp, a.mp + mpRestore), v.closestEnemy || unit);
            }
            return s;
        }

        /* ═══ THE DOOR AGENT (DOOR_RACE_DESIGN.md §7, 2026-09-14) ═══════════
           door (Knock Knock): a pair when the agent has none — the FAR door
           toward the enemy line (one click; the engine seats the near door
           beside the agent), or a toggle: SHUT a friendly open door an
           enemy stands beside. */
        if (kind === 'door') {
            if (!target) return 0;
            const doorOn = (typeof g.doorAt === 'function') ? g.doorAt(target.x, target.y) : null;
            if (doorOn) {
                if (doorOn.owner !== unit.player || doorOn.fixed) return 0;
                const enemiesBeside = v.visibleEnemies.filter(e => Math.max(Math.abs(e.x - doorOn.x), Math.abs(e.y - doorOn.y)) <= 1).length;
                const alliesBeside = v.allies.filter(a => Math.max(Math.abs(a.x - doorOn.x), Math.abs(a.y - doorOn.y)) <= 1).length;
                if (doorOn.open) return enemiesBeside > 0 && alliesBeside === 0 ? 40 + enemiesBeside * 30 : 0;
                return enemiesBeside === 0 && alliesBeside > 0 ? 30 : 0;   // reopen the road for a teammate
            }
            if (typeof g.doorTileFree === 'function' && !g.doorTileFree(target.x, target.y)) return 0;
            if (typeof g._doorNearSpot === 'function' && !g._doorNearSpot(unit, target)) return 0;   // no room beside the agent for the near door
            const mine = (typeof g.doorTeamPairs === 'function') ? g.doorTeamPairs(unit.player).filter(d => d.ownerId === unit.id).length : 0;
            if (mine > 0) return 0;
            const round = g.state.round || 0;
            if (v.visibleEnemies.length === 0 && round <= 2) return 0;
            let s = 65;
            if (v.enemyTower && v.enemyTower.hp > 0) s += 30;
            const nearestE = v.visibleEnemies.length ? Math.min(...v.visibleEnemies.map(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y))) : 9;
            s += Math.max(0, 6 - nearestE) * 8;
            return s;
        }
        /* doorBreach (Breaking and Entering) / doorTrap (Trapdoor): a
           single-target hit that is always a rear one (+30 %), Trapdoor also
           hands the body to the team. doorDelivery: the same through a door. */
        if (kind === 'doorBreach' || kind === 'doorTrap' || kind === 'doorDelivery') {
            if (!target) return 0;
            const est = estDamage(g, unit, target, spell) * 1.3;
            let s = Math.min(est, effHp(target)) + (kind === 'doorTrap' ? 40 : 20);
            if (est >= effHp(target)) s += killValue(g, unit, target, v);
            s += getTargetPriority(target, unit, v) * 0.5;
            return s;
        }
        /* doorSlam: the friendly door whose twin has the most enemies on or
           beside it — damage + a shove each; the two walls left behind are
           worth a little on their own. */
        if (kind === 'doorSlam') {
            if (!target) return 0;
            const door = (typeof g.doorAt === 'function') ? g.doorAt(target.x, target.y) : null;
            const twin = (door && typeof g.doorTwin === 'function') ? g.doorTwin(door) : null;
            if (!door || !twin || door.owner !== unit.player || door.fixed) return 0;
            const hit = v.visibleEnemies.filter(e => Math.max(Math.abs(e.x - twin.x), Math.abs(e.y - twin.y)) <= 1);
            if (!hit.length) return 0;
            let s = 10;
            for (const e of hit) { const est = estDamage(g, unit, e, spell); s += Math.min(est, effHp(e)) + 25; if (est >= effHp(e)) s += killValue(g, unit, e, v) * 0.8; }
            return s;
        }
        /* doorExit: the enemy at a friendly open door — worth its threat for
           a round, more when it carries a Key or holds a zone. */
        if (kind === 'doorExit') {
            if (!target) return 0;
            let s = 60 + unitThreatOutput(g, target, v) * 0.5;
            if ((target.hourglasses || 0) > 0) s += 80;
            if (typeof g.getNexusAtUnit === 'function' && g.getNexusAtUnit(target)) s += 40;
            return s;
        }

        /* CHAMP_REWORK_PLAN Phase 6 (2026-09-08): the `steal` kind (Hit
           a Lick) — the plunder's scoring plus the hit itself. */
        if (kind === 'steal') {
            if (!target) return 0;
            let s = 30;
            const est = estDamage(g, unit, target, spell);
            s += Math.min(est, effHp(target));
            if (est >= effHp(target)) s += killValue(g, unit, target, v) * 0.9;
            if ((target.hourglasses || 0) > 0) s += 110;
            if (target.items && Object.keys(target.items).some(k => target.items[k] > 0)) s += 35;
            return s;
        }
        /* Phase 6: `cleanseArea` (Purify) — target is the centre TILE.
           Allies in the 3×3 pay out per debuff (crippling ones by the
           output they unlock), enemies per buff stripped. */
        if (kind === 'cleanseArea') {
            if (!target) return 0;
            const defs = (typeof STATUS_DEFS !== 'undefined') ? STATUS_DEFS : (g.STATUS_DEFS || {});
            const area = _aoeTilesAI(spell, target.x, target.y, spell.aoeRadius || 1);
            const inArea = u => !u.dead && area.some(t => t.x === u.x && t.y === u.y);
            let s = 0;
            for (const a of [unit, ...v.allies]) {
                if (!inArea(a) || !a.status) continue;
                for (const key of Object.keys(a.status)) {
                    if (!(a.status[key] > 0) || !defs[key] || defs[key].kind !== 'debuff') continue;
                    if (['stun', 'sleep', 'freeze', 'frozen', 'silence', 'charm', 'feared', 'possessed', 'infected'].includes(key)) {
                        s += 0.6 * unitThreatOutput(g, a, v.closestEnemy || unit);
                    } else if (['slow', 'root', 'stagger', 'jammed', 'blind', 'confuse', 'tethered', 'grievous', 'broken'].includes(key)) {
                        s += 70;
                    } else {
                        s += 45;
                    }
                }
                if ((a.hourglasses || 0) > 0 && s > 0) s += 20;
            }
            for (const e of v.visibleEnemies) {
                if (!inArea(e) || !e.status) continue;
                for (const key of Object.keys(e.status)) {
                    if (e.status[key] > 0 && defs[key] && defs[key].kind === 'buff') s += 55;
                }
            }
            return s;
        }

        if (kind === 'utility') {
            const sid = spell.id;
            /* THE SPELL AUDIT Batch D: selfPullOnly (Grapple) — reel to an ally who is closer to the fight */
            if ((sid === 'grapple' || sid === 'raceGrapple') && spell.selfPullOnly) {
                if (!target || target.player !== unit.player || target.id === unit.id || !v.closestEnemy) return 0;
                const ce = v.closestEnemy;
                const now = Math.abs(unit.x - ce.x) + Math.abs(unit.y - ce.y);
                const then = Math.abs(target.x - ce.x) + Math.abs(target.y - ce.y) + 1;
                return (now - then >= 2) ? 30 + (now - then) * 8 : 0;
            }
            if ((sid === 'grapple' || sid === 'raceGrapple') && target) {
                let s = 140;
                const meleeAllies = v.allies.filter(a =>
                    g.getEffectiveRange(a) <= 1 &&
                    Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= 4).length;
                s += meleeAllies * 50;
                s += getTargetPriority(target, unit, v) * 0.25;
                if (g.getEffectiveRange(target) >= 3) s += 40;
                return s;
            }
            if ((sid === 'plunder' || sid === 'racePlunder') && target) {
                let s = 40;
                // THE DEAD SLOTS (2026-10-25): the strike is real damage (dmg 100) and was never counted
                if (spell.dmg && target.id != null) s += scoreOffensiveHit(g, unit, target, spell, v, {}).val;
                if ((target.hourglasses || 0) > 0) s += 110;
                if ((target.gold || 0) > 0) s += 25;
                return s;
            }
            if (sid === 'mimic' && target) {
                const lastSpell = g.state?.lastSpellCast;
                if (!lastSpell) return 0;
                let s = 50;
                const lastKind = (typeof SPELL_BY_ID !== 'undefined' && SPELL_BY_ID[lastSpell.spellId]) ? SPELL_BY_ID[lastSpell.spellId].kind : null;
                if (['damage', 'aoe', 'multiHit', 'barrage'].includes(lastKind)) s += 40;
                if (['healAll', 'heal'].includes(lastKind)) s += 25;
                return s;
            }
            return 0;
        }

        // ── generic fallback: derive value from the spell's own data ──
        // (No more `return 5` — an unhandled kind still competes on its
        // printed numbers, and logs so the handler gap is visible.)
        let s = 0;
        if (spell.dmg && target && target.id) s += scoreOffensiveHit(g, unit, target, spell, v, {}).val;
        if ((spell.heal || spell.healAmt) && target && target.id) {
            s += healValue(g, unit, target, spell.healAmt != null ? spell.healAmt : spell.heal, v);
        }
        if (spell.statusEffects && target && target.id) s += statusRiderValue(g, unit, target, spell, v);
        if (spell.statStageBoost && target && target.id && target.player === unit.player) {
            s += buffStageValue(g, unit, target, spell, v);
        }
        if (spell.shield && target && target.id) s += (spell.shield || 0) * 0.7;
        if (s <= 0) s = 20;
        if (window.EW_AI_DEBUG) console.log('[AI] generic fallback scorer for kind:', kind, spell.id, '→', s);
        return s;
    }

    /* ═══ THE FULL LIST — TELEPORT ANY UNIT (2026-11-01). Teleport ("warp any unit — self, ally or enemy — to any
       unoccupied tile within range") was never cast by the CPU ("two-phase mass teleports stay manual": 442 chances,
       0 casts). Now it weighs three plays and keeps the best: an ENEMY dropped on a bad square (lava, deep water,
       burning ground, a telegraphed blast, off a Nexus) or carried away from the allies it threatens; a hurt ALLY
       carried out of the enemy's reach; ITSELF blinked out when hurt (the plain teleport's escape). The pick carries
       the body (_tpMover) and the landing; executeAction clicks both.
       THE TEAM PLAY (2026-11-01, Batch C gap 6: "it never pulls an enemy into our reach or brings an ally into a shot")
       adds two more, existing rules only: (4) an ENEMY pulled onto a square the caster can still swing at this turn
       (Teleport keeps the turn; the one-spell cap leaves the basic attack) or that a teammate still to act this round
       can reach; (5) a teammate still to act this round who has no enemy in its walk + range, dropped on a square it
       can shoot from. The bodies it threatens there are still charged (the enemy pulled in) and so is the square's
       danger (the ally sent in). Kill-switch: window.EW_AI_NO_TELEPORT_PULL. ═══ */
    function _tpLandings(g, unit, spell) {
        let tiles = [];
        try { if (typeof getTeleportLandingReach === 'function') tiles = getTeleportLandingReach(unit, spell) || []; } catch (e) { tiles = []; }
        return tiles.filter(t => t && !g.unitAt(t.x, t.y) && (typeof g.isTerrainPassable !== 'function' || g.isTerrainPassable(t.x, t.y))
            && !(typeof isTowerTile === 'function' && isTowerTile(t.x, t.y)));
    }
    function _tpReachOf(g, e) {
        let er = 1, em = 2;
        try { er = g.getEffectiveRange(e) || 1; } catch (q) {}
        try { em = g.getEffectiveMove(e) || 2; } catch (q) {}
        return er + em;
    }
    // A teammate whose turn this round is still to come (it can still use what a teleport sets up for it).
    function _stillToAct(g, u) {
        if (!u || u.dead || u._dying || u.hp <= 0 || !((u.ap || 0) > 0) || u._skippedTurn) return false;
        if (u._turnRound === g.state.round || g.state._blitzActiveUnitId === u.id) return false;
        try { if (g.unitHasStatus(u, 'stun') || g.unitHasStatus(u, 'frozen')) return false; } catch (e) {}
        return true;
    }
    // The longest reach of a unit's basic attack and the damage spells it can pay for.
    function _tpMaxRange(g, u) {
        let r = 1;
        try { r = g.getEffectiveRange(u) || 1; } catch (e) {}
        for (const sp of (u.spells || [])) {
            if (!sp || !DMG_KINDS.has(sp.kind) || (u.mp || 0) < _mpCost(u, sp)) continue;
            try { r = Math.max(r, g.getEffectiveSpellRange(u, sp) || 0); } catch (e) {}
        }
        return r;
    }
    function _teleportAnyPick(unit, spell, v) {
        const g = G();
        if (window.EW_AI_NO_TELEPORT_ANY) return null;
        const lands = _tpLandings(g, unit, spell);
        if (!lands.length) return null;
        const pull = !window.EW_AI_NO_TELEPORT_PULL;
        const one = g.AP_COST_ACTION || 1;
        let tpAp = one, ends = false;
        try { tpAp = g.TargetQuery.apCost(spell); } catch (e) {}
        try { ends = !!g.TargetQuery.spellEndsTurn(spell); } catch (e) {}
        if (typeof _isClashMode === 'function' && _isClashMode()) ends = true;   // Clash: any paid act ends the turn
        // (4) the caster's own swing after the cast: the AP is left, the turn is kept, the attack is not spent
        const swing = pull && !ends && !_skipAttack && (unit.ap || 0) - tpAp >= one;
        let atkR = 1;
        try { atkR = g.getEffectiveRange(unit) || 1; } catch (e) {}
        const mpCost = _mpCost(unit, spell) * tuneW(g, 'mpValuePerPoint');
        const mates = pull ? (v.allies || []).filter(m => _stillToAct(g, m)) : [];
        const mateHit = new Map();
        const mateHitOn = (m, e) => {
            const k = m.id + '|' + e.id;
            if (!mateHit.has(k)) { let h = 0; try { h = scoreOffensiveHit(g, m, e, null, v).val; } catch (q) {} mateHit.set(k, Math.max(0, h)); }
            return mateHit.get(k);
        };
        const okPick = (u) => { try { return typeof window.spellAimProblemOn !== 'function' || window.spellAimProblemOn(unit, spell, u) === null; } catch (e) { return false; } };
        const ours = [unit, ...(v.allies || [])].filter(a => a && !a.dead);
        let best = null;
        const consider = (mover, land, score, why) => { if (score > 0 && (!best || score > best._tpScore)) best = { x: mover.x, y: mover.y, z: mover.z, id: mover.id, _tpMover: mover.id, _tpLand: { x: land.x, y: land.y, z: land.z }, _tpScore: score, _tpWhy: why || null }; };
        // (1) an enemy put somewhere bad, or carried away from the bodies it threatens
        for (const e of (v.visibleEnemies || [])) {
            if (!e || e.dead || isProtected(g, e) || !okPick(e)) continue;
            const reach = _tpReachOf(g, e);
            const dmg = Math.max(1, unitThreatOutput(g, e, unit));
            const hitNow = _dist(g, unit.x, unit.y, unit.z, e) <= atkR;   // already in the caster's swing: a pull adds none
            const threatened = (x, y) => ours.filter(a => Math.abs(a.x - x) + Math.abs(a.y - y) <= reach).length;
            const tNow = threatened(e.x, e.y);
            for (const t of lands) {
                let sc = aiHazardPenaltyAt(e, t.x, t.y) - aiHazardPenaltyAt(e, e.x, e.y);
                try {   // off the Nexus it stands in
                    const nps = g.state.nexusPoints || {};
                    for (const k of Object.keys(nps)) if (nps[k] && _aiNexContains(nps[k], e.x, e.y) && !_aiNexContains(nps[k], t.x, t.y)) { sc += 40; break; }
                } catch (q) {}
                sc += (tNow - threatened(t.x, t.y)) * dmg * 0.35;
                if ((e.hourglasses || 0) > 0) sc += 20;
                if (pull) {
                    // (4) pulled into our reach: the caster's swing this turn, a teammate's reach later this round
                    let gain = 0;
                    if (swing && !hitNow && _dist(g, unit.x, unit.y, unit.z, t) <= atkR
                        && !(g.isRangeBlockedByTerrain && g.isRangeBlockedByTerrain(unit.x, unit.y, t.x, t.y))) {
                        const h = _withUnitAt(e, t, () => scoreOffensiveHit(g, unit, e, null, v).val - _counterCost(g, unit, e)) || 0;
                        if (h > 0) gain += h * 0.9;
                    }
                    for (const m of mates) {
                        const mr = _tpReachOf(g, m);
                        if (Math.abs(m.x - e.x) + Math.abs(m.y - e.y) <= mr || Math.abs(m.x - t.x) + Math.abs(m.y - t.y) > mr) continue;
                        gain += mateHitOn(m, e) * 0.5;
                    }
                    if (gain > 0) { sc += gain - mpCost; consider(e, t, sc, 'pull'); continue; }
                }
                consider(e, t, sc);
            }
        }
        // (5) a teammate still to act with nothing in its reach, dropped where it can shoot
        for (const m of mates) {
            if ((m.hp / Math.max(1, m.maxHp)) < 0.4 || !okPick(m)) continue;
            let em = 2;
            try { em = g.getEffectiveMove(m) || 2; } catch (q) {}
            const mr = _tpMaxRange(g, m);
            const foes = (v.visibleEnemies || []).filter(e => e && !e.dead && !isProtected(g, e));
            if (!foes.length || foes.some(e => Math.abs(e.x - m.x) + Math.abs(e.y - m.y) <= em + mr)) continue;
            const near = lands.map(t => ({ t, d: Math.min(...foes.map(e => Math.abs(e.x - t.x) + Math.abs(e.y - t.y))) }))
                .filter(o => o.d >= 1 && o.d <= mr).sort((a, b) => a.d - b.d).slice(0, 12);
            if (!near.length) continue;
            const shotAt = jointMoveActionSearch(m, [], v, { shotOnly: true });
            if (typeof shotAt !== 'function') continue;
            for (const { t } of near) {
                const shot = _withUnitAt(m, t, () => shotAt(t)) || 0;
                if (!(shot > 0)) continue;
                const sc = shot * 0.55 - tileDangerCost(g, m, v, t.x, t.y, t.z) * 0.6 - aiHazardPenaltyAt(m, t.x, t.y) - mpCost;
                consider(m, t, sc, 'bring');
            }
        }
        // (2) a hurt ally carried out of reach; (3) ourselves, hurt, blinked away
        for (const a of ours) {
            if ((a.hp / Math.max(1, a.maxHp)) >= 0.4 || (a.id !== unit.id && !okPick(a))) continue;
            if (a.id === unit.id && typeof window.unitMoveBlockedByStatus === 'function' && window.unitMoveBlockedByStatus(unit)) continue;   // a pinned caster warps others, never itself
            const here = v.threatFn ? v.threatFn(a.x, a.y, a.z).totalDmg : 0;
            if (here <= 0) continue;
            for (const t of lands) {
                const there = v.threatFn ? v.threatFn(t.x, t.y, t.z).totalDmg : 0;
                const sc = Math.min(effHp(a), here - there) * 0.8 - aiHazardPenaltyAt(a, t.x, t.y);
                consider(a, t, sc);
            }
        }
        return best;
    }

    function scoreTeleport(unit, spell, target, v) {
        const g = G();
        if (target && target._tpScore != null) return target._tpScore * wght(g, 'teleportAnyValue_v1', 1);
        if (!v.visibleEnemies.length && !v.allies.length) return 0;
        if (!target) return 0;
        let bestScore = 0;
        // Escape: badly hurt with melee breathing down our neck.
        if (unit.hp < unit.maxHp * 0.35 && v.closestEnemyDist <= 2) {
            bestScore = Math.max(bestScore, 200);
        }
        // Engage: blink into strike range instead of walking two turns.
        if (v.closestEnemyDist > g.getEffectiveRange(unit) + ((g.getEffectiveMove ? g.getEffectiveMove(unit) : unit.move) || 2)
            && unit.hp > unit.maxHp * 0.5 && (unit.ap || 0) >= 2) {
            bestScore = Math.max(bestScore, 130);
        }
        // Defense: enemies on our tower and we're far.
        if (v.ownTower && v.ownTower.hp > 0) {
            for (const e of v.visibleEnemies) {
                const d = Math.abs(e.x - v.ownTower.x) + Math.abs(e.y - v.ownTower.y);
                if (d <= 3) bestScore = Math.max(bestScore, 90 + (3 - d) * 15);
            }
        }
        // Objective hops.
        for (const hg of v.visibleHourglasses) {
            const d = Math.abs(hg.x - unit.x) + Math.abs(hg.y - unit.y);
            if (d > 1 && d <= _effRange(unit, spell)) bestScore = Math.max(bestScore, 110);
        }
        return bestScore;
    }

    // ═════════════════════════════════════════════════════════════════════
    // MOVEMENT — three candidate families:
    //   1. JOINT move×action search (1-ply): value each reachable tile by
    //      the best REAL action it opens (engine damage pipeline evaluated
    //      FROM that tile — downhill, back arc, range profile, armor),
    //      discounted slightly vs acting now. This is what lets melee kits
    //      and utility casters actually reach their range.
    //   2. Macro-intent moves: per-mode objective goals (CTF, nexus,
    //      hourglasses, tower siege/defend, explore, retreat) → A*
    //      waypoint → best tile toward it.
    //   3. Safety moves: hazard-flee and kiting/repositioning when no
    //      action is worth taking (or none is affordable).
    // End-tile danger is charged centrally in aiTakeTurn.
    // ═════════════════════════════════════════════════════════════════════

    function scoreMoves(unit, v, out) {
        const g = G();
        if (_skipMove || !g.canUnitMove(unit)) return;

        const moveTiles = _aiMoveTiles(g, unit);
        if (moveTiles.length === 0) { scoreClimbs(unit, v, out, null, null); return; }   // 🧗 boxed in: a climb may be the only way out

        // 1) joint move×action (needs AP for move + action afterwards)
        if ((unit.ap || 0) >= g.AP_COST_ACTION * 2 && !_skipAttack && _aiDiff().jointSearch) {
            const best = jointMoveActionSearch(unit, moveTiles, v);
            if (best && best.score > 0) {
                out.push({ type: 'move', x: best.x, y: best.y, z: best.z, score: best.score, _joint: true });
            }
        }
        // 1b) THE FULL LIST: walk into reach of a heal / buff / debuff / trap it cannot cast from here
        if ((unit.ap || 0) >= g.AP_COST_ACTION * 2 && _aiDiff().jointSearch) {
            const sup = _jointSupportSearch(unit, moveTiles, v);
            if (sup && sup.score > 0) out.push({ type: 'move', x: sup.x, y: sup.y, z: sup.z, score: sup.score, _joint: true, _jointFor: sup._for });
        }

        // 2) hazard flee: standing on a telegraphed blast / burning ground?
        const _standingHazard = aiHazardPenaltyAt(unit, unit.x, unit.y);
        if (_standingHazard > 0) {
            let esc = null, escPen = Infinity, escD = Infinity;
            for (const t of moveTiles) {
                const p = aiHazardPenaltyAt(unit, t.x, t.y);
                const d = Math.abs(t.x - unit.x) + Math.abs(t.y - unit.y);
                if (p < escPen || (p === escPen && d < escD)) { escPen = p; escD = d; esc = t; }
            }
            if (esc && escPen < _standingHazard) {
                out.push({ type: 'move', x: esc.x, y: esc.y, z: esc.z,
                           score: 80 + (_standingHazard - escPen) * 2, _fleeHazard: true });
            }
        }

        // 3) safety reposition: current tile is hot and we either can't or
        //    shouldn't act — step to a colder tile (kiting out of AP).
        if (v.visibleEnemies.length) {
            const curCost = tileDangerCost(g, unit, v, unit.x, unit.y, unit.z);
            if (curCost > 40) {
                const recent = new Set(unit._aiRecentTiles || []);
                let best = null, bestGain = 0;
                for (const t of moveTiles) {
                    if (t.x === unit.x && t.y === unit.y) continue;
                    let gain = curCost - tileDangerCost(g, unit, v, t.x, t.y, t.z);
                    gain += tileH(g, t) * AI_TUNE.moveRetreatHeight * 0.5;
                    if (recent.has(g.posKey(t.x, t.y))) gain += wght(g, 'antiOscillationPen_v1', -4) * 10;
                    if (gain > bestGain) { bestGain = gain; best = t; }
                }
                // score = danger delta; the central danger charge then makes
                // this candidate net-positive exactly when moving helps.
                if (best && bestGain > 30) {
                    out.push({ type: 'move', x: best.x, y: best.y, z: best.z,
                               score: bestGain * 0.8, _safety: true });
                }
            }
        }

        // 3b) move-then-Inspect: the tile with the best Key odds in Inspect reach (the search map)
        _searchMoveCandidate(g, unit, v, moveTiles, out);

        // 4) macro-intent move
        const goal = pickMoveGoal(unit, v);
        if (!goal) return;
        const _walkInfo = {};
        const bestTile = pickBestMoveTile(unit, moveTiles, goal, v, _walkInfo);
        _walkPick = { unitId: unit.id, x: unit.x, y: unit.y, ap: unit.ap, goal, prog: _walkInfo.prog, score: bestTile ? _walkInfo.score : -Infinity };
        // 🧗 the climb competes with this walk: same goal, same path field
        scoreClimbs(unit, v, out, goal, _walkInfo.prog || null, bestTile && _walkInfo.prog ? _walkInfo.prog(bestTile) : 0);
        if (!bestTile) return;
        out.push({ type: 'move', x: bestTile.x, y: bestTile.y, z: bestTile.z, score: goal.score, _intent: goal.reason });
    }

    /* ── 🦘 THE CPU JUMP (2026-11-01, mondo: "the CPU needs to be able to jump") ─────────────────────────────────────
       The CPU now uses the existing Jump (battle.js getJumpTiles / doJump, no new rule: 1 AP, once a turn, the 8 squares
       around plus a straight leap to the unit's reach, landing on fogged squares allowed like a Move, no opportunity
       attack, fall damage on a drop). It never jumped, so a unit on a ledge, ringed by craters / a fissure or boxed in by
       bodies sat there. A jump is offered only onto squares no WALK reaches this action, three ways, each the same
       option the walk already has: (1) jump into a hit (the joint move×action search, from the landing square), (2) jump
       toward the move goal when it beats the best walk toward it (the path field knows leaps), (3) jump off burning /
       telegraphed ground when no walk gets off it. Candidates are type 'move' + _jump so every Tactic and danger rule
       reads them like a walk; executeAction sends them to doJump. */
    let _walkPick = null;
    function _aiCanEverJump(g, unit) {
        if (!unit || typeof g.getJumpTiles !== 'function') return false;
        if (typeof _isClashMode === 'function' && _isClashMode()) return false;
        if (typeof unitIsChessPiece === 'function' && unitIsChessPiece(unit)) return false;
        return true;
    }
    function _aiJumpTiles(g, unit) {
        if (_skipJump || !_aiCanEverJump(g, unit) || unit._jumpedThisTurn) return [];
        if ((unit.ap || 0) < g.AP_COST_ACTION) return [];
        let tiles = [];
        try { if (typeof g.canJump === 'function' && !g.canJump(unit)) return []; tiles = g.getJumpTiles(unit) || []; } catch (e) { return []; }
        if (!tiles.length) return tiles;
        // landing-square filters: a one-way door that would take us, a storm eye, a gust stream (the walk filters the same)
        const doors = _capThreats(g, unit);
        const W = typeof window !== 'undefined' ? window : {};
        const out = [];
        for (const t of tiles) {
            if (doors.length && _capDoorAt(doors, t.x, t.y)) continue;
            try { if (typeof W.walkStormStopAt === 'function' && g.state.activeWeather && g.state.activeWeather.length && W.walkStormStopAt(unit, t.x, t.y)) continue; } catch (e) {}
            try { if (typeof W.gustStreamAt === 'function' && _gdDoors(g).some(d => d.door === 'gust') && W.gustStreamAt(unit, t.x, t.y)) continue; } catch (e) {}
            let fall = 0;
            try { if ((t.z ?? 0) < (unit.z ?? 0) && typeof predictFallDamage === 'function') fall = predictFallDamage(unit, unit.z ?? 0, t.z ?? 0, t.x, t.y) || 0; } catch (e) {}
            if (fall >= (unit.hp || 0)) continue;   // never leap to a death
            out.push({ x: t.x, y: t.y, z: t.z, _jumpFall: fall });
        }
        return out;
    }
    function scoreJumps(unit, v, out) {
        const g = G();
        const jt = _aiJumpTiles(g, unit);
        if (!jt.length) return;
        const walk = (!_skipMove && g.canUnitMove(unit)) ? _aiMoveTiles(g, unit) : [];
        const walkKeys = new Set(walk.map(t => t.x + ',' + t.y + ',' + (t.z ?? 0)));
        const only = jt.filter(t => !(t.x === unit.x && t.y === unit.y) && !walkKeys.has(t.x + ',' + t.y + ',' + (t.z ?? 0)));
        if (!only.length) return;

        // 1) jump into a hit
        if ((unit.ap || 0) >= g.AP_COST_ACTION * 2 && !_skipAttack && _aiDiff().jointSearch) {
            const best = jointMoveActionSearch(unit, only, v);
            if (best) {
                const t = only.find(q => q.x === best.x && q.y === best.y && q.z === best.z);
                const s = best.score - (t ? t._jumpFall : 0);
                if (s > 0) out.push({ type: 'move', x: best.x, y: best.y, z: best.z, score: s, _joint: true, _jump: true });
            }
        }

        // 2) hazard escape no walk makes
        const standing = aiHazardPenaltyAt(unit, unit.x, unit.y);
        if (standing > 0 && !out.some(c => c.type === 'move' && c._fleeHazard)) {
            let esc = null, escPen = Infinity;
            for (const t of only) {
                const p = aiHazardPenaltyAt(unit, t.x, t.y) + t._jumpFall;
                if (p < escPen) { escPen = p; esc = t; }
            }
            if (esc && escPen < standing) {
                out.push({ type: 'move', x: esc.x, y: esc.y, z: esc.z, score: 80 + (standing - escPen) * 2, _fleeHazard: true, _jump: true });
            }
        }

        // 3) toward the move goal, when the leap beats the best walk toward it
        const stash = (_walkPick && _walkPick.unitId === unit.id && _walkPick.x === unit.x && _walkPick.y === unit.y && _walkPick.ap === unit.ap) ? _walkPick : null;
        const goal = stash ? stash.goal : pickMoveGoal(unit, v);
        if (!goal) return;
        const info = { prog: stash ? stash.prog : null };
        const jb = pickBestMoveTile(unit, only, goal, v, info);
        if (!jb) return;
        const walkScore = stash ? stash.score : -Infinity;
        if (!(info.score > walkScore)) return;
        out.push({ type: 'move', x: jb.x, y: jb.y, z: jb.z, score: goal.score, _intent: goal.reason, _jump: true });
    }

    /* ── 🧗 THE CPU CLIMB (2026-11-01, mondo: "go ahead and start teaching the cpu to use climb") ──
       The climb rules as PR #718 left them (battle.js THE CLIMB): a face taller than the unit's jump is climbed from the
       square at its foot and ENDS THE TURN. With 2 AP at the foot it is on top right then (instant); with 1 AP left (after
       a walk: Move + Climb) it hangs on the face until its next turn (−2 DEF / M.DEF, no dodge, any hit knocks it off for
       fall damage), then stands on the ledge with its whole turn. A face taller than one stretch (jump + 2) takes a turn
       per stretch either way.
       The CPU: the path field (_goalField) counts a climb as the turns it costs, so the walk heads for the foot of a wall
       only when that beats going round, and a unit boxed into a pit (a Fissure, a crater) still has a way out. Here the
       climbs from where the unit stands (getClimbTiles, the same list the player's menu shows) are scored against the best
       walk: a climb is offered only when it gets strictly further along the path field than any walk this activation.
       The danger it pays is where it ends the activation: on the ledge (instant), or hanging at the foot (the hang),
       priced up for the lost dodge and DEF and the knock-off fall. Walking to the foot first is the ordinary walk (the
       field leads there), then the next loop climbs with what AP is left. Existing rules only: the engine's doClimb runs
       it, exactly the player's climb (online: the host runs the CPU and the climb rides the state sync). */
    function _aiCanEverClimb(g, unit) {
        if (typeof g.climbBlockedReason !== 'function' || typeof g.getClimbTiles !== 'function') return false;
        const r = g.climbBlockedReason(unit);
        return r == null || r === 'No AP' || r === 'Rooted' || r === 'Climbing';   // only the match-long "never" reasons stop it
    }
    /* a face the path field may climb: not the room's own rock, no roof over the lane (the engine's other checks run
       when the climb is really offered) */
    function _aiClimbFaceBlocked(g, fx, fy, tx, ty) {
        try {
            if (typeof window.fieldCellRock === 'function' && window.fieldCellRock(tx, ty)) return true;
            if (typeof columnLaneClear === 'function' && typeof g.getHeightAt === 'function'
                && !columnLaneClear(fx, fy, g.getHeightAt(fx, fy), g.getHeightAt(tx, ty))) return true;
        } catch (e) {}
        return false;
    }
    function scoreClimbs(unit, v, out, goal, prog, walkProg) {
        const g = G();
        if (_skipClimb || window.EW_AI_NO_CLIMB) return;
        if (typeof g.getClimbTiles !== 'function' || g.climbBlockedReason(unit)) return;
        let climbs = [];
        try { climbs = (g.getClimbTiles(unit) || []).filter(c => !c.viaMove); } catch (e) { climbs = []; }
        if (!climbs.length) return;
        if (!goal) goal = pickMoveGoal(unit, v);
        if (!goal || goal.retreat || goal.x === undefined) return;
        if (!prog) prog = _goalProgress(g, unit, goal.x, goal.y);
        const pW = Math.max(0, walkProg || 0);
        const tcf = tuneW(g, 'threatCostFactor');
        let best = null;
        for (const c of climbs) {
            const p = prog({ x: c.x, y: c.y });   // up: the ledge; down: the floor at the foot
            if (!(p > pW + 0.5)) continue;
            let danger, fall = 0;
            if (c.instant) {
                danger = tileDangerCost(g, unit, v, c.x, c.y, c.z);   // on top (or down) this turn
            } else {
                /* the hang: it ends the activation on the face at the foot, easier to hit, and any hit drops it */
                const fx = c.dir === 'down' ? c.x : unit.x, fy = c.dir === 'down' ? c.y : unit.y, fz = c.dir === 'down' ? c.z : unit.z;
                try { fall = g.predictClimbFallDamage(unit, c) || 0; } catch (e) { fall = 0; }
                const t = v.threatFn(fx, fy, fz);
                const hurt = fall > 0 && t.count ? { ...unit, hp: Math.max(1, (unit.hp || 0) - fall) } : unit;
                danger = tileDangerCost(g, hurt, v, fx, fy, fz);
                if (t.count) danger = danger * 1.35 + fall * tcf;
            }
            const score = goal.score + (p - pW) * 2;
            if (!best || score - danger > best.score - best._dangerCost) {
                best = { type: 'climb', x: c.x, y: c.y, z: c.z, score, _dangerCost: danger, _intent: goal.reason,
                         _climbDir: c.dir, _climbInstant: !!c.instant, _climbTurns: c.turns || 1, _climbFall: fall };
            }
        }
        if (best) out.push(best);
    }

    // The 1-ply joint search. For every reachable tile, find the best shot
    // (basic attack or damage spell) the engine would allow from there and
    // value it through the oracle; the actual shot is re-picked and
    // validated on the next AI loop from the real tile.
    function jointMoveActionSearch(unit, moveTiles, v, opts) {
        const g = G();
        const enemies = v.visibleEnemies.filter(e => !isProtected(g, e));
        const hasTower = v.enemyTower && v.enemyTower.hp > 0;
        const capHeld = _capHeldAllyDoors(g, unit);   // 🚪 a door holding one of ours is a target too
        if (!enemies.length && !hasTower && !capHeld.length) return (opts && opts.shotOnly) ? (() => 0) : null;

        const recent = new Set(unit._aiRecentTiles || []);
        let atkRange = 1;
        try { atkRange = g.getEffectiveRange(unit) || (unit.range || 1); } catch (e) {}
        const dmgSpells = [], leapSpells = [];
        let silenced = false;
        try { silenced = g.unitHasStatus(unit, 'silence'); } catch (e) {}
        if (!silenced) {
            for (const sp of (unit.spells || [])) {
                if (!sp || !DMG_KINDS.has(sp.kind)) continue;
                /* THE HIGH GROUND (2026-11-01, the AI gaps Batch B, gap 5: From the Ceiling scored 0 of 159, Seismic Leap cast 0
                   of 108): a leap strike lands only on a body BELOW the caster, so it was never weighed from a square the
                   unit could walk or jump to. Now each square is asked the engine's own aim gate (spellAimProblemOn: reach,
                   above the target, sight) with the unit stood there, and the leap's real scorer prices it: walk or jump up
                   onto the ledge, then drop on them. Kill-switch: window.EW_AI_NO_HIGH_GROUND. */
                if (sp.kind === 'leapStrike' && !window.EW_AI_NO_HIGH_GROUND && !_failedSpells.has(sp.name)
                    && g.TargetQuery.canAfford(unit, sp) && (unit.mp || 0) >= _mpCost(unit, sp)) { leapSpells.push({ sp, mp: _mpCost(unit, sp) }); continue; }
                if (sp.kind === 'leapStrike' || sp.kind === 'skyDrop' || sp.kind === 'skyThrow' || sp.kind === 'skySlam') continue; // height-gated: let the real scorer decide in place
                if (sp.kind === 'dash' && typeof window.dashOnlyMoves === 'function' && window.dashOnlyMoves(sp)) continue;   // Sprint & co are movement, never the shot
                if (!g.TargetQuery.canAfford(unit, sp)) continue;
                if ((unit.mp || 0) < _mpCost(unit, sp)) continue;
                let er = sp.range || 1;
                try { er = g.getEffectiveSpellRange(unit, sp) || er; } catch (e) {}
                dmgSpells.push({ sp, er, mp: _mpCost(unit, sp) });
            }
        }
        // Basic attacks keep the high-ground range bonus (spells don't).
        const rangeAt = (base, th) => base + ((th >= 2 && base >= 2) ? (g.HIGH_GROUND_RANGE_BONUS || 1) : 0);
        const blocked = (tx, ty, e) => {
            try { return g.isRangeBlockedByTerrain && g.isRangeBlockedByTerrain(tx, ty, e.x, e.y); } catch (q) { return false; }
        };

        /* THE FULL LIST (2026-11-01): the best shot from one square is its own reader now, so a Sprint / blink landing
           (_mobilityShots) is weighed by exactly the numbers a walk is */
        const shotAt = (t) => {
            const th = tileH(g, t);
            let bestShot = 0;
            for (const e of enemies) {
                const d = _dist(g, t.x, t.y, t.z, e);
                if (d < 1) continue;
                // basic attack from this tile
                if (d <= rangeAt(atkRange, th) && !blocked(t.x, t.y, e)) {
                    const hit = scoreOffensiveHit(g, unit, e, null, v, { fromX: t.x, fromY: t.y, fromH: th });
                    if (hit.val > bestShot) bestShot = hit.val;
                }
                // damage spells from this tile
                for (const ds of dmgSpells) {
                    if (ds.sp.kind === 'line' || ds.sp.kind === 'linePush') continue;
                    const reach = _reach(g, t.x, t.y, t.z, e, _isLongRange(ds.sp));
                    if (reach > ds.er) continue;
                    if (!ds.sp.ignoresLineOfSight && blocked(t.x, t.y, e)) continue;
                    const hit = scoreOffensiveHit(g, unit, e, ds.sp, v, { fromX: t.x, fromY: t.y, fromH: th, splash: false });
                    const val = hit.val - ds.mp * tuneW(g, 'mpValuePerPoint');
                    if (val > bestShot) bestShot = val;
                }
            }
            // THE HIGH GROUND: a leap strike from this square onto a body below it
            if (leapSpells.length && enemies.length) {
                const lv = _withUnitAt(unit, { x: t.x, y: t.y, z: th }, () => {
                    let b = 0;
                    for (const ls of leapSpells) {
                        const R = (_effRange(unit, ls.sp) || 2) + 1;
                        for (const e of enemies) {
                            if (Math.abs(e.x - t.x) + Math.abs(e.y - t.y) > R) continue;
                            if (typeof window.spellAimProblemOn === 'function' && window.spellAimProblemOn(unit, ls.sp, e) !== null) continue;
                            const val = scoreSpell(unit, ls.sp, e, v) - ls.mp * tuneW(g, 'mpValuePerPoint');
                            if (val > b) b = val;
                        }
                    }
                    return b;
                });
                if (lv > bestShot) bestShot = lv;
            }
            // Evaluate each beam once per destination, summing the whole
            // direction and charging MP once for the cast, not per victim.
            const moved = { ...unit, x: t.x, y: t.y, z: th };
            for (const ds of dmgSpells) {
                if (ds.sp.kind !== 'line' && ds.sp.kind !== 'linePush') continue;
                const aim = _bestLineAimAI(moved, ds.sp, v);
                if (aim) bestShot = Math.max(bestShot, aim.score - ds.mp * tuneW(g, 'mpValuePerPoint'));
            }
            // tower shot from this tile
            if (hasTower) {
                const tw = v.enemyTower;
                const d = Math.abs(t.x - tw.x) + Math.abs(t.y - tw.y);
                if (d >= 1 && d <= rangeAt(atkRange, th)
                    && !g.isRangeBlockedByTerrain(t.x, t.y, tw.x, tw.y)) {
                    let towerVal = 100 + wght(g, 'towerBaseBonus_v1', 39) * 2;
                    if (v.winState.phase === 'tower_push') towerVal += 260;
                    else if (v.winState.phase === 'numbers_advantage') towerVal += 140;
                    if (v.winState.enemyDeadCount >= 1) towerVal += 160;
                    const nearTowerEnemies = enemies.filter(e =>
                        Math.abs(e.x - tw.x) + Math.abs(e.y - tw.y) <= 5).length;
                    if (nearTowerEnemies === 0) towerVal += 200;
                    if (_isArenaMode()) towerVal += _cubeHitPts(tw, _cubeHitOf(g, unit, tw)) * _ptv(g) * wght(g, 'cubePointsValue_v1', 1);
                    if (towerVal > bestShot) bestShot = towerVal;
                }
            }
            // 🚪 THE ONE-WAY DOOR: a swing at the door holding one of ours from this tile
            for (const h of capHeld) {
                const d = _dist(g, t.x, t.y, t.z, h.door);
                if (d < 1 || d > rangeAt(atkRange, th)) continue;
                if (g.isRangeBlockedByTerrain && g.isRangeBlockedByTerrain(t.x, t.y, h.door.x, h.door.y)) continue;
                const val = _capFreeValue(g, unit, h, v);
                if (val > bestShot) bestShot = val;
            }
            return bestShot;
        };
        if (opts && opts.shotOnly) return shotAt;
        let best = null;
        for (const t of moveTiles) {
            if (t.x === unit.x && t.y === unit.y) continue;
            const bestShot = shotAt(t);
            if (bestShot <= 0) continue;
            let score = bestShot * tuneW(g, 'jointSearchDiscount');
            if (recent.has(g.posKey(t.x, t.y))) score += wght(g, 'antiOscillationPen_v1', -4) * 10;
            // NOTE: end-tile danger is charged centrally (aiTakeTurn), so a
            // tile that opens a big shot but eats the whole enemy team's
            // focus loses to a safer shooting tile automatically.
            if (!best || score - tileDangerCost(g, unit, v, t.x, t.y, t.z)
                       > best.score - best._danger) {
                best = { x: t.x, y: t.y, z: t.z, score, _danger: tileDangerCost(g, unit, v, t.x, t.y, t.z) };
            }
        }
        return best;
    }

    /* ═══ THE FULL LIST — WALK THEN ANYTHING (2026-11-01). The joint walk search paired a walk only with a DAMAGE action,
       so a healer, buffer, debuffer or trapper only ever cast what was already in reach and otherwise walked toward the
       generic goal. _jointSupportSearch weighs the squares the unit can walk to by the best support cast it opens there
       (the same findSpellTarget + scoreSpell the unit would use standing there), for the casts it CANNOT make from where
       it stands. Capped (16 squares, the lowest-threat ones in reach of a body the cast needs) for the weak PC.
       Kill-switch: window.EW_AI_NO_WALK_SUPPORT. ═══ */
    const _JOINT_SUPPORT_KINDS = new Set(['heal', 'shield', 'buff', 'debuff', 'zoneDebuff', 'placeTrap', 'aoeShield',
        'warCry', 'zoneHeal', 'revive', 'seedHeal', 'seedPoison', 'leechSeed', 'encore', 'cleanse']);
    const _ALLY_SUPPORT_KINDS = new Set(['heal', 'shield', 'buff', 'aoeShield', 'warCry', 'zoneHeal', 'revive', 'seedHeal',
        'encore', 'cleanse']);
    function _withUnitAt(unit, t, fn) {
        const ox = unit.x, oy = unit.y, oz = unit.z;
        unit.x = t.x; unit.y = t.y; unit.z = (t.z != null) ? t.z : unit.z;
        _aiHypoMove++;
        try { return fn(); } catch (e) { return 0; } finally { unit.x = ox; unit.y = oy; unit.z = oz; _aiHypoMove--; }
    }
    function _jointSupportSearch(unit, moveTiles, v) {
        const g = G();
        if (window.EW_AI_NO_WALK_SUPPORT) return null;
        const ap = unit.ap || 0, one = g.AP_COST_ACTION || 1;
        let silenced = false;
        try { silenced = g.unitHasStatus(unit, 'silence'); } catch (e) {}
        if (silenced) return null;
        const spells = [];
        for (const sp of (unit.spells || [])) {
            if (!sp || !_JOINT_SUPPORT_KINDS.has(sp.kind) || _failedSpells.has(sp.name)) continue;
            let apc = one;
            try { apc = g.TargetQuery.apCost(sp); } catch (e) {}
            if (ap < one + apc) continue;
            try { if (!g.TargetQuery.canAfford(unit, sp)) continue; } catch (e) { continue; }
            if ((unit.mp || 0) < _mpCost(unit, sp)) continue;
            // a cast it can already make from here needs no walk
            const tHere = findSpellTarget(unit, sp, v);
            if (tHere && scoreSpell(unit, sp, tHere, v) > 0) continue;
            spells.push(sp);
        }
        if (!spells.length) return null;
        const allyAnchors = [unit, ...(v.allies || [])].filter(a => a && !a.dead);
        const deadAllies = (g.state.units || []).filter(a => a && a.dead && a.player === unit.player);
        const enemyAnchors = v.visibleEnemies || [];
        let best = null;
        for (const sp of spells) {
            const R = (_effRange(unit, sp) || 0) + (sp.aoeRadius || sp.auraRadius || 0) + 1;
            const anchors = sp.kind === 'revive' ? deadAllies : (_ALLY_SUPPORT_KINDS.has(sp.kind) ? allyAnchors : enemyAnchors);
            if (!anchors.length) continue;
            const tiles = moveTiles.filter(t => (t.x !== unit.x || t.y !== unit.y)
                && anchors.some(a => Math.abs(a.x - t.x) + Math.abs(a.y - t.y) <= R));
            if (!tiles.length) continue;
            const ranked = tiles.map(t => ({ t, th: v.threatFn ? v.threatFn(t.x, t.y, t.z).totalDmg : 0 }))
                .sort((a, b) => a.th - b.th).slice(0, 16);
            for (const { t } of ranked) {
                const val = _withUnitAt(unit, t, () => {
                    const tg = findSpellTarget(unit, sp, v);
                    if (!tg && !['warCry', 'aoeShield', 'zoneHeal'].includes(sp.kind)) return 0;
                    return scoreSpell(unit, sp, tg, v) - _mpCost(unit, sp) * tuneW(g, 'mpValuePerPoint');
                });
                if (!(val > 0)) continue;
                const score = val * tuneW(g, 'jointSearchDiscount');
                const dng = tileDangerCost(g, unit, v, t.x, t.y, t.z);
                if (!best || score - dng > best.score - best._danger) best = { x: t.x, y: t.y, z: t.z, score, _danger: dng, _for: sp.name };
            }
        }
        return best;
    }

    /* ═══ THE FULL LIST — SPRINT, DASH AND BLINK TO GET THERE (2026-11-01). Sprint and friends (a dash with no damage
       of its own, a self teleport, a teleport-any-unit cast on ourselves) were only cast when a body sat on the dash
       line (Sprint: 15 casts in 1,610 chances). They are movement: each landing square is weighed by the best shot it
       opens (the joint search's own reader) and, when nothing can be hit, by how much closer it gets to the goal
       (only once the unit has already walked this turn, so it never replaces the walk). ═══ */
    function _mobilitySpells(g, unit) {
        const out = [];
        let silenced = false;
        try { silenced = g.unitHasStatus(unit, 'silence'); } catch (e) {}
        if (silenced || window.EW_AI_NO_MOBILITY) return out;
        for (const sp of (unit.spells || [])) {
            if (!sp || _failedSpells.has(sp.name)) continue;
            const isDash = sp.kind === 'dash' && typeof window.dashOnlyMoves === 'function' && window.dashOnlyMoves(sp);
            const isBlink = sp.kind === 'teleport' && !sp.prismBlink && !sp.onlyTerrain;
            if (!isDash && !isBlink) continue;
            try { if (!g.TargetQuery.canAfford(unit, sp)) continue; } catch (e) { continue; }
            if ((unit.mp || 0) < _mpCost(unit, sp)) continue;
            let apc = 1;
            try { apc = g.TargetQuery.apCost(sp); } catch (e) {}
            if ((unit.ap || 0) < apc) continue;
            out.push({ sp, apc, mp: _mpCost(unit, sp) });
        }
        return out;
    }
    function _mobilityLandings(g, unit, ms) {
        const sp = ms.sp;
        let tiles = [];
        if (sp.kind === 'teleport') {
            const R = _effRange(unit, sp) || sp.teleportDistance || 4;
            for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
                const d = Math.abs(dx) + Math.abs(dy);
                if (d < 2 || d > R) continue;
                const tx = unit.x + dx, ty = unit.y + dy;
                if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) continue;
                if (g.unitAt(tx, ty)) continue;
                if (typeof g.isTerrainPassable === 'function' && !g.isTerrainPassable(tx, ty)) continue;
                if (sp.needsLoS && g.isRangeBlockedByTerrain(unit.x, unit.y, tx, ty)) continue;
                tiles.push({ x: tx, y: ty, z: typeof g.getHeightAt === 'function' ? g.getHeightAt(tx, ty) : 0 });
            }
        } else {
            try { tiles = (g.TargetQuery.spellTiles(unit, sp) || []).filter(t => !g.unitAt(t.x, t.y)); } catch (e) { tiles = []; }
            tiles = tiles.filter(t => Math.abs(t.x - unit.x) + Math.abs(t.y - unit.y) >= 2 && _aimOkAt(unit, sp, t.x, t.y));
        }
        for (const t of tiles) if (t.z == null && typeof g.getHeightAt === 'function') t.z = g.getHeightAt(t.x, t.y);
        return tiles.filter(t => aiHazardPenaltyAt(unit, t.x, t.y) < 40);
    }
    function scoreMobility(unit, v, out) {
        const g = G();
        const one = g.AP_COST_ACTION || 1;
        const ms = _mobilitySpells(g, unit);
        if (!ms.length) return;
        const shotAt = (v.visibleEnemies.length || (v.enemyTower && v.enemyTower.hp > 0)) && _aiDiff().jointSearch
            ? jointMoveActionSearch(unit, [], v, { shotOnly: true }) : null;
        const walked = !g.canUnitMove(unit);
        let goal = null, prog = null, curCost = null;
        for (const m of ms) {
            const lands = _mobilityLandings(g, unit, m);
            if (!lands.length) continue;
            let best = null;
            // (a) blink / sprint into a shot (needs AP for the shot after it, and the MP for it once this cast is paid)
            const shotAtM = (shotAt && m.mp > 0 && !window.EW_AI_NO_WAY_OUT) ? (_shotAtAfterMp(unit, v, m.mp) || shotAt) : shotAt;
            if (shotAtM && (unit.ap || 0) >= m.apc + one && !_skipAttack) {
                for (const t of lands.slice(0, 48)) {
                    const shot = shotAtM(t);
                    if (!(shot > 0)) continue;
                    const sc = shot * tuneW(g, 'jointSearchDiscount') * wght(g, 'mobilityShotShare_v1', 0.95) - m.mp * tuneW(g, 'mpValuePerPoint');
                    const dng = tileDangerCost(g, unit, v, t.x, t.y, t.z);
                    if (!best || sc - dng > best.score - best._danger) best = { t, score: sc, _danger: dng };
                }
            }
            // (b) cover ground toward the goal once the walk is spent (no shot on offer)
            if (!best && walked) {
                if (!goal) { goal = pickMoveGoal(unit, v); if (goal && goal.x != null && !goal.retreat) prog = _goalProgress(g, unit, goal.x, goal.y); }
                if (goal && prog) {
                    for (const t of lands) {
                        const p = prog(t);
                        if (!(p >= 2)) continue;
                        const sc = Math.min(goal.score, 200) * Math.min(1, p / 4) * wght(g, 'mobilityGoalShare_v1', 0.5) - m.mp * tuneW(g, 'mpValuePerPoint');
                        if (!(sc > 0)) continue;
                        const dng = tileDangerCost(g, unit, v, t.x, t.y, t.z);
                        if (!best || sc - dng > best.score - best._danger) best = { t, score: sc, _danger: dng };
                    }
                }
            }
            // (c) THE WAY OUT: off a hot square to a cold one (after acting, or with nothing worth hitting from here)
            if (!best && curCost == null) curCost = (v.visibleEnemies.length && !window.EW_AI_NO_WAY_OUT) ? tileDangerCost(g, unit, v, unit.x, unit.y, unit.z) : 0;
            if (!best && curCost > 40 && !window.EW_AI_NO_WAY_OUT_SAFETY) {
                for (const t of lands) {
                    const dng = tileDangerCost(g, unit, v, t.x, t.y, t.z);
                    const gain = curCost - dng;
                    if (!(gain > 30) || !_wayOutKeepsZone(g, unit, v, t)) continue;
                    const sc = gain * 0.8 - m.mp * tuneW(g, 'mpValuePerPoint');
                    if (!(sc > 0)) continue;
                    if (!best || sc - dng > best.score - best._danger) best = { t, score: sc, _danger: dng, _wayOut: true };
                }
            }
            if (best && best.score > 0) {
                out.push({ type: 'spell', spell: m.sp, target: { x: best.t.x, y: best.t.y, z: best.t.z }, score: best.score,
                    apCost: m.apc, _mobility: true, _wayOut: !!best._wayOut, _endAt: { x: best.t.x, y: best.t.y, z: best.t.z } });
            }
        }
    }

    /* ═══ THE WAY OUT (2026-11-01, the AI gaps Batch B, gap 3: "escapes, swaps and dashes almost never win": Tag In 0 of
       1,050 chances, Temporal Shift 0 of 599, Grapple 2 of 3,719, Skin Swap 11 of 1,311, Nimble Dodge 7 of 919, Deep
       Dive 3 of 844). Their scorers asked ad-hoc questions (hurt AND an enemy within 2, an ally with a melee mate…) and
       the ranking charged a swap or a reel the danger of the square it LEAVES. Now each cast that moves the caster is a
       way off the square it stands on, weighed like the walk's safety step and the Sprint's shot:
         · a swap (Tag In / Miracle with an ally; Temporal Shift / Skin Swap with an enemy), a Grapple reel, an escape on
           the square it picks (THE ESCAPE PICK: a cast aimed at a square lands there, the player's own rule);
         · into a shot, when the AP for the hit is left: the best hit from the landing (the joint search's own reader);
         · or off a hot square: the danger it leaves minus the danger where it lands (0.8, as the walk's safety step);
         · the partner of a swap counts too: an ally's own danger read on the two squares (a hurt ally pulled out of the
           thick of it, or put into it), an enemy put on our square (where our side's hits reach it, and what it stands on).
       The landing's danger is charged centrally (_endAt) like every other option. Existing rules only: the engine casts
       them (doSpell), exactly the player's cast. Kill-switch: window.EW_AI_NO_WAY_OUT. ═══ */
    /* the best-shot reader with the MP a cast before the hit spends taken off (a Sprint / reel / escape paid first can
       leave too little for the spell the landing was valued by) */
    function _shotAtAfterMp(unit, v, mp) {
        const keep = unit.mp;
        unit.mp = Math.max(0, (unit.mp || 0) - (mp || 0));
        try { return jointMoveActionSearch(unit, [], v, { shotOnly: true }); } catch (e) { return null; } finally { unit.mp = keep; }
    }
    /* a safety hop that leaves the Nexus zone the unit stands in gives up the zone (its points, the contest) unless the
       square would kill it: those hops are left to the walk's own goal logic */
    function _wayOutKeepsZone(g, unit, v, L) {
        try {
            const zones = Object.values(g.state.nexusPoints || {});
            if (g.state.roamingNexus) zones.push(g.state.roamingNexus);
            const inNow = zones.some(n => n && _aiNexContains(n, unit.x, unit.y, unit.z));
            if (!inNow || zones.some(n => n && _aiNexContains(n, L.x, L.y, L.z))) return true;
            return v.threatFn(unit.x, unit.y, unit.z).totalDmg >= effHp(unit);
        } catch (e) { return true; }
    }
    function _allyDangerAt(g, ally, v, x, y, z) {
        if (!v._allyThreat) v._allyThreat = new Map();
        let va = v._allyThreat.get(ally.id);
        if (!va) {
            va = Object.assign({}, v, { threatFn: makeThreatFn(g, ally, v.visibleEnemies || []) });
            v._allyThreat.set(ally.id, va);
        }
        return tileDangerCost(g, ally, va, x, y, z);
    }
    function _enemySwapWorth(g, unit, e, v) {
        // the enemy lands on our square: our side's bodies that reach it there against where it stands now, and the ground
        let worth = aiHazardPenaltyAt(e, unit.x, unit.y) - aiHazardPenaltyAt(e, e.x, e.y);
        const ours = (v.allies || []).filter(a => a && !a.dead && a.id !== unit.id);
        const reachOf = (a) => { let r = 1, m = 2; try { r = g.getEffectiveRange(a) || 1; } catch (q) {} try { m = g.getEffectiveMove(a) || 2; } catch (q) {} return r + m; };
        let delta = 0;
        for (const a of ours) {
            const R = reachOf(a);
            const now = Math.abs(a.x - e.x) + Math.abs(a.y - e.y) <= R;
            const then = Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= R;
            if (then !== now) delta += (then ? 1 : -1) * Math.min(effHp(e), unitThreatOutput(g, a, e)) * 0.35;
        }
        return worth + delta;
    }
    function _wayOutSpells(g, unit) {
        const out = [];
        let silenced = false;
        try { silenced = g.unitHasStatus(unit, 'silence'); } catch (e) {}
        if (silenced || window.EW_AI_NO_WAY_OUT) return out;
        for (const sp of (unit.spells || [])) {
            if (!sp || _failedSpells.has(sp.name)) continue;
            const swap = sp.kind === 'swap';
            const reel = typeof window.isGrappleReel === 'function' && window.isGrappleReel(sp);
            const esc = sp.kind === 'escape' && typeof window.escapeLandingTiles === 'function' && !sp.spawnDecoy;
            if (!swap && !reel && !esc) continue;
            try { if (!g.TargetQuery.canAfford(unit, sp)) continue; } catch (e) { continue; }
            if ((unit.mp || 0) < _mpCost(unit, sp)) continue;
            let apc = 1;
            try { apc = g.TargetQuery.apCost(sp); } catch (e) {}
            if ((unit.ap || 0) < apc) continue;
            if (swap && hasUsedSpellKind('swap')) continue;   // never swap straight back
            out.push({ sp, apc, mp: _mpCost(unit, sp), swap, reel, esc });
        }
        return out;
    }
    function scoreWayOut(unit, v, out) {
        const g = G();
        const ms = _wayOutSpells(g, unit);
        if (!ms.length) return;
        const one = g.AP_COST_ACTION || 1;
        const okPick = (sp, u) => { try { return typeof window.spellAimProblemOn !== 'function' || window.spellAimProblemOn(unit, sp, u) === null; } catch (e) { return false; } };
        const zAt = (x, y) => (typeof g.getHeightAt === 'function' ? g.getHeightAt(x, y) : undefined);
        const curCost = v.visibleEnemies.length ? tileDangerCost(g, unit, v, unit.x, unit.y, unit.z) : 0;
        const mpw = tuneW(g, 'mpValuePerPoint');
        for (const m of ms) {
            const R = _effRange(unit, m.sp) || m.sp.range || 3;
            // the options: { land, target, partner }
            const opts = [];
            if (m.swap) {
                const pool = m.sp.allyOnly ? (v.allies || []).filter(a => a && !a.dead && a.id !== unit.id && a.player === unit.player)
                    : (v.visibleEnemies || []).filter(e => e && !e.dead && !isProtected(g, e));
                for (const p of pool) {
                    const d = Math.abs(p.x - unit.x) + Math.abs(p.y - unit.y);
                    if (d < 1 || d > R + 1 || !okPick(m.sp, p)) continue;
                    if (aiHazardPenaltyAt(unit, p.x, p.y) >= 40) continue;
                    opts.push({ land: { x: p.x, y: p.y, z: p.z != null ? p.z : zAt(p.x, p.y) }, target: p, partner: p });
                }
            } else if (m.reel) {
                let tiles = [];
                try { tiles = g.TargetQuery.spellTiles(unit, m.sp) || []; } catch (e) { tiles = []; }
                const seen = new Set();
                for (const t of tiles) {
                    const l = window.grappleLandingFor(unit, t.x, t.y, { viewer: unit.player });
                    if (!l || (l.x === unit.x && l.y === unit.y)) continue;
                    const k = l.x + ',' + l.y;
                    if (seen.has(k)) continue;
                    seen.add(k);
                    if (aiHazardPenaltyAt(unit, l.x, l.y) >= 40) continue;
                    opts.push({ land: { x: l.x, y: l.y, z: zAt(l.x, l.y) }, target: { x: t.x, y: t.y, z: t.z != null ? t.z : zAt(t.x, t.y) }, partner: null });
                }
            } else {
                for (const t of (window.escapeLandingTiles(unit, m.sp) || [])) {
                    if (g.unitAt(t.x, t.y) || aiHazardPenaltyAt(unit, t.x, t.y) >= 40) continue;
                    const l = { x: t.x, y: t.y, z: zAt(t.x, t.y) };
                    opts.push({ land: l, target: l, partner: null });
                }
            }
            if (!opts.length) continue;
            const effs = (m.sp.statusEffects || []).filter(e => e && m.esc);
            const cloak = effs.some(e => e.id === 'invisible' || e.id === 'protect') ? 0.3 : 1;
            const cloakShot = effs.some(e => e.id === 'protect') ? 0.3 : 1;   // a hit breaks invisibility, not Protect
            const canShoot = !_skipAttack && (unit.ap || 0) >= m.apc + one && _aiDiff().jointSearch
                && (v.visibleEnemies.length || (v.enemyTower && v.enemyTower.hp > 0));
            const shotAt = canShoot ? _shotAtAfterMp(unit, v, m.mp) : null;
            let best = null;
            for (const o of opts.slice(0, 60)) {
                const L = o.land;
                const raw = tileDangerCost(g, unit, v, L.x, L.y, L.z);
                const dng = raw * cloak;
                let pGain = 0;
                if (o.partner) {
                    if (o.partner.player === unit.player) {
                        pGain = _allyDangerAt(g, o.partner, v, o.partner.x, o.partner.y, o.partner.z)
                            - _allyDangerAt(g, o.partner, v, unit.x, unit.y, unit.z);
                        if (m.sp.healOnSwap > 0) pGain += healValue(g, unit, o.partner, m.sp.healOnSwap, v);
                    } else pGain = _enemySwapWorth(g, unit, o.partner, v);
                }
                // into a shot (the AP for the hit is left, the MP for it after this cast)
                if (shotAt) {
                    const shot = (o.partner && o.partner.player !== unit.player
                        ? _withUnitAt(o.partner, { x: unit.x, y: unit.y, z: unit.z }, () => shotAt(L)) : shotAt(L));
                    const dS = raw * cloakShot;
                    const sc = shot * tuneW(g, 'jointSearchDiscount') * 0.95 + pGain * 0.8 - m.mp * mpw;
                    if (shot > 0 && sc > 0 && (!best || sc - dS > best.score - best._danger)) best = { o, score: sc, _danger: dS };
                }
                // off a hot square (or a partner pulled off one)
                const gain = curCost - dng + pGain;
                if (gain > 30 && !window.EW_AI_NO_WAY_OUT_SAFETY && _wayOutKeepsZone(g, unit, v, L)) {
                    const sc = gain * 0.8 - m.mp * mpw;
                    if (sc > 0 && (!best || sc - dng > best.score - best._danger)) best = { o, score: sc, _danger: dng };
                }
            }
            if (best) {
                out.push({ type: 'spell', spell: m.sp, target: best.o.target, score: best.score, apCost: m.apc,
                    _wayOut: true, _dangerCost: best._danger, _endAt: { x: best.o.land.x, y: best.o.land.y, z: best.o.land.z } });
            }
        }
    }

    // ── macro intent layer (schema 12 shape, currency-denominated) ───────
    const _OBJECTIVE_INTENTS = new Set([
        'ctf_carry_home', 'ctf_intercept_carrier', 'ctf_return_flag', 'ctf_grab_flag',
        'hotspot_nexus', 'domination_nexus', 'arena_nexus_deny', 'arena_nexus', 'arena_nexus_celestial',
        'approach_nexus', 'grab_hg', 'approach_hg', 'siege_tower',
        'siege_tower_opportunistic', 'default_siege',
    ]);

    function pickMoveGoal(unit, v) {
        const g = G();
        const ws = v.winState;
        const goals = [];

        const mpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
        const modeId = mpMode ? mpMode.id : 'arena';

        if (modeId === 'ctf' && g.state.flags) {
            const enemyPlayer = unit.player === 1 ? 2 : 1;
            const enemyFlag = g.state.flags[enemyPlayer];
            const ownFlag = g.state.flags[unit.player];

            if (enemyFlag && enemyFlag.carriedBy === unit.id) {
                const sanct = g.state.sanctuaries?.[unit.player];
                if (sanct) {
                    const fx = unit.player === 1 ? Math.min(sanct.churchX + 1, g.bw() - 1) : Math.max(sanct.churchX - 1, 0);
                    goals.push({ x: fx, y: sanct.churchY, score: 420, reason: 'ctf_carry_home' });
                }
            }
            if (ownFlag && ownFlag.carriedBy) {
                const carrier = g.state.units.find(u => u.id === ownFlag.carriedBy && !u.dead);
                if (carrier) {
                    const d = Math.abs(unit.x - carrier.x) + Math.abs(unit.y - carrier.y);
                    if (d <= 12) goals.push({ x: carrier.x, y: carrier.y, score: 320, reason: 'ctf_intercept_carrier' });
                }
            }
            if (ownFlag && !ownFlag.atBase && !ownFlag.carriedBy) {
                const d = Math.abs(unit.x - ownFlag.x) + Math.abs(unit.y - ownFlag.y);
                if (d <= 10) goals.push({ x: ownFlag.x, y: ownFlag.y, score: 260, reason: 'ctf_return_flag' });
            }
            if (enemyFlag && !enemyFlag.carriedBy) {
                goals.push({ x: enemyFlag.x, y: enemyFlag.y, score: 220, reason: 'ctf_grab_flag' });
            }
        }

        if (modeId === 'hotspot' && g.state.roamingNexus) {
            const rn = g.state.roamingNexus;
            const cx = rn.zoneX + Math.floor(rn.zoneSize / 2);
            const cy = rn.zoneY + Math.floor(rn.zoneSize / 2);
            const d = Math.abs(unit.x - cx) + Math.abs(unit.y - cy);
            let s = 190;
            if (rn.owner !== unit.player) s += 60;
            if (d <= 4) s += 40;
            const alliesNearNexus = g._isFFA() ? 0 : g.state.units.filter(u =>
                u.player === unit.player && !u.dead && u.id !== unit.id &&
                Math.abs(u.x - cx) + Math.abs(u.y - cy) <= 4).length;
            if (alliesNearNexus >= 2) s -= 90;
            if (s > 0) goals.push({ x: cx, y: cy, score: s, reason: 'hotspot_nexus' });
        }

        // Domination: zones pay 10 pts/round, kills pay nothing — zones stay
        // a candidate mid-fight, just discounted.
        if (modeId === 'domination' && g.state.nexusPoints) {
            let bestNex = null, bestNexDist = Infinity, bestNexCenter = null;
            for (const key of Object.keys(g.state.nexusPoints)) {
                const nex = g.state.nexusPoints[key];
                if (!nex || nex.owner === unit.player || !nex.zoneSize) continue;
                const ncx = nex.zoneX + Math.floor(nex.zoneSize / 2);
                const ncy = nex.zoneY + Math.floor(nex.zoneSize / 2);
                const d = Math.abs(unit.x - ncx) + Math.abs(unit.y - ncy);
                if (d < bestNexDist) { bestNexDist = d; bestNex = nex; bestNexCenter = { x: ncx, y: ncy }; }
            }
            if (bestNex) {
                let s = 210;
                const ownedCount = Object.keys(g.state.nexusPoints).filter(f =>
                    g.state.nexusPoints[f]?.owner === unit.player).length;
                if (ownedCount === 0) s += 60;
                if (v.visibleEnemies.length > 0) s -= 70;
                goals.push({ x: bestNexCenter.x, y: bestNexCenter.y, score: s, reason: 'domination_nexus' });
            }
        }

        // Arena EMERGENCY (2026-09-12): we hold NO zone → our fallen cannot
        // respawn. Sprint to the nearest zone we don't own and flip it.
        if (modeId === 'arena' && g.state.nexusPoints) {
            const zones = Object.keys(g.state.nexusPoints).map(k => g.state.nexusPoints[k]).filter(n => n && n.zoneSize);
            const _lockAware = !!g.state.nexusPoints['spawn' + unit.player];
            if (_lockAware && zones.filter(n => n.owner === unit.player).length === 0) {
                let best = null, bestD = Infinity, bestC = null;
                for (const nex of zones) {
                    if (nex.owner === unit.player) continue;
                    const ncx = nex.zoneX + Math.floor(nex.zoneSize / 2);
                    const ncy = nex.zoneY + Math.floor(nex.zoneSize / 2);
                    const d = Math.abs(unit.x - ncx) + Math.abs(unit.y - ncy);
                    if (d < bestD) { bestD = d; best = nex; bestC = { x: ncx, y: ncy }; }
                }
                if (best) goals.push({ x: bestC.x, y: bestC.y, score: 380, reason: 'arena_nexus_deny' });
            }
        }

        if (modeId === 'tdm' || modeId === 'simul' || modeId === 'ffa') {
            if (v.closestEnemy) {
                let bestTarget = v.closestEnemy;
                let bestPriority = getTargetPriority(v.closestEnemy, unit, v);
                for (const e of v.visibleEnemies) {
                    const p = getTargetPriority(e, unit, v);
                    if (p > bestPriority + 20) { bestPriority = p; bestTarget = e; }
                }
                // At a disadvantage the hunt scores below retreat.
                const huntScore = v.tactical.shouldEngage ? 120 : 60;
                goals.push({ x: bestTarget.x, y: bestTarget.y, score: huntScore, reason: 'tdm_hunt' });
            } else {
                goals.push({ x: Math.floor(g.bw() / 2), y: Math.floor(g.bh() / 2), score: 60, reason: 'tdm_advance' });
            }
        }

        const round = g.state.round || 0;
        if (round <= 3 && v.visibleEnemies.length === 0 && v.visibleHourglasses.length === 0) {
            const exploreBonus = AI_TUNE.earlyExploreBonus;
            if (exploreBonus > 0 && g.canUnitMove(unit)) {
                const moveTiles = _aiMoveTiles(g, unit);
                if (moveTiles.length > 0) {
                    const cx = Math.floor(g.bw() / 2);
                    const cy = Math.floor(g.bh() / 2);
                    let bestTile = null, bestVal = -Infinity;
                    for (const t of moveTiles) {
                        let val = 0;
                        const curCenterDist = Math.abs(unit.x - cx) + Math.abs(unit.y - cy);
                        const newCenterDist = Math.abs(t.x - cx) + Math.abs(t.y - cy);
                        val += (curCenterDist - newCenterDist) * 2;
                        for (const a of v.allies) val += Math.min(3, Math.abs(t.x - a.x) + Math.abs(t.y - a.y));
                        if ((unit._aiRecentTiles || []).includes(g.posKey(t.x, t.y))) val -= 6;
                        if (val > bestVal) { bestVal = val; bestTile = t; }
                    }
                    if (bestTile) {
                        goals.push({ x: bestTile.x, y: bestTile.y, score: exploreBonus + Math.min(bestVal, 20), reason: 'early_explore' });
                    }
                }
            }
        }

        // Loose hourglasses are a win condition — reachable this turn?
        if (v.visibleHourglasses.length > 0) {
            const moveTiles = _aiMoveTiles(g, unit);
            const reachable = v.visibleHourglasses.filter(h =>
                moveTiles.some(t => t.x === h.x && t.y === h.y));
            if (reachable.length > 0) {
                reachable.sort((a, b) =>
                    (Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y)) -
                    (Math.abs(b.x - unit.x) + Math.abs(b.y - unit.y)));
                let s = 230;
                if (ws.phase === 'hg_losing') s += 80;
                s += (unit.hourglasses || 0) * 15;
                // Arena clock: a Key carried at the buzzer is 35 points and the tie-break.
                if (ws.arenaClock) s += 20 * ws.roundUrgency * (ws.scorePlay ?? 1);
                goals.push({ x: reachable[0].x, y: reachable[0].y, score: s, reason: 'grab_hg' });
            }
            // …or at least approach the nearest one.
            const nearest = v.visibleHourglasses.slice().sort((a, b) =>
                (Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y)) -
                (Math.abs(b.x - unit.x) + Math.abs(b.y - unit.y)))[0];
            let s2 = 110 + wght(g, 'hgSeekPriority_v1', 19) * 6;
            if (Math.abs(nearest.x - unit.x) + Math.abs(nearest.y - unit.y) <= 4) s2 += 30;
            if (ws.phase === 'hg_losing') s2 += 50;
            if (ws.arenaClock) s2 += 15 * ws.roundUrgency * (ws.scorePlay ?? 1);
            goals.push({ x: nearest.x, y: nearest.y, score: s2, reason: 'approach_hg' });
        }

        if (v.ownTower && v.ownTower.hp > 0 && v.visibleEnemies.length > 0) {
            const threats = v.visibleEnemies.filter(e =>
                Math.abs(e.x - v.ownTower.x) + Math.abs(e.y - v.ownTower.y) <= 5);
            if (threats.length > 0) {
                const myDist = Math.abs(unit.x - v.ownTower.x) + Math.abs(unit.y - v.ownTower.y);
                const closestThreat = Math.min(...threats.map(e => Math.abs(e.x - v.ownTower.x) + Math.abs(e.y - v.ownTower.y)));
                if (myDist > closestThreat + 1 && myDist > 3) {
                    let s = wght(g, 'towerDefendBonus_v1', 48) * 4;
                    if (ws.phase === 'tower_defend') s += 90;
                    goals.push({ x: v.ownTower.x, y: v.ownTower.y, score: s, reason: 'defend_tower' });
                }
            }
        }

        // Arena: a celestial event buffs whoever holds the MIDDLE zone (state.js getSkyEventBonus) and a new
        // event resets it to nobody — while one is up, taking (or retaking) the middle comes before the other zones.
        if (modeId === 'arena' && g.state.nexusPoints && g.state.skyEvent && typeof getCelestialNexusKey === 'function') {
            const ck = getCelestialNexusKey();
            const cn = ck ? g.state.nexusPoints[ck] : null;
            if (cn && cn.zoneSize && cn.owner !== unit.player) {
                const ccx = cn.zoneX + Math.floor(cn.zoneSize / 2);
                const ccy = cn.zoneY + Math.floor(cn.zoneSize / 2);
                let s = 230;
                if (v.visibleEnemies.length > 0) s -= 45;
                const alliesNear = g.state.units.filter(u =>
                    u.player === unit.player && !u.dead && u.id !== unit.id &&
                    Math.abs(u.x - ccx) + Math.abs(u.y - ccy) <= 2).length;
                if (alliesNear >= 2) s -= 90;
                goals.push({ x: ccx, y: ccy, score: s, reason: 'arena_nexus_celestial' });
            }
        }

        // Arena: nexus zones are a first-class objective, pressed mid-fight.
        if (modeId === 'arena' && g.state.nexusPoints) {
            const zones = Object.keys(g.state.nexusPoints).map(k => g.state.nexusPoints[k]).filter(n => n && n.zoneSize);
            if (zones.length) {
                const enemyPlayer = unit.player === 1 ? 2 : 1;
                let best = null, bestD = Infinity, bestC = null;
                for (const nex of zones) {
                    if (nex.owner === unit.player) continue;
                    const ncx = nex.zoneX + Math.floor(nex.zoneSize / 2);
                    const ncy = nex.zoneY + Math.floor(nex.zoneSize / 2);
                    const d = Math.abs(unit.x - ncx) + Math.abs(unit.y - ncy);
                    if (d < bestD) { bestD = d; best = nex; bestC = { x: ncx, y: ncy }; }
                }
                if (best) {
                    const ownedCount = zones.filter(n => n.owner === unit.player).length;
                    let s = 170;
                    if (v.visibleEnemies.length > 0) s -= 55;
                    if (ownedCount === 0) s += 35;
                    s += ownedCount * 25;
                    if (best.owner === enemyPlayer) s += 25;
                    /* Their LAST zone (or their spawn nexus) → capturing it
                       locks their respawns; a home spawn stolen from us → get
                       it back before the deaths pile up. */
                    const _enemyOwnedZ = zones.filter(n => n.owner === enemyPlayer).length;
                    if (best.owner === enemyPlayer && _enemyOwnedZ === 1) s += 110;
                    if (best.isSpawn && best.owner === enemyPlayer) s += 50;
                    if (best === g.state.nexusPoints['spawn' + unit.player]) s += 80;
                    if (v.enemyTower && v.enemyTower.hp < v.enemyTower.maxHp * 0.25) s -= 50;
                    const alliesNear = g.state.units.filter(u =>
                        u.player === unit.player && !u.dead && u.id !== unit.id &&
                        Math.abs(u.x - bestC.x) + Math.abs(u.y - bestC.y) <= 3).length;
                    if (alliesNear >= 2) s -= 80;
                    // The 20-round clock: a held zone pays nexus rounds every round
                    // (double in the Nexus Surge) — worth more the closer the buzzer
                    // and the more we need points.
                    if (ws.arenaClock && ws.roundUrgency > 0) {
                        const need = (ws.scorePolicy === 'seek_score' || ws.scorePolicy === 'break_tie') ? 30 : 12;
                        s += need * ws.roundUrgency * (ws.scorePlay ?? 1);
                    }
                    s += _nexusHoldValue(g, unit, best, ws, false);
                    if (s > 0) goals.push({ x: bestC.x, y: bestC.y, score: s, reason: 'arena_nexus' });
                }
            }
        }

        // Generic nexus approach for modes without a dedicated block above.
        if (g.state.nexusPoints && v.visibleEnemies.length === 0
            && modeId !== 'arena' && modeId !== 'domination') {
            let bestNex = null, bestNexDist = Infinity, bestNexCenter = null;
            for (const key of Object.keys(g.state.nexusPoints)) {
                const nex = g.state.nexusPoints[key];
                if (!nex || nex.owner === unit.player || !nex.zoneSize) continue;
                const cx = nex.zoneX + Math.floor(nex.zoneSize / 2);
                const cy = nex.zoneY + Math.floor(nex.zoneSize / 2);
                const d = Math.abs(unit.x - cx) + Math.abs(unit.y - cy);
                if (d < bestNexDist) { bestNexDist = d; bestNex = nex; bestNexCenter = { x: cx, y: cy }; }
            }
            if (bestNex && bestNexDist <= 10) {
                let s = wght(g, 'nexusCapBonus_v1', 39) * 4;
                const ownedCount = Object.keys(g.state.nexusPoints).filter(f =>
                    g.state.nexusPoints[f]?.owner === unit.player).length;
                s += ownedCount * 20;
                if (ownedCount === 0) s += 30;
                if (v.enemyTower && v.enemyTower.hp < v.enemyTower.maxHp * 0.3) s -= 60;
                if (s > 0) goals.push({ x: bestNexCenter.x, y: bestNexCenter.y, score: s, reason: 'approach_nexus' });
            }
        }

        if (v.enemyTower && v.enemyTower.hp > 0) {
            const towerDist = Math.abs(unit.x - v.enemyTower.x) + Math.abs(unit.y - v.enemyTower.y);
            const towerDefenders = v.visibleEnemies.filter(e =>
                Math.abs(e.x - v.enemyTower.x) + Math.abs(e.y - v.enemyTower.y) <= 4);
            const shouldPush = (
                ws.phase === 'tower_push' ||
                ws.phase === 'numbers_advantage' ||
                ws.enemyDeadCount >= 1 ||
                towerDefenders.length === 0 ||
                ws.roundUrgency >= 2 ||
                v.enemyTower.hp < v.enemyTower.maxHp * 0.7
            );
            if (shouldPush) {
                let s = 110;
                if (ws.enemyDeadCount >= 2) s += 130;
                else if (ws.enemyDeadCount >= 1) s += 80;
                if (ws.enemyMinRespawn >= 6) s += 130;
                else if (ws.enemyMinRespawn >= 4) s += 80;
                if (towerDefenders.length === 0) s += 90;
                if (v.enemyTower.hp < v.enemyTower.maxHp * 0.5) s += 80;
                if (v.enemyTower.hp < v.enemyTower.maxHp * 0.3) s += 90;
                if (ws.phase === 'tower_push') s += 110;
                if (ws.phase === 'numbers_advantage') s += 55;
                s += ws.roundUrgency * 45;
                if (towerDist <= 5) s += 35;
                goals.push({ x: v.enemyTower.x, y: v.enemyTower.y, score: s, reason: 'siege_tower' });
            } else if (towerDist <= 8 && v.closestEnemyDist > 3) {
                goals.push({ x: v.enemyTower.x, y: v.enemyTower.y, score: 90, reason: 'siege_tower_opportunistic' });
            }
        }

        if (ws.phase === 'even' && ws.roundUrgency === 0 && v.visibleEnemies.length === 0) {
            const mapCenterX = Math.floor(g.bw() / 2);
            const mapCenterY = Math.floor(g.bh() / 2);
            const distToMid = Math.abs(unit.x - mapCenterX) + Math.abs(unit.y - mapCenterY);
            if (distToMid > 3) {
                goals.push({ x: mapCenterX, y: mapCenterY, score: 70, reason: 'advance_to_mid' });
            }
        }

        if (!v.tactical.shouldEngage && v.closestEnemyDist <= 5 && v.closestEnemyDist < Infinity) {
            const enemiesNearOwnTower = v.ownTower && v.ownTower.hp > 0 &&
                v.visibleEnemies.some(e =>
                    Math.abs(e.x - v.ownTower.x) + Math.abs(e.y - v.ownTower.y) <= 5);
            if (!enemiesNearOwnTower) {
                goals.push({ retreat: true, score: 95, reason: 'retreat' });
            }
        }

        if (v.closestEnemy && v.tactical.shouldEngage) {
            let bestTarget = v.closestEnemy;
            let bestPriority = getTargetPriority(v.closestEnemy, unit, v);
            for (const e of v.visibleEnemies) {
                const p = getTargetPriority(e, unit, v);
                const d = _dist(g, unit.x, unit.y, unit.z, e);
                if (p > bestPriority + 30 && d < 12) { bestPriority = p; bestTarget = e; }
            }
            // Closing on a visible enemy IS the core of playing well — at 75
            // this always lost to zone/hourglass camping and both AIs sat at
            // range for entire matches (sim: 2.7 kills/match, 90% end HP).
            let s = 160;
            if (v.enemyTower && v.enemyTower.hp > 0) {
                const eDist = Math.abs(bestTarget.x - v.enemyTower.x) + Math.abs(bestTarget.y - v.enemyTower.y);
                if (eDist <= 4) s += 40;
            }
            goals.push({ x: bestTarget.x, y: bestTarget.y, score: s, reason: 'approach_enemy' });
        }

        if (v.enemyTower && v.enemyTower.hp > 0) {
            goals.push({ x: v.enemyTower.x, y: v.enemyTower.y, score: 55, reason: 'default_siege' });
        }

        // 🚪 THE ONE-WAY DOOR (§4.3): go break the door holding one of ours — while it can still fall in time
        for (const h of _capHeldAllyDoors(g, unit)) {
            const seal = Math.max(1, h.door.held.seal | 0);
            let mv = 2, rg = 1;
            try { mv = g.getEffectiveMove(unit) || 2; } catch (e) {}
            try { rg = g.getEffectiveRange(unit) || 1; } catch (e) {}
            const d = Math.abs(unit.x - h.door.x) + Math.abs(unit.y - h.door.y);
            if (d > mv * seal + rg) continue;   // it seals before we could swing
            goals.push({ x: h.door.x, y: h.door.y, score: CAP_TUNE.freeGoal + (seal <= 1 ? 60 : 0), reason: 'free_captive' });
        }

        /* 👁 VISION (2026-10-09): sight is 2-6 tiles now, so an enemy that slips out of view is not forgotten — the
           team walks to where it was last seen (fresh sightings pull hardest); lastSeenHunt_v1 tunes it.
           2026-11-01 (mondo: "Have it walk towards last seen enemy"): a sighting is kept 8 rounds (was 4) and always
           outweighs the drift to the middle (advance_to_mid 70 / tdm_advance 60 / explore 30): an old or far sighting
           used to fall under those, so a unit that lost sight walked to the centre and stood there. The freshest,
           nearest sighting still leads; a square the team looks at and finds empty is forgotten (_aiNoteSightings). */
        if (v.visibleEnemies.length === 0 && g.canUnitMove(unit)) {
            const ls = _aiLastSeenFor(g, unit.player);
            const rnd = g.state.round || 0;
            let best = null, bestRaw = -Infinity;
            for (const rec of ls.values()) {
                const age = Math.max(0, rnd - rec.round);
                if (age > 8) continue;
                const d = Math.abs(unit.x - rec.x) + Math.abs(unit.y - rec.y);
                const raw = 120 - age * 22 - Math.min(40, d * 3);
                if (raw > bestRaw) { bestRaw = raw; best = rec; }
            }
            if (best) goals.push({ x: best.x, y: best.y, score: Math.max(75, bestRaw) * wght(g, 'lastSeenHunt_v1', 1), reason: 'hunt_last_seen' });
        }

        goals.push({
            x: Math.floor(g.bw() / 2),
            y: Math.floor(g.bh() / 2),
            score: 30, reason: 'explore',
        });

        // THE TACTICS (2026-10-23): the unit's Tactic adds its own goal. A FORCED Tactic (the player's pick)
        // damps the other goals while its own exists, so a Search unit doesn't wander off to siege.
        // 2026-10-23 browser check: a CPU-assigned job damps them too (×0.75), or the generic siege_tower goal
        // walked the plan's searcher to the Cube and it never searched.
        const _tGoal = _tacticGoal(g, unit, v);
        if (_tGoal) {
            const damp = _tacticInfo(unit)?.forced ? 0.6 : 0.75;
            for (const goal of goals) if (!_TACTIC_KEEP_GOALS.has(goal.reason)) goal.score *= damp;
            goals.push(_tGoal);
        }

        // Apply the mode policy after generic intents too: otherwise the
        // 160-point approach_enemy silently overrides the TDM hunt policy.
        for (const goal of goals) {
            if (!['tdm_hunt', 'tdm_advance', 'approach_enemy', 'advance_to_mid', 'explore', 'hunt_last_seen'].includes(goal.reason)) continue;
            const sp = ws.scorePlay ?? 1;
            if (ws.scorePolicy === 'protect_lead') goal.score *= Math.max(0.15, 1 - 0.6 * sp);
            else if (ws.scorePolicy === 'seek_score') goal.score += 40 * ws.roundUrgency * sp;
            else if (ws.scorePolicy === 'break_tie') goal.score += 20 * ws.roundUrgency * sp;
            else if (ws.scorePolicy === 'sudden_death') goal.score += 60;
        }

        // Hard difficulty's objective persona.
        const _om = _aiDiff().objectiveMult;
        if (_om !== 1) {
            for (const c of goals) {
                if (_OBJECTIVE_INTENTS.has(c.reason)) c.score *= _om;
            }
        }

        let best = goals[0];
        for (const c of goals) if (c.score > best.score) best = c;
        unit._aiLastIntent = best.reason;   // debug: shows up in unit dumps
        return best;
    }

    /* ── THE PATH FIELD (2026-11-01, mondo: "it will literally just do nothing in the corner or on the edge") ──
       Walking distance to the goal from every square, counted backwards from the goal over the same steps the old A*
       waypoint allowed (engine-parity climb / roof / edge-wall / phase rules). The walk used to aim at the A* path's
       FIRST STEP, so with any wall in the corridor a unit crept one square per move, and the square it picked could
       back AWAY from the goal (danger + height tie-breaks outweighed one square of progress) while still carrying the
       whole goal score: CPU vs CPU logs showed units "sieging" or "approaching" in circles on the map edge for rounds.
       An impassable goal (the Cube, a wall) is reached at any square in attack range that has a clear shot at it.
       Returns { d, W } (d = squares of walking cost, Infinity = no way there) or null when the goal has no square. */
    function _goalField(g, unit, goalX, goalY) {
        const W = g.bw(), H = g.bh();
        if (!(W > 0 && H > 0) || !g.isInside(goalX, goalY)) return null;
        const N = W * H;
        const d = new Float32Array(N).fill(Infinity);
        const heap = [];   // binary min-heap of [cost, index]
        const push = (c, i) => {
            heap.push([c, i]);
            let k = heap.length - 1;
            while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; }
        };
        const pop = () => {
            const top = heap[0], last = heap.pop();
            if (heap.length) {
                heap[0] = last;
                let k = 0;
                for (;;) {
                    const l = 2 * k + 1, r = l + 1;
                    let m = k;
                    if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
                    if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
                    if (m === k) break;
                    [heap[m], heap[k]] = [heap[k], heap[m]]; k = m;
                }
            }
            return top;
        };
        const startIdx = unit.x + unit.y * W;
        const passable = (x, y) => (x === unit.x && y === unit.y) || g.unitCanTraverse(unit, x, y);
        if (passable(goalX, goalY)) {
            d[goalX + goalY * W] = 0; push(0, goalX + goalY * W);
        } else {
            let range = 1;
            try { range = g.getEffectiveRange(unit) || 1; } catch (e) {}
            const ring = [], clear = [];
            for (let dy = -range; dy <= range; dy++) {
                for (let dx = -range; dx <= range; dx++) {
                    const md = Math.abs(dx) + Math.abs(dy);
                    if (md < 1 || md > range) continue;
                    const ax = goalX + dx, ay = goalY + dy;
                    if (ax < 0 || ay < 0 || ax >= W || ay >= H || !passable(ax, ay)) continue;
                    ring.push(ax + ay * W);
                    let blocked = false;
                    try { blocked = !!(g.isRangeBlockedByTerrain && g.isRangeBlockedByTerrain(ax, ay, goalX, goalY)); } catch (e) {}
                    if (!blocked) clear.push(ax + ay * W);
                }
            }
            const goalSet = clear.length ? clear : ring;
            if (!goalSet.length) return null;
            for (const i of goalSet) { d[i] = 0; push(0, i); }
        }

        const _hasHeight = typeof g.getHeightAt === 'function';
        const _canFly = typeof g.canFly === 'function' && g.canFly(unit);
        const _jumpH = (typeof g.getUnitJumpClimb === 'function')
            ? g.getUnitJumpClimb(unit) : (g.JUMP_HEIGHT ?? 1);
        const _phase = typeof unitIsPhasing === 'function' && unitIsPhasing(unit);
        /* 🧗 THE CPU CLIMB (2026-11-01, mondo: "start teaching the cpu to use climb"): a face taller than the jump is
           a step too, priced as the turns it costs (one turn per stretch of jump + 2, a turn = two moves of squares),
           so the walk heads for the foot of a wall only when going round is longer. scoreClimbs takes the climb. */
        const _climbOk = !_canFly && _aiCanEverClimb(g, unit);
        const _climbStretch = _jumpH + 2;
        let _turnSq = 6;
        try { _turnSq = 2 * Math.max(1, g.getEffectiveMove(unit) || unit.move || 3); } catch (e) {}
        // Movement is 4-directional (cardinal only) — engine parity.
        const DIRS = [[1,0],[0,1],[-1,0],[0,-1]];
        /* 🦘 THE CPU JUMP (2026-11-01): the path field also knows the existing Jump (battle.js getJumpTiles: 1 AP, once a
           turn, the 8 squares around plus a straight leap up to the unit's reach, over gaps / craters / a fissure, real
           arc physics via map.js jumpArcClear). A leap costs its squares + LEAP_EXTRA so walking stays preferred and a
           leap is only planned where it saves real walking or is the only way across. Flyers glide (no leaps). */
        const LEAP_EXTRA = wght(g, 'jumpPathCost_v1', 2);   // THE TRAINABLE FIXES: trained (was a fixed 2)
        const LEAPS = [];
        if (_hasHeight && !_canFly && _aiCanEverJump(g, unit) && typeof window.jumpArcClear === 'function') {
            let reach = 2;
            try { reach = Math.max(2, g.getUnitJumpReach(unit) | 0); } catch (e) {}
            for (let dy = -reach; dy <= reach; dy++) for (let dx = -reach; dx <= reach; dx++) {
                const adx = Math.abs(dx), ady = Math.abs(dy);
                if (adx + ady < 2) continue;                       // the 4 walking steps
                const diag = adx === 1 && ady === 1;
                if (!diag && adx + ady > reach) continue;          // engine metric: ring of 8, then a diamond
                LEAPS.push([dx, dy, diag, (diag ? 2 : adx + ady) + LEAP_EXTRA]);
            }
        }
        while (heap.length) {
            const [c, ci] = pop();
            if (c > d[ci]) continue;
            if (ci === startIdx) break;   // everything the walk needs is settled
            const cx = ci % W, cy = (ci - cx) / W;
            for (const [dx, dy] of DIRS) {
                // a step FROM (nx,ny) INTO (cx,cy)
                const nx = cx + dx, ny = cy + dy;
                if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                const ni = nx + ny * W;
                if (d[ni] <= c + 1) continue;
                if (!passable(nx, ny)) continue;
                if (!_phase && g.objectBlocksEdge && g.objectBlocksEdge(nx, ny, cx, cy)) continue;
                let step = 1;
                if (_hasHeight && !_canFly) {
                    const rise = g.getHeightAt(cx, cy) - g.getHeightAt(nx, ny);
                    // 🏢 a building's roof is a ledge like any other (2026-11-01: the Enter Building lift is gone) — jumped or climbed
                    if (rise > _jumpH) {
                        if (!_climbOk || _aiClimbFaceBlocked(g, nx, ny, cx, cy)) continue;
                        step = Math.ceil(rise / _climbStretch) * _turnSq;   // 🧗 the climb: a turn per stretch
                    } else if (rise > 0) step = Math.max(step, rise);
                }
                if (c + step < d[ni]) { d[ni] = c + step; push(c + step, ni); }
            }
            // a LEAP from (nx,ny) onto (cx,cy) — the takeoff square must be standable, the arc must clear (jumpArcClear)
            for (const [dx, dy, diag, cost] of LEAPS) {
                const nx = cx + dx, ny = cy + dy;
                if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                const ni = nx + ny * W;
                if (d[ni] <= c + cost) continue;
                if (!passable(nx, ny)) continue;
                const hn = g.getHeightAt(nx, ny), hc = g.getHeightAt(cx, cy);
                if (hc - hn > _jumpH) continue;
                let ok = false;
                try {
                    ok = diag
                        ? !(typeof window.wallBlocksJump === 'function' && window.wallBlocksJump(nx, ny, hn, cx, cy, hc, _jumpH))
                        : !!window.jumpArcClear(nx, ny, hn, cx, cy, hc, _jumpH);
                } catch (e) { ok = false; }
                if (!ok) continue;
                d[ni] = c + cost; push(c + cost, ni);
            }
        }
        return { d, W };
    }
    // The walk's progress measure toward a goal: field squares when the goal (or, failing that, the map centre) can be
    // walked to, else plain distance to the goal. prog(tile) > 0 = the tile is closer than where the unit stands.
    function _goalProgress(g, unit, goalX, goalY) {
        let F = _goalField(g, unit, goalX, goalY);
        if (!F || !(F.d[unit.x + unit.y * F.W] < Infinity)) {
            const mx = Math.floor(g.bw() / 2), my = Math.floor(g.bh() / 2);
            F = (mx !== goalX || my !== goalY) ? _goalField(g, unit, mx, my) : null;
            if (F && !(F.d[unit.x + unit.y * F.W] < Infinity)) F = null;
        }
        if (F) {
            const here = F.d[unit.x + unit.y * F.W];
            return t => { const v = F.d[t.x + t.y * F.W]; return v < Infinity ? here - v : -Infinity; };
        }
        const here = Math.abs(unit.x - goalX) + Math.abs(unit.y - goalY);
        return t => here - (Math.abs(t.x - goalX) + Math.abs(t.y - goalY));
    }

    // info (optional): { prog } in = a path field already built for this goal; out: info.prog, info.score (the pick's score)
    function pickBestMoveTile(unit, moveTiles, goal, v, info) {
        const g = G();

        if (goal.retreat) {
            const enemies = v.visibleEnemies;
            if (enemies.length === 0) return null;
            let best = null, bestScore = -Infinity;
            for (const tile of moveTiles) {
                let score = 0;
                for (const e of enemies) {
                    const d = Math.abs(tile.x - e.x) + Math.abs(tile.y - e.y);
                    const curD = Math.abs(unit.x - e.x) + Math.abs(unit.y - e.y);
                    score += (d - curD) * 64;
                    if (d <= g.getEffectiveRange(e)) score -= 120;
                }
                for (const a of v.allies) {
                    if (Math.abs(tile.x - a.x) + Math.abs(tile.y - a.y) <= 4) score += 48;
                }
                if (typeof g.getHeightAt === 'function') {
                    score += Math.min(tileH(g, tile), 4) * AI_TUNE.moveRetreatHeight;
                }
                score -= v.threatFn(tile.x, tile.y, tile.z).totalDmg * 0.4;
                score -= aiHazardPenaltyAt(unit, tile.x, tile.y) * 2;
                score -= tile._jumpFall || 0;   // 🦘 a leap down a drop pays its fall damage
                if ((unit._aiRecentTiles || []).includes(g.posKey(tile.x, tile.y))) score += wght(g, 'antiOscillationPen_v1', -4) * 10;
                if (score > bestScore) { bestScore = score; best = tile; }
            }
            if (info) info.score = bestScore;
            return best;
        }

        const goalX = goal.x, goalY = goal.y;
        if (goalX === undefined) return null;

        // THE PATH FIELD: only squares that get closer along a real path count, scored by how much closer they get.
        const prog = (info && info.prog) || _goalProgress(g, unit, goalX, goalY);
        if (info) info.prog = prog;

        // Anti-clump matters most when the enemy has AoE in its kits.
        let enemyHasAoe = false;
        for (const e of v.visibleEnemies) {
            if ((e.spells || []).some(sp => sp && SPLASH_KINDS.has(sp.kind))) { enemyHasAoe = true; break; }
        }

        let best = null, bestScore = -Infinity;
        const isRanged = (unit.range || 1) >= 2;
        for (const tile of moveTiles) {
            const p = prog(tile);
            if (!(p > 0)) continue;   // a walk toward the goal never steps sideways or back (that read as idling)
            let score = p * 10;

            score -= v.threatFn(tile.x, tile.y, tile.z).totalDmg * 0.08;
            score -= aiHazardPenaltyAt(unit, tile.x, tile.y);
            score -= tile._jumpFall || 0;   // 🦘 a leap down a drop pays its fall damage

            let adjAllies = 0;
            for (const a of v.allies) {
                if (Math.abs(tile.x - a.x) + Math.abs(tile.y - a.y) <= 3) score += 2;
                if (Math.abs(tile.x - a.x) <= 1 && Math.abs(tile.y - a.y) <= 1) adjAllies++;
            }
            // AoE-magnet prevention (XCOM's ×0.2 adjacency, additive form).
            if (adjAllies >= 2) score -= enemyHasAoe ? 60 : 25;

            if (typeof g.getHeightAt === 'function') {
                const th = tileH(g, tile);
                score += Math.min(th, 4) * (isRanged ? AI_TUNE.moveHighGroundRanged : tuneW(g, 'moveHighGroundMelee'));
            }
            if ((unit._aiRecentTiles || []).includes(g.posKey(tile.x, tile.y))) score += wght(g, 'antiOscillationPen_v1', -4) * 10;
            if (score > bestScore) { bestScore = score; best = tile; }
        }
        if (info) info.score = bestScore;
        return best;
    }

    // ═════════════════════════════════════════════════════════════════════
    // REMAINING ACTION SCORERS (inspect / flair / guard / nexus / recall /
    // build / altitude) — kept behaviors, currency-denominated.
    // ═════════════════════════════════════════════════════════════════════

    function scoreInspect(unit, v, out) {
        const g = G();
        if ((unit.ap || 0) < g.AP_COST_ACTION || (typeof g.canUnitAct === 'function' && !g.canUnitAct(unit))) return;

        const unrevHG = (g.state.hourglasses || []).filter(h =>
            h.carriedBy === null && !h.visibleTo[unit.player]).length;

        const allTiles = g.getInspectTiles(unit);
        if (allTiles.length === 0) return;

        // Score the actual collection footprint, including already-scanned
        // tiles with a newly dropped Key. Only revealed loose Keys enter it.
        if (typeof g.getInspectFootprint === 'function' && typeof g.getKeysToWin === 'function') {
            const mode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
            const keys = (g.state.hourglasses || []).filter(h => h.carriedBy === null && h.visibleTo?.[unit.player]);
            const need = g.getKeysToWin(mode);
            const held = p => (g.state.hourglasses || []).filter(h => h.carriedBy != null &&
                g.state.units.find(u => u.id === h.carriedBy)?.player === p).length;
            const mine = held(unit.player), theirs = held(g.enemyOf(unit.player));
            const keyMode = mode?.id === 'arena' && mode.winConditions?.includes('hourglasses_collected') &&
                !g.state.winner && !g.state._spellLabMode && !window._tutActive &&
                (!g.state.towers || Object.values(g.state.towers).every(t => !t || t.hp > 0)) &&
                (typeof g.getTeamWipeoutCount !== 'function' || (g.getTeamWipeoutCount(1) > 0 && g.getTeamWipeoutCount(2) > 0));
            for (const t of allTiles) {
                const footprint = g.getInspectFootprint(unit, t.x, t.y);
                const count = keys.filter(h => footprint.some(p => p.x === h.x && p.y === h.y)).length;
                if (!count) continue;
                // This is a known-Key outcome, not an oracle for hidden traps.
                const winning = keyMode && (g.state.suddenDeathActive || (need > 0 && mine + count >= need && theirs < need));
                const denial = keyMode && need > 0 && theirs >= need - 1;
                out.push({ type: 'inspect', x: t.x, y: t.y,
                    score: (_keySense() ? Math.max(count * _keyFloor(g), _keyWorth(g, unit.player, count, v)) : count * 180) + (denial ? 160 : 0), _objectiveWin: !!winning, _keyPickup: count });
            }
        }

        /* THE FULL LIST — LOOT (2026-11-01): Inspect also loots the items on a fallen body (battle.js lootCorpseItems, friend
           or foe); the CPU only ever inspected for Keys. A fallen body in sight with a pack on it is worth a search. */
        if (!window.EW_AI_NO_LOOT && typeof g.getInspectFootprint === 'function') {
            const corpses = (g.state.units || []).filter(u => u && u.dead && !u._benched && u.items
                && Object.keys(u.items).some(k => (u.items[k] || 0) > 0)
                && (!v.visTiles || v.visTiles.has(g.posKey(u.x, u.y))));
            if (corpses.length) {
                for (const t of allTiles) {
                    const fp = g.getInspectFootprint(unit, t.x, t.y);
                    const n = corpses.filter(c => fp.some(p => p.x === c.x && p.y === c.y)).length;
                    if (!n) continue;
                    let sc = 30 + 25 * Math.min(3, n);
                    if (v.visibleEnemies.length > 0) sc *= 0.6;
                    out.push({ type: 'inspect', x: t.x, y: t.y, score: sc, _loot: n });
                }
            }
        }

        const unscanned = allTiles.filter(t =>
            !_aiSearched(g.state, unit.player).has(g.scanKey(t.x, t.y)));

        const cx = Math.floor(g.bw() / 2), cy = Math.floor(g.bh() / 2);
        const pool = unscanned.length > 0 ? unscanned : allTiles;
        pool.sort((a, b) =>
            (Math.abs(a.x - cx) + Math.abs(a.y - cy)) - (Math.abs(b.x - cx) + Math.abs(b.y - cy)));

        /* THE SEARCH MAP (2026-10-23, the Tactics pass): a blind Inspect is worth the Keys it is EXPECTED to find
           (aiSearchMap: fog-honest odds per tile) × Search Value, aimed at the footprint with the best odds instead
           of the tile nearest the centre. The old flat formula stays as the floor and as the kill-switch path
           (window.EW_AI_NO_SEARCHMAP). One discount only now: a fight in sight (it used to stack ×0.3 twice). */
        let pick = pool[0], ev = 0;
        const sm = window.EW_AI_NO_SEARCHMAP ? null : _searchMapFor(g, unit, unit.player);
        if (sm && sm.hidden > 0) {
            for (const t of allTiles) {
                const e = _footprintEV(g, unit, sm, t.x, t.y);
                if (e > ev) { ev = e; pick = t; }
            }
        }
        let s = 8;
        if (unscanned.length > 0) s += 8;
        // Blind Key search (Arena hides all 5 and needs all 5).
        s += unrevHG * wght(g, 'keyHuntPriority_v1', 12);
        if (sm) s = Math.max(s * 0.5, 8 + ev * wght(g, 'searchKeyValue_v1', 285));
        if (v.winState.phase === 'hg_losing') s += 25;
        const ws = v.winState;
        // there's a fight on (a unit on the Search Tactic keeps most of its search value: the clocks sent it)
        if (v.visibleEnemies.length > 0) s *= (sm && _tacticOf(unit) === 'search') ? 0.75 : 0.3;
        else if (sm ? (ws.roundUrgency >= 2) : (ws.phase === 'tower_push' || ws.enemyDeadCount >= 1 || ws.roundUrgency >= 2)) s *= 0.3;

        out.push({ type: 'inspect', x: pick.x, y: pick.y, score: s, _searchEV: ev });
    }

    function scoreFlairWard(unit, v, out) {
        const g = G();
        if ((unit.ap || 0) < g.AP_COST_ACTION) return;

        if (g.unitHasFlair(unit) && !unit._usedFlair) {
            const unrev = (g.state.hourglasses || []).filter(h => h.carriedBy === null && !h.visibleTo[unit.player]).length;
            if (unrev > 0) {
                const visTileSet = v.visTiles;
                const cx = Math.floor(g.bw() / 2), cy = Math.floor(g.bh() / 2);
                let bestTile = null, bestScore = -1;
                for (let y = 0; y < g.bh(); y++) {
                    for (let x = 0; x < g.bw(); x++) {
                        const d = Math.abs(unit.x - x) + Math.abs(unit.y - y);
                        if (d > 8 || d === 0) continue;
                        if (visTileSet.has(g.posKey(x, y))) continue;
                        const sc = 20 - Math.abs(x - cx) - Math.abs(y - cy);
                        if (sc > bestScore) { bestScore = sc; bestTile = { x, y }; }
                    }
                }
                if (bestTile) out.push({ type: 'flair', x: bestTile.x, y: bestTile.y, score: 25 });
            }
        }

        if (g.unitHasWard(unit) && !unit._usedWard) {
            if (!(g.state.wards || []).some(w => w.x === unit.x && w.y === unit.y)) {
                out.push({ type: 'ward', x: unit.x, y: unit.y, score: 15 });
            }
        }
    }

    function scoreGuard(unit, v, out) {
        const g = G();
        const ap = unit.ap || 0;
        if (ap < 1) return;

        // Guard's value = a slice of the damage it will blunt. It matters
        // when we're in reach of enemies and have nothing better.
        const t = v.threatFn(unit.x, unit.y, unit.z);
        if (t.totalDmg <= 0) return;
        let score = Math.min(140, t.totalDmg * 0.18);
        // (THE JOBS REMOVAL 2026-09-27: "a Tank" is a Bulwark bearer now — the damageSoak hook)
        if ((unit.def || 0) >= 10
            || (typeof unitPassiveSum === 'function' && (unitPassiveSum(unit, 'damageSoak') || 0) > 0)) score += 20;
        if ((unit.hourglasses || 0) > 0) score += 25;
        if (v.closestEnemyDist > 5) score = Math.min(score, 8);
        /* THE FULL LIST (2026-11-01): Guard also gives a little HP + MP back now (GUARD_RESTORE), +15% counter and the
           Overwatch shot at the first enemy that stops in range; it was priced as the damage cut alone */
        if (!window.EW_AI_OLD_GUARD) {
            const gr = (typeof GUARD_RESTORE !== 'undefined') ? GUARD_RESTORE : { hpPct: 0.05, mpPct: 0.05 };
            const hpBack = Math.min(Math.round((unit.maxHp || 0) * (gr.hpPct || 0)), Math.max(0, (unit.maxHp || 0) - (unit.hp || 0)));
            if (hpBack > 0) score += healValue(g, unit, unit, hpBack, v) * 0.8;
            const mpBack = Math.min(Math.max(0, (unit.maxMp || 0) - (unit.mp || 0)), Math.round((unit.maxMp || 0) * (gr.mpPct || 0)));
            if (mpBack > 0) score += mpBack * tuneW(g, 'mpValuePerPoint') * 0.5;
            // Overwatch: an enemy that has to walk in to reach us is likely to stop inside our range
            let myR = 1;
            try { myR = g.getEffectiveRange(unit) || 1; } catch (e) {}
            const ce = v.closestEnemy;
            if (ce && v.closestEnemyDist > myR && v.closestEnemyDist <= myR + 4) score += Math.min(estDamage(g, unit, ce, null), effHp(ce)) * 0.25;
        }
        const ws = v.winState;
        if (ws.phase === 'tower_push' || ws.phase === 'numbers_advantage' || ws.enemyDeadCount >= 1) score *= 0.4;
        if (score > 0) out.push({ type: 'guard', score, _noDanger: true });
    }

    /* Arena spawn nexuses carry a `tiles` footprint instead of a square
       rect — mirror ui.js nexusZoneContains. */
    function _aiNexContains(nex, x, y, z) {
        if (!nex) return false;
        if (typeof window.nexusZoneContains === 'function') return window.nexusZoneContains(nex, x, y, z);
        if (nex.z != null && z != null && Math.abs(z - nex.z) > 1) return false;
        if (Array.isArray(nex.tiles)) return nex.tiles.some(t => t.x === x && t.y === y);
        return x >= nex.zoneX && x < nex.zoneX + nex.zoneSize &&
               y >= nex.zoneY && y < nex.zoneY + nex.zoneSize;
    }

    /* THE ZONE CLOCK (2026-10-29, the training rework): a zone pays nexusRound Arena points for EVERY round it is held
       to the buzzer (and its owner's Cube hits ×1.5, its heal, its burn), so taking it in round 3 is worth six times
       taking it in round 18. The AI priced a capture the same in every round and only added a little near the buzzer
       (backwards: the urgency term grows as the value left shrinks). This is the points the zone still pays after it is
       taken (roundsLeft − the rounds the capture takes), twice that for an enemy zone (their income stops too), split
       over the channels the capture needs (channel = true) or a share of it for walking there (channel = false).
       nexusHoldValue_v1 scales it (0 = the old flat price). */
    function _nexusHoldValue(g, unit, nex, ws, channel) {
        const w = wght(g, 'nexusHoldValue_v1', 0.5);
        if (!(w > 0) || !nex || !ws || !ws.arenaClock || !(ws.roundsRemaining > 0) || nex.owner === unit.player) return 0;
        const T = typeof NEXUS_CAPTURE_THRESHOLD !== 'undefined' ? NEXUS_CAPTURE_THRESHOLD : 4;
        const signed = unit.player === 1 ? (nex.progress || 0) : -(nex.progress || 0);
        const steps = Math.max(1, T - signed);
        const held = Math.max(0, ws.roundsRemaining - Math.ceil(steps / 2));
        const enemyOwned = !!(nex.owner && nex.owner !== unit.player);
        const pts = held * (_arenaPts().nexusRound || 6) * (enemyOwned ? 2 : 1);
        const val = pts * _ptv(g) * w;
        return channel ? val / steps : val * 0.15;
    }

    function scoreNexusChannel(unit, v, out) {
        const g = G();
        if (_failedNexus) return;
        if ((unit.ap || 0) < (typeof NEXUS_CHANNEL_COST_AP !== 'undefined' ? NEXUS_CHANNEL_COST_AP : 1)) return;
        if (!g.state.nexusPoints && !g.state.roamingNexus) return;
        const nexusPoints = g.state.nexusPoints || {};
        // Match channelNexus: roaming zones take precedence, and membership
        // includes authored footprints and storeys, not distance to a centre.
        const atUnit = typeof g.getNexusAtUnit === 'function' ? g.getNexusAtUnit(unit)
            : [ ['roaming', g.state.roamingNexus], ...Object.entries(nexusPoints) ]
                .filter(([k, n]) => _aiNexContains(n, unit.x, unit.y, unit.z))
                .map(([section, nexus]) => ({section, nexus}))[0];

        const _isAirborne = typeof g.isUnitAirborne === 'function' && g.isUnitAirborne(unit);
        if (_isAirborne) {
            const _checkNexusLand = (nex) => {
                if (!nex || !nex.zoneSize || nex.owner === unit.player) return 0;
                if (!_aiNexContains(nex, unit.x, unit.y)) return 0;
                const channelCost = typeof NEXUS_CHANNEL_COST_AP !== 'undefined' ? NEXUS_CHANNEL_COST_AP : 1;
                const landCost = g.FLYING_ALTITUDE_CONFIG?.apCost || 1;
                if ((unit.ap || 0) < landCost + channelCost) return 0;
                return AI_TUNE.landToChannelBonus;
            };
            let landScore = 0;
            for (const nexKey of Object.keys(nexusPoints)) {
                landScore = Math.max(landScore, _checkNexusLand(nexusPoints[nexKey]));
            }
            if (g.state.roamingNexus) landScore = Math.max(landScore, _checkNexusLand(g.state.roamingNexus));
            if (landScore > 0 && typeof g.canChangeAltitude === 'function') {
                const canLand = g.canChangeAltitude(unit, 'land');
                if (canLand?.ok) out.push({ type: 'altitude', mode: 'land', score: landScore });
            }
            return;
        }

        let nexKey = atUnit?.section, nex = atUnit?.nexus;
        if (!nexKey) {
            let bestDist = Infinity;
            for (const k of Object.keys(nexusPoints)) {
                const n = nexusPoints[k];
                if (!n || !n.zoneSize) continue;
                const cx = n.zoneX + Math.floor(n.zoneSize / 2);
                const cy = n.zoneY + Math.floor(n.zoneSize / 2);
                const d = Math.abs(unit.x - cx) + Math.abs(unit.y - cy);
                if (d < bestDist) { bestDist = d; nexKey = k; nex = n; }
            }
        }
        if (!nexKey || !nex) return;

        const ws = v.winState;
        const towerPushActive = (ws.phase === 'tower_push' || ws.phase === 'numbers_advantage' ||
            ws.enemyDeadCount >= 1 || ws.roundUrgency >= 2);
        /* the middle zone under a celestial event carries the event's team buff: worth channeling, never halved */
        const celestial = !!(g.state.skyEvent && typeof getCelestialNexusKey === 'function' && getCelestialNexusKey() === nexKey);
        const nexusPenalty = towerPushActive && nexKey === 'earth' && !celestial ? 0.5 : 1.0;
        const ownedCount = Object.values(nexusPoints).filter(n => n?.owner === unit.player).length;

        const inZone = !!atUnit;
        const zoneCenterX = nex.zoneX + Math.floor(nex.zoneSize / 2);
        const zoneCenterY = nex.zoneY + Math.floor(nex.zoneSize / 2);
        const distToCenter = Math.abs(unit.x - zoneCenterX) + Math.abs(unit.y - zoneCenterY);

        if (inZone && nex.owner !== unit.player) {
            if (nexKey === 'roaming') {
                let score = 190;
                const myProg = unit.player === 1 ? Math.max(0, nex.progress) : Math.max(0, -nex.progress);
                const threshold = typeof NEXUS_CAPTURE_THRESHOLD !== 'undefined' ? NEXUS_CAPTURE_THRESHOLD : 4;
                if (myProg >= threshold - 2) score += 70;
                if (v.closestEnemyDist <= 2) score -= 40;
                if (score > 0) out.push({ type: 'nexus_channel', score });
                return;
            }
            let score = wght(g, 'nexusCapBonus_v1', 39) * 5;
            const mpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
            if (mpMode && (mpMode.id === 'domination' || mpMode.id === 'arena')) score += 90;
            if (mpMode && mpMode.id === 'arena') {
                /* NEXUS REWORK (2026-09-12): no instant win any more — the
                   prize is the SPAWN LOCKOUT. We hold nothing → this tick is
                   the road back to respawning; the enemy's last zone → we
                   lock THEM out; their spawn nexus → both at once. */
                const _enemyP = unit.player === 1 ? 2 : 1;
                const _enemyOwned = Object.values(nexusPoints).filter(n => n && n.owner === _enemyP).length;
                if (ownedCount === 0) score += 200;
                if (_enemyOwned === 1 && nex.owner === _enemyP) score += 130;
                if (nex.isSpawn && nex.owner === _enemyP) score += 60;
            }
            const myProg = unit.player === 1 ? Math.max(0, nex.progress) : Math.max(0, -nex.progress);
            const threshold = typeof NEXUS_CAPTURE_THRESHOLD !== 'undefined' ? NEXUS_CAPTURE_THRESHOLD : 4;
            if (myProg >= threshold - 2) score += 60;
            if (myProg >= threshold - 1) score += 50;
            if (v.closestEnemyDist <= 2) score -= 40;
            if (ownedCount === 0) score += 40;
            score += _nexusHoldValue(g, unit, nex, ws, true);
            score += ownedCount * 20;
            if (celestial) score += 90;
            score *= nexusPenalty;
            if (score > 0) out.push({ type: 'nexus_channel', score });
        }

        if (!inZone && distToCenter <= (g.getEffectiveMove?.(unit) || unit.move || 4) + 2 && nex.owner !== unit.player
            && v.visibleEnemies.length === 0 && !_skipMove && g.canUnitMove(unit)) {
            let score = 60;
            if (ownedCount === 0) score += 25;
            score += ownedCount * 12;
            if ((unit.hourglasses || 0) > 0) score -= 30;
            score *= nexusPenalty;
            const tgtX = Math.max(nex.zoneX, Math.min(nex.zoneX + nex.zoneSize - 1, unit.x));
            const tgtY = Math.max(nex.zoneY, Math.min(nex.zoneY + nex.zoneSize - 1, unit.y));
            // Snap to an actually-reachable tile — pushing a raw clamped
            // coord doMove refuses just spins the stall counter.
            const moveTiles = _aiMoveTiles(g, unit);
            let bt = null, bd = Infinity;
            for (const t of moveTiles) {
                const d = Math.abs(t.x - tgtX) + Math.abs(t.y - tgtY);
                if (d < bd) { bd = d; bt = t; }
            }
            if (score > 0 && bt) out.push({ type: 'move', x: bt.x, y: bt.y, z: bt.z, score });
        }

    }

    function scoreRecall(unit, v, out) {
        const g = G();
        if ((unit.ap || 0) < (typeof RECALL_AP_COST !== 'undefined' ? RECALL_AP_COST : 2)) return;
        if ((unit._recallCooldown || 0) > 0) return;

        const hpPct = unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
        const mpPct = unit.maxMp > 0 ? unit.mp / unit.maxMp : 1;
        if (hpPct >= 0.4 && mpPct >= 0.3) return;
        if (typeof isInSpawnZone === 'function' && isInSpawnZone(unit.x, unit.y, unit.player)) return;
        // Recall only works while hidden from the enemy.
        if (typeof isUnitSeenByAnyEnemy === 'function' && isUnitSeenByAnyEnemy(unit)) return;

        let score = AI_TUNE.recallBonus + (1 - hpPct) * 120;
        if (mpPct < 0.2) score += 40;
        if (v.closestEnemyDist <= 2 && hpPct > 0.2) score -= 60;
        const ws = v.winState;
        if (ws.phase === 'tower_push' || ws.enemyDeadCount >= 1) score *= 0.4;
        if (score > 0) out.push({ type: 'recall', score, _noDanger: true });
    }

    /* ── BUILD action (universal place/dig verb) ──────────────────────────
       (a) pillar under self — ranged units buy high ground
       (b) dig own tile — duck out of elevated ranged fire
       (c) erupt-shove an adjacent enemy (hazard/trap landings pay)
       (d) SOFTLOCK ESCAPE — stuck in a pit: build/dig out. */
    function scoreBuild(unit, v, out) {
        const g = G();
        const ap = unit.ap || 0;

        if (g.canFly(unit)) {
            scoreAltitude(unit, v, out);
            return;
        }

        const cfg = g.BUILD_ACTION_CONFIG;
        if (!cfg || typeof g.doBuildAction !== 'function') return;
        if ((unit._buildCharges || 0) <= 0 && ap < cfg.apCost) return;
        if (typeof g._buildActionProblem === 'function' && g._buildActionProblem(unit)) return;

        const myHeight = g.getUnitStandingHeight(unit);
        const effRange = g.getEffectiveRange(unit);
        const isRanged = effRange >= 2;

        let placeTool = null;
        for (const k of Object.keys(g.BUILD_MATERIALS || {})) {
            if (g.canAffordMaterials(unit.player, { [k]: 1 })) { placeTool = k; break; }
        }

        // (a) pillar under self
        if (placeTool && !g._buildProblem(unit, placeTool, unit.x, unit.y)) {
            let raiseScore = 0;
            if (isRanged && v.visibleEnemies.length > 0) {
                let advantageGain = 0;
                for (const e of v.visibleEnemies) {
                    if (myHeight - g.getUnitStandingHeight(e) < 3) advantageGain++;
                }
                if (advantageGain > 0) raiseScore += AI_TUNE.reshapeRangedRaise + advantageGain * AI_TUNE.reshapePerEnemy;
                if ((unit.actionsThisTurn || 0) > 0) raiseScore *= 0.6;
            }
            if (v.closestEnemyDist <= 3 && v.attackTargets.length === 0) {
                raiseScore = Math.max(raiseScore, AI_TUNE.reshapeDefensive);
            }
            const ws = v.winState;
            if (ws.phase === 'tower_push' || ws.roundUrgency >= 2) raiseScore *= 0.2;
            if (raiseScore > 0) out.push({ type: 'build', tool: placeTool, x: unit.x, y: unit.y, score: raiseScore });
        }

        // (b) dig own tile
        if (!g._buildProblem(unit, 'dig', unit.x, unit.y)) {
            let elevatedRangedThreats = 0;
            for (const e of v.visibleEnemies) {
                if (g.getEffectiveRange(e) >= 2 && g.getUnitStandingHeight(e) > myHeight) elevatedRangedThreats++;
            }
            if (elevatedRangedThreats > 0) {
                out.push({ type: 'build', tool: 'dig', x: unit.x, y: unit.y, score: 10 + elevatedRangedThreats * 8 });
            }
        }

        // (c) erupt-shove
        if (placeTool) {
            for (const e of v.visibleEnemies) {
                if (Math.max(Math.abs(e.x - unit.x), Math.abs(e.y - unit.y)) > (cfg.reach || 1)) continue;
                const info = {};
                if (g._buildProblem(unit, placeTool, e.x, e.y, info)) continue;
                if (!info.shoveTo) continue;
                let sc = 35;
                const destT = g.getTerrainAt(info.shoveTo.x, info.shoveTo.y);
                if (destT === 'lava' || destT === 'deep_water' || destT === 'chasm' || destT === 'void') sc += 100;
                else if (destT === 'water' || String(destT || '').indexOf('poison') === 0) sc += 30;
                if ((g.state.traps || []).some(t => t.x === info.shoveTo.x && t.y === info.shoveTo.y && t.owner === unit.player)) sc += 70;
                out.push({ type: 'build', tool: placeTool, x: e.x, y: e.y, score: sc });
            }
        }

        // (d) softlock escape
        const stuck = v.attackTargets.length === 0
            && !!g.TargetQuery && _aiMoveTiles(g, unit).length === 0;
        if (stuck) {
            if (placeTool && !g._buildProblem(unit, placeTool, unit.x, unit.y)) {
                out.push({ type: 'build', tool: placeTool, x: unit.x, y: unit.y, score: 120 });
            } else {
                for (let dy = -1; dy <= 1; dy++) {
                    let pushed = false;
                    for (let dx = -1; dx <= 1; dx++) {
                        if (!dx && !dy) continue;
                        const nx = unit.x + dx, ny = unit.y + dy;
                        if (!g._buildProblem(unit, 'dig', nx, ny)) {
                            out.push({ type: 'build', tool: 'dig', x: nx, y: ny, score: 115 });
                            pushed = true;
                            break;
                        }
                    }
                    if (pushed) break;
                }
            }
        }
    }

    function scoreAltitude(unit, v, out) {
        const g = G();
        const ap = unit.ap || 0;
        const cfg = g.FLYING_ALTITUDE_CONFIG;
        if (!cfg || ap < cfg.apCost) return;

        const canAscend = g.canChangeAltitude(unit, 'ascend');
        const canDescend = g.canChangeAltitude(unit, 'descend');
        if (!canAscend.ok && !canDescend.ok) return;

        const myZ = unit.z ?? 0;
        const groundZ = (typeof g.getFloorBelowZ === 'function')
            ? g.getFloorBelowZ(unit.x, unit.y, myZ) : g.getHeightAt(unit.x, unit.y);
        const altAboveGround = myZ - groundZ;
        const isRanged = g.getEffectiveRange(unit) >= 2;
        const isAirborne = typeof g.isUnitAirborne === 'function' && g.isUnitAirborne(unit);

        if (canAscend.ok) {
            let ascendScore = 0;
            if (isRanged && v.visibleEnemies.length > 0) {
                let advantageGain = 0;
                for (const e of v.visibleEnemies) {
                    if (myZ - g.getUnitStandingHeight(e) < 3) advantageGain++;
                }
                if (advantageGain > 0) ascendScore += AI_TUNE.flyRangedHeightBonus + advantageGain * 10;
            }
            if (v.closestEnemyDist <= 2 && altAboveGround < 3) {
                ascendScore = Math.max(ascendScore, AI_TUNE.flyEscapeMeleeBonus);
            }
            if (!isAirborne && isRanged && v.visibleEnemies.length > 0 && v.closestEnemyDist <= 4) {
                ascendScore = Math.max(ascendScore, AI_TUNE.flyEscapeMeleeBonus * 0.7);
            }
            const ws = v.winState;
            if (ws.phase === 'tower_push' || ws.roundUrgency >= 2) ascendScore *= 0.2;
            if (ascendScore > 0) out.push({ type: 'altitude', mode: 'ascend', score: ascendScore });
        }

        if (canDescend.ok) {
            let descendScore = 0;
            if (!isRanged && v.closestEnemyDist <= 3 && isAirborne) {
                descendScore = v.closestEnemyDist <= 1 ? 60 : (v.closestEnemyDist <= 2 ? 45 : 30);
            }
            if (isAirborne && (unit.hp < unit.maxHp * 0.4) && (unit.items?.healPotion > 0)) {
                descendScore = Math.max(descendScore, 40);
            }
            if (v.visibleEnemies.length === 0 && altAboveGround > 3) {
                descendScore = Math.max(descendScore, 10);
            }
            if (isAirborne && (unit.gold || 0) >= 20) {
                const sides = g.state.sides;
                if (sides) {
                    const s = sides[unit.player];
                    if (s && unit.x === s.shopX && unit.y === s.shopY) {
                        descendScore = Math.max(descendScore, 35);
                    }
                }
            }
            if (descendScore > 0) out.push({ type: 'altitude', mode: 'land', score: descendScore });
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // TARGET PICKERS — per-kind "where do I aim this" (engine-mirroring).
    // ═════════════════════════════════════════════════════════════════════

    // Best elemental TILE target for a damage spell (HM-style casts).
    function _elementalTileFallback(unit, spell, v) {
        const g = G();
        if (typeof g._elementalTileCastInfo !== 'function') return null;
        const range = _effRange(unit, spell);
        let best = null, bestScore = 0;
        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                const d = Math.abs(dx) + Math.abs(dy);
                if (d < 1 || d > range) continue;
                const x = unit.x + dx, y = unit.y + dy;
                if (!g.isInside(x, y)) continue;
                if (g.unitAt(x, y)) continue;
                if (!spell.ignoresLineOfSight && g.isRangeBlockedByTerrain(unit.x, unit.y, x, y)) continue;
                const info = g._elementalTileCastInfo(spell, x, y);
                if (!info) continue;
                let score = 0;
                if (info.el === 'lightning' && typeof g._floodConnectedTiles === 'function'
                    && typeof g._isWaterTile === 'function' && g._isWaterTile(x, y)) {
                    const body = g._floodConnectedTiles(x, y, g._isWaterTile, 80);
                    for (const t of body) {
                        if (v.visibleEnemies.some(e => e.x === t.x && e.y === t.y)) score += 90;
                        if (v.allies.some(a => a.x === t.x && a.y === t.y)) score -= 60;
                    }
                } else if (info.el === 'fire') {
                    for (const e of v.visibleEnemies) {
                        const ed = Math.abs(e.x - x) + Math.abs(e.y - y);
                        if (ed <= 1) score += 50;
                        else if (ed <= 2) score += 20;
                    }
                }
                if (score > bestScore) { bestScore = score; best = { x, y, _elemTile: true }; }
            }
        }
        return best;
    }

    // Re-aim a line/linePush spell at CAST time (blitz targets move during
    // the telegraph; the engine fires beams along sign(target−caster)).
    // FAIR-PLAY GATE: only counts enemies the team can actually SEE.
    // Exposed on window — battle.js SimulEngine reuses it at resolution.
    function _reaimLineSpell(unit, spell, preferredTargetId) {
        const g = G();
        if (!g) return null;
        const enemies = g.getHostileUnits(unit.player).filter(e => !e.dead &&
            !(g.unitHasStatus(e, 'invisible') && !g.unitHasStatus(e, 'marked'))
            && !(typeof g.isUnitConcealedFrom === 'function' && g.isUnitConcealedFrom(e, unit.player))
            && (!(_aiVisionOn() || g.state.fogOfWar) || typeof g.isUnitSeenByTeam !== 'function'
                || g.isUnitSeenByTeam(e, unit.player)));
        const best = _bestLineAimAI(unit, spell, { visibleEnemies: enemies }, preferredTargetId);
        return best ? { x: best.target.x, y: best.target.y, z: best.target.z, hits: best.hits, score: best.score } : null;
    }
    window._aiReaimLineSpell = _reaimLineSpell;

    function _crossFootprintAI(spell, cx, cy) {
        if (typeof aoeMaskValid === 'function' && aoeMaskValid(spell.aoeMask)) return aoeMaskTiles(spell.aoeMask, cx, cy);   // THE AOE MASK (§4.7) replaces the shape
        const r = spell.crossRadius || 1;
        const tiles = [{ x: cx, y: cy }];
        if (spell.diamond) {
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    if (Math.abs(dx) + Math.abs(dy) <= r) tiles.push({ x: cx + dx, y: cy + dy });
                }
            }
        } else for (let i = 1; i <= r; i++) {
            if (spell.diagonal) {
                tiles.push({ x: cx + i, y: cy + i }, { x: cx - i, y: cy - i },
                            { x: cx + i, y: cy - i }, { x: cx - i, y: cy + i });
            } else {
                tiles.push({ x: cx + i, y: cy }, { x: cx - i, y: cy },
                            { x: cx, y: cy + i }, { x: cx, y: cy - i });
            }
        }
        return tiles;
    }

    /* THE ONE AIM RULE (2026-10-21 PvP audit #16; spellAimProblem, PR #224): a single-target pick the engine's own
       gate would refuse (range, line of sight, sight, hidden, above) is no pick — the CPU never plans a cast doSpell
       turns down. The kinds below re-derive range with _effRange, so the shared check closes the gap. */
    const _AIM_CHECKED_KINDS = new Set(['damage', 'ricochet', 'debuff', 'multiHit', 'lifeDrain', 'tackle']);
    /* THE TILE AIM (spell audit 2026-10-26): a TILE the CPU picks for a dash end, a trap or a seed must pass the same
       gate doSpell runs (range, line of sight, the team's sight) — the CPU aimed dashes and traps at tiles nobody on its
       team could see and doSpell turned them down "Out of sight". */
    function _aimOkAt(unit, spell, x, y) {
        if (typeof window.spellAimProblem !== 'function') return true;
        try { return window.spellAimProblem(unit, spell, x, y) === null; } catch (e) { return true; }
    }
    function findSpellTarget(unit, spell, v) {
        const t = _findSpellTargetRaw(unit, spell, v);
        if (t && t !== unit && t.id != null && spell && _AIM_CHECKED_KINDS.has(spell.kind)
            && typeof window.spellAimProblem === 'function') {
            try { if (window.spellAimProblem(unit, spell, t.x, t.y, t.z) !== null) return null; } catch (e) {}
        }
        return t;
    }
    /* 🔍 FAR SIGHT (THE SPELL POWER REVIEW, 2026-10-23): remoteView + `inspectAt` is a ranged Inspect. The tile in range
       whose footprint holds a seen loose Key wins (priced like scoreInspect's pickup); otherwise the unsearched tile the
       unit's own Inspect can't reach, leaning to the board centre. Worth nothing once every Key is carried. */
    function _aiFarSightPick(unit, spell, v) {
        const g = G();
        if (typeof g.getInspectFootprint !== 'function') return null;
        const loose = (g.state.hourglasses || []).filter(h => h.carriedBy === null);
        if (!loose.length) return null;
        const range = (typeof g.getEffectiveSpellRange === 'function' ? g.getEffectiveSpellRange(unit, spell) : spell.range) || 4;
        const seen = loose.filter(h => h.visibleTo && h.visibleTo[unit.player]);
        const ownReach = (typeof getEffectiveInspect === 'function') ? getEffectiveInspect(unit) : 1;
        const scanned = _aiSearched(g.state, unit.player);
        const cx = Math.floor(g.bw() / 2), cy = Math.floor(g.bh() / 2);
        const fight = !!(v && v.visibleEnemies && v.visibleEnemies.length);
        // THE SEARCH MAP (the Tactics pass): a blind Far Sight is aimed and priced by the Keys it is expected to find
        const sm = window.EW_AI_NO_SEARCHMAP ? null : _searchMapFor(g, unit, unit.player);
        let best = null;
        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                const x = unit.x + dx, y = unit.y + dy;
                if (x < 0 || y < 0 || x >= g.bw() || y >= g.bh()) continue;
                const d = Math.max(Math.abs(dx), Math.abs(dy));
                const fp = g.getInspectFootprint(unit, x, y);
                const keys = seen.filter(h => fp.some(p => p.x === h.x && p.y === h.y)).length;
                let s;
                if (keys) s = _keySense() ? Math.max(keys * _keyFloor(g), _keyWorth(g, unit.player, keys, v)) : keys * 180;
                else {
                    if (d <= ownReach || seen.length === loose.length) continue;   // a plain Inspect reaches it for free
                    const fresh = fp.filter(p => !scanned.has(g.scanKey(p.x, p.y))).length;
                    s = (sm && sm.hidden > 0) ? 10 + _footprintEV(g, unit, sm, x, y) * wght(g, 'searchKeyValue_v1', 285) * 0.9
                        : 10 + fresh * 2 + (loose.length - seen.length) * 6 - (Math.abs(x - cx) + Math.abs(y - cy));
                    if (fight) s *= 0.4;
                }
                if (!best || s > best.score) best = { x, y, score: s };
            }
        }
        return best && best.score > 0 ? best : null;
    }

    function _findSpellTargetRaw(unit, spell, v) {
        const g = G();
        const kind = spell.kind;

        if (kind === 'trickRoom') return unit;

        // THE TARGETING RIDERS (Phase 3): a random-target row is cast on the caster once a victim is in reach
        if (kind === 'damage' && _riderRandomOf(spell)) return _riderEnemiesInReach(g, unit, spell, v).length ? unit : null;

        if (kind === 'guard') {
            let best = null, bestValue = 0;
            for (const entry of g.TargetQuery.spellTargets?.(unit, spell) || []) {
                const target = entry.unit;
                const value = _chivalryScore(unit, spell, target, v);
                if (value > bestValue) { best = target; bestValue = value; }
            }
            return best;
        }

        // Lattice spells affect the player's network, but both executors
        // still need a concrete self-cast target (including elevation).
        if (kind === 'pulseLattice' || kind === 'tuneFrequency') return unit;

        if (['damage', 'ricochet', 'debuff', 'multiHit', 'lifeDrain', 'tackle'].includes(kind)) {
            const R = _effRange(unit, spell);
            const longR = _isLongRange(spell);
            const srcZ = standH(g, unit);
            let inRange = v.visibleEnemies
                .filter(e => !isProtected(g, e))
                .map(e => ({
                    enemy: e,
                    dist: _reach(g, unit.x, unit.y, srcZ, e, longR),
                    priority: getTargetPriority(e, unit, v)
                }))
                .filter(e => e.dist >= 1 && e.dist <= R
                    && (spell.ignoresLineOfSight || !g.isRangeBlockedByTerrain(unit.x, unit.y, e.enemy.x, e.enemy.y)));
            // Debuffs: prefer targets still missing at least one rider status.
            if (kind === 'debuff' && (spell.statusEffects || []).length) {
                const fresh = inRange.filter(e =>
                    (spell.statusEffects || []).some(f => f && f.id && !g.unitHasStatus(e.enemy, f.id)));
                if (fresh.length) inRange = fresh;
            }
            // Elemental tile fallback: no enemy in direct range, but a
            // reactive tile might still reach one.
            if (!inRange.length) return kind === 'damage' ? _elementalTileFallback(unit, spell, v) : null;
            /* THE STATUS COMBOS (2026-11-01): a finisher aims at the enemy that already carries its status (a teammate,
               or this unit, set it up) — worth the extra damage its HP bar can take, plus the combo press. */
            if (spell.bonusVsStatus && _aiDiff().combos && !window.EW_AI_NO_STATUS_COMBOS) {
                const m = spell.bonusVsStatus.mult || 1.5;
                for (const e of inRange) {
                    if (!_bonusVsMatches(e.enemy, spell.bonusVsStatus)) continue;
                    const est = estDamage(g, unit, e.enemy, spell);
                    e.priority += Math.min(est, effHp(e.enemy)) * (1 - 1 / m) + 40;
                }
            }

            // THE SPLASH RIDER (Phase 3): the victim whose neighbourhood is worth the most (a kill still counts first)
            if (kind === 'damage' && _riderSplashOf(spell)) {
                const worth = e => e.priority + _splashBonus(g, unit, spell, e.enemy, v)
                    + (estDamage(g, unit, e.enemy, spell) >= effHp(e.enemy) ? 60 : 0);
                inRange.sort((a, b) => worth(b) - worth(a));
                return inRange[0].enemy;
            }
            if (['damage', 'ricochet', 'multiHit', 'lifeDrain', 'tackle'].includes(kind)) {
                const killable = inRange.filter(e => estDamage(g, unit, e.enemy, spell) >= effHp(e.enemy));
                if (killable.length > 0) {
                    killable.sort((a, b) => b.priority - a.priority);
                    return killable[0].enemy;
                }
            }
            inRange.sort((a, b) => b.priority - a.priority);
            return inRange[0].enemy;
        }

        if (['skyDrop', 'skyThrow', 'skySlam', 'leapStrike'].includes(kind)) {
            const R = _effRange(unit, spell) || (kind === 'leapStrike' ? 2 : 1);
            const myH = standH(g, unit);
            const inRange = v.visibleEnemies
                .filter(e => !isProtected(g, e))
                .filter(e => {
                    const d = Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y);
                    if (d < 1 || d > R) return false;
                    if (kind === 'leapStrike' && myH <= standH(g, e)) return false;
                    return true;
                })
                .sort((a, b) => getTargetPriority(b, unit, v) - getTargetPriority(a, unit, v));
            return inRange[0] || null;
        }

        if (kind === 'aoe') {
            if (spell.aoeOriginSelf) {
                const area = getSpellAoeAreaAI(spell, unit.x, unit.y);
                const hits = area.filter(t => v.visibleEnemies.some(en => en.x === t.x && en.y === t.y)).length;
                return hits > 0 ? { x: unit.x, y: unit.y } : null;
            }
            // Ring-shaped AOEs spare their CENTER — aim at a cast-center TILE.
            if (spell.aoeShape === 'ring') {
                const rng = _effRange(unit, spell);
                let bestT = null, bestTS = 0;
                for (let dy = -rng; dy <= rng; dy++) {
                    for (let dx = -rng; dx <= rng; dx++) {
                        const cx = unit.x + dx, cy = unit.y + dy;
                        if (Math.abs(dx) + Math.abs(dy) > rng) continue;
                        if (cx < 0 || cy < 0 || cx >= g.bw() || cy >= g.bh()) continue;
                        if (!spell.ignoresLineOfSight && g.isRangeBlockedByTerrain(unit.x, unit.y, cx, cy)) continue;
                        const area = getSpellAoeAreaAI(spell, cx, cy);
                        const hits = area.filter(t => v.visibleEnemies.some(en => en.x === t.x && en.y === t.y)).length;
                        const score = hits * 10;
                        if (score > bestTS) { bestTS = score; bestT = { x: cx, y: cy }; }
                    }
                }
                return bestT;
            }
            let best = null, bestScore = 0;
            for (const e of v.visibleEnemies) {
                const d = _dist(g, unit.x, unit.y, unit.z, e);
                if (d < 1 || d > _effRange(unit, spell)) continue;
                if (!spell.ignoresLineOfSight && g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y)) continue;
                const area = getSpellAoeAreaAI(spell, e.x, e.y);
                const hits = area.filter(t => v.visibleEnemies.some(en => en.x === t.x && en.y === t.y)).length;
                const score = hits * 10 + getTargetPriority(e, unit, v) * 0.05;
                if (score > bestScore) { bestScore = score; best = e; }
            }
            return best;
        }

        if (kind === 'deployTurret') {
            // Turrets are stamped with casterUnitId (battle.js doSpell) — the
            // old ownerUnitId read always counted 0, so the AI never saw its
            // own cap and re-deployed every turn, dismantling its own turrets.
            const active = (g.state.turrets || []).filter(t => t.casterUnitId === unit.id && t.spellId === spell.id && !t.summon && !t.zombie).length;   // the cap is per spell (battle.js deployTurret)
            if (active >= (spell.maxActivePerCaster || 2)) return null;
            const R = _effRange(unit, spell) || 2;
            let bestTile = null, bestScore = -1;
            for (let dy = -R; dy <= R; dy++) {
                for (let dx = -R; dx <= R; dx++) {
                    const tx = unit.x + dx, ty = unit.y + dy;
                    const d = Math.abs(dx) + Math.abs(dy);
                    if (d < 1 || d > R) continue;
                    if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) continue;
                    const terrain = g.getTerrainAt(tx, ty);
                    const rule = g.getTerrainRule(terrain);
                    if (rule.impassable || terrain === 'mountain' || terrain === 'lava') continue;
                    if (g.state.units.some(u => !u.dead && u.x === tx && u.y === ty)) continue;
                    if ((g.state.turrets || []).some(t => t.x === tx && t.y === ty)) continue;
                    let score = 10;
                    const tRange = spell.turretRange || 2;
                    for (const e of v.visibleEnemies) {
                        const eDist = Math.abs(e.x - tx) + Math.abs(e.y - ty);
                        if (eDist <= tRange) score += 15;
                        else if (eDist <= tRange + 2) score += 5;
                    }
                    if (v.enemyTower && v.enemyTower.hp > 0) {
                        const tDist = Math.abs(v.enemyTower.x - tx) + Math.abs(v.enemyTower.y - ty);
                        if (tDist <= tRange) score += 20;
                    }
                    if (score > bestScore) { bestScore = score; bestTile = { x: tx, y: ty }; }
                }
            }
            return bestTile;
        }

        /* 🚪 THE STANDING DOORS: the best legal tile (the facing is the engine's own for a CPU seat) */
        if (kind === 'doorDeploy') {
            const pick = (typeof window !== 'undefined' && typeof window.doorGunAiPick === 'function') ? window.doorGunAiPick(unit, spell) : null;
            return pick ? { x: pick.x, y: pick.y, _gunDoorScore: pick.score } : null;
        }

        /* ═══ THE DOOR AGENT (DOOR_RACE_DESIGN.md §7, 2026-09-14) ═══════════ */
        if (kind === 'door') {
            /* a toggle first: a friendly OPEN door with an enemy beside it and
               no ally → shut it; else place a pair: A beside the agent, B up
               to 3 tiles out toward the nearest enemy (or the Cube) */
            const doors = (g.state.doors || []).filter(d => d.owner === unit.player && d.hp > 0 && !d.fixed);
            const tr = spell.doorToggleRange || 4;
            for (const d of doors) {
                if (Math.abs(d.x - unit.x) + Math.abs(d.y - unit.y) > tr) continue;
                const eb = v.visibleEnemies.some(e => Math.max(Math.abs(e.x - d.x), Math.abs(e.y - d.y)) <= 1);
                const ab = v.allies.some(a => Math.max(Math.abs(a.x - d.x), Math.abs(a.y - d.y)) <= 1);
                if (d.open && eb && !ab) { delete unit._aiDoorA; return { x: d.x, y: d.y }; }
            }
            if (doors.some(d => d.ownerId === unit.id)) return null;
            const free = (typeof g.doorTileFree === 'function') ? g.doorTileFree : null;
            if (!free) return null;
            /* ONE CLICK (2026-09-19): the AI picks the FAR tile only — up to
               spell.range out toward the nearest enemy (or the Cube), never
               under their feet; the engine stands the near door beside the
               agent (_doorNearSpot) */
            if (typeof g._doorNearSpot === 'function' && !g._doorNearSpot(unit, null)) return null;
            const goal = v.visibleEnemies.length
                ? v.visibleEnemies.reduce((b, e) => (Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y)) < (Math.abs(b.x - unit.x) + Math.abs(b.y - unit.y)) ? e : b)
                : (v.enemyTower && v.enemyTower.hp > 0 ? v.enemyTower : null);
            if (!goal) return null;
            const R = _effRange(unit, spell) || 4;
            let B = null, bBest = 1e9;
            for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
                if (Math.abs(dx) + Math.abs(dy) > R || (!dx && !dy)) continue;
                const bx = unit.x + dx, by = unit.y + dy;
                if (Math.abs(dx) + Math.abs(dy) < 2) continue;   // the far door is the FAR one
                if (!free(bx, by)) continue;
                const dg = Math.abs(bx - goal.x) + Math.abs(by - goal.y);
                if (dg < 2) continue;   // not under their feet
                if (dg < bBest) { bBest = dg; B = { x: bx, y: by }; }
            }
            return B;
        }
        if (kind === 'doorBreach' || kind === 'doorTrap') {
            const inReach = v.visibleEnemies.filter(e => {
                const d = _dist(g, unit.x, unit.y, unit.z, e);
                return d >= 1 && d <= (_effRange(unit, spell) || 4) && !isProtected(g, e)
                    && !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y);
            });
            inReach.sort((a, b) => getTargetPriority(b, unit, v) - getTargetPriority(a, unit, v));
            return inReach[0] || null;
        }
        if (kind === 'doorDelivery' || kind === 'doorExit') {
            const origin = (typeof g._doorOriginForSpell === 'function') ? g._doorOriginForSpell : null;
            if (!origin) return null;
            const ok = v.visibleEnemies.filter(e => !isProtected(g, e) && !!origin(unit, spell, e.x, e.y));
            ok.sort((a, b) => getTargetPriority(b, unit, v) - getTargetPriority(a, unit, v));
            return ok[0] || null;
        }
        if (kind === 'doorSlam') {
            const doors = (g.state.doors || []).filter(d => d.owner === unit.player && d.hp > 0 && !d.fixed
                && Math.abs(d.x - unit.x) + Math.abs(d.y - unit.y) <= (_effRange(unit, spell) || 4));
            let best = null, bestN = 0;
            for (const d of doors) {
                const tw = (typeof g.doorTwin === 'function') ? g.doorTwin(d) : null;
                if (!tw) continue;
                const n = v.visibleEnemies.filter(e => Math.max(Math.abs(e.x - tw.x), Math.abs(e.y - tw.y)) <= 1).length
                    - v.allies.filter(a => a.id !== unit.id && Math.max(Math.abs(a.x - tw.x), Math.abs(a.y - tw.y)) <= 1).length * 0.5;
                if (n > bestN) { bestN = n; best = { x: d.x, y: d.y }; }
            }
            return best;
        }

        /* Phase 6: `steal` — an enemy in reach, Key carriers first. */
        if (kind === 'steal') {
            const inReach = v.visibleEnemies.filter(e => {
                const d = _dist(g, unit.x, unit.y, unit.z, e);
                return d >= 1 && d <= (_effRange(unit, spell) || 1) && !isProtected(g, e)
                    && !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y);
            });
            inReach.sort((a, b) => {
                const aHG = (a.hourglasses || 0) > 0 ? 100 : 0;
                const bHG = (b.hourglasses || 0) > 0 ? 100 : 0;
                const aIt = a.items && Object.keys(a.items).some(k => a.items[k] > 0) ? 30 : 0;
                const bIt = b.items && Object.keys(b.items).some(k => b.items[k] > 0) ? 30 : 0;
                return (bHG + bIt + getTargetPriority(b, unit, v)) - (aHG + aIt + getTargetPriority(a, unit, v));
            });
            return inReach[0] || null;
        }
        /* Phase 6: `cleanseArea` — the 3×3 in range that lifts the most
           ally debuffs / strips the most enemy buffs; returns the tile. */
        if (kind === 'cleanseArea') {
            const defs = (typeof STATUS_DEFS !== 'undefined') ? STATUS_DEFS : (g.STATUS_DEFS || {});
            const R = _effRange(unit, spell) || 3;
            const countOf = (u, want) => {
                if (!u.status) return 0;
                let n = 0;
                for (const key of Object.keys(u.status)) if (u.status[key] > 0 && defs[key] && defs[key].kind === want) n++;
                return n;
            };
            const centres = [unit, ...v.allies].filter(a => !a.dead && countOf(a, 'debuff') > 0)
                .concat(v.visibleEnemies.filter(e => countOf(e, 'buff') > 0));
            let best = null, bestScore = 0;
            for (const c of centres) {
                if (Math.abs(c.x - unit.x) + Math.abs(c.y - unit.y) > R) continue;
                const area = _aoeTilesAI(spell, c.x, c.y, spell.aoeRadius || 1);
                let score = 0;
                for (const a of [unit, ...v.allies]) if (!a.dead && area.some(t => t.x === a.x && t.y === a.y)) score += countOf(a, 'debuff') * 2;
                for (const e of v.visibleEnemies) if (area.some(t => t.x === e.x && t.y === e.y)) score += countOf(e, 'buff');
                if (score > bestScore) { bestScore = score; best = { x: c.x, y: c.y }; }
            }
            return best;
        }

        if (kind === 'utility') {
            const sid = spell.id;
            if ((sid === 'grapple' || sid === 'raceGrapple') && spell.selfPullOnly) {   // Batch D: an ally to reel to
                const R = _effRange(unit, spell) || 3;
                const ce = v.closestEnemy;
                if (!ce) return null;
                const mates = (v.allies || []).filter(a => !a.dead && a.id !== unit.id
                    && Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) >= 2 && Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= R
                    && (typeof window.grappleLandingFor !== 'function' || !!window.grappleLandingFor(unit, a.x, a.y, { viewer: unit.player })))   // the rope gets there
                    .sort((a, b) => (Math.abs(a.x - ce.x) + Math.abs(a.y - ce.y)) - (Math.abs(b.x - ce.x) + Math.abs(b.y - ce.y)));
                return mates[0] || null;
            }
            if (sid === 'grapple' || sid === 'raceGrapple') {
                const inRange = v.visibleEnemies
                    .filter(e => {
                        const d = _dist(g, unit.x, unit.y, unit.z, e);
                        return d >= 2 && d <= (_effRange(unit, spell) || 3);
                    })
                    .sort((a, b) => getTargetPriority(b, unit, v) - getTargetPriority(a, unit, v));
                return inRange[0] || null;
            }
            if (sid === 'plunder' || sid === 'racePlunder') {
                const adjacent = v.visibleEnemies.filter(e => {
                    const d = _dist(g, unit.x, unit.y, unit.z, e);
                    return d >= 1 && d <= (_effRange(unit, spell) || 1);
                });
                adjacent.sort((a, b) => {
                    const aHG = (a.hourglasses || 0) > 0 ? 100 : 0;
                    const bHG = (b.hourglasses || 0) > 0 ? 100 : 0;
                    return (bHG + (b.gold || 0)) - (aHG + (a.gold || 0));
                });
                return adjacent[0] || null;
            }
            if (sid === 'mimic') {
                const lastSpell = g.state.lastSpellCast;
                if (!lastSpell || !lastSpell.spellId) return null;
                return { x: unit.x, y: unit.y };
            }
            return null;
        }

        if (kind === 'heal') {
            const targets = [unit, ...v.allies]
                .filter(a => !a.dead && a.hp < a.maxHp * 0.9)
                .filter(a => {
                    const d = Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y);
                    return d >= 0 && d <= _effRange(unit, spell);
                });
            targets.sort((a, b) => {
                const aHG = (a.hourglasses || 0) > 0 ? 1 : 0;
                const bHG = (b.hourglasses || 0) > 0 ? 1 : 0;
                if (aHG !== bHG) return bHG - aHG;
                return (a.hp / a.maxHp) - (b.hp / b.maxHp);
            });
            return targets[0] || null;
        }

        if (kind === 'revive') {
            if (g._isFFA()) return null;
            const dead = g.state.units.filter(u => u.player === unit.player && u.dead)
                .filter(d => {
                    const dist = Math.abs(d.x - unit.x) + Math.abs(d.y - unit.y);
                    return dist >= 0 && dist <= _effRange(unit, spell);
                });
            return dead[0] || null;
        }

        // ── CHAMP_REWORK Phase 5 wave B: control + links ──
        if (kind === 'possess' || kind === 'shadowRealm') {
            const R = _effRange(unit, spell);
            const longR = _isLongRange(spell);
            const srcZ = standH(g, unit);
            const inRange = v.visibleEnemies
                .filter(e => !isProtected(g, e) && !e._isBoss
                    && !g.unitHasStatus(e, 'possessed') && !g.unitHasStatus(e, 'infected')
                    && !g.unitHasStatus(e, 'shadowRealm'))
                .filter(e => {
                    const d = _reach(g, unit.x, unit.y, srcZ, e, longR);
                    return d >= 1 && d <= R && (spell.ignoresLineOfSight || !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y));
                })
                .sort((a, b) => (unitThreatOutput(g, b, unit) + getTargetPriority(b, unit, v))
                              - (unitThreatOutput(g, a, unit) + getTargetPriority(a, unit, v)));
            return inRange[0] || null;
        }
        if (kind === 'link') {
            const R = _effRange(unit, spell);
            const longR = _isLongRange(spell);
            const srcZ = standH(g, unit);
            const reach = e => {
                const d = _reach(g, unit.x, unit.y, srcZ, e, longR);
                return d >= 1 && d <= R && (spell.ignoresLineOfSight || !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y));
            };
            const sid = ((spell.statusEffects || [])[0] || {}).id;
            const enemies = v.visibleEnemies.filter(e => !isProtected(g, e) && reach(e) && !(sid && g.unitHasStatus(e, sid)));
            delete _aiPairPick[spell.id];
            if (!enemies.length) return null;
            if (spell.linkTargets === 'enemy-ally') {
                // The doll's ally = the one enemies can reach most easily.
                /* "one of your allies": the caster is not one (doSpell refused the CPU's self pick "out of range") */
                const allies = v.allies.filter(a => !a.dead && a.id !== unit.id && (() => {
                    const d = _reach(g, unit.x, unit.y, srcZ, a, longR); return d >= 1 && d <= R; })());
                if (!allies.length) return null;
                const exposure = a => v.visibleEnemies.reduce((m, e) => Math.min(m, Math.abs(e.x - a.x) + Math.abs(e.y - a.y)), 99);
                allies.sort((a, b) => exposure(a) - exposure(b));
                enemies.sort((a, b) => getTargetPriority(b, unit, v) - getTargetPriority(a, unit, v));
                _aiPairPick[spell.id] = allies[0];
                return enemies[0];
            }
            // Pairs: the two enemies (within pairRange of each other) worth the most.
            let best = null, bestS = -1;
            for (const a of enemies) {
                for (const b of enemies) {
                    if (a.id === b.id) continue;
                    if (spell.pairRange && Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > spell.pairRange) continue;
                    const sc = getTargetPriority(a, unit, v) + getTargetPriority(b, unit, v);
                    if (sc > bestS) { bestS = sc; best = [a, b]; }
                }
            }
            if (!best) return null;
            _aiPairPick[spell.id] = best[1];
            return best[0];
        }
        if (kind === 'transfer') {
            const R = _effRange(unit, spell);
            const longR = _isLongRange(spell);
            const srcZ = standH(g, unit);
            const allies = [unit, ...v.allies].filter(a => !a.dead && _reach(g, unit.x, unit.y, srcZ, a, longR) <= R);
            delete _aiPairPick[spell.id];
            if (allies.length < 2) return null;
            const frac = a => a.hp / (a.maxHp || 1);
            const byNeed = allies.slice().sort((a, b) => frac(a) - frac(b));
            const receiver = byNeed[0];
            if (frac(receiver) > 0.6) return null;
            const giver = byNeed.slice().reverse().find(a => a.id !== receiver.id && frac(a) >= 0.6);
            if (!giver) return null;
            _aiPairPick[spell.id] = receiver;
            return giver;
        }
        if (kind === 'cannibalize') {
            if ((unit.hp / (unit.maxHp || 1)) > 0.7) return null;
            // THE ENEMY REMAINS (playtest 2026-11-07 H6): only an enemy's remains — never its own team's graves (the cast's own gate)
            const _cbOk = (typeof spellCorpseUsable === 'function') ? (d => spellCorpseUsable(unit, spell, d))
                : (d => d.dead && !d._corpseConsumed && d.player !== unit.player);
            // THE GRAVES STAY: the still-dead bodies and the graves respawned units left (battle.js corpseRemainsBodies)
            const _cbPool = (typeof corpseRemainsBodies === 'function') ? corpseRemainsBodies() : g.state.units;
            const remains = _cbPool.filter(_cbOk)
                .filter(d => Math.abs(d.x - unit.x) + Math.abs(d.y - unit.y) <= _effRange(unit, spell))
                .sort((a, b) => (Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y))
                              - (Math.abs(b.x - unit.x) + Math.abs(b.y - unit.y)));
            return remains[0] || null;
        }

        if (kind === 'summonUnit') {
            // wave C: the free adjacent tile nearest the closest visible enemy.
            const _smActive = (g.state.turrets || []).filter(t => t.summon && t.hp > 0 && t.casterUnitId === unit.id && t.spellId === spell.id).length;
            if (_smActive >= (spell.maxActivePerCaster || 1)) return null;
            const R = _effRange(unit, spell) || 1;
            let bestTile = null, bestD = Infinity;
            for (let dy = -R; dy <= R; dy++) {
                for (let dx = -R; dx <= R; dx++) {
                    const d = Math.abs(dx) + Math.abs(dy);
                    if (d < 1 || d > R) continue;
                    const tx = unit.x + dx, ty = unit.y + dy;
                    if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) continue;
                    if (typeof g.isTerrainPassable === 'function' && !g.isTerrainPassable(tx, ty)) continue;
                    if (g.unitAt(tx, ty)) continue;
                    if ((g.state.turrets || []).some(t => t.hp > 0 && t.x === tx && t.y === ty)) continue;
                    let nd = Infinity;
                    for (const e of v.visibleEnemies) nd = Math.min(nd, Math.abs(e.x - tx) + Math.abs(e.y - ty));
                    if (nd < bestD) { bestD = nd; bestTile = { x: tx, y: ty }; }
                }
            }
            return bestTile;
        }

        if (kind === 'raiseDead') {
            // THE GRAVES STAY: left graves too; the cast's own gate (spellCorpseUsable: a covered square can't be raised)
            const _rdPool = (typeof corpseRemainsBodies === 'function') ? corpseRemainsBodies() : g.state.units;
            const _rdOk = (typeof spellCorpseUsable === 'function') ? (d => spellCorpseUsable(unit, spell, d))
                : (d => d.dead && !d._corpseConsumed);
            const remains = _rdPool.filter(_rdOk)
                .filter(d => Math.abs(d.x - unit.x) + Math.abs(d.y - unit.y) <= _effRange(unit, spell))
                .sort((a, b) => (Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y))
                              - (Math.abs(b.x - unit.x) + Math.abs(b.y - unit.y)));
            return remains[0] || null;
        }

        if (kind === 'rallyPull') return { x: unit.x, y: unit.y };

        if (['seedHeal', 'seedPoison', 'leechSeed'].includes(kind)) {
            /* THE SEED AIM (spell audit 2026-10-26): the CPU planted on its OWN tile, and the grown tree shoved it off.
               Now a tile in range the cast accepts: under a hurt ally (Healing Seed heals it at once) or an enemy (Poison
               / Leech Seed bite at once), else the free tile with the most of them beside it (the tree's reach), leaning
               toward the nearest of them. */
            const _stype = kind === 'seedHeal' ? 'heal' : kind === 'seedPoison' ? 'poison' : 'leech';
            const friendly = kind === 'seedHeal';
            const pool = friendly ? [unit, ...v.allies].filter(a => !a.dead && !a._dying) : (v.visibleEnemies || []);
            const R = _effRange(unit, spell) || 3;
            let best = null, bestS = 0;
            for (let dy = -R; dy <= R; dy++) {
                for (let dx = -R; dx <= R; dx++) {
                    const d = Math.abs(dx) + Math.abs(dy);
                    if (d < 1 || d > R) continue;
                    const tx = unit.x + dx, ty = unit.y + dy;
                    if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) continue;
                    const terrain = g.getTerrainAt(tx, ty);
                    if (terrain === 'mountain' || terrain === 'lava') continue;
                    if (typeof g.isTerrainPassable === 'function' && !g.isTerrainPassable(tx, ty)) continue;
                    if (g.state.plantedSeeds?.some(s2 => s2.x === tx && s2.y === ty && s2.type === _stype)) continue;
                    if (g.state.plantedTrees?.some(t2 => t2.x === tx && t2.y === ty)) continue;
                    let sc = 1;
                    const occ = g.unitAt(tx, ty);
                    if (occ && !occ.dead) {
                        const foe = g.isEnemyUnit(occ, unit);
                        if (friendly ? (foe || occ.hp >= occ.maxHp) : !(foe && pool.includes(occ))) continue;
                        sc += friendly ? 20 + 20 * (1 - occ.hp / Math.max(1, occ.maxHp)) : 20;
                    }
                    let near = 99;
                    for (const p of pool) {
                        if (p.x === tx && p.y === ty) continue;
                        const pd = Math.max(Math.abs(p.x - tx), Math.abs(p.y - ty));
                        if (pd <= 1) sc += 6;
                        near = Math.min(near, pd);
                    }
                    sc += Math.max(0, 10 - near) * 0.2;
                    if (sc <= bestS || !_aimOkAt(unit, spell, tx, ty)) continue;
                    bestS = sc; best = { x: tx, y: ty };
                }
            }
            return best;
        }

        if (kind === 'buff' || kind === 'shield') {
            const targets = [unit, ...v.allies]
                .filter(a => !a.dead)
                .filter(a => Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= _effRange(unit, spell));
            if (kind === 'buff') {
                const unbuffed = targets.filter(a => !g.unitHasStatus(a, 'protect'));
                // Stat-aware buffing: an INT buff belongs on a caster, an ATK
                // buff on the biggest hitter.
                const boost = spell.statStageBoost || {};
                const fit = a => {
                    let sc = 0;
                    if (boost.int) sc += (a.intStat || 0) * 2 + (unitIsHealerKit(a) || (a.intStat || 0) > (a.atk || 0) ? 80 : 0);
                    if (boost.atk) sc += (a.atk || 0) * 1.5 + (g.getEffectiveRange(a) <= 1 ? 20 : 0);
                    if (!boost.int && !boost.atk) sc += (1 - a.hp / a.maxHp) * 100;
                    if ((a.hourglasses || 0) > 0) sc += 40;
                    if (a.id === unit.id) sc -= 10;
                    return sc;
                };
                return unbuffed.sort((a, b) => fit(b) - fit(a))[0] || null;
            }
            return targets.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0] || null;
        }

        if (kind === 'bomb' || kind === 'warpRune') {
            const R = _effRange(unit, spell);
            const inRange = v.visibleEnemies.filter(e => {
                const d = _dist(g, unit.x, unit.y, unit.z, e);
                return d >= 1 && d <= R && (spell.ignoresLineOfSight || !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y));
            });
            return inRange.sort((a, b) => getTargetPriority(b, unit, v) - getTargetPriority(a, unit, v))[0] || null;
        }

        if (kind === 'placeTrap' && !window.EW_AI_NO_TRAP_PLAN) {
            // THE TRAP PLAN: the square in reach the enemies' predicted walks cross most, weighed by the hit
            const R = _effRange(unit, spell) || 2;
            let bestTile = null, bestScore = 0;
            for (let dy = -R; dy <= R; dy++) {
                for (let dx = -R; dx <= R; dx++) {
                    const d = Math.abs(dx) + Math.abs(dy);
                    if (d < 1 || d > R) continue;
                    const tx = unit.x + dx, ty = unit.y + dy;
                    if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) continue;
                    const sc = _trapPlacementValue(g, unit, spell, tx, ty, v);
                    if (sc > bestScore && _aimOkAt(unit, spell, tx, ty)) { bestScore = sc; bestTile = { x: tx, y: ty }; }
                }
            }
            return bestTile;
        }
        if (kind === 'placeTrap') {
            const R = _effRange(unit, spell) || 2;
            let bestTile = null, bestScore = 0;
            for (let dy = -R; dy <= R; dy++) {
                for (let dx = -R; dx <= R; dx++) {
                    const d = Math.abs(dx) + Math.abs(dy);
                    if (d < 1 || d > R) continue;
                    const tx = unit.x + dx, ty = unit.y + dy;
                    if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) continue;
                    /* a 2×2 / 3×3 trap (Trapdoor, Deathtrap) needs EVERY tile of its footprint free — doSpell's
                       _trapFootprint (spell audit 2026-10-26: the CPU judged only the anchor tile, and the cast refused) */
                    const _tsz = spell.trapSize || 1;
                    let _fpTiles = [{ x: tx, y: ty }];
                    if (_tsz > 1 && typeof g._trapFootprint === 'function') {
                        const _fp = g._trapFootprint(tx, ty, _tsz);
                        if (!_fp || _fp.problem) continue;
                        _fpTiles = _fp.tiles;
                    } else if (typeof g._placeTrapProblem === 'function'
                        ? g._placeTrapProblem(tx, ty) : g.unitAt(tx, ty)) continue;
                    let score = 0;
                    for (const e of v.visibleEnemies) {
                        const eDist = _fpTiles.reduce((m, t) => Math.min(m, Math.abs(e.x - t.x) + Math.abs(e.y - t.y)), 99);
                        if (eDist <= 1) score += 12;
                        else if (eDist <= 3) score += 4;
                    }
                    if (score > bestScore && _aimOkAt(unit, spell, tx, ty)) { bestScore = score; bestTile = { x: tx, y: ty }; }
                }
            }
            return bestTile;
        }

        if (kind === 'placeMirror') {
            const R = _effRange(unit, spell) || 4;
            const owned = (g.state.mirrors || []).filter(m => m.ownerUnitId === unit.id && m.hp > 0);
            let bestTile = null, bestScore = -1;
            for (let dy = -R; dy <= R; dy++) {
                for (let dx = -R; dx <= R; dx++) {
                    const d = Math.abs(dx) + Math.abs(dy);
                    if (d < 1 || d > R) continue;
                    const tx = unit.x + dx, ty = unit.y + dy;
                    if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) continue;
                    if (g.unitAt(tx, ty)) continue;
                    if ((g.state.mirrors || []).some(m => m.x === tx && m.y === ty)) continue;
                    if (typeof g.isTerrainPassable === 'function' && !g.isTerrainPassable(tx, ty)) continue;
                    let score = 1;
                    const aligns = owned.some(m => m.x === tx || m.y === ty);
                    if (aligns) score += 14;
                    for (const e of v.visibleEnemies) {
                        const eDist = Math.abs(e.x - tx) + Math.abs(e.y - ty);
                        if (eDist <= 2) score += 8; else if (eDist <= 4) score += 3;
                        if (aligns && (e.x === tx || e.y === ty)) score += 6;
                    }
                    if (score > bestScore) { bestScore = score; bestTile = { x: tx, y: ty }; }
                }
            }
            return bestTile;
        }

        if (kind === 'placeBlock') {
            const R = _effRange(unit, spell) || 3;
            if (!v.visibleEnemies.length) return null;
            let bestShove = null, bestShoveS = 0;
            for (const e of v.visibleEnemies) {
                if (Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y) > R) continue;
                const info = {};
                if (typeof g._placeBlockProblem === 'function' &&
                    g._placeBlockProblem(unit, spell, e.x, e.y, info)) continue;
                let s = 10 + getTargetPriority(e, unit, v) * 0.2;
                if (info.shoveTo) {
                    const lt = g.getTerrainAt(info.shoveTo.x, info.shoveTo.y);
                    if (lt === 'lava' || lt === 'deep_water' || lt === 'chasm' || lt === 'void') s += 30;
                    else if (lt === 'water' || lt === 'poison' || lt === 'poison_bog' || lt === 'purple_bog' || lt === 'swamp' || lt === 'oil') s += 12;
                    if ((g.state.traps || []).some(tr => tr.x === info.shoveTo.x && tr.y === info.shoveTo.y && tr.owner === unit.player)) s += 25;
                }
                if (s > bestShoveS) { bestShoveS = s; bestShove = { x: e.x, y: e.y }; }
            }
            const backline = [unit, ...(v.allies || [])]
                .filter(a => !a.dead && g.getEffectiveRange(a) >= 2)
                .filter(a => Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= R);
            if (bestShove && bestShoveS >= 25) return bestShove;
            if (backline.length) return { x: backline[0].x, y: backline[0].y };
            return bestShove;
        }

        if (kind === 'buildStructure') {
            const R = _effRange(unit, spell) || 3;
            if (spell.structure === 'bridgeSpan') {
                for (let d = 1; d <= R; d++) {
                    for (let dy = -d; dy <= d; dy++) {
                        for (let dx = -d; dx <= d; dx++) {
                            if (Math.abs(dx) + Math.abs(dy) !== d) continue;
                            const tx = unit.x + dx, ty = unit.y + dy;
                            if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) continue;
                            const t = g.getTerrainAt(tx, ty);
                            if (t === 'water' || t === 'deep_water' || t === 'chasm') return { x: tx, y: ty };
                        }
                    }
                }
                return null;
            }
            if (!v.visibleEnemies.length) return null;
            const e0 = v.visibleEnemies[0];
            const sx = Math.sign(e0.x - unit.x), sy = Math.sign(e0.y - unit.y);
            const cands = [{ x: unit.x + sx, y: unit.y + sy }, { x: unit.x + sx, y: unit.y }, { x: unit.x, y: unit.y + sy }];
            for (const c of cands) {
                if (c.x < 0 || c.y < 0 || c.x >= g.bw() || c.y >= g.bh()) continue;
                if (c.x === unit.x && c.y === unit.y) continue;
                if (g.unitAt(c.x, c.y)) continue;
                return c;
            }
            return null;
        }

        if (kind === 'summonWeather' && !window.EW_AI_OLD_WEATHER) return _pickWeatherTile(g, unit, spell, v);
        if (kind === 'summonWeather') return v.visibleEnemies[0] || null;
        if (kind === 'warCry') return { x: unit.x, y: unit.y };

        if (kind === 'encore') {
            const allies = g.aliveUnitsFor(unit.player)
                .filter(a => a.id !== unit.id && !a._encoreThisRound
                    && (typeof g.unitEncoreReady === 'function' ? g.unitEncoreReady(a) : g.unitFinished(a)))
                .filter(a => Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= _effRange(unit, spell));
            // Give the extra action to the highest-output ally.
            allies.sort((a, b) => unitThreatOutput(g, b, v.closestEnemy || unit)
                                - unitThreatOutput(g, a, v.closestEnemy || unit));
            return allies[0] || null;
        }

        if (kind === 'teleport') {
            // doSpell teleports the CASTER to the clicked EMPTY tile.
            if (spell.teleportAnyUnit) return _teleportAnyPick(unit, spell, v);   // THE FULL LIST: the two-click warp (pick a body, then its landing)
            const R = _effRange(unit, spell) || spell.teleportDistance || 4;
            const hurt = unit.hp < unit.maxHp * 0.35 && v.closestEnemyDist <= 2;
            const wantEngage = !hurt && v.visibleEnemies.length > 0
                && v.closestEnemyDist > g.getEffectiveRange(unit) + ((g.getEffectiveMove ? g.getEffectiveMove(unit) : unit.move) || 2);
            if (!hurt && !wantEngage) return null;
            let bestTile = null, bestVal = -Infinity;
            const _pbSet = spell.prismBlink ? new Set((typeof window.prismBlinkTiles === 'function' ? window.prismBlinkTiles(unit) : []).map(t => t.x + ',' + t.y)) : null;
            if (_pbSet && !_pbSet.size) return null;
            for (let dy = -R; dy <= R; dy++) {
                for (let dx = -R; dx <= R; dx++) {
                    const d = Math.abs(dx) + Math.abs(dy);
                    if (d < 1 || d > R) continue;
                    const tx = unit.x + dx, ty = unit.y + dy;
                    if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) continue;
                    if (_pbSet && !_pbSet.has(tx + ',' + ty)) continue;
                    if (g.unitAt(tx, ty)) continue;
                    if (typeof g.isTerrainPassable === 'function' && !g.isTerrainPassable(tx, ty)) continue;
                    // wave C: onlyTerrain (Icky Surprise) — goo tiles only
                    if (spell.onlyTerrain && g.getTerrainAt(tx, ty) !== spell.onlyTerrain) continue;
                    // B4 (2026-10-29): Mirror Blink lands only next to the team's prisms
                    if (_pbSet && !_pbSet.has(tx + ',' + ty)) continue;
                    // THE SPELL AUDIT Batch D: needsLoS (Web Swing) — only a tile the caster can see
                    if (spell.needsLoS && g.isRangeBlockedByTerrain(unit.x, unit.y, tx, ty)) continue;
                    let val = 0;
                    if (hurt) {
                        let nd = Infinity;
                        for (const e of v.visibleEnemies) nd = Math.min(nd, Math.abs(e.x - tx) + Math.abs(e.y - ty));
                        val = nd * 10;
                        for (const a of v.allies) if (Math.abs(a.x - tx) + Math.abs(a.y - ty) <= 3) val += 6;
                    } else {
                        const er = g.getEffectiveRange(unit);
                        for (const e of v.visibleEnemies) {
                            const ed = Math.abs(e.x - tx) + Math.abs(e.y - ty);
                            if (ed >= 1 && ed <= er) val = Math.max(val, 20 + getTargetPriority(e, unit, v) * 0.3);
                        }
                        if (val === 0) continue;
                    }
                    if (val > bestVal) { bestVal = val; bestTile = { x: tx, y: ty }; }
                }
            }
            return bestTile;
        }

        if (kind === 'healAll' || kind === 'manaRestoreAll' || kind === 'barrage') return { x: unit.x, y: unit.y };
        if (kind === 'remoteView' && spell.inspectAt) {
            const _fs = _aiFarSightPick(unit, spell, v);
            return _fs ? { x: _fs.x, y: _fs.y, _farSightScore: _fs.score } : null;
        }
        if (kind === 'scan' || kind === 'remoteView') return { x: unit.x, y: unit.y };

        if (kind === 'line' || kind === 'linePush') {
            return _bestLineAimAI(unit, spell, v)?.target || null;
        }

        if (kind === 'cross') {
            if (spell.aoeOriginSelf) {
                const crossTiles = _crossFootprintAI(spell, unit.x, unit.y);
                const hits = crossTiles.filter(t => v.visibleEnemies.some(e => e.x === t.x && e.y === t.y)).length;
                return hits > 0 ? { x: unit.x, y: unit.y } : null;
            }
            let best = null, bestScore = 0;
            const R = _effRange(unit, spell);
            for (const e of v.visibleEnemies) {
                const d = _dist(g, unit.x, unit.y, unit.z, e);
                if (d < 1 || d > R) continue;
                if (!spell.ignoresLineOfSight && g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y)) continue;
                const crossTiles = _crossFootprintAI(spell, e.x, e.y);
                const hits = crossTiles.filter(t => v.visibleEnemies.some(en => en.x === t.x && en.y === t.y)).length;
                const score = hits * 10;
                if (score > bestScore) { bestScore = score; best = e; }
            }
            return best;
        }

        if (kind === 'pull' && spell.allyOnly) {   // THE SPELL AUDIT Batch D: Rescue Line — the most endangered ally
            const R = _effRange(unit, spell) || 4;
            const cands = (v.allies || []).filter(a => !a.dead && a.id !== unit.id && a.player === unit.player
                && Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) >= 2 && Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= R);
            cands.sort((a, b) => (a.hp / Math.max(1, a.maxHp)) - (b.hp / Math.max(1, b.maxHp)));
            return cands[0] || null;
        }
        if (kind === 'swap' && spell.allyOnly) {   // THE SPELL AUDIT Batch D: Tag In — the hurt ally in the thick of it
            const R = _effRange(unit, spell) || 3;
            const cands = (v.allies || []).filter(a => !a.dead && a.id !== unit.id && a.player === unit.player
                && Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) >= 1 && Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= R);
            cands.sort((a, b) => (a.hp / Math.max(1, a.maxHp)) - (b.hp / Math.max(1, b.maxHp)));
            return cands[0] || null;
        }
        if (kind === 'pull') {
            const inRange = v.visibleEnemies
                .filter(e => {
                    const d = _dist(g, unit.x, unit.y, unit.z, e);
                    return d >= 2 && d <= (_effRange(unit, spell) || 4);
                })
                .sort((a, b) => {
                    const aR = g.getEffectiveRange(a) >= 3 ? 20 : 0;
                    const bR = g.getEffectiveRange(b) >= 3 ? 20 : 0;
                    return (bR + getTargetPriority(b, unit, v)) - (aR + getTargetPriority(a, unit, v));
                });
            return inRange[0] || null;
        }

        if (kind === 'swap') {
            const inRange = v.visibleEnemies
                .filter(e => {
                    const d = _dist(g, unit.x, unit.y, unit.z, e);
                    return d >= 1 && d <= (_effRange(unit, spell) || 4);
                })
                .filter(e => !spell.requiresLineOfSight || !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y))
                .sort((a, b) => getTargetPriority(b, unit, v) - getTargetPriority(a, unit, v));
            return inRange[0] || null;
        }

        if (kind === 'escape') return { x: unit.x, y: unit.y };
        if (kind === 'transform') return { x: unit.x, y: unit.y };
        if (kind === 'selfHeal') return { x: unit.x, y: unit.y };

        if (kind === 'aoePull' && spell.aoeOriginSelf) {   // THE SPELL AUDIT Batch D: Round Up / Crowd Surge centre on the caster
            const area = _aoeTilesAI(spell, unit.x, unit.y, spell.aoeRadius || 1);
            return v.visibleEnemies.some(e => area.some(t => t.x === e.x && t.y === e.y)) ? { x: unit.x, y: unit.y } : null;
        }
        if (kind === 'aoePull') {
            let best = null, bestScore = 0;
            const R = _effRange(unit, spell);
            for (const e of v.visibleEnemies) {
                const d = _dist(g, unit.x, unit.y, unit.z, e);
                if (d < 1 || d > R) continue;
                if (!spell.ignoresLineOfSight && g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y)) continue;
                const area = _aoeTilesAI(spell, e.x, e.y, spell.aoeRadius || 1);
                const hits = area.filter(t => v.visibleEnemies.some(en => en.x === t.x && en.y === t.y)).length;
                const score = hits * 10;
                if (score > bestScore) { bestScore = score; best = e; }
            }
            return best;
        }

        if (kind === 'splitBeam') {
            const R = _effRange(unit, spell);
            const inRange = v.visibleEnemies
                .filter(e => {
                    const d = _dist(g, unit.x, unit.y, unit.z, e);
                    return d >= 1 && d <= R && (spell.ignoresLineOfSight || !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y));
                })
                .sort((a, b) => {
                    const aNear = v.visibleEnemies.filter(e2 =>
                        e2.id !== a.id && Math.abs(e2.x - a.x) + Math.abs(e2.y - a.y) <= (spell.splitRadius || 2)).length;
                    const bNear = v.visibleEnemies.filter(e2 =>
                        e2.id !== b.id && Math.abs(e2.x - b.x) + Math.abs(e2.y - b.y) <= (spell.splitRadius || 2)).length;
                    return (bNear * 10 + getTargetPriority(b, unit, v)) - (aNear * 10 + getTargetPriority(a, unit, v));
                });
            return inRange[0] || null;
        }

        if (kind === 'delayed') {
            // Prefer targets that CANNOT leave the blast (root/stun/freeze/
            // sleep) — the kind's real use case; else densest cluster.
            let best = null, bestScore = 0;
            for (const e of v.visibleEnemies) {
                const d = _dist(g, unit.x, unit.y, unit.z, e);
                if (d < 1 || d > _effRange(unit, spell)) continue;
                const area = _aoeTilesAI(spell, e.x, e.y, spell.aoeRadius || 1);
                let hits = area.filter(t => v.visibleEnemies.some(en => en.x === t.x && en.y === t.y)).length;
                try {
                    if (['root', 'stun', 'freeze', 'frozen', 'sleep'].some(id => g.unitHasStatus(e, id))) hits += 3;
                } catch (q) {}
                if (hits > bestScore) { bestScore = hits; best = e; }
            }
            return best;
        }

        if (kind === 'deployObject') {
            const active = (g.state._deployedObjects || []).filter(o => o.ownerUnitId === unit.id && o.spellId === spell.id && !o._detonated).length;   // the cap is per spell (battle.js deployObject)
            if (active >= (spell.maxActivePerCaster || 2)) return null;
            const R = _effRange(unit, spell) || 1;
            let bestTile = null, bestScore = -1;
            for (let dy = -R; dy <= R; dy++) {
                for (let dx = -R; dx <= R; dx++) {
                    const tx = unit.x + dx, ty = unit.y + dy;
                    const d = Math.abs(dx) + Math.abs(dy);
                    if (d < 1 || d > R) continue;
                    if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) continue;
                    const terrain = g.getTerrainAt(tx, ty);
                    const rule = g.getTerrainRule(terrain);
                    if (rule.impassable) continue;
                    const occUnit = g.state.units.find(u => !u.dead && u.x === tx && u.y === ty);
                    if (occUnit) {
                        const _contactOk = spell.detonateOnStep && occUnit.player !== unit.player
                            && !(typeof g.isUnitAirborne === 'function' && g.isUnitAirborne(occUnit));
                        if (!_contactOk) continue;
                    }
                    let score = 5;
                    if (occUnit) score += 25 + (spell.blastDmg || 0) * 0.2;
                    for (const e of v.visibleEnemies) {
                        const eDist = Math.abs(e.x - tx) + Math.abs(e.y - ty);
                        if (eDist <= 3) score += 8;
                    }
                    if (score > bestScore) { bestScore = score; bestTile = { x: tx, y: ty }; }
                }
            }
            return bestTile;
        }

        if (kind === 'deployPair') {
            const active = (g.state._gatePairs || []).filter(gp => gp.ownerId === unit.id).length;
            if (active >= (spell.maxActivePerCaster || 1)) return null;
            const R = _effRange(unit, spell) || 4;
            let bestTile = null, bestScore = -1;
            for (let dy = -R; dy <= R; dy++) {
                for (let dx = -R; dx <= R; dx++) {
                    const tx = unit.x + dx, ty = unit.y + dy;
                    const d = Math.abs(dx) + Math.abs(dy);
                    if (d < 1 || d > R) continue;
                    if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) continue;
                    if (g.state.units.some(u => !u.dead && u.x === tx && u.y === ty)) continue;
                    let score = 5;
                    if (v.enemyTower && v.enemyTower.hp > 0) {
                        const tDist = Math.abs(v.enemyTower.x - tx) + Math.abs(v.enemyTower.y - ty);
                        if (tDist <= 4) score += 15;
                    }
                    if (score > bestScore) { bestScore = score; bestTile = { x: tx, y: ty }; }
                }
            }
            return bestTile;
        }

        if (kind === 'aoeShield') {
            let best = null, bestAllies = 0;
            const candidates = [unit, ...v.allies].filter(a =>
                !a.dead && Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= (_effRange(unit, spell) || 3));
            for (const c of candidates) {
                const area = _aoeTilesAI(spell, c.x, c.y, spell.aoeRadius || 1);
                const count = [unit, ...v.allies].filter(a =>
                    !a.dead && area.some(t => t.x === a.x && t.y === a.y)).length;
                if (count > bestAllies) { bestAllies = count; best = c; }
            }
            return best;
        }

        if (kind === 'zoneDebuff') {
            if (spell.aoeOriginSelf) {   // G1 (2026-11-06): Exhaust Cloud centres on the caster — cast it only with an enemy inside
                const area = _aoeTilesAI(spell, unit.x, unit.y, spell.aoeRadius || 1);
                const team = spell.gravityField === 'weak' ? [unit, ...v.allies].filter(a => !a.dead) : v.visibleEnemies;
                const n = team.filter(e => area.some(t => t.x === e.x && t.y === e.y)).length;
                return n >= (spell.gravityField === 'weak' ? 2 : 1) ? { x: unit.x, y: unit.y } : null;
            }
            if (spell.gravityField === 'weak') {
                let bestAlly = null, bestAllyScore = 0;
                for (const a of [unit, ...v.allies]) {
                    if (a.dead) continue;
                    const d = Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y);
                    if (d > (_effRange(unit, spell) || 4)) continue;
                    const area = _aoeTilesAI(spell, a.x, a.y, spell.aoeRadius || 1);
                    const inArea = [unit, ...v.allies].filter(h => !h.dead && area.some(t => t.x === h.x && t.y === h.y)).length;
                    if (inArea > bestAllyScore) { bestAllyScore = inArea; bestAlly = a; }
                }
                return bestAllyScore >= 2 ? bestAlly : null;
            }
            let best = null, bestScore = 0;
            for (const e of v.visibleEnemies) {
                const d = _dist(g, unit.x, unit.y, unit.z, e);
                if (d < 1 || d > (_effRange(unit, spell) || 4)) continue;
                const area = _aoeTilesAI(spell, e.x, e.y, spell.aoeRadius || 1);
                let hits = area.filter(t => v.visibleEnemies.some(en => en.x === t.x && en.y === t.y)).length;
                if (spell.gravityField === 'super' && typeof g.canFly === 'function' && g.canFly(e)) hits += 3;
                const score = hits * 10;
                if (score > bestScore) { bestScore = score; best = e; }
            }
            return best;
        }

        if (kind === 'zoneHeal') {
            let best = null, bestScore = 0;
            const hurtAllies = [unit, ...v.allies].filter(a => !a.dead && a.hp < a.maxHp * 0.8);
            for (const a of [unit, ...v.allies]) {
                if (a.dead) continue;
                const d = Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y);
                if (d > (_effRange(unit, spell) || 3)) continue;
                const area = _aoeTilesAI(spell, a.x, a.y, spell.aoeRadius || 1);
                const hurtInArea = hurtAllies.filter(h => area.some(t => t.x === h.x && t.y === h.y)).length;
                const allInArea = [unit, ...v.allies].filter(h => !h.dead && area.some(t => t.x === h.x && t.y === h.y)).length;
                const score = hurtInArea * 12 + allInArea * 4;
                if (score > bestScore) { bestScore = score; best = a; }
            }
            return best;
        }

        if (kind === 'terrainCreate' && !window.EW_AI_OLD_TERRAIN) {
            const tp = _pickTerrainTile(g, unit, spell, v);
            if (tp) return tp;
        }
        if (kind === 'terrainCreate') {
            let bestTile = null, bestScore = -1;
            const R = _effRange(unit, spell) || 3;
            for (let dy = -R; dy <= R; dy++) {
                for (let dx = -R; dx <= R; dx++) {
                    const tx = unit.x + dx, ty = unit.y + dy;
                    const d = Math.abs(dx) + Math.abs(dy);
                    if (d < 1 || d > R) continue;
                    if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) continue;
                    let score = 5;
                    if (v.ownTower && v.ownTower.hp > 0) {
                        const tDist = Math.abs(v.ownTower.x - tx) + Math.abs(v.ownTower.y - ty);
                        if (tDist <= 4) score += 10;
                    }
                    for (const e of v.visibleEnemies) {
                        // a ground-bound wall (missesFlyers: Wall of Fire) passes under a flyer up in the sky
                        if (spell.missesFlyers && typeof g.isUnitAirborne === 'function' && g.isUnitAirborne(e)) continue;
                        const eDist = Math.abs(e.x - tx) + Math.abs(e.y - ty);
                        if (eDist <= 2) score += 5;
                        if (spell.dmg && eDist <= 1) score += 20;
                        if (spell.dmg && eDist === 0) score += 30;
                    }
                    if (score > bestScore) { bestScore = score; bestTile = { x: tx, y: ty }; }
                }
            }
            return bestTile;
        }

        if (kind === 'cleanse' && !window.EW_AI_OLD_CLEANSE) return _pickCleanseTarget(g, unit, spell, v);
        if (kind === 'cleanse') {
            const targets = [unit, ...v.allies]
                .filter(a => !a.dead && Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= (_effRange(unit, spell) || 3))
                .map(a => ({
                    ally: a,
                    debuffs: (a.statusEffects || []).filter(e =>
                        ['stun', 'silence', 'slow', 'poison', 'burn', 'stagger', 'marked', 'discord', 'jammed', 'glare'].includes(e.id)).length
                }))
                .filter(t => t.debuffs > 0)
                .sort((a, b) => {
                    const aUrgent = (a.ally.statusEffects || []).some(e => e.id === 'stun' || e.id === 'silence') ? 10 : 0;
                    const bUrgent = (b.ally.statusEffects || []).some(e => e.id === 'stun' || e.id === 'silence') ? 10 : 0;
                    const aHG = (a.ally.hourglasses || 0) > 0 ? 5 : 0;
                    const bHG = (b.ally.hourglasses || 0) > 0 ? 5 : 0;
                    return (bUrgent + bHG + b.debuffs) - (aUrgent + aHG + a.debuffs);
                });
            return targets.length > 0 ? targets[0].ally : null;
        }

        if (kind === 'dash') {
            let bestTile = null, bestScore = -1;
            const range = _effRange(unit, spell) || 3;
            for (let dy = -range; dy <= range; dy++) {
                for (let dx = -range; dx <= range; dx++) {
                    const d = Math.abs(dx) + Math.abs(dy);
                    if (d < 1 || d > range) continue;
                    const tx = unit.x + dx, ty = unit.y + dy;
                    if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) continue;
                    const terrain = g.getTerrainAt(tx, ty);
                    const rule = g.getTerrainRule(terrain);
                    if (!rule.passable) continue;
                    // Sprint & co (no damage of their own) run only to an empty tile
                    if (typeof window.dashOnlyMoves === 'function' && window.dashOnlyMoves(spell) && g.unitAt(tx, ty)) continue;
                    const path = g.getLinePoints(unit.x, unit.y, tx, ty);
                    let hits = 0, hitPriority = 0;
                    for (const pt of path) {
                        const victim = v.visibleEnemies.find(e => e.x === pt.x && e.y === pt.y);
                        if (victim) { hits++; hitPriority += getTargetPriority(victim, unit, v); }
                    }
                    // Phase 6 (Drive-By): a landing with a shot on offer
                    // qualifies even when the run itself hits nobody — prefer
                    // the weakest enemy in the shot's reach; never land on a
                    // body (the dash would only shove it).
                    let shot = 0;
                    if (spell.afterShot) {
                        if (v.visibleEnemies.some(e => e.x === tx && e.y === ty)) continue;
                        const _asR = spell.afterShot.range || 3;
                        for (const e of v.visibleEnemies) {
                            if (Math.abs(e.x - tx) + Math.abs(e.y - ty) > _asR) continue;
                            if (g.isRangeBlockedByTerrain(tx, ty, e.x, e.y)) continue;
                            shot = Math.max(shot, 80 + getTargetPriority(e, unit, v) + Math.max(0, 60 - (e.hp / Math.max(1, e.maxHp)) * 60));
                        }
                    }
                    if (hits === 0 && shot === 0) continue;
                    const score = hits * 100 + hitPriority + d * 2 + shot;
                    if (score > bestScore && _aimOkAt(unit, spell, tx, ty)) { bestScore = score; bestTile = { x: tx, y: ty }; }
                }
            }
            return bestTile;
        }

        if (kind === 'displacement') {
            const inRange = v.visibleEnemies
                .filter(e => {
                    const d = _dist(g, unit.x, unit.y, unit.z, e);
                    return d >= 1 && d <= (_effRange(unit, spell) || 3) && !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y);
                })
                .sort((a, b) => getTargetPriority(b, unit, v) - getTargetPriority(a, unit, v));
            return inRange[0] || null;
        }

        return null;
    }

    // ═════════════════════════════════════════════════════════════════════
    // EXECUTION — the engine contract: run the action, read its returned
    // animation delay, schedule finishComputerAction() after it. A rejected
    // action (delay 0 / no state change) marks a per-activation memo so the
    // re-triggered loop never re-picks the same doomed candidate.
    // ═════════════════════════════════════════════════════════════════════

    function executeAction(unit, action, v) {
        const g = G();

        switch (action.type) {
            case 'item':
                g.state.actionMode = 'item';
                g.state.selectedTool = action.item;
                g.doItem(unit, unit.x, unit.y, unit.z);
                g.finishComputerAction();
                break;

            case 'stim': {
                const _before = unit.items?.[action.item] || 0;
                try { window.useStimItem(unit, action.item); } catch (e) {}
                if ((unit.items?.[action.item] || 0) >= _before) {
                    _failedItems.add(action.item);
                    g.state.aiThinking = false;
                    g.maybeTriggerComputerTurn();
                } else g.finishComputerAction();
                break;
            }

            case 'item_targeted': {
                const prevCount = unit.items?.[action.item] || 0;
                g.state.actionMode = 'item';
                g.state.selectedTool = action.item;
                g.doItem(unit, action.target.x, action.target.y, action.target.z);
                const newCount = unit.items?.[action.item] || 0;
                if (newCount >= prevCount) {
                    _failedItems.add(action.item);
                    g.state.actionMode = null;
                    g.state.selectedTool = null;
                    g.state.aiThinking = false;
                    g.maybeTriggerComputerTurn();
                } else {
                    g.finishComputerAction();
                }
                break;
            }

            case 'panacea': {
                if ((unit.items?.panacea || 0) <= 0 || !unit.status) {
                    g.state.aiThinking = false;
                    g.maybeTriggerComputerTurn();
                    break;
                }
                const STATUS_DEFS_ = g.STATUS_DEFS || {};
                let hasDebuff = false;
                for (const key of Object.keys(unit.status)) {
                    if (STATUS_DEFS_[key]?.kind === 'debuff') { hasDebuff = true; break; }
                }
                if (!hasDebuff) {
                    g.state.aiThinking = false;
                    g.maybeTriggerComputerTurn();
                    break;
                }
                g.pushUndoSnapshot(true);
                unit.items.panacea -= 1;
                let cleared = 0;
                for (const key of Object.keys(unit.status)) {
                    if (STATUS_DEFS_[key]?.kind === 'debuff') {
                        delete unit.status[key];
                        cleared++;
                    }
                }
                g.addLog(`💊 ${g.unitDisplayName(unit)} uses Panacea! ${cleared} status effect${cleared > 1 ? 's' : ''} cured.`);
                g.showFloatingTextForUnit(unit, '💊 CURED', 'heal', { durationMs: 1200 });
                g.spendAP(unit, 1);   // Panacea costs 1 AP (mondo 2026-10-17)
                g.finishComputerAction();
                break;
            }

            case 'warpStone': {
                if ((unit.items?.warpStone || 0) <= 0 || !action.target) {
                    g.state.aiThinking = false;
                    g.maybeTriggerComputerTurn();
                    break;
                }
                const wx = action.target.x;
                const wy = action.target.y;
                const dist = Math.abs(unit.x - wx) + Math.abs(unit.y - wy);
                if (dist < 1 || dist > 3) {
                    g.state.aiThinking = false;
                    g.maybeTriggerComputerTurn();
                    break;
                }
                const tileType = g.state.boardTerrain?.[wy]?.[wx];
                const rule = g.TERRAIN_RULES?.[tileType];
                if (!rule || rule.passable === false || g.unitAt(wx, wy)) {
                    g.state.aiThinking = false;
                    g.maybeTriggerComputerTurn();
                    break;
                }
                g.pushUndoSnapshot(true);
                unit.items.warpStone -= 1;
                unit.x = wx;
                unit.y = wy;
                if (typeof nearestWalkableZ === 'function') unit.z = nearestWalkableZ(wx, wy, unit.z);
                g.addLog(`🌀 ${g.unitDisplayName(unit)} warps to (${wx},${wy})!`);
                g.showFloatingTextForUnit(unit, '🌀 WARP', 'buff', { durationMs: 1000 });
                g.state.aiThinking = false;
                g.maybeTriggerComputerTurn();
                break;
            }

            case 'finisher': {
                const delay = (typeof g.doFinisher === 'function') ? (g.doFinisher(unit, action.targetId != null ? action.targetId : null) || 0) : 0;
                if (delay > 0) {
                    window.setTimeout(() => g.finishComputerAction(), delay);
                } else {
                    g.state.aiThinking = false;
                    g.maybeTriggerComputerTurn();
                }
                break;
            }

            case 'entropyStrike': {
                const delay = (typeof g.doEntropyStrike === 'function') ? (g.doEntropyStrike(unit, action.strikeType || null) || 0) : 0;
                if (delay > 0) {
                    window.setTimeout(() => g.finishComputerAction(), delay);
                } else {
                    g.state.aiThinking = false;
                    g.maybeTriggerComputerTurn();
                }
                break;
            }

            case 'attack':
                g.state.actionMode = 'attack';
                g.queueComputerAction(() => {
                    const delay = g.doAttack(unit, action.target.x, action.target.y, action.target.z) || 0;
                    if (delay > 0) {
                        window.setTimeout(() => g.finishComputerAction(), delay);
                    } else {
                        _skipAttack = true;
                        g.state.actionMode = null;
                        g.state.aiThinking = false;
                        g.maybeTriggerComputerTurn();
                    }
                }, action.target);
                break;

            case 'attack_tower':
                g.state.actionMode = 'attack';
                g.queueComputerAction(() => {
                    const delay = g.doAttack(unit, action.towerX, action.towerY) || 0;
                    if (delay > 0) {
                        window.setTimeout(() => g.finishComputerAction(), delay);
                    } else {
                        _skipTowerAttack = true;
                        g.state.actionMode = null;
                        g.state.aiThinking = false;
                        g.maybeTriggerComputerTurn();
                    }
                });
                break;

            case 'spell':
                g.state.actionMode = 'spell';
                g.state.selectedTool = action.spell.name;
                /* C1: Tune casts the frequency it was scored for */
                g.state._tunePick = (action.spell.kind === 'tuneFrequency' && _aiTunePick.has(unit.id)) ? _aiTunePick.get(unit.id) : null;
                g.queueComputerAction(() => {
                    // skyThrow is two-phase: grab, then throw.
                    if (action.spell.kind === 'skyThrow') {
                        g.doSpell(unit, action.target.x, action.target.y);
                        if (unit._skyThrowGrab) {
                            const throwRange = action.spell.throwRange || 3;
                            const grabbed = g.state.units.find(u => u.id === unit._skyThrowGrab.id && !u.dead);
                            if (grabbed) {
                                let bestTX = grabbed.x + 1, bestTY = grabbed.y, bestScore = -Infinity;
                                for (let dy = -throwRange; dy <= throwRange; dy++) {
                                    for (let dx = -throwRange; dx <= throwRange; dx++) {
                                        if (dx === 0 && dy === 0) continue;
                                        const tx = grabbed.x + dx, ty = grabbed.y + dy;
                                        if (Math.abs(dx) + Math.abs(dy) > throwRange) continue;
                                        if (!g.isInside(tx, ty)) continue;
                                        let tScore = 0;
                                        const occupant = g.unitAt(tx, ty);
                                        if (occupant && !occupant.dead && g.isEnemyUnit(occupant, unit)) {
                                            tScore += (action.spell.collisionBonus || 50) + 80;
                                        } else if (occupant && !occupant.dead) {
                                            tScore -= 200;
                                            continue;
                                        }
                                        const lz = typeof g.getHeightAt === 'function' ? g.getHeightAt(tx, ty) : 0;
                                        tScore += (10 - lz) * 10;
                                        tScore += (Math.abs(dx) + Math.abs(dy)) * 5;
                                        if (tScore > bestScore) { bestScore = tScore; bestTX = tx; bestTY = ty; }
                                    }
                                }
                                /* THE PUSH LANDING (2026-11-01): the throw lands only on the lit ring (the same tiles the
                                   player gets) and each landing is read through the engine's forecast — the crash into
                                   a body, the chain the landing sets off — and priced like any other forced move
                                   (lava, deep water, the fall, a hostile Nexus, a trap). The old pick (lowest, farthest
                                   square) stays as the fallback when the forecast has nothing. */
                                try {
                                    const ring = (!window.EW_AI_NO_PUSH_FORECAST && g.TargetQuery && typeof g.TargetQuery.spellTiles === 'function')
                                        ? (g.TargetQuery.spellTiles(unit, action.spell) || []) : [];
                                    let ringBest = null, ringScore = -Infinity;
                                    for (const t of ring.slice(0, 60)) {
                                        const occ = g.unitAt(t.x, t.y);
                                        if (occ && !occ.dead && occ.id !== grabbed.id && !g.isEnemyUnit(occ, unit)) continue;   // never into our own
                                        let sc = _landingWorth(g, unit, grabbed, grabbed.x, grabbed.y, t.x, t.y, v);
                                        const plan = (typeof window.forecastSpellPlan === 'function') ? window.forecastSpellPlan(unit, action.spell, t.x, t.y, t.z) : null;
                                        if (plan && plan.handled) {
                                            for (const h of (plan.hits || [])) {
                                                if (!h.unit || h.unit.dead) continue;
                                                const d = Math.min(h.dmg || 0, effHp(h.unit));
                                                if (h.unit.player !== unit.player) { sc += d; if ((h.dmg || 0) >= effHp(h.unit)) sc += killValue(g, unit, h.unit, v) * 0.9; }
                                                else sc -= d * 1.2;
                                                if (h.nexusBurn > 0 && h.unit.player !== unit.player) sc += Math.min(h.nexusBurn, effHp(h.unit)) * 0.8;
                                            }
                                        } else if (occ && !occ.dead && g.isEnemyUnit(occ, unit)) sc += (action.spell.collisionBonus || 50) + 80;
                                        sc += (Math.abs(t.x - grabbed.x) + Math.abs(t.y - grabbed.y)) * 2;
                                        if (sc > ringScore) { ringScore = sc; ringBest = t; }
                                    }
                                    if (ringBest) { bestTX = ringBest.x; bestTY = ringBest.y; }
                                } catch (e) {}
                                const throwDelay = g.doSpell(unit, bestTX, bestTY) || 0;
                                if (throwDelay > 0) {
                                    window.setTimeout(() => g.finishComputerAction(), throwDelay);
                                } else {
                                    unit._skyThrowGrab = null;
                                    g.state._skyThrowHighlight = null;
                                    _failedSpells.add(action.spell.name);
                                    g.state.actionMode = null;
                                    g.state.selectedTool = null;
                                    g.state.aiThinking = false;
                                    g.maybeTriggerComputerTurn();
                                }
                                return;
                            }
                        }
                        _failedSpells.add(action.spell.name);
                        g.state.actionMode = null;
                        g.state.selectedTool = null;
                        g.state.aiThinking = false;
                        g.maybeTriggerComputerTurn();
                        return;
                    }
                    // Line beams: re-aim from the caster's CURRENT position at
                    // cast time — the target may have moved during telegraph.
                    let _castX = action.target.x, _castY = action.target.y, _castZ = action.target.z;
                    if (action.spell.kind === 'guard') {
                        const ward = _reaimChivalry(unit, action.spell);
                        if (!ward) {
                            _failedSpells.add(action.spell.name);
                            g.state.actionMode = null;
                            g.state.selectedTool = null;
                            g.state.aiThinking = false;
                            g.maybeTriggerComputerTurn();
                            return;
                        }
                        _castX = ward.x; _castY = ward.y; _castZ = ward.z;
                    }
                    if (action.spell.kind === 'line' || action.spell.kind === 'linePush') {
                        const aim = _reaimLineSpell(unit, action.spell, action.target?.id);
                        if (!aim) {
                            // every ray whiffs now — abort instead of burning AP+MP
                            _failedSpells.add(action.spell.name);
                            g.state.actionMode = null;
                            g.state.selectedTool = null;
                            g.state.aiThinking = false;
                            g.maybeTriggerComputerTurn();
                            return;
                        }
                        _castX = aim.x; _castY = aim.y; _castZ = aim.z;   // the aimed body's level (THE 3D LINE)
                    }
                    // Two-click casts (wave B): the chosen target is the FIRST
                    // pick — seat it as the engine's own pick and cast at the
                    // partner findSpellTarget chose with it.
                    if (action.partner && action.target && action.target.id != null) {
                        const _pp = g.state.units.find(u => u.id === action.partner.id && !u.dead && !u._dying);
                        const _p1 = g.state.units.find(u => u.id === action.target.id && !u.dead && !u._dying);
                        if (!_pp || !_p1) {
                            _failedSpells.add(action.spell.name);
                            g.state.actionMode = null;
                            g.state.selectedTool = null;
                            g.state.aiThinking = false;
                            g.maybeTriggerComputerTurn();
                            return;
                        }
                        g.state._spellPick1 = { id: _p1.id, spellId: action.spell.id, x: _p1.x, y: _p1.y };
                        _castX = _pp.x; _castY = _pp.y; _castZ = _pp.z;
                    }
                    /* THE FULL LIST: a teleport-any-unit cast is two clicks — the body, then its landing (a self blink
                       picks the caster first) */
                    if (action.spell.kind === 'teleport' && action.spell.teleportAnyUnit) {
                        const _mvId = (action.target && action.target._tpMover != null) ? action.target._tpMover : unit.id;
                        const _mv = g.state.units.find(u => u.id === _mvId && !u.dead && !u._dying);
                        const _land = (action.target && action.target._tpLand) || (action.target && action.target._tpMover == null ? action.target : null);
                        if (!_mv || !_land) {
                            _failedSpells.add(action.spell.name);
                            g.state.actionMode = null; g.state.selectedTool = null; g.state.aiThinking = false;
                            g.maybeTriggerComputerTurn();
                            return;
                        }
                        g.state._teleportingUnitId = null;
                        g.doSpell(unit, _mv.x, _mv.y, _mv.z);
                        if (g.state._teleportingUnitId !== _mv.id) {
                            g.state._teleportingUnitId = null;
                            _failedSpells.add(action.spell.name);
                            g.state.actionMode = null; g.state.selectedTool = null; g.state.aiThinking = false;
                            g.maybeTriggerComputerTurn();
                            return;
                        }
                        _castX = _land.x; _castY = _land.y; _castZ = _land.z;
                    }
                    /* THE GROUND LEFT BEHIND: a line of terrain goes down the way the pick scored it (doSpell reads the
                       orientation the player's H/V chips set, and clears it after the cast) */
                    if (action.spell.kind === 'terrainCreate' && action.spell.orientable && action.target && action.target._orient) {
                        g.state._spellOrientation = action.target._orient;
                    }
                    const delay = g.doSpell(unit, _castX, _castY, _castZ) || 0;
                    if (!(delay > 0) && action.spell.kind === 'teleport') g.state._teleportingUnitId = null;
                    g.state._spellPick1 = null;
                    if (delay > 0) {
                        window.setTimeout(() => g.finishComputerAction(), delay);
                    } else {
                        _failedSpells.add(action.spell.name);
                        g.state.actionMode = null;
                        g.state.selectedTool = null;
                        g.state.aiThinking = false;
                        g.maybeTriggerComputerTurn();
                    }
                }, action.target);
                break;

            case 'combo': {
                g.state.actionMode = 'combo';
                g.state.comboPartner = action.partner;
                const ct = action.target;
                const cp = action.partner;
                const tx = ct ? ct.x : unit.x;
                const ty = ct ? ct.y : unit.y;
                const tz = ct ? ct.z : unit.z;

                g.queueComputerAction(() => {
                    const valid = cp && !cp.dead && (cp.ap || 0) >= g.COMBO_AP_COST_PARTNER &&
                        Math.abs(cp.x - unit.x) + Math.abs(cp.y - unit.y) === 1;
                    if (!valid) {
                        _failedCombos.add(cp.id);
                        g.state.actionMode = null;
                        g.state.comboPartner = null;
                        g.state.aiThinking = false;
                        g.maybeTriggerComputerTurn();
                        return;
                    }
                    const delay = g.doComboAttack(unit, cp, tx, ty, tz) || 0;
                    if (delay > 0) {
                        window.setTimeout(() => g.finishComputerAction(), Math.max(delay, g.actionMs(400)));
                    } else {
                        _failedCombos.add(cp.id);
                        g.state.actionMode = null;
                        g.state.comboPartner = null;
                        g.state.aiThinking = false;
                        g.maybeTriggerComputerTurn();
                    }
                }, ct);
                break;
            }

            case 'detonate':
                g.queueComputerAction(() => {
                    const delay = g.doDetonate(unit) || 0;
                    window.setTimeout(() => g.finishComputerAction(), Math.max(delay, g.actionMs(300)));
                });
                break;

            case 'move':
                if (action._jump) {
                    // 🦘 THE CPU JUMP: the existing Jump (doJump: 1 AP, once a turn). The landing (fall damage, Overwatch,
                    // Nexus tick, end-of-unit check) runs after the 500 ms arc when visuals are on, so wait for it.
                    g.state.actionMode = 'jump';
                    if (!unit._aiRecentTiles) unit._aiRecentTiles = [];
                    unit._aiRecentTiles.push(g.posKey(unit.x, unit.y));
                    if (unit._aiRecentTiles.length > 3) unit._aiRecentTiles.shift();
                    const prevX = unit.x, prevY = unit.y;
                    let ok = false;
                    try { ok = !!g.doJump(unit, action.x, action.y, action.z); } catch (e) { ok = false; }
                    if (!ok || (unit.x === prevX && unit.y === prevY)) {
                        _skipJump = true;
                        g.state.actionMode = null;
                        g.state.aiThinking = false;
                        g.maybeTriggerComputerTurn();
                        break;
                    }
                    const st = g.state;
                    const quiet = st._mdQuietUpkeep || st._aiTurbo || st.animationsDisabled || (st.devAutoSim && !st._devSimShowAnims);
                    if (quiet) g.finishComputerAction();
                    else window.setTimeout(() => g.finishComputerAction(), 560);
                    break;
                }
                g.state.actionMode = 'move';
                if (!unit._aiRecentTiles) unit._aiRecentTiles = [];
                unit._aiRecentTiles.push(g.posKey(unit.x, unit.y));
                if (unit._aiRecentTiles.length > 3) unit._aiRecentTiles.shift();
                // 🚪 THE ONE-WAY DOOR: the last gate — a walk that would cross or end on a
                // door that takes us is refused (every scorer already drops those tiles)
                if (_capWalkFeeds(g, unit, action.x, action.y, action.z)) {
                    _skipMove = true;
                    g.state.actionMode = null;
                    g.state.aiThinking = false;
                    g.maybeTriggerComputerTurn();
                    break;
                }
                {
                    const prevX = unit.x, prevY = unit.y;
                    const moveResult = g.doMove(unit, action.x, action.y, action.z);
                    if (unit.x === prevX && unit.y === prevY) {
                        unit._aiStallCount = (unit._aiStallCount || 0) + 1;
                        // doMove refused this destination — stop proposing moves
                        // for the rest of the activation so the AI spends its
                        // remaining AP on a real action instead of stalling out.
                        _skipMove = true;
                    }
                    const animDelay = (typeof moveResult === 'number' && moveResult > 1) ? moveResult : 0;
                    if (animDelay > 0) {
                        window.setTimeout(() => g.finishComputerAction(), animDelay);
                    } else {
                        g.finishComputerAction();
                    }
                }
                break;

            case 'climb': {
                /* 🧗 the player's own climb (battle.js doClimb): it spends the turn; with 2 AP the unit is on top when
                   the clip ends, with 1 AP it hangs till its next turn. Hand back once the clip is over. */
                g.state.actionMode = 'climb';
                if (!unit._aiRecentTiles) unit._aiRecentTiles = [];
                unit._aiRecentTiles.push(g.posKey(unit.x, unit.y));
                if (unit._aiRecentTiles.length > 3) unit._aiRecentTiles.shift();
                const ok = g.doClimb(unit, action.x, action.y, action.z);
                if (!ok) {
                    _skipClimb = true;
                    g.state.actionMode = null;
                    g.state.aiThinking = false;
                    g.maybeTriggerComputerTurn();
                    break;
                }
                const st = g.state;
                const quiet = !!(st._mdQuietUpkeep || (st.devAutoSim && !st._devSimShowAnims) || st._aiTurbo || st.animationsDisabled);
                window.setTimeout(() => g.finishComputerAction(), quiet ? 30 : 1250);   // the climb clip is 1100 ms
                break;
            }

            case 'inspect':
                g.state.actionMode = 'inspect';
                {
                    const delay = g.doInspect(unit, action.x, action.y) || 0;
                    if (delay > 0) {
                        window.setTimeout(() => g.finishComputerAction(), delay);
                    } else {
                        g.finishComputerAction();
                    }
                }
                break;

            case 'flair':
                g.state.actionMode = 'flair';
                g.doFlair(unit, action.x, action.y);
                g.finishComputerAction();
                break;

            case 'ward':
                g.state.actionMode = 'ward';
                g.doWard(unit, action.x, action.y);
                g.finishComputerAction();
                break;

            case 'guard': {
                const apBefore = unit.ap || 0;
                g.doGuard(unit);
                const apAfter = unit.ap || 0;
                if (apAfter >= apBefore) {
                    unit.ap = 0;
                    unit._aiLoopCount = 0;
                }
                g.finishComputerAction();
                break;
            }

            case 'reshape': {
                const apBefore = unit.ap || 0;
                const delay = g.doReshape(unit, action.mode) || 0;
                const apAfter = unit.ap || 0;
                if (apAfter >= apBefore) {
                    unit.ap = 0;
                    unit._aiLoopCount = 0;
                    g.finishComputerAction();
                } else if (delay > 0) {
                    window.setTimeout(() => g.finishComputerAction(), delay);
                } else {
                    g.finishComputerAction();
                }
                break;
            }

            case 'build': {
                // A Mason's Gauntlets charge makes a successful op FREE (no
                // AP drop) — gauge success on the charge counter too.
                const apBefore = unit.ap || 0;
                const chBefore = unit._buildCharges || 0;
                const delay = g.doBuildAction(unit, action.x, action.y, action.tool) || 0;
                const spent = (unit.ap || 0) < apBefore || (unit._buildCharges || 0) !== chBefore;
                if (!spent && delay <= 0) {
                    unit.ap = 0;
                    unit._aiLoopCount = 0;
                    g.finishComputerAction();
                } else if (delay > 0) {
                    window.setTimeout(() => g.finishComputerAction(), delay);
                } else {
                    g.finishComputerAction();
                }
                break;
            }

            case 'altitude': {
                const apBefore = unit.ap || 0;
                const delay = g.doAltitudeChange(unit, action.mode) || 0;
                const apAfter = unit.ap || 0;
                if (apAfter >= apBefore) {
                    unit.ap = 0;
                    unit._aiLoopCount = 0;
                    g.finishComputerAction();
                } else if (delay > 0) {
                    window.setTimeout(() => g.finishComputerAction(), delay);
                } else {
                    g.finishComputerAction();
                }
                break;
            }

            case 'nexus_channel': {
                const apBefore = unit.ap || 0;
                if (typeof g.channelNexus === 'function') {
                    g.channelNexus(unit);
                } else {
                    unit.ap = 0;
                }
                const apAfter = unit.ap || 0;
                if (apAfter >= apBefore) _failedNexus = true;
                g.finishComputerAction();
                break;
            }

            case 'recall': {
                if (typeof g.doRecall === 'function') {
                    g.doRecall(unit);
                } else {
                    unit.ap = 0;
                }
                g.finishComputerAction();
                break;
            }

            default:
                console.warn('AI: unknown action type', action.type);
                unit.ap = 0;
                g.finishComputerAction();
        }
    }

    // ── area helpers (AI mirrors of battle.js shapes) ────────────────────
    function getSquareArea(cx, cy, radius) {
        const tiles = [];
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                tiles.push({ x: cx + dx, y: cy + dy });
            }
        }
        return tiles;
    }
    function getRoundArea(cx, cy, radius) {
        const tiles = [];
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (radius > 0 && Math.abs(dx) === radius && Math.abs(dy) === radius) continue;
                tiles.push({ x: cx + dx, y: cy + dy });
            }
        }
        return tiles;
    }
    function getSpellAoeAreaAI(spell, cx, cy) {
        if (typeof aoeMaskValid === 'function' && aoeMaskValid(spell.aoeMask)) return aoeMaskTiles(spell.aoeMask, cx, cy);   // THE AOE MASK (§4.7) replaces the radius / shape
        const r = spell.aoeRadius || 1;
        if (spell.aoeShape === 'round') return getRoundArea(cx, cy, r);
        if (spell.aoeShape === 'diamond') {
            return getSquareArea(cx, cy, r).filter(t => Math.abs(t.x - cx) + Math.abs(t.y - cy) <= r);
        }
        if (spell.aoeShape === 'ring') {
            return getSquareArea(cx, cy, r).filter(t => Math.max(Math.abs(t.x - cx), Math.abs(t.y - cy)) === r);
        }
        return getSquareArea(cx, cy, r);
    }
    /* The splash-count test around a struck target: is `e` inside the row's mask (centre = the target), else its aoeRadius box? */
    function _aoeSplashTestAI(spell, target) {
        if (typeof aoeMaskValid === 'function' && aoeMaskValid(spell.aoeMask)) {
            const keys = new Set(aoeMaskTiles(spell.aoeMask, target.x, target.y).map(t => t.x + ',' + t.y));
            return (e) => keys.has(e.x + ',' + e.y);
        }
        const r = spell.aoeRadius;
        return (e) => Math.abs(e.x - target.x) <= r && Math.abs(e.y - target.y) <= r;
    }
    /* The plain-square sites' footprint: the mask when the row draws one, else the r-square (unclipped, like getSquareArea). */
    function _aoeTilesAI(spell, cx, cy, r) {
        if (spell && typeof aoeMaskValid === 'function' && aoeMaskValid(spell.aoeMask)) return aoeMaskTiles(spell.aoeMask, cx, cy);
        return getSquareArea(cx, cy, r);
    }

    /* ── SIMUL MODE planner exports (battle.js SimulEngine) ──────────────
       Simul needs the AI's PLANNING half without its EXECUTION half:
       score one unit's candidates from the current board without touching
       state. Resets the per-turn module state a normal activation resets
       on its first loop. */
    window._aiPlanCandidates = function (unit) {
        if (!unit || unit.dead) return [];
        _failedSpells = new Set();
        _failedCombos = new Set();
        _skipAttack = false;
        _skipTowerAttack = false;
        _skipMove = false;
        _skipJump = false;
        _failedNexus = false;
        _failedItems = new Set();
        _skipClimb = false;
        _turnActionLog = [];
        _outputCache = new Map();
        try {
            const vision = buildVision(unit);
            // Simul used to bypass final danger/ranking entirely, so a lead
            // policy in rankCandidates never reached its actual planner.
            const mode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
            if (mode?.isSimul) {
                const ranked = rankCandidates(unit, vision);
                return ranked.best ? [ranked.best, ...ranked.candidates.filter(c => c !== ranked.best)] : ranked.candidates;
            }
            const cands = gatherCandidates(unit, vision) || [];
            return cands.slice().sort((a, b) => (b.score || 0) - (a.score || 0));
        } catch (e) {
            console.warn('[AI] _aiPlanCandidates failed:', e);
            return [];
        }
    };

    console.log('[AI] Entropy Wars tactical AI v4 loaded — one brain, one currency (see AI_REDESIGN.md).');
})();
