/* THE DOOR IN THE FRAME (DOOR_RACE_DESIGN.md rev 2 → rev 3, 2026-09-20): the
   board door is a CATALOGUE leaf (never a procedural plank), every ability of
   the rev 3 kit fires a door recipe from the _spell3DGeometry registry, and
   every one of them starts as a SHOT from the door gun. Source guards. */
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
    assert.ok(!/BoxGeometry\(W, H - T \* 0\.2/.test(body) && !/wood\.png/.test(body), 'no procedural plank leaf');
    assert.ok(/out\.rotation\.y = tw \? Math\.atan2\(tw\.x - d\.x, tw\.y - d\.y\)/.test(body), 'faces the twin');
    assert.ok(/warmDoor/.test(body), 'warms the VFX leaf cache');
    assert.ok(/doorLeaf: function \(\) \{ return _doorLeafFor\(\); \}/.test(rend), 'exposed on the renderer API');
});

test('every rev 3 ability has a door recipe in the registry, and every recipe owns its group', () => {
    const sec = between(vfx, "THE DOOR AGENT'S DOORS", 'THE BEAM DEFS: Tsunami');
    for (const id of ['raceSwingDoor:swing', 'raceDoorDash:out', 'raceAirMail', 'raceTrapdoor:set', 'raceTrapdoor', 'raceDropIn:door', 'raceBreakingEntering:door', 'raceDoorGun:shot']) {
        assert.ok(sec.includes(`'${id}':`), 'registry entry ' + id);
    }
    assert.ok(/function _sigDoorRig3D\(/.test(sec) && /_wpnInstance\(key, oh/.test(sec), 'the rig wears the leaf through the weapon-model cache');
    assert.ok(/o\.lift \? o\.lift \* ts \* 0\.95 : 0/.test(sec) && /o\.face === 'down'/.test(sec), 'the rig hangs in the air, face down');
    assert.ok(/window\.ThreeRenderer\.doorLeaf\(\)/.test(sec), 'the same leaf as the board door');
    for (const fn of ['_sigDoorGunShot3D', '_sigDoorSwing3D', '_sigDoorAirMail3D', '_sigTrapdoorSet3D', '_sigDoorDropIn3D', '_sigOpenHouse3D', '_sigDoorPortal3D']) {
        assert.ok(new RegExp('function ' + fn + '\\(').test(sec), fn);
        assert.ok(new RegExp(fn + '[\\s\\S]*?_sigRunOwned\\(').test(sec), fn + ' owns its group');
    }
    assert.ok(!/\bwindow\.setTimeout\(/.test(sec), 'every timer in the section is _fxDelay');
    assert.ok(/no procedural|Never a procedural leaf/i.test(sec), 'the rule is written down');
    assert.ok(/sigOpenHouse3D: _sigOpenHouse3D,/.test(vfx), 'the execution is exported');
    /* the SPELL_MAP rows: five ids, each its own impact def, the two damage rows on the geometry registry by id */
    for (const [id, imp] of [['raceSwingDoor', 'raceSwingDoor_impact'], ['raceBreakingEntering', 'raceStompOut_impact'], ['raceAirMail', 'raceAirMail_impact'], ['raceTrapdoor', 'raceTrapdoor_impact'], ['raceDropIn', 'raceDropIn_impact']]) {
        assert.ok(vfx.includes("SPELL_MAP['" + id + "']") && vfx.includes("impact: '" + imp + "'"), id + ' → ' + imp);
        assert.ok(vfx.includes("EFFECTS['" + imp + "'] = {"), 'EFFECTS.' + imp);
    }
    for (const id of ['raceSpecialDelivery', 'raceSlam', 'raceExit', 'raceLongWayRound']) assert.ok(!vfx.includes("SPELL_MAP['" + id + "']"), id + ' has no map row any more');
});

test('battle.js shoots the door gun at every ability', () => {
    assert.ok(/window\._doorGeom = function\(id, x, y, extra\)/.test(battle), 'the one fire helper');
    const fires = id => (battle.match(new RegExp("window\\._doorGeom\\('" + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "'", 'g')) || []).length;
    assert.ok(fires('raceDoorGun:shot') >= 5, 'the travel handler, the way in, the drop in, the trapdoor: ' + fires('raceDoorGun:shot'));
    assert.equal(fires('raceBreakingEntering:door'), 2, 'the way in + Door Dash\'s near door');
    assert.equal(fires('raceDoorDash:out'), 1);
    assert.equal(fires('raceSwingDoor:swing'), 1, 'the swing, fired from the hinge');
    assert.equal(fires('raceDropIn:door'), 1);
    assert.equal(fires('raceTrapdoor:set'), 1);
    assert.equal(fires('raceTrapdoor'), 3, 'the spring: the victim\'s tile (the fallback) + the other three; the dormant doorTrap branch keeps its one');
    /* the gun's shot into the air for the drop */
    assert.ok(/'raceDoorGun:shot', land\.x, land\.y, \{ fromX: unit\.x, fromY: unit\.y, lift: spell\.dropTiles \|\| 3 \}/.test(battle), 'the shot lifts for Drop In');
});
