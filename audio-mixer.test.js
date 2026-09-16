// audio-mixer.test.js — THE MIXER (2026-09-16): per-song / per-cue master levels.
// Loads audio.js in a vm sandbox (a stub Audio, a stub localStorage, no DOM)
// and drives window.AudioMixer: precedence (local → shipped → table), the
// live reads every play path uses, export / import round-trips, the clamp,
// and source guards on the two settings buttons + the cache token.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const SRC = fs.readFileSync(path.join(__dirname, 'audio.js'), 'utf8');

function load(opts = {}) {
    const store = {};
    const localStorage = {
        getItem: k => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: k => { delete store[k]; },
    };
    const played = [];
    class Audio {
        constructor(src) { this.src = src; this.volume = 1; this.paused = true; this.loop = false; this.currentTime = 0; this.duration = 100; }
        play() { this.paused = false; played.push(this.src); return Promise.resolve(); }
        pause() { this.paused = true; }
        addEventListener() {}
    }
    const document = {
        getElementById: () => null,
        body: { dataset: {} },
        addEventListener() {},
        createElement: () => ({ style: {}, appendChild() {}, setAttribute() {} }),
        head: { appendChild() {} },
    };
    const sandbox = {
        console, Audio, document, localStorage,
        performance: { now: () => Date.now() },
        setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
        requestAnimationFrame: fn => setTimeout(() => fn(Date.now()), 0),
        state: Object.assign({ audioUnlocked: true, musicVolume: 1, sfxVolume: 1, ambienceVolume: 1, phase: 'menu' }, opts.state || {}),
        navigator: {},
        escapeHtml: s => s,
        musicVolumeSlider: null, sfxVolumeSlider: null, ambienceVolumeSlider: null,
        musicVolumeValue: null, sfxVolumeValue: null, ambienceVolumeValue: null,
    };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    if (opts.pre) vm.runInContext(opts.pre, sandbox);
    vm.runInContext(SRC, sandbox, { filename: 'audio.js' });
    return { sb: sandbox, store, played };
}

test('the block exists: the shipped table, the four channels, the one read at every play path', () => {
    assert.ok(/const AUDIO_MIX_SHIPPED = \{/.test(SRC));
    assert.ok(/_mixLevel\('music', key, AUDIO_BASE_VOLUMES\[key\]/.test(SRC), 'music reads the mixer');
    assert.ok(/_mixLevel\('sfx', key, SFX_BASE_VOLUMES\[key\]/.test(SRC), 'sfx reads the mixer');
    assert.ok(/_mixLevel\('ambience', key, AMBIENCE_BASE_VOLUMES\[key\]/.test(SRC), 'ambience reads the mixer');
    assert.ok(/_mixLevel\('door', key, _DOOR_SFX_GAIN\[key\]/.test(SRC), 'the door kit reads the mixer');
    assert.ok(/window\.AudioMixer = AudioMixer;/.test(SRC));
});

test('precedence: the table, then AUDIO_MIX_SHIPPED, then the local override; live reads follow', () => {
    const { sb } = load();
    const M = sb.AudioMixer;
    assert.strictEqual([...M.channels].join(','), 'music,sfx,ambience,door');
    assert.ok(M.keys('music').includes('battleThemeAlt2'));
    assert.ok(M.keys('sfx').includes('fireball'));
    assert.ok(M.keys('ambience').includes('ambNight'));
    assert.ok(M.keys('door').includes('skateOllie'));
    // the table
    assert.strictEqual(M.get('music', 'battleThemeAlt2'), 0.46);
    assert.strictEqual(M.base('sfx', 'fireball'), 0.82);
    // shipped beats the table
    sb.AUDIO_MIX_SHIPPED.music.battleThemeAlt2 = 0.3;
    assert.strictEqual(M.get('music', 'battleThemeAlt2'), 0.3);
    assert.strictEqual(M.shipped('music', 'battleThemeAlt2'), 0.3);
    assert.strictEqual(M.isLocal('music', 'battleThemeAlt2'), false);
    // local beats shipped
    assert.ok(M.set('music', 'battleThemeAlt2', 0.9));
    assert.strictEqual(M.get('music', 'battleThemeAlt2'), 0.9);
    assert.strictEqual(M.isLocal('music', 'battleThemeAlt2'), true);
    // reset one → back to shipped
    M.reset('music', 'battleThemeAlt2');
    assert.strictEqual(M.get('music', 'battleThemeAlt2'), 0.3);
    // the play-time reads see it: music base × slider, sfx base, ambience, door
    sb.state.musicVolume = 0.5;
    assert.ok(Math.abs(sb.getMusicBaseVolume('battleThemeAlt2') - 0.15) < 1e-9);
    M.set('sfx', 'fireball', 0.2);
    assert.ok(Math.abs(sb.getSfxBaseVolume('fireball') - 0.2) < 1e-9);
    M.set('ambience', 'ambNight', 0.1);
    assert.ok(Math.abs(sb._ambienceTargetVol('ambNight') - 0.1) < 1e-9);
    // the clamp: 0 ≤ level ≤ max; junk refused
    M.set('sfx', 'gun', 9);
    assert.strictEqual(M.get('sfx', 'gun'), M.max);
    M.set('sfx', 'gun', -1);
    assert.strictEqual(M.get('sfx', 'gun'), 0);
    assert.strictEqual(M.set('sfx', 'gun', 'loud'), false);
    assert.strictEqual(M.set('nope', 'gun', 0.5), false);
});

test('persistence: the local mix survives a reload through localStorage and clears when empty', () => {
    const a = load();
    a.sb.AudioMixer.set('door', 'skateOllie', 0.25);
    a.sb.AudioMixer.set('music', 'mainTheme', 1.2);
    const raw = a.store[a.sb.AudioMixer._lsKey];
    assert.ok(raw, 'saved');
    const b = load({ pre: `localStorage.setItem(${JSON.stringify(a.sb.AudioMixer._lsKey)}, ${JSON.stringify(raw)});` });
    assert.strictEqual(b.sb.AudioMixer.get('door', 'skateOllie'), 0.25);
    assert.strictEqual(b.sb.AudioMixer.get('music', 'mainTheme'), 1.2);
    b.sb.AudioMixer.reset();
    assert.strictEqual(b.store[b.sb.AudioMixer._lsKey], undefined, 'an empty mix leaves no key behind');
});

test('export: JSON = only what differs from the tables (shipped values kept); JS = the four tables folded; import round-trips', () => {
    const { sb } = load();
    const M = sb.AudioMixer;
    sb.AUDIO_MIX_SHIPPED.sfx.uiError = 0.5;          // shipped, differs from the table's 0.62
    M.set('music', 'victory', 0.68);                 // local but equal to the table → not exported
    M.set('sfx', 'explosion', 0.9);
    M.set('door', 'stamp', 0.6);
    const ov = M.overrides();
    assert.strictEqual(JSON.stringify(ov), JSON.stringify({ music: {}, sfx: { uiError: 0.5, explosion: 0.9 }, ambience: {}, door: { stamp: 0.6 } }));
    const json = M.exportJson();
    assert.strictEqual(JSON.stringify(JSON.parse(json)), JSON.stringify(ov));
    const js = M.exportJs();
    for (const name of ['AUDIO_BASE_VOLUMES', 'SFX_BASE_VOLUMES', 'AMBIENCE_BASE_VOLUMES', '_DOOR_SFX_GAIN', 'AUDIO_MIX_SHIPPED']) assert.ok(js.includes('const ' + name + ' = '), name);
    assert.ok(/^    explosion: 0\.9,$/m.test(js));
    assert.ok(/^    uiError: 0\.5,$/m.test(js));
    assert.ok(/^    fireball: 0\.82,$/m.test(js), 'an untouched cue keeps the table value');
    // every exported table line is a key the channel knows
    const sfxBlock = js.split('const SFX_BASE_VOLUMES = {')[1].split('};')[0];
    const sfxKeys = sfxBlock.match(/^\s+(\w+):/gm).map(l => l.trim().replace(':', ''));
    assert.strictEqual(sfxKeys.join(","), M.keys("sfx").join(","));
    // round-trip into a fresh sandbox
    const fresh = load();
    const r = fresh.sb.AudioMixer.importJson(json);
    assert.strictEqual(JSON.stringify(r), JSON.stringify({ ok: true, count: 3 }));
    assert.strictEqual(fresh.sb.AudioMixer.get('sfx', 'explosion'), 0.9);
    assert.strictEqual(fresh.sb.AudioMixer.get('sfx', 'uiError'), 0.5);
    assert.strictEqual(fresh.sb.AudioMixer.get('door', 'stamp'), 0.6);
    assert.strictEqual(fresh.sb.AudioMixer.importJson('{nope').ok, false);
});

test('audition: a cue plays at its level, a song goes through playMusic, a bed is kept alive by the ambience tick and stopped again', () => {
    const { sb, played } = load();
    const M = sb.AudioMixer;
    M.set('sfx', 'fireball', 0.33);
    assert.strictEqual(M.audition('sfx', 'fireball'), true);
    assert.ok(played.some(s => /fireball/.test(s)), 'the cue fired');
    assert.strictEqual(M.audition('sfx', 'notACue'), false);
    assert.strictEqual(M.audition('music', 'battleThemeAlt5'), true);
    assert.strictEqual(sb.state.currentMusic, 'battleThemeAlt5');
    assert.strictEqual(sb.state.currentBattleTrackKey, 'battleThemeAlt5', 'the shuffle continues from the auditioned song');
    assert.strictEqual(M.audition('ambience', 'ambCavern'), true);
    assert.strictEqual(M.auditioning(), 'ambCavern');
    assert.strictEqual(sb._desiredAmbienceKeys().join(","), "ambCavern", 'the tick wants the auditioned bed outside a battle');
    M.stopAudition();
    assert.strictEqual(M.auditioning(), null);
    assert.strictEqual(sb._desiredAmbienceKeys().length, 0, 'and nothing once it stops');
});

test('THE SOURCE SITES: the panel, the two settings buttons, the cache token', () => {
    const map = fs.readFileSync(path.join(__dirname, 'map.js'), 'utf8');
    const ui = fs.readFileSync(path.join(__dirname, 'ui.js'), 'utf8');
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    assert.ok(/AudioMixer\.open = function/.test(SRC));
    assert.ok(/id="amxExportJson"/.test(SRC) && /id="amxImport"/.test(SRC) && /id="amxDownload"/.test(SRC));
    assert.ok(/window\.AudioMixer&&window\.AudioMixer\.open\(\)/.test(map), 'main-menu Settings → Audio button');
    assert.ok(/window\.AudioMixer&&window\.AudioMixer\.open\(\)/.test(ui), 'pause menu Music tab button');
    const tokens = new Set(html.match(/\?v=[A-Za-z0-9-]+/g));
    assert.strictEqual(tokens.size, 1, 'one shared token');
    assert.ok(!/state\.\w*[mM]ix/.test(SRC), 'nothing on state');
});
