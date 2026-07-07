        function randInt(n) {
            return Math.floor(Math.random() * n);
        }

        const _STATUS_EFFECT_IDS = new Set(['burn','poison','silence','stun','stagger','marked','lasered','jammed','drowning','lava_burn','protect']);

        const GAME_MODES = {
            normal: {
                id: 'normal',
                label: 'Small',
                desc: '4×4 board, 2v2',
                boardSize: 4,
                boardWidth: 4,
                boardHeight: 4,
                teamSize: 2,
                winHourglasses: 1,
                hiddenItemSpawns: 1,
                blitzMode: true,
                hasTowers: false,
                terrainPatches: {
                    water: [0, 0, 0],
                    desert: [0, 0, 0],
                    mountain: [0, 0, 0]
                },
                spawns: {
                    1: [{x:0,y:1},{x:0,y:2}],
                    2: [{x:3,y:1},{x:3,y:2}]
                },
                defaultBuilds: {
                    1: ['Warrior', 'Black Mage'],
                    2: ['Warrior', 'Black Mage']
                }
            },
            medium: {
                id: 'medium',
                label: 'Medium',
                desc: '8×8 board, 4v4',
                boardSize: 8,
                boardWidth: 8,
                boardHeight: 8,
                teamSize: 4,
                winHourglasses: 2,
                hiddenItemSpawns: 3,
                blitzMode: true,
                hasTowers: true,
                terrainPatches: {
                    water: [1, 2, 3],
                    desert: [1, 1, 2],
                    mountain: [1, 1, 2]
                },
                spawns: {
                    1: [{x:0,y:2},{x:0,y:3},{x:0,y:4},{x:0,y:5}],
                    2: [{x:7,y:2},{x:7,y:3},{x:7,y:4},{x:7,y:5}]
                },
                defaultBuilds: {
                    1: ['Warrior', 'Gunslinger', 'Black Mage', 'White Mage'],
                    2: ['Warrior', 'Gunslinger', 'Black Mage', 'White Mage']
                }
            },
            large: {
                id: 'large',
                label: 'Large',
                desc: '12×12 board, 6v6',
                boardSize: 12,
                boardWidth: 12,
                boardHeight: 12,
                teamSize: 6,
                winHourglasses: 3,
                hiddenItemSpawns: 8,
                blitzMode: true,
                hasTowers: true,
                terrainPatches: {
                    water: [2, 3, 5],
                    desert: [2, 2, 4],
                    mountain: [2, 2, 4]
                },
                spawns: {
                    1: [{x:0,y:4},{x:1,y:4},{x:0,y:5},{x:0,y:6},{x:1,y:6},{x:0,y:7}],
                    2: [{x:11,y:4},{x:10,y:4},{x:11,y:5},{x:11,y:6},{x:10,y:6},{x:11,y:7}]
                },
                defaultBuilds: {
                    1: ['Warrior', 'Gunslinger', 'Black Mage', 'White Mage', 'Agent', 'Gunslinger'],
                    2: ['Warrior', 'Gunslinger', 'Black Mage', 'White Mage', 'Agent', 'Warrior']
                }
            },
            xlarge: {
                id: 'xlarge',
                label: 'Extra Large',
                desc: '18×20 board, 8v8',
                boardSize: 18,
                boardWidth: 18,
                boardHeight: 20,
                teamSize: 8,
                winHourglasses: 4,
                hiddenItemSpawns: 14,
                blitzMode: true,
                hasTowers: true,
                terrainPatches: {
                    water: [3, 4, 7],
                    desert: [3, 3, 6],
                    mountain: [3, 3, 6]
                },
                spawns: {
                    1: [{x:0,y:7},{x:1,y:7},{x:0,y:8},{x:1,y:8},{x:0,y:11},{x:1,y:11},{x:0,y:12},{x:1,y:12}],
                    2: [{x:17,y:7},{x:16,y:7},{x:17,y:8},{x:16,y:8},{x:17,y:11},{x:16,y:11},{x:17,y:12},{x:16,y:12}]
                },
                defaultBuilds: {
                    1: ['Warrior', 'Warrior', 'Gunslinger', 'Gunslinger', 'Black Mage', 'White Mage', 'Agent', 'Agent'],
                    2: ['Warrior', 'Warrior', 'Gunslinger', 'Gunslinger', 'Black Mage', 'White Mage', 'Agent', 'Agent']
                }
            },
            huge: {
                id: 'huge',
                label: 'Huge',
                desc: '36×30 elliptical disc, 10v10',
                boardSize: 36,
                boardWidth: 36,
                boardHeight: 30,
                teamSize: 10,
                winHourglasses: 5,
                hiddenItemSpawns: 20,
                blitzMode: true,
                hasTowers: true,
                isElliptical: true,
                terrainPatches: {
                    water: [4, 6, 10],
                    desert: [4, 5, 8],
                    mountain: [4, 5, 8]
                },
                spawns: {
                    1: [{x:2,y:11},{x:1,y:12},{x:2,y:12},{x:1,y:13},{x:2,y:13},{x:1,y:14},{x:2,y:14},{x:1,y:15},{x:2,y:15},{x:1,y:16}],
                    2: [{x:33,y:11},{x:34,y:12},{x:33,y:12},{x:34,y:13},{x:33,y:13},{x:34,y:14},{x:33,y:14},{x:34,y:15},{x:33,y:15},{x:34,y:16}]
                },
                defaultBuilds: {
                    1: ['Warrior','Warrior','Gunslinger','Gunslinger','Black Mage','Black Mage','White Mage','White Mage','Agent','Agent'],
                    2: ['Warrior','Warrior','Gunslinger','Gunslinger','Black Mage','Black Mage','White Mage','White Mage','Agent','Agent']
                }
            },
            prebuilt_custommap: {
                id: 'prebuilt_custommap', label: 'Custom Map', desc: '20×20 prebuilt, 6v6 — elevated urban park: a paved plaza, scattered buildings, trees & a water-lined road',
                boardSize: 20, boardWidth: 20, boardHeight: 20, teamSize: 6,
                winHourglasses: 3, hiddenItemSpawns: 8, blitzMode: true,
                hasTowers: false, isPrebuilt: true,
                terrainPatches: { water: [0,0,0], desert: [0,0,0], mountain: [0,0,0] },
                spawns: { 1: [{x:7,y:19},{x:8,y:19},{x:9,y:19},{x:10,y:19},{x:11,y:19},{x:12,y:19}], 2: [{x:7,y:0},{x:8,y:0},{x:9,y:0},{x:10,y:0},{x:11,y:0},{x:12,y:0}] },
                defaultBuilds: { 1: ["Warrior","Gunslinger","Black Mage","White Mage","Agent","Warrior"], 2: ["Warrior","Gunslinger","Black Mage","White Mage","Agent","Warrior"] }
            },
        };

        /* ── 2026-07 map overhaul ─────────────────────────────────────────────
           Every launch map's GAME_MODES entry is GENERATED from the MapForge
           roster (data.js: EW_MAP_META + PREBUILT_MAPS) so sizes and spawns
           can never drift from the authored geometry. Custom Map keeps its
           hand-written entry above. */
        (function _generatePrebuiltGameModes() {
            if (typeof EW_MAP_META === 'undefined' || typeof PREBUILT_MAPS === 'undefined') return;
            const JOBS = ['Warrior', 'Gunslinger', 'Black Mage', 'White Mage', 'Agent'];
            EW_MAP_META.forEach(meta => {
                const pb = PREBUILT_MAPS[meta.id];
                if (!pb || !pb.spawns) return;
                const builds = [];
                for (let i = 0; i < meta.teamSize; i++) builds.push(JOBS[i % JOBS.length]);
                const area = meta.w * meta.h;
                GAME_MODES[meta.id] = {
                    id: meta.id, label: meta.label, desc: meta.desc,
                    boardSize: Math.max(meta.w, meta.h), boardWidth: meta.w, boardHeight: meta.h,
                    teamSize: meta.teamSize,
                    winHourglasses: meta.teamSize >= 8 ? 4 : (area <= 144 ? 2 : 3),
                    hiddenItemSpawns: area >= 529 ? 12 : (area >= 256 ? 8 : (area >= 144 ? 6 : 4)),
                    blitzMode: true, hasTowers: false, isPrebuilt: true,
                    isDelta: !!meta.isDelta, tier: meta.tier || 3, biomes: (meta.biomes || []).slice(),
                    terrainPatches: { water: [0, 0, 0], desert: [0, 0, 0], mountain: [0, 0, 0] },
                    spawns: { 1: pb.spawns[1].map(p => ({ x: p.x, y: p.y })), 2: pb.spawns[2].map(p => ({ x: p.x, y: p.y })) },
                    defaultBuilds: { 1: builds.slice(), 2: builds.slice() },
                };
            });
        })();

        const MULTIPLAYER_MODES = {
            arena: {
                id: 'arena',
                label: 'Arena',
                icon: '🏰',
                desc: 'Destroy the tower, collect hourglasses, or wipe out the enemy. 15-round limit with composite scoring fallback.',
                roundLimit: 15,
                timeLimitSec: 0,
                hasTowers: true,
                hasNexus: true,
                hasHourglasses: true,
                hasFlags: false,
                respawns: true,
                winConditions: ['tower_destroyed', 'hourglasses_collected', 'wipeout'],
                tiebreaker: null,
                scoringType: null,
                suddenDeath: true,
                compatibleMaps: [],   // generated below from the MapForge roster
            },
            tdm: {
                id: 'tdm',
                label: 'Team Deathmatch',
                icon: '💀',
                desc: 'Most kills in 12 rounds wins. Wipeout also wins instantly. Sudden Death if tied.',
                roundLimit: 12,
                timeLimitSec: 0,
                hasTowers: false,
                hasNexus: false,
                hasHourglasses: false,
                hasFlags: false,
                respawns: true,
                winConditions: ['most_kills', 'wipeout'],
                tiebreaker: 'sudden_death_kill',
                scoringType: 'kills',
                suddenDeath: true,
                compatibleMaps: [],   // generated below from the MapForge roster
            },
            ffa: {
                id: 'ffa',
                label: 'Free For All',
                icon: '👤',
                desc: 'Every player for themselves. Most kills in 15 rounds wins. No teams.',
                roundLimit: 15,
                timeLimitSec: 0,
                hasTowers: false,
                hasNexus: false,
                hasHourglasses: false,
                hasFlags: false,
                respawns: true,
                winConditions: ['most_kills', 'wipeout'],
                tiebreaker: 'sudden_death_kill',
                scoringType: 'kills',
                suddenDeath: true,
                isFFA: true,
                maxPlayers: 10,
                compatibleMaps: [],   // generated below from the MapForge roster
            },
            domination: {
                id: 'domination',
                label: 'Domination',
                icon: '🚩',
                desc: 'Capture and hold Nexus points to earn points every round. Most points in 15 rounds wins.',
                roundLimit: 15,
                timeLimitSec: 0,
                hasTowers: false,
                hasNexus: true,
                hasHourglasses: false,
                hasFlags: false,
                respawns: true,
                winConditions: ['most_points'],
                tiebreaker: 'sudden_death_nexus',
                scoringType: 'domination',
                suddenDeath: true,
                pointsPerNexusPerRound: 10,
                compatibleMaps: [],   // generated below from the MapForge roster
            },
            hotspot: {
                id: 'hotspot',
                label: 'Hotspot',
                icon: '🔥',
                desc: 'One Nexus spawns at a time. Capture it to score — then it teleports somewhere new. 15-round limit.',
                roundLimit: 15,
                timeLimitSec: 0,
                hasTowers: false,
                hasNexus: false,
                hasRoamingNexus: true,
                hasHourglasses: false,
                hasFlags: false,
                respawns: true,
                winConditions: ['most_points'],
                tiebreaker: 'sudden_death_nexus',
                scoringType: 'hotspot',
                suddenDeath: true,
                pointsPerCapture: 50,
                compatibleMaps: [],   // generated below from the MapForge roster
            },
            ctf: {
                id: 'ctf',
                label: 'Capture the Flag',
                icon: '🏳️',
                desc: 'Steal the enemy flag and return it to your sanctuary to score. First to 3 or most in 15 rounds.',
                roundLimit: 15,
                timeLimitSec: 0,
                hasTowers: false,
                hasNexus: false,
                hasHourglasses: false,
                hasFlags: true,
                respawns: true,
                winConditions: ['most_captures'],
                tiebreaker: 'sudden_death_flag',
                scoringType: 'ctf',
                suddenDeath: true,
                compatibleMaps: [],   // generated below from the MapForge roster
            },
            gauntlet: {
                id: 'gauntlet',
                label: 'Gauntlet',
                icon: '⚔️',
                desc: 'Pokémon-style squad battle. Bring a roster of 8, deploy 4 at a time. No respawns, no round limit. Switch a reserve in for 2 AP. Last team standing wins.',
                roundLimit: 0,
                timeLimitSec: 0,
                hasTowers: false,
                hasNexus: false,
                hasHourglasses: false,
                hasFlags: false,
                respawns: false,
                rosterSize: 8,
                deploySize: 4,
                switchApCost: 2,
                winConditions: ['wipeout'],
                tiebreaker: null,
                scoringType: 'kills',
                suddenDeath: false,
                compatibleMaps: [],   // generated below from the MapForge roster
            },
        };

        /* compatibleMaps are generated from the MapForge roster: every launch
           map and its Δ variant is playable in every mode (Δ = the 10×10
           mirror-balanced ranked cut). Gauntlet fields 8-unit rosters, so it
           keeps the roomier full boards only. */
        (function _generateCompatibleMaps() {
            if (typeof EW_MAP_META === 'undefined') return;
            const fulls = EW_MAP_META.filter(m => !m.isDelta).map(m => m.id);
            const deltas = EW_MAP_META.filter(m => m.isDelta).map(m => m.id);
            const all = ['medium', 'large', 'xlarge'].concat(fulls, ['prebuilt_custommap'], deltas);
            Object.keys(MULTIPLAYER_MODES).forEach(k => { MULTIPLAYER_MODES[k].compatibleMaps = all.slice(); });
            MULTIPLAYER_MODES.tdm.compatibleMaps = ['normal'].concat(all);
            MULTIPLAYER_MODES.gauntlet.compatibleMaps = ['medium', 'large', 'xlarge'].concat(fulls, ['prebuilt_custommap']);
        })();

        let activeMultiplayerMode = 'arena';

        function getActiveMultiplayerMode() {
            return MULTIPLAYER_MODES[activeMultiplayerMode] || MULTIPLAYER_MODES.arena;
        }

        let activeGameMode = 'medium';

        let _blitzTurnOrder = [];
        let _blitzTurnIndex = 0;

        function buildBlitzTurnOrder() {
            const alive = state.units.filter(u => !u.dead);

            const tiers = {};
            for (const u of alive) {
                const spd = u.spd || 0;
                if (!tiers[spd]) tiers[spd] = [];
                tiers[spd].push(u);
            }

            // Trick Room: while active, reverse the speed ordering so the slowest units act first.
            const trickRoomActive = (state._trickRoomRounds || 0) > 0;
            const sortedSpeeds = Object.keys(tiers).map(Number).sort((a, b) => trickRoomActive ? (a - b) : (b - a));

            _blitzTurnOrder = [];
            for (const spd of sortedSpeeds) {
                const tierUnits = tiers[spd];
                const p0 = tierUnits.filter(u => u.player === 0);
                const p1 = tierUnits.filter(u => u.player === 1);
                const p2 = tierUnits.filter(u => u.player === 2);

                for (let i = p1.length - 1; i > 0; i--) { const j = randInt(i + 1); [p1[i], p1[j]] = [p1[j], p1[i]]; }
                for (let i = p2.length - 1; i > 0; i--) { const j = randInt(i + 1); [p2[i], p2[j]] = [p2[j], p2[i]]; }

                let first = (state.round % 2 === 1) ? p1 : p2;
                let second = (first === p1) ? p2 : p1;
                let fi = 0, si = 0;
                while (fi < first.length || si < second.length) {
                    if (fi < first.length) _blitzTurnOrder.push(first[fi++]);
                    if (si < second.length) _blitzTurnOrder.push(second[si++]);
                }

                for (const boss of p0) _blitzTurnOrder.push(boss);
            }
            _blitzTurnIndex = 0;

            // Trick Room counts down one round each time a new turn order is built.
            if (state._trickRoomRounds > 0) state._trickRoomRounds--;

            state._blitzTurnOrderIds = _blitzTurnOrder.map(u => u.id);
        }

        function rebuildBlitzTurnOrderFromIds() {
            if (!state._blitzTurnOrderIds || !state._blitzTurnOrderIds.length) return;
            const idList = state._blitzTurnOrderIds;
            const lookup = {};
            for (const u of state.units) lookup[u.id] = u;
            _blitzTurnOrder = [];
            for (const id of idList) {
                const u = lookup[id];
                if (u) _blitzTurnOrder.push(u);
            }
        }
        window._rebuildBlitzTurnOrderFromIds = rebuildBlitzTurnOrderFromIds;

        function getNextBlitzUnit() {
            for (let i = 0; i < _blitzTurnOrder.length; i++) {
                const u = _blitzTurnOrder[i];
                if (u.dead || u._dying) continue;
                if (unitFinished(u)) continue;
                if (u._skippedTurn) continue;
                _blitzTurnIndex = i;
                return u;
            }
            return null;
        }

        let _bufferingRoundEvents = false;
        let _roundEventBuffer = [];
        let _currentEventGroup = null;

        function _reBeginGroup(label) {

            if (_currentEventGroup && _currentEventGroup.events.length > 0) {
                _roundEventBuffer.push(_currentEventGroup);
            }
            _currentEventGroup = { label: label || '', events: [] };
        }

        function _rePushEvent(evt) {
            if (!_currentEventGroup) _reBeginGroup('auto');
            _currentEventGroup.events.push(evt);
        }

        function _reStartBuffering() {
            _bufferingRoundEvents = true;
            _roundEventBuffer = [];
            _currentEventGroup = null;
        }

        function _reStopBuffering() {

            if (_currentEventGroup && _currentEventGroup.events.length > 0) {
                _roundEventBuffer.push(_currentEventGroup);
            }
            _bufferingRoundEvents = false;
            _currentEventGroup = null;
        }

        function _rePlayGroup(group) {
            for (const evt of group.events) {
                switch (evt.type) {
                    case 'floatingText':
                        _realShowFloatingTextAtTile(evt.x, evt.y, evt.text, evt.kind, evt.opts);
                        break;
                    case 'deathBanner':
                        _realShowDeathBanner(evt.deadUnit, evt.killer);
                        break;
                    case 'shake':
                        _realShakeBoard(evt.intensity);
                        break;
                    case 'flash':
                        _realFlashUnit(evt.unitId, evt.kind);
                        break;
                    case 'dialogue':
                        _realShowBattleDialogue(evt.messages, evt.duration);
                        break;
                    case 'combatBanner':
                        _realShowCombatBanner(evt.title, evt.subtitle, evt.kind);
                        break;
                    case 'hitEffect':
                        _realPlayHitEffect(evt.x, evt.y, evt.opts);
                        break;
                    case 'hitstop':
                        _realTriggerHitstop(evt.durationMs);
                        break;
                    case 'boardRender':
                        scheduleBoardRender();
                        break;
                }
            }

            scheduleBoardRender();
            renderBattleUpdate();
        }

        // Where a buffered event group happened on the board — the tile the
        // round-start camera should dive to before the group's floats/flashes
        // fire. First event with a usable position wins.
        function _reGroupFocal(group) {
            for (const evt of group.events) {
                if ((evt.type === 'floatingText' || evt.type === 'hitEffect')
                    && Number.isFinite(evt.x) && Number.isFinite(evt.y)) {
                    return { x: evt.x, y: evt.y };
                }
                if (evt.type === 'flash' && evt.unitId != null) {
                    const u = state.units.find(un => un.id === evt.unitId);
                    if (u) return { x: u.x, y: u.y };
                }
                if (evt.type === 'deathBanner' && evt.deadUnit
                    && Number.isFinite(evt.deadUnit.x) && Number.isFinite(evt.deadUnit.y)) {
                    return { x: evt.deadUnit.x, y: evt.deadUnit.y };
                }
            }
            return null;
        }

        function playBufferedRoundEvents(onDone) {
            const groups = _roundEventBuffer;
            _roundEventBuffer = [];
            const _hideChip = () => {
                if (typeof _eorPhaseLabelHide === 'function') _eorPhaseLabelHide();
            };
            if (!groups.length || state.devAutoSim) {
                if (onDone) onDone();
                return;
            }

            const nonEmpty = groups.filter(g => g.events.length > 0);
            if (!nonEmpty.length) {
                if (onDone) onDone();
                return;
            }
            let idx = 0;
            function playNext() {
                if (state.winner || idx >= nonEmpty.length) {
                    _hideChip();
                    if (onDone) onDone();
                    return;
                }
                const group = nonEmpty[idx++];

                // Dive the camera onto the group's subject (a unit drowning in
                // deep water, burning on lava, a fresh respawn…) before its
                // floats fire — same shared framing as every end-of-round beat.
                // Skip the pan for tiles the viewer can't see under fog.
                const focal = _reGroupFocal(group);
                const camOk = focal && !state.cameraDisabled
                    && typeof eorFocusCamera === 'function'
                    && !(typeof _skipVisuals === 'function' && _skipVisuals())
                    && (!state.fogOfWar
                        || typeof _isTileVisibleToViewer !== 'function'
                        || _isTileVisibleToViewer(focal.x, focal.y));
                if (camOk) {
                    if (typeof _eorPhaseLabel === 'function' && group.label) _eorPhaseLabel(group.label);
                    eorFocusCamera(focal.x, focal.y, { duration: 380 });
                }

                window.setTimeout(() => {
                _rePlayGroup(group);

                let delayMs = actionMs(420);
                const hasKill = group.events.some(e => e.type === 'deathBanner');
                const hasShake = group.events.some(e => e.type === 'shake');
                const hasDmg = group.events.some(e => e.type === 'floatingText' && e.kind === 'damage');
                if (hasKill) delayMs = actionMs(1400);
                else if (hasShake) delayMs = actionMs(700);
                else if (hasDmg) delayMs = actionMs(550);
                window.setTimeout(playNext, delayMs);
                }, camOk ? 360 : 0);
            }
            playNext();
        }

        let _realShowFloatingTextAtTile = null;
        let _realShowDeathBanner = null;
        let _realShakeBoard = null;
        let _realFlashUnit = null;
        let _realShowBattleDialogue = null;
        let _realShowCombatBanner = null;
        let _realPlayHitEffect = null;
        let _realTriggerHitstop = null;

        function _delayedSpellIdFromName(spellName) {
            if (!spellName) return null;
            if (typeof SPELL_BY_ID === 'undefined' || !SPELL_BY_ID) return null;
            for (const id in SPELL_BY_ID) {
                if (SPELL_BY_ID[id] && SPELL_BY_ID[id].name === spellName) return id;
            }
            return null;
        }

        function processDelayedSpellDetonations(onDone) {
            if (!state._delayedSpells?.length) {
                if (onDone) onDone();
                return;
            }

            const detonating = [];
            state._delayedSpells = state._delayedSpells.filter(ds => {
                ds.roundsLeft--;
                if (ds.roundsLeft <= 0) {
                    detonating.push(ds);
                    return false;
                }
                return true;
            });

            if (!detonating.length || state.devAutoSim) {

                if (state.devAutoSim) {
                    for (const ds of detonating) {
                        _detonateDelayedSpell(ds);
                    }
                    checkWin();
                }
                if (onDone) onDone();
                return;
            }

            let idx = 0;

            function detonateNext() {
                if (state.winner) { if (onDone) onDone(); return; }
                if (idx >= detonating.length) {
                    scheduleBoardRender();
                    if (onDone) onDone();
                    return;
                }

                const ds = detonating[idx++];

                // A unit-tracking laser mark (Headshot) follows its target — aim the
                // detonation camera at wherever the marked unit is standing now.
                if (ds.markedUnitId) {
                    const _mk = state.units.find(u => u.id === ds.markedUnitId && !u.dead);
                    if (_mk) { ds.x = _mk.x; ds.y = _mk.y; ds.z = _mk.z ?? ds.z; }
                }

                const isVisible = !state.fogOfWar || (typeof _isTileVisibleToViewer === 'function' && _isTileVisibleToViewer(ds.x, ds.y));
                if (isVisible && !state.cameraDisabled && typeof camera !== 'undefined') {
                    // Shared end-of-round framing (resting tactical angle, one
                    // tour zoom) so the detonation dive matches every other beat.
                    if (typeof _eorPhaseLabel === 'function') _eorPhaseLabel('End of Round — Detonations');
                    if (typeof eorFocusCamera === 'function') {
                        eorFocusCamera(ds.x, ds.y, { duration: 380 });
                    } else {
                        const _detZoom = (typeof isUserZoomEngaged === 'function' && isUserZoomEngaged()) ? getUserZoomScale() : (typeof getDefaultZoom === 'function' ? getDefaultZoom() : 1);
                        camera.moveTo({ x: ds.x, y: ds.y, zoom: _detZoom, duration: 350, _fogAllowed: true });
                    }
                }

                const _spellIdForVfx = ds.spellId || _delayedSpellIdFromName(ds.spellName);
                const _hasDescentVfx = _spellIdForVfx
                    && typeof window !== 'undefined' && window.ThreeVFXEffects
                    && window.ThreeVFXEffects.hasMapping(_spellIdForVfx, 'descent')
                    && state.phase === 'battle' && !(typeof _skipVisuals === 'function' ? _skipVisuals() : state.animationsDisabled);

                let _descentVfxMs = 0;
                if (_hasDescentVfx) {
                    try {
                        window.ThreeVFXEffects.fire('descent', _spellIdForVfx, { tx: ds.x, ty: ds.y });
                        _descentVfxMs = window.ThreeVFXEffects.getDescentTotalMs(_spellIdForVfx) || 0;
                    } catch (e) {  }
                }

                const _impactDelay = _descentVfxMs > 0 ? actionMs(_descentVfxMs) : 0;

                window.setTimeout(() => {
                    _detonateDelayedSpell(ds);

                    if (isVisible && typeof showBattleDialogue === 'function') {
                        showBattleDialogue(`💥 ${ds.spellName} detonates!`, 1200);
                    }

                    scheduleBoardRender();
                    renderBattleUpdate();

                    checkWin();
                    if (state.winner) { if (onDone) onDone(); return; }

                    const _postImpactDelay = actionMs(500);
                    window.setTimeout(detonateNext, _postImpactDelay);
                }, _impactDelay);
            }

            detonateNext();
        }

        function _detonateDelayedSpell(ds) {
            const sourceUnit = state.units.find(u => u.id === ds.sourceUnitId);

            // ── Unit-tracking laser mark (Headshot) ──────────────────────────
            // The shot follows the painted target rather than a fixed tile, and
            // only lands if the caster's team STILL has eyes on them. Break line
            // of sight (move out of awareness / into smoke) and the shot is lost.
            if (ds.markedUnitId) {
                const mark = state.units.find(u => u.id === ds.markedUnitId);
                if (mark && typeof clearStatus === 'function') clearStatus(mark, 'lasered');
                if (!mark || mark.dead) {
                    addLog(`🔴 ${ds.spellName}: the target is already down — the shot is wasted.`);
                    return;
                }
                const stillSeen = !ds.requireVision
                    || (typeof _isUnitVisibleToViewer !== 'function')
                    || _isUnitVisibleToViewer(mark, ds.sourcePlayer);
                if (!stillSeen) {
                    addLog(`🔴 ${ds.spellName} loses its lock — ${unitDisplayName(mark)} slipped out of sight!`, ds.sourcePlayer);
                    if (typeof showFloatingTextForUnit === 'function') {
                        showFloatingTextForUnit(mark, 'Sight lost!', 'streak', { durationMs: 1000 });
                    }
                    return;
                }
                /* The shot lands — flash a bright beam down the sight line and
                   play the impact animation on the target (muzzle flash,
                   sparks, blood). Until now the laser just vanished and HP
                   dropped with no visible hit. */
                if (typeof window !== 'undefined' && window.ThreeVFXEffects
                    && state.phase === 'battle'
                    && !(typeof _skipVisuals === 'function' ? _skipVisuals() : state.animationsDisabled)) {
                    try {
                        if (sourceUnit && !sourceUnit.dead && typeof window.ThreeVFXEffects.beam === 'function') {
                            window.ThreeVFXEffects.beam(sourceUnit.x, sourceUnit.y, mark.x, mark.y,
                                ds.spellType || 'tech', ds.spellId || 'headshot', ds.spellName);
                        }
                        const _impactId = (ds.spellId && window.ThreeVFXEffects.hasMapping(ds.spellId, 'impact'))
                            ? ds.spellId
                            : (window.ThreeVFXEffects.hasMapping('headshot', 'impact') ? 'headshot' : null);
                        if (_impactId) window.ThreeVFXEffects.fire('impact', _impactId, { tx: mark.x, ty: mark.y });
                        if (typeof playSfx === 'function') playSfx('gun');
                    } catch (e) {  }
                }
                applyDamageToUnit(mark, ds.dmg, `${ds.spellName} strikes `, {
                    sourceUnit,
                    damageType: ds.damageType || 'physical',
                    spellType: ds.spellType || null,
                    ignoreArmor: !!ds.ignoreArmor,
                    flashColor: 'hit'
                });
                for (const eff of (ds.statusEffects || [])) {
                    if (sourceUnit && !mark.dead) applyStatusPayload(mark, { id: eff.id, duration: eff.duration || 1, bonusDamage: eff.bonusDamage || 0 }, `${ds.spellName}: `, sourceUnit);
                }
                addLog(`🎯 ${ds.spellName} lands on ${unitDisplayName(mark)}!`, ds.sourcePlayer);
                return;
            }

            const area = getSquareArea(ds.x, ds.y, ds.aoeRadius || 1);
            const allUnits = state.units.filter(u => !u.dead);
            for (const tile of area) {
                const hit = allUnits.find(u => u.x === tile.x && u.y === tile.y && (ds.friendlyFire || u.player !== ds.sourcePlayer));
                if (hit && !hit.dead) {
                    applyDamageToUnit(hit, ds.dmg, `${ds.spellName} detonates: `, {
                        sourceUnit,
                        damageType: ds.damageType || 'magic',
                        spellType: ds.spellType || null
                    });
                    for (const eff of (ds.statusEffects || [])) {
                        if (sourceUnit && !hit.dead) applyStatusPayload(hit, { id: eff.id, duration: eff.duration || 1, bonusDamage: eff.bonusDamage || 0 }, `${ds.spellName}: `, sourceUnit);
                    }
                }
            }
            addLog(`💥 ${ds.spellName} detonates at ${coordLabel(ds.x, ds.y)}!`);

            if (ds.leaveTerrain) {
                for (const tile of area) {
                    const current = getTerrainAt(tile.x, tile.y);
                    if (current !== 'wall' && current !== ds.leaveTerrain) {
                        setTerrainAt(tile.x, tile.y, ds.leaveTerrain);
                    }
                }
            }

            /* 🏢 Buildings in the blast — a crater-forming detonation (nuke class)
               levels every building it touches; lesser delayed strikes chip 2
               structure hits. Runs AFTER leaveTerrain so collapse rubble stays.
               One hit per building regardless of overlapped footprint tiles. */
            if (typeof damageBuildingAt === 'function' && typeof getBuildingAt === 'function') {
                const _dsBldgs = new Set();
                const _dsLevel = !!ds.demolishesBuildings || (!!ds.terrainDeform && (ds.dmg || 0) >= 150);
                for (const tile of area) {
                    const _b = getBuildingAt(tile.x, tile.y);
                    if (!_b || _dsBldgs.has(_b.id)) continue;
                    _dsBldgs.add(_b.id);
                    damageBuildingAt(tile.x, tile.y, _dsLevel ? Infinity : 2, sourceUnit || null);
                }
            }

            if (ds.terrainDeform && typeof window !== 'undefined' && window.GAME?.applyTerrainDeform) {
                window.GAME.applyTerrainDeform(ds.x, ds.y, ds.aoeRadius || 1, ds.terrainDeform);
            }
            if (ds.leaveTerrain || ds.terrainDeform) {
                if (typeof _invalidateBoardGrid === 'function') _invalidateBoardGrid();
                if (typeof scheduleBoardRender === 'function') scheduleBoardRender();
            }
        }

        function beginBlitzRound() {

            moveTowers();

            const weStartedBuffering = !_bufferingRoundEvents;
            if (weStartedBuffering) _reStartBuffering();

            for (const u of state.units) {
                if (!u.dead) {
                    updateTerrainStay(u);
                    _reBeginGroup(`🌍 Terrain: ${unitDisplayName(u)}`);
                    applyTerrainTurnEffects(u);
                    checkFallDamage(u);
                }
            }

            _reBeginGroup('🌦 Weather effects');
            applyWeatherTurnEffects(1);
            applyWeatherTurnEffects(2);

            if (state._visionWards?.length) {
                state._visionWards = state._visionWards.filter(w => {
                    w.remaining--;
                    if (w.remaining <= 0) {
                        addLog(`👁️ Vision ward at ${coordLabel(w.x, w.y)} fades.`);
                        return false;
                    }
                    return true;
                });
            }

            if (weStartedBuffering) _reStopBuffering();

            checkWin();
        }

        function getActiveGameMode() {
            return GAME_MODES[activeGameMode] || GAME_MODES.normal;
        }

        function applyGameMode(modeId) {

            if (isOnlineMatch() && typeof _isGuest === 'function' && _isGuest()) {
                addLog('Only the host can change the map size.');
                return;
            }
            const mode = GAME_MODES[modeId];
            if (!mode) return;
            activeGameMode = modeId;
            CONFIG.boardSize = mode.boardSize;
            CONFIG.boardWidth = mode.boardWidth || mode.boardSize;
            CONFIG.boardHeight = mode.boardHeight || mode.boardSize;
            CONFIG.teamSize = mode.teamSize;
            CONFIG.winHourglasses = mode.winHourglasses;
            CONFIG.hiddenItemSpawns = mode.hiddenItemSpawns;

            const layout = MAP_LAYOUT_PRESETS[modeId] || MAP_LAYOUT_PRESETS.large;
            MAP_SECTIONS = JSON.parse(JSON.stringify(layout.sections));
            BARRIER_ROWS = [...layout.barrierRows];
            BARRIER_OPENINGS_X = [...layout.barrierOpeningsX];
            MAP_HAS_FLOORS = !!layout.hasFloors;
            /* Opt this map into smooth rolling-heightfield terrain rendering
               (three-renderer reads state.naturalTerrain). All other maps stay
               classic flat-cube voxels. */
            state.naturalTerrain = !!layout.naturalTerrain;
            /* Per-terrain tints only exist for the map-editor's Play Test map; every
               other mode clears them so a custom map's colours never leak onto a
               normal match. (three-renderer reads state.terrainTints in _evTintMat.) */
            state.terrainTints = (modeId === '_custom_editor' && window._customEditorTints)
                ? Object.assign({}, window._customEditorTints)
                : ((typeof PREBUILT_MAPS !== 'undefined' && PREBUILT_MAPS[modeId] && PREBUILT_MAPS[modeId].terrainTints)
                    ? Object.assign({}, PREBUILT_MAPS[modeId].terrainTints) : null);
            /* Opt this map into cosmetic 3D street lamps beside its built
               environment (three-renderer reads state.streetLamps). Natural
               terrain (Entropy Vale) already gets lamps via its own gate. */
            state.streetLamps = !!layout.streetLamps;
            /* Per-map environment preset: sky tint / stars / fog / horizon
               scenery theme. three-renderer reads state.mapEnv every frame
               (see _updateEnvironment) — null means the default cosmic dome. */
            state.mapEnv = layout.env ? JSON.parse(JSON.stringify(layout.env)) : null;

            if (!layout.isElliptical) state.zoneMap = null;

            SPAWNS[1] = [...mode.spawns[1]];
            SPAWNS[2] = [...mode.spawns[2]];

            DEFAULT_BUILDS[1] = [...mode.defaultBuilds[1]];
            DEFAULT_BUILDS[2] = [...mode.defaultBuilds[2]];

            [1, 2].forEach(player => {
                const oldSize = state.partyBuilds?.[player]?.length || 0;
                if (oldSize < mode.teamSize) {
                    for (let i = oldSize; i < mode.teamSize; i++) {
                        state.partyBuilds[player][i] = mode.defaultBuilds[player][i] || 'Warrior';
                        state.partyNames[player][i] = getDefaultUnitName(state.partyBuilds[player][i]);
                        state.loadouts[player][i] = emptyLoadout();
                        if (!state.partyMeta[player]) state.partyMeta[player] = [];
                        state.partyMeta[player][i] = {};
                    }
                } else if (oldSize > mode.teamSize) {
                    state.partyBuilds[player].length = mode.teamSize;
                    state.partyNames[player].length = mode.teamSize;
                    state.loadouts[player].length = mode.teamSize;
                    if (state.partyMeta[player]) state.partyMeta[player].length = mode.teamSize;
                }
            });

            if (isOnlineMatch() && typeof _isHost === 'function' && _isHost()) {
                if (typeof _emit === 'function') _emit('relay', {
                    type: 'game-mode',
                    modeId: modeId
                });
                const lock = window._NET?._lockState;
                if (lock) {
                    lock.host = false;
                    lock.guest = false;
                    lock.guestPartyReceived = false;
                }
                addLog('Map size changed — both players need to re-lock their teams.');
                render();
            }
        }

        function bw() {
            return CONFIG.boardWidth || CONFIG.boardSize;
        }

        function bh() {
            return CONFIG.boardHeight || CONFIG.boardSize;
        }

        function bmax() {
            return Math.max(bw(), bh());
        }

        const RACE_SLOT_RESTRICTIONS = {};
        function isSlotAvailableForRace(race, slot) { return true; }

        function emptyEquipment() {
            return {
                accessory1: null,
                accessory2: null
            };
        }

        function getActiveZodiac(round) {
            if (!round || round < 1) return ZODIAC_CYCLE[0];
            const offset = state.zodiacOffset || 0;
            const idx = (Math.floor((round - 1) / ZODIAC_ROTATION_ROUNDS) + offset) % ZODIAC_CYCLE.length;
            return ZODIAC_CYCLE[idx];
        }

        function getZodiacBonus(unit) {
            if (!unit || !state.activeZodiac) return {
                active: false,
                mult: 1
            };
            const match = unit.zodiac === state.activeZodiac;
            return match ? {
                active: true,
                mult: 1.10
            } : {
                active: false,
                mult: 1
            };
        }

        function getSkyEventBonus(unit) {
            if (!unit || !state.skyEvent) return {
                atkMult: 1,
                defMult: 1,
                healMult: 1,
                active: false
            };
            const ev = SKY_EVENTS[state.skyEvent.type];
            if (!ev || unit.faction !== ev.faction) return {
                atkMult: 1,
                defMult: 1,
                healMult: 1,
                active: false
            };
            return {
                atkMult: ev.atkMult || 1,
                defMult: ev.defMult || 1,
                healMult: ev.healMult || 1,
                active: true
            };
        }

        function rollSkyEvent() {
            if (state.skyEvent) return null;
            if (state.round < SKY_EVENT_START_ROUND) return null;
            if (Math.random() > SKY_EVENT_CHANCE) return null;
            const type = SKY_EVENT_KEYS[Math.floor(Math.random() * SKY_EVENT_KEYS.length)];
            return {
                type,
                remaining: SKY_EVENT_DURATION
            };
        }

        function tickSkyEvent() {
            if (!state.skyEvent) return;
            state.skyEvent.remaining -= 1;
            if (state.skyEvent.remaining <= 0) {
                const ev = SKY_EVENTS[state.skyEvent.type];
                addLog(`The ${ev.label} fades from the sky.`);
                queueAnnouncement(`${ev.icon} ${ev.label} has ended`, '', 'sky-end');
                state.skyEvent = null;
            }
        }

        function checkZodiacRotation() {
            const newSign = getActiveZodiac(state.round);
            if (newSign !== state.activeZodiac) {
                state.activeZodiac = newSign;
                const icon = ZODIAC_ICONS[newSign] || '✦';
                const label = newSign.charAt(0).toUpperCase() + newSign.slice(1);
                addLog(`The stars shift — the constellation ${label} ${icon} now rules the sky.`);
                queueAnnouncement(`${icon} ${label}`, 'The stars have shifted', 'zodiac');
            }
        }

        function checkNewSkyEvent() {
            const ev = rollSkyEvent();
            if (ev) {
                state.skyEvent = ev;
                const meta = SKY_EVENTS[ev.type];
                addLog(`A ${meta.label} ${meta.icon} appears! ${meta.desc} for ${ev.remaining} rounds.`);
                queueAnnouncement(`${meta.icon} ${meta.label}`, meta.desc, 'sky');
            }
        }

        function queueAnnouncement(title, subtitle, kind, opts) {
            if (!state.announcementQueue) state.announcementQueue = [];
            state.announcementQueue.push({
                title,
                subtitle,
                kind,
                shake: opts && opts.shake || null
            });
        }

        function showNextAnnouncement(callback) {
            if (!state.announcementQueue || !state.announcementQueue.length) {
                if (callback) callback();
                return;
            }
            const ann = state.announcementQueue.shift();
            showAnnouncementBanner(ann.title, ann.subtitle, ann.kind, () => {
                showNextAnnouncement(callback);
            }, ann.shake);
        }

        function showAnnouncementBanner(title, subtitle, kind, onDone, shake) {

            if (state.devAutoSim) {
                if (onDone) onDone();
                return;
            }
            // Zodiac shifts and celestial events get the full sky cinematic:
            // crane the camera up at the firmament, rotate the constellation
            // wheel / reveal the event, flash the banner while the star-lines
            // draw, then settle back to the board. Falls back to the plain
            // banner whenever the 3D sky or the camera isn't available.
            if ((kind === 'zodiac' || kind === 'sky') && _canPlaySkyCinematic()) {
                playSkyCinematic(title, subtitle, kind, onDone);
                return;
            }
            // A weather callout pans the camera to where the weather actually
            // formed (stashed by spawnWeather) so the banner and the board tell
            // the same story — same tactical framing as every other EOR beat.
            if (kind === 'weather' && state._lastWeatherSpawnTiles && state._lastWeatherSpawnTiles.length) {
                const _wxTiles = state._lastWeatherSpawnTiles;
                state._lastWeatherSpawnTiles = null;
                if (!state.cameraDisabled && !_skipVisuals() && typeof eorFocusCamera === 'function') {
                    const _wcx = _wxTiles.reduce((s, t) => s + t.x, 0) / _wxTiles.length;
                    const _wcy = _wxTiles.reduce((s, t) => s + t.y, 0) / _wxTiles.length;
                    // Frame a touch wider than the tour zoom so a multi-tile
                    // weather system fits in one look.
                    const _wxZoom = (typeof isUserZoomEngaged === 'function' && isUserZoomEngaged())
                        ? getUserZoomScale()
                        : (typeof getDefaultZoom === 'function' ? getDefaultZoom() * 1.1 : undefined);
                    eorFocusCamera(_wcx, _wcy, { zoom: _wxZoom, duration: 520 });
                }
            }
            _flashAnnouncementBanner(title, subtitle, kind, actionMs(2200), onDone, shake);
        }

        function _canPlaySkyCinematic() {
            if (state.animationsDisabled || state.cameraDisabled) return false;
            if (state.phase !== 'battle') return false;
            if (typeof camera === 'undefined' || !camera || typeof camera.moveTo !== 'function') return false;
            if (typeof ThreeRenderer === 'undefined' || !ThreeRenderer.isActive || !ThreeRenderer.isActive()) return false;
            if (!ThreeRenderer.getSkyShot) return false;
            return true;
        }

        /* The between-round sky spectacle. Sequence:
           1. crane the gaze up past the horizon to the sky subject (the zodiac
              wheel's prime slot, or the sun/moon a celestial event transforms);
           2. zodiac: rotate the wheel so the new sign clicks into place, then
              draw its constellation lines on star by star — the banner drops in
              right as the lines start drawing. Celestial event: the black sun /
              blood moon / eclipse ramps in ON CAMERA (it was held out of the
              dome until now), banner shortly after;
           3. hold the tableau, then ease the camera back to its resting angle
              and hand control back to the round pipeline via onDone. */
        function playSkyCinematic(title, subtitle, kind, onDone) {
            let finished = false;
            const finish = () => {
                if (finished) return;
                finished = true;
                try {
                    camera._busy = false;
                    if (typeof _resumeShotClock === 'function') _resumeShotClock();
                } catch (e) {}
                if (onDone) onDone();
            };
            try {
                // Claim the camera for the whole spectacle: pause the blitz shot
                // clock (a force-ended turn's activation pan would yank the gaze
                // back to the board mid-shot) and flag busy so the auto-settle
                // watchdog leaves the craned pitch alone.
                if (typeof _pauseShotClock === 'function') _pauseShotClock();
                camera._busy = true;
                if (camera._busyTimer) { clearTimeout(camera._busyTimer); camera._busyTimer = null; }
                if (camera._autoSettleTimer) { clearTimeout(camera._autoSettleTimer); camera._autoSettleTimer = null; }
                const evType = (kind === 'sky' && state.skyEvent && state.skyEvent.type) || null;
                const shot = ThreeRenderer.getSkyShot(kind === 'zodiac' ? 'zodiac' : (evType || 'bloodMoon'));
                const retTilt = (camera._restTilt != null) ? camera._restTilt : 50;
                const retYaw = (camera._restYaw != null) ? camera._restYaw : 0;
                const upMs = actionMs(1050);
                const downMs = actionMs(900);

                camera.moveTo({ tilt: shot.tilt, yaw: shot.yaw, duration: upMs, easing: 'easeInOut', _fogAllowed: true });

                window.setTimeout(() => {
                    let revealMs = 0;
                    try {
                        if (kind === 'zodiac' && ThreeRenderer.playZodiacReveal) {
                            const r = ThreeRenderer.playZodiacReveal({ rotMs: actionMs(1900), drawMs: actionMs(1700) });
                            revealMs = r.totalMs;
                            // banner lands just as the wheel locks in and the lines begin
                            window.setTimeout(() => {
                                _flashAnnouncementBanner(title, subtitle, kind, actionMs(2400), null);
                            }, Math.max(0, r.rotMs - actionMs(150)));
                        } else if (ThreeRenderer.playSkyEventReveal) {
                            const r = ThreeRenderer.playSkyEventReveal(evType, { rampMs: actionMs(2100) });
                            revealMs = r.totalMs;
                            window.setTimeout(() => {
                                _flashAnnouncementBanner(title, subtitle, kind, actionMs(2400), null);
                            }, actionMs(650));
                        }
                    } catch (e) { /* sky reveal is decorative — never block the round */ }

                    const holdMs = Math.max(revealMs + actionMs(900), actionMs(3300));
                    window.setTimeout(() => {
                        try {
                            camera.moveTo({ tilt: retTilt, yaw: retYaw, duration: downMs, easing: 'easeInOut', _fogAllowed: true });
                        } catch (e) {}
                        window.setTimeout(finish, downMs + actionMs(150));
                    }, holdMs);
                }, upMs + actionMs(120));

                // hard safety net: a stuck cinematic must never wedge the round pipeline
                window.setTimeout(finish, upMs + actionMs(9500));
            } catch (e) {
                finish();
            }
        }

        function _flashAnnouncementBanner(title, subtitle, kind, holdMs, onDone, shake) {
            const el = document.getElementById('announcementBanner');
            if (!el) {
                if (onDone) onDone();
                return;
            }
            const kindClass = kind === 'sky' ? 'banner-sky' : kind === 'sky-end' ? 'banner-sky-end' : kind === 'weather' ? 'banner-weather' : 'banner-zodiac';
            el.className = `announcement-banner ${kindClass}`;
            el.innerHTML = `<div class="banner-title">${title}</div>${subtitle ? `<div class="banner-sub">${subtitle}</div>` : ''}`;
            el.classList.add('visible');

            let shakeTarget = null;
            if (shake && !state.animationsDisabled) {
                const boardEl = document.getElementById('board');
                const boardStageEl = document.getElementById('boardStage');
                shakeTarget = boardEl || boardStageEl;
                if (shakeTarget) {
                    shakeTarget.classList.remove('board-shake', 'board-shake-hard', 'board-shake-sustained');
                    requestAnimationFrame(() => {
                        if (shakeTarget) shakeTarget.classList.add('board-shake-sustained');
                    });
                }
            }

            const duration = holdMs != null ? holdMs : actionMs(2200);
            window.setTimeout(() => {

                if (shakeTarget) {
                    shakeTarget.classList.remove('board-shake-sustained');
                }
                el.classList.remove('visible');
                window.setTimeout(() => {
                    if (onDone) onDone();
                }, actionMs(400));
            }, duration);
        }

        const WEATHER_REGISTRY = {
            tornado: {
                label: 'Tornado',
                icon: '🌪',
                tiles: [4, 6],
                roaming: true,
                homing: true,
                homingSpeed: 3,
                displaces: true,
                displaceTiles: 2,
                duration: [3, 5],
                ignoresTerrain: true,
                desc: 'Chases the nearest unit (up to 3 tiles/round); shreds and hurls anyone it catches.',
                homingDamage(unit) {
                    return {
                        amount: randInt(40) + 32,
                        text: `${unitDisplayName(unit)} is shredded by the Tornado for`
                    };
                }
            },
            earthquake: {
                label: 'Earthquake',
                icon: '🌋',
                tiles: [6, 9],
                roaming: false,
                duration: [1, 1],
                instant: true,
                desc: 'Hits immediately with seismic force, then ends.',
                onSpawnEffect(unit) {
                    return {
                        type: 'damage',
                        amount: randInt(40) + 40,
                        text: `${unitDisplayName(unit)} is slammed by the Earthquake for`
                    };
                }
            },
            hurricane: {
                label: 'Hurricane',
                icon: '🌀',
                tiles: [5, 8],
                roaming: true,
                homing: true,
                homingSpeed: 2,
                displaces: true,
                displaceTiles: 3,
                duration: [3, 5],
                desc: 'Chases the nearest unit (up to 2 tiles/round); batters and hurls anyone it catches. -10 DEF on the eye.',
                statMod: {
                    def: -10
                },
                homingDamage(unit) {
                    return {
                        amount: randInt(20) + 24,
                        text: `${unitDisplayName(unit)} is hurled by the Hurricane for`
                    };
                }
            },
            bloodRain: {
                label: 'Blood Rain',
                icon: '🩸',
                tiles: [5, 8],
                roaming: true,
                duration: [3, 5],
                desc: 'Damages Divine, heals Unholy.',
                onTurnEffect(unit) {
                    const isDivine = (unit.types || []).includes('divine');
                    const isUnholy = (unit.types || []).includes('unholy');
                    if (isDivine) return {
                        type: 'damage',
                        amount: randInt(24) + 24,
                        text: `${unitDisplayName(unit)} is burned by Blood Rain for`
                    };
                    if (isUnholy) return {
                        type: 'heal',
                        hpAmount: randInt(24) + 16,
                        mpAmount: randInt(10) + 5,
                        text: `Blood Rain restores ${unitDisplayName(unit)}.`
                    };
                    return null;
                }
            },
            drought: {
                label: 'Drought',
                icon: '☀',
                tiles: [7, 10],
                roaming: true,
                duration: [4, 6],
                desc: 'Healing 50% effective inside. Scorches planted seeds.',
                healMult: 0.5
            },

            solarFlare: {
                label: 'Solar Flare',
                icon: '☄',
                tiles: [4, 7],
                roaming: false,
                duration: [3, 5],
                desc: 'Damages Tech, +8 ATK to Divine.',
                onTurnEffect(unit) {
                    const isTech = (unit.types || []).includes('tech');
                    if (isTech) return {
                        type: 'damage',
                        amount: randInt(24) + 16,
                        text: `${unitDisplayName(unit)} is scorched by Solar Flare for`
                    };
                    return null;
                },
                conditionalStatMod(unit) {
                    return (unit.types || []).includes('divine') ? {
                        atk: 8
                    } : {};
                }
            },
            thunderstorm: {
                label: 'Thunderstorm',
                icon: '⛈',
                tiles: [4, 7],
                roaming: true,
                homing: true,
                homingSpeed: 2,
                duration: [3, 4],
                desc: 'Chases the nearest unit (up to 2 tiles/round); blasts anyone it catches with lightning. -5 DEF on the eye.',
                statMod: {
                    def: -5
                },
                homingDamage(unit) {
                    return {
                        amount: randInt(32) + 32,
                        text: `${unitDisplayName(unit)} is struck by lightning for`
                    };
                }
            },
            tesseractStorm: {
                label: 'Tesseract Storm',
                icon: '🔷',
                tiles: [5, 8],
                roaming: true,
                duration: [3, 5],
                desc: 'Geometric shapes rain from the sky. +10 INT to Anomaly, -8 DEF to Tech. Damages non-Anomaly units.',
                conditionalStatMod(unit) {
                    const types = unit.types || [];
                    const mods = {};
                    if (types.includes('anomaly')) mods.int = 10;
                    if (types.includes('tech'))    mods.def = -8;
                    return mods;
                },
                onTurnEffect(unit) {
                    const isAnomaly = (unit.types || []).includes('anomaly');
                    if (isAnomaly) return {
                        type: 'heal',
                        hpAmount: 0,
                        mpAmount: randInt(12) + 8,
                        text: `${unitDisplayName(unit)} resonates with the Tesseract Storm.`
                    };
                    if (Math.random() < 0.45) return {
                        type: 'damage',
                        amount: randInt(20) + 16,
                        text: `${unitDisplayName(unit)} is struck by a geometric shard for`
                    };
                    return null;
                }
            },
            blizzard: {
                label: 'Blizzard',
                icon: '🌨',
                tiles: [4, 6],
                roaming: true,
                homing: true,
                homingSpeed: 2,
                duration: [3, 4],
                desc: 'Chases the nearest unit (up to 2 tiles/round), freezing a trail of ice; batters non-Anomaly units it catches. -8 DEF on the eye.',
                statMod: {
                    def: -8
                },
                convertTerrain: 'ice',
                homingDamage(unit) {
                    const isAnomaly = (unit.types || []).includes('anomaly');
                    if (!isAnomaly) return {
                        amount: randInt(10) + 15,
                        text: `${unitDisplayName(unit)} is battered by the Blizzard for`
                    };
                    return null;
                }
            },
            sandstorm: {
                label: 'Sandstorm',
                icon: '🏜',
                tiles: [5, 7],
                roaming: true,
                homing: true,
                homingSpeed: 2,
                duration: [3, 5],
                desc: 'Chases the nearest unit (up to 2 tiles/round); scours non-Human units it catches. -5 AWR on the eye.',
                statMod: {
                    awr: -5
                },
                homingDamage(unit) {
                    const isHuman = (unit.types || []).includes('human');
                    if (!isHuman) return {
                        amount: randInt(10) + 20,
                        text: `${unitDisplayName(unit)} is scoured by the Sandstorm for`
                    };
                    return null;
                }
            }
        };
        const WEATHER_KEYS = Object.keys(WEATHER_REGISTRY);
        const WEATHER_SPAWN_ROUND = 2;
        const WEATHER_SPAWN_CHANCE = 0.42;
        const WEATHER_MAX_ACTIVE = 2;

        function checkFallDamage() {}
        function canFlyToSky() { return false; }
        function canDescendUnderground() { return false; }
        function canReturnToGround() { return false; }
        function unitHasSpelunkingGear() { return false; }
        function getEntranceAt() { return null; }
        function switchToFloor() {}
        function transitionUnitToFloor() { return false; }

        const FLOOR_IDS = ['earth', 'above', 'below'];
        const FLOOR_LABELS = { earth: '🌍 Earth', above: '🔼 Above', below: '🔽 Below', ground: '🌍 Earth', sky: '🔼 Above', underground: '🔽 Below' };
        const UNDERGROUND_RACES = [];

        function getSectionForRow(y) {

            if (!MAP_HAS_FLOORS) return 'earth';
            if (MAP_SECTIONS.above && y <= MAP_SECTIONS.above.endRow) return 'above';
            if (MAP_SECTIONS.buffer1 && y === MAP_SECTIONS.buffer1.row) return 'buffer';
            if (y <= MAP_SECTIONS.earth.endRow) return 'earth';
            if (MAP_SECTIONS.buffer2 && y === MAP_SECTIONS.buffer2.row) return 'buffer';
            if (MAP_SECTIONS.below) return 'below';
            return 'earth';
        }
        function getSectionForTile(x, y) {

            if (state.zoneMap && state.zoneMap[y] && state.zoneMap[y][x]) {
                const z = state.zoneMap[y][x];
                if (z === 'sanctuary' || z === 'tower') return 'earth';
                if (z === 'passage') return 'earth';
                if (z === 'water_border' || z === 'lava_border') return 'buffer';
                if (z === 'nexus') {

                    const obj = state.boardObjects?.[y]?.[x];
                    if (obj === 'nexus_sky') return 'above';
                    if (obj === 'nexus_cave') return 'below';

                    const t = state.boardTerrain?.[y]?.[x];
                    if (t === 'nexus_sky') return 'above';
                    if (t === 'nexus_cave') return 'below';
                    return 'earth';
                }
                return z;
            }
            return getSectionForRow(y);
        }
        function getSectionForUnit(unit) {
            return getSectionForTile(unit.x, unit.y);
        }
        function isBarrierRow(y) {
            return BARRIER_ROWS.includes(y);
        }

        function findNearestPassableTile(cx, cy, forUnit) {

            const visited = new Set([posKey(cx, cy)]);
            const queue = [{
                x: cx,
                y: cy,
                d: 0
            }];
            while (queue.length) {
                const cur = queue.shift();
                for (const [dx, dy] of [
                        [1, 0],
                        [-1, 0],
                        [0, 1],
                        [0, -1],
                        [1, 1],
                        [1, -1],
                        [-1, 1],
                        [-1, -1]
                    ]) {
                    const nx = cur.x + dx,
                        ny = cur.y + dy;
                    const key = posKey(nx, ny);
                    if (!isInside(nx, ny) || visited.has(key)) continue;
                    visited.add(key);
                    if (unitCanTraverse(forUnit, nx, ny) && !unitAt(nx, ny)) {
                        return {
                            x: nx,
                            y: ny
                        };
                    }
                    if (cur.d < 20) queue.push({
                        x: nx,
                        y: ny,
                        d: cur.d + 1
                    });
                }
            }
            return null;
        }

        function applyFallDamage(unit, fromZ, toZ, logPrefix) {
            if (!unit || unit.dead) return 0;
            if (typeof canFly === 'function' && canFly(unit)) return 0;
            const FALL_THRESHOLD = (typeof FALL_DAMAGE_THRESHOLD !== 'undefined') ? FALL_DAMAGE_THRESHOLD : 3;
            const FALL_PER_LEVEL = (typeof FALL_DAMAGE_PER_LEVEL !== 'undefined') ? FALL_DAMAGE_PER_LEVEL : 8;
            const drop = (fromZ ?? 0) - (toZ ?? 0);
            if (drop < FALL_THRESHOLD) return 0;
            // ⚖️ RACE_PHYSIQUE (2026-07-07): mass scales the landing. A fairy
            // drifts down at half damage; a golem craters at ×1.25; a kaiju
            // hits like a falling building (×1.5). Flyers stay exempt above.
            const _wMult = (typeof getUnitFallDamageMult === 'function') ? getUnitFallDamageMult(unit) : 1.0;
            const dmg = Math.max(1, Math.round((drop - (FALL_THRESHOLD - 1)) * FALL_PER_LEVEL * _wMult));
            const prefix = logPrefix || '';
            const _wNote = _wMult > 1 ? ' Their sheer mass makes it worse!' : (_wMult < 1 ? ' Their light frame softens the landing.' : '');
            addLog(`${prefix}${unitDisplayName(unit)} falls ${drop} levels and takes ${dmg} damage!${_wNote}`);
            applyDamageToUnit(unit, dmg, `Fall damage: `, { ignoreArmor: true });
            return dmg;
        }

        const BLOWBACK_DAMAGE = 3;

        function applyBlowback(unit, sourceX, sourceY, logPrefix) {
            if (!unit || unit.dead) return null;
            // ⚖️ Colossal races (RACE_PHYSIQUE ≥ 1000 kg) cannot be blown back.
            if (typeof getUnitWeightClass === 'function' && getUnitWeightClass(unit) === 'colossal') {
                addLog(`${logPrefix || ''}${unitDisplayName(unit)} is far too massive to be blown back!`);
                return null;
            }

            const rawDx = unit.x - sourceX;
            const rawDy = unit.y - sourceY;

            let pushDx = rawDx === 0 ? 0 : (rawDx > 0 ? 1 : -1);
            let pushDy = rawDy === 0 ? 0 : (rawDy > 0 ? 1 : -1);

            if (pushDx === 0 && pushDy === 0) {
                const dirs = [
                    [1, 0],
                    [-1, 0],
                    [0, 1],
                    [0, -1]
                ];
                const pick = dirs[randInt(dirs.length)];
                pushDx = pick[0];
                pushDy = pick[1];
            }

            if (pushDx !== 0 && pushDy !== 0) {
                if (Math.abs(rawDx) >= Math.abs(rawDy)) pushDy = 0;
                else pushDx = 0;
            }

            const fromX = unit.x,
                fromY = unit.y;

            const candidates = [{
                    x: unit.x + pushDx,
                    y: unit.y + pushDy
                },

                {
                    x: unit.x + pushDy,
                    y: unit.y - pushDx
                },
                {
                    x: unit.x - pushDy,
                    y: unit.y + pushDx
                },
            ];

            for (const c of candidates) {
                if (isInside(c.x, c.y) && unitCanTraverse(unit, c.x, c.y) && !unitAt(c.x, c.y)) {
                    const fromZ = unit.z ?? 0;
                    unit.x = c.x;
                    unit.y = c.y;
                    if (typeof nearestWalkableZ === 'function') unit.z = nearestWalkableZ(c.x, c.y, unit.z);
                    const prefix = logPrefix || '';
                    addLog(`${prefix}${unitDisplayName(unit)} is blown back from ${coordLabel(fromX, fromY)} to ${coordLabel(c.x, c.y)}!`);

                    if (BLOWBACK_DAMAGE > 0) {
                        applyDamageToUnit(unit, BLOWBACK_DAMAGE, `Blowback impact: `, {
                            ignoreArmor: true
                        });
                    }

                    applyFallDamage(unit, fromZ, unit.z ?? 0, prefix);

                    if (typeof animateDisplacement === 'function') {
                        animateDisplacement(unit, fromX, fromY, c.x, c.y, 200);
                    }
                    return {
                        pushed: true,
                        fromX,
                        fromY,
                        toX: c.x,
                        toY: c.y
                    };
                }
            }

            addLog(`${logPrefix || ''}${unitDisplayName(unit)} is slammed against an obstacle!`);
            applyDamageToUnit(unit, BLOWBACK_DAMAGE + 2, `Blowback crush: `, {
                ignoreArmor: true
            });
            return {
                pushed: false,
                fromX,
                fromY,
                toX: fromX,
                toY: fromY
            };
        }

        function applyAreaBlowback(centerX, centerY, tiles, ownerPlayer, logPrefix) {
            const results = [];
            if (!Array.isArray(tiles) || !tiles.length) return results;

            const seen = new Set();
            const targets = [];
            for (const tile of tiles) {
                if (!tile || !Number.isFinite(tile.x) || !Number.isFinite(tile.y)) continue;
                const target = unitAt(tile.x, tile.y);
                if (!target || target.dead || seen.has(target.id)) continue;

                if (ownerPlayer != null && target.player === ownerPlayer) continue;
                seen.add(target.id);
                targets.push(target);
            }

            for (const target of targets) {
                if (!target || target.dead) continue;
                const result = applyBlowback(target, centerX, centerY, logPrefix);
                if (result) results.push(result);
            }
            return results;
        }

        function rollWeatherTiles(tileRange, preferredTerrain, ignoresTerrain) {
            const count = tileRange[0] + randInt(tileRange[1] - tileRange[0] + 1);
            const size = bw(),
                sizeH = bh();

            let candidates = [];
            if (preferredTerrain) {
                for (let y = 0; y < sizeH; y++) {
                    for (let x = 0; x < size; x++) {
                        const t = getTerrainAt(x, y);
                        if (preferredTerrain === 'mountain') {

                            if (t !== 'mountain') {
                                const dirs = [
                                    [0, 1],
                                    [0, -1],
                                    [1, 0],
                                    [-1, 0]
                                ];
                                const nearMtn = dirs.some(([dx, dy]) => {
                                    const nx = x + dx,
                                        ny = y + dy;
                                    return nx >= 0 && nx < size && ny >= 0 && ny < sizeH && getTerrainAt(nx, ny) === 'mountain';
                                });
                                if (nearMtn) candidates.push({
                                    x,
                                    y
                                });
                            }
                        } else if (t === preferredTerrain) {
                            candidates.push({
                                x,
                                y
                            });
                        }
                    }
                }
            }

            let sx, sy;
            if (candidates.length > 0) {
                const seed = candidates[randInt(candidates.length)];
                sx = seed.x;
                sy = seed.y;
            } else {
                sx = randInt(size);
                sy = randInt(sizeH);
            }

            const tiles = [{
                x: sx,
                y: sy
            }];
            const seen = new Set([posKey(sx, sy)]);
            let attempts = 0;
            const maxAttempts = count * 20;
            while (tiles.length < count && attempts < maxAttempts) {
                attempts++;
                const base = tiles[randInt(tiles.length)];
                const dirs = [
                    [0, 1],
                    [0, -1],
                    [1, 0],
                    [-1, 0]
                ];
                const [dx, dy] = dirs[randInt(4)];
                const nx = base.x + dx,
                    ny = base.y + dy;
                if (nx >= 0 && nx < size && ny >= 0 && ny < sizeH && !seen.has(posKey(nx, ny))) {

                    if (!ignoresTerrain && getTerrainAt(nx, ny) === 'mountain') continue;
                    tiles.push({
                        x: nx,
                        y: ny
                    });
                    seen.add(posKey(nx, ny));
                }
            }
            return tiles;
        }

        function rollWeatherDirection() {
            const dirs = [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
                [1, 1],
                [1, -1],
                [-1, 1],
                [-1, -1]
            ];
            return dirs[randInt(dirs.length)];
        }

        function spawnWeather() {
            if (state.round < WEATHER_SPAWN_ROUND) return;
            if ((state.activeWeather || []).length >= WEATHER_MAX_ACTIVE) return;
            if (Math.random() > WEATHER_SPAWN_CHANCE) return;

            let availableKeys = WEATHER_KEYS;
            const type = availableKeys[randInt(availableKeys.length)];
            const def = WEATHER_REGISTRY[type];
            const dur = def.duration[0] + randInt(def.duration[1] - def.duration[0] + 1);
            const tiles = rollWeatherTiles(def.tiles, def.preferredTerrain || null, def.ignoresTerrain);
            // Homing storms are a single roaming vortex tile that hunts the nearest units.
            if (def.homing && tiles.length > 1) tiles.splice(1);
            const direction = def.roaming ? rollWeatherDirection() : null;
            const weather = {
                type,
                tiles,
                direction,
                remaining: dur,
                id: `w_${Date.now()}_${randInt(9999)}`
            };
            addLog(`${def.icon} ${def.label} forms on the battlefield! ${def.desc}`);

            // Remember WHERE the weather formed so the announcement banner can
            // frame it — a storm callout with the storm off-screen tells the
            // player nothing (see showAnnouncementBanner).
            state._lastWeatherSpawnTiles = tiles.map(t => ({ x: t.x, y: t.y }));

            if (def.instant) {
                queueAnnouncement(`${def.icon} ${def.label}`, def.desc, 'weather', { shake: 'hard' });

                const pendingHits = [];
                if (def.onSpawnEffect) {
                    const tileSet = new Set(tiles.map(t => posKey(t.x, t.y)));
                    for (const unit of state.units) {
                        if (unit.dead || !tileSet.has(posKey(unit.x, unit.y))) continue;

                        if (typeof isUnitAirborne === 'function' && isUnitAirborne(unit)) continue;
                        const eff = def.onSpawnEffect(unit);
                        if (eff && eff.type === 'damage') {
                            pendingHits.push({ unitId: unit.id, amount: eff.amount, text: eff.text });
                        }
                    }
                }
                let blowbackCenter = null;
                if (type === 'earthquake' && tiles.length > 0) {
                    blowbackCenter = {
                        cx: Math.round(tiles.reduce((s, t) => s + t.x, 0) / tiles.length),
                        cy: Math.round(tiles.reduce((s, t) => s + t.y, 0) / tiles.length),
                        tiles: tiles.map(t => ({ x: t.x, y: t.y }))
                    };
                }
                state._pendingEarthquake = { hits: pendingHits, blowback: blowbackCenter, def };
                addLog(`The ${def.label} ${def.icon} is over as quickly as it began.`);
            } else {
                queueAnnouncement(`${def.icon} ${def.label}`, def.desc, 'weather');
                if (!state.activeWeather) state.activeWeather = [];
                weather._casterUnitId = null;
                state.activeWeather.push(weather);
            }
        }

        function driftWeather(weather) {
            const def = WEATHER_REGISTRY[weather.type];
            // Homing storms move toward the nearest units in processHomingWeather, not by random drift.
            if (def.homing) return;
            if (!def.roaming || !weather.direction) return;
            const size = bw(),
                sizeH = bh();

            const oldTileKeys = new Set(weather.tiles.map(t => posKey(t.x, t.y)));
            const oldTiles = weather.tiles.map(t => ({
                x: t.x,
                y: t.y
            }));

            let dx = weather.direction[0],
                dy = weather.direction[1];

            if (Math.random() < 0.45) {
                if (Math.random() < 0.5) dx += (Math.random() < 0.5 ? 1 : -1);
                else dy += (Math.random() < 0.5 ? 1 : -1);
                dx = Math.max(-1, Math.min(1, dx));
                dy = Math.max(-1, Math.min(1, dy));
            }

            const speed = Math.random() < 0.20 ? 2 : 1;
            const newTiles = weather.tiles.map(t => ({
                x: Math.max(0, Math.min(size - 1, t.x + dx * speed)),
                y: Math.max(0, Math.min(sizeH - 1, t.y + dy * speed))
            }));

            const seen = new Set();
            weather.tiles = newTiles.filter(t => {
                const k = posKey(t.x, t.y);
                if (seen.has(k)) return false;
                seen.add(k);
                return true;
            });
        }

        function applyWeatherTurnEffects(player) {
            if (!state.activeWeather || !state.activeWeather.length) return;
            const units = player ? aliveUnitsFor(player) : state.units.filter(u => !u.dead);
            for (const weather of state.activeWeather) {
                const def = WEATHER_REGISTRY[weather.type];
                // Homing storms resolve all of their effects at end of round (processHomingWeather).
                if (def.homing) continue;
                if (!def.onTurnEffect) continue;
                const tileSet = new Set(weather.tiles.map(t => posKey(t.x, t.y)));
                for (const unit of units) {
                    if (unit.dead || !tileSet.has(posKey(unit.x, unit.y))) continue;
                    const eff = def.onTurnEffect(unit);
                    if (!eff) continue;
                    if (_bufferingRoundEvents) _reBeginGroup(`${def.icon} ${def.label} → ${unitDisplayName(unit)}`);
                    if (eff.type === 'damage') {
                        const weatherCaster = weather._casterUnitId ? unitFromId(weather._casterUnitId) : null;
                        applyDamageToUnit(unit, eff.amount, `${eff.text}`, {
                            ignoreArmor: false,
                            sourceUnit: weatherCaster || undefined
                        });
                        if (weather.type === 'thunderstorm' && window.ThreeLightning &&
                            !(state.devAutoSim && !state._devSimShowAnims)) {
                            ThreeLightning.strikeFromSky(unit.x, unit.y, {
                                durationMs: 300,
                                segments: 14,
                                jitter: 0.3,
                                branchChance: 0.35,
                                branchDepth: 1,
                                coreWidth: 6,
                                glowWidth: 18,
                                skyHeight: 650,
                            });
                        }
                    } else if (eff.type === 'heal') {
                        if (eff.hpAmount) applyHealingToUnit(unit, eff.hpAmount, null);
                        if (eff.mpAmount) {
                            const mpGain = Math.min(eff.mpAmount, Math.max(0, unit.maxMp - unit.mp));
                            if (mpGain > 0) {
                                unit.mp = Math.min(unit.maxMp, unit.mp + mpGain);
                                showFloatingTextForUnit(unit, `+${mpGain} MP`, 'mp');
                            }
                        }
                        addLog(eff.text);
                    }
                }

                if (def.convertTerrain) {
                    for (const t of weather.tiles) {
                        const terrain = getTerrainAt(t.x, t.y);
                        if (terrain && terrain !== def.convertTerrain &&
                            terrain !== 'mountain' && terrain !== 'chasm' &&
                            terrain !== 'void' && terrain !== 'lava') {
                            setTerrainAt(t.x, t.y, def.convertTerrain);
                        }
                    }
                }
            }
        }

        // End-of-round: homing storms (tornado, hurricane, thunderstorm, blizzard, sandstorm)
        // path toward and damage their two nearest units. Runs before end-of-round healing so
        // healing always resolves last. Cast storms only hunt the caster's enemies; natural
        // storms hunt both teams.
        function processHomingWeather(onDone) {
            const finish = () => { if (onDone) onDone(); };
            if (!state.activeWeather || !state.activeWeather.length) return finish();

            const size = bw(), sizeH = bh();
            const clamp = (v, max) => Math.max(0, Math.min(max - 1, v));

            // The renderer slides each vortex toward its new tile over ~420ms. We move
            // every storm first (Phase 1), let it glide on-screen, then apply damage and
            // displacement (Phase 2) so the storm visibly arrives before anyone is hit.
            const SLIDE_MS = 480;
            const pendingStrikes = [];
            let anyMoved = false;
            // The storm the camera will focus on and follow this round (prefer
            // one that actually strikes; otherwise the first that moves).
            let focusFrom = null, focusStrike = null;
            let _followLeadMs = 0;

            // Phase 1 — advance every homing vortex to its new position. No damage yet.
            for (const weather of state.activeWeather) {
                const def = WEATHER_REGISTRY[weather.type];
                if (!def || !def.homing) continue;

                const tiles = (weather.tiles && weather.tiles.length) ? weather.tiles : null;
                if (!tiles) continue;

                // Current eye position (homing storms are a single vortex tile).
                let cx = clamp(Math.round(tiles.reduce((s, t) => s + t.x, 0) / tiles.length), size);
                let cy = clamp(Math.round(tiles.reduce((s, t) => s + t.y, 0) / tiles.length), sizeH);

                // Eligible targets: living, grounded units. Cast storms spare the caster's team.
                const caster = weather._casterUnitId ? unitFromId(weather._casterUnitId) : null;
                const candidates = state.units.filter(u => {
                    if (!u || u.dead || u._dying) return false;
                    if (typeof isUnitAirborne === 'function' && isUnitAirborne(u)) return false;
                    if (caster && u.player === caster.player) return false;
                    return true;
                });
                if (!candidates.length) {
                    weather.tiles = [{ x: cx, y: cy }];
                    continue;
                }

                // Chase the single nearest unit (Chebyshev matches 8-way storm movement).
                const cheb = (u) => Math.max(Math.abs(u.x - cx), Math.abs(u.y - cy));
                candidates.sort((a, b) => cheb(a) - cheb(b));
                const lead = candidates[0];

                // Step toward the target, up to homingSpeed tiles, recording every tile the
                // vortex sweeps through this round (start tile + each step).
                const speed = def.homingSpeed || 1;
                let nx = cx, ny = cy;
                const sweptKeys = new Set([posKey(cx, cy)]);
                const sweptTiles = [{ x: cx, y: cy }];
                for (let step = 0; step < speed; step++) {
                    if (nx === lead.x && ny === lead.y) break;
                    nx = clamp(nx + Math.sign(lead.x - nx), size);
                    ny = clamp(ny + Math.sign(lead.y - ny), sizeH);
                    const k = posKey(nx, ny);
                    if (!sweptKeys.has(k)) { sweptKeys.add(k); sweptTiles.push({ x: nx, y: ny }); }
                }
                if (nx !== cx || ny !== cy) {
                    anyMoved = true;
                    if (!focusFrom) focusFrom = { fromX: cx, fromY: cy, toX: nx, toY: ny };
                }
                weather.tiles = [{ x: nx, y: ny }];

                // Converting storms (blizzard) freeze every tile they pass over.
                if (def.convertTerrain) {
                    for (const t of sweptTiles) {
                        const terrain = getTerrainAt(t.x, t.y);
                        if (terrain && terrain !== def.convertTerrain &&
                            terrain !== 'mountain' && terrain !== 'chasm' &&
                            terrain !== 'void' && terrain !== 'lava') {
                            setTerrainAt(t.x, t.y, def.convertTerrain);
                        }
                    }
                }

                // Only units the vortex actually touches (lands on / sweeps over) get hit.
                const struck = candidates.filter(u => sweptKeys.has(posKey(u.x, u.y)));
                if (!struck.length) {
                    addLog(`${def.icon} The ${def.label} closes in on ${unitDisplayName(lead)} at ${coordLabel(nx, ny)}.`);
                    continue;
                }

                if (!focusStrike) focusStrike = { fromX: cx, fromY: cy, toX: nx, toY: ny };
                pendingStrikes.push({ weather, def, caster, nx, ny, struck });
            }

            // Show the storms gliding to their new tiles before resolving their hits.
            if (typeof scheduleBoardRender === 'function') scheduleBoardRender();

            // Camera: pan to the homing storm and glide along its path so the
            // player watches the vortex hunt and strike. The battle camera
            // lives in another script's closure, so reach it via window.GAME.
            const _cam = (typeof window !== 'undefined' && window.GAME) ? window.GAME._camera : null;
            const _focus = focusStrike || focusFrom;
            if (_cam && _focus && !_skipVisuals() && !state.cameraDisabled
                && typeof getDefaultZoom === 'function') {
                _followLeadMs = 320;
                if (typeof _eorPhaseLabel === 'function') _eorPhaseLabel('End of Round — Storms');
                // Shared end-of-round tour zoom (honors an engaged user zoom);
                // falls back to the old local framing if battle.js hasn't
                // exposed the helper yet.
                const _stormZoom = (typeof getEorFocusZoom === 'function')
                    ? getEorFocusZoom() : getDefaultZoom() * 1.35;
                // Ride the player's resting tilt so the whole end-of-round tour
                // (overview → DoT pans → storm follow → regen) stays at one
                // consistent angle instead of swinging the camera each beat.
                const _stormTilt = (_cam._restTilt != null) ? _cam._restTilt : 52;
                // Swoop focus onto the storm's starting tile…
                _cam.moveTo({
                    x: _focus.fromX, y: _focus.fromY,
                    zoom: _stormZoom, tilt: _stormTilt,
                    duration: _followLeadMs, easing: 'easeInOut',
                    _fogAllowed: true, _allowZoomChange: true, _bypassCap: true
                });
                // …then glide with it to where it lands this round.
                if (_focus.toX !== _focus.fromX || _focus.toY !== _focus.fromY) {
                    window.setTimeout(() => {
                        if (state.phase !== 'battle' || state.cameraDisabled) return;
                        _cam.moveTo({
                            x: _focus.toX, y: _focus.toY,
                            zoom: _stormZoom, tilt: _stormTilt,
                            duration: SLIDE_MS, easing: 'linear',
                            _fogAllowed: true, _allowZoomChange: true, _bypassCap: true
                        });
                    }, _followLeadMs);
                }
            }

            // Phase 2 — now that the vortices have arrived, hurt and displace whoever
            // they swept over.
            const applyStrikes = () => {
                let actedVisibly = false;
                for (const ps of pendingStrikes) {
                    const { weather, def, caster, nx, ny, struck } = ps;
                    if (_bufferingRoundEvents) _reBeginGroup(`${def.icon} ${def.label} strikes`);

                    // Damage — and for tornado/hurricane, displace — everyone it caught.
                    for (const v of struck) {
                        if (!v || v.dead) continue;
                        const hit = def.homingDamage ? def.homingDamage(v) : null;
                        if (hit && hit.amount > 0) {
                            actedVisibly = true;
                            applyDamageToUnit(v, hit.amount, `${hit.text}`, {
                                ignoreArmor: false,
                                sourceUnit: caster || undefined
                            });
                            if (weather.type === 'thunderstorm' && window.ThreeLightning &&
                                !(state.devAutoSim && !state._devSimShowAnims)) {
                                ThreeLightning.strikeFromSky(v.x, v.y, {
                                    durationMs: 300,
                                    segments: 14,
                                    jitter: 0.3,
                                    branchChance: 0.35,
                                    branchDepth: 1,
                                    coreWidth: 6,
                                    glowWidth: 18,
                                    skyHeight: 650,
                                });
                            }
                        }
                        if (def.displaces && !v.dead) {
                            const pushes = def.displaceTiles || 2;
                            for (let p = 0; p < pushes; p++) {
                                const res = applyBlowback(v, nx, ny, `${def.icon} `);
                                if (!res || !res.pushed) break;
                                actedVisibly = true;
                            }
                        }
                    }
                }

                if (typeof scheduleBoardRender === 'function') scheduleBoardRender();

                if (actedVisibly && !_skipVisuals()) {
                    window.setTimeout(finish, 750);
                } else {
                    finish();
                }
            };

            // Wait out the camera focus-in and the storm's slide before
            // resolving hits, so the vortex visibly arrives (and the camera
            // catches up to it) before anyone is struck.
            if (!_skipVisuals() && (anyMoved || _followLeadMs > 0)) {
                window.setTimeout(applyStrikes, _followLeadMs + (anyMoved ? SLIDE_MS : 0));
            } else {
                applyStrikes();
            }
        }

        function tickWeather() {
            if (!state.activeWeather) return;
            for (const weather of state.activeWeather) {
                driftWeather(weather);
                weather.remaining -= 1;
            }
            const expiring = state.activeWeather.filter(w => w.remaining <= 0);
            for (const w of expiring) {
                const def = WEATHER_REGISTRY[w.type];
                addLog(`The ${def.label} ${def.icon} dissipates.`);
            }
            state.activeWeather = state.activeWeather.filter(w => w.remaining > 0);
        }

        function getWeatherAtTile(x, y) {
            if (!state.activeWeather) return [];
            const key = posKey(x, y);
            return state.activeWeather
                .filter(w => w.tiles.some(t => posKey(t.x, t.y) === key))
                .map(w => WEATHER_REGISTRY[w.type]);
        }

        function getWeatherStatMod(unit) {
            const mods = {
                atk: 0,
                def: 0,
                move: 0,
                awr: 0,
                int: 0,
                rng: 0
            };
            if (!unit || unit.dead || !state.activeWeather) return mods;
            const key = posKey(unit.x, unit.y);
            for (const w of state.activeWeather) {
                if (!w.tiles.some(t => posKey(t.x, t.y) === key)) continue;
                const def = WEATHER_REGISTRY[w.type];
                if (def.statMod) {
                    for (const k in def.statMod) mods[k] = (mods[k] || 0) + def.statMod[k];
                }
                if (def.conditionalStatMod) {
                    const cond = def.conditionalStatMod(unit);
                    for (const k in cond) mods[k] = (mods[k] || 0) + cond[k];
                }
            }
            return mods;
        }

        function getWeatherHealMult(x, y) {
            if (!state.activeWeather) return 1;
            let mult = 1;
            const key = posKey(x, y);
            for (const w of state.activeWeather) {
                if (!w.tiles.some(t => posKey(t.x, t.y) === key)) continue;
                const def = WEATHER_REGISTRY[w.type];
                if (def.healMult != null) mult *= def.healMult;
            }
            return mult;
        }

        // Pick a starting race for a default-party slot that the local human
        // (player 1) actually owns. The archetype default race (e.g. Gunslinger
        // -> martian) is often a locked vessel, which would make the team fail
        // the unlock gate on Lock In / Start. If that default isn't unlocked,
        // fall back to an owned race whose default job matches the slot, then to
        // any owned race. Returns undefined to keep the archetype default when
        // no unlock list applies (dev unlock, etc.).
        function ownedRaceForJobSlot(job) {
            if (typeof isUnitUnlocked !== 'function') return undefined;
            const archetypeRace = (getArchetypeForJob(job) || {}).race;
            // Keep the archetype default when the player already owns it.
            if (archetypeRace && isUnitUnlocked(archetypeRace)) return archetypeRace;
            if (typeof AVAILABLE_RACES === 'undefined' || typeof RACE_DEFAULT_JOBS === 'undefined') {
                return undefined;
            }
            // Prefer an owned vessel whose natural job matches this slot.
            const sameJob = AVAILABLE_RACES.filter(r => RACE_DEFAULT_JOBS[r] === job && isUnitUnlocked(r));
            if (sameJob.length) return sameJob[0];
            // Otherwise any owned vessel keeps the team legal.
            const anyOwned = AVAILABLE_RACES.filter(r => isUnitUnlocked(r));
            if (anyOwned.length) return anyOwned[0];
            return undefined;
        }

        // CPU counterpart of ownedRaceForJobSlot: the CPU ignores account
        // unlocks but must still obey the 3D-only roster rule — if a slot's
        // archetype default race has no rigged 3D model (e.g. White Mage ->
        // angel), swap in a 3D-ready race, preferring one with the same
        // default job, so matches stay 3D vs 3D.
        function cpu3DRaceForJobSlot(job) {
            if (typeof isRace3DReady !== 'function') return undefined;
            const archetypeRace = (getArchetypeForJob(job) || {}).race;
            if (archetypeRace && isRace3DReady(archetypeRace)) return archetypeRace;
            if (typeof AVAILABLE_RACES === 'undefined' || typeof RACE_DEFAULT_JOBS === 'undefined') {
                return undefined;
            }
            const sameJob = AVAILABLE_RACES.filter(r => RACE_DEFAULT_JOBS[r] === job && isRace3DReady(r));
            if (sameJob.length) return sameJob[0];
            const any3D = AVAILABLE_RACES.filter(r => isRace3DReady(r));
            if (any3D.length) return any3D[0];
            return undefined;
        }

        function makeDefaultPartyMeta() {
            const out = {
                1: [],
                2: []
            };
            [1, 2].forEach(player => {
                const builds = (typeof DEFAULT_BUILDS !== 'undefined' ? DEFAULT_BUILDS[player] : []) || [];
                const size = Math.max(CONFIG.teamSize, builds.length);
                for (let i = 0; i < size; i++) {
                    const job = builds[i] || 'Gunslinger';
                    // Only the local human (player 1) is gated on unlocks; the
                    // CPU is gated on 3D-model availability instead.
                    const identity = (player === 1) ? { race: ownedRaceForJobSlot(job) }
                                                    : { race: cpu3DRaceForJobSlot(job) };
                    out[player].push(resolveIdentityForBuild(job, identity));
                }
            });
            return out;
        }

        function ensurePartyMeta() {
            if (!state.partyMeta) state.partyMeta = makeDefaultPartyMeta();
            [1, 2].forEach(player => {
                if (!Array.isArray(state.partyMeta[player])) state.partyMeta[player] = [];
                const size = Math.max(CONFIG.teamSize, state.partyBuilds?.[player]?.length || 0);
                for (let i = 0; i < size; i++) {
                    if (!state.partyMeta[player][i]) {
                        const job = (state.partyBuilds?.[player]?.[i]) || 'Gunslinger';
                        const identity = (player === 1) ? { race: ownedRaceForJobSlot(job) }
                                                        : { race: cpu3DRaceForJobSlot(job) };
                        state.partyMeta[player][i] = resolveIdentityForBuild(job, identity);
                    }
                }
            });
            return state.partyMeta;
        }

        function normalizeJobName(job) {
            return job === 'Black Mage' ? 'Black Mage' : job;
        }

        function getArchetypeForJob(job) {
            return JSON.parse(JSON.stringify(JOB_ARCHETYPES[normalizeJobName(job)] || JOB_ARCHETYPES['Gunslinger']));
        }

        function normalizeRaceKey(race) {
            return String(race || '').trim().toLowerCase();
        }

        function getRaceProfile(race, fallbackJob = 'Gunslinger') {
            const key = normalizeRaceKey(race);
            if (RACE_PROFILES[key]) return JSON.parse(JSON.stringify(RACE_PROFILES[key]));
            const archetype = getArchetypeForJob(fallbackJob);
            const fallbackKey = normalizeRaceKey(archetype.race || 'homosapien');
            return JSON.parse(JSON.stringify(RACE_PROFILES[fallbackKey] || RACE_PROFILES.homosapien));
        }

        function getTerrainPreferenceForRace(race) {

            const r = (race || '').toLowerCase();

            if (r === 'siren') return 'deep_water';

            if (r === 'reptilian') return 'water';
            if (r === 'ghost') return 'deep_water';

            if (r === 'demon') return 'lava';
            if (r === 'djinn') return 'lava';
            if (r === 'succubus') return 'lava';

            if (r === 'anubis') return 'desert';

            if (r === 'skeleton') return 'wasteland';

            if (r === 'bigfoot') return 'tree';
            if (r === 'fairy') return 'tree';
            if (r === 'werewolf') return 'tree';
            if (r === 'shadow entity') return 'tree';
            if (r === 'skinwalker') return 'tree';
            if (r === 'catgirl') return 'tree';
            if (r === 'mothman') return 'tree';
            if (r === 'scarecrow') return 'tree';

            if (r === 'giant') return 'mountain';
            if (r === 'cyclops') return 'mountain';
            if (r === 'gargoyle') return 'mountain';

            if (r === 'zombie') return 'wasteland';
            if (r === 'robot') return 'wasteland';
            if (r === 'mech') return 'wasteland';
            if (r === 'android') return 'wasteland';
            if (r === 'ai') return 'wasteland';
            if (r === 'glitch') return 'wasteland';
            if (r === 'cyborg') return 'wasteland';
            if (r === 'cosmic wraith') return 'wasteland';

            if (r === 'demon prince') return 'lava';
            if (r === 'demon princess') return 'lava';
            if (r === 'halfdemon') return 'lava';
            if (r === 'goatman') return 'lava';

            if (r === 'mermaid') return 'deep_water';

            if (r === 'nephilim') return 'mountain';

            if (r === 'vampire') return 'tree';
            if (r === 'dreameater') return 'tree';
            if (r === 'superhero') return 'grass';
            if (r === 'fallen angel') return 'desert';
            if (r === 'voidweaver') return 'tree';

            if (r === 'atlantean') return 'deep_water';
            if (r === 'dinosaur') return 'tree';
            if (r === 'dragon') return 'lava';
            if (r === 'ghoul') return 'wasteland';
            if (r === 'gnome') return 'mountain';
            if (r === 'kaiju') return 'wasteland';
            if (r === 'kraken') return 'deep_water';
            if (r === 'loch ness monster') return 'deep_water';
            if (r === 'yeti') return 'mountain';

            return 'none';
        }

        function resolveIdentityForBuild(job, identity = {}) {
            const archetype = getArchetypeForJob(job);
            const race = normalizeRaceKey(identity.race || archetype.race || 'homosapien') || 'homosapien';
            const raceProfile = getRaceProfile(race, job);

            const defaultHand = job === 'Black Mage' ? 'left' : 'right';

            const validGenders = (typeof getAvailableGendersForRace === 'function')
                ? getAvailableGendersForRace(race) : ['male', 'female'];
            let gender = identity.gender;
            if (!gender || !validGenders.includes(gender)) {
                gender = validGenders[randInt(validGenders.length)];
            }
            return {
                race,
                faction: raceProfile.faction,
                types: [...(raceProfile.types || [])],
                gender,
                zodiac: identity.zodiac || archetype.zodiac || 'aries',
                sleepPreference: identity.sleepPreference || archetype.sleepPreference || 'none',
                terrainPreference: getTerrainPreferenceForRace(race),
                weatherPreference: identity.weatherPreference || archetype.weatherPreference || 'none',
                dominantHand: identity.dominantHand || defaultHand
            };
        }

        function randomizeIdentity(ownedOnly) {
            let pool = AVAILABLE_RACES;
            // 3D-only roster rule: random picks (both the player's and the
            // CPU's) never land on a race without a rigged 3D model.
            if (typeof isRace3DReady === 'function') {
                const ready3D = pool.filter(r => isRace3DReady(r));
                if (ready3D.length) pool = ready3D;
            }
            if (ownedOnly && typeof isUnitUnlocked === 'function') {
                const owned = pool.filter(r => isUnitUnlocked(r));
                if (owned.length) pool = owned;
            }
            const race = pool[randInt(pool.length)];
            const raceProfile = getRaceProfile(race);
            const zodiac = AVAILABLE_ZODIACS[randInt(AVAILABLE_ZODIACS.length)];
            const sleep = AVAILABLE_SLEEP_PREFERENCES[randInt(AVAILABLE_SLEEP_PREFERENCES.length)];

            const validGenders = (typeof getAvailableGendersForRace === 'function')
                ? getAvailableGendersForRace(race) : ['male', 'female'];
            const gender = validGenders[randInt(validGenders.length)];
            return {
                race,
                faction: raceProfile.faction,
                types: [...(raceProfile.types || [])],
                gender,
                zodiac,
                sleepPreference: sleep,
                terrainPreference: getTerrainPreferenceForRace(race),
                weatherPreference: 'none',
                dominantHand: Math.random() < 0.85 ? 'right' : 'left'
            };
        }

        function randomizePartyIdentities(count, ownedOnly) {
            const metas = Array.from({ length: count }, () => randomizeIdentity(ownedOnly));

            const bothIdxs = [];
            for (let i = 0; i < metas.length; i++) {
                const avail = (typeof getAvailableGendersForRace === 'function')
                    ? getAvailableGendersForRace(metas[i].race) : ['male'];
                if (avail.length >= 2) bothIdxs.push(i);
            }

            if (bothIdxs.length >= 2) {
                const genders = bothIdxs.map(i => metas[i].gender);
                const allSame = genders.every(g => g === genders[0]);
                if (allSame) {
                    const opposite = genders[0] === 'male' ? 'female' : 'male';

                    const toFlip = Math.max(1, Math.floor(bothIdxs.length / 2));

                    for (let i = bothIdxs.length - 1; i > 0; i--) {
                        const j = randInt(i + 1);
                        [bothIdxs[i], bothIdxs[j]] = [bothIdxs[j], bothIdxs[i]];
                    }
                    for (let k = 0; k < toFlip; k++) {
                        metas[bothIdxs[k]].gender = opposite;
                    }
                }
            }
            return metas;
        }

        function getTypeEffectSummary(attackerTypes = [], defenderTypes = []) {
            let hasStrong = false;
            let hasWeak = false;
            for (const atkType of attackerTypes) {
                const chart = TYPE_CHART[atkType];
                if (!chart) continue;
                for (const defType of defenderTypes) {
                    if (chart.strongVs.includes(defType)) hasStrong = true;
                    if (chart.weakVs.includes(defType)) hasWeak = true;
                }
            }
            return {
                hasStrong,
                hasWeak
            };
        }

        function getTypeDamageMultiplier(sourceUnit, targetUnit, spellType) {
            if (!sourceUnit || !targetUnit) return 1;

            let effectMult = 1;
            let stabMult = 1;

            if (spellType) {

                const summary = getTypeEffectSummary([spellType], targetUnit.types || []);
                if (summary.hasStrong && !summary.hasWeak) effectMult = 1.30;
                else if (summary.hasWeak && !summary.hasStrong) effectMult = 0.75;

                const casterTypes = sourceUnit.types || [];
                if (casterTypes.includes(spellType)) {
                    stabMult = (typeof STAB_MULTIPLIER !== 'undefined') ? STAB_MULTIPLIER : 1.25;
                }
            } else {

                const summary = getTypeEffectSummary(sourceUnit.types || [], targetUnit.types || []);
                if (summary.hasStrong && !summary.hasWeak) effectMult = 1.30;
                else if (summary.hasWeak && !summary.hasStrong) effectMult = 0.75;
            }

            return effectMult * stabMult;
        }

        function getTypeCombatNote(sourceUnit, targetUnit, spellType) {
            if (!sourceUnit || !targetUnit) return '';
            const mult = getTypeDamageMultiplier(sourceUnit, targetUnit, spellType);
            const hasStab = spellType && (sourceUnit.types || []).includes(spellType);
            if (mult > 1.3) return hasStab ? "STAB! It's super effective!" : "It's super effective!";
            if (mult > 1.0 && mult <= 1.3) return hasStab ? "STAB!" : "It's super effective!";
            if (mult < 1.0 && mult >= 0.75) return "It wasn't very effective...";
            if (mult < 0.75) return "STAB, but not very effective...";
            if (hasStab) return "STAB!";
            return '';
        }

        function getFactionSynergyName(faction) {
            if (faction === 'space') return 'Bulwark';
            if (faction === 'time') return 'Restoration';
            if (faction === 'chaos') return 'Fury';
            return '';
        }

        function getFactionUnitCount(player, faction) {
            return state.units.filter(u => u.player === player && !u.dead && u.faction === faction).length;
        }

        function hasFactionSynergy(player, faction) {
            return getFactionUnitCount(player, faction) >= 2;
        }

        function getTerrainPreferenceModifier(unit) {
            if (!unit || !unit.terrainPreference || unit.terrainPreference === 'none') {
                return {
                    atk: 0,
                    armor: 0,
                    int: 0,
                    awr: 0,
                    move: 0,
                    label: ''
                };
            }
            const terrain = getTerrainAt(unit.x, unit.y);
            if (terrain !== unit.terrainPreference) {
                return {
                    atk: 0,
                    armor: 0,
                    int: 0,
                    awr: 0,
                    move: 0,
                    label: ''
                };
            }
            const label = `${getTerrainRule(terrain).label} Affinity`;
            if (terrain === 'grass') return {
                atk: 8,
                armor: 0,
                int: 0,
                awr: 1,
                move: 1,
                label
            };
            if (terrain === 'water') return {
                atk: 0,
                armor: 5,
                int: 5,
                awr: 1,
                move: 0,
                label
            };
            if (terrain === 'deep_water') return {
                atk: 0,
                armor: 5,
                int: 5,
                awr: 1,
                move: 1,
                label
            };
            if (terrain === 'desert') return {
                atk: 8,
                armor: 0,
                int: 5,
                awr: 0,
                move: 0,
                label
            };
            if (terrain === 'mountain') return {
                atk: 0,
                armor: 5,
                int: 0,
                awr: 1,
                move: 1,
                label
            };
            return {
                atk: 0,
                armor: 0,
                int: 0,
                awr: 0,
                move: 0,
                label
            };
        }

        function getTerrainMoveCost(unit, x, y, z) {

            const _has3D = typeof getTerrainAt3D === 'function' && state.boardColumns?.length > 0;
            const terrain = (_has3D && z !== undefined && z !== null)
                ? getTerrainAt3D(x, y, z)
                : getTerrainAt(x, y);
            const rule = getTerrainRule(terrain);

            const _ovrObj = (typeof getObjectAt === 'function') ? getObjectAt(x, y) : null;
            if (_ovrObj && typeof OBJECT_RULES !== 'undefined' && OBJECT_RULES[_ovrObj]) {
                const _ovrRule = OBJECT_RULES[_ovrObj];
                if (_ovrRule.overridesGround) return 1;
            }
            let cost = rule.moveCost || 1;

            if ((terrain === 'mountain' || terrain === 'mountain_2') && unitHasClimbingBoots(unit)) {
                cost = 1;
            }

            if ((terrain === 'mountain' || terrain === 'mountain_2') && unitIsMountainTraverser(unit)) {
                cost = 1;
            }

            if (canFly(unit)) {
                if (terrain === 'lava' || terrain === 'chasm' || terrain === 'void' || terrain === 'cloud_gap') {
                    cost = 2;
                }
                if (terrain === 'mountain' || terrain === 'mountain_2') {
                    cost = 1;
                }

                if (terrain === 'deep_water') {
                    cost = 1;
                }
            }

            const obj = (typeof getObjectAt === 'function') ? getObjectAt(x, y) : null;
            const hasTreeObject = obj === 'tree' || (typeof obj === 'string' && obj.startsWith('tree_'));
            /* Legacy forest terrains (now converted to grass+tree at map load) + tree objects */
            if ((terrain === 'tree' || terrain === 'forest' || terrain === 'forest_2' || hasTreeObject) && unitIsForestAdapted(unit)) {
                cost = 1;
            }

            if (unit?.race === 'reptilian' && (terrain === 'water' || terrain === 'deep_water')) {
                cost = 1;
            }

            if (unit?.race === 'siren' && (terrain === 'deep_water' || terrain === 'water')) {
                cost = 1;
            }

            if (terrain === 'deep_water' && unitIsDeepWaterAdapted(unit)) {
                cost = Math.min(cost, 1);
            }

            if (terrain === 'lava' && unitIsLavaAdapted(unit)) {
                cost = 1;
            }

            if (terrain === 'desert' && unitIsDesertAdapted(unit)) {
                cost = 1;
            }

            if (terrain === 'wasteland' && unitIsWastelandAdapted(unit)) {
                cost = 1;
            }
            if (unit?.terrainPreference && unit.terrainPreference === terrain) {
                cost = Math.max(1, cost - 1);
            }

            if (obj && typeof OBJECT_RULES !== 'undefined' && OBJECT_RULES[obj]) {
                const oRule = OBJECT_RULES[obj];
                if (oRule.moveCostAdd && !hasTreeObject) {
                    cost += oRule.moveCostAdd;
                } else if (oRule.moveCostAdd && hasTreeObject && !unitIsForestAdapted(unit)) {
                    cost += oRule.moveCostAdd;
                }
            }
            return cost;
        }

        // Flat damage soaked per point of the relevant defense stat. Physical
        // attacks are mitigated by DEF, magical attacks by MDEF.
        const DEFENSE_DAMAGE_REDUCTION = 0.25;

        // damageType: 'physical' (default) folds DEF into armor, 'magic' folds
        // MDEF in, anything else (e.g. 'dot', 'none') adds no defense-stat soak
        // so callers that only want gear/status armor can pass 'none'.
        // DEF/MDEF axis split: DEF-axis statuses & stages (Glare, Guard Break,
        // Inspired, Phalanx…) only soak physical hits; MDEF-axis statuses &
        // stages (Veil of Light, Tin Foil Hat, Psychosis, 5G Tower…) only soak
        // magic. Gear armor and everything else stays universal.
        function getEffectiveArmor(unit, damageType) {
            const dt = damageType || 'physical';
            const baseArmor = unit?.armor || 0;
            const sleepMod = getSleepAffinityModifier(unit).armor || 0;
            const terrainMod = getTerrainPreferenceModifier(unit).armor || 0;
            const weatherMod = getWeatherStatMod(unit).def || 0;
            const spaceArmor = (!unit || unit.faction !== 'space' || !hasFactionSynergy(unit.player, 'space')) ? 0 : Math.max(1, Math.round((unit.def || 0) * 0.20));
            const timeArmor = (!unit || unit.faction !== 'time' || !hasFactionSynergy(unit.player, 'time')) ? 0 : 1;

            // 5G towers broadcast a mind-scrambling signal: MDEF-only penalty.
            let fiveGPenalty = 0;
            if (dt === 'magic' && unit && state.turrets) {
                for (const t of state.turrets) {
                    if (t.hp > 0 && t.auraDebuff && t.owner !== unit.player) {
                        const dist = Math.abs(unit.x - t.x) + Math.abs(unit.y - t.y);
                        if (dist <= t.range) {
                            fiveGPenalty += (t.auraDefReduction || 2);
                        }
                    }
                }
            }
            const statusDelta = dt === 'magic'
                ? (typeof getStatusMdefDelta === 'function' ? getStatusMdefDelta(unit) : 0)
                : getStatusArmorDelta(unit);
            let armor = Math.max(0, baseArmor + spaceArmor + timeArmor + sleepMod + terrainMod + weatherMod + statusDelta - fiveGPenalty);

            armor += (unit._bossBuffDef || 0);
            const sky = getSkyEventBonus(unit);
            if (sky.defMult !== 1) armor = Math.max(0, Math.round(armor * sky.defMult));
            armor = Math.max(0, Math.round(armor * getZodiacBonus(unit).mult));

            // Fold the relevant defense stat into the flat damage soak.
            if (dt === 'physical') {
                armor += Math.floor((unit?.def || 0) * DEFENSE_DAMAGE_REDUCTION);
            } else if (dt === 'magic') {
                armor += Math.floor((unit?.mdef || 0) * DEFENSE_DAMAGE_REDUCTION);
            }
            return Math.max(0, armor);
        }

        function getEffectiveHealBonus(unit, baseAmount = 0, target = null) {
            const baseBonus = unit?.healBonus || 0;
            const synergy = (!unit || unit.faction !== 'time' || !hasFactionSynergy(unit.player, 'time')) ? 0 : Math.max(1, Math.round(baseAmount * 0.2));
            const terrainMult = target ? getTerrainHealMultiplier(target.x, target.y, target) : 1;
            const skyMult = getSkyEventBonus(unit).healMult || 1;
            const weatherHealMult = target ? getWeatherHealMult(target.x, target.y) : 1;
            const zodiacMult = getZodiacBonus(unit).mult;
            return Math.round((baseBonus + synergy) * terrainMult * skyMult * weatherHealMult * zodiacMult);
        }

        function getEffectiveRevivePct(unit, basePct = 0.35) {
            if (!unit) return basePct;
            const bonus = (unit.faction === 'time' && hasFactionSynergy(unit.player, 'time')) ? 0.08 : 0;
            const skyMult = getSkyEventBonus(unit).healMult || 1;
            const weatherHealMult = unit ? getWeatherHealMult(unit.x, unit.y) : 1;
            return Math.max(0.1, Math.min(0.75, (basePct + bonus) * skyMult * weatherHealMult));
        }

        // axis: 'physical' (default) counts ATK-axis statuses/stages (Overclock,
        // Inspired, Discord…); 'magic' counts INT-axis statuses/stages instead
        // (Dark Pact, Harmonize, Neuralyzer, Drowsy…). Environmental, faction
        // and streak bonuses feed both axes.
        function getEffectiveAttackBonus(unit, axis) {
            const sleepMod = getSleepAffinityModifier(unit).atk || 0;
            const terrainMod = getTerrainPreferenceModifier(unit).atk || 0;
            const weatherMod = getWeatherStatMod(unit).atk || 0;
            const synergy = (!unit || unit.faction !== 'chaos' || !hasFactionSynergy(unit.player, 'chaos')) ? 0 : 16;
            const streakBonus = getStreakAtkBonus(unit);
            const floorBonus = getSectionBuffs(unit).atk || 0;
            const statusDelta = (axis === 'magic' && typeof getStatusIntDelta === 'function')
                ? getStatusIntDelta(unit)
                : getStatusAtkDelta(unit);
            let bonus = synergy + sleepMod + terrainMod + weatherMod + streakBonus + floorBonus + statusDelta;
            const sky = getSkyEventBonus(unit);
            if (sky.atkMult !== 1) bonus = Math.round(bonus * sky.atkMult);
            bonus = Math.round(bonus * getZodiacBonus(unit).mult);
            return bonus;
        }

        function getEffectiveInt(unit) {
            if (!unit) return 0;
            const sleepMod = getSleepAffinityModifier(unit).int || 0;
            const terrainMod = getTerrainPreferenceModifier(unit).int || 0;
            const weatherMod = getWeatherStatMod(unit).int || 0;
            // INT-axis statuses (intDelta) + INT stages, via the shared getter.
            const stageMod = (typeof getStatusIntDelta === 'function') ? getStatusIntDelta(unit)
                : (typeof getStatStageDelta === 'function') ? getStatStageDelta(unit, 'int') : 0;
            return Math.max(0, Math.round(((unit.intStat || 0) + sleepMod + terrainMod + weatherMod + stageMod) * getZodiacBonus(unit).mult));
        }

        function getStatusAwrOverride(unit) {
            if (!unit) return null;
            return getActiveStatusKeys(unit).reduce((override, key) => {
                const value = STATUS_DEFS[key]?.awrSet;
                return value == null ? override : value;
            }, null);
        }

        function getEffectiveAwr(unit) {
            if (!unit) return 0;
            const override = getStatusAwrOverride(unit);
            if (override != null) return Math.max(0, override);
            const sleepMod = getSleepAffinityModifier(unit).awr || 0;
            const terrainMod = getTerrainPreferenceModifier(unit).awr || 0;
            const weatherMod = getWeatherStatMod(unit).awr || 0;
            return Math.max(0, Math.round(((unit.awr || 0) + sleepMod + terrainMod + weatherMod) * getZodiacBonus(unit).mult));
        }

        function getEffectiveInspect(unit) {
            if (!unit) return 0;

            return Math.max(1, unit.inspect || 1);
        }

        function getInspectTileCount(unit) {
            if (!unit) return 1;
            return Math.max(1, getEffectiveAwr(unit));
        }

        function getDebuffIntModifier(sourceUnit, targetUnit) {
            if (!sourceUnit || !targetUnit) return 0;
            const diff = getEffectiveInt(sourceUnit) - getEffectiveInt(targetUnit);
            return Math.max(-0.18, Math.min(0.18, diff * 0.03));
        }

        function getStatusApplyChance(sourceUnit, targetUnit, payload = {}) {
            const baseByStatus = {
                burn: 0.84,
                poison: 0.84,
                marked: 0.88,
                guardBreak: 0.9,
                stun: 0.86,
                jammed: 0.8,
                silence: 0.82,
                charm: 0.8,
                sleep: 0.82,
                freeze: 0.84,
                sirenSong: 0.8,
                stagger: 0.9,
                slow: 0.9,
                drowsy: 0.9,
                glare: 0.9,
                discord: 0.9
            };
            const base = Number(payload.chance ?? baseByStatus[payload.id] ?? 1);
            if (!sourceUnit || !targetUnit || sourceUnit.player === targetUnit.player || base >= 0.999) return Math.max(0, Math.min(1, base));
            return Math.max(0.6, Math.min(0.95, base + getDebuffIntModifier(sourceUnit, targetUnit)));
        }

        function getComboKey(weaponA, weaponB) {
            if (!weaponA || !weaponB) return null;
            return [weaponA, weaponB].sort().join('|');
        }

        function getComboForUnits(unitA, unitB) {
            const typeA = (unitA.types || [])[0];
            const typeB = (unitB.types || [])[0];
            if (!typeA || !typeB) return null;
            const key = [typeA, typeB].sort().join('|');
            const combo = COMBO_REGISTRY[key];
            if (!combo) return null;
            return {
                ...combo,
                key,
                typeA,
                typeB
            };
        }

        const COMBO_COOLDOWN_ROUNDS = 3;

        function getComboPartners(unit, requireEnemyInRange = true) {
            if (!unit || unit.dead) return [];
            if (!unitCanCombo(unit)) return [];
            if ((unit.ap || 0) < COMBO_AP_COST_INITIATOR) return [];
            const rd = state.round || 0;
            if (rd - (unit._lastComboRound || -99) < COMBO_COOLDOWN_ROUNDS) return [];

            const partners = aliveUnitsOnFloor(unit.player).filter(a =>
                a.id !== unit.id &&
                (a.ap || 0) >= COMBO_AP_COST_PARTNER &&
                Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y) === 1 &&
                getComboForUnits(unit, a) !== null &&
                (rd - (a._lastComboRound || -99)) >= COMBO_COOLDOWN_ROUNDS
            );
            if (!requireEnemyInRange) return partners;

            const enemies = aliveUnitsOnFloor(unit.player === 1 ? 2 : 1);
            return partners.filter(partner => {
                const combo = getComboForUnits(unit, partner);
                if (!combo) return false;
                const comboRange = combo.range || 1;

                return enemies.some(e => {
                    const d1 = Math.abs(unit.x - e.x) + Math.abs(unit.y - e.y);
                    const d2 = Math.abs(partner.x - e.x) + Math.abs(partner.y - e.y);
                    return d1 <= comboRange || d2 <= comboRange;
                });
            });
        }

        function getComboTypeSynergy(unitA, unitB) {
            const typesA = unitA.types || [];
            const typesB = unitB.types || [];
            const shared = typesA.filter(t => typesB.includes(t));
            if (shared.length > 0) return {
                mult: 1.30,
                label: 'Same-type synergy!'
            };

            return {
                mult: 1.0,
                label: null
            };
        }

        function getComboTypeSynergyVsTarget(unitA, unitB, target) {
            const base = getComboTypeSynergy(unitA, unitB);

            const targetTypes = target?.types || [];
            let typeBonus = 0;
            for (const atkType of [...(unitA.types || []), ...(unitB.types || [])]) {
                const chart = TYPE_CHART[atkType];
                if (chart) {
                    for (const tType of targetTypes) {
                        if (chart.strongVs.includes(tType)) typeBonus += 0.15;
                        if (chart.weakVs && chart.weakVs.includes(tType)) typeBonus -= 0.10;
                    }
                }
            }
            return {
                mult: base.mult + typeBonus,
                label: base.label,
                typeBonus
            };
        }

        let SPAWNS = {
            1: [{x:0,y:2},{x:0,y:3},{x:0,y:4},{x:0,y:5}],
            2: [{x:7,y:2},{x:7,y:3},{x:7,y:4},{x:7,y:5}]
        };

        function emptyLoadout() {
            return {
                spells: Array(CONFIG.unitSkillSlots).fill(''),
                items: {
                    healPotion: 0,
                    manaPotion: 0,
                    scanner: 0,
                    humanBane: 0,
                    divineBane: 0,
                    unholyBane: 0,
                    techBane: 0,
                    anomalyBane: 0,
                    alienBane: 0,
                    panacea: 0,
                    warpStone: 0
                },
                equipment: emptyEquipment()
            };
        }

        function getItemCapForClass(cls, itemKey) {
            if (itemKey === 'scanner') return cls === 'Agent' ? 2 : 1;
            return ITEM_RULES[itemKey].max;
        }

        function normalizeLoadoutForClass(loadout, cls) {
            const normalized = emptyLoadout();
            normalized.spells = [];
            for (const [iKey, iRule] of Object.entries(ITEM_RULES)) {
                const cap = getItemCapForClass(cls, iKey);
                normalized.items[iKey] = Math.max(0, Math.min(cap, Number(loadout?.items?.[iKey] || 0)));
            }
            let totalItems = Object.values(normalized.items).reduce((a, b) => a + b, 0);
            while (totalItems > CONFIG.unitItemSlots) {
                const trimOrder = Object.keys(ITEM_RULES).filter(k => ITEM_RULES[k].baneType).concat(['manaPotion','healPotion','scanner']);
                let trimmed = false;
                for (const k of trimOrder) { if (normalized.items[k] > 0) { normalized.items[k]--; trimmed = true; break; } }
                if (!trimmed) break;
                totalItems = Object.values(normalized.items).reduce((a, b) => a + b, 0);
            }

            normalized.equipment = { accessory1: null, accessory2: null };
            if (loadout?.equipment) {
                normalized.equipment.accessory1 = loadout.equipment.accessory1 || null;
                normalized.equipment.accessory2 = loadout.equipment.accessory2 || null;
            }
            return normalized;
        }

        function buildDefaultLoadouts(partyMeta) {
            const out = {
                1: [],
                2: []
            };
            [1, 2].forEach(player => {
                const builds = DEFAULT_BUILDS[player] || [];
                const size = Math.max(CONFIG.teamSize, builds.length);
                for (let i = 0; i < size; i++) {

                    if (typeof randomSpellLoadoutForClass === 'undefined') {
                        out[player].push(emptyLoadout());
                    } else {
                        const cls = builds[i] || 'Gunslinger';
                        const meta = partyMeta?.[player]?.[i] || getArchetypeForJob(cls);
                        const race = meta.race || '';
                        out[player].push(optimizeLoadoutForClass(cls, race));
                    }
                }
            });
            return out;
        }

        function buildDefaultPartyNames() {
            return {
                1: DEFAULT_BUILDS[1].map(cls => getDefaultUnitName(cls)),
                2: DEFAULT_BUILDS[2].map(cls => getDefaultUnitName(cls))
            };
        }

        function sanitizeUnitName(name, fallback) {
            const clean = String(name || '').trim();
            return clean ? clean.slice(0, 18) : fallback;
        }

        function getDefaultUnitName(cls) {
            return generateRandomName();
        }

        function generateRandomName() {
            const starts = ['Ash', 'Bri', 'Cal', 'Dax', 'Eli', 'Fen', 'Gra', 'Hux', 'Iri', 'Jax', 'Kai', 'Lor', 'Myr', 'Nox', 'Ori', 'Pax', 'Qin', 'Ryn', 'Sol', 'Tyr', 'Umi', 'Vex', 'Wyl', 'Xan', 'Yar', 'Zev',
                'Ald', 'Bel', 'Cor', 'Dra', 'Eth', 'Fyn', 'Gil', 'Hal', 'Isk', 'Jas', 'Kol', 'Lux', 'Mor', 'Nel', 'Osk', 'Pyr', 'Rex', 'Syl', 'Tal', 'Ura', 'Val', 'Wren', 'Zel', 'Ara', 'Bok', 'Cyn'
            ];
            const mids = ['a', 'e', 'i', 'o', 'u', 'ar', 'en', 'ir', 'on', 'al', 'is', 'an', 'el', 'or', 'in', 'ae', 'io', 'ia', 'ra', 'ri', 'lo', 'na', 'th', ''];
            const ends = ['n', 's', 'x', 'r', 'th', 'ra', 'ne', 'us', 'an', 'el', 'ix', 'ar', 'os', 'is', 'en', 'on', 'ax', 'yn', 'ik', 'or', 'al', 'um', 'ia', ''];
            const s = starts[Math.floor(Math.random() * starts.length)];
            const m = mids[Math.floor(Math.random() * mids.length)];
            const e = ends[Math.floor(Math.random() * ends.length)];
            let name = s + m + e;

            name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            return name.slice(0, 12);
        }

        function normalizeClassName(cls, fallback = null) {
            const clean = String(cls || '').trim();
            if (clean && CLASS_TEMPLATES[clean]) return clean;
            if (fallback && CLASS_TEMPLATES[fallback]) return fallback;
            return Object.keys(CLASS_TEMPLATES)[0] || 'Warrior';
        }

        function repairPartyBuilderState() {
            ensurePartyMeta();
            [1, 2].forEach(player => {
                if (!Array.isArray(state.partyBuilds?.[player])) state.partyBuilds[player] = [];
                if (!Array.isArray(state.partyNames?.[player])) state.partyNames[player] = [];
                if (!Array.isArray(state.loadouts?.[player])) state.loadouts[player] = [];
                if (!Array.isArray(state.partyMeta?.[player])) state.partyMeta[player] = [];

                const repairedClasses = [];
                const repairedNames = [];
                const repairedLoadouts = [];
                const repairedMeta = [];

                const slotCount = Math.max(CONFIG.teamSize, state.partyBuilds[player].length);

                for (let idx = 0; idx < slotCount; idx++) {
                    const fallbackCls = DEFAULT_BUILDS[player]?.[idx] || Object.keys(CLASS_TEMPLATES)[0] || 'Warrior';
                    const cls = normalizeClassName(state.partyBuilds[player][idx], fallbackCls);
                    repairedClasses.push(cls);
                    repairedNames.push(normalizeDisplayedUnitName(state.partyNames[player]?.[idx], cls, player, idx));
                    let repairedLo = normalizeLoadoutForClass(state.loadouts[player]?.[idx] || emptyLoadout(), cls);
                    const archetype = getArchetypeForJob(cls);
                    const priorMeta = state.partyMeta[player]?.[idx] || {};
                    // For the local human (player 1), don't fall back to a locked
                    // archetype default race — pick an owned vessel so the team
                    // can pass the unlock gate on Lock In / Start.
                    const defaultRace = (player === 1 ? ownedRaceForJobSlot(cls) : null) || archetype.race || 'homosapien';
                    const race = priorMeta.race || defaultRace;

                    // The builder keeps a unit's spells in partyMeta.customSpells
                    // (that's what actually arms the unit — see createUnit), NOT in
                    // loadout.spells. So a fully-built party normally has an empty
                    // repairedLo.spells. Treat the unit as "blank" only when it has
                    // neither loadout spells nor customSpells — otherwise this would
                    // re-roll a chosen party every lock-in / match start.
                    const hasCustomSpells = Array.isArray(priorMeta.customSpells) && priorMeta.customSpells.some(s => s);
                    const hasAnySpell = repairedLo.spells.some(s => s) || hasCustomSpells;
                    if (!hasAnySpell && typeof randomSpellLoadoutForClass === 'function') {
                        // Borrow ONLY the rolled spells for a truly empty slot; keep
                        // the player's chosen items/accessories intact (don't wipe or
                        // randomize them). Items/equipment are only filled from the
                        // fresh roll when the player hasn't set any of their own.
                        const freshLo = randomSpellLoadoutForClass(cls, race);
                        repairedLo.spells = freshLo.spells;
                        const hasItems = Object.values(repairedLo.items || {}).some(v => v > 0);
                        if (!hasItems) repairedLo.items = freshLo.items;
                        const hasEquip = repairedLo.equipment && Object.values(repairedLo.equipment).some(v => v);
                        if (!hasEquip) repairedLo.equipment = freshLo.equipment;
                    }

                    repairedLoadouts.push(repairedLo);
                    const rebuiltMeta = {
                        race: race,
                        gender: priorMeta.gender || archetype.gender || 'other',
                        zodiac: priorMeta.zodiac || archetype.zodiac || 'aries',
                        sleepPreference: priorMeta.sleepPreference || archetype.sleepPreference || 'none',
                        terrainPreference: getTerrainPreferenceForRace(race),
                        weatherPreference: priorMeta.weatherPreference || archetype.weatherPreference || 'none',
                        dominantHand: priorMeta.dominantHand || (cls === 'Black Mage' ? 'left' : 'right')
                    };

                    if (priorMeta.secondaryJob) rebuiltMeta.secondaryJob = priorMeta.secondaryJob;
                    if (Array.isArray(priorMeta.customSpells) && priorMeta.customSpells.length > 0) {
                        rebuiltMeta.customSpells = priorMeta.customSpells.slice();
                    }

                    if (!rebuiltMeta.customSpells && repairedLo.spells.some(s => s)) {
                        rebuiltMeta.customSpells = repairedLo.spells.filter(Boolean).slice(0, CONFIG.unitSkillSlots);
                    }

                    if (priorMeta._campaignLevel != null) rebuiltMeta._campaignLevel = priorMeta._campaignLevel;
                    if (priorMeta._campaignXp != null) rebuiltMeta._campaignXp = priorMeta._campaignXp;
                    if (priorMeta._campaignRosterId) rebuiltMeta._campaignRosterId = priorMeta._campaignRosterId;
                    if (Array.isArray(priorMeta._campaignSpells)) rebuiltMeta._campaignSpells = priorMeta._campaignSpells.slice();
                    if (priorMeta._campaignAlly) rebuiltMeta._campaignAlly = priorMeta._campaignAlly;
                    if (priorMeta._campaignEnemyLevel != null) rebuiltMeta._campaignEnemyLevel = priorMeta._campaignEnemyLevel;
                    if (priorMeta._campaignEnemyXp != null) rebuiltMeta._campaignEnemyXp = priorMeta._campaignEnemyXp;
                    repairedMeta.push(rebuiltMeta);
                }

                state.partyBuilds[player] = repairedClasses;
                state.partyNames[player] = repairedNames;
                state.loadouts[player] = repairedLoadouts;
                state.partyMeta[player] = repairedMeta;
            });
            return true;
        }

        function renderBuilderFallback(reason = null) {
            repairPartyBuilderState();
            const classOptions = Object.keys(CLASS_TEMPLATES).map(name => `<option value="${name}">${name}</option>`).join('');
            const fallbackTarget = document.getElementById('builderOverlay') || builderEl;
            const issueNote = reason ? `<div class="tiny-note" style="margin:0 0 12px;color:#ffd3d3">Builder recovery mode is active because the richer builder hit an error. Core party editing is still available.</div>` : '';
            fallbackTarget.innerHTML = `<div class="builder-center">${issueNote}${[1,2].map(player => {
        const sectionHidden = player === 2 && !state.showPlayer2Builder;
        return `
          <div class="party-builder-section player${player}" ${sectionHidden ? 'style="display:none"' : ''}>
            <div class="party-builder-header">
              <h3 class="party-builder-title">Player ${player} Party</h3>
              <span class="party-badge">${player === 1 ? 'Human Player' : 'Computer Opponent'}</span>
            </div>
            <div class="party-builder-meta">Recovery builder: name and class editing only, so you can get back into combat fast.</div>
            <div class="slot-grid">${state.partyBuilds[player].map((clsName, idx) => `
              <div class="slot-card">
                <div class="builder-unit-head">
                  ${typeof renderUnitSprite === 'function' ? renderUnitSprite(clsName, player, 'builder-sprite', state.partyMeta?.[player]?.[idx]?.race || '', getDefaultEquipment(clsName), state.partyMeta?.[player]?.[idx]?.gender || '') : `<div class="builder-sprite" style="width:48px;height:48px;background:#333;border-radius:4px"></div>`}
                  <div class="builder-unit-label">Player ${player} Slot ${idx + 1}</div>
                </div>
                <div class="form-grid" style="display:grid;grid-template-columns:1fr;gap:8px;margin-top:10px">
                  <label>Name<input type="text" id="p${player}-slot${idx}-name" maxlength="18" value="${escapeHtml(normalizeDisplayedUnitName(state.partyNames?.[player]?.[idx], clsName, player, idx))}" /></label>
                  <label>Job<select id="p${player}-slot${idx}">${classOptions}</select></label>
                </div>
              </div>
            `).join('')}</div>
          </div>
        `;
      }).join('')}</div>`;

            [1, 2].forEach(player => {
                state.partyBuilds[player].forEach((clsName, idx) => {
                    const select = document.getElementById(`p${player}-slot${idx}`);
                    if (select) {
                        select.value = normalizeClassName(clsName, DEFAULT_BUILDS[player]?.[idx]);
                        select.onchange = () => {
                            syncPartyBuildsFromInputs();
                            render();
                        };
                    }
                });
            });
        }

        function isGeneratedDefaultName(name, cls, player = null, idx = null) {
            const clean = String(name || '').trim();
            if (!clean) return true;
            const defaults = new Set([
                getDefaultUnitName(cls),
                `${player === 1 ? 'P1' : 'P2'} ${cls}`,
                `${player === 1 ? 'P1' : 'P2'} ${cls} ${Number(idx) + 1}`,
                `Player ${player} ${cls}`
            ].filter(Boolean));
            return defaults.has(clean);
        }

        function normalizeDisplayedUnitName(name, cls, player, idx) {
            return isGeneratedDefaultName(name, cls, player, idx) ? getDefaultUnitName(cls) : sanitizeUnitName(name, getDefaultUnitName(cls));
        }

        function optimizeLoadoutForClass(cls, race) {
            return randomSpellLoadoutForClass(cls, race);
        }

        function optimizeUnitLoadout(player, idx) {
            if (isOnlineMatch() && player !== getLocalPlayer()) {
                addLog("You can only reset your own team to defaults.");
                return;
            }
            syncPartyBuildsFromInputs();
            const cls = state.partyBuilds[player][idx];
            const race = state.partyMeta?.[player]?.[idx]?.race || '';
            state.loadouts[player][idx] = optimizeLoadoutForClass(cls, race);
            const fallback = getDefaultUnitName(cls);
            state.partyNames[player][idx] = sanitizeUnitName(state.partyNames[player][idx], fallback);
            addLog(`Reset Player ${player} Slot ${idx + 1} to default loadout for ${cls}.`);
            state.teamLockedIn = false;
            render();
        }

        function applyRandomSpellsAndSecJob(meta, cls) {
            if (!meta || !cls) return;

            if (typeof SPELL_LIBRARY === 'undefined' || typeof isSpellNativeToClass !== 'function') return;
            const allJobs = (typeof JOB_MODIFIERS !== 'undefined') ? Object.keys(JOB_MODIFIERS)
                          : (typeof CLASS_TEMPLATES !== 'undefined') ? Object.keys(CLASS_TEMPLATES) : [];

            const secOptions = allJobs.filter(j => j && j !== cls);
            const secJob = secOptions.length > 0 ? secOptions[randInt(secOptions.length)] : '';
            meta.secondaryJob = secJob;

            const isFreelancer = cls === 'Freelancer';
            const mainPool = [];
            const secPool = [];
            const crossPool = [];
            for (const spell of SPELL_LIBRARY) {
                if (!spell || !spell.id || !spell.tier) continue;
                if (spell.kind === 'basicAttack') continue;
                const isMainNative = isSpellNativeToClass(spell, cls);
                const isSecNative = secJob && isSpellNativeToClass(spell, secJob);
                const hasClassRestriction = spell.classRestriction || (Array.isArray(spell.classRestrictions) && spell.classRestrictions.length > 0);
                const isCrossClass = !hasClassRestriction && !isMainNative && !isSecNative;
                const freelancerAccess = isFreelancer && !isMainNative;
                if (isMainNative) { mainPool.push(spell); continue; }
                if (isSecNative) { secPool.push(spell); continue; }
                if (isCrossClass || freelancerAccess) {
                    if (spell.tier === 'I' || spell.tier === 'II') crossPool.push(spell);
                }
            }

            const race = meta.race || '';
            if (race && typeof RACE_ABILITIES !== 'undefined' && RACE_ABILITIES[race]) {
                const racePool = RACE_ABILITIES[race].filter(a =>
                    !a.jobRequirement || a.jobRequirement === cls
                );
                const mainIds = new Set(mainPool.map(s => s.id));
                for (const ra of racePool) {
                    if (!mainIds.has(ra.id)) mainPool.push(ra);
                }
            }
            const shuffle = (arr) => {
                const a = arr.slice();
                for (let i = a.length - 1; i > 0; i--) {
                    const j = randInt(i + 1);
                    [a[i], a[j]] = [a[j], a[i]];
                }
                return a;
            };
            const slotCap = (typeof SPELL_SLOT_MAX !== 'undefined') ? SPELL_SLOT_MAX : 6;
            // Slot budget: spells occupy 1-3 slots each (getSpellSlotCost).
            const slotCostOf = (sp) => (typeof getSpellSlotCost === 'function') ? getSpellSlotCost(sp, cls, secJob) : 1;

            const picks = [];
            const seenIds = new Set();
            let slotsUsed = 0;
            const tryPick = (sp) => {
                if (!sp || seenIds.has(sp.id)) return false;
                const c = slotCostOf(sp);
                if (slotsUsed + c > slotCap) return false;
                picks.push(sp.id);
                seenIds.add(sp.id);
                slotsUsed += c;
                return true;
            };
            const mainDamage = mainPool.filter(s => s.type === 'damage' || s.kind === 'damage');
            if (mainDamage.length > 0) {
                tryPick(mainDamage[randInt(mainDamage.length)]);
            }

            const pushFrom = (pool, count) => {
                const shuffled = shuffle(pool);
                for (const sp of shuffled) {
                    if (slotsUsed >= slotCap) break;
                    if (count <= 0) break;
                    if (tryPick(sp)) count--;
                }
            };

            const remainingSlots = slotCap - slotsUsed;
            const mainCount = Math.max(1, Math.round(remainingSlots * 0.6));
            const secCount = secPool.length > 0 ? Math.max(1, Math.round(remainingSlots * 0.3)) : 0;
            const crossCount = Math.max(0, remainingSlots - mainCount - secCount);
            pushFrom(mainPool, mainCount);
            pushFrom(secPool, secCount);
            pushFrom(crossPool, crossCount);

            if (slotsUsed < slotCap) {
                const leftover = shuffle([...mainPool, ...secPool, ...crossPool]);
                for (const sp of leftover) {
                    if (slotsUsed >= slotCap) break;
                    tryPick(sp);
                }
            }
            meta.customSpells = picks;
        }

        function optimizeRandomizeParty(player) {
            const classNames = Object.keys(CLASS_TEMPLATES);
            const size = Math.max(CONFIG.teamSize, state.partyBuilds?.[player]?.length || 0);

            if (!state.partyMeta) state.partyMeta = {};
            state.partyMeta[player] = randomizePartyIdentities(size);
            state.partyBuilds[player] = state.partyMeta[player].map(meta => {
                const race = meta.race || 'homosapien';
                const lockedJob = (race !== 'homosapien' && typeof RACE_DEFAULT_JOBS !== 'undefined' && RACE_DEFAULT_JOBS[race])
                    ? RACE_DEFAULT_JOBS[race] : null;
                return lockedJob || classNames[randInt(classNames.length)];
            });
            state.partyNames[player] = state.partyBuilds[player].map(cls => getDefaultUnitName(cls));
            state.loadouts[player] = state.partyBuilds[player].map((cls, idx) =>
                optimizeLoadoutForClass(cls, state.partyMeta[player][idx]?.race || '')
            );

            state.partyBuilds[player].forEach((cls, idx) => {
                applyRandomSpellsAndSecJob(state.partyMeta[player][idx], cls);
            });
        }

        function copyUnitSlot(player, idx) {
            syncPartyBuildsFromInputs();
            const cls = state.partyBuilds[player][idx];
            state.copiedUnitBuild = {
                cls,
                name: normalizeDisplayedUnitName(state.partyNames[player][idx], cls, player, idx),
                loadout: JSON.parse(JSON.stringify(normalizeLoadoutForClass(state.loadouts[player][idx] || emptyLoadout(), cls)))
            };
            addLog(`${state.copiedUnitBuild.name} copied.`);
            render();
        }

        function pasteUnitSlot(player, idx) {
            if (!state.copiedUnitBuild) {
                ewToast('Copy a unit first.');
                return;
            }
            syncPartyBuildsFromInputs();
            const copied = state.copiedUnitBuild;
            state.partyBuilds[player][idx] = copied.cls;
            state.partyNames[player][idx] = sanitizeUnitName(copied.name, getDefaultUnitName(copied.cls));
            state.loadouts[player][idx] = normalizeLoadoutForClass(JSON.parse(JSON.stringify(copied.loadout)), copied.cls);
            state.units = makeUnitsFromBuilds();
            addLog(`Pasted ${copied.name} into Player ${player} Slot ${idx + 1}.`);
            state.teamLockedIn = false;
            render();
        }

        function togglePlayer2BuilderVisibility() {
            state.showPlayer2Builder = !state.showPlayer2Builder;
            render();
        }

        const CTRL = {
            LOCAL: 'local',
            AI: 'ai',
            REMOTE: 'remote',
        };

        function isOnlineMatch() {
            return state.controllers[1] === CTRL.REMOTE || state.controllers[2] === CTRL.REMOTE;
        }

        function isHumanControlled(p) {
            return state.controllers[p] === CTRL.LOCAL || state.controllers[p] === CTRL.REMOTE;
        }

        function getLocalPlayer() {
            if (window._NET && window._NET.online && window._NET.myPlayer) return window._NET.myPlayer;
            return 1;
        }

        function _buildersToUpdate() {
            return isOnlineMatch() ? [getLocalPlayer()] : [1, 2];
        }

        const GS = {
            TITLE: 'title',
            MAIN_MENU: 'main_menu',
            MODE_SELECT: 'mode_select',
            LOBBY: 'lobby',
            PARTY_BUILDER: 'party_builder',
            BATTLE: 'battle',
            POST_MATCH: 'post_match',
            CAMPAIGN_CHAR_CREATE: 'campaign_char_create',
            CAMPAIGN_MAP: 'campaign_map',
            CHALLENGE_PICK: 'challenge_pick'
        };

        const state = {
            gameState: GS.TITLE,
            phase: 'setup',
            setupStep: 'builder',
            titleScreenVisible: true,
            audioUnlocked: false,
            currentMusic: null,
            currentBattleTrackKey: null,
            lastBattleTrackKey: null,
            musicVolume: 0.68,
            sfxVolume: 0.9,
            activePlayer: 1,
            round: 0,
            selectedUnitId: null,
            focusedUnitId: null,
            hoverUnitId: null,
            showUnitInfo: false,
            actionMode: null,
            actionMenuView: 'root',
            nametagMode: 'race',
            selectedTool: null,
            partyBuilds: structuredClone(DEFAULT_BUILDS),
            partyNames: buildDefaultPartyNames(),
            loadouts: buildDefaultLoadouts(),
            partyMeta: makeDefaultPartyMeta(),
            units: [],
            boardTerrain: [],
            boardHeights: [],
            boardColumns: [],
            boardObjects: [],
            hourglasses: [],
            hourglassBuffs: {
                1: 0,
                2: 0
            },
            hiddenItems: [],
            foundByPlayer: {
                1: new Set(),
                2: new Set()
            },
            scannedByPlayer: {
                1: new Set(),
                2: new Set()
            },
            placed: false,
            winner: null,
            isRankedMatch: false,

            matchClock: null,
            matchScores: { 1: 0, 2: 0 },
            matchKills: { 1: 0, 2: 0 },
            suddenDeathActive: false,
            flags: null,
            roamingNexus: null,
            bombs: [],
            plantedSeeds: [],
            warpRunes: [],
            wards: [],
            _flairRevealTiles: {
                1: null,
                2: null
            },

            controllers: {
                1: CTRL.LOCAL,
                2: CTRL.AI
            },
            aiThinking: false,
            _winLogged: false,
            matchNumber: 1,
            record: {
                1: 0,
                2: 0
            },
            wins: {
                1: 0,
                2: 0
            },
            losses: {
                1: 0,
                2: 0
            },
            hitFlashIds: new Set(),
            healFlashIds: new Set(),
            statusWiggleIds: new Set(),
            attackAnimIds: new Set(),
            castAnimIds: new Set(),
            dodgeAnimIds: new Set(),
            _attackAnimDir: {},
            _dodgeAnimDir: {},
            battleDialogueQueue: [],
            battleDialogueTimer: null,
            selectedPanelFlash: null,
            pendingTarget: null,
            comboPartner: null,
            logEntries: [],
            _fullLogEntries: [],
            showPlayer2Builder: false,
            copiedUnitBuild: null,
            savedTeamsSnapshot: null,
            matchHistory: [],
            lastCompletedMatch: null,
            devAutoSim: false,
            cameraDisabled: false,
            cinematicMode: false,
            dioramaMode: true,
            dioramaTiltDeg: 50,
            dioramaYawDeg: 0,
            dioramaCamZ: 900,
            teamVision: true,
            squadLeaderMode: false,
            squadLeaderUnitId: null,
            animationsDisabled: false,
            particleSettings: {
                projectiles: true,
                aoe: true,
                movement: true,
                healing: true,
                buffs: true,
                status: true,
                levelUp: true,
                death: true,
                combos: true,
            },
            fogOfWar: true,
            _fogAnchorUnitId: null,
            _fogRevealTiles: null,
            _visionWards: [],
            builderSelectedPlayer: 1,
            builderSelectedSlot: 0,
            devSimSpeed: 1,
            devSimTimer: null,
            activeZodiac: ZODIAC_CYCLE[0],
            zodiacOffset: 0,
            startingPlayer: 1,
            skyEvent: null,
            activeWeather: [],
            announcementQueue: [],
            _recentDefeats: [],
            uiDialog: null,
            teamLockedIn: false,
            pings: [],
            enemySightings: {
                1: {},
                2: {}
            },
            _turnBannerTimer: null,
            userZoomScale: 0,

            floors: null,

            isCampaign: false,
            campaignLevelId: null,
            campaignSave: null
        };

        Object.defineProperty(state, 'dioramaMode', {
            get() { return true; },
            set() {  },
            enumerable: true,
            configurable: false
        });

        document.body.classList.add('diorama-3d');

        Object.defineProperty(state, 'autoPlayers', {
            get() {
                return {
                    1: state.controllers[1] !== CTRL.LOCAL,
                    2: state.controllers[2] !== CTRL.LOCAL,
                };
            },
            set(val) {

                if (val && typeof val === 'object') {
                    if (val[1] === true && state.controllers[1] === CTRL.LOCAL) state.controllers[1] = CTRL.AI;
                    if (val[1] === false && state.controllers[1] === CTRL.AI) state.controllers[1] = CTRL.LOCAL;
                    if (val[2] === true && state.controllers[2] === CTRL.LOCAL) state.controllers[2] = CTRL.AI;
                    if (val[2] === false && state.controllers[2] === CTRL.AI) state.controllers[2] = CTRL.LOCAL;
                }
            },
            enumerable: false,
            configurable: true
        });

        Object.defineProperty(state, 'aiPlayer', {
            get() {
                if (state.controllers[2] === CTRL.AI) return 2;
                if (state.controllers[1] === CTRL.AI) return 1;
                return -1;
            },
            set(val) {

                if (val === -1 || val === null) {

                }
            },
            enumerable: false,
            configurable: true
        });

        const CAMPAIGN_SAVE_KEY = 'ew-campaign-v1';
        const _SAVE_KEYS = {
            gauntlet: 'ew-gauntlet-v1',
            survival: 'ew-survival-v1'
        };

        function _getCampaignSaveKey(type) {
            return _SAVE_KEYS[type] || CAMPAIGN_SAVE_KEY;
        }
        let _activeChallengeType = null;
        let _campaignRosterIdCounter = 0;

        function createRosterInstance(race, gender, job, name) {
            const id = 'roster_' + (_campaignRosterIdCounter++);
            const defaultJob = (typeof RACE_DEFAULT_JOBS !== 'undefined' && RACE_DEFAULT_JOBS[race]) || 'Freelancer';
            const finalJob = job || defaultJob;
            const finalGender = gender || 'male';
            const finalName = name || (race.charAt(0).toUpperCase() + race.slice(1));

            const learnOrder = (typeof CLASS_SPELL_LEARN_ORDER !== 'undefined') ? CLASS_SPELL_LEARN_ORDER[finalJob] : null;
            const startingSpells = [];
            if (learnOrder) {
                if (learnOrder[0]) startingSpells.push(learnOrder[0]);
                if (learnOrder[1]) startingSpells.push(learnOrder[1]);
            }

            return {
                id,
                race,
                gender: finalGender,
                name: finalName,
                job: finalJob,
                level: 1,
                xp: 0,
                spells: startingSpells.slice(),
                loadout: {
                    spells: startingSpells.slice(),
                    items: {},
                    equipment: {}
                }
            };
        }

        function newCampaignSave(firstUnit, challengeType) {
            _campaignRosterIdCounter = 0;
            const instance = createRosterInstance(
                firstUnit.race || 'homosapien',
                firstUnit.gender || 'male',
                firstUnit.job || 'Freelancer',
                firstUnit.name || 'Recruit'
            );
            const cType = challengeType || 'survival';
            _activeChallengeType = cType;
            return {
                version: 1,
                challengeType: cType,
                gold: 0,
                highestLevelCleared: 0,
                levelStars: {},
                roster: [instance],
                unlockedRaces: [firstUnit.race || 'homosapien'],
                unlockedSpells: [],
                partySlots: [instance.id],
                totalGoldEarned: 0,
                totalBattlesWon: 0,
                firstRun: false,

                currentBattle: 1,
                bestStreak: 0,
                runSeed: (Math.random() * 0x7FFFFFFF) | 0,
                runWins: 0,

                gauntletRetries: 0,
                gauntletStartTime: (cType === 'gauntlet') ? Date.now() : null,
                gauntletTotalTime: 0
            };
        }

        function saveCampaign(save) {
            if (!save) return;
            try {

                const maxId = save.roster.reduce((max, r) => {
                    const n = parseInt(r.id.replace('roster_', ''), 10);
                    return isNaN(n) ? max : Math.max(max, n);
                }, -1);
                _campaignRosterIdCounter = maxId + 1;

                const key = _getCampaignSaveKey(save.challengeType || _activeChallengeType);
                localStorage.setItem(key, JSON.stringify(save));
            } catch (e) {
                console.error('[Campaign] Save failed:', e);
            }
        }

        function loadCampaign(challengeType) {
            try {
                const key = _getCampaignSaveKey(challengeType || _activeChallengeType);
                const raw = localStorage.getItem(key);
                if (!raw) return null;
                const save = JSON.parse(raw);
                if (!save || save.version !== 1) {
                    console.warn('[Campaign] Save version mismatch or corrupt — ignoring.');
                    return null;
                }

                const maxId = save.roster.reduce((max, r) => {
                    const n = parseInt(r.id.replace('roster_', ''), 10);
                    return isNaN(n) ? max : Math.max(max, n);
                }, -1);
                _campaignRosterIdCounter = maxId + 1;
                _activeChallengeType = save.challengeType || challengeType || 'survival';

                if (!save.challengeType) save.challengeType = _activeChallengeType;
                if (typeof save.currentBattle !== 'number') save.currentBattle = 1;
                if (typeof save.bestStreak !== 'number') save.bestStreak = 0;
                if (typeof save.runSeed !== 'number') save.runSeed = (Math.random() * 0x7FFFFFFF) | 0;
                if (typeof save.runWins !== 'number') save.runWins = 0;
                if (typeof save.gauntletRetries !== 'number') save.gauntletRetries = 0;
                return save;
            } catch (e) {
                console.error('[Campaign] Load failed:', e);
                return null;
            }
        }

        function deleteCampaignSave(challengeType) {
            try {
                const key = _getCampaignSaveKey(challengeType || _activeChallengeType);
                localStorage.removeItem(key);
            } catch (e) {
                console.error('[Campaign] Delete failed:', e);
            }
        }

        window.createRosterInstance = createRosterInstance;
        window.newCampaignSave = newCampaignSave;
        window.saveCampaign = saveCampaign;
        window.loadCampaign = loadCampaign;
        window.deleteCampaignSave = deleteCampaignSave;
        window._activeChallengeType = null;
        Object.defineProperty(window, '_activeChallengeType', {
            get() { return _activeChallengeType; },
            set(v) { _activeChallengeType = v; },
            configurable: true
        });

        const dirty = {
            screenMode: true,
            builder: true,
            board: true,
            selectedUnit: true,
            teams: true,
            status: true,
            buttons: true,
            actionPanel: true,
            log: true,
            audio: true,
            dialog: true,
            infoPanel: true,
            hud: true
        };

        function markDirty(  ) {
            const flags = arguments;
            if (flags.length === 0) {
                for (const k in dirty) dirty[k] = true;
            } else {
                for (let i = 0; i < flags.length; i++) {
                    if (flags[i] in dirty) dirty[flags[i]] = true;
                }
            }

            try { window.dispatchEvent(_ewStateChangeEvent); } catch (_) {}
        }
        const _ewStateChangeEvent = new Event('ew-state-change');

        function renderIfDirty() {
            if (dirty.screenMode) {
                dirty.screenMode = false;
                renderScreenMode();
            }
            if (dirty.builder) {
                dirty.builder = false;
                try {
                    renderBuilder();
                } catch (e) {
                    console.error('renderBuilder failed', e);
                    renderBuilderFallback(e);
                }
            }
            if (dirty.board) {
                dirty.board = false;
                renderBoard();
                updateFloorUI();
                renderInventoryPanel();
            }
            if (dirty.selectedUnit) {
                dirty.selectedUnit = false;
                renderSelectedUnitPanel();
                renderInventoryPanel();
            }
            if (dirty.teams) {
                dirty.teams = false;
                renderTeams();
            }

            if (state.phase === 'battle') {
                if (typeof ensureBattleHUD === 'function') ensureBattleHUD();
                const _famUnit = (typeof _getHudActiveUnit === 'function') ? _getHudActiveUnit() : getSelectedUnit();
                if (typeof renderHudActions === 'function') renderHudActions(_famUnit);
                // Keep the subtitle prompt in sync with action-mode/menu state —
                // those changes don't always dirty the log, which used to be the
                // only path into _renderDialogueBox.
                if (typeof _renderDialogueBox === 'function') _renderDialogueBox(null);
            }
            if (dirty.status) {
                dirty.status = false;
                renderStatus();
            }
            if (dirty.buttons) {
                dirty.buttons = false;
                renderButtons();
            }
            if (dirty.log) {
                dirty.log = false;
                renderLog();
            }
            if (dirty.audio) {
                dirty.audio = false;
                renderAudioControls();
            }
            if (dirty.dialog) {
                dirty.dialog = false;
                renderUiDialog();
            }
            if (dirty.infoPanel) {
                dirty.infoPanel = false;
                renderInfoPanel();
            }
            if (dirty.hud) {
                dirty.hud = false;
                if (state.phase === 'battle') {
                    if (typeof ensureBattleHUD === 'function') ensureBattleHUD();
                    if (typeof renderHudRoster === 'function') renderHudRoster();
                    if (typeof renderHudScoreboard === 'function') renderHudScoreboard();
                    if (typeof renderTurnClock === 'function') renderTurnClock();
                }
            }
            _postRenderHook();
        }

        let _renderRafId = 0;
        function scheduleRender() {
            if (!_renderRafId) {
                _renderRafId = requestAnimationFrame(() => {
                    _renderRafId = 0;
                    renderIfDirty();
                });
            }
        }

        let _hoverRafId = 0;
        let _hoverWork = null;
        function scheduleHoverRender(fn) {
            _hoverWork = fn;
            if (!_hoverRafId) {
                _hoverRafId = requestAnimationFrame(() => {
                    _hoverRafId = false;
                    if (_hoverWork) { _hoverWork(); _hoverWork = null; }
                });
            }
        }

        let _fogVisCacheKey = '';
        let _fogVisCacheResult = null;
        function computeVisibleTilesCached(player) {

            let key = player + '|' + (state.selectedUnitId || '') + '|' + (state.focusedUnitId || '') + '|' + (state.teamVision ? 'T' : 'F') + '|' + (state.squadLeaderMode ? 'SL' : '');
            const alive = state.units;
            for (let i = 0; i < alive.length; i++) {
                const u = alive[i];
                if (!u.dead) key += '|' + u.id + ':' + u.x + ',' + u.y;
            }

            if (state.wards) {
                for (const w of state.wards) key += '|w' + w.x + ',' + w.y + ':' + w.owner;
            }
            if (key === _fogVisCacheKey && _fogVisCacheResult) return _fogVisCacheResult;
            _fogVisCacheResult = computeVisibleTiles(player);
            _fogVisCacheKey = key;
            return _fogVisCacheResult;
        }
        function invalidateFogCache() { _fogVisCacheKey = ''; _fogVisCacheResult = null; _fogDistCacheKey = ''; _fogDistCacheResult = null; }

        let _fogDistCacheKey = '';
        let _fogDistCacheResult = null;
        function computeFogDistancesCached(player) {

            let key = player + '|' + (state.selectedUnitId || '') + '|' + (state.focusedUnitId || '') + '|' + (state.teamVision ? 'T' : 'F') + '|' + (state.squadLeaderMode ? 'SL' : '');
            const alive = state.units;
            for (let i = 0; i < alive.length; i++) {
                const u = alive[i];
                if (!u.dead) key += '|' + u.id + ':' + u.x + ',' + u.y;
            }
            if (state.wards) {
                for (const w of state.wards) key += '|w' + w.x + ',' + w.y + ':' + w.owner;
            }
            if (key === _fogDistCacheKey && _fogDistCacheResult) return _fogDistCacheResult;

            const visible = computeVisibleTilesCached(player);
            const dist = new Map();
            const w = bw(), h = bh();

            const queue = [];
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const pk = posKey(x, y);
                    if (!visible.has(pk)) continue;

                    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
                    for (const [ddx, ddy] of dirs) {
                        const nx = x + ddx, ny = y + ddy;
                        if (nx >= 0 && ny >= 0 && nx < w && ny < h && !visible.has(posKey(nx, ny))) {
                            queue.push([x, y, 0]);
                            break;
                        }
                    }
                }
            }

            const visited = new Set();
            for (const [sx, sy] of queue) visited.add(posKey(sx, sy));
            let qi = 0;
            while (qi < queue.length) {
                const [cx, cy, cd] = queue[qi++];
                const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
                for (const [ddx, ddy] of dirs) {
                    const nx = cx + ddx, ny = cy + ddy;
                    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                    const npk = posKey(nx, ny);
                    if (visited.has(npk)) continue;
                    visited.add(npk);
                    if (visible.has(npk)) continue;
                    const nd = cd + 1;
                    dist.set(npk, nd);
                    if (nd < 4) queue.push([nx, ny, nd]);
                }
            }

            _fogDistCacheResult = dist;
            _fogDistCacheKey = key;
            return dist;
        }

        let _actionPanelCache = { key: '', canMove: false, hasAttack: false, hasSpells: false, hasCombo: false, hasInspect: false, canTrade: false, hasBombs: false, hasAnyItem: false };
        function getActionPanelCache(unit) {
            let _apAlive = 0; for (let i = 0; i < state.units.length; i++) { if (!state.units[i].dead) _apAlive++; }
            const _apcItemCount = unit.items ? Object.keys(unit.items).reduce((s, k) => s + (unit.items[k] || 0), 0) : 0;
            const _apcStatusKeys = unit.status ? Object.keys(unit.status).filter(k => unit.status[k] > 0).sort().join(',') : '';
            // Include destructible-structure counts so the Attack button refreshes the
            // instant a turret / deployed object / seed is placed or destroyed nearby.
            const _apcBldgHp = state.buildings ? state.buildings.reduce((s, b) => s + b.hp, 0) : -1;
            const _apcStructs = (state.turrets?.length || 0) + ':' + (state._deployedObjects?.length || 0) + ':' + (state.plantedSeeds?.length || 0) + ':' + (state._treeTick || 0) + ':' + _apcBldgHp;
            const key = unit.id + '|' + unit.x + ',' + unit.y + '|' + unit.ap + '|' + (unit.movesThisTurn || 0) + '|' + (unit.actionsThisTurn || 0) + '|' + state.round + '|' + _apAlive + '|' + _apcItemCount + '|' + _apcStatusKeys + '|' + _apcStructs;
            if (key === _actionPanelCache.key) return _actionPanelCache;
            const canMove = (unit.movesThisTurn || 0) < UNIT_MAX_MOVES && canUnitAct(unit) && getMoveTiles(unit).length > 0;
            const enemies = getHostileUnits(unit.player);
            const effRange = getEffectiveRange(unit);
            let hasAttack = enemies.some(e => {
                if (state.fogOfWar && !isInVision(unit, e.x, e.y)) return false;
                const d = distToTarget(unit.x, unit.y, e);
                return d >= 1 && d <= effRange && !isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y);
            });
            if (!hasAttack && state.towers) {
                const enemyPlayer = enemyOf(unit.player);
                const tw = state.towers[enemyPlayer];
                if (tw && tw.hp > 0) {
                    const d = Math.abs(tw.x - unit.x) + Math.abs(tw.y - unit.y);
                    if (d >= 1 && d <= effRange && !isRangeBlockedByTerrain(unit.x, unit.y, tw.x, tw.y)) hasAttack = true;
                }
            }
            // Structures (turrets, deployed objects, seeds) occupy a tile and may sit
            // directly BELOW a flying unit — i.e. on the unit's own tile (d === 0). Use
            // d <= effRange (no lower bound) so a flyer can attack straight down and the
            // Attack button isn't greyed out in that case.
            if (!hasAttack && state.turrets) {
                for (const t of state.turrets) {
                    if (t.owner !== unit.player && t.hp > 0) {
                        const d = Math.abs(t.x - unit.x) + Math.abs(t.y - unit.y);
                        if (d <= effRange && !isRangeBlockedByTerrain(unit.x, unit.y, t.x, t.y)) { hasAttack = true; break; }
                    }
                }
            }

            if (!hasAttack && state._deployedObjects) {
                for (const obj of state._deployedObjects) {
                    if (obj.hp <= 0) continue;
                    const isOwn = obj.ownerPlayer === unit.player;
                    if (isOwn && !(obj.detonateOnAttack && obj.blastRadius > 0)) continue;
                    const d = Math.abs(obj.x - unit.x) + Math.abs(obj.y - unit.y);
                    if (d <= effRange && !isRangeBlockedByTerrain(unit.x, unit.y, obj.x, obj.y)) { hasAttack = true; break; }
                }
            }

            if (!hasAttack && state.plantedSeeds) {
                for (const s of state.plantedSeeds) {
                    if (s.owner === unit.player) continue;
                    const d = Math.abs(s.x - unit.x) + Math.abs(s.y - unit.y);
                    if (d <= effRange && !isRangeBlockedByTerrain(unit.x, unit.y, s.x, s.y)) { hasAttack = true; break; }
                }
            }
            // 🪓 Trees / 🔨 smashable terrain do NOT light the Attack button any
            // more — they stay attackable through the target menu and the
            // right-click chop hold, but a verb lit purely by scenery reads as
            // "there's something to fight" when there isn't. Only enemies,
            // towers, turrets, deployables, seeds and buildings light it.
            // 🏢 An in-range building can always be sieged with a basic attack —
            // keeps the Attack button lit.
            if (!hasAttack && typeof getBuildingAt === 'function') {
                bOuter:
                for (let dy = -effRange; dy <= effRange; dy++) {
                    for (let dx = -effRange; dx <= effRange; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        if (Math.abs(dx) + Math.abs(dy) > effRange) continue;
                        const tx = unit.x + dx, ty = unit.y + dy;
                        if (tx < 0 || ty < 0 || tx >= bw() || ty >= bh()) continue;
                        if (!getBuildingAt(tx, ty)) continue;
                        if (typeof unitAt === 'function' && unitAt(tx, ty)) continue;
                        if (state.fogOfWar && !isInVision(unit, tx, ty)) continue;
                        if (!isRangeBlockedByTerrain(unit.x, unit.y, tx, ty)) { hasAttack = true; break bOuter; }
                    }
                }
            }
            // Nothing attackable from where the unit stands, but it may be able to
            // step into range and still afford the swing (move-then-attack). Keep
            // the Attack button enabled in that case so it matches the quick-action
            // (click-an-enemy) menu, which already offers the move-then-attack.
            // combatOnly: a merely-reachable tree/column must not re-light it.
            if (!hasAttack && typeof attackHasReachableTarget === 'function') {
                hasAttack = attackHasReachableTarget(unit, { combatOnly: true });
            }
            _actionPanelCache = {
                key: key,
                canMove: canMove,
                hasAttack: hasAttack,
                hasSpells: canCastAnySpell(unit),
                hasCombo: getComboPartners(unit).length > 0,
                hasInspect: getInspectTiles(unit).some(t => !state.scannedByPlayer[unit.player].has(scanKey(t.x, t.y))),
                canTrade: aliveUnitsFor(unit.player).filter(a => a.id !== unit.id && Math.max(Math.abs(a.x - unit.x), Math.abs(a.y - unit.y)) <= 1).length > 0,
                hasBombs: state.bombs.some(b => b.ownerUnitId === unit.id),
                hasAnyItem: Object.keys(ITEM_RULES).some(k => (unit.items?.[k] || 0) > 0)
            };
            return _actionPanelCache;
        }
        function invalidateActionPanelCache() { _actionPanelCache = { key: '' }; }

        function transitionTo(newState) {
            const prev = state.gameState;
            if (prev === newState) return;
            state.gameState = newState;

            switch (newState) {
                case GS.TITLE:
                case GS.MAIN_MENU:
                case GS.MODE_SELECT:
                case GS.LOBBY:
                    state.titleScreenVisible = true;
                    state.phase = 'setup';
                    state.setupStep = 'builder';
                    break;
                case GS.PARTY_BUILDER:
                    state.titleScreenVisible = false;
                    state.phase = 'setup';
                    state.setupStep = 'builder';
                    break;
                case GS.BATTLE:
                    state.titleScreenVisible = false;
                    state.phase = 'battle';
                    state.setupStep = 'ready';
                    break;
                case GS.POST_MATCH:

                    state.titleScreenVisible = false;
                    state.phase = 'battle';
                    state.setupStep = 'ready';
                    break;
            }
            dirty.screenMode = true;
        }

        function updateFloorUI() {}

        const MatchStateIO = {
            snapshot() {
                return JSON.parse(JSON.stringify({
                    gameState: state.gameState,
                    phase: state.phase,
                    setupStep: state.setupStep,
                    activePlayer: state.activePlayer,
                    round: state.round,
                    selectedUnitId: state.selectedUnitId,
                    focusedUnitId: state.focusedUnitId,
                    actionMode: state.actionMode,
                    actionMenuView: state.actionMenuView,
                    selectedTool: state.selectedTool,
                    partyBuilds: state.partyBuilds,
                    partyNames: state.partyNames,
                    loadouts: state.loadouts,
                    units: state.units,
                    boardTerrain: state.boardTerrain,
                    boardHeights: state.boardHeights,
                    boardColumns: state.boardColumns,
                    boardObjects: state.boardObjects,
                    hourglasses: state.hourglasses,
                    hourglassBuffs: state.hourglassBuffs,
                    hiddenItems: state.hiddenItems,
                    bombs: state.bombs,
                    plantedSeeds: state.plantedSeeds,
                    warpRunes: state.warpRunes,
                    placed: state.placed,
                    winner: state.winner,
                    matchNumber: state.matchNumber,

                }));
            },
            publicViewForPlayer(player) {
                const snap = this.snapshot();
                snap.hourglasses = snap.hourglasses.map(h => (
                    h.carriedBy || h.visibleTo?.[player] ?
                    h :
                    {
                        id: h.id,
                        x: null,
                        y: null,
                        visibleTo: h.visibleTo,
                        carriedBy: h.carriedBy
                    }
                ));
                snap.hiddenItems = snap.hiddenItems.map(item => (
                    item.collectedBy || item.visibleTo?.[player] ?
                    item :
                    {
                        id: item.id,
                        type: item.type,
                        x: null,
                        y: null,
                        visibleTo: item.visibleTo,
                        collectedBy: item.collectedBy
                    }
                ));
                return snap;
            },
            restore(snapshot) {
                Object.assign(state, snapshot);
            }
        };

        function downloadJson(filename, data) {
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            (document.getElementById("game-viewport") || document.body).appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }

        function serializeLoadoutForExport(loadout = emptyLoadout(), unit = null) {

            const spells = unit && unit.spells && unit.spells.length
                ? unit.spells.map(s => s.name || s)
                : (loadout.spells || []).filter(Boolean).map(id => getSpellById(id)?.name || id);
            return {
                spells,
                items: {
                    ...(loadout.items || {})
                }
            };
        }

        function serializeUnitForExport(unit) {
            return {
                id: unit.id,
                name: unit.name || unit.cls,
                cls: unit.cls,
                job: unit.job || unit.cls,
                race: unit.race || '',
                faction: unit.faction || '',
                types: [...(unit.types || [])],
                zodiac: unit.zodiac || '',
                sleepPreference: unit.sleepPreference || 'none',
                player: unit.player,
                hp: unit.hp,
                maxHp: unit.maxHp,
                mp: unit.mp,
                maxMp: unit.maxMp,
                atk: unit.atk,
                def: unit.def || 0,
                range: unit.range,
                move: unit.move,
                awr: unit.awr || 0,
                intStat: unit.intStat || 0,
                dead: !!unit.dead,
                ap: unit.ap || 0,
                hourglasses: unit.hourglasses || 0,
                hourglassBuff: unit.hourglassBuff || 0,
                gold: unit.gold || 0,
                x: unit.x,
                y: unit.y,
                shield: unit.shield || 0,
                status: {
                    ...(unit.status || {})
                },
                spells: (unit.spells || []).map(spell => spell.name),
                items: {
                    ...(unit.items || {})
                },

                damageDealt: unit._trackDmgDealt || 0,
                damageReceived: unit._trackDmgReceived || 0,
                healingDone: unit._trackHealDone || 0,
                healingReceived: unit._trackHealReceived || 0,
                kills: unit._trackKills || 0,
                deaths: unit._matchDeaths || 0,
                assists: unit._trackAssists || 0,
                crits: unit._matchCrits || 0,
                spellsCast: unit._trackSpellsCast || 0,
                xp: unit._xp || 0,
                level: getUnitLevel(unit),
                basicAttacks: unit._trackBasicAttacks || 0,
                tilesMoved: unit._trackTilesMoved || 0,
                spellLog: {
                    ...(unit._spellLog || {})
                },
                itemLog: {
                    ...(unit._itemLog || {})
                },
                statusesApplied: {
                    ...(unit._statusesApplied || {})
                },
                statusesReceived: {
                    ...(unit._statusLog || {})
                },
            };
        }

        function getCurrentWinCondition() {

            if (state._winCondition) return state._winCondition;

            const t1 = state.towers?.[1];
            const t2 = state.towers?.[2];
            if ((t1 && t1.hp <= 0) || (t2 && t2.hp <= 0)) return 'tower_destruction';
            const recent = (state.logEntries || [])[0] || '';
            if (/forfeit/i.test(recent)) return 'forfeit';
            return 'unknown';
        }

        function getCurrentEndingReason() {
            if (state._endingReason) return state._endingReason;
            return getCurrentWinCondition();
        }

        function buildMatchRecord() {
            const elapsed = state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0;
            return {
                exportedAt: new Date().toISOString(),
                matchNumber: state.matchNumber,
                winner: state.winner,
                winCondition: getCurrentWinCondition(),
                endingReason: getCurrentEndingReason(),
                stalemateRounds: state._stalemateRounds || 0,
                round: state.round,
                elapsedSeconds: elapsed,
                towerHpByTeam: {
                    1: {
                        hp: state.towers?.[1]?.hp ?? 0,
                        maxHp: state.towers?.[1]?.maxHp ?? TOWER_MAX_HP
                    },
                    2: {
                        hp: state.towers?.[2]?.hp ?? 0,
                        maxHp: state.towers?.[2]?.maxHp ?? TOWER_MAX_HP
                    }
                },
                hourglassesHeld: {
                    1: carriedHourglassCount(1),
                    2: carriedHourglassCount(2)
                },
                hourglassBuffs: {
                    1: state.hourglassBuffs?.[1] || 0,
                    2: state.hourglassBuffs?.[2] || 0
                },
                conditions: {
                    cycle: getCurrentCyclePhase(),
                    zodiac: state.activeZodiac || null,
                    skyEvent: state.skyEvent ? {
                        type: state.skyEvent.type,
                        remaining: state.skyEvent.remaining
                    } : null,
                    activeWeather: (state.activeWeather || []).map(w => ({
                        type: w.type,
                        remaining: w.remaining,
                        tiles: w.tiles.length
                    }))
                },
                teams: {
                    1: state.partyBuilds[1].map((cls, idx) => {
                        const unitId = `1-${idx}`;
                        const unit = state.units.find(u => u.id === unitId);
                        return {
                            slot: idx + 1,
                            cls,
                            name: state.partyNames[1][idx],
                            race: unit?.race || 'unknown',
                            loadout: serializeLoadoutForExport(state.loadouts[1][idx], unit),
                            stats: unit ? {
                                dead: !!unit.dead,
                                kills: unit._trackKills || 0,
                                assists: unit._trackAssists || 0,
                                deaths: unit._matchDeaths || 0,
                                crits: unit._matchCrits || 0,
                                dmgDealt: unit._trackDmgDealt || 0,
                                dmgReceived: unit._trackDmgReceived || 0,
                                healDone: unit._trackHealDone || 0,
                                healReceived: unit._trackHealReceived || 0,
                                spellsCast: unit._trackSpellsCast || 0,
                                basicAttacks: unit._trackBasicAttacks || 0,
                                tilesMoved: unit._trackTilesMoved || 0,
                                xp: unit._xp || 0,
                                levelReached: getUnitLevel(unit),
                                hourglasses: unit.hourglasses || 0,
                            } : null
                        };
                    }),
                    2: state.partyBuilds[2].map((cls, idx) => {
                        const unitId = `2-${idx}`;
                        const unit = state.units.find(u => u.id === unitId);
                        return {
                            slot: idx + 1,
                            cls,
                            name: state.partyNames[2][idx],
                            race: unit?.race || 'unknown',
                            loadout: serializeLoadoutForExport(state.loadouts[2][idx], unit),
                            stats: unit ? {
                                dead: !!unit.dead,
                                kills: unit._trackKills || 0,
                                assists: unit._trackAssists || 0,
                                deaths: unit._matchDeaths || 0,
                                crits: unit._matchCrits || 0,
                                dmgDealt: unit._trackDmgDealt || 0,
                                dmgReceived: unit._trackDmgReceived || 0,
                                healDone: unit._trackHealDone || 0,
                                healReceived: unit._trackHealReceived || 0,
                                spellsCast: unit._trackSpellsCast || 0,
                                basicAttacks: unit._trackBasicAttacks || 0,
                                tilesMoved: unit._trackTilesMoved || 0,
                                xp: unit._xp || 0,
                                levelReached: getUnitLevel(unit),
                                hourglasses: unit.hourglasses || 0,
                            } : null
                        };
                    })
                },
                units: state.units.map(serializeUnitForExport),
                combatLog: [...(state._fullLogEntries || state.logEntries || [])].reverse().map(e => _logMsg(e))
            };
        }

        function recordCompletedMatch() {
            if (state.winner === 1 || state.winner === 2) {
                const lastRecorded = state.lastCompletedMatch?.matchNumber === state.matchNumber;
                if (!lastRecorded) {
                    state.record[state.winner] = (state.record[state.winner] || 0) + 1;
                    state.wins[state.winner] = (state.wins[state.winner] || 0) + 1;
                    const loser = state.winner === 1 ? 2 : 1;
                    state.losses[loser] = (state.losses[loser] || 0) + 1;
                }
            }
            const record = buildMatchRecord();
            state.lastCompletedMatch = record;
            const existingIndex = (state.matchHistory || []).findIndex(entry => entry.matchNumber === record.matchNumber);
            if (existingIndex >= 0) state.matchHistory[existingIndex] = record;
            else state.matchHistory.push(record);
        }

        function exportLastMatch() {
            if (!state.lastCompletedMatch) {
                ewToast('No completed match to export yet.');
                return;
            }
            downloadJson(`entropy-wars-match-${state.lastCompletedMatch.matchNumber}.json`, state.lastCompletedMatch);
        }

        function exportMatchHistory() {
            if (!state.matchHistory || !state.matchHistory.length) {
                ewToast('No match history to export yet.');
                return;
            }
            downloadJson('entropy-wars-match-history.json', state.matchHistory);
        }

        function rerollOpponentForNextMatch() {
            const classNames = Object.keys(CLASS_TEMPLATES);
            const size = Math.max(CONFIG.teamSize, state.partyBuilds?.[2]?.length || 0);

            if (!state.partyMeta) state.partyMeta = {};
            state.partyMeta[2] = randomizePartyIdentities(size);
            state.partyBuilds[2] = state.partyMeta[2].map(meta => {
                const race = meta.race || 'homosapien';
                const lockedJob = (race !== 'homosapien' && typeof RACE_DEFAULT_JOBS !== 'undefined' && RACE_DEFAULT_JOBS[race])
                    ? RACE_DEFAULT_JOBS[race] : null;
                return lockedJob || classNames[randInt(classNames.length)];
            });
            state.partyNames[2] = state.partyBuilds[2].map(cls => getDefaultUnitName(cls));
            state.loadouts[2] = state.partyBuilds[2].map((cls, idx) => randomSpellLoadoutForClass(cls, state.partyMeta[2][idx]?.race || ''));

            state.partyBuilds[2].forEach((cls, idx) => {
                applyRandomSpellsAndSecJob(state.partyMeta[2][idx], cls);
            });
        }

        const boardEl = document.getElementById('board');
        const boardStageEl = document.getElementById('boardStage');
        const projectileLayerEl = document.getElementById('projectileLayer');
        const weatherOutlineSvg = document.getElementById('weatherOutlineSvg');
        const tornadoAnimLayer = document.getElementById('tornadoAnimLayer');
        const rainAnimLayer = document.getElementById('rainAnimLayer');
        const logEl = document.getElementById('log');
        const teamsEl = document.getElementById('teams');
        const builderEl = document.getElementById('builder');
        const phaseBox = document.getElementById('phaseBox');
        const turnLabel = document.getElementById('turnLabel');
        const roundLabel = document.getElementById('roundLabel');
        const objectiveLabel = document.getElementById('objectiveLabel');
        const cycleLabel = document.getElementById('cycleLabel');
        const terrainLabel = document.getElementById('terrainLabel');
        const actionPanel = document.getElementById('actionPanel');
        const selectedUnitPanel = document.getElementById('selectedUnitPanel');
        const audioControlsPanel = document.getElementById('audioControlsPanel');
        const mapCenterEl = document.querySelector('.map-center');
        const skyBackdropEl = document.querySelector('.sky-backdrop');
        let lastRenderedCycle = null;
        const scoreboardEl = document.getElementById('scoreboard');
        const unitHoverHud = document.getElementById('unitHoverHud');
        const sideP1HeldEl = document.getElementById('sideP1Held');
        const sideP2HeldEl = document.getElementById('sideP2Held');
        const autoBtn = document.getElementById('autoBtn');
        const forfeitBtn = document.getElementById('forfeitBtn');
        const resultOverlay = document.getElementById('resultOverlay');
        const nextMatchBtn = document.getElementById('nextMatchBtn');
        const exportLastMatchBtn = document.getElementById('exportLastMatchBtn');
        const exportMatchHistoryBtn = document.getElementById('exportMatchHistoryBtn');
        const startOverBtn = document.getElementById('startOverBtn');
        const startOverlay = document.getElementById('startOverlay');
        const enterGameBtn = document.getElementById('enterGameBtn');
        const musicVolumeSlider = document.getElementById('musicVolumeSlider');
        const sfxVolumeSlider = document.getElementById('sfxVolumeSlider');
        const musicVolumeValue = document.getElementById('musicVolumeValue');
        const sfxVolumeValue = document.getElementById('sfxVolumeValue');
        const skipTrackBtn = document.getElementById('skipTrackBtn');

        let audioTracks;

        if (boardStageEl) {
            const _boardWheelParent = boardStageEl.parentElement || boardStageEl;
            _boardWheelParent.addEventListener('wheel', (e) => {
                if (state.phase !== 'battle' && state.phase !== 'editor') return;
                if (state.thirdPersonCamera) return;
                /* Scrolling over the Horologe action menu cycles its blade
                   drum, and over a sub/quick panel it scrolls the list — never
                   zoom the camera from there. (The menu handles its own wheel
                   with preventDefault; panels keep native scrolling, so no
                   preventDefault here.) */
                if (e.target && e.target.closest &&
                    e.target.closest('.hrlg-rig, .hrlg-panel, .hrlg-hub, .hrlg-crown')) return;
                e.preventDefault();
                const step = 0.1;
                const delta = e.deltaY > 0 ? -step : step;

                const currentTransform = (boardStageEl?.style.transform || '').match(/scale\(([^)]+)\)/);
                const displayedZoom = currentTransform ? parseFloat(currentTransform[1]) : getDefaultZoom();
                const oldZoom = (typeof isUserZoomEngaged === 'function' && isUserZoomEngaged()) ? state.userZoomScale : displayedZoom;
                const newZoom = Math.round(Math.max(0.25, Math.min(10.0, oldZoom + delta)) * 100) / 100;
                if (Math.abs(newZoom - oldZoom) < 0.01) return;
                state.userZoomScale = newZoom;
                const btn = document.getElementById('zoomToggleBtn');
                if (btn) {
                    btn.textContent = getUserZoomLabel();
                    btn.classList.toggle('active', typeof isUserZoomEngaged === 'function' ? isUserZoomEngaged() : newZoom > 1.05);
                }

                if (typeof camera !== 'undefined') {
                    camera.snap({ _force: true, zoom: newZoom });
                    return;
                }

                const curTransform = (boardStageEl.style.transform || '').match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)\s*scale\(([-\d.]+)\)/);
                const curTx = curTransform ? parseFloat(curTransform[1]) : 0;
                const curTy = curTransform ? parseFloat(curTransform[2]) : 0;
                const curScale = curTransform ? parseFloat(curTransform[3]) : 1;
                const parentRect = (boardStageEl.parentElement || boardStageEl).getBoundingClientRect();
                const mouseX = e.clientX - parentRect.left;
                const mouseY = e.clientY - parentRect.top;
                const stageOriginX = boardStageEl.offsetLeft || 0;
                const stageOriginY = boardStageEl.offsetTop || 0;
                const pointX = (mouseX - stageOriginX - curTx) / curScale;
                const pointY = (mouseY - stageOriginY - curTy) / curScale;
                const newTx = mouseX - stageOriginX - pointX * newZoom;
                const newTy = mouseY - stageOriginY - pointY * newZoom;
                boardStageEl.style.transform = `translate(${newTx}px, ${newTy}px) scale(${newZoom})`;
                if (typeof setBoardZoomState === 'function') setBoardZoomState(newZoom);
            }, {
                passive: false
            });

            let _panActive = false;
            let _panStartX = 0;
            let _panStartY = 0;
            let _panStartTx = 0;
            let _panStartTy = 0;
            let _panStartZoom = 1;
            let _panMoved = false;
            let _panStartT = 0;

            let _panStartFocalPx = 0;
            let _panStartFocalPy = 0;

            let _panStartCamX = 0;
            let _panStartCamY = 0;

            function _getPanTransform() {
                const t = boardStageEl.style.transform || '';
                const match = t.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)\s*scale\(([-\d.]+)\)/);
                if (match) return { tx: parseFloat(match[1]), ty: parseFloat(match[2]), zoom: parseFloat(match[3]) };
                return { tx: 0, ty: 0, zoom: 1 };
            }

            _boardWheelParent.addEventListener('mousedown', (e) => {
                if (state.phase !== 'battle' && state.phase !== 'editor') return;
                if (state.thirdPersonCamera) return;

                if (e.button === 2) {
                    e.preventDefault();
                    _panActive = true;
                    _panMoved = false;
                    state._userPanning = true;
                    _panStartT = performance.now();
                    _panStartX = e.clientX;
                    _panStartY = e.clientY;
                    if (typeof camera !== 'undefined') {
                        const ts = CONFIG.tileSize || BASE_TILE;
                        const gap = CONFIG.tileGap ?? 0;
                        const pad = CONFIG.boardPadding ?? 2;
                        _panStartFocalPx = pad + camera.x * (ts + gap) + ts / 2;
                        _panStartFocalPy = pad + camera.y * (ts + gap) + ts / 2;
                        _panStartZoom = camera.zoom;
                        _panStartCamX = camera.x;
                        _panStartCamY = camera.y;
                    } else {
                        const t = _getPanTransform();
                        _panStartTx = t.tx;
                        _panStartTy = t.ty;
                        _panStartZoom = t.zoom;
                    }
                    if (typeof camera !== 'undefined') camera._stop();
                    else if (typeof stopBoardCameraAnimation === 'function') stopBoardCameraAnimation();
                }
            });

            document.addEventListener('mousemove', (e) => {
                if (!_panActive) return;
                const dx = e.clientX - _panStartX;
                const dy = e.clientY - _panStartY;
                if ((Math.abs(dx) > 3 || Math.abs(dy) > 3) && !_panMoved) {
                    _panMoved = true;
                    // A free pan detaches the follow camera — hand the player
                    // back to tactical instead of dragging a camera that will
                    // just re-attach to the unit on the next action.
                    if (state.phase === 'battle'
                        && typeof isFollowCamMode === 'function' && isFollowCamMode()
                        && typeof setCameraMode === 'function') {
                        setCameraMode('tactical', { silent: true });
                        if (typeof window._ewToast === 'function') window._ewToast('🗺 TACTICAL CAMERA', 1100);
                    }
                }

                if (typeof camera !== 'undefined') {

                    if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive()
                        && typeof ThreeCamera !== 'undefined' && ThreeCamera.screenDeltaToWorldXZ) {
                        const delta = ThreeCamera.screenDeltaToWorldXZ(dx, dy);
                        if (delta) {
                            const ts = CONFIG.tileSize || BASE_TILE;

                            const tileX = _panStartCamX - delta.wx / ts;
                            const tileY = _panStartCamY - delta.wz / ts;
                            camera.snap({ _force: true, x: tileX, y: tileY, zoom: _panStartZoom });
                            if (ThreeCamera.markUserInput) ThreeCamera.markUserInput();
                            return;
                        }
                    }

                    const ts = CONFIG.tileSize || BASE_TILE;
                    const gap = CONFIG.tileGap ?? 0;
                    const pad = CONFIG.boardPadding ?? 2;
                    const tiltCos = Math.max(0.15, Math.cos((state.dioramaTiltDeg ?? 50) * Math.PI / 180));

                    const yawRad = -(state.dioramaYawDeg ?? 0) * Math.PI / 180;
                    const cosY = Math.cos(yawRad);
                    const sinY = Math.sin(yawRad);
                    const boardDx = (dx * cosY + dy * sinY) / _panStartZoom;
                    const boardDy = (-dx * sinY + dy * cosY) / (_panStartZoom * tiltCos);
                    const newFocalPx = _panStartFocalPx - boardDx;
                    const newFocalPy = _panStartFocalPy - boardDy;
                    const stride = ts + gap;
                    const tileX = (newFocalPx - pad - ts / 2) / stride;
                    const tileY = (newFocalPy - pad - ts / 2) / stride;
                    camera.snap({ _force: true, x: tileX, y: tileY, zoom: _panStartZoom });
                    return;
                }

                const newTx = _panStartTx + dx;
                const newTy = _panStartTy + dy;
                boardStageEl.style.transform = `translate(${newTx}px, ${newTy}px) scale(${_panStartZoom})`;
            });

            document.addEventListener('mouseup', (e) => {
                if (!_panActive) return;
                _panActive = false;
                state._userPanning = false;

                if (_panMoved && state._deferredTurnPanUnitId) {
                    const defId = state._deferredTurnPanUnitId;
                    state._deferredTurnPanUnitId = null;
                    const u = state.units?.find(u => u.id === defId && !u.dead);
                    if (u && typeof focusBoardCameraOnTiles === 'function') {
                        const baseZoom = (typeof getUserZoomScale === 'function') ? getUserZoomScale() : 1;
                        const zoom = (typeof isUserZoomEngaged === 'function' && isUserZoomEngaged()) ? baseZoom : ((typeof getDefaultZoom === 'function') ? getDefaultZoom() : 1);
                        focusBoardCameraOnTiles([{ x: u.x, y: u.y }], {
                            zoom,
                            holdMs: 99999,
                            persist: true,
                            transitionMs: 500
                        });
                    }
                }

                // A clean single right-CLICK on the board (no drag, quick
                // release) mirrors the action-menu BACK button: step out of the
                // open submenu / target-aim mode. Routed through
                // handleBackAction(), which can never end the turn (unlike the
                // crown, which doubles as END TURN at the root menu) — and only
                // when there is actually something to back out of, so a stray
                // right-click at the root menu does nothing at all.
                if (e.button === 2 && !_panMoved && state.phase === 'battle'
                    && (performance.now() - _panStartT) < 450
                    && typeof handleBackAction === 'function') {
                    const backable = (state.actionMenuView && state.actionMenuView !== 'root')
                        || state.actionMode || state.selectedTool || state.pendingTarget
                        || state._enemyActionTargetId || state._tileActionTarget
                        || state.showUnitInfo;
                    if (backable) handleBackAction();
                }
            });

            let _tiltActive = false;
            let _tiltStartX = 0;
            let _tiltStartY = 0;
            let _tiltStartDeg = 50;
            let _yawStartDeg = 0;

            _boardWheelParent.addEventListener('contextmenu', (e) => {
                if (state.phase === 'battle' || state.phase === 'editor') e.preventDefault();
            });

            _boardWheelParent.addEventListener('mousedown', (e) => {
                if (e.button !== 1) return;
                if (state.thirdPersonCamera) return;
                if (state.phase !== 'battle' && state.phase !== 'editor') return;
                e.preventDefault();
                _tiltActive = true;

                // Mark the camera as user-held so a unit activating mid-drag
                // defers its pan (selectUnit → _deferredTurnPanUnitId) instead
                // of fighting the drag — consumed on mouseup below.
                state._userPanning = true;
                _tiltStartX = e.clientX;
                _tiltStartY = e.clientY;
                _tiltStartDeg = state.dioramaTiltDeg ?? 50;
                _yawStartDeg = state.dioramaYawDeg ?? 0;
                if (typeof camera !== 'undefined') camera._stop();
            });

            document.addEventListener('mousemove', (e) => {
                if (!_tiltActive) return;
                const dx = e.clientX - _tiltStartX;
                const dy = e.clientY - _tiltStartY;
                // Clamp pitch to [top-down .. craned up into the sky]. 0° is
                // straight down, 90° is dead-level at the horizon, and past 90°
                // the gaze pitches UP at the sky dome (the camera rides the
                // ground floor instead of dipping below the map — see
                // ThreeCamera.sync). 135° = ~45° above the horizon.
                const newTilt = Math.round(Math.max(0, Math.min(135, _tiltStartDeg + dy * 0.3)) * 10) / 10;
                const newYaw = Math.round((_yawStartDeg + dx * 0.4) * 10) / 10;
                const tiltChanged = Math.abs(newTilt - (state.dioramaTiltDeg ?? 50)) >= 0.1;
                const yawChanged = Math.abs(newYaw - (state.dioramaYawDeg ?? 0)) >= 0.1;
                if (!tiltChanged && !yawChanged) return;
                if (typeof camera !== 'undefined') {
                    camera.snap({ _force: true, tilt: newTilt, yaw: newYaw });
                }
            });

            document.addEventListener('mouseup', (e) => {
                if (e.button !== 1) return;
                if (!_tiltActive) return;
                _tiltActive = false;
                state._userPanning = false;

                // A unit's turn started while the camera was held — pan to it
                // now so the player isn't left staring at the wrong place.
                if (state._deferredTurnPanUnitId) {
                    const defId = state._deferredTurnPanUnitId;
                    state._deferredTurnPanUnitId = null;
                    const u = state.units?.find(u => u.id === defId && !u.dead);
                    if (u && typeof focusBoardCameraOnTiles === 'function') {
                        const baseZoom = (typeof getUserZoomScale === 'function') ? getUserZoomScale() : 1;
                        const zoom = (typeof isUserZoomEngaged === 'function' && isUserZoomEngaged()) ? baseZoom : ((typeof getDefaultZoom === 'function') ? getDefaultZoom() : 1);
                        focusBoardCameraOnTiles([{ x: u.x, y: u.y }], {
                            zoom,
                            holdMs: 99999,
                            persist: true,
                            transitionMs: 500
                        });
                    }
                }
            });

            let _touchPanId = null;
            let _pinchStartDist = 0;
            let _pinchStartZoom = 1;
            let _twistStartAngle = 0;
            let _twistStartYaw = 0;
            let _touch1Active = false;
            let _touch1StartX = 0;
            let _touch1StartY = 0;
            let _touch1Dragged = false;
            let _touch3Active = false;
            let _touch3StartY = 0;
            let _touch3StartTilt = 50;
            let _touch3StartYaw = 0;
            let _touch3StartX = 0;

            function _getTouchDist(t0, t1) {
                const dx = t0.clientX - t1.clientX;
                const dy = t0.clientY - t1.clientY;
                return Math.sqrt(dx * dx + dy * dy);
            }

            function _getTouchAngle(t0, t1) {
                return Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
            }

            let _suppressNextClick = false;
            _boardWheelParent.addEventListener('click', (e) => {
                if (_suppressNextClick) {
                    e.stopPropagation();
                    e.preventDefault();
                    _suppressNextClick = false;
                }
            }, true);

            function _init2Finger(e) {
                _touchPanId = true;
                _panMoved = false;
                state._userPanning = true;
                const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                _panStartX = midX;
                _panStartY = midY;
                if (typeof camera !== 'undefined') {
                    const ts = CONFIG.tileSize || BASE_TILE;
                    const gap = CONFIG.tileGap ?? 0;
                    const pad = CONFIG.boardPadding ?? 2;
                    _panStartFocalPx = pad + camera.x * (ts + gap) + ts / 2;
                    _panStartFocalPy = pad + camera.y * (ts + gap) + ts / 2;
                    _panStartZoom = camera.zoom;
                    _panStartCamX = camera.x;
                    _panStartCamY = camera.y;
                } else {
                    const t = _getPanTransform();
                    _panStartTx = t.tx;
                    _panStartTy = t.ty;
                    _panStartZoom = t.zoom;
                }
                _pinchStartDist = _getTouchDist(e.touches[0], e.touches[1]);
                _pinchStartZoom = _panStartZoom;
                _twistStartAngle = _getTouchAngle(e.touches[0], e.touches[1]);
                _twistStartYaw = state.dioramaYawDeg ?? 0;
                if (typeof camera !== 'undefined') camera._stop();
                else if (typeof stopBoardCameraAnimation === 'function') stopBoardCameraAnimation();
            }

            _boardWheelParent.addEventListener('touchstart', (e) => {
                if (state.phase !== 'battle' && state.phase !== 'editor') return;
                if (state.thirdPersonCamera) return;

                if (e.touches.length >= 3) {
                    e.preventDefault();

                    _touch1Active = false;
                    _touchPanId = null;
                    _touch3Active = true;
                    const midY = (e.touches[0].clientY + e.touches[1].clientY + e.touches[2].clientY) / 3;
                    const midX = (e.touches[0].clientX + e.touches[1].clientX + e.touches[2].clientX) / 3;
                    _touch3StartY = midY;
                    _touch3StartX = midX;
                    _touch3StartTilt = state.dioramaTiltDeg ?? 50;
                    _touch3StartYaw = state.dioramaYawDeg ?? 0;
                    if (typeof camera !== 'undefined') camera._stop();
                    return;
                }

                if (e.touches.length === 2) {
                    e.preventDefault();

                    if (_touch1Active) {
                        _touch1Active = false;
                        _suppressNextClick = true;
                    }
                    _init2Finger(e);
                    return;
                }

                if (e.touches.length === 1) {
                    _touch1Active = true;
                    _touch1Dragged = false;
                    _touch1StartX = e.touches[0].clientX;
                    _touch1StartY = e.touches[0].clientY;
                    if (typeof camera !== 'undefined') {
                        const ts = CONFIG.tileSize || BASE_TILE;
                        const gap = CONFIG.tileGap ?? 0;
                        const pad = CONFIG.boardPadding ?? 2;
                        _panStartFocalPx = pad + camera.x * (ts + gap) + ts / 2;
                        _panStartFocalPy = pad + camera.y * (ts + gap) + ts / 2;
                        _panStartZoom = camera.zoom;
                        _panStartCamX = camera.x;
                        _panStartCamY = camera.y;
                    } else {
                        const t = _getPanTransform();
                        _panStartTx = t.tx;
                        _panStartTy = t.ty;
                        _panStartZoom = t.zoom;
                    }

                }
            }, { passive: false });

            _boardWheelParent.addEventListener('touchmove', (e) => {
                if (state.phase !== 'battle' && state.phase !== 'editor') return;
                if (state.thirdPersonCamera) return;

                if (_touch3Active && e.touches.length >= 3) {
                    e.preventDefault();
                    const midY = (e.touches[0].clientY + e.touches[1].clientY + e.touches[2].clientY) / 3;
                    const midX = (e.touches[0].clientX + e.touches[1].clientX + e.touches[2].clientX) / 3;
                    const dy = midY - _touch3StartY;
                    const dx = midX - _touch3StartX;
                    // Clamp pitch so craning up cranes the gaze into the sky
                    // (past 90° the camera rides the ground floor and looks up
                    // at the sky dome rather than dipping below the map).
                    const newTilt = Math.round(Math.max(0, Math.min(135, _touch3StartTilt + dy * 0.3)) * 10) / 10;
                    const newYaw = Math.round((_touch3StartYaw + dx * 0.4) * 10) / 10;
                    if (typeof camera !== 'undefined') {
                        camera.snap({ _force: true, tilt: newTilt, yaw: newYaw });
                    }
                    return;
                }

                if (_touchPanId && e.touches.length === 2) {
                    e.preventDefault();
                    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                    const dx = midX - _panStartX;
                    const dy = midY - _panStartY;
                    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) _panMoved = true;

                    const curDist = _getTouchDist(e.touches[0], e.touches[1]);
                    const zoomRatio = _pinchStartDist > 10 ? (curDist / _pinchStartDist) : 1;
                    const newZoom = Math.round(Math.max(0.25, Math.min(10.0, _pinchStartZoom * zoomRatio)) * 100) / 100;

                    const curAngle = _getTouchAngle(e.touches[0], e.touches[1]);
                    let angleDelta = (curAngle - _twistStartAngle) * (180 / Math.PI);

                    angleDelta = ((angleDelta % 360) + 540) % 360 - 180;
                    const newYaw = Math.round((_twistStartYaw + angleDelta) * 10) / 10;
                    const yawChanged = Math.abs(newYaw - (state.dioramaYawDeg ?? 0)) >= 0.5;

                    if (typeof camera !== 'undefined') {

                        const snapOpts = { _force: true, zoom: newZoom };
                        if (yawChanged) snapOpts.yaw = newYaw;

                        if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive()
                            && typeof ThreeCamera !== 'undefined' && ThreeCamera.screenDeltaToWorldXZ) {
                            const delta = ThreeCamera.screenDeltaToWorldXZ(dx, dy);
                            if (delta) {
                                const ts = CONFIG.tileSize || BASE_TILE;
                                snapOpts.x = _panStartCamX - delta.wx / ts;
                                snapOpts.y = _panStartCamY - delta.wz / ts;
                                camera.snap(snapOpts);
                                if (ThreeCamera.markUserInput) ThreeCamera.markUserInput();
                                return;
                            }
                        }

                        const ts = CONFIG.tileSize || BASE_TILE;
                        const gap = CONFIG.tileGap ?? 0;
                        const pad = CONFIG.boardPadding ?? 2;
                        const tiltCos = Math.cos((state.dioramaTiltDeg ?? 50) * Math.PI / 180);
                        const yawRad = (state.dioramaYawDeg ?? 0) * Math.PI / 180;
                        const cosY = Math.cos(yawRad);
                        const sinY = Math.sin(yawRad);
                        const boardDx = (dx * cosY + dy * sinY) / _panStartZoom;
                        const boardDy = (-dx * sinY + dy * cosY) / (_panStartZoom * tiltCos);
                        const newFocalPx = _panStartFocalPx - boardDx;
                        const newFocalPy = _panStartFocalPy - boardDy;
                        const stride = ts + gap;
                        snapOpts.x = (newFocalPx - pad - ts / 2) / stride;
                        snapOpts.y = (newFocalPy - pad - ts / 2) / stride;
                        camera.snap(snapOpts);
                        return;
                    }

                    const newTx = _panStartTx + dx;
                    const newTy = _panStartTy + dy;
                    boardStageEl.style.transform = `translate(${newTx}px, ${newTy}px) scale(${newZoom})`;
                    return;
                }

                if (_touch1Active && e.touches.length === 1) {
                    const tx = e.touches[0].clientX;
                    const ty = e.touches[0].clientY;
                    const dx = tx - _touch1StartX;
                    const dy = ty - _touch1StartY;

                    if (!_touch1Dragged) {
                        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                            _touch1Dragged = true;
                            state._userPanning = true;
                            if (typeof camera !== 'undefined') camera._stop();
                            else if (typeof stopBoardCameraAnimation === 'function') stopBoardCameraAnimation();
                        } else {
                            return;
                        }
                    }

                    e.preventDefault();

                    if (typeof camera !== 'undefined') {

                        if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive()
                            && typeof ThreeCamera !== 'undefined' && ThreeCamera.screenDeltaToWorldXZ) {
                            const delta = ThreeCamera.screenDeltaToWorldXZ(dx, dy);
                            if (delta) {
                                const ts = CONFIG.tileSize || BASE_TILE;
                                const tileX = _panStartCamX - delta.wx / ts;
                                const tileY = _panStartCamY - delta.wz / ts;
                                camera.snap({ _force: true, x: tileX, y: tileY });
                                if (ThreeCamera.markUserInput) ThreeCamera.markUserInput();
                                return;
                            }
                        }

                        const ts = CONFIG.tileSize || BASE_TILE;
                        const gap = CONFIG.tileGap ?? 0;
                        const pad = CONFIG.boardPadding ?? 2;
                        const tiltCos = Math.max(0.15, Math.cos((state.dioramaTiltDeg ?? 50) * Math.PI / 180));
                        const yawRad = -(state.dioramaYawDeg ?? 0) * Math.PI / 180;
                        const cosY = Math.cos(yawRad);
                        const sinY = Math.sin(yawRad);
                        const boardDx = (dx * cosY + dy * sinY) / _panStartZoom;
                        const boardDy = (-dx * sinY + dy * cosY) / (_panStartZoom * tiltCos);
                        const newFocalPx = _panStartFocalPx - boardDx;
                        const newFocalPy = _panStartFocalPy - boardDy;
                        const stride = ts + gap;
                        const tileX = (newFocalPx - pad - ts / 2) / stride;
                        const tileY = (newFocalPy - pad - ts / 2) / stride;
                        camera.snap({ _force: true, x: tileX, y: tileY });
                        return;
                    }

                    const newTx = _panStartTx + dx;
                    const newTy = _panStartTy + dy;
                    boardStageEl.style.transform = `translate(${newTx}px, ${newTy}px) scale(${_panStartZoom})`;
                    return;
                }
            }, { passive: false });

            _boardWheelParent.addEventListener('touchend', (e) => {

                if (_touch3Active) {

                    if (e.touches.length === 2) {
                        _touch3Active = false;
                        _init2Finger(e);
                    } else if (e.touches.length < 2) {
                        _touch3Active = false;
                    }
                }

                if (_touchPanId && e.touches.length < 2) {
                    if (typeof camera !== 'undefined') {
                        if (camera.zoom > 0.4) {
                            state.userZoomScale = camera.zoom;
                            const btn = document.getElementById('zoomToggleBtn');
                            if (btn) {
                                btn.textContent = getUserZoomLabel();
                                btn.classList.toggle('active', typeof isUserZoomEngaged === 'function' ? isUserZoomEngaged() : camera.zoom > 1.05);
                            }
                        }
                    } else {
                        const t = _getPanTransform();
                        if (t.zoom > 0.4) {
                            state.userZoomScale = t.zoom;
                            const btn = document.getElementById('zoomToggleBtn');
                            if (btn) {
                                btn.textContent = getUserZoomLabel();
                                btn.classList.toggle('active', typeof isUserZoomEngaged === 'function' ? isUserZoomEngaged() : t.zoom > 1.05);
                            }
                        }
                    }
                    _touchPanId = null;
                    _suppressNextClick = true;

                    if (e.touches.length === 1) {
                        _touch1Active = true;
                        _touch1Dragged = true;
                        _touch1StartX = e.touches[0].clientX;
                        _touch1StartY = e.touches[0].clientY;
                        if (typeof camera !== 'undefined') {
                            const ts = CONFIG.tileSize || BASE_TILE;
                            const gap = CONFIG.tileGap ?? 0;
                            const pad = CONFIG.boardPadding ?? 2;
                            _panStartFocalPx = pad + camera.x * (ts + gap) + ts / 2;
                            _panStartFocalPy = pad + camera.y * (ts + gap) + ts / 2;
                            _panStartZoom = camera.zoom;
                            _panStartCamX = camera.x;
                            _panStartCamY = camera.y;
                        }
                    } else {

                        state._userPanning = false;
                        if (_panMoved && state._deferredTurnPanUnitId) {
                            const defId = state._deferredTurnPanUnitId;
                            state._deferredTurnPanUnitId = null;
                            const u = state.units?.find(u => u.id === defId && !u.dead);
                            if (u && typeof focusBoardCameraOnTiles === 'function') {
                                const baseZoom = (typeof getUserZoomScale === 'function') ? getUserZoomScale() : 1;
                                const zoom = (typeof isUserZoomEngaged === 'function' && isUserZoomEngaged()) ? baseZoom : ((typeof getDefaultZoom === 'function') ? getDefaultZoom() : 1);
                                focusBoardCameraOnTiles([{ x: u.x, y: u.y }], {
                                    zoom,
                                    holdMs: 99999,
                                    persist: true,
                                    transitionMs: 500
                                });
                            }
                        }
                    }
                }

                if (_touch1Active && e.touches.length === 0) {
                    if (_touch1Dragged) {
                        _suppressNextClick = true;
                        state._userPanning = false;

                        if (state._deferredTurnPanUnitId) {
                            const defId = state._deferredTurnPanUnitId;
                            state._deferredTurnPanUnitId = null;
                            const u = state.units?.find(u => u.id === defId && !u.dead);
                            if (u && typeof focusBoardCameraOnTiles === 'function') {
                                const baseZoom = (typeof getUserZoomScale === 'function') ? getUserZoomScale() : 1;
                                const zoom = (typeof isUserZoomEngaged === 'function' && isUserZoomEngaged()) ? baseZoom : ((typeof getDefaultZoom === 'function') ? getDefaultZoom() : 1);
                                focusBoardCameraOnTiles([{ x: u.x, y: u.y }], {
                                    zoom,
                                    holdMs: 99999,
                                    persist: true,
                                    transitionMs: 500
                                });
                            }
                        }
                    }
                    _touch1Active = false;
                }
            });

        }

        /* ═══════════════════════════════════════════════════════════════════
           GAMEPAD + INPUT-DEVICE LAYER (window.EWInput / window.EWPad)
           ═══════════════════════════════════════════════════════════════════
           Optional controller support (built/tested around a Switch Pro pad
           over USB in Firefox, works with any Gamepad-API pad). Design rules:
           - NOTHING here replaces mouse/keyboard — the pad drives the SAME
             battle-tested entry points the mouse and keyboard already use:
             synthetic W/A/S/D + ENTER keydowns for walking and the board
             cursor (ui.js owns that logic), the Horologe menu hook
             (window._hrlgPad, hud.js) for the action drum, camera.snap for
             orbit/pan/zoom (what the mouse drag handlers call), and the bare
             globals clickTile / handleBackAction / triggerEndTurn.
           - Bindings are remappable (Controls tab / main-menu Settings) and
             persisted in ew_padBindings; stick options in ew_padOpts.
           - window.EWInput.device ('kbm' | 'pad') tracks the LAST device the
             player touched; the HUD swaps its button hints off it (event
             'ew-input-device', plus body[data-input-device]).                */

        const EWInput = {
            device: 'kbm',
            setDevice(d) {
                if (this.device === d) return;
                this.device = d;
                try { document.body && document.body.setAttribute('data-input-device', d); } catch (e) {}
                try { window.dispatchEvent(new CustomEvent('ew-input-device', { detail: d })); } catch (e) {}
            }
        };
        window.EWInput = EWInput;
        // Real (trusted) kb/mouse activity flips the hints back to kb+mouse.
        // The pad layer dispatches SYNTHETIC key events — isTrusted filters those.
        window.addEventListener('keydown', (e) => { if (e.isTrusted) EWInput.setDevice('kbm'); }, { capture: true, passive: true });
        window.addEventListener('pointerdown', (e) => { if (e.isTrusted) EWInput.setDevice('kbm'); }, { capture: true, passive: true });
        window.addEventListener('wheel', (e) => { if (e.isTrusted) EWInput.setDevice('kbm'); }, { capture: true, passive: true });

        /* ── small announcement toast (also used by camera-mode switches) ── */
        let _ewToastEl = null, _ewToastTimer = null;
        window._ewToast = function (msg, ms) {
            try {
                if (!_ewToastEl) {
                    _ewToastEl = document.createElement('div');
                    _ewToastEl.id = 'ewInputToast';
                    _ewToastEl.style.cssText =
                        'position:fixed;left:50%;top:16%;transform:translate(-50%,-8px);' +
                        'font-family:DotGothic16,monospace;font-size:15px;letter-spacing:0.18em;' +
                        'color:#e8ecff;background:rgba(8,10,18,0.88);border:1px solid rgba(140,160,220,0.45);' +
                        'padding:8px 18px;z-index:4000;pointer-events:none;opacity:0;white-space:nowrap;' +
                        'clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);' +
                        'text-shadow:0 1px 3px rgba(0,0,0,0.9);transition:opacity 160ms ease,transform 160ms ease;';
                    document.body.appendChild(_ewToastEl);
                }
                _ewToastEl.textContent = msg;
                _ewToastEl.style.opacity = '1';
                _ewToastEl.style.transform = 'translate(-50%,0)';
                if (_ewToastTimer) clearTimeout(_ewToastTimer);
                _ewToastTimer = setTimeout(() => {
                    _ewToastEl.style.opacity = '0';
                    _ewToastEl.style.transform = 'translate(-50%,-8px)';
                }, ms || 1500);
            } catch (e) {}
        };

        /* ── two-press END TURN (shared by the pad X button and SPACE) ───── */
        let _ewEndTurnArmT = 0;
        window._ewRequestEndTurn = function () {
            if (state.phase !== 'battle' || state.winner) return;
            if (state.autoPlayers?.[state.activePlayer]) return;
            if (state._actionExecuting) return;
            if (typeof getViewerPlayer === 'function' && state.activePlayer !== getViewerPlayer()) return;
            const now = performance.now();
            if (now < _ewEndTurnArmT) {
                _ewEndTurnArmT = 0;
                if (typeof playSfx === 'function') playSfx('uiConfirm');
                if (typeof window._hrlgNoteAction === 'function') window._hrlgNoteAction(700);
                if (typeof triggerEndTurn === 'function') triggerEndTurn();
            } else {
                _ewEndTurnArmT = now + 1600;
                if (typeof playSfx === 'function') playSfx('uiCursorMove');
                window._ewToast('PRESS AGAIN TO END TURN', 1500);
            }
        };

        /* ── pad actions + default bindings (standard-mapping indices) ─────
           Standard mapping is POSITIONAL: 0=bottom, 1=right, 2=left, 3=top
           face button. Nintendo pads confirm with A (right, 1) and cancel
           with B (bottom, 0); Xbox/PS pads confirm with the BOTTOM button.
           The per-vendor default flips just those two.                      */
        const PAD_ACTIONS = [
            { id: 'confirm',    label: 'Confirm / Select' },
            { id: 'cancel',     label: 'Cancel / Back' },
            { id: 'endTurn',    label: 'End Turn (press twice)' },
            { id: 'cameraMode', label: 'Camera Mode' },
            { id: 'targetPrev', label: 'Previous Target' },
            { id: 'targetNext', label: 'Next Target' },
            { id: 'zoomOut',    label: 'Zoom Out' },
            { id: 'zoomIn',     label: 'Zoom In' },
            { id: 'overview',   label: 'Full-Map Overview' },
            { id: 'pause',      label: 'Pause Menu' },
            { id: 'recenter',   label: 'Recenter Camera' },
            { id: 'menuUp',     label: 'Menu / Cursor Up' },
            { id: 'menuDown',   label: 'Menu / Cursor Down' },
            { id: 'menuLeft',   label: 'Menu / Cursor Left' },
            { id: 'menuRight',  label: 'Menu / Cursor Right' },
        ];
        const PAD_DEFAULTS_NINTENDO = {
            confirm: 1, cancel: 0, endTurn: 3, cameraMode: 2,
            targetPrev: 4, targetNext: 5, zoomOut: 6, zoomIn: 7,
            overview: 8, pause: 9, recenter: 11,
            menuUp: 12, menuDown: 13, menuLeft: 14, menuRight: 15,
        };
        const PAD_DEFAULTS_GENERIC = {
            ...PAD_DEFAULTS_NINTENDO,
            confirm: 0, cancel: 1,
        };

        const EWPad = (function () {
            let padIndex = null;
            let padId = '';
            let vendor = 'generic';           // 'nintendo' | 'xbox' | 'playstation' | 'generic'
            let bindings = null;              // action id → button index
            let opts = { invertY: false, invertX: false, sensitivity: 1, deadzone: 0.18, vibration: true };
            let prevPressed = [];
            let rebind = null;                // { id, cb, until }
            let lastLoopT = 0;
            let idleCheckT = 0;
            let stickPanning = false;         // right stick currently orbiting
            let lastCursorStepT = 0;
            let heldDirKey = null;            // for step repeat
            let heldDirSince = 0;
            let menuRepeatT = 0;
            let everConnected = false;

            function _detectVendor(id) {
                const s = String(id || '').toLowerCase();
                if (/(nintendo|pro controller|joy-con|057e)/.test(s)) return 'nintendo';
                if (/(sony|playstation|dualshock|dualsense|054c)/.test(s)) return 'playstation';
                if (/(xbox|xinput|microsoft|045e)/.test(s)) return 'xbox';
                return 'generic';
            }
            function _defaults() {
                return vendor === 'nintendo' ? { ...PAD_DEFAULTS_NINTENDO } : { ...PAD_DEFAULTS_GENERIC };
            }
            function _loadBindings() {
                bindings = _defaults();
                try {
                    const raw = localStorage.getItem('ew_padBindings');
                    if (raw) {
                        const saved = JSON.parse(raw);
                        if (saved && typeof saved === 'object') {
                            for (const a of PAD_ACTIONS) {
                                if (Number.isInteger(saved[a.id])) bindings[a.id] = saved[a.id];
                            }
                        }
                    }
                } catch (e) {}
                try {
                    const raw = localStorage.getItem('ew_padOpts');
                    if (raw) {
                        const saved = JSON.parse(raw);
                        if (saved && typeof saved === 'object') {
                            if (typeof saved.invertY === 'boolean') opts.invertY = saved.invertY;
                            if (typeof saved.invertX === 'boolean') opts.invertX = saved.invertX;
                            if (typeof saved.sensitivity === 'number') opts.sensitivity = Math.max(0.3, Math.min(2.5, saved.sensitivity));
                            if (typeof saved.deadzone === 'number') opts.deadzone = Math.max(0.05, Math.min(0.45, saved.deadzone));
                            if (typeof saved.vibration === 'boolean') opts.vibration = saved.vibration;
                        }
                    }
                } catch (e) {}
            }
            function _saveBindings() {
                try { localStorage.setItem('ew_padBindings', JSON.stringify(bindings)); } catch (e) {}
            }
            function _saveOpts() {
                try { localStorage.setItem('ew_padOpts', JSON.stringify(opts)); } catch (e) {}
            }

            function getPad() {
                const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
                if (padIndex != null) {
                    const p = pads[padIndex];
                    if (p && p.connected) return p;
                    padIndex = null;
                }
                for (const p of pads) {
                    if (p && p.connected && p.buttons && p.buttons.length) {
                        padIndex = p.index;
                        if (p.id !== padId) {
                            padId = p.id;
                            vendor = _detectVendor(p.id);
                            _loadBindings();
                        }
                        return p;
                    }
                }
                return null;
            }

            /* button glyphs per vendor — POSITIONAL index → what's printed on
               that physical button. Used by the HUD hints + controls editor. */
            function glyphForButton(idx) {
                const dpad = { 12: '▲', 13: '▼', 14: '◀', 15: '▶' };
                if (dpad[idx]) return { text: dpad[idx], kind: 'dpad' };
                if (idx === 10) return { text: 'L3', kind: 'stick' };
                if (idx === 11) return { text: 'R3', kind: 'stick' };
                if (idx === 16) return { text: '⌂', kind: 'sys' };
                if (vendor === 'nintendo') {
                    const m = { 0: 'B', 1: 'A', 2: 'Y', 3: 'X', 4: 'L', 5: 'R', 6: 'ZL', 7: 'ZR', 8: '−', 9: '+' };
                    return { text: m[idx] ?? ('B' + idx), kind: idx <= 3 ? 'face' : idx <= 7 ? 'shoulder' : 'sys' };
                }
                if (vendor === 'playstation') {
                    const m = { 0: '✕', 1: '○', 2: '□', 3: '△', 4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2', 8: 'SHARE', 9: 'OPT' };
                    return { text: m[idx] ?? ('B' + idx), kind: idx <= 3 ? 'face' : idx <= 7 ? 'shoulder' : 'sys' };
                }
                const m = { 0: 'A', 1: 'B', 2: 'X', 3: 'Y', 4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT', 8: 'VIEW', 9: 'MENU' };
                return { text: m[idx] ?? ('B' + idx), kind: idx <= 3 ? 'face' : idx <= 7 ? 'shoulder' : 'sys' };
            }
            function glyphForAction(actionId) {
                if (!bindings) _loadBindings();
                const idx = bindings[actionId];
                if (!Number.isInteger(idx) || idx < 0) return { text: '—', kind: 'sys' };
                return glyphForButton(idx);
            }

            function setBinding(actionId, btnIdx) {
                if (!bindings) _loadBindings();
                if (!PAD_ACTIONS.some(a => a.id === actionId)) return;
                // swap with whichever action already owns that button, so a
                // rebind can never silently leave two actions on one button
                const oldIdx = bindings[actionId];
                for (const a of PAD_ACTIONS) {
                    if (a.id !== actionId && bindings[a.id] === btnIdx) bindings[a.id] = oldIdx;
                }
                bindings[actionId] = btnIdx;
                _saveBindings();
            }
            function resetBindings() {
                bindings = _defaults();
                _saveBindings();
            }
            function beginRebind(actionId, cb) {
                if (!PAD_ACTIONS.some(a => a.id === actionId)) return;
                rebind = { id: actionId, cb: cb || null, until: performance.now() + 8000 };
                window._ewToast('PRESS A CONTROLLER BUTTON…  (ESC CANCELS)', 8000);
            }
            function cancelRebind() {
                if (!rebind) return;
                rebind = null;
                window._ewToast('REBIND CANCELLED', 900);
            }
            window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && rebind && e.isTrusted) cancelRebind(); });

            function rumble(strong, weak, ms) {
                if (!opts.vibration) return;
                const gp = getPad();
                if (!gp) return;
                try {
                    if (gp.vibrationActuator && gp.vibrationActuator.playEffect) {
                        gp.vibrationActuator.playEffect('dual-rumble', {
                            duration: ms, strongMagnitude: strong, weakMagnitude: weak
                        }).catch(() => {});
                    } else if (gp.hapticActuators && gp.hapticActuators[0] && gp.hapticActuators[0].pulse) {
                        gp.hapticActuators[0].pulse(Math.max(strong, weak), ms).catch(() => {});
                    }
                } catch (e) {}
            }

            /* radial deadzone + mild expo so fine aiming is precise */
            function _curve(v) {
                const dz = opts.deadzone;
                const a = Math.abs(v);
                if (a < dz) return 0;
                const n = (a - dz) / (1 - dz);
                return Math.sign(v) * Math.pow(n, 1.5);
            }

            function _btn(gp, idx) {
                const b = gp.buttons[idx];
                if (!b) return false;
                return b.pressed || b.value > 0.5;
            }
            function _btnVal(gp, idx) {
                const b = gp.buttons[idx];
                return b ? (b.value || (b.pressed ? 1 : 0)) : 0;
            }
            function _action(gp, actionId) { return _btn(gp, bindings[actionId]); }
            function _justPressedIdx(gp, pressed) {
                for (let i = 0; i < pressed.length; i++) {
                    if (pressed[i] && !prevPressed[i]) return i;
                }
                return -1;
            }
            function _just(pressed, actionId) {
                const idx = bindings[actionId];
                return idx >= 0 && pressed[idx] && !prevPressed[idx];
            }

            /* ── contexts ─────────────────────────────────────────────────── */
            function _pauseOpen() {
                const ov = document.getElementById('pauseOverlay');
                return !!(ov && ov.classList.contains('active'));
            }
            function _mmSettingsOpen() {
                const el = document.getElementById('mmSettingsBody');
                if (!el) return false;
                const r = el.getBoundingClientRect();
                return r.width > 0 && r.height > 0 && el.offsetParent !== null;
            }
            function _context() {
                if (rebind) return 'rebind';
                if (_pauseOpen()) return 'domnav';
                if (state.uiDialog) return 'dialog';
                if (state.titleScreenVisible) return 'title';
                if (state.phase === 'battle' && !state.winner) {
                    const hook = window._hrlgPad;
                    const wasd = typeof window._isWasdActive === 'function' && window._isWasdActive();
                    if (hook && hook.view && hook.view !== 'aim' && hook.blades > 0 && !wasd) return 'menu';
                    if (hook) return 'aim';       // aim view, WASD walk, or empty drum
                    return 'free';                 // not our turn / spectating
                }
                if (state.phase === 'editor') return 'free';
                if (_mmSettingsOpen()) return 'domnav';
                return 'domnav';                   // menus outside battle
            }

            /* ── generic DOM focus navigation (pause menu, dialogs, menus) ── */
            function _domNavRoot() {
                const pause = document.getElementById('pauseOverlay');
                if (pause && pause.classList.contains('active')) return pause;
                const dlg = document.getElementById('uiDialogOverlay');
                if (dlg && dlg.offsetParent !== null) return dlg;
                const mm = document.getElementById('mmSettingsBody');
                if (mm && mm.offsetParent !== null) return mm.closest('.mm-modal') || mm;
                return document.body;
            }
            function _domNavEls() {
                const root = _domNavRoot();
                if (!root) return [];
                const els = Array.from(root.querySelectorAll(
                    'button, select, input, [role="button"], [tabindex]:not([tabindex="-1"])'
                ));
                return els.filter(el => {
                    if (el.disabled) return false;
                    if (el.offsetParent === null) return false;
                    const r = el.getBoundingClientRect();
                    return r.width > 2 && r.height > 2;
                });
            }
            function _domNavStep(dir) {
                const els = _domNavEls();
                if (!els.length) return;
                let i = els.indexOf(document.activeElement);
                if (i < 0) i = dir > 0 ? -1 : 0;
                i = (i + dir + els.length) % els.length;
                const el = els[i];
                try { el.focus({ preventScroll: false }); } catch (e) { el.focus(); }
                if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
                if (typeof playSfx === 'function') playSfx('uiCursorMove');
            }
            function _domNavActivate() {
                const el = document.activeElement;
                if (!el || el === document.body) { _domNavStep(1); return; }
                if (typeof playSfx === 'function') playSfx('uiButtonConfirm');
                el.click();
            }
            function _domNavAdjust(dir) {
                const el = document.activeElement;
                if (el && el.tagName === 'INPUT' && el.type === 'range') {
                    const step = parseFloat(el.step) || 1;
                    el.value = String(parseFloat(el.value || '0') + dir * step);
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    return true;
                }
                if (el && el.tagName === 'SELECT') {
                    const n = el.selectedIndex + dir;
                    if (n >= 0 && n < el.options.length) {
                        el.selectedIndex = n;
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    return true;
                }
                return false;
            }

            /* ── synthetic keys: reuse ui.js WASD walking + board kb-cursor ── */
            function _sendKey(key) {
                try {
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true, cancelable: true }));
                } catch (e) {}
            }
            const DIR_KEYS = { up: 'w', down: 's', left: 'a', right: 'd' };
            function _dirFromStick(x, y) {
                if (Math.abs(x) < 0.55 && Math.abs(y) < 0.55) return null;
                return Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
            }
            /* step-repeat for cursor/walk: instant first step, then repeats */
            function _dirStep(dirName, now) {
                if (!dirName) { heldDirKey = null; return; }
                const fresh = heldDirKey !== dirName;
                if (fresh) { heldDirKey = dirName; heldDirSince = now; lastCursorStepT = 0; }
                const heldMs = now - heldDirSince;
                const interval = heldMs > 900 ? 110 : 170;
                if (!fresh && now - lastCursorStepT < interval) return;
                lastCursorStepT = now;
                _sendKey(DIR_KEYS[dirName]);
            }

            function _consumeDeferredTurnPan() {
                if (!state._deferredTurnPanUnitId) return;
                const defId = state._deferredTurnPanUnitId;
                state._deferredTurnPanUnitId = null;
                const u = state.units?.find(un => un.id === defId && !un.dead);
                if (u && typeof focusBoardCameraOnTiles === 'function') {
                    const baseZoom = (typeof getUserZoomScale === 'function') ? getUserZoomScale() : 1;
                    const zoom = (typeof isUserZoomEngaged === 'function' && isUserZoomEngaged())
                        ? baseZoom : ((typeof getDefaultZoom === 'function') ? getDefaultZoom() : 1);
                    focusBoardCameraOnTiles([{ x: u.x, y: u.y }], {
                        zoom, holdMs: 99999, persist: true, transitionMs: 500
                    });
                }
            }

            function _updateZoomChip(newZoom) {
                const btn = document.getElementById('zoomToggleBtn');
                if (btn && typeof getUserZoomLabel === 'function') {
                    btn.textContent = getUserZoomLabel();
                    btn.classList.toggle('active', typeof isUserZoomEngaged === 'function' ? isUserZoomEngaged() : newZoom > 1.05);
                }
            }

            /* ── camera: right stick orbit, triggers zoom, in-battle only ── */
            function _cameraFrame(gp, dt, ctx) {
                if (typeof camera === 'undefined' || !camera) return;
                if (state.phase !== 'battle' && state.phase !== 'editor') return;
                if (state.cameraDisabled) return;

                const rx = _curve((opts.invertX ? -1 : 1) * (gp.axes[2] ?? 0));
                const ry = _curve((opts.invertY ? -1 : 1) * (gp.axes[3] ?? 0));
                const orbiting = (rx !== 0 || ry !== 0);
                if (orbiting) {
                    if (!stickPanning) {
                        stickPanning = true;
                        state._userPanning = true;
                        camera._stop();
                    }
                    const yaw = (state.dioramaYawDeg ?? camera.yaw ?? 0) + rx * 170 * opts.sensitivity * dt;
                    const tilt = Math.max(0, Math.min(135,
                        (state.dioramaTiltDeg ?? camera.tilt ?? 50) + ry * 100 * opts.sensitivity * dt));
                    camera.snap({ _force: true, tilt: Math.round(tilt * 10) / 10, yaw: Math.round(yaw * 10) / 10 });
                } else if (stickPanning) {
                    stickPanning = false;
                    state._userPanning = false;
                    _consumeDeferredTurnPan();
                }

                // analog zoom on the triggers (mirrors the wheel-zoom contract:
                // engage state.userZoomScale so auto-framing respects it)
                const zi = _btnVal(gp, bindings.zoomIn);
                const zo = _btnVal(gp, bindings.zoomOut);
                if (zi > 0.05 || zo > 0.05) {
                    const cur = (typeof isUserZoomEngaged === 'function' && isUserZoomEngaged() && state.userZoomScale)
                        ? state.userZoomScale : (camera.zoom || 1);
                    const factor = 1 + (zi - zo) * 1.6 * dt;
                    const newZoom = Math.round(Math.max(0.25, Math.min(10.0, cur * factor)) * 1000) / 1000;
                    if (Math.abs(newZoom - cur) > 0.0005) {
                        state.userZoomScale = newZoom;
                        _updateZoomChip(newZoom);
                        camera.snap({ _force: true, zoom: newZoom });
                    }
                }

                // left stick pans the free camera OUTSIDE menus/aiming.
                // In follow mode a free pan makes no sense — detach to tactical
                // (same rule as a mouse right-drag pan).
                if (ctx === 'free') {
                    const lx = _curve(gp.axes[0] ?? 0);
                    const ly = _curve(gp.axes[1] ?? 0);
                    if (lx !== 0 || ly !== 0) {
                        if (typeof isFollowCamMode === 'function' && isFollowCamMode()
                            && typeof setCameraMode === 'function') {
                            setCameraMode('tactical', { silent: true });
                            window._ewToast('🗺 TACTICAL CAMERA', 1100);
                        }
                        const yawRad = -((state.dioramaYawDeg ?? 0) * Math.PI / 180);
                        const cosY = Math.cos(yawRad), sinY = Math.sin(yawRad);
                        const bdx = lx * cosY + ly * sinY;
                        const bdy = -lx * sinY + ly * cosY;
                        const speed = 9 / Math.max(0.35, camera.zoom || 1);   // tiles/sec
                        camera.snap({
                            _force: true,
                            x: camera.x + bdx * speed * dt,
                            y: camera.y + bdy * speed * dt
                        });
                    }
                }
            }

            /* ── per-frame router ─────────────────────────────────────────── */
            function _frame(gp, dt, now) {
                const pressed = [];
                let anyPressed = false;
                for (let i = 0; i < gp.buttons.length; i++) {
                    pressed[i] = _btn(gp, i);
                    if (pressed[i]) anyPressed = true;
                }
                let anyAxis = false;
                for (let i = 0; i < Math.min(gp.axes.length, 4); i++) {
                    if (Math.abs(gp.axes[i]) > opts.deadzone) { anyAxis = true; break; }
                }
                if (anyPressed || anyAxis) EWInput.setDevice('pad');

                // rebind capture swallows EVERYTHING until a button lands
                if (rebind) {
                    if (now > rebind.until) { rebind = null; window._ewToast('REBIND TIMED OUT', 900); }
                    else {
                        const idx = _justPressedIdx(gp, pressed);
                        if (idx >= 0) {
                            const r = rebind; rebind = null;
                            setBinding(r.id, idx);
                            if (typeof playSfx === 'function') playSfx('uiConfirm');
                            window._ewToast('BOUND: ' + glyphForButton(idx).text, 1100);
                            rumble(0.4, 0.4, 90);
                            if (r.cb) try { r.cb(idx); } catch (e) {}
                            if (typeof window._ewControlsRerender === 'function') window._ewControlsRerender();
                        }
                    }
                    prevPressed = pressed;
                    return;
                }

                const ctx = _context();

                /* camera first — the sticks stay live in every battle context
                   except while the drum owns the left stick (menu nav). */
                if (ctx === 'menu' || ctx === 'aim' || ctx === 'free') _cameraFrame(gp, dt, ctx);

                const hook = window._hrlgPad;

                /* ── global battle buttons ── */
                if (ctx === 'menu' || ctx === 'aim' || ctx === 'free') {
                    if (_just(pressed, 'pause') && typeof togglePauseMenu === 'function') togglePauseMenu();
                    if (_just(pressed, 'cameraMode') && typeof cycleCameraMode === 'function') cycleCameraMode();
                    if (_just(pressed, 'overview') && typeof showFullMapOverview === 'function') showFullMapOverview();
                    if (_just(pressed, 'recenter') && typeof setCameraMode === 'function'
                        && typeof getCameraMode === 'function') setCameraMode(getCameraMode());
                    if (_just(pressed, 'endTurn')) window._ewRequestEndTurn();
                    // L/R cycle spell targets whenever the engine has a cycle list
                    if (state.actionMode === 'spell' && state._spellCycleTargets?.length > 1
                        && typeof cycleSpellTarget === 'function') {
                        if (_just(pressed, 'targetPrev')) cycleSpellTarget(-1);
                        if (_just(pressed, 'targetNext')) cycleSpellTarget(1);
                    } else if (hook && hook.blades > 0) {
                        if (_just(pressed, 'targetPrev')) hook.cycle(-1);
                        if (_just(pressed, 'targetNext')) hook.cycle(1);
                    }
                }

                if (ctx === 'menu') {
                    // drum navigation: D-pad or left stick, A fires, B backs out
                    const lx = _curve(gp.axes[0] ?? 0);
                    const ly = _curve(gp.axes[1] ?? 0);
                    let nav = 0;
                    if (_action(gp, 'menuUp') || ly < -0.55) nav = -1;
                    else if (_action(gp, 'menuDown') || ly > 0.55) nav = 1;
                    if (nav !== 0) {
                        if (now - menuRepeatT > 170) { menuRepeatT = now; hook.cycle(nav); }
                    } else menuRepeatT = 0;
                    if (_just(pressed, 'confirm')) { hook.fire(); rumble(0.25, 0.35, 60); }
                    if (_just(pressed, 'cancel')) hook.crown();
                } else if (ctx === 'aim') {
                    // board aiming: left stick / D-pad drive the SAME WASD +
                    // kb-cursor pipeline the keyboard uses; A = ENTER, B = back
                    const lx = _curve(gp.axes[0] ?? 0);
                    const ly = _curve(gp.axes[1] ?? 0);
                    let dirName = _dirFromStick(lx, ly);
                    if (!dirName) {
                        if (_action(gp, 'menuUp')) dirName = 'up';
                        else if (_action(gp, 'menuDown')) dirName = 'down';
                        else if (_action(gp, 'menuLeft')) dirName = 'left';
                        else if (_action(gp, 'menuRight')) dirName = 'right';
                    }
                    _dirStep(dirName, now);
                    if (_just(pressed, 'confirm')) {
                        // With a target already picked (L/R cycling arms
                        // state.pendingTarget) and no live board cursor,
                        // A confirms it directly — the two-click contract.
                        const pt = state.pendingTarget;
                        const wasdLive = typeof window._isWasdActive === 'function' && window._isWasdActive();
                        if (!wasdLive && typeof state._kbCursorX !== 'number'
                            && pt && typeof clickTile === 'function') {
                            state._clickedUnitId = null;
                            clickTile(pt.x, pt.y, pt.z);
                        } else {
                            _sendKey('Enter');
                        }
                        rumble(0.25, 0.35, 60);
                    }
                    if (_just(pressed, 'cancel') && typeof handleBackAction === 'function') handleBackAction();
                } else if (ctx === 'free') {
                    if (_just(pressed, 'cancel') && typeof handleBackAction === 'function') handleBackAction();
                    if (_just(pressed, 'confirm')) {
                        // reselect / recentre on the acting unit when idle
                        const u = typeof getSelectedUnit === 'function' && getSelectedUnit();
                        if (u && typeof focusBoardCameraOnTiles === 'function') {
                            focusBoardCameraOnTiles([{ x: u.x, y: u.y }], { holdMs: 99999, persist: true, transitionMs: 300 });
                        }
                    }
                } else if (ctx === 'dialog') {
                    if (_just(pressed, 'confirm') && typeof handleUiDialogPrimary === 'function') handleUiDialogPrimary();
                    if (_just(pressed, 'cancel') && typeof handleUiDialogSecondary === 'function') handleUiDialogSecondary();
                } else if (ctx === 'title') {
                    if ((_just(pressed, 'confirm') || _just(pressed, 'pause'))
                        && typeof enterGameFromTitle === 'function') enterGameFromTitle();
                } else if (ctx === 'domnav') {
                    // pause menu / dialogs / front-end menus: focus-order nav
                    const ly = _curve(gp.axes[1] ?? 0);
                    const lx = _curve(gp.axes[0] ?? 0);
                    let nav = 0;
                    if (_action(gp, 'menuUp') || ly < -0.55) nav = -1;
                    else if (_action(gp, 'menuDown') || ly > 0.55) nav = 1;
                    if (nav !== 0) {
                        if (now - menuRepeatT > 180) { menuRepeatT = now; _domNavStep(nav); }
                    } else menuRepeatT = 0;
                    let adj = 0;
                    if (_action(gp, 'menuLeft') || lx < -0.55) adj = -1;
                    else if (_action(gp, 'menuRight') || lx > 0.55) adj = 1;
                    if (adj !== 0) {
                        if (now - lastCursorStepT > 160) { lastCursorStepT = now; if (!_domNavAdjust(adj)) _domNavStep(adj); }
                    }
                    if (_just(pressed, 'confirm')) _domNavActivate();
                    if (_just(pressed, 'cancel') || _just(pressed, 'pause')) {
                        if (_pauseOpen() && typeof closePauseMenu === 'function') closePauseMenu();
                        else if (state.uiDialog && typeof handleUiDialogSecondary === 'function') handleUiDialogSecondary();
                        else _sendKey('Escape');
                    }
                }

                prevPressed = pressed;
            }

            function _loop(t) {
                requestAnimationFrame(_loop);
                const now = performance.now();
                // no pad yet → cheap re-check a couple times a second
                if (padIndex == null && !everConnected && now - idleCheckT < 500) return;
                idleCheckT = now;
                const gp = getPad();
                if (!gp) { prevPressed = []; if (stickPanning) { stickPanning = false; state._userPanning = false; } return; }
                everConnected = true;
                const dt = lastLoopT ? Math.min((now - lastLoopT) / 1000, 0.05) : 0.016;
                lastLoopT = now;
                try { _frame(gp, dt, now); } catch (e) { /* never wedge input on a UI error */ }
            }

            window.addEventListener('gamepadconnected', (e) => {
                const gp = e.gamepad;
                padIndex = gp.index;
                padId = gp.id;
                vendor = _detectVendor(gp.id);
                _loadBindings();
                everConnected = true;
                EWInput.setDevice('pad');
                const shortId = String(gp.id).replace(/\s*\(.*$/, '').slice(0, 40);
                window._ewToast('🎮 ' + (shortId || 'CONTROLLER') + ' CONNECTED', 2200);
                if (gp.mapping !== 'standard') {
                    setTimeout(() => window._ewToast('NON-STANDARD PAD MAPPING — REBIND IN CONTROLS IF BUTTONS FEEL WRONG', 3200), 2400);
                }
                if (typeof window._ewControlsRerender === 'function') window._ewControlsRerender();
            });
            window.addEventListener('gamepaddisconnected', (e) => {
                if (padIndex === e.gamepad.index) padIndex = null;
                window._ewToast('🎮 CONTROLLER DISCONNECTED', 1800);
                EWInput.setDevice('kbm');
                if (typeof window._ewControlsRerender === 'function') window._ewControlsRerender();
            });

            _loadBindings();
            requestAnimationFrame(_loop);

            return {
                ACTIONS: PAD_ACTIONS,
                isConnected() { return !!getPad(); },
                getPadId() { getPad(); return padId; },
                getVendor() { getPad(); return vendor; },
                getMapping() { const p = getPad(); return p ? p.mapping : ''; },
                getBinding(id) { if (!bindings) _loadBindings(); return bindings[id]; },
                debugContext() { return _context(); },
                setBinding, resetBindings, beginRebind, cancelRebind,
                isRebinding() { return !!rebind; },
                glyphForAction, glyphForButton,
                getOpts() { return { ...opts }; },
                setOpt(k, v) {
                    if (!(k in opts)) return;
                    opts[k] = v;
                    _saveOpts();
                },
                rumble,
            };
        })();
        window.EWPad = EWPad;
