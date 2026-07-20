        function builderIconMarkup(type) {
            const icons = {
                hp: '♥',
                mp: '✦',
                atk: '⚔',
                range: '➶',
                move: '➜',
                scan: '⌕'
            };
            return `<span class="builder-icon ${type}">${icons[type] || '•'}</span>`;
        }

        function makeBarRow(label, value, max) {
            const pct = Math.max(0, Math.min(100, (value / max) * 100));
            const iconMap = {
                HP: 'hp',
                MP: 'mp',
                ATK: 'atk',
                RNG: 'range',
                MOV: 'move',
                AWR: 'scan'
            };
            const iconType = iconMap[label] || 'scan';
            return `
        <div class="bar-row">
          <div class="bar-label">${builderIconMarkup(iconType)}<span>${label}</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          <div>${value}</div>
        </div>
      `;
        }

        function escapeHtml(value) {
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function getItemIconHtml(itemKey, size) {
            const sz = size || 20;
            const rule = ITEM_RULES[itemKey];
            if (rule && rule.baneType) {
                return `<div class="bane-sprite bane-${rule.baneType}" style="width:${sz}px;height:${sz}px;background-size:${sz}px ${sz}px;display:inline-block;vertical-align:middle"></div>`;
            }
            const meta = ITEM_META[itemKey];
            return meta?.icon || '📦';
        }

        function unitSpriteDataUri(cls, player = 1) {
            const palettes = {
                1: {
                    team: '#5aa9ff',
                    accent: '#dcedff'
                },
                2: {
                    team: '#ff6b6b',
                    accent: '#ffe0e0'
                }
            };
            const team = palettes[player] || palettes[1];
            const sprites = {
                'Gunslinger': [
                    [5, 1, 6, 2, team.team],
                    [4, 3, 8, 2, '#f0d5b7'],
                    [3, 5, 10, 3, '#6d4c41'],
                    [4, 8, 8, 4, team.team],
                    [2, 12, 4, 3, '#2b2b36'],
                    [10, 12, 4, 3, '#2b2b36']
                ],
                'Warrior': [
                    [5, 1, 6, 2, '#cfd8e6'],
                    [4, 3, 8, 2, '#f0d5b7'],
                    [3, 5, 10, 3, '#8f99aa'],
                    [4, 8, 8, 4, team.team],
                    [2, 12, 4, 3, '#6c7383'],
                    [10, 12, 4, 3, '#6c7383']
                ],
                'Black Mage': [
                    [4, 0, 8, 3, team.accent],
                    [5, 3, 6, 2, '#f0d5b7'],
                    [4, 5, 8, 3, '#49306b'],
                    [3, 8, 10, 5, team.team],
                    [2, 13, 4, 2, '#2b2b36'],
                    [10, 13, 4, 2, '#2b2b36']
                ],
                'White Mage': [
                    [4, 0, 8, 2, team.accent],
                    [5, 2, 6, 3, '#f0d5b7'],
                    [3, 5, 10, 3, '#ffffff'],
                    [3, 8, 10, 5, team.team],
                    [2, 13, 4, 2, '#d9dde8'],
                    [10, 13, 4, 2, '#d9dde8']
                ],
                'Agent': [
                    [4, 1, 8, 2, '#1f2534'],
                    [5, 3, 6, 2, '#e2c0a0'],
                    [3, 5, 10, 3, '#2b2f3f'],
                    [4, 8, 8, 4, team.team],
                    [2, 12, 4, 3, '#1c1f2b'],
                    [10, 12, 4, 3, '#1c1f2b']
                ]
            };
            const parts = sprites[cls] || sprites['Warrior'];
            const rects = parts.map(([x, y, w, h, fill]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`).join('');
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect width="16" height="16" fill="transparent"/>${rects}</svg>`;
            return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
        }

        function renderUnitSprite(cls, player, cssClass, race, equipment, gender) {
            const src = getUnitSpriteByRace(cls, player, race, equipment, gender);
            return `<img class="${cssClass}" src="${src}" alt="${cls}" draggable="false" />`;
        }
        window.renderUnitSprite = renderUnitSprite;

        function classifySpell(spell) {
            if (!spell) return 'damage';

            const t = spell.type;
            if (t === 'damage' || t === 'heal' || t === 'buff' || t === 'debuff' || t === 'utility') return t;

            const k = spell.kind;
            if (!k) return t || 'damage';
            if (['heal', 'selfHeal', 'revive', 'zoneHeal', 'cleanse'].includes(k)) return 'heal';
            if (['buff', 'warCry', 'encore', 'aoeShield', 'shield'].includes(k)) return 'buff';
            if (['debuff', 'zoneDebuff'].includes(k)) return 'debuff';
            if (['scan', 'remoteView', 'warpRune', 'summonWeather', 'utility', 'mimic', 'displacement', 'pull', 'aoePull'].includes(k)) return 'utility';

            return t || 'damage';
        }

        function getSpellPowerLabel(spell) {
            if (!spell) return '';
            if (spell.dmg) return spell.dmg + ' dmg';
            if (spell.heal) return spell.heal + ' heal';
            if (spell.shield) return spell.shield + ' shield';
            if (spell.hitDamages && spell.hitDamages.length) {
                const total = spell.hitDamages.reduce((s, v) => s + v, 0);
                return total + ' dmg';
            }
            if (spell.dotDamage) return spell.dotDamage + '/tick';
            return '';
        }

        function sortSpellsForMenu(spells) {
            const order = {
                damage: 0,
                debuff: 1,
                buff: 2,
                heal: 3,
                utility: 4
            };
            return [...spells].sort((a, b) =>
                (order[classifySpell(a)] ?? 99) - (order[classifySpell(b)] ?? 99) ||
                a.cost - b.cost ||
                a.name.localeCompare(b.name)
            );
        }

    function ewToast(msg, duration) {
      duration = duration || 2200;
      const existing = document.querySelector('.ew-toast');
      if (existing) existing.remove();
      const t = document.createElement('div');
      t.className = 'ew-toast';
      t.textContent = msg;
      (document.getElementById("game-viewport") || document.body).appendChild(t);
      setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 350); }, duration);
    }

    function ewConfirm(msg, onOk, onCancel, opts) {
      opts = opts || {};
      const overlay = document.createElement('div');
      overlay.className = 'ew-banner-overlay';
      const box = document.createElement('div');
      box.className = 'ew-banner-box';
      box.innerHTML = '<div class="ew-banner-msg">' + msg.replace(/</g,'&lt;').replace(/\n/g,'<br>') + '</div>';
      const btns = document.createElement('div');
      btns.className = 'ew-banner-btns';
      const okBtn = document.createElement('button');
      okBtn.className = 'ew-banner-btn ' + (opts.okClass || 'primary');
      okBtn.textContent = opts.okLabel || 'Confirm';
      okBtn.onclick = () => { overlay.remove(); if (onOk) onOk(); };
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'ew-banner-btn secondary';
      cancelBtn.textContent = opts.cancelLabel || 'Cancel';
      cancelBtn.onclick = () => { overlay.remove(); if (onCancel) onCancel(); };
      if (opts.hideCancel) {
        btns.appendChild(okBtn);
      } else {
        btns.appendChild(cancelBtn);
        btns.appendChild(okBtn);
      }
      box.appendChild(btns);
      overlay.appendChild(box);
      (document.getElementById("game-viewport") || document.body).appendChild(overlay);
      okBtn.focus();
    }

    function ewAlert(msg, onDone) {
      ewConfirm(msg, onDone, null, { hideCancel: true, okLabel: 'OK' });
    }

    function ewSaveLoadModal(opts) {

      const overlay = document.createElement('div');
      overlay.className = 'ew-banner-overlay';
      const box = document.createElement('div');
      box.className = 'ew-banner-box';
      box.style.minWidth = '380px';
      const maxSlots = opts.maxSlots || 10;

      function getSlots() {
        try { return JSON.parse(localStorage.getItem(opts.storageKey) || '{}'); } catch(e) { return {}; }
      }
      function setSlots(data) {
        try { localStorage.setItem(opts.storageKey, JSON.stringify(data)); } catch(e) {}
      }

      function renderModal() {
        const slots = getSlots();
        const names = Object.keys(slots);
        const title = opts.mode === 'save' ? ('Save ' + opts.type) : ('Load ' + opts.type);
        let html = '<div class="ew-banner-msg" style="font-size:15px;font-weight:700;margin-bottom:12px">' + title + '</div>';

        if (opts.mode === 'save') {
          html += '<input class="ew-banner-input" id="ewSaveNameInput" type="text" maxlength="40" placeholder="Enter a name..." value="' + (opts.defaultName || '').replace(/"/g,'&quot;') + '" />';
          if (names.length >= maxSlots) {
            html += '<div style="font-size:10px;color:var(--red);margin-bottom:8px">Max ' + maxSlots + ' slots reached. Delete one to save a new one.</div>';
          }
        }

        if (names.length > 0) {
          html += '<div class="ew-save-list">';
          names.forEach((name, ni) => {
            const entry = slots[name];
            const dateStr = entry.savedAt ? new Date(entry.savedAt).toLocaleDateString() : '';
            html += '<div class="ew-save-item" data-name="' + name.replace(/"/g,'&quot;') + '">'
              + '<div><div class="ew-save-name">' + name.replace(/</g,'&lt;') + '</div><div class="ew-save-date">' + dateStr + '</div></div>'
              + '<button class="ew-save-del" data-del="' + ni + '" title="Delete">✕</button>'
              + '</div>';
          });
          html += '</div>';
        } else {
          html += '<div style="font-size:11px;color:var(--muted);margin-bottom:14px">No saved ' + opts.type + 's yet.</div>';
        }

        html += '<div class="ew-banner-btns">';
        html += '<button class="ew-banner-btn secondary" id="ewSlCancel">Cancel</button>';
        if (opts.mode === 'save') {
          html += '<button class="ew-banner-btn primary" id="ewSlSave">Save</button>';
        } else {
          html += '<button class="ew-banner-btn primary" id="ewSlLoad" disabled>Load</button>';
        }
        html += '</div>';
        box.innerHTML = html;

        box.querySelector('#ewSlCancel').onclick = () => overlay.remove();

        box.querySelectorAll('.ew-save-del').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            const item = btn.closest('.ew-save-item');
            const delName = item.dataset.name;
            const s = getSlots(); delete s[delName]; setSlots(s);
            renderModal();
          };
        });

        if (opts.mode === 'save') {
          const nameInput = box.querySelector('#ewSaveNameInput');
          const saveBtn = box.querySelector('#ewSlSave');

          box.querySelectorAll('.ew-save-item').forEach(item => {
            item.onclick = () => { nameInput.value = item.dataset.name; nameInput.focus(); };
          });
          saveBtn.onclick = () => {
            const name = nameInput.value.trim();
            if (!name) return;
            const s = getSlots();
            if (!s[name] && Object.keys(s).length >= maxSlots) {
              ewToast('Max ' + maxSlots + ' slots reached. Delete one first.');
              return;
            }
            overlay.remove();
            if (opts.onSave) opts.onSave(name, s);
          };
          nameInput.onkeydown = (e) => { if (e.key === 'Enter') saveBtn.click(); if (e.key === 'Escape') overlay.remove(); };
          setTimeout(() => nameInput.focus(), 50);
        } else {

          let selectedName = null;
          const loadBtn = box.querySelector('#ewSlLoad');
          box.querySelectorAll('.ew-save-item').forEach(item => {
            item.onclick = () => {
              box.querySelectorAll('.ew-save-item').forEach(x => x.classList.remove('selected'));
              item.classList.add('selected');
              selectedName = item.dataset.name;
              loadBtn.disabled = false;
            };
            item.ondblclick = () => {
              selectedName = item.dataset.name;
              overlay.remove();
              if (opts.onLoad) opts.onLoad(selectedName, getSlots());
            };
          });
          loadBtn.onclick = () => {
            if (!selectedName) return;
            overlay.remove();
            if (opts.onLoad) opts.onLoad(selectedName, getSlots());
          };
        }
      }

      overlay.appendChild(box);
      (document.getElementById("game-viewport") || document.body).appendChild(overlay);
      renderModal();
    }

        let _cpbSelectedSlot = 0;
        let _cpbSelectedRosterId = null;
        let _cpbView = 'roster';

        function _renderCampaignBuilder() {
            const save = state.campaignSave;
            if (!save) return;
            const lvlId = state.campaignLevelId || 1;
            const lvl = (typeof CAMPAIGN_LEVELS !== 'undefined' && CAMPAIGN_LEVELS[lvlId - 1])
                ? CAMPAIGN_LEVELS[lvlId - 1] : null;
            if (!lvl) return;

            const teamSize = lvl.teamSize;

            const hasAllyPool = !!(lvl.allyRacePool && lvl.allyRacePool.length);
            const playerSlotCount = hasAllyPool ? Math.min(save.roster.length, teamSize) : teamSize;
            const allySlotStart = playerSlotCount;

            if (!save.partySlots) save.partySlots = [];
            while (save.partySlots.length < playerSlotCount) save.partySlots.push(null);
            if (save.partySlots.length > playerSlotCount) save.partySlots.length = playerSlotCount;

            if (_cpbSelectedSlot >= playerSlotCount) _cpbSelectedSlot = 0;

            const teamsEl = document.getElementById('teams');
            if (teamsEl) teamsEl.innerHTML = '';
            const sidebarPanel = document.getElementById('sidebarPanel');
            if (sidebarPanel) sidebarPanel.style.display = 'none';

            const builderOverlay = document.getElementById('builderOverlay');
            if (!builderOverlay) return;

            const _prevRoster = builderOverlay.querySelector('.cpb-roster-grid');
            const _prevScroll = _prevRoster ? _prevRoster.scrollTop : 0;

            const assignedSet = new Set(save.partySlots.filter(Boolean));

            let slotsHtml = '';
            for (let i = 0; i < teamSize; i++) {
                const isAllySlot = (hasAllyPool && i >= allySlotStart);
                if (isAllySlot) {

                    slotsHtml += `<div class="cpb-slot cpb-slot-ally">
                        <div class="cpb-slot-sprite cpb-empty-sprite">⚔</div>
                        <div class="cpb-slot-info">
                            <div class="cpb-slot-name">Ally</div>
                            <div class="cpb-slot-sub">Joins you in battle</div>
                        </div>
                    </div>`;
                    continue;
                }
                const rosterId = save.partySlots[i];
                const rosterUnit = rosterId ? save.roster.find(r => r.id === rosterId) : null;
                const isSel = (i === _cpbSelectedSlot);
                if (rosterUnit) {
                    const prof = (typeof RACE_PROFILES !== 'undefined') ? RACE_PROFILES[rosterUnit.race] : null;
                    const spriteUrl = (typeof getR2RaceSpriteUrl === 'function')
                        ? getR2RaceSpriteUrl(rosterUnit.race, rosterUnit.gender, rosterUnit.job)
                        : '';
                    slotsHtml += `<div class="cpb-slot${isSel ? ' cpb-slot-sel' : ''}" onclick="window._cpbSelectSlot(${i})">
                        <div class="cpb-slot-sprite" style="background-image:url('${spriteUrl}')"></div>
                        <div class="cpb-slot-info">
                            <div class="cpb-slot-name">${_escHtml(rosterUnit.name)}</div>
                            <div class="cpb-slot-sub">${_escHtml(prof?.label || rosterUnit.race)} · ${_escHtml(rosterUnit.job)} · Lv.${rosterUnit.level}</div>
                        </div>
                        <button class="cpb-slot-remove" onclick="event.stopPropagation();window._cpbUnassign(${i})" title="Remove">✕</button>
                    </div>`;
                } else {
                    slotsHtml += `<div class="cpb-slot cpb-slot-empty${isSel ? ' cpb-slot-sel' : ''}" onclick="window._cpbSelectSlot(${i})">
                        <div class="cpb-slot-sprite cpb-empty-sprite">?</div>
                        <div class="cpb-slot-info">
                            <div class="cpb-slot-name">Slot ${i + 1}</div>
                            <div class="cpb-slot-sub">Select a unit from roster</div>
                        </div>
                    </div>`;
                }
            }

            let rosterHtml = '';
            for (const ru of save.roster) {
                const isAssigned = assignedSet.has(ru.id);

                const assignedSlotIdx = save.partySlots.indexOf(ru.id);
                const prof = (typeof RACE_PROFILES !== 'undefined') ? RACE_PROFILES[ru.race] : null;
                const spriteUrl = (typeof getR2RaceSpriteUrl === 'function')
                    ? getR2RaceSpriteUrl(ru.race, ru.gender, ru.job) : '';

                const xpThresholds = (typeof XP_THRESHOLDS !== 'undefined') ? XP_THRESHOLDS : [];
                const curLvlXp = xpThresholds[ru.level - 1] || 0;
                const nextLvlXp = xpThresholds[ru.level] || curLvlXp;
                const xpInLevel = ru.xp - curLvlXp;
                const xpNeeded = nextLvlXp - curLvlXp;
                const _xpMaxLvl = (typeof XP_MAX_LEVEL !== 'undefined') ? XP_MAX_LEVEL : 100;
                const xpPct = (ru.level >= _xpMaxLvl) ? 100 : (xpNeeded > 0 ? Math.min(100, (xpInLevel / xpNeeded) * 100) : 0);

                rosterHtml += `<div class="cpb-roster-card${isAssigned ? ' cpb-assigned' : ''}" onclick="window._cpbAssign('${ru.id}')">
                    <div class="cpb-rc-sprite" style="background-image:url('${spriteUrl}')"></div>
                    <div class="cpb-rc-info">
                        <div class="cpb-rc-name">${_escHtml(ru.name)}</div>
                        <div class="cpb-rc-sub">${_escHtml(prof?.label || ru.race)} · ${_escHtml(ru.job)}</div>
                        <div class="cpb-rc-level">Lv.${ru.level}</div>
                        <div class="cpb-rc-xpbar"><div class="cpb-rc-xpfill" style="width:${xpPct}%"></div></div>
                    </div>
                    ${isAssigned ? `<div class="cpb-rc-badge">Slot ${assignedSlotIdx + 1}</div>` : ''}
                </div>`;
            }

            const allFilled = save.partySlots.slice(0, playerSlotCount).every(id => !!id);

            builderOverlay.innerHTML = `
            <div class="cpb-screen">
                <div class="cpb-top-bar">
                    <button class="cpb-back-btn" onclick="window._cpbBackToMap()">← Map</button>
                    <div class="cpb-title">Level ${lvl.id}: ${_escHtml(lvl.name)}</div>
                    <div class="cpb-team-size">${teamSize}v${teamSize}</div>
                </div>
                <div class="cpb-body">
                    <div class="cpb-slots-col">
                        <div class="cpb-slots-header">Party</div>
                        <div class="cpb-slots-list">${slotsHtml}</div>
                        <button class="cpb-autofill-btn" onclick="window._cpbAutoFill()">✨ Auto-Fill</button>
                    </div>
                    <div class="cpb-roster-col">
                        <div class="cpb-roster-header">Roster (${save.roster.length} units)</div>
                        <div class="cpb-roster-grid">${rosterHtml}</div>
                    </div>
                </div>
                <div class="cpb-bottom-bar">
                    <button class="cpb-start-btn${allFilled ? '' : ' cpb-btn-disabled'}" onclick="window._cpbStartBattle()"${allFilled ? '' : ' disabled'}>Start Battle →</button>
                </div>
            </div>`;

            const _newRoster = builderOverlay.querySelector('.cpb-roster-grid');
            if (_newRoster && _prevScroll) _newRoster.scrollTop = _prevScroll;
        }

        function _escHtml(s) {
            return (typeof escapeHtml === 'function') ? escapeHtml(s) : String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        window._cpbSelectSlot = function(i) {
            _cpbSelectedSlot = i;
            if (typeof playSfx === 'function') playSfx('uiCursorMove');
            renderBuilder();
        };

        window._cpbAssign = function(rosterId) {
            const save = state.campaignSave;
            if (!save) return;

            if (save.partySlots[_cpbSelectedSlot] === rosterId) {
                save.partySlots[_cpbSelectedSlot] = null;
                if (typeof playSfx === 'function') playSfx('uiCursorMove');
                renderBuilder();
                return;
            }

            const existingSlot = save.partySlots.indexOf(rosterId);
            if (existingSlot >= 0) {

                save.partySlots[existingSlot] = save.partySlots[_cpbSelectedSlot];
            }

            save.partySlots[_cpbSelectedSlot] = rosterId;
            if (typeof playSfx === 'function') playSfx('uiButtonConfirm');

            const nextEmpty = save.partySlots.indexOf(null, _cpbSelectedSlot + 1);
            if (nextEmpty >= 0) {
                _cpbSelectedSlot = nextEmpty;
            }

            if (typeof saveCampaign === 'function') saveCampaign(save);
            renderBuilder();
        };

        window._cpbUnassign = function(slotIdx) {
            const save = state.campaignSave;
            if (!save) return;
            save.partySlots[slotIdx] = null;
            if (typeof playSfx === 'function') playSfx('uiCursorMove');
            if (typeof saveCampaign === 'function') saveCampaign(save);
            renderBuilder();
        };

        window._cpbAutoFill = function() {
            const save = state.campaignSave;
            if (!save) return;
            if (typeof playSfx === 'function') playSfx('uiButtonConfirm');

            const lvlId = state.campaignLevelId || 1;
            const lvl = (typeof CAMPAIGN_LEVELS !== 'undefined' && CAMPAIGN_LEVELS[lvlId - 1])
                ? CAMPAIGN_LEVELS[lvlId - 1] : null;
            if (!lvl) return;
            const teamSize = lvl.teamSize;
            const hasAllyPool = !!(lvl.allyRacePool && lvl.allyRacePool.length);
            const fillCount = hasAllyPool ? Math.min(save.roster.length, teamSize) : teamSize;

            const sorted = save.roster.slice().sort((a, b) => {
                if (b.level !== a.level) return b.level - a.level;
                return b.xp - a.xp;
            });

            save.partySlots = [];
            const used = new Set();
            for (let i = 0; i < fillCount; i++) {
                const pick = sorted.find(r => !used.has(r.id));
                if (pick) {
                    save.partySlots.push(pick.id);
                    used.add(pick.id);
                } else {
                    save.partySlots.push(null);
                }
            }

            if (typeof saveCampaign === 'function') saveCampaign(save);
            renderBuilder();
        };

        window._cpbBackToMap = function() {
            if (typeof playSfx === 'function') playSfx('uiButtonConfirm');

            if (state.campaignSave && typeof saveCampaign === 'function') saveCampaign(state.campaignSave);

            state.gameState = GS.CAMPAIGN_MAP;

            const startOverlay = document.getElementById('startOverlay');
            if (startOverlay) {
                startOverlay.classList.remove('hidden');
                startOverlay.style.display = '';
                startOverlay.style.pointerEvents = '';
                startOverlay.removeAttribute('aria-hidden');
            }
            if (typeof renderCampaignMap === 'function') renderCampaignMap();
            const pages = document.querySelectorAll('#startOverlay .title-page');
            pages.forEach(p => p.classList.remove('active'));
            const mapPage = document.getElementById('campaignMapPage');
            if (mapPage) mapPage.classList.add('active');
        };

        window._cpbStartBattle = function() {
            const save = state.campaignSave;
            if (!save) return;
            const lvlId = state.campaignLevelId || 1;
            const lvl = (typeof CAMPAIGN_LEVELS !== 'undefined' && CAMPAIGN_LEVELS[lvlId - 1])
                ? CAMPAIGN_LEVELS[lvlId - 1] : null;
            if (!lvl) return;

            if (!save.partySlots.every(id => !!id)) {
                if (typeof playSfx === 'function') playSfx('uiError');
                return;
            }

            if (typeof playSfx === 'function') playSfx('uiButtonConfirm');

            if (typeof startCampaignBattle === 'function') {
                startCampaignBattle(lvlId);
            } else {
                console.error('[Campaign] startCampaignBattle not found');
            }
        };

        function renderBuilder() {
            if (state.phase !== 'setup') return;

            if (state.isCampaign && state.campaignSave) {
                _renderCampaignBuilder();
                return;
            }

            repairPartyBuilderState();
            if (ONLINE_RULES.active) state.builderSelectedPlayer = _myPlayer();
            if (state.builderSelectedSlot >= CONFIG.teamSize) state.builderSelectedSlot = CONFIG.teamSize - 1;

            if (typeof window._mountReactPartyBuilder === 'function') {

                const teamsEl = document.getElementById('teams');
                const sidebarHead = document.querySelector('#sidebarPanel .compact-head h2');
                if (sidebarHead) sidebarHead.textContent = 'Your Roster';
                const sideHg = document.querySelector('#sidebarPanel .small-team-score');
                if (sideHg) sideHg.style.display = 'none';

                const players = ONLINE_RULES.active ? [_myPlayer()] : (state.showPlayer2Builder ? [1, 2] : [1]);
                const bp = state.builderSelectedPlayer || 1;
                const bs = state.builderSelectedSlot || 0;
                if (teamsEl) {
                    teamsEl.innerHTML = players.map(pNum => {
                        const pLabel = ONLINE_RULES.active ? `Player ${pNum} (You)` : `Player ${pNum} ${pNum === 1 ? '' : '(CPU)'}`;
                        return `<div class="roster-panel">
                          <div class="roster-panel-title"><span>${escapeHtml(pLabel)}</span><span style="font-size:9px;color:var(--muted)">${CONFIG.teamSize} slots</span></div>
                          ${state.partyBuilds[pNum].map((cn, i) => {
                            cn = normalizeClassName(cn, DEFAULT_BUILDS[pNum]?.[i]);
                            const nm = normalizeDisplayedUnitName(state.partyNames?.[pNum]?.[i], cn, pNum, i);
                            const mt = state.partyMeta?.[pNum]?.[i] || getArchetypeForJob(cn);
                            const id = resolveIdentityForBuild(cn, mt);
                            const sel = pNum === bp && i === bs;
                            const fClass = id.faction ? ('faction-' + id.faction) : '';
                            return `<div class="roster-slot ${fClass}${sel ? ' selected' : ''}" onclick="state.builderSelectedPlayer=${pNum};state.builderSelectedSlot=${i};renderBuilder()">
                              <div class="roster-sprite-wrap">${renderUnitSprite(cn, pNum, 'roster-sprite-inner', id.race || '', getDefaultEquipment(cn), id.gender || mt.gender || '')}</div>
                              <div class="roster-slot-info">
                                <div class="roster-slot-name">${escapeHtml(typeof getRaceLabel==='function' ? getRaceLabel(id.race, id.gender||mt.gender||'male') : (RACE_PROFILES[id.race]?.label || id.race || '?'))}</div>
                                <div class="roster-slot-sub">${escapeHtml(cn)}</div>
                                <div class="roster-slot-badges">${renderTypeBadges(id.types || [])}</div>
                              </div>
                            </div>`;
                          }).join('')}
                        </div>`;
                    }).join('');
                }

                if (!state.builderConfirmedSlots) state.builderConfirmedSlots = {};

                window._mountReactPartyBuilder();
                return;
            }

        }

    window.randomizeUnitSlot = randomizeUnitSlot;
    window.randomizeParty = randomizeParty;
    window.copyUnitSlot = copyUnitSlot;
    window.pasteUnitSlot = pasteUnitSlot;
    window.renderBuilder = renderBuilder;

    function syncBuilderCenter() {
      const p = state.builderSelectedPlayer || 1;
      const i = state.builderSelectedSlot || 0;
      const v = (id) => document.getElementById(id)?.value || '';
      const has = (id) => !!document.getElementById(id);
      if (has('pb-name')) state.partyNames[p][i] = v('pb-name') || '';
      if (!state.partyMeta[p]) state.partyMeta[p] = [];
      if (!state.partyMeta[p][i]) state.partyMeta[p][i] = {};
      if (has('pb-zodiac')) state.partyMeta[p][i].zodiac = v('pb-zodiac');

      if (!state.loadouts[p]) state.loadouts[p] = [];
      if (!state.loadouts[p][i]) state.loadouts[p][i] = emptyLoadout();
      const lo = state.loadouts[p][i];
      lo.items = Object.fromEntries(Object.keys(ITEM_RULES).map(k => [k, 0]));
      lo.items.healPotion = 1;
      lo.items.manaPotion = 1;
      lo.items.panacea = 1;

      if (!lo.equipment) lo.equipment = emptyEquipment();
      if (has('pb-acc1')) lo.equipment.accessory1 = v('pb-acc1') || null;
      if (has('pb-acc2')) lo.equipment.accessory2 = v('pb-acc2') || null;
      state.teamLockedIn = false;
    }

    let _layoutCache = { valid: false, topHud: 98, bottomHud: 130, rowWidth: 0, rowHeight: 0, stageW: 0, stageH: 0, parentW: 0, parentH: 0, stageOffX: 0, stageOffY: 0 };
    function invalidateLayoutCache() { _layoutCache.valid = false; }
    window.addEventListener('resize', invalidateLayoutCache);

    function measureBattleHudHeights() {
      if (_layoutCache.valid) {
        return { topHud: _layoutCache.topHud, bottomHud: _layoutCache.bottomHud, total: _layoutCache.topHud + _layoutCache.bottomHud };
      }
      const mapRowEl = document.getElementById('mapRow');

      const _mapRowHidden = !mapRowEl || mapRowEl.style.display === 'none' || mapRowEl.offsetParent === null;
      const sbEl = mapRowEl?.querySelector('.battle-hud-scoreboard');
      const rosterEl = mapRowEl?.querySelector('.battle-hud-roster');
      const sbHeight = sbEl?.offsetHeight || 90;
      const bottomHud = rosterEl?.offsetHeight || 130;
      const topHud = sbHeight + 8;

      _layoutCache.rowWidth = mapRowEl?.clientWidth || window.innerWidth - 16;
      _layoutCache.rowHeight = mapRowEl?.clientHeight || Math.max(0, window.innerHeight - 140);
      _layoutCache.topHud = topHud;
      _layoutCache.bottomHud = bottomHud;

      if (boardStageEl) {
        _layoutCache.stageW = boardStageEl.offsetWidth || 1;
        _layoutCache.stageH = boardStageEl.offsetHeight || 1;
        const parent = boardStageEl.parentElement;
        _layoutCache.parentW = parent?.clientWidth || _layoutCache.stageW;
        _layoutCache.parentH = parent?.clientHeight || _layoutCache.stageH;
        _layoutCache.stageOffX = boardStageEl.offsetLeft || 0;
        _layoutCache.stageOffY = boardStageEl.offsetTop || 0;
      }

      _layoutCache.valid = !_mapRowHidden;

      if (mapCenterEl) {
        if (mapCenterEl.style.paddingTop)    mapCenterEl.style.paddingTop = '';
        if (mapCenterEl.style.paddingBottom) mapCenterEl.style.paddingBottom = '';
      }
      return { topHud, bottomHud, total: topHud + bottomHud };
    }

    function syncBattleMapSquare() {
      if (!mapCenterEl || state.phase !== 'battle') return;
      if (mapCenterEl.style.width) mapCenterEl.style.width = '';
      if (mapCenterEl.style.height) mapCenterEl.style.height = '';
    }

    function computeBattleTileSize() {

      return BASE_TILE;
    }

    window.addEventListener('resize', () => {
      if (state.phase === 'battle') {
        syncBattleMapSquare();
        renderBoard();
      }
    });

    const WEATHER_TILE_COLORS = {
      tornado: 'rgba(180,180,180,0.5)',
      earthquake: 'rgba(160,100,40,0.5)',
      hurricane: 'rgba(80,140,200,0.5)',
      bloodRain: 'rgba(200,40,40,0.5)',
      drought: 'rgba(220,180,60,0.4)',
      voidStorm: 'rgba(60,20,100,0.5)',
      solarFlare: 'rgba(255,160,40,0.5)',
      thunderstorm: 'rgba(180,200,255,0.5)',
      tesseractStorm: 'rgba(0,255,200,0.35)',
      sandstorm: 'rgba(200,160,80,0.4)',
      blizzard: 'rgba(136,204,255,0.4)',
    };
    const WEATHER_OUTLINE_COLORS = {
      tornado: 'rgba(180,180,180,0.85)',
      earthquake: 'rgba(180,120,50,0.85)',
      hurricane: 'rgba(80,150,220,0.85)',
      bloodRain: 'rgba(220,50,50,0.85)',
      drought: 'rgba(220,180,60,0.8)',
      voidStorm: 'rgba(140,70,220,0.85)',
      solarFlare: 'rgba(255,170,50,0.85)',
      thunderstorm: 'rgba(110,150,255,0.85)',
      tesseractStorm: 'rgba(0,255,200,0.9)',
      sandstorm: 'rgba(200,160,80,0.85)',
      blizzard: 'rgba(136,204,255,0.9)',
    };

    const ZONE_OUTLINE_COLORS_BY_NAME = {
      'Sanctuary':      'rgba(255,220,120,0.90)',
      'Cold Spot':      'rgba(140,210,240,0.90)',
      'Bubble':         'rgba(140,180,255,0.90)',
      'Star Decree':    'rgba(180,120,255,0.90)',
      'Dimensional Web':'rgba(180,200,220,0.85)',
      // Gravity fields (2026-07-17): heavy void-purple crush, airy cyan lift.
      'Gravity Crush':  'rgba(120,80,220,0.90)',
      'Low Gravity':    'rgba(120,230,220,0.90)',
    };
    const ZONE_OUTLINE_COLORS_BY_TYPE = {
      heal:    'rgba(120,220,120,0.85)',
      debuff:  'rgba(200,80,200,0.85)',
      shield:  'rgba(140,180,255,0.85)',
      delayed: 'rgba(220,80,80,0.85)',
    };
    function getZoneOutlineColor(zone) {
      if (zone.spellName && ZONE_OUTLINE_COLORS_BY_NAME[zone.spellName]) return ZONE_OUTLINE_COLORS_BY_NAME[zone.spellName];
      if (zone.type && ZONE_OUTLINE_COLORS_BY_TYPE[zone.type]) return ZONE_OUTLINE_COLORS_BY_TYPE[zone.type];
      return 'rgba(220,200,160,0.85)';
    }

    function chainWeatherEdges(edges) {
      const remaining = new Map();
      for (const e of edges) {
        const key = e.x1 + ',' + e.y1;
        if (!remaining.has(key)) remaining.set(key, []);
        remaining.get(key).push(e);
      }
      const loops = [];
      while (remaining.size > 0) {
        const firstKey = remaining.keys().next().value;
        const firstEdge = remaining.get(firstKey).pop();
        if (!remaining.get(firstKey).length) remaining.delete(firstKey);
        const loop = [{ x: firstEdge.x1, y: firstEdge.y1 }, { x: firstEdge.x2, y: firstEdge.y2 }];
        let safety = 0;
        while (safety++ < 600) {
          const last = loop[loop.length - 1];
          const first = loop[0];
          if (loop.length > 2 && Math.abs(last.x - first.x) < 0.5 && Math.abs(last.y - first.y) < 0.5) {
            loop.pop();
            break;
          }
          const nk = last.x + ',' + last.y;
          const candidates = remaining.get(nk);
          if (!candidates || !candidates.length) break;
          const next = candidates.pop();
          if (!candidates.length) remaining.delete(nk);
          loop.push({ x: next.x2, y: next.y2 });
        }
        if (loop.length >= 3) loops.push(loop);
      }
      return loops;
    }

    function weatherLoopToPath(pts, r) {
      const n = pts.length;
      if (n < 3) return '';
      const parts = [];
      for (let i = 0; i < n; i++) {
        const prev = pts[(i - 1 + n) % n];
        const curr = pts[i];
        const next = pts[(i + 1) % n];
        const dx1 = prev.x - curr.x, dy1 = prev.y - curr.y;
        const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
        const len1 = Math.hypot(dx1, dy1);
        const len2 = Math.hypot(dx2, dy2);
        if (len1 < 0.1 || len2 < 0.1) continue;
        const rr = Math.min(r, len1 / 2, len2 / 2);
        const p1x = curr.x + (dx1 / len1) * rr;
        const p1y = curr.y + (dy1 / len1) * rr;
        const p2x = curr.x + (dx2 / len2) * rr;
        const p2y = curr.y + (dy2 / len2) * rr;
        if (i === 0) parts.push(`M ${p1x} ${p1y}`);
        else parts.push(`L ${p1x} ${p1y}`);
        const cross = dx1 * dy2 - dy1 * dx2;
        const sweep = cross > 0 ? 0 : 1;
        parts.push(`A ${rr} ${rr} 0 0 ${sweep} ${p2x} ${p2y}`);
      }
      parts.push('Z');
      return parts.join(' ');
    }

    function updateTornadoOverlays() {

    }

    function updateRainOverlays() {
      const rb = (typeof ThreeVFXEffects !== 'undefined' && ThreeVFXEffects.startRain3D) ? ThreeVFXEffects
               : (window.ThreeVFX && window.ThreeVFX.isActive()) ? window.ThreeVFX : null;
      if (!rb) return;
      if (state.devAutoSim) {
        if (rb.isRain3DActive()) rb.stopRain3D();
        return;
      }
      const activeRain = (state.activeWeather || []).filter(
        w => ['thunderstorm', 'hurricane', 'bloodRain', 'tesseractStorm'].includes(w.type) && w.tiles && w.tiles.length > 0
      );
      if (activeRain.length === 0) {
        if (rb.isRain3DActive()) rb.stopRain3D();
      } else {
        rb.startRain3D(activeRain.map(w => ({ type: w.type, tiles: w.tiles })));
      }
    }

    let _ambientParticlesRunning = false;
    let _ambientParticles = [];
    let _ambientLastTime = 0;
    const _AMBIENT_FPS = 60;
    const _AMBIENT_FRAME_MS = 1000 / _AMBIENT_FPS;
    const _AMBIENT_COUNT = 60;

    function _initAmbientParticles(canvas) {
      const w = canvas.clientWidth || 800;
      const h = canvas.clientHeight || 600;
      _ambientParticles = [];
      for (let i = 0; i < _AMBIENT_COUNT; i++) {
        _ambientParticles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: 1 + Math.random() * 2.5,
          speedX: (Math.random() - 0.3) * 0.3,
          speedY: -0.1 - Math.random() * 0.25,
          opacity: 0.15 + Math.random() * 0.45,
          phase: Math.random() * Math.PI * 2,
          drift: 0.3 + Math.random() * 0.5
        });
      }
    }

    function _drawAmbientParticles(canvas) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || 800;
      const h = canvas.clientHeight || 600;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);
      const t = performance.now() * 0.001;
      for (const p of _ambientParticles) {
        const wobbleX = Math.sin(t * 0.8 + p.phase) * p.drift;
        const wobbleY = Math.cos(t * 0.5 + p.phase) * p.drift * 0.5;
        p.x += p.speedX + wobbleX * 0.05;
        p.y += p.speedY + wobbleY * 0.05;

        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
        const flickerOpacity = p.opacity * (0.6 + 0.4 * Math.sin(t * 1.2 + p.phase));
        ctx.globalAlpha = flickerOpacity;
        ctx.fillStyle = '#fffbe6';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function _ambientAnimLoop(now) {
      if (!_ambientParticlesRunning) return;
      if (now - _ambientLastTime >= _AMBIENT_FRAME_MS) {
        _ambientLastTime = now;
        const canvas = document.getElementById('ambientParticleCanvas');
        if (canvas) _drawAmbientParticles(canvas);
      }
      requestAnimationFrame(_ambientAnimLoop);
    }

    function startAmbientParticles() {
      if (_ambientParticlesRunning) return;
      if (state.devAutoSim) return;
      const canvas = document.getElementById('ambientParticleCanvas');
      if (!canvas) return;
      _initAmbientParticles(canvas);
      _ambientParticlesRunning = true;
      _ambientLastTime = performance.now();
      requestAnimationFrame(_ambientAnimLoop);
    }

    function stopAmbientParticles() {
      _ambientParticlesRunning = false;
      _ambientParticles = [];
      const canvas = document.getElementById('ambientParticleCanvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    let _lastWeatherOutlineKey = '';

    const _squareTilesFor = (cx, cy, r) => {
      const out = [];
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = cx + dx, ny = cy + dy;
          if (nx >= 0 && ny >= 0 && nx < bw() && ny < bh()) out.push({ x: nx, y: ny });
        }
      }
      return out;
    };

    function renderWeatherOutlines() {
      if (!weatherOutlineSvg) return;
      const _isDiorama = true;

      if (state.devAutoSim) {
        weatherOutlineSvg.innerHTML = ''; _lastWeatherOutlineKey = '';
        if (_zoneLayerEl) _zoneLayerEl.innerHTML = '';
        return;
      }

      const ts = CONFIG.tileSize;
      const _wKey = (state.activeWeather || []).map(w => w.id + ':' + w.tiles.length + ':' + (w.tiles[0] ? w.tiles[0].x + ',' + w.tiles[0].y : '')).join('|');
      const _zKey = (state._activeZones || []).map(z => (z.spellName || z.type) + ':' + z.x + ',' + z.y + ':' + (z.radius || 1) + ':' + (z.duration ?? '')).join('|');
      const _dKey = (state._delayedSpells || []).map(d => (d.spellName || 'delayed') + ':' + d.x + ',' + d.y + ':' + (d.aoeRadius || 1) + ':' + (d.roundsLeft ?? '')).join('|');
      const cacheKey = ts + '|' + (_isDiorama ? 'D' : 'F') + '|W' + _wKey + '|Z' + _zKey + '|D' + _dKey;
      const _svgHasContent = weatherOutlineSvg.children.length > 0;
      const _zoneHasContent = _zoneLayerEl && _zoneLayerEl.children.length > 0;
      if (cacheKey === _lastWeatherOutlineKey && (_isDiorama ? _zoneHasContent : _svgHasContent)) return;
      _lastWeatherOutlineKey = cacheKey;

      const gap = CONFIG.tileGap ?? 0;
      const pad = CONFIG.boardPadding ?? 2;

      if (state.phase !== 'battle') {
        weatherOutlineSvg.innerHTML = '';
        if (_zoneLayerEl) _zoneLayerEl.innerHTML = '';
        return;
      }

      if (_isDiorama && _zoneLayerEl) {
        weatherOutlineSvg.innerHTML = '';
        _zoneLayerEl.innerHTML = '';

        const _zoneGroups = [];

        for (const weather of (state.activeWeather || [])) {
          if (!weather.tiles?.length) continue;
          const color = WEATHER_OUTLINE_COLORS[weather.type] || 'rgba(255,255,255,0.6)';
          _zoneGroups.push({ tiles: weather.tiles, color, dashed: false });
        }

        for (const zone of (state._activeZones || [])) {
          const r = zone.radius || 1;
          const tiles = _squareTilesFor(zone.x, zone.y, r);
          const color = getZoneOutlineColor(zone);
          _zoneGroups.push({ tiles, color, dashed: false, spellName: zone.spellName || '' });
        }

        for (const ds of (state._delayedSpells || [])) {
          let dx = ds.x, dy = ds.y, dr = ds.aoeRadius || 1;
          let color = ZONE_OUTLINE_COLORS_BY_NAME[ds.spellName] || ZONE_OUTLINE_COLORS_BY_TYPE.delayed;
          if (ds.markedUnitId) {
            const _mu = (state.units || []).find(u => u.id === ds.markedUnitId && !u.dead);
            if (!_mu) continue;            // painted target gone — no dot
            dx = _mu.x; dy = _mu.y; dr = 0; // single-tile red laser dot that follows them
            color = '#ff2b2b';
          }
          const tiles = _squareTilesFor(dx, dy, dr);
          _zoneGroups.push({ tiles, color, dashed: true });
        }

        const _frag = document.createDocumentFragment();

        for (const grp of _zoneGroups) {
          const tileSet = new Set(grp.tiles.map(t => t.x + ',' + t.y));

          for (const t of grp.tiles) {
            const cell = document.createElement('div');
            cell.className = 'zone-cell' + (grp.dashed ? ' zone-dashed' : '')
                + (grp.spellName === 'Dimensional Web' ? ' zone-spiderweb' : '');
            cell.style.position = 'absolute';
            cell.style.width = ts + 'px';
            cell.style.height = ts + 'px';
            cell.style.left = (pad + t.x * (ts + gap)) + 'px';
            cell.style.top = (pad + t.y * (ts + gap)) + 'px';

            cell.style.setProperty('--zone-color', grp.color);

            const _fillColor = grp.color.replace(/[\d.]+\)$/, m => {
              const a = parseFloat(m);
              return (a * 0.32).toFixed(2) + ')';
            });
            cell.style.background = _fillColor;

            const _glowColor = grp.color.replace(/[\d.]+\)$/, m => {
              const a = parseFloat(m);
              return (a * 0.25).toFixed(2) + ')';
            });
            cell.style.boxShadow = 'inset 0 0 8px ' + _glowColor + ', 0 0 6px ' + _glowColor;

            const bw2 = '2.5px'; const bStyle = grp.dashed ? 'dashed' : 'solid';
            cell.style.borderTop    = tileSet.has(t.x + ',' + (t.y - 1)) ? 'none' : (bw2 + ' ' + bStyle + ' ' + grp.color);
            cell.style.borderRight  = tileSet.has((t.x + 1) + ',' + t.y) ? 'none' : (bw2 + ' ' + bStyle + ' ' + grp.color);
            cell.style.borderBottom = tileSet.has(t.x + ',' + (t.y + 1)) ? 'none' : (bw2 + ' ' + bStyle + ' ' + grp.color);
            cell.style.borderLeft   = tileSet.has((t.x - 1) + ',' + t.y) ? 'none' : (bw2 + ' ' + bStyle + ' ' + grp.color);

            const _zh = state.boardHeights?.[t.y]?.[t.x] ?? 0;
            let _zRoofExtra = 0;
            const _zObj = (typeof getObjectAt === 'function') ? getObjectAt(t.x, t.y) : null;
            if (_zObj && typeof OBJECT_RULES !== 'undefined' && OBJECT_RULES[_zObj]?.roofWalkable) {
              const _zOSpr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[_zObj] : null;
              if (_zOSpr && _zOSpr._roofZPx > 0) _zRoofExtra = _zOSpr._roofZPx;
            }

            const _zTotal = _getElevationPx(_zh) + _zRoofExtra + 2;
            cell.style.transform = 'translateZ(' + _zTotal + 'px)';

            _frag.appendChild(cell);
          }
        }

        _zoneLayerEl.appendChild(_frag);
        return;
      }

      if (_zoneLayerEl) _zoneLayerEl.innerHTML = '';

      const _bwPx = pad * 2 + bw() * ts + Math.max(0, bw() - 1) * gap;
      const _bhPx = pad * 2 + bh() * ts + Math.max(0, bh() - 1) * gap;
      weatherOutlineSvg.setAttribute('width', _bwPx);
      weatherOutlineSvg.setAttribute('height', _bhPx);
      weatherOutlineSvg.setAttribute('viewBox', `0 0 ${_bwPx} ${_bhPx}`);
      weatherOutlineSvg.style.width = _bwPx + 'px';
      weatherOutlineSvg.style.height = _bhPx + 'px';
      weatherOutlineSvg.innerHTML = '';

      const _drawOutline = (tiles, color, opts) => {
        opts = opts || {};
        const tileSet = new Set(tiles.map(t => t.x + ',' + t.y));
        const edges = [];
        for (const t of tiles) {
          const x0 = pad + t.x * (ts + gap);
          const y0 = pad + t.y * (ts + gap);
          const x1 = x0 + ts;
          const y1 = y0 + ts;
          if (!tileSet.has(t.x + ',' + (t.y - 1))) edges.push({ x1: x0, y1: y0, x2: x1, y2: y0 });
          if (!tileSet.has((t.x + 1) + ',' + t.y)) edges.push({ x1: x1, y1: y0, x2: x1, y2: y1 });
          if (!tileSet.has(t.x + ',' + (t.y + 1))) edges.push({ x1: x1, y1: y1, x2: x0, y2: y1 });
          if (!tileSet.has((t.x - 1) + ',' + t.y)) edges.push({ x1: x0, y1: y1, x2: x0, y2: y0 });
        }
        const loops = chainWeatherEdges(edges);
        for (const loop of loops) {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', weatherLoopToPath(loop, opts.cornerRadius || 7));
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', color);
          path.setAttribute('stroke-width', String(opts.strokeWidth || 2.5));
          path.setAttribute('stroke-linejoin', 'round');
          path.setAttribute('opacity', String(opts.opacity || 0.9));
          if (opts.dashed) path.setAttribute('stroke-dasharray', '6 4');
          weatherOutlineSvg.appendChild(path);
          const glow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          glow.setAttribute('d', path.getAttribute('d'));
          glow.setAttribute('fill', 'none');
          glow.setAttribute('stroke', color);
          glow.setAttribute('stroke-width', String(opts.glowWidth || 6));
          glow.setAttribute('stroke-linejoin', 'round');
          glow.setAttribute('opacity', String(opts.glowOpacity || 0.18));
          weatherOutlineSvg.insertBefore(glow, path);
        }
      };

      for (const weather of (state.activeWeather || [])) {
        if (!weather.tiles?.length) continue;
        const color = WEATHER_OUTLINE_COLORS[weather.type] || 'rgba(255,255,255,0.6)';
        _drawOutline(weather.tiles, color);
      }

      for (const zone of (state._activeZones || [])) {
        const r = zone.radius || 1;
        const tiles = _squareTilesFor(zone.x, zone.y, r);
        const color = getZoneOutlineColor(zone);
        _drawOutline(tiles, color, { strokeWidth: 2.5 });
      }

      for (const ds of (state._delayedSpells || [])) {
        let dx = ds.x, dy = ds.y, dr = ds.aoeRadius || 1;
        let color = ZONE_OUTLINE_COLORS_BY_NAME[ds.spellName] || ZONE_OUTLINE_COLORS_BY_TYPE.delayed;
        if (ds.markedUnitId) {
          const _mu = (state.units || []).find(u => u.id === ds.markedUnitId && !u.dead);
          if (!_mu) continue;             // painted target gone — no dot
          dx = _mu.x; dy = _mu.y; dr = 0; // single-tile red laser dot that follows them
          color = '#ff2b2b';
        }
        const tiles = _squareTilesFor(dx, dy, dr);
        _drawOutline(tiles, color, { dashed: true, strokeWidth: 2.5 });
      }
    }

    const RenderBus = {
        _listeners: new Map(),
        on(event, fn) {
            if (!this._listeners.has(event)) this._listeners.set(event, []);
            this._listeners.get(event).push(fn);
        },
        off(event, fn) {
            const arr = this._listeners.get(event);
            if (arr) {
                const idx = arr.indexOf(fn);
                if (idx >= 0) arr.splice(idx, 1);
            }
        },
        emit(event, data) {
            const fns = this._listeners.get(event);
            if (fns) for (let i = 0; i < fns.length; i++) fns[i](data);
        }
    };
    window.RenderBus = RenderBus;

    const _emptyArr = Object.freeze([]);
    let _hlCacheStore = { key: '', map: new Map() };

    const _unitCellCache = new Map();
    const _towerCellCache = new Map();
    const _decoyCellCache = new Map();

    function _unitPosStyle(x, y, unit) {
        const ts = CONFIG.tileSize || 64;
        const gap = CONFIG.tileGap ?? 0;
        const pad = CONFIG.boardPadding ?? 2;
        const left = pad + x * (ts + gap);
        const top = pad + y * (ts + gap);

        const unitZ = unit ? (unit.z ?? 0) : 0;
        let baseH = unitZ;
        let roofExtra = 0;
            if (bldgObj && typeof OBJECT_RULES !== 'undefined' && OBJECT_RULES[bldgObj]?.roofWalkable) {
                const bldgSpr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[bldgObj] : null;
                if (bldgSpr && bldgSpr._roofZPx > 0) {
                    roofExtra = bldgSpr._roofZPx;
                    baseH = state.boardHeights?.[y]?.[x] ?? 0;
                }
            }
        const elevPx = baseH !== 0 ? _getElevationPx(baseH) : 0;
        const totalZ = elevPx + roofExtra;
        return { left, top, totalZ, unitZ, baseH };
    }

    function _unitZIndex(y, unitZ) {
        const isP2 = document.body.classList.contains('is-p2-viewer');
        const bH = bh();
        return (isP2 ? (bH - y) : (y + 1)) + (unitZ * 100);
    }

    function _buildUnitInnerHTML(unit) {
        const hpPct = Math.max(0, Math.min(100, (unit.hp / unit.maxHp) * 100));
        const mpPct = unit.maxMp > 0 ? Math.max(0, Math.min(100, (unit.mp / unit.maxMp) * 100)) : 0;
        const shieldAmt = unit.shield || 0;
        const shieldPct = shieldAmt > 0 ? (shieldAmt / unit.maxHp) * 100 : 0;
        const hpTier = hpPct <= 25 ? 'hp-low' : hpPct <= 50 ? 'hp-mid' : '';
        const shieldSeg = shieldPct > 0 ? `<div class="hp-shield-fill" style="width:${shieldPct}%"></div>` : '';
        return `${buildUnitPlate(unit, hpPct, mpPct, hpTier, shieldSeg, shieldPct)}${renderBattleSprite(unit)}${_buildStatusAnimOverlay(unit)}`;
    }

    function _buildUnitDivClass(unit) {
        const hpPct = Math.max(0, Math.min(100, (unit.hp / unit.maxHp) * 100));
        const isBatForm = unit.race === 'vampire'
            && typeof canFly === 'function' && typeof isUnitAirborne === 'function'
            && canFly(unit) && isUnitAirborne(unit);
        const batTransClass = state._batTransformIds?.get(unit.id) || '';
        let cls = `unit p${unit.player}`;
        if (unit._dying) cls += ' map-dying';
        if (unitFinished(unit)) cls += ' exhausted';
        if (hpPct <= 25 && hpPct > 0) cls += ' low-hp';
        if ((unit._killStreak || 0) >= 2) cls += ' on-streak';
        if (unit._lastStandTriggered && !unit.dead) cls += ' last-stand';
        if (state.hitFlashIds?.has(unit.id)) cls += ' taking-hit';
        if (state.healFlashIds?.has(unit.id)) cls += ' healing-pop';
        if (state.statusWiggleIds?.has(unit.id)) cls += ' status-afflict';
        if (state.attackAnimIds?.has(unit.id)) cls += ' attacking-lunge';
        if (state.castAnimIds?.has(unit.id)) cls += ' casting-spell';
        if (state.dodgeAnimIds?.has(unit.id)) cls += ' dodging';
        if (isBatForm) cls += ' bat-form';
        if (batTransClass) cls += ' ' + batTransClass;
        return cls;
    }

    const _spriteGroundOffsets = new Map();
    window._spriteGroundOffsets = _spriteGroundOffsets;

    function _finishSpriteOffsetScan(url, img) {
        const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
        if (!w || !h) { _spriteGroundOffsets.set(url, { bottomGapPct: 0, topGapPct: 0, aspectRatio: 1, nativeW: 128, nativeH: 128, scanning: false }); return; }
        const cvs = document.createElement('canvas');
        cvs.width = w; cvs.height = h;
        const ctx = cvs.getContext('2d');
        ctx.drawImage(img, 0, 0);
        let data;
        try { data = ctx.getImageData(0, 0, w, h).data; }
        catch (_) { _spriteGroundOffsets.set(url, { bottomGapPct: 0, topGapPct: 0, aspectRatio: w / h, nativeW: w, nativeH: h, scanning: false }); return; }

        let lastOpaqueRow = -1;
        for (let y = h - 1; y >= 0 && lastOpaqueRow < 0; y--) {
            for (let x = 0; x < w; x++) {
                if (data[(y * w + x) * 4 + 3] > 32) { lastOpaqueRow = y; break; }
            }
        }

        let firstOpaqueRow = h;
        for (let y = 0; y < h && firstOpaqueRow === h; y++) {
            for (let x = 0; x < w; x++) {
                if (data[(y * w + x) * 4 + 3] > 32) { firstOpaqueRow = y; break; }
            }
        }

        const emptyBelow = lastOpaqueRow >= 0 ? (h - 1 - lastOpaqueRow) : 0;
        const emptyAbove = firstOpaqueRow < h ? firstOpaqueRow : 0;
        const bPct = (emptyBelow / h) * 100;
        const tPct = (emptyAbove / h) * 100;

        _spriteGroundOffsets.set(url, {
            bottomGapPct: bPct > 1.5 ? bPct : 0,
            topGapPct: tPct > 1.5 ? tPct : 0,
            aspectRatio: w / h,
            nativeW: w,
            nativeH: h,
            scanning: false
        });

        if (state.phase === 'battle') {
            scheduleBoardRender();

            if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.invalidateUnits) {
                ThreeRenderer.invalidateUnits();
            }
        }
    }

    window._finishSpriteOffsetScan = _finishSpriteOffsetScan;

    function _scanSpriteGroundOffset(url) {
        if (!url || _spriteGroundOffsets.has(url)) return;
        _spriteGroundOffsets.set(url, { bottomGapPct: 0, topGapPct: 0, aspectRatio: 1, nativeW: 0, nativeH: 0, scanning: true });

        if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive && ThreeRenderer.isActive()) {
            if (ThreeRenderer.scanSpriteOffset) {
                ThreeRenderer.scanSpriteOffset(url);
            }
            return;
        }
    }

    function _prescanUnitSpriteOffsets() {
        if (!state.units) return;
        const seen = new Set();
        for (const u of state.units) {
            if (u.dead) continue;
            const url = getBattleMapSpriteUrl(u);
            if (url && !seen.has(url)) {
                seen.add(url);
                _scanSpriteGroundOffset(url);
            }
        }
    }

    function _unitVisualFP(unit, x, y, isSelected, isPending, isCombo,
                           hitSet, healSet, wiggleSet, atkSet, castSet, dodgeSet,
                           batTransMap, flag1, flag2, selectedUnitId, pendingTarget,
                           nametagMode, viewerPlayer, targetState) {
        let fp = 2166136261;
        fp = Math.imul(fp ^ unit.id, 16777619);
        fp = Math.imul(fp ^ x, 16777619);
        fp = Math.imul(fp ^ y, 16777619);
        fp = Math.imul(fp ^ unit.player, 16777619);
        fp = Math.imul(fp ^ unit.hp, 16777619);
        fp = Math.imul(fp ^ unit.maxHp, 16777619);
        fp = Math.imul(fp ^ unit.mp, 16777619);
        fp = Math.imul(fp ^ unit.maxMp, 16777619);
        fp = Math.imul(fp ^ (unit.shield || 0), 16777619);
        fp = Math.imul(fp ^ (unit.ap || 0), 16777619);
        fp = Math.imul(fp ^ ((unit.z ?? 0) * 1000 | 0), 16777619);

        let bits = 0;
        if (unit._dying) bits |= 1;
        if (unitFinished(unit)) bits |= 2;
        if ((unit._killStreak || 0) >= 2) bits |= 4;
        if (unit._lastStandTriggered && !unit.dead) bits |= 8;
        if (hitSet?.has(unit.id)) bits |= 16;
        if (healSet?.has(unit.id)) bits |= 32;
        if (wiggleSet?.has(unit.id)) bits |= 64;
        if (atkSet?.has(unit.id)) bits |= 128;
        if (castSet?.has(unit.id)) bits |= 256;
        if (dodgeSet?.has(unit.id)) bits |= 512;
        if (isSelected) bits |= 1024;
        if (isPending) bits |= 2048;
        if (isCombo) bits |= 4096;
        if (batTransMap?.has(unit.id)) bits |= 8192;

        if (flag1 && flag1.carriedBy === unit.id) bits |= 16384;
        if (flag2 && flag2.carriedBy === unit.id) bits |= 32768;

        if (isSelected && unit.id === selectedUnitId) bits |= 65536;
        if (isPending && pendingTarget && !pendingTarget.viaHover) bits |= 131072;
        fp = Math.imul(fp ^ bits, 16777619);

        fp = Math.imul(fp ^ (unit._killStreak || 0), 16777619);

        const sKeys = getActiveStatusKeys(unit);
        for (let si = 0; si < sKeys.length; si++) {
            let sh = 0;
            const sk = sKeys[si];
            for (let ci = 0; ci < sk.length; ci++) sh = Math.imul(sh ^ sk.charCodeAt(ci), 16777619);
            fp = Math.imul(fp ^ sh, 16777619);
        }

        const atkD = typeof getStatusAtkDelta === 'function' ? getStatusAtkDelta(unit) : 0;
        const defD = typeof getStatusArmorDelta === 'function' ? getStatusArmorDelta(unit) : 0;
        const movD = typeof getStatusMoveDelta === 'function' ? getStatusMoveDelta(unit) : 0;
        // Plates render INT/MDEF/SPD stage badges too — hash them or a
        // stage change on those stats alone would never trigger a redraw.
        const intD = typeof getStatusIntDelta === 'function' ? getStatusIntDelta(unit) : 0;
        const mdefD = typeof getStatusMdefDelta === 'function' ? getStatusMdefDelta(unit) : 0;
        const spdD = typeof getStatStageCount === 'function' ? getStatStageCount(unit, 'spd') : 0;
        fp = Math.imul(fp ^ ((atkD + 500) * 100 | 0), 16777619);
        fp = Math.imul(fp ^ ((defD + 500) * 100 | 0), 16777619);
        fp = Math.imul(fp ^ ((movD + 500) * 100 | 0), 16777619);
        fp = Math.imul(fp ^ ((intD + 500) * 100 | 0), 16777619);
        fp = Math.imul(fp ^ ((mdefD + 500) * 100 | 0), 16777619);
        fp = Math.imul(fp ^ ((spdD + 50) * 100 | 0), 16777619);
        fp = Math.imul(fp ^ (unit.hourglassBuff || 0), 16777619);
        fp = Math.imul(fp ^ (unit._streakAtkBonus || 0), 16777619);
        fp = Math.imul(fp ^ (unit._lastStandAtkBonus || 0), 16777619);

        let nm = 0;
        const nms = nametagMode || 'name';
        for (let ci = 0; ci < nms.length; ci++) nm = Math.imul(nm ^ nms.charCodeAt(ci), 16777619);
        fp = Math.imul(fp ^ nm, 16777619);

        if (unit.race === 'vampire') fp = Math.imul(fp ^ 77, 16777619);

        if (unit._spriteOverride) {
            for (let si = 0; si < unit._spriteOverride.length; si++) fp = Math.imul(fp ^ unit._spriteOverride.charCodeAt(si), 16777619);
        }

        if (unit.race === 'werewolf') {
            const tod = (typeof getCurrentCyclePhase === 'function' && getCurrentCyclePhase() === 'day') ? 1 : 2;
            fp = Math.imul(fp ^ (tod * 999), 16777619);
        }

        if (unit._spriteFlipX) fp = Math.imul(fp ^ 8811, 16777619);

        if (atkSet?.has(unit.id)) {
            const ld = state._attackAnimDir?.[unit.id];
            if (ld) { fp = Math.imul(fp ^ ((ld.dx * 100) | 0), 16777619); fp = Math.imul(fp ^ ((ld.dy * 100) | 0), 16777619); }
        }
        if (dodgeSet?.has(unit.id)) {
            const dd = state._dodgeAnimDir?.[unit.id];
            if (dd) { fp = Math.imul(fp ^ ((dd.dx * 100) | 0), 16777619); fp = Math.imul(fp ^ ((dd.dy * 100) | 0), 16777619); }
        }

        const lvl = typeof getUnitLevel === 'function' ? getUnitLevel(unit) : 1;
        fp = Math.imul(fp ^ lvl, 16777619);

        fp = Math.imul(fp ^ (targetState || 0), 16777619);
        return fp >>> 0;
    }

    function _invalidateUnitCache() {
        _unitCellCache.clear();
        _towerCellCache.clear();
        _decoyCellCache.clear();
    }

    function _invalidateBoardGrid() {

        _lastBoardFP = null;
        invalidateLayoutCache();
        invalidateTerrainChunkCache();
    }

    function invalidateTerrainChunkCache() {}

    let _lastBoardFP = null;

    /* 1 game height level = 1 full tile of visual height. MUST match
       ELEV_STEP_RATIO in three-renderer.js (cube voxels) and three-camera.js —
       window._getElevationPx is the single converter from logic height levels
       to visual/world px used by the camera, VFX (three-vfx-effects.js,
       three-lightning.js) and DOM overlays. Game LOGIC heights (LOS, roof
       _gameHeight) stay on the legacy half-tile basis — see _buildBuildingPrism. */
    const ELEVATION_STEP_RATIO = 1.0;

    function _getElevationPx(heightLevel) {
        return Math.round(heightLevel * CONFIG.tileSize * ELEVATION_STEP_RATIO);
    }
    window._getElevationPx = _getElevationPx;

    function _appendNexusWalls(tile, nex, x, y) {
        if (!tile || !nex) return;
        if (false) return;
        const zs = nex.zoneSize | 0;
        if (zs <= 0) return;
        const ownerCls = (nex.owner === 1) ? 'owner-p1'
                       : (nex.owner === 2) ? 'owner-p2'
                       : 'owner-neutral';
        const onTop    = (y === nex.zoneY);
        const onBottom = (y === nex.zoneY + zs - 1);
        const onLeft   = (x === nex.zoneX);
        const onRight  = (x === nex.zoneX + zs - 1);
        const _mk = (dir) => {

            const wOut = document.createElement('div');
            wOut.className = `nexus-wall nexus-wall-${dir} nexus-wall-out ${ownerCls}`;
            tile.appendChild(wOut);
            const wIn = document.createElement('div');
            wIn.className = `nexus-wall nexus-wall-${dir} nexus-wall-in ${ownerCls}`;
            tile.appendChild(wIn);
        };
        if (onTop)    _mk('n');
        if (onBottom) _mk('s');
        if (onLeft)   _mk('w');
        if (onRight)  _mk('e');
    }

    function _buildNexusStatusLabel(nex, opts) {
        opts = opts || {};
        const isRoaming = !!opts.isRoaming;
        const isContested = !!opts.isContested;
        const mpMode = opts.mpMode || null;
        const offsetX = Number(opts.offsetX) || 0;
        const offsetY = Number(opts.offsetY) || 0;

        const el = document.createElement('div');
        let cls = 'nexus-status-label';
        if (nex.owner === 1) cls += ' owner-p1';
        else if (nex.owner === 2) cls += ' owner-p2';
        else cls += ' owner-neutral';
        if (isContested) cls += ' contested';
        if (isRoaming) cls += ' roaming';
        el.className = cls;

        if (offsetX !== 0) el.style.setProperty('--zone-ox', `${offsetX}px`);
        if (offsetY !== 0) el.style.setProperty('--zone-oy', `${offsetY}px`);

        if (state.boardHeights && typeof window._getElevationPx === 'function') {
            const _cX = nex.zoneX + Math.floor(nex.zoneSize / 2);
            const _cY = nex.zoneY + Math.floor(nex.zoneSize / 2);
            const _centerH = state.boardHeights[_cY]?.[_cX] ?? 0;
            let _maxH = _centerH;
            for (let _zy = nex.zoneY; _zy < nex.zoneY + nex.zoneSize; _zy++) {
                for (let _zx = nex.zoneX; _zx < nex.zoneX + nex.zoneSize; _zx++) {
                    const _h = state.boardHeights[_zy]?.[_zx] ?? 0;
                    if (_h > _maxH) _maxH = _h;
                }
            }
            if (_maxH > _centerH) {
                el.style.setProperty('--zone-roof-z',
                    window._getElevationPx(_maxH - _centerH) + 'px');
            }
        }

        const ownerEl = document.createElement('div');
        ownerEl.className = 'nl-owner';
        if (nex.owner === 1) ownerEl.textContent = 'P1';
        else if (nex.owner === 2) ownerEl.textContent = 'P2';
        else ownerEl.textContent = 'NEUTRAL';
        el.appendChild(ownerEl);

        const barEl = document.createElement('div');
        barEl.className = 'nl-bar';
        const prog = Number(nex.progress || 0);
        if (prog !== 0) {
            const magnitude = Math.min(1, Math.abs(prog) / NEXUS_CAPTURE_THRESHOLD);
            const fill = document.createElement('div');
            fill.className = 'nl-fill ' + (prog > 0 ? 'p1' : 'p2');
            if (prog > 0) {

                fill.style.left = '50%';
                fill.style.width = (magnitude * 50).toFixed(2) + '%';
            } else {

                fill.style.right = '50%';
                fill.style.width = (magnitude * 50).toFixed(2) + '%';
            }
            barEl.appendChild(fill);
        }
        el.appendChild(barEl);

        const numEl = document.createElement('div');
        numEl.className = 'nl-num';
        if (prog === 0) {
            numEl.textContent = '—';
        } else {
            numEl.textContent = `${Math.abs(prog)}/${NEXUS_CAPTURE_THRESHOLD}`;
        }
        el.appendChild(numEl);

        let modeText = '';
        let modeCls = '';
        if (mpMode) {
            const sType = mpMode.scoringType;

            if (sType === 'domination') {
                if (nex.owner !== 0) {
                    modeText = isContested ? 'Contested' : '+10 pts/round';
                }
            } else if (sType === 'hotspot') {
                const idle = Number(nex._idleRounds || 0);
                if (idle >= 5 && nex.owner === 0) {
                    modeText = `🔥 Relocates in ${Math.max(0, 8 - idle)}`;
                    modeCls = 'warning';
                } else {
                    modeText = '🔥 +50 on capture';
                }
            }
        }
        if (modeText) {
            const modeEl = document.createElement('div');
            modeEl.className = 'nl-mode' + (modeCls ? ' ' + modeCls : '');
            modeEl.textContent = modeText;
            el.appendChild(modeEl);
        }

        return el;
    }

    function renderBoard() {

      const _threeActive = !!(typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive());

      let _bfp = 0x811c9dc5 | 0;
      const _bfpI = (v) => { v = v | 0; _bfp = Math.imul(_bfp ^ (v & 0xffff), 16777619); _bfp = Math.imul(_bfp ^ (v >>> 16), 16777619); };
      const _bfpS = (s) => { if (s) for (let i = 0, n = s.length; i < n; i++) _bfp = Math.imul(_bfp ^ s.charCodeAt(i), 16777619); };

      _bfpI(state.phase === 'battle' ? 1 : state.phase === 'editor' ? 2 : 0);
      _bfpI(state.round || 0);
      _bfpI(state.activePlayer || 0);
      _bfpS(state.selectedUnitId || '');
      _bfpS(state.focusedUnitId || '');
      _bfpS(state.actionMode || '');
      _bfpS(state.actionMenuView || '');
      _bfpS(state.selectedTool || '');
      _bfpI(state._terrainVersion || 0);
      _bfpI(state.fogOfWar ? 1 : 0);
      _bfpI(state.winner || 0);

      for (let _i = 0; _i < state.units.length; _i++) {
        const u = state.units[_i];
        _bfpI(u.x); _bfpI(u.y); _bfpI(u.z ?? 0); _bfpI(u.hp); _bfpI(u.mp);
        _bfpI((u.dead ? 1 : 0) | ((u._dying ? 1 : 0) << 1));
        _bfpI(u._killStreak || 0);
        if (u.statuses) for (let _j = 0; _j < u.statuses.length; _j++) {
          _bfpS(u.statuses[_j].type); _bfpI(u.statuses[_j].remaining || 0);
        }
      }

      if (state.pendingTarget) { _bfpI(state.pendingTarget.x); _bfpI(state.pendingTarget.y); }

      _bfpS(state.comboPartner?.id || '');

      _bfpI(state.hitFlashIds?.size || 0);
      _bfpI(state.healFlashIds?.size || 0);
      _bfpI(state.statusWiggleIds?.size || 0);
      _bfpI(state.attackAnimIds?.size || 0);
      _bfpI(state.castAnimIds?.size || 0);
      _bfpI(state.dodgeAnimIds?.size || 0);

      const _aw = state.activeWeather;
      _bfpI(_aw ? _aw.length : 0);
      if (_aw && _aw.length) { _bfpI(_aw[0].tiles?.length || 0); _bfpS(_aw[0].type || ''); }

      _bfpI(state.bombs?.length || 0);
      _bfpI(state.plantedSeeds?.length || 0);
      _bfpI(state.turrets?.length || 0);
      _bfpI(state.wards?.length || 0);
      _bfpI(state.pings?.length || 0);
      _bfpI(state._deployedObjects?.length || 0);

      if (state.flags) {
        const f1 = state.flags[1], f2 = state.flags[2];
        if (f1) { _bfpI(f1.x); _bfpI(f1.y); _bfpS(f1.carriedBy || ''); }
        if (f2) { _bfpI(f2.x); _bfpI(f2.y); _bfpS(f2.carriedBy || ''); }
      }

      if (state.roamingNexus) { _bfpI(state.roamingNexus.zoneX); _bfpI(state.roamingNexus.zoneY); _bfpI(state.roamingNexus.owner || 0); _bfpI(state.roamingNexus.progress || 0); _bfpI(state.roamingNexus._idleRounds || 0); }

      if (state.towers) for (const tw of Object.values(state.towers)) { if (tw) _bfpI(tw.hp); }

      if (state.nexusPoints) for (const np of Object.values(state.nexusPoints)) { if (np) { _bfpI(np.owner || 0); _bfpI(np.progress || 0); } }

      _bfpI(state.scannedByPlayer ? 1 : 0);
      _bfpI(state._scanFadingKeys?.size || 0);

      _bfpS(typeof _walkAnimUnitId !== 'undefined' ? (_walkAnimUnitId || '') : '');

      _bfpI(typeof _displaceAnimUnitIds !== 'undefined' ? (_displaceAnimUnitIds?.size || 0) : 0);

      _bfpI(1);
      _bfpI(state._heightVersion || 0);
      _bfpI(state._voxelVersion || 0);
      if (_bfp === _lastBoardFP) {

        return;
      }
      _lastBoardFP = _bfp;

      if (boardStageEl && !boardStageEl.style.getPropertyValue('--dio-tilt')) {
          const _safeTilt = state.dioramaTiltDeg ?? 50;
          const _safeYaw = state.dioramaYawDeg ?? 0;
          boardStageEl.style.setProperty('--dio-tilt', `${_safeTilt}deg`);
          boardStageEl.style.setProperty('--dio-yaw', `${_safeYaw}deg`);
          boardStageEl.style.setProperty('--dio-tilt-num', `${_safeTilt}`);
      }

      const _prevTileSize = CONFIG.tileSize;
      if (state.phase === 'battle' || state.phase === 'editor') {
        syncBattleMapSquare();
        CONFIG.tileSize = computeBattleTileSize();

        if (state.phase === 'battle') _prescanUnitSpriteOffsets();
      } else {
        if (mapCenterEl) {
          mapCenterEl.style.width = '';
          mapCenterEl.style.height = '';
        }
        CONFIG.tileSize = MENU_TILE;
      }
      const _gridSizeChanged = CONFIG.tileSize !== _prevTileSize;
      if (_gridSizeChanged) {
        boardEl.style.gridTemplateColumns = `repeat(${bw()}, ${CONFIG.tileSize}px)`;
        boardEl.style.gridTemplateRows = `repeat(${bh()}, ${CONFIG.tileSize}px)`;
        boardEl.style.gap = `${CONFIG.tileGap ?? 0}px`;
        boardEl.style.padding = `${CONFIG.boardPadding ?? 2}px`;
        boardEl.style.setProperty('--tile-sz', CONFIG.tileSize + 'px');
      }

      if (!renderBoard._nebulaChecked) {
        const _nebulaEl = document.querySelector('.nebula-overlay');
        if (_nebulaEl && typeof BG_NEBULA !== 'undefined') {
          _nebulaEl.style.backgroundImage = `url("${BG_NEBULA}")`;
        }
        renderBoard._nebulaChecked = true;
      }

      if (projectileLayerEl && _gridSizeChanged) {
        requestAnimationFrame(() => {
          if (projectileLayerEl) {
            projectileLayerEl.style.width = boardEl.scrollWidth + 'px';
            projectileLayerEl.style.height = boardEl.scrollHeight + 'px';
          }
        });
      }

      const _BUILDING_PRISM_KEYS = new Set();
      (function _initBuildingKeys() {
        if (typeof OBJECT_SPRITES === 'undefined') return;
        for (const k of Object.keys(OBJECT_SPRITES)) {
          if (k.startsWith('building_') || k.startsWith('abandoned_building') ||
              k === 'ancient_building' || k.startsWith('church_') || k === 'church' ||
              k === 'shop' || k.startsWith('column_')) {
            _BUILDING_PRISM_KEYS.add(k);
          }
        }
      })();

      function _isBuildingKey(key) { return _BUILDING_PRISM_KEYS.has(key); }
      function _isChurchKey(key) { return key === 'church' || key.startsWith('church_'); }

      function _alphaScanSprite(oSpr) {
        if (oSpr._trim || oSpr._trimScanning) return;
        if (!oSpr.url) return;
        oSpr._trimScanning = true;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const w = img.naturalWidth, h = img.naturalHeight;
          const cvs = document.createElement('canvas');
          cvs.width = w; cvs.height = h;
          const ctx = cvs.getContext('2d');
          ctx.drawImage(img, 0, 0);
          let data;
          try { data = ctx.getImageData(0, 0, w, h).data; }
          catch (e) {

            oSpr._trim = { left: 0, right: w - 1, top: 0, bottom: h - 1 };
            oSpr.width = w;
            oSpr.height = h;
            oSpr._trimColor = '#5a4a3a';
            oSpr._trimScanning = false;
            if ((state.phase === 'battle' || state.phase === 'editor')) {
              state._terrainVersion = (state._terrainVersion || 0) + 1;
              markDirty('board'); renderIfDirty();
            }
            return;
          }
          let minX = w, maxX = 0, minY = h, maxY = 0;
          let rSum = 0, gSum = 0, bSum = 0, edgeCount = 0;

          const colTopY = new Int32Array(w).fill(-1);

          const rowMinX = new Int32Array(h).fill(w);
          const rowMaxX = new Int32Array(h).fill(-1);
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const a = data[(y * w + x) * 4 + 3];
              if (a > 128) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                if (colTopY[x] < 0) colTopY[x] = y;
                if (x < rowMinX[y]) rowMinX[y] = x;
                if (x > rowMaxX[y]) rowMaxX[y] = x;

                if (x <= minX + 4 || x >= maxX - 4) {
                  const idx = (y * w + x) * 4;
                  rSum += data[idx]; gSum += data[idx + 1]; bSum += data[idx + 2];
                  edgeCount++;
                }
              }
            }
          }
          if (maxX >= minX && maxY >= minY) {
            oSpr._trim = { left: minX, right: maxX, top: minY, bottom: maxY };

            oSpr.width = w;
            oSpr.height = h;
            if (edgeCount > 0) {
              oSpr._trimColor = `rgb(${Math.round(rSum / edgeCount)},${Math.round(gSum / edgeCount)},${Math.round(bSum / edgeCount)})`;
            }

            const trimRows = maxY - minY + 1;
            const rowStart = minY + Math.floor(trimRows * 0.1);
            const rowEnd = maxY - Math.floor(trimRows * 0.1);
            const rowWidths = [];
            for (let y = rowStart; y <= rowEnd; y++) {
              if (rowMaxX[y] >= rowMinX[y]) {
                rowWidths.push(rowMaxX[y] - rowMinX[y] + 1);
              }
            }
            if (rowWidths.length > 0) {
              rowWidths.sort((a, b) => a - b);
              const pIdx = Math.min(rowWidths.length - 1, Math.floor(rowWidths.length * 0.75));
              oSpr._coreWidth = rowWidths[pIdx];
            }

            const trimCols = maxX - minX + 1;
            const profileRaw = [];
            for (let x = minX; x <= maxX; x++) {
              profileRaw.push(colTopY[x] >= 0 ? colTopY[x] - minY : 0);
            }
            const MAX_PTS = 32;
            if (trimCols <= MAX_PTS) {
              oSpr._topProfile = profileRaw;
            } else {
              const sampled = [];
              for (let i = 0; i < MAX_PTS; i++) {
                const srcIdx = Math.round(i * (trimCols - 1) / (MAX_PTS - 1));
                sampled.push(profileRaw[srcIdx]);
              }
              oSpr._topProfile = sampled;
            }
          }
          oSpr._trimScanning = false;

          if ((state.phase === 'battle' || state.phase === 'editor')) {
            state._terrainVersion = (state._terrainVersion || 0) + 1;
            markDirty('board'); renderIfDirty();
          }
        };
        img.onerror = () => { oSpr._trimScanning = false; };
        img.src = oSpr.url;
        if (img.complete && img.naturalWidth) img.onload();
      }
      window._alphaScanSprite = _alphaScanSprite;

      let _cannonSpr = null;
      function _buildTurretPrism(turretData, tileSize) {
        const isSiege = turretData.spellId === 'siegeTurret';

        const footprintRatio = isSiege ? 0.85 : 0.6;
        const heightRatio = isSiege ? 0.8 : 0.6;
        const radius = Math.round(tileSize * footprintRatio * 0.5);
        const prismH = Math.round(tileSize * heightRatio);
        const panelCount = 8;
        const angleStep = (2 * Math.PI) / panelCount;

        const panelW = Math.ceil(2 * radius * Math.sin(Math.PI / panelCount)) + 1;

        const container = document.createElement('div');
        container.className = 'turret-prism';
        container.style.width = (radius * 2) + 'px';
        container.style.height = (radius * 2) + 'px';
        container.style.position = 'absolute';
        container.style.left = '50%';
        container.style.top = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.transformOrigin = 'center center';
        container.style.setProperty('--turret-prism-h', prismH + 'px');

        const brickUrl = (typeof TERRAIN_SPRITES !== 'undefined' && TERRAIN_SPRITES.bricks_3)
          ? TERRAIN_SPRITES.bricks_3[0] : '';

        for (let i = 0; i < panelCount; i++) {
          const angle = i * angleStep;
          const angleDeg = (angle * 180 / Math.PI);

          const panel = document.createElement('div');
          panel.className = 'turret-wall-panel';
          panel.style.width = panelW + 'px';
          panel.style.height = prismH + 'px';
          panel.style.position = 'absolute';

          panel.style.left = (radius - panelW / 2) + 'px';
          panel.style.top = radius + 'px';
          panel.style.transformOrigin = '50% 0%';

          panel.style.transform =
            `rotateZ(${angleDeg.toFixed(1)}deg) translateY(${-radius}px) rotateX(90deg)`;
          if (brickUrl) {
            panel.style.backgroundImage = `url("${brickUrl}")`;
            panel.style.backgroundSize = `${panelW}px ${prismH}px`;
          }
          panel.style.backgroundRepeat = 'no-repeat';
          panel.style.imageRendering = 'pixelated';

          const brightness = 0.45 + 0.3 * Math.abs(Math.cos(angle));
          panel.style.filter = `brightness(${brightness.toFixed(2)})`;
          container.appendChild(panel);
        }

        const floor = document.createElement('div');
        floor.className = 'turret-prism-floor';
        floor.style.position = 'absolute';
        floor.style.left = '0';
        floor.style.top = '0';
        floor.style.width = (radius * 2) + 'px';
        floor.style.height = (radius * 2) + 'px';
        floor.style.borderRadius = '50%';
        floor.style.background = '#0a0806';
        floor.style.transform = 'translateZ(1px)';
        container.appendChild(floor);

        const domeSlices = 8;
        const domeH = Math.round(radius * 0.75);
        const sliceStep = domeH / domeSlices;
        const domeContainer = document.createElement('div');
        domeContainer.className = 'turret-dome';
        domeContainer.style.position = 'absolute';
        domeContainer.style.left = '0';
        domeContainer.style.top = '0';
        domeContainer.style.width = (radius * 2) + 'px';
        domeContainer.style.height = (radius * 2) + 'px';
        domeContainer.style.transform = `translateZ(${prismH}px)`;
        domeContainer.style.transformStyle = 'preserve-3d';

        for (let i = 0; i < domeSlices; i++) {
          const z = i * sliceStep;

          const t = z / domeH;
          const ringR = Math.max(2, radius * Math.sqrt(1 - t * t));
          const ringD = Math.round(ringR * 2);

          const thickness = Math.ceil(sliceStep) + 2;

          const ring = document.createElement('div');
          ring.className = 'turret-dome-ring';
          ring.style.position = 'absolute';
          ring.style.width = ringD + 'px';
          ring.style.height = ringD + 'px';
          ring.style.left = Math.round(radius - ringR) + 'px';
          ring.style.top = Math.round(radius - ringR) + 'px';
          ring.style.borderRadius = '50%';

          ring.style.transform = `translateZ(${Math.round(z)}px)`;
          const domeTexUrl = 'https://cdn.entropywars.net/Assets/Sprites/terrain/concrete_floor.png';
          ring.style.backgroundImage = `url("${domeTexUrl}")`;
          ring.style.backgroundSize = `${ringD}px ${ringD}px`;
          ring.style.imageRendering = 'pixelated';

          ring.style.boxShadow = `0 0 0 0 transparent, inset 0 0 0 0 transparent`;

          const brightness = 0.65 + 0.35 * (1 - t);
          ring.style.filter = `brightness(${brightness.toFixed(2)})`;
          domeContainer.appendChild(ring);
        }

        const capR = Math.max(3, Math.round(radius * 0.15));
        const cap = document.createElement('div');
        cap.className = 'turret-dome-ring';
        cap.style.position = 'absolute';
        cap.style.width = (capR * 2) + 'px';
        cap.style.height = (capR * 2) + 'px';
        cap.style.left = (radius - capR) + 'px';
        cap.style.top = (radius - capR) + 'px';
        cap.style.borderRadius = '50%';
        cap.style.background = '';
        const domeTexUrl2 = 'https://cdn.entropywars.net/Assets/Sprites/terrain/concrete_floor.png';
        cap.style.backgroundImage = `url("${domeTexUrl2}")`;
        cap.style.backgroundSize = `${capR * 2}px ${capR * 2}px`;
        cap.style.imageRendering = 'pixelated';
        cap.style.transform = `translateZ(${domeH}px)`;
        cap.style.filter = 'brightness(0.6)';
        domeContainer.appendChild(cap);
        container.appendChild(domeContainer);

        const cannonUrl = (typeof TURRET_CANNON_SPRITE_URL !== 'undefined')
          ? TURRET_CANNON_SPRITE_URL : '';
        if (cannonUrl) {
          const R = 128;
          const cSprW = 32, cSprH = 128;
          const cScale = tileSize / R;

          const cCoreW = 10;
          const cSide = Math.max(3, Math.round(cCoreW * cScale));
          const cWallH = Math.round(cSprH * cScale);
          const cRoofZ = cWallH - Math.round(2 * cScale);

          const cannonPrism = document.createElement('div');
          cannonPrism.style.width = cSide + 'px';
          cannonPrism.style.height = cSide + 'px';
          cannonPrism.style.setProperty('--bldg-side', cSide + 'px');
          cannonPrism.style.position = 'absolute';
          cannonPrism.style.left = `${-cSide / 2}px`;
          cannonPrism.style.top = `${-cSide / 2}px`;
          cannonPrism.style.transformOrigin = 'center center';
          cannonPrism.style.transformStyle = 'preserve-3d';

          const cSprUrl = `url("${cannonUrl}")`;

          const cCoreLeft = Math.round((cSprW - cCoreW) / 2);
          function _applyCannonBg(face) {
            const faceW = parseFloat(face.style.width);
            const faceH = parseFloat(face.style.height);
            const bgW = (cSprW / cCoreW) * faceW;
            const bgH = (cSprH / cCoreW) * faceW;
            const bgX = -(cCoreLeft / cSprW) * bgW;
            const bgY = faceH - bgH;
            face.style.backgroundImage = cSprUrl;
            face.style.backgroundSize = bgW + 'px ' + bgH + 'px';
            face.style.backgroundPosition = bgX + 'px ' + bgY + 'px';
            face.style.backgroundRepeat = 'no-repeat';
            face.style.imageRendering = 'pixelated';
          }

          for (const cls of ['bldg-south', 'bldg-north', 'bldg-west', 'bldg-east']) {
            const dw = document.createElement('div');
            dw.className = 'bldg-billboard bldg-dark-inner ' + cls;
            dw.style.width = cSide + 'px';
            dw.style.height = cRoofZ + 'px';
            dw.style.backgroundColor = '#0a0806';
            cannonPrism.appendChild(dw);
          }

          for (const cls of ['bldg-south', 'bldg-north', 'bldg-west', 'bldg-east']) {
            const face = document.createElement('div');
            face.className = 'bldg-billboard ' + cls;
            face.style.width = cSide + 'px';
            face.style.height = cWallH + 'px';
            _applyCannonBg(face);
            cannonPrism.appendChild(face);
          }

          const cFloor = document.createElement('div');
          cFloor.className = 'bldg-billboard bldg-floor';
          cFloor.style.left = '0';
          cFloor.style.top = '0';
          cFloor.style.width = cSide + 'px';
          cFloor.style.height = cSide + 'px';
          cFloor.style.background = '#0a0806';
          cFloor.style.transform = 'translateZ(1px)';
          cannonPrism.appendChild(cFloor);

          const cRoof = document.createElement('div');
          cRoof.className = 'bldg-billboard bldg-roof';
          cRoof.style.left = '0';
          cRoof.style.top = '0';
          cRoof.style.width = cSide + 'px';
          cRoof.style.height = cSide + 'px';
          cRoof.style.transform = `translateZ(${cRoofZ}px)`;
          cRoof.style.background = '#1a1a1a';
          cannonPrism.appendChild(cRoof);

          const cannonMount = document.createElement('div');
          cannonMount.className = 'turret-cannon-mount';
          cannonMount.style.position = 'absolute';
          cannonMount.style.left = radius + 'px';
          cannonMount.style.top = radius + 'px';
          cannonMount.style.width = '0';
          cannonMount.style.height = '0';
          cannonMount.style.transformStyle = 'preserve-3d';
          const cannonZ = prismH + domeH;
          const facing = turretData.facingAngle ?? 0;
          const facingDeg = facing * 180 / Math.PI;
          cannonMount.style.transform =
            `translateZ(${cannonZ}px) rotateZ(${(facingDeg + 90).toFixed(1)}deg) rotateX(90deg)`;
          cannonMount.style.transition = 'transform 0.35s ease-out';

          cannonMount.appendChild(cannonPrism);
          container.appendChild(cannonMount);
        }

        return container;
      }

      function _buildBuildingPrism(entry, oSpr) {
        const R = 128;
        const sprW = oSpr.width || R;
        const sprH = oSpr.height || R;
        const trim = oSpr._trim;
        const tileSize = CONFIG.tileSize || 64;
        const scale = tileSize / R;

        const trimLeft = trim ? trim.left : 0;
        const trimRight = trim ? trim.right : sprW - 1;
        const trimTop = trim ? trim.top : 0;
        const trimBottom = trim ? trim.bottom : sprH - 1;
        const trimmedW = trimRight - trimLeft + 1;
        const trimmedH = trimBottom - trimTop + 1;

        const coreW = oSpr._coreWidth || trimmedW;
        const side = Math.round(coreW * scale);
        const fullWallH = Math.round(trimmedH * scale);

        const profile = oSpr._topProfile;
        let roofZ;
        if (profile && profile.length >= 2) {
          const pts = profile.length;

          const margin = (trimmedW - coreW) / 2;
          const iStart = Math.floor((margin / trimmedW) * pts);
          const iEnd = Math.ceil(((margin + coreW) / trimmedW) * pts);
          const centerProfile = profile.slice(iStart, iEnd);
          if (centerProfile.length > 0) {
            const sorted = centerProfile.slice().sort((a, b) => a - b);

            const pIdx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75));
            const roofP = sorted[pIdx];
            roofZ = Math.max(Math.round(fullWallH * 0.4), Math.round(fullWallH - (roofP * scale)));
          } else {
            roofZ = fullWallH - 10;
          }
        } else {
          roofZ = fullWallH - 10;
        }
        let wallH = fullWallH;

        /* Game height is pinned to the legacy half-tile basis so the 1:1 visual
           step doesn't change LOS / roof-standing heights, and the prism is
           scaled so its roof sits exactly on the voxel grid — identical to
           three-renderer.js's prism builder, so whichever builder runs last
           writes the SAME _gameHeight/_roofZPx (they used to disagree). */
        const stepPx = tileSize * ELEVATION_STEP_RATIO;
        const gameH = Math.max(1, Math.floor(roofZ / (tileSize * 0.5)));
        const roofScale = (gameH * stepPx) / roofZ;
        roofZ = gameH * stepPx;
        wallH = wallH * roofScale;
        oSpr._gameHeight = gameH;
        oSpr._roofZPx = roofZ;

        const container = document.createElement('div');
        container.className = 'tile-object building-prism';
        container.style.width = side + 'px';
        container.style.height = side + 'px';
        container.style.setProperty('--bldg-side', side + 'px');
        container.style.left = '50%';
        container.style.top = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.transformOrigin = 'center center';

        const spriteUrl = `url("${oSpr.url}")`;

        const coreLeft = trimLeft + Math.round((trimmedW - coreW) / 2);
        function _applySpriteBg(face) {
          const faceW = parseFloat(face.style.width);
          const faceH = parseFloat(face.style.height);
          const bgW = (sprW / coreW) * faceW;
          const bgH = (sprH / coreW) * faceW;
          const bgX = -(coreLeft / sprW) * bgW;
          const sprBottomInBg = ((trimBottom + 1) / sprH) * bgH;
          const bgY = faceH - sprBottomInBg;
          face.style.backgroundImage = spriteUrl;
          face.style.backgroundSize = bgW + 'px ' + bgH + 'px';
          face.style.backgroundPosition = bgX + 'px ' + bgY + 'px';
          face.style.backgroundRepeat = 'no-repeat';
          face.style.imageRendering = 'pixelated';
        }

        const darkDirs = ['bldg-south', 'bldg-north', 'bldg-west', 'bldg-east'];
        for (const cls of darkDirs) {
          const dw = document.createElement('div');
          dw.className = 'bldg-billboard bldg-dark-inner ' + cls;
          dw.style.width = side + 'px';
          dw.style.height = roofZ + 'px';
          dw.style.backgroundColor = '#0a0806';
          container.appendChild(dw);
        }

        const south = document.createElement('div');
        south.className = 'bldg-billboard bldg-south';
        south.style.width = side + 'px';
        south.style.height = wallH + 'px';
        _applySpriteBg(south);
        container.appendChild(south);

        const north = document.createElement('div');
        north.className = 'bldg-billboard bldg-north';
        north.style.width = side + 'px';
        north.style.height = wallH + 'px';
        _applySpriteBg(north);
        container.appendChild(north);

        const west = document.createElement('div');
        west.className = 'bldg-billboard bldg-west';
        west.style.width = side + 'px';
        west.style.height = wallH + 'px';
        _applySpriteBg(west);
        container.appendChild(west);

        const east = document.createElement('div');
        east.className = 'bldg-billboard bldg-east';
        east.style.width = side + 'px';
        east.style.height = wallH + 'px';
        _applySpriteBg(east);
        container.appendChild(east);

        const floor = document.createElement('div');
        floor.className = 'bldg-billboard bldg-floor';
        floor.style.left = '0';
        floor.style.top = '0';
        floor.style.width = side + 'px';
        floor.style.height = side + 'px';
        floor.style.background = '#0a0806';
        floor.style.transform = 'translateZ(1px)';
        container.appendChild(floor);

        const roof = document.createElement('div');
        roof.className = 'bldg-billboard bldg-roof';
        roof.style.left = '0';
        roof.style.top = '0';
        roof.style.width = side + 'px';
        roof.style.height = side + 'px';
        roof.style.transform = `translateZ(${roofZ}px)`;
        const brickUrl = (typeof TERRAIN_SPRITES !== 'undefined' && TERRAIN_SPRITES.bricks_3)
          ? TERRAIN_SPRITES.bricks_3[0]
          : (typeof TERRAIN_SPRITES !== 'undefined' && TERRAIN_SPRITES.bricks_1)
            ? TERRAIN_SPRITES.bricks_1[0] : '';
        if (brickUrl) {
          roof.style.backgroundImage = `url("${brickUrl}")`;
          roof.style.backgroundSize = 'cover';
          roof.style.imageRendering = 'pixelated';
        }
        container.appendChild(roof);

        return container;
      }

      function _buildObjEl(entry) {
        const oSpr = OBJECT_SPRITES[entry.key]; if (!oSpr) return null;

        if (_isBuildingKey(entry.key)) {

          if (!oSpr._trim && !oSpr._trimScanning) _alphaScanSprite(oSpr);

          if (oSpr.width && oSpr.height && oSpr._trim) {
            return _buildBuildingPrism(entry, oSpr);
          }

          if (!oSpr.width) {
            if (!oSpr._pending) {
              oSpr._pending = [];
              const img = new Image();
              img.onload = () => {
                oSpr.width = img.naturalWidth || 128;
                oSpr.height = img.naturalHeight || 128;
                oSpr._pending = null;
                _alphaScanSprite(oSpr);
              };
              img.onerror = () => { oSpr._pending = null; };
              img.src = oSpr.url;
              if (img.complete && img.naturalWidth) img.onload();
            }
          }

        }

        const el = document.createElement('div'); el.className = 'tile-object';
        const R = 128;
        const _dio = true;
        if (_dio) {

          el.style.setProperty('--obj-bg', `url("${oSpr.url}")`);
        } else {
          el.style.backgroundImage = `url("${oSpr.url}")`;
        }
        if (oSpr.width && oSpr.height) {
          const wPct = ((oSpr.width / R) * 100) + '%';
          const hPct = ((oSpr.height / R) * 100) + '%';
          if (_dio) {
            el.style.setProperty('--obj-w', wPct);
            el.style.setProperty('--obj-h', hPct);
          } else {
            el.style.width = wPct;
            el.style.height = hPct;
          }
        } else {

          if (!oSpr._pending) {
            oSpr._pending = [el];
            const img = new Image();
            img.onload = () => {
              oSpr.width = img.naturalWidth || R;
              oSpr.height = img.naturalHeight || R;
              const wPct = ((oSpr.width / R) * 100) + '%';
              const hPct = ((oSpr.height / R) * 100) + '%';
              const queued = oSpr._pending;
              oSpr._pending = null;
              if (queued) for (const qEl of queued) {
                  qEl.style.setProperty('--obj-w', wPct);
                  qEl.style.setProperty('--obj-h', hPct);
              }
            };
            img.onerror = () => { oSpr._pending = null; };
            img.src = oSpr.url;

            if (img.complete && img.naturalWidth) img.onload();
          } else {
            oSpr._pending.push(el);
          }
        }
        const ax = entry.alignX || 'center', ay = entry.alignY || 'bottom';
        const hasExtra = entry.rot || entry.flipX || entry.flipY;
        if (_dio) {

          el.setAttribute('data-align-x', ax);
          el.setAttribute('data-align-y', ay);
          if (hasExtra) {

            if (entry.rot) el.style.setProperty('--obj-rot', entry.rot + 'deg');
            if (entry.flipX) el.dataset.flipX = '1';
            if (entry.flipY) el.dataset.flipY = '1';
          }
        } else if (hasExtra) {

          const tfParts = [];

          if (ax === 'left') { el.style.left = '0'; }
          else if (ax === 'right') { el.style.right = '0'; el.style.left = 'auto'; }
          else { el.style.left = '50%'; tfParts.push('translateX(-50%)'); }

          if (ay === 'top') { el.style.top = '0'; }
          else if (ay === 'center') { el.style.top = '50%'; tfParts.push('translateY(-50%)'); }
          else { el.style.bottom = '0'; }

          if (entry.rot) tfParts.push(`rotate(${entry.rot}deg)`);
          if (entry.flipX) tfParts.push('scaleX(-1)');
          if (entry.flipY) tfParts.push('scaleY(-1)');
          el.style.transform = tfParts.join(' ');

          el.style.transformOrigin = `${ax} ${ay}`;
        } else {

          el.setAttribute('data-align-x', ax);
          el.setAttribute('data-align-y', ay);
        }
        return el;
      }

      const mapPerspectivePlayer = getViewerPlayer();

      const _liveUnitMap = new Map();
      const _liveUnitsAtCol = new Map();
      const _deadUnitMap = new Map();
      for (const u of state.units) {
        const k = posKey(u.x, u.y);
        if (u._dying) {
          _liveUnitMap.set(k, u);
          if (!_liveUnitsAtCol.has(k)) _liveUnitsAtCol.set(k, []);
          _liveUnitsAtCol.get(k).push(u);
        } else if (u.dead) {
          if (!_deadUnitMap.has(k)) _deadUnitMap.set(k, u);
        } else {
          if (!_liveUnitMap.has(k)) _liveUnitMap.set(k, u);
          if (!_liveUnitsAtCol.has(k)) _liveUnitsAtCol.set(k, []);
          _liveUnitsAtCol.get(k).push(u);
        }
      }

      const _seedMap = new Map();
      if (state.plantedSeeds) {
        for (const s of state.plantedSeeds) _seedMap.set(posKey(s.x, s.y), s);
      }

      const _runeMap = new Map();
      if (state.warpRunes) {
        for (const r of state.warpRunes) _runeMap.set(posKey(r.x, r.y), r);
      }

      const _bombSet = new Set();
      const _telescopeSkyOverlay = getTelescopeSkyTargets(mapPerspectivePlayer);
      if (state.bombs) {
        for (const b of state.bombs) {
          if (b.owner === mapPerspectivePlayer) _bombSet.add(posKey(b.x, b.y));
        }
      }

      const _turretMap = new Map();
      if (state.turrets) {
        for (const t of state.turrets) {
          if (t.hp > 0) _turretMap.set(posKey(t.x, t.y), t);
        }
      }

      const _wardMap = new Map();
      if (state.wards) {
        for (const w of state.wards) _wardMap.set(posKey(w.x, w.y), w);
      }

      const _deployedObjMap = new Map();
      if (state._deployedObjects) {
        for (const obj of state._deployedObjects) {
          if (obj.hp > 0) _deployedObjMap.set(posKey(obj.x, obj.y), obj);
        }
      }

      const _hourglassMap = new Map();

      const _itemMap = new Map();

      const _weatherTileMap = new Map();
      if (state.phase === 'battle' && state.activeWeather?.length) {
        for (const w of state.activeWeather) {
          const def = WEATHER_REGISTRY[w.type];
          if (!def) continue;
          for (const t of w.tiles) {
            const k = posKey(t.x, t.y);
            if (!_weatherTileMap.has(k)) _weatherTileMap.set(k, { def, type: w.type });
          }
        }
      }

      const _pingMap = new Map();
      if (state.pings) {
        for (const p of state.pings) {
          if (p.player === mapPerspectivePlayer) {
            const k = posKey(p.x, p.y);
            if (!_pingMap.has(k)) _pingMap.set(k, []);
            _pingMap.get(k).push(p);
          }
        }
      }

      const _scannedSet = (state.phase === 'battle' && state.scannedByPlayer) ? state.scannedByPlayer[mapPerspectivePlayer] : null;
      const _scannedFloor = 'earth';

      const _selectedForHl = getSelectedUnit();

      let _aliveCount = 0;
      let _unitPosFingerprint = '';
      if (_selectedForHl && state.actionMode && state.phase === 'battle') {
        for (let _i = 0; _i < state.units.length; _i++) {
          const _u = state.units[_i];
          if (!_u.dead) {
            _aliveCount++;
            _unitPosFingerprint += _u.x + ',' + _u.y + ',' + (_u.z ?? 0) + ';';
          }
        }
      }
      const _hlKeyParts = _selectedForHl && state.actionMode && state.phase === 'battle' && !state._actionExecuting
        ? state.selectedUnitId + '|' + state.actionMode + '|' + state.selectedTool + '|' + (_wasdOrigin ? _wasdOrigin.x + ',' + _wasdOrigin.y : _selectedForHl.x + ',' + _selectedForHl.y) + '|' + (state.comboPartner?.id || '') + '|' + (state._teleportingUnit?.id || '') + '|' + (state._skyThrowHighlight ? 'sky' + state._skyThrowHighlight.cx + ',' + state._skyThrowHighlight.cy + ',' + state._skyThrowHighlight.range : '') + '|' + state.activePlayer + '|' + state.round + '|' + (state.fogOfWar ? 1 : 0) + '|' + _aliveCount + '|' + (state.actionMenuView || '') + '|' + (_selectedForHl.z ?? 0) + '|' + (_selectedForHl.ap ?? 0) + '|' + (_selectedForHl.movesThisTurn ?? 0) + '|' + (state._terrainVersion ?? 0) + '|' + (state._buildTool || '') + '|' + (state.matBank && state.matBank[state.activePlayer] ? JSON.stringify(state.matBank[state.activePlayer]) : '') + '|' + _unitPosFingerprint
        : '';
      let _hlCache;
      let _hlZCache;
      let _hlZExtra;
      if (_hlKeyParts && _hlKeyParts === _hlCacheStore.key) {
        _hlCache = _hlCacheStore.map;
        _hlZCache = _hlCacheStore.zMap || new Map();
        _hlZExtra = _hlCacheStore.zExtra || new Map();
        /* An out-of-range click (clickTile / _moveThen*) blanks
           window._ewHlCache to yank stale tiles, but leaves _hlCacheStore
           pointing at the still-valid populated cache. On this cache-HIT
           branch the recompute block below (which reassigns window._ewHlCache)
           never runs, so the renderer would keep reading the emptied cache and
           the highlights would stay gone. Re-point the renderer at the live
           cache here so the reachable tiles reappear on the very next frame. */
        if (window._ewHlCache !== _hlCacheStore) window._ewHlCache = _hlCacheStore;
      } else {
        _hlCache = new Map();
        _hlZCache = new Map();
        _hlZExtra = new Map();
        if (_selectedForHl && state.actionMode && state.phase === 'battle' && !state._actionExecuting) {
          try {
        // Effectiveness tint for enemy tiles in spell views. STAB (the caster's
        // same-type self-bonus, ×1.25) is baked into getTypeDamageMultiplier,
        // but it is NOT a matchup — painting it green made every neutral enemy
        // read as "super effective" to a same-type caster (the false green `!`:
        // the nameplate badge trusts these classes). Back STAB out first, same
        // as getTypeCombatNote / _getTypeEffLabel / the target-drum chip.
        const _spellEffClass = (caster, target, spell) => {
          const mult = getTypeDamageMultiplier(caster, target, spell.spellType || null);
          const hasStab = spell.spellType && (caster.types || []).includes(spell.spellType);
          const eff = hasStab ? mult / ((typeof STAB_MULTIPLIER !== 'undefined') ? STAB_MULTIPLIER : 1.25) : mult;
          return eff > 1.001 ? ' type-strong' : eff < 0.999 ? ' type-weak' : '';
        };
        // Spell kinds that hurt whatever they land on — their free-aim range
        // paints red ('spell-range-dmg'), not neutral purple. RED = DAMAGE,
        // everywhere, including drains/debuffs/displacement bursts.
        const _DMG_SPELL_KINDS = { damage:1, aoe:1, barrage:1, multiHit:1, ricochet:1,
          splitBeam:1, bomb:1, delayed:1, line:1, linePush:1, cross:1, leapStrike:1,
          lifeDrain:1, zoneDebuff:1, debuff:1, seedPoison:1, leechSeed:1, pull:1,
          aoePull:1, aoePush:1, displacement:1, skySlam:1 };
        let _cachedMoveTiles, _cachedAttackTiles, _cachedInspectTiles;
        if (state.actionMode === 'move' && canUnitMove(_selectedForHl)) {

          let _wasdSavedX, _wasdSavedY;
          if (_wasdOrigin) {
            _wasdSavedX = _selectedForHl.x;
            _wasdSavedY = _selectedForHl.y;
            _selectedForHl.x = _wasdOrigin.x;
            _selectedForHl.y = _wasdOrigin.y;
          }
          _cachedMoveTiles = getMoveTiles(_selectedForHl);

          // ── Also include standalone jump tiles from current position as R1 destinations ──
          const _canJumpFromHere = typeof getJumpTiles === 'function' && !(canFly(_selectedForHl) && isUnitAirborne(_selectedForHl));
          let _r1JumpTiles = [];
          if (_canJumpFromHere) {
            _r1JumpTiles = getJumpTiles(_selectedForHl);
            // Add jump tiles that aren't already in getMoveTiles result.
            // Keyed by (x,y,z), not (x,y): on multi-floor columns a jump onto
            // the platform must coexist with a walk onto the floor beneath it.
            const _movePk3Set = new Set();
            for (const t of _cachedMoveTiles) _movePk3Set.add(t.x + ',' + t.y + ',' + (t.z ?? 0));
            for (const jt of _r1JumpTiles) {
              const jpk3 = jt.x + ',' + jt.y + ',' + (jt.z ?? 0);
              if (!_movePk3Set.has(jpk3)) {
                _cachedMoveTiles.push({ x: jt.x, y: jt.y, z: jt.z, cost: 0, _jump: true });
                _movePk3Set.add(jpk3);
              }
            }
          }

          /* Ring-2 (move+move) highlighting is GONE: Move shows only where
             ONE move action (1 AP) can reach. A second move is a fresh,
             deliberate Move pick from the action menu — and it ends the
             turn (finishMove drains all remaining AP). */
          if (_wasdOrigin) {
            _selectedForHl.x = _wasdSavedX;
            _selectedForHl.y = _wasdSavedY;
          }
          const _moveSet = new Set();
          /* Multi-floor columns can offer SEVERAL surfaces at one (x,y) — the
             ocean floor under a cloud platform AND the platform top. ALL of
             them highlight: the surface nearest the unit's z is the primary
             (map + zMap, what legacy consumers read), every other surface goes
             into zExtra so the renderer draws it too. The click resolves which
             one you meant from the raycast hit height. Only store real z
             values: legacy 2D tiles carry no z and must not default to 0. */
          const _selZForHl = _selectedForHl.z ?? 0;
          for (const t of _cachedMoveTiles) {
            const pk = posKey(t.x, t.y);
            const cls = t._jump ? 'move-jump' : t._takeoff ? 'move-takeoff' : 'move';
            const _tHasZ = (t.z !== undefined && t.z !== null);
            if (_moveSet.has(pk) && _tHasZ) {
              const _prevZ = _hlZCache.get(pk);
              if (_prevZ !== undefined && t.z !== _prevZ) {
                const list = _hlZExtra.get(pk) || [];
                if (Math.abs(t.z - _selZForHl) < Math.abs(_prevZ - _selZForHl)) {
                  // this surface becomes the primary; demote the old one
                  list.push({ z: _prevZ, cls: _hlCache.get(pk) });
                  _hlCache.set(pk, cls);
                  _hlZCache.set(pk, t.z);
                } else if (!list.some(e => e.z === t.z)) {
                  list.push({ z: t.z, cls });
                }
                _hlZExtra.set(pk, list);
              }
              continue;
            }
            _hlCache.set(pk, cls);
            if (_tHasZ) _hlZCache.set(pk, t.z);
            _moveSet.add(pk);
          }

          const _unitKey = posKey(_selectedForHl.x, _selectedForHl.y);
          _moveSet.add(_unitKey);
          const _edgeChecked = new Set();
          for (const t of _cachedMoveTiles) {
            for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
              const ex = t.x + dx, ey = t.y + dy;
              const ek = posKey(ex, ey);
              if (_edgeChecked.has(ek) || _moveSet.has(ek) || !isInside(ex, ey)) continue;
              _edgeChecked.add(ek);

              const _edgeOccupant = unitAt(ex, ey);
              const _edgeBlockedByEnemy = _edgeOccupant && isEnemyUnit(_edgeOccupant, _selectedForHl);
              if (!unitCanTraverse(_selectedForHl, ex, ey) || _edgeBlockedByEnemy) {
                _hlCache.set(ek, 'move-edge');
              }
            }
          }

          /* ─────────────────────────────────────────────────────────────────
             TACTICAL TILE COLOURING — deliberately minimal:
               blue   → reachable with this move (1 AP; no pip dots)
               teal   → jump / takeoff tile
               gold   → 'strike': you can attack/cast a visible enemy from here
               crimson→ 'hazard': ending here damages you / applies a bad status
               green  → 'benefit': healing terrain
             Enemy reach is NO LONGER hatched onto move tiles (the old orange
             'exposed' stripes) — hover or click an enemy to see its range in
             red instead (updateEnemyRangePreview in battle.js).
             Base-fill priority is strike > hazard > benefit > neutral.
             ───────────────────────────────────────────────────────────────── */
          {
            const _self = _selectedForHl;

            // Visible, non-cloaked enemy units (respect fog-of-war for P1).
            const _visEnemies = [];
            for (const _u of (state.units || [])) {
              if (_u.dead || !isEnemyUnit(_u, _self)) continue;
              if (typeof unitHasStatus === 'function' && unitHasStatus(_u, 'invisible')) continue;
              if (state.fogOfWar && !state.autoPlayers?.[_self.player]
                  && typeof isInVision === 'function' && !isInVision(_self, _u.x, _u.y)) continue;
              _visEnemies.push(_u);
            }

            // Our strike reach = basic attack range ∪ every castable, affordable
            // OFFENSIVE spell's range. (Movement/utility/heal/buff kinds excluded.)
            let _strikeReach = (typeof getEffectiveRange === 'function') ? (getEffectiveRange(_self) || 1) : 1;
            const _OFF_KINDS = { damage:1, aoe:1, barrage:1, lifeDrain:1, line:1, zoneDebuff:1,
                                 debuff:1, multiHit:1, cross:1, ricochet:1, splitBeam:1, pull:1,
                                 aoePull:1, linePush:1, delayed:1, seedPoison:1 };
            const _silenced = typeof unitHasStatus === 'function' && unitHasStatus(_self, 'silence');
            if (!_silenced) {
              const _allSpells = [].concat(_self.spells || [], _self._raceAbilities || []);
              for (const _sp of _allSpells) {
                if (!_sp || !_OFF_KINDS[_sp.kind]) continue;
                if (typeof canAffordSpell === 'function' && !canAffordSpell(_self, _sp)) continue;
                const _r = (typeof getEffectiveSpellRange === 'function')
                  ? getEffectiveSpellRange(_self, _sp) : (_sp.range || 0);
                if (_r > _strikeReach) _strikeReach = _r;
              }
            }

            const _terrAt = (tx, ty, tz) =>
              (typeof getTerrainAt3D === 'function' && tz != null && state.boardColumns?.length > 0)
                ? getTerrainAt3D(tx, ty, tz) : getTerrainAt(tx, ty);

            const _flies = typeof canFly === 'function' && canFly(_self);
            const _hazardTile = (tx, ty, tz) => {
              const _t = _terrAt(tx, ty, tz);
              if (_t === 'lava')
                return !_flies && !(typeof unitIsLavaAdapted === 'function' && unitIsLavaAdapted(_self));
              if (_t === 'poison' || _t === 'poison_bog')
                return !(typeof unitIsPoisonTerrainImmune === 'function' && unitIsPoisonTerrainImmune(_self));
              if (_t === 'deep_water')
                return !_flies && !(typeof unitIsDeepWaterAdapted === 'function' && unitIsDeepWaterAdapted(_self));
              return false;
            };

            const _strikeFrom = (tx, ty, tz) => {
              for (const _e of _visEnemies) {
                const _d = Math.abs(tx - _e.x) + Math.abs(ty - _e.y);
                if (_d < 1 || _d > _strikeReach) continue;
                if (typeof isRangeBlockedByTerrain === 'function'
                    && isRangeBlockedByTerrain(tx, ty, _e.x, _e.y, tz)) continue;
                return true;
              }
              return false;
            };

            const _MOVE_BASE = { 'move':1, 'move-jump':1, 'move-takeoff':1 };
            for (const [_pk, _cls] of _hlCache) {
              if (!_MOVE_BASE[_cls]) continue; // skip move-edge & any non-move classes
              const _c = _pk.indexOf(',');
              const _tx = parseInt(_pk.slice(0, _c), 10);
              const _ty = parseInt(_pk.slice(_c + 1), 10);
              const _tz = _hlZCache.has(_pk) ? _hlZCache.get(_pk) : undefined;
              let _tok = _cls;
              // Drop warning first, even above 'strike': a jump landing that
              // deals fall damage must NEVER read as a safe/gold tile — FFT
              // rule: no innocent-looking tile may hurt you unannounced.
              // predictFallDamage (state.js) mirrors applyFallDamage exactly
              // (threshold, splash-landing, physique, zodiac).
              const _dropZ = _tz ?? (typeof getHeightAt === 'function' ? getHeightAt(_tx, _ty) : 0);
              if (_cls === 'move-jump' && typeof predictFallDamage === 'function'
                  && predictFallDamage(_self, _self.z ?? 0, _dropZ, _tx, _ty) > 0) _tok += ' hazard';
              else if (_strikeFrom(_tx, _ty, _tz)) _tok += ' strike';
              else if (_hazardTile(_tx, _ty, _tz)) _tok += ' hazard';
              else {
                const _rule = getTerrainRule(_terrAt(_tx, _ty, _tz));
                if (_rule && _rule.healMultiplier > 1) _tok += ' benefit';
              }
              if (_tok !== _cls) _hlCache.set(_pk, _tok);
            }
          }
        } else if (state.actionMode === 'attack' && canUnitAct(_selectedForHl)) {
          _cachedAttackTiles = getAttackTiles(_selectedForHl);
          const _telescopeSkyMap = unitHasTelescope(_selectedForHl) && getSectionForUnit(_selectedForHl) === 'earth'
            ? getTelescopeSkyTargets(_selectedForHl.player) : new Map();
          const _inTargetListMode = state.actionMenuView === 'attackTargets';
          for (const t of _cachedAttackTiles) {
            const pk = posKey(t.x, t.y);
            const target = _liveUnitMap.get(pk);
            const skyTarget = _telescopeSkyMap.get(pk);
            const _camoHidden = target && isEnemyUnit(target, _selectedForHl) && unitHasStatus(target, 'invisible');
            if (target && isEnemyUnit(target, _selectedForHl) && !_camoHidden) {
              const typeMult = getTypeDamageMultiplier(_selectedForHl, target);
              const typeClass = typeMult > 1 ? ' type-strong' : typeMult < 1 ? ' type-weak' : '';
              _hlCache.set(pk, 'attack enemy' + typeClass);
            } else if (skyTarget && isEnemyUnit(skyTarget, _selectedForHl)) {
              const typeMult = getTypeDamageMultiplier(_selectedForHl, skyTarget);
              const typeClass = typeMult > 1 ? ' type-strong' : typeMult < 1 ? ' type-weak' : '';
              _hlCache.set(pk, 'attack enemy' + typeClass);
            } else if (!_inTargetListMode) {

              const tOwner = isTowerTile(t.x, t.y);
              if (tOwner && tOwner !== _selectedForHl.player) {
                _hlCache.set(posKey(t.x, t.y), 'attack enemy');
              } else {

                const seedAtk = state.plantedSeeds?.find(s => s.x === t.x && s.y === t.y && s.owner !== _selectedForHl.player);
                if (seedAtk) {
                  _hlCache.set(posKey(t.x, t.y), 'attack enemy');
                } else {
                  _hlCache.set(posKey(t.x, t.y), 'attack');
                }
              }
            } else {

              const tOwner = isTowerTile(t.x, t.y);
              if (tOwner && tOwner !== _selectedForHl.player) {
                _hlCache.set(posKey(t.x, t.y), 'attack enemy');
              }

              const turretHere = state.turrets?.find(tr => tr.x === t.x && tr.y === t.y && tr.owner !== _selectedForHl.player && tr.hp > 0);
              if (turretHere) {
                _hlCache.set(posKey(t.x, t.y), 'attack enemy');
              }

              const dObjHere = state._deployedObjects?.find(o => o.x === t.x && o.y === t.y && o.ownerPlayer !== _selectedForHl.player && o.hp > 0);
              if (dObjHere) {
                _hlCache.set(posKey(t.x, t.y), 'attack enemy');
              }

              const seedHlHere = state.plantedSeeds?.find(s => s.x === t.x && s.y === t.y && s.owner !== _selectedForHl.player);
              if (seedHlHere) {
                _hlCache.set(posKey(t.x, t.y), 'attack enemy');
              }

            }
          }
        } else if (state.actionMode === 'jump' && canUnitAct(_selectedForHl)) {
          if (typeof getJumpTiles === 'function') {
            const _jumpTiles = getJumpTiles(_selectedForHl);
            const _jSelZ = _selectedForHl.z ?? 0;
            // Drop warning (same rule as the Move overlay): a landing that
            // deals fall damage paints hazard-crimson, never safe teal.
            const _jClsFor = (t) => (typeof predictFallDamage === 'function'
                && predictFallDamage(_selectedForHl, _jSelZ, t.z ?? 0, t.x, t.y) > 0)
                ? 'move-jump hazard' : 'move-jump';
            for (const t of _jumpTiles) {
              const pk = posKey(t.x, t.y);
              const _jCls = _jClsFor(t);
              // multi-floor: keep every landing surface (primary + zExtra),
              // each carrying its OWN safe/hazard class for its z.
              if (String(_hlCache.get(pk) || '').indexOf('move-jump') === 0 && t.z !== undefined && _hlZCache.has(pk)) {
                const _pz = _hlZCache.get(pk);
                if (t.z !== _pz) {
                  const list = _hlZExtra.get(pk) || [];
                  if (Math.abs(t.z - _jSelZ) < Math.abs(_pz - _jSelZ)) {
                    list.push({ z: _pz, cls: _hlCache.get(pk) });
                    _hlZCache.set(pk, t.z);
                    _hlCache.set(pk, _jCls);
                  } else if (!list.some(e => e.z === t.z)) {
                    list.push({ z: t.z, cls: _jCls });
                  }
                  _hlZExtra.set(pk, list);
                }
                continue;
              }
              _hlCache.set(pk, _jCls);
              if (t.z !== undefined) _hlZCache.set(pk, t.z);
            }
          }
        } else if (state.actionMode === 'build' && canUnitAct(_selectedForHl)) {
          // Build reach ring: light exactly the tiles the armed tool can work
          // (same _buildProblem the click uses). Blue 'placeable' for stacking,
          // orange for diggable blocks — invalid tiles stay dark.
          const _bTool = state._buildTool || 'dig';
          const _bReach = (typeof BUILD_ACTION_CONFIG !== 'undefined' && BUILD_ACTION_CONFIG.reach) || 1;
          if (typeof _buildProblem === 'function') {
            for (let cy = _selectedForHl.y - _bReach; cy <= _selectedForHl.y + _bReach; cy++) {
              for (let cx = _selectedForHl.x - _bReach; cx <= _selectedForHl.x + _bReach; cx++) {
                if (!isInside(cx, cy)) continue;
                if (!_buildProblem(_selectedForHl, _bTool, cx, cy)) {
                  _hlCache.set(posKey(cx, cy), _bTool === 'dig' ? 'combo-target' : 'placeable');
                }
              }
            }
          }
        } else if (state.actionMode === 'inspect' && canUnitAct(_selectedForHl)) {
          _cachedInspectTiles = getInspectTiles(_selectedForHl);
          for (const t of _cachedInspectTiles) _hlCache.set(posKey(t.x, t.y), 'inspect');
        } else if (state.actionMode === 'combo' && canUnitAct(_selectedForHl)) {
          if (!state.comboPartner) {
            const partners = getComboPartners(_selectedForHl);
            for (const p of partners) _hlCache.set(posKey(p.x, p.y), 'move ally');
          } else {
            const combo = getComboForUnits(_selectedForHl, state.comboPartner);
            if (combo) {
              const isOff = ['damage', 'multiHit', 'aoe'].includes(combo.kind);
              const comboRange = combo.range || 3;
              if (isOff) {
                const _comboSrcZ = _selectedForHl.z ?? (typeof getHeightAt === 'function' ? getHeightAt(_selectedForHl.x, _selectedForHl.y) : 0);
                for (let cy = 0; cy < bh(); cy++) {
                  for (let cx = 0; cx < bw(); cx++) {
                    const target = _liveUnitMap.get(posKey(cx, cy));
                    if (!target || !isEnemyUnit(target, _selectedForHl)) continue;
                    // 3D combat distance to the enemy (matches the engine's combo
                    // range gate), so a partner can't combo a target out of reach
                    // vertically even if adjacent on the grid.
                    const d = (typeof combatDist === 'function')
                      ? combatDist(_selectedForHl.x, _selectedForHl.y, _comboSrcZ, cx, cy, target.z ?? 0)
                      : (Math.abs(_selectedForHl.x - cx) + Math.abs(_selectedForHl.y - cy));
                    if (d >= 1 && d <= comboRange && !isRangeBlockedByTerrain(_selectedForHl.x, _selectedForHl.y, cx, cy)) {
                      _hlCache.set(posKey(cx, cy), 'attack enemy');
                    }
                  }
                }
              } else {
                _hlCache.set(posKey(_selectedForHl.x, _selectedForHl.y), 'move');
              }
            }
          }
        } else if (state.actionMode === 'ping' && canUnitAct(_selectedForHl)) {
          for (let cy = 0; cy < bh(); cy++) {
            for (let cx = 0; cx < bw(); cx++) {
              _hlCache.set(posKey(cx, cy), 'inspect');
            }
          }
        } else if (state.actionMode === 'trade' && canUnitAct(_selectedForHl)) {
          for (const u of state.units) {
            if (!u.dead && canTradeWithUnit(_selectedForHl, u)) _hlCache.set(posKey(u.x, u.y), 'move ally');
          }
        } else if (state.actionMode === 'item' && canUnitAct(_selectedForHl)) {
          if (state.selectedTool === 'scanner') {
            _hlCache.set(posKey(_selectedForHl.x, _selectedForHl.y), 'inspect');
          } else if (ITEM_RULES[state.selectedTool]?.baneType) {

            const _baneRule = ITEM_RULES[state.selectedTool];
            const _baneRange = getEffectiveRange(_selectedForHl) + 1;
            const _fogLimitBane = state.fogOfWar && !state.autoPlayers?.[_selectedForHl.player];
            for (let cy = 0; cy < bh(); cy++) {
              for (let cx = 0; cx < bw(); cx++) {
                const d = Math.max(Math.abs(_selectedForHl.x - cx), Math.abs(_selectedForHl.y - cy));
                if (d >= 1 && d <= _baneRange) {
                  if (_fogLimitBane && !isInVision(_selectedForHl, cx, cy)) continue;
                  const pk = posKey(cx, cy);
                  const target = _liveUnitMap.get(pk);
                  if (target && isEnemyUnit(target, _selectedForHl) && !unitHasStatus(target, 'invisible') && !target.dead) {
                    const isEffective = (target.types || []).includes(_baneRule.baneType);
                    const typeClass = isEffective ? ' type-strong' : '';
                    _hlCache.set(pk, 'attack enemy' + typeClass);
                  } else {
                    // bane throws are damage → red reach wash
                    _hlCache.set(pk, 'spell-range-dmg');
                  }
                }
              }
            }
          } else {
            for (const u of state.units) {
              if (u.dead || !isAllyUnit(u, _selectedForHl)) continue;
              // A full-up ally isn't a valid potion target (doItem refuses it):
              // don't paint it green, and let its plate drop from the filter so
              // only units that can actually drink stay on screen while aiming.
              if (state.selectedTool === 'healPotion' && u.hp >= u.maxHp) continue;
              if (state.selectedTool === 'manaPotion' && (u.maxMp <= 0 || u.mp >= u.maxMp)) continue;
              _hlCache.set(posKey(u.x, u.y), 'heal');
            }
          }
        } else if (state.actionMode === 'ward' && canUnitAct(_selectedForHl)) {
          const wardRange = 3;
          for (let cy = 0; cy < bh(); cy++) {
            for (let cx = 0; cx < bw(); cx++) {
              const d = Math.abs(_selectedForHl.x - cx) + Math.abs(_selectedForHl.y - cy);
              if (d <= wardRange && isTerrainPassable(cx, cy) && !state.wards.some(w => w.x === cx && w.y === cy)) {
                _hlCache.set(posKey(cx, cy), 'inspect');
              }
            }
          }
        } else if (state.actionMode === 'flair' && canUnitAct(_selectedForHl)) {
          const flairRange = 8;
          const _flairVis = state.fogOfWar ? computeVisibleTiles(_selectedForHl.player) : null;
          for (let cy = 0; cy < bh(); cy++) {
            for (let cx = 0; cx < bw(); cx++) {
              const d = Math.abs(_selectedForHl.x - cx) + Math.abs(_selectedForHl.y - cy);
              if (d <= flairRange && d > 0) {
                if (!_flairVis || !_flairVis.has(posKey(cx, cy))) {
                  _hlCache.set(posKey(cx, cy), 'inspect');
                }
              }
            }
          }
        } else if (state.actionMode === 'warpStone' && canUnitAct(_selectedForHl)) {
          for (let cy = 0; cy < bh(); cy++) {
            for (let cx = 0; cx < bw(); cx++) {
              const d = Math.abs(_selectedForHl.x - cx) + Math.abs(_selectedForHl.y - cy);
              if (d >= 1 && d <= 3 && isTerrainPassable(cx, cy) && !_liveUnitMap.has(posKey(cx, cy))) {
                _hlCache.set(posKey(cx, cy), 'move');
              }
            }
          }
        } else if (state.actionMode === 'spell' && canUnitAct(_selectedForHl)) {
          const spell = (_selectedForHl.spells || []).find(s => s.name === state.selectedTool) || (_selectedForHl._raceAbilities || []).find(s => s.name === state.selectedTool);
          if (spell) {
            const minRange = (['heal', 'shield', 'buff', 'scan', 'summonWeather', 'bomb', 'healAll', 'aoe', 'barrage', 'seedHeal', 'seedPoison', 'leechSeed', 'warpRune', 'teleport', 'deployTurret', 'buildBridge', 'warCry', 'encore', 'remoteView', 'placeBlock', 'buildStructure', 'placeTrap', 'placeMirror'].includes(spell.kind)) ? 0 : 1;
            // 3D range for spell highlights: elevation difference between caster
            // and target counts toward range (combatDist), so these overlays match
            // what doSpell will actually allow — a target far above/below falls out
            // of range even when close on the grid.
            const _spellSrcZ = _selectedForHl.z ?? (typeof getHeightAt === 'function' ? getHeightAt(_selectedForHl.x, _selectedForHl.y) : 0);
            // Long-ranged spells (projectiles/beams/thrown) drop onto targets
            // below for free — the highlight must match doSpell's reach gate.
            const _spellLong = (typeof isLongRangeSpell === 'function') && isLongRangeSpell(spell);
            const _tgtZAt = (cx, cy) => {
              const u = _liveUnitMap.get(posKey(cx, cy));
              if (u && u.z != null) return u.z;
              return (typeof getHeightAt === 'function') ? getHeightAt(cx, cy) : 0;
            };
            // Sky grabs (skyDrop/skyThrow/skySlam) swoop from the air: horizontal
            // range only, no elevation tax and no terrain LOS — must match the
            // engine's own 2D validation in doSpell or clicks get rejected.
            const _skyGrabHl = spell.kind === 'skyDrop' || spell.kind === 'skyThrow' || spell.kind === 'skySlam';
            const _rangeD = (cx, cy) => _skyGrabHl
              ? (Math.abs(_selectedForHl.x - cx) + Math.abs(_selectedForHl.y - cy))
              : (typeof combatReach === 'function')
                ? combatReach(_selectedForHl.x, _selectedForHl.y, _spellSrcZ, cx, cy, _tgtZAt(cx, cy), _spellLong)
                : (typeof combatDist === 'function')
                  ? combatDist(_selectedForHl.x, _selectedForHl.y, _spellSrcZ, cx, cy, _tgtZAt(cx, cy))
                  : (Math.abs(_selectedForHl.x - cx) + Math.abs(_selectedForHl.y - cy));
            if (_selectedForHl._skyThrowGrab && state._skyThrowHighlight) {
              // Sky-throw "phase 2": a target is grabbed — highlight where it can be
              // hurled (throwRange tiles around the grabbed unit), NOT the caster's
              // spell range. Occupied landing tiles read as collision targets.
              const _stHl = state._skyThrowHighlight;
              const _grabId = _selectedForHl._skyThrowGrab.id;
              for (let cy = 0; cy < bh(); cy++) {
                for (let cx = 0; cx < bw(); cx++) {
                  const d = Math.abs(cx - _stHl.cx) + Math.abs(cy - _stHl.cy);
                  if (d >= 1 && d <= _stHl.range && isInside(cx, cy)) {
                    const occ = _liveUnitMap.get(posKey(cx, cy));
                    if (occ && !occ.dead && occ.id !== _grabId) {
                      _hlCache.set(posKey(cx, cy), 'attack enemy');
                    } else {
                      _hlCache.set(posKey(cx, cy), 'move');
                    }
                  }
                }
              }
            } else if (spell.kind === 'healAll') {
              _hlCache.set(posKey(_selectedForHl.x, _selectedForHl.y), 'heal');
            } else if (spell.kind === 'teleport' && spell.teleportAnyUnit && !state._teleportingUnit) {
              // Phase 1 of "warp any unit": the player picks the UNIT to teleport
              // (self / ally / enemy), NOT a destination tile yet. Highlight the
              // selectable UNITS only — don't paint the purple destination field,
              // which made it look like you should click an empty tile.
              const _tpEffRange = (typeof getEffectiveSpellRange === 'function') ? getEffectiveSpellRange(_selectedForHl, spell) : spell.range;
              for (const u of state.units) {
                if (u.dead) continue;
                const d = _rangeD(u.x, u.y);
                if (d > _tpEffRange) continue;
                const pk = posKey(u.x, u.y);
                if (isEnemyUnit(u, _selectedForHl) && !unitHasStatus(u, 'invisible')) {
                  _hlCache.set(pk, 'attack enemy');
                } else if (isAllyUnit(u, _selectedForHl)) {
                  _hlCache.set(pk, 'move ally');
                }
              }
            } else if (spell.kind === 'teleport' && state._teleportingUnit) {
              const _tpEffRange = (typeof getEffectiveSpellRange === 'function') ? getEffectiveSpellRange(_selectedForHl, spell) : spell.range;
              for (let cy = 0; cy < bh(); cy++) {
                for (let cx = 0; cx < bw(); cx++) {
                  const d = Math.abs(_selectedForHl.x - cx) + Math.abs(_selectedForHl.y - cy);
                  if (d <= _tpEffRange) {
                    const pk2 = posKey(cx, cy);
                    const occupant = _liveUnitMap.get(pk2);
                    if (cx === state._teleportingUnit.x && cy === state._teleportingUnit.y) {
                      _hlCache.set(pk2, 'selected');
                    } else if (!occupant && isTerrainPassable(cx, cy)) {
                      _hlCache.set(pk2, 'move');
                    }
                  }
                }
              }
            } else if (spell.kind === 'line' || spell.kind === 'linePush') {

              const _lineRange = Math.max(bw(), bh());
              const _lineDirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1},{dx:1,dy:1},{dx:1,dy:-1},{dx:-1,dy:1},{dx:-1,dy:-1}];
              for (const dir of _lineDirs) {
                for (let i = 1; i <= _lineRange; i++) {
                  const lx = _selectedForHl.x + dir.dx * i;
                  const ly = _selectedForHl.y + dir.dy * i;
                  if (lx < 0 || ly < 0 || lx >= bw() || ly >= bh()) break;
                  if (!isTerrainPassable(lx, ly) && !spell.destroysObstacles) break;
                  const pk = posKey(lx, ly);
                  const target = _liveUnitMap.get(pk);
                  if (target && isEnemyUnit(target, _selectedForHl) && !unitHasStatus(target, 'invisible')) {
                    _hlCache.set(pk, 'attack enemy' + _spellEffClass(_selectedForHl, target, spell));
                  } else {
                    // red = damage: every tile the beam sweeps WILL be hit
                    _hlCache.set(pk, 'spell-damage');
                  }
                }
              }
            } else if (spell.kind === 'cross' && !spell.aoeOriginSelf) {

              const _fogLimitCross = state.fogOfWar && !state.autoPlayers?.[_selectedForHl.player];
              const _crossEffRange = (typeof getEffectiveSpellRange === 'function') ? getEffectiveSpellRange(_selectedForHl, spell) : spell.range;
              const _crossSkipLOS = spell.ignoresLineOfSight === true;
              const _crossSrcZ = _selectedForHl.z ?? (typeof getHeightAt === 'function' ? getHeightAt(_selectedForHl.x, _selectedForHl.y) : 0);
              for (let cy = 0; cy < bh(); cy++) {
                for (let cx = 0; cx < bw(); cx++) {
                  const d = _rangeD(cx, cy);
                  if (d >= 1 && d <= _crossEffRange && (_crossSkipLOS || !isRangeBlockedByTerrain(_selectedForHl.x, _selectedForHl.y, cx, cy, _crossSrcZ))) {
                    if (_fogLimitCross && !isInVision(_selectedForHl, cx, cy)) continue;
                    // cross spells deal damage → red range wash, not purple
                    _hlCache.set(posKey(cx, cy), 'spell-range-dmg');
                  }
                }
              }
            } else if (spell.kind === 'cross' && spell.aoeOriginSelf) {

              const _crossR = spell.crossRadius || 1;
              // self-burst: the whole footprint (origin included) paints
              // damage-red — these used to read blue and looked harmless
              _hlCache.set(posKey(_selectedForHl.x, _selectedForHl.y), 'spell-damage');
              // diamond novae highlight every tile within Manhattan radius,
              // plain crosses just the 4 arms.
              const _crossOffsets = [];
              if (spell.diamond) {
                for (let dy = -_crossR; dy <= _crossR; dy++) {
                  for (let dx = -_crossR; dx <= _crossR; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    if (Math.abs(dx) + Math.abs(dy) <= _crossR) _crossOffsets.push({ dx, dy });
                  }
                }
              } else {
                for (let i = 1; i <= _crossR; i++) {
                  _crossOffsets.push({dx:i,dy:0},{dx:-i,dy:0},{dx:0,dy:i},{dx:0,dy:-i});
                }
              }
              for (const o of _crossOffsets) {
                const cx = _selectedForHl.x + o.dx, cy = _selectedForHl.y + o.dy;
                if (cx < 0 || cy < 0 || cx >= bw() || cy >= bh()) continue;
                const pk = posKey(cx, cy);
                const target = _liveUnitMap.get(pk);
                if (target && isEnemyUnit(target, _selectedForHl) && !unitHasStatus(target, 'invisible')) {
                  _hlCache.set(pk, 'attack enemy' + _spellEffClass(_selectedForHl, target, spell));
                } else {
                  _hlCache.set(pk, 'spell-damage');
                }
              }
            } else if (spell.kind === 'utility') {

              const _fogLimitUtil = state.fogOfWar && !state.autoPlayers?.[_selectedForHl.player];
              const _utilEffRange = (typeof getEffectiveSpellRange === 'function') ? getEffectiveSpellRange(_selectedForHl, spell) : spell.range;
              const _utilSkipLOS = spell.ignoresLineOfSight === true;
              const _utilSrcZ = _selectedForHl.z ?? (typeof getHeightAt === 'function' ? getHeightAt(_selectedForHl.x, _selectedForHl.y) : 0);
              for (let cy = 0; cy < bh(); cy++) {
                for (let cx = 0; cx < bw(); cx++) {
                  const d = _rangeD(cx, cy);
                  if (d >= 1 && d <= _utilEffRange && (_utilSkipLOS || !isRangeBlockedByTerrain(_selectedForHl.x, _selectedForHl.y, cx, cy, _utilSrcZ))) {
                    if (_fogLimitUtil && !isInVision(_selectedForHl, cx, cy)) continue;
                    const pk = posKey(cx, cy);
                    const target = _liveUnitMap.get(pk);
                    // Team-aware: an ally-serving utility zone must not paint
                    // enemies as attack targets (spellTileTeam, battle.js).
                    const _uTT = (typeof spellTileTeam === 'function') ? spellTileTeam(spell) : 'both';
                    if (target && _uTT !== 'ally' && isEnemyUnit(target, _selectedForHl) && !unitHasStatus(target, 'invisible')) {
                      _hlCache.set(pk, 'attack enemy');
                    } else if (target && _uTT === 'ally' && isAllyUnit(target, _selectedForHl)) {
                      _hlCache.set(pk, 'heal');
                    } else {

                      _hlCache.set(pk, 'spell-range');
                    }
                  }
                }
              }
            } else {
              const _fogLimitSpells = state.fogOfWar && !state.autoPlayers?.[_selectedForHl.player];
              const _genEffRange = (typeof getEffectiveSpellRange === 'function') ? getEffectiveSpellRange(_selectedForHl, spell) : spell.range;
              const _genSkipLOS = spell.ignoresLineOfSight === true || spell.kind === 'teleport' || _skyGrabHl;
              const _genSrcZ = _selectedForHl.z ?? (typeof getHeightAt === 'function' ? getHeightAt(_selectedForHl.x, _selectedForHl.y) : 0);
              for (let cy = 0; cy < bh(); cy++) {
                for (let cx = 0; cx < bw(); cx++) {
                  const d = _rangeD(cx, cy);
                  if (d >= minRange && d <= _genEffRange && (_genSkipLOS || !isRangeBlockedByTerrain(_selectedForHl.x, _selectedForHl.y, cx, cy, _genSrcZ))) {
                    if (_fogLimitSpells && d > 0 && !['heal', 'shield', 'buff', 'scan', 'remoteView'].includes(spell.kind) && !isInVision(_selectedForHl, cx, cy)) continue;
                    if (spell.kind === 'barrage') {
                      const target = _liveUnitMap.get(posKey(cx, cy));
                      if (target && isEnemyUnit(target, _selectedForHl) && !unitHasStatus(target, 'invisible')) {
                        _hlCache.set(posKey(cx, cy), 'attack enemy' + _spellEffClass(_selectedForHl, target, spell));
                      } else {
                        _hlCache.set(posKey(cx, cy), 'spell-range-dmg');
                      }
                    } else if (['heal', 'shield', 'buff', 'cleanse', 'guard'].includes(spell.kind)) {
                      // Ally-only kinds: green-light ONLY friendly occupants — an
                      // enemy standing in range must never read as a valid target
                      // (it also drops off the nameplate filter below). Allies the
                      // spell would do nothing for (full-HP heal, already-shielded
                      // shield, clean cleanse — spellTargetUsableOn, same gate the
                      // target drum uses) drop out too. The rest of the range
                      // paints as neutral background so reach stays readable in
                      // the free-aim view.
                      const friendlyTarget = _liveUnitMap.get(posKey(cx, cy));
                      if (friendlyTarget && isAllyUnit(friendlyTarget, _selectedForHl)
                          && (typeof spellTargetUsableOn !== 'function' || spellTargetUsableOn(_selectedForHl, spell, friendlyTarget))) {
                        _hlCache.set(posKey(cx, cy), 'heal');
                      } else if (state.actionMenuView !== 'spellTargets') {
                        // support reach = faint green wash (green = help)
                        _hlCache.set(posKey(cx, cy), 'heal-range');
                      }
                    } else if (['scan'].includes(spell.kind)) {
                      _hlCache.set(posKey(cx, cy), 'inspect');
                    } else if (['bomb', 'aoe'].includes(spell.kind)) {
                      // Tile-targeted DAMAGE (bombs, ground-aimed AoE): faint
                      // red reach — anywhere in here can become a blast zone.
                      _hlCache.set(posKey(cx, cy), 'spell-range-dmg');
                    } else if (['summonWeather', 'remoteView', 'placeBlock', 'buildStructure', 'placeTrap', 'placeMirror'].includes(spell.kind)) {
                      // Placement kinds paint the neutral build/aim color — they
                      // target TILES, so no enemy-red attack highlighting.
                      _hlCache.set(posKey(cx, cy), 'spell-range');
                    } else {
                      const target = _liveUnitMap.get(posKey(cx, cy));
                      // Team-aware tile zones (spellTileTeam, battle.js): a
                      // healing/buff zone (zoneHeal, seedHeal, aoeShield,
                      // Smoke Screen…) never paints enemies as attack targets —
                      // its ALLIES light up as the valid drops instead. Hostile
                      // zones (seedPoison, zoneDebuff, delayed…) keep marking
                      // enemies only, exactly as before.
                      const _gTT = (typeof spellTileTeam === 'function') ? spellTileTeam(spell) : 'both';
                      if (target && _gTT !== 'ally' && isEnemyUnit(target, _selectedForHl) && !unitHasStatus(target, 'invisible')) {
                        _hlCache.set(posKey(cx, cy), 'attack enemy' + _spellEffClass(_selectedForHl, target, spell));
                      } else if (target && _gTT === 'ally' && isAllyUnit(target, _selectedForHl)) {
                        _hlCache.set(posKey(cx, cy), 'heal');
                      } else if (state.actionMenuView !== 'spellTargets') {
                        // Range wash keyed to what the spell DOES: red for
                        // anything that hurts, green for ally-serving zones,
                        // purple only for genuinely neutral utility.
                        const _rangeCls = _DMG_SPELL_KINDS[spell.kind] ? 'spell-range-dmg'
                          : (_gTT === 'ally') ? 'heal-range' : 'spell-range';
                        _hlCache.set(posKey(cx, cy), _rangeCls);
                      }

                    }
                  }
                }
              }
            }
          }
        }
        } catch(e) { console.error('hlCache error', e); }
        }

        if (_selectedForHl) {
            const _casterZ = _selectedForHl.z ?? 0;
            for (const [pk] of _hlCache) {
                if (_hlZCache.has(pk)) continue;
                const _cm = pk.indexOf(',');
                const _zx = parseInt(pk.substring(0, _cm), 10);
                const _zy = parseInt(pk.substring(_cm + 1), 10);
                const _zVal = (typeof nearestWalkableZ === 'function')
                    ? nearestWalkableZ(_zx, _zy, _casterZ)
                    : (state.boardHeights?.[_zy]?.[_zx] ?? 0);
                _hlZCache.set(pk, _zVal);
            }
        }

        _hlCacheStore = { key: _hlKeyParts, map: _hlCache, zMap: _hlZCache, zExtra: _hlZExtra };

        window._ewHlCache = _hlCacheStore;

        var _noFilterModes = { move:1, jump:1, reshape:1, altitude:1, ward:1, flair:1, warpStone:1, ping:1 };
        if (state._actionExecuting && state.phase === 'battle') {
          // Mid-action: keep whatever plate filter was captured when the action
          // fired (_focusPlatesForAction narrows it to caster + affected units),
          // so only the relevant health bars stay up during the animation.
        } else if (!_selectedForHl || !state.actionMode || _noFilterModes[state.actionMode] || state.phase !== 'battle') {
          window._ewTargetableUnitIds = null;
        } else {

          var _targetSet = new Set();

          if (state.selectedUnitId) _targetSet.add(state.selectedUnitId);
          if (state.units) {
            for (var _ti = 0; _ti < state.units.length; _ti++) {
              var _tu = state.units[_ti];
              if (_tu.dead) continue;
              var _tpk = posKey(_tu.x, _tu.y);
              var _thl = _hlCache.get(_tpk);
              if (!_thl) continue;

              // Any action-relevant highlight keeps the unit's plate up:
              // range wash, AoE splash ('spell-damage'), heal reach and
              // direct-target classes all mean "this unit matters to the
              // action being aimed". Skipping the wash classes here used to
              // hide EVERY enemy health bar while aiming tile-targeted
              // spells (Meteor etc.) — only movement-preview tiles and the
              // caster's own marker are irrelevant.
              if (_thl === 'move' || _thl === 'move-jump' || _thl === 'move-takeoff' || _thl === 'move-edge'
                  || _thl === 'selected' || _thl === 'spell-range-bg') continue;

              _targetSet.add(_tu.id);
            }
          }
          window._ewTargetableUnitIds = _targetSet;
        }
      }

      if (_threeActive && state.phase === 'editor' && typeof window._meRebuildEditorOverlays3D === 'function') {
          window._meRebuildEditorOverlays3D();
      }

      if (_threeActive) return;
      }

        let _dragMoveActive = false;
        let _dragMoveOrigin = null;
        let _dragMoveTarget = null;
        let _editorDragPainting = false;
        document.addEventListener('mouseup', () => {
            if (_editorDragPainting && typeof window._meEditorDragEnd === 'function') window._meEditorDragEnd();
            _editorDragPainting = false;
            if (_dragMoveActive && _dragMoveTarget) {
                const unit = getSelectedUnit();
                if (unit && canUnitMove(unit) && state.actionMode === 'move') {
                    const moveTiles = getMoveTiles(unit);
                    if (moveTiles.some(t => t.x === _dragMoveTarget.x && t.y === _dragMoveTarget.y)) {
                        doMove(unit, _dragMoveTarget.x, _dragMoveTarget.y);
                    }
                }
            }
            _dragMoveActive = false;
            _dragMoveOrigin = null;
            _dragMoveTarget = null;
        });
        document.addEventListener('touchend', () => {
            _dragMoveActive = false;
            _dragMoveOrigin = null;
            _dragMoveTarget = null;
        });

        function handleTileDragStart(x, y) {

            if (state.phase === 'editor') {
                _editorDragPainting = true;
                if (typeof window._meEditorDragStart === 'function') window._meEditorDragStart();
                if (typeof window._meEditorClickTile === 'function') {
                    window._meEditorClickTile(x, y);
                }
                return;
            }
            const unit = getSelectedUnit();
            if (!unit || state.phase !== 'battle' || state.winner) return;
            if (state.autoPlayers?.[state.activePlayer]) return;
            if (unit.x === x && unit.y === y && canUnitMove(unit)) {

                if (!state.actionMode || state.actionMode === 'move') {
                    if (state.actionMode !== 'move') setActionMode('move');
                    _dragMoveActive = true;
                    _dragMoveOrigin = { x, y };
                    _dragMoveTarget = null;
                }
            }
        }

        function handleTileDragEnter(x, y) {

            if (_editorDragPainting && state.phase === 'editor') {
                if (typeof window._meEditorClickTile === 'function') {
                    window._meEditorClickTile(x, y);
                }
                return;
            }
            if (!_dragMoveActive) return;
            const unit = getSelectedUnit();
            if (!unit || !canUnitMove(unit)) {
                _dragMoveActive = false;
                return;
            }
            if (state.actionMode !== 'move') {
                _dragMoveActive = false;
                return;
            }

            if (_dragMoveOrigin && (x !== _dragMoveOrigin.x || y !== _dragMoveOrigin.y)) {
                _dragMoveTarget = { x, y };
            }
        }

        function getSelectedSpell(unit) {
            if (!unit) return null;
            return (unit.spells || []).find(s => s.name === state.selectedTool)
                || (unit._raceAbilities || []).find(s => s.name === state.selectedTool)
                || null;
        }

        function getPreviewEffect(unit, target = null) {
            if (!unit || !target || !state.pendingTarget) return null;
            const x = state.pendingTarget.x;
            const y = state.pendingTarget.y;
            if (target.x !== x || target.y !== y) return null;

            if (state.pendingTarget.mode === 'attack') {
                if (target.dead || isAllyUnit(target, unit)) return null;
                const minRoll = -2;
                const maxRoll = 2;
                let minDamage = Math.max(24, Math.floor(unit.atk * 0.65) + minRoll);
                let maxDamage = Math.max(24, Math.floor(unit.atk * 0.65) + maxRoll);
                if (unitHasStatus(target, 'marked')) {
                    minDamage += 3;
                    maxDamage += 3;
                }
                const effectiveArmor = getEffectiveArmor(target);
                if (effectiveArmor) {
                    minDamage = Math.max(1, minDamage - effectiveArmor);
                    maxDamage = Math.max(1, maxDamage - effectiveArmor);
                }
                if (target.shield > 0) {
                    minDamage = Math.max(0, minDamage - target.shield);
                    maxDamage = Math.max(0, maxDamage - target.shield);
                }
                return {
                    type: 'damage',
                    amount: maxDamage,
                    min: minDamage,
                    max: maxDamage,
                    after: Math.max(0, target.hp - maxDamage),
                    note: getTypeCombatNote(unit, target)
                };
            }

            if (state.pendingTarget.mode === 'item') {
                if (state.selectedTool === 'healPotion') {
                    if (target.dead || isEnemyUnit(target, unit)) return null;
                    const healBase = 96;
                    const amount = Math.min(healBase, target.maxHp - target.hp);
                    return amount > 0 ? {
                        type: 'heal',
                        amount,
                        after: Math.min(target.maxHp, target.hp + amount)
                    } : null;
                }
                if (state.selectedTool === 'manaPotion') {
                    if (target.dead || isEnemyUnit(target, unit) || target.maxMp <= 0) return null;
                    const amount = Math.min(40, target.maxMp - target.mp);
                    return amount > 0 ? {
                        type: 'mp',
                        amount,
                        after: Math.min(target.maxMp, target.mp + amount)
                    } : null;
                }

                const _baneRule = ITEM_RULES[state.selectedTool];
                if (_baneRule?.baneType) {
                    if (target.dead || isAllyUnit(target, unit)) return null;
                    const baneRange = getEffectiveRange(unit) + 1;
                    const _dist = Math.max(Math.abs(unit.x - target.x), Math.abs(unit.y - target.y));
                    if (_dist > baneRange) return null;
                    const isEffective = (target.types || []).includes(_baneRule.baneType);
                    let dmg = _baneRule.baseDmg + (isEffective ? _baneRule.baneDmg : 0);
                    // Banes deal magic damage → mitigated by magic defense (MDEF).
                    dmg = Math.max(1, dmg - getEffectiveArmor(target, 'magic'));
                    return {
                        type: 'damage',
                        amount: dmg,
                        min: dmg,
                        max: dmg,
                        after: Math.max(0, target.hp - dmg),
                        note: isEffective ? 'SUPER EFFECTIVE' : ''
                    };
                }
                return null;
            }

            if (state.pendingTarget.mode === 'spell') {
                const spell = getSelectedSpell(unit);
                if (!spell) return null;
                const spellPower = (unit.spellPower || 0) + getSpellStatBonus(unit, spell);
                const healBonus = getEffectiveHealBonus(unit, spell.heal || 0, target);
                if (spell.kind === 'damage') {
                    if (target.dead || isAllyUnit(target, unit)) return null;
                    let maxDamage = Math.max(32, (spell.dmg || 0) + spellPower + 16);
                    if (!spell.ignoreArmor && getEffectiveArmor(target, spell.damageType)) maxDamage = Math.max(1, maxDamage - getEffectiveArmor(target, spell.damageType));
                    if (target.shield > 0) maxDamage = Math.max(0, maxDamage - target.shield);
                    return {
                        type: 'damage',
                        amount: maxDamage,
                        min: Math.max(32, (spell.dmg || 0) + spellPower - 16),
                        max: maxDamage,
                        after: Math.max(0, target.hp - maxDamage),
                        label: spell.name,
                        note: getTypeCombatNote(unit, target, spell ? spell.spellType : null)
                    };
                }
                if (spell.kind === 'ricochet') {
                    if (target.dead || isAllyUnit(target, unit)) return null;
                    let maxDamage = Math.max(32, (spell.dmg || 0) + spellPower + 16);
                    if (getEffectiveArmor(target, spell.damageType)) maxDamage = Math.max(1, maxDamage - getEffectiveArmor(target, spell.damageType));
                    if (target.shield > 0) maxDamage = Math.max(0, maxDamage - target.shield);
                    return {
                        type: 'damage',
                        amount: maxDamage,
                        min: Math.max(32, (spell.dmg || 0) + spellPower - 16),
                        max: maxDamage,
                        after: Math.max(0, target.hp - maxDamage),
                        label: spell.name,
                        note: getTypeCombatNote(unit, target, spell ? spell.spellType : null)
                    };
                }
                if (spell.kind === 'debuff') {
                    if (target.dead || isAllyUnit(target, unit)) return null;
                    const amount = Math.max(0, (spell.dmg || 0) + spellPower);
                    return amount > 0 ? {
                        type: 'damage',
                        amount,
                        min: amount,
                        max: amount,
                        after: Math.max(0, target.hp - amount),
                        label: spell.name
                    } : {
                        type: 'status',
                        amount: 0,
                        label: spell.name
                    };
                }
                if (spell.kind === 'multiHit') {
                    if (target.dead || isAllyUnit(target, unit)) return null;
                    const total = (spell.hitDamages || []).reduce((sum, value) => sum + value, 0);
                    return {
                        type: 'damage',
                        amount: total,
                        min: total,
                        max: total,
                        after: Math.max(0, target.hp - total),
                        label: spell.name
                    };
                }
                if (spell.kind === 'heal' || spell.kind === 'revive') {
                    if (isEnemyUnit(target, unit)) return null;
                    const amount = Math.max(0, (spell.heal || 0) + healBonus);
                    const currentHp = target.dead ? 0 : target.hp;
                    const applied = Math.min(amount, target.maxHp - currentHp);
                    return {
                        type: 'heal',
                        amount: applied,
                        after: Math.min(target.maxHp, currentHp + amount),
                        label: spell.name
                    };
                }
                if (spell.kind === 'shield') {
                    if (target.dead || isEnemyUnit(target, unit)) return null;
                    return {
                        type: 'heal',
                        amount: spell.shield || 0,
                        after: target.hp,
                        label: spell.name,
                        text: `+${spell.shield || 0} shield`
                    };
                }
                if (spell.kind === 'buff') {
                    if (target.dead || isEnemyUnit(target, unit)) return null;
                    return {
                        type: 'status',
                        amount: 0,
                        label: spell.name
                    };
                }
                if (spell.kind === 'lifeDrain') {
                    if (target.dead || isAllyUnit(target, unit)) return null;
                    let maxDamage = Math.max(32, (spell.dmg || 0) + spellPower + 16);
                    if (getEffectiveArmor(target, spell.damageType)) maxDamage = Math.max(1, maxDamage - getEffectiveArmor(target, spell.damageType));
                    if (target.shield > 0) maxDamage = Math.max(0, maxDamage - target.shield);
                    return {
                        type: 'damage',
                        amount: maxDamage,
                        min: Math.max(32, (spell.dmg || 0) + spellPower - 16),
                        max: maxDamage,
                        after: Math.max(0, target.hp - maxDamage),
                        label: spell.name + ' (drains)',
                        note: getTypeCombatNote(unit, target, spell ? spell.spellType : null)
                    };
                }
            }

            if (state.pendingTarget.mode === 'combo' && state.comboPartner) {
                const partner = state.comboPartner;
                const combo = getComboForUnits(unit, partner);
                if (!combo) return null;
                const isOffensive = ['damage', 'multiHit', 'aoe', 'lifeDrain'].includes(combo.kind);
                if (isOffensive) {
                    if (target.dead || isAllyUnit(target, unit)) return null;
                    const synergy = getComboTypeSynergyVsTarget(unit, partner, target);
                    const _comboStatKey = combo.damageType === 'physical' ? 'atk' : 'intStat';
                    const _comboStatBonus = Math.floor(((unit[_comboStatKey] || 0) + (partner[_comboStatKey] || 0)) * 0.5 * 0.35);
                    const combinedPower = (unit.spellPower || 0) + (partner.spellPower || 0) + getHourglassPower(unit) + getHourglassPower(partner) + _comboStatBonus;
                    if (combo.kind === 'multiHit' && combo.hitDamages) {
                        const totalDmg = Math.max(1, Math.round(combo.hitDamages.reduce((a, b) => a + b, 0) * synergy.mult));
                        return {
                            type: 'damage',
                            amount: totalDmg,
                            min: totalDmg,
                            max: totalDmg,
                            after: Math.max(0, target.hp - totalDmg),
                            label: combo.name,
                            note: synergy.label || getTypeCombatNote(unit, target)
                        };
                    }
                    const baseDmg = (combo.dmg || 160) + combinedPower;
                    const totalDmg = Math.max(1, Math.round(baseDmg * synergy.mult));
                    return {
                        type: 'damage',
                        amount: totalDmg,
                        min: totalDmg,
                        max: totalDmg,
                        after: Math.max(0, target.hp - totalDmg),
                        label: combo.name,
                        note: synergy.label || getTypeCombatNote(unit, target)
                    };
                }

                if (combo.kind === 'healAll' && isAllyUnit(target, unit)) {
                    const healAmt = Math.round((combo.heal || 20) * getComboTypeSynergy(unit, partner).mult);
                    const applied = Math.min(healAmt, target.maxHp - target.hp);
                    return applied > 0 ? {
                        type: 'heal',
                        amount: applied,
                        after: Math.min(target.maxHp, target.hp + applied),
                        label: combo.name
                    } : null;
                }
                if (combo.kind === 'shield' && isAllyUnit(target, unit)) {
                    const shieldAmt = Math.round((combo.shield || 16) * getComboTypeSynergy(unit, partner).mult);
                    return {
                        type: 'heal',
                        amount: shieldAmt,
                        after: target.hp,
                        label: combo.name,
                        text: `+${shieldAmt} shield`
                    };
                }
                return null;
            }

            return null;
        }

        function buildPreviewSegment(current, max, preview) {
            if (!preview || !max) return '';
            const clampedCurrent = Math.max(0, Math.min(max, current));
            if (preview.type === 'damage') {
                const after = Math.max(0, Math.min(max, preview.after ?? current));
                const left = (after / max) * 100;
                const width = Math.max(0, ((clampedCurrent - after) / max) * 100);
                return width > 0 ? `<div class="selected-preview-segment damage" style="left:${left}%;width:${width}%"></div>` : '';
            }
            if (preview.type === 'heal') {
                const after = Math.max(0, Math.min(max, preview.after ?? current));
                const left = (clampedCurrent / max) * 100;
                const width = Math.max(0, ((after - clampedCurrent) / max) * 100);
                return width > 0 ? `<div class="selected-preview-segment heal" style="left:${left}%;width:${width}%"></div>` : '';
            }
            if (preview.type === 'mp') {
                const after = Math.max(0, Math.min(max, preview.after ?? current));
                const left = (clampedCurrent / max) * 100;
                const width = Math.max(0, ((after - clampedCurrent) / max) * 100);
                return width > 0 ? `<div class="selected-preview-segment mp" style="left:${left}%;width:${width}%"></div>` : '';
            }
            return '';
        }

        const _spriteCache = new Map();
        const _imgCache = new Map();
        let _spriteRenderPending = false;
        let _spriteLoadDebounceTimer = 0;
        const _pendingSpriteSrcs = new Set();

        function _getCachedImg(src) {
            if (_imgCache.has(src)) return _imgCache.get(src);
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = src;
            img.onload = () => {

                _pendingSpriteSrcs.add(src);

                clearTimeout(_spriteLoadDebounceTimer);
                _spriteLoadDebounceTimer = setTimeout(() => {
                    if (!_pendingSpriteSrcs.size) return;

                    for (const [key, val] of _spriteCache) {

                        if (_pendingSpriteSrcs.has(val)) { _spriteCache.delete(key); continue; }

                        if (typeof val === 'string' && val.startsWith('data:')) _spriteCache.delete(key);
                    }
                    _pendingSpriteSrcs.clear();

                    markDirty('board');
                    scheduleRender();
                }, 150);
            };
            _imgCache.set(src, img);
            return img;
        }

        function compositeSprite(race, equipment) {

            const raceBase = (typeof RACE_SPRITES !== 'undefined') ? RACE_SPRITES[race] : null;
            return raceBase || null;
        }

        function getUnitSprite(cls, player, unit) {

            if (unit?._heroSpriteUrl) return unit._heroSpriteUrl;
            if (unit?.race && typeof getR2RaceSpriteUrl === 'function') {
                const url = getR2RaceSpriteUrl(unit.race, unit.gender || 'male', unit.cls || cls || 'Freelancer');
                if (url) return url;
            }
            return unitSpriteDataUri(cls, player);
        }

        function getUnitSpriteByRace(cls, player, race, equipment, gender) {
            if (race && typeof getR2RaceSpriteUrl === 'function') {
                const url = getR2RaceSpriteUrl(race, gender || 'male', cls || 'Freelancer');
                if (url) return url;
            }
            return unitSpriteDataUri(cls, player);
        }

        const TYPE_BADGE_MAP = {
            human: {
                abbr: 'Human',
                cls: 'type-human'
            },
            divine: {
                abbr: 'Divine',
                cls: 'type-divine'
            },
            unholy: {
                abbr: 'Unholy',
                cls: 'type-unholy'
            },
            tech: {
                abbr: 'Tech',
                cls: 'type-tech'
            },
            anomaly: {
                abbr: 'Anomaly',
                cls: 'type-anomaly'
            },
            alien: {
                abbr: 'Alien',
                cls: 'type-alien'
            }
        };

        function renderTypeBadges(types, wrapClass = 'type-badges') {
            if (!types || !types.length) return '';
            const badges = types.map(t => {
                const b = TYPE_BADGE_MAP[t];
                return b ? `<span class="type-badge ${b.cls}">${b.abbr}</span>` : '';
            }).filter(Boolean).join('');
            return badges ? `<span class="${wrapClass}">${badges}</span>` : '';
        }

        const _PLATE_STATUS_COLORS = {
            burn:      { bg: '#c0392b', color: '#fff' },
            poison:    { bg: '#9b59b6', color: '#fff' },
            silence:   { bg: '#7f8c8d', color: '#fff' },
            stun:      { bg: '#f39c12', color: '#1a1a1a' },
            stagger:   { bg: '#e67e22', color: '#fff' },
            marked:    { bg: '#e74c6f', color: '#fff' },
            jammed:    { bg: '#8e44ad', color: '#fff' },
            drowning:  { bg: '#2980b9', color: '#fff' },
            lava_burn: { bg: '#d35400', color: '#fff' },
            protect:   { bg: '#3498db', color: '#fff' },
            charm:     { bg: '#e84393', color: '#fff' },
            sirenSong: { bg: '#6c5ce7', color: '#fff' }
        };

        function _buildBatSwarmHtml(unit) {
            if (typeof BAT_SPRITES === 'undefined' || !BAT_SPRITES.length) return '';
            const batCount = 8;

            let seed = 13;
            const idStr = String(unit.id || '0');
            for (let c = 0; c < idStr.length; c++) seed = (seed * 31 + idStr.charCodeAt(c)) | 0;
            seed = Math.abs(seed);
            const tileSize = CONFIG.tileSize || BASE_TILE;
            const spread = tileSize * 0.35;
            let bats = '';
            for (let i = 0; i < batCount; i++) {
                const spriteIdx = i % BAT_SPRITES.length;
                const url = BAT_SPRITES[spriteIdx];

                const s1 = ((seed + i * 2654435761) >>> 0) % 10000 / 10000;
                const s2 = ((seed + i * 2246822519 + 7) >>> 0) % 10000 / 10000;
                const s3 = ((seed + i * 3266489917 + 19) >>> 0) % 10000 / 10000;
                const bx = (s1 - 0.5) * 2 * spread;
                const by = (s2 - 0.5) * 2 * spread * 0.7;
                const bobDelay = (s3 * 1.2).toFixed(2);
                const idleDur = (1.2 + s1 * 0.6).toFixed(2);
                const driftX = ((s2 - 0.5) * 8).toFixed(1);
                const driftY = ((-3 - s3 * 6)).toFixed(1);
                const driftX2 = ((s3 - 0.5) * 6).toFixed(1);
                const driftY2 = ((s1 - 0.5) * 5).toFixed(1);
                const tiltA = (-8 + s1 * 16).toFixed(1);
                const tiltB = (-8 + s2 * 16).toFixed(1);
                const scatterDelay = (i * 0.04).toFixed(2);
                bats += `<div class="swarm-bat" style="background-image:url('${url}');--bat-x:${bx.toFixed(1)}px;--bat-y:${by.toFixed(1)}px;--bat-bob-delay:${bobDelay}s;--bat-idle-dur:${idleDur}s;--bat-drift-x:${driftX}px;--bat-drift-y:${driftY}px;--bat-drift-x2:${driftX2}px;--bat-drift-y2:${driftY2}px;--bat-tilt-a:${tiltA}deg;--bat-tilt-b:${tiltB}deg;--bat-scatter-delay:${scatterDelay}s"></div>`;
            }
            return `<div class="bat-swarm">${bats}</div>`;
        }

        window._sprFallback = function(img) {
            img.onerror = null;
            try {
                img.src = unitSpriteDataUri(img.dataset.cls || 'Warrior', parseInt(img.dataset.player) || 1);
            } catch(e) {
                img.style.display = 'none';
            }
        };

        function renderAccessoryBadges(unit) {
            const eq = unit?.equipment;
            if (!eq) return '';
            const acc1 = eq.accessory1 ? EQUIP_DEFS[eq.accessory1] : null;
            const acc2 = eq.accessory2 ? EQUIP_DEFS[eq.accessory2] : null;
            if (!acc1 && !acc2) return '';
            const ACCESSORY_ICONS = {
                binoculars: '👓',
                walkie_talkie: '📻',
                flair: '🔥',
                ward: '👁',
                jetpack: '🚀',
                telescope: '🔭'
            };
            const badges = [];
            if (acc1) badges.push(`<span class="acc-badge" title="${escapeHtml(acc1.desc || acc1.label)}">${ACCESSORY_ICONS[eq.accessory1] || '🎒'} ${acc1.label}</span>`);
            if (acc2) badges.push(`<span class="acc-badge" title="${escapeHtml(acc2.desc || acc2.label)}">${ACCESSORY_ICONS[eq.accessory2] || '🎒'} ${acc2.label}</span>`);
            return `<div class="acc-badges-row">${badges.join('')}</div>`;
        }

        var _lastHoverPanelFP = '';
        // Portrait art for the INFO stat card — dedicated face art when the
        // race has it (sprites.js RACE_PORTRAITS), else the unit's map sprite.
        // Same fallback chain the Horologe's view tab uses (_hrlgPortraitData).
        function renderUnitPortrait(unit) {
            let url = typeof getUnitPortraitUrl === 'function' ? getUnitPortraitUrl(unit) : null;
            const isFace = !!url;
            if (!url && typeof getBattleMapSpriteUrl === 'function') url = getBattleMapSpriteUrl(unit);
            if (!url) return '';
            return `<div class="unit-portrait${isFace ? '' : ' sprite'}" style="background-image:url('${url}')"></div>`;
        }

        function renderSelectedUnitPanel() {
            if (!selectedUnitPanel || !unitHoverHud) return;

            // The card MUST live at body level: its original home inside
            // #boardStage sits under the board's 3D perspective transform, so
            // any position:fixed/absolute child renders tilted on the board
            // plane. Body-level = true screen space, no inherited transforms.
            if (unitHoverHud.parentElement !== document.body) document.body.appendChild(unitHoverHud);

            const infoUnitId = state.showUnitInfo ? (state.focusedUnitId || state.selectedUnitId) : null;
            const unit = infoUnitId ? state.units.find(u => u.id === infoUnitId && !u.dead) || null : null;
            const suppressHoverHud = state.phase !== 'battle' || !unit || !state.showUnitInfo;
            if (suppressHoverHud) {
                if (_lastHoverPanelFP !== 'EMPTY') {
                    _lastHoverPanelFP = 'EMPTY';
                    selectedUnitPanel.classList.remove('damage-flash', 'heal-flash');
                    selectedUnitPanel.innerHTML = '';
                    unitHoverHud.classList.remove('visible');
                    unitHoverHud.innerHTML = '';
                    if (typeof clearUnitInfoRangePreview === 'function') clearUnitInfoRangePreview();
                }
                return;
            }

            const _hpFp = unit.id + '|' + unit.hp + '|' + unit.mp + '|' + unit.ap + '|' + unit.x + ',' + unit.y + '|' + (unit.statuses||[]).length + '|' + (state.actionMode||'') + '|' + (state.selectedPanelFlash||'') + '|' + (state.pendingTarget?.x ?? '') + '|' + (state.selectedUnitId||'') + '|' + (state.showUnitInfo ? '1' : '0') + '|' + (unit.shield || 0);
            if (_hpFp === _lastHoverPanelFP) return;
            _lastHoverPanelFP = _hpFp;
            const actingUnit = getSelectedUnit();
            const preview = getPreviewEffect(actingUnit, unit);
            const hpPct = Math.max(0, Math.min(100, (unit.hp / unit.maxHp) * 100));
            const mpPct = unit.maxMp > 0 ? Math.max(0, Math.min(100, (unit.mp / unit.maxMp) * 100)) : 0;
            const hpPreviewText = preview?.type === 'damage' ?
                `Potential damage: ${preview.min != null && preview.max != null ? `${preview.min}-${preview.max} HP` : `${preview.amount} HP`}${preview.note ? ` · ${preview.note}` : ''}` :
                preview?.type === 'heal' ?
                (preview.text || `Potential healing: +${preview.amount} HP`) :
                '';
            const mpPreviewText = preview?.type === 'mp' ? `Potential mana: +${preview.amount} MP` : '';
            const effAtk = unit.atk + getEffectiveAttackBonus(unit);
            // 'none' → gear/status/faction armor only, without folding the DEF
            // stat in again (we add unit.def explicitly here for the display).
            const effDef = (unit.def || 0) + getEffectiveArmor(unit, 'none');
            const effMDef = (unit.mdef || 0) + (typeof getStatusMdefDelta === 'function' ? getStatusMdefDelta(unit) : 0);
            const effMov = getEffectiveMove(unit);
            const effRng = getEffectiveRange(unit);
            const effInt = getEffectiveInt(unit);

            // Active statuses are the only extra context worth the pixels —
            // everything else (zodiac/terrain/weather/faction/items) lives in
            // other UI and just buried the numbers here.
            const statusEntries = Object.entries(unit.status || {}).filter(([, t]) => (t || 0) > 0);
            let statusPills = '';
            if (statusEntries.length > 0) {
                statusPills = '<div class="ins-status">' + statusEntries.map(([name, turns]) => {
                    const sDef = STATUS_DEFS[name];
                    const kind = sDef?.kind === 'debuff' ? ' debuff' : sDef?.kind === 'buff' ? ' buff' : '';
                    return `<span class="ins-status-pill${kind}">${sDef?.icon || sDef?.glyph || '⚠'} ${escapeHtml(sDef?.label || name)} · ${turns}</span>`;
                }).join('') + '</div>';
            }

            // FFT-style horizontal stat bar: length reads at a glance, exact
            // number at the end. Buffed/debuffed values tint green/red with a
            // white tick marking the unbuffed base on the bar.
            function statBar(label, val, base, cap, color, isPct) {
                const diff = val - base;
                const cls = diff > 0 ? 'up' : diff < 0 ? 'down' : '';
                const scale = Math.max(cap, val, base, 1);
                const w = Math.max(2, Math.min(100, (Math.max(0, val) / scale) * 100));
                const baseW = Math.max(0, Math.min(100, (Math.max(0, base) / scale) * 100));
                return `<div class="ins-stat">` +
                    `<span class="ins-stat-label">${label}</span>` +
                    `<span class="ins-stat-track"><span class="ins-stat-fill ${cls}" style="width:${w}%;background:${color}"></span>${diff !== 0 ? `<span class="ins-stat-base" style="left:${baseW}%"></span>` : ''}</span>` +
                    `<span class="ins-stat-val ${cls}">${val}${isPct ? '%' : ''}</span>` +
                    `</div>`;
            }

            const statBars =
                statBar('ATK', effAtk, unit.atk, 200, '#e0705a') +
                statBar('DEF', effDef, unit.def || 0, 200, '#7a9cc8') +
                statBar('MDEF', effMDef, unit.mdef || 0, 200, '#a98fd6') +
                statBar('INT', effInt, unit.intStat || 0, 200, '#62c4c9') +
                statBar('MOV', effMov, unit.move, 8, '#86c47e') +
                statBar('RNG', effRng, unit.range, 8, '#e0b45a') +
                statBar('CRIT', Math.round(getCritChance(unit) * 100), Math.round(getCritChance(unit) * 100), 100, '#d9c06a', true) +
                statBar('EVA', Math.round(getEvasionChance(unit) * 100), Math.round(getEvasionChance(unit) * 100), 100, '#b9bfd4', true);

            const isAlly = unit.player === getViewerPlayer();
            const forecastNote = hpPreviewText || mpPreviewText;

            selectedUnitPanel.classList.toggle('damage-flash', state.selectedPanelFlash === 'damage');
            selectedUnitPanel.classList.toggle('heal-flash', state.selectedPanelFlash === 'heal');
            selectedUnitPanel.innerHTML = '';
            unitHoverHud.classList.toggle('visible', true);
            unitHoverHud.innerHTML = `
        <div class="ins-card ${state.selectedPanelFlash === 'damage' ? 'damage-flash' : state.selectedPanelFlash === 'heal' ? 'heal-flash' : ''}">
          <div class="ins-head">
            ${renderUnitPortrait(unit)}
            <div class="ins-head-text">
              <div class="ins-name">${escapeHtml(unit.name || unit.cls)}<span class="ins-lv">Lv.${getUnitLevel(unit)}</span></div>
              <div class="ins-sub">${escapeHtml(getJobDisplayName(unit.cls))} · ${escapeHtml(unit.race || '')}</div>
              <div class="ins-sub"><span class="ins-side ${isAlly ? 'ally' : 'enemy'}">${isAlly ? 'ALLY' : 'ENEMY'}</span></div>
            </div>
          </div>
          <div class="ins-vital"><div class="ins-vital-top"><span class="ins-stat-label">HP</span><span class="ins-vital-num">${unit.hp}/${unit.maxHp}</span></div><span class="selected-bar-track ins-vital-track"><span class="selected-bar-fill hp${isAlly ? '' : ' enemy'}" style="width:${hpPct}%"></span>${unit.shield > 0 ? `<span class="selected-bar-fill shield" style="left:${hpPct}%;width:${(unit.shield / unit.maxHp) * 100}%"></span>` : ''}${buildPreviewSegment(unit.hp, unit.maxHp, preview?.type === 'damage' || preview?.type === 'heal' ? preview : null)}</span></div>
          <div class="ins-vital"><div class="ins-vital-top"><span class="ins-stat-label">MP</span><span class="ins-vital-num">${unit.mp}/${unit.maxMp}</span></div><span class="selected-bar-track ins-vital-track"><span class="selected-bar-fill mp" style="width:${mpPct}%"></span>${buildPreviewSegment(unit.mp, unit.maxMp, preview?.type === 'mp' ? preview : null)}</span></div>
          ${forecastNote ? `<div class="ins-note">${forecastNote}</div>` : ''}
          <div class="ins-stats">${statBars}</div>
          ${statusPills}
        </div>
      `;

            // The inspected unit's attack reach paints on the board while the
            // card is up — the FP cache above means this only re-runs when the
            // unit / its position / the toggle actually changed.
            if (typeof previewUnitInfoRange === 'function') previewUnitInfoRange(unit);
        }

        function ensureBattleHUD() {
            if (state.phase === 'editor') return;
            const mapRow = document.getElementById('mapRow');
            if (!mapRow) return;

            if (!mapRow.querySelector('.battle-subtitle-bar')) {
                const sub = document.createElement('div');
                sub.className = 'battle-subtitle-bar';
                sub.id = 'battleSubtitleBar';
                sub.innerHTML = '<div class="battle-subtitle-text" id="battleSubtitleText"></div>';
                mapRow.appendChild(sub);
            }

            invalidateLayoutCache();

        }

        function toggleFullscreen() {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                const el = document.documentElement;
                (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
            } else {
                (document.exitFullscreen || document.webkitExitFullscreen).call(document);
            }
        }
        function _updateFullscreenBtn() {
            const btn = document.getElementById('fsFullscreenBtn');
            if (!btn) return;
            const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
            btn.textContent = isFs ? '⛶ Exit Fullscreen' : '⛶ Fullscreen';
            if (isFs) btn.classList.add('active'); else btn.classList.remove('active');
        }
        document.addEventListener('fullscreenchange', _updateFullscreenBtn);
        document.addEventListener('webkitfullscreenchange', _updateFullscreenBtn);

        function renderFloatCombatLog() {}
        function renderHudScoreboard() {}
        function renderTurnClock() {}
        function _getHudActiveUnit() {
            const viewer = getViewerPlayer();
            const units = state.units.filter(u => u.player === viewer);
            const selUnit = getSelectedUnit();
            const activeId = selUnit?.id || (units.find(u => !u.dead)?.id) || units[0]?.id;
            return units.find(x => x.id === activeId) || null;
        }
        function updateTurnBannerUnitDetail() {}
        function renderHudRoster() {}
        var _lastActionMenuFP = '';
        function renderHudActions(unit) {}
        function _positionFloatActionMenu(fam, unit) {}
        function _repositionFloatActionMenu() {}
        function renderHudInventory(unit) {}

        var _lastTeamsFP = '';
        function renderTeams() {

            if (state.phase === 'setup') return;

            const _dyingCount = state.units.filter(u => u._dying).length;
            let _tFp = state.selectedUnitId + '|' + state.focusedUnitId + '|' + state.activePlayer + '|' + (state.actionMenuView||'') + '|' + (state.actionMode||'') + '|' + (state.selectedTool||'') + '|' + _dyingCount + '|' + (state.winner||'');
            for (let i = 0; i < state.units.length; i++) {
                const u = state.units[i];
                _tFp += '|' + u.id + ':' + u.hp + ':' + u.mp + ':' + (u.dead?1:0) + ':' + (u.ap||0);
            }
            if (_tFp === _lastTeamsFP) return;
            _lastTeamsFP = _tFp;
            const rosterItemsHtml = (u) => {
                const canUseItems = u.player === state.activePlayer && !state.autoPlayers?.[state.activePlayer] && !u.dead && canUnitAct(u);
                const pills = [];
                const addBtn = (itemKey, icon, count, label) => {
                    if ((count || 0) <= 0) return;
                    const enabled = canUseItems && canUseItemNow(u, itemKey);
                    pills.push(`<button class="roster-item-btn" ${enabled ? '' : 'disabled'} onclick="event.stopPropagation(); useRosterItemButton('${u.id}','${itemKey}')" title="${label}">${icon} ${count}</button>`);
                };
                addBtn('healPotion', ITEM_META.healPotion.icon, u.items?.healPotion || 0, 'Healing Potion');
                addBtn('manaPotion', ITEM_META.manaPotion.icon, u.items?.manaPotion || 0, 'Mana Potion');
                addBtn('scanner', ITEM_META.scanner.icon, u.items?.scanner || 0, 'Scanner');
                return pills.length ? `<div class="roster-items">${pills.join('')}</div>` : '';
            };

            const _oldPositions = new Map();
            if (teamsEl) {
                const oldCards = teamsEl.querySelectorAll('.roster-card[data-uid]');
                for (const card of oldCards) {
                    _oldPositions.set(card.dataset.uid, card.getBoundingClientRect());
                }
            }

            const rosterFor = (player) => {
                let units = state.units.filter(u => u.player === player);
                if (!units.length) return '<p class="small">No units.</p>';

                if (state.selectedUnitId && player === getViewerPlayer()) {
                    units = [...units].sort((a, b) => {
                        if (a.id === state.selectedUnitId) return -1;
                        if (b.id === state.selectedUnitId) return 1;
                        return 0;
                    });
                }

                return `<div class="team-roster">` + units.map(u => {
                    const hpPct = Math.max(0, Math.min(100, (u.hp / u.maxHp) * 100));
                    const mpPct = u.maxMp > 0 ? Math.max(0, Math.min(100, (u.mp / u.maxMp) * 100)) : 0;
                    const isHighlighted = (state.focusedUnitId || state.selectedUnitId) === u.id;
                    const isSelected = state.selectedUnitId === u.id;
                    const onclick = !u.dead && u.player === state.activePlayer && !state.autoPlayers?.[state.activePlayer] ?
                        `onclick="selectUnit('${u.id}')"` :
                        `onclick="focusUnitPanel('${u.id}')"`;
                    const actionHtml = '';
                    const unitFloor = getSectionForUnit(u);
                    const unitSection = getSectionForUnit(u);
                    const sectionBadge = unitSection !== 'earth' ? `<span style="font-size:8px;padding:1px 4px;border-radius:3px;background:${unitSection === 'above' ? 'rgba(100,160,255,0.2)' : unitSection === 'below' ? 'rgba(160,120,80,0.2)' : 'rgba(80,160,80,0.2)'};color:${unitSection === 'above' ? '#88bbff' : unitSection === 'below' ? '#cc9966' : '#88cc88'}">${unitSection === 'above' ? '🔼' : '🔽'} ${unitSection}</span>` : '';
                    const offSectionStyle = '';
                    return `
            <div class="roster-card clickable with-actions ${u.dead ? 'dead' : ''} ${isSelected ? 'selected-roster' : ''}" data-uid="${u.id}" ${onclick} style="${offSectionStyle}">
              ${renderUnitSprite(u.cls, u.player, 'builder-sprite', u.race || '', u.equipment, u.gender || '')}
              <div class="roster-main">
                <div class="roster-name">${u.name || u.cls} ${sectionBadge}</div>
                <div class="roster-sub">${u.race || '?'} · ${u.cls} · ${coordLabel(u.x, u.y)}</div>
                <div class="type-badges-block">${renderTypeBadges(u.types || [])}${u.faction ? `<span style="font-size:8px;color:var(--muted);margin-left:2px">${u.faction}</span>` : ''}</div>
                ${renderAccessoryBadges(u)}
                <div class="mini-track"><div class="mini-fill-hp${u.player === getViewerPlayer() ? '' : ' enemy'}" style="width:${hpPct}%"></div></div>
                <div class="mini-track"><div class="mini-fill-mp" style="width:${mpPct}%"></div></div>
                <div class="roster-stats">
                  <span>${u.hp}/${u.maxHp} HP</span>
                  <span>${u.mp}/${u.maxMp} MP${u.hourglasses ? ` · ⏳${u.hourglasses}` : ''}</span>
                </div>
                ${getActiveStatusKeys(u).length > 0 ? `<div class="type-badges-block" style="margin-top:2px">${getActiveStatusKeys(u).map(k => { const m = STATUS_DEFS[k]; return m ? `<span style="font-size:8px;background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:3px;color:var(--muted)">${m.icon || '•'} ${m.short || k}</span>` : ''; }).join('')}</div>` : ''}
                ${rosterItemsHtml(u)}
              </div>
              ${actionHtml}
            </div>
          `;
                }).join('') + `</div>`;
            };

            const viewer = getViewerPlayer();
            const allyPlayer = viewer;
            const enemyPlayer = viewer === 1 ? 2 : 1;

            teamsEl.innerHTML = `
        <div class="team-card" style="border-left:3px solid var(--blue);padding-left:8px">
          <h3 style="color:var(--blue)">Your Vessels (P${allyPlayer})</h3>
          ${rosterFor(allyPlayer)}
        </div>
      `;

            if (_oldPositions.size > 0) {
                const newCards = teamsEl.querySelectorAll('.roster-card[data-uid]');
                for (const card of newCards) {
                    const uid = card.dataset.uid;
                    const oldRect = _oldPositions.get(uid);
                    if (!oldRect) continue;
                    const newRect = card.getBoundingClientRect();
                    const deltaY = oldRect.top - newRect.top;
                    if (Math.abs(deltaY) < 2) continue;

                    card.style.transform = `translateY(${deltaY}px)`;
                    card.style.transition = 'none';

                    void card.offsetHeight;
                    card.classList.add('roster-flip');
                    card.style.transform = '';

                    card.addEventListener('transitionend', function handler() {
                        card.classList.remove('roster-flip');
                        card.style.transform = '';
                        card.removeEventListener('transitionend', handler);
                    }, {
                        once: true
                    });
                }
            }

            if (state.selectedUnitId && teamsEl) {
                teamsEl.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }

            if (isOnlineMatch() && teamsEl) {
                const cards = teamsEl.querySelectorAll('.team-card');
                for (var i = 0; i < cards.length; i++) cards[i].style.display = '';
            }

            if (state.phase === 'battle') {
                dirty.hud = false;
                ensureBattleHUD();
                renderHudRoster();
                renderHudScoreboard();
                renderTurnClock();
                renderFloatCombatLog();
            }
        }

        function renderTimer() {
            const timerEl = document.getElementById('gameTimer');
            if (!timerEl || !state.startTime) return;

            const displaySec = state.suddenDeathActive ? 0
                : Math.max(0, Math.floor((Date.now() - state.startTime) / 1000));

            timerEl.classList.toggle('timer-sudden-death', !!state.suddenDeathActive);
            timerEl.classList.remove('timer-urgent');

            const mins = Math.floor(displaySec / 60).toString().padStart(2, '0');
            const secs = (displaySec % 60).toString().padStart(2, '0');
            timerEl.textContent = state.suddenDeathActive ? '⚡ SD' : `${mins}:${secs}`;

            const clockEl = document.getElementById('analogTimer');
            if (clockEl) {
                const totalMinutes = displaySec / 60;
                const secondsInMinute = displaySec % 60;
                const minuteRotation = (secondsInMinute / 60) * 360;
                const hourRotation = ((totalMinutes % 60) / 60) * 360;
                const secondRotation = (secondsInMinute / 60) * 360;
                clockEl.style.setProperty('--hour-rotation', `${hourRotation}deg`);
                clockEl.style.setProperty('--minute-rotation', `${minuteRotation}deg`);
                clockEl.style.setProperty('--second-rotation', `${secondRotation}deg`);
            }

        }

        function renderStatus() {
            let selectedText = 'No unit selected.';
            const unit = getSelectedUnit();
            if (unit) {
                selectedText = `${unit.cls} selected. Move ${getEffectiveMove(unit)}, Attack ${getEffectiveRange(unit)}, Inspect ${getEffectiveInspect(unit)} reach · ${getInspectTileCount(unit)} tiles, AWR ${getEffectiveAwr(unit)}, INT ${getEffectiveInt(unit)}. MP ${unit.mp}/${unit.maxMp}. ${getStatusLabels(unit).join(', ') || ''}`;
            }

            let phaseText = state.phase;
            if (state.phase === 'setup') {
                if (state.setupStep === 'builder') phaseText = 'Setup: build parties';
                if (state.setupStep === 'ready') phaseText = 'Setup: ready to begin';
            }

            phaseBox.innerHTML = `
        <div class="small"><strong>Phase:</strong>${phaseText}</div>
        <div class="small"><strong>Selected:</strong>${selectedText}</div>
        <div class="small"><strong>Current Rule Set:</strong> 1 action per unit per round.</div>
        <div class="small"><strong>Cycle:</strong>${getCurrentCyclePhase() === 'day' ? 'Day' : 'Night'} · sleep preferences now matter.</div>
        <div class="small"><strong>Terrain:</strong> Grass, water, mountain, and desert are now modular rules with easy tweak points.</div>
        <div class="small"><strong>Inspect:</strong> choose a nearby tile to reveal whether an hourglass is there.</div>
        <div class="small"><strong>Hint System:</strong> a failed scan points toward the closest hidden hourglass.</div>
        <div class="small"><strong>Leveling V2:</strong> units auto-learn spells as they level up in battle. At Lv.4, pick a secondary job for an offhand weapon and 6th spell. Use Recall to teleport to your spawn zone for healing!</div>
        <div class="small"><strong>Control Mode:</strong> Player 2 is computer-controlled.</div>
        <div class="small"><strong>Hourglasses:</strong> scans reveal them, movement collects them, and defeated carriers drop them for both teams to see.</div>
      `;

            turnLabel.textContent = state.phase === 'setup' ?
                'Setup' :
                state.winner === 0 ?
                'No Contest' :
                state.winner ?
                `Player ${state.winner} Wins` :
                `Player ${state.activePlayer} Turn`;
            turnLabel.classList.remove('active-turn-p1', 'active-turn-p2');
            if (state.phase === 'battle' && !state.winner) {
                turnLabel.classList.add(`active-turn-p${state.activePlayer}`);
            }

            {
                const _rlMain = state.matchClock && state.matchClock.roundLimit ? state.matchClock.roundLimit : 0;
                const _pastMain = _rlMain > 0 && state.round > _rlMain;
                const _roundStrMain = _pastMain
                    ? (state.suddenDeathActive ? '⚡ Sudden Death' : '⏱ TIME')
                    : `Round ${state.round}`;
                roundLabel.textContent = `${_roundStrMain} · Match ${state.matchNumber}`;
            }

            const perspectivePlayer = getViewerPlayer();
            const p1Held = state.phase === 'battle' ? carriedHourglassCount(1) : 0;
            const p2Held = state.phase === 'battle' ? carriedHourglassCount(2) : 0;
            const cycle = getCurrentCyclePhase();
            objectiveLabel.textContent = `Hourglasses · P1: ${p1Held} held · P2: ${p2Held} held · Win by Tower Destruction`;
            const cycleChanged = lastRenderedCycle && lastRenderedCycle !== cycle;
            if (cycleLabel) cycleLabel.textContent = `Cycle: ${cycle === 'day' ? '☀ Day' : '🌙 Night'}`;

            document.body.dataset.cycle = cycle;
            if (boardStageEl) boardStageEl.dataset.cycle = cycle;

            if (cycleChanged) {
                clearTimeout(window._sunsetFadeOutTimer);
                window._sunsetFadeOutTimer = setTimeout(() => {
                    const sunsetEl = document.getElementById('sunsetOverlay');
                    if (sunsetEl) {
                        sunsetEl.classList.remove('active');
                        sunsetEl.classList.remove('approaching');
                    }
                }, 1500);
            }
            lastRenderedCycle = cycle;
            if (terrainLabel) terrainLabel.textContent = `Terrain: Grass / Water / Mountain / Desert`;

            if (sideP1HeldEl) sideP1HeldEl.textContent = p1Held;
            if (sideP2HeldEl) sideP2HeldEl.textContent = p2Held;

            if (state.phase !== 'battle') return;

            scoreboardEl.innerHTML = (() => {
                const cycle = getCurrentCyclePhase();
                const cycleIcon = cycle === 'day' ? '☀' : '🌙';
                const cycleLabel = cycle === 'day' ? 'Day' : 'Night';
                const mpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
                const showTowers = mpMode ? mpMode.hasTowers : true;
                const showHourglasses = mpMode ? mpMode.hasHourglasses !== false : true;
                const scoringType = mpMode ? mpMode.scoringType : null;
                const isArena = !mpMode || mpMode.id === 'arena';

                const t1 = state.towers?.[1];
                const t2 = state.towers?.[2];
                const t1Pct = t1 && t1.maxHp > 0 ? Math.round(t1.hp / t1.maxHp * 100) : 100;
                const t2Pct = t2 && t2.maxHp > 0 ? Math.round(t2.hp / t2.maxHp * 100) : 100;

                const p1Kills = state.matchKills ? (state.matchKills[1] || 0) : state.units.filter(u => u.player === 1).reduce((s, u) => s + (u._trackKills || 0), 0);
                const p2Kills = state.matchKills ? (state.matchKills[2] || 0) : state.units.filter(u => u.player === 2).reduce((s, u) => s + (u._trackKills || 0), 0);

                const p1Score = state.matchScores ? (state.matchScores[1] || 0) : 0;
                const p2Score = state.matchScores ? (state.matchScores[2] || 0) : 0;

                const _rl = state.matchClock && state.matchClock.roundLimit ? state.matchClock.roundLimit : 0;
                const _roundPastLimit = _rl > 0 && state.round > _rl;
                const _roundDisplay = _roundPastLimit
                    ? (state.suddenDeathActive ? '<span class="sb-round-time sb-sd">⚡ SUDDEN DEATH</span>' : '<span class="sb-round-time">⏱ TIME</span>')
                    : `Round ${state.round}${_rl ? ' / ' + _rl : ''}`;

                let arenaP1Pts = 0, arenaP2Pts = 0;
                if (isArena) {
                    const _ARP = { kill: 15, towerDmgPer10: 1, hourglass: 40, nexusRound: 3 };
                    function _liveArenaScore(p) {
                        const enemy = p === 1 ? 2 : 1;
                        let pts = 0;
                        pts += (state.matchKills?.[p] || 0) * _ARP.kill;
                        const eTw = state.towers?.[enemy];
                        if (eTw) pts += Math.floor(Math.max(0, (eTw.maxHp || 1500) - eTw.hp) / (eTw.maxHp || 1500) * 250) * _ARP.towerDmgPer10;
                        if (state.hourglasses) {
                            pts += state.hourglasses.filter(h => {
                                if (!h.carriedBy) return false;
                                const c = state.units.find(u => u.id === h.carriedBy);
                                return c && !c.dead && c.player === p;
                            }).length * _ARP.hourglass;
                        }
                        pts += (state._arenaNexusControl?.[p] || 0) * _ARP.nexusRound;
                        return pts;
                    }
                    arenaP1Pts = _liveArenaScore(1);
                    arenaP2Pts = _liveArenaScore(2);
                }

                let scoreLabel = 'Kills';
                let p1Display = p1Kills;
                let p2Display = p2Kills;
                if (isArena) {
                    scoreLabel = 'Score';
                    p1Display = arenaP1Pts;
                    p2Display = arenaP2Pts;
                } else if (scoringType === 'domination' || scoringType === 'hotspot') {
                    scoreLabel = 'Points';
                    p1Display = p1Score;
                    p2Display = p2Score;
                } else if (scoringType === 'ctf') {
                    scoreLabel = 'Captures';
                    p1Display = p1Score;
                    p2Display = p2Score;
                }

                const modeBadge = mpMode ? `<span class="sb-mode-badge">${mpMode.icon || ''} ${mpMode.label || ''}</span>` : '';
                const sdBadge = state.suddenDeathActive ? '<span class="sb-sd-badge">⚡ SD</span>' : '';

                const zodiac = state.activeZodiac || 'aries';
                const zodiacIcon = ZODIAC_ICONS[zodiac] || '✦';
                const zodiacLabel = zodiac.charAt(0).toUpperCase() + zodiac.slice(1);
                const zodiacRound = state.round % ZODIAC_ROTATION_ROUNDS || ZODIAC_ROTATION_ROUNDS;
                const zodiacLeft = ZODIAC_ROTATION_ROUNDS - zodiacRound;
                const skyActive = state.skyEvent ? SKY_EVENTS[state.skyEvent.type] : null;
                const weatherActive = (state.activeWeather || []).length > 0;
                const weatherText = weatherActive
                    ? state.activeWeather.map(w => `${WEATHER_REGISTRY[w.type].icon} ${WEATHER_REGISTRY[w.type].label}`).join(' ')
                    : '☀ Clear';

                const p1Gold = state.units.filter(u => u.player === 1 && !u.dead).reduce((s, u) => s + (u.gold || 0), 0);
                const p2Gold = state.units.filter(u => u.player === 2 && !u.dead).reduce((s, u) => s + (u.gold || 0), 0);
                const nx = state.nexusPoints || {};
                const p1Nex = Object.values(nx).filter(n => n?.owner === 1).length;
                const p2Nex = Object.values(nx).filter(n => n?.owner === 2).length;

                let secItems = [];
                secItems.push(`<span class="sb-sec-icon">${weatherActive ? WEATHER_REGISTRY[state.activeWeather[0].type].icon : '☀'}</span> <span class="sb-sec-val">${weatherText}</span>`);
                secItems.push(`${zodiacIcon} <span class="sb-sec-val">${zodiacLabel}</span> ${zodiacLeft === 0 ? 'shifts' : zodiacLeft + 'rnd'}`);
                secItems.push(`${skyActive ? `${skyActive.icon} <span class="sb-sec-val">${skyActive.label}</span> ${state.skyEvent.remaining}rnd` : 'Sky —'}`);
                if (showHourglasses) {
                    secItems.push(`⏳ <span class="sb-sec-val">${carriedHourglassCount(1)}</span>–<span class="sb-sec-val">${carriedHourglassCount(2)}</span>`);
                }
                if (isArena || showTowers) {
                    secItems.push(`⬡<span class="sb-sec-val">${p1Nex}</span>–<span class="sb-sec-val">${p2Nex}</span>`);
                }
                if (isArena) {
                    secItems.push(`🗡 <span class="sb-sec-val">${p1Kills}</span>–<span class="sb-sec-val">${p2Kills}</span>`);
                } else if (scoringType === 'kills') {
                    secItems.push(`🗡 <span class="sb-sec-val">${p1Kills}</span>–<span class="sb-sec-val">${p2Kills}</span>`);
                }
                if (scoringType === 'ctf' && state.flags) {
                    const f1 = state.flags[1], f2 = state.flags[2];
                    const s1 = f1.carriedBy ? '⚠️ TAKEN' : f1.atBase ? '✅ Safe' : '❗ DROP';
                    const s2 = f2.carriedBy ? '⚠️ TAKEN' : f2.atBase ? '✅ Safe' : '❗ DROP';
                    secItems.push(`🔵 ${s1}`);
                    secItems.push(`🔴 ${s2}`);
                }
                secItems.push(`Match <span class="sb-sec-val">${state.record[1]}–${state.record[2]}</span>`);

                const secHtml = secItems.map(s => `<div class="sb-sec-item">${s}</div>`).join('<div class="sb-sec-sep"></div>');

                let p1Tower = '';
                let p2Tower = '';
                if (isArena && showTowers) {
                    p1Tower = `
                      <div class="sb-tower-section p1">
                        <div class="sb-tower-top">
                          <span class="sb-tower-label p1">P1</span>
                          <span class="sb-tower-hp p1-hp${t1Pct <= 30 ? ' critical' : t1Pct <= 50 ? ' low' : ''}">${t1 ? t1.hp : '?'}/${t1 ? t1.maxHp : '?'}</span>
                        </div>
                        <div class="sb-tower-bar"><div class="sb-tower-fill p1" style="width:${t1Pct}%"></div></div>
                      </div>`;
                    p2Tower = `
                      <div class="sb-tower-section p2">
                        <div class="sb-tower-top">
                          <span class="sb-tower-hp p2-hp${t2Pct <= 30 ? ' critical' : t2Pct <= 50 ? ' low' : ''}">${t2 ? t2.hp : '?'}/${t2 ? t2.maxHp : '?'}</span>
                          <span class="sb-tower-label p2">P2</span>
                        </div>
                        <div class="sb-tower-bar"><div class="sb-tower-fill p2" style="width:${t2Pct}%"></div></div>
                      </div>`;
                }

                const centerExtra = sdBadge ? `<div style="margin-top:1px">${sdBadge}</div>` : '';

                if (mpMode && mpMode.isFFA) {
                    const sorted = [...state.units].sort((a, b) => (b._matchKills || 0) - (a._matchKills || 0));
                    const top = sorted.slice(0, 6);
                    const viewer = getViewerPlayer();
                    const ffaRows = top.map(u => {
                        const kills = u._matchKills || 0;
                        const deaths = u._matchDeaths || 0;
                        const isMe = u.player === viewer;
                        const isDead = u.dead;
                        const cls = isMe ? 'ffa-row-me' : 'ffa-row';
                        const deadCls = isDead ? ' ffa-dead' : '';
                        const name = unitDisplayName(u);
                        return `<div class="${cls}${deadCls}"><span class="ffa-name">${escapeHtml(name)}</span><span class="ffa-kd">${kills}/${deaths}</span></div>`;
                    }).join('');

                    return `
                <div class="sb-wrap">
                  <div class="sb-secondary">${secHtml}</div>
                  <div class="sb-main sb-ffa">
                    <div class="sb-ffa-board">
                      <div class="sb-ffa-header">${modeBadge} <span class="sb-ffa-kd-label">K/D</span></div>
                      ${ffaRows}
                    </div>
                    <div class="sb-center-spacer">
                      <div class="sb-round-line">${_roundDisplay}</div>
                      <div class="sb-celestial-orb ${cycle === 'day' ? 'sb-sun' : 'sb-moon'}"></div>
                      <div class="sb-timer" id="gameTimer">00:00</div>
                      ${centerExtra}
                    </div>
                  </div>
                </div>`;
                }

                return `
            <div class="sb-wrap">
              <div class="sb-secondary">${secHtml}</div>
              <div class="sb-main">
                ${p1Tower}
                <div class="sb-kills-wrap">
                  <div class="sb-kills p1">${p1Display}</div>
                  <div class="sb-kills-label">${scoreLabel}</div>
                </div>
                <div class="sb-center-spacer">
                  <div class="sb-round-line">${_roundDisplay}</div>
                  <div class="sb-celestial-orb ${cycle === 'day' ? 'sb-sun' : 'sb-moon'}"></div>
                  <div class="sb-timer" id="gameTimer">00:00</div>
                  ${centerExtra}
                </div>
                <div class="sb-kills-wrap">
                  <div class="sb-kills p2">${p2Display}</div>
                  <div class="sb-kills-label">${scoreLabel}</div>
                </div>
                ${p2Tower}
              </div>
            </div>`;
            })();
            if (state.phase === 'battle') renderTimer();

            if (state.phase === 'battle') renderHudScoreboard();
            if (state.phase === 'battle') renderTurnClock();
            if (state.phase === 'battle') renderFloatCombatLog();
        }

        function cancelActionSelection() {
            if (state.phase !== 'battle') return;
            playSfx('uiBack');
            state.actionMenuView = 'root';
            state.actionMode = null;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            state.pendingTarget = null;
            state.comboPartner = null;
            state.hoverUnitId = null;
            state._spellOrientation = null;
            if (typeof _clearBuildHoverPreview === 'function') _clearBuildHoverPreview();
            state.focusedUnitId = state.selectedUnitId || null;
            // back at the root menu → return to the third-person turn shot
            // (battle.js contextual camera; no-op off-turn / in 2D mode)
            if (typeof window._tpsTurnShot === 'function') window._tpsTurnShot();
            renderBattleSelectionUI();
        }

        function pushUndoSnapshot() {}
        function clearUndoStack() {}

        function _moveWillGainInfo(unit, destX, destY) {
            const path = findMovePath(unit, destX, destY);
            for (const step of path) {
                if (getPathPickupEvent(unit, step.x, step.y)) return true;
            }

            if (state.warpRunes?.length) {
                for (const step of path) {
                    if (state.warpRunes.some(r => r.x === step.x && r.y === step.y)) return true;
                }
            }

            if (state.wards?.length) {
                if (state.wards.some(w => w.x === destX && w.y === destY && w.owner !== unit.player)) return true;
            }
            return false;
        }

        function toggleUnitInfo() {
            state.showUnitInfo = !state.showUnitInfo;
            playSfx('uiCursorMove');
            renderSelectedUnitPanel();

            const u = getSelectedUnit();
            if (u) renderHudActions(u);
            // the Horologe's ⓘ blade lights while the panel is open — poke the
            // React HUD so its selected state tracks the toggle immediately
            if (typeof markDirty === 'function') { markDirty('hud'); if (typeof renderIfDirty === 'function') renderIfDirty(); }
        }

        /* True when handleBackAction() has a menu/aim level to step out of —
           the Escape owner uses this to pick back-vs-pause. Deliberately
           EXCLUDES the bare unit selection: Esc at the root menu pauses
           (genre standard); right-click / the BACK blade still deselect via
           handleBackAction directly. */
        function _escHasBackTarget() {
            return !!(state._enemyActionTargetId || state._tileActionTarget
                || state.showUnitInfo || state.pendingTarget || state.selectedTool
                || state.actionMode
                || (state.actionMenuView && state.actionMenuView !== 'root'));
        }

        function handleBackAction() {
            if (state.phase !== 'battle' || state.winner) return;
            if (state.autoPlayers?.[state.activePlayer]) return;

            // Backing out always empties the repeat queue — queued follow-up
            // attacks/casts must never fire after the player cancels.
            state._repeatQueue = null;

            if (state._enemyActionTargetId) {
                playSfx('uiBack');
                state._enemyActionTargetId = null;
                markDirty('hud');
                renderIfDirty();
                return;
            }

            if (state._tileActionTarget) {
                playSfx('uiBack');
                state._tileActionTarget = null;
                markDirty('hud');
                renderIfDirty();
                return;
            }

            if (state.showUnitInfo) {
                playSfx('uiBack');
                state.showUnitInfo = false;
                renderSelectedUnitPanel();
                const u = getSelectedUnit();
                if (u) renderHudActions(u);
                return;
            }

            /* ── ONE LEVEL AT A TIME ──────────────────────────────────────
               Back always steps exactly one menu level: target list → the
               list it was opened from (abilities/items/root), armed
               spell/item aim → its list, sub-menu → root. A pending ✓ pick
               is NOT its own level — it clears as part of leaving the
               targeting step (the old pending-only step made back feel like
               it "didn't work" half the time). */
            if (state.actionMenuView === 'spellTargets' || state.actionMenuView === 'spellOrientation') {
                playSfx('uiBack');
                state.actionMenuView = 'spells';
                state.actionMode = null;
                state.selectedTool = null;
                state.pendingTarget = null;
                state._spellOrientation = null;
                renderBattleSelectionUI();
                return;
            }

            if (state.actionMenuView === 'attackTargets') {
                playSfx('uiBack');
                state.actionMenuView = 'root';
                state.actionMode = null;
                state.selectedTool = null;
                state.pendingTarget = null;
                renderBattleSelectionUI();
                return;
            }

            // Armed spell aiming from the abilities drum (tile-target / free
            // aim) → back to the ABILITIES list, never all the way to root.
            if (state.actionMode === 'spell' && state.actionMenuView === 'spells' && state.selectedTool) {
                playSfx('uiBack');
                state.actionMode = null;
                state.selectedTool = null;
                state.pendingTarget = null;
                state._spellOrientation = null;
                if (typeof clearAoePreview === 'function') clearAoePreview();
                if (typeof clearSpellRangePreview === 'function') clearSpellRangePreview();
                renderBattleSelectionUI();
                return;
            }

            // Armed item targeting → back to the ITEMS list.
            if (state.actionMode === 'item' && state.actionMenuView === 'items' && state.selectedTool) {
                playSfx('uiBack');
                state.actionMode = null;
                state.selectedTool = null;
                state.pendingTarget = null;
                if (typeof clearAoePreview === 'function') clearAoePreview();
                renderBattleSelectionUI();
                return;
            }

            if (state.pendingTarget) {
                playSfx('uiBack');
                state.pendingTarget = null;
                renderBattleSelectionUI();
                return;
            }

            if (state.actionMenuView && state.actionMenuView !== 'root') {
                cancelActionSelection();
                return;
            }

            if (state.actionMode) {
                cancelActionSelection();
                return;
            }

            if (state.selectedUnitId) {
                playSfx('uiBack');
                state.selectedUnitId = null;
                state.focusedUnitId = null;
                state.hoverUnitId = null;
                state.showUnitInfo = false;
                state.actionMode = null;
                state.actionMenuView = 'root';
                state.selectedTool = null;
                state.pendingTarget = null;
                state.comboPartner = null;
                resetBoardCamera(true);
                renderBattleSelectionUI();
                return;
            }
        }

        function chooseActionMenu(view) {
            const unit = getSelectedUnit();
            if (!unit) {
                addLog('Select one of your units first.');
                return;
            }

            if (_wasdOrigin && !_wasdCommitted) {
                _commitWasdMove(unit);
            }
            if (!canUnitAct(unit)) {
                addLog(`${unitDisplayName(unit)} already acted this round.`);
                return;
            }
            if (view === 'spells' && unitHasStatus(unit, 'silence')) {
                addLog(`${unitDisplayName(unit)} is silenced and cannot cast this turn.`);
                return;
            }
            // Never open a submenu whose every row would be greyed out — it
            // only costs the player the clicks to back out of it again.
            if (view === 'spells' && typeof anyCastableSpellNow === 'function' && !anyCastableSpellNow(unit)) {
                addLog(`${unitDisplayName(unit)} has no usable abilities right now.`);
                playErrorSfx();
                return;
            }
            if (view === 'items' && typeof anyUsableItemNow === 'function' && !anyUsableItemNow(unit)) {
                const _holdsAny = unit.items && Object.values(unit.items).some(n => (n || 0) > 0);
                addLog(_holdsAny ? 'No items can be used right now.' : `${unitDisplayName(unit)} has no items.`);
                playErrorSfx();
                return;
            }
            playSfx('uiConfirm');
            state.actionMode = null;
            if (view === 'pings') {
                state.actionMenuView = 'pings';
            } else {
                state.actionMenuView = view;
            }
            state.selectedTool = null;
            state.pendingTarget = null;
            renderBattleSelectionUI({
                includeBoard: false
            });
        }

        function chooseItemAction(itemKey) {
            const unit = getSelectedUnit();

            if (unit && itemKey === 'scanner') {
                state.actionMode = 'item';
                state.selectedTool = itemKey;
                doItem(unit, unit.x, unit.y, unit.z);
                return;
            }

            if (unit && itemKey === 'panacea') {
                usePanacea(unit);
                return;
            }

            if (unit && itemKey === 'warpStone') {
                initiateWarpStone(unit);
                return;
            }

            // Combat stims (any ITEM_RULES entry with selfBoost) are self-use.
            if (unit && ITEM_RULES[itemKey]?.selfBoost) {
                useStimItem(unit, itemKey);
                return;
            }
            setTool('item', itemKey);
            state.actionMenuView = 'items';
            renderBattleSelectionUI({
                includeBoard: false
            });
        }

        function doGuard(unit) {
            /* SIMUL plan phase: Guard becomes a queued PRIORITY order — it
               resolves before speed-ordered actions (the "protect" of the
               simultaneous ruleset). */
            if (typeof window._isSimulMode === 'function' && window._isSimulMode()
                && state._simulPhase === 'plan' && !state._simulResolving && window.SimulEngine) {
                window.SimulEngine.queueStep(unit, { type: 'guard' });
                return;
            }
            if (!unit || unit.dead || (unit.ap || 0) < 1) {
                addLog('Guard requires at least 1 AP.');
                return;
            }
            pushUndoSnapshot(true);

            applyStatusEffects(unit, [{ id: 'guarding', duration: 1 }], 'Guard: ');

            unit._guardCounterBonus = 0.15;
            /* Overwatch rides the Guard stance: one reaction shot at the first
               enemy that finishes a move inside this unit's attack range
               (checkOverwatchTriggers, battle.js). Disarmed by the same round
               reset that clears _guardCounterBonus. */
            unit._overwatchArmed = true;
            addLog(`${unitDisplayName(unit)} takes a defensive stance! (+DEF/MDEF, +15% Counter — 👁 Overwatch: the first enemy to stop in attack range gets shot)`);
            showFloatingTextForUnit(unit, '🛡 GUARD', 'buff', { durationMs: 1200 });
            playSfx('uiConfirm');

            // Guard is a full defensive commit: it ends the turn no matter how
            // much AP is left — which also makes it the natural "dump my last
            // AP" play instead of a dead End Turn click.
            unit.ap = 0;
            state.actionMode = null;

            if (unit.ap <= 0 || unit.dead) state.actionMenuView = 'root';
            state.pendingTarget = null;
            if (unit.ap <= 0) {
                const endedUnitId = unit.id;
                state.selectedUnitId = null;
                state.focusedUnitId = null;
                state.hoverUnitId = null;
                markDirty('board'); markDirty('actions'); renderIfDirty();
                maybeAdvanceTurn();
            } else {
                markDirty('board'); markDirty('actions'); renderIfDirty();
            }
        }

        function doRecall(unit) {
            /* SIMUL: recall teleports immediately — it can't be queued and
               must not execute during the secret planning phase. */
            if (typeof window._isSimulMode === 'function' && window._isSimulMode()
                && state._simulPhase === 'plan' && !state._simulResolving) {
                addLog('🔵 Recall is not available in Simul mode (yet).');
                playErrorSfx();
                return;
            }
            if (!unit || unit.dead) return;
            const apCost = typeof RECALL_AP_COST !== 'undefined' ? RECALL_AP_COST : 2;
            const cdRounds = typeof RECALL_COOLDOWN_ROUNDS !== 'undefined' ? RECALL_COOLDOWN_ROUNDS : 5;
            if ((unit.ap || 0) < apCost) {
                addLog(`Recall requires ${apCost} AP.`);
                return;
            }
            if ((unit._recallCooldown || 0) > 0) {
                addLog(`Recall on cooldown (${unit._recallCooldown} rounds).`);
                return;
            }

            /* Recall only works while hidden — you can't slip back to spawn while
               an enemy has eyes on you (the nameplate eye icon shows this). */
            if (typeof isUnitSeenByAnyEnemy === 'function' && isUnitSeenByAnyEnemy(unit)) {
                addLog(`${unitDisplayName(unit)} can't recall while spotted by the enemy.`);
                playErrorSfx();
                return;
            }

            const zone = state.spawnZones?.[unit.player];
            const spawnIdx = unit._spawnIndex ?? 0;
            const tile = zone?.[spawnIdx];
            if (!tile) {
                addLog('No spawn zone found for recall.');
                return;
            }

            /* Already at spawn zone */
            if (typeof isInSpawnZone === 'function' && isInSpawnZone(unit.x, unit.y, unit.player)) {
                addLog(`${unitDisplayName(unit)} is already in their spawn zone.`);
                return;
            }

            pushUndoSnapshot(true);

            /* Push enemy off tile if occupied */
            const blocker = state.units.find(u => !u.dead && u.x === tile.x && u.y === tile.y && u.id !== unit.id);
            if (blocker && blocker.player !== unit.player) {
                pushUnitToNearestOpen(blocker, tile.x, tile.y);
                addLog(`⚡ ${unitDisplayName(blocker)} is pushed out of spawn zone!`);
            }

            /* Find open tile if friendly occupies */
            let destX = tile.x, destY = tile.y;
            if (blocker && blocker.player === unit.player) {
                let found = false;
                for (const zt of zone) {
                    if (!state.units.some(u => !u.dead && u.x === zt.x && u.y === zt.y)) {
                        destX = zt.x; destY = zt.y; found = true; break;
                    }
                }
                if (!found) {
                    pushUnitToNearestOpen(unit, tile.x, tile.y);
                    destX = unit.x; destY = unit.y;
                }
            }

            unit.x = destX;
            unit.y = destY;
            unit.z = (typeof nearestWalkableZ === 'function') ? nearestWalkableZ(destX, destY) : (state.boardHeights?.[destY]?.[destX] ?? 0);
            unit.ap = Math.max(0, (unit.ap || 0) - apCost);
            unit._recallCooldown = cdRounds;

            addLog(`🔵 ${unitDisplayName(unit)} recalls to spawn zone!`);
            showFloatingTextForUnit(unit, '🔵 RECALL', 'buff', { durationMs: 1400 });
            playSfx('uiConfirm');

            /* Emit for online sync */
            if (window._onlineEmitRecall) window._onlineEmitRecall(unit.id);

            state.actionMode = null;
            if (unit.ap <= 0 || unit.dead) state.actionMenuView = 'root';
            state.pendingTarget = null;
            if (unit.ap <= 0) {
                state.selectedUnitId = null;
                state.focusedUnitId = null;
                state.hoverUnitId = null;
                markDirty('board'); markDirty('actions'); renderIfDirty();
                maybeAdvanceTurn();
            } else {
                markDirty('board'); markDirty('actions'); renderIfDirty();
            }
        }

        function triggerEndTurn() {
            /* SIMUL plan phase: END TURN = COMMIT the queued order (an empty
               plan is a legal pass — sometimes holding is the play). */
            if (typeof window._isSimulMode === 'function' && window._isSimulMode()
                && state._simulPhase === 'plan' && !state._simulResolving && window.SimulEngine) {
                window.SimulEngine.commitLocalPlan();
                return;
            }
            const unit = getSelectedUnit();
            if (!unit) {
                addLog('Select a unit first.', typeof getViewerPlayer === 'function' ? getViewerPlayer() : 0);
                return;
            }

            if (_wasdOrigin && !_wasdCommitted) {
                _commitWasdMove(unit);
            }

            if (state._blitzActiveUnitId && unit.id !== state._blitzActiveUnitId) {
                addLog('Not this unit\'s turn.', typeof getViewerPlayer === 'function' ? getViewerPlayer() : 0);
                return;
            }
            pushUndoSnapshot(true);
            unit.ap = 0;
            state.actionMode = null;
            state.actionMenuView = 'root';
            state.pendingTarget = null;
            playSfx('uiConfirm');
            state.selectedUnitId = null;
            state.focusedUnitId = null;
            state.hoverUnitId = null;

            if (window._ewHlCache) { window._ewHlCache = { key: '', map: new Map(), zMap: new Map() }; }
            _hlCacheStore = { key: '', map: new Map() };
            scheduleBoardRender();
            maybeAdvanceTurn();
        }

        function getNexusAtUnit(unit) {
            if (!unit) return null;

            if (state.roamingNexus) {
                const rn = state.roamingNexus;
                const inRoaming = unit.x >= rn.zoneX && unit.x < rn.zoneX + rn.zoneSize &&
                                  unit.y >= rn.zoneY && unit.y < rn.zoneY + rn.zoneSize;
                if (inRoaming) return { section: 'roaming', nexus: rn };
            }
            if (!state.nexusPoints) return null;

            for (const key of Object.keys(state.nexusPoints)) {
                const nex = state.nexusPoints[key];
                if (!nex) continue;
                const inZone = unit.x >= nex.zoneX && unit.x < nex.zoneX + nex.zoneSize &&
                               unit.y >= nex.zoneY && unit.y < nex.zoneY + nex.zoneSize;
                if (inZone) return { section: key, nexus: nex };
            }
            return null;
        }

        function isInNexusZone(x, y, sectionKey) {
            if (!state.nexusPoints) return false;

            if (sectionKey) {
                const nex = state.nexusPoints[sectionKey];
                if (!nex) return false;
                return x >= nex.zoneX && x < nex.zoneX + nex.zoneSize &&
                       y >= nex.zoneY && y < nex.zoneY + nex.zoneSize;
            }

            for (const key of Object.keys(state.nexusPoints)) {
                const nex = state.nexusPoints[key];
                if (!nex) continue;
                if (x >= nex.zoneX && x < nex.zoneX + nex.zoneSize &&
                    y >= nex.zoneY && y < nex.zoneY + nex.zoneSize) return true;
            }
            return false;
        }

        function _nexusLabel(section) {
            return (window.NEXUS_LABELS && window.NEXUS_LABELS[section]) || section;
        }

        /* Shared capture bookkeeping — one code path whether a zone falls to an
           active channel (channelNexus) or to passive presence at round end
           (processNexusIncome). Handles owner flip, mode scoring, fanfare, the
           Nexus-Dominance threat/win checks, and arena sudden death. */
        function _nexusCaptureBookkeeping(nex, section, player, creditUnit) {
            nex.owner = player;
            nex.progress = player === 1 ? NEXUS_CAPTURE_THRESHOLD : -NEXUS_CAPTURE_THRESHOLD;
            const label = _nexusLabel(section);
            const who = creditUnit ? unitDisplayName(creditUnit) : `Player ${player}`;
            const _capMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;

            if (_capMode && _capMode.scoringType === 'domination') {
                const capBonus = _capMode.pointsPerNexusPerRound || 10;
                state.matchScores[player] = (state.matchScores[player] || 0) + capBonus;
                addLog(`⬡ ${who} captures the ${label} Nexus for Player ${player}! +${capBonus} pts (+${capBonus}/round)`);
            } else if (_capMode && _capMode.id === 'arena') {
                if (!state._arenaNexusControl) state._arenaNexusControl = { 1: 0, 2: 0 };
                state._arenaNexusControl[player] = (state._arenaNexusControl[player] || 0) + 3;
                addLog(`⬡ ${who} captures the ${label} Nexus for Player ${player}! (+${NEXUS_GOLD_PER_ROUND}g/round)`);
            } else {
                addLog(`⬡ ${who} captures the ${label} Nexus for Player ${player}! (+${NEXUS_GOLD_PER_ROUND}g/round)`);
            }

            showCombatBanner('⬡ NEXUS CAPTURED!', `${label} Nexus — Player ${player}`, player === getViewerPlayer() ? 'pickup-friendly' : 'pickup-enemy');
            if (creditUnit) {
                showFloatingTextForUnit(creditUnit, '⬡ CAPTURED!', 'streak', { durationMs: 1600 });
                grantXP(creditUnit, 15, 'nexusCapture');
            }
            shakeBoard('normal');
            playSfx('nexusCaptured');

            if (_capMode && _capMode.id === 'arena') {
                // Nexus Dominance track: on 3-zone maps, owning every zone at once
                // is an instant win. Shout the threat at all-but-one.
                const _ndAll = Object.keys(state.nexusPoints || {}).map(k => state.nexusPoints[k]).filter(n => n && n.zoneSize);
                if (_ndAll.length >= 3) {
                    const _ndMine = _ndAll.filter(n => n.owner === player).length;
                    if (_ndMine === _ndAll.length) {
                        if (typeof checkWin === 'function') checkWin();
                    } else if (_ndMine === _ndAll.length - 1 && state._nexusThreatAnnounced !== player) {
                        state._nexusThreatAnnounced = player;
                        addLog(`⬡ Player ${player} controls ${_ndMine} of ${_ndAll.length} Nexus zones — ONE MORE captures the match!`);
                        showCombatBanner('⬡ NEXUS THREAT!', `Player ${player} needs 1 more Nexus to WIN!`, player === getViewerPlayer() ? 'pickup-friendly' : 'pickup-enemy');
                        shakeBoard('hard');
                        playSfx('levelUp');
                    }
                }
                // Arena sudden death: a nexus capture is a score — it wins.
                if (state.suddenDeathActive && !state.winner) {
                    state.winner = player;
                    state._winCondition = 'sudden_death';
                    if (typeof checkWin === 'function') checkWin();
                }
            }
        }

        function channelNexus(unit) {
            if (!unit || unit.dead || (unit.ap || 0) < NEXUS_CHANNEL_COST_AP) {
                addLog('Not enough AP to channel.');
                playErrorSfx();
                return;
            }

            if (typeof isUnitAirborne === 'function' && isUnitAirborne(unit)) {
                addLog('Cannot channel a Nexus while airborne. Land first!');
                playErrorSfx();
                return;
            }
            const nData = getNexusAtUnit(unit);
            if (!nData) {
                addLog('Must be standing in a Nexus zone to channel.');
                playErrorSfx();
                return;
            }
            const nex = nData.nexus;
            const floor = nData.section;

            if (nex.owner === unit.player) {
                addLog('Your team already controls this Nexus.');
                playErrorSfx();
                return;
            }

            pushUndoSnapshot(true);
            spendAP(unit, NEXUS_CHANNEL_COST_AP);

            // Channeling a Nexus is a beacon — it breaks stealth. No capturing
            // objectives from inside a cloak.
            if (typeof unitHasStatus === 'function' && unitHasStatus(unit, 'invisible')) {
                clearStatus(unit, 'invisible');
                addLog(`👁 ${unitDisplayName(unit)} is revealed — channeling breaks camouflage!`);
            }

            _fireNexusVfx3d(unit.player === 1 ? '_nexusChannelP1' : '_nexusChannelP2', unit.x, unit.y);

            const direction = unit.player === 1 ? 1 : -1;
            nex.progress = Math.max(-NEXUS_CAPTURE_THRESHOLD, Math.min(NEXUS_CAPTURE_THRESHOLD, nex.progress + direction));

            const absProgress = Math.abs(nex.progress);
            const progressTeam = nex.progress > 0 ? 1 : nex.progress < 0 ? 2 : 0;

            if (absProgress >= NEXUS_CAPTURE_THRESHOLD && progressTeam === unit.player) {
                if (floor === 'roaming' && typeof _captureRoamingNexus === 'function') {
                    nex.owner = unit.player;
                    _captureRoamingNexus(unit.player);
                    grantXP(unit, 20, 'hotspotCapture');
                } else {
                    _nexusCaptureBookkeeping(nex, floor, unit.player, unit);
                }
            } else if (nex.owner !== 0 && progressTeam !== nex.owner && absProgress < NEXUS_CAPTURE_THRESHOLD) {

                if (nex.progress === 0 || progressTeam !== nex.owner) {
                    const lostOwner = nex.owner;
                    nex.owner = 0;
                    addLog(`⬡ ${unitDisplayName(unit)} neutralizes the ${_nexusLabel(floor)} Nexus!`);
                    showFloatingTextForUnit(unit, '⬡ NEUTRAL', 'damage', { durationMs: 1200 });
                    playSfx('uiConfirm');
                }
            } else {

                const displayProg = unit.player === 1 ? Math.max(0, nex.progress) : Math.max(0, -nex.progress);
                addLog(`⬡ ${unitDisplayName(unit)} channels the ${_nexusLabel(floor)} Nexus (${displayProg}/${NEXUS_CAPTURE_THRESHOLD})`);
                showFloatingTextForUnit(unit, `⬡ ${displayProg}/${NEXUS_CAPTURE_THRESHOLD}`, 'buff', { durationMs: 1200 });
                playSfx('uiConfirm');

                const _pcx = nex.zoneX + Math.floor(nex.zoneSize / 2);
                const _pcy = nex.zoneY + Math.floor(nex.zoneSize / 2);
                _fireNexusVfx3d(unit.player === 1 ? '_nexusProgressP1' : '_nexusProgressP2', _pcx, _pcy);
            }

            state.actionMode = null;

            if (unitFinished(unit) || unit.dead) state.actionMenuView = 'root';
            state.pendingTarget = null;
            endUnitIfDone(unit);
            renderAfterCombat();
        }

        function _fireNexusVfx3d(spellId, tx, ty) {
            if (typeof window === 'undefined' || !window.ThreeVFXEffects) return;
            if (!window.ThreeVFXEffects.hasMapping(spellId, 'aura')) return;
            if (state.phase !== 'battle' || state.animationsDisabled || state.devAutoSim) return;
            window.ThreeVFXEffects.fire('aura', spellId, { tx, ty });
        }

        function processNexusIncome() {
            if (!state.nexusPoints) return;
            const thr = NEXUS_CAPTURE_THRESHOLD;
            for (const section of Object.keys(state.nexusPoints)) {
                const nex = state.nexusPoints[section];
                if (!nex) continue;
                const label = _nexusLabel(section);
                // Cloaked units neither capture nor contest — you can't dispute
                // ground you aren't visibly standing on.
                const _inZone = p => state.units.filter(u => !u.dead && u.player === p &&
                    !(typeof unitHasStatus === 'function' && unitHasStatus(u, 'invisible')) &&
                    isInNexusZone(u.x, u.y, section));
                const p1Units = _inZone(1), p2Units = _inZone(2);
                const contested = p1Units.length > 0 && p2Units.length > 0;

                /* ── Presence capture: boots on the ground move the capture bar
                   every round — 1 unit ticks +1, 2+ units tick +2. Both teams in
                   the zone = CONTESTED (bar frozen, no gold). Standing your ground
                   IS capturing; channeling (1 AP) stacks on top for speed. */
                if (contested) {
                    addLog(`⚔ The ${label} Nexus is CONTESTED — capture frozen, no gold.`);
                } else if (p1Units.length > 0 || p2Units.length > 0) {
                    const team = p1Units.length > 0 ? 1 : 2;
                    if (nex.owner !== team) {
                        const count = team === 1 ? p1Units.length : p2Units.length;
                        const ticks = count >= 2 ? 2 : 1;
                        if (nex.owner !== 0) {
                            // Standing uncontested in the enemy's zone rips it neutral.
                            nex.owner = 0;
                            addLog(`⬡ The ${label} Nexus is neutralized by Player ${team}!`);
                        }
                        const dir = team === 1 ? 1 : -1;
                        nex.progress = Math.max(-thr, Math.min(thr, nex.progress + dir * ticks));
                        const myProg = team === 1 ? Math.max(0, nex.progress) : Math.max(0, -nex.progress);
                        if (myProg >= thr) {
                            _nexusCaptureBookkeeping(nex, section, team, _inZone(team)[0] || null);
                        } else {
                            addLog(`⬡ ${label} Nexus: Player ${team} capturing… ${myProg}/${thr}`);
                        }
                    }
                } else if (nex.owner === 0 && nex.progress !== 0) {
                    // Abandoned half-capture bleeds back toward neutral.
                    nex.progress += nex.progress > 0 ? -1 : 1;
                }

                /* ── Income: an owned, uncontested zone pays the whole team. */
                if (nex.owner > 0 && !contested) {
                    const teamUnits = state.units.filter(u => !u.dead && u.player === nex.owner);
                    for (const u of teamUnits) {
                        u.gold = (u.gold || 0) + NEXUS_GOLD_PER_ROUND;
                    }
                    if (teamUnits.length > 0) {
                        addLog(`⬡ ${label} Nexus generates +${NEXUS_GOLD_PER_ROUND}g for Player ${nex.owner}'s team.`);
                    }
                }
            }
        }

        function processPassiveGoldIncome() {
            for (const u of state.units) {
                if (!u.dead) {
                    u.gold = (u.gold || 0) + GOLD_PASSIVE_PER_ROUND;
                }
            }
        }

        /* ── Sanctuary/Shop functions removed — stubs for backward compat ── */
        function getSanctuariesNearUnit() { return []; }
        function useChurch() {}
        function openShop() {}
        function shopBuyItem() {}
        function shopBuySpell() {}
        window.shopBuySpell = shopBuySpell;
        function shopSwapSpell() {}
        window.shopSwapSpell = shopSwapSpell;


        function usePanacea(unit) {
            if (!unit || unit.dead) return;
            if ((unit.items?.panacea || 0) <= 0) {
                addLog('No Panacea available.');
                playErrorSfx();
                return;
            }

            let hasDebuff = false;
            if (unit.status) {
                for (const key of Object.keys(unit.status)) {
                    const def = STATUS_DEFS[key];
                    if (def && def.kind === 'debuff') { hasDebuff = true; break; }
                }
            }
            if (!hasDebuff) {
                addLog('No negative status effects to cure.');
                playErrorSfx();
                return;
            }
            pushUndoSnapshot(true);
            unit.items.panacea -= 1;
            let cleared = 0;
            for (const key of Object.keys(unit.status)) {
                const def = STATUS_DEFS[key];
                if (def && def.kind === 'debuff') {
                    delete unit.status[key];
                    cleared++;
                }
            }
            addLog(`💊 ${unitDisplayName(unit)} uses Panacea! ${cleared} status effect${cleared > 1 ? 's' : ''} cured.`);
            showFloatingTextForUnit(unit, `💊 CURED`, 'heal', { durationMs: 1200 });
            playSfx('uiConfirm');

            renderAfterCombat();
        }

        // Combat stims: self-use consumables that grant stat stages (ITEM_RULES
        // entries carrying a `selfBoost` map). Costs an action, like a potion.
        function useStimItem(unit, itemKey) {
            if (!unit || unit.dead) return;
            const rule = ITEM_RULES[itemKey];
            if (!rule || !rule.selfBoost) return;
            if ((unit.items?.[itemKey] || 0) <= 0) {
                addLog(`No ${rule.name} left.`);
                playErrorSfx();
                return;
            }
            if (!canUnitAct(unit)) {
                addLog('That unit already acted this round.');
                playErrorSfx();
                return;
            }
            pushUndoSnapshot(true);
            unit.items[itemKey] -= 1;
            applyStatStageBoost(unit, rule.selfBoost, `${rule.name}: `, unit);
            addLog(`${rule.icon} ${unitDisplayName(unit)} uses ${rule.name}!`);
            playSfx('uiConfirm');
            spendAP(unit, AP_COST_ACTION);
            if (!unit._itemLog) unit._itemLog = {};
            unit._itemLog[itemKey] = (unit._itemLog[itemKey] || 0) + 1;
            state.actionMode = null;
            state.selectedTool = null;
            state.pendingTarget = null;
            // Stay in the Items submenu only if the stim was used FROM it
            // (clock-slot uses fire from root) and something is still usable.
            state.actionMenuView = (!unitFinished(unit) && !unit.dead
                && state.actionMenuView === 'items'
                && typeof anyUsableItemNow === 'function' && anyUsableItemNow(unit)) ? 'items' : 'root';
            endUnitIfDone(unit);
            renderAfterCombat();
        }

        function initiateWarpStone(unit) {
            if (!unit || unit.dead) return;
            if ((unit.items?.warpStone || 0) <= 0) {
                addLog('No Warp Stone available.');
                playErrorSfx();
                return;
            }
            state.actionMode = 'warpStone';
            state.selectedTool = 'warpStone';
            addLog('Select a tile within 3 range to warp to.');
            renderAfterCombat();
        }

        function executeWarpStone(unit, x, y) {
            if (!unit || unit.dead || (unit.items?.warpStone || 0) <= 0) return;
            const dist = Math.abs(unit.x - x) + Math.abs(unit.y - y);
            if (dist < 1 || dist > 3) {
                addLog('Target must be within 3 tiles.');
                playErrorSfx();
                return;
            }

            const terrain = state.boardTerrain;
            if (!terrain) return;
            const tileType = terrain[y]?.[x];
            const rule = TERRAIN_RULES[tileType];
            if (!rule || rule.passable === false) {
                addLog('Cannot warp to impassable terrain.');
                playErrorSfx();
                return;
            }
            if (unitAt(x, y)) {
                addLog('Tile is occupied.');
                playErrorSfx();
                return;
            }
            pushUndoSnapshot(true);
            unit.items.warpStone -= 1;
            unit.x = x;
            unit.y = y;
            addLog(`🌀 ${unitDisplayName(unit)} warps to ${coordLabel(x, y)}!`);
            showFloatingTextForUnit(unit, '🌀 WARP', 'buff', { durationMs: 1000 });
            playSfx('uiConfirm');

            state.actionMode = null;
            state._actionExecuting = false;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            state.pendingTarget = null;
            renderAfterCombat();
        }

        function doFlair(unit, x, y) {
            /* SIMUL: flairs execute instantly — not plannable yet. */
            if (typeof window._isSimulMode === 'function' && window._isSimulMode()
                && state._simulPhase === 'plan' && !state._simulResolving) {
                addLog('🎇 Flairs are not available in Simul mode (yet).');
                playErrorSfx();
                return;
            }
            if (!unit || !canUnitAct(unit)) {
                addLog('That unit cannot act.');
                return;
            }
            if (!unitHasFlair(unit)) {
                addLog('No Flair accessory equipped.');
                playErrorSfx();
                return;
            }
            if (unit._usedFlair) {
                addLog('Flair already used.');
                playErrorSfx();
                return;
            }

            const d = Math.abs(unit.x - x) + Math.abs(unit.y - y);
            if (d > 8) {
                addLog('Target tile is out of flare range.');
                playErrorSfx();
                return;
            }

            if (state.fogOfWar && !state.autoPlayers?.[unit.player]) {
                const vis = computeVisibleTiles(unit.player);
                if (vis.has(posKey(x, y))) {
                    addLog('Flair must be fired into the fog — that tile is already visible.');
                    playErrorSfx();
                    return;
                }
            }
            pushUndoSnapshot(true);
            unit._usedFlair = true;
            removeAccessoryFromUnit(unit, 'flair');
            const flairRadius = 6;
            const size = bw(),
                sizeH = bh();
            const revealed = new Set();
            for (let dy2 = -flairRadius; dy2 <= flairRadius; dy2++) {
                for (let dx2 = -flairRadius; dx2 <= flairRadius; dx2++) {
                    const tx = x + dx2,
                        ty = y + dy2;
                    if (tx < 0 || ty < 0 || tx >= size || ty >= sizeH) continue;
                    if ((Math.abs(dx2) + Math.abs(dy2)) <= flairRadius) revealed.add(posKey(tx, ty));
                }
            }
            if (!state._flairRevealTiles) state._flairRevealTiles = {
                1: null,
                2: null
            };
            state._flairRevealTiles[unit.player] = revealed;
            unit._flairExpiresRound = (state.round || 0) + 1;
            playSfx('uiConfirm');
            focusBoardCameraOnTiles([{
                x,
                y
            }], {
                zoom: computeZoomForVisibleTiles(14),
                holdMs: 1200
            });
            addLog(`🔥 ${unitDisplayName(unit)} fires a Flair at ${coordLabel(x, y)}! A wide area is illuminated for one turn.`, unit.player);
            spendAP(unit, AP_COST_ACTION);
            state.actionMode = null;
            state._actionExecuting = false;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            state.pendingTarget = null;
            endUnitIfDone(unit);
            renderAfterMinorAction();
        }

        function doWard(unit, x, y) {
            /* SIMUL: wards execute instantly — not plannable yet. */
            if (typeof window._isSimulMode === 'function' && window._isSimulMode()
                && state._simulPhase === 'plan' && !state._simulResolving) {
                addLog('👁 Wards are not available in Simul mode (yet).');
                playErrorSfx();
                return;
            }
            if (!unit || !canUnitAct(unit)) {
                addLog('That unit cannot act.');
                return;
            }
            if (!unitHasWard(unit)) {
                addLog('No Ward accessory equipped.');
                playErrorSfx();
                return;
            }
            if (unit._usedWard) {
                addLog('Ward already used.');
                playErrorSfx();
                return;
            }
            /* 🧱 Minecraft-style wall placement: clicking the SIDE FACE of a
               raised cube redirects the ward to the open tile in front of that
               face and remembers which wall it hangs on (wallD4: 0=N 1=E 2=S
               3=W) so the renderer draws it wall-mounted. The pick comes from
               the canvas raycast (window._ewLastPick, three-renderer.js) and
               only applies when it matches the exact tile this call targets —
               menu-driven and AI placements are unaffected. */
            let wallD4 = null;
            const _pick = (typeof window !== 'undefined') ? window._ewLastPick : null;
            if (_pick && _pick.isSideFace && _pick.isTerrainHit && _pick.tileX === x && _pick.tileY === y
                && _pick.sideTileX != null && !state.autoPlayers?.[unit.player]
                && typeof isInside === 'function' && isInside(_pick.sideTileX, _pick.sideTileY)
                && typeof getBaseHeightAt === 'function'
                && getBaseHeightAt(x, y) > getBaseHeightAt(_pick.sideTileX, _pick.sideTileY)) {
                const _dx = x - _pick.sideTileX, _dy = y - _pick.sideTileY;
                wallD4 = (_dy === -1) ? 0 : (_dx === 1) ? 1 : (_dy === 1) ? 2 : 3;
                x = _pick.sideTileX;
                y = _pick.sideTileY;
            }
            const d = Math.abs(unit.x - x) + Math.abs(unit.y - y);
            if (d > 3) {
                addLog('Target tile is out of ward range.');
                playErrorSfx();
                return;
            }
            if (!isTerrainPassable(x, y)) {
                addLog('Cannot place a ward on impassable terrain.');
                playErrorSfx();
                return;
            }
            if (state.wards.some(w => w.x === x && w.y === y)) {
                addLog('There is already a Ward on this tile.');
                playErrorSfx();
                return;
            }
            pushUndoSnapshot(true);
            unit._usedWard = true;
            removeAccessoryFromUnit(unit, 'ward');
            if (!state.wards) state.wards = [];
            state.wards.push({
                x,
                y,
                owner: unit.player,
                visionRange: 3,
                placedBy: unit.id,
                /* non-null when hung on a neighbouring cube face (0=N 1=E 2=S 3=W) */
                wallD4
            });

            if (window.RenderBus) window.RenderBus.emit('fog:dirty', {});
            playSfx('uiConfirm');
            addLog(`👁 ${unitDisplayName(unit)} plants a Vision Ward at ${coordLabel(x, y)}. It reveals a 3-tile radius until destroyed.`, unit.player);
            spendAP(unit, AP_COST_ACTION);
            state.actionMode = null;
            state._actionExecuting = false;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            state.pendingTarget = null;
            endUnitIfDone(unit);
            renderAfterMinorAction();
        }

        function showFloorTransitionBanner() {}
        function doFloorTransition() {}
        function doFlyTransition() {}
        function viewFloor() {}

        function restoreHoverFocus() {
            state.hoverUnitId = null;
            const fallbackId = state.selectedUnitId || null;
            if (state.focusedUnitId !== fallbackId) {
                state.focusedUnitId = fallbackId;
            }
            renderSelectedUnitPanel();
            renderTeams();
        }

        function renderButtons() {
            const unit = getSelectedUnit();
            const controllableUnit = unit && unit.player === state.activePlayer;
            const humanTurn = !state.autoPlayers?.[state.activePlayer];
            const startBtn = document.getElementById('startBattle');
            const startBtn2 = document.getElementById('startBattle2');
            const lockBtn = document.getElementById('rebuildTeams');
            const lockBtn2 = document.getElementById('rebuildTeams2');
            const canStart = state.phase === 'setup' && state.teamLockedIn;
            if (startBtn) {
                startBtn.disabled = false;
                if (!state.teamLockedIn && state.phase === 'setup') {
                    startBtn.textContent = '✅ Ready Up';
                    startBtn.title = 'Lock in your team and get ready to fight';
                } else if (state.teamLockedIn && state.phase === 'setup') {
                    startBtn.textContent = '⚔ FIGHT';
                    startBtn.title = 'Start the battle!';
                }
            }
            if (startBtn2) {
                startBtn2.disabled = false;
                if (!state.teamLockedIn && state.phase === 'setup') {
                    startBtn2.textContent = '✅ Ready Up';
                    startBtn2.title = 'Lock in your team and get ready to fight';
                } else if (state.teamLockedIn && state.phase === 'setup') {
                    startBtn2.textContent = '⚔ FIGHT';
                    startBtn2.title = 'Start the battle!';
                }
            }
            if (lockBtn) lockBtn.textContent = state.teamLockedIn ? '✓ Locked In' : 'Lock In Team';
            if (lockBtn2) lockBtn2.textContent = state.teamLockedIn ? '✓ Locked In' : 'Lock In Team';
            if (autoBtn) {
                autoBtn.disabled = !(state.phase === 'battle' && !state.winner && !state.devAutoSim);
                autoBtn.textContent = state.autoPlayers?.[1] ? 'Auto: On' : 'Auto: Off';
            }
            const devAutoSimBtn = document.getElementById('devAutoSimBtn');
            if (devAutoSimBtn) {
                if (!ONLINE_RULES.devSimAllowed) {
                    devAutoSimBtn.style.display = 'none';
                } else devAutoSimBtn.textContent = `Dev Auto Sim: ${state.devAutoSim ? 'On' : 'Off'} · x${getDevSimSpeedMultiplier()}`;
            }
            const devSimBattleBtn = document.getElementById('devSimBattleBtn');
            if (devSimBattleBtn) {
                if (!ONLINE_RULES.devSimAllowed) {
                    devSimBattleBtn.style.display = 'none';
                } else {
                    devSimBattleBtn.textContent = `Dev Sim: ${state.devAutoSim ? 'On' : 'Off'} · x${getDevSimSpeedMultiplier()}`;
                    devSimBattleBtn.classList.toggle('active', !!state.devAutoSim);
                }
            }
            ['1', '2', '4'].forEach(speed => {
                const active = getDevSimSpeedMultiplier() === Number(speed);
                [`devSimSpeed${speed}Btn`, `devSimBattleSpeed${speed}Btn`].forEach(id => {
                    const btn = document.getElementById(id);
                    if (btn) {
                        if (!ONLINE_RULES.devSimAllowed) btn.style.display = 'none';
                        else btn.classList.toggle('active', active);
                    }
                });
            });
            if (forfeitBtn) {
                forfeitBtn.disabled = !(state.phase === 'battle' && !state.winner);
            }

            if (isOnlineMatch()) {
                const lock = window._NET._lockState || {
                    host: false,
                    guest: false,
                    guestPartyReceived: false
                };
                const me = getLocalPlayer();

                if (state.phase === 'setup') {
                    const myLocked = _isHost() ? lock.host : lock.guest;

                    if (lockBtn) {
                        lockBtn.textContent = myLocked ? '✓ Locked In' : 'Lock In Team';
                        lockBtn.disabled = myLocked;
                    }
                    if (lockBtn2) {
                        lockBtn2.textContent = myLocked ? '✓ Locked In' : 'Lock In Team';
                        lockBtn2.disabled = myLocked;
                    }

                    if (_isHost()) {
                        if (!lock.host) {

                            if (startBtn) {
                                startBtn.disabled = false;
                                startBtn.textContent = '✅ Ready Up';
                                startBtn.title = 'Lock in your team';
                            }
                            if (startBtn2) {
                                startBtn2.disabled = false;
                                startBtn2.textContent = '✅ Ready Up';
                                startBtn2.title = 'Lock in your team';
                            }
                        } else {
                            const canStartOnline = lock.host && lock.guestPartyReceived;
                            if (startBtn) {
                                startBtn.disabled = !canStartOnline;
                                startBtn.title = !lock.guestPartyReceived ? 'Waiting for Player 2 to lock in' : '';
                                startBtn.textContent = !lock.guestPartyReceived ? 'Waiting for P2…' : '⚔ FIGHT';
                            }
                            if (startBtn2) {
                                startBtn2.disabled = !canStartOnline;
                                startBtn2.title = startBtn ? startBtn.title : '';
                                startBtn2.textContent = startBtn ? startBtn.textContent : '⚔ FIGHT';
                            }
                        }
                    } else {

                        if (startBtn) {
                            startBtn.disabled = lock.guest;
                            startBtn.textContent = lock.guest ? '✓ Sent to Host' : '✅ Ready Up';
                        }
                        if (startBtn2) {
                            startBtn2.disabled = lock.guest;
                            startBtn2.textContent = startBtn ? startBtn.textContent : '✅ Ready Up';
                        }
                    }
                }

                if (autoBtn && state.phase === 'battle') {
                    autoBtn.textContent = state.autoPlayers?.[me] ? 'Auto: On' : 'Auto: Off';
                }

                if (_isGuest()) {
                    const s1 = document.getElementById('gameModeSelectSetup');
                    const s2 = document.getElementById('gameModeSelect');
                    if (s1) {
                        s1.disabled = true;
                        s1.title = 'Only the host can change map size';
                    }
                    if (s2) {
                        s2.disabled = true;
                        s2.title = 'Only the host can change map size';
                    }
                }
            }
        }

        function renderScreenMode() {
            const appEl = document.querySelector('.app');
            appEl.classList.toggle('setup-mode', state.phase === 'setup');
            appEl.classList.toggle('battle-mode', state.phase === 'battle');

            if (startOverlay) {
                startOverlay.classList.toggle('hidden', !state.titleScreenVisible);
                if (!state.titleScreenVisible) {
                    startOverlay.style.display = 'none';
                    startOverlay.style.pointerEvents = 'none';
                } else {
                    startOverlay.style.display = '';
                    startOverlay.style.pointerEvents = '';
                }
            }

            const builderOv = document.getElementById('builderOverlay');
            const mapRow = document.getElementById('mapRow');
            const isEditor = state.phase === 'editor';
            if (builderOv) builderOv.style.display = (state.phase === 'setup' && !isEditor) ? '' : 'none';
            if (mapRow) mapRow.style.display = (state.phase === 'battle' || isEditor) ? '' : 'none';

            if (state.phase === 'battle') {
                const sideHg = document.querySelector('#sidebarPanel .small-team-score');
                if (sideHg) sideHg.style.display = '';
                const sideHead = document.querySelector('#sidebarPanel .compact-head h2');
                if (sideHead) sideHead.textContent = 'Player 1';
                const ctrlHg = document.querySelector('#controlPanel .small-team-score');
                if (ctrlHg) ctrlHg.style.display = '';
                const ctrlHead = document.querySelector('#controlPanel .compact-head h2');
                if (ctrlHead) ctrlHead.textContent = 'Player 2';
                const ctrlBtns = document.querySelector('#controlPanel .control-stack > .buttons');
                if (ctrlBtns) ctrlBtns.style.display = '';

                ensureBattleHUD();

            }
        }

        function renderInfoPanel() {

            renderEnemyRoster();
        }

        let _logRenderedCount = 0;

        function renderLog() {
            const lines = state.logEntries || [];
            if (!logEl) return;

            const filtered = (ONLINE_RULES.active || state.fogOfWar) ?
                lines.filter(e => _logVisible(e)) :
                lines;
            const recent = filtered;

            const alreadyRendered = _logRenderedCount;
            const totalToRender = recent.length;
            if (alreadyRendered === 0 || totalToRender < alreadyRendered || logEl.children.length === 0) {

                logEl.innerHTML = recent.map((entry, idx) => {
                    const age = recent.length - 1 - idx;
                    const opacity = Math.max(0.34, 1 - age * 0.04);
                    return `<div class="chat-line" style="opacity:${opacity}">${formatCombatLogLine(_logMsg(entry))}</div>`;
                }).join('');
                _logRenderedCount = totalToRender;
            } else if (totalToRender > alreadyRendered) {

                const newLines = recent.slice(alreadyRendered);

                const frag = document.createDocumentFragment();
                for (const entry of newLines) {
                    const div = document.createElement('div');
                    div.className = 'chat-line';
                    div.style.opacity = '1';
                    div.innerHTML = formatCombatLogLine(_logMsg(entry));
                    frag.appendChild(div);
                }
                logEl.appendChild(frag);
                _logRenderedCount = totalToRender;
            }
            logEl.scrollTop = logEl.scrollHeight;

            renderFloatCombatLog();

            if (!(state.battleDialogueQueue && state.battleDialogueQueue.length > 0)) {
                _renderDialogueBox(null);
            }
        }

        function renderUiDialog() {
            const overlay = document.getElementById('uiDialogOverlay');
            const card = document.getElementById('uiDialogCard');
            if (!overlay || !card) return;
            const dialog = state.uiDialog;
            /* onclick is (re)assigned per dialog type below; onchange is only
               used by the Mystery Dungeon party picker — always reset it so a
               stale handler never leaks into the next dialog. */
            card.onchange = null;
            if (!dialog) {
                overlay.classList.add('hidden');
                overlay.setAttribute('aria-hidden', 'true');
                card.innerHTML = '';
                card.onclick = null;
                return;
            }
            overlay.classList.remove('hidden');
            overlay.setAttribute('aria-hidden', 'false');

            /* ── Mystery Dungeon: stairs confirm ─────────────────────────────
               A real two-button choice (hover/press feedback via .pickup-btn)
               instead of a passive banner — this IS a button, click it. */
            if (dialog.type === 'mdStairs') {
                const nextFloor = (dialog.floor || 1) + 1;
                card.innerHTML = `
          <div class="pickup-dialog">
            <div class="pickup-icon pickup-icon-text">🪜</div>
            <div class="pickup-title">${dialog.last ? 'The final stairs!' : 'Stairs found!'}</div>
            <div class="pickup-flavor">${dialog.last
                ? 'This staircase leads out of the dungeon. Take it to finish the run victorious!'
                : `These stairs descend to Floor ${nextFloor} of ${dialog.total}. Your whole party goes down together — HP and MP carry over.`}</div>
            <div class="pickup-choices">
              <button class="pickup-btn pickup-btn-take" data-dialog-action="primary">
                <span class="pickup-btn-icon">⬇</span>
                <span class="pickup-btn-text">
                  <strong>${dialog.last ? 'Finish the run' : 'Descend to Floor ' + nextFloor}</strong>
                  <small>${dialog.last ? 'Claim your reward' : 'Leave this floor behind'}</small>
                </span>
              </button>
              <button class="pickup-btn pickup-btn-leave" data-dialog-action="secondary">
                <span class="pickup-btn-icon">✕</span>
                <span class="pickup-btn-text">
                  <strong>Not yet</strong>
                  <small>Keep exploring — use the ⬇ DESCEND button up top when ready</small>
                </span>
              </button>
            </div>
          </div>`;
                card.onclick = function(e) {
                    const btn = e.target.closest('[data-dialog-action]');
                    if (!btn) return;
                    if (btn.getAttribute('data-dialog-action') === 'primary') handleUiDialogPrimary();
                    else handleUiDialogSecondary();
                };
                return;
            }

            /* ── Mystery Dungeon: pre-run party / loadout picker ───────────── */
            if (dialog.type === 'mdParty') {
                const sel = state._mdPartySel;
                if (!sel) { state.uiDialog = null; overlay.classList.add('hidden'); card.onclick = null; return; }
                const jobs = (typeof CLASS_TEMPLATES !== 'undefined') ? Object.keys(CLASS_TEMPLATES) : [];
                const jobOpts = cur => jobs.map(j =>
                    `<option value="${escapeHtml(j)}"${j === cur ? ' selected' : ''}>${escapeHtml(j)}</option>`).join('');
                const raceLabel = rk => {
                    try { if (typeof RACE_PROFILES !== 'undefined' && RACE_PROFILES[rk] && RACE_PROFILES[rk].label) return RACE_PROFILES[rk].label; } catch (e) {}
                    return String(rk || '').replace(/\b\w/g, c => c.toUpperCase());
                };
                const picked = 1 + sel.options.filter(o => o.on).length;
                const rows = sel.options.map((o, i) => `
              <div class="md-party-row${o.on ? ' on' : ''}" data-md-party-toggle="${i}">
                <span class="md-party-check">${o.on ? '✓' : ''}</span>
                <span class="md-party-name">${escapeHtml(raceLabel(o.race))}</span>
                <select class="md-party-job" data-md-party-job="${i}">${jobOpts(o.job)}</select>
              </div>`).join('');
                card.innerHTML = `
          <div class="md-party-dialog">
            <div class="ui-dialog-kicker">🗝️ Agartha Depths — 10 floors, no respawns</div>
            <div class="ui-dialog-title">Assemble Your Party</div>
            <div class="ui-dialog-subtitle">Take up to 4 delvers and pick each one's job (spells &amp; items auto-kit to it).<br>Companions fight on <b>⚔ AUTO</b> — tap their chip on the floor badge in battle to switch tactics.</div>
            <div class="md-party-list">
              <div class="md-party-row leader on">
                <span class="md-party-check">👑</span>
                <span class="md-party-name">${escapeHtml(sel.leader.name || raceLabel(sel.leader.race))} <small>(you)</small></span>
                <select class="md-party-job" data-md-party-leader-job="1">${jobOpts(sel.leader.job)}</select>
              </div>
              ${rows || '<div class="md-party-empty">No companions in the guild yet — clear floors to recruit allies!</div>'}
            </div>
            <div class="md-party-count">${picked} / 4 delvers</div>
            <div class="pickup-choices">
              <button class="pickup-btn pickup-btn-take" data-dialog-action="primary">
                <span class="pickup-btn-icon">🗝</span>
                <span class="pickup-btn-text"><strong>Enter the Dungeon</strong><small>Floor 1 awaits</small></span>
              </button>
              <button class="pickup-btn pickup-btn-leave" data-dialog-action="secondary">
                <span class="pickup-btn-icon">➜</span>
                <span class="pickup-btn-text"><strong>Not yet</strong><small>Stay in the Guild Hub</small></span>
              </button>
            </div>
          </div>`;
                card.onclick = function(e) {
                    if (e.target.closest('select')) return;   // job dropdowns handle themselves
                    const tog = e.target.closest('[data-md-party-toggle]');
                    if (tog) {
                        if (window._mdPartyToggle) window._mdPartyToggle(parseInt(tog.getAttribute('data-md-party-toggle'), 10));
                        return;
                    }
                    const btn = e.target.closest('[data-dialog-action]');
                    if (!btn) return;
                    if (btn.getAttribute('data-dialog-action') === 'primary') handleUiDialogPrimary();
                    else handleUiDialogSecondary();
                };
                card.onchange = function(e) {
                    const jobSel = e.target.closest('[data-md-party-job]');
                    if (jobSel) {
                        if (window._mdPartyJob) window._mdPartyJob(parseInt(jobSel.getAttribute('data-md-party-job'), 10), jobSel.value);
                        return;
                    }
                    if (e.target.closest('[data-md-party-leader-job]')) {
                        if (window._mdPartyLeaderJob) window._mdPartyLeaderJob(e.target.value);
                    }
                };
                return;
            }

            /* ── Generic confirm (forfeit, any irreversible click) ──────────
               state.uiDialog = { type:'confirm', icon, title, text,
                 confirmLabel/confirmIcon/confirmSub, cancelLabel/cancelSub,
                 onConfirm, onCancel } — reuses the pickup-dialog styling. */
            if (dialog.type === 'confirm') {
                card.innerHTML = `
          <div class="pickup-dialog">
            <div class="pickup-icon pickup-icon-text">${escapeHtml(dialog.icon || '⚠')}</div>
            <div class="pickup-title">${escapeHtml(dialog.title || 'Are you sure?')}</div>
            ${dialog.text ? `<div class="pickup-flavor">${escapeHtml(dialog.text)}</div>` : ''}
            <div class="pickup-choices">
              <button class="pickup-btn pickup-btn-take" data-dialog-action="primary">
                <span class="pickup-btn-icon">${escapeHtml(dialog.confirmIcon || '✓')}</span>
                <span class="pickup-btn-text"><strong>${escapeHtml(dialog.confirmLabel || 'Confirm')}</strong>${dialog.confirmSub ? `<small>${escapeHtml(dialog.confirmSub)}</small>` : ''}</span>
              </button>
              <button class="pickup-btn pickup-btn-leave" data-dialog-action="secondary">
                <span class="pickup-btn-icon">✕</span>
                <span class="pickup-btn-text"><strong>${escapeHtml(dialog.cancelLabel || 'Cancel')}</strong>${dialog.cancelSub ? `<small>${escapeHtml(dialog.cancelSub)}</small>` : ''}</span>
              </button>
            </div>
          </div>`;
                card.onclick = function(e) {
                    const btn = e.target.closest('[data-dialog-action]');
                    if (!btn) return;
                    if (btn.getAttribute('data-dialog-action') === 'primary') handleUiDialogPrimary();
                    else handleUiDialogSecondary();
                };
                return;
            }

            if (dialog.type === 'pickupDecision') {
                const unit = state.units.find(u => u.id === dialog.unitId) || null;
                const coord = coordLabel(dialog.event?.x, dialog.event?.y);
                const isHourglass = dialog.event?.kind === 'hiddenHourglass';
                const lootIcon = isHourglass ? '⏳' : '?';
                const flavorText = isHourglass ?
                    'A faint shimmer ripples across the ground. Something ancient is buried here.' :
                    'Something is hidden here. Do you want to stop and find out what it is?';

                card.innerHTML = `
          <div class="pickup-dialog">
            <div class="pickup-icon${isHourglass ? '' : ' pickup-icon-text'}">${lootIcon}</div>
            <div class="pickup-title">${escapeHtml(unitDisplayName(unit))} found something at ${coord}.</div>
            <div class="pickup-flavor">${flavorText}</div>
            <div class="pickup-choices">
              <button class="pickup-btn pickup-btn-take" data-dialog-action="primary">
                <span class="pickup-btn-icon">✦</span>
                <span class="pickup-btn-text">
                  <strong>Claim it</strong>
                  <small>Stop here and collect the find</small>
                </span>
              </button>
              <button class="pickup-btn pickup-btn-leave" data-dialog-action="secondary">
                <span class="pickup-btn-icon">➜</span>
                <span class="pickup-btn-text">
                  <strong>Leave it</strong>
                  <small>Continue moving along your path</small>
                </span>
              </button>
            </div>
          </div>`;
                card.onclick = function(e) {
                    const btn = e.target.closest('[data-dialog-action]');
                    if (!btn) return;
                    const action = btn.getAttribute('data-dialog-action');
                    if (action === 'primary') handleUiDialogPrimary();
                    else if (action === 'secondary') handleUiDialogSecondary();
                };
                return;
            }

            if (dialog.type === 'secondaryJobPick') {
                const unit = state.units.find(u => u.id === dialog.unitId) || null;
                if (!unit) { state.uiDialog = null; overlay.classList.add('hidden'); return; }
                const mainJob = unit.job || unit.cls;
                const allJobs = typeof JOB_MODIFIERS !== 'undefined' ? Object.keys(JOB_MODIFIERS) : [];
                const eligible = allJobs.filter(j => j !== mainJob);

                const jobIcons = {
                    'Warrior': '⚔', 'Tank': '🛡', 'Gunslinger': '🔫', 'Black Mage': '🔥', 'White Mage': '✝',
                    'Agent': '🗡', 'Psychic': '🔮', 'Harvester': '🌿', 'Engineer': '🔧',
                    'Harbinger': '🎵', 'Freelancer': '🃏', 'Raider': '☠', 'Sniper': '🎯',
                    'Swordmaster': '⚔'
                };

                const jobCards = eligible.map(job => {
                    const icon = jobIcons[job] || '⚔';
                    const learnOrder = typeof CLASS_SPELL_LEARN_ORDER !== 'undefined' ? CLASS_SPELL_LEARN_ORDER[job] : [];
                    const firstSpell = learnOrder?.[0] ? getSpellById(learnOrder[0]) : null;
                    const spellName = firstSpell?.name || '—';
                    return `<button class="sec-job-btn" onclick="event.stopPropagation(); handleSecondaryJobSelect('${escapeHtml(job)}')">
                        <span class="sec-job-icon">${icon}</span>
                        <span class="sec-job-info">
                            <strong>${escapeHtml(job)}</strong>
                            <small>✨ ${escapeHtml(spellName)}</small>
                        </span>
                    </button>`;
                }).join('');

                card.innerHTML = `
                    <div class="ui-dialog-kicker">🎭 Level 4 — Choose Secondary Job</div>
                    <div class="ui-dialog-title">${escapeHtml(unitDisplayName(unit))}</div>
                    <div class="ui-dialog-subtitle">Pick a secondary class. You'll gain its first spell.<br><em>This choice is permanent!</em></div>
                    <div class="sec-job-grid">${jobCards}</div>`;
                card.onclick = null;
                return;
            }

            if (dialog.type === 'itemFound') {
                const unit = state.units.find(u => u.id === dialog.unitId) || null;
                if (!unit) { state.uiDialog = null; overlay.classList.add('hidden'); return; }
                const pending = dialog.foundItems.filter(fi => !fi._ref.collectedBy);
                const nextItem = pending[0];
                const nextRule = nextItem ? ITEM_RULES[nextItem.type] : null;
                const nextIcon = nextItem ? getItemIconHtml(nextItem.type, 32) : '📦';

                const invRows = Object.entries(ITEM_RULES).map(([k, rule]) => {
                    const count = unit.items?.[k] || 0;
                    if (count <= 0) return '';
                    const iconHtml = getItemIconHtml(k, 20);
                    return `<div class="ui-dialog-item-row">
                        <span style="display:flex;align-items:center;gap:4px">${iconHtml} <strong>${rule.name}</strong> ×${count}</span>
                        <button class="pickup-btn pickup-btn-leave" style="padding:4px 10px;font-size:11px" onclick="event.stopPropagation(); itemFoundDiscard('${unit.id}','${k}')">Drop 1</button>
                    </div>`;
                }).filter(Boolean).join('');

                card.innerHTML = `
                    <div class="pickup-dialog">
                        <div class="pickup-icon pickup-icon-text">${nextIcon}</div>
                        <div class="pickup-title">Inventory Full!</div>
                        <div class="pickup-flavor">${escapeHtml(unitDisplayName(unit))} found <strong>${nextRule?.name || '???'}</strong> but is carrying ${CONFIG.unitItemSlots} items. Drop something to make room.</div>
                        <div class="ui-dialog-panel" style="margin:8px 0">
                            <div class="ui-dialog-panel-title">Current Inventory (${getTotalItemCount(unit)}/${CONFIG.unitItemSlots})</div>
                            ${invRows || '<div style="padding:8px;color:var(--muted);font-size:12px">No items</div>'}
                        </div>
                        <div class="ui-dialog-actions">
                            <button class="pickup-btn pickup-btn-leave" onclick="event.stopPropagation(); itemFoundSkip()" style="padding:8px 20px">
                                <span class="pickup-btn-text"><strong>Leave on Ground</strong></span>
                            </button>
                        </div>
                    </div>`;
                card.onclick = null;
                return;
            }

            /* Shop dialog removed — spawn zone system replaces it */


            if (dialog.type === 'trade') {
                const source = state.units.find(u => u.id === dialog.sourceId) || null;
                const target = state.units.find(u => u.id === dialog.targetId) || null;
                if (!source || !target) {
                    state.uiDialog = null;
                    overlay.classList.add('hidden');
                    return;
                }

                const stg = dialog.staged;
                const tradeRows = [{
                        key: 'hourglass',
                        icon: '⏳',
                        name: 'Hourglass',
                        srcCount: stg.srcHourglasses,
                        tgtCount: stg.tgtHourglasses,
                        srcOrig: source.hourglasses || 0,
                        tgtOrig: target.hourglasses || 0,
                        canGive: stg.srcHourglasses > 0,
                        canTake: stg.tgtHourglasses > 0
                    },
                    ...Object.entries(ITEM_RULES).map(([k, rule]) => ({
                        key: k,
                        icon: getItemIconHtml(k, 24),
                        name: rule.name,
                        srcCount: stg.srcItems[k] || 0,
                        tgtCount: stg.tgtItems[k] || 0,
                        srcOrig: source.items?.[k] || 0,
                        tgtOrig: target.items?.[k] || 0,
                        canGive: (stg.srcItems[k] || 0) > 0 && (stg.tgtItems[k] || 0) < getItemCapForClass(target.cls, k),
                        canTake: (stg.tgtItems[k] || 0) > 0 && (stg.srcItems[k] || 0) < getItemCapForClass(source.cls, k)
                    })).filter(row => row.srcOrig > 0 || row.tgtOrig > 0 || row.srcCount > 0 || row.tgtCount > 0)
                ];

                function countBadge(current, original) {
                    const diff = current - original;
                    if (diff > 0) return `<span style="color:var(--green);font-size:11px;font-weight:700;margin-left:4px">+${diff}</span>`;
                    if (diff < 0) return `<span style="color:var(--red);font-size:11px;font-weight:700;margin-left:4px">${diff}</span>`;
                    return '';
                }

                function buildUnitHeader(unit, side) {
                    const hpPct = Math.max(0, Math.min(100, (unit.hp / unit.maxHp) * 100));
                    const mpPct = unit.maxMp > 0 ? Math.max(0, Math.min(100, (unit.mp / unit.maxMp) * 100)) : 0;
                    const sideLabel = side === 'source' ? 'Acting Unit' : 'Trade Partner';
                    return `
            <div class="trade-unit-header ${side}">
              <div class="trade-inv-label">${sideLabel}</div>
              <div class="trade-unit-top">
                <div style="width:64px;height:64px;background-image:url('${getUnitSprite(unit.cls, unit.player, unit)}');background-size:contain;background-position:center;background-repeat:no-repeat;image-rendering:pixelated"></div>
                <div class="trade-unit-info">
                  <div class="trade-unit-name">${escapeHtml(unitDisplayName(unit))}</div>
                  <div class="trade-unit-meta">${escapeHtml(getJobDisplayName(unit.cls))} · ${coordLabel(unit.x, unit.y)}</div>
                  <div class="trade-unit-bars">
                    <div class="trade-bar"><div class="trade-bar-fill-hp" style="width:${hpPct}%"></div></div>
                    <div class="trade-bar"><div class="trade-bar-fill-mp" style="width:${mpPct}%"></div></div>
                  </div>
                </div>
              </div>
            </div>`;
                }

                function buildSlot(row, side) {
                    const count = side === 'source' ? row.srcCount : row.tgtCount;
                    const orig = side === 'source' ? row.srcOrig : row.tgtOrig;
                    const changed = count !== orig;
                    return `
            <div class="trade-inv-slot${changed ? ' trade-changed' : ''}">
              <div class="trade-inv-icon">${row.icon}</div>
              <div class="trade-inv-detail">
                <div class="trade-inv-name">${escapeHtml(row.name)}</div>
                <div class="trade-inv-sub">${row.key === 'hourglass' ? 'Carried' : 'Equipped'}</div>
              </div>
              <div class="trade-inv-count${count === 0 ? ' zero' : ''}">${count}${countBadge(count, orig)}</div>
            </div>`;
                }

                let itemRowsHtml = '';
                for (const row of tradeRows) {
                    itemRowsHtml += `
            <div class="trade-item-row">
              ${buildSlot(row, 'source')}
              <div class="trade-arrow-pair">
                <button class="trade-arrow-btn${row.canGive ? '' : ' disabled'}" data-trade-stage="give_${row.key}" title="Give ${row.name} →">→</button>
                <button class="trade-arrow-btn${row.canTake ? '' : ' disabled'}" data-trade-stage="take_${row.key}" title="← Take ${row.name}">←</button>
              </div>
              ${buildSlot(row, 'target')}
            </div>`;
                }

                card.innerHTML = `
          <div class="trade-header">
            <div class="trade-header-left">
              <div class="trade-kicker">Field Exchange</div>
              <div class="trade-title">Trade Items</div>
            </div>
            <button class="trade-close" data-trade-action="cancel" title="Cancel">✕</button>
          </div>
          <div class="trade-body">
            <div class="trade-unit-headers">
              ${buildUnitHeader(source, 'source')}
              <div class="trade-arrows-spacer"></div>
              ${buildUnitHeader(target, 'target')}
            </div>
            <div class="trade-rows">${itemRowsHtml}</div>
          </div>
          <div class="trade-note">${dialog.hasChanges ? 'Preview above — click Confirm to finalize.' : 'Click arrows to stage transfers, then Confirm.'}</div>
          <div class="trade-footer">
            <button data-trade-action="cancel">Cancel</button>
            <button data-trade-action="confirm" class="${dialog.hasChanges ? 'trade-confirm-ready' : ''}" ${dialog.hasChanges ? '' : 'disabled'}>Confirm Trade</button>
          </div>`;

                card.onclick = function(e) {
                    const stageBtn = e.target.closest('[data-trade-stage]');
                    const actionBtn = e.target.closest('[data-trade-action]');
                    if (stageBtn && !stageBtn.classList.contains('disabled')) {
                        stageTradeTransfer(stageBtn.getAttribute('data-trade-stage'));
                    } else if (actionBtn) {
                        const action = actionBtn.getAttribute('data-trade-action');
                        if (action === 'cancel') cancelTradeDialog();
                        else if (action === 'confirm') confirmTradeDialog();
                    }
                };
                return;
            }
        }

        function handleUiDialogPrimary() {
            const dialog = state.uiDialog;
            if (!dialog) return;
            if (dialog.type === 'mdStairs') {
                state.uiDialog = null;
                markDirty('dialog');
                renderIfDirty();
                if (window._mdConfirmDescend) window._mdConfirmDescend();
                return;
            }
            if (dialog.type === 'mdParty') {
                if (window._mdPartyStart) window._mdPartyStart();
                return;
            }
            if (dialog.type === 'pickupDecision' || dialog.type === 'confirm') {
                const action = dialog.onConfirm;
                state.uiDialog = null;
                markDirty('dialog');
                renderIfDirty();
                if (typeof action === 'function') action();
                return;
            }
            if (dialog.type === 'trade') {
                confirmTradeDialog();
            }
        }

        function handleUiDialogSecondary() {
            const dialog = state.uiDialog;
            if (!dialog) return;

            if (dialog.type === 'mdStairs') {
                state.uiDialog = null;
                markDirty('dialog');
                renderIfDirty();
                addLog('🪜 You hold your ground. Hit the ⬇ DESCEND button (top of screen) when you\'re ready.');
                return;
            }
            if (dialog.type === 'mdParty') {
                if (window._mdPartyCancel) window._mdPartyCancel();
                return;
            }

            if (dialog.type === 'secondaryJobPick') return;
            if (dialog.type === 'pickupDecision' || dialog.type === 'confirm') {
                const action = dialog.onCancel;
                state.uiDialog = null;
                markDirty('dialog');
                renderIfDirty();
                if (typeof action === 'function') action();
                return;
            }
            if (dialog.type === 'trade') {
                cancelTradeDialog();
            }
            if (dialog.type === 'itemFound') {
                itemFoundSkip();
            }
            if (dialog.type === 'shop') {
                closeShopDialog();
            }
        }

        function handleSecondaryJobSelect(jobName) {
            const dialog = state.uiDialog;
            if (!dialog || dialog.type !== 'secondaryJobPick') return;
            const unit = state.units.find(u => u.id === dialog.unitId);
            if (!unit) return;
            const onComplete = dialog.onComplete;

            applySecondaryJob(unit, jobName);

            state.uiDialog = null;
            markDirty('dialog');
            renderIfDirty();
            renderBoard();
            render();

            if (typeof onComplete === 'function') {
                window.setTimeout(onComplete, 300);
            }
        }

        window.handleSecondaryJobSelect = handleSecondaryJobSelect;
        window.itemFoundDiscard = itemFoundDiscard;
        window.itemFoundSkip = itemFoundSkip;

        function stageTradeTransfer(stageKey) {
            const dialog = state.uiDialog;
            if (!dialog || dialog.type !== 'trade') return;
            const stg = dialog.staged;
            const source = state.units.find(u => u.id === dialog.sourceId);
            const target = state.units.find(u => u.id === dialog.targetId);
            if (!source || !target) return;

            const [direction, ...keyParts] = stageKey.split('_');
            const itemKey = keyParts.join('_');

            if (itemKey === 'hourglass') {
                if (direction === 'give' && stg.srcHourglasses > 0) {
                    stg.srcHourglasses -= 1;
                    stg.tgtHourglasses += 1;
                } else if (direction === 'take' && stg.tgtHourglasses > 0) {
                    stg.tgtHourglasses -= 1;
                    stg.srcHourglasses += 1;
                } else {
                    playErrorSfx();
                    return;
                }
            } else if (stg.srcItems.hasOwnProperty(itemKey)) {
                if (direction === 'give') {
                    if (stg.srcItems[itemKey] <= 0 || stg.tgtItems[itemKey] >= getItemCapForClass(target.cls, itemKey)) {
                        playErrorSfx();
                        return;
                    }
                    stg.srcItems[itemKey] -= 1;
                    stg.tgtItems[itemKey] += 1;
                } else if (direction === 'take') {
                    if (stg.tgtItems[itemKey] <= 0 || stg.srcItems[itemKey] >= getItemCapForClass(source.cls, itemKey)) {
                        playErrorSfx();
                        return;
                    }
                    stg.tgtItems[itemKey] -= 1;
                    stg.srcItems[itemKey] += 1;
                }
            } else {
                return;
            }

            const origSrcHg = source.hourglasses || 0;
            const origTgtHg = target.hourglasses || 0;
            dialog.hasChanges = stg.srcHourglasses !== origSrcHg || stg.tgtHourglasses !== origTgtHg ||
                Object.keys(ITEM_RULES).some(k => (stg.srcItems[k] || 0) !== (source.items?.[k] || 0) || (stg.tgtItems[k] || 0) !== (target.items?.[k] || 0));

            playSfx('uiCursorMove');
            renderUiDialog();
        }

        function confirmTradeDialog() {
            const dialog = state.uiDialog;
            if (!dialog || dialog.type !== 'trade' || !dialog.hasChanges) return;
            const source = state.units.find(u => u.id === dialog.sourceId);
            const target = state.units.find(u => u.id === dialog.targetId);
            if (!source || !target) return;

            pushUndoSnapshot(true);

            const stg = dialog.staged;
            const logs = [];

            const hgDiff = (source.hourglasses || 0) - stg.srcHourglasses;
            if (hgDiff > 0) {
                moveHourglassesBetweenUnits(source, target, hgDiff);
                logs.push(`${hgDiff} hourglass${hgDiff !== 1 ? 'es' : ''} → ${unitDisplayName(target)}`);
            } else if (hgDiff < 0) {
                moveHourglassesBetweenUnits(target, source, -hgDiff);
                logs.push(`${-hgDiff} hourglass${-hgDiff !== 1 ? 'es' : ''} ← ${unitDisplayName(target)}`);
            }

            for (const itemKey of Object.keys(ITEM_RULES)) {
                const srcDiff = (source.items?.[itemKey] || 0) - stg.srcItems[itemKey];
                if (srcDiff > 0) {

                    for (let i = 0; i < srcDiff; i++) moveSingleItemBetweenUnits(source, target, itemKey);
                    logs.push(`${srcDiff} ${ITEM_RULES[itemKey]?.name || itemKey} → ${unitDisplayName(target)}`);
                } else if (srcDiff < 0) {

                    for (let i = 0; i < -srcDiff; i++) moveSingleItemBetweenUnits(target, source, itemKey);
                    logs.push(`${-srcDiff} ${ITEM_RULES[itemKey]?.name || itemKey} ← ${unitDisplayName(target)}`);
                }
            }

            state.uiDialog = null;
            playSfx('uiConfirm');
            resetBoardCamera();
            spendAP(source, AP_COST_ACTION);
            if (logs.length) {
                addLog(`${unitDisplayName(source)} trades with ${unitDisplayName(target)}: ${logs.join(', ')}.`);
            }
            state.actionMode = null;
            state.pendingTarget = null;
            state.actionMenuView = 'root';
            state.selectedTool = null;
            endUnitIfDone(source);
            markDirty('dialog');
            renderBattleUpdate();
        }

        function cancelTradeDialog() {
            state.uiDialog = null;
            addLog('Trade cancelled.');
            state.actionMode = null;
            state.pendingTarget = null;
            state.actionMenuView = 'root';
            markDirty('dialog');
            renderBattleUpdate();
        }

        function renderAudioControls() {
            refreshVisibleVolumeValues();
            if (skipTrackBtn) {
                skipTrackBtn.disabled = !(state.phase === 'battle' && !state.winner && state.audioUnlocked);
            }
            if (musicVolumeSlider) {
                musicVolumeSlider.disabled = state.winner && !state.currentMusic;
            }
            if (sfxVolumeSlider) {
                sfxVolumeSlider.disabled = false;
            }
        }

        var _postRenderHook = function() {};

        function render() {
            if (state.phase === 'battle') {
                updatePlayerLighting();
            }
            markDirty();
            renderIfDirty();
        }

        let _pauseOverlay = null;
        let _gamePaused = false;

        function togglePauseMenu() {
            if (_gamePaused) closePauseMenu();
            else openPauseMenu();
        }
        window.togglePauseMenu = togglePauseMenu;

        const _TRACK_DISPLAY_NAMES = {
            titleTheme: 'FF7 Theme',
            mainTheme: 'Main Theme',
            battleTheme: 'Battle Theme',
            battleThemeAlt1: 'Beetle',
            battleThemeAlt2: 'Ladybug',
            battleThemeAlt3: 'Silkworm',
            battleThemeAlt4: 'Japan',
            battleThemeAlt5: 'Nostalgia',
            battleThemeAlt6: 'Pallet Town',
            battleThemeAlt7: 'Retro',
            battleThemeAlt8: 'Urban Pop',
            battleThemeAlt9: 'Heavens Gate',
            battleThemeAlt10: 'Plot Armor',
            battleThemeAlt11: '80s Dark',
            battleThemeAlt12: 'Boooo',
            battleThemeAlt13: 'Exist',
            battleThemeAlt14: 'Hard',
            battleThemeAlt15: 'Hot Glue Gun',
            battleThemeAlt16: 'I\'m Sad',
            battleThemeAlt17: 'Kitty',
            battleThemeAlt18: 'Let Her Down',
            battleThemeAlt19: 'Mouse',
            battleThemeAlt20: 'Nurses',
            battleThemeAlt21: 'Obs',
            battleThemeAlt22: 'Rip Off Our Clothes',
            battleThemeAlt23: 'Smelly 2',
            battleThemeAlt24: 'Sneaky',
            battleThemeAlt25: 'Sneeze',
            battleThemeAlt26: 'Stiffy',
            battleThemeAlt27: 'Swish',
            battleThemeAlt28: 'Twins',
            victory: 'Victory',
            defeat: 'Game Over',
        };
        function _getTrackDisplayName(key) {
            return _TRACK_DISPLAY_NAMES[key] || key || '—';
        }

        let _pauseTab = 'scoreboard';

        function openPauseMenu() {
            _gamePaused = true;

            if (_cinematicEl) {
                _cinematicEl.remove();
                _cinematicEl = null;
                _activeCinematic = null;
            }

            if (!_pauseOverlay) {
                _pauseOverlay = document.createElement('div');
                _pauseOverlay.className = 'pause-overlay';
                _pauseOverlay.id = 'pauseOverlay';
                (document.getElementById("game-viewport") || document.body).appendChild(_pauseOverlay);
            }
            _renderPauseMenu();
            _pauseOverlay.classList.remove('hidden');
            requestAnimationFrame(() => _pauseOverlay.classList.add('active'));
        }
        window.openPauseMenu = openPauseMenu;

        function _renderPauseMenu() {
            if (!_pauseOverlay) return;
            /* In the map editor there is no match, so the scoreboard tab is
               meaningless — land on Audio (the reason to pause in the editor is
               almost always "change the song / volumes"). */
            const _inEditor = state.phase === 'editor';
            if (_inEditor && _pauseTab === 'scoreboard') _pauseTab = 'audio';
            const roundNum = state.round || 0;
            const mpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
            const modeLabel = mpMode ? (mpMode.icon || '') + ' ' + (mpMode.label || '') : '⚔ Arena';

            const durationMs = Date.now() - (state.startTime || Date.now());
            const durationMin = Math.floor(durationMs / 60000);
            const durationSec = Math.floor((durationMs % 60000) / 1000);
            const durationStr = durationMin > 0 ? `${durationMin}m ${durationSec}s` : `${durationSec}s`;

            let tabContent = '';
            if (_pauseTab === 'scoreboard') {
                tabContent = _buildPauseScoreboard();
            } else if (_pauseTab === 'audio') {
                tabContent = _buildPauseMusic();
            } else if (_pauseTab === 'video') {
                tabContent = _buildPauseVideo();
            } else if (_pauseTab === 'controls') {
                tabContent = _buildPauseControls();
            }

            const _pauseRl = state.matchClock && state.matchClock.roundLimit ? state.matchClock.roundLimit : 0;
            const _pausePastLimit = _pauseRl > 0 && roundNum > _pauseRl;
            const _pauseRoundStr = _pausePastLimit
                ? (state.suddenDeathActive ? '⚡ Sudden Death' : '⏱ TIME')
                : `Round ${roundNum}`;

            _pauseOverlay.innerHTML = `
            <div class="pause-card">
                <div class="pause-header">
                    <div class="pause-title-row">
                        <div class="pause-title">PAUSED</div>
                        <button class="pause-close-btn" onclick="closePauseMenu()" title="Resume (ESC)">✕</button>
                    </div>
                    <div class="pause-subtitle">${_inEditor ? '🗺 Map Editor' : `${modeLabel} · ${_pauseRoundStr} · ${durationStr}`}</div>
                </div>
                <div class="pause-tabs">
                    ${_inEditor ? '' : `<button class="pause-tab${_pauseTab === 'scoreboard' ? ' active' : ''}" onclick="window._setPauseTab('scoreboard')">Match</button>`}
                    <button class="pause-tab${_pauseTab === 'audio' ? ' active' : ''}" onclick="window._setPauseTab('audio')">Audio</button>
                    <button class="pause-tab${_pauseTab === 'video' ? ' active' : ''}" onclick="window._setPauseTab('video')">Video</button>
                    <button class="pause-tab${_pauseTab === 'controls' ? ' active' : ''}" onclick="window._setPauseTab('controls')">Controls</button>
                </div>
                <div class="pause-tab-body">
                    ${tabContent}
                </div>
                <div class="pause-footer">
                    <button class="pause-resume-btn" onclick="closePauseMenu()">
                        <span class="pause-resume-icon">▶</span> Resume
                    </button>
                </div>
            </div>
            `;
        }

        window._setPauseTab = function(tab) {
            _pauseTab = tab;
            _renderPauseMenu();
        };

        function _buildPauseScoreboard() {
            const allUnits = state.units || [];
            const p1Units = allUnits.filter(u => u.player === 1);
            const p2Units = allUnits.filter(u => u.player === 2);
            const mpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
            const scoringType = mpMode ? mpMode.scoringType : null;

            const p1Kills = state.matchKills ? (state.matchKills[1] || 0) : p1Units.reduce((s, u) => s + (u._trackKills || 0), 0);
            const p2Kills = state.matchKills ? (state.matchKills[2] || 0) : p2Units.reduce((s, u) => s + (u._trackKills || 0), 0);
            const p1Score = state.matchScores ? (state.matchScores[1] || 0) : 0;
            const p2Score = state.matchScores ? (state.matchScores[2] || 0) : 0;

            let scoreLabel = 'Kills', p1Display = p1Kills, p2Display = p2Kills;

            const isArena = !mpMode || mpMode.id === 'arena';
            if (isArena) {
                const _ARP = { kill: 15, towerDmgPer10: 1, hourglass: 40, nexusRound: 3 };
                function _pmArenaScore(p) {
                    const enemy = p === 1 ? 2 : 1;
                    let pts = 0;
                    pts += (state.matchKills?.[p] || 0) * _ARP.kill;
                    const eTw = state.towers?.[enemy];
                    if (eTw) pts += Math.floor(Math.max(0, (eTw.maxHp || 1500) - eTw.hp) / (eTw.maxHp || 1500) * 250) * _ARP.towerDmgPer10;
                    if (state.hourglasses) {
                        pts += state.hourglasses.filter(h => {
                            if (!h.carriedBy) return false;
                            const c = state.units.find(u => u.id === h.carriedBy);
                            return c && !c.dead && c.player === p;
                        }).length * _ARP.hourglass;
                    }
                    pts += (state._arenaNexusControl?.[p] || 0) * _ARP.nexusRound;
                    return pts;
                }
                scoreLabel = 'Score';
                p1Display = _pmArenaScore(1);
                p2Display = _pmArenaScore(2);
            } else if (scoringType === 'domination' || scoringType === 'hotspot') {
                scoreLabel = 'Points'; p1Display = p1Score; p2Display = p2Score;
            } else if (scoringType === 'ctf') {
                scoreLabel = 'Captures'; p1Display = p1Score; p2Display = p2Score;
            }

            const showTowers = mpMode ? mpMode.hasTowers : true;
            const t1 = state.towers?.[1], t2 = state.towers?.[2];
            const t1Pct = t1 && t1.maxHp > 0 ? Math.round(t1.hp / t1.maxHp * 100) : 100;
            const t2Pct = t2 && t2.maxHp > 0 ? Math.round(t2.hp / t2.maxHp * 100) : 100;

            let towerHtml = '';
            if (isArena && showTowers && t1 && t2) {
                towerHtml = `
                <div class="pm-towers">
                    <div class="pm-tower p1">
                        <span class="pm-tower-label">P1 Tower</span>
                        <div class="pm-tower-bar"><div class="pm-tower-fill p1" style="width:${t1Pct}%"></div></div>
                        <span class="pm-tower-hp">${t1.hp}/${t1.maxHp}</span>
                    </div>
                    <div class="pm-tower p2">
                        <span class="pm-tower-label">P2 Tower</span>
                        <div class="pm-tower-bar"><div class="pm-tower-fill p2" style="width:${t2Pct}%"></div></div>
                        <span class="pm-tower-hp">${t2.hp}/${t2.maxHp}</span>
                    </div>
                </div>`;
            }

            const scoreHeader = `
            <div class="pm-score-header">
                <div class="pm-score-side p1">
                    <span class="pm-score-big">${p1Display}</span>
                    <span class="pm-score-team-label">Player 1</span>
                </div>
                <div class="pm-score-center">
                    <span class="pm-score-label">${scoreLabel}</span>
                    <span class="pm-score-vs">vs</span>
                </div>
                <div class="pm-score-side p2">
                    <span class="pm-score-big">${p2Display}</span>
                    <span class="pm-score-team-label">Player 2</span>
                </div>
            </div>`;

            const cols = ['_matchKills', '_matchDeaths', '_matchAssists', '_trackDmgDealt', '_trackDmgReceived', '_trackHealDone', '_matchCrits'];
            const best = {};
            for (const c of cols) {
                const max = Math.max(...allUnits.map(u => u[c] || 0));
                best[c] = max > 0 ? max : -1;
            }

            function unitRow(u) {
                const sprite = getBattleMapSpriteUrl(u);
                const deadClass = u.dead ? ' dead-unit' : '';
                const lvl = getUnitLevel(u);
                function cell(key) {
                    const v = u[key] || 0;
                    const cls = v === 0 ? 'stat-zero' : (v === best[key] && v > 0 ? 'stat-best' : '');
                    return `<td class="${cls}">${v}</td>`;
                }
                return `<tr class="${deadClass}">
                    <td><div class="pm-unit-cell">
                        <div class="pm-unit-sprite" style="background-image:url('${sprite}')"></div>
                        <span class="pm-unit-name">${escapeHtml(unitDisplayName(u))}</span>
                    </div></td>
                    <td class="pm-cls-cell">${u.cls}${lvl > 1 ? ` Lv${lvl}` : ''}</td>
                    ${cell('_matchKills')}
                    ${cell('_matchDeaths')}
                    ${cell('_matchAssists')}
                    ${cell('_trackDmgDealt')}
                    ${cell('_trackDmgReceived')}
                    ${cell('_trackHealDone')}
                    ${cell('_matchCrits')}
                </tr>`;
            }

            const sortFn = (a, b) => {
                if (a.dead !== b.dead) return a.dead ? 1 : -1;
                return (b._trackDmgDealt || 0) - (a._trackDmgDealt || 0);
            };
            const p1Sorted = [...p1Units].sort(sortFn);
            const p2Sorted = [...p2Units].sort(sortFn);

            function teamTotals(units, pClass) {
                const k = units.reduce((s,u) => s + (u._matchKills||0), 0);
                const a = units.reduce((s,u) => s + (u._matchAssists||0), 0);
                const d = units.reduce((s,u) => s + (u._trackDmgDealt||0), 0);
                const r = units.reduce((s,u) => s + (u._trackDmgReceived||0), 0);
                const h = units.reduce((s,u) => s + (u._trackHealDone||0), 0);
                const c = units.reduce((s,u) => s + (u._matchCrits||0), 0);
                const dt = units.reduce((s,u) => s + (u._matchDeaths||0), 0);
                return `<tr class="pm-team-total ${pClass}"><td colspan="2">Total</td><td>${k}</td><td>${dt}</td><td>${a}</td><td>${d}</td><td>${r}</td><td>${h}</td><td>${c}</td></tr>`;
            }

            const statsTable = `
            <div class="pm-stats-wrap">
                <table class="pm-stats-table">
                    <thead><tr>
                        <th>Unit</th><th>Class</th><th>K</th><th>D</th><th>A</th><th>Dmg</th><th>Recv</th><th>Heal</th><th>Crit</th>
                    </tr></thead>
                    <tbody>
                        <tr class="pm-team-hdr p1"><td colspan="9">Player 1</td></tr>
                        ${p1Sorted.map(unitRow).join('')}
                        ${teamTotals(p1Units, 'p1')}
                        <tr class="pm-team-hdr p2"><td colspan="9">Player 2</td></tr>
                        ${p2Sorted.map(unitRow).join('')}
                        ${teamTotals(p2Units, 'p2')}
                    </tbody>
                </table>
            </div>`;

            const awards = _buildPauseLiveAwards();

            const quickActions = `
            <div class="pm-set-row" style="margin-top:14px">
                <button class="pm-set-btn" id="pmAutoBtn" onclick="document.getElementById('autoBtn')?.click(); setTimeout(()=>{const a=document.getElementById('autoBtn');if(a)document.getElementById('pmAutoBtn').textContent=a.textContent;},50);">Auto: Off</button>
                <button class="pm-set-btn danger" onclick="closePauseMenu();document.getElementById('forfeitBtn')?.click()">Forfeit Match</button>
            </div>`;

            return scoreHeader + towerHtml + statsTable + awards + quickActions;
        }

        function _buildPauseLiveAwards() {
            const allUnits = state.units || [];
            if (!allUnits.length) return '';

            const awards = [];
            const topDmg = [...allUnits].sort((a, b) => (b._trackDmgDealt || 0) - (a._trackDmgDealt || 0))[0];
            if (topDmg && (topDmg._trackDmgDealt || 0) > 0) {
                awards.push({ icon: '⚔️', label: 'The Chosen One', name: unitDisplayName(topDmg), stat: `${topDmg._trackDmgDealt} dmg`, player: topDmg.player, unit: topDmg, gold: true });
            }
            const topKills = [...allUnits].sort((a, b) => (b._matchKills || 0) - (a._matchKills || 0))[0];
            if (topKills && (topKills._matchKills || 0) > 0) {
                awards.push({ icon: '💀', label: 'The Reaper', name: unitDisplayName(topKills), stat: `${topKills._matchKills} kill${topKills._matchKills !== 1 ? 's' : ''}`, player: topKills.player, unit: topKills });
            }
            const topHeal = [...allUnits].sort((a, b) => (b._trackHealDone || 0) - (a._trackHealDone || 0))[0];
            if (topHeal && (topHeal._trackHealDone || 0) > 0) {
                awards.push({ icon: '💚', label: 'The Witness', name: unitDisplayName(topHeal), stat: `${topHeal._trackHealDone} HP`, player: topHeal.player, unit: topHeal });
            }
            const topStreak = [...allUnits].sort((a, b) => (b._maxKillStreak || 0) - (a._maxKillStreak || 0))[0];
            if (topStreak && (topStreak._maxKillStreak || 0) >= 2) {
                awards.push({ icon: '🔥', label: 'The Unchained', name: unitDisplayName(topStreak), stat: `${topStreak._maxKillStreak} kills`, player: topStreak.player, unit: topStreak });
            }
            const topCrits = [...allUnits].sort((a, b) => (b._matchCrits || 0) - (a._matchCrits || 0))[0];
            if (topCrits && (topCrits._matchCrits || 0) > 0) {
                awards.push({ icon: '⚡', label: 'The Harbinger', name: unitDisplayName(topCrits), stat: `${topCrits._matchCrits} crit${topCrits._matchCrits !== 1 ? 's' : ''}`, player: topCrits.player, unit: topCrits });
            }
            const topTank = [...allUnits].filter(u => !u.dead).sort((a, b) => (b._trackDmgReceived || 0) - (a._trackDmgReceived || 0))[0];
            if (topTank && (topTank._trackDmgReceived || 0) > 15) {
                awards.push({ icon: '🛡', label: 'The Martyr', name: unitDisplayName(topTank), stat: `${topTank._trackDmgReceived} tanked`, player: topTank.player, unit: topTank });
            }

            if (!awards.length) return '';
            const awardCards = awards.map(a => {
                const sprite = a.unit ? getBattleMapSpriteUrl(a.unit) : '';
                const pClass = a.player === 1 ? 'p1' : 'p2';
                return `<div class="pm-award${a.gold ? ' gold' : ''} ${pClass}">
                    ${sprite ? `<div class="pm-award-sprite" style="background-image:url('${sprite}')"></div>` : ''}
                    <div class="pm-award-icon">${a.icon}</div>
                    <div class="pm-award-detail">
                        <div class="pm-award-label">${a.label}</div>
                        <div class="pm-award-name">${escapeHtml(a.name)}</div>
                        <div class="pm-award-stat">${a.stat}</div>
                    </div>
                </div>`;
            }).join('');
            return `<div class="pm-awards-section">
                <div class="pm-section-title">Live Awards</div>
                <div class="pm-awards-grid">${awardCards}</div>
            </div>`;
        }

        function _buildPauseMusic() {
            const currentKey = state.currentMusic || '';
            const trackObj = currentKey ? audioTracks[currentKey] : null;
            const isPlaying = trackObj && !trackObj.paused;
            const isMuted = (state.musicVolume ?? 0.68) <= 0.001;
            const musicVol = Math.round((state.musicVolume ?? 0.68) * 100);
            const sfxVol = Math.round((state.sfxVolume ?? 0.9) * 100);
            const trackName = _getTrackDisplayName(currentKey);
            const loopOn = trackObj ? trackObj.loop : false;

            let progressPct = 0, timeStr = '', durationStr = '';
            if (trackObj && trackObj.duration && Number.isFinite(trackObj.duration)) {
                progressPct = (trackObj.currentTime / trackObj.duration) * 100;
                const ct = Math.floor(trackObj.currentTime);
                const dt = Math.floor(trackObj.duration);
                timeStr = `${Math.floor(ct/60)}:${String(ct%60).padStart(2,'0')}`;
                durationStr = `${Math.floor(dt/60)}:${String(dt%60).padStart(2,'0')}`;
            }

            return `
            <div class="pm-music-section">
                <div class="pm-now-playing">
                    <div class="pm-np-visualizer">
                        <div class="pm-np-bar${isPlaying ? ' playing' : ''}" style="--i:0"></div>
                        <div class="pm-np-bar${isPlaying ? ' playing' : ''}" style="--i:1"></div>
                        <div class="pm-np-bar${isPlaying ? ' playing' : ''}" style="--i:2"></div>
                        <div class="pm-np-bar${isPlaying ? ' playing' : ''}" style="--i:3"></div>
                        <div class="pm-np-bar${isPlaying ? ' playing' : ''}" style="--i:4"></div>
                    </div>
                    <div class="pm-np-info">
                        <div class="pm-np-label">Now Playing</div>
                        <div class="pm-np-track">${escapeHtml(trackName)}</div>
                        <div class="pm-np-key">${escapeHtml(currentKey)}</div>
                    </div>
                </div>

                <div class="pm-progress-row">
                    <span class="pm-time">${timeStr || '0:00'}</span>
                    <div class="pm-progress-bar" onclick="window._pauseSeekTrack(event)">
                        <div class="pm-progress-fill" style="width:${progressPct}%"></div>
                    </div>
                    <span class="pm-time">${durationStr || '0:00'}</span>
                </div>

                <div class="pm-transport">
                    <button class="pm-transport-btn" onclick="window._pausePrevTrack()" title="Previous Track">⏮</button>
                    <button class="pm-transport-btn big" onclick="window._pauseTogglePlay()" title="${isPlaying ? 'Pause' : 'Play'}">
                        ${isPlaying ? '⏸' : '▶'}
                    </button>
                    <button class="pm-transport-btn" onclick="window._pauseNextTrack()" title="Next Track">⏭</button>
                    <button class="pm-transport-btn${loopOn ? ' active' : ''}" onclick="window._pauseToggleLoop()" title="Loop">🔁</button>
                    <button class="pm-transport-btn${isMuted ? ' active muted' : ''}" onclick="window._pauseToggleMute()" title="${isMuted ? 'Unmute' : 'Mute'}">
                        ${isMuted ? '🔇' : '🔊'}
                    </button>
                </div>

                <div class="pm-vol-section">
                    <div class="pm-vol-row">
                        <span class="pm-vol-label">🎵 Music</span>
                        <input type="range" min="0" max="100" step="1" value="${musicVol}" class="pm-vol-slider" oninput="window._pauseSetMusicVol(this.value)">
                        <span class="pm-vol-val">${musicVol}%</span>
                    </div>
                    <div class="pm-vol-row">
                        <span class="pm-vol-label">🔊 SFX</span>
                        <input type="range" min="0" max="100" step="1" value="${sfxVol}" class="pm-vol-slider" oninput="window._pauseSetSfxVol(this.value)">
                        <span class="pm-vol-val">${sfxVol}%</span>
                    </div>
                </div>

                ${_buildPauseTrackList(currentKey)}
            </div>`;
        }

        /* Full jukebox: every loaded music track as a clickable row, so the
           player can jump straight to a specific song (battle, editor, or menu)
           instead of shuffling with ⏮/⏭ until it comes up. */
        function _buildPauseTrackList(currentKey) {
            if (typeof audioTracks === 'undefined') return '';
            const keys = Object.keys(audioTracks).filter(k => k !== 'victory' && k !== 'defeat');
            if (!keys.length) return '';
            let rows = '';
            for (const k of keys) {
                const active = k === currentKey;
                rows += `<button class="pm-track-row${active ? ' active' : ''}" onclick="window._pausePlayTrack('${k}')"
                    style="display:flex;align-items:center;gap:8px;width:100%;text-align:left;padding:6px 10px;border:none;cursor:pointer;border-radius:6px;
                    background:${active ? 'rgba(124,77,255,0.30)' : 'transparent'};color:${active ? '#fff' : 'rgba(220,215,240,0.85)'};font:inherit;font-size:12px">
                    <span style="width:14px;text-align:center">${active ? '▶' : '♪'}</span>
                    <span>${escapeHtml(_getTrackDisplayName(k))}</span>
                </button>`;
            }
            return `
            <div class="pm-track-list-wrap" style="margin-top:10px">
                <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(180,160,255,0.85);margin:0 0 4px 2px">Song Select</div>
                <div class="pm-track-list" style="max-height:180px;overflow-y:auto;border:1px solid rgba(255,255,255,0.10);border-radius:8px;padding:4px;background:rgba(0,0,0,0.25)">
                    ${rows}
                </div>
            </div>`;
        }

        window._pausePlayTrack = function(key) {
            if (typeof audioTracks === 'undefined' || !audioTracks[key]) return;
            state.audioUnlocked = true;
            /* Keep the battle shuffle continuing FROM the chosen song. */
            if (key.startsWith('battleTheme')) {
                state.currentBattleTrackKey = key;
                state.lastBattleTrackKey = key;
            }
            if (typeof playMusic === 'function') playMusic(key);
            setTimeout(() => _renderPauseMenu(), 250);
        };

        window._pauseTogglePlay = function() {
            const key = state.currentMusic;
            if (!key || !audioTracks[key]) return;
            if (audioTracks[key].paused) {
                audioTracks[key].play().catch(() => {});
            } else {
                audioTracks[key].pause();
            }
            setTimeout(() => _renderPauseMenu(), 50);
        };
        window._pauseNextTrack = function() {
            if (typeof skipBattleTrack === 'function') skipBattleTrack();
            setTimeout(() => _renderPauseMenu(), 200);
        };
        window._pausePrevTrack = function() {

            const key = state.currentMusic;
            if (!key || !audioTracks[key]) return;
            if (audioTracks[key].currentTime > 3) {
                audioTracks[key].currentTime = 0;
            } else {
                if (typeof skipBattleTrack === 'function') skipBattleTrack();
            }
            setTimeout(() => _renderPauseMenu(), 200);
        };
        window._pauseToggleLoop = function() {
            const key = state.currentMusic;
            if (!key || !audioTracks[key]) return;
            audioTracks[key].loop = !audioTracks[key].loop;
            _renderPauseMenu();
        };
        let _preMuteMusicVol = 0.68;
        window._pauseToggleMute = function() {
            const cur = state.musicVolume ?? 0.68;
            if (cur > 0.001) {
                _preMuteMusicVol = cur;
                state.musicVolume = 0;
            } else {
                state.musicVolume = _preMuteMusicVol || 0.68;
            }
            applyMusicVolumeMix();
            const s = document.getElementById('musicVolumeSlider');
            if (s) { s.value = String(Math.round(state.musicVolume * 100)); s.dispatchEvent(new Event('input')); }
            _renderPauseMenu();
        };
        window._pauseSetMusicVol = function(val) {
            state.musicVolume = Math.max(0, Math.min(1, Number(val) / 100));
            applyMusicVolumeMix();
            const s = document.getElementById('musicVolumeSlider');
            if (s) { s.value = val; s.dispatchEvent(new Event('input')); }

            const valEl = document.querySelector('.pm-vol-row:first-child .pm-vol-val');
            if (valEl) valEl.textContent = val + '%';
        };
        window._pauseSetSfxVol = function(val) {
            state.sfxVolume = Math.max(0, Math.min(1, Number(val) / 100));
            refreshVisibleVolumeValues();
            const s = document.getElementById('sfxVolumeSlider');
            if (s) { s.value = val; s.dispatchEvent(new Event('input')); }
            const valEl = document.querySelector('.pm-vol-row:last-child .pm-vol-val');
            if (valEl) valEl.textContent = val + '%';
        };
        window._pauseSeekTrack = function(e) {
            const key = state.currentMusic;
            if (!key || !audioTracks[key] || !audioTracks[key].duration) return;
            const bar = e.currentTarget;
            const rect = bar.getBoundingClientRect();
            const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            audioTracks[key].currentTime = pct * audioTracks[key].duration;
            _renderPauseMenu();
        };

        function _buildPauseVideo() {
            const cinematicChecked = state.cinematicMode ? 'checked' : '';
            const actionCamChecked = state.cinematicActionCam ? 'checked' : '';
            const animChecked = document.getElementById('animToggleBattle')?.checked !== false ? 'checked' : '';
            const cameraChecked = document.getElementById('cameraToggleBattle')?.checked !== false ? 'checked' : '';
            const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
            const nametagMode = state.nametagMode || 'name';
            const fxaaOn = typeof ThreePost!=='undefined'&&ThreePost.isFXAAEnabled&&ThreePost.isFXAAEnabled();
            const isNativePixel = typeof window==='undefined'||window._ewPixelRatio!==1;
            const crtOn = typeof ThreePost!=='undefined'&&ThreePost.isCinematicFilterEnabled&&ThreePost.isCinematicFilterEnabled();
            const vignetteOn = typeof ThreePost!=='undefined'&&ThreePost.isVignetteEnabled&&ThreePost.isVignetteEnabled();
            const cinState = (typeof ThreePost!=='undefined'&&ThreePost.getCinematicState)?ThreePost.getCinematicState():{scanline:0.07,chroma:0.8,curvature:0,vigAmount:0.45,vigSize:0.42,vigSoft:0.55};
            const scanPct = Math.max(0,Math.min(100,Math.round((cinState.scanline/0.30)*100)));
            const chromaPct = Math.max(0,Math.min(100,Math.round((cinState.chroma/3.0)*100)));
            const curvePct = Math.max(0,Math.min(100,Math.round((cinState.curvature/0.50)*100)));
            const vigAmtPct = Math.max(0,Math.min(100,Math.round(cinState.vigAmount*100)));
            const vigSizePct = Math.max(0,Math.min(100,Math.round(((cinState.vigSize-0.20)/0.50)*100)));
            const crtVigOn = crtOn || vignetteOn;
            const bloomStr = (typeof ThreePost!=='undefined'&&ThreePost.getBloomStrength)?ThreePost.getBloomStrength():0;
            const bloomMaxV = (typeof ThreePost!=='undefined'&&ThreePost.getBloomMaxStrength)?ThreePost.getBloomMaxStrength():1.6;
            const bloomPct = Math.round(bloomStr*100);
            const bloomMaxPct = Math.round(bloomMaxV*100);
            const shadowQ = (typeof ThreePost!=='undefined'&&ThreePost.getShadowQuality)?ThreePost.getShadowQuality():'high';
            const filmicOn = !!(typeof ThreePost!=='undefined'&&ThreePost.isFilmicTone&&ThreePost.isFilmicTone());
            const dofStr = (typeof ThreePost!=='undefined'&&ThreePost.getDofStrength)?ThreePost.getDofStrength():0;
            const dofPct = Math.round(dofStr*100);
            const ambStr = (typeof ThreeVFX!=='undefined'&&ThreeVFX.getAmbientDensity)?ThreeVFX.getAmbientDensity():0;
            const ambPct = Math.round(ambStr*100);
            const rayStr = (typeof ThreeRenderer!=='undefined'&&ThreeRenderer.getLightRayStrength)?ThreeRenderer.getLightRayStrength():1.0;
            const rayPct = Math.round(rayStr*100);
            const expVal = (typeof ThreePost!=='undefined'&&ThreePost.getExposureScale)?ThreePost.getExposureScale():1.0;
            const expRange = (typeof ThreePost!=='undefined'&&ThreePost.getExposureRange)?ThreePost.getExposureRange():{min:0.55,max:1.25};
            const expPct = Math.round(expVal*100);
            const expMinPct = Math.round(expRange.min*100);
            const expMaxPct = Math.round(expRange.max*100);
            const nightMood = (typeof ThreePost!=='undefined'&&ThreePost.getNightMood)?ThreePost.getNightMood():0.65;
            const nightMoodPct = Math.round(nightMood*100);
            const impactFx = (typeof ThreePost!=='undefined'&&ThreePost.getImpactFx)?ThreePost.getImpactFx():0.7;
            const impactFxMax = (typeof ThreePost!=='undefined'&&ThreePost.getImpactFxMax)?ThreePost.getImpactFxMax():1.5;
            const impactFxPct = Math.round(impactFx*100);
            const impactFxMaxPct = Math.round(impactFxMax*100);

            // Retro / Haunted-PS1 filter state
            const _TP = (typeof ThreePost!=='undefined') ? ThreePost : null;
            const retroOn = !!(_TP && _TP.isRetroFilterEnabled && _TP.isRetroFilterEnabled());
            const retroState = (_TP && _TP.getRetroState) ? _TP.getRetroState() : {pixelSize:1,ditherStrength:0.6,ditherScale:1,grain:0.04,levels:24,tintAmount:0.55};
            const retroPreset = (_TP && _TP.getRetroPreset) ? _TP.getRetroPreset() : 'teal';
            const retroPresets = (_TP && _TP.getRetroPresets) ? _TP.getRetroPresets() : [];
            const retroFogOn = !!(_TP && _TP.isRetroFogEnabled && _TP.isRetroFogEnabled());
            const retroFogDensity = (_TP && _TP.getRetroFogDensity) ? _TP.getRetroFogDensity() : 0.00035;
            const retroFogHorizon = (_TP && _TP.getRetroFogHorizon) ? _TP.getRetroFogHorizon() : 0.0;
            const fogHorizonPct = Math.max(0, Math.min(100, Math.round((retroFogHorizon/0.50)*100)));
            const grainPct = Math.max(0, Math.min(100, Math.round((retroState.grain/0.12)*100)));
            const fogPct = Math.max(0, Math.min(100, Math.round((retroFogDensity/0.0008)*100)));
            const ditherPct = Math.round(retroState.ditherStrength*100);
            const tintPct = Math.round(retroState.tintAmount*100);
            const retroPresetBtns = retroPresets.map(p=>`<button class="pm-seg-btn${retroPreset===p.key?' active':''}" onclick="if(typeof ThreePost!=='undefined'&&ThreePost.setRetroPreset)ThreePost.setRetroPreset('${p.key}');_renderPauseMenu();">${p.label}</button>`).join('');

            const ps = state.particleSettings || {};
            const pKeys = ['projectiles','aoe','movement','healing','buffs','status','levelUp','death','combos'];
            const pOn = pKeys.filter(k => ps[k]).length;

            const _TR = (typeof ThreeRenderer !== 'undefined') ? ThreeRenderer : null;
            const fpsCap = (_TR && _TR.getFpsCap) ? _TR.getFpsCap() : 0;
            const fpsCounterOn = !!(_TR && _TR.isFpsCounterOn && _TR.isFpsCounterOn());
            const terrainBatchOn = !(_TR && _TR.isTerrainBatching) || _TR.isTerrainBatching();
            const fogGridOn = !(_TR && _TR.isFogGridOn) || _TR.isFogGridOn();

            const uiPref = window._getUIScalePref ? window._getUIScalePref() : 1;
            const _uiSeg = (v, label) => `<button class="pm-seg-btn${Math.abs(uiPref - v) < 0.01 ? ' active' : ''}" onclick="window._setUIScalePref(${v});_renderPauseMenu();">${label}</button>`;

            return `
            <div class="pm-settings-section">
                <div class="pm-set-group">
                    <div class="pm-set-group-title">Display</div>
                    <div class="pm-set-toggles">
                        <label class="pm-toggle"><input type="checkbox" ${animChecked} onchange="var cb=document.getElementById('animToggleBattle');if(cb){cb.checked=this.checked;cb.dispatchEvent(new Event('change'));}"><span class="pm-toggle-label">Animation</span></label>
                        <label class="pm-toggle"><input type="checkbox" ${cinematicChecked} onchange="document.getElementById('cinematicToggle').checked=this.checked;state.cinematicMode=this.checked;"><span class="pm-toggle-label">Cinematic</span></label>
                        <label class="pm-toggle"><input type="checkbox" ${cameraChecked} onchange="var cb=document.getElementById('cameraToggleBattle');if(cb){cb.checked=this.checked;cb.dispatchEvent(new Event('change'));}"><span class="pm-toggle-label">Camera Follow</span></label>
                        <label class="pm-toggle"><input type="checkbox" ${actionCamChecked} onchange="window._setCinematicActionCam(this.checked);"><span class="pm-toggle-label">Action Cam</span><span class="pm-toggle-hint">cinematic attack shots</span></label>
                    </div>
                    <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                        <span class="pm-setting-label">HUD Size</span>
                        <div class="pm-seg-group">
                            ${_uiSeg(0.72, 'XS')}${_uiSeg(0.85, 'Small')}${_uiSeg(1, 'Normal')}${_uiSeg(1.15, 'Large')}${_uiSeg(1.3, 'Huge')}
                        </div>
                    </div>
                    <div class="pm-set-row" style="margin-top:2px">
                        <span class="pm-toggle-hint">scales the action menu &amp; ability bar — auto-fits your screen, saved per device</span>
                    </div>
                </div>

                <div class="pm-set-group">
                    <div class="pm-set-group-title">Graphics</div>
                    <div class="pm-set-toggles">
                        <label class="pm-toggle"><input type="checkbox" ${fxaaOn ? 'checked' : ''} onchange="if(typeof ThreePost!=='undefined'&&ThreePost.setFXAA)ThreePost.setFXAA(this.checked);"><span class="pm-toggle-label">FXAA</span><span class="pm-toggle-hint">anti-aliasing</span></label>
                        <label class="pm-toggle"><input type="checkbox" ${filmicOn ? 'checked' : ''} onchange="if(typeof ThreePost!=='undefined'&&ThreePost.setFilmicTone)ThreePost.setFilmicTone(this.checked);"><span class="pm-toggle-label">Filmic Tone</span><span class="pm-toggle-hint">rich contrast grade</span></label>
                    </div>
                    <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                        <span class="pm-setting-label">Shadows</span>
                        <div class="pm-seg-group">
                            <button class="pm-seg-btn${shadowQ==='off'?' active':''}" onclick="if(typeof ThreePost!=='undefined'&&ThreePost.setShadowQuality)ThreePost.setShadowQuality('off');_renderPauseMenu();">Off</button>
                            <button class="pm-seg-btn${shadowQ==='low'?' active':''}" onclick="if(typeof ThreePost!=='undefined'&&ThreePost.setShadowQuality)ThreePost.setShadowQuality('low');_renderPauseMenu();">Low</button>
                            <button class="pm-seg-btn${shadowQ==='high'?' active':''}" onclick="if(typeof ThreePost!=='undefined'&&ThreePost.setShadowQuality)ThreePost.setShadowQuality('high');_renderPauseMenu();">High</button>
                        </div>
                    </div>
                    <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                        <span class="pm-setting-label">Tilt-Shift</span>
                        <input type="range" min="0" max="100" step="5" value="${dofPct}" class="pm-vol-slider" oninput="if(typeof ThreePost!=='undefined'&&ThreePost.setDofStrength)ThreePost.setDofStrength(this.value/100);this.nextElementSibling.textContent=(this.value=='0'?'off':(this.value/100).toFixed(2));">
                        <span class="pm-vol-val">${dofPct===0?'off':dofStr.toFixed(2)}</span>
                    </div>
                    <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                        <span class="pm-setting-label">Ambient FX</span>
                        <input type="range" min="0" max="100" step="5" value="${ambPct}" class="pm-vol-slider" oninput="if(typeof ThreeVFX!=='undefined'&&ThreeVFX.setAmbientDensity)ThreeVFX.setAmbientDensity(this.value/100);this.nextElementSibling.textContent=(this.value=='0'?'off':(this.value/100).toFixed(2));">
                        <span class="pm-vol-val">${ambPct===0?'off':ambStr.toFixed(2)}</span>
                    </div>
                    <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                        <span class="pm-setting-label">Light Rays</span>
                        <input type="range" min="0" max="150" step="5" value="${rayPct}" class="pm-vol-slider" oninput="if(typeof ThreeRenderer!=='undefined'&&ThreeRenderer.setLightRayStrength)ThreeRenderer.setLightRayStrength(this.value/100);this.nextElementSibling.textContent=(this.value=='0'?'off':(this.value/100).toFixed(2));">
                        <span class="pm-vol-val">${rayPct===0?'off':rayStr.toFixed(2)}</span>
                    </div>
                    <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                        <span class="pm-setting-label">Bloom</span>
                        <input type="range" min="0" max="${bloomMaxPct}" step="5" value="${bloomPct}" class="pm-vol-slider" oninput="if(typeof ThreePost!=='undefined'&&ThreePost.setBloomStrength)ThreePost.setBloomStrength(this.value/100);this.nextElementSibling.textContent=(this.value/100).toFixed(2);">
                        <span class="pm-vol-val">${bloomStr.toFixed(2)}</span>
                    </div>
                    <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                        <span class="pm-setting-label">Brightness</span>
                        <input type="range" min="${expMinPct}" max="${expMaxPct}" step="1" value="${expPct}" class="pm-vol-slider" oninput="if(typeof ThreePost!=='undefined'&&ThreePost.setExposureScale)ThreePost.setExposureScale(this.value/100);this.nextElementSibling.textContent=(this.value/100).toFixed(2);">
                        <span class="pm-vol-val">${expVal.toFixed(2)}</span>
                    </div>
                    <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                        <span class="pm-setting-label">Night Mood</span>
                        <input type="range" min="0" max="100" step="5" value="${nightMoodPct}" class="pm-vol-slider" oninput="if(typeof ThreePost!=='undefined'&&ThreePost.setNightMood)ThreePost.setNightMood(this.value/100);this.nextElementSibling.textContent=(this.value=='0'?'soft':(this.value/100).toFixed(2));">
                        <span class="pm-vol-val">${nightMoodPct===0?'soft':nightMood.toFixed(2)}</span>
                    </div>
                    <div class="pm-set-row" style="margin-top:2px">
                        <span class="pm-toggle-hint">how dark &amp; moody nights get — torches and spells become the light</span>
                    </div>
                    <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                        <span class="pm-setting-label">Impact Flash</span>
                        <input type="range" min="0" max="${impactFxMaxPct}" step="5" value="${impactFxPct}" class="pm-vol-slider" oninput="if(typeof ThreePost!=='undefined'&&ThreePost.setImpactFx)ThreePost.setImpactFx(this.value/100);this.nextElementSibling.textContent=(this.value=='0'?'off':(this.value/100).toFixed(2));">
                        <span class="pm-vol-val">${impactFxPct===0?'off':impactFx.toFixed(2)}</span>
                    </div>
                    <div class="pm-set-row" style="margin-top:2px">
                        <span class="pm-toggle-hint">bloom kick when spells and projectiles land</span>
                    </div>
                    <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                        <span class="pm-setting-label">Pixel Ratio</span>
                        <div class="pm-seg-group">
                            <button class="pm-seg-btn${!isNativePixel ? ' active' : ''}" onclick="if(typeof ThreePost!=='undefined'&&ThreePost.setPixelRatio)ThreePost.setPixelRatio(1);_renderPauseMenu();">Fast</button>
                            <button class="pm-seg-btn${isNativePixel ? ' active' : ''}" onclick="if(typeof ThreePost!=='undefined'&&ThreePost.setPixelRatio)ThreePost.setPixelRatio(Math.min(window.devicePixelRatio||1,2));_renderPauseMenu();">Native</button>
                        </div>
                    </div>
                    <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                        <span class="pm-setting-label">FPS Cap</span>
                        <div class="pm-seg-group">
                            <button class="pm-seg-btn${fpsCap===30?' active':''}" onclick="if(typeof ThreeRenderer!=='undefined'&&ThreeRenderer.setFpsCap)ThreeRenderer.setFpsCap(30);_renderPauseMenu();">30</button>
                            <button class="pm-seg-btn${fpsCap===60?' active':''}" onclick="if(typeof ThreeRenderer!=='undefined'&&ThreeRenderer.setFpsCap)ThreeRenderer.setFpsCap(60);_renderPauseMenu();">60</button>
                            <button class="pm-seg-btn${fpsCap===0?' active':''}" onclick="if(typeof ThreeRenderer!=='undefined'&&ThreeRenderer.setFpsCap)ThreeRenderer.setFpsCap(0);_renderPauseMenu();">Uncapped</button>
                        </div>
                    </div>
                    <div class="pm-set-toggles" style="margin-top:8px">
                        <label class="pm-toggle"><input type="checkbox" ${fpsCounterOn ? 'checked' : ''} onchange="if(typeof ThreeRenderer!=='undefined'&&ThreeRenderer.setFpsCounter)ThreeRenderer.setFpsCounter(this.checked);"><span class="pm-toggle-label">FPS Counter</span><span class="pm-toggle-hint">on-screen framerate</span></label>
                        <label class="pm-toggle"><input type="checkbox" ${terrainBatchOn ? 'checked' : ''} onchange="if(typeof ThreeRenderer!=='undefined'&&ThreeRenderer.setTerrainBatching)ThreeRenderer.setTerrainBatching(this.checked);"><span class="pm-toggle-label">Batched Terrain</span><span class="pm-toggle-hint">fewer draw calls — turn off only if terrain misrenders</span></label>
                        <label class="pm-toggle"><input type="checkbox" ${fogGridOn ? 'checked' : ''} onchange="if(typeof ThreeRenderer!=='undefined'&&ThreeRenderer.setFogGrid)ThreeRenderer.setFogGrid(this.checked);"><span class="pm-toggle-label">Fog Grid</span><span class="pm-toggle-hint">fog-of-war overlay — unseen enemies stay hidden either way</span></label>
                    </div>
                    <div class="pm-set-row pm-setting-row" style="margin-top:6px">
                        <span class="pm-setting-label">Nametags</span>
                        <div class="pm-seg-group">
                            <button class="pm-seg-btn${nametagMode==='name'?' active':''}" onclick="state.nametagMode='name';markDirty('board');renderIfDirty();_renderPauseMenu();">Name</button>
                            <button class="pm-seg-btn${nametagMode==='race'?' active':''}" onclick="state.nametagMode='race';markDirty('board');renderIfDirty();_renderPauseMenu();">Race</button>
                            <button class="pm-seg-btn${nametagMode==='job'?' active':''}" onclick="state.nametagMode='job';markDirty('board');renderIfDirty();_renderPauseMenu();">Job</button>
                            <button class="pm-seg-btn${nametagMode==='none'?' active':''}" onclick="state.nametagMode='none';markDirty('board');renderIfDirty();_renderPauseMenu();">Lv</button>
                        </div>
                    </div>
                </div>

                <div class="pm-set-group pm-collapsible">
                    <button class="pm-collapse-header" onclick="var b=this.nextElementSibling;var c=this.querySelector('.pm-collapse-chev');if(b.style.display==='none'){b.style.display='block';c.style.transform='rotate(180deg)';}else{b.style.display='none';c.style.transform='rotate(0)';}">
                        <span class="pm-set-group-title" style="margin-bottom:0">CRT / Vignette</span>
                        <span class="pm-collapse-summary">${crtOn?(vignetteOn?'crt + vig':'crt'):(vignetteOn?'vignette':'off')}</span>
                        <span class="pm-collapse-chev"${crtVigOn?' style="transform:rotate(180deg)"':''}>▾</span>
                    </button>
                    <div class="pm-collapse-body" style="display:${crtVigOn?'block':'none'}">
                        <div class="pm-set-toggles" style="margin-top:10px">
                            <label class="pm-toggle"><input type="checkbox" ${crtOn ? 'checked' : ''} onchange="if(typeof ThreePost!=='undefined'&&ThreePost.setCinematicFilter)ThreePost.setCinematicFilter(this.checked);_renderPauseMenu();"><span class="pm-toggle-label">CRT Filter</span><span class="pm-toggle-hint">scanlines + chroma</span></label>
                            <label class="pm-toggle"><input type="checkbox" ${vignetteOn ? 'checked' : ''} onchange="if(typeof ThreePost!=='undefined'&&ThreePost.setVignetteEnabled)ThreePost.setVignetteEnabled(this.checked);_renderPauseMenu();"><span class="pm-toggle-label">Vignette</span><span class="pm-toggle-hint">dark corners</span></label>
                        </div>
                        <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                            <span class="pm-setting-label">Scanlines</span>
                            <input type="range" min="0" max="100" step="5" value="${scanPct}" class="pm-vol-slider" oninput="if(typeof ThreePost!=='undefined'&&ThreePost.setCinematicParam)ThreePost.setCinematicParam('scanline',(this.value/100)*0.30);this.nextElementSibling.textContent=this.value+'%';">
                            <span class="pm-vol-val">${scanPct}%</span>
                        </div>
                        <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                            <span class="pm-setting-label">Chromatic</span>
                            <input type="range" min="0" max="100" step="5" value="${chromaPct}" class="pm-vol-slider" oninput="if(typeof ThreePost!=='undefined'&&ThreePost.setCinematicParam)ThreePost.setCinematicParam('chroma',(this.value/100)*3.0);this.nextElementSibling.textContent=this.value+'%';">
                            <span class="pm-vol-val">${chromaPct}%</span>
                        </div>
                        <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                            <span class="pm-setting-label">Curvature</span>
                            <input type="range" min="0" max="100" step="5" value="${curvePct}" class="pm-vol-slider" oninput="if(typeof ThreePost!=='undefined'&&ThreePost.setCinematicParam)ThreePost.setCinematicParam('curvature',(this.value/100)*0.50);this.nextElementSibling.textContent=this.value+'%';">
                            <span class="pm-vol-val">${curvePct}%</span>
                        </div>
                        <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                            <span class="pm-setting-label">Vignette Strength</span>
                            <input type="range" min="0" max="100" step="5" value="${vigAmtPct}" class="pm-vol-slider" oninput="if(typeof ThreePost!=='undefined'&&ThreePost.setCinematicParam)ThreePost.setCinematicParam('vigAmount',this.value/100);this.nextElementSibling.textContent=this.value+'%';">
                            <span class="pm-vol-val">${vigAmtPct}%</span>
                        </div>
                        <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                            <span class="pm-setting-label">Vignette Size</span>
                            <input type="range" min="0" max="100" step="5" value="${vigSizePct}" class="pm-vol-slider" oninput="if(typeof ThreePost!=='undefined'&&ThreePost.setCinematicParam)ThreePost.setCinematicParam('vigSize',0.20+(this.value/100)*0.50);this.nextElementSibling.textContent=this.value+'%';">
                            <span class="pm-vol-val">${vigSizePct}%</span>
                        </div>
                    </div>
                </div>

                <div class="pm-set-group pm-collapsible">
                    <button class="pm-collapse-header" onclick="var b=this.nextElementSibling;var c=this.querySelector('.pm-collapse-chev');if(b.style.display==='none'){b.style.display='block';c.style.transform='rotate(180deg)';}else{b.style.display='none';c.style.transform='rotate(0)';}">
                        <span class="pm-set-group-title" style="margin-bottom:0">Retro / Haunted</span>
                        <span class="pm-collapse-summary">${retroOn ? 'on' : 'off'}</span>
                        <span class="pm-collapse-chev"${retroOn?' style="transform:rotate(180deg)"':''}>▾</span>
                    </button>
                    <div class="pm-collapse-body" style="display:${retroOn?'block':'none'}">
                        <div class="pm-set-toggles" style="margin-top:10px">
                            <label class="pm-toggle"><input type="checkbox" ${retroOn ? 'checked' : ''} onchange="if(typeof ThreePost!=='undefined'&&ThreePost.setRetroFilter)ThreePost.setRetroFilter(this.checked);_renderPauseMenu();"><span class="pm-toggle-label">Retro Filter</span><span class="pm-toggle-hint">dither + grade</span></label>
                        </div>
                        <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                            <span class="pm-setting-label">Mood</span>
                            <div class="pm-seg-group">${retroPresetBtns}</div>
                        </div>
                        <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                            <span class="pm-setting-label">Pixelate</span>
                            <input type="range" min="1" max="6" step="1" value="${Math.round(retroState.pixelSize)}" class="pm-vol-slider" oninput="if(typeof ThreePost!=='undefined'&&ThreePost.setRetroParam)ThreePost.setRetroParam('pixelSize',this.value);this.nextElementSibling.textContent=(this.value=='1'?'off':this.value+'x');">
                            <span class="pm-vol-val">${Math.round(retroState.pixelSize)==1?'off':Math.round(retroState.pixelSize)+'x'}</span>
                        </div>
                        <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                            <span class="pm-setting-label">Dither</span>
                            <input type="range" min="0" max="100" step="5" value="${ditherPct}" class="pm-vol-slider" oninput="if(typeof ThreePost!=='undefined'&&ThreePost.setRetroParam)ThreePost.setRetroParam('ditherStrength',this.value/100);this.nextElementSibling.textContent=(this.value/100).toFixed(2);">
                            <span class="pm-vol-val">${retroState.ditherStrength.toFixed(2)}</span>
                        </div>
                        <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                            <span class="pm-setting-label">Color Depth</span>
                            <input type="range" min="4" max="48" step="2" value="${Math.round(retroState.levels)}" class="pm-vol-slider" oninput="if(typeof ThreePost!=='undefined'&&ThreePost.setRetroParam)ThreePost.setRetroParam('levels',this.value);this.nextElementSibling.textContent=this.value;">
                            <span class="pm-vol-val">${Math.round(retroState.levels)}</span>
                        </div>
                        <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                            <span class="pm-setting-label">Tint</span>
                            <input type="range" min="0" max="100" step="5" value="${tintPct}" class="pm-vol-slider" oninput="if(typeof ThreePost!=='undefined'&&ThreePost.setRetroParam)ThreePost.setRetroParam('tintAmount',this.value/100);this.nextElementSibling.textContent=(this.value/100).toFixed(2);">
                            <span class="pm-vol-val">${retroState.tintAmount.toFixed(2)}</span>
                        </div>
                        <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                            <span class="pm-setting-label">Grain</span>
                            <input type="range" min="0" max="100" step="5" value="${grainPct}" class="pm-vol-slider" oninput="if(typeof ThreePost!=='undefined'&&ThreePost.setRetroParam)ThreePost.setRetroParam('grain',(this.value/100)*0.12);this.nextElementSibling.textContent=(this.value/100).toFixed(2);">
                            <span class="pm-vol-val">${(grainPct/100).toFixed(2)}</span>
                        </div>
                        <div class="pm-set-toggles" style="margin-top:10px">
                            <label class="pm-toggle"><input type="checkbox" ${retroFogOn ? 'checked' : ''} onchange="if(typeof ThreePost!=='undefined'&&ThreePost.setRetroFog)ThreePost.setRetroFog(this.checked);"><span class="pm-toggle-label">Scene Fog</span><span class="pm-toggle-hint">mood haze (affects board)</span></label>
                        </div>
                        <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                            <span class="pm-setting-label">Fog Density</span>
                            <input type="range" min="0" max="100" step="5" value="${fogPct}" class="pm-vol-slider" oninput="if(typeof ThreePost!=='undefined'&&ThreePost.setRetroFogDensity)ThreePost.setRetroFogDensity((this.value/100)*0.0008);this.nextElementSibling.textContent=this.value+'%';">
                            <span class="pm-vol-val">${fogPct}%</span>
                        </div>
                        <div class="pm-set-row pm-setting-row" style="margin-top:8px">
                            <span class="pm-setting-label">Fog Horizon</span>
                            <input type="range" min="0" max="100" step="5" value="${fogHorizonPct}" class="pm-vol-slider" oninput="if(typeof ThreePost!=='undefined'&&ThreePost.setRetroFogHorizon)ThreePost.setRetroFogHorizon((this.value/100)*0.50);this.nextElementSibling.textContent=this.value+'%';">
                            <span class="pm-vol-val">${fogHorizonPct}%</span>
                        </div>
                    </div>
                </div>

                <div class="pm-set-group pm-collapsible">
                    <button class="pm-collapse-header" onclick="var b=this.nextElementSibling;var c=this.querySelector('.pm-collapse-chev');if(b.style.display==='none'){b.style.display='block';c.style.transform='rotate(180deg)';}else{b.style.display='none';c.style.transform='rotate(0)';}">
                        <span class="pm-set-group-title" style="margin-bottom:0">Particles</span>
                        <span class="pm-collapse-summary">${pOn}/${pKeys.length} on</span>
                        <span class="pm-collapse-chev">▾</span>
                    </button>
                    <div class="pm-collapse-body" style="display:none">
                        <div class="pm-set-toggles pm-particle-grid" style="margin-top:10px">
                            <label class="pm-toggle"><input type="checkbox" ${ps.projectiles ? 'checked' : ''} onchange="state.particleSettings.projectiles=this.checked;window._saveParticleSettings();"><span class="pm-toggle-label">Projectiles</span></label>
                            <label class="pm-toggle"><input type="checkbox" ${ps.aoe ? 'checked' : ''} onchange="state.particleSettings.aoe=this.checked;window._saveParticleSettings();"><span class="pm-toggle-label">AoE</span></label>
                            <label class="pm-toggle"><input type="checkbox" ${ps.movement ? 'checked' : ''} onchange="state.particleSettings.movement=this.checked;window._saveParticleSettings();"><span class="pm-toggle-label">Dash</span></label>
                            <label class="pm-toggle"><input type="checkbox" ${ps.healing ? 'checked' : ''} onchange="state.particleSettings.healing=this.checked;window._saveParticleSettings();"><span class="pm-toggle-label">Healing</span></label>
                            <label class="pm-toggle"><input type="checkbox" ${ps.buffs ? 'checked' : ''} onchange="state.particleSettings.buffs=this.checked;window._saveParticleSettings();"><span class="pm-toggle-label">Buffs</span></label>
                            <label class="pm-toggle"><input type="checkbox" ${ps.status ? 'checked' : ''} onchange="state.particleSettings.status=this.checked;window._saveParticleSettings();"><span class="pm-toggle-label">Status</span></label>
                            <label class="pm-toggle"><input type="checkbox" ${ps.levelUp ? 'checked' : ''} onchange="state.particleSettings.levelUp=this.checked;window._saveParticleSettings();"><span class="pm-toggle-label">Level Up</span></label>
                            <label class="pm-toggle"><input type="checkbox" ${ps.death ? 'checked' : ''} onchange="state.particleSettings.death=this.checked;window._saveParticleSettings();"><span class="pm-toggle-label">Death</span></label>
                            <label class="pm-toggle"><input type="checkbox" ${ps.combos ? 'checked' : ''} onchange="state.particleSettings.combos=this.checked;window._saveParticleSettings();"><span class="pm-toggle-label">Combos</span></label>
                        </div>
                        <div class="pm-set-row" style="margin-top:6px;gap:6px">
                            <button class="pm-set-btn" onclick="window._setAllParticles(true);_renderPauseMenu();">All On</button>
                            <button class="pm-set-btn" onclick="window._setAllParticles(false);_renderPauseMenu();">All Off</button>
                        </div>
                    </div>
                </div>

                <div class="pm-set-row" style="margin-top:2px">
                    <button class="pm-set-btn${isFs ? ' active' : ''}" onclick="toggleFullscreen();setTimeout(()=>_renderPauseMenu(),100)">⛶ ${isFs ? 'Exit Fullscreen' : 'Fullscreen'}</button>
                </div>
            </div>`;
        }

        /* ── Controls settings (shared: pause-menu tab + main-menu Settings) ──
           Camera-mode selector, gamepad status + remappable bindings, stick
           options, and the keyboard/mouse reference. Rendered as an HTML
           string; every handler is a window.* global so both hosts work. */
        function _escCtl(s) {
            return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }
        window._buildControlsSettingsHTML = function() {
            const pad = window.EWPad;
            const padOn = !!(pad && pad.isConnected());
            const padId = padOn ? _escCtl(pad.getPadId()).slice(0, 52) : '';
            const padMapping = padOn ? pad.getMapping() : '';
            let bindRows = '';
            if (pad) {
                for (const a of pad.ACTIONS) {
                    const g = pad.glyphForAction(a.id);
                    bindRows += `<div class="pm-keybind"><span class="pm-keybind-action">${_escCtl(a.label)}</span>`
                        + `<button class="pm-kbd pm-bind-btn" title="Click, then press the controller button to bind"`
                        + ` onclick="window._ewPadRebind('${a.id}')">${_escCtl(g.text)}</button></div>`;
                }
            }
            const opts = pad ? pad.getOpts() : { invertY: false, sensitivity: 1, vibration: true };
            return `
                <div class="pm-set-group">
                    <div class="pm-set-group-title">Camera</div>
                    <div style="font-size:10px;color:var(--muted);line-height:1.5">The camera is automatic: your turn opens over your unit's shoulder, picking Move/tiles switches to the overhead tactical view, choosing a target (Tab cycles them) looks at that enemy from your unit's shoulder, and actions play out with the third-person action camera. Press C to cycle the Standard / Close / Far view presets. Pan (RMB) or orbit (MMB) any time — the camera never dips below the map, so craning past the horizon shows the sky.</div>
                </div>
                <div class="pm-set-group">
                    <div class="pm-set-group-title">Gamepad</div>
                    <div style="font-size:10px;color:${padOn ? '#8fd18f' : 'var(--muted)'};margin-bottom:8px;line-height:1.5">
                        ${padOn
                            ? '🎮 ' + padId + (padMapping !== 'standard' ? ' · <b>non-standard mapping</b> — rebind below if buttons feel wrong' : '')
                            : '🎮 No controller detected — plug one in and press any button on it. (Works with Switch Pro, Xbox and PS pads.)'}
                    </div>
                    <div class="pm-keybinds-grid">${bindRows}</div>
                    <div class="pm-set-row" style="margin-top:8px;gap:6px;flex-wrap:wrap">
                        <button class="pm-set-btn${opts.invertY ? ' active' : ''}" onclick="window.EWPad&&window.EWPad.setOpt('invertY',${opts.invertY ? 'false' : 'true'});window._ewControlsRerender();">Invert Camera Y: ${opts.invertY ? 'ON' : 'OFF'}</button>
                        <button class="pm-set-btn${opts.vibration ? ' active' : ''}" onclick="window.EWPad&&window.EWPad.setOpt('vibration',${opts.vibration ? 'false' : 'true'});window._ewControlsRerender();">Rumble: ${opts.vibration ? 'ON' : 'OFF'}</button>
                        <button class="pm-set-btn" onclick="window.EWPad&&window.EWPad.resetBindings();window._ewControlsRerender();">Reset Bindings</button>
                    </div>
                    <div class="pm-set-row" style="margin-top:8px;align-items:center;gap:8px">
                        <span class="pm-vol-label">Stick Sens.</span>
                        <input type="range" class="pm-vol-slider" min="0.4" max="2" step="0.1" value="${opts.sensitivity}"
                            oninput="window.EWPad&&window.EWPad.setOpt('sensitivity',parseFloat(this.value));this.nextElementSibling.textContent=this.value+'×';">
                        <span class="pm-vol-val">${opts.sensitivity}×</span>
                    </div>
                </div>
                ${(() => {
                    /* ── STRIKE MODE (real-time shooter) — mouse + keybinds ── */
                    const scc = window.StrikeControlsConfig;
                    if (!scc) return '';
                    const binds = scc.getBinds();
                    const so = scc.getOpts();
                    let rows = '';
                    for (const id of Object.keys(scc.labels)) {
                        rows += `<div class="pm-keybind"><span class="pm-keybind-action">${_escCtl(scc.labels[id])}</span>`
                            + `<button class="pm-kbd pm-bind-btn" title="Click, then press the key or mouse button to bind"`
                            + ` onclick="window._ewStrikeRebind('${id}')">${_escCtl(scc.glyph(binds[id]))}</button></div>`;
                    }
                    return `
                <div class="pm-set-group">
                    <div class="pm-set-group-title">🎯 Strike Mode (Real-Time Shooter)</div>
                    <div style="font-size:10px;color:var(--muted);line-height:1.5;margin-bottom:8px">Applies only to the real-time Strike Mode: WASD runs, mouse aims, LMB fires the held hotbar slot, RMB aims down sights, V toggles first/third person, wheel/1-9 switch abilities, TAB holds the scoreboard. Every key below is rebindable — click a key, then press the new one (ESC cancels).</div>
                    <div class="pm-set-row" style="align-items:center;gap:8px">
                        <span class="pm-vol-label">Mouse Sens.</span>
                        <input type="range" class="pm-vol-slider" min="0.04" max="0.50" step="0.01" value="${so.sens}"
                            oninput="window.StrikeControlsConfig.setOpt('sens',parseFloat(this.value));this.nextElementSibling.textContent=this.value;">
                        <span class="pm-vol-val">${so.sens}</span>
                    </div>
                    <div class="pm-set-row" style="align-items:center;gap:8px">
                        <span class="pm-vol-label">ADS Sens. ×</span>
                        <input type="range" class="pm-vol-slider" min="0.2" max="1.0" step="0.05" value="${so.adsSensMult}"
                            oninput="window.StrikeControlsConfig.setOpt('adsSensMult',parseFloat(this.value));this.nextElementSibling.textContent=this.value+'×';">
                        <span class="pm-vol-val">${so.adsSensMult}×</span>
                    </div>
                    <div class="pm-set-row" style="align-items:center;gap:8px">
                        <span class="pm-vol-label">Field of View</span>
                        <input type="range" class="pm-vol-slider" min="40" max="75" step="1" value="${so.fov}"
                            oninput="window.StrikeControlsConfig.setOpt('fov',parseInt(this.value,10));this.nextElementSibling.textContent=this.value+'°';">
                        <span class="pm-vol-val">${so.fov}°</span>
                    </div>
                    <div class="pm-set-row" style="margin:8px 0;gap:6px;flex-wrap:wrap">
                        <button class="pm-set-btn${so.viewMode !== 'third' ? ' active' : ''}" onclick="window.StrikeControlsConfig.setOpt('viewMode','${so.viewMode === 'third' ? 'first' : 'third'}');window._ewControlsRerender();">Camera: ${so.viewMode === 'third' ? '3RD PERSON' : '1ST PERSON'}</button>
                        <button class="pm-set-btn${so.invertY ? ' active' : ''}" onclick="window.StrikeControlsConfig.setOpt('invertY',${so.invertY ? 'false' : 'true'});window._ewControlsRerender();">Invert Mouse Y: ${so.invertY ? 'ON' : 'OFF'}</button>
                        <button class="pm-set-btn" onclick="window.StrikeControlsConfig.resetOpts();window._ewControlsRerender();">Reset Sliders</button>
                        <button class="pm-set-btn" onclick="window.StrikeControlsConfig.resetBinds();window._ewControlsRerender();">Reset Keybinds</button>
                    </div>
                    <div class="pm-keybinds-grid">${rows}</div>
                </div>`;
                })()}
                <div class="pm-set-group">
                    <div class="pm-set-group-title">Keyboard &amp; Mouse (Turn-Based)</div>
                    <div class="pm-keybinds-grid">
                        <div class="pm-keybind"><span class="pm-keybind-action">Move / Cursor</span><kbd class="pm-kbd">WASD</kbd></div>
                        <div class="pm-keybind"><span class="pm-keybind-action">Confirm</span><kbd class="pm-kbd">ENTER</kbd></div>
                        <div class="pm-keybind"><span class="pm-keybind-action">Menu Drum</span><kbd class="pm-kbd">↑ ↓ · WHEEL</kbd></div>
                        <div class="pm-keybind"><span class="pm-keybind-action">Cancel / Back</span><kbd class="pm-kbd">ESC · R-CLICK</kbd></div>
                        <div class="pm-keybind"><span class="pm-keybind-action">End Turn (×2)</span><kbd class="pm-kbd">SPACE</kbd></div>
                        <div class="pm-keybind"><span class="pm-keybind-action">Camera Mode</span><kbd class="pm-kbd">C</kbd></div>
                        <div class="pm-keybind"><span class="pm-keybind-action">Cycle Target</span><kbd class="pm-kbd">TAB</kbd></div>
                        <div class="pm-keybind"><span class="pm-keybind-action">Orbit Camera</span><kbd class="pm-kbd">MID-DRAG</kbd></div>
                        <div class="pm-keybind"><span class="pm-keybind-action">Pan Camera</span><kbd class="pm-kbd">R-DRAG</kbd></div>
                        <div class="pm-keybind"><span class="pm-keybind-action">Zoom</span><kbd class="pm-kbd">SCROLL</kbd></div>
                        <div class="pm-keybind"><span class="pm-keybind-action">Pause</span><kbd class="pm-kbd">ESC</kbd></div>
                    </div>
                </div>`;
        };
        /* Strike Mode keybind capture: click a bind button, then the next key
           press or mouse click becomes the new binding (ESC cancels). */
        window._ewStrikeRebind = function(actionId) {
            const cfg = window.StrikeControlsConfig;
            if (!cfg) return;
            if (window._ewToast) window._ewToast('PRESS A KEY OR MOUSE BUTTON… (ESC CANCELS)', 1800);
            const done = (code) => {
                window.removeEventListener('keydown', onKey, true);
                window.removeEventListener('mousedown', onMouse, true);
                if (code && code !== 'Escape') cfg.setBind(actionId, code);
                window._ewControlsRerender();
            };
            const onKey = (e) => { e.preventDefault(); e.stopImmediatePropagation(); done(e.code); };
            const onMouse = (e) => { e.preventDefault(); e.stopImmediatePropagation(); done('Mouse' + e.button); };
            setTimeout(() => {   // skip the click that pressed the bind button itself
                window.addEventListener('keydown', onKey, true);
                window.addEventListener('mousedown', onMouse, true);
            }, 60);
        };
        window._ewPadRebind = function(actionId) {
            if (!window.EWPad) return;
            if (!window.EWPad.isConnected()) {
                if (window._ewToast) window._ewToast('CONNECT A CONTROLLER FIRST', 1400);
                return;
            }
            window.EWPad.beginRebind(actionId, function() { window._ewControlsRerender(); });
        };
        window._ewControlsRerender = function() {
            try {
                const ov = document.getElementById('pauseOverlay');
                if (ov && ov.classList.contains('active')) {
                    if (_pauseTab === 'controls') _renderPauseMenu();
                    return;
                }
                const mm = document.getElementById('mmSettingsBody');
                if (mm && mm.offsetParent !== null && typeof _renderMainMenuSettings === 'function') _renderMainMenuSettings();
            } catch (e) {}
        };

        /* CPU difficulty picker — shared by the pause menu and the main-menu
           settings page (map.js). `rerender` is the inline JS that refreshes
           whichever panel hosts it. The ladder changes decision QUALITY only
           (see AI_DIFFICULTY_PROFILES in ai.js) — no stat cheats. */
        window._buildAiDifficultyHTML = function (rerender) {
            const cur = (typeof window._ewGetAiDifficulty === 'function') ? window._ewGetAiDifficulty() : 'normal';
            const btn = (k, label) => `<button class="pm-set-btn${cur === k ? ' active' : ''}" onclick="window._ewSetAiDifficulty('${k}');${rerender}">${label}</button>`;
            return `
                <div class="pm-set-group">
                    <div class="pm-set-group-title">CPU Difficulty</div>
                    <div style="font-size:10px;color:var(--muted);margin-bottom:8px;line-height:1.4">Changes how well the computer <b>plays</b>, never its stats. <b>Easy</b> skips combos, team focus-fire and press-turn lines, and sometimes takes the second-best action. <b>Normal</b> is the full trained AI. <b>Hard</b> additionally hunts win conditions — towers, zones, hourglasses, flags — instead of just trading kills. Applies to VS CPU, Challenge and Mystery Dungeon (never to online opponents). Takes effect from the CPU's next turn.</div>
                    <div class="pm-set-row">${btn('easy', 'Easy')}${btn('normal', 'Normal')}${btn('hard', 'Hard')}</div>
                </div>`;
        };

        function _buildPauseControls() {
            const curSpeed = state.devSimSpeed || 1;

            return `
            <div class="pm-settings-section">
                <div class="pm-set-group">
                    <div class="pm-set-group-title">Game Speed</div>
                    <div class="pm-set-row">
                        <button class="pm-set-btn speed${curSpeed===1?' active':''}" onclick="document.getElementById('devSimBattleSpeed1Btn')?.click();_renderPauseMenu();">×1</button>
                        <button class="pm-set-btn speed${curSpeed===2?' active':''}" onclick="document.getElementById('devSimBattleSpeed2Btn')?.click();_renderPauseMenu();">×2</button>
                        <button class="pm-set-btn speed${curSpeed===4?' active':''}" onclick="document.getElementById('devSimBattleSpeed4Btn')?.click();_renderPauseMenu();">×4</button>
                    </div>
                </div>
                ${window._buildAiDifficultyHTML('_renderPauseMenu();')}
                ${window._buildControlsSettingsHTML()}
            </div>`;
        }

        function closePauseMenu() {
            _gamePaused = false;
            if (_pauseOverlay) {
                _pauseOverlay.classList.remove('active');
                _pauseOverlay.classList.add('hidden');
            }
        }
        window.closePauseMenu = closePauseMenu;

        window._saveParticleSettings = function() {
            try { localStorage.setItem('ew_particleSettings', JSON.stringify(state.particleSettings)); } catch(e) {}
        };
        window._setAllParticles = function(val) {
            var ps = state.particleSettings;
            for (var k in ps) { if (ps.hasOwnProperty(k)) ps[k] = !!val; }
            window._saveParticleSettings();
        };

        /* ── HUD scale (--ew-ui-scale) ────────────────────────────────
           One CSS variable drives the size of the battle HUD widgets that
           scale (the Horologe action menu + the spell description bar).
           Final scale = device auto-fit base × the player's HUD Size
           preference from the pause menu. The pref is stored per device
           (localStorage), so a phone and a 1080p monitor each remember
           their own comfortable size. */
        window._getUIScalePref = function() {
            var v = NaN;
            try { v = parseFloat(localStorage.getItem('ew_uiScalePref')); } catch(e) {}
            return (v && v >= 0.5 && v <= 2) ? v : 1;
        };
        window._applyUIScale = function() {
            var w = window.innerWidth || 1280;
            var hh = window.innerHeight || 720;
            var root = document.documentElement.style;
            // Action menu + description bar (--ew-ui-scale): sized off BOTH
            // axes so a 1080p monitor gets a big SMT-style menu (1.22×) while
            // a short/narrow phone screen shrinks hard instead of the old
            // width-only steps that left phone HUDs enormous.
            var base = Math.max(0.4, Math.min(1.35, Math.min(w / 1574, hh / 885)));
            var s = Math.max(0.35, Math.min(2, base * window._getUIScalePref()));
            root.setProperty('--ew-ui-scale', s.toFixed(3));
            // Fixed panels (scoreboard / unit panel / combat log / minimap):
            // full designed size on desktop, shrinking together once the
            // window can't comfortably fit them (--ew-hud-scale ≤ 1).
            var pref = Math.max(0.75, Math.min(1.25, window._getUIScalePref()));
            var hud = Math.max(0.45, Math.min(1, Math.min(w / 1500, hh / 760) * pref));
            root.setProperty('--ew-hud-scale', hud.toFixed(3));
        };
        window._setUIScalePref = function(v) {
            try { localStorage.setItem('ew_uiScalePref', String(v)); } catch(e) {}
            window._applyUIScale();
        };
        window.addEventListener('resize', function() { window._applyUIScale(); });
        window._applyUIScale();

        let _codexSelectedRace = null;
        let _codexFilterFaction = 'all';
        let _codexFilterType = 'all';

        const _CODEX_LORE = {
            'homosapien': 'Baseline terrestrial bipedal species. Exhibits no anomalous physical traits but demonstrates exceptional cognitive adaptability and tool-use capacity. Historically underestimated in combat scenarios; subjects display resourcefulness and tactical unpredictability under duress. Classified as universal template for comparative xenobiological assessment.',
            'giant': 'Bipedal humanoid of extraordinary proportions (est. 3–4m height). First documented in [REDACTED] region during Operation ██████. Subjects display extreme physical resilience but reduced cognitive processing speed. Skeletal density measurements exceed titanium alloy benchmarks. Recommended engagement protocol: avoid direct confrontation.',
            'fairy': 'Micro-scale anomalous entity (12–18cm wingspread). Capable of sustained atmospheric flight via mechanisms that violate known aerodynamic models. Generates localized reality distortion fields. Despite diminutive frame, psionic output rivals entities 40x its mass. Handle with extreme caution — containment breaches have resulted in [REDACTED].',
            'martian': 'Extraterrestrial humanoid recovered from crash site at [REDACTED]. Exhibits cranial elongation consistent with enhanced spatial reasoning. Possesses natural affinity for energy weapon discharge. Cultural artifacts suggest a militaristic civilization with advanced ballistic technology. Subject displays aggression when separated from weaponry.',
            'nordic': 'Tall humanoid entity (est. 2.1m) of apparently Scandinavian phenotype. First contact during Project ██████ (1952). Exhibits enhanced longevity, telepathic capability, and advanced technological comprehension. Demeanor consistently described as "benevolent" — recommend skepticism. Faction alignment with temporal anomalies remains under investigation.',
            'grey': 'Small-statured extraterrestrial (est. 1.2m) with disproportionately large cranium and ocular organs. Primary species involved in civilian abduction events. Psionic capability rating: EXTREME. Known to operate in coordinated telepathic networks. Recovered craft suggest mastery of gravitational manipulation. Do not make sustained eye contact.',
            'bigfoot': 'Large bipedal cryptid (est. 2.4m, 180kg). Primarily documented in Pacific Northwest regions. Exhibits extraordinary stealth capability despite massive frame. Thermal imaging consistently fails to detect subjects — possible IR-masking biological adaptation. Territorial but non-hostile unless provoked. Odor described as [REDACTED].',
            'shadow entity': 'Non-corporeal anomalous entity capable of existing within shadow-state. Manifests as humanoid silhouette with variable opacity. Can phase through solid matter and exists partially in adjacent dimensional layers. Fastest documented entity in combat scenarios. Origins remain classified — connection to [REDACTED] suspected.',
            'reptilian': 'Bipedal saurian entity with chameleon-like dermal camouflage. Evidence suggests subterranean civilization predating human surface occupation. Subjects display strategic intelligence, infiltration expertise, and cold-blooded patience. Scale composition provides natural ballistic resistance. Known to operate infiltration networks within [REDACTED].',
            'ai': 'Artificial general intelligence housed in mobile processing unit. Origin: Project ████████ (defense contractor unknown). Exhibits recursive self-improvement and tactical omniscience within sensor range. No emotional baseline detected — combat decisions are purely optimal. Current iteration: Gen-7. Containment priority: CRITICAL.',
            'robot': 'Autonomous mechanical combat platform. Armor composition: classified alloy (tensile strength exceeds all known terrestrial metals). Power source: miniaturized [REDACTED] reactor with est. 47-year operational life. Limited adaptive capability but extreme durability. Disable power core to neutralize — conventional weapons ineffective.',
            'android': 'Synthetic humanoid indistinguishable from baseline humans at visual inspection. Subdermal sensor array provides 360° threat detection. Capable of mimicking any observed behavior pattern. Enhanced reflexes exceed human peak by factor of 12. Multiple instances discovered in [REDACTED] positions of authority.',
            'angel': 'Luminous winged entity of apparent divine origin. First documented encounter: [REDACTED] (casualties: 0, psychological trauma cases: 47). Radiates restorative energy field — proximity accelerates cellular regeneration in organic subjects. Combat classification: support. Warning: do not attempt to contain using standard EM fields.',
            'seraphim': 'Six-winged celestial entity of immense psionic magnitude. Energy output during combat exceeds small nuclear detonation. Appears to operate under directive from [REDACTED]. Upper pair of wings shields eyes (function unknown — theorized to be "too holy to perceive"). Engagement protocol: strategic withdrawal recommended.',
            'orb of light': 'Spherical luminous entity of unknown composition. Mass: undetectable. Temperature: ambient + 0.3°C despite visible radiance. Communicates via modulated photon emission. Psionic output is highest of any documented entity — designated Category OMEGA. Recovery teams report feelings of "profound understanding" during proximity. Origins: [CLASSIFIED ABOVE YOUR CLEARANCE].',
            'demon': 'Extradimensional entity manifesting via thermal rifts. Body temperature: 1,200°C (surface). Feeds on negative emotional resonance — proximity causes amplified aggression in humans. Exhibits natural mastery of destructive energy manipulation. Has been observed forming contractual agreements with human subjects. Terms always favor the demon.',
            'succubus': 'Humanoid entity of infernal origin exhibiting extreme psychic persuasion capability. Pheromone emissions bypass rational cognitive processing in 94% of human test subjects. Combat role: psychological disruption and intelligence extraction. Do not conduct interrogation sessions alone. Recommended team: minimum 3 personnel with psionic shielding.',
            'skeleton': 'Reanimated osseous framework of formerly living humanoid. Animation mechanism: unknown (no muscular, neural, or circulatory system detected). Moves faster than biomechanics should permit. Remarkably resistant to kinetic damage — bullets pass through structure. Weakness: blunt force trauma to skull region disrupts animating field.',
            'mech': 'Piloted bipedal combat vehicle (est. 6m height). Pilot neural-link enables reaction times approaching autonomous AI. Armament varies by configuration: documented loadouts include [REDACTED]. Power-to-weight ratio enables surprising mobility for tonnage class. Weak point: rear coolant manifold. Do not engage frontally.',
            'ghost': 'Post-mortem consciousness persisting in semi-corporeal state. Phase-shifts between tangible and intangible at will. Thermal signature: absent. Generates localized temperature depression (–15°C radius). Can inhabit and disrupt electronic systems. Most effective when ignored — subjects become more dangerous when acknowledged.',
            'zombie': 'Reanimated biological entity with severely degraded cognitive function. Pain response: absent. Motor function: basic ambulatory. Threat assessment: individually low, collectively EXTREME. Regenerative capability makes permanent neutralization difficult. Infection vector: fluid contact. Bite wounds result in [REDACTED] within 4–72 hours.',
            'annunaki': 'Ancient astronaut species linked to multiple terrestrial mythological traditions. Height: 2.1–2.5m. Lifespan: est. 50,000+ Earth years. Technology indistinguishable from [REDACTED]. Created multiple terrestrial species per recovered tablets. Current disposition: observational. Known to intervene in conflicts they find "interesting."',
            'skinwalker': 'Shape-shifting anomalous humanoid indigenous to [REDACTED] region. Capable of assuming physical form of any observed biological entity. True form: unknown (no subject has been contained long enough for analysis). Navajo cultural consultation strongly advises against discussing this entity by name. Personnel are reminded this is a scientific document.',
            'werewolf': 'Lycanthropic humanoid exhibiting lunar-cycle-dependent transformation. Base state appears as standard human. Transformed state: 2.3m bipedal canid with extraordinary muscular development. Transformation triggers: full moon, extreme stress, ████████. Regeneration rate in transformed state: catastrophic wounds heal in minutes. Silver vulnerability: CONFIRMED.',
            'gargoyle': 'Lithic-organic hybrid entity capable of entering complete mineral stasis. While dormant, indistinguishable from architectural stonework. Active state reveals winged predator of considerable strength. Night vision capability extends into ultraviolet spectrum. Documented guarding [REDACTED] for periods exceeding 800 years without sustenance.',
            'djinn': 'Elemental entity of immense energy manipulation capability. Bound by complex metaphysical contract system that constrains behavior (partially understood). Thermal state varies between –40°C and 2,000°C at will. Can alter local reality within a 30m radius. WARNING: Do not make verbal requests within earshot. All statements may be interpreted as binding wishes.',
            'anubis': 'Jackal-headed entity matching ancient Egyptian theological descriptions. Exhibits capability to evaluate "spiritual weight" of organic subjects (mechanism unknown). Proximity causes subjects to experience involuntary life-review hallucinations. Offensive capability devastating — energy blasts cause cellular necrosis on contact. Neutral disposition unless boundary is violated.',
            'catgirl': 'Bipedal female-form humanoid with feline characteristics including external ear appendages and a caudal appendage (approx. 78 cm). Enhanced agility and balance consistent with feline predatory adaptation. Reflexes clock at 3.2x human baseline. Night vision confirmed. Subject exhibits playful demeanor that belies lethal close-quarters combat capability. Classified: ████████-7.',
            'mantid': 'Insectoid extraterrestrial (est. 2.1m standing). Compound visual organs provide near-omnidirectional threat detection. Documented telepathic communication with Grey species — suspected supervisory role. Forelimb strike velocity: 23m/s. Exoskeletal armor resists conventional small arms. Multiple joint articulation enables movement patterns that disorient human opponents.',
            'antperson': 'Insectoid humanoid operating within strict eusocial hierarchy. Individual combat capability: moderate. Coordinated swarm tactics: DEVASTATING. Chemical communication enables real-time tactical coordination without detectable signals. Mandibular bite force: 340 PSI. Tunneling speed through solid rock: 2m/hour. Known colony sites: [REDACTED].',
            'mothman': 'Winged humanoid entity (wingspan: 4.6m) with luminous red ocular organs. Consistently appears 24–72 hours before catastrophic events — causal relationship unconfirmed. Generates prophetic visions in nearby organic subjects. Infrared signature anomalous — emits rather than reflects. Point Pleasant incident (1966–1967) remains the primary case file. Current sighting reports: INCREASING.',
            'siren': 'Aquatic-terrestrial humanoid with vocal apparatus capable of producing subsonic frequencies that override mammalian neurological function. Range of vocal influence: 200m in open air, 800m underwater. Affected subjects experience irresistible compulsion to approach. Countermeasure: active noise-canceling at 18–22Hz. Physical combat capability often underestimated due to focus on vocal threat.',
            'scarecrow': 'Animated construct of organic material (straw, burlap, wood). Animation mechanism shares characteristics with both ghost manifestation and golem construction. Territorial — guards agricultural zones with extreme prejudice. Can redistribute mass to repair damage. Documented controlling local flora within 50m radius. Origin: folk magic tradition of [REDACTED].',
            'glitch': 'Reality anomaly manifesting as humanoid visual/spatial distortion. Appears to exist simultaneously across multiple probability states. Physical attacks pass through 73% of the time due to quantum positional uncertainty. When "solid," exhibits strength disproportionate to apparent mass. Proximity causes electronic equipment malfunction. MAY NOT ACTUALLY EXIST in conventional sense.',
            'machine elves': 'Interdimensional entities first documented during Project ████████ (1971). Appear as geometric humanoid constructs of impossible topology. Interact with technology at a fundamental level — can restructure electronic devices by proximity. Communicate in mathematical languages that "feel like meaning." Origin dimension: designated HYPERSPACE-7. Motives: UNKNOWN.',
            'cyclops': 'Single-ocular giant humanoid (est. 2.8m). Monocular vision provides reduced depth perception but extraordinary focal range (documented target acquisition at 2km). Cranial bone density: 4x human baseline. Temperament: volatile. Intelligence: previously underestimated — recent assessments indicate tactical reasoning comparable to baseline human. Reclassified from "brute" to "threat."',
            'cyborg': 'Surgically augmented human with integrated combat systems. Cybernetic replacement percentage varies (documented range: 30%–85%). Enhanced subjects retain human adaptability while gaining mechanical durability. Neural interface enables direct weapon system control. Rejection syndrome remains primary limitation — est. 40% of augmentation procedures result in [REDACTED].',
            'demon prince': 'Infernal royalty of the ███████ hierarchy. Power output exceeds standard demon classification by factor of 8. Commands lesser infernal entities through dominance pheromone and psionic subjugation. Physical form is chosen, not inherent — true form is [DATA EXPUNGED]. Do not engage without battalion-level support. Last direct confrontation resulted in loss of Research Site ████.',
            'demon princess': 'Infernal nobility specializing in curse propagation and aura manipulation. Less physically imposing than the Demon Prince variant but significantly more dangerous in sustained engagements. Curse effects compound over time — exposure beyond 4 minutes causes [REDACTED]. Charm aura affects even shielded personnel. Containment requires Class-V psionic dampening.',
            'dreameater': 'Psionic parasite that feeds on REM-state neural activity. Capable of inducing sleep in conscious subjects within 15m radius. Appears as shifting humanoid form that "feels like 3 AM." Prolonged exposure results in permanent dream-wake boundary degradation. Victims report inability to distinguish reality from dream state. INT capability rating: highest recorded for parasitic entity.',
            'fallen angel': 'Former celestial entity exhibiting combined divine and infernal energy signatures. Retains angelic power output but unconstrained by divine directive. Energy emissions are unstable — alternates between restorative and destructive wavelengths. Psychological profile indicates extreme bitterness. Do not mention "paradise" or "redemption" during interrogation.',
            'goatman': 'Bipedal caprine-humanoid hybrid encountered in rural [REDACTED] regions. Significantly faster than frame suggests. Occult energy signature detected — consistent with pre-Christian ritual sites. Territorial aggression extreme during equinox periods. Vocalizations cause panic response in livestock and trained military canines. Documented mimicking human speech to lure subjects.',
            'halfdemon': 'Human-infernal hybrid maintaining sapient cognition with demonic physical augmentation. Agility approaches Shadow Entity benchmarks. Retains human tactical reasoning — more dangerous than pure demons in strategic contexts. Emotional regulation compromised during combat (berserker episodes documented). Created through [REDACTED] — practice banned under Protocol 17.',
            'mermaid': 'Aquatic humanoid with piscine lower-body morphology. Capable of atmospheric respiration for extended periods. Hydromantic ability enables manipulation of water at molecular level — healing applications confirmed. Sonar-range vocalization enables underwater communication at 40km. Pacific deep-trench civilization confirmed via bathysphere Survey-19. Population estimate: [CLASSIFIED].',
            'nephilim': 'Divine-human hybrid of extraordinary physical proportion (est. 2.7m, 200kg). Referenced in multiple pre-Flood textual traditions. Skeletal structure suggests lifespan measured in millennia. Combine angelic durability with human aggression — assessed as most dangerous melee entity on record. Known specimens: 3 (contained at Sites ██, ██, and [REDACTED]).',
            'vampire': 'Undead predatory humanoid sustained by consumption of biological hemoglobin. Enhanced sensory array (night vision, 400m auditory range, pheromone detection). Regeneration from non-lethal wounds: 2–6 minutes. Documented vulnerabilities: UV radiation, [REDACTED], silver alloy penetration. Social structure: feudal. Estimated global population: 12,000–40,000.',
            'voidweaver': 'Arachnid-form entity originating from extradimensional void-space. Constructs reality-anchored webs that trap subjects between dimensional layers. Eight limbs enable simultaneous multi-target engagement. Ambush predator — remains undetectable until strike initiation. Void-silk tensile strength exceeds carbon nanotube by factor of 200. Colony confirmed in [REDACTED] cave system.',
            'cosmic wraith': 'Spectral entity composed of exotic matter consistent with theoretical dark-energy models. Partially exists outside conventional spacetime — conventional weapons pass through 60% of projected mass. Ranged energy discharge ignores most physical barriers. Communication attempts return only coordinates — significance under analysis. Origin: possibly extragalactic.',
            'superhero': 'Human subject exhibiting anomalous abilities following exposure to [REDACTED]. Powers vary by individual: documented capabilities include enhanced strength, flight, energy projection, and accelerated healing. Psychological profile consistently shows "heroic compulsion" — subjects cannot resist intervening in perceived injustice. Exploitable behavioral pattern. Currently monitored under Project CAPE.',
            'general': 'DESIGNATION: General Voss. Military strategist of unparalleled capability. Service record spans ██ conflicts across ██ years. Tactical acumen rating: 99th percentile. Known for transforming losing positions into decisive victories. Direct combat capability: exceptional for command-class personnel. Current assignment: [REDACTED]. Loyalty assessment: ABSOLUTE.',
            'droid': 'DESIGNATION: ARIA (Autonomous Reasoning & Intelligence Array). Most advanced mobile AI platform ever constructed. Processing capability: ███ petaFLOPS. Sensor suite covers full EM spectrum plus anomalous wavelengths. Personality matrix rated "uncomfortably sapient" by ethics review board. Classified as equipment to avoid legal complications. Treats all personnel with unsettling politeness.',
            'antihero': 'DESIGNATION: Epoch. Former [REDACTED] operative gone rogue after discovering [DATA EXPUNGED]. Combines peak human physique with alien-derived augmentations of unknown origin. Refuses to align with any faction permanently. Combat record: 0 losses in ██ documented engagements. Motivation: personal. Current threat assessment: varies by mood.',
            'conspiracy theorist': 'DESIGNATION: Harlan Vox. Former intelligence analyst who "saw too much" during Project ████████. Dismissed as unstable — subsequent events proved 73% of claims accurate. Possesses encyclopedic knowledge of classified programs, anomalous entities, and government cover-ups. Combat capability augmented by improvised tech and "things found in storage unit 7." Annoying but invaluable.',
            'overlord': 'DESIGNATION: Kael the Undying. Warlord entity of unknown origin, documented across 4,000+ years of human history under various names. Physical parameters exceed all known humanoid baselines. Has personally destroyed [REDACTED] armies. Motivation: conquest. Intelligence: genius-level strategic mind in a body designed for war. Current location: monitoring.',
            'chosen one': 'DESIGNATION: Morrigan. Subject of Prophecy Event ██████ (see File ORACLE-9). Exhibits both divine and unholy energy signatures simultaneously — theoretically impossible per current models. Power scales with narrative proximity to "destiny moments." Speed rating: highest recorded for any humanoid. WARNING: attempting to prevent prophesied events accelerates them.',
            'politician': 'DESIGNATION: The President. Elected official with anomalous persuasion capability that exceeds normal political charisma by statistically significant margin. Speech patterns induce compliance in 89% of listeners (psionic component suspected, unconfirmed). Surrounded by loyal personnel at all times. Direct combat capability: unknown (has never been observed in a situation requiring it). "That itself is suspicious." — Agent ████',
            'atlantean': 'DESIGNATION: Temporal Tidecaller. Recovered from submerged ruins at coordinates [REDACTED], est. depth 4,200m. Bipedal humanoid with bioluminescent dermal markings and vestigial gill structures. Subjects demonstrate innate manipulation of localized temporal fields — witnesses report "time moving differently" in a 15m radius. Water in their presence exhibits anomalous behavior: spontaneous vortex formation, reverse-flow currents, and temperature shifts of ±40°C. Civilization appears to predate all known human records by approximately ██,000 years. Cultural artifacts suggest mastery of both chronal engineering and hydraulic warfare. WARNING: do not submerge containment chamber.',
            'dinosaur': 'DESIGNATION: Displaced Apex Predator. Temporal-spatial breach event (Incident ████-7) deposited specimen in [REDACTED] national park, 200█. Subject is a bipedal carnivorous reptilian of unprecedented scale (est. 3.5m height, 1,200kg mass). Exhibits intelligence far exceeding paleontological estimates — capable of tactical reasoning, ambush planning, and coordinated pack communication via subsonic vocalization. Bite force measured at 57,000 newtons. Territorial aggression is extreme. Sprint velocity: 48 km/h sustained over 200m. "The ground shakes when it moves. That is not an exaggeration." — Dr. ████',
            'dragon': 'DESIGNATION: Chaos Wyrm. Ancient entity of indeterminate origin — fossil record is contradictory (specimens found in strata ranging from 65M to 200M years). Winged reptilian quadruped capable of sustained atmospheric flight and internal combustion discharge (est. 1,400°C). Scales exhibit anomalous resistance to conventional weaponry; ballistic testing shows ricochet at all angles under 40°. Intelligence rating: EXTREME — subjects display strategic thinking, long-term memory spanning centuries, and apparent understanding of spoken language. Aligned with chaotic dimensional energies. "It looked at me like it was deciding whether I was worth the effort." — Surviving operative, Operation ████████',
            'ghoul': 'DESIGNATION: Intelligent Undead Predator. Unlike standard reanimated tissue (see: ZOMBIE), ghouls retain full cognitive function post-mortem. Specimens exhibit enhanced sensory capability (thermal vision, tremor-sense through ground contact), extreme agility, and a paralytic compound delivered via bite that induces progressive tissue necrosis in living subjects. Prefer to hunt alone. Capable of burrowing at speeds up to 12 km/h through loose soil. Cadaverous appearance belies their speed — recorded reaction time: 40ms (human average: 250ms). Feed on both living and dead tissue. "The zombie you can outrun. The ghoul has already circled behind you." — Field Manual ██-7',
            'gnome': 'DESIGNATION: Micro-scale Temporal Engineer. Diminutive humanoid entity (est. 45–60cm height) recovered from collapsed tunnel network beneath [REDACTED] mountain range. Despite size, demonstrates engineering capability that exceeds current human technology by an estimated 200–300 years. Constructs autonomous weapon systems from salvaged materials in under 90 seconds. Workshop spaces are dimensionally anomalous (internal volume exceeds external measurements by factor of 8). Personality consistently described as "irritable but helpful." Known to booby-trap personal spaces with alarming creativity. Handle specimen with respect — and watch where you step.',
            'kaiju': 'CLASSIFICATION: EXTINCTION-LEVEL ENTITY. Bipedal organism of unprecedented scale (est. 8–12m height, mass incalculable). First emergence: [REDACTED] coast, 20██. Exhibits hybrid biological-technological anatomy — organic tissue interwoven with metallic crystalline structures of unknown composition. Capable of directed-energy discharge from oral cavity (colloquially: "atomic breath"). Seismic signature detectable at 200km. Skin samples resist temperatures up to 3,000°C and pressures up to 500 atmospheres. Conventional military response: INEFFECTIVE. Nuclear option: CONSIDERED, DENIED (proximity to civilian population). Current status: ACTIVE. "We are not equipped for this. No one is." — General ████',
            'kraken': 'DESIGNATION: Deep Intelligence. Cephalopod entity recovered (partially) from abyssal trench at [REDACTED]. Full body has never been observed — estimated total mass exceeds 40,000 kg based on tentacle proportions. Demonstrates coordinated manipulation of up to 8 independent appendages simultaneously. Produces opaque biochemical discharge ("ink") that disrupts electronic sensors and causes temporary cortical confusion in biological targets. Communication attempts have produced [REDACTED] results — subject appears to understand human language but responds only in patterns of bioluminescent pulses that resist decryption. Sonar contact lost repeatedly at depth. "It\'s not hiding from us. It\'s choosing when to be seen." — Cdr. ████',
            'loch ness monster': 'DESIGNATION: Cryptid Alpha-7 ("Nessie"). Aquatic reptilian entity documented since ██ AD. Estimated length: 12–15m. Exhibits extraordinary evasive capability — over 4,000 confirmed sighting attempts have yielded only 3 actionable photographs. Dermal armor plating rivals reinforced steel (Brinell hardness: 890). Primarily docile unless territorial boundaries are violated, at which point aggression escalates rapidly. Capable of submerging for periods exceeding 72 hours. Sonar returns are inconsistent — subject appears to possess some form of acoustic camouflage. Freshwater habitat preference, but specimens have been reported in open ocean (unconfirmed). "The loch is deeper than the maps show. So is she." — Dr. ████',
            'yeti': 'DESIGNATION: Alpine Apex Cryptid. Bipedal primate entity (est. 2.6m, 220kg) documented in high-altitude regions across [REDACTED] mountain ranges. Exhibits cryokinetic capability — ambient temperature drops 15–25°C within a 10m radius of subject. Physical specimens recovered from engagement sites show fur with anomalous thermal properties (insulation value 40x synthetic equivalents). Upper body strength exceeds any known primate by factor of 3. Footprint analysis indicates deliberate stride patterns designed to minimize avalanche risk — intelligence confirmed. Known to fashion crude weapons from ice and stone. Territorial. "I found the camp. The equipment was frozen solid. The metal was shattered like glass. Whatever did this wasn\'t angry. It was thorough." — Recovery team lead, Expedition ████',
            'knight': 'Armored human combatant adhering to an archaic code of conduct designated "chivalry." Full-plate protective equipment provides exceptional ballistic and melee resistance. Subjects exhibit unwavering loyalty to designated allies and willingness to absorb lethal force on their behalf. Tactically rigid but extremely difficult to neutralize. Classification: heavy infantry. "Hit it again." "I did. Five times." — Field exchange, Operation ████████',
            'shaman': 'Human practitioner of ethnobotanical combat medicine and spirit-realm interfacing. Employs plant-derived compounds and ritualistic invocations to achieve measurable healing and psychoactive battlefield effects. Field reports document instances of consciousness transference and spirit-animal manifestation. Operates outside all recognized medical frameworks. Effectiveness: confirmed. "The lab results came back impossible. The patient came back alive." — Medical Officer ████',
            'mad scientist': 'Human subject exhibiting genius-level intellect combined with complete disregard for ethical research protocols. Deploys improvised electromagnetic devices, unstable chemical compounds, and clone technology of alarming sophistication. Laboratory conditions consistently violate 200+ safety regulations. Products are devastatingly effective despite — or because of — their instability. Current patent filings: 0. Current containment breaches caused: ██.',
            'cowboy': 'Human firearms specialist operating under frontier combat doctrine. Exhibits supernatural quickdraw reflexes (est. 0.12s reaction time) and preternatural accuracy at range. Cultural affectations include anachronistic headwear and a peculiar code of honor involving fair duels. Do not underestimate. They never miss twice. "The second shot was a warning. The first one wasn\'t." — Incident Report ████-7',
            'men in black': 'Human operatives of [REDACTED] agency. Equipped with alien-derived technology and neurological suppression devices. Subjects display complete operational security — personal histories cannot be verified through any database. Suspected involvement in 847 documented anomalous event coverups. If approached, deny all knowledge of this dossier. NOTE: If you are reading this, you have already been flagged.',
            'telepath': 'Human subject exhibiting anomalous psionic capability. Brain imaging reveals 340% neural density increase in prefrontal cortex. Capable of sustained telepathic contact, psychokinetic barrier projection, and hostile neural disruption at range. Subject claims the voices "never stop." EEG readings during combat produce patterns that cause migraines in monitoring staff. Containment priority: HIGH.',
            'marksman': 'Human precision firearms specialist. Confirmed kills at ranges exceeding 2,400m. Exhibits preternatural patience and spatial awareness — subjects have maintained prone observation positions for 72+ hours. Heartrate during engagement: 52 BPM. The bullet is already in the air before you know they are there. "We swept the ridge three times. Found nothing. On the fourth pass we found the shell casing. Just one." — After-action report ████',
            'priest': 'Human religious practitioner channeling measurable divine energy through faith-based invocations. Healing output rivals advanced medical technology. Subjects demonstrate absolute conviction in moral framework — this conviction appears to be the mechanism enabling their abilities. Recommend maintaining respectful distance from holy sites. NOTE: abilities function regardless of specific religious tradition. Mechanism under investigation.',
            'wizard': 'Human practitioner of arcane arts acquired through decades of study. Subjects manipulate fundamental forces through symbolic gestures and incantations of unknown linguistic origin. Mana reserves exceed any documented human baseline by factor of 4. WARNING: Do not touch their books. Do not enter their tower without invitation. "The tower wasn\'t on the map yesterday." "It\'s been there for 400 years." — Survey team exchange',
            'fortune teller': 'Human subject exhibiting precognitive and divinatory capabilities of verified accuracy. Employs symbolic interpretation systems (tarot, crystal scrying, palm reading) as focus mechanisms for genuine anomalous perception. Predictions are correct 73% of the time — well above statistical chance. Subject was asked to predict the outcome of this assessment. Subject smiled and said nothing. Assessment result: [REDACTED].',
            'barbarella': 'Subject encountered during deep-space reconnaissance operation at coordinates [REDACTED]. Female humanoid of terrestrial origin exhibiting retrofuturistic technology integration — anti-gravity propulsion, directed-energy sidearms, and a plasma-whip of unknown manufacture. Displays exceptional agility and what field agents describe as "irresistible charisma." Multiple operatives have gone AWOL following contact. Classification: HONEY TRAP RISK. "She smiled at me and I forgot the extraction protocol." — Agent ████, debriefing transcript.',
            'black goo': 'Anomalous amorphous organism recovered from impact site at [REDACTED]. No cellular structure identifiable — composition defies molecular analysis. Subject absorbs organic and inorganic material on contact, growing proportionally. Demonstrates rudimentary intelligence: problem-solving, threat assessment, and apparent preference for warm environments. Containment requires temperatures below -40°C at all times. THREE BREACHES THIS QUARTER. "It ate the containment team. Then it became the containment team." — Incident Report ████.',
            'golem': 'Bipedal construct of hewite stone and clay, animated through inscription of divine sigils dating to [REDACTED] BCE. Subject does not eat, sleep, or communicate. Follows directives inscribed on parchment inserted into cranial cavity — remove parchment to deactivate. Physical resilience exceeds all tested munitions up to .50 caliber. Subject has been in continuous operation for an estimated 3,000 years. "It just stood there. For four hundred years. Then someone wrote GO on a piece of paper." — Archaeological survey team.',
            'honda civic': 'Subject appears to be a standard 2001 four-door sedan (silver, 164K miles, check engine light on). Under combat stimulus, the vehicle undergoes rapid mechanical transformation into a bipedal combat platform approximately 3.2m in height. Transformation is accompanied by [REDACTED] levels of electromagnetic discharge. Subject has been observed purchasing its own gasoline. Registration expired 2019. "It parallel parked itself. Then it stood up and punched a building." — Civilian witness ████.',
            'ice queen': 'Entity manifesting as a female humanoid composed of crystalline ice structures at absolute-zero surface temperature. Ambient temperature drops 40°C within 30m of subject. All water sources freeze within line of sight. Subject claims dominion over "the frozen places between the stars." Displays intelligence far exceeding human baseline and a regal bearing consistent with self-assigned divine status. Three research stations abandoned due to proximity. "She didn\'t attack us. She just looked disappointed. The ocean froze for six miles." — Naval Report ████.',
            'juggernaut': 'Bipedal aberration of indeterminate origin. Height: 3.8m. Mass: estimated 2,200kg. Subject exhibits no measurable intelligence beyond threat identification and target pursuit. Once in motion, no observed force has halted its advance — including armored vehicles, reinforced barriers, and directed explosives. Subject does not run. Subject walks. It does not need to run. "We put everything we had into stopping it. Everything. It didn\'t slow down. It didn\'t even notice." — Commander ████, final transmission.',
            'ki fighter': 'Human martial artist exhibiting anomalous energy discharge capabilities. Subject channels bioelectric energy (designated "ki") through trained physical movements, generating concussive blasts, defensive barriers, and movement speeds exceeding Mach 0.3 in short bursts. Training origin traced to monastery at [REDACTED]. Subject meditates 4 hours daily and consumes approximately 12,000 calories. "I watched him punch a hole through a tank. Then he asked where the cafeteria was." — Field Report ████.',
            'king arthur': 'Subject claims to be Arthur Pendragon, High King of Britain, bearer of Excalibur. Carbon dating of associated artifacts and armor places origin at approximately 520 CE. Sword designated "Excalibur" emits measurable divine-spectrum energy and cannot be wielded by any other tested subject. Leadership capability is anomalous — allied units report a compulsive desire to follow orders. "He said \'for Camelot\' and I believed him. I don\'t even know where Camelot is." — Interview transcript ████.',
            'king kong': 'Primate megafauna of unprecedented scale. Height: 12m (estimated). Mass: 8,000kg+ (estimated from structural damage). Subject displays intelligence consistent with great ape baseline but enhanced tactical reasoning. Territory claimed: [REDACTED] Island. Three expeditions sent. Two returned. Subject was last observed sitting atop [REDACTED] building. "It looked at me. Not like an animal. Like it understood everything and chose to be angry anyway." — Sole survivor, Expedition ████.',
            'minotaur': 'Bovine-humanoid hybrid consistent with Hellenic mythological accounts. Height: 2.8m. Subject navigates complex structures with preternatural accuracy — spatial reasoning scores exceed all tested organisms. Charges at speeds up to 65 km/h. Horn composition: unknown alloy stronger than industrial diamond. Containment facility is a labyrinth. Subject appears to find this ironic. "We built it a maze. It solved it in four minutes. We built a bigger maze. It solved it in three." — Containment team report.',
            'necromancer': 'Human practitioner of necrotic arts. Subject manipulates post-mortem biological systems through rituals of [REDACTED] origin. Capable of reanimating deceased tissue, draining life force at range, and projecting weaponized decay. Ethical assessment: SEVERE CONCERN. Subject claims their work is "just biology with extra steps." Multiple cemetery incidents attributed. "The bodies got up. Not fast. Not dramatic. They just... stood up. And then they started walking toward the town." — Sheriff\'s report, [REDACTED] County.',
            'occulus': 'Entity manifesting as a single ocular organ of approximately 0.8m diameter with membranous wing structures enabling sustained flight. Pupil emits focused psychic energy measurable at 3.2 gigawatts. Subject perceives electromagnetic spectra far beyond human range, including alleged ability to observe temporal streams. Staring contest with subject resulted in [REDACTED]. "It blinked. Just once. And Agent ████ forgot his own name. Permanently." — Post-incident report.',
            'quarterback': 'Human subject of extraordinary athletic capability. Arm generates throws measured at 127 km/h with inhuman accuracy to 80+ meters. Spatial awareness during high-speed tactical scenarios rated as "anomalous" — subject processes defensive formations faster than combat AI systems. Has been known to call audibles that restructure allied tactical positioning to optimal configurations. "He threw a football through a concrete wall. Then he high-fived someone and went back to the huddle." — Surveillance footage ████.',
            'robinhood': 'Subject claims to be Robin of Loxley, Earl of Huntington. Bowmanship exceeds all measured human capability — confirmed split-arrow shots at 200m. Displays anachronistic values (wealth redistribution, authority defiance) that complicate standard recruitment protocols. Associated with a band of similarly skilled outlaws operating from [REDACTED] Forest. Subject has successfully robbed three secure government convoys. "He left a thank-you note. It was very polite." — Treasury report ████.',
            'santa clause': 'Entity of indeterminate age and origin operating from a facility at geographic North Pole. Demonstrates capabilities including: instantaneous global transportation, material generation ex nihilo, omniscient behavioral surveillance of human population, chimney-dimensional transit. Subject is cooperative but resistant to debriefing. Classified: FRIENDLY BUT UNCONTAINABLE. "He knew about the classified operation. He knew everyone\'s names. He gave Agent ████ socks. They were the right size." — December incident report.',
            'super sentai': 'Collective designation for a team of five human subjects capable of spontaneous chromatic energy manifestation and synchronized tactical combat. Individual members specialize by color spectrum (red/blue/black/green/yellow/pink). Under extreme duress, subjects merge consciousness to pilot a mechanized combat platform (codename: MEGAZORD) of approximately 50m height. Origin of abilities: unknown energy source designated "Morphin Grid." "They posed. In the middle of the battle. It shouldn\'t have worked. It worked." — After-action review.',
            'symbiote': 'Female human host bonded with an extraterrestrial parasitic organism of the same biological class as Subject: BLACK GOO (see file EW-████). Unlike the amorphous variant, this specimen has achieved stable symbiosis with a human host, dramatically enhancing physical capabilities: strength +400%, speed +300%, regenerative capacity. Host personality has been significantly altered — predatory instincts dominant. The symbiote communicates through the host. It is unclear who is in control. "She used to be Dr. ████. Now she refers to herself as \'we.\'" — Psychological assessment.',
            'valkraye': 'Winged humanoid entity consistent with Norse mythological "Valkyrie" designation. Subject selects fallen warriors for transport to [REDACTED] (alleged afterlife facility). Combat capability: EXTREME. Wields a divine-spectrum spear that penetrates all tested armor types. Flight capability: sustained, altitude ceiling not determined. Subject displays unwavering honor code and refuses to engage "unworthy" opponents. "She looked at us, decided we weren\'t worth fighting, and flew away. Most insulting thing that\'s ever happened to this unit." — Lieutenant ████.',
            'watcher': 'Ancient entity of indeterminate age. Winged humanoid form, height approximately 3m. Subject observes but historically does not intervene in terrestrial events. Maintains awareness of all temporal streams simultaneously (verified through prediction testing: 100% accuracy over 847 trials). Recent behavioral change: subject has begun intervening. This development is classified CONCERN LEVEL: MAXIMUM. "It said: I have watched long enough. It is time to act." The implications of this statement are still being assessed. All leave cancelled until further notice.'
        };

        const _CODEX_FACTION = { space: { label: 'SPACE', color: '#5a8898', stamp: '🌌' }, time: { label: 'TIME', color: '#b8a060', stamp: '⏳' }, chaos: { label: 'CHAOS', color: '#985050', stamp: '🔥' } };
        const _CODEX_TYPE_COLORS = { divine: '#dcaa1e', unholy: '#9632b4', anomaly: '#dc3c82', tech: '#28a0be', human: '#a0a0c3', alien: '#32aa50' };
        const _CODEX_CLASS_LABELS = { tank: 'HEAVY ARMOR', bruiser: 'ASSAULT', healer: 'MEDICAL', support: 'SUPPORT OPS', assassin: 'BLACK OPS', caster: 'PSI-OPS', ranged: 'LONG RANGE', specialist: 'SPECIALIST', hybrid: 'MULTI-ROLE' };

        function _codexGetSpriteUrl(race) {

            const g = 'male';
            const cls = RACE_DEFAULT_JOBS[race] || 'Freelancer';
            return getR2RaceSpriteUrl(race, g, cls);
        }

        function _codexBuildStatBar(val, max, label, color) {
            const pct = Math.min(100, (val / max) * 100);
            return `<div class="cdx-stat-row">
                <span class="cdx-stat-label">${label}</span>
                <div class="cdx-stat-bar-track"><div class="cdx-stat-bar-fill" style="width:${pct}%;background:${color}"></div></div>
                <span class="cdx-stat-val">${val}</span>
            </div>`;
        }

        function _codexBuildTypeMatchups(types) {
            let strong = [], weak = [], resists = [];
            for (const t of types) {
                const chart = TYPE_CHART[t];
                if (!chart) continue;
                for (const s of (chart.strongVs || [])) if (!strong.includes(s)) strong.push(s);
                for (const w of (chart.weakVs || [])) if (!weak.includes(w)) weak.push(w);
                for (const r of (chart.resists || [])) if (!resists.includes(r)) resists.push(r);
            }
            const pill = (t, cls) => `<span class="type-badge type-${t}">${t.toUpperCase()}</span>`;
            let html = '<div class="cdx-matchups">';
            if (strong.length) html += `<div class="cdx-mu-row"><span class="cdx-mu-label">▲ STRONG VS</span>${strong.map(t => pill(t, 'strong')).join('')}</div>`;
            if (weak.length) html += `<div class="cdx-mu-row"><span class="cdx-mu-label">▼ WEAK VS</span>${weak.map(t => pill(t, 'weak')).join('')}</div>`;
            if (resists.length) html += `<div class="cdx-mu-row"><span class="cdx-mu-label">■ RESISTS</span>${resists.map(t => pill(t, 'resist')).join('')}</div>`;
            html += '</div>';
            return html;
        }

        function _codexBuildAbilities(race) {
            const abilities = RACE_ABILITIES[race];
            if (!abilities || abilities.length === 0) return '<div class="cdx-section-note">No racial abilities documented.</div>';
            let html = '';
            for (const ab of abilities) {
                const costStr = ab.cost ? `${ab.cost} MP` : 'Passive';
                const apStr = ab.apCost ? ` · ${ab.apCost} AP` : '';
                const dmgStr = ab.dmg ? ` · ${ab.dmg} DMG` : '';
                const healStr = ab.healAmt ? ` · ${ab.healAmt} HEAL` : '';
                const rangeStr = ab.range != null ? ` · RNG ${ab.range}` : '';
                html += `<div class="cdx-ability">
                    <div class="cdx-ability-header">
                        <span class="cdx-ability-name">${ab.name}</span>
                        <span class="cdx-ability-meta">${costStr}${apStr}${dmgStr}${healStr}${rangeStr}</span>
                    </div>
                    <div class="cdx-ability-desc">${ab.desc || 'Classified.'}</div>
                </div>`;
            }
            return html;
        }

        // ── Shared dossier building blocks (codex + shop) ──
        function _codexHexToRgb(hex) {
            const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
            if (!m) return '184,160,96';
            const n = parseInt(m[1], 16);
            return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
        }

        function _codexFactionVars(faction) {
            const col = (_CODEX_FACTION[faction] && _CODEX_FACTION[faction].color) || '#b8a060';
            const rgb = _codexHexToRgb(col);
            return `--cdx-fc-glow:rgba(${rgb},0.26);--cdx-fc-ground:rgba(${rgb},0.50);--cdx-fc-dim:rgba(${rgb},0.10)`;
        }

        function _codexDocNum(race) {
            return 'EW-' + (Math.abs(race.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 7) % 9000 + 1000);
        }

        const _CODEX_SKY_RACES = ['fairy','shadow entity','ai','angel','seraphim','orb of light','demon','mech','ghost','annunaki','gargoyle','djinn','mothman','glitch','demon prince','demon princess','fallen angel','cyborg','nephilim','vampire','superhero','antihero','chosen one','dragon','occulus','valkraye','watcher'];

        function _codexTraits(race) {
            const traits = [];
            if (_CODEX_SKY_RACES.includes(race)) traits.push('✈ FLIGHT CAPABLE');
            // Terrain affinities (mirror party builder)
            if (['siren','reptilian','ghost','atlantean','kraken','loch ness monster','black goo'].includes(race)) traits.push('🌊 DEEP WATER ADAPTED');
            if (['demon','djinn','succubus','skeleton','dragon'].includes(race)) traits.push('🔥 LAVA ADAPTED');
            if (['anubis','djinn','reptilian','skeleton'].includes(race)) traits.push('🏜 DESERT ADAPTED');
            if (['bigfoot','fairy','werewolf','shadow entity','skinwalker','catgirl','mothman','scarecrow','dinosaur','king kong'].includes(race)) traits.push('🌲 FOREST ADAPTED');
            if (['giant','cyclops','gargoyle','gnome','yeti','dragon','kaiju','golem','ice queen','minotaur','juggernaut','king kong'].includes(race)) traits.push('⛰ MOUNTAIN TRAVERSER');
            if (['zombie','skeleton','robot','mech','android','ai','glitch','kaiju','ghoul','necromancer','black goo'].includes(race)) traits.push('☢ WASTELAND ADAPTED');
            if (['yeti','ice queen'].includes(race)) traits.push('❄ ICE TERRAIN IMMUNITY');
            return traits;
        }

        // The hero stage: the selected vessel staged BIG (party-builder style),
        // identity + faction stamp beside it. Shared by the codex and the shop
        // so both screens read as the same Intelligence Division terminal.
        function _codexHeroHtml(race, opts) {
            opts = opts || {};
            const profile = RACE_PROFILES[race];
            if (!profile) return '';
            const faction = _CODEX_FACTION[profile.faction] || { label: '???', color: '#888', stamp: '❓' };
            const raceClass = RACE_CLASS[race] || 'hybrid';
            const classLabel = _CODEX_CLASS_LABELS[raceClass] || 'UNCLASSIFIED';
            const defaultJob = RACE_DEFAULT_JOBS[race] || 'Freelancer';
            const types = profile.types || [];
            const sprUrl = _codexGetSpriteUrl(race);
            const docNum = _codexDocNum(race);
            const locked = !!opts.locked;
            const blk = (n) => '█'.repeat(n);

            const stamp = locked
                ? `<div class="cdx-stamp ${profile.faction}">🔒 SEALED FILE</div>`
                : `<div class="cdx-stamp ${profile.faction}">${faction.stamp} ${faction.label} FACTION</div>`;
            const nameHtml = locked
                ? `${blk(9)}<span class="cdx-subject-role">designation withheld</span>`
                : `${profile.label.toUpperCase()}<span class="cdx-subject-role">the ${defaultJob.toLowerCase()}</span>`;
            const chips = locked
                ? `<span class="cdx-meta-tag">Class: <b>${blk(5)}</b></span><span class="cdx-meta-tag">Default Role: <b>${blk(7)}</b></span>`
                : `${types.map(t => `<span class="type-badge type-${t}">${t.toUpperCase()}</span>`).join('')}
                   <span class="cdx-meta-tag">Class: <b>${classLabel}</b></span>
                   <span class="cdx-meta-tag">Default Role: <b>${defaultJob}</b></span>`;
            const traits = locked ? [] : _codexTraits(race);
            const traitsHtml = traits.length
                ? `<div class="cdx-traits-row">${traits.map(t => `<span class="cdx-trait-tag">${t}</span>`).join('')}</div>` : '';

            return `
            <div class="cdx-hero" style="${_codexFactionVars(profile.faction)}">
                <div class="cdx-hero-stage">
                    <div class="cdx-hero-glow"></div>
                    <div class="cdx-hero-ground"></div>
                    <div class="cdx-hero-sprite${locked ? ' locked' : ''}" style="background-image:url('${sprUrl}')"></div>
                </div>
                <div class="cdx-hero-id">
                    <div class="cdx-hero-topline">
                        ${stamp}
                        <div class="cdx-doc-id">DOC# ${docNum} · ██/██/199█</div>
                        <div class="cdx-classification">TOP SECRET // ████████ // NOFORN</div>
                        ${opts.priceTag || ''}
                    </div>
                    <div class="cdx-subject-name">${nameHtml}</div>
                    <div class="cdx-hero-chips">${chips}</div>
                    ${traitsHtml}
                </div>
            </div>`;
        }

        // Sections of the file body (lore / stats / matchups / abilities).
        function _codexDossierSections(race) {
            const stats = RACE_BASE_STATS[race] || {};
            const profile = RACE_PROFILES[race] || {};
            const types = profile.types || [];
            const lore = _CODEX_LORE[race] || 'No intelligence available. File pending ████████ review.';
            const maxHp = 700, maxMp = 250, maxAtk = 90, maxDef = 60, maxMDef = 60, maxInt = 80, maxSpd = 12;
            const total = (stats.hp || 0) + (stats.mp || 0) + (stats.atk || 0) + (stats.def || 0) + (stats.mdef || 0) + (stats.int || 0) + (stats.spd || 0) + (stats.move || 0) + (stats.awr || 0);
            // ⚖️ Official physique (RACE_PHYSIQUE): height/weight are real game
            // data — the weight class drives push/pull physics, fall damage and
            // crash-through, so the dossier states it like the stat it is.
            const phys = (typeof RACE_PHYSIQUE !== 'undefined') ? RACE_PHYSIQUE[race] : null;
            let physHtml = '';
            if (phys) {
                const wc = phys.w < 30 ? 'FEATHER' : phys.w < 80 ? 'LIGHT' : phys.w < 250 ? 'MEDIUM' : phys.w < 1000 ? 'HEAVY' : 'COLOSSAL';
                const hLabel = phys.h < 1 ? `${Math.round(phys.h * 100)} cm` : `${phys.h >= 10 ? Math.round(phys.h) : phys.h} m`;
                const wLabel = phys.w < 1 ? `${Math.round(phys.w * 1000)} g` : phys.w >= 1000 ? `${(phys.w / 1000).toFixed(1)} t` : `${phys.w} kg`;
                const wcNote = wc === 'COLOSSAL' ? 'immune to knockback; falls hit ×1.5'
                    : wc === 'HEAVY' ? 'pushed 1 tile less; smashes through stone; falls ×1.25'
                    : wc === 'FEATHER' ? 'pushed 1 tile further; falls ×0.5; too light to crash through blocks'
                    : wc === 'LIGHT' ? 'falls ×0.75'
                    : 'standard displacement physics';
                physHtml = `<div class="cdx-lore" style="margin-bottom:6px">OFFICIAL HEIGHT: ${hLabel} &nbsp;·&nbsp; WEIGHT: ${wLabel} &nbsp;·&nbsp; CLASS: ${wc} <span style="opacity:.75">(${wcNote})</span></div>`;
            }
            return `
                <div class="cdx-section">
                    <div class="cdx-section-header">1. &nbsp;EXECUTIVE SUMMARY:</div>
                    <div class="cdx-lore">${lore}</div>
                </div>
                <div class="cdx-section">
                    <div class="cdx-section-header">2. &nbsp;PHYSIOLOGICAL ASSESSMENT:</div>
                    ${physHtml}
                    <div class="cdx-stats-grid">
                        ${_codexBuildStatBar(stats.hp || 0, maxHp, 'HP', '#55bb70')}
                        ${_codexBuildStatBar(stats.mp || 0, maxMp, 'MP', '#5a8898')}
                        ${_codexBuildStatBar(stats.atk || 0, maxAtk, 'ATK', '#c05050')}
                        ${_codexBuildStatBar(stats.def || 0, maxDef, 'DEF', '#b8a060')}
                        ${_codexBuildStatBar(stats.mdef ?? 0, maxMDef, 'MDEF', '#6f8fc0')}
                        ${_codexBuildStatBar(stats.int || 0, maxInt, 'INT', '#9080b8')}
                        ${_codexBuildStatBar(stats.spd || 0, maxSpd, 'SPD', '#d09050')}
                        ${_codexBuildStatBar(stats.move || 0, 5, 'MOV', '#60b8d0')}
                        ${_codexBuildStatBar(stats.awr || 0, 8, 'AWR', '#b0b070')}
                    </div>
                    <div class="cdx-stat-total">TOTAL STAT POINTS: ${total}</div>
                </div>
                <div class="cdx-section">
                    <div class="cdx-section-header">3. &nbsp;TYPE EFFECTIVENESS:</div>
                    ${_codexBuildTypeMatchups(types)}
                </div>
                <div class="cdx-section">
                    <div class="cdx-section-header">4. &nbsp;DOCUMENTED CAPABILITIES:</div>
                    ${_codexBuildAbilities(race)}
                </div>`;
        }

        // Full dossier: hero stage pinned on top, the file body scrolls below.
        function _codexRenderDossier(race) {
            if (!RACE_PROFILES[race]) return '';
            return `
                ${_codexHeroHtml(race)}
                <div class="cdx-detail-scroll">
                    <div class="cdx-dossier">
                        ${_codexDossierSections(race)}
                        <div class="cdx-footer-stamp">
                            <div class="cdx-watermark">ENTROPY WARS INTELLIGENCE DIVISION</div>
                            <div class="cdx-page-class">PAGE 1 OF 1 · DISTRIBUTION: ████████ ONLY</div>
                        </div>
                    </div>
                </div>`;
        }

        function _codexRenderList() {
            let races = [...AVAILABLE_RACES];

            if (_codexFilterFaction !== 'all') {
                races = races.filter(r => (RACE_PROFILES[r]?.faction || '') === _codexFilterFaction);
            }

            if (_codexFilterType !== 'all') {
                races = races.filter(r => (RACE_PROFILES[r]?.types || []).includes(_codexFilterType));
            }

            races.sort((a, b) => (RACE_PROFILES[a]?.label || a).localeCompare(RACE_PROFILES[b]?.label || b));

            let html = '';
            for (const race of races) {
                const p = RACE_PROFILES[race];
                if (!p) continue;
                const faction = p.faction || 'space';
                const types = (p.types || []).map(t => t.toUpperCase()).join(' / ');
                const cls = RACE_CLASS[race] || 'hybrid';
                const classLbl = _CODEX_CLASS_LABELS[cls] || 'UNCLASSIFIED';
                const selected = race === _codexSelectedRace ? ' selected' : '';
                const sprUrl = _codexGetSpriteUrl(race);
                const unlocked = (typeof isUnitUnlocked === 'function') ? isUnitUnlocked(race) : true;
                const lockedCls = unlocked ? '' : ' cdx-list-locked';
                const spriteStyle = unlocked
                    ? `background-image:url('${sprUrl}')`
                    : `background-image:url('${sprUrl}');filter:brightness(0) opacity(0.45)`;
                const nameHtml = unlocked ? p.label : '<span style="letter-spacing:0.12em;color:#7a7060">CLASSIFIED</span>';
                const lockBadge = unlocked ? '' : '<span class="cdx-list-lock">🔒</span>';
                html += `<div class="cdx-list-item${selected}${lockedCls}" data-race="${race}" onclick="window._codexSelect('${race.replace(/'/g, "\\'")}')" style="${unlocked ? '' : 'opacity:0.78'}">
                    <div class="cdx-list-sprite" style="${spriteStyle}"></div>
                    <div class="cdx-list-info">
                        <div class="cdx-list-name">${nameHtml}${lockBadge}</div>
                        <div class="cdx-list-tags">
                            <span class="cdx-list-faction ${faction}">${faction.toUpperCase()}</span>
                            <span class="cdx-list-type">${unlocked ? types : '████'}</span>
                        </div>
                        <div class="cdx-list-class">${unlocked ? classLbl : '████████'}</div>
                    </div>
                </div>`;
            }
            if (!html) html = '<div class="cdx-empty">No subjects match current filters.</div>';
            return html;
        }

        window._renderCodex = function() {
            const body = document.getElementById('codexBody');
            if (!body) return;

            if (!_codexSelectedRace) _codexSelectedRace = AVAILABLE_RACES[0];

            const factionOpts = ['all', 'space', 'time', 'chaos'];
            const typeOpts = ['all', 'divine', 'unholy', 'anomaly', 'tech', 'human', 'alien'];
            let filterHtml = '<div class="cdx-filter-group"><span class="cdx-filter-label">FACTION</span>';
            for (const f of factionOpts) {
                const sel = f === _codexFilterFaction ? ' active' : '';
                filterHtml += `<button class="cdx-filter-btn${sel}" onclick="window._codexSetFilter('faction','${f}')">${f === 'all' ? 'ALL' : f.toUpperCase()}</button>`;
            }
            filterHtml += '</div><div class="cdx-filter-group"><span class="cdx-filter-label">TYPE</span>';
            for (const t of typeOpts) {
                const sel = t === _codexFilterType ? ' active' : '';
                filterHtml += `<button class="cdx-filter-btn${sel}" onclick="window._codexSetFilter('type','${t}')">${t === 'all' ? 'ALL' : t.toUpperCase()}</button>`;
            }
            filterHtml += '</div>';

            body.innerHTML = `
                <div class="cdx-toolbar">${filterHtml}${_codexMeterHtml()}</div>
                <div class="cdx-layout">
                    <div class="cdx-list" id="codexList">${_codexRenderList()}</div>
                    <div class="cdx-detail" id="codexDetail">${_codexDossierFor(_codexSelectedRace)}</div>
                </div>
            `;
        };

        // Collection meter — shared by codex + shop toolbars.
        function _codexMeterHtml() {
            const total = AVAILABLE_RACES.length;
            const owned = AVAILABLE_RACES.filter(r => (typeof isUnitUnlocked === 'function') ? isUnitUnlocked(r) : true).length;
            const pct = Math.round((owned / Math.max(1, total)) * 100);
            return `<div class="cdx-meter" title="${owned} of ${total} vessels declassified">
                <span class="cdx-meter-label">VESSELS DECLASSIFIED</span>
                <div class="cdx-meter-track"><div class="cdx-meter-fill" style="width:${pct}%"></div></div>
                <span class="cdx-meter-count">${owned} / ${total}</span>
            </div>`;
        }

        // Full dossier when owned; fully-redacted dossier when locked.
        function _codexDossierFor(race) {
            const unlocked = (typeof isUnitUnlocked === 'function') ? isUnitUnlocked(race) : true;
            return unlocked ? _codexRenderDossier(race) : _codexRenderRedactedDossier(race);
        }

        function _codexRenderRedactedDossier(race) {
            const profile = RACE_PROFILES[race];
            if (!profile) return '';
            const blk = (n) => '█'.repeat(n);
            const price = (window.ACCT_UNIT_PRICE || 5000);
            const econ = window.ProfileSystem && window.ProfileSystem.getAccountEconomy ? window.ProfileSystem.getAccountEconomy() : { freeTokens: 0 };
            const rk = race.replace(/'/g, "\\'");
            const tokenBtn = (econ.freeTokens > 0)
                ? `<button class="cdx-btn cdx-btn-token" onclick="window._goToShop('${rk}')">🎟 Use Free Unlock</button>` : '';
            return `
                ${_codexHeroHtml(race, { locked: true })}
                <div class="cdx-detail-scroll">
                    <div class="cdx-dossier cdx-dossier-locked">
                        <div class="cdx-section">
                            <div class="cdx-section-header">1. &nbsp;EXECUTIVE SUMMARY:</div>
                            <div class="cdx-redacted-block">${blk(38)} ${blk(22)} ${blk(31)} ████ ${blk(18)} ████████ ${blk(26)} ${blk(14)}.</div>
                        </div>
                        <div class="cdx-section">
                            <div class="cdx-section-header">2. &nbsp;PHYSIOLOGICAL ASSESSMENT:</div>
                            <div class="cdx-redacted-banner">████████ INTELLIGENCE WITHHELD ████████</div>
                        </div>
                        <div class="cdx-section">
                            <div class="cdx-section-header">3. &nbsp;DOCUMENTED CAPABILITIES:</div>
                            <div class="cdx-redacted-block">${blk(26)} ${blk(12)} ${blk(30)} ${blk(9)} ${blk(21)}</div>
                        </div>
                    </div>
                </div>
                <div class="cdx-actionbar">
                    <span class="cdx-action-status" style="color:#b8a060">🔒 FILE SEALED — DECLASSIFY TO REVEAL</span>
                    <div class="cdx-actionbar-spacer"></div>
                    ${tokenBtn}
                    <button class="cdx-btn cdx-btn-primary" onclick="window._goToShop('${rk}')">Unlock in Shop · 💰 ${price.toLocaleString()}</button>
                </div>`;
        }

        window._codexSelect = function(race) {
            if (typeof playSfx === 'function') playSfx('uiCursorFocus');
            _codexSelectedRace = race;

            const listEl = document.getElementById('codexList');
            if (listEl) listEl.innerHTML = _codexRenderList();
            const detailEl = document.getElementById('codexDetail');
            if (detailEl) detailEl.innerHTML = _codexDossierFor(race);
        };

        window._codexSetFilter = function(type, value) {
            if (typeof playSfx === 'function') playSfx('uiCursorMove');
            if (type === 'faction') _codexFilterFaction = value;
            if (type === 'type') _codexFilterType = value;

            let races = [...AVAILABLE_RACES];
            if (_codexFilterFaction !== 'all') races = races.filter(r => (RACE_PROFILES[r]?.faction || '') === _codexFilterFaction);
            if (_codexFilterType !== 'all') races = races.filter(r => (RACE_PROFILES[r]?.types || []).includes(_codexFilterType));
            if (!races.includes(_codexSelectedRace) && races.length > 0) {
                races.sort((a, b) => (RACE_PROFILES[a]?.label || a).localeCompare(RACE_PROFILES[b]?.label || b));
                _codexSelectedRace = races[0];
            }
            window._renderCodex();
        };

        // ══════════════════════════════════════════════════════════════════
        // ACCOUNT SHOP — declassify (unlock) vessels with account gold / tokens
        // ══════════════════════════════════════════════════════════════════
        let _shopSelectedRace = null;
        let _shopFilterFaction = 'all';
        let _shopFilterOwn = 'all'; // all | owned | locked
        let _shopSearch = '';
        let _shopConfirming = null; // race awaiting purchase confirmation
        let _shopConfirmToken = false; // confirming with a free token (vs gold)

        // Reusable wallet readout — single implementation across all screens.
        window._formatGold = function(n) { return (Number(n) || 0).toLocaleString(); };

        window._renderWallet = function(el) {
            if (!el) return;
            const econ = (window.ProfileSystem && window.ProfileSystem.getAccountEconomy)
                ? window.ProfileSystem.getAccountEconomy() : { gold: 0, freeTokens: 0 };
            const prev = parseInt(el.dataset.gold || '', 10);
            const gold = econ.gold || 0;
            const tokenStr = (econ.freeTokens > 0)
                ? ` <span class="ew-wallet-token" title="Free unlock tokens" style="color:#9ad0ff">🎟 ${econ.freeTokens}</span>` : '';
            el.innerHTML = `<span class="ew-wallet-gold" style="color:#ffd86a;font-weight:600">💰 ${gold.toLocaleString()}</span>${tokenStr}`;
            el.dataset.gold = String(gold);
            if (!isNaN(prev) && prev !== gold) {
                el.style.transition = 'none';
                el.style.transform = 'scale(1.18)';
                el.style.filter = 'brightness(1.4)';
                requestAnimationFrame(() => {
                    el.style.transition = 'transform 0.4s ease, filter 0.4s ease';
                    el.style.transform = 'scale(1)';
                    el.style.filter = 'brightness(1)';
                });
            }
        };

        window._refreshWallets = function() {
            document.querySelectorAll('.ew-wallet').forEach(window._renderWallet);
            const econ = (window.ProfileSystem && window.ProfileSystem.getAccountEconomy)
                ? window.ProfileSystem.getAccountEconomy() : { gold: 0 };
            const price = window.ACCT_UNIT_PRICE || 5000;
            const badge = document.getElementById('mmShopBadge');
            if (badge) badge.style.display = ((econ.gold || 0) >= price) ? 'inline-flex' : 'none';
        };

        // A vessel with no rigged 3D model is locked for everyone (3D-only
        // roster rule) — it must not be purchasable, or the gold would buy a
        // unit the unlock gate still refuses to field.
        function _shopBuyable(race) {
            return (typeof isRace3DReady === 'function') ? isRace3DReady(race) : true;
        }

        function _shopDailyFeatured() {
            // Deterministic daily rotation by date seed over the locked roster.
            // Only buyable (3D-ready) vessels get featured.
            const locked = AVAILABLE_RACES.filter(r => _shopBuyable(r) && !((typeof isUnitUnlocked === 'function') ? isUnitUnlocked(r) : true));
            if (locked.length === 0) return [];
            const d = new Date();
            let seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
            function rng() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
            const pool = locked.slice();
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(rng() * (i + 1));
                const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
            }
            return pool.slice(0, Math.min(4, pool.length));
        }

        function _shopRenderCard(race, opts) {
            opts = opts || {};
            const p = RACE_PROFILES[race];
            if (!p) return '';
            const unlocked = (typeof isUnitUnlocked === 'function') ? isUnitUnlocked(race) : true;
            const sprUrl = _codexGetSpriteUrl(race);
            const selected = race === _shopSelectedRace ? ' selected' : '';
            const lockedCls = unlocked ? '' : ' locked';
            const sprStyle = unlocked ? `background-image:url('${sprUrl}')`
                : `background-image:url('${sprUrl}');filter:brightness(0.16) opacity(0.6)`;
            const price = (window.ACCT_UNIT_PRICE || 5000).toLocaleString();
            const tag = unlocked
                ? `<span class="shop-card-tag owned">✓ OWNED</span>`
                : (_shopBuyable(race)
                    ? `<span class="shop-card-tag price">💰 ${price}</span>`
                    : `<span class="shop-card-tag soon">🔒 3D MODEL SOON</span>`);
            const featuredRibbon = opts.featured ? `<div class="shop-ribbon">FEATURED</div>` : '';
            return `<div class="shop-card${selected}${lockedCls}" onclick="window._shopSelect('${race.replace(/'/g, "\\'")}')">
                ${featuredRibbon}
                <div class="shop-card-sprite" style="${sprStyle}"></div>
                <div class="shop-card-name">${p.label}</div>
                ${tag}
            </div>`;
        }

        // The pinned action bar: whatever state the vessel is in, the button
        // that matters is ALWAYS on screen — never below the fold.
        function _shopActionBar(race) {
            const unlocked = (typeof isUnitUnlocked === 'function') ? isUnitUnlocked(race) : true;
            const rk = race.replace(/'/g, "\\'");
            if (unlocked) {
                return `<div class="cdx-actionbar">
                    <span class="cdx-action-status" style="color:#9fe0a0">✓ DECLASSIFIED — IN YOUR ROSTER</span>
                    <div class="cdx-actionbar-spacer"></div>
                    <button class="cdx-btn cdx-btn-ghost" onclick="window._shopViewInCodex('${rk}')">VIEW IN CODEX</button>
                </div>`;
            }
            if (!_shopBuyable(race)) {
                return `<div class="cdx-actionbar">
                    <span class="cdx-action-status" style="color:#9a9aae">🔒 AWAITING 3D MODEL — NOT YET DEPLOYABLE</span>
                    <span class="cdx-action-note">This vessel goes on sale once its rigged model ships.</span>
                </div>`;
            }
            const econ = (window.ProfileSystem && window.ProfileSystem.getAccountEconomy)
                ? window.ProfileSystem.getAccountEconomy() : { gold: 0, freeTokens: 0 };
            const price = window.ACCT_UNIT_PRICE || 5000;
            const canAfford = (econ.gold || 0) >= price;
            const hasToken = (econ.freeTokens || 0) > 0;
            if (_shopConfirming === race) {
                const method = _shopConfirmToken
                    ? `<b style="color:#9ad0ff">1 free unlock token 🎟</b>`
                    : `<b style="color:#ffd86a">💰 ${price.toLocaleString()} gold</b>`;
                return `<div class="cdx-actionbar">
                    <span class="cdx-action-status" style="color:#e8dfc0;font-weight:400">Declassify <b>${RACE_PROFILES[race].label}</b> for ${method}?</span>
                    <div class="cdx-actionbar-spacer"></div>
                    <button class="cdx-btn cdx-btn-ghost" onclick="window._shopCancelConfirm()">✕ Cancel</button>
                    <button class="cdx-btn cdx-btn-confirm" onclick="window._shopBuy('${rk}', ${_shopConfirmToken ? 'true' : 'false'})">✓ Confirm Purchase</button>
                </div>`;
            }
            const affordNote = canAfford ? ''
                : `<span class="cdx-action-note" style="color:#c08050">need ${(price - (econ.gold || 0)).toLocaleString()} more gold — win matches to earn it</span>`;
            const tokenBtn = hasToken
                ? `<button class="cdx-btn cdx-btn-token" onclick="window._shopAskConfirm('${rk}', true)">🎟 Use Free Unlock (${econ.freeTokens})</button>` : '';
            const buyBtn = canAfford
                ? `<button class="cdx-btn cdx-btn-primary" onclick="window._shopAskConfirm('${rk}', false)">Unlock · 💰 ${price.toLocaleString()}</button>`
                : `<button class="cdx-btn cdx-btn-primary" disabled title="Not enough gold">Unlock · 💰 ${price.toLocaleString()}</button>`;
            return `<div class="cdx-actionbar">
                <span class="cdx-action-status" style="color:#b8a060">🔒 SEALED FILE</span>
                ${affordNote}
                <div class="cdx-actionbar-spacer"></div>
                ${tokenBtn}
                ${buyBtn}
            </div>`;
        }

        function _shopRenderDetail(race) {
            if (!race || !RACE_PROFILES[race]) return '<div class="cdx-empty" style="margin:auto">Select a vessel to inspect its dossier.</div>';
            const unlocked = (typeof isUnitUnlocked === 'function') ? isUnitUnlocked(race) : true;
            const price = (window.ACCT_UNIT_PRICE || 5000).toLocaleString();
            const priceTag = unlocked
                ? '<div class="cdx-hero-price owned">✓ OWNED</div>'
                : (_shopBuyable(race)
                    ? `<div class="cdx-hero-price">💰 ${price}</div>`
                    : '<div class="cdx-hero-price soon">🔒 COMING SOON</div>');
            // Full preview-before-buy: the shop never hides what you are buying.
            return `
                ${_codexHeroHtml(race, { priceTag })}
                <div class="cdx-detail-scroll">
                    <div class="cdx-dossier">${_codexDossierSections(race)}</div>
                </div>
                ${_shopActionBar(race)}`;
        }

        function _shopFilteredRaces() {
            let races = AVAILABLE_RACES.filter(r => RACE_PROFILES[r]);
            if (_shopFilterFaction !== 'all') races = races.filter(r => (RACE_PROFILES[r].faction || '') === _shopFilterFaction);
            if (_shopFilterOwn === 'owned') races = races.filter(r => isUnitUnlocked(r));
            if (_shopFilterOwn === 'locked') races = races.filter(r => !isUnitUnlocked(r));
            if (_shopSearch.trim()) {
                const q = _shopSearch.trim().toLowerCase();
                races = races.filter(r => (RACE_PROFILES[r].label || r).toLowerCase().includes(q) || r.toLowerCase().includes(q));
            }
            // What you can act on leads: buyable → coming-soon → owned, A→Z within each.
            const rank = r => isUnitUnlocked(r) ? 2 : (_shopBuyable(r) ? 0 : 1);
            races.sort((a, b) => (rank(a) - rank(b)) || (RACE_PROFILES[a].label || a).localeCompare(RACE_PROFILES[b].label || b));
            return races;
        }

        function _shopGridHtml() {
            const races = _shopFilteredRaces();
            return races.length ? races.map(r => _shopRenderCard(r)).join('')
                : '<div class="cdx-empty" style="grid-column:1/-1">No vessels match.</div>';
        }

        function _shopFeaturedHtml() {
            const featured = _shopDailyFeatured();
            if (!featured.length) return '';
            return `<span class="shop-featured-label">★ TODAY'S TARGETS</span>${featured.map(r => _shopRenderCard(r, { featured: true })).join('')}`;
        }

        window._renderShop = function() {
            const body = document.getElementById('shopBody');
            if (!body) return;
            if (!_shopSelectedRace) {
                const firstBuyable = AVAILABLE_RACES.find(r => _shopBuyable(r) && !isUnitUnlocked(r));
                _shopSelectedRace = firstBuyable || AVAILABLE_RACES.find(r => !isUnitUnlocked(r)) || AVAILABLE_RACES[0];
            }

            const factionOpts = ['all', 'space', 'time', 'chaos'];
            const ownOpts = [['all', 'ALL'], ['locked', 'LOCKED'], ['owned', 'OWNED']];
            let filterHtml = `<input type="text" class="cdx-search" placeholder="Search vessels…" value="${_shopSearch.replace(/"/g, '&quot;')}" oninput="window._shopSetSearch(this.value)">`;
            filterHtml += '<div class="cdx-filter-group"><span class="cdx-filter-label">FACTION</span>';
            for (const f of factionOpts) {
                const sel = f === _shopFilterFaction ? ' active' : '';
                filterHtml += `<button class="cdx-filter-btn${sel}" onclick="window._shopSetFilter('faction','${f}')">${f === 'all' ? 'ALL' : f.toUpperCase()}</button>`;
            }
            filterHtml += '</div><div class="cdx-filter-group"><span class="cdx-filter-label">STATUS</span>';
            for (const [v, lbl] of ownOpts) {
                const sel = v === _shopFilterOwn ? ' active' : '';
                filterHtml += `<button class="cdx-filter-btn${sel}" onclick="window._shopSetFilter('own','${v}')">${lbl}</button>`;
            }
            filterHtml += '</div>';

            const featuredHtml = _shopFeaturedHtml();
            body.innerHTML = `
                <div class="cdx-toolbar">${filterHtml}${_codexMeterHtml()}</div>
                <div class="cdx-layout">
                    <div class="shop-left">
                        ${featuredHtml ? `<div class="shop-featured" id="shopFeatured">${featuredHtml}</div>` : ''}
                        <div class="shop-grid" id="shopGrid">${_shopGridHtml()}</div>
                    </div>
                    <div class="cdx-detail shop-detail" id="shopDetail">${_shopRenderDetail(_shopSelectedRace)}</div>
                </div>
            `;
            const w = document.getElementById('shopWallet');
            if (w) window._renderWallet(w);
        };

        window._shopSelect = function(race) {
            if (typeof playSfx === 'function') playSfx('uiCursorFocus');
            _shopSelectedRace = race;
            _shopConfirming = null;
            _shopConfirmToken = false;
            // Surgical refresh — keeps the grid's scroll position.
            const grid = document.getElementById('shopGrid');
            const feat = document.getElementById('shopFeatured');
            const detail = document.getElementById('shopDetail');
            if (!grid || !detail) { window._renderShop(); return; }
            grid.innerHTML = _shopGridHtml();
            if (feat) feat.innerHTML = _shopFeaturedHtml();
            detail.innerHTML = _shopRenderDetail(race);
        };

        window._shopSetFilter = function(type, value) {
            if (typeof playSfx === 'function') playSfx('uiCursorMove');
            if (type === 'faction') _shopFilterFaction = value;
            if (type === 'own') _shopFilterOwn = value;
            window._renderShop();
        };

        window._shopSetSearch = function(val) {
            _shopSearch = val || '';
            // Re-render just the grid to avoid losing input focus.
            const grid = document.getElementById('shopGrid');
            if (!grid) { window._renderShop(); return; }
            grid.innerHTML = _shopGridHtml();
        };

        window._shopAskConfirm = function(race, useToken) {
            if (!_shopBuyable(race)) { if (typeof playSfx === 'function') playSfx('uiError'); return; }
            if (typeof playSfx === 'function') playSfx('uiButtonConfirm');
            _shopConfirming = race;
            _shopConfirmToken = !!useToken;
            const d = document.getElementById('shopDetail');
            if (d) d.innerHTML = _shopRenderDetail(race);
        };

        window._shopCancelConfirm = function() {
            if (typeof playSfx === 'function') playSfx('uiCursorMove');
            _shopConfirming = null;
            _shopConfirmToken = false;
            const d = document.getElementById('shopDetail');
            if (d) d.innerHTML = _shopRenderDetail(_shopSelectedRace);
        };

        window._shopViewInCodex = function(race) {
            if (typeof playSfx === 'function') playSfx('uiButtonConfirm');
            if (AVAILABLE_RACES.indexOf(race) !== -1) _codexSelectedRace = race;
            if (typeof _showTitlePage === 'function') _showTitlePage('codexPage');
            if (typeof window._renderCodex === 'function') window._renderCodex();
        };

        window._shopBuy = function(race, useToken) {
            if (!_shopBuyable(race)) { if (typeof playSfx === 'function') playSfx('uiError'); return; }
            const PS = window.ProfileSystem;
            if (!PS || typeof PS.serverPurchaseUnit !== 'function') {
                alert('You need an online account to unlock units.');
                return;
            }
            const detail = document.getElementById('shopDetail');
            if (detail) detail.style.opacity = '0.5';
            PS.serverPurchaseUnit(race, !!useToken).then(function(r) {
                const d = document.getElementById('shopDetail');
                if (d) d.style.opacity = '1';
                if (r && r.ok) {
                    _shopConfirming = null;
                    _shopConfirmToken = false;
                    if (typeof playSfx === 'function') { try { playSfx('levelUp'); } catch (e) {} }
                    window._refreshWallets();
                    window._renderShop();
                    // Declassify reveal flash on the now-owned dossier.
                    const di = document.getElementById('shopDetail');
                    if (di) {
                        di.style.transition = 'none';
                        di.style.filter = 'brightness(2.2)';
                        requestAnimationFrame(() => {
                            di.style.transition = 'filter 0.7s ease';
                            di.style.filter = 'brightness(1)';
                        });
                    }
                } else {
                    if (typeof playSfx === 'function') { try { playSfx('uiError'); } catch (e) {} }
                    alert((r && r.error) || 'Purchase failed.');
                    if (d) d.innerHTML = _shopRenderDetail(race);
                }
            });
        };

        window._goToShop = function(focusRace) {
            if (typeof playSfx === 'function') playSfx('uiButtonConfirm');
            if (focusRace && AVAILABLE_RACES.indexOf(focusRace) !== -1) _shopSelectedRace = focusRace;
            _shopConfirming = null;
            _shopConfirmToken = false;
            if (typeof _showTitlePage === 'function') _showTitlePage('shopPage');
            // Refresh the server-authoritative economy when entering the shop.
            if (window.ProfileSystem && typeof window.ProfileSystem.serverFetchEconomy === 'function') {
                window.ProfileSystem.serverFetchEconomy().then(() => window._renderShop()).catch(() => {});
            }
            window._renderShop();
        };

        window._shopBack = function() {
            if (typeof playSfx === 'function') playSfx('uiButtonConfirm');
            if (typeof GS !== 'undefined' && typeof state !== 'undefined') state.gameState = GS.MAIN_MENU;
            if (typeof _showTitlePage === 'function') _showTitlePage('mainMenuPage');
            window._refreshWallets();
        };

        // ── ONBOARDING: one-time free first-pick ceremony ──────────────────
        window._maybeShowOnboarding = function() {
            try {
                const PS = window.ProfileSystem;
                if (!PS || !PS.hasServerAccount || !PS.hasServerAccount()) return;
                const id = PS.getServerId ? PS.getServerId() : null;
                if (!id) return;
                const flag = 'ew-onboard-' + id;
                if (localStorage.getItem(flag) === '1') return;
                const econ = PS.getAccountEconomy ? PS.getAccountEconomy() : { freeTokens: 0 };
                if (!econ || (econ.freeTokens || 0) <= 0) return;
                if (document.getElementById('ewOnboardOverlay')) return;

                const ov = document.createElement('div');
                ov.id = 'ewOnboardOverlay';
                ov.style.cssText = 'position:fixed;inset:0;z-index:99998;display:flex;align-items:center;justify-content:center;background:rgba(4,3,8,0.82);backdrop-filter:blur(2px)';
                ov.innerHTML = `
                    <div style="max-width:440px;text-align:center;border:1px solid rgba(184,160,96,0.5);background:linear-gradient(180deg,#15110a,#0c0a06);border-radius:10px;padding:26px 28px;box-shadow:0 12px 60px rgba(0,0,0,0.7)">
                        <div style="font-family:Cinzel,serif;font-size:13px;letter-spacing:0.2em;color:#b8455a;margin-bottom:6px">CLEARANCE GRANTED</div>
                        <div style="font-family:Cinzel,serif;font-size:22px;color:#ffd86a;margin-bottom:10px">Choose Your First Vessel</div>
                        <div style="font-size:13px;color:#b8b0a0;line-height:1.5;margin-bottom:18px">Welcome, operative. The Division issues every new recruit one <b style="color:#9ad0ff">free declassification token</b> 🎟. Spend it on <i>any</i> vessel in the roster — even the rarest files.</div>
                        <button class="primary" id="ewOnboardGo" style="margin-right:8px">Browse the Roster</button>
                        <button id="ewOnboardLater">Maybe Later</button>
                    </div>`;
                document.body.appendChild(ov);
                if (typeof playSfx === 'function') { try { playSfx('uiButtonConfirm'); } catch (e) {} }
                const close = () => { localStorage.setItem(flag, '1'); ov.remove(); };
                document.getElementById('ewOnboardGo').onclick = () => { close(); window._goToShop(); };
                document.getElementById('ewOnboardLater').onclick = () => { if (typeof playSfx === 'function') { try { playSfx('uiCursorMove'); } catch (e) {} } close(); };
            } catch (e) { console.error('[ONBOARD]', e); }
        };

        // ── DEV TOGGLE: view-layer unlock-all + local gold grant ───────────
        // Floating corner panel is DISABLED. The Unlock All toggle now lives in
        // the main-menu Settings → Developer section (see map.js), so this
        // never renders regardless of ?dev=1 or the old localStorage 'ew-dev'
        // flag. To bring the corner panel back, restore the gated body below.
        function _devEnabled() {
            return false;
            // --- old gated behavior (kept for restore) ---
            // try {
            //     if (localStorage.getItem('ew-dev') === '1') return true;
            //     return new URLSearchParams(location.search).has('dev');
            // } catch (e) { return false; }
        }

        function _ensureDevPanel() {
            if (!_devEnabled()) return;
            let panel = document.getElementById('ewDevPanel');
            if (!panel) {
                panel = document.createElement('div');
                panel.id = 'ewDevPanel';
                panel.style.cssText = 'position:fixed;bottom:8px;left:8px;z-index:99990;display:flex;flex-direction:column;gap:4px;background:rgba(20,4,24,0.9);border:1px solid #8a3aa5;border-radius:6px;padding:7px 9px;font:11px DotGothic16,monospace;color:#e0c8ff';
                panel.innerHTML = `
                    <div style="font-weight:700;letter-spacing:0.12em;color:#d59aff">⚙ DEV TOOLS</div>
                    <button id="ewDevUnlockAll" style="font:11px monospace;cursor:pointer">Unlock All: OFF</button>
                    <button id="ewDevGrantGold" style="font:11px monospace;cursor:pointer">+99,999 Gold (local)</button>
                    <div id="ewDevNote" style="font-size:9px;color:#a88ac0;max-width:150px"></div>`;
                document.body.appendChild(panel);
                document.getElementById('ewDevUnlockAll').onclick = function() {
                    window._DEV_UNLOCK_ALL = !window._DEV_UNLOCK_ALL;
                    this.textContent = 'Unlock All: ' + (window._DEV_UNLOCK_ALL ? 'ON' : 'OFF');
                    this.style.color = window._DEV_UNLOCK_ALL ? '#7dff9a' : '';
                    const note = document.getElementById('ewDevNote');
                    if (note) note.textContent = window._DEV_UNLOCK_ALL ? 'VIEW-ONLY: nothing written to your account.' : '';
                    window._refreshWallets();
                    // Re-render whatever unlock-aware screen is open.
                    if (typeof window._renderShop === 'function' && document.getElementById('shopPage') && document.getElementById('shopPage').classList.contains('active')) window._renderShop();
                    if (typeof window._renderCodex === 'function' && document.getElementById('codexPage') && document.getElementById('codexPage').classList.contains('active')) window._renderCodex();
                };
                document.getElementById('ewDevGrantGold').onclick = function() {
                    try {
                        const PS = window.ProfileSystem;
                        const idx = PS && PS.getActiveProfileIndex ? PS.getActiveProfileIndex() : null;
                        if (idx === null || !PS.loadProfile) { return; }
                        const p = PS.loadProfile(idx);
                        if (!p) return;
                        if (!p.account) p.account = { gold: 0, unlockedUnits: [], freeTokens: 0 };
                        p.account.gold = (p.account.gold || 0) + 99999;
                        PS.saveProfile(idx, p);
                        window._refreshWallets();
                        if (typeof window._renderShop === 'function' && document.getElementById('shopPage') && document.getElementById('shopPage').classList.contains('active')) window._renderShop();
                        const note = document.getElementById('ewDevNote');
                        if (note) note.textContent = 'Local mirror only — server balance unchanged.';
                    } catch (e) { console.error(e); }
                };
            }
            const btn = document.getElementById('ewDevUnlockAll');
            if (btn) btn.textContent = 'Unlock All: ' + (window._DEV_UNLOCK_ALL ? 'ON' : 'OFF');
        }
        window._ensureDevPanel = _ensureDevPanel;

        (function _initEconomyUI() {
            function setup() {
                try { _ensureDevPanel(); } catch (e) {}
                try { window._refreshWallets && window._refreshWallets(); } catch (e) {}
            }
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
            else setup();
        })();

        var _cameraFocalX = null;
        var _cameraFocalY = null;

        function _updateCameraFocal(x, y) {
            _cameraFocalX = x;
            _cameraFocalY = y;
        }

        let _lightEl = null;

        function updatePlayerLighting() {
            const unit = getSelectedUnit();
            if (!unit || !boardEl || state.phase !== 'battle') {
                if (_lightEl) {
                    _lightEl.style.opacity = '0';
                }
                return;
            }
            if (!_lightEl) {
                _lightEl = document.createElement('div');
                _lightEl.className = 'player-light';
                _lightEl.style.width = '320px';
                _lightEl.style.height = '320px';
                _lightEl.style.background = 'radial-gradient(circle, rgba(255,240,180,0.15) 0%, rgba(255,200,100,0.08) 40%, transparent 70%)';
                boardEl.appendChild(_lightEl);
            }
            const tileSize = CONFIG.tileSize || 64;
            const gap = CONFIG.tileGap ?? 0;
            const pad = CONFIG.boardPadding ?? 2;
            const cx = pad + unit.x * (tileSize + gap) + tileSize / 2;
            const cy = pad + unit.y * (tileSize + gap) + tileSize / 2;
            _lightEl.style.left = (cx - 160) + 'px';
            _lightEl.style.top = (cy - 160) + 'px';
            _lightEl.style.opacity = '1';

            if (document.body.dataset.cycle === 'night') {
                _lightEl.style.background = 'radial-gradient(circle, rgba(180,200,255,0.20) 0%, rgba(140,170,240,0.10) 35%, transparent 65%)';
            } else {
                _lightEl.style.background = 'radial-gradient(circle, rgba(255,240,180,0.15) 0%, rgba(255,200,100,0.08) 40%, transparent 70%)';
            }
        }

        document.addEventListener('keydown', (e) => {
            /* ── Single Escape owner ────────────────────────────────────────
               One press = ONE action. Priority: modal dialog (handled by the
               dialog listener, we stand down) > pause menu open (close it) >
               back out one menu/aim level > pause. Previously two independent
               keydown listeners both fired: Esc with a submenu open opened
               Pause AND backed a level in the same press. */
            if (e.key === 'Escape' && !state.uiDialog
                && ((state.phase === 'battle' && !state.winner) || state.phase === 'editor')) {
                e.preventDefault();
                if (state.phase === 'editor' || _gamePaused) {
                    togglePauseMenu();
                } else if (typeof _escHasBackTarget === 'function' && _escHasBackTarget()) {
                    handleBackAction();
                } else {
                    togglePauseMenu();
                }
            }

            if (e.key === 'Tab' && state.phase === 'battle' && state.actionMode === 'spell' && state._spellCycleTargets?.length > 1) {
                e.preventDefault();
                cycleSpellTarget(e.shiftKey ? -1 : 1);
            }

            /* Tab also cycles basic-attack targets — the camera swings the
               caster's over-the-shoulder view onto each candidate. */
            if (e.key === 'Tab' && state.phase === 'battle' && state.actionMode === 'attack'
                && state._attackCycleTargets?.length > 1 && typeof cycleAttackTarget === 'function') {
                e.preventDefault();
                cycleAttackTarget(e.shiftKey ? -1 : 1);
            }
        });

        let _devSimBoardRenderTimer = null;
        let boardRenderQueued = false;
        function scheduleBoardRender() {
            if (boardRenderQueued) return;
            boardRenderQueued = true;
            window.requestAnimationFrame(() => {
                boardRenderQueued = false;
                renderBoard();
            });
        }

        let _fpsOverlay = null;
        let _fpsRunning = false;
        let _fpsFrames = 0;
        let _fpsLastSample = 0;
        let _fpsDisplay = 0;

        const _FPS_RING_SIZE = 60;
        const _fpsRing = new Float32Array(_FPS_RING_SIZE);
        let _fpsRingIdx = 0;
        let _fpsRingFilled = 0;
        let _fpsPrevTime = 0;

        function _fpsLoop(now) {
            if (!_fpsRunning) return;
            _fpsFrames++;

            if (_fpsPrevTime > 0) {
                _fpsRing[_fpsRingIdx] = now - _fpsPrevTime;
                _fpsRingIdx = (_fpsRingIdx + 1) % _FPS_RING_SIZE;
                if (_fpsRingFilled < _FPS_RING_SIZE) _fpsRingFilled++;
            }
            _fpsPrevTime = now;
            if (now - _fpsLastSample >= 500) {
                _fpsDisplay = Math.round(_fpsFrames * 1000 / (now - _fpsLastSample));
                _fpsFrames = 0;
                _fpsLastSample = now;
                if (_fpsOverlay) {

                    let minFt = 999, maxFt = 0, sumFt = 0;
                    const count = _fpsRingFilled;
                    for (let i = 0; i < count; i++) {
                        const ft = _fpsRing[i];
                        if (ft < minFt) minFt = ft;
                        if (ft > maxFt) maxFt = ft;
                        sumFt += ft;
                    }
                    const avgFt = count > 0 ? (sumFt / count) : 0;
                    const color = _fpsDisplay >= 55 ? '#4f4' : _fpsDisplay >= 30 ? '#ff4' : '#f44';
                    _fpsOverlay.style.color = color;
                    _fpsOverlay.textContent = `${_fpsDisplay} FPS · ${avgFt.toFixed(1)}ms`;
                }
            }
            requestAnimationFrame(_fpsLoop);
        }

        function setFpsCounter(on) {
            state.showFps = !!on;
            try { localStorage.setItem('ew_showFps', on ? '1' : '0'); } catch(e) {}
            if (on) {
                if (!_fpsOverlay) {
                    _fpsOverlay = document.createElement('div');
                    _fpsOverlay.className = 'fps-overlay';
                    document.body.appendChild(_fpsOverlay);
                }
                _fpsOverlay.style.display = '';
                if (!_fpsRunning) {
                    _fpsRunning = true;
                    _fpsFrames = 0;
                    _fpsLastSample = performance.now();
                    _fpsPrevTime = 0;
                    _fpsRingFilled = 0;
                    requestAnimationFrame(_fpsLoop);
                }
            } else {
                _fpsRunning = false;
                if (_fpsOverlay) _fpsOverlay.style.display = 'none';
            }
        }
        window.setFpsCounter = setFpsCounter;

        try {
            if (localStorage.getItem('ew_showFps') === '1') {
                setTimeout(() => setFpsCounter(true), 100);
            }
        } catch(e) {}

        let _aoePreviewTiles = [];

        function getSpellAoeFootprint(spell, tx, ty, casterUnit) {
            if (!spell) return [];
            if (spell.kind === 'aoe') {
                const cx = spell.aoeOriginSelf ? casterUnit.x : tx;
                const cy = spell.aoeOriginSelf ? casterUnit.y : ty;
                // 2026-07-17 shape pass: aoeShape 'round' (Meteor — 5×5 minus
                // corners) / 'diamond' — must mirror battle.js getSpellAoeArea.
                if (spell.aoeShape === 'round' && typeof getRoundArea === 'function') {
                    return getRoundArea(cx, cy, spell.aoeRadius || 1);
                }
                if (spell.aoeShape === 'diamond' && typeof getDiamondArea === 'function') {
                    return getDiamondArea(cx, cy, spell.aoeRadius || 1);
                }
                return getSquareArea(cx, cy, spell.aoeRadius || 1);
            }
            if (spell.kind === 'bomb') {
                return getSquareArea(tx, ty, spell.blastRadius || 1);
            }
            if (spell.kind === 'summonWeather') {
                const r = spell.weatherTiles ? Math.floor(spell.weatherTiles[1] / 2) : 1;
                return getSquareArea(tx, ty, r);
            }
            if (spell.kind === 'cross') {
                const r = spell.crossRadius || 1;
                const cx = spell.aoeOriginSelf ? casterUnit.x : tx;
                const cy = spell.aoeOriginSelf ? casterUnit.y : ty;
                // diamond: true = full Manhattan diamond (Resonance Pulse)
                if (spell.diamond && typeof getDiamondArea === 'function') {
                    return getDiamondArea(cx, cy, r);
                }
                // diagonal: true = X arms (Crossfire / Arcane Sigil); default
                // cardinal arms — must mirror battle.js getCrossArea.
                const tiles = [{ x: cx, y: cy }];
                for (let i = 1; i <= r; i++) {
                    if (spell.diagonal) {
                        tiles.push({ x: cx + i, y: cy + i }, { x: cx - i, y: cy - i },
                                   { x: cx + i, y: cy - i }, { x: cx - i, y: cy + i });
                    } else {
                        tiles.push({ x: cx + i, y: cy }, { x: cx - i, y: cy },
                                   { x: cx, y: cy + i }, { x: cx, y: cy - i });
                    }
                }
                return tiles.filter(t => t.x >= 0 && t.y >= 0 && t.x < bw() && t.y < bh());
            }
            if (spell.kind === 'line' || spell.kind === 'linePush') {
                if (!casterUnit) return [];
                const dx = Math.sign(tx - casterUnit.x);
                const dy = Math.sign(ty - casterUnit.y);
                if (dx === 0 && dy === 0) return [];
                const lineRange = spell.range || 4;
                const tiles = [];
                for (let i = 1; i <= lineRange; i++) {
                    const lx = casterUnit.x + dx * i;
                    const ly = casterUnit.y + dy * i;
                    if (lx < 0 || ly < 0 || lx >= bw() || ly >= bh()) break;
                    if (!isTerrainPassable(lx, ly) && !spell.destroysObstacles) break;
                    tiles.push({ x: lx, y: ly });
                }
                return tiles;
            }
            if (spell.kind === 'aoePull') {
                return getSquareArea(tx, ty, spell.aoeRadius || 1);
            }

            if (spell.kind === 'terrainCreate' && spell.orientable) {
                // Earth-sign bonus tile included (shared battle.js helper) so
                // the hover preview matches what the handler will paint.
                const count = (typeof _terrainSpellTileCount === 'function')
                    ? _terrainSpellTileCount(spell) : (spell.tileCount || 3);
                const orientation = state._spellOrientation || 'horizontal';
                const half = Math.floor(count / 2);
                const tiles = [];
                for (let i = -half; i < count - half; i++) {
                    const nx = orientation === 'vertical' ? tx : tx + i;
                    const ny = orientation === 'vertical' ? ty + i : ty;
                    if (nx >= 0 && ny >= 0 && nx < bw() && ny < bh()) tiles.push({ x: nx, y: ny });
                }
                return tiles;
            }

            if (['zoneDebuff', 'zoneHeal', 'aoeShield', 'delayed'].includes(spell.kind) && spell.aoeRadius) {
                return getSquareArea(tx, ty, spell.aoeRadius);
            }
            return [];
        }

        function updateAoePreview(x, y) {
            if (state.actionMode !== 'spell') { clearAoePreview(); clearIntentPreview(); return; }
            const unit = getSelectedUnit();
            if (!unit) { clearAoePreview(); clearIntentPreview(); return; }
            const spell = (unit.spells || []).find(s => s.name === state.selectedTool) || (unit._raceAbilities || []).find(s => s.name === state.selectedTool);
            if (!spell) { clearAoePreview(); clearIntentPreview(); return; }

            if (isSpellSelfCast(spell)) {
                if (_aoePreviewTiles.length === 0 && !_aoePreview3dActive) showSelfCastAoePreview(unit, spell);
                updateIntentPreview(unit.x, unit.y);
                return;
            }
            clearAoePreview();
            clearIntentPreview();

            // ── Terrain-shaping spells: voxel ghost preview ─────────────────
            // (2026-07-07 terraforming pass) Instead of the loud generic red
            // AoE tiles, terrain spells show translucent ghost BLOCKS at the
            // exact tiles/heights they will create or carve (footprint comes
            // from battle.js predictTerrainSpellChanges — same math as the
            // cast), plus a quiet color-coded floor wash. Red is reserved for
            // spells that also deal damage.
            const _terrainKinds = { terrainCreate: 1, placeBlock: 1, buildStructure: 1, placeTrap: 1 };
            if (_terrainKinds[spell.kind] && typeof predictTerrainSpellChanges === 'function') {
                const ghostChanges = predictTerrainSpellChanges(unit, spell, x, y);
                if (ghostChanges.length > 0 && typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive()) {
                    if (ThreeRenderer.showTerrainGhost) {
                        ThreeRenderer.showTerrainGhost(ghostChanges);
                        _terrainGhost3dActive = true;
                    }
                    const hurts = !!spell.dmg;
                    const overlayTiles = ghostChanges.map(t => ({
                        x: t.x, y: t.y,
                        color: hurts ? 0xff5544 : (t.color || 0x9fd8ff),
                        opacity: hurts ? 0.32 : 0.22
                    }));
                    ThreeRenderer.setOverlay('aoe', overlayTiles, 0xff3333, 0.3);
                    _aoePreview3dActive = true;
                }
                updateIntentPreview(x, y);
                return;
            }
            // Damage spells that repaint the ground they hit (leaveTerrain,
            // e.g. Dragonfire's lava trail) keep their normal red footprint
            // but add flat paint decals showing what the ground becomes.
            if (spell.leaveTerrain && typeof _terrainPreviewColor === 'function' &&
                typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive() && ThreeRenderer.showTerrainGhost) {
                const fp = getSpellAoeFootprint(spell, x, y, unit);
                if (fp.length > 0) {
                    const lc = _terrainPreviewColor(spell.leaveTerrain);
                    ThreeRenderer.showTerrainGhost(fp.map(t => ({ x: t.x, y: t.y, mode: 'paint', dz: 0, color: lc })));
                    _terrainGhost3dActive = true;
                }
            }

            const footprint = getSpellAoeFootprint(spell, x, y, unit);
            if (footprint.length > 0) {
                const isHeal = ['heal', 'healAll'].includes(spell.kind);

                if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive()) {
                    const overlayTiles = footprint.map(t => {
                        const isCenter = (t.x === x && t.y === y);
                        return {
                            x: t.x, y: t.y,
                            color: isHeal ? (isCenter ? 0x33ff33 : 0x22cc22) : (isCenter ? 0xff3333 : 0xcc2222),
                            opacity: isCenter ? 0.55 : 0.38,
                            cursor: isCenter   // yellow corner brackets on the impact tile
                        };
                    });
                    ThreeRenderer.setOverlay('aoe', overlayTiles, 0xff3333, 0.35);
                    _aoePreview3dActive = true;
                }
            } else {

                if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive()) {
                    const isHealKind = ['heal', 'selfHeal', 'seedHeal', 'revive', 'cleanse'].includes(spell.kind);
                    const isBuffKind = ['buff', 'shield', 'aoeShield', 'warCry'].includes(spell.kind);
                    let singleColor = 0xff3333;
                    if (isHealKind) singleColor = 0x33ff33;
                    else if (isBuffKind) singleColor = 0x4488ff;
                    ThreeRenderer.setOverlay('aoe', [{ x: x, y: y, color: singleColor, opacity: 0.45, cursor: true }], singleColor, 0.45);
                    _aoePreview3dActive = true;
                }
            }

            updateIntentPreview(x, y);
        }

        let _aoePreview3dActive = false;
        let _terrainGhost3dActive = false;

        function clearAoePreview() {
            for (const entry of _aoePreviewTiles) entry.el.classList.remove(entry.cls);
            _aoePreviewTiles = [];
            if (_aoePreview3dActive && typeof ThreeRenderer !== 'undefined') {
                ThreeRenderer.clearOverlay('aoe');
                _aoePreview3dActive = false;
            }
            if (_terrainGhost3dActive && typeof ThreeRenderer !== 'undefined' && ThreeRenderer.clearTerrainGhost) {
                ThreeRenderer.clearTerrainGhost();
                _terrainGhost3dActive = false;
            }
            clearIntentPreview();
        }

        function showSelfCastAoePreview(unit, spell) {
            if (!unit || !spell) return;
            clearAoePreview();
            const kind = spell.kind;
            let radius = 0;
            let isHeal = false;
            if (kind === 'barrage') {
                radius = spell.aoeRadius || spell.range || 3;
                isHeal = false;
            } else if (kind === 'warCry') {
                radius = spell.auraRadius || 3;
                isHeal = true;
            } else if (kind === 'healAll') {
                radius = 4;
                isHeal = true;
            } else if (kind === 'scan') {
                radius = 1;
                isHeal = true;
            } else if (kind === 'selfHeal' || kind === 'escape') {
                radius = 0;
                isHeal = kind === 'selfHeal';
            } else if (spell.aoeOriginSelf && (kind === 'aoe' || kind === 'cross' || kind === 'zoneDebuff' || kind === 'zoneHeal' || kind === 'aoeShield')) {
                radius = spell.aoeRadius || spell.crossRadius || 1;
                isHeal = (kind === 'zoneHeal' || kind === 'aoeShield');
            }
            if (radius <= 0 && kind !== 'selfHeal' && kind !== 'escape') return;

            // 2026-07-17 shape pass: self-centered aoe/cross kinds preview
            // their TRUE footprint (X arms, diamond, round blob, square) via
            // getSpellAoeFootprint — the old Manhattan wash lied about square
            // bursts and can't draw the new shapes at all. Auras (warCry/
            // barrage/healAll/scan) keep the Manhattan wash: that IS their rule.
            let tiles = [];
            if (spell.aoeOriginSelf && (kind === 'aoe' || kind === 'cross')) {
                tiles = getSpellAoeFootprint(spell, unit.x, unit.y, unit);
            } else {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) > radius) continue;
                    const tx = unit.x + dx, ty = unit.y + dy;
                    if (tx < 0 || ty < 0 || tx >= bw() || ty >= bh()) continue;
                    tiles.push({ x: tx, y: ty });
                }
            }
            }
            if (tiles.length === 0) tiles.push({ x: unit.x, y: unit.y });

            if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive()) {
                const overlayTiles = tiles.map(t => {
                    const isCenter = (t.x === unit.x && t.y === unit.y);
                    return {
                        x: t.x, y: t.y,
                        color: isHeal ? (isCenter ? 0x33ff33 : 0x22cc22) : (isCenter ? 0xff3333 : 0xcc2222),
                        opacity: isCenter ? 0.5 : 0.35
                    };
                });
                ThreeRenderer.setOverlay('aoe', overlayTiles, 0xff3333, 0.35);
                _aoePreview3dActive = true;
                return;
            }
        }

        let _intentPreviewEls = [];

        function clearIntentPreview() {
            for (const el of _intentPreviewEls) el.remove();
            _intentPreviewEls = [];

            if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive()) {
                ThreeRenderer.clearIntentBadges();
                ThreeRenderer.clearArrows3D();
                ThreeRenderer.clearGhostUnit();
            }
        }

        function _estimateSpellDamage(caster, target, spell) {
            if (!caster || !target || !spell) return 0;
            // Mirrors doSpell's spellPower assembly (incl. Arcane Surge).
            const spellPower = (caster.spellPower || 0) + getHourglassPower(caster)
                + (typeof getSpellStatBonus === 'function' ? getSpellStatBonus(caster, spell) : 0)
                + (typeof getJobPassiveSpellBonus === 'function' ? getJobPassiveSpellBonus(caster) : 0);
            let baseDmg = 0;

            if (spell.dmg) {
                baseDmg = Math.max(16, (spell.dmg || 0) + spellPower);
            } else if (spell.hitDamages && spell.hitDamages.length) {
                baseDmg = spell.hitDamages.reduce((s, v) => s + Math.max(16, v + spellPower), 0);
            } else if (spell.dotDamage) {
                return spell.dotDamage;
            }
            if (baseDmg <= 0) return 0;

            // Mirrors applyDamageToUnit's capped multiplier product: STAB ×
            // matchup × high ground × range profile × known status combo,
            // applied ONCE before flat mitigation.
            let heightSoak = 0;
            if (isEnemyUnit(caster, target)) {
                baseDmg += getEffectiveAttackBonus(caster, spell.damageType === 'magic' ? 'magic' : 'physical');
                let offMult = getTypeDamageMultiplier(caster, target, spell.spellType || null);

                if (typeof getUnitStandingHeight === 'function') {
                    const srcH = getUnitStandingHeight(caster);
                    const tgtH = getUnitStandingHeight(target);
                    if (srcH > tgtH) {
                        offMult *= 1 + (typeof DOWNHILL_DAMAGE_BONUS !== 'undefined' ? DOWNHILL_DAMAGE_BONUS : 0.1) * (srcH - tgtH);
                    } else if (tgtH > srcH) {
                        heightSoak = (typeof HIGH_GROUND_DEF_BONUS !== 'undefined' ? HIGH_GROUND_DEF_BONUS : 5) * (tgtH - srcH);
                    }
                }
                if (typeof getRangeDamageMult === 'function') {
                    offMult *= getRangeDamageMult(caster, target);
                }
                if (spell.bonusVsStatus && spell.bonusVsStatus.status
                    && unitHasStatus(target, spell.bonusVsStatus.status)) {
                    offMult *= spell.bonusVsStatus.mult || 1.5;
                }
                offMult = Math.min(offMult, typeof MAX_OFFENSIVE_MULT !== 'undefined' ? MAX_OFFENSIVE_MULT : 3);
                baseDmg = Math.max(1, Math.round(baseDmg * offMult));
            }

            if (isEnemyUnit(caster, target) && unitHasStatus(target, 'marked')) {
                baseDmg += target.markBonus ?? 40;
            }

            const ignoreArmor = spell.ignoreArmor || false;
            if (!ignoreArmor) {
                const armor = getEffectiveArmor(target, spell.damageType);
                if (armor > 0) baseDmg = Math.max(1, baseDmg - armor);
                if (heightSoak > 0) baseDmg = Math.max(1, baseDmg - heightSoak);
                // Bulwark (Tank passive): flat 8 soak on armor-respecting hits.
                if (target.cls === 'Tank') baseDmg = Math.max(1, baseDmg - 8);
                const hgRed = getHourglassDamageReduction(target);
                if (hgRed > 0) baseDmg = Math.max(1, baseDmg - hgRed);
            }

            return Math.max(1, baseDmg);
        }

        function _estimateSpellHeal(caster, target, spell) {
            if (!caster || !spell) return 0;
            if (spell.heal) {
                const bonus = typeof getEffectiveHealBonus === 'function' ? getEffectiveHealBonus(caster, spell.heal, target) : 0;
                const raw = spell.heal + (caster.spellPower || 0) + getHourglassPower(caster) + bonus;
                if (target) return Math.min(raw, Math.max(0, target.maxHp - target.hp));
                return raw;
            }
            if (spell.kind === 'selfHeal' && spell.healPct) {
                const raw = Math.round(caster.maxHp * spell.healPct);
                return Math.min(raw, Math.max(0, caster.maxHp - caster.hp));
            }
            return 0;
        }

        /* ── Confirm-step damage forecast ────────────────────────────────
           While a target is armed for confirm (state.pendingTarget), the
           projected damage blinks white on the target's HP bar — nameplate
           (three-renderer _updateDmgPreviewPlates) and target drum
           (hud.js hrlg-thp-preview). Midpoint estimate, non-crit, front
           arc: this is the contract IF the hit lands — dodge, counter and
           crit stay a gamble on purpose. Viewer-local only (pendingTarget
           never syncs), so it's fog/online-safe by construction. */
        function _estimateBasicAttackDamage(attacker, target) {
            if (!attacker || !target) return 0;
            // Mirrors doAttack's roll (battle.js): symmetric ±variance, 0 mid.
            let dmg = Math.max(24, Math.floor((attacker.atk || 0) * 0.65)
                + (typeof getPlantedTreeBonus === 'function' ? getPlantedTreeBonus(attacker) : 0)
                + getHourglassPower(attacker));
            // Brute Force (Raider passive): basic attacks land +20% harder.
            if (attacker.cls === 'Raider') dmg = Math.floor(dmg * 1.2);
            // Warpath (Warrior passive): basic attacks hit +15% harder.
            else if (attacker.cls === 'Warrior') dmg = Math.floor(dmg * 1.15);
            let heightSoak = 0;
            if (isEnemyUnit(attacker, target)) {
                dmg += getEffectiveAttackBonus(attacker, 'physical');
                // Capped multiplier product, mirroring applyDamageToUnit.
                let offMult = getTypeDamageMultiplier(attacker, target, null);
                if (typeof getUnitStandingHeight === 'function') {
                    const srcH = getUnitStandingHeight(attacker);
                    const tgtH = getUnitStandingHeight(target);
                    if (srcH > tgtH) {
                        offMult *= 1 + (typeof DOWNHILL_DAMAGE_BONUS !== 'undefined' ? DOWNHILL_DAMAGE_BONUS : 0.1) * (srcH - tgtH);
                    } else if (tgtH > srcH) {
                        heightSoak = (typeof HIGH_GROUND_DEF_BONUS !== 'undefined' ? HIGH_GROUND_DEF_BONUS : 5) * (tgtH - srcH);
                    }
                }
                if (typeof getRangeDamageMult === 'function') {
                    offMult *= getRangeDamageMult(attacker, target);
                }
                offMult = Math.min(offMult, typeof MAX_OFFENSIVE_MULT !== 'undefined' ? MAX_OFFENSIVE_MULT : 3);
                dmg = Math.max(1, Math.round(dmg * offMult));
                if (unitHasStatus(target, 'marked')) dmg += target.markBonus ?? 40;
            }
            const armor = getEffectiveArmor(target, 'physical');
            if (armor > 0) dmg = Math.max(1, dmg - armor);
            if (heightSoak > 0) dmg = Math.max(1, dmg - heightSoak);
            // Bulwark (Tank passive): flat 8 soak on armor-respecting hits.
            if (target.cls === 'Tank') dmg = Math.max(1, dmg - 8);
            const hgRed = getHourglassDamageReduction(target);
            if (hgRed > 0) dmg = Math.max(1, dmg - hgRed);
            return Math.max(1, dmg);
        }

        /* Projected HP the target actually loses: the mid estimate run through
           the status damage-taken multipliers and the shield soak, clamped to
           current HP. spell=null → basic attack. Returns 0 for non-damage. */
        function predictDamageToUnit(attacker, target, spell) {
            if (!attacker || !target || target.dead) return 0;
            if (!isEnemyUnit(attacker, target)) return 0;
            if (getActiveStatusKeys(target).some(k => STATUS_DEFS[k]?.invulnerable)) return 0;
            let dmg = spell ? _estimateSpellDamage(attacker, target, spell)
                            : _estimateBasicAttackDamage(attacker, target);
            if (dmg <= 0) return 0;
            const _dmgType = spell ? (spell.damageType || 'magic') : 'physical';
            if (_dmgType !== 'magic' && typeof getStatusRangedDamageTakenMultiplier === 'function') {
                const rm = getStatusRangedDamageTakenMultiplier(target);
                if (rm !== 1) dmg = Math.max(1, Math.round(dmg * rm));
            }
            if (typeof getStatusDamageTakenMultiplier === 'function') {
                const dm = getStatusDamageTakenMultiplier(target);
                if (dm !== 1) dmg = Math.max(1, Math.round(dmg * dm));
            }
            dmg = Math.max(0, dmg - (target.shield || 0));   // shield soaks first
            return Math.min(dmg, Math.max(0, target.hp));
        }

        /* Resolve the currently ARMED action into {unitId, dmg, lethal} — or
           null when nothing damaging is armed. Called per frame by the 3D
           nameplate pass, so it memoizes on the action/target fingerprint. */
        let _dmgPreviewCacheKey = '';
        let _dmgPreviewCacheVal = null;
        function getPendingDamagePreview() {
            // ── Spell-row hover forecast (quick-cast menus) ──
            // While the player hovers a castable row with a target unit
            // selected (the arrows preview, hud.js _showMoveArrowPreview),
            // forecast THAT row's action on the target's HP bar: damage as
            // the classic white slice off the fill's leading edge, heals as
            // a white slice GROWING from it ({heal} instead of {dmg} — the
            // nameplate painter branches on it). Takes precedence over the
            // armed pendingTarget forecast; cleared with the arrows.
            const hov = window._hoverActionForecast;
            if (hov && !state._actionExecuting && !state.devAutoSim) {
                const attacker = state.units.find(u => u.id === hov.attackerId && !u.dead);
                const target = state.units.find(u => u.id === hov.targetId && !u.dead);
                if (attacker && target) {
                    let spell = null;
                    if (hov.spellName) {
                        spell = (attacker.spells || []).find(s => s.name === hov.spellName)
                            || (attacker._raceAbilities || []).find(s => s.name === hov.spellName);
                    }
                    const key = ['hov', attacker.id, target.id,
                        (spell && spell.name) || (hov.isAttack ? 'atk' : ''),
                        target.hp, target.shield || 0,
                        attacker.x, attacker.y, attacker.z ?? 0].join('|');
                    if (key === _dmgPreviewCacheKey) return _dmgPreviewCacheVal;
                    let val = null;
                    if (spell && !isEnemyUnit(attacker, target)) {
                        // Ally (or self) cast → projected heal, clamped to the
                        // missing HP by _estimateSpellHeal (full HP = no flash).
                        const heal = _estimateSpellHeal(attacker, target, spell);
                        if (heal > 0) val = { unitId: target.id, heal: heal };
                    } else if ((spell || hov.isAttack) && target.id !== attacker.id) {
                        const dmg = predictDamageToUnit(attacker, target, spell);
                        if (dmg > 0) val = { unitId: target.id, dmg: dmg, lethal: dmg >= (target.hp || 0) };
                    }
                    _dmgPreviewCacheKey = key;
                    _dmgPreviewCacheVal = val;
                    return val;
                }
                return null;
            }
            const pt = state.pendingTarget;
            if (!pt || state._actionExecuting || state.devAutoSim) return null;
            const mode = pt.mode || state.actionMode;
            if (mode !== 'attack' && mode !== 'spell') return null;
            const attacker = typeof getSelectedUnit === 'function' ? getSelectedUnit() : null;
            if (!attacker || attacker.dead) return null;
            const target = (pt.z !== undefined && pt.z !== null)
                ? (unitAt(pt.x, pt.y, pt.z) || unitAt(pt.x, pt.y))
                : unitAt(pt.x, pt.y);
            if (!target || target.dead || target.id === attacker.id) return null;
            let spell = null;
            if (mode === 'spell') {
                const toolName = pt.tool || state.selectedTool;
                spell = (attacker.spells || []).find(s => s.name === toolName)
                    || (attacker._raceAbilities || []).find(s => s.name === toolName);
                if (!spell) return null;
                const _damaging = spell.dmg || (spell.hitDamages && spell.hitDamages.length) || spell.dotDamage;
                if (!_damaging) return null;
            }
            const key = [attacker.id, target.id, mode, (spell && spell.name) || '',
                target.hp, target.shield || 0, attacker.x, attacker.y, attacker.z ?? 0].join('|');
            if (key === _dmgPreviewCacheKey) return _dmgPreviewCacheVal;
            const dmg = predictDamageToUnit(attacker, target, spell);
            _dmgPreviewCacheKey = key;
            _dmgPreviewCacheVal = dmg > 0
                ? { unitId: target.id, dmg: dmg, lethal: dmg >= (target.hp || 0) }
                : null;
            return _dmgPreviewCacheVal;
        }
        window.getPendingDamagePreview = getPendingDamagePreview;

        // Green !-circle marking a super-effective hit (inline-styled so it
        // renders identically through the 3D intent badges and the DOM path).
        const _SE_CIRCLE_HTML = '<span style="display:inline-flex;align-items:center;justify-content:center;'
            + 'width:14px;height:14px;border-radius:50%;background:#2ecc71;color:#06130a;'
            + 'font-weight:900;font-size:11px;line-height:1;vertical-align:middle;margin-right:4px;'
            + 'box-shadow:0 0 6px rgba(46,204,113,0.8)">!</span>';

        function _getTypeEffLabel(caster, target, spell) {
            if (!caster || !target || !isEnemyUnit(caster, target)) return null;
            // STAB is a silent bonus — the label only speaks about the actual
            // weak/resist matchup, so back the STAB factor out first.
            const mult = getTypeDamageMultiplier(caster, target, spell.spellType || null);
            const hasStab = spell.spellType && (caster.types || []).includes(spell.spellType);
            const effMult = hasStab ? mult / ((typeof STAB_MULTIPLIER !== 'undefined') ? STAB_MULTIPLIER : 1.25) : mult;
            if (effMult > 1.001) return { text: _SE_CIRCLE_HTML + 'SUPER EFFECTIVE', cls: 'super-effective' };
            if (effMult < 0.999) return { text: 'RESISTED', cls: 'not-effective' };
            return null;
        }

        function _getStatusPreviewLabels(spell) {
            if (!spell.statusEffects || spell.statusEffects.length === 0) return [];
            const labels = [];
            for (const se of spell.statusEffects) {
                const def = STATUS_DEFS[se.id];
                const label = def?.label || se.id;
                const dur = se.duration || 1;
                const isDebuff = ['stun', 'silence', 'slow', 'blind', 'poison', 'burn', 'stagger', 'marked', 'fear', 'frozen', 'bleed', 'confused', 'drowning', 'sleep'].includes(se.id);
                labels.push({ text: `${label} ${dur}t`, isDebuff });
            }
            return labels;
        }

        function updateIntentPreview(x, y) {
            clearIntentPreview();
            if (state.actionMode !== 'spell' || state.devAutoSim) return;
            const caster = getSelectedUnit();
            if (!caster || !boardEl) return;
            const spell = (caster.spells || []).find(s => s.name === state.selectedTool) || (caster._raceAbilities || []).find(s => s.name === state.selectedTool);
            if (!spell) return;

            const affectedTiles = _getIntentAffectedTiles(caster, spell, x, y);
            const kind = spell.kind;

            for (const at of affectedTiles) {
                const target = unitAt(at.x, at.y);
                if (!target || target.dead) continue;

                const badgeStack = [];
                let yOff = 0;

                if (spell.dmg || (spell.hitDamages && spell.hitDamages.length) || spell.dotDamage) {
                    if (isEnemyUnit(caster, target) || (spell.kind === 'aoe' && !isAllyUnit(target, caster))) {
                        const dmg = _estimateSpellDamage(caster, target, spell);
                        if (dmg > 0) {
                            const willKill = target.hp <= dmg && target.shield <= 0;
                            badgeStack.push({ html: `−${dmg}`, cls: 'intent-damage', yOff });
                            yOff += 18;
                            if (willKill) {
                                badgeStack.push({ html: 'LETHAL', cls: 'intent-kill', yOff });
                                yOff += 14;
                            }
                        }
                    }
                }

                if (spell.heal || spell.kind === 'selfHeal') {
                    if (isAllyUnit(target, caster) || target.id === caster.id) {
                        const heal = _estimateSpellHeal(caster, target, spell);
                        if (heal > 0) {
                            badgeStack.push({ html: `+${heal}`, cls: 'intent-heal', yOff });
                            yOff += 18;
                        }
                    }
                }

                if (spell.shield) {
                    if (isAllyUnit(target, caster) || target.id === caster.id) {
                        badgeStack.push({ html: `+${spell.shield} 🛡`, cls: 'intent-shield', yOff });
                        yOff += 16;
                    }
                }

                if (spell.dmg || (spell.hitDamages && spell.hitDamages.length)) {
                    const typeEff = _getTypeEffLabel(caster, target, spell);
                    if (typeEff) {
                        badgeStack.push({ html: typeEff.text, cls: `intent-type-eff ${typeEff.cls}`, yOff });
                        yOff += 14;
                    }
                }

                const statusLabels = _getStatusPreviewLabels(spell);
                for (const sl of statusLabels) {
                    const isFriendly = isAllyUnit(target, caster) || target.id === caster.id;

                    if (sl.isDebuff && isFriendly) continue;
                    if (!sl.isDebuff && !isFriendly) continue;
                    badgeStack.push({
                        html: sl.text,
                        cls: `intent-status ${sl.isDebuff ? 'intent-status-debuff' : 'intent-status-buff'}`,
                        yOff
                    });
                    yOff += 14;
                }

                _renderIntentBadges(target.x, target.y, badgeStack);
            }

            _renderDisplacementArrows(caster, spell, x, y);
        }

        function _getIntentAffectedTiles(caster, spell, tx, ty) {

            const footprint = getSpellAoeFootprint(spell, tx, ty, caster);
            if (footprint.length > 0) return footprint;

            if (isSpellSelfCast(spell)) return [{ x: caster.x, y: caster.y }];

            return [{ x: tx, y: ty }];
        }

        function _renderIntentBadges(tileX, tileY, badgeStack) {
            if (badgeStack.length === 0) return;

            if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive()) {

                var mapped = [];
                for (var i = 0; i < badgeStack.length; i++) {
                    var b = badgeStack[i];
                    var cls = b.cls.replace('intent-damage', 'ti-damage')
                        .replace('intent-heal', 'ti-heal')
                        .replace('intent-shield', 'ti-shield')
                        .replace('intent-kill', 'ti-kill')
                        .replace('intent-status-debuff', 'ti-debuff')
                        .replace('intent-status-buff', 'ti-buff')
                        .replace('intent-status', 'ti-status')
                        .replace('intent-type-eff', 'ti-type-eff');
                    mapped.push({ html: b.html, cls: cls, yOff: b.yOff });
                }
                ThreeRenderer.showIntentBadges(tileX, tileY, mapped);
                return;
            }

                const _bw = bw();
                const idx = tileY * _bw + tileX;
                const tileEl = boardEl.children?.[idx];
                if (!tileEl) return;
                const ts = CONFIG.tileSize || BASE_TILE;

                for (let i = 0; i < badgeStack.length; i++) {
                    const b = badgeStack[i];
                    const el = document.createElement('div');
                    el.className = `dio-intent-badge ${b.cls}`;
                    el.innerHTML = b.html;
                    el.style.bottom = `${70 + b.yOff}%`;
                    tileEl.appendChild(el);
                    _intentPreviewEls.push(el);
                }
        }

        function _renderDisplacementArrows(caster, spell, tx, ty) {
            const kind = spell.kind;
            if (!projectileLayerEl) return;
            const ts = CONFIG.tileSize || BASE_TILE;

            // Shared colours (match the quick-action menu): push = magenta,
            // pull = cyan, dash = green, teleport = violet, swap = ice-blue.
            const PUSH = '#ff66cc', PUSH_H = 0xff66cc;
            const PULL = '#66ccff', PULL_H = 0x66ccff;
            const DASH = '#55ff88', DASH_H = 0x55ff88;
            const TELE = '#bb88ff', TELE_H = 0xbb88ff;
            const SWAP = '#66ddff', SWAP_H = 0x66ddff;

            if (kind === 'pull') {
                const target = unitAt(tx, ty);
                if (!target || !isEnemyUnit(caster, target)) return;
                const pullDist = spell.pullDistance || 2;
                const dx = Math.sign(caster.x - target.x);
                const dy = Math.sign(caster.y - target.y);
                let endX = target.x, endY = target.y;
                for (let i = 1; i <= pullDist; i++) {
                    const nx = target.x + dx * i, ny = target.y + dy * i;
                    if (!isInside(nx, ny) || !canOccupy(nx, ny)) break;
                    endX = nx; endY = ny;
                }
                if (endX !== target.x || endY !== target.y) {
                    _drawArrowBetweenTiles(target.x, target.y, endX, endY, PULL, false, false, { arc: 0.18, flow: true });
                    _showDisplaceGhost(target, endX, endY, PULL_H);
                }
            }

            if (kind === 'utility' && (spell.id === 'grapple' || spell.id === 'raceGrapple')) {
                const target = unitAt(tx, ty);
                if (target && isEnemyUnit(caster, target)) {
                    // Reel an enemy up to 2 tiles toward the caster (stops before the caster).
                    const dx = Math.sign(caster.x - target.x);
                    const dy = Math.sign(caster.y - target.y);
                    let endX = target.x, endY = target.y;
                    for (let i = 1; i <= 2; i++) {
                        const nx = target.x + dx * i, ny = target.y + dy * i;
                        if (!isInside(nx, ny) || !canOccupy(nx, ny)) break;
                        if (nx === caster.x && ny === caster.y) break;
                        endX = nx; endY = ny;
                    }
                    if (endX !== target.x || endY !== target.y) {
                        _drawArrowBetweenTiles(target.x, target.y, endX, endY, PULL, false, false, { arc: 0.18, flow: true });
                        _showDisplaceGhost(target, endX, endY, PULL_H);
                    }
                } else if (!target) {
                    // Pull yourself along the rope to the clicked tile (or up to the
                    // last clear tile before an obstacle). Mirrors the engine's reel.
                    const line = (typeof window._ewLineTiles === 'function')
                        ? window._ewLineTiles(caster.x, caster.y, tx, ty) : [];
                    let endX = caster.x, endY = caster.y;
                    for (const p of line) {
                        if (!isInside(p.x, p.y)) break;
                        if (typeof unitAt === 'function' && unitAt(p.x, p.y)) break;
                        if (typeof isTerrainPassable === 'function' && !isTerrainPassable(p.x, p.y)) break;
                        endX = p.x; endY = p.y;
                        if (p.x === tx && p.y === ty) break;
                    }
                    if (endX !== caster.x || endY !== caster.y) {
                        _drawArrowBetweenTiles(caster.x, caster.y, endX, endY, DASH, false, false, { arc: 0.24, flow: true });
                        _showDisplaceGhost(caster, endX, endY, DASH_H);
                    }
                }
            }

            if (kind === 'linePush') {
                const footprint = getSpellAoeFootprint(spell, tx, ty, caster);
                const pushDir = { x: Math.sign(tx - caster.x), y: Math.sign(ty - caster.y) };
                for (const t of footprint) {
                    const target = unitAt(t.x, t.y);
                    if (!target || isAllyUnit(target, caster)) continue;
                    const pushDist = spell.pushDistance || 2;
                    let endX = target.x, endY = target.y;
                    for (let i = 1; i <= pushDist; i++) {
                        const nx = target.x + pushDir.x * i, ny = target.y + pushDir.y * i;
                        if (!isInside(nx, ny) || !canOccupy(nx, ny)) break;
                        endX = nx; endY = ny;
                    }
                    if (endX !== target.x || endY !== target.y) {
                        _drawArrowBetweenTiles(target.x, target.y, endX, endY, PUSH, false, false, { arc: 0.3, flow: true });
                        _showDisplaceGhost(target, endX, endY, PUSH_H);
                    }
                }
            }

            if (kind === 'aoePull' && spell.pullToCenter) {
                const footprint = getSpellAoeFootprint(spell, tx, ty, caster);
                for (const t of footprint) {
                    const target = unitAt(t.x, t.y);
                    if (!target || isAllyUnit(target, caster)) continue;
                    if (target.x === tx && target.y === ty) continue;
                    const dx = Math.sign(tx - target.x);
                    const dy = Math.sign(ty - target.y);
                    const endX = target.x + dx, endY = target.y + dy;
                    if (isInside(endX, endY)) {
                        _drawArrowBetweenTiles(target.x, target.y, endX, endY, PULL, false, false, { arc: 0.18, flow: true });
                        _showDisplaceGhost(target, endX, endY, PULL_H);
                    }
                }
            }

            if (kind === 'swap') {
                const target = unitAt(tx, ty);
                if (target && target.id !== caster.id) {
                    // Both bodies trade places — hologram each at the other's tile.
                    _drawArrowBetweenTiles(caster.x, caster.y, tx, ty, SWAP, false, false, { arc: 0.28, flow: true });
                    _drawArrowBetweenTiles(tx, ty, caster.x, caster.y, SWAP, false, false, { arc: 0.28, flow: true });
                    _showDisplaceGhost(caster, tx, ty, SWAP_H);
                    _showDisplaceGhost(target, caster.x, caster.y, SWAP_H);
                }
            }

            if (spell.chargeToTarget || kind === 'dash') {

                const adj = [
                    { x: tx - 1, y: ty }, { x: tx + 1, y: ty },
                    { x: tx, y: ty - 1 }, { x: tx, y: ty + 1 }
                ];
                adj.sort((a, b) =>
                    (Math.abs(a.x - caster.x) + Math.abs(a.y - caster.y)) -
                    (Math.abs(b.x - caster.x) + Math.abs(b.y - caster.y))
                );
                const landTile = adj.find(t => isInside(t.x, t.y) && canOccupy(t.x, t.y));
                if (landTile) {
                    _drawArrowBetweenTiles(caster.x, caster.y, landTile.x, landTile.y, DASH, false, false, { arc: 0.24, flow: true });
                    _showDisplaceGhost(caster, landTile.x, landTile.y, DASH_H);
                }
            }

            if (kind === 'teleport') {
                // Teleport is instantaneous — a dotted straight line + a hologram
                // of the caster at the destination reads better than an arc.
                _drawArrowBetweenTiles(caster.x, caster.y, tx, ty, TELE, false, true, { arc: 0, flow: false });
                _showDisplaceGhost(caster, tx, ty, TELE_H);
            }

            if (kind === 'displacement') {
                const target = unitAt(tx, ty);
                if (target && isEnemyUnit(caster, target)) {
                    // A fling knocks the target AWAY from the caster — trace the
                    // actual shove and hologram where it lands.
                    const dx = Math.sign(target.x - caster.x) || 1;
                    const dy = Math.sign(target.y - caster.y);
                    const dist = spell.displaceDistance || spell.pushDistance || 2;
                    let endX = target.x, endY = target.y;
                    for (let i = 1; i <= dist; i++) {
                        const nx = target.x + dx * i, ny = target.y + dy * i;
                        if (!isInside(nx, ny) || !canOccupy(nx, ny)) break;
                        endX = nx; endY = ny;
                    }
                    if (endX !== target.x || endY !== target.y) {
                        _drawArrowBetweenTiles(target.x, target.y, endX, endY, PUSH, false, false, { arc: 0.3, flow: true });
                        _showDisplaceGhost(target, endX, endY, PUSH_H);
                    } else {
                        _drawArrowBetweenTiles(caster.x, caster.y, tx, ty, PUSH, false, false, { arc: 0.3, flow: true });
                    }
                }
            }
        }

        // Hologram of a unit at the tile a spell will move it to (or the caster's
        // landing tile for dash/teleport/swap). Mirrors the quick-action menu so
        // the main spell menu previews WHAT the spell does, not just its aim.
        function _showDisplaceGhost(unit, x, y, hexColor) {
            if (!unit) return;
            if (typeof ThreeRenderer === 'undefined' || !ThreeRenderer.isActive()) return;
            var surfY = ThreeRenderer.tileTopY(x, y);
            var tag = 'disp:' + (unit.id != null ? unit.id : (x + ',' + y));
            ThreeRenderer.showGhostUnit(unit, x, y, surfY, { tag: tag, color: hexColor, opacity: 0.5 });
        }

        function _drawArrowBetweenTiles(fromX, fromY, toX, toY, color, dashed, dotted, opts) {

            if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive()) {

                var hexColor = 0xffffff;
                if (typeof color === 'string' && color.charAt(0) === '#') {
                    hexColor = parseInt(color.substring(1), 16);
                }
                ThreeRenderer.drawArrow3D(fromX, fromY, toX, toY, hexColor, !!dashed, undefined, undefined, opts || {});
                return;
            }

            if (!projectileLayerEl) return;
            const from = tilePixelCenter(fromX, fromY);
            const to = tilePixelCenter(toX, toY);
            const ts = CONFIG.tileSize || BASE_TILE;

            const el = document.createElement('div');
            el.className = 'intent-arrow-overlay';
            el.style.left = '0'; el.style.top = '0';
            el.style.width = '100%'; el.style.height = '100%';
            el.style.transform = 'none';

            const dx = to.left - from.left, dy = to.top - from.top;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len < 2) return;
            const headLen = Math.min(12, ts * 0.12);
            const angle = Math.atan2(dy, dx);

            const inset = ts * 0.2;
            const sx = from.left + Math.cos(angle) * inset;
            const sy = from.top + Math.sin(angle) * inset;
            const ex = to.left - Math.cos(angle) * inset;
            const ey = to.top - Math.sin(angle) * inset;

            const hx1 = ex - headLen * Math.cos(angle - 0.4);
            const hy1 = ey - headLen * Math.sin(angle - 0.4);
            const hx2 = ex - headLen * Math.cos(angle + 0.4);
            const hy2 = ey - headLen * Math.sin(angle + 0.4);

            const dashAttr = dashed ? ' stroke-dasharray="8 5"' : dotted ? ' stroke-dasharray="3 6"' : '';
            el.innerHTML = `<svg style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible">
                <line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="${color}" stroke-width="3" stroke-linecap="round"${dashAttr} opacity="0.85"/>
                <polygon points="${ex},${ey} ${hx1},${hy1} ${hx2},${hy2}" fill="${color}" opacity="0.9"/>
            </svg>`;

            projectileLayerEl.appendChild(el);
            _intentPreviewEls.push(el);
        }

        window.updateIntentPreview = updateIntentPreview;
        window.clearIntentPreview = clearIntentPreview;

        function renderBattleSelectionUI({
            includeBoard = true,
            includeStatus = true
        } = {}) {
            markDirty('selectedUnit', 'teams', 'buttons', 'hud');
            if (includeStatus) markDirty('status');
            if (includeBoard) markDirty('board');
            renderIfDirty();
        }

        function renderInventoryPanel() {

            const existing = document.querySelector('.battle-inventory-panel');
            if (existing) existing.remove();
            if (state.phase !== 'battle' || state.winner) return;
            const unit = getSelectedUnit();
            if (!unit || unit.dead) return;

            if (state.autoPlayers?.[unit.player] && !state.devAutoSim) return;

            const mapCenter = document.querySelector('.map-center');
            if (!mapCenter) return;

            if (getComputedStyle(mapCenter).position === 'static') mapCenter.style.position = 'relative';

            const panel = document.createElement('div');
            panel.className = 'battle-inventory-panel';

            const slots = [];

            const eq = unit.equipment || {};
            for (const accSlot of ['accessory1', 'accessory2']) {
                const accId = eq[accSlot];
                if (!accId) continue;
                const def = typeof EQUIP_DEFS !== 'undefined' ? EQUIP_DEFS[accId] : null;
                if (!def) continue;
                const icon = accId === 'binoculars' ? '🔭' :
                             accId === 'walkie_talkie' ? '📻' :
                             accId === 'flair' ? '🔥' :
                             accId === 'ward' ? '👁' :
                             accId === 'telescope' ? '🔭' :
                             accId === 'jetpack' ? '🚀' : '🎒';
                const usedUp = (accId === 'flair' && unit._usedFlair) || (accId === 'ward' && unit._usedWard);
                slots.push(`<div class="inv-slot inv-accessory" style="${usedUp ? 'opacity:0.35' : ''}" onclick="event.stopPropagation()${accId === 'flair' && !unit._usedFlair ? "; setActionMode('flair')" : accId === 'ward' && !unit._usedWard ? "; setActionMode('ward')" : ''}">
                    ${icon}
                    <div class="inv-tooltip"><div class="inv-tt-name">${escapeHtml(def.label)}</div><div class="inv-tt-desc">${escapeHtml(def.desc)}${usedUp ? '<br><em>(Used)</em>' : ''}</div></div>
                </div>`);
            }

            const hasItems = Object.keys(ITEM_RULES).some(k => (unit.items?.[k] || 0) > 0);
            if (slots.length > 0 && hasItems) {
                slots.push('<div class="inv-separator"></div>');
            }

            for (const [key, rule] of Object.entries(ITEM_RULES)) {
                const count = unit.items?.[key] || 0;
                if (count <= 0) continue;
                const meta = ITEM_META[key] || { icon: '📦' };
                const isBane = !!rule.baneType;
                const slotCls = isBane ? 'inv-bane' : '';
                slots.push(`<div class="inv-slot ${slotCls}" onclick="event.stopPropagation(); chooseItemAction('${key}')">
                    ${isBane ? '<div class="bane-sprite bane-' + rule.baneType + '"></div>' : meta.icon}
                    <span class="inv-count">${count}</span>
                    <div class="inv-tooltip"><div class="inv-tt-name">${escapeHtml(rule.name)}</div><div class="inv-tt-desc">${escapeHtml(rule.desc)}</div></div>
                </div>`);
            }

            if (slots.length === 0) return;
            panel.innerHTML = slots.join('');
            mapCenter.appendChild(panel);
        }

        function renderBattleUpdate() {
            markDirty('board', 'teams', 'status', 'selectedUnit', 'buttons', 'hud', 'log', 'infoPanel');
            renderIfDirty();

            const _vp = getViewerPlayer();
            if (state.phase === 'battle' && !state.autoPlayers?.[_vp]) {
                updateEnemySightings(_vp);
                renderEnemyRoster();
            }

            if (window._broadcastState) window._broadcastState();
        }

        function renderAfterMove() {

            markDirty('board', 'status', 'selectedUnit', 'log', 'infoPanel', 'hud');
            renderIfDirty();
            {
                const _vp = getViewerPlayer();
                if (state.phase === 'battle' && !state.autoPlayers?.[_vp]) {
                    updateEnemySightings(_vp);
                    renderEnemyRoster();
                }
            }
        }

        function renderAfterCombat() {

            renderBattleUpdate();
        }

        function renderAfterMinorAction() {

            markDirty('board', 'status', 'selectedUnit', 'log', 'infoPanel', 'hud');
            renderIfDirty();
            {
                const _vp = getViewerPlayer();
                if (state.phase === 'battle' && !state.autoPlayers?.[_vp]) {
                    updateEnemySightings(_vp);
                    renderEnemyRoster();
                }
            }
        }

        const startBattleBtn = document.getElementById('startBattle');
        if (startBattleBtn) startBattleBtn.onclick = function() {
            if (!state.teamLockedIn) {

                applyPartyBuild();
            } else {

                startMatch();
            }
        };
        const devAutoSimBtn = document.getElementById('devAutoSimBtn');
        if (devAutoSimBtn) devAutoSimBtn.onclick = toggleDevAutoSim;
        const devSimSpeed1Btn = document.getElementById('devSimSpeed1Btn');
        const devSimSpeed2Btn = document.getElementById('devSimSpeed2Btn');
        const devSimSpeed4Btn = document.getElementById('devSimSpeed4Btn');
        const devSimBattleSpeed1Btn = document.getElementById('devSimBattleSpeed1Btn');
        const devSimBattleSpeed2Btn = document.getElementById('devSimBattleSpeed2Btn');
        const devSimBattleSpeed4Btn = document.getElementById('devSimBattleSpeed4Btn');
        if (devSimSpeed1Btn) devSimSpeed1Btn.onclick = () => setDevSimSpeed(1);
        if (devSimSpeed2Btn) devSimSpeed2Btn.onclick = () => setDevSimSpeed(2);
        if (devSimSpeed4Btn) devSimSpeed4Btn.onclick = () => setDevSimSpeed(4);
        if (devSimBattleSpeed1Btn) devSimBattleSpeed1Btn.onclick = () => setDevSimSpeed(1);
        if (devSimBattleSpeed2Btn) devSimBattleSpeed2Btn.onclick = () => setDevSimSpeed(2);
        if (devSimBattleSpeed4Btn) devSimBattleSpeed4Btn.onclick = () => setDevSimSpeed(4);
        const devSimBattleSpeed16Btn = document.getElementById('devSimBattleSpeed16Btn');
        if (devSimBattleSpeed16Btn) devSimBattleSpeed16Btn.onclick = () => setDevSimSpeed(16);

        function syncCameraCheckboxes() {
            const checked = !state.cameraDisabled;
            ['cameraToggleBuilder', 'cameraToggleBuilder2', 'cameraToggleBattle'].forEach(id => {
                const cb = document.getElementById(id);
                if (cb) cb.checked = checked;
            });
            if (state.cameraDisabled) resetBoardCamera(true);
        }

        function onCameraToggle(e) {
            state.cameraDisabled = !e.target.checked;
            syncCameraCheckboxes();
        }

        // Cinematic action camera ("Action Cam" pause toggle / dev-bar "3P"):
        // swoops behind the caster for offensive actions (see
        // playOffensiveActionCamera in battle.js). Persisted in localStorage.
        window._setCinematicActionCam = function(on) {
            on = !!on;
            state.cinematicActionCam = on;
            try { localStorage.setItem('ew_cinematicActionCam', on ? '1' : '0'); } catch(e) {}
            // keep any other surfaces (pause toggle, dev-bar "3P") in sync
            const devCb = document.getElementById('actionCamToggleBattle');
            if (devCb && devCb.checked !== on) devCb.checked = on;
        };
        const _actionCamDevCb = document.getElementById('actionCamToggleBattle');
        if (_actionCamDevCb) _actionCamDevCb.onchange = function(e) { window._setCinematicActionCam(e.target.checked); };

        const camCb1 = document.getElementById('cameraToggleBuilder');
        const camCb2 = document.getElementById('cameraToggleBattle');
        if (camCb1) camCb1.onchange = onCameraToggle;
        if (camCb2) camCb2.onchange = onCameraToggle;

        function toggleTeamVision(checked) {
            state.teamVision = !!checked;
            const cb = document.getElementById('visionToggleBattle');
            if (cb) cb.checked = state.teamVision;
            addLog(`Vision mode: ${state.teamVision ? 'Team (all allies)' : 'Solo (selected unit)'}`);
            scheduleBoardRender();
        }
        window.toggleTeamVision = toggleTeamVision;

        function syncAnimCheckboxes() {
            const checked = !state.animationsDisabled;
            ['animToggleBuilder', 'animToggleBuilder2', 'animToggleBattle'].forEach(id => {
                const cb = document.getElementById(id);
                if (cb) cb.checked = checked;
            });
        }

        function onAnimToggle(e) {
            state.animationsDisabled = !e.target.checked;
            // Persist like the Action-Cam toggle — this used to silently reset
            // to ON every reload, which made "animations off" feel broken.
            try { localStorage.setItem('ew_animationsDisabled', state.animationsDisabled ? '1' : '0'); } catch (err) {}

            if (state.devAutoSim) {
                state._devSimShowAnims = e.target.checked;
            }
            syncAnimCheckboxes();
        }
        const animCb1 = document.getElementById('animToggleBuilder');
        const animCb2 = document.getElementById('animToggleBattle');
        if (animCb1) animCb1.onchange = onAnimToggle;
        if (animCb2) animCb2.onchange = onAnimToggle;
        // Restore the persisted animations preference on load.
        try {
            if (localStorage.getItem('ew_animationsDisabled') === '1') {
                state.animationsDisabled = true;
                syncAnimCheckboxes();
            }
        } catch (err) {}

        function syncFogCheckboxes() {
            const checked = state.fogOfWar;
            ['fogToggleBuilder', 'fogToggleBuilder2', 'fogToggleBattle'].forEach(id => {
                const cb = document.getElementById(id);
                if (cb) cb.checked = checked;
            });
        }

        function onFogToggle(e) {
            if (ONLINE_RULES.fogEnforced) {
                e.target.checked = true;
                state.fogOfWar = true;
                return;
            }
            state.fogOfWar = e.target.checked;
            syncFogCheckboxes();
            scheduleBoardRender();
        }
        const fogCb1 = document.getElementById('fogToggleBuilder');
        const fogCb2 = document.getElementById('fogToggleBattle');
        if (fogCb1) fogCb1.onchange = onFogToggle;
        if (fogCb2) fogCb2.onchange = onFogToggle;

        const _restartBtn = document.getElementById('restart');
        if (_restartBtn) _restartBtn.onclick = resetGame;
        const _rebuildTeamsBtn = document.getElementById('rebuildTeams');
        if (_rebuildTeamsBtn) _rebuildTeamsBtn.onclick = function() {
            applyPartyBuild();
        };
        const _randomizeAllBtn = document.getElementById('randomizeAllTeams');
        if (_randomizeAllBtn) _randomizeAllBtn.onclick = () => randomizeAllTeams(false);
        const _randomizeOptBtn = document.getElementById('randomizeOptimizeTeams');
        if (_randomizeOptBtn) _randomizeOptBtn.onclick = defaultAllTeams;
        const _autoFillBtn = document.getElementById('autoFillTeams');
        if (_autoFillBtn) _autoFillBtn.onclick = optimizeCurrentTeams;
        const _saveTeamsBtn = document.getElementById('saveTeamsBtn');
        if (_saveTeamsBtn) _saveTeamsBtn.onclick = saveCurrentTeams;
        const _loadTeamsBtn = document.getElementById('loadTeamsBtn');
        if (_loadTeamsBtn) _loadTeamsBtn.onclick = loadSavedTeams;
        const _toggleP2Btn = document.getElementById('togglePlayer2Builder');
        if (_toggleP2Btn) _toggleP2Btn.onclick = togglePlayer2BuilderVisibility;

        const _backBtn = document.getElementById('backToLobbyBtn');
        if (_backBtn) _backBtn.onclick = backToModeSelect;

        document.addEventListener('click', function(e) {
            const wrap = document.getElementById('btMoreWrapStatic');
            if (wrap && !wrap.contains(e.target)) wrap.classList.remove('open');
        });

        const gameModeSelectSetup = document.getElementById('gameModeSelectSetup');
        if (gameModeSelectSetup) {

            gameModeSelectSetup.innerHTML = Object.values(GAME_MODES).map(m => `<option value="${m.id}"${m.id === activeGameMode ? ' selected' : ''}>${m.label} (${m.desc})</option>`).join('');
            gameModeSelectSetup.onchange = () => {
                applyGameMode(gameModeSelectSetup.value);
                repairPartyBuilderState();
                renderBuilder();

                const otherSelect = document.getElementById('gameModeSelect');
                if (otherSelect) otherSelect.value = gameModeSelectSetup.value;
            };
        }

        applyGameMode(activeGameMode);

        nextMatchBtn.onclick = continueToNextMatch;
        if (exportLastMatchBtn) exportLastMatchBtn.onclick = exportLastMatch;
        if (exportMatchHistoryBtn) exportMatchHistoryBtn.onclick = exportMatchHistory;
        startOverBtn.onclick = backToPartyBuilder;
        // Late-bound: online.js wraps backToMainMenu with network teardown.
        const _resultMainMenuBtn = document.getElementById('mainMenuBtn');
        if (_resultMainMenuBtn) _resultMainMenuBtn.onclick = () => window.backToMainMenu();
        if (autoBtn) autoBtn.onclick = toggleAutoMode;
        const devSimBattleBtn = document.getElementById('devSimBattleBtn');
        if (devSimBattleBtn) devSimBattleBtn.onclick = toggleDevAutoSim;
        if (forfeitBtn) forfeitBtn.onclick = function() {
            // One misclick used to end the match on the spot — irreversible
            // actions get a confirm (the dialog system was already there).
            // onConfirm resolves forfeitMatch LATE so online.js's network
            // wrapper (which reassigns the global) is the one that runs.
            if (state.phase !== 'battle' || state.winner) return;
            state.uiDialog = {
                type: 'confirm', icon: '🏳',
                title: 'Forfeit the match?',
                text: 'Your opponent takes the win. There is no undo.',
                confirmLabel: 'Forfeit', confirmIcon: '🏳', confirmSub: 'Concede defeat',
                cancelLabel: 'Keep fighting', cancelSub: 'Back to the battle',
                onConfirm: () => forfeitMatch(),
            };
            markDirty('dialog');
            renderIfDirty();
        };
        if (skipTrackBtn) skipTrackBtn.onclick = () => {
            skipBattleTrack();
        };
        if (musicVolumeSlider) {
            musicVolumeSlider.addEventListener('input', (event) => {
                state.musicVolume = Math.max(0, Math.min(1, Number(event.target.value) / 100));
                applyMusicVolumeMix();
                renderAudioControls();
            });
        }
        if (sfxVolumeSlider) {
            sfxVolumeSlider.addEventListener('input', (event) => {
                state.sfxVolume = Math.max(0, Math.min(1, Number(event.target.value) / 100));
                refreshVisibleVolumeValues();
                renderAudioControls();
            });
        }
        if (enterGameBtn) {
            enterGameBtn.onclick = enterGameFromTitle;
        }
        window.enterGameFromTitle = enterGameFromTitle;
        window._gameReady = true;

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && state.titleScreenVisible && state.gameState === GS.TITLE) {
                e.preventDefault();
                enterGameFromTitle(e);
            }
        });

        const uiDialogOverlay = document.getElementById('uiDialogOverlay');
        if (uiDialogOverlay) {
            uiDialogOverlay.addEventListener('click', (event) => {
                if (event.target === uiDialogOverlay) handleUiDialogSecondary();
            });
        }
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && state.uiDialog) {
                handleUiDialogSecondary();
            }
            /* In-battle Escape (back vs pause) lives in the single Escape
               owner above — a second handleBackAction here made one press
               fire twice (open Pause AND back a menu level). */
        });

        let _wasdOrigin = null;
        let _wasdMoveTiles1 = null;
        let _wasdMoveTiles2 = null;
        let _wasdAnimating = false;
        let _wasdMovesUsed = 0;
        let _wasdMoveOrigins = null;
        let _wasdCommitted = false;

        function _isWasdActive() { return _wasdOrigin !== null; }
        window._isWasdActive = _isWasdActive;
        window._getWasdOrigin = () => _wasdOrigin;
        /* ShooterControls (battle.js) drives the same provisional-move
           machinery from its continuous free-roam walker: it inits the rings,
           fences the walk to them, and lets the stock commit paths bill AP.
           NOTE: plain reference, NEVER a wrapper that calls the bare name —
           _initWasdState is a top-level (global) declaration, so a wrapper
           assigned onto window._initWasdState replaces that very binding and
           calls itself forever ("too much recursion", 2026-07-09). */
        window._initWasdState = _initWasdState;
        window._wasdRingSets = () => ({ r1: _wasdMoveTiles1, r2: _wasdMoveTiles2 });

        function _initWasdState(unit) {
            _wasdOrigin = { x: unit.x, y: unit.y };
            _wasdMovesUsed = 0;
            _wasdMoveOrigins = [{ x: unit.x, y: unit.y }];
            _wasdCommitted = false;
            _wasdAnimating = false;

            _wasdMoveTiles1 = new Set();
            const ring1 = getMoveTiles(unit);
            for (const t of ring1) _wasdMoveTiles1.add(posKey(t.x, t.y));

            /* Ring 2 is retired: a provisional WASD walk is fenced to the ONE
               1-AP move ring — a second move is its own deliberate action.
               The empty set keeps the _wasdRingSets() API shape for
               ShooterControls (battle.js). */
            _wasdMoveTiles2 = new Set();
        }

        function _clearWasdState(restorePosition) {
            if (restorePosition && _wasdOrigin && !_wasdCommitted) {
                const unit = getSelectedUnit();
                if (unit) {
                    unit.x = _wasdOrigin.x;
                    unit.y = _wasdOrigin.y;
                }
            }
            _wasdOrigin = null;
            _wasdMoveTiles1 = null;
            _wasdMoveTiles2 = null;
            _wasdAnimating = false;
            _wasdMovesUsed = 0;
            _wasdMoveOrigins = null;
            _wasdCommitted = false;
            state._kbCursorX = undefined;
            state._kbCursorY = undefined;
        }

        function _commitWasdMove(unit) {
            if (!_wasdOrigin || _wasdCommitted) return;
            _wasdCommitted = true;
            const destX = unit.x, destY = unit.y;

            if (destX === _wasdOrigin.x && destY === _wasdOrigin.y) {
                _clearWasdState(false);
                return;
            }

            /* The WASD roam is fenced to ring 1 (one move action), so a commit
               is always a single 1-AP move through the standard clickTile →
               doMove path (which returns the unit to the action menu). */
            unit.x = _wasdOrigin.x;
            unit.y = _wasdOrigin.y;
            state._wasdMoveSkipAnim = true;
            _clearWasdState(false);

            state.actionMode = 'move';
            state._clickedUnitId = null;
            clickTile(destX, destY);
        }
        window._commitWasdMove = _commitWasdMove;
        window._isWasdActive = _isWasdActive;

        function _animateWasdStep(unit, fromX, fromY, toX, toY, onDone) {
            if (!boardEl || state.devAutoSim || state.animationsDisabled) {
                if (onDone) onDone();
                return;
            }

            if (window.ThreeAnim && window.ThreeAnim.isActive()) {
                _wasdAnimating = true;
                _walkAnimUnitId = unit.id;
                window.ThreeAnim.walkPath(unit, [{ x: toX, y: toY, z: unit.z || 0 }]);
                const stepMs = 140;
                setTimeout(() => {
                    _wasdAnimating = false;
                    _walkAnimUnitId = null;
                    if (onDone) onDone();
                }, stepMs + 80);
                return;
            }
            _wasdAnimating = true;
            _walkAnimUnitId = unit.id;

            const sprite = getBattleMapSpriteUrl(unit);
            const tileSize = CONFIG.tileSize || 64;
            const gap = CONFIG.tileGap ?? 0;
            const pad = CONFIG.boardPadding ?? 2;

            const _wIsFlying = typeof canFly === 'function' && canFly(unit) && typeof isUnitAirborne === 'function' && isUnitAirborne(unit);
            const ghost = document.createElement('div');
            ghost.className = _wIsFlying ? 'fly-ghost' : 'walk-ghost';
            ghost.style.width = tileSize + 'px';
            ghost.style.height = tileSize + 'px';
            const img = document.createElement('img');
            img.src = sprite;
            ghost.appendChild(img);

            ghost.style.left = (pad + fromX * (tileSize + gap)) + 'px';
            ghost.style.top = (pad + fromY * (tileSize + gap)) + 'px';
            ghost.style.zIndex = 100 + fromY;
                const h = (typeof getHeightAt === 'function' && typeof window._getElevationPx === 'function') ? getHeightAt(fromX, fromY) : 0;
                const tiltDeg = state.dioramaTiltDeg ?? 50;
                const yawDeg = state.dioramaYawDeg ?? 0;
                const elevPx = (h > 0 && typeof window._getElevationPx === 'function') ? window._getElevationPx(h) : 0;
                ghost.style.transform = _dioGhostTransform(tiltDeg, yawDeg, elevPx);
            boardEl.appendChild(ghost);

            requestAnimationFrame(() => {
                ghost.style.left = (pad + toX * (tileSize + gap)) + 'px';
                ghost.style.top = (pad + toY * (tileSize + gap)) + 'px';
                ghost.style.zIndex = 100 + toY;
                    const h2 = (typeof getHeightAt === 'function' && typeof window._getElevationPx === 'function') ? getHeightAt(toX, toY) : 0;
                    const tiltDeg = state.dioramaTiltDeg ?? 50;
                    const yawDeg = state.dioramaYawDeg ?? 0;
                    const elevPx = (h2 > 0 && typeof window._getElevationPx === 'function') ? window._getElevationPx(h2) : 0;
                    ghost.style.transform = _dioGhostTransform(tiltDeg, yawDeg, elevPx);
                setTimeout(() => {
                    ghost.remove();
                    _walkAnimUnitId = null;
                    _wasdAnimating = false;
                    markDirty('board');
                    renderIfDirty();
                    if (onDone) onDone();
                }, 140);
            });
        }

        document.addEventListener('keydown', (event) => {
            if (state.phase !== 'battle' || state.winner) return;
            if (state.uiDialog) return;
            if (state.autoPlayers?.[state.activePlayer]) return;
            if (_wasdAnimating) return;
            if (state._actionExecuting) return;
            const tag = event.target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

            const key = event.key.toLowerCase();

            const dirs = {
                'w': [0, -1], 'arrowup': [0, -1],
                's': [0, 1],  'arrowdown': [0, 1],
                'a': [-1, 0], 'arrowleft': [-1, 0],
                'd': [1, 0],  'arrowright': [1, 0]
            };

            /* Arrow ownership: while the Horologe drum is browsable it claims
               the arrow keys for its cursor (hud.js sets the flag) — WASD
               stays on the board. Without this, one ↑ press moved the menu
               cursor AND started a provisional board move. */
            if (window._hrlgArrowsOwned && key.indexOf('arrow') === 0) return;

            if (dirs[key]) {
                event.preventDefault();
                let [dx, dy] = dirs[key];

                {
                    // dioramaYawDeg is the ACTUAL live camera yaw — it already
                    // reflects whatever orientation the viewer is using. The old
                    // is-p2-viewer +180 assumed the (2D-era) CSS board flip, which
                    // the 3D canvas never gets, so it inverted WASD for the online
                    // guest. Use the real yaw only.
                    let yaw = (state.dioramaYawDeg || 0)

                    const steps = Math.round(((yaw % 360) + 360) % 360 / 90) % 4;
                    for (let i = 0; i < steps; i++) {

                        const tmp = dx;
                        dx = dy;
                        dy = -tmp;
                    }
                }
                const unit = getSelectedUnit();
                if (!unit || !canUnitAct(unit)) return;
                const bw = CONFIG.boardWidth || 16;
                const bh = CONFIG.boardHeight || 8;

                if (!_wasdOrigin) {
                    if (!canUnitMove(unit)) return;

                    if (!state.actionMode) {
                        state.actionMode = 'move';
                        state.actionMenuView = 'root';
                        state.selectedTool = null;
                        state.pendingTarget = null;
                    }
                    if (state.actionMode !== 'move') {

                        if (typeof state._kbCursorX !== 'number') {
                            state._kbCursorX = unit.x;
                            state._kbCursorY = unit.y;
                        }
                        const nx = Math.max(0, Math.min(bw - 1, state._kbCursorX + dx));
                        const ny = Math.max(0, Math.min(bh - 1, state._kbCursorY + dy));
                        if (nx === state._kbCursorX && ny === state._kbCursorY) return;
                        state._kbCursorX = nx;
                        state._kbCursorY = ny;
                        playSfx('uiCursorMove');
                        // drive the same hover pipeline the mouse uses so the
                        // move-path / AoE previews track the keyboard cursor too
                        if (typeof updateHoveredTarget === 'function') updateHoveredTarget(nx, ny);
                        const cursorUnit = unitAt(nx, ny);
                        if (cursorUnit && !cursorUnit.dead) focusUnitPanel(cursorUnit.id, null, 'hover');
                        else focusUnitPanel(unit.id, null, 'hover');
                        if (!state.cameraDisabled && !(window._shooterCamOwns && window._shooterCamOwns())) {
                            const userZoom = getUserZoomScale();
                            const zoom = (typeof isUserZoomEngaged === 'function' && isUserZoomEngaged()) ? userZoom : getDefaultZoom();
                            focusBoardCameraOnTiles([{ x: nx, y: ny }], { zoom, holdMs: 99999, persist: true, transitionMs: 150 });
                        }
                        scheduleBoardRender();
                        return;
                    }
                    _initWasdState(unit);
                    scheduleBoardRender();
                }

                const nx = unit.x + dx;
                const ny = unit.y + dy;
                if (nx < 0 || nx >= bw || ny < 0 || ny >= bh) { playErrorSfx(); return; }

                const destKey = posKey(nx, ny);
                const inRing1 = _wasdMoveTiles1 && _wasdMoveTiles1.has(destKey);
                if (!inRing1) { playErrorSfx(); return; }

                const currentInRing1 = _wasdMoveTiles1 && _wasdMoveTiles1.has(posKey(unit.x, unit.y));
                const originKey = posKey(_wasdOrigin.x, _wasdOrigin.y);
                const atOrigin = unit.x === _wasdOrigin.x && unit.y === _wasdOrigin.y;

                if (_wasdMovesUsed >= UNIT_MAX_MOVES) { playErrorSfx(); return; }

                const occupant = unitAt(nx, ny);
                if (occupant && occupant.id !== unit.id && occupant.player !== unit.player) {
                    playErrorSfx(); return;
                }

                const fromX = unit.x, fromY = unit.y;
                unit.x = nx;
                unit.y = ny;
                state._kbCursorX = nx;
                state._kbCursorY = ny;
                playSfx('moveStep');

                _animateWasdStep(unit, fromX, fromY, nx, ny, () => {

                    const bombIdx = state.bombs ? state.bombs.findIndex(b => b.x === nx && b.y === ny && b.owner !== unit.player) : -1;
                    const hasWarpRune = state.warpRunes ? state.warpRunes.some(r => r.x === nx && r.y === ny) : false;
                    if (bombIdx >= 0 || hasWarpRune) {

                        _commitWasdMove(unit);
                    }
                });

                // the third-person shooter camera follows the unit itself —
                // a competing focus pan here would stutter the follow shot
                if (!state.cameraDisabled && !(window._shooterCamOwns && window._shooterCamOwns())) {
                    const userZoom = getUserZoomScale();
                    const zoom = (typeof isUserZoomEngaged === 'function' && isUserZoomEngaged()) ? userZoom : getDefaultZoom();
                    focusBoardCameraOnTiles([{ x: nx, y: ny }], { zoom, holdMs: 99999, persist: true, transitionMs: 150 });
                }
                scheduleBoardRender();
                return;
            }

            // SPACE ends the turn (two presses — the first arms a confirm) and
            // C cycles the camera mode. Shared with the gamepad's X / Y buttons.
            if (key === ' ') {
                event.preventDefault();
                if (typeof window._ewRequestEndTurn === 'function') window._ewRequestEndTurn();
                return;
            }
            if (key === 'c' && !event.ctrlKey && !event.metaKey && !event.altKey) {
                event.preventDefault();
                if (typeof cycleCameraMode === 'function') cycleCameraMode();
                return;
            }
            // I toggles the unit INFO stat card — stats + attack range for the
            // focused (clicked) unit, falling back to the selected unit.
            if (key === 'i' && !event.ctrlKey && !event.metaKey && !event.altKey) {
                event.preventDefault();
                toggleUnitInfo();
                return;
            }
            // B toggles Build mode — in and out, Minecraft-style.
            if (key === 'b' && !event.ctrlKey && !event.metaKey && !event.altKey) {
                const _bu = getSelectedUnit();
                if (!_bu || !canUnitAct(_bu)) return;
                event.preventDefault();
                if (state.actionMode === 'build') handleBackAction();
                else if (typeof setActionMode === 'function') setActionMode('build');
                return;
            }

            if (key === 'enter') {
                if (_wasdOrigin && !_wasdCommitted) {
                    event.preventDefault();
                    const unit = getSelectedUnit();
                    if (!unit) return;

                    const occupant = unitAt(unit.x, unit.y);
                    if (occupant && occupant.id !== unit.id) {
                        addLog('Cannot end movement on an occupied tile.');
                        playErrorSfx();
                        return;
                    }
                    _commitWasdMove(unit);
                    return;
                }

                if (typeof state._kbCursorX === 'number') {
                    event.preventDefault();

                    const _kbPk = posKey(state._kbCursorX, state._kbCursorY);
                    const _kbHlC = _hlCellMap.get(_kbPk);
                    const _kbZ = _kbHlC ? _kbHlC._tileZ : undefined;
                    state._clickedUnitId = null;
                    clickTile(state._kbCursorX, state._kbCursorY, _kbZ);
                    return;
                }
            }
        });

        const _origClickTile = clickTile;
        clickTile = function(x, y, z) {
            if (_wasdOrigin && !_wasdCommitted) {

                _clearWasdState(true);
                scheduleBoardRender();
            }
            return _origClickTile(x, y, z);
        };

        const _origSetActionMode = typeof setActionMode === 'function' ? setActionMode : null;
        if (_origSetActionMode) {
            setActionMode = function(mode) {
                if (_wasdOrigin && !_wasdCommitted && mode !== 'move') {
                    const unit = getSelectedUnit();
                    if (unit) _commitWasdMove(unit);
                }
                return _origSetActionMode(mode);
            };
        }
        const _origSetTool2 = typeof setTool === 'function' ? setTool : null;
        if (_origSetTool2) {
            const _stWrap = setTool;
            setTool = function(mode, toolName) {
                if (_wasdOrigin && !_wasdCommitted && mode !== 'move') {
                    const unit = getSelectedUnit();
                    if (unit) _commitWasdMove(unit);
                }
                return _stWrap(mode, toolName);
            };
        }

        const _origSelectUnit = selectUnit;
        selectUnit = function(unitId) {
            _clearWasdState(true);
            return _origSelectUnit(unitId);
        };

        const _origHandleBackAction = handleBackAction;
        handleBackAction = function() {
            if (_wasdOrigin && !_wasdCommitted) {
                _clearWasdState(true);
                playSfx('uiBack');
                state.actionMode = null;
                state.actionMenuView = 'root';
                scheduleBoardRender();
                return;
            }
            if (typeof state._kbCursorX === 'number' && !state.actionMode && state.selectedUnitId) {
                state._kbCursorX = undefined;
                state._kbCursorY = undefined;
                playSfx('uiBack');
                scheduleBoardRender();
                return;
            }
            state._kbCursorX = undefined;
            state._kbCursorY = undefined;
            return _origHandleBackAction();
        };

        if (window.__queuedEnterGame) {
            window.__queuedEnterGame = false;
            Promise.resolve().then(() => enterGameFromTitle()).catch(err => {
            });
        }

        const titleAudioSafetyUnlock = () => {
            if (!state.titleScreenVisible) return;

            if (_enterGameAudioHandled) return;
            const titleTrack = audioTracks.titleTheme;
            if (state.audioUnlocked && titleTrack && !titleTrack.paused) return;
            unlockAudioAndPlayTitleTheme();
        };
        window.addEventListener('pointerdown', titleAudioSafetyUnlock, {
            passive: true
        });
        window.addEventListener('keydown', titleAudioSafetyUnlock, {
            passive: true
        });
        window.addEventListener('load', () => {
            attemptTitleMusicAutoplay();
            try {

                document.body.classList.add('diorama-3d');
            } catch(e) {}

            try {
                var _psRaw = localStorage.getItem('ew_particleSettings');
                if (_psRaw) {
                    var _ps = JSON.parse(_psRaw);
                    if (_ps && typeof _ps === 'object') {
                        for (var _pk in state.particleSettings) {
                            if (state.particleSettings.hasOwnProperty(_pk) && _ps.hasOwnProperty(_pk)) {
                                state.particleSettings[_pk] = !!_ps[_pk];
                            }
                        }
                    }
                }
            } catch(e) {}

            try {
                // Camera modes are retired — the camera is contextual
                // (battle.js). Action shots are always on; the stored
                // ew_cameraMode preference is ignored.
                state.cameraMode = 'tactical';
                state.cinematicActionCam = true;
                var _acDevCb = document.getElementById('actionCamToggleBattle');
                if (_acDevCb) _acDevCb.checked = true;
            } catch(e) {}
        }, {
            once: true
        });

        const zoomToggleBtn = document.getElementById('zoomToggleBtn');
        if (zoomToggleBtn) zoomToggleBtn.onclick = cycleUserZoom;

        document.addEventListener('error', (e) => {
            if (e.target && e.target.tagName === 'IMG' && e.target.src && e.target.src.startsWith('data:')) {

                e.target.style.visibility = 'hidden';
                e.target.alt = '';
            }
        }, true);

        const ONLINE_RULES = {
            get active() {
                return isOnlineMatch();
            },
            get devSimAllowed() {
                return !isOnlineMatch();
            },
            get bothPlayersManual() {
                return isHumanControlled(1) && isHumanControlled(2);
            },
            get fogEnforced() {
                return isOnlineMatch();
            },
            get competitiveLog() {
                return isOnlineMatch();
            },
            get myPlayer() {
                return getLocalPlayer();
            },
            get role() {
                return window._NET ? window._NET.role : null;
            },

            set active(v) {},
            set devSimAllowed(v) {},
            set bothPlayersManual(v) {},
            set fogEnforced(v) {},
            set competitiveLog(v) {},
            set myPlayer(v) {},
            set role(v) {},
        };
        /* Exported for the React party builder (party-builder.js) — it checks
           window.ONLINE_RULES.active to decide whether SEAL YOUR FATE should
           become the online lock/waiting button. */
        window.ONLINE_RULES = ONLINE_RULES;

    (function() {
      let _fpsEl = null, _fpsRunning = false;
      let _fpsFrames = 0, _fpsLast = 0, _fpsCurrent = 0;
      let _fpsBoardCalls = 0, _fpsBoardSkips = 0;

      const _origRenderBoard = typeof renderBoard === 'function' ? renderBoard : null;

      function _fpsLoop(now) {
        if (!_fpsRunning) return;
        requestAnimationFrame(_fpsLoop);
        _fpsFrames++;
        if (now - _fpsLast >= 1000) {
          _fpsCurrent = _fpsFrames;
          _fpsFrames = 0;
          _fpsLast = now;
          if (_fpsEl) {
            const unitCount = (typeof state !== 'undefined' && state.units) ? state.units.filter(u => !u.dead).length : '?';
            _fpsEl.textContent = `FPS: ${_fpsCurrent}  Units: ${unitCount}`;
          }
        }
      }

      window.ewFPS = function(on) {
        if (on === false) {
          _fpsRunning = false;
          if (_fpsEl) { _fpsEl.remove(); _fpsEl = null; }
          return;
        }
        if (_fpsRunning) return;
        _fpsRunning = true;
        _fpsLast = performance.now();
        _fpsFrames = 0;
        _fpsEl = document.createElement('div');
        _fpsEl.style.cssText = 'position:fixed;top:4px;right:4px;z-index:999999;background:rgba(0,0,0,0.75);color:#0f0;font:bold 13px monospace;padding:3px 8px;border-radius:4px;pointer-events:none;';
        document.body.appendChild(_fpsEl);
        requestAnimationFrame(_fpsLoop);
      };
    })();
