// ainew.js — "Claude" AI variant for Entropy Wars.
// =====================================================================
// A SURGICAL drop-in on top of the stock ai.js. Load this AFTER ai.js
// (it captures and delegates to the original window.aiTakeTurn). It layers
// playtested combat edges onto the stock AI's mature framework instead of
// rewriting 4000 lines. v2 — "make it actually hard" pass:
//
//   1) PROACTIVE HIGH-GROUND SEEKING (kept from v1).
//      Elevation matters: downhill ×(1 + 0.10/level), high-ground −5/level
//      flat defense, +1 range for ranged at h≥2. The stock AI weights height
//      at 0.3/0.5 vs distance ×10, so it ignores it. We wrap GAME.getAIWeight
//      to raise the height weights (floor, never lower).
//
//   2) HARD TEAM FOCUS-FIRE (kept, smarter target pick).
//      One shared focus target per team; commitment beats dithering. The
//      focus pick now folds in shields, caster threat (INT), and healers.
//
//   3) REAL DAMAGE ESTIMATION (new). The stock AI estimates atk×0.65 flat
//      and ignores DEF/MDEF/shields entirely, so its "secure kill" bonus
//      routinely fires on non-kills and misses real kills. We mirror the
//      engine's applyDamageToUnit pipeline: base roll midpoint + spellPower,
//      type chart + STAB (getTypeDamageMultiplier), downhill mult, high-ground
//      flat reduction, facing arc mult on basic attacks, armor/mdef, and kill
//      checks against hp + shield (shields absorb first).
//
//   4) PRESS-TURN EXPLOITATION (new). Weakness hits refund +1 AP (an extra
//      action!) — heavily rewarded. Resisted hits DRAIN an extra AP — heavily
//      penalized. Basic-attack whiffs vs high evasion are penalized unless
//      thrown from the back arc (undodgeable).
//
//   5) BACKSTABS (new). Back-arc basic attacks do ×1.25, can't be dodged and
//      can't be countered. Engage-move tile scoring prefers tiles behind the
//      target; the damage estimate applies the real arc multiplier.
//
//   6) AOE SPLASH COUNTING (new). aoe/cross/barrage casts count every extra
//      enemy in the blast (and subtract friendly fire) instead of valuing a
//      3-man meteor like a single-target poke.
//
//   7) HARD CC CASTING (new). The stock AI scores a stun/silence/root at ~10
//      points, so it basically never casts control. We value hard CC on
//      enemies that still have AP (denial), on casters (INT) and healers —
//      it now opens fights by silencing the White Mage instead of chipping
//      the Warrior.
//
//   8) THREAT-AWARE POSITIONING + KITING (new). Shot tiles prefer max range
//      within reach (snipe from 5, don't hug), high ground, back arc, and low
//      enemy retaliation. A unit that is out of AP but still has moves steps
//      AWAY to safety/high ground instead of parking in melee range.
//
// Everything else — healing/revive, potions, tower pushes, nexus channeling,
// CTF, hourglasses, Entropy Strike, retreats, win-condition phases — is
// delegated UNCHANGED to the stock AI, so this stays additive and mode-safe.
// Explicit delegations: pure supports, heal-capable units when an ally is
// dying, flag/hourglass carriers, full Entropy gauge, badly-hurt units
// without a kill available.
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
    // Kinds that participate in Press Turn (battle.js _PRESS_SPELL_KINDS) — a
    // weakness hit with these refunds AP; a resisted hit drains it.
    const PRESS_KINDS = new Set(['damage', 'multiHit', 'ricochet', 'lifeDrain', 'line',
        'linePush', 'splitBeam', 'aoe', 'barrage', 'cross', 'aoePull']);
    // AoE-ish kinds whose splash we count around the primary target.
    const SPLASH_KINDS = new Set(['aoe', 'cross', 'barrage']);
    // Hard CC status ids (blockMove / no-cast / lose-control) — worth an action
    // to deny an enemy its turn. Soft debuffs are left to the stock AI.
    const HARD_CC = new Set(['stun', 'root', 'silence', 'jammed', 'charm', 'sleep',
        'freeze', 'sirenSong']);
    // Used for TARGET prioritization (kill enemy support first) and focus selection.
    const HEALERS = new Set(['White Mage', 'Psychic', 'Harvester']);
    // Classes we let the stock AI fully drive (genuine back-line support: it weighs
    // heal vs. revive vs. attack better than a hard focus-fire override would).
    // NOTE: Harvester is intentionally NOT here — it's a 145-ATK bruiser with big
    // damage spells; treating it as a healer made it camp and barely act. It only
    // drops into the stock heal path when an ally is actually dying (below).
    // Harbinger added 2026-07-10: it's a support bard (Harmonize/Encore/
    // Discordance) — the focus-fire overlay played it like a bruiser and its
    // whole kit sat at the bottom of the win-rate table. The stock AI now has
    // job tendencies (stat-aware buffs, real CC scoring) that use the kit.
    const PURE_SUPPORT = new Set(['White Mage', 'Psychic', 'Harbinger']);
    const HEAL_KINDS = new Set(['heal', 'healAll', 'selfHeal', 'revive']);

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
    // Protected (invulnerable) targets block ALL damage and count as a press
    // MISS (extra AP drain) — never shoot into Protect.
    function isProtected(g, tg) {
        try { return !!(g.unitHasStatus && g.unitHasStatus(tg, 'protect')); } catch (e) { return false; }
    }

    // ---- 1) Elevation: boost high-ground weights once, by wrapping getAIWeight.
    const HEIGHT_WEIGHTS = {
        moveHighGroundRanged_v1: 3.5,  // was 0.3 — ranged really wants the +1 range + downhill
        moveHighGroundMelee_v1: 2.5,   // was 0.5
        moveRetreatHeight_v1: 3.0,
        jumpHighGroundRanged_v1: 18,
        jumpHighGroundMelee_v1: 8,
        flyRangedHeightBonus_v1: 14,
        // Stock CC/status scoring is so timid the AI never casts control; raise
        // the floor so the delegated stock paths value status effects too.
        statusEffectBonus_v1: 40,
        killBonusScore_v1: 60,
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
        console.log('[ainew] v2 active: height weights, focus-fire, press-turn, CC, kiting.');
    }

    function standH(g, u) { try { return g.getUnitStandingHeight(u); } catch (e) { return u.z ?? 0; } }
    function tileH(g, t) {
        if (t.z != null) return t.z;
        try { return g.getHeightAt ? g.getHeightAt(t.x, t.y) : 0; } catch (e) { return 0; }
    }
    function combatDist(g, ax, ay, az, b) {
        try { if (g.combatDist) return g.combatDist(ax, ay, az ?? 0, b.x, b.y, b.z ?? 0); } catch (e) {}
        return Math.abs(ax - b.x) + Math.abs(ay - b.y);
    }
    function typeMult(unit, tg, spellType) {
        try { return window.getTypeDamageMultiplier(unit, tg, spellType || null) || 1; } catch (e) { return 1; }
    }
    function liveEnemies(g, unit) {
        return g.state.units.filter(u => u.player !== unit.player && !u.dead && u.hp > 0 &&
            (typeof g.isEnemyUnit !== 'function' || g.isEnemyUnit(u, unit)) &&
            !isConcealed(g, u, unit.player));
    }
    function liveAllies(g, unit) {
        return g.state.units.filter(u => u.player === unit.player && !u.dead && u.hp > 0);
    }

    // ---- 2) Shared team focus target (hard focus-fire).
    function pickTeamFocus(g, unit) {
        const st = g.state;
        const enemies = liveEnemies(g, unit);
        if (!enemies.length) { st._claudeFocusId = null; return null; }

        // Keep the existing focus if it is still a live enemy (commitment beats
        // dithering — the whole point of focus fire).
        const cur = enemies.find(u => u.id === st._claudeFocusId);
        if (cur) return cur;

        const team = liveAllies(g, unit);
        const cx = team.reduce((s, u) => s + u.x, 0) / (team.length || 1);
        const cy = team.reduce((s, u) => s + u.y, 0) / (team.length || 1);
        // Lowest effective HP (incl. shield), pulled toward enemies near the
        // team; healers and big casters first — kill the support core.
        enemies.sort((a, b) => {
            const eff = u => (u.hp + (u.shield || 0));
            let ka = HEALERS.has(a.cls) ? -300 : 0, kb = HEALERS.has(b.cls) ? -300 : 0;
            ka -= Math.min(200, (a.int || 0) * 2);
            kb -= Math.min(200, (b.int || 0) * 2);
            const da = Math.abs(a.x - cx) + Math.abs(a.y - cy);
            const db = Math.abs(b.x - cx) + Math.abs(b.y - cy);
            return (eff(a) + ka + da * 25) - (eff(b) + kb + db * 25);
        });
        st._claudeFocusId = enemies[0].id;
        return enemies[0];
    }

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
        // sky* throws/drops flagged requiresFlight can only be cast by a flyer
        // (and not one that is flight-crippled below 25% HP).
        if (sp.requiresFlight &&
            (sp.kind === 'skyDrop' || sp.kind === 'skyThrow' || sp.kind === 'skySlam')) {
            try {
                if (typeof g.canFly === 'function' && !g.canFly(unit)) return false;
                if (typeof g.isFlightCrippled === 'function' && g.isFlightCrippled(unit)) return false;
            } catch (e) {}
        }
        return true;
    }

    // ---- 3) Real damage estimation, mirroring applyDamageToUnit's pipeline:
    // base + spellPower → type chart (incl. STAB) → downhill ×(1+0.1Δh) →
    // high-ground −5Δh → facing arc (basic attacks) → armor/mdef → floor 1.
    // Kill checks must beat hp + shield (shields absorb first).
    function baseSpellDmg(sp) {
        return sp.dmg || (sp.hitDamages ? sp.hitDamages.reduce((a, b) => a + b, 0) : 0) ||
            (sp.kind === 'barrage' || sp.kind === 'aoe' ? 120 : 90);
    }
    function estDamage(g, unit, tg, sp, fromX, fromY, fromH) {
        let raw, dmgType = 'physical', ignoreArmor = false;
        if (sp) {
            raw = baseSpellDmg(sp) + (unit.spellPower || 0);
            dmgType = sp.damageType === 'magic' ? 'magic' : 'physical';
            ignoreArmor = !!sp.ignoreArmor;
        } else {
            // engine: max(24, floor(atk*0.65) + rand(40) - 16) → midpoint +4
            raw = Math.max(24, Math.floor((unit.atk || 60) * 0.65) + 4);
        }
        let est = raw * typeMult(unit, tg, sp ? sp.spellType : null);
        const myH = fromH != null ? fromH : standH(g, unit);
        const th = standH(g, tg);
        if (!ignoreArmor) {
            if (myH > th) est *= 1 + 0.1 * (myH - th);          // downhill bonus
            if (th > myH) est -= 5 * (th - myH);                // high-ground defense
        }
        if (!sp) {
            try {
                const arc = g.getAttackArc({ x: fromX != null ? fromX : unit.x, y: fromY != null ? fromY : unit.y }, tg);
                est *= g.getFacingDamageMult(arc) || 1;         // ×1.25 back, ×1.10 flank
            } catch (e) {}
        }
        if (!ignoreArmor) {
            const armor = dmgType === 'magic' ? (tg.mdef || 0) : (tg.def || 0);
            est -= armor * 0.8;                                  // getEffectiveArmor approx
        }
        return Math.max(1, est);
    }
    function effHp(tg) { return tg.hp + (tg.shield || 0); }

    // Press Turn: does this action hit a type weakness / resist tier?
    // Detected off the chart tier, matching the engine's press detection.
    function pressTier(unit, tg, spellType) {
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
        if (hasStrong && !hasWeak) return 1;    // WEAK hit → +1 AP refund
        if (hasWeak && !hasStrong) return -1;   // RESIST → −1 AP drain
        return 0;
    }
    function attackArcOf(g, fromX, fromY, tg) {
        try { return g.getAttackArc({ x: fromX, y: fromY }, tg); } catch (e) { return 'front'; }
    }

    // Hard-CC value of a spell's status riders against a target: denying a
    // full-AP caster/healer its turn outvalues 150 chip damage.
    function ccValue(g, unit, sp, tg) {
        const fx = sp.statusEffects;
        if (!fx || !fx.length) return 0;
        let v = 0;
        for (const f of fx) {
            const id = f && f.id;
            if (!id) continue;
            try { if (g.unitHasStatus(tg, id)) continue; } catch (e) {}
            if (HARD_CC.has(id)) {
                v += 700 + 250 * Math.min(3, tg.ap || 0);        // AP denial is the point
                v += Math.min(400, (tg.int || 0) * 4);           // shut down casters
                if (HEALERS.has(tg.cls)) v += 800;               // silence the healer
            } else {
                v += 60;                                          // soft riders: small nudge
            }
        }
        return v;
    }

    // Find the best action available from where `unit` stands right now:
    // damage weighted hard toward the shared focus + secure kills + press
    // refunds + splash, plus pure hard-CC casts on dangerous enemies.
    function findFocusAction(g, unit, focus) {
        const myH = standH(g, unit);
        const scoreDmg = (tg, est, opts) => {
            opts = opts || {};
            let s = est;
            if (est >= effHp(tg)) s += 50000;                    // secure the kill
            s += (tg.maxHp - tg.hp) * 1.5;                       // pile onto the wounded
            if (focus && tg.id === focus.id) s += 8000;          // HARD focus fire
            if (HEALERS.has(tg.cls)) s += 4000;                  // kill support first
            if ((tg.ap || 0) <= 0) s += 40;                      // acted targets hit harder
            // Press Turn: a weakness hit refunds +1 AP = a whole extra action;
            // a resisted hit DRAINS one. Weigh both like the actions they are.
            if (opts.press) {
                const tier = pressTier(unit, tg, opts.spellType || null);
                if (tier > 0) s += Math.max(150, wght(g, 'pressRefundValue_v1', 55) * 3);
                else if (tier < 0) s -= 220;
            }
            if (opts.canMiss && typeof g.getEvasionChance === 'function') {
                try { s -= (g.getEvasionChance(tg) || 0) * wght(g, 'whiffRiskPenalty_v1', 30) * 2; } catch (e) {}
            }
            return s;
        };

        let best = null;
        const isEnemyTgt = tg => tg && tg.player !== unit.player && !tg.dead && tg.hp > 0 &&
            !isConcealed(g, tg, unit.player) && !isProtected(g, tg);

        // spells (damage + pure hard-CC debuffs)
        if (!g.unitHasStatus(unit, 'silence')) {
            for (const sp of (unit.spells || [])) {
                const isDmg = DMG_KINDS.has(sp.kind);
                const isCC = !isDmg && (sp.kind === 'debuff' || sp.kind === 'zoneDebuff') &&
                    (sp.statusEffects || []).some(f => f && HARD_CC.has(f.id));
                if (!isDmg && !isCC) continue;
                if (!g.canAffordSpell(unit, sp)) continue;
                if ((unit.mp || 0) < (sp.cost || 0)) continue;

                // Line beams fire along the 8 rays from the caster and hit ONLY
                // enemies exactly on the ray (engine walks sign(target-caster)
                // and stops at impassable terrain). getSpellRangeTiles returns
                // a Manhattan blob, so scoring it like a normal ranged spell
                // made the AI constantly beam at unhittable targets — ~50% of
                // Ki Wave / Heat Ray / Hellmouth casts hit zero units. Walk the
                // real rays instead and value every enemy the beam crosses.
                if (sp.kind === 'line' || sp.kind === 'linePush') {
                    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
                    const len = Math.max(g.bw ? g.bw() : 20, g.bh ? g.bh() : 20);
                    for (const [ddx, ddy] of dirs) {
                        let rayTargets = [], first = null;
                        for (let i = 1; i <= len; i++) {
                            const tx = unit.x + ddx * i, ty = unit.y + ddy * i;
                            let passable = true;
                            try { passable = !g.isTerrainPassable || g.isTerrainPassable(tx, ty); } catch (e) {}
                            if (tx < 0 || ty < 0 || (g.bw && tx >= g.bw()) || (g.bh && ty >= g.bh())) break;
                            if (!passable && !sp.destroysObstacles) break;
                            const tg = g.unitAt(tx, ty);
                            if (isEnemyTgt(tg) && spellPreconditionOk(g, unit, sp, tg)) {
                                rayTargets.push(tg);
                                if (!first) first = { x: tx, y: ty, z: tg.z, tg };
                            }
                        }
                        if (!first) continue;
                        const prim = rayTargets[0];
                        const est = estDamage(g, unit, prim, sp);
                        let sc = scoreDmg(prim, est, { spellType: sp.spellType || null, canMiss: false, press: PRESS_KINDS.has(sp.kind) });
                        for (let ri = 1; ri < rayTargets.length; ri++) {
                            const oe = estDamage(g, unit, rayTargets[ri], sp);
                            sc += oe * 0.9 + (oe >= effHp(rayTargets[ri]) ? 3000 : 0);
                        }
                        sc += ccValue(g, unit, sp, prim) * 0.6;
                        if (!best || sc > best.score) best = { kind: 'spell', spell: sp, target: prim, x: first.x, y: first.y, z: first.z, est, score: sc };
                    }
                    continue;
                }

                let tiles; try { tiles = g.getSpellRangeTiles(unit, sp) || []; } catch (e) { continue; }
                for (const t of tiles) {
                    const tg = g.unitAt(t.x, t.y, t.z);
                    if (!isEnemyTgt(tg)) continue;
                    if (!spellPreconditionOk(g, unit, sp, tg)) continue;
                    let sc, est = 0;
                    if (isDmg) {
                        est = estDamage(g, unit, tg, sp) * (sp.guaranteedCrit ? 1.5 : 1);
                        sc = scoreDmg(tg, est, { spellType: sp.spellType || null, canMiss: false, press: PRESS_KINDS.has(sp.kind) });
                        // splash: count extra enemies (and friendly fire) in the blast
                        if (SPLASH_KINDS.has(sp.kind)) {
                            const rad = sp.aoeRadius || sp.crossRadius || 1;
                            for (const o of g.state.units) {
                                if (o === tg || o.dead || o.hp <= 0) continue;
                                if (Math.max(Math.abs(o.x - t.x), Math.abs(o.y - t.y)) > rad) continue;
                                if (o.player !== unit.player) {
                                    const oe = estDamage(g, unit, o, sp);
                                    sc += oe * 0.9 + (oe >= effHp(o) ? 3000 : 0);
                                } else {
                                    sc -= estDamage(g, unit, o, sp) * 1.4;   // don't nuke the team
                                }
                            }
                        }
                        sc += ccValue(g, unit, sp, tg) * 0.6;            // CC riders on damage
                    } else {
                        const cv = ccValue(g, unit, sp, tg);
                        if (cv < 600) continue;                          // hard CC only
                        sc = cv + (focus && tg.id === focus.id ? 8000 : 0) - 1;
                    }
                    if (!best || sc > best.score) best = { kind: 'spell', spell: sp, target: tg, x: t.x, y: t.y, z: t.z, est, score: sc };
                }
            }
        }
        // basic attack (press-eligible; back-arc is undodgeable + ×1.25)
        if (g.canUnitAct(unit)) {
            let tiles; try { tiles = g.getAttackTiles(unit) || []; } catch (e) { tiles = []; }
            for (const t of tiles) {
                const tg = g.unitAt(t.x, t.y, t.z);
                if (!isEnemyTgt(tg)) continue;
                const est = estDamage(g, unit, tg, null, unit.x, unit.y, myH);
                const backArc = attackArcOf(g, unit.x, unit.y, tg) === 'back';
                const sc = scoreDmg(tg, est, { spellType: null, canMiss: !backArc, press: true }) - 1; // tie-break toward spells
                if (!best || sc > best.score) best = { kind: 'attack', target: tg, x: t.x, y: t.y, z: t.z, est, score: sc };
            }
        }
        return best;
    }
    function wght(g, key, dflt) {
        try { const v = g.getAIWeight(key); return (v == null || isNaN(v)) ? dflt : v; } catch (e) { return dflt; }
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
                // Line beams: re-aim from the caster's CURRENT position at cast
                // time — the target can move during the telegraph delay, and a
                // stale tile means a sign-direction beam that hits nobody.
                let cx = act.x, cy = act.y, cz = act.z;
                if ((act.spell.kind === 'line' || act.spell.kind === 'linePush')
                    && typeof window._aiReaimLineSpell === 'function') {
                    const aim = window._aiReaimLineSpell(unit, act.spell, act.target && act.target.id);
                    if (!aim) {
                        // every ray whiffs now — don't burn the AP, delegate
                        st._claudeDelegateOnce = unit.id;
                        st.selectedTool = null;
                        st.actionMode = null;
                        st.aiThinking = false;
                        g.maybeTriggerComputerTurn();
                        return;
                    }
                    cx = aim.x; cy = aim.y; cz = undefined;
                }
                try { delay = g.doSpell(unit, cx, cy, cz) || 0; } catch (e) { delay = 0; }
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

    // ---- Support gating: should this unit drop to the stock heal/support path?
    function hasHealSpell(unit) {
        return (unit.spells || []).some(s => HEAL_KINDS.has(s.kind));
    }
    function anAllyIsDying(g, unit) {
        const st = g.state;
        return st.units.some(u => !u.dead && u.hp > 0 && u.player === unit.player &&
            (u.hp / (u.maxHp || 1)) < 0.5 &&
            (u.id === unit.id || (Math.abs(u.x - unit.x) + Math.abs(u.y - unit.y)) <= 8));
    }
    // Objective carriers (flag / hourglass) get the stock AI's carry-and-flee
    // logic — never drag them into a brawl.
    function isCarrier(g, unit) {
        const st = g.state;
        try {
            if (st.flags && Object.values(st.flags).some(f => f && f.carriedBy === unit.id)) return true;
            if (st.hourglasses && st.hourglasses.some(h => h && h.carriedBy === unit.id)) return true;
        } catch (e) {}
        return false;
    }

    // ---- 4) Positioning. Threat = how much damage the enemy team can put on a
    // tile next activation (coarse move+range reach, like the stock threat map).
    function threatAt(g, tx, ty, tz, enemies) {
        let t = 0;
        for (const e of enemies) {
            if (isProtected(g, e)) continue;
            let er = 1, em = 2;
            try { er = g.getEffectiveRange(e) || (e.range || 1); } catch (q) { er = e.range || 1; }
            try { em = g.getEffectiveMove(e) || (e.move || 2); } catch (q) { em = e.move || 2; }
            const d = combatDist(g, tx, ty, tz, e);
            if (d <= em + er) t += Math.max(24, Math.floor((e.atk || 60) * 0.65));
        }
        return t;
    }
    // Hazard ground (2026-07-09, mirrors ai.js aiHazardPenaltyAt): pending
    // delayed-spell blast tiles (Crystal Ball marks are announced), lava, deep
    // water, poison/scorched and actively burning tiles. The overlay's move
    // pickers previously scored tiles on enemy threat only, so focus-fire units
    // would happily stand on a telegraphed detonation.
    function hazardAt(g, unit, x, y) {
        let pen = 0;
        const delayed = (g.state && g.state._delayedSpells) || [];
        for (const ds of delayed) {
            if (!ds || ds.markedUnitId || ds.x == null) continue;
            const r = ds.aoeRadius != null ? ds.aoeRadius : 1;
            if (Math.abs(x - ds.x) <= r && Math.abs(y - ds.y) <= r) {
                pen += Math.max(60, Math.min(140, ds.dmg || 100));
            }
        }
        let terr = null;
        try { terr = g.getTerrainAt ? g.getTerrainAt(x, y) : null; } catch (e) {}
        if (terr === 'lava' && !(typeof unitIsLavaAdapted === 'function' && unitIsLavaAdapted(unit))) pen += 90;
        else if (terr === 'deep_water' && !(typeof unitIsDeepWaterAdapted === 'function' && unitIsDeepWaterAdapted(unit))) pen += 60;
        else if (terr === 'poison' || terr === 'scorched') pen += 30;
        try { if (typeof _tileIsBurning === 'function' && _tileIsBurning(x, y)) pen += 45; } catch (e) {}
        return pen;
    }
    // Best effective reach this unit could fire with from a new tile (basic attack
    // plus any affordable damage spell) — what "in range" means for engaging.
    function reachOf(g, unit) {
        let r = 1;
        try { r = g.getEffectiveRange(unit) || 1; } catch (e) { r = unit.range || 1; }
        if (!g.unitHasStatus(unit, 'silence')) {
            for (const sp of (unit.spells || [])) {
                if (!DMG_KINDS.has(sp.kind)) continue;
                if (!g.canAffordSpell(unit, sp)) continue;
                if ((unit.mp || 0) < (sp.cost || 0)) continue;
                let er = sp.range || 0;
                try { if (g.getEffectiveSpellRange) er = g.getEffectiveSpellRange(unit, sp); } catch (e) {}
                if (er > r) r = er;
            }
        }
        return r;
    }
    // Move-to-engage: deliver the unit INTO firing range (or close the gap when
    // no tile reaches) so the focus shot fires on the next loop. Tile scoring:
    // stand as FAR as reach allows (snipers snipe), take high ground, circle to
    // the back arc, avoid enemy-covered tiles, converge on the shared focus.
    function pickEngageMove(g, unit, focus) {
        if (!g.canUnitMove || !g.canUnitMove(unit)) return null;
        let tiles; try { tiles = g.getMoveTiles(unit) || []; } catch (e) { return null; }
        if (!tiles.length) return null;
        const enemies = liveEnemies(g, unit);
        if (!enemies.length) return null;
        const reach = reachOf(g, unit);
        const recent = new Set(unit._aiRecentTiles || []);
        const blocked = (tx, ty, e) => {
            try { return g.isRangeBlockedByTerrain && g.isRangeBlockedByTerrain(tx, ty, e.x, e.y); } catch (q) { return false; }
        };

        // 1) Prefer a reachable tile that opens a shot — on the shared focus if we
        //    can, else any enemy.
        let best = null;
        for (const t of tiles) {
            if (t.x === unit.x && t.y === unit.y) continue;
            const th = tileH(g, t);
            const tThreat = threatAt(g, t.x, t.y, t.z, enemies);
            for (const e of enemies) {
                if (isProtected(g, e)) continue;
                const d = combatDist(g, t.x, t.y, t.z, e);
                if (d < 1 || d > reach) continue;
                if (blocked(t.x, t.y, e)) continue;
                let s = 2000 + Math.min(d, reach) * 12;             // max standoff range
                if (focus && e.id === focus.id) s += 4000;          // converge the team
                if (HEALERS.has(e.cls)) s += 1500;                  // collapse on support
                s += (e.maxHp - e.hp) * 0.5;                        // finish the wounded
                const eH = standH(g, e);
                if (th > eH) s += (th - eH) * 30;                   // downhill shot
                const arc = attackArcOf(g, t.x, t.y, e);
                if (arc === 'back') s += 180;                       // ×1.25, undodgeable
                else if (arc !== 'front') s += 60;
                s -= tThreat * 0.35;                                // stay out of the pocket
                s -= hazardAt(g, unit, t.x, t.y) * 6;               // never snipe from a mine
                if (recent.has(g.posKey(t.x, t.y))) s -= 80;        // anti-oscillation
                if (!best || s > best.score) best = { x: t.x, y: t.y, z: t.z, score: s };
            }
        }
        if (best) return best;

        // 2) No tile reaches — march at the focus (or nearest enemy) to close the
        //    gap. Only commit if the step actually gets us closer.
        let tgt = focus;
        if (!tgt) {
            tgt = enemies.slice().sort((a, b) =>
                combatDist(g, unit.x, unit.y, unit.z, a) - combatDist(g, unit.x, unit.y, unit.z, b))[0];
        }
        const curD = combatDist(g, unit.x, unit.y, unit.z, tgt);
        let approach = null;
        for (const t of tiles) {
            if (t.x === unit.x && t.y === unit.y) continue;
            const d = combatDist(g, t.x, t.y, t.z, tgt);
            let s = (curD - d) * 100;
            s += tileH(g, t) * 5;                                   // take the high road
            s -= threatAt(g, t.x, t.y, t.z, enemies) * 0.2;         // don't march into 3 guns
            s -= hazardAt(g, unit, t.x, t.y) * 2;                   // don't march THROUGH fire either
            if (recent.has(g.posKey(t.x, t.y))) s -= 60;
            if (!approach || s > approach.score) approach = { x: t.x, y: t.y, z: t.z, score: s };
        }
        if (approach && approach.score > 0) return approach;
        return null;
    }
    // Kite/reposition: the unit has NO action left (out of AP / nothing castable)
    // but can still move — step to safety + high ground instead of standing in
    // melee range waiting to be focus-fired. Only commits when the new tile is a
    // real improvement over standing still.
    function pickRepositionMove(g, unit) {
        if (!g.canUnitMove || !g.canUnitMove(unit)) return null;
        let tiles; try { tiles = g.getMoveTiles(unit) || []; } catch (e) { return null; }
        if (!tiles.length) return null;
        const enemies = liveEnemies(g, unit);
        if (!enemies.length) return null;
        const recent = new Set(unit._aiRecentTiles || []);
        const scoreTile = (x, y, z, h) => {
            let s = -threatAt(g, x, y, z, enemies) * 1.0;
            const nd = Math.min.apply(null, enemies.map(e => combatDist(g, x, y, z, e)));
            s += Math.min(nd, 6) * 15;                              // open the gap
            s += h * 25;                                             // high ground defends
            s -= hazardAt(g, unit, x, y) * 2;                       // hazard ground is not "safety"
            return s;
        };
        const cur = scoreTile(unit.x, unit.y, unit.z, standH(g, unit));
        let best = null;
        for (const t of tiles) {
            if (t.x === unit.x && t.y === unit.y) continue;
            let s = scoreTile(t.x, t.y, t.z, tileH(g, t));
            if (recent.has(g.posKey(t.x, t.y))) s -= 40;
            if (!best || s > best.score) best = { x: t.x, y: t.y, z: t.z, score: s };
        }
        if (best && best.score > cur + 20) return best;
        return null;
    }
    // Execute a move following the engine contract, mirroring stock executeAction's
    // 'move' case (inline doMove → schedule finish on the returned anim delay).
    function executeEngageMove(g, unit, mv) {
        const st = g.state;
        st.actionMode = 'move';
        if (!unit._aiRecentTiles) unit._aiRecentTiles = [];
        unit._aiRecentTiles.push(g.posKey(unit.x, unit.y));
        if (unit._aiRecentTiles.length > 3) unit._aiRecentTiles.shift();
        const px = unit.x, py = unit.y;
        let res; try { res = g.doMove(unit, mv.x, mv.y, mv.z); } catch (e) { res = false; }
        const moved = (unit.x !== px || unit.y !== py);
        if (!moved) {
            // Blocked — hand to the stock AI rather than re-pick the same tile and spin.
            st._claudeDelegateOnce = unit.id;
            st.actionMode = null;
            st.aiThinking = false;
            g.maybeTriggerComputerTurn();
            return;
        }
        const delay = (typeof res === 'number' && res > 1) ? res : 0;
        if (delay > 0) window.setTimeout(() => g.finishComputerAction(), delay);
        else g.finishComputerAction();
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
                !g.unitHasStatus(unit, 'stun')) {

                // Full Entropy gauge: the stock AI scores ENTROPY STRIKE at 200+
                // and fires it — never let the focus path starve the team nuke.
                try { if (g.canUseEntropyStrike && g.canUseEntropyStrike(unit)) return _baseAiTakeTurn(unit); } catch (e) {}
                // Flag / hourglass carriers keep the stock carry-and-score logic.
                if (isCarrier(g, unit)) return _baseAiTakeTurn(unit);
                // Genuine back-line support stays on the stock heal/revive logic.
                // Harvesters (and any heal-capable bruiser) only defer when an ally
                // is actually dying; otherwise they fight.
                if (PURE_SUPPORT.has(unit.cls)) return _baseAiTakeTurn(unit);
                if (hasHealSpell(unit) && anAllyIsDying(g, unit)) return _baseAiTakeTurn(unit);

                // Per-activation loop guard. We bypass the stock loop counter on the
                // aggressive path, so cap our own action chain; the engine grants AP
                // at activation start, so a rise in AP marks a fresh turn → reset.
                const ap = unit.ap || 0;
                if (unit._claudeLastAp == null || ap > unit._claudeLastAp) unit._claudeActs = 0;
                unit._claudeLastAp = ap;
                if ((unit._claudeActs || 0) >= 12) return _baseAiTakeTurn(unit);

                const focus = pickTeamFocus(g, unit);
                if (focus) {
                    const act = findFocusAction(g, unit, focus);
                    const lethal = act && act.target && act.est >= effHp(act.target);

                    // Self-preservation: a badly-hurt unit hands off to the stock AI
                    // (retreat / potion / self-heal) UNLESS it can secure a kill —
                    // never walk away from lethal.
                    const lowHp = unit.maxHp > 0 && (unit.hp / unit.maxHp) < 0.28;
                    if (lowHp && !lethal) return _baseAiTakeTurn(unit);

                    // a) Shot (or hard CC) from here → take it.
                    if (act && act.score > 0) {
                        unit._claudeActs = (unit._claudeActs || 0) + 1;
                        executeFocusAction(g, unit, act);
                        return;
                    }
                    // b) No shot. If the unit can still act, move to engage (step
                    //    into range, else close the gap) — the shot fires on the
                    //    re-triggered loop. If it CANNOT act anymore (AP spent),
                    //    spend leftover moves kiting to safety/high ground.
                    const mv = g.canUnitAct(unit)
                        ? pickEngageMove(g, unit, focus)
                        : pickRepositionMove(g, unit);
                    if (mv) {
                        unit._claudeActs = (unit._claudeActs || 0) + 1;
                        executeEngageMove(g, unit, mv);
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
