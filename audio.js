        const _R2_BASE = 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets';
        const _R2_MUSIC = {
            titleTheme:      `${_R2_BASE}/music/ff7.ogg`,
            mainTheme:       `${_R2_BASE}/music/maintheme_v2.mp3`,
            battleTheme:     `${_R2_BASE}/music/battlemusic.mp3`,
            battleThemeAlt1: `${_R2_BASE}/music/battle_music_beetle.mp3`,
            battleThemeAlt2: `${_R2_BASE}/music/Ladybug.mp3`,
            battleThemeAlt3: `${_R2_BASE}/music/Silkworm%281%29.mp3`,
            battleThemeAlt4: `${_R2_BASE}/music/japan_v2.ogg`,
            battleThemeAlt5: `${_R2_BASE}/music/nostalgia.ogg`,
            battleThemeAlt6: `${_R2_BASE}/music/pallet%20town.ogg`,
            battleThemeAlt7: `${_R2_BASE}/music/retro.ogg`,
            battleThemeAlt8: `${_R2_BASE}/music/urban_pop_v2%281%29.ogg`,
            battleThemeAlt9: `${_R2_BASE}/music/heavensgate.ogg`,
            battleThemeAlt10: `${_R2_BASE}/music/plot%20armor%20instrumental.ogg`,
            battleThemeAlt11: `${_R2_BASE}/music/80s%20Dark.mp3`,
            battleThemeAlt12: `${_R2_BASE}/music/Boooo.mp3`,
            battleThemeAlt13: `${_R2_BASE}/music/Exist.mp3`,
            battleThemeAlt14: `${_R2_BASE}/music/Hard.mp3`,
            battleThemeAlt15: `${_R2_BASE}/music/Hot%20Glue%20Gun.mp3`,
            battleThemeAlt16: `${_R2_BASE}/music/Im%20Sad.mp3`,
            battleThemeAlt17: `${_R2_BASE}/music/Kitty.mp3`,
            battleThemeAlt18: `${_R2_BASE}/music/Let%20Her%20Down.mp3`,
            battleThemeAlt19: `${_R2_BASE}/music/Mouse.mp3`,
            battleThemeAlt20: `${_R2_BASE}/music/Nurses.mp3`,
            battleThemeAlt21: `${_R2_BASE}/music/Obs.mp3`,
            battleThemeAlt22: `${_R2_BASE}/music/Rip%20Off%20Our%20Clothes.mp3`,
            battleThemeAlt23: `${_R2_BASE}/music/Smelly%202.mp3`,
            battleThemeAlt24: `${_R2_BASE}/music/Sneaky.mp3`,
            battleThemeAlt25: `${_R2_BASE}/music/Sneeze.mp3`,
            battleThemeAlt26: `${_R2_BASE}/music/Stiffy.mp3`,
            battleThemeAlt27: `${_R2_BASE}/music/Swish.mp3`,
            battleThemeAlt28: `${_R2_BASE}/music/Twins.mp3`,
            victory:         `${_R2_BASE}/music/victory.mp3`,
            defeat:          `${_R2_BASE}/music/gameover.mp3`,
        };
        const _LOCAL_MUSIC = {
            titleTheme: './assets/music/ff7.ogg',
            mainTheme: './assets/music/maintheme_v2.mp3',
            battleTheme: './assets/music/battlemusic.mp3',
            battleThemeAlt1: './assets/music/battle_music_beetle.mp3',
            battleThemeAlt2: './assets/music/Ladybug.mp3',
            battleThemeAlt3: './assets/music/Silkworm(1).mp3',
            battleThemeAlt4: './assets/music/japan_v2.ogg',
            battleThemeAlt5: './assets/music/nostalgia.ogg',
            battleThemeAlt6: './assets/music/pallet town.ogg',
            battleThemeAlt7: './assets/music/retro.ogg',
            battleThemeAlt8: './assets/music/urban_pop_v2(1).ogg',
            battleThemeAlt9: './assets/music/heavensgate.ogg',
            battleThemeAlt10: './assets/music/plot armor instrumental.ogg',
            battleThemeAlt11: './assets/music/80s Dark.mp3',
            battleThemeAlt12: './assets/music/Boooo.mp3',
            battleThemeAlt13: './assets/music/Exist.mp3',
            battleThemeAlt14: './assets/music/Hard.mp3',
            battleThemeAlt15: './assets/music/Hot Glue Gun.mp3',
            battleThemeAlt16: './assets/music/Im Sad.mp3',
            battleThemeAlt17: './assets/music/Kitty.mp3',
            battleThemeAlt18: './assets/music/Let Her Down.mp3',
            battleThemeAlt19: './assets/music/Mouse.mp3',
            battleThemeAlt20: './assets/music/Nurses.mp3',
            battleThemeAlt21: './assets/music/Obs.mp3',
            battleThemeAlt22: './assets/music/Rip Off Our Clothes.mp3',
            battleThemeAlt23: './assets/music/Smelly 2.mp3',
            battleThemeAlt24: './assets/music/Sneaky.mp3',
            battleThemeAlt25: './assets/music/Sneeze.mp3',
            battleThemeAlt26: './assets/music/Stiffy.mp3',
            battleThemeAlt27: './assets/music/Swish.mp3',
            battleThemeAlt28: './assets/music/Twins.mp3',
            victory: './assets/music/victory.mp3',
            defeat: './assets/music/gameover.mp3',
        };

        audioTracks = {};
        for (const [key, r2Url] of Object.entries(_R2_MUSIC)) {
            try {
                const a = new Audio();
                a.preload = 'none';
                a.src = r2Url;
                a.onerror = function() {

                    if (_LOCAL_MUSIC[key] && !this._fellBack) {
                        this._fellBack = true;
                        this.src = _LOCAL_MUSIC[key];
                    } else {
                        this.onerror = null;
                    }
                };
                audioTracks[key] = a;
            } catch (_) {
                try { audioTracks[key] = new Audio(_LOCAL_MUSIC[key]); } catch (_2) {}
            }
        }

        const AUDIO_BASE_VOLUMES = {
            titleTheme: 0.55,
            mainTheme: 0.42,
            battleTheme: 0.46,
            battleThemeAlt1: 0.46,
            battleThemeAlt2: 0.46,
            battleThemeAlt3: 0.46,
            battleThemeAlt4: 0.46,
            battleThemeAlt5: 0.46,
            battleThemeAlt6: 0.46,
            battleThemeAlt7: 0.46,
            battleThemeAlt8: 0.46,
            battleThemeAlt9: 0.46,
            battleThemeAlt10: 0.46,
            battleThemeAlt11: 0.46,
            battleThemeAlt12: 0.46,
            battleThemeAlt13: 0.46,
            battleThemeAlt14: 0.46,
            battleThemeAlt15: 0.46,
            battleThemeAlt16: 0.46,
            battleThemeAlt17: 0.46,
            battleThemeAlt18: 0.46,
            battleThemeAlt19: 0.46,
            battleThemeAlt20: 0.46,
            battleThemeAlt21: 0.46,
            battleThemeAlt22: 0.46,
            battleThemeAlt23: 0.46,
            battleThemeAlt24: 0.46,
            battleThemeAlt25: 0.46,
            battleThemeAlt26: 0.46,
            battleThemeAlt27: 0.46,
            battleThemeAlt28: 0.46,
            victory: 0.68,
            defeat: 0.68
        };

        const _R2_SFX = {
            uiConfirm:       `${_R2_BASE}/SFX/ui_confirm.ogg`,
            uiCursorMove:    `${_R2_BASE}/SFX/ui_cursormove.ogg`,
            uiCursorFocus:   `${_R2_BASE}/SFX/ui_cursorfocus.ogg`,
            uiButtonConfirm: `${_R2_BASE}/SFX/ui_buttonconfirm.ogg`,
            uiError:         `${_R2_BASE}/SFX/ui_error.ogg`,
            fireball:        `${_R2_BASE}/SFX/fireball.ogg`,
            healRegen:       `${_R2_BASE}/SFX/heal_regen.ogg`,
            manaRegen:       `${_R2_BASE}/SFX/mana_regen.ogg`,
            moveStep:        `${_R2_BASE}/SFX/move_step_v2.ogg`,
            playerHourglass: `${_R2_BASE}/SFX/player_hourglass_obtained.ogg`,
            enemyHourglass:  `${_R2_BASE}/SFX/enemy_hourglass_obtained.ogg`,
            death:           `${_R2_BASE}/SFX/death.ogg`,
            levelUp:         `${_R2_BASE}/SFX/level_up.ogg`,
            newRound:        `${_R2_BASE}/SFX/new_round.ogg`,
            damage:          `${_R2_BASE}/SFX/damage.ogg`,
            debuff:          `${_R2_BASE}/SFX/debuff.ogg`,
            buff:            `${_R2_BASE}/SFX/buff.ogg`,
            nexusCaptured:   `${_R2_BASE}/SFX/nexus_captured.ogg`,
            physicalAttack:  `${_R2_BASE}/SFX/physical_attack.ogg`,
            basicAttack:     `${_R2_BASE}/SFX/basic_attack.ogg`,
            physicalAbility: `${_R2_BASE}/SFX/physical_ability.ogg`,
            teleport:        `${_R2_BASE}/SFX/teleport.ogg`,
            spellDamage:     `${_R2_BASE}/SFX/spell_damage.ogg`,
            itemThrow:       `${_R2_BASE}/SFX/item_throw.ogg`,
            poisonDamage:    `${_R2_BASE}/SFX/poison_damage.ogg`,
            burningDamage:   `${_R2_BASE}/SFX/burning_damage.ogg`,
            drowningDamage:  `${_R2_BASE}/SFX/drowning_damage.ogg`,
            dodge:           `${_R2_BASE}/SFX/dodge.ogg`,
            physicalAbilityDamage: `${_R2_BASE}/SFX/physical_ability_damage.ogg`,
            block:           `${_R2_BASE}/SFX/block.ogg`,
            gun:             `${_R2_BASE}/SFX/gun.ogg`,
            doubleShot:      `${_R2_BASE}/SFX/double_shot.ogg`,
            shootout:        `${_R2_BASE}/SFX/shootout.ogg`,
            turret:          `${_R2_BASE}/SFX/turret.ogg`,
            jetFlyover:      `${_R2_BASE}/SFX/jet_flyover.ogg`,
            nukeAlarm:       `${_R2_BASE}/SFX/nuke_alarm.ogg`,
            explosion:       `${_R2_BASE}/SFX/explosion.ogg`,
        };
        const _LOCAL_SFX = {
            uiConfirm: "./assets/sfx/ui_confirm.ogg",
            uiCursorMove: "./assets/sfx/ui_cursormove.ogg",
            uiCursorFocus: "./assets/sfx/ui_cursorfocus.ogg",
            uiButtonConfirm: "./assets/sfx/ui_buttonconfirm.ogg",
            uiError: "./assets/sfx/ui_error.ogg",
            fireball: "./assets/sfx/fireball.ogg",
            healRegen: "./assets/sfx/heal_regen.ogg",
            manaRegen: "./assets/sfx/mana_regen.ogg",
            moveStep: "./assets/sfx/move_step_v2.ogg",
            playerHourglass: "./assets/sfx/player_hourglass_obtained.ogg",
            enemyHourglass: "./assets/sfx/enemy_hourglass_obtained.ogg",
            death: "./assets/sfx/death.ogg",
            levelUp: "./assets/sfx/level_up.ogg",
            newRound: "./assets/sfx/new_round.ogg",
            damage: "./assets/sfx/damage.ogg",
            debuff: "./assets/sfx/debuff.ogg",
            buff: "./assets/sfx/buff.ogg",
            nexusCaptured: "./assets/sfx/nexus_captured.ogg",
            physicalAttack: "./assets/sfx/physical_attack.ogg",
            basicAttack: "./assets/sfx/basic_attack.ogg",
            physicalAbility: "./assets/sfx/physical_ability.ogg",
            teleport: "./assets/sfx/teleport.ogg",
            spellDamage: "./assets/sfx/spell_damage.ogg",
            itemThrow: "./assets/sfx/item_throw.ogg",
            poisonDamage: "./assets/sfx/poison_damage.ogg",
            burningDamage: "./assets/sfx/burning_damage.ogg",
            drowningDamage: "./assets/sfx/drowning_damage.ogg",
            dodge: "./assets/sfx/dodge.ogg",
            physicalAbilityDamage: "./assets/sfx/physical_ability_damage.ogg",
            block: "./assets/sfx/block.ogg",
            gun: "./assets/sfx/gun.ogg",
            doubleShot: "./assets/sfx/double_shot.ogg",
            shootout: "./assets/sfx/shootout.ogg",
            turret: "./assets/sfx/turret.ogg",
            jetFlyover: "./assets/sfx/jet_flyover.ogg",
            nukeAlarm: "./assets/sfx/nuke_alarm.ogg",
            explosion: "./assets/sfx/explosion.ogg"
        };

        const _GUNSLINGER_DUEL_R2 = `${_R2_BASE}/SFX/gunslingerduel.mp3`;
        const _GUNSLINGER_DUEL_LOCAL = './assets/sfx/gunslingerduel.mp3';
        let _gunslingerDuelAudio = null;

        function playGunslingerDuelStinger() {
            try {
                if (!state.audioUnlocked) return;
                if (_gunslingerDuelAudio) {
                    _gunslingerDuelAudio.pause();
                    _gunslingerDuelAudio.currentTime = 0;
                }
                _gunslingerDuelAudio = new Audio(_GUNSLINGER_DUEL_R2);
                _gunslingerDuelAudio.onerror = function() { this.src = _GUNSLINGER_DUEL_LOCAL; };
                _gunslingerDuelAudio.volume = 0.6 * state.sfxVolume;
                _gunslingerDuelAudio.play().catch(() => {});
            } catch (e) {}
        }

        let sfxLibrary = {};
        for (const [key, r2Url] of Object.entries(_R2_SFX)) {
            sfxLibrary[key] = r2Url;
        }

        const SFX_BASE_VOLUMES = {
            uiConfirm: 0.7,
            uiButtonConfirm: 0.76,
            uiCursorMove: 0.45,
            uiCursorFocus: 0.58,
            uiError: 0.62,
            fireball: 0.82,
            healRegen: 0.74,
            manaRegen: 0.7,
            moveStep: 0.82,
            playerHourglass: 0.82,
            enemyHourglass: 0.82,
            death: 0.78,
            levelUp: 0.82,
            newRound: 0.65,
            damage: 0.75,
            debuff: 0.68,
            buff: 0.68,
            nexusCaptured: 0.82,
            physicalAttack: 0.78,
            basicAttack: 0.78,
            physicalAbility: 0.78,
            teleport: 0.74,
            spellDamage: 0.76,
            itemThrow: 0.72,
            poisonDamage: 0.72,
            burningDamage: 0.72,
            drowningDamage: 0.72,
            dodge: 0.74,
            physicalAbilityDamage: 0.76,
            block: 0.72,
            gun: 0.74,
            doubleShot: 0.78,
            shootout: 0.78,
            turret: 0.7,
            jetFlyover: 0.8,
            nukeAlarm: 0.82,
            explosion: 0.88
        };
        const SFX_COOLDOWNS = {
            uiCursorMove: 70,
            uiCursorFocus: 80,
            moveStep: 90,
            healRegen: 140,
            manaRegen: 140,
            uiConfirm: 120,
            uiButtonConfirm: 120,
            uiError: 200,
            playerHourglass: 300,
            enemyHourglass: 300,
            death: 200,
            levelUp: 400,
            newRound: 500,
            damage: 80,
            debuff: 200,
            buff: 200,
            nexusCaptured: 500,
            physicalAttack: 120,
            basicAttack: 120,
            physicalAbility: 120,
            teleport: 300,
            spellDamage: 80,
            itemThrow: 200,
            poisonDamage: 200,
            burningDamage: 200,
            drowningDamage: 200,
            dodge: 200,
            physicalAbilityDamage: 120,
            block: 120,
            gun: 70,
            doubleShot: 500,
            shootout: 110,
            turret: 90,
            jetFlyover: 600,
            nukeAlarm: 800,
            explosion: 200
        };
        const sfxLastPlayedAt = {};
        const sfxReusableKeys = new Set(['healRegen', 'manaRegen']);
        const sfxReusableAudio = new Map();
        const battleMusicKeys = ['battleTheme', 'battleThemeAlt1', 'battleThemeAlt2', 'battleThemeAlt3', 'battleThemeAlt4', 'battleThemeAlt5', 'battleThemeAlt6', 'battleThemeAlt7', 'battleThemeAlt8', 'battleThemeAlt9', 'battleThemeAlt10', 'battleThemeAlt11', 'battleThemeAlt12', 'battleThemeAlt13', 'battleThemeAlt14', 'battleThemeAlt15', 'battleThemeAlt16', 'battleThemeAlt17', 'battleThemeAlt18', 'battleThemeAlt19', 'battleThemeAlt20', 'battleThemeAlt21', 'battleThemeAlt22', 'battleThemeAlt23', 'battleThemeAlt24', 'battleThemeAlt25', 'battleThemeAlt26', 'battleThemeAlt27', 'battleThemeAlt28', 'mainTheme'];

        const MUSIC_CROSSFADE_MS = 1800;
        const BATTLE_CROSSFADE_MS = 8000;
        const STINGER_FADE_OUT_MS = 350;
        let audioFadeVersion = 0;

        function getMusicBaseVolume(key) {
            return Math.max(0, Math.min(1, (AUDIO_BASE_VOLUMES[key] ?? 0.55) * (state.musicVolume ?? 1)));
        }

        function getSfxBaseVolume(key) {
            return Math.max(0, Math.min(1, (SFX_BASE_VOLUMES[key] ?? 0.7) * (state.sfxVolume ?? 1)));
        }

        function refreshVisibleVolumeValues() {
            if (musicVolumeSlider) musicVolumeSlider.value = String(Math.round((state.musicVolume ?? 0.68) * 100));
            if (sfxVolumeSlider) sfxVolumeSlider.value = String(Math.round((state.sfxVolume ?? 0.9) * 100));
            if (musicVolumeValue) musicVolumeValue.textContent = `${Math.round((state.musicVolume ?? 0.68) * 100)}%`;
            if (sfxVolumeValue) sfxVolumeValue.textContent = `${Math.round((state.sfxVolume ?? 0.9) * 100)}%`;
        }

        function applyMusicVolumeMix() {
            Object.entries(audioTracks).forEach(([key, track]) => {
                if (track.paused) {
                    track.volume = getMusicBaseVolume(key);
                }
            });
            if (state.currentMusic && audioTracks[state.currentMusic] && !audioTracks[state.currentMusic].paused) {
                audioTracks[state.currentMusic].volume = getMusicBaseVolume(state.currentMusic);
            }
            ['victory', 'defeat'].forEach(key => {
                const track = audioTracks[key];
                if (track && !track.paused) {
                    track.volume = getMusicBaseVolume(key);
                }
            });
            refreshVisibleVolumeValues();
        }

        Object.entries(audioTracks).forEach(([key, track]) => {
            if (!track) return;
            track.preload = 'auto';
            track.volume = getMusicBaseVolume(key);
        });
        if (audioTracks.mainTheme) audioTracks.mainTheme.loop = true;
        if (audioTracks.titleTheme) audioTracks.titleTheme.loop = true;

        battleMusicKeys.forEach(key => {
            if (audioTracks[key]) audioTracks[key].loop = false;
        });

        let battleShuffleBag = [];

        function refillBattleShuffleBag() {
            battleShuffleBag = battleMusicKeys.slice();

            for (let i = battleShuffleBag.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [battleShuffleBag[i], battleShuffleBag[j]] = [battleShuffleBag[j], battleShuffleBag[i]];
            }
        }

        function drawFromBattleShuffleBag(excludeKey) {
            if (battleShuffleBag.length === 0) refillBattleShuffleBag();

            if (battleShuffleBag.length > 1 && battleShuffleBag[0] === excludeKey) {
                const swapIdx = 1 + Math.floor(Math.random() * (battleShuffleBag.length - 1));
                [battleShuffleBag[0], battleShuffleBag[swapIdx]] = [battleShuffleBag[swapIdx], battleShuffleBag[0]];
            }
            return battleShuffleBag.shift();
        }

        const BATTLE_CROSSFADE_LEAD_SEC = 9;
        const _battleCrossfadeTriggered = new Set();

        function advanceBattleTrack(endingKey) {
            if (state.phase !== 'battle' || state.winner) return;
            if (_battleCrossfadeTriggered.has(endingKey)) return;
            _battleCrossfadeTriggered.add(endingKey);
            const nextKey = drawFromBattleShuffleBag(endingKey);
            state.currentBattleTrackKey = nextKey;
            state.lastBattleTrackKey = nextKey;
            playMusic(nextKey);
        }

        battleMusicKeys.forEach(key => {
            if (!audioTracks[key]) return;

            audioTracks[key].addEventListener('timeupdate', () => {
                const t = audioTracks[key];
                if (!t.duration || !Number.isFinite(t.duration)) return;
                const remaining = t.duration - t.currentTime;
                if (remaining <= BATTLE_CROSSFADE_LEAD_SEC && remaining > 0) {
                    advanceBattleTrack(key);
                }
            });

            audioTracks[key].addEventListener('ended', () => {
                advanceBattleTrack(key);
            });

            audioTracks[key].addEventListener('play', () => {
                _battleCrossfadeTriggered.delete(key);
            });
        });
        refreshVisibleVolumeValues();

        function stopStingers() {
            ['victory', 'defeat'].forEach(key => {
                const track = audioTracks[key];
                if (!track) return;
                track.pause();
                track.currentTime = 0;
                track.volume = getMusicBaseVolume(key);
            });
        }

        function playSfx(key, opts = {}) {

            if (state.devAutoSim) return false;
            if (!state.audioUnlocked && !opts.allowBeforeUnlock) return false;
            const src = sfxLibrary[key];
            if (!src) return false;
            const now = performance.now();

            if (!playSfx._recent) playSfx._recent = [];
            playSfx._recent = playSfx._recent.filter(t => now - t < 200);
            if (playSfx._recent.length >= 6) return false;
            const cooldown = opts.cooldownMs ?? SFX_COOLDOWNS[key] ?? 50;
            if (cooldown > 0 && now - (sfxLastPlayedAt[key] || 0) < cooldown) return false;
            sfxLastPlayedAt[key] = now;
            playSfx._recent.push(now);
            try {
                let audio;
                if (sfxReusableKeys.has(key)) {
                    audio = sfxReusableAudio.get(key);
                    if (!audio) {
                        audio = new Audio(src);
                        audio.preload = 'auto';
                        if (_LOCAL_SFX[key]) {
                            audio.onerror = function() {
                                if (!this._fellBack) {
                                    this._fellBack = true;
                                    this.src = _LOCAL_SFX[key];
                                } else { this.onerror = null; }
                            };
                        }
                        sfxReusableAudio.set(key, audio);
                    }
                    audio.pause();
                    audio.currentTime = 0;
                } else {
                    audio = new Audio(src);
                    audio.preload = 'auto';
                    if (_LOCAL_SFX[key]) {
                        audio.onerror = function() { if (!this._fellBack) { this._fellBack = true; this.src = _LOCAL_SFX[key]; } else { this.onerror = null; } };
                    }
                }
                audio.volume = Math.max(0, Math.min(1, opts.volume ?? getSfxBaseVolume(key)));
                audio.play().catch(() => {});
                return true;
            } catch (err) {
                return false;
            }
        }

        function playErrorSfx() {
            return playSfx('uiError');
        }

        let _audioCtx = null;

        function playUnitSwitchChime() {
            if (!state.audioUnlocked) return;
            try {
                if (!_audioCtx) _audioCtx = new(window.AudioContext || window.webkitAudioContext)();
                const ctx = _audioCtx;
                const vol = Math.max(0, Math.min(1, (state.sfxVolume ?? 0.9) * 0.55));
                const now = ctx.currentTime;

                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(659, now);
                gain1.gain.setValueAtTime(vol, now);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc1.connect(gain1).connect(ctx.destination);
                osc1.start(now);
                osc1.stop(now + 0.13);

                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(988, now + 0.08);
                gain2.gain.setValueAtTime(0.001, now);
                gain2.gain.setValueAtTime(vol * 0.8, now + 0.08);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
                osc2.connect(gain2).connect(ctx.destination);
                osc2.start(now + 0.08);
                osc2.stop(now + 0.25);
            } catch (e) {
                 }
        }
        window.playUnitSwitchChime = playUnitSwitchChime;

        function fadeTrackVolume(track, targetVolume, durationMs, version) {
            if (durationMs <= 0) {
                try { track.volume = Math.max(0, Math.min(1, targetVolume)); } catch(e) {}
                return Promise.resolve();
            }
            const startVolume = Math.max(0, Math.min(1, Number.isFinite(track.volume) ? track.volume : 0));
            const clampedTarget = Math.max(0, Math.min(1, targetVolume));
            return new Promise(resolve => {
                const startTime = performance.now();

                function step(now) {
                    if (version !== audioFadeVersion) {
                        resolve();
                        return;
                    }
                    const linear = Math.min(1, (now - startTime) / durationMs);

                    const fadingOut = clampedTarget < startVolume;
                    const t = fadingOut
                        ? linear * linear * linear
                        : 1 - Math.pow(1 - linear, 3);
                    try {
                        track.volume = Math.max(0, Math.min(1, startVolume + (clampedTarget - startVolume) * t));
                    } catch(e) { resolve(); return; }
                    if (linear >= 1) {
                        resolve();
                        return;
                    }
                    requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
            });
        }

        async function playMusic(trackKey) {

            if (state.devAutoSim) return false;
            if (!state.audioUnlocked) return false;
            const nextTrack = audioTracks[trackKey];
            if (!nextTrack) return false;
            stopStingers();
            const nextBaseVolume = getMusicBaseVolume(trackKey);

            if (state.currentMusic === trackKey && !nextTrack.paused) {

                if (nextTrack.volume < 0.01) nextTrack.volume = nextBaseVolume;
                return true;
            }

            const previousKey = state.currentMusic;
            const previousTrack = previousKey ? audioTracks[previousKey] : null;
            const hasPreviousPlaying = previousTrack && previousTrack !== nextTrack && !previousTrack.paused;
            const version = ++audioFadeVersion;

            state.currentMusic = trackKey;

            if (previousTrack === nextTrack) {
                nextTrack.volume = nextBaseVolume;
                if (nextTrack.paused) {
                    try {
                        await nextTrack.play();
                    } catch (err) {
                        return false;
                    }
                }
                return true;
            }

            nextTrack.pause();
            nextTrack.currentTime = 0;

            if (hasPreviousPlaying) {

                const _isBattleKey = k => k && k.startsWith('battleTheme');
                const crossMs = (_isBattleKey(previousKey) && _isBattleKey(trackKey))
                    ? BATTLE_CROSSFADE_MS : MUSIC_CROSSFADE_MS;

                nextTrack.volume = 0;
                try {
                    await nextTrack.play();
                } catch (err) {
                    if (version === audioFadeVersion) {
                        nextTrack.volume = nextBaseVolume;
                        state.currentMusic = previousKey;
                    }
                    return false;
                }
                const fades = [
                    fadeTrackVolume(nextTrack, nextBaseVolume, crossMs, version).then(() => {

                        if (version !== audioFadeVersion && state.currentMusic === trackKey && !nextTrack.paused) {
                            nextTrack.volume = nextBaseVolume;
                        }
                    }),
                    fadeTrackVolume(previousTrack, 0, crossMs, version).then(() => {
                        if (version === audioFadeVersion) {

                            previousTrack.pause();
                            previousTrack.volume = getMusicBaseVolume(previousKey);
                        } else if (state.currentMusic !== previousKey) {

                            previousTrack.pause();
                            previousTrack.volume = getMusicBaseVolume(previousKey);
                        }
                    })
                ];
                await Promise.allSettled(fades);

                if (version === audioFadeVersion && nextTrack.volume < 0.01 && !nextTrack.paused) {
                    nextTrack.volume = nextBaseVolume;
                }
            } else {

                nextTrack.volume = nextBaseVolume;
                try {
                    await nextTrack.play();
                } catch (err) {
                    if (version === audioFadeVersion) {
                        state.currentMusic = null;
                    }
                    return false;
                }
            }
            return true;
        }

        async function playStinger(trackKey) {
            if (state.devAutoSim) return;
            if (!state.audioUnlocked) return;
            const track = audioTracks[trackKey];
            if (!track) return;

            const version = ++audioFadeVersion;
            const stingerVolume = getMusicBaseVolume(trackKey);
            const activeMusicKey = state.currentMusic;
            const activeMusic = activeMusicKey ? audioTracks[activeMusicKey] : null;

            state.currentMusic = null;

            if (activeMusic && !activeMusic.paused) {
                await fadeTrackVolume(activeMusic, 0, STINGER_FADE_OUT_MS, version);
                if (version !== audioFadeVersion) return;
                activeMusic.pause();
                activeMusic.volume = getMusicBaseVolume(activeMusicKey);
            }

            track.pause();
            track.currentTime = 0;
            track.volume = stingerVolume;
            try {
                await track.play();
            } catch (err) {
            }
        }

        ['victory', 'defeat'].forEach(key => {
            if (!audioTracks[key]) return;
            audioTracks[key].addEventListener('ended', () => {
                audioTracks[key].currentTime = 0;
                audioTracks[key].volume = getMusicBaseVolume(key);
                if (!state.winner && state.audioUnlocked) syncMusicToState();
            });
        });

        async function unlockAudioAndPlayTitleTheme() {
            if (state.audioUnlocked) {
                if ((state.titleScreenVisible || state.phase === 'setup') && !state.winner) {

                    const key = state.titleScreenVisible ? 'titleTheme' : 'mainTheme';
                    return await playMusic(key);
                }
                return false;
            }
            state.audioUnlocked = true;
            const key = state.titleScreenVisible ? 'titleTheme' : 'mainTheme';
            const started = await playMusic(key);
            render();
            return started;
        }

        async function attemptTitleMusicAutoplay() {
            if (!state.titleScreenVisible || state.winner) return;
            try {
                await unlockAudioAndPlayTitleTheme();
            } catch (err) {
            }
        }
