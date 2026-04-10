// ── ENTROPY WARS: Battle System ──
// Combat, spells, damage, camera, turns, AI integration

        function rollStatusApply(sourceUnit, targetUnit, baseChance = 1) {
            const chance = Math.max(0.05, Math.min(0.95, baseChance + getDebuffIntModifier(sourceUnit, targetUnit)));
            return Math.random() <= chance;
        }

        function getHourglassPower(unit) {
            // Personal stacking buff: +1 ATK per hourglass THIS unit has collected
            return unit?.hourglassBuff || 0;
        }

        function getHourglassMoveBonus(unit) {
            // +1 MOV per 2 hourglasses THIS unit has collected
            return Math.floor((unit?.hourglassBuff || 0) / 2);
        }

        function getHourglassDamageReduction(unit) {
            // +1 DEF per hourglass THIS unit has collected
            return unit?.hourglassBuff || 0;
        }

        function getEffectiveMove(unit) {
            const weatherMod = getWeatherStatMod(unit).move || 0;
            const floorMoveBonus = getSectionBuffs(unit).move || 0;
            const base = Math.max(1, (unit.move || 1) + getHourglassMoveBonus(unit) + getStatusMoveDelta(unit) + (getTerrainPreferenceModifier(unit).move || 0) + weatherMod + floorMoveBonus);
            let total = Math.max(1, Math.round(base * getZodiacBonus(unit).mult));
            // ── Zone of Control: halve movement when adjacent to an enemy ──
            if (unit && !unit.dead && state.phase === 'battle') {
                const enemies = aliveUnitsFor(enemyOf(unit.player));
                const inZOC = enemies.some(e =>
                    true &&
                    Math.abs(e.x - unit.x) <= 1 && Math.abs(e.y - unit.y) <= 1
                );
                if (inZOC) total = Math.max(1, Math.floor(total / 2));
            }
            return total;
        }

        function getEffectiveRange(unit) {
            if (!unit) return 1;
            const weatherMod = getWeatherStatMod(unit).rng || 0;
            const mountainBonus = (isOnMountain(unit) && unitHasClimbingBoots(unit)) ? 1 : 0;
            const overclockRangeBonus = (unitHasStatus(unit, 'overclock') && unit.types && unit.types.includes('tech')) ? 1 : 0;
            const camoRangeBonus = unitHasStatus(unit, 'invisible') ? 1 : 0;
            return Math.max(1, (unit.range || 1) + 1 + weatherMod + mountainBonus + overclockRangeBonus + camoRangeBonus);
        }


        function renderStatusIcon(key, size = 'sm', altText = '') {
            const meta = STATUS_META[key] || {};
            const cls = size === 'sm' ? 'status-icon-sm' : 'status-icon';
            const alt = escapeHtml(altText || meta.label || key || 'icon');
            if (meta.iconSrc) return `<img class="${cls}" src="${meta.iconSrc}" alt="${alt}" title="${alt}">`;
            return `<span class="status-glyph-fallback ${cls}" aria-label="${alt}" title="${alt}">${escapeHtml(meta.icon || meta.glyph || '•')}</span>`;
        }

        function ensureUnitStatus(unit) {
            if (!unit) return {};
            if (!unit.status || typeof unit.status !== 'object') unit.status = {};
            return unit.status;
        }

        function getStatusValue(unit, key) {
            return Number(ensureUnitStatus(unit)[key] || 0);
        }

        function getActiveStatusKeys(unit) {
            return Object.keys(ensureUnitStatus(unit)).filter(key => getStatusValue(unit, key) > 0 && STATUS_DEFS[key]);
        }

        function clearStatus(unit, key) {
            if (!unit?.status) return;
            delete unit.status[key];
        }

        function getStatusArmorDelta(unit) {
            return getActiveStatusKeys(unit).reduce((sum, key) => sum + (STATUS_DEFS[key]?.armorDelta || 0), 0);
        }

        function getStatusAtkDelta(unit) {
            return getActiveStatusKeys(unit).reduce((sum, key) => sum + (STATUS_DEFS[key]?.atkDelta || 0), 0);
        }

        function getStatusMoveDelta(unit) {
            return getActiveStatusKeys(unit).reduce((sum, key) => sum + (STATUS_DEFS[key]?.moveDelta || 0), 0);
        }

        function getStatusMpCostDelta(unit) {
            return getActiveStatusKeys(unit).reduce((sum, key) => sum + (STATUS_DEFS[key]?.mpCostDelta || 0), 0);
        }

        function getStatusRangedDamageTakenMultiplier(unit) {
            return getActiveStatusKeys(unit).reduce((mult, key) => mult * (STATUS_DEFS[key]?.rangedMult || 1), 1);
        }

        function getStatusEntries(unit) {
            const entries = [];
            if (!unit) return entries;
            // Status effects (burn, poison, stun, etc.) are shown via _buildStatusAnimOverlay,
            // so exclude them from the chip strip. Only debuffs/buffs/other get chips.
            for (const key of getActiveStatusKeys(unit)) {
                if (_STATUS_EFFECT_IDS.has(key)) continue;
                const meta = STATUS_DEFS[key];
                const value = getStatusValue(unit, key);
                entries.push({
                    key,
                    text: `${meta.label} ${value}`.trim()
                });
            }
            if (unit.shield > 0) entries.push({
                key: 'shield',
                text: `Shield ${unit.shield}`
            });
            if (unit.hourglasses > 0) entries.push({
                key: 'hourglass',
                text: `Carrying ×${unit.hourglasses}`
            });
            const unitBuff = unit.hourglassBuff || 0;
            if (unitBuff > 0) entries.push({
                key: 'hourglass',
                text: `Temporal Buff Lv.${unitBuff}: +${unitBuff} ATK, +${unitBuff} DEF, +${Math.floor(unitBuff/2)} MOV`
            });
            if ((unit._killStreak || 0) >= 2) entries.push({
                key: 'damage',
                text: `🔥 ${unit._killStreak} Kill Streak (+${unit._streakAtkBonus || 0} ATK)`
            });
            if (unit._lastStandTriggered && !unit.dead) entries.push({
                key: 'damage',
                text: `💢 Last Stand (+${unit._lastStandAtkBonus || 0} ATK)`
            });
            return entries;
        }

        function getStatusLabels(unit) {
            return getStatusEntries(unit).map(entry => entry.text.replace(/\s+\d+$/, ''));
        }

        function getStatusChips(unit) {
            return getStatusEntries(unit).map(entry => renderStatusIcon(entry.key, 'sm', entry.text));
        }


        function iconBadge(key, text = '') {
            const meta = STATUS_META[key] || {
                icon: '•',
                short: key
            };
            const label = text || meta.label || key;
            return `<span class="inline-icon-badge">${renderStatusIcon(key, 'sm', label)}${escapeHtml(label)}</span>`;
        }

        function decorateTextWithIcons(text) {
            return escapeHtml(text)
                .replace(/\bBurn(?:ing)?\b/g, m => iconBadge('burn', m))
                .replace(/\bSlow(?:ed)?\b/g, m => iconBadge('slow', m))
                .replace(/\bSilence(?:d)?\b/g, m => iconBadge('silence', m))
                .replace(/\bMarked\b/g, m => iconBadge('marked', m))
                .replace(/\bStun(?:ned)?\b/gi, m => iconBadge('stun', m))
                .replace(/\bStagger(?:ed)?\b/gi, m => iconBadge('stagger', m))
                .replace(/\bPoison(?:ed)?\b/gi, m => iconBadge('poison', m))
                .replace(/\bGuard Break\b/gi, m => iconBadge('guardBreak', m))
                .replace(/\bGuard(?:ing)\b/gi, m => iconBadge('guarding', m))
                .replace(/\bOverclock(?:ed)?\b/gi, m => iconBadge('overclock', m))
                .replace(/\bInspired\b/gi, m => iconBadge('inspired', m))
                .replace(/\bDiscord(?:ant)?\b/gi, m => iconBadge('discord', m))
                .replace(/\bJammed\b/gi, m => iconBadge('jammed', m))
                .replace(/\bDrowning\b/gi, m => iconBadge('drowning', m))
                .replace(/\bProtect(?:ed)?\b/gi, m => iconBadge('protect', m))
                .replace(/\bGlare(?:d)?\b/gi, m => iconBadge('glare', m))
                .replace(/\bshield\b/gi, m => iconBadge('shield', m))
                .replace(/⏳(\d+)?/g, (_, n) => iconBadge('hourglass', n ? `Hourglass ×${n}` : 'Hourglass'))
                .replace(/\bHP\b/g, m => iconBadge('heal', m))
                .replace(/\bMP\b/g, m => iconBadge('mana', m));
        }

        function escapeRegex(text) {
            return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        function colorizeCombatLogText(htmlText) {
            let output = htmlText;

            output = output
                .replace(/\bPlayer 1\b(?=(?:'s)?\s+(?:turn|wins?|won|party|auto mode|forfeits?|goes first|is computer-controlled))/g, '<span class="ally-text">Player 1</span>')
                .replace(/\bPlayer 2\b(?=(?:'s)?\s+(?:turn|wins?|won|party|auto mode|forfeits?|goes first|is computer-controlled))/g, '<span class="enemy-text">Player 2</span>')
                .replace(/\bTemporal scan\b/g, '<span class="hourglass-text">Temporal scan</span>')
                .replace(/\bhourglasses?\b/gi, m => `<span class="hourglass-text">${m}</span>`)
                .replace(/It's super effective!/g, '<span style="color:#55d38a;font-weight:700">It\'s super effective!</span>')
                .replace(/It wasn't very effective\.\.\./g, '<span style="color:#a9b0d0;font-style:italic">It wasn\'t very effective...</span>')
                .replace(/CRITICAL HIT/g, '<span style="color:#ffd166;font-weight:900">CRITICAL HIT</span>')
                .replace(/\bDODGE!\b/g, '<span style="color:#85a9ff;font-weight:700">DODGE!</span>')
                .replace(/\bOVERKILL\b/g, '<span style="color:#b78cff;font-weight:900">OVERKILL</span>')
                .replace(/\bLAST STAND\b/g, '<span style="color:#ff6b6b;font-weight:900">LAST STAND</span>')
                .replace(/\b(Double Kill!|Triple Kill!|Rampage!|GODLIKE!)\b/g, m => `<span style="color:#f8d66d;font-weight:900">${m}</span>`)
                .replace(/\bis defeated\b/g, '<span style="color:#ff6b6b;font-weight:700">is defeated</span>');

            const viewer = getViewerPlayer();
            const labels = [];
            (state.units || []).forEach(unit => {
                if (!unit) return;
                const displayLabel = unitDisplayName(unit);
                if (!displayLabel) return;
                const sideClass = unit.player === viewer ? 'ally-text' : 'enemy-text';
                labels.push({
                    label: displayLabel,
                    sideClass
                });
            });

            labels
                .sort((a, b) => b.label.length - a.label.length)
                .forEach(({
                    label,
                    sideClass
                }) => {
                    const pattern = new RegExp(`(^|[^>\\w])(${escapeRegex(label)})(?=$|[^<\\w])`, 'g');
                    output = output.replace(pattern, (match, prefix, found) => `${prefix}<span class="${sideClass}">${escapeHtml(found)}</span>`);
                });

            return output;
        }

        function formatCombatLogLine(text) {
            return colorizeCombatLogText(decorateTextWithIcons(text));
        }

        function removeDebuffs(unit) {
            if (!unit || !unit.status) return 0;
            let removed = 0;
            Object.keys(STATUS_DEFS).forEach(key => {
                if (unit.status[key] > 0) removed += 1;
                unit.status[key] = 0;
            });
            return removed;
        }

        function applyStatusPayload(target, payload = {}, sourceLabel = '', sourceUnit = null) {
            if (!target || target.dead || !payload?.id || !STATUS_DEFS[payload.id]) return false;
            const status = ensureUnitStatus(target);
            const meta = STATUS_DEFS[payload.id];
            const isEnemyDebuff = !!sourceUnit && sourceUnit.player !== target.player && meta.kind === 'debuff';
            if (isEnemyDebuff) {
                const chance = getStatusApplyChance(sourceUnit, target, payload);
                if (Math.random() > chance) {
                    addLog(`${sourceLabel}${unitDisplayName(target)} resists ${meta.label}.`);
                    return false;
                }
            }
            const nextValue = Math.max(1, Number(payload.duration ?? payload.value ?? 1));
            if (meta.stack === 'replace') {
                status[payload.id] = nextValue;
            } else {
                status[payload.id] = Math.max(Number(status[payload.id] || 0), nextValue);
            }
            if (payload.bonusDamage && payload.id === 'marked') {
                target.markBonus = Math.max(Number(target.markBonus || 0), Number(payload.bonusDamage || 0));
            }
            addLog(`${sourceLabel}${unitDisplayName(target)} is ${meta.colorText || meta.label.toLowerCase()}.`);
            // Track status conditions
            if (!target._statusLog) target._statusLog = {};
            target._statusLog[payload.id] = (target._statusLog[payload.id] || 0) + 1;
            if (sourceUnit) {
                if (!sourceUnit._statusesApplied) sourceUnit._statusesApplied = {};
                sourceUnit._statusesApplied[payload.id] = (sourceUnit._statusesApplied[payload.id] || 0) + 1;
                // ── XP: buff or debuff applied ──
                const meta = STATUS_DEFS[payload.id];
                const isBeneficial = meta && (meta.kind === 'buff' || meta.category === 'buff' || meta.category === 'status' && meta.kind === 'buff');
                if (sourceUnit.player === target.player && isBeneficial) {
                    grantXP(sourceUnit, XP_BUFF_APPLIED, 'buff');
                    // Track buff source on target for buff-assist XP
                    if (!target._xpBuffSources) target._xpBuffSources = {};
                    target._xpBuffSources[sourceUnit.id] = (target._xpBuffSources[sourceUnit.id] || 0) + 1;
                } else if (sourceUnit.player !== target.player) {
                    grantXP(sourceUnit, XP_DEBUFF_APPLIED, 'debuff');
                }
            }
            return true;
        }

        function applyStatusEffects(target, status = {}, sourceLabel = '', sourceUnit = null) {
            if (!target || target.dead || !status) return;
            if (Array.isArray(status)) {
                status.forEach(payload => applyStatusPayload(target, payload, sourceLabel, sourceUnit));
                return;
            }
            for (const [key, value] of Object.entries(status)) {
                if (!value) continue;
                const payload = typeof value === 'number' ? {
                    id: key,
                    duration: value
                } : {
                    ...(value || {}),
                    id: key
                };
                applyStatusPayload(target, payload, sourceLabel, sourceUnit);
            }
        }

        // ── processTurnStartStatuses: LEGACY — no longer does DoT/HoT damage.
        // Duration decrement + onRoundEnd damage moved to processEndOfRoundStatuses.
        // This stub remains only for any stray callers; it's a no-op now.
        function processTurnStartStatuses(unit) {
            // Intentionally empty — all status processing now happens at end of round
        }

        // ══════════════════════════════════════════════════════════════
        // END-OF-ROUND STATUS EFFECT PHASE — Pokémon-style sequential
        // Camera pans to each affected unit, shows damage/heal dialogue,
        // then decrements all status durations.
        // ══════════════════════════════════════════════════════════════
        function processEndOfRoundStatuses(onDone) {
            // Collect units that have any active status effects (category 'status' only — not buffs/debuffs like overclock/slow)
            const affected = state.units.filter(u => {
                if (u.dead) return false;
                const keys = getActiveStatusKeys(u);
                return keys.some(k => {
                    const def = STATUS_DEFS[k];
                    if (!def) return false;
                    // Only process statuses that have DoT/HoT (onRoundEnd) or are in _STATUS_EFFECT_IDS
                    return def.onRoundEnd || _STATUS_EFFECT_IDS.has(k);
                });
            });

            if (!affected.length || state.devAutoSim) {
                // Fast path: no statuses to process, or dev sim — just tick durations silently
                _tickAllStatusDurations();
                if (onDone) onDone();
                return;
            }

            const viewer = getViewerPlayer();
            let idx = 0;

            function processNext() {
                if (state.winner) { if (onDone) onDone(); return; }
                if (idx >= affected.length) {
                    // All units processed — now tick durations for ALL units (including ones without onRoundEnd)
                    _tickAllStatusDurations();
                    scheduleBoardRender();
                    if (onDone) onDone();
                    return;
                }

                const unit = affected[idx++];
                if (unit.dead) { processNext(); return; }

                const activeKeys = getActiveStatusKeys(unit).filter(k => _STATUS_EFFECT_IDS.has(k));
                if (!activeKeys.length) { processNext(); return; }

                // Check if this unit has any onRoundEnd effects (DoT/HoT)
                const hasEffect = activeKeys.some(k => STATUS_DEFS[k]?.onRoundEnd);

                // Determine visibility
                const isVisible = _isUnitVisibleToViewer(unit, viewer);

                // ── Camera focus (if visible) ──
                if (isVisible && !state.cameraDisabled) {
                    setBoardCameraTransition(350);
                    setBoardCameraFocusPoint(unit.x, unit.y, { zoom: 1.1, _fogAllowed: true });
                }

                // ── Apply DoT/HoT effects ──
                const dlgMsgs = [];
                for (const key of activeKeys) {
                    const def = STATUS_DEFS[key];
                    if (!def?.onRoundEnd) continue;
                    const hpBefore = unit.hp;
                    def.onRoundEnd(unit);

                    if (unit.dead) {
                        dlgMsgs.push(`<span class="dlg-damage">${def.icon || '💀'} ${unitDisplayName(unit)} was killed by ${def.label || key}!</span>`);
                        break;
                    }
                    const hpLost = hpBefore - unit.hp;
                    if (hpLost > 0) {
                        dlgMsgs.push(`<span class="dlg-damage">${def.icon || '⚠'} ${unitDisplayName(unit)} takes ${hpLost} damage from ${def.label || key}!</span>`);
                        if (isVisible) {
                            showFloatingTextForUnit(unit, `-${hpLost}`, 'damage', { durationMs: 900 });
                            triggerStatusWiggle(unit);
                        }
                    } else if (hpLost < 0) {
                        dlgMsgs.push(`<span class="dlg-heal">${def.icon || '💚'} ${unitDisplayName(unit)} heals ${Math.abs(hpLost)} from ${def.label || key}</span>`);
                        if (isVisible) {
                            showFloatingTextForUnit(unit, `+${Math.abs(hpLost)}`, 'heal', { durationMs: 900 });
                        }
                    }
                }

                // If no DoT/HoT effects but unit has visible statuses, show a brief status reminder
                if (dlgMsgs.length === 0 && !hasEffect) {
                    // No dialogue needed for statuses without DoT — just move on faster
                    processNext();
                    return;
                }

                // ── Show dialogue (always, even if out of fog — Pokémon style) ──
                if (dlgMsgs.length > 0) {
                    showBattleDialogue(dlgMsgs, 1400 + dlgMsgs.length * 400);
                }

                scheduleBoardRender();

                // Check for kills
                if (unit.dead) {
                    checkWin();
                    if (state.winner) { if (onDone) onDone(); return; }
                }

                // Delay before next unit
                const delay = dlgMsgs.length > 0 ? (1200 + dlgMsgs.length * 350) : 400;
                window.setTimeout(processNext, delay);
            }

            processNext();
        }

        // ── Helper: check if a unit is visible to the viewer (fog of war aware) ──
        function _isUnitVisibleToViewer(unit, viewer) {
            if (!state.fogOfWar) return true;
            if (unit.player === viewer) return true;
            // Check if any friendly unit can see this enemy
            const friendlies = state.units.filter(u => !u.dead && u.player === viewer);
            for (const f of friendlies) {
                const dist = Math.abs(f.x - unit.x) + Math.abs(f.y - unit.y);
                const awr = f.awr || 3;
                if (dist <= awr) return true;
            }
            // Check vision wards
            if (state._visionWards?.length) {
                for (const w of state._visionWards) {
                    if (w.player === viewer) {
                        const dist = Math.abs(w.x - unit.x) + Math.abs(w.y - unit.y);
                        if (dist <= (w.radius || 3)) return true;
                    }
                }
            }
            return false;
        }

        // ── Tick all status durations for every alive unit ──
        function _tickAllStatusDurations() {
            for (const u of state.units) {
                if (u.dead) continue;
                for (const key of [...getActiveStatusKeys(u)]) {
                    // Only tick statuses in the _STATUS_EFFECT_IDS set (true status effects)
                    // Buffs/debuffs like overclock, inspired, slow etc. still tick via their own systems
                    const def = STATUS_DEFS[key];
                    if (!def) continue;
                    const next = getStatusValue(u, key) - 1;
                    if (next > 0) u.status[key] = next;
                    else {
                        clearStatus(u, key);
                        addLog(`${def.icon || '✓'} ${unitDisplayName(u)}'s ${def.label || key} wore off.`);
                    }
                }
            }
        }

        function unitHasStatus(unit, key) {
            return getStatusValue(unit, key) > 0;
        }

        function focusUnitPanel(unitOrId, flashKind = null, source = 'program') {
            const unitId = typeof unitOrId === 'string' ? unitOrId : unitOrId?.id;
            if (!unitId) return;
            const changed = state.focusedUnitId !== unitId;
            if (source !== 'hover' && changed) playSfx('uiCursorMove');
            state.focusedUnitId = unitId;
            // Auto-switch floor when clicking a unit in the roster (not on hover)
            let floorChanged = false;
            if (source !== 'hover' ) {
                const u = state.units.find(u => u.id === unitId);
                if (false) { // floor switch removed
                    
                    floorChanged = true;
                }
            }
            if (source === 'hover') {
                state.hoverUnitId = unitId;
                if (flashKind) flashSelectedUnitPanel(flashKind);
                return;
            }
            // During AI turns, skip the expensive board rebuild — just update panels
            if (floorChanged) {
                render();
            } else if (state.aiThinking) {
                renderBattleSelectionUI({
                    includeBoard: false
                });
            } else {
                renderBattleSelectionUI();
            }
            if (flashKind) flashSelectedUnitPanel(flashKind);
        }

        function flashSelectedUnitPanel(kind = 'damage') {
            // PERF: skip panel flash during devsim
            if (state.devAutoSim) return;
            state.selectedPanelFlash = kind;
            renderSelectedUnitPanel();
            window.setTimeout(() => {
                state.selectedPanelFlash = null;
                renderSelectedUnitPanel();
            }, kind === 'heal' ? 450 : 420);
        }

        function flashUnit(unitId, kind = 'hit') {
            if (_bufferingRoundEvents) {
                _rePushEvent({ type: 'flash', unitId, kind });
                return;
            }
            _realFlashUnit_impl(unitId, kind);
        }
        function _realFlashUnit_impl(unitId, kind = 'hit') {
            if (state.animationsDisabled || state.devAutoSim) {
                focusUnitPanel(unitId, kind === 'heal' ? 'heal' : 'damage');
                return;
            }
            const setRef = kind === 'heal' ? state.healFlashIds : state.hitFlashIds;
            setRef.add(unitId);
            focusUnitPanel(unitId, kind === 'heal' ? 'heal' : 'damage');
            window.setTimeout(() => {
                setRef.delete(unitId);
                scheduleBoardRender();
                renderSelectedUnitPanel();
            }, kind === 'heal' ? 450 : 420);
        }

        // ── STATUS AFFLICTION WIGGLE: shake a unit when their turn starts with debuffs ──
        function triggerStatusWiggle(unit) {
            if (!unit || unit.dead || state.animationsDisabled || state.devAutoSim) return;
            state.statusWiggleIds.add(unit.id);
            scheduleBoardRender();
            window.setTimeout(() => {
                state.statusWiggleIds.delete(unit.id);
                scheduleBoardRender();
            }, 650);
        }

        // ── BATTLE DIALOGUE: shows important combat info as a floating subtitle ──
        function showBattleDialogue(messages, duration) {
            if (!messages || messages.length === 0) return;
            if (state.devAutoSim) return;
            if (_bufferingRoundEvents) {
                _rePushEvent({ type: 'dialogue', messages: [...messages], duration });
                return;
            }
            _realShowBattleDialogue_impl(messages, duration);
        }
        function _realShowBattleDialogue_impl(messages, duration) {
            if (!messages || messages.length === 0) return;
            if (state.devAutoSim) return;
            const dur = duration || (1200 + messages.length * 600);
            state.battleDialogueQueue = messages;
            // Render immediately into subtitle bar
            _renderDialogueBox(null);
            if (state.battleDialogueTimer) clearTimeout(state.battleDialogueTimer);
            state.battleDialogueTimer = setTimeout(() => {
                state.battleDialogueQueue = [];
                state.battleDialogueTimer = null;
                _lastDialogueHtml = ''; // force refresh on next render
                // Hide subtitle bar
                const bar = document.getElementById('battleSubtitleBar');
                if (bar) bar.classList.remove('visible');
                const u = getSelectedUnit();
                renderHudActions(u);
            }, dur);
        }

        function tilePixelCenter(x, y) {
            const gap = CONFIG.tileGap ?? 0;
            const pad = CONFIG.boardPadding ?? 2;
            return {
                left: pad + x * (CONFIG.tileSize + gap) + (CONFIG.tileSize / 2),
                top: pad + y * (CONFIG.tileSize + gap) + (CONFIG.tileSize / 2)
            };
        }

        function showFloatingTextAtTile(x, y, textValue, kind = 'damage', opts = {}) {
            if (_bufferingRoundEvents) {
                _rePushEvent({ type: 'floatingText', x, y, text: textValue, kind, opts: {...opts} });
                return;
            }
            _realShowFloatingTextAtTile(x, y, textValue, kind, opts);
        }
        function _realShowFloatingTextAtTile_impl(x, y, textValue, kind = 'damage', opts = {}) {
            if (!projectileLayerEl || state.phase !== 'battle') return;
            // PERF: suppress floating text during devsim
            if (state.devAutoSim) return;
            if (!isInside(x, y)) return;
            // PERF: cap total child elements to prevent DOM explosion
            while (projectileLayerEl.childElementCount > 30) {
                projectileLayerEl.firstElementChild?.remove();
            }
            const pos = tilePixelCenter(x, y);
            const el = document.createElement('div');
            const durationMs = Math.max(400, Number(opts.durationMs) || (state.animationsDisabled ? 500 : actionMs(900)));
            const jitterX = Number.isFinite(opts.jitterX) ? opts.jitterX : (Math.random() * 18 - 9);
            const jitterY = Number.isFinite(opts.jitterY) ? opts.jitterY : (Math.random() * 10 - 5);
            el.className = `floating-text ${kind}`;
            el.innerHTML = String(textValue ?? '');
            el.style.left = `${pos.left + jitterX}px`;
            el.style.top = `${pos.top + jitterY}px`;
            el.style.setProperty('--float-ms', `${durationMs}ms`);
            projectileLayerEl.appendChild(el);
            window.setTimeout(() => el.remove(), durationMs + 80);
        }

        function showFloatingTextForUnit(unit, textValue, kind = 'damage', opts = {}) {
            if (!unit) return;
            // When buffering, record even for dead units (they just died this frame)
            if (_bufferingRoundEvents) {
                _rePushEvent({ type: 'floatingText', x: unit.x, y: unit.y, text: textValue, kind, opts: {...opts} });
                return;
            }
            // Allow floating text on _dying units (they're still visible on the map)
            if (unit.dead && !unit._dying) return;
            showFloatingTextAtTile(unit.x, unit.y, textValue, kind, opts);
        }

        function applyHealingToUnit(target, amount, sourceUnit = null, opts = {}) {
            if (!target || target.dead || target._dying) return 0;
            const rawAmount = Math.max(0, Math.round(Number(amount) || 0));
            const actual = Math.min(rawAmount, Math.max(0, target.maxHp - target.hp));
            if (actual <= 0) return 0;
            target.hp = Math.min(target.maxHp, target.hp + actual);
            if (sourceUnit) sourceUnit._trackHealDone = (sourceUnit._trackHealDone || 0) + actual;
            target._trackHealReceived = (target._trackHealReceived || 0) + actual;
            // ── XP: healing (flat per heal cast, not per HP) ──
            if (sourceUnit && sourceUnit.id !== target.id) grantXP(sourceUnit, XP_HEAL_FLAT, 'heal');
            flashHeal(target);
            showFloatingTextForUnit(target, `+${actual}`, opts.kind || 'heal', opts);
            return actual;
        }

        /* ── SCREEN SHAKE ────────────────────────────── */
        function shakeBoard(intensity = 'normal') {
            if (state.animationsDisabled || !boardStageEl) return;
            if (state.devAutoSim) return;
            if (_bufferingRoundEvents) {
                _rePushEvent({ type: 'shake', intensity });
                return;
            }
            _realShakeBoard_impl(intensity);
        }
        function _realShakeBoard_impl(intensity = 'normal') {
            if (state.animationsDisabled || !boardStageEl) return;
            if (state.devAutoSim) return;
            // Apply shake to the inner #board element, NOT #boardStage.
            // boardStageEl.style.transform is owned by the camera system —
            // a CSS animation on the same property wipes out the zoom/pan.
            const shakeTarget = boardEl || boardStageEl;
            shakeTarget.classList.remove('board-shake', 'board-shake-hard');
            // Use rAF to restart animation without forced reflow
            requestAnimationFrame(() => {
                shakeTarget.classList.add(intensity === 'hard' ? 'board-shake-hard' : 'board-shake');
            });
            const dur = intensity === 'hard' ? 400 : 300;
            window.setTimeout(() => shakeTarget.classList.remove('board-shake', 'board-shake-hard'), dur);
        }

        /* ── CRITICAL HIT SYSTEM ─────────────────────── */

        // ── Bind real function references for the Round Event Sequencer ──
        _realShowFloatingTextAtTile = _realShowFloatingTextAtTile_impl;
        _realShowDeathBanner = _realShowDeathBanner_impl;
        _realShakeBoard = _realShakeBoard_impl;
        _realFlashUnit = _realFlashUnit_impl;
        _realShowBattleDialogue = _realShowBattleDialogue_impl;
        _realShowCombatBanner = _realShowCombatBanner_impl;

        function getCritChance(unit) {
            if (!unit) return 0;
            const baseChance = 0.08;
            const awrBonus = Math.min(0.12, (getEffectiveAwr(unit) || 0) * 0.015);
            const intBonus = Math.min(0.06, (getEffectiveInt(unit) || 0) * 0.004);
            return Math.min(0.30, baseChance + awrBonus + intBonus);
        }

        function getCritMultiplier(unit) {
            const base = 1.8;
            return unit?.cls === 'Gunslinger' ? base + 0.2 : base;
        }

        function rollCrit(unit) {
            return Math.random() < getCritChance(unit);
        }

        /* ── EVASION SYSTEM ──────────────────────────── */
        function getEvasionChance(unit) {
            if (!unit) return 0;
            const baseChance = 0.06;
            const moveBonus = Math.min(0.10, (getEffectiveMove(unit) || 0) * 0.018);
            const stunned = getActiveStatusKeys(unit).some(k => STATUS_DEFS[k]?.skipTurn);
            if (stunned) return 0;
            return Math.min(0.25, baseChance + moveBonus);
        }

        function rollEvasion(target) {
            return Math.random() < getEvasionChance(target);
        }

        /* ── COUNTER-ATTACK SYSTEM ───────────────────── */
        function getCounterChance(unit) {
            if (!unit || unit.dead) return 0;
            let base = 0.12;
            if (unit.cls === 'Knight') base = 0.30;
            else if ((unit.def || 0) >= 12) base = 0.20;
            // Guard stance bonus
            if (unit._guardCounterBonus) base += unit._guardCounterBonus;
            return Math.min(0.75, base); // cap at 75%
        }

        function rollCounter(unit) {
            if (!unit || unit.dead) return false;
            // Stunned units cannot counter
            const stunned = getActiveStatusKeys(unit).some(k => STATUS_DEFS[k]?.skipTurn);
            if (stunned) return false;
            return Math.random() < getCounterChance(unit);
        }

        function getCounterDamage(unit) {
            return Math.max(24, Math.floor((unit.atk || 0) * 0.4) + randInt(24));
        }

        /* ── KILL STREAK SYSTEM ──────────────────────── */
        // Killstreak = kills across multiple turns without dying
        const STREAK_LABELS = {
            2: {
                text: 'Killstreak!',
                icon: '⚔️'
            },
            3: {
                text: 'Mega Streak!',
                icon: '🔥'
            },
            4: {
                text: 'Rampage!',
                icon: '💀'
            },
            5: {
                text: 'GODLIKE!',
                icon: '👑'
            }
        };

        // Same-turn multi-kill labels (Double Kill, Triple Kill)
        const MULTIKILL_LABELS = {
            2: {
                text: 'Double Kill!',
                icon: '⚔️'
            },
            3: {
                text: 'Triple Kill!',
                icon: '🔥'
            },
            4: {
                text: 'Quadra Kill!',
                icon: '💀'
            },
            5: {
                text: 'PENTA KILL!',
                icon: '👑'
            }
        };

        function processKillStreak(killer) {
            if (!killer || killer.dead) return;
            killer._killStreak = (killer._killStreak || 0) + 1;
            killer._matchKills = (killer._matchKills || 0) + 1;
            // ── Same-turn multi-kill tracking ──
            killer._turnKills = (killer._turnKills || 0) + 1;
            // ── Track team kills for multiplayer modes ──
            if (state.matchKills) {
                state.matchKills[killer.player] = (state.matchKills[killer.player] || 0) + 1;
            }
            // ── Sudden Death: next kill wins ──
            if (state.suddenDeathActive) {
                const mpMode = getActiveMultiplayerMode();
                if (mpMode.tiebreaker === 'sudden_death_kill') {
                    state.winner = killer.player;
                    state._winCondition = 'sudden_death';
                }
            }
            // ── Same-turn multi-kill banner (Double Kill, Triple Kill) ──
            const turnKills = killer._turnKills;
            if (turnKills >= 2) {
                const mkLabel = MULTIKILL_LABELS[Math.min(turnKills, 5)];
                if (mkLabel) {
                    addLog(`${mkLabel.icon} ${unitDisplayName(killer)}: ${mkLabel.text} (${turnKills} kills this turn!)`);
                    showFloatingTextForUnit(killer, mkLabel.text, 'streak', {
                        durationMs: 1400
                    });
                    shakeBoard(turnKills >= 4 ? 'hard' : 'normal');
                    if (turnKills === 2) checkAchievement('doubleKill', killer);
                    if (turnKills === 3) checkAchievement('tripleKill', killer);
                    if (turnKills >= 4) checkAchievement('rampage', killer);
                }
            }
            // ── Cross-turn killstreak banner (only fires if not already showing a multi-kill) ──
            const streak = killer._killStreak;
            const label = STREAK_LABELS[Math.min(streak, 5)];
            if (streak >= 2 && label && turnKills < 2) {
                addLog(`${label.icon} ${unitDisplayName(killer)}: ${label.text} (${streak} kill streak)`);
                showFloatingTextForUnit(killer, label.text, 'streak', {
                    durationMs: 1400
                });
                shakeBoard(streak >= 4 ? 'hard' : 'normal');
            }
            // Streak bonus: +1 ATK per streak level (capped at +3)
            if (streak >= 2) killer._streakAtkBonus = Math.min(3, streak - 1);
            // Track max streak for MVP
            killer._maxKillStreak = Math.max(killer._maxKillStreak || 0, streak);
        }

        function resetKillStreak(unit) {
            if (!unit) return;
            unit._killStreak = 0;
            unit._streakAtkBonus = 0;
        }

        /* ── LAST STAND MECHANIC ─────────────────────── */
        function checkLastStand(unit) {
            if (!unit || unit.dead || unit._lastStandTriggered) return;
            if (unit.hp > 0 && unit.hp <= unit.maxHp * 0.20) {
                unit._lastStandTriggered = true;
                unit._lastStandAtkBonus = 3;
                addLog(`💢 ${unitDisplayName(unit)} enters LAST STAND! (+3 ATK)`);
                showFloatingTextForUnit(unit, 'LAST STAND!', 'laststd', {
                    durationMs: 1200
                });
                // No announcement banner — floating text on the map is sufficient
                shakeBoard('normal');
                checkAchievement('lastStand', unit);
            }
        }

        /* ── OVERKILL BONUS ──────────────────────────── */
        function processOverkill(killer, target, overkillAmount) {
            if (!killer || killer.dead || overkillAmount < target.maxHp * 0.5) return;
            const mpGain = Math.min(6, Math.floor(overkillAmount / 4));
            if (mpGain > 0 && killer.maxMp > 0) {
                const actual = Math.min(mpGain, killer.maxMp - killer.mp);
                if (actual > 0) {
                    killer.mp = Math.min(killer.maxMp, killer.mp + actual);
                    showFloatingTextForUnit(killer, `+${actual} MP`, 'mp');
                }
            }
            addLog(`💥 OVERKILL! ${unitDisplayName(killer)} obliterates ${unitDisplayName(target)}!`);
            showFloatingTextForUnit(target, 'OVERKILL!', 'overkill', {
                durationMs: 1200
            });
            shakeBoard('hard');
            checkAchievement('overkill', killer);
        }

        /* ── ACHIEVEMENT SYSTEM ──────────────────────── */
        const ACHIEVEMENT_DEFS = {
            firstBlood: {
                icon: '🩸',
                name: 'First Blood',
                desc: 'Get the first kill in a match'
            },
            doubleKill: {
                icon: '⚔️',
                name: 'Double Kill',
                desc: 'Get 2 kills in the same turn with one unit'
            },
            tripleKill: {
                icon: '🔥',
                name: 'Triple Kill',
                desc: 'Get 3 kills in the same turn with one unit'
            },
            rampage: {
                icon: '💀',
                name: 'Rampage',
                desc: 'Get 4+ kills in the same turn with one unit'
            },
            overkill: {
                icon: '💥',
                name: 'Overkill',
                desc: 'Deal 50%+ of target max HP as excess damage'
            },
            lastStand: {
                icon: '💢',
                name: 'Last Stand',
                desc: 'Trigger Last Stand (drop below 20% HP)'
            },
            ace: {
                icon: '🏆',
                name: 'Ace',
                desc: 'Win a match by elimination'
            },
            untouchable: {
                icon: '🛡',
                name: 'Untouchable',
                desc: 'Win with a unit that took 0 damage'
            },
            critMaster: {
                icon: '⚡',
                name: 'Crit Master',
                desc: 'Land 3+ critical hits in one match'
            },
            comboKing: {
                icon: '🤝',
                name: 'Combo King',
                desc: 'Execute 3+ combo attacks in one match'
            },
            weatherSurvivor: {
                icon: '🌪',
                name: 'Storm Survivor',
                desc: 'Win a match with 2+ active weather events'
            },
            perfectVictory: {
                icon: '✨',
                name: 'Perfect Victory',
                desc: 'Win without losing any units'
            },
            winStreak3: {
                icon: '🔥',
                name: 'Hot Streak',
                desc: 'Win 3 matches in a row'
            },
            winStreak5: {
                icon: '🏅',
                name: 'Unstoppable',
                desc: 'Win 5 matches in a row'
            }
        };

        function loadAchievements() {
            try {
                const raw = localStorage.getItem('entropy-wars-achievements-v1');
                return raw ? JSON.parse(raw) : {};
            } catch {
                return {};
            }
        }

        function saveAchievements(achievements) {
            try {
                localStorage.setItem('entropy-wars-achievements-v1', JSON.stringify(achievements));
            } catch {}
        }

        function checkAchievement(id, unit) {
            if (!ACHIEVEMENT_DEFS[id]) return;
            const achievements = loadAchievements();
            if (achievements[id]) return; // already unlocked
            achievements[id] = {
                unlockedAt: new Date().toISOString(),
                unit: unit ? unitDisplayName(unit) : null
            };
            saveAchievements(achievements);
            // Show toast
            showAchievementToast(id);
            // Track in current match
            state._matchAchievements = state._matchAchievements || [];
            state._matchAchievements.push(id);
        }

        function showAchievementToast(id) {
            // PERF: skip toasts during devsim
            if (state.devAutoSim) return;
            const def = ACHIEVEMENT_DEFS[id];
            if (!def) return;
            const toast = document.createElement('div');
            toast.className = 'achieve-toast';
            toast.innerHTML = `<div class="achieve-toast-icon">${def.icon}</div><div><div class="achieve-toast-text">Achievement Unlocked!</div><div class="achieve-toast-sub">${def.name} — ${def.desc}</div></div>`;
            (document.getElementById("game-viewport") || document.body).appendChild(toast);
            window.setTimeout(() => toast.remove(), 4000);
        }

        /* ── CAREER STATS (localStorage) ─────────────── */
        function loadCareerStats() {
            try {
                const raw = localStorage.getItem('entropy-wars-career-v1');
                const defaults = {
                    matchesPlayed: 0,
                    wins: 0,
                    losses: 0,
                    totalKills: 0,
                    totalDamage: 0,
                    totalHealing: 0,
                    totalCrits: 0,
                    totalDodges: 0,
                    totalCounters: 0,
                    currentWinStreak: 0,
                    bestWinStreak: 0,
                    classCounts: {},
                    raceCounts: {},
                    elo: 1000,
                    peakElo: 1000,
                    eloHistory: []
                };
                if (!raw) return defaults;
                const parsed = JSON.parse(raw);
                // Backfill new fields for existing saves
                if (parsed.elo === undefined) parsed.elo = 1000;
                if (parsed.peakElo === undefined) parsed.peakElo = parsed.elo;
                if (!parsed.eloHistory) parsed.eloHistory = [];
                return parsed;
            } catch {
                return {
                    matchesPlayed: 0,
                    wins: 0,
                    losses: 0,
                    totalKills: 0,
                    totalDamage: 0,
                    totalHealing: 0,
                    totalCrits: 0,
                    totalDodges: 0,
                    totalCounters: 0,
                    currentWinStreak: 0,
                    bestWinStreak: 0,
                    classCounts: {},
                    raceCounts: {},
                    elo: 1000,
                    peakElo: 1000,
                    eloHistory: []
                };
            }
        }

        function saveCareerStats(stats) {
            try {
                localStorage.setItem('entropy-wars-career-v1', JSON.stringify(stats));
            } catch {}
        }

        // ── ELO RATING SYSTEM ──
        // Standard Elo with dynamic K-factor
        function getEloRankInfo(elo) {
            if (elo >= 2000) return { icon: '👑', name: 'Grandmaster', color: '#ffd700' };
            if (elo >= 1700) return { icon: '💎', name: 'Diamond', color: '#b9f2ff' };
            if (elo >= 1400) return { icon: '🥇', name: 'Gold', color: '#ffd700' };
            if (elo >= 1200) return { icon: '🥈', name: 'Silver', color: '#c0c0c0' };
            if (elo >= 1000) return { icon: '🥉', name: 'Bronze', color: '#cd7f32' };
            return { icon: '⚙️', name: 'Iron', color: '#888' };
        }

        function calculateEloChange(playerElo, opponentElo, playerWon) {
            const stats = loadCareerStats();
            const gamesPlayed = stats.matchesPlayed || 0;
            // K-factor: 40 for first 10 games, 32 for 10-30, 24 for 30+
            const K = gamesPlayed < 10 ? 40 : gamesPlayed < 30 ? 32 : 24;
            // Expected score using logistic curve
            const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
            const actual = playerWon ? 1 : 0;
            return Math.round(K * (actual - expected));
        }

        // Bot Elo estimation: scale with player's Elo so matchups stay interesting
        function getBotElo() {
            const stats = loadCareerStats();
            const playerElo = stats.elo || 1000;
            // Bot tracks ~50 points below player (slight underdog), clamped
            return Math.max(800, Math.min(2000, playerElo - 50 + Math.round((Math.random() - 0.5) * 60)));
        }

        // Store last Elo delta for display on result screen
        let _lastEloDelta = 0;
        let _lastEloAfter = 1000;

        function updateCareerStatsAfterMatch() {
            // Skip no-contest matches — they don't count
            if (state.winner === 0 || state.winner === null) return;
            const stats = loadCareerStats();
            stats.matchesPlayed += 1;
            const viewer = getViewerPlayer();
            const playerWon = state.winner === viewer;
            if (playerWon) {
                stats.wins += 1;
                stats.currentWinStreak += 1;
                stats.bestWinStreak = Math.max(stats.bestWinStreak, stats.currentWinStreak);
                if (stats.currentWinStreak >= 3) checkAchievement('winStreak3', null);
                if (stats.currentWinStreak >= 5) checkAchievement('winStreak5', null);
            } else {
                stats.losses += 1;
                stats.currentWinStreak = 0;
            }
            // Tally unit stats from the viewer's team
            for (const u of state.units.filter(u => u.player === viewer)) {
                stats.totalKills += u._matchKills || 0;
                stats.totalDamage += u._trackDmgDealt || 0;
                stats.totalHealing += u._trackHealDone || 0;
                stats.totalCrits += u._matchCrits || 0;
                stats.totalDodges += u._matchDodges || 0;
                stats.totalCounters += u._matchCounters || 0;
                stats.classCounts[u.cls] = (stats.classCounts[u.cls] || 0) + 1;
                stats.raceCounts[u.race] = (stats.raceCounts[u.race] || 0) + 1;
            }

            // ── Elo: ONLY update for ranked matches ──
            _lastEloDelta = 0;
            _lastEloAfter = stats.elo || 1000;
            if (state.isRankedMatch) {
                const opponentElo = state._botElo || getBotElo();
                const delta = calculateEloChange(stats.elo, opponentElo, playerWon);
                _lastEloDelta = delta;
                stats.elo = Math.max(0, (stats.elo || 1000) + delta);
                _lastEloAfter = stats.elo;
                stats.peakElo = Math.max(stats.peakElo || 0, stats.elo);
                // Keep last 50 entries for sparkline
                if (!stats.eloHistory) stats.eloHistory = [];
                stats.eloHistory.push({ elo: stats.elo, match: stats.matchesPlayed, delta });
                if (stats.eloHistory.length > 50) stats.eloHistory.shift();
            }

            saveCareerStats(stats);
        }

        /* ── EFFECTIVE ATTACK WITH STREAK/LASTSTD BONUS ── */
        function getStreakAtkBonus(unit) {
            return (unit?._streakAtkBonus || 0) + (unit?._lastStandAtkBonus || 0);
        }

        // ── Resolve projectile CSS class from kind + spellType ──
        // Priority: effect overrides (heal/shield/debuff/bomb/ricochet/lightning/pull-hook) > bane > spellType elemental > legacy kind
        function resolveProjectileClass(kind, spellType) {
            if (kind === 'heal' || kind === 'proj-heal') return 'proj-heal';
            if (kind === 'shield' || kind === 'proj-shield') return 'proj-shield';
            if (kind === 'proj-debuff') return 'proj-debuff';
            if (kind === 'proj-bomb' || kind === 'bomb') return 'proj-bomb';
            if (kind === 'proj-ricochet') return 'proj-ricochet';
            if (kind === 'proj-lightning') return 'proj-lightning';
            if (kind === 'proj-pull-hook') return 'proj-pull-hook';
            if (kind && kind.startsWith('proj-bane-')) return kind;
            if (spellType && ['divine', 'unholy', 'tech', 'alien', 'human', 'anomaly'].includes(spellType)) {
                return 'proj-' + spellType;
            }
            return kind || 'attack';
        }

        function playProjectile(fromX, fromY, toX, toY, kind = 'attack', durationMs = 520, spellType = null) {
            if (!projectileLayerEl || state.phase !== 'battle' || state.animationsDisabled) return;
            // PERF: suppress projectiles during devsim
            if (state.devAutoSim) return;
            // Fog of War: during enemy turn, only show projectile arriving at viewer's unit
            // Don't reveal enemy source position — clamp origin to just off the target tile
            if (state.fogOfWar && state.activePlayer !== getViewerPlayer()) {
                const viewer = getViewerPlayer();
                const targetUnit = state.units.find(u => !u.dead && u.x === toX && u.y === toY && u.player === viewer);
                if (!targetUnit) return; // enemy attacking non-viewer unit — suppress entirely
                // Clamp projectile origin to 1.5 tiles away from target in the attack direction
                // so viewer sees an incoming projectile without learning exact enemy position
                const dx = fromX - toX, dy = fromY - toY;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const clampDist = 1.5;
                fromX = toX + (dx / dist) * clampDist;
                fromY = toY + (dy / dist) * clampDist;
            }
            const from = tilePixelCenter(fromX, fromY);
            const to = tilePixelCenter(toX, toY);
            const el = document.createElement('div');
            const flyMs = Math.max(40, Number(durationMs) || 320);
            el.className = `projectile ${resolveProjectileClass(kind, spellType)}`;
            el.style.left = `${from.left}px`;
            el.style.top = `${from.top}px`;
            el.style.setProperty('--dx', `${to.left - from.left}px`);
            el.style.setProperty('--dy', `${to.top - from.top}px`);
            el.style.setProperty('--projectile-ms', `${flyMs}ms`);
            projectileLayerEl.appendChild(el);
            window.setTimeout(() => el.remove(), flyMs + 40);
        }

        function playProjectileToUnit(sourceUnit, target, kind = 'attack', durationMs = 520, spellType = null) {
            if (!sourceUnit || !target) return;
            playProjectile(sourceUnit.x, sourceUnit.y, target.x, target.y, kind, durationMs, spellType);
        }

        // ── Beam effect for line/linePush spells ──
        function playBeamEffect(fromX, fromY, dx, dy, range, spellType, durationMs) {
            if (!projectileLayerEl || state.phase !== 'battle' || state.animationsDisabled) return;
            if (state.devAutoSim) return;
            if (state.fogOfWar && state.activePlayer !== getViewerPlayer()) return;
            const typeCls = spellType ? 'beam-' + spellType : '';
            var angleDeg = 0;
            if (dx === 1 && dy === 0) angleDeg = 0;
            else if (dx === -1 && dy === 0) angleDeg = 180;
            else if (dx === 0 && dy === 1) angleDeg = 90;
            else if (dx === 0 && dy === -1) angleDeg = -90;
            const flyMs = Math.max(200, Number(durationMs) || 600);
            for (var i = 0; i <= range; i++) {
                const tx = fromX + dx * i;
                const ty = fromY + dy * i;
                if (tx < 0 || ty < 0 || tx >= bw() || ty >= bh()) break;
                const pos = tilePixelCenter(tx, ty);
                const seg = document.createElement('div');
                seg.className = 'beam-segment ' + (i === 0 ? 'beam-start' : 'beam-mid') + ' ' + typeCls;
                seg.style.left = pos.left + 'px';
                seg.style.top = pos.top + 'px';
                seg.style.transform = 'translate(-50%, -50%) rotate(' + angleDeg + 'deg)';
                const delayMs = Math.floor((i / Math.max(1, range)) * flyMs * 0.5);
                seg.style.animation = 'beamFlash ' + (flyMs - delayMs) + 'ms ease-out ' + delayMs + 'ms forwards';
                seg.style.opacity = '0';
                projectileLayerEl.appendChild(seg);
                window.setTimeout((function(el) { return function() { el.remove(); }; })(seg), flyMs + 80);
            }
        }

        // ── AoE ring impact effect ──
        function playAoeRing(cx, cy, radius, spellType, durationMs) {
            if (!projectileLayerEl || state.phase !== 'battle' || state.animationsDisabled) return;
            if (state.devAutoSim) return;
            if (state.fogOfWar && state.activePlayer !== getViewerPlayer()) return;
            const typeCls = spellType ? 'ring-' + spellType : '';
            const pos = tilePixelCenter(cx, cy);
            const ring = document.createElement('div');
            ring.className = 'aoe-ring ' + typeCls;
            ring.style.left = pos.left + 'px';
            ring.style.top = pos.top + 'px';
            const tileSize = state.tileSize || 128;
            const targetScale = Math.max(2, (radius * 2 + 1) * tileSize / 32);
            ring.style.setProperty('--ring-scale', targetScale);
            const ms = durationMs || 550;
            ring.style.animationDuration = ms + 'ms';
            projectileLayerEl.appendChild(ring);
            window.setTimeout(function() { ring.remove(); }, ms + 40);
        }

        // ═══════════════════════════════════════════════════
        // CINEMATIC ATTACK CUTSCENE v2 — Over-the-Shoulder
        // ═══════════════════════════════════════════════════

        const CINEMATIC_TERRAIN_BG = {
            grass: {
                skyTop: '#1a1820',
                skyBot: '#2a2830',
                ground: '#2a3020',
                groundAlt: '#222818',
                horizon: '#3a3828'
            },
            dirt: {
                skyTop: '#1e1a18',
                skyBot: '#2e2820',
                ground: '#3a3028',
                groundAlt: '#302618',
                horizon: '#484030'
            },
            water: {
                skyTop: '#141820',
                skyBot: '#1e2830',
                ground: '#183048',
                groundAlt: '#102038',
                horizon: '#283848'
            },
            deep_water: {
                skyTop: '#0a1018',
                skyBot: '#121828',
                ground: '#0e1828',
                groundAlt: '#08101e',
                horizon: '#182030'
            },
            desert: {
                skyTop: '#201818',
                skyBot: '#302820',
                ground: '#483820',
                groundAlt: '#382810',
                horizon: '#584828'
            },
            mountain: {
                skyTop: '#181820',
                skyBot: '#282830',
                ground: '#303038',
                groundAlt: '#282830',
                horizon: '#383840'
            },
            mountain_top: {
                skyTop: '#202028',
                skyBot: '#303040',
                ground: '#383840',
                groundAlt: '#303038',
                horizon: '#404048'
            },
            ice: {
                skyTop: '#1a2028',
                skyBot: '#283040',
                ground: '#384050',
                groundAlt: '#303848',
                horizon: '#404858'
            },
            lava: {
                skyTop: '#180808',
                skyBot: '#281010',
                ground: '#481808',
                groundAlt: '#381008',
                horizon: '#582010'
            },
            cave_floor: {
                skyTop: '#080404',
                skyBot: '#100808',
                ground: '#1a0e0a',
                groundAlt: '#120a08',
                horizon: '#221410'
            },
            cave_wall: {
                skyTop: '#060304',
                skyBot: '#0c0608',
                ground: '#100a08',
                groundAlt: '#0c0808',
                horizon: '#180e0c'
            },
            cave_entrance: {
                skyTop: '#080404',
                skyBot: '#100808',
                ground: '#1a0e0a',
                groundAlt: '#120a08',
                horizon: '#221410'
            },
            cloud: {
                skyTop: '#202838',
                skyBot: '#303848',
                ground: '#404858',
                groundAlt: '#384050',
                horizon: '#485060'
            },
            cloud_thick: {
                skyTop: '#181828',
                skyBot: '#282838',
                ground: '#383848',
                groundAlt: '#303040',
                horizon: '#404050'
            },
            sky_open: {
                skyTop: '#182030',
                skyBot: '#283848',
                ground: '#384858',
                groundAlt: '#304050',
                horizon: '#485868'
            },
            tree_top: {
                skyTop: '#1a1820',
                skyBot: '#2a2830',
                ground: '#1a2810',
                groundAlt: '#122008',
                horizon: '#283018'
            },
        };

        function _nightShift(hex) {
            const r = parseInt(hex.slice(1, 3), 16),
                g = parseInt(hex.slice(3, 5), 16),
                b = parseInt(hex.slice(5, 7), 16);
            return '#' + [r, g, b].map(c => Math.round(c * 0.35).toString(16).padStart(2, '0')).join('');
        }

        function _getCinematicBg(terrain) {
            const bg = CINEMATIC_TERRAIN_BG[terrain] || CINEMATIC_TERRAIN_BG.grass;
            const isNight = document.body.dataset.cycle === 'night';
            if (!isNight) return bg;
            return {
                skyTop: _nightShift(bg.skyTop),
                skyBot: _nightShift(bg.skyBot),
                ground: _nightShift(bg.ground),
                groundAlt: _nightShift(bg.groundAlt),
                horizon: _nightShift(bg.horizon)
            };
        }

        function _cinProjectileClass(unit) {
            const wep = getUnitDominantWeapon(unit);
            if (!wep) return '';
            if (wep === 'sword' || wep === 'knife' || wep === 'scythe') return 'melee';
            if (wep === 'wand' || wep === 'arcane_staff' || wep === 'healing_staff' || wep === 'tarot') return 'magic';
            return '';
        }

        function _buildGroundSvg(bg) {
            const s = 24,
                cols = 48,
                rows = 20;
            let rects = '';
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const color = ((r + c) % 3 === 0) ? bg.groundAlt : ((r + c) % 5 === 0 ? bg.horizon : bg.ground);
                    rects += `<rect x="${c*s}" y="${r*s}" width="${s}" height="${s}" fill="${color}"/>`;
                }
            }
            return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${cols*s}" height="${rows*s}">${rects}</svg>`)}`;
        }

        function _buildSpeedLines(count) {
            let html = '';
            for (let i = 0; i < count; i++) {
                const angle = -60 + (120 * i / (count - 1));
                const delay = Math.random() * 80;
                html += `<div class="cin-speedline" style="transform:rotate(${angle}deg);animation-delay:${delay}ms"></div>`;
            }
            return html;
        }

        let _cinematicEl = null;
        let _activeCinematic = null;

        function playCinematicAttack(attacker, defender, opts = {}) {
            if (!attacker || !defender) return null;
            if (!state.cinematicMode) return null;
            if (state.devAutoSim || state.cameraDisabled) return null;
            if (_gamePaused) return null;
            // Fog: suppress cinematic entirely during enemy turn — don't reveal attacker identity
            if (state.fogOfWar && state.activePlayer !== getViewerPlayer()) {
                return null;
            }
            // defender might be a {x,y} tile — need a real unit for sprite
            const defUnit = defender.cls ? defender : unitAt(defender.x, defender.y);
            if (!defUnit) return null;

            // ── GUNSLINGER DUEL: play stinger when Gunslinger attacks Gunslinger ──
            if (attacker.cls === 'Gunslinger' && defUnit.cls === 'Gunslinger') {
                playGunslingerDuelStinger();
            }

            // ── Collect extra targets (AoE / multi-hit — nearby enemies that will also take damage) ──
            const extraDefenders = [];
            if (opts.extraTargets && Array.isArray(opts.extraTargets)) {
                for (const et of opts.extraTargets) {
                    if (et && et.cls && et.id !== defUnit.id && extraDefenders.length < 3) {
                        extraDefenders.push(et);
                    }
                }
            }

            const terrain = getTerrainAt(attacker.x, attacker.y);
            const bg = _getCinematicBg(terrain);
            const atkSprite = getBattleMapSpriteUrl(attacker);
            const defSprite = getBattleMapSpriteUrl(defUnit);
            const projClass = _cinProjectileClass(attacker);
            const groundSvg = _buildGroundSvg(bg);

            // ── Build weapon overlay for attacker ──
            const weaponCat = getUnitDominantWeapon(attacker);
            const WEAPON_EMOJI = {
                sword: '⚔️',
                knife: '🗡️',
                revolver: '🔫',
                arcane_staff: '🪄',
                healing_staff: '✨',
                bomb: '💣',
                shield: '🛡️',
                tarot: '🃏',
                wand: '⭐',
                scythe: '🌙'
            };
            const weaponEmoji = weaponCat ? (WEAPON_EMOJI[weaponCat] || '') : '';

            if (_cinematicEl) {
                _cinematicEl.remove();
                _cinematicEl = null;
            }

            // Build extra defender HTML
            let extraDefHtml = '';
            for (let i = 0; i < extraDefenders.length; i++) {
                const ed = extraDefenders[i];
                const edSprite = getBattleMapSpriteUrl(ed);
                extraDefHtml += `<div class="cin-defender-extra slot-${i + 1}" style="background-image:url('${edSprite}')"></div>`;
            }

            // ── Build player label data (must be before overlay color setup) ──
            const atkPlayerNum = attacker.player || 1;
            const defPlayerNum = defUnit.player || 2;
            const atkName = unitDisplayName(attacker);
            const defName = unitDisplayName(defUnit);
            const atkFaction = attacker.faction || '';
            const defFaction = defUnit.faction || '';
            const atkFactionLabel = atkFaction ? atkFaction.charAt(0).toUpperCase() + atkFaction.slice(1) + ' Faction' : '';
            const defFactionLabel = defFaction ? defFaction.charAt(0).toUpperCase() + defFaction.slice(1) + ' Faction' : '';

            const overlay = document.createElement('div');
            overlay.className = 'cin-overlay';
            // Color labels by player identity, not attacker/defender role
            const viewerP = getViewerPlayer();
            const atkIsViewer = atkPlayerNum === viewerP;
            const defIsViewer = defPlayerNum === viewerP;
            overlay.style.setProperty('--cin-atk-rgb', atkIsViewer ? '120, 200, 255' : '255, 130, 130');
            overlay.style.setProperty('--cin-def-rgb', defIsViewer ? '120, 200, 255' : '255, 130, 130');

            overlay.innerHTML = `
        <div class="cin-scene">
          <div class="cin-intro">
            <div class="cin-intro-sprite" style="background-image:url('${atkSprite}')"></div>
            ${weaponEmoji ? `<div style="position:absolute;bottom:18%;right:18%;font-size:72px;z-index:12;filter:drop-shadow(0 0 12px rgba(255,200,100,0.8));animation:cinIntroZoom 500ms ease-out forwards;opacity:0">${weaponEmoji}</div>` : ''}
            <div class="cin-intro-vignette"></div>
            <div class="cin-intro-border"></div>
            <div class="cin-intro-slash"></div>
          </div>
          <div class="cin-sky" style="background:linear-gradient(180deg,${bg.skyTop} 0%,${bg.skyBot} 100%)"></div>
          <div class="cin-horizon-glow"></div>
          <div class="cin-ground-wrap">
            <div class="cin-ground">
              <div class="cin-ground-fill" style="background-image:url('${groundSvg}');background-size:24px 24px;background-repeat:repeat;"></div>
            </div>
          </div>
          <div class="cin-unit cin-attacker" style="background-image:url('${atkSprite}')"></div>
          <div class="cin-unit cin-defender" style="background-image:url('${defSprite}')"></div>
          ${extraDefHtml}
          <div class="cin-def-shadow"></div>
          <div class="cin-projectile ${projClass}"></div>
          <div class="cin-speedlines">${_buildSpeedLines(12)}</div>
          <div class="cin-impact"></div>
          <div class="cin-vignette"></div>
          <div class="cin-scanlines"></div>
          <div class="cin-dmg"></div>
          <div class="cin-float-dmg"></div>
          <div class="cin-float-crit-label"></div>
          <div class="cin-ko"></div>
          <div class="cin-dodge-label"></div>
          <div class="cin-counter-label"></div>
          <div class="cin-type-effect"></div>
          <div class="cin-bar cin-bar-top"></div>
          <div class="cin-bar cin-bar-bot"></div>
          <div class="cin-attack-name"></div>
          <div class="cin-skip-hint">Click anywhere to skip</div>
          <div class="cin-player-label cin-label-attacker">
            <div class="cin-label-player">P${atkPlayerNum}</div>
            <div class="cin-label-name">${atkName}</div>
            ${atkFactionLabel ? `<div class="cin-label-faction faction-${atkFaction}">${atkFactionLabel}</div>` : ''}
            <div class="cin-label-hp" data-cin-hp="atk">HP ${attacker.hp}/${attacker.maxHp}</div>
          </div>
          <div class="cin-player-label cin-label-defender">
            <div class="cin-label-player">P${defPlayerNum}</div>
            <div class="cin-label-name">${defName}</div>
            ${defFactionLabel ? `<div class="cin-label-faction faction-${defFaction}">${defFactionLabel}</div>` : ''}
            <div class="cin-label-hp" data-cin-hp="def">HP ${defUnit.hp}/${defUnit.maxHp}</div>
          </div>
        </div>
      `;
            (document.getElementById("game-viewport") || document.body).appendChild(overlay);
            _cinematicEl = overlay;

            const scene = overlay.querySelector('.cin-scene');
            const intro = overlay.querySelector('.cin-intro');
            const atkEl = overlay.querySelector('.cin-attacker');
            const defEl = overlay.querySelector('.cin-defender');
            const projEl = overlay.querySelector('.cin-projectile');
            const speedEl = overlay.querySelector('.cin-speedlines');
            const impactEl = overlay.querySelector('.cin-impact');
            const dmgEl = overlay.querySelector('.cin-dmg');
            const floatDmgEl = overlay.querySelector('.cin-float-dmg');
            const critLabelEl = overlay.querySelector('.cin-float-crit-label');
            const atkLabelEl = overlay.querySelector('.cin-label-attacker');
            const defLabelEl = overlay.querySelector('.cin-label-defender');
            const extraDefEls = overlay.querySelectorAll('.cin-defender-extra');

            // ══ TIMELINE (total ~3.2s) ══
            // 0ms:      Black + manga closeup of attacker (with weapon overlay)
            // 550ms:    Transition to 3D battle scene
            // 700ms:    Units slide into position + player labels appear
            // 850ms:    Spell/attack name slams in (top-left corner)
            // 1300ms:   Attacker lunges forward
            // 1550ms:   Projectile fires
            // 1950ms:   IMPACT — flash, shake, speed lines, defender recoil, floating damage
            // 2800ms:   Begin fade out
            // 3200ms:   Cleanup

            // Phase 1: Fade in with manga intro
            requestAnimationFrame(() => overlay.classList.add('active'));

            // ── Collect all scheduled timers so skip can clear them ──
            const _allTimers = [];
            const _cinTimeout = (fn, ms) => { const id = setTimeout(fn, ms); _allTimers.push(id); return id; };

            // Phase 2: Dismiss intro, reveal battle scene
            _cinTimeout(() => intro.classList.add('done'), 550);

            // Show attack/spell name (top-left corner)
            const cinNameEl = overlay.querySelector('.cin-attack-name');
            if (cinNameEl) {
                const attackLabel = opts.attackName || (weaponCat ? (WEAPON_EMOJI[weaponCat] || '') + ' Attack' : 'Attack');
                cinNameEl.textContent = attackLabel;
                _cinTimeout(() => cinNameEl.classList.add('visible'), 750);
                _cinTimeout(() => cinNameEl.classList.add('fade-out'), 2200);
            }

            // Show player labels (corners)
            _cinTimeout(() => {
                if (atkLabelEl) atkLabelEl.classList.add('visible');
            }, 700);
            _cinTimeout(() => {
                if (defLabelEl) defLabelEl.classList.add('visible');
            }, 780);

            // Units slide in
            _cinTimeout(() => atkEl.classList.add('in'), 700);
            _cinTimeout(() => defEl.classList.add('in'), 800);
            // Extra defenders slide in staggered
            extraDefEls.forEach((el, i) => {
                _cinTimeout(() => el.classList.add('in'), 850 + i * 100);
            });

            // Phase 3: Attacker lunge
            _cinTimeout(() => {
                atkEl.classList.add('lunge');
            }, 1300);

            // Projectile fires
            _cinTimeout(() => {
                const atkRect = atkEl.getBoundingClientRect();
                const defRect = defEl.getBoundingClientRect();
                const startX = atkRect.right - 40;
                const startY = atkRect.top + atkRect.height * 0.35;
                const endX = defRect.left + defRect.width * 0.3;
                const endY = defRect.top + defRect.height * 0.35;
                projEl.style.left = startX + 'px';
                projEl.style.top = startY + 'px';
                projEl.style.opacity = '1';
                projEl.style.transition = 'left 380ms cubic-bezier(.15,.6,.3,1), top 380ms cubic-bezier(.15,.6,.3,1)';
                requestAnimationFrame(() => {
                    projEl.style.left = endX + 'px';
                    projEl.style.top = endY + 'px';
                });
            }, 1550);

            // Phase 4: IMPACT
            const IMPACT_TIME = 1950;
            let _impactFired = false;
            let _pendingDamage = null;
            let _pendingKO = false;
            let _pendingDodge = false;
            let _pendingCounter = false;

            _cinTimeout(() => {
                projEl.style.opacity = '0';
                impactEl.classList.add('flash');
                scene.classList.add('shake');
                speedEl.classList.add('active');
                // Defender hit flash then recoil
                defEl.classList.add('hit');
                _cinTimeout(() => {
                    defEl.classList.remove('hit');
                    defEl.classList.add('recoil');
                }, 120);
                // Extra defenders hit too
                extraDefEls.forEach((el) => {
                    el.classList.add('hit');
                    _cinTimeout(() => {
                        el.classList.remove('hit');
                        el.classList.add('recoil');
                    }, 120);
                });
                // Attacker returns from lunge
                atkEl.classList.remove('lunge');

                _impactFired = true;

                // Flush any queued effects
                if (_pendingDodge) _execDodge();
                if (_pendingCounter) _execCounter();
                if (_pendingDamage) _execDamage(_pendingDamage.text, _pendingDamage.isCrit);
                // KO shows slightly after damage
                if (_pendingKO) _cinTimeout(() => _execKO(), 350);
            }, IMPACT_TIME);

            // ── Internal executors (play the visual immediately) ──
            const _execDamage = (text, isCrit) => {
                if (dmgEl) {
                    dmgEl.textContent = text;
                    if (isCrit) dmgEl.classList.add('crit');
                    if (text === 'DODGE!' || text === 'MISS!') dmgEl.classList.add('dodge');
                    dmgEl.classList.add('pop');
                }
                if (floatDmgEl) {
                    floatDmgEl.textContent = text;
                    if (isCrit) floatDmgEl.classList.add('crit');
                    if (text === 'DODGE!' || text === 'MISS!') floatDmgEl.classList.add('dodge');
                    floatDmgEl.classList.add('pop');
                }
                if (isCrit && critLabelEl) {
                    critLabelEl.textContent = '⚡ CRITICAL HIT!';
                    critLabelEl.classList.add('pop');
                }
            };

            const koEl = overlay.querySelector('.cin-ko');
            const _execKO = () => {
                if (koEl) {
                    koEl.textContent = 'K.O.';
                    koEl.classList.add('pop');
                    // Death collapse animation on defender sprite
                    if (defEl) defEl.classList.add('cin-death');
                    extraDefEls.forEach(el => el.classList.add('cin-death'));
                    // Extend cinematic to show KO
                    if (_fadeTimer) clearTimeout(_fadeTimer);
                    if (_cleanTimer) clearTimeout(_cleanTimer);
                    _fadeTimer = _cinTimeout(() => overlay.classList.add('fade-out'), 3600);
                    _cleanTimer = _cinTimeout(() => {
                        if (_cinematicEl === overlay) { overlay.remove(); _cinematicEl = null; }
                        if (_activeCinematic?.overlay === overlay) _activeCinematic = null;
                    }, 4000);
                }
            };

            const dodgeLabelEl = overlay.querySelector('.cin-dodge-label');
            const _execDodge = () => {
                if (defEl) defEl.classList.add('cin-dodge');
                if (dodgeLabelEl) {
                    dodgeLabelEl.textContent = 'DODGE!';
                    dodgeLabelEl.classList.add('pop');
                }
            };

            const counterLabelEl = overlay.querySelector('.cin-counter-label');
            const _execCounter = () => {
                if (defEl) {
                    defEl.classList.remove('recoil');
                    defEl.classList.add('cin-counter-strike');
                }
                if (counterLabelEl) {
                    counterLabelEl.textContent = '⚔ COUNTER!';
                    counterLabelEl.classList.add('pop');
                }
            };

            // ── Public API: queue or execute depending on whether impact has fired ──
            const showDamage = (text, isCrit) => {
                if (_impactFired) {
                    _execDamage(text, isCrit);
                } else {
                    _pendingDamage = { text, isCrit };
                }
            };

            const showKO = () => {
                if (_impactFired) {
                    setTimeout(() => _execKO(), 350);
                } else {
                    _pendingKO = true;
                }
            };

            const showDodge = () => {
                if (_impactFired) {
                    _execDodge();
                } else {
                    _pendingDodge = true;
                }
            };

            const showCounter = () => {
                if (_impactFired) {
                    _execCounter();
                } else {
                    _pendingCounter = true;
                }
            };

            const typeEffectEl = overlay.querySelector('.cin-type-effect');
            const showTypeEffect = (typeNote) => {
                if (!typeEffectEl || !typeNote) return;
                if (typeNote.includes('super effective')) {
                    typeEffectEl.textContent = "It's super effective!";
                    typeEffectEl.classList.add('super-effective');
                } else if (typeNote.includes("wasn't very effective")) {
                    typeEffectEl.textContent = "Not very effective...";
                    typeEffectEl.classList.add('not-effective');
                } else {
                    return;
                }
                // Show after impact with slight delay
                const doShow = () => typeEffectEl.classList.add('pop');
                if (_impactFired) {
                    setTimeout(doShow, 250);
                } else {
                    setTimeout(doShow, IMPACT_TIME + 250);
                }
            };

            // Helper to extend cinematic duration
            let _fadeTimer = null;
            let _cleanTimer = null;

            // ── SKIP CINEMATIC: click anywhere on overlay to instantly end it ──
            let _skipped = false;
            const _skipCinematic = () => {
                if (_skipped) return;
                _skipped = true;
                // Clear all pending timers
                for (const tid of _allTimers) clearTimeout(tid);
                if (_fadeTimer) clearTimeout(_fadeTimer);
                if (_cleanTimer) clearTimeout(_cleanTimer);
                // Immediately remove overlay
                overlay.classList.remove('active');
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    if (_cinematicEl === overlay) { overlay.remove(); _cinematicEl = null; }
                    if (_activeCinematic?.overlay === overlay) _activeCinematic = null;
                }, 200);
            };
            overlay.addEventListener('click', _skipCinematic, { passive: true });
            overlay.addEventListener('touchend', (e) => { e.preventDefault(); _skipCinematic(); }, { passive: false });

            // Phase 5: Fade out
            _fadeTimer = setTimeout(() => overlay.classList.add('fade-out'), 2800);
            _cleanTimer = setTimeout(() => {
                if (_cinematicEl === overlay) {
                    overlay.remove();
                    _cinematicEl = null;
                }
                if (_activeCinematic?.overlay === overlay) _activeCinematic = null;
            }, 3200);

            const handle = {
                showDamage,
                showKO,
                showDodge,
                showCounter,
                showTypeEffect,
                skip: _skipCinematic,
                totalMs: 3200,
                overlay
            };
            _activeCinematic = handle;
            return handle;
        }

        /** Check if a cinematic overlay is currently active and blocking the board */
        function isCinematicActive() {
            return !!(_cinematicEl && _cinematicEl.classList.contains('active') && !_cinematicEl.classList.contains('fade-out'));
        }

        /** Check if a cinematic overlay is still present (including fade-out) */
        function isCinematicPresent() {
            return !!_cinematicEl;
        }

        let boardCameraResetTimer = null;
        let boardCameraSequenceId = 0;
        let boardRenderQueued = false;
        let boardCameraRaf = null;
        let boardCameraTransitionResetTimer = null;

        let _lastZoomStateValue = -1;
        function setBoardZoomState(zoom = 1) {
            if (!boardStageEl) return;
            // PERF: skip DOM work if zoom hasn't meaningfully changed
            const rounded = Math.round(zoom * 100);
            if (rounded === _lastZoomStateValue) return;
            _lastZoomStateValue = rounded;
            const isZoomed = zoom > 1.05;
            boardStageEl.dataset.zoomed = isZoomed ? 'true' : 'false';
            // Sync nav arrow visibility on mapRow
            const mapRow = document.getElementById('mapRow');
            if (mapRow) mapRow.setAttribute('data-nav-visible', isZoomed ? 'true' : 'false');
            if (typeof _updateNavArrowStates === 'function') _updateNavArrowStates();
            // ── Zoom level indicator ──
            let zoomIndicator = document.getElementById('zoomLevelIndicator');
            if (!zoomIndicator) {
                zoomIndicator = document.createElement('div');
                zoomIndicator.id = 'zoomLevelIndicator';
                zoomIndicator.style.cssText = 'position:absolute;bottom:8px;right:8px;z-index:9999;background:rgba(0,0,0,0.7);color:#d4c8b0;font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;pointer-events:none;font-family:monospace;border:1px solid rgba(200,180,150,0.2)';
                (document.getElementById("game-viewport") || document.body).appendChild(zoomIndicator);
            }
            zoomIndicator.textContent = `Zoom: ${zoom.toFixed(2)}x`;
        }

        function stopBoardCameraAnimation() {
            if (boardCameraRaf) {
                window.cancelAnimationFrame(boardCameraRaf);
                boardCameraRaf = null;
            }
            if (boardCameraTransitionResetTimer) {
                window.clearTimeout(boardCameraTransitionResetTimer);
                boardCameraTransitionResetTimer = null;
            }
        }

        function setBoardCameraTransition(ms = 420) {
            if (!boardStageEl) return;
            boardStageEl.style.transition = `transform ${Math.max(10, ms)}ms cubic-bezier(.22,.61,.36,1)`;
            if (boardCameraTransitionResetTimer) window.clearTimeout(boardCameraTransitionResetTimer);
            boardCameraTransitionResetTimer = window.setTimeout(() => {
                if (boardStageEl) boardStageEl.style.transition = '';
                boardCameraTransitionResetTimer = null;
            }, Math.max(40, ms) + 60);
            // ── Track menu during CSS transition ──
            _startMenuTrackingLoop(ms);
        }

        let _menuTrackingRaf = null;
        function _startMenuTrackingLoop(durationMs) {
            if (_menuTrackingRaf) cancelAnimationFrame(_menuTrackingRaf);
            const end = performance.now() + (durationMs || 420) + 80;
            const tick = () => {
                _repositionFloatActionMenu();
                if (performance.now() < end) {
                    _menuTrackingRaf = requestAnimationFrame(tick);
                } else {
                    _menuTrackingRaf = null;
                }
            };
            _menuTrackingRaf = requestAnimationFrame(tick);
        }

        function setBoardCameraFocusPoint(x, y, opts = {}) {
            if (state.cameraDisabled || state.devAutoSim) return;
            const _isEnemyFogTurn = state.fogOfWar && state.activePlayer !== getViewerPlayer();
            if (_isEnemyFogTurn && !opts._fogAllowed) return;
            if (!boardStageEl || !Number.isFinite(x) || !Number.isFinite(y) || state.phase !== 'battle') return;
            // Use cached layout dimensions — avoids forced reflow (the #1 perf killer)
            const stageWidth = _layoutCache.valid ? _layoutCache.stageW : (boardStageEl.offsetWidth || 1);
            const stageHeight = _layoutCache.valid ? _layoutCache.stageH : (boardStageEl.offsetHeight || 1);
            const parentWidth = _layoutCache.valid ? _layoutCache.parentW : (boardStageEl.parentElement?.clientWidth || stageWidth);
            const parentHeight = _layoutCache.valid ? _layoutCache.parentH : (boardStageEl.parentElement?.clientHeight || stageHeight);
            const stageOriginX = _layoutCache.valid ? _layoutCache.stageOffX : (boardStageEl.offsetLeft || 0);
            const stageOriginY = _layoutCache.valid ? _layoutCache.stageOffY : (boardStageEl.offsetTop || 0);
            const zoom = Math.max(0.25, Math.min(5.0, opts.zoom ?? getDefaultZoom()));
            const center = tilePixelCenter(x, y);
            const isP2Viewer = document.body.classList.contains('is-p2-viewer');
            let cx = center.left;
            let cy = center.top;
            if (isP2Viewer) {
                // Compute board pixel size from CONFIG (pure math — no DOM read)
                const ts = CONFIG.tileSize || 58;
                const gap = CONFIG.tileGap ?? 0;
                const pad = CONFIG.boardPadding ?? 2;
                const boardPixelW = pad * 2 + bw() * ts + (bw() - 1) * gap;
                const boardPixelH = pad * 2 + bh() * ts + (bh() - 1) * gap;
                cx = boardPixelW - center.left;
                cy = boardPixelH - center.top;
            }
            const desiredCenterX = parentWidth / 2;
            const desiredCenterY = parentHeight / 2;
            let tx, ty;
            if (zoom < 1) {
                const scaledW = stageWidth * zoom;
                const scaledH = stageHeight * zoom;
                tx = (parentWidth - scaledW) / 2 - stageOriginX;
                ty = (parentHeight - scaledH) / 2 - stageOriginY;
            } else {
                const unclampedX = desiredCenterX - stageOriginX - (cx * zoom);
                const unclampedY = desiredCenterY - stageOriginY - (cy * zoom);
                const maxShiftX = Math.max(stageWidth * zoom, parentWidth);
                const maxShiftY = Math.max(stageHeight * zoom, parentHeight);
                tx = Math.max(-maxShiftX, Math.min(maxShiftX, unclampedX));
                ty = Math.max(-maxShiftY, Math.min(maxShiftY, unclampedY));
            }
            if (Number.isFinite(opts.transitionMs)) {
                setBoardCameraTransition(opts.transitionMs);
                // No forced reflow — the transition will naturally apply on next frame
            }
            boardStageEl.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
            setBoardZoomState(zoom);
            if (typeof _updateCameraFocal === 'function') _updateCameraFocal(x, y);
        }

        function animateBoardCameraPath(fromPoint, toPoint, opts = {}) {
            if (!fromPoint || !toPoint || state.phase !== 'battle') return;
            // PERF: skip camera animation during devsim
            if (state.devAutoSim) return;
            // Fog of War: suppress camera panning during AI fog turn
            const _isEnemyFogTurn = state.fogOfWar && state.activePlayer !== getViewerPlayer();
            if (_isEnemyFogTurn && !opts._fogAllowed) return;
            stopBoardCameraAnimation();
            
            const sequenceId = opts.sequenceId ?? boardCameraSequenceId;
            const duration = Math.max(240, opts.duration ?? 1400);
            const zoom = opts.zoom ?? getDefaultZoom();
            const start = performance.now();
            const step = (now) => {
                if (sequenceId !== boardCameraSequenceId || state.phase !== 'battle') return;
                const t = Math.min(1, (now - start) / duration);
                const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                const x = fromPoint.x + ((toPoint.x - fromPoint.x) * eased);
                const y = fromPoint.y + ((toPoint.y - fromPoint.y) * eased);
                setBoardCameraFocusPoint(x, y, {
                    zoom
                });
                _repositionFloatActionMenu();
                if (t < 1) {
                    boardCameraRaf = window.requestAnimationFrame(step);
                } else {
                    boardCameraRaf = null;
                    
                }
            };
            boardCameraRaf = window.requestAnimationFrame(step);
        }


        // ── USER ZOOM SYSTEM ──
        // Returns the current user zoom scale (continuous float, 1.0 = full map)
        function getUserZoomScale() {
            const z = state.userZoomScale;
            if (!z || z < 0.01) {
                // Lazily compute default tactical zoom on first access
                state.userZoomScale = getDefaultZoom();
                return state.userZoomScale;
            }
            return z;
        }

        function getUserZoomLabel() {
            const z = state.userZoomScale || 1;
            if (z <= 1.05) return '🔍 Overview';
            return `🔎 ${Math.round(z * 100)}%`;
        }

        // ── TILE-BASED ZOOM CALCULATION ──
        // Returns the CSS scale value needed to show approximately `targetRows`
        // tiles vertically on screen — independent of map size.
        // This decouples zoom from board dimensions so larger maps zoom the same.
        function computeZoomForVisibleTiles(targetRows) {
            const ts = CONFIG.tileSize || 58;
            const gap = CONFIG.tileGap ?? 0;
            const pad = CONFIG.boardPadding ?? 2;
            // Total board pixel height (the stage element's natural size)
            const rows = bh() || 10;
            const boardPixelH = pad * 2 + rows * ts + (rows - 1) * gap;
            // Viewport height available for the board
            const viewportH = _layoutCache.valid
                ? _layoutCache.parentH
                : (boardStageEl?.parentElement?.clientHeight || window.innerHeight);
            // Pixels that `targetRows` tiles would occupy at natural (unscaled) size
            const targetPixelH = targetRows * (ts + gap);
            // Scale = viewport / target pixel span
            const zoom = viewportH / targetPixelH;
            // Clamp to sane range
            return Math.max(0.5, Math.min(5.0, zoom));
        }

        // Semantic zoom presets expressed as "how many tiles visible vertically"
        // These are used everywhere instead of hardcoded zoom numbers.
        function getDefaultZoom()    { return computeZoomForVisibleTiles(7); }   // Standard tactical view
        function getCloseZoom()      { return computeZoomForVisibleTiles(5); }   // Close-up (attacks, spells)
        function getMediumZoom()     { return computeZoomForVisibleTiles(6); }   // Medium (spell effects, AoE)
        function getWideZoom()       { return computeZoomForVisibleTiles(9); }   // Wide (scanning, weather)
        function getCinematicZoom()  { return computeZoomForVisibleTiles(4); }   // Cinematic close-up

        function cycleUserZoom() {
            // Toggle between full map and a useful tactical zoom (~7 tiles visible vertically)
            if ((state.userZoomScale || 1) > 1.05) {
                state.userZoomScale = 1;
            } else {
                state.userZoomScale = getDefaultZoom();
            }
            const btn = document.getElementById('zoomToggleBtn');
            if (btn) {
                btn.textContent = getUserZoomLabel();
                btn.classList.toggle('active', (state.userZoomScale || 1) > 1.05);
            }
            const unit = getSelectedUnit();
            if (unit && (state.userZoomScale || 1) > 1.05) {
                focusBoardCameraOnTiles([{
                    x: unit.x,
                    y: unit.y
                }], {
                    zoom: state.userZoomScale,
                    holdMs: 99999,
                    persist: true,
                    transitionMs: 350
                });
            } else if ((state.userZoomScale || 1) > 1.05) {
                const centerX = Math.floor(bw() / 2),
                    centerY = Math.floor(bh() / 2);
                focusBoardCameraOnTiles([{
                    x: centerX,
                    y: centerY
                }], {
                    zoom: state.userZoomScale,
                    holdMs: 99999,
                    persist: true,
                    transitionMs: 350
                });
            } else {
                resetBoardCamera();
            }
        }

        function resetBoardCamera(immediate = false) {
            if (!boardStageEl) return;
            stopBoardCameraAnimation();
            if (boardCameraResetTimer) {
                window.clearTimeout(boardCameraResetTimer);
                boardCameraResetTimer = null;
            }
            // When camera is disabled, force-reset to neutral view directly
            // (setBoardCameraFocusPoint would return early due to cameraDisabled guard)
            if (state.cameraDisabled) {
                boardStageEl.style.transition = immediate ? 'none' : 'transform 0.3s ease';
                boardStageEl.style.transform = '';
                setBoardZoomState(1);
                if (!immediate) window.setTimeout(() => { if (boardStageEl) boardStageEl.style.transition = ''; }, 350);
                return;
            }
            const baseZoom = getUserZoomScale();
            // During enemy's turn, always reset to full — fog camera manages zooms separately
            const isEnemyTurn = state.fogOfWar && state.activePlayer !== getViewerPlayer();
            if (baseZoom > 1.05 && !isEnemyTurn) {
                // User has a zoom level set — snap back to their zoom centered on selected unit or board center
                const unit = getSelectedUnit();
                if (unit) {
                    if (immediate) {
                        setBoardCameraFocusPoint(unit.x, unit.y, {
                            zoom: baseZoom
                        });
                    } else {
                        setBoardCameraTransition(actionMs(420));
                        setBoardCameraFocusPoint(unit.x, unit.y, {
                            zoom: baseZoom
                        });
                    }
                } else {
                    const centerX = Math.floor(bw() / 2),
                        centerY = Math.floor(bh() / 2);
                    if (immediate) {
                        setBoardCameraFocusPoint(centerX, centerY, {
                            zoom: baseZoom
                        });
                    } else {
                        setBoardCameraTransition(actionMs(420));
                        setBoardCameraFocusPoint(centerX, centerY, {
                            zoom: baseZoom
                        });
                    }
                }
                return;
            }
            if (immediate) {
                // Use setBoardCameraFocusPoint which reads cached layout dimensions
                const defaultZoom = (baseZoom > 1.05) ? baseZoom : getDefaultZoom();
                const centerX = Math.floor(bw() / 2), centerY = Math.floor(bh() / 2);
                boardStageEl.style.transition = 'transform .01s linear';
                setBoardCameraFocusPoint(centerX, centerY, { zoom: defaultZoom });
                window.setTimeout(() => { boardStageEl.style.transition = ''; }, 20);
                return;
            }
            setBoardCameraTransition(actionMs(420));
            const defaultZoom = (baseZoom > 1.05) ? baseZoom : getDefaultZoom();
            const centerX = Math.floor(bw() / 2), centerY = Math.floor(bh() / 2);
            setBoardCameraFocusPoint(centerX, centerY, { zoom: defaultZoom });
        }

        // Soft camera reset: pan smoothly to a unit (or active unit) at the user's
        // current zoom level instead of snapping to the full-board overview.
        // Used after attacks/spells/deaths so the player doesn't lose context.
        function _softResetCameraToUnit(targetUnit) {
            if (!boardStageEl || state.cameraDisabled) { resetBoardCamera(); return; }
            stopBoardCameraAnimation();
            if (boardCameraResetTimer) { clearTimeout(boardCameraResetTimer); boardCameraResetTimer = null; }
            const focusUnit = targetUnit && !targetUnit.dead ? targetUnit : getSelectedUnit();
            const baseZoom = getUserZoomScale();
            const zoom = baseZoom > 1.05 ? baseZoom : getDefaultZoom();
            if (focusUnit) {
                setBoardCameraTransition(actionMs(450));
                setBoardCameraFocusPoint(focusUnit.x, focusUnit.y, { zoom });
            } else {
                resetBoardCamera();
            }
        }


        function focusBoardCameraOnTiles(points, opts = {}) {
            if (!boardStageEl || !points?.length || state.phase !== 'battle' || state.cameraDisabled) return;
            // PERF: skip camera focus during devsim
            if (state.devAutoSim) return;
            // Fog of War: suppress camera focus during AI fog turn unless explicitly allowed
            const _isEnemyFogTurn = state.fogOfWar && state.activePlayer !== getViewerPlayer();
            if (_isEnemyFogTurn && !opts._fogAllowed) return;
            stopBoardCameraAnimation();
            const zoom = Math.max(0.25, Math.min(5.0, opts.zoom ?? getDefaultZoom()));
            const holdMs = Math.max(260, opts.holdMs ?? 1060);
            const persist = !!opts.persist;
            const avgX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
            const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
            if (boardCameraResetTimer) {
                window.clearTimeout(boardCameraResetTimer);
                boardCameraResetTimer = null;
            }
            setBoardCameraFocusPoint(avgX, avgY, {
                zoom,
                transitionMs: opts.transitionMs
            });
            if (!persist) {
                boardCameraResetTimer = window.setTimeout(() => resetBoardCamera(), holdMs);
            }
        }


        function getOffensiveCameraTimings(sourceUnit, target, opts = {}) {
            const distance = Math.max(1, Math.abs((sourceUnit?.x ?? 0) - (target?.x ?? 0)) + Math.abs((sourceUnit?.y ?? 0) - (target?.y ?? 0)));
            const zoom = opts.zoom ?? (distance <= 2 ? getCloseZoom() : distance <= 4 ? getMediumZoom() : getDefaultZoom());
            const sourceHold = actionMs(opts.sourceHold ?? 1240);
            const travelMs = actionMs(opts.travelMs ?? Math.max(220, Math.min(520, 140 + (distance * 54))));
            const targetHold = actionMs(opts.targetHold ?? 1140);
            const resetBuffer = actionMs(opts.resetBuffer ?? 210);
            return {
                distance,
                zoom,
                sourceHold,
                travelMs,
                targetHold,
                resetBuffer,
                totalMs: sourceHold + travelMs + targetHold + resetBuffer
            };
        }

        function playOffensiveActionCamera(sourceUnit, target, opts = {}) {
            if (!sourceUnit || !target || state.phase !== 'battle') return null;

            // Hide turn banner during attack animations
            hideTurnBanner();

            // Hide float action menu during attack camera sequence
            

            // ── Fire cinematic cutscene overlay (runs independently of camera) ──
            if (!opts._noCinematic) {
                playCinematicAttack(sourceUnit, target, opts);
            }

            // PERF: skip camera work during devsim
            if (state.cameraDisabled || state.devAutoSim) {
                // Return timings at 0 so attack/spell delays still work but no camera movement
                return {
                    sequenceId: 0,
                    sourceHold: 0,
                    travelMs: 0,
                    targetHold: 0,
                    resetBuffer: 0,
                    totalMs: actionMs(100),
                    zoom: 1
                };
            }

            // Fog of War: during enemy turn, only zoom to the viewer's own unit being hit.
            // Do NOT focus on or reveal the enemy attacker's position.
            const isAiFogTurn = state.fogOfWar && state.activePlayer !== getViewerPlayer();
            if (isAiFogTurn) {
                const viewer = getViewerPlayer();
                const humanUnit = (target.player === viewer) ? target : (sourceUnit.player === viewer ? sourceUnit : null);
                if (humanUnit) {
                    // Anchor fog to the viewer's affected unit — do NOT reveal enemy source tile
                    state._fogAnchorUnitId = humanUnit.id;
                    if (!state._fogRevealTiles) state._fogRevealTiles = new Set();
                    // Only reveal the tile being hit (viewer's unit), not the attacker's tile
                    state._fogRevealTiles.add(posKey(humanUnit.x, humanUnit.y));
                    scheduleBoardRender();

                    // Jump camera directly to the viewer's unit — skip enemy focus + pan
                    const sequenceId = ++boardCameraSequenceId;
                    const cinematicZoom = 2.2;
                    const holdMs = actionMs(1600);
                    const transMs = actionMs(420);

                    stopBoardCameraAnimation();
                    if (boardCameraResetTimer) {
                        window.clearTimeout(boardCameraResetTimer);
                        boardCameraResetTimer = null;
                    }

                    // Focus directly on the viewer's unit being attacked
                    setBoardCameraFocusPoint(humanUnit.x, humanUnit.y, {
                        zoom: cinematicZoom,
                        transitionMs: transMs,
                        _fogAllowed: true
                    });
                    // Stay zoomed — re-show UI after hold
                    boardCameraResetTimer = window.setTimeout(() => {
                        if (sequenceId !== boardCameraSequenceId) return;
                        
                        const overlay = document.getElementById('turnBannerOverlay');
                        if (overlay && overlay.innerHTML && state.phase === 'battle' && !state.winner) {
                            overlay.classList.add('visible');
                        }
                        // Clear fog reveal after camera sequence completes
                        clearTimeout(state._fogRevealTimer);
                        state._fogRevealTimer = setTimeout(() => {
                            state._fogRevealTiles = null;
                            scheduleBoardRender();
                        }, 800);
                    }, holdMs);
                    return {
                        sequenceId,
                        sourceHold: 0,
                        travelMs: 0,
                        targetHold: holdMs,
                        resetBuffer: 0,
                        totalMs: holdMs,
                        zoom: cinematicZoom
                    };
                }
                // Neither unit belongs to the viewer — skip camera entirely
                return {
                    sequenceId: 0,
                    sourceHold: 0,
                    travelMs: 0,
                    targetHold: 0,
                    resetBuffer: 0,
                    totalMs: actionMs(100),
                    zoom: 1
                };
            }

            const sequenceId = ++boardCameraSequenceId;
            const timings = getOffensiveCameraTimings(sourceUnit, target, opts);
            const cinematicZoom = timings.zoom;
            const transMs = actionMs(420);

            stopBoardCameraAnimation();
            if (boardCameraResetTimer) {
                window.clearTimeout(boardCameraResetTimer);
                boardCameraResetTimer = null;
            }

            setBoardCameraFocusPoint(sourceUnit.x, sourceUnit.y, {
                zoom: cinematicZoom,
                transitionMs: transMs
            });
            window.setTimeout(() => {
                if (sequenceId !== boardCameraSequenceId || state.phase !== 'battle') return;
                animateBoardCameraPath({
                    x: sourceUnit.x,
                    y: sourceUnit.y
                }, {
                    x: target.x,
                    y: target.y
                }, {
                    sequenceId,
                    duration: timings.travelMs,
                    zoom: cinematicZoom
                });
            }, timings.sourceHold);
            window.setTimeout(() => {
                if (sequenceId !== boardCameraSequenceId || state.phase !== 'battle') return;
                stopBoardCameraAnimation();
                setBoardCameraFocusPoint(target.x, target.y, {
                    zoom: cinematicZoom,
                    transitionMs: transMs
                });
            }, timings.sourceHold + timings.travelMs);
            // Stay at the attack zoom level on the target — no zoom-out reset.
            // Just re-show UI elements after the camera animation completes.
            boardCameraResetTimer = window.setTimeout(() => {
                if (sequenceId !== boardCameraSequenceId) return;
                
                const overlay = document.getElementById('turnBannerOverlay');
                if (overlay && overlay.innerHTML && state.phase === 'battle' && !state.winner) {
                    overlay.classList.add('visible');
                }
            }, timings.totalMs);
            return {
                sequenceId,
                ...timings
            };
        }

        function flashHeal(target) {
            if (!target || target.dead) return;
            flashUnit(target.id, 'heal');
        }

        function applyDamageToUnit(target, damage, sourceText, opts = {}) {
            if (!target || target.dead || target._dying) return false;

            // Fog of War: reveal target tile when player's unit is hit during AI turn
            // Do NOT reveal the attacker's source tile — player shouldn't see where the enemy is
            const sourceUnit_pre = opts.sourceUnit || null;
            if (state.fogOfWar && !state.devAutoSim && sourceUnit_pre && sourceUnit_pre.player !== target.player) {
                const humanPlayer = getViewerPlayer();
                if (humanPlayer && (target.player === humanPlayer || sourceUnit_pre.player === humanPlayer)) {
                    // Shift fog perspective to the affected viewer unit so the player sees the action
                    const humanTarget = target.player === humanPlayer ? target : sourceUnit_pre;
                    if (humanTarget.player === humanPlayer) {
                        state._fogAnchorUnitId = humanTarget.id;
                    }
                    if (!state._fogRevealTiles) state._fogRevealTiles = new Set();
                    // Only reveal the viewer's unit tile, NOT the enemy attacker's position
                    if (target.player === humanPlayer) {
                        state._fogRevealTiles.add(posKey(target.x, target.y));
                    }
                    if (sourceUnit_pre.player === humanPlayer) {
                        state._fogRevealTiles.add(posKey(sourceUnit_pre.x, sourceUnit_pre.y));
                    }
                    scheduleBoardRender();
                    // Clear reveal after animation completes
                    clearTimeout(state._fogRevealTimer);
                    state._fogRevealTimer = setTimeout(() => {
                        state._fogRevealTiles = null;
                        scheduleBoardRender();
                    }, 2200);
                }
            }

            // Invulnerable status (e.g. Protect) blocks all damage
            const invulnStatus = getActiveStatusKeys(target).find(key => STATUS_DEFS[key]?.invulnerable);
            if (invulnStatus) {
                addLog(`${sourceText}${unitDisplayName(target)} is protected and takes no damage!`);
                flashUnit(target.id, 'heal');
                showFloatingTextForUnit(target, '🛡 PROTECTED!', 'protect-block', { durationMs: 1400 });
                // Show a combat banner so the attacker understands why no damage was dealt
                showCombatBanner(`🛡️ ${unitDisplayName(target)} is Protected!`, 'Immune to all damage this turn', 'protect');
                return false;
            }

            let finalDamage = Math.max(0, damage);
            const sourceUnit = opts.sourceUnit || null;
            const damageType = opts.damageType || 'physical';

            const typeNote = sourceUnit && sourceUnit.player !== target.player ? getTypeCombatNote(sourceUnit, target, opts.spellType || null) : '';
            if (sourceUnit && sourceUnit.player !== target.player) {
                finalDamage += getEffectiveAttackBonus(sourceUnit);
                finalDamage = Math.max(1, Math.round(finalDamage * getTypeDamageMultiplier(sourceUnit, target, opts.spellType || null)));
            }

            const canConsumeMarked = opts.consumeMarked ?? (damageType === 'physical');
            if (sourceUnit && sourceUnit.player !== target.player && opts.allowMarkBonus !== false && canConsumeMarked && unitHasStatus(target, 'marked')) {
                finalDamage += opts.markBonus ?? target.markBonus ?? 40;
                clearStatus(target, 'marked');
                target.markBonus = 0;
                addLog(`${unitDisplayName(target)} was marked, so the hit deals extra damage.`);
            }

            const hourglassReduction = opts.ignoreArmor ? 0 : getHourglassDamageReduction(target);
            const effectiveArmor = opts.ignoreArmor ? 0 : getEffectiveArmor(target);
            if (effectiveArmor > 0) finalDamage = Math.max(1, finalDamage - effectiveArmor);
            if (hourglassReduction > 0) finalDamage = Math.max(1, finalDamage - hourglassReduction);
            if (damageType === 'physical' && sourceUnit && sourceUnit.player !== target.player) {
                finalDamage = Math.max(1, Math.round(finalDamage * getStatusRangedDamageTakenMultiplier(target)));
            }

            if (target.shield > 0) {
                const shieldIgnore = Math.max(0, Number(opts.shieldIgnore || 0));
                const effectiveShield = Math.max(0, target.shield - shieldIgnore);
                const absorbed = Math.min(effectiveShield, finalDamage);
                if (absorbed > 0) {
                    target.shield -= absorbed;
                    finalDamage -= absorbed;
                    addLog(`${unitDisplayName(target)}'s shield absorbs ${absorbed} HP damage.`);
                    showFloatingTextForUnit(target, `${absorbed}`, 'mp');
                }
            }

            if (finalDamage > 0) {
                target.hp -= finalDamage;
                target._trackDmgReceived = (target._trackDmgReceived || 0) + finalDamage;
                if (sourceUnit) {
                    sourceUnit._trackDmgDealt = (sourceUnit._trackDmgDealt || 0) + finalDamage;
                    // ── XP: damage dealt (flat per hit, not per HP) ──
                    grantXP(sourceUnit, XP_DAMAGE_FLAT, 'damage');
                    // ── XP: super effective ──
                    if (typeNote && typeNote.includes('super effective')) grantXP(sourceUnit, XP_SUPER_EFFECTIVE, 'superEffective');
                    // ── XP: environmental bonus active ──
                    if (hasEnvironmentalBonus(sourceUnit)) grantXP(sourceUnit, XP_ENV_BONUS_HIT, 'envBonus');
                    // ── XP: buff-assist — if target's allies buffed the attacker, credit the buffer ──
                    if (sourceUnit._xpBuffSources) {
                        for (const bufferId of Object.keys(sourceUnit._xpBuffSources)) {
                            if (bufferId === String(sourceUnit.id)) continue;
                            const buffer = state.units.find(u => u.id === bufferId);
                            if (buffer && !buffer.dead && buffer.player === sourceUnit.player) {
                                grantXP(buffer, XP_BUFF_ASSIST, 'buffAssist');
                            }
                        }
                    }
                }
                flashUnit(target.id, 'hit');
                showFloatingTextForUnit(target, `-${finalDamage}`, 'damage');
                addLog(`${sourceText}${unitDisplayName(target)} takes ${finalDamage} HP damage.${typeNote ? ` ${typeNote}` : ''}`);
                // ── BATTLE DIALOGUE: show type effectiveness and notable events ──
                if (sourceUnit && typeNote) {
                    const dlg = [];
                    if (typeNote.includes('super effective')) dlg.push(`<span class="dlg-effective">⚡ It's super effective!</span>`);
                    else if (typeNote.includes('not very effective')) dlg.push(`<span class="dlg-resist">🛡 Not very effective...</span>`);
                    if (dlg.length > 0) showBattleDialogue(dlg, 1500);
                }
            } else {
                showFloatingTextForUnit(target, '0', 'damage');
                addLog(`${sourceText}${unitDisplayName(target)} blocks the hit.`);
            }

            if (opts.statusEffects || opts.status) applyStatusEffects(target, opts.statusEffects || opts.status, '', sourceUnit);

            // ── SEED DESTRUCTION: any damage to a tile destroys enemy seeds on it ──
            if (sourceUnit && state.plantedSeeds && !target.dead) {
                const seedIdx = state.plantedSeeds.findIndex(s => s.x === target.x && s.y === target.y && s.owner !== sourceUnit.player);
                if (seedIdx >= 0) {
                    const destroyed = state.plantedSeeds[seedIdx];
                    state.plantedSeeds.splice(seedIdx, 1);
                    const seedName = destroyed.type === 'heal' ? 'Healing' : destroyed.type === 'poison' ? 'Poison' : 'Leech';
                    addLog(`🌿💥 The attack destroys a ${seedName} Seed at ${coordLabel(target.x, target.y)}!`);
                }
            }

            // ── WARD DESTRUCTION: any attack on a tile destroys enemy wards on it ──
            if (sourceUnit && state.wards) {
                const wardIdx = state.wards.findIndex(w => w.x === target.x && w.y === target.y && w.owner !== sourceUnit.player);
                if (wardIdx >= 0) {
                    state.wards.splice(wardIdx, 1);
                    addLog(`👁💥 The attack destroys a Ward at ${coordLabel(target.x, target.y)}!`);
                }
            }

            if (target.hp <= 0) {
                if (sourceUnit) {
                    sourceUnit._trackKills = (sourceUnit._trackKills || 0) + 1;
                    // ── XP: kill ──
                    grantXP(sourceUnit, XP_KILL, 'kill');
                    // ── GOLD: kill bounty ──
                    sourceUnit.gold = (sourceUnit.gold || 0) + GOLD_PER_KILL;
                    showFloatingTextForUnit(sourceUnit, `+${GOLD_PER_KILL}g`, 'pickup');
                    // ── XP: assist — nearby allies who dealt damage to this target ──
                    for (const ally of state.units.filter(u => !u.dead && u.player === sourceUnit.player && u.id !== sourceUnit.id)) {
                        if ((ally._trackDmgDealt || 0) > 0) {
                            // Simple proximity assist: allies on same floor within 5 tiles
                            const dist = Math.abs(ally.x - target.x) + Math.abs(ally.y - target.y);
                            if (dist <= 5) {
                                grantXP(ally, XP_ASSIST, 'assist');
                                // ── GOLD: assist bounty ──
                                ally.gold = (ally.gold || 0) + GOLD_PER_ASSIST;
                            }
                        }
                    }
                    // ── KILL STREAK (centralized for ALL damage sources) ──
                    processKillStreak(sourceUnit);
                    // ── OVERKILL ──
                    processOverkill(sourceUnit, target, Math.abs(target.hp));
                    // ── FIRST BLOOD ──
                    const totalKillsThisMatch = state.units.reduce((s, u) => s + (u._matchKills || 0), 0);
                    if (totalKillsThisMatch === 1) checkAchievement('firstBlood', sourceUnit);
                }
                // ── BOSS KILL: special handling for neutral boss units ──
                if (target._isBoss) {
                    handleBossKill(target, sourceUnit);
                }
                defeatUnit(target, sourceUnit);
                return true;
            }
            // ── LAST STAND CHECK ──
            checkLastStand(target);
            return false;
        }

        // ── TOWER AUTO-ATTACK: towers hit ALL enemy units within radius at start of EACH turn ──
        // ── TOWER MOVEMENT: each tower moves within its 2×2 home box toward nearby enemies ──
        function moveTowers() {
            if (!state.towers) return;
            for (const tOwner of [1, 2]) {
                const tower = state.towers[tOwner];
                if (!tower || tower.hp <= 0 || !tower.homeBox) continue;
                const box = tower.homeBox;
                // Collect all valid tiles in the 2×2 box
                const candidates = [];
                for (let by = box.y1; by <= box.y2; by++) {
                    for (let bx = box.x1; bx <= box.x2; bx++) {
                        // Can't move where a unit is standing
                        if (state.units.some(u => !u.dead && getSectionForUnit(u) === 'earth' && u.x === bx && u.y === by)) continue;
                        // Can't move where the other tower is
                        const otherOwner = tOwner === 1 ? 2 : 1;
                        const otherT = state.towers[otherOwner];
                        if (otherT && otherT.hp > 0 && otherT.x === bx && otherT.y === by) continue;
                        candidates.push({ x: bx, y: by });
                    }
                }
                if (candidates.length === 0) continue;
                // Find nearest enemy on ground floor
                const enemies = state.units.filter(u => !u.dead && u.player !== tOwner && getSectionForUnit(u) === 'earth');
                if (enemies.length > 0) {
                    // Pick the tile that minimizes distance to nearest enemy
                    let bestTile = null, bestDist = Infinity;
                    for (const c of candidates) {
                        let minDist = Infinity;
                        for (const e of enemies) {
                            const d = Math.abs(e.x - c.x) + Math.abs(e.y - c.y);
                            if (d < minDist) minDist = d;
                        }
                        if (minDist < bestDist) {
                            bestDist = minDist;
                            bestTile = c;
                        }
                    }
                    if (bestTile && (bestTile.x !== tower.x || bestTile.y !== tower.y)) {
                        tower.x = bestTile.x;
                        tower.y = bestTile.y;
                        _invalidateBoardGrid();
                    }
                } else {
                    // No enemies visible — stay put or move randomly
                    const pick = candidates[randInt(candidates.length)];
                    tower.x = pick.x;
                    tower.y = pick.y;
                }
            }
        }

        function towerAutoAttack(player) {
            if (!state.towers) return;
            // Both towers fire every turn (not just the active player's tower)
            for (const tOwner of [1, 2]) {
                const tower = state.towers[tOwner];
                if (!tower || tower.hp <= 0) continue;
                const TOWER_ATTACK_RADIUS = 4;
                const TOWER_BASE_DMG = 250;
                const enemy = tOwner === 1 ? 2 : 1;
                // Find all enemy units on the ground floor within radius
                const targets = aliveUnitsOnFloor(enemy, 'ground').filter(e => {
                    const d = Math.abs(e.x - tower.x) + Math.abs(e.y - tower.y);
                    return d >= 1 && d <= TOWER_ATTACK_RADIUS;
                });
                if (targets.length === 0) continue;
                // Attack ALL enemies in radius (sorted closest first)
                targets.sort((a, b) => {
                    const da = Math.abs(a.x - tower.x) + Math.abs(a.y - tower.y);
                    const db = Math.abs(b.x - tower.x) + Math.abs(b.y - tower.y);
                    return da !== db ? da - db : a.hp - b.hp;
                });
                for (const target of targets) {
                    if (_bufferingRoundEvents) _reBeginGroup(`🐉 P${tOwner} Dragon → ${unitDisplayName(target)}`);
                    const dist = Math.abs(target.x - tower.x) + Math.abs(target.y - tower.y);
                    // Damage falls off slightly with distance
                    const distPenalty = Math.max(0, (dist - 1) * 16);
                    const baseDmg = Math.max(40, TOWER_BASE_DMG + randInt(40) - 16 - distPenalty - (target.def || 0));
                    const dmg = baseDmg;
                    addLog(`🐉 P${tOwner} Dragon fires at ${unitDisplayName(target)} for ${dmg} damage!`);
                    playProjectile(tower.x, tower.y, target.x, target.y, 'damage', actionMs(420));
                    showFloatingTextForUnit(target, `-${dmg}`, 'damage');
                    applyDamageToUnit(target, dmg, `🐉 Dragon blast: `, {
                        ignoreArmor: false
                    });
                }
            }
        }

        // ── PLAYER TURRET AUTO-ATTACK: deployed turrets fire at enemy units within range ──
        function processPlayerTurrets(player) {
            if (!state.turrets || !state.turrets.length) return;
            const turrets = state.turrets.filter(t => t.owner === player && t.hp > 0);
            for (const turret of turrets) {
                const enemies = aliveUnitsOnFloor(enemyOf(player), 'ground')
                    .filter(e => Math.abs(e.x - turret.x) + Math.abs(e.y - turret.y) <= turret.range)
                    .sort((a, b) => a.hp - b.hp); // target lowest HP
                if (enemies.length > 0) {
                    const target = enemies[0];
                    if (_bufferingRoundEvents) _reBeginGroup(`🔧 Turret → ${unitDisplayName(target)}`);
                    const dmg = Math.max(24, turret.dmg + randInt(24) - 8);
                    addLog(`🔧 Turret at ${coordLabel(turret.x, turret.y)} fires at ${unitDisplayName(target)} for ${dmg} damage!`);
                    showFloatingTextForUnit(target, `-${dmg}`, 'damage');
                    applyDamageToUnit(target, dmg, `🔧 Turret blast: `, {
                        ignoreArmor: false,
                        damageType: 'physical'
                    });
                }
            }
        }

        // ── Damage turrets when enemies attack their tile ──
        function damageTurretAt(x, y, dmg, attackerUnit) {
            if (!state.turrets) return false;
            const turret = state.turrets.find(t => t.x === x && t.y === y && t.hp > 0);
            if (!turret) return false;
            turret.hp = Math.max(0, turret.hp - dmg);
            addLog(`🔧 Turret at ${coordLabel(x, y)} takes ${dmg} damage! (${turret.hp}/${turret.maxHp} HP)`);
            showFloatingTextAtTile(x, y, `-${dmg}`, 'damage', {
                durationMs: 700
            });
            if (turret.hp <= 0) {
                addLog(`🔧 Turret at ${coordLabel(x, y)} has been destroyed!`);
                state.turrets = state.turrets.filter(t => t !== turret);
                scheduleBoardRender();
            }
            return true;
        }

        function applySeedTileEffects(player) {
            if (!state.plantedSeeds) return;
            // Remove seeds whose tile is no longer grass
            state.plantedSeeds = state.plantedSeeds.filter(seed => getTerrainAt(seed.x, seed.y) === 'grass');
            // ── Drought scorches seeds: remove healing, poison, and leech seeds inside drought tiles ──
            if (state.activeWeather && state.activeWeather.length > 0) {
                const droughtTiles = new Set();
                for (const w of state.activeWeather) {
                    if (w.type === 'drought') {
                        for (const t of w.tiles) droughtTiles.add(posKey(t.x, t.y));
                    }
                }
                if (droughtTiles.size > 0) {
                    const before = state.plantedSeeds.length;
                    state.plantedSeeds = state.plantedSeeds.filter(seed => {
                        if (droughtTiles.has(posKey(seed.x, seed.y))) {
                            addLog(`☀ The Drought scorches a ${seed.type === 'heal' ? 'Healing' : seed.type === 'poison' ? 'Poison' : 'Leech'} Seed at ${coordLabel(seed.x, seed.y)}!`);
                            return false;
                        }
                        return true;
                    });
                }
            }
            // Decrement seed durations (legacy seeds that still have a duration field)
            for (const seed of state.plantedSeeds) {
                if (seed.duration !== undefined && seed.duration !== null) seed.duration--;
            }
            state.plantedSeeds = state.plantedSeeds.filter(s => s.duration === undefined || s.duration === null || s.duration > 0);
            for (const unit of aliveUnitsFor(player)) {
                const seedsHere = state.plantedSeeds.filter(s => s.x === unit.x && s.y === unit.y);
                for (const seed of seedsHere) {
                    if (seed.type === 'heal' && unit.player === seed.owner) {
                        // Check for rain (any water-seeding weather on this tile)
                        const weatherHere = getWeatherAtTile(unit.x, unit.y);
                        const isRaining = weatherHere.some(w => {
                            const wObj = (state.activeWeather || []).find(aw => aw.tiles.some(t => t.x === unit.x && t.y === unit.y));
                            const wDef = wObj ? WEATHER_REGISTRY[wObj.type] : null;
                            return wDef && (wDef.seedTerrain === 'water' || wObj.type === 'thunderstorm' || wObj.type === 'hurricane');
                        });
                        const healAmt = isRaining ? 12 : 6;
                        const healed = applyHealingToUnit(unit, healAmt, null);
                        if (healed > 0) addLog(`🌱 Healing Seed ${isRaining ? 'blooms in the rain and ' : ''}restores ${healed} HP to ${unitDisplayName(unit)}.`);
                    } else if (seed.type === 'poison' && unit.player !== seed.owner) {
                        if (!unitHasStatus(unit, 'poison')) {
                            const caster = unitFromId(seed.casterUnitId);
                            applyStatusPayload(unit, { id: 'poison', duration: 2 }, '🌿 Poison Seed: ', caster);
                        }
                    } else if (seed.type === 'leech') {
                        if (unit.player !== seed.owner) {
                            applyDamageToUnit(unit, 4, `🌿 Leech Seed drains ${unitDisplayName(unit)}: `, {
                                ignoreArmor: true,
                                damageType: 'dot',
                                consumeMarked: false
                            });
                            // Heal a random ally of the seed owner on the field
                            const ownerAllies = aliveUnitsFor(seed.owner);
                            if (ownerAllies.length > 0) {
                                const target = ownerAllies.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
                                const healed = applyHealingToUnit(target, 4, null);
                                if (healed > 0) addLog(`🌿 Leech Seed channels ${healed} HP to ${unitDisplayName(target)}.`);
                            }
                        } else {
                            // Allies get healed
                            const healed = applyHealingToUnit(unit, 3, null);
                            if (healed > 0) addLog(`🌿 Leech Seed nourishes ${unitDisplayName(unit)} for ${healed} HP.`);
                        }
                    }
                }
            }
        }

        function unitFromId(id) {
            return state.units.find(u => u.id === id) || null;
        }

        function getSquareArea(cx, cy, radius = 1) {
            const out = [];
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = cx + dx;
                    const ny = cy + dy;
                    if (isInside(nx, ny)) out.push({
                        x: nx,
                        y: ny
                    });
                }
            }
            return out;
        }

        function normalizeLoadoutForClass(loadout, cls) {
            const normalized = emptyLoadout();
            // V2: spells are auto-learned in battle — builder doesn't assign spells
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
            // Accessories only
            normalized.equipment = { accessory1: null, accessory2: null };
            if (loadout?.equipment) {
                normalized.equipment.accessory1 = loadout.equipment.accessory1 || null;
                normalized.equipment.accessory2 = loadout.equipment.accessory2 || null;
            }
            return normalized;
        }

        function getEffectiveEquipCost(spell, cls, race) {
            if (!spell) return 0;
            let cost = spell.equipCost ?? spell.cost ?? 0;
            // Job preference: -1 if preferred, +1 if not preferred (only if preference exists)
            if (Array.isArray(spell.jobPreference) && spell.jobPreference.length > 0) {
                cost += spell.jobPreference.includes(cls) ? -1 : 1;
            }
            // Race preference: -1 if preferred, +1 if not preferred (only if preference exists)
            if (Array.isArray(spell.racePreference) && spell.racePreference.length > 0) {
                const raceKey = (race || '').toLowerCase().trim();
                cost += spell.racePreference.includes(raceKey) ? -1 : 1;
            }
            return Math.max(1, cost);
        }

        function getLoadoutPoints(loadout, cls, race) {
            return (loadout.spells || []).reduce((sum, id) => sum + getEffectiveEquipCost(getSpellById(id), cls, race), 0);
        }

        function getItemCapForClass(cls, itemKey) {
            if (itemKey === 'scanner') return cls === 'Agent' ? 2 : 1;
            return ITEM_RULES[itemKey].max;
        }

        function getTotalItemCount(unit) {
            return Object.values(unit.items || {}).reduce((a, b) => a + b, 0);
        }

        function unitItemsFull(unit) {
            return getTotalItemCount(unit) >= CONFIG.unitItemSlots;
        }

        function canUseItemNow(unit, itemKey) {
            if (!unit || unit.dead) return false;
            if ((unit.items?.[itemKey] || 0) <= 0) return false;
            if (itemKey === 'healPotion') {
                return unit.hp < unit.maxHp;
            }
            if (itemKey === 'manaPotion') {
                return state.units.some(t => !t.dead && t.player === unit.player && (t.maxMp || 0) > 0 && t.mp < t.maxMp);
            }
            if (itemKey === 'scanner') return true;
            if (itemKey === 'panacea') {
                // Only usable if unit has at least one debuff
                if (!unit.status) return false;
                return Object.keys(unit.status).some(k => STATUS_DEFS[k]?.kind === 'debuff');
            }
            if (itemKey === 'warpStone') return true;
            return true;
        }

        const TRADEABLE_ITEM_KEYS = ['healPotion', 'manaPotion', 'scanner', 'panacea', 'warpStone', 'humanBane', 'divineBane', 'unholyBane', 'techBane', 'anomalyBane', 'alienBane'];

        function canTradeWithUnit(source, target) {
            if (!source || !target || source.id === target.id) return false;
            if (source.dead || target.dead) return false;
            if (source.player !== target.player) return false;
            return Math.max(Math.abs(source.x - target.x), Math.abs(source.y - target.y)) <= 1;
        }

        function moveSingleItemBetweenUnits(fromUnit, toUnit, itemKey) {
            if (!fromUnit || !toUnit || !itemKey) return false;
            if ((fromUnit.items?.[itemKey] || 0) <= 0) return false;
            const cap = getItemCapForClass(toUnit.cls, itemKey);
            if ((toUnit.items?.[itemKey] || 0) >= cap) return false;
            if (unitItemsFull(toUnit)) return false;
            fromUnit.items[itemKey] -= 1;
            toUnit.items[itemKey] = (toUnit.items[itemKey] || 0) + 1;
            return true;
        }

        function findMovePath(unit, destX, destY) {
            if (!unit || !isInside(destX, destY)) return [];
            const startKey = posKey(unit.x, unit.y);
            const goalKey = posKey(destX, destY);
            const parents = new Map();
            const costs = new Map([
                [startKey, 0]
            ]);
            const open = [{
                x: unit.x,
                y: unit.y,
                cost: 0
            }];
            while (open.length) {
                // PERF: min-scan + swap-remove — O(n) instead of sort's O(n log n)
                let minI = 0;
                for (let i = 1; i < open.length; i++) {
                    if (open[i].cost < open[minI].cost) minI = i;
                }
                const cur = open[minI];
                open[minI] = open[open.length - 1];
                open.pop();
                const curKey = posKey(cur.x, cur.y);
                if (curKey === goalKey) break;
                if (cur.cost > (costs.get(curKey) ?? Infinity)) continue;
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
                    const nx = cur.x + dx;
                    const ny = cur.y + dy;
                    // Diagonal: require at least one adjacent cardinal tile to be passable (no wall-clipping)
                    if (dx !== 0 && dy !== 0) {
                        const canPassX = isInside(cur.x + dx, cur.y) && unitCanTraverse(unit, cur.x + dx, cur.y);
                        const canPassY = isInside(cur.x, cur.y + dy) && unitCanTraverse(unit, cur.x, cur.y + dy);
                        if (!canPassX && !canPassY) continue;
                    }
                    const key = posKey(nx, ny);
                    if (!isInside(nx, ny) || !unitCanTraverse(unit, nx, ny)) continue;
                    // Allow passing through friendly units (they step aside) — only block on enemies
                    const _pathBlocker = unitAt(nx, ny);
                    if ((nx !== destX || ny !== destY) && _pathBlocker && _pathBlocker.player !== unit.player) continue;
                    const nextCost = cur.cost + getTerrainMoveCost(unit, nx, ny);
                    if (nextCost > getEffectiveMove(unit)) continue;
                    if (nextCost >= (costs.get(key) ?? Infinity)) continue;
                    costs.set(key, nextCost);
                    parents.set(key, curKey);
                    open.push({
                        x: nx,
                        y: ny,
                        cost: nextCost
                    });
                }
            }
            if (!costs.has(goalKey)) return [];
            const path = [];
            let curKey = goalKey;
            while (curKey && curKey !== startKey) {
                const [x, y] = curKey.split(',').map(Number);
                path.push({
                    x,
                    y
                });
                curKey = parents.get(curKey);
            }
            path.reverse();
            return path;
        }

        function getPathPickupEvent(unit, x, y) {
            const bomb = state.bombs.find(b => b.x === x && b.y === y && b.owner !== unit.player) || null;
            if (bomb) return {
                kind: 'bomb',
                x,
                y
            };
            const visibleHourglasses = groundHourglassesAt(x, y).filter(h => h.visibleTo?.[unit.player]);
            // Hourglasses are only obtainable via inspection — walking over them does nothing
            return null;
        }

        function revealGroundPickupsForUnit(unit, x, y) {
            // Hourglasses are only obtainable via inspection — walking reveals nothing
            return { revealedHourglasses: 0, revealedItems: 0 };
        }

        function finishMoveAt(unit, x, y, opts = {}) {
            const stopReason = opts.stopReason || null;
            const moveLabel = opts.destinationLabel || coordLabel(x, y);
            const dist = Math.abs(unit.x - x) + Math.abs(unit.y - y);
            unit._trackTilesMoved = (unit._trackTilesMoved || 0) + Math.max(1, dist);
            playSfx('moveStep');
            unit.x = x;
            unit.y = y;
            unit.movesThisTurn = (unit.movesThisTurn || 0) + 1;
            updateTerrainStay(unit);
            spendAP(unit, AP_COST_ACTION);
            state.actionMode = null;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            state.pendingTarget = null;
            addLog(`${unitDisplayName(unit)} moves to ${moveLabel}.`, unit.player);

            const bombIndex = state.bombs.findIndex(b => b.x === x && b.y === y && b.owner !== unit.player);
            if (bombIndex >= 0) {
                const bomb = state.bombs.splice(bombIndex, 1)[0];
                detonateBomb(bomb, `Bomb trap detonates at ${coordLabel(x, y)}.`);
            }
        }

        function moveHourglassesBetweenUnits(fromUnit, toUnit, amount = 1) {
            if (!fromUnit || !toUnit || amount <= 0 || (fromUnit.hourglasses || 0) <= 0) return 0;
            const carried = state.hourglasses.filter(h => h.carriedBy === fromUnit.id);
            if (!carried.length) return 0;
            const moveCount = Math.max(0, Math.min(amount, carried.length));
            for (let i = 0; i < moveCount; i++) {
                carried[i].carriedBy = toUnit.id;
            }
            fromUnit.hourglasses = Math.max(0, (fromUnit.hourglasses || 0) - moveCount);
            toUnit.hourglasses = (toUnit.hourglasses || 0) + moveCount;
            // Transfer personal buff along with the hourglasses
            const buffTransfer = Math.min(fromUnit.hourglassBuff || 0, moveCount);
            fromUnit.hourglassBuff = Math.max(0, (fromUnit.hourglassBuff || 0) - buffTransfer);
            toUnit.hourglassBuff = (toUnit.hourglassBuff || 0) + buffTransfer;
            // Update team display totals
            if (fromUnit.player !== toUnit.player && buffTransfer > 0) {
                state.hourglassBuffs[fromUnit.player] = Math.max(0, (state.hourglassBuffs[fromUnit.player] || 0) - buffTransfer);
                state.hourglassBuffs[toUnit.player] = (state.hourglassBuffs[toUnit.player] || 0) + buffTransfer;
            }
            return moveCount;
        }

        function openTradeDialog(source, target) {
            // Create staged copies of inventories so arrows preview without committing
            state.uiDialog = {
                type: 'trade',
                sourceId: source.id,
                targetId: target.id,
                staged: {
                    srcHourglasses: source.hourglasses || 0,
                    tgtHourglasses: target.hourglasses || 0,
                    srcItems: Object.fromEntries(Object.keys(ITEM_RULES).map(k => [k, source.items?.[k] || 0])),
                    tgtItems: Object.fromEntries(Object.keys(ITEM_RULES).map(k => [k, target.items?.[k] || 0]))
                },
                hasChanges: false
            };
            markDirty('dialog', 'board', 'selectedUnit');
            renderIfDirty();
        }


        function doTrade(unit, x, y) {
            if (!canUnitAct(unit)) {
                addLog('That unit already acted this round.');
                return;
            }
            const target = unitAt(x, y);
            if (!target || !canTradeWithUnit(unit, target)) {
                addLog('Choose a nearby living ally to trade with.');
                playErrorSfx();
                return;
            }
            openTradeDialog(unit, target);
            return;
        }


        function lootCorpseItems(looter, corpse) {
            if (!looter || !corpse || !corpse.dead || corpse.id === looter.id) return 0;
            let looted = 0;
            const itemOrder = Object.keys(ITEM_RULES);
            for (const itemKey of itemOrder) {
                while ((corpse.items?.[itemKey] || 0) > 0) {
                    const cap = getItemCapForClass(looter.cls, itemKey);
                    if ((looter.items?.[itemKey] || 0) >= cap) break;
                    if (unitItemsFull(looter)) break;
                    looter.items[itemKey] = (looter.items[itemKey] || 0) + 1;
                    corpse.items[itemKey] -= 1;
                    looted += 1;
                }
            }
            return looted;
        }

        function getLoadoutValidation(loadout, cls, race) {
            const pointsUsed = getLoadoutPoints(loadout, cls, race);
            const totalItems = Object.values(loadout.items || {}).reduce((a, b) => a + b, 0);
            const crossClassCount = countCrossClassSpells(loadout.spells || [], cls);
            return {
                pointsUsed,
                pointsRemaining: CONFIG.unitSpellBudget - pointsUsed,
                totalItems,
                itemSlotsRemaining: CONFIG.unitItemSlots - totalItems,
                scannerCap: getItemCapForClass(cls, 'scanner'),
                crossClassCount,
                valid: pointsUsed <= CONFIG.unitSpellBudget && totalItems <= CONFIG.unitItemSlots && (loadout.items.scanner || 0) <= getItemCapForClass(cls, 'scanner') && crossClassCount <= CONFIG.maxCrossClassSpells
            };
        }

        function syncPartyBuildsFromInputs() {
            repairPartyBuilderState();
            // Sync the active builder-center unit first so its state is up-to-date
            if (typeof syncBuilderCenter === 'function') syncBuilderCenter();

            // Ensure all units have valid loadouts with default items and accessories
            [1, 2].forEach(player => {
                for (let i = 0; i < CONFIG.teamSize; i++) {
                    const cls = state.partyBuilds[player][i];
                    if (!state.loadouts[player]) state.loadouts[player] = [];
                    if (!state.loadouts[player][i]) state.loadouts[player][i] = emptyLoadout();
                    const lo = state.loadouts[player][i];
                    // Default items: health potion, mana potion, panacea
                    if (!lo.items || Object.values(lo.items).reduce((a,b) => a+b, 0) === 0) {
                        lo.items = Object.fromEntries(Object.keys(ITEM_RULES).map(k => [k, 0]));
                        lo.items.healPotion = 1;
                        lo.items.manaPotion = 1;
                        lo.items.panacea = 1;
                    }
                    // Default accessories
                    if (!lo.equipment) lo.equipment = emptyEquipment();
                    // Normalize
                    state.loadouts[player][i] = normalizeLoadoutForClass(lo, cls);
                }
            });
        }

        function validateBuilderLoadouts(showAlert = true) {
            syncPartyBuildsFromInputs();
            return true;
        }

        function canPlaceHourglassAt(x, y) {
            return !state.hourglasses.some(h => h.carriedBy === null && Math.max(Math.abs(h.x - x), Math.abs(h.y - y)) <= 2);
        }

        function canPlaceHiddenItemAt(x, y, floor) {
            const f = floor || 'ground';
            if (state.hourglasses.some(h => h.carriedBy === null && h.x === x && h.y === y)) return false;
            return !state.hiddenItems.some(item => item.collectedBy === null && item.x === x && item.y === y);
        }

        function rollHiddenItemType() {
            const roll = Math.random();
            if (roll < 0.35) return 'healPotion';
            if (roll < 0.70) return 'manaPotion';
            if (roll < 0.82) return 'scanner';
            // 18% chance for a random bane item
            const baneTypes = ['humanBane', 'divineBane', 'unholyBane', 'techBane', 'anomalyBane', 'alienBane'];
            return baneTypes[randInt(baneTypes.length)];
        }

        // ── Hidden item spawning removed — only hourglasses spawn on the map ──
        function _spawnHiddenItemsOnly() {
            // No-op: hidden item pickups have been removed
        }

        function randomizeSharedObjectives() {
            const mpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;

            // ── Skip hourglass/item spawning if mode doesn't use them ──
            if (mpMode && mpMode.hasHourglasses === false) {
                state.hourglasses = [];
                state.hiddenItems = [];
                // Still spawn hidden items (potions, scanners) for non-hourglass modes
                _spawnHiddenItemsOnly();
                return;
            }

            const candidates = [];
            for (let y = 0; y < bh(); y++) {
                for (let x = 0; x < bw(); x++) {
                    if (!unitAt(x, y) && isTerrainPassable(x, y)) candidates.push({
                        x,
                        y
                    });
                }
            }

            // ── CENTER-COLUMN HOURGLASS SPAWNING ──
            // Hourglasses spawn in the middle 2–4 columns of the map to create
            // a contested zone both players must race toward equally.
            const w = bw();
            const centerSpan = w >= 20 ? 4 : (w >= 8 ? 2 : w); // small maps: entire width is fair game
            const centerMinX = Math.floor(w / 2) - Math.floor(centerSpan / 2);
            const centerMaxX = centerMinX + centerSpan - 1;

            function getCenterCandidatesForFloor(floorId, terrain) {
                const floorCandidates = [];
                if (!terrain) return floorCandidates;
                for (let y = 0; y < terrain.length; y++) {
                    for (let x = 0; x < (terrain[y]?.length || 0); x++) {
                        if (x < centerMinX || x > centerMaxX) continue;
                        const t = terrain[y][x];
                        if (floorId === 'ground' && !unitAt(x, y) && isTerrainPassable(x, y)) {
                            floorCandidates.push({ x, y });
                        } else if (floorId === 'sky' && t && t !== 'sky_void' && t !== 'sky_open') {
                            floorCandidates.push({ x, y });
                        } else if (floorId === 'underground' && t && t !== 'cave_wall' && t !== 'void') {
                            floorCandidates.push({ x, y });
                        }
                    }
                }
                return floorCandidates;
            }

            function spawnHourglassesOnFloor(floorId, terrain, count) {
                let placed = 0;
                // Try center columns first
                let pool = getCenterCandidatesForFloor(floorId, terrain);
                pool.sort(() => Math.random() - 0.5);
                for (const spot of pool) {
                    if (canPlaceHourglassAt(spot.x, spot.y)) {
                        state.hourglasses.push({
                            id: `hg-${state.hourglasses.length + 1}`,
                            x: spot.x,
                            y: spot.y,
                            floor: floorId,
                            visibleTo: { 1: false, 2: false },
                            carriedBy: null
                        });
                        placed++;
                        if (placed >= count) return placed;
                    }
                }
                // Fallback: if center columns couldn't fit enough, expand to full map
                if (placed < count) {
                    let fallback = [];
                    if (floorId === 'ground') {
                        fallback = candidates.filter(c => c.x < centerMinX || c.x > centerMaxX);
                    } else if (terrain) {
                        for (let y = 0; y < terrain.length; y++) {
                            for (let x = 0; x < (terrain[y]?.length || 0); x++) {
                                if (x >= centerMinX && x <= centerMaxX) continue;
                                const t = terrain[y][x];
                                if (floorId === 'sky' && t && t !== 'sky_void' && t !== 'sky_open') fallback.push({ x, y });
                                if (floorId === 'underground' && t && t !== 'cave_wall' && t !== 'void') fallback.push({ x, y });
                            }
                        }
                    }
                    fallback.sort(() => Math.random() - 0.5);
                    for (const spot of fallback) {
                        if (canPlaceHourglassAt(spot.x, spot.y)) {
                            state.hourglasses.push({
                                id: `hg-${state.hourglasses.length + 1}`,
                                x: spot.x,
                                y: spot.y,
                                floor: floorId,
                                visibleTo: { 1: false, 2: false },
                                carriedBy: null
                            });
                            placed++;
                            if (placed >= count) return placed;
                        }
                    }
                }
                return placed;
            }

            // Spawn hourglasses across map sections (only spawn on sections that exist)
            const hgPerSection = Math.max(1, Math.ceil(CONFIG.winHourglasses / (MAP_HAS_FLOORS ? 3 : 1)));
            spawnHourglassesOnFloor('earth', state.boardTerrain, MAP_HAS_FLOORS ? hgPerSection : CONFIG.winHourglasses);
            if (MAP_HAS_FLOORS) {
                spawnHourglassesOnFloor('above', state.boardTerrain, hgPerSection);
                spawnHourglassesOnFloor('below', state.boardTerrain, hgPerSection);
            }
        }

        // ── PERIODIC HOURGLASS RESPAWN ──
        // Every 10 rounds, spawn up to 3 new hourglasses on the ground floor
        // in the center columns. Cap at 6 uncollected hourglasses on ground.
        function spawnPeriodicHourglasses() {
            const RESPAWN_COUNT = 3;
            const MAX_UNCOLLECTED_GROUND = 6;

            // Count uncollected hourglasses on ground
            const uncollectedGround = state.hourglasses.filter(
                h => h.carriedBy === null
            ).length;
            const canSpawn = Math.min(RESPAWN_COUNT, MAX_UNCOLLECTED_GROUND - uncollectedGround);
            if (canSpawn <= 0) return;

            // Build center-biased candidate tiles on the ground floor
            const w = bw(), h = bh();
            const centerSpan = w >= 20 ? 6 : (w >= 8 ? 4 : w);
            const centerMinX = Math.floor(w / 2) - Math.floor(centerSpan / 2);
            const centerMaxX = centerMinX + centerSpan - 1;

            const centerPool = [];
            const terrain = state.boardTerrain || state.boardTerrain;
            for (let y = 0; y < h; y++) {
                for (let x = centerMinX; x <= centerMaxX; x++) {
                    if (!unitAt(x, y) && isTerrainPassable(x, y) && canPlaceHourglassAt(x, y)) {
                        centerPool.push({ x, y });
                    }
                }
            }
            centerPool.sort(() => Math.random() - 0.5);

            let placed = 0;
            for (const spot of centerPool) {
                if (placed >= canSpawn) break;
                // Re-check spacing (pool may have shifted from earlier placements this call)
                if (!canPlaceHourglassAt(spot.x, spot.y)) continue;
                if (unitAt(spot.x, spot.y)) continue;
                state.hourglasses.push({
                    id: `hg-${state.hourglasses.length + 1}`,
                    x: spot.x,
                    y: spot.y,
                    floor: 'ground',
                    visibleTo: { 1: false, 2: false },
                    carriedBy: null
                });
                placed++;
            }

            if (placed > 0) {
                addLog(`⏳ ${placed} new hourglass${placed > 1 ? 'es' : ''} materialized in the center of the battlefield!`);
            }
        }

        // ══════════════════════════════════════════════════════════════
        // ── BOSS SYSTEM — DISABLED ──
        // ══════════════════════════════════════════════════════════════
        function isBossUnit() { return false; }
        function getBossOccupiedTiles(unit) { return [{ x: unit.x, y: unit.y }]; }
        function isTileOccupiedByBoss() { return null; }
        function getBossSpriteUrl() { return ''; }
        function checkBossSpawns() {}
        function processBossPassiveAbility() {}
        function processBossTurn() {}
        function handleBossKill() {}




        function makeUnitsFromBuilds() {
            repairPartyBuilderState();
            const out = [];
            [1, 2].forEach(player => {
                state.partyBuilds[player].forEach((clsName, idx) => {
                    clsName = normalizeClassName(clsName, DEFAULT_BUILDS[player]?.[idx]);
                    const spawn = SPAWNS[player][idx];
                    const template = CLASS_TEMPLATES[clsName] || CLASS_TEMPLATES[Object.keys(CLASS_TEMPLATES)[0]];
                    const loadout = normalizeLoadoutForClass(state.loadouts[player]?.[idx] || emptyLoadout(), clsName);
                    ensurePartyMeta();
                    const unit = createUnit(`${player}-${idx}`, player, spawn.x, spawn.y, template, loadout, state.partyMeta?.[player]?.[idx] || null);
                    const fallbackName = getDefaultUnitName(clsName);
                    unit.name = sanitizeUnitName(state.partyNames?.[player]?.[idx], fallbackName);
                    out.push(unit);
                });
            });
            return out;
        }

        function randomizeEquipmentForClass(cls) {
            // Equipment removed — return accessories-only stub
            const accPool = Object.keys(EQUIP_DEFS).filter(id => EQUIP_DEFS[id]?.slot === 'accessory1');
            const shuffled = accPool.slice().sort(() => Math.random() - 0.5);
            return {
                accessory1: shuffled[0] || null,
                accessory2: shuffled.find(a => a !== shuffled[0]) || shuffled[1] || null
            };
        }

        function randomSpellLoadoutForClass(cls, race) {
            const loadout = emptyLoadout();
            const pool = getEligibleSpellsForClass(cls).slice().sort(() => Math.random() - 0.5);
            let budget = CONFIG.unitSpellBudget;
            let slot = 0;
            let crossClassCount = 0;
            // First pass: fill greedily from shuffled pool
            for (const spell of pool) {
                if (slot >= CONFIG.unitSkillSlots) break;
                const ec = getEffectiveEquipCost(spell, cls, race);
                if (ec > budget) continue;
                const isCross = !isSpellNativeToClass(spell, cls);
                if (isCross && crossClassCount >= CONFIG.maxCrossClassSpells) continue;
                loadout.spells[slot] = spell.id;
                budget -= ec;
                slot += 1;
                if (isCross) crossClassCount++;
            }
            // Second pass: if slots remain, try cheapest spells we missed
            if (slot < CONFIG.unitSkillSlots) {
                const usedIds = new Set(loadout.spells.filter(Boolean));
                const remaining = getEligibleSpellsForClass(cls)
                    .filter(s => !usedIds.has(s.id))
                    .sort((a, b) => getEffectiveEquipCost(a, cls, race) - getEffectiveEquipCost(b, cls, race));
                for (const spell of remaining) {
                    if (slot >= CONFIG.unitSkillSlots) break;
                    const ec = getEffectiveEquipCost(spell, cls, race);
                    if (ec > budget) continue;
                    const isCross = !isSpellNativeToClass(spell, cls);
                    if (isCross && crossClassCount >= CONFIG.maxCrossClassSpells) continue;
                    loadout.spells[slot] = spell.id;
                    budget -= ec;
                    slot += 1;
                    if (isCross) crossClassCount++;
                }
            }
            // Fill all item slots
            const scannerCap = getItemCapForClass(cls, 'scanner');
            let remainingItems = CONFIG.unitItemSlots;
            if (Math.random() > 0.45 && scannerCap > 0) {
                const scanCount = Math.min(scannerCap, 1 + (Math.random() < 0.3 && scannerCap > 1 ? 1 : 0));
                loadout.items.scanner = scanCount;
                remainingItems -= scanCount;
            }
            // Allocate 1-2 random banes
            const baneKeys = ['humanBane', 'divineBane', 'unholyBane', 'techBane', 'anomalyBane', 'alienBane'];
            const baneCount = remainingItems >= 4 ? (Math.random() < 0.5 ? 2 : 1) : (remainingItems >= 2 ? 1 : 0);
            if (baneCount > 0) {
                const shuffled = baneKeys.slice().sort(() => Math.random() - 0.5);
                for (let b = 0; b < baneCount && remainingItems > 0; b++) {
                    loadout.items[shuffled[b]] = 1;
                    remainingItems -= 1;
                }
            }
            // Fill remaining with heal and mana potions
            if (remainingItems > 0) {
                const healShare = Math.random() < 0.5 ? Math.ceil(remainingItems * 0.6) : Math.floor(remainingItems * 0.4);
                loadout.items.healPotion = Math.min(remainingItems, healShare);
                remainingItems -= loadout.items.healPotion;
            }
            if (remainingItems > 0) {
                loadout.items.manaPotion = remainingItems;
            }
            // Random accessories
            loadout.equipment = randomizeEquipmentForClass(cls);

            return normalizeLoadoutForClass(loadout, cls);
        }

        function randomizeParty(player) {
            if (isOnlineMatch() && player !== getLocalPlayer()) {
                addLog("You can only randomize your own team.");
                return;
            }
            syncPartyBuildsFromInputs();
            const classNames = Object.keys(CLASS_TEMPLATES);
            // Pick random identities first, then derive jobs from race locks
            state.partyMeta[player] = Array.from({ length: CONFIG.teamSize }, () => randomizeIdentity());
            state.partyBuilds[player] = state.partyMeta[player].map(meta => {
                const race = meta.race || 'homosapien';
                const lockedJob = (race !== 'homosapien' && RACE_DEFAULT_JOBS[race]) ? RACE_DEFAULT_JOBS[race] : null;
                return lockedJob || classNames[randInt(classNames.length)];
            });
            state.partyNames[player] = state.partyBuilds[player].map(cls => getDefaultUnitName(cls));
            state.loadouts[player] = state.partyBuilds[player].map((cls, idx) => randomSpellLoadoutForClass(cls, state.partyMeta[player][idx]?.race || ''));
            ensurePartyMeta();
            state.units = makeUnitsFromBuilds();
            state.selectedUnitId = null;
            state.focusedUnitId = null;
            state.hoverUnitId = null;
            state.actionMode = null;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            state.pendingTarget = null;
            state.hourglasses = [];
            state.hourglassBuffs = {
                1: 0,
                2: 0
            };
            state.hiddenItems = [];
            state.foundByPlayer = {
                1: new Set(),
                2: new Set()
            };
            state.scannedByPlayer = {
                1: new Set(),
                2: new Set()
            };
            state.boardTerrain = [];
            state.placed = false;
            state._winLogged = false;
            state._winCondition = null;
            state._endingReason = null;
            state._stalemateRounds = 0;
            state._lastActivityTotal = 0;
            state.setupStep = 'builder';
            state.bombs = [];
            state.plantedSeeds = [];
            state.warpRunes = [];
            state.wards = [];
            state.turrets = [];
            state._flairRevealTiles = {
                1: null,
                2: null
            };
            addLog(`Player ${player} party randomized with a fresh loadout.`);
            state.teamLockedIn = false;
            render();
        }

        function randomizeUnitSlot(player, idx, optimize = false) {
            if (isOnlineMatch() && player !== getLocalPlayer()) {
                addLog("You can only change your own team.");
                return;
            }
            syncPartyBuildsFromInputs();
            const classNames = Object.keys(CLASS_TEMPLATES);
            ensurePartyMeta();
            state.partyMeta[player][idx] = randomizeIdentity();
            const slotRace = state.partyMeta[player][idx]?.race || '';
            const lockedJob = (slotRace !== 'homosapien' && RACE_DEFAULT_JOBS[slotRace]) ? RACE_DEFAULT_JOBS[slotRace] : null;
            const cls = lockedJob || classNames[randInt(classNames.length)];
            state.partyBuilds[player][idx] = cls;
            state.partyNames[player][idx] = getDefaultUnitName(cls);
            state.loadouts[player][idx] = optimize ? optimizeLoadoutForClass(cls, slotRace) : randomSpellLoadoutForClass(cls, slotRace);
            state.units = makeUnitsFromBuilds();
            addLog(`${optimize ? 'Randomized and optimized' : 'Randomized'} Player ${player} Slot ${idx + 1} as ${cls}.`);
            state.teamLockedIn = false;
            render();
        }

        function randomizeAllTeams(optimize = false) {
            if (!state.devAutoSim) syncPartyBuildsFromInputs();
            _buildersToUpdate().forEach(player => {
                const classNames = Object.keys(CLASS_TEMPLATES);
                // Pick random identities first, then derive jobs from race locks
                state.partyMeta[player] = Array.from({ length: CONFIG.teamSize }, () => randomizeIdentity());
                state.partyBuilds[player] = state.partyMeta[player].map(meta => {
                    const race = meta.race || 'homosapien';
                    const lockedJob = (race !== 'homosapien' && RACE_DEFAULT_JOBS[race]) ? RACE_DEFAULT_JOBS[race] : null;
                    return lockedJob || classNames[randInt(classNames.length)];
                });
                state.partyNames[player] = state.partyBuilds[player].map(cls => getDefaultUnitName(cls));
                state.loadouts[player] = state.partyBuilds[player].map((cls, idx) => optimize ? optimizeLoadoutForClass(cls, state.partyMeta[player][idx]?.race || '') : randomSpellLoadoutForClass(cls, state.partyMeta[player][idx]?.race || ''));
            });
            ensurePartyMeta();
            state.units = makeUnitsFromBuilds();
            state.teamLockedIn = false;
            addLog(optimize ? 'Both parties randomized with optimal loadouts.' : 'Both parties randomized with unique loadouts — all slots filled.');
            render();
        }

        function optimizeCurrentTeams() {
            syncPartyBuildsFromInputs();
            _buildersToUpdate().forEach(player => {
                state.partyBuilds[player].forEach((cls, idx) => {
                    const race = state.partyMeta?.[player]?.[idx]?.race || '';
                    const loadout = state.loadouts[player][idx] || emptyLoadout();

                    // ── Fill empty accessory slots with class-appropriate accessories ──
                    if (!loadout.equipment) loadout.equipment = emptyEquipment();
                    const accessoryPrefs = {
                        'Agent': ['binoculars', 'telescope'],
                        'Gunslinger': ['telescope', 'binoculars'],
                        'Black Mage': ['flair', 'binoculars'],
                        'White Mage': ['walkie_talkie', 'ward'],
                        'Knight': ['ward', 'flair'],
                        'Psychic': ['walkie_talkie', 'ward'],
                        'Harvester': ['ward', 'walkie_talkie']
                    } [cls] || ['ward', 'binoculars'];
                    for (const accSlot of ['accessory1', 'accessory2']) {
                        if (!loadout.equipment[accSlot]) {
                            const pick = accessoryPrefs.find(a => a !== loadout.equipment.accessory1 && a !== loadout.equipment.accessory2);
                            if (pick) {
                                loadout.equipment[accSlot] = pick;
                                accessoryPrefs.splice(accessoryPrefs.indexOf(pick), 1);
                            }
                        }
                    }

                    // ── Fill empty spell slots (keep existing, add best available) ──
                    const existingSpells = (loadout.spells || []).slice();
                    let budgetUsed = existingSpells.reduce((sum, id) => sum + getEffectiveEquipCost(getSpellById(id), cls, race), 0);
                    let crossClassCount = countCrossClassSpells(existingSpells, cls);
                    const usedSpellIds = new Set(existingSpells.filter(Boolean));

                    // Get preferred spells for this class, then all eligible as fallback
                    const preferred = {
                        'Agent': ['empBurst', 'taser', 'electroDart', 'placeBomb', 'scanPulse'],
                        'Black Mage': ['meteor', 'wallOfFire', 'thunder1', 'fire1', 'thunderstorm'],
                        'White Mage': ['divineIntervention', 'healAll', 'revive1', 'heal1', 'protect1'],
                        'Knight': ['judgment', 'dragonSlash', 'guardSlash', 'shieldBash', 'fortify'],
                        'Gunslinger': ['deadEye', 'shootout', 'doubleShot', 'ricochet1', 'shoot'],
                        'Psychic': ['mindShatter', 'psychosis', 'teleport', 'glare', 'warpRune'],
                        'Harvester': ['overgrowth', 'lifeDrain', 'leechSeed', 'healingSeed', 'poisonSeed'],
                        'Engineer': ['siegeTurret', 'overclock', 'deployTurret', 'buildBridge'],
                        'Harbinger': ['requiem', 'encore', 'warCry', 'discordance'],
                        'Raider': ['broadside', 'cannonBlast', 'grapple', 'plunder'],
                        'Sniper': ['headshot', 'precisionShot', 'spotter', 'camouflage'],
                        'Freelancer': ['wildcard', 'mimic', 'jackOfAll', 'improvise']
                    } [cls] || [];
                    const eligible = getEligibleSpellsForClass(cls);
                    const candidateIds = [...preferred, ...eligible.map(s => s.id)];
                    const seen = new Set();
                    const uniqueCandidates = candidateIds.filter(id => {
                        if (seen.has(id) || usedSpellIds.has(id)) return false;
                        seen.add(id);
                        return true;
                    });

                    for (let s = 0; s < CONFIG.unitSkillSlots; s++) {
                        if (existingSpells[s]) continue; // already has a spell here
                        // Try to fill this slot
                        for (let c = 0; c < uniqueCandidates.length; c++) {
                            const spellId = uniqueCandidates[c];
                            const spell = getSpellById(spellId);
                            if (!spell) continue;
                            const ec = getEffectiveEquipCost(spell, cls, race);
                            if (budgetUsed + ec > CONFIG.unitSpellBudget) continue;
                            const isCross = !isSpellNativeToClass(spell, cls);
                            if (isCross && crossClassCount >= CONFIG.maxCrossClassSpells) continue;
                            existingSpells[s] = spellId;
                            budgetUsed += ec;
                            if (isCross) crossClassCount++;
                            uniqueCandidates.splice(c, 1);
                            break;
                        }
                    }
                    loadout.spells = existingSpells;

                    // ── Fill empty item slots (keep existing, fill remaining) ──
                    const totalItems = Object.values(loadout.items || {}).reduce((a, b) => a + b, 0);
                    let remaining = CONFIG.unitItemSlots - totalItems;
                    if (remaining > 0) {
                        // Fill with class-appropriate items
                        const scannerCap = getItemCapForClass(cls, 'scanner');
                        if ((loadout.items.scanner || 0) < scannerCap && (cls === 'Agent' || cls === 'Gunslinger') && remaining > 0) {
                            const toAdd = Math.min(remaining, scannerCap - (loadout.items.scanner || 0));
                            loadout.items.scanner = (loadout.items.scanner || 0) + toAdd;
                            remaining -= toAdd;
                        }
                        // Add a bane if no banes equipped yet
                        const _hasBane = Object.keys(ITEM_RULES).some(k => ITEM_RULES[k].baneType && (loadout.items[k] || 0) > 0);
                        if (!_hasBane && remaining > 0) {
                            const _bKeys = Object.keys(ITEM_RULES).filter(k => ITEM_RULES[k].baneType);
                            const _pick = _bKeys[Math.floor(Math.random() * _bKeys.length)];
                            loadout.items[_pick] = 1;
                            remaining -= 1;
                        }
                        // Fill the rest with heal and mana potions
                        const healFirst = ['Knight', 'White Mage', 'Harvester'].includes(cls);
                        if (healFirst) {
                            const healAdd = Math.min(remaining, Math.ceil(remaining * 0.6));
                            loadout.items.healPotion = (loadout.items.healPotion || 0) + healAdd;
                            remaining -= healAdd;
                            loadout.items.manaPotion = (loadout.items.manaPotion || 0) + remaining;
                        } else {
                            const manaAdd = Math.min(remaining, Math.ceil(remaining * 0.6));
                            loadout.items.manaPotion = (loadout.items.manaPotion || 0) + manaAdd;
                            remaining -= manaAdd;
                            loadout.items.healPotion = (loadout.items.healPotion || 0) + remaining;
                        }
                    }

                    state.loadouts[player][idx] = normalizeLoadoutForClass(loadout, cls);
                });
            });
            ensurePartyMeta();
            state.units = makeUnitsFromBuilds();
            state.teamLockedIn = false;
            addLog(isOnlineMatch() ? `Player ${getLocalPlayer()}'s empty slots auto-filled.` : 'Auto-filled empty slots without changing existing selections.');
            render();
        }

        // Reset ALL units for both teams to class-default loadouts (wipes everything)
        function defaultAllTeams() {
            syncPartyBuildsFromInputs();
            _buildersToUpdate().forEach(player => {
                state.partyBuilds[player].forEach((cls, idx) => {
                    const race = state.partyMeta?.[player]?.[idx]?.race || '';
                    state.loadouts[player][idx] = optimizeLoadoutForClass(cls, race);
                });
            });
            ensurePartyMeta();
            state.units = makeUnitsFromBuilds();
            state.teamLockedIn = false;
            addLog(isOnlineMatch() ? `Player ${getLocalPlayer()}'s loadouts reset to class defaults.` : 'Both parties reset to class-default loadouts.');
            render();
        }

        // Auto-fill a single unit's empty slots without changing existing selections
        function autoFillUnitLoadout(player, idx) {
            if (isOnlineMatch() && player !== getLocalPlayer()) {
                addLog("You can only auto-fill your own team.");
                return;
            }
            syncPartyBuildsFromInputs();
            const cls = state.partyBuilds[player][idx];
            const race = state.partyMeta?.[player]?.[idx]?.race || '';
            const loadout = state.loadouts[player][idx] || emptyLoadout();

            // ── Fill empty accessory slots with class-appropriate accessories ──
            if (!loadout.equipment) loadout.equipment = emptyEquipment();
            const accPrefs2 = ({
                'Agent': ['binoculars', 'telescope'],
                'Gunslinger': ['telescope', 'binoculars'],
                'Black Mage': ['flair', 'binoculars'],
                'White Mage': ['walkie_talkie', 'ward'],
                'Knight': ['ward', 'flair'],
                'Psychic': ['walkie_talkie', 'ward'],
                'Harvester': ['ward', 'walkie_talkie']
            } [cls] || ['ward', 'binoculars']).slice();
            for (const accSlot of ['accessory1', 'accessory2']) {
                if (!loadout.equipment[accSlot]) {
                    const pick = accPrefs2.find(a => a !== loadout.equipment.accessory1 && a !== loadout.equipment.accessory2);
                    if (pick) {
                        loadout.equipment[accSlot] = pick;
                        accPrefs2.splice(accPrefs2.indexOf(pick), 1);
                    }
                }
            }
            const existingSpells = (loadout.spells || []).slice();
            let budgetUsed = existingSpells.reduce((sum, id) => sum + getEffectiveEquipCost(getSpellById(id), cls, race), 0);
            let crossClassCount = countCrossClassSpells(existingSpells, cls);
            const usedSpellIds = new Set(existingSpells.filter(Boolean));

            const preferred = {
                'Agent': ['empBurst', 'taser', 'electroDart', 'placeBomb', 'scanPulse'],
                'Black Mage': ['meteor', 'wallOfFire', 'thunder1', 'fire1', 'thunderstorm'],
                'White Mage': ['divineIntervention', 'healAll', 'revive1', 'heal1', 'protect1'],
                'Knight': ['judgment', 'dragonSlash', 'guardSlash', 'shieldBash', 'fortify'],
                'Gunslinger': ['deadEye', 'shootout', 'doubleShot', 'ricochet1', 'shoot'],
                'Psychic': ['mindShatter', 'psychosis', 'teleport', 'glare', 'warpRune'],
                'Harvester': ['overgrowth', 'lifeDrain', 'leechSeed', 'healingSeed', 'poisonSeed'],
                'Engineer': ['siegeTurret', 'overclock', 'deployTurret', 'buildBridge'],
                'Harbinger': ['requiem', 'encore', 'warCry', 'discordance'],
                'Raider': ['broadside', 'cannonBlast', 'grapple', 'plunder'],
                'Sniper': ['headshot', 'precisionShot', 'spotter', 'camouflage'],
                'Freelancer': ['wildcard', 'mimic', 'jackOfAll', 'improvise']
            } [cls] || [];
            const eligible = getEligibleSpellsForClass(cls);
            const candidateIds = [...preferred, ...eligible.map(s => s.id)];
            const seen = new Set();
            const uniqueCandidates = candidateIds.filter(id => {
                if (seen.has(id) || usedSpellIds.has(id)) return false;
                seen.add(id);
                return true;
            });

            for (let s = 0; s < CONFIG.unitSkillSlots; s++) {
                if (existingSpells[s]) continue;
                for (let c = 0; c < uniqueCandidates.length; c++) {
                    const spellId = uniqueCandidates[c];
                    const spell = getSpellById(spellId);
                    if (!spell) continue;
                    const ec = getEffectiveEquipCost(spell, cls, race);
                    if (budgetUsed + ec > CONFIG.unitSpellBudget) continue;
                    const isCross = !isSpellNativeToClass(spell, cls);
                    if (isCross && crossClassCount >= CONFIG.maxCrossClassSpells) continue;
                    existingSpells[s] = spellId;
                    budgetUsed += ec;
                    if (isCross) crossClassCount++;
                    uniqueCandidates.splice(c, 1);
                    break;
                }
            }
            loadout.spells = existingSpells;

            // ── Fill empty item slots (keep existing, fill remaining) ──
            const totalItems = Object.values(loadout.items || {}).reduce((a, b) => a + b, 0);
            let remaining = CONFIG.unitItemSlots - totalItems;
            if (remaining > 0) {
                const scannerCap = getItemCapForClass(cls, 'scanner');
                if ((loadout.items.scanner || 0) < scannerCap && (cls === 'Agent' || cls === 'Gunslinger') && remaining > 0) {
                    const toAdd = Math.min(remaining, scannerCap - (loadout.items.scanner || 0));
                    loadout.items.scanner = (loadout.items.scanner || 0) + toAdd;
                    remaining -= toAdd;
                }
                // Add a bane if no banes equipped yet
                const _hasBane2 = Object.keys(ITEM_RULES).some(k => ITEM_RULES[k].baneType && (loadout.items[k] || 0) > 0);
                if (!_hasBane2 && remaining > 0) {
                    const _bKeys2 = Object.keys(ITEM_RULES).filter(k => ITEM_RULES[k].baneType);
                    const _pick2 = _bKeys2[Math.floor(Math.random() * _bKeys2.length)];
                    loadout.items[_pick2] = 1;
                    remaining -= 1;
                }
                const healFirst = ['Knight', 'White Mage', 'Harvester'].includes(cls);
                if (healFirst) {
                    const healAdd = Math.min(remaining, Math.ceil(remaining * 0.6));
                    loadout.items.healPotion = (loadout.items.healPotion || 0) + healAdd;
                    remaining -= healAdd;
                    loadout.items.manaPotion = (loadout.items.manaPotion || 0) + remaining;
                } else {
                    const manaAdd = Math.min(remaining, Math.ceil(remaining * 0.6));
                    loadout.items.manaPotion = (loadout.items.manaPotion || 0) + manaAdd;
                    remaining -= manaAdd;
                    loadout.items.healPotion = (loadout.items.healPotion || 0) + remaining;
                }
            }

            state.loadouts[player][idx] = normalizeLoadoutForClass(loadout, cls);
            const fallback = getDefaultUnitName(cls);
            state.partyNames[player][idx] = sanitizeUnitName(state.partyNames[player][idx], fallback);
            addLog(`Auto-filled empty slots for Player ${player} Slot ${idx + 1} (${cls}).`);
            state.teamLockedIn = false;
            render();
        }

        function saveCurrentTeams() {
            syncPartyBuildsFromInputs();
            const payload = {
                partyBuilds: JSON.parse(JSON.stringify(state.partyBuilds)),
                partyNames: JSON.parse(JSON.stringify(state.partyNames)),
                loadouts: JSON.parse(JSON.stringify(state.loadouts)),
                partyMeta: JSON.parse(JSON.stringify(state.partyMeta || {})),
                savedAt: new Date().toISOString()
            };
            ewSaveLoadModal({
                storageKey: 'ew_saved_teams_v2',
                type: 'Team',
                mode: 'save',
                maxSlots: 10,
                defaultName: 'Team ' + (Object.keys(JSON.parse(localStorage.getItem('ew_saved_teams_v2') || '{}')).length + 1),
                onSave: function(name) {
                    try {
                        const slots = JSON.parse(localStorage.getItem('ew_saved_teams_v2') || '{}');
                        slots[name] = payload;
                        localStorage.setItem('ew_saved_teams_v2', JSON.stringify(slots));
                        addLog('Team "' + name + '" saved.');
                        ewToast('Team "' + name + '" saved.');
                    } catch(e) {
                        ewToast('Could not save team.');
                    }
                }
            });
        }

        function loadSavedTeams() {
            ewSaveLoadModal({
                storageKey: 'ew_saved_teams_v2',
                type: 'Team',
                mode: 'load',
                maxSlots: 10,
                onLoad: function(name, slots) {
                    try {
                        repairPartyBuilderState();
                        const payload = slots[name];
                        if (!payload) { ewToast('Save not found.'); return; }
                        [1, 2].forEach(player => {
                            state.partyBuilds[player] = (payload.partyBuilds?.[player] || DEFAULT_BUILDS[player]).slice(0, CONFIG.teamSize);
                            while (state.partyBuilds[player].length < CONFIG.teamSize) state.partyBuilds[player].push(DEFAULT_BUILDS[player][state.partyBuilds[player].length] || Object.keys(CLASS_TEMPLATES)[0]);
                            state.partyNames[player] = state.partyBuilds[player].map((cls, idx) => normalizeDisplayedUnitName(payload.partyNames?.[player]?.[idx], cls, player, idx));
                            state.loadouts[player] = state.partyBuilds[player].map((cls, idx) => normalizeLoadoutForClass(payload.loadouts?.[player]?.[idx] || emptyLoadout(), cls));
                            if (payload.partyMeta?.[player]) {
                                if (!state.partyMeta) state.partyMeta = {};
                                state.partyMeta[player] = JSON.parse(JSON.stringify(payload.partyMeta[player]));
                            }
                        });
                        state.units = makeUnitsFromBuilds();
                        state.teamLockedIn = false;
                        addLog('Team "' + name + '" loaded.');
                        ewToast('Team "' + name + '" loaded.');
                        render();
                    } catch(e) {
                        ewToast('Could not load team.');
                    }
                }
            });
        }

        let _logRenderQueued = false;
        let _logThrottleTimer = null;
        // vis: 0 = visible to all, 1 = P1 only, 2 = P2 only
        function addLog(msg, vis) {
            if (!msg) return;
            if (/\b(?:has used its action|skips .*?'s action|skips .* action\.)\b/i.test(msg)) return;
            state.logEntries = state.logEntries || [];
            const entry = (vis === 1 || vis === 2) ? {
                m: msg,
                v: vis
            } : msg;
            state.logEntries.push(entry);
            if (state.logEntries.length > 180) state.logEntries = state.logEntries.slice(-180);
            // PERF: during devsim, throttle log renders to max once per 200ms
            if (state.devAutoSim) {
                if (!_logThrottleTimer) {
                    _logThrottleTimer = setTimeout(() => {
                        _logThrottleTimer = null;
                        renderLog();
                    }, 200);
                }
                return;
            }
            if (!_logRenderQueued) {
                _logRenderQueued = true;
                window.requestAnimationFrame(() => {
                    _logRenderQueued = false;
                    renderLog();
                    renderAudioControls();
                    renderTimer();
                });
            }
        }

        // Helper: extract message text from a log entry (string or {m, v} object)
        function _logMsg(entry) {
            return typeof entry === 'string' ? entry : (entry && entry.m) || '';
        }
        // Helper: extract visibility from a log entry (0 = all)
        function _logVis(entry) {
            return (typeof entry === 'object' && entry && entry.v) ? entry.v : 0;
        }
        // Helper: should this entry be shown to the viewer?
        function _logVisible(entry) {
            if (!ONLINE_RULES.active) return true; // offline: show everything
            const v = _logVis(entry);
            if (v === 0) return true;
            return v === getViewerPlayer();
        }

        // ── Combat log filter: exclude routine movement noise from HUD dialogue ──
        const _dialogueSkipPatterns = [
            /moves to [A-Z]\d/i,           // "X moves to L5" — routine tile movement
            /stops on a visible/i,          // auto-pickup during movement
            /uncovers a hidden.*keeps moving/i, // hidden item pass-through
            /^Reset Player/i,               // setup messages
            /copied\.$/, /^Pasted/i,        // clipboard messages
            /locked in/i,                   // lobby messages
            /^waiting for/i,                // lobby messages
            /map size changed/i,            // setup messages
        ];
        function _isDialogueWorthy(entry) {
            const msg = _logMsg(entry).replace(/<[^>]+>/g, '');
            if (!msg || msg.length < 3) return false;
            for (const pat of _dialogueSkipPatterns) {
                if (pat.test(msg)) return false;
            }
            return true;
        }

        // ── Unified HUD dialogue box rendering ──
        // Shows dialogue as a floating subtitle at bottom-center of the screen.
        // Called by renderHudActions (passive) and renderLog (live updates during AI turns)
        let _lastDialogueHtml = '';
        function _renderDialogueBox(col) {
            // col argument kept for call-site compat but ignored — we render to subtitle bar
            const bar = document.getElementById('battleSubtitleBar');
            const textEl = document.getElementById('battleSubtitleText');
            if (!bar || !textEl) return;

            // Priority: active battle dialogue (crits, super effective, level ups, etc.)
            const bdq = state.battleDialogueQueue || [];
            if (bdq.length > 0) {
                const html = bdq[bdq.length - 1];
                if (html !== _lastDialogueHtml) {
                    textEl.innerHTML = html;
                    _lastDialogueHtml = html;
                }
                bar.classList.add('visible');
                return;
            }

            // Fallback: single most recent important combat log entry
            const entries = state.logEntries || [];
            let lastEntry = null;
            for (let i = entries.length - 1; i >= 0; i--) {
                const e = entries[i];
                if (_logVisible(e) && _isDialogueWorthy(e)) {
                    lastEntry = e;
                    break;
                }
            }

            if (lastEntry) {
                const msg = _logMsg(lastEntry).replace(/<[^>]+>/g, '');
                if (msg !== _lastDialogueHtml) {
                    textEl.innerHTML = msg;
                    _lastDialogueHtml = msg;
                }
                bar.classList.add('visible');
            } else {
                bar.classList.remove('visible');
                _lastDialogueHtml = '';
            }
        }

        function aliveUnitsFor(player) {
            return state.units.filter(u => u.player === player && !u.dead && !u._dying)
                .sort((a, b) => (b.spd || 5) - (a.spd || 5)); // fastest acts first
        }
        // Returns all alive units hostile to the given player (enemy team + neutral bosses)
        function getHostileUnits(player) {
            return state.units.filter(u => !u.dead && !u._dying && u.player !== player);
        }
        // Floor-scoped version: only units on the specified floor (defaults to current)
        function aliveUnitsOnFloor(player, _floor) {
            // Floor parameter ignored — unified map, no separate floors
            return state.units.filter(u => u.player === player && !u.dead && !u._dying);
        }

        function getSelectedUnit() {
            return state.units.find(u => u.id === state.selectedUnitId && !u.dead && !u._dying) || null;
        }

        function getFocusedUnit() {
            return state.units.find(u => u.id === (state.focusedUnitId || state.selectedUnitId)) || null;
        }

        const UNIT_MAX_AP = 3;
        const AP_COST_SPELL = 2;
        const AP_COST_ACTION = 1; // move, attack, inspect, item, trade
        const UNIT_MAX_MOVES = 2; // units can move up to 2 times per turn
        const COMBO_AP_COST_INITIATOR = 2; // combo costs 3 AP total: 2 from initiator + 1 from partner
        const COMBO_AP_COST_PARTNER = 1;

        // ══════════════════════════════════════════════════════════════
        // ── XP / LEVELING SYSTEM (per-match, resets each game) ──────
        // ══════════════════════════════════════════════════════════════
        const XP_MAX_LEVEL = 10;
        const XP_THRESHOLDS = [0, 40, 95, 170, 265, 380, 515, 670, 850, 1060]; // XP needed for levels 1-10 (raised ~40% to slow progression)
        // Level rewards applied on level-up (V2 — spell auto-learn system):
        //  Lv1: match start — 2× main job T1 spells, main weapon, no offhand
        //  Lv2: +1 main job spell (T1/T2) + 1 stat
        //  Lv3: +1 main job spell (T2) + 1 stat · Spell Shop unlocks
        //  Lv4: Secondary Job pick + offhand weapon + 1 sec job T1 spell + 1 stat
        //  Lv5: +1 main job spell (T2/T3) + 1 stat · Slots full (6/6)
        //  Lv6: +1 AP cap + 1 stat · Sec Job T2 in shop
        //  Lv7: Combo attacks unlocked + 1 stat
        //  Lv8: Cross-class T2 in shop + 1 stat
        //  Lv9: +1 AP cap (2nd) + 1 stat
        //  Lv10: Ascension + 2 stats · Sec Job T3 in shop
        const XP_STAT_UPGRADE_PER_LEVEL = { 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 2 };

        // XP amounts — FLAT per-action, not per-HP (immune to stat inflation)
        const XP_PASSIVE_PER_ROUND   = 2;
        const XP_KILL               = 14;
        const XP_ASSIST             = 6;
        const XP_DAMAGE_DEALT       = 0;     // REMOVED — was scaling with inflated base stats
        const XP_DAMAGE_FLAT        = 4;     // flat XP per damaging hit (replaces per-HP)
        const XP_SUPER_EFFECTIVE    = 3;
        const XP_HEAL               = 0;     // REMOVED — was scaling with inflated HP pools
        const XP_HEAL_FLAT          = 4;     // flat XP per heal cast (replaces per-HP)
        const XP_BUFF_APPLIED       = 3;
        const XP_DEBUFF_APPLIED     = 3;
        const XP_INSPECT            = 3;
        const XP_SCAN               = 4;
        const XP_TOWER_DAMAGE       = 0;     // REMOVED — was scaling with tower HP
        const XP_TOWER_DAMAGE_FLAT  = 5;     // flat XP per tower hit
        const XP_COUNTER            = 4;
        const XP_DODGE              = 3;
        const XP_SPELL_CAST         = 2;
        const XP_FIND_HIDDEN_ITEM   = 0;     // discovery XP removed — inspect/scan XP covers this
        const XP_FIND_HOURGLASS     = 0;     // discovery XP removed — collect grants XP instead
        const XP_COLLECT_HOURGLASS  = 10;    // picking up an hourglass
        const XP_ENV_BONUS_HIT      = 2;     // attacking with any environmental advantage active
        const XP_BUFF_ASSIST        = 2;     // unit deals damage while carrying a buff you applied
        const XP_COMBO              = 5;

        function getUnitLevel(unit) {
            if (!unit) return 1;
            const xp = unit._xp || 0;
            for (let lvl = XP_MAX_LEVEL; lvl >= 2; lvl--) {
                if (xp >= XP_THRESHOLDS[lvl - 1]) return lvl;
            }
            return 1;
        }

        function getXPForNextLevel(unit) {
            const lvl = getUnitLevel(unit);
            if (lvl >= XP_MAX_LEVEL) return null;
            return XP_THRESHOLDS[lvl]; // threshold for next level
        }

        function getXPProgressPct(unit) {
            const lvl = getUnitLevel(unit);
            if (lvl >= XP_MAX_LEVEL) return 100;
            const xp = unit._xp || 0;
            const currentThreshold = XP_THRESHOLDS[lvl - 1];
            const nextThreshold = XP_THRESHOLDS[lvl];
            const range = nextThreshold - currentThreshold;
            if (range <= 0) return 100;
            return Math.min(100, Math.max(0, ((xp - currentThreshold) / range) * 100));
        }

        function grantXP(unit, amount, reason) {
            if (!unit || unit.dead || !amount || amount <= 0) return;
            if (state.phase !== 'battle' || state.winner) return;
            const amt = Math.max(0, Math.round(amount));
            if (amt <= 0) return;
            const prevLevel = getUnitLevel(unit);
            unit._xp = (unit._xp || 0) + amt;
            const newLevel = getUnitLevel(unit);
            // XP bar updates on next panel render — no floating text
            // Level up!
            if (newLevel > prevLevel) {
                for (let lvl = prevLevel + 1; lvl <= newLevel; lvl++) {
                    applyLevelUpRewards(unit, lvl);
                }
                playSfx('levelUp');
            }
        }

        function applyLevelUpRewards(unit, level) {
            if (!unit) return;
            const name = unitDisplayName(unit);
            const cls = unit.job || unit.cls;

            // ── Stat upgrades — all 5 combat stats boost every level (JRPG style) ──
            const gains = (typeof LEVEL_UP_GAINS !== 'undefined') ? LEVEL_UP_GAINS[level] : null;
            if (gains) {
                unit.maxHp = (unit.maxHp || 0) + gains.hp;
                unit.hp = Math.min((unit.hp || 0) + gains.hp, unit.maxHp);
                unit.maxMp = (unit.maxMp || unit.mp || 0) + gains.mp;
                unit.mp = Math.min((unit.mp || 0) + gains.mp, unit.maxMp);
                unit.atk = (unit.atk || 0) + gains.atk;
                unit.def = (unit.def || 0) + gains.def;
                unit.intStat = (unit.intStat || 0) + gains.int;
            }

            // ── Auto-learn spells from CLASS_SPELL_LEARN_ORDER ──
            const learnOrder = typeof CLASS_SPELL_LEARN_ORDER !== 'undefined' ? CLASS_SPELL_LEARN_ORDER[cls] : null;
            // Spell learn schedule: Lv1=[0,1], Lv2=[2], Lv3=[3], Lv5=[4]
            // Lv4 spell comes from secondary job (handled separately)
            let spellsToLearn = [];
            if (learnOrder) {
                if (level === 1) {
                    spellsToLearn = [learnOrder[0], learnOrder[1]].filter(Boolean);
                } else if (level === 2) {
                    spellsToLearn = [learnOrder[2]].filter(Boolean);
                } else if (level === 3) {
                    spellsToLearn = [learnOrder[3]].filter(Boolean);
                } else if (level === 5) {
                    spellsToLearn = [learnOrder[4]].filter(Boolean);
                }
            }
            for (const spellId of spellsToLearn) {
                learnSpellForUnit(unit, spellId);
            }

            // ── Milestone rewards ──
            let milestoneMsg = '';
            const gainStr = gains ? `+${gains.hp} HP, +${gains.atk} ATK, +${gains.def} DEF, +${gains.int} INT` : '';
            if (level === 2) {
                milestoneMsg = gainStr;
                addLog(`⬆ ${name} reaches Lv.2! ${gainStr}`);
            } else if (level === 3) {
                milestoneMsg = 'Spell Shop unlocks!';
                addLog(`⬆ ${name} reaches Lv.3! Spell Shop unlocks! ${gainStr}`);
            } else if (level === 4) {
                unit._pendingSecondaryJobPick = true;
                milestoneMsg = 'Choose a Secondary Job!';
                addLog(`⬆ ${name} reaches Lv.4! Choose a Secondary Job! ${gainStr}`);
            } else if (level === 5) {
                milestoneMsg = 'All spell slots filled!';
                addLog(`⬆ ${name} reaches Lv.5! All spell slots filled! ${gainStr}`);
            } else if (level === 6) {
                unit._xpBonusAP = (unit._xpBonusAP || 0) + 1;
                unit.ap = Math.min(unit.ap + 1, UNIT_MAX_AP + (unit._xpBonusAP || 0));
                milestoneMsg = '+1 AP cap!';
                addLog(`⬆ ${name} reaches Lv.6! +1 AP cap! ${gainStr}`);
            } else if (level === 7) {
                milestoneMsg = 'Combo attacks unlocked!';
                addLog(`⬆ ${name} reaches Lv.7! Combo attacks unlocked! ${gainStr}`);
            } else if (level === 8) {
                milestoneMsg = 'Cross-class T2 in shop!';
                addLog(`⬆ ${name} reaches Lv.8! Cross-class T2 spells in shop! ${gainStr}`);
            } else if (level === 9) {
                unit._xpBonusAP = (unit._xpBonusAP || 0) + 1;
                unit.ap = Math.min(unit.ap + 1, UNIT_MAX_AP + (unit._xpBonusAP || 0));
                milestoneMsg = '+1 AP cap (2nd)!';
                addLog(`⬆ ${name} reaches Lv.9! +1 AP cap (2nd)! ${gainStr}`);
            } else if (level === 10) {
                milestoneMsg = '✨ ASCENSION!';
                addLog(`⬆ ${name} reaches Lv.10! ✨ ASCENSION! ${gainStr}`);
            }
            if (level > 1 && !state.devAutoSim) {
                showFloatingTextForUnit(unit, `⬆ LEVEL ${level}!`, 'levelup', { durationMs: 1800 });
                playSfx('uiButtonConfirm');
                // Build combined dialogue message
                const dlgLines = [];
                dlgLines.push(`<span class="dlg-levelup">⬆ ${escapeHtml(name)} — LEVEL ${level}!</span>`);
                if (milestoneMsg) {
                    dlgLines.push(`<span class="dlg-levelup" style="font-size:16px">${escapeHtml(milestoneMsg)}</span>`);
                }
                for (const spellId of spellsToLearn) {
                    const sp = getSpellById(spellId);
                    if (sp) dlgLines.push(`<span class="dlg-spell-learn">✨ Learned ${escapeHtml(sp.name)}!</span>`);
                }
                showBattleDialogue(dlgLines, 2200 + spellsToLearn.length * 400);
            }
            markDirty('selectedUnit', 'actions', 'board');
        }

        /** Learn a spell by ID and add it to the unit's active spell list */
        function learnSpellForUnit(unit, spellId) {
            if (!unit || !spellId) return;
            const cls = unit.job || unit.cls;
            const spell = getSpellById(spellId);
            if (!spell) return;
            // Don't learn duplicates
            if (unit.spells && unit.spells.some(s => s && s.id === spellId)) return;
            const adjusted = adjustSpellForClass(spell, cls);
            if (!adjusted) return;
            // Track in _spellSlots
            if (!unit._spellSlots) unit._spellSlots = [];
            const maxSlots = typeof SPELL_SLOT_MAX !== 'undefined' ? SPELL_SLOT_MAX : 6;
            if (unit._spellSlots.length >= maxSlots) return; // slots full — shop swap needed
            unit._spellSlots.push(spellId);
            // Add to active spells array
            if (!unit.spells) unit.spells = [];
            unit.spells.push(adjusted);
            // Caller (applyLevelUpRewards) handles the dialogue display
        }

        /** Apply secondary job selection — learn T1 spell, set _secondaryJob */
        function applySecondaryJob(unit, jobName) {
            if (!unit || !jobName) return;
            unit._secondaryJob = jobName;
            unit._pendingSecondaryJobPick = false;

            // Auto-learn the FIRST T1 spell from the secondary job's learn order
            const learnOrder = typeof CLASS_SPELL_LEARN_ORDER !== 'undefined' ? CLASS_SPELL_LEARN_ORDER[jobName] : null;
            if (learnOrder && learnOrder[0]) {
                learnSpellForUnit(unit, learnOrder[0]);
            }

            const name = unitDisplayName(unit);
            addLog(`🎭 ${name} chose ${jobName} as secondary job!`);
            if (!state.devAutoSim) {
                const spellLearned = learnOrder?.[0] ? getSpellById(learnOrder[0]) : null;
                const dlgLines = [
                    `<span class="dlg-sec-job">🎭 ${escapeHtml(name)} — ${escapeHtml(jobName)}!</span>`,
                    `<span class="dlg-sec-job" style="font-size:16px">Secondary Job Chosen</span>`
                ];
                if (spellLearned) {
                    dlgLines.push(`<span class="dlg-spell-learn">✨ Learned ${escapeHtml(spellLearned.name)}!</span>`);
                }
                showBattleDialogue(dlgLines, 2400);
            }
            markDirty('selectedUnit', 'actions', 'board');
        }

        /** AI secondary job selection — pick based on team composition */
        function aiPickSecondaryJob(unit) {
            if (!unit) return;
            const mainJob = unit.job || unit.cls;
            const allJobs = typeof JOB_MODIFIERS !== 'undefined' ? Object.keys(JOB_MODIFIERS) : [];
            const eligible = allJobs.filter(j => j !== mainJob);
            if (eligible.length === 0) return;

            const team = state.units.filter(u => u.player === unit.player && !u.dead);
            const teamJobs = new Set(team.map(u => u.job || u.cls));
            const teamSecondaryJobs = new Set(team.map(u => u._secondaryJob).filter(Boolean));

            // Categorize jobs by role
            const healers = ['White Mage', 'Harvester'];
            const tanks = ['Knight', 'Engineer'];
            const ranged = ['Gunslinger', 'Sniper', 'Black Mage'];
            const support = ['Harbinger', 'Psychic', 'White Mage'];
            const melee = ['Knight', 'Raider', 'Agent', 'Freelancer'];

            // Score each eligible job
            const scores = eligible.map(job => {
                let score = 10; // base

                // Prefer jobs not already on the team (main or secondary)
                if (!teamJobs.has(job) && !teamSecondaryJobs.has(job)) score += 8;
                else if (!teamSecondaryJobs.has(job)) score += 3;

                // Complement the main job's role
                const isMainMelee = melee.includes(mainJob);
                const isMainRanged = ranged.includes(mainJob);
                const isMainSupport = support.includes(mainJob) || healers.includes(mainJob);

                if (isMainMelee && ranged.includes(job)) score += 5;
                if (isMainMelee && support.includes(job)) score += 3;
                if (isMainRanged && melee.includes(job)) score += 4;
                if (isMainRanged && tanks.includes(job)) score += 3;
                if (isMainSupport && melee.includes(job)) score += 5;
                if (isMainSupport && ranged.includes(job)) score += 4;

                // Slight bonus for damage-dealing secondaries (always useful)
                if (['Black Mage', 'Gunslinger', 'Sniper', 'Raider'].includes(job)) score += 2;

                // If team has no healer, strongly prefer healer secondary
                const teamHasHealer = team.some(u => healers.includes(u.job || u.cls));
                if (!teamHasHealer && healers.includes(job)) score += 6;

                // Add small random jitter
                score += Math.random() * 3;

                return { job, score };
            });

            scores.sort((a, b) => b.score - a.score);
            applySecondaryJob(unit, scores[0].job);
        }

        // applyXPStatUpgrade removed — replaced by LEVEL_UP_GAINS system
        // All 5 combat stats (HP, MP, ATK, DEF, INT) now boost every level

        // applyOffhandUnlock removed — V2: offhand is null until secondary job at Lv4

        // V2: All learned spells are usable — no tier gate. This function now always returns true
        // for spells in the unit's spell list (they were learned via leveling or shop purchase).
        function unitMeetsSpellTierReq(unit, spell) {
            return true; // spells are only added when earned — no separate tier check needed
        }

        // Combo gate: can this unit initiate combos? (V2: Lv7+)
        function unitCanCombo(unit) {
            return getUnitLevel(unit) >= 7;
        }

        // Get the effective max AP for a unit (base + XP bonus)
        function getUnitMaxAP(unit) {
            return UNIT_MAX_AP + (unit?._xpBonusAP || 0);
        }

        // Check if unit has any environmental attack bonus active (weather, terrain, zodiac, etc.)
        function hasEnvironmentalBonus(unit) {
            if (!unit) return false;
            const sleepMod = getSleepAffinityModifier(unit);
            if (sleepMod.atk > 0 || sleepMod.int > 0) return true;
            const terrainMod = getTerrainPreferenceModifier(unit);
            if (terrainMod.atk > 0) return true;
            const weatherMod = getWeatherStatMod(unit);
            if (weatherMod.atk > 0 || weatherMod.int > 0) return true;
            const zodiac = getZodiacBonus(unit);
            if (zodiac.mult > 1) return true;
            const sky = getSkyEventBonus(unit);
            if (sky.atkMult > 1) return true;
            const floor = getSectionBuffs(unit);
            if (floor.atk > 0) return true;
            return false;
        }

        function canUnitAct(unit) {
            return unit && !unit.dead && !unit._dying && (unit.ap || 0) > 0;
        }

        // Move is limited to UNIT_MAX_MOVES per turn (default 2).
        function canUnitMove(unit) {
            if (!canUnitAct(unit)) return false;
            if ((unit.movesThisTurn || 0) >= UNIT_MAX_MOVES) return false;
            return true;
        }

        function unitFinished(unit) {
            return (unit.ap || 0) <= 0;
        }

        function spendAP(unit, cost) {
            unit.ap = Math.max(0, (unit.ap || 0) - cost);
        }

        function getSpellApCost(spell) {
            return (spell && spell.apCost != null) ? spell.apCost : AP_COST_SPELL;
        }

        function canAffordSpell(unit, spell) {
            const cost = spell ? getSpellApCost(spell) : AP_COST_SPELL;
            if ((unit.ap || 0) < cost) return false;
            if (spell && !unitMeetsSpellTierReq(unit, spell)) return false;
            return true;
        }

        function canCastAnySpell(unit) {
            const mpPenalty = getStatusMpCostDelta(unit);
            const allSpells = [...(unit.spells || []), ...(unit._raceAbilities || [])];
            return allSpells.some(s => canAffordSpell(unit, s) && unit.mp >= (s.cost + mpPenalty) && !unitHasStatus(unit, 'silence'));
        }

        // Returns true if the spell has at least one valid target in range.
        // Used to grey out spell buttons when castable (MP/AP) but no target exists.
        function hasSpellTargetInRange(unit, spell) {
            if (!spell) return false;
            const kind = spell.kind;
            const range = spell.range || 1;

            // Self-cast / no-target spells — always have a "target"
            if (['healAll', 'warCry', 'scan', 'barrage', 'remoteView', 'selfHeal', 'escape'].includes(kind)) return true;

            // Offensive spells: need an enemy in range
            if (['damage', 'ricochet', 'multiHit', 'lifeDrain', 'debuff', 'aoe', 'displacement', 'line', 'linePush', 'cross', 'pull', 'swap', 'aoePull', 'splitBeam'].includes(kind)) {
                const effectiveRange = (kind === 'aoe' && spell.aoeOriginSelf) ? (spell.aoeRadius || 1) : range;
                const enemies = state.units.filter(u => !u.dead && u.player !== unit.player);
                const hasEnemy = enemies.some(e => {
                    const d = Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y);
                    if (e._isBoss && e._bossSize === 2) {
                        const minDist = Math.min(
                            Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y),
                            Math.abs(e.x + 1 - unit.x) + Math.abs(e.y - unit.y),
                            Math.abs(e.x - unit.x) + Math.abs(e.y + 1 - unit.y),
                            Math.abs(e.x + 1 - unit.x) + Math.abs(e.y + 1 - unit.y)
                        );
                        return minDist >= 1 && minDist <= effectiveRange && !isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y);
                    }
                    return d >= 1 && d <= effectiveRange && !isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y);
                });
                if (hasEnemy) return true;
                if (['damage', 'multiHit', 'ricochet'].includes(kind) && state.towers) {
                    const tw = state.towers[enemyOf(unit.player)];
                    if (tw && tw.hp > 0) {
                        const d = Math.abs(tw.x - unit.x) + Math.abs(tw.y - unit.y);
                        if (d >= 1 && d <= range && !isRangeBlockedByTerrain(unit.x, unit.y, tw.x, tw.y)) return true;
                    }
                }
                return false;
            }

            // Heal: need an injured ally in range
            if (kind === 'heal') {
                const allies = [unit, ...aliveUnitsOnFloor(unit.player).filter(a => a.id !== unit.id)];
                return allies.some(a => {
                    if (a.hp >= a.maxHp) return false;
                    const d = Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y);
                    return d <= range;
                });
            }

            // Buff/Shield/Cleanse: need an ally in range
            if (['buff', 'shield', 'cleanse'].includes(kind)) {
                const allies = [unit, ...aliveUnitsOnFloor(unit.player).filter(a => a.id !== unit.id)];
                return allies.some(a => {
                    const d = Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y);
                    return d <= range;
                });
            }

            // Tile-targeted spells: always have a target if range > 0
            if (['delayed', 'deployObject', 'deployPair', 'aoeShield', 'zoneDebuff', 'zoneHeal', 'terrainCreate'].includes(kind)) {
                return range > 0 || true; // can always target a tile
            }

            // Encore: need an ally in range (not self)
            if (kind === 'encore') {
                return aliveUnitsOnFloor(unit.player).some(a => {
                    if (a.id === unit.id) return false;
                    const d = Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y);
                    return d >= 1 && d <= range;
                });
            }

            // Revive: need a dead ally
            if (kind === 'revive') {
                return state.units.some(u => u.player === unit.player && u.dead);
            }

            // Teleport: need any unit in range
            if (kind === 'teleport') {
                const all = state.units.filter(u => !u.dead);
                return all.some(u => {
                    const d = Math.abs(u.x - unit.x) + Math.abs(u.y - unit.y);
                    return d >= 1 && d <= range;
                });
            }

            // For everything else (bomb, seeds, weather, warpRune, etc.), always available
            return true;
        }

        // Updated: considers both affordability AND target availability
        function canCastAnySpellWithTargets(unit) {
            const mpPenalty = getStatusMpCostDelta(unit);
            const silenced = unitHasStatus(unit, 'silence');
            if (silenced) return false;
            const allSpells = [...(unit.spells || []), ...(unit._raceAbilities || [])];
            return allSpells.some(s =>
                s && canAffordSpell(unit, s) && unit.mp >= (s.cost + mpPenalty) && hasSpellTargetInRange(unit, s)
            );
        }


        function getViewerPlayer() {
            // Online: you always see from YOUR player's perspective
            if (window._NET && window._NET.online && window._NET.myPlayer) return window._NET.myPlayer;
            // Local 2P (hot-seat): perspective follows the active player
            if (state.controllers[1] === CTRL.LOCAL && state.controllers[2] === CTRL.LOCAL) {
                return state.activePlayer || 1;
            }
            // AI / default: you are always P1
            return 1;
        }


        function unitDisplayName(unit) {
            if (!unit) return 'Unit';
            return unit.name || unit.cls || 'Unit';
        }

        function getNametagText(unit) {
            if (!unit) return '';
            const lvl = typeof getUnitLevel === 'function' ? getUnitLevel(unit) : 1;
            const lvlStr = `Lv${lvl}`;
            const mode = state.nametagMode || 'name';
            if (mode === 'none') return lvlStr;
            let label = '';
            if (mode === 'job') label = unit.cls || unit.name || '';
            else if (mode === 'race') label = unit.race ? unit.race.charAt(0).toUpperCase() + unit.race.slice(1) : (unit.name || '');
            else label = unit.name || unit.cls || '';
            return label ? `${lvlStr} ${label}` : lvlStr;
        }


        function getDevSimSpeedMultiplier() {
            const base = Math.max(1, Number(state.devSimSpeed) || 1);
            // PERF: during devsim, apply additional 4x boost (x4 becomes x16 effective)
            // This keeps all timer ordering correct while drastically reducing wait times
            return state.devAutoSim ? base * 4 : base;
        }

        /** Scale any action/animation delay by the current speed multiplier. */
        function actionMs(ms) {
            return Math.max(1, Math.round((Number(ms) || 0) / getDevSimSpeedMultiplier()));
        }

        function scaleDevSimDelay(ms, min = 0) {
            return Math.max(min, Math.round((Number(ms) || 0) / getDevSimSpeedMultiplier()));
        }

        function setDevSimSpeed(speed) {
            const next = [1, 2, 4].includes(Number(speed)) ? Number(speed) : 1;
            if (state.devSimSpeed === next) return;
            state.devSimSpeed = next;
            addLog(`Dev sim speed set to x${next}.`);
            render();
        }

        function setDevAutoSim(enabled) {
            if (isOnlineMatch() && enabled) return; // Block in online PvP
            state.devAutoSim = !!enabled;
            if (!state.devAutoSim && state.devSimTimer) {
                clearTimeout(state.devSimTimer);
                state.devSimTimer = null;
            }
            if (state.devAutoSim) {
                // Save pre-sim controllers so we can restore
                state._preDevSimControllers = {
                    ...state.controllers
                };
                state.controllers[1] = CTRL.AI;
                state.controllers[2] = CTRL.AI;
            } else if (state._preDevSimControllers) {
                // Restore pre-sim controllers
                state.controllers[1] = state._preDevSimControllers[1] || CTRL.LOCAL;
                state.controllers[2] = state._preDevSimControllers[2] || CTRL.AI;
                state._preDevSimControllers = null;
            }
            render();
        }

        function randomizeBothTeamsForDevSim() {
            randomizeAllTeams(true);
            state.matchNumber = Math.max(1, state.matchNumber || 1);
        }


        function restartDevSimFromBuilder(delay = null) {
            if (!state.devAutoSim) return;
            if (state.devSimTimer) {
                clearTimeout(state.devSimTimer);
                state.devSimTimer = null;
            }

            transitionTo(GS.PARTY_BUILDER);
            state.selectedUnitId = null;
            state.focusedUnitId = null;
            state.hoverUnitId = null;
            state.actionMode = null;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            state.pendingTarget = null;
            hideResultOverlay();
            render();

            const queuedDelay = delay == null ? scaleDevSimDelay(80, 12) : delay;
            state.devSimTimer = setTimeout(() => {
                state.devSimTimer = null;
                if (!state.devAutoSim) return;

                try {
                    // Always use optimized/default loadouts for dev sim
                    randomizeBothTeamsForDevSim();

                    // Skip DOM-based applyBtn.click() path — syncPartyBuildsFromInputs
                    // reads stale DOM select values and can overwrite the freshly randomized
                    // state, causing duplicate matches. Call functions directly instead.
                    window.setTimeout(() => {
                        if (!state.devAutoSim) return;
                        try {
                            applyPartyBuild(false);
                            window.setTimeout(() => {
                                if (!state.devAutoSim) return;
                                try {
                                    startMatch();
                                } catch (err) {
                                    console.error('Dev auto-sim failed to start the match from builder.', err);
                                }
                            }, 35);
                        } catch (err) {
                            console.error('Dev auto-sim failed to apply builds from builder.', err);
                        }
                    }, 35);
                } catch (err) {
                    console.error('Dev auto-sim failed to restart from builder.', err);
                }
            }, queuedDelay);
        }


        function toggleDevAutoSim() {
            if (!ONLINE_RULES.devSimAllowed) {
                addLog('Dev Sim is disabled in online PvP.');
                return;
            }
            if (state.devAutoSim) {
                setDevAutoSim(false);
                addLog('Developer auto-sim disabled.');
                return;
            }
            addLog('Developer auto-sim enabled: both teams randomize, both sides autoplay, and new matches start automatically.');
            if (state.phase === 'setup') {
                setDevAutoSim(true);
                restartDevSimFromBuilder(40);
            } else {
                setDevAutoSim(true);
                if (state.activePlayer) maybeTriggerComputerTurn();
            }
        }

        function showResultOverlay() {
            const viewer = getViewerPlayer();
            const isNoContest = state.winner === 0;
            const playerWon = isNoContest ? false : (ONLINE_RULES.active ? (state.winner === viewer) : (state.winner === 1));
            const wonClass = isNoContest ? 'defeat' : (playerWon ? 'victory' : 'defeat');

            // ── Set sky & ground theme ──
            const vicSky = document.getElementById('vicSky');
            const vicGround = document.getElementById('vicGround');
            const vicTitle = document.getElementById('vicTitle');
            const vicSubtitle = document.getElementById('vicSubtitle');
            const vicMatchInfo = document.getElementById('vicMatchInfo');
            const vicParty = document.getElementById('vicParty');
            const vicAwards = document.getElementById('vicAwards');
            const vicParticles = document.getElementById('vicParticles');

            vicSky.className = 'vic-sky ' + wonClass;
            vicGround.className = 'vic-ground ' + wonClass;
            vicTitle.textContent = isNoContest ? 'No Contest' : (playerWon ? 'Victory' : 'Defeat');
            vicTitle.className = 'vic-title ' + wonClass;

            // ── Subtitle & match info ──
            const careerStats = loadCareerStats();
            const streakHtml = !isNoContest && careerStats.currentWinStreak >= 2 ? ` <span class="vic-streak">🔥 ${careerStats.currentWinStreak} Win Streak</span>` : '';
            vicSubtitle.innerHTML = isNoContest
                ? `Match ${state.matchNumber} voided — units could not engage.`
                : ((playerWon ? 'You won' : 'You lost') + ` match ${state.matchNumber}.` + streakHtml);

            // ── Build particles ──
            let particleHtml = '';
            if (playerWon) {
                for (let i = 0; i < 30; i++) {
                    const x = Math.random() * 100;
                    const y = 20 + Math.random() * 60;
                    const delay = Math.random() * 4;
                    const size = 1 + Math.random() * 2;
                    particleHtml += `<div class="vic-particle" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;animation-delay:${delay}s"></div>`;
                }
            }
            vicParticles.innerHTML = particleHtml;

            // ── Place party sprites on the landscape ──
            // Show winner's team prominent, loser's team small in background
            const winnerPlayer = state.winner;
            const loserPlayer = state.winner === 1 ? 2 : 1;
            const winnerUnits = (state.units || []).filter(u => u.player === winnerPlayer);
            const loserUnits = (state.units || []).filter(u => u.player === loserPlayer);

            // Stagger positions: center unit biggest, flanks slightly smaller, variety in offset
            const POSITIONS = [{
                    scale: 1.6,
                    bottom: '8%',
                    zIdx: 10,
                    mx: '0px'
                }, // center front
                {
                    scale: 1.3,
                    bottom: '12%',
                    zIdx: 8,
                    mx: '-120px'
                }, // left mid
                {
                    scale: 1.3,
                    bottom: '12%',
                    zIdx: 8,
                    mx: '120px'
                }, // right mid
                {
                    scale: 1.0,
                    bottom: '16%',
                    zIdx: 6,
                    mx: '-220px'
                }, // far left
                {
                    scale: 1.0,
                    bottom: '16%',
                    zIdx: 6,
                    mx: '220px'
                }, // far right
                {
                    scale: 0.85,
                    bottom: '18%',
                    zIdx: 4,
                    mx: '-310px'
                }, // very far left
            ];
            const LOSER_POS = [{
                    scale: 0.55,
                    bottom: '28%',
                    zIdx: 2,
                    mx: '-70px'
                },
                {
                    scale: 0.55,
                    bottom: '28%',
                    zIdx: 2,
                    mx: '70px'
                },
                {
                    scale: 0.45,
                    bottom: '30%',
                    zIdx: 1,
                    mx: '-150px'
                },
                {
                    scale: 0.45,
                    bottom: '30%',
                    zIdx: 1,
                    mx: '150px'
                },
                {
                    scale: 0.4,
                    bottom: '31%',
                    zIdx: 1,
                    mx: '0px'
                },
                {
                    scale: 0.4,
                    bottom: '31%',
                    zIdx: 1,
                    mx: '220px'
                },
            ];

            let partyHtml = '';

            // Sort winner units: alive first, dead last; then by damage dealt for prestige ordering
            const sortedWinners = [...winnerUnits].sort((a, b) => {
                if (a.dead !== b.dead) return a.dead ? 1 : -1;
                return (b._trackDmgDealt || 0) - (a._trackDmgDealt || 0);
            });

            for (let i = 0; i < sortedWinners.length && i < POSITIONS.length; i++) {
                const u = sortedWinners[i];
                const p = POSITIONS[i];
                const sprite = getBattleMapSpriteUrl(u);
                const px = Math.round(128 * p.scale);
                const nameClass = u.player === 1 ? 'p1' : 'p2';
                partyHtml += `<div class="vic-unit${u.dead ? ' dead' : ''}" style="position:absolute;bottom:${p.bottom};left:50%;margin-left:calc(${p.mx} - ${px/2}px);z-index:${p.zIdx}">
          <div class="vic-unit-img" style="width:${px}px;height:${px}px;background-image:url('${sprite}');background-size:contain;background-position:center bottom;background-repeat:no-repeat;image-rendering:pixelated"></div>
          <div class="vic-unit-shadow" style="width:${px * 0.7}px"></div>
          <div class="vic-unit-name ${nameClass}">${escapeHtml(unitDisplayName(u))}</div>
        </div>`;
            }

            // Loser units in background (smaller, dimmer)
            const sortedLosers = [...loserUnits].sort((a, b) => (a.dead ? 1 : -1) - (b.dead ? 1 : -1));
            for (let i = 0; i < sortedLosers.length && i < LOSER_POS.length; i++) {
                const u = sortedLosers[i];
                const p = LOSER_POS[i];
                const sprite = getBattleMapSpriteUrl(u);
                const px = Math.round(128 * p.scale);
                const nameClass = u.player === 1 ? 'p1' : 'p2';
                partyHtml += `<div class="vic-unit dead" style="position:absolute;bottom:${p.bottom};left:50%;margin-left:calc(${p.mx} - ${px/2}px);z-index:${p.zIdx};opacity:0.5">
          <div class="vic-unit-img" style="width:${px}px;height:${px}px;background-image:url('${sprite}');background-size:contain;background-position:center bottom;background-repeat:no-repeat;image-rendering:pixelated;filter:grayscale(0.6) brightness(0.6) drop-shadow(0 2px 8px rgba(0,0,0,0.5))"></div>
          <div class="vic-unit-shadow" style="width:${px * 0.5}px"></div>
        </div>`;
            }

            vicParty.innerHTML = partyHtml;

            // ── Build MVP awards ──
            vicAwards.innerHTML = buildVicAwards();

            // ── Achievements earned this match ──
            const matchAchs = state._matchAchievements || [];
            if (matchAchs.length > 0) {
                let achHtml = '<div class="vic-achievements"><div class="vic-ach-title">Achievements Unlocked</div><div class="vic-ach-grid">';
                for (const id of matchAchs) {
                    const def = ACHIEVEMENT_DEFS[id];
                    if (!def) continue;
                    achHtml += `<div class="vic-ach-item"><span class="vic-ach-icon">${def.icon}</span><span class="vic-ach-name">${def.name}</span></div>`;
                }
                achHtml += '</div></div>';
                vicAwards.innerHTML += achHtml;
            }

            // ── All-time achievements summary ──
            const allAchs = loadAchievements();
            const totalUnlocked = Object.keys(allAchs).length;
            const totalPossible = Object.keys(ACHIEVEMENT_DEFS).length;
            if (totalUnlocked > 0) {
                let allAchHtml = `<div class="vic-achievements vic-all-achievements"><div class="vic-ach-title">Achievements (${totalUnlocked}/${totalPossible})</div><div class="vic-ach-grid">`;
                for (const [id, def] of Object.entries(ACHIEVEMENT_DEFS)) {
                    const unlocked = !!allAchs[id];
                    allAchHtml += `<div class="vic-ach-item${unlocked ? '' : ' locked'}" title="${def.desc}"><span class="vic-ach-icon">${unlocked ? def.icon : '🔒'}</span><span class="vic-ach-name">${def.name}</span></div>`;
                }
                allAchHtml += '</div></div>';
                vicAwards.innerHTML += allAchHtml;
            }

            // ── Match duration ──
            const durationMs = Date.now() - (state.startTime || Date.now());
            const durationMin = Math.floor(durationMs / 60000);
            const durationSec = Math.floor((durationMs % 60000) / 1000);
            const durationStr = durationMin > 0 ? `${durationMin}m ${durationSec}s` : `${durationSec}s`;
            vicMatchInfo.innerHTML = `Round ${state.round || '?'} · ${durationStr} · <span style="color:var(--p1-score)">${(state.units||[]).filter(u=>u.player===1&&!u.dead).length}</span> vs <span style="color:var(--p2-score)">${(state.units||[]).filter(u=>u.player===2&&!u.dead).length}</span> alive`;

            // ── Mode-specific score summary ──
            const _mpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
            if (_mpMode && _mpMode.id !== 'arena') {
                let modeLine = '';
                const k1 = state.matchKills?.[1] || 0, k2 = state.matchKills?.[2] || 0;
                const s1 = state.matchScores?.[1] || 0, s2 = state.matchScores?.[2] || 0;
                if (_mpMode.id === 'tdm' || _mpMode.id === 'ffa') {
                    modeLine = `💀 Kills: <span style="color:var(--p1-score)">${k1}</span> – <span style="color:var(--p2-score)">${k2}</span>`;
                } else if (_mpMode.id === 'domination' || _mpMode.id === 'hotspot') {
                    modeLine = `🚩 Points: <span style="color:var(--p1-score)">${s1}</span> – <span style="color:var(--p2-score)">${s2}</span>`;
                } else if (_mpMode.id === 'ctf') {
                    modeLine = `🏳️ Captures: <span style="color:var(--p1-score)">${s1}</span> – <span style="color:var(--p2-score)">${s2}</span>`;
                }
                if (state.suddenDeathActive) modeLine += ' · <span style="color:#ff4444">⚡ Sudden Death</span>';
                if (modeLine) {
                    vicMatchInfo.innerHTML += `<br><span style="font-size:13px">${_mpMode.label} — ${modeLine}</span>`;
                }
            }

            // ── Elo display (ranked only) ──
            const vicEloBadge = document.getElementById('vicEloBadge');
            if (vicEloBadge) {
                if (state.isRankedMatch && !isNoContest) {
                    const ri = getEloRankInfo(_lastEloAfter);
                    const deltaSign = _lastEloDelta > 0 ? '+' : '';
                    const deltaClass = _lastEloDelta > 0 ? 'positive' : _lastEloDelta < 0 ? 'negative' : 'neutral';
                    vicEloBadge.innerHTML = `
                        <div class="vic-elo-badge">
                            <span class="vic-elo-rank-icon">${ri.icon}</span>
                            <div class="vic-elo-info">
                                <span class="vic-elo-label">${ri.name}</span>
                                <span class="vic-elo-value">${_lastEloAfter}</span>
                            </div>
                        </div>
                        <div class="vic-elo-delta ${deltaClass}">${deltaSign}${_lastEloDelta}</div>
                    `;
                } else {
                    vicEloBadge.innerHTML = state.isRankedMatch ? '' : '';
                }
            }

            // ── Team damage comparison bar ──
            const vicTeamDmgBar = document.getElementById('vicTeamDmgBar');
            const vicTeamDmgLabels = document.getElementById('vicTeamDmgLabels');
            if (vicTeamDmgBar && vicTeamDmgLabels) {
                const p1Dmg = (state.units||[]).filter(u=>u.player===1).reduce((s,u) => s + (u._trackDmgDealt||0), 0);
                const p2Dmg = (state.units||[]).filter(u=>u.player===2).reduce((s,u) => s + (u._trackDmgDealt||0), 0);
                const total = Math.max(1, p1Dmg + p2Dmg);
                const p1Pct = Math.round((p1Dmg / total) * 100);
                const p2Pct = 100 - p1Pct;
                vicTeamDmgBar.innerHTML = `<div class="vic-team-dmg-fill-p1" style="width:${p1Pct}%"></div><div class="vic-team-dmg-fill-p2" style="width:${p2Pct}%"></div>`;
                vicTeamDmgLabels.innerHTML = `<span class="p1-lbl">${p1Dmg} dmg</span><span style="font-size:8px;color:var(--muted)">TEAM DAMAGE</span><span class="p2-lbl">${p2Dmg} dmg</span>`;
            }

            // ── Per-unit stats table ──
            const vicStatsWrap = document.getElementById('vicStatsTableWrap');
            if (vicStatsWrap) {
                vicStatsWrap.innerHTML = buildVicStatsTable();
            }

            // ── Online relabel ──
            if (ONLINE_RULES.active) {
                if (nextMatchBtn) nextMatchBtn.textContent = 'Request Rematch';
                if (document.getElementById('startOverBtn')) document.getElementById('startOverBtn').style.display = 'none';
            }

            nextMatchBtn.disabled = false;
            if (exportLastMatchBtn) exportLastMatchBtn.disabled = !state.lastCompletedMatch;
            if (exportMatchHistoryBtn) exportMatchHistoryBtn.disabled = !state.matchHistory.length;
            resultOverlay.classList.remove('hidden');
        }

        function buildVicAwards() {
            const allUnits = state.units || [];
            if (!allUnits.length) return '';

            const awards = [];
            const topDmg = [...allUnits].sort((a, b) => (b._trackDmgDealt || 0) - (a._trackDmgDealt || 0))[0];
            if (topDmg && (topDmg._trackDmgDealt || 0) > 0) {
                awards.push({
                    icon: '⚔️',
                    label: 'Most Damage',
                    name: unitDisplayName(topDmg),
                    stat: `${topDmg._trackDmgDealt} dmg`,
                    player: topDmg.player,
                    gold: true,
                    unit: topDmg
                });
            }
            const topKills = [...allUnits].sort((a, b) => (b._matchKills || 0) - (a._matchKills || 0))[0];
            if (topKills && (topKills._matchKills || 0) > 0) {
                awards.push({
                    icon: '💀',
                    label: 'Most Kills',
                    name: unitDisplayName(topKills),
                    stat: `${topKills._matchKills} kill${topKills._matchKills !== 1 ? 's' : ''}`,
                    player: topKills.player,
                    unit: topKills
                });
            }
            const topHeal = [...allUnits].sort((a, b) => (b._trackHealDone || 0) - (a._trackHealDone || 0))[0];
            if (topHeal && (topHeal._trackHealDone || 0) > 0) {
                awards.push({
                    icon: '💚',
                    label: 'Most Healing',
                    name: unitDisplayName(topHeal),
                    stat: `${topHeal._trackHealDone} HP`,
                    player: topHeal.player,
                    unit: topHeal
                });
            }
            const topStreak = [...allUnits].sort((a, b) => (b._maxKillStreak || 0) - (a._maxKillStreak || 0))[0];
            if (topStreak && (topStreak._maxKillStreak || 0) >= 2) {
                awards.push({
                    icon: '🔥',
                    label: 'Best Streak',
                    name: unitDisplayName(topStreak),
                    stat: `${topStreak._maxKillStreak} kills`,
                    player: topStreak.player,
                    unit: topStreak
                });
            }
            const topCrits = [...allUnits].sort((a, b) => (b._matchCrits || 0) - (a._matchCrits || 0))[0];
            if (topCrits && (topCrits._matchCrits || 0) > 0) {
                awards.push({
                    icon: '⚡',
                    label: 'Crit Master',
                    name: unitDisplayName(topCrits),
                    stat: `${topCrits._matchCrits} crit${topCrits._matchCrits !== 1 ? 's' : ''}`,
                    player: topCrits.player,
                    unit: topCrits
                });
            }
            const topDodge = [...allUnits].sort((a, b) => (b._matchDodges || 0) - (a._matchDodges || 0))[0];
            if (topDodge && (topDodge._matchDodges || 0) > 0) {
                awards.push({
                    icon: '💨',
                    label: 'Most Evasive',
                    name: unitDisplayName(topDodge),
                    stat: `${topDodge._matchDodges} dodge${topDodge._matchDodges !== 1 ? 's' : ''}`,
                    player: topDodge.player,
                    unit: topDodge
                });
            }
            const topTank = [...allUnits].filter(u => !u.dead).sort((a, b) => (b._trackDmgReceived || 0) - (a._trackDmgReceived || 0))[0];
            if (topTank && (topTank._trackDmgReceived || 0) > 15) {
                awards.push({
                    icon: '🛡',
                    label: 'Iron Wall',
                    name: unitDisplayName(topTank),
                    stat: `${topTank._trackDmgReceived} tanked`,
                    player: topTank.player,
                    unit: topTank
                });
            }

            if (!awards.length) return '';

            return awards.map(a => {
                const spriteHtml = a.unit ? `<div class="vic-award-sprite" style="background-image:url('${getBattleMapSpriteUrl(a.unit)}');background-size:contain;background-position:center;background-repeat:no-repeat;image-rendering:pixelated"></div>` : '';
                return `<div class="vic-award${a.gold ? ' gold' : ''}">
          ${spriteHtml}
          <div class="vic-award-icon">${a.icon}</div>
          <div class="vic-award-detail">
            <div class="vic-award-label">${a.label}</div>
            <div class="vic-award-name">${a.name}</div>
            <div class="vic-award-stat">${a.stat}</div>
          </div>
        </div>`;
            }).join('');
        }

        function buildVicStatsTable() {
            const allUnits = state.units || [];
            if (!allUnits.length) return '';

            const p1Units = allUnits.filter(u => u.player === 1);
            const p2Units = allUnits.filter(u => u.player === 2);
            // Find best values per column for highlighting
            const cols = ['_matchKills', '_trackDmgDealt', '_trackDmgReceived', '_trackHealDone', '_matchCrits', '_matchDeaths'];
            const best = {};
            for (const c of cols) {
                const max = Math.max(...allUnits.map(u => u[c] || 0));
                best[c] = max > 0 ? max : -1;
            }

            function unitRow(u) {
                const sprite = typeof getUnitSprite === 'function' ? getUnitSprite(u.cls, u.player, u) : '';
                const deadClass = u.dead ? ' dead-unit' : '';
                const lvl = u._level || 1;
                function cell(key) {
                    const v = u[key] || 0;
                    const cls = v === 0 ? 'stat-zero' : (v === best[key] && v > 0 ? 'stat-best' : '');
                    return `<td class="${cls}">${v}</td>`;
                }
                return `<tr class="${deadClass}">
                    <td><div class="unit-sprite-cell">
                        ${sprite ? `<div style="width:24px;height:24px;background-image:url('${sprite}');background-size:contain;background-position:center;background-repeat:no-repeat;image-rendering:pixelated"></div>` : ''}
                        <span class="unit-name-text">${escapeHtml(unitDisplayName(u))}</span>
                    </div></td>
                    <td style="font-size:10px;color:var(--muted)">${u.cls}${lvl > 1 ? ` Lv${lvl}` : ''}</td>
                    ${cell('_matchKills')}
                    ${cell('_trackDmgDealt')}
                    ${cell('_trackDmgReceived')}
                    ${cell('_trackHealDone')}
                    ${cell('_matchCrits')}
                    ${cell('_matchDeaths')}
                </tr>`;
            }

            // Sort each team: alive first, then by damage dealt
            const sortFn = (a, b) => {
                if (a.dead !== b.dead) return a.dead ? 1 : -1;
                return (b._trackDmgDealt || 0) - (a._trackDmgDealt || 0);
            };
            const p1Sorted = [...p1Units].sort(sortFn);
            const p2Sorted = [...p2Units].sort(sortFn);

            // Team totals
            function teamTotals(units, pClass) {
                const k = units.reduce((s,u) => s + (u._matchKills||0), 0);
                const d = units.reduce((s,u) => s + (u._trackDmgDealt||0), 0);
                const r = units.reduce((s,u) => s + (u._trackDmgReceived||0), 0);
                const h = units.reduce((s,u) => s + (u._trackHealDone||0), 0);
                const c = units.reduce((s,u) => s + (u._matchCrits||0), 0);
                const dt = units.reduce((s,u) => s + (u._matchDeaths||0), 0);
                return `<tr class="team-header ${pClass}"><td colspan="2">Total</td><td>${k}</td><td>${d}</td><td>${r}</td><td>${h}</td><td>${c}</td><td>${dt}</td></tr>`;
            }

            return `<table class="vic-stats-table">
                <caption>Match Performance</caption>
                <thead><tr>
                    <th>Unit</th><th>Class</th><th>K</th><th>Dmg</th><th>Recv</th><th>Heal</th><th>Crit</th><th>D</th>
                </tr></thead>
                <tbody>
                    <tr class="team-header p1-hdr"><td colspan="8">Player 1</td></tr>
                    ${p1Sorted.map(unitRow).join('')}
                    ${teamTotals(p1Units, 'p1-hdr')}
                    <tr class="team-header p2-hdr"><td colspan="8">Player 2</td></tr>
                    ${p2Sorted.map(unitRow).join('')}
                    ${teamTotals(p2Units, 'p2-hdr')}
                </tbody>
            </table>`;
        }

        // Legacy compat — buildMvpScreen still called by some code paths
        function hideResultOverlay() {
            resultOverlay.classList.add('hidden');
        }

        function revealAllHourglasses() {
            for (const h of state.hourglasses) {
                h.visibleTo[1] = true;
                h.visibleTo[2] = true;
            }
        }


        let _finalizing = false;

        function finalizeMatch() {
            if (_finalizing) return;
            _finalizing = true;
            revealAllHourglasses();
            revealAllHiddenItems();
            state.aiThinking = false;
            state.actionMode = null;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            state.pendingTarget = null;
            state._matchAchievements = state._matchAchievements || [];
            clearAiSafetyTimer();
            recordCompletedMatch();

            // ── AI TRAINING: always record in finalizeMatch (covers all win paths) ──
            if (_aiTrainingMode && state.winner != null) {
                recordTrainingMatch(state.winner);
                renderTrainingDashboard();
            }

            // ── DEV SIM: auto-export match history every 5 matches ──
            if (state.devAutoSim && state.matchHistory && state.matchHistory.length > 0 && state.matchHistory.length % 5 === 0) {
                try {
                    downloadJson(`entropy-wars-batch-${state.matchHistory.length}.json`, state.matchHistory);
                } catch (e) {
                    console.error('Auto-export failed:', e);
                }
            }

            // ── END-OF-MATCH ACHIEVEMENT CHECKS ──
            const _viewer = getViewerPlayer();
            if (state.winner === _viewer) {
                checkAchievement('ace', null);
                // Perfect victory: all viewer units alive
                if (aliveUnitsFor(_viewer).length === state.units.filter(u => u.player === _viewer).length) {
                    checkAchievement('perfectVictory', null);
                }
                // Untouchable: any viewer unit with 0 damage received
                for (const u of aliveUnitsFor(_viewer)) {
                    if ((u._trackDmgReceived || 0) === 0) {
                        checkAchievement('untouchable', u);
                        break;
                    }
                }
                // Weather survivor
                if ((state.activeWeather || []).length >= 2) {
                    checkAchievement('weatherSurvivor', null);
                }
            }

            // ── CAREER STATS ──
            updateCareerStatsAfterMatch();

            transitionTo(GS.POST_MATCH);

            if (!state.devAutoSim) {
                if (state.winner === _viewer) {
                    playStinger('victory');
                } else if (state.winner) {
                    playStinger('defeat');
                }
            } else {
                stopStingers();
            }
            render();
            _finalizing = false;
            if (state.devAutoSim) {
                state.matchNumber += 1;
                state.winner = null;
                state._winLogged = false;
            state._winCondition = null;
            state._endingReason = null;
            state._stalemateRounds = 0;
            state._lastActivityTotal = 0;
                stopStingers();
                restartDevSimFromBuilder(120);
                return;
            }
            setTimeout(() => {
                showResultOverlay();
            }, 50);
        }

        function prepareBattleStateFromCurrentBuilds() {
            _invalidateBoardGrid(); // force tile rebuild for new terrain
            state.units = makeUnitsFromBuilds();
            state.selectedUnitId = null;
            state.focusedUnitId = null;
            state.hoverUnitId = null;
            state.actionMode = null;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            state.pendingTarget = null;
            state.hourglasses = [];
            state.hourglassBuffs = {
                1: 0,
                2: 0
            };
            state.hiddenItems = [];
            state.foundByPlayer = {
                1: new Set(),
                2: new Set()
            };
            state.scannedByPlayer = {
                1: new Set(),
                2: new Set()
            };
            state.placed = false;
            state.winner = null;
            state.currentBattleTrackKey = null;
            state.bombs = [];
            state.plantedSeeds = [];
            state.warpRunes = [];
            state.wards = [];
            state.turrets = [];
            state._flairRevealTiles = {
                1: null,
                2: null
            };
            state._fogRevealTiles = null;
            state._fogAnchorUnitId = null;
            if (state._fogRevealTimer) {
                clearTimeout(state._fogRevealTimer);
                state._fogRevealTimer = null;
            }
            state.aiThinking = false;
            state._winLogged = false;
            state._winCondition = null;
            state._endingReason = null;
            state._stalemateRounds = 0;
            state._lastActivityTotal = 0;
            state._matchAchievements = [];
            state.hitFlashIds = new Set();
            state.healFlashIds = new Set();
            state.statusWiggleIds = new Set();
            state.battleDialogueQueue = []; _lastDialogueHtml = "";
            state.battleDialogueTimer = null;
            state.selectedPanelFlash = null;
            // ── BOSS SYSTEM: initialize boss state ──
            state.bosses = {};  // keyed by boss def key: { unit, alive, killedByTeam }
            state._bossesSpawned = { hellspawn: false, angel: false };
            // Dev sim overrides both controllers to AI temporarily
            if (state.devAutoSim) {
                state.controllers[1] = CTRL.AI;
                state.controllers[2] = CTRL.AI;
            }
            // Otherwise controllers are already set from mode selection
            state.showPlayer2Builder = false;
            // Generate all three floors
            const groundBoard = generateTerrainBoard();
            const reserved = new Set();
            Object.values(SPAWNS).flat().forEach(pos => reserved.add(posKey(pos.x, pos.y)));
            initMap(groundBoard, reserved);
            // ── Safety net: displace any unit on impassable terrain ──
            for (const u of state.units) {
                if (u.dead) continue;
                const t = state.boardTerrain?.[u.y]?.[u.x];
                const tRule = t ? getTerrainRule(t) : null;
                const isStuck = !t || !tRule || tRule.passable === false || isTowerTile(u.x, u.y);
                if (!isStuck) continue;
                for (let radius = 1; radius <= Math.max(bw(), bh()); radius++) {
                    let found = false;
                    for (let dy = -radius; dy <= radius && !found; dy++) {
                        for (let dx = -radius; dx <= radius && !found; dx++) {
                            if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
                            const nx = u.x + dx, ny = u.y + dy;
                            if (nx < 0 || ny < 0 || ny >= bh() || nx >= bw()) continue;
                            const nt = state.boardTerrain[ny]?.[nx];
                            if (!nt || getTerrainRule(nt).passable === false) continue;
                            if (state.units.some(other => other !== u && !other.dead && other.x === nx && other.y === ny)) continue;
                            u.x = nx;
                            u.y = ny;
                            found = true;
                        }
                    }
                    if (found) break;
                }
            }
            // ── FFA: redistribute units to scattered positions around map ──
            const _ffaMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
            if (_ffaMode && _ffaMode.isFFA) {
                const allUnits = state.units.filter(u => !u.dead);
                // Gather passable perimeter + inner positions, spread evenly
                const perimeterTiles = [];
                const margin = 1;
                for (let y = margin; y < bh() - margin; y++) {
                    for (let x = margin; x < bw() - margin; x++) {
                        // Prefer edges and semi-interior spread
                        const isEdge = x <= margin + 1 || x >= bw() - margin - 2 || y <= margin + 1 || y >= bh() - margin - 2;
                        if (!isEdge) continue;
                        const t = state.boardTerrain?.[y]?.[x];
                        if (!t || !getTerrainRule(t) || getTerrainRule(t).passable === false) continue;
                        if (isTowerTile(x, y)) continue;
                        perimeterTiles.push({ x, y });
                    }
                }
                // Space them out: pick positions with maximum separation
                if (perimeterTiles.length >= allUnits.length) {
                    const step = Math.floor(perimeterTiles.length / allUnits.length);
                    // Interleave P1 and P2 units
                    const p1Units = allUnits.filter(u => u.player === 1);
                    const p2Units = allUnits.filter(u => u.player === 2);
                    const interleaved = [];
                    const maxLen = Math.max(p1Units.length, p2Units.length);
                    for (let i = 0; i < maxLen; i++) {
                        if (i < p1Units.length) interleaved.push(p1Units[i]);
                        if (i < p2Units.length) interleaved.push(p2Units[i]);
                    }
                    const used = new Set();
                    interleaved.forEach((u, idx) => {
                        let pos = perimeterTiles[idx * step % perimeterTiles.length];
                        // Find nearest unused position
                        let best = pos, bestDist = 0;
                        for (const p of perimeterTiles) {
                            if (used.has(posKey(p.x, p.y))) continue;
                            const minDist = [...used].reduce((m, k) => {
                                const [px, py] = k.split(',').map(Number);
                                return Math.min(m, Math.abs(p.x - px) + Math.abs(p.y - py));
                            }, Infinity);
                            if (minDist > bestDist) { bestDist = minDist; best = p; }
                        }
                        u.x = best.x;
                        u.y = best.y;
                        used.add(posKey(best.x, best.y));
                    });
                }
            }
            beginPlacement();
            transitionTo(GS.BATTLE);
            state.round = 1;
            state.startingPlayer = Math.random() < 0.5 ? 1 : 2;
            state.activePlayer = state.startingPlayer;
            for (const u of state.units) {
                const stunned = u.status && getActiveStatusKeys(u).some(k => STATUS_DEFS[k]?.skipTurn);
                u.ap = stunned ? 0 : getUnitMaxAP(u);
                u._aiFailedSpells = null;
                u._aiFailedCombos = null;
                u._aiSkipAttack = false;
                // _aiSkipFloor removed
                u._aiLoopCount = 0;
                u._encoreThisRound = false;
                u.movesThisTurn = 0;
                u._turnKills = 0;
                // _floorTransitionThisRound removed
                u._guardCounterBonus = 0;
            }
            hideResultOverlay();
        }

        async function continueToNextMatch() {
            playSfx('uiButtonConfirm');
            state.matchNumber += 1;
            if (state.devAutoSim) {
                randomizeBothTeamsForDevSim();
            } else {
                rerollOpponentForNextMatch();
            }
            // ── Ranked: re-randomize bot team and assign new bot Elo ──
            if (state.isRankedMatch) {
                if (typeof optimizeRandomizeParty === 'function') optimizeRandomizeParty(2);
                state._botElo = getBotElo();
            }
            prepareBattleStateFromCurrentBuilds();
            refillBattleShuffleBag();
            state.currentBattleTrackKey = chooseBattleTrackKey();

            // ── Reset round & blitz state for the new match ──
            state.round = 1;
            state.startingPlayer = Math.random() < 0.5 ? 1 : 2;
            state.activePlayer = state.startingPlayer;
            state._blitzActiveUnitId = null;
            state._skippedUnit = null;
            _blitzTurnGen++;

            // Give all units their starting AP
            for (const u of state.units) {
                if (!u.dead) {
                    u.ap = getUnitMaxAP(u);
                    u.movesThisTurn = 0;
                    u._skippedTurn = false;
                }
            }

            // ── Blitz: build speed-sorted turn order & run round-start effects ──
            buildBlitzTurnOrder();
            beginBlitzRound();

            addLog(state.devAutoSim ?
                `Dev sim match ${state.matchNumber} started. Both teams were rerandomized and a fresh objective-and-consumable roll was generated.` :
                `⚡ Match ${state.matchNumber} started. Units act in speed order!`);
            if (state.isRankedMatch && !state.devAutoSim) {
                const cs = loadCareerStats();
                const ri = getEloRankInfo(cs.elo);
                addLog(`🏆 RANKED MATCH — ${ri.icon} ${ri.name} (${cs.elo} Elo) vs Bot (~${state._botElo || '?'} Elo)`);
            }
            addLog(`⚡ Round ${state.round}`);
            await syncMusicToState();
            render();

            // Deferred: let layout settle, then kick off the first blitz turn
            window.requestAnimationFrame(() => {
                syncBattleMapSquare();
                CONFIG.tileSize = computeBattleTileSize();
                renderBoard();
                maybeAdvanceTurn();
            });
        }

        async function backToPartyBuilder() {
            playSfx('uiButtonConfirm');
            transitionTo(GS.PARTY_BUILDER);
            state.selectedUnitId = null;
            state.focusedUnitId = null;
            state.hoverUnitId = null;
            state.actionMode = null;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            state.winner = null;
            state._winLogged = false;
            state._winCondition = null;
            state._endingReason = null;
            state._stalemateRounds = 0;
            state._lastActivityTotal = 0;
            hideResultOverlay();

            if (state.devAutoSim) {
                addLog('Dev auto-sim returned to the party builder and is starting the next randomized match.');
                restartDevSimFromBuilder(40);
                return;
            }

            setDevAutoSim(false);
            await syncMusicToState();
            addLog('Returned to the party builder with your current party and loadouts preserved.');
            render();
        }

        function toggleAutoMode() {
            if (state.phase !== 'battle' || state.winner) return;
            const p = getLocalPlayer();
            if (state.controllers[p] === CTRL.LOCAL) {
                state.controllers[p] = CTRL.AI;
                addLog(`Player ${p} auto mode enabled.`);
            } else if (state.controllers[p] === CTRL.AI) {
                state.controllers[p] = CTRL.LOCAL;
                addLog(`Player ${p} auto mode disabled.`);
            }
            render();
            if (state.controllers[p] === CTRL.AI && state.activePlayer === p) {
                maybeTriggerComputerTurn();
            }
        }

        function forfeitMatch() {
            if (state.phase !== 'battle' || state.winner) return;
            clearAiSafetyTimer();
            state.aiThinking = false;
            const localP = getLocalPlayer();
            const enemyP = localP === 1 ? 2 : 1;
            state.winner = enemyP;
            addLog(`Player ${localP} forfeits the match.`);
            checkWin();
        }

        function resetGame() {
            _invalidateBoardGrid();
            clearAiSafetyTimer();
            transitionTo(GS.PARTY_BUILDER);
            state.activePlayer = 1;
            state.round = 0;
            state.selectedUnitId = null;
            state.focusedUnitId = null;
            state.hoverUnitId = null;
            state.actionMode = null;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            state.pendingTarget = null;
            state.partyBuilds = structuredClone(DEFAULT_BUILDS);
            state.partyNames = buildDefaultPartyNames();
            state.partyMeta = makeDefaultPartyMeta();
            state.loadouts = buildDefaultLoadouts(state.partyMeta);
            optimizeRandomizeParty(2);
            state.units = makeUnitsFromBuilds();
            state.hourglasses = [];
            state.hourglassBuffs = {
                1: 0,
                2: 0
            };
            state.hiddenItems = [];
            state.foundByPlayer = {
                1: new Set(),
                2: new Set()
            };
            state.scannedByPlayer = {
                1: new Set(),
                2: new Set()
            };
            state.placed = false;
            state.winner = null;
            state.currentBattleTrackKey = null;
            state.bombs = [];
            state.plantedSeeds = [];
            state.warpRunes = [];
            state.wards = [];
            state.turrets = [];
            state._flairRevealTiles = {
                1: null,
                2: null
            };
            state._fogRevealTiles = null;
            state._fogAnchorUnitId = null;
            state.squadLeaderUnitId = null;
            clearUndoStack();
            if (state._fogRevealTimer) {
                clearTimeout(state._fogRevealTimer);
                state._fogRevealTimer = null;
            }
            state.aiThinking = false;
            state._winLogged = false;
            state._winCondition = null;
            state._endingReason = null;
            state._stalemateRounds = 0;
            state._lastActivityTotal = 0;
            state.matchNumber = 1;
            state.hitFlashIds = new Set();
            state.healFlashIds = new Set();
            state.statusWiggleIds = new Set();
            state.battleDialogueQueue = []; _lastDialogueHtml = "";
            state.battleDialogueTimer = null;
            state.selectedPanelFlash = null;
            // Controllers persist from mode selection — don't reset them here
            // (only devAutoSim / online mode changes controllers, not resetGame)
            state.devAutoSim = false;
            if (state.devSimTimer) {
                clearTimeout(state.devSimTimer);
                state.devSimTimer = null;
            }
            state.showPlayer2Builder = false;
            state.teamLockedIn = false;
            // state.floors removed — unified map
            // 'earth' removed
            state.boardTerrain = [];
            hideResultOverlay();
            state.logEntries = [];
            _logRenderedCount = 0;
            _lastFclHtml = '';
            _lastHudSbHtml = '';
            _lastDialogueHtml = '';
            renderLog();
            addLog('Game reset. Build both parties, then start the match. Hourglasses grant stacking team buffs — every 3rd triggers Time Travel!');
            if (!state.titleScreenVisible) syncMusicToState();
            render();
        }

        function applyPartyBuild(showLog = true) {
            if (!validateBuilderLoadouts(showLog)) return false;

            // ── Auto-optimize AI-controlled players' loadouts so they always have full builds ──
            [1, 2].forEach(player => {
                if (state.controllers[player] === CTRL.AI) {
                    state.partyBuilds[player].forEach((cls, idx) => {
                        const race = state.partyMeta?.[player]?.[idx]?.race || '';
                        state.loadouts[player][idx] = optimizeLoadoutForClass(cls, race);
                    });
                }
            });

            // Check for empty item slots and warn user (human players only)
            const warnings = [];
            [1, 2].forEach(player => {
                // Skip AI-controlled players — their loadouts were just auto-optimized
                if (state.controllers[player] === CTRL.AI) return;
                state.partyBuilds[player].forEach((cls, idx) => {
                    const loadout = state.loadouts[player][idx];
                    const emptySlots = [];
                    const totalItems = Object.values(loadout?.items || {}).reduce((a, b) => a + b, 0);
                    if (totalItems === 0) emptySlots.push('no items');
                    if (emptySlots.length > 0) {
                        const unitName = state.partyNames[player]?.[idx] || cls;
                        warnings.push(`P${player} ${unitName} (${cls}): ${emptySlots.join(', ')}`);
                    }
                });
            });

            if (warnings.length > 0 && showLog) {
                // Dev auto-sim skips the confirmation dialog
                if (!state.devAutoSim) {
                    // Check if any empty spell slots could actually be filled
                    let canAutoFill = false;
                    [1, 2].forEach(p => {
                        if (state.controllers[p] === CTRL.AI) return;
                        state.partyBuilds[p].forEach((c, i) => {
                            const lo = state.loadouts[p][i];
                            const r = state.partyMeta?.[p]?.[i]?.race || '';
                            const budUsed = getLoadoutPoints(lo, c, r);
                            const budLeft = CONFIG.unitSpellBudget - budUsed;
                            const usedIds = new Set((lo?.spells || []).filter(Boolean));
                            const eq = lo?.equipment || {};
                            const hasEmpty = (lo?.spells || []).some((s, si) => si < CONFIG.unitSkillSlots && !s);
                            if (hasEmpty && budLeft >= 1) {
                                const hasCandidate = getEligibleSpellsForClass(c).some(sp =>
                                    !usedIds.has(sp.id) &&
                                    getEffectiveEquipCost(sp, c, r) <= budLeft
                                );
                                if (hasCandidate) canAutoFill = true;
                            }
                        });
                    });

                    const _doAutoFill = function() {
                        [1, 2].forEach(p => {
                            if (state.controllers[p] === CTRL.AI) return;
                            state.partyBuilds[p].forEach((c, i) => {
                                const lo = state.loadouts[p][i];
                                const r = state.partyMeta?.[p]?.[i]?.race || '';
                                const eq = lo?.equipment || {};
                                const existingSpells = (lo?.spells || []).slice();
                                let budUsed = existingSpells.reduce((sum, id) => sum + getEffectiveEquipCost(getSpellById(id), c, r), 0);
                                let ccCount = countCrossClassSpells ? countCrossClassSpells(existingSpells, c) : 0;
                                const usedIds = new Set(existingSpells.filter(Boolean));
                                const eligible = getEligibleSpellsForClass(c)
                                    .filter(sp => !usedIds.has(sp.id))
                                    .sort((a, b) => getEffectiveEquipCost(a, c, r) - getEffectiveEquipCost(b, c, r));
                                for (let s = 0; s < CONFIG.unitSkillSlots; s++) {
                                    if (existingSpells[s]) continue;
                                    for (const spell of eligible) {
                                        if (usedIds.has(spell.id)) continue;
                                        const ec = getEffectiveEquipCost(spell, c, r);
                                        if (budUsed + ec > CONFIG.unitSpellBudget) continue;
                                        const isCross = !isSpellNativeToClass(spell, c);
                                        if (isCross && ccCount >= CONFIG.maxCrossClassSpells) continue;
                                        existingSpells[s] = spell.id;
                                        usedIds.add(spell.id);
                                        budUsed += ec;
                                        if (isCross) ccCount++;
                                        break;
                                    }
                                }
                                lo.spells = existingSpells;
                            });
                        });
                        state.units = makeUnitsFromBuilds();
                    };

                    const _finishApply = function() {
                        state.units = makeUnitsFromBuilds();
                        state.selectedUnitId = null;
                        state.focusedUnitId = null;
                        state.hoverUnitId = null;
                        state.actionMode = null;
                        state.actionMenuView = 'root';
                        state.selectedTool = null;
                        state.pendingTarget = null;
                        state.hourglasses = [];
                        state.hourglassBuffs = { 1: 0, 2: 0 };
                        state.hiddenItems = [];
                        state.teamLockedIn = true;
                        if (showLog) addLog('Party builds locked in. Ready to fight!');
                        render();
                    };

                    if (canAutoFill) {
                        const msg = 'Some party members have empty spell slots.\n\n' + warnings.join('\n') + '\n\nWould you like to auto-fill remaining slots?';
                        ewConfirm(msg, function() {
                            _doAutoFill();
                            _finishApply();
                        }, function() {
                            _finishApply();
                        }, { okLabel: 'Auto-fill & Lock In', cancelLabel: 'Lock In As-Is' });
                        return true; // will complete async
                    } else {
                        const otherWarnings = warnings.filter(w => !w.includes('empty spell slot'));
                        if (otherWarnings.length > 0) {
                            const msg = 'Some party members have empty slots:\n\n' + otherWarnings.join('\n') + '\n\nLock in anyway?';
                            ewConfirm(msg, function() {
                                _finishApply();
                            }, null, { okLabel: 'Lock In', cancelLabel: 'Cancel' });
                            return true; // will complete async
                        }
                    }
                }
            }

            state.units = makeUnitsFromBuilds();
            state.selectedUnitId = null;
            state.focusedUnitId = null;
            state.hoverUnitId = null;
            state.actionMode = null;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            state.pendingTarget = null;
            state.hourglasses = [];
            state.hourglassBuffs = {
                1: 0,
                2: 0
            };
            state.hiddenItems = [];
            state.foundByPlayer = {
                1: new Set(),
                2: new Set()
            };
            state.scannedByPlayer = {
                1: new Set(),
                2: new Set()
            };
            state.placed = false;
            state.setupStep = 'builder';
            state.bombs = [];
            state.plantedSeeds = [];
            state.warpRunes = [];
            state.wards = [];
            state.turrets = [];
            state._flairRevealTiles = {
                1: null,
                2: null
            };
            state._winLogged = false;
            state._winCondition = null;
            state._endingReason = null;
            state._stalemateRounds = 0;
            state._lastActivityTotal = 0;
            state.currentBattleTrackKey = null;
            state.teamLockedIn = true;
            if (showLog) addLog('Team locked in! Ready to start match.');
            render();
            return true;
        }

        function beginPlacement() {
            // Phase/setupStep managed by transitionTo(GS.BATTLE) in prepareBattleState
            state.activePlayer = 1;
            state.selectedUnitId = null;
            state.focusedUnitId = null;
            state.hoverUnitId = null;
            state.actionMode = null;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            state.pendingTarget = null;
            state.hourglasses = [];
            state.hourglassBuffs = {
                1: 0,
                2: 0
            };
            state.hiddenItems = [];
            state.foundByPlayer = {
                1: new Set(),
                2: new Set()
            };
            state.scannedByPlayer = {
                1: new Set(),
                2: new Set()
            };
            state.placed = false;

            randomizeSharedObjectives();

            state.placed = true;
            const _mpCheck = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
            if (_mpCheck && _mpCheck.hasHourglasses === false) {
                // No hourglasses or hidden items in this mode
            } else if (state.hourglasses.length < CONFIG.winHourglasses) {
                addLog('Could not place all hourglasses with spacing rules on this roll.');
            } else {
                addLog(`${CONFIG.winHourglasses} hourglasses scattered across the battlefield. Collect hourglasses for permanent team buffs!`);
            }
            render();
        }

        function startMatch() {
            state.startTime = Date.now();
            // ── Initialize multiplayer mode state ──
            const mpMode = getActiveMultiplayerMode();
            state.matchKills = { 1: 0, 2: 0 };
            state.matchScores = { 1: 0, 2: 0 };
            state.suddenDeathActive = false;
            state.flags = null;
            state.roamingNexus = null;
            if (mpMode.timeLimitSec) {
                state.matchClock = {
                    timeLimitSec: mpMode.timeLimitSec,
                    elapsedSec: 0,
                    paused: false,
                    startedAt: Date.now(),
                    lastTickAt: Date.now(),
                };
            } else {
                state.matchClock = null;
            }
            // ── Override game mode flags based on multiplayer mode ──
            const gm = GAME_MODES[activeGameMode];
            if (gm) {
                gm._runtimeHasTowers = mpMode.hasTowers;
            }
            if (!validateBuilderLoadouts(true)) {
                playErrorSfx();
                return;
            }
            playSfx('uiButtonConfirm');
            // ── Ranked: lock in bot Elo for this match ──
            if (state.isRankedMatch) {
                state._botElo = getBotElo();
            }
            refillBattleShuffleBag();
            state.currentBattleTrackKey = chooseBattleTrackKey();
            state.zodiacOffset = randInt(ZODIAC_CYCLE.length);
            state.activeZodiac = getActiveZodiac(1);
            state.skyEvent = null;
            state.activeWeather = [];
            state.announcementQueue = [];
            prepareBattleStateFromCurrentBuilds();
            clearUndoStack();

            // ── CTF: Spawn flags at each team's sanctuary ──
            if (mpMode.hasFlags && state.sanctuaries) {
                const s1 = state.sanctuaries[1];
                const s2 = state.sanctuaries[2];
                state.flags = {
                    1: { x: s1 ? s1.churchX : 0, y: s1 ? s1.churchY : 0, carriedBy: null, atBase: true, owner: 1 },
                    2: { x: s2 ? s2.churchX : bw() - 1, y: s2 ? s2.churchY : 0, carriedBy: null, atBase: true, owner: 2 },
                };
                addLog('🏳️ Capture the Flag! Steal the enemy flag and return it to your sanctuary to score.');
            }

            // ── Hotspot: Spawn first roaming nexus ──
            if (mpMode.hasRoamingNexus) {
                _spawnRoamingNexus();
                addLog('🔥 Hotspot! One Nexus spawns at a time. Capture it to score — then it moves!');
            }

            // ── Mode-specific start messages ──
            if (mpMode.id === 'tdm' || mpMode.id === 'ffa') {
                const mins = Math.floor(mpMode.timeLimitSec / 60);
                addLog(`💀 ${mpMode.label}! ${mins}-minute time limit. Most kills wins. Wipeout also wins instantly.`);
            } else if (mpMode.id === 'domination') {
                addLog('🚩 Domination! Capture Nexus points to earn points every round. Most points at time wins.');
            }
            // ── BLITZ MODE: build initial turn order by speed ──
            if (getActiveGameMode().blitzMode) {
                buildBlitzTurnOrder();
            }
            // ── Squad Leader: assign leader to first alive P1 unit ──
            if (state.squadLeaderMode) {
                const firstP1 = state.units.find(u => u.player === 1 && !u.dead);
                state.squadLeaderUnitId = firstP1 ? firstP1.id : null;
                state.fogOfWar = true;
                state.teamVision = false;
                if (firstP1) addLog(`🎖 ${unitDisplayName(firstP1)} is your Squad Leader. You control them — AI handles the rest of your team.`);
            }
            // ── Round-start effects for all units, then maybeAdvanceTurn picks first unit ──
            beginBlitzRound();
            addLog(state.devAutoSim ?
                `Dev sim battle started for match ${state.matchNumber}. Both teams are automated and running at accelerated pace.` :
                `⚡ Battle started for match ${state.matchNumber}. Units act in speed order!`);
            if (state.isRankedMatch && !state.devAutoSim) {
                const cs = loadCareerStats();
                const ri = getEloRankInfo(cs.elo);
                addLog(`🏆 RANKED MATCH — ${ri.icon} ${ri.name} (${cs.elo} Elo) vs Bot (~${state._botElo || '?'} Elo)`);
            }
            addLog(`⚡ Round ${state.round}`);
            syncMusicToState();
            render();
            // Deferred resize — mapRow was display:none, needs a reflow before sizing correctly
            window.requestAnimationFrame(() => {
                syncBattleMapSquare();
                CONFIG.tileSize = computeBattleTileSize();
                renderBoard();
                maybeAdvanceTurn(); // picks first speed-ordered unit
            });
        }

        // ── PING SYSTEM ──
        const PING_TYPES = {
            danger: {
                icon: '⚠️',
                label: 'Danger',
                color: '#ff6b6b'
            },
            missing: {
                icon: '❓',
                label: 'Missing',
                color: '#ffb84d'
            },
            loot: {
                icon: '💰',
                label: 'Loot',
                color: '#f8d66d'
            },
            help: {
                icon: '🆘',
                label: 'Help',
                color: '#ff6b6b'
            },
            gather: {
                icon: '🏁',
                label: 'Gather',
                color: '#85a9ff'
            },
            retreat: {
                icon: '🔙',
                label: 'Retreat',
                color: '#b78cff'
            }
        };

        function doPing(unit, x, y) {
            if (!canUnitAct(unit)) {
                addLog('That unit already acted this round.');
                return 0;
            }
            if (!isInside(x, y)) {
                addLog('Invalid ping target.');
                return 0;
            }
            // Check if already pinged this tile
            if (state.pings.some(p => p.x === x && p.y === y && p.player === unit.player)) {
                addLog('This tile is already pinged.');
                return 0;
            }
            const pingType = state.selectedTool || 'danger';
            const pingDef = PING_TYPES[pingType];
            if (!pingDef) {
                addLog('Unknown ping type.');
                return 0;
            }
            pushUndoSnapshot(false); // undoable — pings are harmless
            state.pings.push({
                x,
                y,
                player: unit.player,
                type: pingType,
                icon: pingDef.icon,
                round: state.round
            });
            addLog(`${unitDisplayName(unit)} pings ${coordLabel(x, y)}: ${pingDef.icon} ${pingDef.label}`);
            spendAP(unit, AP_COST_ACTION);
            state.actionMode = null;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            endUnitIfDone(unit);
            renderAfterMinorAction();
            return actionMs(300);
        }

        // ── ENEMY SIGHTINGS TRACKER ──
        function updateEnemySightings(viewerPlayer) {
            const enemies = state.units.filter(u => u.player !== viewerPlayer);
            const visibleTiles = computeVisibleTiles(viewerPlayer);
            for (const enemy of enemies) {
                const key = enemy.id;
                if (!enemy.dead && visibleTiles.has(posKey(enemy.x, enemy.y))) {
                    // Currently visible - update sighting with current data
                    state.enemySightings[viewerPlayer][key] = {
                        id: enemy.id,
                        name: enemy.name,
                        cls: enemy.cls,
                        race: enemy.race,
                        types: enemy.types ? [...enemy.types] : [],
                        faction: enemy.faction,
                        hp: enemy.hp,
                        maxHp: enemy.maxHp,
                        mp: enemy.mp,
                        maxMp: enemy.maxMp,
                        x: enemy.x,
                        y: enemy.y,
                        dead: false,
                        statuses: getActiveStatusKeys(enemy),
                        equipment: enemy.equipment,
                        round: state.round,
                        discovered: true,
                        currentlyVisible: true
                    };
                } else if (enemy.dead && state.enemySightings[viewerPlayer][key]) {
                    // Mark as dead if we knew about them
                    state.enemySightings[viewerPlayer][key].dead = true;
                    state.enemySightings[viewerPlayer][key].currentlyVisible = false;
                    state.enemySightings[viewerPlayer][key]._respawnIn = enemy._respawnIn || null;
                } else if (state.enemySightings[viewerPlayer][key]) {
                    // Not visible anymore - mark stale
                    state.enemySightings[viewerPlayer][key].currentlyVisible = false;
                }
            }
            // Add placeholder entries for undiscovered enemies
            for (const enemy of enemies) {
                if (!state.enemySightings[viewerPlayer][enemy.id]) {
                    state.enemySightings[viewerPlayer][enemy.id] = {
                        id: enemy.id,
                        name: null,
                        cls: null,
                        race: null,
                        types: [],
                        faction: null,
                        hp: null,
                        maxHp: null,
                        mp: null,
                        maxMp: null,
                        x: null,
                        y: null,
                        dead: enemy.dead,
                        statuses: [],
                        equipment: null,
                        round: null,
                        discovered: false,
                        currentlyVisible: false
                    };
                }
            }
        }

        // ── Right panel tab switching ──
        function switchCtrlTab(tab) {
            state._ctrlTab = tab;
            document.querySelectorAll('.ctrl-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
            document.querySelectorAll('.ctrl-tab-content').forEach(c => c.classList.toggle('active', c.dataset.tab === tab));
        }
        window.switchCtrlTab = switchCtrlTab;

        function renderEnemyRoster() {
            // Render into the right-panel tab
            const panel = document.getElementById('enemyRosterPanel');
            if (!panel) return;
            if (state.phase !== 'battle') {
                panel.innerHTML = '<h3>Enemy Intel</h3><div id="enemyRosterList"></div>';
                return;
            }
            const viewerPlayer = getViewerPlayer();
            const sightings = state.enemySightings[viewerPlayer] || {};
            const entries = Object.values(sightings);
            if (!entries.length) {
                panel.innerHTML = '<div class="small" style="color:var(--muted);padding:8px">No intel yet. Discover enemies by moving units into their line of sight.</div>';
                return;
            }
            // Sort: visible first, then discovered, then undiscovered, dead last
            entries.sort((a, b) => {
                if (a.dead !== b.dead) return a.dead ? 1 : -1;
                if (a.currentlyVisible !== b.currentlyVisible) return a.currentlyVisible ? -1 : 1;
                if (a.discovered !== b.discovered) return a.discovered ? -1 : 1;
                return 0;
            });
            panel.innerHTML = entries.map(s => {
        if (!s.discovered) {
          return `<div class="enemy-roster-card undiscovered">
            <div class="enemy-roster-icon">❓</div>
            <div class="enemy-roster-info">
              <div class="enemy-roster-name">Unknown Unit</div>
              <div class="enemy-roster-stats">Not yet discovered</div>
            </div>
          </div>`;
        }
        const hpPct = s.maxHp ? Math.max(0, Math.min(100, (s.hp / s.maxHp) * 100)) : 0;
        const staleRounds = s.currentlyVisible ? 0 : (state.round - (s.round || 0));
        const staleLabel = s.currentlyVisible ? '<span style="color:var(--green);font-size:9px">● Visible</span>' : staleRounds > 0 ? `<span class="enemy-roster-stale">Last seen ${staleRounds} round${staleRounds !== 1 ? 's' : ''} ago</span>` : '';
            const deadClass = s.dead ? ' dead-enemy' : '';
            const statusIcons = (s.statuses || []).map(k => {
                const m = typeof STATUS_DEFS !== 'undefined' ? STATUS_DEFS[k] : null;
                return m ? (m.icon || '') : '';
            }).filter(Boolean).join('');
            const posLabel = s.x !== null ? coordLabel(s.x, s.y) : '??';
            return `<div class="enemy-roster-card${deadClass}">
          <div class="enemy-roster-icon">${s.dead ? '☠' : '⚔'}</div>
          <div class="enemy-roster-info">
            <div class="enemy-roster-name">${escapeHtml(s.name || s.cls || '?')}${statusIcons ? ' ' + statusIcons : ''}</div>
            <div class="enemy-roster-stats">${s.race || '?'} · ${s.cls || '?'} · ${posLabel}${s.dead ? ` · DEFEATED${s._respawnIn ? ' (' + s._respawnIn + ' rnd)' : ''}` : ` · ${s.hp}/${s.maxHp} HP`}</div>
            ${!s.dead ? `<div class="enemy-mini-bar"><div class="enemy-mini-fill" style="width:${hpPct}%"></div></div>` : ''}
            ${staleLabel}
          </div>
        </div>`;
        }).join('');
    }

    // ── TURN BANNER ──
    function showTurnBanner(player, roundNum, isNewRound, blitzUnit) {
      const overlay = document.getElementById('turnBannerOverlay');
      if (!overlay) return;
      // PERF: skip during devsim
      if (state.devAutoSim) return;
      // Wait for ALL active animations (cinematics, banners, flashes, projectiles) to clear
      _waitForAnimationsThen(() => _showTurnBannerNow(overlay, player, roundNum, isNewRound, blitzUnit));
    }

    function _showTurnBannerNow(overlay, player, roundNum, isNewRound, blitzUnit) {
      // Double-check we still should show (state may have changed during wait)
      if (state.winner || state.devAutoSim) return;
      const roundText = isNewRound ? `Round ${roundNum}` : '';
      const viewer = getViewerPlayer();
      const isEnemyTurn = blitzUnit ? (blitzUnit.player !== viewer) : (player !== viewer);

      // Toggle centered positioning for enemy turns
      overlay.classList.toggle('enemy-turn', isEnemyTurn);

      let cardHtml;
      if (blitzUnit && typeof blitzUnit === 'object') {
        const spriteSrc = getBattleMapSpriteUrl(blitzUnit);
        const name = unitDisplayName(blitzUnit);
        const spdText = `SPD ${blitzUnit.spd || 0} · ${blitzUnit.cls}`;
        const pLabel = `P${blitzUnit.player}`;
        const autoLabel = state.autoPlayers?.[blitzUnit.player] ? ' · CPU' : '';
        const pClass = blitzUnit.player;
        // Show "Player X's Turn" header only for enemy turns
        const turnOwnerLabel = isEnemyTurn ? (
          ONLINE_RULES.active ? "Opponent's Turn" :
          `Player ${blitzUnit.player}'s Turn`) : '';
        cardHtml = `<div class="turn-banner-card">
          ${roundText ? `<div class="turn-banner-round">${roundText}</div>` : ''}
          ${turnOwnerLabel ? `<div class="turn-banner-player p${pClass}">${turnOwnerLabel}</div>` : ''}
          <div class="turn-banner-blitz">
            <div class="turn-banner-sprite" style="background-image:url('${spriteSrc}')"></div>
            <div class="turn-banner-info">
              <div class="turn-banner-unitname p${pClass}">${escapeHtml(name)}</div>
              <div class="turn-banner-unitsub"><span class="turn-banner-ptag p${pClass}">${pLabel}</span>${spdText}${autoLabel}</div>
            </div>
          </div>
        </div>`;
      } else {
        // ── STANDARD BANNER ──
        const isMyTurn = player === viewer;
        const playerLabel = ONLINE_RULES.active
          ? (isMyTurn ? 'Your Turn' : "Opponent's Turn")
          : `Player ${player}'s Turn`;
        const subLabel = ONLINE_RULES.active
          ? `Player ${player} · ${state.autoPlayers?.[player] ? 'Auto' : (isMyTurn ? 'You' : 'Opponent')}`
          : `Player ${player} · ${state.autoPlayers?.[player] ? 'CPU' : 'Human'}`;
        cardHtml = `<div class="turn-banner-card">${roundText ? `<div class="turn-banner-round">${roundText}</div>` : ''}<div class="turn-banner-player p${player}">${playerLabel}</div><div class="turn-banner-sub">${subLabel}</div></div>`;
      }

      overlay.innerHTML = cardHtml;
        overlay.classList.add('visible');
        if (state._turnBannerTimer) clearTimeout(state._turnBannerTimer);
        state._turnBannerTimer = null;
        // Banner stays visible for the duration of the unit's turn — hidden by hideTurnBanner()
        }

        function hideTurnBanner() {
            const overlay = document.getElementById('turnBannerOverlay');
            if (overlay) overlay.classList.remove('visible');
            if (state._turnBannerTimer) { clearTimeout(state._turnBannerTimer); state._turnBannerTimer = null; }
        }

        function maybeAdvanceTurn() {
            // ── BLITZ MODE: individual unit turns by speed, no player turns ──
            const mode = getActiveGameMode();
            if (mode.blitzMode) {
                if (state.winner) return;
                hideTurnBanner();
                // Clear selection state
                state.selectedUnitId = null;
                state.focusedUnitId = null;
                state.actionMode = null;
                state.actionMenuView = 'root';
                state.showUnitInfo = false;
                state._blitzActiveUnitId = null;

                // ── Cancel stale AI timers from the previous unit's turn ──
                _blitzTurnGen++;
                state.aiThinking = false;
                clearAiSafetyTimer();
                if (state._runComputerTurnTimer) { clearTimeout(state._runComputerTurnTimer); state._runComputerTurnTimer = null; }

                // Try to pick the next unit from the current round's speed queue
                // getNextBlitzUnit looks for alive units with AP > 0
                let nextUnit = getNextBlitzUnit();

                // If no more units in queue, start a new round
                if (!nextUnit) {
                    // ══════════════════════════════════════════════════════
                    // END-OF-ROUND STATUS PHASE — Pokémon-style sequential
                    // Process DoT/HoT/status ticks with camera + dialogue,
                    // THEN continue to the actual round transition.
                    // ══════════════════════════════════════════════════════
                    processEndOfRoundStatuses(function _afterStatusPhase() {
                    if (state.winner) return;

                    // ── End-of-round effects ──
                    tickSkyEvent();
                    tickWeather();
                    state.round += 1;
                    tickMatchClock();
                    checkZodiacRotation();
                    checkNewSkyEvent();

                    // ── Start buffering visual events for the entire round transition ──
                    _reStartBuffering();
                    _reBeginGroup('🌦 Weather spawn');
                    spawnWeather();

                    // ── RESPAWN SYSTEM ──
                    _reBeginGroup('🔄 Respawns');
                    processRespawns();

                    // ── STALEMATE DETECTION ──
                    // Skip for timed modes — the match clock handles endings
                    const _smMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
                    if (!_smMode || !_smMode.timeLimitSec || _smMode.id === 'arena')
                    {
                        const totalDmgNow = state.units.reduce((s, u) => s + (u._trackDmgDealt || 0) + (u._trackDmgReceived || 0), 0);
                        const totalSpellsCast = state.units.reduce((s, u) => s + (u._trackSpellsCast || 0), 0);
                        const totalFloorMoves = 0;
                        const activityNow = totalDmgNow + totalSpellsCast + totalFloorMoves;
                        if (!state._lastActivityTotal) state._lastActivityTotal = 0;
                        if (!state._stalemateRounds) state._stalemateRounds = 0;
                        if (activityNow > state._lastActivityTotal) {
                            state._stalemateRounds = 0;
                        } else {
                            state._stalemateRounds++;
                        }
                        state._lastActivityTotal = activityNow;
                        let stalemateThreshold = 20;
                        {
                            const p1Sections = new Set(state.units.filter(u => !u.dead && u.player === 1).map(u => getSectionForUnit(u)));
                            const p2Sections = new Set(state.units.filter(u => !u.dead && u.player === 2).map(u => getSectionForUnit(u)));
                            const teamsShareSection = [...p1Sections].some(f => p2Sections.has(f));
                            if (!teamsShareSection) stalemateThreshold = 30;
                        }
                        if (state._stalemateRounds >= stalemateThreshold && !state.winner) {
                            addLog(`⚖️ NO CONTEST — ${stalemateThreshold} rounds with no combat or activity. Match voided.`);
                            state.winner = 0;
                            state._winLogged = true;
                            state._winCondition = 'no_contest';
                            state._endingReason = 'stalemate_no_contest';
                            state.stalemateRounds = stalemateThreshold;
                            addLog('Match does not count toward records. Units could not find each other.');
                            setTimeout(() => finalizeMatch(), 0);
                            return;
                        }
                    }

                    // Reset all units for the new round
                    for (const u of state.units) {
                        if (!u.dead) {
                            if (u._justRespawned) { u._justRespawned = false; continue; }
                            const stunned = getActiveStatusKeys(u).some(k => STATUS_DEFS[k]?.skipTurn);
                            u.ap = stunned ? 0 : getUnitMaxAP(u);
                            u.movesThisTurn = 0;
                            u._turnKills = 0;
                            u._aiFailedSpells = null;
                            u._aiFailedCombos = null;
                            u._aiSkipAttack = false;
                            // _aiSkipFloor removed
                            u._aiLoopCount = 0;
                            u._encoreThisRound = false;
                            // _floorTransitionThisRound removed
                            u._guardCounterBonus = 0;
                            u._skippedTurn = false;
                            if (stunned) addLog(`${unitDisplayName(u)} is stunned and cannot act!`);
                            // NOTE: Status DoT/HoT now runs at end of round via processEndOfRoundStatuses
                        }
                    }
                    state._skippedUnit = null;

                    // Build new speed-sorted turn order
                    buildBlitzTurnOrder();

                    // Round-start effects (towers, terrain, weather for ALL units)
                    // This continues the buffering session started above before spawnWeather
                    beginBlitzRound();

                    // ── Stop buffering — all round-start visuals now captured ──
                    _reStopBuffering();

                    addLog(`⚡ Round ${state.round} — Blitz!`);
                    playSfx('newRound');

                    // ── Passive XP: all living units gain a small amount each round ──
                    for (const u of state.units) {
                        if (!u.dead) grantXP(u, XP_PASSIVE_PER_ROUND, 'round');
                    }

                    // ── GOLD: passive income + nexus income ──
                    processPassiveGoldIncome();
                    processNexusIncome();

                    // ── Reset per-round sanctuary flags ──
                    for (const u of state.units) {
                        u._usedChurchThisRound = false;
                    }

                    // ── PERIODIC HOURGLASS RESPAWN: every 10 rounds, spawn 3 new (max 6 uncollected on ground) ──
                    if (state.round > 1 && state.round % 10 === 0) {
                        spawnPeriodicHourglasses();
                    }

                    // ── BOSS SPAWN CHECK: check if any bosses should spawn this round ──
                    checkBossSpawns();

                    // ── Play back buffered round-start visuals in causal order ──
                    // After playback finishes, show announcements, then start the first turn.
                    const savedGen = _blitzTurnGen;
                    playBufferedRoundEvents(() => {
                        if (_blitzTurnGen !== savedGen || state.winner) return;
                        // Show queued announcements (sky events, zodiac, etc.)
                        showNextAnnouncement(() => {
                            if (_blitzTurnGen !== savedGen || state.winner) return;
                            // Now pick the first unit and start its turn
                            const firstUnit = getNextBlitzUnit();
                            _continueBlitzWithUnit(firstUnit);
                        });
                    });
                    }); // end processEndOfRoundStatuses callback
                    return; // async continuation via callbacks above
                }

                // No new-round needed — just continue with the next unit
                _continueBlitzWithUnit(nextUnit);
                return;
            }
        }

        // ── Helper: continue blitz flow once we have the next unit ──
        // ── PER-UNIT TOWER/TURRET DAMAGE: fires at the start of each unit's turn ──
        // Towers fire at the active unit if it's an enemy in range.
        // Turrets owned by the enemy of the active unit fire at the active unit.
        function processTurnStartTowerDamage(unit, onDone) {
            if (!unit || unit.dead) { if (onDone) onDone(); return; }

            // ── Collect all tower + turret hits ──
            const hits = [];

            if (state.towers) {
                for (const tOwner of [1, 2]) {
                    if (tOwner === unit.player) continue;
                    const tower = state.towers[tOwner];
                    if (!tower || tower.hp <= 0) continue;
                    const TOWER_ATTACK_RADIUS = 4;
                    const TOWER_BASE_DMG = 250;
                    const dist = Math.abs(unit.x - tower.x) + Math.abs(unit.y - tower.y);
                    if (dist < 1 || dist > TOWER_ATTACK_RADIUS) continue;
                    if (getSectionForUnit(unit) !== 'earth') continue;
                    const distPenalty = Math.max(0, (dist - 1) * 16);
                    const dmg = Math.max(40, TOWER_BASE_DMG + randInt(40) - 16 - distPenalty - (unit.def || 0));
                    hits.push({ kind: 'tower', srcX: tower.x, srcY: tower.y, dmg, owner: tOwner });
                }
            }

            if (state.turrets?.length) {
                const enemyTurrets = state.turrets.filter(t => t.owner !== unit.player && t.hp > 0);
                for (const turret of enemyTurrets) {
                    if (getSectionForUnit(unit) !== 'earth') continue;
                    const dist = Math.abs(unit.x - turret.x) + Math.abs(unit.y - turret.y);
                    if (dist > turret.range) continue;
                    const dmg = Math.max(24, turret.dmg + randInt(24) - 8);
                    hits.push({ kind: 'turret', srcX: turret.x, srcY: turret.y, dmg });
                }
            }

            if (hits.length === 0) { if (onDone) onDone(); return; }

            // ── Camera: pan from tower/turret to the target unit ──
            const mainHit = hits[0];
            const pseudoSource = { x: mainHit.srcX, y: mainHit.srcY, player: unit.player === 1 ? 2 : 1 };

            // Skip camera during devsim
            if (state.devAutoSim || state.cameraDisabled) {
                _applyTowerHits(unit, hits);
                if (onDone) onDone();
                return;
            }

            hideTurnBanner();

            // Phase 1: Focus on the tower/turret source
            const camZoom = getDefaultZoom();
            setBoardCameraFocusPoint(mainHit.srcX, mainHit.srcY, {
                zoom: camZoom,
                transitionMs: actionMs(350)
            });

            // Phase 2: After a hold, pan to target and fire projectiles
            const holdMs = actionMs(600);
            const travelMs = actionMs(500);
            window.setTimeout(() => {
                if (state.winner) { if (onDone) onDone(); return; }
                animateBoardCameraPath(
                    { x: mainHit.srcX, y: mainHit.srcY },
                    { x: unit.x, y: unit.y },
                    { duration: travelMs, zoom: camZoom }
                );
                // Fire projectiles from all sources
                for (const h of hits) {
                    playProjectile(h.srcX, h.srcY, unit.x, unit.y, 'damage', travelMs);
                }
            }, holdMs);

            // Phase 3: On impact — apply damage, show floating text
            window.setTimeout(() => {
                if (state.winner) { if (onDone) onDone(); return; }
                stopBoardCameraAnimation();
                setBoardCameraFocusPoint(unit.x, unit.y, {
                    zoom: camZoom,
                    transitionMs: actionMs(200)
                });
                _applyTowerHits(unit, hits);
                scheduleBoardRender();
            }, holdMs + travelMs);

            // Phase 4: Reset camera and callback
            const totalMs = holdMs + travelMs + actionMs(700);
            window.setTimeout(() => {
                if (onDone) onDone();
            }, totalMs);
        }

        /** Apply pre-computed tower/turret damage (called after camera animation) */
        function _applyTowerHits(unit, hits) {
            for (const h of hits) {
                if (unit.dead || unit._dying) break;
                if (h.kind === 'tower') {
                    addLog(`🐉 P${h.owner} Dragon fires at ${unitDisplayName(unit)} for ${h.dmg} damage!`);
                    showFloatingTextForUnit(unit, `-${h.dmg}`, 'damage');
                    applyDamageToUnit(unit, h.dmg, `🐉 Dragon blast: `, { ignoreArmor: false });
                } else {
                    addLog(`🔧 Turret fires at ${unitDisplayName(unit)} for ${h.dmg} damage!`);
                    showFloatingTextForUnit(unit, `-${h.dmg}`, 'damage');
                    applyDamageToUnit(unit, h.dmg, `🔧 Turret blast: `, { ignoreArmor: false, damageType: 'physical' });
                }
            }
        }

        // ── Helper: wait for all combat animations to finish before starting next turn ──
        function _waitForAnimationsThen(callback) {
            const MAX_WAIT = 8000; // safety cap
            const start = Date.now();
            function check() {
                if (state.winner) return;
                if (Date.now() - start > MAX_WAIT) { callback(); return; }
                // Wait for cinematic overlay to finish (including fade-out)
                if (typeof isCinematicPresent === 'function' && isCinematicPresent()) {
                    setTimeout(check, 200);
                    return;
                }
                // Wait for death animations (_dying units)
                if (state.units.some(u => u._dying)) {
                    setTimeout(check, 200);
                    return;
                }
                // Wait for center banners (death banners, combat banners)
                if (typeof isCenterBannerBusy === 'function' && isCenterBannerBusy()) {
                    setTimeout(check, 200);
                    return;
                }
                // Wait for damage / heal flashes to finish
                if ((state.hitFlashIds && state.hitFlashIds.size > 0) ||
                    (state.healFlashIds && state.healFlashIds.size > 0)) {
                    setTimeout(check, 120);
                    return;
                }
                // Wait for active projectiles to clear
                if (projectileLayerEl && projectileLayerEl.childElementCount > 0) {
                    setTimeout(check, 100);
                    return;
                }
                callback();
            }
            check();
        }

        function _continueBlitzWithUnit(nextUnit) {
                if (!nextUnit) return; // all dead or game over
                if (state.winner) return;

                // Wait for all combat animations from the previous turn to finish
                _waitForAnimationsThen(() => _continueBlitzWithUnit_impl(nextUnit));
        }

        function _continueBlitzWithUnit_impl(nextUnit) {
                if (!nextUnit) return;
                if (state.winner) return;

                // Set active player to this unit's owner & track active unit
                state.activePlayer = nextUnit.player;
                state._blitzActiveUnitId = nextUnit.id;

                // Update turn clock immediately
                renderTurnClock();

                // Show banner with unit sprite + name
                const allAliveHaveAp = state.units.filter(u => !u.dead && !u._skippedTurn).every(u => (u.ap || 0) > 0 || u.id === nextUnit.id);
                const isNewRound = allAliveHaveAp;
                showTurnBanner(nextUnit.player, state.round, isNewRound, nextUnit);

                // ── RESPAWNED / DEFEATED dialogue subtitles ──
                {
                    const dlgLines = [];
                    // Respawned: this unit just came back
                    if (nextUnit._showRespawnBanner) {
                        nextUnit._showRespawnBanner = false;
                        dlgLines.push(`<span class="dlg-heal">🔄 ${unitDisplayName(nextUnit)} has respawned!</span>`);
                    }
                    // Defeated: units that died since the last turn banner
                    if (state._recentDefeats?.length) {
                        const viewer = getViewerPlayer();
                        for (const d of state._recentDefeats) {
                            const isEnemy = d.player !== viewer;
                            const cls = isEnemy ? 'dlg-effective' : 'dlg-damage';
                            const icon = isEnemy ? '⚔' : '💀';
                            dlgLines.push(`<span class="${cls}">${icon} ${d.name} was defeated</span>`);
                        }
                        state._recentDefeats.length = 0;
                    }
                    if (dlgLines.length > 0) showBattleDialogue(dlgLines, 2000);
                }

                // ── STATUS AFFLICTION WIGGLE: show debuffs at turn start ──
                {
                    const debuffKeys = Object.entries(nextUnit.status || {})
                        .filter(([k, v]) => v > 0 && STATUS_DEFS[k]?.kind === 'debuff')
                        .map(([k]) => k);
                    if (debuffKeys.length > 0) {
                        triggerStatusWiggle(nextUnit);
                        const dlgMsgs = debuffKeys.map(k => {
                            const def = STATUS_DEFS[k];
                            const icon = def?.icon || def?.glyph || '⚠';
                            const label = def?.label || k;
                            const turns = nextUnit.status[k];
                            return `<span class="dlg-status">${icon} ${unitDisplayName(nextUnit)}</span> is <span class="dlg-status">${label}</span> (${turns} rnd)`;
                        });
                        showBattleDialogue(dlgMsgs, 1800);
                    }
                }

                const delay = state.devAutoSim ? scaleDevSimDelay(400, 4) : 650;
                const pendingUnitId = nextUnit.id;

                // ── TOWER/TURRET DAMAGE: enemy towers and turrets fire at this unit ──
                processTurnStartTowerDamage(nextUnit, function _afterTowerDamage() {
                if (nextUnit.dead || nextUnit._dying) {
                    // Tower killed this unit before it could act — skip to next
                    checkWin();
                    if (state.winner) return;
                    scheduleBoardRender();
                    window.setTimeout(() => maybeAdvanceTurn(), state.devAutoSim ? 0 : 900);
                    return;
                }

                // ── V2: SECONDARY JOB PICK at Lv4 ──
                if (nextUnit._pendingSecondaryJobPick) {
                    if (state.autoPlayers?.[nextUnit.player]) {
                        // AI: auto-pick immediately, then proceed to normal AI turn
                        aiPickSecondaryJob(nextUnit);
                        renderBoard();
                        render();
                        // Fall through to normal AI turn below
                    } else {
                        // Human: show job picker dialog, defer turn start
                        const gen = _blitzTurnGen;
                        window.setTimeout(() => {
                            if (_blitzTurnGen !== gen || state.winner) return;
                            const u = state.units.find(u => u.id === pendingUnitId && !u.dead);
                            if (!u) { maybeAdvanceTurn(); return; }
                            state.uiDialog = {
                                type: 'secondaryJobPick',
                                unitId: pendingUnitId,
                                onComplete: function() {
                                    // After picking, start the unit's actual turn
                                    state._blitzActiveUnitId = pendingUnitId;
                                    state.activePlayer = u.player;
                                    playUnitSwitchChime();
                                    selectUnit(pendingUnitId);
                                }
                            };
                            markDirty('dialog');
                            renderIfDirty();
                        }, delay);
                        return;
                    }
                }

                if (state.autoPlayers?.[nextUnit.player]) {
                    const gen = _blitzTurnGen;
                    window.setTimeout(() => {
                        if (_blitzTurnGen !== gen) return;
                        maybeTriggerComputerTurn();
                    }, delay);
                } else {
                    // Human turn: the ONLY check is whether this unit still has AP.
                    // If something erroneously called maybeAdvanceTurn during the delay,
                    // getNextBlitzUnit would have found this unit again (AP > 0) and
                    // re-set _blitzActiveUnitId to it. So just verify and select.
                    window.setTimeout(() => {
                        if (state.winner) return;
                        const u = state.units.find(u => u.id === pendingUnitId && !u.dead);
                        if (!u || unitFinished(u)) return; // unit died or lost AP somehow
                        // ── Clear stale dialogue from previous (AI) turn so it doesn't block action buttons ──
                        if (state.battleDialogueTimer) { clearTimeout(state.battleDialogueTimer); state.battleDialogueTimer = null; }
                        state.battleDialogueQueue = [];
                        _lastDialogueHtml = '';
                        // Make sure this unit is the active one (it should be)
                        state._blitzActiveUnitId = pendingUnitId;
                        state.activePlayer = u.player;
                        playUnitSwitchChime();
                        selectUnit(pendingUnitId);
                    }, delay);
                }
                }); // end processTurnStartTowerDamage callback
        }

        // Fire all queued announcements at once (overlapping) — for AI turns
        // ── AI STALL SAFETY: global watchdog ──
        let _aiSafetyTimer = null;
        // ── BLITZ TURN GENERATION COUNTER ──
        // Incremented every time maybeAdvanceTurn fires. Any delayed callback
        // (finishComputerAction, setTimeout from banner delay, safety timer) that
        // was scheduled in a previous generation is STALE and must bail.
        let _blitzTurnGen = 0;
        let _aiActionGen = 0; // captured from _blitzTurnGen when runComputerTurn starts

        function clearAiSafetyTimer() {
            if (_aiSafetyTimer) {
                clearTimeout(_aiSafetyTimer);
                _aiSafetyTimer = null;
            }
        }

        function maybeTriggerComputerTurn() {
            if (state.phase !== 'battle' || state.winner || state.aiThinking) return;
            // Check if the designated active unit belongs to an AI player
            const _shouldAIRun = () => {
                if (state._blitzActiveUnitId) {
                    const bUnit = state.units.find(u => u.id === state._blitzActiveUnitId);
                    return bUnit && state.autoPlayers?.[bUnit.player];
                }
                if (state.autoPlayers?.[state.activePlayer]) return true;
                if (state.squadLeaderMode && state.activePlayer === 1) {
                    const nextUnit = aliveUnitsFor(1).find(u => (u.ap || 0) > 0);
                    if (nextUnit && nextUnit.id !== state.squadLeaderUnitId) return true;
                    const leader = state.units.find(u => u.id === state.squadLeaderUnitId);
                    if (leader && leader.dead && nextUnit) return true;
                }
                return false;
            };
            if (!_shouldAIRun()) return;
            // Hide action menu during AI turns
            
            // Clear action menu content during AI turns (preserve panel structure)
            const _famRoot = document.getElementById('famRoot');
            const _famSub = document.getElementById('famSub');
            if (_famRoot) _famRoot.innerHTML = '';
            if (_famSub) _famSub.innerHTML = '';
            if (state.uiDialog?.type === 'pickupDecision') {
                state.uiDialog = null;
                renderUiDialog();
            }
            state.aiThinking = true;
            clearAiSafetyTimer();
            const safetyGen = _blitzTurnGen;
            _aiSafetyTimer = setTimeout(() => {
                if (state.aiThinking && state.phase === 'battle' && !state.winner) {
                    // Verify the safety timer is still for the right turn
                    if (_blitzTurnGen !== safetyGen) return;
                    state.aiThinking = false;
                    state.actionMode = null;
                    state.comboPartner = null;
                    state.selectedTool = null;
                    if (state._blitzActiveUnitId) {
                        const stuckUnit = state.units.find(u => u.id === state._blitzActiveUnitId);
                        if (stuckUnit && state.autoPlayers?.[stuckUnit.player]) {
                            stuckUnit.ap = 0;
                            endUnitIfDone(stuckUnit); // calls maybeAdvanceTurn internally
                        } else {
                            maybeTriggerComputerTurn();
                        }
                    } else {
                        maybeTriggerComputerTurn();
                    }
                }
            }, 3000);
            // Cancel any previous runComputerTurn timer to prevent stale double-fires
            if (state._runComputerTurnTimer) clearTimeout(state._runComputerTurnTimer);
            const _rctGen = _blitzTurnGen;
            state._runComputerTurnTimer = setTimeout(() => {
                state._runComputerTurnTimer = null;
                // Gen guard: bail if turn already advanced since this was scheduled
                if (_blitzTurnGen !== _rctGen) { state.aiThinking = false; return; }
                runComputerTurn();
            }, state.devAutoSim ? scaleDevSimDelay(35, 8) : 350);
        }


        // ═══════════════════════════════════════════════════════
        // AI DECISION LOGIC — loaded from ai.js
        // ═══════════════════════════════════════════════════════

        // ═══════════════════════════════════════════════════════════════
        // AI TRAINING SYSTEM — Adaptive Weight Tuning via Match Stats
        // ═══════════════════════════════════════════════════════════════
        // Weights are versioned so they survive code updates. Only weights
        // whose decision semantics fundamentally change need a version bump.
        // The system uses a multi-armed bandit approach: track which weight
        // ranges correlate with wins, nudge toward better values gently.

        const AI_WEIGHT_SCHEMA_VERSION = 4;

        const AI_WEIGHT_DEFAULTS = {
            // ── Healing thresholds ──  (gen22 trained values — 113 matches, 53% champion WR)
            healPotionHpPct_v1:       { value: 0.421, min: 0.20, max: 0.70, label: 'Heal Potion HP%', desc: 'Use heal potion when HP below this %' },
            // ── Combat scoring ──
            killBonusScore_v1:        { value: 23.19, min: 10,   max: 50,   label: 'Kill Bonus', desc: 'Score bonus for attacks that would kill' },
            markedTargetBonus_v1:     { value: 5.153, min: 2,    max: 15,   label: 'Marked Target Bonus', desc: 'Score bonus for attacking marked targets' },
            hourglassTargetBonus_v1:  { value: 30,    min: 10,   max: 50,   label: 'HG Carrier Bonus', desc: 'Score bonus for attacking hourglass carriers' },
            comboSynergyBonus_v1:     { value: 6.525, min: 4,    max: 25,   label: 'Combo Synergy Bonus', desc: 'Score bonus when combo has type synergy' },
            comboKillBonus_v1:        { value: 27.261, min: 10,  max: 50,   label: 'Combo Kill Bonus', desc: 'Score bonus for combos that would kill' },
            statusEffectBonus_v1:     { value: 13.574, min: 2,   max: 20,   label: 'Status Effect Bonus', desc: 'Score bonus for spells/combos with status effects' },
            // ── Tactical thresholds ──
            engageAdvantage_v1:       { value: -0.123, min: -0.5, max: 0.3,  label: 'Engage Threshold', desc: 'Min advantage score to engage enemies' },
            hgCarrierFleeAdv_v1:      { value: -0.025, min: -0.3, max: 0.4,  label: 'HG Carrier Flee Threshold', desc: 'Advantage below which HG carriers retreat' },
            // ── Floor transition weights ──
            typeAffinityBonus_v1:     { value: 18.432, min: 6,   max: 35,   label: 'Type Affinity Floor Bonus', desc: 'Score for going to type-matched floor' },
            typeAntiAffinityPen_v1:   { value: -7.481, min: -25, max: -3,   label: 'Type Anti-Affinity Penalty', desc: 'Penalty for going to type-opposed floor' },
            flankUndefendedBonus_v1:  { value: 18.435, min: 3,   max: 25,   label: 'Flank Undefended Bonus', desc: 'Score for moving to floor with undefended enemies' },
            towerThreatPenalty_v1:    { value: -8,     min: -25, max: -3,   label: 'Tower Threat Penalty', desc: 'Penalty for leaving ground when tower threatened' },
            groundPresenceMin_v1:    { value: -5,     min: -20, max: -2,   label: 'Ground Min Presence Penalty', desc: 'Penalty for leaving ground with ≤2 allies' },
            // ── Safe movement weights ──
            safeEnemyDistWeight_v1:   { value: 11.579, min: 3,   max: 18,   label: 'Safe Move: Enemy Distance Weight', desc: 'How much to value distance from enemies when retreating' },
            safeAllyProximity_v1:     { value: 5.271, min: 1,    max: 15,   label: 'Safe Move: Ally Proximity Bonus', desc: 'Bonus for staying near allies when retreating' },
            // ── Tower siege ──
            towerLowHpPush_v1:       { value: 60,    min: 25,  max: 90,   label: 'Tower Low HP Push', desc: 'Score bonus when enemy tower is nearly destroyed' },
            towerMidHpPush_v1:       { value: 30,    min: 10,   max: 55,   label: 'Tower Mid HP Push', desc: 'Score bonus when enemy tower is at half HP' },
            // ── Tower siege (base) ──
            towerBaseBonus_v1:       { value: 35,    min: 10,   max: 60,   label: 'Tower Base Bonus', desc: 'Base score bonus for attacking enemy tower (primary win condition)' },
            towerClearBonus_v1:      { value: 59.047, min: 20,  max: 80,   label: 'Tower Clear Bonus', desc: 'Score bonus for tower attack when no enemies on ground' },
            // ── Level / XP awareness ──
            levelAggressionMod_v1:   { value: 0.028, min: 0.0,  max: 0.15, label: 'Level Aggression Mod', desc: 'Per-level aggression bonus (higher level = more aggressive)' },
            nearLevelUpBonus_v1:     { value: 8.57,  min: 0,    max: 20,   label: 'Near Level-Up Bonus', desc: 'Score bonus for combat actions when unit is close to leveling up' },
            // ── Exploration ──
            earlyExploreBonus_v1:    { value: 12,    min: 0,    max: 20,   label: 'Early Explore Bonus', desc: 'Bonus for exploring alt floors in first 4 rounds' },
            antiOscillationPen_v1:   { value: -5.942, min: -15, max: -1,   label: 'Anti-Oscillation Penalty', desc: 'Penalty for revisiting recent tiles' },
            // ── Hourglass hunting ──
            hgSeekPriority_v1:       { value: 8,     min: 0,    max: 25,   label: 'HG Seek Priority', desc: 'How aggressively AI hunts hidden hourglasses (higher = earlier inspect/move to center)' },
            // ── Nexus & economy ──
            nexusCapBonus_v1:        { value: 32,    min: 10,   max: 50,   label: 'Nexus Capture Bonus', desc: 'Score for traveling to cap unowned nexus on other floors (breaks tower shields)' },
            shopRouteBonus_v1:       { value: 12,    min: 0,    max: 25,   label: 'Shop Route Bonus', desc: 'Score for routing to shop when carrying gold for banes' },
            scannerPriority_v1:      { value: 18,    min: 5,    max: 35,   label: 'Scanner Priority', desc: 'Base score for using scanner item to reveal hourglasses' },
            bossTargetBonus_v1:      { value: 15,    min: 0,    max: 30,   label: 'Boss Target Bonus', desc: 'Base score bonus for targeting boss monsters' },
        };

        // ── Runtime weight storage ──
        let _aiTrainedWeights = null; // loaded from persistent storage — P1's "best known" weights
        let _aiP2ChallengerWeights = null; // P2's jittered variant for training contrast
        let _aiTrainingStats = null;  // match statistics
        let _aiTrainingMode = false;  // whether training mode is active
        let _aiTrainingBatchSize = 5; // matches per learning batch

        function getAIWeight(key, player) {
            // In training mode, P2 uses challenger weights for contrast
            const p = player || state.activePlayer || 1;
            if (_aiTrainingMode && p === 2 && _aiP2ChallengerWeights && _aiP2ChallengerWeights[key] != null) {
                return _aiP2ChallengerWeights[key];
            }
            if (_aiTrainedWeights && _aiTrainedWeights[key] != null) return _aiTrainedWeights[key];
            const def = AI_WEIGHT_DEFAULTS[key];
            return def ? def.value : 0;
        }

        // Generate a jittered copy of current weights for P2 challenger
        function _generateChallengerWeights() {
            _aiP2ChallengerWeights = {};

            // Adaptive jitter: if champion has been dominating, increase exploration range
            const recentHistory = (_aiTrainingStats?.weightHistory || []).slice(-5);
            const recentWinRates = recentHistory.map(h => h.winRate || 0.5);
            const avgWR = recentWinRates.length > 0
                ? recentWinRates.reduce((a, b) => a + b, 0) / recentWinRates.length
                : 0.5;

            // Aggressive jitter: explore the weight space faster
            const dominance = Math.abs(avgWR - 0.5) * 2; // 0 = balanced, 1 = total dominance
            const baseJitter = 0.25;  // ±12.5% of range at baseline (was 8%)
            const maxJitter = 0.50;   // ±25% at max dominance (was 25%)
            const jitterPct = baseJitter + dominance * (maxJitter - baseJitter);

            // 25% chance of wild exploration (was 10%) — try completely random weights
            const wildExploration = Math.random() < 0.25;

            for (const key of Object.keys(AI_WEIGHT_DEFAULTS)) {
                const def = AI_WEIGHT_DEFAULTS[key];
                const range = def.max - def.min;
                if (wildExploration) {
                    // Random point in valid range
                    _aiP2ChallengerWeights[key] = Math.round((def.min + Math.random() * range) * 1000) / 1000;
                } else {
                    const base = (_aiTrainedWeights && _aiTrainedWeights[key] != null) ? _aiTrainedWeights[key] : def.value;
                    const jitter = (Math.random() - 0.5) * range * jitterPct;
                    _aiP2ChallengerWeights[key] = Math.round(Math.max(def.min, Math.min(def.max, base + jitter)) * 1000) / 1000;
                }
            }
        }

        // ── Persistent storage helpers (localStorage fallback for standalone HTML) ──
        async function _aiStorageGet(key) {
            try {
                if (typeof window.storage !== 'undefined' && window.storage?.get) {
                    const result = await window.storage.get(key);
                    if (result && result.value) return result.value;
                }
            } catch (e) { /* fall through to localStorage */ }
            try {
                const val = localStorage.getItem(key);
                if (val) return val;
            } catch (e) { /* localStorage unavailable */ }
            return null;
        }

        async function _aiStorageSet(key, value) {
            try {
                if (typeof window.storage !== 'undefined' && window.storage?.set) {
                    await window.storage.set(key, value);
                }
            } catch (e) { /* fall through */ }
            try {
                localStorage.setItem(key, value);
            } catch (e) { /* localStorage unavailable */ }
        }

        async function loadAIWeights() {
            try {
                const raw = await _aiStorageGet('ai-weights-v' + AI_WEIGHT_SCHEMA_VERSION);
                if (raw) _aiTrainedWeights = JSON.parse(raw);
            } catch (e) {
                _aiTrainedWeights = null;
            }
            try {
                const statsRaw = await _aiStorageGet('ai-training-stats-v' + AI_WEIGHT_SCHEMA_VERSION);
                if (statsRaw) _aiTrainingStats = JSON.parse(statsRaw);
            } catch (e) {
                _aiTrainingStats = null;
            }
            // Always ensure stats object exists
            if (!_aiTrainingStats) {
                _aiTrainingStats = {
                    totalMatches: 0,
                    p1Wins: 0,
                    p2Wins: 0,
                    noContests: 0,
                    batchMatches: 0,
                    batchP1Wins: 0,
                    batchWeightSnapshots: [],
                    weightHistory: [],
                    generation: 0,
                };
            }
            // Ensure noContests field exists for older saved data
            if (_aiTrainingStats.noContests == null) _aiTrainingStats.noContests = 0;
        }

        async function saveAIWeights() {
            try {
                if (_aiTrainedWeights) {
                    await _aiStorageSet('ai-weights-v' + AI_WEIGHT_SCHEMA_VERSION, JSON.stringify(_aiTrainedWeights));
                }
                if (_aiTrainingStats) {
                    await _aiStorageSet('ai-training-stats-v' + AI_WEIGHT_SCHEMA_VERSION, JSON.stringify(_aiTrainingStats));
                }
            } catch (e) {
            }
        }

        async function resetAIWeights() {
            _aiTrainedWeights = {};
            for (const key of Object.keys(AI_WEIGHT_DEFAULTS)) {
                _aiTrainedWeights[key] = AI_WEIGHT_DEFAULTS[key].value;
            }
            _aiTrainingStats = {
                totalMatches: 0, p1Wins: 0, p2Wins: 0, noContests: 0,
                batchMatches: 0, batchP1Wins: 0,
                batchWeightSnapshots: [],
                weightHistory: [],
                generation: 0,
            };
            await saveAIWeights();
        }

        // ── Record match result for training ──
        function recordTrainingMatch(winnerPlayer) {
            // Initialize stats if somehow null
            if (!_aiTrainingStats) {
                _aiTrainingStats = {
                    totalMatches: 0, p1Wins: 0, p2Wins: 0, noContests: 0,
                    batchMatches: 0, batchP1Wins: 0,
                    batchWeightSnapshots: [], weightHistory: [], generation: 0,
                };
            }
            if (!_aiTrainingMode) return;

            // No-contest: track but don't use for training
            if (winnerPlayer === 0 || winnerPlayer === null) {
                _aiTrainingStats.noContests = (_aiTrainingStats.noContests || 0) + 1;
                _aiTrainingStats.totalMatches++;
                saveAIWeights();
                return;
            }

            _aiTrainingStats.totalMatches++;
            _aiTrainingStats.batchMatches++;
            if (winnerPlayer === 1) { _aiTrainingStats.p1Wins++; _aiTrainingStats.batchP1Wins++; }
            else { _aiTrainingStats.p2Wins++; }

            // Snapshot the WINNING player's weights — this is the weight set that produced the win.
            // P1 uses base weights, P2 uses challenger weights. By recording the winner's actual
            // weights, the learning algorithm can compare what works vs what doesn't.
            const snapshot = {};
            for (const key of Object.keys(AI_WEIGHT_DEFAULTS)) {
                snapshot[key] = getAIWeight(key, winnerPlayer);
            }
            snapshot._winner = winnerPlayer;
            // Also record the loser's weights for contrast
            const loserPlayer = winnerPlayer === 1 ? 2 : 1;
            snapshot._loserWeights = {};
            for (const key of Object.keys(AI_WEIGHT_DEFAULTS)) {
                snapshot._loserWeights[key] = getAIWeight(key, loserPlayer);
            }
            _aiTrainingStats.batchWeightSnapshots.push(snapshot);

            // ── BATCH LEARNING: after enough matches, adjust weights ──
            if (_aiTrainingStats.batchMatches >= _aiTrainingBatchSize) {
                performWeightAdjustment();
            }

            saveAIWeights();
        }

        // ── Core learning algorithm ──
        // For each weight, compare the value used by winning players vs losing players.
        // P1 uses "best known" weights, P2 uses a jittered challenger variant.
        // If the winner's weight tends to be higher than the loser's, nudge the base up.
        function performWeightAdjustment() {
            if (!_aiTrainingStats || _aiTrainingStats.batchWeightSnapshots.length < 4) return;

            const snapshots = _aiTrainingStats.batchWeightSnapshots;

            if (!_aiTrainedWeights) {
                _aiTrainedWeights = {};
                for (const key of Object.keys(AI_WEIGHT_DEFAULTS)) {
                    _aiTrainedWeights[key] = AI_WEIGHT_DEFAULTS[key].value;
                }
            }

            const learningRate = 0.15; // 15% adjustment per batch (aggressive for faster convergence)
            const adjustments = {};

            for (const key of Object.keys(AI_WEIGHT_DEFAULTS)) {
                const def = AI_WEIGHT_DEFAULTS[key];
                // Collect winning weight and losing weight for each match
                let winSum = 0, loseSum = 0, count = 0;
                for (const snap of snapshots) {
                    const winVal = snap[key] ?? def.value;
                    const loseVal = snap._loserWeights?.[key] ?? def.value;
                    winSum += winVal;
                    loseSum += loseVal;
                    count++;
                }
                if (count < 2) continue;

                const winAvg = winSum / count;
                const loseAvg = loseSum / count;
                const diff = winAvg - loseAvg;
                const range = def.max - def.min;

                // Only adjust if the difference is meaningful relative to the range
                if (Math.abs(diff) < range * 0.005) continue;

                // Nudge toward the winning average
                const nudge = diff * learningRate;
                const current = _aiTrainedWeights[key] ?? def.value;
                const newVal = Math.max(def.min, Math.min(def.max, current + nudge));

                _aiTrainedWeights[key] = Math.round(newVal * 1000) / 1000; // round to 3dp
                adjustments[key] = { from: current, to: _aiTrainedWeights[key], diff: nudge };
            }

            // Record this generation's adjustments
            const p1Wins = snapshots.filter(s => s._winner === 1).length;
            const p2Wins = snapshots.length - p1Wins;
            const p1WinRate = p1Wins / snapshots.length;
            _aiTrainingStats.weightHistory.push({
                generation: _aiTrainingStats.generation,
                matches: _aiTrainingStats.batchMatches,
                winRate: p1WinRate,
                adjustments,
                timestamp: Date.now()
            });
            // Keep only last 50 generations of history
            if (_aiTrainingStats.weightHistory.length > 50) {
                _aiTrainingStats.weightHistory = _aiTrainingStats.weightHistory.slice(-50);
            }

            // If P2 (challenger) won decisively (70%+), adopt challenger weights as the new base.
            // This allows breakthrough discoveries from wild exploration to be captured.
            if (p1WinRate < 0.30 && _aiP2ChallengerWeights) {
                for (const key of Object.keys(AI_WEIGHT_DEFAULTS)) {
                    if (_aiP2ChallengerWeights[key] != null) {
                        _aiTrainedWeights[key] = _aiP2ChallengerWeights[key];
                    }
                }
                addLog(`🧠 AI Training Gen ${_aiTrainingStats.generation + 1}: Challenger DOMINATED (${Math.round(p2Wins/snapshots.length*100)}% win rate) — adopting challenger weights as new champion.`);
            }

            // Reset batch
            _aiTrainingStats.batchMatches = 0;
            _aiTrainingStats.batchP1Wins = 0;
            _aiTrainingStats.batchWeightSnapshots = [];
            _aiTrainingStats.generation++;

            // Generate fresh challenger weights for P2 based on updated P1 weights
            _generateChallengerWeights();

            const adjCount = Object.keys(adjustments).length;
            if (adjCount > 0) {
                addLog(`🧠 AI Training Gen ${_aiTrainingStats.generation}: adjusted ${adjCount} weights after ${snapshots.length} matches (P1 win rate: ${Math.round(p1Wins/snapshots.length*100)}%).`);
            }

            saveAIWeights();
        }

        // ── Exploration jitter: slightly randomize P2's weights each generation ──
        // This ensures the AI doesn't settle on a local optimum.
        // P1 uses the "best known" weights; P2 uses a slightly randomized variant.
        // Whoever wins more influences the next generation.
        // ── Render training dashboard ──
        function renderTrainingDashboard() {
            const panel = document.getElementById('trainingPanel');
            if (!panel) return;
            const stats = _aiTrainingStats || {};
            const champW = _aiTrainedWeights || {};
            const challW = _aiP2ChallengerWeights || {};
            const gen = stats.generation || 0;
            const totalM = stats.totalMatches || 0;
            const nc = stats.noContests || 0;
            const decisiveM = (stats.p1Wins || 0) + (stats.p2Wins || 0);
            const champWins = stats.p1Wins || 0;
            const challWins = stats.p2Wins || 0;
            const champWR = decisiveM > 0 ? Math.round(champWins / decisiveM * 100) : 50;
            const batchProg = stats.batchMatches || 0;

            // Current batch progress
            const batchSnaps = stats.batchWeightSnapshots || [];
            const batchChampW = batchSnaps.filter(s => s._winner === 1).length;
            const batchChallW = batchSnaps.length - batchChampW;

            // Convergence sparkline: last 10 generations' champion win rates
            const history = stats.weightHistory || [];
            const sparkData = history.slice(-15).map(h => h.winRate || 0.5);
            let sparkHtml = '';
            if (sparkData.length >= 2) {
                const w = 140, h = 28, pad = 2;
                const pts = sparkData.map((v, i) => {
                    const x = pad + (i / (sparkData.length - 1)) * (w - pad * 2);
                    const y = pad + (1 - v) * (h - pad * 2);
                    return `${x},${y}`;
                }).join(' ');
                const midY = pad + 0.5 * (h - pad * 2);
                sparkHtml = `<svg width="${w}" height="${h}" style="display:block;margin:0 auto">
                    <line x1="${pad}" y1="${midY}" x2="${w-pad}" y2="${midY}" stroke="rgba(200,180,150,0.12)" stroke-width="1" stroke-dasharray="2,2"/>
                    <polyline points="${pts}" fill="none" stroke="rgba(100,160,255,0.7)" stroke-width="1.5" stroke-linejoin="round"/>
                </svg>`;
            }

            // Jitter info
            const recentWR = history.slice(-5).map(h => h.winRate || 0.5);
            const avgWR = recentWR.length > 0 ? recentWR.reduce((a, b) => a + b, 0) / recentWR.length : 0.5;
            const dominance = Math.abs(avgWR - 0.5) * 2;
            const jitterPct = Math.round((0.25 + dominance * (0.50 - 0.25)) * 100);
            const isWild = jitterPct > 40;

            // Changed weights: only show weights that differ from defaults
            const changedWeights = [];
            for (const key of Object.keys(AI_WEIGHT_DEFAULTS)) {
                const def = AI_WEIGHT_DEFAULTS[key];
                const cv = champW[key] ?? def.value;
                const chv = challW[key] ?? def.value;
                const moved = Math.abs(cv - def.value) > 0.005;
                const diff = chv - cv;
                if (moved || Math.abs(diff) > def.max * 0.01) {
                    changedWeights.push({ key, def, cv, chv, diff, moved });
                }
            }

            // Batch bar visualization
            let batchBarHtml = '';
            if (batchSnaps.length > 0) {
                const dots = batchSnaps.map(s =>
                    `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s._winner === 1 ? 'rgba(100,160,255,0.8)' : 'rgba(255,120,100,0.8)'};margin:0 1px"></span>`
                ).join('');
                const remaining = _aiTrainingBatchSize - batchSnaps.length;
                const emptyDots = Array(remaining).fill(
                    '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:rgba(200,180,150,0.1);margin:0 1px"></span>'
                ).join('');
                batchBarHtml = `<div style="text-align:center;margin:4px 0">${dots}${emptyDots}</div>`;
            }

            // Generation history — compact
            const histHtml = history.slice(-8).reverse().map(h => {
                const wr = Math.round(h.winRate * 100);
                const adj = Object.keys(h.adjustments).length;
                const adopted = h.winRate < 0.30;
                const wrColor = wr > 60 ? 'rgba(100,160,255,0.9)' : wr < 40 ? 'rgba(255,120,100,0.9)' : 'var(--muted)';
                const tag = adopted ? ' <span style="color:var(--gold);font-size:9px">★ NEW CHAMP</span>' : '';
                return `<div class="train-history-row">
                    <span style="color:var(--muted)">Gen ${h.generation}</span>
                    <span style="color:${wrColor};font-weight:700;min-width:32px;text-align:right">${wr}%</span>
                    <span style="color:var(--muted)">${adj} tuned</span>${tag}
                </div>`;
            }).join('');

            // Weight rows (only changed ones)
            const fmtVal = (v) => typeof v === 'number' && Math.abs(v) < 1 ? v.toFixed(2) : Math.round(v);
            let weightRowsHtml = '';
            if (changedWeights.length > 0) {
                weightRowsHtml = changedWeights.map(w => {
                    const range = w.def.max - w.def.min;
                    const cpct = ((w.cv - w.def.min) / range) * 100;
                    const chpct = ((w.chv - w.def.min) / range) * 100;
                    const diffIcon = Math.abs(w.diff) < range * 0.01 ? '' : w.diff > 0 ? '↑' : '↓';
                    return `<div class="train-weight-row" title="${w.def.desc}\nChamp: ${w.cv}  Chall: ${w.chv}  Default: ${w.def.value}">
                        <span class="train-weight-label">${w.def.label}</span>
                        <span class="train-weight-val p1">${fmtVal(w.cv)}</span>
                        <div class="train-weight-bar-wrap"><div class="train-weight-bar p1" style="width:${cpct}%"></div></div>
                        <span class="train-weight-vs">${diffIcon}</span>
                        <div class="train-weight-bar-wrap"><div class="train-weight-bar p2" style="width:${chpct}%"></div></div>
                        <span class="train-weight-val p2">${fmtVal(w.chv)}</span>
                    </div>`;
                }).join('');
            } else {
                weightRowsHtml = '<div style="text-align:center;color:var(--muted);font-size:10px;padding:8px">All weights at defaults — no changes yet</div>';
            }

            panel.innerHTML = `
                <div class="train-header">🧠 AI Training</div>

                <div style="font-size:10px;color:var(--muted);text-align:center;margin-bottom:10px;line-height:1.4">
                    The <b style="color:rgba(100,160,255,0.9)">Champion</b> fights the <b style="color:rgba(255,120,100,0.9)">Challenger</b> (randomized variant).<br>
                    If the challenger dominates, its weights become the new champion.
                </div>

                <div class="train-stats">
                    <div class="train-stat">
                        <span class="train-stat-label">Generation</span>
                        <span class="train-stat-val">${gen}</span>
                    </div>
                    <div class="train-stat">
                        <span class="train-stat-label">Champion WR</span>
                        <span class="train-stat-val" style="color:${champWR > 60 ? 'rgba(100,160,255,0.9)' : champWR < 40 ? 'rgba(255,120,100,0.9)' : 'var(--text)'}">${champWR}%</span>
                    </div>
                </div>

                ${sparkData.length >= 2 ? `
                <div style="margin:6px 0 10px">
                    <div style="font-size:9px;color:var(--muted);text-align:center;margin-bottom:4px">CHAMPION WIN RATE OVER TIME <span style="font-size:8px">(50% line = balanced)</span></div>
                    ${sparkHtml}
                </div>` : ''}

                <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:var(--muted);font-weight:700;margin:8px 0 4px">Current Batch</div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:rgba(200,180,150,0.04);border-radius:8px;font-size:11px">
                    <span><b style="color:rgba(100,160,255,0.9)">${batchChampW}</b> <span style="color:var(--muted)">champ</span></span>
                    <span style="color:var(--muted);font-size:10px">${batchProg} / ${_aiTrainingBatchSize}</span>
                    <span><b style="color:rgba(255,120,100,0.9)">${batchChallW}</b> <span style="color:var(--muted)">chall</span></span>
                </div>
                ${batchBarHtml}

                <div class="train-meta">
                    <div class="train-meta-item">Matches: <span class="train-meta-val">${totalM}</span></div>
                    <div class="train-meta-item">Jitter: <span class="train-meta-val" style="${isWild ? 'color:var(--gold)' : ''}">±${jitterPct}%</span></div>
                    <div class="train-meta-item">No Contest: <span class="train-meta-val">${nc}</span></div>
                </div>

                ${histHtml ? `
                <div class="train-section-label">Generation History</div>
                <div class="train-history">${histHtml}</div>` : ''}

                <div class="train-section-label">Weight Changes <span style="font-weight:400;text-transform:none;letter-spacing:0">(${changedWeights.length} / ${Object.keys(AI_WEIGHT_DEFAULTS).length} modified)</span></div>
                <div class="train-weight-header">
                    <span class="h-label">Weight</span>
                    <span class="h-p1">♔</span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span class="h-p2">♟</span>
                </div>
                <div class="train-weights">${weightRowsHtml}</div>

                <div class="train-actions">
                    <button onclick="resetAIWeights().then(() => { _generateChallengerWeights(); renderTrainingDashboard(); addLog('AI weights reset to defaults.'); })">Reset</button>
                    <button onclick="_generateChallengerWeights(); renderTrainingDashboard(); addLog('New challenger generated.');">New Challenger</button>
                    <button onclick="_exportTrainedWeights()">Export</button>
                </div>
            `;
        }

        // ── Hook training into match results ──
        function _exportTrainedWeights() {
            const w = _aiTrainedWeights || {};
            const stats = _aiTrainingStats || {};
            const gen = stats.generation || 0;
            const totalM = stats.totalMatches || 0;
            const champWR = (stats.p1Wins && (stats.p1Wins + stats.p2Wins) > 0)
                ? Math.round(stats.p1Wins / (stats.p1Wins + stats.p2Wins) * 100) : '?';

            const exportData = {
                _meta: {
                    game: 'Entropy Wars',
                    generation: gen,
                    totalMatches: totalM,
                    championWinRate: champWR + '%',
                    exportedAt: new Date().toISOString()
                },
                weights: {}
            };
            for (const key of Object.keys(AI_WEIGHT_DEFAULTS)) {
                const def = AI_WEIGHT_DEFAULTS[key];
                const val = w[key] ?? def.value;
                exportData.weights[key] = { value: val, default: def.value, min: def.min, max: def.max };
            }

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ew-ai-weights-gen${gen}.json`;
            a.click();
            URL.revokeObjectURL(url);
            addLog(`Exported weights to ew-ai-weights-gen${gen}.json`);
        }

        // Load weights on startup
        loadAIWeights();


        function finishComputerAction() {
            // ── STALE CALLBACK GUARD: if the turn generation has changed since
            //    this AI action started, endUnitIfDone already called maybeAdvanceTurn
            //    and the next unit is active — bail to prevent double-advancing. ──
            if (_aiActionGen !== _blitzTurnGen) {
                return;
            }
            state.aiThinking = false;
            state.actionMode = null;
            state.actionMenuView = 'root';
            state.comboPartner = null;
            state.selectedTool = null;
            state.pendingTarget = null;
            clearAiSafetyTimer();
            if (state.winner) return;
            // If _blitzActiveUnitId is already null, maybeAdvanceTurn was called elsewhere (e.g. endUnitIfDone)
            if (!state._blitzActiveUnitId) return;

            // ── Wait for active cinematic/death animations before continuing ──
            // This prevents the next action from spawning a new cinematic over
            // a still-playing one (double intro flash).
            const savedGen = _blitzTurnGen;
            _waitForAnimationsThen(() => {
                // Re-check guards after the wait
                if (savedGen !== _blitzTurnGen) return;
                if (state.winner) return;
                if (!state._blitzActiveUnitId) return;
                const curUnit = state.units.find(u => u.id === state._blitzActiveUnitId);
                if (curUnit && !curUnit.dead && !unitFinished(curUnit)) {
                    // Unit still alive with AP — continue its turn
                    maybeTriggerComputerTurn();
                } else {
                    maybeAdvanceTurn();
                }
            });
        }

        function queueComputerAction(actionFn, target = null, delay = 150) {
            const safeAction = () => {
                try {
                    actionFn();
                } catch (err) {
                    console.error('AI action threw error:', err);
                    state.actionMode = null;
                    state.comboPartner = null;
                    state.selectedTool = null;
                    state.aiThinking = false;
                    clearAiSafetyTimer();
                    maybeTriggerComputerTurn();
                }
            };
            if (target?.id) {
                focusUnitPanel(target.id);
                markDirty('board', 'selectedUnit', 'hud');
                renderIfDirty();
                // ── AI TELEGRAPH: briefly highlight target tile before executing ──
                const isDevSim = state.devAutoSim;
                const telegraphMs = isDevSim ? 0 : 220;
                const actionDelay = isDevSim ? scaleDevSimDelay(delay, 12) : delay;
                if (!isDevSim && target.x !== undefined && target.y !== undefined && boardEl) {
                    const tIdx = target.y * bw() + target.x;
                    const tileEl = boardEl.children[tIdx];
                    if (tileEl) {
                        tileEl.classList.add('ai-telegraph');
                        window.setTimeout(() => tileEl.classList.remove('ai-telegraph'), 450);
                    }
                }
                window.setTimeout(safeAction, telegraphMs + actionDelay);
            } else {
                safeAction();
            }
        }


        function runComputerTurn() {
            if (state.phase !== 'battle' || state.winner) {
                state.aiThinking = false;
                clearAiSafetyTimer();
                return;
            }
            const unit = state._blitzActiveUnitId
                ? state.units.find(u => u.id === state._blitzActiveUnitId && !u.dead && (u.ap || 0) > 0)
                : null;
            if (!unit) {
                // No valid AI unit — either turn already advanced or unit is dead.
                state.aiThinking = false;
                clearAiSafetyTimer();
                // Safety net: if the blitz-active unit exists but is dead or out of AP,
                // endUnitIfDone may have failed to advance.  Force-advance here.
                if (state._blitzActiveUnitId) {
                    const stuck = state.units.find(u => u.id === state._blitzActiveUnitId);
                    if (stuck && (stuck.dead || unitFinished(stuck))) {
                        maybeAdvanceTurn();
                    }
                }
                return;
            }
            // ── BLITZ GUARD: never run AI logic on a human-controlled unit ──
            if (!state.autoPlayers?.[unit.player]) {
                state.aiThinking = false;
                clearAiSafetyTimer();
                return;
            }
            _aiActionGen = _blitzTurnGen;
            // Switch board to this unit's floor so terrain lookups are correct
            // unitFloor removed - unified map
            if (false) { // floor switch removed
                // switchToFloor removed
            }
            // Delegate to ai.js
            if (typeof window.aiTakeTurn === 'function') {
                try {
                    window.aiTakeTurn(unit);
                } catch (err) {
                    console.error('AI error:', err);
                    unit.ap = 0;
                    state.actionMode = null;
                    state.comboPartner = null;
                    state.selectedTool = null;
                    finishComputerAction();
                }
            } else {
                unit.ap = 0;
                finishComputerAction();
            }
        }

        // ═══════════════════════════════════════════════════════
        // GAME API — exposed to ai.js via window.GAME
        // ═══════════════════════════════════════════════════════
        window.GAME = {
            // ── State access ──
            get state() { return state; },
            get devAutoSim() { return state.devAutoSim; },
            // ── Board geometry ──
            bw, bh, posKey, isInside,
            // ── Unit queries ──
            aliveUnitsFor, aliveUnitsOnFloor, enemyOf, unitDisplayName,
            getHostileUnits, isBossUnit, getBossOccupiedTiles,
            unitAt, canFly, canFlyToSky, canDescendUnderground, canReturnToGround,
            unitHasJetpack, unitHasSpelunkingGear,
            SKY_RACES, UNDERGROUND_RACES, unitFinished,
            getEffectiveRange, getEffectiveMove, getEffectiveAwr,
            getEffectiveAttackBonus, getHourglassPower,
            getUnitLevel, getXPProgressPct,
            // ── Action checks ──
            canUnitAct, canUnitMove,
            canAffordSpell, getSpellApCost,
            getMoveTiles, getAttackTiles, getInspectTiles,
            isRangeBlockedByTerrain,
            unitHasStatus, unitHasFlair, unitHasWard,
            unitHasTelescope, getTelescopeSkyTargets,
            // ── Terrain ──
            getTerrainAt, getTerrainRule, getEntranceAt,
            getSectionForRow, getSectionForUnit, getSectionForTile, isBarrierRow,
            unitCanTraverse,
            // ── Vision (fog-aware) ──
            computeVisibleTiles, isInVision, scanKey,
            // ── Combo system ──
            getComboPartners, getComboForUnits, getComboTypeSynergy,
            // ── Action execution ──
            doMove, doAttack, doSpell, doItem, doInspect,
            doComboAttack, doDetonate,
            get doFlair() { return doFlair; },
            get doWard() { return doWard; },
            get doGuard() { return doGuard; },
            transitionUnitToFloor, switchToFloor,
            get channelNexus() { return channelNexus; },
            get useChurch() { return useChurch; },
            get getNexusAtUnit() { return getNexusAtUnit; },
            get isInNexusZone() { return isInNexusZone; },
            get shopBuyItem() { return shopBuyItem; },
            // ── State manipulation ──
            spendAP, get pushUndoSnapshot() { return pushUndoSnapshot; }, addLog,
            showFloatingTextForUnit,
            // ── UI / flow ──
            finishComputerAction, queueComputerAction,
            focusUnitPanel, get scheduleBoardRender() { return scheduleBoardRender; },
            focusBoardCameraOnTiles, actionMs, scaleDevSimDelay,
            markDirty, renderIfDirty,
            maybeTriggerComputerTurn, maybeAdvanceTurn,
            // ── AI weights ──
            getAIWeight,
            // ── Constants ──
            get AP_COST_ACTION() { return AP_COST_ACTION; },
            get AP_COST_SPELL() { return AP_COST_SPELL; },
            get COMBO_AP_COST_INITIATOR() { return COMBO_AP_COST_INITIATOR; },
            get COMBO_AP_COST_PARTNER() { return COMBO_AP_COST_PARTNER; },
            get UNIT_MAX_MOVES() { return UNIT_MAX_MOVES; },
            get XP_MAX_LEVEL() { return XP_MAX_LEVEL; },
            get SPELL_SLOT_MAX() { return typeof SPELL_SLOT_MAX !== 'undefined' ? SPELL_SLOT_MAX : 6; },
            get CLASS_SPELL_LEARN_ORDER() { return typeof CLASS_SPELL_LEARN_ORDER !== 'undefined' ? CLASS_SPELL_LEARN_ORDER : {}; },
            get SPELL_SHOP_PRICES() { return typeof SPELL_SHOP_PRICES !== 'undefined' ? SPELL_SHOP_PRICES : {}; },
            learnSpellForUnit,
            applySecondaryJob,
            aiPickSecondaryJob,
            get getShopSpellsForUnit() { return getShopSpellsForUnit; },
            get shopBuySpell() { return shopBuySpell; },
            get STATUS_DEFS() { return STATUS_DEFS; },
            get TERRAIN_RULES() { return TERRAIN_RULES; },
            get ITEM_RULES() { return ITEM_RULES; },
        };

        function endUnitIfDone(unit) {
            if (!unit) return;
            // A unit's turn is over if AP is exhausted OR if they died
            // (e.g. killed by a counter-attack during their own action).
            if (!unitFinished(unit) && !unit.dead) return;
            // ── Exhaustion pop animation (only for living units) ──
            if (boardEl && !state.devAutoSim) {
                const tIdx = unit.y * bw() + unit.x;
                const tileEl = _boardGrid?.tiles?.[tIdx];
                if (tileEl) {
                    const unitEl = tileEl.querySelector('.unit');
                    if (unitEl) {
                        unitEl.classList.add('just-exhausted');
                        window.setTimeout(() => unitEl.classList.remove('just-exhausted'), 450);
                    }
                }
            }
            state.actionMode = null;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            state.pendingTarget = null;
            // Wait for any active death animations before advancing turn
            _waitForAnimationsThen(() => maybeAdvanceTurn());
        }

        function selectUnit(unitId) {
            const unit = state.units.find(u => u.id === unitId && !u.dead);
            if (!unit || state.phase !== 'battle') return;
            // ── BLITZ: only the designated active unit can be selected/controlled ──
            if (state._blitzActiveUnitId && unitId !== state._blitzActiveUnitId) {
                // ── SKIP TURN: if this is a banked ally unit, swap control to it ──
                if (state._skippedUnit && state._skippedUnit.id === unitId &&
                    unit.player === state.activePlayer && unit._skippedTurn && !unit.dead) {
                    // Auto-skip the current active unit's turn
                    const currentUnit = state.units.find(u => u.id === state._blitzActiveUnitId);
                    if (currentUnit && !currentUnit.dead) {
                        currentUnit.ap = 0;
                        addLog(`${unitDisplayName(currentUnit)}'s turn is auto-skipped — ${unitDisplayName(unit)} takes over!`);
                    }
                    // Clear skip state and give control to the banked unit
                    unit._skippedTurn = false;
                    state._skippedUnit = null;
                    state._blitzActiveUnitId = unitId;
                    state.activePlayer = unit.player;
                    // Fall through to normal selection below
                } else {
                    // Allow inspecting (focus panel) but not controlling other units
                    focusUnitPanel(unitId);
                    return;
                }
            }
            // ── Squad Leader: non-leader P1 units can only be inspected, not controlled ──
            if (state.squadLeaderMode && unit.player === 1 && unitId !== state.squadLeaderUnitId) {
                focusUnitPanel(unitId);
                return;
            }
            playSfx('uiCursorMove');
            state.selectedUnitId = unitId;
            state.focusedUnitId = unitId;
            state.hoverUnitId = null;
            state.showUnitInfo = false;
            state.actionMenuView = 'root';
            state.actionMode = null;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            state.pendingTarget = null;
            state._teleportingUnit = null;
            // Auto-switch to the selected unit's floor so terrain/pathfinding is correct
            // unitFloor removed - unified map
            if (unit.player === getViewerPlayer()) state._fogAnchorUnitId = unitId;
            renderBattleSelectionUI({ includeBoard: false });
            // Force action menu render on unit select
            if (typeof renderHudActions === 'function') renderHudActions(unit);
            // Pan camera to newly selected unit at the user's zoom level
            if (!state.cameraDisabled && !state.devAutoSim) {
                const baseZoom = getUserZoomScale();
                const zoom = baseZoom > 1.05 ? baseZoom : getDefaultZoom();
                focusBoardCameraOnTiles([{ x: unit.x, y: unit.y }], {
                    zoom,
                    holdMs: 99999,
                    persist: true,
                    transitionMs: 380
                });
            }
            scheduleBoardRender();
        }

        function useRosterItemButton(unitId, itemKey) {
            const unit = unitFromId(unitId);
            if (!unit || unit.dead || state.phase !== 'battle' || state.winner) return;

            const humanTurn = !state.autoPlayers?.[state.activePlayer];
            const canControlUnit = humanTurn && unit.player === state.activePlayer && canUnitAct(unit);

            if (!canControlUnit) {
                focusUnitPanel(unitId);
                markDirty('selectedUnit', 'hud');
                renderIfDirty();
                return;
            }

            if (!canUseItemNow(unit, itemKey)) {
                const itemName = ITEM_RULES[itemKey]?.name || 'That item';
                addLog(`${itemName} cannot be used right now.`);
                playErrorSfx();
                markDirty('log', 'selectedUnit');
                renderIfDirty();
                return;
            }

            state.selectedUnitId = unitId;
            state.focusedUnitId = unitId;
            state.hoverUnitId = null;
            state.actionMode = 'item';
            state.selectedTool = itemKey;
            state.pendingTarget = null;
            playSfx('uiConfirm');
            markDirty('board', 'selectedUnit', 'hud', 'buttons');
            renderIfDirty();
        }

        function setTool(mode, toolName) {
            if (state.activePlayer === state.aiPlayer) return;
            playSfx('uiConfirm');
            const unit = getSelectedUnit();
            if (!unit) {
                addLog('Select one of your units first.');
                return;
            }
            if (!canUnitAct(unit)) {
                addLog(`${unitDisplayName(unit)} already acted this round.`);
                return;
            }
            if (mode === 'spell' && unitHasStatus(unit, 'silence')) {
                addLog(`${unitDisplayName(unit)} is silenced and cannot cast this turn.`);
                return;
            }
            state.actionMode = mode;
            state.hoverUnitId = null;
            state.selectedTool = toolName;
            state.pendingTarget = null;
            clearAoePreview();
            resetBoardCamera();

            // Determine the right sub-menu view
            if (mode === 'spell' && unit) {
                const spell = (unit.spells || []).find(s => s.name === toolName) || (unit._raceAbilities || []).find(s => s.name === toolName);
                if (spell && !isSpellTileTargeted(spell) && !isSpellSelfCast(spell)) {
                    // Unit-targeted spell → show target list
                    state.actionMenuView = 'spellTargets';
                    const targets = _getSpellValidTargets(unit, spell);
                    state._spellCycleTargets = targets;
                    state._spellCycleIndex = 0;
                    if (targets.length > 0) {
                        state.pendingTarget = { x: targets[0].x, y: targets[0].y, mode: 'spell', tool: toolName, viaHover: false };
                        updateAoePreview(targets[0].x, targets[0].y);
                    }
                } else {
                    // Tile-targeted or self-cast spell → keep existing tile-pick flow
                    state.actionMenuView = 'spells';
                    if (spell) {
                        const targets = _getSpellValidTargets(unit, spell);
                        state._spellCycleTargets = targets;
                        state._spellCycleIndex = 0;
                        if (targets.length > 0) {
                            state.pendingTarget = { x: targets[0].x, y: targets[0].y };
                            updateAoePreview(targets[0].x, targets[0].y);
                        }
                        // ── Self-cast AOE preview: show affected area centered on caster ──
                        if (isSpellSelfCast(spell)) {
                            showSelfCastAoePreview(unit, spell);
                        }
                    }
                }
            } else {
                state.actionMenuView = mode === 'item' ? 'items' : mode === 'ping' ? 'pings' : (state.actionMenuView || 'root');
            }

            renderBattleSelectionUI({
                includeBoard: false
            });
            scheduleBoardRender();
        }

        // ── Spell target cycling helpers ──
        function _getSpellValidTargets(unit, spell) {
            if (!unit || !spell) return [];
            const targets = [];
            const minRange = (['heal', 'shield', 'buff', 'scan', 'summonWeather', 'bomb', 'healAll', 'aoe', 'barrage', 'seedHeal', 'seedPoison', 'leechSeed', 'warpRune', 'teleport', 'deployTurret', 'buildBridge', 'warCry', 'encore', 'remoteView', 'selfHeal', 'escape', 'cleanse', 'aoeShield', 'zoneHeal', 'zoneDebuff', 'cross', 'delayed', 'deployObject', 'deployPair', 'terrainCreate'].includes(spell.kind)) ? 0 : 1;
            const isOffensive = !['heal', 'shield', 'buff', 'scan', 'summonWeather', 'bomb', 'healAll', 'aoe', 'seedHeal', 'seedPoison', 'leechSeed', 'warpRune', 'teleport', 'deployTurret', 'buildBridge', 'warCry', 'encore', 'cleanse', 'aoeShield', 'zoneHeal', 'selfHeal', 'escape', 'deployPair', 'terrainCreate', 'zoneDebuff', 'delayed', 'deployObject', 'cross'].includes(spell.kind);
            // curFloor removed - unified map
            for (const u of state.units) {
                if (u.dead) continue;
                
                // 2x2 boss: use closest occupied tile for distance
                let d = Math.abs(u.x - unit.x) + Math.abs(u.y - unit.y);
                if (u._isBoss && u._bossSize === 2) {
                    d = Math.min(d,
                        Math.abs(u.x + 1 - unit.x) + Math.abs(u.y - unit.y),
                        Math.abs(u.x - unit.x) + Math.abs(u.y + 1 - unit.y),
                        Math.abs(u.x + 1 - unit.x) + Math.abs(u.y + 1 - unit.y)
                    );
                }
                if (d < minRange || d > spell.range) continue;
                if (isRangeBlockedByTerrain(unit.x, unit.y, u.x, u.y)) continue;
                if (isOffensive && u.player === unit.player) continue;
                if (!isOffensive && ['heal', 'shield', 'buff', 'cleanse'].includes(spell.kind) && u.player !== unit.player) continue;
                targets.push({ x: u.x, y: u.y, dist: d, unit: u });
            }
            targets.sort((a, b) => a.dist - b.dist);
            return targets;
        }

        // ── Spell kinds that target a tile (not a unit) — these keep the old tile-pick flow ──
        const TILE_TARGETED_SPELL_KINDS = new Set([
            'bomb', 'warpRune', 'teleport', 'deployTurret', 'buildBridge',
            'summonWeather', 'seedHeal', 'seedPoison', 'leechSeed',
            'aoe', 'remoteView',
            'delayed', 'deployObject', 'deployPair', 'zoneDebuff', 'zoneHeal',
            'terrainCreate', 'aoeShield', 'cross', 'line', 'linePush', 'aoePull'
        ]);
        // Self-cast spell kinds — no target needed, execute immediately
        const SELF_CAST_SPELL_KINDS = new Set([
            'healAll', 'warCry', 'scan', 'barrage', 'encore',
            'selfHeal', 'escape'
        ]);

        function isSpellTileTargeted(spell) {
            if (!spell) return false;
            return TILE_TARGETED_SPELL_KINDS.has(spell.kind);
        }
        function isSpellSelfCast(spell) {
            if (!spell) return false;
            return SELF_CAST_SPELL_KINDS.has(spell.kind);
        }

        // ── Get valid attack targets (units, towers, turrets) for the target list menu ──
        function _getAttackValidTargets(unit) {
            if (!unit) return [];
            const targets = [];
            const effRange = getEffectiveRange(unit);
            // Enemy units
            const enemies = getHostileUnits(unit.player);
            for (const e of enemies) {
                if (state.fogOfWar && !state.autoPlayers?.[unit.player] && !isInVision(unit, e.x, e.y)) continue;
                const d = distToTarget(unit.x, unit.y, e);
                if (d >= 1 && d <= effRange && !isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y)) {
                    targets.push({ x: e.x, y: e.y, dist: d, unit: e, kind: 'unit' });
                }
            }
            // Enemy tower
            if (state.towers) {
                const tw = state.towers[enemyOf(unit.player)];
                if (tw && tw.hp > 0) {
                    const d = Math.abs(tw.x - unit.x) + Math.abs(tw.y - unit.y);
                    if (d >= 1 && d <= effRange && !isRangeBlockedByTerrain(unit.x, unit.y, tw.x, tw.y)) {
                        targets.push({ x: tw.x, y: tw.y, dist: d, tower: tw, kind: 'tower' });
                    }
                }
            }
            // Enemy turrets
            if (state.turrets) {
                for (const t of state.turrets) {
                    if (t.owner !== unit.player && t.hp > 0) {
                        const d = Math.abs(t.x - unit.x) + Math.abs(t.y - unit.y);
                        if (d >= 1 && d <= effRange && !isRangeBlockedByTerrain(unit.x, unit.y, t.x, t.y)) {
                            targets.push({ x: t.x, y: t.y, dist: d, turret: t, kind: 'turret' });
                        }
                    }
                }
            }
            targets.sort((a, b) => a.dist - b.dist);
            return targets;
        }

        // ── Select a target from the target list menu ──
        function selectTargetFromMenu(x, y) {
            const unit = getSelectedUnit();
            if (!unit) return;
            if (!canUnitAct(unit)) {
                // Unit can't act anymore — reset to root
                state.actionMode = null;
                state.actionMenuView = 'root';
                state.selectedTool = null;
                state.pendingTarget = null;
                resetBoardCamera(true);
                renderBattleSelectionUI({ includeBoard: false });
                return;
            }
            // If already pending on this target, confirm it
            if (state.pendingTarget && state.pendingTarget.x === x && state.pendingTarget.y === y) {
                // Save action state so we can restore it after dispatch
                const savedMode = state.actionMode;
                const savedView = state.actionMenuView;
                const savedTool = state.selectedTool;
                state.pendingTarget = null;
                // Dispatch the action
                if (savedMode === 'attack') { doAttack(unit, x, y); }
                else if (savedMode === 'spell') { doSpell(unit, x, y); }
                // Restore action state so target list stays open for follow-up attacks
                // (doAttack/doSpell may have cleared actionMode inside a setTimeout —
                //  restore it here so the HUD keeps showing targets)
                state.actionMode = savedMode;
                state.actionMenuView = savedView;
                state.selectedTool = savedTool;
                renderBattleSelectionUI({ includeBoard: false });
                scheduleBoardRender();
                return;
            }
            // Set as pending target
            state.pendingTarget = { x, y, mode: state.actionMode, tool: state.selectedTool, viaHover: false };
            playSfx('uiCursorFocus');
            updateAoePreview(x, y);
            renderBattleSelectionUI({ includeBoard: false });
            scheduleBoardRender();
        }
        window.selectTargetFromMenu = selectTargetFromMenu;

        function cycleSpellTarget(direction) {
            if (state.actionMode !== 'spell' || !state._spellCycleTargets?.length) return;
            const len = state._spellCycleTargets.length;
            state._spellCycleIndex = ((state._spellCycleIndex || 0) + direction + len) % len;
            const t = state._spellCycleTargets[state._spellCycleIndex];
            if (t) {
                state.pendingTarget = { x: t.x, y: t.y };
                updateAoePreview(t.x, t.y);
                scheduleBoardRender();
            }
        }
        window.cycleSpellTarget = cycleSpellTarget;

        function setActionMode(mode) {
            if (state.activePlayer === state.aiPlayer) return;
            playSfx('uiConfirm');
            const unit = getSelectedUnit();
            if (!unit) {
                addLog('Select one of your units first.');
                return;
            }
            if (!canUnitAct(unit)) {
                addLog(`${unitDisplayName(unit)} already acted this round.`);
                return;
            }
            if (mode === 'spell' && unitHasStatus(unit, 'silence')) {
                addLog(`${unitDisplayName(unit)} is silenced and cannot cast this turn.`);
                return;
            }
            state.actionMode = mode;
            state.hoverUnitId = null;
            state.selectedTool = null;
            state.pendingTarget = null;
            clearAoePreview();
            // Attack mode → show target list sub-menu
            if (mode === 'attack') {
                state.actionMenuView = 'attackTargets';
                // Auto-select first target
                const targets = _getAttackValidTargets(unit);
                if (targets.length > 0) {
                    state.pendingTarget = { x: targets[0].x, y: targets[0].y, mode: 'attack', tool: null, viaHover: false };
                }
            } else {
                state.actionMenuView = 'root';
            }
            renderBattleSelectionUI({
                includeBoard: false
            });
            scheduleBoardRender();
        }


        // ── SPELL RANGE HOVER PREVIEW ──
        let _spellRangePreviewTiles = [];

        function previewSpellRange(spellName) {
            clearSpellRangePreview();
            const unit = getSelectedUnit();
            if (!unit || !boardEl) return;
            const spell = (unit.spells || []).find(s => s.name === spellName) || (unit._raceAbilities || []).find(s => s.name === spellName);
            if (!spell || !spell.range) return;
            const size = bw(),
                sizeH = bh();
            const tiles = boardEl.children;
            for (let cy = 0; cy < sizeH; cy++) {
                for (let cx = 0; cx < size; cx++) {
                    const d = Math.abs(unit.x - cx) + Math.abs(unit.y - cy);
                    const minR = (['heal', 'shield', 'buff', 'scan', 'summonWeather', 'bomb', 'healAll', 'aoe', 'barrage', 'seedHeal', 'seedPoison', 'leechSeed', 'warpRune', 'teleport'].includes(spell.kind)) ? 0 : 1;
                    if (d >= minR && d <= spell.range) {
                        const idx = cy * size + cx;
                        const tile = tiles[idx];
                        if (tile) {
                            tile.classList.add('spell-range-preview');
                            _spellRangePreviewTiles.push(tile);
                        }
                    }
                }
            }
        }
        window.previewSpellRange = previewSpellRange;

        function clearSpellRangePreview() {
            for (const t of _spellRangePreviewTiles) t.classList.remove('spell-range-preview');
            _spellRangePreviewTiles = [];
        }
        window.clearSpellRangePreview = clearSpellRangePreview;

        // ── ATTACK RANGE HOVER PREVIEW ──
        let _attackRangePreviewTiles = [];

        function previewAttackRange() {
            clearAttackRangePreview();
            const unit = getSelectedUnit();
            if (!unit || !boardEl) return;
            const effRange = getEffectiveRange(unit);
            const size = bw(),
                sizeH = bh();
            const tiles = boardEl.children;
            // curFloor removed - unified map
            for (let cy = 0; cy < sizeH; cy++) {
                for (let cx = 0; cx < size; cx++) {
                    const d = Math.abs(unit.x - cx) + Math.abs(unit.y - cy);
                    if (d >= 1 && d <= effRange) {
                        // Skip tiles occupied by friendly units
                        const occupant = state.units.find(u => !u.dead && u.x === cx && u.y === cy);
                        if (occupant && occupant.player === unit.player) continue;
                        const idx = cy * size + cx;
                        const tile = tiles[idx];
                        if (tile) {
                            tile.classList.add('attack-range-preview');
                            _attackRangePreviewTiles.push(tile);
                        }
                    }
                }
            }
        }
        window.previewAttackRange = previewAttackRange;

        function clearAttackRangePreview() {
            for (const t of _attackRangePreviewTiles) t.classList.remove('attack-range-preview');
            _attackRangePreviewTiles = [];
        }
        window.clearAttackRangePreview = clearAttackRangePreview;

        function showSpellTooltip(btnEl) {
            const tip = document.getElementById('spellTooltip');
            if (!tip || !btnEl) return;
            const name = btnEl.dataset.spellName || '';
            const cost = btnEl.dataset.spellCost || '';
            const range = btnEl.dataset.spellRange || '';
            const desc = btnEl.dataset.spellDesc || '';
            if (!name) return;
            tip.innerHTML = `<span class="shc-name">${name}</span><span class="shc-cost">MP ${cost} · Range ${range}</span>${desc ? `<span class="shc-desc">${desc}</span>` : ''}`;
            tip.classList.add('visible');
            const rect = btnEl.getBoundingClientRect();
            let left = rect.left + rect.width / 2 - 110;
            let top = rect.top - 8;
            // Position above the button; if no room, go below
            const tipH = tip.offsetHeight || 80;
            if (top - tipH < 4) {
                top = rect.bottom + 8;
            } else {
                top = top - tipH;
            }
            left = Math.max(4, Math.min(window.innerWidth - 228, left));
            top = Math.max(4, top);
            tip.style.left = left + 'px';
            tip.style.top = top + 'px';
        }
        window.showSpellTooltip = showSpellTooltip;

        function hideSpellTooltip() {
            const tip = document.getElementById('spellTooltip');
            if (tip) tip.classList.remove('visible');
        }
        window.hideSpellTooltip = hideSpellTooltip;

        function actionModeNeedsTargetConfirm() {
            return state.actionMode === 'attack' ||
                state.actionMode === 'spell' ||
                state.actionMode === 'trade' ||
                state.actionMode === 'combo' ||
                (state.actionMode === 'item' && (state.selectedTool === 'healPotion' || state.selectedTool === 'manaPotion' || ITEM_RULES[state.selectedTool]?.baneType));
        }

        function updateHoveredTarget(x, y) {
            if (!actionModeNeedsTargetConfirm()) return false;

            // ── In target-list modes, only allow hover on valid target tiles ──
            if (state.actionMenuView === 'attackTargets' || state.actionMenuView === 'spellTargets') {
                const unit = getSelectedUnit();
                if (!unit) return false;
                let validTargets;
                if (state.actionMenuView === 'attackTargets') {
                    validTargets = _getAttackValidTargets(unit);
                } else {
                    const spell = (unit.spells || []).find(s => s.name === state.selectedTool) || (unit._raceAbilities || []).find(s => s.name === state.selectedTool);
                    validTargets = spell ? _getSpellValidTargets(unit, spell) : [];
                }
                const isValidTarget = validTargets.some(t => t.x === x && t.y === y);
                if (!isValidTarget) return false;
            }

            const next = {
                x,
                y,
                mode: state.actionMode,
                tool: state.selectedTool,
                viaHover: true
            };
            const current = state.pendingTarget;
            const changed = !current || current.x !== next.x || current.y !== next.y || current.mode !== next.mode || current.tool !== next.tool || !current.viaHover;
            if (changed) {
                state.pendingTarget = next;
                updateAoePreview(x, y);
            }
            return changed;
        }

        function clearHoveredTarget(x = null, y = null) {
            const current = state.pendingTarget;
            if (!current?.viaHover) return false;
            if (x != null && y != null && (current.x !== x || current.y !== y)) return false;
            state.pendingTarget = null;
            clearAoePreview();
            return true;
        }

        function clickTile(x, y) {
            if (state.phase === 'setup') {
                return;
            }

            if (state.phase !== 'battle' || state.winner) return;
            if (state.autoPlayers?.[state.activePlayer]) return;

            // Block map interaction while cinematic overlay is active
            if (isCinematicActive()) return;

            // Fog of War: block interaction with fogged tiles (except for your own units' tiles)
            if (state.fogOfWar) {
                const vis = computeVisibleTiles(state.activePlayer);
                if (!vis.has(posKey(x, y))) {
                    // Allow movement to fogged tiles that are within move range
                    const isMoving = state.actionMode === 'move';
                    // Allow teleport Phase 2 to target fogged empty tiles (teleport bypasses fog)
                    const spell = getSelectedUnit()?.spells?.find(s => s.name === state.selectedTool) || getSelectedUnit()?._raceAbilities?.find(s => s.name === state.selectedTool);
                    // Allow flair to target fogged tiles (that's the whole point)
                    const isFlairing = state.actionMode === 'flair';
                    // Allow telescope attacks/spells on sky enemies at this position
                    const _actUnit = getSelectedUnit();
                    const _isTelescopeAction = (state.actionMode === 'attack' || state.actionMode === 'spell') && _actUnit && unitHasTelescope(_actUnit) &&
                        true &&
                        state.units.some(u => !u.dead && u.player !== _actUnit.player && getSectionForUnit(u) === 'above' && u.x === x && u.y === y);
                    if (!isMoving && !isFlairing && !_isTelescopeAction && !(spell?.kind === 'teleport' && state._teleportingUnit)) {
                        return;
                    }
                }
            }

            const actingUnit = getSelectedUnit();
            const clickedUnit = unitAt(x, y);

            if (!actingUnit) {
                if (clickedUnit && clickedUnit.player === state.activePlayer && !clickedUnit.dead) selectUnit(clickedUnit.id);
                else if (clickedUnit) focusUnitPanel(clickedUnit.id);
                else showTileContextMenu(x, y, null);
                return;
            }

            if (!state.actionMode) {
                const humanTurn = !state.autoPlayers?.[state.activePlayer];
                const canControl = humanTurn && actingUnit.player === state.activePlayer && canUnitAct(actingUnit) && !state.winner;

                // Clicking yourself — re-select (refresh menu)
                if (clickedUnit && clickedUnit.id === actingUnit.id) {
                    selectUnit(clickedUnit.id);
                    return;
                }

                // Clicking any other unit (friendly or enemy) — show context menu
                if (clickedUnit && !clickedUnit.dead) {
                    showUnitContextMenu(actingUnit, clickedUnit);
                    return;
                }

                // Clicking a sanctuary building tile — trigger Shop or Rest
                if (canControl && !clickedUnit) {
                    const terrain = getTerrainAt(x, y);
                    if (terrain === 'sanctuary_church') {
                        const sanctsNear = getSanctuariesNearUnit(actingUnit);
                        const canChurchEntry = sanctsNear.find(s => s.type === 'church' && s.owner === actingUnit.player);
                        if (canChurchEntry && !actingUnit._usedChurchThisRound && (actingUnit.gold || 0) >= CHURCH_COST) {
                            useChurch(actingUnit);
                            return;
                        }
                    }
                    if (terrain === 'sanctuary_shop') {
                        const sanctsNear = getSanctuariesNearUnit(actingUnit);
                        const canShopEntry = sanctsNear.find(s => s.type === 'shop' && s.owner === actingUnit.player);
                        if (canShopEntry) {
                            openShop(actingUnit);
                            return;
                        }
                    }
                }

                // Clicking an empty tile — show tile context menu with tile actions
                if (!clickedUnit) {
                    showTileContextMenu(x, y, canControl ? actingUnit : null);
                    return;
                }
                if (clickedUnit) focusUnitPanel(clickedUnit.id);
                return;
            }

            const needsConfirm = actionModeNeedsTargetConfirm();
            if (clickedUnit) focusUnitPanel(clickedUnit.id);

            // ── In target-list modes, only allow clicks on valid target tiles ──
            if (needsConfirm && (state.actionMenuView === 'attackTargets' || state.actionMenuView === 'spellTargets')) {
                let validTargets;
                if (state.actionMenuView === 'attackTargets') {
                    validTargets = _getAttackValidTargets(actingUnit);
                } else {
                    const spell = (actingUnit.spells || []).find(s => s.name === state.selectedTool) || (actingUnit._raceAbilities || []).find(s => s.name === state.selectedTool);
                    validTargets = spell ? _getSpellValidTargets(actingUnit, spell) : [];
                }
                const isValidTarget = validTargets.some(t => t.x === x && t.y === y);
                if (!isValidTarget) {
                    // Allow clicking own units to switch selection
                    if (clickedUnit && clickedUnit.player === state.activePlayer && !clickedUnit.dead) {
                        selectUnit(clickedUnit.id);
                    }
                    return;
                }
            }

            if (needsConfirm) {
                // For 2×2 bosses: clicking ANY of the 4 tiles counts as the same target
                let sameTarget = state.pendingTarget && state.pendingTarget.x === x && state.pendingTarget.y === y && state.pendingTarget.mode === state.actionMode && state.pendingTarget.tool === state.selectedTool;
                if (!sameTarget && state.pendingTarget && state.pendingTarget.mode === state.actionMode && state.pendingTarget.tool === state.selectedTool) {
                    const prevUnit = unitAt(state.pendingTarget.x, state.pendingTarget.y);
                    if (prevUnit && prevUnit._isBoss && prevUnit._bossSize === 2 && clickedUnit === prevUnit) {
                        sameTarget = true;
                    }
                }
                if (!sameTarget) {
                    state.pendingTarget = {
                        x,
                        y,
                        mode: state.actionMode,
                        tool: state.selectedTool,
                        viaHover: false
                    };
                    playSfx('uiCursorFocus');
                    markDirty('board', 'selectedUnit', 'hud');
                    renderIfDirty();
                    return;
                }
                state.pendingTarget = null;
            }

            if (state.actionMode === 'move') return doMove(actingUnit, x, y);
            if (state.actionMode === 'attack') return doAttack(actingUnit, x, y);
            if (state.actionMode === 'inspect') return doInspect(actingUnit, x, y);
            if (state.actionMode === 'ping') return doPing(actingUnit, x, y);
            if (state.actionMode === 'trade') return doTrade(actingUnit, x, y);
            if (state.actionMode === 'item') return doItem(actingUnit, x, y);
            if (state.actionMode === 'warpStone') return executeWarpStone(actingUnit, x, y);
            if (state.actionMode === 'ward') return doWard(actingUnit, x, y);
            if (state.actionMode === 'flair') return doFlair(actingUnit, x, y);
            if (state.actionMode === 'spell') return doSpell(actingUnit, x, y);
            if (state.actionMode === 'combo') {
                // Two-phase: first click selects partner, second click selects target
                if (!state.comboPartner) {
                    // Phase 1: select an adjacent ally as combo partner
                    const clickedUnit = unitAt(x, y);
                    if (clickedUnit && clickedUnit.player === actingUnit.player && clickedUnit.id !== actingUnit.id) {
                        const partners = getComboPartners(actingUnit);
                        if (partners.some(p => p.id === clickedUnit.id)) {
                            state.comboPartner = clickedUnit;
                            const combo = getComboForUnits(actingUnit, clickedUnit);
                            const syn = getComboTypeSynergy(actingUnit, clickedUnit);
                            addLog(`Partner selected: ${unitDisplayName(clickedUnit)}. Combo: ${combo?.name || '?'}${syn.label ? ` (${syn.label})` : ''}. Now choose a target.`);
                            state.pendingTarget = null;
                            renderBattleSelectionUI();
                        } else {
                            addLog('That ally cannot combo with this unit.');
                        }
                    } else {
                        addLog('Click an adjacent ally to choose a combo partner.');
                    }
                    return;
                } else {
                    // Phase 2: select target and execute
                    return doComboAttack(actingUnit, state.comboPartner, x, y);
                }
            }
        }

        function detonateBomb(bomb, triggerText) {
            addLog(triggerText);
            const area = getSquareArea(bomb.x, bomb.y, 1);
            for (const tile of area) {
                const target = unitAt(tile.x, tile.y);
                if (target && target.player !== bomb.owner) {
                    applyDamageToUnit(target, bomb.dmg, `Bomb blast at ${coordLabel(bomb.x, bomb.y)}: `, {
                        allowMarkBonus: false
                    });
                }
            }
            // ── BLOWBACK: surviving enemies in blast radius get pushed away ──
            applyAreaBlowback(bomb.x, bomb.y, area, bomb.owner, '💥 ');
            checkWin();
        }

        function completeMoveAlongPath(unit, stopX, stopY, stopKind, fallbackX = stopX, fallbackY = stopY) {
            finishMoveAt(unit, stopX, stopY, {
                stopReason: stopKind || null,
                destinationLabel: coordLabel(stopX, stopY)
            });
            // Hourglasses are only obtainable via inspection — no walk pickup
            // ── CTF: flag pickup/return/capture ──
            if (typeof checkFlagPickup === 'function') checkFlagPickup(unit);
            // ── WARD DESTRUCTION: stepping on an enemy ward destroys it ──
            if (state.wards) {
                const wardIdx = state.wards.findIndex(w => w.x === unit.x && w.y === unit.y && w.owner !== unit.player);
                if (wardIdx >= 0) {
                    state.wards.splice(wardIdx, 1);
                    addLog(`👁💥 ${unitDisplayName(unit)} destroys an enemy Ward at ${coordLabel(unit.x, unit.y)}!`);
                }
            }
            checkWin();
            endUnitIfDone(unit);
            renderAfterMove();
            // ── Camera: center on unit at its new position after move ──
            if (!state.cameraDisabled && !state.devAutoSim && !state.autoPlayers?.[unit.player] && !unit.dead) {
                const baseZoom = getUserZoomScale();
                if (baseZoom > 1.05) {
                    setBoardCameraTransition(actionMs(380));
                    setBoardCameraFocusPoint(unit.x, unit.y, {
                        zoom: baseZoom
                    });
                } else {
                    // Even at default zoom, smoothly pan to keep the unit visible
                    setBoardCameraTransition(actionMs(380));
                    setBoardCameraFocusPoint(unit.x, unit.y, {
                        zoom: getMediumZoom()
                    });
                    boardCameraResetTimer = window.setTimeout(() => resetBoardCamera(), 600);
                }
            }
            // ── Auto-trigger door banner when landing on a door tile ──
            if (!unit.dead && unit.ap >= 1 && !state.autoPlayers?.[unit.player]) {
                // Online: only show the banner on the screen of the player who owns this unit
                const isViewerUnit = !ONLINE_RULES.active || unit.player === getViewerPlayer();
                if (isViewerUnit) {
                    const landTerrain = getTerrainAt(unit.x, unit.y);
                    const landRule = getTerrainRule(landTerrain);
                    if (landRule.isDoor && landRule.doorTarget) {
                        setTimeout(() => showFloorTransitionBanner(landRule.doorTarget), 250);
                    }
                }
            }
        }

        function openPickupDecisionDialog(unit, event, onPickUp, onLeave) {
            const kindLabel = event.kind === 'hiddenHourglass' ? 'Hidden Hourglass' : 'Hidden Pickup';
            const badgeLabel = event.kind === 'hiddenHourglass' ?
                '⏳ Something important was uncovered' :
                '📦 Something hidden was found';
            if (state.autoPlayers?.[unit.player] || state.devAutoSim) {
                state.uiDialog = null;
                if (typeof onPickUp === 'function') onPickUp();
                return;
            }
            // Online: relay pickup decision to the guest player who owns the unit
            if (ONLINE_RULES.active && unit.player !== getViewerPlayer()) {
                // Store callbacks so we can execute them when the guest responds
                state._pendingRemotePickup = {
                    onPickUp,
                    onLeave,
                    unitId: unit.id
                };
                _emit('relay', {
                    type: 'pickup-dialog',
                    unitId: unit.id,
                    event: {
                        kind: event.kind,
                        x: event.x,
                        y: event.y
                    },
                    kindLabel,
                    badgeLabel
                });
                // Don't auto-confirm — wait for guest's response via relay
                return;
            }
            state.uiDialog = {
                type: 'pickupDecision',
                unitId: unit.id,
                event,
                kindLabel,
                badgeLabel,
                onConfirm: onPickUp,
                onCancel: onLeave
            };
            markDirty('board', 'dialog', 'status');
            renderIfDirty();
        }

        function checkWarpRuneTrigger(unit) {
            if (!state.warpRunes || !unit || unit.dead) return false;
            const runeIdx = state.warpRunes.findIndex(r => r.x === unit.x && r.y === unit.y);
            if (runeIdx === -1) return false;
            const rune = state.warpRunes[runeIdx];
            state.warpRunes.splice(runeIdx, 1);
            // Find random unoccupied passable tile
            const candidates = [];
            for (let cy = 0; cy < bh(); cy++) {
                for (let cx = 0; cx < bw(); cx++) {
                    if (canOccupy(cx, cy) && !(cx === unit.x && cy === unit.y)) candidates.push({
                        x: cx,
                        y: cy
                    });
                }
            }
            if (!candidates.length) return false;
            const dest = candidates[Math.floor(Math.random() * candidates.length)];
            const oldLabel = coordLabel(unit.x, unit.y);
            unit.x = dest.x;
            unit.y = dest.y;
            playSfx('manaRegen');
            addLog(`🔮 ${unitDisplayName(unit)} triggers a Warp Rune at ${oldLabel} and is teleported to ${coordLabel(dest.x, dest.y)}!`);
            return true;
        }

        function resolveMovePath(unit, path, destinationX, destinationY, startIndex = 0) {
            for (let i = startIndex; i < path.length; i++) {
                const step = path[i];
                const event = getPathPickupEvent(unit, step.x, step.y);
                if (!event) continue;
                // Only bombs still trigger path stops
                completeMoveAlongPath(unit, event.x, event.y, event.kind, destinationX, destinationY);
                return;
            }
            completeMoveAlongPath(unit, destinationX, destinationY, null);
        }

        // ── WALK PATH ANIMATION ──
        // Shows a ghost sprite sliding tile-by-tile along the move path
        let _walkAnimActive = false;
        let _walkAnimUnitId = null;

        function animateWalkPath(unit, path, onComplete) {
            _walkAnimUnitId = unit.id;
            if (!boardEl || !path?.length || state.devAutoSim || state.animationsDisabled) {
                if (onComplete) onComplete();
                return;
            }
            _walkAnimActive = true;
            
            const sprite = getBattleMapSpriteUrl(unit);
            const tileSize = CONFIG.tileSize || 64;
            const gap = CONFIG.tileGap ?? 0;
            const pad = CONFIG.boardPadding ?? 2;

            // Create ghost element inside board
            const ghost = document.createElement('div');
            ghost.className = 'walk-ghost';
            ghost.style.width = tileSize + 'px';
            ghost.style.height = tileSize + 'px';
            const img = document.createElement('img');
            img.src = sprite;
            ghost.appendChild(img);

            // Start position = unit's current tile
            const fullPath = [{
                x: unit.x,
                y: unit.y
            }, ...path];
            const startLeft = pad + fullPath[0].x * (tileSize + gap);
            const startTop = pad + fullPath[0].y * (tileSize + gap);
            ghost.style.left = startLeft + 'px';
            ghost.style.top = startTop + 'px';
            ghost.style.zIndex = 100 + fullPath[0].y;
            boardEl.appendChild(ghost);

            let stepIndex = 1;
            const stepMs = Math.max(80, Math.min(160, 140 - path.length * 8)); // faster with longer paths

            function stepNext() {
                if (stepIndex >= fullPath.length) {
                    // Cleanup: remove ghost, clear walk state, then re-render so unit appears at destination
                    setTimeout(() => {
                        ghost.remove();
                        _walkAnimActive = false;
                        _walkAnimUnitId = null;
                        
                        // Re-render the board so the unit at the destination tile becomes visible
                        markDirty('board');
                        renderIfDirty();
                    }, 120);
                    if (onComplete) onComplete();
                    return;
                }
                const pt = fullPath[stepIndex];
                const newLeft = pad + pt.x * (tileSize + gap);
                const newTop = pad + pt.y * (tileSize + gap);

                // Drop trail on previous tile
                const prevPt = fullPath[stepIndex - 1];
                const trail = document.createElement('div');
                trail.className = 'walk-trail';
                const tIdx = prevPt.y * bw() + prevPt.x;
                const tileEl = _boardGrid?.tiles?.[tIdx];
                if (tileEl) tileEl.appendChild(trail);
                setTimeout(() => trail.remove(), 600);

                // Animate ghost to next tile
                ghost.style.left = newLeft + 'px';
                ghost.style.top = newTop + 'px';
                ghost.style.zIndex = 100 + pt.y;
                stepIndex++;
                setTimeout(stepNext, stepMs);
            }

            // Start animation after a brief setup frame
            requestAnimationFrame(() => setTimeout(stepNext, 30));
        }

        function doMove(unit, x, y) {
            if (!canUnitMove(unit)) {
                if (!state.autoPlayers?.[unit.player]) {
                    addLog((unit.movesThisTurn || 0) >= UNIT_MAX_MOVES ? 'That unit already used all its moves this turn.' : 'That unit already acted this round.');
                }
                return false;
            }
            const legalMove = getMoveTiles(unit).some(tile => tile.x === x && tile.y === y);
            if (!legalMove || !canOccupy(x, y)) {
                // AI: immediately consume movement to prevent retry loops
                if (state.autoPlayers?.[unit.player]) {
                    unit.movesThisTurn = UNIT_MAX_MOVES;
                } else {
                    addLog('Invalid move.');
                    playErrorSfx();
                }
                return false;
            }

            const path = findMovePath(unit, x, y);
            const isHuman = !state.autoPlayers?.[unit.player];
            const startX = unit.x,
                startY = unit.y;

            // ── Show walk animation for human players ──
            if (isHuman && path.length > 0 && !state.cameraDisabled) {
                animateWalkPath(unit, path);
            }

            // ── Undo: snapshot before move; boundary if path has pickups/info ──
            pushUndoSnapshot(_moveWillGainInfo(unit, x, y));

            // ── Anti-oscillation: track recent positions ──
            if (!unit._aiRecentTiles) unit._aiRecentTiles = [];
            unit._aiRecentTiles.push(posKey(unit.x, unit.y));
            if (unit._aiRecentTiles.length > 3) unit._aiRecentTiles.shift();

            resolveMovePath(unit, path, x, y);
            // Check for warp rune trigger at final position
            checkWarpRuneTrigger(unit);
            return true;
        }

        function doAttack(unit, x, y) {
            if (!canUnitAct(unit)) {
                addLog('That unit already acted this round.');
                return 0;
            }
            let d = Math.abs(unit.x - x) + Math.abs(unit.y - y);
            // Resolve target early so we can use distToTarget for 2×2 bosses
            const _clickedTarget = unitAt(x, y);
            if (_clickedTarget && _clickedTarget._isBoss && _clickedTarget._bossSize === 2) {
                d = distToTarget(unit.x, unit.y, _clickedTarget);
            }
            if (d < 1 || d > getEffectiveRange(unit)) {
                addLog('Target tile is out of range.');
                return 0;
            }
            if (isRangeBlockedByTerrain(unit.x, unit.y, x, y)) {
                addLog('Mountain terrain blocks the attack path.');
                return 0;
            }
            // Fog of War: human players can't target tiles outside vision
            // (telescope sky targets bypass ground-fog check)
            const _isSkyTelescopeTarget = unitHasTelescope(unit) && getSectionForUnit(unit) === 'earth' && true &&
                state.units.some(u => !u.dead && u.player !== unit.player && getSectionForUnit(u) === 'above' && u.x === x && u.y === y);
            if (state.fogOfWar && !state.autoPlayers?.[unit.player] && !isInVision(unit, x, y) && !_isSkyTelescopeTarget) {
                addLog('Target is hidden in the fog.');
                playErrorSfx();
                return 0;
            }
            let target = unitAt(x, y);
            // ── Telescope: if no ground target, check for sky enemy ──
            if (!target && unitHasTelescope(unit) && getSectionForUnit(unit) === 'earth' && true) {
                const skyTarget = state.units.find(u => !u.dead && u.player !== unit.player && getSectionForUnit(u) === 'above' && u.x === x && u.y === y);
                if (skyTarget) {
                    const vr = getUnitVisionRange(unit);
                    if ((Math.abs(unit.x - x) + Math.abs(unit.y - y)) <= vr) {
                        target = skyTarget;
                        // ── Telescope vision: reveal tiles around the sky target so the attack animation is visible ──
                        if (state.fogOfWar) {
                            if (!state._fogRevealTiles) state._fogRevealTiles = new Set();
                            const revealRadius = Math.max(3, vr);
                            for (let dy = -revealRadius; dy <= revealRadius; dy++) {
                                for (let dx = -revealRadius; dx <= revealRadius; dx++) {
                                    if (Math.abs(dx) + Math.abs(dy) <= revealRadius) {
                                        state._fogRevealTiles.add(posKey(x + dx, y + dy));
                                    }
                                }
                            }
                            state._fogRevealTiles.add(posKey(unit.x, unit.y));
                            scheduleBoardRender();
                            clearTimeout(state._fogRevealTimer);
                            state._fogRevealTimer = setTimeout(() => {
                                state._fogRevealTiles = null;
                                scheduleBoardRender();
                            }, 3500);
                        }
                    }
                }
            }
            // ── Tower attack: if clicking a tower tile with no friendly unit ──
            const tw = towerAt(x, y);
            if (tw && !target && tw.owner !== unit.player) {
                pushUndoSnapshot(true);
                let damage = Math.max(24, Math.floor(unit.atk * 0.65) + getEffectiveAttackBonus(unit) + getHourglassPower(unit) + randInt(40) - 16);
                // Tower has defense
                damage = Math.max(1, damage - (tw.def || 0));
                tw.hp = Math.max(0, tw.hp - damage);
                addLog(`🐉 ${unitDisplayName(unit)} attacks Player ${tw.owner}'s Dragon for ${damage} damage! (Dragon HP: ${tw.hp}/${tw.maxHp})`);
                // ── XP: tower damage (flat per hit) ──
                grantXP(unit, XP_TOWER_DAMAGE_FLAT, 'towerDmg');
                playSfx('uiConfirm');
                showFloatingTextAtTile(x, y, `-${damage}`, 'damage');
                spendAP(unit, AP_COST_ACTION);
                state.actionMode = null;
                state.actionMenuView = 'root';
                state.selectedTool = null;
                state.pendingTarget = null;
                checkWin();
                endUnitIfDone(unit);
                renderAfterCombat();
                return damage;
            }
            // ── Player turret attack: if clicking a tile with an enemy turret ──
            if (!target && state.turrets) {
                const enemyTurret = state.turrets.find(t => t.x === x && t.y === y && t.owner !== unit.player && t.hp > 0);
                if (enemyTurret) {
                    pushUndoSnapshot(true);
                    let damage = Math.max(24, Math.floor(unit.atk * 0.65) + getEffectiveAttackBonus(unit) + getHourglassPower(unit) + randInt(40) - 16);
                    damageTurretAt(x, y, damage, unit);
                    playSfx('uiConfirm');
                    spendAP(unit, AP_COST_ACTION);
                    state.actionMode = null;
                    state.actionMenuView = 'root';
                    state.selectedTool = null;
                    state.pendingTarget = null;
                    checkWin();
                    endUnitIfDone(unit);
                    renderAfterCombat();
                    return damage;
                }
            }
            if (!target || target.player === unit.player) {
                addLog('Choose an enemy on an attack-highlighted tile.');
                playErrorSfx();
                return 0;
            }
            // Camouflage: enemy is hidden and cannot be targeted
            if (unitHasStatus(target, 'invisible')) {
                addLog(`${unitDisplayName(target)} is camouflaged and cannot be targeted.`);
                playErrorSfx();
                return 0;
            }

            // ── Undo: boundary — attack always changes state ──
            pushUndoSnapshot(true);

            // ── Break camouflage on attack ──
            if (unitHasStatus(unit, 'invisible')) {
                clearStatus(unit, 'invisible');
                addLog(`${unitDisplayName(unit)} breaks camouflage!`);
            }

            // ── EVASION CHECK ──
            const evaded = rollEvasion(target);

            // ── CRIT CHECK ──
            const isCrit = !evaded && rollCrit(unit);

            // ── DAMAGE CALC (with streak + last stand bonus) ──
            let damage = Math.max(24, Math.floor(unit.atk * 0.65) + getEffectiveAttackBonus(unit) + getHourglassPower(unit) + randInt(40) - 16);
            if (isCrit) {
                damage = Math.floor(damage * getCritMultiplier(unit));
                unit._matchCrits = (unit._matchCrits || 0) + 1;
                if (unit._matchCrits >= 3) checkAchievement('critMaster', unit);
            }

            focusUnitPanel(target.id);
            // Sneak Slash bonus: +50% damage if target already acted this turn
            const _sneakBonus = false; // basic attacks don't have sneak
            const cam = playOffensiveActionCamera(unit, target, {
                sourceHold: 1150,
                targetHold: 1050,
                attackName: 'Attack',
                _noCinematic: true
            });
            markDirty('board', 'selectedUnit', 'hud');
            renderIfDirty();

            const projectileDelay = Math.max(0, cam?.sourceHold ?? actionMs(1150));
            let impactDelay = Math.max(projectileDelay + actionMs(180), (cam?.sourceHold ?? actionMs(1150)) + (cam?.travelMs ?? actionMs(480)) + actionMs(80));
            let totalDelay = Math.max(impactDelay + actionMs(120), (cam?.totalMs ?? (impactDelay + actionMs(360))) + actionMs(120));

            window.setTimeout(() => {
                playSfx('uiConfirm');
                playProjectileToUnit(unit, target, 'attack', cam?.travelMs ?? actionMs(480));
            }, projectileDelay);

            window.setTimeout(() => {
                if (evaded) {
                    // ── DODGE ──
                    target._matchDodges = (target._matchDodges || 0) + 1;
                    // ── XP: dodge ──
                    grantXP(target, XP_DODGE, 'dodge');
                    addLog(`${unitDisplayName(target)} dodges ${unitDisplayName(unit)}'s attack!`);
                    showBattleDialogue([`<span class="dlg-resist">💨 ${unitDisplayName(target)} dodges the attack!</span>`], 1200);
                    showFloatingTextForUnit(target, 'DODGE!', 'dodge', {
                        durationMs: 1000
                    });
                    playSfx('uiConfirm');
                    if (_activeCinematic?.showDamage) _activeCinematic.showDamage('DODGE!', false);
                    if (_activeCinematic?.showDodge) _activeCinematic.showDodge();
                } else {
                    // ── APPLY DAMAGE ──
                    const preHp = target.hp;
                    if (isCrit) {
                        addLog(`⚡ CRITICAL HIT!`);
                        showBattleDialogue([`<span class="dlg-effective">⚡ CRITICAL HIT!</span>`], 1200);
                        showFloatingTextForUnit(unit, 'CRIT!', 'crit', {
                            durationMs: 1100,
                            jitterY: -20
                        });
                        shakeBoard('normal');
                    }
                    if (_activeCinematic?.showDamage) _activeCinematic.showDamage(`-${damage}`, isCrit);
                    // Show type effectiveness in cinematic
                    if (_activeCinematic?.showTypeEffect) {
                        const _typeNote = getTypeCombatNote(unit, target);
                        if (_typeNote) _activeCinematic.showTypeEffect(_typeNote);
                    }
                    const killed = applyDamageToUnit(target, damage, `${unitDisplayName(unit)} attacks${isCrit ? ' (CRIT!)' : ''}: `, {
                        sourceUnit: unit
                    });
                    // Cinematic for basic attacks only on kill or match elimination
                    if (killed) {
                        const matchOver = checkWinConditionOnly();
                        const killCin = playCinematicAttack(unit, target, {
                            _forceBasicKill: true
                        });
                        // Show damage and KO in the kill cinematic
                        if (killCin?.showDamage) killCin.showDamage(`-${damage}`, isCrit);
                        if (killCin?.showKO) killCin.showKO();
                        if (matchOver) {
                            checkWin();
                            renderBattleUpdate();
                            return;
                        }
                    }
                }

                unit._trackBasicAttacks = (unit._trackBasicAttacks || 0) + 1;
                spendAP(unit, AP_COST_ACTION);
                state.actionMode = null;
                state.actionMenuView = 'root';
                state.selectedTool = null;
                state.pendingTarget = null;

                // ── COUNTER-ATTACK CHECK (melee range only, resolved synchronously) ──
                if (!evaded && !target.dead && !target._dying && d === 1 && rollCounter(target)) {
                    const counterDmg = getCounterDamage(target);
                    target._matchCounters = (target._matchCounters || 0) + 1;
                    // ── XP: counter ──
                    grantXP(target, XP_COUNTER, 'counter');
                    addLog(`⚔️ ${unitDisplayName(target)} counter-attacks for ${counterDmg} damage!`);
                    showFloatingTextForUnit(target, 'COUNTER!', 'counter', {
                        durationMs: 1000
                    });
                    if (_activeCinematic?.showCounter) _activeCinematic.showCounter();
                    applyDamageToUnit(unit, counterDmg, `${unitDisplayName(target)} counter-attacks: `, {
                        sourceUnit: target,
                        ignoreArmor: false
                    });
                    checkWin();
                }

                endUnitIfDone(unit);
                renderBattleUpdate();
            }, impactDelay);
            return totalDelay;
        }

        function doInspect(unit, x, y) {
            if (!canUnitAct(unit)) {
                addLog('That unit already acted this round.');
                return;
            }
            const inspectReach = getEffectiveInspect(unit);
            if (inspectReach <= 0) {
                addLog(`${unitDisplayName(unit)} cannot inspect right now.`);
                return;
            }
            const d = Math.max(Math.abs(unit.x - x), Math.abs(unit.y - y));
            if (d > inspectReach) {
                addLog('That inspect target is out of reach.');
                return;
            }
            if (isRangeBlockedByTerrain(unit.x, unit.y, x, y)) {
                addLog('Mountain terrain blocks that scan line.');
                return;
            }

            // ── Undo: boundary — inspect reveals info ──
            pushUndoSnapshot(true);

            // Reveal up to AWR tiles in a 3x3 area centered on the clicked tile
            const tileCount = getInspectTileCount(unit);
            const candidates = [];
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const tx = x + dx,
                        ty = y + dy;
                    if (tx < 0 || tx >= bw() || ty < 0 || ty >= bh()) continue;
                    const dist = Math.abs(dx) + Math.abs(dy);
                    candidates.push({
                        x: tx,
                        y: ty,
                        dist
                    });
                }
            }
            // Sort: center first, then adjacent, then corners
            candidates.sort((a, b) => a.dist - b.dist);
            const toReveal = candidates.slice(0, tileCount);

            let totalHourglasses = 0;
            let lootedNow = 0;
            for (const tile of toReveal) {
                const key = scanKey(tile.x, tile.y);
                state.scannedByPlayer[unit.player].add(key);

                // ── INSPECT COLLECTION: directly collect any hourglasses on inspected tiles ──
                const tileHG = state.hourglasses.filter(h => h.carriedBy === null && h.x === tile.x && h.y === tile.y);
                for (const h of tileHG) {
                    h.carriedBy = unit.id;
                    h.visibleTo[1] = true;
                    h.visibleTo[2] = true;
                    unit.hourglasses += 1;
                    const prevBuff = unit.hourglassBuff || 0;
                    unit.hourglassBuff = prevBuff + 1;
                    state.hourglassBuffs[unit.player] = (state.hourglassBuffs[unit.player] || 0) + 1;
                    totalHourglasses++;
                }

                const deadUnit = state.units.find(u => u.dead && u.x === tile.x && u.y === tile.y);
                if (deadUnit) {
                    const preLoot = lootedNow;
                    lootedNow += lootCorpseItems(unit, deadUnit);
                    if (lootedNow > preLoot) {
                        showFloatingTextForUnit(unit, `📦 Looted ${lootedNow - preLoot} item${(lootedNow - preLoot) > 1 ? 's' : ''}`, 'pickup', { durationMs: 1200 });
                    }
                }

                const bombIndex = state.bombs.findIndex(b => b.x === tile.x && b.y === tile.y && b.owner !== unit.player);
                if (bombIndex >= 0) {
                    const bomb = state.bombs.splice(bombIndex, 1)[0];
                    detonateBomb(bomb, `Scan triggers a hidden bomb at ${coordLabel(tile.x, tile.y)}.`);
                }
            }

            // Show hourglass collection feedback
            if (totalHourglasses > 0) {
                const newLevel = unit.hourglassBuff || 0;
                const buffDesc = `+${newLevel} ATK, +${newLevel} DEF, +${Math.floor(newLevel/2)} MOV`;
                grantXP(unit, XP_COLLECT_HOURGLASS * totalHourglasses, 'collectHourglass');
                grantXP(unit, XP_FIND_HOURGLASS * totalHourglasses, 'findHourglass');
                unit.gold = (unit.gold || 0) + (typeof GOLD_PER_HOURGLASS !== 'undefined' ? GOLD_PER_HOURGLASS : 0) * totalHourglasses;
                showFloatingTextForUnit(unit, `⏳ +${totalHourglasses}`, 'streak');
                showCombatBanner(`⏳ Hourglass Found!`, `Buff Lv.${newLevel}: ${buffDesc}`, unit.player === getViewerPlayer() ? 'pickup-friendly' : 'pickup-enemy');
                playSfx(unit.player === getViewerPlayer() ? 'playerHourglass' : 'enemyHourglass');
                shakeBoard('normal');
            }

            addLog(`${unitDisplayName(unit)} inspects ${toReveal.length} tile${toReveal.length !== 1 ? 's' : ''} around ${coordLabel(x, y)}.`, unit.player);
            // ── XP: inspect tiles ──
            grantXP(unit, XP_INSPECT, 'inspect');
            if (totalHourglasses > 0) {
                addLog(`⏳ Inspection uncovers ${totalHourglasses} hourglass${totalHourglasses !== 1 ? 'es' : ''}! Buff Lv.${unit.hourglassBuff}.`, unit.player);
            }

            if (totalHourglasses === 0) {
                addLog(`Nothing found here.`, unit.player);
            }

            if (lootedNow > 0) {
                addLog(`${unitDisplayName(unit)} loots ${lootedNow} item${lootedNow === 1 ? '' : 's'} from a nearby corpse.`, unit.player);
            }

            // Camera hold on inspected area so player can see results
            focusBoardCameraOnTiles([{
                x,
                y
            }], {
                zoom: getWideZoom(),
                holdMs: 1800
            });

            spendAP(unit, AP_COST_ACTION);
            state.actionMode = null;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            state.pendingTarget = null;
            checkWin();
            renderBattleUpdate();
            // Delay endUnitIfDone so inspection results remain visible
            const _inspectUnit = unit;
            window.setTimeout(() => {
                endUnitIfDone(_inspectUnit);
                renderBattleUpdate();
            }, 1600);
        }

        function doDetonate(unit) {
            if (!canUnitAct(unit)) {
                addLog('That unit already acted this round.');
                return 0;
            }
            const ownedBombs = state.bombs.filter(b => b.ownerUnitId === unit.id);
            if (!ownedBombs.length) {
                addLog('No bombs on the field to detonate.');
                playErrorSfx();
                return 0;
            }
            playSfx('uiConfirm');
            const bombsCopy = [...ownedBombs];
            state.bombs = state.bombs.filter(b => b.ownerUnitId !== unit.id);
            for (const bomb of bombsCopy) {
                detonateBomb(bomb, `${unitDisplayName(unit)} detonates bomb at ${coordLabel(bomb.x, bomb.y)}!`);
            }
            spendAP(unit, AP_COST_ACTION);
            state.actionMode = null;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            endUnitIfDone(unit);
            renderBattleUpdate();
            return actionMs(600);
        }

        // ── COMBO ATTACK EXECUTION ──
        function doComboAttack(initiator, partner, targetX, targetY) {
            if (!initiator || !partner || initiator.dead || partner.dead) return 0;
            if ((initiator.ap || 0) < COMBO_AP_COST_INITIATOR || (partner.ap || 0) < COMBO_AP_COST_PARTNER) {
                addLog('Combo requires 3 AP total (2 from initiator, 1 from partner).');
                return 0;
            }
            if (Math.abs(initiator.x - partner.x) + Math.abs(initiator.y - partner.y) !== 1) {
                addLog('Combo partner must be adjacent.');
                return 0;
            }
            const combo = getComboForUnits(initiator, partner);
            if (!combo) {
                addLog('No combo available for that weapon pair.');
                return 0;
            }

            // Validate target
            const target = unitAt(targetX, targetY);
            const isOffensive = ['damage', 'multiHit', 'aoe'].includes(combo.kind);
            const d = Math.abs(initiator.x - targetX) + Math.abs(initiator.y - targetY);
            const comboRange = combo.range || 3;

            if (isOffensive) {
                if (!target || target.player === initiator.player) {
                    addLog('Choose an enemy target for the combo attack.');
                    playErrorSfx();
                    return 0;
                }
                if (d < 1 || d > comboRange) {
                    addLog('Combo target is out of range.');
                    playErrorSfx();
                    return 0;
                }
                if (d >= 1 && isRangeBlockedByTerrain(initiator.x, initiator.y, targetX, targetY)) {
                    addLog('Terrain blocks the combo attack.');
                    return 0;
                }
            }

            // ── Undo: boundary — combo always deals damage ──
            pushUndoSnapshot(true);

            // Type synergy
            const synergy = isOffensive && target ?
                getComboTypeSynergyVsTarget(initiator, partner, target) :
                getComboTypeSynergy(initiator, partner);
            const synergyMult = synergy.mult;
            const synergyLabel = synergy.label ? ` ${synergy.label}` : '';

            // Combined spell power from both units
            const combinedPower = (initiator.spellPower || 0) + (partner.spellPower || 0) + getHourglassPower(initiator) + getHourglassPower(partner);

            // Spend AP from both units (3 total: 2 initiator + 1 partner)
            spendAP(initiator, COMBO_AP_COST_INITIATOR);
            spendAP(partner, COMBO_AP_COST_PARTNER);

            // ── COMBO COOLDOWN: mark both units so they can't combo again for 3 rounds ──
            initiator._lastComboRound = state.round;
            partner._lastComboRound = state.round;

            playSfx('fireball');
            addLog(`${unitDisplayName(initiator)} & ${unitDisplayName(partner)} perform ${combo.name}!${synergyLabel}`);
            // ── COMBO TRACKING ──
            initiator._matchCombos = (initiator._matchCombos || 0) + 1;
            partner._matchCombos = (partner._matchCombos || 0) + 1;
            // ── XP: combo attack ──
            grantXP(initiator, XP_COMBO, 'combo');
            grantXP(partner, XP_COMBO, 'combo');
            const playerCombos = state.units.filter(u => u.player === initiator.player).reduce((s, u) => s + (u._matchCombos || 0), 0);
            if (playerCombos >= 3) checkAchievement('comboKing', initiator);
            shakeBoard('normal');

            let completionDelay = actionMs(800);

            // ── Offensive damage combos ──
            if (combo.kind === 'damage' && target) {
                const baseDmg = (combo.dmg || 160) + combinedPower;
                const totalDmg = Math.max(1, Math.round(baseDmg * synergyMult));
                applyDamageToUnit(target, totalDmg, `${combo.name}: `, {
                    sourceUnit: initiator,
                    damageType: combo.damageType,
                    spellType: combo.spellType || null
                });
                // Apply status effects
                for (const eff of (combo.statusEffects || [])) {
                    if (rollStatusApply(initiator, target, 0.85)) {
                        applyStatus(target, eff.id, eff.duration, eff.bonusDamage || 0);
                    }
                }
            }
            // ── Multi-hit combos ──
            else if (combo.kind === 'multiHit' && target) {
                const hits = combo.hitDamages || [combo.dmg || 10];
                const comboHitGap = actionMs(300);
                hits.forEach((hitDmg, idx) => {
                    window.setTimeout(() => {
                        if (target.dead) return;
                        const totalHit = Math.max(1, Math.round((hitDmg + Math.floor(combinedPower / hits.length)) * synergyMult));
                        // Projectile for each hit after the first
                        if (idx > 0) {
                            playProjectileToUnit(initiator, target, 'damage', actionMs(240), combo.spellType);
                            playSfx('fireball');
                        }
                        applyDamageToUnit(target, totalHit, `${combo.name} hit ${idx + 1}: `, {
                            sourceUnit: initiator,
                            damageType: combo.damageType,
                            spellType: combo.spellType || null
                        });
                    }, idx * comboHitGap);
                });
                completionDelay = Math.max(completionDelay, (hits.length - 1) * comboHitGap + actionMs(500));
                // Status effects after all hits (delayed to after last hit)
                window.setTimeout(() => {
                    for (const eff of (combo.statusEffects || [])) {
                        if (!target.dead && rollStatusApply(initiator, target, 0.75)) {
                            applyStatus(target, eff.id, eff.duration, eff.bonusDamage || 0);
                        }
                    }
                }, (hits.length - 1) * comboHitGap + actionMs(100));
            }
            // ── AoE combos ──
            else if (combo.kind === 'aoe') {
                const area = getSquareArea(targetX, targetY, combo.aoeRadius || 1);
                const enemies = aliveUnitsOnFloor(enemyOf(initiator.player), null);
                for (const tile of area) {
                    const hit = enemies.find(e => e.x === tile.x && e.y === tile.y);
                    if (hit && !hit.dead) {
                        const aoeDmg = Math.max(1, Math.round(((combo.dmg || 16) + combinedPower) * synergyMult));
                        applyDamageToUnit(hit, aoeDmg, `${combo.name}: `, {
                            sourceUnit: initiator,
                            damageType: combo.damageType,
                            spellType: combo.spellType || null
                        });
                        for (const eff of (combo.statusEffects || [])) {
                            if (!hit.dead && rollStatusApply(initiator, hit, 0.7)) {
                                applyStatus(hit, eff.id, eff.duration, eff.bonusDamage || 0);
                            }
                        }
                    }
                }
            }
            // ── Heal All combos ──
            else if (combo.kind === 'healAll') {
                const healAmt = Math.round((combo.heal || 20) * synergyMult);
                for (const ally of aliveUnitsFor(initiator.player)) {
                    const hpGain = Math.min(healAmt, ally.maxHp - ally.hp);
                    if (hpGain > 0) {
                        applyHealingToUnit(ally, hpGain, initiator);
                        addLog(`${combo.name} heals ${unitDisplayName(ally)} for ${hpGain} HP.`);
                    }
                }
            }
            // ── Shield combos ──
            else if (combo.kind === 'shield') {
                const shieldAmt = Math.round((combo.shield || 16) * synergyMult);
                const cap = Math.floor((initiator.maxHp || 100) * (combo.shieldCapPct || 0.30));
                const gain = Math.min(shieldAmt, cap - (initiator.shield || 0));
                if (gain > 0) {
                    initiator.shield = (initiator.shield || 0) + gain;
                    addLog(`${combo.name} grants ${unitDisplayName(initiator)} ${gain} shield.`);
                }
                const gain2 = Math.min(shieldAmt, cap - (partner.shield || 0));
                if (gain2 > 0) {
                    partner.shield = (partner.shield || 0) + gain2;
                    addLog(`${combo.name} grants ${unitDisplayName(partner)} ${gain2} shield.`);
                }
            }
            // ── Buff combos (Phalanx Guard) ──
            else if (combo.kind === 'buff') {
                for (const eff of (combo.statusEffects || [])) {
                    applyStatus(initiator, eff.id, eff.duration);
                    applyStatus(partner, eff.id, eff.duration);
                }
                addLog(`${combo.name} buffs both ${unitDisplayName(initiator)} and ${unitDisplayName(partner)}.`);
            }

            // ── Bonus effects: comboHeal (heal all allies) ──
            if (combo.comboHeal && combo.comboHeal > 0) {
                const healAmt = Math.round(combo.comboHeal * synergyMult);
                for (const ally of aliveUnitsFor(initiator.player)) {
                    const hpGain = Math.min(healAmt, ally.maxHp - ally.hp);
                    if (hpGain > 0) {
                        applyHealingToUnit(ally, hpGain, initiator);
                        addLog(`${combo.name} also heals ${unitDisplayName(ally)} for ${hpGain} HP.`);
                    }
                }
            }

            state.actionMode = null;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            state.pendingTarget = null;
            state.comboPartner = null;
            checkWin();
            endUnitIfDone(initiator);
            endUnitIfDone(partner);
            renderBattleUpdate();
            return completionDelay;
        }

        function doItem(unit, x, y) {
            if (!canUnitAct(unit)) {
                addLog('That unit already acted this round.');
                return;
            }

            const target = unitAt(x, y);
            let chebyshev = Math.max(Math.abs(unit.x - x), Math.abs(unit.y - y));
            // 2×2 boss: use minimum chebyshev distance to any occupied tile
            if (target && target._isBoss && target._bossSize === 2) {
                chebyshev = Math.min(chebyshev,
                    Math.max(Math.abs(unit.x - (target.x + 1)), Math.abs(unit.y - target.y)),
                    Math.max(Math.abs(unit.x - target.x), Math.abs(unit.y - (target.y + 1))),
                    Math.max(Math.abs(unit.x - (target.x + 1)), Math.abs(unit.y - (target.y + 1)))
                );
            }

            if (state.selectedTool === 'healPotion') {
                if (unit.items.healPotion <= 0) {
                    addLog('No healing potions left.');
                    playErrorSfx();
                    return;
                }
                if (chebyshev > 0) {
                    addLog('Healing Potions are self-use only.');
                    playErrorSfx();
                    return;
                }
                if (unit.hp >= unit.maxHp) {
                    addLog('Already at full HP.');
                    playErrorSfx();
                    return;
                }
                focusUnitPanel(unit.id);
                playSfx('healRegen');
                resetBoardCamera();
                pushUndoSnapshot(true); // boundary — heals self
                unit.items.healPotion -= 1;
                const heal = Math.max(1, Math.round(96 * getTerrainHealMultiplier(unit.x, unit.y)));
                const healed = applyHealingToUnit(unit, heal, unit);
                addLog(`${unitDisplayName(unit)} uses Healing Potion, restoring ${healed} HP.`);
            } else if (state.selectedTool === 'manaPotion') {
                if (unit.items.manaPotion <= 0) {
                    addLog('No mana potions left.');
                    playErrorSfx();
                    return;
                }
                if (!target || target.player !== unit.player || target.dead) {
                    addLog('Choose a living friendly unit for Mana Potion.');
                    playErrorSfx();
                    return;
                }
                if (target.maxMp <= 0) {
                    addLog('That target has no MP to restore.');
                    playErrorSfx();
                    return;
                }
                if (target.mp >= target.maxMp) {
                    addLog('That target is already at full MP.');
                    playErrorSfx();
                    return;
                }
                focusUnitPanel(target.id);
                playSfx('manaRegen');
                resetBoardCamera();
                pushUndoSnapshot(true); // boundary — restores MP
                unit.items.manaPotion -= 1;
                const restore = 40;
                const mpGain = Math.min(restore, Math.max(0, target.maxMp - target.mp));
                target.mp = Math.min(target.maxMp, target.mp + restore);
                flashSelectedUnitPanel('heal');
                if (mpGain > 0) showFloatingTextForUnit(target, `+${mpGain} MP`, 'mp');
                addLog(`${unitDisplayName(unit)} uses Mana Potion on ${unitDisplayName(target)}, restoring ${mpGain} MP.`);
            } else if (state.selectedTool === 'scanner') {
                if (unit.items.scanner <= 0) {
                    addLog('No scanners left.');
                    playErrorSfx();
                    return;
                }
                if (chebyshev > 0) {
                    addLog('Scanner currently centers on the acting unit.');
                    playErrorSfx();
                    return;
                }
                const effectiveAwr = getEffectiveAwr(unit);
                if (effectiveAwr <= 0) {
                    addLog(`${unitDisplayName(unit)} cannot use Scanner while jammed.`);
                    playErrorSfx();
                    return;
                }
                playSfx('uiConfirm');
                resetBoardCamera();
                pushUndoSnapshot(true); // boundary — scanner reveals info
                unit.items.scanner -= 1;
                const scanRadius = 1; // 3x3 area
                const area = getSquareArea(x, y, scanRadius);
                for (const tile of area) {
                    const key = scanKey(tile.x, tile.y);
                    state.scannedByPlayer[unit.player].add(key);
                }
                const side = scanRadius * 2 + 1;
                // ── XP: scan ──
                grantXP(unit, XP_SCAN, 'scan');
                // ── HOT/COLD hourglass hint ──
                const remaining = state.hourglasses.filter(h => h.carriedBy === null && !h.visibleTo[unit.player]);
                if (remaining.length > 0) {
                    let bestDist = Infinity;
                    for (const h of remaining) {
                        const dist = Math.abs(h.x - unit.x) + Math.abs(h.y - unit.y);
                        if (dist < bestDist) bestDist = dist;
                    }
                    let temp;
                    if (bestDist <= 3) temp = '🔴 SCORCHING — An hourglass is very close!';
                    else if (bestDist <= 6) temp = '🟠 HOT — An hourglass is nearby.';
                    else if (bestDist <= 10) temp = '🟡 WARM — An hourglass is in the area.';
                    else if (bestDist <= 16) temp = '🔵 COOL — An hourglass is fairly far away.';
                    else temp = '❄️ FREEZING — Hourglasses are very far away.';
                    addLog(`📡 Scanner detects hourglass energy: ${temp}`, unit.player);
                    showFloatingTextForUnit(unit, bestDist <= 3 ? '🔴 SCORCHING' : bestDist <= 6 ? '🟠 HOT' : bestDist <= 10 ? '🟡 WARM' : bestDist <= 16 ? '🔵 COOL' : '❄️ COLD', 'buff', { durationMs: 1800 });
                } else {
                    addLog(`Scanner sweep finds nothing in the ${side}x${side} area.`, unit.player);
                }
                // Camera hold on scanned area so player can see results
                focusBoardCameraOnTiles([{
                    x,
                    y
                }], {
                    zoom: getWideZoom(),
                    holdMs: 1800
                });
                // Delay unit-done check so scan results stay visible
                spendAP(unit, AP_COST_ACTION);
                if (!unit._itemLog) unit._itemLog = {};
                unit._itemLog['scanner'] = (unit._itemLog['scanner'] || 0) + 1;
                state.actionMode = null;
                state.actionMenuView = 'root';
                state.selectedTool = null;
                state.pendingTarget = null;
                renderBattleUpdate();
                const _scanUnit = unit;
                window.setTimeout(() => {
                    endUnitIfDone(_scanUnit);
                    renderBattleUpdate();
                }, 1600);
                return;
            } else if (ITEM_RULES[state.selectedTool]?.baneType) {
                // ── Type-Bane items: throwable damage items ──
                const baneKey = state.selectedTool;
                const baneRule = ITEM_RULES[baneKey];
                if ((unit.items[baneKey] || 0) <= 0) {
                    addLog(`No ${baneRule.name} left.`);
                    playErrorSfx();
                    return;
                }
                if (!target || target.player === unit.player || target.dead) {
                    addLog(`Choose a living enemy for ${baneRule.name}.`);
                    playErrorSfx();
                    return;
                }
                const baneRange = getEffectiveRange(unit) + 1;
                if (chebyshev > baneRange) {
                    addLog(`Target is out of range for ${baneRule.name}.`);
                    playErrorSfx();
                    return;
                }
                focusUnitPanel(target.id);
                playSfx('fireball');
                resetBoardCamera();
                pushUndoSnapshot(true);
                unit.items[baneKey] -= 1;
                const isBaneEffective = (target.types || []).includes(baneRule.baneType);
                let damage = baneRule.baseDmg + (isBaneEffective ? baneRule.baneDmg : 0);
                damage = Math.max(1, damage - Math.floor((target.def || 0) * 0.3));
                playProjectileToUnit(unit, target, 'proj-bane-' + baneRule.baneType);
                applyDamageToUnit(target, damage, `${unitDisplayName(unit)} throws ${baneRule.name} at `, {
                    sourceUnit: unit,
                    allowMarkBonus: false,
                    damageType: 'magic'
                });
                if (isBaneEffective) {
                    const _bSprite = baneRule.baneType ? `<div class="bane-sprite bane-${baneRule.baneType}" style="width:16px;height:16px;background-size:16px 16px;display:inline-block;vertical-align:middle"></div>` : '';
                    addLog(`${_bSprite} It's super effective against ${target.types.join('/')} type!`, unit.player);
                    showFloatingTextForUnit(target, `${_bSprite} SUPER EFFECTIVE!`, 'streak');
                }
            } else {
                addLog('No item selected.');
                return;
            }

            spendAP(unit, AP_COST_ACTION);
            if (!unit._itemLog) unit._itemLog = {};
            unit._itemLog[state.selectedTool || 'unknown'] = (unit._itemLog[state.selectedTool || 'unknown'] || 0) + 1;
            state.actionMode = null;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            state.pendingTarget = null;
            endUnitIfDone(unit);
            renderBattleUpdate();
        }

        function doSpell(unit, x, y) {
            if (!canUnitAct(unit)) {
                addLog('That unit already acted this round.');
                return 0;
            }
            const spell = (unit.spells || []).find(s => s.name === state.selectedTool) || (unit._raceAbilities || []).find(s => s.name === state.selectedTool);
            if (!spell) {
                addLog('No spell selected.');
                state._teleportingUnit = null;
                playErrorSfx();
                return 0;
            }
            // Clear teleport state if switching to a non-teleport spell
            if (spell.kind !== 'teleport') state._teleportingUnit = null;
            if (unitHasStatus(unit, 'silence')) {
                addLog(`${unitDisplayName(unit)} is silenced and cannot cast spells this turn.`);
                state._teleportingUnit = null;
                return 0;
            }
            const d = Math.abs(unit.x - x) + Math.abs(unit.y - y);
            // 2×2 boss: use minimum distance to any occupied tile
            const _spellClickTarget = unitAt(x, y);
            const dEff = (_spellClickTarget && _spellClickTarget._isBoss && _spellClickTarget._bossSize === 2)
                ? distToTarget(unit.x, unit.y, _spellClickTarget) : d;
            const minRange = (['heal', 'shield', 'buff', 'scan', 'summonWeather', 'bomb', 'healAll', 'aoe', 'barrage', 'seedHeal', 'seedPoison', 'leechSeed', 'warpRune', 'teleport', 'deployTurret', 'buildBridge', 'warCry', 'encore', 'remoteView', 'selfHeal', 'escape', 'cleanse', 'aoeShield', 'zoneHeal', 'zoneDebuff', 'cross', 'delayed', 'deployObject', 'deployPair', 'terrainCreate'].includes(spell.kind)) ? 0 : 1;
            // Teleport Phase 2: skip general range/LOS — destination is validated in teleport handler
            const isTeleportPhase2 = spell.kind === 'teleport' && state._teleportingUnit;
            if (!isTeleportPhase2) {
                if (dEff < minRange || dEff > spell.range) {
                    addLog('Spell target is out of range.');
                    state._teleportingUnit = null;
                    playErrorSfx();
                    return 0;
                }
                // Teleport Phase 1 also skips terrain LOS (psychic powers bypass mountains)
                if (spell.kind !== 'teleport' && d >= 1 && isRangeBlockedByTerrain(unit.x, unit.y, x, y)) {
                    addLog('Mountain terrain blocks the spell path.');
                    playErrorSfx();
                    return 0;
                }
            }
            // Fog of War: human players can't target fogged tiles with offensive spells
            // (telescope sky targets bypass ground-fog check, just like basic attacks)
            const _isSpellSkyTelescopeTarget = unitHasTelescope(unit) && getSectionForUnit(unit) === 'earth' && true &&
                state.units.some(u => !u.dead && u.player !== unit.player && getSectionForUnit(u) === 'above' && u.x === x && u.y === y);
            if (state.fogOfWar && !state.autoPlayers?.[unit.player] && !isTeleportPhase2 && d > 0) {
                if (!isInVision(unit, x, y) && !_isSpellSkyTelescopeTarget && !['heal', 'shield', 'buff', 'healAll', 'scan'].includes(spell.kind)) {
                    addLog('Target is hidden in the fog.');
                    state._teleportingUnit = null;
                    playErrorSfx();
                    return 0;
                }
            }
            // ── Telescope vision: reveal tiles around sky spell target so animation is visible ──
            if (_isSpellSkyTelescopeTarget && state.fogOfWar && !state.devAutoSim) {
                if (!state._fogRevealTiles) state._fogRevealTiles = new Set();
                const _teleVr = getUnitVisionRange(unit);
                const _revR = Math.max(3, _teleVr);
                for (let _dy = -_revR; _dy <= _revR; _dy++) {
                    for (let _dx = -_revR; _dx <= _revR; _dx++) {
                        if (Math.abs(_dx) + Math.abs(_dy) <= _revR) {
                            state._fogRevealTiles.add(posKey(x + _dx, y + _dy));
                        }
                    }
                }
                state._fogRevealTiles.add(posKey(unit.x, unit.y));
                scheduleBoardRender();
                clearTimeout(state._fogRevealTimer);
                state._fogRevealTimer = setTimeout(() => {
                    state._fogRevealTiles = null;
                    scheduleBoardRender();
                }, 3500);
            }
            if (!canAffordSpell(unit, spell)) {
                const needed = getSpellApCost(spell);
                addLog(`Not enough action points to cast that spell (requires ${needed} AP).`);
                state._teleportingUnit = null;
                playErrorSfx();
                return 0;
            }
            const discordPenalty = getStatusMpCostDelta(unit);
            const effectiveSpellCost = spell.cost + discordPenalty;
            if (unit.mp < effectiveSpellCost) {
                addLog(discordPenalty > 0 ? `Not enough MP. Discord increases spell cost by ${discordPenalty}.` : 'Not enough MP.');
                state._teleportingUnit = null;
                playErrorSfx();
                return 0;
            }

            // ── Undo: boundary — all spells change game state ──
            pushUndoSnapshot(true);

            // ── Break camouflage on offensive spell ──
            if (unitHasStatus(unit, 'invisible') && ['damage', 'ricochet', 'multiHit', 'aoe', 'barrage', 'lifeDrain', 'debuff'].includes(spell.kind)) {
                clearStatus(unit, 'invisible');
                addLog(`${unitDisplayName(unit)} breaks camouflage!`);
            }

            const spellPower = (unit.spellPower || 0) + getHourglassPower(unit);
            let panelFocusTarget = null;
            let completionDelay = 0;
            const spellApCost = getSpellApCost(spell);
            const finishAction = () => {
                unit._trackSpellsCast = (unit._trackSpellsCast || 0) + 1;
                // ── XP: successful spell cast ──
                grantXP(unit, XP_SPELL_CAST, 'spell');
                if (!unit._spellLog) unit._spellLog = {};
                unit._spellLog[spell.id] = (unit._spellLog[spell.id] || 0) + 1;
                // Track last spell for Mimic
                state._lastSpellCast = { spellId: spell.id, caster: unit.id, player: unit.player };
                spendAP(unit, spellApCost);
                state.actionMode = null;
                state.actionMenuView = 'root';
                state.selectedTool = null;
                state.pendingTarget = null;
                checkWin();
                endUnitIfDone(unit);
                renderBattleUpdate();
            };

            if (spell.kind === 'damage') {
                let target = unitAt(x, y);
                // ── Telescope: if no ground target, check for sky enemy (same as doAttack) ──
                if (!target && unitHasTelescope(unit) && getSectionForUnit(unit) === 'earth' && true) {
                    const _skySpellTarget = state.units.find(u => !u.dead && u.player !== unit.player && getSectionForUnit(u) === 'above' && u.x === x && u.y === y);
                    if (_skySpellTarget) {
                        const _svr = getUnitVisionRange(unit);
                        if ((Math.abs(unit.x - x) + Math.abs(unit.y - y)) <= _svr) target = _skySpellTarget;
                    }
                }
                // ── Tower targeting: if no unit, check for enemy tower ──
                const _spellTower = !target ? towerAt(x, y) : null;
                if (_spellTower && _spellTower.owner !== unit.player) {
                    pushUndoSnapshot(true);
                    playSfx('fireball');
                    resetBoardCamera();
                    unit.mp -= effectiveSpellCost;
                    let tDmg = Math.max(32, (spell.dmg || 0) + spellPower + Math.floor(Math.random() * 40) - 16);
                    tDmg = Math.max(1, tDmg - (_spellTower.def || 0));
                    tDmg = Math.max(1, Math.round(tDmg * getTowerDamageMultiplier(_spellTower.owner)));
                    _spellTower.hp = Math.max(0, _spellTower.hp - tDmg);
                    const _stShields = getTowerShieldLayers(_spellTower.owner);
                    const _stMsg = _stShields > 0 ? ` [${getTowerShieldLabel(_spellTower.owner)}]` : '';
                    addLog(`🐉 ${unitDisplayName(unit)} casts ${spell.name} on Player ${_spellTower.owner}'s Dragon for ${tDmg} damage!${_stMsg} (Dragon HP: ${_spellTower.hp}/${_spellTower.maxHp})`);
                    // ── XP: tower damage via spell (flat per hit) ──
                    grantXP(unit, XP_TOWER_DAMAGE_FLAT, 'towerDmg');
                    showFloatingTextAtTile(x, y, `-${tDmg}`, 'damage');
                    window.setTimeout(() => {
                        finishAction();
                    }, actionMs(400));
                    return 1;
                }
                if (!target || target.player === unit.player) {
                    addLog('Choose an enemy target for that spell.');
                    playErrorSfx();
                    return 0;
                }
                panelFocusTarget = target;
                focusUnitPanel(target.id);
                playSfx('fireball');
                const cam = playOffensiveActionCamera(unit, target, {
                    sourceHold: 900,
                    targetHold: 900,
                    attackName: spell.name
                });
                const projectileDelay = Math.max(0, cam?.sourceHold ?? actionMs(900));
                const impactDelay = Math.max((cam?.sourceHold ?? actionMs(900)) + (cam?.travelMs ?? actionMs(480)) + actionMs(80), actionMs(620));
                completionDelay = Math.max(impactDelay + actionMs(120), (cam?.totalMs ?? (impactDelay + actionMs(360))) + actionMs(120));
                window.setTimeout(() => playProjectileToUnit(unit, target, 'damage', cam?.travelMs ?? actionMs(480), spell.spellType), projectileDelay);
                unit.mp -= effectiveSpellCost;
                window.setTimeout(() => {
                    if (spell.chainProfile?.length) {
                        const allEnemies = aliveUnitsFor(enemyOf(unit.player));
                        let current = target;
                        spell.chainProfile.forEach((baseDamage, idx) => {
                            if (!current || current.dead) return;
                            applyDamageToUnit(current, Math.max(16, baseDamage + spellPower), idx === 0 ? `${unitDisplayName(unit)} casts ${spell.name}: ` : `${spell.name} chains to `, {
                                sourceUnit: unit,
                                allowMarkBonus: false,
                                ignoreArmor: !!spell.ignoreArmor,
                                statusEffects: idx === 0 ? spell.statusEffects : null,
                                damageType: spell.damageType || 'magic',
                                spellType: spell.spellType || null
                            });
                            const nextTargets = allEnemies.filter(enemy => !enemy.dead && enemy.id !== current.id && Math.abs(enemy.x - current.x) + Math.abs(enemy.y - current.y) <= (spell.chainRadius || 1));
                            current = nextTargets.sort((a, b) => a.hp - b.hp)[0] || null;
                        });
                    } else {
                        let damage = Math.max(32, (spell.dmg || 0) + spellPower + Math.floor(Math.random() * 40) - 16);
                        if (spell.actedTargetBonus && unitFinished(target)) damage += spell.actedTargetBonus;
                        // Radiant Bolt: bonus damage vs unholy/anomaly types
                        if (spell.unholyBonus && target.types && (target.types.includes('unholy') || target.types.includes('anomaly'))) damage += spell.unholyBonus;
                        // Water bonus: +50% damage from water tiles
                        if (spell.waterBonus && getTerrainAt(unit.x, unit.y) === 'water') damage = Math.floor(damage * 1.5);
                        applyDamageToUnit(target, damage, `${unitDisplayName(unit)} casts ${spell.name}: `, {
                            sourceUnit: unit,
                            allowMarkBonus: false,
                            ignoreArmor: !!spell.ignoreArmor,
                            statusEffects: spell.statusEffects,
                            damageType: spell.damageType || 'magic',
                            spellType: spell.spellType || null
                        });
                        if (_activeCinematic?.showDamage) _activeCinematic.showDamage(`-${damage}`, false);
                        if (target.dead && _activeCinematic?.showKO) _activeCinematic.showKO();
                    }
                    // Charge-to-target: move caster adjacent to the target after hit
                    if (spell.chargeToTarget && !unit.dead) {
                        const adj = [{
                                x: target.x - 1,
                                y: target.y
                            }, {
                                x: target.x + 1,
                                y: target.y
                            },
                            {
                                x: target.x,
                                y: target.y - 1
                            }, {
                                x: target.x,
                                y: target.y + 1
                            }
                        ];
                        // Sort by distance to caster (prefer closest)
                        adj.sort((a, b) => (Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y)) - (Math.abs(b.x - unit.x) + Math.abs(b.y - unit.y)));
                        const landTile = adj.find(t => canOccupy(t.x, t.y));
                        if (landTile) {
                            unit.x = landTile.x;
                            unit.y = landTile.y;
                            unit._trackTilesMoved = (unit._trackTilesMoved || 0) + 1;
                            addLog(`${unitDisplayName(unit)} charges to ${coordLabel(landTile.x, landTile.y)}.`);
                        }
                        // Swap positions if spell has swapOnHit (e.g. Boarding Rush)
                        if (spell.swapOnHit && !target.dead) {
                            const behindTarget = { x: target.x + Math.sign(target.x - unit.x), y: target.y + Math.sign(target.y - unit.y) };
                            if (isInside(behindTarget.x, behindTarget.y) && canOccupy(behindTarget.x, behindTarget.y)) {
                                const ux = unit.x, uy = unit.y;
                                unit.x = target.x; unit.y = target.y;
                                target.x = ux; target.y = uy;
                                addLog(`${unitDisplayName(unit)} swaps positions with ${unitDisplayName(target)}!`);
                                showFloatingTextForUnit(unit, 'SWAP!', 'streak', { durationMs: 800 });
                            }
                        }
                    }
                    // Self-stun: caster skips next turn (e.g. Headshot recoil)
                    if (spell.selfStun && !unit.dead) {
                        applyStatusEffects(unit, [{ id: 'stun', duration: spell.selfStun }], `${spell.name} recoil: `, unit);
                    }
                }, impactDelay);
            } else if (spell.kind === 'heal') {
                const target = unitAt(x, y);
                if (!target || target.player !== unit.player || target.dead) {
                    addLog('Choose a living ally to heal.');
                    playErrorSfx();
                    return 0;
                }
                panelFocusTarget = target;
                focusUnitPanel(target.id);
                playSfx('healRegen');
                resetBoardCamera();
                if (target.id !== unit.id) playProjectileToUnit(unit, target, 'heal', actionMs(400), spell.spellType);
                unit.mp -= effectiveSpellCost;
                let healAmount = (spell.heal || 0) + getEffectiveHealBonus(unit, spell.heal || 0, target) + getHourglassPower(unit);
                if (spell.lowHpBonus && target.hp / target.maxHp < 0.4) healAmount += spell.lowHpBonus;
                const healed = applyHealingToUnit(target, healAmount, unit);
                addLog(`${unitDisplayName(unit)} casts ${spell.name}, restoring ${healed} HP to ${unitDisplayName(target)}.`);
            } else if (spell.kind === 'shield') {
                const target = unitAt(x, y);
                if (!target || target.player !== unit.player || target.dead) {
                    addLog('Choose a living ally to shield.');
                    playErrorSfx();
                    return 0;
                }
                panelFocusTarget = target;
                focusUnitPanel(target.id);
                playSfx('manaRegen');
                resetBoardCamera();
                if (target.id !== unit.id) playProjectileToUnit(unit, target, 'shield', actionMs(400), spell.spellType);
                unit.mp -= effectiveSpellCost;
                const shieldCap = Math.ceil(target.maxHp * (spell.shieldCapPct || 0.5));
                const shieldGain = Math.min((spell.shield || 0) + getHourglassPower(unit), Math.max(0, shieldCap - target.shield));
                target.shield += shieldGain;
                addLog(`${unitDisplayName(unit)} grants ${unitDisplayName(target)} a ${shieldGain} HP shield.`);
            } else if (spell.kind === 'buff') {
                const target = unitAt(x, y);
                if (!target || target.player !== unit.player || target.dead) {
                    addLog('Choose a living ally for that spell.');
                    playErrorSfx();
                    return 0;
                }
                panelFocusTarget = target;
                focusUnitPanel(target.id);
                playSfx('healRegen');
                resetBoardCamera();
                if (target.id !== unit.id) playProjectileToUnit(unit, target, 'shield', actionMs(400), spell.spellType);
                unit.mp -= effectiveSpellCost;
                applyStatusEffects(target, spell.statusEffects, `${spell.name}: `, unit);
            } else if (spell.kind === 'debuff') {
                const target = unitAt(x, y);
                if (!target || target.player === unit.player) {
                    addLog('Choose an enemy target for that spell.');
                    playErrorSfx();
                    return 0;
                }
                panelFocusTarget = target;
                focusUnitPanel(target.id);
                playSfx('fireball');
                const cam = playOffensiveActionCamera(unit, target, {
                    sourceHold: 900,
                    targetHold: 900,
                    attackName: spell.name
                });
                const projectileDelay = Math.max(0, cam?.sourceHold ?? actionMs(900));
                const impactDelay = Math.max((cam?.sourceHold ?? actionMs(900)) + (cam?.travelMs ?? actionMs(480)) + actionMs(80), actionMs(620));
                completionDelay = Math.max(impactDelay + actionMs(120), (cam?.totalMs ?? (impactDelay + actionMs(360))) + actionMs(120));
                window.setTimeout(() => playProjectileToUnit(unit, target, 'proj-debuff', cam?.travelMs ?? actionMs(480), spell.spellType), projectileDelay);
                unit.mp -= effectiveSpellCost;
                window.setTimeout(() => {
                    if (spell.dmg) {
                        const _debDmg = spell.dmg + spellPower;
                        applyDamageToUnit(target, _debDmg, `${unitDisplayName(unit)} casts ${spell.name}: `, {
                            sourceUnit: unit,
                            allowMarkBonus: false,
                            damageType: spell.damageType || 'magic',
                            spellType: spell.spellType || null
                        });
                        if (_activeCinematic?.showDamage) _activeCinematic.showDamage(`-${_debDmg}`, false);
                    }
                    // Psychic passive: Third Eye — Glare debuffs get +1 duration
                    let effectsToApply = spell.statusEffects;
                    if (unit.cls === 'Psychic' && effectsToApply) {
                        effectsToApply = effectsToApply.map(e => e.id === 'glare' ? {
                            ...e,
                            duration: (e.duration || 2) + 1
                        } : e);
                    }
                    applyStatusEffects(target, effectsToApply, `${spell.name}: `, unit);
                }, impactDelay);
            } else if (spell.kind === 'revive') {
                const target = state.units.find(u => u.player === unit.player && u.dead && u.x === x && u.y === y);
                if (!target) {
                    addLog('Choose a fallen ally tile to revive.');
                    playErrorSfx();
                    return 0;
                }
                if (spell.oneRevivePerUnitPerMatch && target.reviveLocked) {
                    addLog(`${unitDisplayName(target)} cannot be revived again this match.`);
                    playErrorSfx();
                    return 0;
                }
                panelFocusTarget = target;
                focusUnitPanel(target.id);
                playSfx('healRegen');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                target.dead = false;
                target.hp = Math.max(1, Math.round(target.maxHp * getEffectiveRevivePct(unit, spell.revivePct || 0.35)));
                target.shield = 0;
                target.reviveLocked = !!spell.oneRevivePerUnitPerMatch;
                removeDebuffs(target);
                flashHeal(target);
                showFloatingTextForUnit(target, `+${target.hp}`, 'revive');
                addLog(`${unitDisplayName(unit)} revives ${unitDisplayName(target)} with ${target.hp} HP.`);
            } else if (spell.kind === 'bomb') {
                const _bombOccupant = unitAt(x, y);
                if (_bombOccupant && _bombOccupant.player === unit.player) {
                    addLog('Cannot place a bomb on a friendly unit.');
                    playErrorSfx();
                    return 0;
                }
                const ownedBombs = state.bombs.filter(b => b.ownerUnitId === unit.id);
                if (ownedBombs.length >= (spell.maxActivePerCaster || 2)) state.bombs = state.bombs.filter(b => b !== ownedBombs[0]);
                if (state.bombs.some(b => b.x === x && b.y === y)) {
                    addLog('There is already a bomb on that tile.');
                    playErrorSfx();
                    return 0;
                }
                playSfx('uiConfirm');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                state.bombs.push({
                    x,
                    y,
                    owner: unit.player,
                    ownerUnitId: unit.id,
                    dmg: spell.dmg + spellPower,
                    radius: spell.blastRadius || 1
                });
                addLog(`${unitDisplayName(unit)} places a bomb at ${coordLabel(x, y)}.`, unit.player);
            } else if (spell.kind === 'scan') {
                const effectiveAwr = getEffectiveAwr(unit);
                if (effectiveAwr <= 0) {
                    addLog(`${unitDisplayName(unit)} cannot emit Scan Pulse while jammed.`);
                    playErrorSfx();
                    return 0;
                }
                const radius = 1; // 3x3 area
                playSfx('uiConfirm');
                unit.mp -= effectiveSpellCost;
                const side = radius * 2 + 1;
                // Scan Pulse only marks tiles as scanned and gives hot/cold hint — no hourglass reveal
                for (let yy = Math.max(0, unit.y - radius); yy <= Math.min(bh() - 1, unit.y + radius); yy++) {
                    for (let xx = Math.max(0, unit.x - radius); xx <= Math.min(bw() - 1, unit.x + radius); xx++) {
                        state.scannedByPlayer[unit.player].add(scanKey(xx, yy));
                    }
                }
                const remaining = state.hourglasses.filter(h => h.carriedBy === null);
                if (remaining.length > 0) {
                    let bestDist = Infinity;
                    for (const h of remaining) {
                        const dist = Math.abs(h.x - unit.x) + Math.abs(h.y - unit.y);
                        if (dist < bestDist) bestDist = dist;
                    }
                    let temp;
                    if (bestDist <= 3) temp = '🔴 SCORCHING — An hourglass is very close!';
                    else if (bestDist <= 6) temp = '🟠 HOT — An hourglass is nearby.';
                    else if (bestDist <= 10) temp = '🟡 WARM — An hourglass is in the area.';
                    else if (bestDist <= 16) temp = '🔵 COOL — An hourglass is fairly far away.';
                    else temp = '❄️ FREEZING — Hourglasses are very far away.';
                    addLog(`${unitDisplayName(unit)} emits Scan Pulse (${side}x${side}). ${temp}`, unit.player);
                    showFloatingTextForUnit(unit, bestDist <= 3 ? '🔴 SCORCHING' : bestDist <= 6 ? '🟠 HOT' : bestDist <= 10 ? '🟡 WARM' : bestDist <= 16 ? '🔵 COOL' : '❄️ COLD', 'buff', { durationMs: 1800 });
                } else {
                    addLog(`${unitDisplayName(unit)} emits Scan Pulse (${side}x${side}). No hourglasses remain.`, unit.player);
                }
                // Camera hold on scanned area so player can see results
                focusBoardCameraOnTiles([{
                    x: unit.x,
                    y: unit.y
                }], {
                    zoom: getWideZoom(),
                    holdMs: 1800
                });
                completionDelay = actionMs(1600);
            } else if (spell.kind === 'summonWeather') {
                if (!isInside(x, y)) {
                    addLog('Choose a tile on the map.');
                    playErrorSfx();
                    return 0;
                }
                playSfx('fireball');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                const wType = spell.weatherType || 'thunderstorm';
                const wDef = WEATHER_REGISTRY[wType];
                const dur = spell.weatherDuration ?
                    spell.weatherDuration[0] + randInt(spell.weatherDuration[1] - spell.weatherDuration[0] + 1) :
                    3;
                const tiles = rollWeatherTiles(spell.weatherTiles || wDef.tiles, null);
                // Re-center tiles around the target
                const seedX = tiles[0]?.x || x,
                    seedY = tiles[0]?.y || y;
                const dx = x - seedX,
                    dy = y - seedY;
                const size = bw(),
                    sizeH = bh();
                const shifted = tiles.map(t => ({
                    x: Math.max(0, Math.min(size - 1, t.x + dx)),
                    y: Math.max(0, Math.min(sizeH - 1, t.y + dy))
                }));
                const seen = new Set();
                const deduped = shifted.filter(t => {
                    const k = posKey(t.x, t.y);
                    if (seen.has(k)) return false;
                    seen.add(k);
                    return true;
                });
                const direction = wDef.roaming ? rollWeatherDirection() : null;
                const weather = {
                    type: wType,
                    tiles: deduped,
                    direction,
                    remaining: dur,
                    id: `w_${Date.now()}_${randInt(9999)}`
                };
                if (!state.activeWeather) state.activeWeather = [];
                state.activeWeather.push(weather);
                addLog(`${unitDisplayName(unit)} casts ${spell.name}! A ${wDef.label} ${wDef.icon} forms at ${coordLabel(x, y)}. ${wDef.desc}`);
                queueAnnouncement(`${wDef.icon} ${wDef.label}`, `Summoned by ${unitDisplayName(unit)}`, 'weather');
            } else if (spell.kind === 'multiHit') {
                const target = unitAt(x, y);
                // ── Tower targeting for multiHit ──
                const _mhTower = !target ? towerAt(x, y) : null;
                if (_mhTower && _mhTower.owner !== unit.player) {
                    pushUndoSnapshot(true);
                    playSfx('fireball');
                    resetBoardCamera();
                    unit.mp -= effectiveSpellCost;
                    const hits = spell.hitDamages || [8, 8];
                    let totalTDmg = 0;
                    const _mhShieldMult = getTowerDamageMultiplier(_mhTower.owner);
                    for (const base of hits) {
                        let tDmg = Math.max(16, base + spellPower);
                        tDmg = Math.max(1, tDmg - (_mhTower.def || 0));
                        tDmg = Math.max(1, Math.round(tDmg * _mhShieldMult));
                        _mhTower.hp = Math.max(0, _mhTower.hp - tDmg);
                        totalTDmg += tDmg;
                    }
                    const _mhSL = getTowerShieldLayers(_mhTower.owner);
                    const _mhSMsg = _mhSL > 0 ? ` [${getTowerShieldLabel(_mhTower.owner)}]` : '';
                    addLog(`🐉 ${unitDisplayName(unit)} casts ${spell.name} on Player ${_mhTower.owner}'s Dragon for ${totalTDmg} total damage!${_mhSMsg} (Dragon HP: ${_mhTower.hp}/${_mhTower.maxHp})`);
                    showFloatingTextAtTile(x, y, `-${totalTDmg}`, 'damage');
                    window.setTimeout(() => {
                        finishAction();
                    }, actionMs(400));
                    return 1;
                }
                if (!target || target.player === unit.player) {
                    addLog('Choose an enemy target for that spell.');
                    playErrorSfx();
                    return 0;
                }
                panelFocusTarget = target;
                focusUnitPanel(target.id);
                playSfx('fireball');
                const cam = playOffensiveActionCamera(unit, target, {
                    sourceHold: 900,
                    targetHold: 900,
                    attackName: spell.name
                });
                const impactDelay = Math.max((cam?.sourceHold ?? actionMs(900)) + (cam?.travelMs ?? actionMs(480)) + actionMs(80), actionMs(620));
                const hits = spell.hitDamages || [8, 8];
                const hitGap = actionMs(340); // ms between each successive hit
                const lastHitTime = impactDelay + (hits.length - 1) * hitGap;
                completionDelay = Math.max(lastHitTime + actionMs(400), (cam?.totalMs ?? (lastHitTime + actionMs(360))) + actionMs(120));
                unit.mp -= effectiveSpellCost;
                hits.forEach((base, idx) => {
                    const hitTime = impactDelay + idx * hitGap;
                    // Fire a projectile for each hit (first is handled by camera, subsequent get their own)
                    if (idx > 0) {
                        window.setTimeout(() => {
                            if (target.dead) return;
                            playProjectileToUnit(unit, target, 'damage', actionMs(280), spell.spellType);
                            playSfx('fireball');
                        }, hitTime - actionMs(300));
                    }
                    window.setTimeout(() => {
                        if (target.dead) return;
                        let bonus = 0;
                        if (idx === 1 && unitHasStatus(target, 'marked')) bonus += spell.markedSecondHitBonus || 0;
                        const _mhDmg = base + bonus;
                        applyDamageToUnit(target, _mhDmg, idx === 0 ? `${unitDisplayName(unit)} casts ${spell.name}: ` : `${spell.name} hit ${idx + 1}: `, {
                            sourceUnit: unit,
                            damageType: spell.damageType || 'physical',
                            spellType: spell.spellType || null
                        });
                        if (idx === 0 && _activeCinematic?.showDamage) _activeCinematic.showDamage(`-${_mhDmg}`, false);
                    }, hitTime);
                });
            } else if (spell.kind === 'ricochet') {
                const first = unitAt(x, y);
                // ── Tower targeting for ricochet ──
                const _ricTower = !first ? towerAt(x, y) : null;
                if (_ricTower && _ricTower.owner !== unit.player) {
                    pushUndoSnapshot(true);
                    playSfx('fireball');
                    resetBoardCamera();
                    unit.mp -= effectiveSpellCost;
                    let tDmg = Math.max(32, (spell.dmg || 0) + spellPower + Math.floor(Math.random() * 40) - 16);
                    tDmg = Math.max(1, tDmg - (_ricTower.def || 0));
                    tDmg = Math.max(1, Math.round(tDmg * getTowerDamageMultiplier(_ricTower.owner)));
                    _ricTower.hp = Math.max(0, _ricTower.hp - tDmg);
                    const _ricSMsg = getTowerShieldLayers(_ricTower.owner) > 0 ? ` [${getTowerShieldLabel(_ricTower.owner)}]` : '';
                    addLog(`🐉 ${unitDisplayName(unit)} casts ${spell.name} on Player ${_ricTower.owner}'s Dragon for ${tDmg} damage!${_ricSMsg} (Dragon HP: ${_ricTower.hp}/${_ricTower.maxHp})`);
                    showFloatingTextAtTile(x, y, `-${tDmg}`, 'damage');
                    window.setTimeout(() => {
                        finishAction();
                    }, actionMs(400));
                    return 1;
                }
                if (!first || first.player === unit.player) {
                    addLog('Choose the first enemy target for Ricochet.');
                    playErrorSfx();
                    return 0;
                }
                panelFocusTarget = first;
                focusUnitPanel(first.id);
                playSfx('fireball');
                const cam = playOffensiveActionCamera(unit, first, {
                    sourceHold: 1200,
                    targetHold: 900,
                    attackName: spell.name
                });
                const projectileDelay = Math.max(0, cam?.sourceHold ?? actionMs(900));
                const impactDelay = Math.max((cam?.sourceHold ?? actionMs(900)) + (cam?.travelMs ?? actionMs(480)) + actionMs(80), actionMs(620));
                const bounceProjectileMs = actionMs(420); // travel time for the bounce projectile
                const bounceDelay = impactDelay + actionMs(380); // pause after first hit before bounce fires
                const bounceImpact = bounceDelay + bounceProjectileMs + actionMs(60); // when bounce damage lands
                completionDelay = Math.max(bounceImpact + actionMs(300), (cam?.totalMs ?? (bounceImpact + actionMs(360))) + actionMs(120));
                window.setTimeout(() => playProjectileToUnit(unit, first, 'proj-ricochet', cam?.travelMs ?? actionMs(480), spell.spellType), projectileDelay);
                unit.mp -= effectiveSpellCost;
                // First hit lands
                window.setTimeout(() => {
                    const _ricDmg = (spell.dmg || 0) + spellPower;
                    applyDamageToUnit(first, _ricDmg, `Ricochet from ${unit.cls}: `, {
                        sourceUnit: unit,
                        damageType: spell.damageType || 'physical',
                        spellType: spell.spellType || null
                    });
                    if (_activeCinematic?.showDamage) _activeCinematic.showDamage(`-${_ricDmg}`, false);
                }, impactDelay);
                // Bounce: find target, fire projectile, then apply damage on arrival
                window.setTimeout(() => {
                    if (first.dead && first._dying) return; // first target gone
                    const others = state.units.filter(u => !u.dead && u.player !== unit.player && u.id !== first.id && Math.abs(u.x - first.x) + Math.abs(u.y - first.y) <= (spell.bounceRadius || 2));
                    if (others.length > 0) {
                        others.sort((a, b) => a.hp - b.hp);
                        const second = others[0];
                        playProjectile(first.x, first.y, second.x, second.y, 'proj-ricochet', bounceProjectileMs, spell.spellType);
                        playSfx('fireball');
                        // Damage lands when bounce projectile arrives
                        window.setTimeout(() => {
                            if (second.dead) return;
                            applyDamageToUnit(second, (spell.bounceDamage || 8) + spellPower, `Ricochet bounces to `, {
                                sourceUnit: unit,
                                damageType: spell.damageType || 'physical',
                                spellType: spell.spellType || null,
                                shieldIgnore: spell.bounceShieldIgnore || 0
                            });
                        }, bounceProjectileMs + actionMs(60));
                    }
                }, bounceDelay);
            } else if (spell.kind === 'healAll') {
                playSfx('healRegen');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                const allies = aliveUnitsFor(unit.player);
                let totalHealed = 0;
                for (const ally of allies) {
                    let healAmount = (spell.heal || 0) + getEffectiveHealBonus(unit, spell.heal || 0, ally) + getHourglassPower(unit);
                    healAmount = Math.min(healAmount, ally.maxHp - ally.hp);
                    if (healAmount > 0) {
                        const healed = applyHealingToUnit(ally, healAmount, unit);
                        totalHealed += healed;
                    }
                }
                addLog(`${unitDisplayName(unit)} casts ${spell.name}, restoring ${totalHealed} total HP across ${allies.length} allies.`);
            } else if (spell.kind === 'aoe') {
                playSfx('fireball');
                // Collect AoE targets for cinematic multi-defender display
                const _aoeArea = getSquareArea(x, y, spell.aoeRadius || 1);
                const _aoeTargets = [];
                for (const _at of _aoeArea) {
                    const _au = unitAt(_at.x, _at.y);
                    if (_au && _au.player !== unit.player) _aoeTargets.push(_au);
                }
                const _aoeFirst = _aoeTargets[0] || {
                    x,
                    y
                };
                const _aoeExtra = _aoeTargets.slice(1);
                const cam = playOffensiveActionCamera(unit, _aoeFirst, {
                    sourceHold: 900,
                    targetHold: 900,
                    extraTargets: _aoeExtra,
                    attackName: spell.name
                });
                const projectileDelay = Math.max(0, cam?.sourceHold ?? actionMs(900));
                const impactDelay = Math.max((cam?.sourceHold ?? actionMs(900)) + (cam?.travelMs ?? actionMs(480)) + actionMs(80), actionMs(620));
                completionDelay = Math.max(impactDelay + actionMs(200), (cam?.totalMs ?? (impactDelay + actionMs(360))) + actionMs(120));
                window.setTimeout(() => playProjectile(unit.x, unit.y, x, y, 'damage', cam?.travelMs ?? actionMs(480), spell.spellType), projectileDelay);
                // AoE ring at impact
                window.setTimeout(() => playAoeRing(x, y, spell.aoeRadius || 1, spell.spellType, actionMs(550)), impactDelay);
                unit.mp -= effectiveSpellCost;
                window.setTimeout(() => {
                    const area = getSquareArea(x, y, spell.aoeRadius || 1);
                    const _aoeWaterMult = (spell.waterBonus && getTerrainAt(unit.x, unit.y) === 'water') ? 1.5 : 1;
                    let hitCount = 0;
                    for (const tile of area) {
                        const target = unitAt(tile.x, tile.y);
                        if (target && target.player !== unit.player) {
                            let dmg = Math.max(32, Math.floor(((spell.dmg || 0) + spellPower + Math.floor(Math.random() * 40) - 16) * _aoeWaterMult));
                            applyDamageToUnit(target, dmg, `${unitDisplayName(unit)} casts ${spell.name}: `, {
                                sourceUnit: unit,
                                allowMarkBonus: false,
                                statusEffects: spell.statusEffects,
                                damageType: spell.damageType || 'magic',
                                spellType: spell.spellType || null
                            });
                            hitCount++;
                        }
                        // AoE tower damage
                        const _aoeTw = towerAt(tile.x, tile.y);
                        if (_aoeTw && _aoeTw.owner !== unit.player) {
                            let tDmg = Math.max(32, (spell.dmg || 0) + spellPower + Math.floor(Math.random() * 40) - 16);
                            tDmg = Math.max(1, tDmg - (_aoeTw.def || 0));
                            tDmg = Math.max(1, Math.round(tDmg * getTowerDamageMultiplier(_aoeTw.owner)));
                            _aoeTw.hp = Math.max(0, _aoeTw.hp - tDmg);
                            const _aoeSMsg = getTowerShieldLayers(_aoeTw.owner) > 0 ? ` [${getTowerShieldLabel(_aoeTw.owner)}]` : '';
                            addLog(`🐉 ${spell.name} blasts Player ${_aoeTw.owner}'s Dragon for ${tDmg}!${_aoeSMsg} (Dragon HP: ${_aoeTw.hp}/${_aoeTw.maxHp})`);
                            showFloatingTextAtTile(tile.x, tile.y, `-${tDmg}`, 'damage');
                            hitCount++;
                        }
                    }
                    if (hitCount === 0) addLog(`${spell.name} hits no enemies in the area.`);
                }, impactDelay);
            } else if (spell.kind === 'barrage') {
                playSfx('fireball');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                const _barrageWaterMult = (spell.waterBonus && getTerrainAt(unit.x, unit.y) === 'water') ? 1.5 : 1;
                const enemies = aliveUnitsFor(enemyOf(unit.player)).filter(e => {
                    const dist = Math.abs(e.x - unit.x) + Math.abs(e.y - unit.y);
                    return dist >= 1 && dist <= spell.range && !isRangeBlockedByTerrain(unit.x, unit.y, e.x, e.y);
                });
                if (enemies.length === 0) {
                    addLog(`${unitDisplayName(unit)} casts ${spell.name} but no enemies are in range.`);
                } else {
                    const barrageGap = actionMs(200);
                    enemies.forEach((enemy, idx) => {
                        window.setTimeout(() => {
                            if (enemy.dead) return;
                            let dmg = Math.max(32, Math.floor(((spell.dmg || 0) + spellPower + Math.floor(Math.random() * 40) - 16) * _barrageWaterMult));
                            playProjectileToUnit(unit, enemy, 'damage', actionMs(380), spell.spellType);
                            playSfx('fireball');
                            window.setTimeout(() => {
                                if (enemy.dead) return;
                                applyDamageToUnit(enemy, dmg, `${unitDisplayName(unit)}'s ${spell.name} hits `, {
                                    sourceUnit: unit,
                                    allowMarkBonus: false,
                                    statusEffects: spell.statusEffects,
                                    damageType: spell.damageType || 'physical',
                                    spellType: spell.spellType || null
                                });
                            }, actionMs(400));
                        }, idx * barrageGap);
                    });
                    addLog(`${spell.name} hits ${enemies.length} target${enemies.length > 1 ? 's' : ''}.`);
                    completionDelay = Math.max(actionMs(600), (enemies.length - 1) * barrageGap + actionMs(700));
                }
            }
            // ── CLEANSE (remove debuffs from ally) ──
            else if (spell.kind === 'cleanse') {
                const target = unitAt(x, y);
                if (!target || target.player !== unit.player) {
                    addLog('Invalid target for Cleanse.');
                    playErrorSfx();
                    return 0;
                }
                playSfx('healRegen');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                // Remove all debuffs
                const debuffKeys = getActiveStatusKeys(target).filter(k => STATUS_DEFS[k]?.kind === 'debuff');
                let cleansedCount = 0;
                for (const key of debuffKeys) {
                    clearStatus(target, key);
                    cleansedCount++;
                }
                addLog(`${unitDisplayName(unit)} cleanses ${unitDisplayName(target)}! Removed ${cleansedCount} debuff${cleansedCount !== 1 ? 's' : ''}.`);
                showFloatingTextForUnit(target, `✨ CLEANSED`, 'heal', { durationMs: 1200 });
                flashUnit(target.id, 'heal');
                completionDelay = actionMs(500);
            }
            // ── DISPLACEMENT (grab + throw enemy, e.g. Kinetic Hurl) ──
            else if (spell.kind === 'displacement') {
                const target = unitAt(x, y);
                if (!target || target.player === unit.player) {
                    addLog('Invalid target.');
                    playErrorSfx();
                    return 0;
                }
                panelFocusTarget = target;
                focusUnitPanel(target.id);
                playSfx('fireball');
                resetBoardCamera();
                playProjectileToUnit(unit, target, 'proj-pull-hook', actionMs(400), spell.spellType);
                unit.mp -= effectiveSpellCost;
                const cam = playOffensiveActionCamera(unit, target, { sourceHold: 600, targetHold: 900, attackName: spell.name });
                const impactDelay = cam ? cam.impactTime : actionMs(400);
                window.setTimeout(() => {
                    let damage = Math.max(32, (spell.dmg || 0) + spellPower + Math.floor(Math.random() * 32) - 16);
                    // Fling the target in a direction away from caster
                    const dx = Math.sign(target.x - unit.x) || 1;
                    const dy = Math.sign(target.y - unit.y);
                    const dist = spell.displaceDistance || 2;
                    let flung = 0;
                    let hitObstacle = false;
                    for (let i = 0; i < dist; i++) {
                        const nx = target.x + dx;
                        const ny = target.y + dy;
                        if (!isInside(nx, ny) || !isTerrainPassable(nx, ny)) { hitObstacle = true; break; }
                        if (unitAt(nx, ny)) { hitObstacle = true; break; }
                        target.x = nx;
                        target.y = ny;
                        flung++;
                    }
                    if (hitObstacle && spell.collisionBonus) damage += spell.collisionBonus;
                    applyDamageToUnit(target, damage, `${unitDisplayName(unit)} casts ${spell.name}: `, {
                        sourceUnit: unit,
                        damageType: spell.damageType || 'magic',
                        spellType: spell.spellType || null
                    });
                    if (hitObstacle) {
                        addLog(`${unitDisplayName(target)} slams into an obstacle for bonus damage!`);
                        showFloatingTextForUnit(target, 'COLLISION!', 'streak', { durationMs: 1000 });
                    }
                    scheduleBoardRender();
                }, impactDelay);
                completionDelay = actionMs(1200);
            }
            // ══════════════════════════════════════════════════════════
            // ── NEW SPELL KINDS (Spell Overhaul Phase 3) ──
            // ══════════════════════════════════════════════════════════

            // ── LINE (damage all in a straight line from caster) ──
            else if (spell.kind === 'line' || spell.kind === 'linePush') {
                playSfx('fireball');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                const dx = Math.sign(x - unit.x);
                const dy = Math.sign(y - unit.y);
                // If target is self (range 0), pick a direction — shouldn't happen but safeguard
                if (dx === 0 && dy === 0) { addLog('Invalid line direction.'); completionDelay = 200; }
                else {
                    const lineRange = spell.range || 4;
                    playBeamEffect(unit.x, unit.y, dx, dy, lineRange, spell.spellType, actionMs(500));
                    const hitTargets = [];
                    let cx = unit.x + dx, cy = unit.y + dy;
                    for (let i = 0; i < lineRange; i++) {
                        if (!isInside(cx, cy)) break;
                        if (!isTerrainPassable(cx, cy) && !spell.destroysObstacles) break;
                        const hit = unitAt(cx, cy);
                        if (hit && hit.player !== unit.player && !hit.dead) {
                            hitTargets.push(hit);
                        }
                        // Leave terrain if specified
                        if (spell.leaveTerrain) setTerrainAt(cx, cy, spell.leaveTerrain);
                        cx += dx;
                        cy += dy;
                    }
                    const baseDmg = Math.max(32, (spell.dmg || 0) + spellPower);
                    for (const hit of hitTargets) {
                        const dmg = baseDmg + Math.floor(Math.random() * 24) - 12;
                        applyDamageToUnit(hit, dmg, `${unitDisplayName(unit)} casts ${spell.name}: `, {
                            sourceUnit: unit,
                            damageType: spell.damageType || 'magic',
                            spellType: spell.spellType || null
                        });
                        applyStatusEffects(hit, spell.statusEffects, `${spell.name}: `, unit);
                        // LinePush: push each hit target backward
                        if (spell.kind === 'linePush' && !hit.dead) {
                            const pushDist = spell.pushDistance || 1;
                            for (let p = 0; p < pushDist; p++) {
                                const nx = hit.x + dx, ny = hit.y + dy;
                                if (isInside(nx, ny) && canOccupy(nx, ny)) { hit.x = nx; hit.y = ny; }
                                else break;
                            }
                        }
                    }
                    addLog(`${spell.name} hits ${hitTargets.length} target${hitTargets.length !== 1 ? 's' : ''} in a line.`);
                    scheduleBoardRender();
                }
                completionDelay = actionMs(600);
            }

            // ── CROSS (plus-shaped AoE around target tile) ──
            else if (spell.kind === 'cross') {
                playSfx('fireball');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                const cx = spell.aoeOriginSelf ? unit.x : x;
                const cy = spell.aoeOriginSelf ? unit.y : y;
                const radius = spell.crossRadius || 1;
                const crossTiles = [{ x: cx, y: cy }];
                for (let i = 1; i <= radius; i++) {
                    crossTiles.push({ x: cx + i, y: cy }, { x: cx - i, y: cy }, { x: cx, y: cy + i }, { x: cx, y: cy - i });
                }
                const enemies = aliveUnitsFor(enemyOf(unit.player));
                playAoeRing(cx, cy, radius, spell.spellType, actionMs(550));
                let hitCount = 0;
                const baseDmg = Math.max(32, (spell.dmg || 0) + spellPower);
                for (const tile of crossTiles) {
                    const hit = enemies.find(e => e.x === tile.x && e.y === tile.y);
                    if (hit && !hit.dead) {
                        const dmg = baseDmg + Math.floor(Math.random() * 24) - 12;
                        applyDamageToUnit(hit, dmg, `${unitDisplayName(unit)} casts ${spell.name}: `, {
                            sourceUnit: unit,
                            damageType: spell.damageType || 'magic',
                            spellType: spell.spellType || null
                        });
                        applyStatusEffects(hit, spell.statusEffects, `${spell.name}: `, unit);
                        // Push outward from center
                        if (spell.pushDistance && !hit.dead) {
                            const pdx = Math.sign(hit.x - cx), pdy = Math.sign(hit.y - cy);
                            for (let p = 0; p < spell.pushDistance; p++) {
                                const nx = hit.x + pdx, ny = hit.y + pdy;
                                if (isInside(nx, ny) && canOccupy(nx, ny)) { hit.x = nx; hit.y = ny; }
                                else break;
                            }
                        }
                        hitCount++;
                    }
                }
                addLog(`${spell.name} hits ${hitCount} target${hitCount !== 1 ? 's' : ''} in a cross pattern.`);
                scheduleBoardRender();
                completionDelay = actionMs(600);
            }

            // ── PULL (pull enemy toward caster in straight line) ──
            else if (spell.kind === 'pull') {
                const target = unitAt(x, y);
                if (!target || target.player === unit.player) {
                    addLog('Invalid target for pull.');
                    playErrorSfx();
                    return 0;
                }
                playSfx('uiConfirm');
                resetBoardCamera();
                playProjectileToUnit(unit, target, 'proj-pull-hook', actionMs(400), spell.spellType);
                unit.mp -= effectiveSpellCost;
                const pullDist = spell.pullDistance || 3;
                const pdx = Math.sign(unit.x - target.x);
                const pdy = Math.sign(unit.y - target.y);
                let pulled = 0;
                for (let i = 0; i < pullDist; i++) {
                    const nx = target.x + pdx, ny = target.y + pdy;
                    if (!isInside(nx, ny) || !isTerrainPassable(nx, ny)) break;
                    if (unitAt(nx, ny)) break;
                    if (nx === unit.x && ny === unit.y) break;
                    // Hazard damage if pulling through hazards
                    if (spell.pullThroughHazards) {
                        const terrain = getTerrainAt(nx, ny);
                        if (terrain === 'lava' || terrain === 'poison') {
                            applyDamageToUnit(target, 24, `Dragged through ${terrain}: `, { sourceUnit: unit, damageType: 'magic', spellType: spell.spellType || null });
                        }
                    }
                    target.x = nx;
                    target.y = ny;
                    pulled++;
                }
                if (spell.dmg) {
                    const dmg = Math.max(16, (spell.dmg || 0) + spellPower);
                    applyDamageToUnit(target, dmg, `${unitDisplayName(unit)} casts ${spell.name}: `, {
                        sourceUnit: unit,
                        damageType: spell.damageType || 'physical',
                        spellType: spell.spellType || null
                    });
                }
                addLog(`${unitDisplayName(unit)} pulls ${unitDisplayName(target)} ${pulled} tile${pulled !== 1 ? 's' : ''}.`);
                scheduleBoardRender();
                completionDelay = actionMs(600);
            }

            // ── SWAP (swap positions with target, no damage) ──
            else if (spell.kind === 'swap') {
                const target = unitAt(x, y);
                if (!target || target.player === unit.player) {
                    addLog('Invalid target for swap.');
                    playErrorSfx();
                    return 0;
                }
                playSfx('uiConfirm');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                const ux = unit.x, uy = unit.y;
                unit.x = target.x; unit.y = target.y;
                target.x = ux; target.y = uy;
                addLog(`${unitDisplayName(unit)} swaps positions with ${unitDisplayName(target)}!`);
                showFloatingTextForUnit(unit, 'SWAP!', 'streak', { durationMs: 800 });
                scheduleBoardRender();
                completionDelay = actionMs(500);
            }

            // ── ESCAPE (cleanse + teleport + leave decoy) ──
            else if (spell.kind === 'escape') {
                playSfx('manaRegen');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                // Cleanse debuffs
                if (spell.cleanse) {
                    const debuffs = getActiveStatusKeys(unit).filter(k => STATUS_DEFS[k]?.kind === 'debuff');
                    const toCleanse = debuffs.slice(0, spell.cleanse);
                    for (const k of toCleanse) clearStatus(unit, k);
                    if (toCleanse.length) addLog(`${unitDisplayName(unit)} cleanses ${toCleanse.length} debuff${toCleanse.length > 1 ? 's' : ''}.`);
                }
                // Leave decoy at current position
                const decoyX = unit.x, decoyY = unit.y;
                // Teleport to a valid tile within range
                const dist = spell.teleportDistance || 2;
                const candidates = [];
                for (let dy = -dist; dy <= dist; dy++) {
                    for (let dx = -dist; dx <= dist; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = unit.x + dx, ny = unit.y + dy;
                        if (Math.abs(dx) + Math.abs(dy) <= dist && isInside(nx, ny) && canOccupy(nx, ny)) {
                            candidates.push({ x: nx, y: ny });
                        }
                    }
                }
                if (candidates.length) {
                    // Pick furthest from nearest enemy
                    const enemies = aliveUnitsFor(enemyOf(unit.player));
                    candidates.sort((a, b) => {
                        const aMin = Math.min(...enemies.map(e => Math.abs(e.x - a.x) + Math.abs(e.y - a.y)), 99);
                        const bMin = Math.min(...enemies.map(e => Math.abs(e.x - b.x) + Math.abs(e.y - b.y)), 99);
                        return bMin - aMin;
                    });
                    unit.x = candidates[0].x;
                    unit.y = candidates[0].y;
                }
                // Spawn decoy (1 HP dummy unit if spawnDecoy flag)
                if (spell.spawnDecoy) {
                    addLog(`${unitDisplayName(unit)} sheds skin and leaves a decoy at ${coordLabel(decoyX, decoyY)}!`);
                    showFloatingTextForUnit(unit, 'SHED!', 'heal', { durationMs: 800 });
                }
                scheduleBoardRender();
                completionDelay = actionMs(500);
            }

            // ── SELF-HEAL (heal self + optional cleanse) ──
            else if (spell.kind === 'selfHeal') {
                playSfx('healRegen');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                const healAmt = spell.selfHealPct ? Math.floor(unit.maxHp * spell.selfHealPct) : (spell.heal || 64);
                applyHealingToUnit(unit, healAmt, unit);
                if (spell.cleanse) {
                    const debuffs = getActiveStatusKeys(unit).filter(k => STATUS_DEFS[k]?.kind === 'debuff');
                    const toCleanse = debuffs.slice(0, spell.cleanse);
                    for (const k of toCleanse) clearStatus(unit, k);
                }
                addLog(`${unitDisplayName(unit)} uses ${spell.name}! Heals ${healAmt} HP.`);
                showFloatingTextForUnit(unit, `+${healAmt}`, 'heal');
                completionDelay = actionMs(400);
            }

            // ── AOE PULL (AoE damage + pull targets toward center) ──
            else if (spell.kind === 'aoePull') {
                playSfx('fireball');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                playAoeRing(x, y, spell.aoeRadius || 1, spell.spellType, actionMs(550));
                const area = getSquareArea(x, y, spell.aoeRadius || 1);
                const enemies = aliveUnitsFor(enemyOf(unit.player));
                const baseDmg = Math.max(32, (spell.dmg || 0) + spellPower);
                let hitCount = 0;
                for (const tile of area) {
                    const hit = enemies.find(e => e.x === tile.x && e.y === tile.y);
                    if (hit && !hit.dead) {
                        const dmg = baseDmg + Math.floor(Math.random() * 20) - 10;
                        applyDamageToUnit(hit, dmg, `${unitDisplayName(unit)} casts ${spell.name}: `, {
                            sourceUnit: unit,
                            damageType: spell.damageType || 'magic',
                            spellType: spell.spellType || null
                        });
                        // Pull toward center
                        if (!hit.dead && spell.pullToCenter) {
                            const pdx = Math.sign(x - hit.x), pdy = Math.sign(y - hit.y);
                            const nx = hit.x + pdx, ny = hit.y + pdy;
                            if (isInside(nx, ny) && canOccupy(nx, ny)) { hit.x = nx; hit.y = ny; }
                        }
                        hitCount++;
                    }
                }
                addLog(`${spell.name} hits ${hitCount} target${hitCount !== 1 ? 's' : ''} and pulls them inward.`);
                scheduleBoardRender();
                completionDelay = actionMs(600);
            }

            // ── SPLIT BEAM (hit first target, split into smaller beams) ──
            else if (spell.kind === 'splitBeam') {
                const target = unitAt(x, y);
                if (!target || target.player === unit.player) {
                    addLog('Invalid target.');
                    playErrorSfx();
                    return 0;
                }
                playSfx('fireball');
                const cam = playOffensiveActionCamera(unit, target, {
                    sourceHold: 900,
                    targetHold: 900,
                    attackName: spell.name
                });
                const impactDelay = Math.max((cam?.sourceHold ?? actionMs(900)) + (cam?.travelMs ?? actionMs(480)) + actionMs(80), actionMs(620));
                unit.mp -= effectiveSpellCost;
                const primaryDmg = Math.max(32, (spell.dmg || 0) + spellPower);
                // Primary hit
                window.setTimeout(() => {
                    applyDamageToUnit(target, primaryDmg, `${unitDisplayName(unit)} casts ${spell.name}: `, {
                        sourceUnit: unit,
                        damageType: spell.damageType || 'magic',
                        spellType: spell.spellType || null
                    });
                }, impactDelay);
                // Split into sub-beams hitting nearby enemies (staggered after primary)
                const splitCount = spell.splitCount || 2;
                const splitDmg = spell.splitDmg || Math.floor(primaryDmg * 0.6);
                const splitRadius = spell.splitRadius || 2;
                const splitProjectileMs = actionMs(360);
                const splitStartDelay = impactDelay + actionMs(350); // pause after primary hit
                const splitGap = actionMs(280); // gap between each split beam
                window.setTimeout(() => {
                    const nearby = aliveUnitsFor(enemyOf(unit.player)).filter(e =>
                        e.id !== target.id && !e.dead &&
                        Math.abs(e.x - target.x) + Math.abs(e.y - target.y) <= splitRadius
                    ).sort((a, b) => a.hp - b.hp).slice(0, splitCount);
                    nearby.forEach((hit, idx) => {
                        const hitDelay = idx * splitGap;
                        window.setTimeout(() => {
                            if (hit.dead) return;
                            playProjectile(target.x, target.y, hit.x, hit.y, 'damage', splitProjectileMs, spell.spellType);
                            playSfx('fireball');
                            window.setTimeout(() => {
                                if (hit.dead) return;
                                applyDamageToUnit(hit, splitDmg + spellPower, `${spell.name} splits to `, {
                                    sourceUnit: unit,
                                    damageType: spell.damageType || 'magic',
                                    spellType: spell.spellType || null
                                });
                            }, splitProjectileMs + actionMs(60));
                        }, hitDelay);
                    });
                    addLog(`${spell.name} hits primary target and splits to ${nearby.length} nearby enem${nearby.length === 1 ? 'y' : 'ies'}.`);
                }, splitStartDelay);
                completionDelay = Math.max(splitStartDelay + (splitCount - 1) * splitGap + splitProjectileMs + actionMs(400),
                    (cam?.totalMs ?? (impactDelay + actionMs(600))) + actionMs(120));
            }

            // ── DELAYED (mark tile, explodes after N turns) ──
            else if (spell.kind === 'delayed') {
                playSfx('uiConfirm');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                const delay = spell.delayTurns || 1;
                if (!state._delayedSpells) state._delayedSpells = [];
                state._delayedSpells.push({
                    x, y,
                    dmg: spell.dmg || 128,
                    aoeRadius: spell.aoeRadius || 1,
                    sourceUnitId: unit.id,
                    sourcePlayer: unit.player,
                    spellType: spell.spellType,
                    damageType: spell.damageType || 'magic',
                    spellName: spell.name,
                    roundsLeft: delay,
                    statusEffects: spell.statusEffects || []
                });
                addLog(`${unitDisplayName(unit)} marks ${coordLabel(x, y)} with ${spell.name}! Detonates in ${delay} round${delay > 1 ? 's' : ''}.`);
                showFloatingTextForUnit(unit, `${spell.name}!`, 'streak', { durationMs: 1000 });
                scheduleBoardRender();
                completionDelay = actionMs(400);
            }

            // ── DEPLOY OBJECT (place interactable on tile) ──
            else if (spell.kind === 'deployObject') {
                if (unitAt(x, y)) {
                    addLog('Cannot deploy on an occupied tile.');
                    playErrorSfx();
                    return 0;
                }
                playSfx('uiConfirm');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                if (!state._deployedObjects) state._deployedObjects = [];
                state._deployedObjects.push({
                    x, y,
                    ownerId: unit.id,
                    ownerPlayer: unit.player,
                    hp: spell.objectHp || 1,
                    maxHp: spell.objectHp || 1,
                    blastRadius: spell.blastRadius || 0,
                    blastDmg: spell.blastDmg || 0,
                    blocksMovement: spell.blocksMovement !== false,
                    drawsRangedAttack: !!spell.drawsRangedAttack,
                    detonateOnAttack: !!spell.detonateOnAttack,
                    spellName: spell.name
                });
                addLog(`${unitDisplayName(unit)} deploys ${spell.name} at ${coordLabel(x, y)}.`);
                scheduleBoardRender();
                completionDelay = actionMs(400);
            }

            // ── DEPLOY PAIR (place linked teleport gates) ──
            else if (spell.kind === 'deployPair') {
                playSfx('uiConfirm');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                if (!state._gatePairs) state._gatePairs = [];
                // Remove existing pair from this caster if at max
                const maxPairs = spell.maxActivePerCaster || 1;
                const existing = state._gatePairs.filter(g => g.ownerId === unit.id);
                while (existing.length >= maxPairs) {
                    const old = existing.shift();
                    state._gatePairs = state._gatePairs.filter(g => g !== old);
                }
                state._gatePairs.push({
                    x1: unit.x, y1: unit.y,
                    x2: x, y2: y,
                    ownerId: unit.id,
                    ownerPlayer: unit.player,
                    usesLeft: 4, // each ally can use once
                    spellName: spell.name
                });
                addLog(`${unitDisplayName(unit)} creates ${spell.name} gates between ${coordLabel(unit.x, unit.y)} and ${coordLabel(x, y)}.`);
                scheduleBoardRender();
                completionDelay = actionMs(400);
            }

            // ── AOE SHIELD (create shield zone with shared HP) ──
            else if (spell.kind === 'aoeShield') {
                playSfx('manaRegen');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                const area = getSquareArea(x, y, spell.aoeRadius || 1);
                const shieldPerAlly = Math.floor((spell.shieldHp || 200) / Math.max(1, aliveUnitsOnFloor(unit.player).filter(a => area.some(t => t.x === a.x && t.y === a.y)).length));
                const allies = aliveUnitsOnFloor(unit.player).filter(a => area.some(t => t.x === a.x && t.y === a.y));
                for (const ally of allies) {
                    ally.shield = (ally.shield || 0) + shieldPerAlly;
                    showFloatingTextForUnit(ally, `+${shieldPerAlly} 🛡`, 'heal');
                }
                addLog(`${unitDisplayName(unit)} projects ${spell.name}! ${allies.length} all${allies.length === 1 ? 'y' : 'ies'} shielded for ${shieldPerAlly} each.`);
                scheduleBoardRender();
                completionDelay = actionMs(500);
            }

            // ── ZONE DEBUFF (persistent area that debuffs enemies) ──
            else if (spell.kind === 'zoneDebuff') {
                playSfx('uiConfirm');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                if (!state._activeZones) state._activeZones = [];
                state._activeZones.push({
                    x, y,
                    radius: spell.aoeRadius || 1,
                    type: 'debuff',
                    ownerPlayer: unit.player,
                    duration: spell.zoneDuration || 2,
                    statusEffects: spell.statusEffects || [],
                    spellName: spell.name
                });
                addLog(`${unitDisplayName(unit)} creates ${spell.name} zone at ${coordLabel(x, y)} for ${spell.zoneDuration || 2} rounds.`);
                scheduleBoardRender();
                completionDelay = actionMs(400);
            }

            // ── ZONE HEAL (persistent area that heals allies) ──
            else if (spell.kind === 'zoneHeal') {
                playSfx('healRegen');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                if (!state._activeZones) state._activeZones = [];
                state._activeZones.push({
                    x, y,
                    radius: spell.aoeRadius || 1,
                    type: 'heal',
                    ownerPlayer: unit.player,
                    duration: spell.zoneDuration || 2,
                    healPerTurn: spell.healPerTurn || 48,
                    spellName: spell.name
                });
                addLog(`${unitDisplayName(unit)} consecrates ${spell.name} zone at ${coordLabel(x, y)} for ${spell.zoneDuration || 2} rounds.`);
                scheduleBoardRender();
                completionDelay = actionMs(400);
            }

            // ── TERRAIN CREATE (convert tiles to different terrain) ──
            else if (spell.kind === 'terrainCreate') {
                playSfx('uiConfirm');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                const terrainType = spell.terrainType || 'water';
                const count = spell.tileCount || 3;
                // BFS from target tile to find connected passable tiles to convert
                const visited = new Set();
                const queue = [{ x, y }];
                let converted = 0;
                while (queue.length > 0 && converted < count) {
                    const tile = queue.shift();
                    const pk = posKey(tile.x, tile.y);
                    if (visited.has(pk)) continue;
                    visited.add(pk);
                    if (!isInside(tile.x, tile.y)) continue;
                    if (unitAt(tile.x, tile.y)) continue; // don't flood occupied tiles
                    const current = getTerrainAt(tile.x, tile.y);
                    if (current === terrainType) continue; // already that terrain
                    if (current === 'wall' || current === 'deep_water') continue;
                    setTerrainAt(tile.x, tile.y, terrainType);
                    converted++;
                    // Add neighbors
                    queue.push({ x: tile.x + 1, y: tile.y }, { x: tile.x - 1, y: tile.y },
                               { x: tile.x, y: tile.y + 1 }, { x: tile.x, y: tile.y - 1 });
                }
                addLog(`${unitDisplayName(unit)} uses ${spell.name}! Converted ${converted} tile${converted !== 1 ? 's' : ''} to ${terrainType}.`);
                scheduleBoardRender();
                completionDelay = actionMs(400);
            }

            // ── UTILITY SPELLS (grapple, plunder, mimic) ──
            else if (spell.kind === 'utility') {
                if (spell.id === 'grapple') {
                    // Grapple: pull enemy 2 tiles toward caster, or pull self toward obstacle
                    const target = unitAt(x, y);
                    if (target && target.player !== unit.player) {
                        // Pull enemy toward caster
                        panelFocusTarget = target;
                        focusUnitPanel(target.id);
                        playSfx('uiConfirm');
                        const cam = playOffensiveActionCamera(unit, target, { sourceHold: 900, targetHold: 900, attackName: 'Grapple' });
                        const impactDelay = Math.max((cam?.sourceHold ?? actionMs(900)) + (cam?.travelMs ?? actionMs(480)) + actionMs(80), actionMs(620));
                        completionDelay = Math.max(impactDelay + actionMs(200), (cam?.totalMs ?? (impactDelay + actionMs(360))) + actionMs(120));
                        unit.mp -= effectiveSpellCost;
                        window.setTimeout(() => {
                            // Pull target up to 2 tiles toward caster
                            const dx = Math.sign(unit.x - target.x);
                            const dy = Math.sign(unit.y - target.y);
                            let pulled = 0;
                            for (let i = 0; i < 2; i++) {
                                const nx = target.x + dx;
                                const ny = target.y + dy;
                                if (!isInside(nx, ny)) break;
                                if (unitAt(nx, ny)) break;
                                if (!isTerrainPassable(nx, ny)) break;
                                // Don't pull onto caster's tile
                                if (nx === unit.x && ny === unit.y) break;
                                target.x = nx;
                                target.y = ny;
                                pulled++;
                            }
                            // Deal minor damage
                            const grappleDmg = Math.max(16, Math.floor(unit.atk * 0.3) + spellPower);
                            applyDamageToUnit(target, grappleDmg, `${unitDisplayName(unit)} grapples: `, { sourceUnit: unit, damageType: 'physical', spellType: spell.spellType || null });
                            if (_activeCinematic?.showDamage) _activeCinematic.showDamage(`-${grappleDmg}`, false);
                            addLog(`${unitDisplayName(unit)} grapples ${unitDisplayName(target)}, pulling them ${pulled} tile${pulled !== 1 ? 's' : ''} closer and dealing ${grappleDmg} damage.`);
                            showFloatingTextForUnit(target, `GRAPPLED!`, 'status', { durationMs: 1000 });
                        }, impactDelay);
                    } else if (!target) {
                        // Pull self toward obstacle/wall (movement utility)
                        const dx = Math.sign(x - unit.x);
                        const dy = Math.sign(y - unit.y);
                        let moved = 0;
                        let cx = unit.x, cy = unit.y;
                        for (let i = 0; i < 2; i++) {
                            const nx = cx + dx;
                            const ny = cy + dy;
                            if (!isInside(nx, ny)) break;
                            if (unitAt(nx, ny)) break;
                            if (!isTerrainPassable(nx, ny)) break;
                            cx = nx;
                            cy = ny;
                            moved++;
                        }
                        if (moved === 0) {
                            addLog('No valid position to grapple toward.');
                            playErrorSfx();
                            return 0;
                        }
                        playSfx('uiConfirm');
                        resetBoardCamera();
                        unit.mp -= effectiveSpellCost;
                        unit.x = cx;
                        unit.y = cy;
                        unit._trackTilesMoved = (unit._trackTilesMoved || 0) + moved;
                        addLog(`${unitDisplayName(unit)} grapples forward ${moved} tile${moved !== 1 ? 's' : ''}.`);
                        completionDelay = actionMs(400);
                    } else {
                        addLog('Choose an enemy to pull or an empty tile to grapple toward.');
                        playErrorSfx();
                        return 0;
                    }
                } else if (spell.id === 'plunder') {
                    // Plunder: steal random item or 1 hourglass from adjacent enemy
                    const target = unitAt(x, y);
                    if (!target || target.player === unit.player) {
                        addLog('Choose an adjacent enemy to plunder.');
                        playErrorSfx();
                        return 0;
                    }
                    panelFocusTarget = target;
                    focusUnitPanel(target.id);
                    playSfx('uiConfirm');
                    resetBoardCamera();
                    unit.mp -= effectiveSpellCost;
                    // Try to steal hourglass first, then item
                    let stolen = false;
                    if ((target.hourglasses || 0) > 0) {
                        target.hourglasses--;
                        unit.hourglasses = (unit.hourglasses || 0) + 1;
                        addLog(`${unitDisplayName(unit)} plunders an hourglass from ${unitDisplayName(target)}! ⏳`);
                        showFloatingTextForUnit(unit, '+1 ⏳', 'pickup', { durationMs: 1200 });
                        showFloatingTextForUnit(target, '-1 ⏳', 'damage', { durationMs: 1000 });
                        stolen = true;
                    }
                    if (!stolen && target.items) {
                        const stealable = Object.keys(target.items).filter(k => target.items[k] > 0);
                        if (stealable.length > 0) {
                            const pick = stealable[randInt(stealable.length)];
                            target.items[pick]--;
                            if (!unit.items) unit.items = {};
                            unit.items[pick] = (unit.items[pick] || 0) + 1;
                            addLog(`${unitDisplayName(unit)} plunders a ${pick} from ${unitDisplayName(target)}!`);
                            showFloatingTextForUnit(unit, `📦 Stole ${pick}`, 'pickup', { durationMs: 1200 });
                            stolen = true;
                        }
                    }
                    if (!stolen) {
                        addLog(`${unitDisplayName(unit)} tries to plunder ${unitDisplayName(target)}, but they have nothing to steal.`);
                    }
                    completionDelay = actionMs(500);
                } else if (spell.id === 'mimic') {
                    // Mimic: copy the last spell cast by any unit
                    const lastSpell = state._lastSpellCast;
                    if (!lastSpell) {
                        addLog('No spell has been cast yet this match to mimic.');
                        playErrorSfx();
                        return 0;
                    }
                    const mimicSpell = getSpellById(lastSpell.spellId);
                    if (!mimicSpell) {
                        addLog('Cannot mimic that spell.');
                        playErrorSfx();
                        return 0;
                    }
                    playSfx('manaRegen');
                    resetBoardCamera();
                    unit.mp -= effectiveSpellCost;
                    addLog(`${unitDisplayName(unit)} mimics ${mimicSpell.name} at 75% power!`);
                    // Execute the mimicked spell's effect at reduced power
                    const target = unitAt(x, y);
                    if (mimicSpell.kind === 'damage' && target && target.player !== unit.player) {
                        const dmg = Math.max(24, Math.floor(((mimicSpell.dmg || 80) + spellPower) * 0.75));
                        applyDamageToUnit(target, dmg, `${unitDisplayName(unit)} mimics ${mimicSpell.name}: `, { sourceUnit: unit, damageType: mimicSpell.damageType || 'magic', spellType: mimicSpell.spellType || null });
                    } else if (mimicSpell.kind === 'heal' && target && target.player === unit.player) {
                        const healAmt = Math.max(24, Math.floor(((mimicSpell.heal || 80) + spellPower) * 0.75));
                        applyHealingToUnit(target, healAmt, unit);
                        addLog(`Mimic heals ${unitDisplayName(target)} for ${healAmt}.`);
                    } else if (mimicSpell.kind === 'buff' && target && target.player === unit.player) {
                        applyStatusEffects(target, mimicSpell.statusEffects, `Mimic ${mimicSpell.name}: `, unit);
                    } else if (mimicSpell.kind === 'debuff' && target && target.player !== unit.player) {
                        applyStatusEffects(target, mimicSpell.statusEffects, `Mimic ${mimicSpell.name}: `, unit);
                        if (mimicSpell.dmg) {
                            const dmg = Math.max(16, Math.floor((mimicSpell.dmg + spellPower) * 0.75));
                            applyDamageToUnit(target, dmg, `Mimic ${mimicSpell.name}: `, { sourceUnit: unit, damageType: mimicSpell.damageType || 'magic', spellType: mimicSpell.spellType || null });
                        }
                    } else {
                        addLog(`Mimic fizzles — invalid target for ${mimicSpell.name}.`);
                    }
                    completionDelay = actionMs(600);
                } else {
                    // Unknown utility spell fallback
                    addLog(`${spell.name} has no effect yet.`);
                    unit.mp -= effectiveSpellCost;
                    completionDelay = actionMs(300);
                }
            }
            // ── REMOTE VIEW ──
            else if (spell.kind === 'remoteView') {
                if (!isInside(x, y)) {
                    addLog('Choose a tile to reveal.');
                    playErrorSfx();
                    return 0;
                }
                playSfx('manaRegen');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                const wardRadius = 2; // 5×5 area
                const wardTiles = new Set();
                const _rvFloor = state.viewingFloor || 'earth';
                for (let wy = y - wardRadius; wy <= y + wardRadius; wy++) {
                    for (let wx = x - wardRadius; wx <= x + wardRadius; wx++) {
                        if (wx >= 0 && wy >= 0 && wx < bw() && wy < bh()) {
                            wardTiles.add(posKey(wx, wy));
                        }
                    }
                }
                if (!state._visionWards) state._visionWards = [];
                state._visionWards.push({
                    x, y, floor: _rvFloor, player: unit.player,
                    tiles: wardTiles, remaining: 3
                });
                addLog(`${unitDisplayName(unit)} casts ${spell.name} — a 5×5 area at ${coordLabel(x, y)} (${_rvFloor}) is revealed for 3 turns.`);
                showFloatingTextAtTile(x, y, '👁️ Revealed', 'buff');
                completionDelay = actionMs(400);
            }
            // ── TELEPORT ──
            else if (spell.kind === 'teleport') {
                // Phase 1: select a unit to teleport. Phase 2: select destination.
                const teleTarget = unitAt(x, y);
                if (!state._teleportingUnit) {
                    // Phase 1: select a unit (self, ally, or enemy)
                    if (!teleTarget) {
                        addLog('Choose a unit to teleport first.');
                        playErrorSfx();
                        return 0;
                    }
                    state._teleportingUnit = teleTarget;
                    addLog(`Select a destination tile for ${unitDisplayName(teleTarget)}. Click the unit again to cancel.`);
                    state.pendingTarget = null;
                    markDirty('board', 'log', 'hud');
                    renderIfDirty();
                    return 0; // Don't finish — wait for second click
                } else {
                    // Phase 2: select destination
                    // Clicking the teleporting unit's own tile cancels
                    if (x === state._teleportingUnit.x && y === state._teleportingUnit.y) {
                        state._teleportingUnit = null;
                        state.pendingTarget = null;
                        addLog('Teleport cancelled.');
                        markDirty('board', 'log', 'hud');
                        renderIfDirty();
                        return 0;
                    }
                    if (unitAt(x, y)) {
                        addLog('Destination tile must be unoccupied.');
                        playErrorSfx();
                        return 0;
                    }
                    if (!isInside(x, y) || !isTerrainPassable(x, y)) {
                        addLog('Cannot teleport there.');
                        playErrorSfx();
                        return 0;
                    }
                    // Phase 2 range check: destination must be within spell range of caster
                    const destDist = Math.abs(unit.x - x) + Math.abs(unit.y - y);
                    if (destDist > spell.range) {
                        addLog('Destination is out of teleport range.');
                        playErrorSfx();
                        return 0;
                    }
                    const tUnit = state._teleportingUnit;
                    state._teleportingUnit = null;
                    playSfx('manaRegen');
                    resetBoardCamera();
                    const mpCost = (unit.cls === 'Psychic') ? Math.max(1, effectiveSpellCost - 1) : effectiveSpellCost;
                    unit.mp -= mpCost;
                    const oldLabel = coordLabel(tUnit.x, tUnit.y);
                    tUnit.x = x;
                    tUnit.y = y;
                    addLog(`${unitDisplayName(unit)} teleports ${unitDisplayName(tUnit)} from ${oldLabel} to ${coordLabel(x, y)}.`);
                }
            }
            // ── WARP RUNE ──
            else if (spell.kind === 'warpRune') {
                if (unitAt(x, y)) {
                    addLog('Choose an empty tile for the Warp Rune.');
                    playErrorSfx();
                    return 0;
                }
                if (!isInside(x, y) || !isTerrainPassable(x, y)) {
                    addLog('Cannot place a rune there.');
                    playErrorSfx();
                    return 0;
                }
                if (!state.warpRunes) state.warpRunes = [];
                const ownedRunes = state.warpRunes.filter(r => r.casterUnitId === unit.id);
                if (ownedRunes.length >= (spell.maxActivePerCaster || 2)) state.warpRunes = state.warpRunes.filter(r => r !== ownedRunes[0]);
                playSfx('uiConfirm');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                state.warpRunes.push({
                    x,
                    y,
                    owner: unit.player,
                    casterUnitId: unit.id
                });
                addLog(`${unitDisplayName(unit)} inscribes a Warp Rune at ${coordLabel(x, y)}.`);
            }
            // ── HEALING SEED ──
            else if (spell.kind === 'seedHeal') {
                const terrain = getTerrainAt(x, y);
                if (terrain === 'mountain' || terrain === 'lava') {
                    addLog(`Healing Seed cannot be planted on ${terrain} tiles.`);
                    playErrorSfx();
                    return 0;
                }
                if (!state.plantedSeeds) state.plantedSeeds = [];
                if (state.plantedSeeds.some(s => s.x === x && s.y === y && s.type === 'heal')) {
                    addLog('There is already a healing seed on that tile.');
                    playErrorSfx();
                    return 0;
                }
                playSfx('healRegen');
                unit.mp -= effectiveSpellCost;
                // Animate: camera focus → projectile → plant
                focusBoardCameraOnTiles([{
                    x: unit.x,
                    y: unit.y
                }, {
                    x,
                    y
                }], {
                    zoom: getWideZoom(),
                    holdMs: 1200
                });
                const flyMs = actionMs(420);
                window.setTimeout(() => playProjectile(unit.x, unit.y, x, y, 'heal', flyMs, spell.spellType), actionMs(200));
                window.setTimeout(() => {
                    showFloatingTextAtTile(x, y, '🌱', 'heal', {
                        durationMs: 900
                    });
                    state.plantedSeeds.push({
                        x,
                        y,
                        type: 'heal',
                        owner: unit.player,
                        casterUnitId: unit.id
                    });
                    addLog(`${unitDisplayName(unit)} plants a Healing Seed at ${coordLabel(x, y)}. It will persist until destroyed.`);
                    // Instant bloom if rain is present
                    const wHere = getWeatherAtTile(x, y);
                    const raining = wHere.length > 0 && (state.activeWeather || []).some(aw => aw.tiles.some(t => t.x === x && t.y === y) && ['thunderstorm', 'hurricane'].includes(aw.type));
                    if (raining) {
                        const unitsHere = aliveUnitsFor(unit.player).filter(u => u.x === x && u.y === y);
                        for (const ally of unitsHere) {
                            const h = applyHealingToUnit(ally, 12, unit);
                            if (h > 0) addLog(`🌱 The seed blooms in the rain! ${unitDisplayName(ally)} is healed for ${h} HP.`);
                        }
                    }
                    scheduleBoardRender();
                }, actionMs(200) + flyMs + actionMs(60));
                completionDelay = actionMs(200) + flyMs + actionMs(500);
            }
            // ── POISON SEED ──
            else if (spell.kind === 'seedPoison') {
                const terrain = getTerrainAt(x, y);
                if (terrain === 'mountain' || terrain === 'lava') {
                    addLog(`Poison Seed cannot be planted on ${terrain} tiles.`);
                    playErrorSfx();
                    return 0;
                }
                if (!state.plantedSeeds) state.plantedSeeds = [];
                if (state.plantedSeeds.some(s => s.x === x && s.y === y && s.type === 'poison')) {
                    addLog('There is already a poison seed on that tile.');
                    playErrorSfx();
                    return 0;
                }
                playSfx('fireball');
                unit.mp -= effectiveSpellCost;
                // Animate: camera focus → projectile → plant
                focusBoardCameraOnTiles([{
                    x: unit.x,
                    y: unit.y
                }, {
                    x,
                    y
                }], {
                    zoom: getWideZoom(),
                    holdMs: 1200
                });
                const flyMs = actionMs(420);
                window.setTimeout(() => playProjectile(unit.x, unit.y, x, y, 'proj-debuff', flyMs, spell.spellType), actionMs(200));
                window.setTimeout(() => {
                    showFloatingTextAtTile(x, y, '☠️', 'damage', {
                        durationMs: 900
                    });
                    state.plantedSeeds.push({
                        x,
                        y,
                        type: 'poison',
                        owner: unit.player,
                        casterUnitId: unit.id
                    });
                    addLog(`${unitDisplayName(unit)} plants a Poison Seed at ${coordLabel(x, y)}. It will persist until destroyed.`);
                    scheduleBoardRender();
                }, actionMs(200) + flyMs + actionMs(60));
                completionDelay = actionMs(200) + flyMs + actionMs(500);
            }
            // ── LIFE DRAIN ──
            else if (spell.kind === 'lifeDrain') {
                const target = unitAt(x, y);
                if (!target || target.player === unit.player) {
                    addLog('Choose an enemy target for Life Drain.');
                    playErrorSfx();
                    return 0;
                }
                panelFocusTarget = target;
                focusUnitPanel(target.id);
                playSfx('fireball');
                const cam = playOffensiveActionCamera(unit, target, {
                    sourceHold: 900,
                    targetHold: 900,
                    attackName: spell.name
                });
                const projectileDelay = Math.max(0, cam?.sourceHold ?? actionMs(900));
                const impactDelay = Math.max((cam?.sourceHold ?? actionMs(900)) + (cam?.travelMs ?? actionMs(480)) + actionMs(80), actionMs(620));
                completionDelay = Math.max(impactDelay + actionMs(120), (cam?.totalMs ?? (impactDelay + actionMs(360))) + actionMs(120));
                window.setTimeout(() => playProjectileToUnit(unit, target, 'damage', cam?.travelMs ?? actionMs(480), spell.spellType), projectileDelay);
                unit.mp -= effectiveSpellCost;
                window.setTimeout(() => {
                    let dmg = Math.max(32, (spell.dmg || 144) + spellPower + Math.floor(Math.random() * 40) - 16);
                    applyDamageToUnit(target, dmg, `${unitDisplayName(unit)} drains life from `, {
                        sourceUnit: unit,
                        damageType: 'magic'
                    });
                    let drainMult = spell.drainPct || 0.50;
                    if (unit.cls === 'Harvester') drainMult *= 1.20;
                    const healAmt = Math.max(1, Math.round(dmg * drainMult));
                    const healed = applyHealingToUnit(unit, healAmt, unit);
                    if (healed > 0) addLog(`${unitDisplayName(unit)} absorbs ${healed} HP.`);
                }, impactDelay);
            }
            // ── LEECH SEED ──
            else if (spell.kind === 'leechSeed') {
                const terrain = getTerrainAt(x, y);
                if (terrain === 'mountain' || terrain === 'lava') {
                    addLog(`Leech Seed cannot be planted on ${terrain} tiles.`);
                    playErrorSfx();
                    return 0;
                }
                if (!state.plantedSeeds) state.plantedSeeds = [];
                if (state.plantedSeeds.some(s => s.x === x && s.y === y && s.type === 'leech')) {
                    addLog('There is already a leech seed on that tile.');
                    playErrorSfx();
                    return 0;
                }
                playSfx('fireball');
                unit.mp -= effectiveSpellCost;
                // Animate: camera focus → projectile → plant
                focusBoardCameraOnTiles([{
                    x: unit.x,
                    y: unit.y
                }, {
                    x,
                    y
                }], {
                    zoom: getWideZoom(),
                    holdMs: 1200
                });
                const flyMs = actionMs(420);
                window.setTimeout(() => playProjectile(unit.x, unit.y, x, y, 'proj-debuff', flyMs, spell.spellType), actionMs(200));
                window.setTimeout(() => {
                    showFloatingTextAtTile(x, y, '🌿', 'status', {
                        durationMs: 900
                    });
                    state.plantedSeeds.push({
                        x,
                        y,
                        type: 'leech',
                        owner: unit.player,
                        casterUnitId: unit.id
                    });
                    addLog(`${unitDisplayName(unit)} plants Leech Seed at ${coordLabel(x, y)}. Enemies will be drained, allies nourished. Persists until destroyed.`);
                    scheduleBoardRender();
                }, actionMs(200) + flyMs + actionMs(60));
                completionDelay = actionMs(200) + flyMs + actionMs(500);
            }
            // ── DEPLOY TURRET ──
            else if (spell.kind === 'deployTurret') {
                if (unitAt(x, y)) {
                    addLog('Choose an empty tile for the turret.');
                    playErrorSfx();
                    return 0;
                }
                if (!isInside(x, y) || !isTerrainPassable(x, y)) {
                    addLog('Cannot place a turret there.');
                    playErrorSfx();
                    return 0;
                }
                if (!state.turrets) state.turrets = [];
                const ownedTurrets = state.turrets.filter(t => t.casterUnitId === unit.id);
                if (ownedTurrets.length >= (spell.maxActivePerCaster || 2)) {
                    // Remove oldest turret
                    const oldest = ownedTurrets[0];
                    state.turrets = state.turrets.filter(t => t !== oldest);
                    addLog(`Oldest turret at ${coordLabel(oldest.x, oldest.y)} dismantled to make room.`);
                }
                if (state.turrets.some(t => t.x === x && t.y === y)) {
                    addLog('There is already a turret on that tile.');
                    playErrorSfx();
                    return 0;
                }
                playSfx('uiConfirm');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                const turretHp = spell.turretHp || 20;
                const turretDmg = spell.turretDmg || 8;
                const turretRange = spell.turretRange || 2;
                state.turrets.push({
                    x,
                    y,
                    owner: unit.player,
                    casterUnitId: unit.id,
                    hp: turretHp,
                    maxHp: turretHp,
                    dmg: turretDmg,
                    range: turretRange,
                    id: `turret_${Date.now()}_${randInt(9999)}`
                });
                showFloatingTextAtTile(x, y, '🔧', 'buff', {
                    durationMs: 900
                });
                addLog(`${unitDisplayName(unit)} deploys a turret at ${coordLabel(x, y)} (${turretHp} HP, ${turretDmg} dmg, range ${turretRange}).`, unit.player);
                scheduleBoardRender();
            }
            // ── BUILD BRIDGE ──
            else if (spell.kind === 'buildBridge') {
                if (getTerrainAt(x, y) !== 'deep_water') {
                    addLog('Build Bridge can only target deep water tiles.');
                    playErrorSfx();
                    return 0;
                }
                playSfx('uiConfirm');
                unit.mp -= effectiveSpellCost;
                focusBoardCameraOnTiles([{
                    x: unit.x,
                    y: unit.y
                }, {
                    x,
                    y
                }], {
                    zoom: getWideZoom(),
                    holdMs: 1200
                });
                const flyMs = actionMs(420);
                window.setTimeout(() => playProjectile(unit.x, unit.y, x, y, 'heal', flyMs, spell.spellType), actionMs(200));
                window.setTimeout(() => {
                    // Change terrain from deep_water to bridge
                    setTerrainAt(x, y, 'bridge');
                    showFloatingTextAtTile(x, y, '🌉', 'buff', {
                        durationMs: 900
                    });
                    addLog(`${unitDisplayName(unit)} builds a bridge at ${coordLabel(x, y)}! The deep water is now passable.`);
                    _invalidateBoardGrid();
                    scheduleBoardRender();
                }, actionMs(200) + flyMs + actionMs(60));
                completionDelay = actionMs(200) + flyMs + actionMs(500);
            }
            // ── WAR CRY (Harbinger AoE buff) ──
            else if (spell.kind === 'warCry') {
                playSfx('healRegen');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                const radius = spell.auraRadius || 3;
                const allies = aliveUnitsFor(unit.player).filter(a => {
                    const dist = Math.abs(a.x - unit.x) + Math.abs(a.y - unit.y);
                    return dist <= radius;
                });
                let buffCount = 0;
                for (const ally of allies) {
                    if (ally.id === unit.id) {
                        // Harbinger gets weaker version
                        applyStatusEffects(ally, [{
                            id: 'inspiredWeak',
                            duration: 2
                        }], `${spell.name}: `, unit);
                    } else {
                        applyStatusEffects(ally, [{
                            id: 'inspired',
                            duration: 2
                        }], `${spell.name}: `, unit);
                    }
                    buffCount++;
                }
                showFloatingTextForUnit(unit, '🎵', 'buff');
                addLog(`${unitDisplayName(unit)} lets out a War Cry! ${buffCount} allies within ${radius} tiles are inspired.`);
                completionDelay = actionMs(400);
            }
            // ── ENCORE (Harbinger grants bonus AP) ──
            else if (spell.kind === 'encore') {
                const target = unitAt(x, y);
                if (!target || target.player !== unit.player || target.dead) {
                    addLog('Choose a living ally for Encore.');
                    playErrorSfx();
                    return 0;
                }
                if (target.id === unit.id) {
                    addLog('The Harbinger cannot Encore themselves.');
                    playErrorSfx();
                    return 0;
                }
                // Must have already acted this turn
                if (!unitFinished(target) && (target.ap === undefined || target.ap > 0)) {
                    addLog(`${unitDisplayName(target)} hasn't finished acting yet. Encore targets units that are done.`);
                    playErrorSfx();
                    return 0;
                }
                // Once per unit per round
                if (target._encoreThisRound) {
                    addLog(`${unitDisplayName(target)} already received an Encore this round.`);
                    playErrorSfx();
                    return 0;
                }
                panelFocusTarget = target;
                focusUnitPanel(target.id);
                playSfx('healRegen');
                resetBoardCamera();
                unit.mp -= effectiveSpellCost;
                target._encoreThisRound = true;
                // Grant 1 bonus AP by un-exhausting the unit
                target.moved = false;
                target.acted = false;
                if (target.ap !== undefined) target.ap = 1;
                showFloatingTextForUnit(target, '🎶 Encore!', 'buff');
                addLog(`${unitDisplayName(unit)} grants ${unitDisplayName(target)} an Encore! They can act again this turn.`);
                completionDelay = actionMs(400);
            }

            if (panelFocusTarget) focusUnitPanel(panelFocusTarget.id);
            window.setTimeout(finishAction, completionDelay);
            return completionDelay;
        }

        function checkWinConditionOnly() {
            // Returns true if a win condition is met, without triggering finalization
            const mpMode = getActiveMultiplayerMode();
            const wcs = mpMode.winConditions || [];
            // Tower destruction
            if (wcs.includes('tower_destroyed') && state.towers && state.towers[1] && state.towers[2]) {
                if (state.towers[1].hp <= 0 || state.towers[2].hp <= 0) return true;
            }
            // Wipeout
            if (wcs.includes('wipeout') || wcs.includes('most_kills')) {
                const p1Alive = state.units.filter(u => u.player === 1 && !u.dead && !u._dying).length;
                const p2Alive = state.units.filter(u => u.player === 2 && !u.dead && !u._dying).length;
                if (p1Alive === 0 || p2Alive === 0) return true;
            }
            // Timer expired
            if (state.matchClock && !state.suddenDeathActive) {
                if (state.matchClock.elapsedSec >= state.matchClock.timeLimitSec) return true;
            }
            return false;
        }

        function checkWin() {
            if (state.winner) {
                if (!state._winLogged) {
                    state._winLogged = true;
                    addLog('All remaining hourglasses and hidden items are now revealed.');
                    setTimeout(() => finalizeMatch(), 0);
                }
                return;
            }

            const mpMode = getActiveMultiplayerMode();
            const wcs = mpMode.winConditions || [];

            // ── Wipeout: all enemy units dead simultaneously ──
            if (wcs.includes('wipeout') || wcs.includes('most_kills')) {
                const p1Alive = state.units.filter(u => u.player === 1 && !u.dead && !u._dying).length;
                const p2Alive = state.units.filter(u => u.player === 2 && !u.dead && !u._dying).length;
                if (p1Alive === 0 && p2Alive > 0) { state.winner = 2; state._winCondition = 'wipeout'; }
                else if (p2Alive === 0 && p1Alive > 0) { state.winner = 1; state._winCondition = 'wipeout'; }
            }

            // ── Tower destroyed ──
            if (!state.winner && wcs.includes('tower_destroyed') && state.towers && state.towers[1] && state.towers[2]) {
                if (state.towers[1].hp <= 0) { state.winner = 2; state._winCondition = 'tower_destroyed'; }
                if (state.towers[2].hp <= 0) { state.winner = 1; state._winCondition = 'tower_destroyed'; }
            }

            // ── Hourglasses collected (all found) ──
            if (!state.winner && wcs.includes('hourglasses_collected')) {
                const totalHG = state.hourglasses.length;
                if (totalHG > 0) {
                    const p1HG = state.hourglasses.filter(h => h.carriedBy !== null && state.units.find(u => u.id === h.carriedBy)?.player === 1).length;
                    const p2HG = state.hourglasses.filter(h => h.carriedBy !== null && state.units.find(u => u.id === h.carriedBy)?.player === 2).length;
                    if (p1HG >= totalHG) { state.winner = 1; state._winCondition = 'hourglasses_collected'; }
                    else if (p2HG >= totalHG) { state.winner = 2; state._winCondition = 'hourglasses_collected'; }
                }
            }

            // ── CTF: check score threshold (first to 3 captures, or most at time) ──
            if (!state.winner && wcs.includes('most_captures') && state.matchScores) {
                const target = 3;
                if (state.matchScores[1] >= target) { state.winner = 1; state._winCondition = 'flag_captures'; }
                else if (state.matchScores[2] >= target) { state.winner = 2; state._winCondition = 'flag_captures'; }
            }

            // ── Timer expiry check ──
            if (!state.winner && state.matchClock && !state.suddenDeathActive) {
                const remaining = state.matchClock.timeLimitSec - state.matchClock.elapsedSec;
                if (remaining <= 0) {
                    _resolveTimerExpiry(mpMode);
                }
            }

            // ── Sudden Death: next relevant action wins (checked inline by kill/capture handlers) ──

            // ── Log & finalize ──
            if (state.winner && !state._winLogged) {
                state._winLogged = true;
                const winMsgs = {
                    wipeout: `Player ${state.winner} wins by eliminating all enemies!`,
                    tower_destroyed: `Player ${state.winner} wins by slaying the enemy Dragon!`,
                    hourglasses_collected: `Player ${state.winner} wins by collecting all hourglasses!`,
                    most_kills: `Player ${state.winner} wins with the most kills!`,
                    most_points: `Player ${state.winner} wins with the most points!`,
                    most_captures: `Player ${state.winner} wins with the most flag captures!`,
                    flag_captures: `Player ${state.winner} wins by reaching the capture target!`,
                    sudden_death: `Player ${state.winner} wins in Sudden Death!`,
                };
                addLog(winMsgs[state._winCondition] || `Player ${state.winner} wins the match!`);
                addLog('All remaining hourglasses and hidden items are now revealed.');
                setTimeout(() => finalizeMatch(), 0);
            }
        }

        // ── Resolve what happens when the timer hits zero ──
        function _resolveTimerExpiry(mpMode) {
            const scores1 = _getModeScore(1, mpMode);
            const scores2 = _getModeScore(2, mpMode);

            if (scores1 > scores2) {
                state.winner = 1;
                state._winCondition = mpMode.scoringType === 'kills' ? 'most_kills' : mpMode.scoringType === 'ctf' ? 'most_captures' : 'most_points';
            } else if (scores2 > scores1) {
                state.winner = 2;
                state._winCondition = mpMode.scoringType === 'kills' ? 'most_kills' : mpMode.scoringType === 'ctf' ? 'most_captures' : 'most_points';
            } else if (mpMode.suddenDeath) {
                // Tied — enter Sudden Death
                state.suddenDeathActive = true;
                state.matchClock.paused = true;
                addLog('⚡ TIME\'S UP — SCORES ARE TIED! SUDDEN DEATH! Next score wins!');
                showCombatBanner('⚡ SUDDEN DEATH!', 'Next score wins the match!', 'neutral');
                shakeBoard('hard');
                playSfx('levelUp');
            } else {
                // Draw
                state.winner = 0;
                state._winCondition = 'draw';
                state._winLogged = true;
                addLog('⏱ Time\'s up! The match ends in a draw.');
            }
        }

        // ── Get the relevant score for a player based on mode ──
        function _getModeScore(player, mpMode) {
            if (!mpMode) mpMode = getActiveMultiplayerMode();
            if (mpMode.scoringType === 'kills') return state.matchKills[player] || 0;
            if (mpMode.scoringType === 'domination' || mpMode.scoringType === 'hotspot') return state.matchScores[player] || 0;
            if (mpMode.scoringType === 'ctf') return state.matchScores[player] || 0;
            return 0;
        }

        // ── Called every round to tick the match clock and domination scoring ──
        function tickMatchClock() {
            if (!state.matchClock || state.matchClock.paused || state.winner) return;

            // Tick elapsed time based on rounds (each round ≈ a game "second" for balance)
            // For real-time feel: increment by ~15 seconds per round
            const SECONDS_PER_ROUND = 15;
            state.matchClock.elapsedSec = Math.min(
                state.matchClock.elapsedSec + SECONDS_PER_ROUND,
                state.matchClock.timeLimitSec + 1 // allow 1 over to trigger expiry
            );

            // ── Domination: award points for owned nexus ──
            const mpMode = getActiveMultiplayerMode();
            if (mpMode.scoringType === 'domination' && state.nexusPoints) {
                const ptsPerNex = mpMode.pointsPerNexusPerRound || 10;
                for (const key of ['earth', 'above', 'below']) {
                    const nex = state.nexusPoints[key];
                    if (nex && nex.owner && nex.owner > 0) {
                        const prevScore = state.matchScores[nex.owner] || 0;
                        state.matchScores[nex.owner] = prevScore + ptsPerNex;
                        // Milestone alert every 100 points
                        const newScore = state.matchScores[nex.owner];
                        if (Math.floor(newScore / 100) > Math.floor(prevScore / 100)) {
                            const milestone = Math.floor(newScore / 100) * 100;
                            addLog(`🚩 Player ${nex.owner} reaches ${milestone} Domination points!`);
                            showCombatBanner(`🚩 ${milestone} PTS`, `Player ${nex.owner}`, nex.owner === getViewerPlayer() ? 'pickup-friendly' : 'pickup-enemy');
                            playSfx('newRound');
                        }
                    }
                }
            }

            // ── Hotspot: points while holding the roaming nexus ──
            if (mpMode.scoringType === 'hotspot' && state.roamingNexus) {
                const rn = state.roamingNexus;
                if (rn.owner && rn.owner > 0) {
                    state.matchScores[rn.owner] = (state.matchScores[rn.owner] || 0) + 5;
                }
                // Auto-relocate if uncaptured for too long (8 rounds)
                rn._idleRounds = (rn._idleRounds || 0) + 1;
                if (rn._idleRounds >= 8 && rn.owner === 0) {
                    state.roamingNexus = null;
                    addLog('🔥 The Hotspot Nexus relocated — no one claimed it in time!');
                    _spawnRoamingNexus();
                }
            }

            // ── CTF: auto-return dropped flags after 5 rounds ──
            if (mpMode.hasFlags && state.flags) {
                for (const p of [1, 2]) {
                    const fl = state.flags[p];
                    if (fl && !fl.carriedBy && !fl.atBase) {
                        fl._droppedRounds = (fl._droppedRounds || 0) + 1;
                        if (fl._droppedRounds >= 5) {
                            _returnFlagToBase(p);
                            addLog(`🏳️ Player ${p}'s flag auto-returned to base after being uncollected.`);
                        }
                    } else if (fl) {
                        fl._droppedRounds = 0;
                    }
                }
            }
        }

        // ══════════════════════════════════════════════════════
        // ROAMING NEXUS (Hotspot mode)
        // ══════════════════════════════════════════════════════
        function _spawnRoamingNexus() {
            // Find a random passable tile in the Earth section for the nexus
            const eStart = MAP_SECTIONS.earth ? MAP_SECTIONS.earth.startRow : 0;
            const eEnd = MAP_SECTIONS.earth ? MAP_SECTIONS.earth.endRow : bh() - 1;
            const candidates = [];
            for (let y = eStart; y <= eEnd; y++) {
                for (let x = 2; x < bw() - 2; x++) { // avoid edges near sanctuaries
                    if (isTerrainPassable(x, y) && !unitAt(x, y)) {
                        candidates.push({ x, y });
                    }
                }
            }
            if (candidates.length === 0) return;
            candidates.sort(() => Math.random() - 0.5);
            const spot = candidates[0];
            const nzSize = 2;
            state.roamingNexus = {
                x: spot.x, y: spot.y,
                zoneX: spot.x, zoneY: spot.y,
                zoneSize: nzSize,
                owner: 0,
                progress: 0,
            };
            addLog(`🔥 A new Hotspot Nexus appears at ${coordLabel(spot.x, spot.y)}!`);
            showCombatBanner('🔥 HOTSPOT!', `New Nexus at ${coordLabel(spot.x, spot.y)}`, 'neutral');
        }

        // Called when a roaming nexus is captured in Hotspot mode
        function _captureRoamingNexus(player) {
            const mpMode = getActiveMultiplayerMode();
            const pts = mpMode.pointsPerCapture || 50;
            state.matchScores[player] = (state.matchScores[player] || 0) + pts;
            addLog(`🔥 Player ${player} captures the Hotspot Nexus! +${pts} points!`);
            showCombatBanner('🔥 NEXUS CAPTURED!', `Player ${player} +${pts} pts`, player === getViewerPlayer() ? 'pickup-friendly' : 'pickup-enemy');
            shakeBoard('hard');
            playSfx('playerHourglass');

            // Sudden death check
            if (state.suddenDeathActive && mpMode.tiebreaker === 'sudden_death_nexus') {
                state.winner = player;
                state._winCondition = 'sudden_death';
                return;
            }

            // Respawn nexus elsewhere
            state.roamingNexus = null;
            setTimeout(() => {
                if (state.winner) return;
                _spawnRoamingNexus();
                renderBattleUpdate();
            }, 1500);
        }

        // ══════════════════════════════════════════════════════
        // CTF FLAG MECHANICS
        // ══════════════════════════════════════════════════════

        // Check if a unit can pick up or interact with a flag on their tile
        function checkFlagPickup(unit) {
            if (!state.flags || !unit || unit.dead) return;
            const mpMode = getActiveMultiplayerMode();
            if (!mpMode.hasFlags) return;

            const enemyPlayer = unit.player === 1 ? 2 : 1;
            const enemyFlag = state.flags[enemyPlayer];
            const ownFlag = state.flags[unit.player];

            // ── Pick up enemy flag ──
            if (enemyFlag && !enemyFlag.carriedBy && enemyFlag.x === unit.x && enemyFlag.y === unit.y) {
                enemyFlag.carriedBy = unit.id;
                enemyFlag.atBase = false;
                addLog(`🏳️ ${unitDisplayName(unit)} grabs Player ${enemyPlayer}'s flag!`);
                showFloatingTextForUnit(unit, '🏳️ FLAG!', 'streak', { durationMs: 1400 });
                showCombatBanner('🏳️ FLAG TAKEN!', `Player ${unit.player} has the flag!`, unit.player === getViewerPlayer() ? 'pickup-friendly' : 'pickup-enemy');
                playSfx('playerHourglass');
                shakeBoard('normal');
            }

            // ── Return own flag if it's been dropped here ──
            if (ownFlag && !ownFlag.carriedBy && !ownFlag.atBase && ownFlag.x === unit.x && ownFlag.y === unit.y) {
                _returnFlagToBase(unit.player);
                addLog(`🏳️ ${unitDisplayName(unit)} returns their team's flag to base!`);
                showFloatingTextForUnit(unit, '🏳️ RETURNED', 'buff', { durationMs: 1200 });
            }

            // ── Score: carrying enemy flag + at own sanctuary ──
            if (enemyFlag && enemyFlag.carriedBy === unit.id) {
                const sanc = state.sanctuaries?.[unit.player];
                if (sanc) {
                    const nearChurch = Math.abs(unit.x - sanc.churchX) <= 1 && Math.abs(unit.y - sanc.churchY) <= 1;
                    if (nearChurch) {
                        _scoreFlagCapture(unit, enemyPlayer);
                    }
                }
            }
        }

        function _scoreFlagCapture(unit, enemyPlayer) {
            state.matchScores[unit.player] = (state.matchScores[unit.player] || 0) + 1;
            addLog(`🏆 Player ${unit.player} CAPTURES Player ${enemyPlayer}'s flag! Score: ${state.matchScores[1]}–${state.matchScores[2]}`);
            showCombatBanner('🏆 FLAG CAPTURED!', `Score: ${state.matchScores[1]} – ${state.matchScores[2]}`, unit.player === getViewerPlayer() ? 'pickup-friendly' : 'pickup-enemy');
            shakeBoard('hard');
            playSfx('playerHourglass');
            grantXP(unit, 25, 'flagCapture');

            // Return enemy flag to their base
            _returnFlagToBase(enemyPlayer);

            // Sudden death check
            if (state.suddenDeathActive) {
                const mpMode = getActiveMultiplayerMode();
                if (mpMode.tiebreaker === 'sudden_death_flag') {
                    state.winner = unit.player;
                    state._winCondition = 'sudden_death';
                }
            }
        }

        function _returnFlagToBase(player) {
            const flag = state.flags?.[player];
            if (!flag) return;
            const sanc = state.sanctuaries?.[player];
            flag.carriedBy = null;
            flag.atBase = true;
            flag.x = sanc ? sanc.churchX : (player === 1 ? 0 : bw() - 1);
            flag.y = sanc ? sanc.churchY : Math.floor(bh() / 2);
        }

        // Called when a flag carrier dies — drop the flag at their location
        function dropFlagOnDeath(unit) {
            if (!state.flags || !unit) return;
            for (const p of [1, 2]) {
                const flag = state.flags[p];
                if (flag && flag.carriedBy === unit.id) {
                    flag.carriedBy = null;
                    flag.x = unit.x;
                    flag.y = unit.y;
                    flag.atBase = false;
                    addLog(`🏳️ Player ${p}'s flag dropped at ${coordLabel(unit.x, unit.y)}!`);
                    showCombatBanner('🏳️ FLAG DROPPED!', `At ${coordLabel(unit.x, unit.y)}`, 'neutral');
                }
            }
        }

        function getMoveTiles(unit) {
            const maxCost = getEffectiveMove(unit);
            const tiles = [];
            const tileSet = new Set();
            const bestCost = new Map([
                [posKey(unit.x, unit.y), 0]
            ]);
            const open = [{
                x: unit.x,
                y: unit.y,
                cost: 0
            }];
            while (open.length) {
                // PERF: min-scan + swap-remove — O(n) instead of sort's O(n log n)
                let minI = 0;
                for (let i = 1; i < open.length; i++) {
                    if (open[i].cost < open[minI].cost) minI = i;
                }
                const cur = open[minI];
                open[minI] = open[open.length - 1];
                open.pop();
                const curKey = posKey(cur.x, cur.y);
                if (cur.cost > (bestCost.get(curKey) ?? Infinity)) continue;
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
                    const nx = cur.x + dx;
                    const ny = cur.y + dy;
                    // Diagonal: require at least one adjacent cardinal tile to be passable (no wall-clipping)
                    if (dx !== 0 && dy !== 0) {
                        const canPassX = isInside(cur.x + dx, cur.y) && unitCanTraverse(unit, cur.x + dx, cur.y);
                        const canPassY = isInside(cur.x, cur.y + dy) && unitCanTraverse(unit, cur.x, cur.y + dy);
                        if (!canPassX && !canPassY) continue;
                    }
                    const key = posKey(nx, ny);
                    if (!isInside(nx, ny) || !unitCanTraverse(unit, nx, ny)) continue;
                    // Enemies block — friendlies don't
                    const _occupant = unitAt(nx, ny);
                    if (_occupant && _occupant.player !== unit.player) continue;
                    const nextCost = cur.cost + getTerrainMoveCost(unit, nx, ny);
                    if (nextCost > maxCost) continue;
                    if (nextCost >= (bestCost.get(key) ?? Infinity)) continue;
                    bestCost.set(key, nextCost);
                    // Can land on empty tiles — friendly-occupied tiles are pass-through only (can't stack)
                    // Buildings (church, shop) and tower tiles are pass-through only — can't land on them
                    const _landTerrain = getTerrainAt(nx, ny);
                    const _isBuilding = _landTerrain === 'sanctuary_church' || _landTerrain === 'sanctuary_shop' || isTowerTile(nx, ny);
                    if (!_occupant && !_isBuilding && !tileSet.has(key)) {
                        tileSet.add(key);
                        tiles.push({
                            x: nx,
                            y: ny,
                            cost: nextCost
                        });
                    }
                    open.push({
                        x: nx,
                        y: ny,
                        cost: nextCost
                    });
                }
            }
            return tiles;
        }

        function getAttackTiles(unit) {
            const tiles = [];
            const tileSet = new Set();
            for (let y = 0; y < bh(); y++) {
                for (let x = 0; x < bw(); x++) {
                    const d = Math.abs(unit.x - x) + Math.abs(unit.y - y);
                    if (d >= 1 && d <= getEffectiveRange(unit) && !isRangeBlockedByTerrain(unit.x, unit.y, x, y)) {
                        // Fog of War: human players can only see/target tiles in vision
                        if (state.fogOfWar && !state.autoPlayers?.[unit.player] && !isInVision(unit, x, y)) continue;
                        tiles.push({
                            x,
                            y
                        });
                        tileSet.add(posKey(x, y));
                    }
                }
            }
            // ── Telescope: add tiles with sky enemies visible via telescope (even if ground tile is fogged) ──
            if (unitHasTelescope(unit) && getSectionForUnit(unit) === 'earth' && true) {
                const skyTargets = getTelescopeSkyTargets(unit.player);
                for (const [pk, skyUnit] of skyTargets) {
                    if (tileSet.has(pk)) continue; // already included
                    const d = Math.abs(unit.x - skyUnit.x) + Math.abs(unit.y - skyUnit.y);
                    if (d >= 1 && d <= getEffectiveRange(unit) && !isRangeBlockedByTerrain(unit.x, unit.y, skyUnit.x, skyUnit.y)) {
                        tiles.push({
                            x: skyUnit.x,
                            y: skyUnit.y,
                            _skyTarget: true
                        });
                        tileSet.add(pk);
                    }
                }
            }
            // ── Towers: enemy towers are always targetable if in range (known static positions) ──
            if (getSectionForUnit(unit) === 'earth' && state.towers) {
                const enemyTower = state.towers[unit.player === 1 ? 2 : 1];
                if (enemyTower && enemyTower.hp > 0) {
                    const tpk = posKey(enemyTower.x, enemyTower.y);
                    if (!tileSet.has(tpk)) {
                        const td = Math.abs(unit.x - enemyTower.x) + Math.abs(unit.y - enemyTower.y);
                        if (td >= 1 && td <= getEffectiveRange(unit) && !isRangeBlockedByTerrain(unit.x, unit.y, enemyTower.x, enemyTower.y)) {
                            tiles.push({ x: enemyTower.x, y: enemyTower.y });
                            tileSet.add(tpk);
                        }
                    }
                }
            }
            return tiles;
        }

        function getInspectTiles(unit) {
            const tiles = [];
            const inspectReach = getEffectiveInspect(unit);
            if (inspectReach <= 0) return tiles;
            for (let y = 0; y < bh(); y++) {
                for (let x = 0; x < bw(); x++) {
                    const d = Math.max(Math.abs(unit.x - x), Math.abs(unit.y - y));
                    if (d > inspectReach) continue;
                    if (isRangeBlockedByTerrain(unit.x, unit.y, x, y)) continue;
                    tiles.push({
                        x,
                        y
                    });
                }
            }
            return tiles;
        }

        /** Floor-aware posKey for scanned tiles — prevents cross-floor scan bleed */
        function scanKey(x, y) {
            return `${x},${y}`;
        }


