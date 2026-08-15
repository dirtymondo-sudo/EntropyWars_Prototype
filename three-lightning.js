const ThreeLightning = (function () {
    'use strict';

    var _scene = null;
    var _initialized = false;
    var _activeBolts = [];

    function _unitSurfaceZ(tx, ty) {
        if (typeof state === 'undefined' || typeof window._getElevationPx !== 'function') return 0;
        var ix = Math.round(tx), iy = Math.round(ty);
        var baseH = (state.boardHeights && state.boardHeights[iy]) ? state.boardHeights[iy][ix] : 0;
        if (baseH == null && typeof getHeightAt === 'function') baseH = getHeightAt(ix, iy);
        baseH = baseH || 0;
        var terrainZ = baseH !== 0 ? window._getElevationPx(baseH) : 0;

        if (typeof getObjectAt === 'function') {
            var obj = getObjectAt(ix, iy);
            if (obj && typeof OBJECT_RULES !== 'undefined' && OBJECT_RULES[obj] && OBJECT_RULES[obj].roofWalkable) {
                var oSpr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[obj] : null;
                if (oSpr && oSpr._roofZPx > 0) terrainZ += oSpr._roofZPx;
            }
        }

        if (Array.isArray(state.units)) {
            for (var i = 0; i < state.units.length; i++) {
                var c = state.units[i];
                if (c.dead || c._dying) continue;
                if (c.x === ix && c.y === iy) {
                    if (c.z != null) {
                        var groundH = (typeof getHeightAt === 'function') ? (getHeightAt(ix, iy) || 0) : baseH;
                        if (c.z > groundH) return window._getElevationPx(c.z);
                    }
                    break;
                }
                if (c._isBoss && c._bossSize === 2 &&
                    (ix === c.x || ix === c.x + 1) && (iy === c.y || iy === c.y + 1)) {
                    if (c.z != null) {
                        var groundH2 = (typeof getHeightAt === 'function') ? (getHeightAt(ix, iy) || 0) : baseH;
                        if (c.z > groundH2) return window._getElevationPx(c.z);
                    }
                    break;
                }
            }
        }
        return terrainZ;
    }

    var DEFAULTS = {
        color:          0xf2f8ff,   /* whiter-hot core; the blue lives in the glow */
        glowColor:      0x4488ff,
        coreWidth:      6,
        glowWidth:      22,
        segments:        14,
        jitter:          0.35,
        branchChance:    0.42,
        branchLength:    0.38,
        branchSegments:  6,
        branchDepth:     2,      /* recursive forks — real lightning branches its branches */
        durationMs:      280,
        fadeStart:       0.5,
        flicker:         true,
        flickerRate:     0.06,
        strikes:         1,      /* >1 = re-strikes: fresh jagged paths in quick succession */
        strikeGapMs:     70,
        taper:           true,   /* thin toward the strike point (MeshLine widthCallback) */
        ambient:         false,  /* cosmetic idle-ambience bolt: its VFX sprites spawn as
                                    _zone particles so ThreeVFX.hasActiveParticles() (the
                                    HUD's boardBusy gate) ignores them — otherwise every
                                    background storm flicker hides the action menu */
    };

    var _tmpV = null;
    var _tmpDir = null;
    var _tmpPerp1 = null;
    var _tmpPerp2 = null;

    function init(scene) {
        if (!scene) {
            console.warn('[ThreeLightning] no scene provided');
            return;
        }
        /* MeshLine lib exports to window.MeshLine / window.MeshLineMaterial,
           NOT onto the THREE namespace. Bridge them so the rest of this file
           can use THREE.MeshLine / THREE.MeshLineMaterial consistently.       */
        if (!THREE.MeshLine && typeof MeshLine !== 'undefined')
            THREE.MeshLine = MeshLine;
        if (!THREE.MeshLineMaterial && typeof MeshLineMaterial !== 'undefined')
            THREE.MeshLineMaterial = MeshLineMaterial;

        if (!THREE.MeshLine || !THREE.MeshLineMaterial) {
            console.warn('[ThreeLightning] THREE.MeshLine not loaded — lightning bolts disabled');
            return;
        }
        _scene = scene;
        _tmpV = new THREE.Vector3();
        _tmpDir = new THREE.Vector3();
        _tmpPerp1 = new THREE.Vector3();
        _tmpPerp2 = new THREE.Vector3();
        _initialized = true;
        console.log('[ThreeLightning] initialized');
    }

    function _rn(a, b) { return a + Math.random() * (b - a); }

    function _buildJaggedPath(from, to, segments, jitter) {
        var pts = [];
        _tmpDir.copy(to).sub(from);
        var len = _tmpDir.length();
        _tmpDir.normalize();

        if (Math.abs(_tmpDir.y) < 0.99) {
            _tmpPerp1.crossVectors(_tmpDir, new THREE.Vector3(0, 1, 0)).normalize();
        } else {
            _tmpPerp1.crossVectors(_tmpDir, new THREE.Vector3(1, 0, 0)).normalize();
        }
        _tmpPerp2.crossVectors(_tmpDir, _tmpPerp1).normalize();

        var maxOffset = len * jitter;

        pts.push(from.x, from.y, from.z);

        for (var i = 1; i < segments; i++) {
            var t = i / segments;

            var bx = from.x + _tmpDir.x * len * t;
            var by = from.y + _tmpDir.y * len * t;
            var bz = from.z + _tmpDir.z * len * t;

            var envelope = Math.sin(t * Math.PI);
            var off1 = _rn(-maxOffset, maxOffset) * envelope;
            var off2 = _rn(-maxOffset, maxOffset) * envelope;

            bx += _tmpPerp1.x * off1 + _tmpPerp2.x * off2;
            by += _tmpPerp1.y * off1 + _tmpPerp2.y * off2;
            bz += _tmpPerp1.z * off1 + _tmpPerp2.z * off2;

            pts.push(bx, by, bz);
        }

        pts.push(to.x, to.y, to.z);

        return new Float32Array(pts);
    }

    /* width taper along the path: fat at the origin, thinning toward the
       strike point, with a subtle mid-bulge so it doesn't read as a cone */
    function _taperMain(p) { return 1.0 - 0.55 * p + 0.12 * Math.sin(p * Math.PI); }
    function _taperBranch(p) { return 1.0 - 0.75 * p; }

    function _buildBoltMesh(pathArray, width, color, opacity, taperFn) {
        var line = new THREE.MeshLine();
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pathArray, 3));
        line.setGeometry(geo, taperFn || null);

        var mat = new THREE.MeshLineMaterial({
            color: new THREE.Color(color),
            lineWidth: width,
            transparent: true,
            opacity: opacity,
            depthWrite: false,
            depthTest: true,
            blending: THREE.AdditiveBlending,
            resolution: new THREE.Vector2(
                window.innerWidth || 1280,
                window.innerHeight || 720
            ),
            sizeAttenuation: 1,
        });

        var mesh = new THREE.Mesh(line, mat);
        mesh.frustumCulled = false;
        mesh.renderOrder = 999;
        return { mesh: mesh, material: mat, lineObj: line };
    }

    function bolt(from, to, opts) {
        if (!_initialized || !_scene) return null;
        if (typeof state !== 'undefined' && state && state.devAutoSim) return null;
        opts = opts || {};

        var o = {};
        for (var k in DEFAULTS) o[k] = (opts[k] !== undefined) ? opts[k] : DEFAULTS[k];

        var fromV = new THREE.Vector3(from.x, from.y, from.z);
        var toV = new THREE.Vector3(to.x, to.y, to.z);

        var group = new THREE.Group();
        group.renderOrder = 999;

        var taper = o.taper ? _taperMain : null;
        var corePath = _buildJaggedPath(fromV, toV, o.segments, o.jitter);
        /* three stacked strokes: wide cool glow → warm mid sheath → white-hot
           core. The mid layer is what was missing — two-layer bolts read as
           an outline, three read as a filament inside plasma. */
        var glow = _buildBoltMesh(corePath, o.glowWidth, o.glowColor, 0.4, taper);
        group.add(glow.mesh);
        var mid = _buildBoltMesh(corePath, o.coreWidth * 2.1, o.glowColor, 0.6, taper);
        group.add(mid.mesh);
        var core = _buildBoltMesh(corePath, o.coreWidth, o.color, 1.0, taper);
        group.add(core.mesh);

        var branches = [];
        if (o.branchChance > 0 && o.branchDepth > 0) {
            _addBranches(group, branches, corePath, o, 0);
        }

        _scene.add(group);

        var boltEntry = {
            group: group,
            core: core,
            mid: mid,
            glow: glow,
            branches: branches,
            startTime: performance.now(),
            durationMs: o.durationMs,
            fadeStart: o.fadeStart,
            flicker: o.flicker,
            flickerRate: o.flickerRate,
            _lastFlicker: 0,
            _flickerOn: true,
            opts: o,
        };
        _activeBolts.push(boltEntry);

        /* RE-STRIKES: real lightning almost never lands once. Each restrike
           is a NEW jagged path down the same channel — dimmer, thinner,
           shorter-lived — a beat apart. Reads as the FFXVI multi-hit. */
        if (o.strikes > 1) {
            var nextOpts = {};
            for (var nk in o) nextOpts[nk] = o[nk];
            nextOpts.strikes = o.strikes - 1;
            nextOpts.coreWidth = o.coreWidth * 0.8;
            nextOpts.glowWidth = o.glowWidth * 0.8;
            nextOpts.durationMs = Math.max(140, o.durationMs * 0.8);
            window.setTimeout(function () {
                if (!_initialized || !_scene) return;
                bolt(from, to, nextOpts);
            }, o.strikeGapMs);
        }
        return boltEntry;
    }

    /* GROUND CRAWL — short arcs skittering outward along the floor from the
       strike point (vfx-space px). The detail that sells voltage DUMPING
       into the earth rather than a sprite touching it. */
    function crawlVfx(atPx, opts) {
        opts = opts || {};
        var cfg = (typeof CONFIG !== 'undefined') ? CONFIG : { tileSize: 128, boardPadding: 2 };
        var ts = cfg.tileSize || 128;
        var n = opts.count != null ? opts.count : 4;
        for (var i = 0; i < n; i++) {
            var a = (i / n) * Math.PI * 2 + _rn(-0.4, 0.4);
            var len = ts * _rn(0.35, opts.reach != null ? opts.reach : 0.85);
            var from = { x: atPx.x, y: atPx.y, z: (atPx.z || 0) + 3 };
            var to = {
                x: atPx.x + Math.cos(a) * len,
                y: atPx.y + Math.sin(a) * len,
                z: (atPx.z || 0) + _rn(1, 5),
            };
            boltVfx(from, to, {
                segments: 6,
                jitter: 0.5,
                branchChance: 0.25,
                branchDepth: 1,
                branchSegments: 4,
                coreWidth: opts.coreWidth != null ? opts.coreWidth : 2.2,
                glowWidth: opts.glowWidth != null ? opts.glowWidth : 7,
                durationMs: _rn(150, 240),
                color: opts.color, glowColor: opts.glowColor,
                impactFlash: false,
                strikes: 1,
                ambient: !!opts.ambient,
            });
        }
    }

    function _addBranches(group, branches, parentPath, o, depth) {
        if (depth >= o.branchDepth) return;

        var numPts = parentPath.length / 3;

        for (var i = 2; i < numPts - 1; i++) {
            if (Math.random() > o.branchChance) continue;

            var ox = parentPath[i * 3];
            var oy = parentPath[i * 3 + 1];
            var oz = parentPath[i * 3 + 2];

            var prevX = parentPath[(i - 1) * 3];
            var prevY = parentPath[(i - 1) * 3 + 1];
            var prevZ = parentPath[(i - 1) * 3 + 2];

            var dx = ox - prevX;
            var dy = oy - prevY;
            var dz = oz - prevZ;
            var segLen = Math.sqrt(dx * dx + dy * dy + dz * dz);

            var endX = parentPath[(numPts - 1) * 3];
            var endY = parentPath[(numPts - 1) * 3 + 1];
            var endZ = parentPath[(numPts - 1) * 3 + 2];
            var remDx = endX - ox, remDy = endY - oy, remDz = endZ - oz;
            var remLen = Math.sqrt(remDx * remDx + remDy * remDy + remDz * remDz);

            var bLen = remLen * o.branchLength * _rn(0.5, 1.2);
            if (bLen < segLen * 2) continue;

            var bDir = new THREE.Vector3(
                dx + _rn(-segLen, segLen) * 1.2,
                dy + _rn(-segLen * 0.3, segLen * 0.3),
                dz + _rn(-segLen, segLen) * 1.2
            ).normalize().multiplyScalar(bLen);

            var bFrom = new THREE.Vector3(ox, oy, oz);
            var bTo = new THREE.Vector3(ox + bDir.x, oy + bDir.y, oz + bDir.z);

            var bPath = _buildJaggedPath(bFrom, bTo, o.branchSegments, o.jitter * 1.2);

            var wMul = Math.pow(0.55, depth + 1);
            var bCore = _buildBoltMesh(bPath, o.coreWidth * wMul, o.color, 0.85, _taperBranch);
            var bGlow = _buildBoltMesh(bPath, o.glowWidth * wMul * 0.9, o.glowColor, 0.3, _taperBranch);
            group.add(bCore.mesh);
            group.add(bGlow.mesh);
            branches.push({ core: bCore, glow: bGlow });

            /* recurse: branches fork again, thinner and shorter */
            if (depth + 1 < o.branchDepth) {
                var so = {};
                for (var sk in o) so[sk] = o[sk];
                so.branchChance = o.branchChance * 0.7;
                so.branchLength = o.branchLength * 0.8;
                _addBranches(group, branches, bPath, so, depth + 1);
            }
        }
    }

    function tick(dt) {
        if (!_initialized) return;
        var now = performance.now();
        var toRemove = [];

        for (var i = 0; i < _activeBolts.length; i++) {
            var b = _activeBolts[i];
            var elapsed = now - b.startTime;
            var t = elapsed / b.durationMs;

            if (t >= 1.0) {
                toRemove.push(i);
                continue;
            }

            var fadeT = (t > b.fadeStart)
                ? 1.0 - ((t - b.fadeStart) / (1.0 - b.fadeStart))
                : 1.0;

            var flickerMul = 1.0;
            if (b.flicker) {
                b._lastFlicker += dt;
                if (b._lastFlicker > b.flickerRate) {
                    b._lastFlicker = 0;
                    b._flickerOn = Math.random() > 0.2;
                }
                flickerMul = b._flickerOn ? 1.0 : 0.25;
            }

            var opacity = fadeT * flickerMul;

            b.core.material.opacity = Math.min(1.0, opacity * 1.0);
            if (b.mid) b.mid.material.opacity = Math.min(1.0, opacity * 0.6);
            /* glow decays SLOWER than the filament — the afterimage a real
               strike leaves on the eye */
            b.glow.material.opacity = Math.min(1.0, Math.pow(fadeT, 0.6) * flickerMul * 0.42);

            for (var j = 0; j < b.branches.length; j++) {
                b.branches[j].core.material.opacity = Math.min(1.0, opacity * 0.85);
                b.branches[j].glow.material.opacity = Math.min(1.0, opacity * 0.3);
            }
        }

        for (var r = toRemove.length - 1; r >= 0; r--) {
            _removeBolt(toRemove[r]);
        }
    }

    function _removeBolt(idx) {
        var b = _activeBolts[idx];
        if (!b) return;

        if (b.group) {
            b.group.traverse(function (child) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            if (_scene) _scene.remove(b.group);
        }

        _activeBolts.splice(idx, 1);
    }

    function clear() {
        for (var i = _activeBolts.length - 1; i >= 0; i--) {
            _removeBolt(i);
        }
    }

    function dispose() {
        clear();
        _scene = null;
        _initialized = false;
    }

    /* Brief bright flash + expanding glow at the strike point. Rendered via
       the shared ThreeVFX sprite pool (additive 'flash'/'spark-elec', so it
       catches the bloom pass). px is in vfx space (x/y tile-px, z up) — the
       same space boltVfx receives. Subtle: two short-lived sprites. */
    function _impactFlash(px, size, ambient) {
        if (!window.ThreeVFX || !window.ThreeVFX.isActive || !window.ThreeVFX.isActive()) return;
        window.ThreeVFX.spawn({
            x: px.x, y: px.y, z: px.z + 4,
            mode: 'billboard', sprite: 'flash',
            ml: 130,
            size0: size, size1: size * 0.25,
            opacity0: 1, opacity1: 0,
            _zone: !!ambient,
        });
        window.ThreeVFX.spawn({
            x: px.x, y: px.y, z: px.z + 4,
            mode: 'billboard', sprite: 'spark-elec',
            ml: 220,
            size0: size * 0.5, size1: size * 1.4,
            opacity0: 0.7, opacity1: 0,
            _zone: !!ambient,
        });
        /* hot electric flecks thrown off the strike point */
        for (var i = 0; i < 7; i++) {
            var a = Math.random() * 6.2832, sp = 90 + Math.random() * 240;
            window.ThreeVFX.spawn({
                x: px.x, y: px.y, z: px.z + 4,
                vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: 40 + Math.random() * 190,
                mode: 'billboard', sprite: 'spark-elec',
                ml: 160 + Math.random() * 240,
                size0: 3 + Math.random() * 5, size1: 1,
                opacity0: 1, opacity1: 0,
                gravity: 420, drag: 1.4,
                _zone: !!ambient,
            });
        }
    }

    function boltVfx(fromPx, toPx, opts) {
        var SLAB_OFFSET = 3;
        var cfg = (typeof CONFIG !== 'undefined') ? CONFIG : { boardPadding: 2 };
        var pad = cfg.boardPadding || 2;
        var from = {
            x: fromPx.x - pad,
            y: fromPx.z + SLAB_OFFSET,
            z: fromPx.y - pad,
        };
        var to = {
            x: toPx.x - pad,
            y: toPx.z + SLAB_OFFSET,
            z: toPx.y - pad,
        };
        var entry = bolt(from, to, opts);
        if (entry && !(opts && opts.impactFlash === false)) {
            var ts = (typeof CONFIG !== 'undefined' && CONFIG.tileSize) ? CONFIG.tileSize : 128;
            _impactFlash(toPx, (opts && opts.impactFlashSize) || ts * 0.3, !!(opts && opts.ambient));
        }
        return entry;
    }

    function strikeFromSky(tx, ty, opts) {
        opts = opts || {};
        var cfg = (typeof CONFIG !== 'undefined') ? CONFIG : { tileSize: 128, tileGap: 0, boardPadding: 2 };
        var ts = cfg.tileSize || 128;
        var gap = cfg.tileGap || 0;
        var pad = cfg.boardPadding || 2;
        var cx = pad + tx * (ts + gap) + ts / 2;
        var cy = pad + ty * (ts + gap) + ts / 2;

        var groundZ = _unitSurfaceZ(tx, ty);

        var skyHeight = opts.skyHeight || 600;

        var skyOffX = _rn(-ts * 0.3, ts * 0.3);
        var skyOffY = _rn(-ts * 0.3, ts * 0.3);

        if (opts.impactFlashSize == null) opts.impactFlashSize = ts * 0.55;
        /* sky strikes default to the full treatment: double-tap restrike +
           voltage crawling out along the ground */
        if (opts.strikes == null) opts.strikes = 2;

        var impactPx = { x: cx + _rn(-4, 4), y: cy + _rn(-4, 4), z: groundZ + 8 };

        /* sheet-lightning flash up in the cloud layer — the sky answers */
        if (window.ThreeVFX && window.ThreeVFX.isActive && window.ThreeVFX.isActive()
            && opts.skyFlash !== false) {
            window.ThreeVFX.spawn({
                x: cx + skyOffX, y: cy + skyOffY, z: groundZ + skyHeight * 0.92,
                mode: 'billboard', sprite: 'flash', tint: 0x9cc8ff,
                ml: 200, size0: ts * 2.6, size1: ts * 3.4,
                opacity0: 0.55, opacity1: 0,
                _zone: !!opts.ambient,
            });
        }

        var entry = boltVfx(
            { x: cx + skyOffX, y: cy + skyOffY, z: groundZ + skyHeight },
            impactPx,
            opts
        );
        if (entry && opts.crawl !== false) {
            crawlVfx({ x: impactPx.x, y: impactPx.y, z: groundZ }, {
                count: opts.crawlCount != null ? opts.crawlCount : 4,
                color: opts.color, glowColor: opts.glowColor,
                ambient: !!opts.ambient,
            });
        }
        return entry;
    }

    function chainBolt(fromTx, fromTy, toTx, toTy, opts) {
        opts = opts || {};
        var cfg = (typeof CONFIG !== 'undefined') ? CONFIG : { tileSize: 128, tileGap: 0, boardPadding: 2 };
        var ts = cfg.tileSize || 128;
        var gap = cfg.tileGap || 0;
        var pad = cfg.boardPadding || 2;

        function tileCenterPx(ttx, tty) {
            return {
                x: pad + ttx * (ts + gap) + ts / 2,
                y: pad + tty * (ts + gap) + ts / 2
            };
        }

        var fromC = tileCenterPx(fromTx, fromTy);
        var toC = tileCenterPx(toTx, toTy);

        var fromZ = _unitSurfaceZ(fromTx, fromTy);
        var toZ = _unitSurfaceZ(toTx, toTy);

        var torsoBoost = ts * 0.45; /* same torso anchor as ThreeVFXEffects.unitZBoost */

        return boltVfx(
            { x: fromC.x, y: fromC.y, z: fromZ + torsoBoost },
            { x: toC.x,   y: toC.y,   z: toZ + torsoBoost },
            Object.assign({
                segments: 8,
                jitter: 0.25,
                branchChance: 0.2,
                branchDepth: 1,
                coreWidth: 4,
                glowWidth: 12,
                durationMs: 220,
                impactFlashSize: ts * 0.22,
            }, opts)
        );
    }

    return {
        init:           init,
        bolt:           bolt,
        boltVfx:        boltVfx,
        crawlVfx:       crawlVfx,
        strikeFromSky:  strikeFromSky,
        chainBolt:      chainBolt,
        tick:           tick,
        clear:          clear,
        dispose:        dispose,
    };
})();

window.ThreeLightning = ThreeLightning;
