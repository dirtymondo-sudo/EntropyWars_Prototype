/* spell-camera.test.js — THE DIRECTOR'S PASS (2026-09-13).
   Source guards for the spell-camera rework:
     · the board-aware rig: _camGroundPx clamps off-board lookups to the
       nearest edge tile, _cineTpsAnchor clamps the pivot's ground read, the
       beam reel's end-cap reverse keeps its pivot on the victim's tile and
       cranes down when there is no room past the rim (THE beam edge bug —
       the strata used to fill the frame), the side dolly picks the side
       with the eye deeper on the board;
     · the sniper POV (first person + the eyelids) is owned by cine and
       released on every path (the sequence's cut-away, camera._apply's
       rig auto-release, _cineReleaseAllFx);
     · the flyover strike director (fly-by → pan → bomb follow → impact)
       is wired to Nuke / the Mech's Nuke / Artillery Strike, the VFX
       publishes the craft's path and drops the warhead from its altitude,
       the three flyovers are retimed so the craft is overhead at the drop,
       and the online relay carries the descent clock (RULE #2);
     · the eyelids CSS exists.
   Zero dependencies — node's test runner + the source files. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const BT = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');
const FX = fs.readFileSync(path.join(__dirname, 'three-vfx-effects.js'), 'utf8');
const ON = fs.readFileSync(path.join(__dirname, 'online.js'), 'utf8');
const CSS = fs.readFileSync(path.join(__dirname, 'styles-cinematic.css'), 'utf8');

function fnBody(src, name, len = 6000) {
    const i = src.indexOf('function ' + name + '(');
    assert.ok(i >= 0, name + ' is defined');
    return src.slice(i, i + len);
}

test('board-aware rig: the ground helper and the TPS anchor clamp onto the board', () => {
    const g = BT.slice(BT.indexOf('window._camGroundPx = function'), BT.indexOf('window._camGroundPx = function') + 1600);
    assert.match(g, /Math\.max\(0, Math\.min\(_bwc - 1, Math\.round\(tx\)\)\)/, '_camGroundPx clamps tx');
    assert.match(g, /Math\.max\(0, Math\.min\(_bhc - 1, Math\.round\(ty\)\)\)/, '_camGroundPx clamps ty');
    const a = fnBody(BT, '_cineTpsAnchor');
    assert.match(a, /_cineClampTile\(pos\.x, pos\.y, 0\)/, 'the pivot ground read is clamped');
    assert.match(a, /opts\.liftPx/, 'an explicit pivot lift for altitude shots');
    assert.ok(BT.includes('function _cineClampTile('), '_cineClampTile');
    assert.ok(BT.includes('function _cineEdgeRoom('), '_cineEdgeRoom');
});

test('the beam reel: end-cap reverse stays on the board, the side dolly picks the inside', () => {
    const e = fnBody(BT, 'cineEndCapReverse');
    assert.match(e, /_cineClampTile\(to\.x \+ dirx \* 0\.25, to\.y \+ diry \* 0\.25, 0\)/, 'pivot on the victim tile');
    assert.match(e, /_cineEdgeRoom\(_pv\.x \+ dirx \* dist, _pv\.y \+ diry \* dist\)/, 'room past the rim is measured');
    assert.match(e, /if \(room < 0\.4\)/, 'the high reverse kicks in with no room');
    assert.doesNotMatch(e, /to\.x \+ dirx \* 0\.8/, 'the old 0.8-past-the-victim pivot is gone');
    const s = fnBody(BT, 'cineSideDolly');
    assert.match(s, /const roomFor = \(yw\) =>/, 'side dolly scores each side');
    assert.match(s, /yaw = ra > rb \? yawA : yawB/, 'the side with more room wins');
});

test('the sniper POV is owned and released everywhere', () => {
    assert.ok(BT.includes('function cineSniperPov('), 'cineSniperPov');
    assert.ok(BT.includes('function _cineFpRelease('), '_cineFpRelease');
    const p = fnBody(BT, 'cineSniperPov');
    assert.match(p, /window\._shooterCamOwns/, 'never over Strike Mode');
    assert.match(p, /camera\._fpEye = true/, 'the first-person eye');
    assert.match(p, /camera\._cineFpOwned = true/, 'cine owns it');
    assert.match(p, /window\._ewFpHideUid = c\.id/, 'the shooter model is hidden');
    const r = fnBody(BT, '_cineFpRelease');
    assert.match(r, /camera\._fpEye = false/);
    assert.match(r, /window\._ewFpHideUid = null/);
    const rel = fnBody(BT, '_cineReleaseAllFx');
    assert.match(rel, /_cineFpRelease\(\)/, 'released with every other cine layer');
    assert.match(rel, /cineEyelidsClear\(\)/);
    assert.match(rel, /_cineTweenLiftCancel\(\)/);
    const ap = BT.slice(BT.indexOf('if (this._cineTps && this._cineShotId == null && !this._tpsHold) {'));
    assert.match(ap.slice(0, 600), /_cineFpOwned\) \{ try \{ _cineFpRelease\(\)/, 'camera._apply auto-release hands the eye back');
    for (const id of ['headshot', 'precisionShot', 'deadEye', 'kneecapShot', 'railgun']) {
        assert.match(BT, new RegExp('\\n\\s+' + id + '\\(ctx\\)\\s+\\{ return CINE_SEQUENCES\\._sniperKit\\('), id + ' rides the sniper kit');
    }
    const kit = BT.slice(BT.indexOf('_sniperKit(ctx, o = {})'), BT.indexOf('_sniperKit(ctx, o = {})') + 2400);
    assert.match(kit, /cineSniperPov\(caster, target/, 'beat 1 = the POV');
    assert.match(kit, /cineEyelidsBlink\(\)/, 'the blink on the shot');
    assert.match(kit, /_cineFpRelease\(\);/, 'the sequence hands the eye back before the bullet cam');
    assert.match(kit, /cineBulletCam\(caster, target/, 'the bullet is the hero part');
});

test('the eyelids: primitive + CSS', () => {
    assert.ok(BT.includes('function cineEyelids('), 'cineEyelids');
    assert.ok(BT.includes('function cineEyelidsBlink('), 'cineEyelidsBlink');
    assert.match(CSS, /\.cine-eyelids \{/, 'the overlay');
    assert.match(CSS, /\.cine-eyelids\.on \.cine-lid-top \{ transform: translateY\(calc\(-100% \+ var\(--lid-amt\) \* 100vh\)\); \}/, 'the top lid closes to the squint');
    assert.match(CSS, /@keyframes cineLidBlinkTop/, 'the blink');
    assert.match(CSS, /\.cine-eye-reticle/, 'the reticle');
});

test('the flyover strike: the detonation director, VFX path, warhead altitude, retimed flyovers, relay', () => {
    // The Nuke / Artillery Strike are DELAYED strikes — their camera is the
    // end-of-round playDetonationCinematic, not a cast-time sequence.
    const d = fnBody(BT, 'playDetonationCinematic', 16000);
    assert.match(d, /VFX\.getDescentFlyover && VFX\.getDescentFlyover\(_sid\)/, 'the director asks the VFX whether a craft flies it in');
    assert.match(d, /cineFlyBy\(ds, \{ altPx: alt, span: 11, yaw: yaw1 \}\)/, 'beat 1 = the fly-by');
    assert.match(d, /cineFlyByTrack\(sequenceId, \{ follow: 0\.35 \}\)/, 'beat 2 = the pan with the craft');
    assert.match(d, /cineFallFollow\(ds, \{/, 'beat 3 = the bomb follow');
    assert.match(d, /cineSkyWatch\(ds, \{ ms: fallMs/, 'meteor-class delayed strikes get the sky watch');
    assert.match(d, /cineGrade\('whiteout', 300\)/, 'the Nuke keeps its silhouette flash');
    assert.match(d, /_cineYawTowardBoard\(ds, /, 'the strike-tile yaws keep the eye on the board');
    assert.doesNotMatch(BT, /_flyoverStrike\(/, 'no dead cast-time flyover director');
    assert.match(FX, /getDescentFlyover: getDescentFlyover,/, 'the VFX exports the flyover query');
    assert.match(FX, /ndcY: \(fo\.ndcY != null \? fo\.ndcY : 0\.46\)/, 'fo.ndcY places the craft on the horizon line');
    assert.ok(BT.includes('function cineFlyBy('), 'cineFlyBy');
    assert.ok(BT.includes('function cineFallFollow('), 'cineFallFollow');
    assert.ok(BT.includes('function cineSkyWatch('), 'cineSkyWatch');
    assert.ok(BT.includes('function _cineTweenLift('), '_cineTweenLift');
    // the family layer: descent spells with no director get the sky watch
    assert.match(BT, /const _dc = ctx\.shotOpts && ctx\.shotOpts\.descentCam;/, 'the sky-fall family');
    assert.match(BT, /descentCam: opts\.descentCam \};/, 'shotOpts carries the descent clock');
    // VFX
    assert.match(FX, /window\._ewDescentCine = \{/, 'the VFX publishes the flight path');
    assert.match(FX, /fromZ: \(_flyRel != null && _flyRel > ts \* 0\.8\) \? _flyRel : undefined/, 'the warhead drops from the craft');
    const efx = JSON.parse(FX.match(/var _EFX_DATA = (\{.*\});\s*$/m)[1]);
    const fo = (id) => efx.E[id].fo;
    for (const [id, tele] of [['sharedNuke_descent', 850], ['nuke_descent', 950], ['raceArtilleryStrike_descent', 700]]) {
        const f = fo(id);
        assert.ok(f, id + ' has a flyover');
        // the craft is over the target (half the run) at the release (telegraphMs)
        assert.strictEqual(f.delayMs + f.durationMs / 2, tele, id + ' — craft overhead at the drop');
        assert.strictEqual(f.ndcY, 0.1, id + ' — the craft crosses on the horizon line of the level fly-by');
    }
    // online: the descent clock rides the camera relay both ways
    assert.match(ON, /camEvt\.descentCam = \{ telegraphMs: opts\.descentCam\.telegraphMs, descentMs: opts\.descentCam\.descentMs \};/);
    assert.match(ON, /if \(camEvt\.descentCam\) camOpts\.descentCam = camEvt\.descentCam;/);
});

test('the shot library names the new shots', () => {
    const lib = BT.slice(BT.indexOf('const CINE_SHOTS = {'), BT.indexOf('const CINE_SHOTS = {') + 1800);
    for (const k of ['sniperPov', 'flyBy', 'fallFollow', 'skyWatch', 'eyelids']) {
        assert.match(lib, new RegExp('\\n\\s+' + k + ':'), k + ' in CINE_SHOTS');
    }
});
