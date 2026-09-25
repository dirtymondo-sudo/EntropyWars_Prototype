/* BASIC ATTACK DELIVERY + THE LEAP (2026-09-14): the fist sprite is retired.
   A basic attack is a SHOT (gun / magic / bow / throw people) or a LEAP
   (everyone else, at any reach); a charge / dash / strike leap that changes
   level VAULTS on an arc instead of riding the floor up the cliff. Runs the
   production classifier + shot helper (battle.js) in a vm sandbox, then
   source-guards the renderer tweens, doAttack, the sibling strike sites and
   the online relay. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const battle = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');
const tr = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
const online = fs.readFileSync(path.join(__dirname, 'online.js'), 'utf8');

function between(src, a, b) {
    const i = src.indexOf(a);
    assert.ok(i >= 0, 'missing anchor ' + a);
    const j = src.indexOf(b, i);
    assert.ok(j > i, 'missing end anchor ' + b);
    return src.slice(i, j);
}

function makeCtx(opts) {
    opts = opts || {};
    const calls = { bolts: [], projs: [], leaps: [] };
    const ctx = {
        state: { phase: 'battle' },
        window: {
            ThreeAnim: { isActive: () => true },
            ThreeVFXEffects: { fireBoltDirect: (k, p) => calls.bolts.push({ k, p }) },
        },
        console,
        calls,
        getRace3DModel: (race) => opts.defs && opts.defs[race] ? opts.defs[race] : null,
        getEffectiveRange: (u) => u.range || 1,
        _getProjectileOverride: (u) => (opts.projOverride && opts.projOverride[u.race]) || null,
        playProjectileToUnit: (u, t, kind, ms, st, cls) => calls.projs.push({ kind, ms, cls }),
        animateStrikeLeap: (u, tx, ty, o) => calls.leaps.push({ tx, ty, o }),
        _skipVisuals: () => false,
        _unitAttacksWithClip: (u) => !!(opts.defs && opts.defs[u.race]),
    };
    vm.createContext(ctx);
    vm.runInContext(between(battle, '        const BASIC_ATTACK_JOB_KINDS = {', '        function triggerCastAnim('), ctx);
    return ctx;
}

const defs = {
    minotaur: { basicAttackKind: 'punch' },
    fairy: { basicAttackKind: 'magic' },
    cowboy: {},
    robinhood: { basicAttackKind: 'arrow' },
    quarterback: { basicAttackKind: 'throw' },
    priest: { basicAttackKind: 'magic' },
};

test('the kind: gun jobs first, then the authored def, then the mage jobs, the race table, the reach', () => {
    const ctx = makeCtx({ defs });
    const K = ctx.basicAttackKindOf;
    assert.equal(K({ race: 'minotaur', cls: 'Warrior' }), 'punch', 'the def');
    assert.equal(K({ race: 'minotaur', cls: 'Gunslinger', range: 2 }), 'ranged', 'a Gunslinger of any race shoots');
    assert.equal(K({ race: 'minotaur', cls: 'Psychic', range: 2 }), 'magic', 'a Psychic zaps');
    assert.equal(K({ race: 'fairy', cls: 'Warrior' }), 'magic', 'the def beats the job for non-gun jobs');
    assert.equal(K({ race: 'cowboy', cls: 'Raider' }), 'ranged', 'the race table (no def kind)');
    assert.equal(K({ race: 'ki fighter', cls: 'Black Mage' }), 'magic', 'a Black Mage with no def kind zaps');
    assert.equal(K({ race: 'nordic', cls: 'Warrior', range: 1 }), 'melee', 'reach 1, nothing else known');
    assert.equal(K({ race: 'nordic', cls: 'Warrior', range: 3 }), 'ranged', 'reach > 1, nothing else known');
    assert.equal(K(null), 'melee');
});

test('the delivery: shots carry a bolt / prop, leaps carry nothing', () => {
    const ctx = makeCtx({ defs, projOverride: { quarterback: 'proj-football' } });
    /* vm-realm objects are never reference-equal to ours — compare by value */
    const D = (u) => JSON.parse(JSON.stringify(ctx.basicAttackDelivery(u)));
    const gun = D({ race: 'cowboy', cls: 'Raider' });
    assert.deepEqual(gun, { mode: 'shot', kind: 'ranged', bolt: '_bolt_bullet', proj: 'proj-bullet' });
    const orb = D({ race: 'fairy', cls: 'Warrior', types: ['anomaly'] });
    assert.deepEqual(orb, { mode: 'shot', kind: 'magic', bolt: '_bolt_psi', proj: null });
    assert.equal(D({ race: 'priest', types: ['divine'] }).bolt, '_bolt_divine');
    assert.equal(D({ race: 'priest', types: ['nothing'] }).bolt, '_bolt_ki', 'an unknown type gets the ki orb');
    const arrow = D({ race: 'robinhood' });
    assert.deepEqual(arrow, { mode: 'shot', kind: 'arrow', bolt: '_bolt_arrow', proj: null });
    const ball = D({ race: 'quarterback' });
    assert.deepEqual(ball, { mode: 'shot', kind: 'throw', bolt: null, proj: 'proj-football' }, 'the football IS the shot');
    const leap = D({ race: 'minotaur', cls: 'Warrior', range: 3 });
    assert.deepEqual(leap, { mode: 'leap', kind: 'punch', bolt: null, proj: null }, 'a brawler leaps at any reach');
});

test('playBasicAttackShot: the bolt + the round for a gun, the orb alone for magic, the prop alone for a thrower', () => {
    const ctx = makeCtx({ defs, projOverride: { quarterback: 'proj-football' } });
    const me = { id: 1, x: 0, y: 0, z: 0, race: 'cowboy', cls: 'Raider' };
    const foe = { id: 2, x: 3, y: 0, z: 2 };
    ctx.playBasicAttackShot(me, foe, null, 400);
    assert.equal(ctx.calls.bolts.length, 1);
    assert.equal(ctx.calls.bolts[0].k, '_bolt_bullet');
    assert.equal(ctx.calls.bolts[0].p.toZ, 2, 'the bolt climbs to the victim\'s level');
    assert.equal(ctx.calls.bolts[0].p.headGlow, false, 'the round rides the bolt: its head glow is off');
    assert.equal(ctx.calls.projs.length, 1);
    assert.equal(ctx.calls.projs[0].cls, 'proj-bullet');

    ctx.calls.bolts.length = 0; ctx.calls.projs.length = 0;
    ctx.playBasicAttackShot({ id: 1, x: 0, y: 0, race: 'fairy', types: ['divine'] }, foe, null, 300);
    assert.equal(ctx.calls.bolts.length, 1);
    assert.equal(ctx.calls.bolts[0].k, '_bolt_divine');
    assert.equal(ctx.calls.projs.length, 0, 'an orb flies no sprite');

    ctx.calls.bolts.length = 0;
    ctx.playBasicAttackShot({ id: 1, x: 0, y: 0, race: 'quarterback' }, foe, null, 300);
    assert.equal(ctx.calls.bolts.length, 0);
    assert.equal(ctx.calls.projs[0].cls, 'proj-football');

    ctx.calls.bolts.length = 0; ctx.calls.projs.length = 0;
    ctx.state.phase = 'menu';
    ctx.playBasicAttackShot(me, foe, null, 300);
    assert.equal(ctx.calls.bolts.length + ctx.calls.projs.length, 0, 'never outside a battle');
});

test('_meleeStrikeAnim: a rigged model lunges short of the victim with the clip on arrival; a sprite jumps onto the tile', () => {
    const ctx = makeCtx({ defs });
    const rigged = { id: 1, x: 0, y: 0, race: 'minotaur' };
    const ms = ctx._meleeStrikeAnim(rigged, 2, 0, { strikeLeadMs: 300, targetId: 9 });
    assert.equal(ms, 370, '260 + 110 per tile beyond the first');
    const o = ctx.calls.leaps[0].o;
    assert.equal(o.clip, true);
    assert.equal(o.stopShort, 0.9, 'two tiles out: lands on the adjacent tile');
    assert.equal(o.holdMs, 560, 'holds for the clip\'s strike lead + follow-through');
    assert.equal(o.targetId, 9);
    ctx._meleeStrikeAnim(rigged, 1, 1, {});
    assert.equal(ctx.calls.leaps[1].o.stopShort, 0.45, 'adjacent: a half-tile lunge');
    const sprite = { id: 2, x: 0, y: 0, race: 'nordic' };
    ctx._meleeStrikeAnim(sprite, 1, 0, {});
    const so = ctx.calls.leaps[2].o;
    assert.equal(so.clip, false);
    assert.equal(so.stopShort, 0, 'a sprite keeps the classic jump onto the tile');
    assert.equal(so.holdMs, 70);
});

test('doAttack reads the delivery, never the distance, and the fist sprite is gone from basic attacks', () => {
    const da = between(battle, '        function doAttack(unit, x, y, z) {', '        function doInspect(unit, x, y) {');
    assert.ok(/const _delivery = basicAttackDelivery\(unit\)/.test(da), 'doAttack must ask the delivery');
    assert.ok(/const _isMeleeStrike = _delivery\.mode === 'leap' \|\| _clashLeap/.test(da), 'melee = a leap delivery (or the Clash gap-closer)');
    assert.ok(/impactDelay = projectileDelay \+ actionMs\(_leapMs\) \+ _meleeLead/.test(da), 'the impact lands after the leap arrives and the clip swings');
    assert.ok(/_meleeStrikeAnim\(unit, target\.x, target\.y, \{\s*clip: _clipStrike, strikeLeadMs: _meleeLead, leapMs: _leapMs, targetId: target\.id/.test(da), 'the melee branch leaps with the clip on arrival');
    assert.ok(/playBasicAttackShot\(unit, target, _delivery, cam\?\.travelMs/.test(da), 'the ranged branch fires the delivery');
    assert.ok(!/playProjectileToUnit\(unit, target, 'attack', cam\?\.travelMs/.test(da), 'the old fist-sprite projectile call must be gone');
    assert.ok(!/if \(_clipStrike\) triggerAttackAnim\(unit, target\.x, target\.y\);\s*else animateStrikeLeap/.test(da), 'the in-place clip branch is retired');
    /* the sibling strike sites */
    assert.ok(/if \(_isMeleeStrike\) _meleeStrikeAnim\(unit, _echoTarget\.x, _echoTarget\.y/.test(battle), 'the Echo Band re-strike leaps');
    assert.ok(/basicAttackDelivery\(_counterTarget\)\.mode === 'leap'\) _meleeStrikeAnim\(_counterTarget/.test(battle), 'the counter leaps');
    assert.ok(/basicAttackDelivery\(_fuAlly\)\.mode === 'leap'\) _meleeStrikeAnim\(_fuAlly/.test(battle), 'the follow-up leaps');
    assert.ok(/basicAttackDelivery\(guardian\)\.mode === 'leap'\) \{\s*_meleeStrikeAnim\(guardian/.test(battle), 'the Chivalry guardian leaps');
    assert.ok(/playBasicAttackShot\(guardian, mover, null, _impactDelay\)/.test(battle), 'the guardian\'s shot is the delivery');
    /* one kind for the clip and the delivery */
    assert.ok(/function _attackAnimKindFor\(unit, tx, ty, kindOverride\) \{\s*if \(kindOverride\) return kindOverride;[^}]*return basicAttackKindOf\(unit\);/.test(battle), '_attackAnimKindFor must read basicAttackKindOf');
    assert.ok(/window\.playBasicAttackShot = playBasicAttackShot;/.test(battle) && /window\.basicAttackDelivery = basicAttackDelivery;/.test(battle));
});

test('the charge spells vault in (leap: true rides animateDisplacement to the renderer)', () => {
    const run = between(battle, '        function _runChargeToTargetSpell(', '        // TERRAIN × SPELL REACTIONS');
    assert.ok(/animateDisplacement\(unit, fromX, fromY, landTile\.x, landTile\.y, chargeMs, \{ leap: true, charge: true \}\)/.test(run), 'the chase-cam charge vaults (and sprints on RunFast)');
    assert.ok(/charges to \$\{coordLabel\(landTile\.x, landTile\.y\)\}\.`\);\s*animateDisplacement\(unit, fromX, fromY, landTile\.x, landTile\.y, 200, \{ leap: true \}\)/.test(battle), 'the post-effect hop vaults');
    const ad = between(battle, '        function animateDisplacement(unit, fromX, fromY, toX, toY, durationMs, opts) {', '        function animateDisplacementPath(');
    assert.ok(/leap: \(opts && opts\.leap !== undefined\) \? opts\.leap : undefined/.test(ad), 'animateDisplacement forwards opts.leap');
    assert.ok(/if \(opts && opts\.clip && !opts\.onImpact && !_skipVisuals\(\)\)/.test(battle), 'animateStrikeLeap builds the on-arrival clip from the relayable flag');
});

test('renderer: the displace tween leaps a level change (or on request), hops a stepped polyline, plays the jump clip in the air', () => {
    const sd = between(tr, '    function startDisplaceTween(', '    function _updateDisplaceTweens(');
    assert.ok(/var _dpWantLeap = \(opts && opts\.leap === true\);/.test(sd));
    assert.ok(/var _dpNoLeap = \(opts && opts\.leap === false\);/.test(sd), 'knockbacks may opt out');
    assert.ok(/if \(_dpWantLeap \|\| Math\.abs\(_dpRise\) >= _dpLevel \* 0\.5\)/.test(sd), 'a half-level rise triggers the vault');
    assert.ok(/_dpPeak = Math\.max\(_dpPeak, Math\.max\(_dpRise, 0\) \/ 2 \+ ts \* 0\.34\)/.test(sd), 'the apex clears the higher surface');
    assert.ok(/leap: _dpLeap, hops: _dpHops, _air: false/.test(sd));
    /* the engine has already moved the unit: the origin level must not borrow the destination's */
    assert.ok(/var _dpMoved = \(unit\.x === toX && unit\.y === toY\);/.test(sd));
    assert.ok(/fromZ = _dpG\.nearestWalkableZ\(fromX, fromY, unit\.z \|\| 0\);/.test(sd), 'the origin level is the FROM tile\'s walkable surface');
    assert.ok(/var toZ = \(_dpMoved && unit\.z != null\) \? unit\.z/.test(sd), 'the destination level is the unit\'s own once it stands there');
    const ud = between(tr, '    function _updateDisplaceTweens(', '    function startJumpTween(');
    assert.ok(/wy = fromSY \+ \(toSY - fromSY\) \* _lpU \+ tw\.leap\.peak \* 4 \* _lpU \* \(1 - _lpU\);/.test(ud), 'the vault is a parabola from surface to surface');
    assert.ok(/if \(ease <= _lpAt\) \{\s*wy = fromSY;/.test(ud), 'the run before the vault stays on the FROM surface');
    assert.ok(/wy \+= _hopPeak \* 4 \* _plF \* \(1 - _plF\);/.test(ud), 'a stepped waypoint segment hops');
    assert.ok(/if \(\(tw\.leap \|\| tw\.hops\) && ue && ue\.model\) ue\._ew_landAt = _animNow\(\);/.test(ud), 'the landing squash');
    assert.ok(/else if \(_displaceTweens\.has\(uid\) && _displaceTweens\.get\(uid\)\._air\) want = 'jump';/.test(tr), 'the clip picker plays jump in the air');
    assert.ok(/else if \(_strikeTweens\.has\(uid\) && _strikeTweens\.get\(uid\)\._phase !== 1\) want = 'jump';/.test(tr), 'a strike leap in flight is a jump');
    assert.ok(/else if \(_strikeTweens\.has\(uid\)\) want = 'idle';/.test(tr), 'the hold beside the victim idles under the attack one-shot');
});

test('renderer: the strike leap lands short of the victim on the victim\'s own surface, arc clearing the higher end', () => {
    const ss = between(tr, '    function startStrikeLeapTween(', '    function _updateStrikeTweens(');
    assert.ok(/var _slTarget = \(opts\.targetId != null\) \? _findUnit\(opts\.targetId\) : null;/.test(ss));
    assert.ok(/toSY = unitSurfaceY\(_slTarget\)/.test(ss), 'a flyer / roof victim sets the landing height');
    assert.ok(/arcPeak = Math\.max\(arcPeak, Math\.abs\(_slRise\) \* 0\.35 \+ ts \* 0\.3, Math\.max\(_slRise, 0\) \/ 2 \+ ts \* 0\.34\);/.test(ss));
    assert.ok(/var stopShort = opts\.stopShort > 0 \? opts\.stopShort : 0;/.test(ss));
    assert.ok(/landX = tx - \(_slDx \/ _slLen\) \* _slBack;/.test(ss), 'the landing is pulled back along the line');
    assert.ok(/toX: landX, toY: landY, toSY: toSY,\s*tileX: tx, tileY: ty,/.test(ss));
    const us = between(tr, '    function _updateStrikeTweens(', '    var _throwTweens = new Map();');
    assert.ok(/tw\._phase = phase;/.test(us));
    assert.ok(/_spawnGroundPuff\(Math\.round\(tw\.toX\), Math\.round\(tw\.toY\), 6/.test(us), 'the puff lands on a whole tile');
    assert.ok(/if \(ue && ue\.model\) \{ ue\.model\.scale\.set\(1, 1, 1\); ue\._ew_landAt = _animNow\(\); \}/.test(us), 'the return lands with the squash');
});

test('online (RULE #2): the strike leap relays its shape and the shot relays as basic-shot; the guest replays both fog-gated', () => {
    assert.ok(/type: 'strike-leap',\s*unitId: unit\.id,\s*tx: tx, ty: ty,\s*opts: \{/.test(online), 'the leap opts ride the relay');
    assert.ok(/stopShort: _lo\.stopShort \|\| 0,/.test(online) && /clip: !!_lo\.clip/.test(online));
    assert.ok(/const _origPlayBasicAttackShot = playBasicAttackShot;/.test(online), 'playBasicAttackShot is wrapped');
    assert.ok(/type: 'basic-shot',\s*unitId: unit\.id, targetId: target\.id,\s*kind: dv \? dv\.kind : null, bolt: dv \? dv\.bolt : null, proj: dv \? dv\.proj : null,/.test(online));
    assert.ok(/data\.type === 'basic-shot' && _ewMirrorView\(\)/.test(online), 'the guest handler');
    assert.ok(/_bsShow = _bfog \? \(_bfog\(_bsU\.x, _bsU\.y\) \|\| _bfog\(_bsT\.x, _bsT\.y\)\) : true;/.test(online), 'fog-gated on either end');
    assert.ok(/window\.playBasicAttackShot\(_bsU, _bsT,\s*\{ mode: 'shot', kind: data\.kind, bolt: data\.bolt \|\| null, proj: data\.proj \|\| null \}/.test(online));
    assert.ok(/window\.animateStrikeLeap\(leapUnit, data\.tx, data\.ty, _lopts\);/.test(online), 'the guest leap goes through the unwrapped battle fn so the clip flag builds its callback');
    assert.ok(/if \(data\.opts\.clip\) _lopts\.clip = true;/.test(online));
});
