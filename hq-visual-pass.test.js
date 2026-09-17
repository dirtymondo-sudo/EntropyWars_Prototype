'use strict';
/* THE VISUAL PASS (2026-09-16): the kit tile in a site room, the vehicle
   batch's turn, THE FRONT OFF THE MESH (chairs / the round cubicle measured,
   never guessed), THE TABLETOP SEAT (a raised small prop lands on the
   surface under it), the cafeteria's serving line, the corner office's desk
   as a floor prop, the lost-and-found clerk BEHIND her desk. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data.js');
const TR = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
const D = loadGameData();
const HQ = D.DOOR_HQ;

test('THE KIT TILE: the misc / door-kit / vehicle helpers size against the build\'s tile, and the site room sets it', () => {
    assert.match(TR, /var _hzKitTs = 0;\s*\n\s*function _hzKitTile\(\) \{ return _hzKitTs \|\| CONFIG\.tileSize \|\| BASE_TILE; \}/);
    assert.match(TR, /function _hzMiscKit\(key, o\) \{\s*o = o \|\| \{\};\s*var ts = _hzKitTile\(\)/, '_hzMiscKit reads the kit tile');
    assert.match(TR, /function _hzDoorKitGLB\(key, o\) \{\s*o = o \|\| \{\};\s*var ts = _hzKitTile\(\)/, '_hzDoorKitGLB reads the kit tile');
    assert.match(TR, /_hzVehicleProc\(kind\) \{\s*var V = _VEHICLE_KIT\[kind\] \|\| _VEHICLE_KIT\.suv, ts = \(typeof _hzKitTile === 'function'\) \? _hzKitTile\(\)/, 'the stand-in too');
    assert.match(TR, /_hzKitTs = ts;\s*\n\s*try \{ build\(g, ctx\); \}[^\n]*\n\s*finally \{ _hzKitTs = 0; \}/, '_hqBuildSetting sets it round the builder and clears it');
    assert.ok(!/var ts = CONFIG\.tileSize \|\| BASE_TILE, mPerTs = 1\.75;/.test(TR), 'no kit helper reads the battle tile directly any more');
});

test('THE VEHICLE BATCH lies along X, nose −X: every kit row turns +90°', () => {
    const kit = TR.slice(TR.indexOf('var _VEHICLE_KIT = {'), TR.indexOf('};', TR.indexOf('var _VEHICLE_KIT = {')));
    const rows = kit.match(/\n\s*\w+:\s*\{ m: [0-9.]+, yaw: [^,]+,/g) || [];
    assert.equal(rows.length, 11, 'nine rows + the taxi and the truck (the city batch, 2026-09-17)');
    rows.forEach(r => assert.match(r, /yaw: Math\.PI \/ 2,/, r.trim() + ' turns −X onto +Z'));
    for (const k of ['car_suv', 'car_cadillac', 'car_cop', 'car_cyber', 'car_ambulance', 'fire_truck', 'school_bus']) assert.equal(HQ.catalogue[k].turn, 90, k + ' pre-turns 90');
    assert.match(TR, /if \(cat\.turn\) turned \+= _hqRad\(cat\.turn\);/, 'the placer applies `turn`');
});

test('THE FRONT OFF THE MESH: chairs and couches are measured by their backrest, the round cubicle by its opening', () => {
    for (const k of ['teal_chair', 'office_chair', 'folding_chair', 'computer_chair_blue', 'computer_chair_grey', 'cafeteria_chair', 'molded_chair', 'curved_couch', 'curved_office_couch']) assert.equal(HQ.catalogue[k].front, 'back', k);
    assert.equal(HQ.catalogue.round_cubicle.front, 'open');
    assert.match(TR, /function _hqAutoFrontYaw\(inst, mode\)/);
    assert.match(TR, /if \(cat\.front && !cat\.lay\) \{ try \{ turned = _hqAutoFrontYaw\(g, cat\.front\); \}/, 'the placer measures on load');
    /* the heuristic on synthetic meshes with real three r128 (skipped when the library is not installed) */
    let THREE = null; try { THREE = require('three'); } catch (e) { THREE = null; }
    if (!THREE || !THREE.BoxGeometry) { console.log('  (three r128 not installed — the synthetic front check is skipped)'); return; }
    const a = TR.indexOf('    function _hqAutoFrontYaw(inst, mode) {'), b = TR.indexOf('    /* THE TABLETOP SEAT');
    const ctx = { THREE, Math, Infinity }; vm.createContext(ctx); vm.runInContext(TR.slice(a, b) + '\nthis.fn = _hqAutoFrontYaw;', ctx);
    const Y = new THREE.Vector3(0, 1, 0);
    for (const [dx, dz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        const chair = new THREE.Group();
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5)); seat.position.y = 0.45; chair.add(seat);
        const back = new THREE.Mesh(new THREE.BoxGeometry(dx ? 0.06 : 0.5, 0.5, dx ? 0.5 : 0.06)); back.position.set(dx * 0.22, 0.75, dz * 0.22); chair.add(back);
        const f = new THREE.Vector3(-dx, 0, -dz).applyAxisAngle(Y, ctx.fn(chair, 'back'));
        assert.ok(Math.abs(f.x) < 1e-6 && f.z > 0.99, 'a chair with its back at ' + dx + ',' + dz + ' faces +Z after the turn');
        const cub = new THREE.Group();
        [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(d => { if (d[0] === dx && d[1] === dz) return; const w = new THREE.Mesh(new THREE.BoxGeometry(d[0] ? 0.05 : 2, 1.6, d[0] ? 2 : 0.05, 4, 8, 4)); w.position.set(d[0], 0.8, d[1]); cub.add(w); });
        const o = new THREE.Vector3(dx, 0, dz).applyAxisAngle(Y, ctx.fn(cub, 'open'));
        assert.ok(Math.abs(o.x) < 1e-6 && o.z > 0.99, 'a cubicle open at ' + dx + ',' + dz + ' opens on +Z after the turn');
    }
});

test('THE TABLETOP SEAT: every raised small prop is registered and seated on the surface under it', () => {
    assert.match(TR, /function _hqSeatTabletops\(\)/);
    assert.match(TR, /var tabletop = !onWall && !onCeil && !flip && \(p\.y != null && p\.y >= 0\.25\) && !\(cat\.foot > 0\.35\) && !cat\.block && !cat\.rect/);
    assert.equal((TR.match(/_hq\.tabletops\.push\(\{ key: p\.key, grp: grp, y: y \}\)/g) || []).length, 2, 'the proc path and the GLB path both register');
    assert.match(TR, /if \(_hq\) \{ _hq\.dirty = true; _hqSeatLater\(\); \}/, 'a GLB that lands re-runs the pass');
    assert.match(TR, /if \(d > 0\.3 \* U\) continue;/, 'never a surface more than 0.3 m off the authored height (the floor, a shelf a metre up)');
});

test('ROOM 86: the serving line is a counter with a tray slide, and every tray is on it', () => {
    const C = HQ.rooms.cafeteria, P = C.props;
    assert.equal(P.filter(p => p.key === 'serving_line').length, 2, 'two 3 m runs');
    assert.ok(!P.some(p => p.key === 'tanker_desk' && p.wall === 'n'), 'no desk on the serving wall');
    const cat = HQ.catalogue.serving_line; assert.ok(cat.proc === 'serving_line' && cat.wall && cat.depth === 1.15 && cat.block, 'a wall proc the walker cannot enter');
    const half = C.shell.d / 2, slide0 = -half + 0.02 + 0.75, slide1 = -half + 0.02 + 1.15;
    P.filter(p => /meal_tray/.test(p.key) && p.z < -3).forEach(p => {
        assert.ok(p.z >= slide0 && p.z <= slide1, p.key + ' at z ' + p.z + ' is on the slide (' + slide0.toFixed(2) + '…' + slide1.toFixed(2) + ')');
        assert.ok(Math.abs(p.y - 0.85) < 0.01, 'at the slide\'s height');
        assert.ok(P.some(q => q.key === 'serving_line' && Math.abs(q.x - p.x) <= 1.5), 'over a run');
    });
    assert.match(TR, /serving_line: function \(U\) \{/);
    assert.ok(C.variants.after_hours.drop.includes('serving_line'), 'the club drops it');
});

test('ROOM 4C + ROOM ?: the desks face their sitters', () => {
    const CO = HQ.rooms.corner;
    const desk = CO.props.find(p => p.key === 'exec_desk'), chair = CO.props.find(p => p.key === 'exec_chair');
    assert.ok(desk && desk.wall == null && desk.face === 180 && desk.z > chair.z, 'the executive desk is a floor prop in front of the chair, its visitors\' side south');
    CO.props.filter(p => p.key === 'teal_chair').forEach(p => assert.equal(p.face, 0, 'the visitors face the Director'));
    assert.ok(!HQ.catalogue.exec_desk.wall && HQ.catalogue.exec_desk.rect, 'the catalogue row is a floor prop with a rect');
    const LF = HQ.rooms.lostfound, d2 = LF.props.find(p => p.key === 'tanker_desk'), ch = LF.props.find(p => p.key === 'office_chair'), clerk = LF.agents.find(a => a.label === 'THE CLERK'), claims = LF.counters.find(c => c.id === 'claims');
    assert.ok(d2.wall == null && d2.face === 270 && ch.x < d2.x && ch.face === 90 && clerk.x === ch.x && clerk.z === ch.z, 'the clerk sits behind the desk facing east');
    assert.ok(claims.x > d2.x && claims.face === 270, 'the claims counter is on the visitors\' side, looking at the clerk');
    LF.props.filter(p => p.y === 0.76).forEach(p => assert.ok(Math.abs(p.x - d2.x) <= 0.375 && Math.abs(p.z - d2.z) <= 0.75, p.key + ' is on the desk (a 1.5 × 0.75 desk turned 270: its span runs along z)'));
    const CU = HQ.rooms.cubicles;
    CU.props.filter(p => p.key === 'round_cubicle').forEach(p => assert.ok(p.face === (p.z < 0 ? 180 : 0), 'the cubicle opens toward the room\'s middle'));
    CU.onlineSpots.forEach(s => assert.ok(CU.props.some(p => /computer_chair/.test(p.key) && p.x === s.x && p.z === s.z && p.face === s.face), 'every shift spot is a chair'));
});
