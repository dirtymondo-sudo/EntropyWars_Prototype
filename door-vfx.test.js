/* THE DOOR IN THE FRAME (DOOR_RACE_DESIGN.md rev 2, 2026-09-14): the DOOR
   agent's board door is a CATALOGUE leaf (never a procedural plank), and
   every one of the seven abilities fires a door recipe from the
   _spell3DGeometry registry. Source guards on the three files. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const battle = read('battle.js'), vfx = read('three-vfx-effects.js'), rend = read('three-renderer.js');

function between(src, a, b) {
    const i = src.indexOf(a); assert.ok(i >= 0, 'missing anchor ' + a);
    const j = src.indexOf(b, i); assert.ok(j > i, 'missing end anchor ' + b);
    return src.slice(i, j);
}

test('the board door is the catalogue leaf on a DOOR-issue frame, facing its twin', () => {
    const body = between(rend, 'function _buildDoor3D(d)', 'function _buildTunnelMound3D(');
    assert.ok(/_doorLeafFor\(\)/.test(body), 'reads the leaf through _doorLeafFor');
    assert.ok(/_miscModelInstance\(_hqModelUrl\(cat\)/.test(body), 'the leaf is the catalogue GLB');
    assert.ok(/matPick: _hqPropMatPick/.test(body), 'shared Lambert conversions (never disposed on rebuild)');
    assert.ok(/_hqMat\('teal'/.test(body) && /_hqMat\('stone'/.test(body), 'the crossing frame material');
    assert.ok(!/BoxGeometry\(W, H - T \* 0\.2/.test(body) && !/wood\.png/.test(body), 'no procedural plank leaf');
    assert.ok(/out\.rotation\.y = tw \? Math\.atan2\(tw\.x - d\.x, tw\.y - d\.y\)/.test(body), 'faces the twin');
    assert.ok(/cat\.hinge === 'right'/.test(body) && /cat\.open === 'slide'/.test(rend), 'the catalogue hinge / slide');
    assert.ok(/warmDoor/.test(body), 'warms the VFX leaf cache');
    assert.ok(/function _doorLeafFor\(\)/.test(rend) && /_introLeafFor\(\(typeof activeGameMode/.test(rend), 'the map\'s own threshold leaf');
    assert.ok(/leaf_hollow_core/.test(between(rend, 'function _doorLeafFor()', 'var DOOR3D_OPEN_ANGLE')), 'the plain door as the fallback');
    assert.ok(/doorLeaf: function \(\) \{ return _doorLeafFor\(\); \}/.test(rend), 'exposed on the renderer API');
});

test('every door ability has a door recipe in the registry', () => {
    const sec = between(vfx, "THE DOOR AGENT'S DOORS", 'THE BEAM DEFS: Tsunami');
    for (const id of ['raceKnockKnock', 'raceBreakingEntering:door', 'raceSpecialDelivery', 'raceSlam', 'raceExit', 'raceExit:out', 'raceLongWayRound', 'raceTrapdoor', 'raceTrapdoor:out']) {
        assert.ok(sec.includes(`'${id}':`), 'registry entry ' + id);
    }
    assert.ok(/function _sigDoorRig3D\(/.test(sec) && /_wpnInstance\(key, oh/.test(sec), 'the rig wears the leaf through the weapon-model cache');
    assert.ok(/window\.ThreeRenderer\.doorLeaf\(\)/.test(sec), 'the same leaf as the board door');
    assert.ok(/_WPN_MODELS\[key\] = \{ url: base \+ encodeURIComponent\(leaf\.cat\.file\), axis: 'y'/.test(sec), 'registered as door:<key>');
    for (const fn of ['_sigDoorPortal3D', '_sigDoorKnock3D', '_sigDoorSlam3D', '_sigDoorDelivery3D', '_sigDoorNetwork3D']) {
        assert.ok(new RegExp('function ' + fn + '\\(').test(sec), fn);
        assert.ok(new RegExp(fn + '[\\s\\S]*_sigRunOwned\\(').test(sec), fn + ' owns its group');
    }
    assert.ok(!/new THREE\.PlaneGeometry\([^)]*\)\s*,\s*leafMat\)[\s\S]{0,80}wood/.test(sec), 'no procedural plank in the recipes');
    assert.ok(/warmDoor: _doorFxWarm/.test(vfx), 'the warm hook is exported');
    assert.ok(/no procedural|Never a procedural leaf/i.test(sec), 'the rule is written down');
});

test('battle.js fires a door recipe at every door ability', () => {
    assert.ok(/window\._doorGeom = function\(id, x, y, extra\)/.test(battle), 'the one fire helper');
    const fires = id => (battle.match(new RegExp("window\\._doorGeom\\('" + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "'", 'g')) || []).length;
    assert.equal(fires('raceKnockKnock'), 3, 'toggle + both placed doors');
    assert.equal(fires('raceBreakingEntering:door'), 1);
    assert.equal(fires('raceSpecialDelivery'), 1);
    assert.equal(fires('raceSlam'), 2, 'both ends');
    assert.equal(fires('raceExit'), 1);
    assert.equal(fires('raceExit:out'), 1, 'the return out of the twin');
    assert.equal(fires('raceLongWayRound'), 1);
    assert.equal(fires('raceTrapdoor'), 1);
    assert.equal(fires('raceTrapdoor:out'), 1, 'the drop out of the far door');
    /* the delivery's plain projectile is the fallback only */
    assert.ok(/if \(!window\._doorGeom\('raceSpecialDelivery'[\s\S]{0,200}playProjectile\(_dvFrom\.x/.test(battle), 'projectile only when the recipe did not run');
    /* the Long Way Round's door list rides as a relay-safe string */
    assert.ok(/doors: _doors\(\)\.filter[\s\S]{0,120}\.join\(';'\)/.test(battle), 'doors as "x,y;x,y"');
});
