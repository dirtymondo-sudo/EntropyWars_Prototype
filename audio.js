        const _R2_BASE = 'https://cdn.entropywars.net/Assets';
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
            /* uiBack/arrowShot reuse existing clips until dedicated
               ui_back.ogg / arrow_shot.ogg are uploaded to R2 — swap the
               paths then. */
            uiBack:          `${_R2_BASE}/SFX/ui_cursormove.ogg`,
            arrowShot:       `${_R2_BASE}/SFX/item_throw.ogg`,
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
            /* ── Elemental layer (SFX_AUDIT §1, uploaded 2026-08-04) ── */
            elecCast:        `${_R2_BASE}/SFX/elecCast.mp3`,
            lightningStrike: `${_R2_BASE}/SFX/lightningStrike.mp3`,
            thunderRumble:   `${_R2_BASE}/SFX/thunderRumble.mp3`,
            chainHop:        `${_R2_BASE}/SFX/chainHop.mp3`,
            conductionArc:   `${_R2_BASE}/SFX/conductionArc.mp3`,
            empBurst:        `${_R2_BASE}/SFX/empBurst.mp3`,
            taserZap:        `${_R2_BASE}/SFX/taserZap.mp3`,
            flameJet:        `${_R2_BASE}/SFX/flameJet.mp3`,
            iceCast:         `${_R2_BASE}/SFX/iceCast.mp3`,
            iceImpact:       `${_R2_BASE}/SFX/iceImpact.mp3`,
            freezeSolid:     `${_R2_BASE}/SFX/freezeSolid.mp3`,
            iceSlide:        `${_R2_BASE}/SFX/iceSlide.mp3`,
            waterCast:       `${_R2_BASE}/SFX/waterCast.mp3`,
            waterImpact:     `${_R2_BASE}/SFX/waterImpact.mp3`,
            tidalWave:       `${_R2_BASE}/SFX/tidalWave.mp3`,
            earthCast:       `${_R2_BASE}/SFX/earthCast.mp3`,
            earthImpact:     `${_R2_BASE}/SFX/earthImpact.mp3`,
            quakeRumble:     `${_R2_BASE}/SFX/quakeRumble.mp3`,
            discord:         `${_R2_BASE}/SFX/discord.mp3`,
        };
        const _LOCAL_SFX = {
            uiConfirm: "./assets/sfx/ui_confirm.ogg",
            uiCursorMove: "./assets/sfx/ui_cursormove.ogg",
            uiCursorFocus: "./assets/sfx/ui_cursorfocus.ogg",
            uiButtonConfirm: "./assets/sfx/ui_buttonconfirm.ogg",
            uiError: "./assets/sfx/ui_error.ogg",
            uiBack: "./assets/sfx/ui_cursormove.ogg",
            arrowShot: "./assets/sfx/item_throw.ogg",
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
            explosion: "./assets/sfx/explosion.ogg",
            elecCast: "./assets/sfx/elecCast.mp3",
            lightningStrike: "./assets/sfx/lightningStrike.mp3",
            thunderRumble: "./assets/sfx/thunderRumble.mp3",
            chainHop: "./assets/sfx/chainHop.mp3",
            conductionArc: "./assets/sfx/conductionArc.mp3",
            empBurst: "./assets/sfx/empBurst.mp3",
            taserZap: "./assets/sfx/taserZap.mp3",
            flameJet: "./assets/sfx/flameJet.mp3",
            iceCast: "./assets/sfx/iceCast.mp3",
            iceImpact: "./assets/sfx/iceImpact.mp3",
            freezeSolid: "./assets/sfx/freezeSolid.mp3",
            iceSlide: "./assets/sfx/iceSlide.mp3",
            waterCast: "./assets/sfx/waterCast.mp3",
            waterImpact: "./assets/sfx/waterImpact.mp3",
            tidalWave: "./assets/sfx/tidalWave.mp3",
            earthCast: "./assets/sfx/earthCast.mp3",
            earthImpact: "./assets/sfx/earthImpact.mp3",
            quakeRumble: "./assets/sfx/quakeRumble.mp3",
            discord: "./assets/sfx/discord.mp3"
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
            uiBack: 0.4,
            arrowShot: 0.72,
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
            explosion: 0.62,
            elecCast: 0.72,
            lightningStrike: 0.8,
            thunderRumble: 0.6,
            chainHop: 0.66,
            conductionArc: 0.62,
            empBurst: 0.78,
            taserZap: 0.7,
            flameJet: 0.74,
            iceCast: 0.7,
            iceImpact: 0.74,
            freezeSolid: 0.74,
            iceSlide: 0.6,
            waterCast: 0.7,
            waterImpact: 0.74,
            tidalWave: 0.78,
            earthCast: 0.72,
            earthImpact: 0.76,
            quakeRumble: 0.78,
            discord: 0.68
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
            uiBack: 120,
            arrowShot: 150,
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
            explosion: 200,
            elecCast: 120,
            lightningStrike: 150,
            thunderRumble: 900,
            chainHop: 90,
            conductionArc: 140,
            empBurst: 300,
            taserZap: 150,
            flameJet: 400,
            iceCast: 120,
            iceImpact: 100,
            freezeSolid: 250,
            iceSlide: 250,
            waterCast: 120,
            waterImpact: 100,
            tidalWave: 500,
            earthCast: 120,
            earthImpact: 100,
            quakeRumble: 900,
            discord: 250
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
            if (ambienceVolumeSlider) ambienceVolumeSlider.value = String(Math.round((state.ambienceVolume ?? 0.8) * 100));
            if (musicVolumeValue) musicVolumeValue.textContent = `${Math.round((state.musicVolume ?? 0.68) * 100)}%`;
            if (sfxVolumeValue) sfxVolumeValue.textContent = `${Math.round((state.sfxVolume ?? 0.9) * 100)}%`;
            if (ambienceVolumeValue) ambienceVolumeValue.textContent = `${Math.round((state.ambienceVolume ?? 0.8) * 100)}%`;
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

        /* Match-start audio preload (ROADMAP §3.2): force-buffer the battle
           track chosen in startMatch while the loading screen is up, so the
           first battle bar doesn't hitch on a cold MP3 stream. Resolves true
           when the track can play through, false on error/timeout/no-track —
           never rejects, so the loading screen can Promise.all it. Never
           touches a track that is already playing. */
        function warmBattleTrack(trackKey, timeoutMs) {
            return new Promise((resolve) => {
                const track = trackKey ? audioTracks[trackKey] : null;
                if (!track || !track.paused) { resolve(false); return; }
                if (track.readyState >= 4) { resolve(true); return; }   // HAVE_ENOUGH_DATA
                let settled = false;
                const finish = (ok) => {
                    if (settled) return;
                    settled = true;
                    track.removeEventListener('canplaythrough', onReady);
                    track.removeEventListener('error', onErr);
                    resolve(ok);
                };
                const onReady = () => finish(true);
                const onErr = () => finish(false);
                track.addEventListener('canplaythrough', onReady);
                track.addEventListener('error', onErr);
                try {
                    track.preload = 'auto';
                    track.load();
                } catch (_) { finish(false); return; }
                setTimeout(() => finish(false), timeoutMs || 10000);
            });
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

        /* ═══════════════════════════════════════════════════════════════════
           AMBIENCE BEDS (SFX_AUDIT §5, assets uploaded 2026-08-04)
           A second looping channel that sits UNDER the music. Beds STACK:
           weather, map flavour and day/night are independent layers (night +
           thunderstorm plays both), each faded in/out on its own as the scene
           changes. Picked every few seconds from live battle state, so it
           needs no per-event hooks and, online, the guest's synced state
           drives the same picker locally (no relay needed). The whole channel
           rides its own Ambience slider (state.ambienceVolume), separate from
           Music and SFX.
           Kill-switch (console): window.EW_DISABLE_AMBIENCE = true.
           ═══════════════════════════════════════════════════════════════ */
        const _R2_AMBIENCE = {
            thunderAmbience: `${_R2_BASE}/SFX/thunderAmbience.mp3`,
            ambDay:          `${_R2_BASE}/SFX/ambDay.mp3`,
            ambNight:        `${_R2_BASE}/SFX/ambNight.mp3`,
            ambWindHigh:     `${_R2_BASE}/SFX/ambWindHigh.mp3`,
            ambCavern:       `${_R2_BASE}/SFX/ambCavern.mp3`,
            lavaBubble:      `${_R2_BASE}/SFX/lavaBubble.mp3`,
        };
        // Quiet by design: beds ride the Ambience volume slider but are mixed
        // well below one-shots so they never fight the music or the impacts.
        const AMBIENCE_BASE_VOLUMES = {
            thunderAmbience: 0.42,
            ambDay: 0.28,
            ambNight: 0.28,
            ambWindHigh: 0.32,
            ambCavern: 0.34,
            lavaBubble: 0.36,
        };
        const AMBIENCE_FADE_MS = 1600;
        const AMBIENCE_TICK_MS = 3000;
        const _ambienceTracks = {};          // key -> Audio (lazy, loop=true)
        const _ambienceActive = new Set();   // beds currently playing (or fading in)
        const _ambienceFadeTokens = {};      // key -> int; bumping cancels that bed's in-flight fade

        function _ambienceTargetVol(key) {
            const base = AMBIENCE_BASE_VOLUMES[key] ?? 0.3;
            return Math.max(0, Math.min(1, base * (state.ambienceVolume ?? 0.8)));
        }

        // Immediate slider response (the 3s tick would otherwise lag it).
        function applyAmbienceVolumeMix() {
            _ambienceActive.forEach(key => {
                const t = _ambienceTracks[key];
                if (t && !t.paused) { try { t.volume = _ambienceTargetVol(key); } catch (e) {} }
            });
            /* the D.O.O.R. HQ room tone (below) rides the same slider */
            try { if (typeof _doorRoomToneApplyVol === 'function') _doorRoomToneApplyVol(); } catch (e) {}
        }

        function _getAmbienceTrack(key) {
            if (_ambienceTracks[key]) return _ambienceTracks[key];
            const src = _R2_AMBIENCE[key];
            if (!src) return null;
            try {
                const a = new Audio(src);
                a.loop = true;
                a.preload = 'none';
                // No local fallback exists for the beds — just stop retrying.
                a.onerror = function() { this.onerror = null; };
                _ambienceTracks[key] = a;
                return a;
            } catch (e) { return null; }
        }

        // Tiny dedicated fader — deliberately NOT fadeTrackVolume, whose
        // audioFadeVersion is bumped by every music transition and would
        // cancel ambience fades mid-flight. Tokens are PER BED so fading one
        // layer out never cancels another layer's fade-in.
        function _fadeAmbienceTrack(key, track, target, ms, onDone) {
            const token = _ambienceFadeTokens[key] = (_ambienceFadeTokens[key] || 0) + 1;
            const start = Math.max(0, Math.min(1, Number.isFinite(track.volume) ? track.volume : 0));
            const t0 = performance.now();
            function step(now) {
                if (token !== _ambienceFadeTokens[key]) return;
                const t = ms > 0 ? Math.min(1, (now - t0) / ms) : 1;
                try { track.volume = start + (target - start) * t; } catch (e) { return; }
                if (t >= 1) { if (onDone) onDone(); return; }
                requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        }

        function _startAmbienceBed(key) {
            if (_ambienceActive.has(key)) return;
            const track = _getAmbienceTrack(key);
            if (!track) return;
            _ambienceActive.add(key);
            try {
                if (track.paused) track.volume = 0;
                track.play().then(() => {
                    // Stopped again while play() was pending → don't leave it looping at 0.
                    if (!_ambienceActive.has(key)) { try { track.pause(); } catch (e) {} return; }
                    _fadeAmbienceTrack(key, track, _ambienceTargetVol(key), AMBIENCE_FADE_MS);
                }).catch(() => { _ambienceActive.delete(key); });
            } catch (e) { _ambienceActive.delete(key); }
        }

        function _stopAmbienceBed(key) {
            if (!_ambienceActive.has(key)) return;
            _ambienceActive.delete(key);
            const track = _ambienceTracks[key];
            if (!track || track.paused) return;
            _fadeAmbienceTrack(key, track, 0, AMBIENCE_FADE_MS, () => { try { track.pause(); } catch (e) {} });
        }

        // Map flavour scan (cached ~12s — boards are static outside reshapes):
        // molten boards bubble, cloud boards get thin altitude wind, crystal
        // cavern environments get drips + room tone.
        let _ambFlavourCache = { at: 0, val: null };
        function _ambienceMapFlavour() {
            const now = performance.now();
            if (_ambFlavourCache.at && now - _ambFlavourCache.at < 12000) return _ambFlavourCache.val;
            let lava = 0, cloud = 0, total = 0;
            try {
                if (typeof getTerrainAt === 'function' && typeof bw === 'function' && typeof bh === 'function') {
                    const W = bw(), H = bh();
                    for (let y = 0; y < H; y++) {
                        for (let x = 0; x < W; x++) {
                            const t = getTerrainAt(x, y);
                            if (!t) continue;
                            total++;
                            if (t === 'lava') lava++;
                            else if (t.indexOf('cloud') === 0) cloud++;
                        }
                    }
                }
            } catch (e) {}
            let val = null;
            if (lava >= 6) val = 'lavaBubble';
            else if (total > 0 && cloud / total >= 0.3) val = 'ambWindHigh';
            else if (state.mapEnv && state.mapEnv.scenery === 'crystals') val = 'ambCavern';
            _ambFlavourCache = { at: now, val };
            return val;
        }

        // Stackable layers: weather + map flavour + day/night can all play at
        // once (night crickets under a thunderstorm). One exception: daytime
        // birdsong under a raging storm reads wrong, so the storm replaces it.
        function _desiredAmbienceKeys() {
            try {
                if (window.EW_DISABLE_AMBIENCE) return [];
                if (!state.audioUnlocked || state.devAutoSim) return [];
                if (state.phase !== 'battle' || state.winner) return [];
                const keys = [];
                const aw = state.activeWeather || [];
                const storm = aw.some(w => w && (w.type === 'thunderstorm' || w.type === 'hurricane'));
                if (storm) keys.push('thunderAmbience');
                const flav = _ambienceMapFlavour();
                if (flav) keys.push(flav);
                const cyc = (document.body && document.body.dataset && document.body.dataset.cycle) || 'day';
                if (cyc === 'night') keys.push('ambNight');
                else if (!storm) keys.push('ambDay');
                return keys;
            } catch (e) { return []; }
        }

        window.setInterval(() => {
            const want = new Set(_desiredAmbienceKeys());
            Array.from(_ambienceActive).forEach(key => {
                if (!want.has(key)) _stopAmbienceBed(key);
            });
            want.forEach(key => {
                if (!_ambienceActive.has(key)) {
                    _startAmbienceBed(key);
                } else if (_ambienceTracks[key] && !_ambienceTracks[key].paused) {
                    // Track the Ambience volume slider between crossfades.
                    try { _ambienceTracks[key].volume = _ambienceTargetVol(key); } catch (e) {}
                }
            });
        }, AMBIENCE_TICK_MS);
        // A fresh battle deserves a fresh terrain scan (lava/cloud counts).
        window._ewResetAmbienceCache = () => { _ambFlavourCache = { at: 0, val: null }; };

        /* ═══════════════════════════════════════════════════════════════════
           D.O.O.R. SOUND KIT (DOOR_DESIGN §5.3 / build step 2, 2026-09-02)
           Procedural Web Audio placeholders for the bureaucratic layer: stamp
           thunk, DENIED buzzer, lamination roller, CRT power-on, VHS eject,
           dot-matrix burst, fax handshake, PA chime, security-door buzz and
           the ident sting. No asset files: they are synthesized on demand from
           oscillators + filtered noise, so nothing has to be uploaded to R2 and
           nothing needs a cache-bust beyond audio.js itself.
           UPGRADE PATH: to replace any of them with a real recording, add the
           file to _R2_SFX under the key named in _DOOR_SFX_FILE_KEY (e.g.
           `doorStamp`) — playDoorSfx() prefers the file and skips the synth.
           All of them ride the SFX slider (state.sfxVolume) and the same
           audioUnlocked gate as playSfx(); the ident additionally checks that
           the AudioContext is actually running, because it fires on page load
           before any gesture and must stay silent rather than error.
           ═══════════════════════════════════════════════════════════════════ */
        const _DOOR_SFX_FILE_KEY = {
            stamp: 'doorStamp', denied: 'doorDenied', laminate: 'doorLaminate',
            crtOn: 'doorCrtOn', vhsEject: 'doorVhsEject', dotMatrix: 'doorDotMatrix',
            fax: 'doorFax', paChime: 'doorPaChime', doorBuzz: 'doorBuzz',
            identSting: 'doorIdentSting', doorbell: 'doorDoorbell',
        };
        const _DOOR_SFX_GAIN = {
            stamp: 0.85, denied: 0.42, laminate: 0.5, crtOn: 0.45, vhsEject: 0.55,
            dotMatrix: 0.32, fax: 0.3, paChime: 0.5, doorBuzz: 0.4, identSting: 0.55,
            doorbell: 0.5,
        };
        let _doorNoiseBuf = null;
        function _doorCtx() {
            if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            return _audioCtx;
        }
        function _doorNoise(ctx) {
            if (_doorNoiseBuf && _doorNoiseBuf.sampleRate === ctx.sampleRate) return _doorNoiseBuf;
            const len = Math.floor(ctx.sampleRate * 1.5);
            const buf = ctx.createBuffer(1, len, ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
            _doorNoiseBuf = buf;
            return buf;
        }
        /* A gain node with an ADSR-ish envelope, already connected to `out`. */
        function _doorEnv(ctx, out, t, peak, attack, hold, release, floor) {
            const g = ctx.createGain();
            const f = floor || 0.0005;
            g.gain.setValueAtTime(f, t);
            g.gain.linearRampToValueAtTime(Math.max(f, peak), t + Math.max(0.001, attack));
            g.gain.setValueAtTime(Math.max(f, peak), t + attack + hold);
            g.gain.exponentialRampToValueAtTime(f, t + attack + hold + Math.max(0.005, release));
            g.connect(out);
            return g;
        }
        function _doorOsc(ctx, dest, type, f0, t, dur, o) {
            const osc = ctx.createOscillator();
            osc.type = type;
            osc.frequency.setValueAtTime(f0, t);
            if (o && o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t + (o.slide || dur));
            if (o && o.detune) osc.detune.setValueAtTime(o.detune, t);
            osc.connect(dest);
            osc.start(t);
            osc.stop(t + dur + 0.02);
            return osc;
        }
        function _doorNoiseSrc(ctx, dest, t, dur, filt) {
            const src = ctx.createBufferSource();
            src.buffer = _doorNoise(ctx);
            src.loop = true;
            let node = src;
            if (filt) {
                const bq = ctx.createBiquadFilter();
                bq.type = filt.type || 'bandpass';
                bq.frequency.setValueAtTime(filt.f0 || 1000, t);
                if (filt.f1) bq.frequency.exponentialRampToValueAtTime(filt.f1, t + (filt.slide || dur));
                bq.Q.value = filt.q || 1;
                src.connect(bq);
                node = bq;
            }
            node.connect(dest);
            src.start(t);
            src.stop(t + dur + 0.02);
            return src;
        }

        /* Each recipe: (ctx, t, out, vol) → seconds of audio it scheduled. */
        const _DOOR_SFX_RECIPES = {
            /* Rubber stamp: a low wooden thump + a short, bright slap of ink. */
            stamp(ctx, t, out, vol) {
                _doorOsc(ctx, _doorEnv(ctx, out, t, vol, 0.003, 0.02, 0.16), 'sine', 190, t, 0.2, { f1: 48, slide: 0.12 });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.55, 0.002, 0.01, 0.045), t, 0.07, { type: 'bandpass', f0: 1400, q: 0.8 });
                _doorOsc(ctx, _doorEnv(ctx, out, t + 0.004, vol * 0.25, 0.001, 0.004, 0.03), 'square', 2300, t + 0.004, 0.04);
                return 0.35;
            },
            /* DENIED: two rough buzzer pulses (detuned squares, tremolo, lowpass). */
            denied(ctx, t, out, vol) {
                const lp = ctx.createBiquadFilter();
                lp.type = 'lowpass'; lp.frequency.value = 1100; lp.Q.value = 2;
                lp.connect(out);
                for (let i = 0; i < 2; i++) {
                    const t0 = t + i * 0.24;
                    const g = _doorEnv(ctx, lp, t0, vol, 0.008, 0.15, 0.04);
                    const lfo = ctx.createOscillator(); const lg = ctx.createGain();
                    lfo.type = 'square'; lfo.frequency.value = 38; lg.gain.value = vol * 0.35;
                    lfo.connect(lg).connect(g.gain); lfo.start(t0); lfo.stop(t0 + 0.22);
                    _doorOsc(ctx, g, 'square', 112, t0, 0.2);
                    _doorOsc(ctx, g, 'square', 167, t0, 0.2, { detune: 12 });
                    _doorOsc(ctx, g, 'sawtooth', 56, t0, 0.2);
                }
                return 0.55;
            },
            /* Lamination roller: a motor whirr that swells as the card feeds
               through, a click as it clears, and a clean "ready" ding. */
            laminate(ctx, t, out, vol) {
                const dur = 1.05;
                const motor = _doorEnv(ctx, out, t, vol * 0.7, 0.12, dur - 0.3, 0.18);
                _doorOsc(ctx, motor, 'sawtooth', 52, t, dur, { f1: 66, slide: dur });
                _doorOsc(ctx, motor, 'triangle', 104, t, dur, { f1: 132, slide: dur });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.35, 0.15, dur - 0.35, 0.2), t, dur, { type: 'bandpass', f0: 320, f1: 760, slide: dur * 0.7, q: 1.4 });
                const tc = t + dur + 0.02;
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, tc, vol * 0.5, 0.001, 0.008, 0.04), tc, 0.06, { type: 'highpass', f0: 2500 });
                const td = tc + 0.08;
                _doorOsc(ctx, _doorEnv(ctx, out, td, vol * 0.5, 0.004, 0.05, 0.55), 'sine', 1760, td, 0.62);
                _doorOsc(ctx, _doorEnv(ctx, out, td, vol * 0.18, 0.004, 0.03, 0.4), 'sine', 3520, td, 0.45);
                return dur + 0.8;
            },
            /* CRT power-on: mains thump, degauss "bwong", flyback whine, static. */
            crtOn(ctx, t, out, vol) {
                _doorOsc(ctx, _doorEnv(ctx, out, t, vol * 0.9, 0.002, 0.03, 0.12), 'sine', 70, t, 0.16, { f1: 38, slide: 0.15 });
                _doorOsc(ctx, _doorEnv(ctx, out, t + 0.02, vol * 0.55, 0.01, 0.05, 0.5), 'sine', 96, t + 0.02, 0.58, { f1: 42, slide: 0.5 });
                _doorOsc(ctx, _doorEnv(ctx, out, t + 0.05, vol * 0.09, 0.15, 0.4, 0.5), 'sine', 11800, t + 0.05, 1.05);
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t + 0.01, vol * 0.3, 0.01, 0.05, 0.42), t + 0.01, 0.5, { type: 'lowpass', f0: 4200, f1: 900, slide: 0.45, q: 0.7 });
                return 0.7;
            },
            /* VHS eject: latch clack, a motor that spins down (tape stop), a
               second clack as the cassette clears the slot. */
            vhsEject(ctx, t, out, vol) {
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.6, 0.001, 0.01, 0.05), t, 0.07, { type: 'bandpass', f0: 2600, q: 1.2 });
                const m = _doorEnv(ctx, out, t + 0.04, vol * 0.5, 0.02, 0.25, 0.22);
                _doorOsc(ctx, m, 'sawtooth', 48, t + 0.04, 0.5, { f1: 14, slide: 0.48 });
                _doorOsc(ctx, m, 'square', 96, t + 0.04, 0.5, { f1: 28, slide: 0.48 });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t + 0.05, vol * 0.2, 0.02, 0.2, 0.2), t + 0.05, 0.45, { type: 'bandpass', f0: 900, f1: 260, slide: 0.42, q: 1.5 });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t + 0.5, vol * 0.5, 0.001, 0.012, 0.06), t + 0.5, 0.08, { type: 'bandpass', f0: 1900, q: 1 });
                return 0.65;
            },
            /* Dot-matrix printer: a gated buzz of pin strikes, then the
               carriage return. Nine-pin, tractor feed, 1989. */
            dotMatrix(ctx, t, out, vol) {
                const dur = 0.85;
                const g = _doorEnv(ctx, out, t, vol, 0.01, dur - 0.05, 0.04);
                const gate = ctx.createOscillator(); const gg = ctx.createGain();
                gate.type = 'square'; gate.frequency.value = 47; gg.gain.value = vol * 0.5;
                gate.connect(gg).connect(g.gain); gate.start(t); gate.stop(t + dur);
                _doorNoiseSrc(ctx, g, t, dur, { type: 'bandpass', f0: 3100, q: 2.2 });
                _doorOsc(ctx, g, 'square', 94, t, dur);
                const tr = t + dur + 0.03;
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, tr, vol * 0.7, 0.002, 0.02, 0.09), tr, 0.12, { type: 'lowpass', f0: 1200, q: 0.8 });
                _doorOsc(ctx, _doorEnv(ctx, out, tr, vol * 0.5, 0.002, 0.02, 0.1), 'sine', 140, tr, 0.13, { f1: 60, slide: 0.1 });
                return dur + 0.25;
            },
            /* Fax handshake: the answer tone, two short pips, then the
               modem-chirp negotiation nobody has ever wanted to hear. */
            fax(ctx, t, out, vol) {
                _doorOsc(ctx, _doorEnv(ctx, out, t, vol * 0.8, 0.01, 0.42, 0.04), 'sine', 2100, t, 0.48);
                for (let i = 0; i < 2; i++) {
                    const tp = t + 0.6 + i * 0.16;
                    _doorOsc(ctx, _doorEnv(ctx, out, tp, vol * 0.7, 0.005, 0.08, 0.03), 'sine', 1100, tp, 0.12);
                }
                const tc = t + 1.0;
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, tc, vol * 0.55, 0.02, 0.5, 0.08), tc, 0.6, { type: 'bandpass', f0: 700, f1: 2600, slide: 0.55, q: 6 });
                _doorOsc(ctx, _doorEnv(ctx, out, tc, vol * 0.3, 0.02, 0.5, 0.06), 'square', 1650, tc, 0.6, { f1: 2250, slide: 0.55 });
                return 1.7;
            },
            /* PA chime: bing – bong – bing, soft mallet, the ceiling speaker
               in a facility that is round for a reason. */
            paChime(ctx, t, out, vol) {
                const notes = [784, 659, 523];
                notes.forEach((f, i) => {
                    const tn = t + i * 0.34;
                    _doorOsc(ctx, _doorEnv(ctx, out, tn, vol * 0.7, 0.012, 0.12, 0.7), 'sine', f, tn, 0.85);
                    _doorOsc(ctx, _doorEnv(ctx, out, tn, vol * 0.22, 0.012, 0.08, 0.5), 'sine', f * 2.01, tn, 0.6);
                    _doorOsc(ctx, _doorEnv(ctx, out, tn, vol * 0.12, 0.012, 0.05, 0.35), 'triangle', f * 3, tn, 0.42);
                });
                return 1.6;
            },
            /* Doorbell (HQ plan 3.3, Code Red): a two-tone household ding-dong
               — E5 then C5, bar-chime partials — rung twice, the second time
               a little harder and a little flat, by someone who should not
               be on that side of the door. */
            doorbell(ctx, t, out, vol) {
                const ring = (t0, gain, cents) => {
                    [[659.25, 0], [523.25, 0.42]].forEach(([f, dt]) => {
                        const tn = t0 + dt, det = { detune: cents };
                        _doorOsc(ctx, _doorEnv(ctx, out, tn, gain * 0.75, 0.004, 0.16, 1.15), 'sine', f, tn, 1.35, det);
                        _doorOsc(ctx, _doorEnv(ctx, out, tn, gain * 0.28, 0.004, 0.10, 0.75), 'sine', f * 2.76, tn, 0.9, det);
                        _doorOsc(ctx, _doorEnv(ctx, out, tn, gain * 0.14, 0.004, 0.06, 0.45), 'triangle', f * 5.4, tn, 0.55, det);
                        _doorNoiseSrc(ctx, _doorEnv(ctx, out, tn, gain * 0.22, 0.001, 0.01, 0.03), tn, 0.05, { type: 'bandpass', f0: f * 4, q: 3 });
                    });
                };
                ring(t, vol, 0);
                ring(t + 1.25, vol * 1.15, -18);
                return 3.0;
            },
            /* Security door: a long mains buzz through the strike plate, then
               the lock bolt releasing. */
            doorBuzz(ctx, t, out, vol) {
                const lp = ctx.createBiquadFilter();
                lp.type = 'lowpass'; lp.frequency.value = 820; lp.Q.value = 1.5; lp.connect(out);
                const g = _doorEnv(ctx, lp, t, vol, 0.01, 0.62, 0.05);
                _doorOsc(ctx, g, 'square', 60, t, 0.7);
                _doorOsc(ctx, g, 'sawtooth', 120, t, 0.7, { detune: 9 });
                _doorOsc(ctx, g, 'square', 180, t, 0.7, { detune: -7 });
                const tk = t + 0.7;
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, tk, vol * 0.6, 0.001, 0.015, 0.06), tk, 0.08, { type: 'bandpass', f0: 1700, q: 1 });
                _doorOsc(ctx, _doorEnv(ctx, out, tk, vol * 0.45, 0.001, 0.015, 0.08), 'sine', 220, tk, 0.1, { f1: 90, slide: 0.08 });
                return 0.9;
            },
            /* Ident sting (placeholder for the hand-made jingle): CRT on, then a
               DX7-style detuned-saw chord with a filter sweep, a bell arpeggio,
               a lift to the IV chord, and a tape stop that matches the visual
               tape-stop out of the ident overlay. ~3.6 s. */
            identSting(ctx, t, out, vol) {
                _DOOR_SFX_RECIPES.crtOn(ctx, t, out, vol * 0.8);
                const master = ctx.createGain();
                master.gain.setValueAtTime(1, t);
                master.connect(out);
                const lp = ctx.createBiquadFilter();
                lp.type = 'lowpass'; lp.Q.value = 4;
                lp.frequency.setValueAtTime(260, t + 0.3);
                lp.frequency.exponentialRampToValueAtTime(4200, t + 1.5);
                lp.frequency.exponentialRampToValueAtTime(1400, t + 3.1);
                lp.connect(master);
                const oscs = [];
                const chord = (freqs, t0, dur, g) => {
                    const env = _doorEnv(ctx, lp, t0, g, 0.06, dur - 0.3, 0.3);
                    freqs.forEach(f => {
                        [-7, 0, 7].forEach(d => oscs.push(_doorOsc(ctx, env, 'sawtooth', f, t0, dur + 0.5, { detune: d })));
                    });
                };
                chord([110, 164.81, 220, 277.18], t + 0.3, 1.35, vol * 0.22);      /* A  (A2 E3 A3 C#4) */
                chord([146.83, 185, 220, 293.66], t + 1.6, 1.75, vol * 0.22);       /* D  (D3 F#3 A3 D4) */
                [880, 1108.73, 1318.51, 1760].forEach((f, i) => {
                    const tb = t + 1.7 + i * 0.14;
                    const env = _doorEnv(ctx, master, tb, vol * 0.28, 0.004, 0.08, 0.9);
                    oscs.push(_doorOsc(ctx, env, 'sine', f, tb, 1.1));
                    oscs.push(_doorOsc(ctx, env, 'sine', f * 2, tb, 0.7, { detune: 4 }));
                });
                /* tape stop: every oscillator sags to a quarter of its pitch
                   while the master gain dies. The overlay's visual squish
                   starts at the same offset (styles-cinematic.css). */
                const ts = t + 3.15;
                oscs.forEach(o => {
                    try {
                        const f = o.frequency.value;
                        o.frequency.setValueAtTime(f, ts);
                        o.frequency.exponentialRampToValueAtTime(Math.max(1, f * 0.22), ts + 0.42);
                        o.stop(ts + 0.5);
                    } catch (e) {}
                });
                master.gain.setValueAtTime(1, ts);
                master.gain.exponentialRampToValueAtTime(0.0005, ts + 0.45);
                _doorStingHandle = { master, oscs, ctx };
                return 3.7;
            },
        };
        let _doorStingHandle = null;
        /* Kit entries whose synthesized placeholder is suppressed. */
        const _DOOR_SFX_SYNTH_MUTED = new Set(['doorBuzz', 'doorbell']);

        /* Play a DOOR kit sound. Returns true if something was scheduled. */
        function playDoorSfx(key, opts = {}) {
            try {
                if (state.devAutoSim) return false;
                if (!state.audioUnlocked && !opts.allowBeforeUnlock) return false;
                const fileKey = _DOOR_SFX_FILE_KEY[key];
                if (fileKey && sfxLibrary[fileKey]) return playSfx(fileKey, opts);
                /* Muted placeholders (2026-09-04): the synth door buzz/ring
                   were far too loud, so they stay silent until the user's own
                   recordings land. Adding the file to _R2_SFX under the
                   _DOOR_SFX_FILE_KEY name above brings them straight back —
                   the file branch runs before this check. */
                if (_DOOR_SFX_SYNTH_MUTED.has(key)) return false;
                const recipe = _DOOR_SFX_RECIPES[key];
                if (!recipe) return false;
                const ctx = _doorCtx();
                const vol = Math.max(0, Math.min(1, (_DOOR_SFX_GAIN[key] ?? 0.5) * (state.sfxVolume ?? 0.9) * (opts.volume ?? 1)));
                if (vol <= 0) return false;
                const schedule = () => {
                    const out = ctx.createGain();
                    out.gain.value = 1;
                    out.connect(ctx.destination);
                    const t = ctx.currentTime + (opts.delay || 0);
                    const secs = recipe(ctx, t, out, vol);
                    setTimeout(() => { try { out.disconnect(); } catch (e) {} }, ((opts.delay || 0) + secs + 0.6) * 1000);
                };
                if (ctx.state === 'running') { schedule(); return true; }
                /* Suspended: inside a gesture resume() settles within a few ms
                   and the sound still lands on cue; on a fresh page load with
                   no gesture it never settles and we simply stay silent.
                   opts.noLate (the ident sting) refuses to start late instead
                   of drifting out of sync with the overlay. */
                const started = performance.now();
                try {
                    ctx.resume().then(() => {
                        if (ctx.state !== 'running') return;
                        if (opts.noLate && performance.now() - started > 250) return;
                        schedule();
                    }).catch(() => {});
                } catch (e) {}
                return false;
            } catch (e) {
                return false;
            }
        }
        /* Cut the ident sting short (skip) with a quick tape stop. */
        function stopDoorIdentSting() {
            const h = _doorStingHandle;
            _doorStingHandle = null;
            if (!h) return;
            try {
                const ts = h.ctx.currentTime;
                h.master.gain.cancelScheduledValues(ts);
                h.master.gain.setValueAtTime(Math.max(0.0005, h.master.gain.value), ts);
                h.master.gain.exponentialRampToValueAtTime(0.0005, ts + 0.22);
                h.oscs.forEach(o => {
                    try {
                        const f = o.frequency.value;
                        o.frequency.cancelScheduledValues(ts);
                        o.frequency.setValueAtTime(f, ts);
                        o.frequency.exponentialRampToValueAtTime(Math.max(1, f * 0.3), ts + 0.22);
                        o.stop(ts + 0.26);
                    } catch (e) {}
                });
            } catch (e) {}
        }
        window.playDoorSfx = playDoorSfx;
        window.stopDoorIdentSting = stopDoorIdentSting;

        /* ── D.O.O.R. HQ room tone (DOOR_HQ_BUILD_PLAN Phase 1.5) ─────────
           A synthesized stand-in for the user's hall loop (§5.3 H): HVAC
           rumble (looped noise through a slowly wobbling low-pass), a 60 Hz
           mains hum with its second harmonic, and a faint ballast hiss. It
           rides the Ambience slider like the battle beds (state.ambienceVolume
           → applyAmbienceVolumeMix → _doorRoomToneApplyVol), needs the same
           audio unlock, and fades in/out over ~1.2 s. The `doorMuzak` MUSIC
           slot stays empty on purpose (map.js syncMusicToState plays it only
           once audioTracks.doorMuzak exists — a user-made track, MASTER B4).
           UPGRADE PATH: add `doorRoomTone` to _R2_AMBIENCE + the base-volume
           table and play that bed instead of this synth.
           Kill-switch: window.EW_DISABLE_AMBIENCE. */
        let _doorRoomTone = null;
        function _doorRoomToneVol() {
            return Math.max(0, Math.min(1, 0.5 * (state.ambienceVolume ?? 0.8)));
        }
        function _doorRoomToneApplyVol() {
            const h = _doorRoomTone;
            if (!h) return;
            try { h.master.gain.setTargetAtTime(_doorRoomToneVol(), h.ctx.currentTime, 0.25); } catch (e) {}
        }
        function startDoorRoomTone() {
            try {
                /* Muted 2026-09-04: the synthesized office bed (HVAC + mains
                   hum + ballast hiss) was far too loud. It stays off until the
                   user's own hall loop arrives — wire that up per the UPGRADE
                   PATH above (a `doorRoomTone` bed in _R2_AMBIENCE) and drop
                   this guard. stopDoorRoomTone stays safe to call meanwhile. */
                if (!window.EW_ENABLE_DOOR_ROOM_TONE) return false;
                if (window.EW_DISABLE_AMBIENCE || state.devAutoSim) return false;
                if (_doorRoomTone) { _doorRoomToneApplyVol(); return true; }
                if (!state.audioUnlocked) return false;
                const ctx = _doorCtx();
                const build = () => {
                    if (_doorRoomTone || ctx.state !== 'running') return;
                    const t = ctx.currentTime;
                    const master = ctx.createGain();
                    master.gain.setValueAtTime(0.0001, t);
                    master.gain.exponentialRampToValueAtTime(Math.max(0.0002, _doorRoomToneVol()), t + 1.2);
                    master.connect(ctx.destination);
                    const nodes = [];
                    /* HVAC: looped noise → low-pass ~140 Hz, wobbling ±40 Hz every ~9 s */
                    const hv = ctx.createBufferSource(); hv.buffer = _doorNoise(ctx); hv.loop = true;
                    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 140; lp.Q.value = 0.9;
                    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.11;
                    const lfoG = ctx.createGain(); lfoG.gain.value = 40;
                    lfo.connect(lfoG); lfoG.connect(lp.frequency);
                    const hvG = ctx.createGain(); hvG.gain.value = 0.9;
                    hv.connect(lp); lp.connect(hvG); hvG.connect(master);
                    hv.start(t); lfo.start(t); nodes.push(hv, lfo);
                    /* mains hum: 60 Hz + 120 Hz, very quiet, a touch of beating */
                    [[60, 0.05, 0], [120, 0.028, 0.6], [180, 0.01, -0.4]].forEach(([f, g, det]) => {
                        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.detune.value = det;
                        const og = ctx.createGain(); og.gain.value = g;
                        o.connect(og); og.connect(master); o.start(t); nodes.push(o);
                    });
                    /* ballast hiss: band-passed noise up high, barely there */
                    const hs = ctx.createBufferSource(); hs.buffer = _doorNoise(ctx); hs.loop = true;
                    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 7800; bp.Q.value = 2.2;
                    const hsG = ctx.createGain(); hsG.gain.value = 0.035;
                    hs.connect(bp); bp.connect(hsG); hsG.connect(master); hs.start(t); nodes.push(hs);
                    _doorRoomTone = { ctx, master, nodes };
                };
                if (ctx.state === 'running') { build(); return true; }
                try { ctx.resume().then(build).catch(() => {}); } catch (e) {}
                return false;
            } catch (e) { return false; }
        }
        function stopDoorRoomTone() {
            const h = _doorRoomTone;
            _doorRoomTone = null;
            if (!h) return;
            try {
                const ts = h.ctx.currentTime;
                h.master.gain.cancelScheduledValues(ts);
                h.master.gain.setValueAtTime(Math.max(0.0002, h.master.gain.value), ts);
                h.master.gain.exponentialRampToValueAtTime(0.0002, ts + 1.0);
                setTimeout(() => {
                    h.nodes.forEach(n => { try { n.stop(); } catch (e) {} });
                    try { h.master.disconnect(); } catch (e) {}
                }, 1250);
            } catch (e) {}
        }
        window.startDoorRoomTone = startDoorRoomTone;
        window.stopDoorRoomTone = stopDoorRoomTone;
        /* Console audition: window.doorSfxAudition() plays the whole kit in order. */
        window.doorSfxAudition = function() {
            const keys = Object.keys(_DOOR_SFX_RECIPES);
            let delay = 0;
            keys.forEach(k => {
                setTimeout(() => { console.log('[DOOR SFX]', k); playDoorSfx(k, { allowBeforeUnlock: true }); }, delay * 1000);
                delay += (k === 'identSting') ? 4.2 : 2.0;
            });
        };
