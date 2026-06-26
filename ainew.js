// ainew.js — "Claude" AI variant for Entropy Wars.
// =====================================================================
// A SURGICAL drop-in on top of the stock ai.js. Load this AFTER ai.js
// (it captures and delegates to the original window.aiTakeTurn). It layers
// my two playtested edges onto the stock AI's mature framework instead of
// rewriting 4000 lines:
//
//   1) PROACTIVE HIGH-GROUND SEEKING.
//      Terrain elevation matters in the damage model:
//        • downhill attack  → ×(1 + 0.10 × heightDiff)   (+10% per level)
//        • high-ground def   → incoming damage − 5 × heightDiff (flat)
//        • ranged on h≥2     → +1 effective range
//      The stock AI weights moving to higher tiles at only 0.3 (ranged) /
//      0.5 (melee) versus a distance weight of ×10, so between fights it
//      beelines and ignores high ground (it only captures elevation when a
//      move-to-attack tile already lets it hit). We wrap GAME.getAIWeight to
//      raise those height weights so the SAME AI now climbs when it's nearly
//      free to do so — banking the +10%/level downhill bonus and +1 range.
//
//   2) HARD TEAM FOCUS-FIRE.
//      The stock AI focus-fires only softly (a team-damage log nudges
//      priority by +20 and a secure-kill bonus). Each unit still hunts its
//      own nearest/highest-priority enemy, which spreads chip damage across
//      ~1000-HP units. We maintain ONE shared focus target for the team and,
//      whenever the active (non-healer) unit can land a damage action on a
//      reachable enemy, we take the best focus-weighted shot directly. Result
//      in playtests: enemies die in 2–3 rounds instead of dragging out.
//
// Everything else — healing/revive, tower pushes, nexus channeling, CTF,
// hourglasses, retreats, win-condition phases — is delegated UNCHANGED to the
// stock AI, so this is additive and mode-safe.
//
// NOTE on the engine contract (learned by playtesting): doSpell/doAttack/doMove
// return an animation delay in ms, and damage is only applied on projectile
// IMPACT (~1.4s later), not synchronously. So we drive actions exactly like the
// stock executeAction: run the action, read its returned delay, and schedule
// finishComputerAction() after that delay. Never fire a second action before
// the first resolves.
(function () {
    'use strict';
    const G = () => window.GAME;

    if (typeof window.aiTakeTurn !== 'function') {
        console.warn('[ainew] ai.js not loaded yet — aiTakeTurn missing; load ainew.js AFTER ai.js.');
        return;
    }
    const _baseAiTakeTurn = window.aiTakeTurn;

    // Damage spell kinds (mirrors ai.js / harness lists).
    const DMG_KINDS = new Set(['damage', 'ricochet', 'multiHit', 'aoe', 'barrage',
        'lifeDrain', 'line', 'linePush', 'cross', 'aoePull', 'splitBeam',
        'displacement', 'pull', 'dash', 'skyDrop', 'skyThrow', 'skySlam', 'leapStrike']);
    const HEALERS = new Set(['White Mage', 'Psychic', 'Harvester']);

    // A unit the AI must NOT target: invisible/cloaked, or hidden by an enemy
    // smoke screen (unless one of our units is adjacent, which reveals them).
    // The stock ai.js already filters these in buildVision; this focus-fire path
    // bypasses buildVision, so it has to check concealment itself.
    function isConcealed(g, tg, viewerPlayer) {
        try {
            if (g.unitHasStatus && g.unitHasStatus(tg, 'invisible')) {
                // honor adjacency reveal so we can still finish a spotted target
                if (typeof g.isUnitConcealedFrom === 'function') return g.isUnitConcealedFrom(tg, viewerPlayer);
                return true;
            }
            if (typeof g.isUnitConcealedFrom === 'function') return g.isUnitConcealedFrom(tg, viewerPlayer);
        } catch (e) {}
        return false;
    }

    // ---- 1) Elevation: boost high-ground weights once, by wrapping getAIWeight.
    const HEIGHT_WEIGHTS = {
        moveHighGroundRanged_v1: 3.5,  // was 0.3 — ranged really wants the +1 range + downhill
        moveHighGroundMelee_v1: 2.5,   // was 0.5
        moveRetreatHeight_v1: 3.0,
        jumpHighGroundRanged_v1: 18,
        jumpHighGroundMelee_v1: 8,
        flyRangedHeightBonus_v1: 14,
    };
    function ensureHeightWeights(g) {
        if (!g || !g.getAIWeight || g.__claudeHeightWrap) return;
        const orig = g.getAIWeight.bind(g);
        g.getAIWeight = function (key, player) {
            const base = orig(key, player);
            if (Object.prototype.hasOwnProperty.call(HEIGHT_WEIGHTS, key)) {
                // take the stronger of the trained value and our floor, so we
                // only ever push the AI to value height MORE, never less.
                return Math.max(base, HEIGHT_WEIGHTS[key]);
            }
            return base;
        };
        g.__claudeHeightWrap = true;
        console.log('[ainew] high-ground weights boosted; team focus-fire active.');
    }

    // ---- 2) Shared team focus target (hard focus-fire).
    function pickTeamFocus(g, unit) {
        const st = g.state;
        const enemies = st.units.filter(u => u.player !== unit.player && !u.dead && u.hp > 0 &&
            (typeof g.isEnemyUnit !== 'function' || g.isEnemyUnit(u, unit)) &&
            !isConcealed(g, u, unit.player));
        if (!enemies.length) { st._claudeFocusId = null; return null; }

        // Keep the existing focus if it is still a live enemy (commitment beats
        // dithering — the whole point of focus fire).
        const cur = enemies.find(u => u.id === st._claudeFocusId);
        if (cur) return cur;

        const team = st.units.filter(u => u.player === unit.player && !u.dead && u.hp > 0);
        const cx = team.reduce((s, u) => s + u.x, 0) / (team.length || 1);
        const cy = team.reduce((s, u) => s + u.y, 0) / (team.length || 1);
        // Lowest effective HP, pulled toward enemies near the team; healers first.
        enemies.sort((a, b) => {
            const ka = HEALERS.has(a.cls) ? -300 : 0, kb = HEALERS.has(b.cls) ? -300 : 0;
            const da = Math.abs(a.x - cx) + Math.abs(a.y - cy);
            const db = Math.abs(b.x - cx) + Math.abs(b.y - cy);
            return (a.hp + ka + da * 25) - (b.hp + kb + db * 25);
        });
        st._claudeFocusId = enemies[0].id;
        return enemies[0];
    }

    function standH(g, u) { try { return g.getUnitStandingHeight(u); } catch (e) { return u.z ?? 0; } }

    // Mirror the engine's cast-time preconditions for the special "positional"
    // damage kinds, so the focus path never picks an action that doSpell() will
    // immediately reject. A rejected action returns delay 0, which bounces back
    // into maybeTriggerComputerTurn(); since nothing on the board changed, the
    // AI re-picks the very same action and spins forever — that is the
    // "Must be above the target" loop the Valkyrie (Divine Swoop / leapStrike)
    // got stuck in. Pre-filtering here is what actually breaks the loop. The
    // checks below intentionally match battle.js's doSpell gates exactly.
    function spellPreconditionOk(g, unit, sp, tg) {
        // leapStrike (Divine Swoop, Feral Dive, Predator Leap, avalanche leaps,
        // …): the caster MUST stand strictly above the target. battle.js fails
        // the cast with "Must be above the target" when casterZ <= targetZ.
        if (sp.kind === 'leapStrike') {
            return standH(g, unit) > standH(g, tg);
        }
        // sky* throws/drops flagged requiresFlight can only be cast by a flyer.
        if (sp.requiresFlight &&
            (sp.kind === 'skyDrop' || sp.kind === 'skyThrow' || sp.kind === 'skySlam')) {
            try { return typeof g.canFly !== 'function' || g.canFly(unit); } catch (e) { return true; }
        }
        return true;
    }
    function typeMult(unit, tg, spellType) {
        try { return window.getTypeDamageMultiplier(unit, tg, spellType || null) || 1; } catch (e) { return 1; }
    }
    function baseDmg(sp) {
        return sp.dmg || (sp.hitDamages ? sp.hitDamages.reduce((a, b) => a + b, 0) : 0) ||
            (sp.kind === 'barrage' || sp.kind === 'aoe' ? 120 : 90);
    }
    // Press Turn: does this action hit a type weakness (strong && !weak tier)?
    // Detected off the chart tier, matching the engine's press detection.
    function pressWeak(unit, tg, spellType) {
        const chart = (typeof TYPE_CHART !== 'undefined') ? TYPE_CHART : null;
        if (!chart || !tg) return false;
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
        return hasStrong && !hasWeak;
    }

    // Find the best damage action available from where `unit` stands right now,
    // weighted hard toward the shared focus + secure kills + downhill elevation.
    function findFocusDamageAction(g, unit, focus) {
        const st = g.state;
        const myH = standH(g, unit);
        const elevMult = tg => { const th = standH(g, tg); return myH > th ? (1 + 0.1 * (myH - th)) : 1; };
        const scoreDmg = (tg, est, opts) => {
            opts = opts || {};
            let s = est;
            if (est >= tg.hp) s += 50000;                        // secure the kill
            s += (tg.maxHp - tg.hp) * 1.5;                       // pile onto the wounded
            if (focus && tg.id === focus.id) s += 8000;          // HARD focus fire
            if (HEALERS.has(tg.cls)) s += 4000;                  // kill support first
            // Press Turn tie-breaker (kept small so it never overrides focus /
            // kill commitment — only nudges between otherwise-similar shots):
            // prefer weakness hits (free action) and avoid high-evade whiffs.
            if (pressWeak(unit, tg, opts.spellType || null)) {
                try { s += g.getAIWeight('pressRefundValue_v1'); } catch (e) {}
            }
            if (opts.canMiss && typeof g.getEvasionChance === 'function') {
                try { s -= (g.getEvasionChance(tg) || 0) * g.getAIWeight('whiffRiskPenalty_v1'); } catch (e) {}
            }
            return s;
        };

        let best = null;
        const isEnemyTgt = tg => tg && tg.player !== unit.player && !tg.dead && tg.hp > 0 &&
            !isConcealed(g, tg, unit.player);

        // spells
        if (!g.unitHasStatus(unit, 'silence')) {
            for (const sp of (unit.spells || [])) {
                if (!DMG_KINDS.has(sp.kind)) continue;
                if (!g.canAffordSpell(unit, sp)) continue;
                if ((unit.mp || 0) < (sp.cost || 0)) continue;
                let tiles; try { tiles = g.getSpellRangeTiles(unit, sp) || []; } catch (e) { continue; }
                for (const t of tiles) {
                    const tg = g.unitAt(t.x, t.y, t.z);
                    if (!isEnemyTgt(tg)) continue;
                    if (!spellPreconditionOk(g, unit, sp, tg)) continue;
                    const est = baseDmg(sp) * typeMult(unit, tg, sp.spellType) * (sp.guaranteedCrit ? 1.5 : 1) * elevMult(tg);
                    const sc = scoreDmg(tg, est, { spellType: sp.spellType || null, canMiss: false });
                    if (!best || sc > best.score) best = { kind: 'spell', spell: sp, target: tg, x: t.x, y: t.y, z: t.z, est, score: sc };
                }
            }
        }
        // basic attack
        if (g.canUnitAct(unit)) {
            let tiles; try { tiles = g.getAttackTiles(unit) || []; } catch (e) { tiles = []; }
            for (const t of tiles) {
                const tg = g.unitAt(t.x, t.y, t.z);
                if (!isEnemyTgt(tg)) continue;
                const est = (unit.atk || 60) * 1.6 * typeMult(unit, tg, null) * elevMult(tg);
                const sc = scoreDmg(tg, est, { spellType: null, canMiss: true }) - 1; // tie-break toward spells
                if (!best || sc > best.score) best = { kind: 'attack', target: tg, x: t.x, y: t.y, z: t.z, est, score: sc };
            }
        }
        return best;
    }

    // Execute one action following the engine's animation-delay contract,
    // mirroring stock executeAction (run → read delay → finishComputerAction).
    function executeFocusAction(g, unit, act) {
        const st = g.state;
        if (act.kind === 'spell') {
            st.actionMode = 'spell';
            st.selectedTool = act.spell.name;
            g.queueComputerAction(() => {
                let delay = 0;
                try { delay = g.doSpell(unit, act.x, act.y, act.z) || 0; } catch (e) { delay = 0; }
                st.selectedTool = null;
                if (delay > 0) {
                    window.setTimeout(() => g.finishComputerAction(), delay);
                } else {
                    // Spell didn't fire (blocked precondition/out of range/fog).
                    // Flag this unit so the immediate re-trigger delegates to the
                    // stock AI instead of re-running the focus path and picking
                    // the SAME doomed action again — that bounce was the infinite
                    // "Must be above the target" loop.
                    st._claudeDelegateOnce = unit.id;
                    st.actionMode = null;
                    st.aiThinking = false;
                    g.maybeTriggerComputerTurn();
                }
            }, act.target);
        } else { // attack
            st.actionMode = 'attack';
            g.queueComputerAction(() => {
                let delay = 0;
                try { delay = g.doAttack(unit, act.x, act.y, act.z) || 0; } catch (e) { delay = 0; }
                if (delay > 0) {
                    window.setTimeout(() => g.finishComputerAction(), delay);
                } else {
                    st._claudeDelegateOnce = unit.id;   // see note in spell branch
                    st.actionMode = null;
                    st.aiThinking = false;
                    g.maybeTriggerComputerTurn();
                }
            }, act.target);
        }
    }

    // ---- Override: hard focus-fire first, else delegate everything to stock AI.
    window.aiTakeTurn = function (unit) {
        const g = G();
        if (!g) return _baseAiTakeTurn(unit);
        ensureHeightWeights(g);

        // One-shot bail-out: a focus action just got rejected for this unit, so
        // hand this turn to the stock AI (whose leapStrike scorer height-checks
        // and won't re-pick it). Consume the flag immediately so it never sticks.
        if (g.state && g.state._claudeDelegateOnce && unit && g.state._claudeDelegateOnce === unit.id) {
            g.state._claudeDelegateOnce = null;
            return _baseAiTakeTurn(unit);
        }

        try {
            if (unit && !unit.dead && (unit.ap || 0) > 0 &&
                g.state && g.state.phase === 'battle' &&
                !HEALERS.has(unit.cls) &&                 // healers: let stock AI weigh heal vs dmg
                !g.unitHasStatus(unit, 'stun')) {

                const focus = pickTeamFocus(g, unit);
                if (focus) {
                    const act = findFocusDamageAction(g, unit, focus);
                    // Only seize control when we have a real shot. Movement,
                    // positioning (now height-boosted), healing, tower, nexus,
                    // retreat, etc. all stay with the stock AI.
                    if (act && act.est > 0) {
                        executeFocusAction(g, unit, act);
                        return;
                    }
                }
            }
        } catch (e) {
            console.warn('[ainew] focus path error, delegating:', e && e.message);
        }
        return _baseAiTakeTurn(unit);
    };

    // Install the high-ground weight boost immediately if GAME is already up
    // (battle.js loads before us), so it's live before the first AI turn — not
    // only lazily on first aiTakeTurn.
    try { ensureHeightWeights(G()); } catch (e) {}
})();
