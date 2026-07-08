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
        glowWidth:      18,
        segments:        12,
        jitter:          0.35,
        branchChance:    0.3,
        branchLength:    0.35,
        branchSegments:  5,
        branchDepth:     1,
        durationMs:      280,
        fadeStart:       0.5,
        flicker:         true,
        flickerRate:     0.06,
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

    function _buildBoltMesh(pathArray, width, color, opacity) {
        var line = new THREE.MeshLine();
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pathArray, 3));
        line.setGeometry(geo);

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
        opts = opts || {};

        var o = {};
        for (var k in DEFAULTS) o[k] = (opts[k] !== undefined) ? opts[k] : DEFAULTS[k];

        var fromV = new THREE.Vector3(from.x, from.y, from.z);
        var toV = new THREE.Vector3(to.x, to.y, to.z);

        var group = new THREE.Group();
        group.renderOrder = 999;

        var corePath = _buildJaggedPath(fromV, toV, o.segments, o.jitter);
        var core = _buildBoltMesh(corePath, o.coreWidth, o.color, 1.0);
        group.add(core.mesh);

        var glow = _buildBoltMesh(corePath, o.glowWidth, o.glowColor, 0.45);
        group.add(glow.mesh);

        var branches = [];
        if (o.branchChance > 0 && o.branchDepth > 0) {
            _addBranches(group, branches, corePath, o, 0);
        }

        _scene.add(group);

        var boltEntry = {
            group: group,
            core: core,
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
        return boltEntry;
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

            var bCore = _buildBoltMesh(bPath, o.coreWidth * 0.55, o.color, 0.85);
            var bGlow = _buildBoltMesh(bPath, o.glowWidth * 0.5, o.glowColor, 0.3);
            group.add(bCore.mesh);
            group.add(bGlow.mesh);
            branches.push({ core: bCore, glow: bGlow });
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
            b.glow.material.opacity = Math.min(1.0, opacity * 0.45);

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
    function _impactFlash(px, size) {
        if (!window.ThreeVFX || !window.ThreeVFX.isActive || !window.ThreeVFX.isActive()) return;
        window.ThreeVFX.spawn({
            x: px.x, y: px.y, z: px.z + 4,
            mode: 'billboard', sprite: 'flash',
            ml: 130,
            size0: size, size1: size * 0.25,
            opacity0: 1, opacity1: 0,
        });
        window.ThreeVFX.spawn({
            x: px.x, y: px.y, z: px.z + 4,
            mode: 'billboard', sprite: 'spark-elec',
            ml: 220,
            size0: size * 0.5, size1: size * 1.4,
            opacity0: 0.7, opacity1: 0,
        });
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
            _impactFlash(toPx, (opts && opts.impactFlashSize) || ts * 0.3);
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

        return boltVfx(
            { x: cx + skyOffX, y: cy + skyOffY, z: groundZ + skyHeight },
            { x: cx + _rn(-4, 4), y: cy + _rn(-4, 4), z: groundZ + 8 },
            opts
        );
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
        strikeFromSky:  strikeFromSky,
        chainBolt:      chainBolt,
        tick:           tick,
        clear:          clear,
        dispose:        dispose,
    };
})();

window.ThreeLightning = ThreeLightning;
