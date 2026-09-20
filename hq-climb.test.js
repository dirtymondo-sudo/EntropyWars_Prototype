// hq-climb.test.js — THE CLIMB (AREA_CONTENT_PLAN §4 / D1 — 2026-09-19): ladders, ropes, vines,
// chains, pipes and the climbable wall as ONE feature kind (`climb`) and ONE walker mode. data.js
// compiles a row into a vertical line (hqTerrainClimbs) and the SOLVER takes it as an EDGE
// (hqTerrainClimbEdges — hqTerrainReach, the reach grid, the trap check's forward + return walks),
// so a tier a ladder alone reaches satisfies every door-reach and return test and no rescue ramp is
// cut for a pit with a ladder out. three-renderer.js "THE CLIMB" builds the six looks, mounts the
// walker at a foot walked into (or a head walked off), rides W / S, lets go on SPACE, mantles at
// the top. The garage is THE TEACHING ROOM (THE DOCK OFFICE up one ladder, the plaque at its foot);
// the skate and the swim have their plaques too (R9). Guards: the rules, the compile + the solver on
// a synthetic tier, the return guarantee, the walker in a sandbox, the rooms, the clips, the sites.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const TR = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const IX = fs.readFileSync(__dirname + '/index.html', 'utf8');
const CSS = fs.readFileSync(__dirname + '/styles-base.css', 'utf8');
const SP = fs.readFileSync(__dirname + '/sprites.js', 'utf8');
const DJ = fs.readFileSync(__dirname + '/data.js', 'utf8');

/* a synthetic room: a 3 m tier over the north half, one door on it (n) and, when asked, one on the floor (s); a ladder up the tier's south face */
function tierRoom(o) {
    o = o || {};
    const doors = [{ id: 'up', wall: 'n', x: 0, action: {} }].concat(o.floorDoor ? [{ id: 'down', wall: 's', x: 0, action: {} }] : []);
    const feats = [{ k: 'plateau', x: 0, z: -4, w: 23, d: 12, h: 3, edge: 0.35 }].concat(o.climb ? [Object.assign({ k: 'climb', x: 4.5, z: 2.2, face: 0, look: 'ladder', id: 'test' }, o.climb === true ? {} : o.climb)] : []);
    return { label: 'T', kind: 'box', shell: { w: 24, d: 20, h: 8, floor: 'grass_2', wall: 'rock_wall_1' }, doors, terrain: { base: 0, noise: { amp: 0 }, features: feats } };
}

test('THE RULES: the climb numbers live in HQ_TERRAIN_RULES, the six looks in HQ_CLIMB_LOOKS, the clips in sprites.js, the renderer\'s default agrees', () => {
    const R = D.HQ_TERRAIN_RULES;
    assert.ok(R.climbReach > 0.3 && R.climbReach < 1.0 && R.climbSpeed > 1 && R.climbSpeed < 3 && R.climbMount > 0.2 && R.climbMount < 1.0, JSON.stringify([R.climbReach, R.climbSpeed, R.climbMount]));
    assert.equal(D.HQ_CLIMB_LOOKS.join(','), 'ladder,rope,vine,chain,pipe,wall,fireescape');   // D2 (2026-09-19) added the fire escape — the seventh look
    const m = TR.match(/var HQ_CLIMB_DEFAULT = \{ reach: ([\d.]+), speed: ([\d.]+), mount: ([\d.]+)/);
    assert.ok(m, 'the renderer\'s default');
    assert.equal(+m[1], R.climbReach); assert.equal(+m[2], R.climbSpeed); assert.equal(+m[3], R.climbMount);
    const cm = SP.match(/const HQ_CLIMB_CLIPS = (\{.*\});/); assert.ok(cm, 'sprites.js HQ_CLIMB_CLIPS');
    const C = vm.runInNewContext('(' + cm[1] + ')');
    assert.ok(C && C.climb && C.hang && C.mantle, 'HQ_CLIMB_CLIPS climb / hang / mantle');
    /* the clips are in the libraries the walker bakes from (the repo's copies of UAL1 / UAL2) */
    const libs = ['rigged_animations/Assets_Models_UAL1_Standard.glb', 'rigged_animations/Assets_Models_UAL2_Standard.glb'].map(f => { const p = __dirname + '/' + f; if (!fs.existsSync(p)) return null; const b = fs.readFileSync(p); const len = b.readUInt32LE(12); return JSON.parse(b.slice(20, 20 + len).toString()).animations.map(a => a.name); });
    for (const k of ['climb', 'hang', 'mantle']) { const L = libs[C[k].lib || 0]; if (L) assert.ok(L.includes(C[k].clip), k + ': ' + C[k].clip + ' in UAL' + ((C[k].lib || 0) + 1)); }
});

test('THE COMPILE: a climb row becomes a line with its foot behind it and its head PAST the tier\'s edge blend; a row that rises under 0.9 m is dropped; nothing scatters on a foot', () => {
    const info = D.hqTerrainCompile(tierRoom({ climb: true }), 'climb-synth');
    assert.equal(info.climbs.length, 1);
    const c = info.climbs[0];
    assert.equal(c.look, 'ladder'); assert.equal(c.id, 'test');
    assert.ok(Math.abs(c.y0) < 0.05 && Math.abs(c.y1 - 3) < 0.05, 'the foot at the floor, the head at the tier: ' + c.y0 + ' → ' + c.y1);
    assert.ok(c.fz > c.z && c.hz < c.z, 'face 0: the foot south of the line, the head north (on the tier)');
    assert.ok(D.hqTerrainHeight(info, c.hx, c.hz) > 2.95, 'the head spot stands on the tier\'s top, not in its 0.35 m blend');
    assert.ok(Math.abs(c.ux) < 1e-9 && Math.abs(c.uz + 1) < 1e-9, 'face 0 = toward −z');
    const flat = D.hqTerrainCompile({ label: 'F', kind: 'box', shell: { w: 20, d: 20, h: 6, floor: 'grass_2', wall: 'rock_wall_1' }, doors: [{ id: 'a', wall: 'n', x: 0, action: {} }], terrain: { base: 0, noise: { amp: 0 }, features: [{ k: 'climb', x: 0, z: 0, face: 0, look: 'rope' }] } }, 'climb-flat');
    assert.equal(flat.climbs.length, 0, 'a rope on flat ground rises nowhere — dropped');
    const scat = D.hqTerrainCompile(Object.assign(tierRoom({ climb: true }), { terrain: Object.assign({}, tierRoom({ climb: true }).terrain, { features: tierRoom({ climb: true }).terrain.features.concat([{ k: 'scatter', key: 'trash_bin', n: 60, seed: 3 }]) }) }), 'climb-scatter');
    for (const q of scat.scatter) assert.ok(Math.hypot(q.x - scat.climbs[0].fx, q.z - scat.climbs[0].fz) > 0.9 && Math.hypot(q.x - scat.climbs[0].hx, q.z - scat.climbs[0].hz) > 0.9, 'a bin off the foot and the head');
    assert.ok(D.hqTerrainDump(D.hqTerrainCompile(tierRoom({ climb: { x: 4.5, z: 2.5 } }), 'climb-dump'), { step: 1 }).join('').includes('|'), 'the dump marks a climb with |');
});

test('THE SOLVER: without the ladder the tier is a 3 m cliff (the floor never reaches the door); with it the floor reaches the door and the door the floor — the edge runs both ways', () => {
    const a = D.hqTerrainCompile(tierRoom({}), 'climb-a'), b = D.hqTerrainCompile(tierRoom({ climb: true }), 'climb-b');
    const doorK = i => D.hqTerrainNodeKey(i, 0, -7.5), floorK = i => D.hqTerrainNodeKey(i, 0, 6);
    assert.equal(D.hqTerrainReach(a, 0, 6).has(doorK(a)), false, 'no ladder: the floor cannot reach the door on the tier');
    assert.equal(D.hqTerrainReach(a, 0, -7.5).has(floorK(a)), true, 'no ladder: the door drops to the floor (any drop)');
    assert.equal(D.hqTerrainReach(b, 0, 6).has(doorK(b)), true, 'the ladder: the floor reaches the door');
    assert.equal(D.hqTerrainReach(b, 0, -7.5).has(floorK(b)), true, 'the ladder: the door reaches the floor');
    const E = D.hqTerrainClimbEdges(b);
    assert.equal(E.size, 2, 'two nodes carry an edge (the foot, the head)');
    for (const [k, list] of E) assert.ok(list.length === 1 && E.has(list[0].k), 'the edge returns');
});

test('THE RETURN GUARANTEE: the floor under a tier with one door on it is a TRAP — a rescue ramp is cut; with a ladder out nothing traps and no ramp is cut (the head is returning ground)', () => {
    const a = D.hqTerrainCompile(tierRoom({}), 'climb-trap-a'), b = D.hqTerrainCompile(tierRoom({ climb: true }), 'climb-trap-b');
    assert.equal(D.hqTerrainTraps(a).length, 0, 'the guarantee already rescued it …');
    assert.ok((a.rescues || []).length >= 1, '… with a ramp: ' + JSON.stringify(a.rescues));
    assert.equal(D.hqTerrainTraps(b).length, 0);
    assert.equal((b.rescues || []).length, 0, 'the ladder IS the return — no ramp');
    /* a two-door room never trapped (the floor door returns) and the ladder still joins the tiers */
    const c = D.hqTerrainCompile(tierRoom({ climb: true, floorDoor: true }), 'climb-two');
    assert.equal((c.rescues || []).length, 0); assert.equal(c.climbs.length, 1);
});

/* the walker's climb in a sandbox: the functions of "THE CLIMB" block with a stub room */
function extract(name) { const start = TR.indexOf('    function ' + name + '('); const end = TR.indexOf('\n    }', start); assert.ok(start >= 0 && end > start, name); return TR.slice(start, end + 6); }
function sandbox() {
    const c = { console, Math, performance: { now: () => 1000 }, window: {}, THREE: {}, HQ_TERRAIN_RULES: D.HQ_TERRAIN_RULES };
    vm.createContext(c);
    const d = TR.indexOf('    var HQ_CLIMB_DEFAULT = {'), de = TR.indexOf('\n', d);
    vm.runInContext(TR.slice(d, de) + '\n' + ['_hqClimbRules', '_hqClimbOff', '_hqClimbEmit', '_hqClimbNear', '_hqClimbStart', '_hqClimbStop', '_hqClimbCheck', '_hqTickClimb'].map(extract).join('\n') + `
        function _hqUnits() { return 73; }
        var _rideOff = 0; function _hqRideToggle() { _rideOff++; }
        function _hqPortalDraw() {}
        var _events = [];
        var C = { id: 'L', x: 0, z: 0, y0: 0, y1: 3, face: 0, look: 'ladder', w: 0.6, ux: 0, uz: -1, fx: 0, fz: 0.6, hx: 0, hz: -0.55, len: 3 };
        var _hq = { player: { x: 0, z: 0.9, y: 0, visY: 0, yaw: 0, targetYaw: 0, air: false, vy: 0, jumpT: -1, moving: false, running: false, pushX: 0, pushZ: 0, mvx: 0, mvz: 0, entry: { group: { position: { set: function () {} } }, actions: {} } },
                    keys: {}, climbs: [C], climbNear: null, ride: { on: false }, portal: { drawn: false }, vehicle: null, snap: null, paused: false, opts: { onClimb: function (ev) { _events.push(ev); } } };
    `, c);
    c.pl = c._hq.player; c.events = () => c._events;
    c.tick = (keys, dt, n) => { for (let i = 0; i < (n || 1); i++) { c._hq.keys = Object.assign({}, keys || {}); vm.runInContext('_hqTickClimb(' + (dt || 1 / 60) + ')', c); } };
    c.check = () => vm.runInContext('_hqClimbCheck(_hq.player)', c);
    return c;
}

test('THE WALKER: the foot walked into mounts (the near hint first), W rides up at the speed, the head hands the walker onto the tier past the line; S from the top rides down to the ground; SPACE lets go into a fall; the rider steps off the deck', () => {
    const c = sandbox();
    c.pl.pushZ = 0; c.check(); assert.ok(!c.pl.climb, 'standing still at the foot: nothing');
    assert.ok(c.events().some(e => e.kind === 'near' && e.on && e.end === 'foot'), 'the near hint');
    c.pl.pushZ = -2.4; c.check(); assert.ok(c.pl.climb, 'pushing into the mass: on the line');
    assert.ok(c.events().some(e => e.kind === 'climb' && e.on && e.end === 'foot'));
    assert.ok(Math.abs(c.pl.z - 0.34) < 1e-6 && Math.abs(c.pl.x) < 1e-6, 'hanging 0.34 m off the line on the open side');
    c.tick({ w: true }, 1 / 60, 30);
    assert.ok(c.pl.y > 0.7 && c.pl.y < 0.9, 'half a second up at 1.6 m/s: ' + c.pl.y);
    assert.ok(c.pl.climb && c.pl.climb.moving);
    c.tick({}, 1 / 60, 5); assert.equal(c.pl.climb.moving, false, 'the hang');
    c.tick({ w: true }, 1 / 60, 200);
    assert.equal(c.pl.climb, null, 'off the line at the top');
    assert.ok(Math.abs(c.pl.y - 3) < 1e-6 && c.pl.z < -0.7 && !c.pl.air, 'standing on the tier past the head: z ' + c.pl.z);
    assert.ok(c.events().some(e => e.kind === 'climb' && !e.on && e.why === 'top'));
    /* from the top: walk off the edge over the head → down the ladder */
    c.pl.z = -0.6; c.pl.pushZ = 2.4; c.check();
    assert.ok(c.pl.climb && c.pl.climb.end === 'head' && c.pl.y > 2.5, 'mounted from the head near the top');
    c.tick({ s: true }, 1 / 60, 240);
    assert.equal(c.pl.climb, null); assert.ok(Math.abs(c.pl.y) < 1e-6 && c.pl.z > 0.6, 'back on the ground at the foot');
    /* let go */
    c.pl.z = 0.9; c.pl.pushZ = -2.4; c.check(); c.tick({ w: true }, 1 / 60, 60);
    c.tick({ space: true }, 1 / 60, 1);
    assert.equal(c.pl.climb, null); assert.ok(c.pl.air && c.pl.vy > 0 && c.pl.mvz > 0, 'a drop: airborne, pushed off the mass');
    assert.ok(c.events().some(e => e.kind === 'climb' && !e.on && e.why === 'drop'));
    /* the rider */
    c.pl.air = false; c.pl.y = 0; c.pl.z = 0.9; c.pl.pushZ = -2.4; c._hq.ride.on = true; c.check();
    assert.ok(c.pl.climb && vm.runInContext('_rideOff', c) === 1, 'the deck put down at the foot');
    /* the swimmer never climbs; the kill-switch */
    const s2 = sandbox(); s2.pl.swim = true; s2.pl.pushZ = -2.4; s2.check(); assert.equal(s2.pl.climb, undefined);
    const s3 = sandbox(); s3.window.EW_HQ_NO_CLIMB = true; s3.pl.pushZ = -2.4; s3.check(); assert.equal(s3.pl.climb, undefined);
});

test('THE TEACHING ROOMS (R9): the garage\'s ladder climbs onto THE DOCK OFFICE under a raised ceiling with the plaque at its foot; the deck and the pool have their plaques; every walk lesson is placed', () => {
    const g = HQ.rooms.garage;
    assert.ok(Array.isArray(g.climbs) && g.climbs.length === 1 && g.climbs[0].look === 'ladder', 'one ladder');
    const c = g.climbs[0], land = g.props.find(p => p.key === 'stair_landing'), cat = HQ.catalogue.stair_landing;
    assert.ok(land && cat && cat.rect && cat.block, 'the landing is a blocking rect');
    assert.equal(c.y1, land.y + cat.h, 'the head is the landing\'s top');
    const fr = c.face * Math.PI / 180, hx = c.x + Math.sin(fr) * D.HQ_TERRAIN_RULES.climbMount, hz = c.z - Math.cos(fr) * D.HQ_TERRAIN_RULES.climbMount;
    assert.ok(Math.abs(hx - land.x) <= cat.rect.hw - 0.1 && Math.abs(hz - land.z) <= cat.rect.hd - 0.1, 'the head spot stands on the landing');
    const fx = c.x - Math.sin(fr) * D.HQ_TERRAIN_RULES.climbReach, fz = c.z + Math.cos(fr) * D.HQ_TERRAIN_RULES.climbReach;
    assert.ok(Math.abs(fx - land.x) > cat.rect.hw || Math.abs(fz - land.z) > cat.rect.hd, 'the foot stands OFF the landing');
    assert.ok(g.shell.h >= c.y1 + 2.0, 'head room over the platform: ' + g.shell.h);
    /* THE ROUND GARAGE (2026-09-20): the decks are bridge rings — a prop at a ring's height stands on the ring (the ladder's foot too: y0 = the UPPER ring); anything else that high stands on the landing */
    const deckYs = new Set((g.terrain && g.terrain.features || []).filter(f => f.k === 'bridge').map(f => f.y));
    assert.ok(deckYs.size >= 2 && deckYs.has(c.y0), 'the ladder rises off a deck');
    for (const p of g.props) if (p.y >= 3 && !deckYs.has(p.y)) assert.ok(Math.abs(p.x - land.x) <= cat.rect.hw && Math.abs(p.z - land.z) <= cat.rect.hd, p.key + ' on the platform');
    const L = D.hqWalkLessons();
    assert.equal(L.map(l => l.id + ':' + l.room).join(','), 'climb:garage,skate:locker,swim:natatorium');
    for (const l of L) { assert.ok(l.placed, l.id + ' placed'); assert.ok(l.prop.key === 'lesson_plaque' && (typeof l.prop.wall === 'string' || (typeof l.prop.face === 'number' && typeof l.prop.mount === 'number')), l.id + ': a wall plaque (on a box wall, or standing free on a floor plan\'s wall — THE ROUND GARAGE, 2026-09-20)'); assert.ok(l.draft === true && l.lines.length === 3, l.id + ': three DRAFT lines'); }
    for (const l of D.hqGunLessons()) assert.ok(l.placed, 'the gun lesson ' + l.id + ' still placed');
});

test('THE SOURCE SITES: the renderer\'s block, the walker tick + its check, the clips baked, the picker, the plaque reads the walk lessons, map.js hears onClimb, the hint line, the CSS, RULE #2', () => {
    const a = TR.indexOf('/* ══ THE CLIMB — LADDERS'), b = TR.indexOf('/* ── per-frame ───', a); assert.ok(a > 0 && b > a, 'the block before the per-frame section');
    const blk = TR.slice(a, b);
    assert.ok(!/\bstate\./.test(blk) && !/_emit\(/.test(blk), 'RULE #2: a walker mode — nothing on state, nothing relayed');
    for (const re of [/if \(pl\.climb\) \{ _hqTickClimb\(dt\); return; \}/, /_hqClimbCheck\(pl\);/, /_hqBuildClimbs\(room\);/, /HQ_CLIMB_CLIPS\[pr\[0\]\]/, /else if \(ch\.climb\) want = ch\.climb\.moving \? 'hqClimb' : 'hqClimbIdle'/, /if \(ch\.climb && !ch\.strike\) leanT = -1\.3;/, /climbs: \[\], climbNear: null/, /climbing: function \(\)/, /window\.HQ_WALK_LESSONS\[id\]/, /name === 'hqClimb'\) \? \(acts\.hqSwim/]) assert.ok(re.test(TR), String(re));
    for (const look of D.HQ_CLIMB_LOOKS) assert.ok(new RegExp("c\\.look === '" + look + "'|the climbable wall").test(blk), 'a builder branch for ' + look);
    assert.ok(/onClimb: \(typeof _hqClimbEvent === 'function'\)/.test(MP) && /function _hqClimbEvent\(ev\)/.test(MP) && /classList\.toggle\('climbnear'/.test(MP), 'map.js');
    assert.ok(/class="hq-hint-climbnear">W CLIMB</.test(IX) && /class="hq-hint-climb">CLIMBING/.test(IX), 'the hint spans');
    assert.ok(/\.hq-hints\.climbnear \.hq-hint-climbnear \{ display: inline/.test(CSS) && /\.hq-hints\.climb \.hq-hint-climb \{ display: inline/.test(CSS), 'the CSS');
    assert.ok(/const HQ_CLIMB_CLIPS = \{ climb:/.test(SP), 'sprites.js');
    assert.ok(/case 'climb': climbRows\.push\(f\); break;/.test(DJ) && /case 'climb': discs\.push/.test(DJ) && /const CE = hqTerrainClimbEdges\(info\);/.test(DJ), 'data.js: the row, the plan keeps it open, the edges in every walk');
    assert.equal((DJ.match(/const CE = hqTerrainClimbEdges\(info\);/g) || []).length, 4, 'four walks carry the edge: hqTerrainReach, the reach grid, the jump forward, the jump return');
    assert.ok(fs.readFileSync(__dirname + '/hq-terrain.test.js', 'utf8').includes("'scatter', 'climb'"), 'hq-terrain.test.js knows the kind');
});
