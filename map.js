        function dismissTitleScreen() {
            transitionTo(GS.PARTY_BUILDER);
            if (startOverlay) {
                startOverlay.classList.add('hidden');
                startOverlay.style.display = 'none';
                startOverlay.style.pointerEvents = 'none';
                startOverlay.setAttribute('aria-hidden', 'true');
            }
        }

        function backToModeSelect() {

            transitionTo(GS.MODE_SELECT);
            state.titleScreenVisible = true;
            state.gameState = GS.MODE_SELECT;
            if (startOverlay) {
                startOverlay.classList.remove('hidden');
                startOverlay.style.display = '';
                startOverlay.style.pointerEvents = '';
                startOverlay.setAttribute('aria-hidden', 'false');
            }
            _showTitlePage('modePage');
            render();
        }
        window.backToModeSelect = backToModeSelect;

        function _showTitlePage(pageId) {
            const pages = startOverlay?.querySelectorAll('.title-page');
            if (!pages) return;
            pages.forEach(p => {
                if (p.id === pageId) {
                    p.classList.remove('exit-left');
                    p.classList.add('active');
                } else if (p.classList.contains('active')) {
                    p.classList.remove('active');
                    p.classList.add('exit-left');
                } else {
                    p.classList.remove('active', 'exit-left');
                }
            });

            if (pageId === 'mainMenuPage') {
                try {
                    const cs = loadCareerStats();
                    const ri = getEloRankInfo(cs.elo);
                    const eloTag = document.getElementById('mmEloTag');
                    const _pn = (window.ProfileSystem && window.ProfileSystem.getActiveProfile()) ? window.ProfileSystem.getActiveProfile().username : null;
                    const nameHtml = _pn ? `<span style="font-weight:700;color:#e6e9f2">${_pn}</span> · ` : '';
                    if (eloTag) eloTag.innerHTML = `${nameHtml}${ri.icon} ${ri.name || ri.label} — ${cs.elo} Elo`;
                } catch {}
                try { if (typeof window._refreshWallets === 'function') window._refreshWallets(); } catch {}
                try { if (typeof window._ensureDevPanel === 'function') window._ensureDevPanel(); } catch {}
                try { if (typeof window._maybeShowOnboarding === 'function') window._maybeShowOnboarding(); } catch {}
            }

            if (pageId === 'modePage') {
                _msRenderAll();
            }

            const bgCanvas = document.getElementById('menuBgCanvas');
            if (bgCanvas) {
                const show = pageId !== 'titlePage';
                bgCanvas.style.display = show ? '' : 'none';
                if (typeof window._menuBgSetActive === 'function') window._menuBgSetActive(show);
            }
        }

        let _enterGameAudioHandled = false;

        async function enterGameFromTitle(event) {
            if (event) {
                event.preventDefault?.();
                event.stopPropagation?.();
            }
            if (!state.titleScreenVisible) return;

            _enterGameAudioHandled = true;

            state.audioUnlocked = true;
            playSfx('uiButtonConfirm');

            playMusic('titleTheme').catch(err => {
            });

            state.gameState = GS.MAIN_MENU;
            _showTitlePage('mainMenuPage');
        }

        window._goToPlayHub = function() {
            playSfx('uiButtonConfirm');
            state.gameState = GS.MODE_SELECT;

            try {
                var prof = window.ProfileSystem && window.ProfileSystem.getActiveProfile();
                var eloTag = document.getElementById('playHubEloTag');
                if (eloTag && prof && typeof prof.elo === 'number') {
                    eloTag.textContent = '⚔ ELO ' + prof.elo;
                }
            } catch(e) {}
            _showTitlePage('playHubPage');
        };

        window._goToModeSelector = window._goToPlayHub;

        window._playHubBack = function() {
            playSfx('uiButtonConfirm');
            state.gameState = GS.MAIN_MENU;
            _showTitlePage('mainMenuPage');
        };

        window._goToQuickPlay = function() {
            playSfx('uiButtonConfirm');
            state.gameState = GS.LOBBY;

            _resetLobbyPages('lobbyQuickPlay');
            _showTitlePage('lobbyPage');

            if (typeof lobbyShowQuickPlay === 'function') lobbyShowQuickPlay();
        };

        window._goToFriendlyMatch = function() {
            playSfx('uiButtonConfirm');
            state.gameState = GS.LOBBY;
            _resetLobbyPages('lobbyFriendlyMain');
            _showTitlePage('lobbyPage');
        };

        window._goToVsCpu = function() {
            playSfx('uiButtonConfirm');
            state.gameState = GS.MODE_SELECT;

            window._msCpuOnly = true;
            _showTitlePage('modePage');
        };

        /* ── Mystery Dungeon entry point (main menu) ──────────────────────────
           Flow: main menu → character-select page (pick ONE unlocked character,
           PMD-style) → Guild Hub (free-roam). No map picker, no party builder.
           startMatch's MD hook (battle.js) strips the CPU team and populates
           the hub with the rest of the unlocked roster as NPCs; walking onto
           the cave entrance starts the 10-floor run. */
        /* comp: undefined = not decided yet (defaults to the first option),
           null = deliberately going alone, string = companion race. The
           companion picker only shows on a FRESH save (roster of 1) — that's
           your FIRST companion; later allies are recruited by clearing runs. */
        let _mdCharSel = { race: null, gender: null, comp: undefined };

        window._goToMysteryDungeon = function() {
            playSfx('uiButtonConfirm');
            if (typeof GAME_MODES === 'undefined' || !GAME_MODES.md_hub) {
                addLog('Mystery Dungeon data failed to load.');
                return;
            }
            state.gameState = GS.MODE_SELECT;
            _mdRenderCharSelect();
            _showTitlePage('mdCharPage');
        };

        window._mdCharBack = function() {
            playSfx('uiButtonConfirm');
            state.gameState = GS.MAIN_MENU;
            _showTitlePage('mainMenuPage');
        };

        /* The MD roster is its own progression (ew-md-save-v1.unlockedRaces):
           one starter, more recruited by clearing the dungeon. Deliberately
           NOT the account unlocks — the run starts alone. */
        function _mdUnlockedRoster() {
            const races = (typeof AVAILABLE_RACES !== 'undefined') ? AVAILABLE_RACES : [];
            const sv = (typeof loadMdSave === 'function') ? loadMdSave() : null;
            const owned = new Set((sv && sv.unlockedRaces) || ['homosapien']);
            return races.filter(rk => owned.has(rk));
        }

        function _mdRaceLabel(rk) {
            try {
                if (typeof RACE_PROFILES !== 'undefined' && RACE_PROFILES[rk] && RACE_PROFILES[rk].label) return RACE_PROFILES[rk].label;
            } catch (e) {}
            return rk.replace(/\b\w/g, c => c.toUpperCase());
        }

        function _mdCharImgUrl(rk, gender) {
            const job = (typeof RACE_DEFAULT_JOBS !== 'undefined' && RACE_DEFAULT_JOBS[rk]) || 'Freelancer';
            try {
                if (typeof getUnitPortraitUrl === 'function') {
                    const p = getUnitPortraitUrl({ race: rk, gender });
                    if (p) return p;
                }
            } catch (e) {}
            try {
                if (typeof window.getR2RaceSpriteUrl === 'function') return window.getR2RaceSpriteUrl(rk, gender || 'male', job) || '';
            } catch (e) {}
            return '';
        }

        function _mdRenderCharSelect() {
            const body = document.getElementById('mdCharBody');
            if (!body) return;
            const pool = _mdUnlockedRoster();
            if (!pool.length) {
                body.innerHTML = '<div class="md-char-empty">No characters unlocked yet — visit the Shop to declassify your first vessel.</div>';
                return;
            }
            if (!_mdCharSel.race || !pool.includes(_mdCharSel.race)) {
                _mdCharSel.race = pool[0];
                _mdCharSel.gender = null;
            }
            const genders = (typeof getAvailableGendersForRace === 'function') ? (getAvailableGendersForRace(_mdCharSel.race) || ['male']) : ['male'];
            if (!_mdCharSel.gender || !genders.includes(_mdCharSel.gender)) _mdCharSel.gender = genders[0];

            const sv = (typeof loadMdSave === 'function') ? loadMdSave() : { bestFloor: 0, clears: 0 };
            let html = '<div class="md-char-intro">Pick who you\'ll take into <b>Agartha Depths</b> — 10 floors, no respawns. '
                + (pool.length > 1
                    ? 'Recruited allies hang out at the Guild Hub — assemble your party (up to 4) at the cave gate.'
                    : 'Pick a first companion below — more allies join the Guild Hub each time you clear the dungeon.')
                + (sv.bestFloor > 0 ? ` &nbsp;·&nbsp; Best depth: <b>Floor ${sv.bestFloor}</b> · Clears: <b>${sv.clears || 0}</b>` : '')
                + '</div>';
            html += '<div class="md-char-grid">';
            for (const rk of pool) {
                const sel = rk === _mdCharSel.race;
                const g = sel ? _mdCharSel.gender : ((typeof getAvailableGendersForRace === 'function') ? (getAvailableGendersForRace(rk) || ['male'])[0] : 'male');
                const img = _mdCharImgUrl(rk, g);
                const job = (typeof RACE_DEFAULT_JOBS !== 'undefined' && RACE_DEFAULT_JOBS[rk]) || 'Freelancer';
                html += `<div class="md-char-card${sel ? ' selected' : ''}" onclick="window._mdCharPick('${rk.replace(/'/g, "\\'")}')">`
                    + (img ? `<div class="md-char-img" style="background-image:url('${img}')"></div>` : '<div class="md-char-img"></div>')
                    + `<div class="md-char-name">${_mdRaceLabel(rk)}</div>`
                    + `<div class="md-char-job">${job}</div>`
                    + '</div>';
            }
            html += '</div>';

            /* ── First-companion picker (fresh save only) ─────────────────── */
            const fresh = pool.length === 1;
            if (fresh) {
                const compPool = _mdCompanionPool(_mdCharSel.race);
                if (_mdCharSel.comp !== null && (!_mdCharSel.comp || !compPool.includes(_mdCharSel.comp))) {
                    _mdCharSel.comp = compPool[0] || null;
                }
                html += '<div class="md-char-section">🤝 CHOOSE YOUR FIRST COMPANION — they fight beside you on ⚔ AUTO tactics (switchable in battle)</div>';
                html += '<div class="md-char-grid md-char-grid-comp">';
                html += `<div class="md-char-card md-char-card-none${_mdCharSel.comp === null ? ' selected' : ''}" onclick="window._mdCompPick(null)">`
                    + '<div class="md-char-img md-char-img-none">🚶</div>'
                    + '<div class="md-char-name">Go Alone</div>'
                    + '<div class="md-char-job">Hard mode</div>'
                    + '</div>';
                for (const rk of compPool) {
                    const cSel = rk === _mdCharSel.comp;
                    const cg = (typeof getAvailableGendersForRace === 'function') ? ((getAvailableGendersForRace(rk) || ['male'])[0] || 'male') : 'male';
                    const cImg = _mdCharImgUrl(rk, cg);
                    const cJob = (typeof RACE_DEFAULT_JOBS !== 'undefined' && RACE_DEFAULT_JOBS[rk]) || 'Freelancer';
                    html += `<div class="md-char-card${cSel ? ' selected' : ''}" onclick="window._mdCompPick('${rk.replace(/'/g, "\\'")}')">`
                        + (cImg ? `<div class="md-char-img" style="background-image:url('${cImg}')"></div>` : '<div class="md-char-img"></div>')
                        + `<div class="md-char-name">${_mdRaceLabel(rk)}</div>`
                        + `<div class="md-char-job">${cJob}</div>`
                        + '</div>';
                }
                html += '</div>';
            }

            html += '<div class="md-char-footer">';
            if (genders.length > 1) {
                html += '<div class="md-char-genders">' + genders.map(g =>
                    `<button class="md-char-gender${g === _mdCharSel.gender ? ' on' : ''}" onclick="window._mdCharGender('${g}')">${g === 'female' ? '♀ Female' : '♂ Male'}</button>`
                ).join('') + '</div>';
            }
            html += `<button class="md-char-start" onclick="window._mdCharStart()">🏘 ENTER THE GUILD HUB</button>`;
            html += '</div>';
            body.innerHTML = html;
        }

        /* Races eligible as the starter companion: 3D-ready, not the hero,
           not already in the MD roster. */
        function _mdCompanionPool(heroRace) {
            const races = (typeof AVAILABLE_RACES !== 'undefined') ? AVAILABLE_RACES : [];
            const sv = (typeof loadMdSave === 'function') ? loadMdSave() : null;
            const owned = new Set((sv && sv.unlockedRaces) || []);
            return races.filter(rk => {
                if (rk === heroRace || owned.has(rk)) return false;
                try { if (typeof isRace3DReady === 'function' && !isRace3DReady(rk)) return false; } catch (e) {}
                return true;
            });
        }

        window._mdCompPick = function(rk) {
            playSfx('uiButtonConfirm');
            _mdCharSel.comp = rk;   // null = go alone
            _mdRenderCharSelect();
        };

        window._mdCharPick = function(rk) {
            playSfx('uiButtonConfirm');
            _mdCharSel.race = rk;
            _mdCharSel.gender = null;
            _mdRenderCharSelect();
        };

        window._mdCharGender = function(g) {
            playSfx('uiButtonConfirm');
            _mdCharSel.gender = g;
            _mdRenderCharSelect();
        };

        window._mdCharStart = function() {
            playSfx('uiButtonConfirm');
            if (!_mdCharSel.race) return;
            /* the chosen first companion joins the MD roster permanently —
               they hang out at the Guild Hub and join the party by default
               in the pre-run party select at the cave gate */
            if (_mdCharSel.comp && _mdCharSel.comp !== _mdCharSel.race) {
                try {
                    const sv = loadMdSave();
                    if (!(sv.unlockedRaces || []).includes(_mdCharSel.comp)) {
                        sv.unlockedRaces = (sv.unlockedRaces || []).concat([_mdCharSel.comp]);
                        saveMdSave(sv);
                    }
                } catch (e) {}
            }
            _mdStartHubWithChar(_mdCharSel.race, _mdCharSel.gender || 'male');
        };

        /* Seat the chosen character as a party of ONE and launch the hub
           directly (same shape as startCampaignBattle: set the arrays, set the
           mode, call startMatch — no party builder). */
        function _mdStartHubWithChar(race, gender) {
            window._msCpuOnly = true;
            state.isRankedMatch = false;
            state._customRoundLimit = 0;
            state._mdRun = null;
            state._mdPhase = 'hub';
            state._mdEnded = false;
            state._mdTransitioning = false;
            state.squadLeaderMode = false;
            state.showPlayer2Builder = false;
            CONFIG.gauntletDeploy = 0;

            activeMultiplayerMode = 'dungeon';
            applyGameMode('md_hub');
            CONFIG.teamSize = 1;

            const job = (typeof RACE_DEFAULT_JOBS !== 'undefined' && RACE_DEFAULT_JOBS[race]) || 'Freelancer';
            state.partyBuilds[1] = [job];
            state.partyNames[1] = [_mdRaceLabel(race)];
            state.partyMeta[1] = [{ race, gender }];
            /* auto spell/item kit, but NO surprise accessories — the delver
               starts with the class's default equipment only */
            const _mdLd = (typeof optimizeLoadoutForClass === 'function') ? optimizeLoadoutForClass(job, race) : emptyLoadout();
            if (_mdLd) _mdLd.equipment = { accessory1: null, accessory2: null };
            state.loadouts[1] = [_mdLd];

            /* CPU slot must merely validate — the hub strips team 2 anyway */
            state.partyBuilds[2] = ['Warrior'];
            state.partyNames[2] = [getDefaultUnitName('Warrior')];
            state.partyMeta[2] = [{}];
            state.loadouts[2] = [(typeof optimizeLoadoutForClass === 'function') ? optimizeLoadoutForClass('Warrior', '') : emptyLoadout()];

            state.controllers[1] = CTRL.LOCAL;
            state.controllers[2] = CTRL.AI;

            /* hide the title overlay (mirrors dismissTitleScreen, minus the
               party-builder transition) and boot the hub */
            if (startOverlay) {
                startOverlay.classList.add('hidden');
                startOverlay.style.display = 'none';
                startOverlay.style.pointerEvents = 'none';
                startOverlay.setAttribute('aria-hidden', 'true');
            }
            state.audioUnlocked = true;
            syncMusicToState().catch(() => {});
            if (typeof window.startMatch === 'function') window.startMatch();
        }

        function _resetLobbyPages(showId) {
            ['lobbyQuickPlay', 'lobbyFriendlyMain', 'lobbyHosting', 'lobbyJoining', 'lobbyConnected'].forEach(function(p) {
                var el = document.getElementById(p);
                if (el) el.style.display = p === showId ? 'block' : 'none';
            });
        }

        window._openMainMenuSettings = function() {
            playSfx('uiButtonConfirm');
            _renderMainMenuSettings();
            _showTitlePage('settingsPage');
        };

        window._settingsBack = function() {
            playSfx('uiButtonConfirm');
            state.gameState = GS.MAIN_MENU;
            _showTitlePage('mainMenuPage');
        };

        window._goToCodex = function() {
            playSfx('uiButtonConfirm');
            _showTitlePage('codexPage');
            if (typeof window._renderCodex === 'function') window._renderCodex();
        };
        window._codexBack = function() {
            playSfx('uiButtonConfirm');
            state.gameState = GS.MAIN_MENU;
            _showTitlePage('mainMenuPage');
        };

        let _cccGender = 'male';
        let _cccJob = 'Freelancer';
        let _cccRace = 'homosapien';

        const _CCC_JOB_NAMES = {
            'Freelancer': 'Wanderer', 'Warrior': 'Sentinel', 'Black Mage': 'Arcanist',
            'White Mage': 'Cleric', 'Gunslinger': 'Ranger', 'Agent': 'Shadow',
            'Psychic': 'Psion', 'Harvester': 'Warden', 'Engineer': 'Tinker',
            'Harbinger': 'Herald', 'Raider': 'Corsair', 'Sniper': 'Hawk',
            'Swordmaster': 'Blade'
        };

        window._goToCampaign = function() {
            playSfx('uiButtonConfirm');
            state.gameState = GS.CHALLENGE_PICK;
            _showTitlePage('challengePickPage');
        };

        window._challengePickBack = function() {
            playSfx('uiButtonConfirm');
            state.gameState = GS.MAIN_MENU;
            _showTitlePage('mainMenuPage');
        };

        window._challengePickMode = function(mode) {
            playSfx('uiButtonConfirm');
            window._activeChallengeType = mode;
            const save = loadCampaign(mode);
            if (!save) {

                state.gameState = GS.CAMPAIGN_CHAR_CREATE;
                _cccGender = 'male';
                _cccJob = 'Freelancer';
                _cccRace = 'homosapien';
                _cccRenderForm();
                _showTitlePage('campaignCharCreatePage');
            } else {

                state.campaignSave = save;
                state.isCampaign = true;
                state.gameState = GS.CAMPAIGN_MAP;
                renderCampaignMap();
                _showTitlePage('campaignMapPage');
                if (typeof playMusic === 'function') playMusic('titleTheme');
            }
        };

        window._campaignNewGame = function() {
            const cType = (state.campaignSave && state.campaignSave.challengeType)
                || window._activeChallengeType || 'survival';
            const label = cType === 'gauntlet' ? 'Gauntlet' : 'Survival';
            if (!confirm(`Start a new ${label} run? This will permanently erase your current save, roster, and all progress.`)) return;
            if (typeof playSfx === 'function') playSfx('uiButtonConfirm');
            if (typeof deleteCampaignSave === 'function') deleteCampaignSave(cType);
            state.campaignSave = null;
            state.isCampaign = false;
            state.campaignLevelId = null;
            state._campaignModifiers = null;
            window._activeChallengeType = cType;
            state.gameState = GS.CAMPAIGN_CHAR_CREATE;
            _cccGender = 'male';
            _cccJob = 'Freelancer';
            _cccRace = 'homosapien';
            _cccRenderForm();
            _showTitlePage('campaignCharCreatePage');
        };

        window._campaignCharCreateBack = function() {
            playSfx('uiButtonConfirm');
            state.gameState = GS.CHALLENGE_PICK;
            _showTitlePage('challengePickPage');
        };

        window._campaignMapBack = function() {
            playSfx('uiButtonConfirm');

            if (state.campaignSave) saveCampaign(state.campaignSave);
            state.isCampaign = false;
            state.campaignSave = null;
            state.campaignLevelId = null;
            state._campaignModifiers = null;
            state.gameState = GS.MAIN_MENU;

            if (typeof _restoreResultOverlayButtons === 'function') _restoreResultOverlayButtons();
            _showTitlePage('mainMenuPage');
        };

        function _cccRenderForm() {

            const raceGrid = document.getElementById('cccRaceGrid');
            if (raceGrid && typeof AVAILABLE_RACES !== 'undefined' && typeof RACE_PROFILES !== 'undefined') {
                let html = '';
                for (const rKey of AVAILABLE_RACES) {
                    const prof = RACE_PROFILES[rKey];
                    if (!prof) continue;
                    const sel = (rKey === _cccRace) ? ' selected' : '';
                    const defaultJob = (typeof RACE_DEFAULT_JOBS !== 'undefined' && RACE_DEFAULT_JOBS[rKey])
                        ? RACE_DEFAULT_JOBS[rKey] : 'Freelancer';
                    const spriteUrl = (typeof getR2RaceSpriteUrl === 'function')
                        ? getR2RaceSpriteUrl(rKey, _cccGender, defaultJob) : '';
                    html += `<div class="ccc-race-cell${sel}" data-race="${rKey}" onclick="window._cccPickRace('${rKey}')">
                        <div class="ccc-race-sprite" style="background-image:url('${spriteUrl}')"></div>
                        <div class="ccc-race-label">${prof.label || rKey}</div>
                    </div>`;
                }
                raceGrid.innerHTML = html;
            }

            const sel = document.getElementById('cccJobSelect');
            if (sel) {
                const isLocked = (_cccRace !== 'homosapien' && typeof RACE_DEFAULT_JOBS !== 'undefined' && RACE_DEFAULT_JOBS[_cccRace]);
                if (isLocked) {
                    _cccJob = RACE_DEFAULT_JOBS[_cccRace];
                    sel.innerHTML = `<option value="${_cccJob}" selected>${_cccJob} 🔒</option>`;
                    sel.disabled = true;
                } else {
                    sel.disabled = false;
                    const jobs = typeof CLASS_SPELL_LEARN_ORDER !== 'undefined'
                        ? Object.keys(CLASS_SPELL_LEARN_ORDER) : ['Freelancer'];
                    sel.innerHTML = jobs.map(j =>
                        `<option value="${j}" ${j === _cccJob ? 'selected' : ''}>${j}</option>`
                    ).join('');
                }
            }

            const nameInput = document.getElementById('cccNameInput');
            if (nameInput && !nameInput.value) {
                nameInput.value = _CCC_JOB_NAMES[_cccJob] || 'Recruit';
            }

            _cccUpdateSprite();

            _cccUpdateGenderButtons();
        }

        window._cccPickRace = function(raceKey) {
            _cccRace = raceKey;
            playSfx('uiCursorMove');

            if (raceKey !== 'homosapien' && typeof RACE_DEFAULT_JOBS !== 'undefined' && RACE_DEFAULT_JOBS[raceKey]) {
                _cccJob = RACE_DEFAULT_JOBS[raceKey];
            }

            const nameInput = document.getElementById('cccNameInput');
            if (nameInput) {
                const allDefaults = Object.values(_CCC_JOB_NAMES);
                const rLabel = (typeof RACE_PROFILES !== 'undefined' && RACE_PROFILES[raceKey])
                    ? RACE_PROFILES[raceKey].label : raceKey.charAt(0).toUpperCase() + raceKey.slice(1);
                if (!nameInput.value || allDefaults.includes(nameInput.value) || nameInput.value === rLabel) {
                    nameInput.value = _CCC_JOB_NAMES[_cccJob] || rLabel;
                }
            }
            _cccRenderForm();
        };

        function _cccUpdateSprite() {
            const preview = document.getElementById('cccSpritePreview');
            if (!preview) return;
            const url = (typeof getR2RaceSpriteUrl === 'function')
                ? getR2RaceSpriteUrl(_cccRace, _cccGender, _cccJob)
                : null;
            if (url) {
                preview.style.backgroundImage = `url('${url}')`;
            } else {
                preview.style.backgroundImage = 'none';
            }
        }

        function _cccUpdateGenderButtons() {
            const row = document.getElementById('cccGenderRow');
            if (!row) return;
            row.querySelectorAll('.ccc-toggle').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.val === _cccGender);
            });
        }

        window._cccSetGender = function(g) {
            _cccGender = g;
            playSfx('uiCursorMove');
            _cccUpdateGenderButtons();
            _cccUpdateSprite();

            _cccRenderForm();
        };

        window._cccOnJobChange = function() {
            const sel = document.getElementById('cccJobSelect');
            if (!sel) return;
            _cccJob = sel.value;
            playSfx('uiCursorMove');

            const nameInput = document.getElementById('cccNameInput');
            if (nameInput) {
                const allDefaults = Object.values(_CCC_JOB_NAMES);
                if (!nameInput.value || allDefaults.includes(nameInput.value)) {
                    nameInput.value = _CCC_JOB_NAMES[_cccJob] || 'Recruit';
                }
            }
            _cccUpdateSprite();
        };

        window._cccConfirm = function() {
            playSfx('uiButtonConfirm');
            const nameInput = document.getElementById('cccNameInput');
            const name = (nameInput?.value || '').trim() || _CCC_JOB_NAMES[_cccJob] || 'Recruit';

            const save = newCampaignSave({
                race: _cccRace,
                gender: _cccGender,
                job: _cccJob,
                name: name
            }, window._activeChallengeType || 'survival');
            saveCampaign(save);
            state.campaignSave = save;
            state.isCampaign = true;

            state.gameState = GS.CAMPAIGN_MAP;
            renderCampaignMap();
            _showTitlePage('campaignMapPage');
        };

        function _cmapGetRegion(levelId) {
            if (typeof CAMPAIGN_REGION_THEMES === 'undefined') return null;
            for (const key in CAMPAIGN_REGION_THEMES) {
                const r = CAMPAIGN_REGION_THEMES[key];
                if (levelId >= r.levels[0] && levelId <= r.levels[1]) return r;
            }
            return null;
        }

        function _cmapGetRegionKey(levelId) {
            if (typeof CAMPAIGN_REGION_THEMES === 'undefined') return 1;
            for (const key in CAMPAIGN_REGION_THEMES) {
                const r = CAMPAIGN_REGION_THEMES[key];
                if (levelId >= r.levels[0] && levelId <= r.levels[1]) return parseInt(key);
            }
            return 1;
        }

        const _CMAP_MODE_ICONS = {
            domination: '🚩',
            ctf: '🏳️',
            hotspot: '🔥'
        };

        window.renderCampaignMap = function renderCampaignMap() {
            const save = state.campaignSave;
            if (!save) return;

            const cType = save.challengeType || 'survival';
            const isGauntlet = (cType === 'gauntlet');
            const maxLevel = (typeof GAUNTLET_MAX_LEVEL !== 'undefined') ? GAUNTLET_MAX_LEVEL : 100;

            const titleEl = document.querySelector('#campaignMapPage .cmap-title-text');
            if (titleEl) titleEl.textContent = isGauntlet ? 'Gauntlet' : 'Survival';

            const goldDisplay = document.getElementById('cmapGoldDisplay');
            if (goldDisplay) goldDisplay.textContent = '💰 ' + save.gold;

            const grid = document.getElementById('cmapNodeGrid');
            if (!grid) return;

            const battleNum = save.currentBattle || 1;
            const streak = save.runWins || 0;
            const best = save.bestStreak || 0;

            if (isGauntlet && battleNum > maxLevel) {
                const elapsed = save.gauntletTotalTime || 0;
                const mins = Math.floor(elapsed / 60000);
                const secs = Math.floor((elapsed % 60000) / 1000);
                const timeStr = `${mins}m ${secs}s`;
                grid.innerHTML = `
                    <div class="cmap-challenge-wrap">
                        <div class="cmap-challenge-card" style="text-align:center">
                            <div style="font-size:48px;margin-bottom:12px">🏆</div>
                            <div class="cmap-challenge-title">Gauntlet Complete!</div>
                            <div style="color:var(--muted);margin:12px 0">All ${maxLevel} battles cleared</div>
                            <div class="cmap-challenge-info-grid">
                                <div class="cmap-challenge-info">
                                    <div class="cmap-challenge-info-label">Total Time</div>
                                    <div class="cmap-challenge-info-val">${timeStr}</div>
                                </div>
                                <div class="cmap-challenge-info">
                                    <div class="cmap-challenge-info-label">Retries</div>
                                    <div class="cmap-challenge-info-val">${save.gauntletRetries || 0}</div>
                                </div>
                                <div class="cmap-challenge-info">
                                    <div class="cmap-challenge-info-label">Gold Earned</div>
                                    <div class="cmap-challenge-info-val">💰 ${save.totalGoldEarned || 0}</div>
                                </div>
                                <div class="cmap-challenge-info">
                                    <div class="cmap-challenge-info-label">Battles Won</div>
                                    <div class="cmap-challenge-info-val">${save.totalBattlesWon || 0}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                return;
            }

            const lvl = (typeof generateChallengeLevel === 'function')
                ? generateChallengeLevel(battleNum) : null;

            const aiMult = lvl ? (lvl._challengeAiMult || 1.0) : 1.0;
            let diffLabel = 'Normal';
            if (aiMult <= 0.6) diffLabel = 'Recruit';
            else if (aiMult < 1.0) diffLabel = 'Trained';
            else if (aiMult < 1.15) diffLabel = 'Veteran';
            else if (aiMult < 1.25) diffLabel = 'Elite';
            else diffLabel = 'Nightmare';

            const mapSizeLabel = {
                normal: '4×4 Arena',
                medium: '8×8 Arena',
                large: '12×12 Arena',
                xlarge: '18×20 Arena',
                huge: '24×24 Arena'
            }[lvl && lvl.mapId] || 'Custom Arena';

            const enemyRaces = lvl ? (lvl.enemyRaces || []) : [];
            const uniqueEnemies = [...new Set(enemyRaces)].slice(0, 4);
            const enemyChips = uniqueEnemies.map(r => {
                const label = r.charAt(0).toUpperCase() + r.slice(1);
                return `<span class="cmap-enemy-chip">${label}</span>`;
            }).join('');

            const lvlRange = lvl ? (lvl.enemyLevelRange || [1, 1]) : [1, 1];
            const lvlRangeLabel = lvlRange[0] === lvlRange[1]
                ? `Lv ${lvlRange[0]}`
                : `Lv ${lvlRange[0]}–${lvlRange[1]}`;

            let statsHtml = '';
            if (isGauntlet) {
                const retryCost = (typeof getGauntletRetryCost === 'function') ? getGauntletRetryCost(battleNum) : 50;
                statsHtml = `
                    <div class="cmap-stat">
                        <div class="cmap-stat-label">Progress</div>
                        <div class="cmap-stat-val">${battleNum} / ${maxLevel}</div>
                    </div>
                    <div class="cmap-stat">
                        <div class="cmap-stat-label">Retries</div>
                        <div class="cmap-stat-val">${save.gauntletRetries || 0}</div>
                    </div>
                    <div class="cmap-stat">
                        <div class="cmap-stat-label">Total Gold</div>
                        <div class="cmap-stat-val">${save.totalGoldEarned || 0}</div>
                    </div>
                `;
            } else {
                statsHtml = `
                    <div class="cmap-stat">
                        <div class="cmap-stat-label">Current Streak</div>
                        <div class="cmap-stat-val">${streak}</div>
                    </div>
                    <div class="cmap-stat">
                        <div class="cmap-stat-label">Best Streak</div>
                        <div class="cmap-stat-val">${best}</div>
                    </div>
                    <div class="cmap-stat">
                        <div class="cmap-stat-label">Total Gold Earned</div>
                        <div class="cmap-stat-val">${save.totalGoldEarned || 0}</div>
                    </div>
                `;
            }

            let warnHtml = '';
            if (isGauntlet) {
                const retryCost = (typeof getGauntletRetryCost === 'function') ? getGauntletRetryCost(battleNum) : 50;
                warnHtml = `<div class="cmap-challenge-warn cmap-warn-gauntlet">🔄 Retry on loss costs 💰 ${retryCost} gold</div>`;
            } else {
                warnHtml = `<div class="cmap-challenge-warn">⚠ Lose this battle and your run ends.</div>`;
            }

            let progressHtml = '';
            if (isGauntlet) {
                const pct = Math.min(100, Math.round(((battleNum - 1) / maxLevel) * 100));
                progressHtml = `<div class="cmap-gauntlet-progress">
                    <div class="cmap-gauntlet-bar" style="width:${pct}%"></div>
                </div>`;
            }

            grid.innerHTML = `
                <div class="cmap-challenge-wrap">
                    ${progressHtml}
                    <div class="cmap-challenge-stats">
                        ${statsHtml}
                    </div>
                    <div class="cmap-challenge-card">
                        <div class="cmap-challenge-title">Battle ${battleNum}${isGauntlet ? ' / ' + maxLevel : ''}</div>
                        <div class="cmap-challenge-diff" data-diff="${diffLabel.toLowerCase()}">${diffLabel}</div>
                        <div class="cmap-challenge-info-grid">
                            <div class="cmap-challenge-info">
                                <div class="cmap-challenge-info-label">Map</div>
                                <div class="cmap-challenge-info-val">${mapSizeLabel}</div>
                            </div>
                            <div class="cmap-challenge-info">
                                <div class="cmap-challenge-info-label">Team Size</div>
                                <div class="cmap-challenge-info-val">${lvl ? lvl.teamSize : '?'}v${lvl ? lvl.teamSize : '?'}</div>
                            </div>
                            <div class="cmap-challenge-info">
                                <div class="cmap-challenge-info-label">Enemy Level</div>
                                <div class="cmap-challenge-info-val">${lvlRangeLabel}</div>
                            </div>
                            <div class="cmap-challenge-info">
                                <div class="cmap-challenge-info-label">Gold Reward</div>
                                <div class="cmap-challenge-info-val">💰 ${lvl ? lvl.goldReward : 0}</div>
                            </div>
                        </div>
                        <div class="cmap-enemy-preview">
                            <div class="cmap-enemy-preview-label">Expected Enemies</div>
                            <div class="cmap-enemy-preview-chips">${enemyChips}</div>
                        </div>
                        <button class="cmap-d-deploy-btn cmap-deploy-big"
                                onclick="window._cmapDeploy(${battleNum})">
                            Deploy →
                        </button>
                        ${warnHtml}
                    </div>
                </div>
            `;
        };

        window._cmapNodeClick = function(lvlId) {
            window._cmapDeploy(lvlId);
        };

        window._cmapCloseDetail = function() {
            const panel = document.getElementById('cmapDetailPanel');
            if (panel) panel.classList.remove('open');
        };

        window._cmapDeploy = function(lvlId) {
            const save = state.campaignSave;
            if (!save) return;
            if (typeof playSfx === 'function') playSfx('uiButtonConfirm');

            const battleNum = save.currentBattle || 1;
            state.campaignLevelId = battleNum;

            const panel = document.getElementById('cmapDetailPanel');
            if (panel) panel.classList.remove('open');

            const lvl = (typeof CAMPAIGN_LEVELS !== 'undefined' && CAMPAIGN_LEVELS[battleNum - 1])
                ? CAMPAIGN_LEVELS[battleNum - 1] : null;
            if (lvl) {
                CONFIG.teamSize = lvl.teamSize;
            }

            state.phase = 'setup';
            dismissTitleScreen();
            if (typeof renderBuilder === 'function') renderBuilder();
        };

        let _cshopTab = 'services';

        window._cmapOpenShop = function() {
            if (typeof playSfx === 'function') playSfx('uiButtonConfirm');
            _cshopTab = 'services';
            _cshopRender();
            const overlay = document.getElementById('cshopOverlay');
            if (overlay) overlay.style.display = '';
        };

        window._cshopClose = function() {
            if (typeof playSfx === 'function') playSfx('uiButtonConfirm');
            const overlay = document.getElementById('cshopOverlay');
            if (overlay) overlay.style.display = 'none';

            if (typeof renderCampaignMap === 'function') renderCampaignMap();
        };

        window._cshopSwitchTab = function(tab) {
            if (typeof playSfx === 'function') playSfx('uiCursorMove');
            _cshopTab = tab;
            _cshopRender();
        };

        function _cshopUpdateGold() {
            const save = state.campaignSave;
            if (!save) return;
            const goldEl = document.getElementById('cshopGoldDisplay');
            if (goldEl) goldEl.textContent = '💰 ' + save.gold;
            const mapGoldEl = document.getElementById('cmapGoldDisplay');
            if (mapGoldEl) mapGoldEl.textContent = '💰 ' + save.gold;
        }

        function _cshopRender() {
            const save = state.campaignSave;
            if (!save) return;

            _cshopUpdateGold();

            const tabSvc = document.getElementById('cshopTabServices');
            const tabR = document.getElementById('cshopTabRaces');
            const tabS = document.getElementById('cshopTabSpells');
            if (tabSvc) tabSvc.className = 'cshop-tab' + (_cshopTab === 'services' ? ' cshop-tab-active' : '');
            if (tabR) tabR.className = 'cshop-tab' + (_cshopTab === 'races' ? ' cshop-tab-active' : '');
            if (tabS) tabS.className = 'cshop-tab' + (_cshopTab === 'spells' ? ' cshop-tab-active' : '');

            const body = document.getElementById('cshopBody');
            if (!body) return;

            if (_cshopTab === 'services') {
                _cshopRenderServices(body, save);
            } else if (_cshopTab === 'races') {
                _cshopRenderRaces(body, save);
            } else {
                _cshopRenderSpells(body, save);
            }
        }

        const _CHAL_REVIVE_COST_PER_UNIT = 120;
        const _CHAL_FULL_REVIVE_COST = 400;

        function _cshopRenderServices(body, save) {
            const roster = save.roster || [];
            const dead = roster.filter(r => r._dead);

            let html = '<div class="cshop-services-wrap">';
            html += '<div class="cshop-section-title">Bulk Services</div>';
            html += '<div class="cshop-grid">';

            const cost = _CHAL_FULL_REVIVE_COST;
            const canAfford = save.gold >= cost;
            const enabled = canAfford && dead.length > 0;
            html += `<div class="cshop-card cshop-service-card">
                <div class="cshop-spell-icon">⚕️</div>
                <div class="cshop-card-info">
                    <div class="cshop-card-name">Revive All Fallen</div>
                    <div class="cshop-card-sub">${dead.length} dead unit${dead.length === 1 ? '' : 's'}</div>
                    <div class="cshop-card-desc">Restore every fallen roster member.</div>
                </div>
                <div class="cshop-card-action">
                    <div class="cshop-card-price${canAfford ? '' : ' cshop-cant-afford'}">💰 ${cost}</div>
                    <button class="cshop-buy-btn${enabled ? '' : ' cshop-buy-disabled'}"
                            onclick="window._cshopReviveAll()"${enabled ? '' : ' disabled'}>Revive All</button>
                </div>
            </div>`;
            html += '</div>';

            if (dead.length > 0) {
                html += '<div class="cshop-section-title">Fallen Roster</div>';
                html += '<div class="cshop-grid">';
                for (const inst of dead) {
                    const c2 = _CHAL_REVIVE_COST_PER_UNIT;
                    const ca2 = save.gold >= c2;
                    const spriteUrl = (typeof getR2RaceSpriteUrl === 'function')
                        ? getR2RaceSpriteUrl(inst.race, inst.gender || 'male', inst.job || 'Freelancer') : '';
                    const portrait = spriteUrl;
                    html += `<div class="cshop-card cshop-service-card cshop-dead-card">
                        <div class="cshop-card-sprite" style="background-image:url('${portrait}')"></div>
                        <div class="cshop-card-info">
                            <div class="cshop-card-name">${_cshopEsc(inst.name || inst.race)}</div>
                            <div class="cshop-card-sub">Lv.${inst.level || 1} · ${_cshopEsc(inst.job || 'Freelancer')}</div>
                            <div class="cshop-card-desc">✝ Fallen in battle.</div>
                        </div>
                        <div class="cshop-card-action">
                            <div class="cshop-card-price${ca2 ? '' : ' cshop-cant-afford'}">💰 ${c2}</div>
                            <button class="cshop-buy-btn${ca2 ? '' : ' cshop-buy-disabled'}"
                                    onclick="window._cshopReviveUnit('${_cshopEsc(inst.id)}')"${ca2 ? '' : ' disabled'}>Revive</button>
                        </div>
                    </div>`;
                }
                html += '</div>';
            } else {
                html += '<div class="cshop-section-empty">No fallen units. Your roster is intact.</div>';
            }

            html += '</div>';
            body.innerHTML = html;
        }

        window._cshopReviveAll = function() {
            const save = state.campaignSave;
            if (!save) return;
            const dead = (save.roster || []).filter(r => r._dead);
            if (dead.length === 0 || save.gold < _CHAL_FULL_REVIVE_COST) {
                if (typeof playSfx === 'function') playSfx('uiError');
                return;
            }
            save.gold -= _CHAL_FULL_REVIVE_COST;
            for (const r of dead) delete r._dead;
            if (typeof saveCampaign === 'function') saveCampaign(save);
            if (typeof playSfx === 'function') playSfx('healRegen');
            _cshopRender();
        };

        window._cshopReviveUnit = function(rosterId) {
            const save = state.campaignSave;
            if (!save) return;
            const inst = (save.roster || []).find(r => r.id === rosterId);
            if (!inst || !inst._dead || save.gold < _CHAL_REVIVE_COST_PER_UNIT) {
                if (typeof playSfx === 'function') playSfx('uiError');
                return;
            }
            save.gold -= _CHAL_REVIVE_COST_PER_UNIT;
            delete inst._dead;
            if (typeof saveCampaign === 'function') saveCampaign(save);
            if (typeof playSfx === 'function') playSfx('healRegen');
            _cshopRender();
        };

        function _cshopRenderRaces(body, save) {
            const prices = (typeof CAMPAIGN_RACE_PRICES !== 'undefined') ? CAMPAIGN_RACE_PRICES : {};
            const profiles = (typeof RACE_PROFILES !== 'undefined') ? RACE_PROFILES : {};
            const defaultJobs = (typeof RACE_DEFAULT_JOBS !== 'undefined') ? RACE_DEFAULT_JOBS : {};

            const raceKeys = Object.keys(prices).sort((a, b) => {
                const pDiff = prices[a] - prices[b];
                if (pDiff !== 0) return pDiff;
                return a.localeCompare(b);
            });

            let html = '<div class="cshop-grid">';

            for (const race of raceKeys) {
                const prof = profiles[race];
                const price = prices[race];
                const owned = save.unlockedRaces.includes(race);
                const canAfford = save.gold >= price;
                const label = prof ? prof.label : (race.charAt(0).toUpperCase() + race.slice(1));
                const defaultJob = defaultJobs[race] || 'Freelancer';
                const types = prof ? (prof.types || []).join(', ') : '';
                const faction = prof ? (prof.faction || '') : '';

                const spriteUrl = (typeof getR2RaceSpriteUrl === 'function')
                    ? getR2RaceSpriteUrl(race, 'male', defaultJob) : '';

                html += `<div class="cshop-card${owned ? ' cshop-owned' : ''}">
                    <div class="cshop-card-sprite" style="background-image:url('${spriteUrl}')"></div>
                    <div class="cshop-card-info">
                        <div class="cshop-card-name">${_cshopEsc(label)}</div>
                        <div class="cshop-card-sub">${_cshopEsc(defaultJob)} · ${_cshopEsc(types)}</div>
                        <div class="cshop-card-faction">${_cshopEsc(faction)}</div>
                    </div>
                    <div class="cshop-card-action">`;

                if (owned) {
                    html += `<span class="cshop-owned-badge">✓ Owned</span>`;
                } else {
                    html += `<div class="cshop-card-price${canAfford ? '' : ' cshop-cant-afford'}">💰 ${price}</div>
                        <button class="cshop-buy-btn${canAfford ? '' : ' cshop-buy-disabled'}" onclick="window._cshopBuyRace('${race}')"${canAfford ? '' : ' disabled'}>Recruit</button>`;
                }

                html += `</div></div>`;
            }

            html += '</div>';
            body.innerHTML = html;
        }

        function _cshopRenderSpells(body, save) {
            const allSpells = (typeof SPELL_LIBRARY !== 'undefined') ? SPELL_LIBRARY : [];
            const tier3 = allSpells.filter(s => s.tier === 'III');
            const price = (typeof SPELL_SHOP_PRICES !== 'undefined' && SPELL_SHOP_PRICES['III']) ? SPELL_SHOP_PRICES['III'] : 140;

            tier3.sort((a, b) => {
                const sCmp = (a.school || '').localeCompare(b.school || '');
                if (sCmp !== 0) return sCmp;
                return (a.name || '').localeCompare(b.name || '');
            });

            const typeIcons = {
                fire: '🔥', ice: '❄️', electric: '⚡', tech: '🔧', divine: '✨',
                unholy: '💀', nature: '🌿', alien: '👽', anomaly: '🌀', psychic: '🧠',
                water: '💧', earth: '🪨', wind: '💨', dark: '🌑', light: '☀️'
            };

            let html = '<div class="cshop-grid">';

            for (const spell of tier3) {
                const owned = save.unlockedSpells.includes(spell.id);
                const canAfford = save.gold >= price;
                const icon = typeIcons[spell.spellType] || '🔮';

                html += `<div class="cshop-card cshop-spell-card${owned ? ' cshop-owned' : ''}">
                    <div class="cshop-spell-icon">${icon}</div>
                    <div class="cshop-card-info">
                        <div class="cshop-card-name">${_cshopEsc(spell.name)}</div>
                        <div class="cshop-card-sub">${_cshopEsc(spell.school || '')} · Tier III</div>
                        <div class="cshop-card-desc">${_cshopEsc(spell.desc || '')}</div>
                    </div>
                    <div class="cshop-card-action">`;

                if (owned) {
                    html += `<span class="cshop-owned-badge">✓ Owned</span>`;
                } else {
                    html += `<div class="cshop-card-price${canAfford ? '' : ' cshop-cant-afford'}">💰 ${price}</div>
                        <button class="cshop-buy-btn${canAfford ? '' : ' cshop-buy-disabled'}" onclick="window._cshopBuySpell('${spell.id}')"${canAfford ? '' : ' disabled'}>Buy</button>`;
                }

                html += `</div></div>`;
            }

            html += '</div>';
            body.innerHTML = html;
        }

        window._cshopBuyRace = function(race) {
            const save = state.campaignSave;
            if (!save) return;
            const prices = (typeof CAMPAIGN_RACE_PRICES !== 'undefined') ? CAMPAIGN_RACE_PRICES : {};
            const price = prices[race];
            if (!price || save.gold < price) {
                if (typeof playSfx === 'function') playSfx('uiError');
                return;
            }
            if (save.unlockedRaces.includes(race)) return;

            save.gold -= price;

            save.unlockedRaces.push(race);

            const defaultJob = (typeof RACE_DEFAULT_JOBS !== 'undefined' && RACE_DEFAULT_JOBS[race]) || 'Freelancer';
            const newUnit = createRosterInstance(race, 'male', defaultJob, null);
            save.roster.push(newUnit);

            if (typeof saveCampaign === 'function') saveCampaign(save);
            if (typeof playSfx === 'function') playSfx('levelUp');

            _cshopRender();
        };

        window._cshopBuySpell = function(spellId) {
            const save = state.campaignSave;
            if (!save) return;
            const price = (typeof SPELL_SHOP_PRICES !== 'undefined' && SPELL_SHOP_PRICES['III']) ? SPELL_SHOP_PRICES['III'] : 140;
            if (save.gold < price) {
                if (typeof playSfx === 'function') playSfx('uiError');
                return;
            }
            if (save.unlockedSpells.includes(spellId)) return;

            save.gold -= price;

            save.unlockedSpells.push(spellId);

            if (typeof saveCampaign === 'function') saveCampaign(save);
            if (typeof playSfx === 'function') playSfx('uiButtonConfirm');

            _cshopRender();
        };

        function _cshopEsc(s) {
            return String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;');
        }

        function _renderMainMenuSettings() {
            const body = document.getElementById('mmSettingsBody');
            if (!body) return;
            const musicVol = document.getElementById('musicVolumeSlider')?.value || 68;
            const sfxVol = document.getElementById('sfxVolumeSlider')?.value || 90;
            const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);

            body.innerHTML = `
                <div class="pm-settings-section">
                    <div class="pm-set-group">
                        <div class="pm-set-group-title">Audio</div>
                        <div class="pm-vol-section" style="border:none;padding:0;background:none">
                            <div class="pm-vol-row">
                                <span class="pm-vol-label">Music</span>
                                <input type="range" class="pm-vol-slider" min="0" max="100" step="1" value="${musicVol}"
                                    oninput="const s=document.getElementById('musicVolumeSlider');if(s){s.value=this.value;s.dispatchEvent(new Event('input'));}this.nextElementSibling.textContent=this.value+'%';">
                                <span class="pm-vol-val">${musicVol}%</span>
                            </div>
                            <div class="pm-vol-row">
                                <span class="pm-vol-label">SFX</span>
                                <input type="range" class="pm-vol-slider" min="0" max="100" step="1" value="${sfxVol}"
                                    oninput="const s=document.getElementById('sfxVolumeSlider');if(s){s.value=this.value;s.dispatchEvent(new Event('input'));}this.nextElementSibling.textContent=this.value+'%';">
                                <span class="pm-vol-val">${sfxVol}%</span>
                            </div>
                        </div>
                        <div class="pm-set-row" style="margin-top:10px">
                            <button class="pm-set-btn" onclick="document.getElementById('skipTrackBtn')?.click()">Skip Track</button>
                        </div>
                    </div>
                    <div class="pm-set-group">
                        <div class="pm-set-group-title">Display</div>
                        <div class="pm-set-row">
                            <button class="pm-set-btn${isFs ? ' active' : ''}" id="mmFsBtn" onclick="toggleFullscreen();setTimeout(()=>{const b=document.getElementById('mmFsBtn');if(b)b.textContent=document.fullscreenElement?'Exit Fullscreen':'⛶ Fullscreen';},120);">${isFs ? 'Exit Fullscreen' : '⛶ Fullscreen'}</button>
                        </div>
                    </div>
                    ${typeof window._buildControlsSettingsHTML === 'function' ? window._buildControlsSettingsHTML() : ''}
                    <div class="pm-set-group">
                        <div class="pm-set-group-title">Developer</div>
                        <div style="font-size:10px;color:var(--muted);margin-bottom:8px;line-height:1.4">Unlock every vessel for testing. View-only — nothing is written to your account or the server, so it can't corrupt your roster. Toggle off to return to your real unlocks.</div>
                        <div class="pm-set-row" style="margin-bottom:14px">
                            <button class="pm-set-btn${window._DEV_UNLOCK_ALL ? ' active' : ''}" id="mmUnlockAllBtn" onclick="window._toggleUnlockAll()">${window._DEV_UNLOCK_ALL ? 'Unlock All Vessels: ON' : 'Unlock All Vessels: OFF'}</button>
                        </div>
                        <div style="font-size:10px;color:var(--muted);margin-bottom:8px;line-height:1.4">Run AI vs AI matches to tune decision weights. Champion weights compete against randomized challengers — winners shape the next generation.</div>
                        <div class="pm-set-row" style="margin-bottom:6px;align-items:center;gap:8px">
                            <span class="pm-vol-label">Mode</span>
                            <select class="pm-nametag-select" id="mmTrainMode" style="flex:1">
                                <option value="arena" selected>Arena</option>
                                <option value="tdm">Team Deathmatch</option>
                                <option value="domination">Domination</option>
                                <option value="hotspot">Hotspot</option>
                            </select>
                        </div>
                        <div class="pm-set-row" style="margin-bottom:8px;align-items:center;gap:8px">
                            <span class="pm-vol-label">Map</span>
                            <select class="pm-nametag-select" id="mmTrainMap" style="flex:1">
                                <option value="rotate" selected>Rotate (all sizes)</option>
                                <option value="medium">Clash (8×8)</option>
                                <option value="large">Siege (12×12)</option>
                                <option value="xlarge">Conquest (18×20)</option>
                            </select>
                        </div>
                        <div class="pm-set-row" style="margin-bottom:14px">
                            <button class="pm-set-btn" onclick="window._launchAITraining()">Launch AI Training</button>
                        </div>
                        <div style="font-size:10px;color:var(--muted);margin-bottom:8px;line-height:1.4">Balance Lab runs AI vs AI with EQUAL weights and random, non-mirror teams — so job, race and spell win rates measure game balance, not AI skill. Uses the Mode / Map above. Live dashboard + JSON/CSV export.</div>
                        <div class="pm-set-row" style="margin-bottom:14px">
                            <button class="pm-set-btn" onclick="window._launchBalanceSim()">Launch Balance Lab</button>
                        </div>
                        <div style="font-size:10px;color:var(--muted);margin-bottom:8px;line-height:1.4">Strength Test proves the AI actually got harder: the current AI (trained weights + combat overlay) plays mirror matches against the untouched baseline AI, sides alternating. Win rate + Elo with a confidence interval — run it after training or an AI change.</div>
                        <div class="pm-set-row">
                            <button class="pm-set-btn" onclick="window._launchAIStrengthTest()">Launch AI Strength Test</button>
                        </div>
                    </div>
                </div>`;
        }

        const _TRAIN_MAP_POOL = [
            'prebuilt_shasta_delta', 'prebuilt_stonehenge_delta', 'prebuilt_giza_delta', 'prebuilt_nuketown_delta',
            'prebuilt_heaven_delta', 'prebuilt_hell_delta', 'prebuilt_cyberpunk_delta', 'prebuilt_camelot_delta',
            'prebuilt_stadium_delta', 'prebuilt_moon_delta', 'prebuilt_mars_delta', 'prebuilt_backrooms_delta',
            'prebuilt_stonehenge', 'prebuilt_nuketown', 'prebuilt_moon', 'prebuilt_gobekli',
            'prebuilt_dumb', 'prebuilt_cern', 'prebuilt_backrooms', 'prebuilt_flatlands',
        ];
        let _trainMapIndex = 0;
        let _trainMapSetting = 'rotate';
        let _trainModeSetting = 'arena';

        // Settings → Developer: flip the view-layer unlock-all flag. Never
        // writes to the profile/server — isUnitUnlocked() just reads true while
        // it's on. Re-render any open unlock-aware screen so it updates live.
        window._toggleUnlockAll = function() {
            window._DEV_UNLOCK_ALL = !window._DEV_UNLOCK_ALL;
            const btn = document.getElementById('mmUnlockAllBtn');
            if (btn) {
                btn.textContent = 'Unlock All Vessels: ' + (window._DEV_UNLOCK_ALL ? 'ON' : 'OFF');
                btn.classList.toggle('active', !!window._DEV_UNLOCK_ALL);
            }
            try { window._refreshWallets && window._refreshWallets(); } catch (e) {}
            try {
                const shop = document.getElementById('shopPage');
                if (typeof window._renderShop === 'function' && shop && shop.classList.contains('active')) window._renderShop();
                const codex = document.getElementById('codexPage');
                if (typeof window._renderCodex === 'function' && codex && codex.classList.contains('active')) window._renderCodex();
            } catch (e) {}
        };

        window._launchAITraining = function() {
            _trainModeSetting = document.getElementById('mmTrainMode')?.value || 'arena';
            _trainMapSetting = document.getElementById('mmTrainMap')?.value || 'rotate';
            window._selectMode('aitrain');
        };

        window._launchBalanceSim = function() {
            _trainModeSetting = document.getElementById('mmTrainMode')?.value || 'arena';
            _trainMapSetting = document.getElementById('mmTrainMap')?.value || 'rotate';
            window._selectMode('balancesim');
        };

        window._launchAIStrengthTest = function() {
            _trainModeSetting = document.getElementById('mmTrainMode')?.value || 'arena';
            _trainMapSetting = document.getElementById('mmTrainMap')?.value || 'rotate';
            window._selectMode('aistrength');
        };

        const MS_GAME_MODES = [
            { id: 'arena', icon: '🏰', label: 'Arena', desc: 'Destroy the tower, wipe out the enemy, collect every hourglass — or hold ALL 3 Nexus zones at once for an instant win. 15 rounds; Arena score decides otherwise.', tag: null, locked: false },
            { id: 'tdm', icon: '💀', label: 'Team Deathmatch', desc: 'Most kills in 12 rounds wins. Wipeout also wins instantly. Sudden Death if tied.', tag: null, locked: false },
            { id: 'shooter', icon: '🎯', label: 'Strike Mode', desc: 'REAL-TIME third-person shooter deathmatch — no turns, everyone fights at once. WASD runs, mouse aims, LMB shoots/casts, every spell on a cooldown. First to 25 kills or best score in 8:00. Controller supported.', tag: 'BETA', locked: false },
            { id: 'ffa', icon: '👤', label: 'Free For All', desc: 'Every player for themselves. Most kills in 15 rounds. No teams.', tag: null, locked: false },
            { id: 'domination', icon: '🚩', label: 'Domination', desc: 'Capture and hold Nexus points to earn points every round. Most points in 15 rounds wins.', tag: null, locked: false },
            { id: 'hotspot', icon: '🔥', label: 'Hotspot', desc: 'One Nexus spawns at a time. Capture it to score — then it teleports somewhere new. 15 rounds.', tag: null, locked: false },
            { id: 'ctf', icon: '🏳️', label: 'Capture the Flag', desc: 'Steal the enemy flag from their base and return it to your sanctuary to score. First to 3 or most in 15 rounds.', tag: null, locked: false },
            { id: 'gauntlet', icon: '⚔️', label: 'Gauntlet', desc: 'Pokémon-style. Roster of 8, deploy 4 at a time. No respawns, no round limit. Switch a reserve in for 2 AP. Wipe out the enemy team to win.', tag: 'NEW', locked: false },
        ];

        /* ── 2026-07 map overhaul ────────────────────────────────────────────
           The picker list is GENERATED from the MapForge roster (data.js
           EW_MAP_META): full launch maps first (tier order), then Custom Map,
           then the 10×10 Δ ranked variants. Thumbnails render live from
           PREBUILT_MAPS.grid as before. */
        const MS_MAP_LIST = (() => {
            const list = [];
            const meta = (typeof EW_MAP_META !== 'undefined') ? EW_MAP_META : [];
            meta.filter(m => !m.isDelta).forEach(m => {
                list.push({ modeId: m.id, name: m.label, size: m.w + '×' + m.h, team: m.teamSize, floors: false, w: m.w, h: m.h, isPrebuilt: true, tier: m.tier, biomes: m.biomes });
            });
            list.push({ modeId: 'prebuilt_custommap', name: 'Custom Map', size: '20×20', team: 6, floors: false, w: 20, h: 20, isPrebuilt: true });
            // Only the 8×8 Δ appears in the picker; the 12×12 Arena Δ is a
            // hidden sibling that _msConfirm swaps in when the mode is Arena.
            meta.filter(m => m.isDelta && !m.isDeltaArena).forEach(m => {
                list.push({ modeId: m.id, name: m.label, size: '8×8 Δ', team: m.teamSize, floors: false, w: 8, h: 8, isPrebuilt: true, isDelta: true, tier: m.tier, biomes: m.biomes });
            });
            return list;
        })();

        let _msSelectedGM = 0;
        let _msSelectedMap = 0;   // default card: Mount Shasta (first roster map)
        let _msSelectedTeamSize = 0;
        let _msRanked = false;
        let _msOnline = false;
        let _msSelectedRounds = 0;

        function _msMaxTeamForMap(mapIdx) {
            const mp = MS_MAP_LIST[mapIdx];
            if (!mp) return 2;
            const mode = GAME_MODES[mp.modeId];
            if (!mode) return mp.team || 2;

            const spawnCount = mode.spawns[1].length;
            const areaCap = Math.floor((mp.w * mp.h) / 4);
            let cap = Math.min(Math.max(spawnCount, areaCap), 16);

            const gm = MS_GAME_MODES[_msSelectedGM];
            const mpMode = gm ? MULTIPLAYER_MODES[gm.id] : null;
            if (mpMode && mpMode.isFFA && mpMode.maxPlayers) {
                cap = Math.min(mpMode.maxPlayers, cap);
            }
            return cap;
        }

        function _msClampTeamSize() {
            const maxT = _msMaxTeamForMap(_msSelectedMap);
            if (_msSelectedTeamSize < 1 || _msSelectedTeamSize > maxT) {
                _msSelectedTeamSize = MS_MAP_LIST[_msSelectedMap]?.team || maxT;
            }
            _msSelectedTeamSize = Math.max(1, Math.min(_msSelectedTeamSize, maxT));
        }

        window._msTeamDec = function() {
            if (_msSelectedTeamSize <= 1) return;
            _msSelectedTeamSize--;
            playSfx('uiButtonConfirm');
            _msRenderInfoBar();
        };

        window._msTeamInc = function() {
            const maxT = _msMaxTeamForMap(_msSelectedMap);
            if (_msSelectedTeamSize >= maxT) return;
            _msSelectedTeamSize++;
            playSfx('uiButtonConfirm');
            _msRenderInfoBar();
        };

        window._toggleMSRanked = function() {
            _msRanked = !_msRanked;
            const t = document.getElementById('msTogRanked');
            const v = document.getElementById('msTogRankedVal');
            if (t) t.classList.toggle('on', _msRanked);
            if (v) v.textContent = _msRanked ? 'Ranked' : 'Unranked';
            playSfx('uiButtonConfirm');
        };

        window._toggleMSOnline = function() {

            playSfx('uiButtonConfirm');
            const toast = document.getElementById('msComingSoonToast');
            if (toast) {
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 2000);
            }
        };

        function _msCompatibleMaps() {
            const gm = MS_GAME_MODES[_msSelectedGM];
            if (!gm) return MS_MAP_LIST.map((_, i) => i);
            const mpMode = MULTIPLAYER_MODES[gm.id];
            if (!mpMode || !mpMode.compatibleMaps) return MS_MAP_LIST.map((_, i) => i);
            return MS_MAP_LIST.map((m, i) => mpMode.compatibleMaps.includes(m.modeId) ? i : -1).filter(i => i >= 0);
        }

        window._msSelectGM = function(i) {
            if (MS_GAME_MODES[i].locked) return;
            _msSelectedGM = i;
            playSfx('uiButtonConfirm');

            const compat = _msCompatibleMaps();
            if (compat.length > 0 && !compat.includes(_msSelectedMap)) {
                _msSelectedMap = compat[0];
            }
            _msClampTeamSize();
            _msRenderAll();
        };

        window._msPrevMap = function() {
            const compat = _msCompatibleMaps();
            if (compat.length <= 1) return;
            const curIdx = compat.indexOf(_msSelectedMap);
            _msSelectedMap = compat[(curIdx - 1 + compat.length) % compat.length];
            _msClampTeamSize();
            playSfx('uiButtonConfirm');
            _msRenderAll();
        };

        window._msNextMap = function() {
            const compat = _msCompatibleMaps();
            if (compat.length <= 1) return;
            const curIdx = compat.indexOf(_msSelectedMap);
            _msSelectedMap = compat[(curIdx + 1) % compat.length];
            _msClampTeamSize();
            playSfx('uiButtonConfirm');
            _msRenderAll();
        };

        function _msRenderAll() {

            if (typeof window._mountReactMatchSelect === 'function') {
                window._mountReactMatchSelect();
            }
        }

        function _msRenderGMList() {
            const list = document.getElementById('msGmList');
            if (!list) return;
            list.innerHTML = MS_GAME_MODES.map((m, i) => `
                <div class="ms-gm-item ${i === _msSelectedGM ? 'active' : ''} ${m.locked ? 'locked' : ''}" onclick="${m.locked ? '' : 'window._msSelectGM(' + i + ')'}">
                    <div class="ms-gi-icon">${m.icon}</div>
                    <div>
                        <div class="ms-gi-label">${m.label}</div>
                        <div class="ms-gi-desc">${m.desc}</div>
                        ${m.tag ? `<div class="ms-gi-tag">${m.tag}</div>` : ''}
                    </div>
                </div>
            `).join('');
        }

        function _msRenderInfoBar() {
            const bar = document.getElementById('msInfoBar');
            if (!bar) return;
            const gm = MS_GAME_MODES[_msSelectedGM];
            const mp = MS_MAP_LIST[_msSelectedMap];
            const mpMode = MULTIPLAYER_MODES[gm.id];
            const isFFA = mpMode && mpMode.isFFA;
            const roundLimitDisplay = mpMode && mpMode.roundLimit ? mpMode.roundLimit + 'R' : '∞';
            const winLabel = mpMode ? (
                mpMode.hasTowers ? 'Tower/Elim' :
                mpMode.scoringType === 'kills' ? 'Most Kills' :
                mpMode.scoringType === 'domination' || mpMode.scoringType === 'hotspot' ? 'Most Pts' :
                mpMode.scoringType === 'ctf' ? 'Captures' : 'Elim'
            ) : 'Tower';

            const compat = _msCompatibleMaps();
            const isCompat = compat.includes(_msSelectedMap);
            const maxT = _msMaxTeamForMap(_msSelectedMap);
            const canDec = _msSelectedTeamSize > 1;
            const canInc = _msSelectedTeamSize < maxT;

            const teamDisplay = isFFA
                ? `${_msSelectedTeamSize}`
                : `${_msSelectedTeamSize}v${_msSelectedTeamSize}`;
            const teamLabel = isFFA ? 'Players' : 'Team';
            bar.innerHTML = `
                <div class="ms-info-text">
                    <div class="ms-info-name">${gm.label}</div>
                    <div class="ms-info-desc">${gm.desc}</div>
                </div>
                <div class="ms-info-stats">
                    <div class="ms-info-stat ms-team-stat">
                        <div class="ms-team-picker">
                            <button class="ms-team-btn ${canDec ? '' : 'disabled'}" onclick="window._msTeamDec()">−</button>
                            <span class="ms-info-stat-val">${teamDisplay}</span>
                            <button class="ms-team-btn ${canInc ? '' : 'disabled'}" onclick="window._msTeamInc()">+</button>
                        </div>
                        <div class="ms-info-stat-label">${teamLabel}</div>
                    </div>
                    <div class="ms-info-stat"><div class="ms-info-stat-val">${mp.size}</div><div class="ms-info-stat-label">Board</div></div>
                    <div class="ms-info-stat"><div class="ms-info-stat-val">${roundLimitDisplay}</div><div class="ms-info-stat-label">Rounds</div></div>
                    <div class="ms-info-stat"><div class="ms-info-stat-val">${winLabel}</div><div class="ms-info-stat-label">Win</div></div>
                </div>
            `;
        }

        const MS_GRID_DIM = Math.max(...MS_MAP_LIST.map(m => Math.max(m.w, m.h)));

        function _msRenderMap() {
            const nameEl = document.getElementById('msMapName');
            const preview = document.getElementById('msMapPreview');
            if (!nameEl || !preview) return;
            const mp = MS_MAP_LIST[_msSelectedMap];
            nameEl.textContent = `${mp.name} (${mp.size})`;
            const mapCols = mp.w;
            const mapRows = mp.h;
            const gridDim = MS_GRID_DIM;

            const offC = Math.floor((gridDim - mapCols) / 2);
            const offR = Math.floor((gridDim - mapRows) / 2);

            const _pbTerrainColor = Object.assign({
                blank:'transparent', grass:'rgba(80,140,60,0.45)', grass_2:'rgba(90,150,70,0.4)',
                grass_rocky:'rgba(100,130,70,0.35)', water:'rgba(50,100,200,0.5)', deep_water:'rgba(30,60,160,0.6)',
                lava:'rgba(220,80,20,0.55)', desert:'rgba(180,160,80,0.4)', dirt:'rgba(130,100,60,0.35)',
                mountain:'rgba(120,110,100,0.5)', mountain_2:'rgba(110,100,90,0.45)', cave_floor:'rgba(80,70,60,0.4)',
                cave_wall:'rgba(60,50,45,0.5)', ice:'rgba(160,210,240,0.45)', bridge:'rgba(140,110,70,0.4)',
                forest:'rgba(40,100,40,0.5)', forest_2:'rgba(50,110,50,0.45)', dark_woods:'rgba(30,60,30,0.55)',
                healing_spring:'rgba(100,220,180,0.45)', sanctuary:'rgba(200,180,120,0.4)',
                crystal:'rgba(160,120,220,0.45)', ruins:'rgba(140,130,110,0.35)',
                bricks_1:'rgba(150,100,70,0.45)', bricks_2:'rgba(140,90,65,0.4)',
                wood_planks:'rgba(160,120,70,0.4)', wood:'rgba(140,100,60,0.35)',
                rubble_1:'rgba(120,110,95,0.35)', rubble_2:'rgba(115,105,90,0.35)',
                rock_wall_1:'rgba(90,85,80,0.5)', rock_wall_2:'rgba(85,80,75,0.5)',
                urban_wall:'rgba(100,95,100,0.5)', urban_street:'rgba(130,125,120,0.35)',
                wasteland:'rgba(140,120,80,0.35)', cave_entrance:'rgba(70,60,50,0.45)',
                barrier_passage:'rgba(140,140,200,0.2)', cloud:'rgba(200,210,230,0.3)',
                purple_grass:'rgba(120,60,140,0.4)', purple_bog:'rgba(100,50,120,0.45)',
                scorched:'rgba(60,50,40,0.45)', poison:'rgba(80,160,60,0.45)',
                mushroom:'rgba(160,80,120,0.4)', obsidian:'rgba(40,35,50,0.5)',
                well:'rgba(70,130,180,0.4)', road:'rgba(150,140,120,0.35)',
                rocks_1:'rgba(110,105,100,0.4)', rocks_2:'rgba(105,100,95,0.4)',
                rocks_3:'rgba(100,95,90,0.4)', rocks_4:'rgba(95,90,85,0.4)', rocks_5:'rgba(90,85,80,0.4)',
            }, (typeof window !== 'undefined' && window.EW_TERRAIN_COLORS) || {});

            const pbData = (mp.isPrebuilt && typeof PREBUILT_MAPS !== 'undefined') ? PREBUILT_MAPS[mp.modeId] : null;

            let html = `<div class="ms-map-grid" style="grid-template-columns:repeat(${gridDim},1fr);grid-template-rows:repeat(${gridDim},1fr)">`;
            for (let r = 0; r < gridDim; r++) {
                for (let c = 0; c < gridDim; c++) {
                    const mr = r - offR;
                    const mc = c - offC;
                    if (mr < 0 || mr >= mapRows || mc < 0 || mc >= mapCols) {
                        html += `<div class="ms-mc void"></div>`;
                        continue;
                    }

                    if (pbData) {
                        const tid = pbData.grid[mr]?.[mc] || 0;
                        const tKey = (typeof ME_TERRAIN_IDS !== 'undefined' && ME_TERRAIN_IDS[tid]) ? ME_TERRAIN_IDS[tid] : null;
                        const color = (tKey && _pbTerrainColor[tKey]) ? _pbTerrainColor[tKey] : (tid === 0 ? 'transparent' : 'rgba(80,140,60,0.3)');
                        html += `<div class="ms-mc" style="background:${color}"></div>`;
                        continue;
                    }
                    let cls = 'ms-mc';
                    if (mp.floors && mp.sky) {
                        if (mp.barriers && mp.barriers.includes(mr)) cls += ' barrier';
                        else if (mr >= mp.sky[0] && mr <= mp.sky[1]) cls += ' sky';
                        else if (mr >= mp.earth[0] && mr <= mp.earth[1]) cls += ' earth';
                        else if (mr >= mp.under[0] && mr <= mp.under[1]) cls += ' under';
                        else cls += ' earth';
                    } else if (mp.modeId === 'huge') {

                        const dy = (mr + 0.5 - mapRows / 2) / (mapRows / 2);
                        const dx = (mc + 0.5 - mapCols / 2) / (mapCols / 2);
                        if (dx * dx + dy * dy > 1) cls += ' void';
                        else if (dy < -0.25) cls += ' sky';
                        else if (dy > 0.25) cls += ' under';
                        else cls += ' earth';
                    } else {
                        cls += ' earth';
                    }
                    html += `<div class="${cls}"></div>`;
                }
            }
            html += '</div>';
            preview.innerHTML = html;
        }

        window._msBack = function() {
            playSfx('uiButtonConfirm');
            window._msCpuOnly = false;
            state.gameState = GS.MODE_SELECT;
            _showTitlePage('playHubPage');
        };

        window._msConfirm = function() {
            playSfx('uiButtonConfirm');

            const mp = MS_MAP_LIST[_msSelectedMap];
            const gm = MS_GAME_MODES[_msSelectedGM];

            // Δ maps are 8×8 by default, but Arena wants the roomier 12×12 crop
            // (towers/nexus/hourglasses need space). Swap in the hidden Arena
            // sibling map when the selected mode is Arena.
            let launchModeId = mp.modeId;
            if (mp.isDelta && gm && gm.id === 'arena'
                && typeof GAME_MODES !== 'undefined' && GAME_MODES[mp.modeId + '_arena']) {
                launchModeId = mp.modeId + '_arena';
            }
            applyGameMode(launchModeId);

            const customTeam = _msSelectedTeamSize;
            if (customTeam >= 1 && customTeam !== CONFIG.teamSize) {
                const mode = GAME_MODES[launchModeId];
                CONFIG.teamSize = customTeam;

                SPAWNS[1] = mode.spawns[1].slice(0, customTeam);
                SPAWNS[2] = mode.spawns[2].slice(0, customTeam);

                const bw = mode.boardWidth || mode.boardSize || 8;
                const bh = mode.boardHeight || mode.boardSize || 8;
                while (SPAWNS[1].length < customTeam) {
                    const idx = SPAWNS[1].length;
                    const row = Math.floor(idx / 2);
                    const col = idx % 2;
                    SPAWNS[1].push({ x: col, y: Math.min(row, bh - 1) });
                }
                while (SPAWNS[2].length < customTeam) {
                    const idx = SPAWNS[2].length;
                    const row = Math.floor(idx / 2);
                    const col = idx % 2;
                    SPAWNS[2].push({ x: bw - 1 - col, y: Math.min(bh - 1 - row, bh - 1) });
                }

                DEFAULT_BUILDS[1] = mode.defaultBuilds[1].slice(0, customTeam);
                DEFAULT_BUILDS[2] = mode.defaultBuilds[2].slice(0, customTeam);

                while (DEFAULT_BUILDS[1].length < customTeam) DEFAULT_BUILDS[1].push('Warrior');
                while (DEFAULT_BUILDS[2].length < customTeam) DEFAULT_BUILDS[2].push('Warrior');

                [1, 2].forEach(player => {
                    const oldSize = state.partyBuilds?.[player]?.length || 0;
                    if (oldSize < customTeam) {
                        for (let i = oldSize; i < customTeam; i++) {
                            state.partyBuilds[player][i] = DEFAULT_BUILDS[player][i] || 'Warrior';
                            state.partyNames[player][i] = getDefaultUnitName(state.partyBuilds[player][i]);
                            state.loadouts[player][i] = emptyLoadout();
                            if (!state.partyMeta[player]) state.partyMeta[player] = [];
                            state.partyMeta[player][i] = {};
                        }
                    } else if (oldSize > customTeam) {
                        state.partyBuilds[player].length = customTeam;
                        state.partyNames[player].length = customTeam;
                        state.loadouts[player].length = customTeam;
                        if (state.partyMeta[player]) state.partyMeta[player].length = customTeam;
                    }
                });
            }

            activeMultiplayerMode = gm.id;

            const mpMode = MULTIPLAYER_MODES[gm.id];
            if (mpMode && mpMode.isFFA) {
                const totalPlayers = _msSelectedTeamSize;
                const mode = GAME_MODES[launchModeId];
                CONFIG.teamSize = 1;

                const allSpawns = [...(mode.spawns[1] || []), ...(mode.spawns[2] || [])];

                const w = mode.boardWidth || mode.boardSize || 16;
                const h = mode.boardHeight || mode.boardSize || 16;
                while (allSpawns.length < totalPlayers) {
                    const margin = 2;
                    allSpawns.push({
                        x: margin + Math.floor(Math.random() * (w - margin * 2)),
                        y: margin + Math.floor(Math.random() * (h - margin * 2))
                    });
                }
                SPAWNS[1] = allSpawns.slice(0, 1);
                SPAWNS[2] = allSpawns.slice(1, totalPlayers);

                DEFAULT_BUILDS[1] = ['Warrior'];
                DEFAULT_BUILDS[2] = [];
                const classNames = Object.keys(CLASS_TEMPLATES);
                for (let i = 0; i < totalPlayers - 1; i++) {
                    DEFAULT_BUILDS[2].push(classNames[Math.floor(Math.random() * classNames.length)]);
                }

                state.partyBuilds[1] = [state.partyBuilds[1]?.[0] || 'Warrior'];
                state.partyNames[1] = [state.partyNames[1]?.[0] || getDefaultUnitName(state.partyBuilds[1][0])];
                state.loadouts[1] = [state.loadouts[1]?.[0] || emptyLoadout()];
                if (!state.partyMeta[1]) state.partyMeta[1] = [];
                state.partyMeta[1].length = 1;

                state.partyBuilds[2] = DEFAULT_BUILDS[2].slice();
                state.partyNames[2] = state.partyBuilds[2].map(cls => getDefaultUnitName(cls));
                state.loadouts[2] = state.partyBuilds[2].map((cls, idx) =>
                    typeof optimizeLoadoutForClass === 'function'
                        ? optimizeLoadoutForClass(cls, '')
                        : emptyLoadout()
                );
                if (!state.partyMeta[2]) state.partyMeta[2] = [];
                state.partyMeta[2] = state.partyBuilds[2].map(() => ({}));

                state._ffaPlayerCount = totalPlayers;
            }

            /* Gauntlet (Pokémon-style): roster of 8 per side, only 4 deploy on the
               board, the other 4 wait on the bench. CONFIG.teamSize drives the party
               builder + roster sizing; CONFIG.gauntletDeploy gates how many actually
               spawn onto the board (handled in makeUnitsFromBuilds). */
            if (gm.id === 'gauntlet') {
                const mode = GAME_MODES[launchModeId];
                const ROSTER = (mpMode && mpMode.rosterSize) || 8;
                const DEPLOY = (mpMode && mpMode.deploySize) || 4;
                CONFIG.teamSize = ROSTER;
                CONFIG.gauntletDeploy = DEPLOY;

                const bw = mode.boardWidth || mode.boardSize || 8;
                const bh = mode.boardHeight || mode.boardSize || 8;
                SPAWNS[1] = (mode.spawns[1] || []).slice(0, DEPLOY);
                SPAWNS[2] = (mode.spawns[2] || []).slice(0, DEPLOY);
                while (SPAWNS[1].length < DEPLOY) {
                    const idx = SPAWNS[1].length;
                    SPAWNS[1].push({ x: idx % 2, y: Math.min(Math.floor(idx / 2), bh - 1) });
                }
                while (SPAWNS[2].length < DEPLOY) {
                    const idx = SPAWNS[2].length;
                    SPAWNS[2].push({ x: bw - 1 - idx % 2, y: Math.min(bh - 1 - Math.floor(idx / 2), bh - 1) });
                }

                DEFAULT_BUILDS[1] = (mode.defaultBuilds[1] || []).slice(0, ROSTER);
                DEFAULT_BUILDS[2] = (mode.defaultBuilds[2] || []).slice(0, ROSTER);
                while (DEFAULT_BUILDS[1].length < ROSTER) DEFAULT_BUILDS[1].push('Warrior');
                while (DEFAULT_BUILDS[2].length < ROSTER) DEFAULT_BUILDS[2].push('Warrior');

                [1, 2].forEach(player => {
                    const oldSize = state.partyBuilds?.[player]?.length || 0;
                    if (oldSize < ROSTER) {
                        for (let i = oldSize; i < ROSTER; i++) {
                            state.partyBuilds[player][i] = DEFAULT_BUILDS[player][i] || 'Warrior';
                            state.partyNames[player][i] = getDefaultUnitName(state.partyBuilds[player][i]);
                            state.loadouts[player][i] = emptyLoadout();
                            if (!state.partyMeta[player]) state.partyMeta[player] = [];
                            state.partyMeta[player][i] = {};
                        }
                    } else if (oldSize > ROSTER) {
                        state.partyBuilds[player].length = ROSTER;
                        state.partyNames[player].length = ROSTER;
                        state.loadouts[player].length = ROSTER;
                        if (state.partyMeta[player]) state.partyMeta[player].length = ROSTER;
                    }
                });
            } else {
                CONFIG.gauntletDeploy = 0;
            }

            if (isOnlineMatch() && typeof _isHost === 'function' && _isHost()) {
                if (typeof _emit === 'function') _emit('relay', {
                    type: 'multiplayer-mode',
                    modeId: gm.id
                });
            }

            state.isRankedMatch = _msRanked;

            if (_msSelectedRounds > 0) {
                state._customRoundLimit = _msSelectedRounds;
            }

            state.controllers[1] = CTRL.LOCAL;
            state.controllers[2] = CTRL.AI;
            state.showPlayer2Builder = false;
            state.squadLeaderMode = false;

            if (mpMode && mpMode.isFFA) {
                state.autoPlayers = state.autoPlayers || {};
                state.autoPlayers[2] = true;
            }

            window.requestAnimationFrame(() => {
                if (typeof optimizeRandomizeParty === 'function') optimizeRandomizeParty(2);
                render();
            });

            dismissTitleScreen();
            render();

            state.audioUnlocked = true;
            syncMusicToState().catch(() => {});
        };

        window._selectMode = function(mode) {
            playSfx('uiButtonConfirm');

            state.isRankedMatch = false;

            // Leaving for any non-sim mode clears the sim-mode flags so a
            // stale training/balance/strength session can't keep recording.
            if (mode !== 'aitrain' && mode !== 'balancesim' && mode !== 'aistrength') {
                _aiTrainingMode = false;
                _balanceSimMode = false;
                _strengthTestMode = false;
            }

            if (mode === 'aitrain') {

                state.controllers[1] = CTRL.AI;
                state.controllers[2] = CTRL.AI;
                state.showPlayer2Builder = false;
                state.squadLeaderMode = false;
                _aiTrainingMode = true;
                _balanceSimMode = false;
                _strengthTestMode = false;
                state.devAutoSim = true;
                state.devSimSpeed = 16;   // turbo: renderer + waits are gated in dev-sim

                activeMultiplayerMode = _trainModeSetting;

                const trainMap = _trainMapSetting === 'rotate'
                    ? _TRAIN_MAP_POOL[_trainMapIndex++ % _TRAIN_MAP_POOL.length]
                    : _trainMapSetting;
                applyGameMode(trainMap);

                loadAIWeights().then(() => {

                    if (!_abExperiment) _startNextExperiment();
                    _generateChallengerWeights();
                    dismissTitleScreen();

                    _mirrorRandomizeTeams();
                    render();

                    setTimeout(() => {
                        const tp = document.getElementById('trainingPanel');
                        if (tp) tp.style.display = 'block';
                        renderTrainingDashboard();
                    }, 100);
                    state.audioUnlocked = true;
                    syncMusicToState().catch(() => {});
                });
            }

            if (mode === 'balancesim') {

                // Non-mirror balance sim: both AI sides share the same champion
                // weights (no A/B experiment), but teams are randomised
                // independently so job/race/spell win rates measure the GAME,
                // not the AI.
                state.controllers[1] = CTRL.AI;
                state.controllers[2] = CTRL.AI;
                state.showPlayer2Builder = false;
                state.squadLeaderMode = false;
                _aiTrainingMode = false;
                _balanceSimMode = true;
                _strengthTestMode = false;
                state.devAutoSim = true;
                state.devSimSpeed = 16;   // turbo: renderer + waits are gated in dev-sim

                activeMultiplayerMode = _trainModeSetting;

                const balMap = _trainMapSetting === 'rotate'
                    ? _TRAIN_MAP_POOL[_trainMapIndex++ % _TRAIN_MAP_POOL.length]
                    : _trainMapSetting;
                applyGameMode(balMap);

                Promise.all([loadAIWeights(), loadBalanceStats()]).then(() => {
                    dismissTitleScreen();
                    render();

                    setTimeout(() => {
                        const tp = document.getElementById('trainingPanel');
                        if (tp) tp.style.display = 'block';
                        renderBalanceDashboard();
                    }, 100);

                    // Kick off the auto-sim loop. restartDevSimFromBuilder is the
                    // same driver finalizeMatch re-arms after every match, and
                    // (with _aiTrainingMode off) it randomizes non-mirror teams +
                    // rotates the map before each match.
                    restartDevSimFromBuilder(60);

                    state.audioUnlocked = true;
                    syncMusicToState().catch(() => {});
                });
            }

            if (mode === 'aistrength') {

                // Champion-vs-baseline strength gauntlet: mirror teams, one side
                // plays the full current AI (trained weights + ainew overlay),
                // the other the untouched baseline (defaults + stock ai.js).
                // Sides alternate every match; the dashboard reports WR/Elo/CI.
                state.controllers[1] = CTRL.AI;
                state.controllers[2] = CTRL.AI;
                state.showPlayer2Builder = false;
                state.squadLeaderMode = false;
                _aiTrainingMode = false;
                _balanceSimMode = false;
                _strengthTestMode = true;
                state.devAutoSim = true;
                state.devSimSpeed = 16;

                activeMultiplayerMode = _trainModeSetting;

                const stMap = _trainMapSetting === 'rotate'
                    ? _TRAIN_MAP_POOL[_trainMapIndex++ % _TRAIN_MAP_POOL.length]
                    : _trainMapSetting;
                applyGameMode(stMap);

                Promise.all([loadAIWeights(), loadStrengthStats()]).then(() => {
                    dismissTitleScreen();
                    render();

                    setTimeout(() => {
                        const tp = document.getElementById('trainingPanel');
                        if (tp) tp.style.display = 'block';
                        renderStrengthDashboard();
                    }, 100);

                    restartDevSimFromBuilder(60);

                    state.audioUnlocked = true;
                    syncMusicToState().catch(() => {});
                });
            }
        };

        window._lobbyBack = function() {
            state.gameState = GS.MODE_SELECT;
            _showTitlePage('playHubPage');

            if (window._NET && window._NET.socket) {
                window._NET.socket.disconnect();
                window._NET.socket = null;
            }
        };

        function chooseBattleTrackKey(excludeKeys = []) {
            const exclude = excludeKeys.filter(Boolean);
            const choice = drawFromBattleShuffleBag(exclude[0] || state.lastBattleTrackKey);
            state.currentBattleTrackKey = choice;
            state.lastBattleTrackKey = choice;
            return choice;
        }

        async function skipBattleTrack() {
            /* Works in battle AND in the map editor (pause-menu ⏭/⏮). */
            if ((state.phase !== 'battle' && state.phase !== 'editor') || state.winner || !state.audioUnlocked) return false;
            playSfx('uiButtonConfirm');
            const nextKey = chooseBattleTrackKey([state.currentMusic, state.currentBattleTrackKey]);
            return await playMusic(nextKey);
        }

        async function syncMusicToState() {
            if (state.devAutoSim) return false;
            if (!state.audioUnlocked || state.winner) return false;
            if (state.phase === 'battle') {
                const battleKey = state.currentBattleTrackKey || chooseBattleTrackKey();
                return await playMusic(battleKey);
            }

            const key = state.titleScreenVisible ? 'titleTheme' : 'mainTheme';
            return await playMusic(key);
        }

        function posKey(x, y) {
            return `${x},${y}`;
        }

        function posKey3(x, y, z) {
            return `${x},${y},${z}`;
        }

        function parseKey3(key) {
            const parts = key.split(',');
            return { x: +parts[0], y: +parts[1], z: +parts[2] };
        }

        function getColumn(x, y) {
            return state.boardColumns?.[y]?.[x] || [];
        }

        function getBlockAt(x, y, z) {
            const col = getColumn(x, y);
            return col.find(b => b.z === z) || null;
        }

        function setBlockAt(x, y, z, terrain) {
            if (!state.boardColumns?.[y]?.[x]) return;
            const col = state.boardColumns[y][x];
            const idx = col.findIndex(b => b.z === z);
            if (idx >= 0) {
                col[idx].terrain = terrain;
            } else {
                col.push({ z, terrain });
                col.sort((a, b) => a.z - b.z);
            }
            _syncColumnToLegacy(x, y);
        }

        function removeBlockAt(x, y, z) {
            const col = state.boardColumns?.[y]?.[x];
            if (!col) return;
            const idx = col.findIndex(b => b.z === z);
            if (idx >= 0) col.splice(idx, 1);
            _syncColumnToLegacy(x, y);
        }

        function getWalkableSurfaces(x, y) {
            /* 'void' blocks are authored AIR (the gap fill between voxels on
               editor/community maps) — not standable and not headroom-blocking.
               Skipping them is what lets a unit walk UNDER a bridge/ceiling and
               still climb onto its top surface. */
            const col = getColumn(x, y).filter(b => !b.terrain || b.terrain.indexOf('void') !== 0);
            if (!col.length) return [0];
            const zSet = new Set(col.map(b => b.z));
            const surfaces = [];
            for (const block of col) {

                if (zSet.has(block.z + 1)) continue;

                const standZ = block.z + 1;
                const headroomOk = !zSet.has(standZ) && !zSet.has(standZ + 1);
                if (headroomOk) {
                    surfaces.push(block.z);
                }
            }

            if (!surfaces.length && col.length) return [];

            const obj = (typeof getObjectAt === 'function') ? getObjectAt(x, y) : null;
            if (obj) {
                const rule = (typeof OBJECT_RULES !== 'undefined') ? OBJECT_RULES[obj] : null;
                if (rule && rule.roofWalkable) {
                    const oSpr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[obj] : null;
                    if (oSpr && oSpr._gameHeight > 0) {

                        const baseH = state.boardHeights?.[y]?.[x] ?? 0;
                        const roofZ = baseH + oSpr._gameHeight;

                        surfaces.length = 0;
                        surfaces.push(roofZ);
                    }
                }
            }

            return surfaces.sort((a, b) => a - b);
        }

        function getTerrainAt3D(x, y, z) {
            if (z === undefined || z === null) return getTerrainAt(x, y);
            const block = getBlockAt(x, y, z);
            return block ? block.terrain : 'grass';
        }

        function nearestWalkableZ(x, y, targetZ) {
            const surfaces = getWalkableSurfaces(x, y);
            if (!surfaces.length) return 0;
            if (targetZ === undefined || targetZ === null) return surfaces[surfaces.length - 1];
            let best = surfaces[0];
            let bestDist = Math.abs(surfaces[0] - targetZ);
            for (let i = 1; i < surfaces.length; i++) {
                const d = Math.abs(surfaces[i] - targetZ);
                if (d < bestDist) { best = surfaces[i]; bestDist = d; }
            }
            return best;
        }

        function canOccupy3D(x, y, z) {
            if (!isInside(x, y)) return false;

            const surfaces = getWalkableSurfaces(x, y);
            if (!surfaces.includes(z)) return false;

            if (unitAt3D(x, y, z)) return false;

            const block = getBlockAt(x, y, z);
            if (block) {
                const rule = getTerrainRule(block.terrain);
                if (rule.passable === false) return false;
            }

            if (objectBlocksLanding(x, y)) return false;
            if (isTowerTile(x, y)) return false;

            if (state._deployedObjects) {
                for (const obj of state._deployedObjects) {
                    if (obj.x === x && obj.y === y && obj.hp > 0) {
                        if (obj.isDecoy || obj.blocksMovement || obj.blocksLanding) return false;
                    }
                }
            }

            if (state.turrets) {
                for (const turret of state.turrets) {
                    if (turret.x === x && turret.y === y && turret.hp > 0) {
                        const tz = (turret.z !== undefined && turret.z !== null) ? turret.z
                            : ((typeof getBaseHeightAt === 'function') ? getBaseHeightAt(x, y) : 0);
                        if (z <= tz + 1) return false;
                    }
                }
            }
            return true;
        }

        /* Units riding a building's lift (unit._insideBuildingId) are INSIDE the
           structure: they don't occupy a standing surface, can't be clicked or
           targeted, and don't block the roof tile above them — so every position
           lookup skips them. They resurface via processBuildingEmerge (battle.js)
           or when the building is destroyed on top of them. */
        function unitAt3D(x, y, z) {
            return state.units.find(u => !u.dead && !u._dying && !u._insideBuildingId && u.x === x && u.y === y && u.z === z) || null;
        }

        function unitsAtColumn(x, y) {
            return state.units.filter(u => !u.dead && !u._dying && !u._insideBuildingId && u.x === x && u.y === y);
        }

        function _syncColumnToLegacy(x, y) {
            const col = getColumn(x, y);
            if (!col.length) {
                if (state.boardTerrain?.[y]) state.boardTerrain[y][x] = 'grass';
                if (state.boardHeights?.[y]) state.boardHeights[y][x] = 0;
            } else {
                const top = col[col.length - 1];
                if (state.boardTerrain?.[y]) state.boardTerrain[y][x] = top.terrain || 'grass';
                if (state.boardHeights?.[y]) state.boardHeights[y][x] = top.z;
            }

            if (state.boardVoxels?.[y]) {
                state.boardVoxels[y][x] = col.map(b => ({ z: b.z, terrain: b.terrain }));
            }
            state._terrainVersion = (state._terrainVersion || 0) + 1;
            state._heightVersion = (state._heightVersion || 0) + 1;
            state._voxelVersion = (state._voxelVersion || 0) + 1;
        }

        function buildColumnsFromLegacy() {
            const h = bh(), w = bw();
            state._hollowVoxels = false;   // legacy/procedural maps are always solid
            state.boardColumns = [];
            state.boardVoxels = [];
            for (let y = 0; y < h; y++) {
                const row = [];
                const vRow = [];
                for (let x = 0; x < w; x++) {
                    const terrain = state.boardTerrain?.[y]?.[x] || 'grass';
                    const height = state.boardHeights?.[y]?.[x] || 0;
                    const col = [];
                    const vCol = [];
                    for (let z = 0; z <= height; z++) {
                        col.push({ z, terrain });
                        vCol.push({ z, terrain });
                    }
                    row.push(col);
                    vRow.push(vCol);
                }
                state.boardColumns.push(row);
                state.boardVoxels.push(vRow);
            }
            state._heightVersion = (state._heightVersion || 0) + 1;
            state._voxelVersion = (state._voxelVersion || 0) + 1;
        }

        /* Authored (map-editor / community) voxel maps keep their vertical gaps:
           the fill passes below pad missing z-levels with 'void' (air) instead of
           solidifying with the column's base terrain. Before this, painting lava
           at z0 and a bridge/ceiling block a few levels up solidified the whole
           gap with lava at match time ("empty blocks get filled with lava"). */
        function _authoredVoxelGapsArePreserved() {
            return state.phase === 'editor'
                || (typeof activeGameMode !== 'undefined'
                    && (activeGameMode === '_custom_editor' || activeGameMode === '_custom_community'));
        }

        function buildColumnsFromVoxels() {
            if (!state.boardVoxels?.length) return;
            const h = state.boardVoxels.length;
            state.boardColumns = [];
            for (let y = 0; y < h; y++) {
                const row = [];
                const w = state.boardVoxels[y]?.length || 0;
                for (let x = 0; x < w; x++) {
                    const voxels = state.boardVoxels[y]?.[x] || [];
                    if (voxels.length === 0) {
                        row.push([]);
                        continue;
                    }

                    const sorted = voxels.map(v => {
                        var entry = { z: v.z, terrain: v.terrain || 'grass' };
                        if (v.stairDir) entry.stairDir = v.stairDir;
                        return entry;
                    }).sort((a, b) => a.z - b.z);

                    /* Hollow-voxel maps (e.g. arches: a walkable span floating
                       over open ground) keep gaps so units can pass underneath
                       and the renderer leaves the underside open. Solid maps fill
                       every z from 0..top as before. */
                    if (state._hollowVoxels) {
                        row.push(sorted);
                    } else {
                        const topZ = sorted[sorted.length - 1].z;
                        const existingZ = new Set(sorted.map(b => b.z));
                        const filled = [];
                        /* Editor + custom/community maps: fill gaps with 'void'
                           (air) so a block painted several levels above leaves a
                           real gap; procedural/prebuilt maps solidify with the
                           base terrain. (Matches fillVoxelsDown.) */
                        const baseTerrain = _authoredVoxelGapsArePreserved() ? 'void' : sorted[0].terrain;
                        for (let z = 0; z <= topZ; z++) {
                            if (existingZ.has(z)) {
                                filled.push(sorted.find(b => b.z === z));
                            } else {
                                filled.push({ z, terrain: baseTerrain });
                            }
                        }
                        row.push(filled);
                    }
                }
                state.boardColumns.push(row);
            }

            for (let y = 0; y < state.boardColumns.length; y++) {
                const crow = state.boardColumns[y];
                if (!crow) continue;
                for (let x = 0; x < crow.length; x++) {
                    const col = crow[x];
                    if (!col || !col.length) {
                        if (state.boardHeights?.[y]) state.boardHeights[y][x] = 0;
                        if (state.boardTerrain?.[y]) state.boardTerrain[y][x] = 'grass';
                    } else {
                        const top = col[col.length - 1];
                        if (state.boardHeights?.[y]) state.boardHeights[y][x] = top.z;
                        if (state.boardTerrain?.[y]) state.boardTerrain[y][x] = top.terrain || 'grass';
                    }
                }
            }
            state._heightVersion = (state._heightVersion || 0) + 1;
            state._terrainVersion = (state._terrainVersion || 0) + 1;
        }

        function fillVoxelsDown() {
            if (!state.boardVoxels?.length) return;
            /* Skip the solidify pass on hollow-voxel maps so authored gaps
               (e.g. the open span under an arch) are preserved. */
            if (state._hollowVoxels) return;
            for (let y = 0; y < state.boardVoxels.length; y++) {
                const row = state.boardVoxels[y];
                if (!row) continue;
                for (let x = 0; x < row.length; x++) {
                    const col = row[x];
                    if (!col || col.length === 0) continue;
                    col.sort((a, b) => a.z - b.z);
                    const topZ = col[col.length - 1].z;
                    if (topZ <= 0) continue;
                    const existingZ = new Set(col.map(b => b.z));
                    /* Editor + custom/community maps: fill the gap between authored
                       voxels with 'void' (air) instead of the base terrain, so
                       painting a block several levels up leaves an actual empty gap
                       rather than a solid tower of the z0 terrain. The renderer
                       skips void bands; getWalkableSurfaces skips void blocks.
                       Procedural/prebuilt maps still solidify as before. */
                    const fillTerrain = _authoredVoxelGapsArePreserved() ? 'void' : (col[0].terrain || 'grass');
                    for (let z = 0; z <= topZ; z++) {
                        if (!existingZ.has(z)) {
                            col.push({ z, terrain: fillTerrain });
                        }
                    }
                    col.sort((a, b) => a.z - b.z);
                }
            }
        }

        /* Stamp gameplay collision for on-board monuments into the voxel grid. The
           smooth _hz* mesh is the visual; these voxels are the solid the engine
           already understands — tall stacks block movement (MAX_CLIMB_HEIGHT) and
           sight, stepped stacks are climbable. They are NOT drawn: rebuildTerrain
           caps the rendered height to the recorded floor on these tiles, so no
           blocky cubes show. Profiles add height ABOVE each tile's current floor:
             pyramid/ziggurat → stepped rings (climbable, "scale" it)
             stairway         → a rising flight of steps (climbable)
             obelisk          → a tall thin solid (impassable, blocks sight)
             colossus         → a low platform you can clamber onto
           greek & arch are left passable (visual-only) for now. */
        const _MON_COLLISION = {
            pyramid:  (dx, dy, rr) => rr - Math.max(Math.abs(dx), Math.abs(dy)),
            ziggurat: (dx, dy, rr) => rr - Math.max(Math.abs(dx), Math.abs(dy)),
            stairway: (dx, dy, rr) => dy + rr,
            obelisk:  (dx, dy, rr) => (dx === 0 && dy === 0) ? 6 : 0,
            colossus: (dx, dy, rr) => 1,
            // 2026-07 prop foundry: vehicles are mantle-height platforms
            // (climb the bus/lander roof); the Owl of the Grove is a wall
            bus:      (dx, dy, rr) => 1,
            lander:   (dx, dy, rr) => 1,
            owlidol:  (dx, dy, rr) => (dx === 0 && dy === 0) ? 6 : 0
        };
        function _stampMonumentCollision() {
            state._monumentTiles = null;
            try {
                if (!state.monuments || !state.monuments.length || !state.boardVoxels?.length) return;
                const W = bw(), H = bh();
                const tiles = new Map();
                const curTop = (x, y) => {
                    const c = state.boardVoxels?.[y]?.[x];
                    if (!c || !c.length) return 0;
                    let m = 0; for (const b of c) if (b.z > m) m = b.z;
                    return m;
                };
                for (const mon of state.monuments) {
                    const prof = _MON_COLLISION[mon.kind];
                    if (!prof || mon.solid === false) continue;
                    const F = Math.max(1, mon.foot || 3);
                    const rr = Math.floor(F / 2);
                    const cap = (typeof mon.maxH === 'number') ? mon.maxH : 99;
                    for (let dy = -rr; dy <= rr; dy++) {
                        for (let dx = -rr; dx <= rr; dx++) {
                            const x = mon.x + dx, y = mon.y + dy;
                            if (x < 0 || y < 0 || x >= W || y >= H) continue;
                            let addH = prof(dx, dy, rr) | 0;
                            if (addH <= 0) continue;
                            if (addH > cap) addH = cap;
                            const floor = curTop(x, y);
                            const colV = state.boardVoxels[y][x] || (state.boardVoxels[y][x] = []);
                            const have = new Set(colV.map(b => b.z));
                            for (let z = floor + 1; z <= floor + addH; z++) {
                                if (!have.has(z)) colV.push({ z, terrain: 'grass' });
                            }
                            const key = x + ',' + y;
                            const prev = tiles.get(key);
                            tiles.set(key, (prev === undefined) ? floor : Math.min(prev, floor));
                        }
                    }
                }
                state._monumentTiles = tiles.size ? tiles : null;
            } catch (e) { state._monumentTiles = null; }
        }

        function ensureUnitZCoords() {
            for (const unit of state.units) {
                if (unit.dead) continue;

                const surfaces = getWalkableSurfaces(unit.x, unit.y);
                if (surfaces.length > 1) {

                    const curZ = unit.z ?? 0;
                    unit.z = nearestWalkableZ(unit.x, unit.y, curZ);
                } else {

                    unit.z = nearestWalkableZ(unit.x, unit.y);
                }
            }
        }

        function dist3D(x1, y1, z1, x2, y2, z2) {
            return Math.abs(x1 - x2) + Math.abs(y1 - y2) + Math.abs((z1 || 0) - (z2 || 0));
        }

        function distXY(x1, y1, x2, y2) {
            return Math.abs(x1 - x2) + Math.abs(y1 - y2);
        }

        function combatDist(x1, y1, z1, x2, y2, z2) {
            // Horizontal distance: the 8 immediate neighbours (diagonals
            // included) are ALL 1 tile away — you can strike/cast anyone
            // directly adjacent, diagonal or cardinal, at range 1. Beyond that
            // first ring it's Manhattan (diamond), so longer ranges keep their
            // original reach and shape. This only collapses the diagonal corner
            // of the first ring from 2 down to 1; everything farther is
            // unchanged.
            const adx = Math.abs(x1 - x2), ady = Math.abs(y1 - y2);
            const dxy = (adx <= 1 && ady <= 1) ? Math.max(adx, ady) : (adx + ady);
            // 3D reach. Height is an INDEPENDENT axis, never added on top of the
            // horizontal distance. Range is a radius: you can reach any target
            // within `range` tiles horizontally AND within `range` levels up or
            // down — so the limiting distance is whichever axis is larger, not
            // their sum. A range-3 spell hits a target 3 tiles out and 2 (or 3)
            // levels up because both axes are within 3; a flyer parked far
            // overhead (or a target deep below) is out of reach only once the
            // vertical gap itself exceeds the range.
            const vz = Math.abs((z2 || 0) - (z1 || 0));   // elevation gap, up or down
            const d = Math.max(dxy, vz);
            // Same column, different height (e.g. a flyer directly overhead or a
            // unit directly below): the grid distance is 0 but it's still a real,
            // separate target — never collapse to 0.
            if (dxy === 0 && (z1 || 0) !== (z2 || 0)) return Math.max(1, d);
            return d;
        }

        // Range distance with the LONG-RANGE gravity rule applied. A long-ranged
        // delivery (projectile / beam / bolt / blast / psychic hit / thrown item)
        // falls DOWNWARD for free: a target sitting BELOW the caster ignores the
        // downward elevation gap, so only horizontal distance limits the reach.
        // Upward and horizontal still cost range normally. When `longRange` is
        // false this is exactly combatDist — close-range spells and basic attacks
        // keep the full 3D limit and can't reach far below. See isLongRangeSpell().
        function combatReach(x1, y1, z1, x2, y2, z2, longRange) {
            if (longRange && (z2 || 0) < (z1 || 0)) {
                // Collapse the downward drop to the caster's level: gravity carries
                // the shot/throw the rest of the way down.
                const d = combatDist(x1, y1, z1, x2, y2, z1);
                // A target directly below in the same column is still a real target
                // one drop away — keep it at range 1 rather than 0 (a self-cast).
                return d === 0 ? 1 : d;
            }
            return combatDist(x1, y1, z1, x2, y2, z2);
        }

        function randInt(n) {
            return Math.floor(Math.random() * n);
        }

        function isInside(x, y) {
            return x >= 0 && y >= 0 && x < bw() && y < bh();
        }

        function unitAt(x, y, z) {

            if (z !== undefined && z !== null) {
                const direct = state.units.find(u => !u.dead && !u._dying && !u._insideBuildingId && u.x === x && u.y === y && u.z === z);
                if (direct) return direct;

                return state.units.find(u => !u.dead && !u._dying && u._isBoss && u._bossSize === 2 &&
                    u.z === z &&
                    (x === u.x || x === u.x + 1) && (y === u.y || y === u.y + 1)) || null;
            }

            const _allHere = state.units.filter(u => !u.dead && !u._dying && !u._insideBuildingId && u.x === x && u.y === y);
            if (_allHere.length === 1) return _allHere[0];
            if (_allHere.length > 1) {

                const ground = _allHere.find(u => !isUnitAirborne(u));
                if (ground) return ground;
                return _allHere[0];
            }

            return state.units.find(u => !u.dead && !u._dying && u._isBoss && u._bossSize === 2 &&
                (x === u.x || x === u.x + 1) && (y === u.y || y === u.y + 1));
        }

        function airborneUnitAt(x, y) {
            return state.units.find(u => !u.dead && !u._dying && u.x === x && u.y === y && isUnitAirborne(u)) || null;
        }

        function distToTarget(fromX, fromY, target, fromZ) {
            const _fz = fromZ ?? 0;
            const _tz = target.z ?? 0;
            let d = combatDist(fromX, fromY, _fz, target.x, target.y, _tz);
            if (target._isBoss && target._bossSize === 2) {
                d = Math.min(d,
                    combatDist(fromX, fromY, _fz, target.x + 1, target.y, _tz),
                    combatDist(fromX, fromY, _fz, target.x, target.y + 1, _tz),
                    combatDist(fromX, fromY, _fz, target.x + 1, target.y + 1, _tz)
                );
            }
            return d;
        }

        function getTerrainAt(x, y) {
            return state.boardTerrain?.[y]?.[x] || 'grass';
        }

        /* Repaint ONE block of the column, never the whole stack. Tiles are
           individual cubes: painting lava on the surface of a multi-floor map
           must not convert the cave floors and walls buried underneath it
           (the old loop recolored every z in the column). `z` picks the exact
           block to repaint; omitted, the topmost solid (non-void) block — the
           visible surface — is painted, which matches the legacy 2D meaning. */
        function setTerrainAt(x, y, terrain, z) {
            const col = state.boardColumns?.[y]?.[x];
            if (col && col.length) {
                let blk = null;
                if (z !== undefined && z !== null) {
                    blk = col.find(b => b.z === z) || null;
                }
                if (!blk) {
                    for (let i = col.length - 1; i >= 0; i--) {
                        const t = col[i].terrain;
                        if (!t || t.indexOf('void') !== 0) { blk = col[i]; break; }
                    }
                }
                if (blk) {
                    blk.terrain = terrain;
                    const vCol = state.boardVoxels?.[y]?.[x];
                    if (vCol) {
                        const vBlk = vCol.find(b => b.z === blk.z);
                        if (vBlk) vBlk.terrain = terrain;
                    }
                    /* Legacy mirror always reflects the TOP block — unchanged
                       when a lower floor was painted. */
                    const top = col[col.length - 1];
                    if (state.boardTerrain?.[y]) state.boardTerrain[y][x] = top.terrain || 'grass';
                } else if (state.boardTerrain?.[y]) {
                    state.boardTerrain[y][x] = terrain;
                }
            } else if (state.boardTerrain?.[y]) {
                state.boardTerrain[y][x] = terrain;
            }

            if (typeof _terrainChunkCache !== 'undefined') _terrainChunkCache.clear();

            state._terrainVersion = (state._terrainVersion || 0) + 1;
        }

        function getHeightAt(x, y) {
            let h = state.boardHeights?.[y]?.[x] ?? 0;

            const obj = getObjectAt(x, y);
            if (obj) {
                const rule = getObjectRule(obj);
                if (rule && rule.roofWalkable) {
                    const oSpr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[obj] : null;
                    if (oSpr && oSpr._gameHeight > 0) {
                        h += oSpr._gameHeight;
                    }
                }
            }
            return h;
        }

        function getBaseHeightAt(x, y) {
            return state.boardHeights?.[y]?.[x] ?? 0;
        }
        function setHeightAt(x, y, h) {
            if (state.boardHeights?.[y]) {
                state.boardHeights[y][x] = h;
                state._terrainVersion = (state._terrainVersion || 0) + 1;
                state._heightVersion = (state._heightVersion || 0) + 1;
            }
        }

        function getUnitStandingHeight(unit) {
            if (!unit) return 0;

            if (unit.z !== undefined && unit.z !== null) {
                let h = unit.z;

                const obj = getObjectAt(unit.x, unit.y);
                if (obj) {
                    const rule = getObjectRule(obj);
                    if (rule && rule.roofWalkable) {
                        const oSpr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[obj] : null;
                        if (oSpr && oSpr._gameHeight > 0) h += oSpr._gameHeight;
                    }
                }
                return h;
            }
            return getHeightAt(unit.x, unit.y);
        }

        function getObjectAt(x, y) {
            const c = state.boardObjects?.[y]?.[x];
            if (!c) return null;
            if (Array.isArray(c)) return c.length > 0 ? (c[0].key||null) : null;
            return c;
        }
        function getObjectStack(x, y) {
            const c = state.boardObjects?.[y]?.[x];
            if (!c) return [];
            if (Array.isArray(c)) return c;
            const al = state.boardObjectAlign?.[y]?.[x] || 'center,bottom';
            const [ax,ay] = al.split(',');
            return [{ key:c, alignX:ax||'center', alignY:ay||'bottom', rot:0, flipX:false, flipY:false }];
        }

        function setObjectAt(x, y, obj) {
            if (state.boardObjects?.[y]) state.boardObjects[y][x] = obj;
            if (obj === null && state.boardObjectAlign?.[y]) state.boardObjectAlign[y][x] = 'center,bottom';
        }

        function getObjectRule(objKey) {
            return (typeof OBJECT_RULES !== 'undefined' && OBJECT_RULES[objKey]) ? OBJECT_RULES[objKey] : null;
        }

        /* ── 2×2 building footprint identity ─────────────────────────────
           A roofWalkable building covers a 2×2 footprint anchored at its NW
           tile (the non-_fp cell; the other three carry _fp shadow copies —
           see _stampBuildingFootprints). Resolve which building a tile
           belongs to so LOS / fog / building-HP checks can treat the four
           tiles as ONE structure. Returns { x, y, key } of the anchor, or
           null when the tile isn't part of a roofWalkable building. */
        function buildingAnchorAt(x, y) {
            const cell = state.boardObjects?.[y]?.[x];
            if (!cell) return null;
            const f = Array.isArray(cell) ? cell[0] : { key: cell };
            if (!f || !f.key) return null;
            const rule = getObjectRule(f.key);
            if (!rule || !rule.roofWalkable) return null;
            if (!f._fp) return { x, y, key: f.key };
            for (const [dx, dy] of [[-1, 0], [0, -1], [-1, -1]]) {
                const c2 = state.boardObjects?.[y + dy]?.[x + dx];
                const f2 = (Array.isArray(c2) && c2.length) ? c2[0] : null;
                if (f2 && f2.key === f.key && !f2._fp) return { x: x + dx, y: y + dy, key: f.key };
            }
            return { x, y, key: f.key };
        }

        /* True when both tiles are part of the SAME 2×2 building. */
        function sameBuildingTile(x1, y1, x2, y2) {
            const a = buildingAnchorAt(x1, y1);
            if (!a) return false;
            const b = buildingAnchorAt(x2, y2);
            return !!b && a.x === b.x && a.y === b.y;
        }

        /* All existing footprint tiles of the building anchored at (ax,ay). */
        function buildingFootprintTiles(ax, ay) {
            const tiles = [];
            for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
                const tx = ax + dx, ty = ay + dy;
                const a = buildingAnchorAt(tx, ty);
                if (a && a.x === ax && a.y === ay) tiles.push({ x: tx, y: ty });
            }
            return tiles;
        }

        function objectBlocksLanding(x, y) {
            const obj = getObjectAt(x, y);
            if (!obj) return false;
            const rule = getObjectRule(obj);
            return rule ? !!rule.blocksLanding : false;
        }

        function objectBlocksEdge(fromX, fromY, toX, toY) {
            const dx = toX - fromX;
            const dy = toY - fromY;

            if (_edgeBlocksDirection(fromX, fromY, dx, dy)) return true;

            if (_edgeBlocksDirection(toX, toY, -dx, -dy)) return true;
            return false;
        }

        function _edgeBlocksDirection(x, y, dx, dy) {
            const stack = getObjectStack(x, y);
            if (!stack.length) return false;
            for (const entry of stack) {
                const objKey = entry.key || entry;
                const rule = getObjectRule(objKey);
                if (!rule || !rule.edgeBlock) continue;

                const rotNorm = (((entry.rot || 0) % 360) + 360) % 360;
                const isRotated = (rotNorm === 90 || rotNorm === 270);

                const oSpr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[objKey] : null;
                const sprW = oSpr?.width || 128;
                const sprH = oSpr?.height || 32;

                const effW = isRotated ? sprH : sprW;
                const effH = isRotated ? sprW : sprH;
                const isWide = effW > effH;
                const isTall = effH > effW;

                const eX = (entry.alignX === 'left') ? -1 : (entry.alignX === 'right') ? 1 : 0;
                const eY = (entry.alignY === 'top') ? -1 : (entry.alignY === 'bottom') ? 1 : 0;

                if (isWide) {
                    if (eY === 0) {
                        if (dy !== 0) return true;
                    } else if ((eY < 0 && dy < 0) || (eY > 0 && dy > 0)) return true;
                }

                if (isTall) {
                    if (eX === 0) {
                        if (dx !== 0) return true;
                    } else if ((eX < 0 && dx < 0) || (eX > 0 && dx > 0)) return true;
                }
            }
            return false;
        }

        function getTerrainRule(terrain) {
            return TERRAIN_RULES[terrain] || TERRAIN_RULES.grass;
        }

        function isTerrainPassable(x, y) {
            const groundPassable = getTerrainRule(getTerrainAt(x, y)).passable !== false;

            const obj = getObjectAt(x, y);
            if (obj) {
                const rule = getObjectRule(obj);

                if (rule && rule.overridesGround && rule.passable !== false) return true;
                if (rule && rule.passable === false) return false;
            }
            if (!groundPassable) return false;
            return true;
        }

        function canOccupy(x, y, z) {
            if (!isInside(x, y)) return false;

            if (z !== undefined && z !== null) {
                return canOccupy3D(x, y, z);
            }

            if (unitAt(x, y) || !isTerrainPassable(x, y)) return false;

            if (objectBlocksLanding(x, y)) return false;

            if (isTowerTile(x, y)) return false;

            if (state._deployedObjects) {
                for (const obj of state._deployedObjects) {
                    if (obj.x === x && obj.y === y && obj.hp > 0 && (obj.isDecoy || obj.blocksMovement)) return false;
                }
            }

            if (state.turrets) {
                for (const turret of state.turrets) {
                    if (turret.x === x && turret.y === y && turret.hp > 0) return false;
                }
            }
            return true;
        }

        const SKY_RACES = ['fairy', 'shadow entity', 'ai', 'angel', 'seraphim', 'orb of light', 'demon', 'mech', 'ghost', 'annunaki', 'gargoyle', 'djinn', 'mothman', 'glitch', 'demon prince', 'demon princess', 'fallen angel', 'cyborg', 'nephilim', 'vampire', 'superhero', 'antihero', 'chosen one', 'dragon', 'occulus', 'valkraye', 'watcher'];
        function unitHasJetpack(unit) {
            return unit?.equipment?.accessory1 === 'jetpack' || unit?.equipment?.accessory2 === 'jetpack';
        }
        function canFly(unit) {
            if (SKY_RACES.includes(unit.race)) return true;

            if ((unit.race === 'homosapien' && unit.cls === 'Psychic') || unit.race === 'telepath') return true;
            return unitHasJetpack(unit);
        }

        function isUnitAirborne(unit) {
            if (!unit || !canFly(unit)) return false;
            const groundZ = getHeightAt(unit.x, unit.y);
            return (unit.z ?? 0) > groundZ;
        }

        function getMinFlyingZ(x, y) {
            const cfg = (typeof FLYING_ALTITUDE_CONFIG !== 'undefined') ? FLYING_ALTITUDE_CONFIG : { minClearance: 2 };
            return getHeightAt(x, y) + cfg.minClearance;
        }

        function getMaxFlyingZ(x, y) {
            const cfg = (typeof FLYING_ALTITUDE_CONFIG !== 'undefined') ? FLYING_ALTITUDE_CONFIG : { maxAltitudeAboveGround: 8 };
            return getHeightAt(x, y) + cfg.maxAltitudeAboveGround;
        }

        function getSectionBuffs(unit) {
            const noBuff = { atk: 0, def: 0, vision: 0, move: 0 };
            if (!unit) return noBuff;
            const section = getSectionForUnit(unit);
            const types = unit.types || [];
            if (section === 'above' && types.includes('divine')) {
                return { atk: 16, def: 10, vision: 1, move: 1 };
            }
            if (section === 'below' && types.includes('unholy')) {
                return { atk: 16, def: 10, vision: 1, move: 1 };
            }
            return noBuff;
        }

        const TOWER_MAX_HP = 2500;   // level-1 base magnitude
        const TOWER_DEF = 15;        // level-1 base magnitude
        const TOWER_VISION_RANGE = 4;

        /* Level 100: towers live in the same magnitude space as unit HP, so
           their stats scale by the match's level context — the level cap in
           PvP (where towers normally appear), the run's current level in
           campaign/MD. Attack rolls against towers scale by the attacker's
           level to match (battle.js doAttack), so time-to-kill a tower is
           unchanged from the 2500-HP days. */
        function _towerLevelScale() {
            if (typeof levelScale !== 'function') return 1;
            let lvl = (typeof LEVEL_CAP !== 'undefined') ? LEVEL_CAP : 100;
            if (state && (state.isCampaign || state._mdRun)) {
                const metas = state.partyMeta?.[1] || [];
                lvl = Math.max(1, ...metas.map(m => (m && m._campaignLevel) || 1));
            }
            return levelScale(lvl);
        }
        function _towerHp() { return Math.round(TOWER_MAX_HP * _towerLevelScale()); }
        function _towerDef() { return Math.round(TOWER_DEF * _towerLevelScale()); }

        /* LOS-ONLY VISION: a unit reveals any tile it has a clear line of sight
           to, regardless of distance — the old per-unit "vision range" no longer
           caps what a unit can see through the fog of war. Terrain/buildings still
           block sight (3D raycast), so hills and structures create the fog now.
           Structures (wards/towers) and the telescope keep their own fixed ranges.
           Flip to false to restore the classic range-limited fog. */
        const LOS_ONLY_VISION = true;

        function getTowerShieldLayers(towerOwner) { return 0; }
        function getTowerDamageMultiplier(towerOwner) { return 1.0; }
        function getTowerShieldLabel(towerOwner) { return ''; }

        function getTower(player) {
            return state.towers?.[player] || null;
        }

        function isTowerTile(x, y) {
            if (!state.towers) return false;
            const t1 = state.towers[1];
            const t2 = state.towers[2];
            if (t1 && t1.x === x && t1.y === y && t1.hp > 0) return 1;
            if (t2 && t2.x === x && t2.y === y && t2.hp > 0) return 2;
            return false;
        }

        function isTowerTopTile(x, y) {
            return false;
        }

        function towerAt(x, y) {
            const owner = isTowerTile(x, y);
            if (!owner) return null;
            return state.towers[owner];
        }

        function _assignTowerOwnersBySpawns(posA, posB) {
            const sp1 = (typeof SPAWNS !== 'undefined' && Array.isArray(SPAWNS[1])) ? SPAWNS[1] : [];
            const sp2 = (typeof SPAWNS !== 'undefined' && Array.isArray(SPAWNS[2])) ? SPAWNS[2] : [];
            if (!sp1.length || !sp2.length) return { 1: posA, 2: posB };
            const cen = (arr) => {
                let sx = 0, sy = 0;
                for (const p of arr) { sx += p.x; sy += p.y; }
                return { x: sx / arr.length, y: sy / arr.length };
            };
            const c1 = cen(sp1), c2 = cen(sp2);
            const d = (a, b) => (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
            const costA = d(posA, c1) + d(posB, c2);
            const costB = d(posB, c1) + d(posA, c2);
            return (costA <= costB) ? { 1: posA, 2: posB } : { 1: posB, 2: posA };
        }

        function placeTowers(board, size) {

            const mode = GAME_MODES[activeGameMode];
            const mpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
            if (mode && mode.hasTowers === false) return null;
            if (mpMode && mpMode.hasTowers === false) return null;

            const earthStart = MAP_SECTIONS.earth.startRow;
            const earthEnd = MAP_SECTIONS.earth.endRow;
            const earthH = earthEnd - earthStart + 1;
            const midY = earthStart + Math.floor(earthH / 2);
            const boxTopY = Math.max(earthStart, midY - 1);
            const boxBotY = Math.min(earthEnd, boxTopY + 1);
            const genders = Math.random() < 0.5 ? ['male', 'female'] : ['female', 'male'];
            const w = bw();

            const leftPos  = { x: 0, y: midY };
            const rightPos = { x: w - 1, y: midY };
            const leftBox  = { x1: 0, y1: boxTopY, x2: Math.min(1, w - 1), y2: boxBotY };
            const rightBox = { x1: Math.max(0, w - 2), y1: boxTopY, x2: w - 1, y2: boxBotY };
            const owners = _assignTowerOwnersBySpawns(leftPos, rightPos);
            const p1Pos = owners[1], p2Pos = owners[2];
            const p1Box = (p1Pos === leftPos) ? leftBox : rightBox;
            const p2Box = (p2Pos === leftPos) ? leftBox : rightBox;
            const t1 = {
                x: p1Pos.x, y: p1Pos.y,
                homeBox: p1Box,
                hp: _towerHp(), maxHp: _towerHp(), def: _towerDef(), owner: 1, gender: genders[0]
            };
            const t2 = {
                x: p2Pos.x, y: p2Pos.y,
                homeBox: p2Box,
                hp: _towerHp(), maxHp: _towerHp(), def: _towerDef(), owner: 2, gender: genders[1]
            };
            for (const t of [t1, t2]) {
                for (let dy = 0; dy <= (boxBotY - boxTopY); dy++) {
                    for (let dx = t.homeBox.x1; dx <= t.homeBox.x2; dx++) {
                        const by = t.homeBox.y1 + dy;
                        if (by >= earthStart && by <= earthEnd && dx >= 0 && dx < w) {
                            board[by][dx] = 'home_base';
                        }
                    }
                }
            }
            return { 1: t1, 2: t2 };
        }

        function generateBelowTerrain(board, w, startRow, endRow) {
            const sH = endRow - startRow + 1;

            for (let y = startRow; y <= endRow; y++) {
                for (let x = 0; x < w; x++) {
                    board[y][x] = 'cave_wall';
                }
            }

            const maxInset = Math.max(1, Math.floor(w * 0.15));
            const voidCorners = [
                { row: endRow,     inset: maxInset },
            ];
            if (sH >= 3) voidCorners.push({ row: endRow - 1, inset: Math.max(0, maxInset - 2) });
            for (const vc of voidCorners) {
                for (let i = 0; i < vc.inset; i++) {
                    board[vc.row][i] = 'void';
                    board[vc.row][w - 1 - i] = 'void';
                }
            }

            const midX = Math.floor(w / 2);
            const midY = startRow + Math.floor(sH / 2);
            const corridorWidth = w >= 12 ? 1 : 0;

            for (let x = 1; x < w - 1; x++) {
                for (let dy = -corridorWidth; dy <= corridorWidth; dy++) {
                    const y = midY + dy;
                    if (y >= startRow && y <= endRow && board[y][x] !== 'void') {
                        board[y][x] = 'cave_floor';
                    }
                }
            }

            for (const px of BARRIER_OPENINGS_X) {
                for (let y = startRow; y <= endRow; y++) {
                    for (let dx = -corridorWidth; dx <= corridorWidth; dx++) {
                        const x = px + dx;
                        if (x >= 0 && x < w && board[y][x] !== 'void') {
                            board[y][x] = 'cave_floor';
                        }
                    }
                }
            }

            if (sH >= 3) {
                const crossY1 = startRow + 1;
                const crossY2 = endRow - 1;
                for (let x = 1; x < w - 1; x++) {
                    if (board[crossY1][x] !== 'void') board[crossY1][x] = 'cave_floor';
                    if (crossY2 !== crossY1 && board[crossY2][x] !== 'void') board[crossY2][x] = 'cave_floor';
                }
            }

            if (BARRIER_OPENINGS_X.length >= 3) {
                const lavaX1 = Math.floor((BARRIER_OPENINGS_X[0] + BARRIER_OPENINGS_X[1]) / 2);
                const lavaX2 = Math.floor((BARRIER_OPENINGS_X[1] + BARRIER_OPENINGS_X[2]) / 2);
                for (let y = startRow + 1; y <= endRow - 1; y++) {
                    if (board[y][lavaX1] === 'cave_floor' && y !== midY) board[y][lavaX1] = 'lava';
                    if (board[y][lavaX2] === 'cave_floor' && y !== midY) board[y][lavaX2] = 'lava';
                }
            }

            const crystalOff = Math.min(2, Math.floor(w / 6));
            const crystalPositions = [
                { x: midX - crystalOff, y: midY }, { x: midX + crystalOff, y: midY },
            ];
            if (sH >= 3) {
                crystalPositions.push({ x: midX, y: midY - 1 });
                crystalPositions.push({ x: midX, y: midY + 1 });
            }
            for (const cp of crystalPositions) {
                if (cp.x >= 0 && cp.x < w && cp.y >= startRow && cp.y <= endRow) {
                    if (board[cp.y][cp.x] === 'cave_floor') board[cp.y][cp.x] = 'crystal';
                }
            }

            const mushCount = Math.max(1, Math.floor(w * sH * 0.04));
            for (let i = 0; i < mushCount; i++) {
                const x = 1 + Math.floor(Math.random() * (w - 2));
                const y = startRow + Math.floor(Math.random() * sH);
                if (board[y][x] === 'cave_floor') board[y][x] = 'mushroom';
            }

            const obsCount = Math.max(1, Math.floor(w * sH * 0.05));
            for (let i = 0; i < obsCount; i++) {
                const x = 1 + Math.floor(Math.random() * (w - 2));
                const y = startRow + Math.floor(Math.random() * sH);
                if (board[y][x] === 'cave_floor') board[y][x] = 'obsidian';
            }

            for (const ox of BARRIER_OPENINGS_X) {
                for (let dy = 0; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = ox + dx, ny = startRow + dy;
                        if (nx >= 0 && nx < w && ny >= startRow && ny <= endRow) {
                            if (board[ny][nx] === 'cave_wall' || board[ny][nx] === 'lava') board[ny][nx] = 'cave_floor';
                        }
                    }
                }
            }
        }

        function generateAboveTerrain(board, w, startRow, endRow) {
            const sH = endRow - startRow + 1;

            for (let y = startRow; y <= endRow; y++) {
                for (let x = 0; x < w; x++) {
                    board[y][x] = 'cloud_gap';
                }
            }

            const maxInset = Math.max(1, Math.floor(w * 0.15));
            const voidCorners = [
                { row: startRow, inset: maxInset },
            ];
            if (sH >= 3) voidCorners.push({ row: startRow + 1, inset: Math.max(0, maxInset - 2) });
            for (const vc of voidCorners) {
                for (let i = 0; i < vc.inset; i++) {
                    board[vc.row][i] = 'void';
                    board[vc.row][w - 1 - i] = 'void';
                }
            }

            const midX = Math.floor(w / 2);
            const midRowY = startRow + Math.floor(sH / 2);
            const islands = [];
            if (w >= 12) {

                islands.push({ cx: Math.floor(w * 0.2), cy: midRowY, rx: Math.floor(w * 0.14), ry: Math.max(1, Math.floor(sH / 2)) });
                islands.push({ cx: midX, cy: midRowY, rx: Math.floor(w * 0.22), ry: Math.max(1, Math.floor(sH / 2)) });
                islands.push({ cx: w - 1 - Math.floor(w * 0.2), cy: midRowY, rx: Math.floor(w * 0.14), ry: Math.max(1, Math.floor(sH / 2)) });
            } else {

                islands.push({ cx: midX, cy: midRowY, rx: Math.floor(w * 0.35), ry: Math.max(1, Math.floor(sH / 2)) });
            }

            for (const island of islands) {
                for (let y = startRow; y <= endRow; y++) {
                    for (let x = 0; x < w; x++) {
                        if (board[y][x] === 'void') continue;
                        const dx = island.rx > 0 ? (x - island.cx) / island.rx : 99;
                        const dy = island.ry > 0 ? (y - island.cy) / island.ry : 99;
                        if (dx * dx + dy * dy <= 1.0) {
                            board[y][x] = 'cloud';
                        }
                    }
                }
            }

            if (islands.length >= 3) {
                const bridgeY = midRowY;
                for (let x = islands[0].cx + islands[0].rx; x < islands[1].cx - islands[1].rx; x++) {
                    if (x >= 0 && x < w && board[bridgeY][x] !== 'void') board[bridgeY][x] = 'cloud';
                }
                for (let x = islands[1].cx + islands[1].rx; x < islands[2].cx - islands[2].rx; x++) {
                    if (x >= 0 && x < w && board[bridgeY][x] !== 'void') board[bridgeY][x] = 'cloud';
                }
            }

            for (const island of islands) {
                const ruinPositions = [
                    { x: island.cx - Math.max(1, island.rx - 1), y: island.cy },
                    { x: island.cx + Math.max(1, island.rx - 1), y: island.cy },
                ];
                for (const rp of ruinPositions) {
                    if (rp.x >= 0 && rp.x < w && rp.y >= startRow && rp.y <= endRow) {
                        if (board[rp.y][rp.x] === 'cloud') board[rp.y][rp.x] = 'sky_ruin';
                    }
                }
            }

            const thickCount = Math.max(1, Math.floor(w * sH * 0.06));
            for (let i = 0; i < thickCount; i++) {
                const x = Math.floor(Math.random() * w);
                const y = startRow + Math.floor(Math.random() * sH);
                if (board[y][x] === 'cloud') {
                    board[y][x] = 'cloud_thick';
                }
            }

            for (const ox of BARRIER_OPENINGS_X) {
                for (let dy = -1; dy <= 0; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = ox + dx, ny = endRow + dy;
                        if (nx >= 0 && nx < w && ny >= startRow && ny <= endRow) {
                            if (board[ny][nx] !== 'cloud' && board[ny][nx] !== 'void') board[ny][nx] = 'cloud';
                        }
                    }
                }
            }

            for (let x = 0; x < w; x++) {
                if (board[endRow][x] === 'cloud_gap' && board[endRow][x] !== 'void') {
                    const nearPassage = BARRIER_OPENINGS_X.some(ox => Math.abs(x - ox) <= 2);
                    if (nearPassage) board[endRow][x] = 'cloud';
                }
            }
        }

        function initMap(fullBoard, reserved) {
            const w = bw(), h = bh();
            const board = fullBoard;
            state.monuments = null;   // default; prebuilt maps may set it below

            function _initObjectGrid() {
                state.boardObjects = Array.from({ length: h }, () => Array(w).fill(null));
                state.boardObjectAlign = Array.from({ length: h }, () => Array(w).fill('center,bottom'));
                /* Fresh board → building HP records re-scan lazily (battle.js
                   ensureBuildingsInit) the first time anything touches them. */
                state.buildings = null;
            }

            function _initHeightGrid() {
                state.boardHeights = Array.from({ length: h }, () => Array(w).fill(0));
            }

            /* ── 2×2 building footprints ──────────────────────────────────
               A roofWalkable building (building_*, ancient/abandoned, church,
               church_*, shop) is drawn as a 2×2 block anchored at its NW tile,
               covering (x,y),(x+1,y),(x,y+1),(x+1,y+1). Stamp a footprint
               "shadow" of the same object onto the three SE tiles so every
               getObjectAt-based check — roof-walk surfaces, height, climb
               access, LOS — treats all four tiles as the building and units
               can stand anywhere on the roof. The shadow carries _fp:true so
               the renderer only draws the prism once (at the anchor). The map
               data flattens each block to one height, so the roof is level.
               Runs for BOTH prebuilt and custom-editor maps. */
            function _stampBuildingFootprints(w, h) {
                for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
                    const cell = state.boardObjects?.[y]?.[x];
                    if (!cell) continue;
                    const f = Array.isArray(cell) ? (cell.length ? cell[0] : null) : { key: cell };
                    if (!f || f._fp || !f.key) continue;
                    const rule = (typeof OBJECT_RULES !== 'undefined') ? OBJECT_RULES[f.key] : null;
                    if (!rule || !rule.roofWalkable) continue;
                    const baseH = state.boardHeights?.[y]?.[x] ?? 0;
                    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1]]) {
                        const fx = x + dx, fy = y + dy;
                        if (fx >= w || fy >= h) continue;
                        const occ = state.boardObjects?.[fy]?.[fx];
                        if (occ && (!Array.isArray(occ) || occ.length)) continue;
                        state.boardObjects[fy][fx] = [{
                            key: f.key, alignX: f.alignX || 'center', alignY: f.alignY || 'bottom',
                            rot: f.rot || 0, flipX: !!f.flipX, flipY: !!f.flipY, _fp: true
                        }];
                        if (state.boardObjectAlign?.[fy]) state.boardObjectAlign[fy][fx] = (f.alignX || 'center') + ',' + (f.alignY || 'bottom');
                        if (state.boardHeights?.[fy]) state.boardHeights[fy][fx] = baseH;
                    }
                }
            }

            function _initTowersFromObjects() {

                const mpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
                const needsTowers = mpMode ? (mpMode.hasTowers !== false) : true;
                const dragons = [];
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const stk = state.boardObjects[y]?.[x];
                        if (!Array.isArray(stk)) continue;
                        for (const obj of stk) {
                            if (obj.key === 'tower_cube') dragons.push({ x, y });
                        }
                    }
                }
                if (!needsTowers) {

                    for (const d of dragons) {
                        const stk = state.boardObjects[d.y]?.[d.x];
                        if (Array.isArray(stk)) {
                            state.boardObjects[d.y][d.x] = stk.filter(o => o.key !== 'tower_cube');
                        }
                    }
                    state.towers = { 1: null, 2: null };
                    return;
                }
                if (dragons.length >= 2) {
                    dragons.sort((a, b) => a.x - b.x);
                    const posA = dragons[0];
                    const posB = dragons[dragons.length - 1];
                    const owners = _assignTowerOwnersBySpawns(posA, posB);
                    const p1 = owners[1], p2 = owners[2];
                    const genders = Math.random() < 0.5 ? ['male', 'female'] : ['female', 'male'];
                    state.towers = {
                        1: { x: p1.x, y: p1.y, hp: _towerHp(), maxHp: _towerHp(), def: _towerDef(), owner: 1, gender: genders[0],
                             homeBox: { x1: Math.max(0, p1.x - 1), y1: Math.max(0, p1.y - 1), x2: Math.min(w - 1, p1.x + 1), y2: Math.min(h - 1, p1.y + 1) } },
                        2: { x: p2.x, y: p2.y, hp: _towerHp(), maxHp: _towerHp(), def: _towerDef(), owner: 2, gender: genders[1],
                             homeBox: { x1: Math.max(0, p2.x - 1), y1: Math.max(0, p2.y - 1), x2: Math.min(w - 1, p2.x + 1), y2: Math.min(h - 1, p2.y + 1) } }
                    };
                } else if (dragons.length === 1) {

                    const d0 = dragons[0];
                    const mirrored = { x: (w - 1) - d0.x, y: (h - 1) - d0.y };
                    const owners = _assignTowerOwnersBySpawns(d0, mirrored);
                    const p1 = owners[1], p2 = owners[2];
                    const genders = Math.random() < 0.5 ? ['male', 'female'] : ['female', 'male'];
                    state.towers = {
                        1: { x: p1.x, y: p1.y, hp: _towerHp(), maxHp: _towerHp(), def: _towerDef(), owner: 1, gender: genders[0],
                             homeBox: { x1: Math.max(0, p1.x - 1), y1: Math.max(0, p1.y - 1), x2: Math.min(w - 1, p1.x + 1), y2: Math.min(h - 1, p1.y + 1) } },
                        2: { x: p2.x, y: p2.y, hp: _towerHp(), maxHp: _towerHp(), def: _towerDef(), owner: 2, gender: genders[1],
                             homeBox: { x1: Math.max(0, p2.x - 1), y1: Math.max(0, p2.y - 1), x2: Math.min(w - 1, p2.x + 1), y2: Math.min(h - 1, p2.y + 1) } }
                    };
                } else {
                    state.towers = { 1: null, 2: null };
                }

                for (const d of dragons) {
                    const stk = state.boardObjects[d.y]?.[d.x];
                    if (Array.isArray(stk)) {
                        state.boardObjects[d.y][d.x] = stk.filter(o => o.key !== 'tower_cube');
                    }
                }
            }

            function _initNexusFromObjects() {

                const mpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
                const modeWantsNexus = !mpMode || mpMode.hasNexus !== false;

                const nexuses = [];
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const stk = state.boardObjects[y]?.[x];
                        if (!Array.isArray(stk)) continue;
                        for (const obj of stk) {
                            if (obj.key === 'nexus') nexuses.push({ x, y, key: 'earth', terrain: 'nexus' });
                            else if (obj.key === 'nexus_cave') nexuses.push({ x, y, key: 'below', terrain: 'nexus_cave' });
                            else if (obj.key === 'nexus_sky') nexuses.push({ x, y, key: 'above', terrain: 'nexus_sky' });
                        }
                    }
                }

                for (const n of nexuses) {
                    const stk = state.boardObjects[n.y]?.[n.x];
                    if (Array.isArray(stk)) {
                        state.boardObjects[n.y][n.x] = stk.filter(o => o.key !== 'nexus' && o.key !== 'nexus_cave' && o.key !== 'nexus_sky');
                    }
                }

                if (!modeWantsNexus) {
                    state.nexusPoints = {};
                    return;
                }

                state.nexusPoints = {};
                for (const n of nexuses) {
                    state.nexusPoints[n.key] = {
                        zoneX: n.x, zoneY: n.y,
                        zoneSize: NEXUS_ZONE_SIZE,
                        owner: 0, progress: 0
                    };

                    for (let dy = 0; dy < NEXUS_ZONE_SIZE; dy++) {
                        for (let dx = 0; dx < NEXUS_ZONE_SIZE; dx++) {
                            const nx = n.x + dx, ny = n.y + dy;
                            if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
                                state.boardTerrain[ny][nx] = n.terrain;
                            }
                        }
                    }
                }
            }

            function _autoPlaceTowersIfNeeded() {
                const mpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
                const needsTowers = mpMode ? mpMode.hasTowers : false;
                if (!needsTowers) return;
                if (state.towers && (state.towers[1] || state.towers[2])) return;

                const genders = Math.random() < 0.5 ? ['male', 'female'] : ['female', 'male'];

                function _isSafeTowerTile(x, y) {
                    if (x < 0 || y < 0 || y >= h || x >= w) return false;
                    const t = state.boardTerrain?.[y]?.[x];
                    if (!t) return false;
                    const rule = t ? TERRAIN_RULES[t] : null;
                    if (!rule || rule.passable === false) return false;
                    if (t === 'barrier_passage') return false;
                    /* Don't place tower on a spawn zone tile */
                    if (typeof isInAnySpawnZone === 'function' && isInAnySpawnZone(x, y)) return false;
                    const stk = state.boardObjects?.[y]?.[x];
                    if (!stk) return true;
                    const arr = Array.isArray(stk) ? stk : [stk];
                    for (const o of arr) {
                        const key = typeof o === 'string' ? o : o?.key;
                        if (!key) continue;
                        const oRule = typeof OBJECT_RULES !== 'undefined' ? OBJECT_RULES[key] : null;
                        if (oRule && oRule.roofWalkable) return false;
                    }
                    return true;
                }

                /* Zone-adjacent tower placement:
                   Place tower on the row/col immediately inward from the spawn zone, centered. */
                function _pickTowerFromZone(player) {
                    const zone = state.spawnZones?.[player];
                    if (!zone || zone.length === 0) return null;

                    /* Determine inward direction from zone */
                    const avgX = zone.reduce((s, t) => s + t.x, 0) / zone.length;
                    const avgY = zone.reduce((s, t) => s + t.y, 0) / zone.length;
                    const midIdx = Math.floor(zone.length / 2);
                    const centerTile = zone[midIdx];

                    /* Check if zone is on a row edge or column edge */
                    const isTopRow = centerTile.y === 0;
                    const isBottomRow = centerTile.y === h - 1;
                    const isLeftCol = centerTile.x === 0;
                    const isRightCol = centerTile.x === w - 1;

                    let candidates = [];
                    if (isTopRow || isBottomRow) {
                        /* Vertical: place on row inward from zone, centered */
                        const inwardRow = isTopRow ? 1 : h - 2;
                        if (_isSafeTowerTile(centerTile.x, inwardRow)) {
                            candidates.push({ x: centerTile.x, y: inwardRow });
                        }
                        /* Try adjacent cols */
                        for (let dx = -1; dx <= 1; dx++) {
                            const tx = centerTile.x + dx;
                            if (_isSafeTowerTile(tx, inwardRow)) candidates.push({ x: tx, y: inwardRow });
                        }
                        /* Try one more row inward */
                        const deeperRow = isTopRow ? 2 : h - 3;
                        if (candidates.length === 0 && deeperRow >= 0 && deeperRow < h) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const tx = centerTile.x + dx;
                                if (_isSafeTowerTile(tx, deeperRow)) candidates.push({ x: tx, y: deeperRow });
                            }
                        }
                    } else if (isLeftCol || isRightCol) {
                        const inwardCol = isLeftCol ? 1 : w - 2;
                        if (_isSafeTowerTile(inwardCol, centerTile.y)) {
                            candidates.push({ x: inwardCol, y: centerTile.y });
                        }
                        for (let dy = -1; dy <= 1; dy++) {
                            const ty = centerTile.y + dy;
                            if (_isSafeTowerTile(inwardCol, ty)) candidates.push({ x: inwardCol, y: ty });
                        }
                        const deeperCol = isLeftCol ? 2 : w - 3;
                        if (candidates.length === 0 && deeperCol >= 0 && deeperCol < w) {
                            for (let dy = -1; dy <= 1; dy++) {
                                const ty = centerTile.y + dy;
                                if (_isSafeTowerTile(deeperCol, ty)) candidates.push({ x: deeperCol, y: ty });
                            }
                        }
                    }

                    /* Deduplicate and pick closest to center-zone */
                    const seen = new Set();
                    const unique = candidates.filter(c => {
                        const k = c.x + ',' + c.y;
                        if (seen.has(k)) return false;
                        seen.add(k);
                        return true;
                    });

                    if (unique.length === 0) return null;
                    /* Pick the one closest to zone center */
                    unique.sort((a, b) => {
                        const da = Math.abs(a.x - avgX) + Math.abs(a.y - avgY);
                        const db = Math.abs(b.x - avgX) + Math.abs(b.y - avgY);
                        return da - db;
                    });
                    return unique[0];
                }

                let t1Pos = _pickTowerFromZone(1);
                let t2Pos = _pickTowerFromZone(2);

                /* Fallback: old spawn-based logic if zones not available */
                if (!t1Pos || !t2Pos) {
                    const sp1 = (typeof SPAWNS !== 'undefined' && Array.isArray(SPAWNS[1])) ? SPAWNS[1] : [];
                    const sp2 = (typeof SPAWNS !== 'undefined' && Array.isArray(SPAWNS[2])) ? SPAWNS[2] : [];
                    if (sp1.length > 0 && !t1Pos) {
                        const safe = sp1.filter(s => _isSafeTowerTile(s.x, s.y));
                        t1Pos = safe[0] || sp1[0];
                    }
                    if (sp2.length > 0 && !t2Pos) {
                        const safe = sp2.filter(s => _isSafeTowerTile(s.x, s.y));
                        t2Pos = safe[0] || sp2[0];
                    }
                }

                if (t1Pos && t2Pos) {
                    const p1 = t1Pos, p2 = t2Pos;
                    state.towers = {
                        1: { x: p1.x, y: p1.y, hp: _towerHp(), maxHp: _towerHp(), def: _towerDef(), owner: 1, gender: genders[0],
                             homeBox: { x1: Math.max(0, p1.x - 1), y1: Math.max(0, p1.y - 1), x2: Math.min(w - 1, p1.x + 1), y2: Math.min(h - 1, p1.y + 1) } },
                        2: { x: p2.x, y: p2.y, hp: _towerHp(), maxHp: _towerHp(), def: _towerDef(), owner: 2, gender: genders[1],
                             homeBox: { x1: Math.max(0, p2.x - 1), y1: Math.max(0, p2.y - 1), x2: Math.min(w - 1, p2.x + 1), y2: Math.min(h - 1, p2.y + 1) } }
                    };
                    console.log('[Tower auto-place] P1 tower:', t1Pos, ' P2 tower:', t2Pos);
                }
            }

            function _autoPlaceNexusIfNeeded() {
                const mpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
                const needsNexus = mpMode ? (mpMode.hasNexus === true) : true;
                if (!needsNexus) return;

                const existingCount = state.nexusPoints ? Object.keys(state.nexusPoints).length : 0;
                const isLargeMap = (w >= 16 && h >= 16);

                if (!isLargeMap && existingCount > 0) return;

                if (isLargeMap && existingCount >= 3) return;

                const nzSz = NEXUS_ZONE_SIZE;

                function _canFit(ax, ay) {
                    for (let dy = 0; dy < nzSz; dy++) {
                        for (let dx = 0; dx < nzSz; dx++) {
                            const nx = ax + dx, ny = ay + dy;
                            if (ny < 0 || ny >= h || nx < 0 || nx >= w) return false;
                            const t = state.boardTerrain?.[ny]?.[nx];
                            if (t === 'nexus' || t === 'nexus_cave' || t === 'nexus_sky') continue;
                            const rule = t ? TERRAIN_RULES[t] : null;
                            if (rule && rule.passable === false) return false;
                        }
                    }
                    return true;
                }

                function _stamp(key, ax, ay) {
                    if (state.nexusPoints[key]) return true;
                    if (!_canFit(ax, ay)) return false;
                    for (let dy = 0; dy < nzSz; dy++)
                        for (let dx = 0; dx < nzSz; dx++)
                            state.boardTerrain[ay + dy][ax + dx] = 'nexus';
                    state.nexusPoints[key] = {
                        zoneX: ax, zoneY: ay,
                        zoneSize: nzSz, owner: 0, progress: 0
                    };
                    return true;
                }

                function _stampNear(key, ax, ay, r) {
                    if (_stamp(key, ax, ay)) return true;
                    for (let d = 1; d <= r; d++) {
                        for (let offy = -d; offy <= d; offy++) {
                            for (let offx = -d; offx <= d; offx++) {
                                if (Math.abs(offx) !== d && Math.abs(offy) !== d) continue;
                                if (_stamp(key, ax + offx, ay + offy)) return true;
                            }
                        }
                    }
                    return false;
                }

                if (!state.nexusPoints) state.nexusPoints = {};

                if (!isLargeMap) {

                    const mx = Math.floor(w / 2) - Math.floor(nzSz / 2);
                    const my = Math.floor(h / 2) - Math.floor(nzSz / 2);
                    _stampNear('earth', mx, my, 3);
                    return;
                }

                /* Diagonal nexus line: center zone always dead-center, plus one
                   toward the NW corner and one toward the SE corner. The layout
                   is 180°-rotation symmetric (fair for mirrored spawns), and
                   _stampNear slides each zone to the nearest tile patch that
                   actually fits this map's terrain. */
                const midY = Math.floor(h / 2);
                const midX = Math.floor(w / 2);
                const nzHalf = Math.floor(nzSz / 2);
                const off = Math.floor(Math.min(w, h) / 4);

                _stampNear('earth', midX - nzHalf, midY - nzHalf, 3);
                _stampNear('nw', midX - off - nzHalf, midY - off - nzHalf, 4);
                _stampNear('se', midX + off - nzHalf, midY + off - nzHalf, 4);
            }

            if (activeGameMode === '_custom_editor' || activeGameMode === '_custom_community') {
                state.boardTerrain = board;
                _initObjectGrid();
                _initHeightGrid();

                if (window._customEditorHeights) {
                    for (let _hy = 0; _hy < h; _hy++) {
                        for (let _hx = 0; _hx < w; _hx++) {
                            state.boardHeights[_hy][_hx] = window._customEditorHeights[_hy]?.[_hx] ?? 0;
                        }
                    }
                    delete window._customEditorHeights;
                    state._heightVersion = (state._heightVersion || 0) + 1;
                }

                if (window._customEditorVoxels) {
                    state.boardVoxels = window._customEditorVoxels;
                    delete window._customEditorVoxels;
                    state._voxelVersion = (state._voxelVersion || 0) + 1;
                    fillVoxelsDown();
                }
                if (window._customEditorObjects) {
                    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
                        const cell = window._customEditorObjects[y]?.[x];
                        if (!cell) continue;
                        if (Array.isArray(cell) && cell.length > 0) {
                            state.boardObjects[y][x] = cell;
                            const f = cell[0];
                            if (f) state.boardObjectAlign[y][x] = (f.alignX||'center')+','+(f.alignY||'bottom');
                        } else if (typeof cell === 'string') { state.boardObjects[y][x] = cell; }
                    }
                    delete window._customEditorObjects;
                }
                /* Esoteric monuments authored in the editor. */
                state.monuments = Array.isArray(window._customEditorMonuments) ? window._customEditorMonuments : null;
                delete window._customEditorMonuments;
                /* Custom-editor buildings get the same 2×2 footprint shadows as
                   prebuilt maps so roof-walk / LOS / building HP treat all four
                   tiles as one structure. */
                _stampBuildingFootprints(w, h);
                _initTowersFromObjects();
                _initNexusFromObjects();
                _autoPlaceNexusIfNeeded();

                /* Auto-generate spawn zones (replaces old sanctuary system) */
                autoGenerateSpawnZones();
                _autoPlaceTowersIfNeeded();

                /* Legacy sanctuary data — ignored at runtime */
                state.sanctuaryZoneMap = window._customEditorSanctuaryZones || null;
                delete window._customEditorSanctuaryZones;
                state.sanctuaries = {};

                MAP_HAS_FLOORS = false;

                /* Stamp climb voxels for climbable monuments BEFORE building
                   columns so the climb cubes end up in boardColumns (mirrors the
                   prebuilt path). */
                if (typeof _stampMonumentCollision === 'function') _stampMonumentCollision();

                if (state.boardVoxels?.length) {
                    buildColumnsFromVoxels();
                } else {
                    buildColumnsFromLegacy();
                }
                return;
            }

            if (typeof PREBUILT_MAPS !== 'undefined' && PREBUILT_MAPS[activeGameMode]) {
                state.boardTerrain = board;
                _initObjectGrid();
                _initHeightGrid();

                const _pb = PREBUILT_MAPS[activeGameMode];
                /* Opt this map into hollow voxel columns (preserve authored gaps
                   for walk-under arches / overhangs). Default: solid. */
                state._hollowVoxels = !!_pb.hollowVoxels;
                /* On-board monuments (reused esoteric 3D geometry). */
                state.monuments = Array.isArray(_pb.monuments) ? _pb.monuments : null;
                if (_pb.heightMap) {

                    for (let _hy = 0; _hy < h; _hy++) {
                        for (let _hx = 0; _hx < w; _hx++) {
                            state.boardHeights[_hy][_hx] = _pb.heightMap[_hy]?.[_hx] ?? 0;
                        }
                    }
                } else {

                    const _cx = (w - 1) / 2, _cy = (h - 1) / 2;
                    const _maxDist = Math.sqrt(_cx * _cx + _cy * _cy);
                    for (let _hy = 0; _hy < h; _hy++) {
                        for (let _hx = 0; _hx < w; _hx++) {
                            const _dist = Math.sqrt((_hx - _cx) ** 2 + (_hy - _cy) ** 2);
                            const _norm = 1 - (_dist / _maxDist);

                            if (_norm > 0.4) {
                                state.boardHeights[_hy][_hx] = Math.min(3, Math.floor((_norm - 0.4) * 6));
                            }
                        }
                    }
                }
                state._heightVersion = (state._heightVersion || 0) + 1;
                if (window._prebuiltObjects) {
                    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
                        const cell = window._prebuiltObjects[y]?.[x];
                        if (!cell) continue;

                        const _bpTerrain = state.boardTerrain?.[y]?.[x];
                        if (_bpTerrain === 'barrier_passage') continue;
                        if (Array.isArray(cell) && cell.length > 0) {
                            state.boardObjects[y][x] = cell;
                            const f = cell[0];
                            if (f) state.boardObjectAlign[y][x] = (f.alignX||'center')+','+(f.alignY||'bottom');
                        } else if (typeof cell === 'string') { state.boardObjects[y][x] = cell; }
                    }
                    delete window._prebuiltObjects;
                }

                _stampBuildingFootprints(w, h);

                if (_pb.voxels) {
                    state.boardVoxels = [];
                    for (let _vy = 0; _vy < h; _vy++) {
                        const _vRow = [];
                        for (let _vx = 0; _vx < w; _vx++) {
                            const _col = _pb.voxels[_vy]?.[_vx] || [];
                            _vRow.push(_col.map(_b => {
                                var entry = {
                                    z: _b.z,
                                    terrain: ME_TERRAIN_IDS[_b.tid] || 'grass'
                                };
                                if (_b.sd) entry.stairDir = _b.sd;
                                return entry;
                            }));
                        }
                        state.boardVoxels.push(_vRow);
                    }
                    fillVoxelsDown();
                    state._voxelVersion = (state._voxelVersion || 0) + 1;
                }

                /* Stamp monument collision into the voxel grid before columns build */
                _stampMonumentCollision();

                _initTowersFromObjects();
                _initNexusFromObjects();
                _autoPlaceNexusIfNeeded();

                /* Auto-generate spawn zones (replaces old sanctuary system) */
                autoGenerateSpawnZones();
                _autoPlaceTowersIfNeeded();

                /* Legacy sanctuary data — ignored at runtime */
                state.sanctuaries = {};
                if (_pb.sanctuaryZones) {
                    state.sanctuaryZoneMap = _pb.sanctuaryZones;
                }

                MAP_HAS_FLOORS = false;

                if (state.boardVoxels?.length) {
                    buildColumnsFromVoxels();
                } else {
                    buildColumnsFromLegacy();
                }
                return;
            }

            if (activeGameMode === 'huge') {
                state.boardTerrain = board;
                _initObjectGrid();
                _initHeightGrid();
                const cx = w / 2, cy = h / 2;
                const outerRx = 17, outerRy = 14;
                const eMidY = Math.floor(cy), eMidX = Math.floor(cx);

                const genders = Math.random() < 0.5 ? ['male', 'female'] : ['female', 'male'];
                const t1x = Math.floor(cx - outerRx + 2), t2x = Math.floor(cx + outerRx - 3);
                board[eMidY][t1x] = 'home_base';
                board[eMidY - 1][t1x] = 'home_base';
                board[eMidY][t2x] = 'home_base';
                board[eMidY - 1][t2x] = 'home_base';
                if (state.zoneMap) {
                    state.zoneMap[eMidY][t1x] = 'tower';
                    state.zoneMap[eMidY - 1][t1x] = 'tower';
                    state.zoneMap[eMidY][t2x] = 'tower';
                    state.zoneMap[eMidY - 1][t2x] = 'tower';
                }
                const earthStart = Math.ceil(cy - 6 + 1);
                const earthEnd = Math.floor(cy + 6 - 1);
                state.towers = {
                    1: {
                        x: t1x, y: eMidY,
                        homeBox: { x1: t1x, y1: eMidY - 1, x2: t1x + 1, y2: eMidY },
                        hp: _towerHp(), maxHp: _towerHp(), def: _towerDef(), owner: 1, gender: genders[0]
                    },
                    2: {
                        x: t2x, y: eMidY,
                        homeBox: { x1: t2x - 1, y1: eMidY - 1, x2: t2x, y2: eMidY },
                        hp: _towerHp(), maxHp: _towerHp(), def: _towerDef(), owner: 2, gender: genders[1]
                    }
                };

                const s1x = t1x + 1, s2x = t2x - 1;

                /* Legacy sanctuary placement removed — auto-generate spawn zones instead */
                state.sanctuaries = {};

                const _hugeMpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
                const _hugeShouldPlaceNexus = !_hugeMpMode || _hugeMpMode.hasNexus !== false;
                if (_hugeShouldPlaceNexus) {
                const nzHalf = Math.floor(NEXUS_ZONE_SIZE / 2);

                /* Diagonal nexus line: center zone always mid-map, one toward
                   the NW corner and one toward the SE corner (see the standard
                   generator path for rationale). */
                const _hugeStamp = (key, ax, ay) => {
                    ax = Math.max(1, Math.min(w - NEXUS_ZONE_SIZE - 1, ax));
                    ay = Math.max(1, Math.min(h - NEXUS_ZONE_SIZE - 1, ay));
                    for (let dy = 0; dy < NEXUS_ZONE_SIZE; dy++) {
                        for (let dx = 0; dx < NEXUS_ZONE_SIZE; dx++) {
                            const nx = ax + dx, ny = ay + dy;
                            if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
                                board[ny][nx] = 'nexus';
                                if (state.zoneMap) state.zoneMap[ny][nx] = 'nexus';
                            }
                        }
                    }
                    state.nexusPoints[key] = { zoneX: ax, zoneY: ay, zoneSize: NEXUS_ZONE_SIZE, owner: 0, progress: 0 };
                };

                state.nexusPoints = {};
                const gNexX = eMidX - nzHalf, gNexY = eMidY - nzHalf;
                _hugeStamp('earth', gNexX, gNexY);
                const _hugeOff = Math.floor(Math.min(w, h) / 4);
                if (_hugeOff >= NEXUS_ZONE_SIZE + 1) {
                    _hugeStamp('nw', gNexX - _hugeOff, gNexY - _hugeOff);
                    _hugeStamp('se', gNexX + _hugeOff, gNexY + _hugeOff);
                }
                } else {
                    state.nexusPoints = {};
                }

                /* Auto-generate spawn zones */
                autoGenerateSpawnZones();
                _autoPlaceTowersIfNeeded();

                buildColumnsFromLegacy();
                return;
            }

            const eStart = MAP_SECTIONS.earth.startRow;
            const eEnd = MAP_SECTIONS.earth.endRow;
            const earthH = eEnd - eStart + 1;

            if (MAP_HAS_FLOORS && MAP_SECTIONS.above && MAP_SECTIONS.below) {
                generateAboveTerrain(board, w, MAP_SECTIONS.above.startRow, MAP_SECTIONS.above.endRow);
                generateBelowTerrain(board, w, MAP_SECTIONS.below.startRow, MAP_SECTIONS.below.endRow);

                if (BARRIER_ROWS.length >= 2) {
                    const barrierRow1 = BARRIER_ROWS[0];
                    const barrierRow2 = BARRIER_ROWS[1];
                    for (let x = 0; x < w; x++) {
                        if (BARRIER_OPENINGS_X.includes(x)) {
                            board[barrierRow1][x] = 'barrier_passage';
                            board[barrierRow2][x] = 'barrier_passage';
                        } else {
                            board[barrierRow1][x] = 'cliff';
                            board[barrierRow2][x] = 'chasm';
                        }
                    }
                }
            }

            state.boardTerrain = board;
            _initObjectGrid();
            _initHeightGrid();

            const towers = placeTowers(board, w);
            state.towers = towers || { 1: null, 2: null };

            const earthMidY = eStart + Math.floor(earthH / 2);
            const mode = GAME_MODES[activeGameMode];

            /* Legacy sanctuary placement removed — auto-generate spawn zones after nexus */
            state.sanctuaries = {};

            const mpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
            const shouldPlaceNexus = !mpMode || mpMode.hasNexus !== false;
            const nzHalf = Math.floor(NEXUS_ZONE_SIZE / 2);
            const midX = Math.floor(w / 2);

            if (shouldPlaceNexus) {

            /* Nexus zones sit on a DIAGONAL line across the fully-3D board:
               one always dead-center, plus one toward each of two opposite
               corners (NW / SE) when the play band is big enough for three.
               The diagonal is 180°-rotation symmetric, so it's fair for
               mirrored left/right spawns. */
            const effectiveNexusSize = NEXUS_ZONE_SIZE;
            const bandH = eEnd - eStart + 1;
            const _stampZone = (key, ax, ay) => {
                ax = Math.max(1, Math.min(w - effectiveNexusSize - 1, ax));
                ay = Math.max(eStart + 1, Math.min(eEnd - effectiveNexusSize, ay));
                for (let dy = 0; dy < effectiveNexusSize; dy++) {
                    for (let dx = 0; dx < effectiveNexusSize; dx++) {
                        const nx = ax + dx, ny = ay + dy;
                        if (ny >= eStart && ny <= eEnd && nx >= 0 && nx < w) {
                            board[ny][nx] = 'nexus';
                        }
                    }
                }
                state.nexusPoints[key] = { zoneX: ax, zoneY: ay, zoneSize: effectiveNexusSize, owner: 0, progress: 0 };
            };

            state.nexusPoints = {};
            const gNexX = midX - Math.floor(effectiveNexusSize / 2);
            const gNexY = earthMidY - Math.floor(effectiveNexusSize / 2);
            _stampZone('earth', gNexX, gNexY);

            const diagOff = Math.floor(Math.min(w, bandH) / 4);
            if (diagOff >= effectiveNexusSize + 1) {
                _stampZone('nw', gNexX - diagOff, gNexY - diagOff);
                _stampZone('se', gNexX + diagOff, gNexY + diagOff);
            }
            } else {

                state.nexusPoints = {};
            }

            if (w >= 8) {
                const springY = eStart + 1;
                const springX1 = Math.max(2, Math.floor(w * 0.2));
                const springX2 = w - 1 - springX1;
                if (springX1 < w && springY <= eEnd && board[springY][springX1] === 'grass') board[springY][springX1] = 'healing_spring';
                if (springX2 >= 0 && springY <= eEnd && board[springY][springX2] === 'grass') board[springY][springX2] = 'healing_spring';
            }

            [state.sanctuaries[1], state.sanctuaries[2]].forEach(s => {
                if (!s) return;
                for (const [sx, sy] of [[s.churchX, s.churchY], [s.shopX, s.shopY]]) {
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nx = sx + dx, ny = sy + dy;
                            if (nx < 0 || ny < 0 || ny >= h || nx >= w) continue;
                            if (isBarrierRow(ny)) continue;
                            const t = board[ny][nx];
                            const rule = TERRAIN_RULES[t];
                            if (rule && rule.passable === false && !rule.isTower && !rule.isNexus && !rule.isBarrier && !rule.isVoid) {
                                board[ny][nx] = 'grass';
                            }
                        }
                    }
                }
            });

            /* Auto-generate spawn zones */
            autoGenerateSpawnZones();
            /* Tower placement must happen after zones exist so towers avoid zone tiles */
            if (!state.towers || (!state.towers[1] && !state.towers[2])) {
                _autoPlaceTowersIfNeeded();
            }

            buildColumnsFromLegacy();
        }

        function getUnitVisionRange(unit) {

            const eAwr = getEffectiveAwr(unit);
            const base = (unit.inspect || 1) + Math.floor(eAwr / 3) + 1;
            let bonus = 0;

            if (getTerrainAt(unit.x, unit.y) === 'mountain') bonus += 1;

            const _visObj = (typeof getObjectAt === 'function') ? getObjectAt(unit.x, unit.y) : null;
            if (getTerrainAt(unit.x, unit.y) === 'mountain_top' || _visObj === 'mountain_top') bonus += 1;

            if (getTerrainAt(unit.x, unit.y) === 'crystal') bonus += 1;

            if (getTerrainAt(unit.x, unit.y) === 'sky_ruin') bonus += 1;

            if (unit.z > 0 && typeof getUnitStandingHeight === 'function') {
                bonus += Math.floor(getUnitStandingHeight(unit) / 2);
            }

            if (unitHasBinoculars(unit)) bonus += 2;

            bonus += getSectionBuffs(unit).vision;

            if (getTerrainAt(unit.x, unit.y) === 'cloud_thick') bonus -= 1;
            return Math.max(2, base + bonus);
        }

        function isVisionBlockedByTerrain(x1, y1, x2, y2, sourceZ) {
            // Diagonal neighbours are point-blank too (CHEBYSHEV) — you can always
            // see the tile right beside you, diagonal or cardinal, so neither is
            // ever vision-blocked by terrain.
            const d = Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
            if (d <= 1) return false;

            if (sourceZ != null && state.boardColumns?.length > 0) {
                const tz = _inferStandingZ(x2, y2);
                return _isRayBlocked3D(x1, y1, sourceZ, x2, y2, tz, true);
            }
            return isRangeBlockedByTerrain(x1, y1, x2, y2, null, null, true);
        }

        function isInVision(unit, tx, ty) {
            if (!unit || !state.fogOfWar) return true;

            /* ── Smoke concealment: enemy smoke zones block vision unless adjacent ── */
            if (state._activeZones?.length) {
                const player = unit.player;
                for (const zone of state._activeZones) {
                    if (!zone.smokeConcealment || zone.ownerPlayer === player) continue;
                    const r = zone.radius || 1;
                    if (Math.abs(tx - zone.x) <= r && Math.abs(ty - zone.y) <= r) {
                        /* Target tile is in enemy smoke — only visible if a friendly is adjacent */
                        const friendlies = state.units.filter(u => !u.dead && u.player === player);
                        let adj = false;
                        for (const f of friendlies) {
                            if (Math.abs(f.x - tx) + Math.abs(f.y - ty) <= 1) { adj = true; break; }
                        }
                        if (!adj) return false;
                    }
                }
            }

            const vr = getUnitVisionRange(unit);
            const uz = unit.z ?? null;
            if ((LOS_ONLY_VISION || (Math.abs(unit.x - tx) + Math.abs(unit.y - ty)) <= vr) && (unit.wallVision || !isVisionBlockedByTerrain(unit.x, unit.y, tx, ty, uz))) return true;

            if (state.teamVision) {
                const allies = state.units.filter(u => !u.dead && u.player === unit.player && u.id !== unit.id);
                for (const ally of allies) {
                    const avr = getUnitVisionRange(ally);
                    if ((LOS_ONLY_VISION || (Math.abs(ally.x - tx) + Math.abs(ally.y - ty)) <= avr) && (ally.wallVision || !isVisionBlockedByTerrain(ally.x, ally.y, tx, ty, ally.z ?? null))) return true;
                }
            }

            if (!state.teamVision && unitHasWalkieTalkie(unit)) {

                const allies = state.units.filter(u => !u.dead && u.player === unit.player && u.id !== unit.id && unitHasWalkieTalkie(u));
                for (const ally of allies) {
                    const avr = getUnitVisionRange(ally);
                    if ((LOS_ONLY_VISION || (Math.abs(ally.x - tx) + Math.abs(ally.y - ty)) <= avr) && (ally.wallVision || !isVisionBlockedByTerrain(ally.x, ally.y, tx, ty, ally.z ?? null))) return true;
                }
            }

            if (state.wards) {
                for (const w of state.wards) {
                    if (w.owner === unit.player) {
                        const wr = w.visionRange || 3;
                        if ((Math.abs(w.x - tx) + Math.abs(w.y - ty)) <= wr && !isVisionBlockedByTerrain(w.x, w.y, tx, ty)) return true;
                    }
                }
            }

            if (state.towers) {
                const tower = state.towers[unit.player];
                if (tower && tower.hp > 0) {
                    if ((Math.abs(tower.x - tx) + Math.abs(tower.y - ty)) <= TOWER_VISION_RANGE && !isVisionBlockedByTerrain(tower.x, tower.y, tx, ty)) return true;
                }
            }

            if (state._flairRevealTiles?.[unit.player]?.has(posKey(tx, ty))) return true;

            if (state._fogRevealTiles?.has(posKey(tx, ty))) return true;
            return false;
        }

        function getTelescopeSkyTargets(player) {
            const result = new Map();

            const telescopers = state.units.filter(u => !u.dead && u.player === player && getSectionForUnit(u) === 'earth' && unitHasTelescope(u));
            if (telescopers.length === 0) return result;

            const skyEnemies = state.units.filter(u => !u.dead && u.player !== player && getSectionForUnit(u) === 'above');
            for (const enemy of skyEnemies) {
                for (const tele of telescopers) {
                    const vr = getUnitVisionRange(tele);
                    if ((Math.abs(tele.x - enemy.x) + Math.abs(tele.y - enemy.y)) <= vr) {
                        result.set(posKey(enemy.x, enemy.y), enemy);
                        break;
                    }
                }
            }
            return result;
        }

        function computeVisibleTiles(player) {

            const visible = new Set();
            const size = bw(), sizeH = bh();

            function addVisibleFrom(sx, sy, visionRange, sourceZ, wallVision, losOnly) {
                /* losOnly (units): sweep the WHOLE board and let line-of-sight
                   decide — distance no longer limits a unit's vision. Otherwise
                   (wards/towers) keep the bounded Manhattan-range box. */
                const x0 = losOnly ? 0 : Math.max(0, sx - visionRange);
                const x1 = losOnly ? size - 1 : Math.min(size - 1, sx + visionRange);
                const y0 = losOnly ? 0 : Math.max(0, sy - visionRange);
                const y1 = losOnly ? sizeH - 1 : Math.min(sizeH - 1, sy + visionRange);
                for (let ty = y0; ty <= y1; ty++) {
                    for (let tx = x0; tx <= x1; tx++) {
                        if (!losOnly && (Math.abs(tx - sx) + Math.abs(ty - sy)) > visionRange) continue;
                        if (wallVision || !isVisionBlockedByTerrain(sx, sy, tx, ty, sourceZ)) {
                            visible.add(posKey(tx, ty));
                        }
                    }
                }
            }

            const isAlive = u => !u.dead && u.player === player;

            if (state.squadLeaderMode && player === 1 && !state.teamVision) {
                const leader = state.squadLeaderUnitId ? state.units.find(u => u.id === state.squadLeaderUnitId && isAlive(u)) : null;
                if (leader) {
                    addVisibleFrom(leader.x, leader.y, getUnitVisionRange(leader), leader.z ?? null, leader.wallVision, LOS_ONLY_VISION);
                    if (state._fogRevealTiles) {
                        for (const pk of state._fogRevealTiles) visible.add(pk);
                    }
                    if (unitHasWalkieTalkie(leader)) {
                        const allies = state.units.filter(u => isAlive(u) && u.id !== leader.id && unitHasWalkieTalkie(u));
                        for (const ally of allies) {
                            addVisibleFrom(ally.x, ally.y, getUnitVisionRange(ally), ally.z ?? null, ally.wallVision, LOS_ONLY_VISION);
                        }
                    }
                    return visible;
                }
            }

            if (state.teamVision) {
                const allies = state.units.filter(isAlive);
                for (const ally of allies) {
                    addVisibleFrom(ally.x, ally.y, getUnitVisionRange(ally), ally.z ?? null, ally.wallVision, LOS_ONLY_VISION);
                }
            } else {
                let unit;
                const isEnemyTurn = state.activePlayer !== player;
                if (isEnemyTurn) {
                    const anchorId = state._fogAnchorUnitId;
                    unit = anchorId ? state.units.find(u => u.id === anchorId && isAlive(u)) : null;
                    if (!unit) unit = state.units.find(u => isAlive(u));
                } else if (state.autoPlayers?.[player]) {
                    unit = getFocusedUnit();
                    if (!unit || unit.dead || unit.player !== player) {
                        unit = state.units.find(u => isAlive(u));
                    }
                } else {
                    unit = getSelectedUnit();
                    if (!unit || unit.dead || unit.player !== player) {
                        unit = state.units.find(u => isAlive(u));
                    }
                }
                if (!unit) return visible;
                addVisibleFrom(unit.x, unit.y, getUnitVisionRange(unit), unit.z ?? null, unit.wallVision, LOS_ONLY_VISION);
            }

            if (state._fogRevealTiles) {
                for (const pk of state._fogRevealTiles) visible.add(pk);
            }
            if (state._visionWards?.length) {
                for (const ward of state._visionWards) {
                    if (ward.player !== player) continue;
                    for (const pk of ward.tiles) visible.add(pk);
                }
            }
            if (!state.teamVision) {
                const selectedUnit = getSelectedUnit() || state.units.find(isAlive);
                if (selectedUnit && unitHasWalkieTalkie(selectedUnit)) {
                    const allies = state.units.filter(u => isAlive(u) && u.id !== selectedUnit.id && unitHasWalkieTalkie(u));
                    for (const ally of allies) {
                        addVisibleFrom(ally.x, ally.y, getUnitVisionRange(ally), ally.z ?? null, ally.wallVision, LOS_ONLY_VISION);
                    }
                }
            }
            if (state.wards) {
                for (const w of state.wards) {
                    if (w.owner === player) {
                        addVisibleFrom(w.x, w.y, w.visionRange || 3);
                    }
                }
            }

            if (state.towers) {
                const tower = state.towers[player];
                if (tower && tower.hp > 0) {
                    addVisibleFrom(tower.x, tower.y, TOWER_VISION_RANGE);
                }
            }
            if (state._flairRevealTiles?.[player]) {
                for (const pk of state._flairRevealTiles[player]) visible.add(pk);
            }

            /* ── Smoke concealment: remove tiles inside enemy smoke zones ── */
            if (state._activeZones?.length) {
                const smokeZones = state._activeZones.filter(z => z.smokeConcealment && z.ownerPlayer !== player);
                if (smokeZones.length > 0) {
                    const friendlies = state.units.filter(u => !u.dead && u.player === player);
                    for (const zone of smokeZones) {
                        const r = zone.radius || 1;
                        for (let dy = -r; dy <= r; dy++) {
                            for (let dx = -r; dx <= r; dx++) {
                                const sx = zone.x + dx, sy = zone.y + dy;
                                if (sx < 0 || sy < 0 || sx >= size || sy >= sizeH) continue;
                                const spk = sx + ',' + sy;
                                if (!visible.has(spk)) continue;
                                /* Keep visible if a friendly is adjacent (dist ≤ 1) to the smoke tile */
                                let adjacentFriendly = false;
                                for (const f of friendlies) {
                                    if (Math.abs(f.x - sx) + Math.abs(f.y - sy) <= 1) {
                                        adjacentFriendly = true;
                                        break;
                                    }
                                }
                                if (!adjacentFriendly) visible.delete(spk);
                            }
                        }
                    }
                }
            }

            return visible;
        }

        function unitHasClimbingBoots(unit) {
            return unit?.equipment?.boots === 'climbing_boots';
        }

        function unitHasSnorkel(unit) {
            return unit?.equipment?.head === 'snorkel';
        }

        function unitIsDeepWaterAdapted(unit) {
            return !!unit && (unit?.terrainPreference === 'deep_water' || unitHasSnorkel(unit) || unit?.cls === 'Raider' || unit?.race === 'siren' || unit?.race === 'reptilian' || unit?.race === 'ghost' || unit?.race === 'atlantean' || unit?.race === 'kraken' || unit?.race === 'loch ness monster');
        }

        function unitIsLavaAdapted(unit) {
            if (!unit) return false;
            const r = unit.race;
            return r === 'demon' || r === 'djinn' || r === 'succubus' || r === 'skeleton' || r === 'dragon';
        }

        function unitIsPoisonTerrainImmune(unit) {
            if (!unit) return false;
            const r = unit.race;
            return r === 'zombie' || r === 'skeleton' || r === 'robot' || r === 'mech' || r === 'android' || r === 'ai'
                || r === 'shadow entity' || r === 'scarecrow' || r === 'ghost' || r === 'glitch' || r === 'ghoul';
        }

        function unitIsDesertAdapted(unit) {
            if (!unit) return false;
            const r = unit.race;
            return r === 'anubis' || r === 'djinn' || r === 'reptilian' || r === 'skeleton';
        }

        function unitIsForestAdapted(unit) {
            if (!unit) return false;
            const r = unit.race;
            return r === 'bigfoot' || r === 'fairy' || r === 'werewolf' || r === 'shadow entity'
                || r === 'skinwalker' || r === 'catgirl' || r === 'mothman' || r === 'scarecrow'
                || r === 'dinosaur';
        }

        function unitIsMountainTraverser(unit) {
            if (!unit) return false;
            const r = unit.race;
            return r === 'giant' || r === 'cyclops' || r === 'gargoyle' || r === 'gnome' || r === 'yeti' || r === 'dragon' || r === 'kaiju';
        }

        function unitIsIceStable(unit) {
            if (!unit) return false;
            const r = unit.race;
            return r === 'giant' || r === 'gargoyle' || r === 'robot' || r === 'mech' || r === 'yeti' || r === 'kaiju';
        }

        function unitIsScorchedImmune(unit) {
            if (!unit) return false;
            const r = unit.race;
            return r === 'demon' || r === 'djinn' || r === 'succubus' || r === 'skeleton' || r === 'dragon';
        }

        function unitIsWastelandAdapted(unit) {
            if (!unit) return false;
            const r = unit.race;
            return r === 'zombie' || r === 'skeleton' || r === 'robot' || r === 'mech' || r === 'android' || r === 'ai' || r === 'glitch' || r === 'kaiju';
        }

        function unitHasBinoculars(unit) {
            return unit?.equipment?.accessory1 === 'binoculars' || unit?.equipment?.accessory2 === 'binoculars';
        }

        function unitHasWalkieTalkie(unit) {
            return unit?.equipment?.accessory1 === 'walkie_talkie' || unit?.equipment?.accessory2 === 'walkie_talkie';
        }

        function unitHasFlair(unit) {
            return unit?.equipment?.accessory1 === 'flair' || unit?.equipment?.accessory2 === 'flair';
        }

        function unitHasWard(unit) {
            return unit?.equipment?.accessory1 === 'ward' || unit?.equipment?.accessory2 === 'ward';
        }

        function unitHasTelescope(unit) {
            return unit?.equipment?.accessory1 === 'telescope' || unit?.equipment?.accessory2 === 'telescope';
        }

        // Generic accessory check — new held-item hooks should use this instead
        // of adding one more unitHasX helper per accessory.
        function unitHasAccessory(unit, accessoryId) {
            return unit?.equipment?.accessory1 === accessoryId || unit?.equipment?.accessory2 === accessoryId;
        }

        function removeAccessoryFromUnit(unit, accessoryId) {
            if (!unit?.equipment) return;
            if (unit.equipment.accessory1 === accessoryId) {
                unit.equipment.accessory1 = null;
                return;
            }
            if (unit.equipment.accessory2 === accessoryId) {
                unit.equipment.accessory2 = null;
                return;
            }
        }

        function unitCanTraverse(unit, x, y, z) {

            const _has3D = typeof getColumn === 'function' && state.boardColumns?.length > 0;
            const terrain = (_has3D && z !== undefined && z !== null)
                ? (typeof getTerrainAt3D === 'function' ? getTerrainAt3D(x, y, z) : getTerrainAt(x, y))
                : getTerrainAt(x, y);

            const tOwner = isTowerTile(x, y);
            if (tOwner) {
                if (unit && tOwner === unit.player) return true;
                return false;
            }

            if (terrain === 'tower_base') {
                return false;
            }

            if (state.turrets && state.turrets.length) {
                for (const t of state.turrets) {
                    if (t.x === x && t.y === y && t.hp > 0) {
                        const tz = (t.z !== undefined && t.z !== null) ? t.z
                            : ((typeof getBaseHeightAt === 'function') ? getBaseHeightAt(x, y) : 0);
                        // Flyers may pass above the turret; everyone else is blocked.
                        if (_has3D && z !== undefined && z !== null && z > tz + 1) continue;
                        return false;
                    }
                }
            }

            const _ovrObj = (typeof getObjectAt === 'function') ? getObjectAt(x, y) : null;
            if (_ovrObj) {
                const _ovrRule = getObjectRule(_ovrObj);
                if (_ovrRule && _ovrRule.overridesGround && _ovrRule.passable !== false) return true;
            }

            if (terrain === 'sky_open') return canFly(unit);

            if (terrain === 'chasm' || terrain === 'void' || terrain === 'cloud_gap') {
                return canFly(unit);
            }

            // Mountains are passable (moveCost: 2 in TERRAIN_RULES).
            // Climbing boots / mountain traverser / flying reduce the cost in getTerrainMoveCost.

            if (_has3D && z !== undefined && z !== null) {
                const block = getBlockAt(x, y, z);
                if (block) {
                    const rule = getTerrainRule(block.terrain);
                    if (rule.passable === false) return false;
                }
                // Impassable objects (trees, boulders, ...) block the column up
                // to their top; flyers above the object may still pass.
                if (_ovrObj) {
                    const _objRule3d = getObjectRule(_ovrObj);
                    if (_objRule3d && _objRule3d.passable === false) {
                        const _gz = (typeof getBaseHeightAt === 'function') ? getBaseHeightAt(x, y) : 0;
                        if (z <= _gz + (_objRule3d.gameHeight || 1)) return false;
                    }
                }
                return true;
            }
            if (isTerrainPassable(x, y)) return true;
            return false;
        }

        function isOnMountain(unit) {
            return unit && getTerrainAt(unit.x, unit.y) === 'mountain';
        }

        function getCurrentCyclePhase() {
            if (!state.round || state.phase !== 'battle') return 'day';
            return state.round % 2 === 1 ? 'day' : 'night';
        }

        function getTerrainHealMultiplier(x, y, unit) {
            const terrain = getTerrainAt(x, y);
            let baseMult = getTerrainRule(terrain).healMultiplier || 1;

            const obj = getObjectAt(x, y);
            if (obj) {
                const oRule = getObjectRule(obj);

                if (oRule && oRule.overridesGround) return oRule.healMultiplier || 1;
                if (oRule && oRule.healMultiplier && oRule.healMultiplier !== 1) {
                    baseMult = Math.max(baseMult, oRule.healMultiplier);
                }
            }

            if (terrain === 'desert' && baseMult < 1 && unit && unitIsDesertAdapted(unit)) {
                return 1;
            }

            if (terrain === 'wasteland' && baseMult < 1 && unit && unitIsWastelandAdapted(unit)) {
                return 1;
            }

            if (terrain === 'lava' && baseMult < 1 && unit && unitIsLavaAdapted(unit)) {
                return 1;
            }
            return baseMult;
        }

        function coordLabel(x, y) {
            return `${String.fromCharCode(65 + x)}${y + 1}`;
        }

        function enemyOf(player) {
            return player === 1 ? 2 : 1;
        }

        function generateHugeMap() {
            const w = bw(), h = bh();
            const board = Array.from({ length: h }, () => Array(w).fill('void'));
            const zoneMap = Array.from({ length: h }, () => Array(w).fill('void'));

            const cx = w / 2;
            const cy = h / 2;
            const outerRx = 17;
            const outerRy = 14;
            const earthRx = 9;
            const earthRy = 6;
            const borderInnerRx = earthRx + 0.8;
            const borderInnerRy = earthRy + 0.8;
            const borderOuterRx = earthRx + 2.2;
            const borderOuterRy = earthRy + 2.2;

            function inEllipse(tx, ty, erx, ery) {
                const dx = (tx - cx) / erx;
                const dy = (ty - cy) / ery;
                return dx * dx + dy * dy <= 1.0;
            }
            function ellipseDist(tx, ty, erx, ery) {
                const dx = (tx - cx) / erx;
                const dy = (ty - cy) / ery;
                return dx * dx + dy * dy;
            }

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const tx = x + 0.5, ty = y + 0.5;
                    if (!inEllipse(tx, ty, outerRx, outerRy)) continue;

                    const isEarth = inEllipse(tx, ty, earthRx, earthRy);
                    const inBorderInner = inEllipse(tx, ty, borderInnerRx, borderInnerRy);
                    const inBorderOuter = inEllipse(tx, ty, borderOuterRx, borderOuterRy);
                    const angle = Math.atan2(ty - cy, tx - cx);
                    const absDeg = Math.abs(angle * 180 / Math.PI);

                    if (isEarth) {
                        board[y][x] = 'grass';
                        zoneMap[y][x] = 'earth';
                    } else if (inBorderInner || inBorderOuter) {

                        if (angle < 0) {
                            board[y][x] = inBorderInner ? 'water' : 'deep_water';
                            zoneMap[y][x] = 'water_border';
                        } else {
                            board[y][x] = 'lava';
                            zoneMap[y][x] = 'lava_border';
                        }
                    } else {

                        if (absDeg < 20 || absDeg > 160) {
                            board[y][x] = 'sanctuary';
                            zoneMap[y][x] = 'sanctuary';
                        } else if (angle < 0) {
                            board[y][x] = 'cloud';
                            zoneMap[y][x] = 'above';
                        } else {
                            board[y][x] = 'cave_floor';
                            zoneMap[y][x] = 'below';
                        }
                    }
                }
            }

            const stairDefs = [
                { deg: -60,  earthT: 'beanstalk',     outerT: 'beanstalk_top' },
                { deg: -90,  earthT: 'beanstalk',     outerT: 'beanstalk_top' },
                { deg: -120, earthT: 'beanstalk',     outerT: 'beanstalk_top' },
                { deg: 60,   earthT: 'cave_entrance', outerT: 'ladder_up' },
                { deg: 90,   earthT: 'cave_entrance', outerT: 'ladder_up' },
                { deg: 120,  earthT: 'cave_entrance', outerT: 'ladder_up' },
            ];
            for (const sd of stairDefs) {
                const rad = sd.deg * Math.PI / 180;

                const ex = Math.round(cx + Math.cos(rad) * (earthRx - 1));
                const ey = Math.round(cy + Math.sin(rad) * (earthRy - 1));
                if (ex >= 0 && ex < w && ey >= 0 && ey < h) {
                    board[ey][ex] = sd.earthT;
                    zoneMap[ey][ex] = 'earth';
                }

                for (let r = 0; r < 3; r++) {
                    const bDistX = earthRx + 0.3 + r * 0.7;
                    const bDistY = earthRy + 0.3 + r * 0.7;
                    const bx = Math.round(cx + Math.cos(rad) * bDistX);
                    const by = Math.round(cy + Math.sin(rad) * bDistY);
                    if (bx >= 0 && bx < w && by >= 0 && by < h) {
                        board[by][bx] = 'bridge';
                        zoneMap[by][bx] = 'passage';
                    }
                }

                const ox = Math.round(cx + Math.cos(rad) * (borderOuterRx + 0.5));
                const oy = Math.round(cy + Math.sin(rad) * (borderOuterRy + 0.5));
                if (ox >= 0 && ox < w && oy >= 0 && oy < h) {
                    board[oy][ox] = sd.outerT;

                }
            }

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    if (zoneMap[y][x] !== 'above') continue;
                    const tx = x + 0.5, ty = y + 0.5;
                    const d = ellipseDist(tx, ty, outerRx, outerRy);
                    if (d > 0.90) board[y][x] = 'cloud_gap';
                    else if (d > 0.80) board[y][x] = 'cloud_thick';
                }
            }

            const midXI = Math.floor(cx);
            const skyFeatures = [
                { x: midXI, y: 2, t: 'cloud', obj: 'mountain_top' },
                { x: midXI - 4, y: 3, t: 'tree_top' },
                { x: midXI + 4, y: 3, t: 'tree_top' },
                { x: midXI - 7, y: 5, t: 'cloud', obj: 'mountain_top' },
                { x: midXI + 7, y: 5, t: 'cloud', obj: 'mountain_top' },
                { x: midXI - 2, y: 4, t: 'sky_open' },
                { x: midXI + 2, y: 4, t: 'sky_open' },
                { x: midXI - 5, y: 6, t: 'cloud_thick' },
                { x: midXI + 5, y: 6, t: 'cloud_thick' },
            ];
            for (const f of skyFeatures) {
                if (f.x >= 0 && f.x < w && f.y >= 0 && f.y < h && zoneMap[f.y][f.x] === 'above') {
                    board[f.y][f.x] = f.t;
                    if (f.obj) state.boardObjects[f.y][f.x] = f.obj;
                }
            }

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    if (zoneMap[y][x] !== 'below') continue;
                    const tx = x + 0.5, ty = y + 0.5;
                    const d = ellipseDist(tx, ty, outerRx, outerRy);
                    if (d > 0.90) { board[y][x] = 'void'; zoneMap[y][x] = 'void'; }
                    else if (d > 0.80) board[y][x] = 'cave_wall';
                    else if (board[y][x] === 'cave_floor' && Math.random() < 0.04) board[y][x] = 'lava';
                    else if (board[y][x] === 'cave_floor' && Math.random() < 0.03) board[y][x] = 'obsidian';
                }
            }
            const ugFeatures = [
                { x: midXI, y: h - 3, t: 'healing_spring' },
                { x: midXI - 5, y: h - 4, t: 'crystal' },
                { x: midXI + 5, y: h - 4, t: 'crystal' },
                { x: midXI - 3, y: h - 5, t: 'mushroom' },
                { x: midXI + 3, y: h - 5, t: 'mushroom' },
                { x: midXI - 8, y: h - 4, t: 'cave_wall' },
                { x: midXI + 8, y: h - 4, t: 'cave_wall' },
            ];
            for (const f of ugFeatures) {
                if (f.x >= 0 && f.x < w && f.y >= 0 && f.y < h && zoneMap[f.y][f.x] === 'below') {
                    board[f.y][f.x] = f.t;
                }
            }

            const eMidY = Math.floor(cy);
            const eMidX = Math.floor(cx);

            for (let y = 0; y < h; y++) {
                if (zoneMap[y][eMidX] === 'earth') board[y][eMidX] = 'water';
            }

            const earthTopRow = Math.ceil(cy - earthRy + 1.5);
            const earthBotRow = Math.floor(cy + earthRy - 1.5);
            for (const by of [earthTopRow + 1, eMidY, earthBotRow - 1]) {
                if (by >= 0 && by < h && zoneMap[by][eMidX] === 'earth') {
                    board[by][eMidX] = 'bridge';
                }
            }

            for (let x = 0; x < w; x++) {
                if (board[eMidY][x] === 'grass') board[eMidY][x] = 'road';
            }

            const mtnClusters = [
                { cx: eMidX - 5, cy: eMidY - 4, r: 2 },
                { cx: eMidX + 5, cy: eMidY - 4, r: 2 },
                { cx: eMidX - 5, cy: eMidY + 4, r: 2 },
                { cx: eMidX + 5, cy: eMidY + 4, r: 2 },
            ];
            for (const mc of mtnClusters) {
                for (let dy = -mc.r; dy <= mc.r; dy++) {
                    for (let dx = -mc.r; dx <= mc.r; dx++) {
                        if (Math.abs(dx) + Math.abs(dy) > mc.r + 1) continue;
                        const mx = mc.cx + dx, my = mc.cy + dy;
                        if (mx >= 0 && mx < w && my >= 0 && my < h && board[my][mx] === 'grass') {
                            board[my][mx] = 'mountain';
                        }
                    }
                }
            }

            const forestClusters = [
                { cx: eMidX - 3, cy: eMidY - 2, r: 1 },
                { cx: eMidX + 3, cy: eMidY - 2, r: 1 },
                { cx: eMidX - 3, cy: eMidY + 3, r: 1 },
                { cx: eMidX + 3, cy: eMidY + 3, r: 1 },
                { cx: eMidX - 7, cy: eMidY, r: 1 },
                { cx: eMidX + 7, cy: eMidY, r: 1 },
            ];
            for (const fc of forestClusters) {
                for (let dy = -fc.r; dy <= fc.r; dy++) {
                    for (let dx = -fc.r; dx <= fc.r; dx++) {
                        const fx = fc.cx + dx, fy = fc.cy + dy;
                        if (fx >= 0 && fx < w && fy >= 0 && fy < h && board[fy][fx] === 'grass') {
                            board[fy][fx] = 'tree';
                        }
                    }
                }
            }

            for (const dc of [{ cx: eMidX - 6, cy: eMidY + 1 }, { cx: eMidX + 6, cy: eMidY - 1 }]) {
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const fx = dc.cx + dx, fy = dc.cy + dy;
                        if (fx >= 0 && fx < w && fy >= 0 && fy < h && board[fy][fx] === 'grass') {
                            board[fy][fx] = 'desert';
                        }
                    }
                }
            }

            const sprX1 = eMidX - 4, sprX2 = eMidX + 4;
            if (board[eMidY - 3]?.[sprX1] === 'grass') board[eMidY - 3][sprX1] = 'healing_spring';
            if (board[eMidY + 3]?.[sprX2] === 'grass') board[eMidY + 3][sprX2] = 'healing_spring';

            const ruinSpots = [
                { x: eMidX - 3, y: eMidY - 1 }, { x: eMidX + 3, y: eMidY - 1 },
                { x: eMidX - 3, y: eMidY + 2 }, { x: eMidX + 3, y: eMidY + 2 },
            ];
            for (const rp of ruinSpots) {
                if (rp.x >= 0 && rp.x < w && rp.y >= 0 && rp.y < h && board[rp.y][rp.x] === 'grass') {
                    board[rp.y][rp.x] = 'ruins';
                }
            }

            state.zoneMap = zoneMap;
            return board;
        }

        function generateTerrainBoard() {

            if (window._customEditorBoard) {
                const board = window._customEditorBoard;
                window._customEditorBoard = null;
                return board;
            }

            if (typeof PREBUILT_MAPS !== 'undefined' && PREBUILT_MAPS[activeGameMode]) {
                const pb = PREBUILT_MAPS[activeGameMode];
                const board = [];
                for (let y = 0; y < pb.h; y++) {
                    const row = [];
                    for (let x = 0; x < pb.w; x++) {
                        const tid = pb.grid[y]?.[x] || 0;
                        row.push(tid === 0 ? 'blank' : (ME_TERRAIN_IDS[tid] || 'grass'));
                    }
                    board.push(row);
                }

                const objBoard = [];
                for (let y = 0; y < pb.h; y++) {
                    const row = [];
                    for (let x = 0; x < pb.w; x++) {
                        const stk = Array.isArray(pb.objects[y]?.[x]) ? pb.objects[y][x] : [];
                        if (!stk.length) { row.push(null); continue; }
                        row.push(stk.map(e => {
                            const o = {
                                key: ME_OBJECT_IDS[e.oid] || null,
                                alignX: e.alignX || 'center',
                                alignY: e.alignY || 'bottom',
                                rot: e.rot || 0,
                                flipX: !!e.flipX,
                                flipY: !!e.flipY
                            };
                            /* Preserve the per-placement texture variant (tree leaves
                               / rock texture) authored into the prebuilt map. */
                            if (e.leaf) o.leaf = e.leaf;
                            return o;
                        }).filter(e => e.key));
                    }
                    objBoard.push(row);
                }
                /* ── Convert forest/forest_2/tree terrain → grass + 3D tree object ── */
                const _FOREST_TERRAINS = { forest: true, forest_2: true, tree: true };
                const _TREE_VARIANTS_KEYS = ['tree','tree_2','tree_3','tree_4','tree_5','tree_6'];
                for (let y = 0; y < pb.h; y++) {
                    for (let x = 0; x < pb.w; x++) {
                        if (_FOREST_TERRAINS[board[y][x]]) {
                            board[y][x] = 'grass';
                            /* only add tree object if cell has no existing object */
                            const existing = objBoard[y]?.[x];
                            if (!existing || (Array.isArray(existing) && existing.length === 0)) {
                                const treeKey = _TREE_VARIANTS_KEYS[((x * 7 + y * 13) & 0x7fffffff) % _TREE_VARIANTS_KEYS.length];
                                objBoard[y][x] = [{ key: treeKey, alignX: 'center', alignY: 'bottom', rot: 0, flipX: false, flipY: false }];
                            }
                        }
                    }
                }
                window._prebuiltObjects = objBoard;
                return board;
            }

            if (activeGameMode === 'huge') return generateHugeMap();
            const w = bw(),
                h = bh();
            const board = Array.from({
                length: h
            }, () => Array.from({
                length: w
            }, () => 'grass'));
            const reserved = new Set();
            const eStart = MAP_SECTIONS.earth.startRow;
            const eEnd = MAP_SECTIONS.earth.endRow;
            const earthH = eEnd - eStart + 1;
            const midX = Math.floor(w / 2);

            Object.values(SPAWNS).flat().forEach(pos => {
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const rx = pos.x + dx, ry = pos.y + dy;
                        if (rx >= 0 && ry >= 0 && rx < w && ry < h) reserved.add(posKey(rx, ry));
                    }
                }
            });

            const earthMidY = eStart + Math.floor(earthH / 2);
            const _nzHalf = Math.floor(NEXUS_ZONE_SIZE / 2);
            for (let dy = -_nzHalf - 1; dy <= _nzHalf + NEXUS_ZONE_SIZE - _nzHalf; dy++) {
                for (let dx = -_nzHalf - 1; dx <= _nzHalf + NEXUS_ZONE_SIZE - _nzHalf; dx++) {
                    const rx = midX + dx, ry = earthMidY + dy;
                    if (rx >= 0 && ry >= 0 && rx < w && ry < h) reserved.add(posKey(rx, ry));
                }
            }

            const mode = GAME_MODES[activeGameMode];
            if (mode && mode.hasTowers !== false) {
                const boxTopY = Math.max(eStart, earthMidY - 1);
                const reserveCols = Math.min(2, Math.floor(w / 4));
                for (let dy = boxTopY - 1; dy <= boxTopY + 2; dy++) {
                    if (dy < eStart || dy > eEnd) continue;
                    for (let dx = 0; dx <= reserveCols; dx++) {
                        reserved.add(posKey(dx, dy));
                        reserved.add(posKey(w - 1 - dx, dy));
                    }
                }
            }

            if (w <= 4) {

                if (earthH >= 4) {
                    const ty = eStart + 1;
                    if (!reserved.has(posKey(midX, ty))) {
                        board[ty][midX] = 'grass';
                        state.boardObjects[ty][midX] = 'tree';
                    }
                }

                for (const pos of reserved) {
                    const [x, y] = pos.split(',').map(Number);
                    if (y >= eStart && y <= eEnd && x >= 0 && x < w) board[y][x] = 'grass';
                }
                return board;
            }

            if (w >= 6) {
                const riverX1 = midX - 1, riverX2 = midX;
                for (let y = eStart; y <= eEnd; y++) {
                    board[y][riverX1] = 'water';
                    board[y][riverX2] = 'water';
                }

                for (let y = eStart + 1; y <= eEnd - 1; y++) {
                    if (y !== earthMidY) {
                        board[y][riverX1] = 'deep_water';
                        board[y][riverX2] = 'deep_water';
                    }
                }

                const bridgeSpacing = Math.max(1, Math.floor(earthH / 3));
                const bridgeRows = [earthMidY];
                if (earthH >= 5) {
                    bridgeRows.push(earthMidY - bridgeSpacing);
                    bridgeRows.push(earthMidY + bridgeSpacing);
                }
                for (const by of bridgeRows) {
                    if (by >= eStart && by <= eEnd) {
                        board[by][riverX1] = 'bridge';
                        board[by][riverX2] = 'bridge';
                    }
                }
            }

            const roadStart = Math.min(2, Math.floor(w / 5));
            const roadEnd = midX - 2;
            if (roadEnd > roadStart) {
                for (let x = roadStart; x <= roadEnd; x++) {
                    if (!reserved.has(posKey(x, earthMidY))) board[earthMidY][x] = 'road';
                }
                for (let x = midX + 2; x < w - roadStart; x++) {
                    if (!reserved.has(posKey(x, earthMidY))) board[earthMidY][x] = 'road';
                }
            }

            if (w >= 8) {
                const mtnOffset = Math.max(2, Math.floor(w * 0.3));
                const mtnR = w >= 12 ? 2 : 1;
                const mountainClusters = [
                    { cx: mtnOffset, cy: eStart, r: mtnR },
                    { cx: w - 1 - mtnOffset, cy: eStart, r: mtnR },
                    { cx: mtnOffset, cy: eEnd, r: mtnR },
                    { cx: w - 1 - mtnOffset, cy: eEnd, r: mtnR },
                ];
                for (const mc of mountainClusters) {
                    for (let dy = -mc.r; dy <= mc.r; dy++) {
                        for (let dx = -mc.r; dx <= mc.r; dx++) {
                            if (Math.abs(dx) + Math.abs(dy) > mc.r) continue;
                            const mx = mc.cx + dx, my = mc.cy + dy;
                            if (mx < 0 || mx >= w || my < eStart || my > eEnd) continue;
                            if (reserved.has(posKey(mx, my))) continue;
                            const t = board[my][mx];
                            if (t === 'water' || t === 'deep_water' || t === 'bridge' || t === 'road') continue;
                            board[my][mx] = 'mountain';
                        }
                    }
                }
            }

            if (w >= 6) {
                const fOffset = Math.max(2, Math.floor(w * 0.2));
                const fCount = w >= 12 ? 5 : (w >= 8 ? 3 : 2);
                const forestClusters = [
                    { cx: fOffset, cy: eStart + 1, count: fCount },
                    { cx: w - 1 - fOffset, cy: eStart + 1, count: fCount },
                ];
                if (earthH >= 5) {
                    forestClusters.push({ cx: fOffset, cy: eEnd - 1, count: fCount });
                    forestClusters.push({ cx: w - 1 - fOffset, cy: eEnd - 1, count: fCount });
                }
                for (const fc of forestClusters) {
                    let painted = 0;
                    const frontier = [{ x: fc.cx, y: fc.cy }];
                    const seen = new Set([posKey(fc.cx, fc.cy)]);
                    while (frontier.length && painted < fc.count) {
                        const idx = Math.floor(Math.random() * frontier.length);
                        const cur = frontier.splice(idx, 1)[0];
                        if (reserved.has(posKey(cur.x, cur.y))) continue;
                        if (cur.x < 0 || cur.x >= w || cur.y < eStart || cur.y > eEnd) continue;
                        if (board[cur.y][cur.x] !== 'grass') continue;

                        state.boardObjects[cur.y][cur.x] = 'tree';
                        painted++;
                        for (const [ddx, ddy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                            const nx = cur.x + ddx, ny = cur.y + ddy;
                            const k = posKey(nx, ny);
                            if (!seen.has(k)) { seen.add(k); frontier.push({ x: nx, y: ny }); }
                        }
                    }
                }
            }

            if (w >= 8) {
                const dOffset = Math.max(3, Math.floor(w * 0.35));
                const dCount = w >= 12 ? 4 : 2;
                const desertClusters = [
                    { cx: dOffset, cy: earthMidY + 1, count: dCount },
                    { cx: w - 1 - dOffset, cy: earthMidY + 1, count: dCount },
                ];
                for (const dc of desertClusters) {
                    let painted = 0;
                    const frontier = [{ x: dc.cx, y: dc.cy }];
                    const seen = new Set([posKey(dc.cx, dc.cy)]);
                    while (frontier.length && painted < dc.count) {
                        const idx = Math.floor(Math.random() * frontier.length);
                        const cur = frontier.splice(idx, 1)[0];
                        if (reserved.has(posKey(cur.x, cur.y))) continue;
                        if (cur.x < 0 || cur.x >= w || cur.y < eStart || cur.y > eEnd) continue;
                        if (board[cur.y][cur.x] !== 'grass') continue;
                        board[cur.y][cur.x] = 'desert';
                        painted++;
                        for (const [ddx, ddy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                            const nx = cur.x + ddx, ny = cur.y + ddy;
                            const k = posKey(nx, ny);
                            if (!seen.has(k) && Math.random() < 0.7) { seen.add(k); frontier.push({ x: nx, y: ny }); }
                        }
                    }
                }
            }

            if (w >= 10) {
                const ruinOff = Math.max(2, Math.floor(w * 0.15));
                const ruinPositions = [
                    { x: midX - ruinOff, y: earthMidY - 1 },
                    { x: midX + ruinOff - 1, y: earthMidY - 1 },
                    { x: midX - ruinOff, y: earthMidY + 1 },
                    { x: midX + ruinOff - 1, y: earthMidY + 1 },
                ];
                for (const rp of ruinPositions) {
                    if (rp.x >= 0 && rp.x < w && rp.y >= eStart && rp.y <= eEnd) {
                        if (board[rp.y][rp.x] === 'grass' && !reserved.has(posKey(rp.x, rp.y))) {

                            state.boardObjects[rp.y][rp.x] = 'ruins';
                        }
                    }
                }
            }

            for (const pos of reserved) {
                const [x, y] = pos.split(',').map(Number);
                if (y >= eStart && y <= eEnd && x >= 0 && x < w) {
                    board[y][x] = 'grass';
                    if (state.boardObjects?.[y]) state.boardObjects[y][x] = null;
                }
            }
            return board;
        }

        function getLinePoints(x1, y1, x2, y2) {
            const points = [];
            const dx = Math.abs(x2 - x1);
            const dy = Math.abs(y2 - y1);
            const sx = x1 < x2 ? 1 : -1;
            const sy = y1 < y2 ? 1 : -1;
            let err = dx - dy;
            let x = x1;
            let y = y1;
            while (!(x === x2 && y === y2)) {
                const e2 = err * 2;
                if (e2 > -dy) {
                    err -= dy;
                    x += sx;
                }
                if (e2 < dx) {
                    err += dx;
                    y += sy;
                }
                points.push({
                    x,
                    y
                });
            }
            return points;
        }

        function isRangeBlockedByTerrain(x1, y1, x2, y2, sourceZ, targetZ, forVision) {

            // All 8 neighbours (cardinal AND diagonal) are point-blank and are
            // never blocked by terrain line-of-sight. A diagonal neighbour is
            // 1 tile away just like a cardinal one (CHEBYSHEV), so it must be
            // exempt too — otherwise a diagonal target one step up runs the
            // corner raycast and gets falsely blocked while the cardinal tile
            // right next to it is allowed.
            const d = Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
            if (d <= 1) return false;

            const _srcUnit = state.units?.find(u => !u.dead && u.x === x1 && u.y === y1 && u.wallVision);
            if (_srcUnit) return false;

            if (state.boardColumns?.length > 0) {

                const sz = (sourceZ != null) ? sourceZ : _inferStandingZ(x1, y1);
                const tz = (targetZ != null) ? targetZ : _inferStandingZ(x2, y2);
                return _isRayBlocked3D(x1, y1, sz, x2, y2, tz, forVision);
            }

            const points = getLinePoints(x1, y1, x2, y2);
            if (points.length <= 1) return false;
            const interior = points.slice(0, -1);
            return interior.some(p => {
                if (getTerrainRule(getTerrainAt(p.x, p.y)).blocksRanged) return true;
                /* Check object blocksRanged (trees etc.) */
                const obj = getObjectAt(p.x, p.y);
                if (obj) {
                    const oRule = getObjectRule(obj);
                    if (oRule && oRule.blocksRanged) return true;
                    /* Buildings (roofWalkable) block line-of-sight through their
                       solid body for vision, even though they don't block ranged
                       attacks. No height data on the 2D fallback path, so block flat.
                       A building never occludes ITSELF: when the target tile is part
                       of the same 2×2 footprint, its own body doesn't block — else
                       the far footprint tiles read as unseen from most directions
                       and the whole structure fogs out while you stand beside it. */
                    if (forVision && oRule && oRule.roofWalkable &&
                        !sameBuildingTile(p.x, p.y, x2, y2)) return true;
                }
                return false;
            });
        }

        function _inferStandingZ(x, y) {

            const u = state.units?.find(u => !u.dead && u.x === x && u.y === y);
            if (u && u.z != null) return u.z;

            if (state.towers) {
                for (const tw of Object.values(state.towers)) {
                    if (tw && tw.x === x && tw.y === y) {
                        const col = getColumn(x, y);
                        return col.length ? col[col.length - 1].z : 0;
                    }
                }
            }

            const col = getColumn(x, y);
            return col.length ? col[col.length - 1].z : 0;
        }

        function _hasBlockAt(ix, iy, iz) {
            if (ix < 0 || iy < 0 || iy >= bh() || ix >= bw()) return false;
            const col = state.boardColumns?.[iy]?.[ix];
            if (!col || !col.length) return false;

            if (col.length <= 8) {
                for (let i = 0; i < col.length; i++) {
                    if (col[i].z === iz) return true;
                    if (col[i].z > iz) return false;
                }
                return false;
            }

            let lo = 0, hi = col.length - 1;
            while (lo <= hi) {
                const mid = (lo + hi) >> 1;
                if (col[mid].z === iz) return true;
                if (col[mid].z < iz) lo = mid + 1;
                else hi = mid - 1;
            }
            return false;
        }

        function _isRayBlocked3D(x1, y1, z1, x2, y2, z2, forVision) {

            /* Sight ray runs eye-to-eye. A unit standing on block index z has its
               feet at world z+1 and its 1-tile-tall sprite's head at z+2, so the
               eyes sit at z+1.8 — NOT z+1.5 (torso), which made units unable to
               see down staircases because the ray clipped the floor of their own
               step level. Both endpoints use the same offset so LoS is mutual:
               if A can see B, B can see A. */
            const EYE = 1.8;
            const ox = x1 + 0.5, oy = y1 + 0.5, oz = z1 + EYE;
            const ex = x2 + 0.5, ey = y2 + 0.5, ez = z2 + EYE;

            const dx = ex - ox, dy = ey - oy, dz = ez - oz;
            const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (len < 0.001) return false;

            let ix = Math.floor(ox), iy = Math.floor(oy), iz = Math.floor(oz);

            const ixEnd = Math.floor(ex), iyEnd = Math.floor(ey), izEnd = Math.floor(ez);

            const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
            const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
            const stepZ = dz > 0 ? 1 : dz < 0 ? -1 : 0;

            const INF = 1e30;
            let tMaxX = dx !== 0 ? ((stepX > 0 ? (ix + 1) : ix) - ox) / dx : INF;
            let tMaxY = dy !== 0 ? ((stepY > 0 ? (iy + 1) : iy) - oy) / dy : INF;
            let tMaxZ = dz !== 0 ? ((stepZ > 0 ? (iz + 1) : iz) - oz) / dz : INF;

            const tDeltaX = dx !== 0 ? Math.abs(1.0 / dx) : INF;
            const tDeltaY = dy !== 0 ? Math.abs(1.0 / dy) : INF;
            const tDeltaZ = dz !== 0 ? Math.abs(1.0 / dz) : INF;

            const maxSteps = (Math.abs(x2 - x1) + Math.abs(y2 - y1) + Math.abs(z2 - z1) + 1) * 3 + 10;
            let steps = 0;
            const TIE_EPS = 1e-9;

            while (steps < maxSteps) {

                /* Step ALL axes whose boundary crossing ties the nearest one.
                   A tie means the ray passes exactly through a voxel edge or
                   corner (endpoints sit at *.5 with integer heights, so stair
                   corners produce exact ties constantly). The old one-axis-at-
                   a-time walk detoured into a voxel the ray only grazes — a
                   unit atop a 1:1 staircase was "blocked" by the corner of the
                   step below it, and sight was asymmetric (downhill blocked,
                   uphill clear). Grazing an edge is not a hit: step through the
                   corner diagonally and only test voxels the ray actually
                   enters. */
                const tMin = Math.min(tMaxX, tMaxY, tMaxZ);
                if (tMin > 1.0) break;
                if (tMaxX - tMin < TIE_EPS) { ix += stepX; tMaxX += tDeltaX; }
                if (tMaxY - tMin < TIE_EPS) { iy += stepY; tMaxY += tDeltaY; }
                if (tMaxZ - tMin < TIE_EPS) { iz += stepZ; tMaxZ += tDeltaZ; }
                steps++;

                if (ix === ixEnd && iy === iyEnd && iz === izEnd) continue;

                if (ix === x1 && iy === y1) continue;

                if (ix === x2 && iy === y2) continue;

                if (_hasBlockAt(ix, iy, iz)) return true;

                if (iz >= 0 && ix >= 0 && iy >= 0 && ix < bw() && iy < bh()) {
                    const rule = getTerrainRule(getTerrainAt(ix, iy));
                    if (rule.blocksRanged) return true;
                    /* Check object blocksRanged with game height */
                    const obj = getObjectAt(ix, iy);
                    if (obj) {
                        const oRule = getObjectRule(obj);
                        if (oRule && oRule.blocksRanged) {
                            const objBaseZ = _inferStandingZ(ix, iy);
                            const objTopZ = objBaseZ + (oRule.gameHeight || 1);
                            if (iz >= objBaseZ && iz < objTopZ) return true;
                        } else if (forVision && oRule && oRule.roofWalkable) {
                            /* Buildings block line-of-sight through their solid body
                               (vision only — they stay shootable-past). Height-aware:
                               the roof sits at objTopZ, so a unit standing ON the roof
                               (ray at iz === objTopZ) still sees over the building.
                               A building never occludes ITSELF: when the ray's target
                               tile is part of this same 2×2 footprint, its own body
                               doesn't block — otherwise the far footprint tiles (incl.
                               the NW anchor that owns the render prism) read as unseen
                               from most directions and the whole building disappears
                               while you stand right in front of it. */
                            if (!sameBuildingTile(ix, iy, x2, y2)) {
                                const objBaseZ = _inferStandingZ(ix, iy);
                                const oSpr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[obj] : null;
                                const bldgH = (oSpr && oSpr._gameHeight > 0) ? oSpr._gameHeight : 2;
                                const objTopZ = objBaseZ + bldgH;
                                if (iz >= objBaseZ && iz < objTopZ) return true;
                            }
                        }
                    }
                }
            }

            return false;
        }

        function updateTerrainStay(unit) {
            if (!unit || unit.dead) return;

            if (typeof isUnitAirborne === 'function' && isUnitAirborne(unit)) return;
            const terrain = getTerrainAt(unit.x, unit.y);

            // 💧 Water puts you out (2026-07-10): wading in any water (or the
            // healing spring) douses burn (lava-stoked or not) on the
            // spot. Runs on every move and on the round tick, so stepping into
            // the shallows is a real answer to being set on fire.
            if ((terrain === 'water' || terrain === 'deep_water' || terrain === 'healing_spring')
                && unit.status && unit.status.burn) {
                clearStatus(unit, 'burn');
                const _dNm = (typeof unitDisplayName === 'function') ? unitDisplayName(unit) : (unit.name || 'Unit');
                if (typeof addLog === 'function') addLog(`💧 ${_dNm} wades into the water — the flames are doused!`);
                if (typeof showFloatingTextForUnit === 'function') showFloatingTextForUnit(unit, '💧 Doused', 'heal', { durationMs: 1000 });
            }
            unit.terrainStay = unit.terrainStay || {};
            if (unit.terrainStay.lastTerrain !== terrain) {

                if (unit.terrainStay.lastTerrain === 'deep_water' && terrain !== 'deep_water') {
                    unit._drowningStacks = 0;
                    clearStatus(unit, 'drowning');
                }

                if (unit.terrainStay.lastTerrain === 'lava' && terrain !== 'lava') {
                    // Out of the lava: the burn keeps ticking its remaining
                    // duration, but drops back to normal (non-escalated) damage.
                    unit._lavaBurnStacks = 0;
                }
                unit.terrainStay = {
                    lastTerrain: terrain,
                    [terrain]: 1
                };
            } else {
                unit.terrainStay[terrain] = (unit.terrainStay[terrain] || 0) + 1;
            }
        }

        function applyTerrainTurnEffects(unit) {

            if (typeof isUnitAirborne === 'function' && isUnitAirborne(unit)) return;
            const terrain = getTerrainAt(unit.x, unit.y);

            const _ovrObj = getObjectAt(unit.x, unit.y);
            if (_ovrObj) {
                const _ovrRule = getObjectRule(_ovrObj);
                if (_ovrRule && _ovrRule.overridesGround) return;
            }
            const rule = getTerrainRule(terrain);
            const result = typeof rule.endTurn === 'function' ? rule.endTurn(unit) : null;
            if (!result) return;
            if (result.type === 'damage') {
                applyDamageToUnit(unit, result.amount, '', {
                    ignoreArmor: true
                });
                addLog(result.text || `${unitDisplayName(unit)} suffers ${result.amount} damage from ${rule.label}.`);
            } else if (result.type === 'heal') {
                const healed = applyHealingToUnit(unit, result.amount, null);
                if (healed > 0) {
                    addLog(result.text ? `${result.text} ${healed} HP.` : `${unitDisplayName(unit)} recovers ${healed} HP from ${rule.label}.`);
                }
            } else if (result.type === 'mana') {
                const before = unit.mp || 0;
                unit.mp = Math.min(unit.maxMp, before + result.amount);
                const restored = unit.mp - before;
                if (restored > 0) {
                    addLog(result.text ? `${result.text} ${restored} MP.` : `${unitDisplayName(unit)} restores ${restored} MP from ${rule.label}.`);
                    if (typeof showFloatingTextForUnit === 'function') {
                        showFloatingTextForUnit(unit, `+${restored} MP`, 'heal');
                    }
                }
            }
        }

        function getSleepAffinityModifier(unit) {
            const cycle = getCurrentCyclePhase();
            if (!unit) return {
                atk: 0,
                armor: 0,
                int: 0,
                awr: 0,
                label: cycle
            };
            if (unit.sleepPreference === 'nocturnal') {
                return cycle === 'night' ?
                    {
                        atk: 8,
                        armor: 5,
                        int: 5,
                        awr: 1,
                        label: 'Nocturnal Favored'
                    } :
                    {
                        atk: -8,
                        armor: -5,
                        int: -5,
                        awr: -1,
                        label: 'Nocturnal Penalty'
                    };
            }
            if (unit.sleepPreference === 'daywalker') {
                return cycle === 'day' ?
                    {
                        atk: 8,
                        armor: 5,
                        int: 5,
                        awr: 1,
                        label: 'Daywalker Favored'
                    } :
                    {
                        atk: -8,
                        armor: -5,
                        int: -5,
                        awr: -1,
                        label: 'Daywalker Penalty'
                    };
            }
            return {
                atk: 0,
                armor: 0,
                int: 0,
                awr: 0,
                label: cycle
            };
        }

        function groundHourglassesAt(x, y) {
            return state.hourglasses.filter(h => h.carriedBy === null && h.x === x && h.y === y);
        }

        function groundHiddenItemsAt(x, y) {
            return state.hiddenItems.filter(h => h.collectedBy === null && h.x === x && h.y === y);
        }

        function carriedHourglassCount(player) {
            return state.hourglasses.filter(h => h.carriedBy && unitFromId(h.carriedBy)?.player === player).length;
        }

        function revealHourglassesAt(x, y, player) {
            let found = 0;
            for (const h of groundHourglassesAt(x, y)) {
                const key = posKey(h.x, h.y);
                if (!h.visibleTo[player]) {
                    h.visibleTo[player] = true;
                    state.foundByPlayer[player].add(key);
                    found += 1;
                }
            }
            return found;
        }

        function revealHiddenItemsAt(x, y, player) {

            return [];
        }

        function revealByScanPulse(unit, radius) {
            const area = [];
            for (let yy = Math.max(0, unit.y - radius); yy <= Math.min(bh() - 1, unit.y + radius); yy++) {
                for (let xx = Math.max(0, unit.x - radius); xx <= Math.min(bw() - 1, unit.x + radius); xx++) {
                    state.scannedByPlayer[unit.player].add(scanKey(xx, yy));
                    area.push({
                        x: xx,
                        y: yy,
                        d: Math.max(Math.abs(unit.x - xx), Math.abs(unit.y - yy))
                    });
                }
            }
            area.sort((a, b) => a.d - b.d || Math.abs(unit.x - a.x) + Math.abs(unit.y - a.y) - (Math.abs(unit.x - b.x) + Math.abs(unit.y - b.y)));
            let hourglasses = 0;
            for (const tile of area) {
                if (hourglasses < 1) {
                    hourglasses += revealHourglassesAt(tile.x, tile.y, unit.player);
                }
                if (hourglasses >= 1) break;
            }
            return {
                hourglasses,
                items: 0,
                total: hourglasses,
                radius
            };
        }

        function collectHourglassesForUnit(unit) {

            return 0;
        }

        function collectHiddenItemsForUnit(unit) {

            return 0;
        }

        function openItemFoundDialog(unit, foundItems) {
            state.uiDialog = {
                type: 'itemFound',
                unitId: unit.id,
                foundItems: foundItems.map(it => ({ type: it.type, _ref: it }))
            };
            markDirty('dialog');
            renderIfDirty();
        }

        function itemFoundDiscard(unitId, discardKey) {
            const unit = state.units.find(u => u.id === unitId);
            if (!unit) return;
            if ((unit.items?.[discardKey] || 0) <= 0) return;
            unit.items[discardKey] -= 1;
            addLog(`${unitDisplayName(unit)} discards a ${ITEM_RULES[discardKey]?.name || discardKey}.`);

            const dialog = state.uiDialog;
            if (!dialog || dialog.type !== 'itemFound') return;
            const pending = dialog.foundItems.find(fi => !fi._ref.collectedBy);
            if (pending) {
                const cap = getItemCapForClass(unit.cls, pending.type);
                if ((unit.items[pending.type] || 0) < cap && !unitItemsFull(unit)) {
                    unit.items[pending.type] = (unit.items[pending.type] || 0) + 1;
                    pending._ref.collectedBy = unit.id;
                    const rule = ITEM_RULES[pending.type];
                    const _pickupBaneRule = ITEM_RULES[pending.type];
                    let _pickupIcon;
                    if (_pickupBaneRule && _pickupBaneRule.baneType) {
                        _pickupIcon = `<div class="bane-sprite bane-${_pickupBaneRule.baneType}" style="width:16px;height:16px;background-size:16px 16px;display:inline-block;vertical-align:middle"></div>`;
                    } else {
                        _pickupIcon = ITEM_META[pending.type]?.icon || '📦';
                    }
                    addLog(`${unitDisplayName(unit)} picks up ${rule?.name || pending.type}.`);
                    showFloatingTextForUnit(unit, `${_pickupIcon} +1`, 'pickup', { durationMs: 1000 });
                }
            }

            const remaining = dialog.foundItems.filter(fi => !fi._ref.collectedBy);
            if (remaining.length === 0 || unitItemsFull(unit)) {
                state.uiDialog = null;
            }
            markDirty('dialog', 'board', 'selectedUnit');
            renderIfDirty();
        }

        function itemFoundSkip() {
            if (state.uiDialog?.type === 'itemFound') {
                addLog('Left items on the ground.');
                state.uiDialog = null;
                markDirty('dialog');
                renderIfDirty();
            }
        }

        function dropHourglassesFromUnit(unit) {
            if (!unit || unit.hourglasses <= 0) return;
            const carried = state.hourglasses.filter(h => h.carriedBy === unit.id);
            for (const h of carried) {
                h.carriedBy = null;
                h.x = unit.x;
                h.y = unit.y;
                h.visibleTo[1] = true;
                h.visibleTo[2] = true;
            }
            addLog(`${unitDisplayName(unit)} drops ${carried.length} hourglass${carried.length === 1 ? '' : 'es'} at ${coordLabel(unit.x, unit.y)}.`, unit.player);

            const lostBuff = unit.hourglassBuff || 0;
            unit.hourglassBuff = 0;
            if (lostBuff > 0) {
                state.hourglassBuffs[unit.player] = Math.max(0, (state.hourglassBuffs[unit.player] || 0) - lostBuff);
            }
            unit.hourglasses = 0;
        }

        function revealAllHiddenItems() {
            for (const item of state.hiddenItems) {
                item.visibleTo[1] = true;
                item.visibleTo[2] = true;
            }
        }

        /* ═══════════════════════════════════════════════════════════════════
           SPAWN ZONE SYSTEM
           ═══════════════════════════════════════════════════════════════════ */

        /**
         * Auto-generate spawn zones at match init.
         * Each team gets one tile per unit along their map edge, centered.
         * P1 → bottom row (h-1), P2 → top row (0) for vertical maps.
         * Stores result in state.spawnZones[player] as [{x,y}, ...].
         */
        /* Ground level a spawn zone should be flattened TO. Older logic always
           flattened spawn tiles to z=0, which carves a deep pit ("hole") on maps
           whose natural ground sits above 0 (e.g. a fully elevated city built at
           height 3). Instead, flatten to the LOWEST existing surface height across
           the zone's tiles so the spawn stays flush with the surrounding map. On a
           normal ground-at-0 map this returns 0 → identical to the old behaviour. */
        function _spawnZoneGroundHeight(zoneTiles) {
            const w = bw(), h = bh();
            let minH = Infinity;
            for (const t of zoneTiles) {
                if (!t || t.y < 0 || t.y >= h || t.x < 0 || t.x >= w) continue;
                const hh = state.boardHeights?.[t.y]?.[t.x] ?? 0;
                if (hh < minH) minH = hh;
            }
            return (minH === Infinity) ? 0 : Math.max(0, minH);
        }

        /* Build a SOLID voxel column from z=0 up to topZ (inclusive) so a flattened
           tile renders as filled ground instead of a single floating voxel over a
           hole. Sub-surface layers keep their original terrain (so exposed cliff
           sides still look right); the top gets topTerrain. */
        function _buildSolidVoxelColumn(x, y, topZ, topTerrain) {
            const orig = state.boardVoxels?.[y]?.[x];
            const subById = {};
            if (Array.isArray(orig)) for (const b of orig) subById[b.z] = b.terrain;
            const col = [];
            for (let z = 0; z <= topZ; z++) {
                col.push({ z, terrain: (z === topZ) ? topTerrain : (subById[z] || topTerrain) });
            }
            return col;
        }

        function autoGenerateSpawnZones() {
            const w = bw(), h = bh();
            // Gauntlet keeps an 8-unit roster but only deploys 4 — size the spawn
            // zone to the deploy count, not the full roster.
            const teamSize = (typeof _isGauntlet === 'function' && _isGauntlet())
                ? (CONFIG.gauntletDeploy || 4)
                : (CONFIG.teamSize || 4);
            const sp1 = (typeof SPAWNS !== 'undefined' && Array.isArray(SPAWNS[1])) ? SPAWNS[1] : [];
            const sp2 = (typeof SPAWNS !== 'undefined' && Array.isArray(SPAWNS[2])) ? SPAWNS[2] : [];

            /* Mystery Dungeon: spawns are authored by the hub/floor generator
               (party in the spawn room, enemies deep in the maze). The edge-row
               relocation below would drag everyone to the border AND flatten/
               carve those tiles — defacing the maze walls. Use the authored
               spawn tiles verbatim. */
            if (typeof _isDungeonMode === 'function' && _isDungeonMode()) {
                state.spawnZones = {
                    1: sp1.map(p => ({ x: p.x, y: p.y })),
                    2: sp2.map(p => ({ x: p.x, y: p.y })),
                };
                return;
            }

            /* Custom editor / community maps: the author placed their spawn
               points deliberately, on terrain they sculpted. The edge-row
               relocation + flatten/BFS-lower pass below was rewriting that
               work ("play tested a map and it changed/sunk the terrain around
               the spawn zones"). Use the authored spawn tiles verbatim — no
               terrain edits — exactly like Mystery Dungeon. */
            if (typeof activeGameMode !== 'undefined'
                && (activeGameMode === '_custom_editor' || activeGameMode === '_custom_community')
                && sp1.length > 0 && sp2.length > 0) {
                state.spawnZones = {
                    1: sp1.map(p => ({ x: p.x, y: p.y })),
                    2: sp2.map(p => ({ x: p.x, y: p.y })),
                };
                for (const unit of state.units) {
                    const zoneArr = state.spawnZones[unit.player];
                    if (!zoneArr || zoneArr.length === 0) continue;
                    const idx = parseInt(unit.id.split('-')[1], 10);
                    unit._spawnIndex = idx < zoneArr.length ? idx : 0;
                    if (!unit.dead) {
                        const tile = zoneArr[unit._spawnIndex] || zoneArr[0];
                        unit.x = tile.x;
                        unit.y = tile.y;
                        if (typeof nearestWalkableZ === 'function') unit.z = nearestWalkableZ(tile.x, tile.y);
                    }
                }
                console.log('[SpawnZones] custom map — authored spawns used verbatim (no terrain rewrite)');
                return;
            }

            state.spawnZones = {};

            /* Determine orientation from SPAWNS hint */
            let p1Row, p2Row;
            let orientation = 'vertical'; // default: P1 bottom, P2 top

            if (sp1.length > 0 && sp2.length > 0) {
                const avgY1 = sp1.reduce((s, p) => s + p.y, 0) / sp1.length;
                const avgY2 = sp2.reduce((s, p) => s + p.y, 0) / sp2.length;
                const avgX1 = sp1.reduce((s, p) => s + p.x, 0) / sp1.length;
                const avgX2 = sp2.reduce((s, p) => s + p.x, 0) / sp2.length;

                const ySpread = Math.abs(avgY1 - avgY2);
                const xSpread = Math.abs(avgX1 - avgX2);

                if (xSpread > ySpread * 1.5) {
                    orientation = 'horizontal'; // left/right edges
                }
            }

            if (orientation === 'vertical') {
                if (sp1.length > 0 && sp2.length > 0) {
                    const avgY1 = sp1.reduce((s, p) => s + p.y, 0) / sp1.length;
                    const avgY2 = sp2.reduce((s, p) => s + p.y, 0) / sp2.length;
                    p1Row = avgY1 > avgY2 ? h - 1 : 0;
                    p2Row = p1Row === h - 1 ? 0 : h - 1;
                } else {
                    p1Row = h - 1;
                    p2Row = 0;
                }

                const startCol = Math.max(0, Math.floor((w - teamSize) / 2));
                state.spawnZones[1] = [];
                state.spawnZones[2] = [];
                for (let i = 0; i < teamSize; i++) {
                    const col = Math.min(startCol + i, w - 1);
                    state.spawnZones[1].push({ x: col, y: p1Row });
                    state.spawnZones[2].push({ x: col, y: p2Row });
                }

                /* Clear & flatten zone tiles — flatten to each zone's own ground
                   height (not hardcoded 0) so elevated maps don't get pit holes. */
                const z1 = _spawnZoneGroundHeight(state.spawnZones[1]);
                const z2 = _spawnZoneGroundHeight(state.spawnZones[2]);
                _clearSpawnZoneTiles(state.spawnZones[1], z1);
                _clearSpawnZoneTiles(state.spawnZones[2], z2);

                /* Verify egress — row inward from zone must be passable */
                const p1EgressRow = p1Row === h - 1 ? h - 2 : 1;
                const p2EgressRow = p2Row === 0 ? 1 : h - 2;
                _ensureEgressRow(p1EgressRow, startCol, teamSize, z1);
                _ensureEgressRow(p2EgressRow, startCol, teamSize, z2);

            } else {
                /* Horizontal: P1 left col, P2 right col */
                let p1Col, p2Col;
                if (sp1.length > 0 && sp2.length > 0) {
                    const avgX1 = sp1.reduce((s, p) => s + p.x, 0) / sp1.length;
                    const avgX2 = sp2.reduce((s, p) => s + p.x, 0) / sp2.length;
                    p1Col = avgX1 < avgX2 ? 0 : w - 1;
                    p2Col = p1Col === 0 ? w - 1 : 0;
                } else {
                    p1Col = 0;
                    p2Col = w - 1;
                }

                const startRow = Math.max(0, Math.floor((h - teamSize) / 2));
                state.spawnZones[1] = [];
                state.spawnZones[2] = [];
                for (let i = 0; i < teamSize; i++) {
                    const row = Math.min(startRow + i, h - 1);
                    state.spawnZones[1].push({ x: p1Col, y: row });
                    state.spawnZones[2].push({ x: p2Col, y: row });
                }

                const z1 = _spawnZoneGroundHeight(state.spawnZones[1]);
                const z2 = _spawnZoneGroundHeight(state.spawnZones[2]);
                _clearSpawnZoneTiles(state.spawnZones[1], z1);
                _clearSpawnZoneTiles(state.spawnZones[2], z2);

                const p1EgressCol = p1Col === 0 ? 1 : w - 2;
                const p2EgressCol = p2Col === w - 1 ? w - 2 : 1;
                _ensureEgressCol(p1EgressCol, startRow, teamSize, z1);
                _ensureEgressCol(p2EgressCol, startRow, teamSize, z2);
            }

            /* Assign _spawnIndex on units */
            for (const unit of state.units) {
                const zoneArr = state.spawnZones[unit.player];
                if (!zoneArr) continue;
                const idx = parseInt(unit.id.split('-')[1], 10);
                unit._spawnIndex = idx < zoneArr.length ? idx : 0;
            }

            /* Sync SPAWNS to match spawn zones so units actually spawn inside sanctuary walls */
            if (state.spawnZones[1] && state.spawnZones[1].length > 0) {
                SPAWNS[1] = state.spawnZones[1].map(t => ({ x: t.x, y: t.y }));
            }
            if (state.spawnZones[2] && state.spawnZones[2].length > 0) {
                SPAWNS[2] = state.spawnZones[2].map(t => ({ x: t.x, y: t.y }));
            }

            /* Relocate existing units into their spawn zone tiles (units are created before map init) */
            for (const unit of state.units) {
                if (unit.dead) continue;
                const zoneArr = state.spawnZones[unit.player];
                if (!zoneArr || zoneArr.length === 0) continue;
                const idx = unit._spawnIndex || 0;
                const tile = zoneArr[idx] || zoneArr[0];
                unit.x = tile.x;
                unit.y = tile.y;
                if (typeof nearestWalkableZ === 'function') unit.z = nearestWalkableZ(tile.x, tile.y);
            }

            console.log('[SpawnZones] P1:', JSON.stringify(state.spawnZones[1]),
                        'P2:', JSON.stringify(state.spawnZones[2]));
        }

        function _clearSpawnZoneTiles(zoneTiles, targetH = 0) {
            const w = bw(), h = bh();
            const zoneSet = new Set();
            for (const tile of zoneTiles) {
                const { x, y } = tile;
                if (y < 0 || y >= h || x < 0 || x >= w) continue;

                /* Force passable terrain */
                const t = state.boardTerrain?.[y]?.[x];
                const rule = typeof TERRAIN_RULES !== 'undefined' ? TERRAIN_RULES[t] : null;
                if (!rule || rule.passable === false) {
                    state.boardTerrain[y][x] = 'grass';
                }

                /* Flatten height to the zone's ground level (not hardcoded 0) */
                if (state.boardHeights?.[y]) state.boardHeights[y][x] = targetH;

                /* Remove objects */
                if (state.boardObjects?.[y]) state.boardObjects[y][x] = null;

                /* Flatten voxels — keep the column SOLID up to targetH so the tile
                   stays flush with the map instead of collapsing into a hole. */
                if (state.boardVoxels?.[y]?.[x]) {
                    state.boardVoxels[y][x] = _buildSolidVoxelColumn(x, y, targetH, state.boardTerrain[y][x] || 'grass');
                }

                zoneSet.add(y * w + x);
            }

            /* ── Propagate max-height-diff-1 outward from zone tiles ──
               BFS from zone edges: any neighbor whose height exceeds
               the clamped tile's height + 1 gets lowered. This ripples
               outward so terrain ramps smoothly away from the spawn. */
            const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
            const visited = new Set(zoneSet);
            const queue = [];
            /* Seed BFS with zone tiles (height already 0) */
            for (const tile of zoneTiles) {
                const { x, y } = tile;
                if (y < 0 || y >= h || x < 0 || x >= w) continue;
                queue.push({ x, y });
            }
            let qi = 0;
            while (qi < queue.length) {
                const cur = queue[qi++];
                const curH = state.boardHeights?.[cur.y]?.[cur.x] ?? 0;
                const maxNeighborH = curH + 1;
                for (const [dx, dy] of dirs) {
                    const nx = cur.x + dx, ny = cur.y + dy;
                    if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                    const nH = state.boardHeights?.[ny]?.[nx] ?? 0;
                    if (nH > maxNeighborH) {
                        /* Clamp this tile's height */
                        if (state.boardHeights?.[ny]) state.boardHeights[ny][nx] = maxNeighborH;
                        if (state.boardVoxels?.[ny]?.[nx]) {
                            const nTerrain = state.boardTerrain?.[ny]?.[nx] || 'grass';
                            state.boardVoxels[ny][nx] = _buildSolidVoxelColumn(nx, ny, maxNeighborH, nTerrain);
                        }
                        /* Force passable so egress isn't blocked by impassable terrain */
                        const nt = state.boardTerrain?.[ny]?.[nx];
                        const nRule = typeof TERRAIN_RULES !== 'undefined' ? TERRAIN_RULES[nt] : null;
                        if (!nRule || nRule.passable === false) {
                            state.boardTerrain[ny][nx] = 'grass';
                        }
                        /* Remove objects that might block movement */
                        if (state.boardObjects?.[ny]) {
                            const obj = state.boardObjects[ny][nx];
                            if (obj) {
                                const oRule = typeof OBJECT_RULES !== 'undefined' ? OBJECT_RULES[obj] : null;
                                if (oRule && oRule.passable === false) {
                                    state.boardObjects[ny][nx] = null;
                                }
                            }
                        }
                    }
                    /* Only continue BFS into tiles we actually modified or zone tiles */
                    if (!visited.has(ny * w + nx) && nH > maxNeighborH) {
                        visited.add(ny * w + nx);
                        queue.push({ x: nx, y: ny });
                    }
                }
            }

            if (state._heightVersion !== undefined) state._heightVersion++;
            if (state._voxelVersion !== undefined) state._voxelVersion++;
        }

        function _ensureEgressRow(row, startCol, count, targetH = 0) {
            const w = bw(), h = bh();
            if (row < 0 || row >= h) return;
            const maxH = targetH + 1; // reachable from the zone (one climb step)
            for (let i = 0; i < count; i++) {
                const x = Math.min(startCol + i, w - 1);
                const t = state.boardTerrain?.[row]?.[x];
                const rule = typeof TERRAIN_RULES !== 'undefined' ? TERRAIN_RULES[t] : null;
                if (!rule || rule.passable === false) {
                    state.boardTerrain[row][x] = 'grass';
                    if (state.boardObjects?.[row]) state.boardObjects[row][x] = null;
                }
                /* Ensure egress tile height is reachable from the zone's ground level */
                if (state.boardHeights?.[row] && state.boardHeights[row][x] > maxH) {
                    state.boardHeights[row][x] = maxH;
                    if (state.boardVoxels?.[row]?.[x]) {
                        const eTerrain = state.boardTerrain?.[row]?.[x] || 'grass';
                        state.boardVoxels[row][x] = _buildSolidVoxelColumn(x, row, maxH, eTerrain);
                    }
                }
            }
        }

        function _ensureEgressCol(col, startRow, count, targetH = 0) {
            const w = bw(), h = bh();
            if (col < 0 || col >= w) return;
            const maxH = targetH + 1; // reachable from the zone (one climb step)
            for (let i = 0; i < count; i++) {
                const y = Math.min(startRow + i, h - 1);
                const t = state.boardTerrain?.[y]?.[col];
                const rule = typeof TERRAIN_RULES !== 'undefined' ? TERRAIN_RULES[t] : null;
                if (!rule || rule.passable === false) {
                    state.boardTerrain[y][col] = 'grass';
                    if (state.boardObjects?.[y]) state.boardObjects[y][col] = null;
                }
                /* Ensure egress tile height is reachable from the zone's ground level */
                if (state.boardHeights?.[y] && state.boardHeights[y][col] > maxH) {
                    state.boardHeights[y][col] = maxH;
                    if (state.boardVoxels?.[y]?.[col]) {
                        const eTerrain = state.boardTerrain?.[y]?.[col] || 'grass';
                        state.boardVoxels[y][col] = _buildSolidVoxelColumn(col, y, maxH, eTerrain);
                    }
                }
            }
        }

        function isInSpawnZone(x, y, player) {
            const zone = state.spawnZones?.[player];
            if (!zone) return false;
            return zone.some(t => t.x === x && t.y === y);
        }

        function isInAnySpawnZone(x, y) {
            return isInSpawnZone(x, y, 1) || isInSpawnZone(x, y, 2);
        }

        function getSpawnZone(player) {
            return state.spawnZones?.[player] || [];
        }

        function getSpawnZoneOwnerAt(x, y) {
            if (isInSpawnZone(x, y, 1)) return 1;
            if (isInSpawnZone(x, y, 2)) return 2;
            return 0;
        }

        function pushUnitToNearestOpen(unit, fromX, fromY) {
            const w = bw(), h = bh();
            for (let radius = 1; radius <= Math.max(w, h); radius++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
                        const nx = fromX + dx, ny = fromY + dy;
                        if (nx < 0 || ny < 0 || ny >= h || nx >= w) continue;
                        const t = state.boardTerrain?.[ny]?.[nx];
                        const rule = typeof TERRAIN_RULES !== 'undefined' ? TERRAIN_RULES[t] : null;
                        if (!rule || rule.passable === false) continue;
                        if (state.units.some(u => u !== unit && !u.dead && u.x === nx && u.y === ny)) continue;
                        unit.x = nx;
                        unit.y = ny;
                        unit.z = (typeof nearestWalkableZ === 'function') ? nearestWalkableZ(nx, ny) : (state.boardHeights?.[ny]?.[nx] ?? 0);
                        return;
                    }
                }
            }
        }

        /* ═══════════════════════════════════════════════════════════════════ */

        function defeatUnit(unit, killer) {
            if (!unit || unit.dead || unit._dying) return;

            unit.hp = 0;
            unit._dying = true;
            unit._dyingX = unit.x;
            unit._dyingY = unit.y;
            playSfx('death');
            if (typeof VFX !== 'undefined') VFX.death(unit.x, unit.y, unit.z);
            resetKillStreak(unit);
            dropHourglassesFromUnit(unit);

            if (typeof dropFlagOnDeath === 'function') dropFlagOnDeath(unit);

            if (state.turrets) state.turrets = state.turrets.filter(t => t.casterUnitId !== unit.id);

            if (state.plantedSeeds) state.plantedSeeds = state.plantedSeeds.filter(s => s.casterUnitId !== unit.id);

            if (state._deployedObjects) state._deployedObjects = state._deployedObjects.filter(o => o.ownerUnitId !== unit.id);

            if (state.wards) state.wards = state.wards.filter(w => w.placedBy !== unit.id);

            // Per-life accessory state recharges with the next life: the
            // Martyr's Talisman can defy death again, the Brand/Focus spell
            // lock re-picks on the first cast, the Censer purge guard resets.
            unit._talismanSpent = false;
            unit._brandLockSpellId = null;
            unit._censerRound = null;

            if (!unit._isBoss) {
                unit._deathCount = (unit._deathCount || 0) + 1;
                unit._matchDeaths = (unit._matchDeaths || 0) + 1;

                unit._damageContributors = {};
                unit._debuffContributors = {};
                if ((typeof _isGauntlet === 'function' && _isGauntlet()) ||
                    (typeof _isDungeonMode === 'function' && _isDungeonMode())) {
                    /* Gauntlet + Mystery Dungeon: no respawns — the fallen stay down
                       (MD party members return when the run ends, back at the hub). */
                    unit._respawnIn = null;
                } else {
                    unit._respawnIn = Math.min(Math.pow(2, unit._deathCount - 1), 8);
                }
            }

            scheduleBoardRender();

            if (window.RenderBus) window.RenderBus.emit('unit:died', { unit, killer });

            if (window.ThreeAnim && window.ThreeAnim.isActive()) {
                window.ThreeAnim.death(unit.id);
                // Deaths land in slow motion: ~half a second at 40% speed while
                // the knock-down/spin plays, then time snaps back. Killing hits
                // skip the impact freeze so the two effects never fight.
                /* Strike Mode real-time: no global slow-mo — with everyone
                   fighting at once it would stutter the whole match every
                   few seconds. Turn-based keeps the dramatic beat. */
                if (window.ThreeAnim.slowMo && !(typeof _skipVisuals === 'function' && _skipVisuals())
                    && !(typeof window._isStrikeRT === 'function' && window._isStrikeRT())) {
                    window.ThreeAnim.slowMo(0.4, 550);
                }
            }

            const MAP_DEATH_DURATION = state.devAutoSim ? 0 : 800;
            setTimeout(() => {
                unit._dying = false;
                unit.dead = true;

                const _gauntlet = typeof _isGauntlet === 'function' && _isGauntlet();
                if (unit._isBoss) {
                    addLog(`👹 ${unitDisplayName(unit)} has been slain!`);
                    shakeBoard('hard');
                } else if (_gauntlet) {
                    const reservesLeft = typeof _gauntletReservesAlive === 'function' ? _gauntletReservesAlive(unit.player) : 0;
                    addLog(`💀 ${unitDisplayName(unit)} has fallen${reservesLeft > 0 ? ' — send in a reserve!' : ' — no reserves remain!'}`);
                    shakeBoard('normal');
                } else if (typeof _isDungeonMode === 'function' && _isDungeonMode()) {
                    addLog(unit.player === 1
                        ? `💀 ${unitDisplayName(unit)} has fallen! They won't return until the run ends.`
                        : `💀 ${unitDisplayName(unit)} is defeated!`);
                    shakeBoard('normal');
                } else if (typeof window._isStrikeRT === 'function' && window._isStrikeRT()) {
                    /* Strike Mode: StrikeEngine respawns on a real-time clock,
                       not rounds — it logs its own countdown. */
                    addLog(`💀 ${unitDisplayName(unit)} is down!`);
                    shakeBoard('normal');
                } else {
                    addLog(`${unitDisplayName(unit)} is defeated. Respawns in ${unit._respawnIn} round${unit._respawnIn > 1 ? 's' : ''}.`);
                    shakeBoard('normal');
                }

                if (!state._recentDefeats) state._recentDefeats = [];
                state._recentDefeats.push({
                    name: unitDisplayName(unit),
                    player: unit.player
                });
                scheduleBoardRender();

                if (_gauntlet && typeof _gauntletQueueReplacement === 'function') {
                    _gauntletQueueReplacement(unit);
                }

                checkWin();

                if (state.phase === 'battle' && !state.winner) {
                    if (typeof _showFloatActionMenu === 'function') _showFloatActionMenu();
                    renderBattleSelectionUI({ includeBoard: false });
                }
            }, MAP_DEATH_DURATION);
        }

        function processRespawns() {
            for (const unit of state.units) {
                if (!unit.dead) continue;
                if (unit._isBoss) continue;
                if (typeof unit._respawnIn !== 'number') continue;
                unit._respawnIn--;
                if (unit._respawnIn <= 0) {
                    const floorTerrain = state.boardTerrain;
                    if (!floorTerrain) continue;

                    /* FFA mode: keep existing scattered respawn */
                    const _ffaMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
                    if (_ffaMode && _ffaMode.isFFA) {
                        const candidates = [];
                        for (let y = 1; y < floorTerrain.length - 1; y++) {
                            for (let x = 1; x < (floorTerrain[0]?.length || 0) - 1; x++) {
                                const t = floorTerrain[y][x];
                                const tRule = getTerrainRule(t || 'grass');
                                if (tRule.passable === false) continue;
                                if (t === 'tower_base') continue;
                                if (typeof isTowerTile === 'function' && isTowerTile(x, y)) continue;
                                if (state.units.some(o => o !== unit && !o.dead && o.x === x && o.y === y)) continue;

                                const minDist = state.units.filter(o => !o.dead && o.id !== unit.id)
                                    .reduce((mn, o) => Math.min(mn, Math.abs(o.x - x) + Math.abs(o.y - y)), 999);
                                candidates.push({ x, y, dist: minDist });
                            }
                        }
                        if (candidates.length === 0) continue;

                        candidates.sort((a, b) => b.dist - a.dist);
                        const pool = candidates.slice(0, Math.max(1, Math.floor(candidates.length * 0.25)));
                        const pick = pool[Math.floor(Math.random() * pool.length)];
                        unit.x = pick.x;
                        unit.y = pick.y;
                        unit.z = (typeof nearestWalkableZ === 'function') ? nearestWalkableZ(pick.x, pick.y) : (state.boardHeights?.[pick.y]?.[pick.x] ?? 0);
                        unit.dead = false;
                        unit._dying = false;
                        unit.hp = unit.maxHp;
                        unit.mp = unit.maxMp;
                        unit.shield = 0;
                        unit.ap = 0;
                        unit.status = { spawnGuard: 1 };
                        unit._respawnIn = null;
                        unit._justRespawned = true;
                        unit._showRespawnBanner = true;
                        addLog(`🔄 ${unitDisplayName(unit)} has respawned! (${unit.hp}/${unit.maxHp} HP) 🛡️ Spawn Guard: half damage for 1 round.`);

                        if (window.RenderBus) window.RenderBus.emit('unit:spawned', { unit });
                        continue;
                    }

                    /* Spawn Zone respawn: fixed tile, full HP/MP */
                    const zoneArr = state.spawnZones?.[unit.player];
                    const spawnIdx = unit._spawnIndex ?? 0;
                    const zoneTile = zoneArr?.[spawnIdx];

                    if (zoneTile) {
                        /* Push enemy off tile if occupied */
                        const blocker = state.units.find(u => !u.dead && u.x === zoneTile.x && u.y === zoneTile.y && u.id !== unit.id);
                        if (blocker) {
                            if (blocker.player !== unit.player) {
                                pushUnitToNearestOpen(blocker, zoneTile.x, zoneTile.y);
                                addLog(`⚡ ${unitDisplayName(blocker)} is pushed out of spawn zone!`);
                            } else {
                                /* Friendly on tile — find nearest open zone tile */
                                let placed = false;
                                for (const zt of zoneArr) {
                                    if (!state.units.some(u => !u.dead && u.x === zt.x && u.y === zt.y)) {
                                        unit.x = zt.x;
                                        unit.y = zt.y;
                                        unit.z = (typeof nearestWalkableZ === 'function') ? nearestWalkableZ(zt.x, zt.y) : 0;
                                        placed = true;
                                        break;
                                    }
                                }
                                if (!placed) {
                                    pushUnitToNearestOpen(unit, zoneTile.x, zoneTile.y);
                                    placed = true;
                                }
                                unit.dead = false;
                                unit._dying = false;
                                unit.hp = unit.maxHp;
                                unit.mp = unit.maxMp;
                                unit.shield = 0;
                                unit.ap = 0;
                                unit.status = { spawnGuard: 1 };
                                unit._respawnIn = null;
                                unit._justRespawned = true;
                                unit._showRespawnBanner = true;
                                addLog(`🔄 ${unitDisplayName(unit)} has respawned at spawn zone! (${unit.hp}/${unit.maxHp} HP) 🛡️ Spawn Guard: half damage for 1 round.`);
                                if (window.RenderBus) window.RenderBus.emit('unit:spawned', { unit });
                                continue;
                            }
                        }

                        unit.x = zoneTile.x;
                        unit.y = zoneTile.y;
                        unit.z = (typeof nearestWalkableZ === 'function') ? nearestWalkableZ(zoneTile.x, zoneTile.y) : 0;
                    } else {
                        /* Fallback: spiral from tower if no zone */
                        const tower = getTower(unit.player);
                        let anchorX, anchorY;
                        if (tower) { anchorX = tower.x; anchorY = tower.y; }
                        else if (SPAWNS?.[unit.player]?.[0]) { anchorX = SPAWNS[unit.player][0].x; anchorY = SPAWNS[unit.player][0].y; }
                        else continue;

                        let placed = false;
                        for (let radius = 0; radius <= Math.max(bw(), bh()) && !placed; radius++) {
                            for (let dy = -radius; dy <= radius && !placed; dy++) {
                                for (let dx = -radius; dx <= radius && !placed; dx++) {
                                    if (radius > 0 && Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
                                    const nx = anchorX + dx, ny = anchorY + dy;
                                    if (nx < 0 || ny < 0 || ny >= floorTerrain.length || nx >= (floorTerrain[0]?.length || 0)) continue;
                                    const t = floorTerrain[ny][nx];
                                    const tRule = getTerrainRule(t || 'grass');
                                    if (tRule.passable === false) continue;
                                    if (state.units.some(o => o !== unit && !o.dead && o.x === nx && o.y === ny)) continue;
                                    unit.x = nx; unit.y = ny;
                                    unit.z = (typeof nearestWalkableZ === 'function') ? nearestWalkableZ(nx, ny) : (state.boardHeights?.[ny]?.[nx] ?? 0);
                                    placed = true;
                                }
                            }
                        }
                        if (!placed) continue;
                    }

                    unit.dead = false;
                    unit._dying = false;
                    unit.hp = unit.maxHp;
                    unit.mp = unit.maxMp;
                    unit.shield = 0;
                    unit.ap = 0;
                    unit.status = { spawnGuard: 1 };
                    unit._respawnIn = null;
                    unit._justRespawned = true;
                    unit._showRespawnBanner = true;
                    addLog(`🔄 ${unitDisplayName(unit)} has respawned at spawn zone! (${unit.hp}/${unit.maxHp} HP) 🛡️ Spawn Guard: half damage for 1 round.`);

                    if (window.RenderBus) window.RenderBus.emit('unit:spawned', { unit });
                }
            }
        }

        function showDeathBanner(deadUnit, killer) {
            if (state.devAutoSim) return;
            if (_bufferingRoundEvents) {

                _rePushEvent({
                    type: 'deathBanner',
                    deadUnit: { name: deadUnit.name, cls: deadUnit.cls, player: deadUnit.player, _respawnIn: deadUnit._respawnIn, _isBoss: deadUnit._isBoss },
                    killer: killer ? { name: killer.name, cls: killer.cls } : null
                });
                return;
            }
            _realShowDeathBanner_impl(deadUnit, killer);
        }

        const _centerBannerQueue = [];
        let _centerBannerActive = false;

        function _queueCenterBanner(buildFn, durationMs) {
            _centerBannerQueue.push({ buildFn, durationMs });
            _drainCenterBannerQueue();
        }

        function _drainCenterBannerQueue() {
            if (_centerBannerActive || _centerBannerQueue.length === 0) return;

            if (typeof isCinematicActive === 'function' && isCinematicActive()) {
                setTimeout(_drainCenterBannerQueue, 400);
                return;
            }
            _centerBannerActive = true;
            const { buildFn, durationMs } = _centerBannerQueue.shift();
            const el = buildFn();
            if (!el) {
                _centerBannerActive = false;
                _drainCenterBannerQueue();
                return;
            }
            document.body.appendChild(el);
            setTimeout(() => {
                if (el.parentNode) el.remove();
                _centerBannerActive = false;
                _drainCenterBannerQueue();
            }, durationMs);
        }

        function isCenterBannerBusy() {
            return _centerBannerActive || _centerBannerQueue.length > 0;
        }

        function _realShowDeathBanner_impl(deadUnit, killer) {
            if (state.devAutoSim) return;
            _queueCenterBanner(() => {
                const banner = document.createElement('div');
                banner.className = 'death-banner';
                const killerText = killer ? `by ${escapeHtml(killer.name || killer.cls)}` : '';
                const isEnemy = deadUnit.player !== getViewerPlayer();
                banner.innerHTML = `
            <div class="death-banner-icon">${isEnemy ? '⚔' : '💀'}</div>
            <div class="death-banner-text">
              <div class="death-banner-name">${escapeHtml(deadUnit.name || deadUnit.cls)}</div>
              <div class="death-banner-sub">${isEnemy ? 'DEFEATED' : 'FALLEN'} ${killerText} · Respawn in ${deadUnit._respawnIn || '?'} rnd</div>
            </div>
          `;
                banner.style.borderColor = isEnemy ? 'rgba(85,211,138,0.6)' : 'rgba(255,80,80,0.6)';
                return banner;
            }, 2200);
        }

        function showCombatBanner(title, subtitle, kind) {
            if (state.devAutoSim) return;
            if (_bufferingRoundEvents) {
                _rePushEvent({ type: 'combatBanner', title, subtitle, kind });
                return;
            }
            _realShowCombatBanner_impl(title, subtitle, kind);
        }
        function _realShowCombatBanner_impl(title, subtitle, kind) {
            if (state.devAutoSim) return;
            _queueCenterBanner(() => {
                const banner = document.createElement('div');
                banner.className = 'combat-banner';
                const borderColor = kind === 'protect' ? 'rgba(95,199,255,0.7)' :
                    kind === 'pickup-friendly' ? 'rgba(184,160,96,0.7)' :
                    kind === 'pickup-enemy' ? 'rgba(152,80,80,0.7)' :
                    'rgba(200,180,150,0.5)';
                banner.style.borderColor = borderColor;
                banner.innerHTML = `
            <div class="combat-banner-title">${title}</div>
            <div class="combat-banner-sub">${subtitle}</div>
          `;
                return banner;
            }, 2200);
        }

        function createUnit(id, player, x, y, template, loadout = emptyLoadout(), identityOverride = null) {
            const identity = resolveIdentityForBuild(template.cls, identityOverride || {});
            const stats = computeUnitStats(identity.race, template.cls);
            const equip = (loadout.equipment && Object.values(loadout.equipment).some(v => v)) ? loadout.equipment : getDefaultEquipment(template.cls);

            equip.handL = null;
            const newUnit = {
                id,
                player,
                x,
                y,
                z: (typeof nearestWalkableZ === 'function') ? nearestWalkableZ(x, y) : 0,
                name: template.cls,
                cls: template.cls,
                job: normalizeJobName(template.job || template.cls),
                faction: identity.faction,
                race: identity.race,
                types: [...identity.types],
                gender: identity.gender,
                zodiac: identity.zodiac,
                sleepPreference: identity.sleepPreference,
                terrainPreference: identity.terrainPreference,
                weatherPreference: identity.weatherPreference,
                dominantHand: identity.dominantHand || 'right',
                baseUnit: {
                    faction: identity.faction,
                    race: identity.race,
                    job: normalizeJobName(template.job || template.cls),
                    types: [...identity.types],
                    gender: identity.gender,
                    zodiac: identity.zodiac,
                    sleepPreference: identity.sleepPreference,
                    terrainPreference: identity.terrainPreference,
                    weatherPreference: identity.weatherPreference,
                    dominantHand: identity.dominantHand || 'right'
                },
                hp: stats.hp,
                maxHp: stats.hp,
                mp: stats.mp,
                maxMp: stats.mp,
                atk: stats.atk,
                def: stats.def,
                mdef: stats.mdef || 0,
                range: stats.range + (template.cls === 'Sniper' ? 1 : 0),
                move: stats.move,
                inspect: stats.inspect,
                awr: stats.awr,
                intStat: stats.int,
                spd: stats.spd + (template.cls === 'Gunslinger' ? 1 : 0),
                armor: template.cls === 'Warrior' ? 5 : 0,
                spellPower: template.cls === 'Black Mage' ? 8 : 0,
                healBonus: template.cls === 'White Mage' ? 24 : 0,
                items: Object.fromEntries(Object.keys(ITEM_RULES).map(k => [k, loadout.items?.[k] || 0])),
                spells: [],
                _spellSlots: [],
                _secondaryJob: null,
                _pendingSecondaryJobPick: false,
                _shopPurchases: [],
                bombs: [],
                terrainStay: {
                    lastTerrain: 'grass',
                    grass: 0
                },
                hourglasses: 0,
                hourglassBuff: 0,
                ap: UNIT_MAX_AP,
                movesThisTurn: 0,
                dead: false,
                status: {},
                reviveLocked: false,
                statStages: {
                    atk: 0,
                    def: 0,
                    spd: 0
                },
                shield: 0,
                equipment: equip,
                floor: 'ground',
                gold: 0,
                _xp: 0,
                _xpBonusAP: 0,
                _xpBuffsApplied: {},
                _raceAbilities: [],
                _spawnIndex: 0,
                _recallCooldown: 0
            };

            // Level 100: snapshot the level-1 base max HP/MP so level scaling can
            // recompute them from base × levelScale(). Equipment / secondary-job
            // max HP/MP bonuses accumulate in _bonusMaxHp/_bonusMaxMp so they
            // survive a re-scale (see _recomputeStatsForLevel in battle.js).
            newUnit._baseStats = { maxHp: newUnit.maxHp, maxMp: newUnit.maxMp };
            newUnit._bonusMaxHp = 0;
            newUnit._bonusMaxMp = 0;

            const _availableRaceAbilities = (typeof RACE_ABILITIES !== 'undefined' && RACE_ABILITIES[identity.race])
                ? RACE_ABILITIES[identity.race]
                    .filter(a => !a.jobRequirement || a.jobRequirement === template.cls)
                : [];
            newUnit._availableRaceAbilities = _availableRaceAbilities.map(a => a.id);

            applyLevelUpRewards(newUnit, 1);

            /* Mystery Dungeon reuses the campaign leveling pipeline for its
               floor-scaled enemies (partyMeta._campaignEnemyLevel). */
            const _isCampaign = (typeof state !== 'undefined') && (state.isCampaign || !!state._mdRun);
            const _campaignLevel = identityOverride?._campaignLevel || identityOverride?._campaignEnemyLevel || 0;

            if (_isCampaign && _campaignLevel > 0) {
                const targetLevel = Math.min(_campaignLevel, XP_MAX_LEVEL);
                const _secJobLvl = (typeof SECONDARY_JOB_LEVEL !== 'undefined') ? SECONDARY_JOB_LEVEL : 15;

                // Secondary job first — its flat bonuses ride on top of the scaled
                // stats that setUnitLevel() computes from base.
                if (targetLevel >= _secJobLvl) {
                    const metaSecJob = identityOverride?.secondaryJob || null;
                    if (metaSecJob) {
                        applySecondaryJob(newUnit, metaSecJob);
                    } else {
                        aiPickSecondaryJob(newUnit);
                    }
                }

                // One call scales HP/MP for the level and applies every spell
                // unlock / AP milestone from 2..targetLevel.
                setUnitLevel(newUnit, targetLevel);

                const startXp = identityOverride?._campaignXp || identityOverride?._campaignEnemyXp || 0;
                if (startXp > 0) {
                    newUnit._xp = startXp;
                    newUnit._lvlCacheXp = undefined; // force level recache from roster xp
                }
                newUnit.hp = newUnit.maxHp;
                newUnit.mp = newUnit.maxMp;

                if (identityOverride?._campaignRosterId) {
                    newUnit._campaignRosterId = identityOverride._campaignRosterId;
                    newUnit._campaignStartXp = newUnit._xp;
                    newUnit._campaignStartLevel = targetLevel;
                }

                const _customSpells = Array.isArray(identityOverride?.customSpells) ? identityOverride.customSpells : null;
                if (_customSpells && _customSpells.length > 0) {
                    const _slotCap = (typeof SPELL_SLOT_MAX !== 'undefined') ? SPELL_SLOT_MAX : 6;
                    // Slot-budget aware: spells occupy 1-3 slots; over-budget
                    // saved builds are trimmed gracefully (later picks that no
                    // longer fit are skipped, earlier picks are kept).
                    const _secJobForBudget = newUnit._secondaryJob || identityOverride?.secondaryJob || '';
                    let _validIds;
                    if (typeof trimSpellIdsToSlotBudget === 'function') {
                        _validIds = trimSpellIdsToSlotBudget(_customSpells, template.cls, _secJobForBudget, _slotCap);
                    } else {
                        const _seen = new Set();
                        _validIds = [];
                        for (const sid of _customSpells) {
                            if (!sid || _seen.has(sid)) continue;
                            const sp = (typeof getSpellById === 'function') ? getSpellById(sid) : null;
                            if (!sp || sp.kind === 'basicAttack') continue;
                            _seen.add(sid);
                            _validIds.push(sid);
                            if (_validIds.length >= _slotCap) break;
                        }
                    }
                    if (_validIds.length > 0) {
                        newUnit._spellSlots = _validIds.slice();
                        newUnit.spells = _validIds.map(id => {
                            const sp = getSpellById(id);
                            return sp ? { ...sp } : null;
                        }).filter(Boolean);
                    }
                }
            }

            else {
            const _cuMode = (typeof getActiveMultiplayerMode === 'function') ? getActiveMultiplayerMode() : null;
            if (_cuMode) {
                // PvP normalization: every unit is built at the level cap so all
                // competitive modes are level-100 vs level-100.
                const targetLevel = (typeof MODE_LEVEL_RULES !== 'undefined') ? MODE_LEVEL_RULES.pvpNormalizedLevel : XP_MAX_LEVEL;
                const _secJobLvl = (typeof SECONDARY_JOB_LEVEL !== 'undefined') ? SECONDARY_JOB_LEVEL : 15;

                if (targetLevel >= _secJobLvl) {
                    const metaSecJob = identityOverride?.secondaryJob || null;
                    if (metaSecJob) {
                        applySecondaryJob(newUnit, metaSecJob);
                    } else {
                        aiPickSecondaryJob(newUnit);
                    }
                }

                setUnitLevel(newUnit, targetLevel);

                newUnit.hp = newUnit.maxHp;
                newUnit.mp = newUnit.maxMp;

                const _customSpells = Array.isArray(identityOverride?.customSpells) ? identityOverride.customSpells : null;
                if (_customSpells && _customSpells.length > 0) {
                    const _slotCap = (typeof SPELL_SLOT_MAX !== 'undefined') ? SPELL_SLOT_MAX : 6;
                    // Slot-budget aware: spells occupy 1-3 slots; over-budget
                    // saved builds are trimmed gracefully (later picks that no
                    // longer fit are skipped, earlier picks are kept).
                    const _secJobForBudget = newUnit._secondaryJob || identityOverride?.secondaryJob || '';
                    let _validIds;
                    if (typeof trimSpellIdsToSlotBudget === 'function') {
                        _validIds = trimSpellIdsToSlotBudget(_customSpells, template.cls, _secJobForBudget, _slotCap);
                    } else {
                        const _seen = new Set();
                        _validIds = [];
                        for (const sid of _customSpells) {
                            if (!sid || _seen.has(sid)) continue;
                            const sp = (typeof getSpellById === 'function') ? getSpellById(sid) : null;
                            if (!sp || sp.kind === 'basicAttack') continue;
                            _seen.add(sid);
                            _validIds.push(sid);
                            if (_validIds.length >= _slotCap) break;
                        }
                    }
                    if (_validIds.length > 0) {
                        newUnit._spellSlots = _validIds.slice();
                        newUnit.spells = _validIds.map(id => {
                            const sp = getSpellById(id);
                            return sp ? { ...sp } : null;
                        }).filter(Boolean);
                    }
                }
            }
            }

            // ── Accessory stat bonuses become REAL here ──────────────────────
            // computeEquipBonuses was previously only used for the party-builder
            // stat preview; in-battle units never received their statVal. Fold
            // the bonuses into the unit's base stats at build time so every
            // accessory's listed stat actually applies in combat.
            if (typeof computeEquipBonuses === 'function' && newUnit.equipment) {
                const _eqB = computeEquipBonuses(newUnit.equipment);
                // Route accessory max HP/MP into the persistent bonus pool so a
                // later level-up (which recomputes HP/MP from base) keeps them.
                if (_eqB.hp) { newUnit._bonusMaxHp = (newUnit._bonusMaxHp || 0) + _eqB.hp; newUnit.maxHp += _eqB.hp; newUnit.hp = newUnit.maxHp; }
                if (_eqB.mp) { newUnit._bonusMaxMp = (newUnit._bonusMaxMp || 0) + _eqB.mp; newUnit.maxMp += _eqB.mp; newUnit.mp = newUnit.maxMp; }
                newUnit.atk += _eqB.atk || 0;
                newUnit.def += _eqB.def || 0;
                newUnit.mdef = (newUnit.mdef || 0) + (_eqB.mdef || 0);
                newUnit.move += _eqB.move || 0;
                newUnit.awr = (newUnit.awr || 0) + (_eqB.awr || 0);
                newUnit.intStat = (newUnit.intStat || 0) + (_eqB.int || 0);
                newUnit.spd = (newUnit.spd || 0) + (_eqB.spd || 0);
            }

            // Grapnel Gauntlet: the accessory bakes the Grapple ability into the
            // unit's spell list (cheaper than the sailor version — it's hardware,
            // not technique). Added AFTER the loadout spell assignment above so
            // it can't be clobbered.
            if (unitHasAccessory(newUnit, 'grapnel_gauntlet') && typeof getSpellById === 'function') {
                const _grapple = getSpellById('raceGrapple');
                if (_grapple && !(newUnit.spells || []).some(s => s && s.id === 'raceGrapple')) {
                    if (!Array.isArray(newUnit.spells)) newUnit.spells = [];
                    newUnit.spells.push({ ..._grapple, cost: 12 });
                }
            }

            return newUnit;
        }

        function spellAllowedForClass(spell, cls) {
            if (!spell) return false;
            if (cls === 'Freelancer') return true;
            if (Array.isArray(spell.classRestrictions) && spell.classRestrictions.length) return spell.classRestrictions.includes(cls);
            if (spell.classRestriction) return spell.classRestriction === cls;
            return true;
        }

        function isSpellNativeToClass(spell, cls) {
            if (!spell || !cls) return false;

            if (cls === 'Freelancer') return true;
            if (spell._isRaceAbility) return true;
            if (spell.classRestriction === cls) return true;
            if (Array.isArray(spell.classRestrictions) && spell.classRestrictions.includes(cls)) return true;
            if (!spell.classRestriction && !spell.classRestrictions && spell.school === cls) return true;
            return false;
        }

        function countCrossClassSpells(spellIds, cls) {
            let count = 0;
            for (const id of spellIds) {
                if (!id) continue;
                const spell = getSpellById(id);
                if (spell && !isSpellNativeToClass(spell, cls)) count++;
            }
            return count;
        }

        function getEligibleSpellsForClass(cls, race) {
            const spells = SPELL_LIBRARY.filter(spell => spellAllowedForClass(spell, cls));

            if (race && typeof RACE_ABILITIES !== 'undefined' && RACE_ABILITIES[race]) {
                const raceSpells = RACE_ABILITIES[race].filter(a =>
                    !a.jobRequirement || a.jobRequirement === cls
                );

                const ids = new Set(spells.map(s => s.id));
                for (const rs of raceSpells) {
                    if (!ids.has(rs.id)) spells.push(rs);
                }
            }
            return spells;
        }

        function getSpellById(spellId) {
            return spellId ? SPELL_BY_ID[spellId] || null : null;
        }

        function adjustSpellForClass(spell, cls) {
            if (!spell) return null;
            const copy = JSON.parse(JSON.stringify(spell));
            if (cls === 'White Mage' && (copy.kind === 'heal' || copy.kind === 'revive')) {
                copy.range = Math.min(bmax() * 2, copy.range + 2);
            }
            return copy;
        }

        const ME_TERRAIN_IDS = [
            null,
            'grass',
            'water',
            'deep_water',
            'bridge',
            'mountain',
            'desert',
            'tree',
            'dirt',
            'ice',
            'lava',
            'scorched',
            'well',
            'road',
            'ruins',
            'crystal',
            'mushroom',
            'obsidian',
            'healing_spring',
            'cave_floor',
            'cave_wall',
            'cave_entrance',
            'cloud',
            'cloud_thick',
            'sky_open',
            'storm',
            'cloud_gap',
            'sky_ruin',
            'mountain_top',
            'tree_top',
            'cliff',
            'chasm',
            'void',
            'fog_wall',
            'barrier',
            'barrier_passage',
            'nexus',
            'nexus_cave',
            'nexus_sky',
            'sanctuary_church',
            'sanctuary_shop',
            'tower_base',
            'home_base',
            'beanstalk',
            'beanstalk_top',
            'descent_point',
            'sanctuary',
            'purple_grass',
            'grass_2',
            'wasteland',
            'forest_2',
            'mountain_2',
            'poison',
            'forest',
            'bricks_1',
            'bricks_2',
            'wood_planks',
            'wood',
            'rubble_1',
            'rubble_2',
            'rubble_3',
            'rubble_4',
            'poison_bog',
            'rocks_1',
            'rocks_2',
            'rocks_3',
            'rocks_4',
            'rocks_5',
            'rock_wall_1',
            'rock_wall_2',
            'dark_woods',
            'urban_wall',
            'grass_rocky',
            'purple_bog',
            'urban_street',
            'moon',
            'carpet',
            'gold',
            'metal',
            'leaves',
            'wallpaper',
            'cloud_2',
            // 2026-06 R2 batch — append-only (indices are saved-map grid ids)
            'moon_2',
            'moon_3',
            'carpet_2',
            'carpet_3',
            'carpet_4',
            'gold_2',
            'gold_3',
            'metal_2',
            'grass_3',
            'grass_4',
            'dirt_2',
            'dirt_3',
            'dirt_4',
            'marble',
            'marble_2',
            'cobblestone',
            'cobblestone_2',
            'leaves_2',
            'leaves_3',
            'leaves_4',
            'leaves_5',
            'aluminium',
            'checkerboard',
            // 2026-06 R2 batch — append-only (indices are saved-map grid ids)
            'dungeon',
            'dungeon_2',
            'dungeon_3',
            'dungeon_4',
            'flesh',
            'flesh_2',
            'flesh_3',
            'drywall',
            'drywall_2',
            'drywall_3',
            'drywall_4',
            'metal_3',
            // 2026-07-08 — append-only. The full R2 terrain-folder batch that was
            // registered in sprites.js as texture-only keys, now placeable in the
            // editor (⚠ keep data.js MF_TID mirrored).
            'bricks_3',
            'marble_light',
            'leather',
            'leather_2',
            'enamel_2',
            'mars',
            'mars_2',
            'fur',
            'fur_2',
            'fur_3',
            'skin',
            'rubber',
            'rubber_2',
            'damask',
            'damask_2',
            'damask_3',
            'damask_4',
            'floral',
            'floral_2',
            'diamond',
            'brokenglass',
            'gunmetal',
            'gunmetal_2',
            'copper',
            'concrete_floor',
            'checkerboard_2',
            'checkerboard_3',
            'drywall_5',
            'dirt_slope',
            'grass_dark_fantasy',
            'rocks_dark_fantasy',
            'ice_1',
            'igloo',
            'latticegarden',
            'noise',
            'tigerfur',
            'tigerfur_2',
            'tilefloor',
            'tilefloor_2',
        ];

        const ME_TERRAIN_TO_ID = {};
        ME_TERRAIN_IDS.forEach((key, idx) => { if (key) ME_TERRAIN_TO_ID[key] = idx; });

        const ME_OBJECT_IDS = [
            null,
            'tree',
            'ruins',
            'church',
            'shop',
            'nexus',
            'nexus_cave',
            'nexus_sky',
            'mountain_top',
            'beanstalk',
            'well',
            'cave_entrance',
            'barrier_1',
            'barrier_2',
            'barrier_3',
            'barrier_4',
            'barrier_5',
            'column_1',
            'column_2',
            'column_3',
            'column_4',
            'building_1',
            'building_2',
            'building_3',
            'building_4',
            'building_5',
            'building_6',
            'building_7',
            'building_8',
            'building_9',
            'building_10',
            'church_1',
            'church_2',
            'poison_seed',
            'tree_2',
            'tree_3',
            'tree_4',
            'tree_5',
            'tree_6',
            'tower_cube',
            'building_11',
            'ancient_building',
            'abandoned_building_1',
            'abandoned_building_2',
            'stairs',
            'pathway_1',
            'pathway_2',
            'stairs_2',
            'lamp_post',
            'lamp_post_2',
            'grass_tuft',
            // 2026-06 — append-only (indices are saved-map object ids)
            'rock',
            // 2026-07 — 3D wood-and-rope torch (floor or Minecraft-style wall
            // mount via entry.leaf; see _buildTorch3D in three-renderer.js)
            'torch',
            // 2026-07 — cosmetic 3D traffic light; its red/yellow/green lamps
            // cycle between rounds (see _buildTrafficLight3D in three-renderer.js)
            'traffic_light',
            // 2026-07-08 — spell-prop 3D models exposed as placeable decorations
            // (⚠ keep data.js MF_OID mirrored; renders wired in three-renderer.js)
            'gravestone',
            'bone_pile',
            'bone_wall',
            'atlantis_pillar',
            'totem_pole',
            'federation_beacon',
        ];
        const ME_OBJECT_TO_ID = {};
        ME_OBJECT_IDS.forEach((key, idx) => { if (key) ME_OBJECT_TO_ID[key] = idx; });

        const ME_PALETTE_CATS = [
            { label: 'Ground', keys: ['grass','grass_2','grass_3','grass_4','grass_rocky','grass_dark_fantasy','purple_grass','purple_bog','dirt','dirt_2','dirt_3','dirt_4','dirt_slope','road','cobblestone','cobblestone_2','desert','wasteland','dark_woods','mushroom','crystal','obsidian','healing_spring','scorched','poison','poison_bog','well'] },
            { label: 'Rocky', keys: ['rocks_1','rocks_2','rocks_3','rocks_4','rocks_5','rocks_dark_fantasy','rubble_1','rubble_2','rubble_3','rubble_4'] },
            { label: 'Urban', keys: ['bricks_1','bricks_2','bricks_3','marble','marble_2','marble_light','checkerboard','wood_planks','wood','urban_street','urban_wall','metal','metal_2','metal_3','aluminium','gold','gold_2','gold_3','carpet','carpet_2','carpet_3','carpet_4','wallpaper','drywall','drywall_2','drywall_3','drywall_4','drywall_5'] },
            { label: 'Floors', keys: ['tilefloor','tilefloor_2','concrete_floor','checkerboard_2','checkerboard_3','latticegarden','igloo'] },
            { label: 'Metal & Glass', keys: ['gunmetal','gunmetal_2','copper','diamond','brokenglass','noise'] },
            { label: 'Fabric & Hide', keys: ['leather','leather_2','fur','fur_2','fur_3','tigerfur','tigerfur_2','skin','rubber','rubber_2','enamel_2','damask','damask_2','damask_3','damask_4','floral','floral_2'] },
            { label: 'Dungeon', keys: ['dungeon','dungeon_2','dungeon_3','dungeon_4'] },
            { label: 'Flesh', keys: ['flesh','flesh_2','flesh_3'] },
            { label: 'Walls', keys: ['rock_wall_1','rock_wall_2'] },
            { label: 'Water', keys: ['water','deep_water','bridge','ice','ice_1'] },
            { label: 'Lava', keys: ['lava'] },
            { label: 'Mountain', keys: ['mountain','mountain_2','cliff'] },
            { label: 'Cave', keys: ['cave_floor','cave_wall','cave_entrance'] },
            { label: 'Foliage', keys: ['forest','forest_2','leaves','leaves_2','leaves_3','leaves_4','leaves_5','ruins'] },
            { label: 'Lunar & Mars', keys: ['moon','moon_2','moon_3','mars','mars_2'] },
            { label: 'Sky', keys: ['cloud','cloud_2','cloud_thick','sky_open','storm','cloud_gap','sky_ruin','tree_top'] },
            { label: 'Special', keys: ['void','chasm','fog_wall','barrier','barrier_passage'] },
            { label: '⚙ Structures', keys: ['sanctuary','descent_point'], isGameMode: true },
        ];

        const ME_OBJECT_CATS = [
            { label: '⚙ Game Mode', keys: ['tower_cube','church','shop','nexus','nexus_cave','nexus_sky'], isGameMode: true },
            { label: 'Nature', keys: ['tree','rock','grass_tuft','ruins','mountain_top','beanstalk','well','cave_entrance','poison_seed'] },
            { label: 'Trees', keys: ['tree','tree_2','tree_3','tree_4','tree_5','tree_6'] },
            { label: 'Rocks', keys: ['rock'] },
            { label: 'Barriers', keys: ['barrier_1','barrier_2','barrier_3','barrier_4','barrier_5'] },
            { label: 'Columns', keys: ['column_1','column_2','column_3','column_4'] },
            { label: 'Buildings', keys: ['building_1','building_2','building_3','building_4','building_5','building_6','building_7','building_8','building_9','building_10','building_11','ancient_building','abandoned_building_1','abandoned_building_2'] },
            { label: 'Churches', keys: ['church_1','church_2'] },
            { label: 'Paths', keys: ['stairs','stairs_2','pathway_1','pathway_2'] },
            { label: 'Props', keys: ['lamp_post','lamp_post_2','torch','traffic_light'] },
            { label: 'Spell Props', keys: ['gravestone','bone_pile','bone_wall','atlantis_pillar','totem_pole','federation_beacon'] },
        ];

        let _meW = 12, _meH = 12;
        let _meGrid = null;
        let _meObjects = null;
        let _meSpawns = { 1: [], 2: [] };
        let _meSanctuaryZones = null;
        let _meHeights = null;
        let _meTool = 'paint';
        let _meSelectedTerrain = 'grass';
        let _meSelectedObject = 'tree';
        let _meSelectedAlignX = 'center';
        let _meSelectedAlignY = 'bottom';
        let _meSelectedRot = 0;
        let _meSelectedFlipX = false;
        let _meSelectedFlipY = false;
        let _meSelectedHeight = 1;
        let _meMouseDown = false;
        let _mePaletteTab = 'terrain';
        /* Per-terrain colour tints chosen with the editor's colour wheel:
           { terrainKey: '#rrggbb' }. Multiplied onto that terrain's sprites by
           three-renderer (_evTintMat reads state.terrainTints). */
        let _meTerrainTints = {};
        let _meTintKey = null;          // terrain key the wheel is currently editing
        let _meTintH = 0, _meTintS = 0, _meTintV = 100;   // wheel state (HSV)
        let _meTintRebuildRAF = 0;
        let _me3DPreview = false;

        /* ── Esoteric monuments (reused _hz* background geometry as on-board
           landmarks). Stored as {kind,x,y,foot,maxH,seed}. Climbable kinds stamp
           voxels at play time (see _stampMonumentCollision). ───────────────── */
        const ME_MONUMENT_KINDS = [
            { kind: 'monolith',    label: 'Monolith',        emoji: '🗿', foot: 1, maxH: 3 },
            { kind: 'obelisk',     label: 'Obelisk',         emoji: '🗼', foot: 1, maxH: 4 },
            { kind: 'pyramid',     label: 'Great Pyramid',   emoji: '🔺', foot: 5, maxH: 3 },
            { kind: 'pyramid_cone',label: 'Cone Pyramid',    emoji: '⛰️', foot: 3, maxH: 3 },
            { kind: 'ziggurat',    label: 'Ziggurat',        emoji: '🏛️', foot: 5, maxH: 3 },
            { kind: 'colossus',    label: 'Colossus',        emoji: '🗽', foot: 2, maxH: 4 },
            { kind: 'stairway',    label: 'Stairway',        emoji: '🪜', foot: 2, maxH: 3 },
            { kind: 'arch',        label: 'Arch',            emoji: '🌉', foot: 3, maxH: 3 },
            { kind: 'gateway',     label: 'Gateway',         emoji: '⛩️', foot: 3, maxH: 3 },
            { kind: 'greek',       label: 'Greek Ruin',      emoji: '🏛️', foot: 3, maxH: 2 },
            { kind: 'crystal',     label: 'Crystal Shards',  emoji: '💎', foot: 2, maxH: 3 },
            { kind: 'rings',       label: 'Sacred Rings',    emoji: '🌀', foot: 2, maxH: 3 },
            { kind: 'island',      label: 'Floating Island', emoji: '🏝️', foot: 3, maxH: 3 },
            { kind: 'mountain',    label: 'Mountain',        emoji: '🏔️', foot: 4, maxH: 4 },
            { kind: 'flag',        label: 'Flag',            emoji: '🚩', foot: 1, maxH: 2 },
            { kind: 'rover',       label: 'Rover',           emoji: '🛻', foot: 1, maxH: 1 },
            { kind: 'goldgate',    label: 'Golden Gate',     emoji: '🌁', foot: 3, maxH: 3 },
            { kind: 'lightpillar', label: 'Light Pillar',    emoji: '🔆', foot: 1, maxH: 4 },
            { kind: 'fluorescent', label: 'Fluorescent',     emoji: '💡', foot: 1, maxH: 2 },
            { kind: 'exitsign',    label: 'Exit Sign',       emoji: '🚪', foot: 1, maxH: 1 },
            // 2026-07 prop foundry — per-map signature lore pieces
            { kind: 'lenticular',  label: 'Lenticular Cloud', emoji: '🛸', foot: 3, maxH: 6 },
            { kind: 'trilithon',   label: 'Trilithon',       emoji: '🪨', foot: 2, maxH: 3 },
            { kind: 'wickerman',   label: 'Wicker Man',      emoji: '🔥', foot: 2, maxH: 4 },
            { kind: 'sphinx',      label: 'Sphinx',          emoji: '🐈', foot: 3, maxH: 2 },
            { kind: 'ankh',        label: 'Ankh',            emoji: '☥', foot: 1, maxH: 3 },
            { kind: 'bus',         label: 'School Bus',      emoji: '🚌', foot: 2, maxH: 2 },
            { kind: 'mannequin',   label: 'Mannequin',       emoji: '🧍', foot: 1, maxH: 2 },
            { kind: 'throne',      label: 'Empty Throne',    emoji: '👑', foot: 2, maxH: 3 },
            { kind: 'seraph',      label: 'Seraph Statue',   emoji: '👼', foot: 2, maxH: 3 },
            { kind: 'bonearch',    label: 'Bone Arch',       emoji: '🦴', foot: 3, maxH: 2 },
            { kind: 'brazier',     label: 'Brazier',         emoji: '🕯️', foot: 1, maxH: 2 },
            { kind: 'holoboard',   label: 'Holo Billboard',  emoji: '📺', foot: 2, maxH: 4 },
            { kind: 'hovercar',    label: 'Hover Car',       emoji: '🚗', foot: 2, maxH: 1 },
            { kind: 'excalibur',   label: 'Sword in Stone',  emoji: '⚔️', foot: 1, maxH: 3 },
            { kind: 'dragonskull', label: 'Dragon Skull',    emoji: '🐲', foot: 2, maxH: 2 },
            { kind: 'blimp',       label: 'Blimp',           emoji: '🎈', foot: 3, maxH: 7 },
            { kind: 'jumbotron',   label: 'Jumbotron',       emoji: '🖥️', foot: 3, maxH: 4 },
            { kind: 'trident',     label: 'Trident',         emoji: '🔱', foot: 1, maxH: 4 },
            { kind: 'shipwreck',   label: 'Shipwreck',       emoji: '⛵', foot: 3, maxH: 2 },
            { kind: 'babelcrane',  label: 'Ancient Crane',   emoji: '🏗️', foot: 2, maxH: 4 },
            { kind: 'tablet',      label: 'Law Tablet',      emoji: '📜', foot: 1, maxH: 2 },
            { kind: 'zeusbolt',    label: 'Zeus Bolt',       emoji: '⚡', foot: 1, maxH: 3 },
            { kind: 'cydoniaface', label: 'Cydonia Face',    emoji: '🗿', foot: 3, maxH: 2 },
            { kind: 'biodome',     label: 'Biodome',         emoji: '🫧', foot: 3, maxH: 2 },
            { kind: 'saucer',      label: 'Saucer',          emoji: '🛸', foot: 3, maxH: 3 },
            { kind: 'radardish',   label: 'Radar Dish',      emoji: '📡', foot: 2, maxH: 3 },
            { kind: 'whalebones',  label: 'Whalefall',       emoji: '🐋', foot: 3, maxH: 2 },
            { kind: 'cattleskull', label: 'Cattle Skull',    emoji: '💀', foot: 1, maxH: 3 },
            { kind: 'windmill',    label: 'Windpump',        emoji: '🌬️', foot: 2, maxH: 4 },
            { kind: 'innersun',    label: 'Inner Sun',       emoji: '☀️', foot: 2, maxH: 7 },
            { kind: 'fossil',      label: 'Fossil',          emoji: '🦕', foot: 3, maxH: 2 },
            { kind: 'toadstool',   label: 'Toadstool',       emoji: '🍄', foot: 2, maxH: 3 },
            { kind: 'fairyring',   label: 'Fairy Ring',      emoji: '🧚', foot: 2, maxH: 2 },
            { kind: 'lander',      label: 'Lunar Lander',    emoji: '🚀', foot: 2, maxH: 3 },
            { kind: 'serpenthead', label: 'Serpent Head',    emoji: '🐍', foot: 2, maxH: 3 },
            { kind: 'holopyramid', label: 'Holo Pyramid',    emoji: '🔻', foot: 2, maxH: 4 },
            { kind: 'geode',       label: 'Geode',           emoji: '🔮', foot: 2, maxH: 2 },
            { kind: 'basilicadome',label: 'Basilica Dome',   emoji: '⛪', foot: 3, maxH: 4 },
            { kind: 'censer',      label: 'Censer',          emoji: '🪔', foot: 1, maxH: 3 },
            { kind: 'owlidol',     label: 'Owl Idol',        emoji: '🦉', foot: 2, maxH: 4 },
            { kind: 'effigy',      label: 'Effigy',          emoji: '🪦', foot: 2, maxH: 1 },
            { kind: 'tpillar',     label: 'T-Pillar',        emoji: '🇹', foot: 1, maxH: 3 },
            { kind: 'handbag',     label: 'Gods\' Handbag',  emoji: '👜', foot: 2, maxH: 2 },
            { kind: 'greytube',    label: 'Specimen Tank',   emoji: '🧪', foot: 1, maxH: 3 },
            { kind: 'blastdoor',   label: 'Blast Door',      emoji: '🚪', foot: 2, maxH: 3 },
            { kind: 'shiva',       label: 'Dancer Statue',   emoji: '🕉️', foot: 2, maxH: 3 },
            { kind: 'beamring',    label: 'Beamline',        emoji: '🧲', foot: 3, maxH: 2 },
            { kind: 'wetfloorsign',label: 'Wet Floor Sign',  emoji: '⚠️', foot: 1, maxH: 1 },
            { kind: 'securitycam', label: 'Security Camera', emoji: '📹', foot: 1, maxH: 3 },
            { kind: 'sleigh',      label: 'Sleigh',          emoji: '🛷', foot: 2, maxH: 2 },
            { kind: 'candycane',   label: 'Candy Pole',      emoji: '🍬', foot: 1, maxH: 3 },
            { kind: 'weatherballoon', label: 'Weather Balloon', emoji: '🎈', foot: 2, maxH: 7 },
            { kind: 'roadsign',    label: 'Road Sign',       emoji: '🛑', foot: 1, maxH: 3 },
        ];
        const ME_MON_BY_KIND = {};
        ME_MONUMENT_KINDS.forEach(m => { ME_MON_BY_KIND[m.kind] = m; });

        let _meMonuments = [];
        let _meSelectedMonument = 'monolith';
        let _meMonFoot = null;   // null → use the kind's default footprint
        let _meMonMaxH = null;   // null → use the kind's default max height
        let _meSelectedLeaf = 'leaves';           // per-tree leaf sprite the brush stamps
        const ME_LEAF_OPTIONS = ['leaves','leaves_2','leaves_3','leaves_4','leaves_5'];
        /* Per-rock texture the brush stamps. Stored on the placed object in the
           SAME entry.leaf field trees use (it's the generic "texture variant"
           slot) — so a placed rock carries leaf='rocks_3', etc. */
        let _meSelectedRockTex = 'rocks_1';
        /* rocks_1..5 plus the lunar regolith textures, so you can make "moon
           rocks" that match the moon surface. */
        const ME_ROCK_OPTIONS = ['rocks_1','rocks_2','rocks_3','rocks_4','rocks_5','moon','moon_2','moon_3'];
        function _meIsRockKey(key){ return key === 'rock'; }
        /* Torch mount the brush stamps — stored on the placed object in the
           SAME entry.leaf field trees/rocks use (the generic variant slot):
           'floor' stands on the tile top, 'wall' hangs Minecraft-style off the
           tile side the entry's rot points at (aim it with the rotate dial). */
        let _meSelectedTorchMount = 'floor';
        const ME_TORCH_MOUNTS = [
            { key: 'floor', label: '⬇ Floor', tip: 'Stands upright on the tile top' },
            { key: 'wall',  label: '🧱 Wall',  tip: 'Hangs on the tile side the rotate arrow points at' },
        ];
        function _meIsTorchKey(key){ return key === 'torch'; }
        let _meSelectedObjRef = null;             // {x,y,idx} of the object picked for rotate-after-place
        let _meSelectedMonRef = null;             // index into _meMonuments of the monument picked for rotate
        let _meDialDragging = false;              // true while the user drags the rotation dial

        /* Per-object placement memory: the last orientation (rot / mirror /
           align / texture-variant) the user set for each object key. Placing
           that object again reuses it — set a stair to face East once and
           every stair after that comes out facing East until changed. Updated
           both from the pre-place palette controls (at placement time) and
           from the Select-tool dial / mirror / variant edits. */
        const _meObjPlaceMemory = {};
        function _meRememberObjPlacement(key, entry) {
            if (!key || !entry) return;
            _meObjPlaceMemory[key] = {
                rot: entry.rot || 0,
                flipX: !!entry.flipX,
                flipY: !!entry.flipY,
                alignX: entry.alignX || 'center',
                alignY: entry.alignY || 'bottom',
                leaf: entry.leaf || null
            };
        }
        /* Load the remembered orientation for an object key into the live
           brush settings (so the palette controls reflect it too). */
        function _meRecallObjPlacement(key) {
            const mem = _meObjPlaceMemory[key];
            if (!mem) return;
            _meSelectedRot = mem.rot;
            _meSelectedFlipX = mem.flipX;
            _meSelectedFlipY = mem.flipY;
            _meSelectedAlignX = mem.alignX;
            _meSelectedAlignY = mem.alignY;
            if (mem.leaf) {
                if (_meIsTreeKey(key)) _meSelectedLeaf = mem.leaf;
                else if (_meIsRockKey(key)) _meSelectedRockTex = mem.leaf;
                else if (_meIsTorchKey(key)) _meSelectedTorchMount = mem.leaf;
            }
        }

        let _meVoxels = null;
        let _meActiveZ = 0;
        /* Z-lock: when ON, paint/erase target EXACTLY the active Z layer —
           this is how you slot blocks UNDERNEATH existing blocks (under an
           overhang) or carve a specific buried layer. When OFF (default) the
           brush targets the visible surface like before. */
        let _meZLock = false;
        const ME_MAX_Z = 20;

        const _meUndoStack = [];
        const _meRedoStack = [];
        const ME_MAX_UNDO = 50;

        function _meSnapshotState() {
            return {
                voxels: _meVoxels ? _meVoxels.map(row => row.map(col => col.map(b => {
                    var e = { z: b.z, tid: b.tid };
                    if (b.sd) e.sd = b.sd;
                    return e;
                }))) : null,
                objects: _meObjects ? _meObjects.map(row => row.map(cell =>
                    Array.isArray(cell) ? cell.map(o => ({ ...o })) : []
                )) : null,
                spawns: {
                    1: (_meSpawns[1] || []).map(s => ({ x: s.x, y: s.y })),
                    2: (_meSpawns[2] || []).map(s => ({ x: s.x, y: s.y }))
                },
                sanctuaryZones: _meSanctuaryZones ? _meSanctuaryZones.map(row => [...row]) : null,
                monuments: _meMonuments ? _meMonuments.map(m => ({ ...m })) : [],
                terrainTints: Object.assign({}, _meTerrainTints),
                w: _meW, h: _meH
            };
        }
        function _meRestoreSnapshot(snap) {
            /* Indices into the old arrays are meaningless after a restore. */
            _meSelectedObjRef = null;
            _meSelectedMonRef = null;
            _meMonuments = snap.monuments ? snap.monuments.map(m => ({ ...m })) : [];
            if (snap.terrainTints) { _meTerrainTints = Object.assign({}, snap.terrainTints); _meApplyTintsLive(); }
            _meW = snap.w; _meH = snap.h;
            _meVoxels = snap.voxels ? snap.voxels.map(row => row.map(col => col.map(b => {
                var e = { z: b.z, tid: b.tid };
                if (b.sd) e.sd = b.sd;
                return e;
            }))) : null;
            _meObjects = snap.objects ? snap.objects.map(row => row.map(cell =>
                Array.isArray(cell) ? cell.map(o => ({ ...o })) : []
            )) : null;
            _meSpawns = {
                1: (snap.spawns[1] || []).map(s => ({ x: s.x, y: s.y })),
                2: (snap.spawns[2] || []).map(s => ({ x: s.x, y: s.y }))
            };
            _meSanctuaryZones = snap.sanctuaryZones ? snap.sanctuaryZones.map(row => [...row]) : null;
            _meSyncVoxelsToLegacy();
        }
        function _mePushUndo() {
            _meUndoStack.push(_meSnapshotState());
            if (_meUndoStack.length > ME_MAX_UNDO) _meUndoStack.shift();
            _meRedoStack.length = 0;
            _meUpdateUndoRedoButtons();
        }
        function _meRefreshEditorView() {
            _meRenderGrid();
            if (typeof invalidateTerrainChunkCache === 'function') invalidateTerrainChunkCache();
            if (typeof scheduleBoardRender === 'function') scheduleBoardRender();
            if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive()) {
                _meRebuildEditorOverlays3D();
            }
        }
        function _meUndo() {
            if (_meUndoStack.length === 0) return;
            if (typeof playSfx === 'function') playSfx('uiCursorMove', { allowBeforeUnlock: true });
            _meRedoStack.push(_meSnapshotState());
            _meRestoreSnapshot(_meUndoStack.pop());
            _meRefreshEditorView();
            _meUpdateUndoRedoButtons();
        }
        function _meRedo() {
            if (_meRedoStack.length === 0) return;
            if (typeof playSfx === 'function') playSfx('uiCursorMove', { allowBeforeUnlock: true });
            _meUndoStack.push(_meSnapshotState());
            _meRestoreSnapshot(_meRedoStack.pop());
            _meRefreshEditorView();
            _meUpdateUndoRedoButtons();
        }
        function _meUpdateUndoRedoButtons() {
            const u = document.getElementById('meUndoBtn'), r = document.getElementById('meRedoBtn');
            if (u) { u.disabled = !_meUndoStack.length; u.style.opacity = _meUndoStack.length ? '1' : '0.4'; }
            if (r) { r.disabled = !_meRedoStack.length; r.style.opacity = _meRedoStack.length ? '1' : '0.4'; }
        }
        window._meUndo = _meUndo;
        window._meRedo = _meRedo;

        function _meEmptyVoxelGrid(h, w) {
            return Array.from({ length: h }, () => Array.from({ length: w }, () => []));
        }

        function _meGetVoxel(x, y, z) {
            const col = _meVoxels?.[y]?.[x];
            if (!col) return null;
            return col.find(b => b.z === z) || null;
        }

        function _meSetVoxel(x, y, z, tid) {
            if (!_meVoxels) _meVoxels = _meEmptyVoxelGrid(_meH, _meW);
            const col = _meVoxels[y][x];
            /* Ensure a real ground layer exists before stacking above an empty
               column — EXCEPT in Z-lock mode, where the user is deliberately
               placing free-floating blocks at an exact layer. */
            if (z > 0 && !_meZLock && !col.some(b => b.z === 0)) {
                const baseTid = (_meGrid?.[y]?.[x]) || ((typeof ME_TERRAIN_TO_ID !== 'undefined' && ME_TERRAIN_TO_ID['grass']) || 1);
                col.push({ z: 0, tid: baseTid });
            }
            const idx = col.findIndex(b => b.z === z);
            if (idx >= 0) {
                col[idx].tid = tid;
            } else {
                col.push({ z, tid });
                col.sort((a, b) => a.z - b.z);
            }
            _meSyncVoxelsToLegacy();
        }

        function _meRemoveVoxel(x, y, z) {
            if (!_meVoxels) return;
            const col = _meVoxels?.[y]?.[x];
            if (!col) return;
            const idx = col.findIndex(b => b.z === z);
            if (idx >= 0) col.splice(idx, 1);
            _meSyncVoxelsToLegacy();
        }

        function _meSyncVoxelsToLegacy() {
            if (!_meVoxels) return;
            if (!_meGrid) _meGrid = Array.from({ length: _meH }, () => Array(_meW).fill(0));
            if (!_meHeights) _meHeights = _meEmptyHeightGrid(_meH, _meW);
            for (let y = 0; y < _meH; y++) {
                for (let x = 0; x < _meW; x++) {
                    const col = _meVoxels[y]?.[x] || [];
                    if (col.length === 0) {
                        _meGrid[y][x] = 0;
                        _meHeights[y][x] = 0;
                    } else {

                        const top = col[col.length - 1];
                        _meGrid[y][x] = top.tid;
                        _meHeights[y][x] = top.z;
                    }
                }
            }
        }

        function _meBuildVoxelsFromLegacy() {
            _meVoxels = _meEmptyVoxelGrid(_meH, _meW);
            for (let y = 0; y < _meH; y++) {
                for (let x = 0; x < _meW; x++) {
                    const tid = _meGrid?.[y]?.[x] || 0;
                    if (tid === 0) continue;
                    const h = _meHeights?.[y]?.[x] || 0;

                    for (let z = 0; z <= h; z++) {
                        _meVoxels[y][x].push({ z, tid });
                    }
                }
            }
        }

        function _meGetColumn(x, y) {
            return _meVoxels?.[y]?.[x] || [];
        }

        /* Migration for maps saved before empty tiles became real void holes:
           they were drawn as grass, so make them ACTUAL grass at z0 on load.
           (Erased holes made after this change save as truly empty columns
           only until the next save writes them back — holes the author digs
           stay holes because erase now happens on real floor blocks.) */
        function _meFillEmptyWithGrass() {
            if (!_meVoxels) { _meBuildVoxelsFromLegacy(); return; }
            const gTid = ME_TERRAIN_TO_ID['grass'] || 1;
            for (let y = 0; y < _meH; y++) {
                for (let x = 0; x < _meW; x++) {
                    if (!_meVoxels[y]) _meVoxels[y] = [];
                    const col = _meVoxels[y][x];
                    if (!col || col.length === 0) {
                        const tid = _meGrid?.[y]?.[x] || 0;
                        _meVoxels[y][x] = [{ z: 0, tid: tid || gTid }];
                    }
                }
            }
            _meSyncVoxelsToLegacy();
        }

        /* The Z that a paint / fill should write to. When a tile already has a
           column, target its VISIBLE top block as long as the active layer sits
           at or below it — so you can recolour / re-terrain the surface you can
           see (and the tile you just filled) without first bumping the active Z
           up to the column's height. Painting with the active Z set ABOVE the
           column still writes there, so stacking / raising a new layer works. */
        function _meSurfacePaintZ(x, y) {
            if (_meZLock) return _meActiveZ;   /* exact-layer mode */
            const col = _meGetColumn(x, y);
            if (col.length) {
                const topZ = col[col.length - 1].z;
                if (_meActiveZ <= topZ) return topZ;
            }
            return _meActiveZ;
        }

        function _meEmptyObjGrid(h,w){ return Array.from({length:h},()=>Array.from({length:w},()=>[])); }
        function _meObjEntry(oid,ax,ay,rot,fx,fy,leaf){ const e={oid:oid||0,alignX:ax||'center',alignY:ay||'bottom',rot:rot||0,flipX:!!fx,flipY:!!fy}; if(leaf)e.leaf=leaf; return e; }
        function _meIsTreeKey(key){ return key==='tree'||key==='tree_2'||key==='tree_3'||key==='tree_4'||key==='tree_5'||key==='tree_6'; }
        function _meDeserializeObjects(data,h,w){
            if(!data.objects) return _meEmptyObjGrid(h,w);
            const g=[];
            for(let y=0;y<h;y++){ const r=[];
                for(let x=0;x<w;x++){ const c=data.objects[y]?.[x];
                    if(Array.isArray(c)) r.push(c.map(e=>_meObjEntry(e.oid,e.alignX,e.alignY,e.rot,e.flipX,e.flipY,e.leaf)));
                    else if(typeof c==='number'&&c>0){ const al=data.objAlign?.[y]?.[x]||'center,bottom'; const[ax,ay]=al.split(','); r.push([_meObjEntry(c,ax,ay)]); }
                    else r.push([]);
                } g.push(r);
            } return g;
        }

        function _mePreloadObjectSprites() {
            if (typeof OBJECT_SPRITES === 'undefined') return Promise.resolve();
            const entries = Object.values(OBJECT_SPRITES).filter(o => o && o.url && !o.width);
            if (entries.length === 0) return Promise.resolve();
            return Promise.all(entries.map(oSpr => new Promise(resolve => {
                const img = new Image();
                img.onload = () => {
                    oSpr.width = img.naturalWidth;
                    oSpr.height = img.naturalHeight;
                    resolve();
                };
                img.onerror = () => {
                    oSpr.width = 128;
                    oSpr.height = 128;
                    resolve();
                };
                img.src = oSpr.url;
            })));
        }

        function _meEmptySanctuaryGrid(h,w){ return Array.from({length:h},()=>Array(w).fill(0)); }
        function _meEmptyHeightGrid(h,w){ return Array.from({length:h},()=>Array(w).fill(0)); }

        function _meInit() {
            if (!_meGrid) {
                /* Brand-new map: start from a REAL grass floor at z0 (not the
                   old empty-grid-rendered-as-grass illusion) so the Erase tool
                   can visibly dig holes from the very first click. */
                const gTid = ME_TERRAIN_TO_ID['grass'] || 1;
                _meGrid = Array.from({ length: _meH }, () => Array(_meW).fill(gTid));
            }
            if (!_meObjects) { _meObjects = _meEmptyObjGrid(_meH, _meW); }
            if (!_meMonuments) { _meMonuments = []; }
            if (!_meSanctuaryZones) { _meSanctuaryZones = _meEmptySanctuaryGrid(_meH, _meW); }
            if (!_meHeights) { _meHeights = _meEmptyHeightGrid(_meH, _meW); }
            if (!_meVoxels) {

                _meBuildVoxelsFromLegacy();
            }
            _mePreloadObjectSprites().then(() => {
                _meRenderPalette();
                _mePopulateSavedList();
            });
        }

        function _meSyncToState() {
            const w = _meW, h = _meH;
            CONFIG.boardWidth = w;
            CONFIG.boardHeight = h;
            state.terrainTints = Object.assign({}, _meTerrainTints);
            window._customEditorTints = Object.assign({}, _meTerrainTints);
            CONFIG.tileSize = typeof computeBattleTileSize === 'function' ? computeBattleTileSize() : BASE_TILE;

            state.boardTerrain = [];
            for (let y = 0; y < h; y++) {
                const row = [];
                for (let x = 0; x < w; x++) {
                    const tid = _meGrid[y]?.[x] || 0;
                    /* Empty tiles are genuine holes ('void'), so the Erase tool
                       visibly removes ground. New/cleared maps get a REAL grass
                       floor at z0 instead (see _meInit/_meClear). */
                    row.push(tid === 0 ? 'void' : (ME_TERRAIN_IDS[tid] || 'grass'));
                }
                state.boardTerrain.push(row);
            }

            state.boardHeights = _meHeights
                ? _meHeights.map(row => [...row])
                : Array.from({ length: h }, () => Array(w).fill(0));

            if (_meVoxels) {
                state.boardVoxels = [];
                for (let vy = 0; vy < h; vy++) {
                    const vRow = [];
                    for (let vx = 0; vx < w; vx++) {
                        const col = _meVoxels[vy]?.[vx] || [];
                        if (col.length > 0) {
                            vRow.push(col.map(b => {
                                const e = { z: b.z, terrain: ME_TERRAIN_IDS[b.tid] || 'grass' };
                                if (b.sd) e.stairDir = b.sd;
                                return e;
                            }));
                        } else {

                            const tid = _meGrid[vy]?.[vx] || 0;
                            const terrain = tid === 0 ? 'void' : (ME_TERRAIN_IDS[tid] || 'grass');
                            vRow.push([{ z: 0, terrain: terrain }]);
                        }
                    }
                    state.boardVoxels.push(vRow);
                }
                fillVoxelsDown();
            } else {
                state.boardVoxels = null;
            }

            state.boardObjects = [];
            state.boardObjectAlign = [];
            for (let y = 0; y < h; y++) {
                const oRow = [], aRow = [];
                for (let x = 0; x < w; x++) {
                    const stk = Array.isArray(_meObjects[y]?.[x]) ? _meObjects[y][x] : [];
                    if (stk.length === 0) {
                        oRow.push(null);
                        aRow.push('center,bottom');
                    } else {
                        oRow.push(stk.map(e => {
                            const o = {
                                key: ME_OBJECT_IDS[e.oid] || null,
                                alignX: e.alignX || 'center',
                                alignY: e.alignY || 'bottom',
                                rot: e.rot || 0,
                                flipX: !!e.flipX,
                                flipY: !!e.flipY
                            };
                            if (e.leaf) o.leaf = e.leaf;
                            return o;
                        }).filter(e => e.key));
                        const f = stk[0];
                        aRow.push((f.alignX || 'center') + ',' + (f.alignY || 'bottom'));
                    }
                }
                state.boardObjects.push(oRow);
                state.boardObjectAlign.push(aRow);
            }

            state.units = [];
            state.hourglasses = [];
            state.bombs = [];
            state.plantedSeeds = [];
            state.turrets = [];
            state.wards = [];
            state.pings = [];
            state._deployedObjects = [];
            state.towers = {};
            state.nexusPoints = {};
            state.flags = {};
            state.activeWeather = [];
            state.fogOfWar = false;
            state.selectedUnitId = null;
            state.actionMode = null;

            state._editorSpawns = _meSpawns;
            state._editorSanctuaryZones = _meSanctuaryZones;

            /* Esoteric monuments — render (and climb-stamp) live in the editor.
               Stamp BEFORE building columns so climb cubes land in boardColumns. */
            state.monuments = (_meMonuments && _meMonuments.length)
                ? _meMonuments.map(m => ({ ...m })) : null;

            if (typeof _stampMonumentCollision === 'function') _stampMonumentCollision();

            if (state.boardVoxels) {
                buildColumnsFromVoxels();
            } else {
                buildColumnsFromLegacy();
            }

            if (state.boardColumns) {
                const _sampleCol = state.boardColumns[0]?.[0];
                console.log('[MapEditor] boardColumns built:', state.boardColumns.length + 'x' + (state.boardColumns[0]?.length || 0),
                    'sample[0][0]:', JSON.stringify(_sampleCol));
            }

            state._terrainVersion = (state._terrainVersion || 0) + 1;
        }

        let _meEditorDragging = false;

        window._meEditorClickTile = function(x, y) {
            if (x < 0 || y < 0 || x >= _meW || y >= _meH) return;
            if (!_meEditorDragging) _mePushUndo();
            _mePaintCell({ dataset: { x: String(x), y: String(y) } });
            _meSyncToState();
            if (typeof invalidateTerrainChunkCache === 'function') invalidateTerrainChunkCache();
            if (typeof scheduleBoardRender === 'function') scheduleBoardRender();

            if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive()) {
                _meRebuildEditorOverlays3D();
            }
        };

        /* Snapshot for undo ONCE at the start of a paint stroke, before any tile
           is modified, so the whole click (or click-drag) is a single undo step.
           (Previously the snapshot push lived in _meEditorClickTile guarded by
           !_meEditorDragging, but dragging was already set true here before the
           first paint — so strokes were never recorded and Undo did nothing.) */
        window._meEditorDragStart = function() {
            if (!_meEditorDragging) _mePushUndo();
            _meEditorDragging = true;
        };
        window._meEditorDragEnd = function() { _meEditorDragging = false; };

        function _meUpdateEditorOverlays() {
            const boardEl = document.getElementById('board');
            if (!boardEl) return;
            const bw = _meW, bh = _meH;

            boardEl.querySelectorAll('.me-diorama-overlay').forEach(el => el.remove());

            const tileLookup = {};
            for (let ci = 0; ci < boardEl.children.length; ci++) {
                const ch = boardEl.children[ci];
                if (typeof ch._tileX === 'number' && typeof ch._tileY === 'number') {
                    tileLookup[ch._tileX + ',' + ch._tileY] = ch;
                }
            }

            const sLookup = {};
            (_meSpawns[1] || []).forEach(s => { sLookup[s.x + ',' + s.y] = 1; });
            (_meSpawns[2] || []).forEach(s => { sLookup[s.x + ',' + s.y] = 2; });

            for (let y = 0; y < bh; y++) {
                for (let x = 0; x < bw; x++) {
                    const tile = tileLookup[x + ',' + y];
                    if (!tile) continue;

                    const sp = sLookup[x + ',' + y];
                    if (sp) {
                        const m = document.createElement('div');
                        m.className = 'me-diorama-overlay me-diorama-spawn me-diorama-spawn-p' + sp;
                        m.textContent = 'P' + sp;
                        m.style.transform = 'translateZ(4px)';
                        tile.appendChild(m);
                    }

                    const sz = _meSanctuaryZones?.[y]?.[x] || 0;
                    if (sz > 0) {
                        const s = document.createElement('div');
                        s.className = 'me-diorama-overlay me-diorama-sanct me-diorama-sanct-p' + sz;
                        s.style.transform = 'translateZ(3px)';
                        tile.appendChild(s);
                    }

                    /* Elevation number badge removed — distracting while editing.
                       The voxel stack height is visible on the board itself. */
                }
            }
        }

        let _editorOverlay3DGroup = null;
        let _editorOverlay3DLabels = [];

        function _meClearEditorOverlays3D() {
            if (_editorOverlay3DGroup && typeof THREE !== 'undefined') {

                if (_editorOverlay3DGroup.parent) _editorOverlay3DGroup.parent.remove(_editorOverlay3DGroup);

                _editorOverlay3DGroup.traverse(ch => {
                    if (ch.geometry) ch.geometry.dispose();
                    if (ch.material) {
                        if (Array.isArray(ch.material)) ch.material.forEach(m => m.dispose());
                        else ch.material.dispose();
                    }
                });
                _editorOverlay3DGroup = null;
            }

            for (const lbl of _editorOverlay3DLabels) {
                if (lbl.parent) lbl.parent.remove(lbl);
                if (lbl.element && lbl.element.parentNode) lbl.element.parentNode.removeChild(lbl.element);
            }
            _editorOverlay3DLabels = [];
        }

        function _meRebuildEditorOverlays3D() {
            _meClearEditorOverlays3D();
            if (typeof THREE === 'undefined' || typeof ThreeRenderer === 'undefined' || !ThreeRenderer.isActive()) return;

            const ts = CONFIG.tileSize || BASE_TILE;
            const bw = _meW, bh = _meH;

            _editorOverlay3DGroup = new THREE.Group();
            _editorOverlay3DGroup.name = 'editorOverlays';

            const scene = ThreeRenderer._scene || (typeof window._threeScene !== 'undefined' ? window._threeScene : null);

            const planeGeo = new THREE.PlaneGeometry(ts * 0.9, ts * 0.9);

            const spawnP1Mat = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
            const spawnP2Mat = new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
            const sanctP1Mat = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false });
            const sanctP2Mat = new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false });

            const sLookup = {};
            (_meSpawns[1] || []).forEach(s => { sLookup[s.x + ',' + s.y] = 1; });
            (_meSpawns[2] || []).forEach(s => { sLookup[s.x + ',' + s.y] = 2; });

            for (let y = 0; y < bh; y++) {
                for (let x = 0; x < bw; x++) {
                    const h = state.boardHeights?.[y]?.[x] ?? 0;
                    const topY = Math.max(ts * 0.5 * 0.5, h * ts * 0.5) + 0.5;

                    const sp = sLookup[x + ',' + y];
                    if (sp) {
                        const mat = sp === 1 ? spawnP1Mat : spawnP2Mat;
                        const plane = new THREE.Mesh(planeGeo, mat);
                        plane.rotation.x = -Math.PI / 2;
                        plane.position.set(x * ts + ts / 2, topY + 0.3, y * ts + ts / 2);
                        _editorOverlay3DGroup.add(plane);

                        const labelEl = document.createElement('div');
                        labelEl.className = 'me-3d-label me-3d-spawn-label';
                        labelEl.textContent = 'P' + sp;
                        labelEl.style.cssText = 'font-size:14px;font-weight:700;padding:2px 6px;border-radius:3px;pointer-events:none;' +
                            'background:' + (sp === 1 ? 'rgba(68,136,255,0.85)' : 'rgba(255,68,68,0.85)') + ';color:#fff;' +
                            'text-shadow:0 1px 2px rgba(0,0,0,0.6);font-family:DotGothic16,monospace;';
                        const css2d = new THREE.CSS2DObject(labelEl);
                        css2d.position.set(x * ts + ts / 2, topY + 12, y * ts + ts / 2);
                        _editorOverlay3DGroup.add(css2d);
                        _editorOverlay3DLabels.push(css2d);
                    }

                    const sz = _meSanctuaryZones?.[y]?.[x] || 0;
                    if (sz > 0) {
                        const mat = sz === 1 ? sanctP1Mat : sanctP2Mat;
                        const plane = new THREE.Mesh(planeGeo, mat);
                        plane.rotation.x = -Math.PI / 2;
                        plane.position.set(x * ts + ts / 2, topY + 0.2, y * ts + ts / 2);
                        _editorOverlay3DGroup.add(plane);
                    }

                    /* Per-tile elevation number labels (e.g. "Z3", "2× Z1") were
                       removed — they cluttered the board while raising/placing
                       elevation. The 3D voxel stack itself shows the height. */
                }
            }

            /* ── Selection highlight: a gold ring + translucent disc + a big
               FACING ARROW that points the way the picked object/monument is
               turned, plus a floating tag. The arrow is the key bit — it makes
               rotation legible at a glance ("yes, it's facing east now"). ── */
            const _meDrawSelHighlight = (sx, sy, rotDeg, ringScale, labelText) => {
                const sh = state.boardHeights?.[sy]?.[sx] ?? 0;
                const sTopY = Math.max(ts * 0.25, sh * ts * 0.5) + 0.5;
                const cxw = sx * ts + ts / 2, czw = sy * ts + ts / 2;
                const rs = ringScale || 1;

                const discMat = new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
                const disc = new THREE.Mesh(new THREE.PlaneGeometry(ts * 0.9 * rs, ts * 0.9 * rs), discMat);
                disc.rotation.x = -Math.PI / 2;
                disc.position.set(cxw, sTopY + 0.5, czw);
                _editorOverlay3DGroup.add(disc);

                const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
                const ring = new THREE.Mesh(new THREE.RingGeometry(ts * 0.36 * rs, ts * 0.48 * rs, 48), ringMat);
                ring.rotation.x = -Math.PI / 2;
                ring.position.set(cxw, sTopY + 0.8, czw);
                ring.renderOrder = 9999;
                _editorOverlay3DGroup.add(ring);

                /* Facing arrow: a flat arrowhead lying on the ground, spun to the
                   object's heading (0°=North/away, +90°=East …) — matching the 3D
                   object/monument Y rotation convention. */
                const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.98, depthTest: false, side: THREE.DoubleSide });
                const arrowGroup = new THREE.Group();
                const cone = new THREE.Mesh(new THREE.ConeGeometry(ts * 0.13 * rs, ts * 0.5 * rs, 16), arrowMat);
                cone.rotation.x = -Math.PI / 2;          // lay flat, tip → North (-Z)
                cone.position.z = -ts * 0.42 * rs;       // push tip toward the facing edge
                cone.renderOrder = 10000;
                arrowGroup.add(cone);
                arrowGroup.rotation.y = -(rotDeg || 0) * Math.PI / 180;
                arrowGroup.position.set(cxw, sTopY + 1.1, czw);
                _editorOverlay3DGroup.add(arrowGroup);

                const tagEl = document.createElement('div');
                tagEl.className = 'me-3d-label me-3d-sel-label';
                tagEl.textContent = labelText || '🎯 Selected';
                tagEl.style.cssText = 'font-size:12px;font-weight:700;padding:2px 7px;border-radius:4px;pointer-events:none;' +
                    'background:rgba(255,210,74,0.95);color:#3a2a00;font-family:DotGothic16,monospace;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.5);';
                const tag2d = new THREE.CSS2DObject(tagEl);
                tag2d.position.set(cxw, sTopY + 26 + ts * 0.5 * (rs - 1), czw);
                _editorOverlay3DGroup.add(tag2d);
                _editorOverlay3DLabels.push(tag2d);
            };

            /* ── Auto-zone preview: where the engine would place spawn zones,
               nexus capture zones and CTF flags for THIS map size when the map
               is played in the standard modes. Toggled from the toolbar; the
               layout recomputes automatically when the map is resized. ── */
            if (_meShowZones) {
                const az = _meComputeAutoZones();
                const zP1Mat = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.20, side: THREE.DoubleSide, depthWrite: false });
                const zP2Mat = new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.20, side: THREE.DoubleSide, depthWrite: false });
                const zNexMat = new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });
                const zoneTopY = (x, y) => Math.max(ts * 0.25, (state.boardHeights?.[y]?.[x] ?? 0) * ts * 0.5) + 0.4;
                const addZoneLabel = (x, y, txt, bg) => {
                    const el = document.createElement('div');
                    el.className = 'me-3d-label me-3d-zone-label';
                    el.textContent = txt;
                    el.style.cssText = 'font-size:10px;font-weight:700;padding:1px 6px;border-radius:3px;pointer-events:none;' +
                        'background:' + bg + ';color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.7);font-family:DotGothic16,monospace;white-space:nowrap;';
                    const c2 = new THREE.CSS2DObject(el);
                    c2.position.set(x * ts + ts / 2, zoneTopY(x, y) + 18, y * ts + ts / 2);
                    _editorOverlay3DGroup.add(c2);
                    _editorOverlay3DLabels.push(c2);
                };
                const drawZoneTile = (x, y, mat) => {
                    if (x < 0 || y < 0 || x >= bw || y >= bh) return;
                    const pl = new THREE.Mesh(planeGeo, mat);
                    pl.rotation.x = -Math.PI / 2;
                    pl.position.set(x * ts + ts / 2, zoneTopY(x, y), y * ts + ts / 2);
                    _editorOverlay3DGroup.add(pl);
                };
                az.p1.forEach(t => drawZoneTile(t.x, t.y, zP1Mat));
                az.p2.forEach(t => drawZoneTile(t.x, t.y, zP2Mat));
                if (az.p1.length) addZoneLabel(az.p1[Math.floor(az.p1.length / 2)].x, az.p1[Math.floor(az.p1.length / 2)].y, 'P1 SPAWN ZONE', 'rgba(48,100,220,0.9)');
                if (az.p2.length) addZoneLabel(az.p2[Math.floor(az.p2.length / 2)].x, az.p2[Math.floor(az.p2.length / 2)].y, 'P2 SPAWN ZONE', 'rgba(210,50,50,0.9)');
                for (const nz of az.nexus) {
                    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) drawZoneTile(nz.x + dx, nz.y + dy, zNexMat);
                    addZoneLabel(nz.x, nz.y, nz.label, 'rgba(190,140,20,0.92)');
                }
                for (const fl of az.flags) {
                    addZoneLabel(fl.x, fl.y, '⚑ CTF FLAG P' + fl.player, fl.player === 1 ? 'rgba(48,100,220,0.9)' : 'rgba(210,50,50,0.9)');
                }
            }

            const _selMon = _meSelectedMonEntry();
            if (_selMon) {
                const rr = Math.max(1, Math.floor((_selMon.foot || 3) / 2));
                _meDrawSelHighlight(_selMon.x, _selMon.y, _selMon.rot || 0, 1 + rr * 0.6, `🎯 ${_selMon.rot || 0}° facing`);
            } else if (_meSelectedObjRef &&
                Array.isArray(_meObjects[_meSelectedObjRef.y]?.[_meSelectedObjRef.x]) &&
                _meObjects[_meSelectedObjRef.y][_meSelectedObjRef.x].length > 0) {
                const sx = _meSelectedObjRef.x, sy = _meSelectedObjRef.y;
                const stk = _meObjects[sy][sx];
                const rotDeg = (stk[_meSelectedObjRef.idx] && stk[_meSelectedObjRef.idx].rot) || 0;
                _meDrawSelHighlight(sx, sy, rotDeg, 1, `🎯 ${rotDeg}° facing`);
            }

            if (scene) {
                scene.add(_editorOverlay3DGroup);
            }
        }

        window._meUpdateEditorOverlays = _meUpdateEditorOverlays;
        window._meRebuildEditorOverlays3D = _meRebuildEditorOverlays3D;

        /* ── Auto-zone preview toggle + layout math ─────────────────────────
           Mirrors the engine's own placement rules so the preview matches what
           a real match would do at this map size:
           - spawn zones: autoGenerateSpawnZones (edge strip, centered, length =
             team size, orientation from the authored spawn hint);
           - nexus zones: _autoPlaceNexusIfNeeded (2×2 at the centre; on maps
             ≥16×16 also NW/SE zones on the diagonal at min(w,h)/4);
           - CTF flags: the middle tile of each spawn zone. */
        let _meShowZones = false;

        function _meComputeAutoZones() {
            const w = _meW, h = _meH;
            const sp1 = _meSpawns[1] || [], sp2 = _meSpawns[2] || [];
            const teamSize = Math.max(1, Math.min(6, Math.min(sp1.length || 4, sp2.length || 4)));

            let orientation = 'vertical';
            if (sp1.length > 0 && sp2.length > 0) {
                const avgY1 = sp1.reduce((s, p) => s + p.y, 0) / sp1.length;
                const avgY2 = sp2.reduce((s, p) => s + p.y, 0) / sp2.length;
                const avgX1 = sp1.reduce((s, p) => s + p.x, 0) / sp1.length;
                const avgX2 = sp2.reduce((s, p) => s + p.x, 0) / sp2.length;
                if (Math.abs(avgX1 - avgX2) > Math.abs(avgY1 - avgY2) * 1.5) orientation = 'horizontal';
            }

            const p1 = [], p2 = [];
            if (orientation === 'vertical') {
                let p1Row = h - 1, p2Row = 0;
                if (sp1.length && sp2.length) {
                    const avgY1 = sp1.reduce((s, p) => s + p.y, 0) / sp1.length;
                    const avgY2 = sp2.reduce((s, p) => s + p.y, 0) / sp2.length;
                    p1Row = avgY1 > avgY2 ? h - 1 : 0;
                    p2Row = p1Row === h - 1 ? 0 : h - 1;
                }
                const startCol = Math.max(0, Math.floor((w - teamSize) / 2));
                for (let i = 0; i < teamSize; i++) {
                    const col = Math.min(startCol + i, w - 1);
                    p1.push({ x: col, y: p1Row });
                    p2.push({ x: col, y: p2Row });
                }
            } else {
                let p1Col = 0, p2Col = w - 1;
                if (sp1.length && sp2.length) {
                    const avgX1 = sp1.reduce((s, p) => s + p.x, 0) / sp1.length;
                    const avgX2 = sp2.reduce((s, p) => s + p.x, 0) / sp2.length;
                    p1Col = avgX1 < avgX2 ? 0 : w - 1;
                    p2Col = p1Col === 0 ? w - 1 : 0;
                }
                const startRow = Math.max(0, Math.floor((h - teamSize) / 2));
                for (let i = 0; i < teamSize; i++) {
                    const row = Math.min(startRow + i, h - 1);
                    p1.push({ x: p1Col, y: row });
                    p2.push({ x: p2Col, y: row });
                }
            }

            const nexus = [];
            const cx = Math.floor(w / 2) - 1, cy = Math.floor(h / 2) - 1;   // 2×2 zone anchor
            if (w >= 16 && h >= 16) {
                const off = Math.floor(Math.min(w, h) / 4);
                nexus.push({ x: cx, y: cy, label: '◈ NEXUS (CENTER)' });
                nexus.push({ x: cx - off, y: cy - off, label: '◈ NEXUS (NW)' });
                nexus.push({ x: cx + off, y: cy + off, label: '◈ NEXUS (SE)' });
            } else {
                nexus.push({ x: cx, y: cy, label: '◈ NEXUS ZONE' });
            }

            const flags = [];
            if (p1.length) flags.push({ x: p1[Math.floor(p1.length / 2)].x, y: p1[Math.floor(p1.length / 2)].y, player: 1 });
            if (p2.length) flags.push({ x: p2[Math.floor(p2.length / 2)].x, y: p2[Math.floor(p2.length / 2)].y, player: 2 });

            return { p1, p2, nexus, flags };
        }

        window._meToggleZonePreview = function() {
            _meShowZones = !_meShowZones;
            _meSfx('uiButtonConfirm');
            const btn = document.getElementById('meZonesBtn');
            if (btn) btn.classList.toggle('active', _meShowZones);
            _meRebuildEditorOverlays3D();
        };

        /* The editor's base stylesheet lives in styles-editor.css (R2). This
           injects an additive layer that organizes the HUD into clean labeled
           sections, makes the palette/height picker scroll instead of sprawl,
           and sharpens active/hover states — without redefining the base look. */
        function _meInjectEditorStyles() {
            if (document.getElementById('meEditorInjectedStyles')) return;
            const s = document.createElement('style');
            s.id = 'meEditorInjectedStyles';
            s.textContent = `
                .me-editor-hud, .me-editor-hud * { box-sizing: border-box; }
                .me-editor-hud {
                    display: flex !important;
                    flex-direction: column;
                    gap: 8px;
                    /* Give the sidebar a real, readable width instead of letting it
                       collapse to its content's minimum (the old "too thin" bug). */
                    flex: 0 0 auto;
                    width: clamp(340px, 28vw, 480px);
                    align-self: stretch;
                    max-height: 100vh;
                    height: 100vh;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: 10px 12px 14px;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(124,77,255,0.6) transparent;
                }
                .me-editor-hud::-webkit-scrollbar { width: 8px; }
                .me-editor-hud::-webkit-scrollbar-thumb { background: rgba(124,77,255,0.55); border-radius: 4px; }
                .me-editor-hud::-webkit-scrollbar-track { background: transparent; }

                .me-help-bar {
                    font-size: 9.5px;
                    line-height: 1.35;
                    color: rgba(220,220,255,0.6);
                    background: rgba(124,77,255,0.10);
                    border: 1px solid rgba(124,77,255,0.22);
                    border-radius: 7px;
                    padding: 4px 9px;
                    text-align: center;
                }

                .me-section {
                    background: rgba(18,16,28,0.55);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 9px;
                    padding: 8px 9px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .me-section-palette { flex: 1 1 auto; min-height: 340px; }

                /* Clickable collapsible header for each panel. */
                .me-editor-hud .me-section-label {
                    font-size: 9.5px;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: rgba(180,160,255,0.85);
                    margin: 0;
                    padding: 2px 0;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    text-align: left;
                    user-select: none;
                }
                .me-editor-hud .me-section-label:hover { color: #fff; }
                .me-editor-hud .me-sec-caret {
                    font-size: 9px;
                    line-height: 1;
                    color: rgba(180,160,255,0.7);
                    transition: transform 0.15s ease;
                }
                .me-editor-hud .me-section.collapsed .me-sec-caret { transform: rotate(-90deg); }
                .me-editor-hud .me-section.collapsed .me-section-body { display: none; }
                .me-editor-hud .me-section.collapsed { padding-bottom: 9px; }
                .me-editor-hud .me-section.collapsed.me-section-palette { flex: 0 0 auto; min-height: 0; }
                .me-editor-hud .me-section-body {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .me-editor-hud .me-section-palette .me-section-body { flex: 1 1 auto; min-height: 0; }

                .me-editor-hud .me-tool-row { display: flex; flex-wrap: wrap; gap: 5px; }
                .me-editor-hud .me-tool {
                    flex: 1 1 auto;
                    min-width: 70px;
                    padding: 7px 6px;
                    font-size: 12px;
                    border-radius: 7px;
                    border: 1px solid rgba(255,255,255,0.10);
                    background: rgba(40,36,58,0.8);
                    color: #e8e6f4;
                    cursor: pointer;
                    transition: background 0.12s, border-color 0.12s, transform 0.05s;
                }
                .me-editor-hud .me-tool:hover { background: rgba(70,60,104,0.9); border-color: rgba(160,140,255,0.5); }
                .me-editor-hud .me-tool:active { transform: translateY(1px); }
                .me-editor-hud .me-tool.active {
                    background: linear-gradient(180deg, rgba(140,100,255,0.95), rgba(108,70,225,0.95));
                    border-color: rgba(190,170,255,0.95);
                    color: #fff;
                    box-shadow: 0 0 0 1px rgba(190,170,255,0.5), 0 2px 8px rgba(124,77,255,0.4);
                }
                .me-editor-hud .me-tool-p1.active { background: linear-gradient(180deg, #5b9bff, #2f6fdf); border-color: #9cc4ff; box-shadow: 0 0 0 1px rgba(120,170,255,0.6); }
                .me-editor-hud .me-tool-p2.active { background: linear-gradient(180deg, #ff6b6b, #d23b3b); border-color: #ffb0b0; box-shadow: 0 0 0 1px rgba(255,140,140,0.6); }

                .me-editor-hud .me-hud-size-row,
                .me-editor-hud .me-z-cursor-wrap,
                .me-editor-hud .me-elev-picker-wrap { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
                .me-editor-hud .me-hud-size-row button,
                .me-editor-hud .me-z-btn {
                    width: 26px; height: 26px; padding: 0;
                    border-radius: 6px; border: 1px solid rgba(255,255,255,0.14);
                    background: rgba(50,44,72,0.9); color: #fff; cursor: pointer; font-size: 15px; line-height: 1;
                }
                .me-editor-hud .me-hud-size-row button:hover,
                .me-editor-hud .me-z-btn:hover { background: rgba(90,76,140,0.95); }
                .me-editor-hud .me-z-lock { width: auto; padding: 0 8px; font-size: 10px; white-space: nowrap; }
                .me-editor-hud .me-z-lock.active { background: linear-gradient(180deg,#8c64ff,#6c46e1); border-color: rgba(190,170,255,0.9); color: #fff; box-shadow: 0 0 0 1px rgba(190,170,255,0.5); }
                .me-editor-hud .me-size-val, .me-editor-hud .me-z-value { min-width: 22px; text-align: center; font-weight: 700; color: #fff; }
                .me-editor-hud .me-label, .me-editor-hud .me-z-label, .me-editor-hud .me-elev-label { font-size: 11px; color: rgba(210,205,235,0.85); }
                .me-editor-hud .me-z-hint { font-size: 10px; color: rgba(170,255,210,0.8); margin-left: auto; }

                .me-editor-hud .me-elev-picker {
                    display: flex; flex-wrap: wrap; gap: 4px;
                    max-height: 92px; overflow-y: auto;
                    padding: 2px; flex: 1 1 auto;
                }
                .me-editor-hud .me-hbtn {
                    width: 28px; height: 26px; padding: 0;
                    border-radius: 6px; border: 1px solid rgba(255,255,255,0.12);
                    background: rgba(46,40,66,0.9); color: #ddd; cursor: pointer; font-size: 11px;
                }
                .me-editor-hud .me-hbtn:hover { background: rgba(86,72,130,0.95); }
                .me-editor-hud .me-hbtn.active { background: linear-gradient(180deg,#8c64ff,#6c46e1); color:#fff; border-color: rgba(190,170,255,0.9); }
                .me-editor-hud .me-hbtn-zero { color: #ff9; }

                .me-editor-hud .me-search {
                    width: 100%; box-sizing: border-box;
                    padding: 8px 10px; border-radius: 7px;
                    border: 1px solid rgba(255,255,255,0.14); background: rgba(12,10,20,0.8); color: #fff; font-size: 12px;
                }
                .me-editor-hud .me-search:focus { outline: none; border-color: rgba(160,140,255,0.8); }

                .me-editor-hud .me-tab-row { display: flex; gap: 4px; }
                .me-editor-hud .me-tab {
                    flex: 1; padding: 8px 4px; font-size: 12px; cursor: pointer; white-space: nowrap;
                    border-radius: 7px 7px 0 0; border: 1px solid rgba(255,255,255,0.08); border-bottom: none;
                    background: rgba(30,26,44,0.8); color: rgba(220,216,240,0.7);
                }
                .me-editor-hud .me-tab:hover { background: rgba(54,46,80,0.9); color: #fff; }
                .me-editor-hud .me-tab.active { background: rgba(90,70,160,0.92); color: #fff; border-color: rgba(160,140,255,0.6); }

                .me-editor-hud .me-palette {
                    flex: 1 1 auto;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
                    gap: 6px;
                    align-content: start;
                    min-height: 0;
                    max-height: none;
                    overflow-y: auto;
                    padding: 8px;
                    background: rgba(10,8,18,0.6);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 0 0 8px 8px;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(124,77,255,0.6) transparent;
                }
                .me-editor-hud .me-palette::-webkit-scrollbar { width: 8px; }
                .me-editor-hud .me-palette::-webkit-scrollbar-thumb { background: rgba(124,77,255,0.55); border-radius: 4px; }
                .me-editor-hud .me-pal-cat {
                    grid-column: 1 / -1;
                    font-size: 9.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
                    color: rgba(175,160,235,0.85); padding: 6px 2px 1px; border-top: 1px solid rgba(255,255,255,0.06);
                }
                .me-editor-hud .me-pal-cat:first-child { border-top: none; }
                .me-editor-hud .me-pal-cat-gamemode { color: #ffd479; }
                .me-editor-hud .me-pal-item {
                    display: flex; flex-direction: column; align-items: center; gap: 3px;
                    padding: 4px 2px; border-radius: 7px; cursor: pointer;
                    border: 1px solid transparent; background: rgba(255,255,255,0.02);
                    transition: background 0.1s, border-color 0.1s, transform 0.05s;
                }
                .me-editor-hud .me-pal-item:hover { background: rgba(124,77,255,0.16); border-color: rgba(160,140,255,0.4); }
                .me-editor-hud .me-pal-item:active { transform: scale(0.96); }
                .me-editor-hud .me-pal-item.active { background: rgba(124,77,255,0.28); border-color: rgba(190,170,255,0.95); box-shadow: 0 0 0 1px rgba(190,170,255,0.5); }
                .me-editor-hud .me-pal-swatch {
                    width: 48px; height: 48px; border-radius: 6px;
                    background-size: cover; background-position: center;
                    border: 1px solid rgba(0,0,0,0.4); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
                }
                .me-editor-hud .me-pal-label { font-size: 9px; line-height: 1.1; text-align: center; color: rgba(225,222,245,0.9); word-break: break-word; }
                .me-editor-hud .me-pal-swatch { position: relative; }
                .me-editor-hud .me-pal-tintdot {
                    position: absolute; top: 2px; right: 2px; width: 11px; height: 11px; border-radius: 50%;
                    border: 1px solid rgba(0,0,0,0.55); box-shadow: 0 0 0 1px rgba(255,255,255,0.6);
                }

                /* ── Colour-wheel tint panel (top of the Terrain palette) ── */
                .me-editor-hud .me-tint-panel {
                    grid-column: 1 / -1;
                    background: rgba(20,16,32,0.7);
                    border: 1px solid rgba(160,140,255,0.25);
                    border-radius: 9px; padding: 9px; margin-bottom: 6px;
                    display: flex; flex-direction: column; gap: 8px;
                }
                .me-editor-hud .me-tint-head { display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: rgba(225,222,245,0.9); }
                .me-editor-hud .me-tint-head b { color: #fff; }
                .me-editor-hud .me-tint-reset {
                    font-size: 10px; padding: 3px 9px; border-radius: 6px; cursor: pointer;
                    border: 1px solid rgba(255,255,255,0.14); background: rgba(46,40,66,0.9); color: #ddd;
                }
                .me-editor-hud .me-tint-reset:hover { background: rgba(86,72,130,0.95); }
                .me-editor-hud .me-tint-body { display: flex; gap: 10px; align-items: center; }
                .me-editor-hud .me-tint-wheel {
                    position: relative; width: 118px; height: 118px; flex: 0 0 118px;
                    border-radius: 50%; cursor: crosshair; touch-action: none;
                    background:
                        radial-gradient(circle at center, #fff 0%, rgba(255,255,255,0) 72%),
                        conic-gradient(red, yellow, lime, cyan, blue, magenta, red);
                    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.4);
                }
                .me-editor-hud .me-tint-marker {
                    position: absolute; left: 50%; top: 50%; width: 14px; height: 14px; border-radius: 50%;
                    border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0,0,0,0.65);
                    transform: translate(-50%,-50%); pointer-events: none;
                }
                .me-editor-hud .me-tint-controls { flex: 1 1 auto; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
                .me-editor-hud .me-tint-preview { width: 100%; height: 26px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); }
                .me-editor-hud .me-tint-vlabel { font-size: 9.5px; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(180,160,255,0.85); }
                .me-editor-hud .me-tint-vslider { width: 100%; }
                .me-editor-hud .me-tint-hexrow { display: flex; gap: 6px; align-items: center; }
                .me-editor-hud .me-tint-hexrow input[type=color] {
                    width: 34px; height: 30px; padding: 0; border-radius: 6px; cursor: pointer;
                    border: 1px solid rgba(255,255,255,0.18); background: none;
                }
                .me-editor-hud .me-tint-hexinput {
                    flex: 1 1 auto; min-width: 0; padding: 6px 8px; border-radius: 6px;
                    border: 1px solid rgba(255,255,255,0.14); background: rgba(12,10,20,0.8);
                    color: #fff; font-size: 12px; font-family: monospace;
                }
                .me-editor-hud .me-tint-hexinput:focus { outline: none; border-color: rgba(160,140,255,0.8); }
                .me-editor-hud .me-tint-presets { display: flex; flex-wrap: wrap; gap: 4px; }
                .me-editor-hud .me-tint-swatch {
                    width: 20px; height: 20px; border-radius: 5px; padding: 0; cursor: pointer;
                    border: 1px solid rgba(255,255,255,0.2); transition: transform 0.08s, border-color 0.08s;
                }
                .me-editor-hud .me-tint-swatch:hover { transform: scale(1.12); border-color: #fff; }

                /* Generic pill button (Save, etc.) */
                .me-editor-hud .me-btn {
                    padding: 8px 12px; font-size: 12px; font-weight: 600; border-radius: 8px; cursor: pointer;
                    display: inline-flex; align-items: center; justify-content: center; gap: 5px; white-space: nowrap;
                    border: 1px solid rgba(255,255,255,0.12); background: rgba(46,40,66,0.9); color: #eee;
                    transition: background 0.12s, border-color 0.12s, transform 0.05s;
                }
                .me-editor-hud .me-btn:hover:not([disabled]) { background: rgba(86,72,130,0.95); border-color: rgba(160,140,255,0.5); }
                .me-editor-hud .me-btn:active:not([disabled]) { transform: translateY(1px); }
                .me-editor-hud .me-btn[disabled] { cursor: default; }
                .me-editor-hud .me-btn-danger { background: rgba(150,40,40,0.85); border-color: rgba(255,120,120,0.4); color: #fff; }
                .me-editor-hud .me-btn-danger:hover { background: rgba(190,50,50,0.95); }
                .me-editor-hud .me-btn-icon { flex: 0 0 auto; width: 40px; padding: 0; font-size: 14px; }
                .me-editor-hud .me-btn-play {
                    flex: 0 0 auto; padding: 8px 16px;
                    background: linear-gradient(180deg,#3ad17a,#1f9e54); border-color: #8df0b6; color:#04341c; font-weight: 800;
                    box-shadow: 0 2px 10px rgba(31,158,84,0.35);
                }
                .me-editor-hud .me-btn-play:hover { background: linear-gradient(180deg,#46e588,#27b863); }

                /* ── Top action toolbar — uniform, evenly-sized buttons, single row ── */
                .me-editor-hud .me-toolbar { display: flex; gap: 5px; align-items: stretch; flex-wrap: nowrap; }
                .me-editor-hud .me-tbtn {
                    flex: 1 1 0; min-width: 0; height: 38px; padding: 0 4px;
                    display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
                    font-size: 9.5px; font-weight: 600; line-height: 1.1; white-space: nowrap;
                    border-radius: 8px; border: 1px solid rgba(255,255,255,0.12);
                    background: rgba(46,40,66,0.9); color: #e9e6f6; cursor: pointer;
                    transition: background 0.12s, border-color 0.12s, transform 0.05s;
                }
                .me-editor-hud .me-tbtn .ico { font-size: 14px; line-height: 1; }
                .me-editor-hud .me-tbtn:hover:not([disabled]) { background: rgba(86,72,130,0.95); border-color: rgba(160,140,255,0.5); }
                .me-editor-hud .me-tbtn:active:not([disabled]) { transform: translateY(1px); }
                .me-editor-hud .me-tbtn[disabled] { opacity: 0.38; cursor: default; }
                .me-editor-hud .me-tbtn.active { background: linear-gradient(180deg,#8c64ff,#6c46e1); color: #fff; border-color: rgba(190,170,255,0.9); box-shadow: 0 0 0 1px rgba(190,170,255,0.5); }
                .me-editor-hud .me-tbar-sep { flex: 0 0 1px; align-self: center; width: 1px; height: 24px; background: rgba(255,255,255,0.12); }

                /* ── File row (name / save / load / delete) — single row ── */
                .me-editor-hud .me-filebar { display: flex; gap: 6px; align-items: stretch; flex-wrap: nowrap; }
                .me-editor-hud .me-name-input {
                    flex: 1 1 0; min-width: 0; padding: 8px 10px; border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.14); background: rgba(12,10,20,0.8); color: #fff; font-size: 12px;
                }
                .me-editor-hud .me-name-input:focus { outline: none; border-color: rgba(160,140,255,0.8); }
                .me-editor-hud .me-load-select {
                    flex: 1 1 0; min-width: 0; padding: 7px 8px; border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.14); background: rgba(30,26,44,0.9); color: #fff; font-size: 11px;
                }
                .me-editor-hud .me-filebar .me-btn { flex: 0 0 auto; }

                /* ── Header ── */
                .me-editor-hud .me-hud-header { display: flex; align-items: center; gap: 8px; }
                .me-editor-hud .me-hud-title { font-weight: 800; letter-spacing: 0.04em; font-size: 14px; }
                .me-editor-hud .me-hud-spacer { flex: 1 1 auto; }
                .me-editor-hud .me-hud-back {
                    flex: 0 0 auto; width: 34px; height: 34px; padding: 0; font-size: 16px; line-height: 1;
                    border-radius: 8px; cursor: pointer;
                    border: 1px solid rgba(255,255,255,0.14); background: rgba(46,40,66,0.9); color: #eee;
                }
                .me-editor-hud .me-hud-back:hover { background: rgba(86,72,130,0.95); }

                /* ── Rotation dial (Select tool): the big, obvious "spin it" UI ── */
                .me-editor-hud .me-rot-howto {
                    font-size: 9.5px; line-height: 1.4; color: rgba(220,220,255,0.7);
                    padding: 4px 8px 6px;
                }
                .me-editor-hud .me-rot-howto b { color: var(--gold, #ffd24a); }
                .me-editor-hud .me-rot-wrap {
                    display: flex; gap: 12px; align-items: center; padding: 4px 8px 8px;
                }
                .me-editor-hud .me-rot-dial {
                    position: relative; width: 108px; height: 108px; flex: 0 0 auto;
                    border-radius: 50%; cursor: grab; touch-action: none; user-select: none;
                    background: radial-gradient(circle at 50% 42%, rgba(60,46,96,0.95), rgba(20,14,32,0.98));
                    border: 2px solid rgba(124,77,255,0.6);
                    box-shadow: inset 0 0 18px rgba(0,0,0,0.6), 0 0 0 4px rgba(124,77,255,0.08);
                }
                .me-editor-hud .me-rot-dial:active { cursor: grabbing; }
                .me-editor-hud .me-rot-cardinal {
                    position: absolute; font-size: 10px; font-weight: 800; line-height: 1;
                    color: rgba(220,220,255,0.65); transform: translate(-50%,-50%); pointer-events: none;
                }
                .me-editor-hud .me-rc-n { left: 50%; top: 11px; color: var(--gold,#ffd24a); }
                .me-editor-hud .me-rc-s { left: 50%; top: calc(100% - 11px); }
                .me-editor-hud .me-rc-e { left: calc(100% - 10px); top: 50%; }
                .me-editor-hud .me-rc-w { left: 10px; top: 50%; }
                .me-editor-hud .me-rot-arrow {
                    position: absolute; left: 50%; bottom: 50%;
                    width: 0; height: 0;
                    border-left: 10px solid transparent; border-right: 10px solid transparent;
                    border-bottom: 44px solid #ffd24a;
                    transform-origin: 50% 100%; transform: translate(-50%,0) rotate(0deg);
                    filter: drop-shadow(0 0 5px rgba(255,210,74,0.7)); pointer-events: none;
                }
                .me-editor-hud .me-rot-hub {
                    position: absolute; left: 50%; top: 50%; width: 12px; height: 12px;
                    border-radius: 50%; background: #ffd24a; transform: translate(-50%,-50%);
                    box-shadow: 0 0 7px rgba(255,210,74,0.9); pointer-events: none;
                }
                .me-editor-hud .me-rot-side { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 7px; }
                .me-editor-hud .me-rot-degbig {
                    font-family: DotGothic16, monospace; font-weight: 800; font-size: 26px;
                    color: var(--gold,#ffd24a); line-height: 1; text-align: center;
                }
                .me-editor-hud .me-rot-slider { width: 100%; accent-color: #ffd24a; }

                /* ═══ 2026-07 PRO SKIN — tightened, neutral, editing-suite look ═══
                   A restrained dark-slate surface system (à la Photoshop panels):
                   consistent 1px hairlines, flat surfaces with subtle elevation,
                   one violet accent, crisp focus/active states, kbd chips. */
                .me-editor-hud {
                    background: linear-gradient(180deg, rgba(24,23,31,0.985), rgba(17,16,23,0.985));
                    border-left: 1px solid rgba(255,255,255,0.07);
                    box-shadow: -12px 0 28px rgba(0,0,0,0.45);
                    gap: 7px;
                }
                .me-editor-hud .me-hud-header {
                    padding: 2px 2px 6px;
                    border-bottom: 1px solid rgba(255,255,255,0.07);
                }
                .me-editor-hud .me-hud-title {
                    font-size: 12.5px;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    color: #d6d1ef;
                }
                .me-editor-hud .me-section {
                    background: rgba(255,255,255,0.028);
                    border: 1px solid rgba(255,255,255,0.055);
                    border-radius: 7px;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
                }
                .me-editor-hud .me-section-label { color: rgba(196,188,235,0.9); }
                .me-editor-hud .me-section-label:hover { color: #fff; }

                /* Flat, consistent control surfaces. */
                .me-editor-hud .me-tool,
                .me-editor-hud .me-tbtn,
                .me-editor-hud .me-btn,
                .me-editor-hud .me-z-btn,
                .me-editor-hud .me-hbtn,
                .me-editor-hud .me-hud-back,
                .me-editor-hud .me-hud-size-row button,
                .me-editor-hud .me-tab {
                    background: #2b2936;
                    border: 1px solid #3d3a4c;
                    border-radius: 6px;
                    color: #d5d1e6;
                    transition: background 0.08s, border-color 0.08s, transform 0.05s;
                }
                .me-editor-hud .me-tool:hover,
                .me-editor-hud .me-tbtn:hover:not([disabled]),
                .me-editor-hud .me-btn:hover:not([disabled]),
                .me-editor-hud .me-z-btn:hover,
                .me-editor-hud .me-hbtn:hover,
                .me-editor-hud .me-hud-back:hover,
                .me-editor-hud .me-hud-size-row button:hover,
                .me-editor-hud .me-tab:hover {
                    background: #37344a;
                    border-color: #57517a;
                }
                .me-editor-hud .me-tool.active,
                .me-editor-hud .me-tab.active,
                .me-editor-hud .me-hbtn.active,
                .me-editor-hud .me-tbtn.active,
                .me-editor-hud .me-z-lock.active {
                    background: linear-gradient(180deg, #7a5cff, #5f43e6);
                    border-color: #a892ff;
                    color: #fff;
                    box-shadow: 0 0 0 1px rgba(168,146,255,0.45), 0 2px 8px rgba(95,67,230,0.35);
                }
                .me-editor-hud .me-tool-p1.active { background: linear-gradient(180deg,#5b9bff,#2f6fdf); border-color:#9cc4ff; }
                .me-editor-hud .me-tool-p2.active { background: linear-gradient(180deg,#ff6b6b,#d23b3b); border-color:#ffb0b0; }

                /* kbd shortcut chips inside tool buttons. */
                .me-editor-hud .me-tool kbd {
                    font-family: inherit;
                    font-size: 8.5px;
                    line-height: 1;
                    margin-left: 6px;
                    padding: 2px 4px 1px;
                    border-radius: 3px;
                    background: rgba(0,0,0,0.32);
                    border: 1px solid rgba(255,255,255,0.16);
                    color: rgba(230,225,250,0.75);
                }
                .me-editor-hud .me-tool.active kbd { background: rgba(0,0,0,0.25); color: #fff; }

                /* Palette grid: bigger swatches, hover raise, crisp selection. */
                .me-editor-hud .me-palette { gap: 5px; padding: 6px 4px; }
                .me-editor-hud .me-pal-item {
                    border-radius: 6px;
                    border: 1px solid transparent;
                    padding: 4px 2px 3px;
                    transition: transform 0.06s, background 0.08s, border-color 0.08s;
                }
                .me-editor-hud .me-pal-item:hover {
                    background: rgba(122,92,255,0.14);
                    border-color: rgba(168,146,255,0.45);
                    transform: translateY(-1px);
                }
                .me-editor-hud .me-pal-item.active {
                    background: rgba(122,92,255,0.26);
                    border-color: #a892ff;
                    box-shadow: 0 0 0 1px rgba(168,146,255,0.55);
                }
                .me-editor-hud .me-pal-swatch {
                    border-radius: 5px;
                    border: 1px solid rgba(255,255,255,0.10);
                    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.35);
                    image-rendering: pixelated;
                }
                .me-editor-hud .me-pal-cat {
                    letter-spacing: 0.14em;
                    color: rgba(190,182,230,0.72);
                    border-top: 1px solid rgba(255,255,255,0.055);
                    padding-top: 7px;
                }

                /* Inputs. */
                .me-editor-hud .me-search,
                .me-editor-hud .me-name-input,
                .me-editor-hud .me-load-select,
                .me-editor-hud .me-tint-hexinput {
                    background: #1c1a24;
                    border: 1px solid #3d3a4c;
                    border-radius: 6px;
                    color: #e6e2f5;
                }
                .me-editor-hud .me-search:focus,
                .me-editor-hud .me-name-input:focus,
                .me-editor-hud .me-tint-hexinput:focus {
                    outline: none;
                    border-color: #a892ff;
                    box-shadow: 0 0 0 2px rgba(122,92,255,0.25);
                }

                /* Toolbar + filebar read as one compact command strip. */
                .me-editor-hud .me-toolbar,
                .me-editor-hud .me-filebar {
                    background: rgba(255,255,255,0.028);
                    border: 1px solid rgba(255,255,255,0.055);
                    border-radius: 7px;
                    padding: 5px;
                }
                .me-editor-hud .me-help-bar {
                    background: rgba(122,92,255,0.08);
                    border: 1px solid rgba(122,92,255,0.20);
                    color: rgba(214,209,239,0.68);
                }
                .me-editor-hud .me-btn-play {
                    background: linear-gradient(180deg,#35d97a,#1ea757);
                    border: 1px solid #5cf09a;
                    box-shadow: 0 2px 10px rgba(30,167,87,0.35);
                }
                .me-editor-hud .me-btn-play:hover { background: linear-gradient(180deg,#46e588,#27b863); }
                .me-editor-hud .me-btn-danger { background: rgba(150,40,40,0.85); border-color: rgba(255,120,120,0.4); }
            `;
            document.head.appendChild(s);
        }

        function _meShowEditorHUD() {
            let hud = document.getElementById('meEditorHUD');
            if (hud) { hud.style.display = ''; return; }

            const mapRow = document.getElementById('mapRow');
            if (!mapRow) return;

            _meInjectEditorStyles();

            hud = document.createElement('div');
            hud.id = 'meEditorHUD';
            hud.className = 'me-editor-hud';

            hud.innerHTML = `
                <div class="me-hud-header">
                    <button class="me-hud-back" onclick="window._meBack()" title="Back">←</button>
                    <span class="me-hud-title">Map Editor</span>
                    <span class="me-hud-spacer"></span>
                    <button class="me-hud-back" onclick="window.togglePauseMenu()" title="Settings &amp; Music (Esc)">⚙</button>
                    <button class="me-btn me-btn-play" onclick="window._mePlayTest()">▶ Play Test</button>
                </div>

                <div class="me-toolbar">
                    <button class="me-tbtn" id="meUndoBtn" onclick="window._meUndo()" disabled style="opacity:0.38" title="Undo (Ctrl+Z)"><span class="ico">↩</span>Undo</button>
                    <button class="me-tbtn" id="meRedoBtn" onclick="window._meRedo()" disabled style="opacity:0.38" title="Redo (Ctrl+Y)"><span class="ico">↪</span>Redo</button>
                    <span class="me-tbar-sep"></span>
                    <button class="me-tbtn" onclick="window._meClear()" title="Clear the whole board"><span class="ico">✕</span>Clear</button>
                    <button class="me-tbtn" onclick="window._meFill()" title="Fill the board with the selected tile"><span class="ico">▩</span>Fill</button>
                    <button class="me-tbtn" onclick="window._meRandomize()" title="Randomize the board"><span class="ico">🎲</span>Random</button>
                    <span class="me-tbar-sep"></span>
                    <button class="me-tbtn" id="meZonesBtn" onclick="window._meToggleZonePreview()" title="Show where spawn zones, nexus zones and CTF flags would be auto-placed for this map size"><span class="ico">🗺️</span>Zones</button>
                    <span class="me-tbar-sep"></span>
                    <button class="me-tbtn" onclick="window._meImport()" title="Import a map from text"><span class="ico">⬇</span>Import</button>
                    <button class="me-tbtn" onclick="window._meExport()" title="Export this map to text"><span class="ico">⬆</span>Export</button>
                </div>

                <div class="me-filebar">
                    <input type="text" class="me-name-input" id="meMapName" placeholder="Map name…" value="Custom Map" />
                    <button class="me-btn" onclick="window._meSave()" title="Save this map">💾 Save</button>
                    <select class="me-load-select" id="meLoadSelect" onchange="window._meLoadSelected()">
                        <option value="">— Load saved —</option>
                    </select>
                    <button class="me-btn me-btn-danger me-btn-icon" onclick="window._meDeleteSaved()" title="Delete the selected saved map">🗑️</button>
                </div>

                <div class="me-help-bar">Click to place · drag to paint · right-click a tile to inspect · <b>B</b>rush <b>O</b>bject <b>V</b>select <b>E</b>rase · <b>R</b> rotate · <b>[ ]</b> Z layer · <b>L</b> Z-lock · Ctrl+Z/Y undo</div>

                <div class="me-section collapsed" id="meSec-size">
                    <button type="button" class="me-section-label" onclick="window._meToggleSection('meSec-size')"><span class="me-sec-caret">▾</span> Canvas Size · <span id="meSizeSummary">${_meW}×${_meH}</span></button>
                    <div class="me-section-body">
                    <div class="me-hud-size-row">
                        <span class="me-label">W</span>
                        <button onclick="window._meResizeW(-1)">−</button>
                        <span class="me-size-val" id="meWidthVal">${_meW}</span>
                        <button onclick="window._meResizeW(1)">+</button>
                        <span class="me-label" style="margin-left:10px">H</span>
                        <button onclick="window._meResizeH(-1)">−</button>
                        <span class="me-size-val" id="meHeightVal">${_meH}</span>
                        <button onclick="window._meResizeH(1)">+</button>
                    </div>
                    </div>
                </div>

                <div class="me-section" id="meSec-tools">
                    <button type="button" class="me-section-label" onclick="window._meToggleSection('meSec-tools')"><span class="me-sec-caret">▾</span> Tools</button>
                    <div class="me-section-body">
                    <div class="me-tool-row">
                        <button class="me-tool active" id="meTool-paint" onclick="window._meSetTool('paint')" title="Paint terrain (B)">🖌️ Paint<kbd>B</kbd></button>
                        <button class="me-tool" id="meTool-object" onclick="window._meSetTool('object')" title="Place objects (O)">🏠 Object<kbd>O</kbd></button>
                        <button class="me-tool" id="meTool-select" onclick="window._meSetTool('select')" title="Select & rotate a placed object (V)">🎯 Select<kbd>V</kbd></button>
                    </div>
                    <div class="me-tool-row">
                        <button class="me-tool" id="meTool-erase" onclick="window._meSetTool('erase')" title="Erase terrain — digs a real hole (E)">🧹 Erase<kbd>E</kbd></button>
                        <button class="me-tool" id="meTool-eraseObj" onclick="window._meSetTool('eraseObj')" title="Erase the top object on this tile (X)">✖ Erase Obj<kbd>X</kbd></button>
                    </div>
                    <div class="me-tool-row">
                        <button class="me-tool me-tool-p1" id="meTool-spawn1" onclick="window._meSetTool('spawn1')" title="Place a Player 1 spawn">🔵 P1 Spawn</button>
                        <button class="me-tool me-tool-p2" id="meTool-spawn2" onclick="window._meSetTool('spawn2')" title="Place a Player 2 spawn">🔴 P2 Spawn</button>
                    </div>
                    </div>
                </div>

                <div class="me-section collapsed" id="meSec-elev">
                    <button type="button" class="me-section-label" onclick="window._meToggleSection('meSec-elev')"><span class="me-sec-caret">▾</span> Elevation</button>
                    <div class="me-section-body">
                    <div class="me-tool-row me-elev-row">
                        <button class="me-tool" id="meTool-elevUp" onclick="window._meSetTool('elevUp')" title="Raise a tile by one level">⬆ Raise</button>
                        <button class="me-tool" id="meTool-elevDown" onclick="window._meSetTool('elevDown')" title="Lower a tile by one level">⬇ Lower</button>
                        <button class="me-tool" id="meTool-elevSet" onclick="window._meSetTool('elevSet')" title="Set a tile to the chosen height">📐 Set</button>
                    </div>
                    <div class="me-z-cursor-wrap">
                        <span class="me-z-label">Z Layer</span>
                        <button class="me-z-btn" onclick="window._meAdjustZ(-1)">−</button>
                        <span class="me-z-value" id="meActiveZVal">${_meActiveZ}</span>
                        <button class="me-z-btn" onclick="window._meAdjustZ(1)">+</button>
                        <button class="me-z-btn me-z-lock" id="meZLockBtn" onclick="window._meToggleZLock()" title="Z-Lock — paint/erase EXACTLY this layer, so you can slot blocks UNDERNEATH existing blocks or carve buried layers">🔓 Z-Lock</button>
                        <span class="me-z-hint" id="meZHint"></span>
                    </div>
                    <div class="me-elev-picker-wrap">
                        <span class="me-elev-label">Height</span>
                        <div class="me-elev-picker" id="meElevPicker"></div>
                    </div>
                    </div>
                </div>

                <div class="me-section me-section-palette" id="meSec-palette">
                    <button type="button" class="me-section-label" onclick="window._meToggleSection('meSec-palette')"><span class="me-sec-caret">▾</span> Tiles, Objects &amp; Monuments</button>
                    <div class="me-section-body">
                    <input type="text" class="me-search" id="meSearch" placeholder="🔍 Search all tiles, objects & monuments…" oninput="window._meOnSearch()" />
                    <div class="me-tab-row">
                        <button class="me-tab active" id="meTab-terrain" onclick="window._meSetTab('terrain')">Terrain</button>
                        <button class="me-tab" id="meTab-objects" onclick="window._meSetTab('objects')">Objects</button>
                        <button class="me-tab" id="meTab-monuments" onclick="window._meSetTab('monuments')">Monuments</button>
                    </div>
                    <div class="me-palette" id="mePalette"></div>
                    </div>
                </div>
            `;

            mapRow.appendChild(hud);

            const picker = hud.querySelector('#meElevPicker');
            if (picker) {
                let ph = '';
                for (let h = 0; h <= 20; h++) {
                    const cls = h === 0 ? 'me-hbtn me-hbtn-zero' : 'me-hbtn';
                    const active = h === 1 ? ' active' : '';
                    const id = 'meHBtn-' + h;
                    ph += `<button class="${cls}${active}" id="${id}" onclick="window._meSetHeight(${h})">${h}</button>`;
                }
                picker.innerHTML = ph;
            }

            _mePopulateSavedList();
            _meUpdateToolButtons();
            /* Show the palette that matches the active tool. Default is Paint, so
               the terrain swatches should be visible on open — the elevation guide
               only belongs when an elevation tool is selected. */
            if (_meTool === 'elevUp' || _meTool === 'elevDown' || _meTool === 'elevSet') {
                _meRenderElevationPalette();
            } else {
                _meRenderPalette();
            }
        }

        function _meHideEditorHUD() {
            const hud = document.getElementById('meEditorHUD');
            if (hud) hud.remove();
        }

        function _meEnterDioramaEditor() {
            state.phase = 'editor';
            state.titleScreenVisible = false;
            /* Entering the editor is itself a user gesture, so audio may start —
               this lets the pause menu's music controls (Esc / ⚙) work here. */
            state.audioUnlocked = true;
            if (typeof syncMusicToState === 'function') syncMusicToState().catch(() => {});
            state.dioramaTiltDeg = state.dioramaTiltDeg ?? 50;
            state.dioramaYawDeg = state.dioramaYawDeg ?? 0;
            state.userZoomScale = 1;

            _meSyncToState();

            if (startOverlay) {
                startOverlay.classList.add('hidden');
                startOverlay.style.display = 'none';
                startOverlay.style.pointerEvents = 'none';
            }
            const mapRow = document.getElementById('mapRow');
            if (mapRow) {
                mapRow.style.display = 'flex';
                mapRow.style.height = '100vh';
            }

            const builderOv = document.getElementById('builderOverlay');
            if (builderOv) builderOv.style.display = 'none';

            document.body.classList.add('diorama-3d');

            const ann = document.getElementById('announcementBanner');
            if (ann) ann.style.display = 'none';
            const tb = document.getElementById('turnBannerOverlay');
            if (tb) tb.style.display = 'none';
            const vs = document.getElementById('vsSplashOverlay');
            if (vs) vs.style.display = 'none';

            const bip = document.getElementById('battleInfoPanel');
            if (bip) bip.style.display = 'none';
            const uap = document.getElementById('unitActionPanelWrap');
            if (uap) uap.style.display = 'none';

            document.querySelectorAll('.battle-hud-scoreboard, .battle-hud-roster, .float-action-menu').forEach(el => el.style.display = 'none');

            const reactHud = document.getElementById('reactHudRoot');
            if (reactHud) reactHud.style.display = 'none';

            const _mcEl = document.querySelector('.map-center');
            if (_mcEl) {
                _mcEl.style.width = '100%';
                _mcEl.style.height = '100%';
                _mcEl.style.maxHeight = '100%';
                _mcEl.style.flex = '1';
            }

            CONFIG.tileSize = BASE_TILE;

            if (typeof invalidateTerrainChunkCache === 'function') invalidateTerrainChunkCache();
            if (typeof invalidateLayoutCache === 'function') invalidateLayoutCache();
            if (typeof renderBoard === 'function') renderBoard();

            _meShowEditorHUD();

            requestAnimationFrame(() => { requestAnimationFrame(() => {

                if (typeof invalidateLayoutCache === 'function') invalidateLayoutCache();

                if (typeof ThreeRenderer !== 'undefined') {
                    if (!ThreeRenderer.isActive()) {
                        ThreeRenderer.activate();
                        console.log('[MapEditor] Three.js renderer activated for editor');
                    } else {

                        ThreeRenderer.rebuildTerrain();
                        ThreeRenderer.rebuildObjects();
                    }
                }

                if (typeof ThreeCamera !== 'undefined' && ThreeCamera.snapImmediate) {
                    ThreeCamera.snapImmediate();
                }

                if (typeof camera !== 'undefined') {
                    camera.tilt = 50;
                    camera.yaw = 0;
                    camera.camZ = 900;
                    camera._smoothInited = false;
                }
                if (typeof setBoardCameraFocusPoint === 'function') {
                    setBoardCameraFocusPoint(Math.floor(_meW / 2), Math.floor(_meH / 2), { zoom: 1, _bypassCap: true });
                }

                _meRebuildEditorOverlays3D();
            }); });

            if (!window._meKeyHandler) {
                window._meKeyHandler = function(e) {
                    if (state.phase !== 'editor') return;
                    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
                    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); _meUndo(); }
                    else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); _meRedo(); }
                    /* R / Shift+R spins the selected object 45° (place first, then
                       rotate — no pre-orienting). */
                    else if (e.key === 'r' || e.key === 'R') {
                        const kind = _meSelectedMonEntry() ? 'mon' : (_meSelectedObjEntry() ? 'obj' : null);
                        if (kind) { e.preventDefault(); window._meRotateSelBy(kind, e.shiftKey ? -45 : 45); }
                    }
                    /* Pro-editor single-key tool shortcuts (no modifiers). */
                    else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                        const k = e.key.toLowerCase();
                        if (k === 'b')      { e.preventDefault(); window._meSetTool('paint'); }
                        else if (k === 'o') { e.preventDefault(); window._meSetTool('object'); }
                        else if (k === 'v') { e.preventDefault(); window._meSetTool('select'); }
                        else if (k === 'e') { e.preventDefault(); window._meSetTool('erase'); }
                        else if (k === 'x') { e.preventDefault(); window._meSetTool('eraseObj'); }
                        else if (k === 'l') { e.preventDefault(); window._meToggleZLock(); }
                        else if (k === 'g') { e.preventDefault(); window._meToggleZonePreview(); }
                        else if (k === '[') { e.preventDefault(); window._meAdjustZ(-1); }
                        else if (k === ']') { e.preventDefault(); window._meAdjustZ(1); }
                    }
                };
                document.addEventListener('keydown', window._meKeyHandler);
            }
        }

        function _meExitDioramaEditor() {
            state.phase = 'setup';
            state.titleScreenVisible = true;

            _meHideEditorHUD();

            _meClearEditorOverlays3D();

            if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive()) {
                ThreeRenderer.deactivate();
                console.log('[MapEditor] Three.js renderer deactivated');
            }

            const _mcEl = document.querySelector('.map-center');
            if (_mcEl) {
                _mcEl.style.width = '';
                _mcEl.style.height = '';
                _mcEl.style.maxHeight = '';
                _mcEl.style.flex = '';
            }

            document.querySelectorAll('.me-diorama-overlay').forEach(el => el.remove());

            const mapRow = document.getElementById('mapRow');
            if (mapRow) {
                mapRow.style.display = 'none';
                mapRow.style.height = '';
            }

            if (startOverlay) {
                startOverlay.classList.remove('hidden');
                startOverlay.style.display = '';
                startOverlay.style.pointerEvents = '';
            }

            const bip = document.getElementById('battleInfoPanel');
            if (bip) bip.style.display = '';
            const uap = document.getElementById('unitActionPanelWrap');
            if (uap) uap.style.display = '';
            document.querySelectorAll('.battle-hud-scoreboard, .battle-hud-roster, .float-action-menu').forEach(el => el.style.display = '');

            const reactHud = document.getElementById('reactHudRoot');
            if (reactHud) reactHud.style.display = '';

            _showTitlePage('mainMenuPage');
        }

        function _meTerrainBg(terrainKey) {
            if (!terrainKey) return '';
            if (typeof TERRAIN_SPRITES !== 'undefined' && TERRAIN_SPRITES[terrainKey]) {
                return `url('${TERRAIN_SPRITES[terrainKey][0]}')`;
            }
            return '';
        }

        function _meObjectBg(objKey) {
            if (!objKey) return '';
            if (typeof OBJECT_SPRITES !== 'undefined' && OBJECT_SPRITES[objKey]) {
                return `url('${OBJECT_SPRITES[objKey].url}')`;
            }
            return '';
        }

        function _meSelectedObjEntry() {
            const r = _meSelectedObjRef;
            if (!r) return null;
            const stk = _meObjects[r.y] && _meObjects[r.y][r.x];
            if (!Array.isArray(stk) || !stk[r.idx]) return null;
            return stk[r.idx];
        }

        /* The monument picked with the Select tool (or just placed), or null. */
        function _meSelectedMonEntry() {
            if (_meSelectedMonRef == null) return null;
            return (Array.isArray(_meMonuments) && _meMonuments[_meSelectedMonRef]) || null;
        }

        /* Find the monument whose (centered) footprint covers, or is nearest to,
           a clicked tile — so clicking anywhere on a big monument selects it. */
        function _meFindMonumentNear(cx, cy) {
            if (!Array.isArray(_meMonuments) || !_meMonuments.length) return null;
            let best = null, bestD = Infinity;
            for (let i = 0; i < _meMonuments.length; i++) {
                const m = _meMonuments[i];
                const rr = Math.max(1, Math.floor((m.foot || 3) / 2));
                const dx = Math.abs(cx - m.x), dy = Math.abs(cy - m.y);
                if (dx <= rr && dy <= rr) {           // click is inside the footprint
                    const d = dx * dx + dy * dy;
                    if (d < bestD) { bestD = d; best = i; }
                }
            }
            return best;
        }

        function _meScrollPaletteToTop() {
            const p = document.getElementById('mePalette');
            if (p) p.scrollTop = 0;
        }
        /* Force the 3D object layer to rebuild right now (used after rotate /
           mirror / leaf so the change is visible immediately, not on the next
           incidental redraw). */
        function _meRefreshObjects3D() {
            if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive && ThreeRenderer.isActive() && ThreeRenderer.rebuildObjects) {
                ThreeRenderer.rebuildObjects();
            }
        }
        /* Find the object nearest to a clicked tile, searching the tile itself
           first and then rings of increasing radius. Tall sprites (trees,
           buildings) render offset from their base tile, so an exact-tile match
           alone makes selection feel broken — this makes clicking forgiving.
           Returns a {x,y,idx} ref to the topmost object on the closest occupied
           tile, or null when nothing is within range. */
        function _meFindObjectNear(cx, cy, maxR = 2) {
            const has = (x, y) => x >= 0 && y >= 0 && x < _meW && y < _meH &&
                Array.isArray(_meObjects[y]?.[x]) && _meObjects[y][x].length > 0;
            if (has(cx, cy)) return { x: cx, y: cy, idx: _meObjects[cy][cx].length - 1 };
            for (let r = 1; r <= maxR; r++) {
                let best = null, bestD = Infinity;
                for (let dy = -r; dy <= r; dy++) {
                    for (let dx = -r; dx <= r; dx++) {
                        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; /* ring only */
                        const x = cx + dx, y = cy + dy;
                        if (!has(x, y)) continue;
                        const d = dx * dx + dy * dy;
                        if (d < bestD) { bestD = d; best = { x, y, idx: _meObjects[y][x].length - 1 }; }
                    }
                }
                if (best) return best;
            }
            return null;
        }

        function _meRenderPalette() {
            const pal = document.getElementById('mePalette');
            if (!pal) return;
            const searchVal = (document.getElementById('meSearch')?.value || '').toLowerCase().trim();
            let html = '';

            /* ── Selected-object panel (rotate / mirror / leaves AFTER placement).
               Shown above the palette whenever an object is picked with the
               Select tool, so the user never has to pre-orient a brush. ──────── */
            const selEntry = _meSelectedObjEntry();
            const selMon = _meSelectedMonEntry();
            if (selEntry || selMon) {
                let kind, label, coord, rotVal, isStair = false, isTree = false, isRock = false, isTorch = false;
                if (selMon) {
                    kind = 'mon';
                    const md = ME_MON_BY_KIND[selMon.kind];
                    label = `🗿 ${md ? md.label : selMon.kind}`;
                    coord = `(${selMon.x},${selMon.y})`;
                    rotVal = selMon.rot || 0;
                } else {
                    kind = 'obj';
                    const selKey = ME_OBJECT_IDS[selEntry.oid] || '?';
                    label = (typeof OBJECT_RULES !== 'undefined' && OBJECT_RULES[selKey]) ? OBJECT_RULES[selKey].label : selKey;
                    coord = `(${_meSelectedObjRef.x},${_meSelectedObjRef.y})`;
                    rotVal = selEntry.rot || 0;
                    isStair = (selKey === 'stairs' || selKey === 'stairs_2');
                    isTree = _meIsTreeKey(selKey);
                    isRock = _meIsRockKey(selKey);
                    isTorch = _meIsTorchKey(selKey);
                }

                html += `<div class="me-pal-cat me-pal-cat-gamemode">🎯 Rotate: ${label} <span style="opacity:0.6;font-weight:400">${coord}</span></div>`;
                html += `<div class="me-rot-howto">Drag the dial to aim it (snaps to 45°), tap N/E/S/W, or press <b>R</b> / <b>Shift+R</b>. The gold arrow on the board shows which way it faces.</div>`;

                /* The dial: a big draggable compass that points the way the
                   object/monument faces — the single clearest "is it working" signal. */
                html += `<div class="me-rot-wrap">`;
                html += `<div class="me-rot-dial" onpointerdown="window._meDialDown(event,'${kind}')" onpointermove="window._meDialMove(event,'${kind}')" onpointerup="window._meDialUp(event)" onpointercancel="window._meDialUp(event)" title="Drag to aim">`;
                html += `<div class="me-rot-cardinal me-rc-n">N</div><div class="me-rot-cardinal me-rc-e">E</div><div class="me-rot-cardinal me-rc-s">S</div><div class="me-rot-cardinal me-rc-w">W</div>`;
                html += `<div class="me-rot-arrow" id="meDialArrow" style="transform:translate(-50%,0) rotate(${rotVal}deg)"></div>`;
                html += `<div class="me-rot-hub"></div>`;
                html += `</div>`;
                html += `<div class="me-rot-side">`;
                html += `<div class="me-rot-degbig"><span id="meDialDeg">${rotVal}</span><span style="font-size:14px">°</span></div>`;
                html += `<input type="range" class="me-rot-slider" min="0" max="315" step="45" value="${rotVal}" oninput="window._meRotateSel('${kind}', this.value)">`;
                html += `<div class="me-pbtn-row">`;
                html += `<div class="me-pbtn" onclick="window._meRotateSel('${kind}',0)" title="Face North">↑ N</div>`;
                html += `<div class="me-pbtn" onclick="window._meRotateSel('${kind}',90)" title="Face East">→ E</div>`;
                html += `<div class="me-pbtn" onclick="window._meRotateSel('${kind}',180)" title="Face South">↓ S</div>`;
                html += `<div class="me-pbtn" onclick="window._meRotateSel('${kind}',270)" title="Face West">← W</div>`;
                html += `</div>`;
                html += `<div class="me-pbtn-row">`;
                for (const d of [-90,-45,45,90]) html += `<div class="me-pbtn" onclick="window._meRotateSelBy('${kind}',${d})">${d>0?'+':''}${d}°</div>`;
                html += `</div></div></div>`;

                /* Object-only extras: mirror, leaves. */
                if (kind === 'obj') {
                    html += `<div class="me-placement-grid">`;
                    html += `<span class="me-plbl">Mirror</span><div class="me-pbtn-row">`;
                    html += `<div class="me-pbtn${selEntry.flipX?' active':''}" onclick="window._meFlipSelected('x')">↔ H</div>`;
                    html += `<div class="me-pbtn${selEntry.flipY?' active':''}" onclick="window._meFlipSelected('y')">↕ V</div>`;
                    html += `<div class="me-pbtn" style="color:#f99" onclick="window._meDeleteSelectedObj()">✖ Delete</div></div>`;
                    html += `</div>`;
                    if (isTree) {
                        html += `<div class="me-pal-cat me-placement-header">🍃 Leaves</div>`;
                        html += `<div class="me-pbtn-row" style="flex-wrap:wrap;padding:4px 6px;gap:4px">`;
                        for (const lf of ME_LEAF_OPTIONS) {
                            const la = (selEntry.leaf || 'leaves') === lf ? ' active' : '';
                            html += `<div class="me-pbtn${la}" style="background-image:${_meTerrainBg(lf)};background-size:cover;width:32px;height:32px" title="${lf}" onclick="window._meSetSelectedLeaf('${lf}')"></div>`;
                        }
                        html += `</div>`;
                    } else if (isRock) {
                        html += `<div class="me-pal-cat me-placement-header">🪨 Rock texture</div>`;
                        html += `<div class="me-pbtn-row" style="flex-wrap:wrap;padding:4px 6px;gap:4px">`;
                        for (const rt of ME_ROCK_OPTIONS) {
                            const ra = (selEntry.leaf || 'rocks_1') === rt ? ' active' : '';
                            html += `<div class="me-pbtn${ra}" style="background-image:${_meTerrainBg(rt)};background-size:cover;width:32px;height:32px" title="${rt}" onclick="window._meSetSelectedLeaf('${rt}')"></div>`;
                        }
                        html += `</div>`;
                    } else if (isTorch) {
                        html += `<div class="me-pal-cat me-placement-header">🔥 Mount</div>`;
                        html += `<div class="me-pbtn-row" style="padding:4px 6px;gap:4px">`;
                        for (const tm of ME_TORCH_MOUNTS) {
                            const ta = (selEntry.leaf || 'floor') === tm.key ? ' active' : '';
                            html += `<div class="me-pbtn${ta}" title="${tm.tip}" onclick="window._meSetSelectedLeaf('${tm.key}')">${tm.label}</div>`;
                        }
                        html += `</div>`;
                        if ((selEntry.leaf || 'floor') === 'wall') {
                            html += `<div class="me-inspector-empty" style="font-size:9px;opacity:0.6;padding:2px 6px">The torch hangs on the tile side the dial points at — aim N/E/S/W at the neighbouring wall block.</div>`;
                        }
                    }
                } else {
                    html += `<div class="me-pbtn-row" style="padding:0 6px 4px">`;
                    html += `<div class="me-pbtn" style="color:#f99;flex:1" onclick="window._meDeleteSelectedMon()">✖ Delete monument</div></div>`;
                }
                html += `<div style="border-top:1px solid rgba(255,255,255,0.12);margin:6px 0"></div>`;
            } else if (_meTool === 'select') {
                html += `<div class="me-inspector-empty" style="font-size:10px;opacity:0.7;padding:8px">🎯 Click any object <b>or monument</b> on the board to select it, then use the big dial to rotate it any direction.</div>`;
            }

            /* ── Global search: when the user types in the search box, ignore the
               active tab and surface matches from ALL three palettes (terrain,
               objects, monuments) at once. This is what makes the search box feel
               functional — picking a result still switches to the right tool. ── */
            if (searchVal) {
                let any = false;

                let terrHtml = '';
                for (const cat of ME_PALETTE_CATS) {
                    const filtered = cat.keys.filter(key => {
                        const rule = TERRAIN_RULES[key];
                        const label = rule ? rule.label : key;
                        return key.toLowerCase().includes(searchVal) || label.toLowerCase().includes(searchVal) || cat.label.toLowerCase().includes(searchVal);
                    });
                    for (const key of filtered) {
                        const rule = TERRAIN_RULES[key];
                        const label = rule ? rule.label : key;
                        const active = (_meTool === 'paint' && _meSelectedTerrain === key) ? ' active' : '';
                        terrHtml += `<div class="me-pal-item${active}" data-terrain="${key}" onclick="window._mePickTerrain('${key}')">
                            <div class="me-pal-swatch" style="background-image:${_meTerrainBg(key)}"></div>
                            <div class="me-pal-label">${label}</div>
                        </div>`;
                    }
                }
                if (terrHtml) { html += `<div class="me-pal-cat">🗺️ Terrain</div>` + terrHtml; any = true; }

                let objHtml = '';
                for (const cat of ME_OBJECT_CATS) {
                    const filtered = cat.keys.filter(key => {
                        const oRule = (typeof OBJECT_RULES !== 'undefined') ? OBJECT_RULES[key] : null;
                        const label = oRule ? oRule.label : key;
                        return key.toLowerCase().includes(searchVal) || label.toLowerCase().includes(searchVal) || cat.label.toLowerCase().includes(searchVal);
                    });
                    for (const key of filtered) {
                        const oRule = (typeof OBJECT_RULES !== 'undefined') ? OBJECT_RULES[key] : null;
                        const label = oRule ? oRule.label : key;
                        const active = (_meTool === 'object' && _meSelectedObject === key) ? ' active' : '';
                        const bgImg = _meObjectBg(key) || _meTerrainBg(key);
                        objHtml += `<div class="me-pal-item${active}" data-object="${key}" onclick="window._mePickObject('${key}')">
                            <div class="me-pal-swatch" style="background-image:${bgImg};background-size:contain;background-position:center bottom"></div>
                            <div class="me-pal-label">${label}</div>
                        </div>`;
                    }
                }
                if (objHtml) { html += `<div class="me-pal-cat">🏠 Objects</div>` + objHtml; any = true; }

                let monHtml = '';
                for (const m of ME_MONUMENT_KINDS) {
                    if (!(m.kind.includes(searchVal) || m.label.toLowerCase().includes(searchVal))) continue;
                    const active = (_meTool === 'monument' && _meSelectedMonument === m.kind) ? ' active' : '';
                    monHtml += `<div class="me-pal-item${active}" onclick="window._mePickMonument('${m.kind}')">
                        <div class="me-pal-swatch" style="display:flex;align-items:center;justify-content:center;font-size:22px;background:rgba(40,30,60,0.4)">${m.emoji}</div>
                        <div class="me-pal-label">${m.label}</div>
                    </div>`;
                }
                if (monHtml) { html += `<div class="me-pal-cat me-pal-cat-gamemode">🗿 Monuments</div>` + monHtml; any = true; }

                if (!any) html += `<div class="me-inspector-empty">No matches for "${searchVal}"</div>`;
                pal.innerHTML = html;
                return;
            }

            if (_mePaletteTab === 'monuments') {
                html += `<div class="me-pal-cat me-pal-cat-gamemode">🗿 Esoteric Monuments</div>`;
                const monFiltered = ME_MONUMENT_KINDS.filter(m => !searchVal || m.kind.includes(searchVal) || m.label.toLowerCase().includes(searchVal));
                for (const m of monFiltered) {
                    const active = (_meTool === 'monument' && _meSelectedMonument === m.kind) ? ' active' : '';
                    html += `<div class="me-pal-item${active}" onclick="window._mePickMonument('${m.kind}')">
                        <div class="me-pal-swatch" style="display:flex;align-items:center;justify-content:center;font-size:22px;background:rgba(40,30,60,0.4)">${m.emoji}</div>
                        <div class="me-pal-label">${m.label}</div>
                    </div>`;
                }
                const md = ME_MON_BY_KIND[_meSelectedMonument] || { foot: 2, maxH: 3 };
                const curFoot = _meMonFoot != null ? _meMonFoot : md.foot;
                const curMaxH = _meMonMaxH != null ? _meMonMaxH : md.maxH;
                html += `<div class="me-pal-cat me-placement-header">Size</div>`;
                html += `<div class="me-placement-grid">`;
                html += `<span class="me-plbl">Footprint</span><div class="me-pbtn-row">`;
                for (const f of [1,2,3,4,5,6,7]) html += `<div class="me-pbtn${curFoot===f?' active':''}" onclick="window._meSetMonFoot(${f})">${f}</div>`;
                html += `</div>`;
                html += `<span class="me-plbl">Max H</span><div class="me-pbtn-row">`;
                for (const hh of [1,2,3,4,5,6]) html += `<div class="me-pbtn${curMaxH===hh?' active':''}" onclick="window._meSetMonMaxH(${hh})">${hh}</div>`;
                html += `</div></div>`;
                html += `<div class="me-inspector-empty" style="font-size:9px;opacity:0.6;padding:6px;line-height:1.4">Click the board to place. Click a placed monument (or use the 🎯 Select tool) to pick it — a big rotation dial appears so you can spin it any direction; Delete is in that panel. They render as real 3D landmarks in Play Test. Climbable kinds (pyramid, ziggurat, obelisk, stairway, colossus) stamp climb voxels.</div>`;
                pal.innerHTML = html || `<div class="me-inspector-empty">No results for "${searchVal}"</div>`;
                return;
            }

            if (_mePaletteTab === 'terrain') {

                _meTintSyncFromKey();
                html += _meTintPanelHtml();

                for (const cat of ME_PALETTE_CATS) {
                    const filtered = cat.keys.filter(key => {
                        if (!searchVal) return true;
                        const rule = TERRAIN_RULES[key];
                        const label = rule ? rule.label : key;
                        return key.toLowerCase().includes(searchVal) || label.toLowerCase().includes(searchVal) || cat.label.toLowerCase().includes(searchVal);
                    });
                    if (filtered.length === 0) continue;
                    html += `<div class="me-pal-cat">${cat.label}</div>`;
                    for (const key of filtered) {
                        const rule = TERRAIN_RULES[key];
                        const label = rule ? rule.label : key;
                        const active = (_meTool === 'paint' && _meSelectedTerrain === key) ? ' active' : '';
                        const tintHex = _meTerrainTints[key];
                        const tintDot = tintHex ? `<span class="me-pal-tintdot" style="background:${tintHex}" title="Tinted ${tintHex}"></span>` : '';
                        html += `<div class="me-pal-item${active}" data-terrain="${key}" onclick="window._mePickTerrain('${key}')">
                            <div class="me-pal-swatch" style="background-image:${_meTerrainBg(key)}">${tintDot}</div>
                            <div class="me-pal-label">${label}</div>
                        </div>`;
                    }
                }
            } else {

                for (const cat of ME_OBJECT_CATS) {
                    const filtered = cat.keys.filter(key => {
                        if (!searchVal) return true;
                        const oRule = (typeof OBJECT_RULES !== 'undefined') ? OBJECT_RULES[key] : null;
                        const label = oRule ? oRule.label : key;
                        return key.toLowerCase().includes(searchVal) || label.toLowerCase().includes(searchVal) || cat.label.toLowerCase().includes(searchVal);
                    });
                    if (filtered.length === 0) continue;
                    const catCls = cat.isGameMode ? 'me-pal-cat me-pal-cat-gamemode' : 'me-pal-cat';
                    html += `<div class="${catCls}">${cat.label}</div>`;
                    for (const key of filtered) {
                        const oRule = (typeof OBJECT_RULES !== 'undefined') ? OBJECT_RULES[key] : null;
                        const label = oRule ? oRule.label : key;
                        const active = (_meTool === 'object' && _meSelectedObject === key) ? ' active' : '';
                        const bgImg = _meObjectBg(key) || _meTerrainBg(key);
                        html += `<div class="me-pal-item${active}" data-object="${key}" onclick="window._mePickObject('${key}')">
                            <div class="me-pal-swatch" style="background-image:${bgImg};background-size:contain;background-position:center bottom"></div>
                            <div class="me-pal-label">${label}</div>
                        </div>`;
                    }
                }

                if (_meIsTreeKey(_meSelectedObject)) {
                    html += `<div class="me-pal-cat me-placement-header">🍃 Leaves (new trees)</div>`;
                    html += `<div class="me-pbtn-row" style="flex-wrap:wrap;padding:4px 6px;gap:4px">`;
                    for (const lf of ME_LEAF_OPTIONS) {
                        const la = _meSelectedLeaf === lf ? ' active' : '';
                        html += `<div class="me-pbtn${la}" style="background-image:${_meTerrainBg(lf)};background-size:cover;width:34px;height:34px" title="${lf}" onclick="window._meSetLeaf('${lf}')"></div>`;
                    }
                    html += `</div>`;
                } else if (_meIsRockKey(_meSelectedObject)) {
                    html += `<div class="me-pal-cat me-placement-header">🪨 Rock texture (new rocks)</div>`;
                    html += `<div class="me-pbtn-row" style="flex-wrap:wrap;padding:4px 6px;gap:4px">`;
                    for (const rt of ME_ROCK_OPTIONS) {
                        const ra = _meSelectedRockTex === rt ? ' active' : '';
                        html += `<div class="me-pbtn${ra}" style="background-image:${_meTerrainBg(rt)};background-size:cover;width:34px;height:34px" title="${rt}" onclick="window._meSetRockTex('${rt}')"></div>`;
                    }
                    html += `</div>`;
                } else if (_meIsTorchKey(_meSelectedObject)) {
                    html += `<div class="me-pal-cat me-placement-header">🔥 Mount (new torches)</div>`;
                    html += `<div class="me-pbtn-row" style="padding:4px 6px;gap:4px">`;
                    for (const tm of ME_TORCH_MOUNTS) {
                        const ta = _meSelectedTorchMount === tm.key ? ' active' : '';
                        html += `<div class="me-pbtn${ta}" title="${tm.tip}" onclick="window._meSetTorchMount('${tm.key}')">${tm.label}</div>`;
                    }
                    html += `</div>`;
                    if (_meSelectedTorchMount === 'wall') {
                        html += `<div class="me-inspector-empty" style="font-size:9px;opacity:0.6;padding:2px 6px">Wall torches hang on the tile side the Rotate arrow points at (N/E/S/W) — place them on the open tile NEXT TO a raised block, aiming at its wall.</div>`;
                    }
                }

                html += `<div class="me-pal-cat me-placement-header">Placement</div>`;
                html += `<div class="me-placement-grid">`;
                html += `<span class="me-plbl">H-Align</span><div class="me-pbtn-row">`;
                for (const al of ['left','center','right']) { const ic=al==='left'?'◀':al==='right'?'▶':'⬛'; html += `<div class="me-pbtn${_meSelectedAlignX===al?' active':''}" onclick="window._meSetAlignX('${al}')">${ic}</div>`; }
                html += `</div>`;
                html += `<span class="me-plbl">V-Align</span><div class="me-pbtn-row">`;
                for (const al of ['top','center','bottom']) { const ic=al==='top'?'▲':al==='bottom'?'▼':'⬛'; html += `<div class="me-pbtn${_meSelectedAlignY===al?' active':''}" onclick="window._meSetAlignY('${al}')">${ic}</div>`; }
                html += `</div>`;
                html += `<span class="me-plbl">Rotate</span><div class="me-pbtn-row">`;
                for (const deg of [0,90,180,270]) { const ic=['↑','→','↓','←'][deg/90]; html += `<div class="me-pbtn${_meSelectedRot===deg?' active':''}" onclick="window._meSetRot(${deg})">${ic} ${deg}°</div>`; }
                html += `</div>`;
                html += `<span class="me-plbl">Mirror</span><div class="me-pbtn-row">`;
                html += `<div class="me-pbtn${_meSelectedFlipX?' active':''}" onclick="window._meToggleFlipX()">↔ H</div>`;
                html += `<div class="me-pbtn${_meSelectedFlipY?' active':''}" onclick="window._meToggleFlipY()">↕ V</div>`;
                html += `</div></div>`;
                html += `<div class="me-inspector-empty" style="font-size:9px;opacity:0.6;padding:6px">Tip: just place objects, then use the 🎯 Select/Rotate tool to spin any of them to any angle afterwards.</div>`;
            }
            if (!html) html = `<div class="me-inspector-empty">No results for "${searchVal}"</div>`;
            pal.innerHTML = html;
            if (document.getElementById('meTintWheel')) requestAnimationFrame(_meTintUpdateMarker);
        }

        /* Editor UI/board sound effects. playSfx already rate-limits (per-key
           cooldown + ≤6 sounds per 200ms), so drag-painting doesn't machine-gun. */
        function _meSfx(key) {
            if (typeof playSfx === 'function') playSfx(key, { allowBeforeUnlock: true });
        }

        window._mePickTerrain = function(key) {
            _meSfx('uiCursorFocus');
            _meSelectedTerrain = key;
            _meTool = 'paint';
            _mePaletteTab = 'terrain';
            _meUpdateTabButtons();
            _meRenderPalette();
            _meUpdateToolButtons();
        };

        window._mePickObject = function(key) {
            _meSfx('uiCursorFocus');
            _meSelectedObject = key;
            _meRecallObjPlacement(key);
            _meTool = 'object';
            _mePaletteTab = 'objects';
            _meSelectedObjRef = null;
            _meSelectedMonRef = null;
            _meUpdateTabButtons();
            _meRenderPalette();
            _meUpdateToolButtons();
        };

        window._mePickMonument = function(kind) {
            _meSfx('uiCursorFocus');
            _meSelectedMonument = kind;
            _meMonFoot = null;
            _meMonMaxH = null;
            _meTool = 'monument';
            _mePaletteTab = 'monuments';
            _meSelectedObjRef = null;
            _meSelectedMonRef = null;
            _meUpdateTabButtons();
            _meRenderPalette();
            _meUpdateToolButtons();
        };
        window._meSetMonFoot = function(f) { _meMonFoot = f; _meRenderPalette(); };
        window._meSetMonMaxH = function(h) { _meMonMaxH = h; _meRenderPalette(); };
        window._meSetLeaf = function(lf) { _meSelectedLeaf = lf; _meRenderPalette(); };
        window._meSetRockTex = function(rt) { _meSelectedRockTex = rt; _meRenderPalette(); };
        window._meSetTorchMount = function(m) { _meSelectedTorchMount = m; _meRenderPalette(); };

        window._meSetTab = function(tab) {
            _meSfx('uiCursorMove');
            _mePaletteTab = tab;
            if (tab === 'monuments') _meTool = 'monument';
            else if (tab === 'objects' && _meTool !== 'object' && _meTool !== 'select') _meTool = 'object';
            else if (tab === 'terrain' && _meTool === 'monument') _meTool = 'paint';
            _meUpdateTabButtons();
            _meUpdateToolButtons();
            _meRenderPalette();
        };

        window._meOnSearch = function() {
            _meRenderPalette();
        };

        /* Collapse / expand a sidebar section so the user can free up vertical
           room (e.g. fold Size/Tools/Elevation to give the Palette the whole
           sidebar). Palette stays usable because the whole HUD also scrolls. */
        window._meToggleSection = function(id) {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('collapsed');
        };

        /* ─────────────── Colour-wheel tint for the selected terrain ───────────
           HSV ↔ hex helpers, an interactive hue/saturation wheel + value slider,
           a live hex field, and a live multiply-tint applied to the 3D terrain. */
        function _meHsvToHex(h, s, v) {
            h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; v = Math.max(0, Math.min(100, v)) / 100;
            const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
            let r = 0, g = 0, b = 0;
            if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
            else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
            else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
            const to = n => ('0' + Math.round((n + m) * 255).toString(16)).slice(-2);
            return '#' + to(r) + to(g) + to(b);
        }
        function _meHexToHsv(hex) {
            hex = (hex || '').replace('#', '').trim();
            if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
            const r = parseInt(hex.slice(0, 2), 16) / 255, g = parseInt(hex.slice(2, 4), 16) / 255, b = parseInt(hex.slice(4, 6), 16) / 255;
            if ([r, g, b].some(n => isNaN(n))) return { h: 0, s: 0, v: 100 };
            const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
            let h = 0;
            if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
            return { h, s: mx ? (d / mx) * 100 : 0, v: mx * 100 };
        }
        function _meTintSyncFromKey() {
            _meTintKey = _meSelectedTerrain;
            const hex = _meTerrainTints[_meTintKey];
            if (hex) { const hsv = _meHexToHsv(hex); _meTintH = hsv.h; _meTintS = hsv.s; _meTintV = hsv.v; }
            else { _meTintH = 0; _meTintS = 0; _meTintV = 100; }   /* white = no tint */
        }
        function _meTintUpdateMarker() {
            const wheel = document.getElementById('meTintWheel'), marker = document.getElementById('meTintMarker');
            if (!wheel || !marker) return;
            const rect = wheel.getBoundingClientRect();
            const cx = rect.width / 2, cy = rect.height / 2, maxR = Math.min(cx, cy);
            const rad = _meTintH * Math.PI / 180, r = (_meTintS / 100) * maxR;
            marker.style.left = (cx + r * Math.sin(rad)) + 'px';
            marker.style.top = (cy - r * Math.cos(rad)) + 'px';
        }
        function _meApplyTintsLive() {
            if (typeof state !== 'undefined' && state) state.terrainTints = Object.assign({}, _meTerrainTints);
            window._customEditorTints = Object.assign({}, _meTerrainTints);
            if (_meTintRebuildRAF) return;
            _meTintRebuildRAF = requestAnimationFrame(() => {
                _meTintRebuildRAF = 0;
                if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive && ThreeRenderer.isActive()) {
                    if (ThreeRenderer.rebuildTerrain) ThreeRenderer.rebuildTerrain();
                    if (ThreeRenderer.rebuildObjects) ThreeRenderer.rebuildObjects();
                }
            });
        }
        function _meTintCommit(applyLive, hexOverride) {
            const hex = hexOverride || _meHsvToHex(_meTintH, _meTintS, _meTintV);
            if (_meTintKey) {
                /* Treat pure white as "no tint" so swatches don't show a bogus badge. */
                if (hex.toLowerCase() === '#ffffff') delete _meTerrainTints[_meTintKey];
                else _meTerrainTints[_meTintKey] = hex;
            }
            const hexEl = document.getElementById('meTintHex');
            if (hexEl && document.activeElement !== hexEl) hexEl.value = hex;
            const natEl = document.getElementById('meTintColorInput');
            if (natEl) natEl.value = hex;
            const prev = document.getElementById('meTintPreview');
            if (prev) prev.style.background = hex;
            _meTintUpdateMarker();
            if (applyLive) _meApplyTintsLive();
        }
        function _meTintPickFromEvent(ev) {
            const wheel = document.getElementById('meTintWheel');
            if (!wheel) return;
            const rect = wheel.getBoundingClientRect();
            const cx = rect.width / 2, cy = rect.height / 2, maxR = Math.min(cx, cy) || 1;
            const dx = ev.clientX - rect.left - cx, dy = ev.clientY - rect.top - cy;
            let r = Math.sqrt(dx * dx + dy * dy) / maxR; if (r > 1) r = 1;
            let h = Math.atan2(dx, -dy) * 180 / Math.PI; if (h < 0) h += 360;
            _meTintH = h; _meTintS = r * 100;
            _meTintCommit(true);
        }
        window._meTintWheelDrag = function(ev) {
            ev.preventDefault();
            _meTintPickFromEvent(ev);
            const move = e => _meTintPickFromEvent(e);
            const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', up);
        };
        window._meTintSetV = function(v) { _meTintV = +v; _meTintCommit(true); };
        window._meTintFromHex = function() {
            const el = document.getElementById('meTintHex'); if (!el) return;
            let v = el.value.trim(); if (v && v[0] !== '#') v = '#' + v;
            if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) return;
            const hsv = _meHexToHsv(v); _meTintH = hsv.h; _meTintS = hsv.s; _meTintV = hsv.v;
            _meTintCommit(true, _meHsvToHex(_meTintH, _meTintS, _meTintV));
        };
        window._meTintFromNative = function() {
            const el = document.getElementById('meTintColorInput'); if (!el) return;
            const hsv = _meHexToHsv(el.value); _meTintH = hsv.h; _meTintS = hsv.s; _meTintV = hsv.v;
            _meTintCommit(true, el.value);
        };
        window._meTintPreset = function(hex) {
            const hsv = _meHexToHsv(hex); _meTintH = hsv.h; _meTintS = hsv.s; _meTintV = hsv.v;
            const vEl = document.getElementById('meTintVal'); if (vEl) vEl.value = _meTintV;
            _meTintCommit(true, hex);
        };
        window._meTintReset = function() {
            if (_meTintKey) delete _meTerrainTints[_meTintKey];
            _meTintH = 0; _meTintS = 0; _meTintV = 100;
            const vEl = document.getElementById('meTintVal'); if (vEl) vEl.value = 100;
            _meApplyTintsLive();
            _meRenderPalette();
        };
        const ME_TINT_PRESETS = ['#ffffff','#ff5555','#ff9a4a','#ffe14a','#5bd16a','#4ecbe2','#5b9bff','#a36bff','#ff6bd0','#7a4a2e','#9aa6b8','#22202e'];
        function _meTintPanelHtml() {
            const key = _meSelectedTerrain;
            const rule = TERRAIN_RULES[key];
            const label = rule ? rule.label : key;
            const curHex = _meTerrainTints[key] || _meHsvToHex(_meTintH, _meTintS, _meTintV);
            let ph = `<div class="me-tint-panel">`;
            ph += `<div class="me-tint-head"><span>🎨 Tint <b>${label}</b></span><button class="me-tint-reset" onclick="window._meTintReset()">Reset</button></div>`;
            ph += `<div class="me-tint-body">`;
            ph += `<div class="me-tint-wheel" id="meTintWheel" onpointerdown="window._meTintWheelDrag(event)"><div class="me-tint-marker" id="meTintMarker"></div></div>`;
            ph += `<div class="me-tint-controls">`;
            ph += `<div class="me-tint-preview" id="meTintPreview" style="background:${curHex}"></div>`;
            ph += `<label class="me-tint-vlabel">Brightness</label>`;
            ph += `<input type="range" id="meTintVal" class="me-tint-vslider" min="0" max="100" value="${Math.round(_meTintV)}" oninput="window._meTintSetV(this.value)">`;
            ph += `<div class="me-tint-hexrow"><input type="color" id="meTintColorInput" value="${curHex}" oninput="window._meTintFromNative()" title="System colour picker"><input type="text" id="meTintHex" class="me-tint-hexinput" value="${curHex}" maxlength="7" spellcheck="false" oninput="window._meTintFromHex()" onchange="window._meTintFromHex()"></div>`;
            ph += `</div></div>`;
            ph += `<div class="me-tint-presets">` + ME_TINT_PRESETS.map(p => `<button class="me-tint-swatch" style="background:${p}" title="${p}" onclick="window._meTintPreset('${p}')"></button>`).join('') + `</div>`;
            ph += `</div>`;
            return ph;
        }

        function _meUpdateTabButtons() {
            ['terrain','objects','monuments'].forEach(t => {
                const btn = document.getElementById('meTab-' + t);
                if (btn) btn.classList.toggle('active', _mePaletteTab === t);
            });
        }

        window._meSetAlign = function(al) {

            _meSelectedAlignX = al;
            _meRenderPalette();
        };

        window._meSetAlignX = function(al) {
            _meSelectedAlignX = al;
            _meRenderPalette();
        };

        window._meSetAlignY = function(al) { _meSelectedAlignY = al; _meRenderPalette(); };
        window._meSetRot = function(d) { _meSelectedRot = d; _meRenderPalette(); };
        window._meToggleFlipX = function() { _meSelectedFlipX = !_meSelectedFlipX; _meRenderPalette(); };
        window._meToggleFlipY = function() { _meSelectedFlipY = !_meSelectedFlipY; _meRenderPalette(); };

        /* ── Operate on the object picked with the Select tool ─────────────── */
        function _meApplyStairDirFromRot(x, y, entry) {
            const key = ME_OBJECT_IDS[entry.oid];
            if (key !== 'stairs' && key !== 'stairs_2') return;
            /* Map the placed rotation to a cardinal stair direction so the 3D
               staircase faces the way the user spun it. 0°=up(N high) … */
            const dirs = ['N','E','S','W'];
            const d = dirs[(Math.round(((entry.rot || 0) % 360) / 90) % 4 + 4) % 4];
            const col = _meGetColumn(x, y);
            if (col.length) { const top = col[col.length - 1]; top.sd = d; }
            _meSyncVoxelsToLegacy();
        }
        window._meRotateSelected = function(deg) {
            const e = _meSelectedObjEntry(); if (!e) return;
            e.rot = ((+deg % 360) + 360) % 360;
            _meApplyStairDirFromRot(_meSelectedObjRef.x, _meSelectedObjRef.y, e);
            _meRememberObjPlacement(ME_OBJECT_IDS[e.oid], e);
            _meRenderGrid(); _meRefreshObjects3D(); _meRenderPalette();
        };
        window._meRotateSelectedBy = function(delta) {
            const e = _meSelectedObjEntry(); if (!e) return;
            e.rot = ((((e.rot || 0) + delta) % 360) + 360) % 360;
            _meApplyStairDirFromRot(_meSelectedObjRef.x, _meSelectedObjRef.y, e);
            _meRememberObjPlacement(ME_OBJECT_IDS[e.oid], e);
            _meRenderGrid(); _meRefreshObjects3D(); _meRenderPalette();
        };
        window._meFlipSelected = function(axis) {
            const e = _meSelectedObjEntry(); if (!e) return;
            if (axis === 'x') e.flipX = !e.flipX; else e.flipY = !e.flipY;
            _meRememberObjPlacement(ME_OBJECT_IDS[e.oid], e);
            _meRenderGrid(); _meRefreshObjects3D(); _meRenderPalette();
        };
        window._meSetSelectedLeaf = function(lf) {
            const e = _meSelectedObjEntry(); if (!e) return;
            e.leaf = lf;
            _meRememberObjPlacement(ME_OBJECT_IDS[e.oid], e);
            _meRenderGrid(); _meRefreshObjects3D(); _meRenderPalette();
        };
        window._meDeleteSelectedObj = function() {
            const r = _meSelectedObjRef; if (!r) return;
            const stk = _meObjects[r.y] && _meObjects[r.y][r.x];
            if (Array.isArray(stk) && stk[r.idx]) { _mePushUndo(); stk.splice(r.idx, 1); }
            _meSelectedObjRef = null;
            _meRenderGrid(); _meRefreshObjects3D(); _meRebuildEditorOverlays3D(); _meRenderPalette();
        };
        window._meDeleteSelectedMon = function() {
            if (_meSelectedMonRef == null || !Array.isArray(_meMonuments)) return;
            _mePushUndo();
            _meMonuments.splice(_meSelectedMonRef, 1);
            _meSelectedMonRef = null;
            _meRenderGrid(); _meRefreshObjects3D(); _meRebuildEditorOverlays3D(); _meRenderPalette();
        };

        /* ── Unified rotation: drives whichever thing is selected ('obj' | 'mon').
           One set of handlers powers the dial, slider, cardinal buttons, nudge
           buttons and the R keyboard shortcut, so objects and monuments rotate
           through exactly the same intuitive controls. ──────────────────────── */
        function _meSetRotValue(kind, deg, live) {
            /* Rotation snaps to 45° segments — freeform angles made it fiddly to
               land on a clean heading (per user feedback). Every input path
               (dial drag, slider, cardinal / nudge buttons, R key) funnels
               through here, so they all snap. */
            deg = Math.round(+deg / 45) * 45;
            deg = ((deg % 360) + 360) % 360;
            if (kind === 'mon') {
                const m = _meSelectedMonEntry(); if (!m) return;
                m.rot = deg;
            } else {
                const e = _meSelectedObjEntry(); if (!e) return;
                e.rot = deg;
                _meApplyStairDirFromRot(_meSelectedObjRef.x, _meSelectedObjRef.y, e);
                _meRememberObjPlacement(ME_OBJECT_IDS[e.oid], e);
            }
            /* During a drag we update the dial DOM in place (rebuilding the whole
               palette would destroy the element mid-drag and drop pointer capture). */
            const ar = document.getElementById('meDialArrow');
            if (ar) ar.style.transform = `translate(-50%,0) rotate(${deg}deg)`;
            const dl = document.getElementById('meDialDeg');
            if (dl) dl.textContent = deg;
            const sl = document.querySelector('.me-rot-slider');
            if (sl) sl.value = deg;
            _meRenderGrid(); _meRefreshObjects3D(); _meRebuildEditorOverlays3D();
            if (!live) _meRenderPalette();
        }
        window._meRotateSel = function(kind, deg) { _meSetRotValue(kind, deg, false); };
        window._meRotateSelBy = function(kind, delta) {
            const cur = kind === 'mon' ? (_meSelectedMonEntry()?.rot || 0) : (_meSelectedObjEntry()?.rot || 0);
            _meSetRotValue(kind, cur + delta, false);
        };

        /* Drag-to-aim on the dial: the object turns to point at the cursor. */
        function _meDialApply(ev, kind) {
            const el = ev.currentTarget; if (!el) return;
            const r = el.getBoundingClientRect();
            const dx = ev.clientX - (r.left + r.width / 2);
            const dy = ev.clientY - (r.top + r.height / 2);
            if (dx === 0 && dy === 0) return;
            /* Screen up = North = 0°, clockwise positive. */
            const deg = Math.atan2(dx, -dy) * 180 / Math.PI;
            _meSetRotValue(kind, deg, true);
        }
        window._meDialDown = function(ev, kind) {
            ev.preventDefault();
            _meDialDragging = true;
            try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch (e) {}
            _meDialApply(ev, kind);
        };
        window._meDialMove = function(ev, kind) {
            if (_meDialDragging) { ev.preventDefault(); _meDialApply(ev, kind); }
        };
        window._meDialUp = function(ev) {
            if (!_meDialDragging) return;
            _meSfx('uiCursorMove');
            _meDialDragging = false;
            try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch (e) {}
            _meRenderPalette();   // settle: rebuild palette so all controls re-sync
        };

        function _meUpdateToolButtons() {
            ['paint','object','select','erase','eraseObj','spawn1','spawn2','elevUp','elevDown','elevSet'].forEach(t => {
                const btn = document.getElementById('meTool-' + t);
                if (btn) btn.classList.toggle('active', _meTool === t);
            });
            const monBtn = document.getElementById('meTool-monument');
            if (monBtn) monBtn.classList.toggle('active', _meTool === 'monument');
        }

        window._meSetTool = function(t) {
            _meSfx('uiButtonConfirm');
            _meTool = t;
            _meUpdateToolButtons();

            /* Keep the palette in sync with the tool: elevation tools show the
               elevation guide, everything else shows the terrain/object swatches
               (so switching back from an elev tool doesn't leave the guide stuck). */
            if (t === 'elevUp' || t === 'elevDown' || t === 'elevSet') {
                _meRenderElevationPalette();
            } else {
                _meRenderPalette();
            }

            _meUpdateZHint();
        };

        function _meUpdateZHint() {
            const hint = document.getElementById('meZHint');
            if (!hint) return;
            const lockTxt = _meZLock ? ' · locked' : '';
            if (_meTool === 'paint') hint.textContent = `Paint at Z=${_meActiveZ}${lockTxt}`;
            else if (_meTool === 'erase') hint.textContent = `Erase at Z=${_meActiveZ}${lockTxt}`;
            else if (_meZLock) hint.textContent = `Z-Lock on (Z=${_meActiveZ})`;
            else hint.textContent = '';
        }

        window._meToggleZLock = function() {
            _meZLock = !_meZLock;
            _meSfx('uiButtonConfirm');
            const btn = document.getElementById('meZLockBtn');
            if (btn) {
                btn.classList.toggle('active', _meZLock);
                btn.textContent = (_meZLock ? '🔒' : '🔓') + ' Z-Lock';
            }
            _meUpdateZHint();
            _meRenderGrid();
        };

        function _meRenderElevationPalette() {
            const pal = document.getElementById('mePalette');
            if (!pal) return;
            let html = '';
            html += `<div class="me-pal-cat" style="color:rgba(220,180,60,0.9)">Elevation Guide</div>`;
            html += `<div style="padding:6px 8px;font-size:10px;color:var(--muted);line-height:1.5">`;
            html += `<p style="margin:0 0 6px">Use the <b style="color:rgba(0,255,160,0.9)">Z Layer</b> cursor to select which height level to edit. Paint places blocks at that Z level.</p>`;
            html += `<p style="margin:0 0 6px"><b style="color:var(--gold)">⬆ Raise</b> — Add a block above the current top</p>`;
            html += `<p style="margin:0 0 6px"><b style="color:var(--gold)">⬇ Lower</b> — Remove the topmost block</p>`;
            html += `<p style="margin:0 0 6px"><b style="color:var(--gold)">📐 Set Height</b> — Fill solid column from Z0 to selected height</p>`;
            html += `<p style="margin:0 0 6px"><b style="color:rgba(0,255,160,0.9)">🧱 Stacking</b> — Set Z Layer, pick a terrain, and paint to place blocks at different heights with different terrain types. Right-click to inspect the full column.</p>`;
            html += `<p style="margin:0 0 6px"><b style="color:rgba(180,140,255,0.9)">🪜 Stairs</b> — Objects tab → place a staircase (fixed 1×1×1, climbs exactly one level, never stretches). Use the 🎯 Select/Rotate tool to spin it to face any direction.</p>`;
            html += `<p style="margin:0 0 6px"><b style="color:rgba(90,200,152,0.9)">🏠 Buildings</b> — Buildings with roofWalkable auto-calculate their roof height. Units stand on top.</p>`;
            html += `<p style="margin:0"><b>Fill</b> with an elev tool active fills all tiles to the selected height.</p>`;
            html += `</div>`;

            if (_meHeights) {
                const counts = {};
                for (let y = 0; y < _meH; y++) for (let x = 0; x < _meW; x++) {
                    const h = _meHeights[y]?.[x] || 0;
                    counts[h] = (counts[h] || 0) + 1;
                }
                const keys = Object.keys(counts).map(Number).sort((a,b) => a - b);
                html += `<div class="me-pal-cat">Height Distribution</div>`;
                html += `<div style="padding:4px 8px;font-size:10px;color:var(--muted)">`;
                for (const h of keys) {
                    if (counts[h] > 0) {
                        const pct = Math.round(counts[h] / (_meW * _meH) * 100);
                        const color = h < 0 ? 'rgba(100,180,255,0.9)' : h > 0 ? 'var(--gold)' : 'var(--muted)';
                        html += `<div style="display:flex;justify-content:space-between;padding:1px 0">`;
                        html += `<span>Height ${h >= 0 ? '+' : ''}${h}</span>`;
                        html += `<span style="color:${color}">${counts[h]} tiles (${pct}%)</span>`;
                        html += `</div>`;
                    }
                }
                html += `</div>`;
            }

            pal.innerHTML = html;
        }

        window._meSetHeight = function(h) {
            _meSelectedHeight = Math.max(0, Math.min(20, h));
            const badge = document.getElementById('meElevVal');
            if (badge) badge.textContent = _meSelectedHeight;

            for (let i = 0; i <= 20; i++) {
                const btn = document.getElementById('meHBtn-' + i);
                if (btn) btn.classList.toggle('active', i === _meSelectedHeight);
            }
        };

        window._meSetActiveZ = function(z) {
            _meActiveZ = Math.max(0, Math.min(ME_MAX_Z, z));
            const val = document.getElementById('meActiveZVal');
            if (val) val.textContent = _meActiveZ;

            _meUpdateZHint();
            _meRenderGrid();
        };

        window._meAdjustZ = function(delta) {
            window._meSetActiveZ(_meActiveZ + delta);
        };
        window._meToggle3D = function() {
            _me3DPreview = !_me3DPreview;
            const btn = document.getElementById('me3DToggle');
            if (btn) {
                btn.classList.toggle('active', _me3DPreview);
                btn.textContent = _me3DPreview ? '🎲 2D View' : '🎲 3D Preview';
            }
            if (_me3DPreview) {
                _meRender3DPreview();
            } else {
                _meHide3DPreview();
                _meRenderGrid();
            }
        };

        function _meRender3DPreview() {
            const wrap = document.querySelector('.me-canvas-wrap');
            if (!wrap) return;

            const grid2d = document.getElementById('meGrid');
            if (grid2d) grid2d.style.display = 'none';

            let pv = document.getElementById('me3DPreview');
            if (!pv) {
                pv = document.createElement('div');
                pv.id = 'me3DPreview';
                pv.className = 'me-3d-preview';
                wrap.appendChild(pv);
            }
            pv.style.display = 'block';

            const tileSize = 48;
            const boardW = _meW * tileSize;
            const boardH = _meH * tileSize;
            const ELEV_STEP = tileSize * 0.5;

            if (typeof pv._tilt === 'undefined') { pv._tilt = 50; pv._yaw = 0; }

            let html = '';
            html += `<div class="me-3d-stage" id="me3DStage" style="width:${boardW}px;height:${boardH}px;transform:perspective(1200px) rotateX(${pv._tilt}deg) rotateZ(${pv._yaw}deg);transform-style:preserve-3d;transform-origin:center center">`;

            for (let y = 0; y < _meH; y++) {
                for (let x = 0; x < _meW; x++) {
                    const col = _meGetColumn(x, y);
                    if (col.length === 0) continue;

                    const left = x * tileSize;
                    const top = y * tileSize;

                    for (let bi = 0; bi < col.length; bi++) {
                        const block = col[bi];
                        const terrainKey = ME_TERRAIN_IDS[block.tid] || null;
                        if (!terrainKey) continue;

                        const zPx = block.z * ELEV_STEP;
                        const bgImg = _meTerrainBg(terrainKey);

                        const sideKey = (typeof TERRAIN_SIDE_SPRITES !== 'undefined' && TERRAIN_SIDE_SPRITES[terrainKey] !== undefined)
                            ? TERRAIN_SIDE_SPRITES[terrainKey]
                            : terrainKey;
                        const skipSides = sideKey === null;
                        const sideBg = skipSides ? '' : _meTerrainBg(sideKey);

                        const isActiveZ = block.z === _meActiveZ;
                        const highlight = isActiveZ ? 'outline:2px solid rgba(0,255,160,0.7);outline-offset:-2px;' : '';

                        html += `<div class="me-3d-tile" style="left:${left}px;top:${top}px;width:${tileSize}px;height:${tileSize}px;transform:translateZ(${zPx}px);background-image:${bgImg};${highlight}">`;

                        if (!skipSides) {
                            const hasBlockBelow = col.some(b => b.z === block.z - 1);

                            const nbrHasBlock = (nx, ny) => {
                                const nCol = _meGetColumn(nx, ny);
                                return nCol.some(b => b.z === block.z);
                            };

                            if (!nbrHasBlock(x, y + 1)) {
                                html += `<div class="me-3d-face-s" style="height:${ELEV_STEP}px;transform:translateZ(-${ELEV_STEP}px) rotateX(90deg);background-image:${sideBg}"></div>`;
                            }

                            if (!nbrHasBlock(x, y - 1)) {
                                html += `<div class="me-3d-face-n" style="height:${ELEV_STEP}px;transform:translateZ(-${ELEV_STEP}px) rotateX(-90deg);background-image:${sideBg}"></div>`;
                            }

                            if (!nbrHasBlock(x - 1, y)) {
                                html += `<div class="me-3d-face-w" style="width:${ELEV_STEP}px;transform:translateZ(-${ELEV_STEP}px) rotateY(90deg);background-image:${sideBg}"></div>`;
                            }

                            if (!nbrHasBlock(x + 1, y)) {
                                html += `<div class="me-3d-face-e" style="width:${ELEV_STEP}px;transform:translateZ(-${ELEV_STEP}px) rotateY(-90deg);background-image:${sideBg}"></div>`;
                            }

                            if (!hasBlockBelow && block.z > 0) {
                                html += `<div class="me-3d-face-bottom" style="width:${tileSize}px;height:${tileSize}px;transform:translateZ(-${ELEV_STEP}px);background-image:${sideBg};opacity:0.5"></div>`;
                            }
                        }

                        html += '</div>';
                    }

                    const topBlock = col[col.length - 1];
                    const topTerrainKey = ME_TERRAIN_IDS[topBlock.tid] || null;
                    if (topTerrainKey === 'barrier_passage') {
                        const topZPx = topBlock.z * ELEV_STEP;
                        let maxNbr = 0, rampDir = 'n';
                        const dirs = [{dx:0,dy:-1,d:'n'},{dx:0,dy:1,d:'s'},{dx:-1,dy:0,d:'w'},{dx:1,dy:0,d:'e'}];
                        for (const {dx,dy,d} of dirs) {
                            const nx = x+dx, ny = y+dy;
                            if (nx>=0 && ny>=0 && nx<_meW && ny<_meH) {
                                const nh = _meHeights?.[ny]?.[nx] || 0;
                                if (nh > maxNbr) { maxNbr = nh; rampDir = d; }
                            }
                        }
                        const rampH = maxNbr * ELEV_STEP;
                        if (rampH > 0) {
                            const rotMap = {n:'180deg',s:'0deg',w:'90deg',e:'-90deg'};
                            html += `<div class="me-3d-tile" style="left:${left}px;top:${top}px;width:${tileSize}px;height:${tileSize}px;transform:translateZ(${topZPx}px)">`;
                            html += `<div class="me-3d-ramp" style="width:${tileSize}px;height:${tileSize}px;` +
                                `background:linear-gradient(to top, rgba(180,140,255,0.2), rgba(180,140,255,0.5));` +
                                `transform:rotateZ(${rotMap[rampDir]}) rotateX(${Math.atan2(rampH,tileSize)*180/Math.PI}deg);` +
                                `transform-origin:center bottom;position:absolute;inset:0"></div>`;
                            html += '</div>';
                        }
                    }

                    const topZ = col[col.length - 1].z;
                    const topZObjPx = topZ * ELEV_STEP;
                    const stk = Array.isArray(_meObjects[y]?.[x]) ? _meObjects[y][x] : [];
                    if (stk.length > 0) {

                        html += `<div class="me-3d-tile me-3d-obj-container" style="left:${left}px;top:${top}px;width:${tileSize}px;height:${tileSize}px;transform:translateZ(${topZObjPx}px)">`;
                        for (const oe of stk) {
                            const objKey = ME_OBJECT_IDS[oe.oid];
                            if (!objKey) continue;
                            const oSpr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[objKey] : null;
                            const isBldg = oSpr && (typeof OBJECT_RULES !== 'undefined') && OBJECT_RULES[objKey]?.roofWalkable;
                            /* Rocks carry their texture variant in oe.leaf (the generic
                               per-placement texture slot) — preview that sprite, not the
                               default rocks_1 thumbnail. */
                            const objBg = (_meIsRockKey(objKey) && oe.leaf) ? _meTerrainBg(oe.leaf) : _meObjectBg(objKey);
                            if (!objBg) continue;

                            const sprW = oSpr?.width || 128;
                            const sprH = oSpr?.height || 128;
                            const scale = tileSize / 128;
                            const rendW = sprW * scale;
                            const rendH = sprH * scale;

                            if (isBldg) {
                                const coreW = oSpr?._coreWidth || (sprW * 0.8);
                                const side = Math.round(coreW * scale);
                                const wallH = Math.round(sprH * scale * 0.8);
                                html += `<div class="me-3d-building" style="width:${side}px;height:${side}px;left:50%;top:50%;transform:translate(-50%,-50%);transform-style:preserve-3d;position:absolute">`;
                                html += `<div class="me-3d-bldg-south" style="width:${side}px;height:${wallH}px;background-image:${objBg};background-size:${rendW}px ${rendH}px;background-position:center bottom"></div>`;
                                html += `<div class="me-3d-bldg-north" style="width:${side}px;height:${wallH}px;background-image:${objBg};background-size:${rendW}px ${rendH}px;background-position:center bottom"></div>`;
                                html += `<div class="me-3d-bldg-roof" style="width:${side}px;height:${side}px;transform:translateZ(${wallH}px);background:#665544;opacity:0.7"></div>`;
                                html += `</div>`;
                            } else {
                                const tf = [];
                                tf.push(`rotateX(-${pv._tilt}deg)`);
                                tf.push(`rotateZ(-${pv._yaw}deg)`);
                                if (oe.flipX) tf.push('scaleX(-1)');
                                html += `<div class="me-3d-obj" style="width:${rendW}px;height:${rendH}px;background-image:${objBg};transform:translateY(-50%) ${tf.join(' ')};bottom:0;left:50%;margin-left:${-rendW/2}px"></div>`;
                            }
                        }
                        html += `</div>`;
                    }

                    const s1 = _meSpawns[1].some(s => s.x === x && s.y === y);
                    const s2 = _meSpawns[2].some(s => s.x === x && s.y === y);
                    if (s1 || s2) {
                        html += `<div class="me-3d-tile" style="left:${left}px;top:${top}px;width:${tileSize}px;height:${tileSize}px;transform:translateZ(${topZObjPx + 1}px);pointer-events:none">`;
                        if (s1) html += `<div class="me-3d-spawn p1">P1</div>`;
                        if (s2) html += `<div class="me-3d-spawn p2">P2</div>`;
                        html += `</div>`;
                    }
                }
            }

            html += `</div>`;

            html += `<div class="me-3d-hint">Right-drag to orbit • Scroll to zoom</div>`;

            pv.innerHTML = html;

            const stage = document.getElementById('me3DStage');
            if (stage) {
                let _orbiting = false, _lastX = 0, _lastY = 0;
                let _zoom = 1;
                pv.oncontextmenu = e => e.preventDefault();
                pv.onpointerdown = e => {
                    if (e.button === 2 || e.button === 1) { _orbiting = true; _lastX = e.clientX; _lastY = e.clientY; pv.setPointerCapture(e.pointerId); }
                };
                pv.onpointermove = e => {
                    if (!_orbiting) return;
                    const dx = e.clientX - _lastX, dy = e.clientY - _lastY;
                    pv._yaw = ((pv._yaw || 0) + dx * 0.4) % 360;
                    pv._tilt = Math.max(10, Math.min(80, (pv._tilt || 50) - dy * 0.3));
                    _lastX = e.clientX; _lastY = e.clientY;
                    stage.style.transform = `perspective(1200px) rotateX(${pv._tilt}deg) rotateZ(${pv._yaw}deg) scale(${_zoom})`;

                    stage.querySelectorAll('.me-3d-obj').forEach(obj => {
                        const base = obj.style.transform.replace(/rotateX\([^)]*\)/g, `rotateX(-${pv._tilt}deg)`).replace(/rotateZ\([^)]*\)/g, `rotateZ(-${pv._yaw}deg)`);
                        obj.style.transform = base;
                    });
                };
                pv.onpointerup = e => { _orbiting = false; pv.releasePointerCapture(e.pointerId); };
                pv.onwheel = e => {
                    e.preventDefault();
                    _zoom = Math.max(0.3, Math.min(3, _zoom - e.deltaY * 0.001));
                    stage.style.transform = `perspective(1200px) rotateX(${pv._tilt}deg) rotateZ(${pv._yaw}deg) scale(${_zoom})`;
                };
            }
        }

        function _meHide3DPreview() {
            const pv = document.getElementById('me3DPreview');
            if (pv) pv.style.display = 'none';
            const grid2d = document.getElementById('meGrid');
            if (grid2d) grid2d.style.display = '';
        }

        function _meRenderGrid() {

            if (state.phase === 'editor') {
                const wv = document.getElementById('meWidthVal');
                if (wv) wv.textContent = _meW;
                const hv = document.getElementById('meHeightVal');
                if (hv) hv.textContent = _meH;
                const ss = document.getElementById('meSizeSummary');
                if (ss) ss.textContent = _meW + '×' + _meH;
                _meSyncToState();
                if (typeof invalidateTerrainChunkCache === 'function') invalidateTerrainChunkCache();
                if (typeof renderBoard === 'function') renderBoard();

                return;
            }
            const grid = document.getElementById('meGrid');
            if (!grid) return;
            document.getElementById('meWidthVal').textContent = _meW;
            document.getElementById('meHeightVal').textContent = _meH;

            const wrap = grid.parentElement;
            const maxW = (wrap?.clientWidth || 600) - 24;
            const maxH = (wrap?.clientHeight || 500) - 24;
            const cellW = Math.floor(maxW / _meW);
            const cellH = Math.floor(maxH / _meH);
            const cellSz = Math.max(18, Math.min(60, Math.min(cellW, cellH)));

            grid.style.gridTemplateColumns = `repeat(${_meW}, ${cellSz}px)`;
            grid.style.gridTemplateRows = `repeat(${_meH}, ${cellSz}px)`;

            const spawnLookup = {};
            _meSpawns[1].forEach((p, i) => { spawnLookup[`${p.x},${p.y}`] = { player: 1, idx: i }; });
            _meSpawns[2].forEach((p, i) => { spawnLookup[`${p.x},${p.y}`] = { player: 2, idx: i }; });

            let html = '';
            for (let y = 0; y < _meH; y++) {
                for (let x = 0; x < _meW; x++) {

                    const col = _meGetColumn(x, y);
                    const voxelAtZ = _meGetVoxel(x, y, _meActiveZ);
                    const topVoxel = col.length > 0 ? col[col.length - 1] : null;

                    let displayTid = 0;
                    let isDimmed = false;
                    if (voxelAtZ) {
                        displayTid = voxelAtZ.tid;
                    } else if (topVoxel) {
                        displayTid = topVoxel.tid;
                        isDimmed = true;
                    }

                    const terrainKey = ME_TERRAIN_IDS[displayTid] || null;
                    const isEmpty = displayTid === 0;
                    const bgImg = terrainKey ? _meTerrainBg(terrainKey) : '';
                    const cls = isEmpty ? 'me-cell me-empty' : (isDimmed ? 'me-cell me-dimmed' : 'me-cell');
                    const spawnInfo = spawnLookup[`${x},${y}`];
                    let spawnHtml = '';
                    if (spawnInfo) {
                        const pc = spawnInfo.player === 1 ? 'p1' : 'p2';
                        spawnHtml = `<div class="me-spawn-marker ${pc}">${spawnInfo.player === 1 ? '▣' : '▣'}</div>`;
                    }

                    let objHtml = '';
                    const _stk = Array.isArray(_meObjects[y]?.[x]) ? _meObjects[y][x] : [];
                    for (let _oi=0;_oi<_stk.length;_oi++) {
                        const oe=_stk[_oi], _ok=ME_OBJECT_IDS[oe.oid]; if(!_ok) continue;
                        const _ob=_meObjectBg(_ok), _ax=oe.alignX||'center', _ay=oe.alignY||'bottom';
                        const _R=128, _os=(typeof OBJECT_SPRITES!=='undefined')?OBJECT_SPRITES[_ok]:null;
                        const _sw=_os?.width||_R, _sh=_os?.height||_R;
                        const _tf=[];
                        let _ps=`width:${(_sw/_R)*100}%;height:${(_sh/_R)*100}%;`;
                        if(_ax==='left')_ps+='left:0;'; else if(_ax==='right')_ps+='right:0;left:auto;'; else{_ps+='left:50%;';_tf.push('translateX(-50%)');}
                        if(_ay==='top')_ps+='top:0;'; else if(_ay==='center'){_ps+='top:50%;';_tf.push('translateY(-50%)');} else _ps+='bottom:0;';
                        if(oe.rot)_tf.push(`rotate(${oe.rot}deg)`); if(oe.flipX)_tf.push('scaleX(-1)'); if(oe.flipY)_tf.push('scaleY(-1)');
                        if(_tf.length)_ps+=`transform:${_tf.join(' ')};transform-origin:${_ax} ${_ay};`;
                        objHtml+=`<div class="me-obj-overlay" style="background-image:${_ob};${_ps}z-index:${5+_oi}"></div>`;
                    }
                    if(_stk.length>1) objHtml+=`<div class="me-stack-badge">${_stk.length}</div>`;
                    if(_stk.length===1){const oe=_stk[0],d=(oe.alignX||'center')==='center'&&(oe.alignY||'bottom')==='bottom'&&!oe.rot&&!oe.flipX&&!oe.flipY;
                        if(!d){const p=[];if((oe.alignX||'center')!=='center')p.push(oe.alignX==='left'?'◀':'▶');if((oe.alignY||'bottom')!=='bottom')p.push(oe.alignY==='top'?'▲':'■');if(oe.rot)p.push(oe.rot+'°');if(oe.flipX)p.push('↔');if(oe.flipY)p.push('↕');objHtml+=`<div class="me-align-indicator">${p.join('')}</div>`;}}
                    const coordHtml = cellSz >= 30 ? `<div class="me-coord">${x},${y}</div>` : '';
                    const szOwner = _meSanctuaryZones?.[y]?.[x] || 0;
                    let sanctZoneHtml = '';
                    if (szOwner === 1) sanctZoneHtml = '<div class="me-sanct-zone p1"></div>';
                    else if (szOwner === 2) sanctZoneHtml = '<div class="me-sanct-zone p2"></div>';

                    let elevHtml = '';
                    if (col.length > 0) {
                        const topZ = topVoxel ? topVoxel.z : 0;
                        const hasBlockHere = !!voxelAtZ;

                        const tintAlpha = Math.min(0.5, topZ * 0.06);
                        const tintColor = `rgba(255,255,255,${tintAlpha})`;
                        elevHtml = `<div class="me-elev-tint" style="background:${tintColor}"></div>`;

                        const badgeColor = hasBlockHere ? 'rgba(0,255,160,0.95)' : 'rgba(220,180,60,0.95)';
                        elevHtml += `<div class="me-elev-badge" style="color:${badgeColor}">${col.length > 1 ? col.length + '×' : ''}Z${topZ}</div>`;

                        if (col.length > 1) {
                            const isSolid = col.every((b, i) => b.z === col[0].z + i);
                            if (!isSolid) {
                                elevHtml += `<div class="me-voxel-gap-indicator">⋮</div>`;
                            }
                        }
                    }
                    html += `<div class="${cls}" data-x="${x}" data-y="${y}" style="background-image:${bgImg}">${objHtml}${spawnHtml}${sanctZoneHtml}${elevHtml}${coordHtml}</div>`;
                }
            }
            grid.innerHTML = html;

            grid.onpointerdown = (e) => {
                const cell = e.target.closest('.me-cell');
                if (!cell) return;
                _mePushUndo();
                _meMouseDown = true;
                grid.setPointerCapture(e.pointerId);
                _mePaintCell(cell);
            };
            grid.onpointermove = (e) => {
                if (!_meMouseDown) return;

                const el = document.elementFromPoint(e.clientX, e.clientY);
                const cell = el?.closest?.('.me-cell');
                if (cell) _mePaintCell(cell);
            };
            grid.onpointerup = (e) => {
                _meMouseDown = false;
                grid.releasePointerCapture(e.pointerId);
            };

            grid.oncontextmenu = (e) => {
                e.preventDefault();
                const cell = e.target.closest('.me-cell');
                if (!cell) return;
                const cx = +cell.dataset.x, cy = +cell.dataset.y;
                _meShowInspector(cx, cy, e.clientX, e.clientY);
            };

            _meRenderCompatBar();
        }

        function _meAnalyzeCompat() {
            const result = {
                hasP1Spawns: _meSpawns[1].length > 0,
                hasP2Spawns: _meSpawns[2].length > 0,
                p1Count: _meSpawns[1].length,
                p2Count: _meSpawns[2].length,
                hasTowerBase: false,
                hasTowerCube: false,
                hasSanctuary: false,
                hasChurch: false,
                hasShop: false,
                hasNexus: false,
                hasNexusCave: false,
                hasNexusSky: false,
                tileCount: 0,
                passableTiles: 0,
            };

            for (let y = 0; y < _meH; y++) {
                for (let x = 0; x < _meW; x++) {
                    const tid = _meGrid[y]?.[x] || 0;
                    const tKey = ME_TERRAIN_IDS[tid] || null;
                    if (tid > 0) result.tileCount++;
                    if (tKey === 'tower_base') result.hasTowerBase = true;
                    if (tKey === 'sanctuary' || tKey === 'sanctuary_church' || tKey === 'sanctuary_shop' || tKey === 'home_base') result.hasSanctuary = true;
                    if (_meSanctuaryZones?.[y]?.[x] > 0) result.hasSanctuary = true;

                    if (tKey && typeof TERRAIN_RULES !== 'undefined') {
                        const rule = TERRAIN_RULES[tKey];
                        if (rule && rule.passable !== false) result.passableTiles++;
                    }

                    const stk = Array.isArray(_meObjects[y]?.[x]) ? _meObjects[y][x] : [];
                    for (const oe of stk) {
                        const oKey = ME_OBJECT_IDS[oe.oid];
                        if (oKey === 'church') result.hasChurch = true;
                        if (oKey === 'shop') result.hasShop = true;
                        if (oKey === 'nexus') result.hasNexus = true;
                        if (oKey === 'nexus_cave') result.hasNexusCave = true;
                        if (oKey === 'nexus_sky') result.hasNexusSky = true;
                        if (oKey === 'tower_cube') result.hasTowerCube = true;
                    }
                }
            }

            const spawnsOk = result.hasP1Spawns && result.hasP2Spawns;
            const spawnsMatch = result.p1Count === result.p2Count;
            const hasSanctuarySet = result.hasSanctuary && result.hasChurch && result.hasShop;
            const modes = {};

            modes.arena = { ok: spawnsOk && hasSanctuarySet && result.hasNexus,
                missing: [] };
            if (!spawnsOk) modes.arena.missing.push('spawns');
            if (!hasSanctuarySet) modes.arena.missing.push('sanctuary (inn + shop)');
            if (!result.hasNexus) modes.arena.missing.push('nexus');

            modes.tdm = { ok: spawnsOk && hasSanctuarySet, missing: [] };
            if (!spawnsOk) modes.tdm.missing.push('spawns');
            if (!hasSanctuarySet) modes.tdm.missing.push('sanctuary');

            modes.ffa = { ok: spawnsOk, missing: [] };
            if (!spawnsOk) modes.ffa.missing.push('spawns');

            modes.domination = { ok: spawnsOk && result.hasNexus, missing: [] };
            if (!spawnsOk) modes.domination.missing.push('spawns');
            if (!result.hasNexus) modes.domination.missing.push('nexus');

            modes.hotspot = { ok: spawnsOk, missing: [] };
            if (!spawnsOk) modes.hotspot.missing.push('spawns');

            modes.ctf = { ok: spawnsOk && hasSanctuarySet, missing: [] };
            if (!spawnsOk) modes.ctf.missing.push('spawns');
            if (!hasSanctuarySet) modes.ctf.missing.push('sanctuary (flag base)');

            return { ...result, modes, spawnsMatch };
        }

        function _meRenderCompatBar() {
            let bar = document.getElementById('meCompatBar');
            if (!bar) {

                const wrap = document.querySelector('.me-canvas-wrap');
                if (!wrap) return;
                bar = document.createElement('div');
                bar.id = 'meCompatBar';
                bar.className = 'me-compat-bar';
                wrap.parentElement.insertBefore(bar, wrap.nextSibling);
            }
            const c = _meAnalyzeCompat();
            const MODE_LABELS = {
                arena: { icon: '🏰', label: 'Arena' },
                tdm: { icon: '💀', label: 'TDM' },
                ffa: { icon: '👤', label: 'FFA' },
                domination: { icon: '🚩', label: 'Domination' },
                hotspot: { icon: '🔥', label: 'Hotspot' },
                ctf: { icon: '🏳️', label: 'CTF' },
            };
            let html = '<div class="me-compat-header">Mode Compatibility</div>';
            html += '<div class="me-compat-modes">';
            for (const [modeId, meta] of Object.entries(MODE_LABELS)) {
                const m = c.modes[modeId];
                const ok = m && m.ok;
                const cls = ok ? 'me-compat-mode ok' : 'me-compat-mode missing';
                const tip = ok ? `${meta.label}: Ready` : `${meta.label}: Missing ${m.missing.join(', ')}`;
                html += `<div class="${cls}" title="${tip}">${meta.icon}<span>${meta.label}</span>${ok ? '✓' : '✗'}</div>`;
            }
            html += '</div>';

            html += '<div class="me-compat-spawns">';
            html += `<span class="me-compat-sp ${c.hasP1Spawns ? 'ok' : 'missing'}">🔵 P1: ${c.p1Count}</span>`;
            html += `<span class="me-compat-sp ${c.hasP2Spawns ? 'ok' : 'missing'}">🔴 P2: ${c.p2Count}</span>`;
            if (!c.spawnsMatch && c.hasP1Spawns && c.hasP2Spawns) {
                html += `<span class="me-compat-warn">⚠ Uneven spawns</span>`;
            }
            html += `<span class="me-compat-tiles">${c.passableTiles} passable / ${c.tileCount} tiles</span>`;
            html += '</div>';
            bar.innerHTML = html;
        }

        function _mePaintCell(cell) {
            const x = +cell.dataset.x, y = +cell.dataset.y;
            if (x < 0 || y < 0 || x >= _meW || y >= _meH) return;

            if (_meTool === 'paint') {
                const tid = ME_TERRAIN_TO_ID[_meSelectedTerrain] || 1;

                _meSfx('moveStep');
                _meSetVoxel(x, y, _meSurfacePaintZ(x, y), tid);
                const rule = TERRAIN_RULES[_meSelectedTerrain];
                if (rule && !rule.passable) {
                    _meSpawns[1] = _meSpawns[1].filter(s => !(s.x === x && s.y === y));
                    _meSpawns[2] = _meSpawns[2].filter(s => !(s.x === x && s.y === y));
                    _meObjects[y][x] = [];
                }
            } else if (_meTool === 'object') {
                const oid = ME_OBJECT_TO_ID[_meSelectedObject] || 1;
                /* 🔥 Minecraft-style torch stamping: clicking the SIDE FACE of a
                   raised block auto-places a WALL torch on the open tile in
                   front of that face, rotated to aim back at the wall — no
                   manual mount + rotate-dial dance. The face comes from the 3D
                   canvas raycast (window._ewLastPick, three-renderer.js) and
                   must match the tile being painted; top-face clicks keep the
                   palette's selected mount as before. */
                let px = x, py = y, rotOv = null, leafOv = null;
                const _pick = (typeof window !== 'undefined') ? window._ewLastPick : null;
                if (_meIsTorchKey(_meSelectedObject) && _pick && _pick.isSideFace && _pick.isTerrainHit
                    && _pick.tileX === x && _pick.tileY === y && _pick.sideTileX != null
                    && _pick.sideTileX >= 0 && _pick.sideTileY >= 0
                    && _pick.sideTileX < _meW && _pick.sideTileY < _meH) {
                    const _dx = x - _pick.sideTileX, _dy = y - _pick.sideTileY;
                    px = _pick.sideTileX; py = _pick.sideTileY;
                    rotOv = ((_dy === -1) ? 0 : (_dx === 1) ? 1 : (_dy === 1) ? 2 : 3) * 90;
                    leafOv = 'wall';
                }
                if (!Array.isArray(_meObjects[py][px])) _meObjects[py][px] = [];
                const leaf = leafOv !== null ? leafOv
                           : _meIsTreeKey(_meSelectedObject) ? _meSelectedLeaf
                           : _meIsRockKey(_meSelectedObject) ? _meSelectedRockTex
                           : _meIsTorchKey(_meSelectedObject) ? _meSelectedTorchMount
                           : null;
                const entry = _meObjEntry(oid, _meSelectedAlignX, _meSelectedAlignY, rotOv !== null ? rotOv : _meSelectedRot, _meSelectedFlipX, _meSelectedFlipY, leaf);
                _meSfx('itemThrow');
                _meObjects[py][px].push(entry);
                /* Remember this orientation for the NEXT placement of the same
                   object (skip the wall-torch auto-rotate override — that rot
                   is contextual to the clicked wall face, not a preference). */
                if (rotOv === null) _meRememberObjPlacement(_meSelectedObject, entry);
                if (_meGrid[py][px] === 0) _meGrid[py][px] = 1;

                if (_meSelectedObject === 'stairs' || _meSelectedObject === 'stairs_2') {
                    const bpTid = ME_TERRAIN_TO_ID['barrier_passage'];
                    if (bpTid) {
                        _meGrid[y][x] = bpTid;
                        /* Stamp barrier_passage into the VOXEL column too so the
                           tile carries the stair terrain + its stairDir (the live
                           board reads voxels first; a synthesized column loses sd). */
                        const _scol = _meGetColumn(x, y);
                        const _sz = _scol.length ? _scol[_scol.length - 1].z : 0;
                        _meSetVoxel(x, y, _sz, bpTid);
                    }
                    _meApplyStairDirFromRot(x, y, entry);
                }

                /* Auto-select the object you just placed so its rotate / mirror
                   controls appear immediately and the board shows a selection
                   ring — no separate "Select" step needed. Skipped mid-drag so
                   rapid stamping doesn't thrash the panel. */
                if (!_meEditorDragging) {
                    _meSelectedObjRef = { x: px, y: py, idx: _meObjects[py][px].length - 1 };
                    _meSelectedMonRef = null;
                    _meRenderPalette();
                    _meScrollPaletteToTop();
                }
            } else if (_meTool === 'select') {
                _meSfx('uiCursorFocus');
                /* Pick whatever is under the click — a monument footprint wins
                   first, otherwise the nearest object (forgiving of the offset
                   between a tall sprite and its base tile). Clicking an empty
                   patch clears the selection. Either way the big rotation dial
                   appears for the picked thing. */
                const monHit = _meFindMonumentNear(x, y);
                if (monHit != null) {
                    _meSelectedMonRef = monHit;
                    _meSelectedObjRef = null;
                } else {
                    _meSelectedObjRef = _meFindObjectNear(x, y);
                    _meSelectedMonRef = null;
                }
                _meRenderPalette();
                _meScrollPaletteToTop();
            } else if (_meTool === 'monument') {
                if (!Array.isArray(_meMonuments)) _meMonuments = [];
                const existingIdx = _meMonuments.findIndex(m => m.x === x && m.y === y);
                if (existingIdx >= 0) {
                    /* Clicking the exact anchor of an existing monument selects it
                       (so you can rotate it), rather than deleting it — deletion is
                       on the Delete button / eraser, which is far less surprising. */
                    if (!_meEditorDragging) {
                        _meSelectedMonRef = existingIdx;
                        _meSelectedObjRef = null;
                        _meRenderPalette();
                        _meScrollPaletteToTop();
                    }
                } else {
                    const md = ME_MON_BY_KIND[_meSelectedMonument] || { foot: 2, maxH: 3 };
                    _meSfx('itemThrow');
                    _meMonuments.push({
                        kind: _meSelectedMonument,
                        x, y,
                        rot: 0,
                        foot: _meMonFoot != null ? _meMonFoot : md.foot,
                        maxH: _meMonMaxH != null ? _meMonMaxH : md.maxH,
                        seed: ((((x * 73856093) ^ (y * 19349663)) >>> 0) % 100000) + 1
                    });
                    if (_meGrid[y][x] === 0) _meGrid[y][x] = 1;
                    /* Auto-select the monument you just placed so its rotation dial
                       appears immediately — same flow as placing an object. */
                    if (!_meEditorDragging) {
                        _meSelectedMonRef = _meMonuments.length - 1;
                        _meSelectedObjRef = null;
                        _meRenderPalette();
                        _meScrollPaletteToTop();
                    }
                }
            } else if (_meTool === 'erase') {
                /* Erase the block the user can SEE: with Z-lock off, target the
                   block at the active Z if there is one, otherwise the column's
                   top block (previously erase silently targeted _meActiveZ only,
                   which usually held no block — "erase does nothing"). Z-lock on
                   → erase exactly the active layer. */
                let ez = _meActiveZ;
                if (!_meZLock && !_meGetVoxel(x, y, ez)) {
                    const ecol = _meGetColumn(x, y);
                    if (ecol.length) ez = ecol[ecol.length - 1].z;
                }
                if (_meGetVoxel(x, y, ez)) _meSfx('block');
                _meRemoveVoxel(x, y, ez);

                const col = _meGetColumn(x, y);
                if (col.length === 0) {
                    _meObjects[y][x] = [];
                    if (_meSelectedObjRef && _meSelectedObjRef.x === x && _meSelectedObjRef.y === y) _meSelectedObjRef = null;
                    _meSpawns[1] = _meSpawns[1].filter(s => !(s.x === x && s.y === y));
                    _meSpawns[2] = _meSpawns[2].filter(s => !(s.x === x && s.y === y));
                }
            } else if (_meTool === 'eraseObj') {
                if (Array.isArray(_meObjects[y][x]) && _meObjects[y][x].length > 0) {
                    _meSfx('block');
                    _meObjects[y][x].pop();
                    if (_meSelectedObjRef && _meSelectedObjRef.x === x && _meSelectedObjRef.y === y &&
                        _meSelectedObjRef.idx >= _meObjects[y][x].length) _meSelectedObjRef = null;
                }
            } else if (_meTool === 'spawn1' || _meTool === 'spawn2') {
                _meSfx('uiButtonConfirm');
                const p = _meTool === 'spawn1' ? 1 : 2;

                const exists = _meSpawns[p].findIndex(s => s.x === x && s.y === y);
                if (exists >= 0) {
                    _meSpawns[p].splice(exists, 1);
                } else {

                    const otherP = p === 1 ? 2 : 1;
                    _meSpawns[otherP] = _meSpawns[otherP].filter(s => !(s.x === x && s.y === y));
                    _meSpawns[p].push({ x, y });

                    if (_meGrid[y][x] === 0) _meSetVoxel(x, y, 0, 1);
                }
            } else if (_meTool === 'elevUp') {

                _meSfx('moveStep');
                const col = _meGetColumn(x, y);
                const topZ = col.length > 0 ? col[col.length - 1].z : -1;
                const newZ = Math.min(ME_MAX_Z, topZ + 1);
                const tid = col.length > 0 ? col[col.length - 1].tid : 1;
                _meSetVoxel(x, y, newZ, tid);
            } else if (_meTool === 'elevDown') {

                const col = _meGetColumn(x, y);
                if (col.length > 0) {
                    _meSfx('block');
                    const topZ = col[col.length - 1].z;
                    _meRemoveVoxel(x, y, topZ);
                }
            } else if (_meTool === 'elevSet') {
                _meSfx('moveStep');

                if (!_meVoxels) _meVoxels = _meEmptyVoxelGrid(_meH, _meW);
                const col = _meVoxels[y][x];

                const existingTid = col.length > 0 ? col[col.length - 1].tid : 1;

                col.length = 0;
                for (let z = 0; z <= _meSelectedHeight; z++) {
                    col.push({ z, tid: existingTid });
                }
                _meSyncVoxelsToLegacy();
            }
            _meRenderGrid();
        }

        function _meShowInspector(tx, ty, px, py) {
            const insp = document.getElementById('meInspector');
            if (!insp) return;
            const tid = _meGrid[ty]?.[tx] || 0;
            const terrainKey = ME_TERRAIN_IDS[tid] || null;
            const stack = Array.isArray(_meObjects[ty]?.[tx]) ? _meObjects[ty][tx] : [];
            let html = `<div class="me-inspector-title">Tile (${tx}, ${ty})</div>`;

            const tLabel = terrainKey ? (TERRAIN_RULES[terrainKey]?.label || terrainKey) : 'Empty';
            html += `<div class="me-inspector-terrain">`;
            html += `<div class="me-inspector-swatch" style="background-image:${_meTerrainBg(terrainKey || '')};background-size:cover"></div>`;
            html += `<div class="me-inspector-label">Top: ${tLabel}</div>`;
            html += `</div>`;

            const col = _meGetColumn(tx, ty);
            if (col.length > 0) {
                html += `<div class="me-inspector-terrain"><div class="me-inspector-label" style="color:rgba(0,255,160,0.9);font-size:10px;font-weight:bold">Voxel Column (${col.length} blocks)</div></div>`;

                for (let i = col.length - 1; i >= 0; i--) {
                    const b = col[i];
                    const bKey = ME_TERRAIN_IDS[b.tid] || '?';
                    const bLabel = (typeof TERRAIN_RULES !== 'undefined' && TERRAIN_RULES[bKey]) ? TERRAIN_RULES[bKey].label : bKey;
                    const isActive = b.z === _meActiveZ;
                    const zStyle = isActive ? 'color:rgba(0,255,160,1);font-weight:bold' : 'color:rgba(220,180,60,0.8)';
                    html += `<div class="me-inspector-item" style="padding:2px 4px">`;
                    html += `<div class="me-inspector-swatch" style="background-image:${_meTerrainBg(bKey)};background-size:cover;width:16px;height:16px;min-width:16px"></div>`;
                    html += `<div class="me-inspector-label" style="${zStyle};font-size:9px">Z${b.z}: ${bLabel}</div>`;
                    html += `<button class="me-inspector-del" onclick="window._meDeleteVoxel(${tx},${ty},${b.z})" title="Delete block at Z${b.z}">✕</button>`;
                    html += `</div>`;
                }
            } else {
                html += `<div class="me-inspector-terrain"><div class="me-inspector-label" style="color:rgba(220,180,60,0.5)">No blocks</div></div>`;
            }

            const tileElev = _meHeights?.[ty]?.[tx] || 0;
            html += `<div class="me-inspector-terrain">`;
            html += `<div class="me-inspector-label" style="color:rgba(220,180,60,0.9)">Top Z: ${tileElev} | Active Z: ${_meActiveZ}</div>`;
            html += `</div>`;

            for (const oe of stack) {
                const oKey = ME_OBJECT_IDS[oe.oid];
                if (!oKey) continue;
                const oRule = (typeof OBJECT_RULES !== 'undefined') ? OBJECT_RULES[oKey] : null;
                if (oRule && oRule.roofWalkable) {
                    const oSpr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[oKey] : null;
                    const gh = oSpr?._gameHeight || '?';
                    html += `<div class="me-inspector-terrain"><div class="me-inspector-label" style="color:rgba(90,200,152,0.9);font-size:9px">🏠 Roof height: +${gh} levels (units walk on roof)</div></div>`;
                    break;
                }
                if (oKey === 'stairs' || oKey === 'stairs_2') {
                    html += `<div class="me-inspector-terrain"><div class="me-inspector-label" style="color:rgba(180,140,255,0.9);font-size:9px">🪜 Staircase — fixed 1×1×1, climbs one level (use 🎯 Select to rotate)</div></div>`;
                    break;
                }
            }

            if (stack.length === 0) {
                html += `<div class="me-inspector-empty">No objects</div>`;
            } else {
                for (let i = 0; i < stack.length; i++) {
                    const oe = stack[i];
                    const objKey = ME_OBJECT_IDS[oe.oid] || '?';
                    const oRule = (typeof OBJECT_RULES !== 'undefined') ? OBJECT_RULES[objKey] : null;
                    const label = oRule ? oRule.label : objKey;
                    const bgImg = _meObjectBg(objKey);
                    const extras = [];
                    if ((oe.alignX||'center')!=='center') extras.push(oe.alignX);
                    if ((oe.alignY||'bottom')!=='bottom') extras.push(oe.alignY);
                    if (oe.rot) extras.push(oe.rot+'°');
                    if (oe.flipX) extras.push('↔');
                    if (oe.flipY) extras.push('↕');
                    const info = extras.length ? ` <span style="opacity:0.5;font-size:8px">${extras.join(' ')}</span>` : '';
                    html += `<div class="me-inspector-item">`;
                    html += `<div class="me-inspector-swatch" style="background-image:${bgImg}"></div>`;
                    html += `<div class="me-inspector-label">${label}${info}</div>`;
                    html += `<button class="me-inspector-del" onclick="window._meDeleteObj(${tx},${ty},${i})" title="Delete this object">✕</button>`;
                    html += `</div>`;
                }
            }
            insp.innerHTML = html;
            insp.style.display = 'block';

            const vw = window.innerWidth, vh = window.innerHeight;
            let left = px + 8, top = py + 8;

            requestAnimationFrame(() => {
                const rect = insp.getBoundingClientRect();
                if (left + rect.width > vw - 8) left = px - rect.width - 8;
                if (top + rect.height > vh - 8) top = py - rect.height - 8;
                if (left < 4) left = 4;
                if (top < 4) top = 4;
                insp.style.left = left + 'px';
                insp.style.top = top + 'px';
            });
            insp.style.left = left + 'px';
            insp.style.top = top + 'px';
        }

        function _meHideInspector() {
            const insp = document.getElementById('meInspector');
            if (insp) insp.style.display = 'none';
        }

        window._meDeleteObj = function(tx, ty, idx) {
            if (Array.isArray(_meObjects[ty]?.[tx]) && idx >= 0 && idx < _meObjects[ty][tx].length) {
                _meObjects[ty][tx].splice(idx, 1);
                _meRenderGrid();

                const insp = document.getElementById('meInspector');
                if (insp && insp.style.display !== 'none') {
                    const left = parseInt(insp.style.left) || 0;
                    const top = parseInt(insp.style.top) || 0;
                    _meShowInspector(tx, ty, left - 8, top - 8);
                }
            }
        };

        window._meDeleteVoxel = function(tx, ty, z) {
            _meRemoveVoxel(tx, ty, z);
            _meRenderGrid();

            const insp = document.getElementById('meInspector');
            if (insp && insp.style.display !== 'none') {
                const left = parseInt(insp.style.left) || 0;
                const top = parseInt(insp.style.top) || 0;
                _meShowInspector(tx, ty, left - 8, top - 8);
            }
        };

        document.addEventListener('pointerdown', (e) => {
            const insp = document.getElementById('meInspector');
            if (insp && insp.style.display !== 'none' && !insp.contains(e.target)) {
                _meHideInspector();
            }
        });

        window._meResizeW = function(delta) {
            const nw = Math.max(4, Math.min(36, _meW + delta));
            if (nw === _meW) return;
            _mePushUndo();
            if (nw > _meW) {
                for (let y = 0; y < _meH; y++) {
                    while (_meGrid[y].length < nw) _meGrid[y].push(0);
                    while (_meObjects[y].length < nw) _meObjects[y].push([]);
                    if (_meSanctuaryZones) while (_meSanctuaryZones[y].length < nw) _meSanctuaryZones[y].push(0);
                    if (_meHeights) while (_meHeights[y].length < nw) _meHeights[y].push(0);
                    if (_meVoxels) while (_meVoxels[y].length < nw) _meVoxels[y].push([]);
                }
            } else {
                for (let y = 0; y < _meH; y++) {
                    _meGrid[y].length = nw;
                    _meObjects[y].length = nw;
                    if (_meSanctuaryZones) _meSanctuaryZones[y].length = nw;
                    if (_meHeights) _meHeights[y].length = nw;
                    if (_meVoxels) _meVoxels[y].length = nw;
                }
                _meSpawns[1] = _meSpawns[1].filter(s => s.x < nw);
                _meSpawns[2] = _meSpawns[2].filter(s => s.x < nw);
            }
            _meW = nw;
            _meRenderGrid();
            _meRebuildEditorOverlays3D();   // zone preview + markers track the new size
        };

        window._meResizeH = function(delta) {
            const nh = Math.max(4, Math.min(36, _meH + delta));
            if (nh === _meH) return;
            _mePushUndo();
            if (nh > _meH) {
                while (_meGrid.length < nh) _meGrid.push(Array(_meW).fill(0));
                while (_meObjects.length < nh) _meObjects.push(Array.from({length:_meW},()=>[]));
                if (_meSanctuaryZones) while (_meSanctuaryZones.length < nh) _meSanctuaryZones.push(Array(_meW).fill(0));
                if (_meHeights) while (_meHeights.length < nh) _meHeights.push(Array(_meW).fill(0));
                if (_meVoxels) while (_meVoxels.length < nh) _meVoxels.push(Array.from({length:_meW},()=>[]));
            } else {
                _meGrid.length = nh;
                _meObjects.length = nh;
                if (_meSanctuaryZones) _meSanctuaryZones.length = nh;
                if (_meHeights) _meHeights.length = nh;
                if (_meVoxels) _meVoxels.length = nh;
                _meSpawns[1] = _meSpawns[1].filter(s => s.y < nh);
                _meSpawns[2] = _meSpawns[2].filter(s => s.y < nh);
            }
            _meH = nh;
            _meRenderGrid();
            _meRebuildEditorOverlays3D();   // zone preview + markers track the new size
        };

        window._meClear = function() {
            _mePushUndo();
            /* Clear back to a flat grass floor (like a fresh canvas). Use the
               Erase tool to dig actual void holes where you want them. */
            const gTid = ME_TERRAIN_TO_ID['grass'] || 1;
            _meGrid = Array.from({ length: _meH }, () => Array(_meW).fill(gTid));
            _meObjects = _meEmptyObjGrid(_meH, _meW);
            _meMonuments = [];
            _meSelectedObjRef = null;
            _meSelectedMonRef = null;
            _meSpawns = { 1: [], 2: [] };
            _meSanctuaryZones = _meEmptySanctuaryGrid(_meH, _meW);
            _meHeights = _meEmptyHeightGrid(_meH, _meW);
            /* Real z0 blocks for the grass floor — an empty voxel grid would be
               zeroed back into the grid by the next _meSyncVoxelsToLegacy. */
            _meBuildVoxelsFromLegacy();
            _meActiveZ = 0;
            const zVal = document.getElementById('meActiveZVal');
            if (zVal) zVal.textContent = _meActiveZ;
            _meRenderGrid();
        };

        window._meFill = function() {
            _mePushUndo();
            if (_meTool === 'elevSet' || _meTool === 'elevUp' || _meTool === 'elevDown') {

                if (!_meVoxels) _meVoxels = _meEmptyVoxelGrid(_meH, _meW);
                for (let y = 0; y < _meH; y++) for (let x = 0; x < _meW; x++) {
                    const col = _meVoxels[y][x];
                    if (col.length === 0) continue;
                    const tid = col[col.length - 1].tid;
                    col.length = 0;
                    for (let z = 0; z <= _meSelectedHeight; z++) {
                        col.push({ z, tid });
                    }
                }
                _meSyncVoxelsToLegacy();
            } else if (_meTool === 'object') {
                const oid = ME_OBJECT_TO_ID[_meSelectedObject] || 1;
                const _e = _meObjEntry(oid, _meSelectedAlignX, _meSelectedAlignY, _meSelectedRot, _meSelectedFlipX, _meSelectedFlipY);
                for (let y = 0; y < _meH; y++) for (let x = 0; x < _meW; x++) if (_meGrid[y][x] !== 0) _meObjects[y][x] = [{..._e}];
            } else {

                const tid = ME_TERRAIN_TO_ID[_meSelectedTerrain] || 1;
                if (!_meVoxels) _meVoxels = _meEmptyVoxelGrid(_meH, _meW);
                for (let y = 0; y < _meH; y++) {
                    for (let x = 0; x < _meW; x++) {
                        /* Fill targets the ACTIVE Z layer exactly — not the
                           surface-clamped paint Z. Writing straight to _meActiveZ
                           means re-filling an already-filled layer replaces it with
                           the selected terrain, and stepping up one layer fills that
                           layer (never the one beneath it). _meSetVoxel replaces a
                           block already at that Z and creates one otherwise. */
                        _meSetVoxel(x, y, _meActiveZ, tid);
                    }
                }
            }
            _meRenderGrid();
        };

        const ME_STORAGE_KEY = 'ew_custom_maps';

        function _meGetSavedMaps() {
            try { return JSON.parse(localStorage.getItem(ME_STORAGE_KEY) || '[]'); }
            catch { return []; }
        }

        function _meSaveMaps(maps) {
            localStorage.setItem(ME_STORAGE_KEY, JSON.stringify(maps));
        }

        window._meSave = function() {
            const name = document.getElementById('meMapName')?.value?.trim() || 'Untitled';
            const mapData = {
                name,
                w: _meW,
                h: _meH,
                grid: _meGrid.map(row => [...row]),
                objects: _meObjects.map(row => row.map(s => s.map(e => ({...e})))),
                spawns: { 1: [..._meSpawns[1]], 2: [..._meSpawns[2]] },
                sanctuaryZones: _meSanctuaryZones ? _meSanctuaryZones.map(row => [...row]) : null,
                heights: _meHeights ? _meHeights.map(row => [...row]) : null,
                voxels: _meVoxels ? _meVoxels.map(row => row.map(col => col.map(b => ({...b})))) : null,
                monuments: _meMonuments ? _meMonuments.map(m => ({...m})) : [],
                terrainTints: Object.assign({}, _meTerrainTints),
                /* fmt 2 = empty columns are REAL void holes; older saves treat
                   empty as grass and get back-filled on load. */
                fmt: 2,
                ts: Date.now()
            };
            const maps = _meGetSavedMaps();

            const existIdx = maps.findIndex(m => m.name === name);
            if (existIdx >= 0) maps[existIdx] = mapData;
            else maps.push(mapData);
            _meSaveMaps(maps);
            _mePopulateSavedList();
            if (typeof playSfx === 'function') playSfx('uiButtonConfirm');
        };

        function _mePopulateSavedList() {
            const sel = document.getElementById('meLoadSelect');
            if (!sel) return;
            const maps = _meGetSavedMaps();
            sel.innerHTML = '<option value="">— Load saved —</option>' +
                maps.map((m, i) => `<option value="${i}">${m.name} (${m.w}×${m.h})</option>`).join('');
        }

        window._meLoadSelected = function() {
            const sel = document.getElementById('meLoadSelect');
            const idx = sel?.value;
            if (idx === '' || idx == null) return;
            const maps = _meGetSavedMaps();
            const m = maps[+idx];
            if (!m) return;
            _meW = m.w; _meH = m.h;
            _meGrid = m.grid.map(row => [...row]);
            _meObjects = _meDeserializeObjects(m, _meH, _meW);
            _meSpawns = { 1: (m.spawns?.[1] || []).map(s => ({...s})), 2: (m.spawns?.[2] || []).map(s => ({...s})) };
            _meMonuments = Array.isArray(m.monuments) ? m.monuments.map(mm => ({...mm})) : [];
            _meTerrainTints = m.terrainTints ? Object.assign({}, m.terrainTints) : {};
            _meApplyTintsLive();
            _meSelectedObjRef = null;
            _meSelectedMonRef = null;
            _meSanctuaryZones = m.sanctuaryZones ? m.sanctuaryZones.map(row => [...row]) : _meEmptySanctuaryGrid(_meH, _meW);
            _meHeights = m.heights ? m.heights.map(row => row.map(h => Math.max(0, Math.min(20, h)))) : _meEmptyHeightGrid(_meH, _meW);

            if (m.voxels) {
                _meVoxels = m.voxels.map(row => row.map(col => (col || []).map(b => ({...b}))));
            } else {
                _meBuildVoxelsFromLegacy();
            }
            if (!(m.fmt >= 2)) _meFillEmptyWithGrass();   // pre-hole-era save
            _meActiveZ = 0;
            const zVal = document.getElementById('meActiveZVal');
            if (zVal) zVal.textContent = _meActiveZ;
            document.getElementById('meMapName').value = m.name;
            _meRenderGrid();
            if (typeof playSfx === 'function') playSfx('uiButtonConfirm');
        };

        window._meDeleteSaved = function() {
            const sel = document.getElementById('meLoadSelect');
            const idx = sel?.value;
            if (idx === '' || idx == null) return;
            const maps = _meGetSavedMaps();
            if (!maps[+idx]) return;
            if (!confirm(`Delete "${maps[+idx].name}"?`)) return;
            maps.splice(+idx, 1);
            _meSaveMaps(maps);
            _mePopulateSavedList();
        };

        window._meExport = function() {
            const data = {
                name: document.getElementById('meMapName')?.value || 'Custom',
                w: _meW, h: _meH,
                grid: _meGrid,
                objects: _meObjects,
                spawns: _meSpawns,
                sanctuaryZones: _meSanctuaryZones,
                heights: _meHeights,
                voxels: _meVoxels,
                monuments: _meMonuments || [],
                terrainTints: _meTerrainTints,
                fmt: 2
            };
            const json = JSON.stringify(data);
            navigator.clipboard.writeText(json).then(() => {
                alert('Map JSON copied to clipboard!');
            }).catch(() => {
                prompt('Copy this JSON:', json);
            });
        };

        window._meImport = function() {
            const json = prompt('Paste map JSON:');
            if (!json) return;
            try {
                const data = JSON.parse(json);
                if (!data.w || !data.h || !data.grid) throw new Error('Invalid map data');
                _meW = data.w; _meH = data.h;
                _meGrid = data.grid;
                _meObjects = _meDeserializeObjects(data, _meH, _meW);
                _meSpawns = data.spawns || { 1: [], 2: [] };
                _meMonuments = Array.isArray(data.monuments) ? data.monuments.map(m => ({...m})) : [];
                _meTerrainTints = data.terrainTints ? Object.assign({}, data.terrainTints) : {};
                _meApplyTintsLive();
                _meSelectedObjRef = null;
                _meSelectedMonRef = null;
                _meSanctuaryZones = data.sanctuaryZones ? data.sanctuaryZones.map(row => [...row]) : _meEmptySanctuaryGrid(_meH, _meW);
                _meHeights = data.heights ? data.heights.map(row => row.map(h => Math.max(0, Math.min(20, h)))) : _meEmptyHeightGrid(_meH, _meW);

                if (data.voxels) {
                    _meVoxels = data.voxels.map(row => row.map(col => (col || []).map(b => ({...b}))));
                } else {
                    _meBuildVoxelsFromLegacy();
                }
                if (!(data.fmt >= 2)) _meFillEmptyWithGrass();   // pre-hole-era map
                _meActiveZ = 0;
                if (data.name) document.getElementById('meMapName').value = data.name;
                _meRenderGrid();
            } catch (e) {
                alert('Invalid JSON: ' + e.message);
            }
        };

        const ME_BIOMES = {
            grasslands: {
                label: 'Grasslands',
                base: ['grass','grass','grass','grass_2','grass_rocky'],
                accent: ['dirt','road'],
                obstacle: ['rocks_1','grass_rocky','dirt'],
                wall: ['mountain','rock_wall_1'],
                hazard: [],
                water: ['water'],
                objects: ['tree','tree','tree','tree_2','tree_3','tree_4','tree_5','tree_6','ruins'],
                objChance: 0.22,
            },
            dark_forest: {
                label: 'Dark Forest',
                base: ['grass','grass','grass_2','purple_grass'],
                accent: ['dirt','grass_rocky'],
                obstacle: ['dark_woods','dark_woods','rocks_1','dirt'],
                wall: ['rock_wall_1','rock_wall_2'],
                hazard: ['poison','poison_bog'],
                water: ['water'],
                objects: ['tree','tree','tree','tree_2','tree_3','tree_4','tree_5','tree_6','ruins'],
                objChance: 0.30,
            },
            desert_ruins: {
                label: 'Desert Ruins',
                base: ['desert','desert','desert','scorched','wasteland'],
                accent: ['dirt','road'],
                obstacle: ['rocks_1','rocks_2','rocks_3'],
                wall: ['mountain','cliff','rock_wall_1'],
                hazard: ['lava'],
                water: [],
                objects: ['ruins','ruins','column_1','column_2'],
                objChance: 0.08,
            },
            volcanic: {
                label: 'Volcanic',
                base: ['obsidian','obsidian','scorched','scorched','rocks_4'],
                accent: ['cave_floor','dirt'],
                obstacle: ['rocks_1','rocks_5','rubble_1'],
                wall: ['mountain','rock_wall_1','rock_wall_2'],
                hazard: ['lava','lava','lava'],
                water: [],
                objects: ['ruins','column_3','column_4'],
                objChance: 0.06,
            },
            frozen: {
                label: 'Frozen Wastes',
                base: ['ice','ice','ice','grass','grass_rocky'],
                accent: ['dirt','road'],
                obstacle: ['rocks_3','rocks_4','rocks_5'],
                wall: ['mountain','mountain_2','rock_wall_2'],
                hazard: [],
                water: ['water','deep_water'],
                objects: ['tree','tree_2','tree_5','ruins'],
                objChance: 0.06,
            },
            urban: {
                label: 'Urban Battleground',
                base: ['bricks_1','bricks_1','bricks_2','road','road','urban_street','urban_street'],
                accent: ['wood_planks','wood','dirt'],
                obstacle: ['rubble_1','rubble_2','rubble_3','rubble_4'],
                wall: ['urban_wall','urban_wall','rock_wall_1'],
                hazard: [],
                water: [],
                objects: ['building_1','building_2','building_3','building_4','building_5','building_6','building_7','building_8','building_9','building_10','building_11','ancient_building','abandoned_building_1','abandoned_building_2','ruins','column_1','tree_3','tree_5','stairs','pathway_1','pathway_2'],
                objChance: 0.14,
            },
            cavern: {
                label: 'Cavern',
                base: ['cave_floor','cave_floor','cave_floor','obsidian'],
                accent: ['crystal','mushroom'],
                obstacle: ['rocks_1','rocks_2','rocks_5'],
                wall: ['cave_wall','cave_wall','rock_wall_1'],
                hazard: ['poison_bog'],
                water: ['water','deep_water'],
                objects: ['column_1','column_2','column_3','column_4'],
                objChance: 0.06,
            },
            purple_swamp: {
                label: 'Purple Swamp',
                base: ['purple_grass','purple_grass','purple_grass','grass','grass_rocky'],
                accent: ['dirt','purple_bog'],
                obstacle: ['dark_woods','dark_woods','mushroom'],
                wall: ['rock_wall_1','rock_wall_2'],
                hazard: ['poison','poison_bog','purple_bog'],
                water: ['water','deep_water'],
                objects: ['tree','tree_2','tree_4','tree_6','ruins','well'],
                objChance: 0.10,
            },
            sky_ruins: {
                label: 'Sky Ruins',
                base: ['cloud','cloud','sky_ruin','sky_ruin'],
                accent: ['cloud_thick'],
                obstacle: [],
                wall: ['cloud_gap'],
                hazard: ['storm'],
                water: [],
                objects: ['column_1','column_2','column_3','column_4','ruins'],
                objChance: 0.08,
            },
            mixed_wilds: {
                label: 'Mixed Wilds',
                base: ['grass','grass','grass_2','dirt','grass_rocky'],
                accent: ['road','desert','purple_grass'],
                obstacle: ['rocks_1','rocks_3','mushroom','crystal','grass_rocky'],
                wall: ['mountain','cliff','rock_wall_1'],
                hazard: ['poison','lava'],
                water: ['water','deep_water','bridge'],
                objects: ['tree','tree_2','tree_3','tree_4','tree_5','tree_6','ruins','well','church','shop'],
                objChance: 0.10,
            },
        };

        function _meRandPick(arr) {
            return arr[Math.floor(Math.random() * arr.length)];
        }

        function _meNoise2D(w, h, scale) {
            const grid = [];

            const cw = Math.ceil(w / scale) + 2;
            const ch = Math.ceil(h / scale) + 2;
            const ctrl = Array.from({ length: ch }, () =>
                Array.from({ length: cw }, () => Math.random())
            );

            for (let y = 0; y < h; y++) {
                grid[y] = [];
                for (let x = 0; x < w; x++) {
                    const gx = x / scale, gy = y / scale;
                    const ix = Math.floor(gx), iy = Math.floor(gy);
                    const fx = gx - ix, fy = gy - iy;
                    const a = ctrl[iy]?.[ix] || 0;
                    const b = ctrl[iy]?.[ix + 1] || 0;
                    const c = ctrl[iy + 1]?.[ix] || 0;
                    const d = ctrl[iy + 1]?.[ix + 1] || 0;
                    const top = a + (b - a) * fx;
                    const bot = c + (d - c) * fx;
                    grid[y][x] = top + (bot - top) * fy;
                }
            }
            return grid;
        }

        let _meBiomeCount = 1;

        window._meSetBiomeCount = function(n) {
            _meBiomeCount = Math.max(1, Math.min(4, n));
            document.querySelectorAll('.me-biome-btn').forEach(btn => {
                const isActive = +btn.dataset.n === _meBiomeCount;
                btn.classList.toggle('active', isActive);
                btn.style.background = isActive ? '#7c4dff' : '#333';
                btn.style.color = isActive ? '#fff' : '#ccc';
            });
        };

        function _meBuildZoneMap(W, H, count) {

            const seeds = [];
            const attempts = 200;
            const minDist = Math.max(3, Math.floor(Math.min(W, H) / (count + 1)));
            for (let i = 0; i < count; i++) {
                let best = null, bestMinD = -1;
                for (let a = 0; a < attempts; a++) {
                    const sx = 1 + Math.floor(Math.random() * (W - 2));
                    const sy = 1 + Math.floor(Math.random() * (H - 2));
                    let closest = Infinity;
                    for (const s of seeds) {
                        const d = Math.abs(s.x - sx) + Math.abs(s.y - sy);
                        if (d < closest) closest = d;
                    }
                    if (seeds.length === 0) closest = minDist;
                    if (closest > bestMinD) { bestMinD = closest; best = { x: sx, y: sy }; }
                }
                seeds.push(best);
            }

            const jitter = _meNoise2D(W, H, Math.max(2, Math.floor(Math.min(W, H) / 4)));
            const zones = Array.from({ length: H }, () => Array(W).fill(0));
            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    let minD = Infinity, minIdx = 0;
                    for (let i = 0; i < seeds.length; i++) {
                        const d = Math.abs(seeds[i].x - x) + Math.abs(seeds[i].y - y)
                                  + (jitter[y][x] - 0.5) * 3;
                        if (d < minD) { minD = d; minIdx = i; }
                    }
                    zones[y][x] = minIdx;
                }
            }
            return { zones, seeds };
        }

        function _meGenTile(biome, n, n2) {
            if (n > 0.82 && biome.wall.length > 0) return _meRandPick(biome.wall);
            if (n > 0.68 && biome.obstacle.length > 0) return _meRandPick(biome.obstacle);
            if (n2 > 0.78 && biome.water.length > 0) return _meRandPick(biome.water);
            if (n < 0.15 && biome.hazard.length > 0 && Math.random() < 0.4) return _meRandPick(biome.hazard);
            if (n2 < 0.25 && biome.accent.length > 0) return _meRandPick(biome.accent);
            return _meRandPick(biome.base);
        }

        window._meRandomize = function() {
            _mePushUndo();
            const biomeKeys = Object.keys(ME_BIOMES);
            const numBiomes = Math.min(_meBiomeCount, biomeKeys.length);
            const W = _meW, H = _meH;

            const shuffled = [...biomeKeys].sort(() => Math.random() - 0.5);
            const pickedBiomes = shuffled.slice(0, numBiomes).map(k => ME_BIOMES[k]);

            _meGrid = Array.from({ length: H }, () => Array(W).fill(0));
            _meObjects = _meEmptyObjGrid(H, W);
            _meSpawns = { 1: [], 2: [] };
            _meSanctuaryZones = _meEmptySanctuaryGrid(H, W);
            _meHeights = _meEmptyHeightGrid(H, W);

            const { zones } = numBiomes > 1
                ? _meBuildZoneMap(W, H, numBiomes)
                : { zones: Array.from({ length: H }, () => Array(W).fill(0)) };

            const noiseMain = _meNoise2D(W, H, Math.max(3, Math.floor(Math.min(W, H) / 3)));
            const noiseSec  = _meNoise2D(W, H, Math.max(2, Math.floor(Math.min(W, H) / 5)));

            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    const biome = pickedBiomes[zones[y][x]] || pickedBiomes[0];
                    const terrain = _meGenTile(biome, noiseMain[y][x], noiseSec[y][x]);
                    _meGrid[y][x] = ME_TERRAIN_TO_ID[terrain] || 1;
                }
            }

            if (numBiomes > 1) {
                for (let y = 0; y < H; y++) {
                    for (let x = 0; x < W; x++) {
                        const myZone = zones[y][x];
                        let onBorder = false;
                        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                            const nx = x + dx, ny = y + dy;
                            if (nx >= 0 && ny >= 0 && nx < W && ny < H && zones[ny][nx] !== myZone) {
                                onBorder = true;
                                break;
                            }
                        }
                        if (onBorder && Math.random() < 0.30) {

                            const neighbors = [];
                            for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                                const nx = x + dx, ny = y + dy;
                                if (nx >= 0 && ny >= 0 && nx < W && ny < H && zones[ny][nx] !== myZone) {
                                    neighbors.push(zones[ny][nx]);
                                }
                            }
                            const neighborBiome = pickedBiomes[_meRandPick(neighbors)] || pickedBiomes[0];

                            const pool = [...neighborBiome.base, ...neighborBiome.accent];
                            const blendTerrain = _meRandPick(pool);
                            const tid = ME_TERRAIN_TO_ID[blendTerrain];
                            if (tid) _meGrid[y][x] = tid;
                        }
                    }
                }
            }

            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    if (x === 0 || y === 0 || x === W - 1 || y === H - 1) {
                        const tKey = ME_TERRAIN_IDS[_meGrid[y][x]];
                        const rule = tKey ? TERRAIN_RULES[tKey] : null;
                        if (rule && (!rule.passable || rule.flyingOnly)) {
                            const biome = pickedBiomes[zones[y][x]] || pickedBiomes[0];
                            _meGrid[y][x] = ME_TERRAIN_TO_ID[_meRandPick(biome.base)] || 1;
                        }
                    }
                }
            }

            const passGrid = Array.from({ length: H }, (_, y) =>
                Array.from({ length: W }, (_, x) => {
                    const tKey = ME_TERRAIN_IDS[_meGrid[y][x]];
                    const rule = tKey ? TERRAIN_RULES[tKey] : null;
                    return rule ? (rule.passable && !rule.flyingOnly) : false;
                })
            );

            function floodFill(startX, startY) {
                const visited = Array.from({ length: H }, () => Array(W).fill(false));
                const queue = [{ x: startX, y: startY }];
                visited[startY][startX] = true;
                let count = 0;
                while (queue.length > 0) {
                    const { x, y } = queue.shift();
                    count++;
                    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
                        const nx = x + dx, ny = y + dy;
                        if (nx >= 0 && ny >= 0 && nx < W && ny < H && !visited[ny][nx] && passGrid[ny][nx]) {
                            visited[ny][nx] = true;
                            queue.push({ x: nx, y: ny });
                        }
                    }
                }
                return { visited, count };
            }

            let startX = -1, startY = -1;
            outer: for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    if (passGrid[y][x]) { startX = x; startY = y; break outer; }
                }
            }

            if (startX >= 0) {
                const { visited } = floodFill(startX, startY);
                for (let y = 1; y < H - 1; y++) {
                    for (let x = 1; x < W - 1; x++) {
                        if (passGrid[y][x] && !visited[y][x]) {
                            const midX = Math.floor(W / 2);
                            const dir = x < midX ? 1 : -1;
                            let cx = x;
                            const biome = pickedBiomes[zones[y][cx]] || pickedBiomes[0];
                            while (cx >= 0 && cx < W && !visited[y]?.[cx]) {
                                const baseTid = ME_TERRAIN_TO_ID[_meRandPick(biome.base)] || 1;
                                _meGrid[y][cx] = baseTid;
                                passGrid[y][cx] = true;
                                cx += dir;
                            }
                        }
                    }
                }
            }

            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    const biome = pickedBiomes[zones[y][x]] || pickedBiomes[0];
                    if (!biome.objects.length || Math.random() > biome.objChance) continue;
                    const tKey = ME_TERRAIN_IDS[_meGrid[y][x]];
                    const rule = tKey ? TERRAIN_RULES[tKey] : null;
                    if (!rule || !rule.passable) continue;
                    const objKey = _meRandPick(biome.objects);
                    const oid = ME_OBJECT_TO_ID[objKey];
                    if (oid) {
                        /* Columns: place at a random edge/corner so they don't clip with units */
                        if (objKey.startsWith('column_')) {
                            const _cornerAligns = [
                                ['left','top'], ['right','top'], ['left','bottom'], ['right','bottom']
                            ];
                            const _ca = _cornerAligns[Math.floor(Math.random() * _cornerAligns.length)];
                            _meObjects[y][x] = [_meObjEntry(oid, _ca[0], _ca[1])];
                        } else {
                            _meObjects[y][x] = [_meObjEntry(oid)];
                        }
                    }
                }
            }

            /* ── Convert any forest/forest_2/tree terrain → grass + tree object ── */
            const _FOREST_TID_SET = { };
            const _ftForest = ME_TERRAIN_TO_ID['forest'];   if (_ftForest)   _FOREST_TID_SET[_ftForest] = true;
            const _ftForest2 = ME_TERRAIN_TO_ID['forest_2']; if (_ftForest2) _FOREST_TID_SET[_ftForest2] = true;
            const _ftTree = ME_TERRAIN_TO_ID['tree'];        if (_ftTree)    _FOREST_TID_SET[_ftTree] = true;
            const _grassTid = ME_TERRAIN_TO_ID['grass'] || 1;
            const _treObjOids = [ME_OBJECT_TO_ID['tree'], ME_OBJECT_TO_ID['tree_2'], ME_OBJECT_TO_ID['tree_3'],
                                 ME_OBJECT_TO_ID['tree_4'], ME_OBJECT_TO_ID['tree_5'], ME_OBJECT_TO_ID['tree_6']].filter(Boolean);
            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    if (_FOREST_TID_SET[_meGrid[y][x]]) {
                        _meGrid[y][x] = _grassTid;
                        const existing = _meObjects[y]?.[x];
                        if (!existing || (Array.isArray(existing) && existing.length === 0)) {
                            const oid = _treObjOids[((x * 7 + y * 13) & 0x7fffffff) % _treObjOids.length];
                            if (oid) _meObjects[y][x] = [_meObjEntry(oid)];
                        }
                    }
                }
            }

            const leftCandidates = [];
            const rightCandidates = [];
            const midX = Math.floor(W / 2);

            for (let y = 1; y < H - 1; y++) {
                for (let x = 0; x < W; x++) {
                    const tKey = ME_TERRAIN_IDS[_meGrid[y][x]];
                    const rule = tKey ? TERRAIN_RULES[tKey] : null;
                    if (!rule || !rule.passable || rule.flyingOnly) continue;
                    const biome = pickedBiomes[zones[y][x]] || pickedBiomes[0];
                    if (biome.hazard.includes(tKey)) continue;
                    if (biome.water.includes(tKey)) continue;
                    if (x < midX - 1) leftCandidates.push({ x, y });
                    else if (x > midX + 1) rightCandidates.push({ x, y });
                }
            }

            leftCandidates.sort((a, b) => a.x - b.x);
            rightCandidates.sort((a, b) => b.x - a.x);

            const spawnCount = Math.max(1, Math.min(6, Math.floor(Math.min(W, H) / 3)));

            function pickSpaced(candidates, count) {
                const picked = [];
                const used = new Set();
                for (const c of candidates) {
                    if (picked.length >= count) break;
                    const key = `${c.x},${c.y}`;
                    if (used.has(key)) continue;
                    const tooClose = picked.some(p => Math.abs(p.x - c.x) + Math.abs(p.y - c.y) < 2);
                    if (tooClose) continue;
                    picked.push(c);
                    used.add(key);
                }
                return picked;
            }

            _meSpawns[1] = pickSpaced(leftCandidates, spawnCount);
            _meSpawns[2] = pickSpaced(rightCandidates, spawnCount);

            for (const p of [1, 2]) {
                for (const s of _meSpawns[p]) {
                    for (const [dx, dy] of [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]]) {
                        const nx = s.x + dx, ny = s.y + dy;
                        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                        _meObjects[ny][nx] = [];
                        const tKey = ME_TERRAIN_IDS[_meGrid[ny][nx]];
                        const rule = tKey ? TERRAIN_RULES[tKey] : null;
                        const biome = pickedBiomes[zones[ny]?.[nx]] || pickedBiomes[0];
                        if (!rule || !rule.passable || rule.flyingOnly || biome.hazard.includes(tKey) || biome.water.includes(tKey)) {
                            _meGrid[ny][nx] = ME_TERRAIN_TO_ID[_meRandPick(biome.base)] || 1;
                        }
                    }
                }
            }

            const nameInput = document.getElementById('meMapName');
            const biomeNames = pickedBiomes.map(b => b.label);
            if (nameInput) nameInput.value = biomeNames.join(' × ') + ' ' + Math.floor(Math.random() * 999);

            _meBuildVoxelsFromLegacy();
            _meActiveZ = 0;

            _meRenderGrid();
            if (typeof playSfx === 'function') playSfx('uiButtonConfirm');
        };

        function _meAutoPlaceSpawns() {
            const w = _meW, h = _meH;

            const passable = [];
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const col = _meVoxels ? (_meVoxels[y]?.[x] || []) : [];
                    if (col.length === 0) continue;
                    const tid = col[col.length - 1].tid;
                    const terrainKey = ME_TERRAIN_IDS[tid] || 'grass';
                    const rule = (typeof TERRAIN_RULES !== 'undefined') ? TERRAIN_RULES[terrainKey] : null;
                    if (rule && rule.passable === false) continue;

                    const stk = Array.isArray(_meObjects[y]?.[x]) ? _meObjects[y][x] : [];
                    let blocked = false;
                    for (let oi = 0; oi < stk.length; oi++) {
                        const objKey = ME_OBJECT_IDS[stk[oi].oid];
                        if (objKey && typeof OBJECT_RULES !== 'undefined' && OBJECT_RULES[objKey] && !OBJECT_RULES[objKey].walkable) {
                            blocked = true; break;
                        }
                    }
                    if (blocked) continue;

                    passable.push({ x, y });
                }
            }
            if (passable.length < 2) return;

            const p1Tiles = passable.slice().sort((a, b) => (a.x + a.y) - (b.x + b.y));
            const p2Tiles = passable.slice().sort((a, b) => ((w - 1 - a.x) + (h - 1 - a.y)) - ((w - 1 - b.x) + (h - 1 - b.y)));

            const maxPerTeam = Math.min(4, Math.floor(passable.length / 2));
            const usedKeys = new Set();

            if (_meSpawns[1].length === 0) {
                _meSpawns[1] = [];
                for (let i = 0; i < p1Tiles.length && _meSpawns[1].length < maxPerTeam; i++) {
                    const t = p1Tiles[i];
                    const key = t.x + ',' + t.y;
                    if (usedKeys.has(key)) continue;
                    _meSpawns[1].push({ x: t.x, y: t.y });
                    usedKeys.add(key);
                }
            } else {

                _meSpawns[1].forEach(s => usedKeys.add(s.x + ',' + s.y));
            }

            if (_meSpawns[2].length === 0) {
                _meSpawns[2] = [];
                for (let i = 0; i < p2Tiles.length && _meSpawns[2].length < maxPerTeam; i++) {
                    const t = p2Tiles[i];
                    const key = t.x + ',' + t.y;
                    if (usedKeys.has(key)) continue;
                    _meSpawns[2].push({ x: t.x, y: t.y });
                    usedKeys.add(key);
                }
            }
        }

        window._mePlayTest = function() {
            if (typeof playSfx === 'function') playSfx('uiConfirm');

            if (_meSpawns[1].length === 0 || _meSpawns[2].length === 0) {
                _meAutoPlaceSpawns();
            }

            if (_meSpawns[1].length === 0 || _meSpawns[2].length === 0) {
                alert('Could not auto-place spawns — no passable tiles found. Place at least 1 spawn point for each player.');
                return;
            }

            _meHideEditorHUD();
            _meClearEditorOverlays3D();
            document.querySelectorAll('.me-diorama-overlay').forEach(el => el.remove());

            if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive()) {
                ThreeRenderer.deactivate();
            }

            const _mcEl = document.querySelector('.map-center');
            if (_mcEl) {
                _mcEl.style.width = '';
                _mcEl.style.height = '';
                _mcEl.style.maxHeight = '';
                _mcEl.style.flex = '';
            }

            const reactHud = document.getElementById('reactHudRoot');
            if (reactHud) reactHud.style.display = '';

            const board = [];
            const walkHeights = [];
            for (let y = 0; y < _meH; y++) {
                const tRow = [];
                const hRow = [];
                for (let x = 0; x < _meW; x++) {
                    const col = _meVoxels ? (_meVoxels[y]?.[x] || []) : [];
                    if (col.length === 0) {
                        /* Erased tiles play as impassable void holes — matching
                           what the editor shows — instead of silently becoming
                           grass at match time. */
                        tRow.push('void');
                        hRow.push(0);
                    } else if (col.length === 1) {

                        tRow.push(ME_TERRAIN_IDS[col[0].tid] || 'grass');
                        hRow.push(col[0].z);
                    } else {

                        const topBlock = col[col.length - 1];
                        tRow.push(ME_TERRAIN_IDS[topBlock.tid] || 'grass');
                        hRow.push(topBlock.z);
                    }
                }
                board.push(tRow);
                walkHeights.push(hRow);
            }

            const objBoard = [];
            for (let y = 0; y < _meH; y++) { const row = [];
                for (let x = 0; x < _meW; x++) { const stk = Array.isArray(_meObjects[y]?.[x]) ? _meObjects[y][x] : [];
                    if (!stk.length) { row.push(null); continue; }
                    row.push(stk.map(e=>{const o={key:ME_OBJECT_IDS[e.oid]||null,alignX:e.alignX||'center',alignY:e.alignY||'bottom',rot:e.rot||0,flipX:!!e.flipX,flipY:!!e.flipY};if(e.leaf)o.leaf=e.leaf;return o;}).filter(e=>e.key));
                } objBoard.push(row); }

            const teamSize = Math.max(1, Math.min(_meSpawns[1].length, _meSpawns[2].length));

            const customModeId = '_custom_editor';
            GAME_MODES[customModeId] = {
                id: customModeId,
                label: 'Custom',
                desc: `${_meW}×${_meH} custom map`,
                boardSize: Math.max(_meW, _meH),
                boardWidth: _meW,
                boardHeight: _meH,
                teamSize: teamSize,
                winHourglasses: Math.max(1, Math.floor(teamSize / 2)),
                hiddenItemSpawns: Math.floor((_meW * _meH) / 20),
                blitzMode: true,
                hasTowers: false,
                terrainPatches: { water: [0,0,0], desert: [0,0,0], mountain: [0,0,0] },
                spawns: {
                    1: _meSpawns[1].map(s => ({ x: s.x, y: s.y })),
                    2: _meSpawns[2].map(s => ({ x: s.x, y: s.y }))
                },
                defaultBuilds: {
                    1: Array(teamSize).fill('Warrior'),
                    2: Array(teamSize).fill('Warrior')
                }
            };

            window._customEditorBoard = board;
            window._customEditorObjects = objBoard;
            window._customEditorMonuments = (_meMonuments && _meMonuments.length) ? _meMonuments.map(m => ({ ...m })) : null;
            window._customEditorSanctuaryZones = _meSanctuaryZones ? _meSanctuaryZones.map(r => [...r]) : null;

            window._customEditorHeights = walkHeights;
            window._customEditorTints = Object.assign({}, _meTerrainTints);

            if (_meVoxels) {
                window._customEditorVoxels = [];
                for (let vy = 0; vy < _meH; vy++) {
                    const vRow = [];
                    for (let vx = 0; vx < _meW; vx++) {
                        const col = _meVoxels[vy]?.[vx] || [];
                        if (col.length === 0) {
                            /* Unpainted tiles: export the same z0 "for show" base
                               the editor renders (see _meSyncToState), instead of
                               an empty column — which drew NOTHING at match time
                               (invisible holes with units floating on them). */
                            vRow.push([{ z: 0, terrain: board[vy]?.[vx] || 'grass' }]);
                            continue;
                        }
                        vRow.push(col.map(b => {
                            var entry = {
                                z: b.z,
                                terrain: ME_TERRAIN_IDS[b.tid] || 'grass'
                            };
                            if (b.sd) entry.stairDir = b.sd;
                            return entry;
                        }));
                    }
                    window._customEditorVoxels.push(vRow);
                }
            }

            applyGameMode(customModeId);
            CONFIG.teamSize = teamSize;

            /* CTRL has no HUMAN key — CTRL.HUMAN was undefined, so Player 1 had
               NO controller at match time: the engine never waited for human
               input and the action menu never appeared ("play test breaks"). */
            state.controllers[1] = CTRL.LOCAL;
            state.controllers[2] = CTRL.AI;
            state.showPlayer2Builder = false;
            state.squadLeaderMode = false;
            state.isRankedMatch = false;

            if (typeof MULTIPLAYER_MODES !== 'undefined') {
                state.activeMultiplayerMode = 'arena';
            }

            dismissTitleScreen();
            render();

            state.audioUnlocked = true;
            if (typeof syncMusicToState === 'function') syncMusicToState().catch(() => {});
        };

        window._goToMapEditor = function() {
            if (typeof playSfx === 'function') playSfx('uiButtonConfirm');
            _meInit();
            _meEnterDioramaEditor();
        };

        window._meBack = function() {
            if (typeof playSfx === 'function') playSfx('uiButtonConfirm');
            if (state.phase === 'editor') {
                _meExitDioramaEditor();
            } else {
                _showTitlePage('mainMenuPage');
            }
        };
