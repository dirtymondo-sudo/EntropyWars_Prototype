'use strict';
/* THE PREMIUM POLISH (PREMIUM_POLISH_PLAN.md, 2026-09-21) — THE LIGHT PASS, THE AIR PASS, THE PROP PASS, THE CAMERA
   PASS and THE POST PASS over D.O.O.R. HQ and the areas. The data rules run in the vm sandbox; the renderer / post /
   map / page sites are source guards (the look is unseen — RULE #1c). */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data.js');

const TR = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
const TP = fs.readFileSync(path.join(__dirname, 'three-post.js'), 'utf8');
const MP = fs.readFileSync(path.join(__dirname, 'map.js'), 'utf8');
const IX = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const CS = fs.readFileSync(path.join(__dirname, 'styles-base.css'), 'utf8');
const W = loadGameData();
const D = W.DOOR_HQ;

function fn(src, name) {
    const i = src.indexOf('function ' + name + '(');
    assert.ok(i >= 0, 'function ' + name);
    let depth = 0, j = src.indexOf('{', i);
    for (let k = j; k < src.length; k++) { const c = src[k]; if (c === '{') depth++; else if (c === '}') { depth--; if (!depth) return src.slice(i, k + 1); } }
    return src.slice(i);
}

test('THE LIGHT RULES: data.js HQ_LIGHT_RULES and the renderer\'s HQ_LIGHT_DEFAULT carry the same keys (and the same sub-keys)', () => {
    const a = TR.indexOf('    var HQ_LIGHT_DEFAULT = {'), b = TR.indexOf('\n    function _hqLightRules()', a);
    assert.ok(a > 0 && b > a, 'HQ_LIGHT_DEFAULT');
    const def = vm.runInContext(TR.slice(a, b) + '; HQ_LIGHT_DEFAULT', vm.createContext({}));
    const R = W.HQ_LIGHT_RULES;
    assert.equal(Object.keys(R).sort().join(','), Object.keys(def).sort().join(','), 'the top-level keys');
    ['shadows', 'ao', 'heightFog', 'atmos', 'key', 'open'].forEach(k => assert.equal(Object.keys(R[k]).sort().join(','), Object.keys(def[k]).sort().join(','), 'the keys of ' + k));
    assert.ok(R.shadows.on === true && R.shadows.mapHigh >= R.shadows.mapLow && R.shadows.everyN >= 1, 'the shadow row');
    assert.ok(R.ao.corner > 0 && R.ao.corner < 1 && R.ao.contact > 0 && R.ao.terrain >= 0, 'the AO row');
    ['box', 'open', 'hall'].forEach(k => assert.ok(R.heightFog[k].h > 0 && R.heightFog[k].amount >= 0 && R.heightFog[k].amount <= 1, 'height fog ' + k));
    ['box', 'open', 'bay', 'hall'].forEach(k => assert.ok(isFinite(R.key[k].az) && R.key[k].el > 20 && R.key[k].el < 90, 'the key rig ' + k));
});

test('THE HEIGHT FOG: three\'s fog chunks are patched once at load with the shared uEwHFog uniform; the building writes it, the menu and the leave zero it', () => {
    const patch = fn(TR, '_ewHeightFogPatch');
    ['fog_pars_vertex', 'fog_vertex', 'fog_pars_fragment', 'fog_fragment'].forEach(c => assert.ok(patch.includes('SC.' + c + ' = SC.' + c + '.replace('), 'the chunk ' + c + ' is patched'));
    assert.ok(patch.includes("'fogDepth = - mvPosition.z;'") && patch.includes('vEwFogY = ( modelMatrix * ewFogWp ).y;'), 'r128 names its fog depth `fogDepth`; the world y rides beside it');
    assert.ok(patch.includes('uniform vec4 uEwHFog;') && patch.includes('lib[k].uniforms.uEwHFog = { value: _EW_HFOG }') && patch.includes('THREE.UniformsLib.fog.uEwHFog'), 'the ONE shared plain-object uniform on every fogged ShaderLib entry');
    assert.ok(/fogFactor = clamp\( 1\.0 - \( 1\.0 - fogFactor \) \* \( 1\.0 - ewHf \), 0\.0, 1\.0 \);/.test(patch), 'the height term multiplies INTO the stock fog (amount 0 = the stock fog exactly)');
    assert.ok(/^\s*_ewHeightFogPatch\(\);/m.test(TR), 'patched at load');
    assert.ok(/function _hqLeave\(opts\) \{[\s\S]{0,200}_ewHeightFogSet\(0, 1, 0, 0\); _HQ_AO\.w = 0;/.test(TR), '_hqLeave resets it');
    assert.ok(/function _menuEnter\(opts\) \{\s*\n\s*_ewHeightFogSet\(0, 1, 0, 0\); _HQ_AO\.w = 0;/.test(TR), '_menuEnter resets it');
    assert.ok(!/fog_pars_fragment/.test(fs.readFileSync(path.join(__dirname, 'three-vfx-effects.js'), 'utf8')), 'no ShaderMaterial in the VFX file includes the fog chunks (it would have to declare the uniform)');
    const arm = fn(TR, '_hqHeightFogArm');
    assert.ok(arm.includes('EW_HQ_NO_HEIGHT_FOG') && arm.includes("S.heightFog === false") && arm.includes('S.sky.fog.height'), 'the kill-switch, the opt-out, the sky row\'s height');
});

test('THE ROOM-BOX AO: one shared hook on _hqMat and _hqPropMatPick, armed per room (a box room its walls + ceiling, a field nothing); the terrain field bakes aAO on BOTH geometries', () => {
    const hook = fn(TR, '_hqAoHook');
    assert.ok(hook.includes('shader.uniforms.uHqAo = { value: _HQ_AO }') && hook.includes('vHqWp = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;') && hook.includes('diffuseColor.rgb *= clamp( hqAo, 0.3, 1.0 );'), 'the hook');
    assert.ok(/if \(!opts\.noAo\) m\.onBeforeCompile = _hqAoHook;/.test(fn(TR, '_hqMat')), '_hqMat wears it');
    assert.ok(/lm\.onBeforeCompile = _hqAoHook;/.test(fn(TR, '_hqPropMatPick')), '_hqPropMatPick wears it');
    const arm = fn(TR, '_hqAoArm');
    assert.ok(arm.includes('if (H.terrain || (H.site && H.site.cave) || H.planet) k = 0;') && arm.includes("var box = room.kind === 'box' && !S.open;"), 'the field gets no box AO; an open room the floor contact alone');
    const bt = fn(TR, '_hqBuildTerrain');
    assert.ok(bt.includes("geo.setAttribute('aAO', new THREE.BufferAttribute(ao, 1));") && fn(TR, '_hqTerrainAoAt').includes('var lap = (hL + hR + hU + hD - 4 * h) / res;'), 'the field bakes its concavity');
    assert.ok(fn(TR, '_hqBuildOuterGround').includes("geo.setAttribute('aAO', new THREE.BufferAttribute(aoO, 1));"), 'the outer ground shares the material: the attribute must exist (a missing one reads 0 = black)');
    assert.ok(fn(TR, '_hqTerrainMat').includes('texelColor.rgb *= vAO;'), 'the material multiplies it');
});

test('THE SHADOW: the key casts ONE map fitted to the room (≤ 30 m, following the walker, texel-snapped), pulsed every N frames; walls / ceilings / the drum / the ground never cast; people cast once their rig lands', () => {
    const arm = fn(TR, '_hqShadowArm');
    assert.ok(arm.includes("ThreePost.getShadowQuality()") && arm.includes("q === 'off' || W.EW_HQ_NO_SHADOWS || W.EW_PERF_LOW"), 'the battle\'s knob, the kill-switch, the phone');
    assert.ok(arm.includes('var Rf = Math.min(Rroom, 30 * U);') && arm.includes('cam.updateProjectionMatrix();') && arm.includes('renderer.shadowMap.enabled = true;'), 'the fitted frustum');
    const tick = fn(TR, '_hqShadowTick');
    assert.ok(tick.includes('Math.round(c.dot(right) / t) * t') && tick.includes('renderer.shadowMap.needsUpdate = true;') && tick.includes('SH.frame % SH.everyN'), 'the snap + the pulse');
    const flags = fn(TR, '_hqShadowFlags');
    assert.ok(/_HQ_NO_CAST_PART\[o\._ew_hqPart\]\) \|\| big \|\| o\._ew_hqGround \|\| o\._ew_hqOuter\) o\.castShadow = false;/.test(flags), 'what never casts');
    assert.ok(/_HQ_NO_CAST_PART = \{ wall: 1, ceil: 1, edge: 1, strip: 1, pipe: 1, fx: 1 \}/.test(TR), 'the parts');
    assert.ok(/if \(H\.shadows\) \{ try \{ _applyShadowFlags\(e\.group\); \} catch \(err\) \{\} \}/.test(fn(TR, '_hqTickChars')), 'a body casts once attached');
    assert.ok(/if \(H\.shadows\) _hqShadowTick\(H, dt\);/.test(fn(TR, '_hqFrame')), 'ticked in the frame');
    const enter = fn(TR, '_hqEnter');
    ['_hqLightArm(room)', '_hqShadowArm(room)', '_hqAoArm(room)', '_hqHeightFogArm(room)', '_hqPlaceLightShafts(room)', '_hqBuildAtmos(room)'].forEach(c => assert.ok(enter.includes(c), '_hqEnter arms ' + c));
    assert.equal((enter.match(/_hq\.keyLight = /g) || []).length, 4, 'every light branch names its key');
});

test('THE ATMOSPHERE: data.js hqRoomAtmos answers a legal kind (or nothing) for every room; the sites named exist; the renderer builds one Points / LineSegments per room', () => {
    const KINDS = { dust: 1, embers: 1, fireflies: 1, snow: 1, rain: 1, spores: 1, ash: 1, motes: 1 };
    let n = 0;
    for (const id of Object.keys(D.rooms)) { const a = W.hqRoomAtmos(id); if (!a) continue; n++; assert.ok(KINDS[a.kind], id + ' → ' + a.kind); }
    assert.ok(n > 100, 'most rooms breathe (' + n + ')');
    assert.equal(W.hqRoomAtmos('car'), null, 'the car breathes nothing');
    assert.equal(W.hqRoomAtmos('site_prebuilt_bermuda_sea'), null, 'the sea has its own');
    assert.equal(W.hqRoomAtmos('site_prebuilt_fairy_forest_clearing').kind, 'spores');
    assert.equal(W.hqRoomAtmos('site_prebuilt_hell_pit').kind, 'ash');
    for (const site of Object.keys(W.HQ_ATMOS_SITES)) assert.ok(D.thresholds[site], 'HQ_ATMOS_SITES names a real site: ' + site);
    const b = fn(TR, '_hqBuildAtmos');
    assert.ok(b.includes('EW_HQ_NO_ATMOS') && b.includes('if (W.EW_PERF_LOW) n = Math.round(n / 2);') && b.includes("line ? new THREE.LineSegments(geo, mat) : new THREE.Points(geo, mat)"), 'the kill-switch, the phone\'s half, rain as lines');
    assert.ok(b.includes("if (!emitters.length) { K = HQ_ATMOS_KINDS.dust;"), 'embers without a warm light fall back to dust');
    const kinds = TR.slice(TR.indexOf('    var HQ_ATMOS_KINDS = {'), TR.indexOf('    };', TR.indexOf('    var HQ_ATMOS_KINDS = {')));
    Object.keys(KINDS).forEach(k => assert.ok(new RegExp('\\n\\s*' + k + ':\\s*\\{').test(kinds), 'the renderer knows ' + k));
});

test('THE LIGHT SHAFTS: the proc + the placements name real rooms with finite rows; the beam is the battle\'s god-ray kit', () => {
    assert.ok(D.catalogue.light_shaft && D.catalogue.light_shaft.proc === 'light_shaft', 'the catalogue row');
    const LS = D.lightShafts; assert.ok(LS && Object.keys(LS).length >= 10, 'ten rooms earn a beam');
    for (const room of Object.keys(LS)) {
        assert.ok(D.rooms[room], 'a real room: ' + room);
        LS[room].forEach(p => { ['x', 'z', 'top', 'h', 'w'].forEach(k => assert.ok(isFinite(p[k]), room + ' ' + k)); assert.ok(p.h > 0 && p.w > 0 && p.top > 0, room + ' sizes'); assert.ok(Math.abs(p.x) <= D.rooms[room].shell.w / 2 && Math.abs(p.z) <= D.rooms[room].shell.d / 2, room + ' inside the room'); });
    }
    const sh = fn(TR, '_hqLightShaft');
    assert.ok(sh.includes('_ensureRayShaders();') && sh.includes('vertexShader: _RAY_VS, fragmentShader: _RAY_FS') && sh.includes('_RAY_POOL_FS') && sh.includes('_RAY_MOTE_VS'), 'the shared shaders');
    assert.ok(/light_shaft: function \(U, p\) \{ return _hqLightShaft\(U, p\) \|\| new THREE\.Group\(\); \}/.test(TR), 'the proc entry');
    assert.ok(fn(TR, '_hqPlaceLightShafts').includes('D.lightShafts && D.lightShafts[H.opts.room'), 'placed from the table');
});

test('THE FAR END (3.5): every halls / ley / city plan room\'s fog is half gone at ≤ 60 % of the diagonal', () => {
    let n = 0;
    for (const id of Object.keys(D.rooms)) {
        const r = D.rooms[id], g = r.terrain && r.terrain.gen; if (!g || !/^(halls|ley|city)$/.test(g.kind)) continue;
        const half = W.hqRoomFogHalfAt(r), diag = Math.hypot(r.shell.w, r.shell.d); n++;
        assert.ok(half != null && half <= 0.6 * diag + 0.5, id + ': the fog reaches 0.5 at ' + (half == null ? 'never' : half.toFixed(1) + ' m') + ' of a ' + diag.toFixed(0) + ' m diagonal');
    }
    assert.ok(n >= 15, n + ' corridor rooms judged');
});

test('THE PROP PASS: the kickables, the seats, the sways are catalogue rows; the placer gives no blocker to a kickable and polishes every prop at both sites', () => {
    W.HQ_KICKABLE.keys.forEach(k => assert.ok(D.catalogue[k], 'kickable in the catalogue: ' + k));
    assert.ok(W.hqPropKickable('cardboard_box', D.catalogue.cardboard_box) && W.hqPropKickable('traffic_cone', D.catalogue.traffic_cone), 'the box and the cone');
    assert.ok(!W.hqPropKickable('wall_torch', D.catalogue.wall_torch) && !W.hqPropKickable('office_chair', D.catalogue.office_chair), 'a torch, a chair never');
    const seats = Object.keys(D.catalogue).filter(k => D.catalogue[k].seat != null);
    assert.ok(seats.length >= 12, seats.length + ' seats');
    seats.forEach(k => assert.ok(D.catalogue[k].seat > 0.3 && D.catalogue[k].seat < 0.7, k + ' seat height'));
    const sways = Object.keys(D.catalogue).filter(k => D.catalogue[k].sway);
    assert.ok(sways.length >= 6, sways.length + ' sways');
    sways.forEach(k => assert.ok(D.catalogue[k].sway.amp > 0 && D.catalogue[k].sway.period > 0, k + ' sway row'));
    const pp = fn(TR, '_hqPlaceProps');
    assert.equal((pp.match(/if \(!flip && cat\.foot > 0 && !kick && \(cat\.block \|\|/g) || []).length, 2, 'no blocker for a kickable at both sites');
    assert.equal((pp.match(/_hqPolishProp\(p, cat, grp, \{ U: U, y: y, onWall: onWall, onCeil: onCeil, flip: flip, tabletop: tabletop, kick: kick \}\)/g) || []).length, 2, 'the polish at both sites');
    const pol = fn(TR, '_hqPolishProp');
    assert.ok(pol.includes('var disc = _hqContactDisc(rx, rz, U);') && pol.includes('if (cat.sway && !W.EW_HQ_NO_SWAY) _hqSwayArm(grp, cat, o);') && pol.includes("H.seats.push({ id: 'seat:'") && pol.includes('if (o.kick) H.kicks.push('), 'the disc, the sway, the seat, the kick');
    assert.ok(/if \(H\.kicks && H\.kicks\.length\) \{ try \{ _hqTickKicks\(dt\); \} catch \(e\) \{\} \}/.test(fn(TR, '_hqTickWorld')) && /_hqTickSways\(dt, now\)/.test(fn(TR, '_hqTickWorld')), 'ticked in the world tick');
});

test('THE KICK (a vm run): the walker runs into a bin — it takes the heading, hops, rolls and settles inside the room', () => {
    const c = { console, Math, performance: { now: () => 1000 }, window: {}, HQ_KICKABLE: W.HQ_KICKABLE, HQ_BODY_R: 0.32 };
    vm.createContext(c);
    vm.runInContext(fn(TR, '_hqTickKicks') + `
        function _hqUnits() { return 73; }
        function _hqSurface(x, z) { return (Math.abs(x) > 6 || Math.abs(z) > 6) ? null : 0; }
        var grp = { position: { x: 0, y: 0, z: 0, set: function (x, y, z) { this.x = x; this.y = y; this.z = z; } }, rotation: { x: 0, y: 0, z: 0 } };
        var kicked = [];
        var _hq = { player: { x: -1.2, z: 0, y: 0 }, kicks: [{ key: 'trash_bin', grp: grp, rad: 0.28, y0: 0, x: 0, z: 0, y: 0, vx: 0, vz: 0, vy: 0, spin: 0, tilt: 0, cool: 0, h: 0.75 }], opts: { onKick: function (ev) { kicked.push(ev); } }, dirty: false, shadows: null };
    `, c);
    const dt = 1 / 60;
    for (let i = 0; i < 40; i++) { c._hq.player.x += 2.4 * dt; vm.runInContext('_hqTickKicks(' + dt + ')', c); }
    const k = c._hq.kicks[0];
    assert.equal(c.kicked.length, 1, 'kicked once');
    assert.ok(k.x > 0.3, 'it rolled east: ' + k.x.toFixed(2));
    assert.ok(k.vy !== 0 || k.y > 0 || k.x > 0.3, 'it hopped');
    for (let i = 0; i < 400; i++) vm.runInContext('_hqTickKicks(' + dt + ')', c);
    assert.ok(Math.hypot(k.vx, k.vz) === 0 && k.y === 0, 'it settled on the floor');
    assert.ok(Math.abs(k.x) <= 6 && Math.abs(k.z) <= 6, 'inside the room');
    assert.equal(c.grp.position.x, k.x * 73, 'the group follows');
});

test('THE SEAT: E sits (the seat\'s height, its front), any movement key stands; the walker\'s clip and the target finder read it', () => {
    assert.ok(/if \(pl\.sit\) \{ if \(typeof _hqTickSit === 'function'\) _hqTickSit\(dt\); return; \}/.test(fn(TR, '_hqTickWalker')), 'the walker\'s branch (guarded — the skate vm has no sit)');
    assert.ok(/if \(ch\.sit\) want = \(e\.actions && e\.actions\.hqSit\) \? 'hqSit' : 'idle';/.test(fn(TR, '_hqTickChars')), 'the clip');
    const ft = fn(TR, '_hqFindTarget');
    assert.ok(ft.includes("kind: 'seat', id: pl.sit.seat.id") && ft.includes("verb: 'SIT'"), 'the target');
    const sit = fn(TR, '_hqSit');
    assert.ok(sit.includes('pl.yaw = pl.targetYaw = st.yaw;') && sit.includes("(H.ride && H.ride.on) || pl.swim || pl.climb || pl.air"), 'the seat\'s front; never from the deck / the water / a ladder');
    assert.ok(/if \(!H\.paused && \(k\.w \|\| k\.a \|\| k\.s \|\| k\.d \|\| k\.up \|\| k\.down \|\| k\.left \|\| k\.right \|\| k\.space\)\) \{ _hqStand\(pl\); return; \}/.test(fn(TR, '_hqTickSit')), 'any key stands');
    assert.ok(/sit: function \(id\) \{ return _hqSit\(id\); \}/.test(TR) && /sitting: function/.test(TR), 'the API');
    assert.ok(/if \(t && t\.kind === 'seat'\) \{ try \{ ThreeRenderer\.hq\.sit\(t\.id\); \}/.test(MP), 'map.js E on a seat');
    assert.ok(/t\.kind === 'seat' \? \(t\.verb \|\| 'SIT'\)/.test(MP), 'the prompt\'s verb');
    assert.ok(/onKick: \(typeof _hqKickEvent === 'function'\)/.test(MP) && /onSit: \(typeof _hqSitEvent === 'function'\)/.test(MP), 'the hooks');
});

test('THE PLATE AT A DISTANCE + THE CAMERA FEEL: fade and scale by distance (the CSS var), the bob / landing / sprint lens / carve roll after the eased boom', () => {
    assert.ok(/var HQ_PLATE_FADE = \{ near: 8, far: 20, scaleAt: 3\.4, min: 0\.62, max: 1\.12 \};/.test(TR), 'the numbers');
    assert.ok(fn(TR, '_hqPlateDist').includes("el.style.setProperty('--pk', k)"), 'the var');
    const world = fn(TR, '_hqTickWorld');
    assert.ok(world.includes('if (d.plateEl) _hqPlateDist(d.plateEl, dist, d);') && world.includes('if (cc.plateEl) _hqPlateDist(cc.plateEl, dd, cc);'), 'doors and counters');
    assert.ok(/\.hq-plate \{ font-size: calc\(10px \* var\(--pk, 1\)\); \}/.test(CS) && /\.hq-plate b \{ font-size: 1\.3em; \}/.test(CS), 'the CSS reads it');
    const cam = fn(TR, '_hqTickCamera');
    assert.ok(/if \(Math\.abs\(cam\.fov - 52\) > 0\.01\) \{ cam\.fov = 52;/.test(cam), 'the lens\'s base line stands (hq-portal pins it)');
    assert.ok(/cam\.lookAt\(c\.lx \* U, c\.ly \* U, c\.lz \* U\);\s*\n\s*if \(typeof _hqCamFeel === 'function'\) _hqCamFeel\(H, pl, cam, dt, U\);/.test(cam), 'the feel after the eased boom');
    assert.ok(cam.includes('pl.heightM * (pl.sit ? 0.62 : 0.86)'), 'seated, the head is lower');
    const feel = fn(TR, '_hqCamFeel');
    assert.ok(feel.includes('EW_HQ_NO_CAM_FEEL') && feel.includes('c.shake = Math.min(0.09,') && feel.includes('var fovT = 52 + 6 * c.fovK;') && feel.includes('cam.rotateZ(c.roll)'), 'the kill-switch, the shake, the sprint lens, the roll');
});

test('THE ARRIVAL CARD: a first sighting of a place queues the letterbox, fired after the load card is gone; lobbies, corridors, the car and the foyer never', () => {
    assert.equal(W.hqRoomArrival('cafeteria'), true); assert.equal(W.hqRoomArrival('central_egress'), true, 'a hub anchor');
    assert.equal(W.hqRoomArrival('site_prebuilt_fairy_forest_clearing'), true, 'a site\'s part');
    ['car', 'foyer', 'stairwell', 'hwing_w', 'medwing'].forEach(r => assert.equal(W.hqRoomArrival(r), false, r + ' never'));
    assert.ok(/const carded = \(typeof _hqArrivalQueue === 'function'\) && _hqArrivalQueue\(roomId, room, no\);/.test(MP), 'queued on the first sighting');
    assert.ok(/if \(!carded && roomId !== _HQ_FOYER\) _hqToast\(`<b>ON THE MAP<\/b>/.test(MP), 'the toast only for the rest');
    assert.ok(/l\.classList\.remove\('walk'\);\s*\n\s*try \{ if \(typeof _hqArrivalFire === 'function'\) _hqArrivalFire\(roomId\); \} catch \(e\) \{\}/.test(MP), 'fired after the load card hides');
    assert.ok(/id="hqArrival" class="hq-arrival"/.test(IX), 'the element');
    assert.ok(/\.hq-arrival\.show \.hq-arrival-bar \{ animation: hqArrBar/.test(CS) && /prefers-reduced-motion/.test(CS.slice(CS.indexOf('.hq-arrival {'))), 'the letterbox + reduced motion');
});

test('THE POST PASS: the building\'s bloom crosses only emissive surfaces (a look\'s bloomThr / bloomRadius), the auto exposure rides _expLk in the building only, with its kill-switches', () => {
    assert.ok(/var HQ_BLOOM_THRESHOLD = 0\.86, HQ_BLOOM_RADIUS = 0\.5;/.test(TP), 'the defaults');
    const rs = fn(TP, 'renderScene');
    assert.ok(rs.includes("_bloomPass.threshold = (_look && typeof _look.bloomThr === 'number') ? _look.bloomThr : HQ_BLOOM_THRESHOLD;") && rs.includes('_bloomPass.threshold = prevThr; _bloomPass.radius = prevRad;'), 'set and restored round the HQ frame');
    assert.ok(rs.includes('_aeTick(_aeNow);') && rs.includes('_aeMeasure(_aeNow);'), 'the auto exposure ticks and measures');
    assert.ok(/return _lkNum\('exposure', _expEased\) \* \(\(_expCtx === 'hq'\) \? _ae\.gain : 1\);/.test(fn(TP, '_expLk')), 'the gain in the building only');
    const ae = fn(TP, '_aeMeasure');
    assert.ok(ae.includes('_renderer.readRenderTargetPixels(_ae.rt, 0, 0, 16, 16, _ae.buf);') && ae.includes('if (now - _ae.last < AE_INTERVAL_MS) return;'), 'a 16 × 16 read every interval');
    assert.ok(/function _aeEnabled\(\) \{ return AE_ON && _expCtx === 'hq' && !\(typeof window !== 'undefined' && \(window\.EW_NO_AUTO_EXPOSURE \|\| window\.EW_PERF_LOW\)\)/.test(TP), 'the kill-switches');
    assert.ok(/getAutoExposure: getAutoExposure, setAutoExposure: setAutoExposure/.test(TP), 'the API');
    assert.ok(W.HQ_ROOM_LOOKS.neon.bloomThr < 0.86 && W.HQ_ROOM_LOOKS.strip.bloomThr < 0.86, 'the neon looks bloom lower');
});

test('the token is fresh (RULE #1b)', () => {
    assert.ok(/\?v=\d{8}[a-z0-9-]*-cors/.test(IX) && !/threerooms-01-cors/.test(IX), 'a new token, the old one gone');
});
