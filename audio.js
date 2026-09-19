        const _R2_BASE = 'https://cdn.entropywars.net/Assets';
        const _R2_MUSIC = {
            titleTheme:      `${_R2_BASE}/music/ff7.ogg`,
            mainTheme:       `${_R2_BASE}/music/maintheme_v2.mp3`,
            doorLobby:       `${_R2_BASE}/music/door_lobby.mp3`,   // D.O.O.R. HQ: the main hall (user track, 2026-09-15)
            doorLobby2:      `${_R2_BASE}/music/door%20hq%202.mp3`,  // D.O.O.R. HQ rotation (user track, 2026-09-16)
            doorLobby3:      `${_R2_BASE}/music/door%20hq%203.mp3`,  // D.O.O.R. HQ rotation (user track, 2026-09-16)
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
            doorLobby: './assets/music/door_lobby.mp3',
            doorLobby2: './assets/music/door hq 2.mp3',
            doorLobby3: './assets/music/door hq 3.mp3',
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
            doorLobby: 0.42,
            doorLobby2: 0.42,
            doorLobby3: 0.42,
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
            uiConfirm:       `${_R2_BASE}/SFX/ui_confirm_mobile.mp3`,
            uiCursorMove:    `${_R2_BASE}/SFX/ui_cursormove_mobile.mp3`,
            uiCursorFocus:   `${_R2_BASE}/SFX/ui_cursorfocus_mobile.mp3`,
            uiButtonConfirm: `${_R2_BASE}/SFX/ui_buttonconfirm_mobile.mp3`,
            uiError:         `${_R2_BASE}/SFX/ui_error_mobile.mp3`,
            /* uiBack/arrowShot reuse existing clips until dedicated
               ui_back.ogg / arrow_shot.ogg are uploaded to R2 — swap the
               paths then. */
            uiBack:          `${_R2_BASE}/SFX/ui_cursormove_mobile.mp3`,
            arrowShot:       `${_R2_BASE}/SFX/item_throw_mobile.mp3`,
            fireball:        `${_R2_BASE}/SFX/fireball_mobile.mp3`,
            healRegen:       `${_R2_BASE}/SFX/heal_regen_mobile.mp3`,
            manaRegen:       `${_R2_BASE}/SFX/mana_regen_mobile.mp3`,
            moveStep:        `${_R2_BASE}/SFX/move_step_v2_mobile.mp3`,
            playerHourglass: `${_R2_BASE}/SFX/player_hourglass_obtained_mobile.mp3`,
            enemyHourglass:  `${_R2_BASE}/SFX/enemy_hourglass_obtained_mobile.mp3`,
            death:           `${_R2_BASE}/SFX/death_mobile.mp3`,
            levelUp:         `${_R2_BASE}/SFX/level_up_mobile.mp3`,
            newRound:        `${_R2_BASE}/SFX/new_round_mobile.mp3`,
            damage:          `${_R2_BASE}/SFX/damage_mobile.mp3`,
            debuff:          `${_R2_BASE}/SFX/debuff_mobile.mp3`,
            buff:            `${_R2_BASE}/SFX/buff_mobile.mp3`,
            nexusCaptured:   `${_R2_BASE}/SFX/nexus_captured_mobile.mp3`,
            physicalAttack:  `${_R2_BASE}/SFX/physical_attack_mobile.mp3`,
            basicAttack:     `${_R2_BASE}/SFX/basic_attack_mobile.mp3`,
            physicalAbility: `${_R2_BASE}/SFX/physical_ability_mobile.mp3`,
            teleport:        `${_R2_BASE}/SFX/teleport_mobile.mp3`,
            spellDamage:     `${_R2_BASE}/SFX/spell_damage_mobile.mp3`,
            itemThrow:       `${_R2_BASE}/SFX/item_throw_mobile.mp3`,
            poisonDamage:    `${_R2_BASE}/SFX/poison_damage_mobile.mp3`,
            burningDamage:   `${_R2_BASE}/SFX/burning_damage_mobile.mp3`,
            drowningDamage:  `${_R2_BASE}/SFX/drowning_damage_mobile.mp3`,
            dodge:           `${_R2_BASE}/SFX/dodge_mobile.mp3`,
            physicalAbilityDamage: `${_R2_BASE}/SFX/physical_ability_damage_mobile.mp3`,
            block:           `${_R2_BASE}/SFX/block_mobile.mp3`,
            gun:             `${_R2_BASE}/SFX/gun_mobile.mp3`,
            doubleShot:      `${_R2_BASE}/SFX/double_shot_mobile.mp3`,
            shootout:        `${_R2_BASE}/SFX/shootout_mobile.mp3`,
            turret:          `${_R2_BASE}/SFX/turret_mobile.mp3`,
            jetFlyover:      `${_R2_BASE}/SFX/jet_flyover_mobile.mp3`,
            nukeAlarm:       `${_R2_BASE}/SFX/nuke_alarm_mobile.mp3`,
            explosion:       `${_R2_BASE}/SFX/explosion_mobile.mp3`,
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

        /* ═══════════════════════════════════════════════════════════════════
           THE PLAYLIST — SONGS WEAR TAGS, PLACES ASK FOR TAGS (2026-09-16)
           The old rule was three hard-wired songs (ff7 on the title, the main
           theme everywhere else, door_lobby in the hall) and one battle list.
           Now every song carries a SET of tags (as many as fit it) in FIVE
           dimensions — the way a AAA music pipeline (Wwise / FMOD "music
           switch containers" driven by game states) tags its cues — and every
           PLACE the game can be in is a CONTEXT that asks for tags:
             · ROLE     where the song may play (title · menu · lobby · hq ·
                        exploration · battle · boss · victory · defeat)
             · MOOD     the feeling (calm · tense · dark · horror · upbeat ·
                        epic · melancholy · playful · mysterious · sacred)
             · ENERGY   the intensity tier (low · mid · high)
             · STYLE    the palette (orchestral · electronic · retro · rock ·
                        ambient · jazz · hiphop · vocal)
             · SETTING  the world it fits (urban · space · sea · nature ·
                        sacred · cyber · fantasy · facility · horror_house)
           A CONTEXT = { any: [role tags — one is enough], prefer: [mood tags a
           place asks for], not: [tags that disqualify], fallback: ctx }. The
           pool is every song with one of `any` and none of `not`; when the
           place hands MOODS (a map's `env.music`, a site's row in
           MUSIC_SITE_MOODS) the songs that also wear one of them are taken
           FIRST and the rest only when fewer than MUSIC_MOOD_MIN answer. An
           empty pool falls back down the chain (…→ menu → mainTheme). Each
           pool has its own SHUFFLE BAG (every song once before any repeats,
           never the same song twice in a row), a pool of ONE song loops.
           Precedence for a song's tags: LOCAL dev override (localStorage
           `ew_music_tags`, what the 🏷 TAGS tab writes) → MUSIC_TAGS_SHIPPED
           (what every player gets — paste the tab's EXPORT over it). ONE
           read: MusicTags.get(key). Viewer-local, nothing on state, nothing
           relayed (RULE #2). Stingers (victory / defeat) are not pools.
           ═══════════════════════════════════════════════════════════════════ */
        const MUSIC_TAG_GROUPS = {
            role:    { label: 'ROLE',    color: 'rgba(124,77,255,0.55)',  tags: ['title', 'menu', 'lobby', 'hq', 'exploration', 'battle', 'boss', 'victory', 'defeat'] },
            mood:    { label: 'MOOD',    color: 'rgba(255,120,80,0.5)',   tags: ['calm', 'tense', 'dark', 'horror', 'upbeat', 'epic', 'melancholy', 'playful', 'mysterious', 'sacred'] },
            energy:  { label: 'ENERGY',  color: 'rgba(80,200,120,0.5)',   tags: ['low', 'mid', 'high'] },
            style:   { label: 'STYLE',   color: 'rgba(80,160,255,0.5)',   tags: ['orchestral', 'electronic', 'retro', 'rock', 'ambient', 'jazz', 'hiphop', 'vocal'] },
            setting: { label: 'SETTING', color: 'rgba(230,190,60,0.5)',   tags: ['urban', 'space', 'sea', 'nature', 'sacred_site', 'cyber', 'fantasy', 'facility', 'horror_house'] },
        };
        const MUSIC_TAG_ALL = Object.values(MUSIC_TAG_GROUPS).reduce((a, g) => a.concat(g.tags), []);
        /* THE SHIPPED TAGGING — the ROLE tags are the old behaviour verbatim
           (every battle alt = battle; the main theme = menu + battle; ff7 =
           title; the three door_hq tracks = lobby + hq). The MOOD / STYLE tags
           on the battle alts are Claude's guesses off the titles — retag them
           in the 🏷 TAGS tab and paste the export here. */
        const MUSIC_TAGS_SHIPPED = {
            titleTheme:       ['title', 'calm', 'low', 'orchestral'],
            mainTheme:        ['menu', 'battle', 'mid', 'electronic'],
            doorLobby:        ['lobby', 'hq', 'calm', 'low', 'ambient', 'facility'],
            doorLobby2:       ['lobby', 'hq', 'calm', 'low', 'ambient', 'facility'],
            doorLobby3:       ['lobby', 'hq', 'calm', 'low', 'ambient', 'facility'],
            battleTheme:      ['battle', 'epic', 'high', 'orchestral'],
            battleThemeAlt1:  ['battle', 'mid', 'electronic'],
            battleThemeAlt2:  ['battle', 'mid', 'electronic'],
            battleThemeAlt3:  ['battle', 'mid', 'electronic'],
            battleThemeAlt4:  ['battle', 'exploration', 'mysterious', 'mid'],
            battleThemeAlt5:  ['battle', 'exploration', 'calm', 'melancholy', 'low', 'retro'],
            battleThemeAlt6:  ['battle', 'exploration', 'playful', 'calm', 'low', 'retro'],
            battleThemeAlt7:  ['battle', 'exploration', 'upbeat', 'mid', 'retro'],
            battleThemeAlt8:  ['battle', 'upbeat', 'high', 'electronic', 'urban'],
            battleThemeAlt9:  ['battle', 'sacred', 'epic', 'mid', 'sacred_site'],
            battleThemeAlt10: ['battle', 'epic', 'high'],
            battleThemeAlt11: ['battle', 'dark', 'tense', 'mid', 'electronic', 'retro'],
            battleThemeAlt12: ['battle', 'horror', 'dark', 'mid', 'horror_house'],
            battleThemeAlt13: ['battle', 'mysterious', 'mid'],
            battleThemeAlt14: ['battle', 'high', 'rock'],
            battleThemeAlt15: ['battle', 'playful', 'mid'],
            battleThemeAlt16: ['battle', 'melancholy', 'low'],
            battleThemeAlt17: ['battle', 'playful', 'mid'],
            battleThemeAlt18: ['battle', 'melancholy', 'mid'],
            battleThemeAlt19: ['battle', 'playful', 'mid'],
            battleThemeAlt20: ['battle', 'tense', 'mid'],
            battleThemeAlt21: ['battle', 'mysterious', 'mid'],
            battleThemeAlt22: ['battle', 'upbeat', 'high', 'rock'],
            battleThemeAlt23: ['battle', 'playful', 'mid'],
            battleThemeAlt24: ['battle', 'tense', 'mysterious', 'mid'],
            battleThemeAlt25: ['battle', 'playful', 'mid'],
            battleThemeAlt26: ['battle', 'high', 'rock'],
            battleThemeAlt27: ['battle', 'upbeat', 'high'],
            battleThemeAlt28: ['battle', 'mid'],
            victory:          ['victory'],
            defeat:           ['defeat'],
        };
        /* THE CONTEXTS — where the game is. `any` = role tags (one is enough),
           `not` = disqualifiers, `fallback` = the next pool when this one is
           empty. map.js syncMusicToState resolves the place to one of these. */
        const MUSIC_CONTEXTS = {
            title:       { label: 'TITLE SCREEN',        sub: 'the first screen, before Enter',                    any: ['title'],                 fallback: 'menu' },
            menu:        { label: 'MENUS',               sub: 'the main menu, the hub pages, the forge, the shop', any: ['menu'],                  fallback: 'lobby' },
            lobby:       { label: 'HQ · THE HALL',       sub: 'the foyer, the main hall, the containment rings',   any: ['lobby'],                 fallback: 'hq' },
            hq:          { label: 'HQ · THE ROOMS',      sub: 'offices, wings, the floors, the elevator',          any: ['hq'],                    fallback: 'lobby' },
            exploration: { label: 'HQ · THE WILD ROOMS', sub: 'a site room, a complex part, the cave — the map\'s moods apply', any: ['exploration'], fallback: 'hq' },
            battle:      { label: 'BATTLE',              sub: 'every match — the map\'s moods apply',              any: ['battle'],                fallback: 'menu' },
            boss:        { label: 'BOSS',                sub: 'reserved: a Code Red / capstone fight',             any: ['boss'],                  fallback: 'battle' },
        };
        const MUSIC_MOOD_MIN = 2;   // a mood-matched pool this small is topped up with the rest of the role pool
        /* THE SITE MOODS — a map's flavour, keyed by its setting's `near` key
           (the one id that reaches both the battle (state.mapEnv.near) and the
           site room). A map may also carry `env.music: ['tag', …]` on its
           EW_MAP_META row; both are read. Only mood / setting tags belong here. */
        const MUSIC_SITE_MOODS = {
            haunted: ['horror', 'dark', 'horror_house'],
            hell: ['dark', 'horror', 'tense'],
            lodge: ['mysterious', 'dark'],
            revenge: ['dark', 'sea', 'tense'],
            bermuda: ['sea', 'mysterious'],
            atlantis: ['sea', 'mysterious'],
            derelict: ['space', 'tense', 'dark'],
            mars: ['space'], moon: ['space'], saturn: ['space'], singularity: ['space', 'mysterious'],
            heaven: ['sacred', 'calm', 'sacred_site'], vatican: ['sacred', 'sacred_site'], olympus: ['sacred', 'epic', 'sacred_site'],
            cyberpunk: ['cyber', 'electronic', 'urban'], strip: ['urban', 'upbeat'], downtown: ['urban'], stadium: ['urban', 'upbeat'],
            camelot: ['fantasy', 'epic'], agartha: ['fantasy', 'mysterious'], hollow_earth: ['fantasy', 'mysterious'],
            dumb: ['facility', 'tense'], cern: ['facility', 'electronic'], backrooms: ['horror', 'mysterious', 'facility'],
            lookingglass: ['playful', 'mysterious'],
        };
        const MUSIC_TAGS_LS = 'ew_music_tags';
        let _musicTagsLocal = null;        // { key: [tags] } — lazy-loaded from localStorage
        const _musicBags = {};             // pool id → the shuffle bag
        const _musicCtx = { id: null, moods: null };   // the CURRENT context (module-local — never on state)
        function _musicNormTags(list) {
            const out = [];
            (Array.isArray(list) ? list : []).forEach(t => { t = String(t).trim().toLowerCase(); if (MUSIC_TAG_ALL.includes(t) && !out.includes(t)) out.push(t); });
            return out;
        }
        function _musicTagsLoadLocal() {
            if (_musicTagsLocal) return _musicTagsLocal;
            _musicTagsLocal = {};
            try {
                const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem(MUSIC_TAGS_LS) : null;
                if (raw) {
                    const o = JSON.parse(raw);
                    if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => { if (_R2_MUSIC[k] && Array.isArray(v)) _musicTagsLocal[k] = _musicNormTags(v); });
                }
            } catch (e) {}
            return _musicTagsLocal;
        }
        function _musicTagsSaveLocal() {
            try {
                const o = _musicTagsLoadLocal();
                if (typeof localStorage === 'undefined') return;
                if (Object.keys(o).length) localStorage.setItem(MUSIC_TAGS_LS, JSON.stringify(o));
                else localStorage.removeItem(MUSIC_TAGS_LS);
            } catch (e) {}
        }
        function _musicTagsOf(key) {
            const loc = _musicTagsLoadLocal();
            if (Object.prototype.hasOwnProperty.call(loc, key)) return loc[key];
            return _musicNormTags(MUSIC_TAGS_SHIPPED[key]);
        }
        function _musicPoolId(ctx, moods) {
            const m = _musicNormTags(moods);
            return m.length ? ctx + '|' + m.slice().sort().join(',') : ctx;
        }
        /* the pool: the songs a context's role tags admit, mood-matched first */
        function _musicPool(ctx, moods, _depth) {
            const c = MUSIC_CONTEXTS[ctx];
            if (!c) return [];
            const keys = Object.keys(_R2_MUSIC).filter(k => k !== 'victory' && k !== 'defeat' && audioTracks[k]);
            let pool = keys.filter(k => {
                const tags = _musicTagsOf(k);
                return c.any.some(t => tags.includes(t)) && !(c.not || []).some(t => tags.includes(t));
            });
            const m = _musicNormTags(moods);
            if (m.length && pool.length) {
                const matched = pool.filter(k => { const tags = _musicTagsOf(k); return m.some(t => tags.includes(t)); });
                if (matched.length >= MUSIC_MOOD_MIN) pool = matched;
                else if (matched.length) pool = matched.concat(pool.filter(k => !matched.includes(k)));
            }
            if (!pool.length && c.fallback && (_depth || 0) < 8) return _musicPool(c.fallback, moods, (_depth || 0) + 1);
            if (!pool.length && audioTracks.mainTheme) return ['mainTheme'];
            return pool;
        }
        function _musicBagReset(ctx) {
            Object.keys(_musicBags).forEach(id => { if (id === ctx || id.startsWith(ctx + '|')) delete _musicBags[id]; });
        }
        /* one draw from the pool's shuffle bag: every song once before a repeat, never the excluded (playing) one twice in a row */
        function _musicDraw(ctx, moods, exclude) {
            const pool = _musicPool(ctx, moods);
            if (!pool.length) return null;
            if (pool.length === 1) return pool[0];
            const id = _musicPoolId(ctx, moods);
            let bag = _musicBags[id];
            const same = bag && bag.pool && bag.pool.join(',') === pool.join(',');
            if (!bag || !same || !bag.left.length) {
                const left = pool.slice();
                for (let i = left.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [left[i], left[j]] = [left[j], left[i]]; }
                bag = _musicBags[id] = { pool: pool.slice(), left };
            }
            const ex = (exclude || []).filter(Boolean);
            if (bag.left.length > 1 && ex.includes(bag.left[0])) {
                let swapIdx = bag.left.findIndex(k => !ex.includes(k));
                if (swapIdx < 0) swapIdx = 1 + Math.floor(Math.random() * (bag.left.length - 1));
                [bag.left[0], bag.left[swapIdx]] = [bag.left[swapIdx], bag.left[0]];
            } else if (bag.left.length === 1 && ex.includes(bag.left[0]) && pool.length > 1) {
                /* the last song in the bag is the one playing: refill and take another */
                bag.left = pool.filter(k => !ex.includes(k));
                for (let i = bag.left.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag.left[i], bag.left[j]] = [bag.left[j], bag.left[i]]; }
            }
            return bag.left.shift();
        }
        /* a song loops only when its context's pool is that one song (or the player pinned 🔁 in the pause menu) */
        function _musicApplyLoop(trackKey) {
            const t = audioTracks[trackKey];
            if (!t) return;
            if (t._pinnedLoop) { t.loop = true; return; }
            const pool = _musicCtx.id ? _musicPool(_musicCtx.id, _musicCtx.moods) : [];
            t.loop = pool.length <= 1 || !pool.includes(trackKey);
        }
        function _musicBattleMoods() {
            const out = [];
            try {
                const env = state.mapEnv;
                if (env && Array.isArray(env.music)) out.push(...env.music);
                if (env && typeof env.near === 'string' && MUSIC_SITE_MOODS[env.near]) out.push(...MUSIC_SITE_MOODS[env.near]);
            } catch (e) {}
            return out.length ? out : null;
        }
        /* THE ONE ENTRY for a place: keep the song when it still fits the pool and
           is playing, else draw. Returns the playMusic promise. */
        async function playContextMusic(ctx, opts = {}) {
            if (!MUSIC_CONTEXTS[ctx]) ctx = 'menu';
            const moods = opts.moods === undefined ? (ctx === 'battle' ? _musicBattleMoods() : null) : opts.moods;
            const changed = _musicCtx.id !== ctx || _musicPoolId(ctx, moods) !== _musicPoolId(_musicCtx.id, _musicCtx.moods);
            _musicCtx.id = ctx;
            _musicCtx.moods = moods;
            const pool = _musicPool(ctx, moods);
            const cur = state.currentMusic;
            const curTrack = cur ? audioTracks[cur] : null;
            if (cur && curTrack && pool.includes(cur) && !curTrack.paused && !opts.force) {
                _musicApplyLoop(cur);
                return playMusic(cur);
            }
            if (cur && curTrack && pool.includes(cur) && !changed && !opts.force) return playMusic(cur);
            const next = _musicDraw(ctx, moods, [cur]);
            if (!next) return false;
            if (ctx === 'battle') { state.currentBattleTrackKey = next; state.lastBattleTrackKey = next; }
            return playMusic(next);
        }
        /* ⏭ anywhere: the next song of the CURRENT context (the fix for "no way to change the song") */
        async function skipTrack() {
            if (state.winner || !state.audioUnlocked) return false;
            const ctx = _musicCtx.id || 'menu';
            const next = _musicDraw(ctx, _musicCtx.moods, [state.currentMusic, state.currentBattleTrackKey]);
            if (!next) return false;
            if (ctx === 'battle') { state.currentBattleTrackKey = next; state.lastBattleTrackKey = next; }
            return playMusic(next);
        }
        const MusicTags = {
            groups: MUSIC_TAG_GROUPS,
            all: MUSIC_TAG_ALL,
            contexts: MUSIC_CONTEXTS,
            siteMoods: MUSIC_SITE_MOODS,
            get(key) { return _musicTagsOf(key).slice(); },
            has(key, tag) { return _musicTagsOf(key).includes(tag); },
            shipped(key) { return _musicNormTags(MUSIC_TAGS_SHIPPED[key]); },
            isLocal(key) { return Object.prototype.hasOwnProperty.call(_musicTagsLoadLocal(), key); },
            groupOf(tag) { return Object.keys(MUSIC_TAG_GROUPS).find(g => MUSIC_TAG_GROUPS[g].tags.includes(tag)) || null; },
            /* set the whole tag set of a song (any number of tags, any mix of groups) */
            set(key, tags) {
                if (!_R2_MUSIC[key]) return false;
                _musicTagsLoadLocal()[key] = _musicNormTags(tags);
                _musicTagsSaveLocal();
                Object.keys(_musicBags).forEach(id => delete _musicBags[id]);
                if (state.currentMusic) _musicApplyLoop(state.currentMusic);
                return true;
            },
            toggle(key, tag) {
                if (!MUSIC_TAG_ALL.includes(tag)) return false;
                const cur = _musicTagsOf(key).slice();
                const i = cur.indexOf(tag);
                if (i >= 0) cur.splice(i, 1); else cur.push(tag);
                return MusicTags.set(key, cur);
            },
            reset(key) {
                const o = _musicTagsLoadLocal();
                if (key) delete o[key]; else Object.keys(o).forEach(k => delete o[k]);
                _musicTagsSaveLocal();
                Object.keys(_musicBags).forEach(id => delete _musicBags[id]);
                if (state.currentMusic) _musicApplyLoop(state.currentMusic);
            },
            /* the songs a context admits (mood-matched first), and the current context */
            pool(ctx, moods) { return _musicPool(ctx, moods); },
            draw(ctx, moods, exclude) { return _musicDraw(ctx, moods, exclude); },
            current() { return { id: _musicCtx.id, moods: _musicCtx.moods ? _musicCtx.moods.slice() : null, pool: _musicCtx.id ? _musicPool(_musicCtx.id, _musicCtx.moods) : [] }; },
            /* every song whose tags differ from the shipped table */
            overrides() {
                const out = {};
                Object.keys(_R2_MUSIC).forEach(k => {
                    const a = _musicTagsOf(k).slice().sort().join(','), b = _musicNormTags(MUSIC_TAGS_SHIPPED[k]).slice().sort().join(',');
                    if (a !== b) out[k] = _musicTagsOf(k).slice();
                });
                return out;
            },
            exportJson() { return JSON.stringify(MusicTags.overrides(), null, 2); },
            /* the full table with the local tagging folded in — paste over MUSIC_TAGS_SHIPPED */
            exportJs() {
                const lines = ['{'];
                Object.keys(_R2_MUSIC).forEach(k => { lines.push(`    ${k}: ${JSON.stringify(_musicTagsOf(k)).replace(/","/g, '", "')},`); });
                lines.push('}');
                return lines.join('\n');
            },
            importJson(text) {
                let o;
                try { o = typeof text === 'string' ? JSON.parse(text) : text; } catch (e) { return { ok: false, error: 'not JSON', count: 0 }; }
                if (!o || typeof o !== 'object') return { ok: false, error: 'not an object', count: 0 };
                const src = (o.tags && typeof o.tags === 'object' && !Array.isArray(o.tags)) ? o.tags : o;
                let n = 0;
                const loc = _musicTagsLoadLocal();
                Object.entries(src).forEach(([k, v]) => { if (_R2_MUSIC[k] && Array.isArray(v)) { loc[k] = _musicNormTags(v); n++; } });
                _musicTagsSaveLocal();
                Object.keys(_musicBags).forEach(id => delete _musicBags[id]);
                return { ok: true, count: n };
            },
            _lsKey: MUSIC_TAGS_LS,
        };
        window.MusicTags = MusicTags;
        window.MUSIC_TAGS_SHIPPED = MUSIC_TAGS_SHIPPED;
        /* stamp the context without changing the song (a battle keeps the song
           it pre-warmed at startMatch; the advance / ⏭ then draw from its pool) */
        function setMusicContext(ctx, moods) {
            if (!MUSIC_CONTEXTS[ctx]) return false;
            _musicCtx.id = ctx;
            _musicCtx.moods = moods === undefined ? (ctx === 'battle' ? _musicBattleMoods() : null) : moods;
            if (state.currentMusic) _musicApplyLoop(state.currentMusic);
            return true;
        }
        window.setMusicContext = setMusicContext;
        window.playContextMusic = playContextMusic;
        window.skipTrack = skipTrack;
        window.musicContext = () => MusicTags.current();
        /* the legacy name the warm-up / old callers read: every battle-tagged song */
        function battleMusicKeysNow() { return _musicPool('battle', null); }

        const MUSIC_CROSSFADE_MS = 1800;
        const BATTLE_CROSSFADE_MS = 8000;
        const STINGER_FADE_OUT_MS = 350;
        let audioFadeVersion = 0;

        /* ═══════════════════════════════════════════════════════════════════
           THE MIXER — per-track / per-cue MASTER LEVELS (dev tool, 2026-09-16)
           The songs and the cues were not mastered at one loudness, so every
           key in the four base tables above (AUDIO_BASE_VOLUMES · SFX_BASE_
           VOLUMES · AMBIENCE_BASE_VOLUMES · _DOOR_SFX_GAIN) can be re-levelled
           without touching the table. ONE read: _mixLevel(channel, key, base)
           = the LOCAL dev override (localStorage `ew_audio_mix`, what the
           mixer panel writes) → else AUDIO_MIX_SHIPPED (the level shipped to
           everyone) → else the table. The panel (AudioMixer.open(); Settings →
           Audio → 🎚 MIXER, and the pause menu's Music tab) auditions any key,
           slides its level 0–150 % of full scale, and EXPORTS:
             · JSON  = the override object — paste it over AUDIO_MIX_SHIPPED
                       below and every player gets the mix (the shipped path);
             · JS    = the four base tables rewritten with the mix folded in
                       (for baking it into the tables themselves).
           IMPORT takes either JSON back. The level is an ABSOLUTE base (the
           fraction of the file's own loudness), never a multiplier, so an
           exported number reads exactly like the table it replaces. Viewer-
           local, nothing on state, nothing relayed (RULE #2).
           ═══════════════════════════════════════════════════════════════════ */
        const AUDIO_MIX_SHIPPED = {
            music: {},
            sfx: {},
            ambience: {},
            door: {},
        };
        const AUDIO_MIX_CHANNELS = ['music', 'sfx', 'ambience', 'door'];
        const AUDIO_MIX_MAX = 1.5;   // a quiet file may need lifting past the table's 1.0 (the slider's ceiling; the play-time clamp to 1 still applies)
        const AUDIO_MIX_LS = 'ew_audio_mix';
        let _mixLocal = null;        // { music: {key: level}, ... } — lazy-loaded from localStorage
        const _mixAudition = { ambience: null, timer: 0 };
        function _mixLoadLocal() {
            if (_mixLocal) return _mixLocal;
            _mixLocal = { music: {}, sfx: {}, ambience: {}, door: {} };
            try {
                const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem(AUDIO_MIX_LS) : null;
                if (raw) {
                    const o = JSON.parse(raw);
                    AUDIO_MIX_CHANNELS.forEach(ch => {
                        if (o && o[ch] && typeof o[ch] === 'object') Object.entries(o[ch]).forEach(([k, v]) => {
                            const n = Number(v);
                            if (Number.isFinite(n)) _mixLocal[ch][k] = Math.max(0, Math.min(AUDIO_MIX_MAX, n));
                        });
                    });
                }
            } catch (e) {}
            return _mixLocal;
        }
        function _mixSaveLocal() {
            try {
                const o = _mixLoadLocal();
                const any = AUDIO_MIX_CHANNELS.some(ch => Object.keys(o[ch]).length);
                if (typeof localStorage === 'undefined') return;
                if (any) localStorage.setItem(AUDIO_MIX_LS, JSON.stringify(o));
                else localStorage.removeItem(AUDIO_MIX_LS);
            } catch (e) {}
        }
        function _mixLevel(channel, key, base) {
            const loc = _mixLoadLocal()[channel];
            if (loc && Object.prototype.hasOwnProperty.call(loc, key)) return loc[key];
            const sh = AUDIO_MIX_SHIPPED[channel];
            if (sh && Number.isFinite(sh[key])) return Math.max(0, Math.min(AUDIO_MIX_MAX, sh[key]));
            return base;
        }
        function _mixTable(channel) {
            return channel === 'music' ? AUDIO_BASE_VOLUMES
                : channel === 'sfx' ? SFX_BASE_VOLUMES
                : channel === 'ambience' ? AMBIENCE_BASE_VOLUMES
                : channel === 'door' ? _DOOR_SFX_GAIN : null;
        }
        function _mixDefault(channel, key) {
            const t = _mixTable(channel);
            const v = t ? t[key] : undefined;
            if (Number.isFinite(v)) return v;
            return channel === 'music' ? 0.55 : channel === 'sfx' ? 0.7 : channel === 'ambience' ? 0.3 : 0.5;
        }
        function _mixKeys(channel) {
            if (channel === 'music') return Object.keys(_R2_MUSIC);
            if (channel === 'sfx') return Object.keys(sfxLibrary);
            if (channel === 'ambience') return Object.keys(_R2_AMBIENCE);
            if (channel === 'door') return Object.keys(_DOOR_SFX_GAIN);
            if (channel === 'tags') return Object.keys(_R2_MUSIC).filter(k => k !== 'victory' && k !== 'defeat');
            return [];
        }
        function _mixApplyLive(channel) {
            try {
                if (channel === 'music') applyMusicVolumeMix();
                else if (channel === 'ambience') applyAmbienceVolumeMix();
            } catch (e) {}
        }
        function _mixRound(v) { return Math.round(v * 1000) / 1000; }
        const AudioMixer = {
            channels: AUDIO_MIX_CHANNELS,
            keys: _mixKeys,
            /* the effective level (local → shipped → table), the shipped one and the table's own */
            get(channel, key) { return _mixLevel(channel, key, _mixDefault(channel, key)); },
            shipped(channel, key) { const sh = AUDIO_MIX_SHIPPED[channel]; return (sh && Number.isFinite(sh[key])) ? sh[key] : _mixDefault(channel, key); },
            base(channel, key) { return _mixDefault(channel, key); },
            isLocal(channel, key) { const loc = _mixLoadLocal()[channel]; return !!loc && Object.prototype.hasOwnProperty.call(loc, key); },
            set(channel, key, level) {
                if (!AUDIO_MIX_CHANNELS.includes(channel)) return false;
                const n = Number(level);
                if (!Number.isFinite(n)) return false;
                _mixLoadLocal()[channel][key] = _mixRound(Math.max(0, Math.min(AUDIO_MIX_MAX, n)));
                _mixSaveLocal();
                _mixApplyLive(channel);
                return true;
            },
            reset(channel, key) {
                const o = _mixLoadLocal();
                if (channel && key) delete o[channel][key];
                else if (channel) o[channel] = {};
                else AUDIO_MIX_CHANNELS.forEach(ch => { o[ch] = {}; });
                _mixSaveLocal();
                AUDIO_MIX_CHANNELS.forEach(_mixApplyLive);
            },
            /* the override object: every key whose effective level differs from the TABLE (so a shipped
               value that is still wanted survives a re-export) */
            overrides() {
                const out = {};
                AUDIO_MIX_CHANNELS.forEach(ch => {
                    out[ch] = {};
                    _mixKeys(ch).forEach(k => {
                        const v = _mixRound(AudioMixer.get(ch, k));
                        if (Math.abs(v - _mixDefault(ch, k)) > 0.0005) out[ch][k] = v;
                    });
                });
                return out;
            },
            /* the levels AND the tagging (a `tags` member: every song whose tags differ from MUSIC_TAGS_SHIPPED) */
            exportJson() { const o = AudioMixer.overrides(); const t = MusicTags.overrides(); if (Object.keys(t).length) o.tags = t; return JSON.stringify(o, null, 2); },
            /* the four tables with the mix folded in — paste over the literals in audio.js */
            exportJs() {
                const stamp = new Date().toISOString().slice(0, 10);
                const names = { music: 'AUDIO_BASE_VOLUMES', sfx: 'SFX_BASE_VOLUMES', ambience: 'AMBIENCE_BASE_VOLUMES', door: '_DOOR_SFX_GAIN' };
                const lines = [`/* ENTROPY WARS AUDIO MIX — exported from the mixer ${stamp} */`];
                AUDIO_MIX_CHANNELS.forEach(ch => {
                    lines.push(`const ${names[ch]} = {`);
                    _mixKeys(ch).forEach(k => { lines.push(`    ${k}: ${_mixRound(AudioMixer.get(ch, k))},`); });
                    lines.push('};');
                });
                lines.push('/* — or paste this over AUDIO_MIX_SHIPPED in audio.js: */');
                lines.push('const AUDIO_MIX_SHIPPED = ' + JSON.stringify(AudioMixer.overrides(), null, 2) + ';');
                lines.push('/* THE TAGGING — paste over MUSIC_TAGS_SHIPPED in audio.js: */');
                lines.push('const MUSIC_TAGS_SHIPPED = ' + MusicTags.exportJs() + ';');
                return lines.join('\n');
            },
            /* JSON in (the override object, or a full { music, sfx, ambience, door } table set) */
            importJson(text) {
                let o;
                try { o = typeof text === 'string' ? JSON.parse(text) : text; } catch (e) { return { ok: false, error: 'not JSON' }; }
                if (!o || typeof o !== 'object') return { ok: false, error: 'not an object' };
                let n = 0;
                if (o.tags && typeof o.tags === 'object') n += MusicTags.importJson(o.tags).count;
                const loc = _mixLoadLocal();
                AUDIO_MIX_CHANNELS.forEach(ch => {
                    if (!o[ch] || typeof o[ch] !== 'object') return;
                    Object.entries(o[ch]).forEach(([k, v]) => {
                        const num = Number(v);
                        if (!Number.isFinite(num)) return;
                        loc[ch][k] = _mixRound(Math.max(0, Math.min(AUDIO_MIX_MAX, num)));
                        n++;
                    });
                });
                _mixSaveLocal();
                AUDIO_MIX_CHANNELS.forEach(_mixApplyLive);
                return { ok: true, count: n };
            },
            /* play the key at its CURRENT level (a click is the gesture that unlocks audio) */
            audition(channel, key) {
                try {
                    state.audioUnlocked = true;
                    if (channel === 'music') {
                        if (!audioTracks[key]) return false;
                        if (MusicTags.has(key, 'battle')) { state.currentBattleTrackKey = key; state.lastBattleTrackKey = key; }
                        playMusic(key);
                        return true;
                    }
                    if (channel === 'sfx') return playSfx(key, { allowBeforeUnlock: true, cooldownMs: 0 });
                    if (channel === 'door') return playDoorSfx(key, { allowBeforeUnlock: true });
                    if (channel === 'ambience') {
                        if (!_R2_AMBIENCE[key]) return false;
                        const prev = _mixAudition.ambience;
                        _mixAudition.ambience = key;
                        if (prev && prev !== key) _stopAmbienceBed(prev);
                        _startAmbienceBed(key);
                        clearTimeout(_mixAudition.timer);
                        _mixAudition.timer = setTimeout(() => AudioMixer.stopAudition(), 12000);
                        return true;
                    }
                } catch (e) {}
                return false;
            },
            stopAudition() {
                clearTimeout(_mixAudition.timer);
                const k = _mixAudition.ambience;
                _mixAudition.ambience = null;
                if (k) _stopAmbienceBed(k);
            },
            auditioning() { return _mixAudition.ambience; },
            _lsKey: AUDIO_MIX_LS,
            max: AUDIO_MIX_MAX,
        };
        window.AudioMixer = AudioMixer;
        window.AUDIO_MIX_SHIPPED = AUDIO_MIX_SHIPPED;

        /* ── THE TAGS TAB + THE CONTEXTS TAB of the mixer panel ── */
        function _mixRenderTagsTab(list, ch, q) {
            if (ch === 'tags') {
                const keys = _mixKeys('tags').filter(k => !q || k.toLowerCase().includes(q) || _mixName('music', k).toLowerCase().includes(q) || _musicTagsOf(k).some(t => t.includes(q)));
                list.innerHTML = keys.map(k => {
                    const tags = _musicTagsOf(k);
                    const loc = MusicTags.isLocal(k);
                    const chips = Object.entries(MUSIC_TAG_GROUPS).map(([gid, g], gi) =>
                        (gi ? '<span class="amx-chip sep">·</span>' : '') +
                        g.tags.map(t => `<button class="amx-chip${tags.includes(t) ? ' on' : ''}" style="--amx-tg:${g.color}" data-tag-key="${_mixEsc(k)}" data-tag="${t}" title="${g.label}">${t}</button>`).join('')
                    ).join('');
                    return `<div class="amx-trow${loc ? ' local' : ''}${state.currentMusic === k ? ' now' : ''}" data-key="${_mixEsc(k)}">
                        <button class="amx-play" data-play="${_mixEsc(k)}" title="Audition">▶</button>
                        <div class="amx-name" title="${_mixEsc(k)}">${_mixEsc(_mixName('music', k))}<small>${_mixEsc(k)} · ${tags.length} tag${tags.length === 1 ? '' : 's'}</small></div>
                        <div class="amx-chips">${chips}</div>
                        <button class="amx-reset" data-tag-reset="${_mixEsc(k)}" title="Back to the shipped tags" ${loc ? '' : 'disabled'}>↺</button>
                    </div>`;
                }).join('') || '<div style="padding:20px;opacity:0.6">nothing matches</div>';
                const n = Object.keys(MusicTags.overrides()).length;
                _mixStatus(`${n} song${n === 1 ? '' : 's'} tagged differently from MUSIC_TAGS_SHIPPED (saved in this browser). Gold = tagged here. Blue = playing now. EXPORT JSON to ship the tagging.`);
            } else {
                const cur = MusicTags.current();
                list.innerHTML = Object.entries(MUSIC_CONTEXTS).map(([id, c]) => {
                    const pool = _musicPool(id, null);
                    const own = pool.filter(k => c.any.some(t => _musicTagsOf(k).includes(t)));
                    const fell = !own.length;
                    const here = cur.id === id;
                    const rule = `any of [${c.any.join(', ')}]${c.not ? ' · not [' + c.not.join(', ') + ']' : ''}${c.fallback ? ' · else → ' + c.fallback : ''}`;
                    const names = pool.map(k => `<span${state.currentMusic === k ? ' style="color:#9df"' : ''}>${_mixEsc(_mixName('music', k))}</span>`).join(', ');
                    return `<div class="amx-ctx${fell ? ' empty' : ''}">
                        <div class="amx-ctx-head">
                            <button class="amx-play" data-ctx-play="${id}" title="Play a draw from this pool">▶</button>
                            <div class="amx-ctx-name">${_mixEsc(c.label)}${here ? ' <span style="color:#9df;font-weight:400">· NOW</span>' : ''}<small>${_mixEsc(c.sub || '')}</small></div>
                            <span class="amx-tbl">${pool.length} song${pool.length === 1 ? '' : 's'}${pool.length === 1 ? ' · loops' : ''}</span>
                        </div>
                        <div class="amx-ctx-rule">${_mixEsc(rule)}</div>
                        <div class="amx-ctx-pool">${fell ? '<i>no song wears this role — falls back to:</i> ' : ''}${names || '<i>nothing</i>'}</div>
                    </div>`;
                }).join('') + `<div class="amx-ctx"><div class="amx-ctx-name">SITE MOODS<small>a map's flavour by its setting key (MUSIC_SITE_MOODS, or env.music on its meta row) — a battle / wild room asks for these on top of its role</small></div>
                    <div class="amx-ctx-pool">${Object.entries(MUSIC_SITE_MOODS).map(([k, v]) => `<b>${k}</b> <i>${v.join(' ')}</i>`).join(' &nbsp;·&nbsp; ')}</div></div>`;
                _mixStatus(cur.id ? `now: ${cur.id}${cur.moods ? ' + moods [' + cur.moods.join(', ') + ']' : ''} → ${cur.pool.length} song${cur.pool.length === 1 ? '' : 's'}` : 'no context yet — music starts with the first screen.');
            }
            const hint = document.getElementById('amxHint');
            if (hint) hint.textContent = _MIX_CH_HINT[ch] || '';
            document.querySelectorAll('#audioMixer .amx-tab').forEach(t => t.classList.toggle('on', t.dataset.ch === ch));
        }


        /* ── THE PANEL — a fixed overlay above everything (the pause menu, the HQ pause, the CRT) ── */
        const _MIX_CH_LABEL = { music: 'MUSIC', sfx: 'SFX', ambience: 'AMBIENCE', door: 'DOOR KIT', tags: '🏷 TAGS', contexts: '⌖ CONTEXTS' };
        const _MIX_TABS = AUDIO_MIX_CHANNELS.concat(['tags', 'contexts']);
        const _MIX_CH_HINT = {
            music: 'Songs. ▶ plays the song through the normal music path (it becomes the current track). The level is the song\'s share of full scale before the Music slider.',
            sfx: 'One-shot cues (the R2 files). ▶ fires the cue once at its level. Before the SFX slider.',
            ambience: 'The looping beds. ▶ fades the bed in for twelve seconds (■ stops it). Before the Ambience slider.',
            door: 'The D.O.O.R. synth kit — the office, the seams, the skateboard. Before the SFX slider. Muted placeholders (the buzz, the ring) stay silent.',
            tags: 'Tag every song (a song takes as many tags as fit it). ROLE tags say WHERE it may play; MOOD / ENERGY / STYLE / SETTING tags let a place ask for a flavour. Gold = tagged here. EXPORT JSON → paste over MUSIC_TAGS_SHIPPED to ship the tagging.',
            contexts: 'Where the game is → which tags it asks for → the songs that answer. ▶ plays a draw from that pool. A pool of one song loops; a pool of many shuffles without repeating until every song has played. An empty pool falls back down the list.',
        };
        let _mixUi = { ch: 'music', q: '' };
        function _mixCss() {
            if (document.getElementById('audioMixerCss')) return;
            const st = document.createElement('style');
            st.id = 'audioMixerCss';
            st.textContent = `
#audioMixer{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;background:rgba(2,4,12,0.72);font-family:'Rajdhani','Segoe UI',system-ui,sans-serif;color:#e6e4f2}
#audioMixer .amx{width:min(860px,96vw);height:min(86vh,760px);display:flex;flex-direction:column;background:#0e1020;border:1px solid rgba(160,150,255,0.35);border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.6)}
#audioMixer .amx-head{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.10)}
#audioMixer .amx-title{font-weight:700;letter-spacing:0.14em;font-size:14px;text-transform:uppercase;color:#cfc7ff}
#audioMixer .amx-sub{font-size:11px;opacity:0.65;flex:1}
#audioMixer .amx-tabs{display:flex;gap:4px;padding:8px 14px 0}
#audioMixer .amx-tab{flex:1;padding:7px 8px;border:1px solid rgba(255,255,255,0.14);border-bottom:none;border-radius:8px 8px 0 0;background:rgba(255,255,255,0.04);color:#bdb8d8;font:inherit;font-size:12px;letter-spacing:0.08em;cursor:pointer}
#audioMixer .amx-tab.on{background:rgba(124,77,255,0.30);color:#fff;border-color:rgba(160,150,255,0.5)}
#audioMixer .amx-tab b{opacity:0.6;font-weight:400;margin-left:4px}
#audioMixer .amx-tools{display:flex;gap:8px;align-items:center;padding:8px 14px;border-top:1px solid rgba(160,150,255,0.3);border-bottom:1px solid rgba(255,255,255,0.08);background:rgba(124,77,255,0.08)}
#audioMixer .amx-tools input{flex:1;min-width:0;padding:5px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(0,0,0,0.35);color:#fff;font:inherit;font-size:12px}
#audioMixer .amx-hint{font-size:11px;opacity:0.7;padding:6px 14px 0;line-height:1.35}
#audioMixer .amx-list{flex:1;overflow-y:auto;padding:6px 10px 10px}
#audioMixer .amx-row{display:grid;grid-template-columns:28px minmax(120px,1.2fr) 2fr 52px 44px 26px;gap:8px;align-items:center;padding:4px 6px;border-radius:6px}
#audioMixer .amx-row:hover{background:rgba(255,255,255,0.05)}
#audioMixer .amx-row.local .amx-name{color:#ffd76a}
#audioMixer .amx-play{width:26px;height:24px;border-radius:6px;border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-size:11px}
#audioMixer .amx-play:hover{background:rgba(124,77,255,0.45)}
#audioMixer .amx-name{font-size:12.5px;line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#audioMixer .amx-name small{display:block;font-size:10px;opacity:0.5;font-family:ui-monospace,monospace}
#audioMixer .amx-row input[type=range]{width:100%;accent-color:#9d86ff}
#audioMixer .amx-val{font-variant-numeric:tabular-nums;text-align:right;font-size:12.5px}
#audioMixer .amx-tbl{font-size:10px;opacity:0.5;text-align:right;font-variant-numeric:tabular-nums}
#audioMixer .amx-reset{width:24px;height:22px;border-radius:5px;border:1px solid rgba(255,255,255,0.14);background:transparent;color:#ddd;cursor:pointer;font-size:12px}
#audioMixer .amx-reset:disabled{opacity:0.2;cursor:default}
#audioMixer .amx-foot{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px 14px;border-top:1px solid rgba(255,255,255,0.10)}
#audioMixer .amx-btn{padding:6px 10px;border-radius:7px;border:1px solid rgba(160,150,255,0.4);background:rgba(124,77,255,0.22);color:#fff;font:inherit;font-size:12px;letter-spacing:0.06em;cursor:pointer}
#audioMixer .amx-btn:hover{background:rgba(124,77,255,0.45)}
#audioMixer .amx-btn.warn{border-color:rgba(255,120,120,0.45);background:rgba(255,80,80,0.15)}
#audioMixer .amx-btn.close{margin-left:auto}
#audioMixer .amx-status{font-size:11px;opacity:0.75;width:100%}
#audioMixer .amx-io{display:none;padding:8px 14px;border-top:1px solid rgba(255,255,255,0.10)}
#audioMixer .amx-io.on{display:block}
#audioMixer .amx-io textarea{width:100%;height:120px;box-sizing:border-box;font:11px ui-monospace,monospace;background:rgba(0,0,0,0.4);color:#dfe;border:1px solid rgba(255,255,255,0.15);border-radius:6px;padding:6px}
#audioMixer .amx-trow{display:grid;grid-template-columns:28px minmax(120px,0.9fr) 3fr 26px;gap:8px;align-items:start;padding:6px 6px;border-radius:6px;border-bottom:1px solid rgba(255,255,255,0.05)}
#audioMixer .amx-trow:hover{background:rgba(255,255,255,0.04)}
#audioMixer .amx-trow.local .amx-name{color:#ffd76a}
#audioMixer .amx-trow.now .amx-name{color:#9df}
#audioMixer .amx-chips{display:flex;flex-wrap:wrap;gap:4px}
#audioMixer .amx-chip{padding:2px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.16);background:rgba(255,255,255,0.04);color:#bdb8d8;font:inherit;font-size:11px;letter-spacing:0.04em;cursor:pointer;line-height:1.4}
#audioMixer .amx-chip:hover{border-color:rgba(160,150,255,0.6)}
#audioMixer .amx-chip.on{background:var(--amx-tg,rgba(124,77,255,0.45));color:#fff;border-color:transparent}
#audioMixer .amx-chip.sep{opacity:0.35;border:none;background:none;padding:2px 2px;cursor:default}
#audioMixer .amx-ctx{padding:8px 6px;border-bottom:1px solid rgba(255,255,255,0.06)}
#audioMixer .amx-ctx-head{display:flex;gap:8px;align-items:center}
#audioMixer .amx-ctx-name{font-weight:700;letter-spacing:0.08em;font-size:12.5px;flex:1}
#audioMixer .amx-ctx-name small{display:block;font-weight:400;letter-spacing:0;opacity:0.6;font-size:11px}
#audioMixer .amx-ctx-rule{font-size:10.5px;opacity:0.7;font-family:ui-monospace,monospace;margin:3px 0 4px}
#audioMixer .amx-ctx-pool{font-size:11.5px;opacity:0.9;line-height:1.5}
#audioMixer .amx-ctx-pool i{opacity:0.55}
#audioMixer .amx-ctx.empty .amx-ctx-pool{color:#ff9a8a}
`;
            document.head.appendChild(st);
        }
        function _mixName(channel, key) {
            if (channel === 'music' && typeof _TRACK_DISPLAY_NAMES !== 'undefined' && _TRACK_DISPLAY_NAMES[key]) return _TRACK_DISPLAY_NAMES[key];
            if (channel === 'music' && _R2_MUSIC[key]) { try { return decodeURIComponent(_R2_MUSIC[key].split('/').pop()); } catch (e) {} }
            return key;
        }
        function _mixEsc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
        function _mixStatus(msg) {
            const el = document.getElementById('amxStatus');
            if (el) el.textContent = msg;
        }
        function _mixRenderList() {
            const list = document.getElementById('amxList');
            if (!list) return;
            const ch = _mixUi.ch;
            const q = (_mixUi.q || '').toLowerCase();
            if (ch === 'tags' || ch === 'contexts') { _mixRenderTagsTab(list, ch, q); return; }
            const keys = _mixKeys(ch).filter(k => !q || k.toLowerCase().includes(q) || _mixName(ch, k).toLowerCase().includes(q));
            list.innerHTML = keys.map(k => {
                const v = AudioMixer.get(ch, k);
                const tbl = AudioMixer.base(ch, k);
                const loc = AudioMixer.isLocal(ch, k);
                const pct = Math.round(v * 100);
                return `<div class="amx-row${loc ? ' local' : ''}" data-key="${_mixEsc(k)}">
                    <button class="amx-play" data-play="${_mixEsc(k)}" title="Audition">▶</button>
                    <div class="amx-name" title="${_mixEsc(k)}">${_mixEsc(_mixName(ch, k))}<small>${_mixEsc(k)}</small></div>
                    <input type="range" min="0" max="${Math.round(AUDIO_MIX_MAX * 100)}" step="1" value="${pct}" data-slide="${_mixEsc(k)}">
                    <span class="amx-val" data-val="${_mixEsc(k)}">${pct}%</span>
                    <span class="amx-tbl" title="the table's value">tbl ${Math.round(tbl * 100)}</span>
                    <button class="amx-reset" data-reset="${_mixEsc(k)}" title="Back to the shipped level" ${loc ? '' : 'disabled'}>↺</button>
                </div>`;
            }).join('') || '<div style="padding:20px;opacity:0.6">nothing matches</div>';
            const ov = AudioMixer.overrides();
            const n = AUDIO_MIX_CHANNELS.reduce((a, c) => a + Object.keys(ov[c]).length, 0);
            const nl = AUDIO_MIX_CHANNELS.reduce((a, c) => a + _mixKeys(c).filter(k => AudioMixer.isLocal(c, k)).length, 0);
            _mixStatus(`${n} level${n === 1 ? '' : 's'} differ from the tables (${nl} set here, saved in this browser). Gold = set here. EXPORT to ship them to everyone.`);
            const hint = document.getElementById('amxHint');
            if (hint) hint.textContent = _MIX_CH_HINT[ch] || '';
            document.querySelectorAll('#audioMixer .amx-tab').forEach(t => t.classList.toggle('on', t.dataset.ch === ch));
        }
        function _mixCopy(text, what) {
            const done = () => _mixStatus(what + ' copied to the clipboard.');
            const fail = () => { const ta = document.getElementById('amxIoText'); const io = document.getElementById('amxIo'); if (ta && io) { io.classList.add('on'); ta.value = text; ta.select(); } _mixStatus(what + ' is in the box below — copy it from there.'); };
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fail);
                else fail();
            } catch (e) { fail(); }
        }
        function _mixDownload() {
            try {
                const blob = new Blob([AudioMixer.exportJson()], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'entropy_wars_audio_mix_' + new Date().toISOString().slice(0, 10) + '.json';
                document.body.appendChild(a); a.click(); a.remove();
                setTimeout(() => URL.revokeObjectURL(a.href), 2000);
                _mixStatus('audio mix JSON downloaded.');
            } catch (e) { _mixStatus('download failed: ' + e.message); }
        }
        AudioMixer.open = function(channel) {
            if (typeof document === 'undefined') return;
            _mixCss();
            if (channel && _MIX_TABS.includes(channel)) _mixUi.ch = channel;
            let root = document.getElementById('audioMixer');
            if (!root) {
                root = document.createElement('div');
                root.id = 'audioMixer';
                root.innerHTML = `<div class="amx" role="dialog" aria-label="Audio mixer">
                    <div class="amx-head">
                        <span class="amx-title">🎚 Audio Mixer</span>
                        <span class="amx-sub">per-song / per-cue master levels · dev tool · levels sit BEFORE the Music / SFX / Ambience sliders</span>
                    </div>
                    <div class="amx-tabs">${_MIX_TABS.map(c => `<button class="amx-tab" data-ch="${c}">${_MIX_CH_LABEL[c]}<b>${c === 'contexts' ? Object.keys(MUSIC_CONTEXTS).length : _mixKeys(c).length}</b></button>`).join('')}</div>
                    <div class="amx-tools">
                        <input id="amxSearch" type="search" placeholder="filter by name or key…" value="${_mixEsc(_mixUi.q)}">
                        <button class="amx-btn" id="amxStopAmb" title="Stop the auditioned bed">■ STOP</button>
                        <button class="amx-btn warn" id="amxResetCh" title="Clear every level set here on this tab">↺ TAB</button>
                    </div>
                    <div class="amx-hint" id="amxHint"></div>
                    <div class="amx-list" id="amxList"></div>
                    <div class="amx-io" id="amxIo">
                        <textarea id="amxIoText" spellcheck="false" placeholder="paste an exported JSON here, then IMPORT"></textarea>
                        <div style="display:flex;gap:6px;margin-top:6px"><button class="amx-btn" id="amxIoImport">IMPORT THIS</button><button class="amx-btn" id="amxIoHide">HIDE</button></div>
                    </div>
                    <div class="amx-foot">
                        <button class="amx-btn" id="amxExportJson" title="The override object — paste it over AUDIO_MIX_SHIPPED in audio.js">⎘ EXPORT JSON</button>
                        <button class="amx-btn" id="amxExportJs" title="The four base tables rewritten with the mix folded in">⎘ EXPORT JS TABLES</button>
                        <button class="amx-btn" id="amxDownload">⭳ DOWNLOAD .json</button>
                        <button class="amx-btn" id="amxImport">⭱ IMPORT</button>
                        <button class="amx-btn warn" id="amxResetAll">↺ RESET ALL</button>
                        <button class="amx-btn close" id="amxClose">✕ CLOSE</button>
                        <div class="amx-status" id="amxStatus"></div>
                    </div>
                </div>`;
                document.body.appendChild(root);
                root.addEventListener('click', ev => {
                    const t = ev.target.closest('button');
                    if (!t) { if (ev.target === root) AudioMixer.close(); return; }
                    if (t.dataset.ch) { _mixUi.ch = t.dataset.ch; _mixRenderList(); return; }
                    if (t.dataset.play) { AudioMixer.audition(_mixUi.ch, t.dataset.play); _mixStatus('▶ ' + _mixName(_mixUi.ch, t.dataset.play) + ' @ ' + Math.round(AudioMixer.get(_mixUi.ch, t.dataset.play) * 100) + '%'); return; }
                    if (t.dataset.tagKey) { MusicTags.toggle(t.dataset.tagKey, t.dataset.tag); _mixRenderList(); return; }
                    if (t.dataset.tagReset) { MusicTags.reset(t.dataset.tagReset); _mixRenderList(); return; }
                    if (t.dataset.ctxPlay) { const k = _musicDraw(t.dataset.ctxPlay, null, [state.currentMusic]); if (k) { state.audioUnlocked = true; _musicCtx.id = t.dataset.ctxPlay; _musicCtx.moods = null; playMusic(k); _mixStatus('▶ ' + _mixName('music', k) + ' — a draw from ' + t.dataset.ctxPlay); } else _mixStatus('that pool is empty'); return; }
                    if (t.dataset.reset) { AudioMixer.reset(_mixUi.ch, t.dataset.reset); _mixRenderList(); return; }
                    if (_mixUi.ch === 'tags' && t.id === 'amxResetCh') { MusicTags.reset(); _mixRenderList(); return; }
                    switch (t.id) {
                        case 'amxClose': AudioMixer.close(); break;
                        case 'amxStopAmb': AudioMixer.stopAudition(); _mixStatus('bed stopped.'); break;
                        case 'amxResetCh': AudioMixer.reset(_mixUi.ch); _mixRenderList(); break;
                        case 'amxResetAll': if (window.confirm('Clear every level AND every tag set in this browser? (The shipped mix + tagging stay.)')) { AudioMixer.reset(); MusicTags.reset(); _mixRenderList(); } break;
                        case 'amxExportJson': _mixCopy(AudioMixer.exportJson(), 'JSON (levels → AUDIO_MIX_SHIPPED · tags → MUSIC_TAGS_SHIPPED)'); break;
                        case 'amxExportJs': _mixCopy(AudioMixer.exportJs(), 'the JS tables'); break;
                        case 'amxDownload': _mixDownload(); break;
                        case 'amxImport': { const io = document.getElementById('amxIo'); io.classList.toggle('on'); document.getElementById('amxIoText').focus(); break; }
                        case 'amxIoHide': document.getElementById('amxIo').classList.remove('on'); break;
                        case 'amxIoImport': { const r = AudioMixer.importJson(document.getElementById('amxIoText').value); _mixRenderList(); _mixStatus(r.ok ? `imported ${r.count} level${r.count === 1 ? '' : 's'}.` : 'import failed: ' + r.error); break; }
                    }
                });
                root.addEventListener('input', ev => {
                    const t = ev.target;
                    if (t.id === 'amxSearch') { _mixUi.q = t.value; _mixRenderList(); return; }
                    if (t.dataset.slide) {
                        const k = t.dataset.slide;
                        AudioMixer.set(_mixUi.ch, k, Number(t.value) / 100);
                        const v = root.querySelector(`[data-val="${CSS.escape(k)}"]`);
                        if (v) v.textContent = t.value + '%';
                        const row = t.closest('.amx-row'); if (row) { row.classList.add('local'); const rb = row.querySelector('[data-reset]'); if (rb) rb.disabled = false; }
                    }
                });
                root.addEventListener('change', ev => {
                    const t = ev.target;
                    if (t.dataset.slide) {
                        /* a released slider re-fires a one-shot so the new level is heard; music / beds are live already */
                        if (_mixUi.ch === 'sfx' || _mixUi.ch === 'door') AudioMixer.audition(_mixUi.ch, t.dataset.slide);
                        _mixRenderList();
                    }
                });
                root.addEventListener('keydown', ev => { if (ev.key === 'Escape') { ev.stopPropagation(); AudioMixer.close(); } });
            }
            root.style.display = 'flex';
            _mixRenderList();
            const s = document.getElementById('amxSearch'); if (s) s.focus();
        };
        AudioMixer.close = function() {
            const root = document.getElementById('audioMixer');
            if (root) root.style.display = 'none';
            AudioMixer.stopAudition();
        };
        AudioMixer.isOpen = function() { const r = document.getElementById('audioMixer'); return !!r && r.style.display !== 'none'; };

        function getMusicBaseVolume(key) {
            return Math.max(0, Math.min(1, _mixLevel('music', key, AUDIO_BASE_VOLUMES[key] ?? 0.55) * (state.musicVolume ?? 1)));
        }

        function getSfxBaseVolume(key) {
            return Math.max(0, Math.min(1, _mixLevel('sfx', key, SFX_BASE_VOLUMES[key] ?? 0.7) * (state.sfxVolume ?? 1)));
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
            track.preload = 'none';
            track.volume = getMusicBaseVolume(key);
        });
        /* THE PLAYLIST (2026-09-16): no song loops on its own any more — a pool of
           one song loops, a pool of many advances (`_musicApplyLoop`). The legacy
           battle shuffle names are kept as thin wrappers over the battle pool. */
        Object.keys(audioTracks).forEach(key => { if (audioTracks[key]) audioTracks[key].loop = false; });

        function refillBattleShuffleBag() { _musicBagReset('battle'); }
        function drawFromBattleShuffleBag(excludeKey) {
            return _musicDraw('battle', _musicBattleMoods(), [excludeKey]);
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

        /* THE ADVANCE (2026-09-16): when the playing song runs out it is the
           CURRENT CONTEXT's pool that answers — in a battle the next battle
           song (crossfaded 9 s before the end, as before), in the building the
           next facility song, on the menu the next menu song. A pool of one
           song loops instead (`_musicApplyLoop`), and a song the player
           pinned with the pause menu's 🔁 is never advanced. */
        function advanceBattleTrack(endingKey) { return advanceTrack(endingKey); }
        function advanceTrack(endingKey) {
            if (state.winner) return;
            if (state.currentMusic !== endingKey) return;
            const t = audioTracks[endingKey];
            if (t && t.loop) return;
            if (_battleCrossfadeTriggered.has(endingKey)) return;
            const ctx = _musicCtx.id;
            if (!ctx) return;
            const pool = _musicPool(ctx, _musicCtx.moods);
            if (pool.length <= 1) return;
            _battleCrossfadeTriggered.add(endingKey);
            const nextKey = _musicDraw(ctx, _musicCtx.moods, [endingKey]);
            if (!nextKey) return;
            if (ctx === 'battle') { state.currentBattleTrackKey = nextKey; state.lastBattleTrackKey = nextKey; }
            playMusic(nextKey);
        }

        Object.keys(audioTracks).forEach(key => {
            if (!audioTracks[key] || key === 'victory' || key === 'defeat') return;

            audioTracks[key].addEventListener('timeupdate', () => {
                const t = audioTracks[key];
                if (!t.duration || !Number.isFinite(t.duration)) return;
                if (_musicCtx.id !== 'battle') return;   // only the battle crossfades early; the rest advance on 'ended'
                const remaining = t.duration - t.currentTime;
                if (remaining <= BATTLE_CROSSFADE_LEAD_SEC && remaining > 0) {
                    advanceTrack(key);
                }
            });

            audioTracks[key].addEventListener('ended', () => {
                advanceTrack(key);
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
            // Training match: the CPU's instant turn would fire a burst of
            // overlapping cues in a few ms — mute SFX for it (music untouched).
            if (state._aiTurbo) return false;
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
            if (window.AudioContext || window.webkitAudioContext) {
                return _playBufferedSfx(src, key, opts);
            }
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

        // One gesture-unlocked context serves all one-shots, including events
        // arriving from the network or a delayed animation on iOS. Decode only
        // requested sounds, with bounded memory/concurrency instead of a new
        // HTMLAudioElement (and a new autoplay decision) for every hit.
        const _sfxBuffers = new Map();
        const _sfxPending = new Map();
        const _sfxVoices = new Set();
        const _sfxQueue = [];
        let _sfxBytes = 0, _sfxLoads = 0;
        const _SFX_CACHE_BYTES = 8 * 1024 * 1024;

        let _sfxWarmed = false;
        function _unlockSfxContext() {
            try {
                const ctx = _doorCtx();
                if (ctx.state !== 'running') ctx.resume().catch(() => {});
                if (!_sfxWarmed) {
                    _sfxWarmed = true;
                    ['uiConfirm', 'uiCursorMove', 'uiButtonConfirm', 'moveStep', 'basicAttack', 'damage'].forEach(key => {
                        if (sfxLibrary[key]) _getSfxBuffer(sfxLibrary[key]);
                    });
                }
            } catch (_) {}
        }
        // Keep these listeners: Safari can suspend/interrupt audio on app switch.
        ['pointerdown', 'touchend', 'click', 'keydown'].forEach(type => {
            document.addEventListener(type, _unlockSfxContext, { capture: true, passive: true });
        });

        function _pumpSfxLoads() {
            while (_sfxLoads < 2 && _sfxQueue.length) {
                const job = _sfxQueue.shift();
                _sfxLoads++;
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 10000);
                // Use a separate CORS cache entry from legacy HTML audio loads.
                const url = job.src + (job.src.includes('?') ? '&' : '?') + 'ewaudio=1';
                fetch(url, { signal: controller.signal }).then(r => {
                    if (!r.ok) throw new Error('SFX HTTP ' + r.status);
                    return r.arrayBuffer();
                }).then(bytes => new Promise((resolve, reject) => {
                    _doorCtx().decodeAudioData(bytes, resolve, reject);
                })).then(buffer => {
                    const bytes = buffer.length * buffer.numberOfChannels * 4;
                    if (bytes <= _SFX_CACHE_BYTES) {
                        while (_sfxBytes + bytes > _SFX_CACHE_BYTES && _sfxBuffers.size) {
                            const oldest = _sfxBuffers.keys().next().value;
                            _sfxBytes -= _sfxBuffers.get(oldest).bytes;
                            _sfxBuffers.delete(oldest);
                        }
                        _sfxBuffers.set(job.src, { buffer, bytes }); _sfxBytes += bytes;
                    }
                    job.resolve(buffer);
                }).catch(() => job.resolve(null)).finally(() => {
                    clearTimeout(timer); _sfxPending.delete(job.src); _sfxLoads--; _pumpSfxLoads();
                });
            }
        }
        function _getSfxBuffer(src) {
            const cached = _sfxBuffers.get(src);
            if (cached) {
                _sfxBuffers.delete(src); _sfxBuffers.set(src, cached);
                return Promise.resolve(cached.buffer);
            }
            if (_sfxPending.has(src)) return _sfxPending.get(src);
            if (_sfxPending.size >= 16) return Promise.resolve(null);
            const promise = new Promise(resolve => _sfxQueue.push({ src, resolve }));
            _sfxPending.set(src, promise); _pumpSfxLoads();
            return promise;
        }
        function _playBufferedSfx(src, key, opts) {
            let ctx;
            try { ctx = _doorCtx(); } catch (_) { return false; }
            if (ctx.state !== 'running') { _unlockSfxContext(); return false; }
            const requested = performance.now();
            const volume = Math.max(0, Math.min(1, opts.volume ?? getSfxBaseVolume(key)));
            if (!volume) return false;
            _getSfxBuffer(src).then(buffer => {
                // A cold download should never replay old combat seconds later.
                if (!buffer || ctx.state !== 'running' || document.hidden || performance.now() - requested > 1200) return;
                if (_sfxVoices.size >= 12) return;
                const source = ctx.createBufferSource(), gain = ctx.createGain();
                source.buffer = buffer; gain.gain.value = volume;
                source.connect(gain).connect(ctx.destination);
                _sfxVoices.add(source);
                source.onended = () => { _sfxVoices.delete(source); source.disconnect(); gain.disconnect(); };
                source.start();
            }).catch(() => {});
            return true;
        }

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
            _musicApplyLoop(trackKey);
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

                const _isBattleKey = k => k && MusicTags.has(k, 'battle');
                const crossMs = (_musicCtx.id === 'battle' && _isBattleKey(previousKey) && _isBattleKey(trackKey))
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
            _unlockSfxContext();
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
            const base = _mixLevel('ambience', key, AMBIENCE_BASE_VOLUMES[key] ?? 0.3);
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
            /* MOVING MAPS (2026-09-12): a travelling map names its own bed (the
               wind over the sea); the picker keeps the lava / cloud rules first */
            else if (state.mapEnv && state.mapEnv.motion && typeof state.mapEnv.motion.ambience === 'string' && _R2_AMBIENCE[state.mapEnv.motion.ambience]) val = state.mapEnv.motion.ambience;
            /* 7.6 WAVE 1 (2026-09-13): a still map may name its bed on the meta
               row itself (env.ambience — the Haunted House's night) */
            else if (state.mapEnv && typeof state.mapEnv.ambience === 'string' && _R2_AMBIENCE[state.mapEnv.ambience]) val = state.mapEnv.ambience;
            _ambFlavourCache = { at: now, val };
            return val;
        }

        // Stackable layers: weather + map flavour + day/night can all play at
        // once (night crickets under a thunderstorm). One exception: daytime
        // birdsong under a raging storm reads wrong, so the storm replaces it.
        /* MOVING MAPS (2026-09-12): the storm a sea map sails into (env.motion.storm
           { from, to } rounds → 0..1); the thunder bed joins once it is half built.
           state.round syncs, so the guest hears the same weather. */
        function _motionStormLevel() {
            try {
                const mo = state.mapEnv && state.mapEnv.motion, st = mo && mo.storm;
                if (!st || !(st.to > st.from)) return 0;
                return Math.max(0, Math.min(1, ((state.round || 1) - st.from) / (st.to - st.from)));
            } catch (e) { return 0; }
        }
        function _desiredAmbienceKeys() {
            try {
                if (window.EW_DISABLE_AMBIENCE) return [];
                if (!state.audioUnlocked || state.devAutoSim) return [];
                /* THE MIXER (2026-09-16): a bed under audition stays up outside a battle */
                if (_mixAudition.ambience && _R2_AMBIENCE[_mixAudition.ambience]) return [_mixAudition.ambience];
                if (state.phase !== 'battle' || state.winner) return [];
                const keys = [];
                const aw = state.activeWeather || [];
                const storm = aw.some(w => w && (w.type === 'thunderstorm' || w.type === 'hurricane')) || _motionStormLevel() >= 0.5;
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
            /* THE SEAMS THAT ARE NOT DOORS (HQ plan 9.3, 2026-09-15): quiet —
               the buzz was muted for being loud; these stay under it */
            wayCreak: 0.28, wayWell: 0.3, wayTrain: 0.32,
            wayMirror: 0.3, waySplash: 0.32, wayCanvas: 0.28, wayFloo: 0.32, wayStatic: 0.26,   // the second batch (rev 22)
            wayHollow: 0.3,   // THE TREES WITH HOLES IN THEM (2026-09-17)
            wayScope: 0.28,   // THE TELESCOPE (2026-09-17, THE DIVINE STAIR): the brass creak of the tube, a rising shimmer, the step onto cloud
            wayRoad: 0.3,   // THE ROAD (2026-09-17, THE URBAN PACK): a car passing on the road out — a low whoosh with a doppler fall, the tyres' hiss
            wayTime: 0.3, wayGutter: 0.3,   // DISASTER CITY (2026-09-17): the time machine's disc spinning up to a chord and a snap; the gutter's grate, the drop, the splash below
            wayWhirl: 0.36, wayUpwell: 0.32, seaDive: 0.34, seaSurface: 0.3, seaBoard: 0.3,   // THE DEEP (2026-09-18): the maelstrom's roar and the drop; the upwelling's rush; the diver's plunge / breath; a hull knocked and boarded
            /* SKATEBOARDING (HQ plan 9.8, 2026-09-15): the deck's own kit — quiet, the ride plays them thirty times a minute */
            skatePush: 0.3, skateOllie: 0.4, skateLand: 0.36, skateGrind: 0.3, skateBail: 0.45, skateBank: 0.4,
            /* THE DOOR GUN rev 3 (2026-09-16): the zap, the frame landing, the recall — the building AND the board (the shot VFX voices them) */
            doorGunShot: 0.5, doorGunLand: 0.45, doorGunRecall: 0.42,
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
            /* THE WARDROBE (a `way` seam): a slow wooden creak — a sawtooth
               sliding up with a wobble, a rub of noise, then the coats' soft
               brush and a breath of cold wind at the back. */
            /* ── SKATEBOARDING (HQ plan 9.8, 2026-09-15): the deck's kit ──
               THE PUSH: a foot on concrete and the urethane rolling off it (a
               low noise whoosh, band-passed, rising). THE OLLIE: the tail's
               POP (a click over a short thump). THE LANDING: four wheels
               down at once (a thump, a rattle). THE GRIND: the trucks on
               steel — a short metallic buzz, called every 0.22 s while the
               rail lasts. THE BAIL: a scrape and the body hitting the floor.
               THE BANK: the line lands — a two-note lift. */
            skatePush(ctx, t, out, vol) {
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.7, 0.03, 0.12, 0.3), t, 0.5, { type: 'bandpass', f0: 380, f1: 900, slide: 0.4, q: 1.1 });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t + 0.05, vol * 0.25, 0.1, 0.3, 0.5), t + 0.05, 0.9, { type: 'lowpass', f0: 700, f1: 420, slide: 0.8, q: 0.6 });
                return 1.0;
            },
            skateOllie(ctx, t, out, vol) {
                const g = _doorEnv(ctx, out, t, vol, 0.004, 0.02, 0.08);
                const o = ctx.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(1600, t); o.frequency.exponentialRampToValueAtTime(400, t + 0.05);
                const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
                o.connect(hp).connect(g); o.start(t); o.stop(t + 0.1);
                const th = _doorEnv(ctx, out, t + 0.01, vol * 0.7, 0.005, 0.04, 0.16);
                const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.setValueAtTime(160, t + 0.01); o2.frequency.exponentialRampToValueAtTime(60, t + 0.18);
                o2.connect(th); o2.start(t + 0.01); o2.stop(t + 0.22);
                return 0.3;
            },
            skateLand(ctx, t, out, vol) {
                const th = _doorEnv(ctx, out, t, vol, 0.004, 0.05, 0.2);
                const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.22);
                o.connect(th); o.start(t); o.stop(t + 0.26);
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.5, 0.004, 0.03, 0.12), t, 0.2, { type: 'bandpass', f0: 1800, f1: 700, slide: 0.15, q: 0.8 });
                return 0.35;
            },
            skateGrind(ctx, t, out, vol) {
                const dur = 0.26;
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.8, 0.02, dur - 0.06, 0.08), t, dur + 0.1, { type: 'bandpass', f0: 2600, f1: 3400, slide: dur, q: 4 });
                const g = _doorEnv(ctx, out, t, vol * 0.25, 0.02, dur - 0.06, 0.06);
                const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(1240, t); o.frequency.linearRampToValueAtTime(1180, t + dur);
                const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 6;
                o.connect(bp).connect(g); o.start(t); o.stop(t + dur);
                return dur + 0.1;
            },
            skateBail(ctx, t, out, vol) {
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.7, 0.01, 0.18, 0.25), t, 0.5, { type: 'bandpass', f0: 1400, f1: 500, slide: 0.4, q: 0.9 });
                const th = _doorEnv(ctx, out, t + 0.16, vol, 0.005, 0.06, 0.3);
                const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(110, t + 0.16); o.frequency.exponentialRampToValueAtTime(40, t + 0.5);
                o.connect(th); o.start(t + 0.16); o.stop(t + 0.55);
                return 0.7;
            },
            skateBank(ctx, t, out, vol) {
                [[0, 660], [0.09, 990]].forEach(n => {
                    const g = _doorEnv(ctx, out, t + n[0], vol * 0.5, 0.01, 0.08, 0.25);
                    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = n[1];
                    o.connect(g); o.start(t + n[0]); o.stop(t + n[0] + 0.4);
                });
                return 0.5;
            },
            wayCreak(ctx, t, out, vol) {
                const dur = 0.7;
                const g = _doorEnv(ctx, out, t, vol * 0.6, 0.05, dur - 0.2, 0.18);
                const lfo = ctx.createOscillator(); const lg = ctx.createGain();
                lfo.type = 'sine'; lfo.frequency.value = 9; lg.gain.value = 18;
                const o = ctx.createOscillator(); o.type = 'sawtooth';
                o.frequency.setValueAtTime(140, t); o.frequency.linearRampToValueAtTime(260, t + dur);
                lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + dur);
                const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 3;
                o.connect(lp).connect(g); o.start(t); o.stop(t + dur);
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.22, 0.05, dur - 0.2, 0.2), t, dur, { type: 'bandpass', f0: 600, f1: 1400, slide: dur, q: 1.2 });
                const tb = t + dur - 0.05;
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, tb, vol * 0.3, 0.08, 0.25, 0.35), tb, 0.7, { type: 'bandpass', f0: 2200, f1: 900, slide: 0.6, q: 0.7 });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, tb + 0.2, vol * 0.18, 0.4, 0.5, 0.6), tb + 0.2, 1.5, { type: 'lowpass', f0: 500, f1: 260, slide: 1.4, q: 0.5 });
                return dur + 1.7;
            },
            /* THE WELL (a `way` seam): the windlass' ratchet, the rope
               paying out, a fall of air down the shaft, and the far, wet,
               hollow note where it ends. */
            wayWell(ctx, t, out, vol) {
                for (let i = 0; i < 6; i++) {
                    const tc = t + i * 0.09;
                    _doorOsc(ctx, _doorEnv(ctx, out, tc, vol * 0.3, 0.002, 0.01, 0.05), 'square', 620 - i * 30, tc, 0.05);
                }
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.25, 0.05, 0.5, 0.2), t, 0.8, { type: 'bandpass', f0: 1200, f1: 700, slide: 0.7, q: 1.5 });
                const tf = t + 0.55;
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, tf, vol * 0.4, 0.1, 0.6, 0.4), tf, 1.2, { type: 'lowpass', f0: 1800, f1: 220, slide: 1.1, q: 0.8 });
                const tp = tf + 1.05;
                _doorOsc(ctx, _doorEnv(ctx, out, tp, vol * 0.5, 0.004, 0.06, 0.9), 'sine', 220, tp, 1.0, { f1: 96, slide: 0.35 });
                _doorOsc(ctx, _doorEnv(ctx, out, tp, vol * 0.2, 0.004, 0.04, 0.7), 'sine', 440, tp, 0.8, { f1: 200, slide: 0.3 });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, tp, vol * 0.2, 0.002, 0.03, 0.25), tp, 0.3, { type: 'highpass', f0: 1800 });
                return tp - t + 1.2;
            },
            /* THE TRAIN (a `way` seam, 2026-09-15): the brakes' long squeal
               falling as the train stops, the air-brake hiss, the two-note
               door chime, then the doors' rubber thud. Quiet, like the rest. */
            wayTrain(ctx, t, out, vol) {
                const sq = 0.9;
                _doorOsc(ctx, _doorEnv(ctx, out, t, vol * 0.22, 0.08, sq - 0.3, 0.25), 'sawtooth', 2600, t, sq, { f1: 1500, slide: sq });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t + 0.2, vol * 0.3, 0.05, 0.5, 0.35), t + 0.2, 1.1, { type: 'bandpass', f0: 4200, f1: 1800, slide: 1.0, q: 0.6 });
                const th = t + sq + 0.05;
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, th, vol * 0.4, 0.01, 0.35, 0.3), th, 0.7, { type: 'highpass', f0: 3000 });
                const tc = th + 0.45;
                _doorOsc(ctx, _doorEnv(ctx, out, tc, vol * 0.35, 0.004, 0.12, 0.3), 'sine', 880, tc, 0.4);
                _doorOsc(ctx, _doorEnv(ctx, out, tc + 0.22, vol * 0.35, 0.004, 0.14, 0.35), 'sine', 660, tc + 0.22, 0.45);
                const td = tc + 0.75;
                _doorOsc(ctx, _doorEnv(ctx, out, td, vol * 0.4, 0.003, 0.03, 0.14), 'sine', 120, td, 0.18, { f1: 60, slide: 0.12 });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, td, vol * 0.18, 0.002, 0.04, 0.12), td, 0.18, { type: 'lowpass', f0: 900 });
                return td - t + 0.4;
            },
            /* THE MIRROR (a `way` seam, rev 22): a glass note that swells
               the wrong way round — a shimmer of two close sines rising, a
               breath of high air, then the surface gives with a soft chime. */
            wayMirror(ctx, t, out, vol) {
                _doorOsc(ctx, _doorEnv(ctx, out, t, vol * 0.3, 0.35, 0.3, 0.4), 'sine', 1180, t, 1.1, { f1: 1560, slide: 1.0 });
                _doorOsc(ctx, _doorEnv(ctx, out, t, vol * 0.22, 0.35, 0.3, 0.4), 'sine', 1187, t, 1.1, { f1: 1572, slide: 1.0 });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t + 0.1, vol * 0.14, 0.4, 0.3, 0.4), t + 0.1, 1.2, { type: 'highpass', f0: 5200, f1: 7800, slide: 1.0 });
                const tc = t + 0.95;
                _doorOsc(ctx, _doorEnv(ctx, out, tc, vol * 0.4, 0.003, 0.05, 0.9), 'sine', 2093, tc, 1.0);
                _doorOsc(ctx, _doorEnv(ctx, out, tc + 0.03, vol * 0.25, 0.003, 0.05, 0.8), 'sine', 3136, tc + 0.03, 0.9);
                return tc - t + 1.1;
            },
            /* THE POOL (a `way` seam, rev 22): the plunge — a low plop, the
               splash's wash falling away, then the bubbles rising in a run of
               small blips, and the surface closing over. */
            waySplash(ctx, t, out, vol) {
                _doorOsc(ctx, _doorEnv(ctx, out, t, vol * 0.5, 0.004, 0.04, 0.22), 'sine', 260, t, 0.3, { f1: 70, slide: 0.2 });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t + 0.01, vol * 0.45, 0.01, 0.12, 0.5), t + 0.01, 0.75, { type: 'bandpass', f0: 2600, f1: 700, slide: 0.7, q: 0.7 });
                for (let i = 0; i < 7; i++) {
                    const tb = t + 0.3 + i * 0.09 + (i % 3) * 0.02;
                    _doorOsc(ctx, _doorEnv(ctx, out, tb, vol * 0.16, 0.003, 0.02, 0.08), 'sine', 700 + i * 140, tb, 0.1, { f1: 1200 + i * 160, slide: 0.08 });
                }
                const ts = t + 0.95;
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, ts, vol * 0.2, 0.08, 0.2, 0.5), ts, 0.8, { type: 'lowpass', f0: 1400, f1: 300, slide: 0.7, q: 0.6 });
                return ts - t + 0.9;
            },
            /* THE PAINTING (a `way` seam, rev 22): the canvas stretching — a
               rising creak in the linen, the stretcher bar's tick, then the
               surface gives with a soft, dry pop and a wash of air behind it. */
            wayCanvas(ctx, t, out, vol) {
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.3, 0.1, 0.4, 0.2), t, 0.7, { type: 'bandpass', f0: 380, f1: 1500, slide: 0.65, q: 2.5 });
                _doorOsc(ctx, _doorEnv(ctx, out, t + 0.5, vol * 0.25, 0.002, 0.02, 0.08), 'square', 900, t + 0.5, 0.06);
                const tp = t + 0.7;
                _doorOsc(ctx, _doorEnv(ctx, out, tp, vol * 0.45, 0.003, 0.03, 0.18), 'sine', 320, tp, 0.22, { f1: 110, slide: 0.15 });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, tp, vol * 0.2, 0.002, 0.03, 0.12), tp, 0.18, { type: 'highpass', f0: 2400 });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, tp + 0.1, vol * 0.18, 0.3, 0.5, 0.7), tp + 0.1, 1.5, { type: 'lowpass', f0: 600, f1: 250, slide: 1.3, q: 0.5 });
                return tp - t + 1.6;
            },
            /* THE FIREPLACE (a `way` seam, rev 22): the Floo — the fire's
               crackle, a whoosh that rises as the flame goes green, a low
               rumble under it, and the roar swallowing you. */
            wayFloo(ctx, t, out, vol) {
                for (let i = 0; i < 8; i++) {
                    const tc = t + i * 0.07 + (i % 2) * 0.03;
                    _doorOsc(ctx, _doorEnv(ctx, out, tc, vol * 0.18, 0.001, 0.008, 0.03), 'square', 1800 + (i * 373) % 900, tc, 0.03);
                }
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t + 0.2, vol * 0.42, 0.35, 0.4, 0.5), t + 0.2, 1.3, { type: 'bandpass', f0: 300, f1: 1900, slide: 0.9, q: 0.8 });
                _doorOsc(ctx, _doorEnv(ctx, out, t + 0.2, vol * 0.3, 0.3, 0.5, 0.5), 'sine', 55, t + 0.2, 1.3, { f1: 90, slide: 0.9 });
                const tr = t + 1.1;
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, tr, vol * 0.35, 0.05, 0.3, 0.6), tr, 1.0, { type: 'lowpass', f0: 2400, f1: 400, slide: 0.9, q: 0.7 });
                return tr - t + 1.0;
            },
            /* THE SCREEN (a `way` seam, rev 22): the set's hum, a burst of
               static with the frame buzz under it, the sync tearing as the
               shape opens, then the signal cutting out — silence with a tick. */
            /* THE HOLLOW TREE / THE DEAD TREE (2026-09-17): two knocks on wood, a
               rustle of leaves, and the hollow note of the trunk as you climb in. */
            wayHollow(ctx, t, out, vol) {
                [0, 0.19].forEach(k => { const tk = t + k; _doorOsc(ctx, _doorEnv(ctx, out, tk, vol * 0.5, 0.003, 0.05, 0.12), 'sine', 190 + k * 60, tk, 0.16, { f1: 120, slide: 0.12 }); _doorNoiseSrc(ctx, _doorEnv(ctx, out, tk, vol * 0.25, 0.002, 0.03, 0.08), tk, 0.12, { type: 'bandpass', f0: 900, f1: 500, slide: 0.1, q: 1.2 }); });
                const tr = t + 0.35;
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, tr, vol * 0.28, 0.08, 0.6, 0.4), tr, 1.1, { type: 'bandpass', f0: 3200, f1: 2200, slide: 1.0, q: 0.7 });
                const th = t + 0.7;
                _doorOsc(ctx, _doorEnv(ctx, out, th, vol * 0.42, 0.02, 0.5, 0.9), 'sine', 110, th, 1.4, { f1: 82, slide: 1.2 });
                _doorOsc(ctx, _doorEnv(ctx, out, th, vol * 0.16, 0.02, 0.4, 0.7), 'triangle', 220, th, 1.1, { f1: 164, slide: 1.0 });
                return th - t + 1.5;
            },
            wayScope(ctx, t, out, vol) {
                /* the mount's brass creak as the tube tilts, a rising glassy shimmer (the lens filling with the stair), then a soft chord — the first step */
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.22, 0.01, 0.25, 0.2), t, 0.45, { type: 'bandpass', f0: 700, f1: 1400, slide: 0.4, q: 3.5 });
                [0, 0.12, 0.24].forEach(k => { const tk = t + 0.3 + k; _doorOsc(ctx, _doorEnv(ctx, out, tk, vol * 0.18, 0.02, 0.5, 0.6), 'sine', 880 + k * 900, tk, 1.1, { f1: 1760 + k * 900, slide: 1.0 }); });
                const tc = t + 0.9;
                [261.6, 329.6, 392.0, 523.3].forEach((f, i) => { _doorOsc(ctx, _doorEnv(ctx, out, tc + i * 0.04, vol * 0.14, 0.03, 0.9, 1.2), 'triangle', f, tc + i * 0.04, 2.0); });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, tc, vol * 0.1, 0.1, 1.2, 0.8), tc, 2.0, { type: 'lowpass', f0: 900, f1: 300, slide: 1.8 });
                return tc - t + 2.2;
            },
            wayTime(ctx, t, out, vol) {
                /* the disc spinning up (a rising hum, faster), the lever's clack, a bright chord as the light fills the cage, then the snap of the year changing */
                _doorOsc(ctx, _doorEnv(ctx, out, t, vol * 0.22, 0.05, 1.3, 0.3), 'sawtooth', 55, t, 1.7, { f1: 220, slide: 1.5 });
                _doorOsc(ctx, _doorEnv(ctx, out, t, vol * 0.14, 0.05, 1.3, 0.3), 'square', 110, t, 1.7, { f1: 440, slide: 1.5 });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t + 0.25, vol * 0.3, 0.002, 0.03, 0.08), t + 0.25, 0.12, { type: 'bandpass', f0: 1800, f1: 900, slide: 0.1, q: 2 });
                const tc = t + 1.35;
                [329.6, 415.3, 493.9, 659.3, 830.6].forEach((f, i) => { _doorOsc(ctx, _doorEnv(ctx, out, tc + i * 0.03, vol * 0.13, 0.02, 0.8, 1.0), 'triangle', f, tc + i * 0.03, 1.8); });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, tc + 0.5, vol * 0.35, 0.002, 0.05, 0.25), tc + 0.5, 0.35, { type: 'highpass', f0: 3000 });
                _doorOsc(ctx, _doorEnv(ctx, out, tc + 0.5, vol * 0.2, 0.002, 0.2, 0.4), 'sine', 1200, tc + 0.5, 0.6, { f1: 200, slide: 0.5 });
                return tc - t + 1.9;
            },
            wayGutter(ctx, t, out, vol) {
                /* the grate lifting (an iron scrape), the drop (a falling tone), the splash in the culvert, the echo */
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.3, 0.01, 0.3, 0.2), t, 0.5, { type: 'bandpass', f0: 500, f1: 900, slide: 0.45, q: 4 });
                _doorOsc(ctx, _doorEnv(ctx, out, t + 0.1, vol * 0.16, 0.01, 0.3, 0.2), 'square', 180, t + 0.1, 0.4, { f1: 120, slide: 0.35 });
                const td = t + 0.55;
                _doorOsc(ctx, _doorEnv(ctx, out, td, vol * 0.2, 0.02, 0.5, 0.3), 'sine', 420, td, 0.8, { f1: 90, slide: 0.75 });
                const ts = t + 1.3;
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, ts, vol * 0.45, 0.005, 0.25, 0.6), ts, 0.9, { type: 'lowpass', f0: 2400, f1: 600, slide: 0.8 });
                _doorOsc(ctx, _doorEnv(ctx, out, ts + 0.15, vol * 0.1, 0.05, 0.6, 0.9), 'sine', 96, ts + 0.15, 1.5, { f1: 64, slide: 1.4 });
                return ts - t + 1.8;
            },
            /* THE DEEP (2026-09-18): THE WHIRLPOOL — the sea's roar rising round you (a swirl of filtered noise), a
               falling tone as it takes you down, a deep boom at the bottom; THE UPWELLING — a rush of bubbles building,
               a rising tone, a breath of air at the top; the diver's PLUNGE (a splash and the muffled hum under) and
               SURFACE (the water clearing, a gasp of air); a hull BOARDED (a hollow wooden knock, the rock of it). */
            wayWhirl(ctx, t, out, vol) {
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.5, 0.25, 0.9, 0.5), t, 1.8, { type: 'bandpass', f0: 500, f1: 220, slide: 1.6, q: 1.2 });
                _doorOsc(ctx, _doorEnv(ctx, out, t + 0.2, vol * 0.22, 0.1, 0.8, 0.4), 'sine', 320, t + 0.2, 1.4, { f1: 60, slide: 1.3 });
                _doorOsc(ctx, _doorEnv(ctx, out, t + 0.5, vol * 0.14, 0.2, 0.6, 0.6), 'sawtooth', 110, t + 0.5, 1.2, { f1: 40, slide: 1.1 });
                const tb = t + 1.6;
                _doorOsc(ctx, _doorEnv(ctx, out, tb, vol * 0.3, 0.005, 0.5, 0.9), 'sine', 70, tb, 1.4, { f1: 38, slide: 1.2 });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, tb, vol * 0.2, 0.01, 0.4, 0.8), tb, 1.2, { type: 'lowpass', f0: 500, f1: 120, slide: 1.0 });
                return tb - t + 1.6;
            },
            wayUpwell(ctx, t, out, vol) {
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.42, 0.3, 0.8, 0.5), t, 1.7, { type: 'bandpass', f0: 900, f1: 2600, slide: 1.4, q: 0.9 });
                for (let i = 0; i < 9; i++) { const tb = t + 0.1 + i * 0.13 + (i % 2) * 0.03; _doorOsc(ctx, _doorEnv(ctx, out, tb, vol * 0.12, 0.003, 0.02, 0.07), 'sine', 500 + i * 130, tb, 0.09, { f1: 900 + i * 180, slide: 0.07 }); }
                _doorOsc(ctx, _doorEnv(ctx, out, t + 0.3, vol * 0.2, 0.2, 0.7, 0.5), 'sine', 90, t + 0.3, 1.3, { f1: 380, slide: 1.2 });
                const ts = t + 1.5;
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, ts, vol * 0.3, 0.01, 0.2, 0.6), ts, 0.9, { type: 'highpass', f0: 1400 });
                _doorOsc(ctx, _doorEnv(ctx, out, ts + 0.05, vol * 0.1, 0.02, 0.3, 0.3), 'triangle', 640, ts + 0.05, 0.4, { f1: 720, slide: 0.3 });
                return ts - t + 1.2;
            },
            seaDive(ctx, t, out, vol) {
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.5, 0.005, 0.15, 0.5), t, 0.7, { type: 'lowpass', f0: 3200, f1: 700, slide: 0.6 });
                _doorOsc(ctx, _doorEnv(ctx, out, t, vol * 0.3, 0.004, 0.05, 0.25), 'sine', 220, t, 0.3, { f1: 60, slide: 0.25 });
                _doorOsc(ctx, _doorEnv(ctx, out, t + 0.3, vol * 0.12, 0.3, 0.8, 0.9), 'sine', 55, t + 0.3, 1.8, { f1: 48, slide: 1.6 });
                return 2.2;
            },
            seaSurface(ctx, t, out, vol) {
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.4, 0.004, 0.12, 0.4), t, 0.6, { type: 'highpass', f0: 900 });
                for (let i = 0; i < 5; i++) { const tb = t + 0.05 + i * 0.08; _doorOsc(ctx, _doorEnv(ctx, out, tb, vol * 0.12, 0.003, 0.02, 0.06), 'sine', 800 + i * 160, tb, 0.08, { f1: 1300, slide: 0.06 }); }
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t + 0.35, vol * 0.22, 0.05, 0.25, 0.3), t + 0.35, 0.5, { type: 'bandpass', f0: 600, f1: 300, slide: 0.4, q: 0.8 });
                return 1.1;
            },
            seaBoard(ctx, t, out, vol) {
                _doorOsc(ctx, _doorEnv(ctx, out, t, vol * 0.4, 0.002, 0.03, 0.16), 'triangle', 180, t, 0.2, { f1: 120, slide: 0.15 });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.25, 0.002, 0.04, 0.14), t, 0.2, { type: 'lowpass', f0: 1200 });
                _doorOsc(ctx, _doorEnv(ctx, out, t + 0.25, vol * 0.18, 0.05, 0.4, 0.5), 'sine', 96, t + 0.25, 0.9, { f1: 80, slide: 0.8 });
                return 1.4;
            },
            wayRoad(ctx, t, out, vol) {
                /* a car passing on the road out: the engine's low tone rising then falling (the doppler), the tyres' hiss under it, a horn far off */
                _doorOsc(ctx, _doorEnv(ctx, out, t, vol * 0.14, 0.3, 0.9, 0.5), 'sawtooth', 70, t, 1.6, { f1: 52, slide: 1.4 });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.3, 0.25, 0.8, 0.6), t, 1.7, { type: 'lowpass', f0: 900, f1: 2200, slide: 0.7 });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t + 0.8, vol * 0.22, 0.05, 0.6, 0.5), t + 0.8, 1.0, { type: 'lowpass', f0: 2200, f1: 500, slide: 0.9 });
                _doorOsc(ctx, _doorEnv(ctx, out, t + 1.1, vol * 0.08, 0.04, 0.3, 0.2), 'square', 330, t + 1.1, 0.5, { f1: 300, slide: 0.4 });
                return 2.0;
            },
            wayStatic(ctx, t, out, vol) {
                _doorOsc(ctx, _doorEnv(ctx, out, t, vol * 0.12, 0.05, 0.9, 0.1), 'sawtooth', 60, t, 1.05);
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.4, 0.02, 0.8, 0.15), t, 1.0, { type: 'highpass', f0: 2500 });
                const lfo = ctx.createOscillator(); const lg = ctx.createGain();
                lfo.type = 'square'; lfo.frequency.value = 15.7; lg.gain.value = 0.35;
                const tremolo = ctx.createGain(); tremolo.gain.value = 0.65; lfo.connect(lg).connect(tremolo.gain);
                const g = _doorEnv(ctx, tremolo, t, vol * 0.3, 0.02, 0.8, 0.15); tremolo.connect(out);
                _doorNoiseSrc(ctx, g, t, 1.0, { type: 'bandpass', f0: 900, f1: 3200, slide: 0.9, q: 0.5 });
                lfo.start(t); lfo.stop(t + 1.05);
                const tt = t + 0.6;
                _doorOsc(ctx, _doorEnv(ctx, out, tt, vol * 0.25, 0.01, 0.2, 0.15), 'sawtooth', 2400, tt, 0.4, { f1: 300, slide: 0.35 });
                const tx = t + 1.05;
                _doorOsc(ctx, _doorEnv(ctx, out, tx, vol * 0.3, 0.001, 0.01, 0.05), 'square', 4200, tx, 0.03);
                return tx - t + 0.3;
            },
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
            /* THE DOOR GUN (2026-09-16): a retro ray-gun ZAP — a fast sweep down
               with a detuned partner, a click of noise at the trigger, a sub thump. */
            doorGunShot(ctx, t, out, vol) {
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.7, 0.001, 0.02, 0.05), t, 0.06, { type: 'highpass', f0: 2400, q: 0.8 });
                _doorOsc(ctx, _doorEnv(ctx, out, t, vol * 0.5, 0.002, 0.1, 0.12), 'sawtooth', 1500, t, 0.24, { f1: 240, slide: 0.2 });
                _doorOsc(ctx, _doorEnv(ctx, out, t, vol * 0.35, 0.002, 0.08, 0.1), 'square', 1500, t, 0.2, { f1: 330, slide: 0.16, detune: 11 });
                _doorOsc(ctx, _doorEnv(ctx, out, t, vol * 0.55, 0.001, 0.05, 0.14), 'sine', 140, t, 0.2, { f1: 46, slide: 0.14 });
                return 0.3;
            },
            /* the frame UNFOLDS on the surface: a low thump under a bright rising chirp, a shimmer */
            doorGunLand(ctx, t, out, vol) {
                _doorOsc(ctx, _doorEnv(ctx, out, t, vol * 0.6, 0.001, 0.06, 0.18), 'sine', 120, t, 0.24, { f1: 44, slide: 0.18 });
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, t, vol * 0.4, 0.001, 0.03, 0.12), t, 0.16, { type: 'bandpass', f0: 900, q: 1.2 });
                _doorOsc(ctx, _doorEnv(ctx, out, t + 0.04, vol * 0.32, 0.005, 0.12, 0.16), 'triangle', 420, t + 0.04, 0.3, { f1: 1260, slide: 0.22 });
                _doorOsc(ctx, _doorEnv(ctx, out, t + 0.16, vol * 0.2, 0.01, 0.2, 0.3), 'sine', 1680, t + 0.16, 0.5, { detune: 7 });
                return 0.7;
            },
            /* THE RECALL: the shot in reverse — a sweep UP, then the click home */
            doorGunRecall(ctx, t, out, vol) {
                _doorOsc(ctx, _doorEnv(ctx, out, t, vol * 0.45, 0.01, 0.22, 0.1), 'sawtooth', 260, t, 0.34, { f1: 1500, slide: 0.3 });
                _doorOsc(ctx, _doorEnv(ctx, out, t, vol * 0.3, 0.01, 0.2, 0.1), 'square', 330, t, 0.3, { f1: 1400, slide: 0.28, detune: -9 });
                const tk = t + 0.32;
                _doorNoiseSrc(ctx, _doorEnv(ctx, out, tk, vol * 0.6, 0.001, 0.015, 0.05), tk, 0.05, { type: 'highpass', f0: 2000, q: 0.8 });
                _doorOsc(ctx, _doorEnv(ctx, out, tk, vol * 0.5, 0.001, 0.05, 0.12), 'sine', 160, tk, 0.16, { f1: 52, slide: 0.12 });
                return 0.5;
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
                const vol = Math.max(0, Math.min(1, _mixLevel('door', key, _DOOR_SFX_GAIN[key] ?? 0.5) * (state.sfxVolume ?? 0.9) * (opts.volume ?? 1)));
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
           audio unlock, and fades in/out over ~1.2 s. The MUSIC over it is the
           `doorLobby` track (door_lobby.mp3, the user's hall theme, MASTER B4)
           in the foyer / the main hall / the containment rings — map.js
           syncMusicToState; the other rooms play the main theme.
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
