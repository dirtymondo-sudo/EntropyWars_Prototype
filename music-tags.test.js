// music-tags.test.js — THE PLAYLIST (2026-09-16): songs wear tags, places ask
// for tags. Loads audio.js in a vm sandbox (a stub Audio, a stub localStorage,
// no DOM) and drives window.MusicTags / playContextMusic / skipTrack: the
// catalogue, multiple tags per song, local → shipped precedence, the pools,
// the mood preference, the fallback chain, the shuffle bag, the loop rule,
// the context sync and ⏭ everywhere, export / import, and the source sites.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const SRC = fs.readFileSync(path.join(__dirname, 'audio.js'), 'utf8');
const MAP = fs.readFileSync(path.join(__dirname, 'map.js'), 'utf8');
const UI = fs.readFileSync(path.join(__dirname, 'ui.js'), 'utf8');

function load(opts = {}) {
    const store = {};
    const localStorage = {
        getItem: k => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: k => { delete store[k]; },
    };
    const played = [];
    class Audio {
        constructor(src) { this.src = src; this.volume = 1; this.paused = true; this.loop = false; this.currentTime = 0; this.duration = 100; this._ev = {}; }
        play() { this.paused = false; played.push(this.src); return Promise.resolve(); }
        pause() { this.paused = true; }
        addEventListener(n, fn) { (this._ev[n] = this._ev[n] || []).push(fn); }
        fire(n) { (this._ev[n] || []).forEach(fn => fn()); }
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
const tick = () => new Promise(r => setTimeout(r, 5));
// arrays from the vm realm never deepStrictEqual a local one (a different Array) — compare joined
const same = (a, b, msg) => assert.strictEqual(Array.from(a).join(','), Array.from(b).join(','), msg);

test('the two new facility songs are in every table and the display names', () => {
    for (const k of ['doorLobby2', 'doorLobby3']) {
        assert.ok(new RegExp(k + ':\\s+`\\$\\{_R2_BASE\\}/music/door%20hq%20[23]\\.mp3`').test(SRC), k + ' on R2 (spaces encoded)');
        assert.ok(new RegExp(k + ": '\\./assets/music/door hq [23]\\.mp3'").test(SRC), k + ' local fallback');
        assert.ok(new RegExp(k + ': 0\\.42,').test(SRC), k + ' base volume');
        assert.ok(new RegExp(k + ": 'DOOR HQ [23]'").test(UI), k + ' display name');
    }
    const { sb } = load();
    assert.ok(sb.audioTracks.doorLobby2 && sb.audioTracks.doorLobby3);
});

test('the catalogue: five dimensions, every shipped tag is a known tag, every song is tagged, a song wears MANY tags', () => {
    const { sb } = load();
    const M = sb.MusicTags;
    same(Object.keys(M.groups), ['role', 'mood', 'energy', 'style', 'setting']);
    const all = new Set(M.all);
    assert.strictEqual(all.size, M.all.length, 'no tag twice');
    for (const k of Object.keys(sb.MUSIC_TAGS_SHIPPED)) {
        assert.ok(sb.audioTracks[k], 'shipped tags name a real song: ' + k);
        for (const t of sb.MUSIC_TAGS_SHIPPED[k]) assert.ok(all.has(t), `${k}: unknown tag ${t}`);
    }
    for (const k of Object.keys(sb.audioTracks)) assert.ok(M.get(k).length, 'every song is tagged: ' + k);
    // the same song, several tags, several groups
    const t = M.get('doorLobby2');
    assert.ok(t.includes('lobby') && t.includes('hq') && t.includes('calm') && t.includes('facility'));
    assert.strictEqual(M.groupOf('lobby'), 'role');
    assert.strictEqual(M.groupOf('horror'), 'mood');
    assert.strictEqual(M.groupOf('nope'), null);
    // the old behaviour is the shipped ROLE tagging
    same(M.pool('title'), ['titleTheme']);
    assert.ok(M.pool('battle').length >= 29 && M.pool('battle').includes('mainTheme'));
    same(M.pool('lobby'), ['doorLobby', 'doorLobby2', 'doorLobby3'], 'the facility rotation');
    same(M.pool('hq'), ['doorLobby', 'doorLobby2', 'doorLobby3']);
    assert.ok(!M.pool('hq').includes('mainTheme'), 'the main theme no longer plays in every other room');
});

test('precedence + persistence: local tagging beats shipped, toggle adds and removes, reset returns, the store round-trips', () => {
    const a = load();
    const M = a.sb.MusicTags;
    assert.strictEqual(M.isLocal('battleThemeAlt5'), false);
    assert.ok(M.toggle('battleThemeAlt5', 'lobby'));
    assert.ok(M.has('battleThemeAlt5', 'lobby') && M.has('battleThemeAlt5', 'battle'), 'a tag added keeps the others');
    assert.ok(M.isLocal('battleThemeAlt5'));
    assert.ok(M.pool('lobby').includes('battleThemeAlt5'), 'the pool follows the tag');
    assert.ok(M.toggle('battleThemeAlt5', 'lobby'));
    assert.ok(!M.has('battleThemeAlt5', 'lobby'));
    assert.strictEqual(M.toggle('battleThemeAlt5', 'notATag'), false);
    assert.ok(M.set('mainTheme', ['hq', 'Menu', 'junk', 'hq']));
    same(M.get('mainTheme'), ['hq', 'menu'], 'normalised, deduplicated, unknown dropped');
    const raw = a.store[M._lsKey];
    assert.ok(raw);
    const b = load({ pre: `localStorage.setItem(${JSON.stringify(M._lsKey)}, ${JSON.stringify(raw)});` });
    same(b.sb.MusicTags.get('mainTheme'), ['hq', 'menu']);
    b.sb.MusicTags.reset('mainTheme');
    same(b.sb.MusicTags.get('mainTheme'), b.sb.MusicTags.shipped('mainTheme'));
    b.sb.MusicTags.reset();
    assert.strictEqual(b.store[M._lsKey], undefined, 'an empty tagging leaves no key');
});

test('pools: moods are taken first, a thin mood match is topped up, an empty role falls back down the chain', () => {
    const { sb } = load();
    const M = sb.MusicTags;
    const horror = M.pool('battle', ['horror']);
    assert.ok(horror.every(k => M.has(k, 'battle')), 'still battle songs');
    assert.ok(horror.includes('battleThemeAlt12'), 'the horror-tagged song is in');
    // one horror song only → topped up with the rest, horror first
    assert.strictEqual(horror[0], 'battleThemeAlt12');
    assert.ok(horror.length > 1);
    // two or more matches → the pool is just them
    M.set('battleThemeAlt11', ['battle', 'horror']);
    const h2 = M.pool('battle', ['horror']);
    same(h2.slice().sort(), ['battleThemeAlt11', 'battleThemeAlt12']);
    // no boss song → falls to battle; strip every hq/lobby tag → hq falls to lobby falls to hq … → menu chain ends at the main theme
    same(M.pool('boss'), M.pool('battle'));
    for (const k of ['doorLobby', 'doorLobby2', 'doorLobby3']) M.set(k, ['calm']);
    same(M.pool('lobby'), ['mainTheme'], 'the last resort is the main theme');
    same(M.pool('nope'), []);
});

test('the shuffle bag: every song once before a repeat, never the excluded song first, a pool of one just returns it', () => {
    const { sb } = load();
    const M = sb.MusicTags;
    const seen = [];
    for (let i = 0; i < 3; i++) seen.push(M.draw('lobby', null, [seen[seen.length - 1]]));
    same(seen.slice().sort(), ['doorLobby', 'doorLobby2', 'doorLobby3'], 'the bag empties before any repeat');
    for (let i = 0; i < 40; i++) {
        const last = seen[seen.length - 1];
        const next = M.draw('lobby', null, [last]);
        assert.notStrictEqual(next, last, 'never the same song twice in a row');
        seen.push(next);
    }
    assert.strictEqual(M.draw('title', null, ['titleTheme']), 'titleTheme', 'a pool of one');
});

test('the context sync: the hall draws from lobby and loops nothing, the title loops its one song, a song that still fits stays, a change draws anew', async () => {
    const { sb } = load();
    const T = sb.audioTracks;
    await sb.playContextMusic('title');
    assert.strictEqual(sb.state.currentMusic, 'titleTheme');
    assert.strictEqual(T.titleTheme.loop, true, 'a pool of one loops');
    await sb.playContextMusic('lobby');
    const first = sb.state.currentMusic;
    assert.ok(['doorLobby', 'doorLobby2', 'doorLobby3'].includes(first));
    assert.strictEqual(T[first].loop, false, 'a pool of three advances');
    same(sb.musicContext().id, 'lobby');
    // walking into an office (hq) keeps the song — it fits that pool too
    await sb.playContextMusic('hq');
    assert.strictEqual(sb.state.currentMusic, first, 'a song that fits the new pool is kept');
    // the menu does not fit → a new draw
    await sb.playContextMusic('menu');
    assert.strictEqual(sb.state.currentMusic, 'mainTheme');
    assert.strictEqual(T.mainTheme.loop, true, 'the menu pool is one song today → loops');
    // back in the hall: the end of a song advances within the pool
    await sb.playContextMusic('lobby');
    const cur = sb.state.currentMusic;
    T[cur].currentTime = T[cur].duration;
    T[cur].fire('ended');
    await tick();
    assert.notStrictEqual(sb.state.currentMusic, cur, 'ended → the next lobby song');
    assert.ok(sb.MusicTags.pool('lobby').includes(sb.state.currentMusic));
    // a pinned 🔁 is never advanced
    const pinned = sb.state.currentMusic;
    T[pinned].loop = true; T[pinned]._pinnedLoop = true;
    T[pinned].fire('ended');
    await tick();
    assert.strictEqual(sb.state.currentMusic, pinned);
});

test('⏭ anywhere: skipTrack draws the next song of the current pool — the menu, the hall, the battle', async () => {
    const { sb } = load();
    await sb.playContextMusic('lobby');
    const a = sb.state.currentMusic;
    assert.strictEqual(await sb.skipTrack(), true);
    assert.notStrictEqual(sb.state.currentMusic, a);
    assert.ok(sb.MusicTags.pool('lobby').includes(sb.state.currentMusic), 'still a facility song');
    // a battle: the map's moods ride the context
    sb.state.phase = 'battle';
    sb.state.mapEnv = { near: 'haunted' };
    sb.setMusicContext('battle');
    same(sb.musicContext().moods, ['horror', 'dark', 'horror_house']);
    same(sb.musicContext().pool, ['battleThemeAlt11', 'battleThemeAlt12'], 'the dark / horror songs ARE the haunted pool (two matches = no top-up)');
    await sb.skipTrack();
    assert.ok(sb.MusicTags.has(sb.state.currentMusic, 'battle'));
    assert.strictEqual(sb.state.currentBattleTrackKey, sb.state.currentMusic, 'the battle shuffle follows');
    // the legacy battle names still answer from the battle pool
    sb.refillBattleShuffleBag();
    const d = sb.drawFromBattleShuffleBag(sb.state.currentMusic);
    assert.ok(sb.MusicTags.has(d, 'battle') && d !== sb.state.currentMusic);
    // a song's mood tag from env.music on the meta row
    sb.state.mapEnv = { music: ['sacred'] };
    sb.setMusicContext('battle');
    assert.strictEqual(sb.musicContext().pool[0], 'battleThemeAlt9');
});

test('export / import: the tagging rides the mixer JSON as `tags`, the JS export is a paste-over table', () => {
    const { sb } = load();
    const M = sb.MusicTags, X = sb.AudioMixer;
    M.set('battleThemeAlt3', ['battle', 'hq', 'upbeat']);
    X.set('sfx', 'fireball', 0.3);
    const json = X.exportJson();
    const o = JSON.parse(json);
    same(o.tags, { battleThemeAlt3: ['battle', 'hq', 'upbeat'] });
    assert.strictEqual(o.sfx.fireball, 0.3);
    assert.ok(X.exportJs().includes('const MUSIC_TAGS_SHIPPED = {'));
    assert.ok(/^    battleThemeAlt3: \["battle", "hq", "upbeat"\],$/m.test(X.exportJs()));
    const fresh = load();
    const r = fresh.sb.AudioMixer.importJson(json);
    assert.strictEqual(r.ok, true);
    same(fresh.sb.MusicTags.get('battleThemeAlt3'), ['battle', 'hq', 'upbeat']);
    assert.strictEqual(fresh.sb.AudioMixer.get('sfx', 'fireball'), 0.3);
    // a bare tag object imports too
    assert.strictEqual(fresh.sb.MusicTags.importJson(M.exportJson()).count, 1);
    assert.strictEqual(fresh.sb.MusicTags.importJson('{').ok, false);
});

test('THE SOURCE SITES: the sync resolves a context, ⏭ is ungated, the panel has the two tabs, the settings rows, nothing on state', () => {
    assert.ok(/function musicContextForState\(\)/.test(MAP));
    assert.ok(/return \{ ctx: 'lobby', moods: null \};/.test(MAP) && /return \{ ctx: 'exploration', moods: _musicMoodsForSite\(site\) \};/.test(MAP) && /return \{ ctx: 'hq', moods: null \};/.test(MAP));
    assert.ok(/return await playContextMusic\(c\.ctx, \{ moods: c\.moods \}\);/.test(MAP));
    assert.ok(/setMusicContext\('battle'\)/.test(MAP), 'the battle stamps its context');
    assert.ok(!/if \(\(state\.phase !== 'battle' && state\.phase !== 'editor'\)/.test(MAP), 'the skip is no longer gated to battle / editor');
    assert.ok(/window\._buildNowPlayingHTML = function/.test(MAP) && /typeof window\._buildNowPlayingHTML === 'function' \? window\._buildNowPlayingHTML\('window\._openMainMenuSettings\(\);'\)/.test(MAP), 'the Now Playing row in Settings → Audio');
    assert.ok(/AudioMixer\.open\('tags'\)/.test(MAP) && /AudioMixer\.open\('tags'\)/.test(UI), 'the Song Tags buttons');
    assert.ok(/function _mixRenderTagsTab\(/.test(SRC) && /data-tag-key=/.test(SRC) && /data-ctx-play=/.test(SRC));
    assert.ok(/_pinnedLoop = audioTracks\[key\]\.loop/.test(UI), 'the pause menu pin');
    assert.ok(!/battleMusicKeys\b/.test(SRC), 'the hard-wired battle list is gone');
    assert.ok(!/state\.\w*[tT]ags?\b/.test(SRC), 'nothing on state');
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    assert.strictEqual(new Set(html.match(/\?v=[A-Za-z0-9-]+/g)).size, 1, 'one shared token');
});
