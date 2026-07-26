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
    let _aiLastRecallFailed = false;
    let _failedItems = new Set();

    function _effRange(unit, spell) {
        const g = G();
        return (g && typeof g.getEffectiveSpellRange === 'function')
            ? g.getEffectiveSpellRange(unit, spell)
            : (spell.range || 0);
    }

    // ── CPU DIFFICULTY (schema 12) ───────────────────────────────────────
    // Difficulty changes HOW WELL the AI executes decisions, never its stats
    // (the XCOM model: below Normal remove capabilities, never add cheats).
    //  easy   — samples softmax-randomly among the top few candidates (human-
    //           looking "good but not best" picks), never combos, ignores
    //           press-refund lines, and ainew.js's focus-fire/CC overlay is
    //           bypassed entirely (stock AI only).
    //  normal — the trained champion + ainew overlay, unchanged argmax.
    //  hard   — same execution as normal, plus an "objective persona":
    //           tower/hourglass/nexus/flag intents ×1.3, so it presses win
    //           conditions instead of trading kills forever.
    // AI-vs-AI harnesses (training / strength test / balance lab run under
    // devAutoSim) are pinned to 'normal' so measurements stay comparable.
    const AI_DIFFICULTY_PROFILES = {
        easy:   { pickTopN: 3, softmaxT: 22, combos: false, press: false, objectiveMult: 1.0 },
        normal: { pickTopN: 1, softmaxT: 0,  combos: true,  press: true,  objectiveMult: 1.0 },
        hard:   { pickTopN: 1, softmaxT: 0,  combos: true,  press: true,  objectiveMult: 1.3 },
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

    // ── Retired schema-12 weights, frozen as constants ───────────────────
    // The gen-100 A/B run (5652 matches) showed each of these either pinned
    // against a range edge, statistically flat across every experiment, or
    // (the jump family / enemySpawnZonePenalty) referenced by no code at all.
    // Their trained values are hardcoded here so the trainer spends its
    // matches on the ~16 weights that actually move win rate. Hand-tune
    // freely — these are design knobs now, not learned parameters.
    const AI_TUNE = {
        markedTargetBonus: 5,        // trainer pinned at min 2 = imperceptible; raised to matter
        hourglassTargetBonus: 20,
        whiffRiskPenalty: 0,         // two experiments said "feature off wins"
        hgCarrierFleeAdv: -0.23,
        safeAllyProximity: 1,
        towerLowHpPush: 25,
        towerMidHpPush: 30.5,
        towerClearBonus: 29.75,
        levelAggressionMod: 0.006,   // progression modes only (PvP is level-normalized)
        nearLevelUpBonus: 1.75,      // progression modes only
        recallBonus: 8,
        mpPotionPriority: 280,       // sat at range max through 8 experiments
        earlyExploreBonus: 15.75,
        reshapeRangedRaise: 15.25,
        reshapePerEnemy: 6.5,
        reshapeDefensive: 3.6,
        moveHighGroundRanged: 0.6,
        moveHighGroundMelee: 2.0,
        moveRetreatHeight: 2.1,
        landToChannelBonus: 17.25,
        flyEscapeMeleeBonus: 6.7,
        flyRangedHeightBonus: 14.1,
    };

    // ── Job tendencies (2026-07-10) ──────────────────────────────────────
    // A light, general behavior bias per job so units "play their role":
    // White Mages put healing first, Black Mages hang back and cast instead
    // of poking with a stick, Psychics/Harbingers actually use their control
    // and support kits, front-liners brawl. These are multipliers layered on
    // top of normal scoring — they nudge, they don't script.
    const JOB_TENDENCIES = {
        'White Mage': { support: 1.6, control: 1.1, spellDmg: 0.6, backline: true, healFirst: true },
        'Black Mage': { support: 0.8, control: 1.1, spellDmg: 1.35, backline: true, preferSpells: true },
        'Psychic':    { support: 1.25, control: 1.5, spellDmg: 1.0, backline: true },
        'Harbinger':  { support: 1.5, control: 1.4, spellDmg: 0.9, backline: true },
        'Sniper':     { spellDmg: 1.1, backline: true },
        'Harvester':  { support: 1.25 },
        'Engineer':   { support: 1.1 },
        'Gunslinger': { spellDmg: 1.15 },
        'Warrior':    { frontline: true },
        'Tank':       { frontline: true, support: 1.1 },
        'Raider':     { frontline: true },
        'Agent':      { frontline: true },
        'Swordmaster':{ frontline: true },
    };
    const SUPPORT_KINDS_T = ['heal', 'healAll', 'selfHeal', 'revive', 'cleanse', 'buff', 'shield', 'warCry', 'encore', 'manaRestoreAll'];
    const CONTROL_KINDS_T = ['debuff', 'zoneDebuff'];
    const DMG_KINDS_T = ['damage', 'ricochet', 'multiHit', 'aoe', 'barrage', 'lifeDrain',
        'line', 'linePush', 'cross', 'aoePull', 'splitBeam', 'dash',
        'skyDrop', 'skyThrow', 'skySlam', 'leapStrike', 'displacement', 'pull', 'bomb', 'delayed'];

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
        for (const a of _turnActionLog) {
            if (a.targetId === targetId) n++;
        }
        return n;
    }

    function hasUsedSpellKind(kind) {
        return _turnActionLog.some(a => a.spellKind === kind);
    }

    function countProductiveActions() {
        return _turnActionLog.filter(a =>
            a.type !== 'move' && a.type !== 'guard' && a.type !== 'inspect'
        ).length;
    }

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

    // End-of-turn facing discipline: square up on the nearest visible enemy so
    // the unit doesn't leave its back (undodgeable +25% backstabs, free
    // follow-ups) exposed to whoever acts next.
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
            _aiLastRecallFailed = false;
            _failedItems = new Set();
            _turnActionLog = [];
            unit._aiStallCount = 0;
        }

        // Gauntlet: a badly-hurt unit retreats to the bench, sending in a fresh
        // reserve (which then acts with the leftover AP). Only on the first action.
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
                zoom: 1.35, holdMs: 3000, persist: false, transitionMs: 500,
                _fogAllowed: true
            });
        }

        const vision = buildVision(unit);
        const candidates = gatherCandidates(unit, vision);

        for (const c of candidates) {

            if (c.type === 'spell' && c.spell) {
                const priorUses = countPriorUses('spell', c.spell.id);
                // Damage spells may repeat within an activation (a Black Mage
                // WITH the mana and AP for two Fireballs should throw two) —
                // the old flat ×0.15 after one cast crippled one-spell kits
                // (Ki Wave, Heat Ray). Utility/buff kinds keep the hard clamp
                // so the AI doesn't loop self-buffs all turn.
                const _isDmgKind = ['damage', 'ricochet', 'multiHit', 'aoe', 'barrage', 'lifeDrain',
                    'line', 'linePush', 'cross', 'aoePull', 'splitBeam', 'dash',
                    'skyDrop', 'skyThrow', 'skySlam', 'leapStrike'].includes(c.spell.kind);
                if (_isDmgKind) {
                    if (priorUses >= 3) { c.score = -999; continue; }
                    if (priorUses >= 1) c.score *= Math.pow(0.65, priorUses);
                } else {
                    if (priorUses >= 2) { c.score = -999; continue; }
                    if (priorUses >= 1) c.score *= 0.15;
                }
            }

            if (c.target?.id) {
                const priorTargets = countPriorTargeting(c.target.id);
                // Don't spread damage away from a nearly-dead enemy — finishing
                // the kill is the whole point of focusing it. Only penalize
                // re-targeting healthy targets (anti-tunnel-vision).
                const _finishing = typeof c.target.hp === 'number' && typeof c.target.maxHp === 'number'
                    && c.target.hp / c.target.maxHp <= 0.45;
                if (!_finishing) {
                    if (priorTargets >= 2) c.score *= 0.45;
                    else if (priorTargets >= 1) c.score *= 0.75;
                }
            }

            if (c.spell?.kind) {
                const nonRepeatableKinds = ['swap', 'terrainCreate', 'summonWeather', 'deployObject',
                    'deployPair', 'warpRune', 'remoteView', 'scan', 'encore',
                    'placeTrap', 'placeBlock', 'buildStructure', 'tuneFrequency', 'pulseLattice'];
                if (nonRepeatableKinds.includes(c.spell.kind) && hasUsedSpellKind(c.spell.kind)) {
                    c.score *= 0.1;
                }
            }
        }

        candidates.sort((a, b) => b.score - a.score);
        applySurvivalPenalties(unit, candidates, vision);

        const bestDamageScore = Math.max(0, ...candidates
            .filter(c => ['attack', 'attack_tower', 'combo'].includes(c.type) ||
                (c.type === 'spell' && c.spell && ['damage', 'ricochet', 'multiHit',
                    'aoe', 'barrage', 'lifeDrain', 'line', 'linePush', 'cross',
                    'aoePull', 'splitBeam', 'displacement', 'pull', 'dash', 'skyDrop', 'skyThrow', 'skySlam', 'leapStrike'].includes(c.spell.kind)))
            .map(c => c.score));
        const bestMoveScore = Math.max(0, ...candidates
            .filter(c => c.type === 'move')
            .map(c => c.score));

        const nullMoveBaseline = vision.visibleEnemies.length > 0
            ? Math.max(bestMoveScore * 0.8, 15)
            : 5;

        for (const c of candidates) {

            if (c.type === 'spell' && c.spell) {
                const kind = c.spell.kind;
                const isPositionUtility = ['swap', 'teleport', 'remoteView', 'warpRune'].includes(kind);
                const isTerrainUtility = ['terrainCreate', 'summonWeather'].includes(kind);
                const isBuffUtility = ['buff', 'warCry', 'shield', 'encore'].includes(kind);
                const isDeployUtility = ['deployObject', 'deployPair', 'deployTurret', 'placeMirror'].includes(kind);

                if (isPositionUtility) {

                    const cap = Math.max(bestDamageScore * 0.8, 60);
                    if (c.score > cap) c.score = cap;
                }
                if (isTerrainUtility) {

                    const cap = Math.max(bestDamageScore * 0.6, 40);
                    if (c.score > cap) c.score = cap;
                }
                if (isBuffUtility && vision.visibleEnemies.length === 0) {

                    const cap = Math.max(bestMoveScore * 0.7, 25);
                    if (c.score > cap) c.score = cap;
                }
                if (isDeployUtility && vision.visibleEnemies.length === 0) {

                    const cap = Math.max(bestMoveScore * 0.5, 20);
                    if (c.score > cap) c.score = cap;
                }
            }

            if (c.score > 0 && c.score < nullMoveBaseline) {
                const isEssential = ['attack', 'attack_tower', 'combo', 'move',
                    'item_targeted', 'panacea', 'warpStone', 'nexus_channel',
                    'church', 'shop_buy', 'shop_spell_buy', 'grab_hg'].includes(c.type);
                const isDamageSpell = c.type === 'spell' && c.spell &&
                    ['damage', 'ricochet', 'multiHit', 'aoe', 'barrage', 'lifeDrain',
                        'line', 'linePush', 'cross', 'aoePull', 'splitBeam',
                        'displacement', 'pull', 'dash', 'skyDrop', 'skyThrow', 'skySlam', 'leapStrike', 'heal', 'healAll',
                        'revive', 'selfHeal', 'cleanse', 'debuff', 'zoneDebuff'].includes(c.spell.kind);
                if (!isEssential && !isDamageSpell) {
                    c.score = 0;
                }
            }
        }

        const productiveCount = countProductiveActions();
        for (const c of candidates) {
            if (c.type === 'guard') {

                if (productiveCount >= 2) c.score += 12;
                else if (productiveCount >= 1) c.score += 5;
                else if (unit._aiLoopCount <= 1) c.score *= 0.3;
            }
        }

        const boardScore = vision.winState.boardScore || 0;
        if (boardScore < -30) {
            for (const c of candidates) {
                if (c.type === 'guard' || c.type === 'kite_retreat') c.score += 8;
                if (c.type === 'item' && c.itemKey === 'healPotion') c.score += 6;
            }
        } else if (boardScore > 40) {
            for (const c of candidates) {
                // (was 'tower_attack' — a type that doesn't exist, so the
                // "winning big → press the tower" bonus never fired)
                if (c.type === 'attack_tower') c.score += 10;
            }
        }

        candidates.sort((a, b) => b.score - a.score);
        let best = candidates[0];

        // Easy CPU: sample softmax-randomly among the top few viable
        // candidates instead of always taking the argmax. Mistakes look like
        // impatience ("took the good shot, not the best one"), not dice.
        const _diffPick = _aiDiff();
        if (_diffPick.pickTopN > 1 && best && best.score > 0) {
            const pool = candidates.slice(0, _diffPick.pickTopN).filter(c => c.score > 0);
            if (pool.length > 1) {
                const t = Math.max(1, _diffPick.softmaxT);
                const w = pool.map(c => Math.exp((c.score - pool[0].score) / t));
                let r = Math.random() * w.reduce((a, b) => a + b, 0);
                for (let i = 0; i < pool.length; i++) {
                    r -= w[i];
                    if (r <= 0) { best = pool[i]; break; }
                }
            }
        }

        if (!best || best.score <= 0) {
            if (!_skipMove && g.canUnitMove(unit)) {
                const moveTiles = g.getMoveTiles(unit);
                if (moveTiles.length > 0) {
                    const recent = new Set(unit._aiRecentTiles || []);
                    const fresh = moveTiles.filter(t => !recent.has(g.posKey(t.x, t.y)));
                    const pool = fresh.length > 0 ? fresh : moveTiles;
                    const pick = pool[Math.floor(Math.random() * pool.length)];
                    best = { type: 'move', x: pick.x, y: pick.y, z: pick.z, score: 1 };
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
                        const pick = pool[Math.floor(Math.random() * pool.length)];
                        best = { type: 'inspect', x: pick.x, y: pick.y, score: 1 };
                    }
                }
            }
            if (!best || best.score <= 0) {
                if ((unit.ap || 0) >= 2) {
                    best = { type: 'guard', score: 1 };
                }
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

        if (best.type === 'attack' && best.target) {
            const estDmg = Math.max(24, Math.floor(_aiAtk(unit) * 0.65) + g.getEffectiveAttackBonus(unit));
            recordTeamDamage(best.target.id, estDmg);
        }
        if (best.type === 'spell' && best.target && ['damage', 'ricochet', 'multiHit', 'lifeDrain', 'line', 'linePush', 'cross', 'pull', 'displacement', 'splitBeam', 'aoePull', 'skyDrop', 'skyThrow', 'skySlam', 'leapStrike'].includes(best.spell?.kind)) {
            recordTeamDamage(best.target.id, best.spell.dmg || 112);
        }

        executeAction(unit, best, vision);
    };

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
            : g.aliveUnitsFor(player)
                .filter(a => a.id !== unit.id);

        const visibleHourglasses = (g.state.hourglasses || []).filter(h =>
            h.carriedBy === null && h.visibleTo[player]
        );

        let closestEnemy = null;
        let closestEnemyDist = Infinity;
        for (const e of visibleEnemies) {
            const d = g.combatDist ? g.combatDist(e.x, e.y, e.z ?? 0, unit.x, unit.y, unit.z ?? 0)
                : (Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y));
            if (d < closestEnemyDist) {
                closestEnemyDist = d;
                closestEnemy = e;
            }
        }

        const effRange = g.getEffectiveRange(unit);
        const attackTargets = visibleEnemies.filter(e => {
            const d = g.combatDist ? g.combatDist(e.x, e.y, e.z ?? 0, unit.x, unit.y, unit.z ?? 0)
                : (Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y));
            return d >= 1 && d <= effRange && !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y);
        });

        const enemyTower = g.state.towers
            ? g.state.towers[g.enemyOf(player)]
            : null;

        const ownTower = g.state.towers
            ? g.state.towers[player]
            : null;

        const tactical = assessTactical(unit, visibleEnemies, allies);
        const winState = assessWinCondition(unit, ownTower, enemyTower);

        const threatMap = buildThreatMap(visibleEnemies, unit);

        return {
            visTiles, visibleEnemies, allies,
            visibleHourglasses, closestEnemy, closestEnemyDist,
            attackTargets, enemyTower, ownTower, effRange, tactical,
            player, winState, threatMap
        };
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
            roundUrgency,
            phase,
            boardScore: evaluateBoardState(player)
        };
    }

    function evaluateBoardState(player) {
        const g = G();
        const isFFA = g._isFFA();
        const enemy = isFFA ? null : g.enemyOf(player);

        let score = 0;

        if (g.state.towers) {
            const own = g.state.towers[player];
            const enem = enemy ? g.state.towers[enemy] : null;
            const ownPct = own && own.maxHp > 0 ? own.hp / own.maxHp : 1;
            const enemPct = enem && enem.maxHp > 0 ? enem.hp / enem.maxHp : 1;

            score += (ownPct - enemPct) * 100;

            if (enemPct < 0.3) score += 40;
            else if (enemPct < 0.5) score += 20;

            if (ownPct < 0.3) score -= 35;
        }

        const myAlive = isFFA ? 1 : g.aliveUnitsFor(player).length;
        const enemyAlive = isFFA
            ? g.state.units.filter(u => !u.dead && u.player !== player).length
            : g.aliveUnitsFor(enemy).length;
        score += (myAlive - enemyAlive) * 18;

        const myUnits = isFFA ? [g.state.units.find(u => u.player === player && !u.dead)].filter(Boolean)
            : g.aliveUnitsFor(player);
        const enemUnits = isFFA
            ? g.state.units.filter(u => !u.dead && u.player !== player)
            : (enemy ? g.aliveUnitsFor(enemy) : []);
        const myTotalHpPct = myUnits.length > 0
            ? myUnits.reduce((s, u) => s + u.hp / u.maxHp, 0) / myUnits.length : 0;
        const enemTotalHpPct = enemUnits.length > 0
            ? enemUnits.reduce((s, u) => s + u.hp / u.maxHp, 0) / enemUnits.length : 0;
        score += (myTotalHpPct - enemTotalHpPct) * 30;

        const myHG = myUnits.reduce((s, u) => s + (u.hourglasses || 0), 0);
        const enemHG = enemUnits.reduce((s, u) => s + (u.hourglasses || 0), 0);
        const hgTarget = g.state.hourglassTarget || 5;
        score += (myHG - enemHG) * 12;

        if (myHG >= hgTarget - 1) score += 50;
        if (enemHG >= hgTarget - 1) score -= 50;

        if (g.state.nexusPoints) {
            const floors = Object.keys(g.state.nexusPoints);
            let myNex = 0, enemNex = 0;
            for (const f of floors) {
                const n = g.state.nexusPoints[f];
                if (!n) continue;
                if (n.owner === player) myNex++;
                else if (enemy && n.owner === enemy) enemNex++;
            }
            score += (myNex - enemNex) * 15;
        }

        const enemDead = isFFA ? 0
            : g.state.units.filter(u => u.player === enemy && u.dead).length;
        const myDead = g.state.units.filter(u => u.player === player && u.dead).length;
        score += (enemDead - myDead) * 10;

        return score;
    }

    function applySurvivalPenalties(unit, candidates, v) {
        const g = G();
        if (candidates.length === 0) return;

        const turnOrder = g.blitzTurnOrderIds || [];
        const myIdx = turnOrder.indexOf(unit.id);
        const unactedEnemyIds = new Set();
        if (myIdx >= 0) {
            for (let i = myIdx + 1; i < turnOrder.length; i++) {
                const u = g.state.units.find(u2 => u2.id === turnOrder[i]);
                if (u && !u.dead && g.isEnemyUnit(unit, u)) unactedEnemyIds.add(u.id);
            }
        }

        const allEnemies = v.visibleEnemies;

        const hgValue = (unit.hourglasses || 0) * 40;
        const isHealer = unit.cls === 'White Mage';
        const unitValue = 1.0 + (hgValue > 0 ? 0.6 : 0) + (isHealer ? 0.3 : 0);

        const topN = Math.min(candidates.length, 5);
        for (let i = 0; i < topN; i++) {
            const cand = candidates[i];

            let endX = unit.x, endY = unit.y;
            if (cand.type === 'move' && cand.x != null) { endX = cand.x; endY = cand.y; }

            if (cand.type === 'kite_retreat' && cand.x != null) { endX = cand.x; endY = cand.y; }

            let incomingDmg = 0;
            let threatCount = 0;
            for (const e of allEnemies) {
                const eRange = g.getEffectiveRange(e);
                const eMove = (g.getEffectiveMove?.(e) || e.move || 3);
                const dist = Math.abs(e.x - endX) + Math.abs(e.y - endY);

                const canReach = dist <= eMove + eRange;

                const isUnacted = unactedEnemyIds.has(e.id);
                if (canReach) {
                    const eDmg = Math.max(5, Math.floor(Math.max(_aiAtk(e), 5) * 0.65));

                    incomingDmg += isUnacted ? eDmg : Math.floor(eDmg * 0.6);
                    threatCount++;
                }
            }

            // Hazard ground: standing pat on (or stepping onto) a pending blast
            // tile / burning ground / deep water is punished hard enough that a
            // plain step to safety beats any attack cast from the danger tile.
            const hazardPen = aiHazardPenaltyAt(unit, endX, endY);
            if (hazardPen > 0) {
                cand.score -= hazardPen;
                cand._hazardPenalty = hazardPen;
            }

            const hpAfterAction = unit.hp;
            if (incomingDmg >= hpAfterAction && threatCount >= 1) {

                cand.score -= Math.floor(80 * unitValue);
                cand._survivalPenalty = 'lethal';
            } else if (incomingDmg >= hpAfterAction * 0.6 && threatCount >= 2) {

                cand.score -= Math.floor(35 * unitValue);
                cand._survivalPenalty = 'high_danger';
            } else if (incomingDmg >= hpAfterAction * 0.4 && threatCount >= 3) {

                cand.score -= Math.floor(15 * unitValue);
                cand._survivalPenalty = 'moderate_danger';
            }
        }
    }

    function buildThreatMap(visibleEnemies, unit) {
        const g = G();
        const threats = new Map();
        for (const e of visibleEnemies) {
            const eRange = g.getEffectiveRange(e);
            const eMove = e.move || 3;
            const eDmg = Math.max(3, Math.floor(Math.max(_aiAtk(e), 5) * 0.65));

            const reach = eMove + eRange;
            for (let dy = -reach; dy <= reach; dy++) {
                for (let dx = -reach; dx <= reach; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) > reach) continue;
                    const key = g.posKey(e.x + dx, e.y + dy);
                    const cur = threats.get(key) || { count: 0, totalDmg: 0 };
                    cur.count++;
                    cur.totalDmg += eDmg;
                    threats.set(key, cur);
                }
            }
        }
        return threats;
    }

    function getThreatAt(threatMap, x, y) {
        const g = G();
        return threatMap.get(g.posKey(x, y)) || { count: 0, totalDmg: 0 };
    }

    // ── Hazard awareness (2026-07-09 AI pass) ─────────────────────────────
    // The AI used to stand on telegraphed Crystal Ball marks, burning ground,
    // poison and deep water until it died there (4 of 9 deaths in the reference
    // match were avoidable ground damage). Returns a score penalty for ENDING
    // a turn at (x,y): pending delayed blasts count as near-lethal ground.
    function aiHazardPenaltyAt(unit, x, y) {
        const g = G();
        let pen = 0;
        const delayed = g.state._delayedSpells || [];
        for (const ds of delayed) {
            if (!ds || ds.markedUnitId || ds.x == null) continue;  // unit-tracking shots follow the unit, not the tile
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

    function getTypeMultiplier(attacker, defender, spellType) {
        const g = G();
        const chart = (typeof TYPE_CHART !== 'undefined') ? TYPE_CHART : g.TYPE_CHART;
        if (!chart) return 1.0;

        const dTypes = defender.types || [];
        let effectMult = 1.0;
        let stabMult = 1.0;

        if (spellType) {

            const entry = chart[spellType];
            if (entry) {
                for (const dt of dTypes) {
                    if (entry.strongVs && entry.strongVs.includes(dt)) effectMult = Math.max(effectMult, 1.5);
                    if (entry.weakVs && entry.weakVs.includes(dt)) effectMult = Math.min(effectMult, 0.75);
                }
            }

            const aTypes = attacker.types || [];
            if (aTypes.includes(spellType)) {
                stabMult = (typeof STAB_MULTIPLIER !== 'undefined') ? STAB_MULTIPLIER : 1.25;
            }
        } else {

            const aTypes = attacker.types || [];
            for (const at of aTypes) {
                const entry = chart[at];
                if (!entry) continue;
                for (const dt of dTypes) {
                    if (entry.strongVs && entry.strongVs.includes(dt)) effectMult = Math.max(effectMult, 1.5);
                    if (entry.weakVs && entry.weakVs.includes(dt)) effectMult = Math.min(effectMult, 0.75);
                }
            }
        }
        return effectMult * stabMult;
    }

    // ── Press Turn scoring (Phase 3) ────────────────────────────────────────
    // The engine refunds AP on an offensive action that hits a type weakness or
    // crits (a "press" → free action) and drains extra AP on a whiff. The AI
    // already benefits passively (finishComputerAction re-acts while AP > 0);
    // these terms make it actively prefer press-yielding shots and shy away
    // from high-evade targets. Press is detected off the type TIER (strong &&
    // !weak) — never the raw multiplier number — matching the engine.
    const _PRESS_SPELL_KINDS_AI = new Set([
        'damage', 'multiHit', 'ricochet', 'lifeDrain',
        'line', 'linePush', 'splitBeam',
        'aoe', 'barrage', 'cross', 'aoePull',
    ]);

    function _pressWeakness(attacker, defender, spellType) {
        const g = G();
        const chart = (typeof TYPE_CHART !== 'undefined') ? TYPE_CHART : g.TYPE_CHART;
        if (!chart || !defender) return false;
        const dTypes = defender.types || [];
        const aTypes = spellType ? [spellType] : (attacker.types || []);
        let hasStrong = false, hasWeak = false;
        for (const at of aTypes) {
            const entry = chart[at];
            if (!entry) continue;
            for (const dt of dTypes) {
                if (entry.strongVs && entry.strongVs.includes(dt)) hasStrong = true;
                if (entry.weakVs && entry.weakVs.includes(dt)) hasWeak = true;
            }
        }
        return hasStrong && !hasWeak;
    }

    // Returns { add, sub } score deltas for press value / whiff risk.
    //   opts.spellType : type used for the tier (null = attacker's own types)
    //   opts.canMiss   : action can be evaded (basic attacks) → whiff penalty
    //   opts.canCrit   : action can crit (basic attacks) → crit press chance
    function _pressScoreAdj(attacker, defender, opts = {}) {
        const g = G();
        if (!defender) return { add: 0, sub: 0 };
        // Easy difficulty doesn't hunt press-refund lines at all.
        const refundVal = _aiDiff().press ? g.getAIWeight('pressRefundValue_v1') : 0;
        const whiffPen = AI_TUNE.whiffRiskPenalty;
        const evadeP = (opts.canMiss && typeof g.getEvasionChance === 'function')
            ? (g.getEvasionChance(defender) || 0) : 0;
        const landP = 1 - evadeP;
        const critP = (opts.canCrit && typeof g.getCritChance === 'function')
            ? (g.getCritChance(attacker) || 0) : 0;
        const weak = _pressWeakness(attacker, defender, opts.spellType || null);
        // Probability this action presses: a weakness hit (if it lands) almost
        // always presses; otherwise a crit does.
        const pressP = Math.min(1, landP * (weak ? 1 : critP));
        return { add: pressP * refundVal, sub: evadeP * whiffPen };
    }

    function getTargetPriority(target, unit, v) {
        const g = G();
        let priority = 0;

        const cls = target.cls || '';
        if (cls === 'White Mage') priority += 25;
        else if (cls === 'Black Mage') priority += 20;
        else if (cls === 'Harbinger') priority += 18;
        else if (cls === 'Psychic') priority += 16;
        else if (cls === 'Engineer') priority += 14;
        else if (cls === 'Gunslinger') priority += 12;
        else if (cls === 'Sniper') priority += 15;
        else if (cls === 'Raider') priority += 12;
        else if (cls === 'Harvester') priority += 10;
        else if (cls === 'Agent') priority += 10;
        else if (cls === 'Warrior') priority += 10;
        else if (cls === 'Tank') priority += 5;
        else if (cls === 'Freelancer') priority += 8;

        if ((target.hourglasses || 0) > 0) priority += AI_TUNE.hourglassTargetBonus + (target.hourglasses * 10);

        // Focus fire: damage the TEAM already invested in a target this round is
        // worthless unless someone finishes the job — weight wounded-by-us
        // targets up hard so pokes convert into kills instead of smearing damage
        // across four different enemies.
        const dmgLog = getTeamDamageLog();
        const priorDmg = dmgLog[target.id] || 0;
        if (priorDmg > 0) {
            priority += 30;
            if (target.hp <= priorDmg + 20) priority += 45;
        }

        const hpPct = target.hp / target.maxHp;
        if (hpPct < 0.25) priority += 20;
        else if (hpPct < 0.5) priority += 10;

        const _mpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
        const _modeId = _mpMode ? _mpMode.id : 'arena';

        if (_modeId === 'tdm' || _modeId === 'ffa') {
            if (hpPct < 0.25) priority += 25;
            else if (hpPct < 0.5) priority += 12;
        }

        if (_modeId === 'ctf' && g.state.flags) {
            const ownFlag = g.state.flags[unit.player];
            if (ownFlag && ownFlag.carriedBy === target.id) {
                priority += 60;
            }
        }

        const typeMult = getTypeMultiplier(unit, target);
        if (typeMult > 1.0) priority += 15;
        else if (typeMult < 1.0) priority -= 10;

        if ((target._deathCount || 0) >= 2) priority += Math.min(target._deathCount, 5) * 3;

        if (g.unitHasStatus(target, 'marked')) priority += 10;

        if (g.unitHasStatus(target, 'stun')) priority -= 8;

        // 🗯 Provoke (2026-07-17): a taunted unit answers the challenge. The
        // engine hard-gates single-target actions onto the taunter; this bias
        // makes the AI's whole plan (movement, AoE centers, spell picks) bend
        // the same way instead of fighting the gate.
        if (typeof g.getTauntTargeter === 'function') {
            const _taunter = g.getTauntTargeter(unit);
            if (_taunter) {
                if (target.id === _taunter.id) priority += 200;
                else priority -= 150;
            }
        }

        const turnOrder = g.blitzTurnOrderIds || [];
        const myIdx = turnOrder.indexOf(unit.id);
        const targetIdx = turnOrder.indexOf(target.id);
        if (myIdx >= 0 && targetIdx > myIdx) {

            const turnsAway = targetIdx - myIdx;
            if (turnsAway <= 2) priority += 12;
            else if (turnsAway <= 4) priority += 6;

            if ((target.cls === 'White Mage' || target.cls === 'Harbinger') && turnsAway <= 3) {
                priority += 8;
            }
        }

        return priority;
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
        const shouldEngage = nearEnemies.length === 0 || advantage > g.getAIWeight('engageAdvantage_v1');

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

    function gatherCandidates(unit, v) {
        const candidates = [];
        const g = G();

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
        // Build (place/dig) superseded the Raise/Lower reshape verb — it
        // covers the same self-tile plays plus eruption shoves + pit escapes.
        scoreBuild(unit, v, candidates);

        scoreKiteRetreat(unit, v, candidates);

        return candidates;
    }

    function scoreItems(unit, v, out) {
        const g = G();
        const ap = unit.ap || 0;
        if (ap < g.AP_COST_ACTION) return;

        const healThresh = g.getAIWeight('healPotionHpPct_v1');
        const healGate = Math.max(healThresh + 0.15, 0.65);
        if (unit.items?.healPotion > 0) {
            const allies = g.aliveUnitsFor(unit.player);
            let bestTarget = null;
            let bestScore = -1;
            for (const ally of allies) {
                if (ally.dead || ally.hp >= ally.maxHp) continue;
                const hpPct = ally.hp / ally.maxHp;
                if (hpPct > healGate) continue;
                const urgency = 1.0 - hpPct;

                let score = 140 + urgency * 380;

                if (ally.id === unit.id && hpPct <= healThresh) score += 100;

                if (hpPct < 0.25) score += 140;

                if ((v.tactical?.nearEnemies || 0) > 0 && hpPct < 0.5) score += 60;
                if (score > bestScore) {
                    bestScore = score;
                    bestTarget = ally;
                }
            }
            if (bestTarget) {
                out.push({ type: 'item_targeted', item: 'healPotion', target: bestTarget, score: bestScore });
            }
        }

        if (unit.items?.manaPotion > 0) {
            const allies = g.aliveUnitsFor(unit.player);
            let bestTarget = null;
            let bestScore = -1;
            for (const ally of allies) {
                if (ally.dead || (ally.maxMp || 0) <= 0) continue;
                if (ally.mp >= ally.maxMp) continue;
                // Mana Potion restores 35% of maxMp (ITEM_RULES.manaPotion.mpPct).
                const mpRestore = Math.max(1, Math.floor((ally.maxMp || 0) * 0.35));
                const mpAfter = Math.min(ally.maxMp, ally.mp + mpRestore);

                const allSpells = (ally.spells || []);
                let bestSpellValue = 0;
                let unlockedCount = 0;
                for (const spell of allSpells) {
                    if (!spell || !spell.cost || spell.cost <= 0) continue;
                    if (spell.kind === 'scan') continue;
                    // Real cost, not raw spell.cost — folds in the earth-sign
                    // terraform discount and status deltas (Discord).
                    const _mc = (typeof getSpellMpCostFor === 'function') ? getSpellMpCostFor(ally, spell) : spell.cost;
                    const cantNow = ally.mp < _mc;
                    const canAfter = mpAfter >= _mc;
                    if (cantNow && canAfter) {

                        const val = spell.dmg || (spell.kind === 'heal' ? 96 : 80);
                        if (val > bestSpellValue) bestSpellValue = val;
                        unlockedCount++;
                    }
                }
                const mpPct = ally.mp / ally.maxMp;

                let score = AI_TUNE.mpPotionPriority + (1.0 - mpPct) * 160;

                if (bestSpellValue > 0) {
                    score += bestSpellValue * 1.2 + unlockedCount * 20;
                }

                const casterClasses = ['Black Mage', 'White Mage', 'Psychic', 'Harbinger', 'Harvester'];
                if (casterClasses.includes(ally.cls)) score += 40;

                if (ally.mp === 0 && casterClasses.includes(ally.cls)) score += 100;

                if (ally.id === unit.id && (v.tactical?.nearEnemies || 0) > 0 && mpPct < 0.3) score += 40;
                if (score > bestScore) {
                    bestScore = score;
                    bestTarget = ally;
                }
            }
            if (bestTarget) {
                out.push({ type: 'item_targeted', item: 'manaPotion', target: bestTarget, score: bestScore });
            }
        }

        if (unit.items?.scanner > 0 && g.getEffectiveAwr(unit) > 0) {
            const unrevHG = (g.state.hourglasses || []).filter(h =>
                h.carriedBy === null && !h.visibleTo[unit.player]
            ).length;
            if (unrevHG > 0) {
                let scanScore = g.getAIWeight('scannerPriority_v1') + unrevHG * 8;
                const round = g.state.round || 0;
                if (round <= 10) scanScore += 10;
                else if (round <= 20) scanScore += 5;
                out.push({ type: 'item', item: 'scanner', score: scanScore });
            }
        }

        if ((unit.items?.panacea || 0) > 0 && unit.status) {
            const STATUS_DEFS = g.STATUS_DEFS || {};
            let debuffCount = 0;
            let hasCrippling = false;
            for (const key of Object.keys(unit.status)) {
                const def = STATUS_DEFS[key];
                if (def && def.kind === 'debuff') {
                    debuffCount++;
                    if (['stun', 'sleep', 'stagger', 'blind', 'freeze', 'confuse', 'silence'].includes(key)) {
                        hasCrippling = true;
                    }
                }
            }
            if (debuffCount > 0) {

                let panaceaScore = 500 + debuffCount * 60;
                if (hasCrippling) panaceaScore += 200;
                out.push({ type: 'panacea', score: panaceaScore });
            }
        }

        if ((unit.items?.warpStone || 0) > 0) {
            const selfHpPct = unit.hp / unit.maxHp;
            const nearEnemyCount = v.tactical?.nearEnemies || 0;

            if (selfHpPct < 0.3 && nearEnemyCount > 0) {

                let bestWarpTile = null;
                let bestWarpScore = -1;
                for (let dx = -3; dx <= 3; dx++) {
                    for (let dy = -3; dy <= 3; dy++) {
                        if (Math.abs(dx) + Math.abs(dy) < 1 || Math.abs(dx) + Math.abs(dy) > 3) continue;
                        const wx = unit.x + dx;
                        const wy = unit.y + dy;
                        if (!g.isInside(wx, wy)) continue;
                        const terrain = g.state.boardTerrain;
                        const tileType = terrain?.[wy]?.[wx];
                        const rule = g.TERRAIN_RULES?.[tileType];
                        if (!rule || rule.passable === false) continue;
                        if (g.unitAt(wx, wy)) continue;

                        let minEnemyDist = 99;
                        for (const e of (v.visibleEnemies || [])) {
                            const d = Math.abs(wx - e.x) + Math.abs(wy - e.y);
                            if (d < minEnemyDist) minEnemyDist = d;
                        }

                        let tileScore = minEnemyDist * 15;
                        const allies = g.aliveUnitsFor(unit.player);
                        for (const a of allies) {
                            if (a.id === unit.id) continue;
                            const ad = Math.abs(wx - a.x) + Math.abs(wy - a.y);
                            if (ad <= 3) tileScore += 10;
                        }
                        if (tileScore > bestWarpScore) {
                            bestWarpScore = tileScore;
                            bestWarpTile = { x: wx, y: wy };
                        }
                    }
                }
                if (bestWarpTile) {
                    const warpScore = 350 + (1.0 - selfHpPct) * 200;
                    out.push({ type: 'warpStone', target: bestWarpTile, score: warpScore });
                }
            }

            const enemyPlayer = unit.player === 1 ? 2 : 1;
            const enemyTower = g.state.towers?.[enemyPlayer] || null;
            if (enemyTower && enemyTower.hp > 0) {
                const curDist = Math.abs(unit.x - enemyTower.x) + Math.abs(unit.y - enemyTower.y);
                if (curDist <= 6 && curDist > 2 && selfHpPct > 0.5) {

                    let bestTowerWarp = null;
                    let bestTowerDist = curDist;
                    for (let dx = -3; dx <= 3; dx++) {
                        for (let dy = -3; dy <= 3; dy++) {
                            if (Math.abs(dx) + Math.abs(dy) < 1 || Math.abs(dx) + Math.abs(dy) > 3) continue;
                            const wx = unit.x + dx;
                            const wy = unit.y + dy;
                            if (!g.isInside(wx, wy)) continue;
                            const terrain = g.state.boardTerrain;
                            const tileType = terrain?.[wy]?.[wx];
                            const rule = g.TERRAIN_RULES?.[tileType];
                            if (!rule || rule.passable === false) continue;
                            if (g.unitAt(wx, wy)) continue;
                            const newDist = Math.abs(wx - enemyTower.x) + Math.abs(wy - enemyTower.y);
                            if (newDist < bestTowerDist) {
                                bestTowerDist = newDist;
                                bestTowerWarp = { x: wx, y: wy };
                            }
                        }
                    }
                    if (bestTowerWarp && bestTowerDist < curDist - 1) {
                        out.push({ type: 'warpStone', target: bestTowerWarp, score: 180 });
                    }
                }
            }
        }

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
                    const baseDmg = baneRule.baseDmg + (isEffective ? baneRule.baneDmg : 0);
                    let score = isEffective ? (240 + baseDmg) : (64 + baseDmg * 0.5);

                    score += getTargetPriority(enemy, unit, v) * 0.3;
                    out.push({ type: 'item_targeted', item: baneKey, target: enemy, score });
                }
            }
        }
    }

    // Damage estimates must read ATK at its LEVEL-CAP equivalent, exactly like
    // the engine's damage formulas do (data.js levelPowerStat / battle.js
    // pwrAtk) — otherwise the AI under-rates every low-level unit's swing.
    function _aiAtk(u) {
        return (typeof levelPowerStat === 'function') ? levelPowerStat(u, 'atk') : ((u && u.atk) || 0);
    }

    // Level 100: this AI scores in BASE damage magnitude (spell.dmg, atk*0.65),
    // but unit HP is scaled ~24× by the level curve. For lethality checks that
    // compare a base-magnitude damage estimate to target.hp, bring the HP back
    // into base space with _aiKillHp() so "can I kill this?" stays correct.
    // (Damage read from the team damage log is already in scaled space — don't
    // de-scale those comparisons.)
    function _aiLevel(u) {
        return (typeof ewUnitLevel === 'function') ? ewUnitLevel(u) : ((u && u._lvlCache) || 1);
    }
    // The scale a flat damage estimate by `attacker` actually resolves at
    // against `target` — magnitude, combat pace and level gap all included
    // (data.js offenseScale). Mirroring the engine here is what keeps the AI's
    // "can I kill this?" honest now that levels swing damage both ways: a
    // level-20 unit really does hit a level-10 for ~2× what the card says.
    function _aiOffenseScale(attacker, target) {
        if (typeof offenseScale !== 'function') return 1;
        return offenseScale(_aiLevel(attacker), _aiLevel(target));
    }
    function _aiKillHp(target, attacker) {
        const s = _aiOffenseScale(attacker, target);
        return s > 0 ? (target.hp / s) : target.hp;
    }

    function scoreAttacks(unit, v, out) {
        const g = G();
        if ((unit.ap || 0) < g.AP_COST_ACTION || _skipAttack) return;

        const estDmg = Math.max(24, Math.floor(_aiAtk(unit) * 0.65) + g.getEffectiveAttackBonus(unit) + g.getHourglassPower(unit));

        for (const tgt of v.attackTargets) {
            let score = estDmg;

            const typeMult = getTypeMultiplier(unit, tgt);
            score *= typeMult;

            if (typeof g.getUnitStandingHeight === 'function') {
                const srcH = g.getUnitStandingHeight(unit);
                const tgtH = g.getUnitStandingHeight(tgt);
                if (srcH > tgtH) {

                    score *= 1 + 0.1 * (srcH - tgtH);
                } else if (tgtH > srcH) {

                    score -= 5 * (tgtH - srcH);
                }
            }

            // Facing: a back attack is +25% dmg, undodgeable and uncounterable;
            // a flank is +10%. Weigh the arc so the AI prefers rear strikes.
            if (typeof g.getAttackArc === 'function' && typeof g.getFacingDamageMult === 'function') {
                const arc = g.getAttackArc(unit, tgt);
                score *= g.getFacingDamageMult(arc);
                if (arc === 'back') score += 30; // no dodge / no counter is worth more than raw dmg
            }

            score += getTargetPriority(tgt, unit, v);

            if (_aiKillHp(tgt, unit) <= estDmg * typeMult + 32) score += g.getAIWeight('killBonusScore_v1') + 120;

            if (g.unitHasStatus(tgt, 'marked')) score += AI_TUNE.markedTargetBonus;

            if (unit.cls === 'White Mage') score *= 0.25;
            if (unit.cls === 'Harbinger') score *= 0.5;
            if (unit.atk <= 5 && unit.cls !== 'White Mage') score *= 0.6;

            // Casters poke as a last resort: when a Black Mage can still afford
            // a real damage spell, the basic attack shouldn't outbid it.
            if (JOB_TENDENCIES[unit.cls]?.preferSpells &&
                (unit.spells || []).some(sp => sp && DMG_KINDS_T.includes(sp.kind)
                    && g.canAffordSpell(unit, sp) && unit.mp >= ((typeof getSpellMpCostFor === 'function') ? getSpellMpCostFor(unit, sp) : sp.cost))) {
                score *= 0.6;
            }

            if (v.ownTower && v.ownTower.hp > 0) {
                const dToTower = Math.abs(tgt.x - v.ownTower.x) + Math.abs(tgt.y - v.ownTower.y);
                if (dToTower <= 4) score += 200;
                if (dToTower <= 2) score += 160;
            }

            if (v.winState.phase === 'tower_push') {
                const tDist = v.enemyTower ? Math.abs(tgt.x - v.enemyTower.x) + Math.abs(tgt.y - v.enemyTower.y) : Infinity;
                if (tDist > 3) score *= 0.5;
            }

            if (v.winState.phase === 'numbers_advantage' && v.enemyTower) {
                const tDist = Math.abs(tgt.x - v.enemyTower.x) + Math.abs(tgt.y - v.enemyTower.y);
                if (tDist > 5) score *= 0.7;
            }

            if (v.winState.enemyDeadCount >= 2 && v.enemyTower && v.enemyTower.hp > 0) {
                const tDist = Math.abs(tgt.x - v.enemyTower.x) + Math.abs(tgt.y - v.enemyTower.y);
                if (tDist > 4) score *= 0.4;
            }

            const nearOwnTower = v.ownTower && v.ownTower.hp > 0 &&
                Math.abs(tgt.x - v.ownTower.x) + Math.abs(tgt.y - v.ownTower.y) <= 4;
            if (nearOwnTower) {
                score *= 1.2;
            } else {
                score *= v.tactical.shouldEngage ? 1.0 + Math.max(0, v.tactical.advantage) * 0.5 : 0.6;
            }

            // Level weights only fire in progression modes (MD/Challenge/
            // campaign) — PvP units are all at LEVEL_CAP, where "per-level
            // aggression" would just be a constant multiplier the trainer
            // can't see. (This block used to read unit.level / g.xpForLevel,
            // neither of which exists — it was dead code since day one.)
            if (typeof g.xpProgressionActive === 'function' && g.xpProgressionActive()
                && typeof g.getUnitLevel === 'function') {
                const unitLevel = g.getUnitLevel(unit);
                score *= 1.0 + (unitLevel - 1) * AI_TUNE.levelAggressionMod;
                if (unitLevel < (g.XP_MAX_LEVEL || 100) && typeof g.getXPProgressPct === 'function'
                    && g.getXPProgressPct(unit) >= 70) {
                    score += AI_TUNE.nearLevelUpBonus;
                }
            }

            const _pa = _pressScoreAdj(unit, tgt, { canMiss: true, canCrit: true });
            score += _pa.add - _pa.sub;

            out.push({ type: 'attack', target: tgt, score });
        }

        // Enemy deployed objects (heal beacons, pylons, turret-like deploys) die
        // to ONE basic attack yet pay value every round they stand — the AI once
        // let a pair of 35 HP/round heal beacons run a whole match untouched.
        // Offer them as attack candidates whenever they're in reach.
        const _dObjs = g.state._deployedObjects || [];
        if (_dObjs.length) {
            const _oRange = g.getEffectiveRange(unit);
            for (const o of _dObjs) {
                if (!o || o.hp <= 0 || o._detonated || o.ownerPlayer === unit.player) continue;
                const d = Math.abs(unit.x - o.x) + Math.abs(unit.y - o.y);
                if (d < 1 || d > _oRange) continue;
                if (g.isRangeBlockedByTerrain && g.isRangeBlockedByTerrain(unit.x, unit.y, o.x, o.y)) continue;
                if (g.unitAt && g.unitAt(o.x, o.y)) continue;   // a unit there takes the hit instead
                let s = 55 + (o.auraHeal ? 45 : 0) + (o.turretDmg ? 40 : 0);
                if (o.detonateOnAttack && o.blastRadius > 0 && d <= (o.blastRadius || 1)) s = 0; // don't blow it up in our own face
                if (unit.cls === 'White Mage') s *= 0.25;
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

        const estDmg = Math.max(24, Math.floor(_aiAtk(unit) * 0.65) + g.getEffectiveAttackBonus(unit) + g.getHourglassPower(unit));

        let score = estDmg + g.getAIWeight('towerBaseBonus_v1');

        if (tower.hp <= estDmg * 3) score += AI_TUNE.towerLowHpPush;
        else if (tower.hp <= tower.maxHp * 0.5) score += AI_TUNE.towerMidHpPush;

        const groundEnemies = v.visibleEnemies.filter(e =>
            Math.abs(e.x - tower.x) + Math.abs(e.y - tower.y) <= 6
        );
        if (groundEnemies.length === 0) score += AI_TUNE.towerClearBonus;
        else if (groundEnemies.length === 1) score += 160;

        const ws = v.winState;
        if (ws.enemyDeadCount >= 2) score += 360;
        else if (ws.enemyDeadCount >= 1) score += 200;

        if (ws.enemyMinRespawn >= 6) score += 360;
        else if (ws.enemyMinRespawn >= 4) score += 240;
        else if (ws.enemyMinRespawn >= 3) score += 160;
        else if (ws.enemyMinRespawn >= 2) score += 80;

        if (ws.enemyImminentRespawns > 0) score -= 40 * ws.enemyImminentRespawns;

        if (ws.phase === 'tower_push') score += 400;
        if (ws.phase === 'numbers_advantage') score += 240;

        score += ws.roundUrgency * 120;

        if (unit.cls === 'White Mage') score *= 0.4;
        if (unit.cls === 'Harbinger') score *= 0.6;

        score = Math.max(score, 240);
        out.push({ type: 'attack_tower', towerX: tower.x, towerY: tower.y, score });
    }

    function scoreSpells(unit, v, out) {
        const g = G();
        const ap = unit.ap || 0;
        const silenced = g.unitHasStatus(unit, 'silence');
        if (silenced) return;

        const estDmg = Math.max(24, Math.floor(_aiAtk(unit) * 0.65) + g.getEffectiveAttackBonus(unit));

        // Healer discipline: while an ally is genuinely hurt AND this unit can
        // afford a heal, a healFirst job discounts its damage options so the
        // heal wins the sort (White Mage stops sniping while the tank bleeds).
        const _tend = JOB_TENDENCIES[unit.cls];
        let _healDuty = false;
        if (_tend && _tend.healFirst) {
            const _canHeal = (unit.spells || []).some(sp => sp && ['heal', 'healAll'].includes(sp.kind)
                && g.canAffordSpell(unit, sp) && unit.mp >= ((typeof getSpellMpCostFor === 'function') ? getSpellMpCostFor(unit, sp) : sp.cost) && ap >= g.getSpellApCost(sp));
            _healDuty = _canHeal && [unit, ...v.allies].some(a => !a.dead && a.hp < a.maxHp * 0.6);
        }

        const _allSpells = (unit.spells || []);
        for (const spell of _allSpells) {
            if (!spell) continue;
            if (_failedSpells.has(spell.name)) continue;
            const apCost = g.getSpellApCost(spell);
            if (ap < apCost || !g.canAffordSpell(unit, spell) || unit.mp < ((typeof getSpellMpCostFor === 'function') ? getSpellMpCostFor(unit, spell) : spell.cost)) continue;

            const target = findSpellTarget(unit, spell, v);
            const noTargetKinds = ['healAll', 'manaRestoreAll', 'barrage', 'warCry', 'encore', 'deployTurret', 'utility',
                'escape', 'selfHeal', 'tuneFrequency', 'pulseLattice'];
            if (!target && !noTargetKinds.includes(spell.kind)) continue;

            let score = scoreSpell(unit, spell, target, v);
            if (score <= 0) continue;

            if (_tend) {
                if (SUPPORT_KINDS_T.includes(spell.kind) && _tend.support) score *= _tend.support;
                else if (CONTROL_KINDS_T.includes(spell.kind) && _tend.control) score *= _tend.control;
                else if (DMG_KINDS_T.includes(spell.kind)) {
                    if (_tend.spellDmg) score *= _tend.spellDmg;
                    if (_healDuty) score *= 0.45;
                }
            }

            if (apCost === 2 && ['damage', 'ricochet', 'multiHit', 'aoe', 'barrage', 'line', 'linePush', 'cross', 'aoePull', 'splitBeam', 'dash'].includes(spell.kind)) {
                const twoBasicVal = v.attackTargets.length > 0 ? estDmg * 1.85 : estDmg * 0.5;

                if (score < twoBasicVal * 0.65) score *= 0.4;
            }

            if (['damage', 'ricochet', 'multiHit', 'aoe', 'barrage', 'lifeDrain', 'line', 'linePush', 'cross', 'aoePull', 'splitBeam', 'displacement', 'pull', 'dash', 'skyDrop', 'skyThrow', 'skySlam', 'leapStrike'].includes(spell.kind)) {
                score *= v.tactical.shouldEngage ? 1.0 + Math.max(0, v.tactical.advantage) * 0.5 : 0.6;

                if (['Gunslinger', 'Sniper', 'Black Mage', 'Psychic'].includes(unit.cls)) {
                    score *= 1.25;
                }
            }

            // Press value: a damaging spell that hits a type weakness refunds AP
            // (free action). Spells don't roll evade/crit in the press path, so
            // no whiff penalty here.
            if (target && _PRESS_SPELL_KINDS_AI.has(spell.kind)) {
                score += _pressScoreAdj(unit, target, { spellType: spell.spellType || null }).add;
            }

            // MP-dump escalation: a caster hoarding a fat mana pool late in the
            // match is wasted value (a Psychic once finished 399/399 MP after 13
            // rounds). Scale spell candidates up as unspent MP grows, harder as
            // the round cap approaches.
            const _mpPct = unit.maxMp ? unit.mp / unit.maxMp : 0;
            if (_mpPct > 0.6 && score > 0) {
                const _mode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
                const _rLim = (_mode && _mode.roundLimit) || g.state.roundLimit || 0;
                const _late = _rLim > 0 && (g.state.round || 0) >= _rLim - 4;
                score *= 1 + (_mpPct - 0.6) * (_late ? 0.9 : 0.45);
            }

            out.push({ type: 'spell', spell, target, score, apCost });
        }

    }

    function scoreSpell(unit, spell, target, v) {
        const g = G();
        const kind = spell.kind;

        // 🔥 Element-drinking passives (Thermal Regen): fire "damage" on a
        // fire-drinking target HEALS it — worse than a wasted turn. Hard veto
        // for any single-target damage kind aimed at such a unit (AOEs still
        // score off the crowd; the drinker just isn't a payoff).
        if (target && target.race && typeof window !== 'undefined'
            && typeof window.unitPassiveValue === 'function'
            && typeof window.classifySpellElement === 'function'
            && ['damage', 'ricochet', 'multiHit', 'dash'].includes(kind)) {
            const _drink = window.unitPassiveValue(target, 'healedByElement');
            if (_drink && window.classifySpellElement(spell) === _drink) return -999;
        }

        if (['damage', 'ricochet', 'multiHit'].includes(kind)) {
            // Elemental tile cast: the target is a TILE, not a unit — score it
            // flat (the fallback picker only returns tiles the reaction makes
            // worthwhile) and skip the unit-based math below.
            if (target && target._elemTile) {
                let s = (spell.dmg || 112) * 0.8;
                if (unit.cls === 'Black Mage') s *= 1.5;
                return s;
            }
            let s = spell.dmg || 112;
            if (spell.hitDamages) s = spell.hitDamages.reduce((a, b) => a + b, 0);
            for (const eff of (spell.statusEffects || [])) {

                if (target) s += scoreStatusEffect(eff, target, v);
                else s += eff.id === 'burn' ? 64 : 32;
            }

            if (target) {

                s *= getTypeMultiplier(unit, target, spell.spellType || null);

                s += getTargetPriority(target, unit, v) * 0.5;

                if (_aiKillHp(target, unit) <= s + 24) s += g.getAIWeight('killBonusScore_v1') + 120;
            }

            if (unit.cls === 'Black Mage') s *= 1.5;
            else if (unit.cls === 'Warrior') s *= 1.5;
            return s;
        }
        if (kind === 'aoe') {
            const cx = spell.aoeOriginSelf ? unit.x : target.x;
            const cy = spell.aoeOriginSelf ? unit.y : target.y;
            const area = getSpellAoeAreaAI(spell, cx, cy);
            const hits = Math.max(1, area.filter(t => v.visibleEnemies.some(e => e.x === t.x && e.y === t.y)).length);

            const allyHits = spell.aoeOriginSelf
                ? area.filter(t => v.allies.some(a => a.x === t.x && a.y === t.y)).length
                : area.filter(t => v.allies.some(a => a.x === t.x && a.y === t.y) || (unit.x === t.x && unit.y === t.y)).length;
            let s = (spell.dmg || 112) * hits - allyHits * 20;
            for (const eff of (spell.statusEffects || [])) s += (eff.id === 'burn' ? 56 : eff.id === 'silence' ? 80 : eff.id === 'jammed' ? 48 : 32) * hits;
            if (unit.cls === 'Black Mage') s *= 1.5;

            if (hits >= 3) s *= 1.3;

            if (spell.aoeOriginSelf && hits >= 2) s *= 1.2;
            return s;
        }

        if (kind === 'dash') {
            if (!target) return 0;
            const path = g.getLinePoints(unit.x, unit.y, target.x, target.y);
            // Mirror the engine: path enemies take dashDamage, the primary target
            // (landing tile) takes the full `dmg`.
            const dashPathDmg = spell.dashDamage || spell.dmg || 96;
            const dashPrimaryDmg = (spell.dashDamage != null) ? (spell.dmg || dashPathDmg) : dashPathDmg;
            let s = 0, hits = 0;
            for (const pt of path) {
                const victim = v.visibleEnemies.find(e => e.x === pt.x && e.y === pt.y);
                if (victim) {
                    hits++;
                    const dashDmg = (pt.x === target.x && pt.y === target.y) ? dashPrimaryDmg : dashPathDmg;
                    let hitVal = dashDmg;
                    hitVal *= getTypeMultiplier(unit, victim, spell.spellType || null);
                    hitVal += getTargetPriority(victim, unit, v) * 0.3;
                    if (_aiKillHp(victim, unit) <= dashDmg + 24) hitVal += g.getAIWeight('killBonusScore_v1') + 120;
                    for (const eff of (spell.statusEffects || [])) hitVal += scoreStatusEffect(eff, victim, v);
                    s += hitVal;
                }
            }

            if (hits >= 2) s *= 1.3;
            if (hits >= 3) s *= 1.2;

            if (v.enemyTower && v.enemyTower.hp > 0) {
                const curDist = Math.abs(unit.x - v.enemyTower.x) + Math.abs(unit.y - v.enemyTower.y);
                const newDist = Math.abs(target.x - v.enemyTower.x) + Math.abs(target.y - v.enemyTower.y);
                if (newDist < curDist) s += (curDist - newDist) * 15;
            }
            return s;
        }

        if (kind === 'deployTurret') {
            if (!target) return 0;
            const tRange = spell.turretRange || 2;
            const tDmg = spell.turretDmg || 8;

            if (spell.auraDebuff) {
                const enemiesInRange = v.visibleEnemies.filter(e =>
                    Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= tRange
                ).length;
                let s = enemiesInRange * 80 + 40;

                if (enemiesInRange >= 3) s *= 1.5;
                if (unit.cls === 'Engineer') s *= 1.3;
                return s;
            }

            let s = tDmg * 3;

            const enemiesInRange = v.visibleEnemies.filter(e =>
                Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= tRange
            ).length;
            s += enemiesInRange * 96;

            if (v.enemyTower && v.enemyTower.hp > 0) {
                const tDist = Math.abs(v.enemyTower.x - target.x) + Math.abs(v.enemyTower.y - target.y);
                if (tDist <= tRange) s += 280;
            }

            if (spell.id === 'siegeTurret') s *= 1.5;

            if (unit.cls === 'Engineer') s *= 1.3;
            return s;
        }

        if (kind === 'utility') {
            const sid = spell.id;

            if ((sid === 'grapple' || sid === 'raceGrapple') && target) {
                let s = 144;

                const meleeAllies = v.allies.filter(a =>
                    g.getEffectiveRange(a) <= 1 &&
                    Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= 4
                ).length;
                s += meleeAllies * 64;

                s += getTargetPriority(target, unit, v) * 0.3;

                if (g.getEffectiveRange(target) >= 3) s += 10;
                return s;
            }

            if ((sid === 'plunder' || sid === 'racePlunder') && target) {
                let s = 15;

                if ((target.hourglasses || 0) > 0) s += 40;

                if ((target.gold || 0) > 0) s += 8;
                return s;
            }

            if (sid === 'mimic' && target) {
                const lastSpell = g.state?.lastSpellCast;
                if (!lastSpell) return 0;

                let s = 20;

                const lastKind = SPELL_BY_ID?.[lastSpell.spellId]?.kind;
                if (['damage', 'aoe', 'multiHit', 'barrage'].includes(lastKind)) s += 10;
                if (['healAll', 'heal'].includes(lastKind)) s += 8;
                return s;
            }
            return 0;
        }
        if (kind === 'barrage') {
            const targets = v.visibleEnemies.filter(e => {
                const d = g.combatDist ? g.combatDist(e.x, e.y, e.z ?? 0, unit.x, unit.y, unit.z ?? 0) : (Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y));
                return d >= 1 && d <= _effRange(unit, spell) && !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y);
            });
            let s = (spell.dmg || 10) * targets.length;
            if (targets.length < 2) s *= 0.3;
            if (unit.cls === 'Gunslinger') s *= 1.6;
            return s;
        }
        if (kind === 'lifeDrain') {
            let s = (spell.dmg || 18) * 1.3;
            if (unit.hp < unit.maxHp * g.getAIWeight('healAllyThreshold_v1')) s += 15;
            if (target) {
                s *= getTypeMultiplier(unit, target, spell.spellType || null);
                if (_aiKillHp(target, unit) <= (spell.dmg || 18) + 3) s += 30;
            }
            return s;
        }

        if (kind === 'heal' && target) {
            const hpDef = target.maxHp - target.hp;
            const healAmt = Math.min(spell.healAmt != null ? spell.healAmt : (spell.heal || 24), hpDef);
            const pct = target.hp / target.maxHp;
            const urgency = pct < 0.25 ? 3.0 : pct < 0.35 ? 2.5 : pct < 0.55 ? 1.8 : pct < 0.75 ? 1.0 : 0.3;
            let s = healAmt * urgency;
            if (unit.cls === 'White Mage') { s *= 2.0; if (pct < 0.5) s += 30; }

            if ((target.hourglasses || 0) > 0 && pct < 0.6) s += 25;
            if (hpDef < 8) s = 0;
            return s;
        }
        if (kind === 'healAll') {
            const allies = g.aliveUnitsFor(unit.player);
            const hurt = allies.filter(a => a.hp < a.maxHp * 0.75);
            const hBase = spell.healAmt != null ? spell.healAmt : (spell.heal || 16);
            const total = allies.reduce((s, a) => s + Math.min(hBase, a.maxHp - a.hp), 0);
            // A near-full team makes the heal component worthless — zero it so
            // the AI never casts a team heal to restore a couple of scratch HP
            // (the buff component below still scores buff-carrying casts).
            const teamMax = allies.reduce((s, a) => s + a.maxHp, 0);
            const meaningfulHeal = total >= Math.max(20, teamMax * 0.05);
            let s = meaningfulHeal ? total * (hurt.length >= 2 ? 1.5 : 0.5) : 0;
            if (unit.cls === 'White Mage') s *= 2.0;
            // Team-wide stat buffs (Iron Dome, Veil of Light): worth casting once
            // enemies are in sight, but don't re-stack while a buff is live.
            if (spell.statStageBoost && v.visibleEnemies.length > 0 && !g.unitHasStatus(unit, 'statUp')) {
                const stages = Object.values(spell.statStageBoost).reduce((n, st) => n + Math.abs(st || 0), 0);
                s += allies.length * stages * 14;
            }
            return s;
        }

        if (kind === 'manaRestoreAll') {
            const allies = g.aliveUnitsFor(unit.player);
            const mpRestore = spell.mpRestore || 40;
            const lowMana = allies.filter(a => a.mp < a.maxMp * 0.4);
            const totalRestored = allies.reduce((s, a) => s + Math.min(mpRestore, a.maxMp - a.mp), 0);
            let s = totalRestored * 0.6;

            if (lowMana.length >= 2) s *= 1.8;
            if (lowMana.length >= 3) s *= 1.3;

            if (lowMana.length === 0) s *= 0.1;
            if (unit.cls === 'Engineer') s *= 1.3;
            return s;
        }

        if (kind === 'revive') return target ? 60 : 0;

        // Raise the Dead: any corpse in range is a free round-after-round
        // damage engine — grab it. Slightly better when enemies are nearby
        // for the zombie to chew on.
        if (kind === 'raiseDead') {
            if (!target) return 0;
            const nearEnemy = v.visibleEnemies.some(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 4);
            return nearEnemy ? 55 : 35;
        }

        // Knights of Round: worth it when the King is safe-ish and the army is
        // scattered — pulling everyone in re-forms the battle line.
        if (kind === 'rallyPull') {
            const far = g.aliveUnitsFor(unit.player).filter(a =>
                a.id !== unit.id && Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) > 3);
            if (far.length < 2) return 0;
            const enemiesOnTop = v.visibleEnemies.filter(e => Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y) <= 2).length;
            return 10 + far.length * 8 - enemiesOnTop * 6;
        }

        if (['seedHeal', 'seedPoison', 'leechSeed'].includes(kind)) {
            // Seeds are an investment: they grow into aura trees after 1-2
            // rounds, and every grown tree also feeds the Harvester's Green
            // Thumb buff + Trunk Throw scaling — so planting early pays twice.
            let s = kind === 'leechSeed' ? 16 : kind === 'seedPoison' ? 13 : 14;
            if ((g.state.round || 1) <= 3) s += 6;
            if (unit.cls === 'Harvester') s += 4;
            return s;
        }

        if (kind === 'buff' && target) {
            if (g.unitHasStatus(target, 'protect')) return 0;
            const threatened = v.visibleEnemies.some(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 4);
            if (!threatened) return 0;
            let s = 28;
            if (target.hp < target.maxHp * 0.5) s += 15;

            if ((target.hourglasses || 0) > 0) s += 20;
            if (unit.cls === 'White Mage') s *= 1.6;
            return s;
        }
        if (kind === 'debuff' && target) {
            if (g.unitHasStatus(target, 'marked')) return 0;
            let s = 10;
            // Value the actual status payload (stun/silence/root/…) — this
            // scorer previously ignored statusEffects entirely, so control
            // spells like Discordance and Stasis Beam were almost never cast.
            for (const eff of (spell.statusEffects || [])) {
                if (eff && eff.id && !g.unitHasStatus(target, eff.id)) s += scoreStatusEffect(eff, target, v);
            }
            if (spell.statStageBoost) {
                const stages = Object.values(spell.statStageBoost).reduce((n, st) => n + Math.abs(st || 0), 0);
                s += stages * 10;
            }
            const nearAllies = v.allies.filter(a => Math.abs(a.x - target.x) + Math.abs(a.y - target.y) <= 3).length;
            s += nearAllies * 5;
            // Damage-carrying debuffs (Star Crossed, Glare…) are worth their
            // hit on top of the status value.
            s += (spell.dmg || 0) * 0.5;
            s += getTargetPriority(target, unit, v) * 0.3;
            return s;
        }
        if (kind === 'shield' && target) {
            const cur = target.shield || 0;
            const max = Math.floor((target.maxHp || 100) * (spell.shieldCapPct || 0.25));
            const gain = Math.max(0, Math.min(spell.shield || 12, max - cur));
            if (cur >= 6) return gain * 0.15;
            const near = v.visibleEnemies.some(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 4);
            return near ? gain * 0.55 : 0;
        }

        if (kind === 'bomb' && target) {
            const blastR = spell.blastRadius || 1;
            const nearE = v.visibleEnemies.filter(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= blastR).length;
            let s = (spell.dmg || 18) * 0.7 + nearE * 8;
            const active = (g.state.bombs || []).filter(b => b.ownerUnitId === unit.id).length;
            if (active >= (spell.maxActivePerCaster || 3)) return 0;
            return s;
        }

        // ── Machine Elves prism lattice ──
        if (kind === 'placeMirror' && target) {
            const owned = (g.state.mirrors || []).filter(m => m.ownerUnitId === unit.id && m.hp > 0);
            if (owned.length >= (spell.maxActivePerCaster || 8)) return 0;
            let s = 9;
            const aligns = owned.some(m => m.x === target.x || m.y === target.y);
            if (aligns) s += 14;                                   // forms/extends a beam
            const nearE = v.visibleEnemies.filter(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 3).length;
            s += nearE * 6;
            if (aligns && nearE > 0) s += 10;
            if (owned.length < 3) s += 6;                          // ramp toward a pulsable lattice
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
            let s = 20 + caught * 22;
            if (net.isPrism) s += 60; else if (net.is3DVolume) s += 25;
            return s;
        }
        if (kind === 'tuneFrequency') {
            const owned = (g.state.mirrors || []).filter(m => m.owner === unit.player && m.hp > 0);
            if (owned.length < 2) return 0;
            return 4;                                              // low-priority flavour toggle
        }

        if (kind === 'scan') {
            if (g.getEffectiveAwr(unit) <= 0) return 0;
            const unrev = (g.state.hourglasses || []).filter(h => h.carriedBy === null && !h.visibleTo[unit.player]).length;
            if (unrev === 0) return 0;

            let s = 14 + unrev * 7;
            if (v.winState.phase === 'hg_losing') s += 15;
            const round = g.state.round || 0;
            if (round <= 12) s += 8;
            return s;
        }

        if (kind === 'summonWeather') {
            const nearE = v.visibleEnemies.filter(e => Math.abs(e.x - (target?.x ?? unit.x)) + Math.abs(e.y - (target?.y ?? unit.y)) <= 2).length;
            if (nearE === 0) return 0;
            let s = 10 + nearE * 8;
            if (unit.cls === 'Black Mage') s *= 1.5;
            return s;
        }

        if (kind === 'warpRune' && target) {
            const nearE = v.visibleEnemies.filter(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 2).length;
            return nearE > 0 ? 10 + nearE * 6 : 0;
        }

        // ── Terraforming kinds (2026-07-07): traps / blocks / structures ──
        if (kind === 'placeTrap' && target) {
            const active = (g.state.traps || []).filter(t => t.casterUnitId === unit.id && t.trapType === spell.trapType).length;
            if (active >= (spell.maxActivePerCaster || 2)) return 0;
            const nearE = v.visibleEnemies.filter(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 2).length;
            return nearE > 0 ? 12 + nearE * 7 + (spell.dmg || 0) * 0.08 : 0;
        }

        if (kind === 'placeBlock' && target) {
            if (spell.materialCost && typeof g.canAffordMaterials === 'function' &&
                !g.canAffordMaterials(unit.player, spell.materialCost)) return 0;
            const info = {};
            if (typeof g._placeBlockProblem === 'function' &&
                g._placeBlockProblem(unit, spell, target.x, target.y, info)) return 0;
            let s = 0;
            // Use #1: raise a pillar under an allied backliner (instant high ground).
            const allyOn = [unit, ...(v.allies || [])].find(a => !a.dead && a.x === target.x && a.y === target.y);
            if (allyOn && ['Sniper', 'Gunslinger', 'Black Mage'].includes(allyOn.cls)) s += 22;
            // Use #2: erupt under an enemy — crash damage + a 1-tile shove. Best
            // when the shove landing is a hazard or one of our own traps.
            const enemyOn = v.visibleEnemies.find(e => e.x === target.x && e.y === target.y);
            if (enemyOn) {
                s += 16 + getTargetPriority(enemyOn, unit, v) * 0.2;
                if (info.shoveTo) {
                    const lt = g.getTerrainAt(info.shoveTo.x, info.shoveTo.y);
                    if (lt === 'lava' || lt === 'deep_water' || lt === 'chasm' || lt === 'void') s += 30;
                    else if (lt === 'water' || lt === 'poison' || lt === 'poison_bog' || lt === 'purple_bog' || lt === 'swamp' || lt === 'oil') s += 12;
                    if ((g.state.traps || []).some(tr => tr.x === info.shoveTo.x && tr.y === info.shoveTo.y && tr.owner === unit.player)) s += 25;
                }
            }
            const nearE = v.visibleEnemies.filter(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 2).length;
            s += nearE * 4;
            return s;
        }

        if (kind === 'buildStructure' && target) {
            if (spell.materialCost && typeof g.canAffordMaterials === 'function' &&
                !g.canAffordMaterials(unit.player, spell.materialCost)) return 0;
            const nearE = v.visibleEnemies.filter(e => Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 3).length;
            let s = 8 + nearE * 5;
            return s;
        }

        if (kind === 'warCry') {
            const radius = spell.auraRadius || 3;
            const inRange = g.aliveUnitsFor(unit.player).filter(a => Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= radius);
            // Fermata (teamStatusEffects → statLock): worth casting when there
            // are live buff stages to lock in — the lock preserves them and
            // blanks enemy stat debuffs for a round.
            if (spell.teamStatusEffects) {
                const lockable = inRange.filter(a => !g.unitHasStatus(a, 'statLock'));
                const buffed = lockable.filter(a => a.statStages
                    && ['atk', 'def', 'mdef', 'spd', 'int'].some(k => (a.statStages[k] || 0) > 0));
                return buffed.length >= 2 ? 20 + buffed.length * 14 : (buffed.length === 1 ? 10 : 0);
            }
            // War Cry grants ATK stages now (stackable to +5) — value allies
            // who still have stage headroom instead of a defunct status check.
            const unboosted = inRange.filter(a => !(a.statStages && (a.statStages.atk || 0) >= 5));
            return unboosted.length >= 2 ? 15 + unboosted.length * 6 : 0;
        }

        if (kind === 'encore' && target) {

            let s = 25 + (target.atk || 0);

            if (['Black Mage', 'Gunslinger', 'Warrior', 'Sniper'].includes(target.cls)) s += 15;
            return s;
        }

        if (kind === 'teleport') {
            return scoreTeleport(unit, spell, target, v);
        }

        if (kind === 'line' || kind === 'linePush') {
            if (!target) return 0;
            const dmg = spell.dmg || 112;

            // Beams fire in the sign(target-caster) direction and stop at
            // impassable terrain (battle.js _applyLineDamage). A target that
            // isn't exactly on a row/column/45° ray can NEVER be hit — score
            // only the enemies the beam actually reaches, and score 0 on a
            // guaranteed whiff instead of pretending it's a full hit.
            const adx = Math.abs(target.x - unit.x), ady = Math.abs(target.y - unit.y);
            const aligned = (adx === 0 || ady === 0 || adx === ady) && (adx + ady > 0);
            if (!aligned) return 0;
            const dx = Math.sign(target.x - unit.x);
            const dy = Math.sign(target.y - unit.y);
            const _lineBoardLen = spell.range || 4;   // beams are range-capped (matches _applyLineDamage)
            let hits = 0, reachedTarget = false;
            for (let i = 1; i <= _lineBoardLen; i++) {
                const tx = unit.x + dx * i, ty = unit.y + dy * i;
                if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) break;
                if (typeof g.isTerrainPassable === 'function' && !g.isTerrainPassable(tx, ty) && !spell.destroysObstacles) break;
                if (v.visibleEnemies.some(e => e.x === tx && e.y === ty)) hits++;
                if (tx === target.x && ty === target.y) reachedTarget = true;
            }
            if (hits === 0) return 0;
            if (!reachedTarget) return dmg * hits * 0.5;
            let s = dmg * hits;

            for (const eff of (spell.statusEffects || [])) s += scoreStatusEffect(eff, target, v);

            if (kind === 'linePush') s += (spell.pushDistance || 1) * 16 * hits;

            if (spell.leaveTerrain) s += 24;

            s *= getTypeMultiplier(unit, target, spell.spellType || null);

            if (_aiKillHp(target, unit) <= dmg + 24) s += g.getAIWeight('killBonusScore_v1') + 80;

            if (hits >= 2) s *= 1.25;
            return s;
        }

        if (kind === 'cross') {
            const cx = spell.aoeOriginSelf ? unit.x : (target ? target.x : unit.x);
            const cy = spell.aoeOriginSelf ? unit.y : (target ? target.y : unit.y);
            const r = spell.crossRadius || 1;

            // diamond: true (Resonance Pulse) = full Manhattan diamond;
            // diagonal: true (Crossfire / Arcane Sigil) = X arms.
            const crossTiles = [{ x: cx, y: cy }];
            if (spell.diamond) {
                for (let dy = -r; dy <= r; dy++) {
                    for (let dx = -r; dx <= r; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        if (Math.abs(dx) + Math.abs(dy) <= r) crossTiles.push({ x: cx + dx, y: cy + dy });
                    }
                }
            } else for (let i = 1; i <= r; i++) {
                if (spell.diagonal) {
                    crossTiles.push({ x: cx + i, y: cy + i }, { x: cx - i, y: cy - i },
                                    { x: cx + i, y: cy - i }, { x: cx - i, y: cy + i });
                } else {
                    crossTiles.push({ x: cx + i, y: cy }, { x: cx - i, y: cy },
                                    { x: cx, y: cy + i }, { x: cx, y: cy - i });
                }
            }
            const hits = Math.max(1, crossTiles.filter(t =>
                v.visibleEnemies.some(e => e.x === t.x && e.y === t.y)
            ).length);
            const allyHits = crossTiles.filter(t =>
                v.allies.some(a => a.x === t.x && a.y === t.y) ||
                (!spell.aoeOriginSelf && unit.x === t.x && unit.y === t.y)
            ).length;
            let s = (spell.dmg || 112) * hits - allyHits * 20;
            for (const eff of (spell.statusEffects || [])) s += 32 * hits;
            if (spell.pushDistance) s += spell.pushDistance * 12 * hits;
            if (target) s *= getTypeMultiplier(unit, target, spell.spellType || null);
            if (hits >= 2) s *= 1.2;
            return s;
        }

        if (kind === 'pull') {
            if (!target) return 0;
            let s = (spell.dmg || 0) + 80;

            const meleeAllies = v.allies.filter(a =>
                g.getEffectiveRange(a) <= 1 &&
                Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= 4
            ).length;
            s += meleeAllies * 56;

            if (spell.pullThroughHazards) s += 40;

            s += getTargetPriority(target, unit, v) * 0.3;

            if (g.getEffectiveRange(target) >= 3) s += 32;
            if (target) s *= getTypeMultiplier(unit, target, spell.spellType || null);
            return s;
        }

        if (kind === 'swap') {
            if (!target) return 0;
            let s = 0;
            let hasReason = false;

            const nearOurAllies = v.allies.filter(a =>
                Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= 3
            ).length;
            if (nearOurAllies >= 2) { s += nearOurAllies * 40; hasReason = true; }

            if (v.ownTower && v.ownTower.hp > 0) {
                const tgtToTower = Math.abs(target.x - v.ownTower.x) + Math.abs(target.y - v.ownTower.y);
                if (tgtToTower <= 3) { s += 80; hasReason = true; }
            }

            if (v.enemyTower && v.enemyTower.hp > 0) {
                const curDist = Math.abs(unit.x - v.enemyTower.x) + Math.abs(unit.y - v.enemyTower.y);
                const newDist = Math.abs(target.x - v.enemyTower.x) + Math.abs(target.y - v.enemyTower.y);
                if (newDist < curDist - 2) { s += 50; hasReason = true; }
            }

            const priority = getTargetPriority(target, unit, v);
            if (priority >= 30) { s += priority * 0.4; hasReason = true; }

            if (!hasReason) return 0;
            return s;
        }

        if (kind === 'escape') {
            let s = 40;

            const hpPct = unit.hp / unit.maxHp;
            if (hpPct < 0.25) s += 160;
            else if (hpPct < 0.4) s += 100;
            else if (hpPct < 0.6) s += 40;
            else s -= 20;

            const debuffs = (unit.statusEffects || []).filter(e =>
                ['stun', 'silence', 'slow', 'poison', 'burn', 'stagger', 'marked', 'discord', 'jammed'].includes(e.id)
            ).length;
            s += debuffs * 40;

            if (v.closestEnemyDist <= 2) s += 48;

            if ((unit.hourglasses || 0) > 0) s += 64;
            return Math.max(s, 0);
        }

        if (kind === 'selfHeal') {
            const hpPct = unit.hp / unit.maxHp;
            const healAmt = spell.selfHealPct ? Math.floor(unit.maxHp * spell.selfHealPct)
                : (spell.healAmt != null ? spell.healAmt : (spell.heal || Math.floor(unit.maxHp * 0.15)));
            const hpDef = unit.maxHp - unit.hp;
            const actualHeal = Math.min(healAmt, hpDef);
            if (actualHeal < 8 && !(unit.statusEffects || []).length) return 0;
            const urgency = hpPct < 0.25 ? 3.0 : hpPct < 0.4 ? 2.2 : hpPct < 0.6 ? 1.4 : 0.5;
            let s = actualHeal * urgency;

            const debuffs = (unit.statusEffects || []).filter(e =>
                ['stun', 'silence', 'slow', 'poison', 'burn', 'stagger', 'marked', 'discord'].includes(e.id)
            ).length;
            s += Math.min(debuffs, spell.cleanse || 0) * 40;
            return s;
        }

        if (kind === 'aoePull') {
            if (!target) return 0;
            const area = getSquareArea(target.x, target.y, spell.aoeRadius || 1);
            const hits = Math.max(1, area.filter(t =>
                v.visibleEnemies.some(e => e.x === t.x && e.y === t.y)
            ).length);
            const allyHits = area.filter(t =>
                v.allies.some(a => a.x === t.x && a.y === t.y) ||
                (unit.x === t.x && unit.y === t.y)
            ).length;
            let s = (spell.dmg || 96) * hits - allyHits * 20;

            s += hits * 32;
            if (target) s *= getTypeMultiplier(unit, target, spell.spellType || null);
            if (hits >= 2) s *= 1.3;
            return s;
        }

        if (kind === 'splitBeam') {
            if (!target) return 0;
            const primaryDmg = spell.dmg || 96;
            const splitCount = spell.splitCount || 2;
            const splitDmg = spell.splitDmg || 64;
            const splitR = spell.splitRadius || 2;

            const nearbyEnemies = v.visibleEnemies.filter(e =>
                e.id !== target.id &&
                Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= splitR
            ).length;
            const actualSplits = Math.min(nearbyEnemies, splitCount);
            let s = primaryDmg + actualSplits * splitDmg;
            s *= getTypeMultiplier(unit, target, spell.spellType || null);
            if (_aiKillHp(target, unit) <= primaryDmg + 24) s += g.getAIWeight('killBonusScore_v1') + 80;
            if (actualSplits >= 1) s *= 1.15;
            return s;
        }

        if (kind === 'delayed') {
            if (!target) return 0;
            const area = getSquareArea(target.x, target.y, spell.aoeRadius || 1);
            const hits = Math.max(1, area.filter(t =>
                v.visibleEnemies.some(e => e.x === t.x && e.y === t.y)
            ).length);

            let s = (spell.dmg || 176) * hits * 0.55;

            if (v.enemyTower && v.enemyTower.hp > 0) {
                const tDist = Math.abs(v.enemyTower.x - target.x) + Math.abs(v.enemyTower.y - target.y);
                if (tDist <= 2) s += 80;
            }
            return s;
        }

        if (kind === 'deployObject') {
            if (!target) return 0;

            const nearObjective = (v.enemyTower && v.enemyTower.hp > 0 &&
                Math.abs(unit.x - v.enemyTower.x) + Math.abs(unit.y - v.enemyTower.y) <= 5) ||
                (v.ownTower && v.ownTower.hp > 0 &&
                    Math.abs(unit.x - v.ownTower.x) + Math.abs(unit.y - v.ownTower.y) <= 4);
            if (v.visibleEnemies.length === 0 && !nearObjective) return 0;

            let s = 40;
            if (v.enemyTower && v.enemyTower.hp > 0) {
                const tDist = Math.abs(v.enemyTower.x - target.x) + Math.abs(v.enemyTower.y - target.y);
                if (tDist <= 4) s += 32;
            }
            if (spell.drawsRangedAttack) s += 32;
            const active = (g.state._deployedObjects || []).filter(o => o.ownerUnitId === unit.id).length;
            if (active >= (spell.maxActivePerCaster || 2)) return 0;
            return s;
        }

        if (kind === 'deployPair') {
            if (!target) return 0;

            const round = g.state.round || 0;
            if (v.visibleEnemies.length === 0 && round <= 3) return 0;

            let s = 50;
            const active = (g.state._gatePairs || []).filter(gp => gp.ownerUnitId === unit.id).length;
            if (active >= (spell.maxActivePerCaster || 1)) return 0;
            const avgAllyDist = v.allies.length > 0
                ? v.allies.reduce((sum, a) => sum + Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y), 0) / v.allies.length
                : 0;
            if (avgAllyDist > 6) s += 40;
            if (v.enemyTower && v.enemyTower.hp > 0) s += 32;
            return s;
        }

        if (kind === 'aoeShield') {
            if (!target) return 0;
            const area = getSquareArea(target.x, target.y, spell.aoeRadius || 1);
            const alliesInArea = [unit, ...v.allies].filter(a =>
                !a.dead && area.some(t => t.x === a.x && t.y === a.y)
            ).length;
            if (alliesInArea === 0) return 0;
            let s = (spell.shield || 48) * alliesInArea * 0.6;

            const threatened = v.visibleEnemies.length > 0;
            if (threatened) s *= 1.4;
            return s;
        }

        if (kind === 'zoneDebuff') {
            if (!target) return 0;
            const area = getSquareArea(target.x, target.y, spell.aoeRadius || 1);
            // 🌫 Low Gravity is a FRIENDLY mobility field — score it by allies
            // lifted, not enemies afflicted (findSpellTarget aims it at the
            // team's own cluster).
            if (spell.gravityField === 'weak') {
                const alliesInArea = [unit, ...v.allies].filter(a =>
                    !a.dead && area.some(t => t.x === a.x && t.y === a.y)
                ).length;
                return alliesInArea >= 2 ? 30 + alliesInArea * 24 : 0;
            }
            const enemiesInArea = area.filter(t =>
                v.visibleEnemies.some(e => e.x === t.x && e.y === t.y)
            ).length;
            let s = 40 + enemiesInArea * 48;
            // 🕳 Gravity Crush: denial + anti-air — grounded flyers and dead
            // jumps are worth more than a generic status cloud.
            if (spell.gravityField === 'super') {
                const flyersCaught = v.visibleEnemies.filter(e =>
                    area.some(t => t.x === e.x && t.y === e.y)
                    && typeof g.canFly === 'function' && g.canFly(e)).length;
                s += flyersCaught * 60;
            }

            s *= Math.min(spell.zoneDuration || 1, 3) * 0.6;

            if (v.enemyTower && v.enemyTower.hp > 0) {
                const tDist = Math.abs(v.enemyTower.x - target.x) + Math.abs(v.enemyTower.y - target.y);
                if (tDist <= 3) s += 40;
            }
            return s;
        }

        if (kind === 'zoneHeal') {
            if (!target) return 0;
            const area = getSquareArea(target.x, target.y, spell.aoeRadius || 1);
            const alliesInArea = [unit, ...v.allies].filter(a =>
                !a.dead && area.some(t => t.x === a.x && t.y === a.y)
            ).length;
            const hurtAllies = [unit, ...v.allies].filter(a =>
                !a.dead && a.hp < a.maxHp * 0.8 && area.some(t => t.x === a.x && t.y === a.y)
            ).length;
            let s = 40 + hurtAllies * 48 + alliesInArea * 16;
            s *= Math.min(spell.zoneDuration || 1, 3) * 0.5;

            if (v.ownTower && v.ownTower.hp > 0) {
                const tDist = Math.abs(v.ownTower.x - target.x) + Math.abs(v.ownTower.y - target.y);
                if (tDist <= 3) s += 32;
            }
            return s;
        }

        if (kind === 'terrainCreate') {
            if (!target) return 0;

            if (v.visibleEnemies.length === 0) return 0;

            let s = 0;

            if (spell.dmg) {
                const enemiesNear = v.visibleEnemies.filter(e =>
                    Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 1
                );
                s += enemiesNear.length * (spell.dmg * 0.8);
                for (const e of enemiesNear) {
                    if (_aiKillHp(e, unit) <= (spell.dmg || 0) + 20) s += g.getAIWeight('killBonusScore_v1') + 40;
                    s += getTargetPriority(e, unit, v) * 0.2;
                }
            }

            if (v.ownTower && v.ownTower.hp > 0) {
                const tDist = Math.abs(v.ownTower.x - target.x) + Math.abs(v.ownTower.y - target.y);
                const approachingEnemies = v.visibleEnemies.filter(e =>
                    Math.abs(e.x - v.ownTower.x) + Math.abs(e.y - v.ownTower.y) <= 6
                ).length;
                if (tDist <= 4 && approachingEnemies > 0) {
                    s += 20 + approachingEnemies * 10;
                }
            }

            return s;
        }

        if (kind === 'cleanse') {
            if (!target) return 0;
            const debuffs = (target.statusEffects || []).filter(e =>
                ['stun', 'silence', 'slow', 'poison', 'burn', 'stagger', 'marked', 'discord', 'jammed', 'glare'].includes(e.id)
            ).length;
            if (debuffs === 0) return 0;
            let s = debuffs * 56;

            if ((target.statusEffects || []).some(e => e.id === 'stun')) s += 48;
            if ((target.statusEffects || []).some(e => e.id === 'silence')) s += 32;

            if ((target.hourglasses || 0) > 0) s += 40;
            if (unit.cls === 'White Mage') s *= 1.5;
            return s;
        }

        if (kind === 'displacement') {
            if (!target) return 0;
            let s = (spell.dmg || 96) + 40;

            const nearbyEnemies = v.visibleEnemies.filter(e =>
                e.id !== target.id &&
                Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= 2
            ).length;
            s += nearbyEnemies * 32;

            s += 24;
            s *= getTypeMultiplier(unit, target, spell.spellType || null);
            s += getTargetPriority(target, unit, v) * 0.3;
            if (_aiKillHp(target, unit) <= (spell.dmg || 96) + 24) s += g.getAIWeight('killBonusScore_v1') + 80;
            return s;
        }

        if (kind === 'skyDrop' || kind === 'skyThrow' || kind === 'skySlam') {
            if (!target) return 0;

            if (spell.requiresFlight && typeof g.canFly === 'function' && !g.canFly(unit)) return 0;

            const dist = Math.abs(unit.x - target.x) + Math.abs(unit.y - target.y);
            if (dist > (_effRange(unit, spell) || 1)) return 0;

            const casterZ = typeof g.getUnitStandingHeight === 'function' ? g.getUnitStandingHeight(unit) : 0;
            const carryH = spell.carryHeight || 4;
            const landingZ = typeof g.getHeightAt === 'function' ? g.getHeightAt(target.x, target.y) : 0;
            const elevDelta = Math.max(0, (casterZ + carryH) - landingZ);
            const perLevel = spell.dmgPerLevel || 25;
            const estDmg = (spell.dmg || 60) + (elevDelta * perLevel);

            let s = estDmg;
            for (const eff of (spell.statusEffects || [])) s += scoreStatusEffect(eff, target, v);
            s *= getTypeMultiplier(unit, target, spell.spellType || null);
            s += getTargetPriority(target, unit, v) * 0.4;
            if (_aiKillHp(target, unit) <= estDmg + 24) s += g.getAIWeight('killBonusScore_v1') + 100;

            if (kind === 'skyThrow') {
                const nearbyEnemies = v.visibleEnemies.filter(e =>
                    e.id !== target.id &&
                    Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= (spell.throwRange || 3)
                ).length;
                s += nearbyEnemies * (spell.collisionBonus || 50) * 0.5;
            }

            if (kind === 'skySlam') {
                s *= 1.1;

                if (spell.aoeRadius) {
                    const aoeHits = v.visibleEnemies.filter(e =>
                        e.id !== target.id &&
                        Math.abs(e.x - target.x) <= spell.aoeRadius &&
                        Math.abs(e.y - target.y) <= spell.aoeRadius
                    ).length;
                    s += aoeHits * estDmg * (spell.aoeDmgPct || 0.5) * 0.6;
                }
            }

            if (spell.drainPct) s += estDmg * spell.drainPct * 0.5;

            if (elevDelta >= 4) s *= 1.2;
            if (elevDelta >= 8) s *= 1.3;

            return s;
        }

        if (kind === 'leapStrike') {
            if (!target) return 0;
            const dist = Math.abs(unit.x - target.x) + Math.abs(unit.y - target.y);
            if (dist > (_effRange(unit, spell) || 2)) return 0;

            const casterZ = typeof g.getUnitStandingHeight === 'function' ? g.getUnitStandingHeight(unit) : 0;
            const targetZ = typeof g.getUnitStandingHeight === 'function' ? g.getUnitStandingHeight(target) : 0;
            if (casterZ <= targetZ) return 0;

            const elevDelta = casterZ - targetZ;
            const perLevel = spell.dmgPerLevel || 20;
            const estDmg = (spell.dmg || 80) + (elevDelta * perLevel);

            let s = estDmg;
            for (const eff of (spell.statusEffects || [])) s += scoreStatusEffect(eff, target, v);
            s *= getTypeMultiplier(unit, target, spell.spellType || null);
            s += getTargetPriority(target, unit, v) * 0.4;
            if (_aiKillHp(target, unit) <= estDmg + 24) s += g.getAIWeight('killBonusScore_v1') + 100;

            if (spell.aoeRadius) {
                const aoeHits = v.visibleEnemies.filter(e =>
                    e.id !== target.id &&
                    Math.abs(e.x - target.x) <= spell.aoeRadius &&
                    Math.abs(e.y - target.y) <= spell.aoeRadius
                ).length;
                s += aoeHits * estDmg * (spell.aoeDmgPct || 0.4) * 0.6;
            }

            if (elevDelta >= 3) s *= 1.2;
            if (elevDelta >= 6) s *= 1.3;

            return s;
        }

        return 5;
    }

    function scoreStatusEffect(eff, target, v) {
        const g = G();
        const id = eff.id;
        const dur = eff.duration || 1;

        if (id === 'stun') {
            const hasActed = (target.ap || 0) === 0;
            // Denying a full-AP unit its entire activation is worth as much as
            // a solid damage spell — the old 20-ish scores meant the AI almost
            // never cast control at all.
            return hasActed ? 10 : 60 + dur * 20;
        }

        if (id === 'stagger') {
            const hasActed = (target.ap || 0) === 0;
            return hasActed ? 3 : 12 + dur * 4;
        }

        if (id === 'silence') {
            const isCaster = ['Black Mage', 'White Mage', 'Psychic', 'Harbinger', 'Harvester'].includes(target.cls);
            return isCaster ? 70 + dur * 10 : 8;
        }

        if (id === 'sleep' || id === 'freeze' || id === 'charm' || id === 'sirenSong') {
            const hasActed = (target.ap || 0) === 0;
            return hasActed ? 12 : 55 + dur * 15;
        }

        if (id === 'root') {
            // rooting a melee unit takes it out of the fight; rooting a ranged
            // sniper barely matters
            const melee = (G().getEffectiveRange ? G().getEffectiveRange(target) : (target.range || 1)) <= 1;
            return melee ? 40 + dur * 8 : 10;
        }

        if (id === 'confuse') return 35 + dur * 8;

        if (id === 'slow') return 8 + dur * 3;

        if (id === 'burn') return 8 + dur * 3;

        // 2026-07-17 pass: taunt is gold ON a hard hitter (their turn is spent
        // chewing the Tank); minimize guts physical attackers; hexed punishes
        // mobile/casty units (they act every turn — each act bleeds 36).
        if (id === 'taunt') {
            const hitter = (target.atk || 0) >= 30 || ['Raider', 'Swordmaster', 'Gunslinger', 'Sniper', 'Agent'].includes(target.cls);
            return hitter ? 55 + dur * 10 : 20;
        }
        if (id === 'minimize') {
            const physical = (target.atk || 0) >= (target.int || 0);
            return physical ? 50 + dur * 8 : 15;
        }
        if (id === 'hexed') return 30 + dur * 12;

        if (id === 'poison') return 6 + dur * 2;

        if (id === 'marked') return 10;

        if (id === 'glare') return 8;

        if (id === 'jammed') return 6;

        return 4;
    }

    function scoreTeleport(unit, spell, target, v) {
        const g = G();
        // (2026-07-10) was gated to Psychic only — which made every race
        // teleport (Instant Transmission, Shadow Step variants…) a dead spell
        // slot for the AI. Any class can value a teleport now.
        if (!v.visibleEnemies.length && !v.allies.length) return 0;
        if (!target) return 0;

        let bestScore = 0;

        if (v.ownTower && v.ownTower.hp > 0) {
            for (const e of v.visibleEnemies) {
                const d = Math.abs(e.x - v.ownTower.x) + Math.abs(e.y - v.ownTower.y);
                if (d <= 3) bestScore = Math.max(bestScore, 22 + (3 - d) * 5);
            }
        }

        // Escape: badly hurt with melee breathing down our neck — blink out.
        if (unit.hp < unit.maxHp * 0.35 && v.closestEnemyDist <= 2) {
            bestScore = Math.max(bestScore, 70);
        }

        // Engage: a fighter that can't reach anything this turn can blink into
        // strike range instead of walking (move+attack in one activation).
        if (v.closestEnemyDist > g.getEffectiveRange(unit) + (g.getEffectiveMove ? (g.getEffectiveMove(unit) || unit.move || 2) : (unit.move || 2))
            && unit.hp > unit.maxHp * 0.5 && (unit.ap || 0) >= 2) {
            bestScore = Math.max(bestScore, 40);
        }

        for (const hg of v.visibleHourglasses) {
            for (const a of v.allies) {
                const d = Math.abs(a.x - hg.x) + Math.abs(a.y - hg.y);
                if (d > 1 && d <= _effRange(unit, spell)) bestScore = Math.max(bestScore, 28);
            }
        }

        if (v.enemyTower && v.enemyTower.hp > 0) {
            for (const a of v.allies) {
                const curDist = Math.abs(a.x - v.enemyTower.x) + Math.abs(a.y - v.enemyTower.y);
                if (curDist > 3 && Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= _effRange(unit, spell)) {
                    let s = 20;
                    if (v.winState.phase === 'tower_push') s += 15;
                    if (v.winState.enemyDeadCount >= 1) s += 10;
                    bestScore = Math.max(bestScore, s);
                }
            }
        }

        for (const e of v.visibleEnemies) {
            const eDist = Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y);
            if (eDist > _effRange(unit, spell)) continue;
            const nearbyAlliesOfTarget = v.visibleEnemies.filter(e2 =>
                e2.id !== e.id && Math.abs(e2.x - e.x) + Math.abs(e2.y - e.y) <= 2
            ).length;
            if (nearbyAlliesOfTarget >= 2) {
                bestScore = Math.max(bestScore, 18 + nearbyAlliesOfTarget * 3);
            }
        }

        return bestScore;
    }

    // scoreSpellsOnTower removed 2026-07-10: towers/Cubes are damageable by
    // BASIC ATTACKS ONLY (design rule) — spells never target them.

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
            const isOff = ['damage', 'multiHit', 'aoe'].includes(combo.kind);

            let comboTarget = null;
            if (isOff) {
                const cr = combo.range || 3;
                const targets = v.visibleEnemies.filter(e => {
                    const d = g.combatDist ? g.combatDist(unit.x, unit.y, unit.z ?? 0, e.x, e.y, e.z ?? 0) : (Math.abs(unit.x - e.x) + Math.abs(unit.y - e.y));
                    return d >= 1 && d <= cr && !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y);
                });

                targets.sort((a, b) => getTargetPriority(b, unit, v) - getTargetPriority(a, unit, v));
                comboTarget = targets[0] || null;
                if (!comboTarget) continue;
            }

            let score = 0;
            if (combo.hitDamages) score = Math.round(combo.hitDamages.reduce((a, b) => a + b, 0) * synergy.mult);
            else score = Math.round(((combo.dmg || 0) + (combo.heal || 0) * 0.7) * synergy.mult);
            if (combo.statusEffects?.length) score += g.getAIWeight('statusEffectBonus_v1');
            if (synergy.mult > 1) score += g.getAIWeight('comboSynergyBonus_v1');
            if (comboTarget && _aiKillHp(comboTarget, unit) <= (combo.dmg || 0) + 5) score += g.getAIWeight('comboKillBonus_v1');

            if (comboTarget) score *= getTypeMultiplier(unit, comboTarget);

            // Press value: an offensive combo into a weakness refunds AP to the
            // initiator (extends its turn).
            if (comboTarget && ['damage', 'multiHit', 'aoe'].includes(combo.kind)) {
                score += _pressScoreAdj(unit, comboTarget, { spellType: combo.spellType || null }).add;
            }

            out.push({ type: 'combo', partner, combo, target: comboTarget, score });
        }
    }

    function scoreDetonate(unit, v, out) {
        const g = G();
        if ((unit.ap || 0) < g.AP_COST_ACTION) return;
        const bombs = (g.state.bombs || []).filter(b => b.ownerUnitId === unit.id);
        if (bombs.length === 0) return;

        const hitCount = bombs.reduce((total, b) =>
            total + v.visibleEnemies.filter(e => Math.abs(e.x - b.x) + Math.abs(e.y - b.y) <= (b.radius || 1)).length
        , 0);
        if (hitCount > 0) {
            out.push({ type: 'detonate', score: 144 * hitCount });
        }
    }

    function scoreMoves(unit, v, out) {
        const g = G();
        if (_skipMove || !g.canUnitMove(unit)) return;

        const moveTiles = g.getMoveTiles(unit);
        if (moveTiles.length === 0) return;

        if ((unit.ap || 0) >= g.AP_COST_ACTION * 2 && !_skipAttack) {
            const moveAttackCandidates = scoreMoveToAttack(unit, moveTiles, v);
            if (moveAttackCandidates.length > 0) {
                moveAttackCandidates.sort((a, b) => b.score - a.score);
                const best = moveAttackCandidates[0];
                if (best.score > 0) {
                    out.push({ type: 'move', x: best.x, y: best.y, z: best.z, score: best.score });

                }
            }
        }

        // Standing on hazard ground (a telegraphed Crystal Ball tile, fire,
        // poison, deep water)? Always offer an explicit escape step — scored by
        // the danger being fled — so "get off the mine" can beat every attack.
        const _standingHazard = aiHazardPenaltyAt(unit, unit.x, unit.y);
        if (_standingHazard > 0 && moveTiles.length > 0) {
            let esc = null, escPen = Infinity, escD = Infinity;
            for (const t of moveTiles) {
                const p = aiHazardPenaltyAt(unit, t.x, t.y);
                const d = Math.abs(t.x - unit.x) + Math.abs(t.y - unit.y);
                if (p < escPen || (p === escPen && d < escD)) { escPen = p; escD = d; esc = t; }
            }
            if (esc && escPen < _standingHazard) {
                out.push({ type: 'move', x: esc.x, y: esc.y, z: esc.z,
                           score: 40 + (_standingHazard - escPen), _fleeHazard: true });
            }
        }

        const goal = pickMoveGoal(unit, v);
        if (!goal) return;

        const bestTile = pickBestMoveTile(unit, moveTiles, goal, v);
        if (!bestTile) return;

        out.push({ type: 'move', x: bestTile.x, y: bestTile.y, z: bestTile.z, score: goal.score });
    }

    function scoreMoveToAttack(unit, moveTiles, v) {
        const g = G();
        const results = [];
        const effRange = g.getEffectiveRange(unit);
        const estDmg = Math.max(24, Math.floor(_aiAtk(unit) * 0.65) + g.getEffectiveAttackBonus(unit));

        for (const tile of moveTiles) {
            let tileScore = 0;

            for (const e of v.visibleEnemies) {
                const d = g.combatDist ? g.combatDist(tile.x, tile.y, tile.z ?? 0, e.x, e.y, e.z ?? 0)
                    : (Math.abs(tile.x - e.x) + Math.abs(tile.y - e.y));
                if (d < 1 || d > effRange) continue;
                if (g.isRangeBlockedByTerrain(tile.x, tile.y, e.x, e.y)) continue;

                let attackVal = estDmg * getTypeMultiplier(unit, e);
                attackVal += getTargetPriority(e, unit, v) * 0.5;
                if (_aiKillHp(e, unit) <= estDmg + 32) attackVal += 240;

                // Backline jobs keep their distance: shoot from max range, and
                // never walk INTO melee when the kit works from 3+ tiles away.
                const _tendM = JOB_TENDENCIES[unit.cls];
                if (_tendM && _tendM.backline && effRange > 1) {
                    attackVal += (d - 1) * 8;
                    if (d <= 1) attackVal *= 0.55;
                }

                if (typeof g.getUnitStandingHeight === 'function' && typeof g.getHeightAt === 'function') {
                    const tileH = tile.z ?? g.getHeightAt(tile.x, tile.y);
                    const eH = g.getUnitStandingHeight(e);
                    if (tileH > eH) {

                        attackVal *= 1 + 0.1 * (tileH - eH);
                    } else if (eH > tileH) {

                        attackVal -= 5 * (eH - tileH);
                    }
                }

                // Facing-aware flanking: score the arc AS IF attacking from this
                // tile (getAttackArc only reads attacker x/y, so a hypothetical
                // position works). Back = +25% dmg, undodgeable, uncounterable.
                if (typeof g.getAttackArc === 'function' && typeof g.getFacingDamageMult === 'function') {
                    const arc = g.getAttackArc({ x: tile.x, y: tile.y }, e);
                    attackVal *= g.getFacingDamageMult(arc);
                    if (arc === 'back') attackVal += 30;
                }

                tileScore = Math.max(tileScore, attackVal);
            }

            if (v.enemyTower && v.enemyTower.hp > 0) {
                const tDist = Math.abs(tile.x - v.enemyTower.x) + Math.abs(tile.y - v.enemyTower.y);
                if (tDist >= 1 && tDist <= effRange &&
                    !g.isRangeBlockedByTerrain(tile.x, tile.y, v.enemyTower.x, v.enemyTower.y)) {
                    let towerVal = estDmg + 280;
                    if (v.winState.phase === 'tower_push') towerVal += 360;
                    else if (v.winState.phase === 'numbers_advantage') towerVal += 200;
                    if (v.winState.enemyDeadCount >= 1) towerVal += 240;

                    const nearTowerEnemies = v.visibleEnemies.filter(e =>
                        Math.abs(e.x - v.enemyTower.x) + Math.abs(e.y - v.enemyTower.y) <= 5
                    );
                    if (nearTowerEnemies.length === 0) towerVal += 280;
                    towerVal += v.winState.roundUrgency * 10;
                    tileScore = Math.max(tileScore, towerVal);
                }
            }

            if (tileScore <= 0) continue;

            const threat = getThreatAt(v.threatMap, tile.x, tile.y);
            tileScore -= threat.count * (JOB_TENDENCIES[unit.cls]?.backline ? 44 : 24);

            if (unit.hp < unit.maxHp * 0.4) tileScore -= threat.count * 40;

            if ((unit._aiRecentTiles || []).includes(g.posKey(tile.x, tile.y))) tileScore += g.getAIWeight('antiOscillationPen_v1');

            if (tileScore > 0) {
                results.push({ x: tile.x, y: tile.y, z: tile.z, score: tileScore });
            }
        }

        return results;
    }

    function scoreKiteRetreat(unit, v, out) {
        const g = G();
        if (!v.tactical.shouldKite) return;
        if (_skipMove || !g.canUnitMove(unit)) return;

        if (unit._aiLoopCount <= 1) return;

        const moveTiles = g.getMoveTiles(unit);
        if (moveTiles.length === 0) return;

        let bestTile = null, bestScore = -Infinity;
        for (const tile of moveTiles) {
            let score = 0;

            for (const e of v.visibleEnemies) {
                if (g.getEffectiveRange(e) > 1) continue;
                const newDist = Math.abs(tile.x - e.x) + Math.abs(tile.y - e.y);
                const curDist = Math.abs(unit.x - e.x) + Math.abs(unit.y - e.y);
                score += (newDist - curDist) * g.getAIWeight('safeEnemyDistWeight_v1');
            }

            const threat = getThreatAt(v.threatMap, tile.x, tile.y);
            score -= threat.count * 4;

            for (const a of v.allies) {
                if (Math.abs(tile.x - a.x) + Math.abs(tile.y - a.y) <= 4) score += AI_TUNE.safeAllyProximity;
            }
            if ((unit._aiRecentTiles || []).includes(g.posKey(tile.x, tile.y))) score += g.getAIWeight('antiOscillationPen_v1');

            if (score > bestScore) { bestScore = score; bestTile = tile; }
        }

        if (bestTile && bestScore > 3) {
            out.push({ type: 'move', x: bestTile.x, y: bestTile.y, z: bestTile.z, score: 22 });
        }
    }

    // Intents whose score the Hard-difficulty "objective persona" multiplies:
    // everything that scores points or progresses a win condition, nothing
    // that is pure combat. One knob turns a kill-trader into an objective
    // player without touching any trained weight.
    const _OBJECTIVE_INTENTS = new Set([
        'ctf_carry_home', 'ctf_intercept_carrier', 'ctf_return_flag', 'ctf_grab_flag',
        'hotspot_nexus', 'domination_nexus', 'arena_nexus_deny', 'arena_nexus',
        'approach_nexus', 'grab_hg', 'approach_hg', 'siege_tower',
        'siege_tower_opportunistic', 'default_siege',
    ]);

    // ── INTENT LAYER (schema 12) ─────────────────────────────────────────
    // This used to be a first-match-wins if/return ladder: branch ORDER
    // silently decided priority, and a branch's score was only ever compared
    // against non-move candidates. Now every applicable intent is pushed as
    // a scored candidate and the argmax wins (the XCOM shape: pick an intent,
    // then execute it). Conditions and scores are otherwise carried over
    // 1:1, with two deliberate behavior changes flagged inline (domination
    // objective play, TDM retreat-at-disadvantage).
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
                    goals.push({ x: fx, y: sanct.churchY, score: 80, reason: 'ctf_carry_home' });
                }
            }

            if (ownFlag && ownFlag.carriedBy) {
                const carrier = g.state.units.find(u => u.id === ownFlag.carriedBy && !u.dead);
                if (carrier) {
                    const d = Math.abs(unit.x - carrier.x) + Math.abs(unit.y - carrier.y);
                    if (d <= 12) {
                        goals.push({ x: carrier.x, y: carrier.y, score: 65, reason: 'ctf_intercept_carrier' });
                    }
                }
            }

            if (ownFlag && !ownFlag.atBase && !ownFlag.carriedBy) {
                const d = Math.abs(unit.x - ownFlag.x) + Math.abs(unit.y - ownFlag.y);
                if (d <= 10) {
                    goals.push({ x: ownFlag.x, y: ownFlag.y, score: 55, reason: 'ctf_return_flag' });
                }
            }

            if (enemyFlag && !enemyFlag.carriedBy) {
                goals.push({ x: enemyFlag.x, y: enemyFlag.y, score: 45, reason: 'ctf_grab_flag' });
            }
        }

        if (modeId === 'hotspot' && g.state.roamingNexus) {
            const rn = g.state.roamingNexus;
            const cx = rn.zoneX + Math.floor(rn.zoneSize / 2);
            const cy = rn.zoneY + Math.floor(rn.zoneSize / 2);
            const d = Math.abs(unit.x - cx) + Math.abs(unit.y - cy);
            let s = 40;
            if (rn.owner !== unit.player) s += 15;
            if (d <= 4) s += 10;

            const alliesNearNexus = g._isFFA() ? 0 : g.state.units.filter(u =>
                u.player === unit.player && !u.dead && u.id !== unit.id &&
                Math.abs(u.x - cx) + Math.abs(u.y - cy) <= 4
            ).length;
            if (alliesNearNexus >= 2) s -= 20;
            if (s > 0) goals.push({ x: cx, y: cy, score: s, reason: 'hotspot_nexus' });
        }

        // BEHAVIOR CHANGE (schema 12): this used to be gated on "no enemies
        // visible", so in Domination the AI stopped playing the objective the
        // moment a fight started — but zones pay 10 pts/round and kills pay
        // nothing. Zones now stay a candidate mid-fight, just discounted.
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
                let s = 45;
                const ownedCount = Object.keys(g.state.nexusPoints).filter(f =>
                    g.state.nexusPoints[f]?.owner === unit.player
                ).length;
                if (ownedCount === 0) s += 15;
                if (v.visibleEnemies.length > 0) s -= 15;
                goals.push({ x: bestNexCenter.x, y: bestNexCenter.y, score: s, reason: 'domination_nexus' });
            }
        }

        // Arena EMERGENCY: on 3-zone maps, all three nexus zones at once is an
        // instant win. If the enemy holds all-but-one, contesting/stealing a zone
        // outranks everything except an immediate kill — sprint to the nearest
        // zone we can flip (their weakest hold or the unclaimed one).
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
                if (best) goals.push({ x: bestC.x, y: bestC.y, score: 75, reason: 'arena_nexus_deny' });
            }
        }

        if (modeId === 'tdm' || modeId === 'ffa') {

            if (v.closestEnemy) {
                let bestTarget = v.closestEnemy;
                let bestPriority = getTargetPriority(v.closestEnemy, unit, v);
                for (const e of v.visibleEnemies) {
                    const p = getTargetPriority(e, unit, v);
                    if (p > bestPriority + 5) { bestPriority = p; bestTarget = e; }
                }
                // BEHAVIOR CHANGE (schema 12): the hunt used to preempt the
                // retreat branch unconditionally, so outnumbered units fed
                // kills (= points for the enemy). At a disadvantage the hunt
                // now scores below retreat (16 < 20) and the unit backs off.
                const huntScore = v.tactical.shouldEngage ? 30 : 16;
                goals.push({ x: bestTarget.x, y: bestTarget.y, score: huntScore, reason: 'tdm_hunt' });
            } else {
                const cx = Math.floor(g.bw() / 2);
                const cy = Math.floor(g.bh() / 2);
                goals.push({ x: cx, y: cy, score: 15, reason: 'tdm_advance' });
            }
        }

        const round = g.state.round || 0;
        if (round <= 3 && v.visibleEnemies.length === 0 && v.visibleHourglasses.length === 0) {
            const exploreBonus = AI_TUNE.earlyExploreBonus;
            if (exploreBonus > 0 && g.canUnitMove(unit)) {
                const moveTiles = g.getMoveTiles(unit);
                if (moveTiles.length > 0) {

                    const cx = Math.floor(g.bw() / 2);
                    const cy = Math.floor(g.bh() / 2);
                    let bestTile = null, bestVal = -Infinity;
                    for (const t of moveTiles) {
                        let val = 0;

                        const curCenterDist = Math.abs(unit.x - cx) + Math.abs(unit.y - cy);
                        const newCenterDist = Math.abs(t.x - cx) + Math.abs(t.y - cy);
                        val += (curCenterDist - newCenterDist) * 2;

                        for (const a of v.allies) {
                            val += Math.min(3, Math.abs(t.x - a.x) + Math.abs(t.y - a.y));
                        }

                        if ((unit._aiRecentTiles || []).includes(g.posKey(t.x, t.y))) val -= 6;
                        if (val > bestVal) { bestVal = val; bestTile = t; }
                    }
                    if (bestTile) {
                        goals.push({ x: bestTile.x, y: bestTile.y, score: exploreBonus + Math.min(bestVal, 10), reason: 'early_explore' });
                    }
                }
            }
        }

        if (v.visibleHourglasses.length > 0) {
            const moveTiles = g.getMoveTiles(unit);
            const reachable = v.visibleHourglasses.filter(h =>
                moveTiles.some(t => t.x === h.x && t.y === h.y)
            );
            if (reachable.length > 0) {
                reachable.sort((a, b) =>
                    (Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y)) -
                    (Math.abs(b.x - unit.x) + Math.abs(b.y - unit.y))
                );
                let s = 50;
                if (ws.phase === 'hg_losing') s += 20;

                const currentHG = unit.hourglasses || 0;
                s += currentHG * 5;
                goals.push({ x: reachable[0].x, y: reachable[0].y, score: s, reason: 'grab_hg' });
            }
        }

        if (v.ownTower && v.ownTower.hp > 0 && v.visibleEnemies.length > 0) {
            const threats = v.visibleEnemies.filter(e =>
                Math.abs(e.x - v.ownTower.x) + Math.abs(e.y - v.ownTower.y) <= 5
            );
            if (threats.length > 0) {
                const myDist = Math.abs(unit.x - v.ownTower.x) + Math.abs(unit.y - v.ownTower.y);
                const closestThreat = Math.min(...threats.map(e => Math.abs(e.x - v.ownTower.x) + Math.abs(e.y - v.ownTower.y)));
                if (myDist > closestThreat + 1 && myDist > 3) {
                    let s = g.getAIWeight('towerDefendBonus_v1');
                    if (ws.phase === 'tower_defend') s += 20;
                    goals.push({ x: v.ownTower.x, y: v.ownTower.y, score: s, reason: 'defend_tower' });
                }
            }
        }

        // Arena: nexus zones are a first-class objective, not an idle-time hobby.
        // Unlike the generic block below this one is NOT gated on "no enemies
        // visible" — zone control pays every round (and doubles late), and three
        // zones is an instant win, so the AI must keep pressing them mid-fight.
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
                    let s = 38;
                    if (v.visibleEnemies.length > 0) s -= 12;
                    if (ownedCount === 0) s += 8;
                    s += ownedCount * 6;
                    if (best.owner === enemyPlayer) s += 6;
                    if (zones.length >= 3 && ownedCount === zones.length - 1) s += 30;
                    if (v.enemyTower && v.enemyTower.hp < v.enemyTower.maxHp * 0.25) s -= 12;
                    const alliesNear = g.state.units.filter(u =>
                        u.player === unit.player && !u.dead && u.id !== unit.id &&
                        Math.abs(u.x - bestC.x) + Math.abs(u.y - bestC.y) <= 3
                    ).length;
                    if (alliesNear >= 2) s -= 18;
                    if (s > 0) goals.push({ x: bestC.x, y: bestC.y, score: s, reason: 'arena_nexus' });
                }
            }
        }

        // Generic nexus approach for modes without a dedicated block above
        // (arena and domination handle their own zones).
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
                let s = Math.floor(g.getAIWeight('nexusCapBonus_v1') * 0.7);
                const ownedCount = Object.keys(g.state.nexusPoints).filter(f =>
                    g.state.nexusPoints[f]?.owner === unit.player
                ).length;
                s += ownedCount * 5;
                if (ownedCount === 0) s += 8;
                if (v.enemyTower && v.enemyTower.hp < v.enemyTower.maxHp * 0.3) s -= 15;
                if (s > 0) goals.push({ x: bestNexCenter.x, y: bestNexCenter.y, score: s, reason: 'approach_nexus' });
            }
        }

        if (v.enemyTower && v.enemyTower.hp > 0) {
            const towerDist = Math.abs(unit.x - v.enemyTower.x) + Math.abs(unit.y - v.enemyTower.y);

            const towerDefenders = v.visibleEnemies.filter(e =>
                Math.abs(e.x - v.enemyTower.x) + Math.abs(e.y - v.enemyTower.y) <= 4
            );

            const shouldPush = (
                ws.phase === 'tower_push' ||
                ws.phase === 'numbers_advantage' ||
                ws.enemyDeadCount >= 1 ||
                towerDefenders.length === 0 ||
                ws.roundUrgency >= 2 ||
                v.enemyTower.hp < v.enemyTower.maxHp * 0.7
            );

            if (shouldPush) {
                let s = 28;

                if (ws.enemyDeadCount >= 2) s += 35;
                else if (ws.enemyDeadCount >= 1) s += 20;

                if (ws.enemyMinRespawn >= 6) s += 35;
                else if (ws.enemyMinRespawn >= 4) s += 20;

                if (towerDefenders.length === 0) s += 25;

                if (v.enemyTower.hp < v.enemyTower.maxHp * 0.5) s += 20;
                if (v.enemyTower.hp < v.enemyTower.maxHp * 0.3) s += 25;

                if (ws.phase === 'tower_push') s += 30;
                if (ws.phase === 'numbers_advantage') s += 15;

                s += ws.roundUrgency * 12;

                if (towerDist <= 5) s += 10;

                if (unit.cls === 'White Mage') s *= 0.6;

                goals.push({ x: v.enemyTower.x, y: v.enemyTower.y, score: s, reason: 'siege_tower' });
            } else if (towerDist <= 8 && v.closestEnemyDist > 3) {
                goals.push({ x: v.enemyTower.x, y: v.enemyTower.y, score: 22, reason: 'siege_tower_opportunistic' });
            }
        }

        if (ws.phase === 'even' && ws.roundUrgency === 0 && v.visibleEnemies.length === 0) {
            const mapCenterX = Math.floor((g.state.mapCols || 15) / 2);
            const mapCenterY = Math.floor((g.state.mapRows || 8) / 2);
            const distToMid = Math.abs(unit.x - mapCenterX) + Math.abs(unit.y - mapCenterY);
            if (distToMid > 3) {
                goals.push({ x: mapCenterX, y: mapCenterY, score: 18, reason: 'advance_to_mid' });
            }
        }

        if (!v.tactical.shouldEngage && v.closestEnemyDist <= 5 && v.closestEnemyDist < Infinity) {
            const enemiesNearOwnTower = v.ownTower && v.ownTower.hp > 0 &&
                v.visibleEnemies.some(e =>
                    Math.abs(e.x - v.ownTower.x) + Math.abs(e.y - v.ownTower.y) <= 5
                );
            if (!enemiesNearOwnTower) {
                goals.push({ retreat: true, score: 20, reason: 'retreat' });
            }

        }

        if (v.closestEnemy && v.tactical.shouldEngage) {
            let bestTarget = v.closestEnemy;
            let bestPriority = getTargetPriority(v.closestEnemy, unit, v);
            for (const e of v.visibleEnemies) {
                const p = getTargetPriority(e, unit, v);
                const d = g.combatDist ? g.combatDist(e.x, e.y, e.z ?? 0, unit.x, unit.y, unit.z ?? 0) : (Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y));
                if (p > bestPriority + 10 && d < 12) {
                    bestPriority = p;
                    bestTarget = e;
                }
            }
            let s = 18;

            if (v.enemyTower && v.enemyTower.hp > 0) {
                const eDist = Math.abs(bestTarget.x - v.enemyTower.x) + Math.abs(bestTarget.y - v.enemyTower.y);
                if (eDist <= 4) s += 12;
            }
            goals.push({ x: bestTarget.x, y: bestTarget.y, score: s, reason: 'approach_enemy' });
        }

        // Loose hourglasses are a win condition (collect all = instant win,
        // 35 composite pts each at the horn) — in the old ladder this branch
        // sat below approach_enemy, so hgSeekPriority_v1 was unreachable
        // whenever the unit wanted to fight. Now it competes on score.
        if (v.visibleHourglasses.length > 0) {
            const nearest = v.visibleHourglasses.sort((a, b) =>
                (Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y)) -
                (Math.abs(b.x - unit.x) + Math.abs(b.y - unit.y))
            )[0];
            const hgDist = Math.abs(nearest.x - unit.x) + Math.abs(nearest.y - unit.y);
            let s = 25 + g.getAIWeight('hgSeekPriority_v1');
            if (hgDist <= 4) s += 10;
            if (ws.phase === 'hg_losing') s += 15;
            goals.push({ x: nearest.x, y: nearest.y, score: s, reason: 'approach_hg' });
        }

        if (v.enemyTower && v.enemyTower.hp > 0) {
            goals.push({ x: v.enemyTower.x, y: v.enemyTower.y, score: 14, reason: 'default_siege' });
        }

        goals.push({
            x: Math.floor(g.bw() / 2),
            y: Math.floor(g.bh() / 2),
            score: 8, reason: 'explore',
        });

        // Hard difficulty's objective persona: scale win-condition intents so
        // pressing towers/zones/flags/hourglasses outbids another kill-trade.
        const _om = _aiDiff().objectiveMult;
        if (_om !== 1) {
            for (const c of goals) {
                if (_OBJECTIVE_INTENTS.has(c.reason)) c.score *= _om;
            }
        }

        let best = goals[0];
        for (const c of goals) {
            if (c.score > best.score) best = c;
        }
        unit._aiLastIntent = best.reason;   // debug: shows up in unit dumps
        return best;
    }

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
                    if (g.unitCanTraverse(unit, ax, ay)) {
                        goalSet.add(ax + ay * W);
                    }
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
        // Per-unit climb (2026-07-23): most units are jump 1 now — a kaiju
        // still models its 3-high stride. Falls back to the flat baseline.
        const _jumpH = (typeof g.getUnitJumpClimb === 'function')
            ? g.getUnitJumpClimb(unit) : (g.JUMP_HEIGHT ?? 1);
        // 👻 Spectral Passage: phasing units slide through blocking edges.
        const _phase = typeof unitIsPhasing === 'function' && unitIsPhasing(unit);

        const open = [{ x: unit.x, y: unit.y, f: Math.abs(unit.x - goalX) + Math.abs(unit.y - goalY) }];
        // Movement is 4-directional (cardinal only) — engine parity with
        // getMoveTiles/findMovePath, which dropped diagonal steps.
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

                if (_hasHeight && !_canFly) {
                    const curH = g.getHeightAt(cur.x, cur.y);
                    const nxH = g.getHeightAt(nx, ny);
                    const rise = nxH - curH;
                    const _aiNxtObj = (typeof g.getObjectAt === 'function') ? g.getObjectAt(nx, ny) : null;
                    const _aiNxtRw = _aiNxtObj && typeof OBJECT_RULES !== 'undefined' && OBJECT_RULES[_aiNxtObj]?.roofWalkable;
                    // 🏢 Roofs are lift-only now (Enter Building) — never path up
                    // onto one; the engine's getMoveTiles would reject the step.
                    if (_aiNxtRw && rise > _maxClimb) continue;
                    // Rising more than a jump is blocked; drops are unlimited.
                    if (rise > _jumpH) continue;
                }
                const ni = nx + ny * W;

                // Elevation is free (engine parity: getMoveTiles/findMovePath
                // no longer surcharge climbs — jump and movement are the same).
                const tentG = gScore[ci] + 1;
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
                    const tileH = tile.z ?? g.getHeightAt(tile.x, tile.y);
                    score += Math.min(tileH, 4) * AI_TUNE.moveRetreatHeight;
                }

                const threat = getThreatAt(v.threatMap, tile.x, tile.y);
                score -= threat.count * 24;
                score -= aiHazardPenaltyAt(unit, tile.x, tile.y) * 2;
                if ((unit._aiRecentTiles || []).includes(g.posKey(tile.x, tile.y))) score += g.getAIWeight('antiOscillationPen_v1');
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

        const curD = Math.abs(unit.x - wpX) + Math.abs(unit.y - wpY);
        let best = null, bestScore = -Infinity;
        const isRanged = (unit.range || 1) >= 2;
        for (const tile of moveTiles) {
            const d = Math.abs(tile.x - wpX) + Math.abs(tile.y - wpY);
            let score = (curD - d) * 10;

            const threat = getThreatAt(v.threatMap, tile.x, tile.y);
            score -= threat.count * 2;

            // Never path INTO hazard ground (pending blasts, fire, deep water).
            score -= aiHazardPenaltyAt(unit, tile.x, tile.y);

            let adjAllies = 0;
            for (const a of v.allies) {
                if (Math.abs(tile.x - a.x) + Math.abs(tile.y - a.y) <= 3) score += 2;
                if (Math.abs(tile.x - a.x) <= 1 && Math.abs(tile.y - a.y) <= 1) adjAllies++;
            }
            // Anti-cluster: a 2×2 pocket of three units is an AoE/mine magnet —
            // a single Crystal Ball cluster once triple-killed a camped back line.
            if (adjAllies >= 2) score -= 30;

            if (typeof g.getHeightAt === 'function') {
                const tileH = tile.z ?? g.getHeightAt(tile.x, tile.y);
                if (isRanged) {
                    score += Math.min(tileH, 4) * AI_TUNE.moveHighGroundRanged;
                } else {
                    score += Math.min(tileH, 4) * AI_TUNE.moveHighGroundMelee;
                }
            }

            if ((unit._aiRecentTiles || []).includes(g.posKey(tile.x, tile.y))) score += g.getAIWeight('antiOscillationPen_v1');

            if (score > bestScore) { bestScore = score; best = tile; }
        }
        return best;
    }

    function scoreInspect(unit, v, out) {
        const g = G();
        if ((unit.ap || 0) < g.AP_COST_ACTION) return;

        const unrevHG = (g.state.hourglasses || []).filter(h =>
            h.carriedBy === null && !h.visibleTo[unit.player]
        ).length;

        const allTiles = g.getInspectTiles(unit);
        if (allTiles.length === 0) return;

        const unscanned = allTiles.filter(t =>
            !g.state.scannedByPlayer[unit.player].has(g.scanKey(t.x, t.y))
        );

        const cx = Math.floor(g.bw() / 2), cy = Math.floor(g.bh() / 2);

        const pool = unscanned.length > 0 ? unscanned : allTiles;
        pool.sort((a, b) =>
            (Math.abs(a.x - cx) + Math.abs(a.y - cy)) - (Math.abs(b.x - cx) + Math.abs(b.y - cy))
        );

        let s = 3;
        if (unscanned.length > 0) s += 3;
        s += unrevHG * 4;
        if (v.winState.phase === 'hg_losing') s += 8;

        const ws = v.winState;
        if (ws.phase === 'tower_push' || ws.enemyDeadCount >= 1 || ws.roundUrgency >= 2) {
            s *= 0.3;
        }

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
                if (bestTile) out.push({ type: 'flair', x: bestTile.x, y: bestTile.y, score: 8 });
            }
        }

        if (g.unitHasWard(unit) && !unit._usedWard) {
            if (!(g.state.wards || []).some(w => w.x === unit.x && w.y === unit.y)) {
                out.push({ type: 'ward', x: unit.x, y: unit.y, score: 5 });
            }
        }
    }

    function scoreReshape(unit, v, out) {
        const g = G();
        const ap = unit.ap || 0;

        if (g.canFly(unit)) {
            scoreAltitude(unit, v, out);
            return;
        }

        const cfg = g.TERRAIN_RESHAPE_CONFIG;
        if (!cfg || ap < cfg.apCost) return;

        const canRaise = g.canReshapeTile(unit, 'raise');
        const canLower = g.canReshapeTile(unit, 'lower');
        if (!canRaise.ok && !canLower.ok) return;

        const myHeight = g.getUnitStandingHeight(unit);
        const effRange = g.getEffectiveRange(unit);
        const isRanged = effRange >= 2;

        const wRangedRaise = AI_TUNE.reshapeRangedRaise;
        const wPerEnemy = AI_TUNE.reshapePerEnemy;
        const wDefensive = AI_TUNE.reshapeDefensive;

        if (canRaise.ok) {
            let raiseScore = 0;

            if (isRanged && v.visibleEnemies.length > 0) {

                let advantageGain = 0;
                for (const e of v.visibleEnemies) {
                    const eHeight = g.getUnitStandingHeight(e);
                    const curAdv = myHeight - eHeight;
                    if (curAdv < 3) advantageGain++;
                }
                if (advantageGain > 0) {
                    raiseScore += wRangedRaise + advantageGain * wPerEnemy;
                }

                if ((unit.actionsThisTurn || 0) > 0) raiseScore *= 0.6;
            }

            if (!isRanged && v.closestEnemyDist <= 2) {
                raiseScore = 1;
            }

            if (v.closestEnemyDist <= 3 && v.attackTargets.length === 0) {
                raiseScore = Math.max(raiseScore, wDefensive);
            }

            const ws = v.winState;
            if (ws.phase === 'tower_push' || ws.roundUrgency >= 2) {
                raiseScore *= 0.2;
            }

            if (raiseScore > 0) {
                out.push({ type: 'reshape', mode: 'raise', score: raiseScore });
            }
        }

        if (canLower.ok) {
            let lowerScore = 0;

            if (!isRanged && v.visibleEnemies.length > 0) {

                lowerScore = 0;
            }

            let elevatedRangedThreats = 0;
            for (const e of v.visibleEnemies) {
                const eHeight = g.getUnitStandingHeight(e);
                const eRange = g.getEffectiveRange(e);
                if (eRange >= 2 && eHeight > myHeight) elevatedRangedThreats++;
            }
            if (elevatedRangedThreats > 0) {
                lowerScore = Math.max(lowerScore, 3 + elevatedRangedThreats * 2);
            }

            if (lowerScore > 0) {
                out.push({ type: 'reshape', mode: 'lower', score: lowerScore });
            }
        }
    }

    /* ── BUILD action scoring (2026-07-10) ────────────────────────────────
       The universal place/dig verb replaced the More-menu Raise/Lower rows
       and the single-block spells, so their tactics live here now:
       (a) pillar under self — ranged units buy high ground (1 block)
       (b) dig own tile — duck out of elevated ranged fire
       (c) erupt-shove — place under an adjacent enemy: crash + 1-tile shove,
           best when they land in a hazard or one of our traps
       (d) SOFTLOCK ESCAPE — stuck in a pit with no moves and no targets?
           Stack a block underfoot, or quarry an adjacent wall for the
           material to do it with. The AI can always dig itself out. */
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

        // Cheapest material we can place right now (bank is per-team).
        let placeTool = null;
        for (const k of Object.keys(g.BUILD_MATERIALS || {})) {
            if (g.canAffordMaterials(unit.player, { [k]: 1 })) { placeTool = k; break; }
        }

        const wRangedRaise = AI_TUNE.reshapeRangedRaise;
        const wPerEnemy = AI_TUNE.reshapePerEnemy;
        const wDefensive = AI_TUNE.reshapeDefensive;

        // (a) pillar under self — the old reshape-raise play, now 1 block
        if (placeTool && !g._buildProblem(unit, placeTool, unit.x, unit.y)) {
            let raiseScore = 0;
            if (isRanged && v.visibleEnemies.length > 0) {
                let advantageGain = 0;
                for (const e of v.visibleEnemies) {
                    if (myHeight - g.getUnitStandingHeight(e) < 3) advantageGain++;
                }
                if (advantageGain > 0) raiseScore += wRangedRaise + advantageGain * wPerEnemy;
                if ((unit.actionsThisTurn || 0) > 0) raiseScore *= 0.6;
            }
            if (v.closestEnemyDist <= 3 && v.attackTargets.length === 0) {
                raiseScore = Math.max(raiseScore, wDefensive);
            }
            const ws = v.winState;
            if (ws.phase === 'tower_push' || ws.roundUrgency >= 2) raiseScore *= 0.2;
            if (raiseScore > 0) out.push({ type: 'build', tool: placeTool, x: unit.x, y: unit.y, score: raiseScore });
        }

        // (b) dig own tile — drop out of an elevated sniper's line
        if (!g._buildProblem(unit, 'dig', unit.x, unit.y)) {
            let elevatedRangedThreats = 0;
            for (const e of v.visibleEnemies) {
                if (g.getEffectiveRange(e) >= 2 && g.getUnitStandingHeight(e) > myHeight) elevatedRangedThreats++;
            }
            if (elevatedRangedThreats > 0) {
                out.push({ type: 'build', tool: 'dig', x: unit.x, y: unit.y, score: 3 + elevatedRangedThreats * 2 });
            }
        }

        // (c) erupt-shove an adjacent enemy (crash + shove; hazard landings pay)
        if (placeTool) {
            for (const e of v.visibleEnemies) {
                if (Math.max(Math.abs(e.x - unit.x), Math.abs(e.y - unit.y)) > (cfg.reach || 1)) continue;
                const info = {};
                if (g._buildProblem(unit, placeTool, e.x, e.y, info)) continue;
                if (!info.shoveTo) continue;
                let sc = 10;
                const destT = g.getTerrainAt(info.shoveTo.x, info.shoveTo.y);
                if (destT === 'lava' || destT === 'deep_water' || destT === 'chasm' || destT === 'void') sc += 25;
                else if (destT === 'water' || String(destT || '').indexOf('poison') === 0) sc += 8;
                if ((g.state.traps || []).some(t => t.x === info.shoveTo.x && t.y === info.shoveTo.y && t.owner === unit.player)) sc += 20;
                out.push({ type: 'build', tool: placeTool, x: e.x, y: e.y, score: sc });
            }
        }

        // (d) softlock escape — no moves, nothing to hit: build/dig out
        const stuck = v.attackTargets.length === 0
            && typeof g.getMoveTiles === 'function' && g.getMoveTiles(unit).length === 0;
        if (stuck) {
            if (placeTool && !g._buildProblem(unit, placeTool, unit.x, unit.y)) {
                out.push({ type: 'build', tool: placeTool, x: unit.x, y: unit.y, score: 40 });
            } else {
                for (let dy = -1; dy <= 1 && stuck; dy++) {
                    let pushed = false;
                    for (let dx = -1; dx <= 1; dx++) {
                        if (!dx && !dy) continue;
                        const nx = unit.x + dx, ny = unit.y + dy;
                        if (!g._buildProblem(unit, 'dig', nx, ny)) {
                            out.push({ type: 'build', tool: 'dig', x: nx, y: ny, score: 38 });
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
        /* Air-gap aware: under a bridge / inside a building the reference floor
           is the one beneath THIS unit, not the top of the column. */
        const groundZ = (typeof g.getFloorBelowZ === 'function')
            ? g.getFloorBelowZ(unit.x, unit.y, myZ) : g.getHeightAt(unit.x, unit.y);
        const altAboveGround = myZ - groundZ;
        const effRange = g.getEffectiveRange(unit);
        const isRanged = effRange >= 2;
        const isAirborne = typeof g.isUnitAirborne === 'function' && g.isUnitAirborne(unit);

        if (canAscend.ok) {
            let ascendScore = 0;

            if (isRanged && v.visibleEnemies.length > 0) {
                let advantageGain = 0;
                for (const e of v.visibleEnemies) {
                    const eZ = g.getUnitStandingHeight(e);
                    if (myZ - eZ < 3) advantageGain++;
                }
                if (advantageGain > 0) {
                    ascendScore += AI_TUNE.flyRangedHeightBonus + advantageGain * 3;
                }
            }

            if (v.closestEnemyDist <= 2 && altAboveGround < 3) {
                ascendScore = Math.max(ascendScore, AI_TUNE.flyEscapeMeleeBonus);
            }

            if (!isAirborne && isRanged && v.visibleEnemies.length > 0 && v.closestEnemyDist <= 4) {
                ascendScore = Math.max(ascendScore, AI_TUNE.flyEscapeMeleeBonus * 0.7);
            }

            const ws = v.winState;
            if (ws.phase === 'tower_push' || ws.roundUrgency >= 2) {
                ascendScore *= 0.2;
            }

            if (ascendScore > 0) {
                out.push({ type: 'altitude', mode: 'ascend', score: ascendScore });
            }
        }

        if (canDescend.ok) {
            let descendScore = 0;

            if (!isRanged && v.closestEnemyDist <= 3 && isAirborne) {

                descendScore = v.closestEnemyDist <= 1 ? 18 : (v.closestEnemyDist <= 2 ? 14 : 10);
            }

            if (isAirborne && (unit.hp < unit.maxHp * 0.4) && (unit.items?.healPotion > 0)) {
                descendScore = Math.max(descendScore, 12);
            }

            if (v.visibleEnemies.length === 0 && altAboveGround > 3) {
                descendScore = Math.max(descendScore, 3);
            }

            if (isAirborne && (unit.gold || 0) >= 20) {
                const sides = g.state.sides;
                if (sides) {
                    const s = sides[unit.player];
                    if (s && unit.x === s.shopX && unit.y === s.shopY) {
                        descendScore = Math.max(descendScore, 10);
                    }
                }
            }

            if (descendScore > 0) {
                out.push({ type: 'altitude', mode: 'land', score: descendScore });
            }
        }
    }

    // Full Entropy Gauge = fire the team attack. It hits every visible enemy
    // for massive damage and the gauge is use-it-or-bank-nothing, so it
    // outranks almost anything once available; more targets, higher score.
    function scoreEntropyStrike(unit, v, out) {
        const g = G();
        if (typeof g.canUseEntropyStrike !== 'function' || !g.canUseEntropyStrike(unit)) return;
        const targets = (typeof g.getEntropyStrikeTargets === 'function') ? g.getEntropyStrikeTargets(unit) : [];
        if (!targets.length) return;
        out.push({ type: 'entropyStrike', score: 200 + targets.length * 40 });
    }

    function scoreGuard(unit, v, out) {
        const g = G();
        const ap = unit.ap || 0;
        if (ap < 1) return;

        let score = 0;

        if (v.closestEnemyDist <= 3 && v.closestEnemyDist < Infinity && v.attackTargets.length === 0) {
            score = 12;
        }

        if (unit.cls === 'Tank') score += 10;
        else if (unit.cls === 'Warrior') score += 5;
        if ((unit.def || 0) >= 10) score += 5;
        if ((unit.mdef || 0) >= 10) score += 3;

        if (ap === 1 && v.closestEnemyDist <= 3 && v.closestEnemyDist < Infinity) {
            score += 15;
        }

        if ((unit.hourglasses || 0) > 0 && v.closestEnemyDist <= 4) {
            score += 12;
        }

        if (v.ownTower && v.ownTower.hp > 0) {
            const dToTower = Math.abs(unit.x - v.ownTower.x) + Math.abs(unit.y - v.ownTower.y);
            if (dToTower <= 2 && v.closestEnemyDist <= 4) score += 10;
        }

        if (v.closestEnemyDist > 5) score = Math.min(score, 3);

        const ws = v.winState;
        if (ws.phase === 'tower_push' || ws.phase === 'numbers_advantage' || ws.enemyDeadCount >= 1) {
            score *= 0.3;
        }
        if (ws.roundUrgency >= 2) score *= 0.5;

        if (score > 0) out.push({ type: 'guard', score });
    }

    /* Arena spawn nexuses carry a `tiles` footprint instead of a square rect —
       mirror ui.js nexusZoneContains so the AI stands on the right tiles. */
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
                const inZone = _aiNexContains(nex, unit.x, unit.y);
                if (!inZone) return 0;

                const channelCost = typeof NEXUS_CHANNEL_COST_AP !== 'undefined' ? NEXUS_CHANNEL_COST_AP : 1;
                const landCost = g.FLYING_ALTITUDE_CONFIG?.apCost || 1;
                if ((unit.ap || 0) < landCost + channelCost) return 0;
                return AI_TUNE.landToChannelBonus;
            };
            let landScore = 0;
            for (const nexKey of Object.keys(g.state.nexusPoints)) {
                const nex = g.state.nexusPoints[nexKey];
                landScore = Math.max(landScore, _checkNexusLand(nex));
            }

            if (g.state.roamingNexus) {
                landScore = Math.max(landScore, _checkNexusLand(g.state.roamingNexus));
            }
            if (landScore > 0 && typeof g.canChangeAltitude === 'function') {
                const canLand = g.canChangeAltitude(unit, 'land');
                if (canLand?.ok) {
                    out.push({ type: 'altitude', mode: 'land', score: landScore });
                }
            }
            return;
        }

        let nexKey = null;
        let nex = null;
        for (const k of Object.keys(g.state.nexusPoints)) {
            const n = g.state.nexusPoints[k];
            if (!n || !n.zoneSize) continue;

            const distX = Math.abs(unit.x - (n.zoneX + Math.floor(n.zoneSize / 2)));
            const distY = Math.abs(unit.y - (n.zoneY + Math.floor(n.zoneSize / 2)));
            if (distX + distY <= n.zoneSize + 3) {
                nexKey = k;
                nex = n;
                break;
            }
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
            let score = g.getAIWeight('nexusCapBonus_v1');
            const mpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
            // Arena values a channel like domination does — zone control is core
            // scoring there (per-round points, late-game surge, dominance win).
            if (mpMode && (mpMode.id === 'domination' || mpMode.id === 'arena')) score += 25;
            if (mpMode && mpMode.id === 'arena') {
                const _zoneList = Object.values(g.state.nexusPoints).filter(n => n && n.zoneSize);
                if (_zoneList.length >= 3) {
                    const _enemyP = unit.player === 1 ? 2 : 1;
                    // Capturing our final missing zone = instant win. Channel like it.
                    if (ownedCount === _zoneList.length - 1) score += 45;
                    // Enemy is one zone from winning — flipping/neutralizing is urgent.
                    if (_zoneList.filter(n => n.owner === _enemyP).length >= _zoneList.length - 1) score += 30;
                }
            }
            const myProg = unit.player === 1 ? Math.max(0, nex.progress) : Math.max(0, -nex.progress);
            const threshold = typeof NEXUS_CAPTURE_THRESHOLD !== 'undefined' ? NEXUS_CAPTURE_THRESHOLD : 6;
            if (myProg >= threshold - 2) score += 15;
            if (myProg >= threshold - 1) score += 12;
            if (v.closestEnemyDist <= 2) score -= 10;
            if (ownedCount === 0) score += 10;

            score += ownedCount * 6;
            score *= nexusPenalty;
            if (score > 0) out.push({ type: 'nexus_channel', score });
        }

        if (!inZone && distToCenter <= (g.getEffectiveMove?.(unit) || unit.move || 4) + 2 && nex.owner !== unit.player
            && v.visibleEnemies.length === 0 && !_skipMove && g.canUnitMove(unit)) {
            let score = 14;
            if (ownedCount === 0) score += 6;
            score += ownedCount * 3;
            if ((unit.hourglasses || 0) > 0) score -= 8;
            score *= nexusPenalty;
            const tgtX = Math.max(nex.zoneX, Math.min(nex.zoneX + nex.zoneSize - 1, unit.x));
            const tgtY = Math.max(nex.zoneY, Math.min(nex.zoneY + nex.zoneSize - 1, unit.y));
            // Snap to an actually-reachable tile. Pushing the raw clamped coord can
            // hand doMove a tile that isn't in getMoveTiles (out of range / blocked),
            // which it refuses — the unit then makes no move, no progress, and the AI
            // loop spins until the stall safety-net force-ends the turn (wasting AP).
            const moveTiles = g.getMoveTiles(unit);
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
                let score = 50;
                const myProg = unit.player === 1 ? Math.max(0, rn.progress) : Math.max(0, -rn.progress);
                const threshold = typeof NEXUS_CAPTURE_THRESHOLD !== 'undefined' ? NEXUS_CAPTURE_THRESHOLD : 6;
                if (myProg >= threshold - 2) score += 20;
                if (v.closestEnemyDist <= 2) score -= 10;
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

        /* Consider recall when low HP or MP */
        if (hpPct >= 0.4 && mpPct >= 0.3) return;

        /* Don't recall if already in own spawn zone */
        if (typeof isInSpawnZone === 'function' && isInSpawnZone(unit.x, unit.y, unit.player)) return;

        /* Recall only works while hidden from the enemy — don't even consider it
           while spotted (doRecall would refuse anyway). */
        if (typeof isUnitSeenByAnyEnemy === 'function' && isUnitSeenByAnyEnemy(unit)) return;

        let score = AI_TUNE.recallBonus + (1 - hpPct) * 25;
        if (mpPct < 0.2) score += 10;

        /* Penalty if enemies are near (don't recall in the middle of a fight unless desperate) */
        if (v.closestEnemyDist <= 2) {
            if (hpPct > 0.2) score -= 15;
        }

        const ws = v.winState;
        if (ws.phase === 'tower_push' || ws.enemyDeadCount >= 1) score *= 0.4;

        if (score > 0) out.push({ type: 'recall', score });
    }

    // 🗺️ Best elemental TILE target for a damage spell (HM-style casts): scans
    // tiles in cast range for element-reactive terrain and scores by how many
    // enemies the reaction would actually reach (lightning→connected water
    // body, fire→enemies near the ignition point). Returns {x,y,_elemTile} or
    // null when no tile is worth the MP.
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
                    // torching the ground near enemies has delayed payoff
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

    // Re-aim a line/linePush spell at CAST time (the AI decides ~400ms before
    // doSpell runs; in blitz the intended target can move in that window, and
    // the engine fires the beam in sign(target-caster) direction — a stale
    // tile means a misaligned beam that hits nobody). Walks the 8 rays from
    // the caster's CURRENT position over CURRENT enemy positions and returns
    // the best aim tile, or null when every ray whiffs (don't waste the AP).
    // Exposed on window so ainew.js's focus-fire path can share it.
    function _reaimLineSpell(unit, spell, preferredTargetId) {
        const g = G();
        if (!g) return null;
        const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
                      { dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }];
        const len = spell.range || 4;   // beams are range-capped (matches _applyLineDamage)
        const enemies = g.getHostileUnits(unit.player).filter(e => !e.dead &&
            !(g.unitHasStatus(e, 'invisible') && !g.unitHasStatus(e, 'marked')));
        let best = null;
        for (const dir of dirs) {
            let hits = 0, first = null, hasPreferred = false;
            for (let i = 1; i <= len; i++) {
                const tx = unit.x + dir.dx * i, ty = unit.y + dir.dy * i;
                if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) break;
                if (typeof g.isTerrainPassable === 'function' && !g.isTerrainPassable(tx, ty) && !spell.destroysObstacles) break;
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

    function findSpellTarget(unit, spell, v) {
        const g = G();
        const kind = spell.kind;

        if (['damage', 'ricochet', 'debuff', 'multiHit', 'lifeDrain'].includes(kind)) {
            const _aiEffSpellRange = _effRange(unit, spell);
            const inRange = v.visibleEnemies
                .map(e => ({
                    enemy: e,
                    dist: Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y),
                    priority: getTargetPriority(e, unit, v)
                }))
                .filter(e => e.dist >= 1 && e.dist <= _aiEffSpellRange && (spell.ignoresLineOfSight || !g.isRangeBlockedByTerrain(unit.x, unit.y, e.enemy.x, e.enemy.y)));
            // 🗺️ Elemental tile cast fallback: no enemy in direct range, but a
            // reactive tile might still reach them — bolt the pool an enemy is
            // wading in (the conduction hits beyond cast range), or torch the
            // brush at their feet.
            if (!inRange.length) return kind === 'damage' ? _elementalTileFallback(unit, spell, v) : null;

            if (['damage', 'ricochet', 'multiHit', 'lifeDrain'].includes(kind)) {
                const dmg = spell.dmg || 112;
                const typedDmg = inRange.map(e => ({
                    ...e,
                    effDmg: dmg * getTypeMultiplier(unit, e.enemy)
                }));

                const killable = typedDmg.filter(e => _aiKillHp(e.enemy, unit) <= e.effDmg + 3);
                if (killable.length > 0) {
                    killable.sort((a, b) => b.priority - a.priority);
                    return killable[0].enemy;
                }
            }

            inRange.sort((a, b) => b.priority - a.priority);
            return inRange[0].enemy;
        }

        if (kind === 'aoe') {

            if (spell.aoeOriginSelf) {
                const area = getSpellAoeAreaAI(spell, unit.x, unit.y);
                const hits = area.filter(t => v.visibleEnemies.some(en => en.x === t.x && en.y === t.y)).length;
                return hits > 0 ? { x: unit.x, y: unit.y } : null;
            }
            let best = null, bestScore = 0;
            for (const e of v.visibleEnemies) {
                const d = g.combatDist ? g.combatDist(e.x, e.y, e.z ?? 0, unit.x, unit.y, unit.z ?? 0) : (Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y));
                if (d < 1 || d > _effRange(unit, spell)) continue;
                if (g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y)) continue;
                const area = getSpellAoeAreaAI(spell, e.x, e.y);
                const hits = area.filter(t => v.visibleEnemies.some(en => en.x === t.x && en.y === t.y)).length;
                const allyHits = area.filter(t => v.allies.some(a => a.x === t.x && a.y === t.y) || (unit.x === t.x && unit.y === t.y)).length;
                const score = hits * 10 - allyHits * 15;
                if (score > bestScore) { bestScore = score; best = e; }
            }
            return best;
        }

        if (kind === 'deployTurret') {
            const active = (g.state.turrets || []).filter(t => t.ownerUnitId === unit.id).length;
            const maxActive = spell.maxActivePerCaster || 2;
            if (active >= maxActive) return null;

            let bestTile = null, bestScore = -1;
            for (let dy = -(_effRange(unit, spell) || 2); dy <= (_effRange(unit, spell) || 2); dy++) {
                for (let dx = -(_effRange(unit, spell) || 2); dx <= (_effRange(unit, spell) || 2); dx++) {
                    const tx = unit.x + dx, ty = unit.y + dy;
                    const d = Math.abs(dx) + Math.abs(dy);
                    if (d < 1 || d > (_effRange(unit, spell) || 2)) continue;
                    if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) continue;

                    const terrain = g.getTerrainAt(tx, ty);
                    const rule = g.getTerrainRule(terrain);
                    if (rule.impassable || terrain === 'mountain' || terrain === 'lava') continue;
                    const occupied = g.state.units.some(u => !u.dead && u.x === tx && u.y === ty);
                    if (occupied) continue;

                    const turretOnTile = (g.state.turrets || []).some(t => t.x === tx && t.y === ty);
                    if (turretOnTile) continue;

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
                        const d = g.combatDist ? g.combatDist(e.x, e.y, e.z ?? 0, unit.x, unit.y, unit.z ?? 0) : (Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y));
                        return d >= 2 && d <= (_effRange(unit, spell) || 3);
                    })
                    .sort((a, b) => getTargetPriority(b, unit, v) - getTargetPriority(a, unit, v));
                return inRange[0] || null;
            }

            if (sid === 'plunder' || sid === 'racePlunder') {
                const adjacent = v.visibleEnemies.filter(e => {
                    const d = g.combatDist ? g.combatDist(e.x, e.y, e.z ?? 0, unit.x, unit.y, unit.z ?? 0) : (Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y));
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
            // Any unconsumed corpse in range — either side's remains will do.
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
            // The engine rejects duplicate seeds per tile, and a tile that
            // already grew a tree is blocked — pick clean ground or skip.
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

                // Stat-aware buffing: an INT buff (Harmonize, Ki attunements…)
                // belongs on a caster, an ATK buff on the biggest hitter —
                // not on whoever happens to have the lowest HP bar.
                const boost = spell.statStageBoost || {};
                const casterClasses = ['Black Mage', 'White Mage', 'Psychic', 'Harbinger', 'Harvester'];
                const fit = a => {
                    let sc = 0;
                    if (boost.int) sc += (a.intStat || 0) * 2 + (casterClasses.includes(a.cls) ? 80 : 0);
                    if (boost.atk) sc += (a.atk || 0) * 1.5 + (g.getEffectiveRange(a) <= 1 ? 20 : 0);
                    if (!boost.int && !boost.atk) sc += (1 - a.hp / a.maxHp) * 100;
                    if ((a.hourglasses || 0) > 0) sc += 40;
                    if (a.id === unit.id) sc -= 10; // mildly prefer teammates
                    return sc;
                };
                return unbuffed.sort((a, b) => fit(b) - fit(a))[0] || null;
            }
            return targets.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0] || null;
        }

        if (kind === 'bomb' || kind === 'warpRune') {
            const _bwEffRange = _effRange(unit, spell);
            const inRange = v.visibleEnemies.filter(e => {
                const d = g.combatDist ? g.combatDist(e.x, e.y, e.z ?? 0, unit.x, unit.y, unit.z ?? 0) : (Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y));
                return d >= 1 && d <= _bwEffRange && (spell.ignoresLineOfSight || !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y));
            });

            return inRange.sort((a, b) => getTargetPriority(b, unit, v) - getTargetPriority(a, unit, v))[0] || null;
        }

        // ── Terraforming kinds (2026-07-07) — tile pickers ──
        if (kind === 'placeTrap') {
            // Traps need an EMPTY tile; pick the free tile in range closest to
            // the most enemies (choke seeding, not random scatter).
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
            // Prefer an empty in-range tile that lines up (same row/col) with an
            // existing prism and sits near enemies — that forms a live beam.
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
            // Option A: erupt under an enemy in range (crash + shove). Strongly
            // preferred when the shove landing is a hazard or one of our traps.
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
            // Option B: raise a pillar under an allied backliner (high ground).
            const backline = [unit, ...(v.allies || [])]
                .filter(a => !a.dead && ['Sniper', 'Gunslinger', 'Black Mage'].includes(a.cls))
                .filter(a => Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= R);
            // Shove wins when it has real payoff (hazard/trap landing), else pillar.
            if (bestShove && bestShoveS >= 25) return bestShove;
            if (backline.length) return { x: backline[0].x, y: backline[0].y };
            return bestShove;
        }

        if (kind === 'buildStructure') {
            const R = _effRange(unit, spell) || 3;
            if (spell.structure === 'bridgeSpan') {
                // Needs a gap: nearest water/chasm tile in range.
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
            // Watchtower / steps: a free tile beside us, toward the enemy.
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

            allies.sort((a, b) => {
                const aVal = ['Black Mage', 'Warrior', 'Gunslinger', 'Sniper'].includes(a.cls) ? 10 : 0;
                const bVal = ['Black Mage', 'Warrior', 'Gunslinger', 'Sniper'].includes(b.cls) ? 10 : 0;
                return (bVal + (b.atk || 0)) - (aVal + (a.atk || 0));
            });
            return allies[0] || null;
        }

        if (kind === 'teleport') {
            // doSpell teleports the CASTER to the clicked tile, which must be
            // an EMPTY passable tile in range. (Previously this returned an
            // enemy UNIT near our tower — doSpell rejected the occupied tile
            // every time, so AI teleports never fired.)
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
                        // escape: maximize distance to the closest enemy
                        let nd = Infinity;
                        for (const e of v.visibleEnemies) nd = Math.min(nd, Math.abs(e.x - tx) + Math.abs(e.y - ty));
                        val = nd * 10;
                        for (const a of v.allies) if (Math.abs(a.x - tx) + Math.abs(a.y - ty) <= 3) val += 6;
                    } else {
                        // engage: land in strike range of the juiciest reachable enemy
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
        if (kind === 'scan') return { x: unit.x, y: unit.y };

        if (kind === 'line' || kind === 'linePush') {

            const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
                          { dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }];
            const _lineBoardLen = spell.range || 4;   // beams are range-capped (matches _applyLineDamage)
            let bestDir = null, bestHits = 0, bestTarget = null;
            for (const dir of dirs) {
                let hits = 0, firstEnemy = null;
                for (let i = 1; i <= _lineBoardLen; i++) {
                    const tx = unit.x + dir.dx * i, ty = unit.y + dir.dy * i;
                    if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) break;
                    if (typeof g.isTerrainPassable === 'function' && !g.isTerrainPassable(tx, ty) && !spell.destroysObstacles) break;
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
            // diamond: true (Resonance Pulse) = full Manhattan diamond footprint;
            // diagonal: true (Crossfire / Arcane Sigil) = X arms.
            const _crossFootprint = (cx, cy, r) => {
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
            };
            if (spell.aoeOriginSelf) {
                const r = spell.crossRadius || 1;
                const crossTiles = _crossFootprint(unit.x, unit.y, r);
                const hits = crossTiles.filter(t => v.visibleEnemies.some(e => e.x === t.x && e.y === t.y)).length;
                return hits > 0 ? { x: unit.x, y: unit.y } : null;
            }

            let best = null, bestScore = 0;
            const _crossEffRange = _effRange(unit, spell);
            for (const e of v.visibleEnemies) {
                const d = g.combatDist ? g.combatDist(e.x, e.y, e.z ?? 0, unit.x, unit.y, unit.z ?? 0) : (Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y));
                if (d < 1 || d > _crossEffRange) continue;
                if (!spell.ignoresLineOfSight && g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y)) continue;
                const r = spell.crossRadius || 1;
                const crossTiles = _crossFootprint(e.x, e.y, r);
                const hits = crossTiles.filter(t => v.visibleEnemies.some(en => en.x === t.x && en.y === t.y)).length;
                const allyHits = crossTiles.filter(t => v.allies.some(a => a.x === t.x && a.y === t.y)).length;
                const score = hits * 10 - allyHits * 15;
                if (score > bestScore) { bestScore = score; best = e; }
            }
            return best;
        }

        if (kind === 'pull') {
            const inRange = v.visibleEnemies
                .filter(e => {
                    const d = g.combatDist ? g.combatDist(e.x, e.y, e.z ?? 0, unit.x, unit.y, unit.z ?? 0) : (Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y));
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
                    const d = g.combatDist ? g.combatDist(e.x, e.y, e.z ?? 0, unit.x, unit.y, unit.z ?? 0) : (Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y));
                    return d >= 1 && d <= (_effRange(unit, spell) || 4);
                })
                .filter(e => !spell.requiresLineOfSight || !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y))
                .sort((a, b) => getTargetPriority(b, unit, v) - getTargetPriority(a, unit, v));
            return inRange[0] || null;
        }

        if (kind === 'escape') {
            return { x: unit.x, y: unit.y };
        }

        if (kind === 'selfHeal') {
            return { x: unit.x, y: unit.y };
        }

        if (kind === 'aoePull') {
            let best = null, bestScore = 0;
            const _apEffRange = _effRange(unit, spell);
            for (const e of v.visibleEnemies) {
                const d = g.combatDist ? g.combatDist(e.x, e.y, e.z ?? 0, unit.x, unit.y, unit.z ?? 0) : (Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y));
                if (d < 1 || d > _apEffRange) continue;
                if (!spell.ignoresLineOfSight && g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y)) continue;
                const area = getSquareArea(e.x, e.y, spell.aoeRadius || 1);
                const hits = area.filter(t => v.visibleEnemies.some(en => en.x === t.x && en.y === t.y)).length;
                const allyHits = area.filter(t =>
                    v.allies.some(a => a.x === t.x && a.y === t.y) || (unit.x === t.x && unit.y === t.y)
                ).length;
                const score = hits * 10 - allyHits * 15;
                if (score > bestScore) { bestScore = score; best = e; }
            }
            return best;
        }

        if (kind === 'splitBeam') {
            const _sbEffRange = _effRange(unit, spell);
            const inRange = v.visibleEnemies
                .filter(e => {
                    const d = g.combatDist ? g.combatDist(e.x, e.y, e.z ?? 0, unit.x, unit.y, unit.z ?? 0) : (Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y));
                    return d >= 1 && d <= _sbEffRange && (spell.ignoresLineOfSight || !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y));
                })
                .sort((a, b) => {

                    const aNear = v.visibleEnemies.filter(e2 =>
                        e2.id !== a.id && Math.abs(e2.x - a.x) + Math.abs(e2.y - a.y) <= (spell.splitRadius || 2)
                    ).length;
                    const bNear = v.visibleEnemies.filter(e2 =>
                        e2.id !== b.id && Math.abs(e2.x - b.x) + Math.abs(e2.y - b.y) <= (spell.splitRadius || 2)
                    ).length;
                    return (bNear * 10 + getTargetPriority(b, unit, v)) - (aNear * 10 + getTargetPriority(a, unit, v));
                });
            return inRange[0] || null;
        }

        if (kind === 'delayed') {
            let best = null, bestScore = 0;
            for (const e of v.visibleEnemies) {
                const d = g.combatDist ? g.combatDist(e.x, e.y, e.z ?? 0, unit.x, unit.y, unit.z ?? 0) : (Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y));
                if (d < 1 || d > _effRange(unit, spell)) continue;
                const area = getSquareArea(e.x, e.y, spell.aoeRadius || 1);
                const hits = area.filter(t => v.visibleEnemies.some(en => en.x === t.x && en.y === t.y)).length;
                if (hits > bestScore) { bestScore = hits; best = e; }
            }
            return best;
        }

        if (kind === 'deployObject') {
            const active = (g.state._deployedObjects || []).filter(o => o.ownerUnitId === unit.id).length;
            if (active >= (spell.maxActivePerCaster || 2)) return null;
            let bestTile = null, bestScore = -1;
            for (let dy = -(_effRange(unit, spell) || 1); dy <= (_effRange(unit, spell) || 1); dy++) {
                for (let dx = -(_effRange(unit, spell) || 1); dx <= (_effRange(unit, spell) || 1); dx++) {
                    const tx = unit.x + dx, ty = unit.y + dy;
                    const d = Math.abs(dx) + Math.abs(dy);
                    if (d < 1 || d > (_effRange(unit, spell) || 1)) continue;
                    if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) continue;
                    const terrain = g.getTerrainAt(tx, ty);
                    const rule = g.getTerrainRule(terrain);
                    if (rule.impassable) continue;
                    const occupied = g.state.units.some(u => !u.dead && u.x === tx && u.y === ty);
                    if (occupied) continue;
                    let score = 5;

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
            const active = (g.state._gatePairs || []).filter(gp => gp.ownerUnitId === unit.id).length;
            if (active >= (spell.maxActivePerCaster || 1)) return null;

            let bestTile = null, bestScore = -1;
            for (let dy = -(_effRange(unit, spell) || 4); dy <= (_effRange(unit, spell) || 4); dy++) {
                for (let dx = -(_effRange(unit, spell) || 4); dx <= (_effRange(unit, spell) || 4); dx++) {
                    const tx = unit.x + dx, ty = unit.y + dy;
                    const d = Math.abs(dx) + Math.abs(dy);
                    if (d < 1 || d > (_effRange(unit, spell) || 4)) continue;
                    if (tx < 0 || ty < 0 || tx >= g.bw() || ty >= g.bh()) continue;
                    const occupied = g.state.units.some(u => !u.dead && u.x === tx && u.y === ty);
                    if (occupied) continue;
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
                !a.dead && Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) <= (_effRange(unit, spell) || 3)
            );
            for (const c of candidates) {
                const area = getSquareArea(c.x, c.y, spell.aoeRadius || 1);
                const count = [unit, ...v.allies].filter(a =>
                    !a.dead && area.some(t => t.x === a.x && t.y === a.y)
                ).length;
                if (count > bestAllies) { bestAllies = count; best = c; }
            }
            return best;
        }

        if (kind === 'zoneDebuff') {
            // 🌫 Low Gravity aims at the team's own cluster (it's a friendly
            // mobility field) — reuse the zoneHeal-style ally-center pick.
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
                const d = g.combatDist ? g.combatDist(e.x, e.y, e.z ?? 0, unit.x, unit.y, unit.z ?? 0) : (Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y));
                if (d < 1 || d > (_effRange(unit, spell) || 4)) continue;
                const area = getSquareArea(e.x, e.y, spell.aoeRadius || 1);
                let hits = area.filter(t => v.visibleEnemies.some(en => en.x === t.x && en.y === t.y)).length;
                // 🕳 Gravity Crush prefers centers that trap flyers.
                if (spell.gravityField === 'super' && typeof g.canFly === 'function'
                    && g.canFly(e)) hits += 3;
                const allyHits = area.filter(t => v.allies.some(a => a.x === t.x && a.y === t.y)).length;
                const score = hits * 10 - allyHits * 8;
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
            for (let dy = -(_effRange(unit, spell) || 3); dy <= (_effRange(unit, spell) || 3); dy++) {
                for (let dx = -(_effRange(unit, spell) || 3); dx <= (_effRange(unit, spell) || 3); dx++) {
                    const tx = unit.x + dx, ty = unit.y + dy;
                    const d = Math.abs(dx) + Math.abs(dy);
                    if (d < 1 || d > (_effRange(unit, spell) || 3)) continue;
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
                        ['stun', 'silence', 'slow', 'poison', 'burn', 'stagger', 'marked', 'discord', 'jammed', 'glare'].includes(e.id)
                    ).length
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
                        if (victim) {
                            hits++;
                            hitPriority += getTargetPriority(victim, unit, v);
                        }
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
                    const d = g.combatDist ? g.combatDist(e.x, e.y, e.z ?? 0, unit.x, unit.y, unit.z ?? 0) : (Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y));
                    return d >= 1 && d <= (_effRange(unit, spell) || 3) && !g.isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y);
                })
                .sort((a, b) => getTargetPriority(b, unit, v) - getTargetPriority(a, unit, v));
            return inRange[0] || null;
        }

        return null;
    }

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
                const STATUS_DEFS = g.STATUS_DEFS || {};
                let hasDebuff = false;
                for (const key of Object.keys(unit.status)) {
                    if (STATUS_DEFS[key]?.kind === 'debuff') { hasDebuff = true; break; }
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
                    if (STATUS_DEFS[key]?.kind === 'debuff') {
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

                const terrain = g.state.boardTerrain;
                const tileType = terrain?.[wy]?.[wx];
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

                    if (action.spell.kind === 'skyThrow') {
                        const grabDelay = g.doSpell(unit, action.target.x, action.target.y) || 0;

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
                    // cast time — the target may have moved during the telegraph
                    // delay, and a misaligned beam hits nobody.
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
                        // doMove refused this destination (no moves left, rooted, or the
                        // chosen tile wasn't actually reachable). Stop proposing moves for
                        // the rest of this unit's turn so the AI spends its remaining AP on
                        // a real action (attack/spell/guard) instead of re-picking a move
                        // the engine keeps rejecting — which is what trips the stall net.
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
                // Universal place/dig verb. A Mason's Gauntlets charge makes a
                // successful op FREE (no AP drop), so gauge success on the
                // charge counter too — never the reshape-style AP check alone,
                // or the loop-breaker would zero the builder's turn.
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

    function getSquareArea(cx, cy, radius) {
        const tiles = [];
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                tiles.push({ x: cx + dx, y: cy + dy });
            }
        }
        return tiles;
    }

    // 2026-07-17 shape pass — AI mirrors of battle.js getRoundArea /
    // getSpellAoeArea (local copies on purpose, like getSquareArea above).
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
        return getSquareArea(cx, cy, r);
    }

    /* ── SIMUL MODE planner exports (battle.js SimulEngine) ──────────────
       Simul mode needs the AI's PLANNING half without its EXECUTION half:
       score one unit's candidate actions from the current board without
       touching state, so both sides' orders can be committed blind and then
       resolved together. gatherCandidates is already pure — this wrapper
       just resets the per-turn module state that aiTakeTurn normally resets
       on its first loop (failed-action memory, skip flags, action log) so a
       planning pass never inherits stale bookkeeping from a previous unit. */
    window._aiPlanCandidates = function (unit) {
        if (!unit || unit.dead) return [];
        _failedSpells = new Set();
        _failedCombos = new Set();
        _skipAttack = false;
        _skipTowerAttack = false;
        _skipMove = false;
        _failedNexus = false;
        _aiLastRecallFailed = false;
        _failedItems = new Set();
        _turnActionLog = [];
        try {
            const vision = buildVision(unit);
            const cands = gatherCandidates(unit, vision) || [];
            return cands.slice().sort((a, b) => (b.score || 0) - (a.score || 0));
        } catch (e) {
            console.warn('[AI] _aiPlanCandidates failed:', e);
            return [];
        }
    };
    /* Line beams re-aim from the caster's current position at cast time —
       SimulEngine reuses this for displaced casters/targets at resolution. */
    window._aiReaimLineSpell = _reaimLineSpell;

    console.log('[AI] Entropy Wars strategic AI v3 loaded (action memory + context gates + centipawn normalization).');
})();
