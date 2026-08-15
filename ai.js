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
//      height soak, Tank bulwark, status damage-taken mults. Kill checks
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
    let _failedNexus = false;
    let _failedItems = new Set();

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
        easy:   { pickTopN: 3, softmaxT: 60, combos: false, press: false, jointSearch: false, objectiveMult: 1.0 },
        normal: { pickTopN: 1, softmaxT: 0,  combos: true,  press: true,  jointSearch: true,  objectiveMult: 1.0 },
        hard:   { pickTopN: 1, softmaxT: 0,  combos: true,  press: true,  jointSearch: true,  objectiveMult: 1.3 },
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
    function _aiDiff() { return AI_DIFFICULTY_PROFILES[_aiDifficultyKey()]; }
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
    const AI_TUNE = {
        // ── value model ──
        killBase: 70,               // flat premium for removing a unit (on top of its denied output)
        killOutputTurns: 1.6,       // turns of the victim's output a kill denies (they'd respawn/act ~1.6 more times near-term)
        supportKillPremium: 130,    // extra for killing a healer/reviver kit
        mpValuePerPoint: 0.5,       // HP-equivalent value of 1 MP (opportunity cost of casting; 0.9 caused MP hoarding — 59% of sim units ended matches >90% MP)
        pressActionValue: 150,      // floor value of the free action a press refund grants
        overkillWaste: 1.0,         // damage past the target's effective HP is worth 0 (cap factor)
        focusCommitBonus: 90,       // bonus for hitting the team's shared focus target
        woundedPileOn: 0.35,        // × missing HP added to target priority (finish jobs)
        healSafetyDiscount: 0.45,   // heal value multiplier when the target is out of enemy reach
        healNoEnemyDiscount: 0.35,  // heal value multiplier when no enemy is even visible
        reviveBase: 320,            // reviving a unit ≈ a kill in reverse
        ccOutputFactor: 0.8,        // fraction of a denied unit's per-turn output a hard CC is worth per denied turn
        statusSetupFactor: 0.5,     // fraction of a teammate's bonusVsStatus payoff credited to the setup cast
        buffStageFactor: 0.10,      // one offensive stat stage ≈ +10% of recipient output per remaining turn
        buffTurnsHorizon: 2.2,      // expected turns a buff stays relevant
        delayedEscapeStatic: 0.35,  // P(target still in blast) for ground-tile delayed casts
        delayedEscapeTracking: 0.75,// P for unit-tracking delayed marks
        threatCostFactor: 0.25,     // fraction of expected incoming damage charged to a tile (0.35 made both AIs too timid to ever close — mutual standoff)
        deathRiskFactor: 0.9,       // × own kill-value charged when a tile's threat covers our whole HP bar
        jointSearchDiscount: 0.92,  // move-then-act value discount vs acting right now
        // ── kept legacy knobs (movement / modes / items) ──
        markedTargetBonus: 12,
        hourglassTargetBonus: 45,
        hgCarrierFleeAdv: -0.23,
        safeAllyProximity: 4,
        towerLowHpPush: 120,
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
        moveHighGroundMelee: 7,
        moveRetreatHeight: 8,
        landToChannelBonus: 70,
        flyEscapeMeleeBonus: 30,
        flyRangedHeightBonus: 50,
    };

    // ── spell-kind taxonomies ────────────────────────────────────────────
    const DMG_KINDS = new Set(['damage', 'ricochet', 'multiHit', 'aoe', 'barrage',
        'lifeDrain', 'line', 'linePush', 'cross', 'aoePull', 'splitBeam',
        'displacement', 'pull', 'dash', 'skyDrop', 'skyThrow', 'skySlam', 'leapStrike']);
    // Kinds that participate in Press Turn (battle.js _PRESS_SPELL_KINDS).
    const PRESS_KINDS = new Set(['damage', 'multiHit', 'ricochet', 'lifeDrain',
        'line', 'linePush', 'splitBeam', 'aoe', 'barrage', 'cross', 'aoePull']);
    const SPLASH_KINDS = new Set(['aoe', 'cross', 'barrage']);
    const HEAL_KINDS = new Set(['heal', 'healAll', 'selfHeal', 'revive', 'zoneHeal', 'seedHeal']);
    // Hard CC = the target loses control of (part of) its turn.
    const HARD_CC = new Set(['stun', 'sleep', 'freeze', 'frozen', 'charm', 'stagger']);

    // ── per-turn action memory (anti-loop, target spreading) ─────────────
    let _turnActionLog = [];
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
            if (g.unitHasStatus && g.unitHasStatus(tg, 'invisible')
                && !g.unitHasStatus(tg, 'marked')) {
                if (typeof g.isUnitConcealedFrom !== 'function') return true;
                if (g.isUnitConcealedFrom(tg, viewerPlayer)) return true;
            } else if (typeof g.isUnitConcealedFrom === 'function'
                && g.isUnitConcealedFrom(tg, viewerPlayer)) return true;
            if (g.state.fogOfWar && typeof g.isUnitSeenByTeam === 'function'
                && !g.isUnitSeenByTeam(tg, viewerPlayer)) return true;
        } catch (e) {}
        return false;
    }
    // Protected (invulnerable) targets block ALL damage and count as a
    // press MISS — never shoot into Protect.
    function isProtected(g, tg) {
        try { return !!(g.unitHasStatus && g.unitHasStatus(tg, 'protect')); } catch (e) { return false; }
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
        if (u.cls === 'Black Mage') p += 8;   // Arcane Surge (data.js JOB_PASSIVES)
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
        // fallback: 0.25 × the matching defense stat at cap
        const stat = damageType === 'magic' ? (tg.mdef || 0) : (tg.def || 0);
        return Math.floor(stat * 0.25);
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
    function estDamage(g, unit, tg, sp, opts) {
        opts = opts || {};
        if (!tg || tg.dead) return 0;
        if (isProtected(g, tg)) return 0;

        // Element-drinking passives (Thermal Regen): a spell whose element
        // the target HEALS from is worth zero — never "damage" a kaiju
        // with fire.
        if (sp && typeof unitPassiveValue === 'function' && typeof classifySpellElement === 'function') {
            try {
                const _drink = unitPassiveValue(tg, 'healedByElement');
                if (_drink && classifySpellElement(sp) === _drink) return 0;
            } catch (e) {}
        }

        const fromX = opts.fromX != null ? opts.fromX : unit.x;
        const fromY = opts.fromY != null ? opts.fromY : unit.y;
        const myH = opts.fromH != null ? opts.fromH : standH(g, unit);
        const tgH = standH(g, tg);
        const dist = Math.abs(fromX - tg.x) + Math.abs(fromY - tg.y);

        let raw, damageType, ignoreArmor = false;
        if (sp) {
            raw = _baseSpellDmg(sp);
            if (raw <= 0) return 0;
            raw += _spellPowerOf(g, unit, sp);
            damageType = sp.damageType === 'magic' ? 'magic' : 'physical';
            ignoreArmor = !!sp.ignoreArmor;
        } else {
            // doAttack: max(24, floor(pwrAtk×0.65) ± 8) + attackBonus + hourglass
            raw = Math.max(24, Math.floor(_pwrAtk(unit) * 0.65));
            try { raw += g.getEffectiveAttackBonus(unit) || 0; } catch (e) {}
            try { raw += g.getHourglassPower(unit) || 0; } catch (e) {}
            damageType = 'physical';
        }
        // applyDamageToUnit adds the axis attack bonus for enemy hits.
        if (sp) {
            try { raw += g.getEffectiveAttackBonus(unit, damageType === 'magic' ? 'magic' : 'physical') || 0; } catch (e) {}
        }

        // ── the capped offensive product ──
        let offMult = 1;
        try { offMult *= (typeof getTypeDamageMultiplier === 'function')
            ? (getTypeDamageMultiplier(unit, tg, sp ? (sp.spellType || null) : null) || 1) : 1; } catch (e) {}
        if (!ignoreArmor && myH > tgH) offMult *= 1 + 0.1 * (myH - tgH);      // downhill
        offMult *= _rangeMult(unit, dist);                                    // range profile
        if (sp && sp.bonusVsStatus && _bonusVsMatches(tg, sp.bonusVsStatus)) {
            offMult *= (sp.bonusVsStatus.mult || 1.5);                        // status combo
        }
        offMult = Math.min(offMult, 3.0);                                     // MAX_OFFENSIVE_MULT
        let est = raw * offMult;

        // Facing arc on basic attacks (applied engine-side in doAttack,
        // outside the capped product): ×1.25 back, ×1.10 flank.
        let arc = 'front';
        if (!sp) {
            try {
                arc = g.getAttackArc({ x: fromX, y: fromY }, tg) || 'front';
                est *= g.getFacingDamageMult(arc) || 1;
            } catch (e) {}
        }

        // Marked: +40 flat on physical hits (consumed — count once).
        try {
            if (damageType === 'physical' && g.unitHasStatus(tg, 'marked')) {
                est += (tg.markBonus || 40);
            }
        } catch (e) {}

        // Level magnitude / pace / gap.
        est *= _offScale(unit, tg);

        // Mitigation (defense-scaled armor; flat height soak; Tank bulwark).
        if (!ignoreArmor) {
            const ds = _defScale(tg);
            est -= Math.round(_armorOf(tg, damageType) * ds);
            if (tgH > myH) est -= 5 * (tgH - myH);
            if (tg.cls === 'Tank') est -= Math.round(8 * ds);
        }
        if (est < 1) est = 1;

        // Status damage-taken multipliers (guard, vulnerability marks…).
        try {
            if (typeof getStatusDamageTakenMultiplier === 'function') {
                const m = getStatusDamageTakenMultiplier(tg);
                if (m && m !== 1) est *= m;
            }
        } catch (e) {}

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
    // The turn's FIRST weakness-hit or crit refunds +2 AP (one full free
    // action); a resisted hit / whiff drains an extra AP. Detected off the
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
        // Only the turn's FIRST press refunds — after that it vents to the
        // entropy gauge (still nice, worth a sliver, not a whole action).
        const alreadyPressed = (unit._pressGainedThisTurn || 0) > 0;
        const tier = _pressTier(unit, tg, opts.spellType || null);
        const critP = (opts.canCrit && typeof g.getCritChance === 'function')
            ? (g.getCritChance(unit) || 0) : 0;
        const landP = opts.landP != null ? opts.landP : 1;
        const refund = Math.max(AI_TUNE.pressActionValue, (wght(g, 'pressRefundValue_v1', 96) || 0) * 1.5);
        const pressP = Math.min(1, landP * (tier > 0 ? 1 : critP));
        let v = 0;
        if (pressP > 0) v += pressP * (alreadyPressed ? refund * 0.15 : refund);
        if (tier < 0) v -= refund * 0.55;          // resist drains an extra AP
        if (landP < 1) v -= (1 - landP) * refund * 0.4;   // whiff drains too
        return v;
    }
    function wght(g, key, dflt) {
        try { const v = g.getAIWeight(key); return (v == null || isNaN(v)) ? dflt : v; } catch (e) { return dflt; }
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

    // Value of REMOVING tg from the board (the kill premium, added on top
    // of the damage that does it).
    function killValue(g, unit, tg, v) {
        let val = AI_TUNE.killBase + AI_TUNE.killOutputTurns * unitThreatOutput(g, tg, unit);
        if (unitIsHealerKit(tg)) val += AI_TUNE.supportKillPremium;
        val += Math.min(150, (tg.intStat || tg.int || 0) * 1.2);   // big casters
        if ((tg.hourglasses || 0) > 0) val += AI_TUNE.hourglassTargetBonus + tg.hourglasses * 12;
        // Kills are uncapped points in TDM/FFA/arena composite scoring.
        try {
            const mode = (typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null);
            if (mode && (mode.id === 'tdm' || mode.id === 'ffa' || mode.id === 'arena')) val += 60;
        } catch (e) {}
        val += wght(g, 'killBonusScore_v1', 97);
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
            reality = AI_TUNE.healSafetyDiscount;
            for (const e of enemies) {
                let er = 1, em = 2;
                try { er = g.getEffectiveRange(e) || (e.range || 1); } catch (q) {}
                try { em = g.getEffectiveMove(e) || (e.move || 2); } catch (q) {}
                if (_dist(g, tg.x, tg.y, tg.z, e) <= em * 2 + er) { reality = 1; break; }
            }
        }
        let val = actual * urgency * reality;
        if ((tg.hourglasses || 0) > 0 && frac < 0.6) val += 40;
        return val;
    }

    // Value of denying tg's actions with status `id` for `dur` rounds.
    function ccDenialValue(g, unit, tg, id, dur, v) {
        if (!tg || tg.dead) return 0;
        try { if (g.unitHasStatus(tg, id)) return 0; } catch (e) {}
        const output = unitThreatOutput(g, tg, unit);
        const turns = Math.min(dur || 1, 2);
        const notYetActed = (tg.ap || 0) > 0 ? 1 : 0.45;   // denying a spent unit is worth less
        if (HARD_CC.has(id)) {
            let val = AI_TUNE.ccOutputFactor * output * turns * notYetActed;
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
        if (id === 'blind') return 0.4 * output * turns;
        if (id === 'burn' || id === 'poison') {
            let dot = 30;
            try {
                const defs = (typeof STATUS_DEFS !== 'undefined') ? STATUS_DEFS : (G().STATUS_DEFS || {});
                dot = (defs[id] && defs[id].dotDamage) || 30;
            } catch (e) {}
            return dot * (dur || 2) * _offScale(unit, tg) * 0.8;
        }
        if (id === 'marked') return 45;
        if (id === 'discord') return 70;
        if (id === 'glare') return 35;
        if (id === 'soaked') return 30;
        return 25;
    }

    // Setup credit: applying status `id` to tg unlocks every teammate
    // spell carrying bonusVsStatus[id] (×1.5 payoff next turn).
    function statusSetupValue(g, unit, tg, id, v) {
        if (!tg || tg.dead) return 0;
        let total = 0;
        const team = g.state.units.filter(u => u.player === unit.player && !u.dead && u.hp > 0);
        for (const mate of team) {
            for (const sp of (mate.spells || [])) {
                if (!sp || !sp.bonusVsStatus) continue;
                const ids = [].concat(sp.bonusVsStatus.status || []);
                if (!ids.includes(id)) continue;
                if ((mate.mp || 0) < _mpCost(mate, sp)) continue;
                // Can the payoff caster plausibly collect next activation?
                let er = sp.range || 1, em = 2;
                try { er = g.getEffectiveSpellRange(mate, sp) || er; } catch (e) {}
                try { em = g.getEffectiveMove(mate) || (mate.move || 2); } catch (e) {}
                if (_dist(g, mate.x, mate.y, mate.z, tg) > em + er + 1) continue;
                const payoff = estDamage(g, mate, tg, sp);
                total += AI_TUNE.statusSetupFactor * payoff * ((sp.bonusVsStatus.mult || 1.5) - 1);
                break;   // one payoff per teammate is enough credit
            }
        }
        return Math.min(220, total);
    }

    // Value of the status riders on an offensive/utility cast.
    function statusRiderValue(g, unit, tg, spell, v) {
        let val = 0;
        for (const eff of (spell.statusEffects || [])) {
            if (!eff || !eff.id) continue;
            const p = Math.max(0.05, Math.min(0.95, eff.chance != null ? eff.chance : 0.9));
            val += p * (ccDenialValue(g, unit, tg, eff.id, eff.duration || 1, v)
                      + statusSetupValue(g, unit, tg, eff.id, v));
        }
        if (spell.statStageBoost) {
            // offensive casts carrying stat DEBUFF stages
            const stages = Object.values(spell.statStageBoost).reduce((n, st) => n + Math.abs(st || 0), 0);
            val += stages * 0.12 * unitThreatOutput(g, tg, unit);
        }
        return val;
    }

    // Value of buff stages on ally `tg`.
    function buffStageValue(g, unit, tg, spell, v) {
        const boost = spell.statStageBoost || {};
        const output = unitThreatOutput(g, tg, unit);
        let val = 0;
        const horizon = AI_TUNE.buffTurnsHorizon;
        for (const k of Object.keys(boost)) {
            const stages = Math.abs(boost[k] || 0);
            if (!stages) continue;
            if (k === 'atk' || k === 'int') {
                // only credit the axis the recipient actually uses
                const physKit = (tg.atk || 0) >= (tg.intStat || tg.int || 0);
                const axisFits = (k === 'atk') === physKit;
                val += stages * AI_TUNE.buffStageFactor * output * horizon * (axisFits ? 1 : 0.25);
            } else if (k === 'def' || k === 'mdef') {
                val += stages * 30 * horizon * 0.5;
            } else {
                val += stages * 25;
            }
        }
        // stage headroom: stacking past +5 is wasted
        try {
            const cur = tg.statStages || {};
            const overStacked = Object.keys(boost).every(k => (cur[k] || 0) >= 5);
            if (overStacked) return 0;
        } catch (e) {}
        return val;
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
        if (v && v.focus && target.id === v.focus.id) priority += AI_TUNE.focusCommitBonus;
        const dmgLog = getTeamDamageLog();
        const priorDmg = dmgLog[target.id] || 0;
        if (priorDmg > 0) {
            priority += 40;
            if (target.hp <= priorDmg + 20) priority += 60;
        }
        priority += AI_TUNE.woundedPileOn * Math.max(0, (target.maxHp || 0) - (target.hp || 0)) * 0.35;
        const hpPct = target.hp / (target.maxHp || 1);
        if (hpPct < 0.25) priority += 50;
        else if (hpPct < 0.5) priority += 25;

        if ((target.hourglasses || 0) > 0) priority += AI_TUNE.hourglassTargetBonus + target.hourglasses * 10;

        const _mpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
        const _modeId = _mpMode ? _mpMode.id : 'arena';
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

        const allies = g._isFFA()
            ? []
            : g.aliveUnitsFor(player).filter(a => a.id !== unit.id);

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
    function makeThreatFn(g, unit, enemies) {
        const info = [];
        for (const e of enemies) {
            if (isProtected(g, e)) continue;
            let er = 1, em = 2;
            try { er = g.getEffectiveRange(e) || (e.range || 1); } catch (q) { er = e.range || 1; }
            try { em = g.getEffectiveMove(e) || (e.move || 2); } catch (q) { em = e.move || 2; }
            let dmg = estDamage(g, e, unit, null);
            let bestR = er;
            let silenced = false;
            try { silenced = g.unitHasStatus(e, 'silence'); } catch (q) {}
            if (!silenced) {
                for (const sp of (e.spells || [])) {
                    if (!sp || !DMG_KINDS.has(sp.kind)) continue;
                    if ((e.mp || 0) < _mpCost(e, sp)) continue;
                    const d2 = estDamage(g, e, unit, sp);
                    if (d2 > dmg) dmg = d2;
                    let sr = sp.range || 1;
                    try { sr = g.getEffectiveSpellRange(e, sp) || sr; } catch (q) {}
                    if (sr > bestR) bestR = sr;
                }
            }
            info.push({ e, reach: em + bestR, dmg });
        }
        return (tx, ty, tz) => {
            let total = 0, count = 0;
            for (const i of info) {
                if (_dist(g, tx, ty, tz, i.e) <= i.reach) { total += i.dmg; count++; }
            }
            return { totalDmg: total, count };
        };
    }

    // Net cost of ENDING the activation on (x,y): expected incoming damage
    // (fractionally — not everyone shoots at us) plus a death-risk premium
    // when the tile's total threat covers our whole HP bar, plus hazard
    // ground. Subtracted from every candidate by endTileCost() below.
    function tileDangerCost(g, unit, v, x, y, z) {
        const t = v.threatFn(x, y, z);
        let cost = t.totalDmg * AI_TUNE.threatCostFactor;
        const mine = effHp(unit);
        if (t.totalDmg >= mine && t.count >= 1 && mine > 0) {
            cost += AI_TUNE.deathRiskFactor *
                (AI_TUNE.killBase + AI_TUNE.killOutputTurns * unitThreatOutput(g, unit, v.closestEnemy || unit));
        }
        // Fragile units fear crowded pockets more.
        const hpFrac = unit.hp / (unit.maxHp || 1);
        if (hpFrac < 0.4) cost += t.totalDmg * 0.3;
        cost += aiHazardPenaltyAt(unit, x, y) * 2;
        return cost;
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

        const myHG = isFFA
            ? (unit.hourglasses || 0)
            : g.state.units.filter(u => u.player === player && !u.dead)
                .reduce((s, u) => s + (u.hourglasses || 0), 0);
        const enemyHG = isFFA
            ? g.state.units.filter(u => u.id !== unit.id && !u.dead)
                .reduce((s, u) => s + (u.hourglasses || 0), 0)
            : g.state.units.filter(u => u.player === enemy && !u.dead)
                .reduce((s, u) => s + (u.hourglasses || 0), 0);
        const hgTarget = g.state.hourglassTarget || 5;

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
        const roundUrgency = round >= 40 ? 3 : round >= 25 ? 2 : round >= 15 ? 1 : 0;

        let phase = 'even';
        if (myHG >= hgTarget - 1) phase = 'hg_winning';
        else if (enemyHG >= hgTarget - 1) phase = 'hg_losing';
        else if (ownTowerPct < 0.3) phase = 'tower_defend';
        else if (enemyTowerPct < 0.5) phase = 'tower_push';
        else if (enemyDeadCount >= 2) phase = 'tower_push';
        else if (enemyDeadCount >= 1 && myAlive >= enemyAlive + 1) phase = 'tower_push';
        else if (myAlive >= enemyAlive + 2) phase = 'tower_push';
        else if (myAlive > enemyAlive) phase = 'numbers_advantage';
        else if (roundUrgency >= 2) phase = 'numbers_advantage';
        else if (enemyAlive >= myAlive + 2) phase = 'numbers_disadvantage';

        return {
            myHG, enemyHG, hgTarget,
            ownTowerPct, enemyTowerPct,
            myAlive, enemyAlive,
            enemyDeadCount, enemyMinRespawn, enemyImminentRespawns,
            roundUrgency, phase,
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
            if (Math.abs(x - ds.x) <= r && Math.abs(y - ds.y) <= r) {
                pen += Math.max(60, Math.min(140, ds.dmg || 100));
            }
        }
        const terr = typeof g.getTerrainAt === 'function' ? g.getTerrainAt(x, y) : null;
        if (terr === 'lava' && !(typeof unitIsLavaAdapted === 'function' && unitIsLavaAdapted(unit))) pen += 90;
        else if (terr === 'deep_water' && !(typeof unitIsDeepWaterAdapted === 'function' && unitIsDeepWaterAdapted(unit))) pen += 60;
        else if (terr === 'poison' || terr === 'scorched') pen += 30;
        if (typeof _tileIsBurning === 'function' && _tileIsBurning(x, y)) pen += 45;
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
    // MAIN LOOP — safety scaffolding kept from v3 (loop caps, stall
    // detection, failed-action memos); the decision pipeline is new:
    //   gather → per-candidate adjustments → end-tile danger → argmax
    //   (difficulty softmax on easy) → execute.
    // ═════════════════════════════════════════════════════════════════════

    window.aiTakeTurn = function (unit) {
        const g = G();
        if (!g) { console.error('GAME API not available'); return; }

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
            _failedNexus = false;
            _failedItems = new Set();
            _turnActionLog = [];
            _outputCache = new Map();
            unit._aiStallCount = 0;
        }

        // Gauntlet: a badly-hurt unit retreats to the bench, sending in a
        // fresh reserve (which then acts with the leftover AP).
        if (unit._aiLoopCount === 1 && typeof window._isGauntlet === 'function' && window._isGauntlet()) {
            const mpm = typeof window.getActiveMultiplayerMode === 'function' ? window.getActiveMultiplayerMode() : null;
            const switchCost = (mpm && mpm.switchApCost) || 2;
            const reserves = typeof window._gauntletReserves === 'function' ? window._gauntletReserves(unit.player) : [];
            const hpPct = unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
            if ((unit.ap || 0) >= switchCost && hpPct < 0.30 && reserves.length) {
                const healthy = reserves.slice().sort((a, b) => (b.hp / b.maxHp) - (a.hp / a.maxHp))[0];
                if (healthy && (healthy.hp / healthy.maxHp) >= 0.70
                    && typeof window.doSwitch === 'function' && window.doSwitch(unit, healthy.id)) {
                    unit._aiLoopCount = 0;
                    g.finishComputerAction();
                    return;
                }
            }
        }

        g.focusUnitPanel(unit.id);
        if (g.state.autoPlayers?.[unit.player]) g.scheduleBoardRender();
        if (!g.state.cameraDisabled && !g.devAutoSim && g._shouldCameraFollowUnit(unit)) {
            g.focusBoardCameraOnTiles([{ x: unit.x, y: unit.y }], {
                holdMs: 99999, persist: true, transitionMs: 500,
                _fogAllowed: true
            });
        }

        const vision = buildVision(unit);
        const candidates = gatherCandidates(unit, vision);

        // ── per-candidate adjustments ──
        for (const c of candidates) {
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
                const nonRepeatableKinds = ['swap', 'terrainCreate', 'summonWeather', 'deployObject',
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
            const endX = (c.type === 'move' && c.x != null) ? c.x : unit.x;
            const endY = (c.type === 'move' && c.y != null) ? c.y : unit.y;
            const endZ = (c.type === 'move' && c.z != null) ? c.z : unit.z;
            if (c._dangerCost == null) c._dangerCost = tileDangerCost(g, unit, vision, endX, endY, endZ);
            c.score -= c._dangerCost;
        }

        candidates.sort((a, b) => b.score - a.score);
        let best = candidates[0];

        // FE rule: kills trump accumulated niceness. If a confirmed kill is
        // anywhere near the best candidate's score, take the kill — removed
        // units stop doing damage; "nice position" doesn't.
        if (best && best.score > 0) {
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
            const pool = candidates.slice(0, _diffPick.pickTopN).filter(c => c.score > 0);
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
                const moveTiles = g.TargetQuery.moveTiles(unit);
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
                        const cost = tileDangerCost(g, unit, vision, t.x, t.y, t.z)
                            + (recent.has(g.posKey(t.x, t.y)) ? 40 : 0)
                            + (Math.abs(t.x - _obj.x) + Math.abs(t.y - _obj.y)) * 3;
                        if (cost < pickCost) { pickCost = cost; pick = t; }
                    }
                    if (pick) best = { type: 'move', x: pick.x, y: pick.y, z: pick.z, score: 1 };
                }
            }
            if (!best || best.score <= 0) {
                if ((unit.ap || 0) >= g.AP_COST_ACTION) {
                    const inspTiles = g.getInspectTiles(unit);
                    if (inspTiles.length > 0) {
                        const unscanned = inspTiles.filter(t =>
                            !g.state.scannedByPlayer[unit.player].has(g.scanKey(t.x, t.y))
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
    // CANDIDATE GENERATION
    // ═════════════════════════════════════════════════════════════════════

    function gatherCandidates(unit, v) {
        const candidates = [];
        scoreEntropyStrike(unit, v, candidates);
        scoreItems(unit, v, candidates);
        scoreAttacks(unit, v, candidates);
        scoreTowerAttack(unit, v, candidates);
        scoreSpells(unit, v, candidates);
        scoreCombos(unit, v, candidates);
        scoreDetonate(unit, v, candidates);
        scoreMoves(unit, v, candidates);
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
        if (est <= 0) return { est: 0, val: 0 };
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
                spellType: sp ? (sp.spellType || null) : null,
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
            let score = hit.val;

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
                if (s > 0) out.push({ type: 'attack', target: { x: o.x, y: o.y }, score: s, _objectAttack: true });
            }
        }
    }

    function scoreTowerAttack(unit, v, out) {
        const g = G();
        if ((unit.ap || 0) < g.AP_COST_ACTION || _skipTowerAttack) return;
        const tower = v.enemyTower;
        if (!tower || tower.hp <= 0) return;

        const tDist = Math.abs(unit.x - tower.x) + Math.abs(unit.y - tower.y);
        const effRange = v.effRange;
        if (tDist < 1 || tDist > effRange) return;
        if (g.isRangeBlockedByTerrain(unit.x, unit.y, tower.x, tower.y)) return;

        const estDmg = Math.max(24, Math.floor(_pwrAtk(unit) * 0.65) + (g.getEffectiveAttackBonus(unit) || 0) + (g.getHourglassPower(unit) || 0));

        // Tower damage IS win-condition currency: the base bonus makes chip
        // damage on the objective competitive with chip damage on units.
        let score = estDmg + wght(g, 'towerBaseBonus_v1', 39) * 3;

        if (tower.hp <= estDmg * 3) score += AI_TUNE.towerLowHpPush * 3;
        else if (tower.hp <= tower.maxHp * 0.5) score += AI_TUNE.towerMidHpPush;

        const groundEnemies = v.visibleEnemies.filter(e =>
            Math.abs(e.x - tower.x) + Math.abs(e.y - tower.y) <= 6
        );
        if (groundEnemies.length === 0) score += AI_TUNE.towerClearBonus;
        else if (groundEnemies.length === 1) score += 60;

        const ws = v.winState;
        if (ws.enemyDeadCount >= 2) score += 300;
        else if (ws.enemyDeadCount >= 1) score += 160;
        if (ws.enemyMinRespawn >= 6) score += 300;
        else if (ws.enemyMinRespawn >= 4) score += 200;
        else if (ws.enemyMinRespawn >= 3) score += 130;
        else if (ws.enemyMinRespawn >= 2) score += 60;
        if (ws.enemyImminentRespawns > 0) score -= 40 * ws.enemyImminentRespawns;
        if (ws.phase === 'tower_push') score += 320;
        if (ws.phase === 'numbers_advantage') score += 180;
        score += ws.roundUrgency * 100;

        out.push({ type: 'attack_tower', towerX: tower.x, towerY: tower.y, score });
    }

    function scoreItems(unit, v, out) {
        const g = G();
        const ap = unit.ap || 0;
        if (ap < g.AP_COST_ACTION) return;

        // Heal potion — valued exactly like a heal spell.
        if (unit.items?.healPotion > 0) {
            const allies = g.aliveUnitsFor(unit.player);
            let bestTarget = null, bestScore = 0;
            for (const ally of allies) {
                if (ally.dead || ally.hp >= ally.maxHp) continue;
                const hpPct = ally.hp / ally.maxHp;
                if (hpPct > 0.7) continue;
                // ITEM_RULES.healPotion heals ~35% of maxHp
                const rule = (g.ITEM_RULES || {}).healPotion || {};
                const amount = rule.healPct ? Math.floor(ally.maxHp * rule.healPct)
                    : (rule.heal || Math.floor(ally.maxHp * 0.35));
                const score = healValue(g, unit, ally, amount, v) + (ally.id === unit.id ? 20 : 0);
                if (score > bestScore) { bestScore = score; bestTarget = ally; }
            }
            if (bestTarget) out.push({ type: 'item_targeted', item: 'healPotion', target: bestTarget, score: bestScore });
        }

        // Mana potion — restored MP × the MP value constant, plus a bonus
        // when it unlocks casts the ally couldn't afford.
        if (unit.items?.manaPotion > 0) {
            const allies = g.aliveUnitsFor(unit.player);
            let bestTarget = null, bestScore = 0;
            for (const ally of allies) {
                if (ally.dead || (ally.maxMp || 0) <= 0) continue;
                if (ally.mp >= ally.maxMp * 0.55) continue;
                const mpRestore = Math.max(1, Math.floor((ally.maxMp || 0) * 0.35));
                const mpAfter = Math.min(ally.maxMp, ally.mp + mpRestore);
                let unlocked = 0, bestUnlock = 0;
                for (const spell of (ally.spells || [])) {
                    if (!spell || !spell.cost || spell.cost <= 0 || spell.kind === 'scan') continue;
                    const _mc = _mpCost(ally, spell);
                    if (ally.mp < _mc && mpAfter >= _mc) {
                        unlocked++;
                        const val = DMG_KINDS.has(spell.kind) ? estDamage(g, ally, v.closestEnemy || unit, spell)
                            : (HEAL_KINDS.has(spell.kind) ? 120 : 60);
                        if (val > bestUnlock) bestUnlock = val;
                    }
                }
                let score = AI_TUNE.mpPotionBase + (mpAfter - ally.mp) * AI_TUNE.mpValuePerPoint * 0.6;
                if (unlocked > 0) score += bestUnlock * 0.5 + unlocked * 15;
                if (ally.mp === 0 && (ally.spells || []).length) score += 60;
                if (score > bestScore) { bestScore = score; bestTarget = ally; }
            }
            if (bestTarget) out.push({ type: 'item_targeted', item: 'manaPotion', target: bestTarget, score: bestScore });
        }

        // Scanner — information value while hourglasses are hidden.
        if (unit.items?.scanner > 0 && g.getEffectiveAwr(unit) > 0) {
            const unrevHG = (g.state.hourglasses || []).filter(h =>
                h.carriedBy === null && !h.visibleTo[unit.player]
            ).length;
            if (unrevHG > 0) {
                let scanScore = wght(g, 'scannerPriority_v1', 12) * 3 + unrevHG * 20;
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

        // Bane throwables — real damage vs the matching type.
        const baneKeys = Object.keys(g.ITEM_RULES || {}).filter(k => g.ITEM_RULES[k].baneType);
        if (v.visibleEnemies.length > 0) {
            for (const baneKey of baneKeys) {
                if ((unit.items?.[baneKey] || 0) <= 0) continue;
                if (_failedItems.has(baneKey)) continue;
                const baneRule = g.ITEM_RULES[baneKey];
                const baneRange = g.getEffectiveRange(unit) + 2;
                for (const enemy of v.visibleEnemies) {
                    const dist = Math.max(Math.abs(unit.x - enemy.x), Math.abs(unit.y - enemy.y));
                    if (dist > baneRange) continue;
                    if (g.isRangeBlockedByTerrain(unit.x, unit.y, enemy.x, enemy.y)) continue;
                    const isEffective = (enemy.types || []).includes(baneRule.baneType);
                    const baseDmg = (baneRule.baseDmg + (isEffective ? baneRule.baneDmg : 0)) * _offScale(unit, enemy);
                    let score = Math.min(baseDmg, effHp(enemy));
                    if (baseDmg >= effHp(enemy)) score += killValue(g, unit, enemy, v);
                    score += getTargetPriority(enemy, unit, v) * 0.3;
                    if (!isEffective) score *= 0.45;
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
        out.push({ type: 'entropyStrike', score: 300 + targets.length * per * 0.8, _noDanger: true });
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
                if (est >= effHp(comboTarget)) score += killValue(g, unit, comboTarget, v) + wght(g, 'comboKillBonus_v1', 14);
                score += pressEV(g, unit, comboTarget, { spellType: combo.spellType || null });
            } else {
                score = ((combo.heal || 0)) * 1.0 * (synergy.mult || 1);
            }
            if (combo.statusEffects?.length && comboTarget) {
                score += statusRiderValue(g, unit, comboTarget, combo, v);
            }
            if (synergy.mult > 1) score += wght(g, 'comboSynergyBonus_v1', 24);
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
        for (const b of bombs) {
            for (const e of v.visibleEnemies) {
                if (Math.abs(e.x - b.x) + Math.abs(e.y - b.y) > (b.radius || 1)) continue;
                const raw = (b.dmg || 120) * _offScale(unit, e);
                total += Math.min(raw, effHp(e));
                if (raw >= effHp(e)) total += killValue(g, unit, e, v) * 0.8;
            }
        }
        if (total > 0) out.push({ type: 'detonate', score: total });
    }

    // ═════════════════════════════════════════════════════════════════════
    // SPELL SCORING — one dispatch, EVERY kind has a real handler, and the
    // generic fallback derives value from the spell's own data fields
    // instead of `return 5`. All values in the currency; MP is charged
    // uniformly at the end of scoreSpells.
    // ═════════════════════════════════════════════════════════════════════

    function scoreSpells(unit, v, out) {
        const g = G();
        const ap = unit.ap || 0;
        if (g.unitHasStatus(unit, 'silence')) return;

        for (const spell of (unit.spells || [])) {
            if (!spell) continue;
            if (_failedSpells.has(spell.name)) continue;
            const apCost = g.TargetQuery.apCost(spell);
            if (ap < apCost || !g.TargetQuery.canAfford(unit, spell) || unit.mp < _mpCost(unit, spell)) continue;

            const target = findSpellTarget(unit, spell, v);
            const noTargetKinds = ['healAll', 'manaRestoreAll', 'barrage', 'warCry', 'encore', 'deployTurret', 'utility',
                'escape', 'selfHeal', 'tuneFrequency', 'pulseLattice'];
            if (!target && !noTargetKinds.includes(spell.kind)) continue;

            let score = scoreSpell(unit, spell, target, v);
            if (score <= 0) continue;

            // MP is a real lever: every cast pays its cost in the currency.
            score -= _mpCost(unit, spell) * AI_TUNE.mpValuePerPoint;
            if (score <= 0) continue;

            out.push({ type: 'spell', spell, target, score, apCost });
        }
    }

    function scoreSpell(unit, spell, target, v) {
        const g = G();
        const kind = spell.kind;

        // ── single-target damage family ──
        if (['damage', 'ricochet', 'multiHit'].includes(kind)) {
            // Elemental tile cast: the target is a TILE the reaction makes
            // worthwhile (bolt the pool, torch the brush).
            if (target && target._elemTile) {
                return ((spell.dmg || 112) + _spellPowerOf(g, unit, spell)) * 0.8;
            }
            if (!target) return 0;
            return scoreOffensiveHit(g, unit, target, spell, v, {}).val;
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
            if (!victims.length) return 0;
            let s = 0, first = true;
            for (const e of victims) {
                const hit = scoreOffensiveHit(g, unit, e, spell, v, { splash: !first });
                s += hit.val;
                first = false;
            }
            return s;   // engine AoE never hits allies — no friendly-fire term
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
            const area = getSquareArea(target.x, target.y, spell.aoeRadius || 1);
            const victims = v.visibleEnemies.filter(e => area.some(t => t.x === e.x && t.y === e.y) && !isProtected(g, e));
            if (!victims.length) return 0;
            let s = 0, first = true;
            for (const e of victims) {
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
            // Beams fire along sign(target−caster) rays and stop at walls; a
            // target off the 8 rays can NEVER be hit.
            const adx = Math.abs(target.x - unit.x), ady = Math.abs(target.y - unit.y);
            const aligned = (adx === 0 || ady === 0 || adx === ady) && (adx + ady > 0);
            if (!aligned) return 0;
            const dx = Math.sign(target.x - unit.x), dy = Math.sign(target.y - unit.y);
            const len = spell.range || 4;
            let s = 0, hits = 0, first = true;
            for (let i = 1; i <= len; i++) {
                const tx = unit.x + dx * i, ty = unit.y + dy * i;
                if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) break;
                if (typeof g.isTerrainPassable === 'function' && !g.isTerrainPassable(tx, ty) && !spell.destroysObstacles) break;
                if (!spell.ignoresLineOfSight && typeof g.isRangeBlockedByTerrain === 'function'
                    && g.isRangeBlockedByTerrain(unit.x, unit.y, tx, ty, unit.z ?? null)) break;
                const e = v.visibleEnemies.find(en => en.x === tx && en.y === ty);
                if (e && !isProtected(g, e)) {
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
            const area = getSquareArea(target.x, target.y, spell.aoeRadius || 1);
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
                const aoeHits = v.visibleEnemies.filter(e =>
                    e.id !== target.id &&
                    Math.abs(e.x - target.x) <= spell.aoeRadius &&
                    Math.abs(e.y - target.y) <= spell.aoeRadius).length;
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
                const aoeHits = v.visibleEnemies.filter(e =>
                    e.id !== target.id &&
                    Math.abs(e.x - target.x) <= spell.aoeRadius &&
                    Math.abs(e.y - target.y) <= spell.aoeRadius).length;
                s += aoeHits * est * (spell.aoeDmgPct || 0.4) * 0.6;
            }
            return s;
        }

        // ── healing / support family ──
        if (kind === 'heal' && target) {
            const amt = spell.healAmt != null ? spell.healAmt : (spell.heal || 24);
            return healValue(g, unit, target, amt, v);
        }
        if (kind === 'healAll') {
            const allies = g.aliveUnitsFor(unit.player);
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
            const area = getSquareArea(target.x, target.y, spell.aoeRadius || 1);
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
            return AI_TUNE.reviveBase + 0.25 * (target.maxHp || 400);
        }
        if (kind === 'raiseDead') {
            if (!target) return 0;
            const nearEnemy = v.visibleEnemies.some(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 4);
            return nearEnemy ? 160 : 90;
        }

        if (kind === 'shield' && target) {
            const cur = target.shield || 0;
            const max = Math.floor((target.maxHp || 100) * (spell.shieldCapPct || 0.25));
            const gain = Math.max(0, Math.min(spell.shield || 12, max - cur));
            if (gain < 8) return 0;
            let reality = AI_TUNE.healNoEnemyDiscount;
            if (v.visibleEnemies.some(e => _dist(g, target.x, target.y, target.z, e) <= 8)) reality = 1;
            else if (v.visibleEnemies.length) reality = AI_TUNE.healSafetyDiscount;
            return gain * 0.9 * reality;
        }
        if (kind === 'aoeShield') {
            if (!target) return 0;
            const area = getSquareArea(target.x, target.y, spell.aoeRadius || 1);
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
                s += 35;   // regen/haste-style friendly riders
            }
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
            if (spell.teamStatusEffects) {
                const lockable = inRange.filter(a => !g.unitHasStatus(a, 'statLock'));
                const buffed = lockable.filter(a => a.statStages
                    && ['atk', 'def', 'mdef', 'spd', 'int'].some(k => (a.statStages[k] || 0) > 0));
                return buffed.length >= 2 ? 60 + buffed.length * 45 : (buffed.length === 1 ? 35 : 0);
            }
            let s = 0;
            for (const a of inRange) {
                if (a.statStages && (a.statStages.atk || 0) >= 5) continue;
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
            let s = 0;
            for (const e of (target.statusEffects || [])) {
                if (!e || !e.id) continue;
                if (['stun', 'sleep', 'freeze', 'frozen', 'silence', 'charm'].includes(e.id)) {
                    s += 0.6 * unitThreatOutput(g, target, v.closestEnemy || unit);
                } else if (['slow', 'root', 'stagger', 'jammed', 'blind', 'confuse'].includes(e.id)) {
                    s += 70;
                } else if (['poison', 'burn', 'discord', 'marked', 'glare', 'hexed'].includes(e.id)) {
                    s += 50;
                }
            }
            if (s <= 0) return 0;
            if ((target.hourglasses || 0) > 0) s += 60;
            return s;
        }

        // ── control family ──
        if (kind === 'debuff' && target) {
            let s = statusRiderValue(g, unit, target, spell, v);
            if (spell.statStageBoost) {
                const stages = Object.values(spell.statStageBoost).reduce((n, st) => n + Math.abs(st || 0), 0);
                s += stages * 0.1 * unitThreatOutput(g, target, unit);
            }
            if (spell.dmg) s += scoreOffensiveHit(g, unit, target, spell, v, { splash: true }).val * 0.8;
            s += getTargetPriority(target, unit, v) * 0.2;
            return s;
        }

        if (kind === 'zoneDebuff') {
            if (!target) return 0;
            const area = getSquareArea(target.x, target.y, spell.aoeRadius || 1);
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
                    s += 0.8 * statusSetupValue(g, unit, e, eff.id, v);
                }
                if (!spell.statusEffects || !spell.statusEffects.length) s += 45;
            }
            if (spell.gravityField === 'super') {
                const flyersCaught = caught.filter(e => typeof g.canFly === 'function' && g.canFly(e)).length;
                s += flyersCaught * 90;
            }
            s *= Math.min(spell.zoneDuration || 1, 3) * 0.55;
            if (v.enemyTower && v.enemyTower.hp > 0) {
                const tDist = Math.abs(v.enemyTower.x - target.x) + Math.abs(v.enemyTower.y - target.y);
                if (tDist <= 3) s += 50;
            }
            return s;
        }

        // ── mobility / utility family ──
        if (kind === 'teleport') return scoreTeleport(unit, spell, target, v);

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
            if (g.getEffectiveAwr(unit) <= 0) return 0;
            const unrev = (g.state.hourglasses || []).filter(h => h.carriedBy === null && !h.visibleTo[unit.player]).length;
            if (unrev === 0) return 0;
            let s = 40 + unrev * 20;
            if (v.winState.phase === 'hg_losing') s += 45;
            if ((g.state.round || 0) <= 12) s += 25;
            return s;
        }

        if (kind === 'remoteView') {
            // pure recon: mildly useful early under fog, useless otherwise
            if (!g.state.fogOfWar) return 0;
            return (g.state.round || 0) <= 6 ? 45 : 20;
        }

        // ── placement / terraforming family ──
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
            const active = (g.state._deployedObjects || []).filter(o => o.ownerUnitId === unit.id).length;
            if (active >= (spell.maxActivePerCaster || 2)) return 0;
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

        if (kind === 'placeTrap' && target) {
            const active = (g.state.traps || []).filter(t => t.casterUnitId === unit.id && t.trapType === spell.trapType).length;
            if (active >= (spell.maxActivePerCaster || 2)) return 0;
            const nearE = v.visibleEnemies.filter(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 2).length;
            return nearE > 0 ? 45 + nearE * 30 + (spell.dmg || 0) * 0.2 : 0;
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
        if (kind === 'pulseLattice') {
            const owned = (g.state.mirrors || []).filter(m => m.owner === unit.player && m.hp > 0);
            if (owned.length < 3) return 0;
            let net = null;
            if (typeof window !== 'undefined' && typeof window.computeMirrorNetwork === 'function') {
                net = window.computeMirrorNetwork(unit.player);
            }
            if (!net) return 0;
            const tiles = new Set(net.beamTiles);
            for (const t of net.volumeTiles) tiles.add(t);
            const caught = v.visibleEnemies.filter(e => tiles.has(e.x + ',' + e.y)).length;
            if (caught === 0) return 0;
            let s = 60 + caught * 80;
            if (net.isPrism) s += 150; else if (net.is3DVolume) s += 70;
            return s;
        }
        if (kind === 'tuneFrequency') {
            const owned = (g.state.mirrors || []).filter(m => m.owner === unit.player && m.hp > 0);
            return owned.length < 2 ? 0 : 12;
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

        if (kind === 'terrainCreate') {
            if (!target) return 0;
            if (v.visibleEnemies.length === 0) return 0;
            let s = 0;
            if (spell.dmg) {
                const enemiesNear = v.visibleEnemies.filter(e =>
                    Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 1);
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
            let s = totalRestored * AI_TUNE.mpValuePerPoint * 0.7;
            if (lowMana.length >= 2) s *= 1.5;
            if (lowMana.length === 0) s *= 0.1;
            return s;
        }

        if (kind === 'utility') {
            const sid = spell.id;
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

    function scoreTeleport(unit, spell, target, v) {
        const g = G();
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

        const moveTiles = g.TargetQuery.moveTiles(unit);
        if (moveTiles.length === 0) return;

        // 1) joint move×action (needs AP for move + action afterwards)
        if ((unit.ap || 0) >= g.AP_COST_ACTION * 2 && !_skipAttack && _aiDiff().jointSearch) {
            const best = jointMoveActionSearch(unit, moveTiles, v);
            if (best && best.score > 0) {
                out.push({ type: 'move', x: best.x, y: best.y, z: best.z, score: best.score, _joint: true });
            }
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
                    if (recent.has(g.posKey(t.x, t.y))) gain += wght(g, 'antiOscillationPen_v1', -2) * 10;
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

        // 4) macro-intent move
        const goal = pickMoveGoal(unit, v);
        if (!goal) return;
        const bestTile = pickBestMoveTile(unit, moveTiles, goal, v);
        if (!bestTile) return;
        out.push({ type: 'move', x: bestTile.x, y: bestTile.y, z: bestTile.z, score: goal.score, _intent: goal.reason });
    }

    // The 1-ply joint search. For every reachable tile, find the best shot
    // (basic attack or damage spell) the engine would allow from there and
    // value it through the oracle; the actual shot is re-picked and
    // validated on the next AI loop from the real tile.
    function jointMoveActionSearch(unit, moveTiles, v) {
        const g = G();
        const enemies = v.visibleEnemies.filter(e => !isProtected(g, e));
        const hasTower = v.enemyTower && v.enemyTower.hp > 0;
        if (!enemies.length && !hasTower) return null;

        const recent = new Set(unit._aiRecentTiles || []);
        let atkRange = 1;
        try { atkRange = g.getEffectiveRange(unit) || (unit.range || 1); } catch (e) {}
        const dmgSpells = [];
        let silenced = false;
        try { silenced = g.unitHasStatus(unit, 'silence'); } catch (e) {}
        if (!silenced) {
            for (const sp of (unit.spells || [])) {
                if (!sp || !DMG_KINDS.has(sp.kind)) continue;
                if (sp.kind === 'leapStrike' || sp.kind === 'skyDrop' || sp.kind === 'skyThrow' || sp.kind === 'skySlam') continue; // height-gated: let the real scorer decide in place
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

        let best = null;
        for (const t of moveTiles) {
            if (t.x === unit.x && t.y === unit.y) continue;
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
                    const reach = _reach(g, t.x, t.y, t.z, e, _isLongRange(ds.sp));
                    if (reach > ds.er) continue;
                    if (!ds.sp.ignoresLineOfSight && blocked(t.x, t.y, e)) continue;
                    const hit = scoreOffensiveHit(g, unit, e, ds.sp, v, { fromX: t.x, fromY: t.y, fromH: th, splash: false });
                    const val = hit.val - ds.mp * AI_TUNE.mpValuePerPoint;
                    if (val > bestShot) bestShot = val;
                }
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
                    if (towerVal > bestShot) bestShot = towerVal;
                }
            }
            if (bestShot <= 0) continue;
            let score = bestShot * AI_TUNE.jointSearchDiscount;
            if (recent.has(g.posKey(t.x, t.y))) score += wght(g, 'antiOscillationPen_v1', -2) * 10;
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

    // ── macro intent layer (schema 12 shape, currency-denominated) ───────
    const _OBJECTIVE_INTENTS = new Set([
        'ctf_carry_home', 'ctf_intercept_carrier', 'ctf_return_flag', 'ctf_grab_flag',
        'hotspot_nexus', 'domination_nexus', 'arena_nexus_deny', 'arena_nexus',
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

        // Arena EMERGENCY: enemy holds all-but-one zone → sprint to flip.
        if (modeId === 'arena' && g.state.nexusPoints) {
            const zones = Object.keys(g.state.nexusPoints).map(k => g.state.nexusPoints[k]).filter(n => n && n.zoneSize);
            const enemyPlayer = unit.player === 1 ? 2 : 1;
            if (zones.length >= 3 && zones.filter(n => n.owner === enemyPlayer).length >= zones.length - 1) {
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

        if (modeId === 'tdm' || modeId === 'ffa') {
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
                const moveTiles = g.TargetQuery.moveTiles(unit);
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
            const moveTiles = g.TargetQuery.moveTiles(unit);
            const reachable = v.visibleHourglasses.filter(h =>
                moveTiles.some(t => t.x === h.x && t.y === h.y));
            if (reachable.length > 0) {
                reachable.sort((a, b) =>
                    (Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y)) -
                    (Math.abs(b.x - unit.x) + Math.abs(b.y - unit.y)));
                let s = 230;
                if (ws.phase === 'hg_losing') s += 80;
                s += (unit.hourglasses || 0) * 15;
                goals.push({ x: reachable[0].x, y: reachable[0].y, score: s, reason: 'grab_hg' });
            }
            // …or at least approach the nearest one.
            const nearest = v.visibleHourglasses.slice().sort((a, b) =>
                (Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y)) -
                (Math.abs(b.x - unit.x) + Math.abs(b.y - unit.y)))[0];
            let s2 = 110 + wght(g, 'hgSeekPriority_v1', 4) * 6;
            if (Math.abs(nearest.x - unit.x) + Math.abs(nearest.y - unit.y) <= 4) s2 += 30;
            if (ws.phase === 'hg_losing') s2 += 50;
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
                    if (zones.length >= 3 && ownedCount === zones.length - 1) s += 130;
                    if (v.enemyTower && v.enemyTower.hp < v.enemyTower.maxHp * 0.25) s -= 50;
                    const alliesNear = g.state.units.filter(u =>
                        u.player === unit.player && !u.dead && u.id !== unit.id &&
                        Math.abs(u.x - bestC.x) + Math.abs(u.y - bestC.y) <= 3).length;
                    if (alliesNear >= 2) s -= 80;
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
                let s = wght(g, 'nexusCapBonus_v1', 19) * 4;
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
            const mapCenterX = Math.floor((g.state.mapCols || 15) / 2);
            const mapCenterY = Math.floor((g.state.mapRows || 8) / 2);
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

        goals.push({
            x: Math.floor(g.bw() / 2),
            y: Math.floor(g.bh() / 2),
            score: 30, reason: 'explore',
        });

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

    // ── A* waypoint pathfinding (kept: engine-parity climb/phase rules) ──
    let _pathCache = {};
    let _pathCacheGen = -1;

    function findWaypoint(unit, goalX, goalY) {
        const g = G();
        const gen = g.state.round || 0;
        if (gen !== _pathCacheGen) { _pathCache = {}; _pathCacheGen = gen; }

        const cacheKey = `${unit.id}:${unit.x},${unit.y}->${goalX},${goalY}`;
        if (_pathCache[cacheKey] !== undefined) return _pathCache[cacheKey];

        if (!hasObstacleInCorridor(unit, goalX, goalY)) {
            _pathCache[cacheKey] = null;
            return null;
        }

        const W = g.bw(), H = g.bh();
        const goalIsPassable = g.isInside(goalX, goalY) && g.unitCanTraverse(unit, goalX, goalY);

        let goalSet;
        if (goalIsPassable) {
            goalSet = new Set([goalX + goalY * W]);
        } else {
            goalSet = new Set();
            const range = g.getEffectiveRange(unit);
            for (let dy = -range; dy <= range; dy++) {
                for (let dx = -range; dx <= range; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) < 1 || Math.abs(dx) + Math.abs(dy) > range) continue;
                    const ax = goalX + dx, ay = goalY + dy;
                    if (ax < 0 || ay < 0 || ax >= W || ay >= H) continue;
                    if (g.unitCanTraverse(unit, ax, ay)) goalSet.add(ax + ay * W);
                }
            }
            if (goalSet.size === 0) {
                _pathCache[cacheKey] = false;
                return false;
            }
        }

        const gScore = new Float32Array(W * H).fill(Infinity);
        const from = new Int32Array(W * H).fill(-1);
        const startIdx = unit.x + unit.y * W;
        gScore[startIdx] = 0;

        const _hasHeight = typeof g.getHeightAt === 'function';
        const _canFly = typeof g.canFly === 'function' && g.canFly(unit);
        const _maxClimb = g.MAX_CLIMB_HEIGHT ?? 1;
        const _jumpH = (typeof g.getUnitJumpClimb === 'function')
            ? g.getUnitJumpClimb(unit) : (g.JUMP_HEIGHT ?? 1);
        const _phase = typeof unitIsPhasing === 'function' && unitIsPhasing(unit);

        const open = [{ x: unit.x, y: unit.y, f: Math.abs(unit.x - goalX) + Math.abs(unit.y - goalY) }];
        // Movement is 4-directional (cardinal only) — engine parity.
        const DIRS = [[1,0],[0,1],[-1,0],[0,-1]];

        while (open.length) {
            let minI = 0;
            for (let i = 1; i < open.length; i++) {
                if (open[i].f < open[minI].f) minI = i;
            }
            const cur = open[minI];
            open[minI] = open[open.length - 1];
            open.pop();

            const ci = cur.x + cur.y * W;
            if (goalSet.has(ci)) {
                let idx = ci;
                let prev = from[idx];
                while (prev !== -1 && prev !== startIdx) {
                    idx = prev;
                    prev = from[idx];
                }
                if (prev === startIdx) {
                    const wp = { x: idx % W, y: Math.floor(idx / W) };
                    _pathCache[cacheKey] = wp;
                    return wp;
                }
                _pathCache[cacheKey] = null;
                return null;
            }

            for (const [dx, dy] of DIRS) {
                const nx = cur.x + dx, ny = cur.y + dy;
                if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                if (!g.unitCanTraverse(unit, nx, ny)) continue;
                if (!_phase && g.objectBlocksEdge && g.objectBlocksEdge(cur.x, cur.y, nx, ny)) continue;

                let _stepCost = 1;
                if (_hasHeight && !_canFly) {
                    const curH = g.getHeightAt(cur.x, cur.y);
                    const nxH = g.getHeightAt(nx, ny);
                    const rise = nxH - curH;
                    const _aiNxtObj = (typeof g.getObjectAt === 'function') ? g.getObjectAt(nx, ny) : null;
                    const _aiNxtRw = _aiNxtObj && typeof OBJECT_RULES !== 'undefined' && OBJECT_RULES[_aiNxtObj]?.roofWalkable;
                    // Roofs are lift-only (Enter Building) — never path up one.
                    if (_aiNxtRw && rise > _maxClimb) continue;
                    if (rise > _jumpH) continue;
                    if (rise > 0) _stepCost = Math.max(_stepCost, rise);
                }
                const ni = nx + ny * W;
                const tentG = gScore[ci] + _stepCost;
                if (tentG >= gScore[ni]) continue;
                gScore[ni] = tentG;
                from[ni] = ci;
                const h = Math.abs(nx - goalX) + Math.abs(ny - goalY);
                open.push({ x: nx, y: ny, f: tentG + h });
            }
        }

        _pathCache[cacheKey] = false;
        return false;
    }

    function hasObstacleInCorridor(unit, goalX, goalY) {
        const g = G();
        const minX = Math.min(unit.x, goalX);
        const maxX = Math.max(unit.x, goalX);
        const minY = Math.min(unit.y, goalY);
        const maxY = Math.max(unit.y, goalY);
        const _hasHeight = typeof g.getHeightAt === 'function';
        const _canFly = typeof g.canFly === 'function' && g.canFly(unit);
        const _jumpH = (typeof g.getUnitJumpClimb === 'function')
            ? g.getUnitJumpClimb(unit) : (g.JUMP_HEIGHT ?? 1);

        for (let y = Math.max(0, minY - 1); y <= Math.min(g.bh() - 1, maxY + 1); y++) {
            for (let x = Math.max(0, minX - 1); x <= Math.min(g.bw() - 1, maxX + 1); x++) {
                if (x === goalX && y === goalY) continue;
                if (!g.unitCanTraverse(unit, x, y)) return true;
                if (_hasHeight && !_canFly) {
                    const h = g.getHeightAt(x, y);
                    for (const [dx, dy] of [[1,0],[0,1],[-1,0],[0,-1]]) {
                        const ax = x + dx, ay = y + dy;
                        if (ax < minX - 1 || ax > maxX + 1 || ay < minY - 1 || ay > maxY + 1) continue;
                        if (!g.isInside(ax, ay)) continue;
                        const ah = g.getHeightAt(ax, ay);
                        if (Math.abs(h - ah) > _jumpH) return true;
                    }
                }
            }
        }
        return false;
    }

    function pickBestMoveTile(unit, moveTiles, goal, v) {
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
                if ((unit._aiRecentTiles || []).includes(g.posKey(tile.x, tile.y))) score += wght(g, 'antiOscillationPen_v1', -2) * 10;
                if (score > bestScore) { bestScore = score; best = tile; }
            }
            return best;
        }

        const goalX = goal.x, goalY = goal.y;
        if (goalX === undefined) return null;

        let wpX = goalX, wpY = goalY;
        const wp = findWaypoint(unit, goalX, goalY);
        if (wp === false) {
            wpX = Math.floor(g.bw() / 2);
            wpY = Math.floor(g.bh() / 2);
        } else if (wp) {
            wpX = wp.x;
            wpY = wp.y;
        }

        // Anti-clump matters most when the enemy has AoE in its kits.
        let enemyHasAoe = false;
        for (const e of v.visibleEnemies) {
            if ((e.spells || []).some(sp => sp && SPLASH_KINDS.has(sp.kind))) { enemyHasAoe = true; break; }
        }

        const curD = Math.abs(unit.x - wpX) + Math.abs(unit.y - wpY);
        let best = null, bestScore = -Infinity;
        const isRanged = (unit.range || 1) >= 2;
        for (const tile of moveTiles) {
            const d = Math.abs(tile.x - wpX) + Math.abs(tile.y - wpY);
            let score = (curD - d) * 10;

            score -= v.threatFn(tile.x, tile.y, tile.z).totalDmg * 0.08;
            score -= aiHazardPenaltyAt(unit, tile.x, tile.y);

            let adjAllies = 0;
            for (const a of v.allies) {
                if (Math.abs(tile.x - a.x) + Math.abs(tile.y - a.y) <= 3) score += 2;
                if (Math.abs(tile.x - a.x) <= 1 && Math.abs(tile.y - a.y) <= 1) adjAllies++;
            }
            // AoE-magnet prevention (XCOM's ×0.2 adjacency, additive form).
            if (adjAllies >= 2) score -= enemyHasAoe ? 60 : 25;

            if (typeof g.getHeightAt === 'function') {
                const th = tileH(g, tile);
                score += Math.min(th, 4) * (isRanged ? AI_TUNE.moveHighGroundRanged : AI_TUNE.moveHighGroundMelee);
            }
            if ((unit._aiRecentTiles || []).includes(g.posKey(tile.x, tile.y))) score += wght(g, 'antiOscillationPen_v1', -2) * 10;
            if (score > bestScore) { bestScore = score; best = tile; }
        }
        return best;
    }

    // ═════════════════════════════════════════════════════════════════════
    // REMAINING ACTION SCORERS (inspect / flair / guard / nexus / recall /
    // build / altitude) — kept behaviors, currency-denominated.
    // ═════════════════════════════════════════════════════════════════════

    function scoreInspect(unit, v, out) {
        const g = G();
        if ((unit.ap || 0) < g.AP_COST_ACTION) return;

        const unrevHG = (g.state.hourglasses || []).filter(h =>
            h.carriedBy === null && !h.visibleTo[unit.player]).length;

        const allTiles = g.getInspectTiles(unit);
        if (allTiles.length === 0) return;

        const unscanned = allTiles.filter(t =>
            !g.state.scannedByPlayer[unit.player].has(g.scanKey(t.x, t.y)));

        const cx = Math.floor(g.bw() / 2), cy = Math.floor(g.bh() / 2);
        const pool = unscanned.length > 0 ? unscanned : allTiles;
        pool.sort((a, b) =>
            (Math.abs(a.x - cx) + Math.abs(a.y - cy)) - (Math.abs(b.x - cx) + Math.abs(b.y - cy)));

        let s = 8;
        if (unscanned.length > 0) s += 8;
        s += unrevHG * 12;
        if (v.winState.phase === 'hg_losing') s += 25;
        if (v.visibleEnemies.length > 0) s *= 0.3;   // there's a fight on
        const ws = v.winState;
        if (ws.phase === 'tower_push' || ws.enemyDeadCount >= 1 || ws.roundUrgency >= 2) s *= 0.3;

        out.push({ type: 'inspect', x: pool[0].x, y: pool[0].y, score: s });
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
        if ((unit.def || 0) >= 10 || unit.cls === 'Tank') score += 20;
        if ((unit.hourglasses || 0) > 0) score += 25;
        if (v.closestEnemyDist > 5) score = Math.min(score, 8);
        const ws = v.winState;
        if (ws.phase === 'tower_push' || ws.phase === 'numbers_advantage' || ws.enemyDeadCount >= 1) score *= 0.4;
        if (score > 0) out.push({ type: 'guard', score, _noDanger: true });
    }

    /* Arena spawn nexuses carry a `tiles` footprint instead of a square
       rect — mirror ui.js nexusZoneContains. */
    function _aiNexContains(nex, x, y) {
        if (!nex) return false;
        if (Array.isArray(nex.tiles)) return nex.tiles.some(t => t.x === x && t.y === y);
        return x >= nex.zoneX && x < nex.zoneX + nex.zoneSize &&
               y >= nex.zoneY && y < nex.zoneY + nex.zoneSize;
    }

    function scoreNexusChannel(unit, v, out) {
        const g = G();
        if (_failedNexus) return;
        if ((unit.ap || 0) < (typeof NEXUS_CHANNEL_COST_AP !== 'undefined' ? NEXUS_CHANNEL_COST_AP : 1)) return;
        if (!g.state.nexusPoints) return;

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
            for (const nexKey of Object.keys(g.state.nexusPoints)) {
                landScore = Math.max(landScore, _checkNexusLand(g.state.nexusPoints[nexKey]));
            }
            if (g.state.roamingNexus) landScore = Math.max(landScore, _checkNexusLand(g.state.roamingNexus));
            if (landScore > 0 && typeof g.canChangeAltitude === 'function') {
                const canLand = g.canChangeAltitude(unit, 'land');
                if (canLand?.ok) out.push({ type: 'altitude', mode: 'land', score: landScore });
            }
            return;
        }

        let nexKey = null, nex = null;
        for (const k of Object.keys(g.state.nexusPoints)) {
            const n = g.state.nexusPoints[k];
            if (!n || !n.zoneSize) continue;
            const distX = Math.abs(unit.x - (n.zoneX + Math.floor(n.zoneSize / 2)));
            const distY = Math.abs(unit.y - (n.zoneY + Math.floor(n.zoneSize / 2)));
            if (distX + distY <= n.zoneSize + 3) { nexKey = k; nex = n; break; }
        }
        if (!nexKey) {
            let bestDist = Infinity;
            for (const k of Object.keys(g.state.nexusPoints)) {
                const n = g.state.nexusPoints[k];
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
        const nexusPenalty = towerPushActive && nexKey === 'earth' ? 0.5 : 1.0;
        const ownedCount = Object.values(g.state.nexusPoints).filter(n => n?.owner === unit.player).length;

        const inZone = _aiNexContains(nex, unit.x, unit.y);
        const zoneCenterX = nex.zoneX + Math.floor(nex.zoneSize / 2);
        const zoneCenterY = nex.zoneY + Math.floor(nex.zoneSize / 2);
        const distToCenter = Math.abs(unit.x - zoneCenterX) + Math.abs(unit.y - zoneCenterY);

        if (inZone && nex.owner !== unit.player) {
            let score = wght(g, 'nexusCapBonus_v1', 19) * 5;
            const mpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
            if (mpMode && (mpMode.id === 'domination' || mpMode.id === 'arena')) score += 90;
            if (mpMode && mpMode.id === 'arena') {
                const _zoneList = Object.values(g.state.nexusPoints).filter(n => n && n.zoneSize);
                if (_zoneList.length >= 3) {
                    const _enemyP = unit.player === 1 ? 2 : 1;
                    if (ownedCount === _zoneList.length - 1) score += 200;   // capturing our last zone = win
                    if (_zoneList.filter(n => n.owner === _enemyP).length >= _zoneList.length - 1) score += 130;
                }
            }
            const myProg = unit.player === 1 ? Math.max(0, nex.progress) : Math.max(0, -nex.progress);
            const threshold = typeof NEXUS_CAPTURE_THRESHOLD !== 'undefined' ? NEXUS_CAPTURE_THRESHOLD : 6;
            if (myProg >= threshold - 2) score += 60;
            if (myProg >= threshold - 1) score += 50;
            if (v.closestEnemyDist <= 2) score -= 40;
            if (ownedCount === 0) score += 40;
            score += ownedCount * 20;
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
            const moveTiles = g.TargetQuery.moveTiles(unit);
            let bt = null, bd = Infinity;
            for (const t of moveTiles) {
                const d = Math.abs(t.x - tgtX) + Math.abs(t.y - tgtY);
                if (d < bd) { bd = d; bt = t; }
            }
            if (score > 0 && bt) out.push({ type: 'move', x: bt.x, y: bt.y, z: bt.z, score });
        }

        if (g.state.roamingNexus) {
            const rn = g.state.roamingNexus;
            const inRoamingZone = unit.x >= rn.zoneX && unit.x < rn.zoneX + rn.zoneSize &&
                                  unit.y >= rn.zoneY && unit.y < rn.zoneY + rn.zoneSize;
            if (inRoamingZone && rn.owner !== unit.player) {
                let score = 190;
                const myProg = unit.player === 1 ? Math.max(0, rn.progress) : Math.max(0, -rn.progress);
                const threshold = typeof NEXUS_CAPTURE_THRESHOLD !== 'undefined' ? NEXUS_CAPTURE_THRESHOLD : 6;
                if (myProg >= threshold - 2) score += 70;
                if (v.closestEnemyDist <= 2) score -= 40;
                if (score > 0) out.push({ type: 'nexus_channel', score });
            }
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
            && !!g.TargetQuery && g.TargetQuery.moveTiles(unit).length === 0;
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
        const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
                      { dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }];
        const len = spell.range || 4;
        const enemies = g.getHostileUnits(unit.player).filter(e => !e.dead &&
            !(g.unitHasStatus(e, 'invisible') && !g.unitHasStatus(e, 'marked'))
            && !(typeof g.isUnitConcealedFrom === 'function' && g.isUnitConcealedFrom(e, unit.player))
            && (!g.state.fogOfWar || typeof g.isUnitSeenByTeam !== 'function'
                || g.isUnitSeenByTeam(e, unit.player)));
        let best = null;
        for (const dir of dirs) {
            let hits = 0, first = null, hasPreferred = false;
            for (let i = 1; i <= len; i++) {
                const tx = unit.x + dir.dx * i, ty = unit.y + dir.dy * i;
                if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) break;
                if (typeof g.isTerrainPassable === 'function' && !g.isTerrainPassable(tx, ty) && !spell.destroysObstacles) break;
                if (!spell.ignoresLineOfSight && typeof g.isRangeBlockedByTerrain === 'function'
                    && g.isRangeBlockedByTerrain(unit.x, unit.y, tx, ty, unit.z ?? null)) break;
                const e = enemies.find(en => en.x === tx && en.y === ty);
                if (e) {
                    hits++;
                    if (!first) first = { x: tx, y: ty };
                    if (preferredTargetId && e.id === preferredTargetId) hasPreferred = true;
                }
            }
            if (!hits) continue;
            const score = hits * 10 + (hasPreferred ? 5 : 0);
            if (!best || score > best.score) best = { x: first.x, y: first.y, hits, score };
        }
        return best;
    }
    window._aiReaimLineSpell = _reaimLineSpell;

    function _crossFootprintAI(spell, cx, cy) {
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

    function findSpellTarget(unit, spell, v) {
        const g = G();
        const kind = spell.kind;

        if (['damage', 'ricochet', 'debuff', 'multiHit', 'lifeDrain'].includes(kind)) {
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

            if (['damage', 'ricochet', 'multiHit', 'lifeDrain'].includes(kind)) {
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
            const active = (g.state.turrets || []).filter(t => t.casterUnitId === unit.id).length;
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

        if (kind === 'utility') {
            const sid = spell.id;
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

        if (kind === 'raiseDead') {
            const remains = g.state.units.filter(u => u.dead && !u._corpseConsumed)
                .filter(d => Math.abs(d.x - unit.x) + Math.abs(d.y - unit.y) <= _effRange(unit, spell))
                .sort((a, b) => (Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y))
                              - (Math.abs(b.x - unit.x) + Math.abs(b.y - unit.y)));
            return remains[0] || null;
        }

        if (kind === 'rallyPull') return { x: unit.x, y: unit.y };

        if (['seedHeal', 'seedPoison', 'leechSeed'].includes(kind)) {
            const terrain = g.getTerrainAt(unit.x, unit.y);
            if (terrain === 'mountain' || terrain === 'lava') return null;
            const _stype = kind === 'seedHeal' ? 'heal' : kind === 'seedPoison' ? 'poison' : 'leech';
            if (g.state.plantedSeeds?.some(s2 => s2.x === unit.x && s2.y === unit.y && s2.type === _stype)) return null;
            if (g.state.plantedTrees?.some(t2 => t2.x === unit.x && t2.y === unit.y)) return null;
            return { x: unit.x, y: unit.y };
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

        if (kind === 'placeTrap') {
            const R = _effRange(unit, spell) || 2;
            let bestTile = null, bestScore = 0;
            for (let dy = -R; dy <= R; dy++) {
                for (let dx = -R; dx <= R; dx++) {
                    const d = Math.abs(dx) + Math.abs(dy);
                    if (d < 1 || d > R) continue;
                    const tx = unit.x + dx, ty = unit.y + dy;
                    if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) continue;
                    if (typeof g._placeTrapProblem === 'function'
                        ? g._placeTrapProblem(tx, ty) : g.unitAt(tx, ty)) continue;
                    let score = 0;
                    for (const e of v.visibleEnemies) {
                        const eDist = Math.abs(e.x - tx) + Math.abs(e.y - ty);
                        if (eDist <= 1) score += 12;
                        else if (eDist <= 3) score += 4;
                    }
                    if (score > bestScore) { bestScore = score; bestTile = { x: tx, y: ty }; }
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

        if (kind === 'summonWeather') return v.visibleEnemies[0] || null;
        if (kind === 'warCry') return { x: unit.x, y: unit.y };

        if (kind === 'encore') {
            const allies = g.aliveUnitsFor(unit.player)
                .filter(a => a.id !== unit.id && g.unitFinished(a) && !a._encoreThisRound)
                .filter(a => Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= _effRange(unit, spell));
            // Give the extra action to the highest-output ally.
            allies.sort((a, b) => unitThreatOutput(g, b, v.closestEnemy || unit)
                                - unitThreatOutput(g, a, v.closestEnemy || unit));
            return allies[0] || null;
        }

        if (kind === 'teleport') {
            // doSpell teleports the CASTER to the clicked EMPTY tile.
            if (spell.teleportAnyUnit) return null; // two-phase mass teleports stay manual
            const R = _effRange(unit, spell) || spell.teleportDistance || 4;
            const hurt = unit.hp < unit.maxHp * 0.35 && v.closestEnemyDist <= 2;
            const wantEngage = !hurt && v.visibleEnemies.length > 0
                && v.closestEnemyDist > g.getEffectiveRange(unit) + ((g.getEffectiveMove ? g.getEffectiveMove(unit) : unit.move) || 2);
            if (!hurt && !wantEngage) return null;
            let bestTile = null, bestVal = -Infinity;
            for (let dy = -R; dy <= R; dy++) {
                for (let dx = -R; dx <= R; dx++) {
                    const d = Math.abs(dx) + Math.abs(dy);
                    if (d < 1 || d > R) continue;
                    const tx = unit.x + dx, ty = unit.y + dy;
                    if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) continue;
                    if (g.unitAt(tx, ty)) continue;
                    if (typeof g.isTerrainPassable === 'function' && !g.isTerrainPassable(tx, ty)) continue;
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
        if (kind === 'scan' || kind === 'remoteView') return { x: unit.x, y: unit.y };

        if (kind === 'line' || kind === 'linePush') {
            const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
                          { dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }];
            const len = spell.range || 4;
            let bestDir = null, bestHits = 0, bestTarget = null;
            for (const dir of dirs) {
                let hits = 0, firstEnemy = null;
                for (let i = 1; i <= len; i++) {
                    const tx = unit.x + dir.dx * i, ty = unit.y + dir.dy * i;
                    if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) break;
                    if (typeof g.isTerrainPassable === 'function' && !g.isTerrainPassable(tx, ty) && !spell.destroysObstacles) break;
                    if (!spell.ignoresLineOfSight && typeof g.isRangeBlockedByTerrain === 'function'
                        && g.isRangeBlockedByTerrain(unit.x, unit.y, tx, ty, unit.z ?? null)) break;
                    const enemy = v.visibleEnemies.find(e => e.x === tx && e.y === ty);
                    if (enemy) { hits++; if (!firstEnemy) firstEnemy = enemy; }
                }
                if (hits > bestHits || (hits === bestHits && firstEnemy && bestTarget &&
                    getTargetPriority(firstEnemy, unit, v) > getTargetPriority(bestTarget, unit, v))) {
                    bestHits = hits; bestDir = dir; bestTarget = firstEnemy;
                }
            }
            return bestTarget || null;
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
        if (kind === 'selfHeal') return { x: unit.x, y: unit.y };

        if (kind === 'aoePull') {
            let best = null, bestScore = 0;
            const R = _effRange(unit, spell);
            for (const e of v.visibleEnemies) {
                const d = _dist(g, unit.x, unit.y, unit.z, e);
                if (d < 1 || d > R) continue;
                if (!spell.ignoresLineOfSight && g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y)) continue;
                const area = getSquareArea(e.x, e.y, spell.aoeRadius || 1);
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
                const area = getSquareArea(e.x, e.y, spell.aoeRadius || 1);
                let hits = area.filter(t => v.visibleEnemies.some(en => en.x === t.x && en.y === t.y)).length;
                try {
                    if (['root', 'stun', 'freeze', 'frozen', 'sleep'].some(id => g.unitHasStatus(e, id))) hits += 3;
                } catch (q) {}
                if (hits > bestScore) { bestScore = hits; best = e; }
            }
            return best;
        }

        if (kind === 'deployObject') {
            const active = (g.state._deployedObjects || []).filter(o => o.ownerUnitId === unit.id).length;
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
                const area = getSquareArea(c.x, c.y, spell.aoeRadius || 1);
                const count = [unit, ...v.allies].filter(a =>
                    !a.dead && area.some(t => t.x === a.x && t.y === a.y)).length;
                if (count > bestAllies) { bestAllies = count; best = c; }
            }
            return best;
        }

        if (kind === 'zoneDebuff') {
            if (spell.gravityField === 'weak') {
                let bestAlly = null, bestAllyScore = 0;
                for (const a of [unit, ...v.allies]) {
                    if (a.dead) continue;
                    const d = Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y);
                    if (d > (_effRange(unit, spell) || 4)) continue;
                    const area = getSquareArea(a.x, a.y, spell.aoeRadius || 1);
                    const inArea = [unit, ...v.allies].filter(h => !h.dead && area.some(t => t.x === h.x && t.y === h.y)).length;
                    if (inArea > bestAllyScore) { bestAllyScore = inArea; bestAlly = a; }
                }
                return bestAllyScore >= 2 ? bestAlly : null;
            }
            let best = null, bestScore = 0;
            for (const e of v.visibleEnemies) {
                const d = _dist(g, unit.x, unit.y, unit.z, e);
                if (d < 1 || d > (_effRange(unit, spell) || 4)) continue;
                const area = getSquareArea(e.x, e.y, spell.aoeRadius || 1);
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
                const area = getSquareArea(a.x, a.y, spell.aoeRadius || 1);
                const hurtInArea = hurtAllies.filter(h => area.some(t => t.x === h.x && t.y === h.y)).length;
                const allInArea = [unit, ...v.allies].filter(h => !h.dead && area.some(t => t.x === h.x && t.y === h.y)).length;
                const score = hurtInArea * 12 + allInArea * 4;
                if (score > bestScore) { bestScore = score; best = a; }
            }
            return best;
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
                    const path = g.getLinePoints(unit.x, unit.y, tx, ty);
                    let hits = 0, hitPriority = 0;
                    for (const pt of path) {
                        const victim = v.visibleEnemies.find(e => e.x === pt.x && e.y === pt.y);
                        if (victim) { hits++; hitPriority += getTargetPriority(victim, unit, v); }
                    }
                    if (hits === 0) continue;
                    const score = hits * 100 + hitPriority + d * 2;
                    if (score > bestScore) { bestScore = score; bestTile = { x: tx, y: ty }; }
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
                g.state.aiThinking = false;
                g.maybeTriggerComputerTurn();
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

            case 'entropyStrike': {
                const delay = (typeof g.doEntropyStrike === 'function') ? (g.doEntropyStrike(unit) || 0) : 0;
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
                        _castX = aim.x; _castY = aim.y; _castZ = undefined;
                    }
                    const delay = g.doSpell(unit, _castX, _castY, _castZ) || 0;
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
                g.state.actionMode = 'move';
                if (!unit._aiRecentTiles) unit._aiRecentTiles = [];
                unit._aiRecentTiles.push(g.posKey(unit.x, unit.y));
                if (unit._aiRecentTiles.length > 3) unit._aiRecentTiles.shift();
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
        _failedNexus = false;
        _failedItems = new Set();
        _turnActionLog = [];
        _outputCache = new Map();
        try {
            const vision = buildVision(unit);
            const cands = gatherCandidates(unit, vision) || [];
            return cands.slice().sort((a, b) => (b.score || 0) - (a.score || 0));
        } catch (e) {
            console.warn('[AI] _aiPlanCandidates failed:', e);
            return [];
        }
    };

    console.log('[AI] Entropy Wars tactical AI v4 loaded — one brain, one currency (see AI_REDESIGN.md).');
})();
