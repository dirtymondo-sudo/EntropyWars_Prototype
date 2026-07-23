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
            if (window._NET && window._NET.socket) window._NET.socket.emit(evt, data);
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

                    if (!actingUnit || !state.actionMode) {
                        if (clickedUnit && clickedUnit.player === _myPlayer() && !clickedUnit.dead) {

                            selectUnit(clickedUnit.id);
                        } else if (clickedUnit) {
                            focusUnitPanel(clickedUnit.id);
                        }
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
                           actually accept, so the ghost never lies. */
                        if (actingUnit && typeof getMoveTiles === 'function') {
                            try {
                                var _mvTiles = getMoveTiles(actingUnit);
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
        selectUnit = function(unitId) {
            if (!_isOnline() || state._remoteAction) return _onlineOrigSelectUnit(unitId);
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
            _onlineOrigSelectUnit(unitId);
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
            if (_netOnE && _isHost() && state.phase === 'battle' && window._broadcastState) {
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
            if (_netOn && _isHost() && window._broadcastState) window._broadcastState();
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
            if (_netOn && _isHost() && sourceUnit && target) {
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
            if (_netOn && _isHost()) {
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
            if (_netOn && _isHost()) {
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
            if (_netOn && _isHost()) {
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
            if (_netOn && _isHost() && unit) {
                _emit('relay', {
                    type: 'player-turn-announce',
                    player: unit.player,
                    unitId: unit.id || null
                });
            }
        };
        window.showPlayerTurnAnnounce = showPlayerTurnAnnounce;

        const _origShowFloatingTextAtTile = showFloatingTextAtTile;
        showFloatingTextAtTile = function(x, y, textValue, kind, opts) {
            _origShowFloatingTextAtTile(x, y, textValue, kind, opts);
            var _netOn = window._NET && window._NET.online;
            if (_netOn && _isHost() && state.phase === 'battle') {
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
            if (_netOn && _isHost() && unit && state.phase === 'battle') {
                _emit('relay', {
                    type: 'unit-fall-follow',
                    unitId: unit.id,
                    duration: (opts && opts.duration) || 0
                });
            }
        };
        window.followUnitFall = followUnitFall;

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
            if (_netOn && _isHost() && fromPoint && toPoint && state.phase === 'battle') {
                _emit('relay', {
                    type: 'dash-cam-follow',
                    fromX: fromPoint.x, fromY: fromPoint.y,
                    toX: toPoint.x, toY: toPoint.y,
                    duration: (opts && opts.duration) || 0,
                    casterId: (opts && opts.casterId) || null
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
                if (_netOn && _isHost() && target && spell && state.phase === 'battle') {
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
                if (_netOn && _isHost() && target && spell && state.phase === 'battle') {
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
                    case 'triggerEndTurn':
                        if (data._selectedUnitId) state.selectedUnitId = data._selectedUnitId;
                        triggerEndTurn();
                        break;
                    case 'useRosterItem':
                        useRosterItemButton(data.unitId, data.itemKey);
                        break;
                    case 'forfeit':
                        state.winner = data.player === 2 ? 1 : 2;
                        addLog('Player ' + data.player + ' forfeits the match.');
                        checkWin();
                        break;
                    case 'recall': {
                        var recallUnit = state.units.find(function(u) { return u.id === data.unitId; });
                        if (recallUnit && typeof doRecall === 'function') doRecall(recallUnit);
                        break;
                    }
                    case 'toggleAuto':
                        if (data.player >= 1 && data.player <= 2) {
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

                if (typeof applyGameMode === 'function') {
                    applyGameMode(_net.matchMapModeId);
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
                    if (typeof applyGameMode === 'function') {
                        applyGameMode(fc.mapId);
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
            if (data.builds) state.partyBuilds[2] = data.builds;
            if (data.loadouts) state.loadouts[2] = data.loadouts;
            if (data.name && state.partyNames) state.partyNames[2] = data.name;
            if (data.meta && state.partyMeta) state.partyMeta[2] = data.meta;

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
        window._rawApplyGameMode = applyGameMode;

        window.focusBoardCameraOnTiles = focusBoardCameraOnTiles;
        window.resetBoardCamera = resetBoardCamera;
        window.playOffensiveActionCamera = playOffensiveActionCamera;
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
            if (_netOnline && _isHost() && unit && path && path.length > 0) {
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
            if (_netOnline && _isHost() && unit) {
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
            if (_netOnline && _isHost() && unit) {
                _emit('relay', {
                    type: 'strike-leap',
                    unitId: unit.id,
                    tx: tx, ty: ty
                });
            }
            return _origAnimateStrikeLeap(unit, tx, ty, opts);
        };

        const _origPlaySfx = playSfx;
        playSfx = function(key, opts) {
            _origPlaySfx(key, opts);
            var _netOn = window._NET && window._NET.online;
            if (_netOn && _isHost() && state.phase === 'battle' && key) {
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
                if (_netOn && _isHost() && unit && !(hooks && hooks.remote)) {
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
                if (_netOn && _isHost() && initiator && partner && target && !(T && T.remote)) {
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
                if (_netOn && _isHost()) {

                    var safeParams = {};
                    if (params) {
                        ['tx', 'ty', 'tz', 'fromX', 'fromY', 'dx', 'dy', 'range',
                         'spellType', 'casterX', 'casterY', 'aoeRadius', 'cx', 'cy',
                         'toX', 'toY', 'fromZ', 'toZ', 'flyMs', 'headGlow',
                         'staggerMs', 'includePrimary'].forEach(function(k) {
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

                NET.socket.on('relay', function(data) {
                    var st = window._gameState;
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

                    if (data.type === 'game-mode' && NET.role === 'guest') {
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

                    if (data.type === 'multiplayer-mode' && NET.role === 'guest') {
                        if (data.modeId) {
                            activeMultiplayerMode = data.modeId;
                        }
                        if (typeof window.addLog === 'function') window.addLog('Host selected mode: ' + (data.modeId || '?'));
                        if (typeof window.render === 'function') window.render();
                    }

                    if (data.type === 'camera-events' && NET.role === 'guest') {
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

                    if (data.type === 'announcement' && NET.role === 'guest') {
                        if (typeof window.showAnnouncementBanner === 'function') {
                            window.showAnnouncementBanner(data.title, data.subtitle, data.kind, function() {});
                        }
                    }

                    if (data.type === 'turn-banner' && NET.role === 'guest') {
                        if (typeof window.showTurnBanner === 'function') {
                            var blitzUnit = null;
                            if (data.blitzUnitId && st && st.units) {
                                blitzUnit = st.units.find(function(u) { return u.id === data.blitzUnitId; }) || null;
                            }
                            window.showTurnBanner(data.player, data.roundNum, data.isNewRound, blitzUnit);
                        }
                    }

                    if (data.type === 'round-banner' && NET.role === 'guest') {
                        if (typeof window.showRoundBanner === 'function') {
                            window.showRoundBanner(data.roundNum, function() {});
                        }
                    }

                    if (data.type === 'player-turn-announce' && NET.role === 'guest') {
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

                    if (data.type === 'floating-text' && NET.role === 'guest') {
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

                    if (data.type === 'unit-fall-follow' && NET.role === 'guest') {
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

                    if (data.type === 'dash-cam-follow' && NET.role === 'guest') {
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
                                { duration: data.duration || 0, _fogAllowed: true }
                            );
                        }
                    }

                    if (data.type === 'walk-anim' && NET.role === 'guest') {
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

                    if (data.type === 'jump-anim' && NET.role === 'guest') {
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

                    if (data.type === 'strike-leap' && NET.role === 'guest') {
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

                    if (data.type === 'sfx' && NET.role === 'guest') {
                        if (data.key && typeof window.playSfx === 'function') {
                            window.playSfx(data.key);
                        }
                    }

                    /* Sky-throw grab: replay the lift-and-hold (+ saucer for the
                       grey beam) on the guest. Fog gate on the VICTIM's tile —
                       a hidden enemy's grab must not telegraph its position. */
                    if (data.type === 'sky-grab-fx' && NET.role === 'guest') {
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
                    if (data.type === 'sky-throw-fx' && NET.role === 'guest') {
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

                    if (data.type === 'vfx3d' && NET.role === 'guest') {
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

                    /* Entropy Strike: replay the FULL team-attack cinematic
                       (banner, caster cut-in panels, sigils, per-enemy
                       strikes, whiteout) on the guest. Cosmetic only — no
                       applyHit, damage arrives via state-sync; sfx muted
                       because the host's 'sfx' relay already carries them.
                       Fog gating happens inside _ewsPlayCinematic per
                       anchor, against THIS viewer's visible-tile set. */
                    if (data.type === 'entropy-cine' && NET.role === 'guest') {
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
                    if (data.type === 'combo-cine' && NET.role === 'guest') {
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

                    if (data.type === 'pickup-dialog' && NET.role === 'guest') {
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
                });
            }

            function _serializeState() {
                var st = window._gameState;
                if (!st) return null;
                var s = {};
                var skip = {
                    _aiSafetyTimer: 1,
                    currentMusic: 1,
                    _remoteAction: 1,

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

                    _fogAnchorUnitId: 1,
                    _fogRevealTiles: 1,

                    showPlayer2Builder: 1,

                    uiDialog: 1,

                    _pendingRemotePickup: 1,
                    _guestResultShown: 1,
                    _guestBoardBuilt: 1,

                    _actionExecuting: 1,

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
                    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
                        var obj = {};
                        for (var k2 in val) {
                            if (!val.hasOwnProperty(k2)) continue;
                            if (val[k2] instanceof Set) obj[k2] = {
                                _t: 'S',
                                v: Array.from(val[k2])
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

            function _deserializeInto(target, s) {
                for (var key in s) {
                    if (!s.hasOwnProperty(key)) continue;
                    var val = s[key];
                    if (val && typeof val === 'object' && val._t === 'S') {
                        target[key] = new Set(val.v);
                    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
                        if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
                            for (var k2 in val) {
                                if (!val.hasOwnProperty(k2)) continue;
                                if (val[k2] && typeof val[k2] === 'object' && val[k2]._t === 'S') {
                                    target[key][k2] = new Set(val[k2].v);
                                } else {
                                    target[key][k2] = val[k2];
                                }
                            }
                        } else {
                            target[key] = val;
                        }
                    } else {
                        target[key] = val;
                    }
                }
            }

            window._broadcastState = function() {
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
                '_skyThrowDestKey'
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
                                    if (typeof selectUnit === 'function') selectUnit(targetUnit.id);
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
                                        if (typeof selectUnit === 'function') selectUnit(myU.id);
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
