'use strict';
// THE 3D LINE (mondo 2026-09-25): a beam flies straight from the caster's body
// to the AIMED body and on at that slope; it strikes only bodies the line runs
// through. Fractal Stitch (beamZigzag) threads every enemy in its lane. Poison /
// Leech Seed rows are never offered against an airborne enemy.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const data = require('./load-data').loadGameData();
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const battle = read('battle.js');

function fn(src, name) {
    const start = src.indexOf('        function ' + name + '(');
    assert.ok(start >= 0, 'missing ' + name);
    const end = src.indexOf('\n        }', start);
    return src.slice(start, end + '\n        }'.length);
}
const NAMES = ['_beamColumnUnits', '_beamUnitZ', 'lineBeamAimZ', 'lineBeamLine', 'beamBodyOnLine',
    '_beamAtGround', '_beamCellVictims', 'lineBeamHits', 'lineBeamPlan'];

function board(units, opts = {}) {
    const state = { units };
    const c = {
        state, window: {},
        getHeightAt: () => 0,
        isInside: (x, y) => x >= 0 && y >= 0 && x < 12 && y < 12,
        isTerrainPassable: () => true,
        isUnitAirborne: u => (u.z || 0) > 0,
        unitAt: (x, y) => {
            const here = units.filter(u => !u.dead && u.x === x && u.y === y);
            return here.find(u => !(u.z > 0)) || here[0] || null;
        },
        _lineLosBlocked: opts.los || (() => false),
        getLineSpellLaneOffsets: () => [],
    };
    vm.createContext(c);
    vm.runInContext(NAMES.map(n => fn(battle, n)).join('\n'), c);
    return c;
}
const ids = a => JSON.parse(JSON.stringify(a));
const caster = () => ({ id: 'c', player: 1, x: 2, y: 5, z: 0 });
const beam = { id: 'raceBalefulGaze', kind: 'line', range: 5 };
const stitch = data.SPELL_BY_ID.raceFractalStitch;

test('a beam aimed at a flyer skips the lower enemy behind it', () => {
    const me = caster();
    const flyer = { id: 'f', player: 2, x: 5, y: 5, z: 2 };
    const behind = { id: 'g', player: 2, x: 6, y: 5, z: 0 };
    const c = board([me, flyer, behind]);
    const plan = c.lineBeamPlan(me, beam, 1, 0, { x: 5, y: 5, z: 2 });
    assert.deepEqual(ids(plan.victims.map(u => u.id)), ['f']);
    assert.ok(plan.cells[plan.cells.length - 1].z > 2, 'the line keeps climbing past the flyer');
});

test('a level beam at a grounded enemy passes under the flyer over the lane', () => {
    const me = caster();
    const flyer = { id: 'f', player: 2, x: 4, y: 5, z: 2 };
    const ground = { id: 'g', player: 2, x: 6, y: 5, z: 0 };
    const c = board([me, flyer, ground]);
    assert.deepEqual(ids(c.lineBeamPlan(me, beam, 1, 0, { x: 6, y: 5, z: 0 }).victims.map(u => u.id)), ['g']);
});

test('a shared tile: the click picks the body, the other is not on the line', () => {
    const me = caster();
    const flyer = { id: 'f', player: 2, x: 5, y: 5, z: 2 };
    const ground = { id: 'g', player: 2, x: 5, y: 5, z: 0 };
    const c = board([me, flyer, ground]);
    assert.deepEqual(ids(c.lineBeamPlan(me, beam, 1, 0, { x: 5, y: 5, z: 2 }).victims.map(u => u.id)), ['f']);
    assert.deepEqual(ids(c.lineBeamPlan(me, beam, 1, 0, { x: 5, y: 5, z: 0 }).victims.map(u => u.id)), ['g']);
    // a click on the ground under a LONE flyer aims at the flyer
    const c2 = board([caster(), { id: 'f2', player: 2, x: 5, y: 5, z: 2 }]);
    assert.equal(c2.lineBeamAimZ(5, 5, 0, 'c'), 2);
});

test('Fractal Stitch threads every enemy in the lane, high or low', () => {
    assert.ok(stitch, 'raceFractalStitch exists');
    assert.equal(stitch.kind, 'line');
    assert.equal(stitch.beamZigzag, true);
    const me = caster();
    const units = [me, { id: 'a', player: 2, x: 3, y: 5, z: 0 }, { id: 'b', player: 2, x: 4, y: 5, z: 3 },
        { id: 'd', player: 2, x: 4, y: 5, z: 0 }, { id: 'e', player: 2, x: 6, y: 5, z: 2 }, { id: 'ally', player: 1, x: 5, y: 5, z: 0 }];
    const c = board(units);
    assert.deepEqual(ids(c.lineBeamPlan(me, stitch, 1, 0, { x: 3, y: 5, z: 0 }).victims.map(u => u.id).sort()), ['a', 'b', 'd', 'e']);
});

test('the AI hit check agrees with the plan; no aim keeps the flat lane', () => {
    const me = caster();
    const flyer = { id: 'f', player: 2, x: 5, y: 5, z: 2 };
    const behind = { id: 'g', player: 2, x: 6, y: 5, z: 0 };
    const c = board([me, flyer, behind]);
    assert.equal(c.lineBeamHits(me, beam, 1, 0, flyer, flyer), true);
    assert.equal(c.lineBeamHits(me, beam, 1, 0, flyer, behind), false);
    assert.equal(c.lineBeamHits(me, beam, 1, 0, behind, flyer), false);
    assert.equal(c.lineBeamHits(me, beam, 1, 0, null, behind), true);
    assert.deepEqual(ids(c._beamCellVictims(me, beam, 5, 5, null).map(u => u.id)), ['f']);
});

test('sight is checked along the line itself (its height reaches the LOS ray)', () => {
    const seen = [];
    const me = caster();
    const flyer = { id: 'f', player: 2, x: 5, y: 5, z: 3 };
    const c = board([me, flyer], { los: (u, s, x, y, o, z) => { seen.push(z); return false; } });
    c.lineBeamPlan(me, beam, 1, 0, flyer);
    assert.deepEqual(ids(seen.slice(0, 3)), [1, 2, 3]);
    assert.match(battle, /function lineSpellHeadingTo\(spell, fromX, fromY, fromZ, tx, ty, tz\)/);
    assert.match(battle, /lineSpellHeadingTo\(spell, unit\.x, unit\.y, unit\.z \?\? null, x, y, z\)/);
});

test('the cast, the VFX, the relay and the Laser Door follow the line', () => {
    assert.match(battle, /_applyLineDamage\(unit, spell, dx, dy, \(spell\.dmg \|\| 0\), spellPower, _beamAim\)/);
    assert.match(battle, /fromZ: _beamPlan\.line\.z0/);
    assert.match(battle, /_beamFx\.beamPath = _pts/);
    assert.match(battle, /THE 3D LINE \(mondo 2026-09-25\): the door's laser runs level/);
    const vfx = read('three-vfx-effects.js');
    assert.match(vfx, /function _sigFractalStitch3D\(/);
    assert.match(vfx, /SPELL_MAP\['raceFractalStitch'\] = \{ beam: 'raceFractalStitch_beam'/);
    assert.match(vfx, /startW: _startW \|\| undefined, endW: _endW \|\| undefined/);
    assert.match(read('online.js'), /safeParams\.beamPath = params\.beamPath\.map/);
    assert.match(read('ai.js'), /_castZ = aim\.z;/);
});

test('Fractal Stitch sits on the mantid tree as the Ambush Lunge twin (rung III)', () => {
    const row = vm.runInContext('RACE_TREE', data).mantid;
    assert.deepEqual(ids(row[2]), ['raceAmbushLunge', 'raceFractalStitch']);
});

test('seed rows are never offered against an airborne enemy', () => {
    assert.match(read('hud.js'), /\(sp\.kind === 'seedPoison' \|\| sp\.kind === 'leechSeed'\)\s*&& typeof isUnitAirborne === 'function' && isUnitAirborne\(targetUnit\)\) continue;/);
});
