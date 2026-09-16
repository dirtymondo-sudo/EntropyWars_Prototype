/* THE PAUSE MENU + THE LAST ROSTER + THE LANDING (2026-09-15).
   ESC / P in the D.O.O.R. HQ opens an overlay INSIDE #hqPage (map.js
   _hqOpenPause) — never the Settings title page (that swap left the walker's
   page fading under the settings with the cursor still spoken for). PARTY
   = the party you took into battle last (state.js recordLastParty, filed by
   battle.js startMatch). The landing fix: a doorway is a camera blocker
   (three-renderer.js _hqCamInDoorway) and the walker lands 2.4 m in, so the
   door you came through no longer fills the screen.
   Runs recordLastParty / loadLastParty and _hqCamInDoorway in vm sandboxes,
   then source-guards every site. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const mp = read('map.js'), st = read('state.js'), bt = read('battle.js'), tr = read('three-renderer.js'), ix = read('index.html'), css = read('styles-base.css');

function between(src, a, b) {
    const i = src.indexOf(a);
    assert.ok(i >= 0, 'missing anchor ' + a);
    const j = src.indexOf(b, i);
    assert.ok(j > i, 'missing end anchor ' + b);
    return src.slice(i, j);
}

test('recordLastParty files the human seat and loadLastParty reads it back', () => {
    const block = between(st, "const LAST_PARTY_KEY = 'ew_last_party_v1';", 'function getItemCapForClass');
    const store = {};
    const ctx = {
        console, CTRL: { LOCAL: 'local', AI: 'ai', REMOTE: 'remote' },
        localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
        state: {
            controllers: { 1: 'ai', 2: 'local' }, gameMode: 'arena',
            partyBuilds: { 1: ['Warrior'], 2: ['Gunslinger', 'White Mage'] },
            partyNames: { 2: ['Dutch', 'Sister'] },
            partyMeta: { 2: [{ race: 'cowboy', gender: 'male', secondaryJob: 'Sniper', customSpells: ['raceLasso', ''] }, { race: 'nun', gender: 'female' }] },
            loadouts: { 2: [{ spells: ['raceLasso'], items: { healPotion: 2 }, equipment: { accessory1: 'binoculars' } }, null] },
        },
    };
    ctx.window = ctx;
    vm.createContext(ctx);
    vm.runInContext(block + '\nthis.recordLastParty = recordLastParty; this.loadLastParty = loadLastParty;', ctx);
    const rec = ctx.recordLastParty();
    assert.equal(rec.seat, 2, 'the LOCAL controller is the seat, not P1');
    assert.equal(rec.members.length, 2);
    assert.equal(rec.members[0].cls, 'Gunslinger');
    assert.equal(rec.members[0].name, 'Dutch');
    assert.equal(rec.members[0].meta.race, 'cowboy');
    assert.equal(rec.members[0].meta.secondaryJob, 'Sniper');
    assert.equal(rec.members[0].meta.customSpells.join(','), 'raceLasso', 'blank slots are dropped');
    assert.equal(rec.members[0].loadout.items.healPotion, 2);
    assert.equal(rec.members[0].loadout.equipment.accessory1, 'binoculars');
    assert.equal(rec.members[1].loadout, null, 'a missing loadout is null, never a throw');
    assert.equal(rec.mode, 'arena');
    assert.ok(store.ew_last_party_v1, 'persisted');
    ctx.window._ewLastPartyCache = null;
    const back = ctx.loadLastParty();
    assert.equal(back.members[1].meta.race, 'nun');
    /* the online seat wins over the controller scan */
    ctx.window.isOnlineMatch = () => true; ctx.window.getLocalPlayer = () => 1;
    assert.equal(ctx.recordLastParty().seat, 1);
    assert.equal(ctx.recordLastParty().members[0].cls, 'Warrior');
});

test('battle.js startMatch files the roster for a standard match only', () => {
    const sm = between(bt, 'function startMatch() {', 'const mpMode = getActiveMultiplayerMode();');
    assert.match(sm, /!state\.isCampaign && !state\._mdRun && !state\._spellLabMode && !window\._tutActive && typeof window\._ewRecordLastParty === 'function'/, 'never a campaign / MD floor / spell lab / tutorial lesson');
    assert.match(sm, /window\._ewRecordLastParty\(\)/);
});

test('_hqCamInDoorway blocks the slab on the room side of a flat-wall door and a polar door', () => {
    const fn = between(tr, 'function _hqCamInDoorway(px, pz, py) {', 'function _hqCamBlocked(px, pz, py) {');
    const ctx = { _hqNormDeg: d => { d = d % 360; if (d < 0) d += 360; return d; }, Math };
    vm.createContext(ctx);
    /* a north-wall door at (0, -4): the room is +z of it (normal 0,0,1); a rotunda door at 90° on a 15 m wall, the room inside */
    ctx._hq = { doors: [
        { box: { wx: 0, wz: -4, nx: 0, nz: 1 }, y0: 0, ow: 1.2, door: { id: 'a' } },
        { Rw: 15, inward: false, y0: 0, ow: 1.4, door: { id: 'b', deg: 90 } },
    ] };
    vm.runInContext(fn + '\nthis.f = _hqCamInDoorway;', ctx);
    const f = ctx.f;
    assert.equal(f(0, -3.5, 1.2), true, 'just inside the doorway (0.5 m in) — blocked');
    assert.equal(f(0.7, -2.7, 1.2), true, 'a leaf-swing width to the side, 1.3 m in — blocked');
    assert.equal(f(0, -2.6, 1.2), true, 'the slab is 1.5 m deep');
    assert.equal(f(0, -2.3, 1.2), false, 'past the slab the eye is free');
    assert.equal(f(1.5, -3.5, 1.2), false, 'beside the opening — free');
    assert.equal(f(0, -3.5, 3.4), false, 'over the door — free');
    assert.equal(f(0, -4.4, 1.2), true, 'the leaf plane itself (0.4 m behind) — blocked');
    assert.equal(f(0, -4.8, 1.2), false, 'well behind the wall — the shell test owns that');
    /* the polar door at 90°: the room is r < 15 */
    assert.equal(f(14.4, 0, 1.2), true, '0.6 m inside a rotunda door — blocked');
    assert.equal(f(13.4, 0, 1.2), false, '1.6 m inside — free');
    assert.equal(f(14.4, 2.5, 1.2), false, '2.5 m along the wall — free');
    assert.equal(f(14.4, 0.9, 1.2), true, 'within the opening + the swing — blocked');
});

test('the landing stands 2.4 m in from a flat wall (2.6 m from a curved one)', () => {
    const go = between(tr, 'function _hqGoTo(id, faceAway) {', 'var _hqApi = {');
    assert.match(go, /d\.box\.nx \* 2\.4\) \* U, d\.y0 \* U, \(d\.box\.wz \+ d\.box\.nz \* 2\.4\)/);
    assert.match(go, /d\.inward \? \(d\.Rw \+ 2\.6\) : \(d\.Rw - 2\.6\)/);
    const blocked = between(tr, 'function _hqCamBlocked(px, pz, py) {', 'function _hqFindTarget() {');
    assert.match(blocked, /if \(_hqCamInDoorway\(px, pz, py\)\) return true;/, 'the doorway is tested before the shell');
});

test('ESC / P opens the pause overlay inside #hqPage, never the settings page', () => {
    assert.match(mp, /onEscape: \(\) => \{ if \(_hqTerm\) \{ window\._hqTerminalClose\(\); return; \} if \(_hqPause\) \{ window\._hqClosePause\(\); return; \} if \(_hqPanelTarget\) window\._hqClosePanel\(\); else window\._hqOpenPause\(\); \}/);
    assert.match(mp, /window\._hqOpenSettings = function \(\) \{ window\._hqOpenPause\(\); \};/, 'the old name is the menu');
    const open = between(mp, 'window._hqOpenPause = function (cmd) {', 'window._hqOpenSettings = function');
    assert.match(open, /_hqSuspend\(\);/, 'the walk pauses (the pointer lock goes with it)');
    assert.match(open, /document\.exitPointerLock\(\)/, 'belt and braces on the lock');
    assert.doesNotMatch(open, /_showTitlePage|_openMainMenuSettings/, 'no page swap');
    assert.match(mp, /window\._hqClosePause = function \(\) \{[\s\S]{0,200}?return window\._hqResume\(\);/, 'RESUME comes back through _hqResume');
    /* every way out of the building drops the overlay */
    const resume = between(mp, 'window._hqResume = function () {', 'window._hqReturnOrMenu = function');
    assert.match(resume, /_hqPauseDrop\(\);/);
    const leave = between(mp, 'window._hqLeave = function (opts) {', 'window._hqGoRoom = function');
    assert.match(leave, /_hqPauseDrop\(\);/);
    const enter = between(mp, 'window._hqEnter = function', 'ThreeRenderer.hq.enter({');
    assert.match(enter, /_hqTermDrop\(\);\s*_hqPauseDrop\(\);/);
    /* the menu's commands */
    ['resume', 'party', 'officer', 'settings', 'directory', 'exit'].forEach(id => assert.match(mp, new RegExp("\\{ id: '" + id + "',"), 'command ' + id));
    assert.match(mp, /if \(id === 'exit'\) \{ _hqPauseDrop\(\); window\._hqExitToMenu\(\); return; \}/);
    assert.match(mp, /_hqOpenCounter\('directory'\);/);
    /* the party: the last roster built with the real createUnit */
    assert.match(mp, /function _hqLastParty\(\) \{ return \(typeof window\._ewLoadLastParty === 'function'\) \? window\._ewLoadLastParty\(\) : null; \}/);
    assert.match(mp, /u = createUnit\('hq-pause-' \+ i, rec\.seat \|\| 1, 0, 0, \{ cls: m\.cls, job: m\.cls \}, lo, meta\);/);
    assert.match(mp, /getUnitPassives\(u\)/);
    assert.match(mp, /_hqPauseBar\('HP'/);
    /* settings render INTO the overlay and rerender in place */
    assert.match(mp, /const body = window\._hqPauseSettingsBody \|\| document\.getElementById\('mmSettingsBody'\);/);
    assert.match(mp, /if \(typeof _hqPause !== 'undefined' && _hqPause && _hqPause\.cmd === 'settings' && window\._hqPauseSettingsBody\) \{ _renderMainMenuSettings\(\); return; \}/);
});

test('index.html carries the overlay and the hint; the CSS stacks it over the panel, under the load card', () => {
    assert.match(ix, /<div id="hqPause" class="hq-pause" style="display:none" role="dialog" aria-modal="true"/);
    ['hqPauseHead', 'hqPauseNav', 'hqPauseBody', 'hqPauseFoot'].forEach(id => assert.match(ix, new RegExp('id="' + id + '"'), id));
    assert.match(ix, /<span>ESC \/ P menu<\/span>/);
    assert.doesNotMatch(ix, /ESC \/ P settings/);
    const z = (sel) => { const m = css.match(new RegExp('\\n' + sel.replace(/[.#]/g, '\\$&') + ' \\{[^}]*z-index: (\\d+)')); assert.ok(m, sel + ' z-index'); return +m[1]; };
    assert.ok(z('.hq-pause') > z('.hq-panel'), 'over the panel');
    assert.ok(z('.hq-pause') < z('.hq-load'), 'under the load card');
    assert.match(css, /\.hq-pause \{[^}]*cursor: default;[^}]*pointer-events: auto;/, 'the cursor is ours in the menu');
    assert.match(css, /\.hq-pause-settings\.mm-settings-body \{ max-width: none;/);
});
