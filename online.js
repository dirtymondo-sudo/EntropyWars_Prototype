        function applyOnlineRules() {
            const myP = window._NET ? window._NET.myPlayer : 1;
            const otherP = myP === 1 ? 2 : 1;

            state.controllers[myP] = CTRL.LOCAL;
            state.controllers[otherP] = CTRL.REMOTE;

            transitionTo(GS.PARTY_BUILDER);
            state.audioUnlocked = true;

            state.fogOfWar = true;

            state.devAutoSim = false;
            if (state.devSimTimer) {
                clearTimeout(state.devSimTimer);
                state.devSimTimer = null;
            }

            state.showPlayer2Builder = true;
        }

        function _isOnline() {
            return isOnlineMatch();
        }

        function _myPlayer() {
            return getLocalPlayer();
        }

        function _isHost() {
            return window._NET && window._NET.role === 'host';
        }

        function _isGuest() {
            return window._NET && window._NET.role === 'guest';
        }

        function _emit(evt, data) {
            /* REPLAY TAP: while a local/host match is being recorded, every
               relay-channel event (banners, cameras, walk anims, VFX, SFX —
               the whole guest presentation stream) is also written to the
               match recorder. Offline there is no socket, so this tap is the
               only consumer; online host it records AND emits. */
            if (evt === 'relay' && typeof window._ewRecRelay === 'function') {
                try { window._ewRecRelay(data); } catch (e) {}
            }
            if (window._NET && window._NET.socket) window._NET.socket.emit(evt, data);
        }

        /* True while the match recorder is capturing (see the MATCH REPLAY
           section at the bottom of this file). Referenced by every host-emit
           guard so the presentation stream is generated even offline. */
        function _ewRecOn() {
            var R = window._EW_REC;
            return !!(R && R.active);
        }

        /* Opening-cinematic skip vote (battle.js playOpeningCinematic): each
           player's click sends one of these; the intro only skips when EVERY
           player has voted. */
        window._ewSendIntroSkip = function () {
            _emit('relay', { type: 'intro-skip', from: (window._NET && window._NET.myPlayer) || 0 });
        };

        function showVsSplash(callback) {
            if (!ONLINE_RULES.active) {
                if (callback) callback();
                return;
            }
            const overlay = document.getElementById('vsSplashOverlay');
            if (!overlay) {
                if (callback) callback();
                return;
            }

            function teamSprites(player) {
                const units = state.units.filter(u => u.player === player);
                return units.map(u => {
                    const src = (typeof compositeSprite === 'function') ? compositeSprite(u.race, u.equipment) : null;
                    if (!src) {
                        const raceSrc = (typeof RACE_SPRITES !== 'undefined') ? RACE_SPRITES[u.race] : null;
                        return raceSrc ? `<div style="width:40px;height:40px;background-image:url('${raceSrc}');background-size:contain;background-position:center;background-repeat:no-repeat;image-rendering:pixelated"></div>` : `<div style="width:40px;height:40px;background:var(--surface);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:18px">⚔</div>`;
                    }
                    return `<div style="width:40px;height:40px;background-image:url('${src}');background-size:contain;background-position:center;background-repeat:no-repeat;image-rendering:pixelated"></div>`;
                }).join('');
            }

            const viewer = getViewerPlayer();
            const myLabel = viewer === 1 ? 'Player 1' : 'Player 2';
            const oppLabel = viewer === 1 ? 'Player 2' : 'Player 1';
            const myP = viewer;
            const oppP = viewer === 1 ? 2 : 1;

            overlay.innerHTML = `<div class="vs-splash-card">
        <div class="vs-team">
          <div class="vs-team-label p${myP}">${myLabel} (You)</div>
          <div class="vs-team-sprites">${teamSprites(myP)}</div>
        </div>
        <div class="vs-text">VS</div>
        <div class="vs-team">
          <div class="vs-team-label p${oppP}">${oppLabel}</div>
          <div class="vs-team-sprites">${teamSprites(oppP)}</div>
        </div>
      </div>`;

            overlay.classList.add('visible');
            playSfx('uiButtonConfirm');

            setTimeout(() => {
                overlay.classList.remove('visible');
                setTimeout(() => {
                    overlay.innerHTML = '';
                    if (callback) callback();
                }, 500);
            }, 2800);
        }

        const _origMaybeTriggerComputerTurn = maybeTriggerComputerTurn;
        maybeTriggerComputerTurn = function() {
            if (_isOnline() && _isGuest()) return;
            /* REPLAY: playback applies recorded snapshots that look like a live
               battle — the engine must stay dormant or the AI would start
               playing on top of the recording. */
            if (window._EW_REPLAY && window._EW_REPLAY.playing) return;
            return _origMaybeTriggerComputerTurn();
        };

        const _origPrepareBattle = prepareBattleStateFromCurrentBuilds;
        prepareBattleStateFromCurrentBuilds = function() {
            _origPrepareBattle();
            /* fresh match ⇒ stale intro-skip / ready / intro-done votes from
               the last one are void */
            window._ewIntroRemoteSkip = false;
            window._ewRemoteMatchReady = false;
            window._ewRemoteIntroDone = false;
            if (_isOnline()) {

                state.aiPlayer = -1;
            }
        };

        function _fixPerspectiveLabels() {
            if (!_isOnline()) return;
            const me = _myPlayer();

            const sideHead = document.querySelector('#sidebarPanel .compact-head h2');
            if (sideHead) sideHead.textContent = me === 1 ? 'Your Party' : 'Your Party';

            const ctrlHead = document.querySelector('#controlPanel .compact-head h2');
            if (ctrlHead) ctrlHead.textContent = me === 1 ? 'Opponent' : 'Opponent';

            if (me === 2) {
                const sideHg = document.querySelector('#sidebarPanel .small-team-score');
                const ctrlHg = document.querySelector('#controlPanel .small-team-score');
                if (sideHg) {
                    const countEl = sideHg.querySelector('.team-count');
                    if (countEl) countEl.textContent = document.getElementById('sideP2Held')?.textContent || '0';
                }
                if (ctrlHg) {
                    const countEl = ctrlHg.querySelector('.team-count');
                    if (countEl) countEl.textContent = document.getElementById('sideP1Held')?.textContent || '0';
                }
            }
        }

        const _onlineOrigClickTile = clickTile;
        clickTile = function(x, y, z) {
            if (!_isOnline() || state._remoteAction) return _onlineOrigClickTile(x, y, z);
            if (state.phase === 'battle' && !state.winner) {

                if (state.activePlayer !== _myPlayer()) {
                    const u = unitAt(x, y);
                    if (u) focusUnitPanel(u.id);
                    return;
                }
                if (_isGuest()) {

                    const clickedUnit = unitAt(x, y);
                    const actingUnit = getSelectedUnit();

                    /* ── Guest quick menus (stage 3 of the TargetQuery
                       refactor, 2026-07-29) ─────────────────────────────────
                       Menu-BROWSING clicks (no armed action mode) run the REAL
                       engine clickTile locally instead of the hand-copied
                       mirror of its root branch that used to live here (the
                       fork that drifted and caused the 2026-07-28 PvP bug).
                       Everything on the engine's root branch is either
                       per-viewer UI — the quick-menu anchors
                       _enemyActionTargetId / _tileActionTarget are on the
                       state-sync skip list (_guestUIKeys), plus focus, cursor
                       SFX, camera shots — or an engine mutator the wrappers
                       below already relay to the host (selectUnit; doAttack
                       via the in-reach enemy-deployable shortcut). The engine
                       applies its own input freezes (_actionExecuting →
                       _netGuestViewer bail, cinematics, fog computed with
                       state.activePlayer = this guest), so the gates can never
                       drift apart again: one implementation, host and guest.
                       Armed-action clicks below still RELAY — they mutate
                       authoritative match state and must execute on the
                       host. */
                    if (!state.actionMode) {
                        return _onlineOrigClickTile(x, y, z);
                    }

                    /* the exact sprite the renderer resolved wins over the
                       ground unit (stacked columns) — same rule as the engine */
                    let _qmUnit = null;
                    if (state._clickedUnitId != null) {
                        const _qmDirect = state.units.find(function(u) { return u.id === state._clickedUnitId && !u.dead && !u._dying; });
                        if (_qmDirect && _qmDirect.x === x && _qmDirect.y === y) _qmUnit = _qmDirect;
                    }
                    if (!_qmUnit) _qmUnit = clickedUnit;

                    /* fog: an armed click into the murk still relays below and
                       re-runs the engine's own gate host-side with this
                       player's fog — but never open a unit menu here for a
                       sprite the guest cannot actually see */
                    let _qmVisible = true;
                    if (state.fogOfWar && typeof computeVisibleTiles === 'function' && typeof posKey === 'function') {
                        try { _qmVisible = computeVisibleTiles(state.activePlayer).has(posKey(x, y)); } catch (e) {}
                    }

                    if (state.actionMode === 'move' && _qmVisible && actingUnit
                        && _qmUnit && !_qmUnit.dead && _qmUnit.id !== actingUnit.id
                        && state._clickedUnitId === _qmUnit.id) {
                        /* move mode, clicked a unit SPRITE → engine parity:
                           drop the mode and open that unit's quick menu (the
                           engine's own helper — pure viewer-local UI) */
                        if (typeof _exitModeAndShowUnitMenu === 'function') {
                            _exitModeAndShowUnitMenu(actingUnit, _qmUnit);
                            return;
                        }
                        focusUnitPanel(_qmUnit.id);
                    } else if (clickedUnit) {
                        focusUnitPanel(clickedUnit.id);
                    }

                    const sentActionMode = state.actionMode;
                    const sentPendingTarget = state.pendingTarget;
                    _emit('game-action', {
                        type: 'clickTile',
                        x,
                        y,
                        _ctx: {
                            selectedUnitId: state.selectedUnitId,
                            actionMode: state.actionMode,
                            selectedTool: state.selectedTool,
                            pendingTarget: state.pendingTarget,
                            comboPartner: state.comboPartner ? state.comboPartner.id : null,
                            buildTool: state._buildTool || null
                        }
                    });

                    if (sentActionMode === 'build') {

                        /* Build is single-click (no confirm step) and the mode
                           STAYS armed for the next block — mirror that locally:
                           instant work-swing feedback, no pendingTarget, keep
                           Build mode so the guest can keep clicking. The
                           authoritative terrain edit arrives with the sync. */
                        if (actingUnit) _guestActionFeedback('attack', actingUnit, x, y);
                        state.pendingTarget = null;
                        renderBattleSelectionUI({
                            includeBoard: false
                        });
                        scheduleBoardRender();
                    } else if (sentActionMode && sentActionMode !== 'move') {

                        if (sentPendingTarget && sentPendingTarget.x === x && sentPendingTarget.y === y) {

                            /* Confirming click — the host will execute this
                               action. Fire the local cosmetics now so the
                               confirm doesn't feel like a dead click. */
                            if (actingUnit) {
                                var _fbKind = sentActionMode === 'attack' ? 'attack'
                                    : sentActionMode === 'spell' ? 'spell'
                                    : sentActionMode === 'item' ? 'item'
                                    : sentActionMode === 'jump' ? 'jump'
                                    : null;
                                if (_fbKind) _guestActionFeedback(_fbKind, actingUnit, x, y);
                            }

                            state.actionMode = null;
                            state.actionMenuView = 'root';
                            state.selectedTool = null;
                            state.pendingTarget = null;
                            state.comboPartner = null;
                            renderBattleSelectionUI({
                                includeBoard: false
                            });
                            scheduleBoardRender();
                        } else {

                            state.pendingTarget = {
                                x,
                                y,
                                mode: sentActionMode,
                                tool: state.selectedTool,
                                viaHover: false
                            };
                            renderBattleSelectionUI({
                                includeBoard: false
                            });
                            scheduleBoardRender();
                        }
                    } else if (sentActionMode === 'move') {

                        /* Instant move feedback — footstep + a destination
                           hologram — but only for a tile the engine will
                           actually accept, so the ghost never lies. Legal
                           tiles come from the ONE validity oracle
                           (GAME.TargetQuery), not a local re-derivation. */
                        var _tqMove = window.GAME && window.GAME.TargetQuery;
                        if (actingUnit && _tqMove) {
                            try {
                                var _mvTiles = _tqMove.moveTiles(actingUnit);
                                if (_mvTiles && _mvTiles.some(function(t) { return t.x === x && t.y === y; })) {
                                    _guestActionFeedback('move', actingUnit, x, y);
                                }
                            } catch (e) {}
                        }

                        state.actionMode = null;
                        state.actionMenuView = 'root';
                        state.selectedTool = null;
                        state.pendingTarget = null;
                        renderBattleSelectionUI({
                            includeBoard: false
                        });
                        scheduleBoardRender();
                    }
                    return;
                }
            }
            _onlineOrigClickTile(x, y, z);
            if (state.phase === 'battle' && window._broadcastState) window._broadcastState();
        };

        const _onlineOrigSelectUnit = selectUnit;
        selectUnit = function(unitId, opts) {
            if (!_isOnline() || state._remoteAction) return _onlineOrigSelectUnit(unitId, opts);
            const u = state.units.find(function(u) {
                return u.id === unitId;
            });
            if (!u || u.dead) return;

            if (u.player !== _myPlayer()) {
                focusUnitPanel(unitId);
                return;
            }

            if (state.phase === 'battle' && state.activePlayer !== _myPlayer()) {
                focusUnitPanel(unitId);
                return;
            }

            state._remoteAction = true;
            _onlineOrigSelectUnit(unitId, opts);
            state._remoteAction = false;

            if (_isGuest()) {
                _emit('game-action', {
                    type: 'selectUnit',
                    id: unitId
                });
            } else {
                if (window._broadcastState) window._broadcastState();
            }
        };

        const _origSetTool = setTool;
        setTool = function(mode, toolName) {
            if (!_isOnline() || state._remoteAction) return _origSetTool(mode, toolName);
            if (state.activePlayer !== _myPlayer()) return;

            _origSetTool(mode, toolName);
            if (_isGuest()) {
                _emit('game-action', {
                    type: 'setTool',
                    mode,
                    toolName
                });
            } else {
                if (window._broadcastState) window._broadcastState();
            }
        };

        const _onlineOrigSetActionMode = setActionMode;
        setActionMode = function(mode) {
            if (!_isOnline() || state._remoteAction) return _onlineOrigSetActionMode(mode);
            if (state.activePlayer !== _myPlayer()) return;

            _onlineOrigSetActionMode(mode);
            if (_isGuest()) {
                _emit('game-action', {
                    type: 'setActionMode',
                    mode
                });
            } else {
                if (window._broadcastState) window._broadcastState();
            }
        };

        const _origTriggerEndTurn = triggerEndTurn;
        triggerEndTurn = function() {
            if (!_isOnline() || state._remoteAction) return _origTriggerEndTurn();
            if (state.activePlayer !== _myPlayer()) return;
            if (_isGuest()) {
                _emit('game-action', {
                    type: 'triggerEndTurn',
                    _selectedUnitId: state.selectedUnitId
                });
                return;
            }
            _origTriggerEndTurn();
            if (window._broadcastState) window._broadcastState();
        };

        const _origUseRosterItem = useRosterItemButton;
        useRosterItemButton = function(unitId, itemKey) {
            if (!_isOnline() || state._remoteAction) return _origUseRosterItem(unitId, itemKey);
            if (state.activePlayer !== _myPlayer()) return;
            if (_isGuest()) {
                _emit('game-action', {
                    type: 'useRosterItem',
                    unitId,
                    itemKey
                });
                return;
            }
            _origUseRosterItem(unitId, itemKey);
            if (window._broadcastState) window._broadcastState();
        };

        /* ── Engine-mutator relay (the "guest actions do nothing" fix) ──────
           The HUD quick-action menu, the attack/spell target submenu, tile
           actions (Chop Tree / Smash Terrain), the More menu (Channel, Enter
           Building) and drag-moves call the engine mutators (doAttack /
           doSpell / doMove / …) DIRECTLY instead of going through clickTile.
           Offline that's fine; online the GUEST was running them on its own
           NON-authoritative copy of the match — the attack played out locally
           (complete with Press-Turn "+1 AP" popups) while the HOST never saw
           it, and the next state sync rolled everything back. Net effect the
           user sees: seemingly unlimited actions and enemy HP that never
           drops. Route them exactly like clickTile: the guest emits a
           semantic game-action, the host replays it authoritatively, state
           syncs back. Host-side direct calls stay local + broadcast.
           NOTE: these reassign the top-level function bindings, so engine-
           INTERNAL calls also resolve to the wrappers — the state._remoteAction
           pass-through keeps host replays running the originals. */
        function _guestOwnsAction(unit) {
            return state.phase === 'battle' && !state.winner
                && unit && !unit.dead && unit.player === _myPlayer()
                && state.activePlayer === _myPlayer();
        }

        /* ── Latency-hiding cosmetic feedback (guest) ───────────────────────
           A guest action is only a network emit — the authoritative result
           plays back 0.5–2s later when the host replays it and syncs. That
           gap reads as "my click did nothing". Fire the cheap local
           cosmetics IMMEDIATELY on the emit: attack lunge + swoosh, cast
           pose + cast sound, footstep + a destination hologram for moves.
           Purely visual — no state mutation, damage numbers still arrive
           only with the authoritative result, and the move ghost is cleared
           by the next state-sync. */
        function _guestActionFeedback(kind, unit, x, y) {
            try {
                if (!unit || unit.dead) return;
                if (kind === 'attack') {
                    if (typeof triggerAttackAnim === 'function') triggerAttackAnim(unit, x, y);
                    playSfx('basicAttack');
                } else if (kind === 'spell') {
                    var sp = null;
                    if (state.selectedTool && unit.spells) {
                        sp = unit.spells.find(function(s) { return s && s.name === state.selectedTool; }) || null;
                    }
                    if (typeof triggerCastAnim === 'function') triggerCastAnim(unit, sp);
                    var _support = sp && /heal|buff|cleanse|shield|protect/i.test(String(sp.kind || sp.type || ''));
                    playSfx(_support ? 'buff' : 'spellDamage');
                } else if (kind === 'move' || kind === 'jump') {
                    playSfx('moveStep');
                    if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.showGhostUnit) {
                        var tint = unit.player === 1 ? 0x4da3ff : 0xff5a5a;
                        ThreeRenderer.showGhostUnit(unit, x, y, undefined, { tag: 'netPending', color: tint, opacity: 0.75 });
                    }
                } else if (kind === 'item') {
                    playSfx('itemThrow');
                }
            } catch (e) { /* cosmetics must never break the emit */ }
        }

        function _hostRunAndSync(orig, args) {
            const r = orig.apply(null, args);
            if (window._broadcastState) window._broadcastState();
            return r;
        }

        const _origDoAttack = doAttack;
        doAttack = function(unit, x, y, z) {
            if (!_isOnline() || state._remoteAction) return _origDoAttack(unit, x, y, z);
            if (_isHost()) return _hostRunAndSync(_origDoAttack, [unit, x, y, z]);
            if (!_guestOwnsAction(unit)) return 0;
            _guestActionFeedback('attack', unit, x, y);
            _emit('game-action', { type: 'engine', fn: 'doAttack', unitId: unit.id, x: x, y: y, z: z });
            return 1200; /* nominal delay — the real visuals arrive via host relays */
        };

        const _origDoSpell = doSpell;
        doSpell = function(unit, x, y, z) {
            if (!_isOnline() || state._remoteAction) return _origDoSpell(unit, x, y, z);
            if (_isHost()) return _hostRunAndSync(_origDoSpell, [unit, x, y, z]);
            if (!_guestOwnsAction(unit)) return 0;
            _guestActionFeedback('spell', unit, x, y);
            _emit('game-action', { type: 'engine', fn: 'doSpell', unitId: unit.id, x: x, y: y, z: z, tool: state.selectedTool });
            return 1200;
        };

        const _origDoMove = doMove;
        doMove = function(unit, x, y, z) {
            if (!_isOnline() || state._remoteAction) return _origDoMove(unit, x, y, z);
            if (_isHost()) return _hostRunAndSync(_origDoMove, [unit, x, y, z]);
            if (!_guestOwnsAction(unit)) return false;
            _guestActionFeedback('move', unit, x, y);
            _emit('game-action', { type: 'engine', fn: 'doMove', unitId: unit.id, x: x, y: y, z: z });
            return true;
        };

        const _origDoJump = doJump;
        doJump = function(unit, x, y, z) {
            if (!_isOnline() || state._remoteAction) return _origDoJump(unit, x, y, z);
            if (_isHost()) return _hostRunAndSync(_origDoJump, [unit, x, y, z]);
            if (!_guestOwnsAction(unit)) return false;
            _guestActionFeedback('jump', unit, x, y);
            _emit('game-action', { type: 'engine', fn: 'doJump', unitId: unit.id, x: x, y: y, z: z });
            return true;
        };

        /* Take Off / Land (More menu + Move-Towards unblock). Never relayed
           before: a guest's takeoff ran on its own non-authoritative copy,
           the host never saw it, and the next state-sync slammed the flyer
           back to the ground (with the AP gone client-side until the sync).
           doMove's internal takeoff path is covered by the doMove relay; this
           covers the standalone altitude verbs. */
        const _origDoAltitudeChange = (typeof doAltitudeChange === 'function') ? doAltitudeChange : null;
        if (_origDoAltitudeChange) {
            doAltitudeChange = function(unit, mode) {
                if (!_isOnline() || state._remoteAction) return _origDoAltitudeChange(unit, mode);
                if (_isHost()) return _hostRunAndSync(_origDoAltitudeChange, [unit, mode]);
                if (!_guestOwnsAction(unit)) return 0;
                playSfx(mode === 'ascend' ? 'buff' : 'moveStep');
                _emit('game-action', { type: 'engine', fn: 'doAltitudeChange', unitId: unit.id, mode: mode });
                return 500; /* nominal delay — the authoritative result arrives via state-sync */
            };
        }

        /* Raise/Lower the ground underfoot (quick-menu height-approach rows +
           the build kit). Same hole as the altitude verbs: un-relayed, a
           guest's reshape edited only its local terrain copy and the next
           state-sync erased it. */
        const _origDoReshape = (typeof doReshape === 'function') ? doReshape : null;
        if (_origDoReshape) {
            doReshape = function(unit, mode) {
                if (!_isOnline() || state._remoteAction) return _origDoReshape(unit, mode);
                if (_isHost()) return _hostRunAndSync(_origDoReshape, [unit, mode]);
                if (!_guestOwnsAction(unit)) return 0;
                playSfx('physicalAbility');
                _emit('game-action', { type: 'engine', fn: 'doReshape', unitId: unit.id, mode: mode });
                return 500; /* nominal delay — the authoritative result arrives via state-sync */
            };
        }

        const _origDoItem = doItem;
        doItem = function(unit, x, y, z) {
            if (!_isOnline() || state._remoteAction) return _origDoItem(unit, x, y, z);
            if (_isHost()) return _hostRunAndSync(_origDoItem, [unit, x, y, z]);
            if (!_guestOwnsAction(unit)) return;
            _guestActionFeedback('item', unit, x, y);
            _emit('game-action', { type: 'engine', fn: 'doItem', unitId: unit.id, x: x, y: y, z: z, tool: state.selectedTool });
        };

        const _origDoComboAttack = doComboAttack;
        doComboAttack = function(initiator, partner, targetX, targetY, targetZ) {
            if (!_isOnline() || state._remoteAction) return _origDoComboAttack(initiator, partner, targetX, targetY, targetZ);
            if (_isHost()) return _hostRunAndSync(_origDoComboAttack, [initiator, partner, targetX, targetY, targetZ]);
            if (!_guestOwnsAction(initiator)) return;
            _guestActionFeedback('attack', initiator, targetX, targetY);
            _emit('game-action', { type: 'engine', fn: 'doComboAttack', unitId: initiator.id, partnerId: partner ? partner.id : null, x: targetX, y: targetY, z: targetZ });
        };

        const _origDoBuildAction = (typeof doBuildAction === 'function') ? doBuildAction : null;
        if (_origDoBuildAction) {
            doBuildAction = function(unit, x, y, tool) {
                if (!_isOnline() || state._remoteAction) return _origDoBuildAction(unit, x, y, tool);
                if (_isHost()) return _hostRunAndSync(_origDoBuildAction, [unit, x, y, tool]);
                if (!_guestOwnsAction(unit)) return 0;
                _guestActionFeedback('attack', unit, x, y);   // work swing + thunk
                _emit('game-action', { type: 'engine', fn: 'doBuildAction', unitId: unit.id, x: x, y: y, tool: tool || state._buildTool || 'dig' });
                return 600;
            };
        }

        const _origDoEnterBuilding = (typeof doEnterBuilding === 'function') ? doEnterBuilding : null;
        if (_origDoEnterBuilding) {
            doEnterBuilding = function(unit) {
                if (!_isOnline() || state._remoteAction) return _origDoEnterBuilding(unit);
                if (_isHost()) return _hostRunAndSync(_origDoEnterBuilding, [unit]);
                if (!_guestOwnsAction(unit)) return false;
                _emit('game-action', { type: 'engine', fn: 'doEnterBuilding', unitId: unit.id });
                return true;
            };
        }

        const _origDoEntropyStrike = (typeof doEntropyStrike === 'function') ? doEntropyStrike : null;
        if (_origDoEntropyStrike) {
            doEntropyStrike = function(unit) {
                if (!_isOnline() || state._remoteAction) return _origDoEntropyStrike(unit);
                if (_isHost()) return _hostRunAndSync(_origDoEntropyStrike, [unit]);
                if (!_guestOwnsAction(unit)) return 0;
                _emit('game-action', { type: 'engine', fn: 'doEntropyStrike', unitId: unit.id });
                return 1200;
            };
            window.doEntropyStrike = doEntropyStrike;
        }

        const _origChannelNexus = (typeof channelNexus === 'function') ? channelNexus : null;
        if (_origChannelNexus) {
            channelNexus = function(unit) {
                if (!_isOnline() || state._remoteAction) return _origChannelNexus(unit);
                if (_isHost()) return _hostRunAndSync(_origChannelNexus, [unit]);
                if (!_guestOwnsAction(unit)) return false;
                _emit('game-action', { type: 'engine', fn: 'channelNexus', unitId: unit.id });
                return true;
            };
        }

        /* Guard (More-menu stance, ui.js doGuard) mutates AP + status +
           the Overwatch arm — a guest running it locally desyncs on the
           next state-sync (the classic "my Guard did nothing" rollback).
           Route it like every other engine mutator. */
        const _origDoGuard = (typeof doGuard === 'function') ? doGuard : null;
        if (_origDoGuard) {
            doGuard = function(unit) {
                if (!_isOnline() || state._remoteAction) return _origDoGuard(unit);
                if (_isHost()) return _hostRunAndSync(_origDoGuard, [unit]);
                if (!_guestOwnsAction(unit)) return;
                playSfx('uiConfirm');   // click feedback; the stance arrives with the sync
                _emit('game-action', { type: 'engine', fn: 'doGuard', unitId: unit.id });
            };
            window.doGuard = doGuard;
        }

        /* Inspect / Ward / Detonate — the remaining engine verbs the
           root ladder and the tile quick menu fire directly (they used to
           live in the retired More menu). Same routing as doGuard: the host
           runs-and-syncs, the guest only emits — running them guest-locally
           mutated AP/turn state and rolled back on the next state-sync. */
        const _origDoInspect = (typeof doInspect === 'function') ? doInspect : null;
        if (_origDoInspect) {
            doInspect = function(unit, x, y) {
                if (!_isOnline() || state._remoteAction) return _origDoInspect(unit, x, y);
                if (_isHost()) return _hostRunAndSync(_origDoInspect, [unit, x, y]);
                if (!_guestOwnsAction(unit)) return;
                playSfx('uiConfirm');
                _emit('game-action', { type: 'engine', fn: 'doInspect', unitId: unit.id, x: x, y: y });
            };
            window.doInspect = doInspect;
        }
        const _origDoWard = (typeof doWard === 'function') ? doWard : null;
        if (_origDoWard) {
            doWard = function(unit, x, y) {
                if (!_isOnline() || state._remoteAction) return _origDoWard(unit, x, y);
                if (_isHost()) return _hostRunAndSync(_origDoWard, [unit, x, y]);
                if (!_guestOwnsAction(unit)) return;
                playSfx('uiConfirm');
                _emit('game-action', { type: 'engine', fn: 'doWard', unitId: unit.id, x: x, y: y });
            };
            window.doWard = doWard;
        }
        const _origDoDetonate = (typeof doDetonate === 'function') ? doDetonate : null;
        if (_origDoDetonate) {
            doDetonate = function(unit) {
                if (!_isOnline() || state._remoteAction) return _origDoDetonate(unit);
                if (_isHost()) return _hostRunAndSync(_origDoDetonate, [unit]);
                if (!_guestOwnsAction(unit)) return;
                playSfx('uiConfirm');
                _emit('game-action', { type: 'engine', fn: 'doDetonate', unitId: unit.id });
            };
            window.doDetonate = doDetonate;
        }

        /* Host: rebroadcast at every action COMPLETION. Damage/AP land on
           impact timers ~1-2s after the click that triggered them, long after
           the click-time broadcast went out — this is why the guest saw enemy
           HP "never go down" until the next turn advance. endUnitIfDone runs
           at the tail of every action, making it the perfect sync point. */
        const _origEndUnitIfDone = endUnitIfDone;
        endUnitIfDone = function(unit) {
            const r = _origEndUnitIfDone(unit);
            var _netOnE = window._NET && window._NET.online;
            if ((_netOnE && _isHost() || _ewRecOn()) && state.phase === 'battle' && window._broadcastState) {
                window._broadcastState();
            }
            return r;
        };

        const _origForfeit = forfeitMatch;
        forfeitMatch = function() {
            if (!_isOnline()) return _origForfeit();
            if (_isGuest()) {
                _emit('game-action', {
                    type: 'forfeit',
                    player: _myPlayer()
                });
                return;
            }
            _origForfeit();
            if (window._broadcastState) window._broadcastState();
        };

        /* Post-match "Main Menu" — online teardown. Leaving to the menu ends
           the online session: drop the socket (the server closes the room and
           informs the opponent), clear the NET flags, and restore the local
           controller defaults so ONLINE_RULES.active goes false before the
           base implementation rebuilds the menu. */
        const _origBackToMainMenu = (typeof backToMainMenu === 'function') ? backToMainMenu : null;
        if (_origBackToMainMenu) {
            backToMainMenu = function() {
                if (_isOnline()) {
                    var N = window._NET;
                    try { if (N && N.socket) N.socket.disconnect(); } catch (e) {}
                    if (N) {
                        N.online = false;
                        N.connected = false;
                        N.role = null;
                        /* The guest's seat number MUST reset with the session —
                           a stale myPlayer=2 made getLocalPlayer()/
                           getViewerPlayer() treat the human as P2 in the next
                           LOCAL match. */
                        N.myPlayer = 1;
                        N.roomCode = null;
                        N.ranked = false;
                        N._wasInMatch = false;
                        N._rematchState = null;
                        N.rejoinToken = null;
                        N.socket = null;
                    }
                    try {
                        sessionStorage.removeItem('ew_rejoinToken');
                        sessionStorage.removeItem('ew_rejoinRoom');
                        sessionStorage.removeItem('ew_rejoinRole');
                    } catch (e) {}
                    state.controllers = { 1: CTRL.LOCAL, 2: CTRL.AI };
                    /* The guest's party builder wrote builderSelectedPlayer=2
                       (ui.js renderBuilder) — left stale, the next VS-CPU
                       builder writes the human's picks into TEAM 2, i.e. the
                       CPU's side. Local play always builds as P1. */
                    state.builderSelectedPlayer = 1;
                    if (typeof window._ewHideReconnectBanner === 'function') window._ewHideReconnectBanner();
                }
                return _origBackToMainMenu();
            };
        }

        /* Recall action sync */
        window._onlineEmitRecall = function(unitId) {
            if (!_isOnline()) return;
            if (_isGuest()) {
                _emit('game-action', { type: 'recall', unitId: unitId });
            } else {
                if (window._broadcastState) window._broadcastState();
            }
        };

        window.triggerOnlineForfeitWin = function(forfeitPlayer) {

            var winner = forfeitPlayer === 1 ? 2 : 1;
            if (typeof addLog === 'function') addLog('Player ' + forfeitPlayer + ' forfeited (disconnect timeout). Player ' + winner + ' wins!');

            if (typeof _origForfeit === 'function' && _isHost()) {

                state.matchResult = { winner: winner, reason: 'forfeit' };
                if (typeof showVictoryScreen === 'function') {
                    showVictoryScreen(winner);
                }
            }
        };

        /* ── Auto-start helper for ranked matchmaking ──────────────── */
        function _tryAutoStartRanked() {
            var NET = window._NET;
            if (!NET || !NET.ranked) return;
            var lock = NET._lockState;
            if (!lock || !lock.host || !lock.guestPartyReceived) return;
            /* Host is the authority — only host calls origStartMatch */
            if (NET.role !== 'host') return;
            /* Guard against double-fire */
            if (NET._autoStartFired) return;
            NET._autoStartFired = true;
            NET._waitingForOpponent = false;

            console.log('[NET] Both players locked in — auto-starting ranked match');
            addLog('Both players ready — starting match!');

            /* Small delay so the "both ready" message renders */
            setTimeout(function() {
                _origStartMatch();
                if (window._broadcastState) window._broadcastState();
                _emit('match-started');
            }, 600);
        }

        const _origStartMatch = startMatch;
        startMatch = function() {
            if (!_isOnline()) return _origStartMatch();

            var NET = window._NET;
            var lock = NET._lockState || { host: false, guest: false, guestPartyReceived: false };

            /* ── RANKED / QUICK-PLAY ── single-click flow ─────────── */
            if (NET.ranked) {
                /* If we already locked in, this is a redundant click — ignore */
                if (NET._waitingForOpponent || NET._autoStartFired) return;
                /* Otherwise, fall through — applyPartyBuild handles the lock */
                return;
            }

            /* ── FRIENDLY ROOM ── keep legacy host-controls-start flow ── */
            if (_isGuest()) {
                if (!lock.guest) {
                    if (window._sendPartyConfig) window._sendPartyConfig();
                    lock.guest = true;
                    _emit('relay', { type: 'guest-locked' });
                    addLog('Your party has been locked in and sent. Waiting for host to start…');
                } else {
                    addLog('Already locked in. Waiting for host to start the match…');
                }
                render();
                return;
            }

            if (!lock.host) {
                addLog('You must Lock In your team first.');
                return;
            }
            if (!lock.guestPartyReceived) {
                addLog('Waiting for Player 2 to lock in their party…');
                return;
            }
            _origStartMatch();
            if (window._broadcastState) window._broadcastState();
            _emit('match-started');
        };

        const _origApplyPartyBuild = applyPartyBuild;
        applyPartyBuild = function(showLog) {
            if (!_isOnline()) return _origApplyPartyBuild(showLog);

            var NET = window._NET;
            var lock = NET._lockState || { host: false, guest: false, guestPartyReceived: false };

            /* Already locked — ignore re-clicks */
            if (NET._waitingForOpponent || NET._autoStartFired) {
                return true;
            }

            var result = _origApplyPartyBuild(showLog);
            if (result === false) return false;

            /* ── RANKED / QUICK-PLAY ── single-click: lock + send + wait ── */
            if (NET.ranked) {
                if (_isGuest()) {
                    lock.guest = true;
                    if (window._sendPartyConfig) window._sendPartyConfig();
                    _emit('relay', { type: 'guest-locked' });
                } else {
                    lock.host = true;
                    _emit('relay', { type: 'host-locked' });
                }
                NET._waitingForOpponent = true;
                addLog('Party locked in. Waiting for opponent…');
                render();
                _tryAutoStartRanked();
                return true;
            }

            /* ── FRIENDLY ROOM ── legacy behavior ── */
            if (_isGuest()) {
                lock.guest = true;
                if (window._sendPartyConfig) window._sendPartyConfig();
                _emit('relay', { type: 'guest-locked' });
                addLog('Your party is locked in and sent to the host.');
            } else {
                lock.host = true;
                /* Tell the guest too — drives the "opponent locked in" state
                   on their SEAL YOUR FATE button (ranked already emits this). */
                _emit('relay', { type: 'host-locked' });
                addLog('Your party is locked in.' + (!lock.guestPartyReceived ? ' Waiting for Player 2 to lock in…' : ' Both players ready — click Start Match!'));
            }
            render();
            return true;
        };

        const _origMaybeAdvanceTurn = maybeAdvanceTurn;
        maybeAdvanceTurn = function() {
            _origMaybeAdvanceTurn();
            var _netOn = window._NET && window._NET.online;
            if ((_netOn && _isHost() || _ewRecOn()) && window._broadcastState) window._broadcastState();
        };

        const _origToggleAutoMode = toggleAutoMode;
        toggleAutoMode = function() {
            if (!_isOnline()) return _origToggleAutoMode();
            if (state.phase !== 'battle' || state.winner) return;
            const me = _myPlayer();
            if (_isGuest()) {

                state.autoPlayers[me] = !state.autoPlayers[me];
                addLog(`Player ${me} auto mode ${state.autoPlayers[me] ? 'enabled' : 'disabled'}.`);
                render();
                _emit('game-action', {
                    type: 'toggleAuto',
                    player: me
                });

                return;
            }

            state.autoPlayers[me] = !state.autoPlayers[me];
            addLog(`Player ${me} auto mode ${state.autoPlayers[me] ? 'enabled' : 'disabled'}.`);
            render();
            if (state.autoPlayers[me] && state.activePlayer === me) {
                _origMaybeTriggerComputerTurn();
            }
            if (window._broadcastState) window._broadcastState();
        };

        var _pendingCameraEvents = [];
        const _origPlayOffensiveActionCamera = playOffensiveActionCamera;
        playOffensiveActionCamera = function(sourceUnit, target, opts) {
            var result = _origPlayOffensiveActionCamera(sourceUnit, target, opts);

            var _netOn = window._NET && window._NET.online;
            if ((_netOn && _isHost() || _ewRecOn()) && sourceUnit && target) {
                var camEvt = {
                    type: 'offensive',
                    srcId: sourceUnit.id,
                    tgtId: target.id,
                    srcX: sourceUnit.x,
                    srcY: sourceUnit.y,
                    tgtX: target.x,
                    tgtY: target.y,
                    srcPlayer: sourceUnit.player || null,
                    tgtPlayer: target.player || null
                };

                if (opts) {
                    if (opts.attackName) camEvt.attackName = opts.attackName;
                    if (opts.sourceHold) camEvt.sourceHold = opts.sourceHold;
                    if (opts.targetHold) camEvt.targetHold = opts.targetHold;
                    /* beat-1 shot variant (ots / lowHero / sky) — without it
                       the guest opened every relayed cast on the default OTS
                       framing while the host got the anime power shot. */
                    if (opts.shotKind) camEvt.shotKind = opts.shotKind;
                    /* SPELL CINEMATICS (SPELL_CINEMATICS.md): the id of the
                       spell this shot belongs to. ONE field carries all 70
                       bespoke sequences plus every family treatment — the
                       guest re-resolves the same sequence locally off the id,
                       so a void stage / grade / side dolly that fires on the
                       host fires on the guest too (RULE #2). */
                    if (opts.spellId) camEvt.spellId = opts.spellId;
                    /* beam casts hold beat 1 through the launch (kamehameha
                       rule) — without this the guest cut away before the beam
                       left the caster's hands. */
                    if (opts.holdAfterLaunchMs != null) camEvt.holdAfterLaunchMs = opts.holdAfterLaunchMs;
                    /* Basic attacks (and other opted-out actions) must stay
                       tactical on the guest too — dropping these flags made
                       EVERY relayed attack replay as a full cinematic. */
                    if (opts.noActionCam) camEvt.noActionCam = true;
                    if (opts._noCinematic) camEvt._noCinematic = true;
                    /* Multi-target shots (line skewers, AoE blasts, split
                       beams): without these the guest's beat 2 framed only
                       the first victim while the host got the wide group cut. */
                    if (opts.frameTiles && opts.frameTiles.length) {
                        camEvt.frameTiles = opts.frameTiles.map(function(t) { return { x: t.x, y: t.y }; });
                    }
                    if (opts.extraTargets && opts.extraTargets.length) {
                        camEvt.extraTargetIds = opts.extraTargets
                            .map(function(u) { return u && u.id; })
                            .filter(function(id) { return id != null; });
                    }
                }
                if (state._remoteAction) {

                    _pendingCameraEvents.push(camEvt);
                } else {

                    _emit('relay', {
                        type: 'camera-events',
                        events: [camEvt]
                    });
                }
            }
            return result;
        };

        const _origQueueAnnouncement = queueAnnouncement;
        queueAnnouncement = function(title, subtitle, kind) {
            _origQueueAnnouncement(title, subtitle, kind);
            var _netOn = window._NET && window._NET.online;
            if ((_netOn && _isHost() || _ewRecOn())) {
                _emit('relay', {
                    type: 'announcement',
                    title: title,
                    subtitle: subtitle,
                    kind: kind
                });
            }
        };

        const _origShowTurnBanner = showTurnBanner;
        showTurnBanner = function(player, roundNum, isNewRound, blitzUnit) {
            _origShowTurnBanner(player, roundNum, isNewRound, blitzUnit);
            var _netOn = window._NET && window._NET.online;
            if ((_netOn && _isHost() || _ewRecOn())) {
                _emit('relay', {
                    type: 'turn-banner',
                    player: player,
                    roundNum: roundNum,
                    isNewRound: isNewRound,
                    blitzUnitId: blitzUnit ? blitzUnit.id : null
                });
            }
        };

        const _origShowRoundBanner = showRoundBanner;
        showRoundBanner = function(roundNum, onDone) {
            _origShowRoundBanner(roundNum, onDone);
            var _netOn = window._NET && window._NET.online;
            if ((_netOn && _isHost() || _ewRecOn())) {
                _emit('relay', {
                    type: 'round-banner',
                    roundNum: roundNum
                });
            }
        };
        window.showRoundBanner = showRoundBanner;

        /* Turn-handoff sweep ("Your Turn" / "Opponent's Turn"). The blitz
           engine only runs on the HOST, so without this relay the guest
           NEVER sees the handoff announcement — one of the biggest "online
           feels broken vs CPU" gaps. The guest recomputes the label from its
           own viewpoint (data.player vs its own player number). */
        const _origShowPlayerTurnAnnounce = showPlayerTurnAnnounce;
        showPlayerTurnAnnounce = function(unit) {
            _origShowPlayerTurnAnnounce(unit);
            var _netOn = window._NET && window._NET.online;
            if ((_netOn && _isHost() || _ewRecOn()) && unit) {
                _emit('relay', {
                    type: 'player-turn-announce',
                    player: unit.player,
                    unitId: unit.id || null
                });
            }
        };
        window.showPlayerTurnAnnounce = showPlayerTurnAnnounce;

        /* Stealth reveal banner (battle.js checkStealthReveals /
           updateSmokeZoneCloak): engine-side, so online it only ever fires on
           the HOST. Relay it and let the guest re-run the global, which
           recomputes "⚠️ Spotted!" vs "👁️ Hidden Enemy Revealed!" from ITS
           OWN viewer — the guest must feel its cover being blown. */
        if (typeof window.showStealthRevealBanner === 'function') {
            const _origShowStealthRevealBanner = window.showStealthRevealBanner;
            window.showStealthRevealBanner = function(unit) {
                _origShowStealthRevealBanner(unit);
                var _netOn = window._NET && window._NET.online;
                if ((_netOn && _isHost() || _ewRecOn()) && unit && state.phase === 'battle') {
                    _emit('relay', {
                        type: 'stealth-reveal-banner',
                        unitId: unit.id || null,
                        player: unit.player,
                        name: unit.name || null
                    });
                }
            };
        }

        const _origShowFloatingTextAtTile = showFloatingTextAtTile;
        showFloatingTextAtTile = function(x, y, textValue, kind, opts) {
            _origShowFloatingTextAtTile(x, y, textValue, kind, opts);
            var _netOn = window._NET && window._NET.online;
            if ((_netOn && _isHost() || _ewRecOn()) && state.phase === 'battle') {
                _emit('relay', {
                    type: 'floating-text',
                    x: x, y: y,
                    text: String(textValue ?? ''),
                    kind: kind || 'damage'
                });
            }
        };

        /* Fall/grounding camera dive (battle.js followUnitFall): engine-side
           beat — a grounded flyer / knocked-down unit drops and the camera
           rides down with them. Runs only on the HOST online, so relay it;
           the guest re-runs it locally where its OWN fog/concealment gate
           (_shouldCameraFollowUnit inside the function) decides visibility. */
        const _origFollowUnitFall = followUnitFall;
        followUnitFall = function(unit, opts) {
            _origFollowUnitFall(unit, opts);
            var _netOn = window._NET && window._NET.online;
            if ((_netOn && _isHost() || _ewRecOn()) && unit && state.phase === 'battle') {
                _emit('relay', {
                    type: 'unit-fall-follow',
                    unitId: unit.id,
                    duration: (opts && opts.duration) || 0
                });
            }
        };
        window.followUnitFall = followUnitFall;

        /* Post-action camera settle (battle.js armActionCamSettle): the
           debounced "come home from the action shot" return that pulls the
           camera off beat 2's close-up of the target and back onto the ACTOR.
           It runs inside the engine's post-action soft reset, so online it
           only ever fires on the HOST — without the relay the guest replayed
           the cinematic shot and then sat parked, zoomed in on the victim (or
           on the bare tile a terrain/deploy spell aimed at) for the rest of
           the turn. endShot=true on the guest: nothing mirror-side ever ends a
           relayed shot, and the settle refuses to fire while one owns the
           camera. The function itself fog-gates the re-centre on the GUEST's
           own viewer, so a hidden enemy actor settles in place. */
        if (typeof window._armActionCamSettle === 'function') {
            const _origArmActionCamSettle = window._armActionCamSettle;
            window._armActionCamSettle = function(unitId, x, y, delayMs, endShot) {
                _origArmActionCamSettle(unitId, x, y, delayMs, endShot);
                var _netOn = window._NET && window._NET.online;
                if ((_netOn && _isHost() || _ewRecOn()) && state.phase === 'battle') {
                    _emit('relay', {
                        type: 'cam-action-settle',
                        unitId: unitId != null ? unitId : null,
                        x: Number.isFinite(x) ? x : null,
                        y: Number.isFinite(y) ? y : null,
                        delay: delayMs || 0
                    });
                }
            };
        }

        /* Dash/charge follow camera (battle.js animateDashActionCamera): the
           camera rides with the dasher from launch to landing. Engine-side
           (runs inside doSpell's dash/chargeToTarget), so online it only ever
           fires on the HOST — relay the glide so the guest's camera follows
           too. The guest handler fog-gates both endpoints on ITS OWN fog set
           before replaying (a hidden enemy's dash must never trace its path). */
        const _origAnimateDashActionCamera = animateDashActionCamera;
        animateDashActionCamera = function(fromPoint, toPoint, opts) {
            var result = _origAnimateDashActionCamera(fromPoint, toPoint, opts);
            var _netOn = window._NET && window._NET.online;
            if ((_netOn && _isHost() || _ewRecOn()) && fromPoint && toPoint && state.phase === 'battle') {
                _emit('relay', {
                    type: 'dash-cam-follow',
                    fromX: fromPoint.x, fromY: fromPoint.y,
                    toX: toPoint.x, toY: toPoint.y,
                    duration: (opts && opts.duration) || 0,
                    casterId: (opts && opts.casterId) || null,
                    /* charge-shot chrome (2026-08-03): the letterboxed windup→
                       chase cinematic slams the spell name — without this the
                       guest's charge shot ran with an empty title card. */
                    attackName: (opts && opts.attackName) || null
                });
            }
            return result;
        };
        window.animateDashActionCamera = animateDashActionCamera;

        /* Sky-throw visuals (battle.js playSkyGrabFx / playSkyThrowFx): the
           victim hauled up and HELD aloft on grab (the grey saucer parks
           overhead with its beam on), then flung / beam-carried to the landing
           tile. Both run inside doSpell — HOST-only online — so relay them;
           the guest replays them fog-gated with a cosmetic-only impact. The
           spell's display params ride in the relay so the guest never has to
           resolve the def. */
        if (typeof window.playSkyGrabFx === 'function') {
            const _origPlaySkyGrabFx = window.playSkyGrabFx;
            window.playSkyGrabFx = function(caster, target, spell) {
                _origPlaySkyGrabFx(caster, target, spell);
                var _netOn = window._NET && window._NET.online;
                if ((_netOn && _isHost() || _ewRecOn()) && target && spell && state.phase === 'battle') {
                    _emit('relay', {
                        type: 'sky-grab-fx',
                        casterId: caster ? caster.id : null,
                        targetId: target.id,
                        spellId: spell.id,
                        spellType: spell.spellType || null,
                        carryHeight: spell.carryHeight || 4
                    });
                }
            };
        }
        if (typeof window.playSkyThrowFx === 'function') {
            const _origPlaySkyThrowFx = window.playSkyThrowFx;
            window.playSkyThrowFx = function(target, fromX, fromY, toX, toY, spell, opts) {
                var result = _origPlaySkyThrowFx(target, fromX, fromY, toX, toY, spell, opts);
                var _netOn = window._NET && window._NET.online;
                if ((_netOn && _isHost() || _ewRecOn()) && target && spell && state.phase === 'battle') {
                    _emit('relay', {
                        type: 'sky-throw-fx',
                        targetId: target.id,
                        fromX: fromX, fromY: fromY, toX: toX, toY: toY,
                        spellId: spell.id,
                        spellType: spell.spellType || null,
                        carryHeight: spell.carryHeight || 4
                    });
                }
                return result;
            };
        }
        /* Vortex fling (tornado/hurricane displacement, battle.js
           playVortexFlingFx): runs inside processHomingWeather — HOST-only
           online — so relay it; the guest replays the lift/spin/hurl with a
           cosmetic impact (positions arrive via state-sync). */
        if (typeof window.playVortexFlingFx === 'function') {
            const _origPlayVortexFlingFx = window.playVortexFlingFx;
            window.playVortexFlingFx = function(target, fromX, fromY, toX, toY, kind, opts) {
                var result = _origPlayVortexFlingFx(target, fromX, fromY, toX, toY, kind, opts);
                var _netOn = window._NET && window._NET.online;
                if ((_netOn && _isHost() || _ewRecOn()) && target && state.phase === 'battle') {
                    _emit('relay', {
                        type: 'vortex-fling-fx',
                        targetId: target.id,
                        fromX: fromX, fromY: fromY, toX: toX, toY: toY,
                        kind: kind || null
                    });
                }
                return result;
            };
        }

        /* Storm lightning (state.js playStormLightningFx): thunderstorm bolts
           fire from the HOST engine (weather ticks + homing strikes), so
           relay them; the guest replays the bolt fog-gated. */
        if (typeof window.playStormLightningFx === 'function') {
            const _origPlayStormLightningFx = window.playStormLightningFx;
            window.playStormLightningFx = function(x, y) {
                _origPlayStormLightningFx(x, y);
                var _netOn = window._NET && window._NET.online;
                if ((_netOn && _isHost() || _ewRecOn()) && state.phase === 'battle') {
                    _emit('relay', { type: 'storm-lightning-fx', x: x, y: y });
                }
            };
        }

        _postRenderHook = function() {
            _injectTurnBanner();
            _fixPerspectiveLabels();
        };

        function _injectTurnBanner() {
            if (!_isOnline()) return;
            const label = document.getElementById('turnLabel');
            if (!label || state.phase !== 'battle' || state.winner) return;
            const isMyTurn = state.activePlayer === _myPlayer();
            label.textContent = isMyTurn ? '⚔️ YOUR TURN' : '⏳ Opponent\'s Turn';
            label.style.background = isMyTurn ? 'rgba(85,211,138,0.2)' : 'rgba(255,184,77,0.2)';
            label.style.color = isMyTurn ? 'var(--green)' : 'var(--hourglass)';
        }

        const _origContinueMatch = continueToNextMatch;
        continueToNextMatch = async function() {
            if (!_isOnline()) return _origContinueMatch();
            const me = _myPlayer();
            if (!window._NET._rematchState) window._NET._rematchState = {
                1: false,
                2: false
            };
            window._NET._rematchState[me] = true;
            _emit('relay', {
                type: 'rematch-request',
                from: me
            });

            if (nextMatchBtn) {
                nextMatchBtn.textContent = '✓ Rematch Requested — Waiting…';
                nextMatchBtn.disabled = true;
            }
            addLog(`Player ${me} wants a rematch.`);

            if (window._NET._rematchState[1] && window._NET._rematchState[2]) {
                _startOnlineRematch();
            }
        };

        async function _startOnlineRematch() {
            window._NET._rematchState = {
                1: false,
                2: false
            };
            window._NET._rankedResultEmitted = false;
            addLog('Both players agreed — starting rematch!');
            if (_isHost()) {

                transitionTo(GS.PARTY_BUILDER);
                state.winner = null;
                state.teamLockedIn = false;
                hideResultOverlay();

                if (window._NET._lockState) {
                    window._NET._lockState = {
                        host: false,
                        guest: false,
                        guestPartyReceived: false,
                        hostLocked: false
                    };
                }
                window._NET._waitingForOpponent = false;
                window._NET._autoStartFired = false;
                state.showPlayer2Builder = true;
                state.matchNumber = (state.matchNumber || 1) + 1;
                render();
                if (window._broadcastState) window._broadcastState();
            } else {

                state._guestResultShown = false;
                state._guestBoardBuilt = false;
                hideResultOverlay();
            }
        }

        window._executeRemoteAction = function(data) {
            if (!data || !data.type) return;
            state._remoteAction = true;

            var remoteP = _isHost() ? 2 : 1;
            var savedCtrl = state.controllers[remoteP];
            state.controllers[remoteP] = CTRL.LOCAL;

            var _hostUI = {
                selectedUnitId: state.selectedUnitId,
                focusedUnitId: state.focusedUnitId,
                actionMode: state.actionMode,
                actionMenuView: state.actionMenuView,
                selectedTool: state.selectedTool,
                pendingTarget: state.pendingTarget,
                comboPartner: state.comboPartner,
                buildTool: state._buildTool,
                _prevBlitzActiveId: state._blitzActiveUnitId
            };
            try {
                switch (data.type) {
                    case 'clickTile':

                        if (data._ctx) {

                            var _guestSelId = data._ctx.selectedUnitId;
                            if (state._blitzActiveUnitId && _guestSelId && _guestSelId !== state._blitzActiveUnitId) {
                                _guestSelId = state._blitzActiveUnitId;
                            }
                            state.selectedUnitId = _guestSelId;
                            state.actionMode = data._ctx.actionMode;
                            state.selectedTool = data._ctx.selectedTool;
                            state.pendingTarget = data._ctx.pendingTarget;
                            if (data._ctx.buildTool) state._buildTool = data._ctx.buildTool;
                            if (data._ctx.comboPartner) {
                                state.comboPartner = state.units.find(function(u) {
                                    return u.id === data._ctx.comboPartner;
                                }) || null;
                            } else {
                                state.comboPartner = null;
                            }
                        }
                        clickTile(data.x, data.y);
                        break;
                    case 'selectUnit':
                        selectUnit(data.id);
                        break;
                    case 'setTool':
                        setTool(data.mode, data.toolName);
                        break;
                    case 'setActionMode':
                        setActionMode(data.mode);
                        break;
                    case 'triggerEndTurn': {
                        /* Ownership + turn validation (same rigor as 'engine').
                           An unvalidated end-turn was a soft-lock vector: a
                           late/duplicate guest END TURN landing during the
                           host's turn-handoff window (state._blitzActiveUnitId
                           null) re-entered maybeAdvanceTurn mid-advance and
                           could zero ANY unit's AP — including a host unit —
                           via ui.js triggerEndTurn's unguarded `unit.ap = 0`. */
                        if (state.phase === 'battle') {
                            if (state.activePlayer !== remoteP) break;
                            /* Advance already in flight — drop the stale press. */
                            if (!state._blitzActiveUnitId) break;
                            var _etUnit = data._selectedUnitId
                                ? state.units.find(function(u) { return u.id === data._selectedUnitId && !u.dead; })
                                : null;
                            if (_etUnit && _etUnit.player !== remoteP) break;
                        }
                        if (data._selectedUnitId) state.selectedUnitId = data._selectedUnitId;
                        triggerEndTurn();
                        break;
                    }
                    case 'useRosterItem':
                        useRosterItemButton(data.unitId, data.itemKey);
                        break;
                    case 'forfeit':
                        /* Ownership: a remote client can only forfeit ITSELF —
                           the sender's player number is authoritative, never
                           the payload (a hacked guest sent player:1 to make
                           the HOST forfeit and win instantly). */
                        state.winner = remoteP === 2 ? 1 : 2;
                        addLog('Player ' + remoteP + ' forfeits the match.');
                        checkWin();
                        break;
                    case 'recall': {
                        var recallUnit = state.units.find(function(u) { return u.id === data.unitId; });
                        if (recallUnit && typeof doRecall === 'function') doRecall(recallUnit);
                        break;
                    }
                    case 'toggleAuto':
                        /* Ownership: only the sender's OWN auto flag — a guest
                           payload naming player 1 could flip the host onto AI
                           control mid-match. */
                        if (data.player === remoteP) {
                            state.autoPlayers[data.player] = !state.autoPlayers[data.player];
                            addLog('Player ' + data.player + ' auto mode ' + (state.autoPlayers[data.player] ? 'enabled' : 'disabled') + '.');
                            render();
                            if (state.autoPlayers[data.player] && state.activePlayer === data.player) {
                                _origMaybeTriggerComputerTurn();
                            }
                        }
                        break;
                    case 'engine': {
                        /* Direct engine mutator relayed from the guest's HUD
                           (quick-action menu, target submenu, tile actions,
                           More-menu verbs, drag-moves). Validate ownership +
                           turn, then replay authoritatively — the wrappers
                           pass through to the originals while
                           state._remoteAction is set. */
                        var engUnit = state.units.find(function(u) { return u.id === data.unitId && !u.dead; });
                        if (!engUnit || engUnit.player !== remoteP) break;
                        if (state.activePlayer !== remoteP) break;
                        state.selectedUnitId = engUnit.id;
                        state.focusedUnitId = engUnit.id;
                        if (data.tool !== undefined) state.selectedTool = data.tool;
                        switch (data.fn) {
                            case 'doAttack': doAttack(engUnit, data.x, data.y, data.z); break;
                            case 'doSpell': doSpell(engUnit, data.x, data.y, data.z); break;
                            case 'doMove': doMove(engUnit, data.x, data.y, data.z); break;
                            case 'doJump': doJump(engUnit, data.x, data.y, data.z); break;
                            case 'doItem': doItem(engUnit, data.x, data.y, data.z); break;
                            case 'doComboAttack': {
                                var engPartner = state.units.find(function(u) { return u.id === data.partnerId && !u.dead; });
                                if (engPartner) doComboAttack(engUnit, engPartner, data.x, data.y, data.z);
                                break;
                            }
                            case 'doBuildAction':
                                if (typeof doBuildAction === 'function') doBuildAction(engUnit, data.x, data.y, data.tool || 'dig');
                                break;
                            case 'doEnterBuilding':
                                if (typeof doEnterBuilding === 'function') doEnterBuilding(engUnit);
                                break;
                            case 'doAltitudeChange':
                                if (typeof doAltitudeChange === 'function') doAltitudeChange(engUnit, data.mode);
                                break;
                            case 'doReshape':
                                if (typeof doReshape === 'function') doReshape(engUnit, data.mode);
                                break;
                            case 'channelNexus':
                                if (typeof channelNexus === 'function') channelNexus(engUnit);
                                break;
                            case 'doEntropyStrike':
                                if (typeof doEntropyStrike === 'function') doEntropyStrike(engUnit);
                                break;
                            case 'doGuard':
                                if (typeof doGuard === 'function') doGuard(engUnit);
                                break;
                            case 'doInspect':
                                if (typeof doInspect === 'function') doInspect(engUnit, data.x, data.y);
                                break;
                            case 'doWard':
                                if (typeof doWard === 'function') doWard(engUnit, data.x, data.y);
                                break;
                            case 'doDetonate':
                                if (typeof doDetonate === 'function') doDetonate(engUnit);
                                break;
                        }
                        break;
                    }
                    case 'armRepeat': {
                        /* Attack ×N from the guest's quick menu: the repeat
                           queue is drained host-side (endUnitIfDone), so a
                           guest-local queue would never fire — the guest
                           relays the arm instead. Same ownership/turn gates
                           as 'engine'; every queued swing is re-validated by
                           doAttack when it drains. */
                        var rqUnit = state.units.find(function(u) { return u.id === data.unitId && !u.dead; });
                        if (!rqUnit || rqUnit.player !== remoteP) break;
                        if (state.activePlayer !== remoteP) break;
                        var rqN = Math.max(0, Math.min(8, (data.queued | 0)));
                        if (rqN > 0) {
                            state._repeatQueue = { unitId: rqUnit.id, mode: 'attack', tool: null,
                                x: data.x, y: data.y, z: data.z, queued: rqN };
                        }
                        break;
                    }
                    case 'quickMoveTowards': {
                        /* Quick-menu "Move Towards" chase: the chain must run
                           on the HOST — the guest's unit positions only move
                           via state-sync, so a guest-local chain re-reads
                           stale tiles forever (see hud.js _chainMoveTowards).
                           Each step goes through doMove/doJump and is
                           re-validated. */
                        var mtUnit = state.units.find(function(u) { return u.id === data.unitId && !u.dead; });
                        var mtTarget = state.units.find(function(u) { return u.id === data.targetId && !u.dead; });
                        if (!mtUnit || mtUnit.player !== remoteP) break;
                        if (state.activePlayer !== remoteP) break;
                        if (mtTarget && typeof _chainMoveTowards === 'function') _chainMoveTowards(mtUnit, mtTarget);
                        break;
                    }
                }
            } catch (err) {
                console.error('[NET] Remote action error:', err);
            }
            state.controllers[remoteP] = savedCtrl;
            state._remoteAction = false;

            if (state._blitzActiveUnitId === _hostUI._prevBlitzActiveId) {
                state.selectedUnitId = _hostUI.selectedUnitId;
                state.focusedUnitId = _hostUI.focusedUnitId;
                state.actionMode = _hostUI.actionMode;
                state.actionMenuView = _hostUI.actionMenuView;
                state.selectedTool = _hostUI.selectedTool;
                state.pendingTarget = _hostUI.pendingTarget;
                state.comboPartner = _hostUI.comboPartner;
                state._buildTool = _hostUI.buildTool;
            } else {

                if (state.activePlayer !== remoteP) {

                    state.actionMode = null;
                    state.selectedTool = null;
                    state.pendingTarget = null;
                    state.comboPartner = null;
                }
            }

            /* While it's the REMOTE player's turn, keep the local top-left
               unit panel MIRRORING the unit the opponent is actually driving
               (their selection or the blitz-active unit) instead of the
               host's stale pre-turn selection — both screens now show the
               same "current unit". Local input on it stays blocked by the
               activePlayer gates in the wrappers above. */
            if (state.phase === 'battle' && !state.winner && state.activePlayer === remoteP) {
                var _mirrorId = (data.type === 'selectUnit' && data.id) ? data.id
                    : (data.unitId || (data._ctx && data._ctx.selectedUnitId) || state._blitzActiveUnitId);
                var _mirrorU = _mirrorId ? state.units.find(function(u) {
                    return u.id === _mirrorId && !u.dead && u.player === remoteP;
                }) : null;
                if (_mirrorU) {
                    state.selectedUnitId = _mirrorU.id;
                    state.focusedUnitId = _mirrorU.id;
                }
            }

            if (_pendingCameraEvents.length > 0) {
                _emit('relay', {
                    type: 'camera-events',
                    events: _pendingCameraEvents.slice()
                });
                _pendingCameraEvents.length = 0;
            }

            if (window._broadcastState) {
                if (window._NET && window._NET.syncThrottle) {
                    clearTimeout(window._NET.syncThrottle);
                    window._NET.syncThrottle = null;
                }
                window._NET.lastSyncJson = '';
                window._broadcastState();
            }
        };

        window._enterOnlineMode = function() {

            var startOverlay = document.getElementById('startOverlay');
            if (startOverlay) {
                startOverlay.classList.add('hidden');
                startOverlay.style.display = 'none';
                startOverlay.style.pointerEvents = 'none';
            }

            var lobbyOverlay = document.getElementById('lobbyOverlay');
            if (lobbyOverlay) {
                lobbyOverlay.classList.add('hidden');
                lobbyOverlay.style.display = 'none';
            }

            applyOnlineRules();

            var _net = window._NET;
            if (_net && _net.ranked && _net.matchMapModeId) {

                /* authoritative=true: the server picked this map — the guest
                   guard inside applyGameMode must not swallow it. */
                if (typeof applyGameMode === 'function') {
                    applyGameMode(_net.matchMapModeId, true);
                } else if (typeof window._rawApplyGameMode === 'function') {
                    window._rawApplyGameMode(_net.matchMapModeId);
                }

                if (_net.matchTeamSize && typeof CONFIG !== 'undefined') {
                    var ts = _net.matchTeamSize;
                    CONFIG.teamSize = ts;

                    if (typeof GAME_MODES !== 'undefined') {
                        var gm = GAME_MODES[_net.matchMapModeId];
                        if (gm) {
                            SPAWNS[1] = (gm.spawns[1] || []).slice(0, ts);
                            SPAWNS[2] = (gm.spawns[2] || []).slice(0, ts);

                            var bw = gm.boardWidth || gm.boardSize || 8;
                            var bh = gm.boardHeight || gm.boardSize || 8;
                            while (SPAWNS[1].length < ts) {
                                var idx1 = SPAWNS[1].length;
                                SPAWNS[1].push({ x: idx1 % 2, y: Math.min(Math.floor(idx1 / 2), bh - 1) });
                            }
                            while (SPAWNS[2].length < ts) {
                                var idx2 = SPAWNS[2].length;
                                SPAWNS[2].push({ x: bw - 1 - (idx2 % 2), y: Math.min(bh - 1 - Math.floor(idx2 / 2), bh - 1) });
                            }
                            DEFAULT_BUILDS[1] = (gm.defaultBuilds[1] || []).slice(0, ts);
                            DEFAULT_BUILDS[2] = (gm.defaultBuilds[2] || []).slice(0, ts);
                            while (DEFAULT_BUILDS[1].length < ts) DEFAULT_BUILDS[1].push('Warrior');
                            while (DEFAULT_BUILDS[2].length < ts) DEFAULT_BUILDS[2].push('Warrior');
                        }
                    }

                    var st = window._gameState;
                    if (st) {
                        [1, 2].forEach(function(player) {
                            var oldSize = (st.partyBuilds[player] || []).length;
                            if (oldSize < ts) {
                                for (var i = oldSize; i < ts; i++) {
                                    st.partyBuilds[player][i] = DEFAULT_BUILDS[player][i] || 'Warrior';
                                    st.partyNames[player][i] = typeof getDefaultUnitName === 'function'
                                        ? getDefaultUnitName(st.partyBuilds[player][i]) : 'Unit';
                                    st.loadouts[player][i] = typeof emptyLoadout === 'function' ? emptyLoadout() : {};
                                    if (!st.partyMeta[player]) st.partyMeta[player] = [];
                                    st.partyMeta[player][i] = {};
                                }
                            } else if (oldSize > ts) {
                                st.partyBuilds[player].length = ts;
                                st.partyNames[player].length = ts;
                                st.loadouts[player].length = ts;
                                if (st.partyMeta[player]) st.partyMeta[player].length = ts;
                            }
                        });
                    }
                }

                if (window._gameState) {
                    window._gameState.isRankedMatch = true;
                }

                activeMultiplayerMode = _net.matchRankedMode || _net.matchMultiplayerMode || 'arena';
                console.log('[NET] Applied ranked config: map=' + _net.matchMapModeId + ' team=' + _net.matchTeamSize + ' mode=' + activeMultiplayerMode);
            }

            if (_net && !_net.ranked && _net.friendlyConfig) {
                var fc = _net.friendlyConfig;

                if (fc.mode) {
                    activeMultiplayerMode = fc.mode;
                }

                if (fc.mapId) {
                    /* authoritative=true: host-picked friendly config — must
                       apply on the guest too (see ranked branch above). */
                    if (typeof applyGameMode === 'function') {
                        applyGameMode(fc.mapId, true);
                    } else if (typeof window._rawApplyGameMode === 'function') {
                        window._rawApplyGameMode(fc.mapId);
                    }
                }

                if (fc.teamSize && typeof CONFIG !== 'undefined') {
                    var fts = fc.teamSize;
                    CONFIG.teamSize = fts;
                    if (typeof GAME_MODES !== 'undefined') {
                        var fgm = GAME_MODES[fc.mapId];
                        if (fgm) {
                            SPAWNS[1] = (fgm.spawns[1] || []).slice(0, fts);
                            SPAWNS[2] = (fgm.spawns[2] || []).slice(0, fts);
                            var fbw = fgm.boardWidth || fgm.boardSize || 8;
                            var fbh = fgm.boardHeight || fgm.boardSize || 8;
                            while (SPAWNS[1].length < fts) {
                                var fi1 = SPAWNS[1].length;
                                SPAWNS[1].push({ x: fi1 % 2, y: Math.min(Math.floor(fi1 / 2), fbh - 1) });
                            }
                            while (SPAWNS[2].length < fts) {
                                var fi2 = SPAWNS[2].length;
                                SPAWNS[2].push({ x: fbw - 1 - (fi2 % 2), y: Math.min(fbh - 1 - Math.floor(fi2 / 2), fbh - 1) });
                            }
                            DEFAULT_BUILDS[1] = (fgm.defaultBuilds[1] || []).slice(0, fts);
                            DEFAULT_BUILDS[2] = (fgm.defaultBuilds[2] || []).slice(0, fts);
                            while (DEFAULT_BUILDS[1].length < fts) DEFAULT_BUILDS[1].push('Warrior');
                            while (DEFAULT_BUILDS[2].length < fts) DEFAULT_BUILDS[2].push('Warrior');
                        }
                    }

                    var fst = window._gameState;
                    if (fst) {
                        [1, 2].forEach(function(player) {
                            var fOldSize = (fst.partyBuilds[player] || []).length;
                            if (fOldSize < fts) {
                                for (var fi = fOldSize; fi < fts; fi++) {
                                    fst.partyBuilds[player][fi] = DEFAULT_BUILDS[player][fi] || 'Warrior';
                                    fst.partyNames[player][fi] = typeof getDefaultUnitName === 'function'
                                        ? getDefaultUnitName(fst.partyBuilds[player][fi]) : 'Unit';
                                    fst.loadouts[player][fi] = typeof emptyLoadout === 'function' ? emptyLoadout() : {};
                                    if (!fst.partyMeta[player]) fst.partyMeta[player] = [];
                                    fst.partyMeta[player][fi] = {};
                                }
                            } else if (fOldSize > fts) {
                                fst.partyBuilds[player].length = fts;
                                fst.partyNames[player].length = fts;
                                fst.loadouts[player].length = fts;
                                if (fst.partyMeta[player]) fst.partyMeta[player].length = fts;
                            }
                        });
                    }
                }

                if (fc.rounds && window._gameState) {
                    window._gameState._customRoundLimit = fc.rounds;
                }
                console.log('[NET] Applied friendly config: mode=' + fc.mode + ' map=' + fc.mapId + ' team=' + fc.teamSize + ' rounds=' + fc.rounds);
            }

            if (_myPlayer() === 2) {
                document.body.classList.add('is-p2-viewer');
            }

            if (!window._NET._lockState) {
                window._NET._lockState = {
                    host: false,
                    guest: false,
                    guestPartyReceived: false
                };
            }

            ['devAutoSimBtn', 'devAutoSimBtn2', 'devSimBattleBtn'].forEach(function(id) {
                var el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
            document.querySelectorAll('[id^="devSim"]').forEach(function(el) {
                el.style.display = 'none';
            });

            ['togglePlayer2Builder', 'togglePlayer2Builder2'].forEach(function(id) {
                var el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });

            ['fogToggleBuilder', 'fogToggleBuilder2', 'fogToggleBattle'].forEach(function(id) {
                var el = document.getElementById(id);
                if (el && el.parentElement) el.parentElement.style.display = 'none';
            });

            if (window.render) {
                window.render();
            }
            try {
                if (window.syncMusicToState) window.syncMusicToState();
            } catch (e) {
            }

        };

        window._applyRemotePartyConfig = function(data) {
            if (!data) return;
            /* Anti-cheat (host-side): clamp the guest's party to the match
               team size and refuse configs naming unknown races — a modified
               client could otherwise field extra slots or invented units.
               Spell loadouts are re-validated at unit build time
               (trimSpellIdsToSlotBudget), and true account-unlock ownership
               is enforced server-side where the DB lives. */
            var _ts = (typeof CONFIG !== 'undefined' && CONFIG.teamSize) ? CONFIG.teamSize : 4;
            if (Array.isArray(data.builds)) data.builds = data.builds.slice(0, _ts);
            if (Array.isArray(data.loadouts)) data.loadouts = data.loadouts.slice(0, _ts);
            if (Array.isArray(data.meta)) {
                data.meta = data.meta.slice(0, _ts);
                var _raceReg = (typeof RACE_PROFILES !== 'undefined') ? RACE_PROFILES : (window.RACE_PROFILES || null);
                if (_raceReg) {
                    for (var _mi = 0; _mi < data.meta.length; _mi++) {
                        var _mEntry = data.meta[_mi];
                        if (_mEntry && _mEntry.race && !_raceReg[_mEntry.race]) {
                            addLog('⚠️ Rejected opponent party config: unknown unit "' + _mEntry.race + '".');
                            console.warn('[NET GUARD] party-config rejected — unknown race:', _mEntry.race);
                            return;
                        }
                    }
                }
            }
            if (data.builds) state.partyBuilds[2] = data.builds;
            if (data.loadouts) state.loadouts[2] = data.loadouts;
            if (data.name && state.partyNames) state.partyNames[2] = String(data.name).slice(0, 24);
            if (data.meta && state.partyMeta) state.partyMeta[2] = data.meta;
            /* Spell-tree authority (RULE #2): the HOST re-validates every
               received loadout against the sender's own tree — off-tree or
               disconnected picks are dropped here AND again in createUnit
               (belt and braces; a hacked guest can't smuggle spells). */
            if (Array.isArray(state.partyMeta?.[2]) && typeof window.treeLegalSubset === 'function'
                && typeof window.classHasSpellTree === 'function') {
                state.partyMeta[2].forEach(function (mEntry, mIdx) {
                    if (!mEntry || !Array.isArray(mEntry.customSpells)) return;
                    var mCls = state.partyBuilds?.[2]?.[mIdx];
                    if (!mCls || !window.classHasSpellTree(mCls)) return;
                    var mFixed = window.treeLegalSubset(mEntry.race || '', mCls, mEntry.secondaryJob || '', mEntry.customSpells);
                    if (mFixed.length !== mEntry.customSpells.length) {
                        console.warn('[NET GUARD] spell-tree loadout trimmed for guest slot', mIdx,
                            mEntry.customSpells.length, '→', mFixed.length);
                        mEntry.customSpells = mFixed;
                    }
                });
            }

            const lock = window._NET._lockState;
            if (lock) lock.guestPartyReceived = true;

            if (window._NET.ranked) {
                addLog('Opponent\'s party received.');
                _tryAutoStartRanked();
            } else {
                addLog('Player 2 has locked in their party.' + (lock && lock.host ? ' Both players ready — click Start Match!' : ''));
            }
            render();
        };

        window._gameState = state;
        window.CTRL = CTRL;
        window.isOnlineMatch = isOnlineMatch;
        window.getLocalPlayer = getLocalPlayer;
        /* The React party builder reads these off window (it used to silently
           fall back to "offline, player 1" because they were never exported —
           which is why SEAL YOUR FATE never showed its waiting state). */
        window._myPlayer = _myPlayer;
        if (typeof ONLINE_RULES !== 'undefined' && !window.ONLINE_RULES) window.ONLINE_RULES = ONLINE_RULES;
        window._startOnlineRematch = _startOnlineRematch;
        window.showVsSplash = showVsSplash;
        window.showResultOverlay = showResultOverlay;
        window.finalizeMatch = finalizeMatch;
        window.GAME_MODES = GAME_MODES;
        window.addLog = addLog;
        /* Genuine guest-guard bypass: applies an AUTHORITATIVE map id (server
           match config / host game-mode relay). Must NOT be a bare alias of
           applyGameMode — the guard inside it silently no-ops for guests,
           which left the guest's activeGameMode stale (loading screen + HUD
           showed the wrong map). */
        window._rawApplyGameMode = function(modeId) {
            return applyGameMode(modeId, true);
        };

        window.focusBoardCameraOnTiles = focusBoardCameraOnTiles;
        window.resetBoardCamera = resetBoardCamera;
        window.playOffensiveActionCamera = playOffensiveActionCamera;

        /* ── SPELL CINEMATICS: standalone beats (SPELL_CINEMATICS.md) ──
           Moments that fire OUTSIDE a cast — the To Be Continued freeze when
           the delayed hit lands at end of round, the Indomitable Will save,
           the Red Eyes glyph. The engine only runs on the HOST, so without
           this wrapper the guest would simply never see them. Payloads are
           plain serialisable data by design. */
        if (window.CineFX && typeof window.CineFX.play === 'function' && !window.CineFX._netWrapped) {
            const _origCineFxPlay = window.CineFX.play;
            window.CineFX.play = function(name, payload) {
                _origCineFxPlay.call(window.CineFX, name, payload);
                var _netOn = window._NET && window._NET.online;
                if ((_netOn && _isHost()) || _ewRecOn()) {
                    _emit('relay', { type: 'cine-fx', fx: name, payload: payload || {} });
                }
            };
            window.CineFX._netWrapped = true;
        }
        window.getUserZoomScale = getUserZoomScale;
        window.unitFromId = unitFromId;
        window.showAnnouncementBanner = showAnnouncementBanner;
        window.showTurnBanner = showTurnBanner;
        window.showFloatingTextAtTile = showFloatingTextAtTile;

        window.animateJumpArc = animateJumpArc;
        window.animateStrikeLeap = animateStrikeLeap;
        window.playSfx = playSfx;
        window.playUnitSwitchChime = playUnitSwitchChime;

        const _origAnimateWalkPath = animateWalkPath;
        animateWalkPath = function(unit, path, onComplete) {

            var _netOnline = window._NET && window._NET.online;
            if ((_netOnline && _isHost() || _ewRecOn()) && unit && path && path.length > 0) {
                _emit('relay', {
                    type: 'walk-anim',
                    unitId: unit.id,
                    fromX: unit.x,
                    fromY: unit.y,
                    fromZ: unit.z ?? 0,
                    path: path.map(function(p) { return { x: p.x, y: p.y, z: p.z ?? 0 }; })
                });
            }
            var result = _origAnimateWalkPath(unit, path, onComplete);
            return result;
        };
        window.animateWalkPath = animateWalkPath;

        const _origAnimateJumpArc = animateJumpArc;
        animateJumpArc = function(unit, fromX, fromY, toX, toY, fromZ, toZ, durationMs) {

            var _netOnline = window._NET && window._NET.online;
            if ((_netOnline && _isHost() || _ewRecOn()) && unit) {
                _emit('relay', {
                    type: 'jump-anim',
                    unitId: unit.id,
                    fromX: fromX, fromY: fromY,
                    toX: toX, toY: toY,
                    fromZ: fromZ ?? 0, toZ: toZ ?? 0,
                    durationMs: durationMs || 480
                });
            }
            return _origAnimateJumpArc(unit, fromX, fromY, toX, toY, fromZ, toZ, durationMs);
        };

        const _origAnimateStrikeLeap = animateStrikeLeap;
        animateStrikeLeap = function(unit, tx, ty, opts) {
            var _netOnline = window._NET && window._NET.online;
            if ((_netOnline && _isHost() || _ewRecOn()) && unit) {
                _emit('relay', {
                    type: 'strike-leap',
                    unitId: unit.id,
                    tx: tx, ty: ty
                });
            }
            return _origAnimateStrikeLeap(unit, tx, ty, opts);
        };

        /* 🎱 Knockback / shove / drag animations (2026-07-26 bounce pass).
           Every push, pull, hurl and rebound funnels through these two — they
           were never relayed, so the guest just saw bodies teleport on the
           next state-sync. The relayed steps carry z and the fractional
           "bump" waypoints, so wall slams and pool-ball rebounds read
           identically on both clients. */
        const _origAnimateDisplacementPath = animateDisplacementPath;
        animateDisplacementPath = function(unit, fromX, fromY, steps, perStepMs, opts) {
            var _netOnline = window._NET && window._NET.online;
            if ((_netOnline && _isHost() || _ewRecOn()) && unit && steps && steps.length > 0) {
                _emit('relay', {
                    type: 'displace-anim',
                    unitId: unit.id,
                    fromX: fromX,
                    fromY: fromY,
                    steps: steps.map(function(p) {
                        return { x: p.x, y: p.y, z: p.z, bump: p.bump ? 1 : 0 };
                    }),
                    perStepMs: perStepMs || 120,
                    delayMs: (opts && opts.delayMs) || 0
                });
            }
            return _origAnimateDisplacementPath(unit, fromX, fromY, steps, perStepMs, opts);
        };
        window.animateDisplacementPath = animateDisplacementPath;

        const _origAnimateDisplacement = animateDisplacement;
        animateDisplacement = function(unit, fromX, fromY, toX, toY, durationMs, opts) {
            var _netOnline = window._NET && window._NET.online;
            if ((_netOnline && _isHost() || _ewRecOn()) && unit && (fromX !== toX || fromY !== toY)) {
                _emit('relay', {
                    type: 'displace-anim',
                    unitId: unit.id,
                    fromX: fromX,
                    fromY: fromY,
                    steps: [{ x: toX, y: toY }],
                    perStepMs: durationMs || 220,
                    delayMs: (opts && opts.delayMs) || 0
                });
            }
            return _origAnimateDisplacement(unit, fromX, fromY, toX, toY, durationMs, opts);
        };
        window.animateDisplacement = animateDisplacement;

        /* Collision impact beat (shake + thud + spark + tile text). The sfx
           and floating text channels are already relayed on their own, so the
           guest replay mutes both and keeps only the shake + spark. */
        const _origPlayCollisionImpactFx = (typeof playCollisionImpactFx === 'function') ? playCollisionImpactFx : null;
        if (_origPlayCollisionImpactFx) {
            playCollisionImpactFx = function(x, y, kind, opts) {
                var _netOn = window._NET && window._NET.online;
                if ((_netOn && _isHost() || _ewRecOn()) && !(opts && opts.remote)) {
                    _emit('relay', {
                        type: 'collision-fx',
                        x: x, y: y, kind: kind,
                        delayMs: (opts && opts.delayMs) || 0
                    });
                }
                return _origPlayCollisionImpactFx(x, y, kind, opts);
            };
            window.playCollisionImpactFx = playCollisionImpactFx;
        }

        const _origPlaySfx = playSfx;
        playSfx = function(key, opts) {
            _origPlaySfx(key, opts);
            var _netOn = window._NET && window._NET.online;
            if ((_netOn && _isHost() || _ewRecOn()) && state.phase === 'battle' && key) {
                _emit('relay', { type: 'sfx', key: key });
            }
        };
        window.playSfx = playSfx;

        /* Entropy Strike cinematic: the presentation runs host-side inside
           doEntropyStrike (engine relay = host-only), so without this the
           guest got HP drops and relayed sfx but NO banner/panels/sigils.
           Relay the cinematic by id; the guest replays it with no applyHit
           (damage arrives via state-sync) and muted sfx (the 'sfx' relay
           already carries those). */
        const _origEwsPlayCinematic = (typeof _ewsPlayCinematic === 'function') ? _ewsPlayCinematic : null;
        if (_origEwsPlayCinematic) {
            _ewsPlayCinematic = function(unit, targets, allies, hooks) {
                var _netOn = window._NET && window._NET.online;
                if ((_netOn && _isHost() || _ewRecOn()) && unit && !(hooks && hooks.remote)) {
                    _emit('relay', {
                        type: 'entropy-cine',
                        unitId: unit.id,
                        targetIds: (targets || []).map(function(t) { return t && t.id; }),
                        allyIds: (allies || []).map(function(a) { return a && a.id; })
                    });
                }
                return _origEwsPlayCinematic(unit, targets, allies, hooks);
            };
            window._ewsPlayCinematic = _ewsPlayCinematic;
        }

        /* Combo dual-tech cinematic: same deal — doComboAttack runs host-only,
           so the cut-in page / converge streams / impact signature are
           relayed with the host's exact beat timings. The guest re-decides
           panel visibility for its own fog view inside the presentation. */
        const _origComboPlayPresentation = (typeof _comboPlayPresentation === 'function') ? _comboPlayPresentation : null;
        if (_origComboPlayPresentation) {
            _comboPlayPresentation = function(initiator, partner, target, combo, T) {
                var _netOn = window._NET && window._NET.online;
                if ((_netOn && _isHost() || _ewRecOn()) && initiator && partner && target && !(T && T.remote)) {
                    _emit('relay', {
                        type: 'combo-cine',
                        initiatorId: initiator.id, partnerId: partner.id, targetId: target.id,
                        T: {
                            ccOK: !!(T && T.ccOK),
                            sourceHold: T ? T.sourceHold : 0,
                            launchAt: T ? T.launchAt : 0,
                            hitAt: T ? T.hitAt : 0,
                            hitGap: T ? T.hitGap : 0,
                            projMs: T ? T.projMs : 0,
                            hits: (T && T.hits) || 1
                        }
                    });
                }
                return _origComboPlayPresentation(initiator, partner, target, combo, T);
            };
            window._comboPlayPresentation = _comboPlayPresentation;
        }

        if (typeof VFX3D !== 'undefined' && VFX3D.fire) {
            const _origVFX3Dfire = VFX3D.fire;
            VFX3D.fire = function(phase, spellId, params) {
                var result = _origVFX3Dfire.call(VFX3D, phase, spellId, params);
                var _netOn = window._NET && window._NET.online;
                if ((_netOn && _isHost() || _ewRecOn())) {

                    var safeParams = {};
                    if (params) {
                        /* sx/sy are the SOURCE tile spelling used by the
                           battle.js travel handlers (beam / teleport) and by
                           the staging intents — without them on this list the
                           guest replayed beams from tile 0,0 with range 0 and
                           dropped teleport/staging effects entirely. */
                        ['tx', 'ty', 'tz', 'sx', 'sy', 'fromX', 'fromY', 'dx', 'dy', 'range',
                         'spellType', 'casterX', 'casterY', 'aoeRadius', 'cx', 'cy',
                         'toX', 'toY', 'fromZ', 'toZ', 'flyMs', 'headGlow',
                         'staggerMs', 'includePrimary',
                         /* staging (cinematic grammar) beat params */
                         'weight', 'archetype', 'dimMs', 'holdMs',
                         /* timeline cue params (Spell Lab 'cue' intent) —
                            without these the guest gets a cue with no fx
                            name and silently drops it */
                         'fx', 'anchor', 'scale', 'tint', 'durMs'].forEach(function(k) {
                            if (params[k] !== undefined) safeParams[k] = params[k];
                        });
                        if (params.hitTiles) {
                            safeParams.hitTiles = params.hitTiles.map(function(t) {
                                return { x: t.x, y: t.y };
                            });
                        }
                        // tile-list params (wall segments, chain hops) — plain
                        // {x,y} copies so nothing non-serializable rides along
                        ['tiles', 'chain'].forEach(function(k) {
                            if (Array.isArray(params[k])) {
                                safeParams[k] = params[k].map(function(t) {
                                    return { x: t.x, y: t.y };
                                });
                            }
                        });
                    }
                    _emit('relay', {
                        type: 'vfx3d',
                        phase: phase,
                        spellId: spellId,
                        params: safeParams
                    });
                }
                return result;
            };
        }

        /* ── Cosmetic VFX siblings relay (2026-07-26) ────────────────────
           VFX3D.fire is relayed above, but its sibling entry points never
           were — heals, buffs, debuffs, dashes, status pops, level-ups,
           blood, teleports, zones, and the generic projectile/beam/aoe
           streams all existed on the HOST only. One generic wrapper:
           primitive args ride a 'vfx3d-x' relay; the guest fog-gates each
           fn's anchor tiles (map below) and replays.
           fireCombo is deliberately absent — the combo-cine relay already
           replays the full presentation (streams included) on the guest. */
        if (typeof VFX3D !== 'undefined') {
            /* fn → [x,y] argument-index pairs used as fog anchors */
            window._VFXX_ANCHORS = {
                fireHeal:           [[0, 1]],
                fireMana:           [[0, 1]],
                fireBuff:           [[0, 1]],
                fireDebuff:         [[0, 1]],
                fireLevelUp:        [[0, 1]],
                fireStatus:         [[1, 2]],
                fireBlood:          [[0, 1]],
                fireDash:           [[0, 1], [2, 3]],
                fireTeleportLegacy: [[0, 1], [2, 3]],
                fireZone:           [[0, 1]],
                projectile:         [[0, 1], [2, 3]],
                beam:               [[0, 1], [2, 3]],
                aoe:                [[0, 1]],
                /* hand-authored 3D saucers called directly from battle.js
                   (host-only online): the War of the Worlds fleet and the
                   Probe's hovering craft. Args are (tx, ty, ...primitives),
                   so the generic wrapper serializes them as-is. */
                sigUFOFleet3D:      [[0, 1]],
                spawnProbeDescent3D:[[0, 1]],
            };
            Object.keys(window._VFXX_ANCHORS).forEach(function(fnName) {
                var _origSib = VFX3D[fnName];
                if (typeof _origSib !== 'function') return;
                VFX3D[fnName] = function() {
                    var args = Array.prototype.slice.call(arguments);
                    var result = _origSib.apply(VFX3D, args);
                    var _netOn = window._NET && window._NET.online;
                    if ((_netOn && _isHost() || _ewRecOn())) {
                        /* JSON-safe payload: primitives ride as-is, a trailing
                           opts object is reduced to its primitive fields */
                        var safe = args.map(function(a) {
                            if (a == null || typeof a === 'number'
                                || typeof a === 'string' || typeof a === 'boolean') return a;
                            if (typeof a === 'object' && !Array.isArray(a)) {
                                var o = {};
                                for (var k in a) {
                                    if (typeof a[k] === 'number' || typeof a[k] === 'string'
                                        || typeof a[k] === 'boolean') o[k] = a[k];
                                }
                                return o;
                            }
                            return null;
                        });
                        _emit('relay', { type: 'vfx3d-x', fn: fnName, args: safe });
                    }
                    return result;
                };
            });
        }

        /* ── Support / self-cast spell camera relay (2026-07-26) ─────────
           The two-beat "gift" shot (_playSupportCineShot) and the self-cast
           hero shot (via _spellFocusCamera) run HOST-side in battle.js —
           without these relays the guest kept a static camera for every
           non-offensive cast: the biggest "buffs feel flat online" gap.
           Split to avoid double-fire: _playSupportCineShot relays itself;
           _spellFocusCamera relays only when it did NOT delegate to the
           support shot (self hero shot / flat pan). Guest-side fog gating
           happens inside the replayed functions against the guest's own
           vision. */
        const _origPlaySupportCineShot = (typeof _playSupportCineShot === 'function') ? _playSupportCineShot : null;
        if (_origPlaySupportCineShot) {
            _playSupportCineShot = function(unit, target, opts) {
                var result = _origPlaySupportCineShot(unit, target, opts);
                var _netOn = window._NET && window._NET.online;
                if (result && (_netOn && _isHost() || _ewRecOn()) && unit && target) {
                    _emit('relay', {
                        type: 'support-cine',
                        casterId: unit.id || null,
                        cx: unit.x, cy: unit.y,
                        casterPlayer: unit.player || null,
                        tgtId: target.id != null ? target.id : null,
                        tx: target.x, ty: target.y,
                        spellName: (opts && opts.spellName) || null,
                        spellId: (opts && opts.spellId) || null
                    });
                }
                return result;
            };
            window._playSupportCineShot = _playSupportCineShot;
        }

        const _origSpellFocusCamera = (typeof _spellFocusCamera === 'function') ? _spellFocusCamera : null;
        if (_origSpellFocusCamera) {
            _spellFocusCamera = function(casterUnit, tx, ty, opts) {
                var result = _origSpellFocusCamera(casterUnit, tx, ty, opts);
                var _netOn = window._NET && window._NET.online;
                if ((_netOn && _isHost() || _ewRecOn()) && casterUnit
                    && !(result && result.mode === 'support')) {
                    _emit('relay', {
                        type: 'spell-focus-cam',
                        casterId: casterUnit.id || null,
                        cx: casterUnit.x, cy: casterUnit.y,
                        casterPlayer: casterUnit.player || null,
                        tx: tx, ty: ty,
                        spellName: (opts && opts.spellName) || null,
                        spellId: (opts && opts.spellId) || null
                    });
                }
                return result;
            };
            window._spellFocusCamera = _spellFocusCamera;
        }

        resetGame();

        transitionTo(GS.TITLE);
        render();

        (function() {
            'use strict';

            const NET = {
                socket: null,
                role: null,
                roomCode: null,
                connected: false,
                online: false,
                myPlayer: null,
                syncThrottle: null,
                lastSyncJson: '',
                ranked: false,
                matchMapModeId: null,
                matchTeamSize: null,
                opponentElo: null,
                rejoinToken: null,
                friendlyConfig: null,
                _lockState: {
                    host: false,
                    guest: false,
                    guestPartyReceived: false,
                    hostLocked: false
                },
                _waitingForOpponent: false,
                _autoStartFired: false
            };
            window._NET = NET;

            (function() {
                var _counterSocket = null;
                function _updateCounterUI(count) {
                    var el = document.getElementById('mmOnlineCount');
                    var numEl = document.getElementById('mmOnlineNum');
                    if (el && numEl) {
                        numEl.textContent = count;
                        el.style.display = count > 0 ? '' : 'none';
                    }
                }
                function _connectCounter() {
                    if (_counterSocket) return;
                    try {
                        _counterSocket = io(window.location.origin, {
                            transports: ['websocket', 'polling'],
                            reconnection: true,
                            reconnectionDelay: 5000
                        });
                        _counterSocket.on('player-count', function(data) {
                            if (data && typeof data.count === 'number') {
                                _updateCounterUI(data.count);
                            }
                        });
                        _counterSocket.on('disconnect', function() {
                            _updateCounterUI(0);
                        });
                    } catch(e) {
                        console.warn('[NET] Counter socket failed:', e);
                    }
                }

                setTimeout(_connectCounter, 1500);
            })();

            var _friendlyMode = 'arena';
            var _friendlySize = 4;
            var _friendlyMapId = 'medium';
            var _friendlyRounds = 15;

            var _queueTeamSize = 4;
            var _queueTimerInterval = null;
            var _queueStartTime = 0;
            var _inQueue = false;

            window.lobbyPlayOffline = function() {
                NET.online = false;
                NET.myPlayer = 1;
                if (window._gameState) window._gameState.builderSelectedPlayer = 1;

                if (window._lobbyBack) window._lobbyBack();
            };

            window.lobbyBackToPlayHub = function() {

                if (_queueTimerInterval) {
                    clearInterval(_queueTimerInterval);
                    _queueTimerInterval = null;
                }
                _inQueue = false;
                if (NET.socket) {
                    NET.socket.emit('queue-leave');
                    NET.socket.disconnect();
                    NET.socket = null;
                }
                /* Leaving the online lobby ends the online session entirely —
                   without these two the guest identity (online=true,
                   myPlayer=2) survived into the next local match: the human
                   was viewed as P2 and built the CPU's team. */
                NET.online = false;
                NET.myPlayer = 1;
                if (window._gameState) window._gameState.builderSelectedPlayer = 1;
                NET.role = null;
                NET.roomCode = null;
                NET.connected = false;
                NET.ranked = false;
                NET.matchMapModeId = null;
                NET.matchTeamSize = null;
                NET.matchRankedMode = null;
                NET.rejoinToken = null;
                NET.friendlyConfig = null;
                NET._wasInMatch = false;
                NET._waitingForOpponent = false;
                NET._autoStartFired = false;
                NET._lockState = { host: false, guest: false, guestPartyReceived: false, hostLocked: false };
                try {
                    sessionStorage.removeItem('ew_rejoinToken');
                    sessionStorage.removeItem('ew_rejoinRoom');
                    sessionStorage.removeItem('ew_rejoinRole');
                } catch(e) {}

                if (window._showTitlePage) window._showTitlePage('playHubPage');
                else if (window._lobbyBack) window._lobbyBack();
            };

            window.lobbyBackToMain = window.lobbyBackToPlayHub;

            window.lobbyBackToFriendlyMain = function() {
                if (NET.socket) {
                    NET.socket.disconnect();
                    NET.socket = null;
                }
                NET.role = null;
                NET.roomCode = null;
                NET.connected = false;
                /* Session over (socket dropped) — retire the guest seat too,
                   see lobbyBackToPlayHub. */
                NET.online = false;
                NET.myPlayer = 1;
                if (window._gameState) window._gameState.builderSelectedPlayer = 1;
                _showPage('lobbyFriendlyMain');
            };

            function _friendlyGetConfig() {
                return { mode: _friendlyMode, mapId: _friendlyMapId, teamSize: _friendlySize, rounds: _friendlyRounds };
            }

            function _friendlyEmitConfig() {
                if (NET.socket && NET.role === 'host') {
                    NET.socket.emit('friendly-config', _friendlyGetConfig());
                }
            }

            function _friendlyGetCompatibleMaps(mode, size) {
                var mpMode = (typeof MULTIPLAYER_MODES !== 'undefined') ? MULTIPLAYER_MODES[mode] : null;
                var compat = mpMode ? mpMode.compatibleMaps : [];
                var results = [];
                if (typeof GAME_MODES === 'undefined') return results;
                for (var i = 0; i < compat.length; i++) {
                    var gm = GAME_MODES[compat[i]];
                    if (gm && gm.teamSize === size) {
                        results.push({ id: compat[i], label: gm.label || compat[i], desc: gm.desc || '' });
                    }
                }

                if (results.length === 0) {
                    for (var j = 0; j < compat.length; j++) {
                        var gm2 = GAME_MODES[compat[j]];
                        if (gm2 && gm2.teamSize >= size) {
                            results.push({ id: compat[j], label: gm2.label || compat[j], desc: gm2.desc || '' });
                        }
                    }
                }
                return results;
            }

            function _friendlyRefreshMaps() {
                var sel = document.getElementById('friendlyMapSelect');
                if (!sel) return;
                var maps = _friendlyGetCompatibleMaps(_friendlyMode, _friendlySize);
                sel.innerHTML = '';
                for (var i = 0; i < maps.length; i++) {
                    var opt = document.createElement('option');
                    opt.value = maps[i].id;
                    opt.textContent = maps[i].label;
                    sel.appendChild(opt);
                }

                var found = false;
                for (var k = 0; k < maps.length; k++) {
                    if (maps[k].id === _friendlyMapId) { found = true; break; }
                }
                if (!found && maps.length > 0) _friendlyMapId = maps[0].id;
                sel.value = _friendlyMapId;
            }

            function _friendlyConfigLabel() {
                var modeLbl = _friendlyMode.charAt(0).toUpperCase() + _friendlyMode.slice(1);
                var mpMode = (typeof MULTIPLAYER_MODES !== 'undefined') ? MULTIPLAYER_MODES[_friendlyMode] : null;
                if (mpMode && mpMode.label) modeLbl = mpMode.label;
                var mapLbl = _friendlyMapId;
                var gm = (typeof GAME_MODES !== 'undefined') ? GAME_MODES[_friendlyMapId] : null;
                if (gm && gm.label) mapLbl = gm.label;
                return modeLbl + ' on ' + mapLbl + ', ' + _friendlySize + 'v' + _friendlySize + ', ' + _friendlyRounds + ' rounds';
            }

            window.friendlySetMode = function(mode) {
                _friendlyMode = mode;
                var btns = document.querySelectorAll('#friendlyModeChips .ranked-size-btn');
                btns.forEach(function(b) { b.classList.toggle('active', b.getAttribute('data-mode') === mode); });

                var mpMode = (typeof MULTIPLAYER_MODES !== 'undefined') ? MULTIPLAYER_MODES[mode] : null;
                if (mpMode && mpMode.roundLimit) {
                    _friendlyRounds = mpMode.roundLimit;
                    var rd = document.getElementById('friendlyRoundDisplay');
                    if (rd) rd.textContent = _friendlyRounds;
                }
                /* Clash is locked to 4v4 on its fixed stage with no round
                   limit — fight to the wipeout. */
                if (mpMode && mpMode.isClash) {
                    _friendlySize = 4;
                    var sbtns = document.querySelectorAll('#friendlySizeChips .ranked-size-btn');
                    sbtns.forEach(function(b) { b.classList.toggle('active', parseInt(b.getAttribute('data-size')) === 4); });
                    _friendlyRounds = 0;
                    var rd2 = document.getElementById('friendlyRoundDisplay');
                    if (rd2) rd2.textContent = '∞';
                }
                _friendlyRefreshMaps();
                _friendlyEmitConfig();
            };

            window.friendlySetSize = function(size) {
                // Clash is 4v4 only.
                if (size !== 4 && typeof MULTIPLAYER_MODES !== 'undefined'
                    && MULTIPLAYER_MODES[_friendlyMode] && MULTIPLAYER_MODES[_friendlyMode].isClash) return;
                _friendlySize = size;
                var btns = document.querySelectorAll('#friendlySizeChips .ranked-size-btn');
                btns.forEach(function(b) { b.classList.toggle('active', parseInt(b.getAttribute('data-size')) === size); });
                _friendlyRefreshMaps();
                _friendlyEmitConfig();
            };

            window.friendlySetMap = function(mapId) {
                _friendlyMapId = mapId;
                _friendlyEmitConfig();
            };

            window.friendlyStepRounds = function(delta) {
                // Clash has no round limit — the stepper is inert.
                if (typeof MULTIPLAYER_MODES !== 'undefined'
                    && MULTIPLAYER_MODES[_friendlyMode] && MULTIPLAYER_MODES[_friendlyMode].isClash) return;
                _friendlyRounds = Math.max(5, Math.min(99, _friendlyRounds + delta));
                var rd = document.getElementById('friendlyRoundDisplay');
                if (rd) rd.textContent = _friendlyRounds;
                _friendlyEmitConfig();
            };

            var _queueMode = 'arena';

            window.lobbyShowQuickPlay = function() {
                _showPage('lobbyQuickPlay');

                var elo = 1200;
                try {
                    var prof = window.ProfileSystem && window.ProfileSystem.getActiveProfile();
                    if (prof && typeof prof.elo === 'number') elo = prof.elo;
                } catch(e) {}
                var eloEl = document.getElementById('lobbyQueueElo');
                if (eloEl) eloEl.textContent = 'ELO: ' + elo;

                var startBtn = document.getElementById('lobbyQueueStartBtn');
                var searchDiv = document.getElementById('lobbyQueueSearching');
                var backBtn = document.getElementById('lobbyRankedBackBtn');
                if (startBtn) startBtn.style.display = '';
                if (searchDiv) searchDiv.style.display = 'none';
                if (backBtn) backBtn.style.display = '';
                _inQueue = false;
            };

            window.lobbySetQueueMode = function(mode) {
                _queueMode = mode;
                var btns = document.querySelectorAll('#lobbyQueueModes .ranked-size-btn');
                btns.forEach(function(b) {
                    b.classList.toggle('active', b.getAttribute('data-mode') === mode);
                });
                // Clash queues are 4v4 only — snap the size chips to match.
                if (mode === 'clash' && typeof window.lobbySetQueueSize === 'function') {
                    window.lobbySetQueueSize(4);
                }
            };

            window.lobbyCreateRoom = function() {
                _connectSocket(function() {
                    var _username = (window.ProfileSystem && window.ProfileSystem.getActiveProfile()) ? window.ProfileSystem.getActiveProfile().username : 'Player';
                    NET.socket.emit('create-room', { username: _username }, function(resp) {
                        if (resp.error) {
                            _setStatus('lobbyHostStatus', resp.error, 'error');
                            return;
                        }
                        NET.role = 'host';
                        NET.myPlayer = 1;
                        NET.roomCode = resp.code;
                        if (resp.rejoinToken) NET.rejoinToken = resp.rejoinToken;
                        document.getElementById('lobbyRoomCode').textContent = resp.code;
                        _showPage('lobbyHosting');

                        _friendlyRefreshMaps();
                    });
                });
            };

            window.lobbyShowJoin = function() {
                _showPage('lobbyJoining');
                setTimeout(function() {
                    document.getElementById('lobbyJoinInput').focus();
                }, 100);
            };

            window.lobbyJoinRoom = function() {
                var code = (document.getElementById('lobbyJoinInput').value || '').toUpperCase().trim();
                if (code.length !== 5) {
                    _setStatus('lobbyJoinStatus', 'Code must be 5 letters.', 'error');
                    return;
                }
                _setStatus('lobbyJoinStatus', 'Connecting…', 'waiting');
                _connectSocket(function() {
                    var _username = (window.ProfileSystem && window.ProfileSystem.getActiveProfile()) ? window.ProfileSystem.getActiveProfile().username : 'Player';
                    NET.socket.emit('join-room', { code: code, username: _username }, function(resp) {
                        if (resp.error) {
                            _setStatus('lobbyJoinStatus', resp.error, 'error');
                            return;
                        }
                        NET.role = 'guest';
                        NET.myPlayer = 2;
                        NET.roomCode = code;
                        if (resp.rejoinToken) NET.rejoinToken = resp.rejoinToken;
                    });
                });
            };

            document.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && document.activeElement === document.getElementById('lobbyJoinInput')) lobbyJoinRoom();
            });

            window.lobbyShowRankedQueue = window.lobbyShowQuickPlay;

            window.lobbySetQueueSize = function(size) {
                // Clash is locked to 4v4.
                if (size !== 4 && _queueMode === 'clash') return;
                _queueTeamSize = size;
                var btns = document.querySelectorAll('.ranked-size-btn');
                btns.forEach(function(b) {
                    b.classList.toggle('active', parseInt(b.getAttribute('data-size')) === size);
                });
            };

            window.lobbyJoinQueue = function() {
                if (_inQueue) return;
                _inQueue = true;

                var startBtn = document.getElementById('lobbyQueueStartBtn');
                var searchDiv = document.getElementById('lobbyQueueSearching');
                var backBtn = document.getElementById('lobbyRankedBackBtn');
                if (startBtn) startBtn.style.display = 'none';
                if (searchDiv) searchDiv.style.display = 'block';
                if (backBtn) backBtn.style.display = 'none';

                _queueStartTime = Date.now();
                if (_queueTimerInterval) clearInterval(_queueTimerInterval);
                _queueTimerInterval = setInterval(function() {
                    var elapsed = Math.floor((Date.now() - _queueStartTime) / 1000);
                    var min = Math.floor(elapsed / 60);
                    var sec = elapsed % 60;
                    var timerEl = document.getElementById('lobbyQueueTimer');
                    if (timerEl) timerEl.textContent = min + ':' + (sec < 10 ? '0' : '') + sec;
                }, 1000);

                var elo = 1200;
                try {
                    var prof = window.ProfileSystem && window.ProfileSystem.getActiveProfile();
                    if (prof && typeof prof.elo === 'number') elo = prof.elo;
                } catch(e) {}

                var _username = (window.ProfileSystem && window.ProfileSystem.getActiveProfile())
                    ? window.ProfileSystem.getActiveProfile().username : 'Player';

                _connectSocket(function() {

                    var PS = window.ProfileSystem;
                    if (PS && PS.hasServerAccount && PS.hasServerAccount()) {
                        PS.serverAuthenticateSocket().then(function(authResult) {
                            if (authResult && authResult.ok && authResult.data) {

                                console.log('[MM] Socket authenticated, server ELO:', authResult.data.elo);
                            }
                        }).catch(function() {  });
                    }

                    NET.socket.emit('queue-join', {
                        teamSize: _queueTeamSize,
                        username: _username,
                        elo: elo,
                        rankedMode: _queueMode
                    });
                    _setStatus('lobbyQueueStatus', 'Searching for opponent…', 'waiting');
                });
            };

            window.lobbyLeaveQueue = function() {
                _inQueue = false;
                if (_queueTimerInterval) {
                    clearInterval(_queueTimerInterval);
                    _queueTimerInterval = null;
                }
                if (NET.socket) {
                    NET.socket.emit('queue-leave');
                }

                lobbyShowQuickPlay();
            };

            function _showPage(id) {
                ['lobbyQuickPlay', 'lobbyFriendlyMain', 'lobbyHosting', 'lobbyJoining', 'lobbyConnected'].forEach(function(p) {
                    var el = document.getElementById(p);
                    if (el) el.style.display = p === id ? 'block' : 'none';
                });
            }

            function _setStatus(elId, text, type) {
                var el = document.getElementById(elId);
                if (el) {
                    el.textContent = text;
                    el.className = 'lobby-status' + (type ? ' ' + type : '');
                }
            }

            var _reconnectTimer = null;
            var _reconnectOverlay = null;

            /* Non-blocking reconnect banner (was a full-screen blackout that
               hid the board and blocked all input for up to 90s). The board
               stays visible — you can review the field while you wait — and
               the local shot clock pauses so nobody loses a turn to a
               disconnect. Same function names/call sites as the old overlay. */
            function _showReconnectOverlay(oppLabel, seconds) {
                _hideReconnectOverlay();
                if (typeof window._pauseShotClock === 'function') window._pauseShotClock();
                var isSelf = oppLabel === 'You';
                var msg = isSelf
                    ? '⚠️ Connection lost — reconnecting…'
                    : '⚠️ ' + oppLabel + ' disconnected — waiting for reconnect…';
                if (!document.getElementById('ewReconnectPulseStyle')) {
                    var st = document.createElement('style');
                    st.id = 'ewReconnectPulseStyle';
                    st.textContent = '@keyframes ewReconnectPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.35;transform:scale(0.7)}}';
                    document.head.appendChild(st);
                }
                var banner = document.createElement('div');
                banner.id = 'reconnectOverlay';
                banner.style.cssText = 'position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;align-items:center;gap:10px;padding:9px 18px;border-radius:20px;background:rgba(12,9,16,0.92);border:1px solid rgba(255,184,77,0.55);box-shadow:0 6px 24px rgba(0,0,0,0.55);font-family:DotGothic16,monospace;color:#fff;pointer-events:none;max-width:min(92vw,560px);';
                banner.innerHTML =
                    '<span style="display:inline-block;flex:0 0 auto;width:9px;height:9px;border-radius:50%;background:#ffb84d;animation:ewReconnectPulse 1s ease-in-out infinite;"></span>' +
                    '<span style="font-size:0.95rem;">' + msg + '</span>' +
                    '<span id="reconnectCountdown" style="font-size:1.05rem;color:#dc3c82;font-weight:bold;min-width:36px;text-align:right;">' + seconds + 's</span>';
                document.body.appendChild(banner);
                _reconnectOverlay = banner;
                var remaining = seconds;
                _reconnectTimer = setInterval(function() {
                    remaining--;
                    var cd = document.getElementById('reconnectCountdown');
                    if (cd) cd.textContent = Math.max(0, remaining) + 's';
                    if (remaining <= 0) {
                        clearInterval(_reconnectTimer);
                        _reconnectTimer = null;
                    }
                }, 1000);
            }

            function _hideReconnectOverlay() {
                if (_reconnectTimer) { clearInterval(_reconnectTimer); _reconnectTimer = null; }
                if (_reconnectOverlay) { _reconnectOverlay.remove(); _reconnectOverlay = null; }
                var existing = document.getElementById('reconnectOverlay');
                if (existing) existing.remove();
                if (typeof window._resumeShotClock === 'function') window._resumeShotClock();
            }
            /* Exposed so the main-menu teardown (defined in the wrapper scope
               above this closure) can clear a live banner. */
            window._ewHideReconnectBanner = _hideReconnectOverlay;

            function _connectSocket(onReady) {
                if (NET.socket && NET.socket.connected) {
                    onReady();
                    return;
                }
                NET.socket = io(window.location.origin, {
                    transports: ['websocket', 'polling']
                });

                NET.socket.on('connect', function() {

                    if (NET._wasInMatch && NET.rejoinToken && NET.roomCode) {
                        NET.socket.emit('rejoin-room', {
                            roomCode: NET.roomCode,
                            rejoinToken: NET.rejoinToken
                        }, function(resp) {
                            if (resp && resp.ok) {
                                console.log('[NET] Rejoined room ' + NET.roomCode + ' as ' + resp.role);
                                NET.role = resp.role;
                                NET.myPlayer = resp.myPlayer;
                                NET.connected = true;
                                NET.online = true;
                                _hideReconnectOverlay();
                                NET._wasInMatch = false;
                                ewToast('Reconnected!', 2000);
                            } else {
                                console.log('[NET] Rejoin failed:', resp && resp.error);
                                ewToast('Failed to rejoin: ' + (resp && resp.error || 'unknown'), 4000);
                                NET._wasInMatch = false;
                                setTimeout(function() { window.location.reload(); }, 3000);
                            }
                        });
                    } else {
                        onReady();
                    }
                });

                NET.socket.on('disconnect', function(reason) {
                    if (NET.online && NET.connected) {
                        console.log('[NET] Own socket disconnected:', reason);
                        NET.connected = false;
                        NET._wasInMatch = true;
                        _showReconnectOverlay('You', 90);

                    }
                });

                NET.socket.on('connect_error', function(err) {
                    _setStatus('lobbyHostStatus', 'Connection failed. Is the server running?', 'error');
                    _setStatus('lobbyJoinStatus', 'Connection failed. Is the server running?', 'error');
                    _setStatus('lobbyQueueStatus', 'Connection failed. Is the server running?', 'error');
                });

                NET.socket.on('room-full', function(data) {

                    if (data.host === NET.socket.id) {
                        NET.role = 'host';
                        NET.myPlayer = 1;
                        NET.opponentName = data.guestUsername || 'Player 2';
                    } else if (data.guest === NET.socket.id) {
                        NET.role = 'guest';
                        NET.myPlayer = 2;
                        NET.opponentName = data.hostUsername || 'Player 1';
                    } else {
                        // Socket id didn't match either slot — this happens if the
                        // socket reconnected (new id) between create/join and this
                        // event. Fall back to the role we already chose when we
                        // created vs joined the room (set in the create-room /
                        // join-room callbacks). Without this the client would keep a
                        // stale/null role and you can end up with two "guests" and no
                        // authoritative host (match never starts / desyncs).
                        if (NET.role === 'host') {
                            NET.myPlayer = 1;
                            NET.opponentName = data.guestUsername || 'Player 2';
                        } else if (NET.role === 'guest') {
                            NET.myPlayer = 2;
                            NET.opponentName = data.hostUsername || 'Player 1';
                        }
                        console.warn('[NET] room-full: socket id ' + NET.socket.id +
                            ' matched neither host(' + data.host + ') nor guest(' + data.guest +
                            ') — falling back to self-assigned role "' + NET.role + '".');
                    }

                    NET.connected = true;
                    NET.online = true;

                    if (data.rejoinToken) {
                        NET.rejoinToken = data.rejoinToken;
                        try {
                            sessionStorage.setItem('ew_rejoinToken', data.rejoinToken);
                            sessionStorage.setItem('ew_rejoinRoom', NET.roomCode);
                            sessionStorage.setItem('ew_rejoinRole', NET.role);
                        } catch(e) {}
                    }

                    if (data.ranked) {
                        NET.ranked = true;
                        NET.matchMapModeId = data.mapModeId || null;
                        NET.matchTeamSize = data.teamSize || 4;
                        NET.matchRankedMode = data.rankedMode || 'arena';
                    }

                    if (!data.ranked) {
                        if (NET.role === 'host') {
                            NET.friendlyConfig = _friendlyGetConfig();

                            _friendlyEmitConfig();
                        } else if (data.friendlyConfig) {
                            NET.friendlyConfig = data.friendlyConfig;
                        }
                    }

                    if (_queueTimerInterval) {
                        clearInterval(_queueTimerInterval);
                        _queueTimerInterval = null;
                    }
                    _inQueue = false;

                    document.getElementById('lobbyYouAre').textContent =
                        NET.myPlayer === 1 ?
                        'You are Player 1 (Blue Team) — you control the left party.' :
                        'You are Player 2 (Red Team) — you control the right party.';

                    var summaryEl = document.getElementById('lobbyConfigSummary');
                    if (summaryEl) {
                        var cfg = NET.friendlyConfig;
                        if (cfg && !data.ranked) {
                            var modeLbl = cfg.mode || 'arena';
                            var mpM = (typeof MULTIPLAYER_MODES !== 'undefined') ? MULTIPLAYER_MODES[modeLbl] : null;
                            if (mpM && mpM.label) modeLbl = mpM.label;
                            var mapLbl = cfg.mapId || '?';
                            var gmM = (typeof GAME_MODES !== 'undefined') ? GAME_MODES[cfg.mapId] : null;
                            if (gmM && gmM.label) mapLbl = gmM.label;
                            summaryEl.textContent = 'Host picked: ' + modeLbl + ' on ' + mapLbl + ', ' + (cfg.teamSize || 4) + 'v' + (cfg.teamSize || 4) + ', ' + (cfg.rounds || 15) + ' rounds';
                            summaryEl.style.display = 'block';
                        } else {
                            summaryEl.style.display = 'none';
                        }
                    }

                    _showPage('lobbyConnected');

                    setTimeout(function() {
                        if (window._enterOnlineMode) {
                            window._enterOnlineMode();
                        } else {
                            console.error('[NET] _enterOnlineMode is not defined!');
                        }
                    }, 1500);
                });

                NET.socket.on('match-found', function(data) {
                    console.log('[MM] Match found!', data);
                    NET.roomCode = data.roomCode;
                    NET.ranked = true;
                    NET.matchMapModeId = data.mapModeId || null;
                    NET.matchTeamSize = data.teamSize || 4;
                    NET.matchRankedMode = data.rankedMode || 'arena';
                    NET.opponentName = data.opponent || 'Opponent';
                    NET.opponentElo = data.opponentElo || 1200;

                    _setStatus('lobbyQueueStatus', 'Match found! vs ' + data.opponent + ' (ELO ' + data.opponentElo + ')', 'connected');
                });

                NET.socket.on('queue-status', function(data) {
                    if (!_inQueue) return;
                    var statusEl = document.getElementById('lobbyQueueStatus');
                    if (statusEl && data.queueSize > 1) {
                        statusEl.textContent = 'Searching… (' + data.queueSize + ' in queue)';
                    }
                });

                NET.socket.on('queue-left', function() {
                    _inQueue = false;
                });

                NET.socket.on('player-disconnected', function(data) {
                    if (!NET.online) return;

                    /* Opponent left AFTER the match was decided (e.g. via the
                       result screen's Main Menu button). Don't yank the local
                       player off their victory screen with a reload — just
                       note it and retire the rematch button. */
                    var st = window._gameState;
                    if (data.postMatch || (st && st.winner)) {
                        NET.connected = false;
                        ewToast('Your opponent left the match.', 4000);
                        var rmBtn = document.getElementById('nextMatchBtn');
                        if (rmBtn) {
                            rmBtn.disabled = true;
                            rmBtn.textContent = 'Opponent Left';
                        }
                        return;
                    }

                    if (!data.reconnectable) {
                        NET.connected = false;
                        ewToast('Your opponent (' + (data.role === 'host' ? 'Player 1' : 'Player 2') + ') disconnected.', 4000);
                        window.location.reload();
                        return;
                    }

                    NET.connected = false;
                    var oppLabel = data.role === 'host' ? 'Player 1' : 'Player 2';
                    _showReconnectOverlay(oppLabel, 90);
                });

                NET.socket.on('player-rejoined', function(data) {
                    NET.connected = true;
                    _hideReconnectOverlay();
                    ewToast((data.role === 'host' ? 'Player 1' : 'Player 2') + ' reconnected!', 3000);
                });

                NET.socket.on('match-forfeit', function(data) {
                    _hideReconnectOverlay();
                    /* Match already decided locally — a trailing forfeit from a
                       post-result disconnect must not reload us off the result
                       screen or flip the recorded winner. */
                    var stF = window._gameState;
                    if (stF && stF.winner) return;
                    var forfeitPlayer = data.forfeitPlayer;
                    var myP = NET.myPlayer;
                    if (forfeitPlayer === myP) {

                        ewToast('You were disconnected too long — match forfeited.', 5000);
                        window.location.reload();
                    } else {

                        ewToast('Your opponent failed to reconnect — you win by forfeit!', 5000);
                        if (typeof window.triggerOnlineForfeitWin === 'function') {
                            window.triggerOnlineForfeitWin(forfeitPlayer);
                        } else {

                            if (typeof addLog === 'function') addLog('Opponent forfeited (disconnect timeout). You win!');
                            setTimeout(function() { window.location.reload(); }, 5000);
                        }
                    }
                });

                NET.socket.on('elo-update', function(data) {
                    console.log('[NET] ELO update received:', data);
                    if (typeof data.myNewElo === 'number') {

                        window._serverEloDelta = data.myEloDelta;
                        window._serverEloAfter = data.myNewElo;

                        if (window.ProfileSystem) {
                            var idx = window.ProfileSystem.getActiveProfileIndex();
                            if (idx !== null) {
                                var p = window.ProfileSystem.loadProfile(idx);
                                if (p) {
                                    p.elo = data.myNewElo;
                                    if (data.myNewElo > (p.peakElo || 0)) p.peakElo = data.myNewElo;
                                    p.eloHistory.push({ elo: data.myNewElo, match: (p.career.matchesPlayed || 0), delta: data.myEloDelta });
                                    if (p.eloHistory.length > 100) p.eloHistory.shift();
                                    window.ProfileSystem.saveProfile(idx, p);
                                }
                            }
                        }

                        var eloTag = document.getElementById('mmEloTag');
                        if (eloTag) eloTag.textContent = 'ELO ' + data.myNewElo;
                    }
                });

                NET.socket.on('friendly-config', function(data) {
                    if (NET.role !== 'guest') return;
                    NET.friendlyConfig = data;

                    var hostStatus = document.getElementById('lobbyHostStatus');
                    if (hostStatus) {

                    }
                });

                NET.socket.on('game-action', function(data) {
                    if (NET.role === 'host' && window._executeRemoteAction) {
                        window._executeRemoteAction(data);
                    }
                });

                NET.socket.on('state-sync', function(data) {
                    if (NET.role === 'guest') _applyRemoteState(data);
                });

                NET.socket.on('party-config', function(data) {
                    if (NET.role === 'host' && window._applyRemotePartyConfig) {
                        window._applyRemotePartyConfig(data);
                    }
                });

                NET.socket.on('relay', function(data) { window._ewApplyRelay(data); });
            }

            /* Mirror-view check: is this client a pure viewer of a match run
               elsewhere? True for a real online guest, and during replay
               playback (the replay player is a synthetic guest fed from a
               recording instead of a socket). */
            function _ewMirrorView() {
                return NET.role === 'guest' || !!(window._EW_REPLAY && window._EW_REPLAY.playing);
            }

            /* Guest-side relay dispatcher, extracted from _connectSocket so the
               REPLAY player can feed recorded events through the exact same code
               path a live online guest uses. _ewMirrorView() is true for a real
               guest AND during replay playback (was: NET.role === 'guest'). */
            window._ewApplyRelay = function(data) {
                    var st = window._gameState;
                    /* state-checksum reports are consumed by the SERVER (it
                       compares them against the host's stamped hash) and are
                       never meant for the other client — but a pre-upgrade
                       server forwards every relay verbatim, so drop them
                       here instead of falling through the dispatcher. */
                    if (data.type === 'state-checksum') return;
                    if (data.type === 'intro-skip') {
                        /* Opponent voted to skip the opening cinematic. Latch the
                           vote (it may arrive before OUR cinematic mounts) and
                           poke the running intro so it can re-check the tally. */
                        window._ewIntroRemoteSkip = true;
                        if (typeof window._ewIntroSkipPoke === 'function') window._ewIntroSkipPoke();
                        return;
                    }
                    if (data.type === 'match-ready') {
                        /* Opponent's loading screen finished warming its assets.
                           Latch it (it can arrive before OUR loading screen
                           mounts) and poke the waiting screen — see battle.js
                           _lsAwaitRemoteReady (both-clients-ready start barrier). */
                        window._ewRemoteMatchReady = true;
                        if (typeof window._ewMatchReadyPoke === 'function') window._ewMatchReadyPoke();
                        return;
                    }
                    if (data.type === 'intro-done') {
                        /* Guest's opening cinematic finished. The HOST holds the
                           engine start (beginBlitzRound / shot clock) on this —
                           see battle.js _syncedAfterVSSplash. */
                        window._ewRemoteIntroDone = true;
                        if (typeof window._ewIntroDonePoke === 'function') window._ewIntroDonePoke();
                        return;
                    }
                    if (data.type === 'rematch-request') {
                        if (!NET._rematchState) NET._rematchState = {
                            1: false,
                            2: false
                        };
                        NET._rematchState[data.from] = true;

                        if (typeof window.addLog === 'function') {
                            window.addLog('Your opponent wants a rematch!');
                        }

                        var me = NET.myPlayer;
                        if (!NET._rematchState[me]) {
                            var btn = document.getElementById('nextMatchBtn');
                            if (btn) {
                                btn.textContent = 'Accept Rematch';
                                btn.disabled = false;
                            }
                        }

                        if (NET._rematchState[1] && NET._rematchState[2]) {
                            if (typeof window._startOnlineRematch === 'function') window._startOnlineRematch();
                        }
                    }

                    if (data.type === 'rematch-accept') {
                        if (typeof window.continueToNextMatch === 'function') window.continueToNextMatch();
                    }

                    if (data.type === 'guest-locked') {
                        var lock = NET._lockState;
                        if (lock) lock.guestPartyReceived = true;

                        /* For ranked, try auto-start now that guest is locked */
                        if (NET.ranked && typeof _tryAutoStartRanked === 'function') {
                            _tryAutoStartRanked();
                        }

                        if (typeof window.render === 'function') window.render();
                    }

                    if (data.type === 'host-locked') {
                        /* Guest learns the host has locked in */
                        var lockHL = NET._lockState;
                        if (lockHL) lockHL.hostLocked = true;
                        if (typeof window.addLog === 'function') window.addLog('Opponent has locked in their party.');
                        if (typeof window.render === 'function') window.render();
                    }

                    if (data.type === 'game-mode' && _ewMirrorView()) {
                        if (data.modeId && typeof window._rawApplyGameMode === 'function') {
                            window._rawApplyGameMode(data.modeId);
                            if (typeof window.repairPartyBuilderState === 'function') window.repairPartyBuilderState();
                        }

                        var s1 = document.getElementById('gameModeSelectSetup');
                        var s2 = document.getElementById('gameModeSelect');
                        if (s1) s1.value = data.modeId;
                        if (s2) s2.value = data.modeId;

                        var lock2 = NET._lockState;
                        if (lock2) {
                            lock2.guest = false;
                            lock2.guestPartyReceived = false;
                        }
                        if (st) {
                            st.teamLockedIn = false;
                            if (typeof window.addLog === 'function') window.addLog('Host changed the map size. Please re-lock your team.');
                        }
                        if (typeof window.render === 'function') window.render();
                    }

                    if (data.type === 'multiplayer-mode' && _ewMirrorView()) {
                        if (data.modeId) {
                            activeMultiplayerMode = data.modeId;
                        }
                        if (typeof window.addLog === 'function') window.addLog('Host selected mode: ' + (data.modeId || '?'));
                        if (typeof window.render === 'function') window.render();
                    }

                    if (data.type === 'camera-events' && _ewMirrorView()) {
                        var events = data.events || [];
                        for (var ci = 0; ci < events.length; ci++) {
                            var camEvt = events[ci];
                            if (camEvt.type === 'offensive') {

                                var src = typeof window.unitFromId === 'function' ? window.unitFromId(camEvt.srcId) : null;
                                var tgt = typeof window.unitFromId === 'function' ? window.unitFromId(camEvt.tgtId) : null;

                                /* Fallback actors carry the REAL owning player
                                   (relayed) — hardcoding player:2 made the fog
                                   gate treat an unresolved HOST attacker as one
                                   of the guest's own (always-visible) units. */
                                if (!src) src = {
                                    x: camEvt.srcX,
                                    y: camEvt.srcY,
                                    player: camEvt.srcPlayer || 1,
                                    id: camEvt.srcId
                                };
                                if (!tgt) tgt = {
                                    x: camEvt.tgtX,
                                    y: camEvt.tgtY,
                                    player: camEvt.tgtPlayer || null,
                                    id: camEvt.tgtId
                                };

                                var camOpts = {};
                                if (camEvt.attackName) camOpts.attackName = camEvt.attackName;
                                if (camEvt.sourceHold) camOpts.sourceHold = camEvt.sourceHold;
                                if (camEvt.targetHold) camOpts.targetHold = camEvt.targetHold;
                                if (camEvt.shotKind) camOpts.shotKind = camEvt.shotKind;
                                if (camEvt.spellId) camOpts.spellId = camEvt.spellId;
                                if (camEvt.holdAfterLaunchMs != null) camOpts.holdAfterLaunchMs = camEvt.holdAfterLaunchMs;
                                if (camEvt.noActionCam) camOpts.noActionCam = true;
                                if (camEvt._noCinematic) camOpts._noCinematic = true;
                                if (camEvt.frameTiles && camEvt.frameTiles.length) camOpts.frameTiles = camEvt.frameTiles;
                                if (camEvt.extraTargetIds && camEvt.extraTargetIds.length
                                    && typeof window.unitFromId === 'function') {
                                    var _ets = [];
                                    for (var ei = 0; ei < camEvt.extraTargetIds.length; ei++) {
                                        var _eu = window.unitFromId(camEvt.extraTargetIds[ei]);
                                        if (_eu) _ets.push(_eu);
                                    }
                                    if (_ets.length) camOpts.extraTargets = _ets;
                                }
                                if (typeof window.playOffensiveActionCamera === 'function') {
                                    window.playOffensiveActionCamera(src, tgt, camOpts);
                                }
                            }
                        }
                    }

                    /* Standalone cinematic beat (freeze-frame / grade /
                       slow-mo / insert card) replayed locally by the guest. */
                    if (data.type === 'cine-fx' && _ewMirrorView()) {
                        if (window.CineFX && typeof window.CineFX.play === 'function') {
                            window.CineFX.play(data.fx, data.payload || {});
                        }
                    }

                    if (data.type === 'announcement' && _ewMirrorView()) {
                        if (typeof window.showAnnouncementBanner === 'function') {
                            window.showAnnouncementBanner(data.title, data.subtitle, data.kind, function() {});
                        }
                    }

                    if (data.type === 'turn-banner' && _ewMirrorView()) {
                        if (typeof window.showTurnBanner === 'function') {
                            var blitzUnit = null;
                            if (data.blitzUnitId && st && st.units) {
                                blitzUnit = st.units.find(function(u) { return u.id === data.blitzUnitId; }) || null;
                            }
                            window.showTurnBanner(data.player, data.roundNum, data.isNewRound, blitzUnit);
                        }
                    }

                    if (data.type === 'round-banner' && _ewMirrorView()) {
                        if (typeof window.showRoundBanner === 'function') {
                            window.showRoundBanner(data.roundNum, function() {});
                        }
                    }

                    if (data.type === 'player-turn-announce' && _ewMirrorView()) {
                        if (typeof window.showPlayerTurnAnnounce === 'function' && data.player) {
                            var _ptaUnit = null;
                            if (data.unitId && st && st.units) {
                                _ptaUnit = st.units.find(function(u) { return u.id === data.unitId; }) || null;
                            }
                            /* The announce only needs .player to pick the label
                               ("Your Turn" vs "Opponent's Turn") and color. */
                            window.showPlayerTurnAnnounce(_ptaUnit || { player: data.player });
                        }
                    }

                    if (data.type === 'stealth-reveal-banner' && _ewMirrorView()) {
                        /* Re-run the viewer-relative banner on the mirror. The
                           wrapped global only re-emits on the host, so this
                           can't echo. Prefer the live unit (right name after
                           renames); fall back to the relayed name/player. */
                        if (typeof window.showStealthRevealBanner === 'function' && data.player) {
                            var _srbUnit = (data.unitId && st && st.units)
                                ? st.units.find(function(u) { return u.id === data.unitId; }) : null;
                            window.showStealthRevealBanner(_srbUnit
                                || { player: data.player, name: data.name || 'A unit' });
                        }
                    }

                    if (data.type === 'floating-text' && _ewMirrorView()) {
                        // Fog gate: don't render combat numbers happening inside
                        // the fog — they'd reveal hidden enemy positions/fights.
                        var _ftVisible = true;
                        if (st && st.fogOfWar && typeof window._isTileVisibleToViewer === 'function') {
                            _ftVisible = window._isTileVisibleToViewer(data.x, data.y);
                        }
                        if (_ftVisible && typeof window.showFloatingTextAtTile === 'function') {
                            window.showFloatingTextAtTile(data.x, data.y, data.text, data.kind);
                        }
                    }

                    if (data.type === 'unit-fall-follow' && _ewMirrorView()) {
                        /* Camera dives with a falling/grounded unit. The
                           function itself fog-gates on the GUEST's viewer
                           (_shouldCameraFollowUnit), so a hidden enemy's
                           crash never pans the guest's camera. */
                        var _fallU = st && st.units
                            ? st.units.find(function(u) { return u.id === data.unitId; }) : null;
                        if (_fallU && typeof window.followUnitFall === 'function') {
                            window.followUnitFall(_fallU, data.duration ? { duration: data.duration } : {});
                        }
                    }

                    if (data.type === 'cam-action-settle' && _ewMirrorView()) {
                        /* End the relayed cinematic shot on the mirror and ease
                           back to the actor at the resting framing. The helper
                           fog-gates the re-centre itself (hidden enemy actor →
                           angle/zoom settle in place, no pan onto its tile). */
                        if (typeof window._armActionCamSettle === 'function') {
                            window._armActionCamSettle(
                                data.unitId != null ? data.unitId : null,
                                data.x != null ? data.x : undefined,
                                data.y != null ? data.y : undefined,
                                data.delay || 0, true);
                        }
                    }

                    if (data.type === 'dash-cam-follow' && _ewMirrorView()) {
                        /* Dash/charge follow camera: glide with the dasher from
                           launch to landing. Fog gate on the GUEST's own fog
                           set — both endpoints must be screen-visible, or the
                           pan would trace a hidden unit's dash through the fog. */
                        var _dashVisible = true;
                        if (st && st.fogOfWar && typeof window._isTileVisibleToViewer === 'function') {
                            _dashVisible = window._isTileVisibleToViewer(data.fromX, data.fromY)
                                && window._isTileVisibleToViewer(data.toX, data.toY);
                        }
                        /* Concealment (Invisible / smoke) applies with fog OFF
                           too — never chase a cloaked enemy dasher. */
                        var _dashCaster = (data.casterId != null && st && st.units)
                            ? st.units.find(function(u) { return u.id === data.casterId; }) : null;
                        if (_dashVisible && _dashCaster && _dashCaster.player !== NET.myPlayer
                            && typeof window.isUnitConcealedFrom === 'function'
                            && window.isUnitConcealedFrom(_dashCaster, NET.myPlayer)) {
                            _dashVisible = false;
                        }
                        if (_dashVisible && typeof window.animateDashActionCamera === 'function') {
                            window.animateDashActionCamera(
                                { x: data.fromX, y: data.fromY },
                                { x: data.toX, y: data.toY },
                                { duration: data.duration || 0,
                                  casterId: data.casterId != null ? data.casterId : null,
                                  attackName: data.attackName || '',
                                  _fogAllowed: true }
                            );
                        }
                    }

                    if (data.type === 'walk-anim' && _ewMirrorView()) {
                        var walkUnit = st && st.units ? st.units.find(function(u) { return u.id === data.unitId; }) : null;
                        if (walkUnit && data.path && data.path.length > 0) {
                            var _isEnemyWalk = walkUnit.player !== NET.myPlayer;
                            var _fogCheck = (st.fogOfWar && typeof window._isTileVisibleToViewer === 'function')
                                ? window._isTileVisibleToViewer : null;

                            // For an ENEMY walk under fog, trim the animated path
                            // and the camera pan to the VISIBLE portion only —
                            // never trail a hidden unit (or its destination)
                            // through the fog. Friendly walks show in full.
                            var _walkFrom = { x: data.fromX, y: data.fromY, z: data.fromZ ?? 0 };
                            var _walkPath = data.path;
                            var _showWalk = true;
                            if (_isEnemyWalk && _fogCheck) {
                                var _full = [_walkFrom].concat(data.path);
                                var _lastVis = -1, _firstVis = -1;
                                for (var _wi = 0; _wi < _full.length; _wi++) {
                                    if (_fogCheck(_full[_wi].x, _full[_wi].y)) {
                                        if (_firstVis < 0) _firstVis = _wi;
                                        _lastVis = _wi;
                                    }
                                }
                                if (_lastVis < 0) {
                                    _showWalk = false;           // fully hidden walk
                                } else if (_firstVis === 0) {
                                    // Visible from the start: animate up to the
                                    // last visible step, then let the unit vanish
                                    // into the fog (the sync places it silently).
                                    _walkPath = _full.slice(1, _lastVis + 1);
                                } else {
                                    // Emerges INTO vision mid-path: start the
                                    // visible animation at the first seen tile.
                                    _walkFrom = _full[_firstVis];
                                    _walkPath = _full.slice(_firstVis + 1, _lastVis + 1);
                                }
                                if (_walkPath.length === 0) _showWalk = false;
                            }
                            if (_showWalk) {
                                var _threeOk = false;
                                if (window.ThreeAnim && window.ThreeAnim.isActive()) {
                                    var _savedX = walkUnit.x, _savedY = walkUnit.y, _savedZ = walkUnit.z;
                                    walkUnit.x = _walkFrom.x;
                                    walkUnit.y = _walkFrom.y;
                                    walkUnit.z = _walkFrom.z ?? 0;
                                    window.ThreeAnim.walkPath(walkUnit, _walkPath);
                                    walkUnit.x = _savedX;
                                    walkUnit.y = _savedY;
                                    walkUnit.z = _savedZ;
                                    _threeOk = true;
                                }
                                if (!_threeOk && typeof window.animateWalkPath === 'function') {
                                    var _savedX2 = walkUnit.x, _savedY2 = walkUnit.y, _savedZ2 = walkUnit.z;
                                    walkUnit.x = _walkFrom.x;
                                    walkUnit.y = _walkFrom.y;
                                    if (_walkFrom.z !== undefined) walkUnit.z = _walkFrom.z;
                                    window.animateWalkPath(walkUnit, _walkPath);
                                    walkUnit.x = _savedX2;
                                    walkUnit.y = _savedY2;
                                    walkUnit.z = _savedZ2;
                                }

                                var _walkDest = _walkPath[_walkPath.length - 1];
                                if (_walkDest && typeof focusBoardCameraOnTiles === 'function') {
                                    var _wz = typeof getUserZoomScale === 'function' ? getUserZoomScale() : 1;
                                    var _dz2 = typeof getDefaultZoom === 'function' ? getDefaultZoom() : 1;
                                    focusBoardCameraOnTiles([{ x: _walkDest.x, y: _walkDest.y }], {
                                        zoom: (typeof isUserZoomEngaged === 'function' && isUserZoomEngaged()) ? _wz : _dz2,
                                        holdMs: 99999, persist: true, transitionMs: 500, _fogAllowed: true
                                    });
                                }
                            }
                        }
                    }

                    if (data.type === 'jump-anim' && _ewMirrorView()) {
                        var jumpUnit = st && st.units ? st.units.find(function(u) { return u.id === data.unitId; }) : null;
                        if (jumpUnit) {
                            var _showJump = true;
                            var _jumpCamX = data.toX, _jumpCamY = data.toY;
                            if (st.fogOfWar && jumpUnit.player !== NET.myPlayer) {
                                var _jfog = typeof window._isTileVisibleToViewer === 'function' ? window._isTileVisibleToViewer : null;
                                if (_jfog) {
                                    var _jFromVis = _jfog(data.fromX, data.fromY);
                                    var _jToVis = _jfog(data.toX, data.toY);
                                    _showJump = _jFromVis || _jToVis;
                                    // Camera may only travel to a VISIBLE tile —
                                    // a hidden landing spot must stay unknown.
                                    if (!_jToVis) { _jumpCamX = data.fromX; _jumpCamY = data.fromY; }
                                }
                            }
                            if (_showJump) {

                                var _jumpThreeOk = false;
                                if (window.ThreeAnim && window.ThreeAnim.isActive()) {
                                    window.ThreeAnim.jumpArc(jumpUnit, data.fromX, data.fromY, data.toX, data.toY,
                                        data.fromZ || 0, data.toZ || 0, data.durationMs || 480);
                                    _jumpThreeOk = true;
                                }

                                if (!_jumpThreeOk && typeof window.animateJumpArc === 'function') {
                                    window.animateJumpArc(jumpUnit, data.fromX, data.fromY, data.toX, data.toY,
                                        data.fromZ || 0, data.toZ || 0, data.durationMs || 480);
                                }

                                if (typeof focusBoardCameraOnTiles === 'function') {
                                    var _jz = typeof getUserZoomScale === 'function' ? getUserZoomScale() : 1;
                                    var _djz = typeof getDefaultZoom === 'function' ? getDefaultZoom() : 1;
                                    focusBoardCameraOnTiles([{ x: _jumpCamX, y: _jumpCamY }], {
                                        zoom: (typeof isUserZoomEngaged === 'function' && isUserZoomEngaged()) ? _jz : _djz,
                                        holdMs: 99999, persist: true, transitionMs: 400, _fogAllowed: true
                                    });
                                }
                            }
                        }
                    }

                    /* 🎱 Knockback / shove / drag replay (2026-07-26): the
                       guest plays the same waypoint slide the host resolved —
                       bumps, rebounds and all — instead of a state-sync
                       teleport. Same save/restore dance as walk-anim: the
                       sync already placed the unit at its landing tile, so
                       rewind it to the from-tile for the tween's benefit. */
                    if (data.type === 'displace-anim' && _ewMirrorView()) {
                        var dispUnit = st && st.units ? st.units.find(function(u) { return u.id === data.unitId; }) : null;
                        if (dispUnit && data.steps && data.steps.length > 0) {
                            var _showDisp = true;
                            if (st.fogOfWar && dispUnit.player !== NET.myPlayer
                                && typeof window._isTileVisibleToViewer === 'function') {
                                // Enemy slide under fog: show it if ANY point of
                                // the ride is visible (short paths — no trimming).
                                _showDisp = window._isTileVisibleToViewer(data.fromX, data.fromY);
                                for (var _dvi = 0; _dvi < data.steps.length && !_showDisp; _dvi++) {
                                    _showDisp = window._isTileVisibleToViewer(
                                        Math.round(data.steps[_dvi].x), Math.round(data.steps[_dvi].y));
                                }
                            }
                            if (_showDisp && typeof window.animateDisplacementPath === 'function') {
                                var _savedDX = dispUnit.x, _savedDY = dispUnit.y, _savedDZ = dispUnit.z;
                                dispUnit.x = data.fromX;
                                dispUnit.y = data.fromY;
                                window.animateDisplacementPath(dispUnit, data.fromX, data.fromY,
                                    data.steps, data.perStepMs || 120, { delayMs: data.delayMs || 0 });
                                dispUnit.x = _savedDX;
                                dispUnit.y = _savedDY;
                                dispUnit.z = _savedDZ;
                            }
                        }
                    }

                    if (data.type === 'collision-fx' && _ewMirrorView()) {
                        var _cfxVisible = true;
                        if (st.fogOfWar && typeof window._isTileVisibleToViewer === 'function') {
                            _cfxVisible = window._isTileVisibleToViewer(data.x, data.y);
                        }
                        if (_cfxVisible && typeof window.playCollisionImpactFx === 'function') {
                            // sfx + floating text arrive on their own relays —
                            // replay only the shake + impact spark here.
                            window.playCollisionImpactFx(data.x, data.y, data.kind, {
                                delayMs: data.delayMs || 0, muteSfx: true, muteText: true, remote: true
                            });
                        }
                    }

                    if (data.type === 'strike-leap' && _ewMirrorView()) {
                        var leapUnit = st && st.units ? st.units.find(function(u) { return u.id === data.unitId; }) : null;
                        if (leapUnit) {
                            var _showLeap = true;
                            if (st.fogOfWar && leapUnit.player !== NET.myPlayer) {
                                var _lfog = typeof window._isTileVisibleToViewer === 'function' ? window._isTileVisibleToViewer : null;
                                _showLeap = _lfog ? (_lfog(leapUnit.x, leapUnit.y) || _lfog(data.tx, data.ty)) : true;
                            }
                            if (_showLeap) {

                                if (window.ThreeAnim && window.ThreeAnim.isActive()) {
                                    window.ThreeAnim.strikeLeap(leapUnit, data.tx, data.ty);
                                } else if (typeof window.animateStrikeLeap === 'function') {
                                    window.animateStrikeLeap(leapUnit, data.tx, data.ty);
                                }
                            }
                        }
                    }

                    if (data.type === 'sfx' && _ewMirrorView()) {
                        if (data.key && typeof window.playSfx === 'function') {
                            window.playSfx(data.key);
                        }
                    }

                    /* Sky-throw grab: replay the lift-and-hold (+ saucer for the
                       grey beam) on the guest. Fog gate on the VICTIM's tile —
                       a hidden enemy's grab must not telegraph its position. */
                    if (data.type === 'sky-grab-fx' && _ewMirrorView()) {
                        var _sgT = st && st.units ? st.units.find(function(u) { return u.id === data.targetId; }) : null;
                        var _sgVis = _sgT && (!st.fogOfWar || typeof window._isTileVisibleToViewer !== 'function'
                            || window._isTileVisibleToViewer(_sgT.x, _sgT.y));
                        if (_sgT && _sgVis && typeof window.playSkyGrabFx === 'function') {
                            var _sgC = st.units.find(function(u) { return u.id === data.casterId; }) || null;
                            window.playSkyGrabFx(_sgC, _sgT, {
                                id: data.spellId, spellType: data.spellType, carryHeight: data.carryHeight
                            });
                        }
                    }

                    /* Sky-throw fling / beam-carry: replay the flight so the
                       guest sees the body travel instead of a sync teleport.
                       Cosmetic impact only — positions/damage arrive via
                       state-sync. Visible if either endpoint is in view. */
                    if (data.type === 'sky-throw-fx' && _ewMirrorView()) {
                        var _stT = st && st.units ? st.units.find(function(u) { return u.id === data.targetId; }) : null;
                        var _stVis = !st || !st.fogOfWar || typeof window._isTileVisibleToViewer !== 'function'
                            || window._isTileVisibleToViewer(data.fromX, data.fromY)
                            || window._isTileVisibleToViewer(data.toX, data.toY);
                        if (_stT && _stVis && typeof window.playSkyThrowFx === 'function') {
                            window.playSkyThrowFx(_stT, data.fromX, data.fromY, data.toX, data.toY, {
                                id: data.spellId, spellType: data.spellType, carryHeight: data.carryHeight
                            }, {
                                onImpact: function() {
                                    if (typeof window.shakeBoard === 'function') window.shakeBoard('normal');
                                }
                            });
                        }
                    }

                    /* Storm lightning: replay the thunderstorm bolt on the
                       victim's tile — fog-gated so a strike inside the fog
                       doesn't pinpoint a hidden unit. */
                    if (data.type === 'storm-lightning-fx' && _ewMirrorView()) {
                        var _slVis = !st || !st.fogOfWar || typeof window._isTileVisibleToViewer !== 'function'
                            || window._isTileVisibleToViewer(data.x, data.y);
                        if (_slVis && typeof window.playStormLightningFx === 'function') {
                            window.playStormLightningFx(data.x, data.y);
                        }
                    }

                    /* Vortex fling: replay the tornado/hurricane lift-spin-hurl
                       so the guest sees the body fly instead of a sync snap.
                       Cosmetic only — damage/position arrive via state-sync.
                       Visible if either endpoint is in view. */
                    if (data.type === 'vortex-fling-fx' && _ewMirrorView()) {
                        var _vfT = st && st.units ? st.units.find(function(u) { return u.id === data.targetId; }) : null;
                        var _vfVis = !st || !st.fogOfWar || typeof window._isTileVisibleToViewer !== 'function'
                            || window._isTileVisibleToViewer(data.fromX, data.fromY)
                            || window._isTileVisibleToViewer(data.toX, data.toY);
                        if (_vfT && _vfVis && typeof window.playVortexFlingFx === 'function') {
                            window.playVortexFlingFx(_vfT, data.fromX, data.fromY, data.toX, data.toY, data.kind, {});
                        }
                    }

                    if (data.type === 'vfx3d' && _ewMirrorView()) {
                        // Fog gate: skip spell VFX whose every anchor point is
                        // hidden in the fog (a fireball flashing inside the fog
                        // pinpoints the hidden caster/fight).
                        var _vfxVisible = true;
                        if (st && st.fogOfWar && typeof window._isTileVisibleToViewer === 'function') {
                            var _vp = data.params || {};
                            var _pts = [];
                            if (_vp.tx !== undefined) _pts.push([_vp.tx, _vp.ty]);
                            if (_vp.fromX !== undefined) _pts.push([_vp.fromX, _vp.fromY]);
                            if (_vp.toX !== undefined) _pts.push([_vp.toX, _vp.toY]);
                            if (_vp.casterX !== undefined) _pts.push([_vp.casterX, _vp.casterY]);
                            if (_vp.hitTiles) for (var _hi = 0; _hi < _vp.hitTiles.length; _hi++) _pts.push([_vp.hitTiles[_hi].x, _vp.hitTiles[_hi].y]);
                            if (_pts.length > 0) {
                                _vfxVisible = false;
                                for (var _pi = 0; _pi < _pts.length; _pi++) {
                                    if (window._isTileVisibleToViewer(_pts[_pi][0], _pts[_pi][1])) { _vfxVisible = true; break; }
                                }
                            }
                        }
                        if (_vfxVisible && typeof VFX3D !== 'undefined' && typeof VFX3D.fire === 'function') {
                            try {
                                VFX3D.fire(data.phase, data.spellId, data.params || {});
                            } catch (e) {  }
                        }
                    }

                    /* Cosmetic VFX siblings (heals/buffs/dashes/projectiles/
                       beams/aoe…) — fog-gate on the fn's anchor tiles, then
                       replay. The guest's own wrapper re-runs but its emit is
                       host-gated, so nothing loops back. */
                    if (data.type === 'vfx3d-x' && _ewMirrorView()) {
                        var _xArgs = data.args || [];
                        var _xAnch = (window._VFXX_ANCHORS || {})[data.fn];
                        var _xVis = true;
                        if (st && st.fogOfWar && _xAnch && typeof window._isTileVisibleToViewer === 'function') {
                            _xVis = false;
                            for (var _xi = 0; _xi < _xAnch.length; _xi++) {
                                var _ax = _xArgs[_xAnch[_xi][0]], _ay = _xArgs[_xAnch[_xi][1]];
                                if (typeof _ax === 'number' && typeof _ay === 'number'
                                    && window._isTileVisibleToViewer(_ax, _ay)) { _xVis = true; break; }
                            }
                        }
                        if (_xVis && typeof VFX3D !== 'undefined'
                            && typeof VFX3D[data.fn] === 'function'
                            && (window._VFXX_ANCHORS || {})[data.fn]) {
                            try { VFX3D[data.fn].apply(VFX3D, _xArgs); } catch (e) {}
                        }
                    }

                    /* Support "gift" camera (heal/buff on an ally, deploys,
                       zones): replay the two-beat shot. Fog gating runs
                       inside the shot against THIS viewer's vision. */
                    if (data.type === 'support-cine' && _ewMirrorView()) {
                        try {
                            var _scU = (typeof window.unitFromId === 'function') ? window.unitFromId(data.casterId) : null;
                            if (!_scU) _scU = { x: data.cx, y: data.cy, player: data.casterPlayer || 1, id: data.casterId };
                            var _scT = (data.tgtId != null && typeof window.unitFromId === 'function')
                                ? window.unitFromId(data.tgtId) : null;
                            if (!_scT) _scT = { x: data.tx, y: data.ty };
                            var _scOpts = {};
                            if (data.spellName) _scOpts.spellName = data.spellName;
                            if (data.spellId) _scOpts.spellId = data.spellId;
                            if (typeof window._playSupportCineShot === 'function') {
                                window._playSupportCineShot(_scU, _scT, _scOpts);
                            }
                        } catch (e) {}
                    }

                    /* Self-cast hero shot / focus pan for every other
                       non-offensive cast. Same viewer-side fog gating. */
                    if (data.type === 'spell-focus-cam' && _ewMirrorView()) {
                        try {
                            var _sfU = (typeof window.unitFromId === 'function') ? window.unitFromId(data.casterId) : null;
                            if (!_sfU) _sfU = { x: data.cx, y: data.cy, player: data.casterPlayer || 1, id: data.casterId };
                            var _sfOpts = {};
                            if (data.spellName) _sfOpts.spellName = data.spellName;
                            if (data.spellId) _sfOpts.spellId = data.spellId;
                            if (typeof window._spellFocusCamera === 'function') {
                                window._spellFocusCamera(_sfU, data.tx, data.ty, _sfOpts);
                            }
                        } catch (e) {}
                    }

                    /* Entropy Strike: replay the FULL team-attack cinematic
                       (banner, caster cut-in panels, sigils, per-enemy
                       strikes, whiteout) on the guest. Cosmetic only — no
                       applyHit, damage arrives via state-sync; sfx muted
                       because the host's 'sfx' relay already carries them.
                       Fog gating happens inside _ewsPlayCinematic per
                       anchor, against THIS viewer's visible-tile set. */
                    if (data.type === 'entropy-cine' && _ewMirrorView()) {
                        try {
                            var _ecFind = function(id) {
                                return (st && st.units) ? st.units.find(function(u) { return u.id === id; }) : null;
                            };
                            var _ecUnit = _ecFind(data.unitId);
                            var _ecTargets = (data.targetIds || []).map(_ecFind).filter(Boolean);
                            var _ecAllies = (data.allyIds || []).map(_ecFind).filter(Boolean);
                            if (_ecUnit && !st.winner && typeof window._ewsPlayCinematic === 'function') {
                                window._ewsPlayCinematic(_ecUnit, _ecTargets, _ecAllies, {
                                    applyHit: null, mute: true, remote: true
                                });
                            }
                        } catch (e) { /* cosmetic replay must never break the sync */ }
                    }

                    /* Combo dual-tech cinematic: replay the manga cut-in
                       page + converge streams + impact signature with the
                       host's beat timings. The combo def is looked up from
                       the guest's own registry (same data.js); panels and
                       every 3D anchor are fog-gated viewer-side inside the
                       presentation. Damage/floaters arrive via sync. */
                    if (data.type === 'combo-cine' && _ewMirrorView()) {
                        try {
                            var _cchFind = function(id) {
                                return (st && st.units) ? st.units.find(function(u) { return u.id === id; }) : null;
                            };
                            var _cchI = _cchFind(data.initiatorId);
                            var _cchP = _cchFind(data.partnerId);
                            var _cchT = _cchFind(data.targetId);
                            var _cchLookup = (typeof getComboForUnits === 'function') ? getComboForUnits
                                : ((window.GAME && window.GAME.getComboForUnits) || window.getComboForUnits || null);
                            var _cchCombo = (_cchI && _cchP && _cchLookup) ? _cchLookup(_cchI, _cchP) : null;
                            if (_cchI && _cchP && _cchT && _cchCombo && !st.winner
                                && typeof window._comboPlayPresentation === 'function') {
                                var _cchTim = data.T || {};
                                window._comboPlayPresentation(_cchI, _cchP, _cchT, _cchCombo, {
                                    ccOK: !!_cchTim.ccOK,
                                    sourceHold: _cchTim.sourceHold,
                                    launchAt: _cchTim.launchAt, hitAt: _cchTim.hitAt,
                                    hitGap: _cchTim.hitGap, projMs: _cchTim.projMs,
                                    hits: _cchTim.hits || 1,
                                    mute: true, remote: true
                                });
                            }
                        } catch (e) { /* cosmetic replay must never break the sync */ }
                    }

                    if (data.type === 'pickup-dialog' && _ewMirrorView()) {
                        if (st) {
                            st.uiDialog = {
                                type: 'pickupDecision',
                                unitId: data.unitId,
                                event: data.event,
                                kindLabel: data.kindLabel,
                                badgeLabel: data.badgeLabel,
                                onConfirm: function() {
                                    st.uiDialog = null;
                                    if (typeof window.render === 'function') window.render();
                                    NET.socket.emit('relay', {
                                        type: 'pickup-response',
                                        decision: 'confirm'
                                    });
                                },
                                onCancel: function() {
                                    st.uiDialog = null;
                                    if (typeof window.render === 'function') window.render();
                                    NET.socket.emit('relay', {
                                        type: 'pickup-response',
                                        decision: 'cancel'
                                    });
                                }
                            };
                            if (typeof window.render === 'function') window.render();
                        }
                    }

                    if (data.type === 'pickup-response' && NET.role === 'host') {
                        if (st && st._pendingRemotePickup) {
                            var pending = st._pendingRemotePickup;
                            st._pendingRemotePickup = null;
                            if (data.decision === 'confirm' && typeof pending.onPickUp === 'function') {
                                pending.onPickUp();
                            } else if (typeof pending.onLeave === 'function') {
                                pending.onLeave();
                            }
                            if (typeof window._broadcastState === 'function') window._broadcastState();
                        }
                    }
            };

            /* Exposed for the MATCH REPLAY recorder/player (bottom of file) —
               they live outside this closure but must share the exact same
               serialize/deserialize logic the online mirror uses. */
            window._ewSerializeState = function() { return _serializeState(); };
            window._ewDeserializeInto = function(target, s) { return _deserializeInto(target, s); };

            /* ── STATE CHECKSUM (desync / anomaly detection) ────────────────
               Cheap FNV-1a hash over the gameplay-relevant slice of state:
               every unit's identity/position/resources plus round /
               activePlayer / matchKills. The HOST stamps it on each
               state-sync (_csum + _csumSeq, added AFTER the dedup check so
               the ever-changing seq can't defeat it); the GUEST recomputes
               it from its own state AFTER applying that sync and reports it
               back via relay {type:'state-checksum'}. The SERVER compares
               the pair and logs mismatches to console + the replay file
               (LOG-ONLY — no forfeits until the false-positive rate is
               known; see server.js relay handler). Per-viewer keys (UI,
               fog, camera) are deliberately excluded — they differ between
               host and guest by design. Every field read here rides
               state-sync verbatim (units wholesale, round/activePlayer/
               matchKills scalars), so host and guest hash identical values. */
            function _ewStateChecksum(st) {
                if (!st || !st.units) return null;
                var parts = [];
                for (var i = 0; i < st.units.length; i++) {
                    var u = st.units[i];
                    if (!u) continue;
                    parts.push(u.id, u.player, u.x, u.y, u.z, u.hp, u.mp, u.ap, u.dead ? 1 : 0);
                }
                parts.push('R', st.round, 'A', st.activePlayer);
                var mk = st.matchKills;
                if (mk) parts.push('K', mk[1] || 0, mk[2] || 0);
                var str = parts.join('|');
                var h = 0x811c9dc5;
                for (var j = 0; j < str.length; j++) {
                    h ^= str.charCodeAt(j);
                    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
                }
                return ('0000000' + h.toString(16)).slice(-8);
            }
            window._ewStateChecksum = _ewStateChecksum;

            function _serializeState() {
                var st = window._gameState;
                if (!st) return null;
                var s = {};
                var skip = {
                    _aiSafetyTimer: 1,
                    currentMusic: 1,
                    _remoteAction: 1,

                    /* volume sliders are per-viewer — the host's mix must
                       never stomp the guest's */
                    musicVolume: 1,
                    sfxVolume: 1,
                    ambienceVolume: 1,

                    selectedUnitId: 1,
                    focusedUnitId: 1,
                    hoverUnitId: 1,
                    actionMode: 1,
                    actionMenuView: 1,
                    selectedTool: 1,
                    pendingTarget: 1,
                    comboPartner: 1,
                    _buildTool: 1,
                    /* quick-menu anchors (enemy/ally card, tile card) are
                       per-viewer UI — syncing them let the host's state stomp
                       the guest's open quick menu on every heartbeat */
                    _enemyActionTargetId: 1,
                    _tileActionTarget: 1,
                    _skyThrowDestKey: 1,

                    aiPlayer: 1,
                    aiThinking: 1,

                    controllers: 1,
                    _preDevSimControllers: 1,

                    devAutoSim: 1,
                    devSimTimer: 1,
                    devSimSpeed: 1,
                    _devSimShowAnims: 1,
                    _preSimVisualPrefs: 1,

                    _fogAnchorUnitId: 1,
                    _fogRevealTiles: 1,

                    /* Mystery Dungeon interior flood-fill cache (a Set, and
                       recomputed per floor by _mdInsideTiles) — never synced. */
                    _mdInside: 1,
                    _mdInsideFloor: 1,
                    /* Mystery Dungeon lockstep clock (battle.js) — the dungeon
                       is VS-CPU/local only, but these are pure local turn-loop
                       bookkeeping and must never ride a snapshot. */
                    _mdTickBusy: 1,
                    _mdTickTs: 1,
                    _mdTravel: 1,
                    _mdInnerMove: 1,
                    _mdEorPending: 1,

                    showPlayer2Builder: 1,

                    uiDialog: 1,

                    _pendingRemotePickup: 1,
                    _guestResultShown: 1,
                    _guestBoardBuilt: 1,

                    _actionExecuting: 1,
                    /* Engine-side action bookkeeping — meaningless on the
                       guest (only the host drains the repeat queue) and
                       actively harmful when synced: the host's setTimeout
                       HANDLE stomped the guest's own watchdog id, so the
                       guest's clearTimeout released the wrong timer. */
                    _repeatQueue: 1,
                    _actionExecutingWatchdog: 1,

                    _walkAnimActive: 1,
                    _takeoffRiseFromZ: 1,

                    battleDialogueTimer: 1,
                    battleDialogueQueue: 1,

                    dioramaYawDeg: 1,
                    dioramaTiltDeg: 1,
                    cameraDisabled: 1,
                    _fullMapOverview: 1,
                    _fogCameraAllowed: 1
                };
                for (var key in st) {
                    if (!st.hasOwnProperty(key) || skip[key]) continue;
                    var val = st[key];
                    if (val instanceof Set) {
                        s[key] = {
                            _t: 'S',
                            v: Array.from(val)
                        };
                    } else if (val instanceof Map) {
                        /* Maps MUST be boxed like Sets: their entries are not
                           enumerable own properties, so the generic object
                           branch below flattens one to `{}` — and a bare {}
                           landing on e.g. state._monumentTiles makes the 3D
                           terrain builder throw on .get()/.has() EVERY FRAME
                           (renderFrame dies → the canvas freezes on its last
                           drawn image while DOM banners/VFX keep playing).
                           That was the replay's "units stuck standing like the
                           end screen", and it hit online guests too. */
                        s[key] = {
                            _t: 'M',
                            v: Array.from(val.entries())
                        };
                    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
                        var obj = {};
                        for (var k2 in val) {
                            if (!val.hasOwnProperty(k2)) continue;
                            if (val[k2] instanceof Set) obj[k2] = {
                                _t: 'S',
                                v: Array.from(val[k2])
                            };
                            else if (val[k2] instanceof Map) obj[k2] = {
                                _t: 'M',
                                v: Array.from(val[k2].entries())
                            };
                            else if (typeof val[k2] === 'function') continue;
                            else obj[k2] = val[k2];
                        }
                        s[key] = obj;
                    } else if (typeof val === 'function') {
                        continue;
                    } else {
                        s[key] = val;
                    }
                }
                return s;
            }

            /* Keyed dicts whose entries can be DELETED host-side (a body
               smashing a thin wall removes its edgeWalls record). The generic
               merge below only adds/overwrites keys — it never removes ones
               absent from the snapshot — so these must be replaced wholesale
               or the guest keeps phantom walls forever. */
            var _REPLACE_WHOLESALE = { edgeWalls: 1, burningTiles: 1 };

            /* state keys that MUST end up as real Maps. A recording made by an
               older build (or any snapshot that lost the boxing) carries them as
               a plain object — planting that on state is fatal, see the _t:'M'
               note in _serializeState — so they are always coerced back. */
            var _MAP_KEYS = { _monumentTiles: 1, _batTransformIds: 1 };

            /* Rehydrate a boxed collection. Applied at EVERY depth the
               serializer boxes at, including the wholesale-set path below —
               without that, state.foundByPlayer[1] lands as a raw
               {_t:'S',v:[…]} literal and every .has()/.add() on it throws. */
            function _unbox(v) {
                if (v && typeof v === 'object' && !Array.isArray(v)) {
                    if (v._t === 'S') return new Set(v.v || []);
                    if (v._t === 'M') return new Map(v.v || []);
                }
                return v;
            }

            function _toMap(val) {
                if (val instanceof Map) return val;
                if (val && typeof val === 'object' && !Array.isArray(val)) {
                    if (val._t === 'M') return new Map(val.v || []);
                    var m = new Map();
                    for (var mk in val) {
                        if (val.hasOwnProperty(mk)) m.set(mk, val[mk]);
                    }
                    return m;
                }
                return val;   /* null / undefined stay as-is (the "no monuments" case) */
            }

            function _deserializeInto(target, s) {
                for (var key in s) {
                    if (!s.hasOwnProperty(key)) continue;
                    var val = s[key];
                    if (_MAP_KEYS[key]) {
                        target[key] = _toMap(val);
                    } else if (val && typeof val === 'object' && (val._t === 'S' || val._t === 'M')) {
                        target[key] = _unbox(val);
                    } else if (val && typeof val === 'object' && !Array.isArray(val) && _REPLACE_WHOLESALE[key]) {
                        target[key] = val;
                    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
                        if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
                            for (var k2 in val) {
                                if (!val.hasOwnProperty(k2)) continue;
                                target[key][k2] = _unbox(val[k2]);
                            }
                        } else {
                            /* The key is absent locally (the replay baseline
                               deletes every key first) — rebuild it box-aware
                               instead of assigning the raw wire object. */
                            var fresh = {};
                            for (var k3 in val) {
                                if (!val.hasOwnProperty(k3)) continue;
                                fresh[k3] = _unbox(val[k3]);
                            }
                            target[key] = fresh;
                        }
                    } else {
                        target[key] = val;
                    }
                }
            }

            window._broadcastState = function() {
                /* REPLAY TAP: the recorder rides the exact same sync points the
                   online guest does — every _broadcastState call is a potential
                   snapshot (it has its own throttle + per-key dedup inside). */
                if (typeof window._ewRecTick === 'function') {
                    try { window._ewRecTick(); } catch (e) {}
                }
                if (!NET.online || NET.role !== 'host' || !NET.socket) return;

                if (state.winner && state.isRankedMatch && !NET._rankedResultEmitted) {
                    NET._rankedResultEmitted = true;
                    var durationMs = state.startTime ? Date.now() - state.startTime : 0;
                    NET.socket.emit('ranked-result', {
                        winnerId: state.winner,
                        loserId: state.winner === 1 ? 2 : 1,
                        durationMs: durationMs,
                        teamSize: CONFIG.teamSize || 4,
                        mapModeId: NET.matchMapModeId || activeGameMode || null
                    });
                    console.log('[NET] Emitted ranked-result: winner=' + state.winner);
                }

                // Throttle to ~50ms, but with a TRAILING-edge flush: if more
                // state changes arrive during the window, remember to send the
                // latest state when the window closes (otherwise the final
                // post-action state is silently dropped and the guest goes stale).
                if (NET.syncThrottle) { NET._syncPending = true; return; }
                NET.syncThrottle = setTimeout(function() {
                    NET.syncThrottle = null;
                    if (NET._syncPending) { NET._syncPending = false; window._broadcastState(); }
                }, 50);
                try {
                    var s = _serializeState();
                    if (!s) return;
                    var json = JSON.stringify(s);
                    if (json === NET.lastSyncJson) return;
                    NET.lastSyncJson = json;
                    /* Checksum stamp — added AFTER the dedup compare (the seq
                       increments every send, so including it in `json` would
                       make every snapshot look "changed" and kill the dedup). */
                    NET._csumSeq = (NET._csumSeq || 0) + 1;
                    s._csumSeq = NET._csumSeq;
                    s._csum = _ewStateChecksum(window._gameState);
                    NET.socket.emit('state-sync', s);
                } catch (e) {
                    console.error('[NET] Serialize error:', e);
                }
            };

            // ── Host turn-handoff heartbeat ─────────────────────────────────
            // During the REMOTE player's turn the host is idle (it has broadcast
            // the handoff once and is now waiting for the guest's input), so it
            // emits no further state-syncs. That makes the single turn-handoff
            // packet a single point of failure: if the guest doesn't apply it
            // (a battle-start / socket-ready race), it never learns the turn
            // changed and the match DEADLOCKS with no recovery path.
            //
            // Fix: while it's the remote player's turn, periodically re-send the
            // authoritative state (bypassing the lastSyncJson dedup) so a missed
            // handoff self-heals within ~1.2s. Re-applying identical state on the
            // guest is idempotent — _applyRemoteState preserves the guest's
            // in-progress UI (_guestUIKeys), so it won't disturb an active player.
            if (!window._NET._handoffHeartbeat) {
                window._NET._handoffHeartbeat = setInterval(function() {
                    try {
                        var N = window._NET, st = window._gameState;
                        if (!N || !N.online || N.role !== 'host' || !N.socket) return;
                        if (!st || st.phase !== 'battle' || st.winner) return;
                        var remoteP = N.myPlayer === 1 ? 2 : 1;
                        // During the remote player's turn, FORCE a resend
                        // (bypassing the dedup) so a missed turn-handoff packet
                        // self-heals. During the host's own turn just call
                        // _broadcastState — the JSON dedup already suppresses
                        // no-change sends, and this picks up delayed damage /
                        // DoT / counter hits that land on impact timers between
                        // clicks (the guest's "HP never updates" staleness).
                        if (st.activePlayer === remoteP) N.lastSyncJson = '';
                        if (window._broadcastState) window._broadcastState();
                    } catch (e) { /* never let the heartbeat throw */ }
                }, 1200);
            }

            var _guestUIKeys = [
                'selectedUnitId', 'focusedUnitId', 'hoverUnitId',
                'actionMode', 'actionMenuView', 'selectedTool',
                'pendingTarget', 'comboPartner',
                // the INSPECT card toggle is per-viewer UI — without this the
                // host's ⓘ state would stomp the guest's on every state-sync
                'showUnitInfo',
                // quick-menu anchors (enemy/ally card, tile card) — guest-local
                // too, or the handoff heartbeat closes the guest's open card
                '_enemyActionTargetId', '_tileActionTarget',
                // sky-throw destination hover preview — per-viewer hover UI
                '_skyThrowDestKey',
                // per-viewer audio mix — snapshots from older builds (and
                // replays) still carry these; never let them stomp the sliders
                'musicVolume', 'sfxVolume', 'ambienceVolume'
            ];

            function _applyRemoteState(data) {
                var st = window._gameState;
                if (!st) return;
                try {

                    var savedUI = {};
                    _guestUIKeys.forEach(function(k) {
                        savedUI[k] = st[k];
                    });

                    var savedGuestAuto = st.autoPlayers ? st.autoPlayers[2] : false;

                    var prevPhase = st.phase;

                    _deserializeInto(st, data);

                    /* The authoritative result is here — retire the guest's
                       latency-hiding move hologram (tag set on emit). */
                    if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.clearGhostUnit) {
                        try { ThreeRenderer.clearGhostUnit('netPending'); } catch (e) {}
                    }

                    // ── Keep CONFIG board dimensions in lock-step with the synced board ──
                    // bw()/bh()/isInside() derive bounds from CONFIG.boardWidth/Height, but
                    // CONFIG is a LOCAL global that is never synced. If the guest's CONFIG
                    // board size is smaller than the host's actual board (e.g. the host's map
                    // generated/resized larger than the mode the guest applied), every tile
                    // past that bound is treated as out-of-bounds on the guest: getMoveTiles
                    // returns 0 (units appear "stuck") and the renderer skips those tiles
                    // ("can't see the terrain"). This bites the FAR edge first — exactly where
                    // P2 spawns — so P2's whole spawn region vanishes on the guest while P1's
                    // near edge looks fine. Re-derive the guest's CONFIG dims from the actual
                    // synced board so bounds always match what the host sent.
                    if (typeof CONFIG !== 'undefined' && st.boardTerrain && st.boardTerrain.length) {
                        var _bh = st.boardTerrain.length;
                        var _bw = (st.boardTerrain[0] && st.boardTerrain[0].length) || CONFIG.boardWidth;
                        if (_bw && (CONFIG.boardWidth !== _bw || CONFIG.boardHeight !== _bh)) {
                            CONFIG.boardWidth = _bw;
                            CONFIG.boardHeight = _bh;
                            CONFIG.boardSize = Math.max(_bw, _bh);
                            if (typeof _invalidateBoardGrid === 'function') _invalidateBoardGrid();
                            st._terrainVersion = (st._terrainVersion || 0) + 1; // force a terrain re-render
                        }
                    }

                    _guestUIKeys.forEach(function(k) {
                        st[k] = savedUI[k];
                    });

                    /* comboPartner is a LIVE UNIT REFERENCE preserved across
                       syncs, but st.units was just replaced wholesale — left
                       alone it points at a detached pre-sync object whose
                       .ap/.hp never update (the combo verb then rejects on
                       phantom-stale AP). Re-resolve it into the fresh array. */
                    if (st.comboPartner && st.comboPartner.id) {
                        st.comboPartner = st.units.find(function(u) {
                            return u.id === st.comboPartner.id && !u.dead;
                        }) || null;
                    }

                    if (st.autoPlayers) st.autoPlayers[2] = savedGuestAuto;

                    st._actionExecuting = false;
                    st._walkAnimActive = false;

                    var _prevActivePlayer = st._guestPrevActivePlayer || 0;
                    var _prevActiveUnitId = st._guestPrevActiveUnitId || null;
                    if (st.phase === 'battle' && !st.winner && NET.myPlayer === 2) {
                        var myTurn = st.activePlayer === 2;

                        var _activeUnitChanged = st._blitzActiveUnitId !== _prevActiveUnitId;

                        if (!st._blitzActiveUnitId && _prevActiveUnitId) {
                            st.selectedUnitId = null;
                            st.focusedUnitId = null;
                            st.actionMode = null;
                            st.actionMenuView = 'root';
                            st.selectedTool = null;
                            st.pendingTarget = null;
                            st.comboPartner = null;
                        }

                        if (!myTurn) {

                            st.actionMode = null;
                            st.actionMenuView = 'root';
                            st.selectedTool = null;
                            st.pendingTarget = null;
                            st.comboPartner = null;

                            /* Select + follow the opponent's newly-active unit
                               ONLY when the viewer can genuinely see it.
                               _shouldCameraFollowUnit is screen-true (LOS fog
                               set + concealment) — snapping the camera (or the
                               selection ring) to a fog-hidden enemy hands its
                               position to the guest for free. Hidden enemy
                               turns leave the camera where the player put it;
                               the relayed walk/attack cams (already fog-
                               trimmed) cover anything that becomes visible. */
                            if (_activeUnitChanged && st._blitzActiveUnitId) {
                                var hostUnit = st.units.find(function(u) { return u.id === st._blitzActiveUnitId && !u.dead; });
                                if (hostUnit && typeof _shouldCameraFollowUnit === 'function' && _shouldCameraFollowUnit(hostUnit)) {
                                    st.selectedUnitId = hostUnit.id;
                                    if (typeof focusBoardCameraOnTiles === 'function') {
                                        var _bz = typeof getUserZoomScale === 'function' ? getUserZoomScale() : 1;
                                        var _dz = typeof getDefaultZoom === 'function' ? getDefaultZoom() : 1;
                                        focusBoardCameraOnTiles([{ x: hostUnit.x, y: hostUnit.y }], {
                                            zoom: (typeof isUserZoomEngaged === 'function' && isUserZoomEngaged()) ? _bz : _dz,
                                            holdMs: 99999, persist: true, transitionMs: 750, _fogAllowed: true
                                        });
                                    }
                                }
                            }
                        } else {

                            var targetUnit = null;
                            if (st._blitzActiveUnitId) {
                                targetUnit = st.units.find(function(u) {
                                    return u.id === st._blitzActiveUnitId && !u.dead && u.player === 2 && (u.ap || 0) > 0;
                                });
                            }
                            if (!targetUnit) {
                                for (var i = 0; i < st.units.length; i++) {
                                    var u = st.units[i];
                                    if (!u.dead && u.player === 2 && (u.ap || 0) > 0) {
                                        targetUnit = u;
                                        break;
                                    }
                                }
                            }
                            var _needsAutoSelect = !st.selectedUnitId || _prevActivePlayer !== 2;

                            if (targetUnit && st.selectedUnitId !== targetUnit.id) _needsAutoSelect = true;
                            if (st.selectedUnitId && !_needsAutoSelect) {
                                var selUnit = st.units.find(function(u) {
                                    return u.id === st.selectedUnitId && !u.dead;
                                });
                                if (!selUnit || (selUnit.ap || 0) <= 0) _needsAutoSelect = true;
                            }
                            if (_needsAutoSelect) {
                                if (targetUnit) {

                                    st._remoteAction = true;
                                    if (typeof selectUnit === 'function') selectUnit(targetUnit.id, { _auto: true });
                                    st._remoteAction = false;
                                    if (typeof window.playUnitSwitchChime === 'function') window.playUnitSwitchChime();
                                } else {
                                    st.selectedUnitId = null;
                                    st.focusedUnitId = null;
                                }
                            }
                        }
                    }
                    st._guestPrevActivePlayer = st.activePlayer;
                    st._guestPrevActiveUnitId = st._blitzActiveUnitId;

                    var appEl = document.querySelector('.app');
                    if (appEl) {
                        appEl.classList.toggle('setup-mode', st.phase === 'setup');
                        appEl.classList.toggle('battle-mode', st.phase === 'battle');
                    }

                    if (st.phase === 'battle' && (prevPhase !== 'battle' || !st._guestBoardBuilt)) {
                        st._guestBoardBuilt = true;

                        CONFIG.tileSize = BASE_TILE;
                        if (typeof _invalidateBoardGrid === 'function') _invalidateBoardGrid();
                    }

                    if (st.phase === 'battle' && typeof window._rebuildBlitzTurnOrderFromIds === 'function') {
                        window._rebuildBlitzTurnOrderFromIds();
                    }

                    if (typeof window.render === 'function') window.render();

                    if (prevPhase === 'setup' && st.phase === 'battle') {

                        /* fresh match on the guest ⇒ void stale intro-skip /
                           ready votes (the host's OWN match-ready for THIS match
                           can't be missed: it's relayed on the same ordered
                           socket after the phase-flip snapshot we just applied) */
                        window._ewIntroRemoteSkip = false;
                        window._ewRemoteMatchReady = false;
                        window._ewRemoteIntroDone = false;

                        var _splashFn = typeof showVSSplash === 'function' ? showVSSplash
                                      : typeof window.showVSSplash === 'function' ? window.showVSSplash
                                      : typeof window.showVsSplash === 'function' ? window.showVsSplash
                                      : null;
                        if (_splashFn) {
                            // Loading screen first (asset gate: GLBs + battle
                            // track + sprites — battle.js showBattleLoadingScreen),
                            // then the VS splash. Mirrors the host's startMatch
                            // intro so the guest doesn't watch units pop 2D→3D.
                            var _introFn = (typeof window.showBattleLoadingScreen === 'function')
                                ? function (cb) { window.showBattleLoadingScreen(function () { _splashFn(cb); }); }
                                : _splashFn;
                            _introFn(function _afterGuestVSSplash() {

                                /* Tell the HOST our intro finished — it holds
                                   the engine start (round 1, shot clock) on
                                   this (battle.js _syncedAfterVSSplash). */
                                if (NET.socket) {
                                    NET.socket.emit('relay', { type: 'intro-done', from: NET.myPlayer || 0 });
                                }

                                CONFIG.tileSize = BASE_TILE;
                                if (typeof invalidateLayoutCache === 'function') invalidateLayoutCache();

                                if (typeof _clearZoomMemo === 'function') _clearZoomMemo();
                                if (typeof renderBoard === 'function') renderBoard();
                                /* A naturally-finished intro already landed the
                                   camera on the tactical framing — snapping again
                                   caused the abrupt zoom-out cut after FIGHT!. */
                                if (window._ewIntroCamLanded) window._ewIntroCamLanded = false;
                                else if (typeof resetBoardCamera === 'function') resetBoardCamera(true);

                                /* Open on the guest's OWN side: only frame the
                                   active blitz unit when it's ours — framing
                                   the host's opening unit revealed its spawn. */
                                var activeU = null;
                                if (st._blitzActiveUnitId) {
                                    activeU = (st.units || []).find(function(u) { return u.id === st._blitzActiveUnitId && !u.dead && u.player === NET.myPlayer; });
                                }
                                if (!activeU) {
                                    activeU = (st.units || []).find(function(u) { return !u.dead && u.player === NET.myPlayer; });
                                }
                                if (activeU && typeof focusBoardCameraOnTiles === 'function') {
                                    var _bz3 = typeof getUserZoomScale === 'function' ? getUserZoomScale() : 1;
                                    var _dz3 = typeof getDefaultZoom === 'function' ? getDefaultZoom() : 1;
                                    focusBoardCameraOnTiles([{ x: activeU.x, y: activeU.y }], {
                                        zoom: (typeof isUserZoomEngaged === 'function' && isUserZoomEngaged()) ? _bz3 : _dz3,
                                        holdMs: 99999, persist: true, transitionMs: 600
                                    });
                                }

                                if (st.activePlayer === NET.myPlayer && st._blitzActiveUnitId) {
                                    var myU = (st.units || []).find(function(u) {
                                        return u.id === st._blitzActiveUnitId && !u.dead && u.player === NET.myPlayer;
                                    });
                                    if (myU) {
                                        st._remoteAction = true;
                                        if (typeof selectUnit === 'function') selectUnit(myU.id, { _auto: true });
                                        st._remoteAction = false;
                                    }
                                }
                                if (typeof window.render === 'function') window.render();
                            });
                        }
                    }

                    if (st.winner && !st._guestResultShown) {
                        st._guestResultShown = true;

                        if (typeof window.finalizeMatch === 'function') {
                            try {
                                window.finalizeMatch();
                            } catch (e) {
                            }
                        } else if (typeof window.showResultOverlay === 'function') {
                            window.showResultOverlay();
                        }
                    }

                    /* ── Checksum report (see _ewStateChecksum) ─────────────
                       Recompute AFTER the whole apply (nothing between here
                       and _deserializeInto touches a hashed field — the UI
                       restores, auto-select and camera work above are all
                       per-viewer keys). Throttled to ~1 report / 1.5s so it
                       stays a rounding error inside the relay rate budget;
                       the server matches reports to stamps by seq, so
                       skipped syncs are fine. Live guests only — the replay
                       player is offline (NET.online false) and never emits. */
                    if (NET.online && NET.role === 'guest' && NET.socket && data._csumSeq != null) {
                        var _csNow = Date.now();
                        if (!NET._lastCsumReportAt || _csNow - NET._lastCsumReportAt > 1500) {
                            NET._lastCsumReportAt = _csNow;
                            NET.socket.emit('relay', {
                                type: 'state-checksum',
                                seq: data._csumSeq,
                                round: st.round,
                                csum: _ewStateChecksum(st)
                            });
                        }
                    }
                } catch (e) {
                    console.error('[NET] State apply error:', e);
                }
            }

            window._sendPartyConfig = function() {
                if (!NET.socket || NET.role !== 'guest') return;
                var st = window._gameState;
                NET.socket.emit('party-config', {
                    builds: st.partyBuilds[2],
                    loadouts: st.loadouts[2],
                    name: st.partyNames ? st.partyNames[2] : 'Player 2',
                    meta: st.partyMeta ? st.partyMeta[2] : null
                });
            };

            setInterval(function() {
                if (!NET.online) return;
                var ind = document.getElementById('netStatusIndicator');
                if (!ind) {
                    ind = document.createElement('div');
                    ind.id = 'netStatusIndicator';
                    ind.style.cssText = 'position:absolute;top:8px;right:12px;z-index:1400;font-size:0.75rem;padding:4px 10px;border-radius:6px;pointer-events:none;';
                    (document.getElementById("game-viewport") || document.body).appendChild(ind);
                }
                var ok = NET.socket && NET.socket.connected;
                ind.textContent = ok ?
                    '🟢 Online — Room ' + NET.roomCode + ' — You are P' + NET.myPlayer :
                    '🔴 Disconnected';
                ind.style.background = ok ? 'rgba(85,211,138,0.15)' : 'rgba(255,107,107,0.15)';
                ind.style.color = ok ? 'var(--green)' : 'var(--red)';
            }, 2000);

            try {
                var savedToken = sessionStorage.getItem('ew_rejoinToken');
                var savedRoom = sessionStorage.getItem('ew_rejoinRoom');
                var savedRole = sessionStorage.getItem('ew_rejoinRole');
                if (savedToken && savedRoom) {
                    console.log('[NET] Found saved rejoin credentials, attempting rejoin to room ' + savedRoom);

                    sessionStorage.removeItem('ew_rejoinToken');
                    sessionStorage.removeItem('ew_rejoinRoom');
                    sessionStorage.removeItem('ew_rejoinRole');

                    NET.rejoinToken = savedToken;
                    NET.roomCode = savedRoom;
                    NET.role = savedRole;
                    NET._wasInMatch = true;
                    NET.online = true;
                    _showReconnectOverlay('Reconnecting', 90);
                    _connectSocket(function() {

                    });
                }
            } catch(e) {}

        })();

        /* ═══════════════════════════════════════════════════════════════════
           MATCH REPLAY — recorder + cinematic player
           ═══════════════════════════════════════════════════════════════════
           Every local (VS-CPU / hotseat) match and every ONLINE-HOST match is
           silently recorded as the same stream the online guest consumes:
             • delta state snapshots (via _ewSerializeState, per-key + per-unit
               dedup so a long match stays a few MB, gzip'd on save)
             • the full relay presentation stream (banners, action cameras,
               walk/jump/displace anims, strike leaps, VFX, SFX, cinematics)
           Playback replays that stream through window._ewApplyRelay — the
           EXACT code path a live online guest renders with — so whatever the
           guest mirror can show, the replay can show. The engine and AI stay
           completely dormant during playback; fog is lifted for a clean
           spectator/trailer view; HUD is hidden vic-podium-style with
           letterbox bars and auto-hiding controls for screen recording.
           Latest finished match is kept in memory AND persisted to IndexedDB
           ('ew-replays-v1'), so it survives a reload. Guests can't record
           (they don't run the engine — the relay stream originates hostside).
           ═══════════════════════════════════════════════════════════════════ */
        (function() {
            'use strict';

            var IDB_NAME = 'ew-replays-v1';
            var IDB_STORE = 'replays';
            var IDB_KEY = 'last';
            var SNAP_THROTTLE_MS = 120;   /* max snapshot cadence (relay events are not throttled) */
            var MAX_EVENTS = 240000;      /* runaway-match memory backstop */

            /* Session/lobby control traffic — never part of a replay. */
            var SKIP_RELAY = {
                'intro-skip': 1, 'match-ready': 1, 'intro-done': 1,
                'rematch-request': 1, 'rematch-accept': 1,
                'guest-locked': 1, 'host-locked': 1,
                'game-mode': 1, 'multiplayer-mode': 1,
                'pickup-dialog': 1, 'pickup-response': 1
            };
            /* Camera-driving relay types — skippable when the user takes the
               camera themselves (free-cam mode for filming trailers). */
            var CAMERA_RELAY = {
                'camera-events': 1, 'cam-action-settle': 1, 'dash-cam-follow': 1,
                'unit-fall-follow': 1, 'spell-focus-cam': 1
            };

            /* ── IndexedDB (localStorage's ~5MB quota is too small for this) ── */
            function _idbOpen() {
                return new Promise(function(resolve, reject) {
                    try {
                        var req = indexedDB.open(IDB_NAME, 1);
                        req.onupgradeneeded = function() {
                            var db = req.result;
                            if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
                        };
                        req.onsuccess = function() { resolve(req.result); };
                        req.onerror = function() { reject(req.error); };
                    } catch (e) { reject(e); }
                });
            }
            function _idbPut(val) {
                return _idbOpen().then(function(db) {
                    return new Promise(function(resolve, reject) {
                        var tx = db.transaction(IDB_STORE, 'readwrite');
                        tx.objectStore(IDB_STORE).put(val, IDB_KEY);
                        tx.oncomplete = function() { db.close(); resolve(); };
                        tx.onerror = function() { db.close(); reject(tx.error); };
                    });
                });
            }
            function _idbGetRaw() {
                return _idbOpen().then(function(db) {
                    return new Promise(function(resolve, reject) {
                        var tx = db.transaction(IDB_STORE, 'readonly');
                        var req = tx.objectStore(IDB_STORE).get(IDB_KEY);
                        req.onsuccess = function() { db.close(); resolve(req.result || null); };
                        req.onerror = function() { db.close(); reject(req.error); };
                    });
                });
            }

            function _gzipStr(str) {
                if (typeof CompressionStream === 'undefined') return Promise.resolve({ gz: false, data: str });
                try {
                    var stream = new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));
                    return new Response(stream).blob().then(function(b) { return { gz: true, data: b }; });
                } catch (e) { return Promise.resolve({ gz: false, data: str }); }
            }
            function _gunzipToStr(stored) {
                if (!stored.gz) {
                    return typeof stored.data === 'string'
                        ? Promise.resolve(stored.data)
                        : new Response(stored.data).text();
                }
                var stream = stored.data.stream().pipeThrough(new DecompressionStream('gzip'));
                return new Response(stream).text();
            }

            /* ══════════════════ RECORDER ══════════════════ */

            var REC = window._EW_REC = {
                active: false, t0: 0, events: [], meta: null,
                keyJson: null, unitJson: null, unitOrder: '', arrLen: null,
                lastSnapAt: 0, trailTimer: null, blocked: false
            };

            function _recStart(st) {
                REC.active = true;
                REC.t0 = performance.now();
                REC.events = [];
                REC.keyJson = {};
                REC.unitJson = {};
                REC.unitOrder = '';
                REC.arrLen = {};
                REC.lastSnapAt = 0;
                REC.blocked = false;
                REC.meta = {
                    v: 1,
                    startedAt: Date.now(),
                    mode: (typeof activeGameMode !== 'undefined') ? activeGameMode : null,
                    mpMode: (typeof activeMultiplayerMode !== 'undefined') ? activeMultiplayerMode : null,
                    teamSize: (typeof CONFIG !== 'undefined') ? (CONFIG.teamSize || null) : null,
                    names: st.partyNames ? { 1: st.partyNames[1], 2: st.partyNames[2] } : null,
                    online: !!(window._NET && window._NET.online)
                };
                _recCaptureSnap(true); /* full baseline — every key differs from the empty cache */
                console.log('[REPLAY] Recording started');
            }

            function _recAbort() {
                REC.active = false;
                REC.events = [];
                REC.keyJson = REC.unitJson = REC.arrLen = null;
                if (REC.trailTimer) { clearTimeout(REC.trailTimer); REC.trailTimer = null; }
            }

            /* Ride every _broadcastState call (renderBattleUpdate fires it on
               each engine update, online or not). Auto-starts at battle phase,
               finalizes on winner, aborts if the match is abandoned. */
            window._ewRecTick = function() {
                var st = window._gameState;
                if (!st) return;
                var RP = window._EW_REPLAY;
                if (RP && RP.playing) return;                     /* never record a replay of a replay */
                var N = window._NET;
                if (N && N.online && N.role === 'guest') return;  /* guest has no engine to record */
                if (!REC.active) {
                    if (REC.blocked) { if (st.phase !== 'battle') REC.blocked = false; return; }
                    if (st.phase === 'battle' && !st.winner && !st.devAutoSim) _recStart(st);
                    return;
                }
                if (st.phase !== 'battle' || st.devAutoSim) { _recAbort(); return; }
                var finalize = !!st.winner && !REC.meta.winner;
                _recCaptureSnap(finalize);
                if (finalize) _recFinalize(st);
            };

            window._ewRecRelay = function(data) {
                if (!REC.active || !data || SKIP_RELAY[data.type]) return;
                try {
                    REC.events.push({
                        t: Math.max(0, Math.round(performance.now() - REC.t0)),
                        k: 'r',
                        d: JSON.parse(JSON.stringify(data))
                    });
                } catch (e) {}
                if (REC.events.length > MAX_EVENTS) {
                    console.warn('[REPLAY] Event cap hit — recording aborted');
                    _recAbort();
                    REC.blocked = true;
                }
            };

            /* Delta snapshot: per-top-level-key JSON dedup, per-unit dedup for
               state.units (the hot key — only changed units are stored), and an
               append-only fast path for grow-only arrays like the battle log. */
            function _recCaptureSnap(force) {
                var now = performance.now();
                if (!force && now - REC.lastSnapAt < SNAP_THROTTLE_MS) {
                    /* trailing capture so the last state of a burst isn't dropped */
                    if (!REC.trailTimer) {
                        REC.trailTimer = setTimeout(function() {
                            REC.trailTimer = null;
                            if (REC.active) _recCaptureSnap(true);
                        }, SNAP_THROTTLE_MS + 20);
                    }
                    return;
                }
                REC.lastSnapAt = now;
                var s = (typeof window._ewSerializeState === 'function') ? window._ewSerializeState() : null;
                if (!s) return;
                var delta = {}, changed = false, key, j;

                if (Array.isArray(s.units)) {
                    var ids = [], ch = {}, anyU = false, i, u;
                    for (i = 0; i < s.units.length; i++) {
                        u = s.units[i];
                        ids.push(u.id);
                        try { j = JSON.stringify(u); } catch (e) { continue; }
                        if (REC.unitJson[u.id] !== j) {
                            REC.unitJson[u.id] = j;
                            ch[u.id] = JSON.parse(j);
                            anyU = true;
                        }
                    }
                    var orderStr = ids.join(',');
                    if (orderStr !== REC.unitOrder) { REC.unitOrder = orderStr; anyU = true; }
                    if (anyU) { delta.units = { _t: 'U', o: ids, c: ch }; changed = true; }
                }

                for (key in s) {
                    if (!s.hasOwnProperty(key) || key === 'units') continue;
                    try { j = JSON.stringify(s[key]); } catch (e) { continue; }
                    if (j === undefined || REC.keyJson[key] === j) continue;
                    var prev = REC.keyJson[key];
                    REC.keyJson[key] = j;
                    changed = true;
                    if (prev && prev.charAt(0) === '[' && j.charAt(0) === '[' && prev.length > 2 &&
                        j.length > prev.length &&
                        j.slice(0, prev.length - 1) === prev.slice(0, -1) &&
                        j.charAt(prev.length - 1) === ',' &&
                        REC.arrLen[key] != null) {
                        var full = JSON.parse(j);
                        delta[key] = { _t: 'A', a: full.slice(REC.arrLen[key]) };
                        REC.arrLen[key] = full.length;
                    } else {
                        delta[key] = JSON.parse(j);
                        REC.arrLen[key] = Array.isArray(delta[key]) ? delta[key].length : null;
                    }
                }

                if (!changed) return;
                REC.events.push({
                    t: Math.max(0, Math.round(now - REC.t0)),
                    k: 's',
                    d: delta
                });
                if (REC.events.length > MAX_EVENTS) {
                    console.warn('[REPLAY] Event cap hit — recording aborted');
                    _recAbort();
                    REC.blocked = true;
                }
            }

            function _recFinalize(st) {
                if (REC.trailTimer) { clearTimeout(REC.trailTimer); REC.trailTimer = null; }
                REC.meta.winner = st.winner;
                REC.meta.rounds = st.round || null;
                REC.meta.durationMs = Math.round(performance.now() - REC.t0);
                REC.meta.endedAt = Date.now();
                REC.meta.eventCount = REC.events.length;
                var recording = { v: 1, meta: REC.meta, events: REC.events };
                REC.active = false;
                REC.blocked = true; /* until phase leaves battle */
                window._EW_LAST_REPLAY = recording;
                REC.events = [];    /* recording object holds the only reference now */
                REC.keyJson = REC.unitJson = REC.arrLen = null;
                console.log('[REPLAY] Recording finished: ' + recording.meta.eventCount + ' events, ' +
                    Math.round(recording.meta.durationMs / 1000) + 's');
                try {
                    var json = JSON.stringify(recording);
                    _gzipStr(json).then(function(packed) {
                        return _idbPut({ meta: recording.meta, gz: packed.gz, data: packed.data });
                    }).then(function() {
                        console.log('[REPLAY] Saved to IndexedDB');
                    }).catch(function(e) {
                        console.warn('[REPLAY] Save failed (replay still available this session):', e);
                    });
                } catch (e) {
                    console.warn('[REPLAY] Serialize failed:', e);
                }
                /* Playback is offline-only — don't tease the button mid-session
                   online; the replay is saved and watchable from the main menu
                   after the session ends. */
                if (!(window._NET && window._NET.online)) _injectVictoryReplayBtn();
            }

            function _loadSavedReplay() {
                if (window._EW_LAST_REPLAY) return Promise.resolve(window._EW_LAST_REPLAY);
                return _idbGetRaw().then(function(stored) {
                    if (!stored || !stored.data) return null;
                    return _gunzipToStr(stored).then(function(json) {
                        var rec = JSON.parse(json);
                        window._EW_LAST_REPLAY = rec;
                        return rec;
                    });
                });
            }

            /* ══════════════════ PLAYER ══════════════════ */

            var R = window._EW_REPLAY = {
                playing: false, paused: false, speed: 1,
                idx: 0, playhead: 0, events: null, meta: null, timer: null, lastTick: 0,
                acc: null, accUnits: null, accOrder: null,
                autoCam: true, fogOff: true, letterbox: true,
                _prevActiveUnit: null, _boardBuilt: false, _endShown: false,
                _saved: null, _idleTimer: null, _durationMs: 0
            };

            var SPEEDS = [0.5, 1, 2, 4];

            /* Dead-air compression. A recording carries every second of human
               thinking time between actions, so a straight playback drags —
               long silent stretches where nothing on screen moves. While the
               engine is doing ANYTHING, snapshots land every ~120ms
               (SNAP_THROTTLE_MS) and relays are unthrottled, so any
               event-to-event gap bigger than GAP_CAP_MS is guaranteed idle
               time, not an in-flight animation. Rewriting the timeline caps
               each gap at GAP_CAP_MS: action keeps its exact recorded rhythm,
               idle stretches collapse to a short beat, and the whole match
               plays like continuous battle. Event objects are copied so the
               saved recording (IndexedDB / _EW_LAST_REPLAY) keeps its true
               timings. */
            var GAP_CAP_MS = 1500;
            function _compressTimeline(events) {
                var out = [], shift = 0, prevT = 0, i, ev, t;
                for (i = 0; i < events.length; i++) {
                    ev = events[i];
                    t = ev.t - shift;
                    if (t - prevT > GAP_CAP_MS) {
                        shift += (t - prevT) - GAP_CAP_MS;
                        t = prevT + GAP_CAP_MS;
                    }
                    out.push({ t: t, k: ev.k, d: ev.d });
                    prevT = t;
                }
                return out;
            }

            window._ewReplayLastMatch = function() {
                if (R.playing) return;
                if (window._NET && window._NET.online) {
                    _toast('Replay is not available during an online session.');
                    return;
                }
                var st = window._gameState;
                if (st && st.phase === 'battle' && !st.winner) {
                    _toast('Finish the current match first.');
                    return;
                }
                _loadSavedReplay().then(function(rec) {
                    if (!rec || !rec.events || !rec.events.length) {
                        _toast('No recorded match yet — play a match first!');
                        return;
                    }
                    _startPlayback(rec);
                }).catch(function(e) {
                    console.warn('[REPLAY] Load failed:', e);
                    _toast('No recorded match found.');
                });
            };

            function _startPlayback(rec) {
                var st = window._gameState;
                var N = window._NET;
                if (!st || !N) return;

                R.playing = true;
                R.paused = false;
                R.speed = 1;
                R.idx = 0;
                R.playhead = 0;
                R.events = _compressTimeline(rec.events);
                R.meta = rec.meta || {};
                R.acc = {};
                R.accUnits = {};
                R.accOrder = [];
                R._prevActiveUnit = null;
                R._boardBuilt = false;
                R._endShown = false;
                R._durationMs = R.events.length ? R.events[R.events.length - 1].t : 0;

                /* Pin the environment: viewer = P1, engine dormant. Everything
                   saved here is restored on exit. */
                R._saved = {
                    myPlayer: N.myPlayer,
                    c1: st.controllers ? st.controllers[1] : null,
                    c2: st.controllers ? st.controllers[2] : null,
                    fogOfWar: st.fogOfWar,
                    audioUnlocked: st.audioUnlocked
                };
                N.myPlayer = 1;
                if (typeof CTRL !== 'undefined' && st.controllers) {
                    st.controllers[1] = CTRL.LOCAL;
                    st.controllers[2] = CTRL.AI;
                }
                st.audioUnlocked = true;
                st.selectedUnitId = null;
                st.focusedUnitId = null;
                st.actionMode = null;
                st.devAutoSim = false;

                /* Dismiss whatever screen we came from (main menu / victory). */
                if (typeof hideResultOverlay === 'function') { try { hideResultOverlay(); } catch (e) {} }
                var so = document.getElementById('startOverlay');
                if (so) {
                    so.classList.add('hidden');
                    so.style.display = 'none';
                    so.style.pointerEvents = 'none';
                    so.setAttribute('aria-hidden', 'true');
                }
                document.body.classList.add('ew-replay');
                if (R.letterbox) document.body.classList.add('ew-replay-letterbox');
                _injectReplayCss();
                _buildControls();
                _armIdleWatch();
                window.addEventListener('keydown', _onKeyDown, true);

                if (typeof transitionTo === 'function' && typeof GS !== 'undefined') {
                    try { transitionTo(GS.BATTLE); } catch (e) {}
                }

                var _nS = 0, _nR = 0;
                for (var _ci = 0; _ci < rec.events.length; _ci++) {
                    if (rec.events[_ci].k === 's') _nS++; else _nR++;
                }
                var _recDur = rec.events.length ? rec.events[rec.events.length - 1].t : 0;
                console.log('[REPLAY] Playing ' + rec.events.length + ' events (' + _nS +
                    ' snapshots, ' + _nR + ' relay) · ' + Math.round(R._durationMs / 1000) +
                    's (recorded ' + Math.round(_recDur / 1000) + 's, idle gaps compressed)');

                /* Baseline snapshot builds the world; the Three renderer
                   auto-activates off phase==='battle' just like a live match. */
                _applyBaseline();

                if (typeof syncMusicToState === 'function') {
                    try { var p = syncMusicToState(); if (p && p.catch) p.catch(function() {}); } catch (e) {}
                }

                var begin = function() {
                    if (typeof resetBoardCamera === 'function') { try { resetBoardCamera(true); } catch (e) {} }
                    R.lastTick = performance.now();
                    R.timer = setInterval(_tick, 33);
                    _toast('▶ Replay — Space pauses, Esc exits', 2600);
                };
                /* Loading screen doubles as the asset gate (GLBs, battle track,
                   sprites) so the recording opens clean — same as the guest. */
                if (typeof window.showBattleLoadingScreen === 'function') {
                    try { window.showBattleLoadingScreen(begin); } catch (e) { begin(); }
                } else begin();
            }

            /* Baseline = event 0. Playback always starts on top of a FINISHED
               match (victory screen or main menu), so the 3D renderer is still
               holding that match's animation state: death/carry tweens, a
               running time-warp, clamped death-pose model rigs and every
               "already built" serial. A real match start clears all of it via
               resetForNewMatch — the replay must too, or the first frames fight
               leftovers. Errors are caught and logged: a baseline that throws
               used to leave the finished match's board on screen with the relay
               stream (banners, spells, cameras) playing over it. */
            function _applyBaseline() {
                if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.resetForNewMatch) {
                    try { ThreeRenderer.resetForNewMatch(); } catch (e) {}
                }
                var first = R.events && R.events[0];
                if (!first || first.k !== 's') {
                    console.warn('[REPLAY] Recording has no baseline snapshot — playback will be blind');
                    return;
                }
                try {
                    _applySnapEvent(first, true);
                    R.idx = 1;
                } catch (e) {
                    console.error('[REPLAY] Baseline apply FAILED — the board is still the old match:', e);
                    R.idx = 1;
                }
                if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.invalidateUnits) {
                    try { ThreeRenderer.invalidateUnits(); } catch (e) {}
                }
                if (typeof invalidateLayoutCache === 'function') { try { invalidateLayoutCache(); } catch (e) {} }
                if (typeof renderBoard === 'function') { try { renderBoard(); } catch (e) {} }
            }

            function _tick() {
                if (!R.playing) return;
                var now = performance.now();
                var dt = now - R.lastTick;
                R.lastTick = now;
                if (!R.paused) {
                    R.playhead += dt * R.speed;
                    var n = 0;
                    while (R.idx < R.events.length && R.events[R.idx].t <= R.playhead) {
                        var ev = R.events[R.idx++];
                        try {
                            if (ev.k === 's') _applySnapEvent(ev);
                            else _applyRelayEvent(ev);
                        } catch (e) { console.warn('[REPLAY] Event apply error:', e); }
                        if (++n > 300) break; /* yield to the frame */
                    }
                    if (R.idx >= R.events.length && !R._endShown) {
                        R._endShown = true;
                        setTimeout(_showEndCard, 1200);
                    }
                }
                _updateProgressUi();
            }

            function _applyRelayEvent(ev) {
                var d = ev.d;
                if (!d || SKIP_RELAY[d.type]) return;
                if (!R.autoCam && CAMERA_RELAY[d.type]) return;
                if (typeof window._ewApplyRelay === 'function') window._ewApplyRelay(d);
            }

            function _applySnapEvent(ev, isBaseline) {
                var st = window._gameState;
                var delta = ev.d || {};
                var resolved = {}, key, v;

                if (Array.isArray(delta._del)) {
                    for (var di = 0; di < delta._del.length; di++) {
                        delete st[delta._del[di]];
                        delete R.acc[delta._del[di]];
                    }
                }

                for (key in delta) {
                    if (!delta.hasOwnProperty(key) || key === '_del') continue;
                    v = delta[key];
                    if (key === 'units' && v && v._t === 'U') {
                        var id;
                        for (id in v.c) {
                            if (v.c.hasOwnProperty(id)) R.accUnits[id] = v.c[id];
                        }
                        R.accOrder = v.o;
                        /* Deep-copy: relay-driven animations may write onto the
                           live unit objects — the accumulator must stay pristine
                           for units that go unchanged across many deltas. */
                        resolved.units = [];
                        for (var oi = 0; oi < R.accOrder.length; oi++) {
                            var uref = R.accUnits[R.accOrder[oi]];
                            if (uref) resolved.units.push(JSON.parse(JSON.stringify(uref)));
                        }
                    } else if (v && v._t === 'A') {
                        var base = Array.isArray(R.acc[key]) ? R.acc[key] : [];
                        R.acc[key] = base.concat(v.a);
                        resolved[key] = R.acc[key];
                    } else {
                        R.acc[key] = v;
                        resolved[key] = v;
                    }
                }

                /* Baseline must land on a clean slate: _ewDeserializeInto MERGES
                   plain objects key-by-key, so stale entries from this session's
                   own previous match (deployables, kill maps, zones…) would
                   survive underneath the recording. Deleting first makes every
                   baseline key a wholesale set. */
                if (isBaseline) {
                    for (key in resolved) {
                        if (resolved.hasOwnProperty(key)) { try { delete st[key]; } catch (e) {} }
                    }
                }
                if (typeof window._ewDeserializeInto === 'function') {
                    window._ewDeserializeInto(st, resolved);
                }
                _postApplySnap(st);
            }

            function _postApplySnap(st) {
                /* Keep CONFIG board dims locked to the applied board (same fix
                   as _applyRemoteState — bounds derive from CONFIG, which is
                   local and never rides a snapshot). */
                if (typeof CONFIG !== 'undefined' && st.boardTerrain && st.boardTerrain.length) {
                    var _bh2 = st.boardTerrain.length;
                    var _bw2 = (st.boardTerrain[0] && st.boardTerrain[0].length) || CONFIG.boardWidth;
                    if (_bw2 && (CONFIG.boardWidth !== _bw2 || CONFIG.boardHeight !== _bh2)) {
                        CONFIG.boardWidth = _bw2;
                        CONFIG.boardHeight = _bh2;
                        CONFIG.boardSize = Math.max(_bw2, _bh2);
                        if (typeof _invalidateBoardGrid === 'function') _invalidateBoardGrid();
                        st._terrainVersion = (st._terrainVersion || 0) + 1;
                    }
                }

                if (R.fogOff) st.fogOfWar = false;
                st._actionExecuting = false;
                st._walkAnimActive = false;
                st.devAutoSim = false;

                if (st.phase === 'battle' && !R._boardBuilt) {
                    R._boardBuilt = true;
                    if (typeof BASE_TILE !== 'undefined') CONFIG.tileSize = BASE_TILE;
                    if (typeof _invalidateBoardGrid === 'function') _invalidateBoardGrid();
                }
                if (st.phase === 'battle' && typeof window._rebuildBlitzTurnOrderFromIds === 'function') {
                    window._rebuildBlitzTurnOrderFromIds();
                }

                var appEl = document.querySelector('.app');
                if (appEl) {
                    appEl.classList.toggle('setup-mode', st.phase === 'setup');
                    appEl.classList.toggle('battle-mode', st.phase === 'battle');
                }

                /* Baseline camera choreography: follow each newly-active unit.
                   The recorded action cams / cinematics layer on top via relay. */
                if (R.autoCam && st._blitzActiveUnitId && st._blitzActiveUnitId !== R._prevActiveUnit) {
                    R._prevActiveUnit = st._blitzActiveUnitId;
                    var au = (st.units || []).find(function(u) { return u.id === st._blitzActiveUnitId && !u.dead; });
                    if (au && typeof focusBoardCameraOnTiles === 'function') {
                        /* Honour a wheel-zoom the viewer dialed in — this used
                           to force getDefaultZoom() on every unit change, so
                           replays yanked the zoom back out each activation. */
                        var _dz = (typeof isUserZoomEngaged === 'function' && isUserZoomEngaged()
                            && typeof getUserZoomScale === 'function') ? getUserZoomScale()
                            : ((typeof getDefaultZoom === 'function') ? getDefaultZoom() : 1);
                        focusBoardCameraOnTiles([{ x: au.x, y: au.y }], {
                            zoom: _dz, holdMs: 99999, persist: true, transitionMs: 750, _fogAllowed: true
                        });
                    }
                }

                if (typeof window.render === 'function') window.render();

                if (st.winner && !R._endShown) {
                    R._endShown = true;
                    setTimeout(_showEndCard, 2400); /* let the final beat land */
                }
            }

            /* ── input guard: no game actions while a replay owns the screen ── */
            if (typeof clickTile === 'function') {
                const _ewOrigClickTile = clickTile;
                clickTile = function() {
                    if (R.playing) return;
                    return _ewOrigClickTile.apply(this, arguments);
                };
            }

            function _onKeyDown(e) {
                if (!R.playing) return;
                var k = e.key;
                var handled = true;
                if (k === ' ') _togglePause();
                else if (k === 'Escape') _exitReplay();
                else if (k === 'ArrowRight') _cycleSpeed(1);
                else if (k === 'ArrowLeft') _cycleSpeed(-1);
                else if (k === 'c' || k === 'C') _toggleAutoCam();
                else if (k === 'f' || k === 'F') _toggleFog();
                else if (k === 'l' || k === 'L') _toggleLetterbox();
                else handled = false;
                if (handled) e.preventDefault();
                /* swallow game hotkeys either way — the engine must not react */
                e.stopImmediatePropagation();
                e.stopPropagation();
            }

            /* ── controls / chrome ── */

            function _injectReplayCss() {
                if (document.getElementById('ewReplayCss')) return;
                var css = [
                    /* vic-podium-style HUD park: keep only the 3D canvas and the
                       CSS2D overlay (nameplates + floating damage text). */
                    'body.ew-replay #mapRow > *:not(.map-center) { visibility: hidden !important; }',
                    'body.ew-replay .map-center > *:not(#threeCanvas):not(#css2dOverlay) { visibility: hidden !important; }',
                    'body.ew-replay #sidebarPanel, body.ew-replay #scorePanel,',
                    'body.ew-replay .battle-top-scoreboard, body.ew-replay #battleMinimap { visibility: hidden !important; }',
                    'body.ew-replay.ew-replay-idle { cursor: none; }',
                    'body.ew-replay.ew-replay-idle #ewReplayControls { opacity: 0; }',
                    '.ew-replay-bar { position: fixed; left: 0; right: 0; height: 8vh; background: #000;',
                    '  z-index: 6000; pointer-events: none; transition: transform 0.6s ease; }',
                    '.ew-replay-bar.top { top: 0; transform: translateY(-101%); }',
                    '.ew-replay-bar.bottom { bottom: 0; transform: translateY(101%); }',
                    'body.ew-replay-letterbox .ew-replay-bar { transform: translateY(0); }',
                    '#ewReplayControls { position: fixed; bottom: 12px; left: 50%; transform: translateX(-50%);',
                    '  z-index: 6002; display: flex; gap: 6px; align-items: center; padding: 7px 10px;',
                    '  background: rgba(8,10,18,0.88); border: 1px solid rgba(120,140,180,0.25);',
                    '  border-radius: 8px; transition: opacity 0.45s ease; font-family: "DotGothic16", monospace; }',
                    '#ewReplayControls button { background: rgba(30,36,54,0.9); color: #cfd6e6;',
                    '  border: 1px solid rgba(120,140,180,0.3); border-radius: 5px; padding: 4px 10px;',
                    '  font-family: inherit; font-size: 12px; cursor: pointer; white-space: nowrap; }',
                    '#ewReplayControls button:hover { background: rgba(60,70,100,0.9); color: #fff; }',
                    '#ewReplayControls .ewr-time { color: #8a93a8; font-size: 11px; min-width: 86px; text-align: center; }',
                    '#ewReplayControls .ewr-prog { width: 120px; height: 4px; background: rgba(120,140,180,0.25);',
                    '  border-radius: 2px; overflow: hidden; }',
                    '#ewReplayControls .ewr-prog > div { height: 100%; width: 0%; background: #55d38a; }',
                    '#ewReplayEnd { position: fixed; inset: 0; z-index: 6005; display: flex; flex-direction: column;',
                    '  align-items: center; justify-content: center; gap: 14px; background: rgba(4,6,12,0.72); }',
                    '#ewReplayEnd .ewr-title { font-family: "DotGothic16", monospace; font-size: 30px; color: #fff;',
                    '  letter-spacing: 0.22em; text-transform: uppercase; text-shadow: 0 0 18px rgba(85,211,138,0.5); }',
                    '#ewReplayEnd .ewr-sub { font-family: "DotGothic16", monospace; font-size: 14px; color: #8a93a8; }',
                    '#ewReplayEnd .ewr-row { display: flex; gap: 10px; margin-top: 8px; }',
                    '#ewReplayEnd button { background: rgba(30,36,54,0.95); color: #cfd6e6; font-size: 14px;',
                    '  border: 1px solid rgba(120,140,180,0.4); border-radius: 6px; padding: 10px 22px;',
                    '  font-family: "DotGothic16", monospace; cursor: pointer; }',
                    '#ewReplayEnd button:hover { background: rgba(60,70,100,0.95); color: #fff; }',
                    '#ewReplayToast { position: fixed; top: 9vh; left: 50%; transform: translateX(-50%);',
                    '  z-index: 6010; background: rgba(8,10,18,0.92); color: #cfd6e6; padding: 9px 18px;',
                    '  border: 1px solid rgba(120,140,180,0.3); border-radius: 6px;',
                    '  font-family: "DotGothic16", monospace; font-size: 13px; pointer-events: none;',
                    '  opacity: 0; transition: opacity 0.35s ease; }'
                ].join('\n');
                var el = document.createElement('style');
                el.id = 'ewReplayCss';
                el.textContent = css;
                document.head.appendChild(el);
            }

            function _buildControls() {
                _removeControls();
                var top = document.createElement('div');
                top.className = 'ew-replay-bar top';
                top.id = 'ewReplayBarTop';
                var bot = document.createElement('div');
                bot.className = 'ew-replay-bar bottom';
                bot.id = 'ewReplayBarBottom';
                document.body.appendChild(top);
                document.body.appendChild(bot);

                var c = document.createElement('div');
                c.id = 'ewReplayControls';
                c.innerHTML =
                    '<button id="ewrPause" title="Space">⏸</button>' +
                    '<button id="ewrSpeed" title="←/→">1×</button>' +
                    '<button id="ewrRestart" title="Restart">↻</button>' +
                    '<div class="ewr-prog"><div id="ewrProgFill"></div></div>' +
                    '<span class="ewr-time" id="ewrTime">0:00 / 0:00</span>' +
                    '<button id="ewrCam" title="C — auto camera vs free camera">📷 AUTO</button>' +
                    '<button id="ewrFog" title="F — fog of war">FOG OFF</button>' +
                    '<button id="ewrBox" title="L — letterbox bars">⬛</button>' +
                    '<button id="ewrExit" title="Esc">✕ EXIT</button>';
                document.body.appendChild(c);
                document.getElementById('ewrPause').onclick = _togglePause;
                document.getElementById('ewrSpeed').onclick = function() { _cycleSpeed(1); };
                document.getElementById('ewrRestart').onclick = _restartReplay;
                document.getElementById('ewrCam').onclick = _toggleAutoCam;
                document.getElementById('ewrFog').onclick = _toggleFog;
                document.getElementById('ewrBox').onclick = _toggleLetterbox;
                document.getElementById('ewrExit').onclick = _exitReplay;
            }

            function _removeControls() {
                ['ewReplayControls', 'ewReplayBarTop', 'ewReplayBarBottom', 'ewReplayEnd'].forEach(function(id) {
                    var el = document.getElementById(id);
                    if (el) el.remove();
                });
            }

            function _armIdleWatch() {
                var reset = function() {
                    document.body.classList.remove('ew-replay-idle');
                    if (R._idleTimer) clearTimeout(R._idleTimer);
                    R._idleTimer = setTimeout(function() {
                        if (R.playing && !R.paused) document.body.classList.add('ew-replay-idle');
                    }, 2600);
                };
                R._idleReset = reset;
                window.addEventListener('mousemove', reset);
                window.addEventListener('pointerdown', reset);
                reset();
            }

            function _disarmIdleWatch() {
                if (R._idleTimer) { clearTimeout(R._idleTimer); R._idleTimer = null; }
                if (R._idleReset) {
                    window.removeEventListener('mousemove', R._idleReset);
                    window.removeEventListener('pointerdown', R._idleReset);
                    R._idleReset = null;
                }
                document.body.classList.remove('ew-replay-idle');
            }

            function _fmtTime(ms) {
                var s = Math.max(0, Math.floor(ms / 1000));
                return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
            }

            function _updateProgressUi() {
                var fill = document.getElementById('ewrProgFill');
                var time = document.getElementById('ewrTime');
                if (fill && R._durationMs > 0) {
                    fill.style.width = Math.min(100, (R.playhead / R._durationMs) * 100) + '%';
                }
                if (time) time.textContent = _fmtTime(Math.min(R.playhead, R._durationMs)) + ' / ' + _fmtTime(R._durationMs);
            }

            function _togglePause() {
                R.paused = !R.paused;
                var b = document.getElementById('ewrPause');
                if (b) b.textContent = R.paused ? '▶' : '⏸';
                if (R.paused) document.body.classList.remove('ew-replay-idle');
            }

            function _cycleSpeed(dir) {
                var i = SPEEDS.indexOf(R.speed);
                i = (i + dir + SPEEDS.length) % SPEEDS.length;
                R.speed = SPEEDS[i];
                var b = document.getElementById('ewrSpeed');
                if (b) b.textContent = R.speed + '×';
            }

            function _toggleAutoCam() {
                R.autoCam = !R.autoCam;
                var b = document.getElementById('ewrCam');
                if (b) b.textContent = R.autoCam ? '📷 AUTO' : '📷 FREE';
                _toast(R.autoCam ? 'Auto camera' : 'Free camera — drag / zoom to film your own shots', 2200);
            }

            function _toggleFog() {
                R.fogOff = !R.fogOff;
                var st = window._gameState;
                if (st) {
                    if (R.fogOff) st.fogOfWar = false;
                    else if (R.acc && R.acc.fogOfWar !== undefined) st.fogOfWar = R.acc.fogOfWar;
                    if (typeof window.render === 'function') window.render();
                }
                var b = document.getElementById('ewrFog');
                if (b) b.textContent = R.fogOff ? 'FOG OFF' : 'FOG ON';
            }

            function _toggleLetterbox() {
                R.letterbox = !R.letterbox;
                document.body.classList.toggle('ew-replay-letterbox', R.letterbox);
            }

            function _showEndCard() {
                if (!R.playing) return;
                R.paused = true;
                var old = document.getElementById('ewReplayEnd');
                if (old) old.remove();
                var st = window._gameState;
                var winner = (st && st.winner) || (R.meta && R.meta.winner);
                var names = (R.meta && R.meta.names) || {};
                var winName = winner ? (names[winner] || ('Player ' + winner)) : null;
                var div = document.createElement('div');
                div.id = 'ewReplayEnd';
                div.innerHTML =
                    '<div class="ewr-title">Replay Complete</div>' +
                    (winName ? '<div class="ewr-sub">Winner: ' + String(winName).replace(/[<>&]/g, '') + '</div>' : '') +
                    '<div class="ewr-sub">' + _fmtTime(R._durationMs) + ' · ' + ((R.meta && R.meta.rounds) ? ('Round ' + R.meta.rounds) : '') + '</div>' +
                    '<div class="ewr-row"><button id="ewrAgain">↻ Watch Again</button>' +
                    '<button id="ewrEndExit">✕ Exit Replay</button></div>';
                document.body.appendChild(div);
                document.getElementById('ewrAgain').onclick = _restartReplay;
                document.getElementById('ewrEndExit').onclick = _exitReplay;
                document.body.classList.remove('ew-replay-idle');
            }

            function _restartReplay() {
                if (!R.playing || !R.events) return;
                var end = document.getElementById('ewReplayEnd');
                if (end) end.remove();
                R.idx = 0;
                R.playhead = 0;
                R.acc = {};
                R.accUnits = {};
                R.accOrder = [];
                R._prevActiveUnit = null;
                R._endShown = false;
                R.paused = false;
                var b = document.getElementById('ewrPause');
                if (b) b.textContent = '⏸';
                _applyBaseline();
                if (typeof resetBoardCamera === 'function') { try { resetBoardCamera(true); } catch (e) {} }
                R.lastTick = performance.now();
            }

            function _exitReplay() {
                if (!R.playing) return;
                R.playing = false;
                R.paused = false;
                if (R.timer) { clearInterval(R.timer); R.timer = null; }
                window.removeEventListener('keydown', _onKeyDown, true);
                _disarmIdleWatch();
                _removeControls();
                document.body.classList.remove('ew-replay');
                document.body.classList.remove('ew-replay-letterbox');

                var st = window._gameState;
                var N = window._NET;
                if (R._saved) {
                    if (N) N.myPlayer = R._saved.myPlayer;
                    if (st && st.controllers) {
                        if (R._saved.c1 != null) st.controllers[1] = R._saved.c1;
                        if (R._saved.c2 != null) st.controllers[2] = R._saved.c2;
                    }
                    if (st) {
                        st.fogOfWar = R._saved.fogOfWar;
                        st.audioUnlocked = R._saved.audioUnlocked || st.audioUnlocked;
                    }
                    R._saved = null;
                }
                R.events = null;
                R.acc = null;
                R.accUnits = null;
                R.accOrder = null;

                if (typeof window.backToMainMenu === 'function') {
                    try { window.backToMainMenu(); } catch (e) { window.location.reload(); }
                } else {
                    window.location.reload();
                }
            }
            window._ewReplayExit = _exitReplay;

            /* ── entry-point chrome ── */

            var _toastTimer = null;
            function _toast(msg, ms) {
                var el = document.getElementById('ewReplayToast');
                if (!el) {
                    _injectReplayCss();
                    el = document.createElement('div');
                    el.id = 'ewReplayToast';
                    document.body.appendChild(el);
                }
                el.textContent = msg;
                /* force a style flush so back-to-back toasts re-fade */
                void el.offsetWidth;
                el.style.opacity = '1';
                if (_toastTimer) clearTimeout(_toastTimer);
                _toastTimer = setTimeout(function() { el.style.opacity = '0'; }, ms || 3200);
            }

            /* "🎬 Watch Replay" on the victory screen — injected (not in the
               static HTML) because _restoreResultOverlayButtons rewrites
               #vicBottom wholesale, and because it should only appear when a
               recording of this match actually exists. */
            function _injectVictoryReplayBtn() {
                var tries = 0;
                var iv = setInterval(function() {
                    tries++;
                    var overlay = document.getElementById('resultOverlay');
                    var bottom = document.getElementById('vicBottom');
                    if (overlay && bottom && !overlay.classList.contains('hidden')) {
                        if (!document.getElementById('ewReplayVicBtn')) {
                            var ref = document.getElementById('exportLastMatchBtn') || bottom.firstChild;
                            var b = document.createElement('button');
                            b.id = 'ewReplayVicBtn';
                            b.textContent = '🎬 Watch Replay';
                            if (ref && ref.className) b.className = ref.className;
                            b.onclick = function() { window._ewReplayLastMatch(); };
                            bottom.insertBefore(b, ref || null);
                        }
                        clearInterval(iv);
                    } else if (tries > 60) {
                        clearInterval(iv);
                    }
                }, 250);
            }

            /* console/debug hooks (also used by the offline codec self-test) */
            window._ewReplayInternals = {
                recStart: _recStart,
                captureSnap: _recCaptureSnap,
                applySnap: _applySnapEvent,
                loadSaved: _loadSavedReplay
            };
        })();
